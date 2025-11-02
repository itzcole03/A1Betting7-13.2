"""Deprecated compatibility shim for the retired bets API."""

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from backend.core.response_models import ResponseBuilder

router = APIRouter(prefix="/api/bets", tags=["bets"])

_DEPRECATION_MESSAGE = "bets_routes has been retired; use bankroll_routes consolidation"


def _deprecated_response() -> JSONResponse:
    return ResponseBuilder.error(
        message=_DEPRECATION_MESSAGE,
        code="DEPRECATED_ENDPOINT",
        details={"replacement": "bankroll_routes"},
        status_code=410,
    )


@router.post("")
async def place_bet() -> JSONResponse:
    return _deprecated_response()


@router.post("/closing-update")
async def closing_update() -> JSONResponse:
    return _deprecated_response()


@router.get("")
async def list_bets(_with_clv_only: bool = False) -> JSONResponse:
    return _deprecated_response()
