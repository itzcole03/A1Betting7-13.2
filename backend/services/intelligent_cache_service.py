"""
Intelligent Cache Service with Predictive Warming and Pipeline Optimization
Enhanced caching layer with AI-driven prefetching, Redis pipelines, and smart invalidation
"""

import asyncio
import hashlib
import json
import logging
import time
from collections import defaultdict, deque
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any, Callable, Dict, List, Optional, Set, Tuple, Union

import redis.asyncio as redis

from backend.config_manager import A1BettingConfig
from backend.utils.enhanced_logging import get_logger

logger = get_logger("intelligent_cache")


@dataclass
class CacheMetrics:
    """Cache performance metrics"""

    hits: int = 0
    misses: int = 0
    sets: int = 0
    deletes: int = 0
    pipeline_operations: int = 0
    warming_operations: int = 0
    evictions: int = 0
    total_memory_used: int = 0
    avg_response_time: float = 0.0
    hit_rate: float = 0.0


@dataclass
class CachePattern:
    """Data access pattern for predictive caching"""

    key_pattern: str
    access_frequency: int
    last_access: datetime
    avg_ttl: int
    data_size: int
    user_contexts: Set[str] = field(default_factory=set)
    peak_hours: List[int] = field(default_factory=list)
    seasonal_factor: float = 1.0


class IntelligentCacheService:
    """
    Enhanced caching service with:
    - Predictive cache warming based on access patterns
    - Redis pipeline batching for bulk operations
    - Intelligent TTL management
    - Smart cache invalidation
    - Real-time performance monitoring
    """

    def __init__(self):
        self.config = A1BettingConfig()
        self._redis_pool: Optional[redis.ConnectionPool] = None
        self._memory_cache: Dict[str, Any] = {}
        self._memory_cache_ttl: Dict[str, float] = {}
        self._use_memory_fallback = False

        # Enhanced metrics and patterns
        self.metrics = CacheMetrics()
        self.access_patterns: Dict[str, CachePattern] = {}
        self.warming_queue: asyncio.Queue = asyncio.Queue()
        self.pipeline_buffer: List[Tuple[str, str, Any]] = []  # (operation, key, value)

        # Configuration
        self.pipeline_batch_size = 50
        self.pipeline_timeout = 0.1  # 100ms
        self.warming_enabled = True
        self.pattern_analysis_interval = 300  # 5 minutes
        self.max_pipeline_size = 1000

        # Background tasks
        self._pipeline_task: Optional[asyncio.Task] = None
        self._warming_task: Optional[asyncio.Task] = None
        self._pattern_analysis_task: Optional[asyncio.Task] = None

    async def initialize(self) -> None:
        """Initialize enhanced caching service with background tasks"""
        try:
            # Initialize Redis connection
            self._redis_pool = redis.ConnectionPool.from_url(
                self.config.redis_url,
                max_connections=50,  # Increased for pipeline operations
                retry_on_timeout=True,
                socket_keepalive=True,
                socket_keepalive_options={},
                health_check_interval=30,
            )

            # Test connection
            redis_client = redis.Redis(connection_pool=self._redis_pool)
            await redis_client.ping()

            # Start background tasks
            await self._start_background_tasks()

            logger.info("✅ Intelligent cache service initialized with Redis")

        except Exception as e:
            logger.warning(f"⚠️ Redis not available, using memory fallback: {e}")
            self._use_memory_fallback = True

            # Start limited background tasks for memory cache
            await self._start_memory_tasks()

            logger.info("✅ Intelligent cache service initialized with memory fallback")

    async def _start_background_tasks(self):
        """Start background processing tasks"""
        if not self._use_memory_fallback:
            self._pipeline_task = asyncio.create_task(self._pipeline_processor())

        if self.warming_enabled:
            self._warming_task = asyncio.create_task(self._cache_warming_processor())

        self._pattern_analysis_task = asyncio.create_task(self._pattern_analyzer())

    async def _start_memory_tasks(self):
        """Start limited tasks for memory-only mode"""
        if self.warming_enabled:
            self._warming_task = asyncio.create_task(self._cache_warming_processor())
        self._pattern_analysis_task = asyncio.create_task(self._pattern_analyzer())

    def get_redis(self) -> redis.Redis:
        """Get Redis client from pool"""
        if self._use_memory_fallback:
            raise RuntimeError("Using memory fallback, Redis not available")
        if not self._redis_pool:
            raise RuntimeError("Cache service not initialized")
        return redis.Redis(connection_pool=self._redis_pool)

    async def get(self, key: str, default: Any = None, user_context: str = None) -> Any:
        """Enhanced get with pattern tracking"""
        start_time = time.time()

        try:
            # Track access pattern
            await self._track_access_pattern(key, user_context)

            if self._use_memory_fallback:
                value = await self._memory_get(key, default)
            else:
                value = await self._redis_get(key, default)

            # Update metrics
            if value is not None and value != default:
                self.metrics.hits += 1
                logger.debug(f"✅ Cache hit for key: {key}")
            else:
                self.metrics.misses += 1
                logger.debug(f"🔍 Cache miss for key: {key}")

            # Update response time
            response_time = time.time() - start_time
            self.metrics.avg_response_time = (
                self.metrics.avg_response_time * 0.9 + response_time * 0.1
            )

            return value

        except Exception as e:
            logger.error(f"❌ Cache get error for key {key}", exc_info=e)
            self.metrics.misses += 1
            return default

    async def set(
        self,
        key: str,
        value: Any,
        ttl_seconds: int = 3600,
        priority: str = "normal",
        user_context: str = None,
        use_pipeline: bool = True,
    ) -> bool:
        """Enhanced set with pipeline optimization and intelligent TTL"""
        try:
            # Calculate intelligent TTL based on patterns
            smart_ttl = await self._calculate_smart_ttl(key, ttl_seconds, user_context)

            if self._use_memory_fallback:
                return await self._memory_set(key, value, smart_ttl)
            elif use_pipeline and priority == "normal":
                # Add to pipeline buffer for batching
                await self._add_to_pipeline("SET", key, (value, smart_ttl))
                return True
            else:
                # Immediate execution for high priority
                return await self._redis_set(key, value, smart_ttl)

        except Exception as e:
            logger.error(f"❌ Cache set error for key {key}", exc_info=e)
            return False

    async def get_many(
        self, keys: List[str], user_context: str = None
    ) -> Dict[str, Any]:
        """Optimized bulk get operation using Redis pipeline"""
        if not keys:
            return {}

        try:
            if self._use_memory_fallback:
                return await self._memory_get_many(keys, user_context)
            else:
                return await self._redis_get_many(keys, user_context)

        except Exception as e:
            logger.error(f"❌ Bulk get error for {len(keys)} keys", exc_info=e)
            return {}

    async def set_many(
        self,
        items: Dict[str, Tuple[Any, int]],  # key -> (value, ttl)
        user_context: str = None,
    ) -> int:
        """Optimized bulk set operation using Redis pipeline"""
        if not items:
            return 0

        try:
            if self._use_memory_fallback:
                return await self._memory_set_many(items, user_context)
            else:
                return await self._redis_set_many(items, user_context)

        except Exception as e:
            logger.error(f"❌ Bulk set error for {len(items)} items", exc_info=e)
            return 0

    async def warm_cache(
        self, patterns: List[str], data_fetcher: Callable, priority: str = "normal"
    ):
        """Proactively warm cache for predicted access patterns"""
        if not self.warming_enabled:
            return

        warming_request = {
            "patterns": patterns,
            "data_fetcher": data_fetcher,
            "priority": priority,
            "timestamp": time.time(),
        }

        await self.warming_queue.put(warming_request)
        logger.debug(f"🔥 Cache warming queued for {len(patterns)} patterns")

    async def invalidate_pattern(self, pattern: str) -> int:
        """Intelligently invalidate cache entries matching pattern"""
        try:
            if self._use_memory_fallback:
                return await self._memory_invalidate_pattern(pattern)
            else:
                return await self._redis_invalidate_pattern(pattern)

        except Exception as e:
            logger.error(f"❌ Pattern invalidation error for {pattern}", exc_info=e)
            return 0

    async def get_metrics(self) -> CacheMetrics:
        """Get current cache performance metrics"""
        # Calculate hit rate
        total_requests = self.metrics.hits + self.metrics.misses
        if total_requests > 0:
            self.metrics.hit_rate = self.metrics.hits / total_requests

        # Get memory usage if using Redis
        if not self._use_memory_fallback:
            try:
                redis_client = self.get_redis()
                info = await redis_client.info("memory")
                self.metrics.total_memory_used = info.get("used_memory", 0)
            except:
                pass

        return self.metrics

    # Private methods for Redis operations

    async def _redis_get(self, key: str, default: Any) -> Any:
        """Redis get with deserialization"""
        redis_client = self.get_redis()
        value = await redis_client.get(key)

        if value is None:
            return default

        try:
            return json.loads(value.decode("utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError):
            return value.decode("utf-8")

    async def _redis_set(self, key: str, value: Any, ttl_seconds: int) -> bool:
        """Redis set with serialization"""
        redis_client = self.get_redis()

        if not isinstance(value, (str, bytes)):
            value = json.dumps(value, default=str)
        elif isinstance(value, bytes):
            pass
        else:
            value = str(value)

        result = await redis_client.set(key, value, ex=ttl_seconds)
        if result:
            self.metrics.sets += 1
            logger.debug(f"💾 Cache set for key: {key} (TTL: {ttl_seconds}s)")

        return bool(result)

    async def _redis_get_many(
        self, keys: List[str], user_context: str
    ) -> Dict[str, Any]:
        """Bulk get using Redis pipeline"""
        redis_client = self.get_redis()

        # Track access patterns for all keys
        for key in keys:
            await self._track_access_pattern(key, user_context)

        # Use pipeline for bulk operation
        async with redis_client.pipeline(transaction=False) as pipe:
            for key in keys:
                pipe.get(key)

            values = await pipe.execute()

        # Process results
        result = {}
        for key, value in zip(keys, values):
            if value is not None:
                try:
                    result[key] = json.loads(value.decode("utf-8"))
                except (json.JSONDecodeError, UnicodeDecodeError):
                    result[key] = value.decode("utf-8")
                self.metrics.hits += 1
            else:
                self.metrics.misses += 1

        self.metrics.pipeline_operations += 1
        logger.debug(f"📦 Bulk get completed: {len(result)}/{len(keys)} hits")

        return result

    async def _redis_set_many(
        self, items: Dict[str, Tuple[Any, int]], user_context: str
    ) -> int:
        """Bulk set using Redis pipeline"""
        redis_client = self.get_redis()

        # Use pipeline for bulk operation
        async with redis_client.pipeline(transaction=False) as pipe:
            for key, (value, ttl) in items.items():
                # Calculate smart TTL
                smart_ttl = await self._calculate_smart_ttl(key, ttl, user_context)

                # Serialize value
                if not isinstance(value, (str, bytes)):
                    value = json.dumps(value, default=str)
                elif isinstance(value, bytes):
                    pass
                else:
                    value = str(value)

                pipe.set(key, value, ex=smart_ttl)

            results = await pipe.execute()

        # Count successful operations
        success_count = sum(1 for result in results if result)
        self.metrics.sets += success_count
        self.metrics.pipeline_operations += 1

        logger.debug(f"📦 Bulk set completed: {success_count}/{len(items)} successful")

        return success_count

    async def _redis_invalidate_pattern(self, pattern: str) -> int:
        """Invalidate Redis keys matching pattern"""
        redis_client = self.get_redis()

        # Find matching keys
        keys = []
        async for key in redis_client.scan_iter(match=pattern):
            keys.append(key.decode("utf-8"))

        if not keys:
            return 0

        # Delete in batches using pipeline
        deleted_count = 0
        batch_size = 100

        for i in range(0, len(keys), batch_size):
            batch = keys[i : i + batch_size]
            async with redis_client.pipeline(transaction=False) as pipe:
                for key in batch:
                    pipe.delete(key)
                results = await pipe.execute()

            deleted_count += sum(results)

        self.metrics.deletes += deleted_count
        logger.info(f"🗑️ Invalidated {deleted_count} keys matching pattern: {pattern}")

        return deleted_count

    # Memory cache fallback methods

    async def _memory_get(self, key: str, default: Any) -> Any:
        """Memory cache get with TTL check"""
        if key in self._memory_cache:
            # Check TTL
            if (
                key in self._memory_cache_ttl
                and time.time() > self._memory_cache_ttl[key]
            ):
                del self._memory_cache[key]
                del self._memory_cache_ttl[key]
                return default

            return self._memory_cache[key]

        return default

    async def _memory_set(self, key: str, value: Any, ttl_seconds: int) -> bool:
        """Memory cache set with TTL"""
        self._memory_cache[key] = value
        self._memory_cache_ttl[key] = time.time() + ttl_seconds
        self.metrics.sets += 1

        return True

    async def _memory_get_many(
        self, keys: List[str], user_context: str
    ) -> Dict[str, Any]:
        """Memory cache bulk get"""
        result = {}
        for key in keys:
            await self._track_access_pattern(key, user_context)
            value = await self._memory_get(key, None)
            if value is not None:
                result[key] = value
                self.metrics.hits += 1
            else:
                self.metrics.misses += 1

        return result

    async def _memory_set_many(
        self, items: Dict[str, Tuple[Any, int]], user_context: str
    ) -> int:
        """Memory cache bulk set"""
        success_count = 0
        for key, (value, ttl) in items.items():
            smart_ttl = await self._calculate_smart_ttl(key, ttl, user_context)
            if await self._memory_set(key, value, smart_ttl):
                success_count += 1

        return success_count

    async def _memory_invalidate_pattern(self, pattern: str) -> int:
        """Memory cache pattern invalidation"""
        import fnmatch

        keys_to_delete = [
            key for key in self._memory_cache.keys() if fnmatch.fnmatch(key, pattern)
        ]

        for key in keys_to_delete:
            del self._memory_cache[key]
            if key in self._memory_cache_ttl:
                del self._memory_cache_ttl[key]

        self.metrics.deletes += len(keys_to_delete)
        return len(keys_to_delete)

    # Background processing tasks

    async def _pipeline_processor(self):
        """Background task to process pipeline operations"""
        while True:
            try:
                if len(self.pipeline_buffer) >= self.pipeline_batch_size:
                    await self._flush_pipeline()

                # Also flush on timeout
                await asyncio.sleep(self.pipeline_timeout)
                if self.pipeline_buffer:
                    await self._flush_pipeline()

            except Exception as e:
                logger.error(f"❌ Pipeline processor error: {e}")
                await asyncio.sleep(1)

    async def _flush_pipeline(self):
        """Flush pipeline buffer to Redis"""
        if not self.pipeline_buffer:
            return

        try:
            redis_client = self.get_redis()
            async with redis_client.pipeline(transaction=False) as pipe:
                for operation, key, data in self.pipeline_buffer:
                    if operation == "SET":
                        value, ttl = data
                        if not isinstance(value, (str, bytes)):
                            value = json.dumps(value, default=str)
                        pipe.set(key, value, ex=ttl)

                results = await pipe.execute()

            # Update metrics
            success_count = sum(1 for result in results if result)
            self.metrics.sets += success_count
            self.metrics.pipeline_operations += 1

            logger.debug(
                f"📦 Pipeline flushed: {success_count}/{len(self.pipeline_buffer)} successful"
            )

        except Exception as e:
            logger.error(f"❌ Pipeline flush error: {e}")
        finally:
            self.pipeline_buffer.clear()

    async def _add_to_pipeline(self, operation: str, key: str, data: Any):
        """Add operation to pipeline buffer"""
        if len(self.pipeline_buffer) >= self.max_pipeline_size:
            await self._flush_pipeline()

        self.pipeline_buffer.append((operation, key, data))

    async def _cache_warming_processor(self):
        """Background task to process cache warming requests"""
        while True:
            try:
                # Get warming request with timeout
                request = await asyncio.wait_for(self.warming_queue.get(), timeout=30)

                patterns = request["patterns"]
                data_fetcher = request["data_fetcher"]
                priority = request.get("priority", "normal")

                # Process warming request
                await self._process_warming_request(patterns, data_fetcher, priority)

                self.metrics.warming_operations += 1

            except asyncio.TimeoutError:
                # No warming requests - continue
                continue
            except Exception as e:
                logger.error(f"❌ Cache warming error: {e}")
                await asyncio.sleep(1)

    async def _process_warming_request(
        self, patterns: List[str], data_fetcher: Callable, priority: str
    ):
        """Process a cache warming request"""
        for pattern in patterns:
            try:
                # Check if data already cached
                if await self.get(pattern) is not None:
                    continue

                # Fetch data and cache it
                data = await data_fetcher(pattern)
                if data is not None:
                    # Use longer TTL for warmed data
                    ttl = 7200 if priority == "high" else 3600
                    await self.set(
                        pattern, data, ttl, priority="high", use_pipeline=False
                    )

                    logger.debug(f"🔥 Cache warmed for pattern: {pattern}")

            except Exception as e:
                logger.error(f"❌ Warming failed for pattern {pattern}: {e}")

    async def _pattern_analyzer(self):
        """Background task to analyze access patterns for predictive caching"""
        while True:
            try:
                await asyncio.sleep(self.pattern_analysis_interval)

                # Analyze patterns and trigger warming
                await self._analyze_and_predict()

            except Exception as e:
                logger.error(f"❌ Pattern analysis error: {e}")
                await asyncio.sleep(60)

    async def _analyze_and_predict(self):
        """Analyze access patterns and predict future cache needs"""
        current_time = datetime.now()
        current_hour = current_time.hour

        # Find patterns that should be warmed
        warming_candidates = []

        for pattern_key, pattern in self.access_patterns.items():
            # Check if pattern is frequently accessed at this time
            if (
                current_hour in pattern.peak_hours
                and pattern.access_frequency > 10
                and (current_time - pattern.last_access).seconds > pattern.avg_ttl * 0.8
            ):

                warming_candidates.append(pattern_key)

        if warming_candidates:
            logger.info(f"🔮 Predicted {len(warming_candidates)} patterns for warming")

            # Queue warming requests (would need data fetcher registry in real implementation)
            # This is a placeholder for the prediction logic

    async def _track_access_pattern(self, key: str, user_context: str = None):
        """Track access patterns for predictive caching"""
        current_time = datetime.now()

        if key not in self.access_patterns:
            self.access_patterns[key] = CachePattern(
                key_pattern=key,
                access_frequency=0,
                last_access=current_time,
                avg_ttl=3600,
                data_size=0,
                user_contexts=set(),
                peak_hours=[],
                seasonal_factor=1.0,
            )

        pattern = self.access_patterns[key]
        pattern.access_frequency += 1
        pattern.last_access = current_time

        if user_context:
            pattern.user_contexts.add(user_context)

        # Track peak hours
        current_hour = current_time.hour
        if current_hour not in pattern.peak_hours:
            pattern.peak_hours.append(current_hour)

        # Limit peak hours to top 6
        if len(pattern.peak_hours) > 6:
            # Remove least frequent hour (simplified)
            pattern.peak_hours = pattern.peak_hours[-6:]

    async def _calculate_smart_ttl(
        self, key: str, base_ttl: int, user_context: str = None
    ) -> int:
        """Calculate intelligent TTL based on access patterns"""
        if key not in self.access_patterns:
            return base_ttl

        pattern = self.access_patterns[key]

        # Adjust TTL based on access frequency
        frequency_factor = min(2.0, pattern.access_frequency / 10)

        # Adjust for peak hours
        current_hour = datetime.now().hour
        peak_factor = 1.5 if current_hour in pattern.peak_hours else 1.0

        # Apply seasonal factor
        smart_ttl = int(
            base_ttl * frequency_factor * peak_factor * pattern.seasonal_factor
        )

        # Ensure reasonable bounds
        return max(300, min(smart_ttl, 86400))  # 5 minutes to 24 hours

    async def close(self):
        """Cleanup resources and stop background tasks"""
        # Cancel background tasks
        for task in [
            self._pipeline_task,
            self._warming_task,
            self._pattern_analysis_task,
        ]:
            if task and not task.done():
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass

        # Flush any remaining pipeline operations
        if self.pipeline_buffer:
            await self._flush_pipeline()

        # Close Redis connection
        if self._redis_pool:
            await self._redis_pool.disconnect()

        logger.info("🔄 Intelligent cache service shutdown completed")


# Global instance
intelligent_cache_service = IntelligentCacheService()
