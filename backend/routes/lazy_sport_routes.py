"""Minimal shim for lazy_sport_routes.

Exports a router to satisfy imports in tests.
"""

from typing import Any, Dict

from fastapi import APIRouter

router = APIRouter(prefix="/api/sports", tags=["Lazy Sport"])


@router.get("/list")
async def list_sports() -> Dict[str, Any]:
    return {"success": True, "data": []}


"""Lazy Sport API Routes for A1Betting Backend.

Provides endpoints for managing sport-specific services and models on demand.
This module is defensive: manager methods may be sync or async, so we use
an await helper to support both.
"""
from typing import Any, Dict, Optional

from fastapi import APIRouter, HTTPException

from backend.core.exceptions import BusinessLogicException

from ..core.exceptions import BusinessLogicException
from ..core.response_models import ResponseBuilder, StandardAPIResponse
