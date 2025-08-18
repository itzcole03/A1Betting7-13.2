"""
Data Flow Hook Points System

Event-driven hook system for integrating Section 4 live data components with existing prop workflows.
Provides hook registration, event filtering, batching, debouncing, and callback management to prevent
excessive recomputation and ensure efficient data flow integration.
"""

import asyncio
import logging
from collections import defaultdict, deque
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, List, Optional, Any, Callable, Awaitable, Set, Union
from uuid import uuid4
import json
import weakref
import inspect

from ..unified_config import get_live_data_config, get_config
from ..unified_logging import get_logger
from ..unified_cache_service import unified_cache_service


class HookEvent(Enum):
    """Types of events that can trigger hooks"""
    # Prop lifecycle events
    PROP_CREATED = "prop_created"
    PROP_UPDATED = "prop_updated"
    PROP_DELETED = "prop_deleted"
    PROP_ACTIVATED = "prop_activated"
    PROP_DEACTIVATED = "prop_deactivated"
    PROP_SETTLED = "prop_settled"
    
    # Live data events
    WEATHER_UPDATED = "weather_updated"
    INJURY_REPORTED = "injury_reported"
    LINEUP_CHANGED = "lineup_changed"
    LINE_MOVEMENT = "line_movement"
    STEAM_DETECTED = "steam_detected"
    
    # Game events
    GAME_STARTED = "game_started"
    GAME_ENDED = "game_ended"
    GAME_SUSPENDED = "game_suspended"
    INNING_CHANGED = "inning_changed"
    SCORE_CHANGED = "score_changed"
    
    # Live events
    LIVE_EVENT = "live_event"
    PLAY_BY_PLAY = "play_by_play"
    PLAYER_SUBSTITUTION = "player_substitution"
    
    # System events
    DATA_REFRESH = "data_refresh"
    CACHE_INVALIDATION = "cache_invalidation"
    SYSTEM_HEALTH_CHECK = "system_health_check"


class HookPriority(Enum):
    """Priority levels for hook execution"""
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    CRITICAL = 4


class BatchingStrategy(Enum):
    """Strategies for batching events"""
    IMMEDIATE = "immediate"      # Execute immediately
    TIME_BASED = "time_based"    # Batch by time window
    COUNT_BASED = "count_based"  # Batch by event count
    HYBRID = "hybrid"           # Both time and count based


@dataclass
class HookEventData:
    """Data associated with a hook event"""
    event_id: str = field(default_factory=lambda: str(uuid4()))
    event_type: HookEvent = HookEvent.DATA_REFRESH
    timestamp: datetime = field(default_factory=datetime.utcnow)
    
    # Event payload
    data: Dict[str, Any] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    # Context information
    source_service: str = ""
    source_component: str = ""
    correlation_id: Optional[str] = None
    
    # Processing information
    processed_at: Optional[datetime] = None
    processing_duration_ms: Optional[float] = None
    result: Optional[Any] = None
    error: Optional[str] = None


@dataclass
class HookRegistration:
    """Registration information for a hook callback"""
    id: str = field(default_factory=lambda: str(uuid4()))
    name: str = ""
    description: str = ""
    
    # Hook configuration
    events: Set[HookEvent] = field(default_factory=set)
    priority: HookPriority = HookPriority.MEDIUM
    enabled: bool = True
    
    # Callback information
    callback: Optional[Callable] = None
    is_async: bool = True
    
    # Filtering
    event_filter: Optional[Callable[[HookEventData], bool]] = None
    data_filter: Dict[str, Any] = field(default_factory=dict)
    
    # Batching and debouncing
    batching_strategy: BatchingStrategy = BatchingStrategy.IMMEDIATE
    batch_size: int = 1
    batch_timeout_ms: int = 1000
    debounce_ms: int = 0
    
    # Registration metadata
    registered_at: datetime = field(default_factory=datetime.utcnow)
    registered_by: str = ""
    last_executed: Optional[datetime] = None
    execution_count: int = 0
    
    # Performance tracking
    total_execution_time_ms: float = 0.0
    average_execution_time_ms: float = 0.0
    last_error: Optional[str] = None
    error_count: int = 0


class HookBatch:
    """Batch of events to be processed together"""
    
    def __init__(
        self,
        hook_id: str,
        events: List[HookEventData],
        created_at: Optional[datetime] = None
    ):
        self.id = str(uuid4())
        self.hook_id = hook_id
        self.events = events
        self.created_at = created_at or datetime.utcnow()
        self.processed_at: Optional[datetime] = None
        self.processing_duration_ms: Optional[float] = None
        self.result: Optional[Any] = None
        self.error: Optional[str] = None


class DataFlowHookManager:
    """
    Central manager for data flow hooks and event processing.
    
    Key Features:
    - Hook registration and lifecycle management
    - Event filtering and routing
    - Batching and debouncing to prevent excessive processing
    - Priority-based execution ordering
    - Error handling and recovery
    - Performance monitoring and statistics
    """
    
    def __init__(self):
        self.logger = get_logger("data_flow_hook_manager")
        self.config = get_live_data_config()
        self.app_config = get_config()
        
        # Hook registry
        self.registered_hooks: Dict[str, HookRegistration] = {}
        self.event_hooks: Dict[HookEvent, List[str]] = defaultdict(list)  # event -> hook_ids
        
        # Event processing
        self.event_queue: deque = deque()
        self.processing_queue: asyncio.Queue = asyncio.Queue()
        self.batch_queues: Dict[str, List[HookEventData]] = defaultdict(list)
        self.debounce_timers: Dict[str, asyncio.Task] = {}
        
        # Performance tracking
        self.stats = {
            "events_processed": 0,
            "hooks_executed": 0,
            "batches_processed": 0,
            "total_processing_time_ms": 0.0,
            "errors": 0,
            "filtered_events": 0,
            "debounced_events": 0,
        }
        
        # Configuration
        self.max_queue_size = 10000
        self.max_concurrent_processing = 5
        self.default_timeout_ms = 30000  # 30 seconds
        
        # Processing control
        self.processing_active = False
        self.processing_task: Optional[asyncio.Task] = None
        
        self.logger.info("DataFlowHookManager initialized")

    async def start_processing(self) -> None:
        """Start the hook processing system"""
        if self.processing_active:
            self.logger.warning("Hook processing already active")
            return
        
        self.processing_active = True
        self.processing_task = asyncio.create_task(self._process_events_continuously())
        
        self.logger.info("Hook processing started")

    async def stop_processing(self) -> None:
        """Stop the hook processing system"""
        if not self.processing_active:
            return
        
        self.processing_active = False
        
        if self.processing_task:
            self.processing_task.cancel()
            try:
                await self.processing_task
            except asyncio.CancelledError:
                pass
        
        # Cancel debounce timers
        for timer_task in self.debounce_timers.values():
            timer_task.cancel()
        self.debounce_timers.clear()
        
        self.logger.info("Hook processing stopped")

    def register_hook(
        self,
        name: str,
        events: Union[HookEvent, List[HookEvent]],
        callback: Callable,
        priority: HookPriority = HookPriority.MEDIUM,
        description: str = "",
        event_filter: Optional[Callable[[HookEventData], bool]] = None,
        batching_strategy: BatchingStrategy = BatchingStrategy.IMMEDIATE,
        batch_size: int = 1,
        batch_timeout_ms: int = 1000,
        debounce_ms: int = 0,
        registered_by: str = ""
    ) -> str:
        """
        Register a hook for specific events.
        
        Args:
            name: Human-readable name for the hook
            events: Event type(s) to hook into
            callback: Function to call when events occur
            priority: Execution priority
            description: Description of what the hook does
            event_filter: Optional filter function for events
            batching_strategy: How to batch events
            batch_size: Maximum events per batch
            batch_timeout_ms: Maximum time to wait for batch
            debounce_ms: Debounce delay in milliseconds
            registered_by: Who registered this hook
        
        Returns:
            Hook ID for future reference
        """
        # Normalize events to a set
        if isinstance(events, HookEvent):
            events_set = {events}
        else:
            events_set = set(events)
        
        # Detect if callback is async
        is_async = inspect.iscoroutinefunction(callback)
        
        # Create registration
        registration = HookRegistration(
            name=name,
            description=description,
            events=events_set,
            priority=priority,
            callback=callback,
            is_async=is_async,
            event_filter=event_filter,
            batching_strategy=batching_strategy,
            batch_size=batch_size,
            batch_timeout_ms=batch_timeout_ms,
            debounce_ms=debounce_ms,
            registered_by=registered_by
        )
        
        # Register in main registry
        self.registered_hooks[registration.id] = registration
        
        # Add to event mappings
        for event in events_set:
            self.event_hooks[event].append(registration.id)
        
        self.logger.info(
            f"Registered hook '{name}' for events {[e.value for e in events_set]}",
            extra={
                "hook_id": registration.id,
                "events": [e.value for e in events_set],
                "priority": priority.value,
                "batching": batching_strategy.value,
                "debounce_ms": debounce_ms
            }
        )
        
        return registration.id

    def unregister_hook(self, hook_id: str) -> bool:
        """
        Unregister a hook.
        
        Args:
            hook_id: ID of hook to unregister
            
        Returns:
            True if hook was found and removed
        """
        if hook_id not in self.registered_hooks:
            return False
        
        registration = self.registered_hooks[hook_id]
        
        # Remove from event mappings
        for event in registration.events:
            if hook_id in self.event_hooks[event]:
                self.event_hooks[event].remove(hook_id)
                if not self.event_hooks[event]:
                    del self.event_hooks[event]
        
        # Remove from registry
        del self.registered_hooks[hook_id]
        
        # Cancel any debounce timer
        if hook_id in self.debounce_timers:
            self.debounce_timers[hook_id].cancel()
            del self.debounce_timers[hook_id]
        
        self.logger.info(f"Unregistered hook '{registration.name}' ({hook_id})")
        
        return True

    async def emit_event(
        self,
        event_type: HookEvent,
        data: Dict[str, Any] = None,
        metadata: Dict[str, Any] = None,
        source_service: str = "",
        source_component: str = "",
        correlation_id: Optional[str] = None
    ) -> str:
        """
        Emit an event to be processed by registered hooks.
        
        Returns:
            Event ID for tracking
        """
        event_data = HookEventData(
            event_type=event_type,
            data=data or {},
            metadata=metadata or {},
            source_service=source_service,
            source_component=source_component,
            correlation_id=correlation_id
        )
        
        # Add to processing queue
        try:
            await self.processing_queue.put(event_data)
            self.stats["events_processed"] += 1
            
            self.logger.debug(
                f"Emitted event {event_type.value}",
                extra={
                    "event_id": event_data.event_id,
                    "source_service": source_service,
                    "source_component": source_component,
                    "data_keys": list(data.keys()) if data else []
                }
            )
            
        except asyncio.QueueFull:
            self.logger.error(f"Event queue full, dropping event {event_type.value}")
            return ""
        
        return event_data.event_id

    async def get_hook_stats(self, hook_id: Optional[str] = None) -> Dict[str, Any]:
        """Get statistics for a specific hook or all hooks"""
        if hook_id and hook_id in self.registered_hooks:
            registration = self.registered_hooks[hook_id]
            return {
                "hook_id": hook_id,
                "name": registration.name,
                "events": [e.value for e in registration.events],
                "enabled": registration.enabled,
                "execution_count": registration.execution_count,
                "total_execution_time_ms": registration.total_execution_time_ms,
                "average_execution_time_ms": registration.average_execution_time_ms,
                "error_count": registration.error_count,
                "last_executed": registration.last_executed.isoformat() if registration.last_executed else None,
                "last_error": registration.last_error
            }
        else:
            # Return system stats
            return {
                "system_stats": self.stats.copy(),
                "registered_hooks": len(self.registered_hooks),
                "active_hooks": len([h for h in self.registered_hooks.values() if h.enabled]),
                "event_mappings": len(self.event_hooks),
                "queue_size": self.processing_queue.qsize(),
                "processing_active": self.processing_active,
                "max_queue_size": self.max_queue_size
            }

    async def list_hooks(
        self,
        event_filter: Optional[HookEvent] = None,
        enabled_only: bool = False
    ) -> List[Dict[str, Any]]:
        """List registered hooks with optional filtering"""
        hooks = []
        
        for hook_id, registration in self.registered_hooks.items():
            if enabled_only and not registration.enabled:
                continue
            
            if event_filter and event_filter not in registration.events:
                continue
            
            hooks.append({
                "id": hook_id,
                "name": registration.name,
                "description": registration.description,
                "events": [e.value for e in registration.events],
                "priority": registration.priority.value,
                "enabled": registration.enabled,
                "batching_strategy": registration.batching_strategy.value,
                "execution_count": registration.execution_count,
                "registered_by": registration.registered_by,
                "registered_at": registration.registered_at.isoformat()
            })
        
        return hooks

    # Private methods

    async def _process_events_continuously(self) -> None:
        """Continuously process events from the queue"""
        self.logger.info("Starting continuous event processing")
        
        try:
            while self.processing_active:
                try:
                    # Get event from queue with timeout
                    event = await asyncio.wait_for(
                        self.processing_queue.get(),
                        timeout=1.0  # Check processing_active every second
                    )
                    
                    await self._process_single_event(event)
                    
                except asyncio.TimeoutError:
                    continue  # Check processing_active and continue
                except Exception as e:
                    self.logger.error(f"Error in event processing loop: {e}")
                    self.stats["errors"] += 1
                    
        except asyncio.CancelledError:
            self.logger.info("Event processing cancelled")
            raise
        except Exception as e:
            self.logger.error(f"Fatal error in event processing: {e}")
            self.processing_active = False

    async def _process_single_event(self, event: HookEventData) -> None:
        """Process a single event through all applicable hooks"""
        start_time = datetime.utcnow()
        
        try:
            # Find hooks for this event type
            hook_ids = self.event_hooks.get(event.event_type, [])
            
            if not hook_ids:
                return  # No hooks registered for this event
            
            # Process each hook
            for hook_id in hook_ids:
                if hook_id not in self.registered_hooks:
                    continue  # Hook was unregistered
                
                registration = self.registered_hooks[hook_id]
                
                if not registration.enabled:
                    continue  # Hook is disabled
                
                # Apply event filter
                if registration.event_filter and not registration.event_filter(event):
                    self.stats["filtered_events"] += 1
                    continue
                
                # Handle batching and debouncing
                await self._handle_hook_execution(registration, event)
            
        except Exception as e:
            self.logger.error(f"Error processing event {event.event_id}: {e}")
            self.stats["errors"] += 1
        finally:
            # Update processing time
            duration = (datetime.utcnow() - start_time).total_seconds() * 1000
            self.stats["total_processing_time_ms"] += duration

    async def _handle_hook_execution(
        self,
        registration: HookRegistration,
        event: HookEventData
    ) -> None:
        """Handle execution of a specific hook with batching/debouncing"""
        try:
            if registration.batching_strategy == BatchingStrategy.IMMEDIATE:
                # Execute immediately
                await self._execute_hook(registration, [event])
                
            elif registration.debounce_ms > 0:
                # Handle debouncing
                await self._handle_debounced_execution(registration, event)
                
            else:
                # Handle batching
                await self._handle_batched_execution(registration, event)
                
        except Exception as e:
            self.logger.error(f"Error handling hook execution for {registration.name}: {e}")
            registration.error_count += 1
            registration.last_error = str(e)

    async def _handle_debounced_execution(
        self,
        registration: HookRegistration,
        event: HookEventData
    ) -> None:
        """Handle debounced hook execution"""
        hook_id = registration.id
        
        # Cancel existing timer
        if hook_id in self.debounce_timers:
            self.debounce_timers[hook_id].cancel()
        
        # Add event to batch queue
        self.batch_queues[hook_id].append(event)
        
        # Create new timer
        async def debounced_execute():
            await asyncio.sleep(registration.debounce_ms / 1000.0)
            
            # Get accumulated events
            events = self.batch_queues[hook_id].copy()
            self.batch_queues[hook_id].clear()
            
            if events:
                await self._execute_hook(registration, events)
                self.stats["debounced_events"] += len(events) - 1  # Count extra events
            
            # Clean up timer
            if hook_id in self.debounce_timers:
                del self.debounce_timers[hook_id]
        
        self.debounce_timers[hook_id] = asyncio.create_task(debounced_execute())

    async def _handle_batched_execution(
        self,
        registration: HookRegistration,
        event: HookEventData
    ) -> None:
        """Handle batched hook execution"""
        hook_id = registration.id
        
        # Add event to batch queue
        self.batch_queues[hook_id].append(event)
        
        # Check if batch is ready
        should_execute = False
        
        if registration.batching_strategy == BatchingStrategy.COUNT_BASED:
            should_execute = len(self.batch_queues[hook_id]) >= registration.batch_size
            
        elif registration.batching_strategy == BatchingStrategy.TIME_BASED:
            # Check oldest event time
            oldest_event = self.batch_queues[hook_id][0]
            age_ms = (datetime.utcnow() - oldest_event.timestamp).total_seconds() * 1000
            should_execute = age_ms >= registration.batch_timeout_ms
            
        elif registration.batching_strategy == BatchingStrategy.HYBRID:
            # Execute if either condition is met
            count_ready = len(self.batch_queues[hook_id]) >= registration.batch_size
            oldest_event = self.batch_queues[hook_id][0]
            age_ms = (datetime.utcnow() - oldest_event.timestamp).total_seconds() * 1000
            time_ready = age_ms >= registration.batch_timeout_ms
            should_execute = count_ready or time_ready
        
        if should_execute:
            # Execute batch
            events = self.batch_queues[hook_id].copy()
            self.batch_queues[hook_id].clear()
            await self._execute_hook(registration, events)

    async def _execute_hook(
        self,
        registration: HookRegistration,
        events: List[HookEventData]
    ) -> None:
        """Execute a hook callback with the given events"""
        if not registration.callback:
            return
        
        start_time = datetime.utcnow()
        
        try:
            # Prepare arguments based on callback signature
            if len(events) == 1:
                # Single event
                if registration.is_async:
                    result = await registration.callback(events[0])
                else:
                    result = registration.callback(events[0])
            else:
                # Multiple events (batch)
                if registration.is_async:
                    result = await registration.callback(events)
                else:
                    result = registration.callback(events)
            
            # Update statistics
            end_time = datetime.utcnow()
            duration_ms = (end_time - start_time).total_seconds() * 1000
            
            registration.execution_count += 1
            registration.last_executed = end_time
            registration.total_execution_time_ms += duration_ms
            registration.average_execution_time_ms = (
                registration.total_execution_time_ms / registration.execution_count
            )
            
            # Mark events as processed
            for event in events:
                event.processed_at = end_time
                event.processing_duration_ms = duration_ms
                event.result = result
            
            self.stats["hooks_executed"] += 1
            if len(events) > 1:
                self.stats["batches_processed"] += 1
            
            self.logger.debug(
                f"Executed hook '{registration.name}' with {len(events)} events",
                extra={
                    "hook_id": registration.id,
                    "event_count": len(events),
                    "duration_ms": duration_ms,
                    "execution_count": registration.execution_count
                }
            )
            
        except Exception as e:
            # Handle execution error
            registration.error_count += 1
            registration.last_error = str(e)
            
            # Mark events as errored
            for event in events:
                event.error = str(e)
            
            self.logger.error(
                f"Error executing hook '{registration.name}': {e}",
                extra={
                    "hook_id": registration.id,
                    "event_count": len(events),
                    "error_count": registration.error_count
                }
            )


# Global instance
_hook_manager_instance: Optional[DataFlowHookManager] = None


def get_hook_manager() -> DataFlowHookManager:
    """Get the global hook manager instance"""
    global _hook_manager_instance
    
    if _hook_manager_instance is None:
        _hook_manager_instance = DataFlowHookManager()
    
    return _hook_manager_instance


# Convenience decorators and functions

def hook(
    events: Union[HookEvent, List[HookEvent]],
    name: Optional[str] = None,
    priority: HookPriority = HookPriority.MEDIUM,
    description: str = "",
    batching: BatchingStrategy = BatchingStrategy.IMMEDIATE,
    batch_size: int = 1,
    batch_timeout_ms: int = 1000,
    debounce_ms: int = 0
):
    """
    Decorator for registering a function as a hook.
    
    Usage:
        @hook(HookEvent.WEATHER_UPDATED, debounce_ms=1000)
        async def handle_weather_update(event: HookEventData):
            # Handle weather update
            pass
    """
    def decorator(func):
        hook_name = name or func.__name__
        
        # Register the hook
        hook_manager = get_hook_manager()
        hook_id = hook_manager.register_hook(
            name=hook_name,
            events=events,
            callback=func,
            priority=priority,
            description=description,
            batching_strategy=batching,
            batch_size=batch_size,
            batch_timeout_ms=batch_timeout_ms,
            debounce_ms=debounce_ms,
            registered_by=f"decorator:{func.__module__}.{func.__name__}"
        )
        
        # Store hook ID on function for potential unregistration
        func._hook_id = hook_id
        
        return func
    
    return decorator


async def emit_weather_update(
    weather_data: Dict[str, Any],
    ballpark: str = "",
    game_id: Optional[str] = None,
    source_service: str = "weather_api_integration"
) -> str:
    """Emit a weather update event"""
    hook_manager = get_hook_manager()
    
    return await hook_manager.emit_event(
        event_type=HookEvent.WEATHER_UPDATED,
        data=weather_data,
        metadata={"ballpark": ballpark, "game_id": game_id},
        source_service=source_service,
        source_component="weather_update_emitter"
    )


async def emit_injury_report(
    injury_data: Dict[str, Any],
    player_id: str,
    severity: str = "unknown",
    source_service: str = "live_injury_lineup_monitor"
) -> str:
    """Emit an injury report event"""
    hook_manager = get_hook_manager()
    
    return await hook_manager.emit_event(
        event_type=HookEvent.INJURY_REPORTED,
        data=injury_data,
        metadata={"player_id": player_id, "severity": severity},
        source_service=source_service,
        source_component="injury_reporter"
    )


async def emit_line_movement(
    movement_data: Dict[str, Any],
    prop_id: str,
    movement_type: str = "standard",
    source_service: str = "line_movement_tracker"
) -> str:
    """Emit a line movement event"""
    hook_manager = get_hook_manager()
    
    event_type = (
        HookEvent.STEAM_DETECTED if "steam" in movement_type.lower()
        else HookEvent.LINE_MOVEMENT
    )
    
    return await hook_manager.emit_event(
        event_type=event_type,
        data=movement_data,
        metadata={"prop_id": prop_id, "movement_type": movement_type},
        source_service=source_service,
        source_component="line_movement_emitter"
    )


async def emit_prop_lifecycle_event(
    event_type: HookEvent,
    prop_id: str,
    prop_data: Dict[str, Any] = None,
    source_service: str = "prop_service"
) -> str:
    """Emit a prop lifecycle event"""
    hook_manager = get_hook_manager()
    
    return await hook_manager.emit_event(
        event_type=event_type,
        data=prop_data or {},
        metadata={"prop_id": prop_id},
        source_service=source_service,
        source_component="prop_lifecycle_emitter"
    )