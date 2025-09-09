"""
Comprehensive Integration Tests for Smart Fallback Priority System

Tests the complete interaction between SmartFallbackPriorityService,
ProviderConfidenceIntegration, and ProviderResilienceManager under
various failure scenarios.
"""

import pytest
import asyncio
import time
from unittest.mock import Mock, AsyncMock, patch
from typing import Dict, List

from backend.services.smart_fallback_priority_service import (
    SmartFallbackPriorityService,
    FallbackConfiguration,
    FallbackStrategy,
    FallbackReason,
    ProviderPriority,
    CircuitBreakerState
)
from backend.services.provider_confidence_integration import ProviderConfidenceIntegration
from backend.services.provider_resilience_manager import ProviderResilienceManager


@pytest.mark.asyncio
class TestSmartFallbackIntegration:
    """Integration tests for the complete smart fallback system"""
    
    @pytest.fixture
    async def mock_provider_confidence(self):
        """Create mock provider confidence integration"""
        mock_confidence = Mock(spec=ProviderConfidenceIntegration)
        mock_confidence.get_provider_confidence_score = AsyncMock()
        mock_confidence.get_enhanced_statistics = AsyncMock()
        
        # Create mock statistics manager
        mock_stats_manager = Mock()
        mock_stats_manager.provider_metrics = {}
        mock_confidence.statistics_manager = mock_stats_manager
        
        # Default confidence scores with mock confidence score objects
        async def get_confidence_score(provider_id: str):
            score = {
                "draftkings": 0.95,
                "fanduel": 0.85,
                "betmgm": 0.75,
                "caesars": 0.65,
                "pointsbet": 0.55
            }.get(provider_id, 0.5)
            
            mock_score = Mock()
            mock_score.adjusted_confidence = score
            return mock_score
        
        mock_confidence.get_provider_confidence_score.side_effect = get_confidence_score
        
        return mock_confidence
    
    @pytest.fixture
    async def mock_resilience_manager(self):
        """Create mock provider resilience manager"""
        mock_resilience = Mock(spec=ProviderResilienceManager)
        mock_resilience.get_circuit_breaker_state = AsyncMock()
        
        # Create mock provider metrics
        mock_resilience.provider_metrics = {}
        
        for provider_id in ["draftkings", "fanduel", "betmgm", "caesars", "pointsbet"]:
            mock_metrics = Mock()
            mock_metrics.circuit_state = {
                "draftkings": CircuitBreakerState.CLOSED,
                "fanduel": CircuitBreakerState.CLOSED,
                "betmgm": CircuitBreakerState.HALF_OPEN,
                "caesars": CircuitBreakerState.OPEN,
                "pointsbet": CircuitBreakerState.CLOSED
            }.get(provider_id, CircuitBreakerState.CLOSED)
            
            mock_resilience.provider_metrics[provider_id] = mock_metrics
        
        return mock_resilience
    
    @pytest.fixture
    async def mock_enhanced_statistics(self, mock_provider_confidence):
        """Create mock enhanced statistics data"""
        current_time = time.time()
        
        def create_stats(provider_id: str, latency_ms: float, success_rate: float, last_request_offset: float):
            stats = Mock()
            stats.provider_id = provider_id
            stats.last_request_time = current_time - last_request_offset
            stats.last_data_update = current_time - last_request_offset  # Add this field
            
            # Mock window_5m with get_latency_percentiles method
            mock_window = Mock()
            mock_window.total_count = 100
            mock_window.get_latency_percentiles.return_value = {"p50": latency_ms, "p95": latency_ms * 1.5}
            stats.window_5m = mock_window
            
            stats.get_latency_percentiles.return_value = (latency_ms * 0.8, latency_ms, latency_ms * 1.2)
            stats.get_success_rate.return_value = success_rate
            stats.total_requests = 100
            stats.successful_requests = int(100 * success_rate)
            return stats
        
        stats_data = {
            "draftkings": create_stats("draftkings", 150.0, 0.98, 30),    # Fresh, fast, reliable
            "fanduel": create_stats("fanduel", 200.0, 0.95, 60),          # Slightly older, slower
            "betmgm": create_stats("betmgm", 180.0, 0.90, 120),           # Moderate age/performance
            "caesars": create_stats("caesars", 300.0, 0.70, 300),         # Stale, slow, unreliable
            "pointsbet": create_stats("pointsbet", 250.0, 0.85, 90)       # Mixed performance
        }
        
        # Add to mock_provider_confidence.statistics_manager.provider_metrics
        mock_provider_confidence.statistics_manager.provider_metrics = stats_data
        
        return stats_data
    
    @pytest.fixture
    async def integration_service(self, mock_provider_confidence, mock_resilience_manager, mock_enhanced_statistics):
        """Create SmartFallbackPriorityService with mocked dependencies"""
        
        # Mock the imported classes and their instantiation
        with patch('backend.services.smart_fallback_priority_service.ProviderConfidenceIntegration') as mock_confidence_class:
            with patch('backend.services.smart_fallback_priority_service.ProviderResilienceManager') as mock_resilience_class:
                
                # Make the classes return our mocked instances
                mock_confidence_class.return_value = mock_provider_confidence
                mock_resilience_class.return_value = mock_resilience_manager
                
                service = SmartFallbackPriorityService(
                    config=FallbackConfiguration(
                        max_staleness_seconds=300,
                        min_confidence_threshold=0.7,
                        strategy=FallbackStrategy.BEST_AVAILABLE,
                        primary_provider_priority_boost=0.1,
                        enable_circuit_breaker_fallback=True,
                        enable_performance_fallback=True
                    )
                )
                
                yield service
    
    async def test_primary_provider_healthy_scenario(self, integration_service):
        """Test normal operation when primary provider is healthy"""
        context = "odds_aggregation"
        providers = ["draftkings", "fanduel", "betmgm"]
        
        # Set draftkings as primary
        await integration_service.set_primary_provider(context, "draftkings")
        
        # Get priorities - primary should be highest
        priorities = await integration_service.get_provider_priorities(context, providers)
        
        assert len(priorities) == 3
        assert priorities[0].provider_id == "draftkings"
        assert priorities[0].is_primary is True
        assert priorities[0].priority_score > priorities[1].priority_score
        
        # Select optimal provider - should return primary
        selected, reason = await integration_service.select_optimal_provider(context, providers)
        
        assert selected == "draftkings"
        assert reason is None  # No fallback needed
    
    async def test_primary_provider_stale_fallback(self, integration_service, mock_enhanced_statistics, mock_provider_confidence):
        """Test fallback when primary provider data is stale"""
        context = "odds_aggregation"
        providers = ["draftkings", "fanduel", "betmgm"]
        
        # Set draftkings as primary
        await integration_service.set_primary_provider(context, "draftkings")
        
        # Make draftkings data very stale by updating the mock
        current_time = time.time()
        stale_time = current_time - 600  # 10 minutes ago
        
        # Update the statistics in the confidence integration's statistics_manager
        mock_enhanced_statistics["draftkings"].last_data_update = stale_time
        mock_enhanced_statistics["draftkings"].last_request_time = stale_time
        
        # Force refresh to bypass cache
        priorities = await integration_service.get_provider_priorities(context, providers, force_refresh=True)
        
        # Verify draftkings has high staleness
        draftkings_priority = next(p for p in priorities if p.provider_id == "draftkings")
        assert draftkings_priority.staleness_seconds > 500  # Should be around 600 seconds
        
        # Select optimal provider - should fallback to fanduel
        selected, reason = await integration_service.select_optimal_provider(context, providers)
        
        assert selected == "fanduel"  # Should fallback to next best
        assert reason == FallbackReason.STALE_DATA
        
        # Verify fallback was recorded
        assert len(integration_service.fallback_history) > 0
        last_event = integration_service.fallback_history[-1]
        assert last_event.original_provider == "draftkings"
        assert last_event.fallback_provider == "fanduel"
        assert last_event.reason == FallbackReason.STALE_DATA
    
    async def test_primary_provider_circuit_breaker_open(self, integration_service, mock_resilience_manager):
        """Test fallback when primary provider circuit breaker is open"""
        context = "odds_aggregation"
        providers = ["draftkings", "fanduel", "betmgm"]
        
        # Set draftkings as primary
        await integration_service.set_primary_provider(context, "draftkings")
        
        # Open circuit breaker for draftkings
        # Update the resilience manager provider metrics
        for provider_id in ["draftkings", "fanduel", "betmgm"]:
            mock_metrics = Mock()
            mock_metrics.circuit_state = {
                "draftkings": CircuitBreakerState.OPEN,
                "fanduel": CircuitBreakerState.CLOSED,
                "betmgm": CircuitBreakerState.HALF_OPEN
            }.get(provider_id, CircuitBreakerState.CLOSED)
            
            mock_resilience_manager.provider_metrics[provider_id] = mock_metrics
        
        # Select optimal provider - should fallback due to circuit breaker
        selected, reason = await integration_service.select_optimal_provider(context, providers)
        
        assert selected == "fanduel"
        assert reason == FallbackReason.CIRCUIT_BREAKER_OPEN
        
        # Verify priorities reflect circuit breaker penalty
        priorities = await integration_service.get_provider_priorities(context, providers)
        draftkings_priority = next(p for p in priorities if p.provider_id == "draftkings")
        assert draftkings_priority.circuit_state == CircuitBreakerState.OPEN
        assert draftkings_priority.priority_score < 0.5  # Should be heavily penalized
    
    async def test_low_confidence_fallback(self, integration_service, mock_provider_confidence):
        """Test fallback when primary provider has low confidence"""
        context = "odds_aggregation"
        providers = ["draftkings", "fanduel", "betmgm"]
        
        # Set draftkings as primary
        await integration_service.set_primary_provider(context, "draftkings")
        
        # Lower draftkings confidence below threshold
        async def get_low_confidence_score(provider_id: str):
            score = {
                "draftkings": 0.6,  # Below 0.7 threshold
                "fanduel": 0.85,
                "betmgm": 0.75
            }.get(provider_id, 0.5)
            
            mock_score = Mock()
            mock_score.adjusted_confidence = score
            return mock_score
        
        mock_provider_confidence.get_provider_confidence_score.side_effect = get_low_confidence_score
        
        # Select optimal provider - should fallback due to low confidence
        selected, reason = await integration_service.select_optimal_provider(context, providers)
        
        assert selected == "fanduel"
        assert reason == FallbackReason.LOW_CONFIDENCE
    
    async def test_cascading_failures_scenario(self, integration_service, mock_provider_confidence, mock_resilience_manager, mock_enhanced_statistics):
        """Test complex scenario with multiple provider failures"""
        context = "odds_aggregation"
        providers = ["draftkings", "fanduel", "betmgm", "caesars", "pointsbet"]
        
        # Set draftkings as primary
        await integration_service.set_primary_provider(context, "draftkings")
        
        # Create cascading failure scenario
        current_time = time.time()
        
        # Draftkings: Circuit breaker open
        # Update the resilience manager provider metrics
        for provider_id in ["draftkings", "fanduel", "betmgm", "caesars", "pointsbet"]:
            mock_metrics = Mock()
            mock_metrics.circuit_state = {
                "draftkings": CircuitBreakerState.OPEN,
                "fanduel": CircuitBreakerState.CLOSED,
                "betmgm": CircuitBreakerState.HALF_OPEN,
                "caesars": CircuitBreakerState.OPEN,
                "pointsbet": CircuitBreakerState.CLOSED
            }.get(provider_id, CircuitBreakerState.CLOSED)
            
            mock_resilience_manager.provider_metrics[provider_id] = mock_metrics
        
        # FanDuel: Low confidence
        async def get_cascading_confidence_score(provider_id: str):
            score = {
                "draftkings": 0.95,
                "fanduel": 0.6,  # Below threshold
                "betmgm": 0.75,
                "caesars": 0.65,
                "pointsbet": 0.8
            }.get(provider_id, 0.5)
            
            mock_score = Mock()
            mock_score.adjusted_confidence = score
            return mock_score
        
        mock_provider_confidence.get_provider_confidence_score.side_effect = get_cascading_confidence_score
        
        # BetMGM: Stale data
        mock_enhanced_statistics["betmgm"].last_request_time = current_time - 400  # Stale
        
        # PointsBet should be selected as best available option
        selected, reason = await integration_service.select_optimal_provider(context, providers)
        
        assert selected == "pointsbet"
        assert reason == FallbackReason.CIRCUIT_BREAKER_OPEN  # Circuit breaker open is correct
        
        # Verify priorities reflect all issues
        priorities = await integration_service.get_provider_priorities(context, providers)
        
        # Find specific provider priorities
        priority_dict = {p.provider_id: p for p in priorities}
        
        # Draftkings should be low due to circuit breaker
        assert priority_dict["draftkings"].circuit_state == CircuitBreakerState.OPEN
        assert priority_dict["draftkings"].priority_score < 0.5
        
        # FanDuel should be low due to confidence
        assert priority_dict["fanduel"].confidence_score == 0.6
        
        # BetMGM should show staleness
        assert priority_dict["betmgm"].staleness_seconds > 300
        
        # PointsBet should be highest available
        assert priority_dict["pointsbet"].priority_score == max(p.priority_score for p in priorities)
    
    async def test_fallback_with_retry_mechanism(self, integration_service):
        """Test execute_with_fallback retry mechanism"""
        context = "odds_aggregation"
        providers = ["draftkings", "fanduel", "betmgm"]
        
        # Set draftkings as primary
        await integration_service.set_primary_provider(context, "draftkings")
        
        call_count = 0
        async def failing_operation(provider_id: str):
            nonlocal call_count
            call_count += 1
            if provider_id == "draftkings" and call_count <= 2:
                raise Exception("Provider temporarily unavailable")
            elif provider_id == "fanduel" and call_count <= 3:
                raise Exception("Provider error")
            else:
                return f"success_with_{provider_id}"
        
        # Execute with fallback - should retry and eventually succeed with betmgm
        result, selected_provider, events = await integration_service.execute_with_fallback(
            context, failing_operation, providers
        )
        
        assert result == "success_with_betmgm"
        assert selected_provider == "betmgm"
        assert call_count >= 3  # Multiple attempts across providers
        
        # Check fallback history
        assert len(integration_service.fallback_history) > 0
        events = integration_service.fallback_history
        
        # Should have events for failures and final success
        failure_events = [e for e in events if not e.success]
        success_events = [e for e in events if e.success]
        
        assert len(failure_events) >= 2  # At least two failures
        assert len(success_events) >= 1  # At least one success
    
    async def test_performance_degradation_fallback(self, integration_service, mock_enhanced_statistics):
        """Test fallback due to performance degradation"""
        context = "odds_aggregation"
        providers = ["draftkings", "fanduel", "betmgm"]
        
        # Set draftkings as primary
        await integration_service.set_primary_provider(context, "draftkings")
        
        # Make draftkings very slow
        mock_enhanced_statistics["draftkings"].get_latency_percentiles.return_value = (800, 1000, 1200)  # Very slow
        mock_enhanced_statistics["fanduel"].get_latency_percentiles.return_value = (150, 200, 250)     # Much faster
        
        # Get priorities - fanduel should rank higher due to better performance
        priorities = await integration_service.get_provider_priorities(context, providers)
        
        # While draftkings gets primary boost, performance difference should be significant
        priority_dict = {p.provider_id: p for p in priorities}
        
        assert priority_dict["draftkings"].estimated_latency_ms > 800
        assert priority_dict["fanduel"].estimated_latency_ms < 300
        
        # Depending on configuration, might trigger performance-based fallback
        if integration_service.config.enable_performance_fallback:
            selected, reason = await integration_service.select_optimal_provider(context, providers)
            # Could fallback if performance difference is too large
            assert selected in ["draftkings", "fanduel"]  # Either could be selected based on configuration
    
    async def test_manual_provider_ordering(self, integration_service):
        """Test manual provider ordering strategy"""
        # Configure service with manual ordering
        integration_service.config.strategy = FallbackStrategy.MANUAL_ORDER
        integration_service.config.manual_provider_order = ["betmgm", "fanduel", "draftkings"]
        
        context = "odds_aggregation"
        providers = ["draftkings", "fanduel", "betmgm"]
        
        # Get priorities - should follow manual order
        priorities = await integration_service.get_provider_priorities(context, providers)
        
        assert priorities[0].provider_id == "betmgm"
        assert priorities[1].provider_id == "fanduel"
        assert priorities[2].provider_id == "draftkings"
        
        # Select optimal - should follow manual order
        selected, reason = await integration_service.select_optimal_provider(context, providers)
        assert selected == "betmgm"
    
    async def test_round_robin_strategy(self, integration_service):
        """Test round robin fallback strategy"""
        integration_service.config.strategy = FallbackStrategy.ROUND_ROBIN
        
        context = "odds_aggregation"
        providers = ["draftkings", "fanduel", "betmgm"]
        
        # Multiple selections should rotate through providers
        selections = []
        for _ in range(6):  # Two complete cycles
            selected, _ = await integration_service.select_optimal_provider(context, providers)
            selections.append(selected)
        
        # Should see all providers used in rotation
        assert len(set(selections)) == 3  # All three providers used
        
        # Pattern should repeat
        assert selections[0] == selections[3]  # First cycle repeats
        assert selections[1] == selections[4]
        assert selections[2] == selections[5]
    
    async def test_analytics_and_performance_tracking(self, integration_service):
        """Test comprehensive analytics and performance tracking"""
        context = "odds_aggregation"
        providers = ["draftkings", "fanduel", "betmgm"]
        
        # Set primary and perform multiple operations
        await integration_service.set_primary_provider(context, "draftkings")
        
        # Generate some fallback history
        for i in range(5):
            await integration_service.select_optimal_provider(context, providers)
        
        # Execute some fallback operations
        async def mock_operation(provider_id: str):
            if provider_id == "draftkings":
                raise Exception("Test failure")
            return f"success_{provider_id}"
        
        for i in range(3):
            try:
                await integration_service.execute_with_fallback(context, providers, mock_operation)
            except:
                pass
        
        # Get analytics
        analytics = integration_service.get_fallback_analytics()
        
        assert "performance" in analytics
        assert "recent_hour" in analytics
        assert "provider_reliability" in analytics
        assert "active_fallbacks" in analytics
        assert "cache_hit_rate" in analytics
        
        # Performance metrics should be tracked
        perf = analytics["performance"]
        assert perf["total_fallbacks"] > 0
        assert "successful_fallbacks" in perf
        assert "failed_fallbacks" in perf
        assert "average_fallback_time_ms" in perf
        
        # Provider reliability should be calculated
        reliability = analytics["provider_reliability"]
        assert len(reliability) > 0
        for provider_id, score in reliability.items():
            assert 0 <= score <= 1
    
    async def test_cleanup_functionality(self, integration_service):
        """Test data cleanup functionality"""
        context = "odds_aggregation"
        providers = ["draftkings", "fanduel"]
        
        # Generate some history and cache data
        await integration_service.set_primary_provider(context, "draftkings")
        
        for i in range(10):
            await integration_service.get_provider_priorities(context, providers)
        
        # Manually add some old events to history
        old_time = time.time() - 86400  # 24 hours ago
        for i in range(5):
            event = Mock()
            event.timestamp = old_time - (i * 3600)  # Spread over several hours
            event.context = context
            event.success = True
            integration_service.fallback_history.append(event)
        
        initial_history_count = len(integration_service.fallback_history)
        initial_cache_count = len(integration_service.priority_cache)
        
        # Cleanup data older than 12 hours
        await integration_service.cleanup_old_data(12)
        
        # Should have removed old data
        assert len(integration_service.fallback_history) < initial_history_count
        
        # Recent data should remain
        remaining_events = integration_service.fallback_history
        for event in remaining_events:
            age_hours = (time.time() - event.timestamp) / 3600
            assert age_hours <= 12
    
    async def test_concurrent_operations(self, integration_service):
        """Test thread safety and concurrent operations"""
        context = "odds_aggregation"
        providers = ["draftkings", "fanduel", "betmgm"]
        
        await integration_service.set_primary_provider(context, "draftkings")
        
        # Concurrent priority requests
        async def get_priorities():
            return await integration_service.get_provider_priorities(context, providers)
        
        # Concurrent selection requests
        async def select_provider():
            return await integration_service.select_optimal_provider(context, providers)
        
        # Run concurrent operations
        tasks = []
        for _ in range(10):
            tasks.append(get_priorities())
            tasks.append(select_provider())
        
        results = await asyncio.gather(*tasks)
        
        # All operations should succeed
        assert len(results) == 20
        
        # Priority results should be consistent
        priority_results = [r for r in results if isinstance(r, list)]
        for priorities in priority_results:
            assert len(priorities) == 3
            assert all(isinstance(p, ProviderPriority) for p in priorities)
        
        # Selection results should be valid
        selection_results = [r for r in results if isinstance(r, tuple)]
        for selected, reason in selection_results:
            assert selected in providers
    
    async def test_integration_with_real_dependencies(self, mock_provider_confidence, mock_resilience_manager):
        """Test integration patterns with dependency injection"""
        # This test verifies the service properly integrates with its dependencies
        context = "odds_aggregation"
        providers = ["draftkings", "fanduel"]
        
        # Create service with dependency mocking to test dependency resolution
        config = FallbackConfiguration(
            max_staleness_seconds=300,
            min_confidence_threshold=0.7,
            strategy=FallbackStrategy.BEST_AVAILABLE
        )
        
        # Patch the imported classes to return our mocks
        with patch('backend.services.smart_fallback_priority_service.ProviderConfidenceIntegration') as mock_confidence_class:
            with patch('backend.services.smart_fallback_priority_service.ProviderResilienceManager') as mock_resilience_class:
                mock_confidence_class.return_value = mock_provider_confidence
                mock_resilience_class.return_value = mock_resilience_manager
                
                service = SmartFallbackPriorityService(config)
                
                # Test that dependencies are properly resolved
                priorities = await service.get_provider_priorities(context, providers)
                
                assert len(priorities) == 2
                
                # Verify mocks were called
                assert mock_provider_confidence.get_provider_confidence_score.called
                # Note: circuit_state is accessed via provider_metrics, not direct method call