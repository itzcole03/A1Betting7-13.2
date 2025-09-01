"""Simple Redis cache wrapper with async API and in-memory fallback.

Provides `redis_cache.get` and `redis_cache.set` used by the scheduler.
"""
import asyncio
import json
import os
import logging
from typing import Any, Optional

logger = logging.getLogger(__name__)


class _InMemoryCache:
    def __init__(self):
        self._store = {}

    async def get(self, key: str) -> Optional[Any]:
        entry = self._store.get(key)
        if not entry:
            return None
        value, expire_at = entry
        if expire_at is not None and expire_at < asyncio.get_event_loop().time():
            del self._store[key]
            return None
        return value

    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        expire_at = None
        if ttl is not None:
            expire_at = asyncio.get_event_loop().time() + ttl
        self._store[key] = (value, expire_at)


class _RedisCache:
    def __init__(self, redis_url: str):
        try:
            import aioredis

            self._redis = aioredis.from_url(redis_url)
        except Exception as e:
            logger.warning(f"aioredis not available or connection failed: {e}")
            self._redis = None

    async def get(self, key: str) -> Optional[Any]:
        if not self._redis:
            return None
        val = await self._redis.get(key)
        if val is None:
            return None
        try:
            return json.loads(val)
        except Exception:
            return val

    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        if not self._redis:
            return
        v = json.dumps(value)
        if ttl:
            await self._redis.set(key, v, ex=ttl)
        else:
            await self._redis.set(key, v)


_CACHE: Optional[object] = None


def _init_cache() -> object:
    global _CACHE
    if _CACHE is not None:
        return _CACHE
    redis_url = os.getenv("REDIS_URL")
    if redis_url:
        c = _RedisCache(redis_url)
        _CACHE = c
        return c
    else:
        _CACHE = _InMemoryCache()
        return _CACHE


redis_cache = _init_cache()
