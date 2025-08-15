"""
Tracing Utilities

Lightweight span and trace management for performance monitoring
and service instrumentation with minimal overhead.
"""

import time
import uuid
from typing import Optional, Dict, Any, List
from contextlib import contextmanager
from dataclasses import dataclass, field
import logging

from ..utils.log_context import span_context, get_contextual_logger, get_request_id

# Logger for trace operations
logger = get_contextual_logger(__name__)


@dataclass
class TraceMetrics:
    """Metrics captured during span execution"""
    start_time: float
    end_time: Optional[float] = None
    duration_ms: Optional[float] = None
    memory_usage_mb: Optional[float] = None
    cpu_percent: Optional[float] = None
    custom_metrics: Dict[str, Any] = field(default_factory=dict)


@dataclass
class SpanInfo:
    """Information about a trace span"""
    span_id: str
    span_name: str
    parent_span_id: Optional[str] = None
    request_id: Optional[str] = None
    service_name: Optional[str] = None
    operation_name: Optional[str] = None
    tags: Dict[str, Any] = field(default_factory=dict)
    metrics: Optional[TraceMetrics] = None
    logs: List[Dict[str, Any]] = field(default_factory=list)
    
    def __post_init__(self):
        if self.metrics is None:
            self.metrics = TraceMetrics(start_time=time.time())
    

class TraceManager:
    """
    Lightweight trace manager for service instrumentation
    
    Features:
    - Minimal overhead span tracking
    - Automatic metric collection
    - Integration with existing logging
    - Memory-efficient trace storage
    """
    
    def __init__(self):
        self.active_spans: Dict[str, SpanInfo] = {}
        self.completed_spans: List[SpanInfo] = []
        self.max_completed_spans = 1000  # Memory limit
        
    def create_span(
        self,
        span_name: str,
        parent_span_id: Optional[str] = None,
        service_name: Optional[str] = None,
        operation_name: Optional[str] = None,
        tags: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Create a new trace span
        
        Args:
            span_name: Human-readable span name
            parent_span_id: Parent span ID for hierarchical tracing
            service_name: Service name for span classification
            operation_name: Operation name for span classification
            tags: Additional span metadata
            
        Returns:
            Generated span ID
        """
        span_id = str(uuid.uuid4())[:8]  # Short UUID for readability
        
        span_info = SpanInfo(
            span_id=span_id,
            span_name=span_name,
            parent_span_id=parent_span_id,
            request_id=get_request_id(),
            service_name=service_name,
            operation_name=operation_name,
            tags=tags or {}
        )
        
        self.active_spans[span_id] = span_info
        
        logger.debug(
            f"Span created: {span_name}",
            extra={
                'event_type': 'span_create',
                'span_id': span_id,
                'span_name': span_name,
                'parent_span_id': parent_span_id,
                'service_name': service_name,
                'operation_name': operation_name,
                'tags': tags
            }
        )
        
        return span_id
        
    def finish_span(self, span_id: str, tags: Optional[Dict[str, Any]] = None) -> Optional[SpanInfo]:
        """
        Finish a trace span and calculate metrics
        
        Args:
            span_id: Span ID to finish
            tags: Additional tags to add to span
            
        Returns:
            Completed SpanInfo or None if span not found
        """
        span_info = self.active_spans.pop(span_id, None)
        if not span_info or not span_info.metrics:
            logger.warning(f"Attempted to finish unknown span or span without metrics: {span_id}")
            return None
            
        # Calculate timing metrics
        end_time = time.time()
        span_info.metrics.end_time = end_time
        span_info.metrics.duration_ms = round(
            (end_time - span_info.metrics.start_time) * 1000, 2
        )
        
        # Add final tags
        if tags:
            span_info.tags.update(tags)
            
        # Store completed span (with memory limit)
        self.completed_spans.append(span_info)
        if len(self.completed_spans) > self.max_completed_spans:
            self.completed_spans.pop(0)  # Remove oldest
            
        logger.debug(
            f"Span finished: {span_info.span_name}",
            extra={
                'event_type': 'span_finish',
                'span_id': span_id,
                'span_name': span_info.span_name,
                'duration_ms': span_info.metrics.duration_ms,
                'tags': span_info.tags
            }
        )
        
        return span_info
        
    def add_span_log(self, span_id: str, message: str, level: str = "info", **kwargs):
        """
        Add a log entry to an active span
        
        Args:
            span_id: Target span ID
            message: Log message
            level: Log level
            **kwargs: Additional log fields
        """
        span_info = self.active_spans.get(span_id)
        if not span_info:
            logger.warning(f"Attempted to log to unknown span: {span_id}")
            return
            
        log_entry = {
            'timestamp': time.time(),
            'level': level,
            'message': message,
            **kwargs
        }
        
        span_info.logs.append(log_entry)
        
    def add_span_tag(self, span_id: str, key: str, value: Any):
        """
        Add a tag to an active span
        
        Args:
            span_id: Target span ID
            key: Tag key
            value: Tag value
        """
        span_info = self.active_spans.get(span_id)
        if span_info:
            span_info.tags[key] = value
            
    def get_span_metrics(self, span_id: str) -> Optional[TraceMetrics]:
        """
        Get metrics for a span (active or completed)
        
        Args:
            span_id: Target span ID
            
        Returns:
            TraceMetrics or None if span not found
        """
        # Check active spans
        span_info = self.active_spans.get(span_id)
        if span_info:
            return span_info.metrics
            
        # Check completed spans
        for span_info in reversed(self.completed_spans):
            if span_info.span_id == span_id:
                return span_info.metrics
                
        return None
        
    def get_trace_summary(self, request_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Get summary of traces for a request
        
        Args:
            request_id: Filter by request ID. If None, uses current request
            
        Returns:
            Trace summary with span count, total duration, etc.
        """
        if request_id is None:
            request_id = get_request_id()
            
        if not request_id:
            return {"error": "No request ID available"}
            
        # Find spans for this request
        spans = []
        
        # Active spans
        for span_info in self.active_spans.values():
            if span_info.request_id == request_id:
                spans.append(span_info)
                
        # Completed spans
        for span_info in self.completed_spans:
            if span_info.request_id == request_id:
                spans.append(span_info)
                
        if not spans:
            return {"request_id": request_id, "spans": [], "total_spans": 0}
            
        # Calculate summary metrics
        total_duration = sum(
            span.metrics.duration_ms or 0 for span in spans 
            if span.metrics.duration_ms is not None
        )
        
        completed_spans = [s for s in spans if s.metrics.end_time is not None]
        active_spans = [s for s in spans if s.metrics.end_time is None]
        
        return {
            "request_id": request_id,
            "total_spans": len(spans),
            "completed_spans": len(completed_spans),
            "active_spans": len(active_spans),
            "total_duration_ms": total_duration,
            "spans": [
                {
                    "span_id": s.span_id,
                    "span_name": s.span_name,
                    "parent_span_id": s.parent_span_id,
                    "duration_ms": s.metrics.duration_ms,
                    "tags": s.tags,
                    "log_count": len(s.logs)
                }
                for s in spans
            ]
        }


# Global trace manager instance
_trace_manager = TraceManager()


@contextmanager
def trace_span(
    span_name: str,
    service_name: Optional[str] = None,
    operation_name: Optional[str] = None,
    tags: Optional[Dict[str, Any]] = None
):
    """
    Context manager for creating trace spans
    
    Args:
        span_name: Human-readable span name
        service_name: Service name for classification
        operation_name: Operation name for classification
        tags: Initial span tags
        
    Usage:
        with trace_span("cache_rebuild", service_name="cache") as span_id:
            # Perform operation
            add_span_tag(span_id, "cache_size", 1000)
    """
    # Use span_context for contextvars integration
    with span_context(span_name) as context_span_id:
        # Create trace span
        span_id = _trace_manager.create_span(
            span_name=span_name,
            parent_span_id=context_span_id if context_span_id != span_name else None,
            service_name=service_name,
            operation_name=operation_name,
            tags=tags
        )
        
        try:
            yield span_id
        finally:
            _trace_manager.finish_span(span_id)


def add_span_tag(span_id: str, key: str, value: Any):
    """Add a tag to an active span"""
    _trace_manager.add_span_tag(span_id, key, value)


def add_span_log(span_id: str, message: str, level: str = "info", **kwargs):
    """Add a log entry to an active span"""
    _trace_manager.add_span_log(span_id, message, level, **kwargs)


def get_trace_summary(request_id: Optional[str] = None) -> Dict[str, Any]:
    """Get trace summary for request"""
    return _trace_manager.get_trace_summary(request_id)


def get_span_metrics(span_id: str) -> Optional[TraceMetrics]:
    """Get metrics for a span"""
    return _trace_manager.get_span_metrics(span_id)


# Lightweight span decorator
def traced(
    span_name: Optional[str] = None,
    service_name: Optional[str] = None,
    operation_name: Optional[str] = None
):
    """
    Decorator for automatic span creation
    
    Args:
        span_name: Span name. If None, uses function name
        service_name: Service name for classification
        operation_name: Operation name for classification
        
    Usage:
        @traced(service_name="mlb", operation_name="fetch_games")
        async def fetch_games():
            return await api_client.get("/games")
    """
    def decorator(func):
        def wrapper(*args, **kwargs):
            name = span_name or func.__name__
            
            with trace_span(
                span_name=name,
                service_name=service_name,
                operation_name=operation_name,
                tags={"function": func.__name__, "module": func.__module__}
            ) as span_id:
                try:
                    result = func(*args, **kwargs)
                    add_span_tag(span_id, "success", True)
                    return result
                except Exception as e:
                    add_span_tag(span_id, "success", False)
                    add_span_tag(span_id, "error", str(e))
                    add_span_log(span_id, f"Function error: {str(e)}", "error")
                    raise
                    
        # Handle async functions
        import asyncio
        if asyncio.iscoroutinefunction(func):
            async def async_wrapper(*args, **kwargs):
                name = span_name or func.__name__
                
                with trace_span(
                    span_name=name,
                    service_name=service_name,
                    operation_name=operation_name,
                    tags={"function": func.__name__, "module": func.__module__}
                ) as span_id:
                    try:
                        result = await func(*args, **kwargs)
                        add_span_tag(span_id, "success", True)
                        return result
                    except Exception as e:
                        add_span_tag(span_id, "success", False)
                        add_span_tag(span_id, "error", str(e))
                        add_span_log(span_id, f"Function error: {str(e)}", "error")
                        raise
            return async_wrapper
            
        return wrapper
    return decorator