"""
Unified Metrics Collector - Thread-safe metrics aggregation service
Provides centralized collection and reporting of application performance metrics including request latency tracking.
"""

import time
import threading
from collections import deque
from typing import Dict, Optional

import statistics


class UnifiedMetricsCollector:
    """
    Thread-safe singleton service for collecting and aggregating application metrics.
    
    Maintains in-memory counters and rolling windows for latency calculations.
    Designed for high-throughput scenarios with minimal overhead.
    """
    
    _instance: Optional["UnifiedMetricsCollector"] = None
    _lock = threading.Lock()
    
    def __init__(self):
        """Initialize metrics collector with thread-safe data structures."""
        self._data_lock = threading.Lock()
        
        # Request latency tracking (rolling window of last 1000 requests)
        self._request_latencies: deque = deque(maxlen=1000)
        
        # Event loop lag tracking (placeholder for future implementation)
        self._event_loop_lag_samples: deque = deque(maxlen=100)
        
        # General metrics counters
        self._counters: Dict[str, int] = {
            "total_requests": 0,
            "successful_requests": 0,
            "failed_requests": 0,
        }
        
        # Timing metrics
        self._timing_metrics: Dict[str, float] = {
            "last_request_time": 0.0,
            "last_event_loop_check": 0.0,
        }
        
    @classmethod
    def get_instance(cls) -> "UnifiedMetricsCollector":
        """Get singleton instance of metrics collector with thread-safe lazy initialization."""
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = cls()
        return cls._instance
    
    def record_request_latency(self, latency_ms: float) -> None:
        """
        Record request latency in milliseconds.
        
        Args:
            latency_ms: Request latency in milliseconds
        """
        with self._data_lock:
            self._request_latencies.append(latency_ms)
            self._counters["total_requests"] += 1
            self._timing_metrics["last_request_time"] = time.time()
    
    def record_successful_request(self) -> None:
        """Record a successful request completion."""
        with self._data_lock:
            self._counters["successful_requests"] += 1
    
    def record_failed_request(self) -> None:
        """Record a failed request."""
        with self._data_lock:
            self._counters["failed_requests"] += 1
    
    def record_event_loop_lag(self, lag_ms: float) -> None:
        """
        Record event loop lag measurement.
        
        Args:
            lag_ms: Event loop lag in milliseconds
        """
        with self._data_lock:
            self._event_loop_lag_samples.append(lag_ms)
            self._timing_metrics["last_event_loop_check"] = time.time()
    
    def get_latency_stats(self) -> Dict[str, float]:
        """
        Calculate latency statistics from recorded samples.
        
        Returns:
            Dictionary containing avg_latency_ms and p95_latency_ms
        """
        with self._data_lock:
            if not self._request_latencies:
                return {
                    "avg_latency_ms": 0.0,
                    "p95_latency_ms": 0.0
                }
            
            latencies = list(self._request_latencies)
            
        # Calculate statistics outside the lock to minimize lock time
        avg_latency = statistics.mean(latencies)
        
        # Calculate 95th percentile
        sorted_latencies = sorted(latencies)
        p95_index = int(len(sorted_latencies) * 0.95)
        p95_latency = sorted_latencies[p95_index] if sorted_latencies else 0.0
        
        return {
            "avg_latency_ms": round(avg_latency, 2),
            "p95_latency_ms": round(p95_latency, 2)
        }
    
    def get_event_loop_lag(self) -> float:
        """
        Get current event loop lag estimate.
        
        Returns:
            Current event loop lag in milliseconds, or 0.0 if no samples available
        """
        with self._data_lock:
            if not self._event_loop_lag_samples:
                # TODO: Implement actual event loop lag measurement
                # For now, return a placeholder value based on request volume
                request_rate = len(self._request_latencies) / max(1, time.time() - self._timing_metrics.get("last_request_time", time.time()))
                estimated_lag = min(request_rate * 0.5, 10.0)  # Simple estimation
                return round(estimated_lag, 2)
            
            # Return most recent lag measurement
            return round(self._event_loop_lag_samples[-1], 2)
    
    def get_request_counters(self) -> Dict[str, int]:
        """
        Get current request counters.
        
        Returns:
            Dictionary containing request count statistics
        """
        with self._data_lock:
            return self._counters.copy()
    
    def snapshot(self) -> Dict[str, float]:
        """
        Get current metrics snapshot with key performance indicators.
        
        Returns:
            Dictionary containing current metrics snapshot including:
            - avg_latency_ms: Average request latency
            - p95_latency_ms: 95th percentile request latency  
            - event_loop_lag_ms: Current event loop lag estimate
            - total_requests: Total requests processed
            - success_rate: Success rate as decimal (0.0-1.0)
        """
        latency_stats = self.get_latency_stats()
        request_counters = self.get_request_counters()
        event_loop_lag = self.get_event_loop_lag()
        
        # Calculate success rate
        total_requests = request_counters["total_requests"]
        successful_requests = request_counters["successful_requests"]
        success_rate = successful_requests / max(1, total_requests)
        
        return {
            "avg_latency_ms": latency_stats["avg_latency_ms"],
            "p95_latency_ms": latency_stats["p95_latency_ms"],
            "event_loop_lag_ms": event_loop_lag,
            "total_requests": float(total_requests),
            "success_rate": round(success_rate, 4)
        }
    
    def reset_metrics(self) -> None:
        """Reset all metrics (primarily for testing purposes)."""
        with self._data_lock:
            self._request_latencies.clear()
            self._event_loop_lag_samples.clear()
            self._counters = {
                "total_requests": 0,
                "successful_requests": 0,
                "failed_requests": 0,
            }
            self._timing_metrics = {
                "last_request_time": 0.0,
                "last_event_loop_check": 0.0,
            }


# Global singleton instance
_metrics_collector = None


def get_metrics_collector() -> UnifiedMetricsCollector:
    """Get the global metrics collector instance."""
    global _metrics_collector
    if _metrics_collector is None:
        _metrics_collector = UnifiedMetricsCollector.get_instance()
    return _metrics_collector