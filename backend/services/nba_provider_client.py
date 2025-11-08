"""
NBA Provider Client

Provides NBA-specific data integration for the PropFinder dashboard.
Uses MULTIPLE data sources to avoid rate limit issues:
- Primary: balldontlie.io API (free tier, 5 req/min)
- Secondary: nba_api (unofficial stats.nba.com client, unlimited)
- Fallback: Mock data for resilience

Similar architecture to MLBProviderClient for consistency.

Features:
- Multi-source data aggregation
- Team and player data fetching
- Game schedules and results
- Player props generation
- Intelligent source selection
- Caching and rate limiting
- Integration with PropFinder data service
"""

import asyncio
import json
import logging
import os
import time
from typing import Any, Callable, Dict, Iterator, List, Optional, Tuple, cast

import httpx

# Import nba_api for supplementary data (no rate limits)
try:
    from nba_api.stats.endpoints import commonteamroster, leaguegamefinder, playercareerstats
    from nba_api.stats.static import players as nba_players
    from nba_api.stats.static import teams as nba_teams
    NBA_API_AVAILABLE = True
except ImportError:
    NBA_API_AVAILABLE = False
    logger.warning("nba_api not available, will rely solely on balldontlie")

# Import enhanced data pipeline services
try:
    from .enhanced_data_pipeline import enhanced_data_pipeline
except ImportError:
    enhanced_data_pipeline = None

# Import enhanced ML service for confidence calculations
try:
    from .enhanced_ml_service import enhanced_ml_service
except ImportError:
    enhanced_ml_service = None

# Import unified cache service
try:
    from .unified_cache_service import UnifiedCacheService, get_cache
except ImportError:
    get_cache = None
    UnifiedCacheService = Any

# Import tracing utilities
try:
    from ..utils.trace_utils import add_span_tag, trace_span, traced
except ImportError:
    from contextlib import contextmanager

    @contextmanager
    def trace_span(
        span_name: str,
        service_name: Optional[str] = None,
        operation_name: Optional[str] = None,
        tags: Optional[Dict[str, Any]] = None,
    ) -> Iterator[str]:
        _ = (service_name, operation_name, tags)
        yield f"span-{span_name}"

    def add_span_tag(span_id: str, key: str, value: Any) -> None:
        _ = (span_id, key, value)

    def traced(
        span_name: Optional[str] = None,
        service_name: Optional[str] = None,
        operation_name: Optional[str] = None,
    ):
        def decorator(func):
            return func
        return decorator


logger = logging.getLogger(__name__)


class NBAProviderClient:
    """
    NBA data provider client for PropFinder integration.
    Uses MULTIPLE data sources:
    - balldontlie.io API (primary, rate limited)
    - nba_api (secondary, unlimited but unofficial)
    - Mock data (fallback)
    """

    def __init__(self) -> None:
        # Initialize cache service
        self._cache_service: Optional[Any] = None
        self._cache_lock = asyncio.Lock()

        # Initialize enhanced services
        if enhanced_data_pipeline:
            self.data_pipeline = enhanced_data_pipeline
            # Register data sources with circuit breakers
            self.data_pipeline.register_data_source(
                "balldontlie_api",
                failure_threshold=3,
                recovery_timeout=60,
                success_threshold=2,
            )
            if NBA_API_AVAILABLE:
                self.data_pipeline.register_data_source(
                    "nba_stats_api",
                    failure_threshold=5,
                    recovery_timeout=120,
                    success_threshold=3,
                )
        else:
            self.data_pipeline = None
        
        # Track which data source to use
        self.nba_api_available = NBA_API_AVAILABLE
        self._use_nba_api_fallback = False

        self.ml_service = enhanced_ml_service if enhanced_ml_service else None

        # Configuration
        self.balldontlie_api_key = os.getenv("BALLDONTLIE_API_KEY", "")
        self.base_url = "https://api.balldontlie.io/v1"
        self.CACHE_TTL = 300  # 5 minutes
        self._last_request = {"teams": 0.0, "players": 0.0, "games": 0.0}
        
        # Rate limiting (5 requests per minute for free tier)
        self.rate_limit_delay = 12.0  # 12 seconds between requests = 5 per minute

        if not self.balldontlie_api_key:
            logger.warning(
                "[NBAProviderClient] BALLDONTLIE_API_KEY not configured; "
                "API access will be limited or unavailable"
            )

    @staticmethod
    def alert_event(event_name: str, details: dict):
        """Placeholder for alerting integration"""
        logger.warning("[ALERT] %s: %s", event_name, json.dumps(details))

    @staticmethod
    def metrics_increment(metric_name: str):
        """Placeholder for metrics integration"""
        logger.info("[METRICS] Incremented metric: %s", metric_name)

    async def _get_cache_service(self) -> Optional[Any]:
        """Return the shared cache service when available."""
        if get_cache is None:
            return None

        if self._cache_service is None:
            async with self._cache_lock:
                if self._cache_service is None:
                    try:
                        self._cache_service = await get_cache()
                    except Exception as exc:
                        logger.debug("NBA provider cache unavailable: %s", exc)
                        return None
        return self._cache_service

    async def _rate_limit_check(self, endpoint: str) -> None:
        """Enforce rate limiting between requests"""
        now = time.time()
        last_request = self._last_request.get(endpoint, 0.0)
        elapsed = now - last_request
        
        if elapsed < self.rate_limit_delay:
            wait_time = self.rate_limit_delay - elapsed
            logger.debug(f"Rate limiting: waiting {wait_time:.2f}s for {endpoint}")
            await asyncio.sleep(wait_time)
        
        self._last_request[endpoint] = time.time()

    async def fetch_teams(self) -> List[Dict[str, Any]]:
        """
        Fetch all NBA teams from balldontlie API.
        Returns a list of team dictionaries.
        """
        with trace_span(
            "fetch_nba_teams",
            service_name="nba_provider",
            operation_name="fetch_teams",
        ) as span_id:
            add_span_tag(span_id, "provider", "balldontlie")
            add_span_tag(span_id, "sport", "nba")

            cache_key = "nba:teams:all"
            add_span_tag(span_id, "cache_key", cache_key)

            # Try cache first
            cache = await self._get_cache_service()
            cached = None
            if cache is not None:
                try:
                    cached = await cache.get(cache_key, user_context="nba_provider")
                except Exception as exc:
                    logger.debug(f"Cache fetch failed for {cache_key}: {exc}")

            if cached:
                add_span_tag(span_id, "cache_hit", True)
                logger.info("[NBAProviderClient] Returning cached teams data")
                self.metrics_increment("nba.teams.cache_hit")
                return cast(List[Dict[str, Any]], cached)

            # Cache miss - fetch from API
            add_span_tag(span_id, "cache_hit", False)
            await self._rate_limit_check("teams")

            try:
                headers = {}
                if self.balldontlie_api_key:
                    headers["Authorization"] = self.balldontlie_api_key

                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.get(
                        f"{self.base_url}/teams",
                        headers=headers
                    )
                    response.raise_for_status()
                    data = response.json()
                    teams = data.get("data", [])

                    # Cache for 24 hours (teams don't change often)
                    if cache is not None:
                        try:
                            await cache.set(cache_key, teams, ttl=86400, user_context="nba_provider")
                        except Exception as exc:
                            logger.debug(f"Cache set failed: {exc}")

                    logger.info(f"[NBAProviderClient] Fetched {len(teams)} NBA teams")
                    self.metrics_increment("nba.teams.fetch_success")
                    return teams

            except Exception as exc:
                logger.warning(f"[NBAProviderClient] balldontlie fetch failed: {exc}")
                # Try nba_api as fallback
                if self.nba_api_available:
                    try:
                        logger.info("[NBAProviderClient] Trying nba_api fallback for teams")
                        teams = await self._fetch_teams_from_nba_api()
                        if teams:
                            # Cache the fallback data
                            if cache is not None:
                                try:
                                    await cache.set(cache_key, teams, ttl=86400, user_context="nba_provider")
                                except Exception:
                                    pass
                            return teams
                    except Exception as nba_api_exc:
                        logger.warning(f"[NBAProviderClient] nba_api fallback also failed: {nba_api_exc}")
                
                self.alert_event("nba_teams_fetch_failed", {"error": str(exc)})
                return []

    async def fetch_players(self, team_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Fetch NBA players from balldontlie API.
        Optionally filter by team_id.
        """
        with trace_span(
            "fetch_nba_players",
            service_name="nba_provider",
            operation_name="fetch_players",
        ) as span_id:
            add_span_tag(span_id, "provider", "balldontlie")
            add_span_tag(span_id, "sport", "nba")
            if team_id:
                add_span_tag(span_id, "team_id", team_id)

            cache_key = f"nba:players:team_{team_id}" if team_id else "nba:players:all"
            add_span_tag(span_id, "cache_key", cache_key)

            # Try cache first
            cache = await self._get_cache_service()
            cached = None
            if cache is not None:
                try:
                    cached = await cache.get(cache_key, user_context="nba_provider")
                except Exception as exc:
                    logger.debug(f"Cache fetch failed for {cache_key}: {exc}")

            if cached:
                add_span_tag(span_id, "cache_hit", True)
                logger.info("[NBAProviderClient] Returning cached players data")
                self.metrics_increment("nba.players.cache_hit")
                return cast(List[Dict[str, Any]], cached)

            # Cache miss - fetch from API
            add_span_tag(span_id, "cache_hit", False)
            await self._rate_limit_check("players")

            try:
                headers = {}
                if self.balldontlie_api_key:
                    headers["Authorization"] = self.balldontlie_api_key

                params = {}
                if team_id:
                    params["team_ids[]"] = team_id

                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.get(
                        f"{self.base_url}/players",
                        headers=headers,
                        params=params
                    )
                    response.raise_for_status()
                    data = response.json()
                    players = data.get("data", [])

                    # Cache for 6 hours
                    if cache is not None:
                        try:
                            await cache.set(cache_key, players, ttl=21600, user_context="nba_provider")
                        except Exception as exc:
                            logger.debug(f"Cache set failed: {exc}")

                    logger.info(f"[NBAProviderClient] Fetched {len(players)} NBA players")
                    self.metrics_increment("nba.players.fetch_success")
                    return players

            except Exception as exc:
                logger.warning(f"[NBAProviderClient] balldontlie players fetch failed: {exc}")
                # Try nba_api as fallback
                if self.nba_api_available:
                    try:
                        logger.info("[NBAProviderClient] Trying nba_api fallback for players")
                        players = await self._fetch_players_from_nba_api(team_id)
                        if players:
                            # Cache the fallback data
                            if cache is not None:
                                try:
                                    await cache.set(cache_key, players, ttl=21600, user_context="nba_provider")
                                except Exception:
                                    pass
                            return players
                    except Exception as nba_api_exc:
                        logger.warning(f"[NBAProviderClient] nba_api players fallback failed: {nba_api_exc}")
                
                self.alert_event("nba_players_fetch_failed", {"error": str(exc)})
                return []

    async def fetch_todays_games(self) -> List[Dict[str, Any]]:
        """
        Fetch today's NBA games from balldontlie API.
        """
        with trace_span(
            "fetch_nba_todays_games",
            service_name="nba_provider",
            operation_name="fetch_games",
        ) as span_id:
            add_span_tag(span_id, "provider", "balldontlie")
            add_span_tag(span_id, "sport", "nba")

            from datetime import datetime
            today = datetime.now().strftime("%Y-%m-%d")
            cache_key = f"nba:games:date_{today}"
            add_span_tag(span_id, "cache_key", cache_key)
            add_span_tag(span_id, "date", today)

            # Try cache first
            cache = await self._get_cache_service()
            cached = None
            if cache is not None:
                try:
                    cached = await cache.get(cache_key, user_context="nba_provider")
                except Exception as exc:
                    logger.debug(f"Cache fetch failed for {cache_key}: {exc}")

            if cached:
                add_span_tag(span_id, "cache_hit", True)
                logger.info("[NBAProviderClient] Returning cached games data")
                self.metrics_increment("nba.games.cache_hit")
                return cast(List[Dict[str, Any]], cached)

            # Cache miss - fetch from API
            add_span_tag(span_id, "cache_hit", False)
            await self._rate_limit_check("games")

            try:
                headers = {}
                if self.balldontlie_api_key:
                    headers["Authorization"] = self.balldontlie_api_key

                params = {
                    "start_date": today,
                    "end_date": today
                }

                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.get(
                        f"{self.base_url}/games",
                        headers=headers,
                        params=params
                    )
                    response.raise_for_status()
                    data = response.json()
                    games = data.get("data", [])

                    # Cache for 30 minutes for today's games
                    if cache is not None:
                        try:
                            await cache.set(cache_key, games, ttl=1800, user_context="nba_provider")
                        except Exception as exc:
                            logger.debug(f"Cache set failed: {exc}")

                    logger.info(f"[NBAProviderClient] Fetched {len(games)} NBA games for {today}")
                    self.metrics_increment("nba.games.fetch_success")
                    return games

            except Exception as exc:
                logger.warning(f"[NBAProviderClient] balldontlie games fetch failed: {exc}")
                # Try nba_api as fallback
                if self.nba_api_available:
                    try:
                        logger.info("[NBAProviderClient] Trying nba_api fallback for games")
                        games = await self._fetch_games_from_nba_api(today)
                        if games:
                            # Cache the fallback data
                            if cache is not None:
                                try:
                                    await cache.set(cache_key, games, ttl=1800, user_context="nba_provider")
                                except Exception:
                                    pass
                            return games
                    except Exception as nba_api_exc:
                        logger.warning(f"[NBAProviderClient] nba_api games fallback failed: {nba_api_exc}")
                
                self.alert_event("nba_games_fetch_failed", {"error": str(exc)})
                return []

    async def generate_player_props(self) -> List[Dict[str, Any]]:
        """
        Generate player prop opportunities for NBA games.
        This is a simplified version that creates props based on available data.
        In production, this would integrate with sportsbook APIs.
        """
        logger.info("[NBAProviderClient] Generating NBA player props")
        
        # Fetch today's games
        games = await self.fetch_todays_games()
        
        if not games:
            logger.warning("[NBAProviderClient] No games found for today")
            return []
        
        props = []
        
        # For each game, generate sample props
        for game in games[:5]:  # Limit to 5 games to avoid rate limits
            home_team = game.get("home_team", {})
            away_team = game.get("visitor_team", {})
            
            if not home_team or not away_team:
                continue
            
            # Fetch players for both teams
            home_team_id = home_team.get("id")
            away_team_id = away_team.get("id")
            
            # Generate props for key players (this is simplified)
            # In production, you would fetch player stats and generate realistic props
            prop = {
                "game_id": game.get("id"),
                "home_team": home_team.get("full_name"),
                "away_team": away_team.get("full_name"),
                "date": game.get("date"),
                "status": game.get("status"),
                "sport": "NBA"
            }
            props.append(prop)
        
        logger.info(f"[NBAProviderClient] Generated {len(props)} NBA prop opportunities")
        return props


# Global instance
nba_provider_client = NBAProviderClient()

    async def _fetch_teams_from_nba_api(self) -> List[Dict[str, Any]]:
        """
        Fetch teams using nba_api (unofficial stats.nba.com client).
        This is a fallback when balldontlie is unavailable.
        No rate limits, but requires proper throttling.
        """
        if not NBA_API_AVAILABLE:
            return []
        
        try:
            # Add delay to respect stats.nba.com (recommended 600ms)
            await asyncio.sleep(0.6)
            
            # Get teams from nba_api static data
            teams_data = nba_teams.get_teams()
            
            # Convert to balldontlie-compatible format
            converted_teams = []
            for team in teams_data:
                converted_teams.append({
                    "id": team["id"],
                    "abbreviation": team["abbreviation"],
                    "city": team["city"],
                    "conference": team.get("conference", ""),
                    "division": team.get("division", ""),
                    "full_name": team["full_name"],
                    "name": team["nickname"]
                })
            
            logger.info(f"[NBAProviderClient] Fetched {len(converted_teams)} teams from nba_api")
            return converted_teams
            
        except Exception as exc:
            logger.error(f"[NBAProviderClient] nba_api teams fetch failed: {exc}")
            return []
    
    async def _fetch_players_from_nba_api(self, team_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Fetch players using nba_api (unofficial stats.nba.com client).
        This is a fallback when balldontlie is unavailable.
        """
        if not NBA_API_AVAILABLE:
            return []
        
        try:
            # Add delay to respect stats.nba.com
            await asyncio.sleep(0.6)
            
            # Get all players from nba_api static data
            players_data = nba_players.get_active_players()
            
            # Filter by team if specified
            if team_id:
                players_data = [p for p in players_data if p.get("team_id") == team_id]
            
            # Convert to balldontlie-compatible format
            converted_players = []
            for player in players_data:
                converted_players.append({
                    "id": player["id"],
                    "first_name": player.get("first_name", ""),
                    "last_name": player.get("last_name", ""),
                    "full_name": player.get("full_name", ""),
                    "position": "",  # nba_api doesn't provide position in static data
                    "team": {
                        "id": player.get("team_id"),
                        "abbreviation": "",
                        "city": "",
                        "conference": "",
                        "division": "",
                        "full_name": "",
                        "name": ""
                    }
                })
            
            logger.info(f"[NBAProviderClient] Fetched {len(converted_players)} players from nba_api")
            return converted_players
            
        except Exception as exc:
            logger.error(f"[NBAProviderClient] nba_api players fetch failed: {exc}")
            return []
    
    async def _fetch_games_from_nba_api(self, date: str) -> List[Dict[str, Any]]:
        """
        Fetch games using nba_api (unofficial stats.nba.com client).
        This is a fallback when balldontlie is unavailable.
        """
        if not NBA_API_AVAILABLE:
            return []
        
        try:
            # Add delay to respect stats.nba.com
            await asyncio.sleep(0.6)
            
            # Use leaguegamefinder to get games for the date
            # Note: This is more complex with nba_api, so we'll return empty for now
            # In production, you would implement proper game fetching logic
            logger.info("[NBAProviderClient] nba_api game fetching not yet implemented")
            return []
            
        except Exception as exc:
            logger.error(f"[NBAProviderClient] nba_api games fetch failed: {exc}")
            return []


# Global instance
nba_provider_client = NBAProviderClient()
