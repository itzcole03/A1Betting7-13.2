"""
Event Bus - In-process pub/sub event system

Provides decoupled communication between streaming, delta propagation,
and other components through event-driven architecture.
"""

import asyncio
import weakref
from collections import defaultdict, deque
from datetime import datetime
from typing import Any, Callable, Dict, List, Optional, Union, Deque
from dataclasses import dataclass, field
import fnmatch

from backend.services.unified_logging import get_logger


@dataclass
class EventMetrics:
    """Event bus metrics tracking"""
    events_published: int = 0
    events_delivered: int = 0
    subscribers_count: int = 0
    event_types_count: int = 0
    failed_deliveries: int = 0
    last_event_timestamp: Optional[datetime] = None
    
    # Recent event history for debugging
    recent_events: Deque[Dict[str, Any]] = field(default_factory=lambda: deque(maxlen=100))


class EventBus:
    """In-process event bus with pub/sub capabilities"""
    
    def __init__(self, name: str = "global"):
        self.name = name
        self.logger = get_logger(f"event_bus.{name}")
        
        # Event subscriptions: event_type -> list of (callback, weak_ref_enabled)
        self._subscribers: Dict[str, List[tuple]] = defaultdict(list)
        
        # Wildcard subscriptions: pattern -> list of (callback, weak_ref_enabled)
        self._wildcard_subscribers: Dict[str, List[tuple]] = defaultdict(list)
        
        # Metrics
        self.metrics = EventMetrics()
        
        # Event history for debugging (optional)
        self.event_history_enabled = True
        
    def subscribe(
        self, 
        event_type: str, 
        callback: Callable[[str, Any], None], 
        use_weak_ref: bool = True
    ) -> None:
        """
        Subscribe to events
        
        Args:
            event_type: Event type to subscribe to (supports wildcards like "MARKET_*")
            callback: Callback function (event_type, payload) -> None
            use_weak_ref: Use weak reference to prevent memory leaks
        """
        if "*" in event_type or "?" in event_type:
            # Wildcard subscription
            if use_weak_ref:
                # Create weak reference with cleanup callback
                callback_ref = weakref.ref(
                    callback, 
                    lambda ref: self._cleanup_subscriber(event_type, ref, is_wildcard=True)
                )
                self._wildcard_subscribers[event_type].append((callback_ref, True))
            else:
                self._wildcard_subscribers[event_type].append((callback, False))
        else:
            # Direct subscription
            if use_weak_ref:
                callback_ref = weakref.ref(
                    callback,
                    lambda ref: self._cleanup_subscriber(event_type, ref, is_wildcard=False)
                )
                self._subscribers[event_type].append((callback_ref, True))
            else:
                self._subscribers[event_type].append((callback, False))
                
        self.metrics.subscribers_count = self._get_total_subscribers()
        self.logger.debug(f"Subscribed to {event_type}, total subscribers: {self.metrics.subscribers_count}")
        
    def unsubscribe(self, event_type: str, callback: Callable) -> bool:
        """
        Unsubscribe from events
        
        Args:
            event_type: Event type to unsubscribe from
            callback: Original callback function
            
        Returns:
            True if successfully unsubscribed
        """
        removed = False
        
        if "*" in event_type or "?" in event_type:
            # Wildcard unsubscription
            if event_type in self._wildcard_subscribers:
                original_count = len(self._wildcard_subscribers[event_type])
                self._wildcard_subscribers[event_type] = [
                    (cb, is_weak) for cb, is_weak in self._wildcard_subscribers[event_type]
                    if not ((is_weak and cb() is callback) or (not is_weak and cb is callback))
                ]
                removed = len(self._wildcard_subscribers[event_type]) < original_count
        else:
            # Direct unsubscription
            if event_type in self._subscribers:
                original_count = len(self._subscribers[event_type])
                self._subscribers[event_type] = [
                    (cb, is_weak) for cb, is_weak in self._subscribers[event_type]
                    if not ((is_weak and cb() is callback) or (not is_weak and cb is callback))
                ]
                removed = len(self._subscribers[event_type]) < original_count
                
        if removed:
            self.metrics.subscribers_count = self._get_total_subscribers()
            self.logger.debug(f"Unsubscribed from {event_type}")
            
        return removed
        
    def publish(self, event_type: str, payload: Any = None) -> int:
        """
        Publish an event
        
        Args:
            event_type: Type of event
            payload: Event payload data
            
        Returns:
            Number of subscribers that received the event
        """
        self.metrics.events_published += 1
        self.metrics.last_event_timestamp = datetime.utcnow()
        
        # Track unique event types
        if event_type not in self._subscribers.keys():
            self.metrics.event_types_count += 1
            
        # Add to history if enabled
        if self.event_history_enabled:
            self.metrics.recent_events.append({
                "event_type": event_type,
                "timestamp": self.metrics.last_event_timestamp.isoformat(),
                "payload_type": type(payload).__name__,
                "payload_size": len(str(payload)) if payload else 0
            })
        
        delivered_count = 0
        
        # Deliver to direct subscribers
        delivered_count += self._deliver_to_subscribers(
            event_type, payload, self._subscribers.get(event_type, [])
        )
        
        # Deliver to wildcard subscribers
        for pattern, subscribers in self._wildcard_subscribers.items():
            if fnmatch.fnmatch(event_type, pattern):
                delivered_count += self._deliver_to_subscribers(event_type, payload, subscribers)
        
        self.metrics.events_delivered += delivered_count
        
        self.logger.debug(
            f"Published {event_type} to {delivered_count} subscribers"
        )
        
        return delivered_count
        
    async def publish_async(self, event_type: str, payload: Any = None) -> int:
        """
        Publish an event asynchronously
        
        Args:
            event_type: Type of event  
            payload: Event payload data
            
        Returns:
            Number of subscribers that received the event
        """
        # For now, just call the sync version
        # Can be extended for truly async delivery if needed
        return self.publish(event_type, payload)
        
    def _deliver_to_subscribers(
        self, event_type: str, payload: Any, subscribers: List[tuple]
    ) -> int:
        """Deliver event to list of subscribers"""
        delivered = 0
        failed_subscribers = []
        
        for callback_or_ref, is_weak_ref in subscribers:
            try:
                if is_weak_ref:
                    # Weak reference - get the actual callback
                    callback = callback_or_ref()
                    if callback is None:
                        # Dead reference, mark for cleanup
                        failed_subscribers.append((callback_or_ref, is_weak_ref))
                        continue
                else:
                    callback = callback_or_ref
                    
                # Call the callback
                if asyncio.iscoroutinefunction(callback):
                    # Async callback - schedule it
                    asyncio.create_task(callback(event_type, payload))
                else:
                    # Sync callback - call directly
                    callback(event_type, payload)
                    
                delivered += 1
                
            except Exception as e:
                self.logger.error(f"Error delivering event {event_type} to subscriber: {e}")
                self.metrics.failed_deliveries += 1
                failed_subscribers.append((callback_or_ref, is_weak_ref))
                
        # Clean up failed subscribers
        if failed_subscribers:
            for failed_callback, is_weak in failed_subscribers:
                try:
                    subscribers.remove((failed_callback, is_weak))
                except ValueError:
                    pass  # Already removed
                    
        return delivered
        
    def _cleanup_subscriber(self, event_type: str, dead_ref: weakref.ref, is_wildcard: bool = False) -> None:
        """Clean up dead weak references"""
        try:
            if is_wildcard:
                if event_type in self._wildcard_subscribers:
                    self._wildcard_subscribers[event_type] = [
                        (cb, is_weak) for cb, is_weak in self._wildcard_subscribers[event_type]
                        if not (is_weak and cb is dead_ref)
                    ]
            else:
                if event_type in self._subscribers:
                    self._subscribers[event_type] = [
                        (cb, is_weak) for cb, is_weak in self._subscribers[event_type]
                        if not (is_weak and cb is dead_ref)
                    ]
            self.metrics.subscribers_count = self._get_total_subscribers()
        except Exception as e:
            self.logger.warning(f"Error during subscriber cleanup: {e}")
            
    def _get_total_subscribers(self) -> int:
        """Get total number of active subscribers"""
        direct_count = sum(len(subs) for subs in self._subscribers.values())
        wildcard_count = sum(len(subs) for subs in self._wildcard_subscribers.values())
        return direct_count + wildcard_count
        
    def get_subscribers_for_event(self, event_type: str) -> List[str]:
        """Get list of subscriber info for a specific event type"""
        subscribers = []
        
        # Direct subscribers
        for callback_or_ref, is_weak_ref in self._subscribers.get(event_type, []):
            try:
                if is_weak_ref:
                    callback = callback_or_ref()
                    if callback:
                        subscribers.append(f"weak:{callback.__name__}")
                else:
                    subscribers.append(f"direct:{callback_or_ref.__name__}")
            except Exception:
                subscribers.append("invalid_subscriber")
                
        # Wildcard subscribers
        for pattern, pattern_subscribers in self._wildcard_subscribers.items():
            if fnmatch.fnmatch(event_type, pattern):
                for callback_or_ref, is_weak_ref in pattern_subscribers:
                    try:
                        if is_weak_ref:
                            callback = callback_or_ref()
                            if callback:
                                subscribers.append(f"wildcard:{pattern}:{callback.__name__}")
                        else:
                            subscribers.append(f"wildcard:{pattern}:{callback_or_ref.__name__}")
                    except Exception:
                        subscribers.append(f"wildcard:{pattern}:invalid_subscriber")
                        
        return subscribers
        
    def get_metrics(self) -> EventMetrics:
        """Get event bus metrics"""
        return self.metrics
        
    def get_status(self) -> Dict[str, Any]:
        """Get comprehensive event bus status"""
        return {
            "name": self.name,
            "metrics": {
                "events_published": self.metrics.events_published,
                "events_delivered": self.metrics.events_delivered,
                "subscribers_count": self.metrics.subscribers_count,
                "event_types_count": self.metrics.event_types_count,
                "failed_deliveries": self.metrics.failed_deliveries,
                "last_event_timestamp": self.metrics.last_event_timestamp.isoformat() if self.metrics.last_event_timestamp else None
            },
            "subscriptions": {
                "direct": {event_type: len(subs) for event_type, subs in self._subscribers.items()},
                "wildcard": {pattern: len(subs) for pattern, subs in self._wildcard_subscribers.items()}
            },
            "recent_events": list(self.metrics.recent_events)
        }
        
    def clear_subscribers(self) -> None:
        """Clear all subscribers (useful for testing)"""
        self._subscribers.clear()
        self._wildcard_subscribers.clear()
        self.metrics.subscribers_count = 0
        self.logger.info("Cleared all subscribers")
        
    def clear_metrics(self) -> None:
        """Reset all metrics"""
        self.metrics = EventMetrics()
        self.logger.info("Cleared event bus metrics")


# Global event bus instance
global_event_bus = EventBus("global")


# Convenience functions for global event bus
def subscribe(event_type: str, callback: Callable, use_weak_ref: bool = True) -> None:
    """Subscribe to events on global event bus"""
    global_event_bus.subscribe(event_type, callback, use_weak_ref)
    

def unsubscribe(event_type: str, callback: Callable) -> bool:
    """Unsubscribe from events on global event bus"""
    return global_event_bus.unsubscribe(event_type, callback)
    

def publish(event_type: str, payload: Any = None) -> int:
    """Publish event to global event bus"""
    return global_event_bus.publish(event_type, payload)
    

async def publish_async(event_type: str, payload: Any = None) -> int:
    """Publish event asynchronously to global event bus"""
    return await global_event_bus.publish_async(event_type, payload)