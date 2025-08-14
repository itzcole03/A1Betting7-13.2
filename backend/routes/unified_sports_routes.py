"""
Unified Sports API Routes for A1Betting Backend

Provides unified endpoints for accessing multiple sports (MLB, NBA, NFL, NHL).
"""

import logging
from datetime import datetime
from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException, Query

# Contract compliance imports
from ..core.response_models import ResponseBuilder, StandardAPIResponse
from ..core.exceptions import BusinessLogicException, AuthenticationException

from backend.services.sport_service_base import unified_sport_service
from backend.utils.enhanced_logging import get_logger

logger = get_logger("unified_sports_routes")

router = APIRouter(prefix="/sports", tags=["Unified Sports"])


@router.get("/", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_available_sports():
    """Get list of all available sports"""
    try:
        sports = unified_sport_service.get_available_sports()
        return ResponseBuilder.success({"status": "ok", "sports": sports, "count": len(sports)})
    except Exception as e:
        logger.error(f"Error getting available sports: {e}")
        raise BusinessLogicException("f"Failed to get sports: {str(e")}")


@router.get("/health", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_all_sports_health():
    """Get health status for all sports services"""
    try:
        health_status = await unified_sport_service.get_all_sports_health()
        return ResponseBuilder.success(health_status)
    except Exception as e:
        logger.error(f"Error getting sports health: {e}")
        raise BusinessLogicException("f"Failed to get health status: {str(e")}"
        )


@router.get("/odds/unified", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_unified_odds_comparison():
    """Get odds comparison across all sports"""
    try:
        unified_odds = await unified_sport_service.get_unified_odds_comparison()
        logger.info(
            f"Retrieved unified odds with {unified_odds.get('total_games', 0)} total games"
        )
        return ResponseBuilder.success(unified_odds)
    except Exception as e:
        logger.error(f"Error getting unified odds: {e}")
        raise BusinessLogicException("f"Failed to get unified odds: {str(e")}"
        )


@router.get("/{sport}/teams", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_sport_teams(sport: str):
    """Get teams for a specific sport"""
    try:
        service = unified_sport_service.get_service(sport)
        if not service:
            raise BusinessLogicException("f"Sport '{sport}' not found")

        teams = await service.get_teams()
        return ResponseBuilder.success({"status": "ok", "sport": sport, "teams": teams, "count": len(teams)})
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting teams for {sport}: {e}")
        raise BusinessLogicException("f"Failed to get teams: {str(e")}")


@router.get("/{sport}/players", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_sport_players(
    sport: str, team_id: int = Query(None, description="Filter by team ID")
):
    """Get players for a specific sport"""
    try:
        service = unified_sport_service.get_service(sport)
        if not service:
            raise BusinessLogicException("f"Sport '{sport}' not found")

        players = await service.get_players(team_id=team_id)
        return ResponseBuilder.success({
            "status": "ok",
            "sport": sport,
            "players": players,
            "count": len(players),
            "team_filter": team_id,
        })
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting players for {sport}: {e}")
        raise BusinessLogicException("f"Failed to get players: {str(e")}")


@router.get("/{sport}/games", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_sport_games(
    sport: str,
    start_date: str = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(None, description="End date (YYYY-MM-DD)"),
    team_id: int = Query(None, description="Filter by team ID"),
):
    """Get games for a specific sport"""
    try:
        service = unified_sport_service.get_service(sport)
        if not service:
            raise BusinessLogicException("f"Sport '{sport}' not found")

        # Parse dates if provided
        parsed_start_date = None
        parsed_end_date = None

        if start_date:
            parsed_start_date = datetime.strptime(start_date, "%Y-%m-%d")
        if end_date:
            parsed_end_date = datetime.strptime(end_date, "%Y-%m-%d")

        games = await service.get_games(
            start_date=parsed_start_date, end_date=parsed_end_date, team_id=team_id
        )

        return ResponseBuilder.success({
            "status": "ok",
            "sport": sport,
            "games": games,
            "count": len(games),
            "filters": {
                "start_date": start_date,
                "end_date": end_date,
                "team_id": team_id,
            }),
        }

    except ValueError as e:
        raise BusinessLogicException("f"Invalid date format: {str(e")}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting games for {sport}: {e}")
        raise BusinessLogicException("f"Failed to get games: {str(e")}")


@router.get("/{sport}/games/today", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_sport_todays_games(sport: str):
    """Get today's games for a specific sport"""
    try:
        service = unified_sport_service.get_service(sport)
        if not service:
            raise BusinessLogicException("f"Sport '{sport}' not found")

        games = await service.get_todays_games()
        return ResponseBuilder.success({
            "status": "ok",
            "sport": sport,
            "games": games,
            "count": len(games),
            "date": datetime.now().strftime("%Y-%m-%d"),
        })

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting today's games for {sport}: {e}")
        raise BusinessLogicException("f"Failed to get today's games: {str(e")}"
        )


@router.get("/{sport}/odds", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_sport_odds(sport: str):
    """Get odds comparison for a specific sport"""
    try:
        service = unified_sport_service.get_service(sport)
        if not service:
            raise BusinessLogicException("f"Sport '{sport}' not found")

        odds = await service.get_odds_comparison()
        return ResponseBuilder.success(odds)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting odds for {sport}: {e}")
        raise BusinessLogicException("f"Failed to get odds: {str(e")}")


@router.get("/{sport}/health", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_sport_health(sport: str):
    """Get health status for a specific sport service"""
    try:
        service = unified_sport_service.get_service(sport)
        if not service:
            raise BusinessLogicException("f"Sport '{sport}' not found")

        health = await service.health_check()
        return ResponseBuilder.success(health)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting health for {sport}: {e}")
        raise BusinessLogicException("f"Failed to get health: {str(e")}")


@router.get("/analytics/summary", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_analytics_summary():
    """Get analytics summary across all sports"""
    try:
        # Get health status and odds for all sports
        health_status = await unified_sport_service.get_all_sports_health()
        unified_odds = await unified_sport_service.get_unified_odds_comparison()

        # Calculate summary statistics
        total_services = len(unified_sport_service.get_available_sports())
        healthy_services = sum(
            1
            for service_health in health_status.get("services", {}).values()
            if service_health.get("status") == "healthy"
        )

        summary = {
            "status": "ok",
            "sports_analytics": {
                "total_sports": total_services,
                "healthy_services": healthy_services,
                "service_uptime": (
                    f"{(healthy_services/total_services)*100:.1f}%"
                    if total_services > 0
                    else "0%"
                ),
                "total_games_available": unified_odds.get("total_games", 0),
                "sports_coverage": list(unified_odds.get("sports", {}).keys()),
            },
            "health_summary": health_status,
            "last_updated": datetime.now().isoformat(),
        }

        return ResponseBuilder.success(summary)

    except Exception as e:
        logger.error(f"Error getting analytics summary: {e}")
        raise BusinessLogicException("f"Failed to get analytics summary: {str(e")}"
        )
