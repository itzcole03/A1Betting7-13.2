"""
Distributed Trace Correlation Middleware

Provides distributed tracing capabilities with:
- TraceID and SpanID generation and propagation
- X-Trace-ID header handling
- Local trace context management
- Integration with existing request correlation
- Support for future distributed tracing systems

Even though this is "local only" for now, it follows distributed tracing patterns
for easy migration to systems like Jaeger, Zipkin, or OpenTelemetry later.
"""

import time
import uuid
from typing import Callable, Optional, Dict, Any
import logging
import contextvars

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

# Context variables for trace correlation
trace_context: contextvars.ContextVar[Dict[str, Any]] = contextvars.ContextVar(
    'trace_context', 
    default={}
)

logger = logging.getLogger(__name__)


class TraceSpan:
    """
    Represents a trace span with timing and metadata
    """
    
    def __init__(
        self, 
        trace_id: str, 
        span_id: str, 
        parent_span_id: Optional[str] = None,
        operation_name: str = "http_request",
        tags: Optional[Dict[str, Any]] = None
    ):
        self.trace_id = trace_id
        self.span_id = span_id
        self.parent_span_id = parent_span_id
        self.operation_name = operation_name
        self.tags = tags or {}
        self.start_time = time.time()
        self.end_time: Optional[float] = None
        self.logs: list = []
        
    def log(self, message: str, **kwargs):
        """Add a log entry to this span"""
        self.logs.append({
            'timestamp': time.time(),
            'message': message,
            **kwargs
        })
        
    def set_tag(self, key: str, value: Any):
        """Set a tag on this span"""
        self.tags[key] = value
        
    def finish(self):
        """Mark span as finished"""
        self.end_time = time.time()
        
    def duration_ms(self) -> float:
        """Get span duration in milliseconds"""
        if self.end_time:
            return round((self.end_time - self.start_time) * 1000, 2)
        return round((time.time() - self.start_time) * 1000, 2)
        
    def to_dict(self) -> Dict[str, Any]:
        """Convert span to dictionary for logging/export"""
        return {
            'trace_id': self.trace_id,
            'span_id': self.span_id,
            'parent_span_id': self.parent_span_id,
            'operation_name': self.operation_name,
            'start_time': self.start_time,
            'end_time': self.end_time,
            'duration_ms': self.duration_ms(),
            'tags': self.tags,
            'logs': self.logs
        }


class TraceContext:
    """
    Manages trace context for a request
    """
    
    def __init__(self, trace_id: str):
        self.trace_id = trace_id
        self.spans: Dict[str, TraceSpan] = {}
        self.root_span_id: Optional[str] = None
        
    def create_span(
        self, 
        operation_name: str, 
        parent_span_id: Optional[str] = None,
        tags: Optional[Dict[str, Any]] = None
    ) -> TraceSpan:
        """Create a new span in this trace"""
        span_id = str(uuid.uuid4())[:8]  # Short span ID
        
        span = TraceSpan(
            trace_id=self.trace_id,
            span_id=span_id,
            parent_span_id=parent_span_id,
            operation_name=operation_name,
            tags=tags
        )
        
        self.spans[span_id] = span
        
        if self.root_span_id is None:
            self.root_span_id = span_id
            
        return span
        
    def get_span(self, span_id: str) -> Optional[TraceSpan]:
        """Get span by ID"""
        return self.spans.get(span_id)
        
    def finish_all_spans(self):
        """Finish all unfinished spans"""
        for span in self.spans.values():
            if span.end_time is None:
                span.finish()
                
    def to_dict(self) -> Dict[str, Any]:
        """Convert trace context to dictionary"""
        return {
            'trace_id': self.trace_id,
            'root_span_id': self.root_span_id,
            'spans': {span_id: span.to_dict() for span_id, span in self.spans.items()}
        }


class DistributedTraceMiddleware(BaseHTTPMiddleware):
    """
    Middleware for distributed trace correlation
    
    Features:
    - Accepts X-Trace-ID header or generates new trace ID
    - Creates root span for each HTTP request
    - Stores trace context in contextvars and request state
    - Adds trace headers to responses
    - Logs trace information for observability
    """
    
    def __init__(self, app, trace_header: str = "X-Trace-ID"):
        super().__init__(app)
        self.trace_header = trace_header
        
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Process request with distributed tracing
        
        Args:
            request: Incoming HTTP request
            call_next: Next middleware/route handler
            
        Returns:
            Response with trace correlation headers
        """
        # Extract or generate trace ID
        trace_id = request.headers.get(self.trace_header)
        if not trace_id:
            trace_id = str(uuid.uuid4())
            
        # Create trace context
        trace_ctx = TraceContext(trace_id)
        
        # Create root span for this request
        root_span = trace_ctx.create_span(
            operation_name=f"{request.method} {request.url.path}",
            tags={
                'http.method': request.method,
                'http.url': str(request.url),
                'http.user_agent': request.headers.get('user-agent', ''),
                'http.remote_addr': getattr(request.client, 'host', 'unknown') if request.client else 'unknown'
            }
        )
        
        # Store in request state for FastAPI access
        request.state.trace_id = trace_id
        request.state.trace_context = trace_ctx
        request.state.current_span = root_span
        
        # Store in contextvars for nested operations
        trace_context.set({
            'trace_id': trace_id,
            'current_span': root_span,
            'trace_context': trace_ctx
        })
        
        try:
            # Process request
            response = await call_next(request)
            
            # Tag span with response status
            root_span.set_tag('http.status_code', response.status_code)
            
            # Determine if this is an error
            if response.status_code >= 400:
                root_span.set_tag('error', True)
                root_span.set_tag('error.kind', 'http_error')
                root_span.log(f"HTTP error response: {response.status_code}")
            
            # Add trace headers to response
            response.headers[self.trace_header] = trace_id
            response.headers["X-Span-ID"] = root_span.span_id
            
            # Finish root span
            root_span.finish()
            
            # Log trace summary
            logger.info(
                f"Trace completed: {trace_id}",
                extra={
                    'event_type': 'trace_complete',
                    'trace_id': trace_id,
                    'span_id': root_span.span_id,
                    'operation': root_span.operation_name,
                    'duration_ms': root_span.duration_ms(),
                    'status_code': response.status_code,
                    'span_count': len(trace_ctx.spans)
                }
            )
            
            return response
            
        except Exception as e:
            # Tag span with error information
            root_span.set_tag('error', True)
            root_span.set_tag('error.kind', 'exception')
            root_span.set_tag('error.object', type(e).__name__)
            root_span.log(f"Exception occurred: {str(e)}")
            
            # Finish span
            root_span.finish()
            
            # Log error trace
            logger.error(
                f"Trace failed: {trace_id}",
                extra={
                    'event_type': 'trace_error',
                    'trace_id': trace_id,
                    'span_id': root_span.span_id,
                    'operation': root_span.operation_name,
                    'duration_ms': root_span.duration_ms(),
                    'error_type': type(e).__name__,
                    'error_message': str(e),
                    'span_count': len(trace_ctx.spans)
                }
            )
            
            raise
        
        finally:
            # Ensure all spans are finished
            trace_ctx.finish_all_spans()


# Utility functions for trace context access
def get_current_trace_id() -> Optional[str]:
    """Get current trace ID from context"""
    ctx = trace_context.get({})
    return ctx.get('trace_id')


def get_current_span() -> Optional[TraceSpan]:
    """Get current span from context"""
    ctx = trace_context.get({})
    return ctx.get('current_span')


def get_trace_context() -> Optional[TraceContext]:
    """Get current trace context"""
    ctx = trace_context.get({})
    return ctx.get('trace_context')


def create_child_span(
    operation_name: str, 
    tags: Optional[Dict[str, Any]] = None
) -> Optional[TraceSpan]:
    """
    Create a child span of the current span
    
    Args:
        operation_name: Name of the operation
        tags: Optional tags for the span
        
    Returns:
        New child span or None if no trace context
    """
    trace_ctx = get_trace_context()
    current_span = get_current_span()
    
    if not trace_ctx or not current_span:
        return None
        
    return trace_ctx.create_span(
        operation_name=operation_name,
        parent_span_id=current_span.span_id,
        tags=tags
    )


def get_trace_id_from_request(request: Request) -> Optional[str]:
    """Get trace ID from FastAPI request object"""
    return getattr(request.state, 'trace_id', None)


def get_span_from_request(request: Request) -> Optional[TraceSpan]:
    """Get current span from FastAPI request object"""
    return getattr(request.state, 'current_span', None)


class TraceContextManager:
    """
    Context manager for creating child spans
    
    Usage:
        async with TraceContextManager("database_query") as span:
            if span:
                span.set_tag("query", "SELECT * FROM users")
                result = await database.query()
                span.set_tag("result_count", len(result))
    """
    
    def __init__(self, operation_name: str, tags: Optional[Dict[str, Any]] = None):
        self.operation_name = operation_name
        self.tags = tags
        self.span: Optional[TraceSpan] = None
        
    def __enter__(self) -> Optional[TraceSpan]:
        self.span = create_child_span(self.operation_name, self.tags)
        return self.span
        
    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.span:
            if exc_type:
                self.span.set_tag('error', True)
                self.span.set_tag('error.kind', 'exception')
                self.span.set_tag('error.object', exc_type.__name__)
                self.span.log(f"Exception: {str(exc_val)}")
            self.span.finish()

    async def __aenter__(self) -> Optional[TraceSpan]:
        return self.__enter__()
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        self.__exit__(exc_type, exc_val, exc_tb)


# Backwards compatibility with existing request ID middleware
def setup_distributed_tracing():
    """Setup function for distributed tracing middleware"""
    logger.info("Distributed trace correlation middleware configured")