"""
Tests for Unified Metrics Collector - Production-grade metrics system validation
Comprehensive test coverage for sliding windows, percentiles, event loop monitoring, and instrumentation.
"""

import asyncio
import pytest
import time
from unittest.mock import Mock, patch

# Import the metrics collector and related components
from backend.services.metrics.unified_metrics_collector import (
    UnifiedMetricsCollector, 
    get_metrics_collector
)


class TestUnifiedMetricsCollector:
    """Test suite for the enhanced unified metrics collector."""
    
    def setup_method(self):
        """Setup fresh metrics collector for each test."""
        # Create a new instance for testing
        self.collector = UnifiedMetricsCollector()
    
    def test_singleton_pattern(self):
        """Test that the singleton pattern works correctly."""
        collector1 = UnifiedMetricsCollector.get_instance()
        collector2 = UnifiedMetricsCollector.get_instance()
        collector3 = get_metrics_collector()
        
        assert collector1 is collector2
        assert collector2 is collector3
    
    def test_record_request_basic(self):
        """Test basic request recording functionality."""
        # Record some requests
        self.collector.record_request(100.0, 200)  # Success
        self.collector.record_request(250.0, 200)  # Success
        self.collector.record_request(500.0, 500)  # Error
        
        snapshot = self.collector.snapshot()
        
        assert snapshot["total_requests"] == 3
        assert snapshot["error_rate"] == 1/3  # One error out of three
        assert snapshot["avg_latency_ms"] == (100.0 + 250.0 + 500.0) / 3
    
    def test_latency_percentiles(self):
        """Test percentile calculation with known values."""
        # Record latencies: 100, 200, 300, 400, 500 ms
        latencies = [100.0, 200.0, 300.0, 400.0, 500.0]
        for latency in latencies:
            self.collector.record_request(latency, 200)
        
        snapshot = self.collector.snapshot()
        
        # Test percentiles
        assert snapshot["p50_latency_ms"] == 300.0  # Median
        assert snapshot["p90_latency_ms"] == 500.0  # 90th percentile
        assert snapshot["p95_latency_ms"] == 500.0  # 95th percentile
        assert snapshot["p99_latency_ms"] == 500.0  # 99th percentile
    
    def test_histogram_buckets(self):
        """Test histogram bucket counting."""
        # Record latencies that should fall into different buckets
        test_latencies = [25, 75, 150, 350, 750, 1500, 6000]  # Above last bucket
        
        for latency in test_latencies:
            self.collector.record_request(latency, 200)
        
        snapshot = self.collector.snapshot()
        histogram = snapshot["histogram"]
        
        # Check bucket counts
        assert histogram[25] == 1    # 25ms latency
        assert histogram[100] == 1   # 75ms latency
        assert histogram[200] == 1   # 150ms latency
        assert histogram[500] == 1   # 350ms latency
        assert histogram[1000] == 1  # 750ms latency
        assert histogram[2500] == 1  # 1500ms latency
        assert histogram["+Inf"] == 1  # 6000ms latency (over all buckets)
    
    def test_error_rate_calculation(self):
        """Test error rate calculation with various scenarios."""
        # Test case 1: No requests
        snapshot = self.collector.snapshot()
        assert snapshot["error_rate"] == 0.0
        
        # Test case 2: All successful requests
        for _ in range(10):
            self.collector.record_request(100.0, 200)
        
        snapshot = self.collector.snapshot()
        assert snapshot["error_rate"] == 0.0
        
        # Test case 3: Mixed success/error (2 errors out of 10)
        self.collector.record_request(100.0, 500)  # Error
        self.collector.record_request(100.0, 500)  # Error
        
        snapshot = self.collector.snapshot()
        assert snapshot["error_rate"] == 2/12  # 2 errors out of 12 total
    
    def test_websocket_metrics(self):
        """Test WebSocket connection and message tracking."""
        # Record some WebSocket activity
        self.collector.record_ws_connection(True)   # Open connection
        self.collector.record_ws_connection(True)   # Another open
        self.collector.record_ws_message(5)         # Send 5 messages
        self.collector.record_ws_connection(False)  # Close connection
        
        snapshot = self.collector.snapshot()
        websocket_stats = snapshot["websocket"]
        
        assert websocket_stats["open_connections_estimate"] == 1  # 2 opened - 1 closed
        assert websocket_stats["messages_sent"] == 5
    
    def test_cache_metrics(self):
        """Test cache hit/miss/eviction tracking."""
        # Record cache operations
        self.collector.record_cache_hit()
        self.collector.record_cache_hit()
        self.collector.record_cache_miss()
        self.collector.record_cache_eviction()
        
        snapshot = self.collector.snapshot()
        cache_stats = snapshot["cache"]
        
        assert cache_stats["hits"] == 2
        assert cache_stats["misses"] == 1
        assert cache_stats["evictions"] == 1
        assert cache_stats["hit_rate"] == 2/3  # 2 hits out of 3 operations
    
    def test_cache_hit_rate_edge_cases(self):
        """Test cache hit rate edge cases (0 hits + 0 misses = hit_rate 0)."""
        # Test case: No cache operations
        snapshot = self.collector.snapshot()
        cache_stats = snapshot["cache"]
        assert cache_stats["hit_rate"] == 0.0
        
        # Test case: Only evictions (no hits or misses)
        self.collector.record_cache_eviction()
        snapshot = self.collector.snapshot()
        cache_stats = snapshot["cache"]
        assert cache_stats["hit_rate"] == 0.0  # 0 hits / (0 hits + 0 misses) = 0
    
    @pytest.mark.asyncio
    async def test_event_loop_monitoring(self):
        """Test event loop lag monitoring."""
        # Start event loop monitoring
        await self.collector.start_event_loop_monitor()
        
        # Wait a bit for samples to be collected
        await asyncio.sleep(2.5)  # Should collect at least 2 samples
        
        # Stop monitoring
        await self.collector.stop_event_loop_monitor()
        
        snapshot = self.collector.snapshot()
        event_loop_stats = snapshot["event_loop"]
        
        assert event_loop_stats["sample_count"] >= 1
        assert event_loop_stats["avg_lag_ms"] >= 0.0
        assert event_loop_stats["p95_lag_ms"] >= 0.0
    
    def test_prune_old_samples(self):
        """Test pruning of old samples from sliding window."""
        # Mock time to control sample aging
        with patch('time.time') as mock_time:
            # Start at time 1000
            mock_time.return_value = 1000.0
            
            # Record some samples at time 1000
            self.collector.record_request(100.0, 200)
            self.collector.record_request(200.0, 200)
            
            # Advance time by 6 minutes (beyond default 5-minute window)
            mock_time.return_value = 1000.0 + (6 * 60)
            
            # Force pruning by calling snapshot
            snapshot = self.collector.snapshot()
            
            # New samples should show empty metrics
            assert snapshot["total_requests"] == 2  # Counters don't get pruned
            # But latency calculations should be affected by pruning
            assert len(self.collector._request_samples) == 0  # Samples were pruned
    
    def test_reservoir_sampling_performance(self):
        """Test that reservoir sampling keeps performance bounded with many samples."""
        # Record more samples than max_samples limit
        max_samples = self.collector._max_samples
        
        for i in range(max_samples + 100):
            self.collector.record_request(float(i % 1000), 200)
        
        # Should still perform well
        start_time = time.time()
        snapshot = self.collector.snapshot()
        end_time = time.time()
        
        # Snapshot should complete quickly (under 100ms even with many samples)
        assert (end_time - start_time) < 0.1
        
        # Should have computed percentiles
        assert "p95_latency_ms" in snapshot
        assert snapshot["p95_latency_ms"] >= 0.0
    
    def test_reset_metrics(self):
        """Test metrics reset functionality."""
        # Record some data
        self.collector.record_request(100.0, 200)
        self.collector.record_cache_hit()
        self.collector.record_ws_message()
        
        # Verify data exists
        snapshot = self.collector.snapshot()
        assert snapshot["total_requests"] > 0
        assert snapshot["cache"]["hits"] > 0
        assert snapshot["websocket"]["messages_sent"] > 0
        
        # Reset metrics
        self.collector.reset_metrics()
        
        # Verify all metrics are reset
        snapshot = self.collector.snapshot()
        assert snapshot["total_requests"] == 0
        assert snapshot["cache"]["hits"] == 0
        assert snapshot["websocket"]["messages_sent"] == 0
    
    def test_thread_safety(self):
        """Test thread safety of metrics recording."""
        import threading
        
        def record_metrics():
            for i in range(100):
                self.collector.record_request(float(i), 200)
                self.collector.record_cache_hit()
                self.collector.record_ws_message()
        
        # Create multiple threads recording metrics
        threads = []
        for _ in range(5):
            thread = threading.Thread(target=record_metrics)
            threads.append(thread)
            thread.start()
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        # Verify final counts are correct
        snapshot = self.collector.snapshot()
        assert snapshot["total_requests"] == 500  # 5 threads * 100 requests
        assert snapshot["cache"]["hits"] == 500   # 5 threads * 100 hits
        assert snapshot["websocket"]["messages_sent"] == 500  # 5 threads * 100 messages
    
    def test_config_override(self):
        """Test configuration overrides."""
        # Test with custom configuration
        with patch('backend.services.metrics.unified_metrics_collector.unified_config') as mock_config:
            mock_config.METRICS_WINDOW_SIZE_MS = 120000  # 2 minutes
            mock_config.METRICS_HISTOGRAM_BUCKETS = [10, 100, 1000]
            mock_config.METRICS_MAX_SAMPLES = 1000
            
            collector = UnifiedMetricsCollector()
            
            assert collector._window_size_ms == 120000
            assert collector._buckets == [10, 100, 1000]
            assert collector._max_samples == 1000
    
    def test_snapshot_structure(self):
        """Test that snapshot returns all expected fields."""
        snapshot = self.collector.snapshot()
        
        # Verify all required fields are present
        required_fields = [
            "total_requests", "error_rate", "avg_latency_ms",
            "p50_latency_ms", "p90_latency_ms", "p95_latency_ms", "p99_latency_ms",
            "histogram", "event_loop", "cache", "websocket", "timestamp"
        ]
        
        for field in required_fields:
            assert field in snapshot
        
        # Verify nested structures
        assert "avg_lag_ms" in snapshot["event_loop"]
        assert "p95_lag_ms" in snapshot["event_loop"]
        assert "sample_count" in snapshot["event_loop"]
        
        assert "hits" in snapshot["cache"]
        assert "misses" in snapshot["cache"]
        assert "evictions" in snapshot["cache"]
        assert "hit_rate" in snapshot["cache"]
        
        assert "open_connections_estimate" in snapshot["websocket"]
        assert "messages_sent" in snapshot["websocket"]
    
    def test_percentile_edge_cases(self):
        """Test percentile calculation with edge cases."""
        # Test case: Single sample
        self.collector.record_request(100.0, 200)
        snapshot = self.collector.snapshot()
        
        assert snapshot["p50_latency_ms"] == 100.0
        assert snapshot["p95_latency_ms"] == 100.0
        assert snapshot["p99_latency_ms"] == 100.0
        
        # Test case: Two samples
        self.collector.reset_metrics()
        self.collector.record_request(100.0, 200)
        self.collector.record_request(200.0, 200)
        snapshot = self.collector.snapshot()
        
        assert snapshot["p50_latency_ms"] == 100.0  # First of two samples
        assert snapshot["p95_latency_ms"] == 200.0  # Second sample