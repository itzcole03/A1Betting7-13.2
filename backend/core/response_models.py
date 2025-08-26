"""
Standard API Response Models
Core response models and builders for consistent API contract compliance
"""

from __future__ import annotations

from typing import Any, Dict, Generic, List, Optional, TypeVar, Union
from pydantic import BaseModel, Field
from fastapi.responses import JSONResponse

T = TypeVar('T')


class APIError(BaseModel):
    """Standard error structure for API responses"""
    code: str = Field(..., description="Error code identifier")
    message: str = Field(..., description="Human-readable error message")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional error context")


class StandardAPIResponse(BaseModel, Generic[T]):
    """Standard response format for all API endpoints"""
    success: bool = Field(..., description="Whether the operation succeeded")
    data: Optional[T] = Field(None, description="Response data payload")
    error: Optional[APIError] = Field(None, description="Error information if operation failed")


class ResponseBuilder:
    """Builder pattern for creating standardized API responses"""
    
    @staticmethod
    def success(
        data: Any = None,
        message: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a successful response"""
        response = {
            "success": True,
            "data": data,
            "error": None
        }
        
        if message and data is None:
            response["data"] = {"message": message}

        # Promote commonly expected auth/compat fields to top-level for
        # backward compatibility with older clients/tests that expect
        # tokens or message at the root of the response.
        try:
            if isinstance(data, dict):
                promote_keys = ("access_token", "refresh_token", "token_type", "message", "user")
                for k in promote_keys:
                    if k in data:
                        response[k] = data[k]
        except Exception:
            # Be defensive; don't let promotion break normal flows
            pass
        
        return response
    
    @staticmethod
    def error(
        message: str,
        code: str = "OPERATION_FAILED",
        details: Optional[Dict[str, Any]] = None,
        status_code: int = 400
    ) -> JSONResponse:
        """Create an error response with proper HTTP status"""
        error_response = {
            "success": False,
            "data": None,
            "error": {
                "code": code,
                "message": message,
                "details": details
            }
        }
        # Backwards-compatibility: promote a top-level message/detail
        # so older clients/tests that look for these keys at the root
        # continue to work.
        try:
            error_response["message"] = message
            if details is not None:
                # Some callers expect a `detail` key at top-level
                error_response["detail"] = details
        except Exception:
            pass
        
        return JSONResponse(
            status_code=status_code,
            content=error_response
        )
    
    @staticmethod
    def validation_error(
        message: str = "Validation failed",
        details: Optional[Dict[str, Any]] = None
    ) -> JSONResponse:
        """Create a validation error response"""
        return ResponseBuilder.error(
            message=message,
            code="VALIDATION_ERROR",
            details=details,
            status_code=422
        )
    
    @staticmethod
    def not_found(
        resource: str,
        resource_id: Optional[str] = None
    ) -> JSONResponse:
        """Create a not found error response"""
        message = f"{resource} not found"
        if resource_id:
            message += f" with ID: {resource_id}"
            
        return ResponseBuilder.error(
            message=message,
            code="RESOURCE_NOT_FOUND",
            details={"resource": resource, "resource_id": resource_id},
            status_code=404
        )
    
    @staticmethod
    def unauthorized(
        message: str = "Authentication required"
    ) -> JSONResponse:
        """Create an unauthorized error response"""
        return ResponseBuilder.error(
            message=message,
            code="UNAUTHORIZED",
            status_code=401
        )
    
    @staticmethod
    def forbidden(
        message: str = "Insufficient permissions",
        required_permission: Optional[str] = None
    ) -> JSONResponse:
        """Create a forbidden error response"""
        details = None
        if required_permission:
            details = {"required_permission": required_permission}
            
        return ResponseBuilder.error(
            message=message,
            code="FORBIDDEN",
            details=details,
            status_code=403
        )
    
    @staticmethod
    def internal_error(
        message: str = "Internal server error occurred",
        details: Optional[Dict[str, Any]] = None
    ) -> JSONResponse:
        """Create an internal server error response"""
        return ResponseBuilder.error(
            message=message,
            code="INTERNAL_SERVER_ERROR",
            details=details,
            status_code=500
        )


# Common response types for documentation
class MessageResponse(BaseModel):
    """Response model for simple message responses"""
    message: str = Field(..., description="Response message")


class SuccessResponse(BaseModel):
    """Response model for success confirmation"""
    success: bool = Field(..., description="Operation success status")


class HealthResponse(BaseModel):
    """Response model for health check endpoints"""
    service: str = Field(..., description="Service name")
    status: str = Field(..., description="Service status")
    timestamp: str = Field(..., description="Health check timestamp")
    components: Optional[Dict[str, Any]] = Field(None, description="Component health details")


class ListResponse(BaseModel, Generic[T]):
    """Response model for list endpoints"""
    items: List[T] = Field(..., description="List of items")
    total: Optional[int] = Field(None, description="Total item count")
    page: Optional[int] = Field(None, description="Current page number")
    page_size: Optional[int] = Field(None, description="Items per page")
