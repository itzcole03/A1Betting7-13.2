"""
Temporary PrizePicks Props API Fix
This provides a working endpoint while we debug the main data fetchers
"""

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List

logger = logging.getLogger(__name__)


async def fetch_current_prizepicks_props_with_ensemble_temp() -> List[Dict[str, Any]]:
    """
    Temporary implementation that returns mock data to unblock frontend development
    while we fix the hanging data fetchers
    """
    logger.info("🔧 Using temporary props implementation")

    # Generate realistic mock data
    mock_props = [
        {
            "id": "prop_001",
            "player_name": "Shohei Ohtani",
            "team": "LAD",
            "position": "DH/P",
            "league": "MLB",
            "sport": "MLB",
            "stat_type": "Hits",
            "line_score": 1.5,
            "over_odds": -115,
            "under_odds": -105,
            "ensemble_prediction": "over",
            "ensemble_confidence": 78.5,
            "win_probability": 0.785,
            "expected_value": 0.12,
            "risk_score": 0.22,
            "recommendation": "STRONG BUY",
            "source": "Mock Data - Development",
            "last_updated": datetime.now(timezone.utc).isoformat(),
            "ai_explanation": "Historical performance and current form suggest strong over potential",
        },
        {
            "id": "prop_002",
            "player_name": "Aaron Judge",
            "team": "NYY",
            "position": "OF",
            "league": "MLB",
            "sport": "MLB",
            "stat_type": "Home Runs",
            "line_score": 0.5,
            "over_odds": +120,
            "under_odds": -150,
            "ensemble_prediction": "over",
            "ensemble_confidence": 82.1,
            "win_probability": 0.821,
            "expected_value": 0.18,
            "risk_score": 0.15,
            "recommendation": "BUY",
            "source": "Mock Data - Development",
            "last_updated": datetime.now(timezone.utc).isoformat(),
            "ai_explanation": "Power metrics and matchup analysis favor home run potential",
        },
        {
            "id": "prop_003",
            "player_name": "A'ja Wilson",
            "team": "LVA",
            "position": "F",
            "league": "WNBA",
            "sport": "WNBA",
            "stat_type": "Points",
            "line_score": 22.5,
            "over_odds": -110,
            "under_odds": -110,
            "ensemble_prediction": "over",
            "ensemble_confidence": 72.3,
            "win_probability": 0.723,
            "expected_value": 0.08,
            "risk_score": 0.28,
            "recommendation": "MODERATE BUY",
            "source": "Mock Data - Development",
            "last_updated": datetime.now(timezone.utc).isoformat(),
            "ai_explanation": "Recent scoring trends and matchup advantages support over bet",
        },
        {
            "id": "prop_004",
            "player_name": "Breanna Stewart",
            "team": "NYL",
            "position": "F",
            "league": "WNBA",
            "sport": "WNBA",
            "stat_type": "Rebounds",
            "line_score": 8.5,
            "over_odds": -105,
            "under_odds": -115,
            "ensemble_prediction": "under",
            "ensemble_confidence": 69.8,
            "win_probability": 0.698,
            "expected_value": 0.05,
            "risk_score": 0.32,
            "recommendation": "HOLD",
            "source": "Mock Data - Development",
            "last_updated": datetime.now(timezone.utc).isoformat(),
            "ai_explanation": "Opponent rebounding defense creates challenging environment",
        },
        {
            "id": "prop_005",
            "player_name": "Carlos Vela",
            "team": "LAFC",
            "position": "F",
            "league": "MLS",
            "sport": "MLS",
            "stat_type": "Shots on Goal",
            "line_score": 2.5,
            "over_odds": +100,
            "under_odds": -120,
            "ensemble_prediction": "over",
            "ensemble_confidence": 75.6,
            "win_probability": 0.756,
            "expected_value": 0.11,
            "risk_score": 0.25,
            "recommendation": "BUY",
            "source": "Mock Data - Development",
            "last_updated": datetime.now(timezone.utc).isoformat(),
            "ai_explanation": "Home field advantage and opponent defensive weaknesses favor shots",
        },
    ]

    logger.info(f"✅ Generated {len(mock_props)} mock props for frontend testing")
    return mock_props


async def generate_optimal_betting_lineup_temp(
    lineup_size: int = 6,
) -> List[Dict[str, Any]]:
    """
    Temporary lineup generator
    """
    logger.info("🔧 Using temporary lineup generator")

    props = await fetch_current_prizepicks_props_with_ensemble_temp()

    # Sort by expected value and confidence
    sorted_props = sorted(
        props, key=lambda x: x["expected_value"] * x["win_probability"], reverse=True
    )

    # Take top props for lineup
    lineup = sorted_props[:lineup_size]

    total_expected_value = sum(prop["expected_value"] for prop in lineup)
    avg_confidence = sum(prop["ensemble_confidence"] for prop in lineup) / len(lineup)

    return {
        "lineup": lineup,
        "total_expected_value": total_expected_value,
        "average_confidence": avg_confidence,
        "lineup_size": len(lineup),
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "note": "Temporary implementation for development",
    }
