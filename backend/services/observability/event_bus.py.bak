"""
Observability Event Bus (PR11)

In-memory publish/subscribe abstraction for unified structured events across the system.
Provides ring buffer storage with filtering capabilities for the last N events.
Used by HTTP, WebSocket, inference audit, drift monitoring, cache operations, and legacy usage tracking.
"""

import time
import threading
import os
from collections import deque
from typing import Any, Callable, Optional, Dict, List, Literal
from datetime import datetime, timezone
from dataclasses import dataclass, asdict
import logging
import json

logger = logging.getLogger(__name__)

# Event types supported by the system
EventType = Literal[
    "http.request",
    "ws.message.out", 
    "ws.message.in",
    "inference.audit",
    "drift.status", 
    "cache.rebuild",
    "legacy.usage"
]

Event = Dict[str, Any]
Subscriber = Callable[[Event], None]

@dataclass
class ObservabilityEvent:
    """Normalized observability event structure"""
    event_type: EventType
    timestamp: float
    request_id: Optional[str] = None
    trace_span: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        result = asdict(self)
        # Convert timestamp to ISO format for better readability
        result["timestamp_iso"] = datetime.fromtimestamp(self.timestamp, tz=timezone.utc).isoformat()
        return result


class ObservabilityEventBus:
    """
    In-memory publish/subscribe event bus with ring buffer storage.
    
    Features:
    - Thread-safe operations using locks
    - Ring buffer with configurable size (FIFO eviction)
    - Topic-based subscription system
    - Event filtering by type and other criteria
    - O(1) performance for publish operations
    - Chronological ordering (descending by default)
    """
    
    def __init__(self, buffer_size: Optional[int] = None):
        """
        Initialize event bus.
        
        Args:
            buffer_size: Maximum events to store. Defaults to A1_EVENT_BUS_BUFFER env var or 500.
        """
        self.buffer_size = buffer_size or int(os.environ.get("A1_EVENT_BUS_BUFFER", "500"))
        
        # Thread-safe ring buffer for event storage
        self._events: deque[ObservabilityEvent] = deque(maxlen=self.buffer_size)
        self._lock = threading.RLock()
        
        # Subscriber management by topic
        self._subscribers: Dict[EventType, List[Subscriber]] = {
            "http.request": [],
            "ws.message.out": [],
            "ws.message.in": [],
            "inference.audit": [],
            "drift.status": [],
            "cache.rebuild": [],
            "legacy.usage": []
        }
        
        # Statistics for monitoring
        self._stats = {
            "total_published": 0,
            "total_subscribers": 0,
            "buffer_full_count": 0,
            "last_publish_time": None
        }
        
        logger.info(f"ObservabilityEventBus initialized with buffer_size={self.buffer_size}")
    
    def publish(self, event_type: EventType, data: Optional[Dict[str, Any]] = None, 
                request_id: Optional[str] = None, trace_span: Optional[str] = None) -> None:
        """
        Publish event to the bus.
        
        Args:
            event_type: Type of event being published
            data: Optional event data payload
            request_id: Optional request ID for correlation
            trace_span: Optional trace span ID for correlation
        """
        try:
            with self._lock:
                # Check if buffer is full before adding
                if len(self._events) >= self.buffer_size - 1:
                    self._stats["buffer_full_count"] += 1
                
                # Create normalized event
                event = ObservabilityEvent(
                    event_type=event_type,
                    timestamp=time.time(),
                    request_id=request_id,
                    trace_span=trace_span,
                    data=data or {}
                )
                
                # Add to ring buffer (automatic FIFO eviction)
                self._events.append(event)
                
                # Update statistics
                self._stats["total_published"] += 1
                self._stats["last_publish_time"] = event.timestamp
                
                # Notify subscribers asynchronously (non-blocking)
                self._notify_subscribers(event_type, event)
                
        except Exception as e:
            logger.error(f"Failed to publish event {event_type}: {e}")
    
    def subscribe(self, event_type: EventType, callback: Subscriber) -> None:
        """
        Subscribe to events of a specific type.
        
        Args:
            event_type: Type of events to subscribe to
            callback: Function to call when events are published
        """
        try:
            with self._lock:
                if event_type not in self._subscribers:
                    self._subscribers[event_type] = []
                
                self._subscribers[event_type].append(callback)
                self._stats["total_subscribers"] += 1
                
                logger.debug(f"New subscriber added for {event_type}. Total: {len(self._subscribers[event_type])}")
                
        except Exception as e:
            logger.error(f"Failed to subscribe to {event_type}: {e}")
    
    def unsubscribe(self, event_type: EventType, callback: Subscriber) -> bool:
        """
        Unsubscribe from events of a specific type.
        
        Args:
            event_type: Type of events to unsubscribe from  
            callback: Callback function to remove
            
        Returns:
            True if callback was found and removed, False otherwise
        """
        try:
            with self._lock:
                if event_type in self._subscribers and callback in self._subscribers[event_type]:
                    self._subscribers[event_type].remove(callback)
                    self._stats["total_subscribers"] -= 1
                    logger.debug(f"Subscriber removed from {event_type}")
                    return True
                return False
                
        except Exception as e:
            logger.error(f"Failed to unsubscribe from {event_type}: {e}")
            return False
    
    def get_events(self, limit: int = 100, event_type: Optional[EventType] = None,
                   request_id: Optional[str] = None, descending: bool = True) -> List[Dict[str, Any]]:
        """
        Get events from the buffer with optional filtering.
        
        Args:
            limit: Maximum number of events to return
            event_type: Optional filter by event type
            request_id: Optional filter by request ID
            descending: If True, return newest events first (chronological descending)
            
        Returns:
            List of event dictionaries
        """
        try:
            with self._lock:
                # Convert deque to list for filtering and sorting
                events_list = list(self._events)
                
                # Apply filters
                filtered_events = []
                for event in events_list:
                    if event_type and event.event_type != event_type:
                        continue
                    if request_id and event.request_id != request_id:
                        continue
                    filtered_events.append(event)
                
                # Sort by timestamp (descending = newest first)
                filtered_events.sort(key=lambda e: e.timestamp, reverse=descending)
                
                # Apply limit
                limited_events = filtered_events[:limit]
                
                # Convert to dictionaries
                return [event.to_dict() for event in limited_events]
                
        except Exception as e:
            logger.error(f"Failed to get events: {e}")
            return []
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Get event bus statistics.
        
        Returns:
            Dictionary containing bus statistics
        """
        with self._lock:
            return {
                **self._stats.copy(),
                "current_buffer_size": len(self._events),
                "max_buffer_size": self.buffer_size,
                "active_subscriber_count": sum(len(subs) for subs in self._subscribers.values()),
                "subscriber_breakdown": {topic: len(subs) for topic, subs in self._subscribers.items()}
            }
    
    def clear_events(self) -> int:
        """
        Clear all events from the buffer.
        
        Returns:
            Number of events that were cleared
        """
        with self._lock:
            count = len(self._events)
            self._events.clear()
            logger.info(f"Cleared {count} events from event bus buffer")
            return count
    
    def _notify_subscribers(self, event_type: EventType, event: ObservabilityEvent) -> None:
        """
        Notify all subscribers for an event type (internal method).
        
        Args:
            event_type: Type of event
            event: Event to send to subscribers
        """
        try:
            subscribers = self._subscribers.get(event_type, [])
            if not subscribers:
                return
            
            # Convert event to dictionary for subscribers
            event_dict = event.to_dict()
            
            # Notify each subscriber (catch individual subscriber errors)
            for subscriber in subscribers:
                try:
                    subscriber(event_dict)
                except Exception as e:
                    logger.error(f"Subscriber callback failed for {event_type}: {e}")
                    
        except Exception as e:
            logger.error(f"Failed to notify subscribers for {event_type}: {e}")


# Global event bus instance (singleton pattern)
_event_bus_instance: Optional[ObservabilityEventBus] = None
_instance_lock = threading.Lock()


def get_event_bus() -> ObservabilityEventBus:
    """
    Get the global event bus instance (singleton).
    
    Returns:
        ObservabilityEventBus instance
    """
    global _event_bus_instance
    
    if _event_bus_instance is None:
        with _instance_lock:
            # Double-check pattern
            if _event_bus_instance is None:
                _event_bus_instance = ObservabilityEventBus()
    
    return _event_bus_instance


# Convenience functions for common operations
def publish_event(event_type: EventType, data: Optional[Dict[str, Any]] = None,
                 request_id: Optional[str] = None, trace_span: Optional[str] = None) -> None:
    """Publish event using global event bus"""
    get_event_bus().publish(event_type, data, request_id, trace_span)


def subscribe_to_events(event_type: EventType, callback: Subscriber) -> None:
    """Subscribe to events using global event bus"""
    get_event_bus().subscribe(event_type, callback)


def get_recent_events(limit: int = 100, event_type: Optional[EventType] = None,
                     request_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Get recent events using global event bus"""
    return get_event_bus().get_events(limit, event_type, request_id)


def get_event_bus_stats() -> Dict[str, Any]:
    """Get event bus statistics using global event bus"""
    return get_event_bus().get_stats()


# Module-level initialization
event_bus = get_event_bus()