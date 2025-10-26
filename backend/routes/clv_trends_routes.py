"""Import-safe shim for CLV trends routes.

This shim provides a very small, import-safe router used during tests so
that the application can include the CLV routes without importing heavy
production dependencies at test-collection time.
"""

from typing import Any, Dict

from fastapi import APIRouter

try:
    from ..core.response_models import ResponseBuilder
except Exception:  # pragma: no cover - fallback for test collection

    class _Fallback:
        @staticmethod
        def success(data: Any = None) -> Dict[str, Any]:
            return {"success": True, "data": data, "error": None}

    ResponseBuilder = _Fallback


router = APIRouter(prefix="/api/clv-trends", tags=["CLV Trends"])


@router.get("/health")
async def health() -> Dict[str, Any]:
    return ResponseBuilder.success({"status": "ok"})


@router.get("/trends/{prop_id}")
async def get_clv_trends_stub(
    prop_id: str, hours_back: int = 24, include_snapshots: bool = True
):
    """Lightweight placeholder for CLV trend endpoint used during tests."""
    payload = {
        "prop_id": prop_id,
        "current_clv": None,
        "snapshots": [] if include_snapshots else None,
        "hours_back": hours_back,
    }
    return ResponseBuilder.success(payload)
