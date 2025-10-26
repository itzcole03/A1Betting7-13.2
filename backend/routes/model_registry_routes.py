"""Model registry routes - minimal import-safe stub used during triage.

This file purposely contains a small, dependency-free FastAPI router so
the application can be imported while we iteratively repair the full
implementation. Replace with the real implementation once the repo
is stabilized.
"""

from datetime import datetime
from typing import Any, Dict

from fastapi import APIRouter, Query

router = APIRouter(prefix="/api/models", tags=["Model Registry"])


@router.get("/health")
async def health() -> Dict[str, Any]:
    return {
        "success": True,
        "data": {"status": "healthy"},
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.get("/")
async def list_models(
    page: int = Query(1), page_size: int = Query(20)
) -> Dict[str, Any]:
    return {
        "success": True,
        "data": {"models": [], "total_count": 0, "page": page, "page_size": page_size},
    }


@router.get("/{model_id}")
async def get_model(model_id: str) -> Dict[str, Any]:
    return {"success": True, "data": {"id": model_id, "name": "stub-model"}}


@router.post("/", status_code=201)
async def create_model(payload: Dict[str, Any]) -> Dict[str, Any]:
    new_id = payload.get("id", "new-model")
    return {"success": True, "data": {"id": new_id, "status": "created"}}


__all__ = ["router"]
