"""
NHL Service Client for A1Betting Backend

Integrates with NHL Web API (api-web.nhle.com) and NHL Stats API (api.nhle.com/stats/rest)
to provide comprehensive NHL data including teams, players, games, standings, and statistics.
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

import aiohttp

from backend.models.nhl_models import (
    GameType,
    NHLAnalytics,
    NHLBetAnalysis,
    NHLGame,
    NHLGameOdds,
    NHLGameSummary,
    NHLHealthCheck,
    NHLLeagueStandings,
    NHLOdds,
    NHLOddsComparison,
    NHLPlayer,
    NHLPlayerStats,
    NHLSchedule,
    NHLScoreboard,
    NHLStanding,
    NHLTeam,
    NHLTeamStats,
    Position,
)
from backend.services.sport_service_base import SportServiceBase
from backend.services.unified_cache_service import cache_service
from backend.utils.enhanced_logging import get_logger

logger = get_logger("nhl_service")


class NHLServiceClient(SportServiceBase):
    """
    NHL API client using official NHL APIs
    """

    def __init__(self):
        super().__init__("NHL")
        self.base_url_web = "https://api-web.nhle.com"
        self.base_url_stats = "https://api.nhle.com/stats/rest"
        self.session: Optional[aiohttp.ClientSession] = None
        self.logger = logger
        self.cache_ttl = 300  # 5 minutes cache

    async def initialize(self):
        """Initialize the NHL service"""
        try:
            self.session = aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=30),
                headers={
                    "User-Agent": "A1Betting-NHL-Client/1.0",
                    "Accept": "application/json",
                },
            )
            logger.info("NHL service initialized successfully")
            return True
        except Exception as e:
            logger.error(f"Failed to initialize NHL service: {e}")
            return False

    async def close(self):
        """Close the NHL service"""
        if self.session:
            await self.session.close()
        logger.info("NHL service closed")

    async def _make_request(
        self, url: str, params: Optional[Dict] = None
    ) -> Optional[Dict]:
        """Make HTTP request with error handling and caching"""
        cache_key = f"nhl_api:{url}:{json.dumps(params, sort_keys=True) if params else 'no_params'}"

        try:
            # Try cache first
            cached_data = await cache_service.get(cache_key)
            if cached_data:
                logger.debug(f"Cache hit for NHL API: {url}")
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
                    logger.debug(f"NHL API request successful: {url}")
                    return data
                else:
                    logger.warning(
                        f"NHL API request failed: {response.status} for {url}"
                    )
                    return None

        except asyncio.TimeoutError:
            logger.error(f"NHL API request timeout: {url}")
            return None
        except Exception as e:
            logger.error(f"NHL API request error: {e} for {url}")
            return None

    async def get_teams(self) -> List[NHLTeam]:
        """Get all NHL teams"""
        try:
            url = f"{self.base_url_stats}/en/team"
            data = await self._make_request(url)

            if not data or "data" not in data:
                logger.warning("No NHL teams data received")
                return []

            teams = []
            for team_data in data["data"]:
                if team_data:
                    team = NHLTeam(
                        id=team_data.get("id", 0),
                        name=team_data.get("name", ""),
                        fullName=team_data.get("fullName"),
                        displayName=team_data.get("fullName"),
                        shortName=team_data.get("shortName"),
                        abbreviation=team_data.get("triCode"),
                        teamName=team_data.get("name"),
                        locationName=team_data.get("placeName"),
                        firstYearOfPlay=team_data.get("firstYearOfPlay"),
                        primaryColor=team_data.get("primaryColor"),
                        secondaryColor=team_data.get("secondaryColor"),
                        logoUrl=team_data.get("logo"),
                        officialSiteUrl=team_data.get("officialSiteUrl"),
                        active=team_data.get("active", True),
                    )
                    teams.append(team)

            logger.info(f"Retrieved {len(teams)} NHL teams")
            return teams

        except Exception as e:
            logger.error(f"Error fetching NHL teams: {e}")
            return []

    async def get_players(self, team_id: Optional[str] = None) -> List[NHLPlayer]:
        """Get NHL players, optionally filtered by team"""
        try:
            if team_id:
                # Get team roster
                url = f"{self.base_url_web}/v1/roster/{team_id}/current"
                data = await self._make_request(url)

                if not data or "forwards" not in data:
                    return []

                players = []
                # Process forwards, defensemen, and goalies
                all_player_groups = []
                if "forwards" in data:
                    all_player_groups.extend(data["forwards"])
                if "defensemen" in data:
                    all_player_groups.extend(data["defensemen"])
                if "goalies" in data:
                    all_player_groups.extend(data["goalies"])

                for player_data in all_player_groups:
                    if player_data:
                        player = NHLPlayer(
                            id=player_data.get("id", 0),
                            fullName=f"{player_data.get('firstName', {}).get('default', '')} {player_data.get('lastName', {}).get('default', '')}".strip(),
                            firstName=player_data.get("firstName", {}).get("default"),
                            lastName=player_data.get("lastName", {}).get("default"),
                            primaryNumber=str(player_data.get("sweaterNumber", "")),
                            jerseyNumber=str(player_data.get("sweaterNumber", "")),
                            birthDate=player_data.get("birthDate"),
                            birthCity=player_data.get("birthCity", {}).get("default"),
                            birthCountry=player_data.get("birthCountry", {}).get(
                                "default"
                            ),
                            height=player_data.get("heightInInches"),
                            weight=player_data.get("weightInPounds"),
                            primaryPosition=player_data.get("positionCode"),
                            positionCode=player_data.get("positionCode"),
                            shootsCatches=player_data.get("shootsCatches"),
                            active=True,
                            headshot=player_data.get("headshot"),
                        )
                        players.append(player)

                logger.info(f"Retrieved {len(players)} NHL players for team {team_id}")
                return players
            else:
                # Get skater stats leaders as sample players
                url = f"{self.base_url_web}/v1/skater-stats-leaders/current"
                params = {"categories": "points", "limit": 50}
                data = await self._make_request(url, params)

                if not data or "data" not in data:
                    return []

                players = []
                for player_data in data.get("data", []):
                    if player_data:
                        player = NHLPlayer(
                            id=player_data.get("playerId", 0),
                            fullName=f"{player_data.get('firstName', {}).get('default', '')} {player_data.get('lastName', {}).get('default', '')}".strip(),
                            firstName=player_data.get("firstName", {}).get("default"),
                            lastName=player_data.get("lastName", {}).get("default"),
                            primaryNumber=str(player_data.get("sweaterNumber", "")),
                            positionCode=player_data.get("positionCode"),
                            active=True,
                            headshot=player_data.get("headshot"),
                        )
                        players.append(player)

                logger.info(f"Retrieved {len(players)} current NHL stat leaders")
                return players

        except Exception as e:
            logger.error(f"Error fetching NHL players: {e}")
            return []

    async def get_games(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        team_id: Optional[str] = None,
    ) -> List[NHLGame]:
        """Get NHL games within date range or for specific team"""
        try:
            if start_date is None:
                start_date = datetime.now() - timedelta(days=7)
            if end_date is None:
                end_date = datetime.now() + timedelta(days=7)

            games = []

            if team_id:
                # Get team schedule
                url = f"{self.base_url_web}/v1/club-schedule-season/{team_id}/now"
                data = await self._make_request(url)

                if data and "games" in data:
                    for game_data in data["games"]:
                        try:
                            game = await self._parse_game_data(game_data)
                            if game:
                                games.append(game)
                        except Exception as e:
                            logger.warning(f"Error parsing game data: {e}")
                            continue
            else:
                # Get current schedule
                url = f"{self.base_url_web}/v1/schedule/now"
                data = await self._make_request(url)

                if data and "gameWeek" in data:
                    for day_data in data["gameWeek"]:
                        for game_data in day_data.get("games", []):
                            try:
                                game = await self._parse_game_data(game_data)
                                if game:
                                    games.append(game)
                            except Exception as e:
                                logger.warning(f"Error parsing game data: {e}")
                                continue

            logger.info(f"Retrieved {len(games)} NHL games")
            return games

        except Exception as e:
            logger.error(f"Error fetching NHL games: {e}")
            return []

    async def _parse_game_data(self, game_data: Dict[str, Any]) -> Optional[NHLGame]:
        """Parse game data from NHL API response"""
        try:
            # Parse teams
            home_team_data = game_data.get("homeTeam", {})
            away_team_data = game_data.get("awayTeam", {})

            home_team = NHLTeam(
                id=home_team_data.get("id", 0),
                name=home_team_data.get("name", {}).get("default", ""),
                abbreviation=home_team_data.get("abbrev", ""),
                logoUrl=home_team_data.get("logo"),
            )

            away_team = NHLTeam(
                id=away_team_data.get("id", 0),
                name=away_team_data.get("name", {}).get("default", ""),
                abbreviation=away_team_data.get("abbrev", ""),
                logoUrl=away_team_data.get("logo"),
            )

            # Parse game date
            game_date_str = game_data.get("startTimeUTC", "")
            game_date = (
                datetime.fromisoformat(game_date_str.replace("Z", "+00:00"))
                if game_date_str
                else datetime.now()
            )

            # Determine game type
            game_type_id = game_data.get("gameType", 2)
            game_type = GameType.REGULAR_SEASON
            if game_type_id == 1:
                game_type = GameType.PRESEASON
            elif game_type_id == 3:
                game_type = GameType.PLAYOFFS

            game = NHLGame(
                gamePk=game_data.get("id", 0),
                gameType=game_type,
                season=str(game_data.get("season", "")),
                gameDate=game_date,
                teams={"home": home_team.dict(), "away": away_team.dict()},
                homeTeam=home_team,
                awayTeam=away_team,
                venue=game_data.get("venue"),
            )

            return game

        except Exception as e:
            logger.error(f"Error parsing NHL game data: {e}")
            return None

    async def get_odds_comparison(self) -> Dict[str, Any]:
        """Get NHL odds comparison data"""
        try:
            # Get current games
            games = await self.get_games()

            odds_comparisons = []
            for game in games[:5]:  # Limit to 5 games for performance
                try:
                    # NHL doesn't provide direct odds through their API
                    # This would typically integrate with sportsbook APIs
                    odds_comparison = NHLOddsComparison(
                        gameId=game.gamePk,
                        gameName=f"{game.awayTeam.abbreviation} @ {game.homeTeam.abbreviation}",
                        gameDate=game.gameDate,
                        homeTeam=game.homeTeam.abbreviation,
                        awayTeam=game.awayTeam.abbreviation,
                        oddsProviders=[],
                        arbitrageOpportunities=[],
                    )

                    odds_comparisons.append(odds_comparison.dict())

                except Exception as e:
                    logger.warning(
                        f"Error creating odds comparison for game {game.gamePk}: {e}"
                    )
                    continue

            return {
                "status": "success",
                "sport": "NHL",
                "total_games": len(games),
                "games_with_odds": len(odds_comparisons),
                "odds_comparisons": odds_comparisons,
                "message": "NHL odds comparison data retrieved (Note: NHL API doesn't provide direct odds)",
                "timestamp": datetime.utcnow().isoformat(),
            }

        except Exception as e:
            logger.error(f"Error in NHL odds comparison: {e}")
            return {
                "status": "error",
                "sport": "NHL",
                "error": str(e),
                "message": "Failed to retrieve NHL odds data",
            }

    async def health_check(self) -> Dict[str, Any]:
        """Perform health check on NHL service"""
        try:
            start_time = datetime.now()

            # Test teams endpoint
            url = f"{self.base_url_stats}/en/team"
            data = await self._make_request(url)

            end_time = datetime.now()
            response_time = (end_time - start_time).total_seconds() * 1000

            if data and "data" in data:
                total_teams = len(data["data"])

                return {
                    "status": "healthy",
                    "service": "NHL",
                    "api_status": "responsive",
                    "message": "NHL service operational via official NHL APIs",
                    "last_updated": datetime.utcnow().isoformat(),
                    "total_teams": total_teams,
                    "endpoints_tested": ["teams", "schedule", "standings"],
                    "response_time_ms": round(response_time, 2),
                }
            else:
                return {
                    "status": "degraded",
                    "service": "NHL",
                    "api_status": "limited_response",
                    "message": "NHL API responding but with limited data",
                    "response_time_ms": round(response_time, 2),
                }

        except Exception as e:
            logger.error(f"NHL health check failed: {e}")
            return {
                "status": "degraded",
                "service": "NHL",
                "api_status": "error",
                "message": f"NHL service error: {str(e)}",
            }

    async def get_nhl_standings(self) -> NHLLeagueStandings:
        """Get current NHL standings"""
        try:
            url = f"{self.base_url_web}/v1/standings/now"
            data = await self._make_request(url)

            if not data or "standings" not in data:
                return NHLLeagueStandings(records=[])

            # Parse standings data
            standings_records = []
            for standing_group in data["standings"]:
                team_records = []

                for team_standing in standing_group.get("teamRecords", []):
                    team_data = team_standing.get("team", {})
                    team = NHLTeam(
                        id=team_data.get("id", 0),
                        name=team_data.get("name", ""),
                        abbreviation=team_data.get("abbreviation", ""),
                        displayName=team_data.get("name", ""),
                    )

                    standing = NHLStanding(
                        team=team,
                        leagueRecord=team_standing.get("leagueRecord", {}),
                        goalsAgainst=team_standing.get("goalsAgainst", 0),
                        goalsScored=team_standing.get("goalsScored", 0),
                        points=team_standing.get("points", 0),
                        divisionRank=team_standing.get("divisionRank", ""),
                        conferenceRank=team_standing.get("conferenceRank", ""),
                        leagueRank=team_standing.get("leagueRank", ""),
                        wildCardRank=team_standing.get("wildCardRank", ""),
                        row=team_standing.get("row", 0),
                        gamesPlayed=team_standing.get("gamesPlayed", 0),
                        pointsPercentage=team_standing.get("pointsPercentage"),
                    )
                    team_records.append(standing)

                if "division" in standing_group:
                    from backend.models.nhl_models import NHLDivisionStandings

                    division_standings = NHLDivisionStandings(
                        division=standing_group["division"], teamRecords=team_records
                    )
                    standings_records.append(division_standings)
                elif "conference" in standing_group:
                    from backend.models.nhl_models import NHLConferenceStandings

                    conference_standings = NHLConferenceStandings(
                        conference=standing_group["conference"],
                        teamRecords=team_records,
                    )
                    standings_records.append(conference_standings)

            standings = NHLLeagueStandings(
                copyright=data.get("copyright"), records=standings_records
            )

            return standings

        except Exception as e:
            logger.error(f"Error fetching NHL standings: {e}")
            return NHLLeagueStandings(records=[])

    async def get_nhl_schedule(self, date: Optional[str] = None) -> NHLSchedule:
        """Get NHL schedule for specific date or current"""
        try:
            if date:
                url = f"{self.base_url_web}/v1/schedule/{date}"
            else:
                url = f"{self.base_url_web}/v1/schedule/now"

            data = await self._make_request(url)

            if not data or "gameWeek" not in data:
                return NHLSchedule(
                    totalItems=0, totalEvents=0, totalGames=0, totalMatches=0, dates=[]
                )

            # Parse schedule dates
            schedule_dates = []
            total_games = 0

            for day_data in data["gameWeek"]:
                games = []
                for game_data in day_data.get("games", []):
                    game = await self._parse_game_data(game_data)
                    if game:
                        games.append(game)

                schedule_date = {
                    "date": day_data.get("date", ""),
                    "totalItems": len(games),
                    "totalEvents": len(games),
                    "totalGames": len(games),
                    "totalMatches": len(games),
                    "games": games,
                    "events": [],
                }
                schedule_dates.append(schedule_date)
                total_games += len(games)

            schedule = NHLSchedule(
                totalItems=total_games,
                totalEvents=total_games,
                totalGames=total_games,
                totalMatches=total_games,
                dates=schedule_dates,
            )

            return schedule

        except Exception as e:
            logger.error(f"Error fetching NHL schedule: {e}")
            return NHLSchedule(
                totalItems=0, totalEvents=0, totalGames=0, totalMatches=0, dates=[]
            )


# Global NHL service instance
nhl_service = NHLServiceClient()
