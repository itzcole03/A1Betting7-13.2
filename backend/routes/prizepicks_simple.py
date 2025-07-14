"""
Minimal Working PrizePicks API - Phase 1 Fix
Simple, fast endpoint that doesn't hang to get frontend working immediately
"""

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException

logger = logging.getLogger(__name__)

# router = APIRouter(prefix="/api/prizepicks", tags=["PrizePicks-Simple"])


# @router.get("/props")
async def get_simple_prizepicks_props(
    sport: Optional[str] = None,
    min_confidence: Optional[int] = 70,
) -> List[Dict[str, Any]]:
    """
    Simple PrizePicks props endpoint that returns immediately
    This is a Phase 1 fix to unblock frontend development
    """
    logger.info("🔧 Using simple props endpoint - Phase 1 fix")

    # Quick mock data that returns immediately
    props = [
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
            "source": "Phase 1 Quick Fix",
            "last_updated": datetime.now(timezone.utc).isoformat(),
            "ai_explanation": "Historical performance suggests strong over potential",
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
            "source": "Phase 1 Quick Fix",
            "last_updated": datetime.now(timezone.utc).isoformat(),
            "ai_explanation": "Power metrics favor home run potential",
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
            "source": "Phase 1 Quick Fix",
            "last_updated": datetime.now(timezone.utc).isoformat(),
            "ai_explanation": "Recent scoring trends support over bet",
        },
    ]

    # Apply filters
    if sport:
        props = [p for p in props if p.get("sport", "").lower() == sport.lower()]

    if min_confidence:
        props = [p for p in props if p.get("ensemble_confidence", 0) >= min_confidence]

    logger.info(f"✅ Returning {len(props)} props (Phase 1 fix)")
    return props


# @router.get("/recommendations")
async def get_simple_recommendations() -> List[Dict[str, Any]]:
    """Simple recommendations endpoint"""
    return [
        {
            "id": "rec_1",
            "type": "high_confidence",
            "title": "Strong MLB Plays Today",
            "description": "3 high-confidence MLB player props",
            "confidence": 85,
            "expected_return": 0.15,
            "props_count": 3,
        }
    ]


# @router.get("/status")
async def get_simple_status() -> Dict[str, Any]:
    """Simple status endpoint"""
    return {
        "status": "healthy",
        "mode": "Phase 1 Development Fix",
        "props_available": 3,
        "last_update": datetime.now(timezone.utc).isoformat(),
        "note": "Using quick mock data for frontend development",
    }
