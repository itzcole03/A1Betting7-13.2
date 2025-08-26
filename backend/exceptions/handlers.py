"""
Global Exception Handlers for FastAPI - Updated for Error Taxonomy
Implements comprehensive error handling with unified error taxonomy.
Integrates with backend.errors.catalog for structured error responses.
"""

import traceback
from typing import Any, Dict, Optional, Union

from fastapi import HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from backend.config.settings import get_settings
from backend.errors import ApiError, ErrorCode, build_error

try:
    from backend.utils.structured_logging import app_logger, security_logger
except ImportError:
    import logging
    app_logger = logging.getLogger(__name__)
    security_logger = app_logger


# Standardized response helpers - available globally  
def ok(data=None, message: Optional[str] = None):
    """Create a standardized success response"""
    response = {"success": True, "data": data, "error": None}
    if message:
        response["message"] = message
    return response


def fail(error_code="ERROR", message="An error occurred", data=None):
    """Create a standardized error response - DEPRECATED: Use ApiError instead"""
    import warnings
    warnings.warn("fail() is deprecated, use ApiError with error taxonomy instead", DeprecationWarning)
    return {
        "success": False,
        "data": data,
        "error": {"code": error_code, "message": message},
    }


# Convenience functions for raising common errors (using new taxonomy)
def raise_not_found(resource_type: str, resource_id: str) -> None:
    """Raise a resource not found exception"""
    from backend.errors import not_found_error
    raise not_found_error(resource_type, resource_id)


def raise_validation_error(message: str, field: Optional[str] = None) -> None:
    """Raise a validation exception"""
    from backend.errors import validation_error
    raise validation_error(message, field)


def raise_unauthorized(message: str = "Authentication required") -> None:
    """Raise an authentication exception"""
    from backend.errors import auth_error
    raise auth_error(message)


def raise_dependency_error(service: str, message: Optional[str] = None) -> None:
    """Raise a dependency exception"""
    from backend.errors import dependency_error
    raise dependency_error(service, message)


def raise_rate_limit_exceeded(limit: int, window: int, retry_after: int) -> None:
    """Raise a rate limit exception"""
    from backend.errors import rate_limit_error
    raise rate_limit_error(limit, window, retry_after)


# FastAPI Exception Handlers with Structured Error Taxonomy
async def api_error_handler(request: Request, exc: ApiError) -> JSONResponse:
    """Handle ApiError exceptions with structured error taxonomy"""
    
    # Get route path for metrics
    route_path = getattr(request.url, "path", "unknown")
    
    # Convert to structured error response
    error_response = exc.to_response(route=route_path)
    
    # Extract HTTP status from response
    http_status = error_response.pop("_http_status", 500)
    
    app_logger.info(
        f"API Error handled: {exc.code.value}",
        extra={
            "error_code": exc.code.value,
            "route": route_path,
            "method": request.method,
            "client_ip": getattr(request.client, "host", "unknown") if request.client else "unknown",
        }
    )
    
    return JSONResponse(
        status_code=http_status,
        content=error_response
    )


async def validation_exception_handler(request: Request, exc: Union[RequestValidationError, ValidationError]) -> JSONResponse:
    """Handle FastAPI/Pydantic validation errors with structured taxonomy"""
    
    # Extract validation error details
    if isinstance(exc, RequestValidationError):
        errors = exc.errors()
    elif isinstance(exc, ValidationError):
        errors = exc.errors()
    else:
        errors = []
    # Format validation details
    validation_details = []
    for error in errors:
        field_path = " -> ".join(str(loc) for loc in error.get("loc", []))
        validation_details.append({
            "field": field_path,
            "message": error.get("msg", "Validation failed"),
            "type": error.get("type", "validation_error"),
            "input": error.get("input")
        })
    
    # Create structured error response
    error_response = build_error(
        code=ErrorCode.E1000_VALIDATION,
        message="Request validation failed",
        details={"validation_errors": validation_details},
        route=getattr(request.url, "path", "unknown")
    )
    # Ensure FastAPI-compatible top-level `detail` key exists for tests
    try:
        validation_details = exc.errors()
    except Exception:
        validation_details = []

    # Keep the structured envelope but add `detail` so callers expecting
    # FastAPI's default shape will find the validation info.
    response_body = dict(error_response)
    if "detail" not in response_body:
        response_body["detail"] = validation_details
    
    # Log validation details and full error response for debugging (ensure visible in test output)
    try:
        app_logger.error(f"Validation details: {validation_details}")
        app_logger.error(f"Validation error response: {error_response}")
    except Exception:
        # Fallback to printing if logger fails to avoid silent failures during tests
        try:
            print("Validation details:", validation_details)
            print("Validation error response:", error_response)
        except Exception:
            pass
    
    # Extract HTTP status
    # Preserve FastAPI's default of 422 for request validation errors
    if isinstance(exc, RequestValidationError):
        http_status = 422
    else:
        http_status = error_response.pop("_http_status", 400)

    return JSONResponse(
        status_code=http_status,
        content=response_body
    )


async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle unexpected exceptions with structured error taxonomy"""
    
    # Log the full exception for debugging
    app_logger.error(
        f"Unexpected exception: {type(exc).__name__}: {str(exc)}",
        extra={
            "route": getattr(request.url, "path", "unknown"),
            "method": request.method,
            "exception_type": type(exc).__name__,
            "traceback": traceback.format_exc()
        }
    )
    
    # Check if we should show detailed errors (development mode)
    settings = get_settings()
    show_details = getattr(settings, 'DEBUG', False) or getattr(settings, 'SHOW_ERROR_DETAILS', False)
    
    # Build structured error response  
    details = None
    if show_details:
        details = {
            "exception_type": type(exc).__name__,
            "exception_message": str(exc),
            "traceback": traceback.format_exc().split('\n')
        }
    
    error_response = build_error(
        code=ErrorCode.E5000_INTERNAL,
        message="Internal server error" if not show_details else str(exc),
        details=details,
        route=getattr(request.url, "path", "unknown")
    )
    
    # Extract HTTP status
    http_status = error_response.pop("_http_status", 500)
    
    return JSONResponse(
        status_code=http_status,
        content=error_response
    )


async def http_exception_handler(request: Request, exc: Union[HTTPException, StarletteHTTPException]) -> JSONResponse:
    """Handle FastAPI HTTPException with structured error taxonomy"""
    
    # Map HTTP status codes to error codes
    status_to_error_code = {
        400: ErrorCode.E1000_VALIDATION,
        401: ErrorCode.E1100_AUTH,
        404: ErrorCode.E4040_NOT_FOUND,  # Use semantic 404 code
        413: ErrorCode.E1300_PAYLOAD_TOO_LARGE,
        415: ErrorCode.E1400_UNSUPPORTED_MEDIA_TYPE,
        429: ErrorCode.E1200_RATE_LIMIT,
        503: ErrorCode.E2000_DEPENDENCY,
        504: ErrorCode.E2400_TIMEOUT,
    }
    
    error_code = status_to_error_code.get(exc.status_code, ErrorCode.E5000_INTERNAL)
    
    # Extract detail message
    detail = exc.detail if hasattr(exc, 'detail') else "HTTP exception occurred"
    
    error_response = build_error(
        code=error_code,
        message=str(detail),
        override_status=exc.status_code,
        route=getattr(request.url, "path", "unknown")
    )
    
    # Extract HTTP status
    http_status = error_response.pop("_http_status", exc.status_code)
    
    return JSONResponse(
        status_code=http_status,
        content=error_response
    )


def register_exception_handlers(app) -> None:
    """Register all exception handlers with the FastAPI application"""
    
    # Register ApiError handler (highest priority - most specific)
    app.add_exception_handler(ApiError, api_error_handler)
    
    # Register payload guard error handler (payload security)
    try:
        from backend.middleware.payload_guard import PayloadRejectionError, payload_rejection_error_handler
        app.add_exception_handler(PayloadRejectionError, payload_rejection_error_handler)
        app_logger.info("✅ PayloadRejectionError handler registered")
    except ImportError:
        app_logger.warning("⚠️ PayloadRejectionError handler not available - payload guard not installed")
    
    # Register validation error handlers
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(ValidationError, validation_exception_handler)
    
    # Register HTTP exception handlers
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    
    # Register general exception handler (lowest priority - catch-all)
    app.add_exception_handler(Exception, general_exception_handler)
    
    app_logger.info("✅ All exception handlers registered with structured error taxonomy")
