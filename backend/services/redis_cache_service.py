"""
Redis caching implementation for frequently accessed endpoints and model predictions.
Implements TTL-based caching with automatic invalidation for high-performance data access.
"""

from __future__ import annotations

import json
import hashlib
from typing import Any, Dict, List, Optional, Union
from datetime import datetime, timedelta
import asyncio
import logging

import redis.asyncio as aioredis
from pydantic import BaseModel

from backend.config.settings import get_settings

logger = logging.getLogger(__name__)

# Cache TTL constants (in seconds)
CACHE_TTL = {
    'prediction_single': 1800,      # 30 minutes - individual predictions
    'prediction_batch': 1800,       # 30 minutes - batch predictions  
    'betting_opportunities': 300,    # 5 minutes - betting opportunities
    'arbitrage_opportunities': 120,  # 2 minutes - arbitrage data
    'model_performance': 3600,       # 1 hour - model metrics
    'static_data': 86400,           # 24 hours - team/player stats
    'ballpark_factors': 604800,     # 7 days - ballpark factors
    'dashboard_preferences': 2592000, # 30 days - user preferences
}


class RedisCacheService:
    """High-performance Redis caching service for A1Betting API endpoints."""
    
    def __init__(self):
        try:
            import aioredis
        except Exception:  # pragma: no cover - use shim when aioredis not installed in test env
            aioredis = None
            from backend.services.shims.redis_shim import RedisClientShim
        self.settings = get_settings()
        self._connection_retries = 3
        self._retry_delay = 1.0
        
    async def connect(self) -> bool:
        """Initialize Redis connection with retry logic."""
        if not self.settings.redis.url:
            logger.warning("Redis URL not configured, caching disabled")
            return False
            
        for attempt in range(self._connection_retries):
            try:
                self.redis_client = await aioredis.from_url(
                    self.settings.redis.url,
                    encoding='utf-8',
                    decode_responses=True,
                    socket_timeout=5.0,
                    socket_connect_timeout=5.0,
                    retry_on_timeout=True
                )
                
                # Test connection
                await self.redis_client.ping()
                logger.info("Redis connection established successfully")
                return True
                
            except Exception as e:
                logger.warning(f"Redis connection attempt {attempt + 1} failed: {e}")
                if attempt < self._connection_retries - 1:
                    await asyncio.sleep(self._retry_delay * (attempt + 1))
                    
        logger.error("Failed to establish Redis connection after all retries")
        return False
        
    async def disconnect(self) -> None:
        """Close Redis connection gracefully."""
        if self.redis_client:
            try:
                await self.redis_client.close()
                logger.info("Redis connection closed")
            except Exception as e:
                logger.error(f"Error closing Redis connection: {e}")
                
    def _generate_cache_key(self, prefix: str, data: Any) -> str:
        """Generate consistent cache key from data hash."""
        if isinstance(data, (dict, list)):
            data_str = json.dumps(data, sort_keys=True)
        else:
            data_str = str(data)
            
        data_hash = hashlib.md5(data_str.encode()).hexdigest()[:12]
        return f"a1betting:{prefix}:{data_hash}"
        
    async def get(self, key: str) -> Optional[Any]:
        """Get cached data by key."""
        if not self.redis_client:
            return None
            
        try:
            cached_data = await self.redis_client.get(key)
            if cached_data:
                return json.loads(cached_data)
        except Exception as e:
            logger.error(f"Redis GET error for key {key}: {e}")
            
        return None
        
    async def set(
        self,
        key: str,
        value: Any,
        ttl: Optional[int] = None,
        cache_type: Optional[str] = None
    ) -> bool:
        """Set cached data with TTL."""
        if not self.redis_client:
            return False
            
        try:
            # Use type-specific TTL if provided
            if cache_type and cache_type in CACHE_TTL:
                ttl = CACHE_TTL[cache_type]
            elif ttl is None:
                ttl = CACHE_TTL['static_data']  # Default TTL
                
            serialized_data = json.dumps(value, default=str)
            await self.redis_client.set(key, serialized_data, ex=ttl)
            return True
            
        except Exception as e:
            logger.error(f"Redis SET error for key {key}: {e}")
            return False
            
    async def delete(self, key: str) -> bool:
        """Delete cached data by key."""
        if not self.redis_client:
            return False
            
        try:
            await self.redis_client.delete(key)
            return True
        except Exception as e:
            logger.error(f"Redis DELETE error for key {key}: {e}")
            return False
            
    async def delete_pattern(self, pattern: str) -> int:
        """Delete all keys matching pattern."""
        if not self.redis_client:
            return 0
            
        try:
            keys = await self.redis_client.keys(pattern)
            if keys:
                return await self.redis_client.delete(*keys)
            return 0
        except Exception as e:
            logger.error(f"Redis DELETE pattern error for {pattern}: {e}")
            return 0
            
    async def cache_prediction_result(
        self,
        input_data: Dict[str, Any],
        result: Dict[str, Any]
    ) -> str:
        """Cache individual prediction result with auto-generated key."""
        cache_key = self._generate_cache_key("prediction", input_data)
        
        cache_data = {
            'result': result,
            'input_hash': hashlib.md5(json.dumps(input_data, sort_keys=True).encode()).hexdigest(),
            'cached_at': datetime.utcnow().isoformat(),
            'ttl': CACHE_TTL['prediction_single']
        }
        
        await self.set(cache_key, cache_data, cache_type='prediction_single')
        return cache_key
        
    async def get_prediction_result(self, input_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Get cached prediction result by input data."""
        cache_key = self._generate_cache_key("prediction", input_data)
        cached = await self.get(cache_key)
        
        if cached:
            # Verify input hash matches to ensure data integrity
            input_hash = hashlib.md5(json.dumps(input_data, sort_keys=True).encode()).hexdigest()
            if cached.get('input_hash') == input_hash:
                return cached.get('result')
                
        return None
        
    async def cache_batch_predictions(
        self,
        batch_input: List[Dict[str, Any]],
        results: List[Dict[str, Any]]
    ) -> str:
        """Cache batch prediction results."""
        cache_key = self._generate_cache_key("batch_predictions", batch_input)
        
        cache_data = {
            'results': results,
            'batch_size': len(batch_input),
            'batch_hash': hashlib.md5(json.dumps(batch_input, sort_keys=True).encode()).hexdigest(),
            'cached_at': datetime.utcnow().isoformat(),
            'ttl': CACHE_TTL['prediction_batch']
        }
        
        await self.set(cache_key, cache_data, cache_type='prediction_batch')
        return cache_key
        
    async def get_batch_predictions(
        self,
        batch_input: List[Dict[str, Any]]
    ) -> Optional[List[Dict[str, Any]]]:
        """Get cached batch prediction results."""
        cache_key = self._generate_cache_key("batch_predictions", batch_input)
        cached = await self.get(cache_key)
        
        if cached:
            # Verify batch hash matches
            batch_hash = hashlib.md5(json.dumps(batch_input, sort_keys=True).encode()).hexdigest()
            if cached.get('batch_hash') == batch_hash:
                return cached.get('results')
                
        return None
        
    async def cache_betting_opportunities(
        self,
        opportunities: List[Dict[str, Any]],
        filters: Optional[Dict[str, Any]] = None
    ) -> str:
        """Cache betting opportunities with optional filters."""
        cache_key_data = {'opportunities': opportunities}
        if filters:
            cache_key_data['filters'] = filters
            
        cache_key = self._generate_cache_key("betting_opps", cache_key_data)
        
        cache_data = {
            'opportunities': opportunities,
            'filters': filters,
            'count': len(opportunities),
            'cached_at': datetime.utcnow().isoformat(),
            'ttl': CACHE_TTL['betting_opportunities']
        }
        
        await self.set(cache_key, cache_data, cache_type='betting_opportunities')
        return cache_key
        
    async def get_betting_opportunities(
        self,
        filters: Optional[Dict[str, Any]] = None
    ) -> Optional[List[Dict[str, Any]]]:
        """Get cached betting opportunities by filters."""
        cache_key_data: Dict[str, Any] = {}
        if filters:
            cache_key_data['filters'] = filters
            
        # Try to find matching cached opportunities
        pattern = "a1betting:betting_opps:*"
        if self.redis_client:
            try:
                keys = await self.redis_client.keys(pattern)
                for key in keys:
                    cached = await self.get(key)
                    if cached and cached.get('filters') == filters:
                        return cached.get('opportunities')
            except Exception as e:
                logger.error(f"Error searching betting opportunities cache: {e}")
                
        return None
        
    async def invalidate_predictions(self) -> int:
        """Invalidate all cached predictions."""
        deleted = 0
        deleted += await self.delete_pattern("a1betting:prediction:*")
        deleted += await self.delete_pattern("a1betting:batch_predictions:*")
        logger.info(f"Invalidated {deleted} prediction cache entries")
        return deleted
        
    async def invalidate_opportunities(self) -> int:
        """Invalidate all cached betting and arbitrage opportunities."""
        deleted = 0
        deleted += await self.delete_pattern("a1betting:betting_opps:*")
        deleted += await self.delete_pattern("a1betting:arbitrage_opps:*")
        logger.info(f"Invalidated {deleted} opportunity cache entries")
        return deleted
        
    async def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics and health metrics."""
        if not self.redis_client:
            return {'status': 'disconnected', 'error': 'Redis client not connected'}
            
        try:
            info = await self.redis_client.info()
            
            # Count keys by type
            key_counts = {}
            patterns = [
                'a1betting:prediction:*',
                'a1betting:batch_predictions:*',
                'a1betting:betting_opps:*',
                'a1betting:arbitrage_opps:*'
            ]
            
            for pattern in patterns:
                keys = await self.redis_client.keys(pattern)
                cache_type = pattern.split(':')[1]
                key_counts[cache_type] = len(keys)
                
            return {
                'status': 'connected',
                'redis_version': info.get('redis_version', 'unknown'),
                'used_memory_human': info.get('used_memory_human', 'unknown'),
                'connected_clients': info.get('connected_clients', 0),
                'total_keys': sum(key_counts.values()),
                'keys_by_type': key_counts,
                'hit_rate': info.get('keyspace_hits', 0) / max(
                    info.get('keyspace_hits', 0) + info.get('keyspace_misses', 1), 1
                )
            }
            
        except Exception as e:
            logger.error(f"Error getting cache stats: {e}")
            return {'status': 'error', 'error': str(e)}


# Global cache service instance
redis_cache = RedisCacheService()


async def get_redis_cache() -> RedisCacheService:
    """Dependency injection for Redis cache service."""
    if not redis_cache.redis_client:
        await redis_cache.connect()
    return redis_cache


# Cache decorator for endpoints
def redis_cached(cache_type: str, ttl: Optional[int] = None):
    """Decorator to add Redis caching to endpoint functions."""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            cache_service = await get_redis_cache()
            
            if not cache_service.redis_client:
                # Fallback to normal execution if Redis unavailable
                return await func(*args, **kwargs)
                
            # Generate cache key from function args
            cache_key_data = {'args': args, 'kwargs': kwargs}
            cache_key = cache_service._generate_cache_key(f"endpoint_{func.__name__}", cache_key_data)
            
            # Try to get from cache
            cached_result = await cache_service.get(cache_key)
            if cached_result:
                logger.debug(f"Cache hit for {func.__name__}")
                return cached_result
                
            # Execute function and cache result
            result = await func(*args, **kwargs)
            await cache_service.set(cache_key, result, ttl=ttl, cache_type=cache_type)
            
            logger.debug(f"Cache miss for {func.__name__}, result cached")
            return result
            
        return wrapper
    return decorator
