"""
Betting Routes

This module contains all betting-related endpoints including opportunities and arbitrage.
"""

import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status

from backend.models.api_models import (
    ArbitrageOpportunity,
    BettingOpportunity,
    RiskProfileModel,
    RiskProfilesResponse,
)

# Temporarily commenting out corrupted data_fetchers
# from services.data_fetchers import fetch_betting_opportunities_internal

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Betting"])


@router.get("/betting-opportunities", response_model=List[BettingOpportunity])
async def get_betting_opportunities(
    sport: Optional[str] = None, limit: int = 10
) -> List[BettingOpportunity]:
    """Get betting opportunities with optional sport filtering"""
    try:
        opportunities = await fetch_betting_opportunities_internal()

        # Filter by sport if specified
        if sport:
            opportunities = [
                opp for opp in opportunities if opp.sport.lower() == sport.lower()
            ]

        # Apply limit
        opportunities = opportunities[:limit]

        logger.info(f"Returning {len(opportunities)} betting opportunities")
        return opportunities

    except Exception as e:
        logger.error(f"Error fetching betting opportunities: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch betting opportunities",
        )


@router.get("/arbitrage-opportunities", response_model=List[ArbitrageOpportunity])
async def get_arbitrage_opportunities(limit: int = 5) -> List[ArbitrageOpportunity]:
    """Get arbitrage opportunities across different bookmakers"""
    try:
        # Mock implementation - would connect to real arbitrage detection service
        opportunities = [
            ArbitrageOpportunity(
                id="arb_1",
                sport="NBA",
                event="Lakers vs Warriors",
                bookmaker_a="Bet365",
                bookmaker_b="DraftKings",
                odds_a=1.85,
                odds_b=2.15,
                profit_margin=0.05,
                required_stake=100.0,
            ),
            ArbitrageOpportunity(
                id="arb_2",
                sport="NFL",
                event="Patriots vs Bills",
                bookmaker_a="FanDuel",
                bookmaker_b="Caesars",
                odds_a=1.95,
                odds_b=2.05,
                profit_margin=0.03,
                required_stake=150.0,
            ),
        ]

        opportunities = opportunities[:limit]
        logger.info(f"Returning {len(opportunities)} arbitrage opportunities")
        return opportunities

    except Exception as e:
        logger.error(f"Error fetching arbitrage opportunities: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch arbitrage opportunities",
        )


@router.get("/risk-profiles", response_model=RiskProfilesResponse)
async def get_risk_profiles() -> RiskProfilesResponse:
    """Get available risk profiles for betting strategies"""
    try:
        profiles = [
            RiskProfileModel(
                id="conservative",
                max_kelly_fraction=0.05,
                min_win_probability=0.65,
                min_expected_value=0.02,
            ),
            RiskProfileModel(
                id="moderate",
                max_kelly_fraction=0.15,
                min_win_probability=0.55,
                min_expected_value=0.05,
            ),
            RiskProfileModel(
                id="aggressive",
                max_kelly_fraction=0.25,
                min_win_probability=0.45,
                min_expected_value=0.08,
            ),
        ]

        logger.info(f"Returning {len(profiles)} risk profiles")
        return RiskProfilesResponse(profiles=profiles)

    except Exception as e:
        logger.error(f"Error fetching risk profiles: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch risk profiles",
        )
