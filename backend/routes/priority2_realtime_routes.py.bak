"""Deprecated compatibility shim for the retired priority2 real-time API."""

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from backend.core.response_models import ResponseBuilder

router = APIRouter(prefix="/api/priority2-realtime", tags=["priority2-realtime"])

_DEPRECATION_MESSAGE = (
    "priority2_realtime_routes has been retired; use consolidated real-time feeds"
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
def _ping() -> JSONResponse:
    return _deprecated_response()


__all__ = ["router"]
