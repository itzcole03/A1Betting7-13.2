"""
Portfolio Cache - Advanced caching layer for portfolio optimization components.

Implements:
- Namespaced caching with TTL support
- Pattern-based cache invalidation
- Multi-tier caching (memory + optional Redis)
- Cache warming and pre-computation
- Performance metrics and monitoring
"""

import hashlib
import json
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any, Callable, Pattern, Union
import re
import threading
import asyncio
from concurrent.futures import ThreadPoolExecutor

try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

from backend.services.unified_logging import get_logger

logger = get_logger("portfolio_cache")


@dataclass
class CacheEntry:
    """Cache entry with metadata"""
    value: Any
    created_at: datetime
    expires_at: datetime
    hit_count: int = 0
    size_bytes: int = 0
    namespace: str = "default"


@dataclass
class CacheStats:
    """Cache performance statistics"""
    hits: int = 0
    misses: int = 0
    sets: int = 0
    deletes: int = 0
    evictions: int = 0
    memory_usage_bytes: int = 0
    redis_hits: int = 0
    redis_misses: int = 0


class CacheNamespace:
    """Cache namespace constants"""
    CORRELATION = "corr"
    FACTOR_MODEL = "factor"
    COPULA = "copula" 
    MONTE_CARLO = "mc"
    OPTIMIZATION = "opt"
    EDGE_DATA = "edge"
    PROP_DATA = "prop"


class PortfolioCache:
    """
    High-performance caching layer for portfolio optimization with namespaced
    storage, TTL management, and optional Redis backend.
    """

    def __init__(
        self,
        max_memory_entries: int = 10000,
        default_ttl_sec: int = 3600,
        redis_url: Optional[str] = None,
        enable_redis: bool = True
    ):
        self.max_memory_entries = max_memory_entries
        self.default_ttl_sec = default_ttl_sec
        self.logger = logger
        
        # Memory cache
        self._memory_cache: Dict[str, CacheEntry] = {}
        self._cache_lock = threading.RLock()
        
        # Redis cache (optional)
        self._redis_client: Optional[Any] = None
        if enable_redis and REDIS_AVAILABLE and redis_url:
            try:
                self._redis_client = redis.from_url(redis_url)
                self._redis_client.ping()
                self.logger.info("Redis cache backend initialized")
            except Exception as e:
                self.logger.warning(f"Failed to initialize Redis: {e}")
                self._redis_client = None
        
        # Statistics
        self._stats = CacheStats()
        self._stats_lock = threading.Lock()
        
        # Background cleanup
        self._cleanup_executor = ThreadPoolExecutor(max_workers=1)
        self._last_cleanup = time.time()

    def get(self, key: str, default: Any = None, namespace: str = "default") -> Any:
        """
        Get value from cache.
        
        Args:
            key: Cache key
            default: Default value if not found
            namespace: Cache namespace
            
        Returns:
            Cached value or default
        """
        full_key = self._make_full_key(key, namespace)
        
        # Check memory cache first
        with self._cache_lock:
            if full_key in self._memory_cache:
                entry = self._memory_cache[full_key]
                
                # Check if expired
                if datetime.now(timezone.utc) > entry.expires_at:
                    del self._memory_cache[full_key]
                    self._update_stats(evictions=1)
                else:
                    entry.hit_count += 1
                    self._update_stats(hits=1)
                    return entry.value
        
        # Check Redis cache if available
        if self._redis_client:
            try:
                redis_value = self._redis_client.get(full_key)
                if redis_value is not None:
                    value = json.loads(redis_value)
                    self._update_stats(redis_hits=1)
                    
                    # Store in memory cache for faster access
                    self._set_memory_cache(full_key, value, self.default_ttl_sec, namespace)
                    return value
                else:
                    self._update_stats(redis_misses=1)
            except Exception as e:
                self.logger.warning(f"Redis get failed for {full_key}: {e}")
        
        self._update_stats(misses=1)
        return default

    def set(
        self,
        key: str,
        value: Any,
        ttl_sec: Optional[int] = None,
        namespace: str = "default"
    ):
        """
        Set value in cache.
        
        Args:
            key: Cache key
            value: Value to cache
            ttl_sec: Time to live in seconds
            namespace: Cache namespace
        """
        if ttl_sec is None:
            ttl_sec = self.default_ttl_sec
        
        full_key = self._make_full_key(key, namespace)
        
        # Set in memory cache
        self._set_memory_cache(full_key, value, ttl_sec, namespace)
        
        # Set in Redis cache if available
        if self._redis_client:
            try:
                serialized_value = json.dumps(value, default=self._json_serializer)
                self._redis_client.setex(full_key, ttl_sec, serialized_value)
            except Exception as e:
                self.logger.warning(f"Redis set failed for {full_key}: {e}")
        
        self._update_stats(sets=1)
        
        # Trigger cleanup if needed
        self._maybe_cleanup()

    def delete(self, key: str, namespace: str = "default") -> bool:
        """
        Delete value from cache.
        
        Args:
            key: Cache key
            namespace: Cache namespace
            
        Returns:
            True if key was deleted
        """
        full_key = self._make_full_key(key, namespace)
        
        deleted = False
        
        # Delete from memory cache
        with self._cache_lock:
            if full_key in self._memory_cache:
                del self._memory_cache[full_key]
                deleted = True
        
        # Delete from Redis cache
        if self._redis_client:
            try:
                redis_deleted = self._redis_client.delete(full_key) > 0
                deleted = deleted or redis_deleted
            except Exception as e:
                self.logger.warning(f"Redis delete failed for {full_key}: {e}")
        
        if deleted:
            self._update_stats(deletes=1)
        
        return deleted

    def invalidate(self, pattern: str, namespace: Optional[str] = None):
        """
        Invalidate cache entries matching pattern.
        
        Args:
            pattern: Pattern to match keys (supports wildcards)
            namespace: Optional namespace filter
        """
        # Convert glob pattern to regex
        regex_pattern = pattern.replace("*", ".*").replace("?", ".")
        compiled_pattern = re.compile(regex_pattern)
        
        deleted_count = 0
        
        # Invalidate memory cache
        with self._cache_lock:
            keys_to_delete = []
            for full_key in self._memory_cache:
                # Extract key and check namespace filter
                if namespace:
                    expected_prefix = f"{namespace}:"
                    if not full_key.startswith(expected_prefix):
                        continue
                    key_part = full_key[len(expected_prefix):]
                else:
                    key_part = full_key.split(":", 1)[-1] if ":" in full_key else full_key
                
                if compiled_pattern.match(key_part):
                    keys_to_delete.append(full_key)
            
            for key in keys_to_delete:
                del self._memory_cache[key]
                deleted_count += 1
        
        # Invalidate Redis cache
        if self._redis_client:
            try:
                # Get all keys matching pattern
                redis_pattern = f"{namespace}:*" if namespace else "*"
                redis_keys = self._redis_client.keys(redis_pattern)
                
                for redis_key in redis_keys:
                    key_str = redis_key.decode() if isinstance(redis_key, bytes) else str(redis_key)
                    key_part = key_str.split(":", 1)[-1] if ":" in key_str else key_str
                    
                    if compiled_pattern.match(key_part):
                        self._redis_client.delete(redis_key)
                        deleted_count += 1
                        
            except Exception as e:
                self.logger.warning(f"Redis pattern invalidation failed: {e}")
        
        if deleted_count > 0:
            self.logger.info(f"Invalidated {deleted_count} cache entries matching pattern: {pattern}")
            self._update_stats(deletes=deleted_count)

    async def get_or_set(
        self,
        key: str,
        ttl_sec: int,
        factory_func: Callable[[], Any],
        namespace: str = "default"
    ) -> Any:
        """
        Get value from cache or compute using factory function.
        
        Args:
            key: Cache key
            ttl_sec: Time to live for computed value
            factory_func: Function to compute value if not cached
            namespace: Cache namespace
            
        Returns:
            Cached or computed value
        """
        # Try to get from cache first
        value = self.get(key, namespace=namespace)
        if value is not None:
            return value
        
        # Compute value using factory function
        if asyncio.iscoroutinefunction(factory_func):
            computed_value = await factory_func()
        else:
            computed_value = factory_func()
        
        # Store in cache
        self.set(key, computed_value, ttl_sec, namespace)
        
        return computed_value

    def warm_cache(self, warm_data: Dict[str, Any], namespace: str = "default"):
        """
        Pre-populate cache with data.
        
        Args:
            warm_data: Dictionary of key-value pairs to cache
            namespace: Cache namespace
        """
        for key, value in warm_data.items():
            self.set(key, value, namespace=namespace)
        
        self.logger.info(f"Warmed cache with {len(warm_data)} entries in namespace: {namespace}")

    def clear_namespace(self, namespace: str):
        """Clear all entries in a namespace"""
        self.invalidate("*", namespace=namespace)

    def clear_all(self):
        """Clear all cache entries"""
        with self._cache_lock:
            self._memory_cache.clear()
        
        if self._redis_client:
            try:
                self._redis_client.flushdb()
            except Exception as e:
                self.logger.warning(f"Redis flush failed: {e}")
        
        self.logger.info("Cleared all cache entries")

    def get_stats(self) -> Dict[str, Any]:
        """Get cache performance statistics"""
        with self._stats_lock:
            hit_rate = (
                self._stats.hits / (self._stats.hits + self._stats.misses)
                if (self._stats.hits + self._stats.misses) > 0
                else 0.0
            )
            
            return {
                "hits": self._stats.hits,
                "misses": self._stats.misses,
                "hit_rate": hit_rate,
                "sets": self._stats.sets,
                "deletes": self._stats.deletes,
                "evictions": self._stats.evictions,
                "memory_entries": len(self._memory_cache),
                "memory_usage_bytes": self._stats.memory_usage_bytes,
                "redis_enabled": self._redis_client is not None,
                "redis_hits": self._stats.redis_hits,
                "redis_misses": self._stats.redis_misses
            }

    def get_namespace_stats(self) -> Dict[str, Dict[str, Any]]:
        """Get statistics by namespace"""
        namespace_stats = {}
        
        with self._cache_lock:
            for full_key, entry in self._memory_cache.items():
                namespace = entry.namespace
                if namespace not in namespace_stats:
                    namespace_stats[namespace] = {
                        "entries": 0,
                        "total_hits": 0,
                        "memory_bytes": 0
                    }
                
                namespace_stats[namespace]["entries"] += 1
                namespace_stats[namespace]["total_hits"] += entry.hit_count
                namespace_stats[namespace]["memory_bytes"] += entry.size_bytes
        
        return namespace_stats

    # Private methods

    def _make_full_key(self, key: str, namespace: str) -> str:
        """Create full cache key with namespace"""
        return f"{namespace}:{key}"

    def _set_memory_cache(self, full_key: str, value: Any, ttl_sec: int, namespace: str):
        """Set value in memory cache"""
        with self._cache_lock:
            # Calculate entry size (rough estimate)
            try:
                serialized = json.dumps(value, default=self._json_serializer)
                size_bytes = len(serialized.encode('utf-8'))
            except:
                size_bytes = 1000  # Rough estimate
            
            # Create cache entry
            now = datetime.now(timezone.utc)
            entry = CacheEntry(
                value=value,
                created_at=now,
                expires_at=now + timedelta(seconds=ttl_sec),
                size_bytes=size_bytes,
                namespace=namespace
            )
            
            self._memory_cache[full_key] = entry
            
            # Update memory usage stats
            self._stats.memory_usage_bytes += size_bytes
            
            # Enforce max entries limit
            if len(self._memory_cache) > self.max_memory_entries:
                self._evict_lru_entries(self.max_memory_entries // 10)  # Evict 10%

    def _evict_lru_entries(self, count: int):
        """Evict least recently used entries"""
        # Sort by hit count (LRU approximation)
        sorted_items = sorted(
            self._memory_cache.items(),
            key=lambda x: x[1].hit_count
        )
        
        evicted = 0
        for full_key, entry in sorted_items:
            if evicted >= count:
                break
            
            del self._memory_cache[full_key]
            self._stats.memory_usage_bytes -= entry.size_bytes
            evicted += 1
        
        self._update_stats(evictions=evicted)

    def _maybe_cleanup(self):
        """Trigger cleanup if needed"""
        now = time.time()
        if now - self._last_cleanup > 300:  # Cleanup every 5 minutes
            self._cleanup_executor.submit(self._cleanup_expired)
            self._last_cleanup = now

    def _cleanup_expired(self):
        """Remove expired entries"""
        now = datetime.now(timezone.utc)
        expired_keys = []
        
        with self._cache_lock:
            for full_key, entry in list(self._memory_cache.items()):
                if now > entry.expires_at:
                    expired_keys.append(full_key)
        
        # Remove expired entries
        for key in expired_keys:
            with self._cache_lock:
                if key in self._memory_cache:
                    entry = self._memory_cache[key]
                    del self._memory_cache[key]
                    self._stats.memory_usage_bytes -= entry.size_bytes
        
        if expired_keys:
            self.logger.info(f"Cleaned up {len(expired_keys)} expired cache entries")
            self._update_stats(evictions=len(expired_keys))

    def _update_stats(self, **kwargs):
        """Update cache statistics"""
        with self._stats_lock:
            for key, value in kwargs.items():
                if hasattr(self._stats, key):
                    current_value = getattr(self._stats, key)
                    setattr(self._stats, key, current_value + value)

    def _json_serializer(self, obj):
        """Custom JSON serializer for complex objects"""
        if isinstance(obj, datetime):
            return obj.isoformat()
        elif hasattr(obj, '__dict__'):
            return obj.__dict__
        raise TypeError(f"Object of type {type(obj)} is not JSON serializable")


# Global cache instance
portfolio_cache = PortfolioCache()


# Convenience functions for common caching patterns

def cache_correlation_matrix(
    prop_ids: List[int],
    matrix: List[List[float]],
    ttl_sec: int = 3600
):
    """Cache correlation matrix"""
    key = f"matrix_{hash(tuple(sorted(prop_ids)))}"
    portfolio_cache.set(key, matrix, ttl_sec, CacheNamespace.CORRELATION)


def get_cached_correlation_matrix(prop_ids: List[int]) -> Optional[List[List[float]]]:
    """Get cached correlation matrix"""
    key = f"matrix_{hash(tuple(sorted(prop_ids)))}"
    return portfolio_cache.get(key, namespace=CacheNamespace.CORRELATION)


def cache_factor_model(
    prop_ids: List[int],
    factor_model: Dict[str, Any],
    ttl_sec: int = 7200
):
    """Cache factor model"""
    key = f"model_{hash(tuple(sorted(prop_ids)))}"
    portfolio_cache.set(key, factor_model, ttl_sec, CacheNamespace.FACTOR_MODEL)


def get_cached_factor_model(prop_ids: List[int]) -> Optional[Dict[str, Any]]:
    """Get cached factor model"""
    key = f"model_{hash(tuple(sorted(prop_ids)))}"
    return portfolio_cache.get(key, namespace=CacheNamespace.FACTOR_MODEL)


def cache_monte_carlo_result(
    run_key: str,
    result: Dict[str, Any],
    ttl_sec: int = 1800
):
    """Cache Monte Carlo simulation result"""
    portfolio_cache.set(run_key, result, ttl_sec, CacheNamespace.MONTE_CARLO)


def get_cached_monte_carlo_result(run_key: str) -> Optional[Dict[str, Any]]:
    """Get cached Monte Carlo result"""
    return portfolio_cache.get(run_key, namespace=CacheNamespace.MONTE_CARLO)


def cache_optimization_result(
    optimization_key: str,
    result: Dict[str, Any],
    ttl_sec: int = 3600
):
    """Cache optimization result"""
    portfolio_cache.set(optimization_key, result, ttl_sec, CacheNamespace.OPTIMIZATION)


def get_cached_optimization_result(optimization_key: str) -> Optional[Dict[str, Any]]:
    """Get cached optimization result"""
    return portfolio_cache.get(optimization_key, namespace=CacheNamespace.OPTIMIZATION)


def invalidate_correlation_cache():
    """Invalidate all correlation cache entries"""
    portfolio_cache.clear_namespace(CacheNamespace.CORRELATION)


def invalidate_factor_model_cache():
    """Invalidate all factor model cache entries"""
    portfolio_cache.clear_namespace(CacheNamespace.FACTOR_MODEL)


def get_cache_health() -> Dict[str, Any]:
    """Get cache health status"""
    stats = portfolio_cache.get_stats()
    namespace_stats = portfolio_cache.get_namespace_stats()
    
    return {
        "status": "healthy" if stats["hit_rate"] > 0.5 else "degraded",
        "overall_stats": stats,
        "namespace_stats": namespace_stats,
        "redis_available": REDIS_AVAILABLE,
        "redis_connected": stats["redis_enabled"]
    }