"""
Request Context and Tracing Utilities

Provides contextvars-based request correlation and span tracking
for end-to-end observability across the application.
"""

import contextvars
import logging
import uuid
from typing import Optional, Dict, Any, MutableMapping
from contextlib import contextmanager

# Context variables for request correlation
_request_id: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar("request_id", default=None)
_span_stack: contextvars.ContextVar[list[str]] = contextvars.ContextVar("span_stack")
_current_span_id: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar("current_span_id", default=None)
_parent_span_id: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar("parent_span_id", default=None)

# Logger for context operations
logger = logging.getLogger(__name__)


def set_request_id(request_id: str) -> None:
    """Set the current request ID in context"""
    _request_id.set(request_id)


def get_request_id() -> Optional[str]:
    """Get the current request ID from context"""
    return _request_id.get()


def clear_request_id() -> None:
    """Clear the current request ID from context"""
    _request_id.set(None)


def set_current_span_id(span_id: Optional[str]) -> None:
    """Set the current span ID in context"""
    _current_span_id.set(span_id)


def get_current_span_id() -> Optional[str]:
    """Get the current span ID from context"""
    return _current_span_id.get()


def set_parent_span_id(parent_span_id: Optional[str]) -> None:
    """Set the parent span ID in context"""
    _parent_span_id.set(parent_span_id)


def get_parent_span_id() -> Optional[str]:
    """Get the parent span ID from context"""
    return _parent_span_id.get()


def get_span_stack() -> list[str]:
    """Get the current span stack from context"""
    try:
        return _span_stack.get().copy()
    except LookupError:
        return []


def push_span(span_id: str) -> None:
    """Push a span ID onto the span stack"""
    try:
        stack = _span_stack.get()
    except LookupError:
        stack = []
    
    stack.append(span_id)
    _span_stack.set(stack)


def pop_span() -> Optional[str]:
    """Pop a span ID from the span stack"""
    try:
        stack = _span_stack.get()
    except LookupError:
        return None
        
    if stack:
        span_id = stack.pop()
        _span_stack.set(stack)
        return span_id
    return None


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger that automatically includes request context
    
    Args:
        name: Logger name
        
    Returns:
        Logger instance with context filtering
    """
    return logging.getLogger(name)


class ContextualLoggerAdapter(logging.LoggerAdapter):
    """
    Logger adapter that automatically injects request context
    """
    
    def process(self, msg: str, kwargs: MutableMapping[str, Any]) -> tuple[str, MutableMapping[str, Any]]:
        """Process log record to include request context"""
        extra = kwargs.get('extra', {})
        
        # Add request ID if available
        request_id = get_request_id()
        if request_id:
            extra['request_id'] = request_id
            
        # Add span context if available
        span_id = get_current_span_id()
        if span_id:
            extra['span_id'] = span_id
            
        parent_span_id = get_parent_span_id()
        if parent_span_id:
            extra['parent_span_id'] = parent_span_id
            
        kwargs['extra'] = extra
        return msg, kwargs


def get_contextual_logger(name: str) -> ContextualLoggerAdapter:
    """
    Get a logger adapter that automatically includes request context
    
    Args:
        name: Logger name
        
    Returns:
        ContextualLoggerAdapter instance
    """
    base_logger = logging.getLogger(name)
    return ContextualLoggerAdapter(base_logger, {})


@contextmanager
def request_context(request_id: Optional[str] = None):
    """
    Context manager for setting request context
    
    Args:
        request_id: Request ID to set. If None, generates a new UUID4
        
    Usage:
        with request_context("req-123"):
            # All logging within this context includes request_id
            logger.info("Processing request")
    """
    if request_id is None:
        request_id = str(uuid.uuid4())
        
    # Save current context
    old_request_id = get_request_id()
    
    try:
        set_request_id(request_id)
        yield request_id
    finally:
        # Restore previous context
        if old_request_id:
            set_request_id(old_request_id)
        else:
            clear_request_id()


@contextmanager
def span_context(span_name: str, parent_span_id: Optional[str] = None):
    """
    Context manager for creating spans with hierarchical tracking
    
    Args:
        span_name: Name of the span
        parent_span_id: Parent span ID. If None, uses current span as parent
        
    Usage:
        with span_context("cache_rebuild"):
            # All operations within this span are correlated
            logger.info("Rebuilding cache")
    """
    # Generate span ID (shortened UUID)
    span_id = str(uuid.uuid4())[:8]
    
    # Determine parent
    if parent_span_id is None:
        parent_span_id = get_current_span_id()
        
    # Save current context
    old_span_id = get_current_span_id()
    old_parent_span_id = get_parent_span_id()
    
    try:
        # Set new span context
        set_current_span_id(span_id)
        if parent_span_id:
            set_parent_span_id(parent_span_id)
            
        push_span(span_id)
        
        # Log span start
        logger.debug(
            f"Span started: {span_name}",
            extra={
                'span_name': span_name,
                'span_id': span_id,
                'parent_span_id': parent_span_id,
                'event_type': 'span_start'
            }
        )
        
        yield span_id
        
    finally:
        # Log span end
        logger.debug(
            f"Span ended: {span_name}",
            extra={
                'span_name': span_name,
                'span_id': span_id,
                'parent_span_id': parent_span_id,
                'event_type': 'span_end'
            }
        )
        
        # Restore previous context
        pop_span()
        set_current_span_id(old_span_id)
        set_parent_span_id(old_parent_span_id)


class RequestContextFilter(logging.Filter):
    """
    Logging filter that adds request context to all log records
    """
    
    def filter(self, record: logging.LogRecord) -> bool:
        """Add request context to log record"""
        # Add request ID if available and not already set
        if not hasattr(record, 'request_id'):
            request_id = get_request_id()
            if request_id:
                record.request_id = request_id
                
        # Add span context if available and not already set
        if not hasattr(record, 'span_id'):
            span_id = get_current_span_id()
            if span_id:
                record.span_id = span_id
                
        if not hasattr(record, 'parent_span_id'):
            parent_span_id = get_parent_span_id()
            if parent_span_id:
                record.parent_span_id = parent_span_id
                
        return True


def setup_context_logging():
    """
    Setup logging to automatically include request context
    """
    # Add context filter to root logger
    context_filter = RequestContextFilter()
    root_logger = logging.getLogger()
    
    # Add filter to all existing handlers
    for handler in root_logger.handlers:
        handler.addFilter(context_filter)
        
    logger.info("Request context logging configured")


# Auto-setup context logging when module is imported
setup_context_logging()