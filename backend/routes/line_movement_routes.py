"""
Line Movement API Endpoints
RESTful endpoints for line movement analytics and historical data
"""

from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, Field

from ..services.line_movement_analytics import get_movement_analytics, MovementAnalysis, SteamAlert
from ..services.historical_odds_capture import get_historical_odds_service
from ..core.exceptions import BusinessLogicException, ResourceNotFoundException
from ..core.response_models import StandardAPIResponse, ResponseBuilder

router = APIRouter(prefix="/api/line-movement", tags=["Line Movement"])

# Response Models
class MovementAnalysisResponse(BaseModel):
    """Movement analysis response model"""
    prop_id: str
    sportsbook: str
    
    # Movement metrics
    movement_1h: Optional[float] = None
    movement_6h: Optional[float] = None  
    movement_24h: Optional[float] = None
    movement_total: Optional[float] = None
    
    # Velocity metrics
    velocity_1h: Optional[float] = None
    velocity_recent: Optional[float] = None
    
    # Volatility metrics
    volatility_score: Optional[float] = None
    direction_changes: int = 0
    
    # Steam detection
    is_steam: bool = False
    steam_threshold: Optional[float] = None
    steam_book_count: Optional[int] = None
    steam_detected_at: Optional[datetime] = None
    
    # Reference data
    opening_line: Optional[float] = None
    current_line: Optional[float] = None
    opening_odds: Optional[int] = None
    current_odds: Optional[int] = None
    
    computed_at: datetime

class SteamAlertResponse(BaseModel):
    """Steam alert response model"""
    prop_id: str
    detected_at: datetime
    books_moving: List[str]
    movement_size: float
    synchronized_window_minutes: int
    confidence_score: float

class MovementSummaryResponse(BaseModel):
    """Movement summary response model"""
    prop_id: str
    books_analyzed: List[str]
    total_books: int
    steam_detected: bool
    max_movement_24h: float
    most_volatile_book: Optional[Dict[str, Any]] = None
    consensus_movement: Optional[float] = None
    steam_alerts: Optional[List[Dict[str, Any]]] = None
    analyzed_at: str

class LineHistoryResponse(BaseModel):
    """Historical line data response"""
    prop_id: str
    sportsbook: str
    sport: str
    market_type: str
    total_snapshots: int
    date_range: Dict[str, str]
    snapshots: List[Dict[str, Any]]

# Endpoints
@router.get(
    "/analyze/{prop_id}/{sportsbook}",
    response_model=StandardAPIResponse[MovementAnalysisResponse],
    summary="Analyze line movement for specific prop and sportsbook"
)
async def analyze_prop_movement(
    prop_id: str,
    sportsbook: str,
    hours_back: int = Query(24, ge=1, le=168, description="Hours of historical data to analyze")
):
    """
    Analyze line movement patterns for a specific prop at a specific sportsbook.
    
    Returns detailed movement analysis including:
    - Time-based movements (1h, 6h, 24h, total)
    - Velocity and volatility metrics
    - Steam detection indicators
    - Opening vs current line comparison
    """
    try:
        analytics_service = get_movement_analytics()
        odds_service = get_historical_odds_service()
        
        # Get historical data
        end_time = datetime.now(timezone.utc)
        start_time = end_time - timedelta(hours=hours_back)
        
        historical_data = await odds_service.get_prop_history(
            prop_id=prop_id,
            sportsbook=sportsbook,
            start_time=start_time,
            end_time=end_time
        )
        
        if not historical_data:
            raise HTTPException(
                status_code=404, 
                detail=f"No historical data found for prop {prop_id} at {sportsbook}"
            )
        
        # Perform analysis
        analysis = await analytics_service.analyze_prop_movement(
            prop_id=prop_id,
            sportsbook=sportsbook,
            historical_data=historical_data
        )
        
        # Convert to response model
        response_data = MovementAnalysisResponse(
            prop_id=analysis.prop_id,
            sportsbook=analysis.sportsbook,
            movement_1h=analysis.movement_1h,
            movement_6h=analysis.movement_6h,
            movement_24h=analysis.movement_24h,
            movement_total=analysis.movement_total,
            velocity_1h=analysis.velocity_1h,
            velocity_recent=analysis.velocity_recent,
            volatility_score=analysis.volatility_score,
            direction_changes=analysis.direction_changes,
            is_steam=analysis.is_steam,
            steam_threshold=analysis.steam_threshold,
            steam_book_count=analysis.steam_book_count,
            steam_detected_at=analysis.steam_detected_at,
            opening_line=analysis.opening_line,
            current_line=analysis.current_line,
            opening_odds=analysis.opening_odds,
            current_odds=analysis.current_odds,
            computed_at=analysis.computed_at
        )
        
        return StandardAPIResponse(
            success=True,
            data=response_data,
            error=None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise BusinessLogicException(f"Error analyzing line movement: {str(e)}", status_code=500)

@router.get(
    "/steam-detection/{prop_id}",
    response_model=StandardAPIResponse[Optional[SteamAlertResponse]],
    summary="Detect steam across all sportsbooks for a prop"
)
async def detect_steam(
    prop_id: str,
    window_minutes: int = Query(30, ge=10, le=120, description="Time window for steam detection")
):
    """
    Detect steam by analyzing synchronized line movements across multiple sportsbooks.
    
    Returns steam alert if synchronized movement detected, otherwise None.
    Steam requires minimum 3 books moving in same direction within time window.
    """
    try:
        analytics_service = get_movement_analytics()
        odds_service = get_historical_odds_service()
        
        # Get recent data for all books
        end_time = datetime.now(timezone.utc)
        start_time = end_time - timedelta(minutes=window_minutes * 2)  # Extra buffer
        
        all_books_data = await odds_service.get_prop_history_all_books(
            prop_id=prop_id,
            start_time=start_time,
            end_time=end_time
        )
        
        if not all_books_data:
            raise HTTPException(
                status_code=404,
                detail=f"No recent data found for prop {prop_id}"
            )
        
        # Detect steam
        steam_alert = await analytics_service.detect_steam_across_books(
            prop_id=prop_id,
            all_books_data=all_books_data
        )
        
        response_data = None
        if steam_alert:
            response_data = SteamAlertResponse(
                prop_id=steam_alert.prop_id,
                detected_at=steam_alert.detected_at,
                books_moving=steam_alert.books_moving,
                movement_size=steam_alert.movement_size,
                synchronized_window_minutes=steam_alert.synchronized_window_minutes,
                confidence_score=steam_alert.confidence_score
            )
        
        return StandardAPIResponse(
            success=True,
            data=response_data,
            error=None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise BusinessLogicException(f"Error detecting steam: {str(e)}", status_code=500)

@router.get(
    "/summary/{prop_id}",
    response_model=StandardAPIResponse[MovementSummaryResponse],
    summary="Get comprehensive movement summary across all sportsbooks"
)
async def get_movement_summary(prop_id: str):
    """
    Get comprehensive movement summary for a prop across all tracked sportsbooks.
    
    Includes:
    - Books analyzed count
    - Maximum 24h movement
    - Most volatile book
    - Consensus movement direction
    - Recent steam alerts
    """
    try:
        analytics_service = get_movement_analytics()
        
        summary = await analytics_service.get_movement_summary(prop_id)
        
        response_data = MovementSummaryResponse(
            prop_id=summary['prop_id'],
            books_analyzed=summary['books_analyzed'],
            total_books=summary['total_books'],
            steam_detected=summary['steam_detected'],
            max_movement_24h=summary['max_movement_24h'],
            most_volatile_book=summary.get('most_volatile_book'),
            consensus_movement=summary.get('consensus_movement'),
            steam_alerts=summary.get('steam_alerts'),
            analyzed_at=summary['analyzed_at']
        )
        
        return StandardAPIResponse(
            success=True,
            data=response_data,
            error=None
        )
        
    except Exception as e:
        raise BusinessLogicException(f"Error generating movement summary: {str(e)}", status_code=500)

@router.get(
    "/history/{prop_id}/{sportsbook}",
    response_model=StandardAPIResponse[LineHistoryResponse],
    summary="Get historical line data for visualization"
)
async def get_line_history(
    prop_id: str,
    sportsbook: str,
    hours_back: int = Query(24, ge=1, le=168, description="Hours of history to return"),
    limit: int = Query(100, ge=10, le=500, description="Maximum snapshots to return")
):
    """
    Get historical line data for charting and visualization.
    
    Returns time series data suitable for line charts showing:
    - Line movement over time
    - Odds changes
    - Capture timestamps
    """
    try:
        odds_service = get_historical_odds_service()
        
        # Get historical data
        end_time = datetime.now(timezone.utc)
        start_time = end_time - timedelta(hours=hours_back)
        
        historical_data = await odds_service.get_prop_history(
            prop_id=prop_id,
            sportsbook=sportsbook,
            start_time=start_time,
            end_time=end_time,
            limit=limit
        )
        
        if not historical_data:
            raise HTTPException(
                status_code=404,
                detail=f"No historical data found for {prop_id} at {sportsbook}"
            )
        
        # Format response
        first_snapshot = historical_data[0]
        last_snapshot = historical_data[-1]
        
        response_data = LineHistoryResponse(
            prop_id=prop_id,
            sportsbook=sportsbook,
            sport=first_snapshot.get('sport', 'unknown'),
            market_type=first_snapshot.get('market_type', 'unknown'),
            total_snapshots=len(historical_data),
            date_range={
                'start': first_snapshot['captured_at'],
                'end': last_snapshot['captured_at']
            },
            snapshots=[
                {
                    'timestamp': snapshot['captured_at'],
                    'line': snapshot.get('line'),
                    'over_odds': snapshot.get('over_odds'),
                    'under_odds': snapshot.get('under_odds'),
                    'over_price': snapshot.get('over_price'),
                    'under_price': snapshot.get('under_price')
                }
                for snapshot in historical_data
            ]
        )
        
        return StandardAPIResponse(
            success=True,
            data=response_data,
            error=None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise BusinessLogicException(f"Error retrieving line history: {str(e)}", status_code=500)

@router.get(
    "/service/stats",
    response_model=StandardAPIResponse[Dict[str, Any]],
    summary="Get line movement analytics service statistics"
)
async def get_analytics_stats():
    """Get analytics service operational statistics"""
    try:
        analytics_service = get_movement_analytics()
        stats = analytics_service.get_service_stats()
        
        return StandardAPIResponse(
            success=True,
            data=stats,
            error=None
        )
        
    except Exception as e:
        raise BusinessLogicException(f"Error retrieving analytics stats: {str(e)}", status_code=500)

@router.get(
    "/trending",
    response_model=StandardAPIResponse[List[Dict[str, Any]]],
    summary="Get trending line movements"
)
async def get_trending_movements(
    hours_back: int = Query(6, ge=1, le=24, description="Hours to look back for trending"),
    min_movement: float = Query(0.5, ge=0.1, le=5.0, description="Minimum movement to consider"),
    limit: int = Query(20, ge=5, le=50, description="Maximum results to return")
):
    """
    Get props with the most significant recent line movements.
    
    Returns trending props sorted by movement magnitude.
    """
    try:
        analytics_service = get_movement_analytics()
        
        # Get trending movements from cache
        trending_movements = []
        
        for cache_key, analysis in analytics_service.movement_cache.items():
            # Check if movement is significant
            movement_value = None
            if hours_back <= 1 and analysis.movement_1h:
                movement_value = abs(analysis.movement_1h)
            elif hours_back <= 6 and analysis.movement_6h:
                movement_value = abs(analysis.movement_6h)
            elif analysis.movement_24h:
                movement_value = abs(analysis.movement_24h)
            
            if movement_value and movement_value >= min_movement:
                trending_movements.append({
                    'prop_id': analysis.prop_id,
                    'sportsbook': analysis.sportsbook,
                    'movement_value': movement_value,
                    'direction': 'up' if (
                        (hours_back <= 1 and analysis.movement_1h and analysis.movement_1h > 0) or
                        (hours_back <= 6 and analysis.movement_6h and analysis.movement_6h > 0) or
                        (analysis.movement_24h and analysis.movement_24h > 0)
                    ) else 'down',
                    'volatility_score': analysis.volatility_score,
                    'current_line': analysis.current_line,
                    'computed_at': analysis.computed_at.isoformat()
                })
        
        # Sort by movement magnitude
        trending_movements.sort(key=lambda x: x['movement_value'], reverse=True)
        
        # Limit results
        trending_movements = trending_movements[:limit]
        
        return StandardAPIResponse(
            success=True,
            data=trending_movements,
            error=None
        )
        
    except Exception as e:
        raise BusinessLogicException(f"Error retrieving trending movements: {str(e)}", status_code=500)