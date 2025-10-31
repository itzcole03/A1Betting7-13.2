"""
Standard API Response Models and Utilities

This module provides the standardized response contract for all HTTP endpoints:
{success, data, error, meta} format with proper exception handling.
"""

from datetime import datetime
from typing import Any, Dict, Optional, TypeVar, Generic
from pydantic import BaseModel, Field
import time
import traceback

# Type variable for generic response data
T = TypeVar('T')

class ErrorDetail(BaseModel):
    """Standard error detail structure"""
    code: str = Field(..., description="Error code for programmatic handling")
    message: str = Field(..., description="User-friendly error message") 
    details: Optional[str] = Field(None, description="Technical details for debugging")

class ResponseMeta(BaseModel):
    """Standard response metadata"""
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
    processing_time_ms: Optional[float] = Field(default=None, description="Request processing time in milliseconds")
    version: str = Field(default="1.0.0", description="API version")
    request_id: Optional[str] = Field(default=None, description="Unique request identifier")

class StandardAPIResponse(BaseModel, Generic[T]):
    """
    Standardized API response format for all HTTP endpoints.
    
    Success case:
        {success: True, data: <T>, error: None, meta: {...}}
    
    Error case: 
        {success: False, data: None, error: {...}, meta: {...}}
    """
    success: bool = Field(..., description="Whether the request succeeded")
    data: Optional[T] = Field(None, description="Response data on success")
    error: Optional[ErrorDetail] = Field(None, description="Error details on failure")
    meta: ResponseMeta = Field(default_factory=lambda: ResponseMeta(), description="Response metadata")

# Response helper functions
def success_response(
    data: Any = None,
    processing_time_ms: Optional[float] = None,
    request_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Create a standardized success response.
    
    Args:
        data: The response data
        processing_time_ms: Processing time in milliseconds
        request_id: Unique request identifier
    
    Returns:
        Standardized success response dictionary
    """
    meta = ResponseMeta(
        processing_time_ms=processing_time_ms,
        request_id=request_id
    )
    
    return {
        "success": True,
        "data": data,
        "error": None,
        "meta": meta.dict()
    }

def error_response(
    error_code: str,
    message: str,
    details: Optional[str] = None,
    processing_time_ms: Optional[float] = None,
    request_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Create a standardized error response.
    
    Args:
        error_code: Error code for programmatic handling
        message: User-friendly error message
        details: Technical details for debugging
        processing_time_ms: Processing time in milliseconds
        request_id: Unique request identifier
    
    Returns:
        Standardized error response dictionary
    """
    error_detail = ErrorDetail(
        code=error_code,
        message=message,
        details=details
    )
    
    meta = ResponseMeta(
        processing_time_ms=processing_time_ms,
        request_id=request_id
    )
    
    return {
        "success": False,
        "data": None,
        "error": error_detail.dict(),
        "meta": meta.dict()
    }

# Convenience wrapper class for route handlers
class ResponseBuilder:
    """
    Helper class for building standardized responses with automatic timing.
    
    Usage:
        builder = ResponseBuilder()
        # ... do work ...
        return builder.success(data)
        # or 
        return builder.error("ERROR_CODE", "User message", "Tech details")
    """
    
    def __init__(self, request_id: Optional[str] = None):
        self.request_id = request_id
        self.start_time = time.time()
    
    def _get_processing_time(self) -> float:
        """Get processing time in milliseconds"""
        return (time.time() - self.start_time) * 1000
    
    def success(self, data: Any = None) -> Dict[str, Any]:
        """Build success response with automatic timing"""
        return success_response(
            data=data,
            processing_time_ms=self._get_processing_time(),
            request_id=self.request_id
        )
    
    def error(self, error_code: str, message: str, details: Optional[str] = None) -> Dict[str, Any]:
        """Build error response with automatic timing"""
        return error_response(
            error_code=error_code,
            message=message,
            details=details,
            processing_time_ms=self._get_processing_time(),
            request_id=self.request_id
        )

# Decorator for automatic response formatting
def standardize_response(func):
    """
    Decorator to automatically wrap route handler responses in standard format.
    
    The decorated function should either:
    1. Return data directly (will be wrapped in success response)
    2. Raise a StandardAPIException (will be caught and formatted)
    """
    import functools
    
    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        builder = ResponseBuilder()
        
        try:
            # Call the original function
            result = await func(*args, **kwargs)
            
            # If result is already a standardized response, return as-is
            if isinstance(result, dict) and 'success' in result and 'data' in result and 'error' in result:
                return result
                
            # Otherwise wrap in success response
            return builder.success(result)
            
        except StandardAPIException as e:
            return builder.error(e.error_code, e.message, str(e.details) if e.details else None)
        except Exception as e:
            # Log unexpected errors
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Unexpected error in {func.__name__}: {traceback.format_exc()}")
            
            return builder.error(
                error_code="INTERNAL_SERVER_ERROR",
                message="An unexpected error occurred",
                details=str(e)
            )
    
    return wrapper

# Standard API exceptions
class StandardAPIException(Exception):
    """Base exception for standardized API errors"""
    
    def __init__(self, error_code: str, message: str, details: Any = None):
        self.error_code = error_code
        self.message = message
        self.details = details
        super().__init__(message)

class ValidationException(StandardAPIException):
    """Exception for input validation errors"""
    
    def __init__(self, message: str, details: Any = None):
        super().__init__("VALIDATION_ERROR", message, details)

class BusinessLogicException(StandardAPIException):
    """Exception for business logic errors"""
    
    def __init__(self, message: str, details: Any = None):
        super().__init__("BUSINESS_LOGIC_ERROR", message, details)

class AuthenticationException(StandardAPIException):
    """Exception for authentication errors"""
    
    def __init__(self, message: str, details: Any = None):
        super().__init__("AUTHENTICATION_ERROR", message, details)

class AuthorizationException(StandardAPIException):
    """Exception for authorization errors"""
    
    def __init__(self, message: str, details: Any = None):
        super().__init__("AUTHORIZATION_ERROR", message, details)

class ResourceNotFoundException(StandardAPIException):
    """Exception for resource not found errors"""
    
    def __init__(self, message: str, details: Any = None):
        super().__init__("RESOURCE_NOT_FOUND", message, details)

class ServiceUnavailableException(StandardAPIException):
    """Exception for service unavailable errors"""
    
    def __init__(self, message: str, details: Any = None):
        super().__init__("SERVICE_UNAVAILABLE", message, details)

# Legacy compatibility - gradual migration helpers
def ok(data: Any = None) -> Dict[str, Any]:
    """Legacy compatibility wrapper for success responses"""
    return success_response(data)

def fail(error_code: str, message: str, details: Optional[str] = None) -> Dict[str, Any]:
    """Legacy compatibility wrapper for error responses"""
    return error_response(error_code, message, details)
