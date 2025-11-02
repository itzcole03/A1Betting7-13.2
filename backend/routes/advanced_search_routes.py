"""Deprecated compatibility shim for the retired advanced search API."""

from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse

from backend.core.response_models import ResponseBuilder

router = APIRouter(prefix="/api/v1/search", tags=["Advanced Search"])

_DEPRECATION_MESSAGE = (
    "advanced_search_routes has been retired; use unified_api filtering endpoints"
)


def _deprecated_response(message: str = _DEPRECATION_MESSAGE) -> JSONResponse:
    return ResponseBuilder.error(
        message=message,
        code="DEPRECATED_ENDPOINT",
        details={"replacement": "unified_api"},
        status_code=410,
    )


@router.get("/health")
async def health() -> JSONResponse:
    return _deprecated_response()


@router.get("/players")
async def list_players(
    player_name: str | None = Query(None),
    limit: int = Query(50),
    offset: int = Query(0),
) -> JSONResponse:
    return _deprecated_response()


@router.get("/odds")
async def list_odds(
    sport: str | None = Query(None), limit: int = Query(50), offset: int = Query(0)
) -> JSONResponse:
    return _deprecated_response()
