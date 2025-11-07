"""Minimal shim for event_bus to satisfy tests.

This file provides a tiny in-process EventBus with the minimal
interface used by tests: `subscribe`, `unsubscribe`, `publish`,
and a global `global_event_bus` instance.

This keeps tests from failing when the full implementation isn't
available during collection.
"""
from typing import Any, Callable, Dict, List, Awaitable
import asyncio


class EventBus:
    """Lightweight async EventBus compatible with tests.

    - `subscribers`: mapping of event_type -> list[callable(payload)]
    - `event_history`: list of (event_type, payload) tuples
    - `total_events`: integer counter
    - `subscribe`, `unsubscribe`, and async `publish`
    """

    def __init__(self, name: str = "global"):
        self.name = name
        self.subscribers: Dict[str, List[Callable[[Any], Awaitable[None]]]] = {}
        self.event_history: List[Dict[str, Any]] = []
        self.total_events: int = 0
        # Simple lock to protect subscriber lists in async context
        self._lock = asyncio.Lock()

    def subscribe(self, event_type: str, callback: Callable[[Any], Awaitable[None]]) -> None:
        # Store callbacks that accept a single payload argument
        self.subscribers.setdefault(event_type, []).append(callback)

    def unsubscribe(self, event_type: str, callback: Callable[[Any], Awaitable[None]]) -> bool:
        lst = self.subscribers.get(event_type)
        if not lst:
            return False
        try:
            lst.remove(callback)
            return True
        except ValueError:
            return False

    async def publish(self, event_type: str, payload: Any = None) -> int:
        """Publish an event asynchronously to all subscribers.

        Calls subscriber(payload) for each subscriber. Appends to event_history
        and increments total_events. Returns number of delivered calls.
        """
        async with self._lock:
            subscribers = list(self.subscribers.get(event_type, []))

        # Record event (count publish attempts)
        self.event_history.append({"type": event_type, "payload": payload})

        # Every publish call counts as one event published
        self.total_events += 1

        delivered = 0
        if not subscribers:
            return delivered

        # Await all subscribers concurrently
        tasks = []
        for cb in subscribers:
            try:
                # If cb is sync, wrap it
                res = cb(payload)
                if asyncio.iscoroutine(res) or isinstance(res, Awaitable):
                    tasks.append(asyncio.ensure_future(res))
                else:
                    # sync function executed already
                    delivered += 1
            except Exception:
                # swallow subscriber errors
                continue

        if tasks:
            results = await asyncio.gather(*tasks, return_exceptions=True)
            for r in results:
                if isinstance(r, Exception):
                    # swallow
                    continue
                delivered += 1
        return delivered



# Global instance used across the codebase
global_event_bus = EventBus("global")


def subscribe(event_type: str, callback: Callable[[Any], Awaitable[None]]) -> None:
    global_event_bus.subscribe(event_type, callback)


def unsubscribe(event_type: str, callback: Callable[[Any], Awaitable[None]]) -> bool:
    return global_event_bus.unsubscribe(event_type, callback)


async def publish(event_type: str, payload: Any = None) -> int:
    return await global_event_bus.publish(event_type, payload)
