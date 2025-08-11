"""
Unified Data Domain Router

RESTful API endpoints for all data operations.
Consolidates data routes into a logical, maintainable structure.
"""

from datetime import datetime, date
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query, Path
from fastapi.responses import JSONResponse
import logging

from .service import UnifiedDataService
from .models import (
    DataRequest,
    DataResponse,
    DataValidationRequest,
    DataQualityRequest,
    DataQualityMetrics,
    ValidationResult,
    PlayerData,
    TeamData,
    GameData,
    OddsData,
    HealthResponse,
    DataError,
    Sport,
    DataSource,
    DataType,
)

logger = logging.getLogger(__name__)

# Create router
data_router = APIRouter(
    prefix="/api/v1/data",
    tags=["data"],
    responses={
        404: {"model": DataError, "description": "Not found"},
        500: {"model": DataError, "description": "Internal server error"},
    }
)

# Service dependency
async def get_data_service() -> UnifiedDataService:
    """Get data service instance"""
    service = UnifiedDataService()
    if not service.is_initialized:
        await service.initialize()
    return service


@data_router.get("/health", response_model=HealthResponse)
async def health_check(
    service: UnifiedDataService = Depends(get_data_service)
):
    """
    Check data service health
    """
    try:
        return await service.health_check()
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=500, detail="Health check failed")


@data_router.post("/", response_model=DataResponse)
async def get_data(
    request: DataRequest,
    service: UnifiedDataService = Depends(get_data_service)
):
    """
    Get data based on request parameters
    
    **Request Body:**
    - **sport**: Sport type (mlb, nba, nfl, nhl)
    - **data_type**: Type of data (game, player, team, odds, props, stats)
    - **date_range**: Optional date range [start, end]
    - **team_id**: Optional team identifier
    - **player_id**: Optional player identifier
    - **game_id**: Optional game identifier
    - **source**: Optional preferred data source
    - **include_props**: Include prop bet data
    - **real_time**: Real-time data required
    
    **Returns:**
    - Data response with games, players, teams, or odds
    - Quality metrics and validation status
    - Cache and performance information
    """
    try:
        return await service.get_data(request)
    except Exception as e:
        logger.error(f"Get data failed: {e}")
        raise HTTPException(status_code=500, detail=f"Get data failed: {str(e)}")


@data_router.get("/sports/{sport}/games", response_model=DataResponse)
async def get_sport_games(
    sport: Sport = Path(..., description="Sport type"),
    date_start: Optional[date] = Query(None, description="Start date"),
    date_end: Optional[date] = Query(None, description="End date"),
    team_id: Optional[str] = Query(None, description="Team filter"),
    include_props: bool = Query(False, description="Include prop bets"),
    source: Optional[DataSource] = Query(None, description="Data source"),
    service: UnifiedDataService = Depends(get_data_service)
):
    """
    Get games for a specific sport
    
    **Path Parameters:**
    - **sport**: Sport type (mlb, nba, nfl, nhl)
    
    **Query Parameters:**
    - **date_start**: Start date for games
    - **date_end**: End date for games
    - **team_id**: Filter by team
    - **include_props**: Include prop betting data
    - **source**: Preferred data source
    
    **Returns:**
    - List of games with details and odds
    """
    try:
        date_range = None
        if date_start and date_end:
            date_range = [date_start, date_end]
        elif date_start:
            date_range = [date_start, date_start]
        
        request = DataRequest(
            sport=sport,
            data_type=DataType.GAME,
            date_range=date_range,
            team_id=team_id,
            include_props=include_props,
            source=source
        )
        
        return await service.get_data(request)
    except Exception as e:
        logger.error(f"Get sport games failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to get games")


@data_router.get("/sports/{sport}/players", response_model=DataResponse)
async def get_sport_players(
    sport: Sport = Path(..., description="Sport type"),
    team_id: Optional[str] = Query(None, description="Team filter"),
    position: Optional[str] = Query(None, description="Position filter"),
    active_only: bool = Query(True, description="Active players only"),
    source: Optional[DataSource] = Query(None, description="Data source"),
    service: UnifiedDataService = Depends(get_data_service)
):
    """
    Get players for a specific sport
    
    **Path Parameters:**
    - **sport**: Sport type (mlb, nba, nfl, nhl)
    
    **Query Parameters:**
    - **team_id**: Filter by team
    - **position**: Filter by position
    - **active_only**: Active players only
    - **source**: Preferred data source
    
    **Returns:**
    - List of players with stats and details
    """
    try:
        request = DataRequest(
            sport=sport,
            data_type=DataType.PLAYER,
            team_id=team_id,
            source=source
        )
        
        return await service.get_data(request)
    except Exception as e:
        logger.error(f"Get sport players failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to get players")


@data_router.get("/sports/{sport}/teams", response_model=DataResponse)
async def get_sport_teams(
    sport: Sport = Path(..., description="Sport type"),
    conference: Optional[str] = Query(None, description="Conference filter"),
    division: Optional[str] = Query(None, description="Division filter"),
    source: Optional[DataSource] = Query(None, description="Data source"),
    service: UnifiedDataService = Depends(get_data_service)
):
    """
    Get teams for a specific sport
    
    **Path Parameters:**
    - **sport**: Sport type (mlb, nba, nfl, nhl)
    
    **Query Parameters:**
    - **conference**: Filter by conference
    - **division**: Filter by division
    - **source**: Preferred data source
    
    **Returns:**
    - List of teams with records and stats
    """
    try:
        request = DataRequest(
            sport=sport,
            data_type=DataType.TEAM,
            source=source
        )
        
        return await service.get_data(request)
    except Exception as e:
        logger.error(f"Get sport teams failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to get teams")


@data_router.get("/players/{player_id}", response_model=DataResponse)
async def get_player_details(
    player_id: str = Path(..., description="Player ID"),
    sport: Sport = Query(..., description="Sport type"),
    include_stats: bool = Query(True, description="Include statistics"),
    include_props: bool = Query(False, description="Include prop data"),
    source: Optional[DataSource] = Query(None, description="Data source"),
    service: UnifiedDataService = Depends(get_data_service)
):
    """
    Get detailed player information
    
    **Path Parameters:**
    - **player_id**: Player identifier
    
    **Query Parameters:**
    - **sport**: Sport type
    - **include_stats**: Include player statistics
    - **include_props**: Include prop betting data
    - **source**: Preferred data source
    
    **Returns:**
    - Detailed player information with stats and props
    """
    try:
        request = DataRequest(
            sport=sport,
            data_type=DataType.PLAYER,
            player_id=player_id,
            include_props=include_props,
            source=source
        )
        
        return await service.get_data(request)
    except Exception as e:
        logger.error(f"Get player details failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to get player details")


@data_router.get("/odds/live", response_model=DataResponse)
async def get_live_odds(
    sport: Sport = Query(..., description="Sport type"),
    game_id: Optional[str] = Query(None, description="Specific game"),
    market_type: Optional[str] = Query(None, description="Market type"),
    sportsbook: Optional[str] = Query(None, description="Sportsbook filter"),
    service: UnifiedDataService = Depends(get_data_service)
):
    """
    Get live odds data
    
    **Query Parameters:**
    - **sport**: Sport type
    - **game_id**: Optional game filter
    - **market_type**: Market type (moneyline, spread, total, prop)
    - **sportsbook**: Sportsbook filter
    
    **Returns:**
    - Live odds from multiple sportsbooks
    """
    try:
        request = DataRequest(
            sport=sport,
            data_type=DataType.ODDS,
            game_id=game_id,
            real_time=True
        )
        
        return await service.get_data(request)
    except Exception as e:
        logger.error(f"Get live odds failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to get live odds")


@data_router.post("/validate", response_model=List[ValidationResult])
async def validate_data(
    request: DataValidationRequest,
    service: UnifiedDataService = Depends(get_data_service)
):
    """
    Validate data quality
    
    **Request Body:**
    - **data_id**: Data identifier to validate
    - **validation_rules**: List of validation rules to apply
    - **strict_mode**: Strict validation mode
    
    **Returns:**
    - List of validation results with status and details
    """
    try:
        return await service.validate_data(request)
    except Exception as e:
        logger.error(f"Data validation failed: {e}")
        raise HTTPException(status_code=500, detail="Data validation failed")


@data_router.get("/quality", response_model=DataQualityMetrics)
async def get_quality_metrics(
    sport: Sport = Query(..., description="Sport type"),
    data_type: DataType = Query(..., description="Data type"),
    time_window: int = Query(24, description="Time window in hours"),
    sources: Optional[List[DataSource]] = Query(None, description="Sources to check"),
    service: UnifiedDataService = Depends(get_data_service)
):
    """
    Get data quality metrics
    
    **Query Parameters:**
    - **sport**: Sport type
    - **data_type**: Type of data to assess
    - **time_window**: Time window in hours
    - **sources**: Optional source filter
    
    **Returns:**
    - Data quality metrics including completeness, accuracy, consistency
    """
    try:
        request = DataQualityRequest(
            sport=sport,
            data_type=data_type,
            time_window=time_window,
            sources=sources
        )
        
        return await service.get_quality_metrics(request)
    except Exception as e:
        logger.error(f"Get quality metrics failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to get quality metrics")


@data_router.get("/sources/status")
async def get_sources_status(
    service: UnifiedDataService = Depends(get_data_service)
):
    """
    Get data sources status
    
    **Returns:**
    - Status of all data sources
    """
    try:
        health = await service.health_check()
        return {
            "sources_online": health.sources_online,
            "sources_total": health.sources_total,
            "source_status": health.source_status,
            "last_check": health.last_update
        }
    except Exception as e:
        logger.error(f"Get sources status failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to get sources status")


@data_router.post("/pipeline/trigger")
async def trigger_data_pipeline(
    sport: Sport = Query(..., description="Sport type"),
    data_type: DataType = Query(..., description="Data type"),
    force_refresh: bool = Query(False, description="Force refresh"),
    service: UnifiedDataService = Depends(get_data_service)
):
    """
    Trigger data pipeline (admin operation)
    
    **Query Parameters:**
    - **sport**: Sport type
    - **data_type**: Data type to process
    - **force_refresh**: Force refresh existing data
    
    **Returns:**
    - Pipeline status
    """
    try:
        # This would trigger actual pipeline
        return {
            "status": "triggered",
            "sport": sport,
            "data_type": data_type,
            "pipeline_id": "pipeline_" + str(datetime.now().timestamp()),
            "estimated_completion": "5 minutes"
        }
    except Exception as e:
        logger.error(f"Trigger pipeline failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to trigger pipeline")


# Error handlers
@data_router.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Handle HTTP exceptions"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error_code": f"HTTP_{exc.status_code}",
            "message": exc.detail,
            "timestamp": datetime.utcnow().isoformat()
        }
    )


@data_router.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Handle general exceptions"""
    logger.error(f"Unhandled exception in data router: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error_code": "INTERNAL_ERROR",
            "message": "Internal server error",
            "timestamp": datetime.utcnow().isoformat()
        }
    )
