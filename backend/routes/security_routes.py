"""
Import-safe security routes shim.

Provides a minimal router with basic endpoints used by tests and other
modules. The original file had many syntax issues; this stub preserves the
public `router` symbol and simple handlers.
"""

from typing import Any, Dict

from fastapi import APIRouter

try:
    from backend.core.app import ok
except Exception:

    def ok(payload: Dict[str, Any]) -> Dict[str, Any]:
        return {"success": True, "data": payload, "error": None}


router = APIRouter(prefix="/api/security", tags=["Security"])


@router.get("/health")
def security_health() -> Dict[str, Any]:
    return ok({"status": "ok"})


@router.post("/logout")
def logout() -> Dict[str, Any]:
    return ok({"message": "logged out"})
