import logging
from uuid import uuid4

from fastapi import Request

logger = logging.getLogger(__name__)


async def correlation_middleware(request: Request, call_next):
    """Middleware to handle request correlation IDs"""
    # Get request ID from header or generate a new one if not present
    request_id = request.headers.get("X-Request-ID", str(uuid4()))

    # Add request ID to request state
    request.state.request_id = request_id

    # Add correlation ID to response headers
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id

    # Log with correlation ID
    logger.info(
        f"Request processed: {request.method} {request.url.path}",
        extra={"request_id": request_id},
    )

    return response
