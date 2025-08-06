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

import logging
from typing import Any, Dict, List, Optional

# Use the most advanced cache service as the primary implementation
from .intelligent_cache_service import (
    CacheMetrics,
    CachePattern,
    IntelligentCacheService,
)

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

    async def initialize(self):
        """Initialize the cache service"""
        return await self._cache_service.initialize()

    async def get(self, key: str, default: Any = None) -> Any:
        """Get value from cache"""
        return await self._cache_service.get(key, default)

    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Set value in cache"""
        return await self._cache_service.set(key, value, ttl)

    async def delete(self, key: str) -> bool:
        """Delete key from cache"""
        return await self._cache_service.delete(key)

    async def exists(self, key: str) -> bool:
        """Check if key exists in cache"""
        return await self._cache_service.exists(key)

    async def clear(self, pattern: Optional[str] = None) -> int:
        """Clear cache entries matching pattern"""
        if hasattr(self._cache_service, "clear"):
            return await self._cache_service.clear(pattern)
        return 0

    async def get_metrics(self) -> Dict[str, Any]:
        """Get cache performance metrics"""
        if hasattr(self._cache_service, "get_performance_metrics"):
            return await self._cache_service.get_performance_metrics()
        return {}

    async def close(self):
        """Close cache connections"""
        if hasattr(self._cache_service, "close"):
            await self._cache_service.close()


# Create global unified cache instance
unified_cache = UnifiedCacheService()


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
