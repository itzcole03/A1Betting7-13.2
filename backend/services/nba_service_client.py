"""
NBA API Service Client for A1Betting Backend

Provides NBA-specific data integration including teams, players,
games, and betting odds similar to the MLB implementation.
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

import aiohttp

from backend.config_manager import A1BettingConfig
from backend.services.sport_service_base import SportServiceBase
from backend.services.unified_cache_service import cache_service
from backend.utils.enhanced_logging import get_logger

logger = get_logger("nba_service")


class NBAServiceClient(SportServiceBase):
    """NBA data service client for teams, players, games, and odds"""

    def __init__(self):
        super().__init__("NBA")
        self.config = A1BettingConfig()
        self.base_url = "https://api.balldontlie.io/v1"  # Free NBA API
        self.session: Optional[aiohttp.ClientSession] = None
        self.rate_limit_delay = 1.0  # 1 second between requests

    async def initialize(self) -> None:
        """Initialize HTTP session for NBA API requests"""
        if not self.session:
            timeout = aiohttp.ClientTimeout(total=30)
            self.session = aiohttp.ClientSession(
                timeout=timeout,
                headers={
                    "User-Agent": "A1Betting-NBA-Client/1.0",
                    "Accept": "application/json",
                },
            )
            logger.info("NBA service client initialized")

    async def close(self) -> None:
        """Close HTTP session"""
        if self.session:
            await self.session.close()
            self.session = None

    async def get_teams(self) -> List[Dict[str, Any]]:
        """Get all NBA teams (implements SportServiceBase)"""
        return await self.get_nba_teams()

    async def get_players(self, team_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """Get NBA players (implements SportServiceBase)"""
        return await self.get_nba_players(team_id=team_id)

    async def get_games(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        team_id: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """Get NBA games (implements SportServiceBase)"""
        return await self.get_nba_games(
            start_date=start_date, end_date=end_date, team_id=team_id
        )

    async def get_odds_comparison(self) -> Dict[str, Any]:
        """Get NBA odds comparison (implements SportServiceBase)"""
        return await self.get_nba_odds_comparison()

    async def get_nba_teams(self) -> List[Dict[str, Any]]:
        """Get all NBA teams"""
        cache_key = "nba:teams:all"

        # Check cache first
        cached_teams = await cache_service.get(cache_key)
        if cached_teams:
            logger.info("Retrieved NBA teams from cache")
            return cached_teams

        await self.initialize()

        try:
            url = f"{self.base_url}/teams"
            async with self.session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    teams = data.get("data", [])

                    # Cache for 24 hours (teams don't change often)
                    await cache_service.set(cache_key, teams, ttl=86400)

                    logger.info(f"Retrieved {len(teams)} NBA teams")
                    return teams
                else:
                    logger.error(f"Failed to fetch NBA teams: {response.status}")
                    return []

        except Exception as e:
            logger.error(f"Error fetching NBA teams: {e}")
            return []

        finally:
            await asyncio.sleep(self.rate_limit_delay)

    async def get_nba_players(
        self, team_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Get NBA players, optionally filtered by team"""
        cache_key = f"nba:players:team_{team_id}" if team_id else "nba:players:all"

        # Check cache first
        cached_players = await cache_service.get(cache_key)
        if cached_players:
            logger.info(f"Retrieved NBA players from cache (team_id={team_id})")
            return cached_players

        await self.initialize()

        try:
            url = f"{self.base_url}/players"
            params = {}
            if team_id:
                params["team_ids[]"] = team_id

            async with self.session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    players = data.get("data", [])

                    # Cache for 6 hours
                    await cache_service.set(cache_key, players, ttl=21600)

                    logger.info(f"Retrieved {len(players)} NBA players")
                    return players
                else:
                    logger.error(f"Failed to fetch NBA players: {response.status}")
                    return []

        except Exception as e:
            logger.error(f"Error fetching NBA players: {e}")
            return []

        finally:
            await asyncio.sleep(self.rate_limit_delay)

    async def get_nba_games(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        team_id: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """Get NBA games for specified date range and/or team"""

        # Default to today's games if no dates specified
        if not start_date:
            start_date = datetime.now().replace(
                hour=0, minute=0, second=0, microsecond=0
            )
        if not end_date:
            end_date = start_date + timedelta(days=1)

        cache_key = f"nba:games:{start_date.strftime('%Y%m%d')}:{end_date.strftime('%Y%m%d')}:team_{team_id}"

        # Check cache first
        cached_games = await cache_service.get(cache_key)
        if cached_games:
            logger.info(f"Retrieved NBA games from cache")
            return cached_games

        await self.initialize()

        try:
            url = f"{self.base_url}/games"
            params = {
                "start_date": start_date.strftime("%Y-%m-%d"),
                "end_date": end_date.strftime("%Y-%m-%d"),
            }

            if team_id:
                params["team_ids[]"] = team_id

            async with self.session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    games = data.get("data", [])

                    # Cache for 30 minutes for recent games, 24 hours for past games
                    ttl = 1800 if start_date.date() >= datetime.now().date() else 86400
                    await cache_service.set(cache_key, games, ttl=ttl)

                    logger.info(f"Retrieved {len(games)} NBA games")
                    return games
                else:
                    logger.error(f"Failed to fetch NBA games: {response.status}")
                    return []

        except Exception as e:
            logger.error(f"Error fetching NBA games: {e}")
            return []

        finally:
            await asyncio.sleep(self.rate_limit_delay)

    async def get_nba_odds_comparison(self) -> Dict[str, Any]:
        """Get NBA odds comparison across multiple sportsbooks"""
        cache_key = "nba:odds:comparison"

        # Check cache first (short TTL for odds)
        cached_odds = await cache_service.get(cache_key)
        if cached_odds:
            logger.info("Retrieved NBA odds comparison from cache")
            return cached_odds

        try:
            # Get today's games first
            games = await self.get_nba_games()

            # For now, return mock odds data structure
            # TODO: Integrate with actual sportsbook APIs
            odds_data = {
                "status": "ok",
                "sport": "NBA",
                "odds": [],
                "games_count": len(games),
                "last_updated": datetime.now().isoformat(),
                "providers": ["fanduel", "draftkings", "betmgm"],  # Placeholder
            }

            # Add mock odds for each game
            for game in games:
                if game.get("home_team") and game.get("visitor_team"):
                    home_team = game["home_team"]["full_name"]
                    away_team = game["visitor_team"]["full_name"]

                    # Mock odds data
                    game_odds = {
                        "event_id": f"nba_{game['id']}",
                        "event_name": f"{away_team} vs {home_team}",
                        "start_time": game.get("date", ""),
                        "home_team": home_team,
                        "away_team": away_team,
                        "odds": {
                            "moneyline": {"home": 1.85, "away": 1.95},
                            "spread": {
                                "home": {"line": -3.5, "odds": 1.91},
                                "away": {"line": 3.5, "odds": 1.91},
                            },
                            "total": {
                                "over": {"line": 215.5, "odds": 1.91},
                                "under": {"line": 215.5, "odds": 1.91},
                            },
                        },
                    }
                    odds_data["odds"].append(game_odds)

            # Cache for 5 minutes (odds change frequently)
            await cache_service.set(cache_key, odds_data, ttl=300)

            logger.info(
                f"Generated NBA odds comparison for {len(odds_data['odds'])} games"
            )
            return odds_data

        except Exception as e:
            logger.error(f"Error generating NBA odds comparison: {e}")
            return {"status": "error", "sport": "NBA", "odds": [], "error": str(e)}

    async def health_check(self) -> Dict[str, Any]:
        """Health check for NBA service"""
        try:
            await self.initialize()

            # Test API connectivity
            url = f"{self.base_url}/teams"
            async with self.session.get(url) as response:
                if response.status == 200:
                    return {
                        "status": "healthy",
                        "service": "NBA",
                        "api_status": "connected",
                        "response_time_ms": response.headers.get(
                            "X-Response-Time", "unknown"
                        ),
                    }
                else:
                    return {
                        "status": "degraded",
                        "service": "NBA",
                        "api_status": f"http_{response.status}",
                        "message": "API not responding correctly",
                    }

        except Exception as e:
            return {
                "status": "unhealthy",
                "service": "NBA",
                "api_status": "disconnected",
                "error": str(e),
            }


# Global NBA service instance
nba_service = NBAServiceClient()
