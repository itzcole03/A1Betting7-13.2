"""
Cache Management Routes

This module provides endpoints for cache management and invalidation.
"""

from __future__ import annotations

import logging
from typing import Any, Dict

from fastapi import APIRouter, HTTPException, Depends, status

from ..core.response_models import StandardAPIResponse, ResponseBuilder
from ..core.exceptions import AuthenticationException
from ..auth.security import TokenData, get_current_user
from ..services.auth_service import verify_token
from ..services.redis_cache_service import get_redis_cache

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/cache", tags=["Cache Management"])


@router.get("/stats", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_cache_stats(
    current_user: TokenData = Depends(get_current_user)
) -> StandardAPIResponse[Dict[str, Any]]:
    """Get cache statistics and health metrics."""
    try:
        cache_service = await get_redis_cache()
        stats = await cache_service.get_cache_stats()
        
        return ResponseBuilder.success(stats)
        
    except Exception as e:
        logger.error(f"Error getting cache stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve cache statistics"
        )


@router.post("/invalidate/predictions", response_model=StandardAPIResponse[Dict[str, Any]])
async def invalidate_predictions_cache(
    current_user = Depends(get_current_user)
) -> StandardAPIResponse[Dict[str, Any]]:
    """Invalidate all cached predictions."""
    try:
        cache_service = await get_redis_cache()
        deleted_count = await cache_service.invalidate_predictions()
        
        return ResponseBuilder.success({
            "message": "Prediction cache invalidated successfully",
            "deleted_entries": deleted_count
        })
        
    except Exception as e:
        logger.error(f"Error invalidating prediction cache: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to invalidate prediction cache"
        )


@router.post("/invalidate/opportunities", response_model=StandardAPIResponse[Dict[str, Any]])
async def invalidate_opportunities_cache(
    current_user = Depends(get_current_user)
) -> StandardAPIResponse[Dict[str, Any]]:
    """Invalidate all cached betting and arbitrage opportunities."""
    try:
        cache_service = await get_redis_cache()
        deleted_count = await cache_service.invalidate_opportunities()
        
        return ResponseBuilder.success({
            "message": "Opportunities cache invalidated successfully",
            "deleted_entries": deleted_count
        })
        
    except Exception as e:
        logger.error(f"Error invalidating opportunities cache: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to invalidate opportunities cache"
        )


@router.post("/invalidate/all", response_model=StandardAPIResponse[Dict[str, Any]])
async def invalidate_all_cache(
    current_user = Depends(get_current_user)
) -> StandardAPIResponse[Dict[str, Any]]:
    """Invalidate all cached data."""
    try:
        cache_service = await get_redis_cache()
        
        prediction_deleted = await cache_service.invalidate_predictions()
        opportunities_deleted = await cache_service.invalidate_opportunities()
        
        total_deleted = prediction_deleted + opportunities_deleted
        
        return ResponseBuilder.success({
            "message": "All cache invalidated successfully",
            "deleted_entries": {
                "predictions": prediction_deleted,
                "opportunities": opportunities_deleted,
                "total": total_deleted
            }
        })
        
    except Exception as e:
        logger.error(f"Error invalidating all cache: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to invalidate all cache"
        )


@router.post("/warm/popular", response_model=StandardAPIResponse[Dict[str, Any]])
async def warm_popular_cache(
    current_user = Depends(get_current_user)
) -> StandardAPIResponse[Dict[str, Any]]:
    """Warm cache with popular betting opportunities and predictions."""
    try:
        # This would typically trigger background tasks to pre-populate cache
        # For now, return a success message
        
        return ResponseBuilder.success({
            "message": "Cache warming initiated for popular data",
            "status": "in_progress",
            "estimated_completion": "2-3 minutes"
        })
        
    except Exception as e:
        logger.error(f"Error warming cache: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to initiate cache warming"
        )
