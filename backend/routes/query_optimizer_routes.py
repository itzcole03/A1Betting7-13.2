"""
Query Optimizer Observability Routes

Exposes performance reports and recent slow queries from the in-process query optimizer.
Follows the repository envelope contract using ok()/fail().
"""

from typing import Any, Dict, Optional

from fastapi import APIRouter, Body, status

from backend.core.app import fail, ok, register_feature_routers
from backend.services.query_optimizer import query_optimizer

router = APIRouter(prefix="/api/observability/query-optimizer", tags=["Observability"])


@router.get("/report")
async def get_query_optimizer_report():
    try:
        report = query_optimizer.get_performance_report()
        return ok(report)
    except Exception as e:
        return fail("OPTIMIZER_REPORT_ERROR", f"Failed to get optimizer report: {e}")


@router.get("/slow-queries")
async def get_query_optimizer_slow_queries():
    try:
        slow = query_optimizer.get_slow_queries()
        return ok(slow)
    except Exception as e:
        return fail("OPTIMIZER_SLOW_QUERIES_ERROR", f"Failed to get slow queries: {e}")


@router.post("/flags")
async def update_optimizer_flags(payload: Dict[str, Any] = Body(...)):
    """
    Update conservative optimizer flags at runtime. All fields optional.

    Payload example:
    {
      "enable_safe_query_pagination": true,
      "default_select_limit": 500
    }
    """
    try:
        settings = query_optimizer.settings
        perf = settings.performance

        updates: Dict[str, Any] = {}

        if "enable_safe_query_pagination" in payload:
            val = bool(payload.get("enable_safe_query_pagination"))
            perf.enable_safe_query_pagination = val
            updates["enable_safe_query_pagination"] = val

        if "default_select_limit" in payload:
            # clamp to reasonable bounds mirroring Settings constraints
            try:
                raw = int(payload.get("default_select_limit"))
            except Exception:
                return fail("INVALID_FLAG", "default_select_limit must be an integer")
            clamped = max(1, min(raw, 100000))
            perf.default_select_limit = clamped
            updates["default_select_limit"] = clamped

        return ok({"updated": updates})
    except Exception as e:
        return fail("OPTIMIZER_FLAGS_ERROR", f"Failed to update flags: {e}")


# Registration hook consumed by register_feature_routers() pattern


def register(router_registry):
    router_registry.include_router(router)


# Allow create_app() flows that rely on this pattern to discover/register
register_feature_routers.register = register
