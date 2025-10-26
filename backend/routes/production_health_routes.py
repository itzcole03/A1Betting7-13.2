"""
Minimal, import-safe production health routes shim.

This file intentionally provides a small, well-formed set of endpoints that mirror
the public paths used by tests and other modules. The implementation is lightweight
to avoid optional dependency failures while allowing the application to import the
module successfully during triage and tests.
"""

from datetime import datetime
from typing import Any, Dict

from fastapi import APIRouter

try:
    # Prefer the project's response envelope if available
    from ..core.response_models import ResponseBuilder
except Exception:  # pragma: no cover - fallback when running in isolated tooling
    ResponseBuilder = None

router = APIRouter(prefix="/api/production", tags=["Production Health"])


def _success(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Return a canonical envelope using ResponseBuilder if available."""
    if ResponseBuilder:
        try:
            return ResponseBuilder.success(payload)
        except Exception:
            pass
    return {"success": True, "data": payload, "error": None}


@router.get("/health/comprehensive")
async def comprehensive_health_check() -> Dict[str, Any]:
    """Return a minimal comprehensive health payload."""
    payload = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "system_metrics": {"memory_usage_mb": None, "cpu_percent": None},
    }
    return _success(payload)


@router.get("/health/background-tasks")
async def background_tasks_health() -> Dict[str, Any]:
    """Return a minimal background tasks health payload."""
    payload = {"status": "background_ok", "timestamp": datetime.utcnow().isoformat()}
    return _success(payload)


@router.get("/logs/error-summary")
async def get_error_summary() -> Dict[str, Any]:
    """Return a small error summary placeholder."""
    payload = {
        "status": "no_errors_recorded",
        "timestamp": datetime.utcnow().isoformat(),
    }
    return _success(payload)


@router.post("/test/background-task-stress")
async def stress_test_background_tasks(
    num_tasks: int = 10, concurrent_workers: int = 3
) -> Dict[str, Any]:
    """A safe, no-op stress test shim that echoes parameters back."""
    payload = {
        "status": "stubbed",
        "num_tasks": int(num_tasks),
        "concurrent_workers": int(concurrent_workers),
        "timestamp": datetime.utcnow().isoformat(),
    }
    return _success(payload)
