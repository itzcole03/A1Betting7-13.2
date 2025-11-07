"""Models inference routes - concise import-safe stub for tests."""

from datetime import datetime, timezone
from typing import Any, Dict

from fastapi import APIRouter

router = APIRouter(prefix="/api/inference", tags=["Models Inference"])


@router.get("/health")
async def health() -> Dict[str, Any]:
    return {
        "success": True,
        "data": {"status": "healthy"},
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.post("/predict")
async def predict(payload: Dict[str, Any]) -> Dict[str, Any]:
    # lightweight echo stub used during tests
    return {
        "success": True,
        "data": {"prediction": None, "input": payload},
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


__all__ = ["router"]
