"""
Multiple Sportsbook API Routes

FastAPI routes for accessing unified sportsbook data from DraftKings,
BetMGM, Caesars, and other integrated sportsbooks.

Endpoints:
- GET /api/sportsbook/player-props - Get player props from all sportsbooks
- GET /api/sportsbook/best-odds - Get best odds comparison
- GET /api/sportsbook/arbitrage - Find arbitrage opportunities
- GET /api/sportsbook/performance - Get sportsbook performance metrics
- GET /api/sportsbook/sports - Get available sports
- GET /api/sportsbook/search - Search player props
- WebSocket /ws/sportsbook - Real-time odds updates
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional, Union

from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse

from ..services.unified_sportsbook_service import (
    UnifiedSportsbookService,
    SportsbookProvider,
    UnifiedOdds,
    BestOdds,
    ArbitrageOpportunity,
)
from ..middleware.rate_limit import RateLimiter
from ..middleware.caching import cache_response

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/sportsbook", tags=["sportsbook"])

# Rate limiting
rate_limiter = RateLimiter(requests_per_minute=120)

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        logger.info(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        """Broadcast message to all connected clients"""
        if not self.active_connections:
            return
        
        message_str = json.dumps(message)
        disconnected = []
        
        for connection in self.active_connections:
            try:
                await connection.send_text(message_str)
            except Exception as e:
                logger.error(f"Error sending WebSocket message: {e}")
                disconnected.append(connection)
        
        # Remove disconnected connections
        for connection in disconnected:
            self.disconnect(connection)

connection_manager = ConnectionManager()

# Dependency to get unified sportsbook service
async def get_sportsbook_service():
    """Dependency to provide unified sportsbook service"""
    async with UnifiedSportsbookService() as service:
        yield service

@router.get("/player-props")
@cache_response(expire_time=30)  # Cache for 30 seconds
async def get_player_props(
    sport: str = Query(..., description="Sport name (e.g., 'nba', 'nfl', 'mlb')"),
    player_name: Optional[str] = Query(None, description="Optional player name filter"),
    providers: Optional[List[str]] = Query(None, description="Specific sportsbook providers"),
    service: UnifiedSportsbookService = Depends(get_sportsbook_service),
    _: None = Depends(rate_limiter)
):
    """
    Get player props from all integrated sportsbooks.
    
    Returns unified odds data from DraftKings, BetMGM, Caesars, etc.
    """
    try:
        # Filter providers if specified
        if providers:
            enabled_providers = [
                SportsbookProvider(provider) for provider in providers
                if provider in [p.value for p in SportsbookProvider]
            ]
            service.enabled_providers = enabled_providers

        # Fetch player props
        all_props = await service.get_all_player_props(sport, player_name)
        
        # Convert to JSON-serializable format
        props_data = []
        for prop in all_props:
            props_data.append({
                "provider": prop.provider,
                "eventId": prop.event_id,
                "marketId": prop.market_id,
                "playerName": prop.player_name,
                "team": prop.team,
                "opponent": prop.opponent,
                "league": prop.league,
                "sport": prop.sport,
                "marketType": prop.market_type,
                "betType": prop.bet_type,
                "line": prop.line,
                "odds": prop.odds,
                "decimalOdds": prop.decimal_odds,
                "side": prop.side,
                "timestamp": prop.timestamp.isoformat(),
                "gameTime": prop.game_time.isoformat(),
                "status": prop.status,
                "confidenceScore": prop.confidence_score
            })

        # Broadcast real-time update
        await connection_manager.broadcast({
            "type": "props_update",
            "sport": sport,
            "count": len(props_data),
            "timestamp": datetime.now().isoformat()
        })

        return JSONResponse(content=props_data)

    except Exception as e:
        logger.error(f"Error fetching player props: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching player props: {str(e)}")

@router.get("/best-odds")
@cache_response(expire_time=45)  # Cache for 45 seconds
async def get_best_odds(
    sport: str = Query(..., description="Sport name"),
    player_name: Optional[str] = Query(None, description="Player name filter"),
    bet_type: Optional[str] = Query(None, description="Bet type filter"),
    min_odds: Optional[int] = Query(None, description="Minimum odds filter"),
    max_odds: Optional[int] = Query(None, description="Maximum odds filter"),
    only_arbitrage: bool = Query(False, description="Only show arbitrage opportunities"),
    service: UnifiedSportsbookService = Depends(get_sportsbook_service),
    _: None = Depends(rate_limiter)
):
    """
    Get best odds comparison across all sportsbooks.
    
    Returns the best over/under odds for each player prop with arbitrage detection.
    """
    try:
        # Get all props first
        all_props = await service.get_all_player_props(sport, player_name)
        
        # Apply filters
        filtered_props = all_props
        if bet_type:
            filtered_props = [p for p in filtered_props if p.bet_type.lower() == bet_type.lower()]
        if min_odds:
            filtered_props = [p for p in filtered_props if p.odds >= min_odds]
        if max_odds:
            filtered_props = [p for p in filtered_props if p.odds <= max_odds]

        # Find best odds
        best_odds = service.find_best_odds(filtered_props)
        
        # Filter for arbitrage only if requested
        if only_arbitrage:
            best_odds = [odds for odds in best_odds if odds.arbitrage_opportunity]

        # Convert to JSON-serializable format
        best_odds_data = []
        for odds in best_odds:
            best_odds_data.append({
                "playerName": odds.player_name,
                "betType": odds.bet_type,
                "line": odds.line,
                "bestOverOdds": odds.best_over_odds,
                "bestOverProvider": odds.best_over_provider,
                "bestOverDecimal": odds.best_over_decimal,
                "bestUnderOdds": odds.best_under_odds,
                "bestUnderProvider": odds.best_under_provider,
                "bestUnderDecimal": odds.best_under_decimal,
                "totalBooks": odds.total_books,
                "lineConsensus": odds.line_consensus,
                "sharpMove": odds.sharp_move,
                "arbitrageOpportunity": odds.arbitrage_opportunity,
                "arbitrageProfit": odds.arbitrage_profit,
                "allOdds": [
                    {
                        "provider": prop.provider,
                        "odds": prop.odds,
                        "side": prop.side,
                        "timestamp": prop.timestamp.isoformat()
                    }
                    for prop in odds.all_odds
                ]
            })

        return JSONResponse(content=best_odds_data)

    except Exception as e:
        logger.error(f"Error fetching best odds: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching best odds: {str(e)}")

@router.get("/arbitrage")
@cache_response(expire_time=20)  # Cache for 20 seconds (time-sensitive)
async def get_arbitrage_opportunities(
    sport: str = Query(..., description="Sport name"),
    min_profit: float = Query(2.0, description="Minimum profit percentage"),
    max_results: int = Query(50, description="Maximum number of results"),
    service: UnifiedSportsbookService = Depends(get_sportsbook_service),
    _: None = Depends(rate_limiter)
):
    """
    Find arbitrage opportunities across all sportsbooks.
    
    Returns guaranteed profit opportunities with stake calculations.
    """
    try:
        # Get all props
        all_props = await service.get_all_player_props(sport)
        
        # Find arbitrage opportunities
        arbitrage_ops = service.find_arbitrage_opportunities(all_props, min_profit)
        
        # Limit results
        arbitrage_ops = arbitrage_ops[:max_results]

        # Convert to JSON-serializable format
        arbitrage_data = []
        for arb in arbitrage_ops:
            arbitrage_data.append({
                "playerName": arb.player_name,
                "betType": arb.bet_type,
                "line": arb.line,
                "overOdds": arb.over_odds,
                "overProvider": arb.over_provider,
                "overStakePercentage": arb.over_stake_percentage,
                "underOdds": arb.under_odds,
                "underProvider": arb.under_provider,
                "underStakePercentage": arb.under_stake_percentage,
                "guaranteedProfitPercentage": arb.guaranteed_profit_percentage,
                "minimumBetAmount": arb.minimum_bet_amount,
                "expectedReturn": arb.expected_return,
                "confidenceLevel": arb.confidence_level,
                "timeSensitivity": arb.time_sensitivity
            })

        # Broadcast arbitrage alert
        if arbitrage_data:
            await connection_manager.broadcast({
                "type": "arbitrage_alert",
                "sport": sport,
                "count": len(arbitrage_data),
                "bestProfit": arbitrage_data[0]["guaranteedProfitPercentage"] if arbitrage_data else 0,
                "timestamp": datetime.now().isoformat()
            })

        return JSONResponse(content=arbitrage_data)

    except Exception as e:
        logger.error(f"Error fetching arbitrage opportunities: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching arbitrage opportunities: {str(e)}")

@router.get("/performance")
@cache_response(expire_time=300)  # Cache for 5 minutes
async def get_performance_metrics(
    service: UnifiedSportsbookService = Depends(get_sportsbook_service),
    _: None = Depends(rate_limiter)
):
    """
    Get performance metrics for all sportsbook providers.
    
    Returns reliability scores, response times, and health status.
    """
    try:
        performance_report = service.get_performance_report()
        
        # Convert datetime objects to strings
        for provider_stats in performance_report['providers'].values():
            if provider_stats['last_success']:
                provider_stats['last_success'] = provider_stats['last_success'].isoformat()

        return JSONResponse(content=performance_report)

    except Exception as e:
        logger.error(f"Error fetching performance metrics: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching performance metrics: {str(e)}")

@router.get("/sports")
@cache_response(expire_time=3600)  # Cache for 1 hour
async def get_available_sports(
    service: UnifiedSportsbookService = Depends(get_sportsbook_service),
    _: None = Depends(rate_limiter)
):
    """
    Get list of available sports across all sportsbooks.
    """
    try:
        # This would ideally aggregate from all providers
        # For now, return common sports
        sports = ["nba", "nfl", "mlb", "nhl", "ncaab", "ncaaf", "soccer", "tennis", "golf", "mma"]
        
        return JSONResponse(content=sports)

    except Exception as e:
        logger.error(f"Error fetching available sports: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching available sports: {str(e)}")

@router.get("/search")
async def search_player_props(
    player_name: str = Query(..., description="Player name to search"),
    sport: str = Query(..., description="Sport name"),
    bet_type: Optional[str] = Query(None, description="Bet type filter"),
    service: UnifiedSportsbookService = Depends(get_sportsbook_service),
    _: None = Depends(rate_limiter)
):
    """
    Search for specific player props across all sportsbooks.
    """
    try:
        # Get all props for the sport
        all_props = await service.get_all_player_props(sport, player_name)
        
        # Filter by bet type if specified
        if bet_type:
            all_props = [p for p in all_props if p.bet_type.lower() == bet_type.lower()]

        # Convert to JSON-serializable format
        props_data = []
        for prop in all_props:
            props_data.append({
                "provider": prop.provider,
                "eventId": prop.event_id,
                "playerName": prop.player_name,
                "team": prop.team,
                "opponent": prop.opponent,
                "league": prop.league,
                "sport": prop.sport,
                "betType": prop.bet_type,
                "line": prop.line,
                "odds": prop.odds,
                "side": prop.side,
                "timestamp": prop.timestamp.isoformat(),
                "gameTime": prop.game_time.isoformat()
            })

        return JSONResponse(content=props_data)

    except Exception as e:
        logger.error(f"Error searching player props: {e}")
        raise HTTPException(status_code=500, detail=f"Error searching player props: {str(e)}")

# WebSocket endpoint for real-time updates
@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time sportsbook data updates.
    
    Provides live odds updates, arbitrage alerts, and line movement notifications.
    """
    await connection_manager.connect(websocket)
    
    try:
        # Send initial connection confirmation
        await websocket.send_text(json.dumps({
            "type": "connection_established",
            "message": "Connected to sportsbook data stream",
            "timestamp": datetime.now().isoformat()
        }))
        
        # Keep connection alive and handle incoming messages
        while True:
            try:
                # Wait for messages from client
                data = await websocket.receive_text()
                message = json.loads(data)
                
                # Handle client requests
                if message.get("type") == "subscribe":
                    sport = message.get("sport", "nba")
                    await websocket.send_text(json.dumps({
                        "type": "subscription_confirmed",
                        "sport": sport,
                        "timestamp": datetime.now().isoformat()
                    }))
                
                elif message.get("type") == "ping":
                    await websocket.send_text(json.dumps({
                        "type": "pong",
                        "timestamp": datetime.now().isoformat()
                    }))
                    
            except WebSocketDisconnect:
                break
            except Exception as e:
                logger.error(f"WebSocket error: {e}")
                break
                
    except WebSocketDisconnect:
        pass
    finally:
        connection_manager.disconnect(websocket)

# Background task to periodically check for odds updates
async def odds_monitoring_task():
    """Background task to monitor odds changes and send updates"""
    while True:
        try:
            # This would run periodically to check for significant odds changes
            # and broadcast updates to connected clients
            
            # Sleep for 30 seconds between checks
            await asyncio.sleep(30)
            
            # Broadcast heartbeat
            await connection_manager.broadcast({
                "type": "heartbeat",
                "timestamp": datetime.now().isoformat(),
                "active_connections": len(connection_manager.active_connections)
            })
            
        except Exception as e:
            logger.error(f"Error in odds monitoring task: {e}")
            await asyncio.sleep(60)  # Wait longer on error

# Health check endpoint
@router.get("/health")
async def health_check():
    """Health check for sportsbook integration"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "active_connections": len(connection_manager.active_connections),
        "enabled_providers": [provider.value for provider in SportsbookProvider]
    }
