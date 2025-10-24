from typing import Any, Dict, Optional

from fastapi import APIRouter, Query

# Import the consolidated implementations and expose lightweight wrappers
from backend.routes.consolidated_prizepicks import (
    get_prizepicks_props,
    get_prizepicks_recommendations,
    get_comprehensive_projections,
    optimize_lineup,
    get_prizepicks_health,
)

router = APIRouter(prefix="/api/prizepicks", tags=["PrizePicks-Compat"])


@router.get("/props")
async def props_compat(sport: Optional[str] = None, min_confidence: Optional[int] = 70, enhanced: bool = Query(True)) -> Dict[str, Any]:
    # Forward to consolidated implementation (keeps canonical behavior)
    return await get_prizepicks_props(sport=sport, min_confidence=min_confidence, enhanced=enhanced)


@router.get("/recommendations")
async def recommendations_compat(sport: Optional[str] = None, strategy: Optional[str] = "balanced", min_confidence: Optional[int] = 75) -> Any:
    # Tests expect a raw list (legacy shape). Call consolidated function and unwrap the response if it's enveloped.
    resp = await get_prizepicks_recommendations(sport=sport, strategy=strategy, min_confidence=min_confidence)
    # If the response is a dict with 'data', return the data directly; otherwise return as-is.
    if isinstance(resp, dict) and "data" in resp:
        return resp.get("data")
    return resp


@router.get("/comprehensive-projections")
async def comprehensive_projections_compat(sport: Optional[str] = None, league: Optional[str] = None, min_confidence: Optional[int] = 70, include_ml_predictions: bool = True) -> Any:
    resp = await get_comprehensive_projections(sport=sport, league=league, min_confidence=min_confidence, include_ml_predictions=include_ml_predictions)
    if isinstance(resp, dict) and "data" in resp:
        return resp.get("data")
    return resp


@router.post("/lineup/optimize")
async def optimize_lineup_compat(request_data: Dict[str, Any]):
    # Consolidated optimize_lineup raises BusinessLogicException for invalid input; tests expect HTTP 400.
    return await optimize_lineup(request_data)


@router.get("/health")
async def health_compat():
    return await get_prizepicks_health()
