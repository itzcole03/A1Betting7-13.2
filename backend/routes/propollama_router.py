"""Import-safe PropOllama router (minimal stub).

This file provides a small, dependency-free APIRouter used during test
collection to avoid import-time side-effects. It intentionally avoids
heavy imports and complex logic. Replace with the full implementation
when the codebase is stable.
"""

from fastapi import APIRouter

# Keep routes small and import-safe. Other modules only import `router`.
router = APIRouter(prefix="/api/propollama", tags=["PropOllama"])


@router.get("/ping")
async def ping():
    return {"status": "ok", "service": "propollama_router_stub"}


@router.get("/health")
async def health():
    return {"status": "healthy"}


@router.get("/status")
async def status():
    # Minimal info for tests that probe capabilities
    return {
        "status": "operational",
        "model_version": "stub",
        "features": ["prop_analysis", "strategy_advice"],
    }


@router.post("/chat")
async def chat(payload: dict):
    # Return a simple echo-style response to remain import-safe.
    msg = payload.get("message") if isinstance(payload, dict) else None
    return {"content": f"Echo: {msg}", "confidence": 50, "suggestions": []}
