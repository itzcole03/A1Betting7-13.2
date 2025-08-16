"""
Unified Cache Service Entry Point

This module provides a single entry point for all caching operations,
consolidating multiple cache services into a unified interface.

Replaces:
- cache_manager.py
- enhanced_caching_service.py
- advanced_caching_system.py

Uses intelligent_cache_service.py as the primary implementation.
"""

import asyncio
import logging
from typing import Any, Dict, List, Optional

# Use the most advanced cache service as the primary implementation
from .intelligent_cache_service import (
    CacheMetrics,
    CachePattern,
    IntelligentCacheService,
)

# Import capability registration - used for conditional capability system integration
try:
    from backend.services.service_capability_matrix import (
        register_service_capability,
        ServiceCategory,
        ServiceStatus,
        DegradedPolicy,
        update_service_status_quick
    )
    CAPABILITY_SYSTEM_AVAILABLE = True
except ImportError:
    CAPABILITY_SYSTEM_AVAILABLE = False

logger = logging.getLogger(__name__)

# Create global instances for backwards compatibility
intelligent_cache_service = IntelligentCacheService()

# Alias for different naming conventions used throughout the codebase
cache_service = intelligent_cache_service
api_cache = intelligent_cache_service
cache_manager = intelligent_cache_service


class UnifiedCacheService:
    """
    Unified cache service providing a consistent interface for all caching operations.
    Delegates to the intelligent cache service for actual implementation.
    """

    def __init__(self):
        self._cache_service = intelligent_cache_service
        
        # Register service capability if available
        asyncio.create_task(self._register_capability())
    
    async def _register_capability(self):
        """Register service capability with the matrix system"""
        if CAPABILITY_SYSTEM_AVAILABLE:
            try:
                # Import locally to avoid type checker issues
                from backend.services.service_capability_matrix import (
                    register_service_capability,
                    ServiceCategory,
                    DegradedPolicy
                )
                
                await register_service_capability(
                    name="unified_cache_service",
                    version="1.0.0", 
                    category=ServiceCategory.UTILITY,
                    description="Unified cache service with intelligent caching and performance optimization",
                    required=False,  # Cache service can degrade gracefully
                    degraded_policy=DegradedPolicy.GRACEFUL,
                    health_check_interval=60,
                    dependencies=None
                )
                logger.info("✅ UnifiedCacheService registered with capability matrix")
            except Exception as e:
                logger.warning(f"⚠️ Failed to register with capability matrix: {e}")

    def _update_service_status(self, operation: str, is_healthy: bool = True):
        """Update service status in the capability matrix"""
        if CAPABILITY_SYSTEM_AVAILABLE:
            try:
                from backend.services.service_capability_matrix import (
                    ServiceStatus,
                    update_service_status_quick
                )
                
                status = ServiceStatus.UP if is_healthy else ServiceStatus.DEGRADED
                asyncio.create_task(update_service_status_quick("unified_cache_service", status))
            except Exception as e:
                # Don't fail the main operation if status update fails
                logger.debug(f"Cache status update failed: {e}")

    async def initialize(self):
        """Initialize the cache service"""
        return await self._cache_service.initialize()

    async def get(self, key: str, default: Any = None) -> Any:
        """
        Get value from cache.
        Uses unified error handler and structured logging.
        Args:
            key (str): Cache key
            default (Any, optional): Default value if key not found
        Returns:
            Any: Cached value or default
        """
        try:
            return await self._cache_service.get(key, default)
        except Exception as e:
            logger.error(f"[CACHE] Error getting key '{key}': {e}")
            # Unified error handler pattern
            if hasattr(self._cache_service, "error_handler"):
                self._cache_service.error_handler.handle_error(
                    e, "cache_get", user_context={"key": key}
                )
            return default

    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """
        Set value in cache.
        Uses unified error handler and structured logging.
        """
        try:
            return await self._cache_service.set(key, value, ttl)
        except Exception as e:
            logger.error(f"[CACHE] Error setting key '{key}': {e}")
            if hasattr(self._cache_service, "error_handler"):
                self._cache_service.error_handler.handle_error(
                    e, "cache_set", user_context={"key": key}
                )
            return False

    async def delete(self, key: str) -> bool:
        """
        Delete key from cache.
        Uses unified error handler and structured logging.
        """
        try:
            return await self._cache_service.delete(key)
        except Exception as e:
            logger.error(f"[CACHE] Error deleting key '{key}': {e}")
            if hasattr(self._cache_service, "error_handler"):
                self._cache_service.error_handler.handle_error(
                    e, "cache_delete", user_context={"key": key}
                )
            return False

    async def exists(self, key: str) -> bool:
        """
        Check if key exists in cache.
        Uses unified error handler and structured logging.
        """
        try:
            return await self._cache_service.exists(key)
        except Exception as e:
            logger.error(f"[CACHE] Error checking existence for key '{key}': {e}")
            if hasattr(self._cache_service, "error_handler"):
                self._cache_service.error_handler.handle_error(
                    e, "cache_exists", user_context={"key": key}
                )
            return False

    async def clear(self, pattern: Optional[str] = None) -> int:
        """
        Clear cache entries matching pattern.
        Uses unified error handler and structured logging.
        """
        try:
            if hasattr(self._cache_service, "clear"):
                return await self._cache_service.clear(pattern)
            return 0
        except Exception as e:
            logger.error(f"[CACHE] Error clearing cache with pattern '{pattern}': {e}")
            if hasattr(self._cache_service, "error_handler"):
                self._cache_service.error_handler.handle_error(
                    e, "cache_clear", user_context={"pattern": pattern}
                )
            return 0

    async def get_metrics(self) -> Dict[str, Any]:
        """
        Get cache performance metrics.
        Uses unified error handler and structured logging.
        """
        try:
            if hasattr(self._cache_service, "get_performance_metrics"):
                return await self._cache_service.get_performance_metrics()
            return {}
        except Exception as e:
            logger.error(f"[CACHE] Error getting cache metrics: {e}")
            if hasattr(self._cache_service, "error_handler"):
                self._cache_service.error_handler.handle_error(e, "cache_metrics")
            return {}

    async def close(self):
        """Close cache connections"""
        if hasattr(self._cache_service, "close"):
            await self._cache_service.close()


# Create global unified cache instance
unified_cache = UnifiedCacheService()

# Backwards compatibility: provide unified_cache_service alias
unified_cache_service = unified_cache


# Backwards compatibility classes and functions
class APICache:
    """Backwards compatibility class for APICache"""

    def __init__(self):
        self._cache = unified_cache

    async def get(self, key: str, default: Any = None) -> Any:
        return await self._cache.get(key, default)

    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        return await self._cache.set(key, value, ttl)

    async def delete(self, key: str) -> bool:
        return await self._cache.delete(key)


class CacheManagerConsolidated:
    """Backwards compatibility class for CacheManagerConsolidated"""

    def __init__(self):
        self._cache = unified_cache

    async def get_cached_data(self, key: str) -> Any:
        return await self._cache.get(key)

    async def cache_data(self, key: str, data: Any, ttl: Optional[int] = None) -> bool:
        return await self._cache.set(key, data, ttl)

    async def invalidate_cache(self, pattern: str) -> int:
        return await self._cache.clear(pattern)


# Export all the interfaces for backwards compatibility
__all__ = [
    "UnifiedCacheService",
    "unified_cache",
    "intelligent_cache_service",
    "cache_service",
    "api_cache",
    "cache_manager",
    "APICache",
    "CacheManagerConsolidated",
    "CacheMetrics",
    "CachePattern",
]
