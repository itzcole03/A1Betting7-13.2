"""
Enhanced Logging Configuration for A1Betting Backend

Implements structured JSON logging with rotation, different log levels,
and integration with monitoring systems.
"""

import json
import logging
import logging.handlers
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional

from backend.config_manager import config


class JSONFormatter(logging.Formatter):
    """Custom JSON formatter for structured logging"""

    def __init__(self, service_name: str = "a1betting-backend"):
        super().__init__()
        self.service_name = service_name

    def format(self, record: logging.LogRecord) -> str:
        """Format log record as JSON"""
        try:
            # Base log entry
            log_entry: Dict[str, Any] = {
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "level": record.levelname,
                "logger": record.name,
                "message": record.getMessage(),
                "service": self.service_name,
                "thread": record.thread,
                "thread_name": record.threadName,
            }

            # Add exception info if present
            if record.exc_info:
                log_entry["exception"] = {
                    "type": record.exc_info[0].__name__ if record.exc_info[0] else None,
                    "message": str(record.exc_info[1]) if record.exc_info[1] else None,
                    "traceback": self.formatException(record.exc_info),
                }

            # Add extra fields from log record
            extra_fields = {}
            for key, value in record.__dict__.items():
                if key not in [
                    "name",
                    "msg",
                    "args",
                    "levelname",
                    "levelno",
                    "pathname",
                    "filename",
                    "module",
                    "exc_info",
                    "exc_text",
                    "stack_info",
                    "lineno",
                    "funcName",
                    "created",
                    "msecs",
                    "relativeCreated",
                    "thread",
                    "threadName",
                    "processName",
                    "process",
                    "message",
                ]:
                    extra_fields[key] = value

            if extra_fields:
                log_entry["extra"] = extra_fields

            # Add request context if available
            if hasattr(record, "request_id"):
                log_entry["request_id"] = record.request_id
            if hasattr(record, "user_id"):
                log_entry["user_id"] = record.user_id
            if hasattr(record, "endpoint"):
                log_entry["endpoint"] = record.endpoint

            return json.dumps(log_entry, default=str, ensure_ascii=False)

        except Exception as e:
            # Fallback to simple format if JSON serialization fails
            return f'{{"timestamp": "{datetime.utcnow().isoformat()}Z", "level": "ERROR", "message": "Log formatting error: {str(e)}", "original_message": "{record.getMessage()}"}}'


class EnhancedLogger:
    """Enhanced logging setup with rotation and structured logging"""

    def __init__(self):
        self.log_level = config.get("A1BETTING_LOG_LEVEL", "INFO").upper()
        self.log_format = config.get("A1BETTING_LOG_FORMAT", "json").lower()
        self.log_file_path = config.get("A1BETTING_LOG_FILE_PATH", "logs/a1betting.log")
        self.log_rotation_size = config.get("A1BETTING_LOG_ROTATION_SIZE", "100MB")
        self.log_retention_days = int(config.get("A1BETTING_LOG_RETENTION_DAYS", "30"))
        self.enable_console_logging = (
            config.get("A1BETTING_ENABLE_CONSOLE_LOGGING", "true").lower() == "true"
        )

        # Create logs directory if it doesn't exist
        log_dir = Path(self.log_file_path).parent
        log_dir.mkdir(parents=True, exist_ok=True)

        self._setup_logging()

    def _setup_logging(self):
        """Setup logging configuration"""
        # Clear any existing handlers
        root_logger = logging.getLogger()
        root_logger.handlers.clear()

        # Set log level
        log_level = getattr(logging, self.log_level, logging.INFO)
        root_logger.setLevel(log_level)

        # Setup formatters
        if self.log_format == "json":
            formatter = JSONFormatter()
        else:
            formatter = logging.Formatter(
                fmt="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
                datefmt="%Y-%m-%d %H:%M:%S",
            )

        # File handler with rotation
        try:
            testing = bool(os.environ.get("TESTING") or os.environ.get("PYTEST_CURRENT_TEST"))
            if testing:
                file_handler = logging.FileHandler(filename=self.log_file_path, encoding="utf-8")
            else:
                file_handler = logging.handlers.RotatingFileHandler(
                    filename=self.log_file_path,
                    maxBytes=self._parse_size(self.log_rotation_size),
                    backupCount=self.log_retention_days,
                    encoding="utf-8",
                )
            file_handler.setLevel(log_level)
            file_handler.setFormatter(formatter)
            root_logger.addHandler(file_handler)
        except Exception as e:
            print(f"Warning: Could not setup file logging: {e}")

        # Console handler
        if self.enable_console_logging:
            console_handler = logging.StreamHandler(sys.stdout)
            console_handler.setLevel(log_level)

            # Use simpler format for console in development
            if config.get("A1BETTING_ENVIRONMENT", "development") == "development":
                console_formatter = logging.Formatter(
                    fmt="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
                    datefmt="%H:%M:%S",
                )
                # Handle Unicode encoding errors on Windows
                try:
                    console_handler.stream.reconfigure(encoding='utf-8', errors='replace')
                except AttributeError:
                    # Fallback for streams that don't support reconfigure
                    pass
            else:
                console_formatter = formatter

            console_handler.setFormatter(console_formatter)
            root_logger.addHandler(console_handler)

        # Setup specific logger configurations
        self._setup_specific_loggers()

    def _setup_specific_loggers(self):
        """Setup specific logger configurations"""
        # Reduce noise from external libraries
        logging.getLogger("httpx").setLevel(logging.WARNING)
        logging.getLogger("urllib3").setLevel(logging.WARNING)
        logging.getLogger("requests").setLevel(logging.WARNING)
        logging.getLogger("asyncio").setLevel(logging.WARNING)

        # SQLAlchemy logging
        if self.log_level == "DEBUG":
            logging.getLogger("sqlalchemy.engine").setLevel(logging.INFO)
        else:
            logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)

        # Redis logging
        logging.getLogger("redis").setLevel(logging.WARNING)

        # FastAPI/Uvicorn logging
        logging.getLogger("uvicorn.access").setLevel(logging.INFO)
        logging.getLogger("fastapi").setLevel(logging.INFO)

    def _parse_size(self, size_str: str) -> int:
        """Parse size string (e.g., '100MB') to bytes"""
        size_str = size_str.upper()
        if size_str.endswith("KB"):
            return int(size_str[:-2]) * 1024
        elif size_str.endswith("MB"):
            return int(size_str[:-2]) * 1024 * 1024
        elif size_str.endswith("GB"):
            return int(size_str[:-2]) * 1024 * 1024 * 1024
        else:
            return int(size_str)

    def get_logger(self, name: str) -> logging.Logger:
        """Get a logger with the specified name"""
        return logging.getLogger(name)


class ContextualLogger:
    """Logger with request context support"""

    def __init__(self, logger_name: str):
        self.logger = logging.getLogger(logger_name)
        self.context: Dict[str, Any] = {}

    def set_context(self, **kwargs):
        """Set context variables for all subsequent log messages"""
        self.context.update(kwargs)

    def clear_context(self):
        """Clear all context variables"""
        self.context.clear()

    def _log_with_context(self, level: int, message: str, *args, **kwargs):
        """Log message with context"""
        # Merge context with any extra kwargs
        extra = kwargs.get("extra", {})
        extra.update(self.context)
        kwargs["extra"] = extra

        self.logger.log(level, message, *args, **kwargs)

    def debug(self, message: str, *args, **kwargs):
        self._log_with_context(logging.DEBUG, message, *args, **kwargs)

    def info(self, message: str, *args, **kwargs):
        self._log_with_context(logging.INFO, message, *args, **kwargs)

    def warning(self, message: str, *args, **kwargs):
        self._log_with_context(logging.WARNING, message, *args, **kwargs)

    def error(self, message: str, *args, **kwargs):
        self._log_with_context(logging.ERROR, message, *args, **kwargs)

    def critical(self, message: str, *args, **kwargs):
        self._log_with_context(logging.CRITICAL, message, *args, **kwargs)

    def exception(self, message: str, *args, **kwargs):
        """Log exception with traceback"""
        kwargs["exc_info"] = True
        self._log_with_context(logging.ERROR, message, *args, **kwargs)


# Initialize enhanced logging
enhanced_logger = EnhancedLogger()

# Create application loggers
app_logger = ContextualLogger("a1betting.app")
auth_logger = ContextualLogger("a1betting.auth")
api_logger = ContextualLogger("a1betting.api")
ml_logger = ContextualLogger("a1betting.ml")
db_logger = ContextualLogger("a1betting.db")
security_logger = ContextualLogger("a1betting.security")


def get_logger(name: str) -> ContextualLogger:
    """Get a contextual logger with the specified name"""
    return ContextualLogger(f"a1betting.{name}")


# Request logging middleware setup
class RequestLoggingMiddleware:
    """Middleware to log HTTP requests and responses"""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            # Generate request ID
            import uuid

            request_id = str(uuid.uuid4())

            # Log request
            api_logger.set_context(request_id=request_id)
            api_logger.info(
                f"Request started: {scope['method']} {scope['path']}",
                extra={
                    "method": scope["method"],
                    "path": scope["path"],
                    "query_string": scope["query_string"].decode(),
                    "client_ip": scope.get("client", ["unknown"])[0],
                },
            )

            # Process request
            start_time = datetime.utcnow()

            async def send_wrapper(message):
                if message["type"] == "http.response.start":
                    status_code = message["status"]
                    duration = (datetime.utcnow() - start_time).total_seconds()

                    api_logger.info(
                        f"Request completed: {scope['method']} {scope['path']} - {status_code}",
                        extra={
                            "status_code": status_code,
                            "duration_seconds": duration,
                            "method": scope["method"],
                            "path": scope["path"],
                        },
                    )

                    # Clear context
                    api_logger.clear_context()

                await send(message)

            await self.app(scope, receive, send_wrapper)
        else:
            await self.app(scope, receive, send)


# Export for use in main app
__all__ = [
    "enhanced_logger",
    "JSONFormatter",
    "ContextualLogger",
    "RequestLoggingMiddleware",
    "get_logger",
    "app_logger",
    "auth_logger",
    "api_logger",
    "ml_logger",
    "db_logger",
    "security_logger",
]
