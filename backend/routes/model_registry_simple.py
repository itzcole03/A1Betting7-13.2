"""Model registry (simple) import-safe stub for tests."""

from datetime import datetime, timezone
from typing import Any, Dict, List

from fastapi import APIRouter

router = APIRouter(prefix="/api/models/simple", tags=["Model Registry Simple"])


@router.get("/health")
async def health() -> Dict[str, Any]:
    return {
        "success": True,
        "data": {"status": "healthy"},
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


"""Model registry (simple) import-safe stub for tests."""

from datetime import datetime
from typing import Any, Dict

from fastapi import APIRouter

router = APIRouter(prefix="/api/models/simple", tags=["Model Registry Simple"])


@router.get("/health")
async def health() -> Dict[str, Any]:
    return {
        "success": True,
        "data": {"status": "healthy"},
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/")
async def list_models() -> Dict[str, Any]:
    return {
        "success": True,
        "data": {"models": []},
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/{model_id}")
async def get_model(model_id: str) -> Dict[str, Any]:
    return {
        "success": True,
        "data": {"model_id": model_id, "status": "not_found"},
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


__all__ = ["router"]
