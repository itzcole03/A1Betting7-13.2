"""
PropFinder API Routes

REST API endpoints for PropFinder dashboard real data integration:
- Real prop opportunities with alert engine integration
- Filtering and searching capabilities
- Live data updates
- PropFinder competitive parity features
"""

import logging
from typing import List, Optional, Dict, Any
from datetime import datetime

from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel, Field

from backend.core.response_models import ResponseBuilder, StandardAPIResponse
from backend.core.exceptions import BusinessLogicException
from backend.services.bookmark_service import BookmarkService, get_bookmark_service
# Temporarily using simple service for Phase 4.1
from backend.services.simple_propfinder_service import (
    get_simple_propfinder_service,
    SimplePropFinderService,
    PropOpportunity
)
try:
    from backend.services.odds_store import create_enhanced_bookmaker_response
except Exception:
    create_enhanced_bookmaker_response = None

logger = logging.getLogger(__name__)

router = APIRouter(tags=["PropFinder"])

# Pydantic models for API

class OpportunityResponse(BaseModel):
    """Single prop opportunity response"""
    id: str
    player: str
    playerImage: Optional[str] = None
    team: str
    teamLogo: Optional[str] = None
    opponent: str
    opponentLogo: Optional[str] = None
    sport: str
    market: str
    line: float
    pick: str
    odds: int
    impliedProbability: float
    aiProbability: float
    edge: float
    confidence: float
    projectedValue: float
    volume: int
    trend: str
    trendStrength: int
    timeToGame: str
    venue: str
    weather: Optional[str] = None
    injuries: List[str] = []
    recentForm: List[float] = []
    matchupHistory: Dict[str, Any] = {}
    lineMovement: Dict[str, Any] = {}
    bookmakers: List[Dict[str, Any]] = []
    isBookmarked: bool = False
    tags: List[str] = []
    socialSentiment: int = 50
    sharpMoney: str = "moderate"
    lastUpdated: str
    alertTriggered: bool = False
    alertSeverity: Optional[str] = None
    
    # Phase 1.2: Best Line Aggregation fields
    bestBookmaker: Optional[str] = None
    lineSpread: float = 0.0
    oddsSpread: int = 0
    numBookmakers: int = 0
    hasArbitrage: bool = False
    arbitrageProfitPct: float = 0.0
    # Fallback bookmaker name fields for historical aggregates
    bestOverBookmakerName: Optional[str] = None
    bestUnderBookmakerName: Optional[str] = None

class OpportunitiesResponse(BaseModel):
    """Multiple prop opportunities response"""
    opportunities: List[OpportunityResponse]
    total: int
    filtered: int
    summary: Dict[str, Any]

class OpportunityFilters(BaseModel):
    """Filters for prop opportunities"""
    sports: Optional[List[str]] = None
    confidence_min: Optional[float] = Field(None, ge=0, le=100)
    confidence_max: Optional[float] = Field(None, ge=0, le=100)
    edge_min: Optional[float] = Field(None, ge=0)
    edge_max: Optional[float] = Field(None, ge=0)
    markets: Optional[List[str]] = None
    venues: Optional[List[str]] = None
    sharp_money: Optional[List[str]] = None
    bookmarked_only: bool = False
    alert_triggered_only: bool = False

class BookmarkRequest(BaseModel):
    """Request model for bookmark operations"""
    prop_id: str = Field(..., description="Prop opportunity ID")
    sport: str = Field(..., max_length=20, description="Sport name")
    player: str = Field(..., max_length=100, description="Player name")
    market: str = Field(..., max_length=50, description="Betting market")
    team: str = Field(..., max_length=50, description="Team name")
    bookmarked: bool = Field(..., description="Bookmark status")

class BookmarkResponse(BaseModel):
    """Response model for bookmark operations"""
    prop_id: str
    bookmarked: bool
    message: str

def _convert_opportunity_to_response(opp: PropOpportunity, is_bookmarked: bool = False) -> OpportunityResponse:
    """Convert PropOpportunity to API response model"""
    # Build enhanced bookmaker data when helper is available
    enhanced_bookmakers = None
    try:
        if create_enhanced_bookmaker_response and opp.bookmakers:
            bookmaker_map = {
                b.name.lower(): {"over": b.odds, "line": b.line}
                for b in opp.bookmakers
            }
            enhanced_bookmakers = create_enhanced_bookmaker_response(bookmaker_map, opp.aiProbability, side='over')
    except Exception as e:
        logger.warning(f"Could not create enhanced bookmaker response for {opp.id}: {e}")

    # Prepare bookmakers field for API (either enhanced dict or simple list)
    if isinstance(enhanced_bookmakers, dict):
        bookmakers_field = enhanced_bookmakers.get('bookmakers', [])
    else:
        bookmakers_field = [
            {
                "name": book.name,
                "odds": book.odds,
                "line": book.line
            }
            for book in opp.bookmakers
        ]

    def _safe_float(val, default=0.0):
        try:
            if val is None:
                return default
            return float(val)
        except Exception:
            return default

    def _safe_int(val, default=0):
        try:
            if val is None:
                return default
            return int(val)
        except Exception:
            return default

    def _safe_bool(val, default=False):
        try:
            if val is None:
                return default
            return bool(val)
        except Exception:
            return default

    return OpportunityResponse(
        id=opp.id,
        player=opp.player,
        playerImage=opp.playerImage,
        team=opp.team,
        teamLogo=opp.teamLogo,
        opponent=opp.opponent,
        opponentLogo=opp.opponentLogo,
        sport=opp.sport.value,
        market=opp.market.value,
        line=opp.line,
        pick=opp.pick.value,
        odds=opp.odds,
        impliedProbability=opp.impliedProbability,
        aiProbability=opp.aiProbability,
        edge=opp.edge,
        confidence=opp.confidence,
        projectedValue=opp.projectedValue,
        volume=opp.volume,
        trend=opp.trend.value,
        trendStrength=opp.trendStrength,
        timeToGame=opp.timeToGame,
        venue=opp.venue.value,
        weather=opp.weather,
        injuries=opp.injuries,
        recentForm=opp.recentForm,
        matchupHistory={
            "games": opp.matchupHistory.games,
            "average": opp.matchupHistory.average,
            "hitRate": opp.matchupHistory.hitRate
        },
        lineMovement={
            "open": opp.lineMovement.open,
            "current": opp.lineMovement.current,
            "direction": opp.lineMovement.direction.value
        },
        # Prefer enhanced bookmaker response when available (provides bestBook, numBookmakers, etc.)
    bookmakers=bookmakers_field,
        isBookmarked=is_bookmarked,  # Use real bookmark status
        tags=opp.tags,
        socialSentiment=opp.socialSentiment,
        sharpMoney=opp.sharpMoney.value,
        lastUpdated=opp.lastUpdated.isoformat(),
        alertTriggered=opp.alertTriggered,
        alertSeverity=opp.alertSeverity,
    # Phase 1.2: Best Line Aggregation fields
    bestBookmaker=(opp.bestBookmaker if getattr(opp, 'bestBookmaker', None) else (enhanced_bookmakers.get('bestBook') if isinstance(enhanced_bookmakers, dict) else None)),
    # Provide textual fallbacks when available
    bestOverBookmakerName=(getattr(opp, 'best_over_bookmaker_name', None) or (enhanced_bookmakers.get('bestOverBook') if isinstance(enhanced_bookmakers, dict) else None)),
    bestUnderBookmakerName=(getattr(opp, 'best_under_bookmaker_name', None) or (enhanced_bookmakers.get('bestUnderBook') if isinstance(enhanced_bookmakers, dict) else None)),
    lineSpread=_safe_float(getattr(opp, 'lineSpread', None) or (enhanced_bookmakers.get('lineSpread') if isinstance(enhanced_bookmakers, dict) else None), 0.0),
    oddsSpread=_safe_int(getattr(opp, 'oddsSpread', None) or (enhanced_bookmakers.get('oddsSpread') if isinstance(enhanced_bookmakers, dict) else None), 0),
    numBookmakers=_safe_int(getattr(opp, 'numBookmakers', None) or (enhanced_bookmakers.get('numBookmakers') if isinstance(enhanced_bookmakers, dict) else None) or (len(bookmakers_field) if isinstance(bookmakers_field, list) else 0), 0),
    hasArbitrage=_safe_bool(getattr(opp, 'hasArbitrage', None) or (enhanced_bookmakers.get('arbitrage') if isinstance(enhanced_bookmakers, dict) else None), False),
    arbitrageProfitPct=_safe_float(getattr(opp, 'arbitrageProfitPct', None) or (enhanced_bookmakers.get('arbitrageProfitPct') if isinstance(enhanced_bookmakers, dict) else None), 0.0)
    )

@router.get("/opportunities", response_model=StandardAPIResponse[OpportunitiesResponse])
async def get_prop_opportunities(
    # Filter parameters
    sports: Optional[str] = Query(None, description="Comma-separated list of sports (NBA,NFL,MLB,NHL)"),
    confidence_min: Optional[float] = Query(None, ge=0, le=100, description="Minimum confidence percentage"),
    confidence_max: Optional[float] = Query(None, ge=0, le=100, description="Maximum confidence percentage"),
    edge_min: Optional[float] = Query(None, ge=0, description="Minimum edge percentage"),
    edge_max: Optional[float] = Query(None, ge=0, description="Maximum edge percentage"),
    markets: Optional[str] = Query(None, description="Comma-separated list of markets"),
    venues: Optional[str] = Query(None, description="Comma-separated list of venues (home,away)"),
    sharp_money: Optional[str] = Query(None, description="Comma-separated sharp money levels (heavy,moderate,light,public)"),
    bookmarked_only: bool = Query(False, description="Show only bookmarked opportunities"),
    alert_triggered_only: bool = Query(False, description="Show only alert-triggered opportunities"),
    
    # User context for bookmarks
    user_id: Optional[str] = Query(None, description="User ID for bookmark status"),
    
    # Pagination and sorting
    limit: int = Query(50, ge=1, le=200, description="Maximum number of opportunities"),
    search: Optional[str] = Query(None, description="Search by player, team, or market"),
    
    # Service dependencies
    data_service: SimplePropFinderService = Depends(get_simple_propfinder_service),
    bookmark_service: BookmarkService = Depends(get_bookmark_service)
):
    """
    Get prop betting opportunities with real data integration
    
    This endpoint provides PropFinder-style prop opportunities with:
    - Real betting data from multiple sources
    - Alert engine integration for high-value opportunities
    - ML confidence scoring and edge calculation
    - Advanced filtering and search capabilities
    """
    try:
        # Parse filter parameters
        sport_filter = sports.split(',') if sports else None
        confidence_range = None
        if confidence_min is not None or confidence_max is not None:
            confidence_range = (
                confidence_min or 0,
                confidence_max or 100
            )
        
        edge_range = None
        if edge_min is not None or edge_max is not None:
            edge_range = (
                edge_min or 0,
                edge_max or 100
            )
        
        # Initialize data service
        await data_service._initialize_services()
        
        # Fetch opportunities
        opportunities = await data_service.get_prop_opportunities(
            sport_filter=sport_filter,
            confidence_range=confidence_range,
            edge_range=edge_range,
            limit=limit
        )
        
        # Get user bookmarks for real bookmark status
        user_bookmarked_prop_ids = set()
        if user_id:
            try:
                user_bookmarked_prop_ids = await bookmark_service.get_user_bookmarked_prop_ids(user_id)
            except Exception as e:
                logger.warning(f"Could not retrieve bookmarks for user {user_id}: {e}")
        
        # Apply additional filters
        if bookmarked_only and user_id:
            # Filter to only bookmarked opportunities
            opportunities = [opp for opp in opportunities if opp.id in user_bookmarked_prop_ids]
        
        if alert_triggered_only:
            opportunities = [opp for opp in opportunities if opp.alertTriggered]
        
        if markets:
            market_filter = [m.strip() for m in markets.split(',')]
            opportunities = [opp for opp in opportunities if opp.market.value in market_filter]
        
        if venues:
            venue_filter = [v.strip() for v in venues.split(',')]
            opportunities = [opp for opp in opportunities if opp.venue.value in venue_filter]
        
        if sharp_money:
            sharp_filter = [s.strip() for s in sharp_money.split(',')]
            opportunities = [opp for opp in opportunities if opp.sharpMoney.value in sharp_filter]
        
        # Apply search filter
        if search:
            search_lower = search.lower()
            opportunities = [
                opp for opp in opportunities
                if (search_lower in opp.player.lower() or
                    search_lower in opp.team.lower() or
                    search_lower in opp.opponent.lower() or
                    search_lower in opp.market.value.lower())
            ]
        
        # Convert to response format with real bookmark status
        opportunity_responses = []
        for opp in opportunities:
            is_bookmarked = opp.id in user_bookmarked_prop_ids if user_id else opp.isBookmarked
            opportunity_responses.append(
                _convert_opportunity_to_response(opp, is_bookmarked)
            )
        
        # Calculate summary statistics
        total_opportunities = len(opportunity_responses)
        avg_confidence = sum(opp.confidence for opp in opportunity_responses) / max(1, total_opportunities)
        max_edge = max((opp.edge for opp in opportunity_responses), default=0)
        alert_count = sum(1 for opp in opportunity_responses if opp.alertTriggered)
        sharp_heavy_count = sum(1 for opp in opportunity_responses if opp.sharpMoney == "heavy")
        
        summary = {
            "total_opportunities": total_opportunities,
            "avg_confidence": round(avg_confidence, 1),
            "max_edge": round(max_edge, 1),
            "alert_triggered_count": alert_count,
            "sharp_heavy_count": sharp_heavy_count,
            "sports_breakdown": {},
            "markets_breakdown": {}
        }
        
        # Sports breakdown
        for opp in opportunity_responses:
            sport = opp.sport
            summary["sports_breakdown"][sport] = summary["sports_breakdown"].get(sport, 0) + 1
        
        # Markets breakdown
        for opp in opportunity_responses:
            market = opp.market
            summary["markets_breakdown"][market] = summary["markets_breakdown"].get(market, 0) + 1
        
        response_data = OpportunitiesResponse(
            opportunities=opportunity_responses,
            total=len(opportunities),
            filtered=total_opportunities,
            summary=summary
        )
        
        logger.info(f"Retrieved {total_opportunities} prop opportunities with filters applied")
        return ResponseBuilder.success(response_data)
        
    except Exception as e:
        logger.error(f"Error fetching prop opportunities: {e}")
        raise BusinessLogicException("Failed to fetch prop opportunities")

@router.get("/opportunities/{opportunity_id}", response_model=StandardAPIResponse[OpportunityResponse])
async def get_prop_opportunity(
    opportunity_id: str,
    user_id: Optional[str] = Query(None, description="User ID for bookmark status"),
    data_service: SimplePropFinderService = Depends(get_simple_propfinder_service),
    bookmark_service: BookmarkService = Depends(get_bookmark_service)
):
    """Get specific prop opportunity by ID"""
    try:
        # Initialize data service
        await data_service._initialize_services()
        
        # Get all opportunities and find the specific one
        opportunities = await data_service.get_prop_opportunities(limit=200)
        
        opportunity = next((opp for opp in opportunities if opp.id == opportunity_id), None)
        if not opportunity:
            raise BusinessLogicException(f"Opportunity not found: {opportunity_id}")
        
        # Check if user has bookmarked this prop
        is_bookmarked = opportunity.isBookmarked  # Default to mock data
        if user_id:
            try:
                is_bookmarked = await bookmark_service.is_prop_bookmarked(user_id, opportunity_id)
            except Exception as e:
                logger.warning(f"Could not check bookmark status for user {user_id}: {e}")
        
        response_data = _convert_opportunity_to_response(opportunity, is_bookmarked)
        
        return ResponseBuilder.success(response_data)
        
    except BusinessLogicException:
        raise
    except Exception as e:
        logger.error(f"Error fetching opportunity {opportunity_id}: {e}")
        raise BusinessLogicException("Failed to fetch opportunity")

@router.get("/markets", response_model=StandardAPIResponse[List[str]])
async def get_available_markets():
    """Get list of available betting markets"""
    try:
        markets = [
            "Points",
            "Assists", 
            "Rebounds",
            "3-Pointers Made",
            "Hits",
            "Home Runs",
            "RBI",
            "Saves",
            "Goals"
        ]
        
        return ResponseBuilder.success(markets)
        
    except Exception as e:
        logger.error(f"Error fetching markets: {e}")
        raise BusinessLogicException("Failed to fetch markets")

@router.get("/sports", response_model=StandardAPIResponse[List[str]])
async def get_available_sports():
    """Get list of available sports"""
    try:
        sports = ["NBA", "NFL", "MLB", "NHL"]
        return ResponseBuilder.success(sports)
        
    except Exception as e:
        logger.error(f"Error fetching sports: {e}")
        raise BusinessLogicException("Failed to fetch sports")

@router.post("/bookmark", response_model=StandardAPIResponse[BookmarkResponse])
async def bookmark_opportunity(
    request: BookmarkRequest,
    user_id: str = Query(..., description="User ID for bookmark operation"),
    bookmark_service: BookmarkService = Depends(get_bookmark_service)
):
    """Bookmark or unbookmark a prop opportunity with real persistence"""
    try:
        if request.bookmarked:
            # Add bookmark
            success = await bookmark_service.bookmark_prop(
                user_id=user_id,
                prop_id=request.prop_id,
                sport=request.sport,
                player=request.player,
                market=request.market,
                team=request.team
            )
            
            if success:
                message = "Opportunity bookmarked successfully"
                logger.info(f"User {user_id} bookmarked prop {request.prop_id}")
            else:
                message = "Opportunity was already bookmarked"
                logger.info(f"Prop {request.prop_id} already bookmarked by user {user_id}")
        else:
            # Remove bookmark
            success = await bookmark_service.unbookmark_prop(
                user_id=user_id,
                prop_id=request.prop_id
            )
            
            if success:
                message = "Bookmark removed successfully"
                logger.info(f"User {user_id} unbookmarked prop {request.prop_id}")
            else:
                message = "Bookmark was not found"
                logger.info(f"No bookmark found for prop {request.prop_id} and user {user_id}")
        
        response_data = BookmarkResponse(
            prop_id=request.prop_id,
            bookmarked=request.bookmarked,
            message=message
        )
        
        return ResponseBuilder.success(response_data)
        
    except ValueError as e:
        logger.warning(f"Invalid bookmark request: {e}")
        raise BusinessLogicException(str(e))
    except Exception as e:
        logger.error(f"Error processing bookmark for prop {request.prop_id}: {e}")
        raise BusinessLogicException("Failed to process bookmark")

@router.get("/bookmarks", response_model=StandardAPIResponse[List[Dict[str, Any]]])
async def get_user_bookmarks(
    user_id: str = Query(..., description="User ID"),
    sport: Optional[str] = Query(None, description="Filter by sport"),
    limit: int = Query(100, ge=1, le=200, description="Maximum number of bookmarks"),
    bookmark_service: BookmarkService = Depends(get_bookmark_service)
):
    """Get user's bookmarked prop opportunities"""
    try:
        bookmarks = await bookmark_service.get_user_bookmarks(
            user_id=user_id,
            sport=sport,
            limit=limit
        )
        
        # Convert to response format
        bookmark_responses = []
        for bookmark in bookmarks:
            bookmark_responses.append({
                "id": bookmark.id,
                "prop_id": bookmark.prop_id,
                "sport": bookmark.sport,
                "player": bookmark.player,
                "market": bookmark.market,
                "team": bookmark.team,
                "created_at": bookmark.created_at.isoformat() if bookmark.created_at else None
            })
        
        logger.info(f"Retrieved {len(bookmark_responses)} bookmarks for user {user_id}")
        return ResponseBuilder.success(bookmark_responses)
        
    except ValueError as e:
        logger.warning(f"Invalid bookmark request for user {user_id}: {e}")
        raise BusinessLogicException(str(e))
    except Exception as e:
        logger.error(f"Error retrieving bookmarks for user {user_id}: {e}")
        raise BusinessLogicException("Failed to retrieve bookmarks")

@router.get("/stats", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_propfinder_stats(
    data_service: SimplePropFinderService = Depends(get_simple_propfinder_service)
):
    """Get PropFinder dashboard statistics"""
    try:
        # Initialize data service
        await data_service._initialize_services()
        
        # Get opportunities for stats calculation
        opportunities = await data_service.get_prop_opportunities(limit=200)
        
        if not opportunities:
            return ResponseBuilder.success({
                "total_opportunities": 0,
                "avg_confidence": 0,
                "max_edge": 0,
                "alert_count": 0,
                "sharp_heavy_count": 0,
                "sports_count": 0,
                "markets_count": 0
            })
        
        opportunity_responses = [_convert_opportunity_to_response(opp) for opp in opportunities]
        
        stats = {
            "total_opportunities": len(opportunity_responses),
            "avg_confidence": round(sum(opp.confidence for opp in opportunity_responses) / len(opportunity_responses), 1),
            "max_edge": round(max(opp.edge for opp in opportunity_responses), 1),
            "alert_count": sum(1 for opp in opportunity_responses if opp.alertTriggered),
            "sharp_heavy_count": sum(1 for opp in opportunity_responses if opp.sharpMoney == "heavy"),
            "sports_count": len(set(opp.sport for opp in opportunity_responses)),
            "markets_count": len(set(opp.market for opp in opportunity_responses)),
            "last_updated": datetime.utcnow().isoformat()
        }
        
        return ResponseBuilder.success(stats)
        
    except Exception as e:
        logger.error(f"Error fetching PropFinder stats: {e}")
        raise BusinessLogicException("Failed to fetch PropFinder stats")