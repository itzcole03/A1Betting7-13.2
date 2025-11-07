import logging

from fastapi import Request, status
from fastapi.exception_handlers import RequestValidationError
from fastapi.exceptions import HTTPException
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)


def get_correlation_id(request: Request):
    return getattr(request.state, "request_id", None) or request.headers.get(
        "X-Request-ID"
    )


def error_response(
    message, status_code, correlation_id=None, error_code=None, details=None
):
    body = {
        "error": message,
        "correlation_id": correlation_id,
        "error_code": error_code,
        "details": details,
    }
    return JSONResponse(content=body, status_code=status_code)


async def http_exception_handler(request: Request, exc: HTTPException):
    correlation_id = get_correlation_id(request)
    logger.error(f"HTTPException: {exc.detail}", extra={"request_id": correlation_id})
    return error_response(
        message=exc.detail,
        status_code=exc.status_code,
        correlation_id=correlation_id,
        error_code=getattr(exc, "error_code", None),
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    correlation_id = get_correlation_id(request)
    logger.error(
        f"Validation error: {exc.errors()}", extra={"request_id": correlation_id}
    )
    return error_response(
        message="Validation error",
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        correlation_id=correlation_id,
        error_code="validation_error",
        details=exc.errors(),
    )


async def generic_exception_handler(request: Request, exc: Exception):
    correlation_id = get_correlation_id(request)
    logger.error(f"Unhandled exception: {exc}", extra={"request_id": correlation_id})
    return error_response(
        message="Internal server error",
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        correlation_id=correlation_id,
        error_code="internal_error",
    )
