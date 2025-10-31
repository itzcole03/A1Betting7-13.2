"""PrizePicks simple router - import-safe stub.

This module provides a minimal, side-effect-free APIRouter that other
parts of the codebase can import during triage and testing. It returns
responses using the project's canonical envelope via ResponseBuilder.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter

from backend.core.response_models import ResponseBuilder

router = APIRouter(prefix="/api/prizepicks-simple", tags=["PrizePicks-Simple-Legacy"])


@router.get("/props")
async def get_simple_prizepicks_props(
    sport: Optional[str] = None, min_confidence: Optional[int] = 70
) -> Dict[str, Any]:
    """Return a tiny list of mock props inside the canonical envelope."""
    props: List[Dict[str, Any]] = [
        {
            "id": "prop_001",
            "player_name": "Shohei Ohtani",
            "sport": "MLB",
            "line_score": 1.5,
            "ensemble_confidence": 78.5,
        }
    ]
    if sport:
        props = [p for p in props if p.get("sport", "").lower() == sport.lower()]
    filtered = [
        p for p in props if p.get("ensemble_confidence", 0) >= (min_confidence or 0)
    ]
    return ResponseBuilder.success(filtered)


@router.get("/status")
async def get_simple_status() -> Dict[str, Any]:
    """Health/status endpoint for the simple PrizePicks shim."""
    return ResponseBuilder.success(
        {
            "status": "healthy",
            "mode": "stub",
            "props_available": 1,
            "last_update": datetime.now(timezone.utc).isoformat(),
        }
    )
