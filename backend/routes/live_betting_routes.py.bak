"""Deprecated compatibility shim for the retired live betting API."""

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from backend.core.response_models import ResponseBuilder

router = APIRouter(prefix="/api/live-betting", tags=["Live Betting"])

_DEPRECATION_MESSAGE = (
    "live_betting_routes has been retired; use consolidated live analytics APIs"
)


def _deprecated_response() -> JSONResponse:
    return ResponseBuilder.error(
        message=_DEPRECATION_MESSAGE,
        code="DEPRECATED_ENDPOINT",
        details={"replacement": "unified_sports_routes"},
        status_code=410,
    )


@router.get("/")
async def deprecated_root() -> JSONResponse:
    """Return a standardized deprecation envelope for legacy callers."""

    return _deprecated_response()
