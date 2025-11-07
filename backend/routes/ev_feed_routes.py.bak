"""Lightweight EV feed routes shim for tests.

Provides minimal endpoints used in tests and honors the
`POSITIVE_EV_FEED_DISABLED` environment flag.
"""

import os
from typing import Any, Dict, Optional

from fastapi import APIRouter, HTTPException, Query

try:
    from backend.core.app import fail, ok
except Exception:

    def ok(payload: Dict[str, Any]) -> Dict[str, Any]:
        return {"success": True, "data": payload, "error": None}

    def fail(code: int, message: str) -> Dict[str, Any]:
        return {
            "success": False,
            "data": None,
            "error": {"code": code, "message": message},
        }


# Lazy import at module import time so tests can monkeypatch the service
from backend.services.ev_feed_service import ev_feed_service

router = APIRouter(prefix="/api/ev", tags=["EV Feed"])


# Safe serializer helper (prefer model_dump, then dict, then __dict__)
def _safe_dump(obj):
    try:
        if hasattr(obj, "model_dump") and callable(getattr(obj, "model_dump")):
            return obj.model_dump()
    except Exception:
        pass
    try:
        if hasattr(obj, "dict") and callable(getattr(obj, "dict")):
            return obj.dict()
    except Exception:
        pass
    try:
        return dict(getattr(obj, "__dict__", {}) or {})
    except Exception:
        return str(obj)


def _ev_feed_disabled() -> bool:
    return os.getenv("POSITIVE_EV_FEED_DISABLED", "0").lower() in (
        "1",
        "true",
        "yes",
        "on",
    )


@router.get("/health")
async def ev_health() -> Dict[str, Any]:
    # Health endpoint is expected by tests to return a simple payload (not wrapped)
    return {"service": "ev_feed", "status": "ok"}


@router.get("/feed")
async def get_ev_feed(limit: int = Query(20, ge=1, le=500)) -> Dict[str, Any]:
    if _ev_feed_disabled():
        raise HTTPException(status_code=503, detail="EV feed disabled by feature flag")
    try:
        feed = await ev_feed_service.get_opportunities(limit=limit)
        out = []
        for opp in getattr(feed, "opportunities", []):
            d = _safe_dump(opp)
            if "edge_tier" not in d:
                d["edge_tier"] = getattr(
                    opp, "edge_tier", None
                ) or ev_feed_service.classify_edge(getattr(opp, "ev_percent", 0))
            out.append(d)

        # Legacy compatibility: return unwrapped payload for /feed (tests expect top-level 'opportunities')
        return {"opportunities": out}
    except Exception as e:
        return fail(500, f"Failed to fetch feed: {e}")


@router.get("/feed/search")
async def search_ev_feed(
    player: Optional[str] = Query(None),
    min_edge: Optional[float] = Query(0.0),
    limit: int = Query(50),
) -> Dict[str, Any]:
    if _ev_feed_disabled():
        raise HTTPException(status_code=503, detail="EV feed disabled by feature flag")
    try:
        feed = await ev_feed_service.get_opportunities(limit=1000)
        needle = (player or "").lower().strip()
        matches = []
        for opp in getattr(feed, "opportunities", []):
            text = " ".join(
                [
                    str(getattr(opp, f, ""))
                    for f in ("player", "market", "source_book", "game_info")
                ]
            ).lower()
            if needle in text and getattr(opp, "ev_percent", 0) >= (min_edge or 0):
                d = _safe_dump(opp)
                if "edge_tier" not in d:
                    d["edge_tier"] = getattr(
                        opp, "edge_tier", None
                    ) or ev_feed_service.classify_edge(getattr(opp, "ev_percent", 0))
                matches.append(d)
        return ok({"opportunities": matches[:limit]})
    except Exception as e:
        return fail(500, f"Search failed: {e}")


@router.get("/feed/stats")
async def get_ev_feed_stats() -> Dict[str, Any]:
    if _ev_feed_disabled():
        raise HTTPException(status_code=503, detail="EV feed disabled by feature flag")
    try:
        stats = await ev_feed_service.get_stats()
        # Normalize stats into a plain dict for JSON serialization and stable test assertions
        if stats is None:
            stats_dict = {
                "total_opportunities": 0,
                "by_sport": {},
                "by_tier": {},
                "avg_ev_percent": 0.0,
                "last_generation_time": None,
                "generation_duration_ms": 0,
                "max_edge": 0.0,
            }
        else:
            try:
                # pydantic model or dataclass -> dict()
                stats_dict = _safe_dump(stats)
            except Exception:
                try:
                    from dataclasses import asdict

                    stats_dict = asdict(stats)
                except Exception:
                    # Last resort: use __dict__
                    stats_dict = getattr(stats, "__dict__", {}) or {}

            # Ensure last_generation_time is serializable (isoformat) or None
            if stats_dict.get("last_generation_time"):
                try:
                    if isinstance(stats_dict["last_generation_time"], str):
                        # already serialized
                        pass
                    else:
                        stats_dict["last_generation_time"] = stats_dict[
                            "last_generation_time"
                        ].isoformat()
                except Exception:
                    stats_dict["last_generation_time"] = None

        # Tests expect a legacy unwrapped stats payload (top-level keys)
        return stats_dict
    except Exception as e:
        return fail(500, f"Failed to fetch stats: {e}")


@router.get("/forecast")
async def get_ev_forecast() -> Dict[str, Any]:
    if _ev_feed_disabled():
        raise HTTPException(status_code=503, detail="EV feed disabled by feature flag")
    try:
        # The service exposes compute_forecasts(...) as the forecast generator.
        if hasattr(ev_feed_service, "compute_forecasts"):
            forecast = await ev_feed_service.compute_forecasts()
        elif hasattr(ev_feed_service, "get_forecast"):
            # backward-compat shim
            forecast = await ev_feed_service.get_forecast()
        else:
            forecast = []

        # Tests expect an unwrapped forecast response with top-level `items` key
        try:
            items = list(forecast) if forecast is not None else []
        except Exception:
            items = []
        return {"items": items}
    except Exception as e:
        return fail(500, f"Failed to fetch forecast: {e}")


@router.get("/feed/meta")
async def get_ev_feed_meta() -> Dict[str, Any]:
    """Return lightweight meta counters for observability used by tests.

    Expected keys: total_added, total_replaced, current_size, max_edge, etc.
    """
    if _ev_feed_disabled():
        raise HTTPException(status_code=503, detail="EV feed disabled by feature flag")
    try:
        meta = {}
        try:
            meta = ev_feed_service.get_meta()
        except Exception:
            # Defensive: if service method is not present or fails, build from attributes
            try:
                meta = {
                    "total_added": getattr(ev_feed_service, "total_added", 0),
                    "total_deduped": getattr(ev_feed_service, "total_deduped", 0),
                    "total_replaced": getattr(ev_feed_service, "total_replaced", 0),
                    "current_size": len(getattr(ev_feed_service, "_ring", [])),
                    "max_capacity": getattr(ev_feed_service, "MAX_RING_CAPACITY", 0),
                    "last_added_at": getattr(ev_feed_service, "last_added_at", None),
                    "last_prune_at": getattr(ev_feed_service, "last_prune_at", None),
                    "max_edge": getattr(ev_feed_service, "max_edge", 0.0),
                }
            except Exception:
                meta = {
                    "total_added": 0,
                    "total_deduped": 0,
                    "total_replaced": 0,
                    "current_size": 0,
                    "max_capacity": 0,
                    "last_added_at": None,
                    "last_prune_at": None,
                    "max_edge": 0.0,
                }

        # Ensure serializable values
        for k in ("last_added_at", "last_prune_at"):
            if meta.get(k) is not None:
                try:
                    # if it's a float timestamp, leave as-is; if datetime, isoformat
                    import datetime as _dt

                    if isinstance(meta[k], _dt.datetime):
                        meta[k] = meta[k].isoformat()
                except Exception:
                    meta[k] = None

        return ok(meta)
    except Exception as e:
        return fail(500, f"Failed to fetch meta: {e}")
