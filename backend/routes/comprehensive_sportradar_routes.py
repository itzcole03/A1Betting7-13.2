"""
Comprehensive SportRadar API Routes
Exposes all trial APIs through unified endpoints
"""

import asyncio
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query, Path, Depends

# Contract compliance imports
from ..core.response_models import ResponseBuilder, StandardAPIResponse
from ..core.exceptions import BusinessLogicException, AuthenticationException
from pydantic import BaseModel, Field

from backend.services.comprehensive_sportradar_integration import (
    comprehensive_sportradar_service,
    APIType
)
from backend.utils.enhanced_logging import get_logger

logger = get_logger("sportradar_routes")

router = APIRouter(prefix="/api/v1/sportradar", tags=["SportRadar APIs"])


class SportRadarResponse(BaseModel):
    """Standard SportRadar API response"""
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    api_type: Optional[str] = None
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())
    quota_used: Optional[int] = None


class ComprehensiveDataRequest(BaseModel):
    """Request model for comprehensive data fetch"""
    sports: Optional[List[str]] = Field(
        default=["mlb", "nfl", "nba", "nhl"],
        description="List of sports to fetch data for"
    )
    include_odds: bool = Field(default=True, description="Include odds data")
    include_images: bool = Field(default=True, description="Include image data")
    include_live: bool = Field(default=True, description="Include live scores")


async def get_service():
    """Dependency to get initialized SportRadar service"""
    if not hasattr(comprehensive_sportradar_service, '_initialized'):
        await comprehensive_sportradar_service.initialize()
        comprehensive_sportradar_service._initialized = True
    return ResponseBuilder.success(comprehensive_sportradar_service)


@router.get("/health", response_model=Dict[str, Any])
async def get_health_status(service = Depends(get_service)):
    """Get comprehensive SportRadar service health status"""
    try:
        health = await service.get_health_status()
        return ResponseBuilder.success(health)
    except Exception as e:
        logger.error(f"��� Health check failed: {e}")
        raise BusinessLogicException("f"Health check failed: {str(e")}")


@router.get("/quota", response_model=Dict[str, Any])
async def get_quota_status(service = Depends(get_service)):
    """Get quota usage status for all APIs"""
    try:
        trial_status = service._get_trial_status()
        return ResponseBuilder.success({
            "success": True,
            "quota_status": trial_status,
            "total_apis": len(service.apis),
            "active_apis": len([api for api, usage in service.quota_usage.items() if usage > 0])
        })
    except Exception as e:
        logger.error(f"❌ Quota status failed: {e}")
        raise BusinessLogicException("f"Quota status failed: {str(e")}")


# Sports Data Endpoints
@router.get("/sports/mlb/{endpoint}", response_model=SportRadarResponse)
async def get_mlb_data(
    endpoint: str = Path(..., description="MLB endpoint (live_scores, league_hierarchy, schedules, etc.)"),
    year: Optional[int] = Query(None, description="Year for schedule data"),
    season: Optional[str] = Query("REG", description="Season type"),
    player_id: Optional[str] = Query(None, description="Player ID for player data"),
    team_id: Optional[str] = Query(None, description="Team ID for team data"),
    game_id: Optional[str] = Query(None, description="Game ID for game data"),
    service = Depends(get_service)
):
    """Get MLB data from SportRadar"""
    try:
        # Prepare parameters
        params = {}
        if year:
            params['year'] = year
        if season:
            params['season'] = season
        if player_id:
            params['player_id'] = player_id
        if team_id:
            params['team_id'] = team_id
        if game_id:
            params['game_id'] = game_id
        
        data = await service.get_mlb_data(endpoint, **params)
        
        return ResponseBuilder.success(SportRadarResponse(
            success=True,
            data=data,
            api_type="mlb",
            quota_used=service.quota_usage.get(APIType.MLB, 0))
        )
    except Exception as e:
        logger.error(f"❌ MLB data fetch failed: {e}")
        return ResponseBuilder.success(SportRadarResponse(
            success=False,
            error=str(e)),
            api_type="mlb"
        )


@router.get("/sports/nfl/{endpoint}", response_model=SportRadarResponse)
async def get_nfl_data(
    endpoint: str = Path(..., description="NFL endpoint"),
    year: Optional[int] = Query(None),
    season: Optional[str] = Query("REG"),
    player_id: Optional[str] = Query(None),
    team_id: Optional[str] = Query(None),
    game_id: Optional[str] = Query(None),
    service = Depends(get_service)
):
    """Get NFL data from SportRadar"""
    try:
        params = {k: v for k, v in {
            'year': year, 'season': season, 'player_id': player_id,
            'team_id': team_id, 'game_id': game_id
        }.items() if v is not None}
        
        data = await service.get_nfl_data(endpoint, **params)
        
        return ResponseBuilder.success(SportRadarResponse(
            success=True,
            data=data,
            api_type="nfl",
            quota_used=service.quota_usage.get(APIType.NFL, 0))
        )
    except Exception as e:
        logger.error(f"❌ NFL data fetch failed: {e}")
        return ResponseBuilder.success(SportRadarResponse(success=False, error=str(e)), api_type="nfl")


@router.get("/sports/nba/{endpoint}", response_model=SportRadarResponse)
async def get_nba_data(
    endpoint: str = Path(..., description="NBA endpoint"),
    year: Optional[int] = Query(None),
    season: Optional[str] = Query("REG"),
    player_id: Optional[str] = Query(None),
    team_id: Optional[str] = Query(None),
    game_id: Optional[str] = Query(None),
    service = Depends(get_service)
):
    """Get NBA data from SportRadar"""
    try:
        params = {k: v for k, v in {
            'year': year, 'season': season, 'player_id': player_id,
            'team_id': team_id, 'game_id': game_id
        }.items() if v is not None}
        
        data = await service.get_nba_data(endpoint, **params)
        
        return ResponseBuilder.success(SportRadarResponse(
            success=True,
            data=data,
            api_type="nba",
            quota_used=service.quota_usage.get(APIType.NBA, 0))
        )
    except Exception as e:
        logger.error(f"❌ NBA data fetch failed: {e}")
        return ResponseBuilder.success(SportRadarResponse(success=False, error=str(e)), api_type="nba")


@router.get("/sports/nhl/{endpoint}", response_model=SportRadarResponse)
async def get_nhl_data(
    endpoint: str = Path(..., description="NHL endpoint"),
    year: Optional[int] = Query(None),
    season: Optional[str] = Query("REG"),
    player_id: Optional[str] = Query(None),
    team_id: Optional[str] = Query(None),
    game_id: Optional[str] = Query(None),
    service = Depends(get_service)
):
    """Get NHL data from SportRadar"""
    try:
        params = {k: v for k, v in {
            'year': year, 'season': season, 'player_id': player_id,
            'team_id': team_id, 'game_id': game_id
        }.items() if v is not None}
        
        data = await service.get_nhl_data(endpoint, **params)
        
        return ResponseBuilder.success(SportRadarResponse(
            success=True,
            data=data,
            api_type="nhl",
            quota_used=service.quota_usage.get(APIType.NHL, 0))
        )
    except Exception as e:
        logger.error(f"❌ NHL data fetch failed: {e}")
        return ResponseBuilder.success(SportRadarResponse(success=False, error=str(e)), api_type="nhl")


@router.get("/sports/soccer/{endpoint}", response_model=SportRadarResponse)
async def get_soccer_data(
    endpoint: str = Path(..., description="Soccer endpoint"),
    tournament_id: Optional[str] = Query(None),
    match_id: Optional[str] = Query(None),
    player_id: Optional[str] = Query(None),
    team_id: Optional[str] = Query(None),
    service = Depends(get_service)
):
    """Get Soccer data from SportRadar"""
    try:
        params = {k: v for k, v in {
            'tournament_id': tournament_id, 'match_id': match_id,
            'player_id': player_id, 'team_id': team_id
        }.items() if v is not None}
        
        data = await service.get_soccer_data(endpoint, **params)
        
        return ResponseBuilder.success(SportRadarResponse(
            success=True,
            data=data,
            api_type="soccer",
            quota_used=service.quota_usage.get(APIType.SOCCER, 0))
        )
    except Exception as e:
        logger.error(f"��� Soccer data fetch failed: {e}")
        return ResponseBuilder.success(SportRadarResponse(success=False, error=str(e)), api_type="soccer")


# Odds Comparison Endpoints
@router.get("/odds/player-props/{sport}/{competition}", response_model=SportRadarResponse)
async def get_player_props_odds(
    sport: str = Path(..., description="Sport name"),
    competition: str = Path(..., description="Competition name"),
    event_id: Optional[str] = Query(None, description="Specific event ID"),
    service = Depends(get_service)
):
    """Get player props odds data"""
    try:
        params = {}
        if event_id:
            params['event_id'] = event_id
        
        data = await service.get_player_props_odds(sport, competition, **params)
        
        return ResponseBuilder.success(SportRadarResponse(
            success=True,
            data=data,
            api_type="player_props_odds",
            quota_used=service.quota_usage.get(APIType.ODDS_COMPARISON_PLAYER_PROPS, 0))
        )
    except Exception as e:
        logger.error(f"❌ Player props odds fetch failed: {e}")
        return ResponseBuilder.success(SportRadarResponse(success=False, error=str(e)), api_type="player_props_odds")


@router.get("/odds/prematch/{sport}/{competition}", response_model=SportRadarResponse)
async def get_prematch_odds(
    sport: str = Path(..., description="Sport name"),
    competition: str = Path(..., description="Competition name"),
    event_id: Optional[str] = Query(None, description="Specific event ID"),
    service = Depends(get_service)
):
    """Get prematch odds data"""
    try:
        params = {}
        if event_id:
            params['event_id'] = event_id
        
        data = await service.get_prematch_odds(sport, competition, **params)
        
        return ResponseBuilder.success(SportRadarResponse(
            success=True,
            data=data,
            api_type="prematch_odds",
            quota_used=service.quota_usage.get(APIType.ODDS_COMPARISON_PREMATCH, 0))
        )
    except Exception as e:
        logger.error(f"❌ Prematch odds fetch failed: {e}")
        return ResponseBuilder.success(SportRadarResponse(success=False, error=str(e)), api_type="prematch_odds")


@router.get("/odds/futures/{sport}/{competition}", response_model=SportRadarResponse)
async def get_futures_odds(
    sport: str = Path(..., description="Sport name"),
    competition: str = Path(..., description="Competition name"),
    event_id: Optional[str] = Query(None, description="Specific event ID"),
    service = Depends(get_service)
):
    """Get futures odds data"""
    try:
        params = {}
        if event_id:
            params['event_id'] = event_id
        
        data = await service.get_futures_odds(sport, competition, **params)
        
        return ResponseBuilder.success(SportRadarResponse(
            success=True,
            data=data,
            api_type="futures_odds",
            quota_used=service.quota_usage.get(APIType.ODDS_COMPARISON_FUTURES, 0))
        )
    except Exception as e:
        logger.error(f"❌ Futures odds fetch failed: {e}")
        return ResponseBuilder.success(SportRadarResponse(success=False, error=str(e)), api_type="futures_odds")


# Image Endpoints
@router.get("/images/getty/{sport}/{competition}", response_model=SportRadarResponse)
async def get_getty_images(
    sport: str = Path(..., description="Sport name"),
    competition: str = Path(..., description="Competition name"),
    image_type: str = Query("action_shots", description="Image type (action_shots, headshots, etc.)"),
    event_id: Optional[str] = Query(None, description="Specific event ID"),
    service = Depends(get_service)
):
    """Get Getty Images"""
    try:
        params = {}
        if event_id:
            params['event_id'] = event_id
        
        data = await service.get_getty_images(sport, competition, image_type, **params)
        
        return ResponseBuilder.success(SportRadarResponse(
            success=True,
            data=data,
            api_type="getty_images",
            quota_used=service.quota_usage.get(APIType.GETTY_IMAGES, 0))
        )
    except Exception as e:
        logger.error(f"❌ Getty images fetch failed: {e}")
        return ResponseBuilder.success(SportRadarResponse(success=False, error=str(e)), api_type="getty_images")


@router.get("/images/sportradar/{image_type}", response_model=SportRadarResponse)
async def get_sportradar_images(
    image_type: str = Path(..., description="Image type (country_flags, team_logos, etc.)"),
    sport: Optional[str] = Query(None, description="Sport name for team/league logos"),
    team_id: Optional[str] = Query(None, description="Team ID for team logos"),
    league_id: Optional[str] = Query(None, description="League ID for league logos"),
    service = Depends(get_service)
):
    """Get SportRadar Images"""
    try:
        params = {}
        if sport:
            params['sport'] = sport
        if team_id:
            params['team_id'] = team_id
        if league_id:
            params['league_id'] = league_id
        
        data = await service.get_sportradar_images(image_type, **params)
        
        return ResponseBuilder.success(SportRadarResponse(
            success=True,
            data=data,
            api_type="sportradar_images",
            quota_used=service.quota_usage.get(APIType.SPORTRADAR_IMAGES, 0))
        )
    except Exception as e:
        logger.error(f"❌ SportRadar images fetch failed: {e}")
        return ResponseBuilder.success(SportRadarResponse(success=False, error=str(e)), api_type="sportradar_images")


# Comprehensive Data Endpoint
@router.post("/comprehensive", response_model=Dict[str, Any])
async def get_comprehensive_sports_data(
    request: ComprehensiveDataRequest,
    service = Depends(get_service)
):
    """Get comprehensive data across all available SportRadar APIs"""
    try:
        data = await service.get_comprehensive_sports_data(request.sports)
        
        return ResponseBuilder.success({
            "success": True,
            "comprehensive_data": data,
            "request_params": request.dict(),
            "apis_accessed": len(data.get("metadata", {})).get("apis_used", [])),
            "total_quota_used": sum(service.quota_usage.values())
        }
    except Exception as e:
        logger.error(f"❌ Comprehensive data fetch failed: {e}")
        raise BusinessLogicException("f"Comprehensive data fetch failed: {str(e")}")


@router.get("/comprehensive", response_model=Dict[str, Any])
async def get_comprehensive_sports_data_simple(
    sports: str = Query("mlb,nfl,nba,nhl", description="Comma-separated list of sports"),
    service = Depends(get_service)
):
    """Get comprehensive data across all available SportRadar APIs (GET version)"""
    try:
        sports_list = [sport.strip() for sport in sports.split(",")]
        data = await service.get_comprehensive_sports_data(sports_list)
        
        return ResponseBuilder.success({
            "success": True,
            "comprehensive_data": data,
            "sports_requested": sports_list,
            "apis_accessed": len(data.get("metadata", {})).get("apis_used", [])),
            "total_quota_used": sum(service.quota_usage.values())
        }
    except Exception as e:
        logger.error(f"❌ Comprehensive data fetch failed: {e}")
        raise BusinessLogicException("f"Comprehensive data fetch failed: {str(e")}")


# Live Data Endpoints
@router.get("/live/{sport}", response_model=SportRadarResponse)
async def get_live_data(
    sport: str = Path(..., description="Sport name (mlb, nfl, nba, nhl, soccer)"),
    service = Depends(get_service)
):
    """Get live scores and data for a specific sport"""
    try:
        sport_lower = sport.lower()
        
        if sport_lower == "mlb":
            data = await service.get_mlb_data("live_scores")
            api_type = APIType.MLB
        elif sport_lower == "nfl":
            data = await service.get_nfl_data("live_scores")
            api_type = APIType.NFL
        elif sport_lower == "nba":
            data = await service.get_nba_data("live_scores")
            api_type = APIType.NBA
        elif sport_lower == "nhl":
            data = await service.get_nhl_data("live_scores")
            api_type = APIType.NHL
        elif sport_lower == "soccer":
            data = await service.get_soccer_data("live_scores")
            api_type = APIType.SOCCER
        else:
            raise BusinessLogicException("f"Unsupported sport: {sport}")
        
        return ResponseBuilder.success(SportRadarResponse(
            success=True,
            data=data,
            api_type=f"live_{sport_lower}",
            quota_used=service.quota_usage.get(api_type, 0))
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Live data fetch failed for {sport}: {e}")
        return ResponseBuilder.success(SportRadarResponse(success=False, error=str(e)), api_type=f"live_{sport}")


# API Documentation
@router.get("/apis", response_model=Dict[str, Any])
async def list_available_apis(service = Depends(get_service)):
    """List all available SportRadar APIs and their configurations"""
    try:
        apis_info = {}
        
        for api_type, api_config in service.apis.items():
            apis_info[api_type.value] = {
                "base_url": api_config.base_url,
                "quota_limit": api_config.quota_limit,
                "quota_used": service.quota_usage.get(api_type, 0),
                "quota_remaining": api_config.quota_limit - service.quota_usage.get(api_type, 0),
                "qps_limit": api_config.qps_limit,
                "trial_end": api_config.trial_end,
                "endpoints": list(api_config.endpoints.keys()),
                "data_categories": [cat.value for cat in api_config.data_categories],
                "packages": api_config.packages
            }
        
        return ResponseBuilder.success({
            "success": True,
            "total_apis": len(service.apis),
            "api_details": apis_info,
            "service_status": await service.get_health_status()
        })
    except Exception as e:
        logger.error(f"❌ API listing failed: {e}")
        raise BusinessLogicException("f"API listing failed: {str(e")}")


@router.get("/", response_model=Dict[str, Any])
async def sportradar_info():
    """Get SportRadar integration information"""
    return ResponseBuilder.success({
        "service": "Comprehensive SportRadar Integration",
        "version": "1.0.0",
        "description": "Integration for all SportRadar trial APIs",
        "trial_apis": [
            "Odds Comparison (Futures, Prematch, Player Props, Regular)",
            "Images (Getty, College PressBox, SportRadar, Associated Press)",
            "Sports Data (MLB, NFL, NBA, NHL, Soccer, Tennis, MMA, NASCAR, WNBA, NCAAFB, Table Tennis)"
        ],
        "trial_period": "08/11/2025 - 09/10/2025",
        "total_quota": "1,000 requests per API (except images: 100)",
        "endpoints": {
            "health": "/api/v1/sportradar/health",
            "quota": "/api/v1/sportradar/quota",
            "comprehensive": "/api/v1/sportradar/comprehensive",
            "live_data": "/api/v1/sportradar/live/{sport})",
            "sports_data": "/api/v1/sportradar/sports/{sport}/{endpoint}",
            "odds": "/api/v1/sportradar/odds/{type}/{sport}/{competition}",
            "images": "/api/v1/sportradar/images/{provider}/{sport}/{competition}",
            "api_list": "/api/v1/sportradar/apis"
        }
    }
