"""Lazy Sport API Routes for A1Betting Backend.

Provides endpoints for managing sport-specific services and models on demand.
This module is defensive: manager methods may be sync or async, so we use
an await helper to support both.
"""
from typing import Any, Dict, Optional

from fastapi import APIRouter, HTTPException

from ..core.response_models import ResponseBuilder, StandardAPIResponse
from ..core.exceptions import BusinessLogicException
from backend.services.lazy_sport_manager import lazy_sport_manager
from backend.utils.enhanced_logging import get_logger

logger = get_logger("lazy_sport_api")

router = APIRouter(prefix="/api/sports", tags=["sports"])


async def _maybe_await(value: Any) -> Any:
    if hasattr(value, "__await__"):
        return await value
    return value


@router.post("/activate/{sport}")
async def activate_sport(sport: str):
    try:
        logger.info("Sport activation requested: %s", sport)
        result = await _maybe_await(lazy_sport_manager.activate_sport(sport))

        # Ensure a simple dict is returned to the client
        return ResponseBuilder.success({
            "status": result.get("status", "ok"),
            "sport": result.get("sport", sport),
            "load_time": result.get("load_time", 0),
            "cached": result.get("cached", False),
            "newly_loaded": result.get("newly_loaded", False),
            "error": result.get("error"),
        })
    except Exception as e:
        logger.exception("Error activating sport %s: %s", sport, e)
        raise BusinessLogicException(f"Failed to activate {sport}: {e}")


@router.post("/deactivate/{sport}")
async def deactivate_sport(sport: str):
    try:
        logger.info("Sport deactivation requested: %s", sport)
        result = await _maybe_await(lazy_sport_manager.deactivate_sport(sport))
        return ResponseBuilder.success(result)
    except Exception as e:
        logger.exception("Error deactivating sport %s: %s", sport, e)
        raise BusinessLogicException(f"Failed to deactivate {sport}: {e}")


@router.get("/status/{sport}")
async def get_sport_status(sport: str):
    try:
        status = await _maybe_await(lazy_sport_manager.get_sport_status(sport))
        return ResponseBuilder.success(status)
    except Exception as e:
        logger.exception("Error getting sport status for %s: %s", sport, e)
        raise BusinessLogicException(f"Failed to get status for {sport}: {e}")


@router.get("/status")
async def get_all_sports_status():
    try:
        statuses = await _maybe_await(lazy_sport_manager.get_all_statuses())
        return ResponseBuilder.success(statuses)
    except Exception as e:
        logger.exception("Error getting all sports status: %s", e)
        raise BusinessLogicException(f"Failed to get sports status: {e}")


@router.post("/optimize")
async def optimize_resources():
    try:
        logger.info("Manual resource optimization requested")
        before = await _maybe_await(lazy_sport_manager.get_all_statuses())
        await _maybe_await(lazy_sport_manager._cleanup_inactive_services())
        after = await _maybe_await(lazy_sport_manager.get_all_statuses())
        freed = before.get("total_loaded", 0) - after.get("total_loaded", 0)
        return ResponseBuilder.success({"status": "optimized", "before": before, "after": after, "freed_services": freed})
    except Exception as e:
        logger.exception("Error optimizing resources: %s", e)
        raise BusinessLogicException(f"Failed to optimize resources: {e}")


@router.get("/health")
async def sports_health_check():
    try:
        all_status = await _maybe_await(lazy_sport_manager.get_all_statuses())
        total_supported = all_status.get("total_supported", 0)
        total_loaded = all_status.get("total_loaded", 0)
        error_services = len([s for s in all_status.get("services", {}).values() if s.get("status") == "error"]) if all_status.get("services") else 0
        health_score = max(0, 100 - (error_services * 25))

        status_text = "healthy" if health_score >= 75 else "degraded" if health_score >= 50 else "unhealthy"

        return ResponseBuilder.success({
            "status": status_text,
            "health_score": health_score,
            "active_sport": all_status.get("active_sport"),
            "services_loaded": f"{total_loaded}/{total_supported}",
            "error_count": error_services,
            "performance": {
                "lazy_loading": "enabled",
                "memory_optimization": "active",
                "cleanup_service": "running" if getattr(lazy_sport_manager, "cleanup_task", None) else "stopped",
            },
        })
    except Exception as e:
        logger.exception("Error in sports health check: %s", e)
        return ResponseBuilder.success({"status": "unhealthy", "error": str(e), "health_score": 0})
