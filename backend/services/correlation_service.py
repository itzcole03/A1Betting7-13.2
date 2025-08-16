"""
Unified Correlation ID System

Provides UUID-based correlation tracking across:
- Request/response cycles
- WebSocket handshakes and messages
- Validator snapshots
- Cross-service communication
- Logging and observability
"""

import asyncio
import threading
import time
import uuid
from contextlib import contextmanager
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional, Set
from contextvars import ContextVar


class CorrelationScope(Enum):
    """Correlation scope types"""
    REQUEST = "request"
    WEBSOCKET = "websocket"
    BACKGROUND_TASK = "background_task"
    VALIDATION = "validation"
    SYSTEM_EVENT = "system_event"
    USER_SESSION = "user_session"


@dataclass
class CorrelationContext:
    """Correlation context information"""
    correlation_id: str
    scope: CorrelationScope
    parent_id: Optional[str] = None
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    source: Optional[str] = None
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    request_path: Optional[str] = None
    trace_data: Dict[str, Any] = field(default_factory=dict)
    
    @property
    def age_seconds(self) -> float:
        """Get age of correlation context in seconds"""
        return (datetime.now(timezone.utc) - self.created_at).total_seconds()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization"""
        return {
            "correlation_id": self.correlation_id,
            "scope": self.scope.value,
            "parent_id": self.parent_id,
            "created_at": self.created_at.isoformat(),
            "source": self.source,
            "user_id": self.user_id,
            "session_id": self.session_id,
            "request_path": self.request_path,
            "trace_data": self.trace_data,
            "age_seconds": self.age_seconds
        }


# Context variables for correlation tracking
_current_correlation: ContextVar[Optional[CorrelationContext]] = ContextVar(
    'current_correlation', default=None
)


class CorrelationManager:
    """
    Manages correlation IDs across the application
    
    Features:
    - UUID-based correlation ID generation
    - Context variable tracking
    - Cross-request/WebSocket correlation
    - Hierarchical correlation (parent-child relationships)
    - Automatic cleanup of expired contexts
    - Thread-safe operations
    """
    
    def __init__(self):
        self._active_correlations: Dict[str, CorrelationContext] = {}
        self._lock = threading.RLock()
        self._cleanup_interval = 300  # 5 minutes
        self._max_age_hours = 24
        self._last_cleanup = time.time()
    
    def generate_correlation_id(self, prefix: Optional[str] = None) -> str:
        """Generate a new correlation ID"""
        base_id = str(uuid.uuid4())
        if prefix:
            return f"{prefix}-{base_id}"
        return base_id
    
    def create_context(
        self,
        scope: CorrelationScope,
        correlation_id: Optional[str] = None,
        parent_id: Optional[str] = None,
        source: Optional[str] = None,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
        request_path: Optional[str] = None,
        trace_data: Optional[Dict[str, Any]] = None
    ) -> CorrelationContext:
        """Create a new correlation context"""
        
        if not correlation_id:
            correlation_id = self.generate_correlation_id(scope.value.lower())
        
        context = CorrelationContext(
            correlation_id=correlation_id,
            scope=scope,
            parent_id=parent_id,
            source=source,
            user_id=user_id,
            session_id=session_id,
            request_path=request_path,
            trace_data=trace_data or {}
        )
        
        with self._lock:
            self._active_correlations[correlation_id] = context
            
        # Periodic cleanup
        self._maybe_cleanup()
        
        return context
    
    def get_context(self, correlation_id: str) -> Optional[CorrelationContext]:
        """Get correlation context by ID"""
        with self._lock:
            return self._active_correlations.get(correlation_id)
    
    def get_current_context(self) -> Optional[CorrelationContext]:
        """Get current correlation context from context variable"""
        return _current_correlation.get(None)
    
    def set_current_context(self, context: Optional[CorrelationContext]):
        """Set current correlation context in context variable"""
        _current_correlation.set(context)
    
    def get_current_correlation_id(self) -> Optional[str]:
        """Get current correlation ID"""
        context = self.get_current_context()
        return context.correlation_id if context else None
    
    def update_context(
        self,
        correlation_id: str,
        **updates
    ) -> Optional[CorrelationContext]:
        """Update existing correlation context"""
        with self._lock:
            context = self._active_correlations.get(correlation_id)
            if context:
                for key, value in updates.items():
                    if hasattr(context, key):
                        setattr(context, key, value)
                    else:
                        # Add to trace_data if not a direct attribute
                        context.trace_data[key] = value
                return context
        return None
    
    def remove_context(self, correlation_id: str):
        """Remove correlation context"""
        with self._lock:
            self._active_correlations.pop(correlation_id, None)
    
    def get_child_contexts(self, parent_id: str) -> List[CorrelationContext]:
        """Get all child contexts for a parent correlation"""
        with self._lock:
            return [
                ctx for ctx in self._active_correlations.values()
                if ctx.parent_id == parent_id
            ]
    
    def get_context_hierarchy(self, correlation_id: str) -> List[CorrelationContext]:
        """Get the full hierarchy for a correlation (parent chain + children)"""
        contexts = []
        
        # Get the specified context
        context = self.get_context(correlation_id)
        if not context:
            return contexts
        
        # Build parent chain
        current = context
        parent_chain = [current]
        while current.parent_id:
            parent_context = self.get_context(current.parent_id)
            if parent_context and parent_context not in parent_chain:
                parent_chain.insert(0, parent_context)
                current = parent_context
            else:
                break
        
        # Get all children recursively
        def get_children_recursive(parent_id: str) -> List[CorrelationContext]:
            children = self.get_child_contexts(parent_id)
            all_descendants = children[:]
            for child in children:
                all_descendants.extend(get_children_recursive(child.correlation_id))
            return all_descendants
        
        children = get_children_recursive(correlation_id)
        
        return parent_chain + children
    
    def _maybe_cleanup(self):
        """Clean up expired contexts if needed"""
        current_time = time.time()
        if current_time - self._last_cleanup > self._cleanup_interval:
            self._cleanup_expired_contexts()
            self._last_cleanup = current_time
    
    def _cleanup_expired_contexts(self):
        """Remove expired correlation contexts"""
        with self._lock:
            expired_ids = []
            cutoff_time = datetime.now(timezone.utc).timestamp() - (self._max_age_hours * 3600)
            
            for correlation_id, context in self._active_correlations.items():
                if context.created_at.timestamp() < cutoff_time:
                    expired_ids.append(correlation_id)
            
            for correlation_id in expired_ids:
                del self._active_correlations[correlation_id]
            
            if expired_ids:
                print(f"CorrelationManager: Cleaned up {len(expired_ids)} expired contexts")
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get correlation manager statistics"""
        with self._lock:
            by_scope = {}
            total_contexts = len(self._active_correlations)
            
            for context in self._active_correlations.values():
                scope = context.scope.value
                if scope not in by_scope:
                    by_scope[scope] = 0
                by_scope[scope] += 1
            
            return {
                "total_active_contexts": total_contexts,
                "contexts_by_scope": by_scope,
                "cleanup_stats": {
                    "last_cleanup_seconds_ago": time.time() - self._last_cleanup,
                    "cleanup_interval_seconds": self._cleanup_interval,
                    "max_age_hours": self._max_age_hours
                }
            }


# Global correlation manager instance
correlation_manager = CorrelationManager()


# Context managers
@contextmanager
def correlation_context(
    scope: CorrelationScope,
    correlation_id: Optional[str] = None,
    parent_id: Optional[str] = None,
    **context_data
):
    """Context manager for correlation tracking"""
    # Use parent from current context if not specified
    if parent_id is None:
        current_context = correlation_manager.get_current_context()
        if current_context:
            parent_id = current_context.correlation_id
    
    # Create new context
    context = correlation_manager.create_context(
        scope=scope,
        correlation_id=correlation_id,
        parent_id=parent_id,
        **context_data
    )
    
    # Set as current context
    previous_context = correlation_manager.get_current_context()
    correlation_manager.set_current_context(context)
    
    try:
        yield context
    finally:
        # Restore previous context
        correlation_manager.set_current_context(previous_context)


@contextmanager
def request_correlation(
    request_path: str,
    correlation_id: Optional[str] = None,
    user_id: Optional[str] = None,
    session_id: Optional[str] = None
):
    """Context manager for HTTP request correlation"""
    with correlation_context(
        scope=CorrelationScope.REQUEST,
        correlation_id=correlation_id,
        source="http_request",
        request_path=request_path,
        user_id=user_id,
        session_id=session_id
    ) as context:
        yield context


@contextmanager 
def websocket_correlation(
    client_id: str,
    correlation_id: Optional[str] = None,
    user_id: Optional[str] = None,
    session_id: Optional[str] = None
):
    """Context manager for WebSocket correlation"""
    with correlation_context(
        scope=CorrelationScope.WEBSOCKET,
        correlation_id=correlation_id,
        source="websocket",
        user_id=user_id,
        session_id=session_id,
        trace_data={"client_id": client_id}
    ) as context:
        yield context


@contextmanager
def validation_correlation(
    validation_type: str,
    correlation_id: Optional[str] = None,
    validator_name: Optional[str] = None
):
    """Context manager for validation correlation"""
    with correlation_context(
        scope=CorrelationScope.VALIDATION,
        correlation_id=correlation_id,
        source="validator",
        trace_data={
            "validation_type": validation_type,
            "validator_name": validator_name
        }
    ) as context:
        yield context


# Utility functions
def get_correlation_id() -> Optional[str]:
    """Get current correlation ID"""
    return correlation_manager.get_current_correlation_id()


def get_correlation_context() -> Optional[CorrelationContext]:
    """Get current correlation context"""
    return correlation_manager.get_current_context()


def create_child_correlation(
    scope: CorrelationScope,
    source: Optional[str] = None,
    **trace_data
) -> CorrelationContext:
    """Create a child correlation from current context"""
    parent_context = correlation_manager.get_current_context()
    parent_id = parent_context.correlation_id if parent_context else None
    
    return correlation_manager.create_context(
        scope=scope,
        parent_id=parent_id,
        source=source,
        trace_data=trace_data
    )


def add_trace_data(key: str, value: Any, correlation_id: Optional[str] = None):
    """Add trace data to correlation context"""
    if correlation_id:
        correlation_manager.update_context(correlation_id, **{key: value})
    else:
        context = correlation_manager.get_current_context()
        if context:
            context.trace_data[key] = value


def get_correlation_statistics() -> Dict[str, Any]:
    """Get correlation system statistics"""
    return correlation_manager.get_statistics()


# WebSocket correlation helpers
def extract_correlation_from_websocket_query(query_params: Dict[str, str]) -> Optional[str]:
    """Extract correlation ID from WebSocket query parameters"""
    return query_params.get('correlationId') or query_params.get('correlation_id')


def add_correlation_to_websocket_query(
    base_url: str, 
    correlation_id: str
) -> str:
    """Add correlation ID to WebSocket URL query parameters"""
    separator = '&' if '?' in base_url else '?'
    return f"{base_url}{separator}correlationId={correlation_id}"


# Async context manager for async operations
class AsyncCorrelationContext:
    """Async context manager for correlation tracking"""
    
    def __init__(
        self,
        scope: CorrelationScope,
        correlation_id: Optional[str] = None,
        parent_id: Optional[str] = None,
        **context_data
    ):
        self.scope = scope
        self.correlation_id = correlation_id
        self.parent_id = parent_id
        self.context_data = context_data
        self.context: Optional[CorrelationContext] = None
        self.previous_context: Optional[CorrelationContext] = None
    
    async def __aenter__(self) -> CorrelationContext:
        # Use parent from current context if not specified
        if self.parent_id is None:
            current_context = correlation_manager.get_current_context()
            if current_context:
                self.parent_id = current_context.correlation_id
        
        # Create new context
        self.context = correlation_manager.create_context(
            scope=self.scope,
            correlation_id=self.correlation_id,
            parent_id=self.parent_id,
            **self.context_data
        )
        
        # Set as current context
        self.previous_context = correlation_manager.get_current_context()
        correlation_manager.set_current_context(self.context)
        
        return self.context
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        # Restore previous context
        correlation_manager.set_current_context(self.previous_context)


def async_correlation_context(
    scope: CorrelationScope,
    correlation_id: Optional[str] = None,
    parent_id: Optional[str] = None,
    **context_data
) -> AsyncCorrelationContext:
    """Create async correlation context manager"""
    return AsyncCorrelationContext(
        scope=scope,
        correlation_id=correlation_id,
        parent_id=parent_id,
        **context_data
    )


# Export interfaces
__all__ = [
    "CorrelationManager",
    "CorrelationContext", 
    "CorrelationScope",
    "correlation_manager",
    "correlation_context",
    "request_correlation",
    "websocket_correlation", 
    "validation_correlation",
    "async_correlation_context",
    "get_correlation_id",
    "get_correlation_context",
    "create_child_correlation",
    "add_trace_data",
    "get_correlation_statistics",
    "extract_correlation_from_websocket_query",
    "add_correlation_to_websocket_query"
]