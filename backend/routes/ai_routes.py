"""Deprecated compatibility shim for the retired AI v1 API."""

from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse

from backend.core.response_models import ResponseBuilder

router = APIRouter(prefix="/v1/ai", tags=["AI"])

_DEPRECATION_MESSAGE = (
    "ai_routes has been retired; use consolidated_ai routes under /api"
)


def _deprecated_response() -> JSONResponse:
    return ResponseBuilder.error(
        message=_DEPRECATION_MESSAGE,
        code="DEPRECATED_ENDPOINT",
        details={"replacement": "consolidated_ai"},
        status_code=410,
    )


@router.get("/health")
async def health() -> JSONResponse:
    return _deprecated_response()


@router.get("/explain")
async def explain_stub(
    _q: str | None = Query(None), _limit: int = Query(1)
) -> JSONResponse:
    return _deprecated_response()
