"""
Test suite for SmartFallbackPriorityService

Validates the intelligent fallback logic for provider selection, priority 
ordering, circuit breaker integration, and fallback execution under 
various failure scenarios.
"""

import pytest
import asyncio
import time
from unittest.mock import Mock, patch, AsyncMock
from typing import Dict, List

from backend.services.smart_fallback_priority_service import (
    SmartFallbackPriorityService,
    FallbackConfiguration,
    FallbackStrategy,
    FallbackReason,
    FallbackEvent,
    ProviderPriority
)
from backend.services.provider_resilience_manager import ProviderState, CircuitBreakerState
from backend.services.provider_confidence_integration import ConfidenceLevel, ProviderConfidenceScore


class TestSmartFallbackPriorityService:
    """Test cases for SmartFallbackPriorityService functionality"""
    
    @pytest.fixture
    def config(self):
        """Test configuration"""
        return FallbackConfiguration(
            max_staleness_seconds=300,
            min_confidence_threshold=0.3,
            max_fallback_attempts=3,
            fallback_timeout_seconds=30,
            strategy=FallbackStrategy.BEST_AVAILABLE
        )
    
    @pytest.fixture
    def service(self, config):
        """Create service instance with mocked dependencies"""
        with patch('backend.services.smart_fallback_priority_service.ProviderConfidenceIntegration') as mock_confidence, \
             patch('backend.services.smart_fallback_priority_service.ProviderResilienceManager') as mock_resilience:
            
            service = SmartFallbackPriorityService(config)
            service.confidence_integration = mock_confidence.return_value
            service.resilience_manager = mock_resilience.return_value
            return service
    
    def test_set_primary_provider(self, service):
        """Test setting primary provider for context"""
        context = "odds_aggregation"
        provider_id = "draftkings"
        
        asyncio.run(service.set_primary_provider(context, provider_id))
        
        assert service.primary_providers[context] == provider_id
    
    def test_calculate_priority_score(self, service):
        """Test priority score calculation algorithm"""
        
        # High confidence, primary, healthy circuit
        score = service._calculate_priority_score(0.8, CircuitBreakerState.CLOSED, True, 60)
        expected = 0.8 + 0.1  # confidence + primary boost
        assert score == pytest.approx(expected, rel=1e-3)
        
        # Low confidence with open circuit
        score = service._calculate_priority_score(0.6, CircuitBreakerState.OPEN, False, 60)
        expected = 0.6 * 0.2  # 80% penalty for open circuit
        assert score == pytest.approx(expected, rel=1e-3)
        
        # Stale data penalty
        score = service._calculate_priority_score(0.8, CircuitBreakerState.CLOSED, False, 600)  # 10 minutes stale
        # Staleness penalty = min(0.5, 600 / (2 * 300)) = min(0.5, 1.0) = 0.5
        expected = 0.8 * (1 - 0.5)  # 50% penalty for staleness
        assert score == pytest.approx(expected, rel=1e-3)
    
    @pytest.mark.asyncio
    async def test_get_provider_priorities(self, service):
        """Test provider priority calculation and ordering"""
        context = "test_context"
        available_providers = ["provider_a", "provider_b", "provider_c"]
        
        # Set primary provider
        await service.set_primary_provider(context, "provider_a")
        
        # Mock confidence scores
        mock_confidence_scores = {
            "provider_a": ProviderConfidenceScore(
                provider_id="provider_a",
                confidence_score=0.9,
                confidence_level=ConfidenceLevel.EXCELLENT,
                circuit_state=CircuitBreakerState.CLOSED,
                provider_state=ProviderState.HEALTHY,
                success_rate_score=0.9,
                latency_score=0.95,
                freshness_score=0.9,
                reliability_score=0.85,
                consistency_score=0.9,
                circuit_penalty=0.0,
                adjusted_confidence=0.9,
                selection_priority=10,
                last_updated=time.time(),
                requires_fallback=False
            ),
            "provider_b": ProviderConfidenceScore(
                provider_id="provider_b",
                confidence_score=0.7,
                confidence_level=ConfidenceLevel.GOOD,
                circuit_state=CircuitBreakerState.CLOSED,
                provider_state=ProviderState.HEALTHY,
                success_rate_score=0.7,
                latency_score=0.8,
                freshness_score=0.75,
                reliability_score=0.7,
                consistency_score=0.65,
                circuit_penalty=0.0,
                adjusted_confidence=0.7,
                selection_priority=30,
                last_updated=time.time(),
                requires_fallback=False
            ),
            "provider_c": ProviderConfidenceScore(
                provider_id="provider_c",
                confidence_score=0.4,
                confidence_level=ConfidenceLevel.FAIR,
                circuit_state=CircuitBreakerState.HALF_OPEN,
                provider_state=ProviderState.DEGRADED,
                success_rate_score=0.4,
                latency_score=0.5,
                freshness_score=0.3,
                reliability_score=0.4,
                consistency_score=0.45,
                circuit_penalty=0.4,
                adjusted_confidence=0.4,
                selection_priority=60,
                last_updated=time.time(),
                requires_fallback=True
            )
        }
        
        async def mock_get_confidence_score(provider_id):
            return mock_confidence_scores[provider_id]
        
        service.confidence_integration.get_provider_confidence_score = mock_get_confidence_score
        
        # Mock resilience manager
        service.resilience_manager.provider_metrics = {}
        
        # Mock enhanced statistics - simplified for test
        mock_stats_manager = Mock()
        mock_stats_manager.provider_metrics = {}
        service.confidence_integration.statistics_manager = mock_stats_manager
        
        priorities = await service.get_provider_priorities(context, available_providers)
        
        # Verify ordering (highest priority first)
        assert len(priorities) == 3
        assert priorities[0].provider_id == "provider_a"  # Primary with highest confidence + boost
        assert priorities[1].provider_id == "provider_b"  # Second highest confidence
        assert priorities[2].provider_id == "provider_c"  # Lowest confidence
        
        # Verify priority scores
        assert priorities[0].priority_score > priorities[1].priority_score
        assert priorities[1].priority_score > priorities[2].priority_score
        
        # Verify primary provider is marked
        assert priorities[0].is_primary
        assert not priorities[1].is_primary
        assert not priorities[2].is_primary
    
    @pytest.mark.asyncio
    async def test_select_optimal_provider_best_available(self, service):
        """Test optimal provider selection with best available strategy"""
        context = "test_context"
        available_providers = ["provider_a", "provider_b"]
        
        # Mock priorities with provider_a having higher priority
        mock_priorities = [
            ProviderPriority(
                provider_id="provider_a",
                priority_score=0.9,
                confidence_score=0.9,
                is_primary=True,
                circuit_state=CircuitBreakerState.CLOSED,
                last_successful_request=time.time(),
                estimated_latency_ms=50,
                staleness_seconds=30
            ),
            ProviderPriority(
                provider_id="provider_b",
                priority_score=0.7,
                confidence_score=0.7,
                is_primary=False,
                circuit_state=CircuitBreakerState.CLOSED,
                last_successful_request=time.time() - 60,
                estimated_latency_ms=100,
                staleness_seconds=60
            )
        ]
        
        with patch.object(service, 'get_provider_priorities', return_value=mock_priorities):
            selected_provider, reason = await service.select_optimal_provider(context, available_providers)
            
            assert selected_provider == "provider_a"
            assert reason == FallbackReason.PRIMARY_FAILED  # Default when no current provider
    
    @pytest.mark.asyncio
    async def test_should_trigger_fallback(self, service):
        """Test fallback trigger conditions"""
        
        # Provider with open circuit breaker should trigger fallback
        provider_priority = ProviderPriority(
            provider_id="failing_provider",
            priority_score=0.2,
            confidence_score=0.5,
            is_primary=False,
            circuit_state=CircuitBreakerState.OPEN,
            last_successful_request=time.time() - 300,
            estimated_latency_ms=1000,
            staleness_seconds=400
        )
        
        reason = service._should_trigger_fallback(provider_priority)
        assert reason == FallbackReason.CIRCUIT_BREAKER_OPEN
        
        # Provider with low confidence should trigger fallback
        provider_priority.circuit_state = CircuitBreakerState.CLOSED
        provider_priority.confidence_score = 0.2  # Below threshold of 0.3
        
        reason = service._should_trigger_fallback(provider_priority)
        assert reason == FallbackReason.LOW_CONFIDENCE
        
        # Provider with stale data should trigger fallback
        provider_priority.confidence_score = 0.8
        provider_priority.staleness_seconds = 400  # Above threshold of 300
        
        reason = service._should_trigger_fallback(provider_priority)
        assert reason == FallbackReason.STALE_DATA
        
        # Healthy provider should not trigger fallback
        provider_priority.staleness_seconds = 60
        
        reason = service._should_trigger_fallback(provider_priority)
        assert reason is None
    
    @pytest.mark.asyncio
    async def test_execute_with_fallback_success(self, service):
        """Test successful operation execution with fallback"""
        context = "test_context"
        available_providers = ["provider_a", "provider_b"]
        
        # Mock operation that succeeds on first try
        async def mock_operation(provider_id, **kwargs):
            return f"success_with_{provider_id}"
        
        # Mock provider selection
        with patch.object(service, 'select_optimal_provider', return_value=("provider_a", FallbackReason.PRIMARY_FAILED)), \
             patch.object(service, '_get_provider_confidence', return_value=0.9):
            
            result, selected_provider, events = await service.execute_with_fallback(
                context, mock_operation, available_providers
            )
            
            assert result == "success_with_provider_a"
            assert selected_provider == "provider_a"
            assert len(events) == 1
            assert events[0].success
            assert events[0].reason == FallbackReason.PRIMARY_FAILED
    
    @pytest.mark.asyncio
    async def test_execute_with_fallback_failure_and_retry(self, service):
        """Test operation execution with failure and automatic retry"""
        context = "test_context"
        available_providers = ["provider_a", "provider_b"]
        
        call_count = 0
        
        # Mock operation that fails on first call, succeeds on second
        async def mock_operation(provider_id, **kwargs):
            nonlocal call_count
            call_count += 1
            if call_count == 1:
                raise Exception("First provider failed")
            return f"success_with_{provider_id}"
        
        # Mock provider selection to return different providers on each call
        selection_calls = [
            ("provider_a", FallbackReason.PRIMARY_FAILED),
            ("provider_b", FallbackReason.PRIMARY_FAILED)
        ]
        
        with patch.object(service, 'select_optimal_provider', side_effect=selection_calls), \
             patch.object(service, '_get_provider_confidence', return_value=0.7), \
             patch.object(service, 'get_provider_priorities') as mock_priorities:
            
            # Mock priorities for retry logic
            mock_priorities.return_value = [
                ProviderPriority("provider_b", 0.7, 0.7, False, CircuitBreakerState.CLOSED, time.time(), 100, 60)
            ]
            
            result, selected_provider, events = await service.execute_with_fallback(
                context, mock_operation, available_providers
            )
            
            assert result == "success_with_provider_b"
            assert selected_provider == "provider_b"
            assert len(events) == 2
            assert not events[0].success  # First attempt failed
            assert events[1].success     # Second attempt succeeded
    
    @pytest.mark.asyncio
    async def test_execute_with_fallback_timeout(self, service):
        """Test operation execution with timeout"""
        context = "test_context"
        available_providers = ["provider_a"]
        
        # Mock operation that takes too long
        async def mock_operation(provider_id, **kwargs):
            await asyncio.sleep(service.config.fallback_timeout_seconds + 1)
            return "should_not_reach_here"
        
        with patch.object(service, 'select_optimal_provider', return_value=("provider_a", FallbackReason.PRIMARY_FAILED)), \
             patch.object(service, '_get_provider_confidence', return_value=0.8):
            
            with pytest.raises(Exception) as exc_info:
                await service.execute_with_fallback(context, mock_operation, available_providers)
            
            assert "All fallback attempts failed" in str(exc_info.value)
    
    def test_fallback_analytics(self, service):
        """Test fallback analytics generation"""
        
        # Add some sample fallback events
        current_time = time.time()
        
        events = [
            FallbackEvent(
                timestamp=current_time - 1800,  # 30 minutes ago
                original_provider="provider_a",
                fallback_provider="provider_b",
                reason=FallbackReason.CIRCUIT_BREAKER_OPEN,
                confidence_score=0.7,
                latency_ms=150,
                success=True
            ),
            FallbackEvent(
                timestamp=current_time - 900,   # 15 minutes ago
                original_provider="provider_b",
                fallback_provider="provider_c",
                reason=FallbackReason.STALE_DATA,
                confidence_score=0.5,
                latency_ms=300,
                success=False,
                error_message="Provider unreachable"
            ),
            FallbackEvent(
                timestamp=current_time - 300,   # 5 minutes ago
                original_provider="provider_a",
                fallback_provider="provider_b",
                reason=FallbackReason.LOW_CONFIDENCE,
                confidence_score=0.8,
                latency_ms=100,
                success=True
            )
        ]
        
        service.fallback_history = events
        
        analytics = service.get_fallback_analytics()
        
        # Verify analytics structure
        assert "performance" in analytics
        assert "recent_hour" in analytics
        assert "provider_reliability" in analytics
        assert "active_fallbacks" in analytics
        assert "cache_hit_rate" in analytics
        
        # Verify recent hour statistics
        recent_hour = analytics["recent_hour"]
        assert recent_hour["total_fallbacks"] == 3
        assert recent_hour["success_rate"] == pytest.approx(66.67, rel=1e-1)  # 2 out of 3 successful
        assert recent_hour["most_common_reason"] in ["circuit_breaker_open", "stale_data", "low_confidence"]
    
    @pytest.mark.asyncio
    async def test_cleanup_old_data(self, service):
        """Test cleanup of old fallback events and cache entries"""
        
        current_time = time.time()
        old_time = current_time - (25 * 3600)  # 25 hours ago
        recent_time = current_time - (1 * 3600)  # 1 hour ago
        
        # Add old and recent events
        service.fallback_history = [
            FallbackEvent(old_time, "old", "fallback", FallbackReason.STALE_DATA, 0.5, 100, True),
            FallbackEvent(recent_time, "recent", "fallback", FallbackReason.LOW_CONFIDENCE, 0.7, 150, True)
        ]
        
        # Add old and recent cache entries
        service.priority_cache = {
            "old_key": ([], old_time),
            "recent_key": ([], recent_time)
        }
        
        await service.cleanup_old_data(max_age_hours=24)
        
        # Verify old data was removed
        assert len(service.fallback_history) == 1
        assert service.fallback_history[0].original_provider == "recent"
        
        assert len(service.priority_cache) == 1
        assert "recent_key" in service.priority_cache
        assert "old_key" not in service.priority_cache


class TestFallbackConfiguration:
    """Test cases for FallbackConfiguration"""
    
    def test_default_configuration(self):
        """Test default configuration values"""
        config = FallbackConfiguration()
        
        assert config.max_staleness_seconds == 300
        assert config.min_confidence_threshold == 0.3
        assert config.max_fallback_attempts == 3
        assert config.fallback_timeout_seconds == 30
        assert config.strategy == FallbackStrategy.BEST_AVAILABLE
        assert config.primary_provider_priority_boost == 0.1
        assert config.enable_circuit_breaker_fallback is True
        assert config.enable_performance_fallback is True
        assert config.manual_provider_order is None
    
    def test_custom_configuration(self):
        """Test custom configuration values"""
        config = FallbackConfiguration(
            max_staleness_seconds=600,
            min_confidence_threshold=0.5,
            strategy=FallbackStrategy.MANUAL_ORDER,
            manual_provider_order=["provider_a", "provider_b", "provider_c"]
        )
        
        assert config.max_staleness_seconds == 600
        assert config.min_confidence_threshold == 0.5
        assert config.strategy == FallbackStrategy.MANUAL_ORDER
        assert config.manual_provider_order == ["provider_a", "provider_b", "provider_c"]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])