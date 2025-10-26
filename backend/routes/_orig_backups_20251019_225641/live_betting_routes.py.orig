"""
Live Betting API Routes
API endpoints for real-time odds, line movements, and betting opportunities.
Part of Phase 4: Elite Betting Operations and Automation
"""

from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Query, HTTPException

# Contract compliance imports
from ..core.response_models import ResponseBuilder, StandardAPIResponse
from ..core.exceptions import BusinessLogicException, AuthenticationException
from pydantic import BaseModel
import logging

from ..services.live_betting_engine import get_live_betting_engine

logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/api/live-betting", tags=["Live Betting Engine"])

# Response Models
class LiveOddsResponse(BaseModel):
    odds_id: str
    sportsbook: str
    game_id: str
    sport: str
    market_type: str
    selection: str
    odds_american: int
    odds_decimal: float
    line: Optional[float]
    timestamp: str
    is_available: bool

class BettingOpportunityResponse(BaseModel):
    opportunity_id: str
    game_id: str
    market_type: str
    sportsbook: str
    selection: str
    recommended_odds: int
    edge_percentage: float
    confidence_score: float
    max_stake: float
    time_sensitivity: int
    reasoning: str
    created_at: str

class LineMovementResponse(BaseModel):
    movement_id: str
    odds_id: str
    previous_odds: int
    new_odds: int
    direction: str
    movement_amount: float
    timestamp: str
    volume_indicator: float

class LiveGameResponse(BaseModel):
    game_id: str
    sport: str
    home_team: str
    away_team: str
    current_period: str
    time_remaining: str
    home_score: int
    away_score: int
    game_state: str

@router.get("/odds", summary="Get live odds", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_live_odds(
    game_id: Optional[str] = Query(default=None, description="Filter by specific game"),
    sportsbook: Optional[str] = Query(default=None, description="Filter by sportsbook"),
    sport: Optional[str] = Query(default=None, description="Filter by sport")
):
    """Get current live odds from all sportsbooks"""
    try:
        engine = await get_live_betting_engine()
        odds = await engine.get_live_odds(game_id=game_id, sportsbook=sportsbook)
        
        # Filter by sport if specified
        if sport:
            odds = [o for o in odds if o.get('sport') == sport]
        
        return ResponseBuilder.success({
            "total_odds": len(odds),
            "odds": odds,
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Failed to get live odds: {str(e)}")
        raise BusinessLogicException("Failed to get live odds")

@router.get("/opportunities", summary="Get betting opportunities", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_betting_opportunities(
    sport: Optional[str] = Query(default=None, description="Filter by sport"),
    min_edge: float = Query(default=0.0, description="Minimum edge percentage"),
    limit: int = Query(default=50, description="Maximum number of opportunities")
):
    """Get current betting opportunities with positive expected value"""
    try:
        engine = await get_live_betting_engine()
        opportunities = await engine.get_betting_opportunities(sport=sport, min_edge=min_edge)
        
        # Limit results
        opportunities = opportunities[:limit]
        
        return ResponseBuilder.success({
            "total_opportunities": len(opportunities),
            "opportunities": opportunities,
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Failed to get betting opportunities: {str(e)}")
        raise BusinessLogicException("Failed to get betting opportunities")

@router.get("/line-movements", summary="Get line movements", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_line_movements(
    odds_id: Optional[str] = Query(default=None, description="Filter by specific odds ID"),
    hours_back: int = Query(default=24, description="Hours of history to retrieve"),
    limit: int = Query(default=100, description="Maximum number of movements")
):
    """Get line movement history"""
    try:
        engine = await get_live_betting_engine()
        movements = await engine.get_line_movements(odds_id=odds_id, hours_back=hours_back)
        
        # Limit results
        movements = movements[:limit]
        
        return ResponseBuilder.success({
            "total_movements": len(movements),
            "movements": movements,
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Failed to get line movements: {str(e)}")
        raise BusinessLogicException("Failed to get line movements")

@router.get("/games", summary="Get live games", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_live_games(
    sport: Optional[str] = Query(default=None, description="Filter by sport")
):
    """Get current live games"""
    try:
        engine = await get_live_betting_engine()
        games = await engine.get_live_games(sport=sport)
        
        return ResponseBuilder.success({
            "total_games": len(games),
            "games": games,
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Failed to get live games: {str(e)}")
        raise BusinessLogicException("Failed to get live games")

@router.get("/status", summary="Get engine status", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_engine_status():
    """Get live betting engine status and statistics"""
    try:
        engine = await get_live_betting_engine()
        status = await engine.get_engine_status()
        
        return ResponseBuilder.success(status)
        
    except Exception as e:
        logger.error(f"Failed to get engine status: {str(e)}")
        raise BusinessLogicException("Failed to get engine status")

@router.post("/start", summary="Start live betting engine", response_model=StandardAPIResponse[Dict[str, Any]])
async def start_engine():
    """Start the live betting engine (admin only)"""
    try:
        engine = await get_live_betting_engine()
        
        if engine.is_running:
            return ResponseBuilder.success({
                "success": True,
                "message": "Live betting engine is already running",
                "timestamp": datetime.now().isoformat()
            })
        
        # Start engine in background
        import asyncio
        asyncio.create_task(engine.start_engine())
        
        return ResponseBuilder.success({
            "success": True,
            "message": "Live betting engine started",
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Failed to start engine: {str(e)}")
        raise BusinessLogicException("Failed to start live betting engine")

@router.post("/stop", summary="Stop live betting engine", response_model=StandardAPIResponse[Dict[str, Any]])
async def stop_engine():
    """Stop the live betting engine (admin only)"""
    try:
        engine = await get_live_betting_engine()
        await engine.stop_engine()
        
        return ResponseBuilder.success({
            "success": True,
            "message": "Live betting engine stopped",
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Failed to stop engine: {str(e)}")
        raise BusinessLogicException("Failed to stop live betting engine")

@router.get("/best-odds/{game_id}", summary="Get best odds for a game", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_best_odds_for_game(game_id: str):
    """Get the best available odds for a specific game across all sportsbooks"""
    try:
        engine = await get_live_betting_engine()
        all_odds = await engine.get_live_odds(game_id=game_id)
        
        if not all_odds:
            raise BusinessLogicException("No odds found for this game")
        
        # Group by market and selection
        from collections import defaultdict
        market_groups = defaultdict(list)
        
        for odds in all_odds:
            key = f"{odds['market_type']}_{odds['selection']}"
            market_groups[key].append(odds)
        
        # Find best odds for each market
        best_odds = {}
        for market_key, odds_list in market_groups.items():
            # Sort by odds (higher is better for positive odds, closer to 0 for negative)
            best = max(odds_list, key=lambda x: x['odds_american'])
            best_odds[market_key] = best
        
        return ResponseBuilder.success({
            "game_id": game_id,
            "best_odds": best_odds,
            "total_markets": len(best_odds),
            "timestamp": datetime.now().isoformat()
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get best odds for game {game_id}: {str(e)}")
        raise BusinessLogicException("Failed to get best odds")

@router.get("/arbitrage", summary="Get arbitrage opportunities", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_arbitrage_opportunities():
    """Get current arbitrage opportunities across sportsbooks"""
    try:
        engine = await get_live_betting_engine()
        
        # Get all current odds
        all_odds = await engine.get_live_odds()
        
        # Group by game and market type
        from collections import defaultdict
        market_groups = defaultdict(lambda: defaultdict(list))
        
        for odds in all_odds:
            game_id = odds['game_id']
            market_type = odds['market_type']
            market_groups[game_id][market_type].append(odds)
        
        arbitrage_opportunities = []
        
        # Check each market for arbitrage
        for game_id, markets in market_groups.items():
            for market_type, odds_list in markets.items():
                if len(odds_list) >= 2 and market_type in ['moneyline', 'spread']:
                    arb_opp = _check_arbitrage_opportunity(game_id, market_type, odds_list)
                    if arb_opp:
                        arbitrage_opportunities.append(arb_opp)
        
        return ResponseBuilder.success({
            "total_arbitrage_opportunities": len(arbitrage_opportunities),
            "opportunities": arbitrage_opportunities,
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Failed to get arbitrage opportunities: {str(e)}")
        raise BusinessLogicException("Failed to get arbitrage opportunities")

def _check_arbitrage_opportunity(game_id: str, market_type: str, odds_list: List[dict]) -> Optional[dict]:
    """Check if there's an arbitrage opportunity in a market"""
    try:
        if market_type == 'moneyline':
            # For moneyline, we need best odds on both sides
            home_odds = [o for o in odds_list if 'home' in o['selection'].lower() or 'favorite' in o['selection'].lower()]
            away_odds = [o for o in odds_list if 'away' in o['selection'].lower() or 'underdog' in o['selection'].lower()]
            
            if home_odds and away_odds:
                best_home = max(home_odds, key=lambda x: x['odds_american'])
                best_away = max(away_odds, key=lambda x: x['odds_american'])
                
                # Calculate implied probabilities
                home_decimal = best_home['odds_decimal']
                away_decimal = best_away['odds_decimal']
                
                total_implied_prob = (1/home_decimal) + (1/away_decimal)
                
                if total_implied_prob < 1.0:  # Arbitrage exists
                    profit_margin = (1 - total_implied_prob) * 100
                    
                    return ResponseBuilder.success({
                        "game_id": game_id,
                        "market_type": market_type,
                        "profit_margin_percent": round(profit_margin, 2),
                        "home_bet": {
                            "sportsbook": best_home['sportsbook'],
                            "odds": best_home['odds_american'],
                            "selection": best_home['selection']
                        }),
                        "away_bet": {
                            "sportsbook": best_away['sportsbook'],
                            "odds": best_away['odds_american'],
                            "selection": best_away['selection']
                        }
                    }
        
        return None
        
    except Exception as e:
        logger.error(f"Error checking arbitrage opportunity: {str(e)}")
        return None

@router.get("/health", summary="Health check", response_model=StandardAPIResponse[Dict[str, Any]])
async def health_check():
    """Health check for live betting service"""
    try:
        engine = await get_live_betting_engine()
        status = await engine.get_engine_status()
        
        return ResponseBuilder.success({
            "status": "healthy" if status.get('is_running') else "stopped",
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise BusinessLogicException("Service unhealthy")
