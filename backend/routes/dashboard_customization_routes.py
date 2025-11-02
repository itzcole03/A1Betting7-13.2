"""Deprecated compatibility shim for the retired dashboard customization API."""

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from backend.core.response_models import ResponseBuilder

router = APIRouter(prefix="/api/dashboard-customization", tags=["Dashboard"])

_DEPRECATION_MESSAGE = (
    "dashboard_customization_routes has been retired; use consolidated dashboards"
)


def _deprecated_response() -> JSONResponse:
    return ResponseBuilder.error(
        message=_DEPRECATION_MESSAGE,
        code="DEPRECATED_ENDPOINT",
        details={"replacement": "dashboard routes"},
        status_code=410,
    )


@router.get("/health")
async def health() -> JSONResponse:
    return _deprecated_response()


@router.get("/_ping")
async def ping() -> JSONResponse:
    return _deprecated_response()
