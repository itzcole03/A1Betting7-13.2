"""
Centralized Error Codes for A1Betting Backend

This module contains all standardized error codes used throughout the application.
All error codes should be defined here to avoid duplicates and ensure consistency.
"""

from __future__ import annotations

from enum import Enum


class APIErrorCode(Enum):
    """Standardized API error codes"""
    
    # Authentication & Authorization
    AUTHENTICATION_REQUIRED = "AUTHENTICATION_REQUIRED"
    INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS"
    NOT_AUTHORIZED = "NOT_AUTHORIZED"
    
    # Request Validation
    VALIDATION_ERROR = "VALIDATION_ERROR"
    INVALID_REQUEST = "INVALID_REQUEST"
    UNSUPPORTED_MEDIA_TYPE = "UNSUPPORTED_MEDIA_TYPE"
    
    # Resource Management
    RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND"
    
    # Configuration & Services
    CONFIGURATION_ERROR = "CONFIGURATION_ERROR"
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE"
    
    # Business Logic
    BUSINESS_LOGIC_ERROR = "BUSINESS_LOGIC_ERROR"
    OPERATION_FAILED = "OPERATION_FAILED"
    
    # ML/Prediction Specific
    PREDICTION_FAILED = "PREDICTION_FAILED"
    BATCH_PREDICTION_FAILED = "BATCH_PREDICTION_FAILED"
    INVALID_STRATEGY = "INVALID_STRATEGY"
    CONFIG_UPDATE_FAILED = "CONFIG_UPDATE_FAILED"
    PERFORMANCE_STATS_FAILED = "PERFORMANCE_STATS_FAILED"
    MODEL_INFO_FAILED = "MODEL_INFO_FAILED"
    RETRAINING_FAILED = "RETRAINING_FAILED"
    OPTIMIZED_PREDICTION_FAILED = "OPTIMIZED_PREDICTION_FAILED"
    
    # Cache Operations
    CACHE_CLEAR_FAILED = "CACHE_CLEAR_FAILED"
    
    # System Operations
    PHASE2_STARTUP_FAILED = "PHASE2_STARTUP_FAILED"
    PHASE2_SHUTDOWN_FAILED = "PHASE2_SHUTDOWN_FAILED"
    OPTIMIZATION_STATS_FAILED = "OPTIMIZATION_STATS_FAILED"
    
    # Admin Operations
    AUDIT_LOG_ERROR = "AUDIT_LOG_ERROR"
    RELOAD_FAILED = "RELOAD_FAILED"
    
    # Generic Errors
    INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR"


# Legacy error code constants for backward compatibility
# These should be migrated to use the enum above

# Authentication & Authorization
AUTHENTICATION_REQUIRED = APIErrorCode.AUTHENTICATION_REQUIRED.value
INSUFFICIENT_PERMISSIONS = APIErrorCode.INSUFFICIENT_PERMISSIONS.value
NOT_AUTHORIZED = APIErrorCode.NOT_AUTHORIZED.value

# Validation
VALIDATION_ERROR = APIErrorCode.VALIDATION_ERROR.value
INVALID_REQUEST = APIErrorCode.INVALID_REQUEST.value
UNSUPPORTED_MEDIA_TYPE = APIErrorCode.UNSUPPORTED_MEDIA_TYPE.value

# Resources
RESOURCE_NOT_FOUND = APIErrorCode.RESOURCE_NOT_FOUND.value

# Configuration
CONFIGURATION_ERROR = APIErrorCode.CONFIGURATION_ERROR.value
SERVICE_UNAVAILABLE = APIErrorCode.SERVICE_UNAVAILABLE.value

# Business Logic
BUSINESS_LOGIC_ERROR = APIErrorCode.BUSINESS_LOGIC_ERROR.value
OPERATION_FAILED = APIErrorCode.OPERATION_FAILED.value

# ML/Prediction
PREDICTION_FAILED = APIErrorCode.PREDICTION_FAILED.value
BATCH_PREDICTION_FAILED = APIErrorCode.BATCH_PREDICTION_FAILED.value
INVALID_STRATEGY = APIErrorCode.INVALID_STRATEGY.value
CONFIG_UPDATE_FAILED = APIErrorCode.CONFIG_UPDATE_FAILED.value
PERFORMANCE_STATS_FAILED = APIErrorCode.PERFORMANCE_STATS_FAILED.value
MODEL_INFO_FAILED = APIErrorCode.MODEL_INFO_FAILED.value
RETRAINING_FAILED = APIErrorCode.RETRAINING_FAILED.value
OPTIMIZED_PREDICTION_FAILED = APIErrorCode.OPTIMIZED_PREDICTION_FAILED.value

# Cache
CACHE_CLEAR_FAILED = APIErrorCode.CACHE_CLEAR_FAILED.value

# System
PHASE2_STARTUP_FAILED = APIErrorCode.PHASE2_STARTUP_FAILED.value
PHASE2_SHUTDOWN_FAILED = APIErrorCode.PHASE2_SHUTDOWN_FAILED.value
OPTIMIZATION_STATS_FAILED = APIErrorCode.OPTIMIZATION_STATS_FAILED.value

# Admin
AUDIT_LOG_ERROR = APIErrorCode.AUDIT_LOG_ERROR.value
RELOAD_FAILED = APIErrorCode.RELOAD_FAILED.value

# Generic
INTERNAL_SERVER_ERROR = APIErrorCode.INTERNAL_SERVER_ERROR.value


def validate_error_code_uniqueness() -> bool:
    """
    Validate that all error codes are unique.
    
    Returns:
        True if all error codes are unique, False otherwise
    """
    error_codes = [code.value for code in APIErrorCode]
    return len(error_codes) == len(set(error_codes))


def get_all_error_codes() -> list[str]:
    """
    Get all defined error codes.
    
    Returns:
        List of all error code strings
    """
    return [code.value for code in APIErrorCode]


def is_valid_error_code(code: str) -> bool:
    """
    Check if a given string is a valid error code.
    
    Args:
        code: Error code string to validate
        
    Returns:
        True if the code is valid, False otherwise
    """
    return code in get_all_error_codes()
