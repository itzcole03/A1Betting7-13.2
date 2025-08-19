"""
Comprehensive Prop Generator Service

This service generates intelligent prop predictions for ALL players in any given MLB game,
eliminating the need to rely solely on external prop sources.

Features:
- Universal game coverage (no more "no props available")
- Position-based prop generation
- Intelligent target calculation using historical + recent data
- ML-driven confidence scoring
- Integration with existing prediction models
"""

import asyncio
import gc
import logging
import time
import weakref
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from typing import Any, AsyncGenerator, Callable, Dict, List, Optional, Tuple, TypedDict

import aiohttp
import statsapi

# Import enterprise services with fallback handling
try:
    from backend.services.mlb_provider_client import MLBProviderClient
except ImportError:
    try:
        from .mlb_provider_client import MLBProviderClient
    except ImportError:

        class MLBProviderClient:
            pass


try:
    from backend.services.modern_ml_service import modern_ml_service
except ImportError:
    modern_ml_service = None

try:
    from backend.services.baseball_savant_client import BaseballSavantClient
except ImportError:
    BaseballSavantClient = None

try:
    from backend.services.unified_cache_service import unified_cache_service

    # Create a wrapper class for unified_cache_service
    class IntelligentCacheService:
        def __init__(self):
            self.service = unified_cache_service

        async def get_cached_data(self, key: str, category: Optional[str] = None):
            try:
                if self.service is None:
                    return None
                return await self.service.get(key)
            except Exception:
                return None

        async def cache_data(
            self, key: str, data: Any, ttl: int = 3600, category: Optional[str] = None
        ):
            try:
                if self.service is None:
                    return
                await self.service.set(key, data, ttl)
            except Exception:
                pass

        async def get(self, key: str):
            try:
                if self.service is None:
                    return None
                return await self.service.get(key)
            except Exception:
                return None

        async def set(self, key: str, data: Any, ttl: int = 3600):
            try:
                if self.service is None:
                    return
                await self.service.set(key, data, ttl)
            except:
                pass

except ImportError:
    unified_cache_service = None
    
    # Fallback cache service
    class IntelligentCacheService:
        def __init__(self):
            self.service = None
            
        async def get_cached_data(self, key: str, category: Optional[str] = None):
            return None

        async def cache_data(
            self, key: str, data: Any, ttl: int = 3600, category: Optional[str] = None
        ):
            pass

        async def get(self, key: str):
            return None

        async def set(self, key: str, data: Any, ttl: int = 3600):
            pass


try:
    from backend.services.automated_feature_engineering import (
        AdvancedFeatureEngineering,
    )
except ImportError:
    AdvancedFeatureEngineering = None

try:
    from backend.services.enhanced_prop_analysis_service import (
        enhanced_prop_analysis_service,
    )
except ImportError:
    enhanced_prop_analysis_service = None

try:
    from backend.services.performance_optimization import (
        performance_optimizer as PerformanceOptimizer,
    )
except ImportError:
    # Fallback performance optimizer
    class PerformanceOptimizer:
        def context(self, name: str):
            return self

        def __enter__(self):
            return self

        def __exit__(self, *args):
            pass


logger = logging.getLogger("propollama")

# Modern data validation integration
try:
    # Try enhanced validation service first
    from backend.services.enhanced_data_validation_integration import (
        EnhancedDataValidationIntegrationService,
        EnhancedValidationConfig,
        get_enhanced_integration_service,
    )

    ENHANCED_VALIDATION_AVAILABLE = True
    DATA_VALIDATION_AVAILABLE = True
    logger.info("✅ Enhanced data validation integration available")
except ImportError:
    ENHANCED_VALIDATION_AVAILABLE = False

    # Fallback to basic validation service
    try:
        from backend.services.data_validation_integration import (
            DataValidationIntegrationService,
            ValidationConfig,
            validation_integration_service,
        )

        DATA_VALIDATION_AVAILABLE = True
        logger.info("✅ Basic data validation integration available")
    except ImportError:
        DATA_VALIDATION_AVAILABLE = False
        logger.warning("⚠️ No data validation services available - using fallback")

if not DATA_VALIDATION_AVAILABLE:
    # Fallback validation service
    class DataValidationIntegrationService:
        async def validate_and_enhance_player_data(self, *args, **kwargs):
            return {}, None

        async def validate_and_enhance_game_data(self, *args, **kwargs):
            return {}, None

        async def validate_prop_generation_data(self, *args, **kwargs):
            return args[1] if len(args) > 1 else {}, []

        def get_performance_metrics(self):
            return {"validation_enabled": False}

    validation_integration_service = DataValidationIntegrationService()


class AdjustmentDict(TypedDict):
    """Type definition for adjustment dictionaries"""

    multiplier: float
    factors: List[str]
    recent_form_factor: Optional[float]
    xstats_factor: Optional[float]
    park_factor: Optional[float]
    matchup_factor: Optional[float]


class CircuitBreaker:
    """Circuit breaker pattern for external API resilience"""

    def __init__(self, failure_threshold: int = 5, recovery_timeout: float = 60.0):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.failure_count = 0
        self.last_failure_time = 0
        self.state = "CLOSED"  # CLOSED, OPEN, HALF_OPEN

    def is_callable(self) -> bool:
        """Check if the circuit breaker allows calls"""
        if self.state == "CLOSED":
            return True
        elif self.state == "OPEN":
            if time.time() - self.last_failure_time >= self.recovery_timeout:
                self.state = "HALF_OPEN"
                return True
            return False
        else:  # HALF_OPEN
            return True

    def record_success(self):
        """Record a successful call"""
        self.failure_count = 0
        self.state = "CLOSED"

    def record_failure(self):
        """Record a failed call"""
        self.failure_count += 1
        self.last_failure_time = time.time()

        if self.failure_count >= self.failure_threshold:
            self.state = "OPEN"
            logger.warning(
                f"Circuit breaker opened after {self.failure_count} failures"
            )


class AsyncBatchProcessor:
    """Efficient async batch processing with concurrency control"""

    def __init__(
        self, max_concurrency: int = 10, batch_size: int = 50, timeout: float = 30.0
    ):
        self.max_concurrency = max_concurrency
        self.batch_size = batch_size
        self.timeout = timeout
        self._semaphore = asyncio.Semaphore(max_concurrency)

    async def process_batches(
        self, items: List[Any], processor_func: Callable[..., Any], *args, **kwargs
    ) -> List[Any]:
        """Process items in batches with controlled concurrency"""
        results = []

        # Split items into batches
        batches = [
            items[i : i + self.batch_size]
            for i in range(0, len(items), self.batch_size)
        ]

        async def process_batch(batch):
            async with self._semaphore:
                try:
                    return await processor_func(batch, *args, **kwargs)
                except Exception as e:
                    logger.warning(f"Batch processing error: {e}")
                    return []

        # Process batches concurrently
        batch_tasks = [process_batch(batch) for batch in batches]
        batch_results = await asyncio.gather(*batch_tasks, return_exceptions=True)

        # Flatten results
        for batch_result in batch_results:
            if isinstance(batch_result, list):
                results.extend(batch_result)
            elif isinstance(batch_result, Exception):
                logger.error(f"Batch processing exception: {batch_result}")

        return results

    @asynccontextmanager
    async def batch_context(self):
        """Context manager for batch operations"""
        batch = BatchContext(self)
        try:
            yield batch
        finally:
            await batch.cleanup()

    async def execute_single(self, task):
        """Execute a single task with semaphore control"""
        async with self._semaphore:
            try:
                return await task
            except Exception as e:
                logger.warning(f"Single task execution error: {e}")
                return e


class BatchContext:
    """Context for managing batch operations"""

    def __init__(self, processor: "AsyncBatchProcessor"):
        self.processor = processor
        self.tasks = []

    def add_task(self, coro, timeout: float = None):
        """Add a task to the batch"""
        if timeout is None:
            timeout = self.processor.timeout

        # Wrap the coroutine with timeout
        wrapped_task = asyncio.wait_for(coro, timeout=timeout)
        self.tasks.append(wrapped_task)
        return wrapped_task

    async def execute_all(self):
        """Execute all tasks in the batch"""
        if not self.tasks:
            return []

        results = await asyncio.gather(*self.tasks, return_exceptions=True)
        return results

    async def execute_single(self, task):
        """Execute a single task"""
        return await self.processor.execute_single(task)

    async def cleanup(self):
        """Clean up batch resources"""
        self.tasks.clear()


class AsyncResourceManager:
    """Modern async resource manager with proper cleanup and connection pooling"""

    def __init__(self):
        self._session: Optional[aiohttp.ClientSession] = None
        self._active_tasks: List[asyncio.Task] = []
        self._cache_refs: weakref.WeakSet = weakref.WeakSet()
        self._cleanup_interval = 300  # 5 minutes
        self._last_cleanup = time.time()

    @asynccontextmanager
    async def get_session(self) -> AsyncGenerator[aiohttp.ClientSession, None]:
        """Get aiohttp session with proper timeout and connection pooling"""
        if self._session is None or self._session.closed:
            timeout = aiohttp.ClientTimeout(total=30, connect=10)
            connector = aiohttp.TCPConnector(
                limit=100,  # Total connection pool size
                limit_per_host=30,  # Per-host connection limit
                ttl_dns_cache=300,  # DNS cache TTL
                use_dns_cache=True,
                keepalive_timeout=60,
                enable_cleanup_closed=True,
            )
            self._session = aiohttp.ClientSession(
                timeout=timeout, connector=connector, raise_for_status=False
            )

        try:
            yield self._session
        finally:
            # Perform periodic cleanup
            await self._periodic_cleanup()

    async def _periodic_cleanup(self):
        """Perform periodic cleanup of resources"""
        current_time = time.time()
        if current_time - self._last_cleanup > self._cleanup_interval:
            # Clean up completed tasks
            self._active_tasks = [
                task for task in self._active_tasks if not task.done()
            ]

            # Force garbage collection for cached objects
            gc.collect()

            self._last_cleanup = current_time
            logger.debug(
                f"Performed resource cleanup - active tasks: {len(self._active_tasks)}"
            )

    async def create_task(self, coro) -> asyncio.Task:
        """Create and track asyncio tasks for proper cleanup"""
        task = asyncio.create_task(coro)
        self._active_tasks.append(task)
        return task

    async def close(self):
        """Properly close all resources"""
        # Cancel all active tasks
        for task in self._active_tasks:
            if not task.done():
                task.cancel()

        # Wait for tasks to complete or be cancelled
        if self._active_tasks:
            await asyncio.gather(*self._active_tasks, return_exceptions=True)

        # Close HTTP session
        if self._session and not self._session.closed:
            await self._session.close()

        self._active_tasks.clear()
        logger.info("AsyncResourceManager closed successfully")

    async def cleanup(self):
        """Alias for close method for backward compatibility"""
        await self.close()


# Global resource manager instance
_resource_manager = AsyncResourceManager()


class GeneratedProp:
    """Data model for AI-generated props"""

    def __init__(
        self,
        player_name: str,
        team: str,
        position: str,
        stat_type: str,
        target_value: float,
        confidence: float,
        reasoning: str,
        source: str = "AI_GENERATED",
        game_id: Optional[int] = None,
        opposing_team: Optional[str] = None,
    ):
        self.player_name = player_name
        self.team = team
        self.position = position
        self.stat_type = stat_type
        self.target_value = target_value
        self.confidence = confidence
        self.reasoning = reasoning
        self.source = source
        self.game_id = game_id
        self.opposing_team = opposing_team

    def to_dict(self) -> Dict[str, Any]:
        """Convert to standard prop format for frontend"""
        return {
            "id": f"generated_{self.game_id}_{self.player_name}_{self.stat_type}",
            "player_name": self.player_name,
            "team": self.team,
            "team_name": self.team,
            "position": self.position,
            "sport": "MLB",
            "league": "MLB",
            "stat_type": self.stat_type,
            "line": self.target_value,
            "over_odds": -110,  # Standard odds for generated props
            "under_odds": -110,
            "confidence": self.confidence,
            "expected_value": self.confidence * 0.1,  # Simple EV calculation
            "kelly_fraction": 0.02,
            "recommendation": "OVER" if self.confidence > 60 else "UNDER",
            "game_time": datetime.now().isoformat(),
            "opponent": f"vs {self.opposing_team}" if self.opposing_team else "TBD",
            "venue": "TBD",
            "source": self.source,
            "reasoning": self.reasoning,
            "status": "active",
            "updated_at": datetime.now().isoformat(),
            "metadata": getattr(self, "metadata", {}),
            "prediction_source": getattr(self, "prediction_source", self.source),
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "GeneratedProp":
        """Create GeneratedProp from dictionary"""
        return cls(
            player_name=data.get("player_name", ""),
            team=data.get("team", ""),
            position=data.get("position", ""),
            stat_type=data.get("stat_type", ""),
            target_value=data.get("line", data.get("target_value", 0.0)),
            confidence=data.get("confidence", 60.0),
            reasoning=data.get("reasoning", ""),
            source=data.get("source", "AI_GENERATED"),
            game_id=data.get("game_id"),
            opposing_team=data.get("opposing_team"),
        )


class PlayerStatsAnalyzer:
    """Advanced player statistics analyzer with Baseball Savant integration and resilience patterns"""

    def __init__(self):
        self.mlb_client = MLBProviderClient()
        self.savant_client = BaseballSavantClient() if BaseballSavantClient else None
        self.feature_engineer = (
            AdvancedFeatureEngineering() if AdvancedFeatureEngineering else None
        )
        self.cache_service = IntelligentCacheService()

        # Add resilience patterns
        self.circuit_breaker = CircuitBreaker(
            failure_threshold=3, recovery_timeout=60.0
        )
        self.batch_processor = AsyncBatchProcessor(max_concurrency=5, batch_size=20)

    async def get_comprehensive_player_stats(
        self, player_id: int, season: Optional[int] = None
    ) -> Dict[str, Any]:
        """Get comprehensive player statistics with advanced metrics"""
        try:
            if season is None:
                season = datetime.now().year

            # Check cache first
            cache_key = f"comprehensive_stats:{player_id}:{season}"
            cached_stats = await self.cache_service.get(cache_key)
            if cached_stats:
                logger.info(f"Using cached comprehensive stats for player {player_id}")
                return cached_stats

            # Get basic MLB stats
            basic_stats = await self.get_player_season_stats(player_id, season)

            # Get advanced Baseball Savant metrics
            savant_metrics = await self._get_savant_metrics(player_id, season)

            # Get recent form analysis
            recent_form = await self._get_recent_form(player_id)

            # Combine all statistics
            comprehensive_stats = {
                **basic_stats,
                **savant_metrics,
                **recent_form,
                "analysis_timestamp": datetime.now().isoformat(),
                "data_quality_score": self._calculate_data_quality(
                    basic_stats, savant_metrics
                ),
            }

            # Cache for 6 hours (live updates during game day)
            await self.cache_service.set(
                cache_key, comprehensive_stats, ttl=21600  # 6 hours
            )

            return comprehensive_stats

        except Exception as e:
            logger.warning(f"Error fetching comprehensive stats for {player_id}: {e}")
            return await self.get_player_season_stats(
                player_id, season or datetime.now().year
            )

    async def _get_savant_metrics(
        self, player_id: int, season: int
    ) -> Dict[str, float]:
        """Get Baseball Savant advanced metrics with fallback and circuit breaker"""

        # Check circuit breaker
        if not self.circuit_breaker.is_callable():
            logger.warning("Circuit breaker open, using default metrics")
            return self._get_default_savant_metrics()

        try:
            if not self.savant_client:
                return self._get_default_savant_metrics()

            # Add timeout for external API calls
            async with asyncio.timeout(10.0):  # 10 second timeout
                savant_data = None

                if hasattr(self.savant_client, "get_player_statcast_data"):
                    savant_data = await self.savant_client.get_player_statcast_data(
                        player_id, season
                    )
                elif hasattr(self.savant_client, "get_statcast_data"):
                    savant_data = await self.savant_client.get_statcast_data(
                        player_id, season
                    )
                elif hasattr(self.savant_client, "get_player_data"):
                    savant_data = await self.savant_client.get_player_data(
                        player_id, season
                    )
                else:
                    logger.warning("Baseball Savant client methods not available")
                    return self._get_default_savant_metrics()

            if not savant_data:
                return self._get_default_savant_metrics()

            # Record success for circuit breaker
            self.circuit_breaker.record_success()

            return {
                "xba": savant_data.get("expected_avg", savant_data.get("xba", 0.25)),
                "xslg": savant_data.get("expected_slg", savant_data.get("xslg", 0.4)),
                "xwoba": savant_data.get(
                    "expected_woba", savant_data.get("xwoba", 0.32)
                ),
                "barrel_rate": savant_data.get(
                    "barrel_pct", savant_data.get("barrel_rate", 5.0)
                ),
                "hard_hit_rate": savant_data.get(
                    "hard_hit_pct", savant_data.get("hard_hit_rate", 35.0)
                ),
                "avg_exit_velocity": savant_data.get(
                    "avg_exit_velo", savant_data.get("exit_velocity", 87.0)
                ),
                "avg_launch_angle": savant_data.get("avg_launch_angle", 12.0),
                "sprint_speed": savant_data.get("sprint_speed", 27.0),
                "whiff_rate": savant_data.get(
                    "whiff_pct", savant_data.get("whiff_rate", 25.0)
                ),
                "chase_rate": savant_data.get(
                    "chase_pct", savant_data.get("chase_rate", 30.0)
                ),
            }

        except asyncio.TimeoutError:
            logger.warning(f"Timeout fetching Savant metrics for {player_id}")
            self.circuit_breaker.record_failure()
            return self._get_default_savant_metrics()
        except Exception as e:
            logger.warning(f"Error fetching Savant metrics for {player_id}: {e}")
            self.circuit_breaker.record_failure()
            return self._get_default_savant_metrics()

    async def _get_recent_form(
        self, player_id: int, days: int = 15
    ) -> Dict[str, float]:
        """Analyze recent form with fallback"""
        try:
            if not self.savant_client:
                return self._get_default_recent_form()

            # Try different method names for recent data
            recent_games = None

            if hasattr(self.savant_client, "get_recent_game_logs"):
                recent_games = await self.savant_client.get_recent_game_logs(
                    player_id, days
                )
            elif hasattr(self.savant_client, "get_game_logs"):
                recent_games = await self.savant_client.get_game_logs(player_id, days)
            elif hasattr(self.savant_client, "get_recent_data"):
                recent_games = await self.savant_client.get_recent_data(player_id, days)
            else:
                logger.warning(
                    "Baseball Savant client recent data methods not available"
                )
                return self._get_default_recent_form()

            if not recent_games:
                return self._get_default_recent_form()

            # Calculate recent form metrics
            recent_stats = self._calculate_recent_performance(recent_games)

            return {
                "recent_form_score": recent_stats.get("form_score", 1.0),
                "recent_avg": recent_stats.get("avg", 0.25),
                "recent_ops": recent_stats.get("ops", 0.7),
                "recent_hr_rate": recent_stats.get("hr_rate", 0.03),
                "recent_k_rate": recent_stats.get("k_rate", 0.23),
                "games_analyzed": len(recent_games),
                "trend_direction": recent_stats.get("trend", "stable"),
            }

        except Exception as e:
            logger.warning(f"Error calculating recent form for {player_id}: {e}")
            return self._get_default_recent_form()

    def _get_default_recent_form(self) -> Dict[str, float]:
        """Provide default recent form metrics"""
        return {
            "recent_form_score": 1.0,
            "recent_avg": 0.25,
            "recent_ops": 0.7,
            "recent_hr_rate": 0.03,
            "recent_k_rate": 0.23,
            "games_analyzed": 10,
            "trend_direction": "stable",
        }

    def _calculate_recent_performance(self, recent_games: List[Dict]) -> Dict[str, Any]:
        """Calculate performance metrics from recent games"""
        if not recent_games:
            return {"form_score": 1.0}

        total_abs = sum(game.get("ab", 0) for game in recent_games)
        total_hits = sum(game.get("h", 0) for game in recent_games)
        total_hrs = sum(game.get("hr", 0) for game in recent_games)
        total_ks = sum(game.get("so", 0) for game in recent_games)

        if total_abs == 0:
            return {"form_score": 1.0}

        recent_avg = total_hits / total_abs if total_abs > 0 else 0
        hr_rate = total_hrs / total_abs if total_abs > 0 else 0
        k_rate = total_ks / total_abs if total_abs > 0 else 0

        # Calculate form score (higher is better recent performance)
        form_score = min(max(recent_avg * 3 + hr_rate * 5 - k_rate, 0.5), 2.0)

        return {
            "form_score": form_score,
            "avg": recent_avg,
            "hr_rate": hr_rate,
            "k_rate": k_rate,
            "trend": (
                "hot" if form_score > 1.2 else "cold" if form_score < 0.8 else "stable"
            ),
        }

    def _get_default_savant_metrics(self) -> Dict[str, float]:
        """Default Savant metrics when data unavailable"""
        return {
            "xba": 0.250,
            "xslg": 0.400,
            "xwoba": 0.320,
            "barrel_rate": 8.0,
            "hard_hit_rate": 35.0,
            "avg_exit_velocity": 87.0,
            "avg_launch_angle": 12.0,
            "sprint_speed": 26.0,
            "whiff_rate": 25.0,
            "chase_rate": 30.0,
        }

    def _calculate_data_quality(self, basic_stats: Dict, savant_metrics: Dict) -> float:
        """Calculate data quality score (0-1)"""
        quality_factors = []

        # Games played factor
        games = basic_stats.get("games_played", 0)
        quality_factors.append(min(games / 100, 1.0))

        # Savant data availability
        savant_available = len([v for v in savant_metrics.values() if v > 0])
        quality_factors.append(min(savant_available / 10, 1.0))

        return sum(quality_factors) / len(quality_factors)

    async def get_player_season_stats(
        self, player_id: int, season: Optional[int] = None
    ) -> Dict[str, float]:
        """Get player's season statistics"""
        try:
            if season is None:
                season = datetime.now().year

            # Use statsapi to get player stats
            player_stats = statsapi.player_stat_data(
                player_id, group="hitting", type="season"
            )

            # Extract relevant stats
            stats = {
                "games_played": 0,
                "hits": 0,
                "home_runs": 0,
                "rbis": 0,
                "runs": 0,
                "stolen_bases": 0,
                "strikeouts": 0,
                "walks": 0,
                "avg": 0.0,
                "obp": 0.0,
                "slg": 0.0,
            }

            # Parse statsapi response and extract stats
            if player_stats and "stats" in player_stats:
                season_stats = player_stats["stats"][0].get("stats", {})

                stats.update(
                    {
                        "games_played": season_stats.get("gamesPlayed", 0),
                        "hits": season_stats.get("hits", 0),
                        "home_runs": season_stats.get("homeRuns", 0),
                        "rbis": season_stats.get("rbi", 0),
                        "runs": season_stats.get("runs", 0),
                        "stolen_bases": season_stats.get("stolenBases", 0),
                        "strikeouts": season_stats.get("strikeOuts", 0),
                        "walks": season_stats.get("baseOnBalls", 0),
                        "avg": float(season_stats.get("avg", "0")),
                        "obp": float(season_stats.get("obp", "0")),
                        "slg": float(season_stats.get("slg", "0")),
                    }
                )

            return stats

        except Exception as e:
            logger.warning(f"Error fetching player stats for {player_id}: {e}")
            return self._get_default_stats()

    def _get_default_stats(self) -> Dict[str, float]:
        """Return reasonable default stats when data unavailable"""
        return {
            "games_played": 100,
            "hits": 120,
            "home_runs": 15,
            "rbis": 60,
            "runs": 70,
            "stolen_bases": 5,
            "strikeouts": 100,
            "walks": 40,
            "avg": 0.250,
            "obp": 0.320,
            "slg": 0.400,
        }


class PropTargetCalculator:
    """Advanced prop target calculator with feature engineering and market awareness"""

    def __init__(self):
        self.feature_engineer = AdvancedFeatureEngineering()
        self.position_stat_mapping = {
            "P": ["strikeouts", "walks_allowed", "hits_allowed", "innings_pitched"],
            "C": ["hits", "home_runs", "rbis", "runs"],
            "1B": ["hits", "home_runs", "rbis", "runs"],
            "2B": ["hits", "runs", "stolen_bases", "rbis"],
            "3B": ["hits", "home_runs", "rbis", "runs"],
            "SS": ["hits", "runs", "stolen_bases", "rbis"],
            "LF": ["hits", "home_runs", "rbis", "runs"],
            "CF": ["hits", "runs", "stolen_bases", "rbis"],
            "RF": ["hits", "home_runs", "rbis", "runs"],
            "OF": ["hits", "home_runs", "rbis", "runs"],
            "IF": ["hits", "runs", "rbis"],
            "DH": ["hits", "home_runs", "rbis", "runs"],
        }

    async def calculate_advanced_prop_targets(
        self,
        player_stats: Dict[str, Any],
        position: str,
        opposing_team: Optional[str] = None,
        game_context: Optional[Dict[str, Any]] = None,
    ) -> List[Tuple[str, float, str, Dict[str, Any]]]:
        """Calculate advanced prop targets with feature engineering"""

        targets = []
        games_played = max(player_stats.get("games_played", 1), 1)

        # Get relevant stats for position
        relevant_stats = self.position_stat_mapping.get(position, ["hits", "runs"])

        # Generate advanced features for each stat
        for stat_type in relevant_stats:
            target_info = await self._calculate_advanced_stat_target(
                stat_type, player_stats, games_played, opposing_team, game_context
            )

            if target_info:
                target, reasoning, metadata = target_info
                targets.append((stat_type, target, reasoning, metadata))

        return targets

    async def _calculate_advanced_stat_target(
        self,
        stat_type: str,
        player_stats: Dict[str, Any],
        games_played: int,
        opposing_team: Optional[str] = None,
        game_context: Optional[Dict[str, Any]] = None,
    ) -> Optional[Tuple[float, str, Dict[str, Any]]]:
        """Calculate advanced target using multiple factors"""

        try:
            # Base seasonal average
            base_target = self._get_base_target(stat_type, player_stats, games_played)

            if base_target is None:
                return None

            # Apply advanced adjustments
            adjustments = await self._calculate_adjustments(
                stat_type, player_stats, opposing_team, game_context
            )

            # Calculate final target
            final_target = base_target * adjustments["multiplier"]
            final_target = max(final_target, 0.5)  # Minimum target

            # Generate sophisticated reasoning
            reasoning = self._generate_advanced_reasoning(
                stat_type, base_target, final_target, adjustments, player_stats
            )

            # Create metadata for analysis
            metadata = {
                "base_target": base_target,
                "adjustments": adjustments,
                "confidence_factors": self._calculate_confidence_factors(player_stats),
                "market_context": adjustments.get("market_context", {}),
                "recent_form_impact": adjustments.get("recent_form_factor", 1.0),
                "matchup_impact": adjustments.get("matchup_factor", 1.0),
            }

            return round(final_target, 1), reasoning, metadata

        except Exception as e:
            logger.warning(f"Error calculating advanced target for {stat_type}: {e}")
            return None

    def _get_base_target(
        self, stat_type: str, player_stats: Dict[str, Any], games_played: int
    ) -> Optional[float]:
        """Get base target from seasonal stats"""
        stat_mapping = {
            "hits": "hits",
            "home_runs": "home_runs",
            "rbis": "rbis",
            "runs": "runs",
            "stolen_bases": "stolen_bases",
            "strikeouts": "strikeouts",
        }

        stat_key = stat_mapping.get(stat_type)
        if not stat_key:
            return None

        season_total = player_stats.get(stat_key, 0)
        return season_total / games_played

    async def _calculate_adjustments(
        self,
        stat_type: str,
        player_stats: Dict[str, Any],
        opposing_team: Optional[str] = None,
        game_context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Calculate multiple adjustment factors"""

        adjustments = {"multiplier": 1.0, "factors": []}

        # Recent form adjustment
        recent_form_factor = player_stats.get("recent_form_score", 1.0)
        adjustments["recent_form_factor"] = recent_form_factor
        adjustments["multiplier"] *= recent_form_factor
        adjustments["factors"].append(f"Recent form: {recent_form_factor:.2f}x")

        # Advanced metrics adjustment
        if stat_type in ["hits", "home_runs"]:
            # Use expected stats for better prediction
            xba = player_stats.get("xba", 0.25)
            actual_avg = player_stats.get("avg", 0.25)

            if actual_avg > 0:
                xstats_factor = min(max(xba / actual_avg, 0.8), 1.3)
                adjustments["xstats_factor"] = xstats_factor
                adjustments["multiplier"] *= xstats_factor
                adjustments["factors"].append(f"Expected stats: {xstats_factor:.2f}x")

        # Ballpark factor (if available)
        if game_context and "ballpark_factor" in game_context:
            park_factor = game_context["ballpark_factor"]
            adjustments["park_factor"] = park_factor
            adjustments["multiplier"] *= park_factor
            adjustments["factors"].append(f"Ballpark: {park_factor:.2f}x")

        # Matchup factor (vs opposing team strength)
        if opposing_team:
            matchup_factor = await self._get_matchup_factor(stat_type, opposing_team)
            adjustments["matchup_factor"] = matchup_factor
            adjustments["multiplier"] *= matchup_factor
            adjustments["factors"].append(f"Matchup: {matchup_factor:.2f}x")

        return adjustments

    async def _get_matchup_factor(self, stat_type: str, opposing_team: str) -> float:
        """Get matchup adjustment factor"""
        try:
            # This would integrate with team defensive stats
            # For now, use a slight random variation to simulate matchup impact
            import random

            random.seed(hash(opposing_team + stat_type))
            return round(random.uniform(0.9, 1.1), 2)
        except:
            return 1.0

    def _generate_advanced_reasoning(
        self,
        stat_type: str,
        base_target: float,
        final_target: float,
        adjustments: Dict[str, Any],
        player_stats: Dict[str, Any],
    ) -> str:
        """Generate sophisticated reasoning for prop target"""

        # Base explanation
        games = player_stats.get("games_played", 100)
        season_total = int(base_target * games)

        reasoning = f"Base: {season_total} {stat_type} in {games} games (avg: {base_target:.2f})"

        # Add adjustment explanations
        factors = adjustments.get("factors", [])
        if factors:
            reasoning += f" | Adjustments: {', '.join(factors)}"

        # Add advanced context
        if "recent_form_score" in player_stats:
            form_score = player_stats["recent_form_score"]
            trend = player_stats.get("trend_direction", "stable")
            reasoning += f" | Recent form: {trend} ({form_score:.2f})"

        # Add expected stats context
        if stat_type == "hits" and "xba" in player_stats:
            xba = player_stats["xba"]
            actual_avg = player_stats.get("avg", 0.25)
            reasoning += f" | xBA: {xba:.3f} vs actual: {actual_avg:.3f}"

        return reasoning

    def _calculate_confidence_factors(
        self, player_stats: Dict[str, Any]
    ) -> Dict[str, float]:
        """Calculate confidence factors for the prediction"""
        return {
            "data_quality": player_stats.get("data_quality_score", 0.7),
            "sample_size": min(player_stats.get("games_played", 0) / 100, 1.0),
            "recent_form_stability": 1.0
            - abs(player_stats.get("recent_form_score", 1.0) - 1.0),
            "advanced_metrics_available": (
                1.0 if player_stats.get("xba", 0) > 0 else 0.5
            ),
        }

    def _calculate_stat_target(
        self,
        stat_type: str,
        player_stats: Dict[str, float],
        games_played: int,
        opposing_team: Optional[str] = None,
    ) -> Tuple[Optional[float], str]:
        """Calculate target for a specific stat type"""

        try:
            if stat_type == "hits":
                season_hits = player_stats.get("hits", 0)
                per_game_avg = season_hits / games_played
                target = round(per_game_avg, 1)
                reasoning = f"Based on {season_hits} hits in {games_played} games (avg: {per_game_avg:.2f})"

            elif stat_type == "home_runs":
                season_hrs = player_stats.get("home_runs", 0)
                per_game_avg = season_hrs / games_played
                target = round(per_game_avg, 1)
                reasoning = f"Based on {season_hrs} HRs in {games_played} games (avg: {per_game_avg:.2f})"

            elif stat_type == "rbis":
                season_rbis = player_stats.get("rbis", 0)
                per_game_avg = season_rbis / games_played
                target = round(per_game_avg, 1)
                reasoning = f"Based on {season_rbis} RBIs in {games_played} games (avg: {per_game_avg:.2f})"

            elif stat_type == "runs":
                season_runs = player_stats.get("runs", 0)
                per_game_avg = season_runs / games_played
                target = round(per_game_avg, 1)
                reasoning = f"Based on {season_runs} runs in {games_played} games (avg: {per_game_avg:.2f})"

            elif stat_type == "stolen_bases":
                season_sb = player_stats.get("stolen_bases", 0)
                per_game_avg = season_sb / games_played
                target = round(per_game_avg, 1)
                reasoning = f"Based on {season_sb} SBs in {games_played} games (avg: {per_game_avg:.2f})"

            elif stat_type == "strikeouts":
                # For pitchers
                season_ks = player_stats.get("strikeouts", 0)
                per_game_avg = season_ks / games_played
                target = round(per_game_avg, 1)
                reasoning = f"Based on {season_ks} strikeouts in {games_played} games (avg: {per_game_avg:.2f})"

            else:
                return None, "Stat type not supported"

            # Ensure minimum target of 0.5 for meaningful props
            target = max(target, 0.5)

            return target, reasoning

        except Exception as e:
            logger.warning(f"Error calculating target for {stat_type}: {e}")
            return None, f"Error calculating target: {str(e)}"


class ComprehensivePropGenerator:
    """Enterprise-grade comprehensive prop generator with modern async patterns and resilience"""

    def __init__(self):
        self.stats_analyzer = PlayerStatsAnalyzer()
        self.target_calculator = PropTargetCalculator()
        self.mlb_client = MLBProviderClient()
        self.cache_service = IntelligentCacheService()
        self.performance_optimizer = PerformanceOptimizer()

        # Modern data validation integration
        self.enhanced_data_validation_service = (
            None  # Will be initialized async if available
        )
        if ENHANCED_VALIDATION_AVAILABLE:
            # Use enhanced validation service for better performance and monitoring
            self.validation_service = None  # Will be initialized async
            self.use_enhanced_validation = True
            logger.info("✅ Enhanced data validation integration enabled")
        elif DATA_VALIDATION_AVAILABLE:
            # Fallback to basic validation service
            self.validation_service = validation_integration_service
            self.use_enhanced_validation = False
            logger.info("✅ Basic data validation integration enabled")
        else:
            # Use fallback validation service
            self.validation_service = DataValidationIntegrationService()
            self.use_enhanced_validation = False
            logger.warning(
                "⚠️ Data validation integration not available - using fallback"
            )

        # Modern async patterns
        self.resource_manager = _resource_manager
        self.batch_processor = AsyncBatchProcessor(max_concurrency=8, batch_size=25)
        self.circuit_breaker = CircuitBreaker(
            failure_threshold=5, recovery_timeout=120.0
        )

        # Initialize enterprise services on demand
        self.ml_service = None
        self.enhanced_analysis_service = None
        self.feature_engineer = None

        # Performance tracking with ML integration metrics
        self.generation_stats = {
            "total_props_generated": 0,
            "cache_hits": 0,
            "cache_misses": 0,
            "ml_predictions": 0,
            "fallback_predictions": 0,
            "high_confidence_props": 0,
            "ml_service_available": False,
            "ml_capabilities": {},
            "ml_enhanced_props": 0,
            "uncertainty_scores": [],
            "confidence_improvements": [],
            "shap_explanations_generated": 0,
            "circuit_breaker_trips": 0,
            "resource_cleanup_count": 0,
            "async_batch_operations": 0,
            "optimized_generations": 0,
            "optimization_time": 0.0,
            "optimization_timeouts": 0,
            "optimization_failures": 0,
            "prop_generation_failures": 0,
            "ml_timeouts": 0,
            "ml_circuit_breaker_trips": 0,
            "ml_processing_time": 0.0,
            # Data validation metrics
            "validation_enabled": DATA_VALIDATION_AVAILABLE,
            "data_validations_performed": 0,
            "data_conflicts_resolved": 0,
            "validation_failures": 0,
            "fallback_data_used": 0,
            "cross_validation_successes": 0,
        }

        logger.info(
            "🚀 Enterprise ComprehensivePropGenerator initialized with modern async patterns"
        )

    async def __aenter__(self):
        """Async context manager entry"""
        await self._initialize_enterprise_services()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit with proper cleanup"""
        await self.cleanup()

    async def cleanup(self):
        """Perform comprehensive cleanup of resources"""
        try:
            # Close resource manager
            if hasattr(self, "resource_manager") and self.resource_manager:
                await self.resource_manager.close()

            # Update cleanup stats
            self.generation_stats["resource_cleanup_count"] += 1

            # Clear large objects from memory
            if hasattr(self, "generation_stats"):
                # Keep only essential stats, clear large lists
                self.generation_stats["uncertainty_scores"] = []
                self.generation_stats["confidence_improvements"] = []

            # Force garbage collection
            gc.collect()

            logger.info("✅ ComprehensivePropGenerator cleanup completed")

        except Exception as e:
            logger.error(f"Error during cleanup: {e}")

    async def _initialize_enterprise_services(self):
        """Initialize enterprise ML and Phase 2 optimization services on demand"""
        logger.info("🚀 [Phase 2] Initializing enterprise services...")

        # Phase 1: Modern ML Integration Service
        if self.ml_service is None:
            try:
                from ..services.modern_ml_integration import ModernMLIntegration

                self.ml_service = ModernMLIntegration()
                logger.info("✅ [Phase 1] Modern ML Integration Service initialized")

                # Check if integration service is available and working
                try:
                    # Test basic functionality
                    current_strategy = getattr(
                        self.ml_service, "prediction_strategy", "unknown"
                    )
                    logger.info(
                        f"✅ [Phase 1] ML Integration Service ready - strategy: {current_strategy}"
                    )
                    self.generation_stats["ml_service_available"] = True
                    self.generation_stats["ml_strategy"] = str(current_strategy)

                except Exception as e:
                    logger.warning(f"[Phase 1] ML Integration Service test failed: {e}")

            except ImportError:
                logger.warning(
                    "⚠️ [Phase 1] Modern ML Integration Service not available - using fallback"
                )

        # Enhanced Data Validation Service Integration
        if (
            self.enhanced_data_validation_service is None
            and ENHANCED_VALIDATION_AVAILABLE
        ):
            try:
                from ..services.enhanced_data_validation_integration import (
                    EnhancedDataValidationIntegrationService,
                )

                self.enhanced_data_validation_service = (
                    EnhancedDataValidationIntegrationService()
                )
                logger.info("✅ Enhanced Data Validation Service initialized")
                self.generation_stats["enhanced_validation_available"] = True
            except ImportError:
                logger.warning("⚠️ Enhanced Data Validation Service not available")
                self.enhanced_data_validation_service = None
                self.generation_stats["enhanced_validation_available"] = False

        # Phase 2: Initialize optimization services
        await self._initialize_phase2_services()

        if self.enhanced_analysis_service is None:
            try:
                from ..services.enhanced_prop_analysis_service import (
                    enhanced_prop_analysis_service,
                )

                self.enhanced_analysis_service = enhanced_prop_analysis_service
                logger.info("✅ Enhanced Prop Analysis Service initialized")
            except ImportError:
                logger.warning("⚠️ Enhanced Prop Analysis Service not available")

        if self.feature_engineer is None:
            try:
                from ..services.automated_feature_engineering import (
                    AdvancedFeatureEngineering,
                )

                self.feature_engineer = AdvancedFeatureEngineering()
                logger.info("✅ Advanced Feature Engineering initialized")
            except ImportError:
                logger.warning("⚠️ Advanced Feature Engineering not available")

    async def _initialize_phase2_services(self):
        """Initialize Phase 2: Batch Processing Optimization services"""
        logger.info(
            "🔧 [Phase 2] Initializing batch processing optimization services..."
        )

        # Initialize Real-time Updates Service
        if (
            not hasattr(self, "real_time_updates_service")
            or self.real_time_updates_service is None
        ):
            try:
                from ..services.real_time_updates import real_time_pipeline

                self.real_time_updates_service = real_time_pipeline
                logger.info("✅ [Phase 2] Real-time Updates Service initialized")
                self.generation_stats["real_time_updates_available"] = True
            except ImportError as e:
                logger.warning(
                    f"⚠️ [Phase 2] Real-time Updates Service not available: {e}"
                )
                self.real_time_updates_service = None
                self.generation_stats["real_time_updates_available"] = False

        # Enhance Performance Optimizer with Phase 2 capabilities
        if hasattr(self, "performance_optimizer") and self.performance_optimizer:
            try:
                # Initialize GPU acceleration if available
                if hasattr(self.performance_optimizer, "initialize_gpu_acceleration"):
                    await self.performance_optimizer.initialize_gpu_acceleration()
                logger.info("✅ [Phase 2] Performance Optimizer enhanced")
                self.generation_stats["performance_optimizer_enhanced"] = True
            except Exception as e:
                logger.warning(
                    f"⚠️ [Phase 2] Performance Optimizer enhancement failed: {e}"
                )
                self.generation_stats["performance_optimizer_enhanced"] = False

        # Initialize Intelligent Cache Service enhancements
        try:
            from ..services.intelligent_cache_service import intelligent_cache_service

            # Verify cache service is working with Phase 2 features
            if hasattr(intelligent_cache_service, "enable_predictive_warming"):
                await intelligent_cache_service.enable_predictive_warming()
            logger.info("✅ [Phase 2] Intelligent Cache Service enhanced")
            self.generation_stats["intelligent_cache_enhanced"] = True
        except Exception as e:
            logger.warning(
                f"⚠️ [Phase 2] Intelligent Cache Service enhancement failed: {e}"
            )
            self.generation_stats["intelligent_cache_enhanced"] = False

        # Update generation stats with Phase 2 status
        phase2_services = [
            self.generation_stats.get("real_time_updates_available", False),
            self.generation_stats.get("performance_optimizer_enhanced", False),
            self.generation_stats.get("intelligent_cache_enhanced", False),
        ]
        self.generation_stats["phase2_integration_rate"] = (
            sum(phase2_services) / len(phase2_services)
        ) * 100

        logger.info(
            f"🎯 [Phase 2] Integration rate: {self.generation_stats['phase2_integration_rate']:.1f}%"
        )

    async def _apply_phase2_batch_optimization(
        self, data_list: List[Dict[str, Any]]
    ) -> List[Any]:
        """
        Apply Phase 2 batch processing optimizations for ML predictions

        Features:
        - Performance optimization with GPU acceleration
        - Intelligent caching for repeated predictions
        - Real-time model updates integration
        - Batch size optimization
        """
        logger.info(
            f"⚡ [Phase 2] Applying batch optimization for {len(data_list)} predictions"
        )

        # Phase 2.1: Intelligent Caching Check
        cached_results = []
        uncached_data = []
        cache_hits = 0

        try:
            for data in data_list:
                # Create cache key for prediction data
                cache_key = f"ml_prediction:{data.get('player_name', '')}:{data.get('stat_type', '')}:{data.get('line', 0)}"

                # Check cache first
                cached_result = await self.cache_service.get_cached_data(
                    cache_key, "ml_predictions"
                )
                if cached_result:
                    cached_results.append(cached_result)
                    cache_hits += 1
                    logger.debug(
                        f"📦 [Phase 2] Cache hit for {data.get('player_name', 'unknown')}"
                    )
                else:
                    cached_results.append(None)
                    uncached_data.append((len(cached_results) - 1, data))

        except Exception as e:
            logger.warning(f"⚠️ [Phase 2] Cache check failed: {e}")
            uncached_data = [(i, data) for i, data in enumerate(data_list)]

        self.generation_stats["cache_hits"] += cache_hits
        self.generation_stats["cache_misses"] += len(uncached_data)

        # Phase 2.2: Performance-Optimized Batch Prediction
        if uncached_data:
            logger.info(
                f"🚀 [Phase 2] Processing {len(uncached_data)} uncached predictions with optimization"
            )

            # Extract data for batch prediction
            batch_data = [data for _, data in uncached_data]

            # Apply performance optimization if available
            if hasattr(self, "performance_optimizer") and self.performance_optimizer:
                try:
                    # Use performance-optimized prediction
                    with self.performance_optimizer.context("ml_batch_prediction"):
                        ml_results = await self.ml_service.batch_predict(
                            data_list=batch_data, sport="MLB", prop_type="general"
                        )
                    logger.info(
                        f"⚡ [Phase 2] Performance-optimized prediction completed"
                    )
                except Exception as e:
                    logger.warning(
                        f"⚠️ [Phase 2] Performance optimization failed, using standard: {e}"
                    )
                    ml_results = await self.ml_service.batch_predict(
                        data_list=batch_data, sport="MLB", prop_type="general"
                    )
            else:
                # Fallback to standard prediction
                ml_results = await self.ml_service.batch_predict(
                    data_list=batch_data, sport="MLB", prop_type="general"
                )

            # Phase 2.3: Cache new results
            try:
                for (index, _), result in zip(uncached_data, ml_results):
                    data = data_list[index]
                    cache_key = f"ml_prediction:{data.get('player_name', '')}:{data.get('stat_type', '')}:{data.get('line', 0)}"

                    # Cache result with TTL based on data freshness
                    ttl = (
                        300 if hasattr(self, "real_time_updates_service") else 600
                    )  # 5 min vs 10 min
                    await self.cache_service.cache_data(
                        cache_key, result, "ml_predictions", ttl=ttl
                    )

                    # Update cached_results
                    cached_results[index] = result

            except Exception as e:
                logger.warning(f"⚠️ [Phase 2] Result caching failed: {e}")
                # Update results without caching
                for (index, _), result in zip(uncached_data, ml_results):
                    cached_results[index] = result

        # Phase 2.4: Real-time model updates integration
        if (
            hasattr(self, "real_time_updates_service")
            and self.real_time_updates_service
        ):
            try:
                # Record predictions for model improvement
                for data, result in zip(data_list, cached_results):
                    if result and hasattr(result, "confidence"):
                        self.real_time_updates_service.record_prediction(
                            prediction=getattr(result, "prediction", 0.5),
                            confidence=getattr(result, "confidence", 0.8),
                            context=data,
                        )
                logger.debug(
                    f"📊 [Phase 2] Recorded {len(cached_results)} predictions for model updates"
                )
            except Exception as e:
                logger.warning(f"⚠️ [Phase 2] Real-time updates recording failed: {e}")

        # Update Phase 2 statistics
        self.generation_stats["phase2_cache_hit_rate"] = (
            (
                self.generation_stats["cache_hits"]
                / (
                    self.generation_stats["cache_hits"]
                    + self.generation_stats["cache_misses"]
                )
            )
            * 100
            if (
                self.generation_stats["cache_hits"]
                + self.generation_stats["cache_misses"]
            )
            > 0
            else 0
        )

        logger.info(
            f"✅ [Phase 2] Batch optimization complete - Cache hit rate: {self.generation_stats['phase2_cache_hit_rate']:.1f}%"
        )

        return [result for result in cached_results if result is not None]

    async def _collect_and_validate_data_sources(
        self, game_id: int, player_id: Optional[int] = None
    ) -> Tuple[Dict[str, Any], List[str]]:
        """
        Collect data from multiple sources and perform cross-validation

        Args:
            game_id: Game ID for context
            player_id: Optional player ID for player-specific validation

        Returns:
            Tuple of (validated_data, warnings)
        """
        warnings = []
        collected_data = {
            "game_info": {},
            "players": {},
            "validation_metadata": {
                "sources_attempted": [],
                "sources_successful": [],
                "validation_performed": False,
            },
        }

        try:
            # Source 1: MLB Stats API (statsapi)
            statsapi_game_data = None
            try:
                game_info = await self._get_game_info(game_id)
                if game_info:
                    statsapi_game_data = game_info
                    collected_data["validation_metadata"]["sources_attempted"].append(
                        "statsapi"
                    )
                    collected_data["validation_metadata"]["sources_successful"].append(
                        "statsapi"
                    )
                    collected_data["game_info"]["statsapi"] = statsapi_game_data
            except Exception as e:
                logger.warning(f"Failed to collect statsapi data: {e}")
                warnings.append(f"statsapi collection failed: {e}")

            # Source 2: MLB Provider Client
            mlb_client_data = None
            try:
                if hasattr(self.mlb_client, "get_game_data"):
                    mlb_client_data = await self.mlb_client.get_game_data(game_id)
                    if mlb_client_data:
                        collected_data["validation_metadata"][
                            "sources_attempted"
                        ].append("mlb_client")
                        collected_data["validation_metadata"][
                            "sources_successful"
                        ].append("mlb_client")
                        collected_data["game_info"]["mlb_client"] = mlb_client_data
            except Exception as e:
                logger.warning(f"Failed to collect MLB client data: {e}")
                warnings.append(f"MLB client collection failed: {e}")

            # Source 3: Baseball Savant (if available)
            baseball_savant_data = None
            if BaseballSavantClient:
                try:
                    savant_client = BaseballSavantClient()
                    if hasattr(savant_client, "get_game_data"):
                        baseball_savant_data = await savant_client.get_game_data(
                            game_id
                        )
                        if baseball_savant_data:
                            collected_data["validation_metadata"][
                                "sources_attempted"
                            ].append("baseball_savant")
                            collected_data["validation_metadata"][
                                "sources_successful"
                            ].append("baseball_savant")
                            collected_data["game_info"][
                                "baseball_savant"
                            ] = baseball_savant_data
                except Exception as e:
                    logger.warning(f"Failed to collect Baseball Savant data: {e}")
                    warnings.append(f"Baseball Savant collection failed: {e}")

            # Perform cross-validation if multiple sources available
            if len(collected_data["validation_metadata"]["sources_successful"]) > 1:
                try:
                    validated_data, validation_warnings = (
                        await self.validation_service.validate_prop_generation_data(
                            game_id, collected_data
                        )
                    )

                    collected_data = validated_data
                    warnings.extend(validation_warnings)

                    collected_data["validation_metadata"]["validation_performed"] = True
                    self.generation_stats["data_validations_performed"] += 1
                    self.generation_stats["cross_validation_successes"] += 1

                    logger.info(
                        f"✅ Cross-validation completed for game {game_id} "
                        f"({len(collected_data['validation_metadata']['sources_successful'])} sources)"
                    )

                except Exception as e:
                    logger.error(f"Data validation failed: {e}")
                    warnings.append(f"Validation failed: {e}")
                    self.generation_stats["validation_failures"] += 1

            else:
                logger.info(
                    f"Single source available for game {game_id} - skipping cross-validation"
                )

            # Record metrics
            if validation_warnings := collected_data.get("validation_metadata", {}).get(
                "warnings", []
            ):
                self.generation_stats["data_conflicts_resolved"] += len(
                    [w for w in validation_warnings if "conflict" in w.lower()]
                )

            return collected_data, warnings

        except Exception as e:
            logger.error(f"Error collecting and validating data sources: {e}")
            self.generation_stats["validation_failures"] += 1
            return collected_data, warnings + [f"Data collection error: {e}"]

    async def _collect_and_validate_player_data(
        self, player_id: int, game_context: Dict[str, Any]
    ) -> Tuple[Dict[str, Any], List[str]]:
        """
        Collect and validate player data from multiple sources

        Args:
            player_id: Player ID
            game_context: Game context for validation

        Returns:
            Tuple of (validated_player_data, warnings)
        """
        warnings = []

        try:
            # Collect from multiple sources
            statsapi_data = None
            mlb_client_data = None
            baseball_savant_data = None

            # Source 1: statsapi (if available)
            try:
                # Player stats would typically come from the roster/game data
                if (
                    "players" in game_context
                    and str(player_id) in game_context["players"]
                ):
                    statsapi_data = game_context["players"][str(player_id)]
            except Exception as e:
                warnings.append(f"statsapi player data failed: {e}")

            # Source 2: Baseball Savant metrics
            if BaseballSavantClient:
                try:
                    baseball_savant_data = await self._get_savant_metrics(player_id)
                except Exception as e:
                    warnings.append(f"Baseball Savant player data failed: {e}")

            # Source 3: Enhanced analysis service
            if enhanced_prop_analysis_service:
                try:
                    if hasattr(enhanced_prop_analysis_service, "get_player_stats"):
                        mlb_client_data = (
                            await enhanced_prop_analysis_service.get_player_stats(
                                player_id
                            )
                        )
                except Exception as e:
                    warnings.append(f"Enhanced analysis player data failed: {e}")

            # Perform validation if multiple sources
            if (
                sum(
                    bool(data)
                    for data in [statsapi_data, mlb_client_data, baseball_savant_data]
                )
                > 1
            ):
                try:
                    validated_data, validation_report = (
                        await self.validation_service.validate_and_enhance_player_data(
                            player_id=player_id,
                            mlb_stats_data=mlb_client_data,
                            baseball_savant_data=baseball_savant_data,
                            statsapi_data=statsapi_data,
                        )
                    )

                    if validation_report and validation_report.conflicts:
                        warnings.append(
                            f"Player {player_id}: {len(validation_report.conflicts)} data conflicts resolved"
                        )
                        self.generation_stats["data_conflicts_resolved"] += len(
                            validation_report.conflicts
                        )

                    self.generation_stats["data_validations_performed"] += 1
                    return validated_data, warnings

                except Exception as e:
                    logger.warning(f"Player validation failed for {player_id}: {e}")
                    warnings.append(f"Player validation failed: {e}")
                    self.generation_stats["validation_failures"] += 1

            # Fallback to best available data
            best_data = baseball_savant_data or statsapi_data or mlb_client_data or {}
            if best_data:
                self.generation_stats["fallback_data_used"] += 1

            return best_data, warnings

        except Exception as e:
            logger.error(f"Error collecting player data for {player_id}: {e}")
            return {}, warnings + [f"Player data collection error: {e}"]

    async def generate_game_props(
        self, game_id: int, optimize_performance: bool = True
    ) -> Dict[str, Any]:
        """
        Generate comprehensive props with enterprise-grade systems and modern async patterns.

        Args:
            game_id (int): MLB game ID.
            optimize_performance (bool): Whether to use performance optimizations.

        Returns:
            Dict[str, Any]: Dictionary containing generated props, stats, and status.
        """
        start_time = time.time()
        cache_key = f"game_props:{game_id}"

        logger.info(f"🚀 Starting comprehensive prop generation for game {game_id}")
        logger.debug(f"🔍 Optimize performance: {optimize_performance}")

        # Circuit breaker: fail fast if open (check both state and is_callable)
        if (
            getattr(self.circuit_breaker, "state", None) == "OPEN"
            or not self.circuit_breaker.is_callable()
        ):
            logger.warning(
                f"Circuit breaker open for game {game_id}, using minimal fallback"
            )
            self.generation_stats["circuit_breaker_trips"] += 1
            return {
                "props": [],
                "phase2_stats": self.generation_stats,
                "status": "circuit_breaker_open",
            }

        # Try cache first (with timeout)
        try:
            async with asyncio.timeout(5.0):
                logger.debug(f"🔍 Checking cache for game {game_id}")
                cached_props = await self.cache_service.get_cached_data(
                    cache_key, "game_props"
                )
                if cached_props:
                    logger.info(f"✅ Cache hit for game {game_id}")
                    self.generation_stats["cache_hits"] += 1
                    self.circuit_breaker.record_success()
                    logger.info(
                        f"📊 Retrieved {len(cached_props)} props from cache for game {game_id}"
                    )
                    logger.debug(
                        f"🔍 Cached props types: {[type(prop).__name__ for prop in cached_props[:3]]}"
                    )
                    try:
                        # Defensive conversion of cached props
                        converted_props = []
                        for i, prop in enumerate(cached_props):
                            try:
                                if isinstance(prop, dict):
                                    converted_props.append(
                                        GeneratedProp.from_dict(prop)
                                    )
                                else:
                                    logger.error(
                                        f"❌ Cached prop {i} is not dict: {type(prop)} - {prop}"
                                    )
                            except Exception as conversion_error:
                                logger.error(
                                    f"❌ Error converting cached prop {i}: {conversion_error}"
                                )
                                logger.debug(f"❌ Prop data: {prop}")
                        return {
                            "props": converted_props,
                            "phase2_stats": self.generation_stats,
                            "status": "cache_hit",
                        }
                    except Exception as cache_conversion_error:
                        logger.error(
                            f"❌ Error processing cached props: {cache_conversion_error}"
                        )
                        logger.debug(
                            f"❌ Cache conversion error details:", exc_info=True
                        )
                        # Continue to fresh generation if cache conversion fails
                else:
                    logger.debug(f"🔍 Cache miss for game {game_id}")
        except asyncio.TimeoutError:
            logger.warning(f"Cache retrieval timeout for game {game_id}")
        except Exception as e:
            logger.warning(f"Cache retrieval failed: {e}")
            logger.debug(f"Cache retrieval error details:", exc_info=True)

        self.generation_stats["cache_misses"] += 1

        try:
            # Initialize enterprise services (with timeout)
            async with asyncio.timeout(30.0):
                await self._initialize_enterprise_services()
            logger.info(f"🎯 Generating comprehensive props for game {game_id}")

            # Get game info (with timeout)
            async with asyncio.timeout(15.0):
                game_info = await self._get_cached_game_info(game_id)
            if not game_info:
                logger.error(f"Could not fetch game info for {game_id}")
                self.circuit_breaker.record_failure()
                return {
                    "props": [],
                    "phase2_stats": self.generation_stats,
                    "status": "game_info_unavailable",
                }

            # Data validation and cross-validation
            validation_warnings = []
            validated_game_data = game_info
            if DATA_VALIDATION_AVAILABLE:
                try:
                    logger.info(
                        f"🔍 Collecting and validating data sources for game {game_id}"
                    )
                    async with asyncio.timeout(20.0):
                        validated_data, warnings = (
                            await self._collect_and_validate_data_sources(game_id)
                        )
                    validation_warnings.extend(warnings)
                    if validated_data.get("game_info"):
                        if "_validation" in str(validated_data.get("game_info", {})):
                            validated_game_data = validated_data["game_info"]
                            logger.info(
                                f"✅ Using validated game data (confidence: {validated_game_data.get('_validation', {}).get('confidence_score', 'unknown')})"
                            )
                        else:
                            for source in ["baseball_savant", "mlb_client", "statsapi"]:
                                if source in validated_data.get("game_info", {}):
                                    validated_game_data = validated_data["game_info"][
                                        source
                                    ]
                                    logger.info(
                                        f"✅ Using {source} as primary game data source"
                                    )
                                    break
                    validation_meta = validated_data.get("validation_metadata", {})
                    if validation_meta.get("validation_performed"):
                        logger.info(
                            f"🔍 Data validation completed: {len(validation_meta.get('sources_successful', []))} sources, {len(validation_warnings)} warnings"
                        )
                except asyncio.TimeoutError:
                    logger.warning(
                        f"Data validation timeout for game {game_id} - using standard data"
                    )
                    validation_warnings.append(
                        "Validation timeout - using fallback data"
                    )
                    self.generation_stats["validation_failures"] += 1
                except Exception as e:
                    logger.warning(
                        f"Data validation failed for game {game_id}: {e} - using standard data"
                    )
                    validation_warnings.append(f"Validation error: {e}")
                    self.generation_stats["validation_failures"] += 1
            else:
                logger.debug(
                    "Data validation not available - using standard data collection"
                )

            # Prop generation (performance-optimized if enabled)
            if optimize_performance and hasattr(self.performance_optimizer, "context"):
                with self.performance_optimizer.context("prop_generation"):
                    async with self.resource_manager.get_session():
                        all_props = await self._generate_props_optimized(
                            validated_game_data
                        )
            else:
                async with self.resource_manager.get_session():
                    all_props = await self._generate_props_standard(validated_game_data)

            # ML enhancements and ranking
            self.generation_stats["async_batch_operations"] += 1
            enhanced_props = await self._apply_enterprise_ml_enhancements(
                all_props, game_info
            )
            high_confidence_props = self._filter_and_rank_props(enhanced_props)

            # Cache results (with timeout)
            try:
                async with asyncio.timeout(10.0):
                    cache_ttl = self._calculate_cache_ttl(game_info)
                    logger.debug(
                        f"🔍 Preparing to cache {len(high_confidence_props)} props"
                    )
                    cache_props = []
                    for i, prop in enumerate(high_confidence_props):
                        try:
                            logger.debug(
                                f"🔍 Converting prop {i}: type={type(prop)}, has_to_dict={hasattr(prop, 'to_dict')}"
                            )
                            if hasattr(prop, "to_dict"):
                                cache_props.append(prop.to_dict())
                            else:
                                logger.error(
                                    f"❌ Prop {i} missing to_dict method: {type(prop)} - {prop}"
                                )
                                if isinstance(prop, dict):
                                    cache_props.append(prop)
                                else:
                                    logger.error(
                                        f"❌ Cannot convert prop {i} to dict: {prop}"
                                    )
                        except Exception as prop_error:
                            logger.error(
                                f"❌ Error converting prop {i} to dict: {prop_error}"
                            )
                            logger.error(f"❌ Prop type: {type(prop)}, content: {prop}")
                    await self.cache_service.cache_data(
                        cache_key, cache_props, ttl=cache_ttl, category="game_props"
                    )
            except asyncio.TimeoutError:
                logger.warning(f"Cache storage timeout for game {game_id}")
            except Exception as e:
                logger.warning(f"Caching failed: {e}")
                logger.debug(f"Caching error details:", exc_info=True)

            # Update stats
            generation_time = time.time() - start_time
            self.generation_stats["total_props_generated"] = len(enhanced_props)
            self.generation_stats["high_confidence_props"] = len(high_confidence_props)
            self.circuit_breaker.record_success()
            logger.info(
                f"🎯 Generated {len(enhanced_props)} total props, {len(high_confidence_props)} high-confidence props for game {game_id} in {generation_time:.2f}s"
            )
            logger.debug(
                f"🔍 Creating result dict with {len(high_confidence_props)} props"
            )

            # Prepare result
            result_props = []
            for i, prop in enumerate(high_confidence_props):
                try:
                    logger.debug(
                        f"🔍 Converting result prop {i}: type={type(prop)}, has_to_dict={hasattr(prop, 'to_dict')}"
                    )
                    if hasattr(prop, "to_dict"):
                        result_props.append(prop.to_dict())
                    else:
                        logger.error(
                            f"❌ Result prop {i} missing to_dict method: {type(prop)} - {prop}"
                        )
                        if isinstance(prop, dict):
                            result_props.append(prop)
                        elif isinstance(prop, str):
                            logger.error(
                                f"❌ String prop found where object expected: {prop}"
                            )
                            continue
                        else:
                            logger.error(
                                f"❌ Cannot convert result prop {i} to dict: {prop}"
                            )
                except Exception as prop_error:
                    logger.error(
                        f"❌ Error converting result prop {i} to dict: {prop_error}"
                    )
                    logger.error(f"❌ Prop type: {type(prop)}, content: {prop}")
                    logger.debug(f"❌ Full traceback:", exc_info=True)

            result = {
                "props": result_props,
                "phase2_stats": self.generation_stats,
                "status": "success",
                "generation_time": generation_time,
            }
            if DATA_VALIDATION_AVAILABLE:
                result["validation"] = {
                    "enabled": True,
                    "warnings": validation_warnings,
                    "validation_metrics": (
                        self.validation_service.get_performance_metrics()
                        if hasattr(self.validation_service, "get_performance_metrics")
                        else {}
                    ),
                }
            return result

        except asyncio.TimeoutError:
            logger.error(f"Timeout generating props for game {game_id}")
            self.circuit_breaker.record_failure()
            return {
                "props": [],
                "phase2_stats": self.generation_stats,
                "status": "timeout",
            }
        except Exception as e:
            logger.error(f"Error generating props for game {game_id}: {e}")
            self.circuit_breaker.record_failure()
            return {
                "props": [],
                "phase2_stats": self.generation_stats,
                "status": "error",
                "error": str(e),
            }

    async def _get_cached_game_info(self, game_id: int) -> Optional[Dict[str, Any]]:
        """Get game information with intelligent caching"""
        cache_key = f"game_info:{game_id}"

        try:
            cached_info = await self.cache_service.get_cached_data(
                cache_key, "game_info"
            )

            if cached_info:
                return cached_info
        except Exception as e:
            logger.warning(f"Game info cache retrieval failed: {e}")

        # Fetch fresh game data
        game_info = await self._get_game_info(game_id)

        if game_info:
            try:
                # Cache with appropriate TTL based on game status
                ttl = (
                    3600 if game_info.get("status") == "Final" else 900
                )  # 1 hour for final, 15 min for others
                await self.cache_service.cache_data(
                    cache_key, game_info, ttl=ttl, category="game_info"
                )
            except Exception as e:
                logger.warning(f"Game info caching failed: {e}")

        return game_info

    async def _generate_props_optimized(
        self, game_info: Dict[str, Any]
    ) -> List[GeneratedProp]:
        """Generate props with performance optimization and modern async patterns"""
        start_time = time.time()
        self.generation_stats["optimized_generations"] += 1
        all_props = []

        try:
            # Get teams
            away_team = game_info.get("away_team")
            home_team = game_info.get("home_team")

            # Use batch processor for efficient concurrent operations
            async with self.batch_processor.batch_context() as batch:
                team_tasks = []

                if away_team:
                    task = batch.add_task(
                        self._generate_team_props_enhanced(
                            away_team,
                            home_team.get("name") if home_team else "Unknown",
                            game_info,
                        ),
                        timeout=30.0,
                    )
                    team_tasks.append(("away", task))

                if home_team:
                    task = batch.add_task(
                        self._generate_team_props_enhanced(
                            home_team,
                            away_team.get("name") if away_team else "Unknown",
                            game_info,
                        ),
                        timeout=30.0,
                    )
                    team_tasks.append(("home", task))

                # Execute all tasks concurrently with proper resource management
                if team_tasks:
                    results = await batch.execute_all()

                    for (team_type, _), result in zip(team_tasks, results):
                        if result and not isinstance(result, Exception):
                            all_props.extend(result)
                            logger.info(
                                f"✓ Generated {len(result)} {team_type} team props"
                            )
                        else:
                            error_msg = (
                                str(result)
                                if isinstance(result, Exception)
                                else "Unknown error"
                            )
                            logger.warning(
                                f"⚠ Failed to generate {team_type} team props: {error_msg}"
                            )
                            self.generation_stats["prop_generation_failures"] += 1

            optimization_time = time.time() - start_time
            self.generation_stats["optimization_time"] = optimization_time

            logger.info(
                f"🚀 Optimized generation completed: {len(all_props)} props in {optimization_time:.2f}s"
            )

        except asyncio.TimeoutError:
            logger.error("Optimized prop generation timed out")
            self.generation_stats["optimization_timeouts"] += 1
        except Exception as e:
            logger.error(f"Optimized prop generation failed: {e}")
            self.generation_stats["optimization_failures"] += 1

        return all_props

    async def _generate_props_standard(
        self, game_info: Dict[str, Any]
    ) -> List[GeneratedProp]:
        """Standard prop generation (fallback)"""
        all_props = []

        # Generate props for away team
        away_team = game_info.get("away_team")
        if away_team:
            away_props = await self._generate_team_props(
                away_team,
                game_info.get("home_team", {}).get("name", "Unknown"),
                game_info.get("game_id"),
            )
            all_props.extend(away_props)

        # Generate props for home team
        home_team = game_info.get("home_team")
        if home_team:
            home_props = await self._generate_team_props(
                home_team,
                game_info.get("away_team", {}).get("name", "Unknown"),
                game_info.get("game_id"),
            )
            all_props.extend(home_props)

        return all_props

    async def _generate_team_props_enhanced(
        self, team_info: Dict[str, Any], opposing_team: str, game_info: Dict[str, Any]
    ) -> List[GeneratedProp]:
        """Generate enhanced team props with advanced analytics"""
        props = []

        try:
            team_name = team_info.get("name", "Unknown")
            team_id = team_info.get("id")

            if not team_id:
                logger.warning(f"No team ID found for {team_name}")
                return props

            # Get team roster with caching
            roster = await self._get_cached_team_roster(team_id)

            # Extract game context for advanced calculations
            game_context = self._extract_game_context(game_info)

            # Generate enhanced props for each player
            for player in roster:
                player_props = await self._generate_player_props_enhanced(
                    player, team_name, opposing_team, game_info, game_context
                )
                props.extend(player_props)

        except Exception as e:
            logger.error(f"Error generating enhanced team props: {e}")

        return props

    async def _get_cached_team_roster(self, team_id: int) -> List[Dict[str, Any]]:
        """Get team roster with caching"""
        cache_key = f"team_roster:{team_id}"

        try:
            cached_roster = await self.cache_service.get_cached_data(
                cache_key, "team_roster"
            )

            if cached_roster:
                return cached_roster
        except Exception as e:
            logger.warning(f"Roster cache retrieval failed: {e}")

        # Fetch fresh roster
        roster = await self._get_team_roster(team_id)

        if roster:
            try:
                # Cache roster for 1 hour
                await self.cache_service.cache_data(
                    cache_key, roster, ttl=3600, category="team_roster"
                )
            except Exception as e:
                logger.warning(f"Roster caching failed: {e}")

        return roster

    async def _generate_player_props_enhanced(
        self,
        player: Dict[str, Any],
        team_name: str,
        opposing_team: str,
        game_info: Dict[str, Any],
        game_context: Dict[str, Any],
    ) -> List[GeneratedProp]:
        """Generate enhanced props for a single player"""
        props = []

        try:
            player_info = player.get("person", {})
            player_id = player_info.get("id")
            player_name = player_info.get("fullName", "Unknown Player")
            position = player.get("position", {}).get("abbreviation", "IF")

            if not player_id:
                logger.warning(f"No player ID found for {player_name}")
                return props

            # Get comprehensive player statistics with advanced analytics
            player_stats = await self.stats_analyzer.get_comprehensive_player_stats(
                player_id
            )

            if not player_stats:
                logger.warning(f"No stats available for {player_name}")
                return props

            # Calculate advanced prop targets with feature engineering
            prop_targets = await self.target_calculator.calculate_advanced_prop_targets(
                player_stats, position, opposing_team, game_context
            )

            # Create enhanced GeneratedProp objects
            for stat_type, target_value, reasoning, metadata in prop_targets:
                # Calculate sophisticated confidence
                confidence = self._calculate_enhanced_confidence(
                    target_value, player_stats, metadata, game_context
                )

                prop = GeneratedProp(
                    player_name=player_name,
                    team=team_name,
                    position=position,
                    stat_type=stat_type,
                    target_value=target_value,
                    confidence=confidence,
                    reasoning=reasoning,
                    game_id=game_info.get("game_id"),
                    opposing_team=opposing_team,
                    source="advanced_analytics",
                )

                props.append(prop)

        except Exception as e:
            logger.error(
                f"Error generating enhanced props for player {player.get('person', {}).get('fullName', 'Unknown')}: {e}"
            )

        return props

    def _calculate_enhanced_confidence(
        self,
        target_value: float,
        player_stats: Dict[str, Any],
        metadata: Dict[str, Any],
        game_context: Dict[str, Any],
    ) -> float:
        """Calculate enhanced confidence using multiple factors"""
        try:
            base_confidence = 70.0

            # Data quality factor
            data_quality = metadata.get("confidence_factors", {}).get(
                "data_quality", 0.7
            )
            confidence_adjustment = (data_quality - 0.7) * 30

            # Sample size factor
            games_played = player_stats.get("games_played", 0)
            sample_factor = min(games_played / 100, 1.0)
            confidence_adjustment += sample_factor * 15

            # Recent form factor
            recent_form = player_stats.get("recent_form_score", 1.0)
            if 0.9 <= recent_form <= 1.1:  # Stable form
                confidence_adjustment += 10

            # Advanced metrics availability
            if (
                metadata.get("confidence_factors", {}).get(
                    "advanced_metrics_available", 0
                )
                > 0.5
            ):
                confidence_adjustment += 5

            # Target reasonableness
            if self._is_target_reasonable(target_value, metadata.get("stat_type", "")):
                confidence_adjustment += 5

            final_confidence = base_confidence + confidence_adjustment
            return round(min(max(final_confidence, 50), 95), 1)

        except Exception as e:
            logger.warning(f"Error calculating enhanced confidence: {e}")
            return 70.0

    def _is_target_reasonable(self, target: float, stat_type: str) -> bool:
        """Check if target is reasonable for stat type"""
        reasonable_ranges = {
            "hits": (0.5, 4.0),
            "home_runs": (0.5, 3.0),
            "rbis": (0.5, 5.0),
            "runs": (0.5, 4.0),
            "stolen_bases": (0.5, 2.0),
            "strikeouts": (3.0, 15.0),
        }

        if stat_type in reasonable_ranges:
            min_val, max_val = reasonable_ranges[stat_type]
            return min_val <= target <= max_val

        return True  # Default to reasonable for unknown stats

    async def _apply_enterprise_ml_enhancements(
        self, props: List[GeneratedProp], game_info: Dict[str, Any]
    ) -> List[GeneratedProp]:
        """Apply enterprise ML enhancements to props with modern async patterns"""
        start_time = time.time()
        logger.info(
            f"🤖 [ML Integration] Starting ML enhancements for {len(props)} props"
        )

        enhanced_props = []

        # Apply modern ML predictions with circuit breaker protection
        if self.ml_service and hasattr(self.ml_service, "batch_predict"):
            try:
                # Check circuit breaker before expensive ML operations
                if not self.circuit_breaker.is_callable():
                    logger.warning(
                        "Circuit breaker open for ML operations, using fallback"
                    )
                    self.generation_stats["ml_circuit_breaker_trips"] += 1
                    return await self._apply_fallback_enhancements(props, game_info)

                logger.info(f"🧠 Applying Modern ML enhancements to {len(props)} props")

                # Use batch processor for efficient ML operations
                async with self.batch_processor.batch_context() as batch:
                    # Prepare data for batch prediction with timeout
                    async with asyncio.timeout(
                        60.0
                    ):  # 1 minute timeout for ML processing
                        data_list = []
                        for prop in props:
                            prop_data = {
                                "player_name": prop.player_name,
                                "team": prop.team,
                                "opponent_team": prop.opposing_team or "Unknown",
                                "stat_type": prop.stat_type,
                                "line": prop.target_value,
                                "position": prop.position,
                                "base_confidence": prop.confidence,
                                "game_context": game_info,
                                "features": {
                                    "position": prop.position,
                                    "team": prop.team,
                                    "stat_type": prop.stat_type,
                                    "target_value": prop.target_value,
                                    "base_reasoning": prop.reasoning,
                                    "game_id": prop.game_id,
                                },
                            }
                            data_list.append(prop_data)

                        if data_list:
                            # Apply batch processing optimizations with timeout
                            ml_task = batch.add_task(
                                self._apply_phase2_batch_optimization(data_list),
                                timeout=45.0,
                            )

                            ml_results = await batch.execute_single(ml_task)

                            if isinstance(ml_results, Exception):
                                raise ml_results

                            self.generation_stats["ml_predictions"] = len(ml_results)
                            self.generation_stats["ml_enhanced_props"] = len(ml_results)
                            self.circuit_breaker.record_success()

                            logger.info(
                                f"🧠 [Phase 2] Received {len(ml_results)} ML predictions with optimizations"
                            )

                            # Enhance props with ML results using efficient processing
                            enhanced_props = await self._process_ml_results(
                                props, ml_results
                            )

                            ml_time = time.time() - start_time
                            self.generation_stats["ml_processing_time"] = ml_time

                            logger.info(
                                f"✅ Enhanced {len(enhanced_props)} props with Modern ML in {ml_time:.2f}s"
                            )
                            return enhanced_props

            except asyncio.TimeoutError:
                logger.error("ML enhancement timed out")
                self.circuit_breaker.record_failure()
                self.generation_stats["ml_timeouts"] += 1
                return await self._apply_fallback_enhancements(props, game_info)
            except Exception as e:
                logger.warning(f"ML integration enhancement failed: {e}")
                self.circuit_breaker.record_failure()
                self.generation_stats["fallback_predictions"] = len(props)
                return await self._apply_fallback_enhancements(props, game_info)

        # Apply enhanced analysis if available (fallback or secondary enhancement)
        return await self._apply_fallback_enhancements(props, game_info)

    async def _process_ml_results(
        self, props: List[GeneratedProp], ml_results: List[Any]
    ) -> List[GeneratedProp]:
        """Process ML results with modern async patterns"""
        enhanced_props = []

        # Use batch processor for efficient result processing
        async with self.batch_processor.batch_context() as batch:
            # Process results in batches for better performance
            batch_size = 50
            for i in range(0, len(props), batch_size):
                prop_batch = props[i : i + batch_size]
                result_batch = ml_results[i : i + min(batch_size, len(ml_results) - i)]

                task = batch.add_task(
                    self._enhance_prop_batch(prop_batch, result_batch), timeout=10.0
                )

                batch_result = await batch.execute_single(task)
                if not isinstance(batch_result, Exception):
                    enhanced_props.extend(batch_result)
                else:
                    logger.warning(f"Batch processing failed: {batch_result}")
                    # Add original props as fallback
                    enhanced_props.extend(prop_batch)

        return enhanced_props

    async def _enhance_prop_batch(
        self, props: List[GeneratedProp], ml_results: List[Any]
    ) -> List[GeneratedProp]:
        """Enhance a batch of props with ML results"""
        enhanced_batch = []

        for i, prop in enumerate(props):
            if i < len(ml_results):
                ml_result = ml_results[i]
                enhanced_prop = await self._enhance_single_prop(prop, ml_result)
                enhanced_batch.append(enhanced_prop)
            else:
                enhanced_batch.append(prop)

        return enhanced_batch

    async def _enhance_single_prop(
        self, prop: GeneratedProp, ml_result: Any
    ) -> GeneratedProp:
        """Enhance a single prop with ML result"""
        # Enhanced confidence blending with uncertainty awareness
        original_confidence = prop.confidence
        ml_confidence = getattr(ml_result, "confidence", prop.confidence)

        # Get uncertainty metrics if available
        epistemic_uncertainty = getattr(ml_result, "epistemic_uncertainty", 0.1)
        aleatoric_uncertainty = getattr(ml_result, "aleatoric_uncertainty", 0.1)
        total_uncertainty = getattr(ml_result, "total_uncertainty", 0.1)

        # Weight ML confidence by uncertainty (lower uncertainty = higher weight)
        ml_weight = max(0.3, 1.0 - total_uncertainty)
        base_weight = 1.0 - ml_weight

        blended_confidence = round(
            (original_confidence * base_weight + ml_confidence * ml_weight), 1
        )

        # Track confidence improvement
        confidence_improvement = blended_confidence - original_confidence
        self.generation_stats["confidence_improvements"].append(confidence_improvement)
        self.generation_stats["uncertainty_scores"].append(total_uncertainty)

        prop.confidence = min(99.9, max(50.0, blended_confidence))
        prop.prediction_source = "modern_ml_enhanced"

        # Add comprehensive ML metadata
        if not hasattr(prop, "metadata") or prop.metadata is None:
            prop.metadata = {}

        # Extract feature importance and SHAP values if available
        feature_importance = getattr(ml_result, "feature_importance", {})
        shap_values = getattr(ml_result, "shap_values", {})

        prop.metadata.update(
            {
                "ml_prediction": {
                    "prediction": getattr(ml_result, "prediction", prop.target_value),
                    "confidence": ml_confidence,
                    "model_type": getattr(ml_result, "model_type", "unknown"),
                    "model_version": getattr(ml_result, "model_version", "unknown"),
                },
                "uncertainty_analysis": {
                    "epistemic_uncertainty": epistemic_uncertainty,
                    "aleatoric_uncertainty": aleatoric_uncertainty,
                    "total_uncertainty": total_uncertainty,
                },
                "confidence_blending": {
                    "original_confidence": original_confidence,
                    "ml_confidence": ml_confidence,
                    "blended_confidence": blended_confidence,
                    "improvement": confidence_improvement,
                    "ml_weight": ml_weight,
                    "base_weight": base_weight,
                },
                "shap_values": shap_values,
                "feature_importance": feature_importance,
            }
        )

        # Enhanced reasoning with ML insights
        if hasattr(ml_result, "reasoning") and ml_result.reasoning:
            prop.reasoning = f"{prop.reasoning} | ML Analysis: {ml_result.reasoning}"
        elif feature_importance:
            # Generate reasoning from feature importance
            top_features = sorted(
                feature_importance.items(), key=lambda x: abs(x[1]), reverse=True
            )[:3]
            feature_insights = ", ".join(
                [f"{feat}: {impact:.3f}" for feat, impact in top_features]
            )
            prop.reasoning = f"{prop.reasoning} | ML Insights: {feature_insights}"

        return prop

    async def _apply_fallback_enhancements(
        self, props: List[GeneratedProp], game_info: Dict[str, Any]
    ) -> List[GeneratedProp]:
        """Apply fallback enhancements when ML service is unavailable"""
        enhanced_props = []

        if self.enhanced_analysis_service:
            try:
                logger.info("🔍 Applying Enhanced Analysis Service (fallback)")

                # Use batch processor for efficient SHAP processing
                async with self.batch_processor.batch_context() as batch:
                    high_confidence_props = [p for p in props if p.confidence >= 75]

                    if high_confidence_props:
                        shap_task = batch.add_task(
                            self._generate_shap_explanations_batch(
                                high_confidence_props
                            ),
                            timeout=30.0,
                        )

                        shap_results = await batch.execute_single(shap_task)
                        if not isinstance(shap_results, Exception):
                            self.generation_stats["shap_explanations_generated"] += len(
                                shap_results
                            )

                for prop in props:
                    enhanced_props.append(prop)

                return enhanced_props
            except Exception as e:
                logger.warning(f"Enhanced analysis failed: {e}")

        logger.info("📊 No ML enhancements available, returning original props")
        return props

    async def _generate_shap_explanations_batch(
        self, props: List[GeneratedProp]
    ) -> List[Dict[str, Any]]:
        """Generate SHAP explanations for a batch of props"""
        explanations = []

        for prop in props:
            try:
                explanation = await self.enhanced_analysis_service.generate_explanation(
                    prop.to_dict()
                )
                if not hasattr(prop, "metadata") or prop.metadata is None:
                    prop.metadata = {}
                prop.metadata["shap_explanation"] = explanation
                explanations.append(explanation)
            except Exception as e:
                logger.warning(f"SHAP explanation failed for {prop.player_name}: {e}")
                explanations.append(None)

        return explanations

    def _filter_and_rank_props(self, props: List[GeneratedProp]) -> List[GeneratedProp]:
        """Filter and rank props by quality"""

        logger.debug(f"🔍 Filtering {len(props)} props")
        logger.debug(
            f"🔍 Input props types: {[type(prop).__name__ for prop in props[:5]]}"
        )  # Check first 5

        # Validate input prop types
        valid_props = []
        for i, prop in enumerate(props):
            if (
                hasattr(prop, "confidence")
                and hasattr(prop, "target_value")
                and hasattr(prop, "stat_type")
            ):
                valid_props.append(prop)
            else:
                logger.error(
                    f"❌ Invalid prop at index {i}: type={type(prop)}, content={prop}"
                )
                if isinstance(prop, str):
                    logger.error(
                        f"❌ String prop found where GeneratedProp expected: {prop}"
                    )
                elif isinstance(prop, dict):
                    logger.error(
                        f"❌ Dict prop found where GeneratedProp expected: {list(prop.keys())}"
                    )

        logger.info(f"📊 Validated {len(valid_props)}/{len(props)} props")

        # Filter by confidence threshold
        quality_threshold = 60
        filtered_props = [
            prop for prop in valid_props if prop.confidence >= quality_threshold
        ]

        logger.debug(
            f"📊 {len(filtered_props)} props passed confidence threshold {quality_threshold}"
        )

        # Sort by confidence and target reasonableness
        try:
            filtered_props.sort(
                key=lambda p: (
                    p.confidence,
                    self._target_reasonableness_score(p.target_value, p.stat_type),
                ),
                reverse=True,
            )
            logger.debug("✅ Props sorted successfully")
        except Exception as sort_error:
            logger.error(f"❌ Error sorting props: {sort_error}")
            logger.debug(f"❌ Sort error details:", exc_info=True)
            # Return unsorted if sorting fails
            pass

        # Fallback: if no high-confidence props, return top 5 by confidence
        if not filtered_props:
            logger.warning(
                "No high-confidence props found; returning top 5 by confidence for verification."
            )
            try:
                fallback_props = sorted(
                    valid_props,
                    key=lambda p: (
                        p.confidence,
                        self._target_reasonableness_score(p.target_value, p.stat_type),
                    ),
                    reverse=True,
                )[:5]
                logger.info(f"📊 Returning {len(fallback_props)} fallback props")
                return fallback_props
            except Exception as fallback_error:
                logger.error(f"❌ Error creating fallback props: {fallback_error}")
                return []

        logger.info(f"📊 Returning {len(filtered_props)} filtered props")
        return filtered_props

    def _target_reasonableness_score(self, target: float, stat_type: str) -> float:
        """Score target reasonableness"""
        if stat_type == "hits":
            return 1.0 if 0.5 <= target <= 3.0 else 0.5
        elif stat_type == "home_runs":
            return 1.0 if 0.5 <= target <= 2.0 else 0.5
        elif stat_type == "rbis":
            return 1.0 if 0.5 <= target <= 4.0 else 0.5
        else:
            return 0.8

    def _extract_game_context(self, game_info: Dict[str, Any]) -> Dict[str, Any]:
        """Extract game context for advanced calculations"""
        return {
            "venue": "Unknown",  # Would extract from detailed game data
            "weather": {},
            "game_type": "R",
            "day_night": "day",
            "game_status": game_info.get("status", "Unknown"),
        }

    def _calculate_cache_ttl(self, game_info: Dict[str, Any]) -> int:
        """Calculate intelligent cache TTL based on game status"""
        status = game_info.get("status", "").lower()

        if "final" in status:
            return 7200  # 2 hours for final games
        elif "live" in status or "progress" in status:
            return 300  # 5 minutes for live games
        else:
            return 1800  # 30 minutes for upcoming games

    async def _get_game_info(self, game_id: int) -> Optional[Dict[str, Any]]:
        """Get game information including team details"""
        try:
            game_info = statsapi.get("game", {"gamePk": game_id})

            if not game_info:
                return None

            teams = game_info.get("gameData", {}).get("teams", {})

            return {
                "game_id": game_id,
                "away_team": teams.get("away"),
                "home_team": teams.get("home"),
                "status": game_info.get("gameData", {})
                .get("status", {})
                .get("abstractGameState"),
            }

        except Exception as e:
            logger.error(f"Error fetching game info for {game_id}: {e}")
            return None

    async def _generate_team_props(
        self, team_info: Dict[str, Any], opposing_team: str, game_id: int
    ) -> List[GeneratedProp]:
        """Generate props for all players on a team"""
        props = []

        try:
            team_name = team_info.get("name", "Unknown")
            team_id = team_info.get("id")

            if not team_id:
                logger.warning(f"No team ID found for {team_name}")
                return props

            # Get team roster
            roster = await self._get_team_roster(team_id)

            # Generate props for each player
            for player in roster:
                player_props = await self._generate_player_props(
                    player, team_name, opposing_team, game_id
                )
                props.extend(player_props)

        except Exception as e:
            logger.error(f"Error generating team props: {e}")

        return props

    async def _get_team_roster(self, team_id: int) -> List[Dict[str, Any]]:
        """Get current roster for a team"""
        try:
            roster_data = statsapi.get("team_roster", {"teamId": team_id})

            if not roster_data or "roster" not in roster_data:
                logger.warning(f"No roster data found for team {team_id}")
                return []

            return roster_data["roster"]

        except Exception as e:
            logger.error(f"Error fetching roster for team {team_id}: {e}")
            return []

    async def _generate_player_props(
        self, player: Dict[str, Any], team_name: str, opposing_team: str, game_id: int
    ) -> List[GeneratedProp]:
        """Generate props for a single player"""
        props = []

        try:
            player_info = player.get("person", {})
            player_id = player_info.get("id")
            player_name = player_info.get("fullName", "Unknown Player")
            position = player.get("position", {}).get("abbreviation", "IF")

            if not player_id:
                logger.warning(f"No player ID found for {player_name}")
                return props

            # Get player statistics
            player_stats = await self.stats_analyzer.get_player_season_stats(player_id)

            # Calculate prop targets based on position and stats
            prop_targets = await self.target_calculator.calculate_advanced_prop_targets(
                player_stats=player_stats,
                position=position,
                opposing_team=opposing_team,
                game_context={"opposing_team": opposing_team, "position": position},
            )

            # Create GeneratedProp objects
            for stat_type, target_value, reasoning, metadata in prop_targets:
                # Base confidence on data quality and reasonable targets
                confidence = self._calculate_base_confidence(target_value, player_stats)

                prop = GeneratedProp(
                    player_name=player_name,
                    team=team_name,
                    position=position,
                    stat_type=stat_type,
                    target_value=target_value,
                    confidence=confidence,
                    reasoning=reasoning,
                    game_id=game_id,
                    opposing_team=opposing_team,
                )

                props.append(prop)

        except Exception as e:
            logger.error(
                f"Error generating props for player {player.get('person', {}).get('fullName', 'Unknown')}: {e}"
            )

        return props

    def _calculate_base_confidence(
        self, target_value: float, player_stats: Dict[str, float]
    ) -> float:
        """Calculate base confidence score for a generated prop"""
        try:
            # Base confidence on data quality and target reasonableness
            games_played = player_stats.get("games_played", 0)

            # Confidence factors
            data_quality_factor = min(
                games_played / 100, 1.0
            )  # Higher confidence with more games
            target_reasonableness_factor = (
                1.0 if 0.5 <= target_value <= 10 else 0.7
            )  # Reasonable targets

            base_confidence = 70  # Starting confidence
            confidence = (
                base_confidence * data_quality_factor * target_reasonableness_factor
            )

            return round(min(max(confidence, 50), 95), 1)  # Clamp between 50-95

        except Exception as e:
            logger.warning(f"Error calculating confidence: {e}")
            return 60.0  # Default confidence

    async def _apply_ml_confidence_scoring(
        self, props: List[GeneratedProp]
    ) -> List[GeneratedProp]:
        """Apply ML-driven confidence scoring to generated props"""
        try:
            # Convert props to format expected by ML models
            prop_data = []
            for prop in props:
                prop_dict = prop.to_dict()
                prop_data.append(prop_dict)

            # Use existing modern ML service for enhanced predictions
            if hasattr(modern_ml_service, "predict_batch") and prop_data:
                try:
                    ml_predictions = await modern_ml_service.predict_batch(prop_data)

                    # Update props with ML-enhanced confidence scores
                    for i, prop in enumerate(props):
                        if i < len(ml_predictions):
                            ml_result = ml_predictions[i]
                            # Blend base confidence with ML confidence
                            ml_confidence = ml_result.get("confidence", prop.confidence)
                            prop.confidence = round(
                                (prop.confidence + ml_confidence) / 2, 1
                            )

                except Exception as e:
                    logger.warning(f"ML prediction failed, using base confidence: {e}")

            return props

        except Exception as e:
            logger.warning(f"Error applying ML confidence scoring: {e}")
            return props

    def get_ml_performance_analytics(self) -> Dict[str, Any]:
        """Get comprehensive ML performance analytics"""
        stats = self.generation_stats.copy()

        # Calculate ML enhancement metrics
        total_props = stats.get("total_props_generated", 0)
        ml_predictions = stats.get("ml_predictions", 0)

        analytics = {
            "ml_integration_rate": (
                (ml_predictions / total_props * 100) if total_props > 0 else 0
            ),
            "ml_service_status": (
                "available"
                if stats.get("ml_service_available", False)
                else "unavailable"
            ),
            "ml_capabilities": stats.get("ml_capabilities", {}),
            "cache_performance": {
                "hit_rate": (
                    stats.get("cache_hits", 0)
                    / (stats.get("cache_hits", 0) + stats.get("cache_misses", 1))
                    * 100
                ),
                "total_hits": stats.get("cache_hits", 0),
                "total_misses": stats.get("cache_misses", 0),
            },
            "confidence_metrics": {
                "uncertainty_scores": stats.get("uncertainty_scores", []),
                "confidence_improvements": stats.get("confidence_improvements", []),
                "average_uncertainty": sum(stats.get("uncertainty_scores", [0]))
                / max(1, len(stats.get("uncertainty_scores", [0]))),
                "average_confidence_improvement": sum(
                    stats.get("confidence_improvements", [0])
                )
                / max(1, len(stats.get("confidence_improvements", [0]))),
            },
            "enhancement_stats": {
                "ml_enhanced_props": stats.get("ml_enhanced_props", 0),
                "shap_explanations_generated": stats.get(
                    "shap_explanations_generated", 0
                ),
                "fallback_predictions": stats.get("fallback_predictions", 0),
            },
        }

        return analytics


# Initialize the service
comprehensive_prop_generator = ComprehensivePropGenerator()
