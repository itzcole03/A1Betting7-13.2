"""Minimal, import-safe MLB extras router used during triage.

This lightweight stub implements a small compatibility layer so test
modules can import expected functions directly (e.g. get_todays_games,
get_live_game_data, get_play_by_play_data, get_filtered_prizepicks_props).
It also exposes FastAPI routes so integration tests hitting the HTTP
endpoints receive simple deterministic responses.

Keep this file minimal and side-effect free; replace with the full
implementation from backups when ready.
"""

import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query

logger = logging.getLogger("propollama")

# Router intentionally has no module-level prefix. The canonical app factory
# mounts this router with prefix="/mlb" so duplicating the prefix here would
# result in paths like /mlb/mlb/<path> and cause 404s in tests that hit /mlb/*.
router = APIRouter(tags=["mlb_extras"])


# --- Minimal functional API used by tests (module-level) ---
def get_todays_games() -> List[Dict[str, Any]]:
    """Return today's MLB games (stubbed empty list)."""
    return []


def get_filtered_prizepicks_props(
    filters: Optional[Dict[str, Any]] = None,
) -> List[Dict[str, Any]]:
    """Return prizepicks props filtered by the provided criteria (stub)."""
    return []


def get_live_game_data(game_id: Any) -> Optional[Dict[str, Any]]:
    """Return lightweight live game data for the given game_id or None."""
    return None


def get_play_by_play_data(game_id: Any) -> List[Dict[str, Any]]:
    """Return play-by-play event list for a game (stubbed empty list)."""
    return []


# --- HTTP endpoints that call the module helpers ---
@router.get("/ping")
async def mlb_ping() -> Dict[str, Any]:
    return {"status": "ok", "service": "mlb_extras_stub"}


@router.get("/todays-games")
async def todays_games_route() -> Dict[str, Any]:
    try:
        data = get_todays_games()
        return {"success": True, "data": data}
    except Exception as exc:  # pragma: no cover - defensive
        logging.exception("Error in todays_games_route")
        raise HTTPException(status_code=500, detail="MLB service error")


@router.get("/play-by-play/{game_id}")
async def play_by_play_route(game_id: str) -> Dict[str, Any]:
    try:
        result = get_play_by_play_data(game_id)
        if result is None:
            raise HTTPException(status_code=404, detail="Game not found")
        return {"success": True, "game_id": game_id, "data": result}
    except HTTPException:
        raise
    except Exception:  # pragma: no cover - defensive
        logging.exception("Error in play_by_play_route for %s", game_id)
        raise HTTPException(status_code=500, detail="Play-by-play service error")


@router.get("/comprehensive-props/{game_id}")
async def comprehensive_props_route(
    game_id: str,
    optimize_performance: bool = Query(False, alias="optimize_performance"),
) -> Dict[str, Any]:
    """Generate comprehensive props for a game using the comprehensive prop generator.

    This function imports the generator lazily so tests can patch the class without
    import-time side-effects.
    """
    try:
        # convert to int when possible (tests expect int argument)
        gid = int(game_id)
    except Exception:
        raise HTTPException(status_code=400, detail="invalid game id")

    try:
        # Import inside the handler to keep module import-safe
        from backend.services.comprehensive_prop_generator import (
            ComprehensivePropGenerator,
        )

        generator = ComprehensivePropGenerator()
        # The generator may be async (tests patch it with AsyncMock). Await
        # the call to ensure we return serializable Python objects instead
        # of coroutine objects which Pydantic cannot serialize.
        maybe_result = generator.generate_game_props(
            gid, optimize_performance=optimize_performance
        )
        # Support both sync and async implementations
        if hasattr(maybe_result, "__await__"):
            result = await maybe_result
        else:
            result = maybe_result
        return {"success": True, "data": result}
    except HTTPException:
        raise
    except Exception as exc:
        logging.exception("Comprehensive props generation failed for %s", game_id)
        raise HTTPException(status_code=500, detail="Comprehensive props service error")


@router.get("/prizepicks-props/")
async def prizepicks_props_route() -> Dict[str, Any]:
    """Return PrizePicks-style props; on upstream failure return empty list (graceful fallback)."""
    try:
        props = get_filtered_prizepicks_props()
        return {"success": True, "data": props}
    except Exception:
        logging.exception("PrizePicks props source failed, returning empty list")
        return {"success": True, "data": []}


@router.get("/test-props/")
async def test_props_route() -> Dict[str, Any]:
    """A lightweight test endpoint used by unit tests to verify router reachability."""
    return {
        "success": True,
        "data": {"status": "ok", "message": "mlb_extras router is reachable"},
    }


@router.get("/live-game-stats/{game_id}")
async def live_game_stats_route(game_id: str) -> Dict[str, Any]:
    """Return live game stats or 404 if not found."""
    # Accept both numeric and non-numeric game ids. Tests patch
    # `get_live_game_data` and may call the endpoint with values like
    # "invalid-game-id" expecting a 404 when the data source returns None.
    try:
        data = get_live_game_data(game_id)
        if data is None:
            raise HTTPException(status_code=404, detail="game not found")
        return {"success": True, "data": data}
    except HTTPException:
        raise
    except Exception:
        logging.exception("Error fetching live game data for %s", game_id)
        raise HTTPException(status_code=500, detail="Live game service error")
