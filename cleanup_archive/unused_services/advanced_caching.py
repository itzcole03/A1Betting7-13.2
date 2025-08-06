"""
Advanced Caching Service for Modern ML Pipeline

Implements multi-level caching strategies:
- Redis distributed cache
- In-memory LRU cache
- Model prediction cache
- Feature cache with intelligent invalidation
- Performance-optimized cache hierarchies
"""

import asyncio
import hashlib
import json
import logging
import pickle
import time
from collections import OrderedDict
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple, Union

import numpy as np
import torch

# Redis import
try:
    import redis.asyncio as redis

    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    logging.warning("Redis not available. Using memory-only caching.")

logger = logging.getLogger(__name__)


class LRUCache:
    """Thread-safe LRU cache implementation"""

    def __init__(self, max_size: int = 1000):
        self.max_size = max_size
        self.cache = OrderedDict()
        self.lock = asyncio.Lock()

    async def get(self, key: str) -> Optional[Any]:
        """Get item from cache"""
        async with self.lock:
            if key in self.cache:
                # Move to end (most recently used)
                value = self.cache.pop(key)
                self.cache[key] = value
                return value
            return None

    async def put(self, key: str, value: Any):
        """Put item in cache"""
        async with self.lock:
            if key in self.cache:
                # Update existing
                self.cache.pop(key)
            elif len(self.cache) >= self.max_size:
                # Remove oldest
                self.cache.popitem(last=False)

            self.cache[key] = value

    async def remove(self, key: str) -> bool:
        """Remove item from cache"""
        async with self.lock:
            if key in self.cache:
                del self.cache[key]
                return True
            return False

    async def clear(self):
        """Clear all cache"""
        async with self.lock:
            self.cache.clear()

    async def size(self) -> int:
        """Get cache size"""
        async with self.lock:
            return len(self.cache)

    async def keys(self) -> List[str]:
        """Get all cache keys"""
        async with self.lock:
            return list(self.cache.keys())


class TensorCache:
    """Specialized cache for PyTorch tensors"""

    def __init__(self, max_size: int = 500):
        self.max_size = max_size
        self.cache = OrderedDict()
        self.lock = asyncio.Lock()
        self.total_memory = 0  # Track memory usage

    async def get(self, key: str) -> Optional[torch.Tensor]:
        """Get tensor from cache"""
        async with self.lock:
            if key in self.cache:
                tensor, timestamp, memory_size = self.cache.pop(key)
                self.cache[key] = (tensor, timestamp, memory_size)
                return tensor.clone()  # Return a copy
            return None

    async def put(self, key: str, tensor: torch.Tensor):
        """Put tensor in cache"""
        tensor_copy = tensor.clone().detach()
        memory_size = tensor_copy.numel() * tensor_copy.element_size()

        async with self.lock:
            # Remove existing if present
            if key in self.cache:
                _, _, old_size = self.cache.pop(key)
                self.total_memory -= old_size

            # Remove oldest if at capacity
            while len(self.cache) >= self.max_size and self.cache:
                _, _, old_size = self.cache.popitem(last=False)[1]
                self.total_memory -= old_size

            self.cache[key] = (tensor_copy, time.time(), memory_size)
            self.total_memory += memory_size

    async def get_memory_usage(self) -> Dict[str, Any]:
        """Get memory usage statistics"""
        async with self.lock:
            return {
                "total_memory_bytes": self.total_memory,
                "total_memory_mb": self.total_memory / (1024 * 1024),
                "cached_tensors": len(self.cache),
                "max_size": self.max_size,
            }

    async def clear(self):
        """Clear tensor cache"""
        async with self.lock:
            self.cache.clear()
            self.total_memory = 0


class RedisCache:
    """Redis-based distributed cache"""

    def __init__(self, redis_url: str = "redis://localhost:6379/0"):
        self.redis_url = redis_url
        self.redis_client = None
        self.connected = False
        self._connection_task = None

        # Don't create tasks during import - defer until needed
        if REDIS_AVAILABLE:
            self._should_connect = True
        else:
            self._should_connect = False

    async def _connect(self):
        """Connect to Redis"""
        try:
            self.redis_client = redis.from_url(self.redis_url)
            await self.redis_client.ping()
            self.connected = True
            logger.info("Connected to Redis cache")
        except Exception as e:
            logger.warning(f"Redis connection failed: {e}")
            self.connected = False

    async def _ensure_connected(self):
        """Ensure Redis connection is established"""
        if self._should_connect and not self.connected and not self._connection_task:
            try:
                self._connection_task = asyncio.create_task(self._connect())
                await self._connection_task
            except Exception as e:
                logger.warning(f"Failed to connect to Redis: {e}")
                self._connection_task = None

    async def get(self, key: str) -> Optional[Any]:
        """Get item from Redis"""
        await self._ensure_connected()

        if not self.connected:
            return None

        try:
            data = await self.redis_client.get(key)
            if data:
                return pickle.loads(data)
            return None
        except Exception as e:
            logger.warning(f"Redis get error: {e}")
            return None

    async def put(self, key: str, value: Any, ttl: int = 3600):
        """Put item in Redis with TTL"""
        await self._ensure_connected()

        if not self.connected:
            return False

        try:
            serialized = pickle.dumps(value)
            await self.redis_client.setex(key, ttl, serialized)
            return True
        except Exception as e:
            logger.warning(f"Redis put error: {e}")
            return False

    async def remove(self, key: str) -> bool:
        """Remove item from Redis"""
        if not self.connected:
            return False

        try:
            result = await self.redis_client.delete(key)
            return result > 0
        except Exception as e:
            logger.warning(f"Redis remove error: {e}")
            return False

    async def exists(self, key: str) -> bool:
        """Check if key exists in Redis"""
        await self._ensure_connected()

        if not self.connected:
            return False

        try:
            return await self.redis_client.exists(key) > 0
        except Exception as e:
            logger.warning(f"Redis exists error: {e}")
            return False

    async def clear_pattern(self, pattern: str):
        """Clear keys matching pattern"""
        if not self.connected:
            return

        try:
            keys = await self.redis_client.keys(pattern)
            if keys:
                await self.redis_client.delete(*keys)
        except Exception as e:
            logger.warning(f"Redis clear pattern error: {e}")


class HierarchicalCache:
    """Multi-level hierarchical cache system"""

    def __init__(self):
        # L1: In-memory LRU cache (fastest)
        self.l1_cache = LRUCache(max_size=200)

        # L2: Tensor cache (for ML models)
        self.tensor_cache = TensorCache(max_size=100)

        # L3: Redis distributed cache (persistent)
        self.redis_cache = RedisCache()

        # Cache statistics
        self.stats = {
            "l1_hits": 0,
            "l1_misses": 0,
            "l2_hits": 0,
            "l2_misses": 0,
            "l3_hits": 0,
            "l3_misses": 0,
            "total_requests": 0,
        }

    async def get(self, key: str, cache_type: str = "auto") -> Optional[Any]:
        """Get item from hierarchical cache"""
        self.stats["total_requests"] += 1

        # Try L1 cache first
        value = await self.l1_cache.get(key)
        if value is not None:
            self.stats["l1_hits"] += 1
            return value
        self.stats["l1_misses"] += 1

        # Try L2 tensor cache for tensor data
        if cache_type in ["tensor", "auto"]:
            tensor_value = await self.tensor_cache.get(key)
            if tensor_value is not None:
                self.stats["l2_hits"] += 1
                # Promote to L1
                await self.l1_cache.put(key, tensor_value)
                return tensor_value
            self.stats["l2_misses"] += 1

        # Try L3 Redis cache
        redis_value = await self.redis_cache.get(key)
        if redis_value is not None:
            self.stats["l3_hits"] += 1
            # Promote to L1
            await self.l1_cache.put(key, redis_value)
            # Promote to L2 if tensor
            if isinstance(redis_value, torch.Tensor):
                await self.tensor_cache.put(key, redis_value)
            return redis_value
        self.stats["l3_misses"] += 1

        return None

    async def put(
        self, key: str, value: Any, ttl: int = 3600, cache_type: str = "auto"
    ):
        """Put item in hierarchical cache"""
        # Always put in L1
        await self.l1_cache.put(key, value)

        # Put in L2 if tensor
        if isinstance(value, torch.Tensor) or cache_type == "tensor":
            await self.tensor_cache.put(key, value)

        # Put in L3 Redis for persistence
        await self.redis_cache.put(key, value, ttl)

    async def remove(self, key: str):
        """Remove item from all cache levels"""
        await self.l1_cache.remove(key)
        await self.tensor_cache.remove(key)
        await self.redis_cache.remove(key)

    async def clear(self, level: Optional[str] = None):
        """Clear cache at specified level or all levels"""
        if level is None or level == "l1":
            await self.l1_cache.clear()
        if level is None or level == "l2":
            await self.tensor_cache.clear()
        if level is None or level == "l3":
            await self.redis_cache.clear_pattern("*")

    async def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        total_requests = max(self.stats["total_requests"], 1)

        l1_hit_rate = self.stats["l1_hits"] / total_requests
        l2_hit_rate = self.stats["l2_hits"] / total_requests
        l3_hit_rate = self.stats["l3_hits"] / total_requests

        overall_hit_rate = (
            self.stats["l1_hits"] + self.stats["l2_hits"] + self.stats["l3_hits"]
        ) / total_requests

        tensor_stats = await self.tensor_cache.get_memory_usage()
        l1_size = await self.l1_cache.size()

        return {
            "hit_rates": {
                "l1": l1_hit_rate,
                "l2": l2_hit_rate,
                "l3": l3_hit_rate,
                "overall": overall_hit_rate,
            },
            "sizes": {
                "l1_items": l1_size,
                "l2_tensors": tensor_stats["cached_tensors"],
                "l2_memory_mb": tensor_stats["total_memory_mb"],
            },
            "total_requests": total_requests,
            "redis_connected": self.redis_cache.connected,
        }


class SmartCacheManager:
    """Intelligent cache manager with adaptive strategies"""

    def __init__(self):
        self.cache = HierarchicalCache()
        self.access_patterns = {}  # Track access patterns
        self.invalidation_rules = {}  # Cache invalidation rules

    def generate_cache_key(self, prefix: str, **kwargs) -> str:
        """Generate consistent cache key"""
        # Sort kwargs for consistent hashing
        sorted_kwargs = sorted(kwargs.items())
        key_string = f"{prefix}:" + ":".join(f"{k}={v}" for k, v in sorted_kwargs)

        # Hash for consistent length
        key_hash = hashlib.md5(key_string.encode()).hexdigest()
        return f"{prefix}:{key_hash}"

    async def get_or_compute(
        self,
        key: str,
        compute_func: callable,
        ttl: int = 3600,
        cache_type: str = "auto",
    ) -> Any:
        """Get from cache or compute and cache the result"""
        # Try to get from cache
        cached_value = await self.cache.get(key, cache_type)
        if cached_value is not None:
            self._record_access(key, "hit")
            return cached_value

        # Compute the value
        start_time = time.time()
        computed_value = (
            await compute_func()
            if asyncio.iscoroutinefunction(compute_func)
            else compute_func()
        )
        compute_time = time.time() - start_time

        # Cache the computed value
        await self.cache.put(key, computed_value, ttl, cache_type)

        self._record_access(key, "miss", compute_time)
        return computed_value

    def _record_access(self, key: str, access_type: str, compute_time: float = 0):
        """Record cache access patterns"""
        if key not in self.access_patterns:
            self.access_patterns[key] = {
                "hits": 0,
                "misses": 0,
                "last_access": time.time(),
                "compute_times": [],
            }

        pattern = self.access_patterns[key]
        pattern[f"{access_type}s"] += 1
        pattern["last_access"] = time.time()

        if access_type == "miss" and compute_time > 0:
            pattern["compute_times"].append(compute_time)
            # Keep only last 10 compute times
            pattern["compute_times"] = pattern["compute_times"][-10:]

    async def smart_invalidate(self, pattern: str = None, max_age: int = None):
        """Smart cache invalidation based on patterns and age"""
        if pattern:
            # Invalidate by pattern
            await self.cache.redis_cache.clear_pattern(pattern)

        if max_age:
            # Invalidate old entries
            current_time = time.time()
            keys_to_remove = []

            for key, access_info in self.access_patterns.items():
                if current_time - access_info["last_access"] > max_age:
                    keys_to_remove.append(key)

            for key in keys_to_remove:
                await self.cache.remove(key)
                del self.access_patterns[key]

    async def get_optimization_report(self) -> Dict[str, Any]:
        """Generate cache optimization report"""
        total_keys = len(self.access_patterns)
        if total_keys == 0:
            return {"status": "no_data"}

        # Analyze access patterns
        high_hit_rate_keys = []
        low_hit_rate_keys = []
        expensive_compute_keys = []

        for key, pattern in self.access_patterns.items():
            total_accesses = pattern["hits"] + pattern["misses"]
            if total_accesses > 0:
                hit_rate = pattern["hits"] / total_accesses

                if hit_rate > 0.8:
                    high_hit_rate_keys.append(key)
                elif hit_rate < 0.2:
                    low_hit_rate_keys.append(key)

            if pattern["compute_times"]:
                avg_compute_time = np.mean(pattern["compute_times"])
                if avg_compute_time > 1.0:  # More than 1 second
                    expensive_compute_keys.append((key, avg_compute_time))

        cache_stats = await self.cache.get_stats()

        return {
            "cache_performance": cache_stats,
            "access_analysis": {
                "total_keys": total_keys,
                "high_hit_rate_keys": len(high_hit_rate_keys),
                "low_hit_rate_keys": len(low_hit_rate_keys),
                "expensive_compute_keys": len(expensive_compute_keys),
            },
            "recommendations": self._generate_recommendations(
                high_hit_rate_keys, low_hit_rate_keys, expensive_compute_keys
            ),
        }

    def _generate_recommendations(
        self,
        high_hit_keys: List[str],
        low_hit_keys: List[str],
        expensive_keys: List[Tuple[str, float]],
    ) -> List[str]:
        """Generate optimization recommendations"""
        recommendations = []

        if len(high_hit_keys) > 10:
            recommendations.append(
                "Consider increasing cache size for high-hit rate keys"
            )

        if len(low_hit_keys) > 5:
            recommendations.append("Consider shorter TTL for low-hit rate keys")

        if len(expensive_keys) > 3:
            recommendations.append(
                "Expensive computations detected - consider longer TTL"
            )

        if not recommendations:
            recommendations.append("Cache performance is optimal")

        return recommendations


class ModelCacheManager:
    """Specialized cache manager for ML models and predictions"""

    def __init__(self):
        self.cache_manager = SmartCacheManager()

    async def cache_model_prediction(
        self,
        model_config: Dict[str, Any],
        input_features: torch.Tensor,
        prediction: torch.Tensor,
        ttl: int = 1800,
    ):  # 30 minutes
        """Cache model prediction"""
        key = self.cache_manager.generate_cache_key(
            "prediction",
            model_type=model_config.get("model_type"),
            input_hash=hashlib.md5(input_features.numpy().tobytes()).hexdigest()[:16],
        )

        await self.cache_manager.cache.put(key, prediction, ttl, "tensor")

    async def get_cached_prediction(
        self, model_config: Dict[str, Any], input_features: torch.Tensor
    ) -> Optional[torch.Tensor]:
        """Get cached prediction"""
        key = self.cache_manager.generate_cache_key(
            "prediction",
            model_type=model_config.get("model_type"),
            input_hash=hashlib.md5(input_features.numpy().tobytes()).hexdigest()[:16],
        )

        return await self.cache_manager.cache.get(key, "tensor")

    async def cache_model_features(
        self, player_name: str, prop_type: str, features: torch.Tensor, ttl: int = 600
    ):  # 10 minutes
        """Cache processed features"""
        key = self.cache_manager.generate_cache_key(
            "features", player=player_name, prop_type=prop_type
        )

        await self.cache_manager.cache.put(key, features, ttl, "tensor")

    async def get_cached_features(
        self, player_name: str, prop_type: str
    ) -> Optional[torch.Tensor]:
        """Get cached features"""
        key = self.cache_manager.generate_cache_key(
            "features", player=player_name, prop_type=prop_type
        )

        return await self.cache_manager.cache.get(key, "tensor")


# Global instances
advanced_cache = SmartCacheManager()
model_cache = ModelCacheManager()

logger.info("Advanced caching service initialized")
logger.info(f"Redis available: {REDIS_AVAILABLE}")
logger.info("Multi-level hierarchical caching enabled")
