"""
Middleware package for A1Betting Backend

This package contains all middleware components used by the FastAPI application.
"""

from .rate_limit import RateLimitMiddleware
from .caching import retry_and_cache
from .request_tracking import track_requests
from .structured_logging_middleware import (
    StructuredLoggingMiddleware,
    RequestIDLogger,
    get_structured_logger,
    get_request_id
)
from .prometheus_metrics_middleware import (
    PrometheusMetricsMiddleware,
    get_metrics_middleware,
    set_metrics_middleware,
    PROMETHEUS_AVAILABLE
)

__all__ = [
    "RateLimitMiddleware", 
    "retry_and_cache", 
    "track_requests",
    "StructuredLoggingMiddleware",
    "RequestIDLogger", 
    "get_structured_logger",
    "get_request_id",
    "PrometheusMetricsMiddleware",
    "get_metrics_middleware",
    "set_metrics_middleware",
    "PROMETHEUS_AVAILABLE"
] 