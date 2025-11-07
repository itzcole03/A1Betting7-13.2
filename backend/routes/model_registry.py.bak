"""Deprecated compatibility shim for the retired model registry module."""

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from backend.core.response_models import ResponseBuilder

router = APIRouter(tags=["Model Registry (Legacy)"])

_DEPRECATION_MESSAGE = (
    "model_registry has been retired; use enterprise_model_registry_routes or "
    "model_registry_simple"
)


def _deprecated_response() -> JSONResponse:
    return ResponseBuilder.error(
        message=_DEPRECATION_MESSAGE,
        code="DEPRECATED_ENDPOINT",
        details={"replacement": "enterprise_model_registry_routes"},
        status_code=410,
    )


@router.get("/_ping")
async def ping() -> JSONResponse:
    """Return a standardized deprecation envelope for legacy callers."""

    return _deprecated_response()
