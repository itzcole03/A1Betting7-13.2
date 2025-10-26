"""Import-safe minimal unified API router used as a temporary stub during triage.

This file intentionally provides a minimal APIRouter with no heavy runtime
dependencies. It should be replaced with the full implementation once the
codebase is healthy. The goal is to avoid import-time NameError/SyntaxError
that block pytest collection.
"""

from typing import Any, Dict

from fastapi import APIRouter

router = APIRouter(tags=["Unified Intelligence"])


def _fallback_success(data: Any) -> Dict[str, Any]:
    return {"success": True, "data": data, "error": None}


@router.get("/unified/health")
def health() -> Dict[str, Any]:
    return _fallback_success({"status": "ok"})


@router.get("/unified/sample-analysis")
def sample_analysis() -> Dict[str, Any]:
    sample = {
        "analysis": "sample",
        "enriched_props": [{"prop_id": "sample-1", "confidence": 0}],
    }
    return _fallback_success(sample)
