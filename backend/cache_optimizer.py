"""Advanced Caching and Performance Optimization Engine
Multi-tier caching system with intelligent cache warming, eviction policies, and performance optimization
"""

import asyncio
import gzip
import hashlib
import json
import logging
import time
from collections import defaultdict, deque
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from functools import wraps
from typing import Any, Callable, Dict, List, Optional

import numpy as np
import redis.asyncio as redis
from config import config_manager
from backend.utils.serialization_utils import safe_dumps, safe_loads

logger = logging.getLogger(__name__)


class CacheLayer(str, Enum):
    """Cache layer types"""

    L1_MEMORY = "l1_memory"  # In-memory cache (fastest)
    L2_REDIS = "l2_redis"  # Redis cache (fast, distributed)
    L3_DATABASE = "l3_database"  # Database cache (persistent)
    L4_DISK = "l4_disk"  # Disk cache (cold storage)


class CacheStrategy(str, Enum):
    """Cache eviction strategies"""

    LRU = "lru"  # Least Recently Used
    LFU = "lfu"  # Least Frequently Used
    TTL = "ttl"  # Time To Live
    RANDOM = "random"  # Random eviction
    FIFO = "fifo"  # First In First Out
    ADAPTIVE = "adaptive"  # Adaptive based on access patterns


class CompressionType(str, Enum):
    """Data compression types"""

    NONE = "none"
    GZIP = "gzip"
    ZLIB = "zlib"


@dataclass
class CacheMetrics:
    """Cache performance metrics"""

    hits: int = 0
    misses: int = 0
    evictions: int = 0
    writes: int = 0
    errors: int = 0
    total_size: int = 0
    avg_access_time: float = 0.0
    hit_rate: float = 0.0
    memory_usage: float = 0.0
    last_updated: datetime = field(default_factory=datetime.utcnow)


@dataclass
class CacheEntry:
    """Cache entry with metadata"""

    key: str
    value: Any
    created_at: datetime
    last_accessed: datetime
    access_count: int
    ttl: Optional[int]
    size: int
    compressed: bool = False
    compression_type: CompressionType = CompressionType.NONE
    metadata: Dict[str, Any] = field(default_factory=dict)

    @property
    def age(self) -> float:
        """Get entry age in seconds"""
        return (datetime.now(timezone.utc) - self.created_at).total_seconds()

    @property
    def is_expired(self) -> bool:
        """Check if entry is expired"""
        if not self.ttl:
            return False
        return self.age > self.ttl


class InMemoryCache:
    """High-performance in-memory cache with LRU eviction"""

    def __init__(self, max_size: int = 10000, max_memory_mb: int = 512):
        self.max_size = max_size
        self.max_memory_bytes = max_memory_mb * 1024 * 1024
        self.cache: Dict[str, CacheEntry] = {}
        self.access_order = deque()
        self.frequency_counter = defaultdict(int)
        self.current_memory = 0
        self.metrics = CacheMetrics()

    def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        start_time = time.time()

        try:
            if key in self.cache:
                entry = self.cache[key]

                # Check expiration
                if entry.is_expired:
                    self._evict_key(key)
                    self.metrics.misses += 1
                    return None

                # Update access info
                entry.last_accessed = datetime.now(timezone.utc)
                entry.access_count += 1
                self.frequency_counter[key] += 1

                # Move to end for LRU
                if key in self.access_order:
                    self.access_order.remove(key)
                self.access_order.append(key)

                self.metrics.hits += 1
                self._update_access_time(time.time() - start_time)

                return entry.value
            else:
                self.metrics.misses += 1
                return None

        except Exception as e:  # pylint: disable=broad-exception-caught
            self.metrics.errors += 1
            logger.error("Cache get error for key {key}: {e!s}")
            return None

    def set(
        self, key: str, value: Any, ttl: Optional[int] = None, compress: bool = False
    ) -> bool:
        """Set value in cache"""
        try:
            # Compress if requested
            actual_value = value
            compression_type = CompressionType.NONE
            compressed = False

            if compress and self._should_compress(value):
                try:
                    if isinstance(value, (dict, list)):
                        serialized = json.dumps(value).encode("utf-8")
                        actual_value = gzip.compress(serialized)
                        compression_type = CompressionType.GZIP
                        compressed = True
                    elif isinstance(value, str):
                        actual_value = gzip.compress(value.encode("utf-8"))
                        compression_type = CompressionType.GZIP
                        compressed = True
                except Exception as e:  # pylint: disable=broad-exception-caught
                    logger.warning("Compression failed for key {key}: {e!s}")

            # Calculate size
            entry_size = self._calculate_size(actual_value)

            # Check if we need to evict entries
            while (
                len(self.cache) >= self.max_size
                or self.current_memory + entry_size > self.max_memory_bytes
            ):
                if not self._evict_oldest():
                    break  # No more entries to evict

            # Create cache entry
            entry = CacheEntry(
                key=key,
                value=actual_value,
                created_at=datetime.now(timezone.utc),
                last_accessed=datetime.now(timezone.utc),
                access_count=1,
                ttl=ttl,
                size=entry_size,
                compressed=compressed,
                compression_type=compression_type,
            )

            # Remove existing entry if present
            if key in self.cache:
                self._evict_key(key)

            # Add new entry
            self.cache[key] = entry
            self.access_order.append(key)
            self.current_memory += entry_size
            self.metrics.writes += 1
            self.metrics.total_size += 1

            return True

        except Exception as e:  # pylint: disable=broad-exception-caught
            self.metrics.errors += 1
            logger.error("Cache set error for key {key}: {e!s}")
            return False

    def delete(self, key: str) -> bool:
        """Delete key from cache"""
        try:
            if key in self.cache:
                self._evict_key(key)
                return True
            return False
        except Exception as e:  # pylint: disable=broad-exception-caught
            self.metrics.errors += 1
            logger.error("Cache delete error for key {key}: {e!s}")
            return False

    def clear(self):
        """Clear all cache entries"""
        self.cache.clear()
        self.access_order.clear()
        self.frequency_counter.clear()
        self.current_memory = 0
        self.metrics = CacheMetrics()

    def _evict_key(self, key: str):
        """Evict specific key"""
        if key in self.cache:
            entry = self.cache[key]
            self.current_memory -= entry.size
            del self.cache[key]

            if key in self.access_order:
                self.access_order.remove(key)

            if key in self.frequency_counter:
                del self.frequency_counter[key]

            self.metrics.evictions += 1
            self.metrics.total_size -= 1

    def _evict_oldest(self) -> bool:
        """Evict oldest entry based on LRU"""
        if not self.access_order:
            return False

        oldest_key = self.access_order[0]
        self._evict_key(oldest_key)
        return True

    def _should_compress(self, value: Any) -> bool:
        """Determine if value should be compressed"""
        if isinstance(value, (dict, list)):
            return len(json.dumps(value)) > 1024  # Compress if > 1KB
        elif isinstance(value, str):
            return len(value) > 1024
        return False

    def _calculate_size(self, value: Any) -> int:
        """Calculate approximate size of value"""
        try:
            if isinstance(value, bytes):
                return len(value)
            elif isinstance(value, str):
                return len(value.encode("utf-8"))
            elif isinstance(value, (dict, list)):
                return len(json.dumps(value).encode("utf-8"))
            else:
                return len(str(value).encode("utf-8"))
        except:
            return 1024  # Default estimate

    def _update_access_time(self, access_time: float):
        """Update average access time"""
        total_operations = self.metrics.hits + self.metrics.misses
        if total_operations > 0:
            self.metrics.avg_access_time = (
                self.metrics.avg_access_time * (total_operations - 1) + access_time
            ) / total_operations

    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        total_operations = self.metrics.hits + self.metrics.misses
        hit_rate = (
            (self.metrics.hits / total_operations * 100) if total_operations > 0 else 0
        )

        return {
            "hits": self.metrics.hits,
            "misses": self.metrics.misses,
            "hit_rate": hit_rate,
            "evictions": self.metrics.evictions,
            "writes": self.metrics.writes,
            "errors": self.metrics.errors,
            "total_entries": len(self.cache),
            "memory_usage_mb": self.current_memory / (1024 * 1024),
            "memory_usage_percent": (self.current_memory / self.max_memory_bytes) * 100,
            "avg_access_time_ms": self.metrics.avg_access_time * 1000,
            "max_size": self.max_size,
            "max_memory_mb": self.max_memory_bytes / (1024 * 1024),
        }


class RedisCache:
    """Redis-based distributed cache"""

    def __init__(self, redis_url: str, key_prefix: str = "a1betting"):
        self.redis_url = redis_url
        self.key_prefix = key_prefix
        self.redis_client: Optional[redis.Redis] = None
        self.metrics = CacheMetrics()

    async def initialize(self):
        """Initialize Redis connection"""
        try:
            self.redis_client = redis.from_url(
                self.redis_url,
                decode_responses=True,  # Handle JSON strings
                socket_keepalive=True,
                socket_keepalive_options={},
                health_check_interval=30,
            )
            await self.redis_client.ping()
            logger.info("Redis cache connection established")
        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error(f"Failed to connect to Redis cache: {e!s}")
            raise

    def _make_key(self, key: str) -> str:
        """Create prefixed key"""
        return f"{self.key_prefix}:{key}"

    async def get(self, key: str) -> Optional[Any]:
        """Get value from Redis cache"""
        start_time = time.time()

        try:
            if not self.redis_client:
                await self.initialize()

            redis_key = self._make_key(key)
            data = await self.redis_client.get(redis_key)

            if data:
                try:
                    # Try to deserialize using safe JSON
                    value = safe_loads(data)
                    self.metrics.hits += 1
                    self._update_access_time(time.time() - start_time)
                    return value
                except Exception as e:  # pylint: disable=broad-exception-caught
                    logger.warning(
                        f"Failed to deserialize cached data for key {key}: {e!s}"
                    )
                    await self.redis_client.delete(redis_key)
                    self.metrics.errors += 1

            self.metrics.misses += 1
            return None

        except Exception as e:  # pylint: disable=broad-exception-caught
            self.metrics.errors += 1
            logger.error(f"Redis cache get error for key {key}: {e!s}")
            return None

    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Set value in Redis cache"""
        try:
            if not self.redis_client:
                await self.initialize()

            redis_key = self._make_key(key)

            # Serialize value using safe JSON
            try:
                data = safe_dumps(value)
            except Exception as e:  # pylint: disable=broad-exception-caught
                logger.error(f"Failed to serialize value for key {key}: {e!s}")
                self.metrics.errors += 1
                return False

            # Set with TTL if specified
            if ttl:
                result = await self.redis_client.setex(redis_key, ttl, data)
            else:
                result = await self.redis_client.set(redis_key, data)

            if result:
                self.metrics.writes += 1
                return True

            return False

        except Exception as e:  # pylint: disable=broad-exception-caught
            self.metrics.errors += 1
            logger.error(f"Redis cache set error for key {key}: {e!s}")
            return False

    async def delete(self, key: str) -> bool:
        """Delete key from Redis cache"""
        try:
            if not self.redis_client:
                await self.initialize()

            redis_key = self._make_key(key)
            result = await self.redis_client.delete(redis_key)
            return result > 0

        except Exception as e:  # pylint: disable=broad-exception-caught
            self.metrics.errors += 1
            logger.error("Redis cache delete error for key {key}: {e!s}")
            return False

    async def clear(self, pattern: str = "*"):
        """Clear cache entries matching pattern"""
        try:
            if not self.redis_client:
                await self.initialize()

            pattern_key = self._make_key(pattern)
            keys = await self.redis_client.keys(pattern_key)

            if keys:
                await self.redis_client.delete(*keys)
                return len(keys)

            return 0

        except Exception as e:  # pylint: disable=broad-exception-caught
            self.metrics.errors += 1
            logger.error(f"Redis cache clear error for pattern {pattern}: {e!s}")
            return 0

    async def get_stats(self) -> Dict[str, Any]:
        """Get Redis cache statistics"""
        try:
            if not self.redis_client:
                await self.initialize()

            info = await self.redis_client.info()

            total_operations = self.metrics.hits + self.metrics.misses
            hit_rate = (
                (self.metrics.hits / total_operations * 100)
                if total_operations > 0
                else 0
            )

            return {
                "hits": self.metrics.hits,
                "misses": self.metrics.misses,
                "hit_rate": hit_rate,
                "writes": self.metrics.writes,
                "errors": self.metrics.errors,
                "redis_memory_mb": info.get("used_memory", 0) / (1024 * 1024),
                "redis_keys": info.get("db0", {}).get("keys", 0),
                "redis_connections": info.get("connected_clients", 0),
                "redis_uptime": info.get("uptime_in_seconds", 0),
            }

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Failed to get Redis stats: {e!s}")
            return {"error": str(e)}

    def _update_access_time(self, access_time: float):
        """Update average access time"""
        total_operations = self.metrics.hits + self.metrics.misses
        if total_operations > 0:
            self.metrics.avg_access_time = (
                self.metrics.avg_access_time * (total_operations - 1) + access_time
            ) / total_operations


class MultiTierCache:
    """Multi-tier cache system with automatic promotion/demotion"""

    def __init__(self):
        self.l1_cache = InMemoryCache(max_size=5000, max_memory_mb=256)
        self.l2_cache = RedisCache(config_manager.get_redis_url())
        self.access_patterns = defaultdict(int)
        self.promotion_threshold = 5  # Access count for L2->L1 promotion
        self.demotion_threshold = 100  # Age in seconds for L1->L2 demotion

    async def initialize(self):
        """Initialize all cache layers"""
        await self.l2_cache.initialize()
        logger.info("Multi-tier cache system initialized")

    async def get(self, key: str) -> Optional[Any]:
        """Get value from multi-tier cache"""
        # Try L1 first (fastest)
        value = self.l1_cache.get(key)
        if value is not None:
            self.access_patterns[key] += 1
            return value

        # Try L2 (Redis)
        value = await self.l2_cache.get(key)
        if value is not None:
            self.access_patterns[key] += 1

            # Consider promoting to L1 if frequently accessed
            if self.access_patterns[key] >= self.promotion_threshold:
                self.l1_cache.set(key, value, ttl=3600)  # 1 hour in L1
                

            return value

        return None

    async def set(
        self,
        key: str,
        value: Any,
        ttl: Optional[int] = None,
        tier: Optional[CacheLayer] = None,
    ) -> bool:
        """Set value in appropriate cache tier"""
        success = False

        # If tier specified, use only that tier
        if tier == CacheLayer.L1_MEMORY:
            success = self.l1_cache.set(key, value, ttl)
        elif tier == CacheLayer.L2_REDIS:
            success = await self.l2_cache.set(key, value, ttl)
        else:
            # Auto-select tier based on value characteristics
            value_size = self._estimate_size(value)

            if value_size < 10240:  # < 10KB, use L1
                success = self.l1_cache.set(key, value, ttl)
                if not success:  # L1 full, fallback to L2
                    success = await self.l2_cache.set(key, value, ttl)
            else:  # Large values go to L2
                success = await self.l2_cache.set(key, value, ttl)

        return success

    async def delete(self, key: str) -> bool:
        """Delete key from all cache tiers"""
        l1_result = self.l1_cache.delete(key)
        l2_result = await self.l2_cache.delete(key)

        if key in self.access_patterns:
            del self.access_patterns[key]

        return l1_result or l2_result

    async def clear(self, pattern: str = "*"):
        """Clear cache entries from all tiers"""
        self.l1_cache.clear()
        await self.l2_cache.clear(pattern)
        self.access_patterns.clear()

    def _estimate_size(self, value: Any) -> int:
        """Estimate size of value"""
        try:
            if isinstance(value, bytes):
                return len(value)
            elif isinstance(value, str):
                return len(value.encode("utf-8"))
            elif isinstance(value, (dict, list)):
                return len(json.dumps(value).encode("utf-8"))
            else:
                return len(str(value).encode("utf-8"))
        except:
            return 1024  # Default estimate

    async def get_comprehensive_stats(self) -> Dict[str, Any]:
        """Get statistics from all cache tiers"""
        l1_stats = self.l1_cache.get_stats()
        l2_stats = await self.l2_cache.get_stats()

        total_hits = l1_stats["hits"] + l2_stats["hits"]
        total_misses = l1_stats["misses"] + l2_stats["misses"]
        total_operations = total_hits + total_misses

        return {
            "overall": {
                "total_hits": total_hits,
                "total_misses": total_misses,
                "overall_hit_rate": (
                    (total_hits / total_operations * 100) if total_operations > 0 else 0
                ),
                "access_patterns_tracked": len(self.access_patterns),
            },
            "l1_memory": l1_stats,
            "l2_redis": l2_stats,
            "access_distribution": {
                "highly_accessed_keys": len(
                    [
                        k
                        for k, v in self.access_patterns.items()
                        if v >= self.promotion_threshold
                    ]
                ),
                "total_tracked_keys": len(self.access_patterns),
            },
        }


class CacheWarmer:
    """Intelligent cache warming system"""

    def __init__(self, cache: MultiTierCache):
        self.cache = cache
        self.warming_strategies = {}
        self.warming_schedule = {}

    def register_warming_strategy(
        self, cache_key_pattern: str, warming_function: Callable
    ):
        """Register cache warming strategy for specific key patterns"""
        self.warming_strategies[cache_key_pattern] = warming_function
        logger.info(
            f"Registered cache warming strategy for pattern: {cache_key_pattern}"
        )

    async def warm_cache(self, patterns: Optional[List[str]] = None):
        """Warm cache for specified patterns or all registered patterns"""
        patterns = patterns or list(self.warming_strategies.keys())

        for pattern in patterns:
            if pattern in self.warming_strategies:
                try:
                    warming_func = self.warming_strategies[pattern]
                    await warming_func(self.cache)
                    logger.info("Cache warming completed for pattern: {pattern}")
                except Exception as e:  # pylint: disable=broad-exception-caught
                    logger.error("Cache warming failed for pattern {pattern}: {e!s}")

    async def schedule_warming(self, pattern: str, interval_seconds: int):
        """Schedule periodic cache warming"""
        self.warming_schedule[pattern] = interval_seconds

        async def warming_loop():
            while True:
                try:
                    await asyncio.sleep(interval_seconds)
                    if pattern in self.warming_strategies:
                        await self.warming_strategies[pattern](self.cache)
                        logger.debug(
                            f"Scheduled cache warming executed for pattern: {pattern}"
                        )
                except Exception as e:  # pylint: disable=broad-exception-caught
                    logger.error(
                        f"Scheduled cache warming failed for pattern {pattern}: {e!s}"
                    )

        # Start warming loop in background
        asyncio.create_task(warming_loop())
        logger.info(
            f"Scheduled cache warming for pattern {pattern} every {interval_seconds} seconds"
        )


def cached(
    ttl: int = 3600,
    key_generator: Optional[Callable] = None,
    tier: Optional[CacheLayer] = None,
):
    """Decorator for caching function results"""

    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate cache key
            if key_generator:
                cache_key = key_generator(*args, **kwargs)
            else:
                # Default key generation
                key_parts = [func.__name__]
                key_parts.extend([str(arg) for arg in args])
                key_parts.extend([f"{k}={v}" for k, v in sorted(kwargs.items())])
                cache_key = hashlib.md5(":".join(key_parts).encode()).hexdigest()

            # Try to get from cache
            cached_result = await ultra_cache_optimizer.cache.get(cache_key)
            if cached_result is not None:
                return cached_result

            # Execute function and cache result
            result = await func(*args, **kwargs)
            await ultra_cache_optimizer.cache.set(cache_key, result, ttl=ttl, tier=tier)

            return result

        return wrapper

    return decorator


class UltraCacheOptimizer:
    """Ultra-comprehensive cache optimization system"""

    def __init__(self):
        self.cache = MultiTierCache()
        self.cache_warmer = CacheWarmer(self.cache)
        self.performance_monitor = CachePerformanceMonitor()
        self._register_default_warming_strategies()

    async def initialize(self):
        """Initialize cache optimization system"""
        await self.cache.initialize()
        await self._setup_cache_warming()
        logger.info("Ultra cache optimizer initialized")

    def _register_default_warming_strategies(self):
        """Register default cache warming strategies"""

        async def warm_predictions(cache: MultiTierCache):
            """Warm popular prediction cache"""
            # This would typically fetch popular predictions
            popular_events = ["event_1", "event_2", "event_3"]
            for event_id in popular_events:
                cache_key = f"prediction:{event_id}"
                # Simulate prediction data
                prediction_data = {
                    "event_id": event_id,
                    "prediction": 0.65,
                    "confidence": 0.85,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                }
                await cache.set(cache_key, prediction_data, ttl=1800)

        async def warm_opportunities(cache: MultiTierCache):
            """Warm betting opportunities cache"""
            opportunity_data = {
                "total_opportunities": 25,
                "best_arbitrage": 3.2,
                "best_value_bet": 8.5,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
            await cache.set("opportunities:summary", opportunity_data, ttl=600)

        async def warm_models(cache: MultiTierCache):
            """Warm model performance cache"""
            model_data = {
                "ensemble_accuracy": 0.847,
                "model_count": 8,
                "last_training": datetime.now(timezone.utc).isoformat(),
                "performance_trend": "improving",
            }
            await cache.set("models:performance", model_data, ttl=3600)

        self.cache_warmer.register_warming_strategy("predictions:*", warm_predictions)
        self.cache_warmer.register_warming_strategy(
            "opportunities:*", warm_opportunities
        )
        self.cache_warmer.register_warming_strategy("models:*", warm_models)

    async def _setup_cache_warming(self):
        """Setup scheduled cache warming"""
        await self.cache_warmer.schedule_warming(
            "predictions:*", 900
        )  # Every 15 minutes
        await self.cache_warmer.schedule_warming(
            "opportunities:*", 300
        )  # Every 5 minutes
        await self.cache_warmer.schedule_warming("models:*", 1800)  # Every 30 minutes

    async def get_system_health(self) -> Dict[str, Any]:
        """Get comprehensive cache system health"""
        cache_stats = await self.cache.get_comprehensive_stats()

        return {
            "cache_system": cache_stats,
            "warming_strategies": len(self.cache_warmer.warming_strategies),
            "warming_schedules": len(self.cache_warmer.warming_schedule),
            "system_healthy": cache_stats["overall"]["overall_hit_rate"] > 50,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    async def optimize_cache_performance(self):
        """Perform cache performance optimization"""
        stats = await self.cache.get_comprehensive_stats()

        # If hit rate is low, trigger cache warming
        if stats["overall"]["overall_hit_rate"] < 50:
            logger.warning("Low cache hit rate detected, triggering cache warming")
            await self.cache_warmer.warm_cache()

        # If L1 cache is under-utilized, adjust promotion threshold
        l1_usage = stats["l1_memory"]["memory_usage_percent"]
        if l1_usage < 30:
            self.cache.promotion_threshold = max(2, self.cache.promotion_threshold - 1)
        elif l1_usage > 90:
            self.cache.promotion_threshold += 1

        logger.info(
            f"Cache optimization completed. Hit rate: {stats['overall']['overall_hit_rate']:.1f}%"
        )


class CachePerformanceMonitor:
    """Monitor cache performance and suggest optimizations"""

    def __init__(self):
        self.performance_history = deque(maxlen=1440)  # 24 hours at 1-minute intervals

    async def record_performance(self, cache_stats: Dict[str, Any]):
        """Record cache performance metrics"""
        timestamp = datetime.now(timezone.utc)
        performance_point = {
            "timestamp": timestamp,
            "overall_hit_rate": cache_stats["overall"]["overall_hit_rate"],
            "l1_hit_rate": cache_stats["l1_memory"]["hit_rate"],
            "l2_hit_rate": cache_stats["l2_redis"]["hit_rate"],
            "l1_memory_usage": cache_stats["l1_memory"]["memory_usage_percent"],
            "total_operations": cache_stats["overall"]["total_hits"]
            + cache_stats["overall"]["total_misses"],
        }

        self.performance_history.append(performance_point)

    def analyze_performance_trends(self) -> Dict[str, Any]:
        """Analyze cache performance trends"""
        if len(self.performance_history) < 10:
            return {"status": "insufficient_data"}

        # Calculate trends
        recent_data = list(self.performance_history)[-60:]  # Last hour
        hit_rates = [p["overall_hit_rate"] for p in recent_data]

        avg_hit_rate = np.mean(hit_rates)
        hit_rate_trend = "improving" if hit_rates[-1] > hit_rates[0] else "declining"

        # Identify bottlenecks
        bottlenecks = []
        if avg_hit_rate < 50:
            bottlenecks.append("low_overall_hit_rate")

        l1_usage = [p["l1_memory_usage"] for p in recent_data]
        if np.mean(l1_usage) > 90:
            bottlenecks.append("l1_memory_pressure")

        return {
            "status": "analysis_complete",
            "avg_hit_rate": avg_hit_rate,
            "hit_rate_trend": hit_rate_trend,
            "bottlenecks": bottlenecks,
            "recommendations": self._generate_recommendations(
                bottlenecks, avg_hit_rate
            ),
        }

    def _generate_recommendations(
        self, bottlenecks: List[str], avg_hit_rate: float
    ) -> List[str]:
        """Generate cache optimization recommendations"""
        recommendations = []

        if "low_overall_hit_rate" in bottlenecks:
            recommendations.append("Increase cache warming frequency")
            recommendations.append("Review cache TTL settings")

        if "l1_memory_pressure" in bottlenecks:
            recommendations.append("Increase L1 cache memory allocation")
            recommendations.append("Implement more aggressive eviction policy")

        if avg_hit_rate < 30:
            recommendations.append("Consider pre-computing frequently accessed data")

        return recommendations


# Global cache optimizer instance
ultra_cache_optimizer = UltraCacheOptimizer()
