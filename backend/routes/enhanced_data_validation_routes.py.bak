"""Deprecated compatibility shim for the retired enhanced data validation API."""

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from backend.core.response_models import ResponseBuilder

router = APIRouter(prefix="/api/enhanced-data-validation", tags=["Data Validation"])

_DEPRECATION_MESSAGE = "enhanced_data_validation_routes has been retired; use validation_routes for schema checks"


def _deprecated_response() -> JSONResponse:
    return ResponseBuilder.error(
        message=_DEPRECATION_MESSAGE,
        code="DEPRECATED_ENDPOINT",
        details={"replacement": "validation_routes"},
        status_code=410,
    )


@router.get("/health")
async def health() -> JSONResponse:
    return _deprecated_response()


@router.get("/_ping")
async def ping() -> JSONResponse:
    return _deprecated_response()
