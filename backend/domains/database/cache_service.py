"""
Unified Cache Service - Redis-based caching strategy for optimized performance
Implements multi-layer caching with intelligent invalidation and warming strategies
"""

import json
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Union, Callable
from functools import wraps
import hashlib
import asyncio
import aioredis
from contextlib import asynccontextmanager

logger = logging.getLogger(__name__)

class CacheConfig:
    """Configuration settings for cache service"""
    # Redis connection
    REDIS_URL = "redis://localhost:6379"
    REDIS_DB = 0
    REDIS_PASSWORD = None
    
    # Cache TTL settings (in seconds)
    CACHE_TTL_SHORT = 300      # 5 minutes - Live data
    CACHE_TTL_MEDIUM = 3600    # 1 hour - Match data
    CACHE_TTL_LONG = 86400     # 24 hours - Historical data
    CACHE_TTL_STATIC = 604800  # 7 days - Static reference data
    
    # Cache key prefixes
    PREFIX_MATCH = "match:"
    PREFIX_USER = "user:"
    PREFIX_PREDICTION = "pred:"
    PREFIX_ODDS = "odds:"
    PREFIX_STATS = "stats:"
    PREFIX_SEARCH = "search:"
    PREFIX_ANALYTICS = "analytics:"
    
    # Cache size limits
    MAX_CACHE_SIZE = 1000000   # 1MB per cache entry
    MAX_LIST_SIZE = 10000      # Maximum items in cached lists


class UnifiedCacheService:
    """Unified caching service with Redis backend and intelligent strategies"""
    
    def __init__(self, config: CacheConfig = None):
        self.config = config or CacheConfig()
        self.redis_pool = None
        self.local_cache = {}  # In-memory fallback cache
        self.cache_stats = {
            "hits": 0,
            "misses": 0,
            "errors": 0,
            "invalidations": 0
        }
        
    async def initialize(self):
        """Initialize Redis connection pool"""
        try:
            self.redis_pool = aioredis.ConnectionPool.from_url(
                self.config.REDIS_URL,
                db=self.config.REDIS_DB,
                password=self.config.REDIS_PASSWORD,
                encoding="utf-8",
                decode_responses=True,
                max_connections=20
            )
            logger.info("Redis cache service initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Redis cache: {e}")
            logger.warning("Falling back to in-memory cache")
    
    async def shutdown(self):
        """Cleanup Redis connections"""
        if self.redis_pool:
            await self.redis_pool.disconnect()
            
    @asynccontextmanager
    async def get_redis(self):
        """Get Redis connection from pool"""
        if not self.redis_pool:
            yield None
            return
            
        try:
            redis = aioredis.Redis(connection_pool=self.redis_pool)
            yield redis
        except Exception as e:
            logger.error(f"Redis connection error: {e}")
            yield None
    
    def _generate_cache_key(self, prefix: str, identifier: str, **kwargs) -> str:
        """Generate consistent cache key with optional parameters"""
        key_parts = [prefix, str(identifier)]
        
        if kwargs:
            # Sort kwargs for consistent key generation
            sorted_kwargs = sorted(kwargs.items())
            params_str = "_".join([f"{k}={v}" for k, v in sorted_kwargs])
            key_parts.append(params_str)
            
        return ":".join(key_parts)
    
    def _serialize_data(self, data: Any) -> str:
        """Serialize data for cache storage"""
        try:
            if isinstance(data, (dict, list)):
                return json.dumps(data, default=str)
            return str(data)
        except Exception as e:
            logger.error(f"Data serialization error: {e}")
            return str(data)
    
    def _deserialize_data(self, data: str) -> Any:
        """Deserialize data from cache"""
        try:
            return json.loads(data)
        except (json.JSONDecodeError, TypeError):
            return data
    
    async def get(self, key: str, default: Any = None) -> Any:
        """Get value from cache with fallback to local cache"""
        try:
            async with self.get_redis() as redis:
                if redis:
                    value = await redis.get(key)
                    if value is not None:
                        self.cache_stats["hits"] += 1
                        return self._deserialize_data(value)
                
                # Fallback to local cache
                if key in self.local_cache:
                    self.cache_stats["hits"] += 1
                    return self.local_cache[key]
                    
        except Exception as e:
            logger.error(f"Cache get error for key {key}: {e}")
            self.cache_stats["errors"] += 1
        
        self.cache_stats["misses"] += 1
        return default
    
    async def set(self, key: str, value: Any, ttl: int = None) -> bool:
        """Set value in cache with TTL"""
        try:
            serialized_value = self._serialize_data(value)
            
            # Check size limit
            if len(serialized_value) > self.config.MAX_CACHE_SIZE:
                logger.warning(f"Cache value too large for key {key}, skipping")
                return False
            
            async with self.get_redis() as redis:
                if redis:
                    if ttl:
                        await redis.setex(key, ttl, serialized_value)
                    else:
                        await redis.set(key, serialized_value)
                    return True
                else:
                    # Fallback to local cache with cleanup
                    self.local_cache[key] = value
                    if len(self.local_cache) > 1000:  # Prevent memory bloat
                        # Remove oldest entries
                        keys_to_remove = list(self.local_cache.keys())[:100]
                        for k in keys_to_remove:
                            del self.local_cache[k]
                    return True
                    
        except Exception as e:
            logger.error(f"Cache set error for key {key}: {e}")
            self.cache_stats["errors"] += 1
            return False
    
    async def delete(self, key: str) -> bool:
        """Delete value from cache"""
        try:
            async with self.get_redis() as redis:
                if redis:
                    await redis.delete(key)
                
                # Also remove from local cache
                self.local_cache.pop(key, None)
                self.cache_stats["invalidations"] += 1
                return True
                
        except Exception as e:
            logger.error(f"Cache delete error for key {key}: {e}")
            self.cache_stats["errors"] += 1
            return False
    
    async def delete_pattern(self, pattern: str) -> int:
        """Delete all keys matching pattern"""
        try:
            async with self.get_redis() as redis:
                if redis:
                    keys = await redis.keys(pattern)
                    if keys:
                        deleted = await redis.delete(*keys)
                        self.cache_stats["invalidations"] += deleted
                        return deleted
                    
        except Exception as e:
            logger.error(f"Cache pattern delete error for pattern {pattern}: {e}")
            self.cache_stats["errors"] += 1
        return 0
    
    async def exists(self, key: str) -> bool:
        """Check if key exists in cache"""
        try:
            async with self.get_redis() as redis:
                if redis:
                    return await redis.exists(key) > 0
                return key in self.local_cache
                
        except Exception as e:
            logger.error(f"Cache exists error for key {key}: {e}")
            return False
    
    async def increment(self, key: str, amount: int = 1) -> int:
        """Increment counter in cache"""
        try:
            async with self.get_redis() as redis:
                if redis:
                    return await redis.incrby(key, amount)
                
                # Local cache fallback
                current = self.local_cache.get(key, 0)
                new_value = int(current) + amount
                self.local_cache[key] = new_value
                return new_value
                
        except Exception as e:
            logger.error(f"Cache increment error for key {key}: {e}")
            return 0
    
    async def get_stats(self) -> Dict[str, Any]:
        """Get cache performance statistics"""
        total_requests = self.cache_stats["hits"] + self.cache_stats["misses"]
        hit_rate = (self.cache_stats["hits"] / total_requests * 100) if total_requests > 0 else 0
        
        stats = {
            **self.cache_stats,
            "hit_rate_percent": round(hit_rate, 2),
            "total_requests": total_requests,
            "local_cache_size": len(self.local_cache)
        }
        
        try:
            async with self.get_redis() as redis:
                if redis:
                    info = await redis.info("memory")
                    stats["redis_memory_usage"] = info.get("used_memory_human", "N/A")
                    stats["redis_connected"] = True
                else:
                    stats["redis_connected"] = False
        except Exception:
            stats["redis_connected"] = False
            
        return stats

    # Specialized cache methods for different data types
    
    async def cache_match(self, match_id: int, match_data: Dict, ttl: int = None) -> bool:
        """Cache match data with appropriate TTL"""
        key = self._generate_cache_key(self.config.PREFIX_MATCH, match_id)
        ttl = ttl or self.config.CACHE_TTL_MEDIUM
        return await self.set(key, match_data, ttl)
    
    async def get_match(self, match_id: int) -> Optional[Dict]:
        """Get cached match data"""
        key = self._generate_cache_key(self.config.PREFIX_MATCH, match_id)
        return await self.get(key)
    
    async def cache_user_data(self, user_id: str, user_data: Dict, ttl: int = None) -> bool:
        """Cache user data with appropriate TTL"""
        key = self._generate_cache_key(self.config.PREFIX_USER, user_id)
        ttl = ttl or self.config.CACHE_TTL_LONG
        return await self.set(key, user_data, ttl)
    
    async def get_user_data(self, user_id: str) -> Optional[Dict]:
        """Get cached user data"""
        key = self._generate_cache_key(self.config.PREFIX_USER, user_id)
        return await self.get(key)
    
    async def cache_prediction(self, match_id: int, prediction_data: Dict, ttl: int = None) -> bool:
        """Cache prediction data"""
        key = self._generate_cache_key(self.config.PREFIX_PREDICTION, match_id)
        ttl = ttl or self.config.CACHE_TTL_MEDIUM
        return await self.set(key, prediction_data, ttl)
    
    async def get_prediction(self, match_id: int) -> Optional[Dict]:
        """Get cached prediction data"""
        key = self._generate_cache_key(self.config.PREFIX_PREDICTION, match_id)
        return await self.get(key)
    
    async def cache_odds(self, match_id: int, sportsbook: str, odds_data: Dict, ttl: int = None) -> bool:
        """Cache odds data with short TTL for live updates"""
        key = self._generate_cache_key(self.config.PREFIX_ODDS, match_id, sportsbook=sportsbook)
        ttl = ttl or self.config.CACHE_TTL_SHORT
        return await self.set(key, odds_data, ttl)
    
    async def get_odds(self, match_id: int, sportsbook: str = None) -> Optional[Dict]:
        """Get cached odds data"""
        if sportsbook:
            key = self._generate_cache_key(self.config.PREFIX_ODDS, match_id, sportsbook=sportsbook)
            return await self.get(key)
        else:
            # Get all odds for match
            pattern = f"{self.config.PREFIX_ODDS}{match_id}:*"
            # Implementation would require scanning keys
            return None
    
    async def cache_search_results(self, query_hash: str, results: List[Dict], ttl: int = None) -> bool:
        """Cache search results"""
        key = self._generate_cache_key(self.config.PREFIX_SEARCH, query_hash)
        ttl = ttl or self.config.CACHE_TTL_MEDIUM
        return await self.set(key, results, ttl)
    
    async def get_search_results(self, query_hash: str) -> Optional[List[Dict]]:
        """Get cached search results"""
        key = self._generate_cache_key(self.config.PREFIX_SEARCH, query_hash)
        return await self.get(key)
    
    async def invalidate_match_cache(self, match_id: int):
        """Invalidate all cache entries for a match"""
        patterns = [
            f"{self.config.PREFIX_MATCH}{match_id}*",
            f"{self.config.PREFIX_PREDICTION}{match_id}*",
            f"{self.config.PREFIX_ODDS}{match_id}*"
        ]
        
        for pattern in patterns:
            await self.delete_pattern(pattern)
    
    async def invalidate_user_cache(self, user_id: str):
        """Invalidate user-specific cache entries"""
        patterns = [
            f"{self.config.PREFIX_USER}{user_id}*",
        ]
        
        for pattern in patterns:
            await self.delete_pattern(pattern)
    
    async def warm_cache(self, data_loader: Callable, cache_key: str, ttl: int):
        """Warm cache with data from loader function"""
        try:
            data = await data_loader()
            if data:
                await self.set(cache_key, data, ttl)
                logger.info(f"Cache warmed for key: {cache_key}")
        except Exception as e:
            logger.error(f"Cache warming failed for key {cache_key}: {e}")


def cache_result(ttl: int = 3600, key_prefix: str = "result"):
    """Decorator for caching function results"""
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate cache key from function name and arguments
            key_data = f"{func.__name__}:{args}:{sorted(kwargs.items())}"
            key_hash = hashlib.md5(key_data.encode()).hexdigest()
            cache_key = f"{key_prefix}:{key_hash}"
            
            # Try to get from cache
            cache_service = UnifiedCacheService()
            cached_result = await cache_service.get(cache_key)
            
            if cached_result is not None:
                return cached_result
            
            # Execute function and cache result
            result = await func(*args, **kwargs)
            await cache_service.set(cache_key, result, ttl)
            
            return result
        return wrapper
    return decorator


# Global cache service instance
cache_service = UnifiedCacheService()
