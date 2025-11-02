"""Deprecated compatibility shim for the retired secured Kelly API."""

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from backend.core.response_models import ResponseBuilder

router = APIRouter(prefix="/advanced-kelly-secured", tags=["advanced-kelly-secured"])

_DEPRECATION_MESSAGE = "advanced_kelly_routes_secured has been retired; migrate to consolidated bankroll APIs"


def _deprecated_response() -> JSONResponse:
    return ResponseBuilder.error(
        message=_DEPRECATION_MESSAGE,
        code="DEPRECATED_ENDPOINT",
        details={"replacement": "bankroll_routes"},
        status_code=410,
    )


@router.get("/")
async def deprecated_root() -> JSONResponse:
    """Return a standardized deprecation envelope for secured callers."""

    return _deprecated_response()
