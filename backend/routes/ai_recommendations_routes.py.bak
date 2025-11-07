"""Deprecated compatibility shim for the retired AI recommendations API."""

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from backend.core.response_models import ResponseBuilder

router = APIRouter(prefix="/v1/ai-recommendations", tags=["AI Recommendations"])

_DEPRECATION_MESSAGE = (
    "ai_recommendations_routes has been retired; use consolidated insights APIs"
)


def _deprecated_response() -> JSONResponse:
    return ResponseBuilder.error(
        message=_DEPRECATION_MESSAGE,
        code="DEPRECATED_ENDPOINT",
        details={"replacement": "consolidated_ai"},
        status_code=410,
    )


@router.get("/")
async def deprecated_root() -> JSONResponse:
    """Return a standardized deprecation envelope for legacy callers."""

    return _deprecated_response()
