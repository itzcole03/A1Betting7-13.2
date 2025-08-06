from .unified_data_fetcher import unified_data_fetcher
from ..models.player_models import PlayerDashboardResponse, PlayerSeasonStats, PlayerRecentGame, PlayerPropHistoryItem, PlayerPerformanceTrends
    async def get_player_dashboard(self, player_id: str, request) -> PlayerDashboardResponse:
        """Get comprehensive player dashboard data with unified fetcher, 30 min cache, and error/correlation handling"""
        sport = request.query_params.get("sport", "MLB")
        cache_key = f"player_dashboard:{sport}:{player_id}"
        correlation_id = request.headers.get("X-Correlation-ID") or f"playerdash-{player_id}-{datetime.utcnow().timestamp()}"
        try:
            # Check cache (30 min TTL)
            cached = self.cache_service.get(cache_key)
            if cached:
                logger.info(f"[CID={correlation_id}] Cache hit for {cache_key}")
                return PlayerDashboardResponse.parse_obj(cached)

            # Fetch all data using unified_data_fetcher
            logger.info(f"[CID={correlation_id}] Fetching dashboard for {player_id}")
            player_info = await unified_data_fetcher.fetch_player_info(player_id, sport)
            season_stats = await unified_data_fetcher.fetch_player_season_stats(player_id, sport)
            recent_games = await unified_data_fetcher.fetch_player_recent_games(player_id, sport, limit=10)
            prop_history = await unified_data_fetcher.fetch_player_prop_history(player_id, sport)
            performance_trends = await unified_data_fetcher.fetch_player_performance_trends(player_id, sport)

            # Normalize and build response
            response = PlayerDashboardResponse(
                id=player_info["id"],
                name=player_info["name"],
                team=player_info["team"],
                position=player_info["position"],
                sport=player_info["sport"],
                active=player_info.get("active", True),
                injury_status=player_info.get("injury_status"),
                season_stats=PlayerSeasonStats(**season_stats),
                recent_games=[PlayerRecentGame(**g) for g in recent_games],
                prop_history=[PlayerPropHistoryItem(**p) for p in prop_history],
                performance_trends=PlayerPerformanceTrends(**performance_trends),
            )
            # Cache for 30 min
            self.cache_service.set(cache_key, response.dict(), ttl=1800)
            logger.info(f"[CID={correlation_id}] Dashboard cached for {cache_key}")
            return response
        except Exception as e:
            logger.error(f"[CID={correlation_id}] Error in get_player_dashboard: {e}")
            raise self.error_handler.handle_error(
                error=e,
                context="get_player_dashboard",
                user_context={"player_id": player_id, "correlation_id": correlation_id}
            )
"""
PlayerDashboardService - Backend service for comprehensive player analytics
Provides player data, statistics, trends, and predictions for the dashboard
"""

import asyncio
import logging
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from .baseball_savant_client import BaseballSavantClient
from .database_service import DatabaseService
from .enhanced_prop_analysis_service import EnhancedPropAnalysisService
from .mlb_stats_api_client import MLBStatsAPIClient
from .unified_cache_service import unified_cache_service
from .unified_error_handler import unified_error_handler
from .unified_logging import unified_logging

logger = unified_logging.get_logger("player_dashboard_service")


@dataclass
class PlayerStats:
    # Batting Stats
    hits: int = 0
    home_runs: int = 0
    rbis: int = 0
    batting_average: float = 0.0
    on_base_percentage: float = 0.0
    slugging_percentage: float = 0.0
    ops: float = 0.0
    strikeouts: int = 0
    walks: int = 0

    # Advanced Stats
    war: float = 0.0
    babip: float = 0.0
    wrc_plus: int = 0
    barrel_rate: float = 0.0
    hard_hit_rate: float = 0.0
    exit_velocity: float = 0.0
    launch_angle: float = 0.0

    # Counting Stats
    games_played: int = 0
    plate_appearances: int = 0
    at_bats: int = 0
    runs: int = 0
    doubles: int = 0
    triples: int = 0
    stolen_bases: int = 0


@dataclass
class GameLog:
    date: str
    opponent: str
    home: bool
    result: str  # 'W' or 'L'
    stats: PlayerStats
    game_score: Optional[float] = None
    weather: Optional[Dict[str, Any]] = None


@dataclass
class PlayerData:
    id: str
    name: str
    team: str
    position: str
    sport: str
    active: bool
    injury_status: Optional[str] = None

    # Current Season
    season_stats: Optional[PlayerStats] = None

    # Performance Data
    recent_games: List[GameLog] = None
    last_30_games: List[GameLog] = None
    season_games: List[GameLog] = None

    # Trends and Analysis
    performance_trends: Optional[Dict[str, Any]] = None

    # Advanced Metrics
    advanced_metrics: Optional[Dict[str, Any]] = None

    # Predictive Analytics
    projections: Optional[Dict[str, Any]] = None


class PlayerDashboardService:

    async def get_player_dashboard(self, player_id: str, request) -> 'PlayerDashboardResponse':
        """Get comprehensive player dashboard data with unified fetcher, 30 min cache, and error/correlation handling"""
        from .unified_data_fetcher import unified_data_fetcher
        from ..models.player_models import PlayerDashboardResponse, PlayerSeasonStats, PlayerRecentGame, PlayerPropHistoryItem, PlayerPerformanceTrends
        from datetime import datetime
        sport = request.query_params.get("sport", "MLB")
        cache_key = f"player_dashboard:{sport}:{player_id}"
        correlation_id = request.headers.get("X-Correlation-ID") or f"playerdash-{player_id}-{datetime.utcnow().timestamp()}"
        try:
            # Check cache (30 min TTL)
            cached = self.cache_service.get(cache_key)
            if cached:
                logger.info(f"[CID={correlation_id}] Cache hit for {cache_key}")
                return PlayerDashboardResponse.parse_obj(cached)

            # Fetch all data using unified_data_fetcher
            logger.info(f"[CID={correlation_id}] Fetching dashboard for {player_id}")
            player_info = await unified_data_fetcher.fetch_player_info(player_id, sport)
            season_stats = await unified_data_fetcher.fetch_player_season_stats(player_id, sport)
            recent_games = await unified_data_fetcher.fetch_player_recent_games(player_id, sport, limit=10)
            prop_history = await unified_data_fetcher.fetch_player_prop_history(player_id, sport)
            performance_trends = await unified_data_fetcher.fetch_player_performance_trends(player_id, sport)

            # Normalize and build response
            response = PlayerDashboardResponse(
                id=player_info["id"],
                name=player_info["name"],
                team=player_info["team"],
                position=player_info["position"],
                sport=player_info["sport"],
                active=player_info.get("active", True),
                injury_status=player_info.get("injury_status"),
                season_stats=PlayerSeasonStats(**season_stats),
                recent_games=[PlayerRecentGame(**g) for g in recent_games],
                prop_history=[PlayerPropHistoryItem(**p) for p in prop_history],
                performance_trends=PlayerPerformanceTrends(**performance_trends),
            )
            # Cache for 30 min
            self.cache_service.set(cache_key, response.dict(), ttl=1800)
            logger.info(f"[CID={correlation_id}] Dashboard cached for {cache_key}")
            return response
        except Exception as e:
            logger.error(f"[CID={correlation_id}] Error in get_player_dashboard: {e}")
            raise self.error_handler.handle_error(
                error=e,
                context="get_player_dashboard",
                user_context={"player_id": player_id, "correlation_id": correlation_id}
            )
    """Comprehensive service for player dashboard data and analytics"""

    def __init__(self):
        self.db_service = DatabaseService()
        self.cache_service = unified_cache_service
        self.error_handler = unified_error_handler

        # Initialize data clients
        self.mlb_stats_client = None
        self.baseball_savant_client = None
        self.prop_analysis_service = None

        # Cache configuration
        self.CACHE_TTL = 300  # 5 minutes
        self.SEARCH_CACHE_TTL = 120  # 2 minutes

        logger.info("PlayerDashboardService initialized")

    async def _initialize_clients(self):
        """Lazy initialization of data clients"""
        if not self.mlb_stats_client:
            try:
                self.mlb_stats_client = MLBStatsAPIClient()
                logger.info("MLB Stats API client initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize MLB Stats API client: {e}")

        if not self.baseball_savant_client:
            try:
                self.baseball_savant_client = BaseballSavantClient()
                logger.info("Baseball Savant client initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize Baseball Savant client: {e}")

        if not self.prop_analysis_service:
            try:
                self.prop_analysis_service = EnhancedPropAnalysisService()
                logger.info("Prop analysis service initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize prop analysis service: {e}")

    async def get_player(self, player_id: str, sport: str = "MLB") -> PlayerData:
        """Get comprehensive player data for dashboard"""
        cache_key = f"player:{sport}:{player_id}:dashboard"

        try:
            # Check cache first
            cached_data = self.cache_service.get(cache_key)
            if cached_data:
                logger.info(f"Cache hit for player {player_id}")
                return PlayerData(**cached_data)

            # Initialize clients
            await self._initialize_clients()

            logger.info(f"Fetching comprehensive player data for {player_id}")

            # Get basic player info
            player_info = await self._get_player_info(player_id, sport)
            if not player_info:
                raise ValueError(f"Player not found: {player_id}")

            # Gather all data concurrently
            tasks = [
                self._get_season_stats(player_id, sport),
                self._get_recent_games(player_id, sport, 10),
                self._get_last_30_games(player_id, sport),
                self._get_performance_trends(player_id, sport),
                self._get_advanced_metrics(player_id, sport),
                self._get_projections(player_id, sport),
            ]

            results = await asyncio.gather(*tasks, return_exceptions=True)

            # Process results
            (
                season_stats,
                recent_games,
                last_30_games,
                performance_trends,
                advanced_metrics,
                projections,
            ) = results

            # Handle exceptions in results
            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    logger.warning(f"Task {i} failed: {result}")
                    results[i] = None

            # Build comprehensive player data
            player_data = PlayerData(
                id=player_info["id"],
                name=player_info["name"],
                team=player_info["team"],
                position=player_info["position"],
                sport=sport,
                active=player_info.get("active", True),
                injury_status=player_info.get("injury_status"),
                season_stats=season_stats,
                recent_games=recent_games or [],
                last_30_games=last_30_games or [],
                season_games=[],  # Can be populated if needed
                performance_trends=performance_trends,
                advanced_metrics=advanced_metrics,
                projections=projections,
            )

            # Cache the result
            self.cache_service.set(cache_key, player_data.__dict__, self.CACHE_TTL)

            logger.info(f"Player data compiled successfully for {player_info['name']}")
            return player_data

        except Exception as e:
            error_context = {
                "player_id": player_id,
                "sport": sport,
                "operation": "get_player",
            }
            self.error_handler.handle_error(
                e, "PlayerDashboardService.get_player", error_context
            )
            raise

    async def search_players(
        self, query: str, sport: str = "MLB", limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Search for players by name or team"""
        cache_key = f"player:search:{sport}:{query}:{limit}"

        try:
            # Check cache first
            cached_results = self.cache_service.get(cache_key)
            if cached_results:
                logger.info(f"Cache hit for search: {query}")
                return cached_results

            # Initialize clients
            await self._initialize_clients()

            logger.info(f"Searching players: {query}")

            # Search using MLB Stats API
            players = []
            if self.mlb_stats_client:
                try:
                    search_results = await self.mlb_stats_client.search_players(
                        query, limit
                    )
                    players.extend(search_results)
                except Exception as e:
                    logger.warning(f"MLB Stats API search failed: {e}")

            # Fallback to database search
            if not players:
                try:
                    db_results = await self._search_players_database(
                        query, sport, limit
                    )
                    players.extend(db_results)
                except Exception as e:
                    logger.warning(f"Database search failed: {e}")

            # Cache the results
            self.cache_service.set(cache_key, players, self.SEARCH_CACHE_TTL)

            logger.info(f"Found {len(players)} players for query: {query}")
            return players

        except Exception as e:
            error_context = {
                "query": query,
                "sport": sport,
                "limit": limit,
                "operation": "search_players",
            }
            self.error_handler.handle_error(
                e, "PlayerDashboardService.search_players", error_context
            )
            raise

    async def get_player_trends(
        self, player_id: str, period: str = "30d", sport: str = "MLB"
    ) -> List[Dict[str, Any]]:
        """Get player performance trends over specified period"""
        cache_key = f"player:trends:{sport}:{player_id}:{period}"

        try:
            # Check cache first
            cached_trends = self.cache_service.get(cache_key)
            if cached_trends:
                logger.info(f"Cache hit for trends: {player_id}:{period}")
                return cached_trends

            await self._initialize_clients()

            logger.info(f"Fetching trends for {player_id}: {period}")

            # Get game logs for the period
            days = {"7d": 7, "30d": 30, "season": 162}.get(period, 30)
            game_logs = await self._get_recent_games(player_id, sport, days)

            if not game_logs:
                return []

            # Calculate trend data
            trends = self._calculate_trends(game_logs)

            # Cache the results
            self.cache_service.set(cache_key, trends, self.CACHE_TTL)

            logger.info(f"Trends calculated for {player_id}: {len(trends)} data points")
            return trends

        except Exception as e:
            error_context = {
                "player_id": player_id,
                "period": period,
                "sport": sport,
                "operation": "get_player_trends",
            }
            self.error_handler.handle_error(
                e, "PlayerDashboardService.get_player_trends", error_context
            )
            raise

    async def get_matchup_analysis(
        self, player_id: str, opponent_team: str, sport: str = "MLB"
    ) -> Dict[str, Any]:
        """Get player performance analysis against specific opponent"""
        cache_key = f"player:matchup:{sport}:{player_id}:{opponent_team}"

        try:
            # Check cache first
            cached_analysis = self.cache_service.get(cache_key)
            if cached_analysis:
                logger.info(f"Cache hit for matchup: {player_id} vs {opponent_team}")
                return cached_analysis

            await self._initialize_clients()

            logger.info(f"Analyzing matchup: {player_id} vs {opponent_team}")

            # Get historical performance against opponent
            matchup_data = await self._get_matchup_history(
                player_id, opponent_team, sport
            )

            # Get opponent pitching/defensive stats
            opponent_data = await self._get_opponent_analysis(opponent_team, sport)

            # Compile matchup analysis
            analysis = {
                "player_id": player_id,
                "opponent": opponent_team,
                "historical_performance": matchup_data,
                "opponent_analysis": opponent_data,
                "matchup_rating": self._calculate_matchup_rating(
                    matchup_data, opponent_data
                ),
                "key_insights": self._generate_matchup_insights(
                    matchup_data, opponent_data
                ),
                "recommended_props": [],  # Can be populated with prop recommendations
            }

            # Cache the results
            self.cache_service.set(cache_key, analysis, self.CACHE_TTL)

            logger.info(
                f"Matchup analysis completed for {player_id} vs {opponent_team}"
            )
            return analysis

        except Exception as e:
            error_context = {
                "player_id": player_id,
                "opponent_team": opponent_team,
                "sport": sport,
                "operation": "get_matchup_analysis",
            }
            self.error_handler.handle_error(
                e, "PlayerDashboardService.get_matchup_analysis", error_context
            )
            raise

    async def get_player_props(
        self, player_id: str, game_id: Optional[str] = None, sport: str = "MLB"
    ) -> List[Dict[str, Any]]:
        """Get player prop predictions and recommendations"""
        cache_key = f"player:props:{sport}:{player_id}:{game_id or 'next'}"

        try:
            # Check cache first
            cached_props = self.cache_service.get(cache_key)
            if cached_props:
                logger.info(f"Cache hit for props: {player_id}:{game_id}")
                return cached_props

            await self._initialize_clients()

            logger.info(f"Fetching props for {player_id}: {game_id}")

            # Generate prop predictions
            props = []
            if self.prop_analysis_service:
                try:
                    prop_data = await self.prop_analysis_service.generate_player_props(
                        player_id=player_id, game_id=game_id, sport=sport
                    )
                    props.extend(prop_data)
                except Exception as e:
                    logger.warning(f"Prop analysis service failed: {e}")

            # Fallback to basic prop generation
            if not props:
                props = await self._generate_basic_props(player_id, sport)

            # Cache the results
            self.cache_service.set(cache_key, props, self.CACHE_TTL)

            logger.info(f"Generated {len(props)} props for {player_id}")
            return props

        except Exception as e:
            error_context = {
                "player_id": player_id,
                "game_id": game_id,
                "sport": sport,
                "operation": "get_player_props",
            }
            self.error_handler.handle_error(
                e, "PlayerDashboardService.get_player_props", error_context
            )
            raise

    # Private helper methods
    async def _get_player_info(
        self, player_id: str, sport: str
    ) -> Optional[Dict[str, Any]]:
        """Get basic player information"""
        try:
            if self.mlb_stats_client:
                return await self.mlb_stats_client.get_player_info(player_id)
        except Exception as e:
            logger.warning(f"Failed to get player info from API: {e}")

        # Fallback to mock data for development
        return {
            "id": player_id,
            "name": (
                "Aaron Judge"
                if player_id == "aaron-judge"
                else player_id.replace("-", " ").title()
            ),
            "team": "NYY",
            "position": "OF",
            "active": True,
            "injury_status": None,
        }

    async def _get_season_stats(
        self, player_id: str, sport: str
    ) -> Optional[PlayerStats]:
        """Get current season statistics"""
        try:
            if self.baseball_savant_client:
                stats_data = await self.baseball_savant_client.get_player_season_stats(
                    player_id
                )
                if stats_data:
                    return PlayerStats(**stats_data)
        except Exception as e:
            logger.warning(f"Failed to get season stats: {e}")

        # Return mock data for development
        return PlayerStats(
            hits=150,
            home_runs=42,
            rbis=105,
            batting_average=0.285,
            on_base_percentage=0.365,
            slugging_percentage=0.595,
            ops=0.960,
            strikeouts=120,
            walks=85,
            games_played=140,
        )

    async def _get_recent_games(
        self, player_id: str, sport: str, count: int
    ) -> List[GameLog]:
        """Get recent game logs"""
        try:
            if self.mlb_stats_client:
                game_data = await self.mlb_stats_client.get_player_game_logs(
                    player_id, count
                )
                return [GameLog(**game) for game in game_data]
        except Exception as e:
            logger.warning(f"Failed to get recent games: {e}")

        # Return mock data for development
        return [
            GameLog(
                date="2024-12-20",
                opponent="BOS",
                home=True,
                result="W",
                stats=PlayerStats(hits=2, home_runs=1, rbis=3, batting_average=0.285),
            )
        ] * min(count, 5)

    async def _get_last_30_games(self, player_id: str, sport: str) -> List[GameLog]:
        """Get last 30 games"""
        return await self._get_recent_games(player_id, sport, 30)

    async def _get_performance_trends(
        self, player_id: str, sport: str
    ) -> Dict[str, Any]:
        """Calculate performance trends"""
        return {
            "last_7_days": {"batting_average": 0.320, "home_runs": 2},
            "last_30_days": {"batting_average": 0.295, "home_runs": 8},
            "home_vs_away": {
                "home": {"batting_average": 0.310, "home_runs": 25},
                "away": {"batting_average": 0.260, "home_runs": 17},
            },
            "vs_lefties": {"batting_average": 0.275, "home_runs": 15},
            "vs_righties": {"batting_average": 0.290, "home_runs": 27},
        }

    async def _get_advanced_metrics(self, player_id: str, sport: str) -> Dict[str, Any]:
        """Calculate advanced performance metrics"""
        return {
            "consistency_score": 85.2,
            "clutch_performance": 78.5,
            "injury_risk": 15.3,
            "hot_streak": True,
            "cold_streak": False,
            "breakout_candidate": False,
        }

    async def _get_projections(self, player_id: str, sport: str) -> Dict[str, Any]:
        """Get performance projections"""
        return {
            "next_game": {"hits": 1.8, "home_runs": 0.3, "rbis": 1.2},
            "rest_of_season": {"hits": 25, "home_runs": 6, "rbis": 18},
            "confidence_intervals": {
                "low": {"hits": 1.2, "home_runs": 0.1, "rbis": 0.8},
                "high": {"hits": 2.4, "home_runs": 0.5, "rbis": 1.6},
            },
        }

    async def _search_players_database(
        self, query: str, sport: str, limit: int
    ) -> List[Dict[str, Any]]:
        """Search players in database"""
        # Mock implementation for development
        return (
            [
                {
                    "id": "aaron-judge",
                    "name": "Aaron Judge",
                    "team": "NYY",
                    "position": "OF",
                    "sport": "MLB",
                    "active": True,
                    "injury_status": None,
                }
            ]
            if "judge" in query.lower()
            else []
        )

    def _calculate_trends(self, game_logs: List[GameLog]) -> List[Dict[str, Any]]:
        """Calculate performance trends from game logs"""
        trends = []
        for i, game in enumerate(game_logs):
            trends.append(
                {
                    "game": i + 1,
                    "date": game.date,
                    "opponent": game.opponent,
                    "hits": game.stats.hits,
                    "home_runs": game.stats.home_runs,
                    "rbis": game.stats.rbis,
                    "batting_average": game.stats.batting_average,
                }
            )
        return trends

    async def _get_matchup_history(
        self, player_id: str, opponent_team: str, sport: str
    ) -> Dict[str, Any]:
        """Get historical performance against opponent"""
        return {
            "games_played": 12,
            "batting_average": 0.275,
            "home_runs": 3,
            "rbis": 8,
            "ops": 0.845,
        }

    async def _get_opponent_analysis(
        self, opponent_team: str, sport: str
    ) -> Dict[str, Any]:
        """Analyze opponent team stats"""
        return {
            "team_era": 4.25,
            "team_whip": 1.32,
            "defensive_efficiency": 0.695,
            "park_factors": {"hr_factor": 1.05, "hits_factor": 0.98},
        }

    def _calculate_matchup_rating(
        self, matchup_data: Dict[str, Any], opponent_data: Dict[str, Any]
    ) -> float:
        """Calculate matchup favorability rating"""
        return 7.5  # Mock rating out of 10

    def _generate_matchup_insights(
        self, matchup_data: Dict[str, Any], opponent_data: Dict[str, Any]
    ) -> List[str]:
        """Generate key insights for matchup"""
        return [
            "Strong historical performance against this opponent",
            "Favorable park factors for power hitting",
            "Opponent bullpen has struggled recently",
        ]

    async def _generate_basic_props(
        self, player_id: str, sport: str
    ) -> List[Dict[str, Any]]:
        """Generate basic prop predictions as fallback"""
        return [
            {
                "prop_type": "hits",
                "line": 1.5,
                "over_probability": 0.65,
                "under_probability": 0.35,
                "confidence": 0.75,
                "recommendation": "OVER",
            },
            {
                "prop_type": "home_runs",
                "line": 0.5,
                "over_probability": 0.45,
                "under_probability": 0.55,
                "confidence": 0.68,
                "recommendation": "UNDER",
            },
        ]


# Create singleton instance
player_dashboard_service = PlayerDashboardService()
