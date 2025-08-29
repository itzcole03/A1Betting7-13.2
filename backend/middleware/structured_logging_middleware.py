"""
Structured Logging Middleware with Request ID Tracking

Provides comprehensive logging with:
- Unique request IDs for tracing
- Structured JSON logging format
- Performance timing
- Automatic context enrichment
- Error tracking with request correlation
"""

import json
import logging
import logging.handlers
import os
import time
import uuid
from contextvars import ContextVar
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional, Any
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

# Context variable for request ID
request_id_ctx: ContextVar[Optional[str]] = ContextVar("request_id", default=None)


class StructuredLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware that adds structured logging with request tracking
    """

    def __init__(self, app, logger_name: str = "a1betting"):
        super().__init__(app)
        self.logger = logging.getLogger(logger_name)
        self.setup_structured_logging()

    def setup_structured_logging(self):
        """Configure structured JSON logging"""
        # Remove existing handlers to avoid duplicates
        self.logger.handlers.clear()
        
        # Create structured formatter
        formatter = StructuredFormatter()
        
        # Console handler with JSON formatting
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(formatter)
        console_handler.setLevel(logging.INFO)
        
        # File handler for persistent logging
        try:
            log_dir = Path(__file__).parent.parent / "logs"
            log_dir.mkdir(exist_ok=True)
            # Use plain FileHandler during tests to avoid Windows rename/lock issues
            testing = bool(os.environ.get("TESTING") or os.environ.get("PYTEST_CURRENT_TEST"))
            if testing:
                file_handler = logging.FileHandler(log_dir / "structured.log")
            else:
                file_handler = logging.handlers.RotatingFileHandler(
                    log_dir / "structured.log",
                    maxBytes=10 * 1024 * 1024,  # 10MB
                    backupCount=5,
                )
            file_handler.setFormatter(formatter)
            file_handler.setLevel(logging.DEBUG)
            self.logger.addHandler(file_handler)
        except Exception as e:
            self.logger.warning(f"Could not set up file logging: {e}")
        
        self.logger.addHandler(console_handler)
        self.logger.setLevel(logging.DEBUG)
        self.logger.propagate = False

    async def dispatch(self, request: Request, call_next) -> Response:
        """Process request with structured logging"""
        # Generate unique request ID
        req_id = str(uuid.uuid4())
        request_id_ctx.set(req_id)
        
        # Add request ID to request state for easy access
        request.state.request_id = req_id
        
        start_time = time.time()
        
        # Log incoming request
        self.log_request_start(request, req_id)
        
        try:
            response = await call_next(request)
            
            # Calculate response time
            duration_ms = (time.time() - start_time) * 1000
            
            # Log successful response
            self.log_request_success(request, response, req_id, duration_ms)
            
            # Add request ID to response headers for client tracking
            response.headers["X-Request-ID"] = req_id
            
            return response
            
        except Exception as exc:
            duration_ms = (time.time() - start_time) * 1000
            
            # Log error with full context
            self.log_request_error(request, exc, req_id, duration_ms)
            
            # Re-raise to let FastAPI handle the error
            raise exc

    def log_request_start(self, request: Request, req_id: str):
        """Log the start of a request"""
        self.logger.info("Request started", extra={
            "event_type": "request_start",
            "request_id": req_id,
            "method": request.method,
            "url": str(request.url),
            "path": request.url.path,
            "query_params": dict(request.query_params),
            "client_ip": self.get_client_ip(request),
            "user_agent": request.headers.get("user-agent"),
            "content_type": request.headers.get("content-type"),
            "timestamp": datetime.utcnow().isoformat()
        })

    def log_request_success(self, request: Request, response: Response, req_id: str, duration_ms: float):
        """Log successful request completion"""
        self.logger.info("Request completed", extra={
            "event_type": "request_success",
            "request_id": req_id,
            "method": request.method,
            "url": str(request.url),
            "path": request.url.path,
            "status_code": response.status_code,
            "duration_ms": round(duration_ms, 2),
            "response_size": response.headers.get("content-length"),
            "timestamp": datetime.utcnow().isoformat(),
            "performance_category": self.get_performance_category(duration_ms)
        })

    def log_request_error(self, request: Request, exc: Exception, req_id: str, duration_ms: float):
        """Log request that resulted in error"""
        self.logger.error("Request failed", extra={
            "event_type": "request_error",
            "request_id": req_id,
            "method": request.method,
            "url": str(request.url),
            "path": request.url.path,
            "error_type": type(exc).__name__,
            "error_message": str(exc),
            "duration_ms": round(duration_ms, 2),
            "timestamp": datetime.utcnow().isoformat()
        }, exc_info=True)

    def get_client_ip(self, request: Request) -> str:
        """Extract client IP address from request"""
        # Check for forwarded headers first
        forwarded_ips = [
            request.headers.get("x-forwarded-for"),
            request.headers.get("x-real-ip"),
            request.headers.get("x-client-ip")
        ]
        
        for ip_header in forwarded_ips:
            if ip_header:
                # Take the first IP if there are multiple
                return ip_header.split(",")[0].strip()
        
        # Fall back to direct client IP
        return request.client.host if request.client else "unknown"

    def get_performance_category(self, duration_ms: float) -> str:
        """Categorize response time performance"""
        if duration_ms < 100:
            return "fast"
        elif duration_ms < 500:
            return "normal"
        elif duration_ms < 2000:
            return "slow"
        else:
            return "very_slow"


class StructuredFormatter(logging.Formatter):
    """
    Custom formatter for structured JSON logging
    """

    def format(self, record: logging.LogRecord) -> str:
        """Format log record as JSON"""
        # Base log structure
        log_data = {
            "timestamp": datetime.fromtimestamp(record.created).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        
        # Add request ID if available
        req_id = request_id_ctx.get()
        if req_id:
            log_data["request_id"] = req_id
        
        # Add any extra fields from the log record
        if hasattr(record, "__dict__"):
            extra_fields = {
                k: v for k, v in record.__dict__.items()
                if k not in ("name", "msg", "args", "levelname", "levelno", "pathname", 
                           "filename", "module", "exc_info", "exc_text", "stack_info",
                           "lineno", "funcName", "created", "msecs", "relativeCreated",
                           "thread", "threadName", "processName", "process", "message")
            }
            log_data.update(extra_fields)
        
        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        
        return json.dumps(log_data, default=str, ensure_ascii=False)


class RequestIDLogger:
    """
    Logger wrapper that automatically includes request ID in all log entries
    """

    def __init__(self, logger_name: str = "a1betting"):
        self.logger = logging.getLogger(logger_name)

    def debug(self, message: str, **kwargs):
        """Log debug message with request ID"""
        self._log(logging.DEBUG, message, **kwargs)

    def info(self, message: str, **kwargs):
        """Log info message with request ID"""
        self._log(logging.INFO, message, **kwargs)

    def warning(self, message: str, **kwargs):
        """Log warning message with request ID"""
        self._log(logging.WARNING, message, **kwargs)

    def error(self, message: str, exc_info=False, **kwargs):
        """Log error message with request ID"""
        self._log(logging.ERROR, message, exc_info=exc_info, **kwargs)

    def critical(self, message: str, exc_info=False, **kwargs):
        """Log critical message with request ID"""
        self._log(logging.CRITICAL, message, exc_info=exc_info, **kwargs)

    def _log(self, level: int, message: str, exc_info=False, **kwargs):
        """Internal logging method"""
        extra = kwargs.copy()
        
        # Add request ID to extra fields
        req_id = request_id_ctx.get()
        if req_id:
            extra["request_id"] = req_id
        
        self.logger.log(level, message, extra=extra, exc_info=exc_info)


# Convenience function to get logger with request ID support
def get_structured_logger(name: str = "a1betting") -> RequestIDLogger:
    """Get a structured logger with automatic request ID inclusion"""
    return RequestIDLogger(name)


# Utility function to get current request ID
def get_request_id() -> Optional[str]:
    """Get the current request ID from context"""
    return request_id_ctx.get()


# Import Path for setup_structured_logging
from pathlib import Path
