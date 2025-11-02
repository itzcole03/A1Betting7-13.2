"""Deprecated Redis cache service compatibility shim.

This module keeps legacy imports working while the codebase transitions to the
unified cache facade exposed in ``backend.services.cache``. All new code should
import ``redis_cache`` from that module directly.
"""

from __future__ import annotations

import hashlib
import json
import logging
import warnings
from datetime import datetime, timezone
from functools import wraps
from typing import Any, Dict, List, Optional

from backend.services.cache import redis_cache as _unified_cache
from backend.services.unified_cache_service import UnifiedCacheService

logger = logging.getLogger(__name__)

warnings.warn(
    "backend.services.redis_cache_service is deprecated; use backend.services.cache instead.",
    DeprecationWarning,
    stacklevel=2,
)

# Cache TTL constants (in seconds) retained for backwards compatibility
CACHE_TTL = {
    "prediction_single": 1800,
    "prediction_batch": 1800,
    "betting_opportunities": 300,
    "arbitrage_opportunities": 120,
    "model_performance": 3600,
    "static_data": 86400,
    "ballpark_factors": 604800,
    "dashboard_preferences": 2592000,
}


def _build_cache_key(prefix: str, data: Any) -> str:
    if isinstance(data, (dict, list)):
        data_str = json.dumps(data, sort_keys=True, default=str)
    else:
        data_str = str(data)
    digest = hashlib.md5(data_str.encode("utf-8")).hexdigest()
    return f"a1betting:{prefix}:{digest}"


class RedisCacheService:
    """Compatibility wrapper that proxies to the unified cache facade."""

    def __init__(self) -> None:
        self._adapter = _unified_cache
        self.redis_client: Optional[Any] = None

    @staticmethod
    def _resolve_ttl(ttl: Optional[int], cache_type: Optional[str]) -> Optional[int]:
        if cache_type and cache_type in CACHE_TTL:
            return CACHE_TTL[cache_type]
        if ttl is not None:
            return ttl
        if cache_type:
            return CACHE_TTL.get(cache_type)
        return ttl

    async def _get_unified_service(self) -> Optional[UnifiedCacheService]:
        getter = getattr(self._adapter, "_get_service", None)
        if getter is None:
            return None
        service = await getter()
        if isinstance(service, UnifiedCacheService):
            return service
        return service

    async def connect(self) -> bool:
        service = await self._get_unified_service()
        self.redis_client = service
        return service is not None

    async def disconnect(self) -> None:
        service = await self._get_unified_service()
        if service and hasattr(service, "close"):
            await service.close()
        self.redis_client = None

    async def backend_name(self) -> str:
        try:
            return await self._adapter.backend_name()
        except (
            Exception
        ) as exc:  # pylint: disable=broad-except # noqa: BLE001 - defensive guard
            logger.debug("Failed to determine cache backend: %s", exc)
            return "unknown"

    async def get_metrics(self) -> Dict[str, Any]:
        try:
            return await self._adapter.get_metrics()
        except (
            Exception
        ) as exc:  # pylint: disable=broad-except # noqa: BLE001 - defensive guard
            logger.debug("Unified cache metrics unavailable: %s", exc)
            return {}

    async def get(self, key: str) -> Optional[Any]:
        return await self._adapter.get(key)

    async def set(
        self,
        key: str,
        value: Any,
        ttl: Optional[int] = None,
        cache_type: Optional[str] = None,
    ) -> bool:
        ttl_seconds = self._resolve_ttl(ttl, cache_type)
        success = await self._adapter.set(key, value, ttl=ttl_seconds)
        return bool(success)

    async def delete(self, key: str) -> bool:
        await self._adapter.delete(key)
        return True

    async def delete_pattern(self, pattern: str) -> int:
        service = await self._get_unified_service()
        if service and hasattr(service, "invalidate_pattern"):
            try:
                result = await service.invalidate_pattern(pattern)
                return int(result or 0)
            except (
                Exception
            ) as exc:  # pylint: disable=broad-except # noqa: BLE001 - defensive guard
                logger.debug("Pattern invalidation failed for %s: %s", pattern, exc)
        return 0

    async def cache_prediction_result(
        self, input_data: Dict[str, Any], result: Dict[str, Any]
    ) -> str:
        cache_key = _build_cache_key("prediction", input_data)
        cache_data = {
            "result": result,
            "input_hash": hashlib.md5(
                json.dumps(input_data, sort_keys=True).encode("utf-8")
            ).hexdigest(),
            "cached_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "ttl": CACHE_TTL["prediction_single"],
        }
        await self.set(cache_key, cache_data, cache_type="prediction_single")
        return cache_key

    async def get_prediction_result(
        self, input_data: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        cache_key = _build_cache_key("prediction", input_data)
        cached = await self.get(cache_key)
        if cached:
            expected_hash = hashlib.md5(
                json.dumps(input_data, sort_keys=True).encode("utf-8")
            ).hexdigest()
            if cached.get("input_hash") == expected_hash:
                return cached.get("result")
        return None

    async def cache_batch_predictions(
        self, batch_input: List[Dict[str, Any]], results: List[Dict[str, Any]]
    ) -> str:
        cache_key = _build_cache_key("batch_predictions", batch_input)
        cache_data = {
            "results": results,
            "batch_size": len(batch_input),
            "batch_hash": hashlib.md5(
                json.dumps(batch_input, sort_keys=True).encode("utf-8")
            ).hexdigest(),
            "cached_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "ttl": CACHE_TTL["prediction_batch"],
        }
        await self.set(cache_key, cache_data, cache_type="prediction_batch")
        return cache_key

    async def get_batch_predictions(
        self, batch_input: List[Dict[str, Any]]
    ) -> Optional[List[Dict[str, Any]]]:
        cache_key = _build_cache_key("batch_predictions", batch_input)
        cached = await self.get(cache_key)
        if cached:
            expected_hash = hashlib.md5(
                json.dumps(batch_input, sort_keys=True).encode("utf-8")
            ).hexdigest()
            if cached.get("batch_hash") == expected_hash:
                return cached.get("results")
        return None

    async def cache_betting_opportunities(
        self,
        opportunities: List[Dict[str, Any]],
        filters: Optional[Dict[str, Any]] = None,
    ) -> str:
        cache_key = _build_cache_key("betting_opps", {"filters": filters or {}})
        cache_data = {
            "opportunities": opportunities,
            "filters": filters,
            "count": len(opportunities),
            "cached_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "ttl": CACHE_TTL["betting_opportunities"],
        }
        await self.set(cache_key, cache_data, cache_type="betting_opportunities")
        return cache_key

    async def get_betting_opportunities(
        self, filters: Optional[Dict[str, Any]] = None
    ) -> Optional[List[Dict[str, Any]]]:
        cache_key = _build_cache_key("betting_opps", {"filters": filters or {}})
        cached = await self.get(cache_key)
        if cached:
            return cached.get("opportunities")
        return None

    async def invalidate_predictions(self) -> int:
        deleted = 0
        for pattern in ("a1betting:prediction:*", "a1betting:batch_predictions:*"):
            deleted += await self.delete_pattern(pattern)
        return deleted

    async def invalidate_opportunities(self) -> int:
        deleted = 0
        for pattern in ("a1betting:betting_opps:*", "a1betting:arbitrage_opps:*"):
            deleted += await self.delete_pattern(pattern)
        return deleted

    async def get_cache_stats(self) -> Dict[str, Any]:
        metrics = await self.get_metrics()
        backend = await self.backend_name()
        if not metrics:
            return {"status": "unknown", "backend": backend}
        response = {"backend": backend, **metrics}
        response.setdefault("status", "connected")
        return response


redis_cache = RedisCacheService()


async def get_redis_cache() -> RedisCacheService:
    return redis_cache


def redis_cached(cache_type: str, ttl: Optional[int] = None):
    """Legacy decorator that proxies to the unified cache facade."""

    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            cache_service = redis_cache
            cache_key = _build_cache_key(
                f"endpoint:{func.__name__}", {"args": args, "kwargs": kwargs}
            )

            cached_result = await cache_service.get(cache_key)
            if cached_result is not None:
                logger.debug("Cache hit for %s", func.__name__)
                return cached_result

            result = await func(*args, **kwargs)

            try:
                await cache_service.set(
                    cache_key,
                    result,
                    ttl=ttl,
                    cache_type=cache_type,
                )
            except (
                Exception
            ) as exc:  # pylint: disable=broad-except # noqa: BLE001 - best effort fallback
                logger.debug("Cache store failed for %s: %s", func.__name__, exc)

            return result

        return wrapper

    return decorator
