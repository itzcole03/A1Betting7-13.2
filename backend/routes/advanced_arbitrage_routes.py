"""Deprecated compatibility stub for the old advanced arbitrage API."""

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from backend.core.response_models import ResponseBuilder

router = APIRouter(prefix="/api/advanced-arbitrage", tags=["Advanced Arbitrage"])

_DEPRECATION_MESSAGE = (
    "advanced_arbitrage_routes has been retired; use unified odds endpoints"
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
    """Return a standardized failure envelope for deprecated endpoints."""

    return _deprecated_response()
