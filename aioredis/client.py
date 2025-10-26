"""Minimal aioredis.client shim used for tests.

This shim implements a tiny, in-memory, async-compatible Redis client API
with just enough functionality for the test-suite to import and exercise
cache code. It intentionally does NOT aim for production fidelity.

Supported features (used by the codebase):
- ConnectionPool.from_url(...) -> ConnectionPool
- Redis(connection_pool=...) -> async methods: get, set, setex, delete,
  keys, exists, incrby, info
- ConnectionPool.disconnect() async

The implementation stores values in a module-global dict and supports
basic TTL semantics.
"""

import asyncio
import time
from typing import Any, Dict, List, Optional

# Simple in-memory storage and expirations
_STORE: Dict[str, Any] = {}
_EXPIRY: Dict[str, float] = {}


class ConnectionPool:
    """A tiny connection-pool placeholder with a compatible API."""

    def __init__(self, url: Optional[str] = None, **kwargs):
        self.url = url

    @classmethod
    def from_url(cls, url: str, **kwargs):
        return cls(url=url, **kwargs)

    async def disconnect(self):
        # No real connections to close in the shim
        await asyncio.sleep(0)


class Redis:
    """Minimal async Redis-like client backed by an in-memory dict."""

    def __init__(self, *args, **kwargs):
        # connection_pool accepted for compatibility
        self._loop = asyncio.get_event_loop()

    async def _purge_expired(self):
        now = time.time()
        to_delete = [k for k, t in _EXPIRY.items() if t <= now]
        for k in to_delete:
            _STORE.pop(k, None)
            _EXPIRY.pop(k, None)

    async def get(self, key: str) -> Optional[str]:
        await self._purge_expired()
        val = _STORE.get(key)
        if val is None:
            return None
        # Return serialized form (as production aioredis returns strings)
        return val

    async def set(self, key: str, value: Any):
        await self._purge_expired()
        _STORE[key] = value

    async def setex(self, key: str, seconds: int, value: Any):
        await self._purge_expired()
        _STORE[key] = value
        _EXPIRY[key] = time.time() + int(seconds)

    async def delete(self, *keys: str) -> int:
        deleted = 0
        for k in keys:
            if k in _STORE:
                _STORE.pop(k, None)
                _EXPIRY.pop(k, None)
                deleted += 1
        return deleted

    async def keys(self, pattern: str) -> List[str]:
        await self._purge_expired()
        # Very simple pattern support: '*' at end
        if pattern.endswith("*"):
            prefix = pattern[:-1]
            return [k for k in _STORE.keys() if k.startswith(prefix)]
        return [k for k in _STORE.keys() if k == pattern]

    async def exists(self, key: str) -> int:
        await self._purge_expired()
        return 1 if key in _STORE else 0

    async def incrby(self, key: str, amount: int = 1) -> int:
        await self._purge_expired()
        val = int(_STORE.get(key, 0))
        val += int(amount)
        _STORE[key] = val
        return val

    async def info(self, section: str = "memory") -> Dict[str, Any]:
        await self._purge_expired()
        # Minimal info dict
        return {"used_memory_human": f"{len(_STORE)} items"}


class StrictRedis(Redis):
    pass


class RedisError(Exception):
    pass


class TimeoutError(RedisError):
    pass


__all__ = ["Redis", "StrictRedis", "ConnectionPool", "RedisError", "TimeoutError"]
