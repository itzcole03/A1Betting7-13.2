"""Deprecated compatibility shim for the retired risk tools API."""

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from backend.core.response_models import ResponseBuilder

router = APIRouter(prefix="/api/risk_tools", tags=["risk_tools"])

_DEPRECATION_MESSAGE = (
    "risk_tools_routes has been retired; use consolidated bankroll tooling"
)


def _deprecated_response() -> JSONResponse:
    return ResponseBuilder.error(
        message=_DEPRECATION_MESSAGE,
        code="DEPRECATED_ENDPOINT",
        details={"replacement": "bankroll_routes"},
        status_code=410,
    )


@router.get("/")
async def deprecated_root() -> JSONResponse:
    """Return a standardized deprecation envelope for legacy callers."""

    return _deprecated_response()
