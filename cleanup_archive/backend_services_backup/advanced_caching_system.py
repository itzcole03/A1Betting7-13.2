"""
Advanced Multi-Tier Caching System for FastAPI
Implements 2024-2025 best practices for intelligent caching strategies.
"""

import asyncio
import hashlib
import json
import pickle
import time
import zlib
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional, Set, Union

try:
    import aioredis

    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

from backend.config.settings import get_settings

try:
    from backend.utils.structured_logging import app_logger, performance_logger
except ImportError:
    import logging

    app_logger = logging.getLogger("advanced_caching")
    performance_logger = logging.getLogger("performance")


class CacheLevel(Enum):
    """Cache tier levels"""

    L1_MEMORY = "l1_memory"
    L2_REDIS = "l2_redis"
    L3_DATABASE = "l3_database"


class CacheStrategy(Enum):
    """Cache strategies"""

    LRU = "lru"  # Least Recently Used
    LFU = "lfu"  # Least Frequently Used
    TTL = "ttl"  # Time To Live
    HYBRID = "hybrid"  # Combination of strategies


@dataclass
class CacheEntry:
    """Cache entry with metadata"""

    value: Any
    created_at: float
    accessed_at: float
    access_count: int = 0
    ttl: Optional[float] = None
    compressed: bool = False
    dependencies: Set[str] = field(default_factory=set)

    def is_expired(self) -> bool:
        """Check if cache entry is expired"""
        if self.ttl is None:
            return False
        return time.time() - self.created_at > self.ttl

    def touch(self):
        """Update access information"""
        self.accessed_at = time.time()
        self.access_count += 1


@dataclass
class CacheStats:
    """Cache statistics"""

    l1_hits: int = 0
    l1_misses: int = 0
    l2_hits: int = 0
    l2_misses: int = 0
    l3_hits: int = 0
    l3_misses: int = 0
    evictions: int = 0
    compressions: int = 0
    total_operations: int = 0

    @property
    def total_hits(self) -> int:
        return self.l1_hits + self.l2_hits + self.l3_hits

    @property
    def total_misses(self) -> int:
        return self.l1_misses + self.l2_misses + self.l3_misses

    @property
    def hit_ratio(self) -> float:
        total = self.total_hits + self.total_misses
        return self.total_hits / total if total > 0 else 0.0


class L1MemoryCache:
    """Level 1 memory cache with advanced eviction strategies"""

    def __init__(
        self, max_size: int = 1000, strategy: CacheStrategy = CacheStrategy.HYBRID
    ):
        self.max_size = max_size
        self.strategy = strategy
        self.cache: Dict[str, CacheEntry] = {}
        self.access_order: List[str] = []  # For LRU

    def _generate_key(self, key: str) -> str:
        """Generate cache key with hashing for long keys"""
        if len(key) > 250:  # Redis key limit
            return hashlib.md5(key.encode()).hexdigest()
        return key

    def _should_compress(self, value: Any) -> bool:
        """Determine if value should be compressed"""
        try:
            serialized = pickle.dumps(value)
            return len(serialized) > 1024  # Compress if > 1KB
        except:
            return False

    def _compress_value(self, value: Any) -> bytes:
        """Compress value for storage"""
        serialized = pickle.dumps(value)
        return zlib.compress(serialized)

    def _decompress_value(self, compressed_data: bytes) -> Any:
        """Decompress stored value"""
        decompressed = zlib.decompress(compressed_data)
        return pickle.loads(decompressed)

    def _evict_entries(self, count: int = 1):
        """Evict entries based on strategy"""
        if not self.cache:
            return

        keys_to_remove = []

        if self.strategy == CacheStrategy.LRU:
            # Remove least recently used
            keys_to_remove = self.access_order[:count]
        elif self.strategy == CacheStrategy.LFU:
            # Remove least frequently used
            sorted_keys = sorted(
                self.cache.keys(), key=lambda k: self.cache[k].access_count
            )
            keys_to_remove = sorted_keys[:count]
        elif self.strategy == CacheStrategy.TTL:
            # Remove expired entries first
            expired_keys = [k for k, entry in self.cache.items() if entry.is_expired()]
            keys_to_remove = expired_keys[:count]

            # If not enough expired entries, fall back to LRU
            if len(keys_to_remove) < count:
                remaining = count - len(keys_to_remove)
                lru_keys = [k for k in self.access_order if k not in keys_to_remove][
                    :remaining
                ]
                keys_to_remove.extend(lru_keys)
        else:  # HYBRID
            # Combination: expired first, then LFU, then LRU
            expired_keys = [k for k, entry in self.cache.items() if entry.is_expired()]
            keys_to_remove.extend(expired_keys[:count])

            if len(keys_to_remove) < count:
                remaining = count - len(keys_to_remove)
                non_expired = [k for k in self.cache.keys() if k not in keys_to_remove]
                sorted_by_freq = sorted(
                    non_expired,
                    key=lambda k: (
                        self.cache[k].access_count,
                        self.cache[k].accessed_at,
                    ),
                )
                keys_to_remove.extend(sorted_by_freq[:remaining])

        # Remove selected keys
        for key in keys_to_remove:
            self.cache.pop(key, None)
            if key in self.access_order:
                self.access_order.remove(key)

    def get(self, key: str) -> Optional[Any]:
        """Get value from L1 cache"""
        cache_key = self._generate_key(key)

        if cache_key not in self.cache:
            return None

        entry = self.cache[cache_key]

        # Check expiration
        if entry.is_expired():
            del self.cache[cache_key]
            if cache_key in self.access_order:
                self.access_order.remove(cache_key)
            return None

        # Update access info
        entry.touch()

        # Update LRU order
        if cache_key in self.access_order:
            self.access_order.remove(cache_key)
        self.access_order.append(cache_key)

        # Return decompressed value if needed
        if entry.compressed:
            return self._decompress_value(entry.value)
        return entry.value

    def set(
        self,
        key: str,
        value: Any,
        ttl: Optional[float] = None,
        dependencies: Optional[Set[str]] = None,
    ):
        """Set value in L1 cache"""
        cache_key = self._generate_key(key)

        # Check if we need to evict entries
        if len(self.cache) >= self.max_size and cache_key not in self.cache:
            self._evict_entries(1)

        # Determine if compression is beneficial
        should_compress = self._should_compress(value)
        stored_value = self._compress_value(value) if should_compress else value

        # Create cache entry
        entry = CacheEntry(
            value=stored_value,
            created_at=time.time(),
            accessed_at=time.time(),
            ttl=ttl,
            compressed=should_compress,
            dependencies=dependencies or set(),
        )

        self.cache[cache_key] = entry

        # Update LRU order
        if cache_key in self.access_order:
            self.access_order.remove(cache_key)
        self.access_order.append(cache_key)

    def delete(self, key: str):
        """Delete value from L1 cache"""
        cache_key = self._generate_key(key)
        self.cache.pop(cache_key, None)
        if cache_key in self.access_order:
            self.access_order.remove(cache_key)

    def invalidate_dependencies(self, dependency: str):
        """Invalidate all entries that depend on a specific key"""
        keys_to_remove = [
            key for key, entry in self.cache.items() if dependency in entry.dependencies
        ]
        for key in keys_to_remove:
            self.delete(key)

    def clear(self):
        """Clear all cache entries"""
        self.cache.clear()
        self.access_order.clear()

    def size(self) -> int:
        """Get current cache size"""
        return len(self.cache)


class AdvancedCachingSystem:
    """
    Advanced multi-tier caching system with intelligent strategies
    """

    def __init__(self):
        self.settings = get_settings()
        self.l1_cache = L1MemoryCache(max_size=1000, strategy=CacheStrategy.HYBRID)
        self.redis_client: Optional[aioredis.Redis] = None
        self.stats = CacheStats()
        self._warming_tasks: Set[asyncio.Task] = set()

    async def initialize(self) -> bool:
        """Initialize the caching system"""
        try:
            app_logger.info("🔄 Initializing advanced caching system...")

            # Initialize Redis if available
            if REDIS_AVAILABLE and self.settings.redis.url:
                try:
                    self.redis_client = aioredis.from_url(
                        self.settings.redis.url,
                        socket_timeout=5,
                        socket_connect_timeout=5,
                        retry_on_timeout=True,
                        health_check_interval=30,
                    )

                    # Test Redis connection
                    await self.redis_client.ping()
                    app_logger.info("✅ Redis L2 cache connected")

                except Exception as e:
                    app_logger.warning(f"⚠️ Redis L2 cache unavailable: {e}")
                    self.redis_client = None
            else:
                app_logger.info("⚠️ Redis not configured, using L1 cache only")

            app_logger.info("✅ Advanced caching system initialized")
            return True

        except Exception as e:
            app_logger.error(f"❌ Failed to initialize caching system: {e}")
            return False

    async def get(self, key: str, default: Any = None) -> Any:
        """
        Get value from cache with intelligent tier fallback
        """
        self.stats.total_operations += 1

        # Try L1 cache first
        value = self.l1_cache.get(key)
        if value is not None:
            self.stats.l1_hits += 1
            performance_logger.debug(f"L1 cache hit: {key}")
            return value

        self.stats.l1_misses += 1

        # Try L2 Redis cache
        if self.redis_client:
            try:
                cached_data = await self.redis_client.get(key)
                if cached_data:
                    # Deserialize and promote to L1
                    value = pickle.loads(cached_data)
                    self.l1_cache.set(key, value)
                    self.stats.l2_hits += 1
                    performance_logger.debug(f"L2 cache hit: {key}")
                    return value

                self.stats.l2_misses += 1
            except Exception as e:
                app_logger.warning(f"Redis cache error: {e}")
                self.stats.l2_misses += 1

        # Cache miss - return default
        return default

    async def set(
        self,
        key: str,
        value: Any,
        ttl: Optional[int] = None,
        dependencies: Optional[Set[str]] = None,
        cache_levels: Optional[List[CacheLevel]] = None,
    ):
        """
        Set value in cache with intelligent distribution
        """
        if cache_levels is None:
            cache_levels = [CacheLevel.L1_MEMORY, CacheLevel.L2_REDIS]

        # Set in L1 cache
        if CacheLevel.L1_MEMORY in cache_levels:
            self.l1_cache.set(key, value, ttl, dependencies)

        # Set in L2 Redis cache
        if CacheLevel.L2_REDIS in cache_levels and self.redis_client:
            try:
                serialized_value = pickle.dumps(value)
                if ttl:
                    await self.redis_client.setex(key, ttl, serialized_value)
                else:
                    await self.redis_client.set(key, serialized_value)
            except Exception as e:
                app_logger.warning(f"Redis cache set error: {e}")

    async def delete(self, key: str):
        """Delete from all cache levels"""
        # Delete from L1
        self.l1_cache.delete(key)

        # Delete from L2
        if self.redis_client:
            try:
                await self.redis_client.delete(key)
            except Exception as e:
                app_logger.warning(f"Redis cache delete error: {e}")

    async def invalidate_pattern(self, pattern: str):
        """Invalidate cache entries matching pattern"""
        # For L1 cache
        keys_to_remove = [key for key in self.l1_cache.cache.keys() if pattern in key]
        for key in keys_to_remove:
            self.l1_cache.delete(key)

        # For Redis
        if self.redis_client:
            try:
                keys = await self.redis_client.keys(f"*{pattern}*")
                if keys:
                    await self.redis_client.delete(*keys)
            except Exception as e:
                app_logger.warning(f"Redis pattern invalidation error: {e}")

    async def invalidate_dependencies(self, dependency: str):
        """Invalidate all entries that depend on a specific key"""
        self.l1_cache.invalidate_dependencies(dependency)

        # For Redis, we'd need to store dependency metadata
        # This is a simplified implementation
        await self.invalidate_pattern(dependency)

    async def warm_cache(
        self, warm_func: callable, keys: List[str], ttl: Optional[int] = None
    ):
        """
        Warm cache with data from a function
        """

        async def _warm_single_key(key: str):
            try:
                value = await warm_func(key)
                if value is not None:
                    await self.set(key, value, ttl)
                    performance_logger.debug(f"Cache warmed: {key}")
            except Exception as e:
                app_logger.warning(f"Cache warming failed for {key}: {e}")

        # Create warming tasks
        tasks = [asyncio.create_task(_warm_single_key(key)) for key in keys]
        self._warming_tasks.update(tasks)

        # Wait for completion
        await asyncio.gather(*tasks, return_exceptions=True)

        # Cleanup completed tasks
        self._warming_tasks = {task for task in self._warming_tasks if not task.done()}

    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        return {
            "l1_size": self.l1_cache.size(),
            "l1_hits": self.stats.l1_hits,
            "l1_misses": self.stats.l1_misses,
            "l2_hits": self.stats.l2_hits,
            "l2_misses": self.stats.l2_misses,
            "total_hits": self.stats.total_hits,
            "total_misses": self.stats.total_misses,
            "hit_ratio": round(self.stats.hit_ratio, 3),
            "total_operations": self.stats.total_operations,
            "evictions": self.stats.evictions,
            "compressions": self.stats.compressions,
        }

    async def health_check(self) -> Dict[str, Any]:
        """Perform cache system health check"""
        health = {
            "status": "healthy",
            "l1_cache": {"status": "healthy", "size": self.l1_cache.size()},
            "l2_cache": {"status": "unavailable"},
            "stats": self.get_stats(),
        }

        # Check Redis health
        if self.redis_client:
            try:
                await self.redis_client.ping()
                health["l2_cache"]["status"] = "healthy"
            except Exception as e:
                health["l2_cache"]["status"] = "unhealthy"
                health["l2_cache"]["error"] = str(e)
                health["status"] = "degraded"

        return health

    async def close(self):
        """Close caching system and cleanup resources"""
        app_logger.info("🔄 Closing advanced caching system...")

        # Cancel warming tasks
        for task in self._warming_tasks:
            task.cancel()

        if self._warming_tasks:
            await asyncio.gather(*self._warming_tasks, return_exceptions=True)

        # Close Redis connection
        if self.redis_client:
            await self.redis_client.close()

        # Clear L1 cache
        self.l1_cache.clear()

        app_logger.info("✅ Advanced caching system closed")

    async def shutdown(self):
        """Alias for close() method for consistency"""
        await self.close()

    async def clear(self):
        """Clear all cache entries"""
        # Clear L1 cache
        self.l1_cache.clear()
        self._l1_usage.clear()
        self._l1_access_times.clear()

        # Clear L2 cache if available
        if self.redis_client:
            try:
                await self.redis_client.flushall()
            except Exception as e:
                app_logger.warning(f"Error clearing L2 cache: {e}")

        # Reset statistics
        self._stats = {
            "hits": 0,
            "misses": 0,
            "sets": 0,
            "deletes": 0,
            "evictions": 0,
            "l1_hits": 0,
            "l2_hits": 0,
            "l1_misses": 0,
            "l2_misses": 0,
        }

        app_logger.info("All cache entries cleared")
        return True


# Global instance
advanced_caching_system = AdvancedCachingSystem()


# Convenience functions
async def cache_get(key: str, default: Any = None) -> Any:
    """Get value from advanced cache"""
    return await advanced_caching_system.get(key, default)


async def cache_set(key: str, value: Any, ttl: Optional[int] = None) -> None:
    """Set value in advanced cache"""
    await advanced_caching_system.set(key, value, ttl)


async def cache_delete(key: str) -> None:
    """Delete value from advanced cache"""
    await advanced_caching_system.delete(key)


async def cache_invalidate_pattern(pattern: str) -> None:
    """Invalidate cache entries matching pattern"""
    await advanced_caching_system.invalidate_pattern(pattern)
