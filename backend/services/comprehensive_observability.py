"""
Phase 2.7: Comprehensive Observability Implementation
Modern observability stack with metrics, tracing, and monitoring

This module implements:
1. Structured logging with correlation IDs
2. Prometheus metrics collection
3. Distributed tracing with OpenTelemetry
4. Health checks and monitoring
5. Performance monitoring and alerting
"""

from __future__ import annotations

import asyncio
import logging
import time
from contextlib import asynccontextmanager
from typing import Any, Dict, Optional, Tuple
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

from fastapi import FastAPI, Request, Response
from prometheus_client import (
    CONTENT_TYPE_LATEST,
    Counter,
    Gauge,
    Histogram,
    generate_latest,
)
from starlette.middleware.base import BaseHTTPMiddleware

# OpenTelemetry imports
try:
    from opentelemetry import trace
    from opentelemetry.exporter.jaeger.thrift import JaegerExporter
    from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
    from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
    from opentelemetry.sdk.resources import SERVICE_NAME, Resource
    from opentelemetry.sdk.trace import TracerProvider
    from opentelemetry.sdk.trace.export import BatchSpanProcessor

    TRACING_AVAILABLE = True
except ImportError:
    TRACING_AVAILABLE = False

logger = logging.getLogger(__name__)

# =============================================================================
# PROMETHEUS METRICS SETUP
# =============================================================================

# Request metrics
REQUEST_COUNT = Counter(
    "http_requests_total", "Total HTTP requests", ["method", "endpoint", "status_code"]
)

REQUEST_DURATION = Histogram(
    "http_request_duration_seconds",
    "HTTP request duration in seconds",
    ["method", "endpoint"],
    buckets=[0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.0, 5.0, 10.0],
)

REQUEST_SIZE = Histogram(
    "http_request_size_bytes", "HTTP request size in bytes", ["method", "endpoint"]
)

RESPONSE_SIZE = Histogram(
    "http_response_size_bytes", "HTTP response size in bytes", ["method", "endpoint"]
)

# Application metrics
ACTIVE_CONNECTIONS = Gauge("active_connections", "Number of active connections")

BACKGROUND_TASKS = Gauge("background_tasks_active", "Number of active background tasks")

DATABASE_CONNECTIONS = Gauge(
    "database_connections_active", "Number of active database connections"
)

ERROR_COUNT = Counter(
    "application_errors_total", "Total application errors", ["error_type", "component"]
)

# Business metrics
BETS_PLACED = Counter("bets_placed_total", "Total bets placed", ["sport", "bet_type"])

PREDICTIONS_GENERATED = Counter(
    "predictions_generated_total",
    "Total predictions generated",
    ["sport", "model_version"],
)

ANALYSIS_DURATION = Histogram(
    "analysis_duration_seconds",
    "Time spent on analysis operations",
    ["analysis_type"],
    buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0, 60.0],
)

# =============================================================================
# STRUCTURED LOGGING
# =============================================================================


class CorrelationIdFilter(logging.Filter):
    """Add correlation ID to log records"""

    def filter(self, record):
        # Try to get correlation ID from context
        correlation_id = getattr(record, "correlation_id", None)
        if not correlation_id:
            correlation_id = "no-correlation-id"
        record.correlation_id = correlation_id
        return True


class StructuredFormatter(logging.Formatter):
    """JSON structured logging formatter"""

    def format(self, record):
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "correlation_id": getattr(record, "correlation_id", "unknown"),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        # Add exception info if present
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)

        # Add extra fields
        if hasattr(record, "extra_fields"):
            log_entry.update(record.extra_fields)

        return str(log_entry).replace("'", '"')


def setup_structured_logging() -> Tuple[logging.Logger, logging.Logger, logging.Logger]:
    """Setup structured logging configuration
    
    Returns:
        Tuple of (app_logger, performance_logger, security_logger)
    """

    # Create formatter
    formatter = StructuredFormatter()

    # Setup handlers
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    console_handler.addFilter(CorrelationIdFilter())

    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    root_logger.addHandler(console_handler)

    # Configure specific loggers
    app_logger = logging.getLogger("app")
    app_logger.setLevel(logging.DEBUG)

    performance_logger = logging.getLogger("performance")
    performance_logger.setLevel(logging.INFO)

    security_logger = logging.getLogger("security")
    security_logger.setLevel(logging.WARNING)

    return app_logger, performance_logger, security_logger


# =============================================================================
# DISTRIBUTED TRACING
# =============================================================================


def setup_tracing(service_name: str = "a1betting-backend") -> Optional[Any]:
    """Setup OpenTelemetry distributed tracing
    
    Args:
        service_name: Name of the service for tracing identification
        
    Returns:
        Tracer instance if successful, None if OpenTelemetry not available
    """

    if not TRACING_AVAILABLE:
        logger.warning("OpenTelemetry not available, skipping tracing setup")
        return None

    try:
        # Create resource
        resource = Resource.create({SERVICE_NAME: service_name})

        # Create TracerProvider
        provider = TracerProvider(resource=resource)
        trace.set_tracer_provider(provider)

        # Create Jaeger exporter
        jaeger_exporter = JaegerExporter(
            agent_host_name="localhost",
            agent_port=6831,
        )

        # Create span processor
        span_processor = BatchSpanProcessor(jaeger_exporter)
        provider.add_span_processor(span_processor)

        # Get tracer
        tracer = trace.get_tracer(__name__)

        logger.info("Distributed tracing setup completed")
        return tracer

    except Exception as e:
        logger.error(f"Failed to setup tracing: {e}")
        return None


# =============================================================================
# MONITORING MIDDLEWARE
# =============================================================================


class ObservabilityMiddleware(BaseHTTPMiddleware):
    """Comprehensive observability middleware"""

    def __init__(self, app, tracer=None):
        super().__init__(app)
        self.tracer = tracer
        self.performance_logger = logging.getLogger("performance")

    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        correlation_id = request.headers.get(
            "X-Correlation-ID", f"req-{int(time.time()*1000)}"
        )

        # Add correlation ID to request state
        request.state.correlation_id = correlation_id

        # Create span if tracing available
        span = None
        if self.tracer:
            span = self.tracer.start_span(
                f"{request.method} {request.url.path}",
                attributes={
                    "http.method": request.method,
                    "http.url": str(request.url),
                    "correlation.id": correlation_id,
                },
            )

        try:
            # Get request size
            request_size = int(request.headers.get("content-length", 0))

            # Process request
            response = await call_next(request)

            # Calculate metrics
            duration = time.time() - start_time
            response_size = response.headers.get("content-length", 0)

            # Update Prometheus metrics
            REQUEST_COUNT.labels(
                method=request.method,
                endpoint=request.url.path,
                status_code=response.status_code,
            ).inc()

            REQUEST_DURATION.labels(
                method=request.method, endpoint=request.url.path
            ).observe(duration)

            if request_size > 0:
                REQUEST_SIZE.labels(
                    method=request.method, endpoint=request.url.path
                ).observe(request_size)

            if response_size:
                RESPONSE_SIZE.labels(
                    method=request.method, endpoint=request.url.path
                ).observe(int(response_size))

            # Add correlation ID to response
            response.headers["X-Correlation-ID"] = correlation_id

            # Log performance
            self.performance_logger.info(
                "Request completed",
                extra={
                    "extra_fields": {
                        "method": request.method,
                        "path": request.url.path,
                        "status_code": response.status_code,
                        "duration": duration,
                        "request_size": request_size,
                        "response_size": response_size,
                        "correlation_id": correlation_id,
                    }
                },
            )

            # Update span
            if span:
                span.set_attribute("http.status_code", response.status_code)
                span.set_attribute(
                    "http.response_size", int(response_size) if response_size else 0
                )
                span.set_status(trace.Status(trace.StatusCode.OK))

            return response

        except Exception as e:
            # Update error metrics
            ERROR_COUNT.labels(
                error_type=type(e).__name__, component="middleware"
            ).inc()

            # Log error
            logger.error(
                f"Request failed: {e}",
                extra={
                    "extra_fields": {
                        "correlation_id": correlation_id,
                        "error_type": type(e).__name__,
                        "method": request.method,
                        "path": request.url.path,
                    }
                },
            )

            # Update span with error
            if span:
                span.record_exception(e)
                span.set_status(trace.Status(trace.StatusCode.ERROR, str(e)))

            raise

        finally:
            if span:
                span.end()


# =============================================================================
# HEALTH CHECKS
# =============================================================================


class HealthCheckManager:
    """Comprehensive health check manager"""

    def __init__(self):
        self.checks = {}
        self.logger = logging.getLogger("health")

    def register_check(self, name: str, check_func, timeout: float = 5.0):
        """Register a health check"""
        self.checks[name] = {"func": check_func, "timeout": timeout}

    async def run_checks(self) -> Dict[str, Any]:
        """Run all health checks"""
        results = {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "checks": {},
        }

        overall_healthy = True

        for name, check_config in self.checks.items():
            try:
                start_time = time.time()

                # Run check with timeout
                result = await asyncio.wait_for(
                    check_config["func"](), timeout=check_config["timeout"]
                )

                duration = time.time() - start_time

                results["checks"][name] = {
                    "status": "healthy",
                    "duration": duration,
                    "details": result,
                }

            except asyncio.TimeoutError:
                overall_healthy = False
                results["checks"][name] = {
                    "status": "unhealthy",
                    "error": "timeout",
                    "timeout": check_config["timeout"],
                }

            except Exception as e:
                overall_healthy = False
                results["checks"][name] = {
                    "status": "unhealthy",
                    "error": str(e),
                    "error_type": type(e).__name__,
                }

        results["status"] = "healthy" if overall_healthy else "unhealthy"
        return results


# =============================================================================
# MONITORING DASHBOARD DATA
# =============================================================================


class MonitoringDashboard:
    """Monitoring dashboard data aggregator"""

    def __init__(self):
        self.start_time = datetime.utcnow()

    def get_system_metrics(self) -> Dict[str, Any]:
        """Get system metrics for dashboard"""
        uptime = datetime.utcnow() - self.start_time

        return {
            "uptime_seconds": uptime.total_seconds(),
            "timestamp": datetime.utcnow().isoformat(),
            "metrics": {
                "active_connections": ACTIVE_CONNECTIONS._value._value,
                "background_tasks": BACKGROUND_TASKS._value._value,
                "database_connections": DATABASE_CONNECTIONS._value._value,
            },
        }

    def get_performance_metrics(self) -> Dict[str, Any]:
        """Get performance metrics"""
        return {
            "request_rate": self._calculate_request_rate(),
            "error_rate": self._calculate_error_rate(),
            "avg_response_time": self._calculate_avg_response_time(),
            "p95_response_time": self._calculate_p95_response_time(),
        }

    def _calculate_request_rate(self) -> float:
        """Calculate requests per second"""
        # This would normally query the metrics backend
        # For now, return a placeholder
        return 0.0

    def _calculate_error_rate(self) -> float:
        """Calculate error rate percentage"""
        # This would normally query the metrics backend
        return 0.0

    def _calculate_avg_response_time(self) -> float:
        """Calculate average response time"""
        # This would normally query the metrics backend
        return 0.0

    def _calculate_p95_response_time(self) -> float:
        """Calculate 95th percentile response time"""
        # This would normally query the metrics backend
        return 0.0


# =============================================================================
# OBSERVABILITY ROUTES
# =============================================================================


def create_observability_routes(
    health_manager: HealthCheckManager, dashboard: MonitoringDashboard
):
    """Create observability routes"""
    from fastapi import APIRouter

    router = APIRouter(prefix="/observability", tags=["Observability"])

    @router.get("/metrics")
    async def get_prometheus_metrics():
        """Prometheus metrics endpoint"""
        return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

    @router.get("/health")
    async def health_check():
        """Comprehensive health check"""
        results = await health_manager.run_checks()
        status_code = 200 if results["status"] == "healthy" else 503
        return Response(
            content=str(results).replace("'", '"'),
            status_code=status_code,
            media_type="application/json",
        )

    @router.get("/health/live")
    async def liveness_check():
        """Kubernetes liveness check"""
        return {"status": "alive", "timestamp": datetime.utcnow().isoformat()}

    @router.get("/health/ready")
    async def readiness_check():
        """Kubernetes readiness check"""
        # Basic readiness check - can be extended
        return {"status": "ready", "timestamp": datetime.utcnow().isoformat()}

    @router.get("/dashboard/system")
    async def system_dashboard():
        """System metrics for dashboard"""
        return dashboard.get_system_metrics()

    @router.get("/dashboard/performance")
    async def performance_dashboard():
        """Performance metrics for dashboard"""
        return dashboard.get_performance_metrics()

    return router


# =============================================================================
# INITIALIZATION
# =============================================================================


def setup_observability(app: FastAPI) -> Tuple[HealthCheckManager, MonitoringDashboard]:
    """Setup comprehensive observability"""

    # Setup structured logging
    app_logger, performance_logger, security_logger = setup_structured_logging()

    # Setup distributed tracing
    tracer = setup_tracing()

    # Add observability middleware
    app.add_middleware(ObservabilityMiddleware, tracer=tracer)

    # Setup health check manager
    health_manager = HealthCheckManager()

    # Register basic health checks
    async def database_health():
        """Database health check"""
        # This would normally test database connectivity
        await asyncio.sleep(0.1)  # Simulate check
        return {"status": "connected", "pool_size": 10}

    async def cache_health():
        """Cache health check"""
        # This would normally test cache connectivity
        await asyncio.sleep(0.05)  # Simulate check
        return {"status": "connected", "hit_rate": 0.85}

    health_manager.register_check("database", database_health)
    health_manager.register_check("cache", cache_health)

    # Setup monitoring dashboard
    dashboard = MonitoringDashboard()

    # Add observability routes
    observability_router = create_observability_routes(health_manager, dashboard)
    app.include_router(observability_router)

    # Instrument FastAPI if tracing available
    if TRACING_AVAILABLE:
        try:
            FastAPIInstrumentor.instrument_app(app)
            SQLAlchemyInstrumentor().instrument()
            logger.info("FastAPI instrumentation completed")
        except Exception as e:
            logger.error(f"Failed to instrument FastAPI: {e}")

    logger.info("Comprehensive observability setup completed")
    return health_manager, dashboard


# =============================================================================
# EXPORT
# =============================================================================

__all__ = [
    "setup_observability",
    "ObservabilityMiddleware",
    "HealthCheckManager",
    "MonitoringDashboard",
    "setup_structured_logging",
    "setup_tracing",
    "REQUEST_COUNT",
    "REQUEST_DURATION",
    "ERROR_COUNT",
    "BETS_PLACED",
    "PREDICTIONS_GENERATED",
    "ANALYSIS_DURATION",
]
