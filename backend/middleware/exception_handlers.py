"""
Global Exception Handler Middleware

This middleware catches all unhandled exceptions and converts them to 
standardized API responses following the {success, data, error, meta} format.
"""

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import logging
import traceback
import time
from typing import Dict, Any

from backend.utils.standard_responses import (
    StandardAPIException,
    error_response,
    ValidationException,
    BusinessLogicException,
    AuthenticationException,
    AuthorizationException,
    ResourceNotFoundException,
    ServiceUnavailableException
)

logger = logging.getLogger(__name__)

def setup_exception_handlers(app: FastAPI) -> None:
    """
    Set up global exception handlers for the FastAPI app.
    
    This ensures all endpoints return the standardized response format
    even when exceptions are raised.
    """
    
    @app.exception_handler(StandardAPIException)
    async def standard_api_exception_handler(request: Request, exc: StandardAPIException) -> JSONResponse:
        """Handle custom StandardAPIException instances"""
        processing_time = getattr(request.state, 'start_time', None)
        if processing_time:
            processing_time = (time.time() - processing_time) * 1000
        
        request_id = getattr(request.state, 'request_id', None)
        
        response_data = error_response(
            error_code=exc.error_code,
            message=exc.message,
            details=str(exc.details) if exc.details else None,
            processing_time_ms=processing_time,
            request_id=request_id
        )
        
        # Log the error for monitoring
        logger.warning(
            f"API Error: {exc.error_code} - {exc.message}",
            extra={
                "error_code": exc.error_code,
                "request_path": str(request.url.path),
                "request_method": request.method,
                "request_id": request_id,
                "details": exc.details
            }
        )
        
        # Return appropriate HTTP status code based on error type
        status_code = _get_http_status_for_error_code(exc.error_code)
        
        return JSONResponse(
            status_code=status_code,
            content=response_data
        )
    
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
        """Handle Pydantic validation errors"""
        processing_time = getattr(request.state, 'start_time', None)
        if processing_time:
            processing_time = (time.time() - processing_time) * 1000
        
        request_id = getattr(request.state, 'request_id', None)
        
        # Format validation errors
        error_details = []
        for error in exc.errors():
            error_details.append({
                "field": ".".join(str(x) for x in error["loc"]),
                "message": error["msg"],
                "type": error["type"]
            })
        
        response_data = error_response(
            error_code="VALIDATION_ERROR",
            message="Request validation failed",
            details=f"Validation errors: {error_details}",
            processing_time_ms=processing_time,
            request_id=request_id
        )
        
        logger.warning(
            f"Validation Error: {exc}",
            extra={
                "error_code": "VALIDATION_ERROR",
                "request_path": str(request.url.path),
                "request_method": request.method,
                "request_id": request_id,
                "validation_errors": error_details
            }
        )
        
        return JSONResponse(
            status_code=422,
            content=response_data
        )
    
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
        """Handle FastAPI HTTPException instances"""
        processing_time = getattr(request.state, 'start_time', None)
        if processing_time:
            processing_time = (time.time() - processing_time) * 1000
        
        request_id = getattr(request.state, 'request_id', None)
        
        # Map HTTP status codes to error codes
        error_code = _get_error_code_for_status(exc.status_code)
        
        response_data = error_response(
            error_code=error_code,
            message=exc.detail if isinstance(exc.detail, str) else "HTTP error occurred",
            details=str(exc.detail) if not isinstance(exc.detail, str) else None,
            processing_time_ms=processing_time,
            request_id=request_id
        )
        
        logger.warning(
            f"HTTP Error {exc.status_code}: {exc.detail}",
            extra={
                "error_code": error_code,
                "request_path": str(request.url.path),
                "request_method": request.method,
                "request_id": request_id,
                "status_code": exc.status_code
            }
        )
        
        return JSONResponse(
            status_code=exc.status_code,
            content=response_data
        )
    
    @app.exception_handler(StarletteHTTPException)
    async def starlette_http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
        """Handle Starlette HTTPException instances"""
        processing_time = getattr(request.state, 'start_time', None)
        if processing_time:
            processing_time = (time.time() - processing_time) * 1000
        
        request_id = getattr(request.state, 'request_id', None)
        
        error_code = _get_error_code_for_status(exc.status_code)
        
        response_data = error_response(
            error_code=error_code,
            message=exc.detail if isinstance(exc.detail, str) else "HTTP error occurred",
            details=str(exc.detail) if not isinstance(exc.detail, str) else None,
            processing_time_ms=processing_time,
            request_id=request_id
        )
        
        return JSONResponse(
            status_code=exc.status_code,
            content=response_data
        )
    
    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        """Handle any other unhandled exceptions"""
        processing_time = getattr(request.state, 'start_time', None)
        if processing_time:
            processing_time = (time.time() - processing_time) * 1000
        
        request_id = getattr(request.state, 'request_id', None)
        
        # Log the full traceback for debugging
        logger.error(
            f"Unhandled Exception: {exc}",
            extra={
                "error_code": "INTERNAL_SERVER_ERROR",
                "request_path": str(request.url.path),
                "request_method": request.method,
                "request_id": request_id,
                "traceback": traceback.format_exc()
            }
        )
        
        response_data = error_response(
            error_code="INTERNAL_SERVER_ERROR",
            message="An internal server error occurred",
            details=str(exc) if logger.isEnabledFor(logging.DEBUG) else None,
            processing_time_ms=processing_time,
            request_id=request_id
        )
        
        return JSONResponse(
            status_code=500,
            content=response_data
        )

def _get_error_code_for_status(status_code: int) -> str:
    """Map HTTP status codes to error codes"""
    status_map = {
        400: "BAD_REQUEST",
        401: "AUTHENTICATION_ERROR", 
        403: "AUTHORIZATION_ERROR",
        404: "RESOURCE_NOT_FOUND",
        422: "VALIDATION_ERROR",
        429: "RATE_LIMIT_EXCEEDED",
        500: "INTERNAL_SERVER_ERROR",
        502: "BAD_GATEWAY",
        503: "SERVICE_UNAVAILABLE",
        504: "GATEWAY_TIMEOUT"
    }
    return status_map.get(status_code, "UNKNOWN_ERROR")

def _get_http_status_for_error_code(error_code: str) -> int:
    """Map error codes to HTTP status codes"""
    code_map = {
        "VALIDATION_ERROR": 422,
        "BUSINESS_LOGIC_ERROR": 400,
        "AUTHENTICATION_ERROR": 401,
        "AUTHORIZATION_ERROR": 403,
        "RESOURCE_NOT_FOUND": 404,
        "SERVICE_UNAVAILABLE": 503,
        "INTERNAL_SERVER_ERROR": 500
    }
    return code_map.get(error_code, 500)

def add_timing_middleware(app: FastAPI) -> None:
    """
    Add middleware to track request processing time and request IDs.
    
    This middleware adds timing information and request IDs that are used
    by the exception handlers and response builders.
    """
    
    @app.middleware("http")
    async def timing_middleware(request: Request, call_next):
        # Generate request ID and start timing
        import uuid
        request_id = str(uuid.uuid4())
        start_time = time.time()
        
        # Store in request state for access in handlers
        request.state.request_id = request_id
        request.state.start_time = start_time
        
        # Add request ID to response headers
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        
        return response
