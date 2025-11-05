"""Tiny aioredis shim for test/runtime compatibility.

This module provides a minimal, in-memory async Redis-like client that
implements the subset of the upstream API exercised by the project. It keeps
tests import-safe when the real dependency is unavailable while remaining
intentionally lightweight.
"""

from __future__ import annotations

import asyncio
import time
from typing import Any, Dict, List, Optional

_STORE: Dict[str, Any] = {}
_EXPIRY: Dict[str, float] = {}


class RedisError(Exception):
    """Base error for shim compatibility."""


class TimeoutError(RedisError):
    """Timeout placeholder matching the real client's hierarchy."""


class ConnectionPool:
    """Minimal connection-pool placeholder with a compatible API."""

    def __init__(self, url: Optional[str] = None, **kwargs: Any):
        self.url = url
        self.kwargs = kwargs

    @classmethod
    def from_url(cls, url: str, **kwargs: Any) -> "ConnectionPool":
        return cls(url=url, **kwargs)

    async def disconnect(self) -> None:
        # Real aioredis provides an async disconnect; keep the signature.
        await asyncio.sleep(0)


class Redis:
    """A tiny async Redis-like client backed by an in-memory dict."""

    def __init__(
        self,
        *args: Any,
        connection_pool: Optional[ConnectionPool] = None,
        **kwargs: Any,
    ):
        self._pool = connection_pool

    def __await__(self):  # pragma: no cover - convenience shim
        async def _coro() -> "Redis":
            return self

        return _coro().__await__()

    async def _purge_expired(self) -> None:
        now = time.time()
        expired = [key for key, ttl in _EXPIRY.items() if ttl <= now]
        for key in expired:
            _STORE.pop(key, None)
            _EXPIRY.pop(key, None)

    async def get(self, key: str) -> Optional[Any]:
        await self._purge_expired()
        return _STORE.get(key)

    async def set(
        self, key: str, value: Any, ex: Optional[int] = None, px: Optional[int] = None
    ) -> bool:
        await self._purge_expired()
        _STORE[key] = value
        ttl = None
        if ex is not None:
            ttl = float(ex)
        elif px is not None:
            ttl = float(px) / 1000.0
        if ttl is not None:
            _EXPIRY[key] = time.time() + ttl
        else:
            _EXPIRY.pop(key, None)
        return True

    async def setex(self, key: str, ttl: int, value: Any) -> bool:
        await self._purge_expired()
        _STORE[key] = value
        _EXPIRY[key] = time.time() + int(ttl)
        return True

    async def delete(self, *keys: str) -> int:
        await self._purge_expired()
        deleted = 0
        for key in keys:
            if key in _STORE:
                _STORE.pop(key, None)
                _EXPIRY.pop(key, None)
                deleted += 1
        return deleted

    async def keys(self, pattern: str) -> List[str]:
        await self._purge_expired()
        if pattern.endswith("*"):
            prefix = pattern[:-1]
            return [key for key in _STORE.keys() if key.startswith(prefix)]
        return [key for key in _STORE.keys() if key == pattern]

    async def incrby(self, key: str, amount: int = 1) -> int:
        await self._purge_expired()
        value = int(_STORE.get(key, 0)) + int(amount)
        _STORE[key] = value
        return value

    async def exists(self, key: str) -> int:
        await self._purge_expired()
        return 1 if key in _STORE else 0

    async def info(self, section: str = "memory") -> Dict[str, Any]:
        await self._purge_expired()
        return {"used_memory_human": f"{len(_STORE)} items"}

    async def disconnect(self) -> None:
        if self._pool is not None:
            await self._pool.disconnect()


StrictRedis = Redis


def from_url(url: str, *args: Any, **kwargs: Any) -> Redis:
    """Factory that emulates ``aioredis.from_url`` for the shim."""

    pool = ConnectionPool.from_url(url, **kwargs)
    return Redis(connection_pool=pool)


__all__ = [
    "Redis",
    "StrictRedis",
    "ConnectionPool",
    "RedisError",
    "TimeoutError",
    "from_url",
]
