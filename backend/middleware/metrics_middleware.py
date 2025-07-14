"""Middleware for collecting request metrics."""

from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from utils.metrics_collector import metrics_collector

class MetricsMiddleware(BaseHTTPMiddleware):
    """Middleware for collecting request metrics."""

    def __init__(self, app: ASGIApp):
        """Initialize metrics middleware.
        
        Args:
            app: ASGI application
        """
        super().__init__(app)

    async def dispatch(
        self, request: Request, call_next: Callable
    ) -> Response:
        """Process request and collect metrics.
        
        Args:
            request: FastAPI request
            call_next: Next middleware in chain
            
        Returns:
            Response: FastAPI response
        """
        # Start tracking request
        metrics = metrics_collector.start_request(
            endpoint=str(request.url.path),
            method=request.method
        )

        try:
            # Process request
            response = await call_next(request)

            # Update metrics
            metrics_collector.end_request(
                metrics=metrics,
                status_code=response.status_code,
                cache_hit="X-Cache-Hit" in response.headers,
                model_used=response.headers.get("X-Model-Used"),
                queue_time=float(response.headers.get("X-Queue-Time", 0))
            )

            return response

        except Exception as e:
            # Record error metrics
            metrics_collector.end_request(
                metrics=metrics,
                status_code=500,
                error=str(e)
            )
            raise 