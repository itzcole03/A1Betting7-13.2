import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query, status

from backend.core.exceptions import BusinessLogicException
from backend.services.trending_suggestions_service import get_trending_suggestions
from backend.utils.response_envelope import ok

# Avoid making HTTP calls at import time; lazy-import httpx inside functions


router = APIRouter(tags=["Trending Suggestions"])


@router.get("/trending-suggestions", response_model=Dict[str, Any], tags=["Trending"])
def trending_suggestions(
    sport: str = Query(..., description="Sport name (e.g. MLB, NBA)"),
    limit: int = Query(10, description="Max number of suggestions"),
) -> Dict[str, Any]:
    """
    Return trending prop suggestions for a sport.
    Returns standardized response contract.
    Example success:
        {"success": True, "data": [...], "error": None}
    Example error:
        {"success": False, "data": None, "error": {"code": "trending_error", "message": "..."}}
    """
    # Lazy import httpx (safe for tests)
    try:
        import httpx
    except Exception:
        httpx = None

    try:
        suggestions = get_trending_suggestions(sport=sport, limit=limit)
        # Ensure we always return the standardized envelope
        return ok(suggestions)
    except Exception as e:
        # Convert to BusinessLogicException so the test-local exception handler
        # will serialize a consistent error envelope with success=False
        raise BusinessLogicException(
            message=f"Failed to fetch trending suggestions: {str(e)}",
            error_code="trending_error",
        )
