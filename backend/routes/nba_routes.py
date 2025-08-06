"""
NBA API Routes for A1Betting Backend

Provides REST endpoints for NBA teams, players, games, and odds data.
"""

import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException, Query

from backend.models.nba_models import NBAGame, NBAOddsComparison, NBAPlayer, NBATeam
from backend.services.nba_service_client import nba_service
from backend.utils.enhanced_logging import get_logger

logger = get_logger("nba_routes")

router = APIRouter(prefix="/nba", tags=["NBA"])


@router.get("/health")
async def nba_health_check():
    """NBA service health check"""
    return await nba_service.health_check()


@router.get("/teams", response_model=List[Dict[str, Any]])
async def get_nba_teams():
    """Get all NBA teams"""
    try:
        teams = await nba_service.get_nba_teams()
        logger.info(f"Retrieved {len(teams)} NBA teams")
        return teams
    except Exception as e:
        logger.error(f"Error fetching NBA teams: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch NBA teams: {str(e)}"
        )


@router.get("/teams/{team_id}/players", response_model=List[Dict[str, Any]])
async def get_team_players(team_id: int):
    """Get players for a specific NBA team"""
    try:
        players = await nba_service.get_nba_players(team_id=team_id)
        logger.info(f"Retrieved {len(players)} players for team {team_id}")
        return players
    except Exception as e:
        logger.error(f"Error fetching players for team {team_id}: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch players: {str(e)}"
        )


@router.get("/players", response_model=List[Dict[str, Any]])
async def get_nba_players(team_id: int = Query(None, description="Filter by team ID")):
    """Get NBA players, optionally filtered by team"""
    try:
        players = await nba_service.get_nba_players(team_id=team_id)
        logger.info(f"Retrieved {len(players)} NBA players")
        return players
    except Exception as e:
        logger.error(f"Error fetching NBA players: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch players: {str(e)}"
        )


@router.get("/games", response_model=List[Dict[str, Any]])
async def get_nba_games(
    start_date: str = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(None, description="End date (YYYY-MM-DD)"),
    team_id: int = Query(None, description="Filter by team ID"),
):
    """Get NBA games for specified date range and/or team"""
    try:
        # Parse dates if provided
        parsed_start_date = None
        parsed_end_date = None

        if start_date:
            parsed_start_date = datetime.strptime(start_date, "%Y-%m-%d")
        if end_date:
            parsed_end_date = datetime.strptime(end_date, "%Y-%m-%d")

        games = await nba_service.get_nba_games(
            start_date=parsed_start_date, end_date=parsed_end_date, team_id=team_id
        )

        logger.info(f"Retrieved {len(games)} NBA games")
        return games

    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {str(e)}")
    except Exception as e:
        logger.error(f"Error fetching NBA games: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch games: {str(e)}")


@router.get("/games/today", response_model=List[Dict[str, Any]])
async def get_todays_nba_games():
    """Get today's NBA games"""
    try:
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        tomorrow = today + timedelta(days=1)

        games = await nba_service.get_nba_games(start_date=today, end_date=tomorrow)

        logger.info(f"Retrieved {len(games)} NBA games for today")
        return games

    except Exception as e:
        logger.error(f"Error fetching today's NBA games: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch today's games: {str(e)}"
        )


@router.get("/odds-comparison/", response_model=Dict[str, Any])
async def get_nba_odds_comparison():
    """Get NBA odds comparison across multiple sportsbooks"""
    try:
        odds_data = await nba_service.get_nba_odds_comparison()
        logger.info(
            f"Retrieved NBA odds comparison with {len(odds_data.get('odds', []))} games"
        )
        return odds_data

    except Exception as e:
        logger.error(f"Error fetching NBA odds comparison: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch odds comparison: {str(e)}"
        )


@router.get("/odds-comparison/team/{team_id}")
async def get_team_odds(team_id: int):
    """Get odds for games involving a specific team"""
    try:
        # Get team's upcoming games
        today = datetime.now()
        week_ahead = today + timedelta(days=7)

        games = await nba_service.get_nba_games(
            start_date=today, end_date=week_ahead, team_id=team_id
        )

        # Get odds for these games
        all_odds = await nba_service.get_nba_odds_comparison()

        # Filter odds for this team's games
        team_odds = []
        game_ids = [f"nba_{game['id']}" for game in games]

        for odds in all_odds.get("odds", []):
            if odds.get("event_id") in game_ids:
                team_odds.append(odds)

        result = {
            "status": "ok",
            "team_id": team_id,
            "games_count": len(team_odds),
            "odds": team_odds,
            "period": f"{today.strftime('%Y-%m-%d')} to {week_ahead.strftime('%Y-%m-%d')}",
        }

        logger.info(
            f"Retrieved odds for {len(team_odds)} games involving team {team_id}"
        )
        return result

    except Exception as e:
        logger.error(f"Error fetching team odds for team {team_id}: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch team odds: {str(e)}"
        )


@router.get("/standings")
async def get_nba_standings():
    """Get NBA standings (placeholder - would integrate with standings API)"""
    # TODO: Integrate with actual NBA standings API
    return {
        "status": "ok",
        "message": "NBA standings endpoint - coming soon",
        "eastern_conference": [],
        "western_conference": [],
    }


@router.get("/stats/teams")
async def get_team_stats():
    """Get NBA team statistics (placeholder)"""
    # TODO: Integrate with NBA stats API
    return {
        "status": "ok",
        "message": "NBA team stats endpoint - coming soon",
        "teams": [],
    }


@router.get("/stats/players")
async def get_player_stats(
    team_id: int = Query(None, description="Filter by team ID"),
    position: str = Query(None, description="Filter by position"),
):
    """Get NBA player statistics (placeholder)"""
    # TODO: Integrate with NBA stats API
    return {
        "status": "ok",
        "message": "NBA player stats endpoint - coming soon",
        "players": [],
        "filters": {"team_id": team_id, "position": position},
    }
