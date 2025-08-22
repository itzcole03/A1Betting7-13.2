"""
Unified Logging System

Provides consistent logging patterns across the entire application.
Includes structured logging, context enrichment, and performance tracking.
"""

import json
import logging
import logging.handlers
import sys
import threading
import time
from dataclasses import asdict, dataclass
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional, Union


class LogLevel(Enum):
    """Log levels with numeric values"""

    DEBUG = logging.DEBUG
    INFO = logging.INFO
    WARNING = logging.WARNING
    ERROR = logging.ERROR
    CRITICAL = logging.CRITICAL


class LogComponent(Enum):
    """Application components for better log organization"""

    API = "api"
    DATABASE = "database"
    CACHE = "cache"
    ML_MODEL = "ml_model"
    EXTERNAL_API = "external_api"
    AUTHENTICATION = "authentication"
    BUSINESS_LOGIC = "business_logic"
    SYSTEM = "system"
    PERFORMANCE = "performance"
    SECURITY = "security"
    USER_ACTION = "user_action"


@dataclass
class LogContext:
    """Context information for logs"""

    user_id: Optional[str] = None
    session_id: Optional[str] = None
    request_id: Optional[str] = None
    component: Optional[LogComponent] = None
    operation: Optional[str] = None
    duration_ms: Optional[float] = None
    additional_data: Optional[Dict[str, Any]] = None


class StructuredFormatter(logging.Formatter):
    """Custom formatter for structured JSON logging"""

    def format(self, record: logging.LogRecord) -> str:
        # Base log structure
        log_entry = {
            "timestamp": datetime.fromtimestamp(record.created).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        # Add context if available
        if hasattr(record, "context") and record.context:
            context_dict = (
                asdict(record.context)
                if hasattr(record.context, "__dict__")
                else record.context
            )
            log_entry["context"] = context_dict

        # Add exception info if present
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_entry, default=str)


class PerformanceTracker:
    """Track performance metrics in logs"""

    def __init__(self):
        self._start_times: Dict[str, float] = {}
        self._operation_stats: Dict[str, List[float]] = {}
        self._lock = threading.Lock()

    def start_operation(self, operation_id: str) -> str:
        """Start tracking an operation"""
        with self._lock:
            self._start_times[operation_id] = time.time()
        return operation_id

    def end_operation(self, operation_id: str) -> float:
        """End tracking and return duration"""
        with self._lock:
            if operation_id in self._start_times:
                duration = (time.time() - self._start_times[operation_id]) * 1000  # ms
                del self._start_times[operation_id]

                # Track stats
                operation_name = (
                    operation_id.split(":")[0] if ":" in operation_id else operation_id
                )
                if operation_name not in self._operation_stats:
                    self._operation_stats[operation_name] = []
                self._operation_stats[operation_name].append(duration)

                # Keep only last 1000 measurements
                if len(self._operation_stats[operation_name]) > 1000:
                    self._operation_stats[operation_name] = self._operation_stats[
                        operation_name
                    ][-1000:]

                return duration
            return 0.0

    def get_stats(self, operation_name: str) -> Dict[str, float]:
        """Get performance statistics for an operation"""
        with self._lock:
            if operation_name in self._operation_stats:
                durations = self._operation_stats[operation_name]
                return {
                    "count": len(durations),
                    "avg_ms": sum(durations) / len(durations),
                    "min_ms": min(durations),
                    "max_ms": max(durations),
                    "last_ms": durations[-1] if durations else 0,
                }
            return {}


class UnifiedLogger:
    """
    Centralized logging system with:
    - Structured JSON logging
    - Context enrichment
    - Performance tracking
    - Multiple output formats
    - Log rotation
    - Component-based organization
    """

    def __init__(self, name: str = "unified_logger"):
        self.name = name
        self.logger = logging.getLogger(name)
        self.performance_tracker = PerformanceTracker()
        self._setup_logger()

    def _setup_logger(self):
        """Setup logger with handlers and formatters"""
        self.logger.setLevel(logging.DEBUG)

        # Clear existing handlers
        self.logger.handlers.clear()

        # Console handler with human-readable format
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(logging.INFO)
        console_formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        )
        console_handler.setFormatter(console_formatter)
        self.logger.addHandler(console_handler)

        # File handler with JSON format
        log_dir = Path("backend/logs")
        log_dir.mkdir(exist_ok=True)

        file_handler = logging.handlers.RotatingFileHandler(
            log_dir / "unified.jsonl", maxBytes=50 * 1024 * 1024, backupCount=10  # 50MB
        )
        file_handler.setLevel(logging.DEBUG)
        file_handler.setFormatter(StructuredFormatter())
        self.logger.addHandler(file_handler)

        # Error file handler
        error_handler = logging.handlers.RotatingFileHandler(
            log_dir / "errors.jsonl", maxBytes=10 * 1024 * 1024, backupCount=5  # 10MB
        )
        error_handler.setLevel(logging.ERROR)
        error_handler.setFormatter(StructuredFormatter())
        self.logger.addHandler(error_handler)

    def _create_log_record(
        self,
        level: LogLevel,
        message: str,
        context: Optional[LogContext] = None,
        **kwargs,
    ) -> logging.LogRecord:
        """Create a log record with context"""
        record = self.logger.makeRecord(
            self.logger.name,
            level.value,
            "",
            0,
            message,
            (),
            None,
            func="",
            extra=kwargs,
        )

        if context:
            record.context = context

        return record

    def debug(self, message: str, context: Optional[LogContext] = None, **kwargs):
        """Log debug message"""
        record = self._create_log_record(LogLevel.DEBUG, message, context, **kwargs)
        self.logger.handle(record)

    def info(self, message: str, context: Optional[LogContext] = None, **kwargs):
        """Log info message"""
        record = self._create_log_record(LogLevel.INFO, message, context, **kwargs)
        self.logger.handle(record)

    def warning(self, message: str, context: Optional[LogContext] = None, **kwargs):
        """Log warning message"""
        record = self._create_log_record(LogLevel.WARNING, message, context, **kwargs)
        self.logger.handle(record)

    def error(
        self,
        message: str,
        context: Optional[LogContext] = None,
        exc_info: bool = False,
        **kwargs,
    ):
        """Log error message"""
        record = self._create_log_record(LogLevel.ERROR, message, context, **kwargs)
        if exc_info:
            record.exc_info = sys.exc_info()
        self.logger.handle(record)

    def critical(
        self,
        message: str,
        context: Optional[LogContext] = None,
        exc_info: bool = False,
        **kwargs,
    ):
        """Log critical message"""
        record = self._create_log_record(LogLevel.CRITICAL, message, context, **kwargs)
        if exc_info:
            record.exc_info = sys.exc_info()
        self.logger.handle(record)

    def log_performance(
        self,
        operation: str,
        duration_ms: float,
        context: Optional[LogContext] = None,
        **kwargs,
    ):
        """Log performance metric"""
        perf_context = context or LogContext()
        perf_context.component = LogComponent.PERFORMANCE
        perf_context.operation = operation
        perf_context.duration_ms = duration_ms

        message = f"Performance: {operation} completed in {duration_ms:.2f}ms"
        self.info(message, perf_context, **kwargs)

    def log_user_action(
        self, action: str, user_id: str, context: Optional[LogContext] = None, **kwargs
    ):
        """Log user action"""
        user_context = context or LogContext()
        user_context.component = LogComponent.USER_ACTION
        user_context.user_id = user_id
        user_context.operation = action

        message = f"User action: {action} by user {user_id}"
        self.info(message, user_context, **kwargs)

    def log_api_call(
        self,
        method: str,
        endpoint: str,
        status_code: int,
        duration_ms: float,
        context: Optional[LogContext] = None,
        **kwargs,
    ):
        """Log API call"""
        api_context = context or LogContext()
        api_context.component = LogComponent.API
        api_context.operation = f"{method} {endpoint}"
        api_context.duration_ms = duration_ms

        level = LogLevel.ERROR if status_code >= 400 else LogLevel.INFO
        message = f"API: {method} {endpoint} -> {status_code} ({duration_ms:.2f}ms)"

        if level == LogLevel.ERROR:
            self.error(message, api_context, **kwargs)
        else:
            self.info(message, api_context, **kwargs)

    def log_database_operation(
        self,
        operation: str,
        table: str,
        duration_ms: float,
        rows_affected: Optional[int] = None,
        context: Optional[LogContext] = None,
        **kwargs,
    ):
        """Log database operation"""
        db_context = context or LogContext()
        db_context.component = LogComponent.DATABASE
        db_context.operation = f"{operation} {table}"
        db_context.duration_ms = duration_ms

        message = f"Database: {operation} on {table} ({duration_ms:.2f}ms)"
        if rows_affected is not None:
            message += f" - {rows_affected} rows affected"

        self.info(message, db_context, **kwargs)

    def start_operation_tracking(
        self, operation: str, context: Optional[LogContext] = None
    ) -> str:
        """Start tracking an operation"""
        operation_id = f"{operation}:{int(time.time() * 1000)}"
        self.performance_tracker.start_operation(operation_id)

        track_context = context or LogContext()
        track_context.operation = operation

        self.debug(f"Started operation: {operation}", track_context)
        return operation_id

    def end_operation_tracking(
        self,
        operation_id: str,
        context: Optional[LogContext] = None,
        success: bool = True,
        **kwargs,
    ):
        """End operation tracking and log performance"""
        duration = self.performance_tracker.end_operation(operation_id)
        operation = operation_id.split(":")[0]

        track_context = context or LogContext()
        track_context.operation = operation
        track_context.duration_ms = duration

        status = "completed" if success else "failed"
        message = f"Operation {operation} {status} in {duration:.2f}ms"

        if success:
            self.info(message, track_context, **kwargs)
        else:
            self.error(message, track_context, **kwargs)

    def get_performance_stats(self, operation: str) -> Dict[str, float]:
        """Get performance statistics"""
        return self.performance_tracker.get_stats(operation)


# Operation tracking context manager
class OperationTracker:
    """Context manager for operation tracking"""

    def __init__(
        self,
        logger: UnifiedLogger,
        operation: str,
        context: Optional[LogContext] = None,
    ):
        self.logger = logger
        self.operation = operation
        self.context = context
        self.operation_id = None
        self.start_time = None

    def __enter__(self):
        self.start_time = time.time()
        self.operation_id = self.logger.start_operation_tracking(
            self.operation, self.context
        )
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        success = exc_type is None
        self.logger.end_operation_tracking(
            self.operation_id, self.context, success=success
        )


# Global instance
unified_logger = UnifiedLogger("a1betting")
# Backwards compatibility: provide unified_logging alias
unified_logging = unified_logger


# Backwards compatibility: allow unified_logging.get_logger(name)
def _unified_logging_get_logger(name: str = "a1betting"):
    return get_logger(name)

# Attach as attribute to the module-level unified_logging object
setattr(unified_logging, "get_logger", _unified_logging_get_logger)


# Convenience functions for backwards compatibility
def get_logger(name: str = "a1betting") -> UnifiedLogger:
    """Get logger instance"""
    return UnifiedLogger(name)


def log_performance(operation: str, duration_ms: float, **kwargs):
    """Log performance using global logger"""
    unified_logger.log_performance(operation, duration_ms, **kwargs)


def log_user_action(action: str, user_id: str, **kwargs):
    """Log user action using global logger"""
    unified_logger.log_user_action(action, user_id, **kwargs)


def track_operation(operation: str, context: Optional[LogContext] = None):
    """Create operation tracker"""
    return OperationTracker(unified_logger, operation, context)


# Export interfaces
__all__ = [
    "UnifiedLogger",
    "LogLevel",
    "LogComponent",
    "LogContext",
    "OperationTracker",
    "unified_logger",
    "get_logger",
    "log_performance",
    "log_user_action",
    "track_operation",
]
