import logging
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from backend.auth.security import get_current_admin_user
from backend.services.comprehensive_prizepicks_service import (
    comprehensive_prizepicks_service,
)  # Import scraper service
from backend.utils.llm_engine import MODEL_STATE, llm_engine

logger = logging.getLogger(__name__)
router = APIRouter()


# Simple version endpoint for frontend health/version checks
@router.get("/version")
async def version():
    return {"version": "1.0.0", "status": "ok"}


"""Health check endpoints for service monitoring."""


class HealthResponse(BaseModel):
    """Health check response model"""

    status: str
    initialized: bool
    models_loaded: bool
    ready_for_requests: bool
    request_queue_size: int
    model_health: Dict[str, Dict[str, Any]]
    metrics: Dict[str, int]
    prizepicks_scraper_health: Dict[str, Any]  # Add scraper health to response model


@router.get("/status", response_model=HealthResponse)
async def health_check(
    current_user: Any = Depends(get_current_admin_user),
) -> Dict[str, Any]:
    """Get service health status"""
    try:
        # Check if llm_engine is initialized and has models
        models_ready = False
        if llm_engine:
            # Try to ensure initialization
            try:
                initialized = await llm_engine.ensure_initialized()
                models_ready = initialized and bool(getattr(llm_engine, "models", []))
            except Exception as init_error:
                logger.warning(f"LLM initialization check failed: {init_error}")
                models_ready = False

        # Update MODEL_STATE based on actual status
        MODEL_STATE["ready_for_requests"] = models_ready
        MODEL_STATE["models_loaded"] = models_ready

        # Get PrizePicks scraper health
        scraper_health_data = comprehensive_prizepicks_service.get_scraper_health()

        return {
            "status": (
                "healthy"
                if models_ready and scraper_health_data.get("is_healthy")
                else "initializing"
            ),  # Overall status considers scraper
            "initialized": MODEL_STATE["initialized"],
            "models_loaded": models_ready,
            "ready_for_requests": models_ready,
            "request_queue_size": MODEL_STATE["request_queue_size"],
            "model_health": MODEL_STATE["model_health"],
            "metrics": {
                "request_count": MODEL_STATE["request_count"],
                "successful_requests": MODEL_STATE["successful_requests"],
                "propollama_requests": MODEL_STATE["propollama_requests"],
                "propollama_successes": MODEL_STATE["propollama_successes"],
            },
            "prizepicks_scraper_health": scraper_health_data,  # Include scraper health data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")


@router.get("/model/{model_name}/health")
async def model_health_check(
    model_name: str, current_user: Any = Depends(get_current_admin_user)
) -> Dict[str, Any]:
    """Get health status for a specific model"""
    try:
        if not llm_engine:
            raise HTTPException(status_code=503, detail="LLM engine not initialized")

        # Check if model is in available models
        models = getattr(llm_engine, "models", [])
        status = "ready" if model_name in models else "unknown"

        return {
            "name": model_name,
            "status": status,
            "response_time": 0.0,
            "error_count": 0,
            "success_count": 0,
            "last_error": None,
            "last_check": None,
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Model health check failed: {str(e)}"
        )


@router.get("/queue/status")
async def queue_status(
    current_user: Any = Depends(get_current_admin_user),
) -> Dict[str, Any]:
    """Get request queue status"""
    return {
        "size": MODEL_STATE["request_queue_size"],
        "max_size": 100,  # MAX_QUEUE_SIZE constant
        "processing": False,  # Default value
        "ready_for_requests": MODEL_STATE["ready_for_requests"],
    }
