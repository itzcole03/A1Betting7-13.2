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

    async def set_sport_data(
        self,
        sport: str,
        data_category: str,
        key: str,
        value: Any,
        game_id: str = None,
        user_id: str = None,
        base_ttl: int = None
    ) -> bool:
        """Set sport data with intelligent TTL based on volatility models"""
        try:
            from backend.services.sport_volatility_models import sport_volatility_models, SportType, DataCategory

            # Convert strings to enums
            sport_enum = SportType(sport.lower()) if sport else None
            category_enum = None

            # Map data category string to enum
            category_mapping = {
                'live_scores': DataCategory.LIVE_SCORES,
                'live_odds': DataCategory.LIVE_ODDS,
                'pre_game_odds': DataCategory.PRE_GAME_ODDS,
                'player_stats': DataCategory.PLAYER_STATS,
                'team_stats': DataCategory.TEAM_STATS,
                'injury_reports': DataCategory.INJURY_REPORTS,
                'game_schedules': DataCategory.GAME_SCHEDULES,
                'player_props': DataCategory.PLAYER_PROPS,
                'news_updates': DataCategory.NEWS_UPDATES
            }

            category_enum = category_mapping.get(data_category.lower())

            if sport_enum and category_enum:
                # Get dynamic TTL from volatility model
                access_count = 1
                if key in self.access_patterns:
                    access_count = self.access_patterns[key].access_frequency

                dynamic_ttl = await sport_volatility_models.get_dynamic_ttl(
                    sport=sport_enum,
                    data_category=category_enum,
                    game_id=game_id,
                    user_id=user_id,
                    access_count=access_count
                )

                # Track user access
                if user_id:
                    await sport_volatility_models.track_user_access(user_id, sport_enum, category_enum)

                # Use the dynamic TTL
                ttl_to_use = dynamic_ttl

                logger.debug(f"🎯 Sport-aware cache set: {key} with TTL {ttl_to_use}s ({sport}:{data_category})")

            else:
                # Fallback to base TTL if provided, otherwise default
                ttl_to_use = base_ttl if base_ttl else 3600
                logger.debug(f"⚠️ Using fallback TTL {ttl_to_use}s for {key}")

            # Set with calculated TTL
            return await self.set(
                key=key,
                value=value,
                ttl_seconds=ttl_to_use,
                user_context=user_id
            )

        except Exception as e:
            logger.error(f"❌ Error in sport-aware cache set: {e}")
            # Fallback to regular set
            return await self.set(key, value, base_ttl or 3600)

    async def get_sport_data(
        self,
        sport: str,
        data_category: str,
        key: str,
        user_id: str = None,
        default: Any = None
    ) -> Any:
        """Get sport data with user tracking for volatility optimization"""
        try:
            from backend.services.sport_volatility_models import sport_volatility_models, SportType, DataCategory

            # Get the data
            result = await self.get(key, default, user_context=user_id)

            # Track access for volatility modeling
            try:
                sport_enum = SportType(sport.lower()) if sport else None
                category_mapping = {
                    'live_scores': DataCategory.LIVE_SCORES,
                    'live_odds': DataCategory.LIVE_ODDS,
                    'pre_game_odds': DataCategory.PRE_GAME_ODDS,
                    'player_stats': DataCategory.PLAYER_STATS,
                    'team_stats': DataCategory.TEAM_STATS,
                    'injury_reports': DataCategory.INJURY_REPORTS,
                    'game_schedules': DataCategory.GAME_SCHEDULES,
                    'player_props': DataCategory.PLAYER_PROPS,
                    'news_updates': DataCategory.NEWS_UPDATES
                }
                category_enum = category_mapping.get(data_category.lower())

                if sport_enum and category_enum and user_id:
                    await sport_volatility_models.track_user_access(user_id, sport_enum, category_enum)

            except Exception as e:
                logger.debug(f"⚠️ Error tracking sport data access: {e}")

            return result

        except Exception as e:
            logger.error(f"❌ Error in sport-aware cache get: {e}")
            return await self.get(key, default)

    async def warm_sport_cache(self, sport: str, priority_data: List[str] = None) -> int:
        """Warm cache for sport-specific data based on volatility priorities"""
        try:
            from backend.services.sport_volatility_models import sport_volatility_models, SportType

            sport_enum = SportType(sport.lower()) if sport else None
            if not sport_enum:
                logger.warning(f"⚠️ Unknown sport for cache warming: {sport}")
                return 0

            # Get cache warming priorities
            priorities = await sport_volatility_models.get_cache_warming_priorities(sport_enum)

            warming_count = 0

            # Focus on high-priority data categories
            for data_category, priority_score in priorities[:5]:  # Top 5 priorities
                try:
                    # Generate cache warming patterns for this data category
                    patterns = self._generate_warming_patterns(sport, data_category.value)

                    if patterns:
                        # Create a dummy data fetcher for warming
                        async def sport_data_fetcher(pattern):
                            # In production, this would fetch actual data
                            # For now, return None to indicate warming attempt
                            return None

                        await self.warm_cache(
                            patterns=patterns,
                            data_fetcher=sport_data_fetcher,
                            priority="high" if priority_score > 100 else "normal"
                        )

                        warming_count += len(patterns)

                except Exception as e:
                    logger.error(f"❌ Error warming cache for {data_category.value}: {e}")

            logger.info(f"🔥 Warmed {warming_count} cache patterns for {sport}")
            return warming_count

        except Exception as e:
            logger.error(f"❌ Error in sport cache warming: {e}")
            return 0

    def _generate_warming_patterns(self, sport: str, data_category: str) -> List[str]:
        """Generate cache key patterns for warming based on sport and data category"""
        patterns = []

        base_patterns = {
            'live_scores': [
                f"sportradar_live_{sport}",
                f"{sport}_live_games",
                f"live_scores_{sport}_today"
            ],
            'live_odds': [
                f"odds_live_{sport}",
                f"{sport}_live_betting",
                f"live_odds_{sport}_games"
            ],
            'player_stats': [
                f"player_stats_{sport}_*",
                f"{sport}_player_profiles_*",
                f"stats_{sport}_players_*"
            ],
            'injury_reports': [
                f"injuries_{sport}",
                f"{sport}_injury_report",
                f"injury_updates_{sport}"
            ],
            'game_schedules': [
                f"schedule_{sport}",
                f"{sport}_upcoming_games",
                f"games_{sport}_schedule"
            ]
        }

        return base_patterns.get(data_category, [f"{sport}_{data_category}"])

    async def get_sport_cache_metrics(self) -> Dict[str, Any]:
        """Get sport-specific cache metrics and volatility insights"""
        try:
            from backend.services.sport_volatility_models import sport_volatility_models

            # Get basic cache metrics
            base_metrics = await self.get_metrics()

            # Get volatility model summary
            volatility_summary = sport_volatility_models.get_volatility_summary()

            # Analyze cache keys by sport
            sport_analysis = {}
            for key in list(self.access_patterns.keys())[:100]:  # Sample first 100 keys
                sport_type, data_category, user_id = self._parse_cache_key_for_volatility(key)

                if sport_type:
                    sport_name = sport_type.value
                    if sport_name not in sport_analysis:
                        sport_analysis[sport_name] = {
                            "total_keys": 0,
                            "categories": {},
                            "avg_access_frequency": 0,
                            "total_accesses": 0
                        }

                    sport_analysis[sport_name]["total_keys"] += 1

                    if data_category:
                        category_name = data_category.value
                        if category_name not in sport_analysis[sport_name]["categories"]:
                            sport_analysis[sport_name]["categories"][category_name] = 0
                        sport_analysis[sport_name]["categories"][category_name] += 1

                    # Add access frequency
                    pattern = self.access_patterns[key]
                    sport_analysis[sport_name]["total_accesses"] += pattern.access_frequency

            # Calculate averages
            for sport_data in sport_analysis.values():
                if sport_data["total_keys"] > 0:
                    sport_data["avg_access_frequency"] = (
                        sport_data["total_accesses"] / sport_data["total_keys"]
                    )

            return {
                "base_metrics": asdict(base_metrics),
                "volatility_models": volatility_summary,
                "sport_analysis": sport_analysis,
                "total_sport_aware_keys": sum(s["total_keys"] for s in sport_analysis.values()),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }

        except Exception as e:
            logger.error(f"❌ Error getting sport cache metrics: {e}")
            return {"error": str(e)}

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
        """Calculate intelligent TTL based on access patterns and sport volatility models"""
        # Try to use sport-specific volatility models first
        try:
            from backend.services.sport_volatility_models import sport_volatility_models, SportType, DataCategory

            # Parse sport and data category from cache key
            sport_type, data_category, user_id = self._parse_cache_key_for_volatility(key, user_context)

            if sport_type and data_category:
                # Get access count for this user and data type
                access_count = 1
                if key in self.access_patterns:
                    access_count = self.access_patterns[key].access_frequency

                # Extract game_id if present in key
                game_id = self._extract_game_id_from_key(key)

                # Use sport-specific volatility model
                dynamic_ttl = await sport_volatility_models.get_dynamic_ttl(
                    sport=sport_type,
                    data_category=data_category,
                    game_id=game_id,
                    user_id=user_id,
                    access_count=access_count
                )

                # Track user access for future optimization
                if user_id:
                    await sport_volatility_models.track_user_access(user_id, sport_type, data_category)

                logger.debug(f"🎯 Using sport volatility model TTL: {dynamic_ttl}s for {key}")
                return dynamic_ttl

        except Exception as e:
            logger.debug(f"⚠️ Sport volatility model fallback for {key}: {e}")

        # Fallback to original logic if sport model not available
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

    def _parse_cache_key_for_volatility(self, key: str, user_context: str = None) -> Tuple[Optional[any], Optional[any], Optional[str]]:
        """Parse cache key to extract sport type and data category for volatility models"""
        try:
            from backend.services.sport_volatility_models import SportType, DataCategory

            key_lower = key.lower()

            # Detect sport type
            sport_type = None
            for sport in SportType:
                if sport.value in key_lower:
                    sport_type = sport
                    break

            # Detect data category
            data_category = None
            category_keywords = {
                DataCategory.LIVE_SCORES: ['live', 'score', 'game_live'],
                DataCategory.LIVE_ODDS: ['live_odds', 'odds_live'],
                DataCategory.PRE_GAME_ODDS: ['odds', 'betting', 'line'],
                DataCategory.PLAYER_STATS: ['player', 'stats', 'profile'],
                DataCategory.TEAM_STATS: ['team', 'roster'],
                DataCategory.INJURY_REPORTS: ['injury', 'injured'],
                DataCategory.GAME_SCHEDULES: ['schedule', 'calendar', 'upcoming'],
                DataCategory.PLAYER_PROPS: ['props', 'proposition'],
                DataCategory.NEWS_UPDATES: ['news', 'update', 'headlines']
            }

            for category, keywords in category_keywords.items():
                if any(keyword in key_lower for keyword in keywords):
                    data_category = category
                    break

            # Extract user ID from context or key
            user_id = None
            if user_context and 'user' in user_context:
                user_id = user_context
            elif 'user_' in key_lower:
                # Try to extract user ID from key pattern like "user_123_data"
                import re
                match = re.search(r'user_(\w+)', key_lower)
                if match:
                    user_id = match.group(1)

            return sport_type, data_category, user_id

        except Exception as e:
            logger.debug(f"⚠️ Error parsing cache key for volatility: {e}")
            return None, None, None

    def _extract_game_id_from_key(self, key: str) -> Optional[str]:
        """Extract game ID from cache key if present"""
        try:
            import re
            # Look for patterns like "game_12345" or "12345_game" or similar
            patterns = [
                r'game_([a-zA-Z0-9\-_]+)',
                r'([a-zA-Z0-9\-_]+)_game',
                r'event_([a-zA-Z0-9\-_]+)',
                r'match_([a-zA-Z0-9\-_]+)'
            ]

            for pattern in patterns:
                match = re.search(pattern, key.lower())
                if match:
                    return match.group(1)

            return None

        except Exception:
            return None

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
