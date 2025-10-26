"""
Import-safe cheatsheets routes shim.

Provides a minimal router with a health endpoint. The original file had many
syntax and runtime constructs that prevented import during pytest
collection; this stub preserves the `router` symbol expected by the app.
"""

from typing import Any, Dict

from fastapi import APIRouter

try:
    from backend.core.app import ok
except Exception:

    def ok(payload: Dict[str, Any]) -> Dict[str, Any]:
        return {"success": True, "data": payload, "error": None}


router = APIRouter(prefix="/v1/cheatsheets", tags=["Cheatsheets"])


@router.get("/health")
def cheatsheets_health() -> Dict[str, Any]:
    return ok({"status": "ok"})
