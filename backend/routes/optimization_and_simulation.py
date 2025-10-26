"""Import-safe stub for optimization_and_simulation used during triage.
Full implementation should be restored later.
"""

from fastapi import APIRouter

router = APIRouter(
    prefix="/api/optimization_and_simulation", tags=["optimization_and_simulation"]
)


@router.get("/health")
def health():
    return {
        "success": True,
        "data": {"status": "ok", "service": "optimization_and_simulation"},
        "error": None,
    }


@router.get("/_ping")
def ping():
    return {"ok": True}


__all__ = ["router"]
