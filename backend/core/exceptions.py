"""
Business Logic Exception
Standardized exception handling for business logic violations and operational errors
"""

from typing import Any, Dict, Optional
from fastapi import HTTPException


class BusinessLogicException(HTTPException):
    """
    Exception for business logic violations that should return standardized error responses
    
    This exception automatically converts to the standard {success, data, error} format
    when handled by the global exception handler.
    """
    
    def __init__(
        self,
        message: str,
        error_code: str = "BUSINESS_LOGIC_ERROR",
        status_code: int = 400,
        details: Optional[Dict[str, Any]] = None,
        user_message: Optional[str] = None
    ):
        """
        Initialize business logic exception
        
        Args:
            message: Technical error message for logging
            error_code: Standardized error code identifier
            status_code: HTTP status code (default: 400)
            details: Additional error context
            user_message: User-friendly message (defaults to message if not provided)
        """
        self.error_code = error_code
        self.details = details or {}
        self.user_message = user_message or message
        
        # Call parent with the technical message
        super().__init__(status_code=status_code, detail=message)


class ValidationException(BusinessLogicException):
    """Exception for input validation errors"""
    
    def __init__(
        self,
        message: str,
        field: Optional[str] = None,
        value: Optional[Any] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        validation_details = details or {}
        if field:
            validation_details["field"] = field
        if value is not None:
            validation_details["invalid_value"] = str(value)
            
        super().__init__(
            message=message,
            error_code="VALIDATION_ERROR",
            status_code=422,
            details=validation_details,
            user_message=f"Invalid {field}: {message}" if field else message
        )


class ResourceNotFoundException(BusinessLogicException):
    """Exception for resource not found errors"""
    
    def __init__(
        self,
        resource_type: str,
        resource_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        resource_details = details or {}
        resource_details["resource_type"] = resource_type
        if resource_id:
            resource_details["resource_id"] = resource_id
        
        message = f"{resource_type} not found"
        if resource_id:
            message += f" with ID: {resource_id}"
            
        super().__init__(
            message=message,
            error_code="RESOURCE_NOT_FOUND",
            status_code=404,
            details=resource_details,
            user_message=message
        )


class AuthenticationException(BusinessLogicException):
    """Exception for authentication errors"""
    
    def __init__(
        self,
        message: str = "Authentication required",
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            message=message,
            error_code="AUTHENTICATION_REQUIRED",
            status_code=401,
            details=details,
            user_message="Please provide valid authentication credentials"
        )


class AuthorizationException(BusinessLogicException):
    """Exception for authorization/permission errors"""
    
    def __init__(
        self,
        message: str = "Insufficient permissions",
        required_permission: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        auth_details = details or {}
        if required_permission:
            auth_details["required_permission"] = required_permission
            
        super().__init__(
            message=message,
            error_code="INSUFFICIENT_PERMISSIONS",
            status_code=403,
            details=auth_details,
            user_message="You don't have permission to perform this action"
        )


class ConfigurationException(BusinessLogicException):
    """Exception for configuration and setup errors"""
    
    def __init__(
        self,
        message: str,
        component: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        config_details = details or {}
        if component:
            config_details["component"] = component
            
        super().__init__(
            message=message,
            error_code="CONFIGURATION_ERROR",
            status_code=500,
            details=config_details,
            user_message="A configuration issue is preventing this operation"
        )


class ServiceUnavailableException(BusinessLogicException):
    """Exception for external service availability issues"""
    
    def __init__(
        self,
        service_name: str,
        message: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        service_details = details or {}
        service_details["service_name"] = service_name
        
        error_message = message or f"{service_name} service is currently unavailable"
        
        super().__init__(
            message=error_message,
            error_code="SERVICE_UNAVAILABLE",
            status_code=503,
            details=service_details,
            user_message=f"The {service_name} service is temporarily unavailable. Please try again later."
        )
