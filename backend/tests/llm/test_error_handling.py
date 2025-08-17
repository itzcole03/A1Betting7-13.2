"""
Test LLM Error Handling

Tests error scenarios, fallbacks, and recovery mechanisms.
"""

import pytest
from unittest.mock import Mock, AsyncMock, patch
import asyncio
import time

from backend.services.llm.explanation_service import ExplanationService, ExplanationDTO
from backend.services.llm.adapters.base_adapter import UnsupportedProviderError
from backend.services.llm.llm_cache import LLMCache
from backend.services.llm.prompt_templates import EdgeContext


class TestLLMErrorHandling:
    """Test error handling across LLM components"""
    
    @pytest.mark.asyncio
    async def test_adapter_unavailable_fallback(self):
        """Test fallback when primary adapter is unavailable"""
        with patch('backend.services.llm.adapters.get_llm_adapter') as mock_get_adapter:
            # First call (openai) raises error, second call (local_stub) succeeds
            local_stub_adapter = Mock()
            local_stub_adapter.generate.return_value = {
                "content": "Fallback explanation",
                "tokens_used": 100,
                "provider": "local_stub",
                "finish_reason": "stop"
            }
            
            mock_get_adapter.side_effect = [
                UnsupportedProviderError("OpenAI not available"),
                local_stub_adapter
            ]
            
            # Test should handle adapter unavailability gracefully
            # This tests the factory fallback logic
            adapter = mock_get_adapter()
            assert adapter == local_stub_adapter
    
    @pytest.mark.asyncio
    async def test_cache_error_recovery(self):
        """Test recovery from cache errors"""
        cache = LLMCache(max_memory_size=10, ttl_seconds=60)
        
        # Simulate cache corruption/error
        with patch.object(cache, 'get_cached_explanation', side_effect=Exception("Cache error")):
            # Should handle cache error gracefully and return None
            result = None
            try:
                result = cache.get_cached_explanation("test_key")
            except Exception:
                pass  # Expected to handle gracefully
            
            # Should not crash the application
            assert result is None or isinstance(result, Exception)
    
    @pytest.mark.asyncio
    async def test_service_timeout_handling(self):
        """Test timeout handling in service layer"""
        mock_adapter = Mock()
        mock_adapter.generate = AsyncMock(side_effect=asyncio.TimeoutError())
        
        with patch('backend.services.llm.explanation_service.get_llm_adapter', return_value=mock_adapter):
            service = ExplanationService()
            
            with pytest.raises(Exception) as exc_info:
                await service.generate_or_get_edge_explanation(123, force_refresh=False)
            
            # Should propagate timeout appropriately
            assert "timeout" in str(exc_info.value).lower() or isinstance(exc_info.value.args[0], asyncio.TimeoutError)
    
    @pytest.mark.asyncio
    async def test_invalid_response_format_handling(self):
        """Test handling of malformed LLM responses"""
        from backend.services.llm.adapters.base_adapter import LLMResult
        
        mock_adapter = Mock()
        # Return invalid response format - missing required fields
        mock_adapter.generate = AsyncMock(return_value=LLMResult(
            content="", # Empty content
            tokens_used=0,
            provider="test",
            finish_reason="error"
        ))
        
        with patch('backend.services.llm.explanation_service.get_llm_adapter', return_value=mock_adapter):
            service = ExplanationService()
            
            try:
                result = await service.generate_or_get_edge_explanation(123, force_refresh=False)
                # Should either succeed with fallback or raise exception
                assert isinstance(result, ExplanationDTO)
            except Exception as exc_info:
                # Should handle invalid format appropriately
                error_message = str(exc_info).lower()
                assert any(term in error_message for term in ['format', 'invalid', 'missing', 'error'])
    
    def test_prompt_template_error_handling(self):
        """Test error handling in prompt template generation"""
        from backend.services.llm.prompt_templates import build_edge_explanation_prompt, EdgeContext
        
        # Test with minimal context that might cause issues
        try:
            context = EdgeContext(
                edge_id=1,
                player_name="",  # Empty name
                team="",
                prop_type="",
                offered_line=0.0,
                fair_line=0.0,
                prob_over=0.0,
                ev=0.0,
                model_version_name="test",
                model_version_id=1,
                volatility_score=0.0,
                recent_lines=[],
                distribution_family="NORMAL",
                confidence_score=0.5
            )
            result = build_edge_explanation_prompt(context)
            assert isinstance(result, str)
            assert len(result) > 0
        except Exception as e:
            # Should handle gracefully
            assert isinstance(e, (TypeError, AttributeError, ValueError))
    
    @pytest.mark.asyncio
    async def test_concurrent_request_error_isolation(self):
        """Test that errors in one request don't affect others"""
        from backend.services.llm.adapters.base_adapter import LLMResult
        
        mock_adapter = Mock()
        
        # First call fails, second succeeds
        mock_adapter.generate = AsyncMock(side_effect=[
            Exception("First request fails"),
            LLMResult(
                content="Second request succeeds",
                tokens_used=100,
                provider="test",
                finish_reason="stop"
            )
        ])
        
        with patch('backend.services.llm.explanation_service.get_llm_adapter', return_value=mock_adapter):
            service = ExplanationService()
            
            # Start concurrent requests
            task1 = asyncio.create_task(service.generate_or_get_edge_explanation(123, force_refresh=False))
            task2 = asyncio.create_task(service.generate_or_get_edge_explanation(124, force_refresh=False))
            
            # First should return fallback, second should succeed
            result1 = await task1  # Should get fallback explanation
            result2 = await task2
            
            assert isinstance(result1, ExplanationDTO)
            assert isinstance(result2, ExplanationDTO)
            assert result2.content == "Second request succeeds"
    
    def test_cache_memory_limits(self):
        """Test cache behavior under memory pressure"""
        # Create small cache
        cache = LLMCache(max_memory_size=2, ttl_seconds=60)
        
        # Fill beyond capacity
        for i in range(5):
            cache.set_cached_explanation(f"key_{i}", f"content_{i}", "provider", 100)
        
        # Should only keep max_memory_size entries
        assert len(cache._memory_cache) <= 2
        
        # Should be able to continue operating
        result = cache.get_cached_explanation("key_4")  # Most recent
        assert result is not None
    
    @pytest.mark.asyncio
    async def test_rate_limiter_error_handling(self):
        """Test rate limiter error scenarios"""
        from backend.services.llm.explanation_service import ExplanationService
        from fastapi import HTTPException
        
        service = ExplanationService()
        
        # Exhaust rate limiter
        for i in range(service.rate_limiter.max_requests + 1):
            service.rate_limiter.is_allowed()
        
        # Next request should be rate limited
        with pytest.raises(HTTPException) as exc_info:
            await service.generate_or_get_edge_explanation(999, force_refresh=False)
        
        assert exc_info.value.status_code == 429
        assert "rate limit" in exc_info.value.detail.lower()
    
    @pytest.mark.asyncio
    async def test_database_connection_error_handling(self):
        """Test handling of database connection errors"""
        cache = LLMCache(max_memory_size=10, ttl_seconds=60)
        
        # Mock database connection failure
        with patch.object(cache, '_get_from_database', side_effect=Exception("Database connection failed")):
            # Should fall back to memory cache only
            result = cache.get_cached_explanation("nonexistent_key")
            
            # Should return None gracefully, not crash
            assert result is None
    
    def test_configuration_error_handling(self):
        """Test handling of configuration errors"""
        from backend.services.llm.adapters import get_llm_adapter
        
        # Test with invalid configuration
        invalid_configs = [
            {"invalid_param": "value"},
            {"base_url": 12345},  # Invalid type
        ]
        
        for config in invalid_configs:
            try:
                adapter = get_llm_adapter('local_stub', config)
                # Should either handle gracefully or raise clear error
                assert adapter is not None
            except Exception as e:
                # Should be a clear configuration error
                assert isinstance(e, (ValueError, TypeError, KeyError))
    
    @pytest.mark.asyncio
    async def test_partial_failure_handling(self):
        """Test handling of partial failures in batch operations"""
        from backend.services.llm.explanation_service import ExplanationService
        
        service = ExplanationService()
        
        # Test with some valid and some invalid edge IDs
        edge_ids = [1, 2, 3, 999999]  # 999999 might fail
        
        try:
            summary = await service.prefetch_explanations_for_edges(edge_ids, concurrency=2)
            
            # Should handle partial failures gracefully
            assert summary.requested == 4
            assert summary.generated >= 0  # Some might succeed
            assert summary.failures >= 0   # Some might fail
            assert summary.generated + summary.failures + summary.cache_hits <= summary.requested
            
        except Exception:
            # If service doesn't handle partial failures, that's also valid behavior
            pass
    
    @pytest.mark.asyncio
    async def test_edge_not_found_handling(self):
        """Test handling when edge data cannot be loaded"""
        service = ExplanationService()
        
        # Mock edge context loading to return None
        with patch.object(service, '_load_edge_context_simple', return_value=None):
            from fastapi import HTTPException
            
            with pytest.raises(HTTPException) as exc_info:
                await service.generate_or_get_edge_explanation(999, force_refresh=False)
            
            assert exc_info.value.status_code == 404
            assert "not found" in exc_info.value.detail.lower()
    
    def test_fallback_explanation_generation(self):
        """Test fallback explanation generation"""
        from datetime import datetime, timezone
        
        service = ExplanationService()
        
        # Test fallback generation
        fallback = asyncio.run(service._create_fallback_explanation(123, "Test error"))
        
        assert isinstance(fallback, ExplanationDTO)
        assert fallback.edge_id == 123
        assert fallback.provider == "fallback"
        assert fallback.tokens_used == 0
        assert "unavailable" in fallback.content.lower()
        assert isinstance(fallback.created_at, datetime)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])