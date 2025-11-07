from typing import Any, Dict, Optional

from fastapi import APIRouter, Body
from fastapi.responses import JSONResponse

router = APIRouter()

# In-memory seed store (process-local). Intended for CI/local test use only.
_SEED_DATA: Dict[str, Any] = {}


@router.post("/internal/test/seed")
async def seed_test_data(payload: Dict[str, Any] = Body(...)) -> JSONResponse:
    """Seed in-memory test data used by lightweight compatibility endpoints.

    This endpoint is guarded by the `ENABLE_TEST_ROUTES` env var (router only
    included when enabled). It accepts JSON of shape {"props": [...], "predictions": [...]}.
    """
    global _SEED_DATA
    try:
        # Store the provided payload as-is; compatibility endpoints will check
        # for seeded data and return it when present.
        _SEED_DATA = (
            payload.copy() if isinstance(payload, dict) else {"payload": payload}
        )
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": "seeded",
                "data": {"keys": list(_SEED_DATA.keys())},
            },
        )
    except Exception as e:
        return JSONResponse(
            status_code=500, content={"success": False, "error": str(e)}
        )


@router.get("/internal/test/status")
async def test_status() -> JSONResponse:
    return JSONResponse(
        status_code=200,
        content={
            "success": True,
            "seeded": bool(_SEED_DATA),
            "keys": list(_SEED_DATA.keys()),
        },
    )


@router.get("/api/props")
async def seeded_props() -> JSONResponse:
    """Compatibility props endpoint: return seeded props when available else default sample."""
    try:
        if _SEED_DATA and isinstance(_SEED_DATA.get("props"), list):
            return JSONResponse(
                status_code=200,
                content={"success": True, "data": _SEED_DATA.get("props")},
            )
    except Exception:
        pass
    # Fallback deterministic sample
    sample = [{"player": "Sample Player", "stat_type": "points", "confidence": 50}]
    return JSONResponse(status_code=200, content={"success": True, "data": sample})


@router.get("/api/predictions")
async def seeded_predictions() -> JSONResponse:
    try:
        if _SEED_DATA and isinstance(_SEED_DATA.get("predictions"), list):
            return JSONResponse(
                status_code=200,
                content={"success": True, "data": _SEED_DATA.get("predictions")},
            )
    except Exception:
        pass
    sample = [{"player": "Sample Player", "confidence": 50, "source": "sample"}]
    return JSONResponse(status_code=200, content={"success": True, "data": sample})
