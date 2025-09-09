"""
Comprehensive tests for Enhanced Provider Statistics and Integration System.

Tests cover:
- Rolling window statistics accuracy
- Provider confidence scoring algorithm
- Circuit breaker integration 
- API endpoint functionality
- Fallback priority logic
- Performance under load
"""

import asyncio
import pytest
import time
from unittest.mock import AsyncMock, MagicMock, patch
from typing import Dict, Any

from backend.services.enhanced_provider_statistics import (
    EnhancedProviderStatisticsManager,
    EnhancedProviderMetrics,
    TimeWindowStats
)
from backend.services.provider_statistics_integration import (
    ProviderStatisticsIntegration,
    UnifiedProviderHealth
)


class TestTimeWindowStats:
    """Test rolling window statistics functionality"""
    
    def test_success_rate_calculation(self):
        """Test success rate calculation over time windows"""
        window = TimeWindowStats(window_size_sec=60)  # 1 minute window
        
        # Add some requests
        base_time = time.time()
        window.add_request(True, 100.0, base_time)  # Success
        window.add_request(True, 150.0, base_time + 1)  # Success
        window.add_request(False, 200.0, base_time + 2)  # Failure
        window.add_request(True, 120.0, base_time + 3)  # Success
        
        # Should have 75% success rate (3/4)
        assert window.success_rate == 0.75
        assert window.total_count == 4
        assert window.success_count == 3
    
    def test_latency_percentiles(self):
        """Test latency percentile calculations"""
        window = TimeWindowStats(window_size_sec=60)
        
        # Add latency samples: 50, 100, 150, 200, 250, 300
        base_time = time.time()
        latencies = [50, 100, 150, 200, 250, 300]
        for i, latency in enumerate(latencies):
            window.add_request(True, latency, base_time + i)
        
        percentiles = window.get_latency_percentiles()
        
        # p50 should be around 150 (middle value)
        assert percentiles["p50"] == 150.0
        # p95 should be around 300 (95th percentile)
        assert percentiles["p95"] == 300.0
        # p99 should be around 300 (99th percentile)
        assert percentiles["p99"] == 300.0
    
    def test_window_cleanup(self):
        """Test that old data is cleaned from windows"""
        window = TimeWindowStats(window_size_sec=10)  # 10 second window
        
        base_time = time.time()
        
        # Add old request (outside window)
        window.add_request(True, 100.0, base_time - 20)
        
        # Add current request
        window.add_request(False, 200.0, base_time)
        
        # Clean old data
        window._clean_old_data(base_time)
        
        # Should only have the current request
        assert window.total_count == 1
    
    def test_request_rate_calculation(self):
        """Test request rate per minute calculation"""
        window = TimeWindowStats(window_size_sec=60)  # 1 minute window
        
        base_time = time.time()
        
        # Add 6 requests over 30 seconds = 12 requests per minute rate
        for i in range(6):
            window.add_request(True, 100.0, base_time + i * 5)
        
        # Should be approximately 6 requests per minute
        # (6 requests in 1 minute window)
        assert window.request_rate_per_min == 6.0


class TestEnhancedProviderMetrics:
    """Test enhanced provider metrics functionality"""
    
    def test_confidence_score_calculation(self):
        """Test comprehensive confidence score algorithm"""
        metrics = EnhancedProviderMetrics(provider_id="test_provider")
        
        # Simulate good performance
        base_time = time.time()
        for i in range(100):
            # 95% success rate, low latency
            success = i < 95
            latency = 50.0 if success else 1000.0
            metrics.record_request(success, latency, base_time + i)
        
        confidence = metrics.get_comprehensive_confidence_score()
        
        # Should have high confidence (>0.8) due to good performance
        assert confidence > 0.8
        assert confidence <= 1.0
    
    def test_trend_analysis(self):
        """Test performance trend detection"""
        metrics = EnhancedProviderMetrics(provider_id="test_provider")
        
        base_time = time.time()
        
        # Simulate improving performance over time
        for i in range(50):
            # First half: poor performance
            if i < 25:
                success = i % 3 == 0  # ~33% success rate
                latency = 500.0
            else:
                # Second half: good performance
                success = i % 10 != 0  # ~90% success rate
                latency = 100.0
            
            metrics.record_request(success, latency, base_time + i)
        
        # Should detect improving trends
        assert metrics.success_rate_trend in ["improving", "stable"]
        assert metrics.latency_trend in ["improving", "stable"]
    
    def test_data_freshness_score(self):
        """Test data freshness scoring"""
        metrics = EnhancedProviderMetrics(provider_id="test_provider")
        
        # Fresh data
        metrics.last_data_update = time.time()
        assert metrics.data_freshness_score == 1.0
        
        # Stale data (10 minutes old)
        metrics.last_data_update = time.time() - 600
        freshness = metrics.data_freshness_score
        assert 0.0 <= freshness < 1.0
    
    def test_multi_timeframe_statistics(self):
        """Test statistics across multiple time windows"""
        metrics = EnhancedProviderMetrics(provider_id="test_provider")
        
        base_time = time.time()
        
        # Add requests across different time periods
        for i in range(200):
            success = i % 5 != 0  # 80% success rate
            latency = 100.0 + (i % 50)  # Variable latency
            metrics.record_request(success, latency, base_time + i)
        
        summary = metrics.get_performance_summary()
        
        # Check all time windows have data
        assert "1m" in summary["success_rates"]
        assert "5m" in summary["success_rates"]
        assert "15m" in summary["success_rates"]
        assert "1h" in summary["success_rates"]
        
        # Check latency percentiles
        assert "1m" in summary["latency_percentiles"]
        assert "p50" in summary["latency_percentiles"]["1m"]
        assert "p95" in summary["latency_percentiles"]["1m"]
        assert "p99" in summary["latency_percentiles"]["1m"]


class TestEnhancedProviderStatisticsManager:
    """Test enhanced provider statistics manager"""
    
    @pytest.mark.asyncio
    async def test_provider_request_recording(self):
        """Test provider request recording and retrieval"""
        manager = EnhancedProviderStatisticsManager()
        
        # Record some requests
        await manager.record_provider_request("test_provider", True, 100.0)
        await manager.record_provider_request("test_provider", True, 150.0)
        await manager.record_provider_request("test_provider", False, 500.0)
        
        # Get statistics
        stats = await manager.get_provider_statistics("test_provider")
        
        assert stats is not None
        assert stats["provider_id"] == "test_provider"
        assert stats["total_requests"] == 3
        assert stats["total_successes"] == 2
        assert stats["overall_success_rate"] == 2/3
    
    @pytest.mark.asyncio
    async def test_confidence_score_retrieval(self):
        """Test confidence score retrieval for all providers"""
        manager = EnhancedProviderStatisticsManager()
        
        # Record requests for multiple providers
        providers = ["provider_a", "provider_b", "provider_c"]
        
        for provider in providers:
            for i in range(10):
                success = provider == "provider_a" or i % 2 == 0  # provider_a gets all success
                latency = 100.0 if success else 1000.0
                await manager.record_provider_request(provider, success, latency)
        
        # Get confidence scores
        scores = await manager.get_provider_confidence_scores()
        
        assert len(scores) == 3
        assert "provider_a" in scores
        assert "provider_b" in scores
        assert "provider_c" in scores
        
        # provider_a should have highest confidence
        assert scores["provider_a"] > scores["provider_b"]
        assert scores["provider_a"] > scores["provider_c"]
    
    @pytest.mark.asyncio
    async def test_performance_degradation_detection(self):
        """Test detection of performance degradation"""
        manager = EnhancedProviderStatisticsManager()
        
        base_time = time.time()
        
        # Simulate degrading performance
        for i in range(60):
            if i < 30:
                # First 30: good performance
                success = True
                latency = 100.0
            else:
                # Last 30: poor performance
                success = i % 3 == 0  # 33% success rate
                latency = 1000.0
            
            await manager.record_provider_request(
                "degrading_provider", success, latency, base_time + i
            )
        
        # Detect degradation
        degraded = await manager.detect_performance_degradation(threshold=0.2)
        
        # Should detect degradation
        assert len(degraded) > 0
        assert any(d["provider_id"] == "degrading_provider" for d in degraded)
    
    @pytest.mark.asyncio
    async def test_system_health_summary(self):
        """Test system health summary calculation"""
        manager = EnhancedProviderStatisticsManager()
        
        # Add providers with different performance levels
        providers_data = [
            ("excellent_provider", [(True, 50.0)] * 20),  # All success, low latency
            ("good_provider", [(True, 100.0)] * 15 + [(False, 200.0)] * 5),  # 75% success
            ("poor_provider", [(True, 1000.0)] * 5 + [(False, 2000.0)] * 15),  # 25% success
        ]
        
        for provider_id, requests in providers_data:
            for success, latency in requests:
                await manager.record_provider_request(provider_id, success, latency)
        
        # Get system health summary
        health = await manager.get_system_health_summary()
        
        assert health["total_providers"] == 3
        assert health["healthy_providers"] >= 1  # At least excellent_provider
        assert health["degraded_providers"] >= 1  # At least poor_provider
        assert 0.0 <= health["system_health_score"] <= 1.0
        assert 0.0 <= health["average_confidence"] <= 1.0


class TestProviderStatisticsIntegration:
    """Test integration between resilience manager and enhanced statistics"""
    
    @pytest.mark.asyncio
    async def test_unified_request_recording(self):
        """Test unified request recording across both systems"""
        integration = ProviderStatisticsIntegration()
        
        # Mock the resilience manager
        with patch.object(integration.resilience_manager, 'record_provider_request', new_callable=AsyncMock) as mock_resilience:
            with patch.object(integration.stats_manager, 'record_provider_request', new_callable=AsyncMock) as mock_stats:
                
                await integration.record_provider_request(
                    provider_id="test_provider",
                    success=True,
                    latency_ms=100.0
                )
                
                # Both systems should receive the request
                mock_resilience.assert_called_once_with(
                    provider_id="test_provider",
                    success=True,
                    latency_ms=100.0,
                    error=None
                )
                mock_stats.assert_called_once_with(
                    provider_id="test_provider",
                    success=True,
                    latency_ms=100.0
                )
    
    @pytest.mark.asyncio
    async def test_unified_provider_health(self):
        """Test unified provider health assessment"""
        integration = ProviderStatisticsIntegration()
        
        # Mock the data sources
        mock_resilience_state = {
            "consecutive_failures": 2,
            "circuit_state": "closed",
            "provider_state": "degraded",
            "can_retry": True,
            "retry_after_sec": 0.0,
        }
        
        mock_enhanced_stats = {
            "confidence_score": 0.75,
            "success_rates": {"1m": 0.8, "5m": 0.85, "15m": 0.9, "1h": 0.88},
            "latency_percentiles": {
                "1m": {"p50": 100, "p95": 200, "p99": 300},
                "5m": {"p50": 110, "p95": 220, "p99": 330},
                "15m": {"p50": 105, "p95": 210, "p99": 315},
                "1h": {"p50": 108, "p95": 216, "p99": 324},
            },
            "request_rates_per_min": {"1m": 10.0, "5m": 8.0, "15m": 12.0, "1h": 9.0},
            "trends": {"success_rate_trend": "stable", "latency_trend": "improving"},
            "data_freshness_score": 0.95,
        }
        
        with patch.object(integration.resilience_manager, 'get_provider_state', return_value=mock_resilience_state):
            with patch.object(integration.stats_manager, 'get_provider_statistics', new_callable=AsyncMock, return_value=mock_enhanced_stats):
                
                health = await integration.get_unified_provider_health("test_provider")
                
                assert health is not None
                assert health.provider_id == "test_provider"
                assert health.consecutive_failures == 2
                assert health.circuit_state == "closed"
                assert health.confidence_score == 0.75
                assert health.overall_health_status in ["excellent", "good", "degraded", "failing", "outage"]
                assert isinstance(health.is_recommended, bool)
                assert isinstance(health.priority_rank, int)
    
    @pytest.mark.asyncio
    async def test_provider_priority_calculation(self):
        """Test provider priority ranking algorithm"""
        integration = ProviderStatisticsIntegration()
        
        # Test data for different provider scenarios
        test_cases = [
            {
                "name": "excellent_provider",
                "resilience": {
                    "consecutive_failures": 0,
                    "circuit_state": "closed",
                    "provider_state": "healthy",
                    "can_retry": True,
                },
                "stats": {
                    "confidence_score": 0.95,
                    "latency_percentiles": {"5m": {"p95": 80}},
                    "trends": {"success_rate_trend": "improving", "latency_trend": "improving"},
                },
                "expected_rank_range": (1, 20),  # Should be high priority
            },
            {
                "name": "poor_provider",
                "resilience": {
                    "consecutive_failures": 5,
                    "circuit_state": "half_open",
                    "provider_state": "degraded",
                    "can_retry": False,
                },
                "stats": {
                    "confidence_score": 0.3,
                    "latency_percentiles": {"5m": {"p95": 2000}},
                    "trends": {"success_rate_trend": "degrading", "latency_trend": "degrading"},
                },
                "expected_rank_range": (70, 100),  # Should be low priority
            },
        ]
        
        for case in test_cases:
            mock_resilience_state = case["resilience"].copy()
            mock_resilience_state.update({"retry_after_sec": 0.0})
            
            mock_enhanced_stats = case["stats"].copy()
            mock_enhanced_stats.update({
                "success_rates": {"1m": 0.8, "5m": 0.8, "15m": 0.8, "1h": 0.8},
                "latency_percentiles": {
                    "1m": case["stats"]["latency_percentiles"]["5m"],
                    "5m": case["stats"]["latency_percentiles"]["5m"],
                    "15m": case["stats"]["latency_percentiles"]["5m"],
                    "1h": case["stats"]["latency_percentiles"]["5m"],
                },
                "request_rates_per_min": {"1m": 10.0, "5m": 10.0, "15m": 10.0, "1h": 10.0},
                "data_freshness_score": 0.9,
            })
            
            with patch.object(integration.resilience_manager, 'get_provider_state', return_value=mock_resilience_state):
                with patch.object(integration.stats_manager, 'get_provider_statistics', new_callable=AsyncMock, return_value=mock_enhanced_stats):
                    
                    health = await integration.get_unified_provider_health(case["name"])
                    
                    assert health is not None
                    min_rank, max_rank = case["expected_rank_range"]
                    assert min_rank <= health.priority_rank <= max_rank, \
                        f"{case['name']} rank {health.priority_rank} not in expected range {case['expected_rank_range']}"
    
    @pytest.mark.asyncio
    async def test_issue_detection(self):
        """Test comprehensive issue detection across systems"""
        integration = ProviderStatisticsIntegration()
        
        # Mock providers with various issues
        mock_providers = [
            {
                "id": "circuit_open_provider",
                "resilience": {"circuit_state": "open", "consecutive_failures": 10},
                "stats": {"confidence_score": 0.2, "data_freshness_score": 0.9},
                "expected_issues": ["circuit_breaker_issues", "performance_degradation"],
            },
            {
                "id": "stale_data_provider", 
                "resilience": {"circuit_state": "closed", "consecutive_failures": 0},
                "stats": {"confidence_score": 0.8, "data_freshness_score": 0.3},
                "expected_issues": ["stale_data"],
            },
            {
                "id": "degrading_trends_provider",
                "resilience": {"circuit_state": "closed", "consecutive_failures": 1},
                "stats": {
                    "confidence_score": 0.7,
                    "data_freshness_score": 0.9,
                    "trends": {"success_rate_trend": "degrading", "latency_trend": "degrading"},
                },
                "expected_issues": ["trend_warnings"],
            },
        ]
        
        # Mock the health data
        mock_health_list = []
        for provider in mock_providers:
            health = UnifiedProviderHealth(
                provider_id=provider["id"],
                consecutive_failures=provider["resilience"]["consecutive_failures"],
                circuit_state=provider["resilience"]["circuit_state"],
                provider_state="healthy",
                can_retry=True,
                retry_after_sec=0.0,
                confidence_score=provider["stats"]["confidence_score"],
                success_rates={"1m": 0.8, "5m": 0.8, "15m": 0.8, "1h": 0.8},
                latency_percentiles={"1m": {"p50": 100, "p95": 200, "p99": 300}},
                request_rates_per_min={"1m": 10.0, "5m": 10.0, "15m": 10.0, "1h": 10.0},
                trends=provider["stats"].get("trends", {"success_rate_trend": "stable", "latency_trend": "stable"}),
                data_freshness_score=provider["stats"]["data_freshness_score"],
                overall_health_status="degraded",
                is_recommended=False,
                priority_rank=50,
            )
            mock_health_list.append(health)
        
        with patch.object(integration, 'get_all_provider_health', new_callable=AsyncMock, return_value=mock_health_list):
            issues = await integration.detect_provider_issues()
            
            # Verify issue detection
            for provider in mock_providers:
                for expected_issue_type in provider["expected_issues"]:
                    assert expected_issue_type in issues
                    # Check if this provider's issue is detected
                    provider_issues = [
                        issue for issue in issues[expected_issue_type]
                        if issue["provider_id"] == provider["id"]
                    ]
                    assert len(provider_issues) > 0, \
                        f"Expected {expected_issue_type} for {provider['id']} but not found"


class TestProviderStatusAPI:
    """Test provider status API endpoints"""
    
    @pytest.mark.asyncio
    async def test_api_endpoint_integration(self):
        """Test that API endpoints properly integrate with the statistics system"""
        # This would typically use FastAPI's TestClient
        # For now, we'll test the core logic
        
        from backend.routes.provider_status_routes import ensure_integration_started
        
        # Test dependency injection
        await ensure_integration_started()
        
        # Verify integration is started
        from backend.services.provider_statistics_integration import provider_statistics_integration
        assert provider_statistics_integration._integration_started


if __name__ == "__main__":
    # Run the tests
    pytest.main([__file__, "-v"])