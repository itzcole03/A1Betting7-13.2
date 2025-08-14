"""
Player Dashboard Routes - API endpoints for comprehensive player analytics
Provides endpoints for player data, statistics, trends, and predictions
"""

import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Path, Query, Request

# Contract compliance imports
from ..core.response_models import ResponseBuilder, StandardAPIResponse
from ..core.exceptions import BusinessLogicException, AuthenticationException

from ..models.player_models import PlayerDashboardResponse
from ..services.player_dashboard_service import PlayerDashboardService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v2/players", tags=["Player Dashboard"])


@router.get("/health", response_model=StandardAPIResponse[Dict[str, Any]])
async def health_check():
    """Health check endpoint for player dashboard service"""
    return ResponseBuilder.success({"status": "healthy", "service": "player_dashboard"})


player_dashboard_service = PlayerDashboardService()


@router.get("/{player_id}/dashboard", response_model=PlayerDashboardResponse)
async def get_player_dashboard(player_id: str, request: Request):
    """Get comprehensive player dashboard data including stats, trends, and prop history."""
    return ResponseBuilder.success(await) player_dashboard_service.get_player_dashboard(player_id, request)


@router.get("/search", response_model=StandardAPIResponse[Dict[str, Any]])
async def search_players(
    q: str = Query(..., min_length=2, description="Search query (player name or team)"),
    sport: str = Query("MLB", description="Sport to search in"),
    limit: int = Query(10, ge=1, le=50, description="Maximum number of results"),
) -> Dict[str, Any]:
    """
    Search for players by name or team
    """
    try:
        logger.info(f"Searching players: '{q}' in {sport}")

        players = await player_dashboard_service.search_players(q, sport, limit)

        response_data = {
            "status": "success",
            "query": q,
            "sport": sport,
            "players": players,
            "total": len(players),
        }

        logger.info(f"Found {len(players)} players for query: '{q}'")
        return ResponseBuilder.success(response_data)

    except Exception as e:
        logger.error(f"Failed to search players: {e}")
        raise BusinessLogicException("Search failed")


@router.get("/{player_id}/trends", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_player_trends(
    player_id: str = Path(..., description="Player ID or slug"),
    period: str = Query(
        "30d", regex="^(7d|30d|season)$", description="Time period (7d, 30d, season)"
    ),
    sport: str = Query("MLB", description="Sport"),
) -> Dict[str, Any]:
    """
    Get player performance trends over specified time period
    """
    try:
        logger.info(f"Fetching trends for player {player_id}: {period}")

        trends = await player_dashboard_service.get_player_trends(
            player_id, period, sport
        )

        response_data = {
            "status": "success",
            "player_id": player_id,
            "period": period,
            "trends": trends,
            "total_games": len(trends),
        }

        logger.info(
            f"Trends retrieved successfully for {player_id}: {len(trends)} games"
        )
        return ResponseBuilder.success(response_data)

    except Exception as e:
        logger.error(f"Failed to get player trends: {e}")
        raise BusinessLogicException("Failed to retrieve trends")


@router.get("/{player_id}/matchup", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_matchup_analysis(
    player_id: str = Path(..., description="Player ID or slug"),
    opponent: str = Query(..., description="Opponent team code (e.g., BOS, NYY)"),
    sport: str = Query("MLB", description="Sport"),
) -> Dict[str, Any]:
    """
    Get player matchup analysis against specific opponent
    """
    try:
        logger.info(f"Analyzing matchup: {player_id} vs {opponent}")

        analysis = await player_dashboard_service.get_matchup_analysis(
            player_id, opponent, sport
        )

        response_data = {"status": "success", "matchup": analysis}

        logger.info(f"Matchup analysis completed: {player_id} vs {opponent}")
        return ResponseBuilder.success(response_data)

    except Exception as e:
        logger.error(f"Failed to get matchup analysis: {e}")
        raise BusinessLogicException("Matchup analysis failed")


@router.get("/{player_id}/props", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_player_props(
    player_id: str = Path(..., description="Player ID or slug"),
    game_id: Optional[str] = Query(None, description="Specific game ID (optional)"),
    sport: str = Query("MLB", description="Sport"),
) -> Dict[str, Any]:
    """
    Get player prop predictions and recommendations
    """
    try:
        logger.info(f"Fetching props for player {player_id}: game {game_id}")

        props = await player_dashboard_service.get_player_props(
            player_id, game_id, sport
        )

        response_data = {
            "status": "success",
            "player_id": player_id,
            "game_id": game_id,
            "props": props,
            "total_props": len(props),
        }

        logger.info(f"Generated {len(props)} props for {player_id}")
        return ResponseBuilder.success(response_data)

    except Exception as e:
        logger.error(f"Failed to get player props: {e}")
        raise BusinessLogicException("Failed to generate props")


@router.get("/{player_id}/stats", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_player_stats(
    player_id: str = Path(..., description="Player ID or slug"),
    season: Optional[int] = Query(None, description="Season year (optional)"),
    stat_type: str = Query(
        "batting", regex="^(batting|pitching|fielding)$", description="Type of stats"
    ),
    sport: str = Query("MLB", description="Sport"),
) -> Dict[str, Any]:
    """
    Get detailed player statistics for specific category
    """
    try:
        logger.info(
            f"Fetching {stat_type} stats for player {player_id}: season {season}"
        )

        # Get full player data and extract relevant stats
        player_data = await player_dashboard_service.get_player(player_id, sport)

        # Extract relevant stats based on stat_type
        if stat_type == "batting" and player_data.season_stats:
            stats = player_data.season_stats.__dict__
        else:
            stats = {}

        response_data = {
            "status": "success",
            "player_id": player_id,
            "season": season,
            "stat_type": stat_type,
            "stats": stats,
        }

        logger.info(f"{stat_type.title()} stats retrieved for {player_id}")
        return ResponseBuilder.success(response_data)

    except Exception as e:
        logger.error(f"Failed to get player stats: {e}")
        raise BusinessLogicException("Failed to retrieve stats")


@router.post("/{player_id}/cache/clear", response_model=StandardAPIResponse[Dict[str, Any]])
async def clear_player_cache(
    player_id: str = Path(..., description="Player ID or slug"),
    sport: str = Query("MLB", description="Sport"),
) -> Dict[str, Any]:
    """
    Clear cached data for specific player (force refresh)
    """
    try:
        logger.info(f"Clearing cache for player: {player_id}")

        player_dashboard_service.cache_service.delete(
            f"player:{sport}:{player_id}:dashboard"
        )

        response_data = {
            "status": "success",
            "message": f"Cache cleared for player {player_id}",
            "player_id": player_id,
        }

        logger.info(f"Cache cleared successfully for {player_id}")
        return ResponseBuilder.success(response_data)

    except Exception as e:
        logger.error(f"Failed to clear player cache: {e}")
        raise BusinessLogicException("Cache clear failed")


@router.get("/metrics", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_service_metrics() -> Dict[str, Any]:
    """
    Get player dashboard service metrics
    """
    try:
        metrics = {
            "service": "player_dashboard",
            "status": "healthy",
            "cache_metrics": player_dashboard_service.cache_service.get_stats(),
            "timestamp": player_dashboard_service.cache_service.get_stats().get(
                "timestamp", "unknown"
            ),
        }

        return ResponseBuilder.success(metrics)

    except Exception as e:
        logger.error(f"Failed to get service metrics: {e}")
        raise BusinessLogicException("Metrics unavailable")
