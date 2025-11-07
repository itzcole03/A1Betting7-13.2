"""Deprecated compatibility shim for the retired FanDuel integration API."""

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from backend.core.response_models import ResponseBuilder

router = APIRouter(prefix="/api/fanduel", tags=["Fanduel"])

_DEPRECATION_MESSAGE = (
    "fanduel routes have been retired; use unified_sports_routes integrations"
)


def _deprecated_response() -> JSONResponse:
    return ResponseBuilder.error(
        message=_DEPRECATION_MESSAGE,
        code="DEPRECATED_ENDPOINT",
        details={"replacement": "unified_sports_routes"},
        status_code=410,
    )


@router.get("/health")
async def health() -> JSONResponse:
    return _deprecated_response()


@router.get("/markets")
async def get_markets() -> JSONResponse:
    return _deprecated_response()


@router.get("/events")
async def get_events() -> JSONResponse:
    return _deprecated_response()


@router.get("/odds")
async def get_odds() -> JSONResponse:
    return _deprecated_response()
