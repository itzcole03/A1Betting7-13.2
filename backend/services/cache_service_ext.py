"""
Minimal, safe Cache Service Extension shim.

This lightweight replacement keeps the public surface used by the rest of
the codebase (get, set, delete, get_or_build, invalidate_*) but defers to
the underlying `unified_cache` implementation. It includes an env-gated
debug helper `_cse_debug` so hot-path debug emits are cheap when disabled.

This file intentionally implements a smaller subset of the original
feature-rich implementation to avoid accidental syntax issues while we
patch other noisy modules. It can be expanded later if needed.
"""

import logging
import os
import time
from typing import Any, Awaitable, Callable, Dict, List, Optional

from .unified_cache_service import unified_cache

logger = logging.getLogger(__name__)

_CSE_DEBUG = os.environ.get("CACHE_SERVICE_EXT_DEBUG", "").lower() in (
    "1",
    "true",
    "yes",
)


def _cse_debug(msg: str, *args, **kwargs):
    if _CSE_DEBUG:
        logger.debug(msg, *args, **kwargs)


class CacheServiceExt:
    """Small wrapper around `unified_cache` exposing a familiar API."""

    def __init__(self):
        self._base = unified_cache

    async def get(self, key: str, default: Any = None, **kwargs) -> Any:
        try:
            val = await self._base.get(key, default)
            if val is not None:
                _cse_debug("✅ Cache hit for key: %s", key)
                return val
            _cse_debug("🔍 Cache miss for key: %s", key)
            return default
        except Exception as e:
            logger.error("Cache get error for key %s: %s", key, e)
            return default

    async def set(
        self, key: str, value: Any, ttl_seconds: int = 3600, **kwargs
    ) -> bool:
        try:
            res = await self._base.set(key, value, ttl_seconds)
            if res:
                _cse_debug("💾 Cache set successful for key: %s", key)
            return res
        except Exception as e:
            logger.error("Cache set error for key %s: %s", key, e)
            return False

    async def delete(self, key: str, **kwargs) -> bool:
        try:
            res = await self._base.delete(key)
            if res:
                _cse_debug("🗑️ Cache delete successful for key: %s", key)
            else:
                _cse_debug("🔍 Cache key not found for delete: %s", key)
            return res
        except Exception as e:
            logger.error("Cache delete error for key %s: %s", key, e)
            return False

    async def get_or_build(
        self,
        key: str,
        builder_fn: Callable[[], Awaitable[Any]],
        ttl_seconds: int = 3600,
        **kwargs
    ) -> Any:
        # Conservative stampede protection is delegated to underlying cache.
        val = await self.get(key)
        if val is not None:
            return val
        built = await builder_fn()
        if built is not None:
            await self.set(key, built, ttl_seconds)
        return built

    async def invalidate_pattern(self, pattern: str) -> int:
        # Delegate to underlying cache if it supports clearing by pattern
        if hasattr(self._base, "clear"):
            try:
                return await self._base.clear(pattern)
            except Exception as e:
                logger.error("Pattern invalidation error for %s: %s", pattern, e)
                return 0
        return 0

    async def invalidate_namespace(self, namespace: str) -> int:
        # Treat namespace as pattern
        return await self.invalidate_pattern(namespace)

    async def warm_cache(
        self,
        patterns: List[str],
        builder_fn: Callable[[str], Awaitable[Any]],
        ttl_seconds: int = 3600,
        **kwargs
    ) -> int:
        warmed = 0
        for p in patterns:
            existing = await self.get(p)
            if existing is not None:
                _cse_debug("🔥 Cache already warm for pattern: %s", p)
                continue
            try:
                v = await builder_fn(p)
                if v is not None:
                    await self.set(p, v, ttl_seconds)
                    warmed += 1
                    _cse_debug("🔥 Warmed cache for pattern: %s", p)
            except Exception as e:
                logger.error("Failed to warm cache for %s: %s", p, e)
        logger.info("🔥 Cache warming completed: %s successful", warmed)
        return warmed

    def get_stats(self) -> Dict[str, Any]:
        # Best-effort snapshot
        try:
            if hasattr(self._base, "get_stats"):
                return self._base.get_stats()
        except Exception:
            pass
        return {}

    async def health_check(self) -> Dict[str, Any]:
        test_key = "health_check_test"
        try:
            await self.set(test_key, "ok", ttl_seconds=60)
            val = await self.get(test_key)
            await self.delete(test_key)
            return {"healthy": val is not None}
        except Exception as e:
            logger.error("Cache health check failed: %s", e)
            return {"healthy": False, "error": str(e)}

    async def close(self):
        if hasattr(self._base, "close"):
            await self._base.close()


# Global instance
cache_service_ext = CacheServiceExt()


async def get_or_build(
    key: str, builder_fn: Callable[[], Awaitable[Any]], **kwargs
) -> Any:
    return await cache_service_ext.get_or_build(key, builder_fn, **kwargs)


async def invalidate_namespace(namespace: str) -> int:
    return await cache_service_ext.invalidate_namespace(namespace)


async def invalidate_pattern(pattern: str) -> int:
    return await cache_service_ext.invalidate_pattern(pattern)


def get_cache_stats() -> Dict[str, Any]:
    return cache_service_ext.get_stats()
