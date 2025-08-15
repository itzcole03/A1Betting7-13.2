"""
Cache Service Extension

Provides instrumented cache operations with:
- Stampede protection using async locks
- Automatic hit/miss tracking and latency measurement  
- Versioned key management and namespace organization
- Invalidation helpers for patterns and namespaces
- Integration with existing unified cache service

Wraps the existing cache services with observability and protection mechanisms.
"""

import asyncio
import logging
import time
from typing import Any, Callable, Awaitable, Optional, List, Dict, Union
from dataclasses import asdict

from .cache_instrumentation import (
    cache_instrumentation,
    instrument_get_hit,
    instrument_get_miss,
    instrument_set,
    instrument_delete
)
from .cache_keys import (
    cache_key_builder,
    CacheTier,
    CacheEntity,
    build_key,
    build_pattern,
    parse_key,
    get_current_version
)
from .unified_cache_service import unified_cache

logger = logging.getLogger(__name__)


class CacheServiceExt:
    """
    Extended cache service with instrumentation and advanced features
    
    Provides stampede protection, versioned keys, and comprehensive
    observability while maintaining compatibility with existing cache service.
    """
    
    def __init__(self):
        self._base_cache = unified_cache
        self._instrumentation = cache_instrumentation
        self._key_builder = cache_key_builder
        
        # Stampede protection tracking
        self._active_builders: Dict[str, asyncio.Task] = {}
        self._builder_results: Dict[str, Any] = {}
        self._cleanup_lock = asyncio.Lock()
    
    async def get_or_build(
        self,
        key: str,
        builder_fn: Callable[[], Awaitable[Any]],
        ttl_seconds: int = 3600,
        tier: Union[CacheTier, str] = CacheTier.NORMALIZED_PROPS,
        entity: Union[CacheEntity, str] = CacheEntity.CONFIG,
        use_versioned_key: bool = True,
        namespace: Optional[str] = None
    ) -> Any:
        """
        Get value from cache or build it with stampede protection
        
        Args:
            key: Cache key (will be versioned if use_versioned_key=True)
            builder_fn: Async function to build value if not in cache
            ttl_seconds: Time to live for cached value
            tier: Cache tier for organization
            entity: Entity type for key building
            use_versioned_key: Whether to use versioned key format
            namespace: Namespace for metrics (defaults to tier)
            
        Returns:
            Cached or newly built value
        """
        # Build versioned key if requested
        if use_versioned_key and not key.startswith(get_current_version()):
            cache_key = self._key_builder.build_key(tier, entity, key)
        else:
            cache_key = key
        
        # Determine namespace for instrumentation
        parsed_key = parse_key(cache_key)
        metrics_namespace = namespace or (parsed_key.tier if parsed_key else "default")
        tier_str = tier.value if isinstance(tier, CacheTier) else str(tier)
        
        # Try to get from cache first
        with instrument_get_hit(cache_key, metrics_namespace, tier_str) as hit_ctx:
            cached_value = await self._base_cache.get(cache_key)
            
            if cached_value is not None:
                logger.debug(f"✅ Cache hit for key: {cache_key}")
                return cached_value
        
        # Cache miss - need to build value with stampede protection
        with instrument_get_miss(cache_key, metrics_namespace, tier_str):
            logger.debug(f"🔍 Cache miss for key: {cache_key}")
        
        # Use stampede protection
        lock = self._instrumentation.get_or_create_lock(cache_key)
        
        async with lock:
            # Check cache again in case another coroutine built it while we waited
            cached_value = await self._base_cache.get(cache_key)
            if cached_value is not None:
                self._instrumentation.record_stampede_prevention(cache_key)
                logger.debug(f"🛡️ Stampede prevented for key: {cache_key}")
                return cached_value
            
            # Build the value
            try:
                logger.debug(f"🔨 Building value for key: {cache_key}")
                start_time = time.time()
                
                built_value = await builder_fn()
                
                build_time_ms = (time.time() - start_time) * 1000
                logger.debug(f"🔨 Built value in {build_time_ms:.2f}ms for key: {cache_key}")
                
                # Cache the built value
                if built_value is not None:
                    with instrument_set(cache_key, metrics_namespace, tier_str):
                        await self._base_cache.set(cache_key, built_value, ttl_seconds)
                        self._instrumentation.record_rebuild_event(cache_key, metrics_namespace)
                
                return built_value
                
            except Exception as e:
                logger.error(f"❌ Failed to build value for key {cache_key}: {e}")
                raise
    
    async def get(
        self,
        key: str,
        default: Any = None,
        tier: Union[CacheTier, str] = CacheTier.NORMALIZED_PROPS,
        entity: Union[CacheEntity, str] = CacheEntity.CONFIG,
        use_versioned_key: bool = True,
        namespace: Optional[str] = None
    ) -> Any:
        """
        Get value from cache with instrumentation
        
        Args:
            key: Cache key
            default: Default value if not found
            tier: Cache tier for versioned keys
            entity: Entity type for versioned keys
            use_versioned_key: Whether to use versioned key format
            namespace: Namespace for metrics
            
        Returns:
            Cached value or default
        """
        # Build versioned key if requested
        if use_versioned_key and not key.startswith(get_current_version()):
            cache_key = self._key_builder.build_key(tier, entity, key)
        else:
            cache_key = key
        
        # Determine namespace for instrumentation
        parsed_key = parse_key(cache_key)
        metrics_namespace = namespace or (parsed_key.tier if parsed_key else "default")
        tier_str = tier.value if isinstance(tier, CacheTier) else str(tier)
        
        # Get with instrumentation
        try:
            with instrument_get_hit(cache_key, metrics_namespace, tier_str) as hit_ctx:
                value = await self._base_cache.get(cache_key, default)
                
                if value != default:
                    logger.debug(f"✅ Cache hit for key: {cache_key}")
                    return value
            
            # Record miss if we got default value
            with instrument_get_miss(cache_key, metrics_namespace, tier_str):
                logger.debug(f"🔍 Cache miss for key: {cache_key}")
                return default
                
        except Exception as e:
            logger.error(f"❌ Cache get error for key {cache_key}: {e}")
            with instrument_get_miss(cache_key, metrics_namespace, tier_str):
                pass
            return default
    
    async def set(
        self,
        key: str,
        value: Any,
        ttl_seconds: int = 3600,
        tier: Union[CacheTier, str] = CacheTier.NORMALIZED_PROPS,
        entity: Union[CacheEntity, str] = CacheEntity.CONFIG,
        use_versioned_key: bool = True,
        namespace: Optional[str] = None
    ) -> bool:
        """
        Set value in cache with instrumentation
        
        Args:
            key: Cache key
            value: Value to cache
            ttl_seconds: Time to live in seconds
            tier: Cache tier for versioned keys
            entity: Entity type for versioned keys
            use_versioned_key: Whether to use versioned key format
            namespace: Namespace for metrics
            
        Returns:
            True if successful, False otherwise
        """
        # Build versioned key if requested
        if use_versioned_key and not key.startswith(get_current_version()):
            cache_key = self._key_builder.build_key(tier, entity, key)
        else:
            cache_key = key
        
        # Determine namespace for instrumentation
        parsed_key = parse_key(cache_key)
        metrics_namespace = namespace or (parsed_key.tier if parsed_key else "default")
        tier_str = tier.value if isinstance(tier, CacheTier) else str(tier)
        
        # Set with instrumentation
        try:
            with instrument_set(cache_key, metrics_namespace, tier_str):
                result = await self._base_cache.set(cache_key, value, ttl_seconds)
                
                if result:
                    logger.debug(f"💾 Cache set successful for key: {cache_key}")
                else:
                    logger.warning(f"⚠️ Cache set failed for key: {cache_key}")
                
                return result
                
        except Exception as e:
            logger.error(f"❌ Cache set error for key {cache_key}: {e}")
            return False
    
    async def delete(
        self,
        key: str,
        tier: Union[CacheTier, str] = CacheTier.NORMALIZED_PROPS,
        entity: Union[CacheEntity, str] = CacheEntity.CONFIG,
        use_versioned_key: bool = True,
        namespace: Optional[str] = None
    ) -> bool:
        """
        Delete value from cache with instrumentation
        
        Args:
            key: Cache key
            tier: Cache tier for versioned keys
            entity: Entity type for versioned keys
            use_versioned_key: Whether to use versioned key format
            namespace: Namespace for metrics
            
        Returns:
            True if successful, False otherwise
        """
        # Build versioned key if requested
        if use_versioned_key and not key.startswith(get_current_version()):
            cache_key = self._key_builder.build_key(tier, entity, key)
        else:
            cache_key = key
        
        # Determine namespace for instrumentation
        parsed_key = parse_key(cache_key)
        metrics_namespace = namespace or (parsed_key.tier if parsed_key else "default")
        tier_str = tier.value if isinstance(tier, CacheTier) else str(tier)
        
        # Delete with instrumentation
        try:
            with instrument_delete(cache_key, metrics_namespace, tier_str):
                result = await self._base_cache.delete(cache_key)
                
                if result:
                    logger.debug(f"🗑️ Cache delete successful for key: {cache_key}")
                else:
                    logger.debug(f"🔍 Cache key not found for delete: {cache_key}")
                
                return result
                
        except Exception as e:
            logger.error(f"❌ Cache delete error for key {cache_key}: {e}")
            return False
    
    async def invalidate_namespace(self, namespace: str) -> int:
        """
        Invalidate all keys in a namespace (tier)
        
        Args:
            namespace: Namespace to invalidate
            
        Returns:
            Number of keys invalidated
        """
        try:
            # Build pattern for namespace
            pattern = build_pattern(tier=namespace)
            
            # Use base cache invalidation
            if hasattr(self._base_cache, 'clear'):
                count = await self._base_cache.clear(pattern)
            else:
                # Fallback: manual deletion (not as efficient)
                count = await self._manual_pattern_delete(pattern)
            
            logger.info(f"🗑️ Invalidated {count} keys in namespace: {namespace}")
            
            # Record in instrumentation
            self._instrumentation.record_delete("namespace_invalidation", namespace, "namespace")
            
            return count
            
        except Exception as e:
            logger.error(f"❌ Namespace invalidation error for {namespace}: {e}")
            return 0
    
    async def invalidate_pattern(self, pattern: str) -> int:
        """
        Invalidate all keys matching a pattern
        
        Args:
            pattern: Pattern to match (supports wildcards)
            
        Returns:
            Number of keys invalidated
        """
        try:
            # Use base cache invalidation
            if hasattr(self._base_cache, 'clear'):
                count = await self._base_cache.clear(pattern)
            else:
                # Fallback: manual deletion
                count = await self._manual_pattern_delete(pattern)
            
            logger.info(f"🗑️ Invalidated {count} keys matching pattern: {pattern}")
            
            return count
            
        except Exception as e:
            logger.error(f"❌ Pattern invalidation error for {pattern}: {e}")
            return 0
    
    async def invalidate_version(self, version: Optional[str] = None) -> int:
        """
        Invalidate all keys from a specific version
        
        Args:
            version: Version to invalidate (defaults to all non-current)
            
        Returns:
            Number of keys invalidated
        """
        try:
            if version:
                pattern = f"{version}:*"
            else:
                # Invalidate all versions except current
                current_version = get_current_version()
                # This is complex to implement efficiently, so we'll focus on specific version
                logger.warning("Mass version invalidation not implemented - specify version")
                return 0
            
            count = await self.invalidate_pattern(pattern)
            logger.info(f"🗑️ Invalidated {count} keys from version: {version}")
            
            return count
            
        except Exception as e:
            logger.error(f"❌ Version invalidation error for {version}: {e}")
            return 0
    
    async def _manual_pattern_delete(self, pattern: str) -> int:
        """
        Manual pattern deletion fallback (less efficient)
        
        This is a fallback when the underlying cache doesn't support pattern deletion.
        In practice, most cache implementations should support this natively.
        """
        logger.warning(f"Using manual pattern deletion for: {pattern}")
        # This would require listing all keys and filtering, which is inefficient
        # For now, return 0 to indicate no deletions
        return 0
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Get comprehensive cache statistics
        
        Returns:
            Dictionary containing all cache metrics and stats
        """
        snapshot = self._instrumentation.get_snapshot()
        
        return {
            "basic_stats": asdict(snapshot),
            "namespace_stats": {
                namespace: asdict(stats) 
                for namespace, stats in self._instrumentation.get_all_namespace_stats().items()
            },
            "tier_stats": dict(self._instrumentation._tier_stats),
            "latency_percentiles": self._instrumentation.get_recent_latency_percentiles(),
            "active_locks": len(self._instrumentation._build_locks),
            "version_info": {
                "current_version": get_current_version(),
                "cache_version": self._key_builder.cache_version
            }
        }
    
    async def warm_cache(
        self,
        patterns: List[str],
        builder_fn: Callable[[str], Awaitable[Any]],
        ttl_seconds: int = 3600,
        tier: Union[CacheTier, str] = CacheTier.NORMALIZED_PROPS
    ) -> int:
        """
        Warm cache with multiple patterns
        
        Args:
            patterns: List of key patterns to warm
            builder_fn: Function to build values for each pattern
            ttl_seconds: TTL for warmed values
            tier: Cache tier for metrics
            
        Returns:
            Number of keys warmed successfully
        """
        warmed_count = 0
        tier_str = tier.value if isinstance(tier, CacheTier) else str(tier)
        
        for pattern in patterns:
            try:
                # Check if already cached
                existing_value = await self.get(pattern, use_versioned_key=False)
                if existing_value is not None:
                    logger.debug(f"🔥 Cache already warm for pattern: {pattern}")
                    continue
                
                # Build and cache value
                value = await builder_fn(pattern)
                if value is not None:
                    await self.set(
                        pattern, 
                        value, 
                        ttl_seconds, 
                        tier=tier,
                        use_versioned_key=False
                    )
                    warmed_count += 1
                    logger.debug(f"🔥 Warmed cache for pattern: {pattern}")
                
            except Exception as e:
                logger.error(f"❌ Failed to warm cache for pattern {pattern}: {e}")
        
        logger.info(f"🔥 Cache warming completed: {warmed_count}/{len(patterns)} successful")
        return warmed_count
    
    async def health_check(self) -> Dict[str, Any]:
        """
        Check cache service health
        
        Returns:
            Health check results
        """
        try:
            # Test basic cache operations
            test_key = "health_check_test"
            test_value = f"test_{int(time.time())}"
            
            # Test set
            set_success = await self.set(test_key, test_value, ttl_seconds=60, use_versioned_key=False)
            
            # Test get
            retrieved_value = await self.get(test_key, use_versioned_key=False)
            
            # Test delete
            delete_success = await self.delete(test_key, use_versioned_key=False)
            
            # Get current stats
            stats = self.get_stats()
            
            is_healthy = (
                set_success and 
                retrieved_value == test_value and 
                delete_success
            )
            
            return {
                "healthy": is_healthy,
                "operations": {
                    "set": set_success,
                    "get": retrieved_value == test_value,
                    "delete": delete_success
                },
                "stats_snapshot": {
                    "total_operations": stats["basic_stats"]["total_operations"],
                    "hit_ratio": stats["basic_stats"]["hit_ratio"],
                    "active_locks": stats["active_locks"]
                }
            }
            
        except Exception as e:
            logger.error(f"❌ Cache health check failed: {e}")
            return {
                "healthy": False,
                "error": str(e)
            }
    
    async def close(self):
        """Cleanup resources"""
        await self._instrumentation.close()
        if hasattr(self._base_cache, 'close'):
            await self._base_cache.close()


# Global extended cache service instance
cache_service_ext = CacheServiceExt()


# Convenience functions
async def get_or_build(key: str, builder_fn: Callable[[], Awaitable[Any]], **kwargs) -> Any:
    """Global function for get_or_build operations"""
    return await cache_service_ext.get_or_build(key, builder_fn, **kwargs)

async def invalidate_namespace(namespace: str) -> int:
    """Global function for namespace invalidation"""
    return await cache_service_ext.invalidate_namespace(namespace)

async def invalidate_pattern(pattern: str) -> int:
    """Global function for pattern invalidation"""
    return await cache_service_ext.invalidate_pattern(pattern)

def get_cache_stats() -> Dict[str, Any]:
    """Global function to get cache statistics"""
    return cache_service_ext.get_stats()