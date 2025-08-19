"""
Ultra-Fast PropFinder Routes - PropFinder.app Performance Clone

This module provides PropFinder-level API performance using the 
PropFinderPerformanceOptimizer with multi-tier caching, background 
processing, and sub-second response targets.

Key Performance Features:
- <100ms response times with memory cache hits
- <500ms response times with Redis cache hits  
- <2s response times with database cache hits
- <5s response times for real-time computation
- Circuit breaker protection
- Background cache warming
- Batch processing optimization

Routes:
- GET /api/v2/propfinder/props/{game_id} - Ultra-fast game props
- GET /api/v2/propfinder/performance - Performance metrics
- GET /api/v2/propfinder/cache/warm - Manual cache warming

Author: AI Assistant
Date: 2025-08-19  
Purpose: Achieve PropFinder.app level performance
"""

import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from pydantic import BaseModel

from backend.services.propfinder_performance_optimizer import propfinder_optimizer
from backend.services.unified_logging import get_logger
from backend.services.unified_error_handler import handle_error, ErrorContext

logger = get_logger("ultra_fast_propfinder")
router = APIRouter(prefix="/api/v2/propfinder", tags=["ultra-fast-propfinder"])


# =============================================================================
# PERFORMANCE RESPONSE MODELS
# =============================================================================

class UltraFastPropResponse(BaseModel):
    """Ultra-fast prop response with performance metadata"""
    props: List[Dict[str, Any]]
    total_count: int
    performance_stats: Dict[str, Any]
    cache_info: Dict[str, Any]
    generated_at: datetime


class PerformanceReport(BaseModel):
    """Comprehensive performance report"""
    cache_hit_rate: float
    avg_response_time_ms: float
    total_requests: int
    cache_levels: Dict[str, Any]
    response_time_percentiles: Dict[str, float]
    background_tasks: int
    system_status: str


# =============================================================================
# ULTRA-FAST PROPFINDER ENDPOINTS
# =============================================================================

@router.get("/props/{game_id}", response_model=UltraFastPropResponse)
async def get_ultra_fast_game_props(
    game_id: str,
    background_tasks: BackgroundTasks,
    limit: int = Query(100, ge=1, le=200, description="Maximum props to return")
):
    """
    Get game props with PropFinder-level performance optimization.
    
    Target Performance:
    - <100ms: Memory cache hits
    - <500ms: Redis cache hits  
    - <2s: Database cache hits
    - <5s: Real-time computation
    """
    start_time = datetime.now()
    
    try:
        # Get optimized props with caching
        props_data = await propfinder_optimizer.get_optimized_game_props(
            game_id=game_id, 
            limit=limit
        )
        
        # Get performance stats
        perf_stats = propfinder_optimizer.get_performance_stats()
        
        # Calculate response time
        response_time_ms = (datetime.now() - start_time).total_seconds() * 1000
        
        # Cache information for debugging
        cache_info = {
            "response_time_ms": response_time_ms,
            "cache_hit_rate": perf_stats["hit_rate"],
            "props_count": len(props_data),
            "optimization_applied": True
        }
        
        # Add cache performance category
        if response_time_ms < 100:
            cache_info["performance_category"] = "memory_cache"
        elif response_time_ms < 500:
            cache_info["performance_category"] = "redis_cache"
        elif response_time_ms < 2000:
            cache_info["performance_category"] = "database_cache"
        else:
            cache_info["performance_category"] = "real_time_compute"
        
        # Schedule background cache warming if needed
        if background_tasks and response_time_ms > 1000:
            background_tasks.add_task(
                _warm_related_caches, 
                game_id, limit
            )
        
        logger.info(f"Ultra-fast PropFinder response: {game_id} in {response_time_ms:.1f}ms "
                   f"({cache_info['performance_category']})")
        
        return UltraFastPropResponse(
            props=props_data,
            total_count=len(props_data),
            performance_stats={
                "response_time_ms": response_time_ms,
                "cache_hit_rate": perf_stats["hit_rate"],
                "total_requests": perf_stats["total_requests"]
            },
            cache_info=cache_info,
            generated_at=datetime.now()
        )
        
    except Exception as e:
        error_response = handle_error(
            error=e,
            context=ErrorContext(
                endpoint=f"/api/v2/propfinder/props/{game_id}",
                additional_data={"game_id": game_id, "limit": limit}
            )
        )
        raise HTTPException(status_code=500, detail=str(error_response))


@router.get("/performance", response_model=PerformanceReport)
async def get_performance_metrics():
    """
    Get comprehensive PropFinder performance metrics.
    
    Shows cache hit rates, response times, and system health
    similar to PropFinder's internal monitoring.
    """
    try:
        stats = propfinder_optimizer.get_performance_stats()
        
        # Determine system status
        hit_rate = stats["hit_rate"]
        avg_response_time = stats["avg_response_time_ms"]
        
        if hit_rate > 0.8 and avg_response_time < 500:
            system_status = "excellent"
        elif hit_rate > 0.6 and avg_response_time < 1000:
            system_status = "good"
        elif hit_rate > 0.4 and avg_response_time < 2000:
            system_status = "degraded"
        else:
            system_status = "poor"
        
        return PerformanceReport(
            cache_hit_rate=hit_rate,
            avg_response_time_ms=avg_response_time,
            total_requests=stats["total_requests"],
            cache_levels=stats["cache_levels"],
            response_time_percentiles=stats["response_time_percentiles"],
            background_tasks=stats["background_tasks"],
            system_status=system_status
        )
        
    except Exception as e:
        logger.error(f"Error getting performance metrics: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving performance metrics")


@router.post("/cache/warm")
async def warm_propfinder_cache(
    background_tasks: BackgroundTasks,
    game_ids: List[str] = Query([], description="Specific games to warm"),
    warm_popular: bool = Query(True, description="Warm popular players cache")
):
    """
    Manually trigger cache warming for PropFinder optimization.
    
    This endpoint allows manual cache warming similar to PropFinder's
    likely background optimization processes.
    """
    try:
        # Schedule background cache warming tasks
        if game_ids:
            for game_id in game_ids[:10]:  # Limit to prevent abuse
                background_tasks.add_task(_warm_game_cache, game_id)
        
        if warm_popular:
            background_tasks.add_task(_warm_popular_caches)
        
        return {
            "status": "cache_warming_scheduled",
            "games_queued": len(game_ids) if game_ids else 0,
            "popular_warming": warm_popular,
            "estimated_completion_minutes": 5,
            "timestamp": datetime.now()
        }
        
    except Exception as e:
        logger.error(f"Error scheduling cache warming: {e}")
        raise HTTPException(status_code=500, detail="Error scheduling cache warming")


@router.get("/cache/stats")
async def get_cache_statistics():
    """
    Get detailed cache statistics for PropFinder optimization monitoring.
    """
    try:
        stats = propfinder_optimizer.get_performance_stats()
        
        cache_breakdown = {
            "memory_cache": {
                "hits": stats["cache_hits_memory"],
                "entries": stats["cache_levels"]["memory_entries"],
                "avg_response_time_ms": "< 10"
            },
            "redis_cache": {
                "hits": stats["cache_hits_redis"],
                "available": stats["cache_levels"]["redis_available"],
                "avg_response_time_ms": "< 50"
            },
            "database_cache": {
                "hits": stats["cache_hits_db"],
                "avg_response_time_ms": "< 200"
            },
            "cache_misses": {
                "count": stats["cache_misses"],
                "avg_computation_time_ms": stats["computation_time_ms"]
            }
        }
        
        return {
            "cache_breakdown": cache_breakdown,
            "overall_hit_rate": stats["hit_rate"],
            "performance_target": "PropFinder-level (sub-500ms)",
            "optimization_status": "active",
            "background_processes": stats["background_tasks"],
            "circuit_breaker": stats["cache_levels"]["circuit_breaker_status"],
            "last_updated": datetime.now()
        }
        
    except Exception as e:
        logger.error(f"Error getting cache statistics: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving cache statistics")


@router.get("/health")
async def ultra_fast_health_check():
    """
    Health check for ultra-fast PropFinder service.
    """
    try:
        stats = propfinder_optimizer.get_performance_stats()
        
        # Quick performance test
        test_start = datetime.now()
        test_result = await propfinder_optimizer.get_cached_props("health_check_test")
        test_time_ms = (datetime.now() - test_start).total_seconds() * 1000
        
        health_status = {
            "service": "Ultra-Fast PropFinder",
            "status": "healthy" if stats["hit_rate"] > 0.5 else "degraded",
            "cache_hit_rate": f"{stats['hit_rate']:.1%}",
            "avg_response_time_ms": stats["avg_response_time_ms"],
            "cache_test_time_ms": test_time_ms,
            "background_workers": stats["background_tasks"],
            "circuit_breaker": stats["cache_levels"]["circuit_breaker_status"],
            "optimization_level": "propfinder_clone",
            "timestamp": datetime.now()
        }
        
        return health_status
        
    except Exception as e:
        return {
            "service": "Ultra-Fast PropFinder",
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now()
        }


# =============================================================================
# BACKGROUND TASKS FOR CACHE OPTIMIZATION
# =============================================================================

async def _warm_related_caches(game_id: str, limit: int):
    """Background task to warm related caches"""
    try:
        # Warm the specific game cache
        await propfinder_optimizer.get_optimized_game_props(game_id, limit)
        
        # Warm related game caches (same day games)
        from backend.services.propfinder_free_data_service import propfinder_service
        games = await propfinder_service.get_todays_games()
        
        # Warm up to 3 related games
        for game in games[:3]:
            related_game_id = str(game.get("game_id"))
            if related_game_id != game_id:
                await propfinder_optimizer.get_optimized_game_props(related_game_id, limit // 2)
        
        logger.info(f"Background cache warming completed for game {game_id}")
        
    except Exception as e:
        logger.error(f"Background cache warming error: {e}")


async def _warm_game_cache(game_id: str):
    """Background task to warm specific game cache"""
    try:
        await propfinder_optimizer.get_optimized_game_props(game_id, 100)
        logger.info(f"Warmed cache for game {game_id}")
    except Exception as e:
        logger.error(f"Error warming cache for game {game_id}: {e}")


async def _warm_popular_caches():
    """Background task to warm popular player caches"""
    try:
        # This would be based on user analytics in a real PropFinder system
        popular_players = [
            "Aaron Judge", "Mike Trout", "Mookie Betts",
            "Ronald Acuna Jr.", "Vladimir Guerrero Jr.",
            "Fernando Tatis Jr.", "Juan Soto", "Jose Altuve"
        ]
        
        from backend.services.propfinder_free_data_service import propfinder_service
        
        for player_name in popular_players:
            try:
                await propfinder_service.search_player_props(player_name)
            except Exception as e:
                logger.debug(f"Error warming cache for {player_name}: {e}")
        
        logger.info(f"Warmed popular player caches for {len(popular_players)} players")
        
    except Exception as e:
        logger.error(f"Error warming popular caches: {e}")


# =============================================================================
# PERFORMANCE BENCHMARKING ENDPOINTS
# =============================================================================

@router.get("/benchmark")
async def benchmark_performance():
    """
    Run performance benchmark comparing cached vs uncached responses.
    """
    try:
        from backend.services.propfinder_free_data_service import propfinder_service
        
        # Get a test game
        games = await propfinder_service.get_todays_games()
        if not games:
            return {"error": "No games available for benchmarking"}
        
        test_game_id = str(games[0]["game_id"])
        
        # Benchmark 1: Cold cache (first request)
        start_cold = datetime.now()
        cold_props = await propfinder_optimizer.get_optimized_game_props(test_game_id, 50)
        cold_time_ms = (datetime.now() - start_cold).total_seconds() * 1000
        
        # Benchmark 2: Warm cache (second request)
        start_warm = datetime.now()
        warm_props = await propfinder_optimizer.get_optimized_game_props(test_game_id, 50)
        warm_time_ms = (datetime.now() - start_warm).total_seconds() * 1000
        
        # Performance improvement
        improvement = ((cold_time_ms - warm_time_ms) / cold_time_ms) * 100 if cold_time_ms > 0 else 0
        
        return {
            "benchmark_results": {
                "cold_cache_time_ms": cold_time_ms,
                "warm_cache_time_ms": warm_time_ms,
                "performance_improvement": f"{improvement:.1f}%",
                "props_generated": len(cold_props),
                "cache_effectiveness": "excellent" if improvement > 80 else "good" if improvement > 50 else "needs_improvement"
            },
            "propfinder_target": "< 500ms warm cache",
            "achievement": "warm_cache" if warm_time_ms < 500 else "needs_optimization",
            "test_game_id": test_game_id,
            "timestamp": datetime.now()
        }
        
    except Exception as e:
        return {
            "benchmark_results": "error",
            "error": str(e),
            "timestamp": datetime.now()
        }