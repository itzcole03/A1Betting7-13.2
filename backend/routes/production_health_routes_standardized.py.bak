"""Import-safe stub exposing canonical production health endpoints.

This shim keeps the module lightweight for triage while returning the
standard {success, data, error} envelope expected by health checks.
"""

from typing import Any, Dict

from fastapi import APIRouter
from fastapi.responses import JSONResponse

try:
    from backend.core.response_models import ResponseBuilder
except Exception:  # pragma: no cover - fallback for isolated tooling
    ResponseBuilder = None

router = APIRouter(
    prefix="/api/production_health_standardized",
    tags=["production_health"],
)


def _success(payload: Dict[str, Any]) -> JSONResponse:
    """Return the canonical success envelope, preferring ResponseBuilder."""
    if ResponseBuilder is not None:
        return ResponseBuilder.success(payload)

    return JSONResponse(
        status_code=200,
        content={"success": True, "data": payload, "error": None},
    )


@router.get("/health")
def health() -> JSONResponse:
    """Minimal health response consumed by external monitors."""
    payload = {
        "status": "ok",
        "service": "production_health_routes_standardized (stub)",
    }
    return _success(payload)


@router.get("/_ping")
def ping() -> Dict[str, bool]:
    """Lightweight ping endpoint preserving legacy behaviour."""
    return {"ok": True}


__all__ = ["router"]
