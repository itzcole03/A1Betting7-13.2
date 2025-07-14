"""Specialist API Integration for A1Betting Platform

This module implements production-ready integrations with:
- Sportradar API (Live sports data, statistics, lineups)
- PrizePicks API (Player props, contests, picks)
- ESPN API (News, additional statistics)
- TheOdds API (Live betting odds)

Each integration follows the "Specialist & Strategist" architecture pattern.
"""

import asyncio
import logging
import os
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import httpx


# Simple in-memory cache implementation
class SimpleCache:
    def __init__(self, maxsize: int, ttl: int):
        self.maxsize = maxsize
        self.ttl = ttl
        self._cache: Dict[str, Any] = {}
        self._timestamps: Dict[str, float] = {}

    def __contains__(self, key: str) -> bool:
        if key in self._cache:
            if time.time() - self._timestamps[key] < self.ttl:
                return True
            else:
                # Expired, remove it
                del self._cache[key]
                del self._timestamps[key]
        return False

    def __getitem__(self, key: str) -> Any:
        if key in self:
            return self._cache[key]
        raise KeyError(key)

    def __setitem__(self, key: str, value: Any) -> None:
        # Simple eviction if at max size
        if len(self._cache) >= self.maxsize and key not in self._cache:
            # Remove oldest entry
            oldest_key = min(self._timestamps.keys(), key=lambda k: self._timestamps[k])
            del self._cache[oldest_key]
            del self._timestamps[oldest_key]

        self._cache[key] = value
        self._timestamps[key] = time.time()


logger = logging.getLogger(__name__)

# Cache configuration
CACHE_TTL = 300  # 5 minutes
MAX_CACHE_SIZE = 1000


@dataclass
class SportingEvent:
    """Standard sporting event data structure"""

    event_id: str
    sport: str
    league: str
    home_team: str
    away_team: str
    start_time: datetime
    status: str
    home_score: Optional[int] = None
    away_score: Optional[int] = None
    period: Optional[str] = None
    venue: Optional[str] = None


@dataclass
class PlayerStats:
    """Standard player statistics structure"""

    player_id: str
    player_name: str
    team: str
    position: str
    stats: Dict[str, Any]
    game_id: str


@dataclass
class BettingOdds:
    """Standard betting odds structure"""

    event_id: str
    market: str
    sportsbook: str
    odds: float
    outcome: str
    last_updated: datetime


@dataclass
class PlayerProp:
    """Standard player prop structure"""

    prop_id: str
    player_name: str
    stat_type: str
    line: float
    over_odds: float
    under_odds: float
    game_id: str


class SpecialistAPI(ABC):
    """Abstract base class for specialist API integrations"""

    def __init__(self, api_key: str, base_url: str, name: str):
        self.api_key = api_key
        self.base_url = base_url
        self.name = name
        self.cache = SimpleCache(maxsize=MAX_CACHE_SIZE, ttl=CACHE_TTL)
        self.client = httpx.AsyncClient(timeout=30.0)

    @abstractmethod
    async def get_live_games(self, sport: str) -> List[SportingEvent]:
        """Get live games for a sport"""
        pass

    @abstractmethod
    async def get_player_stats(self, game_id: str) -> List[PlayerStats]:
        """Get player statistics for a game"""
        pass

    async def _make_request(
        self, endpoint: str, params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Make authenticated API request with error handling"""
        cache_key = f"{self.name}:{endpoint}:{str(params)}"

        if cache_key in self.cache:
            logger.info(f"Cache hit for {self.name} API: {endpoint}")
            return self.cache[cache_key]

        try:
            url = f"{self.base_url}/{endpoint.lstrip('/')}"
            headers = {"Authorization": f"Bearer {self.api_key}"}

            response = await self.client.get(url, headers=headers, params=params)
            response.raise_for_status()

            data = response.json()
            self.cache[cache_key] = data

            logger.info(f"Successfully fetched data from {self.name} API: {endpoint}")
            return data

        except httpx.HTTPStatusError as e:
            logger.error(
                f"HTTP error from {self.name} API: {e.response.status_code} - {e.response.text}"
            )
            raise
        except Exception as e:
            logger.error(f"Error calling {self.name} API: {e}")
            raise


class SportradarAPI(SpecialistAPI):
    """Sportradar API integration for live sports data"""

    def __init__(self, api_key: str):
        super().__init__(
            api_key=api_key, base_url="https://api.sportradar.us", name="Sportradar"
        )

    async def get_live_games(self, sport: str = "basketball") -> List[SportingEvent]:
        """Get live games from Sportradar"""
        try:
            # Map sport to Sportradar endpoint
            sport_endpoints = {
                "basketball": "nba/trial/v8/en/games/schedule.json",
                "football": "nfl/trial/v7/en/games/schedule.json",
                "baseball": "mlb/trial/v7/en/games/schedule.json",
                "soccer": "soccer-extended/trial/v4/en/schedules/live/schedule.json",
            }

            endpoint = sport_endpoints.get(sport, sport_endpoints["basketball"])
            data = await self._make_request(endpoint)

            games = []
            for game_data in data.get("games", []):
                event = SportingEvent(
                    event_id=game_data.get("id", ""),
                    sport=sport,
                    league=data.get("league", {}).get("name", ""),
                    home_team=game_data.get("home", {}).get("name", ""),
                    away_team=game_data.get("away", {}).get("name", ""),
                    start_time=datetime.fromisoformat(
                        game_data.get("scheduled", "").replace("Z", "+00:00")
                    ),
                    status=game_data.get("status", ""),
                    home_score=game_data.get("home_points"),
                    away_score=game_data.get("away_points"),
                    venue=game_data.get("venue", {}).get("name"),
                )
                games.append(event)

            return games

        except Exception as e:
            logger.error(f"Error fetching Sportradar live games: {e}")
            return []

    async def get_player_stats(self, game_id: str) -> List[PlayerStats]:
        """Get player statistics for a game"""
        try:
            endpoint = f"nba/trial/v8/en/games/{game_id}/statistics.json"
            data = await self._make_request(endpoint)

            stats_list = []
            for team in data.get("teams", []):
                for player in team.get("players", []):
                    player_stats = PlayerStats(
                        player_id=player.get("id", ""),
                        player_name=player.get("full_name", ""),
                        team=team.get("name", ""),
                        position=player.get("position", ""),
                        stats=player.get("statistics", {}),
                        game_id=game_id,
                    )
                    stats_list.append(player_stats)

            return stats_list

        except Exception as e:
            logger.error(f"Error fetching Sportradar player stats: {e}")
            return []


class PrizePicksAPI(SpecialistAPI):
    """PrizePicks API integration for player props"""

    def __init__(self, api_key: str):
        super().__init__(
            api_key=api_key, base_url="https://api.prizepicks.com", name="PrizePicks"
        )

    async def get_live_games(self, sport: str = "basketball") -> List[SportingEvent]:
        """Get live games with available props from PrizePicks"""
        try:
            endpoint = "projections"
            params = {"league": sport.upper()}
            data = await self._make_request(endpoint, params)

            # Extract unique games from props data
            games_dict = {}
            for projection in data.get("data", []):
                attributes = projection.get("attributes", {})
                game_id = (
                    f"pp_{attributes.get('start_time')}_{attributes.get('league')}"
                )

                if game_id not in games_dict:
                    games_dict[game_id] = SportingEvent(
                        event_id=game_id,
                        sport=sport,
                        league=attributes.get("league", ""),
                        home_team="TBD",  # PrizePicks doesn't always provide team matchup
                        away_team="TBD",
                        start_time=datetime.fromisoformat(
                            attributes.get("start_time", "").replace("Z", "+00:00")
                        ),
                        status="upcoming",
                    )

            return list(games_dict.values())

        except Exception as e:
            logger.error(f"Error fetching PrizePicks games: {e}")
            return []

    async def get_player_props(self, sport: str = "basketball") -> List[PlayerProp]:
        """Get player props from PrizePicks"""
        try:
            endpoint = "projections"
            params = {"league": sport.upper()}
            data = await self._make_request(endpoint, params)

            props = []
            for projection in data.get("data", []):
                attributes = projection.get("attributes", {})

                prop = PlayerProp(
                    prop_id=projection.get("id", ""),
                    player_name=attributes.get("description", "").split(" ")[
                        0:2
                    ],  # Extract player name
                    stat_type=attributes.get("stat_type", ""),
                    line=float(attributes.get("line_score", 0)),
                    over_odds=attributes.get(
                        "odds_type", 1.9
                    ),  # PrizePicks typically uses standard odds
                    under_odds=attributes.get("odds_type", 1.9),
                    game_id=f"pp_{attributes.get('start_time')}",
                )
                props.append(prop)

            return props

        except Exception as e:
            logger.error(f"Error fetching PrizePicks props: {e}")
            return []

    async def get_player_stats(self, game_id: str) -> List[PlayerStats]:
        """PrizePicks doesn't provide detailed player stats"""
        return []


class ESPNAPI(SpecialistAPI):
    """ESPN API integration for news and additional data"""

    def __init__(self, api_key: str = ""):
        super().__init__(
            api_key=api_key,  # ESPN API is mostly public
            base_url="https://site.api.espn.com/apis/site/v2/sports",
            name="ESPN",
        )

    async def get_live_games(self, sport: str = "basketball") -> List[SportingEvent]:
        """Get live games from ESPN"""
        try:
            # Map sport to ESPN endpoint
            sport_endpoints = {
                "basketball": "basketball/nba/scoreboard",
                "football": "football/nfl/scoreboard",
                "baseball": "baseball/mlb/scoreboard",
                "soccer": "soccer/scoreboard",
            }

            endpoint = sport_endpoints.get(sport, sport_endpoints["basketball"])
            data = await self._make_request(endpoint)

            games = []
            for event in data.get("events", []):
                competitions = event.get("competitions", [{}])[0]
                competitors = competitions.get("competitors", [])

                home_team = ""
                away_team = ""
                home_score = None
                away_score = None

                for comp in competitors:
                    if comp.get("homeAway") == "home":
                        home_team = comp.get("team", {}).get("displayName", "")
                        home_score = comp.get("score")
                    else:
                        away_team = comp.get("team", {}).get("displayName", "")
                        away_score = comp.get("score")

                game = SportingEvent(
                    event_id=event.get("id", ""),
                    sport=sport,
                    league=event.get("league", {}).get("name", ""),
                    home_team=home_team,
                    away_team=away_team,
                    start_time=datetime.fromisoformat(
                        event.get("date", "").replace("Z", "+00:00")
                    ),
                    status=event.get("status", {})
                    .get("type", {})
                    .get("description", ""),
                    home_score=int(home_score) if home_score else None,
                    away_score=int(away_score) if away_score else None,
                    venue=competitions.get("venue", {}).get("fullName"),
                )
                games.append(game)

            return games

        except Exception as e:
            logger.error(f"Error fetching ESPN games: {e}")
            return []

    async def get_player_stats(self, game_id: str) -> List[PlayerStats]:
        """Get player statistics from ESPN"""
        try:
            endpoint = f"basketball/nba/summary?event={game_id}"
            data = await self._make_request(endpoint)

            stats_list = []
            for team in data.get("boxscore", {}).get("teams", []):
                for player in team.get("statistics", [{}])[0].get("athletes", []):
                    athlete = player.get("athlete", {})
                    stats = {}

                    # Convert ESPN stats format
                    for stat in player.get("stats", []):
                        stats[stat.get("name", "")] = stat.get("value", 0)

                    player_stats = PlayerStats(
                        player_id=athlete.get("id", ""),
                        player_name=athlete.get("displayName", ""),
                        team=team.get("team", {}).get("displayName", ""),
                        position=athlete.get("position", {}).get("abbreviation", ""),
                        stats=stats,
                        game_id=game_id,
                    )
                    stats_list.append(player_stats)

            return stats_list

        except Exception as e:
            logger.error(f"Error fetching ESPN player stats: {e}")
            return []

    async def get_news(
        self, sport: str = "basketball", limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get latest sports news from ESPN"""
        try:
            sport_endpoints = {
                "basketball": "basketball/nba/news",
                "football": "football/nfl/news",
                "baseball": "baseball/mlb/news",
                "soccer": "soccer/news",
            }

            endpoint = sport_endpoints.get(sport, sport_endpoints["basketball"])
            params = {"limit": limit}
            data = await self._make_request(endpoint, params)

            news_items = []
            for article in data.get("articles", []):
                news_item = {
                    "id": article.get("id"),
                    "headline": article.get("headline"),
                    "description": article.get("description"),
                    "published": article.get("published"),
                    "link": article.get("links", {}).get("web", {}).get("href"),
                    "source": "ESPN",
                }
                news_items.append(news_item)

            return news_items

        except Exception as e:
            logger.error(f"Error fetching ESPN news: {e}")
            return []


class TheOddsAPI(SpecialistAPI):
    """TheOdds API integration for live betting odds"""

    def __init__(self, api_key: str):
        super().__init__(
            api_key=api_key, base_url="https://api.the-odds-api.com/v4", name="TheOdds"
        )

    async def get_live_games(self, sport: str = "basketball") -> List[SportingEvent]:
        """Get live games with odds from TheOdds API"""
        try:
            # Map sport to TheOdds API sport key
            sport_keys = {
                "basketball": "basketball_nba",
                "football": "americanfootball_nfl",
                "baseball": "baseball_mlb",
                "soccer": "soccer_epl",
            }

            sport_key = sport_keys.get(sport, sport_keys["basketball"])
            endpoint = f"sports/{sport_key}/odds"
            params = {
                "apiKey": self.api_key,
                "regions": "us",
                "markets": "h2h,spreads,totals",
                "oddsFormat": "american",
            }

            data = await self._make_request(endpoint, params)

            games = []
            for game_data in data:
                event = SportingEvent(
                    event_id=game_data.get("id", ""),
                    sport=sport,
                    league=sport_key,
                    home_team=game_data.get("home_team", ""),
                    away_team=game_data.get("away_team", ""),
                    start_time=datetime.fromisoformat(
                        game_data.get("commence_time", "").replace("Z", "+00:00")
                    ),
                    status="upcoming",
                )
                games.append(event)

            return games

        except Exception as e:
            logger.error(f"Error fetching TheOdds games: {e}")
            return []

    async def get_betting_odds(self, sport: str = "basketball") -> List[BettingOdds]:
        """Get betting odds from TheOdds API"""
        try:
            sport_keys = {
                "basketball": "basketball_nba",
                "football": "americanfootball_nfl",
                "baseball": "baseball_mlb",
                "soccer": "soccer_epl",
            }

            sport_key = sport_keys.get(sport, sport_keys["basketball"])
            endpoint = f"sports/{sport_key}/odds"
            params = {
                "apiKey": self.api_key,
                "regions": "us",
                "markets": "h2h,spreads,totals",
                "oddsFormat": "decimal",
            }

            data = await self._make_request(endpoint, params)

            odds_list = []
            for game in data:
                event_id = game.get("id", "")

                for bookmaker in game.get("bookmakers", []):
                    sportsbook = bookmaker.get("title", "")

                    for market in bookmaker.get("markets", []):
                        market_type = market.get("key", "")

                        for outcome in market.get("outcomes", []):
                            odds = BettingOdds(
                                event_id=event_id,
                                market=market_type,
                                sportsbook=sportsbook,
                                odds=float(outcome.get("price", 1.0)),
                                outcome=outcome.get("name", ""),
                                last_updated=datetime.now(timezone.utc),
                            )
                            odds_list.append(odds)

            return odds_list

        except Exception as e:
            logger.error(f"Error fetching TheOdds betting odds: {e}")
            return []

    async def get_player_stats(self, game_id: str) -> List[PlayerStats]:
        """TheOdds API doesn't provide player stats"""
        return []


class SpecialistDataManager:
    """Manages all specialist API integrations"""

    def __init__(self):
        self.sportradar = None
        self.prizepicks = None
        self.espn = None
        self.theodds = None

        # Initialize APIs with environment variables
        self._initialize_apis()

    def _initialize_apis(self):
        """Initialize specialist APIs with API keys from environment"""
        sportradar_key = os.getenv("SPORTRADAR_API_KEY")
        if sportradar_key:
            self.sportradar = SportradarAPI(sportradar_key)
            logger.info("✅ Sportradar API initialized")
        # PrizePicks API is public; no key required
        # prizepicks_key = os.getenv("PRIZEPICKS_API_KEY")
        # if prizepicks_key:
        #     self.prizepicks = PrizePicksAPI(prizepicks_key)
        #     logger.info("✅ PrizePicks API initialized")
        self.espn = ESPNAPI()
        logger.info("✅ ESPN API initialized")
        theodds_key = os.getenv("THE_ODDS_API_KEY")
        if theodds_key:
            self.theodds = TheOddsAPI(theodds_key)
            logger.info("✅ TheOdds API initialized")

    async def get_unified_live_games(
        self, sport: str = "basketball"
    ) -> Dict[str, List[SportingEvent]]:
        """Get live games from all available sources"""
        results = {}

        if self.sportradar:
            try:
                results["sportradar"] = await self.sportradar.get_live_games(sport)
            except Exception as e:
                logger.error(f"Error fetching Sportradar games: {e}")
                results["sportradar"] = []

        if self.prizepicks:
            try:
                results["prizepicks"] = await self.prizepicks.get_live_games(sport)
            except Exception as e:
                logger.error(f"Error fetching PrizePicks games: {e}")
                results["prizepicks"] = []

        if self.espn:
            try:
                results["espn"] = await self.espn.get_live_games(sport)
            except Exception as e:
                logger.error(f"Error fetching ESPN games: {e}")
                results["espn"] = []

        if self.theodds:
            try:
                results["theodds"] = await self.theodds.get_live_games(sport)
            except Exception as e:
                logger.error(f"Error fetching TheOdds games: {e}")
                results["theodds"] = []

        return results

    async def get_unified_player_stats(
        self, game_id: str
    ) -> Dict[str, List[PlayerStats]]:
        """Get player stats from all available sources"""
        results = {}

        if self.sportradar:
            try:
                results["sportradar"] = await self.sportradar.get_player_stats(game_id)
            except Exception as e:
                logger.error(f"Error fetching Sportradar player stats: {e}")
                results["sportradar"] = []

        if self.espn:
            try:
                results["espn"] = await self.espn.get_player_stats(game_id)
            except Exception as e:
                logger.error(f"Error fetching ESPN player stats: {e}")
                results["espn"] = []

        return results

    async def get_unified_betting_odds(
        self, sport: str = "basketball"
    ) -> Dict[str, List[BettingOdds]]:
        """Get betting odds from all available sources"""
        results = {}

        if self.theodds:
            try:
                results["theodds"] = await self.theodds.get_betting_odds(sport)
            except Exception as e:
                logger.error(f"Error fetching TheOdds betting odds: {e}")
                results["theodds"] = []

        return results

    async def get_player_props(self, sport: str = "basketball") -> List[PlayerProp]:
        """Get player props from PrizePicks"""
        if self.prizepicks:
            try:
                return await self.prizepicks.get_player_props(sport)
            except Exception as e:
                logger.error(f"Error fetching PrizePicks props: {e}")

        return []

    async def get_sports_news(
        self, sport: str = "basketball", limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get sports news from ESPN"""
        if self.espn:
            try:
                return await self.espn.get_news(sport, limit)
            except Exception as e:
                logger.error(f"Error fetching ESPN news: {e}")

        return []


# Global instance
specialist_manager = SpecialistDataManager()
