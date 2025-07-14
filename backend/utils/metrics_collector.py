"""Performance metrics collection and monitoring."""

import time
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import DefaultDict, Dict, List, Optional, Tuple

@dataclass
class RequestMetrics:
    """Metrics for a single request"""
    endpoint: str
    method: str
    start_time: float
    end_time: float = field(default_factory=time.time)
    status_code: int = 200
    error: Optional[str] = None
    cache_hit: bool = False
    model_used: Optional[str] = None
    queue_time: Optional[float] = None

    @property
    def duration(self) -> float:
        """Get request duration in seconds"""
        return self.end_time - self.start_time

class MetricsCollector:
    """Collector for performance metrics"""

    def __init__(self, window_size: int = 3600):
        """Initialize metrics collector.
        
        Args:
            window_size: Time window in seconds for metrics retention
        """
        self.window_size = window_size
        self.requests: List[RequestMetrics] = []
        self.endpoint_metrics: DefaultDict[str, List[float]] = defaultdict(list)
        self.error_counts: DefaultDict[str, int] = defaultdict(int)
        self.cache_hits: DefaultDict[str, int] = defaultdict(int)
        self.total_requests: DefaultDict[str, int] = defaultdict(int)
        self.model_usage: DefaultDict[str, int] = defaultdict(int)
        self.last_cleanup = time.time()

    def start_request(self, endpoint: str, method: str) -> RequestMetrics:
        """Start tracking a new request.
        
        Args:
            endpoint: API endpoint
            method: HTTP method
            
        Returns:
            RequestMetrics: New request metrics object
        """
        metrics = RequestMetrics(
            endpoint=endpoint,
            method=method,
            start_time=time.time()
        )
        self.requests.append(metrics)
        self.total_requests[endpoint] += 1
        return metrics

    def end_request(
        self,
        metrics: RequestMetrics,
        status_code: int = 200,
        error: Optional[str] = None,
        cache_hit: bool = False,
        model_used: Optional[str] = None,
        queue_time: Optional[float] = None
    ) -> None:
        """End tracking a request.
        
        Args:
            metrics: Request metrics object
            status_code: HTTP status code
            error: Error message if any
            cache_hit: Whether request was served from cache
            model_used: Name of LLM model used
            queue_time: Time spent in queue
        """
        metrics.end_time = time.time()
        metrics.status_code = status_code
        metrics.error = error
        metrics.cache_hit = cache_hit
        metrics.model_used = model_used
        metrics.queue_time = queue_time

        # Update metrics
        self.endpoint_metrics[metrics.endpoint].append(metrics.duration)
        if error:
            self.error_counts[metrics.endpoint] += 1
        if cache_hit:
            self.cache_hits[metrics.endpoint] += 1
        if model_used:
            self.model_usage[model_used] += 1

        # Cleanup old metrics periodically
        if time.time() - self.last_cleanup > 60:  # Every minute
            self._cleanup_old_metrics()

    def get_endpoint_stats(self, endpoint: str) -> Dict:
        """Get statistics for an endpoint.
        
        Args:
            endpoint: API endpoint
            
        Returns:
            Dict: Endpoint statistics
        """
        durations = self.endpoint_metrics[endpoint]
        if not durations:
            return {
                "total_requests": 0,
                "avg_duration": 0,
                "p95_duration": 0,
                "error_rate": 0,
                "cache_hit_rate": 0
            }

        durations.sort()
        p95_idx = int(len(durations) * 0.95)
        total = self.total_requests[endpoint]

        return {
            "total_requests": total,
            "avg_duration": sum(durations) / len(durations),
            "p95_duration": durations[p95_idx] if p95_idx > 0 else durations[-1],
            "error_rate": self.error_counts[endpoint] / total if total > 0 else 0,
            "cache_hit_rate": self.cache_hits[endpoint] / total if total > 0 else 0
        }

    def get_model_stats(self) -> Dict[str, Dict]:
        """Get statistics for model usage.
        
        Returns:
            Dict: Model usage statistics
        """
        total_uses = sum(self.model_usage.values())
        return {
            model: {
                "uses": uses,
                "usage_rate": uses / total_uses if total_uses > 0 else 0
            }
            for model, uses in self.model_usage.items()
        }

    def get_overall_stats(self) -> Dict:
        """Get overall system statistics.
        
        Returns:
            Dict: Overall statistics
        """
        total_requests = sum(self.total_requests.values())
        total_errors = sum(self.error_counts.values())
        total_cache_hits = sum(self.cache_hits.values())
        all_durations = [d for dlist in self.endpoint_metrics.values() for d in dlist]

        if not all_durations:
            return {
                "total_requests": 0,
                "error_rate": 0,
                "cache_hit_rate": 0,
                "avg_response_time": 0
            }

        return {
            "total_requests": total_requests,
            "error_rate": total_errors / total_requests if total_requests > 0 else 0,
            "cache_hit_rate": total_cache_hits / total_requests if total_requests > 0 else 0,
            "avg_response_time": sum(all_durations) / len(all_durations)
        }

    def _cleanup_old_metrics(self) -> None:
        """Remove metrics older than window size"""
        cutoff_time = time.time() - self.window_size
        
        # Clean up request metrics
        self.requests = [m for m in self.requests if m.start_time > cutoff_time]
        
        # Clean up endpoint metrics
        for endpoint in list(self.endpoint_metrics.keys()):
            metrics = self.endpoint_metrics[endpoint]
            start_times = [m.start_time for m in self.requests if m.endpoint == endpoint]
            if not start_times:
                del self.endpoint_metrics[endpoint]
                self.error_counts.pop(endpoint, None)
                self.cache_hits.pop(endpoint, None)
                self.total_requests.pop(endpoint, None)
        
        self.last_cleanup = time.time()

# Global metrics collector instance
metrics_collector = MetricsCollector() 