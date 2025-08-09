"""
Optimized Intelligent Caching Strategy Service

This service implements sophisticated caching strategies to ensure real-time data
freshness while minimizing API calls and maximizing performance. Directly impacts
the speed and responsiveness of predictions with intelligent cache invalidation.
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union, Callable, Tuple
import json
import hashlib
import redis
import pickle
from dataclasses import dataclass, asdict
from enum import Enum
import numpy as np
import time
from concurrent.futures import ThreadPoolExecutor
import threading

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CacheStrategy(Enum):
    """Different caching strategies"""
    LRU = "lru"  # Least Recently Used
    LFU = "lfu"  # Least Frequently Used
    TTL = "ttl"  # Time To Live
    ADAPTIVE = "adaptive"  # Adaptive based on data patterns
    PREDICTIVE = "predictive"  # Predictive pre-loading
    HIERARCHICAL = "hierarchical"  # Multi-level caching

class DataFreshness(Enum):
    """Data freshness requirements"""
    REAL_TIME = "real_time"  # < 5 seconds
    NEAR_REAL_TIME = "near_real_time"  # < 30 seconds
    FRESH = "fresh"  # < 5 minutes
    MODERATE = "moderate"  # < 30 minutes
    STATIC = "static"  # > 1 hour

class CacheType(Enum):
    """Types of cache storage"""
    MEMORY = "memory"
    REDIS = "redis"
    DISTRIBUTED = "distributed"
    HYBRID = "hybrid"

@dataclass
class CacheConfiguration:
    """Cache configuration for different data types"""
    data_type: str
    strategy: CacheStrategy
    freshness_requirement: DataFreshness
    ttl_seconds: int
    max_size: int
    preload_enabled: bool
    invalidation_triggers: List[str]
    compression_enabled: bool
    replication_factor: int

@dataclass
class CacheEntry:
    """Individual cache entry"""
    key: str
    value: Any
    created_at: datetime
    last_accessed: datetime
    access_count: int
    ttl_seconds: int
    freshness_score: float
    size_bytes: int
    tags: List[str]
    dependencies: List[str]

@dataclass
class CacheMetrics:
    """Cache performance metrics"""
    cache_type: str
    hit_rate: float
    miss_rate: float
    total_requests: int
    total_hits: int
    total_misses: int
    average_response_time: float
    memory_usage_mb: float
    eviction_count: int
    invalidation_count: int
    timestamp: datetime

@dataclass
class DataAccessPattern:
    """Data access pattern analysis"""
    data_type: str
    access_frequency: float
    peak_hours: List[int]
    seasonal_patterns: Dict[str, float]
    user_segments: List[str]
    prediction_confidence: float
    recommended_strategy: CacheStrategy

class OptimizedIntelligentCachingService:
    """
    Service for intelligent caching with real-time optimization
    """
    
    def __init__(self, redis_host: str = "localhost", redis_port: int = 6379):
        self.redis_client = redis.Redis(host=redis_host, port=redis_port, decode_responses=False)
        self.local_cache = {}
        self.cache_configs = {}
        self.access_patterns = {}
        self.metrics = {}
        self.locks = {}
        self.executor = ThreadPoolExecutor(max_workers=10)
        self._initialize_cache_configurations()
        self._start_background_tasks()
        
    def _initialize_cache_configurations(self):
        """Initialize cache configurations for different data types"""
        
        configs = [
            # Real-time betting odds
            CacheConfiguration(
                data_type="betting_odds",
                strategy=CacheStrategy.ADAPTIVE,
                freshness_requirement=DataFreshness.REAL_TIME,
                ttl_seconds=5,
                max_size=10000,
                preload_enabled=True,
                invalidation_triggers=["odds_update", "line_movement"],
                compression_enabled=False,
                replication_factor=3
            ),
            
            # Player statistics
            CacheConfiguration(
                data_type="player_stats",
                strategy=CacheStrategy.LRU,
                freshness_requirement=DataFreshness.FRESH,
                ttl_seconds=300,
                max_size=50000,
                preload_enabled=True,
                invalidation_triggers=["game_completion", "stat_update"],
                compression_enabled=True,
                replication_factor=2
            ),
            
            # Game schedules
            CacheConfiguration(
                data_type="game_schedules",
                strategy=CacheStrategy.TTL,
                freshness_requirement=DataFreshness.MODERATE,
                ttl_seconds=1800,
                max_size=20000,
                preload_enabled=True,
                invalidation_triggers=["schedule_change"],
                compression_enabled=True,
                replication_factor=2
            ),
            
            # Predictions
            CacheConfiguration(
                data_type="predictions",
                strategy=CacheStrategy.PREDICTIVE,
                freshness_requirement=DataFreshness.NEAR_REAL_TIME,
                ttl_seconds=30,
                max_size=25000,
                preload_enabled=True,
                invalidation_triggers=["model_update", "data_change"],
                compression_enabled=True,
                replication_factor=3
            ),
            
            # Historical data
            CacheConfiguration(
                data_type="historical_data",
                strategy=CacheStrategy.LFU,
                freshness_requirement=DataFreshness.STATIC,
                ttl_seconds=86400,  # 24 hours
                max_size=100000,
                preload_enabled=False,
                invalidation_triggers=[],
                compression_enabled=True,
                replication_factor=1
            ),
            
            # Social sentiment
            CacheConfiguration(
                data_type="social_sentiment",
                strategy=CacheStrategy.ADAPTIVE,
                freshness_requirement=DataFreshness.FRESH,
                ttl_seconds=900,  # 15 minutes
                max_size=15000,
                preload_enabled=False,
                invalidation_triggers=["sentiment_spike"],
                compression_enabled=True,
                replication_factor=2
            )
        ]
        
        for config in configs:
            self.cache_configs[config.data_type] = config

    def _start_background_tasks(self):
        """Start background tasks for cache maintenance"""
        
        # Start metrics collection
        threading.Thread(target=self._metrics_collector, daemon=True).start()
        
        # Start cache optimizer
        threading.Thread(target=self._cache_optimizer, daemon=True).start()
        
        # Start predictive preloader
        threading.Thread(target=self._predictive_preloader, daemon=True).start()

    async def get(
        self,
        key: str,
        data_type: str,
        fetch_function: Optional[Callable] = None,
        force_refresh: bool = False
    ) -> Tuple[Any, bool]:
        """
        Get data from cache with intelligent fallback
        
        Args:
            key: Cache key
            data_type: Type of data being cached
            fetch_function: Function to fetch data if not in cache
            force_refresh: Force refresh from source
            
        Returns:
            Tuple of (data, cache_hit)
        """
        start_time = time.time()
        cache_hit = False
        
        try:
            # Get cache configuration
            config = self.cache_configs.get(data_type)
            if not config:
                logger.warning(f"No cache config for data type: {data_type}")
                if fetch_function:
                    return await fetch_function(), False
                return None, False
            
            # Record access pattern
            self._record_access_pattern(key, data_type)
            
            if not force_refresh:
                # Try to get from cache
                cached_data = await self._get_from_cache(key, data_type, config)
                if cached_data is not None:
                    cache_hit = True
                    self._update_metrics(data_type, True, time.time() - start_time)
                    return cached_data, cache_hit
            
            # Cache miss - fetch from source
            if fetch_function:
                fresh_data = await fetch_function()
                
                # Store in cache
                await self._set_in_cache(key, fresh_data, data_type, config)
                
                self._update_metrics(data_type, False, time.time() - start_time)
                return fresh_data, cache_hit
            else:
                self._update_metrics(data_type, False, time.time() - start_time)
                return None, cache_hit
                
        except Exception as e:
            logger.error(f"Error in cache get operation: {str(e)}")
            if fetch_function:
                try:
                    return await fetch_function(), False
                except Exception as fetch_error:
                    logger.error(f"Error in fetch function: {str(fetch_error)}")
            return None, False

    async def _get_from_cache(
        self,
        key: str,
        data_type: str,
        config: CacheConfiguration
    ) -> Optional[Any]:
        """Get data from appropriate cache layer"""
        
        # Try memory cache first (fastest)
        if config.strategy in [CacheStrategy.LRU, CacheStrategy.ADAPTIVE]:
            memory_data = self._get_from_memory(key, config)
            if memory_data is not None:
                return memory_data
        
        # Try Redis cache
        redis_data = await self._get_from_redis(key, config)
        if redis_data is not None:
            # Promote to memory cache if frequently accessed
            if self._should_promote_to_memory(key, data_type):
                self._set_in_memory(key, redis_data, config)
            return redis_data
        
        return None

    def _get_from_memory(self, key: str, config: CacheConfiguration) -> Optional[Any]:
        """Get data from local memory cache"""
        
        if key not in self.local_cache:
            return None
            
        entry = self.local_cache[key]
        
        # Check TTL
        if (datetime.now() - entry.created_at).total_seconds() > entry.ttl_seconds:
            del self.local_cache[key]
            return None
        
        # Update access statistics
        entry.last_accessed = datetime.now()
        entry.access_count += 1
        
        return entry.value

    async def _get_from_redis(self, key: str, config: CacheConfiguration) -> Optional[Any]:
        """Get data from Redis cache"""
        
        try:
            # Get data and metadata
            data_key = f"data:{key}"
            meta_key = f"meta:{key}"
            
            # Use pipeline for atomic operations
            pipe = self.redis_client.pipeline()
            pipe.get(data_key)
            pipe.hgetall(meta_key)
            results = pipe.execute()
            
            data_bytes = results[0]
            metadata = results[1]
            
            if data_bytes is None:
                return None
            
            # Check TTL
            if metadata:
                created_at = datetime.fromisoformat(metadata.get(b'created_at', b'').decode())
                ttl_seconds = int(metadata.get(b'ttl_seconds', b'0'))
                
                if (datetime.now() - created_at).total_seconds() > ttl_seconds:
                    # Expired - remove from cache
                    await self._remove_from_redis(key)
                    return None
            
            # Deserialize data
            if config.compression_enabled:
                data = pickle.loads(data_bytes)
            else:
                data = json.loads(data_bytes.decode())
            
            # Update access count
            self.redis_client.hincrby(meta_key, "access_count", 1)
            self.redis_client.hset(meta_key, "last_accessed", datetime.now().isoformat())
            
            return data
            
        except Exception as e:
            logger.error(f"Error getting from Redis: {str(e)}")
            return None

    async def _set_in_cache(
        self,
        key: str,
        value: Any,
        data_type: str,
        config: CacheConfiguration
    ):
        """Set data in appropriate cache layers"""
        
        try:
            # Always store in Redis for persistence
            await self._set_in_redis(key, value, config)
            
            # Store in memory for frequently accessed data
            if self._should_store_in_memory(key, data_type, config):
                self._set_in_memory(key, value, config)
                
        except Exception as e:
            logger.error(f"Error setting cache: {str(e)}")

    def _set_in_memory(self, key: str, value: Any, config: CacheConfiguration):
        """Set data in local memory cache"""
        
        # Check memory limits
        if len(self.local_cache) >= config.max_size:
            self._evict_from_memory(config)
        
        # Create cache entry
        entry = CacheEntry(
            key=key,
            value=value,
            created_at=datetime.now(),
            last_accessed=datetime.now(),
            access_count=1,
            ttl_seconds=config.ttl_seconds,
            freshness_score=1.0,
            size_bytes=len(pickle.dumps(value)),
            tags=[config.data_type],
            dependencies=[]
        )
        
        self.local_cache[key] = entry

    async def _set_in_redis(self, key: str, value: Any, config: CacheConfiguration):
        """Set data in Redis cache"""
        
        try:
            data_key = f"data:{key}"
            meta_key = f"meta:{key}"
            
            # Serialize data
            if config.compression_enabled:
                data_bytes = pickle.dumps(value)
            else:
                data_bytes = json.dumps(value).encode()
            
            # Prepare metadata
            metadata = {
                "created_at": datetime.now().isoformat(),
                "ttl_seconds": config.ttl_seconds,
                "data_type": config.data_type,
                "access_count": 1,
                "last_accessed": datetime.now().isoformat(),
                "size_bytes": len(data_bytes)
            }
            
            # Use pipeline for atomic operations
            pipe = self.redis_client.pipeline()
            pipe.set(data_key, data_bytes)
            pipe.hset(meta_key, mapping=metadata)
            pipe.expire(data_key, config.ttl_seconds * 2)  # Safety margin
            pipe.expire(meta_key, config.ttl_seconds * 2)
            pipe.execute()
            
        except Exception as e:
            logger.error(f"Error setting Redis cache: {str(e)}")

    def _should_promote_to_memory(self, key: str, data_type: str) -> bool:
        """Determine if Redis data should be promoted to memory"""
        
        # Check access pattern
        pattern = self.access_patterns.get(key, {})
        access_frequency = pattern.get("frequency", 0)
        
        # Promote if frequently accessed
        return access_frequency > 10  # Accessed more than 10 times

    def _should_store_in_memory(self, key: str, data_type: str, config: CacheConfiguration) -> bool:
        """Determine if data should be stored in memory"""
        
        # Always store real-time data in memory
        if config.freshness_requirement == DataFreshness.REAL_TIME:
            return True
        
        # Store if data is small and frequently accessed
        if config.data_type in ["betting_odds", "predictions"]:
            return True
        
        return False

    def _evict_from_memory(self, config: CacheConfiguration):
        """Evict entries from memory cache based on strategy"""
        
        if not self.local_cache:
            return
        
        if config.strategy == CacheStrategy.LRU:
            # Remove least recently used
            lru_key = min(self.local_cache.keys(), 
                         key=lambda k: self.local_cache[k].last_accessed)
            del self.local_cache[lru_key]
            
        elif config.strategy == CacheStrategy.LFU:
            # Remove least frequently used
            lfu_key = min(self.local_cache.keys(),
                         key=lambda k: self.local_cache[k].access_count)
            del self.local_cache[lfu_key]
            
        elif config.strategy == CacheStrategy.TTL:
            # Remove oldest entry
            oldest_key = min(self.local_cache.keys(),
                           key=lambda k: self.local_cache[k].created_at)
            del self.local_cache[oldest_key]

    async def _remove_from_redis(self, key: str):
        """Remove expired entry from Redis"""
        
        try:
            data_key = f"data:{key}"
            meta_key = f"meta:{key}"
            
            pipe = self.redis_client.pipeline()
            pipe.delete(data_key)
            pipe.delete(meta_key)
            pipe.execute()
            
        except Exception as e:
            logger.error(f"Error removing from Redis: {str(e)}")

    def _record_access_pattern(self, key: str, data_type: str):
        """Record access patterns for optimization"""
        
        if key not in self.access_patterns:
            self.access_patterns[key] = {
                "data_type": data_type,
                "frequency": 0,
                "last_access": datetime.now(),
                "access_times": []
            }
        
        pattern = self.access_patterns[key]
        pattern["frequency"] += 1
        pattern["last_access"] = datetime.now()
        pattern["access_times"].append(datetime.now())
        
        # Keep only recent access times (last 1000)
        if len(pattern["access_times"]) > 1000:
            pattern["access_times"] = pattern["access_times"][-1000:]

    def _update_metrics(self, data_type: str, cache_hit: bool, response_time: float):
        """Update cache performance metrics"""
        
        if data_type not in self.metrics:
            self.metrics[data_type] = CacheMetrics(
                cache_type=data_type,
                hit_rate=0.0,
                miss_rate=0.0,
                total_requests=0,
                total_hits=0,
                total_misses=0,
                average_response_time=0.0,
                memory_usage_mb=0.0,
                eviction_count=0,
                invalidation_count=0,
                timestamp=datetime.now()
            )
        
        metrics = self.metrics[data_type]
        metrics.total_requests += 1
        
        if cache_hit:
            metrics.total_hits += 1
        else:
            metrics.total_misses += 1
        
        # Update rates
        metrics.hit_rate = metrics.total_hits / metrics.total_requests
        metrics.miss_rate = metrics.total_misses / metrics.total_requests
        
        # Update average response time (exponential moving average)
        alpha = 0.1
        metrics.average_response_time = (
            alpha * response_time + (1 - alpha) * metrics.average_response_time
        )
        
        metrics.timestamp = datetime.now()

    async def invalidate(
        self,
        pattern: str = None,
        data_type: str = None,
        tags: List[str] = None
    ):
        """Intelligent cache invalidation"""
        
        try:
            if pattern:
                # Pattern-based invalidation
                await self._invalidate_by_pattern(pattern)
            
            if data_type:
                # Data type invalidation
                await self._invalidate_by_data_type(data_type)
            
            if tags:
                # Tag-based invalidation
                await self._invalidate_by_tags(tags)
                
        except Exception as e:
            logger.error(f"Error in cache invalidation: {str(e)}")

    async def _invalidate_by_pattern(self, pattern: str):
        """Invalidate cache entries matching pattern"""
        
        # Memory cache
        keys_to_remove = [key for key in self.local_cache.keys() if pattern in key]
        for key in keys_to_remove:
            del self.local_cache[key]
        
        # Redis cache
        try:
            redis_keys = self.redis_client.keys(f"data:*{pattern}*")
            if redis_keys:
                # Get corresponding meta keys
                meta_keys = [key.replace(b"data:", b"meta:") for key in redis_keys]
                
                # Delete in batch
                all_keys = redis_keys + meta_keys
                self.redis_client.delete(*all_keys)
                
        except Exception as e:
            logger.error(f"Error invalidating Redis pattern: {str(e)}")

    async def _invalidate_by_data_type(self, data_type: str):
        """Invalidate all entries of a specific data type"""
        
        # Memory cache
        keys_to_remove = [
            key for key, entry in self.local_cache.items()
            if data_type in entry.tags
        ]
        for key in keys_to_remove:
            del self.local_cache[key]
        
        # Redis cache - use scan for efficiency
        try:
            cursor = 0
            while True:
                cursor, keys = self.redis_client.scan(cursor, match="meta:*", count=1000)
                
                keys_to_delete = []
                for key in keys:
                    metadata = self.redis_client.hgetall(key)
                    if metadata.get(b'data_type', b'').decode() == data_type:
                        data_key = key.replace(b"meta:", b"data:")
                        keys_to_delete.extend([key, data_key])
                
                if keys_to_delete:
                    self.redis_client.delete(*keys_to_delete)
                
                if cursor == 0:
                    break
                    
        except Exception as e:
            logger.error(f"Error invalidating Redis data type: {str(e)}")

    async def _invalidate_by_tags(self, tags: List[str]):
        """Invalidate cache entries with specific tags"""
        
        for tag in tags:
            await self._invalidate_by_data_type(tag)

    def _metrics_collector(self):
        """Background task to collect and analyze metrics"""
        
        while True:
            try:
                time.sleep(60)  # Collect every minute
                
                # Calculate memory usage
                total_memory_mb = sum(
                    entry.size_bytes for entry in self.local_cache.values()
                ) / (1024 * 1024)
                
                # Update memory usage in metrics
                for metrics in self.metrics.values():
                    metrics.memory_usage_mb = total_memory_mb
                
                # Log metrics
                self._log_metrics()
                
            except Exception as e:
                logger.error(f"Error in metrics collection: {str(e)}")

    def _cache_optimizer(self):
        """Background task to optimize cache configurations"""
        
        while True:
            try:
                time.sleep(300)  # Optimize every 5 minutes
                
                # Analyze access patterns
                self._analyze_access_patterns()
                
                # Optimize configurations
                self._optimize_configurations()
                
            except Exception as e:
                logger.error(f"Error in cache optimization: {str(e)}")

    def _predictive_preloader(self):
        """Background task for predictive cache preloading"""
        
        while True:
            try:
                time.sleep(600)  # Run every 10 minutes
                
                # Predict upcoming data needs
                predictions = self._predict_data_needs()
                
                # Preload predicted data
                for prediction in predictions:
                    await self._preload_data(prediction)
                
            except Exception as e:
                logger.error(f"Error in predictive preloading: {str(e)}")

    def _analyze_access_patterns(self):
        """Analyze access patterns to optimize caching"""
        
        for key, pattern in self.access_patterns.items():
            try:
                access_times = pattern["access_times"]
                if len(access_times) < 10:  # Need sufficient data
                    continue
                
                # Calculate access frequency (accesses per hour)
                time_span = (access_times[-1] - access_times[0]).total_seconds() / 3600
                frequency = len(access_times) / max(time_span, 1)
                
                # Detect peak hours
                hours = [t.hour for t in access_times]
                peak_hours = list(set(hours))  # Simplified peak detection
                
                # Store analysis
                self.access_patterns[key].update({
                    "frequency_per_hour": frequency,
                    "peak_hours": peak_hours,
                    "analysis_timestamp": datetime.now()
                })
                
            except Exception as e:
                logger.error(f"Error analyzing pattern for {key}: {str(e)}")

    def _optimize_configurations(self):
        """Optimize cache configurations based on patterns"""
        
        for data_type, config in self.cache_configs.items():
            try:
                # Find patterns for this data type
                type_patterns = [
                    pattern for pattern in self.access_patterns.values()
                    if pattern.get("data_type") == data_type
                ]
                
                if not type_patterns:
                    continue
                
                # Calculate average frequency
                frequencies = [p.get("frequency_per_hour", 0) for p in type_patterns]
                avg_frequency = sum(frequencies) / len(frequencies)
                
                # Adjust TTL based on frequency
                if avg_frequency > 100:  # Very frequent access
                    config.ttl_seconds = max(5, config.ttl_seconds // 2)
                elif avg_frequency < 1:  # Infrequent access
                    config.ttl_seconds = min(3600, config.ttl_seconds * 2)
                
                # Adjust strategy based on patterns
                if avg_frequency > 50:
                    config.strategy = CacheStrategy.ADAPTIVE
                elif avg_frequency < 5:
                    config.strategy = CacheStrategy.LFU
                
            except Exception as e:
                logger.error(f"Error optimizing config for {data_type}: {str(e)}")

    def _predict_data_needs(self) -> List[str]:
        """Predict upcoming data needs for preloading"""
        
        predictions = []
        
        try:
            current_hour = datetime.now().hour
            
            # Predict based on historical patterns
            for key, pattern in self.access_patterns.items():
                peak_hours = pattern.get("peak_hours", [])
                frequency = pattern.get("frequency_per_hour", 0)
                
                # Predict if current hour is approaching peak
                if any(abs(current_hour - peak) <= 1 for peak in peak_hours):
                    if frequency > 10:  # Only preload frequently accessed data
                        predictions.append(key)
            
            # Predict based on scheduled events (games, etc.)
            # This would integrate with game schedule data
            upcoming_games = self._get_upcoming_games()
            for game in upcoming_games:
                predictions.append(f"game_data:{game['id']}")
                predictions.append(f"betting_odds:{game['id']}")
                
        except Exception as e:
            logger.error(f"Error predicting data needs: {str(e)}")
        
        return predictions[:20]  # Limit preloading

    def _get_upcoming_games(self) -> List[Dict[str, Any]]:
        """Get upcoming games for preloading (mock implementation)"""
        
        # This would integrate with actual game schedule service
        return [
            {"id": "game_123", "start_time": datetime.now() + timedelta(hours=2)},
            {"id": "game_124", "start_time": datetime.now() + timedelta(hours=3)}
        ]

    async def _preload_data(self, cache_key: str):
        """Preload data into cache"""
        
        try:
            # This would integrate with actual data sources
            # For now, just ensure the key exists in cache
            if cache_key not in self.local_cache:
                # Would fetch and cache the data
                logger.info(f"Preloading cache key: {cache_key}")
                
        except Exception as e:
            logger.error(f"Error preloading {cache_key}: {str(e)}")

    def _log_metrics(self):
        """Log cache metrics for monitoring"""
        
        for data_type, metrics in self.metrics.items():
            logger.info(
                f"Cache Metrics [{data_type}]: "
                f"Hit Rate: {metrics.hit_rate:.3f}, "
                f"Avg Response: {metrics.average_response_time:.3f}ms, "
                f"Memory: {metrics.memory_usage_mb:.1f}MB"
            )

    async def get_cache_status(self) -> Dict[str, Any]:
        """Get comprehensive cache status and metrics"""
        
        status = {
            "timestamp": datetime.now().isoformat(),
            "configurations": {},
            "metrics": {},
            "memory_usage": {
                "total_entries": len(self.local_cache),
                "total_size_mb": sum(
                    entry.size_bytes for entry in self.local_cache.values()
                ) / (1024 * 1024)
            },
            "redis_info": {},
            "optimization_recommendations": []
        }
        
        try:
            # Cache configurations
            for data_type, config in self.cache_configs.items():
                status["configurations"][data_type] = {
                    "strategy": config.strategy.value,
                    "freshness_requirement": config.freshness_requirement.value,
                    "ttl_seconds": config.ttl_seconds,
                    "max_size": config.max_size,
                    "preload_enabled": config.preload_enabled
                }
            
            # Performance metrics
            for data_type, metrics in self.metrics.items():
                status["metrics"][data_type] = {
                    "hit_rate": round(metrics.hit_rate, 3),
                    "miss_rate": round(metrics.miss_rate, 3),
                    "total_requests": metrics.total_requests,
                    "average_response_time": round(metrics.average_response_time, 3),
                    "memory_usage_mb": round(metrics.memory_usage_mb, 2)
                }
            
            # Redis information
            try:
                redis_info = self.redis_client.info('memory')
                status["redis_info"] = {
                    "used_memory_mb": redis_info.get('used_memory', 0) / (1024 * 1024),
                    "connected_clients": self.redis_client.info('clients').get('connected_clients', 0)
                }
            except Exception as e:
                logger.error(f"Error getting Redis info: {str(e)}")
            
            # Optimization recommendations
            status["optimization_recommendations"] = self._generate_optimization_recommendations()
            
        except Exception as e:
            logger.error(f"Error generating cache status: {str(e)}")
            status["error"] = str(e)
        
        return status

    def _generate_optimization_recommendations(self) -> List[str]:
        """Generate optimization recommendations based on metrics"""
        
        recommendations = []
        
        try:
            # Analyze hit rates
            low_hit_rate_types = [
                data_type for data_type, metrics in self.metrics.items()
                if metrics.hit_rate < 0.7 and metrics.total_requests > 100
            ]
            
            if low_hit_rate_types:
                recommendations.append(
                    f"Consider increasing TTL or preloading for: {', '.join(low_hit_rate_types)}"
                )
            
            # Analyze response times
            slow_response_types = [
                data_type for data_type, metrics in self.metrics.items()
                if metrics.average_response_time > 100  # > 100ms
            ]
            
            if slow_response_types:
                recommendations.append(
                    f"Consider memory caching for slow responses: {', '.join(slow_response_types)}"
                )
            
            # Memory usage recommendations
            total_memory_mb = sum(
                entry.size_bytes for entry in self.local_cache.values()
            ) / (1024 * 1024)
            
            if total_memory_mb > 500:  # > 500MB
                recommendations.append("Consider implementing more aggressive eviction policies")
            
            # Generic recommendations
            recommendations.extend([
                "Monitor cache hit rates and adjust TTL values accordingly",
                "Implement cache warming for frequently accessed data",
                "Consider distributed caching for high-availability scenarios"
            ])
            
        except Exception as e:
            logger.error(f"Error generating recommendations: {str(e)}")
        
        return recommendations[:5]

# Usage example and testing
async def main():
    """Example usage of the Optimized Intelligent Caching Service"""
    
    cache_service = OptimizedIntelligentCachingService()
    
    # Example fetch function
    async def fetch_betting_odds(game_id: str):
        """Mock function to fetch betting odds"""
        await asyncio.sleep(0.1)  # Simulate API call
        return {
            "game_id": game_id,
            "home_odds": 1.85,
            "away_odds": 2.15,
            "timestamp": datetime.now().isoformat()
        }
    
    # Example 1: Get betting odds with caching
    game_id = "game_123"
    data, cache_hit = await cache_service.get(
        key=f"odds:{game_id}",
        data_type="betting_odds",
        fetch_function=lambda: fetch_betting_odds(game_id)
    )
    
    print(f"Betting odds retrieved - Cache hit: {cache_hit}")
    print(f"Data: {data}")
    
    # Example 2: Get same data again (should be cache hit)
    data2, cache_hit2 = await cache_service.get(
        key=f"odds:{game_id}",
        data_type="betting_odds",
        fetch_function=lambda: fetch_betting_odds(game_id)
    )
    
    print(f"Second request - Cache hit: {cache_hit2}")
    
    # Example 3: Force refresh
    data3, cache_hit3 = await cache_service.get(
        key=f"odds:{game_id}",
        data_type="betting_odds",
        fetch_function=lambda: fetch_betting_odds(game_id),
        force_refresh=True
    )
    
    print(f"Force refresh - Cache hit: {cache_hit3}")
    
    # Example 4: Invalidate cache
    await cache_service.invalidate(pattern=game_id)
    print("Cache invalidated")
    
    # Example 5: Get cache status
    await asyncio.sleep(1)  # Let metrics update
    status = await cache_service.get_cache_status()
    print(f"Cache Status:")
    print(f"- Memory entries: {status['memory_usage']['total_entries']}")
    print(f"- Memory size: {status['memory_usage']['total_size_mb']:.2f} MB")
    print(f"- Recommendations: {status['optimization_recommendations'][:2]}")

if __name__ == "__main__":
    asyncio.run(main())
