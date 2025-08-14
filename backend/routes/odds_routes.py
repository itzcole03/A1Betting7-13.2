"""
Odds Routes - Multi-sportsbook odds comparison and arbitrage detection
Provides real-time odds aggregation and best-line identification
"""

import logging
from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, HTTPException, Depends, Query

# Contract compliance imports
from ..core.response_models import ResponseBuilder, StandardAPIResponse
from ..core.exceptions import BusinessLogicException, AuthenticationException
from pydantic import BaseModel, Field

from backend.services.odds_aggregation_service import (
    get_odds_service,
    OddsAggregationService,
    CanonicalLine,
    ArbitrageOpportunity,
    BookLine
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1/odds", tags=["Odds Aggregation"])

# Pydantic models for API responses
class BookLineModel(BaseModel):
    """Sportsbook line model"""
    book_id: str
    book_name: str
    market: str
    player_name: str
    stat_type: str
    line: float
    over_price: int
    under_price: int
    timestamp: datetime

class CanonicalLineModel(BaseModel):
    """Best available line model"""
    market: str
    player_name: str
    stat_type: str
    best_over_book: str
    best_over_price: int
    best_over_line: float
    best_under_book: str
    best_under_price: int
    best_under_line: float
    no_vig_fair_price: float
    arbitrage_opportunity: bool
    arbitrage_profit: float
    books_count: int

class ArbitrageOpportunityModel(BaseModel):
    """Arbitrage opportunity model"""
    market: str
    player_name: str
    stat_type: str
    over_book: str
    over_price: int
    over_line: float
    under_book: str
    under_price: int
    under_line: float
    profit_percentage: float
    stake_distribution: dict
    timestamp: datetime

class OddsComparisonResponse(BaseModel):
    """Odds comparison response"""
    sport: str
    total_lines: int
    total_books: int
    best_lines: List[CanonicalLineModel]
    arbitrage_count: int
    last_updated: datetime

class ArbitrageResponse(BaseModel):
    """Arbitrage opportunities response"""
    sport: str
    opportunities: List[ArbitrageOpportunityModel]
    total_opportunities: int
    avg_profit: float
    last_updated: datetime

@router.get("/bookmakers", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_available_bookmakers(
    odds_service: OddsAggregationService = Depends(get_odds_service)
):
    """Get list of available sportsbooks for odds comparison"""
    try:
        bookmakers = await odds_service.get_available_books()
        return ResponseBuilder.success({
            "bookmakers": bookmakers,
            "total": len(bookmakers),
            "last_updated": datetime.utcnow().isoformat()
        })
    except Exception as e:
        logger.error(f"Failed to get bookmakers: {e}")
        raise BusinessLogicException("Failed to fetch bookmakers")

@router.get("/compare", response_model=OddsComparisonResponse)
async def compare_odds(
    sport: str = Query("baseball_mlb", description="Sport to compare odds for"),
    limit: int = Query(50, ge=1, le=200, description="Maximum number of lines to return"),
    odds_service: OddsAggregationService = Depends(get_odds_service)
):
    """
    Compare odds across multiple sportsbooks and identify best lines
    
    Returns the best available prices for each player prop market,
    along with arbitrage opportunities and no-vig fair prices.
    """
    try:
        best_lines = await odds_service.find_best_lines(sport)
        
        # Convert to response models and limit results
        limited_lines = best_lines[:limit]
        canonical_models = []
        
        for line in limited_lines:
            model = CanonicalLineModel(
                market=line.market,
                player_name=line.player_name,
                stat_type=line.stat_type,
                best_over_book=line.best_over_book,
                best_over_price=line.best_over_price,
                best_over_line=line.best_over_line,
                best_under_book=line.best_under_book,
                best_under_price=line.best_under_price,
                best_under_line=line.best_under_line,
                no_vig_fair_price=line.no_vig_fair_price,
                arbitrage_opportunity=line.arbitrage_opportunity,
                arbitrage_profit=line.arbitrage_profit,
                books_count=len(line.books)
            )
            canonical_models.append(model)
        
        # Count unique books
        all_books = set()
        for line in best_lines:
            for book_line in line.books:
                all_books.add(book_line.book_id)
        
        arbitrage_count = sum(1 for line in limited_lines if line.arbitrage_opportunity)
        
        return ResponseBuilder.success(OddsComparisonResponse(
            sport=sport,
            total_lines=len(canonical_models)),
            total_books=len(all_books),
            best_lines=canonical_models,
            arbitrage_count=arbitrage_count,
            last_updated=datetime.utcnow()
        )
        
    except Exception as e:
        logger.error(f"Odds comparison error: {e}")
        raise BusinessLogicException("Failed to compare odds")

@router.get("/arbitrage", response_model=ArbitrageResponse)
async def find_arbitrage(
    sport: str = Query("baseball_mlb", description="Sport to find arbitrage for"),
    min_profit: float = Query(1.0, ge=0.1, le=50.0, description="Minimum profit percentage"),
    limit: int = Query(20, ge=1, le=100, description="Maximum number of opportunities"),
    odds_service: OddsAggregationService = Depends(get_odds_service)
):
    """
    Find arbitrage betting opportunities with guaranteed profit
    
    Returns opportunities where betting both sides of a market across
    different sportsbooks guarantees a profit regardless of outcome.
    """
    try:
        opportunities = await odds_service.find_arbitrage_opportunities(sport, min_profit)
        
        # Limit results and convert to response models
        limited_opportunities = opportunities[:limit]
        opportunity_models = []
        
        for opp in limited_opportunities:
            model = ArbitrageOpportunityModel(
                market=opp.market,
                player_name=opp.player_name,
                stat_type=opp.stat_type,
                over_book=opp.over_book,
                over_price=opp.over_price,
                over_line=opp.over_line,
                under_book=opp.under_book,
                under_price=opp.under_price,
                under_line=opp.under_line,
                profit_percentage=opp.profit_percentage,
                stake_distribution=opp.stake_distribution,
                timestamp=opp.timestamp
            )
            opportunity_models.append(model)
        
        # Calculate average profit
        avg_profit = sum(opp.profit_percentage for opp in limited_opportunities) / len(limited_opportunities) if limited_opportunities else 0.0
        
        return ResponseBuilder.success(ArbitrageResponse(
            sport=sport,
            opportunities=opportunity_models,
            total_opportunities=len(opportunity_models)),
            avg_profit=round(avg_profit, 2),
            last_updated=datetime.utcnow()
        )
        
    except Exception as e:
        logger.error(f"Arbitrage detection error: {e}")
        raise BusinessLogicException("Failed to find arbitrage opportunities")

@router.get("/player/{player_name}", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_player_odds(
    player_name: str,
    sport: str = Query("baseball_mlb", description="Sport to search"),
    odds_service: OddsAggregationService = Depends(get_odds_service)
):
    """Get all available odds for a specific player across all sportsbooks"""
    try:
        all_lines = await odds_service.fetch_player_props(sport)
        
        # Filter for specific player
        player_lines = [
            line for line in all_lines 
            if player_name.lower() in line.player_name.lower()
        ]
        
        if not player_lines:
            raise BusinessLogicException("f"No odds found for player: {player_name}")
        
        # Group by stat type
        grouped_lines = {}
        for line in player_lines:
            if line.stat_type not in grouped_lines:
                grouped_lines[line.stat_type] = []
            grouped_lines[line.stat_type].append({
                "book_name": line.book_name,
                "line": line.line,
                "over_price": line.over_price,
                "under_price": line.under_price,
                "timestamp": line.timestamp.isoformat()
            })
        
        return ResponseBuilder.success({
            "player_name": player_name,
            "sport": sport,
            "markets": grouped_lines,
            "total_lines": len(player_lines),
            "last_updated": datetime.utcnow().isoformat()
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Player odds lookup error: {e}")
        raise BusinessLogicException("Failed to get player odds")

@router.get("/health", response_model=StandardAPIResponse[Dict[str, Any]])
async def odds_health_check(
    odds_service: OddsAggregationService = Depends(get_odds_service)
):
    """Check odds service health and API availability"""
    try:
        bookmakers = await odds_service.get_available_books()
        has_api_key = bool(odds_service.api_key)
        
        return ResponseBuilder.success({
            "status": "healthy",
            "api_configured": has_api_key,
            "available_books": len(bookmakers),
            "cache_size": len(odds_service.odds_cache),
            "timestamp": datetime.utcnow().isoformat()
        })
    except Exception as e:
        logger.error(f"Odds health check failed: {e}")
        return ResponseBuilder.success({
            "status": "degraded",
            "api_configured": False,
            "available_books": 0,
            "cache_size": 0,
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        })
