"""Diagnostics endpoints for system health and circuit breaker status."""

from fastapi import APIRouter

from backend.utils.llm_engine import llm_engine

router = APIRouter()


@router.get("/circuit-breaker/ollama")
async def get_ollama_circuit_breaker_status():
    """Get the status of the Ollama circuit breaker."""
    if hasattr(llm_engine.client, "circuit_breaker"):
        return llm_engine.client.circuit_breaker.status()
    return {"error": "No circuit breaker found on LLM client."}


@router.get("/system")
async def get_system_diagnostics():
    """Get overall system diagnostics."""
    return {
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
    }
