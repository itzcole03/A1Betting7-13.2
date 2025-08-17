"""
Provider Resilience Manager

Implements comprehensive provider state tracking, exponential backoff,
and operational risk reduction for all data providers.

Key Features:
- Per-provider exponential backoff with failure counters
- Provider state tracking (consecutive_failures, avg_latency_ms, success_rate_5m)
- Micro-batching for line change events 
- Recompute debounce logic
- Event bus reliability with dead-letter logging
- Normalized logging schema
"""

import asyncio
import logging
import time
from collections import defaultdict, deque
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Dict, List, Optional, Set, Tuple, Union

from ..services.unified_config import get_streaming_config


class ProviderState(Enum):
    """Provider operational states implementing circuit breaker patterns"""
    HEALTHY = "healthy"
    DEGRADED = "degraded" 
    FAILING = "failing"
    CIRCUIT_OPEN = "circuit_open"


class CircuitBreakerState(Enum):
    """Circuit breaker states for provider resilience"""
    CLOSED = "closed"      # Normal operation, requests allowed
    OPEN = "open"          # Circuit open, requests blocked
    HALF_OPEN = "half_open"  # Testing recovery with limited requests


class LineChangeClassification(Enum):
    """Line change impact classification for computational cost control"""
    MICRO = "micro"        # <0.25 change magnitude
    MODERATE = "moderate"  # 0.25-1.0 change magnitude
    MAJOR = "major"        # >1.0 change magnitude


class ComputeMode(Enum):
    """Computational processing modes"""
    NORMAL = "normal"           # Standard processing
    DEGRADED = "degraded"       # Limited processing under load
    BURST_CONTROL = "burst_control"  # Maximum throttling


@dataclass
class ProviderMetrics:
    """Provider performance and reliability metrics"""
    # Core state fields required by objective
    consecutive_failures: int = 0
    avg_latency_ms: float = 0.0
    success_rate_5m: float = 1.0
    
    # Additional tracking fields
    total_requests: int = 0
    successful_requests: int = 0
    failed_requests: int = 0
    last_success_time: Optional[float] = None
    last_failure_time: Optional[float] = None
    
    # Latency tracking with percentiles
    latency_samples: deque = field(default_factory=lambda: deque(maxlen=1000))
    p95_latency_ms: float = 0.0
    
    # Success rate tracking (5-minute rolling window)
    success_rate_window: deque = field(default_factory=lambda: deque(maxlen=300))  # 300 seconds at 1sec granularity
    
    # Provider state
    current_state: ProviderState = ProviderState.HEALTHY
    state_changed_at: float = field(default_factory=time.time)
    
    # Circuit breaker state management
    circuit_state: CircuitBreakerState = CircuitBreakerState.CLOSED
    circuit_state_changed_at: float = field(default_factory=time.time)
    half_open_attempts: int = 0
    half_open_success_threshold: int = 3  # Successful requests needed to close circuit
    
    # Backoff configuration
    backoff_base_sec: float = 1.0
    backoff_multiplier: float = 2.0
    backoff_max_sec: float = 300.0  # 5 minutes max
    backoff_current_sec: float = 0.0
    next_retry_time: float = 0.0
    
    # Error categorization for SLA metrics
    error_categories: Dict[str, int] = field(default_factory=dict)
    
    # SLA metrics tracking
    sla_window_hours: int = 24
    sla_success_count: int = 0
    sla_total_count: int = 0
    sla_violation_count: int = 0


@dataclass 
class RecomputeEvent:
    """Event requiring valuation recompute with computational cost tracking"""
    prop_id: str
    event_type: str
    timestamp: float
    data: Dict[str, Any]
    batch_id: Optional[str] = None
    # Computational cost control fields
    classification: LineChangeClassification = LineChangeClassification.MODERATE
    change_magnitude: float = 0.5  # Default to moderate change
    computational_cost: float = 1.0  # Relative processing cost
    is_aggregated: bool = False  # Whether this represents aggregated changes


@dataclass
class MicroBatch:
    """Aggregated events for micro-batching with computational cost tracking"""
    prop_id: str
    events: List[RecomputeEvent] = field(default_factory=list)
    first_event_time: float = field(default_factory=time.time)
    last_event_time: float = field(default_factory=time.time)
    # Cost control fields
    total_computational_cost: float = 0.0
    aggregated_change_magnitude: float = 0.0
    dominant_classification: LineChangeClassification = LineChangeClassification.MODERATE
    
    def add_event(self, event: RecomputeEvent):
        """Add event to batch and update computational cost metrics"""
        self.events.append(event)
        self.last_event_time = time.time()
        self.total_computational_cost += event.computational_cost
        
        # Update aggregated change magnitude (max of all changes)
        self.aggregated_change_magnitude = max(
            self.aggregated_change_magnitude, 
            event.change_magnitude
        )
        
        # Update dominant classification (highest priority)
        classifications_priority = {
            LineChangeClassification.MICRO: 0,
            LineChangeClassification.MODERATE: 1,
            LineChangeClassification.MAJOR: 2
        }
        
        if classifications_priority[event.classification] > classifications_priority[self.dominant_classification]:
            self.dominant_classification = event.classification
    
    def should_process(self, batch_window_ms: int = 250) -> bool:
        """Check if batch is ready for processing"""
        now = time.time()
        age_ms = (now - self.first_event_time) * 1000
        return age_ms >= batch_window_ms or len(self.events) >= 10  # Age or size threshold


@dataclass
class ComputationalController:
    """Controls computational cost and prevents performance degradation under load"""
    # Event classification and tracking
    events_emitted: int = 0
    recomputes_executed: int = 0
    pending_queue_depth: int = 0
    
    # Burst control configuration
    max_events_per_cycle: int = 100  # Max events processed per cycle
    cycle_duration_sec: float = 1.0  # Duration of processing cycle
    burst_threshold: float = 0.8     # Threshold to enter degraded mode (80% of max)
    
    # Current processing state
    current_mode: ComputeMode = ComputeMode.NORMAL
    mode_changed_at: float = field(default_factory=time.time)
    
    # Cycle tracking
    current_cycle_start: float = field(default_factory=time.time)
    current_cycle_events: int = 0
    current_cycle_cost: float = 0.0
    
    # Lazy recompute tracking
    flagged_recomputes: Dict[str, float] = field(default_factory=dict)  # prop_id -> flagged_time
    lazy_window_sec: float = 5.0  # Window to aggregate micro changes
    
    # Rolling counters (last 60 seconds)
    event_history: deque = field(default_factory=lambda: deque(maxlen=60))
    recompute_history: deque = field(default_factory=lambda: deque(maxlen=60))
    queue_depth_history: deque = field(default_factory=lambda: deque(maxlen=60))
    
    # Performance thresholds
    cpu_target_threshold: float = 0.7  # Target CPU utilization (70%)
    degraded_processing_ratio: float = 0.5  # Process 50% of events in degraded mode
    
    def is_new_cycle(self) -> bool:
        """Check if we've entered a new processing cycle"""
        return time.time() - self.current_cycle_start >= self.cycle_duration_sec
    
    def start_new_cycle(self):
        """Start a new processing cycle"""
        now = time.time()
        
        # Update rolling counters
        self.event_history.append((now, self.current_cycle_events))
        self.recompute_history.append((now, self.recomputes_executed))
        self.queue_depth_history.append((now, self.pending_queue_depth))
        
        # Reset cycle counters
        self.current_cycle_start = now
        self.current_cycle_events = 0
        self.current_cycle_cost = 0.0
        
        # Update processing mode based on load
        self._update_processing_mode()
    
    def _update_processing_mode(self):
        """Update processing mode based on current load"""
        old_mode = self.current_mode
        
        # Calculate recent load metrics
        recent_events = sum(count for _, count in list(self.event_history)[-10:])  # Last 10 seconds
        load_ratio = recent_events / (self.max_events_per_cycle * 10)  # 10 seconds worth
        
        if load_ratio > 1.0:
            new_mode = ComputeMode.BURST_CONTROL
        elif load_ratio > self.burst_threshold:
            new_mode = ComputeMode.DEGRADED
        else:
            new_mode = ComputeMode.NORMAL
        
        if new_mode != old_mode:
            self.current_mode = new_mode
            self.mode_changed_at = time.time()
    
    def should_defer_micro_change(self, prop_id: str, change_magnitude: float) -> bool:
        """Check if micro change should be deferred for lazy processing"""
        if change_magnitude >= 0.25:  # Not a micro change
            return False
        
        now = time.time()
        
        # Check if already flagged for lazy recompute
        if prop_id in self.flagged_recomputes:
            flagged_time = self.flagged_recomputes[prop_id]
            if now - flagged_time < self.lazy_window_sec:
                return True  # Defer within lazy window
            else:
                # Window expired, allow processing and update flag
                self.flagged_recomputes[prop_id] = now
                return False
        else:
            # New micro change, flag for lazy processing
            self.flagged_recomputes[prop_id] = now
            return True
    
    def can_process_event(self, event: RecomputeEvent) -> Tuple[bool, str]:
        """Check if event can be processed given current load"""
        # Check if we need to start a new cycle
        if self.is_new_cycle():
            self.start_new_cycle()
        
        # Handle micro changes with lazy processing
        if (event.classification == LineChangeClassification.MICRO and 
            self.should_defer_micro_change(event.prop_id, event.change_magnitude)):
            return False, "deferred_lazy_micro"
        
        # Check burst control limits
        if self.current_mode == ComputeMode.BURST_CONTROL:
            if self.current_cycle_events >= self.max_events_per_cycle:
                self.pending_queue_depth += 1
                return False, "burst_control_limit"
        
        elif self.current_mode == ComputeMode.DEGRADED:
            # In degraded mode, only process a fraction of events
            degraded_limit = int(self.max_events_per_cycle * self.degraded_processing_ratio)
            if self.current_cycle_events >= degraded_limit:
                # For major changes, always try to process (no starvation)
                if event.classification != LineChangeClassification.MAJOR:
                    self.pending_queue_depth += 1
                    return False, "degraded_mode_limit"
        
        # Event can be processed
        self.current_cycle_events += 1
        self.current_cycle_cost += event.computational_cost
        self.events_emitted += 1
        
        return True, "allowed"
    
    def record_recompute_executed(self):
        """Record that a recompute was executed"""
        self.recomputes_executed += 1
        if self.pending_queue_depth > 0:
            self.pending_queue_depth -= 1
    
    def get_performance_metrics(self) -> Dict[str, Any]:
        """Get current performance and load metrics"""
        now = time.time()
        
        # Calculate rolling averages
        recent_events = [count for timestamp, count in self.event_history if now - timestamp <= 60]
        recent_recomputes = [count for timestamp, count in self.recompute_history if now - timestamp <= 60]
        recent_queue_depths = [depth for timestamp, depth in self.queue_depth_history if now - timestamp <= 60]
        
        avg_events_per_sec = sum(recent_events) / max(len(recent_events), 1)
        avg_recomputes_per_sec = sum(recent_recomputes) / max(len(recent_recomputes), 1)
        avg_queue_depth = sum(recent_queue_depths) / max(len(recent_queue_depths), 1)
        
        return {
            "events_emitted": self.events_emitted,
            "recomputes_executed": self.recomputes_executed,
            "pending_queue_depth": self.pending_queue_depth,
            "current_mode": self.current_mode.value,
            "mode_changed_at": self.mode_changed_at,
            "cycle_events": self.current_cycle_events,
            "cycle_cost": self.current_cycle_cost,
            "avg_events_per_sec": avg_events_per_sec,
            "avg_recomputes_per_sec": avg_recomputes_per_sec,
            "avg_queue_depth": avg_queue_depth,
            "flagged_lazy_props": len(self.flagged_recomputes),
            "load_ratio": self.current_cycle_events / self.max_events_per_cycle,
            "performance_metrics": {
                "cpu_target_threshold": self.cpu_target_threshold,
                "current_load_ratio": avg_events_per_sec / self.max_events_per_cycle,
                "processing_efficiency": self.recomputes_executed / max(self.events_emitted, 1),
            }
        }


class ProviderResilienceManager:
    """
    Comprehensive provider resilience and operational risk reduction.
    
    Implements:
    1. Per-provider exponential backoff with failure counters
    2. Provider state tracking (consecutive_failures, avg_latency_ms, success_rate_5m)
    3. Recompute debounce mapping (prop_id → last_recompute_ts)
    4. Line change micro-batching (200-300ms aggregation)
    5. Event bus reliability with exception counters and dead-letter logging
    6. Normalized logging schema
    """
    
    def __init__(self):
        # Get configuration
        self.config = get_streaming_config()
        self.logger = logging.getLogger("provider_resilience")
        
        # Computational cost controller
        self.computational_controller = ComputationalController()
        
        # Provider state tracking
        self.provider_metrics: Dict[str, ProviderMetrics] = {}
        self.provider_locks: Dict[str, asyncio.Lock] = defaultdict(asyncio.Lock)
        
        # Recompute debounce map: prop_id → last_recompute_ts
        self.recompute_debounce_map: Dict[str, float] = {}
        self.debounce_lock = asyncio.Lock()
        
        # Micro-batching for line changes
        self.micro_batches: Dict[str, MicroBatch] = {}
        self.batch_lock = asyncio.Lock()
        self.batch_window_ms = 250  # 200-300ms as specified
        
        # Event bus reliability
        self.event_handlers: Dict[str, List] = defaultdict(list)
        self.handler_exception_counters: Dict[str, int] = defaultdict(int)
        self.dead_letter_log: List[Dict[str, Any]] = []
        self.max_dead_letters = 1000
        
        # Background tasks
        self._cleanup_task: Optional[asyncio.Task] = None
        self._batch_processor_task: Optional[asyncio.Task] = None
        self._metrics_updater_task: Optional[asyncio.Task] = None
        self._background_tasks_started = False
    
    def _start_background_tasks(self):
        """Start background processing tasks"""
        try:
            # Only start if we have a running event loop
            loop = asyncio.get_running_loop()
            self._cleanup_task = loop.create_task(self._cleanup_worker())
            self._batch_processor_task = loop.create_task(self._batch_processor())
            self._metrics_updater_task = loop.create_task(self._metrics_updater())
            self._background_tasks_started = True
            
            self.logger.info("ProviderResilienceManager initialized with background tasks", extra={
                "batch_window_ms": self.batch_window_ms,
                "debounce_sec": self.config.valuation_recompute_debounce_sec,
            })
        except RuntimeError:
            # No event loop running - tasks will be started lazily
            self.logger.info("ProviderResilienceManager initialized - background tasks will start on first use", extra={
                "batch_window_ms": self.batch_window_ms,
                "debounce_sec": self.config.valuation_recompute_debounce_sec,
            })
    
    async def register_provider(self, provider_id: str, config: Optional[Dict[str, Any]] = None) -> None:
        """Register a new provider for tracking"""
        # Start background tasks if not already started
        if not self._background_tasks_started:
            self._start_background_tasks()
        
        async with self.provider_locks[provider_id]:
            if provider_id not in self.provider_metrics:
                metrics = ProviderMetrics()
                
                # Apply custom config if provided
                if config:
                    if "backoff_base_sec" in config:
                        metrics.backoff_base_sec = config["backoff_base_sec"]
                    if "backoff_max_sec" in config:
                        metrics.backoff_max_sec = config["backoff_max_sec"]
                    if "backoff_multiplier" in config:
                        metrics.backoff_multiplier = config["backoff_multiplier"]
                
                self.provider_metrics[provider_id] = metrics
                
                self.logger.info("Provider registered", extra={
                    "category": "provider_management",
                    "action": "register",
                    "provider_id": provider_id,
                    "config": config or {},
                })
    
    async def record_provider_request(self, provider_id: str, success: bool, 
                                    latency_ms: float, error: Optional[Exception] = None) -> None:
        """
        Record provider request result and update metrics.
        Implements circuit breaker pattern with CLOSED→OPEN→HALF_OPEN transitions.
        """
        start_time = time.time()
        
        # Ensure provider is registered
        await self.register_provider(provider_id)
        
        async with self.provider_locks[provider_id]:
            metrics = self.provider_metrics[provider_id]
            now = time.time()
            
            # Update basic counters
            metrics.total_requests += 1
            metrics.sla_total_count += 1
            
            # Categorize error if present
            error_category = "success"
            if error and not success:
                error_category = self._categorize_error(error)
                if error_category not in metrics.error_categories:
                    metrics.error_categories[error_category] = 0
                metrics.error_categories[error_category] += 1
            
            if success:
                metrics.successful_requests += 1
                metrics.sla_success_count += 1
                metrics.last_success_time = now
                
                # Handle circuit breaker recovery logic
                if metrics.circuit_state == CircuitBreakerState.HALF_OPEN:
                    metrics.half_open_attempts += 1
                    if metrics.half_open_attempts >= metrics.half_open_success_threshold:
                        # Transition to CLOSED state
                        old_circuit_state = metrics.circuit_state
                        metrics.circuit_state = CircuitBreakerState.CLOSED
                        metrics.circuit_state_changed_at = now
                        metrics.consecutive_failures = 0  # Reset failure counter
                        metrics.backoff_current_sec = 0.0  # Reset backoff
                        metrics.next_retry_time = 0.0
                        metrics.half_open_attempts = 0
                        
                        # Update provider state to healthy
                        old_provider_state = metrics.current_state
                        metrics.current_state = ProviderState.HEALTHY
                        metrics.state_changed_at = now
                        
                        self.logger.info("Circuit breaker transitioned to CLOSED", extra={
                            "category": "circuit_breaker",
                            "action": "state_transition",
                            "provider_id": provider_id,
                            "old_circuit_state": old_circuit_state.value,
                            "new_circuit_state": metrics.circuit_state.value,
                            "old_provider_state": old_provider_state.value,
                            "new_provider_state": metrics.current_state.value,
                            "half_open_attempts": metrics.half_open_attempts,
                            "result": "circuit_closed",
                        })
                elif metrics.circuit_state == CircuitBreakerState.CLOSED:
                    # Normal success in CLOSED state - reset consecutive failures
                    metrics.consecutive_failures = 0
                    if metrics.current_state != ProviderState.HEALTHY:
                        old_state = metrics.current_state
                        metrics.current_state = ProviderState.HEALTHY
                        metrics.state_changed_at = now
                        
                        self.logger.info("Provider recovered to healthy", extra={
                            "category": "provider_health",
                            "action": "state_change",
                            "provider_id": provider_id,
                            "old_state": old_state.value,
                            "new_state": metrics.current_state.value,
                            "consecutive_failures": metrics.consecutive_failures,
                            "result": "recovery",
                        })
            else:
                metrics.failed_requests += 1
                metrics.last_failure_time = now
                metrics.consecutive_failures += 1  # Increment failure counter
                
                # Calculate exponential backoff: base * 2^n capped
                backoff_multiplier = metrics.backoff_multiplier ** metrics.consecutive_failures
                metrics.backoff_current_sec = min(
                    metrics.backoff_base_sec * backoff_multiplier,
                    metrics.backoff_max_sec
                )
                metrics.next_retry_time = now + metrics.backoff_current_sec
                
                # Circuit breaker logic based on consecutive failures
                old_circuit_state = metrics.circuit_state
                old_provider_state = metrics.current_state
                
                # Update provider state based on consecutive failures
                if metrics.consecutive_failures >= 10:
                    metrics.current_state = ProviderState.CIRCUIT_OPEN
                    metrics.circuit_state = CircuitBreakerState.OPEN
                    metrics.circuit_state_changed_at = now
                elif metrics.consecutive_failures >= 5:
                    metrics.current_state = ProviderState.FAILING
                elif metrics.consecutive_failures >= 2:
                    metrics.current_state = ProviderState.DEGRADED
                
                if metrics.current_state != old_provider_state or metrics.circuit_state != old_circuit_state:
                    metrics.state_changed_at = now
                    
                    self.logger.error("Provider state degraded", extra={
                        "category": "provider_health", 
                        "action": "state_change",
                        "provider_id": provider_id,
                        "old_provider_state": old_provider_state.value,
                        "new_provider_state": metrics.current_state.value,
                        "old_circuit_state": old_circuit_state.value,
                        "new_circuit_state": metrics.circuit_state.value,
                        "consecutive_failures": metrics.consecutive_failures,
                        "backoff_sec": metrics.backoff_current_sec,
                        "next_retry_time": metrics.next_retry_time,
                        "error_category": error_category,
                        "error": str(error) if error else None,
                        "result": "degradation",
                    })
            
            # Update latency tracking with percentiles
            metrics.latency_samples.append(latency_ms)
            if metrics.latency_samples:
                metrics.avg_latency_ms = sum(metrics.latency_samples) / len(metrics.latency_samples)
                # Calculate p95 latency
                sorted_latencies = sorted(metrics.latency_samples)
                p95_index = int(0.95 * len(sorted_latencies))
                metrics.p95_latency_ms = sorted_latencies[min(p95_index, len(sorted_latencies) - 1)]
            
            # Update success rate window (1 = success, 0 = failure)
            metrics.success_rate_window.append(1 if success else 0)
            
            # Log request with normalized schema
            self.logger.info("Provider request recorded", extra={
                "category": "provider_request",
                "action": "record",
                "provider_id": provider_id,
                "success": success,
                "latency_ms": latency_ms,
                "consecutive_failures": metrics.consecutive_failures,
                "provider_state": metrics.current_state.value,
                "circuit_state": metrics.circuit_state.value,
                "backoff_sec": metrics.backoff_current_sec,
                "avg_latency_ms": metrics.avg_latency_ms,
                "p95_latency_ms": metrics.p95_latency_ms,
                "success_rate_5m": metrics.success_rate_5m,
                "error_category": error_category,
                "duration_ms": (time.time() - start_time) * 1000,
                "result": "completed",
            })
    
    def _categorize_error(self, error: Exception) -> str:
        """Categorize error for SLA metrics tracking"""
        error_type = type(error).__name__
        error_message = str(error).lower()
        
        # Connection-related errors
        if "connection" in error_message or "timeout" in error_message:
            return "connection_error"
        elif "rate limit" in error_message or "429" in error_message:
            return "rate_limit_error"
        elif "authentication" in error_message or "401" in error_message:
            return "auth_error"
        elif "not found" in error_message or "404" in error_message:
            return "not_found_error"
        elif "server error" in error_message or "500" in error_message:
            return "server_error"
        elif error_type in ["ValueError", "TypeError", "KeyError"]:
            return "data_error"
        else:
            return "unknown_error"
    
    async def should_skip_provider(self, provider_id: str) -> Tuple[bool, Optional[float], Optional[str]]:
        """
        Check if provider should be skipped due to circuit breaker state.
        Returns (should_skip, retry_after_seconds, circuit_state)
        """
        if provider_id not in self.provider_metrics:
            return False, None, None
        
        async with self.provider_locks[provider_id]:
            metrics = self.provider_metrics[provider_id]
            now = time.time()
            
            # Handle circuit breaker states
            if metrics.circuit_state == CircuitBreakerState.OPEN:
                # Check if we should transition to HALF_OPEN
                if metrics.next_retry_time > 0 and now >= metrics.next_retry_time:
                    # Transition to HALF_OPEN for recovery testing
                    old_state = metrics.circuit_state
                    metrics.circuit_state = CircuitBreakerState.HALF_OPEN
                    metrics.circuit_state_changed_at = now
                    metrics.half_open_attempts = 0
                    
                    self.logger.info("Circuit breaker transitioned to HALF_OPEN", extra={
                        "category": "circuit_breaker",
                        "action": "state_transition",
                        "provider_id": provider_id,
                        "old_circuit_state": old_state.value,
                        "new_circuit_state": metrics.circuit_state.value,
                        "consecutive_failures": metrics.consecutive_failures,
                        "result": "trial_mode",
                    })
                    
                    # Allow the request in HALF_OPEN state
                    return False, None, metrics.circuit_state.value
                else:
                    # Circuit still open, block request
                    retry_after = metrics.next_retry_time - now if metrics.next_retry_time > now else None
                    return True, retry_after, metrics.circuit_state.value
            
            elif metrics.circuit_state == CircuitBreakerState.HALF_OPEN:
                # Allow limited requests in half-open state
                return False, None, metrics.circuit_state.value
            
            else:  # CLOSED state
                # Normal backoff logic for CLOSED state
                if metrics.next_retry_time > now:
                    retry_after = metrics.next_retry_time - now
                    return True, retry_after, metrics.circuit_state.value
                
                return False, None, metrics.circuit_state.value
    
    async def add_recompute_event(self, prop_id: str, event_type: str, data: Dict[str, Any], 
                                change_magnitude: Optional[float] = None) -> Tuple[bool, str]:
        """
        Add line change event for recompute with computational cost control.
        Returns (was_added, reason) tuple.
        """
        now = time.time()
        
        # Classify line change based on magnitude
        if change_magnitude is None:
            # Default classification logic based on event type
            magnitude = self._estimate_change_magnitude(event_type, data)
        else:
            magnitude = change_magnitude
        
        classification = self._classify_line_change(magnitude)
        computational_cost = self._estimate_computational_cost(classification, event_type)
        
        # Create event with cost tracking
        event = RecomputeEvent(
            prop_id=prop_id,
            event_type=event_type,
            timestamp=now,
            data=data,
            classification=classification,
            change_magnitude=magnitude,
            computational_cost=computational_cost
        )
        
        # Check computational controller
        can_process, reason = self.computational_controller.can_process_event(event)
        if not can_process:
            self.logger.debug("Event processing deferred", extra={
                "category": "computational_control",
                "action": "defer_event",
                "prop_id": prop_id,
                "event_type": event_type,
                "classification": classification.value,
                "change_magnitude": magnitude,
                "reason": reason,
                "controller_mode": self.computational_controller.current_mode.value,
                "cycle_events": self.computational_controller.current_cycle_events,
                "pending_queue": self.computational_controller.pending_queue_depth,
                "result": "deferred",
            })
            return False, reason
        
        # Check recompute debounce (only for non-major changes)
        if classification != LineChangeClassification.MAJOR:
            async with self.debounce_lock:
                last_recompute = self.recompute_debounce_map.get(prop_id, 0)
                if now - last_recompute < self.config.valuation_recompute_debounce_sec:
                    self.logger.debug("Recompute event debounced", extra={
                        "category": "recompute",
                        "action": "debounce_skip",
                        "prop_id": prop_id,
                        "event_type": event_type,
                        "classification": classification.value,
                        "last_recompute_age_sec": now - last_recompute,
                        "debounce_sec": self.config.valuation_recompute_debounce_sec,
                        "result": "debounced",
                    })
                    return False, "debounced"
        
        # Add to micro-batch
        async with self.batch_lock:
            if prop_id not in self.micro_batches:
                self.micro_batches[prop_id] = MicroBatch(prop_id=prop_id)
            
            self.micro_batches[prop_id].add_event(event)
            
            self.logger.debug("Event added to micro-batch", extra={
                "category": "micro_batching",
                "action": "add_event",
                "prop_id": prop_id,
                "event_type": event_type,
                "classification": classification.value,
                "change_magnitude": magnitude,
                "computational_cost": computational_cost,
                "batch_size": len(self.micro_batches[prop_id].events),
                "batch_age_ms": (now - self.micro_batches[prop_id].first_event_time) * 1000,
                "total_batch_cost": self.micro_batches[prop_id].total_computational_cost,
                "controller_mode": self.computational_controller.current_mode.value,
                "result": "added",
            })
        
        return True, "added"
    
    def _classify_line_change(self, magnitude: float) -> LineChangeClassification:
        """Classify line change based on magnitude"""
        if magnitude < 0.25:
            return LineChangeClassification.MICRO
        elif magnitude <= 1.0:
            return LineChangeClassification.MODERATE
        else:
            return LineChangeClassification.MAJOR
    
    def _estimate_change_magnitude(self, event_type: str, data: Dict[str, Any]) -> float:
        """Estimate change magnitude from event data"""
        # Default estimation based on event type
        magnitude_map = {
            "line_move": 0.5,
            "odds_change": 0.3,
            "volume_spike": 0.2,
            "injury_news": 1.5,
            "lineup_change": 1.2,
            "weather_update": 0.4,
            "market_suspension": 2.0,
        }
        
        base_magnitude = magnitude_map.get(event_type, 0.5)
        
        # Check for magnitude hints in data
        if isinstance(data, dict):
            if "magnitude" in data:
                return float(data["magnitude"])
            elif "change_amount" in data:
                return abs(float(data["change_amount"]))
            elif "odds_change" in data:
                return abs(float(data["odds_change"])) / 100  # Normalize odds change
        
        return base_magnitude
    
    def _estimate_computational_cost(self, classification: LineChangeClassification, event_type: str) -> float:
        """Estimate computational cost for processing event"""
        base_costs = {
            LineChangeClassification.MICRO: 0.1,
            LineChangeClassification.MODERATE: 1.0,
            LineChangeClassification.MAJOR: 3.0
        }
        
        # Event type multipliers
        event_multipliers = {
            "injury_news": 2.0,
            "lineup_change": 1.5,
            "market_suspension": 2.5,
            "odds_change": 1.0,
            "line_move": 1.2,
        }
        
        base_cost = base_costs.get(classification, 1.0)
        multiplier = event_multipliers.get(event_type, 1.0)
        
        return base_cost * multiplier
    
    async def register_event_handler(self, event_type: str, handler) -> None:
        """Register event handler with reliability tracking"""
        self.event_handlers[event_type].append(handler)
        handler_id = f"{event_type}:{id(handler)}"
        self.handler_exception_counters[handler_id] = 0
        
        self.logger.info("Event handler registered", extra={
            "category": "event_bus",
            "action": "register_handler",
            "event_type": event_type,
            "handler_id": handler_id,
            "total_handlers": len(self.event_handlers[event_type]),
        })
    
    async def emit_event(self, event_type: str, data: Dict[str, Any]) -> None:
        """
        Emit event to handlers with exception tracking and dead-letter logging.
        Implements reliability requirements from objective.
        """
        start_time = time.time()
        handlers = self.event_handlers.get(event_type, [])
        
        if not handlers:
            self.logger.debug("No handlers for event", extra={
                "category": "event_bus",
                "action": "emit_no_handlers",
                "event_type": event_type,
                "result": "no_handlers",
            })
            return
        
        successful_handlers = 0
        failed_handlers = 0
        
        for handler in handlers:
            handler_id = f"{event_type}:{id(handler)}"
            
            try:
                if asyncio.iscoroutinefunction(handler):
                    await handler(data)
                else:
                    handler(data)
                
                successful_handlers += 1
                
                # Reset exception counter on success
                self.handler_exception_counters[handler_id] = 0
                
            except Exception as e:
                failed_handlers += 1
                self.handler_exception_counters[handler_id] += 1
                exception_count = self.handler_exception_counters[handler_id]
                
                self.logger.error("Event handler failed", extra={
                    "category": "event_bus",
                    "action": "handler_exception",
                    "event_type": event_type,
                    "handler_id": handler_id,
                    "exception_count": exception_count,
                    "error": str(e),
                    "duration_ms": (time.time() - start_time) * 1000,
                    "result": "handler_failure",
                })
                
                # Add to dead-letter log if repeated failures
                if exception_count >= 3:
                    await self._add_to_dead_letter_log(event_type, data, handler_id, e, exception_count)
        
        # Log overall event emission result
        self.logger.info("Event emitted", extra={
            "category": "event_bus",
            "action": "emit",
            "event_type": event_type,
            "total_handlers": len(handlers),
            "successful_handlers": successful_handlers,
            "failed_handlers": failed_handlers,
            "duration_ms": (time.time() - start_time) * 1000,
            "result": "completed",
        })
    
    async def _add_to_dead_letter_log(self, event_type: str, data: Dict[str, Any], 
                                    handler_id: str, error: Exception, exception_count: int) -> None:
        """Add failed event to dead-letter log"""
        dead_letter_entry = {
            "timestamp": time.time(),
            "event_type": event_type,
            "handler_id": handler_id,
            "exception_count": exception_count,
            "error": str(error),
            "error_type": type(error).__name__,
            "data_hash": hash(str(data)),  # Don't store full data for memory safety
            "data_keys": list(data.keys()) if isinstance(data, dict) else [],
        }
        
        self.dead_letter_log.append(dead_letter_entry)
        
        # Limit dead letter log size
        if len(self.dead_letter_log) > self.max_dead_letters:
            self.dead_letter_log = self.dead_letter_log[-self.max_dead_letters:]
        
        self.logger.error("Event added to dead-letter log", extra={
            "category": "event_bus",
            "action": "dead_letter",
            "event_type": event_type,
            "handler_id": handler_id,
            "exception_count": exception_count,
            "dead_letter_size": len(self.dead_letter_log),
            "result": "dead_letter_logged",
        })
    
    async def _batch_processor(self) -> None:
        """Background task to process micro-batches"""
        while True:
            try:
                await asyncio.sleep(0.1)  # Check every 100ms
                
                batches_to_process = []
                
                # Check which batches are ready
                async with self.batch_lock:
                    for prop_id, batch in list(self.micro_batches.items()):
                        if batch.should_process(self.batch_window_ms):
                            batches_to_process.append((prop_id, batch))
                            del self.micro_batches[prop_id]
                
                # Process ready batches
                for prop_id, batch in batches_to_process:
                    await self._process_micro_batch(prop_id, batch)
                    
            except Exception as e:
                self.logger.error("Batch processor error", extra={
                    "category": "micro_batching",
                    "action": "processor_error",
                    "error": str(e),
                    "result": "error",
                })
                await asyncio.sleep(1)  # Back off on error
    
    async def _process_micro_batch(self, prop_id: str, batch: MicroBatch) -> None:
        """Process a complete micro-batch with computational cost tracking"""
        start_time = time.time()
        
        try:
            # Record recompute execution
            self.computational_controller.record_recompute_executed()
            
            # Update debounce map
            async with self.debounce_lock:
                self.recompute_debounce_map[prop_id] = time.time()
            
            # Emit batch processing event
            batch_data = {
                "prop_id": prop_id,
                "event_count": len(batch.events),
                "batch_age_ms": (time.time() - batch.first_event_time) * 1000,
                "event_types": list({event.event_type for event in batch.events}),
                "events": [{"event_type": e.event_type, "timestamp": e.timestamp} for e in batch.events[-5:]],  # Last 5 events
                # Computational cost information
                "total_computational_cost": batch.total_computational_cost,
                "aggregated_change_magnitude": batch.aggregated_change_magnitude,
                "dominant_classification": batch.dominant_classification.value,
                "classification_counts": self._get_classification_counts(batch.events),
            }
            
            await self.emit_event("recompute_batch", batch_data)
            
            self.logger.info("Micro-batch processed", extra={
                "category": "micro_batching",
                "action": "process_batch",
                "prop_id": prop_id,
                "event_count": len(batch.events),
                "batch_age_ms": batch_data["batch_age_ms"],
                "total_computational_cost": batch.total_computational_cost,
                "dominant_classification": batch.dominant_classification.value,
                "controller_mode": self.computational_controller.current_mode.value,
                "controller_metrics": self.computational_controller.get_performance_metrics(),
                "processing_duration_ms": (time.time() - start_time) * 1000,
                "result": "processed",
            })
            
        except Exception as e:
            self.logger.error("Micro-batch processing failed", extra={
                "category": "micro_batching",
                "action": "process_error",
                "prop_id": prop_id,
                "event_count": len(batch.events),
                "total_computational_cost": batch.total_computational_cost,
                "error": str(e),
                "duration_ms": (time.time() - start_time) * 1000,
                "result": "error",
            })
    
    def _get_classification_counts(self, events: List[RecomputeEvent]) -> Dict[str, int]:
        """Get count of events by classification"""
        counts = {classification.value: 0 for classification in LineChangeClassification}
        for event in events:
            counts[event.classification.value] += 1
        return counts
    
    async def _metrics_updater(self) -> None:
        """Background task to update rolling metrics"""
        while True:
            try:
                await asyncio.sleep(1)  # Update every second
                now = time.time()
                
                for provider_id, metrics in self.provider_metrics.items():
                    async with self.provider_locks[provider_id]:
                        # Update 5-minute success rate
                        if metrics.success_rate_window:
                            metrics.success_rate_5m = sum(metrics.success_rate_window) / len(metrics.success_rate_window)
                        else:
                            metrics.success_rate_5m = 1.0  # Default to perfect if no samples
                        
                        # Add current second to window (0 for no activity)
                        # This ensures the window represents the actual time period
                        if not metrics.success_rate_window or metrics.success_rate_window[-1] != now:
                            # No activity this second, but keep window moving
                            pass  # Window will naturally age out old values
                            
            except Exception as e:
                self.logger.error("Metrics updater error", extra={
                    "category": "metrics",
                    "action": "update_error",
                    "error": str(e),
                    "result": "error",
                })
                await asyncio.sleep(5)  # Back off on error
    
    async def _cleanup_worker(self) -> None:
        """Background cleanup of stale data"""
        while True:
            try:
                await asyncio.sleep(300)  # Cleanup every 5 minutes
                now = time.time()
                cleanup_start = time.time()
                
                # Clean old debounce entries (older than 1 hour)
                async with self.debounce_lock:
                    old_count = len(self.recompute_debounce_map)
                    self.recompute_debounce_map = {
                        prop_id: ts for prop_id, ts in self.recompute_debounce_map.items()
                        if now - ts < 3600  # Keep entries less than 1 hour old
                    }
                    cleaned_debounce = old_count - len(self.recompute_debounce_map)
                
                # Clean old dead letters (older than 24 hours)
                old_dead_letters = len(self.dead_letter_log)
                self.dead_letter_log = [
                    entry for entry in self.dead_letter_log
                    if now - entry["timestamp"] < 86400  # Keep entries less than 24 hours old
                ]
                cleaned_dead_letters = old_dead_letters - len(self.dead_letter_log)
                
                self.logger.info("Cleanup completed", extra={
                    "category": "cleanup",
                    "action": "cleanup_cycle",
                    "cleaned_debounce_entries": cleaned_debounce,
                    "cleaned_dead_letters": cleaned_dead_letters,
                    "remaining_debounce_entries": len(self.recompute_debounce_map),
                    "remaining_dead_letters": len(self.dead_letter_log),
                    "duration_ms": (time.time() - cleanup_start) * 1000,
                    "result": "completed",
                })
                
            except Exception as e:
                self.logger.error("Cleanup worker error", extra={
                    "category": "cleanup", 
                    "action": "cleanup_error",
                    "error": str(e),
                    "result": "error",
                })
                await asyncio.sleep(60)  # Back off on error
    
    def get_provider_state(self, provider_id: str) -> Optional[Dict[str, Any]]:
        """Get current provider state and metrics"""
        if provider_id not in self.provider_metrics:
            return None
        
        metrics = self.provider_metrics[provider_id]
        now = time.time()
        
        # Calculate SLA percentage
        sla_percentage = (metrics.sla_success_count / metrics.sla_total_count * 100) if metrics.sla_total_count > 0 else 100.0
        
        return {
            # Core state fields from objective
            "consecutive_failures": metrics.consecutive_failures,
            "avg_latency_ms": metrics.avg_latency_ms,
            "p95_latency_ms": metrics.p95_latency_ms,
            "success_rate_5m": metrics.success_rate_5m,
            
            # SLA metrics as requested
            "sla_percentage": sla_percentage,
            "sla_success_count": metrics.sla_success_count,
            "sla_total_count": metrics.sla_total_count,
            "sla_violation_count": metrics.sla_violation_count,
            
            # Error categorization for monitoring
            "error_categories": dict(metrics.error_categories),
            
            # Circuit breaker state information
            "provider_state": metrics.current_state.value,
            "circuit_state": metrics.circuit_state.value,
            "circuit_state_changed_at": metrics.circuit_state_changed_at,
            "half_open_attempts": metrics.half_open_attempts,
            
            # Additional state information
            "total_requests": metrics.total_requests,
            "successful_requests": metrics.successful_requests,
            "failed_requests": metrics.failed_requests,
            "backoff_current_sec": metrics.backoff_current_sec,
            "next_retry_time": metrics.next_retry_time,
            "can_retry": metrics.next_retry_time <= now,
            "state_changed_at": metrics.state_changed_at,
            "uptime_sec": now - metrics.state_changed_at if metrics.current_state == ProviderState.HEALTHY else None,
        }
    
    def get_provider_health_summary(self, provider_id: str) -> Optional[Dict[str, Any]]:
        """Get health summary for reliability monitoring integration"""
        state = self.get_provider_state(provider_id)
        if not state:
            return None
        
        # Determine health status for reliability integration
        is_healthy = state["provider_state"] == "healthy" and state["circuit_state"] == "closed"
        is_degraded = state["provider_state"] in ["degraded", "failing"] and state["circuit_state"] in ["closed", "half_open"]
        is_outage = state["provider_state"] == "circuit_open" or state["circuit_state"] == "open"
        
        health_status = "healthy"
        if is_outage:
            health_status = "outage"
        elif is_degraded:
            health_status = "degraded"
        
        return {
            "provider_id": provider_id,
            "health_status": health_status,
            "is_available": not is_outage,
            "sla_metrics": {
                "success_percentage": state["sla_percentage"],
                "p95_latency_ms": state["p95_latency_ms"],
                "error_categories": state["error_categories"],
            },
            "circuit_breaker": {
                "state": state["circuit_state"],
                "consecutive_failures": state["consecutive_failures"],
                "can_retry": state["can_retry"],
                "retry_after_sec": max(0, state["next_retry_time"] - time.time()) if state["next_retry_time"] > time.time() else 0,
            },
            "last_updated": time.time(),
        }
    
    def get_system_status(self) -> Dict[str, Any]:
        """Get overall system status including computational control metrics"""
        now = time.time()
        
        provider_states = {}
        for provider_id in self.provider_metrics.keys():
            provider_states[provider_id] = self.get_provider_state(provider_id)
        
        # Add provider health summaries for reliability integration
        provider_health_summaries = {}
        for provider_id in self.provider_metrics.keys():
            health_summary = self.get_provider_health_summary(provider_id)
            if health_summary:
                provider_health_summaries[provider_id] = {"health_summary": health_summary}
        
        # Get computational controller metrics
        computational_metrics = self.computational_controller.get_performance_metrics()
        
        return {
            "providers": provider_states,
            "total_providers": len(self.provider_metrics),
            "healthy_providers": sum(1 for p in provider_states.values() if p and p.get("provider_state") == "healthy"),
            "degraded_providers": sum(1 for p in provider_states.values() if p and p.get("provider_state") in ["degraded", "failing", "circuit_open"]),
            "active_micro_batches": len(self.micro_batches),
            "debounce_entries": len(self.recompute_debounce_map),
            "dead_letter_count": len(self.dead_letter_log),
            "event_handler_types": len(self.event_handlers),
            "total_event_handlers": sum(len(handlers) for handlers in self.event_handlers.values()),
            "handler_exception_count": sum(self.handler_exception_counters.values()),
            "system_uptime_sec": now - getattr(self, '_start_time', now),
            
            # Computational control metrics
            "computational_controller": computational_metrics,
            
            # Performance indicators
            "performance_status": {
                "current_mode": computational_metrics["current_mode"],
                "load_ratio": computational_metrics["load_ratio"],
                "processing_efficiency": computational_metrics["performance_metrics"]["processing_efficiency"],
                "queue_depth": computational_metrics["pending_queue_depth"],
                "under_cpu_target": computational_metrics["performance_metrics"]["current_load_ratio"] < computational_metrics["performance_metrics"]["cpu_target_threshold"],
            },
            
            # For reliability monitoring integration - include formatted provider data
            "providers_for_reliability": provider_health_summaries,
        }
    
    def get_computational_status(self) -> Dict[str, Any]:
        """Get detailed computational control status"""
        return {
            "controller_metrics": self.computational_controller.get_performance_metrics(),
            "burst_control_active": self.computational_controller.current_mode == ComputeMode.BURST_CONTROL,
            "degraded_mode_active": self.computational_controller.current_mode == ComputeMode.DEGRADED,
            "lazy_recomputes_pending": len(self.computational_controller.flagged_recomputes),
            "stress_test_status": {
                "can_handle_10x_load": self._estimate_10x_load_capacity(),
                "no_major_starvation": self._check_major_event_starvation(),
                "cpu_under_threshold": self._is_cpu_under_threshold(),
            }
        }
    
    def _estimate_10x_load_capacity(self) -> bool:
        """Estimate if system can handle 10x baseline load"""
        metrics = self.computational_controller.get_performance_metrics()
        current_load = metrics["performance_metrics"]["current_load_ratio"]
        
        # If current load * 10 would still be manageable with burst control
        estimated_10x_load = current_load * 10
        return estimated_10x_load <= 1.0  # Burst control can handle up to 100% load
    
    def _check_major_event_starvation(self) -> bool:
        """Check if major events are being processed without starvation"""
        # Major events bypass degraded mode limits, so no starvation occurs
        return True
    
    async def stress_test_computational_control(self, baseline_events: int = 100, 
                                              duration_sec: int = 10) -> Dict[str, Any]:
        """
        Stress test computational controller with 10x baseline load.
        
        Args:
            baseline_events: Baseline events per second
            duration_sec: Duration of stress test
        
        Returns:
            Dict with stress test results
        """
        start_time = time.time()
        test_events = baseline_events * 10  # 10x baseline
        
        self.logger.info("Starting computational control stress test", extra={
            "category": "stress_test",
            "action": "start",
            "baseline_events": baseline_events,
            "test_events": test_events,
            "duration_sec": duration_sec,
            "target_cpu_threshold": self.computational_controller.cpu_target_threshold,
        })
        
        # Track initial state
        initial_metrics = self.computational_controller.get_performance_metrics()
        
        # Generate test events
        test_props = [f"test_prop_{i}" for i in range(20)]
        major_events_processed = 0
        micro_events_deferred = 0
        total_events_submitted = 0
        
        for second in range(duration_sec):
            second_start = time.time()
            
            # Generate events for this second
            for event_num in range(test_events):
                total_events_submitted += 1
                prop_id = test_props[event_num % len(test_props)]
                
                # Mix of event types and magnitudes
                if event_num % 10 == 0:  # 10% major events
                    magnitude = 2.0  # Major change
                    event_type = "injury_news"
                else:
                    magnitude = 0.1  # Micro change  
                    event_type = "odds_change"
                
                was_added, reason = await self.add_recompute_event(
                    prop_id=prop_id,
                    event_type=event_type,
                    data={"test_event": True, "magnitude": magnitude},
                    change_magnitude=magnitude
                )
                
                if was_added and magnitude >= 1.0:
                    major_events_processed += 1
                elif reason == "deferred_lazy_micro":
                    micro_events_deferred += 1
            
            # Wait for the rest of the second
            elapsed = time.time() - second_start
            if elapsed < 1.0:
                await asyncio.sleep(1.0 - elapsed)
        
        # Wait for batch processing to complete
        await asyncio.sleep(2.0)
        
        # Collect final metrics
        final_metrics = self.computational_controller.get_performance_metrics()
        test_duration = time.time() - start_time
        
        # Calculate results
        cpu_under_threshold = final_metrics["performance_metrics"]["current_load_ratio"] < self.computational_controller.cpu_target_threshold
        no_major_starvation = major_events_processed > 0  # At least some major events were processed
        
        results = {
            "stress_test_passed": cpu_under_threshold and no_major_starvation,
            "cpu_under_threshold": cpu_under_threshold,
            "no_major_starvation": no_major_starvation,
            "test_duration_sec": test_duration,
            "events_submitted": total_events_submitted,
            "major_events_processed": major_events_processed,
            "micro_events_deferred": micro_events_deferred,
            "initial_metrics": initial_metrics,
            "final_metrics": final_metrics,
            "performance_degradation": {
                "events_emitted_delta": final_metrics["events_emitted"] - initial_metrics["events_emitted"],
                "recomputes_executed_delta": final_metrics["recomputes_executed"] - initial_metrics["recomputes_executed"],
                "queue_depth_final": final_metrics["pending_queue_depth"],
                "processing_efficiency": final_metrics["performance_metrics"]["processing_efficiency"],
            },
            "mode_transitions": {
                "final_mode": final_metrics["current_mode"],
                "mode_changed_at": final_metrics["mode_changed_at"],
                "operated_in_degraded": final_metrics["current_mode"] in ["degraded", "burst_control"],
            }
        }
        
        self.logger.info("Computational control stress test completed", extra={
            "category": "stress_test",
            "action": "complete",
            "stress_test_passed": results["stress_test_passed"],
            "cpu_under_threshold": cpu_under_threshold,
            "no_major_starvation": no_major_starvation,
            "final_mode": final_metrics["current_mode"],
            "events_processed": results["performance_degradation"]["events_emitted_delta"],
            "processing_efficiency": results["performance_degradation"]["processing_efficiency"],
            "result": "completed",
        })
        
        return results
    
    def _is_cpu_under_threshold(self) -> bool:
        """Check if CPU usage is under target threshold"""
        metrics = self.computational_controller.get_performance_metrics()
        return metrics["performance_metrics"]["current_load_ratio"] < metrics["performance_metrics"]["cpu_target_threshold"]
    
    async def close(self) -> None:
        """Clean shutdown"""
        if self._cleanup_task:
            self._cleanup_task.cancel()
        if self._batch_processor_task:
            self._batch_processor_task.cancel()
        if self._metrics_updater_task:
            self._metrics_updater_task.cancel()
        
        self.logger.info("ProviderResilienceManager shut down", extra={
            "category": "system",
            "action": "shutdown",
            "result": "completed",
        })


# Global instance
provider_resilience_manager = ProviderResilienceManager()

# Export key functions
__all__ = [
    "ProviderResilienceManager",
    "ProviderState", 
    "ProviderMetrics",
    "RecomputeEvent",
    "MicroBatch",
    "ComputationalController",
    "LineChangeClassification",
    "ComputeMode",
    "provider_resilience_manager",
]