"""
Unified Cache Service - Consolidates all caching implementations
Replaces: intelligent_cache_service.py, enhanced_caching_service.py, 
         unified_cache_service.py, optimized_redis_service.py, event_driven_cache.py
"""

import asyncio
import json
import hashlib
import time
from typing import Any, Dict, List, Optional, Union, Callable, TypeVar, Generic
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from enum import Enum
import redis.asyncio as redis
import logging
from contextlib import asynccontextmanager
import pickle
import zlib
from functools import wraps

# Configure logging
logger = logging.getLogger(__name__)

T = TypeVar('T')

class CacheLevel(Enum):
    """Cache level definitions"""
    MEMORY = "memory"
    REDIS = "redis"
    DISTRIBUTED = "distributed"

class CacheStrategy(Enum):
    """Cache strategy definitions"""
    LRU = "lru"
    LFU = "lfu"
    TTL = "ttl"
    FIFO = "fifo"

@dataclass
class CacheConfig:
    """Cache configuration"""
    memory_max_size: int = 1000
    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_db: int = 0
    redis_password: Optional[str] = None
    default_ttl: int = 3600  # 1 hour
    compression_enabled: bool = True
    compression_threshold: int = 1024  # Compress if data > 1KB
    serialization_format: str = "json"  # json, pickle
    circuit_breaker_enabled: bool = True
    circuit_breaker_threshold: int = 5
    circuit_breaker_timeout: int = 60

@dataclass 
class CacheEntry(Generic[T]):
    """Cache entry with metadata"""
    key: str
    value: T
    created_at: datetime
    accessed_at: datetime
    access_count: int
    ttl: Optional[int]
    size: int
    tags: List[str]
    
    def is_expired(self) -> bool:
        if self.ttl is None:
            return False
        return datetime.now() > self.created_at + timedelta(seconds=self.ttl)
    
    def touch(self):
        """Update access timestamp and count"""
        self.accessed_at = datetime.now()
        self.access_count += 1

class CacheStats:
    """Cache statistics tracker"""
    def __init__(self):
        self.hits = 0
        self.misses = 0
        self.sets = 0
        self.deletes = 0
        self.evictions = 0
        self.memory_usage = 0
        self.redis_usage = 0
        
    @property
    def hit_rate(self) -> float:
        total = self.hits + self.misses
        return self.hits / total if total > 0 else 0.0
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "hits": self.hits,
            "misses": self.misses,
            "sets": self.sets,
            "deletes": self.deletes,
            "evictions": self.evictions,
            "hit_rate": self.hit_rate,
            "memory_usage": self.memory_usage,
            "redis_usage": self.redis_usage
        }

class CircuitBreaker:
    """Circuit breaker for Redis operations"""
    def __init__(self, threshold: int = 5, timeout: int = 60):
        self.threshold = threshold
        self.timeout = timeout
        self.failure_count = 0
        self.last_failure_time = None
        self.state = "closed"  # closed, open, half_open
    
    def is_open(self) -> bool:
        if self.state == "open":
            if time.time() - self.last_failure_time > self.timeout:
                self.state = "half_open"
                return False
            return True
        return False
    
    def record_success(self):
        self.failure_count = 0
        self.state = "closed"
    
    def record_failure(self):
        self.failure_count += 1
        self.last_failure_time = time.time()
        if self.failure_count >= self.threshold:
            self.state = "open"

class MemoryCache:
    """In-memory cache with LRU eviction"""
    def __init__(self, max_size: int, strategy: CacheStrategy = CacheStrategy.LRU):
        self.max_size = max_size
        self.strategy = strategy
        self.cache: Dict[str, CacheEntry] = {}
        self.access_order: List[str] = []
        
    def get(self, key: str) -> Optional[Any]:
        if key not in self.cache:
            return None
            
        entry = self.cache[key]
        if entry.is_expired():
            self.delete(key)
            return None
            
        entry.touch()
        self._update_access_order(key)
        return entry.value
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None, tags: List[str] = None):
        # Evict if at capacity
        if len(self.cache) >= self.max_size and key not in self.cache:
            self._evict_one()
        
        # Calculate size (rough estimation)
        size = len(str(value))
        
        entry = CacheEntry(
            key=key,
            value=value,
            created_at=datetime.now(),
            accessed_at=datetime.now(),
            access_count=1,
            ttl=ttl,
            size=size,
            tags=tags or []
        )
        
        self.cache[key] = entry
        self._update_access_order(key)
    
    def delete(self, key: str) -> bool:
        if key in self.cache:
            del self.cache[key]
            if key in self.access_order:
                self.access_order.remove(key)
            return True
        return False
    
    def clear(self):
        self.cache.clear()
        self.access_order.clear()
    
    def delete_by_tags(self, tags: List[str]):
        """Delete all entries with any of the specified tags"""
        to_delete = []
        for key, entry in self.cache.items():
            if any(tag in entry.tags for tag in tags):
                to_delete.append(key)
        
        for key in to_delete:
            self.delete(key)
    
    def _update_access_order(self, key: str):
        if key in self.access_order:
            self.access_order.remove(key)
        self.access_order.append(key)
    
    def _evict_one(self):
        if not self.access_order:
            return
            
        if self.strategy == CacheStrategy.LRU:
            # Remove least recently used
            key_to_evict = self.access_order[0]
        elif self.strategy == CacheStrategy.LFU:
            # Remove least frequently used
            key_to_evict = min(self.cache.keys(), 
                             key=lambda k: self.cache[k].access_count)
        else:
            # Default to LRU
            key_to_evict = self.access_order[0]
        
        self.delete(key_to_evict)
    
    def get_memory_usage(self) -> int:
        return sum(entry.size for entry in self.cache.values())

class UnifiedCacheService:
    """
    Unified caching service that consolidates all cache implementations.
    Provides multi-level caching with memory and Redis backends.
    """
    
    def __init__(self, config: CacheConfig = None):
        self.config = config or CacheConfig()
        self.memory_cache = MemoryCache(self.config.memory_max_size)
        self.redis_client: Optional[redis.Redis] = None
        self.circuit_breaker = CircuitBreaker(
            threshold=self.config.circuit_breaker_threshold,
            timeout=self.config.circuit_breaker_timeout
        ) if self.config.circuit_breaker_enabled else None
        self.stats = CacheStats()
        self._redis_pool = None
        
    async def initialize(self):
        """Initialize Redis connection"""
        try:
            self._redis_pool = redis.ConnectionPool(
                host=self.config.redis_host,
                port=self.config.redis_port,
                db=self.config.redis_db,
                password=self.config.redis_password,
                encoding='utf-8',
                decode_responses=False,  # We handle encoding ourselves
                max_connections=20
            )
            self.redis_client = redis.Redis(connection_pool=self._redis_pool)
            
            # Test connection
            await self.redis_client.ping()
            logger.info("Redis cache initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Redis cache: {e}")
            self.redis_client = None
    
    async def close(self):
        """Close Redis connection"""
        if self.redis_client:
            await self.redis_client.close()
        if self._redis_pool:
            await self._redis_pool.disconnect()
    
    async def get(self, key: str, default: Any = None) -> Any:
        """Get value from cache (memory first, then Redis)"""
        try:
            # Try memory cache first
            value = self.memory_cache.get(key)
            if value is not None:
                self.stats.hits += 1
                return value
            
            # Try Redis if available
            if self.redis_client and not self._is_circuit_breaker_open():
                try:
                    redis_value = await self.redis_client.get(self._encode_key(key))
                    if redis_value is not None:
                        # Deserialize and add to memory cache
                        deserialized_value = self._deserialize(redis_value)
                        self.memory_cache.set(key, deserialized_value)
                        self.stats.hits += 1
                        if self.circuit_breaker:
                            self.circuit_breaker.record_success()
                        return deserialized_value
                        
                except Exception as e:
                    logger.error(f"Redis get error for key {key}: {e}")
                    if self.circuit_breaker:
                        self.circuit_breaker.record_failure()
            
            self.stats.misses += 1
            return default
            
        except Exception as e:
            logger.error(f"Cache get error for key {key}: {e}")
            self.stats.misses += 1
            return default
    
    async def set(self, 
                  key: str, 
                  value: Any, 
                  ttl: Optional[int] = None, 
                  level: CacheLevel = CacheLevel.MEMORY,
                  tags: List[str] = None) -> bool:
        """Set value in cache"""
        try:
            ttl = ttl or self.config.default_ttl
            tags = tags or []
            
            # Always set in memory cache
            self.memory_cache.set(key, value, ttl, tags)
            
            # Set in Redis if requested and available
            if level in [CacheLevel.REDIS, CacheLevel.DISTRIBUTED] and \
               self.redis_client and not self._is_circuit_breaker_open():
                try:
                    serialized_value = self._serialize(value)
                    await self.redis_client.setex(
                        self._encode_key(key), 
                        ttl, 
                        serialized_value
                    )
                    
                    # Store tags separately for tag-based invalidation
                    if tags:
                        await self._store_tags(key, tags, ttl)
                    
                    if self.circuit_breaker:
                        self.circuit_breaker.record_success()
                        
                except Exception as e:
                    logger.error(f"Redis set error for key {key}: {e}")
                    if self.circuit_breaker:
                        self.circuit_breaker.record_failure()
            
            self.stats.sets += 1
            return True
            
        except Exception as e:
            logger.error(f"Cache set error for key {key}: {e}")
            return False
    
    async def delete(self, key: str) -> bool:
        """Delete key from all cache levels"""
        try:
            # Delete from memory
            memory_deleted = self.memory_cache.delete(key)
            
            # Delete from Redis
            redis_deleted = False
            if self.redis_client and not self._is_circuit_breaker_open():
                try:
                    result = await self.redis_client.delete(self._encode_key(key))
                    redis_deleted = result > 0
                    if self.circuit_breaker:
                        self.circuit_breaker.record_success()
                except Exception as e:
                    logger.error(f"Redis delete error for key {key}: {e}")
                    if self.circuit_breaker:
                        self.circuit_breaker.record_failure()
            
            if memory_deleted or redis_deleted:
                self.stats.deletes += 1
                return True
            return False
            
        except Exception as e:
            logger.error(f"Cache delete error for key {key}: {e}")
            return False
    
    async def delete_by_pattern(self, pattern: str) -> int:
        """Delete keys matching pattern from all cache levels"""
        deleted_count = 0
        
        try:
            # Delete from memory cache (simple string matching)
            memory_keys = list(self.memory_cache.cache.keys())
            for key in memory_keys:
                if self._matches_pattern(key, pattern):
                    if self.memory_cache.delete(key):
                        deleted_count += 1
            
            # Delete from Redis
            if self.redis_client and not self._is_circuit_breaker_open():
                try:
                    # Use Redis SCAN for pattern matching
                    cursor = 0
                    while True:
                        cursor, keys = await self.redis_client.scan(
                            cursor, match=self._encode_key(pattern)
                        )
                        if keys:
                            deleted = await self.redis_client.delete(*keys)
                            deleted_count += deleted
                        if cursor == 0:
                            break
                    
                    if self.circuit_breaker:
                        self.circuit_breaker.record_success()
                        
                except Exception as e:
                    logger.error(f"Redis pattern delete error for pattern {pattern}: {e}")
                    if self.circuit_breaker:
                        self.circuit_breaker.record_failure()
            
            return deleted_count
            
        except Exception as e:
            logger.error(f"Cache pattern delete error for pattern {pattern}: {e}")
            return deleted_count
    
    async def delete_by_tags(self, tags: List[str]) -> int:
        """Delete all entries with any of the specified tags"""
        deleted_count = 0
        
        try:
            # Delete from memory cache
            self.memory_cache.delete_by_tags(tags)
            
            # Delete from Redis using tag index
            if self.redis_client and not self._is_circuit_breaker_open():
                try:
                    for tag in tags:
                        tag_key = self._encode_key(f"tags:{tag}")
                        tagged_keys = await self.redis_client.smembers(tag_key)
                        if tagged_keys:
                            # Delete the actual cached values
                            deleted = await self.redis_client.delete(*tagged_keys)
                            deleted_count += deleted
                            # Delete the tag index
                            await self.redis_client.delete(tag_key)
                    
                    if self.circuit_breaker:
                        self.circuit_breaker.record_success()
                        
                except Exception as e:
                    logger.error(f"Redis tag delete error for tags {tags}: {e}")
                    if self.circuit_breaker:
                        self.circuit_breaker.record_failure()
            
            return deleted_count
            
        except Exception as e:
            logger.error(f"Cache tag delete error for tags {tags}: {e}")
            return deleted_count
    
    async def clear(self, level: Optional[CacheLevel] = None):
        """Clear cache at specified level or all levels"""
        try:
            if level is None or level == CacheLevel.MEMORY:
                self.memory_cache.clear()
            
            if level is None or level in [CacheLevel.REDIS, CacheLevel.DISTRIBUTED]:
                if self.redis_client and not self._is_circuit_breaker_open():
                    try:
                        await self.redis_client.flushdb()
                        if self.circuit_breaker:
                            self.circuit_breaker.record_success()
                    except Exception as e:
                        logger.error(f"Redis clear error: {e}")
                        if self.circuit_breaker:
                            self.circuit_breaker.record_failure()
                            
        except Exception as e:
            logger.error(f"Cache clear error: {e}")
    
    async def exists(self, key: str) -> bool:
        """Check if key exists in cache"""
        # Check memory first
        if key in self.memory_cache.cache:
            entry = self.memory_cache.cache[key]
            if not entry.is_expired():
                return True
            else:
                self.memory_cache.delete(key)
        
        # Check Redis
        if self.redis_client and not self._is_circuit_breaker_open():
            try:
                exists = await self.redis_client.exists(self._encode_key(key))
                return exists > 0
            except Exception as e:
                logger.error(f"Redis exists error for key {key}: {e}")
        
        return False
    
    async def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        stats_dict = self.stats.to_dict()
        stats_dict["memory_usage"] = self.memory_cache.get_memory_usage()
        stats_dict["memory_keys"] = len(self.memory_cache.cache)
        
        if self.redis_client:
            try:
                redis_info = await self.redis_client.info('memory')
                stats_dict["redis_memory"] = redis_info.get('used_memory', 0)
                stats_dict["redis_keys"] = await self.redis_client.dbsize()
            except Exception:
                stats_dict["redis_memory"] = 0
                stats_dict["redis_keys"] = 0
        
        return stats_dict
    
    def cached(self, ttl: Optional[int] = None, 
               key_func: Optional[Callable] = None,
               level: CacheLevel = CacheLevel.MEMORY,
               tags: List[str] = None):
        """Decorator for caching function results"""
        def decorator(func):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                # Generate cache key
                if key_func:
                    cache_key = key_func(*args, **kwargs)
                else:
                    cache_key = self._generate_key(func.__name__, args, kwargs)
                
                # Try to get from cache
                result = await self.get(cache_key)
                if result is not None:
                    return result
                
                # Call function and cache result
                if asyncio.iscoroutinefunction(func):
                    result = await func(*args, **kwargs)
                else:
                    result = func(*args, **kwargs)
                
                await self.set(cache_key, result, ttl, level, tags)
                return result
                
            return wrapper
        return decorator
    
    def _encode_key(self, key: str) -> str:
        """Encode cache key for Redis"""
        return f"cache:{key}"
    
    def _generate_key(self, func_name: str, args: tuple, kwargs: dict) -> str:
        """Generate cache key from function name and arguments"""
        key_data = {
            'func': func_name,
            'args': args,
            'kwargs': sorted(kwargs.items())
        }
        key_str = json.dumps(key_data, sort_keys=True, default=str)
        return hashlib.md5(key_str.encode()).hexdigest()
    
    def _serialize(self, value: Any) -> bytes:
        """Serialize value for storage"""
        try:
            if self.config.serialization_format == "pickle":
                data = pickle.dumps(value)
            else:
                # JSON serialization
                data = json.dumps(value, default=str).encode('utf-8')
            
            # Compress if enabled and data is large enough
            if self.config.compression_enabled and len(data) > self.config.compression_threshold:
                data = zlib.compress(data)
                # Add compression marker
                data = b'COMPRESSED:' + data
            
            return data
            
        except Exception as e:
            logger.error(f"Serialization error: {e}")
            raise
    
    def _deserialize(self, data: bytes) -> Any:
        """Deserialize value from storage"""
        try:
            # Check for compression marker
            if data.startswith(b'COMPRESSED:'):
                data = zlib.decompress(data[11:])  # Remove marker
            
            if self.config.serialization_format == "pickle":
                return pickle.loads(data)
            else:
                # JSON deserialization
                return json.loads(data.decode('utf-8'))
                
        except Exception as e:
            logger.error(f"Deserialization error: {e}")
            raise
    
    def _matches_pattern(self, key: str, pattern: str) -> bool:
        """Simple pattern matching for memory cache"""
        # Convert Redis-style pattern to Python regex
        import re
        regex_pattern = pattern.replace('*', '.*').replace('?', '.')
        return re.match(regex_pattern, key) is not None
    
    async def _store_tags(self, key: str, tags: List[str], ttl: int):
        """Store tag associations in Redis"""
        try:
            encoded_key = self._encode_key(key)
            for tag in tags:
                tag_key = self._encode_key(f"tags:{tag}")
                await self.redis_client.sadd(tag_key, encoded_key)
                await self.redis_client.expire(tag_key, ttl)
        except Exception as e:
            logger.error(f"Error storing tags: {e}")
    
    def _is_circuit_breaker_open(self) -> bool:
        """Check if circuit breaker is open"""
        return self.circuit_breaker and self.circuit_breaker.is_open()

# Global cache instance
_cache_instance: Optional[UnifiedCacheService] = None

async def get_cache() -> UnifiedCacheService:
    """Get global cache instance"""
    global _cache_instance
    if _cache_instance is None:
        _cache_instance = UnifiedCacheService()
        await _cache_instance.initialize()
    return _cache_instance

@asynccontextmanager
async def cache_context(config: CacheConfig = None):
    """Context manager for cache service"""
    cache = UnifiedCacheService(config)
    await cache.initialize()
    try:
        yield cache
    finally:
        await cache.close()

# Convenience functions
async def cache_get(key: str, default: Any = None) -> Any:
    cache = await get_cache()
    return await cache.get(key, default)

async def cache_set(key: str, value: Any, ttl: Optional[int] = None, 
                   level: CacheLevel = CacheLevel.MEMORY) -> bool:
    cache = await get_cache()
    return await cache.set(key, value, ttl, level)

async def cache_delete(key: str) -> bool:
    cache = await get_cache()
    return await cache.delete(key)

def cache_decorator(ttl: Optional[int] = None, 
                   level: CacheLevel = CacheLevel.MEMORY):
    """Simple cache decorator"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            cache = await get_cache()
            return await cache.cached(ttl=ttl, level=level)(func)(*args, **kwargs)
        return wrapper
    return decorator
