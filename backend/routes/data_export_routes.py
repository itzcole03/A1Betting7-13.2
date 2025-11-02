"""Deprecated compatibility shim for the retired data export API."""

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from backend.core.response_models import ResponseBuilder

router = APIRouter(prefix="/api/v1/data-export", tags=["data-export"])

_DEPRECATION_MESSAGE = (
    "data_export_routes has been retired; use unified_api export jobs"
)


def _deprecated_response() -> JSONResponse:
    return ResponseBuilder.error(
        message=_DEPRECATION_MESSAGE,
        code="DEPRECATED_ENDPOINT",
        details={"replacement": "unified_api"},
        status_code=410,
    )


@router.get("/ping")
async def ping() -> JSONResponse:
    return _deprecated_response()


@router.get("/fields/{data_type}")
async def get_available_fields(_data_type: str) -> JSONResponse:
    return _deprecated_response()
