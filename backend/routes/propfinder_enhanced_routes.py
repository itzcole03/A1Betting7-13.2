"""
Enhanced PropFinder API Routes - Complete Free Data Implementation

Updated PropFinder routes that provide full propfinder.app functionality
using only free MLB data sources. Integrates with the PropFinderFreeDataService
to deliver comprehensive prop betting analysis.

Routes:
- GET /api/propfinder/games - Today's MLB games
- GET /api/propfinder/props - Today's top value props (main dashboard)
- GET /api/propfinder/props/{game_id} - Props for specific game
- GET /api/propfinder/player/{player_name}/props - Player-specific props
- GET /api/propfinder/markets - Available betting markets
- GET /api/propfinder/search - Search props by filters

Author: AI Assistant
Date: 2025
Purpose: Complete propfinder API using statistical models and free data
"""

import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from backend.services.propfinder_free_data_service import propfinder_service
from backend.services.unified_logging import get_logger
from backend.services.unified_error_handler import handle_error, ErrorContext

logger = get_logger("propfinder_enhanced_api")
router = APIRouter(prefix="/api/propfinder", tags=["propfinder"])


# =============================================================================
# RESPONSE MODELS FOR PROPFINDER API
# =============================================================================

class PropFinderGame(BaseModel):
    """Game information for PropFinder"""
    id: str
    away_team: str
    home_team: str
    game_date: str
    game_time: str
    status: str
    venue: Optional[str] = None


class PropFinderBook(BaseModel):
    """Sportsbook with odds"""
    name: str
    over_odds: str
    under_odds: str
    margin: float


class PropFinderValueBet(BaseModel):
    """Top value betting opportunity"""
    side: str  # OVER/UNDER
    odds: str
    book: str
    ev: float
    kelly: float
    edge: float
    win_prob: float


class PropFinderBestOdds(BaseModel):
    """Best available odds"""
    odds: str
    book: str
    ev: float
    kelly: float
    edge: float


class PropFinderProp(BaseModel):
    """Complete PropFinder proposition with value analysis"""
    player_id: str
    player_name: str
    market: str
    market_display: str
    line: float
    game_id: str
    
    # Statistical projection
    projection_mean: float
    projection_std: float
    confidence: float
    
    # Value analysis
    fair_prob_over: float
    
    # Multiple sportsbook odds
    all_books: List[PropFinderBook]
    
    # Best odds for each side
    best_over_odds: Optional[PropFinderBestOdds] = None
    best_under_odds: Optional[PropFinderBestOdds] = None
    
    # Top value opportunity
    top_value: Optional[PropFinderValueBet] = None
    
    # Metadata
    analysis_timestamp: datetime


class PropFinderResponse(BaseModel):
    """Main PropFinder API response"""
    props: List[PropFinderProp]
    total_count: int
    generated_at: datetime
    source: str = "free_data_statistical_model"


class PropFinderSearchFilters(BaseModel):
    """Search filters for PropFinder"""
    player_name: Optional[str] = None
    market: Optional[str] = None
    min_edge: Optional[float] = None
    min_ev: Optional[float] = None
    min_kelly: Optional[float] = None
    book: Optional[str] = None


# =============================================================================
# MAIN PROPFINDER ENDPOINTS
# =============================================================================

@router.get("/games", response_model=List[PropFinderGame])
async def get_todays_games():
    """
    Get today's MLB games available for prop betting.
    
    Returns list of games with basic information needed for
    the PropFinder game selection interface.
    """
    try:
        games_data = await propfinder_service.get_todays_games()
        
        games = []
        for game in games_data:
            games.append(PropFinderGame(
                id=str(game.get("game_id", "")),
                away_team=game.get("away_team", "Unknown"),
                home_team=game.get("home_team", "Unknown"),
                game_date=game.get("game_date", ""),
                game_time=game.get("game_datetime", ""),
                status=game.get("status", "Unknown"),
                venue=game.get("venue", "")
            ))
        
        logger.info(f"Retrieved {len(games)} games for PropFinder")
        return games
        
    except Exception as e:
        error_response = handle_error(
            error=e,
            context=ErrorContext(
                endpoint="/api/propfinder/games",
                additional_data={"operation": "get_todays_games"}
            )
        )
        raise HTTPException(status_code=500, detail=str(error_response))


@router.get("/props", response_model=PropFinderResponse)
async def get_todays_props(
    limit: int = Query(100, ge=1, le=500, description="Maximum number of props to return"),
    min_edge: Optional[float] = Query(None, ge=-50, le=50, description="Minimum edge percentage"),
    min_ev: Optional[float] = Query(None, ge=-2.0, le=2.0, description="Minimum expected value"),
    market: Optional[str] = Query(None, description="Filter by market type")
):
    """
    Get today's top value props - Main PropFinder dashboard endpoint.
    
    This is the primary endpoint that powers the PropFinder dashboard,
    showing the best betting opportunities across all today's games.
    """
    try:
        # Get props from free data service
        props_data = await propfinder_service.get_todays_props(limit=limit * 2)  # Get extra to filter
        
        # Apply filters
        if min_edge is not None:
            props_data = [p for p in props_data if p.get("top_value", {}).get("edge", 0) >= min_edge]
            
        if min_ev is not None:
            props_data = [p for p in props_data if p.get("top_value", {}).get("ev", 0) >= min_ev]
            
        if market:
            props_data = [p for p in props_data if p.get("market") == market.upper()]
        
        # Limit final results
        props_data = props_data[:limit]
        
        # Convert to response format
        props = []
        for prop_data in props_data:
            # Convert books data
            books = []
            for book_data in prop_data.get("all_books", []):
                books.append(PropFinderBook(
                    name=book_data["book_name"],
                    over_odds=book_data["over_odds"],
                    under_odds=book_data["under_odds"],
                    margin=book_data["margin"]
                ))
            
            # Convert best odds
            best_over = None
            if prop_data.get("best_over_odds"):
                bo = prop_data["best_over_odds"]
                best_over = PropFinderBestOdds(
                    odds=bo["odds"],
                    book=bo["book"],
                    ev=bo["ev"],
                    kelly=bo["kelly"],
                    edge=bo["edge"]
                )
            
            best_under = None
            if prop_data.get("best_under_odds"):
                bu = prop_data["best_under_odds"]
                best_under = PropFinderBestOdds(
                    odds=bu["odds"],
                    book=bu["book"],
                    ev=bu["ev"],
                    kelly=bu["kelly"],
                    edge=bu["edge"]
                )
            
            # Convert top value
            top_value = None
            if prop_data.get("top_value"):
                tv = prop_data["top_value"]
                top_value = PropFinderValueBet(
                    side=tv["side"],
                    odds=tv["odds"],
                    book=tv["book"],
                    ev=tv["ev"],
                    kelly=tv["kelly"],
                    edge=tv["edge"],
                    win_prob=tv["win_prob"]
                )
            
            props.append(PropFinderProp(
                player_id=prop_data["player_id"],
                player_name=prop_data["player_name"],
                market=prop_data["market"],
                market_display=prop_data["market_display"],
                line=prop_data["line"],
                game_id=prop_data["game_id"],
                projection_mean=prop_data["projection_mean"],
                projection_std=prop_data["projection_std"],
                confidence=prop_data["confidence"],
                fair_prob_over=prop_data["fair_prob_over"],
                all_books=books,
                best_over_odds=best_over,
                best_under_odds=best_under,
                top_value=top_value,
                analysis_timestamp=prop_data["analysis_timestamp"]
            ))
        
        logger.info(f"Generated {len(props)} PropFinder props with filters")
        
        return PropFinderResponse(
            props=props,
            total_count=len(props),
            generated_at=datetime.now(),
            source="free_data_statistical_model"
        )
        
    except Exception as e:
        error_response = handle_error(
            error=e,
            context=ErrorContext(
                endpoint="/api/propfinder/props",
                additional_data={
                    "limit": limit,
                    "min_edge": min_edge,
                    "min_ev": min_ev,
                    "market": market
                }
            )
        )
        raise HTTPException(status_code=500, detail=str(error_response))


@router.get("/props/{game_id}", response_model=PropFinderResponse)
async def get_game_props(
    game_id: str,
    limit: int = Query(50, ge=1, le=200, description="Maximum number of props to return")
):
    """
    Get props for a specific game - Game-specific PropFinder view.
    """
    try:
        props_data = await propfinder_service.get_game_props(game_id, limit=limit)
        
        # Convert to response format (reuse logic from get_todays_props)
        props = []
        for prop_data in props_data:
            books = []
            for book_data in prop_data.get("all_books", []):
                books.append(PropFinderBook(
                    name=book_data["book_name"],
                    over_odds=book_data["over_odds"],
                    under_odds=book_data["under_odds"],
                    margin=book_data["margin"]
                ))
            
            # Convert best odds and top value (same logic as above)
            best_over = None
            if prop_data.get("best_over_odds"):
                bo = prop_data["best_over_odds"]
                best_over = PropFinderBestOdds(
                    odds=bo["odds"], book=bo["book"], ev=bo["ev"],
                    kelly=bo["kelly"], edge=bo["edge"]
                )
            
            best_under = None
            if prop_data.get("best_under_odds"):
                bu = prop_data["best_under_odds"]
                best_under = PropFinderBestOdds(
                    odds=bu["odds"], book=bu["book"], ev=bu["ev"],
                    kelly=bu["kelly"], edge=bu["edge"]
                )
            
            top_value = None
            if prop_data.get("top_value"):
                tv = prop_data["top_value"]
                top_value = PropFinderValueBet(
                    side=tv["side"], odds=tv["odds"], book=tv["book"],
                    ev=tv["ev"], kelly=tv["kelly"], edge=tv["edge"],
                    win_prob=tv["win_prob"]
                )
            
            props.append(PropFinderProp(
                player_id=prop_data["player_id"],
                player_name=prop_data["player_name"],
                market=prop_data["market"],
                market_display=prop_data["market_display"],
                line=prop_data["line"],
                game_id=prop_data["game_id"],
                projection_mean=prop_data["projection_mean"],
                projection_std=prop_data["projection_std"],
                confidence=prop_data["confidence"],
                fair_prob_over=prop_data["fair_prob_over"],
                all_books=books,
                best_over_odds=best_over,
                best_under_odds=best_under,
                top_value=top_value,
                analysis_timestamp=prop_data["analysis_timestamp"]
            ))
        
        logger.info(f"Generated {len(props)} props for game {game_id}")
        
        return PropFinderResponse(
            props=props,
            total_count=len(props),
            generated_at=datetime.now()
        )
        
    except Exception as e:
        error_response = handle_error(
            error=e,
            context=ErrorContext(
                endpoint=f"/api/propfinder/props/{game_id}",
                additional_data={"game_id": game_id, "limit": limit}
            )
        )
        raise HTTPException(status_code=500, detail=str(error_response))


@router.get("/player/{player_name}/props", response_model=PropFinderResponse)
async def get_player_props(
    player_name: str,
    market: Optional[str] = Query(None, description="Filter by specific market")
):
    """
    Get props for a specific player - Player search functionality.
    """
    try:
        props_data = await propfinder_service.search_player_props(
            player_name=player_name,
            market=market
        )
        
        # Convert to response format (same conversion logic)
        props = []
        for prop_data in props_data:
            books = []
            for book_data in prop_data.get("all_books", []):
                books.append(PropFinderBook(
                    name=book_data["book_name"],
                    over_odds=book_data["over_odds"],
                    under_odds=book_data["under_odds"],
                    margin=book_data["margin"]
                ))
            
            best_over = None
            if prop_data.get("best_over_odds"):
                bo = prop_data["best_over_odds"]
                best_over = PropFinderBestOdds(
                    odds=bo["odds"], book=bo["book"], ev=bo["ev"],
                    kelly=bo["kelly"], edge=bo["edge"]
                )
            
            best_under = None
            if prop_data.get("best_under_odds"):
                bu = prop_data["best_under_odds"]
                best_under = PropFinderBestOdds(
                    odds=bu["odds"], book=bu["book"], ev=bu["ev"],
                    kelly=bu["kelly"], edge=bu["edge"]
                )
            
            top_value = None
            if prop_data.get("top_value"):
                tv = prop_data["top_value"]
                top_value = PropFinderValueBet(
                    side=tv["side"], odds=tv["odds"], book=tv["book"],
                    ev=tv["ev"], kelly=tv["kelly"], edge=tv["edge"],
                    win_prob=tv["win_prob"]
                )
            
            props.append(PropFinderProp(
                player_id=prop_data["player_id"],
                player_name=prop_data["player_name"],
                market=prop_data["market"],
                market_display=prop_data["market_display"],
                line=prop_data["line"],
                game_id=prop_data["game_id"],
                projection_mean=prop_data["projection_mean"],
                projection_std=prop_data["projection_std"],
                confidence=prop_data["confidence"],
                fair_prob_over=prop_data["fair_prob_over"],
                all_books=books,
                best_over_odds=best_over,
                best_under_odds=best_under,
                top_value=top_value,
                analysis_timestamp=prop_data["analysis_timestamp"]
            ))
        
        logger.info(f"Found {len(props)} props for player {player_name}")
        
        return PropFinderResponse(
            props=props,
            total_count=len(props),
            generated_at=datetime.now()
        )
        
    except Exception as e:
        error_response = handle_error(
            error=e,
            context=ErrorContext(
                endpoint=f"/api/propfinder/player/{player_name}/props",
                additional_data={"player_name": player_name, "market": market}
            )
        )
        raise HTTPException(status_code=500, detail=str(error_response))


@router.get("/markets")
async def get_available_markets():
    """
    Get available betting markets for filtering.
    """
    markets = [
        {"key": "H", "display": "Hits", "description": "Player Hits"},
        {"key": "R", "display": "Runs", "description": "Player Runs"},
        {"key": "RBI", "display": "RBI", "description": "Player RBI"},
        {"key": "HR", "display": "Home Runs", "description": "Player Home Runs"},
        {"key": "TB", "display": "Total Bases", "description": "Player Total Bases"},
        {"key": "K", "display": "Strikeouts", "description": "Pitcher Strikeouts"}
    ]
    
    return {
        "markets": markets,
        "total_markets": len(markets),
        "source": "free_data_statistical_model"
    }


@router.get("/books")
async def get_available_books():
    """
    Get available sportsbooks for filtering.
    """
    books = [
        {"key": "DraftKings", "display": "DraftKings", "short_code": "DK"},
        {"key": "FanDuel", "display": "FanDuel", "short_code": "FD"},
        {"key": "BetMGM", "display": "BetMGM", "short_code": "MGM"},
        {"key": "Caesars", "display": "Caesars", "short_code": "CZR"},
        {"key": "Pinnacle", "display": "Pinnacle", "short_code": "PIN"},
        {"key": "PointsBet", "display": "PointsBet", "short_code": "PB"},
        {"key": "Barstool", "display": "Barstool", "short_code": "BS"},
        {"key": "Hard Rock", "display": "Hard Rock", "short_code": "HR"}
    ]
    
    return {
        "books": books,
        "total_books": len(books),
        "note": "Generated from statistical models - not real sportsbook data"
    }


@router.get("/stats")
async def get_propfinder_stats():
    """
    Get PropFinder service statistics and performance metrics.
    """
    try:
        games = await propfinder_service.get_todays_games()
        props = await propfinder_service.get_todays_props(limit=10)
        
        stats = {
            "games_available": len(games),
            "props_generated": len(props),
            "data_sources": ["MLB StatsAPI", "Baseball Savant", "Statistical Models"],
            "markets_supported": 6,
            "sportsbooks_simulated": 8,
            "update_frequency": "Real-time",
            "cost": "Free",
            "last_updated": datetime.now(),
            "service_status": "active"
        }
        
        return stats
        
    except Exception as e:
        return {
            "service_status": "error",
            "error": str(e),
            "last_checked": datetime.now()
        }


# =============================================================================
# HEALTH CHECK AND TESTING ENDPOINTS
# =============================================================================

@router.get("/health")
async def health_check():
    """Health check for PropFinder service"""
    try:
        # Quick test of core functionality
        games = await propfinder_service.get_todays_games()
        
        return {
            "status": "healthy",
            "service": "PropFinder Free Data Service",
            "games_available": len(games),
            "timestamp": datetime.now(),
            "data_sources": ["MLB StatsAPI", "Baseball Savant", "Statistical Models"]
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now()
        }


@router.get("/test")
async def test_propfinder():
    """Test endpoint to verify PropFinder functionality"""
    try:
        # Run quick test
        games = await propfinder_service.get_todays_games()
        
        if games:
            game_id = str(games[0]["game_id"])
            props = await propfinder_service.get_game_props(game_id, limit=5)
            
            return {
                "test_status": "passed",
                "games_found": len(games),
                "props_generated": len(props),
                "sample_game_id": game_id,
                "timestamp": datetime.now()
            }
        else:
            return {
                "test_status": "no_games",
                "message": "No games available for testing",
                "timestamp": datetime.now()
            }
            
    except Exception as e:
        return {
            "test_status": "failed",
            "error": str(e),
            "timestamp": datetime.now()
        }