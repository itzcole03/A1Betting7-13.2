"""
Test LLM Adapters

Tests the LLM adapter implementations including OpenAI and local stub.
"""

import pytest
from unittest.mock import Mock, AsyncMock, patch, MagicMock
import json
import asyncio
from datetime import datetime

from backend.services.llm.adapters.base_adapter import BaseAdapter, LLMResult
from backend.services.llm.adapters.openai_adapter import OpenAIAdapter, UnsupportedProviderError
from backend.services.llm.adapters.local_stub_adapter import LocalStubAdapter
from backend.services.llm.adapters import get_llm_adapter


class TestBaseAdapter:
    """Test the base adapter interface"""
    
    def test_base_adapter_interface(self):
        """Test that BaseAdapter defines required interface"""
        # Check that abstract methods exist
        assert hasattr(BaseAdapter, 'generate')
        assert hasattr(BaseAdapter, 'get_provider_name')
        assert hasattr(BaseAdapter, 'is_available')


class TestOpenAIAdapter:
    """Test the OpenAI adapter implementation"""
    
    @pytest.fixture
    def adapter(self):
        """Create OpenAI adapter for testing"""
        with patch.dict('os.environ', {'OPENAI_API_KEY': 'test_api_key'}):
            config = {
                'model': 'gpt-4',
                'base_url': 'https://api.openai.com/v1'
            }
            return OpenAIAdapter(config)
        
    def test_openai_adapter_initialization(self, adapter):
        """Test OpenAI adapter initialization"""
        assert adapter.get_provider_name() == "openaiAdapter"
        assert adapter.model == "gpt-4"
        assert adapter.is_available() is True
        
    def test_openai_adapter_missing_api_key(self):
        """Test OpenAI adapter initialization without API key"""
        with patch.dict('os.environ', {}, clear=True):
            with pytest.raises(UnsupportedProviderError) as exc_info:
                OpenAIAdapter({})
                
            assert "api_key" in str(exc_info.value).lower()
        
    @pytest.mark.asyncio
    async def test_generate_success(self, adapter):
        """Test successful explanation generation"""
        prompt = "Analyze this betting edge"
        
        mock_response_data = {
            "choices": [{
                "message": {
                    "content": "This is a strong betting opportunity because..."
                },
                "finish_reason": "stop"
            }],
            "usage": {
                "total_tokens": 150
            }
        }
        
        with patch('aiohttp.ClientSession') as mock_session_class:
            mock_session = AsyncMock()
            mock_session_class.return_value.__aenter__.return_value = mock_session
            
            mock_response = AsyncMock()
            mock_response.status = 200
            mock_response.json.return_value = mock_response_data
            
            mock_session.post.return_value.__aenter__.return_value = mock_response
            
            result = await adapter.generate(
                prompt,
                max_tokens=500,
                temperature=0.7,
                timeout=30
            )
            
        assert result.content == "This is a strong betting opportunity because..."
        assert result.tokens_used == 150
        assert result.finish_reason == "stop"
        assert result.provider == "openai"
        
    @pytest.mark.asyncio
    async def test_generate_api_error(self, adapter):
        """Test explanation generation with API error"""
        prompt = "Test prompt"
        
        with patch('aiohttp.ClientSession') as mock_session_class:
            mock_session = AsyncMock()
            mock_session_class.return_value.__aenter__.return_value = mock_session
            
            mock_response = AsyncMock()
            mock_response.status = 500
            mock_response.text.return_value = "Internal Server Error"
            
            mock_session.post.return_value.__aenter__.return_value = mock_response
            
            with pytest.raises(Exception) as exc_info:
                await adapter.generate(
                    prompt,
                    max_tokens=500,
                    temperature=0.7,
                    timeout=30
                )
                
            assert "API error" in str(exc_info.value)
            
    @pytest.mark.asyncio
    async def test_generate_rate_limit(self, adapter):
        """Test rate limiting response"""
        prompt = "Test prompt"
        
        with patch('aiohttp.ClientSession') as mock_session_class:
            mock_session = AsyncMock()
            mock_session_class.return_value.__aenter__.return_value = mock_session
            
            mock_response = AsyncMock()
            mock_response.status = 429
            
            mock_session.post.return_value.__aenter__.return_value = mock_response
            
            with pytest.raises(Exception) as exc_info:
                await adapter.generate(
                    prompt,
                    max_tokens=500,
                    temperature=0.7,
                    timeout=30
                )
                
            assert "rate limit" in str(exc_info.value).lower()


class TestLocalStubAdapter:
    """Test the local stub adapter implementation"""
    
    @pytest.fixture
    def adapter(self):
        """Create local stub adapter for testing"""
        config = {}
        return LocalStubAdapter(config)
        
    def test_local_stub_initialization(self, adapter):
        """Test local stub adapter initialization"""
        assert adapter.get_provider_name() == "localstubadapter"
        assert adapter.is_available() is True
        
    @pytest.mark.asyncio
    async def test_generate_success(self, adapter):
        """Test stub explanation generation"""
        prompt = "Analyze this betting opportunity\nPlayer: John Doe\nProp Type: POINTS\nEV: 0.08"
        
        result = await adapter.generate(
            prompt,
            max_tokens=500,
            temperature=0.7,
            timeout=30
        )
        
        assert isinstance(result, LLMResult)
        assert isinstance(result.content, str)
        assert len(result.content) > 50  # Should be substantial
        assert isinstance(result.tokens_used, int)
        assert result.tokens_used > 0
        assert result.finish_reason == "stop"
        assert result.provider == "local_stub"
        
    @pytest.mark.asyncio
    async def test_generate_content_quality(self, adapter):
        """Test that stub generates reasonable content"""
        prompt = """Player: John Doe
Team: Lakers
Prop Type: POINTS
Offered Line: 25.5
Prediction: 27.2
EV: 0.08"""
        
        result = await adapter.generate(
            prompt,
            max_tokens=500,
            temperature=0.7,
            timeout=30
        )
        
        explanation = result.content
        
        # Should contain player name
        assert "John Doe" in explanation
        
        # Should contain relevant betting terms
        betting_terms = ['edge', 'value', 'prediction', 'line']
        assert any(term in explanation.lower() for term in betting_terms)
        
    @pytest.mark.asyncio
    async def test_context_extraction(self, adapter):
        """Test context extraction from prompt"""
        prompt = """Player: Jane Smith
Prop Type: REBOUNDS
Offered Line: 8.5
Prediction: 10.2
EV: 0.12
Volatility: 0.35"""
        
        context = adapter._extract_context_from_prompt(prompt)
        
        assert context['player_name'] == "Jane Smith"
        assert context['prop_type'] == "rebounds"
        assert context['offered_line'] == 8.5
        assert context['prediction'] == 10.2
        assert context['ev'] == 0.12
        assert context['volatility_score'] == 0.35
        
    def test_token_estimation(self, adapter):
        """Test token estimation"""
        prompt = "This is a test prompt for token estimation"
        
        estimated_tokens = adapter._calculate_token_estimate(prompt)
        
        assert isinstance(estimated_tokens, int)
        assert estimated_tokens > 0
        # Rough estimation should be reasonable
        assert 5 <= estimated_tokens <= 50


class TestAdapterFactory:
    """Test the adapter factory function"""
    
    def test_get_openai_adapter(self):
        """Test getting OpenAI adapter via factory"""
        with patch.dict('os.environ', {'OPENAI_API_KEY': 'test_key'}):
            adapter = get_llm_adapter('openai')
            
            assert isinstance(adapter, OpenAIAdapter)
            assert adapter.get_provider_name() == "openaiAdapter"
            
    def test_get_local_stub_adapter(self):
        """Test getting local stub adapter via factory"""
        adapter = get_llm_adapter('local_stub')
        
        assert isinstance(adapter, LocalStubAdapter)
        assert adapter.get_provider_name() == "localstubadapter"
        
    def test_get_default_adapter(self):
        """Test getting default adapter"""
        # Should return local_stub as fallback
        adapter = get_llm_adapter('unknown_provider')
        
        assert isinstance(adapter, LocalStubAdapter)
        
    def test_adapter_error_handling(self):
        """Test adapter factory error handling"""
        # Missing required OpenAI config should fall back to stub
        adapter = get_llm_adapter('openai', {})  # No API key in env
        
        # Should fallback to local stub
        assert isinstance(adapter, LocalStubAdapter)


class TestAdapterIntegration:
    """Test adapter integration scenarios"""
    
    @pytest.mark.asyncio
    async def test_multiple_adapters_same_prompt(self):
        """Test multiple adapters with same prompt"""
        prompt = "Analyze this sports betting edge"
        
        # Get both adapters
        with patch.dict('os.environ', {'OPENAI_API_KEY': 'dummy_key'}):
            openai_adapter = get_llm_adapter('openai')
        stub_adapter = get_llm_adapter('local_stub')
        
        # Mock OpenAI to avoid actual API call
        with patch.object(openai_adapter, 'generate') as mock_openai:
            mock_openai.return_value = LLMResult(
                content="OpenAI response",
                tokens_used=100,
                provider="openai",
                finish_reason="stop"
            )
            
            openai_result = await openai_adapter.generate(
                prompt, max_tokens=500, temperature=0.7, timeout=30
            )
            stub_result = await stub_adapter.generate(
                prompt, max_tokens=500, temperature=0.7, timeout=30
            )
            
        # Both should return valid results
        assert openai_result.content == "OpenAI response"
        assert len(stub_result.content) > 0
        assert openai_result.content != stub_result.content
        
    def test_adapter_token_estimation_consistency(self):
        """Test that token estimation is reasonably consistent"""
        prompts = [
            "Short prompt",
            "This is a longer prompt with more content to analyze",
            "Very long prompt " * 20  # Very long prompt
        ]
        
        adapter = get_llm_adapter('local_stub')
        
        estimates = [adapter._calculate_token_estimate(p) for p in prompts]
        
        # Longer prompts should generally have higher estimates
        assert estimates[0] < estimates[1] < estimates[2]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])