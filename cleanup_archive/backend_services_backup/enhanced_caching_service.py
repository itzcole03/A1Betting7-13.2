"""
Enhanced Caching Service for A1Betting Backend

Provides intelligent caching with TTL management, cache warming,
and performance optimization for API responses and database queries.
"""

import asyncio
import json
import time
from datetime import datetime, timedelta
from typing import Any, Callable, Dict, List, Optional, Union

import redis.asyncio as redis

from backend.config_manager import A1BettingConfig
from backend.utils.enhanced_logging import get_logger

logger = get_logger("caching_service")


class CacheService:
    """Enhanced caching service with Redis backend and in-memory fallback"""

    def __init__(self):
        self.config = A1BettingConfig()
        self._redis_pool: Optional[redis.ConnectionPool] = None
        self._memory_cache: Dict[str, Any] = {}  # In-memory fallback
        self._memory_cache_ttl: Dict[str, float] = {}  # TTL tracking for memory cache
        self._use_memory_fallback = False
        self._cache_stats = {
            "hits": 0,
            "misses": 0,
            "sets": 0,
            "deletes": 0,
            "errors": 0,
        }
        self._warming_tasks: Dict[str, asyncio.Task] = {}

    async def initialize(self) -> None:
        """Initialize Redis connection pool with fallback to memory cache"""
        try:
            self._redis_pool = redis.ConnectionPool.from_url(
                self.config.redis_url,
                max_connections=20,
                retry_on_timeout=True,
                socket_keepalive=True,
                socket_keepalive_options={},
                health_check_interval=30,
            )

            # Test connection
            redis_client = redis.Redis(connection_pool=self._redis_pool)
            await redis_client.ping()

            logger.info("✅ Cache service initialized with Redis")

        except Exception as e:
            logger.warning(
                f"⚠️ Redis not available, using in-memory cache fallback: {e}"
            )
            self._use_memory_fallback = True
            self._redis_pool = None
            logger.info("✅ Cache service initialized with memory fallback")

    def get_redis(self) -> redis.Redis:
        """Get Redis client from pool"""
        if self._use_memory_fallback:
            raise RuntimeError("Using memory fallback, Redis not available")
        if not self._redis_pool:
            raise RuntimeError("Cache service not initialized")
        return redis.Redis(connection_pool=self._redis_pool)

    async def get(self, key: str, default: Any = None) -> Any:
        """Get value from cache with deserialization"""
        try:
            if self._use_memory_fallback:
                # Use memory cache
                if key in self._memory_cache:
                    # Check TTL
                    if (
                        key in self._memory_cache_ttl
                        and time.time() > self._memory_cache_ttl[key]
                    ):
                        del self._memory_cache[key]
                        del self._memory_cache_ttl[key]
                        self._cache_stats["misses"] += 1
                        logger.debug(f"🔍 Cache miss (expired) for key: {key}")
                        return default

                    self._cache_stats["hits"] += 1
                    logger.debug(f"✅ Cache hit (memory) for key: {key}")
                    return self._memory_cache[key]
                else:
                    self._cache_stats["misses"] += 1
                    logger.debug(f"🔍 Cache miss (memory) for key: {key}")
                    return default
            else:
                # Use Redis
                redis_client = self.get_redis()
                value = await redis_client.get(key)

                if value is None:
                    self._cache_stats["misses"] += 1
                    logger.debug(f"🔍 Cache miss for key: {key}")
                    return default

                self._cache_stats["hits"] += 1
                logger.debug(f"✅ Cache hit for key: {key}")

                # Try to deserialize JSON
                try:
                    return json.loads(value.decode("utf-8"))
                except (json.JSONDecodeError, UnicodeDecodeError):
                    return value.decode("utf-8")

        except Exception as e:
            self._cache_stats["errors"] += 1
            logger.error(f"❌ Cache get error for key {key}", exc_info=e)
            return default

    async def set(
        self, key: str, value: Any, ttl_seconds: int = 3600, serialize: bool = True
    ) -> bool:
        """Set value in cache with optional serialization"""
        try:
            if self._use_memory_fallback:
                # Use memory cache
                if serialize and not isinstance(value, (str, bytes)):
                    stored_value = value  # Store original object in memory
                else:
                    stored_value = value

                self._memory_cache[key] = stored_value
                self._memory_cache_ttl[key] = time.time() + ttl_seconds

                self._cache_stats["sets"] += 1
                logger.debug(
                    f"💾 Cache set (memory) for key: {key} (TTL: {ttl_seconds}s)"
                )
                return True
            else:
                # Use Redis
                redis_client = self.get_redis()
                if serialize and not isinstance(value, (str, bytes)):
                    value = json.dumps(value, default=str)
                elif isinstance(value, bytes):
                    pass  # Keep as bytes
                else:
                    value = str(value)

                await redis_client.setex(key, ttl_seconds, value)

                self._cache_stats["sets"] += 1
                logger.debug(f"💾 Cache set for key: {key} (TTL: {ttl_seconds}s)")
                return True

        except Exception as e:
            self._cache_stats["errors"] += 1
            logger.error(f"❌ Cache set error for key {key}", exc_info=e)
            return False

    async def delete(self, key: str) -> bool:
        """Delete key from cache"""
        try:
            if self._use_memory_fallback:
                # Use memory cache
                if key in self._memory_cache:
                    del self._memory_cache[key]
                if key in self._memory_cache_ttl:
                    del self._memory_cache_ttl[key]

                self._cache_stats["deletes"] += 1
                logger.debug(f"🗑️ Cache delete (memory) for key: {key}")
                return True
            else:
                # Use Redis
                redis_client = self.get_redis()
                result = await redis_client.delete(key)

                self._cache_stats["deletes"] += 1
                logger.debug(f"🗑️ Cache delete for key: {key}")
                return bool(result)

        except Exception as e:
            self._cache_stats["errors"] += 1
            logger.error(f"❌ Cache delete error for key {key}", exc_info=e)
            return False

    async def delete_pattern(self, pattern: str) -> int:
        """Delete all keys matching pattern"""
        try:
            redis_client = self.get_redis()
            keys = await redis_client.keys(pattern)
            if keys:
                result = await redis_client.delete(*keys)
                logger.info(
                    f"🗑️ Deleted {result} cache keys matching pattern: {pattern}"
                )
                return result
            return 0

        except Exception as e:
            self._cache_stats["errors"] += 1
            logger.error(
                f"❌ Cache pattern delete error for pattern {pattern}", exc_info=e
            )
            return 0

    async def exists(self, key: str) -> bool:
        """Check if key exists in cache"""
        try:
            redis_client = self.get_redis()
            result = await redis_client.exists(key)
            return bool(result)
        except Exception as e:
            logger.error(f"❌ Cache exists error for key {key}", exc_info=e)
            return False

    async def ttl(self, key: str) -> int:
        """Get TTL for key (-1 if no TTL, -2 if doesn't exist)"""
        try:
            redis_client = self.get_redis()
            return await redis_client.ttl(key)
        except Exception as e:
            logger.error(f"❌ Cache TTL error for key {key}", exc_info=e)
            return -2

    async def cached_function(
        self,
        key_template: str,
        ttl_seconds: int = 3600,
        warm_cache: bool = False,
        warm_interval: int = 1800,  # 30 minutes
    ):
        """Decorator for caching function results"""

        def decorator(func: Callable):
            async def wrapper(*args, **kwargs):
                # Generate cache key from template and args
                cache_key = key_template.format(
                    args=args,
                    kwargs=kwargs,
                    timestamp=int(time.time() // warm_interval) if warm_cache else "",
                )

                # Try to get from cache first
                cached_result = await self.get(cache_key)
                if cached_result is not None:
                    return cached_result

                # Execute function and cache result
                result = await func(*args, **kwargs)
                await self.set(cache_key, result, ttl_seconds)

                # Start cache warming if requested
                if warm_cache and cache_key not in self._warming_tasks:
                    self._warming_tasks[cache_key] = asyncio.create_task(
                        self._warm_cache_periodically(
                            func, args, kwargs, cache_key, ttl_seconds, warm_interval
                        )
                    )

                return result

            return wrapper

        return decorator

    async def _warm_cache_periodically(
        self,
        func: Callable,
        args: tuple,
        kwargs: dict,
        cache_key: str,
        ttl_seconds: int,
        warm_interval: int,
    ):
        """Periodically warm cache by re-executing function"""
        try:
            while True:
                await asyncio.sleep(warm_interval)

                # Check if cache is about to expire
                remaining_ttl = await self.ttl(cache_key)
                if (
                    remaining_ttl < warm_interval // 2
                ):  # Warm when less than half interval left
                    logger.info(f"🔥 Warming cache for key: {cache_key}")
                    result = await func(*args, **kwargs)
                    await self.set(cache_key, result, ttl_seconds)

        except asyncio.CancelledError:
            logger.debug(f"Cache warming cancelled for key: {cache_key}")
        except Exception as e:
            logger.error(f"❌ Cache warming error for key {cache_key}", exc_info=e)
        finally:
            self._warming_tasks.pop(cache_key, None)

    async def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        try:
            total_requests = self._cache_stats["hits"] + self._cache_stats["misses"]
            hit_rate = (
                (self._cache_stats["hits"] / total_requests * 100)
                if total_requests > 0
                else 0
            )

            if self._use_memory_fallback:
                # Memory cache stats
                memory_usage_mb = 0
                try:
                    import sys

                    memory_usage_mb = sys.getsizeof(self._memory_cache) / 1024 / 1024
                except:
                    memory_usage_mb = 0

                return {
                    "hit_rate_percent": round(hit_rate, 2),
                    "total_requests": total_requests,
                    "cache_operations": self._cache_stats,
                    "memory_usage_mb": round(memory_usage_mb, 2),
                    "backend": "memory_fallback",
                    "cache_entries": len(self._memory_cache),
                    "warming_tasks": len(self._warming_tasks),
                }
            else:
                # Redis stats
                redis_client = self.get_redis()
                info = await redis_client.info("memory")
                keyspace = await redis_client.info("keyspace")

                return {
                    "hit_rate_percent": round(hit_rate, 2),
                    "total_requests": total_requests,
                    "cache_operations": self._cache_stats,
                    "memory_usage_mb": round(
                        info.get("used_memory", 0) / 1024 / 1024, 2
                    ),
                    "backend": "redis",
                    "keyspace_info": keyspace,
                    "warming_tasks": len(self._warming_tasks),
                }

        except Exception as e:
            logger.error("❌ Failed to get cache stats", exc_info=e)
            return {
                "error": str(e),
                "backend": "memory_fallback" if self._use_memory_fallback else "redis",
            }

    async def health_check(self) -> Dict[str, Any]:
        """Perform cache health check"""
        try:
            start_time = time.time()

            if self._use_memory_fallback:
                # Test memory cache operations
                test_key = f"health_check_{int(time.time())}"
                await self.set(test_key, "test", 60)
                result = await self.get(test_key)
                await self.delete(test_key)

                latency_ms = round((time.time() - start_time) * 1000, 2)

                return {
                    "status": "healthy",
                    "backend": "memory_fallback",
                    "latency_ms": latency_ms,
                    "test_passed": result == "test",
                }
            else:
                # Test Redis operations
                redis_client = self.get_redis()
                test_key = f"health_check_{int(time.time())}"
                await redis_client.set(test_key, "test", ex=60)
                result = await redis_client.get(test_key)
                await redis_client.delete(test_key)

                latency_ms = round((time.time() - start_time) * 1000, 2)

                return {
                    "status": "healthy",
                    "backend": "redis",
                    "latency_ms": latency_ms,
                    "test_passed": result == b"test",
                }

        except Exception as e:
            logger.error("❌ Cache health check failed", exc_info=e)
            return {
                "status": "unhealthy",
                "backend": "memory_fallback" if self._use_memory_fallback else "redis",
                "error": str(e),
            }

    async def cleanup_expired_warming_tasks(self):
        """Clean up expired warming tasks"""
        expired_tasks = []
        for key, task in self._warming_tasks.items():
            if task.done() or task.cancelled():
                expired_tasks.append(key)

        for key in expired_tasks:
            self._warming_tasks.pop(key, None)

        if expired_tasks:
            logger.info(f"🧹 Cleaned up {len(expired_tasks)} expired warming tasks")

    async def close(self):
        """Close cache service and cleanup resources"""
        # Cancel all warming tasks
        for task in self._warming_tasks.values():
            task.cancel()

        try:
            await asyncio.gather(*self._warming_tasks.values(), return_exceptions=True)
        except Exception:
            pass

        self._warming_tasks.clear()

        if self._redis_pool:
            await self._redis_pool.disconnect()

        logger.info("🔒 Cache service closed")


# Global cache service instance
cache_service = CacheService()


# Convenience functions for common caching patterns
async def cache_mlb_data(key: str, data: Any, ttl: int = 600) -> bool:
    """Cache MLB-specific data with 10-minute default TTL"""
    return await cache_service.set(f"mlb:{key}", data, ttl)


async def get_cached_mlb_data(key: str, default: Any = None) -> Any:
    """Get cached MLB data"""
    return await cache_service.get(f"mlb:{key}", default)


async def cache_api_response(endpoint: str, response: Any, ttl: int = 300) -> bool:
    """Cache API response with 5-minute default TTL"""
    cache_key = f"api:{endpoint.replace('/', '_')}"
    return await cache_service.set(cache_key, response, ttl)


async def get_cached_api_response(endpoint: str, default: Any = None) -> Any:
    """Get cached API response"""
    cache_key = f"api:{endpoint.replace('/', '_')}"
    return await cache_service.get(cache_key, default)


# Export for use in other modules
__all__ = [
    "CacheService",
    "cache_service",
    "cache_mlb_data",
    "get_cached_mlb_data",
    "cache_api_response",
    "get_cached_api_response",
]
