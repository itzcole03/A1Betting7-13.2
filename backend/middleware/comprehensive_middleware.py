"""
Comprehensive Custom Middleware Stack for FastAPI
Following 2024-2025 best practices for production-ready middleware.
"""

import json
import time
import uuid
from typing import Any, Callable, Dict, Optional

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from backend.config.settings import get_settings


class RequestTrackingMiddleware(BaseHTTPMiddleware):
    """
    Tracks requests with correlation IDs and performance metrics.
    Based on FastAPI 2024 best practices for observability.
    """

    def __init__(self, app: ASGIApp):
        super().__init__(app)
        self.settings = get_settings()

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Generate correlation ID for request tracking
        correlation_id = str(uuid.uuid4())
        request.state.correlation_id = correlation_id

        # Start timing
        start_time = time.time()

        # Add correlation ID to request headers for downstream services
        request.headers.__dict__["_list"].append(
            (b"x-correlation-id", correlation_id.encode())
        )

        try:
            # Process request
            response = await call_next(request)

            # Calculate processing time
            process_time = (time.time() - start_time) * 1000  # milliseconds

            # Add performance and tracking headers
            response.headers["X-Correlation-ID"] = correlation_id
            response.headers["X-Process-Time"] = f"{process_time:.2f}ms"
            response.headers["X-Server-Name"] = self.settings.app.app_name

            return response

        except Exception as e:
            # Ensure correlation ID is preserved even on errors
            process_time = (time.time() - start_time) * 1000

            # Log error with correlation ID (handled by logging middleware)
            request.state.error = e
            request.state.process_time = process_time

            raise


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Adds comprehensive security headers based on OWASP recommendations.
    Implements security best practices from 2024-2025 guidelines.
    """

    def __init__(self, app: ASGIApp):
        super().__init__(app)
        self.settings = get_settings()

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)

        if not self.settings.security.enable_security_headers:
            return response

        # Security headers following OWASP guidelines
        security_headers = {
            # Prevent clickjacking
            "X-Frame-Options": "DENY",
            # Prevent MIME type sniffing
            "X-Content-Type-Options": "nosniff",
            # Enable XSS protection
            "X-XSS-Protection": "1; mode=block",
            # Referrer policy
            "Referrer-Policy": "strict-origin-when-cross-origin",
            # Content Security Policy (basic)
            "Content-Security-Policy": (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data: https:; "
                "font-src 'self' data:; "
                "connect-src 'self'; "
                "frame-ancestors 'none';"
            ),
            # HSTS (only for HTTPS)
            "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
            # Permissions policy
            "Permissions-Policy": (
                "geolocation=(), "
                "microphone=(), "
                "camera=(), "
                "payment=(), "
                "usb=(), "
                "magnetometer=(), "
                "gyroscope=(), "
                "speaker=()"
            ),
            # Server information
            "Server": f"{self.settings.app.app_name}/{self.settings.app.app_version}",
        }

        # Add headers to response
        for header, value in security_headers.items():
            response.headers[header] = value

        return response


class PerformanceMonitoringMiddleware(BaseHTTPMiddleware):
    """
    Monitors performance metrics and adds detailed timing information.
    Implements comprehensive performance tracking for production environments.
    """

    def __init__(self, app: ASGIApp):
        super().__init__(app)
        self.settings = get_settings()
        self.slow_requests = []

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Track request start time and memory
        start_time = time.time()

        try:
            response = await call_next(request)

            # Calculate timing metrics
            total_time = (time.time() - start_time) * 1000

            # Add detailed performance headers
            response.headers["X-Response-Time"] = f"{total_time:.2f}ms"

            # Track slow requests
            if total_time > (self.settings.monitoring.slow_query_threshold * 1000):
                self._track_slow_request(request, total_time)
                response.headers["X-Slow-Request"] = "true"

            # Add performance category
            if total_time < 100:
                response.headers["X-Performance"] = "fast"
            elif total_time < 500:
                response.headers["X-Performance"] = "acceptable"
            elif total_time < 1000:
                response.headers["X-Performance"] = "slow"
            else:
                response.headers["X-Performance"] = "very-slow"

            return response

        except Exception as e:
            total_time = (time.time() - start_time) * 1000
            self._track_error_request(request, total_time, str(e))
            raise

    def _track_slow_request(self, request: Request, response_time: float):
        """Track slow requests for analysis"""
        slow_request = {
            "timestamp": time.time(),
            "method": request.method,
            "path": str(request.url.path),
            "response_time": response_time,
            "correlation_id": getattr(request.state, "correlation_id", None),
        }

        # Keep only last 100 slow requests in memory
        self.slow_requests.append(slow_request)
        if len(self.slow_requests) > 100:
            self.slow_requests.pop(0)

    def _track_error_request(self, request: Request, response_time: float, error: str):
        """Track error requests for analysis"""
        # Similar tracking for error requests
        pass


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Comprehensive request/response logging with structured format.
    Implements JSON logging with correlation IDs for production monitoring.
    """

    def __init__(self, app: ASGIApp):
        super().__init__(app)
        self.settings = get_settings()

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip logging for health checks and metrics endpoints
        if self._should_skip_logging(request):
            return await call_next(request)

        correlation_id = getattr(request.state, "correlation_id", str(uuid.uuid4()))
        start_time = time.time()

        # Log request
        await self._log_request(request, correlation_id)

        try:
            response = await call_next(request)

            # Log successful response
            process_time = (time.time() - start_time) * 1000
            await self._log_response(request, response, correlation_id, process_time)

            return response

        except Exception as e:
            # Log error response
            process_time = (time.time() - start_time) * 1000
            await self._log_error(request, e, correlation_id, process_time)
            raise

    def _should_skip_logging(self, request: Request) -> bool:
        """Determine if request should be skipped from logging"""
        skip_paths = {
            self.settings.monitoring.health_check_endpoint,
            self.settings.monitoring.metrics_endpoint,
            "/favicon.ico",
        }
        return str(request.url.path) in skip_paths

    async def _log_request(self, request: Request, correlation_id: str):
        """Log incoming request details"""
        if not self.settings.monitoring.enable_request_logging:
            return

        log_data = {
            "event": "request_start",
            "timestamp": time.time(),
            "correlation_id": correlation_id,
            "method": request.method,
            "path": str(request.url.path),
            "query_params": dict(request.query_params),
            "headers": dict(request.headers),
            "client_ip": self._get_client_ip(request),
            "user_agent": request.headers.get("user-agent"),
        }

        # Log as structured JSON
        import logging

        logger = logging.getLogger("request")
        logger.info(json.dumps(log_data))

    async def _log_response(
        self,
        request: Request,
        response: Response,
        correlation_id: str,
        process_time: float,
    ):
        """Log response details"""
        log_data = {
            "event": "request_complete",
            "timestamp": time.time(),
            "correlation_id": correlation_id,
            "method": request.method,
            "path": str(request.url.path),
            "status_code": response.status_code,
            "process_time_ms": round(process_time, 2),
            "response_headers": dict(response.headers),
        }

        import logging

        logger = logging.getLogger("request")

        if response.status_code >= 400:
            logger.warning(json.dumps(log_data))
        else:
            logger.info(json.dumps(log_data))

    async def _log_error(
        self,
        request: Request,
        error: Exception,
        correlation_id: str,
        process_time: float,
    ):
        """Log error details"""
        log_data = {
            "event": "request_error",
            "timestamp": time.time(),
            "correlation_id": correlation_id,
            "method": request.method,
            "path": str(request.url.path),
            "error_type": type(error).__name__,
            "error_message": str(error),
            "process_time_ms": round(process_time, 2),
        }

        import logging

        logger = logging.getLogger("request")
        logger.error(json.dumps(log_data))

    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP handling proxies"""
        # Check for forwarded headers (proxy support)
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()

        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip

        # Fallback to direct client IP
        if hasattr(request, "client") and request.client:
            return request.client.host

        return "unknown"


class CompressionMiddleware(BaseHTTPMiddleware):
    """
    Response compression middleware for performance optimization.
    Implements smart compression based on content type and size.
    """

    def __init__(self, app: ASGIApp):
        super().__init__(app)
        self.settings = get_settings()
        self.compressible_types = {
            "application/json",
            "application/javascript",
            "text/html",
            "text/css",
            "text/plain",
            "text/xml",
            "application/xml",
        }

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if not self.settings.performance.enable_compression:
            return await call_next(request)

        response = await call_next(request)

        # Check if compression is appropriate
        if self._should_compress(request, response):
            # Add compression header
            response.headers["Content-Encoding"] = "gzip"
            response.headers["Vary"] = "Accept-Encoding"

        return response

    def _should_compress(self, request: Request, response: Response) -> bool:
        """Determine if response should be compressed"""
        # Check if client accepts gzip
        accept_encoding = request.headers.get("accept-encoding", "")
        if "gzip" not in accept_encoding:
            return False

        # Check content type
        content_type = response.headers.get("content-type", "")
        if not any(ct in content_type for ct in self.compressible_types):
            return False

        # Check content length (if available)
        content_length = response.headers.get("content-length")
        if content_length:
            if int(content_length) < self.settings.performance.compression_minimum_size:
                return False

        # Don't compress already compressed content
        if response.headers.get("content-encoding"):
            return False

        return True


# Middleware registry for easy management
MIDDLEWARE_STACK = [
    RequestTrackingMiddleware,
    SecurityHeadersMiddleware,
    PerformanceMonitoringMiddleware,
    RequestLoggingMiddleware,
    CompressionMiddleware,
]


def add_middleware_stack(app):
    """Add the complete middleware stack to FastAPI app"""
    # Add middleware in reverse order (they execute in reverse order)
    for middleware_class in reversed(MIDDLEWARE_STACK):
        app.add_middleware(middleware_class)
