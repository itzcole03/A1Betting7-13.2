"""
Meta Cache Routes

API endpoints for cache observability and management:
- GET /api/v2/meta/cache-stats - Comprehensive cache statistics
- POST /api/v2/meta/cache-invalidate - Invalidate cache patterns  
- GET /api/v2/meta/cache-health - Cache health check

Provides external visibility into cache performance, hit ratios,
namespace breakdowns, and management capabilities.
"""

import logging
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from ..services.cache_service_ext import cache_service_ext, get_cache_stats
from ..services.cache_keys import get_current_version, CacheTier, CacheEntity

logger = logging.getLogger(__name__)
router = APIRouter()


class CacheStatsResponse(BaseModel):
    """Comprehensive cache statistics response"""
    
    # Basic metrics
    cache_version: str = Field(..., description="Current cache version")
    total_keys: int = Field(..., description="Total number of cached keys")
    hit_count: int = Field(..., description="Total cache hits since startup")
    miss_count: int = Field(..., description="Total cache misses since startup")
    hit_ratio: float = Field(..., description="Hit ratio (hits/total_requests)")
    
    # Performance metrics
    average_get_latency_ms: float = Field(..., description="Average GET operation latency in milliseconds")
    total_operations: int = Field(..., description="Total cache operations performed")
    
    # Advanced metrics
    rebuild_events: int = Field(..., description="Number of cache rebuild events")
    stampede_preventions: int = Field(..., description="Number of stampede preventions")
    
    # Namespace breakdown
    namespaced_counts: Dict[str, int] = Field(..., description="Operation counts by namespace/tier")
    tier_breakdown: Dict[str, Dict[str, int]] = Field(..., description="Detailed tier statistics")
    
    # Performance details
    latency_percentiles: Dict[str, float] = Field(..., description="Latency percentiles (p50, p90, p95, p99)")
    
    # System info
    uptime_seconds: float = Field(..., description="Cache service uptime in seconds")
    active_locks: int = Field(..., description="Number of active stampede protection locks")
    timestamp: str = Field(..., description="Response timestamp (ISO 8601)")


class NamespaceStatsResponse(BaseModel):
    """Per-namespace cache statistics"""
    
    namespace: str = Field(..., description="Namespace name")
    hits: int = Field(..., description="Cache hits in this namespace")
    misses: int = Field(..., description="Cache misses in this namespace") 
    sets: int = Field(..., description="Cache sets in this namespace")
    deletes: int = Field(..., description="Cache deletes in this namespace")
    hit_ratio: float = Field(..., description="Hit ratio for this namespace")
    avg_latency_ms: float = Field(..., description="Average latency for this namespace")


class CacheHealthResponse(BaseModel):
    """Cache service health check response"""
    
    healthy: bool = Field(..., description="Overall health status")
    operations: Dict[str, bool] = Field(..., description="Individual operation health checks")
    stats_snapshot: Dict[str, Any] = Field(..., description="Current stats snapshot")
    error: Optional[str] = Field(None, description="Error message if unhealthy")


class InvalidateRequest(BaseModel):
    """Cache invalidation request"""
    
    pattern: Optional[str] = Field(None, description="Pattern to invalidate (supports wildcards)")
    namespace: Optional[str] = Field(None, description="Namespace to invalidate")
    version: Optional[str] = Field(None, description="Version to invalidate")


class InvalidateResponse(BaseModel):
    """Cache invalidation response"""
    
    success: bool = Field(..., description="Whether invalidation succeeded")
    keys_invalidated: int = Field(..., description="Number of keys invalidated")
    pattern_used: str = Field(..., description="Pattern that was used for invalidation")
    message: str = Field(..., description="Human-readable result message")


@router.get("/cache-stats", response_model=CacheStatsResponse)
async def get_cache_stats_endpoint():
    """
    Get comprehensive cache statistics
    
    Returns detailed cache performance metrics including:
    - Hit/miss ratios and counts
    - Latency measurements and percentiles
    - Namespace and tier breakdowns
    - Stampede protection statistics
    - System uptime and health indicators
    """
    try:
        logger.debug("📊 Fetching comprehensive cache statistics")
        
        # Get stats from extended cache service
        stats = get_cache_stats()
        
        # Extract basic stats
        basic_stats = stats["basic_stats"]
        
        # Get latency percentiles
        latency_percentiles = stats.get("latency_percentiles", {
            "p50": 0.0, "p90": 0.0, "p95": 0.0, "p99": 0.0
        })
        
        # Build response
        response = CacheStatsResponse(
            cache_version=basic_stats["cache_version"],
            total_keys=basic_stats["total_keys"],
            hit_count=basic_stats["hit_count"],
            miss_count=basic_stats["miss_count"],
            hit_ratio=basic_stats["hit_ratio"],
            average_get_latency_ms=basic_stats["average_get_latency_ms"],
            total_operations=basic_stats["total_operations"],
            rebuild_events=basic_stats["rebuild_events"],
            stampede_preventions=basic_stats["stampede_preventions"],
            namespaced_counts=basic_stats["namespaced_counts"],
            tier_breakdown=basic_stats["tier_breakdown"],
            latency_percentiles=latency_percentiles,
            uptime_seconds=basic_stats["uptime_seconds"],
            active_locks=stats.get("active_locks", 0),
            timestamp=basic_stats["timestamp"]
        )
        
        logger.debug(f"📊 Cache stats: {response.hit_count} hits, {response.miss_count} misses, {response.hit_ratio:.3f} ratio")
        
        return response
        
    except Exception as e:
        logger.error(f"❌ Failed to get cache statistics: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve cache statistics: {str(e)}"
        )


@router.get("/cache-stats/namespace/{namespace}", response_model=NamespaceStatsResponse)
async def get_namespace_stats(namespace: str):
    """
    Get statistics for a specific namespace
    
    Args:
        namespace: Namespace (tier) to get statistics for
        
    Returns:
        Detailed statistics for the specified namespace
    """
    try:
        logger.debug(f"📊 Fetching stats for namespace: {namespace}")
        
        # Get namespace stats from instrumentation
        namespace_stats = cache_service_ext._instrumentation.get_namespace_stats(namespace)
        
        if namespace_stats is None:
            logger.warning(f"⚠️ No stats found for namespace: {namespace}")
            # Return empty stats using actual NamespaceStats class
            from ..services.cache_instrumentation import NamespaceStats
            namespace_stats = NamespaceStats()
        
        response = NamespaceStatsResponse(
            namespace=namespace,
            hits=namespace_stats.hits,
            misses=namespace_stats.misses,
            sets=namespace_stats.sets,
            deletes=namespace_stats.deletes,
            hit_ratio=namespace_stats.hit_ratio,
            avg_latency_ms=namespace_stats.avg_latency_ms
        )
        
        logger.debug(f"📊 Namespace {namespace}: {namespace_stats.hits} hits, {namespace_stats.hit_ratio:.3f} ratio")
        
        return response
        
    except Exception as e:
        logger.error(f"❌ Failed to get namespace stats for {namespace}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve namespace statistics: {str(e)}"
        )


@router.get("/cache-health", response_model=CacheHealthResponse)
async def get_cache_health():
    """
    Get cache service health status
    
    Performs basic cache operations (get/set/delete) to verify
    that the cache service is functioning properly.
    
    Returns:
        Health check results with operation status
    """
    try:
        logger.debug("🏥 Performing cache health check")
        
        # Perform health check
        health_result = await cache_service_ext.health_check()
        
        response = CacheHealthResponse(
            healthy=health_result["healthy"],
            operations=health_result.get("operations", {}),
            stats_snapshot=health_result.get("stats_snapshot", {}),
            error=health_result.get("error")
        )
        
        if response.healthy:
            logger.debug("✅ Cache health check passed")
        else:
            logger.warning(f"⚠️ Cache health check failed: {response.error}")
        
        return response
        
    except Exception as e:
        logger.error(f"❌ Cache health check error: {e}")
        return CacheHealthResponse(
            healthy=False,
            operations={},
            stats_snapshot={},
            error=str(e)
        )


@router.post("/cache-invalidate", response_model=InvalidateResponse)
async def invalidate_cache(request: InvalidateRequest):
    """
    Invalidate cache entries based on pattern, namespace, or version
    
    Args:
        request: Invalidation request specifying what to invalidate
        
    Returns:
        Results of the invalidation operation
    """
    try:
        logger.info(f"🗑️ Cache invalidation request: {request}")
        
        keys_invalidated = 0
        pattern_used = ""
        
        if request.namespace:
            # Invalidate entire namespace
            keys_invalidated = await cache_service_ext.invalidate_namespace(request.namespace)
            pattern_used = f"namespace:{request.namespace}"
            
        elif request.pattern:
            # Invalidate by pattern
            keys_invalidated = await cache_service_ext.invalidate_pattern(request.pattern)
            pattern_used = request.pattern
            
        elif request.version:
            # Invalidate by version
            keys_invalidated = await cache_service_ext.invalidate_version(request.version)
            pattern_used = f"version:{request.version}"
            
        else:
            raise HTTPException(
                status_code=400,
                detail="Must specify either pattern, namespace, or version for invalidation"
            )
        
        success = keys_invalidated >= 0  # Non-negative result indicates success
        
        message = f"Successfully invalidated {keys_invalidated} keys"
        if keys_invalidated == 0:
            message = "No keys found matching invalidation criteria"
        
        logger.info(f"🗑️ Invalidation completed: {keys_invalidated} keys removed")
        
        return InvalidateResponse(
            success=success,
            keys_invalidated=keys_invalidated,
            pattern_used=pattern_used,
            message=message
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Cache invalidation failed: {e}")
        return InvalidateResponse(
            success=False,
            keys_invalidated=0,
            pattern_used=request.pattern or request.namespace or request.version or "",
            message=f"Invalidation failed: {str(e)}"
        )


@router.get("/cache-info")
async def get_cache_info():
    """
    Get general cache service information
    
    Returns:
        Basic information about cache configuration and capabilities
    """
    try:
        return {
            "cache_version": get_current_version(),
            "available_tiers": [tier.value for tier in CacheTier],
            "available_entities": [entity.value for entity in CacheEntity],
            "features": {
                "versioned_keys": True,
                "stampede_protection": True,
                "namespace_invalidation": True,
                "pattern_invalidation": True,
                "instrumentation": True,
                "health_checks": True
            },
            "endpoints": {
                "stats": "/api/v2/meta/cache-stats",
                "namespace_stats": "/api/v2/meta/cache-stats/namespace/{namespace}",
                "health": "/api/v2/meta/cache-health",
                "invalidate": "/api/v2/meta/cache-invalidate",
                "info": "/api/v2/meta/cache-info"
            },
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to get cache info: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve cache information: {str(e)}"
        )