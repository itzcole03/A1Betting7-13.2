"""
Request Tracking Middleware

This module provides request tracking and logging functionality.
"""

import logging
import time
from typing import Any, Awaitable, Callable

from fastapi import Request

logger = logging.getLogger(__name__)


async def track_requests(
    request: Request, call_next: Callable[[Request], Awaitable[Any]]
) -> Any:
    """Track and log all incoming requests"""
    start_time = time.time()
    
    # Log request details
    logger.info(
        f"Request: {request.method} {request.url.path} "
        f"from {request.client.host if request.client else 'unknown'}"
    )
    
    # Process request
    try:
        response = await call_next(request)
        
        # Log response details
        process_time = time.time() - start_time
        logger.info(
            f"Response: {response.status_code} "
            f"took {process_time:.3f}s"
        )
        
        return response
        
    except Exception as e:
        # Log error details
        process_time = time.time() - start_time
        logger.error(
            f"Error: {request.method} {request.url.path} "
            f"failed after {process_time:.3f}s: {e}"
        )
        raise 