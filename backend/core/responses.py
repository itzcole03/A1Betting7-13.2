"""
Standardized response helpers for A1Betting API.
Extracted from core/app.py to follow Single Responsibility Principle.
"""

from typing import Optional, Any, Dict
from datetime import datetime, timezone


def ok(data: Any = None, message: Optional[str] = None) -> Dict[str, Any]:
    """
    Create a standardized success response.
    
    Args:
        data: The response data payload
        message: Optional success message
        
    Returns:
        Standardized success response dictionary
    """
    try:
        from backend.utils.standard_responses import ResponseBuilder
        builder = ResponseBuilder()
        return builder.success(data)
    except Exception:
        # Fallback to minimal shape if ResponseBuilder is unavailable
        response = {
            "success": True,
            "data": data,
            "error": None,
            "meta": {
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        }
        if message:
            response["message"] = message
        return response


def fail(
    error_code: str = "ERROR",
    message: str = "An error occurred",
    data: Any = None,
    details: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Create a standardized error response.
    
    Args:
        error_code: Error code identifier
        message: Human-readable error message
        data: Optional data payload
        details: Optional error details
        
    Returns:
        Standardized error response dictionary
    """
    try:
        from backend.utils.standard_responses import ResponseBuilder
        builder = ResponseBuilder()
        return builder.error(error_code, message, details=details)
    except Exception:
        # Fallback to minimal shape if ResponseBuilder is unavailable
        return {
            "success": False,
            "data": data,
            "error": {
                "code": error_code,
                "message": message,
                "details": details
            },
            "meta": {
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        }
