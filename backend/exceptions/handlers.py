"""
Global Exception Handlers for FastAPI
Implements comprehensive error handling following 2024-2025 best practices.
Includes standardized response helpers ok() and fail().
"""

import traceback
from typing import Any, Dict, Optional, Union

from fastapi import HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from backend.config.settings import get_settings
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
    """Create a standardized error response"""
    return {
        "success": False,
        "data": data,
        "error": {"code": error_code, "message": message},
    }


class APIException(HTTPException):
    """Custom API exception with enhanced error information"""

    def __init__(
        self,
        status_code: int,
        message: str,
        error_code: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
    ):
        self.message = message
        self.error_code = error_code or f"API_ERROR_{status_code}"
        self.details = details or {}
        super().__init__(status_code=status_code, detail=message, headers=headers)


class ValidationException(APIException):
    """Exception for validation errors"""

    def __init__(self, message: str, field_errors: Optional[Dict] = None):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            message=message,
            error_code="VALIDATION_ERROR",
            details={"field_errors": field_errors or {}},
        )


class BusinessLogicException(APIException):
    """Exception for business logic violations"""

    def __init__(self, message: str, business_rule: str):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            message=message,
            error_code="BUSINESS_LOGIC_ERROR",
            details={"business_rule": business_rule},
        )


class ResourceNotFoundException(APIException):
    """Exception for resource not found errors"""

    def __init__(self, resource_type: str, resource_id: str):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            message=f"{resource_type} not found",
            error_code="RESOURCE_NOT_FOUND",
            details={"resource_type": resource_type, "resource_id": resource_id},
        )


class AuthenticationException(APIException):
    """Exception for authentication errors"""

    def __init__(self, message: str = "Authentication required"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            message=message,
            error_code="AUTHENTICATION_ERROR",
            headers={"WWW-Authenticate": "Bearer"},
        )


class AuthorizationException(APIException):
    """Exception for authorization errors"""

    def __init__(self, message: str = "Insufficient permissions"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            message=message,
            error_code="AUTHORIZATION_ERROR",
        )


class RateLimitException(APIException):
    """Exception for rate limiting"""

    def __init__(self, limit: int, window: int, retry_after: int):
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            message="Rate limit exceeded",
            error_code="RATE_LIMIT_EXCEEDED",
            details={"limit": limit, "window": window, "retry_after": retry_after},
            headers={"Retry-After": str(retry_after)},
        )


class ExternalServiceException(APIException):
    """Exception for external service errors"""

    def __init__(self, service_name: str, error_message: str):
        super().__init__(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            message=f"External service {service_name} is unavailable",
            error_code="EXTERNAL_SERVICE_ERROR",
            details={"service_name": service_name, "error_message": error_message},
        )


def create_error_response(
    request: Request,
    status_code: int,
    message: str,
    error_code: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    correlation_id: Optional[str] = None,
) -> JSONResponse:
    """Create standardized error response"""
    settings = get_settings()

    # Get correlation ID from request if not provided
    if not correlation_id:
        correlation_id = getattr(request.state, "correlation_id", None)

    error_response = {
        "error": {
            "code": error_code or f"HTTP_{status_code}",
            "message": message,
            "timestamp": "2024-01-01T00:00:00Z",  # Will be set by middleware
            "path": str(request.url.path),
            "method": request.method,
        }
    }

    # Add correlation ID if available
    if correlation_id:
        error_response["error"]["correlation_id"] = correlation_id

    # Add details in development/staging
    if details and settings.environment.value != "production":
        error_response["error"]["details"] = details

    # Add request ID for tracking
    if hasattr(request.state, "request_id"):
        error_response["error"]["request_id"] = request.state.request_id

    return JSONResponse(status_code=status_code, content=error_response)


async def api_exception_handler(request: Request, exc: APIException) -> JSONResponse:
    """Handle custom API exceptions"""
    correlation_id = getattr(request.state, "correlation_id", None)

    # Log the exception
    app_logger.error(
        f"API Exception: {exc.message}",
        error_code=exc.error_code,
        status_code=exc.status_code,
        details=exc.details,
        correlation_id=correlation_id,
        path=str(request.url.path),
        method=request.method,
    )

    return create_error_response(
        request=request,
        status_code=exc.status_code,
        message=exc.message,
        error_code=exc.error_code,
        details=exc.details,
        correlation_id=correlation_id,
    )


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Handle FastAPI HTTP exceptions"""
    correlation_id = getattr(request.state, "correlation_id", None)

    # Log the exception
    if exc.status_code >= 500:
        app_logger.error(
            f"HTTP Exception: {exc.detail}",
            status_code=exc.status_code,
            correlation_id=correlation_id,
            path=str(request.url.path),
            method=request.method,
        )
    elif exc.status_code >= 400:
        app_logger.warning(
            f"HTTP Exception: {exc.detail}",
            status_code=exc.status_code,
            correlation_id=correlation_id,
            path=str(request.url.path),
            method=request.method,
        )

    # Log security events for specific status codes
    if exc.status_code in [401, 403, 429]:
        client_ip = getattr(request, "client", {}).get("host", "unknown")
        security_logger.log_suspicious_activity(
            activity_type=f"http_{exc.status_code}",
            details={"detail": exc.detail, "path": str(request.url.path)},
            ip_address=client_ip,
            correlation_id=correlation_id,
        )

    return create_error_response(
        request=request,
        status_code=exc.status_code,
        message=str(exc.detail),
        error_code=f"HTTP_{exc.status_code}",
        correlation_id=correlation_id,
    )


async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """Handle Pydantic validation exceptions"""
    correlation_id = getattr(request.state, "correlation_id", None)

    # Extract validation errors
    field_errors = {}
    for error in exc.errors():
        field_name = ".".join(str(loc) for loc in error["loc"])
        field_errors[field_name] = error["msg"]

    # Log the validation error
    app_logger.warning(
        "Validation error",
        field_errors=field_errors,
        correlation_id=correlation_id,
        path=str(request.url.path),
        method=request.method,
    )

    return create_error_response(
        request=request,
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        message="Validation failed",
        error_code="VALIDATION_ERROR",
        details={"field_errors": field_errors},
        correlation_id=correlation_id,
    )


async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle unexpected exceptions"""
    correlation_id = getattr(request.state, "correlation_id", None)
    settings = get_settings()

    # Log the unexpected exception with full traceback
    app_logger.exception(
        f"Unexpected exception: {type(exc).__name__}: {str(exc)}",
        exception_type=type(exc).__name__,
        correlation_id=correlation_id,
        path=str(request.url.path),
        method=request.method,
        traceback=traceback.format_exc(),
    )

    # In production, don't expose internal error details
    if settings.environment.value == "production":
        message = "An internal error occurred"
        details = None
    else:
        message = f"{type(exc).__name__}: {str(exc)}"
        details = {"traceback": traceback.format_exc().split("\n")}

    return create_error_response(
        request=request,
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        message=message,
        error_code="INTERNAL_SERVER_ERROR",
        details=details,
        correlation_id=correlation_id,
    )


async def starlette_http_exception_handler(
    request: Request, exc: StarletteHTTPException
) -> JSONResponse:
    """Handle Starlette HTTP exceptions"""
    correlation_id = getattr(request.state, "correlation_id", None)

    # Log the exception
    app_logger.warning(
        f"Starlette HTTP Exception: {exc.detail}",
        status_code=exc.status_code,
        correlation_id=correlation_id,
        path=str(request.url.path),
        method=request.method,
    )

    return create_error_response(
        request=request,
        status_code=exc.status_code,
        message=str(exc.detail),
        error_code=f"HTTP_{exc.status_code}",
        correlation_id=correlation_id,
    )


def register_exception_handlers(app):
    """Register all exception handlers with the FastAPI app"""

    # Custom API exceptions
    app.add_exception_handler(APIException, api_exception_handler)

    # FastAPI built-in exceptions
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)

    # Starlette exceptions
    app.add_exception_handler(StarletteHTTPException, starlette_http_exception_handler)

    # Catch-all for unexpected exceptions
    app.add_exception_handler(Exception, general_exception_handler)


# Utility functions for raising common exceptions
def raise_not_found(resource_type: str, resource_id: str) -> None:
    """Raise a resource not found exception"""
    raise ResourceNotFoundException(resource_type, resource_id)


def raise_validation_error(message: str, field_errors: Optional[Dict] = None) -> None:
    """Raise a validation exception"""
    raise ValidationException(message, field_errors)


def raise_business_logic_error(message: str, business_rule: str) -> None:
    """Raise a business logic exception"""
    raise BusinessLogicException(message, business_rule)


def raise_unauthorized(message: str = "Authentication required") -> None:
    """Raise an authentication exception"""
    raise AuthenticationException(message)


def raise_forbidden(message: str = "Insufficient permissions") -> None:
    """Raise an authorization exception"""
    raise AuthorizationException(message)


def raise_rate_limit_exceeded(limit: int, window: int, retry_after: int) -> None:
    """Raise a rate limit exception"""
    raise RateLimitException(limit, window, retry_after)


def raise_external_service_error(service_name: str, error_message: str) -> None:
    """Raise an external service exception"""
    raise ExternalServiceException(service_name, error_message)
