from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Query

from backend.services.mlb_provider_client import MLBProviderClient

router = APIRouter()


@router.get("/mlb/action-shots/{event_id}", response_model=List[Dict[str, Any]])
async def get_action_shots(event_id: str):
    """Get AP Action Shots for a given MLB event."""
    client = MLBProviderClient()
    return await client.fetch_action_shots_ap(event_id)


@router.get("/mlb/country-flag/{country_code}", response_model=Optional[str])
async def get_country_flag(country_code: str):
    """Get country flag image URL by country code."""
    client = MLBProviderClient()
    return await client.fetch_country_flag(country_code)


@router.get("/mlb/odds-comparison/", response_model=List[Dict[str, Any]])
async def get_odds_comparison(
    market_type: str = Query(
        "regular", enum=["futures", "prematch", "regular", "playerprops"]
    )
):
    """Get odds comparison data for MLB by market type."""
    client = MLBProviderClient()
    return await client.fetch_odds_comparison(market_type)


# TODO: Add these routes to your main FastAPI app in main.py or unified_api.py
