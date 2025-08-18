"""
Phase 0 Streaming Standardized Logging Schema

Implements standardized logging with category, action, status, duration_ms fields
and structured metadata for streaming operations as specified in Phase 0 requirements.
"""

import time
from contextlib import contextmanager
from typing import Any, Dict, Optional, Union
from enum import Enum

from .unified_logging import UnifiedLogger, LogLevel, LogContext


class StreamingCategory(Enum):
    """Streaming-specific log categories"""
    STREAMING = "streaming"
    VALUATION = "valuation" 
    PROVIDER = "provider"
    BUS = "bus"
    CIRCUIT_BREAKER = "circuit_breaker"
    PROVIDER_HEALTH = "provider_health"
    EDGES = "edges"


class StreamingAction(Enum):
    """Streaming-specific actions"""
    CYCLE = "cycle"
    CYCLE_START = "cycle_start"
    CYCLE_COMPLETE = "cycle_complete"
    EVENT_EMIT = "event_emit"
    RECOMPUTE = "recompute"
    DEBOUNCE_SKIP = "debounce_skip"
    BATCH_FLUSH = "batch_flush"
    PROVIDER_REQUEST = "provider_request"
    CIRCUIT_TRANSITION = "circuit_transition"
    STATE_CHANGE = "state_change"
    HANDLER_FAILURE = "handler_failure"
    DEAD_LETTER = "dead_letter"
    REFRESH = "refresh"


class StreamingStatus(Enum):
    """Streaming operation status"""
    OK = "ok"
    SUCCESS = "success"
    FAILED = "failed"  
    ERROR = "error"
    SKIPPED = "skipped"
    TIMEOUT = "timeout"
    DEGRADED = "degraded"
    RECOVERING = "recovering"


class StreamingLogger:
    """
    Standardized logger for streaming operations
    
    Provides structured logging with Phase 0 schema:
    - category: StreamingCategory
    - action: StreamingAction  
    - status: StreamingStatus
    - duration_ms: Optional[float]
    - id fields: prop_id, edge_id, run_id, provider_id
    - meta: Dict[str, Any] for additional context
    """
    
    def __init__(self, logger_name: str = "streaming"):
        self.unified_logger = UnifiedLogger(logger_name)
        self._start_times: Dict[str, float] = {}
        
    def log_streaming_event(
        self, 
        category: Union[StreamingCategory, str],
        action: Union[StreamingAction, str], 
        status: Union[StreamingStatus, str],
        message: str,
        duration_ms: Optional[float] = None,
        prop_id: Optional[str] = None,
        edge_id: Optional[str] = None,
        run_id: Optional[str] = None,
        provider_id: Optional[str] = None,
        cycle_id: Optional[str] = None,
        event_id: Optional[str] = None,
        meta: Optional[Dict[str, Any]] = None,
        level: LogLevel = LogLevel.INFO
    ):
        """
        Log a streaming event with standardized schema
        
        Args:
            category: Event category (streaming, valuation, provider, etc.)
            action: Action performed (cycle, recompute, etc.)
            status: Operation status (ok, failed, etc.)
            message: Human readable message
            duration_ms: Operation duration in milliseconds
            prop_id: Proposition ID
            edge_id: Edge ID
            run_id: Run/batch ID
            provider_id: Provider ID
            cycle_id: Streaming cycle ID
            event_id: Event ID
            meta: Additional metadata
            level: Log level
        """
        # Convert enums to strings
        category_str = category.value if isinstance(category, StreamingCategory) else str(category)
        action_str = action.value if isinstance(action, StreamingAction) else str(action)
        status_str = status.value if isinstance(status, StreamingStatus) else str(status)
        
        # Build structured log record
        extra_fields = {}
        
        # Add duration if provided
        if duration_ms is not None:
            extra_fields["duration_ms"] = float(duration_ms)
            
        # Add ID fields if provided
        if prop_id:
            extra_fields["prop_id"] = prop_id
        if edge_id:
            extra_fields["edge_id"] = edge_id
        if run_id:
            extra_fields["run_id"] = run_id
        if provider_id:
            extra_fields["provider_id"] = provider_id
        if cycle_id:
            extra_fields["cycle_id"] = cycle_id
        if event_id:
            extra_fields["event_id"] = event_id
            
        # Add standard fields
        extra_fields["category"] = category_str
        extra_fields["action"] = action_str
        extra_fields["status"] = status_str
            
        # Add metadata
        if meta:
            extra_fields.update({f"meta_{k}": v for k, v in meta.items()})
            
        # Create context with additional data
        context = LogContext(
            request_id=run_id,
            session_id=cycle_id,
            duration_ms=duration_ms,
            additional_data={"category": category_str, "action": action_str, "status": status_str}
        )
        
        # Log the event using appropriate level method
        if level == LogLevel.DEBUG:
            self.unified_logger.debug(message, context=context, **extra_fields)
        elif level == LogLevel.INFO:
            self.unified_logger.info(message, context=context, **extra_fields)
        elif level == LogLevel.WARNING:
            self.unified_logger.warning(message, context=context, **extra_fields)
        elif level == LogLevel.ERROR:
            self.unified_logger.error(message, context=context, **extra_fields)
        elif level == LogLevel.CRITICAL:
            self.unified_logger.critical(message, context=context, **extra_fields)
        else:
            self.unified_logger.info(message, context=context, **extra_fields)
    
    def info(self, category: Union[StreamingCategory, str], action: Union[StreamingAction, str], 
             message: str, **kwargs):
        """Log info level streaming event"""
        self.log_streaming_event(category, action, StreamingStatus.OK, message, 
                               level=LogLevel.INFO, **kwargs)
    
    def error(self, category: Union[StreamingCategory, str], action: Union[StreamingAction, str],
              message: str, **kwargs):
        """Log error level streaming event"""
        self.log_streaming_event(category, action, StreamingStatus.ERROR, message,
                               level=LogLevel.ERROR, **kwargs)
                               
    def warning(self, category: Union[StreamingCategory, str], action: Union[StreamingAction, str],
                message: str, **kwargs):
        """Log warning level streaming event"""  
        self.log_streaming_event(category, action, StreamingStatus.DEGRADED, message,
                               level=LogLevel.WARNING, **kwargs)
    
    def debug(self, category: Union[StreamingCategory, str], action: Union[StreamingAction, str],
              message: str, **kwargs):
        """Log debug level streaming event"""
        self.log_streaming_event(category, action, StreamingStatus.OK, message,
                               level=LogLevel.DEBUG, **kwargs)
    
    def start_operation(self, operation_id: str) -> str:
        """Start timing an operation"""
        self._start_times[operation_id] = time.time() * 1000  # Store in ms
        return operation_id
        
    def end_operation(self, operation_id: str) -> float:
        """End timing an operation and return duration"""
        if operation_id in self._start_times:
            duration = (time.time() * 1000) - self._start_times[operation_id]
            del self._start_times[operation_id]
            return duration
        return 0.0
    
    @contextmanager
    def timed_operation(self, category: Union[StreamingCategory, str], 
                       action: Union[StreamingAction, str], operation_id: str, **kwargs):
        """Context manager for timed operations"""
        start_time = time.time() * 1000
        try:
            yield
            duration = (time.time() * 1000) - start_time
            self.log_streaming_event(category, action, StreamingStatus.SUCCESS, 
                                   f"Operation {operation_id} completed",
                                   duration_ms=duration, **kwargs)
        except Exception as e:
            duration = (time.time() * 1000) - start_time
            self.log_streaming_event(category, action, StreamingStatus.FAILED,
                                   f"Operation {operation_id} failed: {str(e)}",
                                   duration_ms=duration, **kwargs)
            raise


# Global streaming logger instance
streaming_logger = StreamingLogger()


# Convenience functions for common streaming operations
def log_cycle_start(cycle_id: str, providers_count: int, **kwargs):
    """Log streaming cycle start"""
    streaming_logger.info(
        StreamingCategory.STREAMING, 
        StreamingAction.CYCLE_START,
        f"Starting cycle {cycle_id} with {providers_count} providers",
        cycle_id=cycle_id,
        meta={"providers_count": providers_count, **kwargs}
    )


def log_cycle_complete(cycle_id: str, duration_ms: float, events_emitted: int, 
                      providers_processed: int, **kwargs):
    """Log streaming cycle completion"""
    streaming_logger.info(
        StreamingCategory.STREAMING,
        StreamingAction.CYCLE_COMPLETE, 
        f"Cycle {cycle_id} complete",
        cycle_id=cycle_id,
        duration_ms=duration_ms,
        meta={
            "events_emitted": events_emitted,
            "providers_processed": providers_processed,
            **kwargs
        }
    )


def log_recompute(prop_id: str, duration_ms: float, status: StreamingStatus, **kwargs):
    """Log valuation recompute"""
    streaming_logger.log_streaming_event(
        StreamingCategory.VALUATION,
        StreamingAction.RECOMPUTE,
        status,
        f"Valuation recompute for prop {prop_id}",
        prop_id=prop_id,
        duration_ms=duration_ms,
        **kwargs
    )


def log_provider_request(provider_id: str, success: bool, latency_ms: float, **kwargs):
    """Log provider request"""
    status = StreamingStatus.SUCCESS if success else StreamingStatus.FAILED
    streaming_logger.log_streaming_event(
        StreamingCategory.PROVIDER,
        StreamingAction.PROVIDER_REQUEST,
        status,
        f"Provider {provider_id} request completed",
        provider_id=provider_id,
        duration_ms=latency_ms,
        **kwargs
    )


def log_debounce_skip(prop_id: str, reason: str, **kwargs):
    """Log recompute debounce skip"""
    streaming_logger.debug(
        StreamingCategory.VALUATION,
        StreamingAction.DEBOUNCE_SKIP,
        f"Recompute debounced for prop {prop_id}: {reason}",
        prop_id=prop_id,
        meta={"reason": reason, **kwargs}
    )


def log_batch_flush(batch_id: str, events_count: int, **kwargs):
    """Log micro-batch flush"""
    streaming_logger.info(
        StreamingCategory.STREAMING,
        StreamingAction.BATCH_FLUSH,
        f"Batch {batch_id} flushed with {events_count} events",
        run_id=batch_id,
        meta={"events_count": events_count, **kwargs}
    )


def log_handler_failure(event_type: str, subscriber_id: str, error_msg: str, **kwargs):
    """Log event handler failure"""
    streaming_logger.error(
        StreamingCategory.BUS,
        StreamingAction.HANDLER_FAILURE,
        f"Handler {subscriber_id} failed for {event_type}: {error_msg}",
        event_id=event_type,
        meta={"subscriber_id": subscriber_id, "error": error_msg, **kwargs}
    )


def log_circuit_transition(provider_id: str, old_state: str, new_state: str, **kwargs):
    """Log circuit breaker state transition"""
    streaming_logger.warning(
        StreamingCategory.CIRCUIT_BREAKER,
        StreamingAction.CIRCUIT_TRANSITION,
        f"Provider {provider_id} circuit: {old_state} → {new_state}",
        provider_id=provider_id,
        meta={"old_state": old_state, "new_state": new_state, **kwargs}
    )