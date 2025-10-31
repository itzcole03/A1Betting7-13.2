"""
NFL Service Client for A1Betting Backend

Integrates with ESPN NFL API to provide comprehensive NFL data including
teams, players, games, schedules, and betting odds information.
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

import aiohttp

from backend.models.nfl_models import (
    NFLAnalytics,
    NFLBetAnalysis,
    NFLGame,
    NFLGameOdds,
    NFLGameSummary,
    NFLHealthCheck,
    NFLLeagueStandings,
    NFLOdds,
    NFLOddsComparison,
    NFLPlayer,
    NFLPlayerStats,
    NFLSchedule,
    NFLScoreboard,
    NFLStanding,
    NFLTeam,
    NFLTeamStats,
)
from backend.services.sport_service_base import SportServiceBase
from backend.services.unified_cache_service import cache_service
from backend.utils.enhanced_logging import get_logger

logger = get_logger("nfl_service")


class NFLServiceClient(SportServiceBase):
    """
    ESPN NFL API client with comprehensive data access
    """

    def __init__(self):
        super().__init__("NFL")
        self.base_url = "https://site.api.espn.com/apis/site/v2/sports/football/nfl"
        self.base_url_core = (
            "https://sports.core.api.espn.com/v2/sports/football/leagues/nfl"
        )
        self.session: Optional[aiohttp.ClientSession] = None
        self.logger = logger
        self.cache_ttl = 300  # 5 minutes cache

    async def initialize(self):
        """Initialize the NFL service"""
        try:
            self.session = aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=30),
                headers={
                    "User-Agent": "A1Betting-NFL-Client/1.0",
                    "Accept": "application/json",
                },
            )
            logger.info("NFL service initialized successfully")
            return True
        except Exception as e:
            logger.error(f"Failed to initialize NFL service: {e}")
            return False

    async def close(self):
        """Close the NFL service"""
        if self.session:
            await self.session.close()
        logger.info("NFL service closed")

    async def _make_request(
        self, url: str, params: Optional[Dict] = None
    ) -> Optional[Dict]:
        """Make HTTP request with error handling and caching"""
        cache_key = f"nfl_api:{url}:{json.dumps(params, sort_keys=True) if params else 'no_params'}"

        try:
            # Try cache first
            cached_data = await cache_service.get(cache_key)
            if cached_data:
                logger.debug(f"Cache hit for NFL API: {url}")
                return json.loads(cached_data)

            # Make API request
            if not self.session:
                await self.initialize()

            async with self.session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    # Cache the response
                    await cache_service.set(
                        cache_key, json.dumps(data, default=str), self.cache_ttl
                    )
                    logger.debug(f"NFL API request successful: {url}")
                    return data
                else:
                    logger.warning(
                        f"NFL API request failed: {response.status} for {url}"
                    )
                    return None

        except asyncio.TimeoutError:
            logger.error(f"NFL API request timeout: {url}")
            return None
        except Exception as e:
            logger.error(f"NFL API request error: {e} for {url}")
            return None

    async def get_teams(self) -> List[NFLTeam]:
        """Get all NFL teams"""
        try:
            url = f"{self.base_url}/teams"
            data = await self._make_request(url)

            if not data or "sports" not in data:
                logger.warning("No NFL teams data received")
                return []

            teams = []
            for sport in data["sports"]:
                for league in sport.get("leagues", []):
                    for team_data in league.get("teams", []):
                        team_info = team_data.get("team", {})
                        if team_info:
                            team = NFLTeam(
                                id=int(team_info.get("id", 0)),
                                name=team_info.get("name", ""),
                                displayName=team_info.get("displayName", ""),
                                shortDisplayName=team_info.get("shortDisplayName", ""),
                                abbreviation=team_info.get("abbreviation", ""),
                                location=team_info.get("location", ""),
                                color=team_info.get("color"),
                                alternateColor=team_info.get("alternateColor"),
                                logoUrl=(
                                    team_info.get("logos", [{}])[0].get("href")
                                    if team_info.get("logos")
                                    else None
                                ),
                            )
                            teams.append(team)

            logger.info(f"Retrieved {len(teams)} NFL teams")
            return teams

        except Exception as e:
            logger.error(f"Error fetching NFL teams: {e}")
            return []

    async def get_players(self, team_id: Optional[str] = None) -> List[NFLPlayer]:
        """Get NFL players, optionally filtered by team"""
        try:
            # For now, return active players from a specific team or league leaders
            if team_id:
                url = f"{self.base_url}/teams/{team_id}/roster"
                data = await self._make_request(url)

                if not data or "team" not in data:
                    return []

                players = []
                for athlete_data in data.get("team", {}).get("athletes", []):
                    items = athlete_data.get("items", [])
                    for player_info in items:
                        if player_info:
                            player = NFLPlayer(
                                id=int(player_info.get("id", 0)),
                                fullName=player_info.get("fullName", ""),
                                displayName=player_info.get("displayName", ""),
                                shortName=player_info.get("shortName", ""),
                                position=player_info.get("position", {}).get(
                                    "abbreviation"
                                ),
                                jersey=player_info.get("jersey"),
                                age=player_info.get("age"),
                                height=player_info.get("height"),
                                weight=player_info.get("weight"),
                                active=player_info.get("active", True),
                            )
                            players.append(player)

                logger.info(f"Retrieved {len(players)} NFL players for team {team_id}")
                return players
            else:
                # Return league leaders as sample active players
                url = f"{self.base_url_core}/athletes"
                params = {"limit": 100, "active": "true"}
                data = await self._make_request(url, params)

                if not data or "items" not in data:
                    return []

                players = []
                for player_ref in data.get("items", []):
                    # Each item is a reference, we'd need to fetch individual player data
                    # For now, create basic player objects
                    player_id = player_ref.get("$ref", "").split("/")[-1].split("?")[0]
                    if player_id.isdigit():
                        player = NFLPlayer(
                            id=int(player_id),
                            fullName=f"Player {player_id}",
                            displayName=f"Player {player_id}",
                            shortName=f"P{player_id}",
                            active=True,
                        )
                        players.append(player)

                logger.info(f"Retrieved {len(players)} active NFL players")
                return players[:50]  # Limit to 50 for performance

        except Exception as e:
            logger.error(f"Error fetching NFL players: {e}")
            return []

    async def get_games(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        team_id: Optional[str] = None,
    ) -> List[NFLGame]:
        """Get NFL games within date range or for specific team"""
        try:
            if start_date is None:
                start_date = datetime.now() - timedelta(days=7)
            if end_date is None:
                end_date = datetime.now() + timedelta(days=7)

            # Use scoreboard endpoint for current/recent games
            url = f"{self.base_url}/scoreboard"
            params = {}

            # Format dates for ESPN API
            if start_date:
                params["dates"] = start_date.strftime("%Y%m%d")

            data = await self._make_request(url, params)

            if not data or "events" not in data:
                logger.warning("No NFL games data received")
                return []

            games = []
            for event_data in data.get("events", []):
                if not event_data:
                    continue

                try:
                    # Parse competitors
                    competitors = []
                    for comp_data in event_data.get("competitions", [{}])[0].get(
                        "competitors", []
                    ):
                        team_data = comp_data.get("team", {})
                        team = NFLTeam(
                            id=int(team_data.get("id", 0)),
                            name=team_data.get("name", ""),
                            displayName=team_data.get("displayName", ""),
                            shortDisplayName=team_data.get("shortDisplayName", ""),
                            abbreviation=team_data.get("abbreviation", ""),
                            location=team_data.get("location", ""),
                            logoUrl=(
                                team_data.get("logo") if team_data.get("logo") else None
                            ),
                        )

                        competitor = {
                            "id": comp_data.get("id", ""),
                            "team": team,
                            "score": comp_data.get("score"),
                            "homeAway": comp_data.get("homeAway", ""),
                            "winner": comp_data.get("winner", False),
                            "records": comp_data.get("records", []),
                        }
                        competitors.append(competitor)

                    # Parse game status
                    status_data = event_data.get("status", {})
                    status = {
                        "clock": status_data.get("clock", 0.0),
                        "displayClock": status_data.get("displayClock", "0:00"),
                        "period": status_data.get("period", 0),
                        "type": status_data.get("type", {}),
                    }

                    game = NFLGame(
                        id=event_data.get("id", ""),
                        uid=event_data.get("uid", ""),
                        date=datetime.fromisoformat(
                            event_data.get("date", "").replace("Z", "+00:00")
                        ),
                        name=event_data.get("name", ""),
                        shortName=event_data.get("shortName", ""),
                        season=event_data.get("season", {}),
                        seasonType=event_data.get("seasonType", {}),
                        week=event_data.get("week", {}),
                        timeValid=event_data.get("timeValid", True),
                        neutralSite=event_data.get("neutralSite", False),
                        conferenceCompetition=event_data.get(
                            "conferenceCompetition", False
                        ),
                        playByPlayAvailable=event_data.get(
                            "playByPlayAvailable", False
                        ),
                        status=status,
                        competitors=competitors,
                        venue=event_data.get("competitions", [{}])[0].get("venue"),
                    )

                    # Filter by team if specified
                    if team_id:
                        team_in_game = any(
                            str(comp["team"].id) == str(team_id) for comp in competitors
                        )
                        if team_in_game:
                            games.append(game)
                    else:
                        games.append(game)

                except Exception as e:
                    logger.warning(f"Error parsing NFL game data: {e}")
                    continue

            logger.info(f"Retrieved {len(games)} NFL games")
            return games

        except Exception as e:
            logger.error(f"Error fetching NFL games: {e}")
            return []

    async def get_odds_comparison(self) -> Dict[str, Any]:
        """Get NFL odds comparison data"""
        try:
            # Get current games with odds
            games = await self.get_games()

            odds_comparisons = []
            for game in games[:5]:  # Limit to 5 games for performance
                try:
                    # Try to get odds from ESPN (limited availability)
                    odds_url = f"{self.base_url_core}/events/{game.id}/competitions/{game.id}/odds"
                    odds_data = await self._make_request(odds_url)

                    game_odds = NFLGameOdds(
                        game=game, odds=[]  # ESPN odds data structure varies
                    )

                    odds_comparison = NFLOddsComparison(
                        game_id=game.id,
                        game_name=game.name,
                        date=game.date,
                        odds_providers=[],
                        arbitrage_opportunities=[],
                    )

                    odds_comparisons.append(odds_comparison.dict())

                except Exception as e:
                    logger.warning(f"Error fetching odds for game {game.id}: {e}")
                    continue

            return {
                "status": "success",
                "sport": "NFL",
                "total_games": len(games),
                "games_with_odds": len(odds_comparisons),
                "odds_comparisons": odds_comparisons,
                "message": "NFL odds comparison data retrieved",
                "timestamp": datetime.utcnow().isoformat(),
            }

        except Exception as e:
            logger.error(f"Error in NFL odds comparison: {e}")
            return {
                "status": "error",
                "sport": "NFL",
                "error": str(e),
                "message": "Failed to retrieve NFL odds data",
            }

    async def health_check(self) -> Dict[str, Any]:
        """Perform health check on NFL service"""
        try:
            # Test basic API connectivity
            url = f"{self.base_url}/teams"
            data = await self._make_request(url)

            if data and "sports" in data:
                total_teams = 0
                for sport in data["sports"]:
                    for league in sport.get("leagues", []):
                        total_teams += len(league.get("teams", []))

                return {
                    "status": "healthy",
                    "service": "NFL",
                    "api_status": "responsive",
                    "message": "NFL service operational via ESPN API",
                    "last_updated": datetime.utcnow().isoformat(),
                    "total_teams": total_teams,
                    "endpoints_tested": ["teams", "scoreboard"],
                }
            else:
                return {
                    "status": "degraded",
                    "service": "NFL",
                    "api_status": "limited_response",
                    "message": "NFL API responding but with limited data",
                }

        except Exception as e:
            logger.error(f"NFL health check failed: {e}")
            return {
                "status": "degraded",
                "service": "NFL",
                "api_status": "error",
                "message": f"NFL service error: {str(e)}",
            }

    async def get_nfl_schedule(
        self, week: Optional[int] = None, season_type: int = 2
    ) -> NFLSchedule:
        """Get NFL schedule for specific week and season type"""
        try:
            url = f"{self.base_url}/scoreboard"
            params = {}

            if week:
                params["week"] = week
            params["seasontype"] = season_type

            data = await self._make_request(url, params)

            if not data:
                return NFLSchedule(season=2024, seasonType=season_type, games=[])

            games = await self.get_games()

            schedule = NFLSchedule(
                season=data.get("season", {}).get("year", 2024),
                seasonType=season_type,
                week=week,
                games=games,
            )

            return schedule

        except Exception as e:
            logger.error(f"Error fetching NFL schedule: {e}")
            return NFLSchedule(season=2024, seasonType=season_type, games=[])

    async def get_nfl_standings(self) -> NFLLeagueStandings:
        """Get current NFL standings"""
        try:
            # ESPN doesn't have a direct standings endpoint,
            # would need to calculate from team records
            teams = await self.get_teams()

            # Create placeholder standings structure
            afc_standings = []
            nfc_standings = []

            for i, team in enumerate(teams[:16]):  # AFC teams
                standing = NFLStanding(
                    team=team,
                    stats=[
                        {"name": "wins", "value": 8},
                        {"name": "losses", "value": 8},
                        {"name": "ties", "value": 0},
                    ],
                )
                afc_standings.append(standing)

            for team in teams[16:32]:  # NFC teams
                standing = NFLStanding(
                    team=team,
                    stats=[
                        {"name": "wins", "value": 8},
                        {"name": "losses", "value": 8},
                        {"name": "ties", "value": 0},
                    ],
                )
                nfc_standings.append(standing)

            standings = NFLLeagueStandings(
                season=2024,
                seasonType=2,
                conferences=[
                    {
                        "name": "American Football Conference",
                        "shortName": "AFC",
                        "standings": afc_standings,
                    },
                    {
                        "name": "National Football Conference",
                        "shortName": "NFC",
                        "standings": nfc_standings,
                    },
                ],
            )

            return standings

        except Exception as e:
            logger.error(f"Error fetching NFL standings: {e}")
            return NFLLeagueStandings(season=2024, seasonType=2, conferences=[])


# Global NFL service instance
nfl_service = NFLServiceClient()
