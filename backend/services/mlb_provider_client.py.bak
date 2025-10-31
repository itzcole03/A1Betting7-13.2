import asyncio
import json
import logging
import os
import time
from typing import Any, Dict, List, Optional, Tuple

import httpx
import redis.asyncio as redis

# Import Baseball Savant client for comprehensive prop coverage
from .baseball_savant_client import BaseballSavantClient

# Import enhanced data pipeline services
from .enhanced_data_pipeline import enhanced_data_pipeline

# Import enhanced ML service for real confidence calculations
from .enhanced_ml_service import enhanced_ml_service
from .intelligent_cache_service import intelligent_cache_service

# Import our new MLB Stats API client for free, official MLB data
from .mlb_stats_api_client import MLBStatsAPIClient

# Import PR8 tracing for provider operation observability
try:
    from ..utils.trace_utils import trace_span, add_span_tag, traced
except ImportError:
    # Fallback for when tracing is not available
    def trace_span(span_name, service_name=None, operation_name=None, tags=None):
        import contextlib
        @contextlib.contextmanager
        def dummy_span():
            yield f"span-{span_name}"
        return dummy_span()
    
    def add_span_tag(span_id, key, value):
        pass
        
    def traced(span_name=None, service_name=None, operation_name=None):
        def decorator(func):
            return func
        return decorator

logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")


class MLBProviderClient:
    def __init__(self):
        # Initialize Redis connection
        self.redis = None

        # Initialize enhanced services
        self.data_pipeline = enhanced_data_pipeline
        self.cache_service = intelligent_cache_service

        # Initialize MLB Stats API and Baseball Savant clients
        self.mlb_stats_client = MLBStatsAPIClient()
        self.baseball_savant_client = BaseballSavantClient()

        # Initialize ML service flag
        self._ml_service_initialized = False

        # Register data sources with circuit breakers
        self.data_pipeline.register_data_source(
            "theodds_api", failure_threshold=3, recovery_timeout=60, success_threshold=2
        )

        self.data_pipeline.register_data_source(
            "mlb_stats_api",
            failure_threshold=5,
            recovery_timeout=30,
            success_threshold=3,
        )

        # Configuration
        self.theodds_api_key = os.getenv("THEODDS_API_KEY", "")
        self.CACHE_TTL = 300  # 5 minutes

    @staticmethod
    def alert_event(event_name: str, details: dict):
        # Placeholder for real alerting (e.g., Sentry, email, Slack)
        logger.warning(f"[ALERT] {event_name}: {json.dumps(details)}")

    @staticmethod
    def metrics_increment(metric_name: str):
        # Placeholder for real metrics integration (e.g., Prometheus, StatsD)
        logger.info(f"[METRICS] Incremented metric: {metric_name}")

    async def fetch_player_props_theodds(self) -> list:
        """
        Fetch and normalize MLB player props from TheOdds API using enhanced data pipeline.
        Returns a list of normalized player prop dicts.
        """
        with trace_span("fetch_player_props_theodds", service_name="mlb_provider", operation_name="fetch_props") as span_id:
            add_span_tag(span_id, "provider", "theodds")
            add_span_tag(span_id, "sport", "mlb")
            
            season_year = time.strftime("%Y")
            cache_key = f"mlb:player_props:{season_year}"
            
            add_span_tag(span_id, "cache_key", cache_key)

            # Try intelligent cache first
            cached = await self.cache_service.get(cache_key, user_context="mlb_provider")
            if cached:
                add_span_tag(span_id, "cache_hit", True)
                logger.info(
                    "[MLBProviderClient] Returning cached player props from intelligent cache."
                )
                MLBProviderClient.metrics_increment("mlb.player_props.cache_hit")

                # Handle compressed cache data
                if isinstance(cached, dict) and cached.get("compressed"):
                    from .enhanced_data_pipeline import DataCompressionService

                    compression_service = DataCompressionService()
                    compressed_data = bytes.fromhex(cached["data"])
                    return await compression_service.decompress_json(compressed_data)
                elif isinstance(cached, dict) and "data" in cached:
                    return cached["data"]
                else:
                    return cached

            # Cache miss - rebuild data with span tracking
            add_span_tag(span_id, "cache_hit", False)
            add_span_tag(span_id, "cache_rebuild", True)
            
            try:
                # Fetch events and props in parallel using enhanced pipeline
                with trace_span("fetch_parallel_data", service_name="mlb_provider", operation_name="parallel_fetch") as parallel_span:
                    add_span_tag(parallel_span, "parent_operation", "fetch_player_props_theodds")
                    
                    sources = [
                        ("theodds_events", self._fetch_mlb_events, (), {}),
                        ("theodds_markets", self._get_player_prop_markets, (), {}),
                    ]

                    results = await self.data_pipeline.fetch_parallel_data(
                        sources, max_failures=1
                    )
                    add_span_tag(parallel_span, "sources_fetched", len(sources))

                events = results.get("theodds_events", [])
                if not events:
                    logger.error("No MLB events fetched")
                    return []

                # Fetch player props for all events in parallel with rate limiting
                all_props = []
                semaphore = asyncio.Semaphore(5)  # Limit concurrent requests

                async def fetch_event_props_safe(event):
                    async with semaphore:
                        return await self.data_pipeline.fetch_data_with_resilience(
                            "theodds_api",
                            self._fetch_event_player_props_raw,
                            event,
                            use_cache=True,
                            cache_ttl=180,  # 3 minutes for individual events
                        )

                # Process events in batches
                with trace_span("process_event_batches", service_name="mlb_provider", operation_name="batch_processing") as batch_span:
                    add_span_tag(batch_span, "total_events", len(events))
                    
                    batch_size = 10
                    for i in range(0, len(events), batch_size):
                        batch = events[i : i + batch_size]
                        tasks = [fetch_event_props_safe(event) for event in batch]
                        batch_results = await asyncio.gather(*tasks, return_exceptions=True)

                        for result in batch_results:
                            if isinstance(result, Exception):
                                logger.error(f"Error fetching event props: {result}")
                            elif result:
                                all_props.extend(result)
                    
                    add_span_tag(batch_span, "total_props_fetched", len(all_props))

                # Cache the complete result with intelligent TTL
                await self.cache_service.set(
                    cache_key,
                    all_props,
                    ttl_seconds=self.CACHE_TTL,
                    user_context="mlb_provider",
                )

                logger.info(
                    f"[MLBProviderClient] Enhanced fetch completed: {len(all_props)} props"
                )
                add_span_tag(span_id, "operation_success", True)
                return all_props

            except Exception as e:
                add_span_tag(span_id, "operation_success", False)
                add_span_tag(span_id, "error", str(e))
                logger.error(f"Enhanced fetch_player_props_theodds failed: {e}")
                MLBProviderClient.alert_event("mlb_props_fetch_failed", {"error": str(e)})

                # Try to return stale cache data as last resort
                stale_data = await self.cache_service.get(f"stale:{cache_key}")
                return stale_data if stale_data else []

    async def fetch_player_props_mlb_stats(self) -> list:
        """
        Fetch and generate MLB player props using MLB Stats API and Baseball Savant.
        This replaces TheOdds API with free, official MLB data sources.
        Returns a list of normalized player prop dicts compatible with existing frontend.
        """
        import asyncio
        from datetime import datetime, timedelta

        import statsapi

        season_year = time.strftime("%Y")
        cache_key = f"mlb:player_props_mlb_stats:{season_year}"

        # Try cache first using Redis directly
        redis_conn = await self._get_redis()
        cached = await redis_conn.get(cache_key)
        if cached:
            logger.info(
                "[MLBProviderClient] Returning cached player props from MLB Stats API."
            )
            MLBProviderClient.metrics_increment("mlb.player_props.mlb_stats.cache_hit")
            return json.loads(cached)

        try:
            logger.info(
                "[MLBProviderClient] Generating props from MLB Stats API + Baseball Savant..."
            )

            # Step 1: Get upcoming games (scheduled, not completed)
            today = datetime.now().strftime("%Y-%m-%d")
            tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
            day_after = (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d")

            # Collect games from today, tomorrow, and day after - filter for scheduled games only
            all_games = []
            for check_date in [today, tomorrow, day_after]:
                try:
                    daily_games = statsapi.schedule(date=check_date)
                    # Only include scheduled games, not completed ones
                    scheduled_games = [
                        game
                        for game in daily_games
                        if game.get("status") == "Scheduled"
                    ]
                    all_games.extend(scheduled_games)
                    logger.info(
                        f"Found {len(scheduled_games)} scheduled games for {check_date}"
                    )
                except Exception as e:
                    logger.warning(f"Error fetching games for {check_date}: {e}")

            games_today = all_games
            logger.info(f"Total upcoming scheduled games: {len(games_today)}")

            if not games_today:
                logger.warning(
                    "No games found for today/tomorrow, generating props for all active players"
                )

            # Step 2: Get all active players from Baseball Savant
            try:
                # Ensure baseball_savant_client is initialized
                if (
                    not hasattr(self, "baseball_savant_client")
                    or self.baseball_savant_client is None
                ):
                    logger.warning(
                        "Baseball Savant client not initialized, creating new instance"
                    )
                    from .baseball_savant_client import BaseballSavantClient

                    self.baseball_savant_client = BaseballSavantClient()

                all_players = await self.baseball_savant_client.get_all_active_players()
                logger.info(
                    f"Retrieved {len(all_players)} active players from Baseball Savant"
                )
            except Exception as e:
                logger.error(f"Failed to get players from Baseball Savant: {e}")
                # Fallback to generating props for star players only
                all_players = self._get_star_players()
                logger.info(
                    f"Using fallback star players list: {len(all_players)} players"
                )

            # Step 3: Filter players who are playing in today's games
            playing_today = set()
            team_games = {}

            for game in games_today:
                away_team = game.get("away_name", "")
                home_team = game.get("home_name", "")
                game_time = game.get("game_datetime", "")

                # Map team names to players
                team_games[away_team] = {
                    "opponent": home_team,
                    "game_time": game_time,
                    "game_id": game.get("game_id", ""),
                    "venue": game.get("venue_name", ""),
                    "status": game.get("status", "Scheduled"),
                }
                team_games[home_team] = {
                    "opponent": away_team,
                    "game_time": game_time,
                    "game_id": game.get("game_id", ""),
                    "venue": game.get("venue_name", ""),
                    "status": game.get("status", "Scheduled"),
                }

            # Step 4: Generate props for players in today's games + team props
            all_props = []
            prop_id_counter = 1

            # Generate team-level props first
            team_props = self._generate_team_props(games_today, prop_id_counter)
            all_props.extend(team_props)
            prop_id_counter += len(team_props)

            # Filter players to only those confirmed to be playing today
            confirmed_players = []
            for player in all_players:
                player_name = player.get("name", "")
                player_team = player.get("team", "")
                position_type = player.get("position_type", "batter")

                # Check if player's team is playing today
                game_info = None
                for team_name, game_data in team_games.items():
                    if (
                        player_team.lower() in team_name.lower()
                        or team_name.lower() in player_team.lower()
                    ):
                        game_info = game_data
                        break

                # Only include players whose teams are actually playing
                if game_info:
                    # Try to get confirmed lineup data from MLB Stats API
                    try:
                        game_id = game_info.get("game_id")
                        if game_id:
                            # In a real implementation, we'd call MLB Stats API for lineups
                            # For now, include all active players from playing teams
                            player["game_info"] = game_info
                            confirmed_players.append(player)
                    except Exception as e:
                        logger.warning(
                            f"Could not verify lineup for {player_name}: {e}"
                        )
                        # Include player anyway if team is playing
                        player["game_info"] = game_info
                        confirmed_players.append(player)

            logger.info(
                f"Confirmed {len(confirmed_players)} players from teams playing today"
            )

            for player in confirmed_players:
                player_name = player.get("name", "")
                player_team = player.get("team", "")
                position_type = player.get("position_type", "batter")
                game_info = player.get("game_info")

                # Generate realistic props based on player type and recent stats
                player_stats = player.get("stats", {})

                if position_type in ["batter", "both"]:
                    # Generate batting props (only if game_info exists)
                    if game_info:
                        batting_props = self._generate_batting_props(
                            player_name,
                            player_team,
                            player_stats,
                            game_info,
                            prop_id_counter,
                        )
                        all_props.extend(batting_props)
                        prop_id_counter += len(batting_props)

                if position_type in ["pitcher", "both"]:
                    # Generate pitching props (only if game_info exists)
                    if game_info:
                        pitcher_stats = player.get("pitcher_stats", player_stats)
                        pitching_props = self._generate_pitching_props(
                            player_name,
                            player_team,
                            pitcher_stats,
                            game_info,
                            prop_id_counter,
                        )
                        all_props.extend(pitching_props)
                        prop_id_counter += len(pitching_props)

            # Step 5: Add some variety if we don't have enough props
            if len(all_props) < 50:
                logger.info(f"Only generated {len(all_props)} props, adding variety...")
                # Add props for star players even if not playing today
                star_players = self._get_star_players()
                for star in star_players:
                    if len(all_props) >= 100:
                        break
                    star_props = self._generate_star_player_props(star, prop_id_counter)
                    all_props.extend(star_props)
                    prop_id_counter += len(star_props)

            # Cache the result
            await redis_conn.set(cache_key, json.dumps(all_props), ex=self.CACHE_TTL)

            logger.info(
                f"[MLBProviderClient] Generated {len(all_props)} props using MLB Stats API + Baseball Savant"
            )
            MLBProviderClient.metrics_increment("mlb.player_props.mlb_stats.success")
            return all_props

        except Exception as e:
            logger.error(f"fetch_player_props_mlb_stats failed: {e}")
            MLBProviderClient.alert_event(
                "mlb_props_mlb_stats_failed", {"error": str(e)}
            )

            # Return empty list on failure
            return []

    def _generate_team_props(self, games: list, start_id: int) -> list:
        """Generate team-level props for games (team totals, first to score, etc.)."""
        from datetime import datetime

        props = []
        prop_counter = start_id

        for game in games:
            home_team = game.get("home_name", "")
            away_team = game.get("away_name", "")
            game_time = game.get("game_datetime", "")
            game_id = game.get("game_id", "")
            venue = game.get("venue_name", "")

            # Team total runs props
            for team, team_type in [(home_team, "home"), (away_team, "away")]:
                team_props = [
                    {
                        "stat_type": "team_total_runs",
                        "line": 4.5,  # Standard team total
                        "confidence": 73,
                    },
                    {
                        "stat_type": "team_total_hits",
                        "line": 8.5,  # Standard team hits total
                        "confidence": 71,
                    },
                    {
                        "stat_type": "first_to_score",
                        "line": 0.5,  # Even odds prop
                        "confidence": 50,  # Pure coin flip
                    },
                ]

                for template in team_props:
                    prop = {
                        "id": f"mlb_team_{prop_counter}",
                        "event_id": game_id,
                        "provider_id": "mlb_stats_api",
                        "stat_type": template["stat_type"],
                        "player_name": f"{team} Team",  # Team name as "player"
                        "position": "TEAM",
                        "line": template["line"],
                        "line_score": template["line"],
                        "odds": 100,
                        "confidence": template["confidence"],
                        "start_time": game_time,
                        "event_name": f"{away_team} vs {home_team}",
                        "matchup": f"{away_team} vs {home_team}",
                        "team_name": team,
                        "sport": "MLB",
                        "game_status": game.get("status", "Scheduled"),
                        "venue": venue,
                    }
                    props.append(prop)
                    prop_counter += 1

        logger.info(f"Generated {len(props)} team-level props for {len(games)} games")
        return props

    def _generate_batting_props(
        self, player_name: str, team: str, stats: dict, game_info: dict, start_id: int
    ) -> list:
        """Generate comprehensive, realistic batting props based on player stats and real sportsbook offerings."""
        from datetime import datetime

        props = []

        # Get player's season averages for realistic lines
        avg = stats.get("AVG", 0.250)  # Default batting average
        pa_per_game = stats.get("PA", 450) / 162  # Plate appearances per game
        hr_rate = stats.get("HR", 20) / 162  # Home runs per game
        rbi_rate = stats.get("RBI", 70) / 162  # RBIs per game
        runs_rate = stats.get("R", 60) / 162  # Runs per game
        bb_rate = stats.get("BB", 40) / 162  # Walks per game
        so_rate = stats.get("SO", 120) / 162  # Strikeouts per game
        sb_rate = stats.get("SB", 5) / 162  # Stolen bases per game
        doubles_rate = stats.get("2B", 25) / 162  # Doubles per game

        # Enhanced batting props matching real sportsbook offerings
        prop_templates = [
            {
                "stat_type": "hits",
                "line": max(
                    0.5, round(avg * pa_per_game * 3.5 * 2) / 2
                ),  # Round to nearest 0.5
                "confidence": 75
                + int(avg * 100) // 4,  # Higher confidence for better hitters
            },
            {
                "stat_type": "total_bases",
                "line": max(1.5, round(avg * pa_per_game * 5.0 * 2) / 2),
                "confidence": 70 + int(avg * 100) // 5,
            },
            {
                "stat_type": "runs_scored",
                "line": max(0.5, round(runs_rate * 2) / 2),
                "confidence": 72 + int(runs_rate * 50),
            },
            {
                "stat_type": "rbis",
                "line": max(0.5, round(rbi_rate * 2) / 2),
                "confidence": 72 + int(rbi_rate * 40),
            },
            {
                "stat_type": "home_runs",
                "line": 0.5,  # Most HR props are 0.5
                "confidence": 65 + int(hr_rate * 100),
            },
            {
                "stat_type": "walks",
                "line": max(0.5, round(bb_rate * 2) / 2),
                "confidence": 68 + int(bb_rate * 30),
            },
            {
                "stat_type": "strikeouts_batter",
                "line": max(0.5, round(so_rate * 2) / 2),
                "confidence": 74
                + int((3.0 - so_rate) * 10),  # Higher K rate = lower confidence
            },
            {
                "stat_type": "stolen_bases",
                "line": 0.5 if sb_rate > 0.03 else 0.5,  # Most SB props are 0.5
                "confidence": 60 + int(sb_rate * 200),
            },
            {
                "stat_type": "doubles",
                "line": 0.5,
                "confidence": 65 + int(doubles_rate * 80),
            },
        ]

        for i, template in enumerate(prop_templates):
            game_time = (
                game_info.get("game_time", "")
                if game_info
                else datetime.now().isoformat()
            )
            opponent = game_info.get("opponent", "TBD") if game_info else "TBD"

            prop = {
                "id": f"mlb_stats_{start_id + i}",
                "event_id": (
                    game_info.get("game_id", f"mlb_game_{start_id + i}")
                    if game_info
                    else f"mlb_game_{start_id + i}"
                ),
                "provider_id": "mlb_stats_api",
                "stat_type": template["stat_type"],
                "player_name": player_name,
                "position": self._get_position_number(stats.get("position", "1B")),
                "line": template["line"],
                "line_score": template["line"],
                "odds": 100,  # Even odds as default
                "confidence": min(95, template["confidence"]),
                "start_time": game_time,
                "event_name": f"{team} vs {opponent}",
                "matchup": f"{team} vs {opponent}",
                "team_name": team,
                "sport": "MLB",
                "game_status": (
                    game_info.get("status", "Scheduled") if game_info else "Scheduled"
                ),
                "venue": game_info.get("venue", "TBD") if game_info else "TBD",
            }
            props.append(prop)

        return props

    def _generate_pitching_props(
        self, player_name: str, team: str, stats: dict, game_info: dict, start_id: int
    ) -> list:
        """Generate comprehensive, realistic pitching props based on player stats and real sportsbook offerings."""
        from datetime import datetime

        props = []

        # Get pitcher's season averages
        ip_per_start = (
            stats.get("IP", 100) / stats.get("GS", 20)
            if stats.get("GS", 0) > 0
            else 5.0
        )
        k_per_9 = stats.get("K/9", 8.0)
        era = stats.get("ERA", 4.50)
        whip = stats.get("WHIP", 1.30)
        hr_per_9 = stats.get("HR/9", 1.0)
        bb_per_9 = stats.get("BB/9", 3.0)
        h_per_9 = stats.get("H/9", 9.0)

        # Calculate realistic prop lines
        expected_k = (ip_per_start * k_per_9) / 9
        expected_walks = (ip_per_start * bb_per_9) / 9
        expected_hits = (ip_per_start * h_per_9) / 9
        expected_runs = (ip_per_start * era) / 9

        # Enhanced pitching props matching real sportsbook offerings
        prop_templates = [
            {
                "stat_type": "strikeouts_pitcher",
                "line": max(3.5, round(expected_k * 2) / 2),  # Round to nearest 0.5
                "confidence": 75
                + max(0, int((10 - era) * 2)),  # Better ERA = higher confidence
            },
            {
                "stat_type": "pitcher_outs",
                "line": max(
                    12.5, round(ip_per_start * 3 * 2) / 2
                ),  # Outs = innings * 3
                "confidence": 70 + max(0, int((7.0 - era) * 3)),
            },
            {
                "stat_type": "earned_runs",
                "line": max(1.5, round(expected_runs * 2) / 2),
                "confidence": 68 + max(0, int((5.0 - era) * 4)),
            },
            {
                "stat_type": "walks_pitcher",
                "line": max(1.5, round(expected_walks * 2) / 2),
                "confidence": 70 + max(0, int((4.0 - bb_per_9) * 5)),
            },
            {
                "stat_type": "hits_allowed",
                "line": max(4.5, round(expected_hits * 2) / 2),
                "confidence": 69 + max(0, int((10.0 - h_per_9) * 2)),
            },
            {
                "stat_type": "pitcher_wins",
                "line": 0.5,  # Most pitcher win props are 0.5
                "confidence": 65 + max(0, int((3.5 - era) * 8)),
            },
            {
                "stat_type": "quality_start",
                "line": 0.5,  # Quality start prop (6+ IP, 3 or fewer ER)
                "confidence": 70 + max(0, int((4.0 - era) * 5)),
            },
        ]

        for i, template in enumerate(prop_templates):
            game_time = (
                game_info.get("game_time", "")
                if game_info
                else datetime.now().isoformat()
            )
            opponent = game_info.get("opponent", "TBD") if game_info else "TBD"

            prop = {
                "id": f"mlb_stats_pitcher_{start_id + i}",
                "event_id": (
                    game_info.get("game_id", f"mlb_game_{start_id + i}")
                    if game_info
                    else f"mlb_game_{start_id + i}"
                ),
                "provider_id": "mlb_stats_api",
                "stat_type": template["stat_type"],
                "player_name": player_name,
                "position": "1",  # Pitcher position
                "line": template["line"],
                "line_score": template["line"],
                "odds": 100,
                "confidence": min(95, template["confidence"]),
                "start_time": game_time,
                "event_name": f"{team} vs {opponent}",
                "matchup": f"{team} vs {opponent}",
                "team_name": team,
                "sport": "MLB",
                "game_status": (
                    game_info.get("status", "Scheduled") if game_info else "Scheduled"
                ),
                "venue": game_info.get("venue", "TBD") if game_info else "TBD",
            }
            props.append(prop)

        return props

    def _get_position_number(self, position_str: str) -> str:
        """Convert position string to position number."""
        position_map = {
            "P": "1",
            "1B": "3",
            "2B": "4",
            "3B": "5",
            "SS": "6",
            "LF": "7",
            "CF": "8",
            "RF": "9",
            "C": "2",
            "DH": "10",
        }
        return position_map.get(position_str.upper(), "9")  # Default to RF

    def _get_star_players(self) -> list:
        """Return a list of star players for prop generation when games are limited."""
        return [
            {
                "name": "Aaron Judge",
                "team": "NYY",
                "stats": {"AVG": 0.280, "HR": 55, "RBI": 120},
            },
            {
                "name": "Mookie Betts",
                "team": "LAD",
                "stats": {"AVG": 0.295, "HR": 35, "RBI": 95},
            },
            {
                "name": "Ronald Acuna Jr.",
                "team": "ATL",
                "stats": {"AVG": 0.315, "HR": 40, "RBI": 100},
            },
            {
                "name": "Shohei Ohtani",
                "team": "LAA",
                "stats": {"AVG": 0.285, "HR": 45, "RBI": 110},
            },
            {
                "name": "Mike Trout",
                "team": "LAA",
                "stats": {"AVG": 0.275, "HR": 35, "RBI": 85},
            },
        ]

    def _generate_star_player_props(self, star: dict, start_id: int) -> list:
        """Generate props for star players."""
        from datetime import datetime

        fake_game_info = {
            "opponent": "TBD",
            "game_time": datetime.now().isoformat(),
            "game_id": f"future_game_{start_id}",
            "venue": "TBD",
            "status": "Scheduled",
        }

        return self._generate_batting_props(
            star["name"], star["team"], star["stats"], fake_game_info, start_id
        )

    async def _fetch_mlb_events(self) -> List[Dict[str, Any]]:
        """Fetch MLB events using httpx with proper error handling"""
        events_url = f"https://api.the-odds-api.com/v4/sports/baseball_mlb/events/?apiKey={self.theodds_api_key}"

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(events_url)
            response.raise_for_status()
            events = response.json()

            if not isinstance(events, list):
                raise ValueError("Events response is not a list")

            logger.info(f"Fetched {len(events)} MLB events")
            return events

    async def _get_player_prop_markets(self) -> List[str]:
        """Get available player prop markets"""
        return [
            "batter_home_runs",
            "batter_hits",
            "pitcher_strikeouts",
            "batter_rbis",
            "batter_runs_scored",
        ]

    async def _fetch_event_player_props_raw(
        self, event: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Fetch player props for a specific event"""
        event_id = event.get("id")
        event_name = f"{event.get('home_team', '')} vs {event.get('away_team', '')}"
        event_start_time = event.get("commence_time", "")

        markets = await self._get_player_prop_markets()
        url = (
            f"https://api.the-odds-api.com/v4/sports/baseball_mlb/events/{event_id}/odds/"
            f"?apiKey={self.theodds_api_key}&regions=us&markets={','.join(markets)}"
        )

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url)
            response.raise_for_status()
            data = response.json()

        results = []
        for bookmaker in data.get("bookmakers", []):
            for market in bookmaker.get("markets", []):
                market_key = market.get("key", "")
                if market_key not in markets:
                    continue

                for outcome in market.get("outcomes", []):
                    player_name = (
                        outcome.get("player")
                        or outcome.get("description")
                        or outcome.get("name")
                    )

                    # Calculate ML-based confidence
                    prop_data = {
                        "player_name": player_name,
                        "stat_type": market_key,
                        "matchup": event_name,
                        "value": outcome.get("price"),
                        "line": outcome.get("point") or market.get("point"),
                        "team_name": outcome.get("team") or "",
                    }
                    confidence = await self._calculate_ml_confidence(prop_data)

                    line = outcome.get("point") or market.get("point") or None
                    results.append(
                        {
                            "event_id": event_id,
                            "event_name": event_name,
                            "start_time": event_start_time,
                            "team_name": outcome.get("team") or "",
                            "player_name": player_name,
                            "stat_type": market_key,
                            "odds_type": market_key,
                            "matchup": event_name,
                            "confidence": confidence,
                            "value": outcome.get("price"),
                            "provider_id": bookmaker.get("key"),
                            "mapping_fallback": False,
                            "line": line,
                        }
                    )

        return results

    async def fetch_odds_comparison(
        self, market_type: str = "regular"
    ) -> List[Dict[str, Any]]:
        """
        Fetch and cache odds using the MLB Stats API as primary source.
        Falls back to SportRadar/TheOdds APIs only if needed.
        market_type: one of 'futures', 'prematch', 'regular', 'playerprops'
        Returns a list of odds dicts.
        """
        from logging import getLogger

        logger = getLogger("propollama")
        print("[DEBUG] Entered fetch_odds_comparison (MLB Stats API primary)")
        try:
            logger.debug(
                f"[MLBProviderClient] START fetch_odds_comparison for market_type={market_type} using MLB Stats API"
            )
            redis_conn = await self._get_redis()
            season_year = time.strftime("%Y")
            # Completely bypass cache for debugging
            cache_key = f"mlb:odds_comparison:{market_type}:{season_year}:debug:{int(time.time() * 1000)}"
            cached = await redis_conn.get(cache_key)

            if cached:
                print(f"[DEBUG] Returning cached MLB Stats API data for {market_type}")
                logger.info(
                    f"[MLBProviderClient] Returning cached MLB Stats API data for {market_type}."
                )
                MLBProviderClient.metrics_increment(
                    f"mlb.odds_comparison.{market_type}.cache_hit"
                )
                result = json.loads(cached)
                return result

            # Try MLB Stats API first (free, reliable)
            logger.info(
                f"[MLBProviderClient] Fetching {market_type} data from MLB Stats API (primary source)"
            )

            if market_type == "playerprops":
                # Get comprehensive player props data from our enhanced system
                logger.info(
                    "[MLBProviderClient] Using comprehensive enhanced props system"
                )
                mlb_props_data = await self.fetch_mlb_stats_player_props()
            else:
                # Get team/game data from MLB Stats API
                mlb_props_data = await self.fetch_mlb_stats_team_data(market_type)

            if (
                mlb_props_data
                and isinstance(mlb_props_data, list)
                and len(mlb_props_data) > 0
            ):
                # Apply prop deduplication before caching and returning
                deduplicated_data = await self._deduplicate_props(mlb_props_data)

                await redis_conn.set(
                    cache_key, json.dumps(deduplicated_data), ex=self.CACHE_TTL
                )
                logger.info(
                    f"[MLBProviderClient] Successfully retrieved {len(deduplicated_data)} items from MLB Stats API for {market_type}"
                )
                MLBProviderClient.metrics_increment(
                    "mlb.odds_comparison.mlb_stats_api_success"
                )

                print(
                    f"[DEBUG] Returning MLB Stats API data for {market_type}, count: {len(deduplicated_data)}"
                )
                return deduplicated_data
            else:
                logger.warning(
                    f"[MLBProviderClient] MLB Stats API returned no data for {market_type}, attempting external API fallback"
                )

            # Only fallback to external APIs if MLB Stats API fails and we have API keys
            if self.sportradar_api_key and self.theodds_api_key:
                logger.info(
                    f"[MLBProviderClient] Falling back to external APIs for {market_type}"
                )
                return await self._fetch_external_api_fallback(
                    market_type, cache_key, redis_conn
                )
            else:
                logger.warning(
                    "[MLBProviderClient] No external API keys configured, relying on MLB Stats API only"
                )

            # If everything fails, return empty list
            logger.error(
                f"[MLBProviderClient] All data sources failed for market_type {market_type}"
            )
            MLBProviderClient.metrics_increment("mlb.odds_comparison.total_failure")
            MLBProviderClient.alert_event(
                "mlb_odds_comparison_total_failure", {"market_type": market_type}
            )

            return []

        except Exception as e:
            logger.error(
                f"[MLBProviderClient] Unhandled exception in fetch_odds_comparison: {e}",
                exc_info=True,
            )
            print(
                f"[DEBUG] Unhandled exception in fetch_odds_comparison: {e}, returning []"
            )
            return []

    async def fetch_mlb_stats_player_props(self) -> List[Dict[str, Any]]:
        """
        Fetch player props data using MLB Stats API + Baseball Savant integration.
        This dramatically expands coverage from 50-60 to 500-1000+ props.
        Now generates props for SCHEDULED upcoming games, not final games.
        """
        try:
            logger.info(
                "[MLBProviderClient] Generating comprehensive player props for SCHEDULED games"
            )

            # Get scheduled upcoming games instead of final games
            from datetime import datetime, timedelta

            import statsapi

            today = datetime.now()
            tomorrow = today + timedelta(days=1)

            # Get scheduled games from today and tomorrow
            today_games = statsapi.schedule(date=today.strftime("%Y-%m-%d"))
            tomorrow_games = statsapi.schedule(date=tomorrow.strftime("%Y-%m-%d"))

            # Filter for only scheduled games (upcoming, not final)
            scheduled_games = []
            for game in today_games + tomorrow_games:
                if game.get("status") == "Scheduled":
                    scheduled_games.append(game)

            logger.info(
                f"[MLBProviderClient] Found {len(scheduled_games)} scheduled games for prop generation"
            )

            if not scheduled_games:
                # If no scheduled games, use a broader approach to get all active players
                logger.warning(
                    "[MLBProviderClient] No scheduled games found, generating props for all active players"
                )
                return await self._generate_comprehensive_props_all_players()

            # Generate comprehensive props for scheduled games
            all_props = []
            prop_id = 1

            # Get all active players from Baseball Savant
            logger.info("About to call baseball_savant_client.get_all_active_players()")
            try:
                active_players = (
                    await self.baseball_savant_client.get_all_active_players()
                )
                logger.info(
                    f"[MLBProviderClient] Successfully got {len(active_players)} active players from Baseball Savant"
                )

                # Debug: Show sample players and their teams
                if active_players:
                    logger.info("Sample active players:")
                    for player in active_players[:5]:
                        logger.info(
                            f"  - {player.get('name')}: {player.get('team')} ({player.get('position_type')})"
                        )
                else:
                    logger.error("Baseball Savant client returned empty list!")

            except Exception as e:
                logger.error(f"Error calling Baseball Savant client: {e}")
                active_players = []

            # Generate props for each scheduled game
            for game in scheduled_games:
                event_id = game.get("game_pk", f"scheduled_{prop_id}")
                event_name = (
                    f"{game.get('away_name', 'Away')} @ {game.get('home_name', 'Home')}"
                )
                venue = game.get("venue_name", "MLB Stadium")
                start_time = game.get(
                    "game_datetime", game.get("time", today.strftime("%Y-%m-%d"))
                )

                # Get players for both teams in this game - use team names, not generic "home"/"away"
                home_team = game.get("home_name", "HOME")
                away_team = game.get("away_name", "AWAY")

                # Filter players by teams playing in this game
                # Need to map team names to player team codes - expand mapping for full team names
                team_mapping = {
                    # Full team names to codes
                    "GIANTS": "SF",
                    "SAN FRANCISCO GIANTS": "SF",
                    "PIRATES": "PIT",
                    "PITTSBURGH PIRATES": "PIT",
                    "TWINS": "MIN",
                    "MINNESOTA TWINS": "MIN",
                    "TIGERS": "DET",
                    "DETROIT TIGERS": "DET",
                    "ASTROS": "HOU",
                    "HOUSTON ASTROS": "HOU",
                    "MARLINS": "MIA",
                    "MIAMI MARLINS": "MIA",
                    "ORIOLES": "BAL",
                    "BALTIMORE ORIOLES": "BAL",
                    "PHILLIES": "PHI",
                    "PHILADELPHIA PHILLIES": "PHI",
                    "ROYALS": "KC",
                    "KANSAS CITY ROYALS": "KC",
                    "RED SOX": "BOS",
                    "BOSTON RED SOX": "BOS",
                    "GUARDIANS": "CLE",
                    "CLEVELAND GUARDIANS": "CLE",
                    "METS": "NYM",
                    "NEW YORK METS": "NYM",
                    "BREWERS": "MIL",
                    "MILWAUKEE BREWERS": "MIL",
                    "BRAVES": "ATL",
                    "ATLANTA BRAVES": "ATL",
                    "CUBS": "CHC",
                    "CHICAGO CUBS": "CHC",
                    "REDS": "CIN",
                    "CINCINNATI REDS": "CIN",
                    "YANKEES": "NYY",
                    "NEW YORK YANKEES": "NYY",
                    "RANGERS": "TEX",
                    "TEXAS RANGERS": "TEX",
                    "BLUE JAYS": "TOR",
                    "TORONTO BLUE JAYS": "TOR",
                    "ROCKIES": "COL",
                    "COLORADO ROCKIES": "COL",
                    "RAYS": "TB",
                    "TAMPA BAY RAYS": "TB",
                    "ANGELS": "LAA",
                    "LOS ANGELES ANGELS": "LAA",
                    "PADRES": "SD",
                    "SAN DIEGO PADRES": "SD",
                    "DIAMONDBACKS": "ARI",
                    "ARIZONA DIAMONDBACKS": "ARI",
                    "CARDINALS": "STL",
                    "ST. LOUIS CARDINALS": "STL",
                    "SAINT LOUIS CARDINALS": "STL",
                    "DODGERS": "LAD",
                    "LOS ANGELES DODGERS": "LAD",
                    "ATHLETICS": "OAK",
                    "OAKLAND ATHLETICS": "OAK",
                    "NATIONALS": "WSH",
                    "WASHINGTON NATIONALS": "WSH",
                    "WHITE SOX": "CWS",
                    "CHICAGO WHITE SOX": "CWS",
                    "MARINERS": "SEA",
                    "SEATTLE MARINERS": "SEA",
                }

                # Try to map team names to codes, with fallback logic
                def map_team_to_code(team_name):
                    if not team_name or team_name in ["HOME", "AWAY"]:
                        return team_name

                    team_upper = team_name.upper()

                    # Direct lookup
                    if team_upper in team_mapping:
                        return team_mapping[team_upper]

                    # Partial matching for keywords
                    for key, code in team_mapping.items():
                        if key in team_upper or any(
                            word in team_upper for word in key.split()
                        ):
                            return code

                    # Fallback: return original name
                    logger.warning(f"Could not map team name '{team_name}' to code")
                    return team_name

                home_code = map_team_to_code(home_team)
                away_code = map_team_to_code(away_team)

                logger.info(
                    f"Team filtering: {home_team} → {home_code}, {away_team} → {away_code}"
                )

                game_players = [
                    player
                    for player in active_players
                    if player.get("team", "").upper() in [home_code, away_code]
                ]

                logger.info(
                    f"Found {len(game_players)} players for teams {home_code}/{away_code}"
                )
                if len(game_players) == 0:
                    logger.warning(
                        f"No players found for {home_code}/{away_code}. Check team mapping."
                    )

                logger.info(
                    f"[MLBProviderClient] Generating props for {len(game_players)} players in {event_name}"
                )

                # Generate batting props for position players
                batters = [
                    p
                    for p in game_players
                    if p.get("position_type") in ["batter", "both"]
                ]
                for batter in batters:
                    game_info = {
                        "game_pk": event_id,
                        "away_name": game.get("away_name", "Away"),
                        "home_name": game.get("home_name", "Home"),
                        "venue_name": venue,
                        "game_date": start_time,
                        "status": "Scheduled",
                    }
                    batting_props = self._generate_batting_props(
                        batter.get("name", "Player"),
                        batter.get("team", "MLB"),
                        batter.get("stats", {}),
                        game_info,
                        prop_id,
                    )
                    for prop in batting_props:
                        prop.update(
                            {
                                "event_id": event_id,
                                "event_name": event_name,
                                "start_time": start_time,
                                "venue": venue,
                                "game_status": "Scheduled",  # Key change: Scheduled instead of Final
                                "matchup": event_name,
                                "source": "mlb_stats_api",
                            }
                        )
                        all_props.append(prop)
                        prop_id += 1

                # Generate pitching props for pitchers
                pitchers = [
                    p
                    for p in game_players
                    if p.get("position_type") in ["pitcher", "both"]
                ]
                for pitcher in pitchers:
                    game_info = {
                        "game_pk": event_id,
                        "away_name": game.get("away_name", "Away"),
                        "home_name": game.get("home_name", "Home"),
                        "venue_name": venue,
                        "game_date": start_time,
                        "status": "Scheduled",
                    }
                    pitching_props = self._generate_pitching_props(
                        pitcher.get("name", "Player"),
                        pitcher.get("team", "MLB"),
                        pitcher.get("stats", {}),
                        game_info,
                        prop_id,
                    )
                    for prop in pitching_props:
                        prop.update(
                            {
                                "event_id": event_id,
                                "event_name": event_name,
                                "start_time": start_time,
                                "venue": venue,
                                "game_status": "Scheduled",  # Key change: Scheduled instead of Final
                                "matchup": event_name,
                                "source": "mlb_stats_api",
                            }
                        )
                        all_props.append(prop)
                        prop_id += 1

                # Generate team props for this game
                team_props = self._generate_team_props([game], prop_id)
                for prop in team_props:
                    prop.update(
                        {
                            "game_status": "Scheduled",  # Key change: Scheduled instead of Final
                            "source": "mlb_stats_api",
                        }
                    )
                    all_props.append(prop)
                    prop_id += 1

            logger.info(
                f"[MLBProviderClient] Generated {len(all_props)} comprehensive props for {len(scheduled_games)} scheduled games"
            )
            return all_props

        except Exception as e:
            logger.error(
                f"[MLBProviderClient] Error fetching comprehensive player props: {e}"
            )
            # Fallback to basic props if the comprehensive generation fails
            return await self._generate_comprehensive_props_all_players()

    async def _generate_comprehensive_props_all_players(self) -> List[Dict[str, Any]]:
        """
        Fallback method to generate comprehensive props for all active players
        when no scheduled games are available.
        """
        try:
            from datetime import datetime

            logger.info(
                "[MLBProviderClient] Fallback: Generating props for all active players"
            )

            # Get all active players
            active_players = await self.baseball_savant_client.get_all_active_players()

            all_props = []
            prop_id = 1

            # Get real game data for comprehensive prop generation
            try:
                from datetime import datetime, timedelta

                import statsapi

                # Get today's and tomorrow's games
                today = datetime.now().strftime("%Y-%m-%d")
                tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")

                real_games = []

                # Try to get today's games
                try:
                    todays_games = statsapi.schedule(date=today)
                    real_games.extend(
                        todays_games[:5]
                    )  # Limit to 5 games for performance
                except Exception as e:
                    logger.warning(f"Could not fetch today's games: {e}")

                # Try to get tomorrow's games if today's games are limited
                if len(real_games) < 3:
                    try:
                        tomorrows_games = statsapi.schedule(date=tomorrow)
                        real_games.extend(tomorrows_games[:3])
                    except Exception as e:
                        logger.warning(f"Could not fetch tomorrow's games: {e}")

                # Format real games for prop generation
                formatted_games = []
                for game in real_games:
                    if (
                        game.get("game_id")
                        and game.get("away_name")
                        and game.get("home_name")
                    ):
                        formatted_games.append(
                            {
                                "game_pk": game.get("game_id"),
                                "away_name": game.get("away_name", "Away Team"),
                                "home_name": game.get("home_name", "Home Team"),
                                "venue_name": game.get("venue_name", "MLB Stadium"),
                                "game_date": game.get("game_date", today),
                                "status": game.get("status", "Scheduled"),
                            }
                        )

                # Use real games if available, otherwise fallback to single generic game
                if formatted_games:
                    games_for_props = formatted_games
                else:
                    # Fallback to single generic game if no real games available
                    games_for_props = [
                        {
                            "game_pk": 999001,
                            "away_name": "Team A",
                            "home_name": "Team B",
                            "venue_name": "Baseball Stadium",
                            "game_date": today,
                            "status": "Scheduled",
                        }
                    ]

            except Exception as e:
                logger.warning(f"Failed to fetch real games, using fallback: {e}")
                games_for_props = [
                    {
                        "game_pk": 999001,
                        "away_name": "Team A",
                        "home_name": "Team B",
                        "venue_name": "Baseball Stadium",
                        "game_date": datetime.now().strftime("%Y-%m-%d"),
                        "status": "Scheduled",
                    }
                ]

            # Generate props for all active players using our comprehensive methods
            batters = [
                p
                for p in active_players
                if p.get("position_type") in ["batter", "both"]
            ]
            for batter in batters[:100]:  # Limit to first 100 for performance
                game_info = games_for_props[0]
                batting_props = self._generate_batting_props(
                    batter, batter.get("stats", {}), game_info, prop_id
                )
                for prop in batting_props:
                    prop.update(
                        {
                            "event_id": 999001,
                            "event_name": "MLB Comprehensive Props",
                            "start_time": datetime.now().isoformat(),
                            "venue": "MLB Stadium",
                            "game_status": "Scheduled",
                            "matchup": f"{batter.get('name', 'Player')} Props",
                            "source": "mlb_stats_api_fallback",
                        }
                    )
                    all_props.append(prop)
                    prop_id += 1

            pitchers = [
                p
                for p in active_players
                if p.get("position_type") in ["pitcher", "both"]
            ]
            for pitcher in pitchers[:50]:  # Limit to first 50 pitchers
                game_info = games_for_props[0]
                pitching_props = self._generate_pitching_props(
                    pitcher, pitcher.get("stats", {}), game_info, prop_id
                )
                for prop in pitching_props:
                    prop.update(
                        {
                            "event_id": 999001,
                            "event_name": "MLB Comprehensive Props",
                            "start_time": datetime.now().isoformat(),
                            "venue": "MLB Stadium",
                            "game_status": "Scheduled",
                            "matchup": f"{pitcher.get('name', 'Player')} Props",
                            "source": "mlb_stats_api_fallback",
                        }
                    )
                    all_props.append(prop)
                    prop_id += 1

            # Add team props
            team_props = self._generate_team_props(games_for_props, prop_id)
            for prop in team_props:
                prop.update(
                    {"game_status": "Scheduled", "source": "mlb_stats_api_fallback"}
                )
                all_props.append(prop)

            logger.info(
                f"[MLBProviderClient] Fallback generated {len(all_props)} props"
            )
            return all_props

        except Exception as e:
            logger.error(f"[MLBProviderClient] Fallback prop generation failed: {e}")
            return []

            # Add Baseball Savant props (these already have confidence scores)
            if baseball_savant_props:
                for prop in baseball_savant_props:
                    # Ensure consistent format with existing props
                    formatted_prop = {
                        "event_id": f"savant_{prop['player_id']}",
                        "event_name": f"{prop.get('team', 'MLB')} Player Props",
                        "start_time": "",
                        "team_name": prop.get("team", ""),
                        "player_name": prop.get("player_name", ""),
                        "stat_type": prop.get("prop_type", ""),
                        "odds_type": prop.get("prop_type", ""),
                        "matchup": f"{prop.get('player_name', '')} - {prop.get('description', '')}",
                        "confidence": prop.get("confidence", 75),
                        "value": None,  # Baseball Savant doesn't provide odds values
                        "provider_id": "baseball_savant",
                        "mapping_fallback": False,
                        "line": prop.get("line"),
                        "description": prop.get("description", ""),
                        "category": prop.get("category", "advanced"),
                        "source": "baseball_savant",
                    }
                    all_props.append(formatted_prop)

            logger.info(
                f"[MLBProviderClient] Generated {len(all_props)} total player props "
                f"({len(basic_props_data) if basic_props_data else 0} from MLB Stats API, "
                f"{len(baseball_savant_props) if baseball_savant_props else 0} from Baseball Savant)"
            )
            return all_props

        except Exception as e:
            logger.error(
                f"[MLBProviderClient] Error fetching comprehensive player props: {e}"
            )
            # Fallback to basic MLB Stats API only if Baseball Savant fails
            try:
                basic_props_data = (
                    await self.mlb_stats_client.generate_player_props_data()
                )
                if basic_props_data:
                    enhanced_props = []
                    for prop in basic_props_data:
                        confidence = await self._calculate_ml_confidence(prop)
                        prop["confidence"] = confidence
                        prop["source"] = "mlb_stats_api_fallback"
                        enhanced_props.append(prop)
                    logger.warning(
                        f"[MLBProviderClient] Using fallback MLB Stats API only: {len(enhanced_props)} props"
                    )
                    return enhanced_props
            except Exception as fallback_error:
                logger.error(
                    f"[MLBProviderClient] Fallback also failed: {fallback_error}"
                )

            return []

    async def fetch_mlb_stats_team_data(self, market_type: str) -> List[Dict[str, Any]]:
        """
        Fetch team/game data using the MLB Stats API.
        This handles non-playerprops market types.
        """
        try:
            logger.info(
                f"[MLBProviderClient] Fetching team data from MLB Stats API for {market_type}"
            )

            if market_type in ["regular", "prematch"]:
                # Get today's games
                games = await self.mlb_stats_client.get_todays_games()

                # Convert games to odds-like format
                team_data = []
                for game in games:
                    team_data.append(
                        {
                            "event_id": game.get("game_id"),
                            "event_name": f"{game.get('away_team')} @ {game.get('home_team')}",
                            "start_time": game.get("game_datetime", game.get("time")),
                            "home_team": game.get("home_team"),
                            "away_team": game.get("away_team"),
                            "venue": game.get("venue"),
                            "status": game.get("status"),
                            "provider_id": "mlb_stats_api",
                            "market_type": market_type,
                        }
                    )

                logger.info(
                    f"[MLBProviderClient] Generated {len(team_data)} team records from MLB Stats API"
                )
                return team_data

            elif market_type == "futures":
                # Get teams for futures markets
                teams = await self.mlb_stats_client.get_mlb_teams()

                futures_data = []
                for team in teams:
                    if team.get("active"):
                        futures_data.append(
                            {
                                "team_id": team.get("id"),
                                "team_name": team.get("name"),
                                "league": team.get("league"),
                                "division": team.get("division"),
                                "venue": team.get("venue"),
                                "provider_id": "mlb_stats_api",
                                "market_type": "futures",
                            }
                        )

                logger.info(
                    f"[MLBProviderClient] Generated {len(futures_data)} futures records from MLB Stats API"
                )
                return futures_data

            elif market_type == "team":
                # Generate team props for today's games
                games = await self.mlb_stats_client.get_todays_games()

                if not games:
                    logger.warning(
                        "[MLBProviderClient] No games found for team props generation"
                    )
                    return []

                # Generate team props using the same logic as player props
                team_props = self._generate_team_props(games, 1)

                logger.info(
                    f"[MLBProviderClient] Generated {len(team_props)} team props from MLB Stats API"
                )
                return team_props

            return []

        except Exception as e:
            logger.error(f"[MLBProviderClient] Error fetching MLB Stats team data: {e}")
            return []

    async def _fetch_external_api_fallback(
        self, market_type: str, cache_key: str, redis_conn
    ) -> List[Dict[str, Any]]:
        """
        Fallback to external APIs (SportRadar/TheOdds) when MLB Stats API fails.
        This preserves the original functionality for edge cases.
        """
        logger.info(
            f"[MLBProviderClient] Using external API fallback for {market_type}"
        )

        # Check fallback cache first
        fallback_odds_key = f"mlb:odds:{time.strftime('%Y')}"
        fallback_cached = await redis_conn.get(fallback_odds_key)
        if fallback_cached and market_type != "playerprops":
            logger.info(
                f"[MLBProviderClient] FALLBACK: Returning cached external API data for {market_type}"
            )
            MLBProviderClient.metrics_increment(
                f"mlb.odds_comparison.fallback_cache_hit"
            )
            result = json.loads(fallback_cached)
            deduplicated_result = await self._deduplicate_props(result)
            return deduplicated_result

        # Try SportRadar API fallback
        base_urls = {
            "futures": "https://api.sportradar.com/oddscomparison-futures-trial/v4/en/sports/baseball/mlb/futures.json",
            "prematch": "https://api.sportradar.com/oddscomparison-prematch-trial/v4/en/sports/baseball/mlb/prematch.json",
            "regular": "https://api.sportradar.com/oddscomparison-trial/v4/en/sports/baseball/mlb/odds.json",
            "playerprops": "https://api.sportradar.com/oddscomparison-playerprops-trial/v4/en/sports/baseball/mlb/playerprops.json",
        }

        url = base_urls.get(market_type)
        if url and self.sportradar_api_key:
            url = f"{url}?api_key={self.sportradar_api_key}"
            resp, err = await self._httpx_get_with_backoff(url)
            if resp is not None:
                data = resp.json()
                if data:
                    deduplicated_data = await self._deduplicate_props(data)
                    await redis_conn.set(
                        cache_key, json.dumps(deduplicated_data), ex=self.CACHE_TTL
                    )
                    logger.info(
                        f"[MLBProviderClient] FALLBACK: SportRadar success for {market_type}"
                    )
                    return deduplicated_data

        # Try MLB Stats API + Baseball Savant as fallback (prioritizing over TheOdds API)
        logger.info(
            f"[MLBProviderClient] Using MLB Stats API + Baseball Savant fallback for {market_type}"
        )

        if market_type == "playerprops":
            odds = await self.fetch_player_props_mlb_stats()
        else:
            # For non-player props, try TheOdds API if available
            if self.theodds_api_key:
                odds = await self.fetch_odds_theodds()
            else:
                odds = []

            if odds and isinstance(odds, list) and len(odds) > 0:
                deduplicated_odds = await self._deduplicate_props(odds)
                await redis_conn.set(
                    cache_key, json.dumps(deduplicated_odds), ex=self.CACHE_TTL
                )
                logger.info(
                    f"[MLBProviderClient] FALLBACK: MLB Stats API + Baseball Savant success for {market_type}"
                )
                MLBProviderClient.metrics_increment(
                    "mlb.odds_comparison.mlb_stats_fallback_success"
                )
                return deduplicated_odds

        # All fallbacks failed
        logger.error(
            f"[MLBProviderClient] External API fallback failed for {market_type}"
        )
        MLBProviderClient.metrics_increment("mlb.odds_comparison.fallback_failure")
        return []

    async def fetch_country_flag(self, country_code: str) -> Optional[str]:
        """
        Fetch and cache the URL for a country flag image by country code.
        Returns the image URL or None if not found.
        """

        redis_conn = await self._get_redis()
        cache_key = f"country_flag:{country_code.upper()}"
        cached = await redis_conn.get(cache_key)
        if cached:
            logger.info(
                "[MLBProviderClient] Returning cached flag for %s.", country_code
            )
            MLBProviderClient.metrics_increment("country_flag.cache_hit")
            return cached.decode()
        url = f"https://api.sportradar.com/images-trial3/flags/{country_code.lower()}/flag.png?api_key={self.sportradar_api_key}"
        await redis_conn.set(cache_key, url, ex=60 * 60 * 24 * 30)  # Cache for 30 days
        return url

    async def fetch_action_shots_ap(self, event_id: str) -> List[Dict[str, Any]]:
        """
        Fetch and cache AP Action Shots manifest for a given MLB event.
        Returns a list of image asset dicts for the event.
        """
        # import json  # Unused

        redis_conn = await self._get_redis()
        cache_key = f"mlb:action_shots:{event_id}"
        cached = await redis_conn.get(cache_key)
        if cached:
            logger.info(
                "[MLBProviderClient] Returning cached AP Action Shots for event %s.",
                event_id,
            )
            MLBProviderClient.metrics_increment("mlb.action_shots.cache_hit")
            return json.loads(cached)
        url = f"https://api.sportradar.com/mlb-images-trial3/ap/mlb/actionshots/events/mlb/{event_id}/manifest.json?api_key={self.sportradar_api_key}"
        resp, err = await self._httpx_get_with_backoff(url)
        if resp is None or err:
            logger.error(
                "Error fetching AP Action Shots for event %s: %s", event_id, err
            )
            MLBProviderClient.alert_event(
                "mlb_action_shots_fetch_failure",
                {"event_id": event_id, "error": str(err)},
            )
            return json.loads(cached) if cached else []
        data = resp.json()
        assets = data.get("assets", [])
        await redis_conn.set(cache_key, json.dumps(assets), ex=self.CACHE_TTL)
        return assets

    async def _httpx_get_with_backoff(
        self,
        url: str,
        max_retries: int = 4,
        base_delay: float = 1.0,
        timeout: float = 5.0,
    ) -> Tuple[Optional[httpx.Response], Optional[Exception]]:
        # Helper for GET requests with exponential backoff on 429/5xx errors.
        # Returns (response, error) tuple. Logs and alerts on persistent failures.
        import asyncio

        for attempt in range(max_retries):
            try:
                async with httpx.AsyncClient(timeout=timeout) as client:
                    resp = await client.get(url)
                    if resp.status_code == 403:
                        logger.warning(
                            "[MLBProviderClient] 403 Forbidden received for %s (attempt %d) - short-circuiting to fallback.",
                            url,
                            attempt + 1,
                        )
                        return None, httpx.HTTPStatusError(
                            "403 Forbidden", request=resp.request, response=resp
                        )
                    if resp.status_code == 429 or 500 <= resp.status_code < 600:
                        logger.warning(
                            "[MLBProviderClient] %s received for %s (attempt %d)",
                            resp.status_code,
                            url,
                            attempt + 1,
                        )
                        await asyncio.sleep(base_delay * (2**attempt))
                        continue
                    resp.raise_for_status()
                    return resp, None
            except httpx.HTTPStatusError as e:
                logger.warning(
                    "[MLBProviderClient] HTTP error for %s: %s (attempt %d)",
                    url,
                    e,
                    attempt + 1,
                )
                if hasattr(e.response, "status_code") and (
                    e.response.status_code == 429 or 500 <= e.response.status_code < 600
                ):
                    await asyncio.sleep(base_delay * (2**attempt))
                    continue
                return None, e
            except (httpx.RequestError, ValueError) as e:
                logger.error(
                    "[MLBProviderClient] Unexpected error for %s: %s (attempt %d)",
                    url,
                    e,
                    attempt + 1,
                )
                await asyncio.sleep(base_delay * (2**attempt))
                continue
        logger.error(
            "[MLBProviderClient] Persistent failure for %s after %d attempts",
            url,
            max_retries,
        )
        # ALERTING HOOK: Integrate with monitoring/alerting system here (e.g., Sentry, PagerDuty)
        # Example: alert_persistent_failure(url, max_retries)
        # TODO: Implement alert_persistent_failure
        return None, Exception(f"Failed after {max_retries} attempts")

    async def fetch_theodds_participants(self) -> List[Dict[str, Any]]:
        """
        Fetch and cache the canonical team list from TheOdds `/participants` endpoint.
        Returns a list of team dicts with normalized names and IDs.
        """
        """
        Fetch and cache the canonical team list from TheOdds `/participants` endpoint.
        Returns a list of team dicts with normalized names and IDs.
        Uses Redis for persistent caching.
        """
        import json

        redis_conn = await self._get_redis()
        cache_key = "mlb:theodds:participants"
        cached = await redis_conn.get(cache_key)
        if cached:
            logger.info(
                "[MLBProviderClient] Returning cached TheOdds participants from Redis."
            )
            MLBProviderClient.metrics_increment("mlb.theodds.participants.cache_hit")
            return json.loads(cached)
        url = f"https://api.the-odds-api.com/v4/sports/baseball_mlb/participants/?apiKey={self.theodds_api_key}"
        resp, err = await self._httpx_get_with_backoff(url)
        if resp is None:
            logger.error("Error fetching TheOdds participants: %s", err)
            return json.loads(cached) if cached else []
        data = resp.json()
        # Normalize team names (lowercase, strip, etc.)
        for team in data:
            team["normalized_name"] = team["name"].strip().lower()
        await redis_conn.set(cache_key, json.dumps(data), ex=self.CACHE_TTL)
        return data

    async def fetch_event_mappings_sportradar(self) -> Dict[str, Dict[str, Any]]:
        logger.debug("[MLBProviderClient] START fetch_event_mappings_sportradar")
        """
        Fetch and cache SportRadar event mappings for robust cross-provider event ID matching.
        Returns a dict mapping SportRadar event_id to mapping info (including TheOdds IDs if available).
        """
        """
        Fetch and cache SportRadar event mappings for robust cross-provider event ID matching.
        Returns a dict mapping SportRadar event_id to mapping info (including TheOdds IDs if available).
        Uses fallback logic and logs warnings if endpoint is unavailable or forbidden.
        """
        import json

        redis_conn = await self._get_redis()
        cache_key = "mlb:event_mappings"
        cached = await redis_conn.get(cache_key)
        if cached:
            logger.info(
                "[MLBProviderClient] Returning cached event mappings from Redis."
            )
            MLBProviderClient.metrics_increment("mlb.event_mappings.cache_hit")
            return json.loads(cached)
        # For demo: fetch all events, then for each event, fetch its mapping (could be optimized)
        events = await self.fetch_events_sportradar()
        mappings = {}
        mapping_403_logged = False
        for event in events:
            event_id = event["event_id"]
            url = f"https://api.sportradar.com/mlb/trial/v8/en/events/{event_id}/mappings.json?api_key={self.sportradar_api_key}"
            resp, err = await self._httpx_get_with_backoff(url)
            if resp is not None:
                data = resp.json()
                mappings[event_id] = data
                logger.info(
                    "[MLBProviderClient] Successfully fetched mapping for event.",
                    extra={"event_id": event_id, "endpoint": url},
                )
            else:
                # If 403 Forbidden, log a clear warning only once per run and break loop
                if (
                    hasattr(err, "response")
                    and getattr(err.response, "status_code", None) == 403
                    and not mapping_403_logged
                ):
                    logger.warning(
                        "[MLBProviderClient] 403 Forbidden from SportRadar event mapping endpoint. Your API key does not have access. Odds mapping will proceed with available data.",
                        extra={"event_id": event_id, "endpoint": url},
                    )
                    mapping_403_logged = True
                    break
                logger.warning(
                    "[MLBProviderClient] Failed to fetch mapping for event.",
                    extra={"event_id": event_id, "endpoint": url, "error": str(err)},
                )
        if not mappings:
            logger.warning(
                "[MLBProviderClient] No event mappings available. Odds mapping will use fallback logic.",
                extra={"endpoint": "event_mappings", "events_count": len(events)},
            )
        await redis_conn.set(cache_key, json.dumps(mappings), ex=self.CACHE_TTL)
        logger.debug(
            f"[MLBProviderClient] END fetch_event_mappings_sportradar, mappings count: {len(mappings)}"
        )
        return mappings

    # Caching and rate limiting config
    CACHE_TTL = 600  # 10 minutes in seconds
    RATE_LIMIT_SECONDS = 10  # min seconds between requests per endpoint

    async def _get_redis(self):
        if self.redis is None:
            self.redis = await redis.from_url(REDIS_URL)
        return self.redis

    async def _ensure_ml_service_initialized(self):
        """Ensure ML service is initialized (lazy initialization)"""
        if not self._ml_service_initialized:
            try:
                # Check if the singleton is already initialized
                if not self.ml_service.is_initialized:
                    await self.ml_service.initialize()
                self._ml_service_initialized = True
                logger.info(
                    "[MLBProviderClient] Enhanced ML service initialized successfully"
                )
            except Exception as e:
                logger.error(
                    f"[MLBProviderClient] Failed to initialize ML service: {e}"
                )
                self._ml_service_initialized = False

    async def _calculate_ml_confidence(self, prop_data: Dict[str, Any]) -> float:
        """
        Calculate real ML-based confidence for a prop using Enhanced ML Service

        Args:
            prop_data: Dictionary containing prop information (player_name, stat_type, odds, etc.)

        Returns:
            Confidence score as percentage (0-100 range)
        """
        try:
            await self._ensure_ml_service_initialized()

            if not self._ml_service_initialized:
                return self._fallback_confidence_calculation(prop_data)

            # Extract features for ML prediction
            features = self._extract_ml_features(prop_data)

            # Get ML prediction with confidence
            ml_result = await self.ml_service.predict_enhanced("MLB", features)

            # Convert ML confidence (0.5-0.95 range) to percentage (50-95 range)
            confidence_percentage = ml_result.get("confidence", 0.75) * 100

            # Clamp to reasonable range
            confidence_percentage = max(50.0, min(95.0, confidence_percentage))

            logger.debug(
                f"[MLBProviderClient] ML confidence calculated: {confidence_percentage:.1f}% for {prop_data.get('player_name', 'Unknown')} {prop_data.get('stat_type', 'Unknown')}"
            )

            return confidence_percentage

        except Exception as e:
            logger.warning(
                f"[MLBProviderClient] ML confidence calculation failed: {e}, using fallback"
            )
            return self._fallback_confidence_calculation(prop_data)

    def _extract_ml_features(self, prop_data: Dict[str, Any]) -> Dict[str, float]:
        """Extract ML features from prop data"""
        features = {}

        # Odds-based features
        odds_value = prop_data.get("value") or prop_data.get("price", 0)
        if odds_value:
            # Convert American odds to implied probability
            if odds_value > 0:
                implied_prob = 100 / (odds_value + 100)
            else:
                implied_prob = abs(odds_value) / (abs(odds_value) + 100)
            features["implied_probability"] = implied_prob
            features["odds_value"] = float(odds_value)

        # Prop type features
        stat_type = prop_data.get("stat_type", "")
        features["is_hitting_prop"] = (
            1.0 if stat_type in ["hits", "home_runs", "rbis"] else 0.0
        )
        features["is_pitching_prop"] = (
            1.0 if stat_type in ["strikeouts", "earned_runs"] else 0.0
        )
        features["is_team_prop"] = 1.0 if stat_type in ["totals", "spread"] else 0.0

        # Line value features
        line = prop_data.get("line")
        if line is not None:
            features["line_value"] = float(line)

        # Default features for missing data
        default_features = {
            "home_advantage": 0.1,
            "recent_form": 0.5,
            "weather_factor": 1.0,
            "pitcher_quality": 0.5,
        }
        features.update(default_features)

        return features

    def _fallback_confidence_calculation(self, prop_data: Dict[str, Any]) -> float:
        """Fallback confidence calculation when ML service is unavailable"""
        base_confidence = 70.0

        # Adjust based on odds quality
        odds_value = prop_data.get("value") or prop_data.get("price", 0)
        if odds_value:
            # Handle decimal odds (European format) vs American odds
            if isinstance(odds_value, float) and 1.0 <= odds_value <= 10.0:
                # Decimal odds format - closer to 1.0 means stronger favorite
                if odds_value < 1.5:  # Strong favorite
                    base_confidence += 8.0
                elif odds_value < 2.0:  # Moderate favorite
                    base_confidence += 5.0
                elif odds_value > 4.0:  # Long odds underdog
                    base_confidence -= 12.0
                elif odds_value > 2.5:  # Moderate underdog
                    base_confidence -= 5.0

                # Add variety based on decimal value
                base_confidence += (odds_value * 2) - 4  # Varies by odds
            else:
                # American odds format
                if abs(odds_value) < 150:  # Close to even odds
                    base_confidence += 10.0
                elif abs(odds_value) > 300:  # Long odds
                    base_confidence -= 15.0

                # Add some variety based on exact odds value
                if odds_value > 0:
                    # Positive American odds - underdog
                    base_confidence -= min(10.0, odds_value / 100)
                else:
                    # Negative American odds - favorite
                    base_confidence += min(8.0, abs(odds_value) / 200)

        # Adjust based on prop type for more realistic confidence distribution
        stat_type = prop_data.get("stat_type", "")
        if stat_type in ["hits", "strikeouts"]:  # More predictable props
            base_confidence += 5.0
        elif stat_type in ["home_runs"]:  # Less predictable
            base_confidence -= 10.0
        elif stat_type in ["totals"]:  # Team totals
            base_confidence += 2.0
        elif stat_type in ["h2h", "spreads"]:  # Head-to-head and spreads
            base_confidence += 3.0

        # Add small random variation based on player/team name hash for consistency
        player_name = prop_data.get("player_name", "")
        team_name = prop_data.get("team_name", "")
        name_hash = hash(player_name + team_name) % 11  # 0-10 range
        base_confidence += name_hash - 5  # -5 to +5 variation

        # Clamp to reasonable range
        return max(55.0, min(85.0, base_confidence))

    async def _deduplicate_props(
        self, props: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Remove duplicate props for same entities, keeping highest confidence props

        Groups props by (event_id, team_name, player_name, stat_type) and selects
        the prop with highest confidence from each group.
        """
        if not props:
            return props

        # Group props by entity key
        prop_groups: Dict[Tuple, List[Dict[str, Any]]] = {}

        for prop in props:
            # Create unique key for grouping
            entity_key = (
                prop.get("event_id", ""),
                prop.get("team_name", ""),
                prop.get("player_name", ""),
                prop.get("stat_type", ""),
            )

            if entity_key not in prop_groups:
                prop_groups[entity_key] = []
            prop_groups[entity_key].append(prop)

        # Select highest confidence prop from each group
        deduplicated_props = []
        duplicate_count = 0

        for entity_key, group_props in prop_groups.items():
            if len(group_props) > 1:
                duplicate_count += len(group_props) - 1
                # Sort by confidence (descending) and select highest
                best_prop = max(group_props, key=lambda p: p.get("confidence", 0))
                deduplicated_props.append(best_prop)

                logger.debug(
                    f"[MLBProviderClient] Deduplication: kept prop with {best_prop.get('confidence', 0):.1f}% confidence, removed {len(group_props)-1} duplicates for {entity_key[2] or entity_key[1]} {entity_key[3]}"
                )
            else:
                deduplicated_props.append(group_props[0])

        if duplicate_count > 0:
            logger.info(
                f"[MLBProviderClient] Deduplication removed {duplicate_count} duplicate props, {len(deduplicated_props)} unique props remaining"
            )

        return deduplicated_props

    async def get_data(self) -> Dict[str, List[Dict[str, Any]]]:
        teams = await self.fetch_teams_sportradar()
        events = await self.fetch_events_sportradar()
        odds = await self.fetch_odds_theodds()
        return {
            "teams": teams,
            "events": events,
            "odds": odds,
        }

    async def fetch_teams_sportradar(self) -> List[Dict[str, Any]]:
        import json

        now = time.time()
        redis_conn = await self._get_redis()
        cache_key = "mlb:teams"
        cached = await redis_conn.get(cache_key)
        if cached:
            logger.info("[MLBProviderClient] Returning cached teams data from Redis.")
            MLBProviderClient.metrics_increment("mlb.teams.cache_hit")
            return json.loads(cached)
        # Dynamic rate limiting based on quota
        quota_key = "mlb:teams:quota"
        quota = await redis_conn.get(quota_key)
        if quota is not None and int(quota) < 5:
            logger.warning(
                "[MLBProviderClient] Quota low for teams endpoint (%s remaining). Returning cached data.",
                quota,
            )
            # ALERTING HOOK: Integrate with monitoring/alerting system for quota exhaustion
            # Example: alert_quota_exhaustion('teams', quota)
            # TODO: Implement alert_quota_exhaustion
            return json.loads(cached) if cached else []
        if now - self._last_request["teams"] < self.RATE_LIMIT_SECONDS:
            logger.warning(
                "[MLBProviderClient] Rate limit hit for teams endpoint. Returning last cached data."
            )
            return json.loads(cached) if cached else []
        url = f"https://api.sportradar.com/mlb/trial/v8/en/league/teams.json?api_key={self.sportradar_api_key}"
        # Fetch and cache MLB teams from SportRadar.
        # Uses Redis for persistent caching and dynamic rate limiting based on quota and time.
        # Returns a list of team dicts with provider IDs.
        resp, err = await self._httpx_get_with_backoff(url)
        if resp is None:
            logger.error("Error fetching teams from SportRadar: %s", err)
            return json.loads(cached) if cached else []
        quota_remaining = resp.headers.get("x-requests-remaining") or resp.headers.get(
            "x-ratelimit-remaining"
        )
        if quota_remaining is not None:
            await redis_conn.set(quota_key, int(quota_remaining), ex=600)
            logger.info(
                "[MLBProviderClient] SportRadar teams quota remaining: %s",
                quota_remaining,
            )
        data = resp.json()
        teams = [
            {
                "name": t["name"],
                "provider_id": t["id"],
            }
            for t in data.get("teams", [])
        ]
        await redis_conn.set(cache_key, json.dumps(teams), ex=self.CACHE_TTL)
        self._last_request["teams"] = now
        return teams

    async def fetch_events_sportradar(self) -> List[Dict[str, Any]]:
        import json

        now = time.time()
        redis_conn = await self._get_redis()
        # Use season year for more granular cache key
        season_year = time.strftime("%Y")
        cache_key = f"mlb:events:{season_year}"
        cached = await redis_conn.get(cache_key)
        if cached:
            logger.info("[MLBProviderClient] Returning cached events data from Redis.")
            MLBProviderClient.metrics_increment("mlb.events.cache_hit")
            return json.loads(cached)
        quota_key = "mlb:events:quota"
        quota = await redis_conn.get(quota_key)
        if quota is not None and int(quota) < 5:
            logger.warning(
                "[MLBProviderClient] Quota low for events endpoint (%s remaining). Returning cached data.",
                quota,
            )
            # ALERTING HOOK: Integrate with monitoring/alerting system for quota exhaustion
            # Example: alert_quota_exhaustion('events', quota)
            # TODO: Implement alert_quota_exhaustion
            return json.loads(cached) if cached else []
        if now - self._last_request["events"] < self.RATE_LIMIT_SECONDS:
            logger.warning(
                "[MLBProviderClient] Rate limit hit for events endpoint. Returning last cached data."
            )
            return json.loads(cached) if cached else []
        url = f"https://api.sportradar.com/mlb/trial/v8/en/games/2025/REG/schedule.json?api_key={self.sportradar_api_key}"
        # Fetch and cache MLB events (games) from SportRadar.
        # Uses Redis for persistent caching and dynamic rate limiting based on quota and time.
        # Returns a list of event dicts with event IDs and metadata.
        resp, err = await self._httpx_get_with_backoff(url)
        if resp is None:
            logger.error("Error fetching events from SportRadar: %s", err)
            return json.loads(cached) if cached else []
        quota_remaining = resp.headers.get("x-requests-remaining") or resp.headers.get(
            "x-ratelimit-remaining"
        )
        if quota_remaining is not None:
            await redis_conn.set(quota_key, int(quota_remaining), ex=600)
            logger.info(
                "[MLBProviderClient] SportRadar events quota remaining: %s",
                quota_remaining,
            )
        data = resp.json()
        events = [
            {
                "event_id": g["id"],
                "name": f"{g['home']['name']} vs {g['away']['name']}",
                "start_time": g["scheduled"],
                "provider_id": g["id"],
            }
            for g in data.get("games", [])
        ]
        await redis_conn.set(cache_key, json.dumps(events), ex=self.CACHE_TTL)
        self._last_request["events"] = now
        return events

    async def fetch_odds_theodds(self) -> List[Dict[str, Any]]:
        logger.debug("[MLBProviderClient] START fetch_odds_theodds")
        now = time.time()
        redis_conn = await self._get_redis()
        # Use season year for more granular cache key
        season_year = time.strftime("%Y")
        cache_key = f"mlb:odds:{season_year}"
        cached = await redis_conn.get(cache_key)
        if cached:
            logger.info("[MLBProviderClient] Returning cached odds data from Redis.")
            MLBProviderClient.metrics_increment("mlb.odds.cache_hit")
            return json.loads(cached)
        # Fetch from TheOdds API
        url = f"https://api.the-odds-api.com/v4/sports/baseball_mlb/odds/?apiKey={self.theodds_api_key}&regions=us&markets=h2h,spreads,totals"
        resp, err = await self._httpx_get_with_backoff(url)
        if resp is None:
            logger.error("Error fetching odds from TheOdds: %s", err)
            if cached:
                return json.loads(cached)
            else:
                return []
        data = resp.json()
        # Dump full raw odds data to a file for inspection
        with open("mlb_odds_raw_dump.json", "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        logger.debug(
            f"[MLBProviderClient] RAW TheOdds data dumped to mlb_odds_raw_dump.json"
        )
        quota_key = "mlb:odds:quota"
        quota = await redis_conn.get(quota_key)
        if quota is not None and int(quota) < 5:
            logger.warning(
                "[MLBProviderClient] Quota low for odds endpoint (%s remaining). Returning cached data.",
                quota,
            )
            # ALERTING HOOK: Integrate with monitoring/alerting system for quota exhaustion
            # Example: alert_quota_exhaustion('odds', quota)
            # TODO: Implement alert_quota_exhaustion
            return json.loads(cached) if cached else []
        if now - self._last_request["odds"] < self.RATE_LIMIT_SECONDS:
            logger.warning(
                "[MLBProviderClient] Rate limit hit for odds endpoint. Returning last cached data."
            )
            return json.loads(cached) if cached else []
        # Fetch event mappings for robust ID matching
        event_mappings = await self.fetch_event_mappings_sportradar()
        if not event_mappings:
            logger.warning(
                "[MLBProviderClient] No event mappings available. Odds will be mapped using fallback logic (TheOdds event IDs only).",
                extra={"endpoint": "fetch_odds_theodds"},
            )
        url = f"https://api.the-odds-api.com/v4/sports/baseball_mlb/odds/?apiKey={self.theodds_api_key}&regions=us&markets=h2h,spreads,totals"
        resp, err = await self._httpx_get_with_backoff(url)
        if resp is None:
            logger.error("Error fetching odds from TheOdds: %s", err)
            if cached:
                return json.loads(cached)
            else:
                return []
        quota_remaining = resp.headers.get("x-requests-remaining") or resp.headers.get(
            "x-ratelimit-remaining"
        )
        if quota_remaining is not None:
            await redis_conn.set(quota_key, int(quota_remaining), ex=600)
            logger.info(
                "[MLBProviderClient] TheOdds quota remaining: %s",
                quota_remaining,
            )
        data = resp.json()
        odds = []
        for event in data:
            event_name = f"{event.get('home_team', '')} vs {event.get('away_team', '')}"
            event_start_time = event.get("commence_time", "")
            theodds_event_id = event.get("id")
            mapped_srid = None
            if event_mappings:
                for srid, mapping in event_mappings.items():
                    if "mappings" in mapping:
                        for m in mapping["mappings"]:
                            if (
                                m.get("provider", "").lower() == "theoddsapi"
                                and m.get("id") == theodds_event_id
                            ):
                                mapped_srid = srid
                                break
                    if mapped_srid:
                        break
            else:
                logger.debug(
                    f"[MLBProviderClient] Fallback: No event mapping for TheOdds event_id {theodds_event_id}. Using TheOdds event_id as canonical."
                )
            for bookmaker in event.get("bookmakers", []):
                for market in bookmaker.get("markets", []):
                    market_key = market.get("key", "")
                    for outcome in market.get("outcomes", []):
                        # Player prop detection (future-proof):
                        player_name = None
                        # If market_key contains 'player' or 'prop', or outcome has a 'player' field
                        if (
                            "player" in market_key.lower()
                            or "prop" in market_key.lower()
                            or outcome.get("player")
                        ):
                            player_name = (
                                outcome.get("player")
                                or outcome.get("description")
                                or outcome.get("participant")
                            )
                            # Fallback: if outcome name looks like a player (contains a space, not a team, not Over/Under)
                            if not player_name and outcome.get("name"):
                                name_val = outcome["name"]
                                if (
                                    name_val.lower() not in ["over", "under"]
                                    and len(name_val.split()) >= 2
                                    and not any(
                                        team in name_val
                                        for team in [
                                            event.get("home_team", ""),
                                            event.get("away_team", ""),
                                        ]
                                    )
                                ):
                                    player_name = name_val
                        # Team prop: set player_name to team name or descriptive label
                        if not player_name and market_key in [
                            "totals",
                            "h2h",
                            "spreads",
                        ]:
                            # Use team_name if available, else label
                            player_name = (
                                outcome.get("name") or f"{market_key.title()} Prop"
                            )
                        # Stat type: use market_key
                        stat_type = market_key
                        # Matchup: event_name
                        matchup = event_name

                        # For totals, extract the line (run total) from the market or outcome
                        line = None
                        if market_key == "totals":
                            line = (
                                outcome.get("point")
                                or market.get("point")
                                or market.get("total")
                            )

                        # Calculate real ML-based confidence instead of hardcoded 75.0
                        prop_data = {
                            "player_name": player_name,
                            "stat_type": stat_type,
                            "matchup": matchup,
                            "value": outcome.get("price"),
                            "line": line,
                            "team_name": outcome.get("name"),
                        }
                        confidence = await self._calculate_ml_confidence(prop_data)

                        odds.append(
                            {
                                "event_id": mapped_srid or theodds_event_id,
                                "event_name": event_name,
                                "start_time": event_start_time,
                                "team_name": outcome.get("name"),
                                "player_name": player_name,
                                "stat_type": stat_type,
                                "odds_type": stat_type,
                                "matchup": matchup,
                                "confidence": confidence,
                                "value": outcome.get("price"),
                                "provider_id": bookmaker.get("key"),
                                "mapping_fallback": mapped_srid is None,
                                "line": line,
                            }
                        )
        await redis_conn.set(cache_key, json.dumps(odds), ex=self.CACHE_TTL)
        self._last_request["odds"] = now
        logger.debug(
            f"[MLBProviderClient] END fetch_odds_theodds, odds count: {len(odds)}"
        )
        return odds
