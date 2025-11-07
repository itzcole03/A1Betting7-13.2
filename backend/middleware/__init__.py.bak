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
# Expose the underlying module as a package attribute for tests and external
# callers that import `backend.middleware.prometheus_middleware` (some tests
# patch that module path). This keeps a minimal, non-invasive compatibility
# shim.
import importlib

prometheus_middleware = importlib.import_module(
    "backend.middleware.prometheus_metrics_middleware"
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

__all__.append("prometheus_middleware")

# Compatibility aliases: some tests and older callers import modules using
# the "*_middleware" suffix (e.g. `backend.middleware.payload_guard_middleware`).
# Provide module-level aliases that point to the actual module files so
# unittest.mock.patch(...) calls succeed without changing tests.
_compat_map = {
    "payload_guard_middleware": "backend.middleware.payload_guard",
    "rate_limiting_middleware": "backend.middleware.rate_limit",
    "security_headers_middleware": "backend.middleware.security_headers",
    "metrics_middleware": "backend.middleware.metrics_middleware",
    # keep prometheus_middleware present (already set above)
}

for alias, module_path in _compat_map.items():
    try:
        mod = importlib.import_module(module_path)
        globals()[alias] = mod
        __all__.append(alias)
    except Exception:
        # Don't fail package import if optional modules aren't available in test env
        pass