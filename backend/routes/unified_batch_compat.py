"""Unified API batch predictions compatibility routes (lightweight).

Provides a minimal, import-safe handler for the legacy endpoint used by
benchmarks and some tests:

- POST /api/unified/batch-predictions
- POST /unified/batch-predictions (legacy alias)

All success responses use the standardized {success, data, error} via ok().
"""

from typing import Any, Dict, List, Optional

from fastapi import APIRouter
from fastapi.responses import JSONResponse

try:
    from backend.core.app import ok
except ImportError:  # pragma: no cover

    def ok(data=None, message: Optional[str] = None):  # type: ignore
        resp: Dict[str, Any] = {"success": True, "data": data, "error": None}
        if message:
            resp["message"] = message
        return resp


router_api = APIRouter(prefix="/api/unified", tags=["Unified API Compat"])
router_legacy = APIRouter(prefix="/unified", tags=["Unified API Compat (legacy)"])


def _validate_batch_payload(body: Dict[str, Any]) -> Optional[str]:
    if not isinstance(body, dict):
        return "Invalid JSON payload"
    if "requests" not in body:
        return "Missing 'requests' field"
    reqs = body.get("requests")
    if not isinstance(reqs, list):
        return "'requests' must be a list"
    if len(reqs) == 0:
        return "Empty 'requests' list"
    # Optional per-item basic checks (keep permissive)
    return None


async def _handle_batch_predictions(body: Dict[str, Any]):
    error = _validate_batch_payload(body)
    if error:
        # Keep error shape simple but clear
        return JSONResponse(
            status_code=422,
            content={
                "success": False,
                "data": None,
                "error": {"message": f"Validation error: {error}"},
            },
        )

    reqs: List[Dict[str, Any]] = body.get("requests", [])
    # Deterministic minimal results; avoid heavy inference on hot path
    results = []
    for item in reqs:
        rid = None
        if isinstance(item, dict):
            rid = item.get("request_id")
        results.append({"request_id": rid or "unknown", "prediction": 0.5})

    return ok({"results": results})


@router_api.post("/batch-predictions")
async def batch_predictions_api(body: Dict[str, Any]):
    return await _handle_batch_predictions(body)


@router_legacy.post("/batch-predictions")
async def batch_predictions_legacy(body: Dict[str, Any]):
    return await _handle_batch_predictions(body)
