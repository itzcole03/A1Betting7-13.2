"""
Prometheus Metrics for Line Movement Tracking

Provides metrics instrumentation for line movement service operations.
"""

from prometheus_client import Counter, Histogram
import time
from functools import wraps
from typing import Callable, Any

# Metrics definitions
line_movement_snapshots_total = Counter(
    'line_movement_snapshots_total',
    'Total number of line movement snapshots recorded',
    ['sport', 'market', 'source']
)

line_movement_high_volatility_total = Counter(
    'line_movement_high_volatility_total',
    'Total number of high volatility line movements detected',
    ['sport', 'market']
)

line_movement_volatility_score = Histogram(
    'line_movement_volatility_score',
    'Distribution of volatility scores for line movements',
    ['sport', 'market'],
    buckets=(0.0, 0.2, 0.5, 1.0, 2.0, 5.0, 10.0, float('inf'))
)

line_movement_magnitude = Histogram(
    'line_movement_magnitude',
    'Distribution of movement magnitudes for line changes',
    ['sport', 'market', 'direction'],
    buckets=(0.0, 0.1, 0.25, 0.5, 1.0, 2.0, 5.0, float('inf'))
)

line_movement_service_operations = Counter(
    'line_movement_service_operations_total',
    'Total number of line movement service operations',
    ['operation', 'status']
)

line_movement_cache_operations = Counter(
    'line_movement_cache_operations_total',
    'Total number of cache operations for line movement data',
    ['operation', 'cache_type', 'status']
)

line_movement_query_duration = Histogram(
    'line_movement_query_duration_seconds',
    'Duration of line movement queries',
    ['query_type'],
    buckets=(0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, float('inf'))
)


class LineMovementMetrics:
    """Metrics helper class for line movement operations"""
    
    @staticmethod
    def record_snapshot(sport: str, market: str, source: str = "unknown"):
        """Record a line movement snapshot"""
        line_movement_snapshots_total.labels(
            sport=sport,
            market=market,
            source=source
        ).inc()
    
    @staticmethod
    def record_high_volatility(sport: str, market: str):
        """Record a high volatility movement detection"""
        line_movement_high_volatility_total.labels(
            sport=sport,
            market=market
        ).inc()
    
    @staticmethod
    def record_volatility_score(sport: str, market: str, score: float):
        """Record a volatility score measurement"""
        line_movement_volatility_score.labels(
            sport=sport,
            market=market
        ).observe(score)
    
    @staticmethod
    def record_magnitude(sport: str, market: str, direction: str, magnitude: float):
        """Record a movement magnitude measurement"""
        line_movement_magnitude.labels(
            sport=sport,
            market=market,
            direction=direction
        ).observe(abs(magnitude))
    
    @staticmethod
    def record_service_operation(operation: str, status: str = "success"):
        """Record a service operation"""
        line_movement_service_operations.labels(
            operation=operation,
            status=status
        ).inc()
    
    @staticmethod
    def record_cache_operation(operation: str, cache_type: str, status: str = "success"):
        """Record a cache operation"""
        line_movement_cache_operations.labels(
            operation=operation,
            cache_type=cache_type,
            status=status
        ).inc()
    
    @staticmethod
    def time_query(query_type: str):
        """Decorator to time query operations"""
        def decorator(func: Callable) -> Callable:
            @wraps(func)
            async def wrapper(*args: Any, **kwargs: Any) -> Any:
                start_time = time.time()
                try:
                    result = await func(*args, **kwargs)
                    duration = time.time() - start_time
                    line_movement_query_duration.labels(
                        query_type=query_type
                    ).observe(duration)
                    return result
                except Exception as e:
                    duration = time.time() - start_time
                    line_movement_query_duration.labels(
                        query_type=f"{query_type}_error"
                    ).observe(duration)
                    raise
            return wrapper
        return decorator


# Convenience function for instrumentation
def instrument_line_movement_function(operation_name: str):
    """Decorator to instrument line movement functions with metrics"""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            try:
                result = await func(*args, **kwargs)
                LineMovementMetrics.record_service_operation(operation_name, "success")
                return result
            except Exception as e:
                LineMovementMetrics.record_service_operation(operation_name, "error")
                raise
        return wrapper
    return decorator


# Metrics collection helper
def get_current_metrics() -> dict:
    """Get current metrics values for debugging/monitoring"""
    try:
        from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
        return {
            "metrics_available": True,
            "prometheus_format": generate_latest().decode('utf-8'),
            "content_type": CONTENT_TYPE_LATEST
        }
    except Exception as e:
        return {
            "metrics_available": False,
            "error": str(e)
        }