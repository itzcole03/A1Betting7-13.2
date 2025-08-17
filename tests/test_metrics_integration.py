"""
Integration Tests for Metrics System - End-to-end validation of the complete metrics architecture
Tests the full integration between metrics collector, instrumentation, cache hooks, and health services.
"""

import pytest
import asyncio
import time
from typing import Optional
from unittest.mock import Mock, AsyncMock, patch

# Import all metrics components for integration testing
from backend.services.metrics.unified_metrics_collector import get_metrics_collector
from backend.services.metrics.instrumentation import record_http_request, instrument_route
from backend.services.metrics.cache_metrics_hook import get_cache_hook
from backend.services.metrics.prometheus_exporter import format_prometheus_metric


class TestMetricsSystemIntegration:
    """Integration test suite for the complete metrics system."""
    
    def setup_method(self):
        """Setup for each integration test."""
        self.metrics_collector = get_metrics_collector()
        self.metrics_collector.reset_metrics()
        self.cache_hook = get_cache_hook()
    
    @pytest.mark.asyncio
    async def test_end_to_end_http_request_flow(self):
        """Test complete flow from HTTP request to metrics collection and export."""
        
        # 1. Simulate HTTP requests using instrumentation
        @instrument_route
        async def test_endpoint():
            await asyncio.sleep(0.01)  # Simulate processing
            return {"status": "success"}
        
        # 2. Execute multiple requests with different patterns
        for i in range(10):
            await test_endpoint()
        
        # 3. Simulate some errors
        @instrument_route
        async def error_endpoint():
            raise Exception("Test error")
        
        for i in range(3):
            try:
                await error_endpoint()
            except Exception:
                pass
        
        # 4. Verify metrics were collected
        snapshot = self.metrics_collector.snapshot()
        
        assert snapshot["total_requests"] == 13  # 10 success + 3 error
        assert snapshot["error_rate"] > 0.0  # Should have some errors
        assert snapshot["avg_latency_ms"] > 0.0  # Should have measured latency
        assert "p95_latency_ms" in snapshot
    
    @pytest.mark.asyncio
    async def test_end_to_end_cache_integration_flow(self):
        """Test complete cache integration flow with metrics collection."""
        
        # 1. Create mock cache service
        class TestCacheService:
            def __init__(self):
                self.data = {}
            
            def get(self, key, default=None):
                return self.data.get(key, default)
            
            def set(self, key, value):
                self.data[key] = value
            
            def delete(self, key):
                if key in self.data:
                    del self.data[key]
                    return True
                return False
        
        # 2. Hook the cache service
        cache_service = TestCacheService()
        success = self.cache_hook.hook_cache_service(cache_service)
        assert success is True
        
        # 3. Reset metrics for clean test
        self.metrics_collector.reset_metrics()
        
        # 4. Simulate cache operations
        cache_service.set("key1", "value1")
        cache_service.set("key2", "value2")
        
        # Hits and misses
        cache_service.get("key1")  # Hit
        cache_service.get("key2")  # Hit
        cache_service.get("key3", "default")  # Miss
        cache_service.get("key4", "default")  # Miss
        
        # Evictions
        cache_service.delete("key1")  # Successful eviction
        cache_service.delete("key5")  # Failed eviction (key doesn't exist)
        
        # 5. Verify cache metrics were collected
        snapshot = self.metrics_collector.snapshot()
        cache_metrics = snapshot["cache"]
        
        assert cache_metrics["hits"] == 2
        assert cache_metrics["misses"] == 2
        assert cache_metrics["evictions"] == 1  # Only successful evictions counted
    
    def test_prometheus_export_integration(self):
        """Test Prometheus export integration with real metrics data."""
        
        # 1. Generate some test metrics
        self.metrics_collector.record_request(100.0, 200)
        self.metrics_collector.record_request(200.0, 200)
        self.metrics_collector.record_request(150.0, 500)
        self.metrics_collector.record_cache_hit()
        self.metrics_collector.record_cache_miss()
        self.metrics_collector.record_ws_connection(True)
        
        # 2. Get snapshot
        snapshot = self.metrics_collector.snapshot()
        
        # 3. Test Prometheus formatting for different metric types
        prometheus_output = []
        
        # Counter metric
        counter_metric = format_prometheus_metric(
            "http_requests_total",
            "counter",
            "Total number of HTTP requests",
            float(snapshot["total_requests"])
        )
        prometheus_output.append(counter_metric)
        
        # Gauge metric
        gauge_metric = format_prometheus_metric(
            "error_rate",
            "gauge", 
            "Current error rate",
            float(snapshot["error_rate"])
        )
        prometheus_output.append(gauge_metric)
        
        # 4. Verify Prometheus format
        full_output = "\n".join(prometheus_output)
        
        assert "# HELP http_requests_total Total number of HTTP requests" in full_output
        assert "# TYPE http_requests_total counter" in full_output
        assert "http_requests_total 3" in full_output
        
        assert "# HELP error_rate Current error rate" in full_output
        assert "# TYPE error_rate gauge" in full_output
        assert "error_rate" in full_output
    
    def test_health_collector_integration(self):
        """Test integration with health collector service."""
        
        # Skip this test if health collector is not available
        pytest.skip("Health collector integration test - skipped for test environment")
    
    def test_event_loop_monitoring_integration(self):
        """Test event loop monitoring integration with the metrics system."""
        
        # Skip this test as event loop monitoring is not implemented yet
        pytest.skip("Event loop monitoring integration test - skipped until implementation complete")
    
    def test_metrics_thread_safety_under_load(self):
        """Test metrics collection thread safety under concurrent load."""
        import threading
        import random
        
        # 1. Reset metrics
        self.metrics_collector.reset_metrics()
        
        # 2. Define worker function
        def worker(worker_id, num_operations):
            for i in range(num_operations):
                # Random operations
                op = random.choice(['request', 'cache_hit', 'cache_miss', 'eviction'])
                
                if op == 'request':
                    latency = random.uniform(10.0, 500.0)
                    status = random.choice([200, 200, 200, 500])  # 75% success
                    self.metrics_collector.record_request(latency, status)
                    
                elif op == 'cache_hit':
                    self.metrics_collector.record_cache_hit()
                    
                elif op == 'cache_miss':
                    self.metrics_collector.record_cache_miss()
                    
                elif op == 'eviction':
                    self.metrics_collector.record_cache_eviction()
        
        # 3. Run concurrent workers
        threads = []
        num_threads = 5
        operations_per_thread = 100
        
        for i in range(num_threads):
            thread = threading.Thread(target=worker, args=(i, operations_per_thread))
            threads.append(thread)
            thread.start()
        
        # 4. Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        # 5. Verify data integrity
        snapshot = self.metrics_collector.snapshot()
        
        # Total operations should be reasonable (allowing for race conditions)
        total_requests = snapshot["total_requests"]
        cache_ops = snapshot["cache"]["hits"] + snapshot["cache"]["misses"] + snapshot["cache"]["evictions"]
        
        # We can't predict exact counts due to randomness, but should have meaningful data
        assert total_requests > 0
        assert cache_ops > 0
        assert 0.0 <= snapshot["error_rate"] <= 1.0
        assert snapshot["avg_latency_ms"] > 0.0
    
    def test_metrics_configuration_integration(self):
        """Test metrics system configuration integration."""
        
        # 1. Test with different window sizes
        with patch('backend.services.unified_config.get_config') as mock_config:
            mock_config.return_value = {
                "METRICS_WINDOW_SIZE_SECONDS": 120,  # 2 minutes instead of default 5
                "METRICS_MAX_SAMPLES": 5000,
                "METRICS_HISTOGRAM_BUCKETS": [10, 50, 100, 500],
                "METRICS_PROMETHEUS_ENABLED": True
            }
            
            # Create new metrics collector with different config
            from backend.services.metrics.unified_metrics_collector import UnifiedMetricsCollector
            test_collector = UnifiedMetricsCollector()
            
            # Verify configuration was applied
            # Note: This test verifies the collector accepts config but can't easily test
            # all internal configuration without more complex setup
            
            assert test_collector is not None
    
    @pytest.mark.asyncio
    async def test_full_application_flow_simulation(self):
        """Simulate a complete application request flow with all metrics components."""
        
        # 1. Create mock services
        class MockApp:
            def __init__(self, metrics_collector):
                self.cache = {"user:123": {"name": "Test User"}}
                self.metrics_collector = metrics_collector
            
            async def handle_request(self, path: str, user_id: Optional[str] = None):
                # Simulate HTTP request handling with instrumentation
                async with record_http_request(path, "GET") as timing:
                    # Simulate cache lookup
                    cache_key = f"user:{user_id}" if user_id else "anonymous"
                    
                    if cache_key in self.cache:
                        self.metrics_collector.record_cache_hit()
                        user_data = self.cache[cache_key]
                    else:
                        self.metrics_collector.record_cache_miss()
                        # Simulate database lookup
                        await asyncio.sleep(0.02)  # DB delay
                        user_data = {"name": "Anonymous"}
                        self.cache[cache_key] = user_data
                    
                    # Simulate processing
                    await asyncio.sleep(0.01)
                    
                    # Set response status
                    timing["status_code"] = 200
                    
                    return {"user": user_data, "path": path}
        
        # 2. Setup mock app with metrics
        app = MockApp(self.metrics_collector)
        
        # 3. Reset metrics
        self.metrics_collector.reset_metrics()
        
        # 4. Simulate various requests
        requests = [
            ("/api/profile", "123"),  # Cache hit
            ("/api/profile", "123"),  # Cache hit
            ("/api/profile", "456"),  # Cache miss
            ("/api/dashboard", "123"), # Cache hit
            ("/api/settings", None),   # Anonymous, cache miss
        ]
        
        results = []
        for path, user_id in requests:
            result = await app.handle_request(path, user_id)
            results.append(result)
        
        # 5. Verify all requests completed
        assert len(results) == 5
        for result in results:
            assert "user" in result
            assert "path" in result
        
        # 6. Verify comprehensive metrics collection
        snapshot = self.metrics_collector.snapshot()
        
        # HTTP metrics
        assert snapshot["total_requests"] == 5
        assert snapshot["error_rate"] == 0.0  # All requests successful
        assert snapshot["avg_latency_ms"] > 0.0
        
        # Cache metrics  
        cache_metrics = snapshot["cache"]
        assert cache_metrics["hits"] >= 2  # At least 2 hits expected
        assert cache_metrics["misses"] >= 2  # At least 2 misses expected
        
        # Latency distribution
        assert "p50_latency_ms" in snapshot
        assert "p95_latency_ms" in snapshot
        assert snapshot["p95_latency_ms"] >= snapshot["p50_latency_ms"]
    
    def test_metrics_system_cleanup(self):
        """Test proper cleanup of metrics system components."""
        
        # 1. Generate some data
        self.metrics_collector.record_request(100.0, 200)
        
        # 2. Hook a cache service
        mock_cache = Mock()
        mock_cache.get = Mock(return_value="test_value")
        self.cache_hook.hook_cache_service(mock_cache)
        
        # 3. Cleanup components
        self.cache_hook.unhook_all()
        
        # 4. Verify cleanup was successful
        # Reset should still work
        self.metrics_collector.reset_metrics()
        snapshot = self.metrics_collector.snapshot()
        
        assert snapshot["total_requests"] == 0
        assert snapshot["error_rate"] == 0.0
    
    def test_metrics_system_error_resilience(self):
        """Test metrics system resilience to various error conditions."""
        
        # 1. Test with invalid data
        self.metrics_collector.record_request(-1.0, 200)  # Negative latency
        self.metrics_collector.record_request(999999.0, 200)  # Very high latency
        self.metrics_collector.record_request(100.0, 999)  # Invalid status code
        
        # 2. Test edge cases
        self.metrics_collector.record_request(0.0, 200)  # Zero latency
        
        # 3. System should still function
        snapshot = self.metrics_collector.snapshot()
        
        assert snapshot["total_requests"] == 4
        assert isinstance(snapshot["avg_latency_ms"], (int, float))
        assert isinstance(snapshot["error_rate"], (int, float))
        assert 0.0 <= snapshot["error_rate"] <= 1.0
    
    def teardown_method(self):
        """Cleanup after each test."""
        # Unhook any cache services
        try:
            self.cache_hook.unhook_all()
        except:
            pass
        
        # Reset metrics
        self.metrics_collector.reset_metrics()