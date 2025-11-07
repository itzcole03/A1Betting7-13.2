"""
Centralized Error Handling Utility

This module provides consistent error handling patterns that preserve stack traces
and eliminate the anti-pattern of logging only error messages.
"""

import logging
import traceback
from functools import wraps
from typing import Any, Callable, Dict, Optional, Type

logger = logging.getLogger(__name__)


class ErrorHandler:
    """Centralized error handler that preserves stack traces and provides consistent logging."""
    
    @staticmethod
    def log_error(
        error: Exception,
        context: str,
        extra_data: Optional[Dict[str, Any]] = None,
        level: int = logging.ERROR
    ) -> None:
        """
        Log an error with full stack trace and context.
        
        Args:
            error: The exception that occurred
            context: Description of what was being attempted
            extra_data: Additional data to include in the log
            level: Logging level (default: ERROR)
        """
        # Get full stack trace
        stack_trace = traceback.format_exc()
        
        # Build log message with full error details
        log_data = {
            "context": context,
            "error_type": type(error).__name__,
            "error_message": str(error),
            "stack_trace": stack_trace,
        }
        
        if extra_data:
            log_data.update(extra_data)
        
        # Log with full error object to preserve stack trace
        logger.log(level, f"Error in {context}: {error}", exc_info=True, extra=log_data)
    
    @staticmethod
    def safe_execute(
        func: Callable[..., Any],
        context: str,
        default_return: Any = None,
        reraise: bool = True,
        extra_data: Optional[Dict[str, Any]] = None
    ) -> Any:
        """
        Safely execute a function with proper error handling.
        
        Args:
            func: Function to execute
            context: Description of what the function does
            default_return: Value to return if function fails
            reraise: Whether to re-raise the exception after logging
            extra_data: Additional data to include in error logs
            
        Returns:
            Function result or default_return if function fails
        """
        try:
            return func()
        except Exception as e:
            ErrorHandler.log_error(e, context, extra_data)
            if reraise:
                raise
            return default_return


def safe_execute(
    context: str,
    default_return: Any = None,
    reraise: bool = True,
    extra_data: Optional[Dict[str, Any]] = None
) -> Callable:
    """
    Decorator for safe execution with proper error handling.
    
    Args:
        context: Description of what the function does
        default_return: Value to return if function fails
        reraise: Whether to re-raise the exception after logging
        extra_data: Additional data to include in error logs
        
    Returns:
        Decorated function
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                ErrorHandler.log_error(e, context, extra_data)
                if reraise:
                    raise
                return default_return
        return wrapper
    return decorator


def safe_execute_async(
    context: str,
    default_return: Any = None,
    reraise: bool = True,
    extra_data: Optional[Dict[str, Any]] = None
) -> Callable:
    """
    Decorator for safe async execution with proper error handling.
    
    Args:
        context: Description of what the function does
        default_return: Value to return if function fails
        reraise: Whether to re-raise the exception after logging
        extra_data: Additional data to include in error logs
        
    Returns:
        Decorated async function
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            try:
                return await func(*args, **kwargs)
            except Exception as e:
                ErrorHandler.log_error(e, context, extra_data)
                if reraise:
                    raise
                return default_return
        return wrapper
    return decorator


# Specific exception types for better error handling
class A1BettingError(Exception):
    """Base exception for A1Betting application."""
    pass


class DataFetchError(A1BettingError):
    """Raised when data fetching fails."""
    pass


class ModelError(A1BettingError):
    """Raised when model operations fail."""
    pass


class ValidationError(A1BettingError):
    """Raised when data validation fails."""
    pass


class ConfigurationError(A1BettingError):
    """Raised when configuration is invalid."""
    pass


class AuthenticationError(A1BettingError):
    """Raised when authentication fails."""
    pass


class RateLimitError(A1BettingError):
    """Raised when rate limits are exceeded."""
    pass


class CacheError(A1BettingError):
    """Raised when cache operations fail."""
    pass


class DatabaseError(A1BettingError):
    """Raised when database operations fail."""
    pass


# Utility function to convert generic exceptions to specific ones
def convert_exception(
    error: Exception,
    target_type: Type[Exception],
    context: str
) -> Exception:
    """
    Convert a generic exception to a specific exception type.
    
    Args:
        error: The original exception
        target_type: The specific exception type to convert to
        context: Context for the conversion
        
    Returns:
        New exception of the target type
    """
    return target_type(f"{context}: {str(error)}")
