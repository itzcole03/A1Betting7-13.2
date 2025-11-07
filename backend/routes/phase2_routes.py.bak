"""Deprecated compatibility shim for the retired phase 2 API."""

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from backend.core.response_models import ResponseBuilder

router = APIRouter(prefix="/api/phase2", tags=["phase2"])

_DEPRECATION_MESSAGE = "phase2_routes has been retired; use modern_ml_phase2_routes"


def _deprecated_response() -> JSONResponse:
    return ResponseBuilder.error(
        message=_DEPRECATION_MESSAGE,
        code="DEPRECATED_ENDPOINT",
        details={"replacement": "modern_ml_phase2_routes"},
        status_code=410,
    )


@router.get("/health")
def health() -> JSONResponse:
    return _deprecated_response()


@router.get("/_ping")
def ping() -> JSONResponse:
    return _deprecated_response()


__all__ = ["router"]
