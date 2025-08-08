"""
Unified Data Fetcher Service

Consolidated from multiple data fetcher services to provide a single, optimized interface
for all external data fetching operations. Includes intelligent ensemble system integration,
proper error handling, and performance optimization.

Replaces:
- data_fetchers.py
- data_fetchers_enhanced.py
- data_fetchers_working.py
"""

import asyncio
import logging
import os
import random
import time
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from enum import Enum
from typing import Any, Dict, List, Optional, Union

import httpx
from backend.services.unified_error_handler import unified_error_handler

from backend.models.api_models import (
    BettingOpportunity,
    HistoricalGameResult,
    PerformanceStats,
)

logger = logging.getLogger(__name__)

class DataFetchError(Exception):
    """Custom exception for data fetching errors"""
    pass


class SportSeason(Enum):
    """Sports and their typical seasons"""

    MLB = {"months": range(4, 11), "name": "Major League Baseball"}  # April-October
    NBA = {
        "months": [*range(10, 13), *range(1, 5)],
        "name": "National Basketball Association",
    }  # Oct-Apr
    NFL = {
        "months": [*range(9, 13), 1, 2],
        "name": "National Football League",
    }  # Sep-Feb
    NHL = {
        "months": [*range(10, 13), *range(1, 5)],
        "name": "National Hockey League",
    }  # Oct-Apr
    WNBA = {
        "months": range(5, 11),
        "name": "Women's National Basketball Association",
    }  # May-Oct


@dataclass
class FetcherConfig:
    """Configuration for data fetching operations"""

    max_retries: int = 3
    retry_delay: float = 1.0
    timeout: int = 30
    enable_ensemble: bool = True
    enable_caching: bool = True
    cache_ttl: int = 300  # 5 minutes


class UnifiedDataFetcher:

    async def fetch_player_info(
        self, player_id: str, sport: str, correlation_id: str = None
    ) -> dict:
        """
        Fetch and normalize basic player info.
        Uses unified error handler and structured logging.
        Args:
            player_id (str): Player identifier
            sport (str): Sport name
            correlation_id (str, optional): Correlation ID for tracing
        Returns:
            dict: Player info
        """
        correlation_id = (
            correlation_id or f"playerinfo-{player_id}-{datetime.utcnow().timestamp()}"
        )
        for attempt in range(1, self.config.max_retries + 1):
            try:
                logger.info(
                    f"[CID={correlation_id}] Fetching player info for {player_id} (attempt {attempt})"
                )
                # Example: Replace with real data source
                player_info = {
                    "id": player_id,
                    "name": "Aaron Judge",
                    "team": "NYY",
                    "position": "RF",
                    "sport": sport,
                    "active": True,
                    "injury_status": None,
                }
                return player_info
            except Exception as e:
                logger.error(f"[CID={correlation_id}] Error fetching player info: {e}")
                self.error_handler.handle_error(
                    e,
                    "fetch_player_info",
                    user_context={"player_id": player_id, "sport": sport},
                )
                if attempt == self.config.max_retries:
                    raise
                await asyncio.sleep(self.config.retry_delay * attempt)

    async def fetch_player_season_stats(
        self, player_id: str, sport: str, correlation_id: str = None
    ) -> dict:
        """
        Fetch and normalize player season stats.
        Uses unified error handler and structured logging.
        """
        correlation_id = (
            correlation_id or f"playerstats-{player_id}-{datetime.utcnow().timestamp()}"
        )
        for attempt in range(1, self.config.max_retries + 1):
            try:
                logger.info(
                    f"[CID={correlation_id}] Fetching season stats for {player_id} (attempt {attempt})"
                )
                # Example: Replace with real data source
                stats = {
                    "hits": 120,
                    "home_runs": 35,
                    "rbis": 90,
                    "batting_average": 0.285,
                    "on_base_percentage": 0.390,
                    "slugging_percentage": 0.540,
                    "ops": 0.930,
                    "strikeouts": 110,
                    "walks": 60,
                    "games_played": 102,
                    "plate_appearances": 420,
                    "at_bats": 380,
                    "runs": 80,
                    "doubles": 22,
                    "triples": 1,
                    "stolen_bases": 5,
                    "war": 4.2,
                    "babip": 0.310,
                    "wrc_plus": 145,
                    "barrel_rate": 15.2,
                    "hard_hit_rate": 48.1,
                    "exit_velocity": 92.5,
                    "launch_angle": 14.3,
                }
                return stats
            except Exception as e:
                logger.error(f"[CID={correlation_id}] Error fetching season stats: {e}")
                if attempt == self.config.max_retries:
                    raise
                await asyncio.sleep(self.config.retry_delay * attempt)

    async def fetch_player_recent_games(
        self, player_id: str, sport: str, limit: int = 10, correlation_id: str = None
    ) -> list:
        """
        Fetch and normalize recent games.
        Uses unified error handler and structured logging.
        """
        correlation_id = (
            correlation_id or f"recentgames-{player_id}-{datetime.utcnow().timestamp()}"
        )
        for attempt in range(1, self.config.max_retries + 1):
            try:
                logger.info(
                    f"[CID={correlation_id}] Fetching recent games for {player_id} (attempt {attempt})"
                )
                # Example: Replace with real data source
                games = [
                    {
                        "date": "2025-08-01",
                        "opponent": "BOS",
                        "home": True,
                        "result": "W",
                        "stats": {
                            "hits": 2,
                            "home_runs": 1,
                            "rbis": 3,
                            "batting_average": 0.333,
                            "ops": 1.200,
                        },
                        "game_score": 8.5,
                        "weather": {
                            "temperature": 78,
                            "wind_speed": 10,
                            "wind_direction": "NW",
                        },
                    }
                    for _ in range(limit)
                ]
                return games
            except Exception as e:
                logger.error(f"[CID={correlation_id}] Error fetching recent games: {e}")
                if attempt == self.config.max_retries:
                    raise
                await asyncio.sleep(self.config.retry_delay * attempt)

    async def fetch_player_prop_history(
        self, player_id: str, sport: str, correlation_id: str = None
    ) -> list:
        """
        Fetch and normalize player prop history.
        Uses unified error handler and structured logging.
        """
        correlation_id = (
            correlation_id or f"prophistory-{player_id}-{datetime.utcnow().timestamp()}"
        )
        for attempt in range(1, self.config.max_retries + 1):
            try:
                logger.info(
                    f"[CID={correlation_id}] Fetching prop history for {player_id} (attempt {attempt})"
                )
                # Example: Replace with real data source
                props = [
                    {
                        "date": "2025-08-01",
                        "prop_type": "home_runs",
                        "line": 1.5,
                        "actual": 1.0,
                        "outcome": "under",
                        "odds": -110,
                        "sportsbook": "DraftKings",
                    }
                    for _ in range(10)
                ]
                return props
            except Exception as e:
                logger.error(f"[CID={correlation_id}] Error fetching prop history: {e}")
                if attempt == self.config.max_retries:
                    raise
                await asyncio.sleep(self.config.retry_delay * attempt)

    async def fetch_player_performance_trends(
        self, player_id: str, sport: str, correlation_id: str = None
    ) -> dict:
        """
        Fetch and normalize player performance trends.
        Uses unified error handler and structured logging.
        """
        correlation_id = (
            correlation_id or f"trends-{player_id}-{datetime.utcnow().timestamp()}"
        )
        for attempt in range(1, self.config.max_retries + 1):
            try:
                logger.info(
                    f"[CID={correlation_id}] Fetching performance trends for {player_id} (attempt {attempt})"
                )
                # Example: Replace with real data source
                trends = {
                    "last_7_days": {"avg": 0.320, "hr": 3, "rbis": 8},
                    "last_30_days": {"avg": 0.295, "hr": 10, "rbis": 25},
                    "home_vs_away": {"home": {"avg": 0.310}, "away": {"avg": 0.280}},
                    "vs_lefties": {"avg": 0.340},
                    "vs_righties": {"avg": 0.270},
                }
                return trends
            except Exception as e:
                logger.error(
                    f"[CID={correlation_id}] Error fetching performance trends: {e}"
                )
                if attempt == self.config.max_retries:
                    raise
                await asyncio.sleep(self.config.retry_delay * attempt)

    """
    Unified data fetching service with intelligent ensemble integration
    and comprehensive error handling.
    """

    def __init__(self, config: Optional[FetcherConfig] = None):
        self.config = config or FetcherConfig()
        self.error_handler = unified_error_handler
        self._client = None
        self._ensemble_system = None
        self._cache = {}

        # Initialize ensemble system if available
        self._initialize_ensemble_system()

    def _initialize_ensemble_system(self):
        """Initialize intelligent ensemble system with fallback"""
        try:
            from .intelligent_ensemble_system import intelligent_ensemble

            self._ensemble_system = intelligent_ensemble
            logger.info("✅ Intelligent ensemble system loaded successfully")
        except ImportError as e:
            logger.warning(f"⚠️ Intelligent ensemble system not available: {e}")
            self._ensemble_system = None

    @property
    def client(self):
        """Lazy-initialized HTTP client"""
        if self._client is None:
            self._client = httpx.AsyncClient(
                timeout=httpx.Timeout(self.config.timeout),
                limits=httpx.Limits(max_keepalive_connections=10, max_connections=20),
            )
        return self._client

    def get_current_season_sports(self) -> List[str]:
        """Get sports currently in season"""
        current_month = datetime.now(timezone.utc).month
        in_season = []

        for sport in SportSeason:
            if current_month in sport.value["months"]:
                in_season.append(sport.name)

        return in_season

    async def fetch_current_prizepicks_props(self) -> List[Dict[str, Any]]:
        """
        Fetch current PrizePicks props for in-season sports only.
        Optimized for current season to avoid empty datasets.
        Uses unified error handler and structured logging.
        """
        cache_key = "current_prizepicks_props"

        # Check cache first if enabled
        if self.config.enable_caching and cache_key in self._cache:
            cached_data, timestamp = self._cache[cache_key]
            if time.time() - timestamp < self.config.cache_ttl:
                logger.info("📋 Returning cached PrizePicks props")
                return cached_data

        logger.info("🔄 Fetching current PrizePicks props for in-season sports")

        try:
            in_season_sports = self.get_current_season_sports()
            logger.info(f"🏆 Sports currently in season: {in_season_sports}")

            props = []

            # Fetch props for each in-season sport
            for sport in in_season_sports:
                sport_props = await self._fetch_sport_props(sport)
                props.extend(sport_props)

            # Apply ensemble predictions if available
            if self._ensemble_system and self.config.enable_ensemble:
                props = await self._enhance_with_ensemble(props)

            # Cache results if enabled
            if self.config.enable_caching:
                self._cache[cache_key] = (props, time.time())

            logger.info(
                f"✅ Successfully fetched {len(props)} props from in-season sports"
            )
            return props

        except Exception as e:
            logger.error(f"❌ Error fetching PrizePicks props: {e}")
            self.error_handler.handle_error(e, "fetch_current_prizepicks_props")
            return []

    async def _fetch_sport_props(self, sport: str) -> List[Dict[str, Any]]:
        """Fetch props for a specific sport with retry logic"""
        for attempt in range(self.config.max_retries):
            try:
                # This would be replaced with actual API calls in production
                # For now, generating realistic mock data based on sport
                props = await self._generate_sport_props(sport)
                return props

            except Exception as e:
                if attempt < self.config.max_retries - 1:
                    wait_time = self.config.retry_delay * (2**attempt)
                    logger.warning(
                        f"⚠️ Attempt {attempt + 1} failed for {sport}, retrying in {wait_time}s: {e}"
                    )
                    await asyncio.sleep(wait_time)
                else:
                    logger.error(f"❌ All attempts failed for {sport}: {e}")
                    raise

        return []

    async def _generate_sport_props(self, sport: str) -> List[Dict[str, Any]]:
        """Generate realistic props for the given sport"""
        # This is a placeholder - in production this would make actual API calls
        current_time = datetime.now(timezone.utc)
        props = []

        # Generate sport-specific props
        if sport == "MLB":
            props.extend(self._generate_mlb_props())
        elif sport == "NBA":
            props.extend(self._generate_nba_props())
        elif sport == "NFL":
            props.extend(self._generate_nfl_props())
        elif sport == "NHL":
            props.extend(self._generate_nhl_props())
        elif sport == "WNBA":
            props.extend(self._generate_wnba_props())

        return props

    def _generate_mlb_props(self) -> List[Dict[str, Any]]:
        """Generate MLB-specific props"""
        players = [
            "Mike Trout",
            "Mookie Betts",
            "Aaron Judge",
            "Ronald Acuña Jr.",
            "Shohei Ohtani",
        ]
        props = []

        for player in players:
            props.extend(
                [
                    {
                        "id": f"mlb_{player.replace(' ', '_').lower()}_hits",
                        "player": player,
                        "stat_type": "Hits",
                        "line": random.choice([0.5, 1.5, 2.5]),
                        "over_odds": random.randint(-150, 150),
                        "under_odds": random.randint(-150, 150),
                        "sport": "MLB",
                        "game_time": datetime.now(timezone.utc)
                        + timedelta(hours=random.randint(1, 8)),
                    },
                    {
                        "id": f"mlb_{player.replace(' ', '_').lower()}_rbis",
                        "player": player,
                        "stat_type": "RBIs",
                        "line": random.choice([0.5, 1.5, 2.5]),
                        "over_odds": random.randint(-150, 150),
                        "under_odds": random.randint(-150, 150),
                        "sport": "MLB",
                        "game_time": datetime.now(timezone.utc)
                        + timedelta(hours=random.randint(1, 8)),
                    },
                ]
            )

        return props

    def _generate_nba_props(self) -> List[Dict[str, Any]]:
        """Generate NBA-specific props"""
        players = [
            "LeBron James",
            "Stephen Curry",
            "Giannis Antetokounmpo",
            "Luka Dončić",
            "Jayson Tatum",
        ]
        props = []

        for player in players:
            props.extend(
                [
                    {
                        "id": f"nba_{player.replace(' ', '_').lower()}_points",
                        "player": player,
                        "stat_type": "Points",
                        "line": random.choice([25.5, 27.5, 29.5, 31.5]),
                        "over_odds": random.randint(-120, 120),
                        "under_odds": random.randint(-120, 120),
                        "sport": "NBA",
                        "game_time": datetime.now(timezone.utc)
                        + timedelta(hours=random.randint(1, 8)),
                    },
                    {
                        "id": f"nba_{player.replace(' ', '_').lower()}_rebounds",
                        "player": player,
                        "stat_type": "Rebounds",
                        "line": random.choice([7.5, 8.5, 9.5, 10.5]),
                        "over_odds": random.randint(-120, 120),
                        "under_odds": random.randint(-120, 120),
                        "sport": "NBA",
                        "game_time": datetime.now(timezone.utc)
                        + timedelta(hours=random.randint(1, 8)),
                    },
                ]
            )

        return props

    def _generate_nfl_props(self) -> List[Dict[str, Any]]:
        """Generate NFL-specific props"""
        players = [
            "Josh Allen",
            "Patrick Mahomes",
            "Lamar Jackson",
            "Aaron Rodgers",
            "Tom Brady",
        ]
        props = []

        for player in players:
            props.extend(
                [
                    {
                        "id": f"nfl_{player.replace(' ', '_').lower()}_passing_yards",
                        "player": player,
                        "stat_type": "Passing Yards",
                        "line": random.choice([249.5, 274.5, 299.5]),
                        "over_odds": random.randint(-110, 110),
                        "under_odds": random.randint(-110, 110),
                        "sport": "NFL",
                        "game_time": datetime.now(timezone.utc)
                        + timedelta(days=random.randint(1, 7)),
                    },
                    {
                        "id": f"nfl_{player.replace(' ', '_').lower()}_passing_tds",
                        "player": player,
                        "stat_type": "Passing TDs",
                        "line": random.choice([1.5, 2.5, 3.5]),
                        "over_odds": random.randint(-110, 110),
                        "under_odds": random.randint(-110, 110),
                        "sport": "NFL",
                        "game_time": datetime.now(timezone.utc)
                        + timedelta(days=random.randint(1, 7)),
                    },
                ]
            )

        return props

    def _generate_nhl_props(self) -> List[Dict[str, Any]]:
        """Generate NHL-specific props"""
        players = [
            "Connor McDavid",
            "Nathan MacKinnon",
            "Leon Draisaitl",
            "Erik Karlsson",
            "David Pastrnak",
        ]
        props = []

        for player in players:
            props.extend(
                [
                    {
                        "id": f"nhl_{player.replace(' ', '_').lower()}_goals",
                        "player": player,
                        "stat_type": "Goals",
                        "line": random.choice([0.5, 1.5]),
                        "over_odds": random.randint(-150, 150),
                        "under_odds": random.randint(-150, 150),
                        "sport": "NHL",
                        "game_time": datetime.now(timezone.utc)
                        + timedelta(hours=random.randint(1, 8)),
                    },
                    {
                        "id": f"nhl_{player.replace(' ', '_').lower()}_assists",
                        "player": player,
                        "stat_type": "Assists",
                        "line": random.choice([0.5, 1.5, 2.5]),
                        "over_odds": random.randint(-150, 150),
                        "under_odds": random.randint(-150, 150),
                        "sport": "NHL",
                        "game_time": datetime.now(timezone.utc)
                        + timedelta(hours=random.randint(1, 8)),
                    },
                ]
            )

        return props

    def _generate_wnba_props(self) -> List[Dict[str, Any]]:
        """Generate WNBA-specific props"""
        players = [
            "A'ja Wilson",
            "Breanna Stewart",
            "Sabrina Ionescu",
            "Candace Parker",
            "Diana Taurasi",
        ]
        props = []

        for player in players:
            props.extend(
                [
                    {
                        "id": f"wnba_{player.replace(' ', '_').lower()}_points",
                        "player": player,
                        "stat_type": "Points",
                        "line": random.choice([18.5, 20.5, 22.5]),
                        "over_odds": random.randint(-120, 120),
                        "under_odds": random.randint(-120, 120),
                        "sport": "WNBA",
                        "game_time": datetime.now(timezone.utc)
                        + timedelta(hours=random.randint(1, 8)),
                    },
                    {
                        "id": f"wnba_{player.replace(' ', '_').lower()}_rebounds",
                        "player": player,
                        "stat_type": "Rebounds",
                        "line": random.choice([7.5, 8.5, 9.5]),
                        "over_odds": random.randint(-120, 120),
                        "under_odds": random.randint(-120, 120),
                        "sport": "WNBA",
                        "game_time": datetime.now(timezone.utc)
                        + timedelta(hours=random.randint(1, 8)),
                    },
                ]
            )

        return props

    async def _enhance_with_ensemble(
        self, props: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Enhance props with ensemble predictions"""
        if not self._ensemble_system:
            return props

        try:
            enhanced_props = []
            for prop in props:
                # Apply ensemble predictions
                ensemble_result = await self._ensemble_system.predict(prop)
                prop["ensemble_confidence"] = ensemble_result.get("confidence", 0.5)
                prop["ensemble_prediction"] = ensemble_result.get("prediction", "N/A")
                enhanced_props.append(prop)

            logger.info(
                f"✅ Enhanced {len(enhanced_props)} props with ensemble predictions"
            )
            return enhanced_props

        except Exception as e:
            logger.warning(f"⚠️ Error enhancing props with ensemble: {e}")
            return props

    async def fetch_historical_data(
        self, sport: str, lookback_days: int = 30
    ) -> List[Dict[str, Any]]:
        """
        Fetch historical data for a sport.
        Uses unified error handler and structured logging.
        """
        cache_key = f"historical_{sport}_{lookback_days}"

        if self.config.enable_caching and cache_key in self._cache:
            cached_data, timestamp = self._cache[cache_key]
            if (
                time.time() - timestamp < self.config.cache_ttl * 2
            ):  # Longer cache for historical data
                return cached_data

        try:
            # This would make actual API calls in production
            historical_data = await self._generate_historical_data(sport, lookback_days)

            if self.config.enable_caching:
                self._cache[cache_key] = (historical_data, time.time())

            return historical_data

        except Exception as e:
            logger.error(f"❌ Error fetching historical data for {sport}: {e}")
            return []

    async def _generate_historical_data(
        self, sport: str, lookback_days: int
    ) -> List[Dict[str, Any]]:
        """Generate historical data for the sport"""
        # Placeholder implementation
        return [
            {
                "date": (datetime.now(timezone.utc) - timedelta(days=i)).isoformat(),
                "sport": sport,
                "games_played": random.randint(5, 15),
                "average_score": random.uniform(100, 150),
                "predictions_made": random.randint(50, 200),
            }
            for i in range(lookback_days)
        ]

    async def close(self):
        """Clean up resources"""
        if self._client:
            await self._client.aclose()


# Global instance for use throughout the application
unified_data_fetcher = UnifiedDataFetcher()


# Backwards compatibility functions
async def fetch_current_prizepicks_props() -> List[Dict[str, Any]]:
    """Backwards compatibility wrapper"""
    return await unified_data_fetcher.fetch_current_prizepicks_props()


async def fetch_historical_data(
    sport: str, lookback_days: int = 30
) -> List[Dict[str, Any]]:
    """Backwards compatibility wrapper"""
    return await unified_data_fetcher.fetch_historical_data(sport, lookback_days)
