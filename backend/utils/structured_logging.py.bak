"""
Enhanced Structured Logging System for FastAPI
Following 2024-2025 logging best practices for production environments.
"""

import json
import logging
import logging.config
import sys
import os
from datetime import datetime
from typing import Any, Dict, Optional

from pythonjsonlogger import jsonlogger

# Import settings
from backend.config.settings import get_settings

class SafeStreamHandler(logging.StreamHandler):
    """StreamHandler that handles encoding errors gracefully"""

    def emit(self, record):
        try:
            super().emit(record)
        except UnicodeEncodeError:
            # Fallback: encode the message safely
            msg = self.format(record)
            try:
                # Try to encode with UTF-8 and replace errors
                safe_msg = msg.encode('utf-8', errors='replace').decode('utf-8')
                record.msg = safe_msg
                super().emit(record)
            except Exception:
                # Last resort: use ASCII-safe version
                import re
                safe_msg = re.sub(r'[^\x00-\x7F]+', '?', msg)
                record.msg = safe_msg
                super().emit(record)


class CorrelationIdFilter(logging.Filter):
    """Filter to add correlation ID to log records"""

    def filter(self, record):
        # Try to get correlation ID from context
        correlation_id = getattr(record, "correlation_id", None)
        if not correlation_id:
            # Try to get from request context if available
            try:
                from contextvars import ContextVar

                correlation_context: ContextVar = ContextVar("correlation_id")
                correlation_id = correlation_context.get(None)
            except (ImportError, LookupError):
                correlation_id = None

        record.correlation_id = correlation_id or "no-correlation-id"
        return True


class EnhancedJSONFormatter(jsonlogger.JsonFormatter):
    """Enhanced JSON formatter with additional fields"""

    def add_fields(self, log_record, record, message_dict):
        super().add_fields(log_record, record, message_dict)

        # Add timestamp in ISO format
        log_record["timestamp"] = datetime.utcnow().isoformat() + "Z"

        # Add application information
        settings = get_settings()
        log_record["app_name"] = settings.app.app_name
        log_record["app_version"] = settings.app.app_version
        log_record["environment"] = settings.environment.value

        # Add logger name and level
        log_record["logger"] = record.name
        log_record["level"] = record.levelname

        # Add file and line information
        log_record["file"] = record.filename
        log_record["line"] = record.lineno
        log_record["function"] = record.funcName

        # Add correlation ID if available
        correlation_id = getattr(record, "correlation_id", None)
        if correlation_id:
            log_record["correlation_id"] = correlation_id

        # Add exception information if present
        if record.exc_info:
            log_record["exception"] = self.formatException(record.exc_info)


class StructuredLogger:
    """Structured logger with correlation ID support"""

    def __init__(self, name: str):
        self.logger = logging.getLogger(name)
        self.settings = get_settings()

    def _log(
        self, level: int, message: str, extra: Optional[Dict[str, Any]] = None, **kwargs
    ):
        """Internal logging method with structured data"""
        if extra is None:
            extra = {}

        # Merge kwargs into extra, but handle reserved logging parameters separately
        reserved_params = {"exc_info", "stack_info", "stacklevel", "extra"}
        extra_kwargs = {k: v for k, v in kwargs.items() if k not in reserved_params}
        logging_kwargs = {k: v for k, v in kwargs.items() if k in reserved_params}

        extra.update(extra_kwargs)

        # Add correlation ID if available
        correlation_id = extra.get("correlation_id")
        if correlation_id:
            extra["correlation_id"] = correlation_id

        self.logger.log(level, message, extra=extra, **logging_kwargs)

    def debug(self, message: str, **kwargs):
        """Log debug message"""
        self._log(logging.DEBUG, message, **kwargs)

    def info(self, message: str, **kwargs):
        """Log info message"""
        self._log(logging.INFO, message, **kwargs)

    def warning(self, message: str, **kwargs):
        """Log warning message"""
        self._log(logging.WARNING, message, **kwargs)

    def error(self, message: str, **kwargs):
        """Log error message"""
        self._log(logging.ERROR, message, **kwargs)

    def critical(self, message: str, **kwargs):
        """Log critical message"""
        self._log(logging.CRITICAL, message, **kwargs)

    def exception(self, message: str, **kwargs):
        """Log exception with traceback"""
        kwargs["exc_info"] = True
        self._log(logging.ERROR, message, **kwargs)


def setup_logging():
    """Configure logging based on settings"""
    settings = get_settings()

    # Detect test runtime (pytest or explicit TESTING env var).
    testing = bool(os.environ.get("TESTING") or os.environ.get("PYTEST_CURRENT_TEST"))

    # Determine log level
    log_level = getattr(logging, settings.monitoring.log_level.value)

    if settings.monitoring.log_format == "json":
        # JSON logging configuration for production
        logging_config = {
            "version": 1,
            "disable_existing_loggers": False,
            "formatters": {
                "json": {
                    "()": EnhancedJSONFormatter,
                    "format": "%(asctime)s %(name)s %(levelname)s %(message)s",
                },
                "simple": {
                    "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
                },
            },
            "filters": {
                "correlation_id": {
                    "()": CorrelationIdFilter,
                }
            },
            "handlers": {
                "console": {
                    "level": log_level,
                    "class": "logging.StreamHandler",
                    "formatter": "json",
                    "filters": ["correlation_id"],
                    "stream": sys.stdout,
                },
                "file": {
                    "level": log_level,
                    "class": "logging.FileHandler" if testing else "logging.handlers.RotatingFileHandler",
                    "formatter": "json",
                    "filters": ["correlation_id"],
                    "filename": "logs/app.log",
                },
                "error_file": {
                    "level": "ERROR",
                    "class": "logging.FileHandler" if testing else "logging.handlers.RotatingFileHandler",
                    "formatter": "json",
                    "filters": ["correlation_id"],
                    "filename": "logs/error.log",
                },
            },
            "loggers": {
                # Application loggers
                "app": {
                    "level": log_level,
                    "handlers": ["console", "file"],
                    "propagate": False,
                },
                "request": {
                    "level": log_level,
                    "handlers": ["console", "file"],
                    "propagate": False,
                },
                "security": {
                    "level": "INFO",
                    "handlers": ["console", "file", "error_file"],
                    "propagate": False,
                },
                "performance": {
                    "level": log_level,
                    "handlers": ["console", "file"],
                    "propagate": False,
                },
                "database": {
                    "level": log_level,
                    "handlers": ["console", "file"],
                    "propagate": False,
                },
                # Third-party loggers
                "uvicorn": {
                    "level": "INFO",
                    "handlers": ["console", "file"],
                    "propagate": False,
                },
                "sqlalchemy": {
                    "level": (
                        "WARNING"
                        if not settings.monitoring.enable_sql_logging
                        else "INFO"
                    ),
                    "handlers": ["console", "file"],
                    "propagate": False,
                },
            },
            "root": {"level": log_level, "handlers": ["console", "file"]},
        }
    else:
        # Simple text logging for development
        logging_config = {
            "version": 1,
            "disable_existing_loggers": False,
            "formatters": {
                "simple": {
                    "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
                }
            },
            "handlers": {
                "console": {
                    "level": log_level,
                    "class": "logging.StreamHandler",
                    "formatter": "simple",
                    "stream": sys.stdout,
                }
            },
            "root": {"level": log_level, "handlers": ["console"]},
        }

    # Apply logging configuration
    logging.config.dictConfig(logging_config)

    # Create logs directory if using file handlers
    if settings.monitoring.log_format == "json":
        os.makedirs("logs", exist_ok=True)


def get_logger(name: str) -> StructuredLogger:
    """Get a structured logger instance"""
    return StructuredLogger(name)


# Performance monitoring logger
class PerformanceLogger:
    def info(self, message: str, **kwargs):
        """Log info message (generic)"""
        self.logger.info(message, **kwargs)

    """Specialized logger for performance metrics"""

    def __init__(self):
        self.logger = get_logger("performance")

    def log_request_metrics(
        self,
        method: str,
        path: str,
        status_code: int,
        response_time_ms: float,
        correlation_id: Optional[str] = None,
    ):
        """Log request performance metrics"""
        self.logger.info(
            "Request completed",
            event_type="request_metrics",
            method=method,
            path=path,
            status_code=status_code,
            response_time_ms=response_time_ms,
            correlation_id=correlation_id,
        )

    def log_database_query(
        self,
        query_type: str,
        table: str,
        execution_time_ms: float,
        correlation_id: Optional[str] = None,
    ):
        """Log database query performance"""
        self.logger.info(
            "Database query executed",
            event_type="database_metrics",
            query_type=query_type,
            table=table,
            execution_time_ms=execution_time_ms,
            correlation_id=correlation_id,
        )

    def log_cache_operation(
        self,
        operation: str,
        key: str,
        hit: bool,
        execution_time_ms: float,
        correlation_id: Optional[str] = None,
    ):
        """Log cache operation performance"""
        self.logger.info(
            "Cache operation",
            event_type="cache_metrics",
            operation=operation,
            key=key,
            cache_hit=hit,
            execution_time_ms=execution_time_ms,
            correlation_id=correlation_id,
        )


# Security monitoring logger
class SecurityLogger:
    """Specialized logger for security events"""

    def __init__(self):
        self.logger = get_logger("security")

    def log_authentication_attempt(
        self,
        username: str,
        success: bool,
        ip_address: str,
        correlation_id: Optional[str] = None,
    ):
        """Log authentication attempts"""
        self.logger.info(
            "Authentication attempt",
            event_type="auth_attempt",
            username=username,
            success=success,
            ip_address=ip_address,
            correlation_id=correlation_id,
        )

    def log_rate_limit_exceeded(
        self,
        ip_address: str,
        endpoint: str,
        limit: int,
        correlation_id: Optional[str] = None,
    ):
        """Log rate limit violations"""
        self.logger.warning(
            "Rate limit exceeded",
            event_type="rate_limit_exceeded",
            ip_address=ip_address,
            endpoint=endpoint,
            limit=limit,
            correlation_id=correlation_id,
        )

    def log_suspicious_activity(
        self,
        activity_type: str,
        details: Dict[str, Any],
        ip_address: str,
        correlation_id: Optional[str] = None,
    ):
        """Log suspicious activities"""
        self.logger.warning(
            "Suspicious activity detected",
            event_type="suspicious_activity",
            activity_type=activity_type,
            details=details,
            ip_address=ip_address,
            correlation_id=correlation_id,
        )


# Initialize logging on module import
setup_logging()

# Export logger instances
app_logger = get_logger("app")
performance_logger = PerformanceLogger()
security_logger = SecurityLogger()
