"""
Minimal import-safe shim for data validation routes.

This module provides small, well-formed endpoints used during triage
so pytest can collect. Full implementation will be restored later.
"""

from datetime import datetime
from typing import Any, Dict

from fastapi import APIRouter

try:
    from backend.core.response_models import ResponseBuilder
except Exception:

    class ResponseBuilder:
        @staticmethod
        def success(data=None):
            return {"success": True, "data": data, "error": None}


router = APIRouter(prefix="/api/validation", tags=["data-validation"])


@router.get("/health")
async def validation_health() -> Dict[str, Any]:
    return ResponseBuilder.success(
        {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}
    )


@router.get("/metrics")
async def get_validation_metrics() -> Dict[str, Any]:
    return ResponseBuilder.success(
        {
            "integration_metrics": {},
            "quality_metrics": {},
            "generated_at": datetime.utcnow().isoformat(),
        }
    )


@router.post("/validate/player")
async def validate_player_data() -> Dict[str, Any]:
    return ResponseBuilder.success({"status": "stubbed"})


@router.post("/validate/game")
async def validate_game_data() -> Dict[str, Any]:
    return ResponseBuilder.success({"status": "stubbed"})
