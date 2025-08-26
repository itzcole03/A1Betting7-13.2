"""Minimal Redis client shim for tests."""
from typing import Any, Dict, Optional
import asyncio


class RedisClientShim:
    """A tiny in-memory async shim that mimics a subset of aioredis interface.

    Methods:
    - get(key)
    - set(key, value, ex=None)
    - delete(key)
    """

    def __init__(self):
        self._store: Dict[str, Any] = {}
        self._lock = asyncio.Lock()

    async def get(self, key: str) -> Optional[Any]:
        async with self._lock:
            return self._store.get(key)

    async def set(self, key: str, value: Any, ex: Optional[int] = None) -> bool:
        async with self._lock:
            self._store[key] = value
            return True

    async def delete(self, key: str) -> int:
        async with self._lock:
            return 1 if self._store.pop(key, None) is not None else 0

    # convenience sync wrapper for tests that import a sync client
    def sync_client(self):
        return self

    # Redis-like aliases used by code
    async def setex(self, key: str, ttl: int, value: Any) -> bool:
        # Note: signature varies across redis clients; we accept (key, ttl, value)
        async with self._lock:
            self._store[key] = value
            return True

    async def mget(self, keys: list) -> list:
        async with self._lock:
            return [self._store.get(k) for k in keys]

    async def mset(self, mapping: Dict[str, Any]) -> bool:
        async with self._lock:
            for k, v in mapping.items():
                self._store[k] = v
            return True

    async def keys(self, pattern: str = "*") -> list:
        async with self._lock:
            # Very simple glob: return all keys for now
            return list(self._store.keys())

    async def ping(self) -> bool:
        return True

    async def info(self) -> Dict[str, Any]:
        return {"redis_version": "shim-1.0", "used_memory_human": "0B"}

    # Minimal pubsub stub
    def pubsub(self):
        class PubSubStub:
            def __init__(self, store):
                self.store = store

            async def subscribe(self, *channels):
                return True

            async def listen(self):
                # No messages in shim mode
                if False:
                    yield None

        return PubSubStub(self._store)
