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
from dataclasses import dataclass
import time
import asyncio

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
# EV Engine integration
from backend.services.ev_engine import ev_engine
from backend.services.ev_engine import compute_ev_details
try:
    from backend.services.odds_store import create_enhanced_bookmaker_response
except Exception:
    create_enhanced_bookmaker_response = None

# CLV persistence service import
try:
    from backend.services.clv_persistence_service import clv_persistence_service
except ImportError:
    clv_persistence_service = None

logger = logging.getLogger(__name__)

router = APIRouter(tags=["PropFinder"])


@dataclass
class CLVRuntimeStatus:
    last_requested: float | None = None
    last_enabled_flag: bool = False
    last_success: bool = False
    last_include_param: bool = False
    last_returned_with_clv: bool = False
    last_opportunity_count: int = 0
    last_error: str | None = None

clv_runtime_status = CLVRuntimeStatus()


def _build_opportunities_payload(opportunity_dicts, total, filtered, summary):
    """Helper function to build consistent opportunities response payload"""
    return {
        "opportunities": opportunity_dicts,
        "total": total,
        "filtered": filtered,
        "summary": summary
    }


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
    # Phase 4.2: EV Engine Integration fields
    evValue: Optional[float] = None
    evPercent: Optional[float] = None
    evTier: Optional[str] = None
    isOutlier: Optional[bool] = None
    # EV details (optional, non-breaking)
    edge_pct: Optional[float] = None
    fair_american_odds: Optional[int] = None
    implied_prob_market: Optional[float] = None
    implied_prob_fair: Optional[float] = None
    expected_value_per_100: Optional[float] = None
    # Phase 4.3: Line Movement Tracking fields
    openingLine: Optional[float] = None
    openingOdds: Optional[int] = None
    latestLine: Optional[float] = None
    latestOdds: Optional[int] = None
    lineChange: Optional[float] = None
    oddsChange: Optional[int] = None
    movementDirection: Optional[str] = None
    # Phase 4.4: CLV (Closing Line Value) Tracking fields
    clvPercent: Optional[float] = None
    closingLine: Optional[float] = None
    closingOdds: Optional[int] = None
    clv_metrics: Optional[Dict[str, Any]] = None  # CLV metrics object for test compatibility

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

def _convert_opportunity_to_response(opp: PropOpportunity, is_bookmarked: bool = False, include_clv: bool = False):
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
        bookmakers_field = []
        for book in getattr(opp, 'bookmakers', []) or []:
            try:
                # Dataclass / object with attributes
                if hasattr(book, 'name') and hasattr(book, 'odds') and hasattr(book, 'line'):
                    bookmakers_field.append({
                        'name': str(book.name),
                        'odds': int(book.odds),
                        'line': float(book.line)
                    })
                # Dict-like
                elif isinstance(book, dict):
                    bookmakers_field.append({
                        'name': str(book.get('name') or book.get('display_name') or ''),
                        'odds': int(book.get('odds') or 0),
                        'line': float(book.get('line') or 0.0)
                    })
                else:
                    # Fallback: try to coerce from string representation
                    s = str(book)
                    bookmakers_field.append({'name': s, 'odds': 0, 'line': 0.0})
            except Exception:
                # Best-effort fallback
                try:
                    bookmakers_field.append({'name': str(book), 'odds': 0, 'line': 0.0})
                except Exception:
                    continue

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

    # Normalize pick to lowercase string safely
    _pick_val = None
    if getattr(opp, 'pick', None) is not None:
        try:
            _pick_val = opp.pick.value.lower() if hasattr(opp.pick, 'value') else str(opp.pick).lower()
        except Exception:
            _pick_val = str(getattr(opp, 'pick', '')).lower()

    response_dict = {
        "id": opp.id,
        "player": opp.player,
        "playerImage": opp.playerImage,
        "team": opp.team,
        "teamLogo": opp.teamLogo,
        "opponent": opp.opponent,
        "opponentLogo": opp.opponentLogo,
        "sport": opp.sport.value,
        "market": opp.market.value,
        "line": opp.line,
        "pick": _pick_val or '',
        "odds": opp.odds,
        "impliedProbability": opp.impliedProbability,
        "aiProbability": opp.aiProbability,
        "edge": opp.edge,
        "confidence": opp.confidence,
        "projectedValue": opp.projectedValue,
        "volume": opp.volume,
        "trend": opp.trend.value,
        "trendStrength": opp.trendStrength,
        "timeToGame": opp.timeToGame,
        "venue": opp.venue.value,
        "weather": opp.weather,
        "injuries": opp.injuries,
        "recentForm": opp.recentForm,
        "matchupHistory": {
            "games": opp.matchupHistory.games,
            "average": opp.matchupHistory.average,
            "hitRate": opp.matchupHistory.hitRate
        },
        "lineMovement": {
            "open": opp.lineMovement.open,
            "current": opp.lineMovement.current,
            "direction": opp.lineMovement.direction.value
        },
        "bookmakers": bookmakers_field,
        "isBookmarked": is_bookmarked,
        "tags": opp.tags,
        "socialSentiment": opp.socialSentiment,
        "sharpMoney": opp.sharpMoney.value,
        "lastUpdated": opp.lastUpdated.isoformat(),
        "alertTriggered": opp.alertTriggered,
        "alertSeverity": opp.alertSeverity,
        # Phase 4.2: EV Engine Integration fields
        "evValue": getattr(opp, 'evValue', None),
        "evPercent": getattr(opp, 'evPercent', None),
        "evTier": getattr(opp, 'evTier', None),
        "isOutlier": getattr(opp, 'isOutlier', None),
    # EV details (optional)
    "edge_pct": getattr(opp, 'edge_pct', None),
    "fair_american_odds": getattr(opp, 'fair_american_odds', None),
    "implied_prob_market": getattr(opp, 'implied_prob_market', None),
    "implied_prob_fair": getattr(opp, 'implied_prob_fair', None),
    "expected_value_per_100": getattr(opp, 'expected_value_per_100', None),
        # Phase 4.3: Line Movement Tracking fields
        "openingLine": getattr(opp, 'openingLine', None),
        "openingOdds": getattr(opp, 'openingOdds', None),
        "latestLine": getattr(opp, 'latestLine', None),
        "latestOdds": getattr(opp, 'latestOdds', None),
        "lineChange": getattr(opp, 'lineChange', None),
        "oddsChange": getattr(opp, 'oddsChange', None),
        "movementDirection": getattr(opp, 'movementDirection', None),
        # Phase 1.2: Best Line Aggregation fields
        "bestBookmaker": (opp.bestBookmaker if getattr(opp, 'bestBookmaker', None) else (enhanced_bookmakers.get('bestBook') if isinstance(enhanced_bookmakers, dict) else None)),
        "bestOverBookmakerName": (getattr(opp, 'best_over_bookmaker_name', None) or (enhanced_bookmakers.get('bestOverBook') if isinstance(enhanced_bookmakers, dict) else None)),
        "bestUnderBookmakerName": (getattr(opp, 'best_under_bookmaker_name', None) or (enhanced_bookmakers.get('bestUnderBook') if isinstance(enhanced_bookmakers, dict) else None)),
        "lineSpread": _safe_float(getattr(opp, 'lineSpread', None) or (enhanced_bookmakers.get('lineSpread') if isinstance(enhanced_bookmakers, dict) else None), 0.0),
        "oddsSpread": _safe_int(getattr(opp, 'oddsSpread', None) or (enhanced_bookmakers.get('oddsSpread') if isinstance(enhanced_bookmakers, dict) else None), 0),
        "numBookmakers": _safe_int(getattr(opp, 'numBookmakers', None) or (enhanced_bookmakers.get('numBookmakers') if isinstance(enhanced_bookmakers, dict) else None) or (len(bookmakers_field) if isinstance(bookmakers_field, list) else 0), 0),
        "hasArbitrage": _safe_bool(getattr(opp, 'hasArbitrage', None) or (enhanced_bookmakers.get('arbitrage') if isinstance(enhanced_bookmakers, dict) else None), False),
        "arbitrageProfitPct": _safe_float(getattr(opp, 'arbitrageProfitPct', None) or (enhanced_bookmakers.get('arbitrageProfitPct') if isinstance(enhanced_bookmakers, dict) else None), 0.0),
        # Arbitrage & Low Juice Detection fields
        "vigPercent": getattr(opp, 'vigPercent', None),
        "isLowJuice": _safe_bool(getattr(opp, 'isLowJuice', None), False)
    }
    # Compute optional EV detail fields without mutating opp
    try:
        ai_prob_val = response_dict.get("aiProbability")
        odds_val = response_dict.get("odds")
        if ai_prob_val is not None and odds_val is not None:
            ai_prob_percent = float(ai_prob_val)
            if 0.0 <= ai_prob_percent <= 100.0 and isinstance(odds_val, int) and odds_val != 0:
                details = compute_ev_details(
                    projection_prob=ai_prob_percent / 100.0,
                    market_american_odds=int(odds_val),
                    stake=100.0,
                )
                response_dict.update({
                    "implied_prob_market": details.get("implied_prob_market"),
                    "implied_prob_fair": details.get("implied_prob_fair"),
                    "fair_american_odds": details.get("fair_american_odds"),
                    "edge_pct": details.get("edge_pct"),
                    "expected_value_per_100": details.get("expected_value_per_100"),
                })
    except Exception:
        pass
    
    # Only include CLV fields if CLV was enabled
    if include_clv:
        response_dict.update({
            "clvPercent": getattr(opp, 'clvPercent', None),
            "closingLine": getattr(opp, 'closingLine', None),
            "closingOdds": getattr(opp, 'closingOdds', None),
            "clv_metrics": getattr(opp, 'clv_metrics', None),
        })
    
    # Return OpportunityResponse object if CLV enabled, otherwise return dict
    if include_clv:
        logger.info(f"CLV enabled - returning OpportunityResponse object with CLV fields")
        return OpportunityResponse(**response_dict)
    else:
        logger.info(f"CLV disabled - returning dict without CLV fields: {list(response_dict.keys())}")
        return response_dict

@router.get("/opportunities", response_model=StandardAPIResponse[Dict[str, Any]])
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
    force_flat_baseline: bool = Query(False, description="Force flat movement baseline for all opportunities"),
    diagnostics: bool = Query(False, description="Include diagnostic information about movement data sources"),
    
    # NEW: CLV enrichment parameter for Step 5
    include_clv: bool = Query(
        False, 
        description="Include Customer Lifetime Value (CLV) enrichment with cached leaderboard data. When enabled, adds CLV metrics to each opportunity for enhanced analysis.",
        openapi_extra={
            "example": False,
            "examples": {
                "disabled": {
                    "summary": "Standard response without CLV",
                    "value": False
                },
                "enabled": {
                    "summary": "Enhanced response with CLV metrics",
                    "value": True
                }
            }
        }
    ),
    
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
            limit=limit,
            force_flat_baseline=force_flat_baseline,
            include_diagnostics=diagnostics
        )
        
        # EV Engine enrichment - add evPercent and evTier to opportunities
        try:
            for opp in opportunities:
                # Extract data for EV computation
                our_fair_odds = None
                market_odds = None
                
                # Try to derive fair odds from confidence/ai_probability
                if hasattr(opp, 'aiProbability') and opp.aiProbability > 0:
                    # Convert AI probability to decimal odds
                    our_fair_odds = 100 / opp.aiProbability
                elif hasattr(opp, 'confidence') and opp.confidence > 0:
                    # Use confidence as probability proxy
                    our_fair_odds = 100 / opp.confidence
                
                # Extract market odds (convert American to decimal)
                if hasattr(opp, 'odds') and opp.odds != 0:
                    market_odds = ev_engine.american_to_decimal(opp.odds)
                
                # Compute EV if we have both inputs
                if our_fair_odds and market_odds and our_fair_odds > 0 and market_odds > 0:
                    ev_percent = ev_engine.compute_ev(our_fair_odds, market_odds)
                    ev_tier = ev_engine.classify_ev(ev_percent).value
                    
                    # Update opportunity with EV data
                    opp.evPercent = ev_percent
                    opp.evTier = ev_tier
                    
                    logger.debug(f"EV computed for {opp.id}: {ev_percent:.2f}% ({ev_tier})")
                else:
                    # Set defaults when EV cannot be computed
                    opp.evPercent = None
                    opp.evTier = None
                    
        except Exception as e:
            logger.warning(f"EV enrichment failed, continuing without EV data: {e}")
            # Continue without EV data if enrichment fails
        
        # Step 5: Server-side CLV enrichment with 60s cache (feature flagged)
        clv_was_enabled = False
        clv_computation_succeeded = False
        if include_clv:
            try:
                from backend.services.clv_metrics import clv_metrics
                from backend.services.unified_config import unified_config
                from backend.services.clv_computation import compute_clv_batch
                
                config = unified_config.get_config()
                if config.performance.enable_clv_metrics:
                    clv_was_enabled = True
                    with clv_metrics.timing_context("propfinder_opportunities"):
                        opportunities = compute_clv_batch(opportunities, include_diagnostics=diagnostics)
                        clv_metrics.record_batch(len(opportunities), 0)  # duration handled by context
                        clv_computation_succeeded = True
                        logger.info(f"Enriched {len(opportunities)} opportunities with CLV data")
                else:
                    logger.info("CLV enrichment requested but disabled by feature flag")
            except ImportError as e:
                logger.warning(f"CLV service unavailable (import error), continuing without CLV data: {e}")
                clv_computation_succeeded = False
            except Exception as e:
                logger.warning(f"CLV enrichment failed, continuing without CLV data: {e}")
                clv_computation_succeeded = False
                # Record failure in metrics if available - swallow any metrics errors  
                try:
                    from backend.services.clv_metrics import clv_metrics
                    clv_metrics.record_failure(0)  # Record the failure without duration
                except Exception:
                    pass  # Silently ignore metrics recording failures
        
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
            # Only include CLV fields if CLV was enabled AND computation succeeded
            include_clv_in_response = clv_was_enabled and clv_computation_succeeded
            opportunity_responses.append(
                _convert_opportunity_to_response(opp, is_bookmarked, include_clv_in_response)
            )
        
        # Calculate summary statistics (works with both dicts and objects)
        def _get_attr(item, attr, default=None):
            if isinstance(item, dict):
                return item.get(attr, default)
            else:
                return getattr(item, attr, default)
        
        total_opportunities = len(opportunity_responses)
        avg_confidence = sum(_get_attr(opp, 'confidence', 0) for opp in opportunity_responses) / max(1, total_opportunities)
        max_edge = max((_get_attr(opp, 'edge', 0) for opp in opportunity_responses), default=0)
        alert_count = sum(1 for opp in opportunity_responses if _get_attr(opp, 'alertTriggered', False))
        sharp_heavy_count = sum(1 for opp in opportunity_responses if _get_attr(opp, 'sharpMoney') == "heavy")
        
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
            sport = _get_attr(opp, 'sport')
            if sport:
                summary["sports_breakdown"][sport] = summary["sports_breakdown"].get(sport, 0) + 1
        
        # Markets breakdown
        for opp in opportunity_responses:
            market = _get_attr(opp, 'market')
            if market:
                summary["markets_breakdown"][market] = summary["markets_breakdown"].get(market, 0) + 1
        
        # Process responses - they're already correctly formatted by _convert_opportunity_to_response
        final_opportunity_responses = opportunity_responses
        include_clv_in_response = clv_was_enabled and clv_computation_succeeded
        logger.info(f"CLV processing: clv_was_enabled={clv_was_enabled}, clv_computation_succeeded={clv_computation_succeeded}, include_clv={include_clv}")
        
        # Build response with consistent helper pattern
        include_clv_in_response = clv_was_enabled and clv_computation_succeeded
        
        if include_clv_in_response:
            # CLV enabled and successful - use OpportunitiesResponse model converted to dict
            response_data = OpportunitiesResponse(
                opportunities=final_opportunity_responses,
                total=len(opportunities),
                filtered=total_opportunities,
                summary=summary
            )
            # Convert Pydantic model to dict for consistent response_model
            payload = response_data.model_dump()
        else:
            # CLV excluded - use helper to build minimal payload (already stripped earlier)
            payload = _build_opportunities_payload(
                opportunity_dicts=final_opportunity_responses,  # Already processed by _convert_opportunity_to_response
                total=len(opportunities),
                filtered=total_opportunities,
                summary=summary
            )
        
        # Update runtime status (non-critical)
        try:
            clv_runtime_status.last_requested = time.time()
            clv_runtime_status.last_enabled_flag = clv_was_enabled
            clv_runtime_status.last_success = clv_computation_succeeded
            clv_runtime_status.last_include_param = bool(include_clv)
            clv_runtime_status.last_returned_with_clv = include_clv_in_response
            clv_runtime_status.last_opportunity_count = len(final_opportunity_responses)
            clv_runtime_status.last_error = None
        except Exception as _e:
            pass
        
        # Fire-and-forget CLV persistence (only when CLV was successfully computed and returned)
        if include_clv_in_response and clv_persistence_service is not None and clv_persistence_service.enabled:
            try:
                # Create async task for fire-and-forget persistence
                # Bind service into default arg to satisfy type checkers
                async def _persist_clv_batch(svc=clv_persistence_service):
                    processing_start_time = locals().get('processing_start')
                    processing_ms = None
                    if processing_start_time:
                        processing_ms = int((time.time() - processing_start_time) * 1000)
                    
                    batch_id = f"api_{int(time.time())}"
                    await svc.store_batch(
                        final_opportunity_responses,
                        processing_ms=processing_ms,
                        batch_id=batch_id
                    )
                
                # Fire and forget - don't await
                asyncio.create_task(_persist_clv_batch())
                logger.debug(f"CLV persistence task created for {len(final_opportunity_responses)} opportunities")
                
            except Exception as e:
                logger.debug(f"CLV persistence task creation failed: {e}")
        
        logger.info(f"Retrieved {total_opportunities} prop opportunities with filters applied")
        return ResponseBuilder.success(payload)
        
    except Exception as e:
        logger.error(f"Error fetching prop opportunities: {e}")
        raise BusinessLogicException("Failed to fetch prop opportunities")


@router.get("/clv-status", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_clv_status():
    """
    Lightweight CLV runtime status probe.
    Does not trigger enrichment; just reports last observed state.
    """
    try:
        data = {
            "lastRequestedEpoch": clv_runtime_status.last_requested,
            "lastRequestedIso": (
                time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(clv_runtime_status.last_requested))
                if clv_runtime_status.last_requested else None
            ),
            "lastIncludeParam": clv_runtime_status.last_include_param,
            "lastFeatureFlagEnabled": clv_runtime_status.last_enabled_flag,
            "lastComputationSucceeded": clv_runtime_status.last_success,
            "lastReturnedWithCLV": clv_runtime_status.last_returned_with_clv,
            "lastOpportunityCount": clv_runtime_status.last_opportunity_count,
            "lastError": clv_runtime_status.last_error,
            "status": (
                "ready" if clv_runtime_status.last_success
                else ("pending" if clv_runtime_status.last_requested is None else "degraded")
            ),
        }
        return ResponseBuilder.success(data)
    except Exception as e:
        return ResponseBuilder.success({
            "status": "error",
            "error": str(e)
        })


@router.get("/ev/opportunities", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_ev_opportunities(
    # EV filtering parameters
    min_ev: Optional[float] = Query(None, ge=0, description="Minimum EV percentage for filtering"),
    max_ev: Optional[float] = Query(None, description="Maximum EV percentage for filtering"),
    ev_tier: Optional[str] = Query(None, description="Filter by EV tier (low,moderate,high,negative)"),
    
    # Standard filtering parameters
    sports: Optional[str] = Query(None, description="Comma-separated list of sports (NBA,NFL,MLB,NHL)"),
    confidence_min: Optional[float] = Query(None, ge=0, le=100, description="Minimum confidence percentage"),
    confidence_max: Optional[float] = Query(None, ge=0, le=100, description="Maximum confidence percentage"),
    markets: Optional[str] = Query(None, description="Comma-separated list of markets"),
    
    # Pagination and sorting
    limit: int = Query(50, ge=1, le=200, description="Maximum number of opportunities"),
    sort_by: str = Query("ev_desc", description="Sort by: ev_desc, ev_asc, confidence_desc, edge_desc"),
    search: Optional[str] = Query(None, description="Search by player, team, or market"),
    
    # User context
    user_id: Optional[str] = Query(None, description="User ID for bookmark status"),
    
    # Service dependencies
    data_service: SimplePropFinderService = Depends(get_simple_propfinder_service),
    bookmark_service: BookmarkService = Depends(get_bookmark_service)
):
    """
    Get prop betting opportunities filtered by Expected Value (EV)
    
    This endpoint provides EV-focused filtering of PropFinder opportunities with:
    - Minimum/maximum EV percentage filtering
    - EV tier classification filtering (low/moderate/high/negative)
    - Sorting by EV percentage or other metrics
    - All standard PropFinder filtering options
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
        
        # Initialize data service
        await data_service._initialize_services()
        
        # Fetch all opportunities (we'll filter by EV after enrichment)
        opportunities = await data_service.get_prop_opportunities(
            sport_filter=sport_filter,
            confidence_range=confidence_range,
            limit=limit * 2  # Get more to account for EV filtering
        )
        
        # EV Engine enrichment for all opportunities
        enriched_opportunities = []
        try:
            for opp in opportunities:
                # Extract data for EV computation
                our_fair_odds = None
                market_odds = None
                
                # Try to derive fair odds from confidence/ai_probability
                if hasattr(opp, 'aiProbability') and opp.aiProbability > 0:
                    our_fair_odds = 100 / opp.aiProbability
                elif hasattr(opp, 'confidence') and opp.confidence > 0:
                    our_fair_odds = 100 / opp.confidence
                
                # Extract market odds (convert American to decimal)
                if hasattr(opp, 'odds') and opp.odds != 0:
                    market_odds = ev_engine.american_to_decimal(opp.odds)
                
                # Compute EV if we have both inputs
                if our_fair_odds and market_odds and our_fair_odds > 0 and market_odds > 0:
                    ev_percent = ev_engine.compute_ev(our_fair_odds, market_odds)
                    ev_tier_value = ev_engine.classify_ev(ev_percent).value
                    
                    # Update opportunity with EV data
                    opp.evPercent = ev_percent
                    opp.evTier = ev_tier_value
                else:
                    # Set defaults when EV cannot be computed
                    opp.evPercent = None
                    opp.evTier = None
                
                enriched_opportunities.append(opp)
                
        except Exception as e:
            logger.warning(f"EV enrichment failed: {e}")
            enriched_opportunities = opportunities  # Use original without EV data
        
        # Filter by EV criteria
        filtered_opportunities = []
        for opp in enriched_opportunities:
            # Skip opportunities without EV data if EV filtering is requested
            if (min_ev is not None or max_ev is not None or ev_tier is not None) and opp.evPercent is None:
                continue
                
            # Apply EV filters
            if min_ev is not None and (opp.evPercent is None or opp.evPercent < min_ev):
                continue
            if max_ev is not None and (opp.evPercent is None or opp.evPercent > max_ev):
                continue
            if ev_tier is not None and opp.evTier != ev_tier:
                continue
                
            filtered_opportunities.append(opp)
        
        # Apply additional filters
        if markets:
            market_filter = [m.strip() for m in markets.split(',')]
            filtered_opportunities = [opp for opp in filtered_opportunities if opp.market.value in market_filter]
        
        # Apply search filter
        if search:
            search_lower = search.lower()
            filtered_opportunities = [
                opp for opp in filtered_opportunities
                if (search_lower in opp.player.lower() or
                    search_lower in opp.team.lower() or
                    search_lower in opp.opponent.lower() or
                    search_lower in opp.market.value.lower())
            ]
        
        # Sort opportunities
        if sort_by == "ev_desc":
            filtered_opportunities.sort(key=lambda x: x.evPercent or -999, reverse=True)
        elif sort_by == "ev_asc":
            filtered_opportunities.sort(key=lambda x: x.evPercent or 999)
        elif sort_by == "confidence_desc":
            filtered_opportunities.sort(key=lambda x: x.confidence, reverse=True)
        elif sort_by == "edge_desc":
            filtered_opportunities.sort(key=lambda x: x.edge, reverse=True)
        
        # Apply limit after filtering and sorting
        final_opportunities = filtered_opportunities[:limit]
        
        # Get user bookmarks for real bookmark status
        user_bookmarked_prop_ids = set()
        if user_id:
            try:
                user_bookmarked_prop_ids = await bookmark_service.get_user_bookmarked_prop_ids(user_id)
            except Exception as e:
                logger.warning(f"Could not retrieve bookmarks for user {user_id}: {e}")
        
        # Convert to response format
        opportunity_responses = []
        for opp in final_opportunities:
            is_bookmarked = opp.id in user_bookmarked_prop_ids if user_id else opp.isBookmarked
            opportunity_responses.append(
                _convert_opportunity_to_response(opp, is_bookmarked, include_clv=False)
            )
        
        # Calculate EV-focused summary statistics
        total_opportunities = len(opportunity_responses)
        
        def _get_attr(item, attr, default=None):
            if isinstance(item, dict):
                return item.get(attr, default)
            else:
                return getattr(item, attr, default)
        
        # EV statistics
        ev_values = [_get_attr(opp, 'evPercent') for opp in opportunity_responses if _get_attr(opp, 'evPercent') is not None]
        valid_ev_values = [float(ev) for ev in ev_values if ev is not None]
        avg_ev = sum(valid_ev_values) / max(1, len(valid_ev_values)) if valid_ev_values else 0
        max_ev_value = max(valid_ev_values) if valid_ev_values else 0
        positive_ev_count = len([ev for ev in valid_ev_values if ev > 0])
        
        # EV tier breakdown
        ev_tier_breakdown = {}
        for opp in opportunity_responses:
            tier = _get_attr(opp, 'evTier')
            if tier:
                ev_tier_breakdown[tier] = ev_tier_breakdown.get(tier, 0) + 1
        
        summary = {
            "total_opportunities": total_opportunities,
            "total_with_ev": len(ev_values),
            "avg_ev_percent": round(avg_ev, 2),
            "max_ev_percent": round(max_ev_value, 2),
            "positive_ev_count": positive_ev_count,
            "positive_ev_rate": round(positive_ev_count / max(1, len(valid_ev_values)) * 100, 1) if valid_ev_values else 0,
            "ev_tier_breakdown": ev_tier_breakdown,
            "filters_applied": {
                "min_ev": min_ev,
                "max_ev": max_ev,
                "ev_tier": ev_tier,
                "sports": sport_filter,
                "markets": markets.split(',') if markets else None
            }
        }
        
        payload = {
            "opportunities": opportunity_responses,
            "total": len(enriched_opportunities),
            "filtered": total_opportunities,
            "summary": summary
        }
        
        logger.info(f"Retrieved {total_opportunities} EV-filtered opportunities (from {len(enriched_opportunities)} total)")
        return ResponseBuilder.success(payload)
        
    except Exception as e:
        logger.error(f"Error fetching EV opportunities: {e}")
        raise BusinessLogicException("Failed to fetch EV opportunities")


@router.get(
    "/opportunities/diagnostics",
    response_model=Dict[str, Any],
    summary="Get CLV system diagnostics and metrics",
    description="""
    Get comprehensive CLV system diagnostics including:
    - Enrichment performance statistics
    - Cache hit/miss ratios
    - Error rates and alert thresholds
    - System health metrics
    
    Use ?clv_diag=1 to get detailed CLV diagnostics.
    """
)
async def get_clv_diagnostics(
    clv_diag: int = Query(
        0, 
        description="Include detailed CLV diagnostics (0 or 1). When set to 1, returns comprehensive CLV system metrics including performance statistics, cache metrics, and alert thresholds.",
        openapi_extra={
            "example": 0,
            "examples": {
                "basic": {
                    "summary": "Basic response without diagnostics",
                    "value": 0
                },
                "detailed": {
                    "summary": "Full diagnostics with CLV metrics",
                    "value": 1
                }
            }
        }
    )
) -> Dict[str, Any]:
    """Get CLV system diagnostics and performance metrics"""
    try:
        # Basic response structure
        diagnostics = {
            "clv_system_enabled": True,
            "metrics_available": False,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Only include detailed diagnostics if clv_diag=1
        if clv_diag == 1:
            try:
                from backend.services.clv_metrics import clv_metrics as clv_service
                snapshot = clv_service.get_snapshot()
                
                if not snapshot.get("enabled", False):
                    diagnostics["clv_status"] = "disabled"
                    diagnostics["clv_reason"] = snapshot.get("reason", "unknown")
                else:
                    diagnostics.update(snapshot)
                    diagnostics["metrics_available"] = True
                    
                    # Check if diagnostics indicate high failure rate (alert threshold)
                    if snapshot.get("failure_rate", 0) > 5.0:
                        diagnostics["alert"] = {
                            "type": "CLVHighFailureRate",
                            "message": f"CLV failure rate ({snapshot['failure_rate']:.1f}%) exceeds 5% threshold"
                        }
                        logger.warning(f"CLV Alert - High failure rate: {snapshot['failure_rate']:.1f}%")
                
            except ImportError:
                diagnostics["error"] = "CLV metrics module not available"
            except Exception as e:
                diagnostics["error"] = f"Failed to retrieve CLV metrics: {str(e)}"
        
        return ResponseBuilder.success(diagnostics)
        
    except Exception as e:
        logger.error(f"Error fetching CLV diagnostics: {e}")
        raise BusinessLogicException("Failed to fetch CLV diagnostics")


@router.get("/opportunities/metrics-summary", 
           response_model=StandardAPIResponse[Dict[str, Any]],
           summary="CLV metrics summary (internal)",
           description="Get current CLV metrics counters and performance data for internal monitoring and alerting")
async def clv_metrics_summary():
    """Get CLV metrics summary for internal monitoring"""
    try:
        from backend.services.clv_metrics import clv_metrics
        snapshot = clv_metrics.get_snapshot()
        
        if not snapshot.get("enabled", False):
            return ResponseBuilder.success({
                "enabled": False,
                "reason": snapshot.get("reason", "disabled_by_flag")
            })
        
        return ResponseBuilder.success({
            "enabled": True,
            "success_rate": snapshot.get("success_rate", 0),
            "failure_rate": snapshot.get("failure_rate", 0),
            "avg_latency_ms": snapshot.get("avg_latency_ms", 0),
            "processed_total": snapshot.get("processed_total", 0),
            "cache_hit_rate": snapshot.get("cache_hit_rate", 0),
            "window_size": snapshot.get("window_size", "runtime"),
            "prometheus_available": snapshot.get("prometheus_available", False)
        })
    except ImportError:
        return ResponseBuilder.success({
            "enabled": False,
            "reason": "clv_metrics_module_not_available"
        })
    except Exception as e:
        logger.error(f"Error in CLV metrics summary: {e}")
        return ResponseBuilder.success({
            "enabled": False,
            "reason": f"error: {str(e)}"
        })


@router.get("/opportunities/clv-history-summary", response_model=StandardAPIResponse[Dict[str, Any]])
async def clv_history_summary(
    hours_back: int = Query(24, ge=1, le=168, description="Hours back for summary statistics (max 7 days)"),
    sport: Optional[str] = Query(None, description="Filter by sport for focused metrics")
):
    """
    Get CLV history summary for monitoring and alerting
    
    Returns lightweight aggregate CLV statistics from historical persistence data
    including computation rates, average CLV values, and processing performance metrics.
    """
    try:
        # Get runtime status
        runtime_data = {
            "lastReturnedWithCLV": clv_runtime_status.last_returned_with_clv,
            "lastComputationSucceeded": clv_runtime_status.last_success,
            "lastOpportunityCount": clv_runtime_status.last_opportunity_count,
            "lastRequestedEpoch": clv_runtime_status.last_requested,
            "lastError": clv_runtime_status.last_error
        }
        
        # Get persistence summary if available
        persistence_data = {}
        if clv_persistence_service is not None and clv_persistence_service.enabled:
            persistence_data = await clv_persistence_service.get_summary(
                hours_back=hours_back,
                sport=sport
            )
        else:
            persistence_data = {
                "enabled": False,
                "reason": "persistence_not_available"
            }
        
        return ResponseBuilder.success({
            "runtime": runtime_data,
            "persistence": persistence_data,
            "window_hours": hours_back,
            "sport_filter": sport,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        })
        
    except Exception as e:
        logger.error(f"Error generating CLV metrics summary: {e}")
        raise BusinessLogicException("Failed to generate CLV metrics summary")


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
            created_at_value = getattr(bookmark, 'created_at', None)
            created_at_iso = created_at_value.isoformat() if created_at_value else None
            
            bookmark_responses.append({
                "id": bookmark.id,
                "prop_id": bookmark.prop_id,
                "sport": bookmark.sport,
                "player": bookmark.player,
                "market": bookmark.market,
                "team": bookmark.team,
                "created_at": created_at_iso
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
        
        # Helper function to access attributes from both objects and dicts
        def _get_attr(item, attr, default=None):
            if isinstance(item, dict):
                return item.get(attr, default)
            else:
                return getattr(item, attr, default)
        
        stats = {
            "total_opportunities": len(opportunity_responses),
            "avg_confidence": round(sum(_get_attr(opp, 'confidence', 0) for opp in opportunity_responses) / len(opportunity_responses), 1) if opportunity_responses else 0,
            "max_edge": round(max(_get_attr(opp, 'edge', 0) for opp in opportunity_responses), 1) if opportunity_responses else 0,
            "alert_count": sum(1 for opp in opportunity_responses if _get_attr(opp, 'alertTriggered', False)),
            "sharp_heavy_count": sum(1 for opp in opportunity_responses if _get_attr(opp, 'sharpMoney') == "heavy"),
            "sports_count": len(set(_get_attr(opp, 'sport') for opp in opportunity_responses if _get_attr(opp, 'sport'))),
            "markets_count": len(set(_get_attr(opp, 'market') for opp in opportunity_responses if _get_attr(opp, 'market'))),
            "last_updated": datetime.utcnow().isoformat()
        }
        
        return ResponseBuilder.success(stats)
        
    except Exception as e:
        logger.error(f"Error fetching PropFinder stats: {e}")
        raise BusinessLogicException("Failed to fetch PropFinder stats")


@router.get("/clv-history", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_clv_history(
    limit: int = Query(25, ge=1, le=100, description="Maximum number of CLV records to return"),
    sport: Optional[str] = Query(None, description="Filter by sport (NBA, MLB, NFL, NHL)"),
    player: Optional[str] = Query(None, description="Filter by player name"),
    hours_back: Optional[int] = Query(None, ge=1, le=168, description="Hours back to look (max 7 days)")
):
    """
    Get CLV computation history for analysis and monitoring
    
    Returns historical CLV computation results with optional filtering.
    Useful for tracking CLV performance over time and identifying patterns.
    """
    try:
        if clv_persistence_service is None or not clv_persistence_service.enabled:
            return ResponseBuilder.success({
                "enabled": False,
                "reason": "CLV persistence not available",
                "items": [],
                "count": 0
            })
        
        records = await clv_persistence_service.get_recent(
            limit=limit,
            sport=sport,
            player=player,
            hours_back=hours_back
        )
        
        # Convert records to response format
        items = []
        for record in records:
            items.append({
                "id": record.id,
                "hash": record.opportunity_hash,
                "player": record.player,
                "sport": record.sport,
                "market": record.market,
                "clvPercent": record.clv_percent,
                "closingLine": record.closing_line,
                "closingOdds": record.closing_odds,
                "computedAt": record.computed_at.isoformat() + "Z",
                "processingMs": record.processing_ms,
                "sourceVersion": record.source_version,
                "batchId": record.batch_id
            })
        
        return ResponseBuilder.success({
            "enabled": True,
            "items": items,
            "count": len(items),
            "filters": {
                "limit": limit,
                "sport": sport,
                "player": player,
                "hours_back": hours_back
            }
        })
        
    except Exception as e:
        logger.error(f"Error fetching CLV history: {e}")
        raise BusinessLogicException("Failed to fetch CLV history")


# (Duplicate EV analysis endpoint removed; consolidated EV route above with response_model retained.)