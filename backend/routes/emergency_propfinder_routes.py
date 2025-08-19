"""
Emergency PropFinder Bypass - Ultra-Fast Mock Response

This provides an emergency bypass for the PropFinder props endpoint that's hanging.
Returns realistic-looking mock data in <100ms to demonstrate the performance potential.
"""

import logging
from typing import Dict, List, Any
from fastapi import APIRouter, HTTPException
from datetime import datetime

logger = logging.getLogger(__name__)

# Create router
emergency_propfinder_router = APIRouter(
    prefix="/api/emergency",
    tags=["emergency-propfinder"]
)

@emergency_propfinder_router.get("/propfinder/props/{game_id}")
async def get_emergency_props(game_id: int) -> Dict[str, Any]:
    """
    Emergency ultra-fast PropFinder props endpoint.
    
    Returns mock data in <100ms to demonstrate performance potential.
    Use this while fixing the main PropFinder service.
    """
    try:
        # Generate mock props instantly
        mock_props = [
            {
                "id": f"prop_{i}",
                "player_name": f"Player {i}",
                "market": "PLAYER_HITS",
                "line": 1.5,
                "over_odds": -110,
                "under_odds": -110,
                "book": "DraftKings",
                "ev": round((i % 10) / 100, 3),
                "kelly": round((i % 5) / 100, 3),
                "edge": round((i % 15) / 10, 1),
                "confidence": 0.75
            }
            for i in range(1, 21)  # 20 mock props
        ]
        
        return {
            "success": True,
            "data": {
                "game_id": game_id,
                "props": mock_props,
                "total_props": len(mock_props),
                "performance": {
                    "response_time_ms": "<100",
                    "cache_status": "mock_data",
                    "optimization_level": "emergency_bypass"
                },
                "metadata": {
                    "generated_at": datetime.utcnow().isoformat(),
                    "version": "emergency_v1.0",
                    "note": "This is mock data for performance testing"
                }
            }
        }
        
    except Exception as e:
        logger.error(f"Emergency PropFinder error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Emergency PropFinder failed: {str(e)}"
        )

@emergency_propfinder_router.get("/propfinder/games")
async def get_emergency_games() -> Dict[str, Any]:
    """
    Emergency ultra-fast games endpoint.
    Returns mock game data instantly.
    """
    try:
        mock_games = [
            {
                "game_id": 776681,
                "away_team": "Team A",
                "home_team": "Team B", 
                "game_time": "2025-08-19T19:00:00Z",
                "status": "scheduled",
                "prop_count": 20
            },
            {
                "game_id": 776682,
                "away_team": "Team C",
                "home_team": "Team D",
                "game_time": "2025-08-19T20:00:00Z", 
                "status": "scheduled",
                "prop_count": 18
            }
        ]
        
        return {
            "success": True,
            "data": {
                "games": mock_games,
                "total_games": len(mock_games),
                "performance": {
                    "response_time_ms": "<50",
                    "cache_status": "mock_data"
                }
            }
        }
        
    except Exception as e:
        logger.error(f"Emergency games error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Emergency games failed: {str(e)}"
        )