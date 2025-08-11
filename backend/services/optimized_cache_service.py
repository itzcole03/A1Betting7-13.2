"""
Optimized Cache Service - Phase 4 Performance Enhancement
High-performance caching with Redis fallback and memory optimization
"""

import asyncio
import hashlib
import json
import time
from datetime import datetime, timedelta
from typing import Any, Dict, Optional, Union

try:
    import redis.asyncio as redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

from backend.config_manager import A1BettingConfig
from backend.utils.enhanced_logging import get_logger

logger = get_logger("optimized_cache")


class OptimizedCacheService:
    """
    High-performance cache service with:
    - Automatic Redis/Memory fallback
    - Performance optimization for Phase 4
    - Error recovery and resilience
    - Intelligent TTL management
    """

    def __init__(self):
        self.config = A1BettingConfig()
        self._redis_client: Optional[redis.Redis] = None
        self._memory_cache: Dict[str, Dict] = {}
        self._use_redis = False
        self._initialized = False
        
        # Performance metrics
        self._hits = 0
        self._misses = 0
        self._errors = 0
        
        # Configuration
        self.default_ttl = 300  # 5 minutes
        self.max_memory_size = 1000
        
    async def initialize(self) -> None:
        """Initialize cache service with Redis fallback"""
        if self._initialized:
            return
            
        try:
            # Try Redis connection if available and configured
            if REDIS_AVAILABLE and self.config.cache.redis_url:
                self._redis_client = redis.from_url(
                    self.config.cache.redis_url,
                    encoding="utf-8",
                    decode_responses=True,
                    socket_connect_timeout=5,
                    socket_timeout=5,
                    retry_on_timeout=True,
                    health_check_interval=30
                )
                
                # Test connection
                await self._redis_client.ping()
                self._use_redis = True
                logger.info("✅ Redis cache service initialized")
                
        except Exception as e:
            logger.warning(f"⚠️ Redis not available ({e}), using memory fallback")
            self._use_redis = False
            
        if not self._use_redis:
            logger.info("✅ Memory cache service initialized")
            
        self._initialized = True

    async def get(self, key: str, default: Any = None) -> Any:
        """Get value from cache with performance optimization"""
        if not self._initialized:
            await self.initialize()
            
        try:
            if self._use_redis and self._redis_client:
                value = await self._redis_client.get(key)
                if value is not None:
                    self._hits += 1
                    try:
                        return json.loads(value)
                    except (json.JSONDecodeError, TypeError):
                        return value
                else:
                    self._misses += 1
                    return default
            else:
                # Memory cache fallback
                cache_entry = self._memory_cache.get(key)
                if cache_entry:
                    # Check TTL
                    if time.time() < cache_entry['expires']:
                        self._hits += 1
                        return cache_entry['value']
                    else:
                        # Expired, remove it
                        del self._memory_cache[key]
                        
                self._misses += 1
                return default
                
        except Exception as e:
            logger.error(f"❌ Cache get error for key {key}: {e}")
            self._errors += 1
            return default

    async def set(
        self, 
        key: str, 
        value: Any, 
        ttl: Optional[int] = None
    ) -> bool:
        """Set value in cache with performance optimization"""
        if not self._initialized:
            await self.initialize()
            
        ttl = ttl or self.default_ttl
        
        try:
            if self._use_redis and self._redis_client:
                if isinstance(value, (dict, list)):
                    value = json.dumps(value)
                await self._redis_client.setex(key, ttl, value)
                return True
            else:
                # Memory cache fallback
                # Clean up expired entries if cache is getting large
                if len(self._memory_cache) >= self.max_memory_size:
                    await self._cleanup_memory_cache()
                    
                self._memory_cache[key] = {
                    'value': value,
                    'expires': time.time() + ttl
                }
                return True
                
        except Exception as e:
            logger.error(f"❌ Cache set error for key {key}: {e}")
            self._errors += 1
            return False

    async def delete(self, key: str) -> bool:
        """Delete value from cache"""
        if not self._initialized:
            await self.initialize()
            
        try:
            if self._use_redis and self._redis_client:
                result = await self._redis_client.delete(key)
                return result > 0
            else:
                if key in self._memory_cache:
                    del self._memory_cache[key]
                    return True
                return False
                
        except Exception as e:
            logger.error(f"❌ Cache delete error for key {key}: {e}")
            self._errors += 1
            return False

    async def clear(self) -> bool:
        """Clear all cache entries"""
        try:
            if self._use_redis and self._redis_client:
                await self._redis_client.flushdb()
            else:
                self._memory_cache.clear()
            return True
        except Exception as e:
            logger.error(f"❌ Cache clear error: {e}")
            return False

    async def _cleanup_memory_cache(self) -> None:
        """Clean up expired entries from memory cache"""
        current_time = time.time()
        expired_keys = [
            key for key, entry in self._memory_cache.items()
            if current_time >= entry['expires']
        ]
        
        for key in expired_keys:
            del self._memory_cache[key]
            
        logger.debug(f"🧹 Cleaned up {len(expired_keys)} expired cache entries")

    async def get_stats(self) -> Dict[str, Any]:
        """Get cache performance statistics"""
        total_requests = self._hits + self._misses
        hit_rate = (self._hits / total_requests * 100) if total_requests > 0 else 0
        
        stats = {
            "cache_type": "redis" if self._use_redis else "memory",
            "hits": self._hits,
            "misses": self._misses,
            "errors": self._errors,
            "hit_rate": round(hit_rate, 2),
            "total_requests": total_requests
        }
        
        if not self._use_redis:
            stats["memory_entries"] = len(self._memory_cache)
            
        return stats

    async def close(self) -> None:
        """Close cache connections"""
        if self._redis_client:
            await self._redis_client.close()


# Global cache instance
_cache_service: Optional[OptimizedCacheService] = None


async def get_cache_service() -> OptimizedCacheService:
    """Get global cache service instance"""
    global _cache_service
    if _cache_service is None:
        _cache_service = OptimizedCacheService()
        await _cache_service.initialize()
    return _cache_service


# Convenience functions for easy usage
async def cache_get(key: str, default: Any = None) -> Any:
    """Get value from cache"""
    cache = await get_cache_service()
    return await cache.get(key, default)


async def cache_set(key: str, value: Any, ttl: Optional[int] = None) -> bool:
    """Set value in cache"""
    cache = await get_cache_service()
    return await cache.set(key, value, ttl)


async def cache_delete(key: str) -> bool:
    """Delete value from cache"""
    cache = await get_cache_service()
    return await cache.delete(key)


async def cache_clear() -> bool:
    """Clear all cache"""
    cache = await get_cache_service()
    return await cache.clear()
