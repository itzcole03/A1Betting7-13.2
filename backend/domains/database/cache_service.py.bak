"""Domain-facing cache facade that delegates to the unified backend cache."""

from __future__ import annotations

import hashlib
import logging
from functools import wraps
from typing import Any, Callable, Dict, List, Optional

try:
    from backend.services.unified_cache_service import (
        UnifiedCacheService as CoreUnifiedCacheService,
    )
    from backend.services.unified_cache_service import unified_cache as shared_cache
except ImportError as exc:  # pragma: no cover - hard failure during import
    raise ImportError(
        "backend.services.unified_cache_service is required for domain caches"
    ) from exc

logger = logging.getLogger(__name__)


class CacheConfig:
    """Cache configuration exposed for backward compatibility."""

    CACHE_TTL_SHORT = 300
    CACHE_TTL_MEDIUM = 3600
    CACHE_TTL_LONG = 86400
    CACHE_TTL_STATIC = 604800

    PREFIX_MATCH = "match:"
    PREFIX_USER = "user:"
    PREFIX_PREDICTION = "pred:"
    PREFIX_ODDS = "odds:"
    PREFIX_STATS = "stats:"
    PREFIX_SEARCH = "search:"
    PREFIX_ANALYTICS = "analytics:"

    MAX_CACHE_SIZE = 1_000_000
    MAX_LIST_SIZE = 10_000


class UnifiedCacheService:
    """Thin domain wrapper around the shared unified cache service."""

    def __init__(
        self,
        config: Optional[CacheConfig] = None,
        delegate: Optional[CoreUnifiedCacheService] = None,
    ) -> None:
        self.config = config or CacheConfig()
        self._delegate = delegate or shared_cache

    async def initialize(self) -> Any:
        if hasattr(self._delegate, "initialize"):
            return await self._delegate.initialize()
        return None

    async def get(self, key: str, default: Any = None) -> Any:
        if hasattr(self._delegate, "get"):
            return await self._delegate.get(key, default)
        return default

    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        if hasattr(self._delegate, "set"):
            return await self._delegate.set(key, value, ttl)
        return False

    async def delete(self, key: str) -> bool:
        delete_method = getattr(self._delegate, "delete", None)
        if callable(delete_method):
            return await delete_method(key)
        clear_method = getattr(self._delegate, "clear", None)
        if callable(clear_method):
            await clear_method(key)
            return True
        return False

    async def delete_pattern(self, pattern: str) -> int:
        delete_pattern_method = getattr(self._delegate, "delete_pattern", None)
        if callable(delete_pattern_method):
            result = await delete_pattern_method(pattern)
            return int(result or 0)
        clear_method = getattr(self._delegate, "clear", None)
        if callable(clear_method):
            result = await clear_method(pattern)
            return int(result or 0)
        return 0

    async def exists(self, key: str) -> bool:
        exists_method = getattr(self._delegate, "exists", None)
        if callable(exists_method):
            return bool(await exists_method(key))
        value = await self.get(key)
        return value is not None

    async def clear(self, pattern: Optional[str] = None) -> int:
        clear_method = getattr(self._delegate, "clear", None)
        if callable(clear_method):
            result = await clear_method(pattern)
            return int(result or 0)
        return 0

    async def increment(self, key: str, amount: int = 1) -> int:
        increment_method = getattr(self._delegate, "increment", None)
        if callable(increment_method):
            return int(await increment_method(key, amount))
        raise NotImplementedError("Underlying cache does not support increment")

    async def get_metrics(self) -> Dict[str, Any]:
        metrics_method = getattr(self._delegate, "get_metrics", None)
        if callable(metrics_method):
            value = await metrics_method()
            return value or {}
        return {}

    async def get_stats(self) -> Dict[str, Any]:
        metrics = await self.get_metrics()
        hits = int(metrics.get("hits", 0))
        misses = int(metrics.get("misses", 0))
        total_requests = hits + misses
        hit_rate = (hits / total_requests * 100) if total_requests else 0.0
        enriched = {
            **metrics,
            "hits": hits,
            "misses": misses,
            "total_requests": total_requests,
            "hit_rate_percent": round(hit_rate, 2),
        }
        return enriched

    def _generate_cache_key(self, prefix: str, identifier: Any, **kwargs: Any) -> str:
        key_parts = [prefix, str(identifier)]
        if kwargs:
            sorted_kwargs = sorted(kwargs.items())
            params_str = "_".join(f"{k}={v}" for k, v in sorted_kwargs)
            key_parts.append(params_str)
        return ":".join(key_parts)

    async def cache_match(
        self, match_id: int, match_data: Dict[str, Any], ttl: Optional[int] = None
    ) -> bool:
        key = self._generate_cache_key(self.config.PREFIX_MATCH, match_id)
        return await self.set(key, match_data, ttl or self.config.CACHE_TTL_MEDIUM)

    async def get_match(self, match_id: int) -> Optional[Dict[str, Any]]:
        key = self._generate_cache_key(self.config.PREFIX_MATCH, match_id)
        return await self.get(key)

    async def cache_user_data(
        self, user_id: str, user_data: Dict[str, Any], ttl: Optional[int] = None
    ) -> bool:
        key = self._generate_cache_key(self.config.PREFIX_USER, user_id)
        return await self.set(key, user_data, ttl or self.config.CACHE_TTL_LONG)

    async def get_user_data(self, user_id: str) -> Optional[Dict[str, Any]]:
        key = self._generate_cache_key(self.config.PREFIX_USER, user_id)
        return await self.get(key)

    async def cache_prediction(
        self, match_id: int, prediction_data: Dict[str, Any], ttl: Optional[int] = None
    ) -> bool:
        key = self._generate_cache_key(self.config.PREFIX_PREDICTION, match_id)
        return await self.set(key, prediction_data, ttl or self.config.CACHE_TTL_MEDIUM)

    async def get_prediction(self, match_id: int) -> Optional[Dict[str, Any]]:
        key = self._generate_cache_key(self.config.PREFIX_PREDICTION, match_id)
        return await self.get(key)

    async def cache_odds(
        self,
        match_id: int,
        sportsbook: str,
        odds_data: Dict[str, Any],
        ttl: Optional[int] = None,
    ) -> bool:
        key = self._generate_cache_key(
            self.config.PREFIX_ODDS, match_id, sportsbook=sportsbook
        )
        return await self.set(key, odds_data, ttl or self.config.CACHE_TTL_SHORT)

    async def get_odds(
        self, match_id: int, sportsbook: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        if sportsbook:
            key = self._generate_cache_key(
                self.config.PREFIX_ODDS, match_id, sportsbook=sportsbook
            )
            return await self.get(key)
        logger.debug("Wildcard odds lookup not implemented for match_id=%s", match_id)
        return None

    async def cache_search_results(
        self, query_hash: str, results: List[Dict[str, Any]], ttl: Optional[int] = None
    ) -> bool:
        key = self._generate_cache_key(self.config.PREFIX_SEARCH, query_hash)
        return await self.set(key, results, ttl or self.config.CACHE_TTL_MEDIUM)

    async def get_search_results(
        self, query_hash: str
    ) -> Optional[List[Dict[str, Any]]]:
        key = self._generate_cache_key(self.config.PREFIX_SEARCH, query_hash)
        return await self.get(key)

    async def invalidate_match_cache(self, match_id: int) -> None:
        patterns = [
            f"{self.config.PREFIX_MATCH}{match_id}*",
            f"{self.config.PREFIX_PREDICTION}{match_id}*",
            f"{self.config.PREFIX_ODDS}{match_id}*",
        ]
        for pattern in patterns:
            await self.delete_pattern(pattern)

    async def invalidate_user_cache(self, user_id: str) -> None:
        pattern = f"{self.config.PREFIX_USER}{user_id}*"
        await self.delete_pattern(pattern)

    async def warm_cache(
        self, data_loader: Callable[[], Any], cache_key: str, ttl: int
    ) -> None:
        try:
            data = await data_loader()
        except Exception as exc:  # pragma: no cover - defensive logging
            logger.exception("Cache warm loader failed for %s: %s", cache_key, exc)
            return
        if data is None:
            return
        await self.set(cache_key, data, ttl)


def cache_result(ttl: int = 3600, key_prefix: str = "result") -> Callable:
    """Decorator that caches async function results via the domain cache."""

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            key_data = f"{func.__name__}:{args}:{sorted(kwargs.items())}"
            key_hash = hashlib.md5(key_data.encode(), usedforsecurity=False).hexdigest()
            cache_key = f"{key_prefix}:{key_hash}"

            cached = await cache_service.get(cache_key)
            if cached is not None:
                return cached

            result = await func(*args, **kwargs)
            await cache_service.set(cache_key, result, ttl)
            return result

        return wrapper

    return decorator


cache_service = UnifiedCacheService()

__all__ = [
    "CacheConfig",
    "UnifiedCacheService",
    "cache_service",
    "cache_result",
]
