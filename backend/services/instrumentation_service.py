"""
Instrumentation Service for Enhanced Observability

Provides lightweight tracing spans around key operations:
- EV enrichment
- Arbitrage detection  
- Odds aggregation normalization
- Line movement snapshots

Includes structured error hashing and observability snapshot endpoints.
"""

import asyncio
import hashlib
import json
import logging
import time
import traceback
import uuid
from collections import defaultdict, deque
from contextlib import asynccontextmanager
from dataclasses import dataclass, field
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional, AsyncGenerator, Union
from threading import Lock

import numpy as np

logger = logging.getLogger("a1betting.instrumentation")


@dataclass
class TraceSpan:
    """Lightweight trace span for operation tracking"""
    span_id: str
    operation: str
    start_time: float
    end_time: Optional[float] = None
    duration_ms: Optional[float] = None
    success: bool = True
    error: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    tags: Dict[str, str] = field(default_factory=dict)


@dataclass
class ErrorHash:
    """Structured error hash for grouping similar errors"""
    hash_key: str
    error_type: str
    error_message: str
    stack_trace_hash: str
    first_seen: datetime
    last_seen: datetime
    count: int = 1
    representative_stack: str = ""


@dataclass
class OperationMetrics:
    """Metrics for a specific operation type"""
    operation_name: str
    total_calls: int = 0
    successful_calls: int = 0
    failed_calls: int = 0
    total_duration_ms: float = 0.0
    min_duration_ms: float = float('inf')
    max_duration_ms: float = 0.0
    avg_duration_ms: float = 0.0
    p95_duration_ms: float = 0.0
    p99_duration_ms: float = 0.0
    recent_durations: deque = field(default_factory=lambda: deque(maxlen=1000))
    error_rate: float = 0.0


class InstrumentationService:
    """Comprehensive instrumentation service with lightweight tracing"""
    
    def __init__(self, max_spans: int = 10000, max_errors: int = 1000):
        self.max_spans = max_spans
        self.max_errors = max_errors
        
        # Thread-safe storage
        self._lock = Lock()
        
        # Active spans storage
        self.active_spans: Dict[str, TraceSpan] = {}
        self.completed_spans: deque = deque(maxlen=max_spans)
        
        # Operation metrics
        self.operation_metrics: Dict[str, OperationMetrics] = defaultdict(lambda: OperationMetrics(operation_name=""))
        
        # Error tracking with hashing
        self.error_hashes: Dict[str, ErrorHash] = {}
        self.recent_errors: deque = deque(maxlen=max_errors)
        
        # Feature flags and configuration
        self.active_flags: Dict[str, Any] = {
            "tracing_enabled": True,
            "error_hashing_enabled": True,
            "metrics_collection_enabled": True,
            "span_sampling_rate": 1.0,  # Sample 100% by default
            "max_span_duration_warn_ms": 5000,  # Warn for spans >5s
        }
        
        # Timing aggregates for snapshot
        self.timing_aggregates = {
            "ev_ms_avg": 0.0,
            "arbitrage_ms_avg": 0.0,
            "odds_norm_ms_avg": 0.0,
            "line_movement_ms_avg": 0.0,
        }
        
        logger.info("InstrumentationService initialized with lightweight tracing")

    @asynccontextmanager
    async def trace_operation(
        self, 
        operation: str, 
        tags: Optional[Dict[str, str]] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> AsyncGenerator[TraceSpan, None]:
        """
        Async context manager for tracing operations with automatic timing
        
        Args:
            operation: Operation name for tracing
            tags: Optional tags for the span
            metadata: Optional metadata for the span
            
        Yields:
            TraceSpan: The active span for additional instrumentation
        """
        if not self.active_flags.get("tracing_enabled", True):
            # Return a dummy span if tracing is disabled
            dummy_span = TraceSpan(
                span_id="disabled",
                operation=operation,
                start_time=time.time()
            )
            yield dummy_span
            return
            
        # Sample spans based on sampling rate
        if np.random.random() > self.active_flags.get("span_sampling_rate", 1.0):
            dummy_span = TraceSpan(
                span_id="sampled_out",
                operation=operation,
                start_time=time.time()
            )
            yield dummy_span
            return
        
        span_id = str(uuid.uuid4())
        start_time = time.time()
        
        span = TraceSpan(
            span_id=span_id,
            operation=operation,
            start_time=start_time,
            tags=tags or {},
            metadata=metadata or {}
        )
        
        # Store active span
        with self._lock:
            self.active_spans[span_id] = span
        
        try:
            logger.debug(f"Starting span: {operation} [{span_id}]")
            yield span
            
            # Mark as successful
            span.success = True
            
        except Exception as e:
            # Mark as failed and capture error
            span.success = False
            span.error = str(e)
            
            # Hash and track the error
            if self.active_flags.get("error_hashing_enabled", True):
                await self._hash_and_track_error(e, operation, span_id)
            
            logger.error(f"Span failed: {operation} [{span_id}] - {e}")
            raise
            
        finally:
            # Complete the span
            end_time = time.time()
            duration_ms = (end_time - start_time) * 1000
            
            span.end_time = end_time
            span.duration_ms = duration_ms
            
            # Update operation metrics
            await self._update_operation_metrics(operation, duration_ms, span.success)
            
            # Update timing aggregates for snapshot endpoint
            self._update_timing_aggregates(operation, duration_ms)
            
            # Move to completed spans
            with self._lock:
                self.active_spans.pop(span_id, None)
                self.completed_spans.append(span)
            
            # Warn about long-running operations
            warn_threshold = self.active_flags.get("max_span_duration_warn_ms", 5000)
            if duration_ms > warn_threshold:
                logger.warning(f"Long-running operation: {operation} took {duration_ms:.2f}ms")
            
            logger.debug(f"Completed span: {operation} [{span_id}] in {duration_ms:.2f}ms")

    async def trace_ev_enrichment(
        self, 
        player_id: str, 
        market_type: str,
        enrichment_func,
        *args,
        **kwargs
    ) -> Any:
        """
        Trace EV enrichment operations
        
        Args:
            player_id: Player identifier
            market_type: Type of market being enriched
            enrichment_func: Function to call for enrichment
            *args, **kwargs: Arguments to pass to enrichment function
            
        Returns:
            Result of enrichment function
        """
        tags = {
            "operation_type": "ev_enrichment",
            "player_id": str(player_id),
            "market_type": market_type
        }
        
        metadata = {
            "function_name": enrichment_func.__name__ if hasattr(enrichment_func, '__name__') else str(enrichment_func),
            "args_count": len(args),
            "kwargs_keys": list(kwargs.keys())
        }
        
        async with self.trace_operation("ev_enrichment", tags=tags, metadata=metadata) as span:
            # Add additional context to span
            span.metadata.update({
                "start_timestamp": datetime.now(timezone.utc).isoformat(),
                "enrichment_type": "expected_value"
            })
            
            # Call the enrichment function
            if asyncio.iscoroutinefunction(enrichment_func):
                result = await enrichment_func(*args, **kwargs)
            else:
                result = enrichment_func(*args, **kwargs)
            
            # Add result metadata
            span.metadata.update({
                "result_type": type(result).__name__,
                "has_result": result is not None
            })
            
            if isinstance(result, dict) and "ev_percentage" in result:
                span.metadata["ev_percentage"] = result["ev_percentage"]
            
            return result

    async def trace_arbitrage_detection(
        self,
        odds_data: List[Dict[str, Any]],
        detection_func,
        *args,
        **kwargs
    ) -> Any:
        """
        Trace arbitrage detection operations
        
        Args:
            odds_data: Odds data being analyzed
            detection_func: Function to call for arbitrage detection
            *args, **kwargs: Additional arguments
            
        Returns:
            Result of arbitrage detection
        """
        tags = {
            "operation_type": "arbitrage_detection",
            "odds_count": str(len(odds_data)),
            "books_count": str(len(set(item.get("sportsbook", "") for item in odds_data)))
        }
        
        metadata = {
            "function_name": detection_func.__name__ if hasattr(detection_func, '__name__') else str(detection_func),
            "input_data_size": len(odds_data),
            "unique_events": len(set(item.get("event_id", "") for item in odds_data))
        }
        
        async with self.trace_operation("arbitrage_detection", tags=tags, metadata=metadata) as span:
            # Add market analysis context
            span.metadata.update({
                "detection_start": datetime.now(timezone.utc).isoformat(),
                "market_types": list(set(item.get("market_type", "") for item in odds_data))
            })
            
            # Call detection function
            if asyncio.iscoroutinefunction(detection_func):
                result = await detection_func(odds_data, *args, **kwargs)
            else:
                result = detection_func(odds_data, *args, **kwargs)
            
            # Analyze results
            opportunities_found = 0
            if isinstance(result, list):
                opportunities_found = len(result)
            elif isinstance(result, dict) and "arbitrage_opportunities" in result:
                opportunities_found = len(result["arbitrage_opportunities"])
            
            span.metadata.update({
                "opportunities_found": opportunities_found,
                "has_arbitrage": opportunities_found > 0,
                "result_type": type(result).__name__
            })
            
            return result

    async def trace_odds_normalization(
        self,
        raw_odds: List[Dict[str, Any]],
        normalization_func,
        *args,
        **kwargs
    ) -> Any:
        """
        Trace odds aggregation normalization operations
        
        Args:
            raw_odds: Raw odds data to normalize
            normalization_func: Function to call for normalization
            *args, **kwargs: Additional arguments
            
        Returns:
            Normalized odds result
        """
        tags = {
            "operation_type": "odds_normalization",
            "raw_odds_count": str(len(raw_odds)),
            "sources_count": str(len(set(item.get("source", "") for item in raw_odds)))
        }
        
        metadata = {
            "function_name": normalization_func.__name__ if hasattr(normalization_func, '__name__') else str(normalization_func),
            "input_size": len(raw_odds),
            "normalization_type": "aggregation"
        }
        
        async with self.trace_operation("odds_normalization", tags=tags, metadata=metadata) as span:
            # Track normalization context
            span.metadata.update({
                "normalization_start": datetime.now(timezone.utc).isoformat(),
                "odds_formats": list(set(item.get("format", "decimal") for item in raw_odds))
            })
            
            # Call normalization function
            if asyncio.iscoroutinefunction(normalization_func):
                result = await normalization_func(raw_odds, *args, **kwargs)
            else:
                result = normalization_func(raw_odds, *args, **kwargs)
            
            # Analyze normalization results
            normalized_count = 0
            if isinstance(result, list):
                normalized_count = len(result)
            elif isinstance(result, dict) and "normalized_odds" in result:
                normalized_count = len(result["normalized_odds"])
            
            span.metadata.update({
                "normalized_count": normalized_count,
                "normalization_ratio": normalized_count / len(raw_odds) if raw_odds else 0,
                "result_type": type(result).__name__
            })
            
            return result

    async def trace_line_movement_snapshot(
        self,
        sport: str,
        player: str,
        market: str,
        snapshot_func,
        *args,
        **kwargs
    ) -> Any:
        """
        Trace line movement snapshot operations
        
        Args:
            sport: Sport identifier
            player: Player name
            market: Market type
            snapshot_func: Function to call for snapshot
            *args, **kwargs: Additional arguments
            
        Returns:
            Snapshot result
        """
        tags = {
            "operation_type": "line_movement_snapshot",
            "sport": sport,
            "market": market,
            "player": player[:20]  # Truncate long player names
        }
        
        metadata = {
            "function_name": snapshot_func.__name__ if hasattr(snapshot_func, '__name__') else str(snapshot_func),
            "snapshot_type": "line_movement",
            "market_context": f"{sport}_{market}"
        }
        
        async with self.trace_operation("line_movement_snapshot", tags=tags, metadata=metadata) as span:
            # Add movement tracking context
            span.metadata.update({
                "snapshot_timestamp": datetime.now(timezone.utc).isoformat(),
                "tracking_context": f"{sport}/{player}/{market}"
            })
            
            # Call snapshot function
            if asyncio.iscoroutinefunction(snapshot_func):
                result = await snapshot_func(*args, **kwargs)
            else:
                result = snapshot_func(*args, **kwargs)
            
            # Analyze movement data
            movement_detected = False
            if isinstance(result, dict):
                movement_detected = result.get("movement_detected", False) or result.get("magnitude", 0) > 0
            
            span.metadata.update({
                "movement_detected": movement_detected,
                "snapshot_success": result is not None,
                "result_type": type(result).__name__
            })
            
            return result

    async def _hash_and_track_error(self, error: Exception, operation: str, span_id: str) -> str:
        """
        Hash and track structured errors for grouping similar stack traces
        
        Args:
            error: Exception that occurred
            operation: Operation where error occurred
            span_id: Span ID for context
            
        Returns:
            Error hash key
        """
        try:
            # Get full stack trace
            stack_trace = traceback.format_exc()
            
            # Create normalized stack trace (remove line numbers, addresses)
            normalized_stack = self._normalize_stack_trace(stack_trace)
            
            # Hash the normalized stack trace
            stack_hash = hashlib.md5(normalized_stack.encode()).hexdigest()[:16]
            
            # Create composite hash including error type and message
            error_type = type(error).__name__
            error_message = str(error)
            
            composite_key = f"{error_type}_{stack_hash}"
            
            now = datetime.now(timezone.utc)
            
            with self._lock:
                if composite_key in self.error_hashes:
                    # Update existing error hash
                    error_hash = self.error_hashes[composite_key]
                    error_hash.count += 1
                    error_hash.last_seen = now
                else:
                    # Create new error hash
                    error_hash = ErrorHash(
                        hash_key=composite_key,
                        error_type=error_type,
                        error_message=error_message,
                        stack_trace_hash=stack_hash,
                        first_seen=now,
                        last_seen=now,
                        representative_stack=stack_trace[:1000]  # Truncate for storage
                    )
                    self.error_hashes[composite_key] = error_hash
                
                # Add to recent errors
                self.recent_errors.append({
                    "error_hash": composite_key,
                    "operation": operation,
                    "span_id": span_id,
                    "timestamp": now.isoformat(),
                    "error_type": error_type,
                    "error_message": error_message
                })
            
            logger.debug(f"Error hashed: {composite_key} for operation {operation}")
            return composite_key
            
        except Exception as e:
            logger.error(f"Error hashing failed: {e}")
            return "hash_failed"

    def _normalize_stack_trace(self, stack_trace: str) -> str:
        """
        Normalize stack trace by removing line numbers and memory addresses
        
        Args:
            stack_trace: Raw stack trace string
            
        Returns:
            Normalized stack trace for consistent hashing
        """
        import re
        
        # Remove line numbers (e.g., "line 123" -> "line XXX")
        normalized = re.sub(r'line \d+', 'line XXX', stack_trace)
        
        # Remove memory addresses (e.g., "0x7f8b8c123456" -> "0xXXXXXXXX")
        normalized = re.sub(r'0x[0-9a-fA-F]+', '0xXXXXXXXX', normalized)
        
        # Remove file paths, keep only filename
        normalized = re.sub(r'File ".*[/\\]([^/\\]+\.py)"', r'File "\1"', normalized)
        
        # Remove timestamp variations
        normalized = re.sub(r'\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}', 'YYYY-MM-DD HH:MM:SS', normalized)
        
        return normalized

    async def _update_operation_metrics(self, operation: str, duration_ms: float, success: bool) -> None:
        """
        Update operation metrics with new timing data
        
        Args:
            operation: Operation name
            duration_ms: Duration in milliseconds
            success: Whether operation succeeded
        """
        with self._lock:
            metrics = self.operation_metrics[operation]
            if not hasattr(metrics, 'operation_name') or not metrics.operation_name:
                metrics.operation_name = operation
            
            metrics.total_calls += 1
            if success:
                metrics.successful_calls += 1
            else:
                metrics.failed_calls += 1
            
            metrics.total_duration_ms += duration_ms
            metrics.min_duration_ms = min(metrics.min_duration_ms, duration_ms)
            metrics.max_duration_ms = max(metrics.max_duration_ms, duration_ms)
            metrics.avg_duration_ms = metrics.total_duration_ms / metrics.total_calls
            
            # Update recent durations for percentile calculations
            metrics.recent_durations.append(duration_ms)
            
            # Calculate percentiles if we have enough data
            if len(metrics.recent_durations) >= 10:
                durations_array = np.array(list(metrics.recent_durations))
                metrics.p95_duration_ms = float(np.percentile(durations_array, 95))
                metrics.p99_duration_ms = float(np.percentile(durations_array, 99))
            
            # Calculate error rate
            metrics.error_rate = metrics.failed_calls / metrics.total_calls if metrics.total_calls > 0 else 0.0

    def _update_timing_aggregates(self, operation: str, duration_ms: float) -> None:
        """
        Update timing aggregates for the observability snapshot
        
        Args:
            operation: Operation name
            duration_ms: Duration in milliseconds
        """
        # Map operation names to timing aggregate keys
        timing_map = {
            "ev_enrichment": "ev_ms_avg",
            "arbitrage_detection": "arbitrage_ms_avg", 
            "odds_normalization": "odds_norm_ms_avg",
            "line_movement_snapshot": "line_movement_ms_avg"
        }
        
        if operation in timing_map:
            key = timing_map[operation]
            # Simple exponential moving average
            alpha = 0.1  # Smoothing factor
            self.timing_aggregates[key] = (
                alpha * duration_ms + (1 - alpha) * self.timing_aggregates[key]
            )

    async def get_observability_snapshot(self) -> Dict[str, Any]:
        """
        Generate observability snapshot with timings, errors, and flags
        
        Returns:
            Dict containing comprehensive observability data
        """
        with self._lock:
            # Recent errors (last 50)
            recent_errors_list = list(self.recent_errors)[-50:]
            
            # Error summaries by hash
            error_summaries = []
            for hash_key, error_hash in self.error_hashes.items():
                error_summaries.append({
                    "hash": hash_key,
                    "error_type": error_hash.error_type,
                    "count": error_hash.count,
                    "first_seen": error_hash.first_seen.isoformat(),
                    "last_seen": error_hash.last_seen.isoformat(),
                    "message_preview": error_hash.error_message[:100]
                })
            
            # Operation metrics summary
            operation_summaries = {}
            for op_name, metrics in self.operation_metrics.items():
                operation_summaries[op_name] = {
                    "total_calls": metrics.total_calls,
                    "success_rate": (metrics.successful_calls / metrics.total_calls) if metrics.total_calls > 0 else 0.0,
                    "avg_duration_ms": round(metrics.avg_duration_ms, 2),
                    "p95_duration_ms": round(metrics.p95_duration_ms, 2),
                    "error_rate": round(metrics.error_rate, 4)
                }
        
        return {
            "timings": {
                "ev_ms_avg": round(self.timing_aggregates["ev_ms_avg"], 2),
                "arbitrage_ms_avg": round(self.timing_aggregates["arbitrage_ms_avg"], 2),
                "odds_norm_ms_avg": round(self.timing_aggregates["odds_norm_ms_avg"], 2),
                "line_movement_ms_avg": round(self.timing_aggregates["line_movement_ms_avg"], 2)
            },
            "recentErrors": recent_errors_list,
            "activeFlags": self.active_flags.copy(),
            "errorSummaries": error_summaries,
            "operationMetrics": operation_summaries,
            "activeSpans": len(self.active_spans),
            "completedSpans": len(self.completed_spans),
            "snapshotTimestamp": datetime.now(timezone.utc).isoformat(),
            "instrumentationHealth": {
                "status": "healthy",
                "tracingEnabled": self.active_flags.get("tracing_enabled", True),
                "errorHashingEnabled": self.active_flags.get("error_hashing_enabled", True),
                "metricsCollectionEnabled": self.active_flags.get("metrics_collection_enabled", True),
                "maxSpansReached": len(self.completed_spans) >= self.max_spans,
                "maxErrorsReached": len(self.recent_errors) >= self.max_errors
            }
        }

    async def get_health_status(self) -> Dict[str, Any]:
        """Get service health status"""
        return {
            "status": "healthy",
            "active_spans": len(self.active_spans),
            "completed_spans": len(self.completed_spans),
            "tracked_operations": len(self.operation_metrics),
            "error_hashes": len(self.error_hashes),
            "recent_errors": len(self.recent_errors),
            "flags": self.active_flags,
            "last_health_check": datetime.now(timezone.utc).isoformat()
        }

    def update_flag(self, flag_name: str, value: Any) -> bool:
        """
        Update a feature flag value
        
        Args:
            flag_name: Name of the flag to update
            value: New value for the flag
            
        Returns:
            True if flag was updated successfully
        """
        if flag_name in self.active_flags:
            old_value = self.active_flags[flag_name]
            self.active_flags[flag_name] = value
            logger.info(f"Flag updated: {flag_name} {old_value} -> {value}")
            return True
        return False

    def clear_metrics(self) -> None:
        """Clear all metrics and spans (useful for testing)"""
        with self._lock:
            self.active_spans.clear()
            self.completed_spans.clear()
            self.operation_metrics.clear()
            self.error_hashes.clear()
            self.recent_errors.clear()
            
            # Reset timing aggregates
            for key in self.timing_aggregates:
                self.timing_aggregates[key] = 0.0
        
        logger.info("All instrumentation metrics cleared")


# Global singleton instance
instrumentation_service = InstrumentationService()


# Convenience functions for easy integration
async def trace_ev_enrichment(player_id: str, market_type: str, func, *args, **kwargs):
    """Convenience function for tracing EV enrichment"""
    return await instrumentation_service.trace_ev_enrichment(
        player_id, market_type, func, *args, **kwargs
    )


async def trace_arbitrage_detection(odds_data: List[Dict[str, Any]], func, *args, **kwargs):
    """Convenience function for tracing arbitrage detection"""
    return await instrumentation_service.trace_arbitrage_detection(
        odds_data, func, *args, **kwargs
    )


async def trace_odds_normalization(raw_odds: List[Dict[str, Any]], func, *args, **kwargs):
    """Convenience function for tracing odds normalization"""
    return await instrumentation_service.trace_odds_normalization(
        raw_odds, func, *args, **kwargs
    )


async def trace_line_movement_snapshot(sport: str, player: str, market: str, func, *args, **kwargs):
    """Convenience function for tracing line movement snapshots"""
    return await instrumentation_service.trace_line_movement_snapshot(
        sport, player, market, func, *args, **kwargs
    )


# Decorator for automatic tracing
def instrument_operation(operation_name: str, tags: Optional[Dict[str, str]] = None):
    """
    Decorator for automatic operation tracing
    
    Args:
        operation_name: Name of the operation being traced
        tags: Optional tags to add to the span
    """
    def decorator(func):
        async def async_wrapper(*args, **kwargs):
            async with instrumentation_service.trace_operation(operation_name, tags=tags):
                return await func(*args, **kwargs)
        
        def sync_wrapper(*args, **kwargs):
            import asyncio
            
            async def run_traced():
                async with instrumentation_service.trace_operation(operation_name, tags=tags):
                    return func(*args, **kwargs)
            
            return asyncio.run(run_traced())
        
        return async_wrapper if asyncio.iscoroutinefunction(func) else sync_wrapper
    
    return decorator


# Export main components
__all__ = [
    "InstrumentationService",
    "TraceSpan", 
    "ErrorHash",
    "OperationMetrics",
    "instrumentation_service",
    "trace_ev_enrichment",
    "trace_arbitrage_detection", 
    "trace_odds_normalization",
    "trace_line_movement_snapshot",
    "instrument_operation"
]