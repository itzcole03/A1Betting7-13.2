import logging
from typing import Any, Dict, List, Optional

import httpx
from fastapi import APIRouter, HTTPException, Query, status

from backend.exceptions.api_exceptions import BusinessLogicException
from backend.services.trending_suggestions_service import get_trending_suggestions
from backend.utils.response_envelope import ok

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
    try:
        suggestions = get_trending_suggestions(sport=sport, limit=limit)
        return ok(suggestions)
    except Exception as e:
        raise BusinessLogicException(
            detail=f"Failed to fetch trending suggestions: {str(e)}",
            error_code="trending_error",
        )
