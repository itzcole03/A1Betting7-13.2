"""Modern ML routes - minimal import-safe stub used during triage."""

from datetime import datetime
from typing import Any, Dict

from fastapi import APIRouter

router = APIRouter(prefix="/api/v2/modern-ml", tags=["Modern ML"])


@router.get("/health")
async def health() -> Dict[str, Any]:
    return {
        "success": True,
        "data": {"status": "healthy"},
        "timestamp": datetime.utcnow().isoformat(),
    }


__all__ = ["router"]
