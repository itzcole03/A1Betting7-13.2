"""
Cache Metrics Hook - Integration for tracking cache operations in metrics collector
Provides monkey-patching and wrapper utilities for automatic cache metrics collection.
"""

import functools
from typing import Any, Callable, Dict, Optional

try:
    from backend.services.unified_logging import get_logger
    logger = get_logger("cache_metrics_hook")
except ImportError:
    import logging
    logger = logging.getLogger(__name__)

from backend.services.metrics.unified_metrics_collector import get_metrics_collector


class CacheMetricsHook:
    """
    Hook for instrumenting cache operations with metrics collection.
    
    Provides wrapper functions and monkey-patching utilities to automatically
    record cache hits, misses, and evictions in the unified metrics collector.
    """
    
    def __init__(self):
        self.metrics_collector = get_metrics_collector()
        self._hooked_methods = []  # Track what we've hooked for cleanup
        
    def wrap_cache_get(self, original_get: Callable) -> Callable:
        """
        Wrap a cache get method to record hits/misses.
        
        Args:
            original_get: The original cache get method
            
        Returns:
            Wrapped method that records metrics
        """
        @functools.wraps(original_get)
        async def async_wrapper(*args, **kwargs):
            try:
                result = await original_get(*args, **kwargs)
                
                # Record hit if result found, miss if None/empty
                if result is not None:
                    self.metrics_collector.record_cache_hit()
                else:
                    self.metrics_collector.record_cache_miss()
                
                return result
            except Exception as e:
                # Record as miss on exception
                self.metrics_collector.record_cache_miss()
                raise
        
        @functools.wraps(original_get)
        def sync_wrapper(*args, **kwargs):
            try:
                result = original_get(*args, **kwargs)
                
                # Record hit if result found, miss if None/empty
                if result is not None:
                    self.metrics_collector.record_cache_hit()
                else:
                    self.metrics_collector.record_cache_miss()
                
                return result
            except Exception as e:
                # Record as miss on exception
                self.metrics_collector.record_cache_miss()
                raise
        
        # Return appropriate wrapper based on function type
        import asyncio
        if asyncio.iscoroutinefunction(original_get):
            return async_wrapper
        else:
            return sync_wrapper
    
    def wrap_cache_set(self, original_set: Callable) -> Callable:
        """
        Wrap a cache set method to record operations.
        
        Args:
            original_set: The original cache set method
            
        Returns:
            Wrapped method (no specific metrics recorded for sets currently)
        """
        # For now, just pass through - could add set operation metrics later
        return original_set
    
    def wrap_cache_delete(self, original_delete: Callable) -> Callable:
        """
        Wrap a cache delete method to record evictions.
        
        Args:
            original_delete: The original cache delete method
            
        Returns:
            Wrapped method that records evictions
        """
        @functools.wraps(original_delete)
        async def async_wrapper(*args, **kwargs):
            result = await original_delete(*args, **kwargs)
            # Record eviction if delete was successful
            if result:
                self.metrics_collector.record_cache_eviction()
            return result
        
        @functools.wraps(original_delete)
        def sync_wrapper(*args, **kwargs):
            result = original_delete(*args, **kwargs)
            # Record eviction if delete was successful
            if result:
                self.metrics_collector.record_cache_eviction()
            return result
        
        # Return appropriate wrapper based on function type
        import asyncio
        if asyncio.iscoroutinefunction(original_delete):
            return async_wrapper
        else:
            return sync_wrapper
    
    def hook_cache_service(self, cache_service: Any) -> bool:
        """
        Hook a cache service instance to record metrics.
        
        Args:
            cache_service: Cache service instance to hook
            
        Returns:
            True if hooking was successful, False otherwise
        """
        try:
            hooked_any = False
            
            # Hook common cache method names
            for method_name in ['get', 'get_cached', 'retrieve']:
                if hasattr(cache_service, method_name):
                    original_method = getattr(cache_service, method_name)
                    wrapped_method = self.wrap_cache_get(original_method)
                    setattr(cache_service, method_name, wrapped_method)
                    self._hooked_methods.append((cache_service, method_name, original_method))
                    hooked_any = True
                    logger.debug(f"Hooked cache method: {method_name}")
            
            # Hook set methods
            for method_name in ['set', 'put', 'store']:
                if hasattr(cache_service, method_name):
                    original_method = getattr(cache_service, method_name)
                    wrapped_method = self.wrap_cache_set(original_method)
                    setattr(cache_service, method_name, wrapped_method)
                    self._hooked_methods.append((cache_service, method_name, original_method))
                    logger.debug(f"Hooked cache method: {method_name}")
            
            # Hook delete methods
            for method_name in ['delete', 'remove', 'evict']:
                if hasattr(cache_service, method_name):
                    original_method = getattr(cache_service, method_name)
                    wrapped_method = self.wrap_cache_delete(original_method)
                    setattr(cache_service, method_name, wrapped_method)
                    self._hooked_methods.append((cache_service, method_name, original_method))
                    hooked_any = True
                    logger.debug(f"Hooked cache method: {method_name}")
            
            if hooked_any:
                logger.info("Successfully hooked cache service for metrics collection")
            else:
                logger.warning("No hookable cache methods found")
            
            return hooked_any
            
        except Exception as e:
            logger.error(f"Failed to hook cache service: {e}")
            return False
    
    def unhook_all(self) -> None:
        """Remove all hooks and restore original methods."""
        for cache_service, method_name, original_method in self._hooked_methods:
            try:
                setattr(cache_service, method_name, original_method)
            except Exception as e:
                logger.warning(f"Failed to unhook {method_name}: {e}")
        
        self._hooked_methods.clear()
        logger.info("Unhooked all cache service methods")


# Global hook instance
_cache_hook = None


def get_cache_hook() -> CacheMetricsHook:
    """Get the global cache metrics hook instance."""
    global _cache_hook
    if _cache_hook is None:
        _cache_hook = CacheMetricsHook()
    return _cache_hook


def auto_hook_unified_cache_service() -> bool:
    """
    Automatically hook the unified cache service if available.
    
    Returns:
        True if hooking was successful, False otherwise
    """
    try:
        from backend.services.unified_cache_service import unified_cache_service
        
        cache_hook = get_cache_hook()
        success = cache_hook.hook_cache_service(unified_cache_service)
        
        if success:
            logger.info("Auto-hooked unified cache service for metrics collection")
        else:
            logger.warning("Auto-hook of unified cache service failed or found no methods")
        
        return success
        
    except ImportError:
        logger.debug("Unified cache service not available for auto-hooking")
        return False
    except Exception as e:
        logger.error(f"Failed to auto-hook unified cache service: {e}")
        return False


def auto_hook_intelligent_cache_service() -> bool:
    """
    Automatically hook the intelligent cache service if available.
    
    Returns:
        True if hooking was successful, False otherwise
    """
    try:
        from backend.services.intelligent_cache_service import intelligent_cache_service
        
        cache_hook = get_cache_hook()
        success = cache_hook.hook_cache_service(intelligent_cache_service)
        
        if success:
            logger.info("Auto-hooked intelligent cache service for metrics collection")
        else:
            logger.warning("Auto-hook of intelligent cache service failed or found no methods")
        
        return success
        
    except ImportError:
        logger.debug("Intelligent cache service not available for auto-hooking")
        return False
    except Exception as e:
        logger.error(f"Failed to auto-hook intelligent cache service: {e}")
        return False


def initialize_cache_metrics_hooks() -> Dict[str, bool]:
    """
    Initialize cache metrics hooks for all available cache services.
    
    Returns:
        Dictionary with hook results for each service
    """
    results = {
        "unified_cache_service": auto_hook_unified_cache_service(),
        "intelligent_cache_service": auto_hook_intelligent_cache_service()
    }
    
    success_count = sum(results.values())
    logger.info(f"Cache metrics hooks initialized: {success_count}/{len(results)} services hooked")
    
    return results


# TODO: Add support for Redis cache eviction events if exposed by the cache service
# TODO: Add hook for cache size monitoring if available
# TODO: Consider adding cache operation latency tracking