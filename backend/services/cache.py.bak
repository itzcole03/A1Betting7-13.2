"""Unified-first cache wrapper with async API and resilient fallback."""

import asyncio
import json
import logging
import os
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)

try:
    from backend.services.unified_cache_service import UnifiedCacheService

    _UNIFIED_CACHE_AVAILABLE = True
except Exception:  # pragma: no cover - guard optional dependency
    UnifiedCacheService = None  # type: ignore
    _UNIFIED_CACHE_AVAILABLE = False


class _InMemoryCache:
    def __init__(self):
        self._store = {}

    async def get(self, key: str) -> Optional[Any]:
        entry = self._store.get(key)
        if not entry:
            return None
        value, expire_at = entry
        if expire_at is not None and expire_at < asyncio.get_event_loop().time():
            self._store.pop(key, None)
            return None
        return value

    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        expire_at = None
        if ttl is not None:
            expire_at = asyncio.get_event_loop().time() + ttl
        self._store[key] = (value, expire_at)

    async def delete(self, key: str) -> None:
        self._store.pop(key, None)


class _RedisCache:
    def __init__(self, redis_url: str):
        try:
            import aioredis

            self._redis = aioredis.from_url(redis_url)
        except Exception as exc:  # pragma: no cover - optional dependency
            logger.warning("aioredis not available or connection failed: %s", exc)
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
        payload = json.dumps(value)
        if ttl:
            await self._redis.set(key, payload, ex=ttl)
        else:
            await self._redis.set(key, payload)

    async def delete(self, key: str) -> None:
        if self._redis:
            await self._redis.delete(key)


def _build_legacy_cache() -> object:
    redis_url = os.getenv("REDIS_URL")
    if redis_url:
        return _RedisCache(redis_url)
    return _InMemoryCache()


class _UnifiedFirstCache:
    def __init__(self):
        self._fallback = _build_legacy_cache()
        self._service: Optional[UnifiedCacheService] = None
        self._lock = asyncio.Lock()

    async def _get_service(self) -> Optional[UnifiedCacheService]:
        if not _UNIFIED_CACHE_AVAILABLE:
            return None
        if self._service is not None:
            return self._service
        async with self._lock:
            if self._service is None and _UNIFIED_CACHE_AVAILABLE:
                try:
                    self._service = UnifiedCacheService()  # type: ignore[call-arg]
                except Exception as exc:  # pragma: no cover - defensive
                    logger.warning("Unified cache unavailable: %s", exc)
                    self._service = None
        return self._service

    async def get(self, key: str) -> Optional[Any]:
        service = await self._get_service()
        if service is not None:
            try:
                value = await service.get(key)
                if value is not None:
                    return value
            except Exception as exc:  # pragma: no cover - defensive
                logger.warning("Unified cache get failed for %s: %s", key, exc)
        if hasattr(self._fallback, "get"):
            return await self._fallback.get(key)  # type: ignore[attr-defined]
        return None

    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        service = await self._get_service()
        success = False
        if service is not None:
            try:
                success = await service.set(key, value, ttl=ttl)
            except Exception as exc:  # pragma: no cover - defensive
                logger.warning("Unified cache set failed for %s: %s", key, exc)
        if not success and hasattr(self._fallback, "set"):
            await self._fallback.set(key, value, ttl=ttl)  # type: ignore[attr-defined]
            success = True
        return success

    async def delete(self, key: str) -> None:
        service = await self._get_service()
        if service is not None:
            try:
                await service.delete(key)
                return
            except Exception as exc:  # pragma: no cover - defensive
                logger.warning("Unified cache delete failed for %s: %s", key, exc)
        if hasattr(self._fallback, "delete"):
            await self._fallback.delete(key)  # type: ignore[attr-defined]

    async def backend_name(self) -> str:
        """Return a human-friendly label for the active cache backend."""

        service = await self._get_service()
        if service is not None:
            return "unified_cache_service"
        if isinstance(self._fallback, _RedisCache):
            return "legacy_redis"
        if isinstance(self._fallback, _InMemoryCache):
            return "in_memory"
        return "unknown"

    async def get_metrics(self) -> Dict[str, Any]:
        """Expose cache metrics when the unified service supports them."""

        service = await self._get_service()
        if service is not None and hasattr(service, "get_metrics"):
            try:
                metrics = await service.get_metrics()
                if isinstance(metrics, dict):
                    return metrics
            except Exception as exc:  # pragma: no cover - defensive
                logger.debug("Unified cache metrics unavailable: %s", exc)
        return {}


redis_cache = _UnifiedFirstCache()


async def clear_local_cache() -> None:
    """Expose a helper for tests to reset the in-memory store when used."""
    fallback = getattr(redis_cache, "_fallback", None)
    if isinstance(fallback, _InMemoryCache):
        fallback._store.clear()
