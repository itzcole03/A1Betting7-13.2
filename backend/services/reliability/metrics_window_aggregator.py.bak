"""
Metrics Window Aggregator - Time-series metrics aggregation with sliding windows
Provides structured metrics aggregation over configurable time windows for reliability analysis
"""

import time
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timezone, timedelta
from collections import defaultdict, deque
from dataclasses import dataclass, field

try:
    from backend.services.unified_logging import get_logger
    logger = get_logger("metrics_window_aggregator")
except ImportError:
    import logging
    logger = logging.getLogger(__name__)


@dataclass
class MetricsBucket:
    """Represents a time window bucket for metrics aggregation"""
    timestamp: float
    window_start: float
    window_end: float
    metrics: Dict[str, Any] = field(default_factory=dict)
    sample_count: int = 0
    
    def add_sample(self, metric_name: str, value: Any) -> None:
        """Add a metric sample to this bucket"""
        if metric_name not in self.metrics:
            self.metrics[metric_name] = []
        
        self.metrics[metric_name].append({
            "value": value,
            "timestamp": time.time()
        })
        self.sample_count += 1
    
    def get_aggregated_metrics(self) -> Dict[str, Any]:
        """Get aggregated metrics for this bucket"""
        aggregated = {}
        
        for metric_name, samples in self.metrics.items():
            if not samples:
                continue
                
            values = [s["value"] for s in samples if isinstance(s["value"], (int, float))]
            
            if values:
                aggregated[metric_name] = {
                    "avg": sum(values) / len(values),
                    "min": min(values),
                    "max": max(values),
                    "count": len(values),
                    "sum": sum(values)
                }
            else:
                # Handle non-numeric metrics
                aggregated[metric_name] = {
                    "samples": samples,
                    "count": len(samples)
                }
        
        return aggregated


@dataclass
class WindowConfig:
    """Configuration for time window aggregation"""
    window_size_minutes: int = 10
    max_buckets: int = 144  # 24 hours worth of 10-minute buckets
    bucket_overlap_minutes: int = 0  # For sliding windows


class MetricsWindowAggregator:
    """
    Aggregates metrics over sliding time windows with configurable bucket sizes.
    Designed for reliability monitoring with 10-minute default buckets.
    """
    
    def __init__(self, config: Optional[WindowConfig] = None):
        self.config = config or WindowConfig()
        self.buckets: deque[MetricsBucket] = deque(maxlen=self.config.max_buckets)
        self.metric_history: Dict[str, deque] = defaultdict(lambda: deque(maxlen=1000))
        
        # Performance tracking
        self.total_samples = 0
        self.last_aggregation_time = time.time()
        
        logger.info(f"MetricsWindowAggregator initialized with {self.config.window_size_minutes}min buckets")
    
    def add_metric_sample(self, metric_name: str, value: Any, timestamp: Optional[float] = None) -> None:
        """Add a metric sample to the appropriate time bucket"""
        sample_time = timestamp or time.time()
        
        # Find or create the appropriate bucket
        bucket = self._get_or_create_bucket(sample_time)
        bucket.add_sample(metric_name, value)
        
        # Also maintain raw metric history for trend analysis
        self.metric_history[metric_name].append({
            "value": value,
            "timestamp": sample_time
        })
        
        self.total_samples += 1
        
        # Periodic cleanup of old buckets
        if self.total_samples % 100 == 0:
            self._cleanup_old_buckets()
    
    def add_metrics_batch(self, metrics_dict: Dict[str, Any], timestamp: Optional[float] = None) -> None:
        """Add a batch of metrics samples"""
        sample_time = timestamp or time.time()
        
        for metric_name, value in metrics_dict.items():
            if value is not None:
                self.add_metric_sample(metric_name, value, sample_time)
    
    def get_current_window_metrics(self) -> Dict[str, Any]:
        """Get metrics for the current time window"""
        current_time = time.time()
        window_start = current_time - (self.config.window_size_minutes * 60)
        
        return self.get_window_metrics(window_start, current_time)
    
    def get_window_metrics(self, start_time: float, end_time: float) -> Dict[str, Any]:
        """Get aggregated metrics for a specific time window"""
        relevant_buckets = [
            bucket for bucket in self.buckets
            if bucket.window_start <= end_time and bucket.window_end >= start_time
        ]
        
        if not relevant_buckets:
            return {}
        
        # Aggregate across all relevant buckets
        window_metrics = {}
        all_metric_names = set()
        
        for bucket in relevant_buckets:
            aggregated = bucket.get_aggregated_metrics()
            all_metric_names.update(aggregated.keys())
        
        # Combine metrics from all buckets
        for metric_name in all_metric_names:
            values = []
            total_count = 0
            
            for bucket in relevant_buckets:
                bucket_aggregated = bucket.get_aggregated_metrics()
                if metric_name in bucket_aggregated:
                    metric_data = bucket_aggregated[metric_name]
                    
                    if "avg" in metric_data:
                        # Numeric metric
                        values.extend([metric_data["avg"]] * metric_data["count"])
                        total_count += metric_data["count"]
                    else:
                        # Non-numeric metric
                        total_count += metric_data["count"]
            
            if values:
                window_metrics[metric_name] = {
                    "avg": sum(values) / len(values),
                    "min": min(values),
                    "max": max(values),
                    "count": total_count,
                    "window_start": start_time,
                    "window_end": end_time
                }
        
        return window_metrics
    
    def get_sliding_windows(self, num_windows: int = 6) -> List[Dict[str, Any]]:
        """Get metrics for multiple sliding windows (default: last 6 x 10min windows)"""
        current_time = time.time()
        window_size_seconds = self.config.window_size_minutes * 60
        
        windows = []
        
        for i in range(num_windows):
            window_end = current_time - (i * window_size_seconds)
            window_start = window_end - window_size_seconds
            
            window_metrics = self.get_window_metrics(window_start, window_end)
            windows.append({
                "window_index": i,
                "window_start": window_start,
                "window_end": window_end,
                "window_start_iso": datetime.fromtimestamp(window_start, tz=timezone.utc).isoformat(),
                "window_end_iso": datetime.fromtimestamp(window_end, tz=timezone.utc).isoformat(),
                "metrics": window_metrics
            })
        
        return windows
    
    def get_trend_analysis(self, metric_name: str, num_windows: int = 6) -> Dict[str, Any]:
        """Analyze trends for a specific metric across sliding windows"""
        windows = self.get_sliding_windows(num_windows)
        
        values = []
        timestamps = []
        
        for window in windows:
            if metric_name in window["metrics"]:
                metric_data = window["metrics"][metric_name]
                values.append(metric_data["avg"])
                timestamps.append(window["window_end"])
        
        if len(values) < 2:
            return {"trend": "insufficient_data", "values": values}
        
        # Simple trend analysis
        recent_avg = sum(values[:len(values)//2]) / max(1, len(values)//2)
        older_avg = sum(values[len(values)//2:]) / max(1, len(values) - len(values)//2)
        
        trend_direction = "increasing" if recent_avg > older_avg else "decreasing"
        trend_magnitude = abs(recent_avg - older_avg) / max(older_avg, 1)
        
        return {
            "trend": trend_direction,
            "magnitude": trend_magnitude,
            "recent_avg": recent_avg,
            "older_avg": older_avg,
            "values": values,
            "timestamps": timestamps,
            "num_windows": len(values)
        }
    
    def get_aggregator_stats(self) -> Dict[str, Any]:
        """Get aggregator performance and status statistics"""
        current_time = time.time()
        
        active_buckets = len(self.buckets)
        total_samples_in_buckets = sum(bucket.sample_count for bucket in self.buckets)
        
        oldest_bucket_time = None
        newest_bucket_time = None
        
        if self.buckets:
            oldest_bucket_time = min(bucket.window_start for bucket in self.buckets)
            newest_bucket_time = max(bucket.window_end for bucket in self.buckets)
        
        return {
            "window_config": {
                "window_size_minutes": self.config.window_size_minutes,
                "max_buckets": self.config.max_buckets,
                "bucket_overlap_minutes": self.config.bucket_overlap_minutes
            },
            "current_state": {
                "active_buckets": active_buckets,
                "total_samples_processed": self.total_samples,
                "samples_in_current_buckets": total_samples_in_buckets,
                "tracked_metrics": len(self.metric_history),
                "oldest_bucket_time": oldest_bucket_time,
                "newest_bucket_time": newest_bucket_time
            },
            "performance": {
                "last_aggregation_time": self.last_aggregation_time,
                "time_since_last_aggregation": current_time - self.last_aggregation_time,
                "avg_samples_per_bucket": total_samples_in_buckets / max(1, active_buckets)
            },
            "coverage": {
                "time_span_hours": (newest_bucket_time - oldest_bucket_time) / 3600 if oldest_bucket_time and newest_bucket_time else 0,
                "bucket_utilization": active_buckets / self.config.max_buckets
            }
        }
    
    def _get_or_create_bucket(self, sample_time: float) -> MetricsBucket:
        """Get existing bucket for timestamp or create new one"""
        window_size_seconds = self.config.window_size_minutes * 60
        
        # Calculate which window this sample belongs to
        window_start = (sample_time // window_size_seconds) * window_size_seconds
        window_end = window_start + window_size_seconds
        
        # Look for existing bucket
        for bucket in self.buckets:
            if bucket.window_start == window_start:
                return bucket
        
        # Create new bucket
        new_bucket = MetricsBucket(
            timestamp=sample_time,
            window_start=window_start,
            window_end=window_end
        )
        
        self.buckets.append(new_bucket)
        return new_bucket
    
    def _cleanup_old_buckets(self) -> None:
        """Clean up old buckets and metric history"""
        current_time = time.time()
        max_age_seconds = self.config.max_buckets * self.config.window_size_minutes * 60
        cutoff_time = current_time - max_age_seconds
        
        # Clean up old metric history
        for metric_name, history in self.metric_history.items():
            # Remove samples older than cutoff
            while history and history[0]["timestamp"] < cutoff_time:
                history.popleft()
        
        self.last_aggregation_time = current_time


# Global instance for system-wide metrics aggregation
metrics_window_aggregator = MetricsWindowAggregator()


def add_reliability_metrics(metrics_dict: Dict[str, Any]) -> None:
    """Convenience function to add reliability metrics to the global aggregator"""
    metrics_window_aggregator.add_metrics_batch(metrics_dict)


def get_current_reliability_window() -> Dict[str, Any]:
    """Get current reliability metrics window"""
    return metrics_window_aggregator.get_current_window_metrics()


def get_reliability_trend_analysis(metric_name: str) -> Dict[str, Any]:
    """Get trend analysis for a reliability metric"""
    return metrics_window_aggregator.get_trend_analysis(metric_name)