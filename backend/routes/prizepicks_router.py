"""Minimal import-safe PrizePicks router stub for tests.

This replacement avoids import-time side-effects and syntax issues. It keeps
the public symbol `router` so `backend.api_integration` can import it safely
during app creation and pytest collection.
"""

from typing import Any, Dict, List

from fastapi import APIRouter, Response, status

router = APIRouter(
    prefix="/api/prizepicks-router-legacy", tags=["PrizePicks-Router-Legacy"]
)


@router.get("/api/prizepicks/props")
def get_prizepicks_props() -> Dict[str, List[Dict[str, Any]]]:
    """Return an empty props payload for tests."""
    return {"props": []}


@router.get("/api/prizepicks/recommendations")
def get_prizepicks_recommendations() -> Dict[str, List[Dict[str, Any]]]:
    """Return an empty recommendations list for tests."""
    return {"recommendations": []}


@router.get("/api/prizepicks/health")
def get_prizepicks_health() -> Dict[str, Any]:
    """Return healthy status for tests."""
    return {"status": "healthy", "message": "PrizePicks API is healthy."}


@router.post("/api/prizepicks/lineup/optimize")
def optimize_lineup() -> Response:
    """Stub lineup optimize endpoint returning the request would be handled."""
    return Response(
        content=str({"status": "success", "optimized_lineup": []}),
        status_code=status.HTTP_200_OK,
    )
