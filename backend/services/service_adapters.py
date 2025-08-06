"""
Service Adapters for Phase 2 Integration

Provides compatibility layer between Phase 1 services and Phase 2 components
by wrapping existing services with the expected interface.
"""

import json
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from .cache_manager import APICache
from .optimized_redis_service import OptimizedRedisService

logger = logging.getLogger("service_adapters")


class RedisServiceAdapter:
    """Adapter to provide expected Redis interface for Phase 2 components"""

    def __init__(self, redis_service: OptimizedRedisService):
        self.redis_service = redis_service

    async def get(self, key: str) -> Optional[Any]:
        """Get value from Redis"""
        return await self.redis_service.get(key)

    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Set value in Redis"""
        return await self.redis_service.set(key, value, ttl)

    async def setex(self, key: str, value: Any, ttl: int) -> bool:
        """Set value with expiration"""
        return await self.redis_service.set(key, value, ttl)

    async def mget(self, keys: List[str]) -> List[Optional[Any]]:
        """Get multiple values"""
        return await self.redis_service.mget(keys)

    async def mset(self, mapping: Dict[str, Any], ttl: Optional[int] = None) -> bool:
        """Set multiple values"""
        return await self.redis_service.mset(mapping, ttl)

    async def delete(self, key: str) -> bool:
        """Delete key"""
        try:
            redis = await self.redis_service.get_redis()
            result = await redis.delete(key)
            return bool(result)
        except Exception as e:
            logger.error(f"Error deleting key {key}: {e}")
            return False

    async def exists(self, key: str) -> bool:
        """Check if key exists"""
        try:
            redis = await self.redis_service.get_redis()
            result = await redis.exists(key)
            return bool(result)
        except Exception as e:
            logger.error(f"Error checking existence of key {key}: {e}")
            return False

    async def set_with_expiry(self, key: str, value: Any, ttl: int) -> bool:
        """Set value with expiry (alias for setex)"""
        return await self.setex(key, value, ttl)

    async def get_info(self) -> Dict[str, Any]:
        """Get Redis info"""
        try:
            redis = await self.redis_service.get_redis()
            info = await redis.info()
            return dict(info)
        except Exception as e:
            logger.error(f"Error getting Redis info: {e}")
            return {}

    async def count_keys(self, pattern: str) -> int:
        """Count keys matching pattern"""
        try:
            redis = await self.redis_service.get_redis()
            keys = await redis.keys(pattern)
            return len(keys)
        except Exception as e:
            logger.error(f"Error counting keys with pattern {pattern}: {e}")
            return 0

    async def health_check(self) -> Dict[str, Any]:
        """Health check"""
        return await self.redis_service.health_check()


class CacheManagerAdapter:
    """Adapter to provide expected cache interface for Phase 2 components"""

    def __init__(self, cache_manager: APICache):
        self.cache_manager = cache_manager

    async def get_cache(self, key: str, default=None) -> Any:
        """Get cached value"""
        try:
            result = await self.cache_manager.get(key)
            return result if result is not None else default
        except Exception as e:
            logger.error(f"Error getting cache for key {key}: {e}")
            return default

    async def set_cache(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Set cached value"""
        try:
            # Convert TTL from seconds to minutes for APICache
            ttl_minutes = None
            if ttl:
                ttl_minutes = ttl // 60

            await self.cache_manager.set(key, value, ttl_minutes)
            return True
        except Exception as e:
            logger.error(f"Error setting cache for key {key}: {e}")
            return False

    async def invalidate_cache(self, key: str) -> bool:
        """Invalidate cached value"""
        try:
            return await self.cache_manager.invalidate(key)
        except Exception as e:
            logger.error(f"Error invalidating cache for key {key}: {e}")
            return False

    async def get_performance_stats(self) -> Dict[str, Any]:
        """Get performance statistics"""
        try:
            stats = await self.cache_manager.get_cache_stats()
            # Convert to expected format
            return {
                "cache_hit_rate": stats.get("cache_hit_rate", 0.0),
                "average_response_time_ms": stats.get(
                    "average_response_time_ms", 100.0
                ),
                "total_requests": stats.get("total_requests", 0),
                "total_hits": stats.get("total_hits", 0),
                "total_misses": stats.get("total_misses", 0),
            }
        except Exception as e:
            logger.error(f"Error getting performance stats: {e}")
            return {
                "cache_hit_rate": 0.0,
                "average_response_time_ms": 100.0,
                "total_requests": 0,
                "total_hits": 0,
                "total_misses": 0,
            }


# Factory functions to create adapted services
def create_redis_adapter(redis_service: OptimizedRedisService) -> RedisServiceAdapter:
    """Create Redis service adapter"""
    return RedisServiceAdapter(redis_service)


def create_cache_adapter(cache_manager: APICache) -> CacheManagerAdapter:
    """Create cache manager adapter"""
    return CacheManagerAdapter(cache_manager)
