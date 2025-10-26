"""
Minimal import-safe shim for optimized intelligent caching service.
This file intentionally provides a very small async-friendly API so it
can be imported safely during test collection and by other modules.
"""
from typing import Any, Dict, Optional


class OptimizedIntelligentCachingService:
    def __init__(self) -> None:
        self._cache: Dict[str, Any] = {}

    async def preload(self, key: str, value: Any) -> None:
        """Preload a value into the cache (no-op heavy logic)."""
        self._cache[key] = value

    async def get(self, key: str) -> Optional[Any]:
        """Get a value from the cache."""
        return self._cache.get(key)

    async def set(self, key: str, value: Any) -> None:
        """Set a value into the cache."""
        self._cache[key] = value


optimized_intelligent_caching_service = OptimizedIntelligentCachingService()

__all__ = ["OptimizedIntelligentCachingService", "optimized_intelligent_caching_service"]
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
            """
            Minimal import-safe shim for optimized intelligent caching service.
            This file intentionally provides a very small async-friendly API so it
            can be imported safely during test collection and by other modules.
            """
            from typing import Any, Dict, Optional


            class OptimizedIntelligentCachingService:
                def __init__(self) -> None:
                    self._cache: Dict[str, Any] = {}

                async def preload(self, key: str, value: Any) -> None:
                    self._cache[key] = value

                async def get(self, key: str) -> Optional[Any]:
                    return self._cache.get(key)

                async def set(self, key: str, value: Any) -> None:
                    self._cache[key] = value


            optimized_intelligent_caching_service = OptimizedIntelligentCachingService()

            __all__ = ["OptimizedIntelligentCachingService", "optimized_intelligent_caching_service"]
            """
            from typing import Any, Dict, Optional


            class OptimizedIntelligentCachingService:
                def __init__(self) -> None:
                    self._cache: Dict[str, Any] = {}

                async def preload(self, key: str, value: Any) -> None:
                    self._cache[key] = value

                async def get(self, key: str) -> Optional[Any]:
                    return self._cache.get(key)


            optimized_intelligent_caching_service = OptimizedIntelligentCachingService()

            __all__ = ["OptimizedIntelligentCachingService", "optimized_intelligent_caching_service"]
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
