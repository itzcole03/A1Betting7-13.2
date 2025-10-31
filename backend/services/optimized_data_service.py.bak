"""
Optimized Data Service
High-performance data fetching with intelligent caching, batching, and connection pooling
"""

import asyncio
import hashlib
import json
import logging
import time
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Set, Tuple, Union

import redis.asyncio as redis

from backend.services.mlb_stats_api_client import MLBStatsAPIClient

logger = logging.getLogger(__name__)


@dataclass
class CacheMetrics:
    """Cache performance metrics"""

    hits: int = 0
    misses: int = 0
    evictions: int = 0
    avg_latency: float = 0.0
    last_updated: float = field(default_factory=time.time)


@dataclass
class BatchRequest:
    """Batch request for optimized processing"""

    request_id: str
    player_name: str
    stat_types: List[str]
    callback: asyncio.Future
    priority: int = 1  # 1=high, 2=normal, 3=low
    timestamp: float = field(default_factory=time.time)


@dataclass
class PlayerCacheEntry:
    """Comprehensive player data cache entry"""

    player_id: int
    basic_info: Dict[str, Any]
    game_logs: Dict[str, Any]
    season_stats: Dict[str, Any]
    cached_at: float
    ttl: int = 300  # 5 minutes default


class OptimizedDataService:
    """
    High-performance data service with intelligent caching and batching

    Features:
    - Connection pooling for external APIs
    - Intelligent request batching and coalescing
    - Multi-layer caching with smart invalidation
    - Predictive data prefetching
    - Performance monitoring and metrics
    """

    def __init__(self):
        self.mlb_client = MLBStatsAPIClient()
        self.redis_pool: Optional[redis.ConnectionPool] = None
        self.metrics = CacheMetrics()

        # Request batching
        self.batch_queue: List[BatchRequest] = []
        self.batch_timer: Optional[asyncio.Task] = None
        self.batch_window = 0.1  # 100ms batch window
        self.max_batch_size = 10

        # Caching layers
        self.memory_cache: Dict[str, PlayerCacheEntry] = {}
        self.max_memory_cache_size = 500
        self.coalesced_requests: Dict[str, List[asyncio.Future]] = defaultdict(list)

        # Performance tracking
        self.request_counts = defaultdict(int)
        self.response_times = defaultdict(list)
        self.last_metrics_reset = time.time()

    async def initialize(self):
        """Initialize all service components"""
        try:
            # Initialize Redis connection pool
            self.redis_pool = redis.ConnectionPool.from_url(
                "redis://localhost:6379/0",
                max_connections=20,
                retry_on_timeout=True,
                socket_connect_timeout=5,
                socket_timeout=5,
            )

            # Start batch processor
            self._start_batch_processor()

            # Start cache cleanup task
            asyncio.create_task(self._cache_cleanup_loop())

            logger.info("OptimizedDataService initialized with connection pooling")

        except Exception as e:
            logger.error(f"Failed to initialize OptimizedDataService: {e}")
            raise

    async def get_redis(self) -> redis.Redis:
        """Get Redis connection from pool"""
        if not self.redis_pool:
            await self.initialize()
        return redis.Redis(connection_pool=self.redis_pool)

    def _generate_cache_key(self, prefix: str, *args) -> str:
        """Generate consistent cache key"""
        key_data = f"{prefix}:{':'.join(map(str, args))}"
        return hashlib.md5(key_data.encode()).hexdigest()[:16]

    async def get_player_data_optimized(
        self, player_name: str, stat_types: List[str], force_refresh: bool = False
    ) -> Optional[Dict[str, Any]]:
        """
        Get comprehensive player data with intelligent caching

        Args:
            player_name: Name of the player
            stat_types: List of statistics needed
            force_refresh: Whether to bypass cache

        Returns:
            Comprehensive player data dictionary
        """
        start_time = time.time()

        try:
            # Generate cache key for this specific request
            cache_key = self._generate_cache_key(
                "player_comprehensive", player_name, *sorted(stat_types)
            )

            # Check if this exact request is already being processed (request coalescing)
            if cache_key in self.coalesced_requests:
                logger.debug(f"Coalescing request for {player_name}")
                future = asyncio.Future()
                self.coalesced_requests[cache_key].append(future)
                return await future

            # Check memory cache first
            if not force_refresh and cache_key in self.memory_cache:
                entry = self.memory_cache[cache_key]
                if time.time() - entry.cached_at < entry.ttl:
                    self.metrics.hits += 1
                    self._record_response_time(cache_key, time.time() - start_time)
                    logger.debug(f"Memory cache hit for {player_name}")
                    return self._build_comprehensive_response(entry)

            # Check Redis cache
            redis_conn = await self.get_redis()
            redis_key = f"optimized:player:{cache_key}"

            if not force_refresh:
                cached_data = await redis_conn.get(redis_key)
                if cached_data:
                    self.metrics.hits += 1
                    data = json.loads(cached_data)
                    self._record_response_time(cache_key, time.time() - start_time)
                    logger.debug(f"Redis cache hit for {player_name}")
                    return data

            # Cache miss - add to coalescing group
            self.coalesced_requests[cache_key] = []

            try:
                # Fetch fresh data
                self.metrics.misses += 1
                player_data = await self._fetch_comprehensive_player_data(
                    player_name, stat_types
                )

                if player_data:
                    # Cache in memory
                    self._update_memory_cache(cache_key, player_data)

                    # Cache in Redis for 5 minutes
                    await redis_conn.setex(redis_key, 300, json.dumps(player_data))

                    logger.info(
                        f"Fetched and cached comprehensive data for {player_name}"
                    )

                # Resolve all coalesced requests
                for future in self.coalesced_requests[cache_key]:
                    if not future.done():
                        future.set_result(player_data)

                self._record_response_time(cache_key, time.time() - start_time)
                return player_data

            finally:
                # Clean up coalescing group
                self.coalesced_requests.pop(cache_key, None)

        except Exception as e:
            logger.error(f"Error in get_player_data_optimized for {player_name}: {e}")
            # Resolve coalesced requests with None
            for future in self.coalesced_requests.get(cache_key, []):
                if not future.done():
                    future.set_result(None)
            self.coalesced_requests.pop(cache_key, None)
            return None

    async def _fetch_comprehensive_player_data(
        self, player_name: str, stat_types: List[str]
    ) -> Optional[Dict[str, Any]]:
        """Fetch all required player data in optimized manner"""
        try:
            # Step 1: Get player ID (cached separately for reuse)
            player_id = await self._get_cached_player_id(player_name)
            if not player_id:
                return None

            # Step 2: Batch fetch all required data concurrently
            tasks = []

            # Basic player info (cached for 1 hour)
            tasks.append(self._get_cached_player_info(player_id))

            # Game logs (cached for 5 minutes)
            tasks.append(self._get_cached_game_logs(player_id))

            # Season stats for each stat type (cached for 10 minutes)
            for stat_type in stat_types:
                tasks.append(self._get_cached_season_stats(player_id, stat_type))

            # Execute all requests concurrently
            results = await asyncio.gather(*tasks, return_exceptions=True)

            # Build comprehensive response
            player_info = results[0] if not isinstance(results[0], Exception) else {}
            game_logs = results[1] if not isinstance(results[1], Exception) else {}

            season_stats = {}
            for i, stat_type in enumerate(stat_types):
                stat_result = results[2 + i]
                if not isinstance(stat_result, Exception):
                    season_stats[stat_type] = stat_result

            return {
                "player_id": player_id,
                "player_info": player_info,
                "game_logs": game_logs,
                "season_stats": season_stats,
                "stat_types": stat_types,
                "fetched_at": time.time(),
            }

        except Exception as e:
            logger.error(f"Error fetching comprehensive data for {player_name}: {e}")
            return None

    async def _get_cached_player_id(self, player_name: str) -> Optional[int]:
        """Get player ID with dedicated caching (24 hour TTL)"""
        cache_key = f"player_id:{player_name.lower().replace(' ', '_')}"
        redis_conn = await self.get_redis()

        # Check cache first
        cached_id = await redis_conn.get(cache_key)
        if cached_id:
            return int(cached_id)

        # Fetch from API
        players = await self.mlb_client.search_players(player_name, active_only=True)
        if players:
            player_id = players[0].get("id")
            if player_id:
                # Cache for 24 hours (player IDs don't change)
                await redis_conn.setex(cache_key, 86400, str(player_id))
                return player_id

        return None

    async def _get_cached_player_info(self, player_id: int) -> Dict[str, Any]:
        """Get player basic info with caching"""
        cache_key = f"player_info:{player_id}"
        redis_conn = await self.get_redis()

        cached_info = await redis_conn.get(cache_key)
        if cached_info:
            return json.loads(cached_info)

        # Fetch from API (implementation would go here)
        player_info = {}  # Placeholder for actual API call

        # Cache for 1 hour
        await redis_conn.setex(cache_key, 3600, json.dumps(player_info))
        return player_info

    async def _get_cached_game_logs(self, player_id: int) -> Dict[str, Any]:
        """Get player game logs with caching"""
        cache_key = f"game_logs:{player_id}"
        redis_conn = await self.get_redis()

        cached_logs = await redis_conn.get(cache_key)
        if cached_logs:
            return json.loads(cached_logs)

        # Fetch from API
        game_logs = await self.mlb_client.get_player_game_log(player_id)

        # Cache for 5 minutes (games update frequently)
        await redis_conn.setex(cache_key, 300, json.dumps(game_logs or {}))
        return game_logs or {}

    async def _get_cached_season_stats(
        self, player_id: int, stat_type: str
    ) -> Dict[str, Any]:
        """Get player season stats with caching"""
        cache_key = f"season_stats:{player_id}:{stat_type}"
        redis_conn = await self.get_redis()

        cached_stats = await redis_conn.get(cache_key)
        if cached_stats:
            return json.loads(cached_stats)

        # Fetch from API
        season_stats = await self.mlb_client.get_player_stats(player_id, "season")

        # Cache for 10 minutes
        await redis_conn.setex(cache_key, 600, json.dumps(season_stats or {}))
        return season_stats or {}

    def _update_memory_cache(self, cache_key: str, data: Dict[str, Any]):
        """Update memory cache with LRU eviction"""
        if len(self.memory_cache) >= self.max_memory_cache_size:
            # Simple LRU: remove oldest entry
            oldest_key = min(
                self.memory_cache.keys(), key=lambda k: self.memory_cache[k].cached_at
            )
            del self.memory_cache[oldest_key]
            self.metrics.evictions += 1

        # Create cache entry
        entry = PlayerCacheEntry(
            player_id=data.get("player_id", 0),
            basic_info=data.get("player_info", {}),
            game_logs=data.get("game_logs", {}),
            season_stats=data.get("season_stats", {}),
            cached_at=time.time(),
        )

        self.memory_cache[cache_key] = entry

    def _build_comprehensive_response(self, entry: PlayerCacheEntry) -> Dict[str, Any]:
        """Build response from cache entry"""
        return {
            "player_id": entry.player_id,
            "player_info": entry.basic_info,
            "game_logs": entry.game_logs,
            "season_stats": entry.season_stats,
            "fetched_at": entry.cached_at,
        }

    def _record_response_time(self, cache_key: str, response_time: float):
        """Record response time for metrics"""
        self.response_times[cache_key].append(response_time)
        # Keep only last 100 measurements
        if len(self.response_times[cache_key]) > 100:
            self.response_times[cache_key] = self.response_times[cache_key][-100:]

    def _start_batch_processor(self):
        """Start the batch processing task"""
        asyncio.create_task(self._batch_processor_loop())

    async def _batch_processor_loop(self):
        """Process batched requests periodically"""
        while True:
            try:
                await asyncio.sleep(self.batch_window)

                if self.batch_queue:
                    batch = self.batch_queue[: self.max_batch_size]
                    self.batch_queue = self.batch_queue[self.max_batch_size :]

                    await self._process_batch(batch)

            except Exception as e:
                logger.error(f"Error in batch processor: {e}")

    async def _process_batch(self, batch: List[BatchRequest]):
        """Process a batch of requests efficiently"""
        # Group by player for efficiency
        player_groups = defaultdict(list)
        for request in batch:
            player_groups[request.player_name].append(request)

        # Process each player's requests
        for player_name, requests in player_groups.items():
            all_stat_types = []
            for req in requests:
                all_stat_types.extend(req.stat_types)

            # Remove duplicates while preserving order
            unique_stat_types = list(dict.fromkeys(all_stat_types))

            # Fetch comprehensive data once for all requests
            player_data = await self.get_player_data_optimized(
                player_name, unique_stat_types
            )

            # Resolve all futures for this player
            for request in requests:
                if not request.callback.done():
                    request.callback.set_result(player_data)

    async def _cache_cleanup_loop(self):
        """Periodic cache cleanup to prevent memory leaks"""
        while True:
            try:
                await asyncio.sleep(300)  # Every 5 minutes

                current_time = time.time()
                expired_keys = []

                # Find expired entries
                for key, entry in self.memory_cache.items():
                    if current_time - entry.cached_at > entry.ttl:
                        expired_keys.append(key)

                # Remove expired entries
                for key in expired_keys:
                    del self.memory_cache[key]
                    self.metrics.evictions += 1

                if expired_keys:
                    logger.debug(
                        f"Cleaned up {len(expired_keys)} expired cache entries"
                    )

            except Exception as e:
                logger.error(f"Error in cache cleanup: {e}")

    async def get_performance_metrics(self) -> Dict[str, Any]:
        """Get comprehensive performance metrics"""
        current_time = time.time()
        uptime = current_time - self.last_metrics_reset

        # Calculate average response times
        avg_response_times = {}
        for key, times in self.response_times.items():
            if times:
                avg_response_times[key] = sum(times) / len(times)

        return {
            "cache_metrics": {
                "hits": self.metrics.hits,
                "misses": self.metrics.misses,
                "hit_rate": self.metrics.hits
                / max(1, self.metrics.hits + self.metrics.misses),
                "evictions": self.metrics.evictions,
                "memory_cache_size": len(self.memory_cache),
                "max_memory_cache_size": self.max_memory_cache_size,
            },
            "performance_metrics": {
                "uptime": uptime,
                "avg_response_times": avg_response_times,
                "batch_queue_size": len(self.batch_queue),
                "coalesced_requests": len(self.coalesced_requests),
                "request_counts": dict(self.request_counts),
            },
            "timestamp": current_time,
        }

    async def warm_cache(self, player_names: List[str], stat_types: List[str]):
        """Proactively warm cache with commonly requested data"""
        logger.info(f"Warming cache for {len(player_names)} players")

        tasks = []
        for player_name in player_names:
            task = self.get_player_data_optimized(player_name, stat_types)
            tasks.append(task)

        # Execute with controlled concurrency
        semaphore = asyncio.Semaphore(5)  # Max 5 concurrent requests

        async def controlled_fetch(task):
            async with semaphore:
                return await task

        results = await asyncio.gather(
            *[controlled_fetch(task) for task in tasks], return_exceptions=True
        )

        successful = sum(
            1 for r in results if not isinstance(r, Exception) and r is not None
        )
        logger.info(
            f"Cache warming completed: {successful}/{len(player_names)} successful"
        )


# Global instance
optimized_data_service = OptimizedDataService()
