"""Lightweight proxy router to expose the minimal testing shim under an
explicit testing prefix so the frontend can opt-in to the shim in dev by
calling /api/testing/propfinder/opportunities. This keeps the shim code
untouched and avoids changing canonical routing.
"""

from typing import Any, Dict, Optional

from fastapi import APIRouter, Request

router = APIRouter()


# Import the minimal shim handlers. These are thin wrappers that call into
# functions already defined in testing_compat_shims_minimal.py. We import
# lazily inside handlers to keep module import-safe during test collection.


@router.get("/api/testing/propfinder/opportunities")
async def proxy_shim_opportunities(request: Request) -> Dict[str, Any]:
    # Reuse the shim implementation directly to ensure behavior matches
    # what's used by Playwright/global-setup. We forward query params
    # transparently by extracting them from the request.
    try:
        from backend.routes.testing_compat_shims_minimal import (
            shim_propfinder_opportunities,
        )

        # Build kwargs from query params - FastAPI will coerce types for us
        qs = dict(request.query_params)
        return await shim_propfinder_opportunities(**qs)  # type: ignore[arg-type]
    except Exception:
        # Be defensive: if anything goes wrong, return a minimal failure
        return {"success": False, "data": {}, "error": "shim proxy failed"}


@router.get("/api/testing/propfinder/opportunities/{opportunity_id}")
async def proxy_shim_opportunity_detail(
    opportunity_id: str, request: Request
) -> Dict[str, Any]:
    try:
        from backend.routes.testing_compat_shims_minimal import (
            shim_propfinder_opportunity_detail,
        )

        # forward the fields param if present
        fields = request.query_params.get("fields")
        return await shim_propfinder_opportunity_detail(opportunity_id, fields=fields)
    except Exception:
        return {"success": False, "data": {}, "error": "shim proxy failed"}


@router.post("/api/testing/propfinder/seed")
async def proxy_shim_seed(request: Request) -> Dict[str, Any]:
    try:
        from backend.routes.testing_compat_shims_minimal import shim_seed_fixture

        return await shim_seed_fixture(request)
    except Exception:
        return {"success": False, "data": {}, "error": "shim proxy failed"}


@router.get("/api/testing/propfinder/seed_status")
async def proxy_shim_seed_status() -> Dict[str, Any]:
    try:
        from backend.routes.testing_compat_shims_minimal import shim_seed_status

        return await shim_seed_status()
    except Exception:
        return {"success": False, "data": {}, "error": "shim proxy failed"}
