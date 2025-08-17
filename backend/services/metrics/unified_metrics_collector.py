"""
Unified Metrics Collector - Production-grade metrics aggregation service
Provides centralized collection and reporting of application performance metrics with sliding windows,
percentile computation, event loop lag sampling, and comprehensive instrumentation.
"""

import asyncio
import statistics
import threading
import time
from collections import deque
from typing import Any, Dict, List, Optional, Tuple, Union

try:
    from backend.services.unified_config import get_config
    from backend.services.unified_logging import get_logger
    
    logger = get_logger("metrics_collector")
    unified_config = get_config()
except ImportError:
    import logging
    logger = logging.getLogger(__name__)
    unified_config = None


class UnifiedMetricsCollector:
    """
    Production-grade singleton service for collecting and aggregating application metrics.
    
    Features:
    - Sliding time window with configurable duration (default 5 minutes)
    - Percentile computation (p50, p90, p95, p99) with bounded memory
    - Event loop lag sampling with background monitoring
    - Histogram buckets for latency distribution
    - Cache hit/miss/eviction tracking
    - WebSocket connection and message metrics
    - Thread-safe operations with minimal lock contention
    - Prometheus exposition format support (optional)
    """
    
    _instance: Optional["UnifiedMetricsCollector"] = None
    _lock = threading.Lock()
    
    # Default latency histogram buckets (milliseconds)
    DEFAULT_BUCKETS = [25, 50, 100, 200, 350, 500, 750, 1000, 1500, 2500, 5000]
    
    def __init__(self):
        """Initialize metrics collector with production-grade features."""
        self._data_lock = threading.Lock()
        
        # Configuration from unified_config or defaults
        self._window_size_ms = self._get_config_value("METRICS_WINDOW_SIZE_MS", 5 * 60 * 1000)  # 5 minutes
        self._buckets = self._get_config_value("METRICS_HISTOGRAM_BUCKETS", self.DEFAULT_BUCKETS)
        self._max_samples = self._get_config_value("METRICS_MAX_SAMPLES", 5000)
        self._prometheus_enabled = self._get_config_value("METRICS_PROMETHEUS_ENABLED", False)
        
        # Sliding window for request latencies (timestamp, latency_ms, status_code)
        self._request_samples: deque = deque(maxlen=self._max_samples)
        
        # Event loop lag tracking
        self._event_loop_samples: deque = deque(maxlen=60)  # Last 60 samples (~1 minute at 1s intervals)
        self._event_loop_task: Optional[asyncio.Task] = None
        self._event_loop_active = False
        
        # Request counters
        self._total_requests = 0
        self._total_errors = 0
        
        # Histogram buckets
        self._histogram_counts: Dict[Union[float, str], int] = {bucket: 0 for bucket in self._buckets}
        self._histogram_counts["+Inf"] = 0
        
        # Cache metrics
        self._cache_hits = 0
        self._cache_misses = 0
        self._cache_evictions = 0
        
        # WebSocket metrics
        self._websocket_connections_opened = 0
        self._websocket_connections_closed = 0
        self._websocket_messages_sent = 0
        
        # Performance tracking
        self._last_prune_time = time.time()
        
    def _get_config_value(self, key: str, default):
        """Get configuration value with fallback to default."""
        if unified_config:
            return getattr(unified_config, key, default)
        return default
        
    @classmethod
    def get_instance(cls) -> "UnifiedMetricsCollector":
        """Get singleton instance of metrics collector with thread-safe lazy initialization."""
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = cls()
        return cls._instance
    
    async def start_event_loop_monitor(self) -> None:
        """Start background event loop lag monitoring."""
        if self._event_loop_active:
            return
            
        self._event_loop_active = True
        logger.info("Starting event loop lag monitoring", extra={
            "category": "metrics", 
            "action": "sampler_start"
        })
        
        try:
            self._event_loop_task = asyncio.create_task(self._event_loop_monitor_loop())
        except Exception as e:
            logger.error("Failed to start event loop monitor", extra={
                "category": "metrics", 
                "action": "sampler_error", 
                "error": str(e)
            })
            self._event_loop_active = False
    
    async def stop_event_loop_monitor(self) -> None:
        """Stop background event loop lag monitoring."""
        if not self._event_loop_active:
            return
            
        self._event_loop_active = False
        if self._event_loop_task and not self._event_loop_task.done():
            self._event_loop_task.cancel()
            try:
                await self._event_loop_task
            except asyncio.CancelledError:
                pass
        
        logger.info("Stopped event loop lag monitoring", extra={
            "category": "metrics", 
            "action": "sampler_stop"
        })
    
    async def _event_loop_monitor_loop(self) -> None:
        """Background task for monitoring event loop lag."""
        while self._event_loop_active:
            try:
                # Measure event loop lag
                expected_sleep = 1.0  # 1 second
                start_time = time.time()
                await asyncio.sleep(expected_sleep)
                actual_duration = time.time() - start_time
                
                lag_ms = max(0, (actual_duration - expected_sleep) * 1000)
                
                # Store lag sample
                with self._data_lock:
                    self._event_loop_samples.append((time.time(), lag_ms))
                    
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.warning("Event loop monitor error, attempting restart", extra={
                    "category": "metrics", 
                    "action": "sampler_restart", 
                    "error": str(e)
                })
                await asyncio.sleep(5.0)  # Wait before retry
    
    def record_request(self, latency_ms: float, status_code: int) -> None:
        """
        Record request latency and status code.
        
        Args:
            latency_ms: Request latency in milliseconds
            status_code: HTTP status code (>=500 counts as error)
        """
        timestamp = time.time()
        
        with self._data_lock:
            # Store sample with timestamp for sliding window
            self._request_samples.append((timestamp, latency_ms, status_code))
            
            # Update counters
            self._total_requests += 1
            if status_code >= 500:
                self._total_errors += 1
            
            # Update histogram buckets
            for bucket in self._buckets:
                if latency_ms <= bucket:
                    self._histogram_counts[bucket] += 1
                    break
            else:
                self._histogram_counts["+Inf"] += 1
    
    def record_ws_message(self, count: int = 1) -> None:
        """Record WebSocket messages sent."""
        with self._data_lock:
            self._websocket_messages_sent += count
    
    def record_ws_connection(self, open: bool) -> None:
        """Record WebSocket connection open/close."""
        with self._data_lock:
            if open:
                self._websocket_connections_opened += 1
            else:
                self._websocket_connections_closed += 1
    
    def record_cache_hit(self) -> None:
        """Record cache hit."""
        with self._data_lock:
            self._cache_hits += 1
    
    def record_cache_miss(self) -> None:
        """Record cache miss."""
        with self._data_lock:
            self._cache_misses += 1
    
    def record_cache_eviction(self) -> None:
        """Record cache eviction."""
        with self._data_lock:
            self._cache_evictions += 1
    
    def prune_old_samples(self) -> None:
        """Remove samples older than the configured window size."""
        current_time = time.time()
        cutoff_time = current_time - (self._window_size_ms / 1000)
        
        with self._data_lock:
            # Prune request samples
            while self._request_samples and self._request_samples[0][0] < cutoff_time:
                self._request_samples.popleft()
            
            # Prune event loop samples (keep last minute)
            cutoff_time_event_loop = current_time - 60
            while self._event_loop_samples and self._event_loop_samples[0][0] < cutoff_time_event_loop:
                self._event_loop_samples.popleft()
                
        self._last_prune_time = current_time
    
    def _compute_percentiles(self, latencies: List[float]) -> Dict[str, float]:
        """Compute percentiles from latency samples with reservoir sampling if needed."""
        if not latencies:
            return {"p50": 0.0, "p90": 0.0, "p95": 0.0, "p99": 0.0}
        
        # Use reservoir sampling if too many samples to maintain bounded cost
        if len(latencies) > self._max_samples:
            import random
            sampled = random.sample(latencies, self._max_samples)
            latencies = sampled
        
        sorted_latencies = sorted(latencies)
        n = len(sorted_latencies)
        
        def percentile(p: float) -> float:
            index = int(n * p / 100)
            if index >= n:
                index = n - 1
            return sorted_latencies[index]
        
        return {
            "p50": round(percentile(50), 2),
            "p90": round(percentile(90), 2), 
            "p95": round(percentile(95), 2),
            "p99": round(percentile(99), 2)
        }
    
    def snapshot(self) -> Dict[str, Any]:
        """
        Get comprehensive metrics snapshot with all key performance indicators.
        
        Returns:
            Dictionary containing current metrics snapshot including:
            - Request metrics with percentiles and histogram
            - Event loop lag statistics
            - Cache hit/miss rates
            - WebSocket connection metrics
            - Error rates and counts
        """
        current_time = time.time()
        
        # Prune old samples if needed (every 30 seconds)
        if current_time - self._last_prune_time > 30:
            self.prune_old_samples()
        
        with self._data_lock:
            # Extract latency values from samples
            latencies = [sample[1] for sample in self._request_samples]
            avg_latency = statistics.mean(latencies) if latencies else 0.0
            
            # Compute percentiles
            percentiles = self._compute_percentiles(latencies)
            
            # Calculate error rate
            error_rate = (self._total_errors / max(1, self._total_requests))
            
            # Event loop lag statistics
            if self._event_loop_samples:
                lag_values = [sample[1] for sample in self._event_loop_samples]
                avg_lag = statistics.mean(lag_values)
                p95_lag = sorted(lag_values)[int(len(lag_values) * 0.95)] if lag_values else 0.0
            else:
                avg_lag = 0.0
                p95_lag = 0.0
            
            # Cache hit rate
            total_cache_ops = self._cache_hits + self._cache_misses
            hit_rate = (self._cache_hits / max(1, total_cache_ops))
            
            # Current WebSocket connections estimate (opened - closed)
            current_ws_connections = max(0, self._websocket_connections_opened - self._websocket_connections_closed)
            
            # Build histogram for Prometheus compatibility
            histogram = dict(self._histogram_counts)
            
            return {
                "total_requests": self._total_requests,
                "error_rate": round(error_rate, 4),
                "avg_latency_ms": round(avg_latency, 2),
                "p50_latency_ms": percentiles["p50"],
                "p90_latency_ms": percentiles["p90"],
                "p95_latency_ms": percentiles["p95"],
                "p99_latency_ms": percentiles["p99"],
                "histogram": histogram,
                "event_loop": {
                    "avg_lag_ms": round(avg_lag, 2),
                    "p95_lag_ms": round(p95_lag, 2),
                    "sample_count": len(self._event_loop_samples)
                },
                "cache": {
                    "hits": self._cache_hits,
                    "misses": self._cache_misses,
                    "evictions": self._cache_evictions,
                    "hit_rate": round(hit_rate, 4)
                },
                "websocket": {
                    "open_connections_estimate": current_ws_connections,
                    "messages_sent": self._websocket_messages_sent
                },
                "timestamp": current_time
            }
    
    def reset_metrics(self) -> None:
        """Reset all metrics (primarily for testing purposes)."""
        with self._data_lock:
            self._request_samples.clear()
            self._event_loop_samples.clear()
            
            self._total_requests = 0
            self._total_errors = 0
            
            self._histogram_counts = {bucket: 0 for bucket in self._buckets}
            self._histogram_counts["+Inf"] = 0
            
            self._cache_hits = 0
            self._cache_misses = 0
            self._cache_evictions = 0
            
            self._websocket_connections_opened = 0
            self._websocket_connections_closed = 0
            self._websocket_messages_sent = 0
            
            self._last_prune_time = time.time()


# Global singleton instance
_metrics_collector = None


def get_metrics_collector() -> UnifiedMetricsCollector:
    """Get the global metrics collector instance."""
    global _metrics_collector
    if _metrics_collector is None:
        _metrics_collector = UnifiedMetricsCollector.get_instance()
    return _metrics_collector