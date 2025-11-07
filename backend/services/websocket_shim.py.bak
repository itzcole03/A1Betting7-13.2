"""Minimal websocket shim for tests.

This module implements a tiny in-process PubSub-like API so websocket-dependent
routes/tests can subscribe and receive deterministic messages without real
network sockets.
"""
from typing import Any, Callable, Dict, List, Optional
import asyncio


class WebSocketShim:
    """In-memory pub/sub shim.

    Methods:
    - subscribe(topic, callback): register an async callback for messages
    - publish(topic, message): publish a message to subscribers
    - health(): simple health check
    """

    def __init__(self):
        self._subscribers: Dict[str, List[Callable[[Any], None]]] = {}
        self._lock = asyncio.Lock()

    async def subscribe(self, topic: str, callback: Callable[[Any], None]) -> None:
        async with self._lock:
            if topic not in self._subscribers:
                self._subscribers[topic] = []
            self._subscribers[topic].append(callback)

    async def unsubscribe(self, topic: str, callback: Callable[[Any], None]) -> None:
        async with self._lock:
            if topic in self._subscribers:
                try:
                    self._subscribers[topic].remove(callback)
                except ValueError:
                    pass

    async def publish(self, topic: str, message: Any) -> None:
        # copy list to avoid mutation during iteration
        async with self._lock:
            subscribers = list(self._subscribers.get(topic, []))

        for cb in subscribers:
            try:
                if asyncio.iscoroutinefunction(cb):
                    # schedule and don't await to avoid blocking
                    asyncio.create_task(cb(message))
                else:
                    # run sync callback in event loop
                    loop = asyncio.get_event_loop()
                    loop.call_soon(cb, message)
            except Exception:
                # swallow exceptions to keep tests deterministic
                pass

    def health(self) -> Dict[str, Any]:
        return {"service": "websocket-shim", "status": "healthy", "topics": list(self._subscribers.keys())}


# Singleton instance used by route fallbacks
_ws_shim: Optional[WebSocketShim] = None


def get_websocket_shim() -> WebSocketShim:
    global _ws_shim
    if _ws_shim is None:
        _ws_shim = WebSocketShim()
    return _ws_shim
