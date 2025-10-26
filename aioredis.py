"""Tiny aioredis shim for test/runtime compatibility.

This module provides a minimal, in-memory async Redis-like client that
implements the small surface area used by the project tests and services.

It intentionally does NOT implement the full aioredis package; it's a
low-risk fallback so tests that import ``aioredis`` or call
``await aioredis.from_url(...)`` don't fail at collection time.
"""

import asyncio
from typing import Any, Dict, Iterable, List, Optional


class _InMemoryPool:
    def __init__(self, redis_client: "Redis"):
        self._client = redis_client

    async def disconnect(self):
        # no-op for in-memory
        return None


class Redis:
    """A tiny async Redis-like client backed by a dict.

    Methods are async to mirror aioredis usage in the codebase.
    This is not feature complete and optimised only for tests.
    """

    def __init__(self, *args, **kwargs):
        # Each Redis instance gets its own store. That's fine for tests.
        self._store: Dict[str, Any] = {}

    # Basic get/set
    async def get(self, key: str) -> Optional[str]:
        return self._store.get(key)

    async def set(self, key: str, value: Any) -> bool:
        self._store[key] = value
        return True

    async def setex(self, key: str, ttl: int, value: Any) -> bool:
        # TTL is ignored for the shim
        self._store[key] = value
        return True

    async def delete(self, *keys: str) -> int:
        deleted = 0
        for k in keys:
            if k in self._store:
                del self._store[k]
                deleted += 1
        return deleted

    async def keys(self, pattern: str) -> List[str]:
        # Support simple prefix* patterns used in the codebase
        if pattern.endswith("*"):
            prefix = pattern[:-1]
            return [k for k in self._store.keys() if k.startswith(prefix)]
        return [k for k in self._store.keys() if k == pattern]

    async def incrby(self, key: str, amount: int = 1) -> int:
        current = int(self._store.get(key, 0))
        current += amount
        self._store[key] = current
        return current

    async def exists(self, key: str) -> int:
        return 1 if key in self._store else 0

    async def info(self, section: str = "memory") -> Dict[str, Any]:
        # Return a tiny compatible dict
        return {"used_memory_human": "0B"}

    async def disconnect(self):
        # No persistent connections in shim
        return None


class ConnectionPool:
    """Minimal pool object exposing from_url() used by the codebase."""

    @classmethod
    def from_url(cls, url: str, *args, **kwargs):
        # Return a pool that references a Redis instance. Not async so callers
        # that call ConnectionPool.from_url(...) can use it synchronously.
        return _InMemoryPool(Redis())


async def from_url(url: str, *args, **kwargs) -> Redis:
    """Async factory function to mimic aioredis.from_url.

    Usage in the repo sometimes does: `await aioredis.from_url(...)`.
    """
    return Redis()


# Backwards-compatible names exported by aioredis package
StrictRedis = Redis

__all__ = ["Redis", "StrictRedis", "ConnectionPool", "from_url"]
