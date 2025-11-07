"""
Request ID Middleware

Provides cross-layer request correlation by:
- Accepting X-Request-Id from frontend or generating new UUID
- Storing request ID in request.state and contextvars
- Adding request ID to all response headers
- Logging request duration and metadata
"""

import time
import uuid
from typing import Callable
import logging

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from ..utils.log_context import set_request_id, get_contextual_logger

# Logger for middleware operations
logger = get_contextual_logger(__name__)


class RequestIdMiddleware(BaseHTTPMiddleware):
    """
    Middleware for request ID correlation and timing
    
    Features:
    - Accepts X-Request-Id header or generates UUID4
    - Sets request.state.request_id for FastAPI access
    - Adds X-Request-Id to response headers
    - Logs request timing and metadata
    - Integrates with contextvars for automatic log correlation
    """
    
    def __init__(self, app, header_name: str = "X-Request-Id"):
        super().__init__(app)
        self.header_name = header_name
        
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Process request with ID correlation and timing
        
        Args:
            request: Incoming HTTP request
            call_next: Next middleware/route handler
            
        Returns:
            Response with request ID header and timing logs
        """
        # Extract or generate request ID
        request_id = request.headers.get(self.header_name)
        if not request_id:
            request_id = str(uuid.uuid4())
            
        # Store in request state for FastAPI access
        request.state.request_id = request_id
        
        # Set in contextvars for logging
        set_request_id(request_id)
        
        # Record request start
        start_time = time.time()
        
        # Log request start
        logger.info(
            f"Request started: {request.method} {request.url.path}",
            extra={
                'event_type': 'request_start',
                'method': request.method,
                'path': str(request.url.path),
                'query_params': dict(request.query_params) if request.query_params else None,
                'user_agent': request.headers.get('user-agent'),
                'client_ip': self._get_client_ip(request),
                'request_size': request.headers.get('content-length', '0')
            }
        )
        
        try:
            # Process request
            response = await call_next(request)
            
            # Calculate duration
            duration = time.time() - start_time
            duration_ms = round(duration * 1000, 2)
            
            # Add request ID to response headers
            response.headers[self.header_name] = request_id
            
            # Log successful request
            logger.info(
                f"Request completed: {request.method} {request.url.path} - {response.status_code}",
                extra={
                    'event_type': 'request_complete',
                    'method': request.method,
                    'path': str(request.url.path),
                    'status_code': response.status_code,
                    'duration_ms': duration_ms,
                    'response_size': response.headers.get('content-length', '0')
                }
            )
            
            return response
            
        except Exception as e:
            # Calculate duration for failed request
            duration = time.time() - start_time
            duration_ms = round(duration * 1000, 2)
            
            # Log failed request
            logger.error(
                f"Request failed: {request.method} {request.url.path} - {str(e)}",
                extra={
                    'event_type': 'request_error',
                    'method': request.method,
                    'path': str(request.url.path),
                    'duration_ms': duration_ms,
                    'error_type': type(e).__name__,
                    'error_message': str(e)
                }
            )
            
            # Re-raise the exception
            raise
            
    def _get_client_ip(self, request: Request) -> str:
        """
        Extract client IP from request headers
        
        Args:
            request: HTTP request
            
        Returns:
            Client IP address
        """
        # Check for forwarded headers (proxy/load balancer)
        forwarded_for = request.headers.get('x-forwarded-for')
        if forwarded_for:
            # First IP in the chain is the original client
            return forwarded_for.split(',')[0].strip()
            
        # Check for real IP header
        real_ip = request.headers.get('x-real-ip')
        if real_ip:
            return real_ip
            
        # Fall back to direct client
        if request.client:
            return request.client.host
            
        return 'unknown'


def setup_request_correlation():
    """
    Setup function for request correlation middleware
    
    Usage in app factory:
        from backend.middleware.request_id_middleware import setup_request_correlation
        app.add_middleware(RequestIdMiddleware)
        setup_request_correlation()
    """
    logger.info("Request ID correlation middleware configured")


# Utility function for manual request ID access
def get_request_id_from_request(request: Request) -> str:
    """
    Get request ID from FastAPI request object
    
    Args:
        request: FastAPI request
        
    Returns:
        Request ID string, or 'unknown' if not found
    """
    return getattr(request.state, 'request_id', 'unknown')