"""Deprecated compatibility shim for the retired cheatsheets API."""

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from backend.core.response_models import ResponseBuilder

router = APIRouter(prefix="/v1/cheatsheets", tags=["Cheatsheets"])

_DEPRECATION_MESSAGE = (
    "cheatsheets_routes has been retired; use consolidated prop dashboards"
)


def _deprecated_response() -> JSONResponse:
    return ResponseBuilder.error(
        message=_DEPRECATION_MESSAGE,
        code="DEPRECATED_ENDPOINT",
        details={"replacement": "propfinder_routes"},
        status_code=410,
    )


@router.get("/")
async def deprecated_root() -> JSONResponse:
    """Return a standardized deprecation envelope for legacy callers."""

    return _deprecated_response()
