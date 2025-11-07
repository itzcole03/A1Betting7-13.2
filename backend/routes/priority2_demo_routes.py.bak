"""Deprecated compatibility shim for the retired priority2 demo API."""

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from backend.core.response_models import ResponseBuilder

router = APIRouter(prefix="/api/priority2/demo", tags=["Priority2 Demo"])

_DEPRECATION_MESSAGE = (
    "priority2_demo_routes has been retired; use consolidated demo tooling"
)


def _deprecated_response() -> JSONResponse:
    return ResponseBuilder.error(
        message=_DEPRECATION_MESSAGE,
        code="DEPRECATED_ENDPOINT",
        details={"replacement": "unified_api"},
        status_code=410,
    )


@router.get("/health")
def health() -> JSONResponse:
    return _deprecated_response()


@router.get("/_ping")
def ping() -> JSONResponse:
    return _deprecated_response()


__all__ = ["router"]
