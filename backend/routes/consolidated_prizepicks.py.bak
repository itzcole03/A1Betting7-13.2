"""Consolidated PrizePicks routes (import-safe stub).

This file intentionally provides a small, import-safe FastAPI router with
lightweight endpoints used by tests and other importers. Heavy runtime
dependencies and production ML logic are intentionally omitted here so the
module can be safely imported during pytest collection.
"""

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Query

from ..core.response_models import ResponseBuilder

logger = logging.getLogger(__name__)

# Public router exported for the application and tests
router = APIRouter(prefix="/api/v1/prizepicks", tags=["PrizePicks-Consolidated"])


@router.get("/props")
async def get_prizepicks_props(
    sport: Optional[str] = None,
    min_confidence: Optional[int] = 70,
    enhanced: bool = Query(True, description="Use enhanced ensemble predictions"),
    fallback_mode: bool = Query(False, description="Force simple fallback mode"),
) -> Dict[str, Any]:
    """Return a small set of mock PrizePicks props (import-safe)."""
    props = [
        {
            "id": "simple_001",
            "player_name": "Shohei Ohtani",
            "sport": "MLB",
            "stat_type": "Hits",
            "line_score": 1.5,
            "ensemble_confidence": 78.5,
        }
    ]

    # simple filter by sport
    if sport:
        props = [p for p in props if p.get("sport", "").lower() == sport.lower()]

    return ResponseBuilder.success(props)


@router.get("/recommendations")
async def get_prizepicks_recommendations(sport: Optional[str] = None) -> Dict[str, Any]:
    """Return lightweight mock recommendations."""
    recs = [
        {
            "id": "rec_1",
            "player": "Shohei Ohtani",
            "sport": "MLB",
            "recommendation": "over",
            "confidence": 85,
        }
    ]
    if sport:
        recs = [r for r in recs if r.get("sport", "").lower() == sport.lower()]
    return ResponseBuilder.success(recs)


@router.post("/lineup/optimize")
async def optimize_lineup(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Return a deterministic mock optimization result."""
    entries = payload.get("entries", []) if isinstance(payload, dict) else []
    total_conf = sum(e.get("confidence", 0) for e in entries) / (len(entries) or 1)
    result = {"total_confidence": total_conf, "expected_payout": len(entries) * 1.85}
    return ResponseBuilder.success(result)


@router.get("/health")
async def get_prizepicks_health() -> Dict[str, Any]:
    """Lightweight health endpoint suitable for import-time checks."""
    data = {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}
    return ResponseBuilder.success(data)


# Keep more advanced endpoints out of import-time path; tests should import
# router only and call small endpoints above. Heavy ML/service integrations
# belong in separate modules imported at runtime by the server.
