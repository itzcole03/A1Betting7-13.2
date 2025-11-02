"""Deprecated compatibility shim for the retired enhanced API module."""

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from backend.core.response_models import ResponseBuilder

router = APIRouter(prefix="/api/enhanced", tags=["Enhanced API"])

_DEPRECATION_MESSAGE = "enhanced_api has been retired; use unified_api endpoints"


def _deprecated_response() -> JSONResponse:
    return ResponseBuilder.error(
        message=_DEPRECATION_MESSAGE,
        code="DEPRECATED_ENDPOINT",
        details={"replacement": "unified_api"},
        status_code=410,
    )


@router.get("/health")
async def health() -> JSONResponse:
    return _deprecated_response()


@router.get("/_ping")
async def ping() -> JSONResponse:
    return _deprecated_response()
