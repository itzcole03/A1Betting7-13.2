"""
Unified Error Handling System

Provides consistent error handling patterns across the entire application.
Replaces scattered error handling with a centralized, configurable system.
"""

import asyncio
import json
import logging
import traceback
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional, Union


class ErrorSeverity(Enum):
    """Error severity levels"""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ErrorCategory(Enum):
    """Error categories for better classification"""

    VALIDATION = "validation"
    AUTHENTICATION = "authentication"
    AUTHORIZATION = "authorization"
    DATABASE = "database"
    EXTERNAL_API = "external_api"
    BUSINESS_LOGIC = "business_logic"
    SYSTEM = "system"
    NETWORK = "network"
    CACHE = "cache"
    ML_MODEL = "ml_model"


@dataclass
class ErrorContext:
    """Context information for errors"""

    user_id: Optional[str] = None
    session_id: Optional[str] = None
    request_id: Optional[str] = None
    endpoint: Optional[str] = None
    method: Optional[str] = None
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None
    additional_data: Optional[Dict[str, Any]] = None


@dataclass
class ErrorInfo:
    """Comprehensive error information"""

    error_id: str
    message: str
    severity: ErrorSeverity
    category: ErrorCategory
    timestamp: datetime
    context: ErrorContext
    stack_trace: Optional[str]
    user_message: Optional[str]  # User-friendly message
    resolution_steps: Optional[List[str]]
    related_docs: Optional[List[str]]


class UnifiedErrorHandler:
    """
    Centralized error handling system with:
    - Consistent error formatting
    - Automatic severity detection
    - Context enrichment
    - User-friendly messages
    - Resolution suggestions
    - Monitoring integration
    """

    def __init__(self):
        self.logger = logging.getLogger("unified_error_handler")
        self.error_mappings = self._initialize_error_mappings()
        self.resolution_guides = self._initialize_resolution_guides()

        # Error tracking
        self.error_counts: Dict[str, int] = {}
        self.recent_errors: List[ErrorInfo] = []
        self.max_recent_errors = 1000

    def _initialize_error_mappings(self) -> Dict[type, Dict[str, Any]]:
        """Initialize error type mappings"""
        return {
            ConnectionError: {
                "category": ErrorCategory.NETWORK,
                "severity": ErrorSeverity.HIGH,
                "user_message": "Connection failed. Please check your internet connection.",
                "resolution": [
                    "Check internet connection",
                    "Verify server status",
                    "Try again in a few moments",
                ],
            },
            TimeoutError: {
                "category": ErrorCategory.NETWORK,
                "severity": ErrorSeverity.MEDIUM,
                "user_message": "Request timed out. The server may be busy.",
                "resolution": [
                    "Try again",
                    "Check server status",
                    "Contact support if problem persists",
                ],
            },
            ValueError: {
                "category": ErrorCategory.VALIDATION,
                "severity": ErrorSeverity.LOW,
                "user_message": "Invalid data provided.",
                "resolution": [
                    "Check input data",
                    "Verify data format",
                    "Review API documentation",
                ],
            },
            KeyError: {
                "category": ErrorCategory.VALIDATION,
                "severity": ErrorSeverity.MEDIUM,
                "user_message": "Missing required information.",
                "resolution": [
                    "Check required fields",
                    "Verify data structure",
                    "Review API documentation",
                ],
            },
            PermissionError: {
                "category": ErrorCategory.AUTHORIZATION,
                "severity": ErrorSeverity.HIGH,
                "user_message": "Access denied. You don't have permission to perform this action.",
                "resolution": [
                    "Check permissions",
                    "Contact administrator",
                    "Verify user role",
                ],
            },
            ImportError: {
                "category": ErrorCategory.SYSTEM,
                "severity": ErrorSeverity.MEDIUM,
                "user_message": "System component unavailable.",
                "resolution": [
                    "Check system configuration",
                    "Verify dependencies",
                    "Contact administrator",
                ],
            },
        }

    def _initialize_resolution_guides(self) -> Dict[ErrorCategory, List[str]]:
        """Initialize resolution guides by category"""
        return {
            ErrorCategory.DATABASE: [
                "Check database connection",
                "Verify database credentials",
                "Check database server status",
                "Review query syntax",
                "Check database locks",
            ],
            ErrorCategory.EXTERNAL_API: [
                "Check API endpoint URL",
                "Verify API credentials",
                "Check API rate limits",
                "Review API documentation",
                "Check network connectivity",
            ],
            ErrorCategory.ML_MODEL: [
                "Check model availability",
                "Verify input data format",
                "Check model dependencies",
                "Review model configuration",
                "Check model version compatibility",
            ],
            ErrorCategory.CACHE: [
                "Check cache service status",
                "Verify cache configuration",
                "Check cache memory usage",
                "Clear cache if corrupted",
                "Check cache connectivity",
            ],
            ErrorCategory.AUTHENTICATION: [
                "Check credentials",
                "Verify token validity",
                "Check authentication service",
                "Review authentication configuration",
                "Check session status",
            ],
            ErrorCategory.BUSINESS_LOGIC: [
                "Review business rule configuration",
                "Check data constraints",
                "Verify workflow state",
                "Review validation rules",
                "Check business logic implementation",
            ],
        }

    def handle_error(
        self,
        error: Exception,
        context: Optional[ErrorContext] = None,
        custom_message: Optional[str] = None,
        custom_severity: Optional[ErrorSeverity] = None,
        custom_category: Optional[ErrorCategory] = None,
    ) -> ErrorInfo:
        """
        Handle an error with full context and return structured error information
        """
        # Generate unique error ID
        error_id = self._generate_error_id(error, context)

        # Determine error characteristics
        error_type = type(error)
        mapping = self.error_mappings.get(error_type, {})

        severity = custom_severity or mapping.get("severity", ErrorSeverity.MEDIUM)
        category = custom_category or mapping.get("category", ErrorCategory.SYSTEM)

        # Create user-friendly message
        user_message = custom_message or mapping.get("user_message", str(error))

        # Get resolution steps
        resolution_steps = mapping.get(
            "resolution", self.resolution_guides.get(category, [])
        )

        # Create error info
        error_info = ErrorInfo(
            error_id=error_id,
            message=str(error),
            severity=severity,
            category=category,
            timestamp=datetime.now(),
            context=context or ErrorContext(),
            stack_trace=traceback.format_exc(),
            user_message=user_message,
            resolution_steps=resolution_steps,
            related_docs=self._get_related_docs(category),
        )

        # Track error
        self._track_error(error_info)

        # Log error
        self._log_error(error_info)

        return error_info

    def _generate_error_id(
        self, error: Exception, context: Optional[ErrorContext]
    ) -> str:
        """Generate unique error ID"""
        import hashlib

        error_str = f"{type(error).__name__}:{str(error)}"
        if context and context.request_id:
            error_str += f":{context.request_id}"

        return hashlib.md5(error_str.encode()).hexdigest()[:12]

    def _track_error(self, error_info: ErrorInfo):
        """Track error for monitoring and analysis"""
        error_key = f"{error_info.category.value}:{type(error_info.message).__name__}"
        self.error_counts[error_key] = self.error_counts.get(error_key, 0) + 1

        # Keep recent errors
        self.recent_errors.append(error_info)
        if len(self.recent_errors) > self.max_recent_errors:
            self.recent_errors.pop(0)

    def _log_error(self, error_info: ErrorInfo):
        """Log error with appropriate level"""
        log_data = {
            "error_id": error_info.error_id,
            "severity": error_info.severity.value,
            "category": error_info.category.value,
            "message": error_info.message,
            "context": error_info.context.__dict__ if error_info.context else None,
        }

        if error_info.severity == ErrorSeverity.CRITICAL:
            self.logger.critical("Critical error: %s", json.dumps(log_data))
        elif error_info.severity == ErrorSeverity.HIGH:
            self.logger.error("High severity error: %s", json.dumps(log_data))
        elif error_info.severity == ErrorSeverity.MEDIUM:
            self.logger.warning("Medium severity error: %s", json.dumps(log_data))
        else:
            self.logger.info("Low severity error: %s", json.dumps(log_data))

    def _get_related_docs(self, category: ErrorCategory) -> List[str]:
        """Get related documentation URLs"""
        doc_mappings = {
            ErrorCategory.DATABASE: [
                "/docs/database-troubleshooting",
                "/docs/database-optimization",
            ],
            ErrorCategory.EXTERNAL_API: [
                "/docs/api-integration",
                "/docs/api-troubleshooting",
            ],
            ErrorCategory.ML_MODEL: ["/docs/ml-models", "/docs/ml-troubleshooting"],
            ErrorCategory.AUTHENTICATION: ["/docs/authentication", "/docs/security"],
            ErrorCategory.BUSINESS_LOGIC: ["/docs/business-rules", "/docs/validation"],
        }
        return doc_mappings.get(category, [])

    def get_error_stats(self) -> Dict[str, Any]:
        """Get error statistics"""
        return {
            "total_errors": sum(self.error_counts.values()),
            "error_counts_by_type": dict(self.error_counts),
            "recent_errors_count": len(self.recent_errors),
            "top_errors": sorted(
                self.error_counts.items(), key=lambda x: x[1], reverse=True
            )[:10],
        }

    async def handle_async_error(
        self,
        error: Exception,
        context: Optional[ErrorContext] = None,
        custom_message: Optional[str] = None,
        custom_severity: Optional[ErrorSeverity] = None,
        custom_category: Optional[ErrorCategory] = None,
    ) -> ErrorInfo:
        """Async version of error handling"""
        return await asyncio.get_event_loop().run_in_executor(
            None,
            self.handle_error,
            error,
            context,
            custom_message,
            custom_severity,
            custom_category,
        )


# Global instance
unified_error_handler = UnifiedErrorHandler()


# Convenience functions for backwards compatibility
def handle_error(
    error: Exception,
    context: Optional[ErrorContext] = None,
    message: Optional[str] = None,
) -> ErrorInfo:
    """Handle error using global handler"""
    return unified_error_handler.handle_error(error, context, message)


async def handle_async_error(
    error: Exception,
    context: Optional[ErrorContext] = None,
    message: Optional[str] = None,
) -> ErrorInfo:
    """Handle async error using global handler"""
    return await unified_error_handler.handle_async_error(error, context, message)


# Error decorators
def error_handler(
    category: Optional[ErrorCategory] = None,
    severity: Optional[ErrorSeverity] = None,
    message: Optional[str] = None,
):
    """Decorator for automatic error handling"""

    def decorator(func):
        def wrapper(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                error_info = unified_error_handler.handle_error(
                    e,
                    custom_category=category,
                    custom_severity=severity,
                    custom_message=message,
                )
                raise e  # Re-raise after handling

        return wrapper

    return decorator


def async_error_handler(
    category: Optional[ErrorCategory] = None,
    severity: Optional[ErrorSeverity] = None,
    message: Optional[str] = None,
):
    """Async decorator for automatic error handling"""

    def decorator(func):
        async def wrapper(*args, **kwargs):
            try:
                return await func(*args, **kwargs)
            except Exception as e:
                error_info = await unified_error_handler.handle_async_error(
                    e,
                    custom_category=category,
                    custom_severity=severity,
                    custom_message=message,
                )
                raise e  # Re-raise after handling

        return wrapper

    return decorator


# Export all the interfaces
__all__ = [
    "UnifiedErrorHandler",
    "ErrorSeverity",
    "ErrorCategory",
    "ErrorContext",
    "ErrorInfo",
    "unified_error_handler",
    "handle_error",
    "handle_async_error",
    "error_handler",
    "async_error_handler",
]
