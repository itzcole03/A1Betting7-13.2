"""Import-safe correlation & tickets stub used during triage/tests.

This module provides a tiny, well-formed router and a no-op
instrument_route decorator so test collection and app startup won't
fail due to missing symbols or heavy dependencies.
"""

from typing import Any, Callable, Dict

from fastapi import APIRouter

router = APIRouter(prefix="/api/tickets", tags=["tickets"])


def instrument_route(name: str) -> Callable:
    """No-op decorator; production code replaces this with real instrumentation."""

    def _decorator(fn: Callable) -> Callable:
        return fn

    return _decorator


@router.get("/_ping")
async def ping() -> Dict[str, Any]:
    return {
        "success": True,
        "data": {"service": "correlation_and_tickets", "status": "healthy"},
        "error": None,
    }


@router.post("/correlation/matrix")
async def correlation_matrix(payload: Dict[str, Any]) -> Dict[str, Any]:
    prop_ids = payload.get("prop_ids", []) if isinstance(payload, dict) else []
    matrix = {pid: {pid: 1.0 for pid in prop_ids} for pid in prop_ids}
    return {
        "success": True,
        "data": {"matrix": matrix, "prop_ids_count": len(prop_ids)},
        "error": None,
    }


@router.post("/tickets/draft")
async def create_ticket_draft(payload: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "success": True,
        "data": {"ticket_id": 0, "status": "drafted"},
        "error": None,
    }


__all__ = ["router", "instrument_route"]
