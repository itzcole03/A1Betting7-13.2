"""Diagnostics endpoints for system health and circuit breaker status."""

from typing import Dict, Any
from fastapi import APIRouter

# Contract compliance imports
from ..core.response_models import ResponseBuilder, StandardAPIResponse
from ..core.exceptions import BusinessLogicException, AuthenticationException

from backend.utils.llm_engine import llm_engine
from backend.services.health_service import health_service, HealthStatusResponse

router = APIRouter()


@router.get("/circuit-breaker/ollama", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_ollama_circuit_breaker_status():
    """Get the status of the Ollama circuit breaker."""
    if hasattr(llm_engine.client, "circuit_breaker"):
        return ResponseBuilder.success(llm_engine.client.circuit_breaker.status())
    return ResponseBuilder.success({"error": "No circuit breaker found on LLM client."})


@router.get("/system", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_system_diagnostics():
    """Get overall system diagnostics."""
    return ResponseBuilder.success({
        "llm_initialized": getattr(llm_engine, "is_initialized", False),
        "llm_client_type": (
            type(llm_engine.client).__name__ if llm_engine.client else None
        ),
        "circuit_breaker": (
            llm_engine.client.circuit_breaker.status()
            if hasattr(llm_engine.client, "circuit_breaker")
            else None
        ),
        "model_health": getattr(llm_engine.client, "model_health", None),
    })


@router.get("/health", response_model=HealthStatusResponse)
async def get_structured_health():
    """
    Get structured system health status with component monitoring.
    
    Returns detailed health information including:
    - Overall system status (ok/degraded/unhealthy)  
    - Uptime in seconds
    - Individual component health (websocket, cache, model_inference)
    - Build information and timestamps
    """
    return await health_service.compute_health()
