"""
Unified Sports API Routes for A1Betting Backend

Provides unified endpoints for accessing multiple sports (MLB, NBA, NFL, NHL).
"""

import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query

# Contract compliance imports
from ..core.response_models import ResponseBuilder, StandardAPIResponse
from ..core.exceptions import BusinessLogicException, AuthenticationException

from backend.services.sport_service_base import unified_sport_service
from backend.utils.enhanced_logging import get_logger

logger = get_logger("unified_sports_routes")

router = APIRouter(prefix="/sports", tags=["Unified Sports"])


async def _maybe_await(value: Any) -> Any:
    """Await `value` if it's awaitable, otherwise return it directly."""
    if hasattr(value, "__await__"):
        return await value
    return value


async def _ensure_sport_service_loaded(sport: str):
    """Ensure a sport service is loaded before accessing it."""
    try:
        from backend.services.lazy_sport_manager import lazy_sport_manager

        status = lazy_sport_manager.get_sport_status(sport)
        if status["status"] != "ready":
            logger.info(f"Activating {sport} service on demand...")
            activation_result = await lazy_sport_manager.activate_sport(sport)
            if activation_result["status"] != "ready":
                logger.warning(
                    f"Failed to activate {sport} service: {activation_result.get('error', 'Unknown error')}"
                )
                return False
        return True
    except Exception as e:
        logger.error(f"Error ensuring {sport} service is loaded: {e}")
        return False


@router.head("/", status_code=204)
async def sports_list_readiness_check():
    """
    Sports list endpoint readiness check for monitoring

    Returns 204 No Content when sports service is ready to list available sports.
    """
    return None


@router.get("/", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_available_sports():
    """Get list of all available sports"""
    try:
        # unified_sport_service.get_available_sports may be sync; support both
        maybe = unified_sport_service.get_available_sports()
        sports = await _maybe_await(maybe)
        return ResponseBuilder.success(
            {"status": "ok", "sports": sports, "count": len(sports)}
        )
    except Exception as e:
        logger.error(f"Error getting available sports: {e}")
        raise BusinessLogicException(f"Failed to get sports: {str(e)}")


@router.head("/health", status_code=204)
async def sports_health_readiness_check():
    """
    Sports health endpoint readiness check for monitoring

    Returns 204 No Content when sports health service is ready.
    """
    return None


@router.get("/health", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_all_sports_health():
    """Get health status for all sports services"""
    try:
        health_status = await _maybe_await(unified_sport_service.get_all_sports_health())
        return ResponseBuilder.success(health_status)
    except Exception as e:
        logger.error(f"Error getting sports health: {e}")
        raise BusinessLogicException(f"Failed to get health status: {str(e)}")


@router.get("/odds/unified", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_unified_odds_comparison():
    """Get odds comparison across all sports"""
    try:
        unified_odds = await _maybe_await(unified_sport_service.get_unified_odds_comparison())
        logger.info(
            f"Retrieved unified odds with {unified_odds.get('total_games', 0)} total games"
        )
        return ResponseBuilder.success(unified_odds)
    except Exception as e:
        logger.error(f"Error getting unified odds: {e}")
        raise BusinessLogicException(f"Failed to get unified odds: {e}")


@router.get("/{sport}/teams", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_sport_teams(sport: str):
    try:
        # Ensure the sport service is loaded
        if not await _ensure_sport_service_loaded(sport):
            raise BusinessLogicException(f"Unable to load service for sport '{sport}'")

        service = unified_sport_service.get_service(sport)
        if not service:
            raise BusinessLogicException(f"Sport '{sport}' not found")

        teams = await _maybe_await(service.get_teams())
        return ResponseBuilder.success(
            {"status": "ok", "sport": sport, "teams": teams, "count": len(teams)}
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error getting teams for %s: %s", sport, e)
        raise BusinessLogicException(f"Failed to get teams: {e}")


@router.get("/{sport}/players", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_sport_players(
    sport: str, team_id: Optional[int] = Query(None, description="Filter by team ID")
):
    try:
        # Ensure the sport service is loaded
        if not await _ensure_sport_service_loaded(sport):
            raise BusinessLogicException(f"Unable to load service for sport '{sport}'")

        service = unified_sport_service.get_service(sport)
        if not service:
            raise BusinessLogicException(f"Sport '{sport}' not found")

        players = await _maybe_await(service.get_players(team_id=team_id))
        return ResponseBuilder.success(
            {
                "status": "ok",
                "sport": sport,
                "players": players,
                "count": len(players),
                "team_filter": team_id,
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error getting players for %s: %s", sport, e)
        raise BusinessLogicException(f"Failed to get players: {e}")


@router.get("/{sport}/games", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_sport_games(
    sport: str,
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    team_id: Optional[int] = Query(None, description="Filter by team ID"),
):
    try:
        # Ensure the sport service is loaded
        if not await _ensure_sport_service_loaded(sport):
            raise BusinessLogicException(f"Unable to load service for sport '{sport}'")

        service = unified_sport_service.get_service(sport)
        if not service:
            raise BusinessLogicException(f"Sport '{sport}' not found")

        parsed_start_date = None
        parsed_end_date = None
        if start_date:
            parsed_start_date = datetime.strptime(start_date, "%Y-%m-%d")
        if end_date:
            parsed_end_date = datetime.strptime(end_date, "%Y-%m-%d")

        games = await _maybe_await(
            service.get_games(
                start_date=parsed_start_date, end_date=parsed_end_date, team_id=team_id
            )
        )

        return ResponseBuilder.success(
            {
                "status": "ok",
                "sport": sport,
                "games": games,
                "count": len(games),
                "filters": {"start_date": start_date, "end_date": end_date, "team_id": team_id},
            }
        )
    except ValueError as e:
        raise BusinessLogicException(f"Invalid date format: {e}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error getting games for %s: %s", sport, e)
        raise BusinessLogicException(f"Failed to get games: {e}")


@router.get("/{sport}/games/today", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_sport_todays_games(sport: str):
    try:
        # Ensure the sport service is loaded
        if not await _ensure_sport_service_loaded(sport):
            raise BusinessLogicException(f"Unable to load service for sport '{sport}'")

        service = unified_sport_service.get_service(sport)
        if not service:
            raise BusinessLogicException(f"Sport '{sport}' not found")

        games = await _maybe_await(service.get_todays_games())
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
        logger.error("Error getting today's games for %s: %s", sport, e)
        raise BusinessLogicException(f"Failed to get today's games: {e}")


@router.get("/{sport}/odds", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_sport_odds(sport: str):
    try:
        # Ensure the sport service is loaded
        if not await _ensure_sport_service_loaded(sport):
            raise BusinessLogicException(f"Unable to load service for sport '{sport}'")

        service = unified_sport_service.get_service(sport)
        if not service:
            raise BusinessLogicException(f"Sport '{sport}' not found")

        odds = await _maybe_await(service.get_odds_comparison())
        return ResponseBuilder.success(odds)
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error getting odds for %s: %s", sport, e)
        raise BusinessLogicException(f"Failed to get odds: {e}")


@router.get("/{sport}/health", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_sport_health(sport: str):
    try:
        # Ensure the sport service is loaded
        if not await _ensure_sport_service_loaded(sport):
            raise BusinessLogicException(f"Unable to load service for sport '{sport}'")

        service = unified_sport_service.get_service(sport)
        if not service:
            raise BusinessLogicException(f"Sport '{sport}' not found")

        health = await _maybe_await(service.health_check())
        return ResponseBuilder.success(health)
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error getting health for %s: %s", sport, e)
        raise BusinessLogicException(f"Failed to get health: {e}")


@router.get("/analytics/summary", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_analytics_summary():
    try:
        health_status = await _maybe_await(unified_sport_service.get_all_sports_health())
        unified_odds = await _maybe_await(unified_sport_service.get_unified_odds_comparison())

        available = await _maybe_await(unified_sport_service.get_available_sports())
        total_services = len(available)
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
                "service_uptime": (f"{(healthy_services/total_services)*100:.1f}%" if total_services > 0 else "0%"),
                "total_games_available": unified_odds.get("total_games", 0),
                "sports_coverage": list(unified_odds.get("sports", {}).keys()),
            },
            "health_summary": health_status,
            "last_updated": datetime.now().isoformat(),
        }

        return ResponseBuilder.success(summary)
    except Exception as e:
        logger.error("Error getting analytics summary: %s", e)
        raise BusinessLogicException(f"Failed to get analytics summary: {e}")
