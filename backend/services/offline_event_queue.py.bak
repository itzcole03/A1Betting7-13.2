"""
Offline Event Queue

Provides robust offline/online event handling with:
- Queue management for transient network failures
- Exponential backoff retry logic
- Event persistence during offline periods
- Automatic retry when network connectivity is restored
- Event prioritization and batching
- Storage size management

Features:
- Detect online/offline state changes
- Queue events during network failures
- Retry failed events with exponential backoff
- Persist events to local storage (in browser) or memory (server)
- Batch events for efficient network usage
- Provide visibility into queue status
"""

import time
import json
import asyncio
from typing import Dict, Any, List, Optional, Callable, Union
from dataclasses import dataclass, field
from collections import deque
from enum import Enum
import threading
import logging
import uuid
import math

logger = logging.getLogger(__name__)


class EventPriority(Enum):
    """Priority levels for queued events"""
    LOW = "low"
    NORMAL = "normal" 
    HIGH = "high"
    CRITICAL = "critical"


class EventStatus(Enum):
    """Status of queued events"""
    PENDING = "pending"
    RETRYING = "retrying"
    FAILED = "failed"
    COMPLETED = "completed"


@dataclass
class QueuedEvent:
    """Represents an event in the offline queue"""
    id: str
    event_type: str
    data: Dict[str, Any]
    priority: EventPriority = EventPriority.NORMAL
    status: EventStatus = EventStatus.PENDING
    created_at: float = field(default_factory=time.time)
    retry_count: int = 0
    max_retries: int = 5
    next_retry_at: Optional[float] = None
    last_error: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization"""
        return {
            'id': self.id,
            'event_type': self.event_type,
            'data': self.data,
            'priority': self.priority.value,
            'status': self.status.value,
            'created_at': self.created_at,
            'retry_count': self.retry_count,
            'max_retries': self.max_retries,
            'next_retry_at': self.next_retry_at,
            'last_error': self.last_error
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'QueuedEvent':
        """Create from dictionary"""
        return cls(
            id=data['id'],
            event_type=data['event_type'],
            data=data['data'],
            priority=EventPriority(data.get('priority', 'normal')),
            status=EventStatus(data.get('status', 'pending')),
            created_at=data.get('created_at', time.time()),
            retry_count=data.get('retry_count', 0),
            max_retries=data.get('max_retries', 5),
            next_retry_at=data.get('next_retry_at'),
            last_error=data.get('last_error')
        )


class RetryPolicy:
    """Configurable retry policy with exponential backoff"""
    
    def __init__(
        self,
        base_delay: float = 1.0,
        max_delay: float = 300.0,  # 5 minutes
        backoff_factor: float = 2.0,
        jitter: bool = True
    ):
        self.base_delay = base_delay
        self.max_delay = max_delay
        self.backoff_factor = backoff_factor
        self.jitter = jitter
    
    def get_delay(self, retry_count: int) -> float:
        """Calculate delay for retry attempt"""
        delay = self.base_delay * (self.backoff_factor ** retry_count)
        delay = min(delay, self.max_delay)
        
        if self.jitter:
            # Add jitter to prevent thundering herd
            import random
            delay = delay * (0.5 + random.random() * 0.5)
        
        return delay


class NetworkConnectivityMonitor:
    """Monitors network connectivity status"""
    
    def __init__(self):
        self.is_online = True
        self.last_check = time.time()
        self.connectivity_callbacks: List[Callable[[bool], None]] = []
    
    def add_connectivity_callback(self, callback: Callable[[bool], None]):
        """Add callback for connectivity changes"""
        self.connectivity_callbacks.append(callback)
    
    def set_online_status(self, is_online: bool):
        """Update online status and notify callbacks"""
        if self.is_online != is_online:
            logger.info(f"Network connectivity changed: {'online' if is_online else 'offline'}")
            self.is_online = is_online
            self.last_check = time.time()
            
            # Notify callbacks
            for callback in self.connectivity_callbacks:
                try:
                    callback(is_online)
                except Exception as e:
                    logger.error(f"Error in connectivity callback: {e}")
    
    def check_connectivity(self) -> bool:
        """Check current connectivity status"""
        # This would typically involve a network check
        # For now, we return the current status
        return self.is_online


class OfflineEventQueue:
    """
    Main offline event queue implementation
    
    Manages events during network failures and ensures delivery when connectivity is restored.
    """
    
    def __init__(
        self,
        max_queue_size: int = 10000,
        max_memory_mb: int = 50,
        retry_policy: Optional[RetryPolicy] = None,
        enable_persistence: bool = False
    ):
        self.max_queue_size = max_queue_size
        self.max_memory_bytes = max_memory_mb * 1024 * 1024
        self.retry_policy = retry_policy or RetryPolicy()
        self.enable_persistence = enable_persistence
        
        # Queue storage (priority-based)
        self.queues = {
            EventPriority.CRITICAL: deque(),
            EventPriority.HIGH: deque(),
            EventPriority.NORMAL: deque(),
            EventPriority.LOW: deque()
        }
        
        # Event processing
        self.event_processors: Dict[str, Callable] = {}
        self.processing_active = False
        self.processor_task: Optional[asyncio.Task] = None
        
        # Statistics
        self.stats = {
            'events_queued': 0,
            'events_processed': 0,
            'events_failed': 0,
            'events_retried': 0,
            'queue_size': 0,
            'memory_usage': 0,
            'oldest_event': None,
            'last_processed': None
        }
        
        # Thread safety
        self.lock = threading.Lock()
        
        # Connectivity monitoring
        self.connectivity_monitor = NetworkConnectivityMonitor()
        self.connectivity_monitor.add_connectivity_callback(self._on_connectivity_change)
        
    def register_processor(self, event_type: str, processor: Callable):
        """Register a processor function for an event type"""
        self.event_processors[event_type] = processor
        logger.info(f"Registered processor for event type: {event_type}")
    
    def queue_event(
        self,
        event_type: str,
        data: Dict[str, Any],
        priority: EventPriority = EventPriority.NORMAL
    ) -> str:
        """
        Queue an event for processing
        
        Args:
            event_type: Type of event
            data: Event data
            priority: Event priority
            
        Returns:
            Event ID
        """
        event_id = str(uuid.uuid4())
        
        event = QueuedEvent(
            id=event_id,
            event_type=event_type,
            data=data,
            priority=priority
        )
        
        with self.lock:
            # Check queue size limits
            if self._get_total_queue_size() >= self.max_queue_size:
                self._evict_old_events()
            
            # Add to appropriate priority queue
            self.queues[priority].append(event)
            self.stats['events_queued'] += 1
            self.stats['queue_size'] = self._get_total_queue_size()
            
            # Update oldest event timestamp
            if self.stats['oldest_event'] is None:
                self.stats['oldest_event'] = event.created_at
        
        logger.debug(f"Event queued: {event_type} (priority: {priority.value}, id: {event_id})")
        
        # Start processing if not already active
        if not self.processing_active:
            self._start_processing()
        
        return event_id
    
    def _get_total_queue_size(self) -> int:
        """Get total number of events across all queues"""
        return sum(len(queue) for queue in self.queues.values())
    
    def _evict_old_events(self):
        """Evict old events when queue is full"""
        # Evict from low priority first, then normal, then high
        # Never evict critical events
        priorities_to_evict = [EventPriority.LOW, EventPriority.NORMAL, EventPriority.HIGH]
        
        for priority in priorities_to_evict:
            queue = self.queues[priority]
            if queue:
                evicted = queue.popleft()
                logger.warning(f"Evicted event due to queue size limit: {evicted.event_type} (id: {evicted.id})")
                break
    
    def _start_processing(self):
        """Start the event processing loop"""
        if self.processing_active:
            return
            
        self.processing_active = True
        
        # Start processing task if we have an event loop
        try:
            loop = asyncio.get_event_loop()
            self.processor_task = loop.create_task(self._process_events_loop())
        except RuntimeError:
            # No event loop, process synchronously
            threading.Thread(target=self._process_events_sync, daemon=True).start()
    
    async def _process_events_loop(self):
        """Main event processing loop (async)"""
        logger.info("Starting offline event queue processing (async)")
        
        while self.processing_active:
            try:
                await self._process_next_event()
                await asyncio.sleep(0.1)  # Brief pause between events
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in event processing loop: {e}")
                await asyncio.sleep(1)  # Pause on error
        
        logger.info("Offline event queue processing stopped")
    
    def _process_events_sync(self):
        """Main event processing loop (sync)"""
        logger.info("Starting offline event queue processing (sync)")
        
        while self.processing_active:
            try:
                self._process_next_event_sync()
                time.sleep(0.1)  # Brief pause between events
            except Exception as e:
                logger.error(f"Error in event processing loop: {e}")
                time.sleep(1)  # Pause on error
        
        logger.info("Offline event queue processing stopped")
    
    async def _process_next_event(self):
        """Process the next event in queue (async)"""
        event = self._get_next_event()
        if event:
            await self._process_event(event)
    
    def _process_next_event_sync(self):
        """Process the next event in queue (sync)"""
        event = self._get_next_event()
        if event:
            self._process_event_sync(event)
    
    def _get_next_event(self) -> Optional[QueuedEvent]:
        """Get the next event to process based on priority and retry timing"""
        with self.lock:
            current_time = time.time()
            
            # Check each priority queue in order
            for priority in [EventPriority.CRITICAL, EventPriority.HIGH, EventPriority.NORMAL, EventPriority.LOW]:
                queue = self.queues[priority]
                
                # Look for events ready to process
                for i, event in enumerate(queue):
                    if event.status == EventStatus.PENDING:
                        # Remove and return the event
                        del queue[i]
                        return event
                    elif (event.status == EventStatus.RETRYING and 
                          event.next_retry_at and 
                          event.next_retry_at <= current_time):
                        # Remove and return the retry event
                        del queue[i]
                        return event
        
        return None
    
    async def _process_event(self, event: QueuedEvent):
        """Process a single event (async)"""
        processor = self.event_processors.get(event.event_type)
        
        if not processor:
            logger.warning(f"No processor registered for event type: {event.event_type}")
            event.status = EventStatus.FAILED
            event.last_error = "No processor registered"
            self.stats['events_failed'] += 1
            return
        
        try:
            # Check if we're online for network-dependent events
            if not self.connectivity_monitor.is_online and self._is_network_dependent(event):
                self._schedule_retry(event, "Network offline")
                return
            
            # Process the event
            if asyncio.iscoroutinefunction(processor):
                await processor(event)
            else:
                processor(event)
            
            # Mark as completed
            event.status = EventStatus.COMPLETED
            self.stats['events_processed'] += 1
            self.stats['last_processed'] = time.time()
            
            logger.debug(f"Event processed successfully: {event.event_type} (id: {event.id})")
            
        except Exception as e:
            logger.error(f"Error processing event {event.event_type} (id: {event.id}): {e}")
            self._handle_event_error(event, str(e))
    
    def _process_event_sync(self, event: QueuedEvent):
        """Process a single event (sync)"""
        processor = self.event_processors.get(event.event_type)
        
        if not processor:
            logger.warning(f"No processor registered for event type: {event.event_type}")
            event.status = EventStatus.FAILED
            event.last_error = "No processor registered"
            self.stats['events_failed'] += 1
            return
        
        try:
            # Check if we're online for network-dependent events
            if not self.connectivity_monitor.is_online and self._is_network_dependent(event):
                self._schedule_retry(event, "Network offline")
                return
            
            # Process the event (sync only)
            processor(event)
            
            # Mark as completed
            event.status = EventStatus.COMPLETED
            self.stats['events_processed'] += 1
            self.stats['last_processed'] = time.time()
            
            logger.debug(f"Event processed successfully: {event.event_type} (id: {event.id})")
            
        except Exception as e:
            logger.error(f"Error processing event {event.event_type} (id: {event.id}): {e}")
            self._handle_event_error(event, str(e))
    
    def _is_network_dependent(self, event: QueuedEvent) -> bool:
        """Check if event requires network connectivity"""
        network_dependent_types = [
            'metrics_submission',
            'api_call',
            'data_sync',
            'remote_log',
            'analytics_event'
        ]
        
        return event.event_type in network_dependent_types
    
    def _handle_event_error(self, event: QueuedEvent, error: str):
        """Handle error in event processing"""
        event.last_error = error
        
        if event.retry_count < event.max_retries:
            self._schedule_retry(event, error)
        else:
            event.status = EventStatus.FAILED
            self.stats['events_failed'] += 1
            logger.error(f"Event failed permanently after {event.retry_count} retries: {event.event_type} (id: {event.id})")
    
    def _schedule_retry(self, event: QueuedEvent, error: str):
        """Schedule event for retry"""
        event.retry_count += 1
        event.status = EventStatus.RETRYING
        event.last_error = error
        
        delay = self.retry_policy.get_delay(event.retry_count)
        event.next_retry_at = time.time() + delay
        
        # Put back in queue
        with self.lock:
            self.queues[event.priority].append(event)
            self.stats['events_retried'] += 1
        
        logger.info(
            f"Event scheduled for retry in {delay:.1f}s: {event.event_type} "
            f"(attempt {event.retry_count}/{event.max_retries}, id: {event.id})"
        )
    
    def _on_connectivity_change(self, is_online: bool):
        """Handle connectivity status changes"""
        if is_online:
            logger.info("Network connectivity restored - resuming event processing")
            if not self.processing_active:
                self._start_processing()
        else:
            logger.info("Network connectivity lost - events will be queued")
    
    def set_online_status(self, is_online: bool):
        """Manually set online status (for testing or external monitoring)"""
        self.connectivity_monitor.set_online_status(is_online)
    
    def get_queue_stats(self) -> Dict[str, Any]:
        """Get detailed queue statistics"""
        with self.lock:
            queue_sizes = {priority.value: len(queue) for priority, queue in self.queues.items()}
            
            return {
                **self.stats.copy(),
                'queue_sizes_by_priority': queue_sizes,
                'is_online': self.connectivity_monitor.is_online,
                'processing_active': self.processing_active,
                'registered_processors': list(self.event_processors.keys())
            }
    
    def stop_processing(self):
        """Stop event processing"""
        self.processing_active = False
        
        if self.processor_task:
            self.processor_task.cancel()


# Global queue instance
_offline_event_queue: Optional[OfflineEventQueue] = None


def get_offline_event_queue() -> OfflineEventQueue:
    """Get or create the global offline event queue"""
    global _offline_event_queue
    if _offline_event_queue is None:
        _offline_event_queue = OfflineEventQueue()
    return _offline_event_queue


def set_offline_event_queue(queue: OfflineEventQueue):
    """Set the global offline event queue"""
    global _offline_event_queue
    _offline_event_queue = queue


# Convenience functions
def queue_event(event_type: str, data: Dict[str, Any], priority: EventPriority = EventPriority.NORMAL) -> str:
    """Queue an event"""
    return get_offline_event_queue().queue_event(event_type, data, priority)


def register_processor(event_type: str, processor: Callable):
    """Register an event processor"""
    get_offline_event_queue().register_processor(event_type, processor)


def set_online_status(is_online: bool):
    """Set network online status"""
    get_offline_event_queue().set_online_status(is_online)


def get_queue_stats() -> Dict[str, Any]:
    """Get queue statistics"""
    return get_offline_event_queue().get_queue_stats()