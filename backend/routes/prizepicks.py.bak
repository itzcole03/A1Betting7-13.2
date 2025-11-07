"""Minimal import-safe PrizePicks router stub used during triage/tests.

This file purposefully avoids heavy imports, global state and side-effects so
the application and pytest collection can import it reliably. It exports the
`router` symbol expected by `backend.api_integration` and other modules.
"""

from typing import Any, Dict, List

from fastapi import APIRouter
from fastapi.responses import JSONResponse

router = APIRouter(prefix="/api/v1/prizepicks", tags=["PrizePicks"])
__all__ = ["router"]


@router.get("/props")
def get_prizepicks_props() -> Dict[str, List[Dict[str, Any]]]:
    """Return a minimal, safe props payload for tests."""
    # Use local import of ResponseBuilder to avoid heavy imports at module load
    try:
        from backend.core.response_models import ResponseBuilder

        return JSONResponse(
            status_code=200, content=ResponseBuilder.success({"props": []})
        )
    except Exception:
        # Fallback to minimal shape if builder unavailable
        return JSONResponse(
            status_code=200,
            content={"success": True, "data": {"props": []}, "error": None},
        )


@router.get("/recommendations")
def get_prizepicks_recommendations() -> Dict[str, List[Dict[str, Any]]]:
    """Return an empty recommendations list (safe stub)."""
    try:
        from backend.core.response_models import ResponseBuilder

        return JSONResponse(
            status_code=200, content=ResponseBuilder.success({"recommendations": []})
        )
    except Exception:
        return JSONResponse(
            status_code=200,
            content={"success": True, "data": {"recommendations": []}, "error": None},
        )


@router.get("/health")
def prizepicks_health() -> Dict[str, Any]:
    """Simple health response used during startup and tests."""
    try:
        from backend.core.response_models import ResponseBuilder

        return JSONResponse(
            status_code=200, content=ResponseBuilder.success({"status": "ok"})
        )
    except Exception:
        return JSONResponse(
            status_code=200,
            content={"success": True, "data": {"status": "ok"}, "error": None},
        )


@router.post("/heal")
def prizepicks_heal() -> JSONResponse:
    """Stubbed heal endpoint that returns a standardized success payload."""
    try:
        from backend.core.response_models import ResponseBuilder

        payload = {
            "message": "PrizePicks scraper healing initiated.",
            "status": "success",
        }
        return JSONResponse(status_code=200, content=ResponseBuilder.success(payload))
    except Exception:
        # Fallback minimal envelope in case ResponseBuilder isn't importable at test time
        payload = {
            "message": "PrizePicks scraper healing initiated.",
            "status": "success",
        }
        return JSONResponse(
            status_code=200, content={"success": True, "data": payload, "error": None}
        )
