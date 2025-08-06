"""
Lazy Sport API Routes for A1Betting Backend

Provides endpoints for managing sport-specific services and models on demand.
"""

import logging
from typing import Any, Dict, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.services.lazy_sport_manager import lazy_sport_manager
from backend.utils.enhanced_logging import get_logger

logger = get_logger("lazy_sport_api")

router = APIRouter(prefix="/api/sports", tags=["sports"])


class SportActivationRequest(BaseModel):
    """Request model for sport activation"""

    sport: str
    preload_models: bool = True


class SportActivationResponse(BaseModel):
    """Response model for sport activation"""

    status: str
    sport: str
    load_time: float
    cached: bool = False
    newly_loaded: bool = False
    error: Optional[str] = None


@router.post("/activate/{sport}", response_model=SportActivationResponse)
async def activate_sport(sport: str):
    """
    Activate a sport service with lazy loading.

    This endpoint is called when a user switches to a specific sport tab.
    It will load the necessary models and services for that sport only.

    Args:
        sport: Sport name (MLB, NBA, NFL, NHL)

    Returns:
        SportActivationResponse with status and timing information
    """
    try:
        logger.info(f"🎯 Sport activation requested: {sport}")

        result = await lazy_sport_manager.activate_sport(sport)

        return SportActivationResponse(
            status=result["status"],
            sport=result["sport"],
            load_time=result.get("load_time", 0),
            cached=result.get("cached", False),
            newly_loaded=result.get("newly_loaded", False),
            error=result.get("error"),
        )

    except Exception as e:
        logger.error(f"❌ Error activating sport {sport}: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to activate {sport}: {str(e)}"
        )


@router.post("/deactivate/{sport}")
async def deactivate_sport(sport: str):
    """
    Deactivate a sport service to free resources.

    Args:
        sport: Sport name to deactivate

    Returns:
        Dict with deactivation status
    """
    try:
        logger.info(f"🛑 Sport deactivation requested: {sport}")

        result = await lazy_sport_manager.deactivate_sport(sport)
        return result

    except Exception as e:
        logger.error(f"❌ Error deactivating sport {sport}: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to deactivate {sport}: {str(e)}"
        )


@router.get("/status/{sport}")
async def get_sport_status(sport: str):
    """
    Get the current status of a sport service.

    Args:
        sport: Sport name to check

    Returns:
        Dict with sport service status information
    """
    try:
        return lazy_sport_manager.get_sport_status(sport)
    except Exception as e:
        logger.error(f"❌ Error getting sport status for {sport}: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to get status for {sport}: {str(e)}"
        )


@router.get("/status")
async def get_all_sports_status():
    """
    Get the status of all sport services.

    Returns:
        Dict with all sport services status information
    """
    try:
        return lazy_sport_manager.get_all_statuses()
    except Exception as e:
        logger.error(f"❌ Error getting all sports status: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to get sports status: {str(e)}"
        )


@router.post("/optimize")
async def optimize_resources():
    """
    Manually trigger resource optimization.

    This will clean up unused sport services to free memory.

    Returns:
        Dict with optimization results
    """
    try:
        logger.info("🧹 Manual resource optimization requested")

        # Get status before cleanup
        before_status = lazy_sport_manager.get_all_statuses()

        # Force cleanup of inactive services
        await lazy_sport_manager._cleanup_inactive_services()

        # Get status after cleanup
        after_status = lazy_sport_manager.get_all_statuses()

        return {
            "status": "optimized",
            "before": before_status,
            "after": after_status,
            "freed_services": before_status["total_loaded"]
            - after_status["total_loaded"],
        }

    except Exception as e:
        logger.error(f"❌ Error optimizing resources: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to optimize resources: {str(e)}"
        )


@router.get("/health")
async def sports_health_check():
    """
    Health check for the lazy sport management system.

    Returns:
        Dict with health status and performance metrics
    """
    try:
        all_status = lazy_sport_manager.get_all_statuses()

        # Calculate health metrics
        total_services = all_status["total_supported"]
        loaded_services = all_status["total_loaded"]
        error_services = len(
            [s for s in all_status["services"].values() if s["status"] == "error"]
        )

        health_score = max(0, 100 - (error_services * 25))  # Deduct 25 points per error

        return {
            "status": (
                "healthy"
                if health_score >= 75
                else "degraded" if health_score >= 50 else "unhealthy"
            ),
            "health_score": health_score,
            "active_sport": all_status["active_sport"],
            "services_loaded": f"{loaded_services}/{total_services}",
            "error_count": error_services,
            "performance": {
                "lazy_loading": "enabled",
                "memory_optimization": "active",
                "cleanup_service": (
                    "running" if lazy_sport_manager.cleanup_task else "stopped"
                ),
            },
        }

    except Exception as e:
        logger.error(f"❌ Error in sports health check: {e}")
        return {"status": "unhealthy", "error": str(e), "health_score": 0}
