"""Deprecated compatibility shim for the retired debug API."""

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from backend.core.response_models import ResponseBuilder

router = APIRouter(prefix="/debug", tags=["Debug"])

_DEPRECATION_MESSAGE = "debug_api has been retired; use observability events endpoints"


def _deprecated_response() -> JSONResponse:
    return ResponseBuilder.error(
        message=_DEPRECATION_MESSAGE,
        code="DEPRECATED_ENDPOINT",
        details={"replacement": "observability_routes"},
        status_code=410,
    )


@router.post("/batch-test")
async def debug_batch_test() -> JSONResponse:
    return _deprecated_response()
