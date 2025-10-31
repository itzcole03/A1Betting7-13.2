"""Import-safe, minimal shim for mlb_extras functionality.

This module intentionally provides lightweight, well-typed stubs and
APIRouter exports so the rest of the application and test collection can
import the router without executing heavy logic or causing import-time
exceptions. Implementations here return a canonical JSON envelope via
ResponseBuilder.success(...) when available, and fall back to a small
local helper when not.

Keep this file intentionally small and side-effect free.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from fastapi import APIRouter, Query

logger = logging.getLogger("propollama")

# Try to import the project's canonical response builder. If it's not
# available (tests running in partial contexts), provide a tiny fallback
# that matches the envelope shape used across the codebase.
try:
    from backend.core.response_models import ResponseBuilder
except Exception:  # pragma: no cover - fallback only for import-safety

    class _FallbackResponseBuilder:
        @staticmethod
        def success(data: Any = None) -> Dict[str, Any]:
            return {"success": True, "data": data, "error": None}

    ResponseBuilder = _FallbackResponseBuilder


# Export a router so other modules can include/attach it safely.
router = APIRouter(prefix="/mlb", tags=["mlb"])


@router.get("/test-props/")
async def test_props() -> Dict[str, Any]:
    """Lightweight health/debug endpoint for the mlb_extras shim."""
    return ResponseBuilder.success(
        {"status": "ok", "message": "mlb_extras shim reachable"}
    )


@router.get("/prizepicks-props/")
async def get_mlb_prizepicks_props() -> Dict[str, Any]:
    """Stubbed endpoint that returns an empty PrizePicks props list.

    The real implementation lives in a service module; this shim ensures
    imports succeed during test collection.
    """
    return ResponseBuilder.success([])


@router.get("/odds-comparison/")
async def get_odds_comparison(
    market_type: str = Query("regular"),
    stat_types: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
) -> Dict[str, Any]:
    """Return an empty odds comparison result as a safe stub."""
    return ResponseBuilder.success([])


@router.get("/todays-games")
async def get_todays_games() -> Dict[str, Any]:
    """Return a minimal today/games envelope."""
    now = datetime.now(timezone.utc).isoformat()
    return ResponseBuilder.success({"status": "ok", "games": [], "timestamp": now})


@router.get("/live-game-stats/{game_id}")
async def get_live_game_stats(game_id: int) -> Dict[str, Any]:
    """Stub for live game stats."""
    return ResponseBuilder.success({"status": "ok", "game_id": game_id, "stats": {}})


@router.get("/play-by-play/{game_id}")
async def get_play_by_play(game_id: int) -> Dict[str, Any]:
    """Stub for play-by-play events."""
    return ResponseBuilder.success({"status": "ok", "game_id": game_id, "events": []})


@router.get("/past-matchups/{game_id}")
async def get_past_matchups(game_id: int) -> Dict[str, Any]:
    """Stub for past matchup data."""
    return ResponseBuilder.success({"status": "ok", "game_id": game_id, "matchups": []})


@router.get("/action-shots/{event_id}")
async def get_action_shots(event_id: str) -> Dict[str, Any]:
    """Stub that returns an empty list of action shots."""
    return ResponseBuilder.success([])


@router.get("/country-flag/{country_code}")
async def get_country_flag(country_code: str) -> Dict[str, Any]:
    """Stub that returns a placeholder URL for a country flag."""
    return ResponseBuilder.success(f"https://flags.example/{country_code}.png")


@router.get("/comprehensive-props/{game_id}")
async def generate_comprehensive_props(
    game_id: int, optimize_performance: bool = Query(True)
) -> Dict[str, Any]:
    """Stub for comprehensive prop generation. Returns empty props array."""
    return ResponseBuilder.success({"status": "ok", "game_id": game_id, "props": []})


@router.get("/ml-performance-analytics/")
async def get_ml_performance_analytics() -> Dict[str, Any]:
    """Stubbed ML analytics endpoint."""
    return ResponseBuilder.success({"status": "ok", "analytics": {}})


@router.get("/phase2-performance-analytics/")
async def get_phase2_performance_analytics() -> Dict[str, Any]:
    """Stubbed Phase 2 analytics endpoint."""
    return ResponseBuilder.success({"status": "ok", "phase2": {}})
