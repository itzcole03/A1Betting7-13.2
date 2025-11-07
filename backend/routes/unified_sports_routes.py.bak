"""Minimal import-safe unified sports routes used for triage.

This module intentionally avoids heavy runtime dependencies and complex
initialization so pytest can import the backend during triage. Replace with
the real implementation once import-time issues are resolved.
"""

from typing import Any, Dict, List

from fastapi import APIRouter

router = APIRouter(prefix="/sports", tags=["Unified Sports"])


def _fallback_success(data: Any) -> Dict[str, Any]:
    return {"success": True, "data": data, "error": None}


@router.get("/", include_in_schema=False)
def sports_root() -> Dict[str, Any]:
    return _fallback_success({"status": "ok", "message": "Unified sports stub"})


@router.get("/health")
def health() -> Dict[str, Any]:
    return _fallback_success({"status": "ok"})


@router.get("/available")
def get_available_sports() -> Dict[str, Any]:
    # Return a minimal deterministic shape so tests depending on import succeed
    sports: List[Dict[str, Any]] = []
    return _fallback_success({"status": "ok", "sports": sports, "count": len(sports)})


@router.get("/{sport}/teams")
def get_sport_teams(sport: str) -> Dict[str, Any]:
    return _fallback_success({"status": "ok", "sport": sport, "teams": [], "count": 0})


@router.get("/{sport}/players")
def get_sport_players(sport: str) -> Dict[str, Any]:
    return _fallback_success(
        {"status": "ok", "sport": sport, "players": [], "count": 0}
    )


@router.get("/{sport}/odds")
def get_sport_odds(sport: str) -> Dict[str, Any]:
    return _fallback_success({"status": "ok", "sport": sport, "odds": {}})
