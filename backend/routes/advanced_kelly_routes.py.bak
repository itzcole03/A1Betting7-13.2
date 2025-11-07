"""Deprecated compatibility shim for the retired advanced Kelly API."""

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from backend.core.response_models import ResponseBuilder

router = APIRouter(prefix="/api/advanced-kelly", tags=["Advanced Kelly"])

_DEPRECATION_MESSAGE = (
    "advanced_kelly_routes has been retired; use consolidated bankroll tooling"
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
    """Signal that the legacy Kelly endpoints are no longer available."""

    return _deprecated_response()
