"""Import-safe stub for security_test used during triage.

This file is intentionally a minimal APIRouter and is marked __test__ = False
so pytest won't collect route helpers as tests during triage. Restore the
full implementation from source control when ready.
"""

from fastapi import APIRouter

__test__ = False

router = APIRouter(prefix="/api/security-test", tags=["security-test"])


@router.get("/health")
def health():
    return {
        "success": True,
        "data": {"service": "security_test", "status": "ok"},
        "error": None,
    }


@router.get("/_ping")
def _ping():
    return {"ok": True}


__all__ = ["router"]
