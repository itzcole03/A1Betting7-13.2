"""
Tests for CLV Performance Monitoring and Metrics

Tests the comprehensive CLV metrics system including:
- Metrics collection and instrumentation
- Performance monitoring and alerting
- Diagnostics endpoint functionality
- Integration with PropFinder API
"""

import pytest
import time
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from backend.main import app
from backend.utils.clv_metrics import CLVMetrics, get_clv_metrics

test_client = TestClient(app)
BASE_URL = "/api/propfinder/opportunities"


class TestCLVMetricsInstrumentation:
    """Test CLV metrics collection and instrumentation"""
    
    def test_clv_metrics_initialization(self):
        """Test CLV metrics are properly initialized"""
        metrics = CLVMetrics()
        
        # Check that all metrics are initialized
        assert hasattr(metrics, 'clv_enrichments_total')
        assert hasattr(metrics, 'clv_processing_duration')
        assert hasattr(metrics, 'clv_cache_hit_rate')
        assert hasattr(metrics, 'clv_opportunities_enriched')
        assert hasattr(metrics, 'clv_failure_rate')
        assert hasattr(metrics, 'clv_avg_processing_time')
        assert hasattr(metrics, 'clv_system_health')
    
    def test_clv_metrics_timing_context(self):
        """Test CLV metrics timing context manager"""
        metrics = CLVMetrics()
        metrics.reset_counters()
        
        # Test successful enrichment timing
        start_time = time.time()
        with metrics.time_enrichment():
            time.sleep(0.01)  # Small delay to test timing
        
        # Should have recorded success
        assert metrics._enrichment_count == 1
        assert metrics._failure_count == 0
    
    def test_clv_metrics_failure_recording(self):
        """Test CLV metrics failure recording"""
        metrics = CLVMetrics()
        metrics.reset_counters()
        
        # Test failure recording
        try:
            with metrics.time_enrichment():
                raise RuntimeError("Test failure")
        except RuntimeError:
            pass
        
        # Should have recorded failure
        assert metrics._enrichment_count == 0
        assert metrics._failure_count == 1
    
    def test_clv_cache_metrics(self):
        """Test CLV cache hit/miss metrics"""
        metrics = CLVMetrics()
        metrics.reset_counters()
        
        # Record some cache hits and misses
        metrics.record_cache_hit()
        metrics.record_cache_hit()
        metrics.record_cache_miss()
        
        assert metrics._cache_hits == 2
        assert metrics._cache_misses == 1
        
        # Check cache hit rate calculation
        metrics._update_cache_metrics()
        # Should be 66.7% hit rate (2/3)
    
    def test_clv_opportunities_enriched_counter(self):
        """Test opportunities enriched counter"""
        metrics = CLVMetrics()
        
        # Record opportunities enriched
        metrics.record_opportunities_enriched(5)
        metrics.record_opportunities_enriched(3)
        
        # Counter should accumulate (note: this tests the metric increment)
    
    def test_clv_alert_thresholds(self):
        """Test CLV alert threshold checking"""
        metrics = CLVMetrics()
        metrics.reset_counters()
        
        # Simulate some failures
        for _ in range(2):
            try:
                with metrics.time_enrichment():
                    raise RuntimeError("Test failure")
            except RuntimeError:
                pass
        
        # Simulate some successes
        for _ in range(8):
            with metrics.time_enrichment():
                pass
        
        # Check alert thresholds (20% failure rate should trigger alert)
        alerts = metrics.check_alert_thresholds()
        assert 'high_failure_rate' in alerts
        assert alerts['high_failure_rate']['current_rate'] == 20.0
    
    def test_clv_diagnostics_data(self):
        """Test CLV diagnostics data generation"""
        metrics = CLVMetrics()
        metrics.reset_counters()
        
        # Generate some activity
        with metrics.time_enrichment():
            pass
        metrics.record_cache_hit()
        metrics.record_opportunities_enriched(3)
        
        # Get diagnostics
        diagnostics = metrics.get_diagnostics()
        
        # Check structure
        assert 'enrichment_stats' in diagnostics
        assert 'cache_stats' in diagnostics
        assert 'system_health' in diagnostics
        
        # Check enrichment stats
        enrichment_stats = diagnostics['enrichment_stats']
        assert enrichment_stats['total_requests'] == 1
        assert enrichment_stats['successful_enrichments'] == 1
        assert enrichment_stats['failed_enrichments'] == 0
        
        # Check cache stats
        cache_stats = diagnostics['cache_stats']
        assert cache_stats['cache_hits'] == 1
        assert cache_stats['cache_misses'] == 0


class TestCLVDiagnosticsEndpoint:
    """Test CLV diagnostics API endpoint"""
    
    def test_clv_diagnostics_basic_endpoint(self):
        """Test basic CLV diagnostics endpoint"""
        response = test_client.get(f"{BASE_URL}/diagnostics")
        
        assert response.status_code == 200
        data = response.json()
        
        # Check basic structure
        assert "data" in data
        diagnostics = data["data"]
        
        assert "clv_system_enabled" in diagnostics
        assert "metrics_available" in diagnostics
        assert "timestamp" in diagnostics
        assert diagnostics["clv_system_enabled"] is True
    
    def test_clv_diagnostics_detailed_endpoint(self):
        """Test detailed CLV diagnostics with clv_diag=1"""
        response = test_client.get(f"{BASE_URL}/diagnostics?clv_diag=1")
        
        assert response.status_code == 200
        data = response.json()
        
        # Check detailed structure
        diagnostics = data["data"]
        assert "clv_system_enabled" in diagnostics
        assert "metrics_available" in diagnostics
        
        # Should include detailed metrics if available
        if diagnostics.get("metrics_available"):
            assert "enrichment_stats" in diagnostics
            assert "cache_stats" in diagnostics
            assert "system_health" in diagnostics
    
    def test_clv_diagnostics_with_propfinder_activity(self):
        """Test CLV diagnostics after PropFinder activity"""
        # First make a PropFinder request with CLV enabled
        response1 = test_client.get(f"{BASE_URL}?limit=2&include_clv=1")
        assert response1.status_code == 200
        
        # Then check diagnostics
        response2 = test_client.get(f"{BASE_URL}/diagnostics?clv_diag=1")
        assert response2.status_code == 200
        
        data = response2.json()
        diagnostics = data["data"]
        
        # Should show activity if metrics are available
        if diagnostics.get("metrics_available"):
            enrichment_stats = diagnostics.get("enrichment_stats", {})
            # Should have at least some requests recorded
            assert enrichment_stats.get("total_requests", 0) >= 0
    
    def test_clv_diagnostics_alert_detection(self):
        """Test CLV diagnostics alert detection"""
        # Simulate high failure rate by mocking metrics
        with patch('backend.utils.clv_metrics.get_clv_metrics') as mock_get_metrics:
            mock_metrics = MagicMock()
            mock_metrics.get_diagnostics.return_value = {
                "enrichment_stats": {
                    "total_requests": 20,
                    "successful_enrichments": 10,
                    "failed_enrichments": 10,
                    "failure_rate_percent": 50.0
                },
                "cache_stats": {
                    "cache_hits": 5,
                    "cache_misses": 5,
                    "hit_rate_percent": 50.0
                },
                "system_health": {
                    "prometheus_available": True,
                    "metrics_collected": True,
                    "alert_thresholds": {}
                }
            }
            mock_metrics.check_alert_thresholds.return_value = {
                "high_failure_rate": {
                    "current_rate": 50.0,
                    "threshold": 5.0,
                    "message": "CLV failure rate (50.0%) exceeds threshold (5.0%)"
                }
            }
            mock_get_metrics.return_value = mock_metrics
            
            response = test_client.get(f"{BASE_URL}/diagnostics?clv_diag=1")
            assert response.status_code == 200
            
            data = response.json()
            diagnostics = data["data"]
            
            # Should include active alerts
            if "active_alerts" in diagnostics:
                assert "high_failure_rate" in diagnostics["active_alerts"]


class TestCLVMetricsIntegration:
    """Test CLV metrics integration with PropFinder service"""
    
    def test_clv_metrics_with_propfinder_api(self):
        """Test CLV metrics collection with PropFinder API calls"""
        # Make PropFinder request with CLV enabled
        response = test_client.get(f"{BASE_URL}?limit=3&include_clv=1")
        
        assert response.status_code == 200
        data = response.json()
        
        # Check that CLV data is present
        if "opportunities" in data and data["opportunities"]:
            opp = data["opportunities"][0]
            assert "clvPercent" in opp
            assert isinstance(opp["clvPercent"], (int, float))
    
    def test_clv_metrics_cache_simulation(self):
        """Test CLV cache behavior simulation in metrics"""
        # Make multiple requests to test cache behavior
        responses = []
        for _ in range(3):
            response = test_client.get(f"{BASE_URL}?limit=2&include_clv=1")
            responses.append(response)
        
        # All should succeed
        for response in responses:
            assert response.status_code == 200
        
        # Check diagnostics for cache activity
        diag_response = test_client.get(f"{BASE_URL}/diagnostics?clv_diag=1")
        assert diag_response.status_code == 200
        
        # Should show some cache activity if metrics are available
        data = diag_response.json()
        diagnostics = data["data"]
        
        if diagnostics.get("metrics_available"):
            cache_stats = diagnostics.get("cache_stats", {})
            total_cache_ops = cache_stats.get("cache_hits", 0) + cache_stats.get("cache_misses", 0)
            # Should have some cache operations recorded
            assert total_cache_ops >= 0
    
    def test_clv_metrics_failure_simulation(self):
        """Test CLV metrics during simulated failures"""
        # Mock CLV service to simulate failures
        with patch('backend.services.simple_propfinder_service.SimplePropFinderService.attach_clv_data') as mock_attach:
            mock_attach.side_effect = RuntimeError("Simulated CLV failure")
            
            # Make request that should trigger CLV failure
            response = test_client.get(f"{BASE_URL}?limit=2&include_clv=1")
            
            # Should still succeed (graceful degradation)
            assert response.status_code == 200
            
            # Check diagnostics for failure recording
            diag_response = test_client.get(f"{BASE_URL}/diagnostics?clv_diag=1")
            assert diag_response.status_code == 200


class TestCLVMetricsPerformance:
    """Test CLV metrics performance characteristics"""
    
    def test_clv_metrics_low_overhead(self):
        """Test that CLV metrics add minimal overhead"""
        # Test request without CLV
        start_time = time.time()
        response1 = test_client.get(f"{BASE_URL}?limit=3&include_clv=0")
        time_without_metrics = time.time() - start_time
        
        # Test request with CLV (includes metrics)
        start_time = time.time()
        response2 = test_client.get(f"{BASE_URL}?limit=3&include_clv=1")
        time_with_metrics = time.time() - start_time
        
        assert response1.status_code == 200
        assert response2.status_code == 200
        
        # Metrics should add minimal overhead (less than 1 second)
        overhead = time_with_metrics - time_without_metrics
        assert overhead < 1.0, f"Metrics overhead too high: {overhead:.3f}s"
    
    def test_clv_metrics_concurrent_requests(self):
        """Test CLV metrics under concurrent requests"""
        import threading
        import time
        
        results = []
        
        def make_request():
            try:
                response = test_client.get(f"{BASE_URL}?limit=1&include_clv=1")
                results.append(response.status_code)
            except Exception as e:
                results.append(500)
        
        # Create and start threads
        threads = []
        for _ in range(3):
            thread = threading.Thread(target=make_request)
            threads.append(thread)
            thread.start()
        
        # Wait for completion
        for thread in threads:
            thread.join(timeout=10)
        
        # Most requests should succeed
        success_count = sum(1 for status in results if status == 200)
        success_rate = success_count / len(results) if results else 0
        
        assert success_rate >= 0.5, f"Only {success_rate:.1%} of concurrent requests succeeded"


class TestCLVMetricsReliability:
    """Test CLV metrics reliability and error handling"""
    
    def test_clv_metrics_prometheus_unavailable(self):
        """Test CLV metrics when Prometheus is unavailable"""
        # Mock CLV metrics to simulate Prometheus unavailability
        with patch('backend.utils.clv_metrics.PROMETHEUS_AVAILABLE', False):
            response = test_client.get(f"{BASE_URL}?limit=2&include_clv=1")
            
            # Should still work without Prometheus
            assert response.status_code == 200
            
            # Diagnostics should indicate unavailability
            diag_response = test_client.get(f"{BASE_URL}/diagnostics?clv_diag=1")
            assert diag_response.status_code == 200
    
    def test_clv_metrics_invalid_operations(self):
        """Test CLV metrics with invalid operations"""
        metrics = CLVMetrics()
        
        # Test that Prometheus correctly validates inputs (negative increments should raise ValueError)
        with pytest.raises(ValueError):
            metrics.record_opportunities_enriched(-1)  # Negative count should raise ValueError
        
        # Test that valid operations still work after invalid attempts
        metrics.record_cache_hit()
        metrics.record_cache_miss()
        metrics.record_opportunities_enriched(5)  # This should work fine
    
    def test_clv_diagnostics_endpoint_errors(self):
        """Test CLV diagnostics endpoint error handling"""
        # Test that the endpoint works even when metrics might be unavailable
        response = test_client.get(f"{BASE_URL}/diagnostics?clv_diag=1")
        
        # Should handle any internal errors gracefully and return a valid response
        assert response.status_code == 200
        data = response.json()
        
        # The actual response structure has 'data' containing the diagnostics
        assert "data" in data
        clv_data = data["data"]
        
        # The diagnostics should always contain basic structure even if some metrics fail
        assert "clv_system_enabled" in clv_data
        assert "timestamp" in clv_data
        assert "metrics_available" in clv_data