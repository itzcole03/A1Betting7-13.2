"""Deprecated compatibility shim for the retired optimized real-time API."""

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from backend.core.response_models import ResponseBuilder

router = APIRouter(
    prefix="/api/optimized_real_time_routes", tags=["optimized_real_time_routes"]
)

_DEPRECATION_MESSAGE = (
    "optimized_real_time_routes has been retired; use consolidated real-time feeds"
)


def _deprecated_response() -> JSONResponse:
    return ResponseBuilder.error(
        message=_DEPRECATION_MESSAGE,
        code="DEPRECATED_ENDPOINT",
        details={"replacement": "enhanced_websocket_routes"},
        status_code=410,
    )


@router.get("/health")
def health() -> JSONResponse:
    return _deprecated_response()


@router.get("/_ping")
def ping() -> JSONResponse:
    return _deprecated_response()


__all__ = ["router"]
