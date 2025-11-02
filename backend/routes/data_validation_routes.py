"""Deprecated compatibility shim for the retired data validation API."""

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from backend.core.response_models import ResponseBuilder

router = APIRouter(prefix="/api/validation", tags=["data-validation"])

_DEPRECATION_MESSAGE = "data_validation_routes has been retired; use validation_routes"


def _deprecated_response() -> JSONResponse:
    return ResponseBuilder.error(
        message=_DEPRECATION_MESSAGE,
        code="DEPRECATED_ENDPOINT",
        details={"replacement": "validation_routes"},
        status_code=410,
    )


@router.get("/health")
async def validation_health() -> JSONResponse:
    return _deprecated_response()


@router.get("/metrics")
async def get_validation_metrics() -> JSONResponse:
    return _deprecated_response()


@router.post("/validate/player")
async def validate_player_data() -> JSONResponse:
    return _deprecated_response()


@router.post("/validate/game")
async def validate_game_data() -> JSONResponse:
    return _deprecated_response()
