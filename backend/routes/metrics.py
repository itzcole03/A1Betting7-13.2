"""Deprecated compatibility shim for the retired metrics API."""

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from backend.core.response_models import ResponseBuilder

router = APIRouter(prefix="/api/metrics", tags=["Metrics"])

_DEPRECATION_MESSAGE = "metrics routes have been retired; use observability routes"


def _deprecated_response() -> JSONResponse:
    return ResponseBuilder.error(
        message=_DEPRECATION_MESSAGE,
        code="DEPRECATED_ENDPOINT",
        details={"replacement": "observability_routes"},
        status_code=410,
    )


@router.get("/stats/system")
async def get_system_stats() -> JSONResponse:
    return _deprecated_response()


@router.get("/stats/endpoint/{endpoint}")
async def get_endpoint_stats(_endpoint: str) -> JSONResponse:
    return _deprecated_response()


@router.get("/stats/models")
async def get_model_stats() -> JSONResponse:
    return _deprecated_response()


@router.get("/stats/endpoints")
async def get_all_endpoint_stats() -> JSONResponse:
    return _deprecated_response()
