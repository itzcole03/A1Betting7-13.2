"""
Test LLM Service

Tests the core explanation service logic including API calls, caching, error handling.
"""

import pytest
from unittest.mock import Mock, AsyncMock, patch, MagicMock
import asyncio
from datetime import datetime

from backend.services.llm.explanation_service import ExplanationService
from backend.services.llm.prompt_templates import EdgeContext
from backend.services.llm.llm_cache import ExplanationRecord


@pytest.fixture
def mock_llm_adapter():
    """Mock LLM adapter for testing"""
    adapter = Mock()
    adapter.generate_explanation = AsyncMock()
    adapter.estimate_tokens = Mock(return_value=100)
    adapter.provider_name = "test_provider"
    return adapter


@pytest.fixture
def mock_cache():
    """Mock cache for testing"""
    cache = Mock()
    cache.get_cached_explanation = Mock()
    cache.set_cached_explanation = Mock()
    cache.generate_cache_key = Mock(return_value="test_cache_key")
    return cache


@pytest.fixture
def service(mock_llm_adapter, mock_cache):
    """Create ExplanationService for testing"""
    with patch('backend.services.llm.explanation_service.get_llm_adapter', return_value=mock_llm_adapter):
        with patch('backend.services.llm.explanation_service.llm_cache', mock_cache):
            return ExplanationService()


class TestExplanationService:
    """Test the explanation service"""
    
    def test_initialization(self, service):
        """Test service initialization"""
        assert service is not None
        assert hasattr(service, '_rate_limiter')
        assert hasattr(service, '_generation_locks')
        
    @pytest.mark.asyncio
    async def test_generate_explanation_cache_hit(self, service, mock_cache):
        """Test explanation generation with cache hit"""
        # Mock cache hit
        cached_record = ExplanationRecord(
            edge_id=123,
            model_version_id=1,
            content="Cached explanation",
            provider="test_provider",
            tokens_used=150,
            prompt_version="v1",
            cache_key="test_key",
            created_at=datetime.now()
        )
        mock_cache.get_cached_explanation.return_value = cached_record
        
        edge_id = 123
        model_version_id = 1
        
        result = await service.generate_or_get_edge_explanation(edge_id, model_version_id)
        
        assert result["explanation"] == "Cached explanation"
        assert result["provider"] == "test_provider"
        assert result["tokens_used"] == 150
        assert result["from_cache"] is True
        
        # Should not call LLM adapter
        service.llm_adapter.generate_explanation.assert_not_called()
        
    @pytest.mark.asyncio
    async def test_generate_explanation_cache_miss(self, service, mock_cache, mock_llm_adapter):
        """Test explanation generation with cache miss"""
        # Mock cache miss
        mock_cache.get_cached_explanation.return_value = None
        
        # Mock LLM response
        mock_llm_adapter.generate_explanation.return_value = {
            "explanation": "Generated explanation",
            "tokens_used": 200,
            "finish_reason": "stop"
        }
        
        edge_id = 456
        model_version_id = 2
        
        with patch.object(service, '_load_edge_context') as mock_load_context:
            mock_context = EdgeContext(
                player_name="Test Player",
                team="Test Team",
                prop_type="POINTS",
                offered_line=25.5,
                fair_line=23.8,
                prob_over=0.45,
                ev=0.08,
                model_version_name="test_model",
                model_version_id=2,
                volatility_score=0.35,
                recent_lines=[]
            )
            mock_load_context.return_value = mock_context
            
            result = await service.generate_or_get_edge_explanation(edge_id, model_version_id)
            
        assert result["explanation"] == "Generated explanation"
        assert result["tokens_used"] == 200
        assert result["from_cache"] is False
        
        # Should call LLM adapter
        mock_llm_adapter.generate_explanation.assert_called_once()
        
        # Should cache result
        mock_cache.set_cached_explanation.assert_called_once()
        
    @pytest.mark.asyncio
    async def test_generate_explanation_rate_limiting(self, service):
        """Test rate limiting behavior"""
        # Patch the rate limiter to reject requests
        with patch.object(service._rate_limiter, 'acquire', return_value=False):
            with pytest.raises(Exception) as exc_info:
                await service.generate_or_get_edge_explanation(123, 1)
            
            assert "rate limit" in str(exc_info.value).lower()
            
    @pytest.mark.asyncio
    async def test_generate_explanation_concurrent_requests(self, service, mock_cache, mock_llm_adapter):
        """Test handling of concurrent requests for same edge"""
        mock_cache.get_cached_explanation.return_value = None
        mock_llm_adapter.generate_explanation.return_value = {
            "explanation": "Generated explanation",
            "tokens_used": 150,
            "finish_reason": "stop"
        }
        
        edge_id = 789
        model_version_id = 1
        
        with patch.object(service, '_load_edge_context') as mock_load_context:
            mock_context = EdgeContext(
                player_name="Test Player",
                team="Test Team",
                prop_type="POINTS",
                offered_line=25.5,
                fair_line=23.8,
                prob_over=0.45,
                ev=0.08,
                model_version_name="test_model",
                model_version_id=1,
                volatility_score=0.35,
                recent_lines=[]
            )
            mock_load_context.return_value = mock_context
            
            # Start multiple concurrent requests
            tasks = [
                service.generate_or_get_edge_explanation(edge_id, model_version_id)
                for _ in range(3)
            ]
            
            results = await asyncio.gather(*tasks)
            
        # All should get same result
        for result in results:
            assert result["explanation"] == "Generated explanation"
            
        # LLM should only be called once due to locking
        assert mock_llm_adapter.generate_explanation.call_count == 1
        
    @pytest.mark.asyncio
    async def test_generate_explanation_error_handling(self, service, mock_cache, mock_llm_adapter):
        """Test error handling in explanation generation"""
        mock_cache.get_cached_explanation.return_value = None
        mock_llm_adapter.generate_explanation.side_effect = Exception("LLM API Error")
        
        edge_id = 999
        model_version_id = 1
        
        with patch.object(service, '_load_edge_context') as mock_load_context:
            mock_context = EdgeContext(
                player_name="Test Player",
                team="Test Team",
                prop_type="POINTS",
                offered_line=25.5,
                fair_line=23.8,
                prob_over=0.45,
                ev=0.08,
                model_version_name="test_model",
                model_version_id=1,
                volatility_score=0.35,
                recent_lines=[]
            )
            mock_load_context.return_value = mock_context
            
            with pytest.raises(Exception) as exc_info:
                await service.generate_or_get_edge_explanation(edge_id, model_version_id)
                
            assert "LLM API Error" in str(exc_info.value)
            
    @pytest.mark.asyncio
    async def test_prefetch_explanations(self, service, mock_cache, mock_llm_adapter):
        """Test prefetching multiple explanations"""
        # Mock cache misses for all edges
        mock_cache.get_cached_explanation.return_value = None
        
        # Mock LLM responses
        mock_llm_adapter.generate_explanation.side_effect = [
            {"explanation": f"Explanation {i}", "tokens_used": 100 + i, "finish_reason": "stop"}
            for i in range(3)
        ]
        
        edge_data = [
            {"edge_id": 1, "model_version_id": 1},
            {"edge_id": 2, "model_version_id": 1},
            {"edge_id": 3, "model_version_id": 1}
        ]
        
        with patch.object(service, '_load_edge_context') as mock_load_context:
            mock_context = EdgeContext(
                player_name="Test Player",
                team="Test Team",
                prop_type="POINTS",
                offered_line=25.5,
                fair_line=23.8,
                prob_over=0.45,
                ev=0.08,
                model_version_name="test_model",
                model_version_id=1,
                volatility_score=0.35,
                recent_lines=[]
            )
            mock_load_context.return_value = mock_context
            
            results = await service.prefetch_explanations(edge_data)
            
        assert len(results) == 3
        assert results[0]["explanation"] == "Explanation 0"
        assert results[1]["explanation"] == "Explanation 1"
        assert results[2]["explanation"] == "Explanation 2"
        
        # Should have called LLM for all edges
        assert mock_llm_adapter.generate_explanation.call_count == 3
        
    def test_load_edge_context_mock(self, service):
        """Test edge context loading (mock implementation)"""
        edge_id = 123
        model_version_id = 1
        
        context = service._load_edge_context(edge_id, model_version_id)
        
        # Mock implementation should return valid context
        assert context.player_name == "Mock Player"
        assert context.prop_type == "POINTS"
        assert context.model_version_id == model_version_id
        assert isinstance(context.offered_line, float)
        assert isinstance(context.fair_line, float)
        
    def test_service_health_check(self, service):
        """Test service health check"""
        health = service.get_health_status()
        
        assert "status" in health
        assert "adapters" in health
        assert "cache" in health
        assert "rate_limiter" in health
        
        assert health["status"] in ["healthy", "degraded", "unhealthy"]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])