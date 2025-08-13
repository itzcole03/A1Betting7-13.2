"""
Global Exception Handler
Converts all exceptions to standardized API response format
"""

import logging
from typing import Dict, Any
from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError, HTTPException
from starlette.exceptions import HTTPException as StarletteHTTPException

from .exceptions import BusinessLogicException
from .response_models import ResponseBuilder

logger = logging.getLogger(__name__)


async def business_logic_exception_handler(
    request: Request, 
    exc: BusinessLogicException
) -> JSONResponse:
    """Handle BusinessLogicException and convert to standard format"""
    logger.warning(
        f"Business logic error: {exc.detail}",
        extra={
            "error_code": exc.error_code,
            "path": request.url.path,
            "method": request.method,
            "details": exc.details
        }
    )
    
    return ResponseBuilder.error(
        message=exc.user_message,
        code=exc.error_code,
        details=exc.details,
        status_code=exc.status_code
    )


async def http_exception_handler(
    request: Request, 
    exc: HTTPException
) -> JSONResponse:
    """Handle standard HTTPException and convert to standard format"""
    logger.warning(
        f"HTTP exception: {exc.detail}",
        extra={
            "status_code": exc.status_code,
            "path": request.url.path,
            "method": request.method
        }
    )
    
    # Map common HTTP status codes to appropriate error codes
    error_code_mapping = {
        400: "BAD_REQUEST",
        401: "UNAUTHORIZED",
        403: "FORBIDDEN",
        404: "NOT_FOUND",
        422: "VALIDATION_ERROR",
        429: "RATE_LIMIT_EXCEEDED",
        500: "INTERNAL_SERVER_ERROR",
        503: "SERVICE_UNAVAILABLE"
    }
    
    error_code = error_code_mapping.get(exc.status_code, "HTTP_ERROR")
    
    return ResponseBuilder.error(
        message=str(exc.detail),
        code=error_code,
        status_code=exc.status_code
    )


async def validation_exception_handler(
    request: Request, 
    exc: RequestValidationError
) -> JSONResponse:
    """Handle Pydantic validation errors and convert to standard format"""
    logger.warning(
        f"Validation error: {exc.errors()}",
        extra={
            "path": request.url.path,
            "method": request.method,
            "errors": exc.errors()
        }
    )
    
    # Extract field names and error messages from Pydantic errors
    error_details = {}
    field_errors = []
    
    for error in exc.errors():
        field = ".".join([str(loc) for loc in error["loc"]])
        message = error["msg"]
        field_errors.append({"field": field, "message": message})
    
    error_details["field_errors"] = field_errors
    
    return ResponseBuilder.error(
        message="Request validation failed",
        code="VALIDATION_ERROR",
        details=error_details,
        status_code=422
    )


async def general_exception_handler(
    request: Request, 
    exc: Exception
) -> JSONResponse:
    """Handle unexpected exceptions and convert to standard format"""
    logger.error(
        f"Unexpected error: {str(exc)}",
        exc_info=exc,
        extra={
            "path": request.url.path,
            "method": request.method,
            "exception_type": type(exc).__name__
        }
    )
    
    return ResponseBuilder.error(
        message="An unexpected error occurred",
        code="INTERNAL_SERVER_ERROR",
        details={"exception_type": type(exc).__name__},
        status_code=500
    )


def setup_exception_handlers(app):
    """Setup all exception handlers for the FastAPI application"""
    
    # Custom business logic exceptions (highest priority)
    app.add_exception_handler(BusinessLogicException, business_logic_exception_handler)
    
    # Pydantic validation errors
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    
    # Standard HTTP exceptions
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    
    # Catch-all for unexpected exceptions (lowest priority)
    app.add_exception_handler(Exception, general_exception_handler)
    
    logger.info("Global exception handlers configured successfully")
