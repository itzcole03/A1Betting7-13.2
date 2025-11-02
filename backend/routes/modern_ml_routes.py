"""Deprecated compatibility shim for the retired modern ML API."""

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from backend.core.response_models import ResponseBuilder

router = APIRouter(prefix="/api/v2/modern-ml", tags=["Modern ML"])

_DEPRECATION_MESSAGE = "modern_ml_routes has been retired; use enhanced_ml_routes"


def _deprecated_response() -> JSONResponse:
    return ResponseBuilder.error(
        message=_DEPRECATION_MESSAGE,
        code="DEPRECATED_ENDPOINT",
        details={"replacement": "enhanced_ml_routes"},
        status_code=410,
    )


@router.get("/health")
async def health() -> JSONResponse:
    return _deprecated_response()


@router.get("/_ping")
async def ping() -> JSONResponse:
    return _deprecated_response()


__all__ = ["router"]
