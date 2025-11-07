"""
Enhanced Feature Engineering for A1Betting7-13.2

Phase 2 implementation: Automated feature engineering pipeline with real-time
computation, advanced transformations, and intelligent feature selection.

Architecture Features:
- Automated feature discovery and generation
- Real-time feature computation and caching
- Time-series feature engineering
- Sports-specific domain knowledge integration
- Feature importance tracking and selection
- Streaming feature updates
"""

import asyncio
import hashlib
import json
import logging
import math
import time
import warnings
from collections import defaultdict, deque
from dataclasses import asdict, dataclass
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Callable, Dict, List, Optional, Tuple, Union

import numpy as np
import pandas as pd
from scipy import stats
from scipy.signal import find_peaks

warnings.filterwarnings("ignore")

import pandas.api.types as ptypes
from sklearn.decomposition import PCA, FastICA
from sklearn.ensemble import RandomForestRegressor
from sklearn.feature_selection import (
    RFE,
    SelectFromModel,
    SelectKBest,
    VarianceThreshold,
    f_classif,
    f_regression,
    mutual_info_regression,
)

# ML Libraries
from sklearn.preprocessing import (
    LabelEncoder,
    MinMaxScaler,
    OneHotEncoder,
    PolynomialFeatures,
    RobustScaler,
    StandardScaler,
)

from ..cache_manager_consolidated import CacheManagerConsolidated

# Existing services integration
from ..redis_service_optimized import RedisServiceOptimized

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("enhanced_feature_engineering")


class FeatureType(Enum):
    """Types of features"""

    NUMERICAL = "numerical"
    CATEGORICAL = "categorical"
    TEMPORAL = "temporal"
    TEXT = "text"
    BOOLEAN = "boolean"
    COMPOSITE = "composite"


class TransformationType(Enum):
    """Feature transformation types"""

    SCALING = "scaling"
    ENCODING = "encoding"
    BINNING = "binning"
    POLYNOMIAL = "polynomial"
    INTERACTION = "interaction"
    AGGREGATION = "aggregation"
    ROLLING = "rolling"
    LAG = "lag"
    RATIO = "ratio"
    STATISTICAL = "statistical"


class FeatureScope(Enum):
    """Feature computation scope"""

    PLAYER = "player"
    TEAM = "team"
    GAME = "game"
    SEASON = "season"
    HISTORICAL = "historical"
    MATCHUP = "matchup"
    MARKET = "market"


@dataclass
class FeatureDefinition:
    """Definition of a feature and how to compute it"""

    name: str
    feature_type: FeatureType
    transformation: TransformationType
    scope: FeatureScope
    computation_function: str  # Function name or expression
    dependencies: List[str]
    cache_ttl_seconds: int
    importance_score: float
    description: str
    enabled: bool = True


@dataclass
class FeatureMetadata:
    """Metadata for computed features"""

    name: str
    value: Any
    computation_time_ms: float
    cache_hit: bool
    staleness_seconds: float
    confidence: float
    dependencies_met: bool
    error_message: Optional[str] = None


@dataclass
class FeatureEngineResult:
    """Result of feature engineering process"""

    features: Dict[str, Any]
    metadata: Dict[str, FeatureMetadata]
    performance_stats: Dict[str, float]
    feature_importance: Dict[str, float]
    computation_graph: Dict[str, List[str]]
    total_features: int
    successful_features: int
    failed_features: int
    total_computation_time_ms: float


class FeatureStore:
    """In-memory feature store for caching computed features"""

    def __init__(self, max_size: int = 10000):
        self.max_size = max_size
        self.features: Dict[str, Dict[str, Any]] = {}
        self.timestamps: Dict[str, datetime] = {}
        self.access_count: Dict[str, int] = defaultdict(int)

    def get(self, key: str, max_age_seconds: int = 300) -> Optional[Dict[str, Any]]:
        """Get cached feature if available and not expired"""
        if key not in self.features:
            return None

        age = (datetime.now() - self.timestamps[key]).total_seconds()
        if age > max_age_seconds:
            del self.features[key]
            del self.timestamps[key]
            return None

        self.access_count[key] += 1
        return self.features[key]

    def set(self, key: str, value: Dict[str, Any]):
        """Set cached feature with LRU eviction"""
        if len(self.features) >= self.max_size:
            # Evict least recently used
            lru_key = min(self.access_count.keys(), key=lambda k: self.access_count[k])
            del self.features[lru_key]
            del self.timestamps[lru_key]
            del self.access_count[lru_key]

        self.features[key] = value
        self.timestamps[key] = datetime.now()
        self.access_count[key] = 1

    def invalidate(self, pattern: str = None):
        """Invalidate cached features matching pattern"""
        if pattern:
            keys_to_remove = [k for k in self.features.keys() if pattern in k]
        else:
            keys_to_remove = list(self.features.keys())

        for key in keys_to_remove:
            self.features.pop(key, None)
            self.timestamps.pop(key, None)
            self.access_count.pop(key, None)


class EnhancedFeatureEngineering:
    """
    Enhanced Feature Engineering with automated discovery and real-time computation

    Provides comprehensive feature engineering capabilities including automated
    feature generation, caching, and intelligent selection for sports betting.
    """

    def __init__(
        self,
        redis_service: RedisServiceOptimized,
        cache_manager: CacheManagerConsolidated,
        feature_store_size: int = 10000,
        enable_real_time: bool = True,
        max_features_per_scope: int = 50,
    ):
        self.redis_service = redis_service
        self.cache_manager = cache_manager
        self.enable_real_time = enable_real_time
        self.max_features_per_scope = max_features_per_scope

        # Feature store for caching
        self.feature_store = FeatureStore(max_size=feature_store_size)

        # Feature definitions registry
        self.feature_definitions: Dict[str, FeatureDefinition] = {}
        self.feature_importance_history: Dict[str, deque] = defaultdict(
            lambda: deque(maxlen=100)
        )

        # Transformation pipelines
        self.transformers = {
            "scalers": {},
            "encoders": {},
            "selectors": {},
            "polynomials": {},
            "dimensionality_reducers": {},
        }

        # Performance tracking
        self.computation_stats = {
            "total_computations": 0,
            "cache_hits": 0,
            "cache_misses": 0,
            "average_computation_time_ms": 0.0,
            "error_rate": 0.0,
        }

        # Initialize built-in feature definitions
        self._initialize_builtin_features()

        logger.info("Enhanced Feature Engineering initialized")

    def _initialize_builtin_features(self):
        """Initialize built-in feature definitions"""

        # Player performance features
        player_features = [
            FeatureDefinition(
                name="player_recent_avg",
                feature_type=FeatureType.NUMERICAL,
                transformation=TransformationType.AGGREGATION,
                scope=FeatureScope.PLAYER,
                computation_function="compute_recent_average",
                dependencies=["player_stats", "recent_games"],
                cache_ttl_seconds=1800,  # 30 minutes
                importance_score=0.8,
                description="Player's recent performance average",
            ),
            FeatureDefinition(
                name="player_performance_trend",
                feature_type=FeatureType.NUMERICAL,
                transformation=TransformationType.STATISTICAL,
                scope=FeatureScope.PLAYER,
                computation_function="compute_performance_trend",
                dependencies=["player_stats", "recent_games"],
                cache_ttl_seconds=3600,  # 1 hour
                importance_score=0.7,
                description="Player's performance trend (slope)",
            ),
            FeatureDefinition(
                name="player_consistency",
                feature_type=FeatureType.NUMERICAL,
                transformation=TransformationType.STATISTICAL,
                scope=FeatureScope.PLAYER,
                computation_function="compute_consistency_score",
                dependencies=["player_stats", "recent_games"],
                cache_ttl_seconds=3600,
                importance_score=0.6,
                description="Player's consistency score (inverse of variance)",
            ),
            FeatureDefinition(
                name="player_home_away_differential",
                feature_type=FeatureType.NUMERICAL,
                transformation=TransformationType.RATIO,
                scope=FeatureScope.PLAYER,
                computation_function="compute_home_away_differential",
                dependencies=["player_stats", "home_stats", "away_stats"],
                cache_ttl_seconds=7200,  # 2 hours
                importance_score=0.5,
                description="Difference in player performance at home vs away",
            ),
        ]

        # Team features
        team_features = [
            FeatureDefinition(
                name="team_strength_rating",
                feature_type=FeatureType.NUMERICAL,
                transformation=TransformationType.AGGREGATION,
                scope=FeatureScope.TEAM,
                computation_function="compute_team_strength",
                dependencies=["team_stats", "recent_games"],
                cache_ttl_seconds=3600,
                importance_score=0.9,
                description="Team's overall strength rating",
            ),
            FeatureDefinition(
                name="team_momentum",
                feature_type=FeatureType.NUMERICAL,
                transformation=TransformationType.ROLLING,
                scope=FeatureScope.TEAM,
                computation_function="compute_team_momentum",
                dependencies=["team_stats", "recent_games"],
                cache_ttl_seconds=1800,
                importance_score=0.7,
                description="Team's recent momentum score",
            ),
            FeatureDefinition(
                name="team_injury_impact",
                feature_type=FeatureType.NUMERICAL,
                transformation=TransformationType.AGGREGATION,
                scope=FeatureScope.TEAM,
                computation_function="compute_injury_impact",
                dependencies=["injuries", "player_importance"],
                cache_ttl_seconds=900,  # 15 minutes
                importance_score=0.6,
                description="Impact of team injuries on performance",
            ),
        ]

        # Matchup features
        matchup_features = [
            FeatureDefinition(
                name="matchup_strength_differential",
                feature_type=FeatureType.NUMERICAL,
                transformation=TransformationType.RATIO,
                scope=FeatureScope.MATCHUP,
                computation_function="compute_strength_differential",
                dependencies=["team_stats", "opponent_stats"],
                cache_ttl_seconds=1800,
                importance_score=0.9,
                description="Strength differential between teams",
            ),
            FeatureDefinition(
                name="head_to_head_advantage",
                feature_type=FeatureType.NUMERICAL,
                transformation=TransformationType.STATISTICAL,
                scope=FeatureScope.MATCHUP,
                computation_function="compute_h2h_advantage",
                dependencies=["head_to_head_history"],
                cache_ttl_seconds=7200,
                importance_score=0.6,
                description="Historical head-to-head advantage",
            ),
        ]

        # Market features
        market_features = [
            FeatureDefinition(
                name="line_movement_momentum",
                feature_type=FeatureType.NUMERICAL,
                transformation=TransformationType.ROLLING,
                scope=FeatureScope.MARKET,
                computation_function="compute_line_movement",
                dependencies=["betting_lines", "line_history"],
                cache_ttl_seconds=300,  # 5 minutes
                importance_score=0.7,
                description="Momentum in betting line movement",
            ),
            FeatureDefinition(
                name="public_betting_percentage",
                feature_type=FeatureType.NUMERICAL,
                transformation=TransformationType.AGGREGATION,
                scope=FeatureScope.MARKET,
                computation_function="compute_public_betting",
                dependencies=["betting_volume", "public_bets"],
                cache_ttl_seconds=600,  # 10 minutes
                importance_score=0.5,
                description="Percentage of public money on outcome",
            ),
        ]

        # Temporal features
        temporal_features = [
            FeatureDefinition(
                name="days_since_last_game",
                feature_type=FeatureType.NUMERICAL,
                transformation=TransformationType.TEMPORAL,
                scope=FeatureScope.GAME,
                computation_function="compute_days_since_last_game",
                dependencies=["game_date", "last_game_date"],
                cache_ttl_seconds=3600,
                importance_score=0.4,
                description="Days of rest since last game",
            ),
            FeatureDefinition(
                name="season_progress",
                feature_type=FeatureType.NUMERICAL,
                transformation=TransformationType.TEMPORAL,
                scope=FeatureScope.SEASON,
                computation_function="compute_season_progress",
                dependencies=["game_date", "season_start", "season_end"],
                cache_ttl_seconds=86400,  # 24 hours
                importance_score=0.3,
                description="Progress through current season (0-1)",
            ),
        ]

        # Register all features
        all_features = (
            player_features
            + team_features
            + matchup_features
            + market_features
            + temporal_features
        )

        for feature_def in all_features:
            self.feature_definitions[feature_def.name] = feature_def

        logger.info(f"Initialized {len(all_features)} built-in feature definitions")

    async def engineer_features(
        self,
        input_data: Dict[str, Any],
        target_features: Optional[List[str]] = None,
        use_cache: bool = True,
        parallel_computation: bool = True,
    ) -> FeatureEngineResult:
        """
        Main feature engineering method

        Computes all relevant features from input data with caching and
        parallel processing capabilities.
        """
        start_time = time.time()

        try:
            # Determine which features to compute
            if target_features:
                features_to_compute = [
                    name for name in target_features if name in self.feature_definitions
                ]
            else:
                features_to_compute = list(self.feature_definitions.keys())

            # Filter enabled features
            features_to_compute = [
                name
                for name in features_to_compute
                if self.feature_definitions[name].enabled
            ]

            logger.info(f"Computing {len(features_to_compute)} features")

            # Generate computation plan
            computation_plan = self._create_computation_plan(
                features_to_compute, input_data
            )

            # Execute computation plan
            if parallel_computation:
                computed_features, metadata = await self._execute_parallel_computation(
                    computation_plan, input_data, use_cache
                )
            else:
                computed_features, metadata = (
                    await self._execute_sequential_computation(
                        computation_plan, input_data, use_cache
                    )
                )

            # Calculate feature importance
            feature_importance = await self._calculate_feature_importance(
                computed_features
            )

            # Perform feature selection if too many features
            if len(computed_features) > self.max_features_per_scope:
                computed_features = await self._select_top_features(
                    computed_features, feature_importance, self.max_features_per_scope
                )

            # Create computation graph
            computation_graph = self._create_computation_graph(features_to_compute)

            # Calculate performance stats
            performance_stats = self._calculate_performance_stats(metadata)

            total_time = (time.time() - start_time) * 1000

            result = FeatureEngineResult(
                features=computed_features,
                metadata=metadata,
                performance_stats=performance_stats,
                feature_importance=feature_importance,
                computation_graph=computation_graph,
                total_features=len(features_to_compute),
                successful_features=len(computed_features),
                failed_features=len(features_to_compute) - len(computed_features),
                total_computation_time_ms=total_time,
            )

            # Update statistics
            self._update_computation_stats(result)

            return result

        except Exception as e:
            logger.error(f"Feature engineering failed: {e}")
            raise

    def _create_computation_plan(
        self, features_to_compute: List[str], input_data: Dict[str, Any]
    ) -> List[List[str]]:
        """Create computation plan respecting dependencies"""

        # Build dependency graph
        dependency_graph = {}
        for feature_name in features_to_compute:
            feature_def = self.feature_definitions[feature_name]
            dependency_graph[feature_name] = [
                dep
                for dep in feature_def.dependencies
                if dep in features_to_compute or dep in input_data
            ]

        # Topological sort to determine computation order
        computation_plan = []
        resolved = set()

        while len(resolved) < len(features_to_compute):
            # Find features with all dependencies resolved
            ready_features = [
                feature
                for feature in features_to_compute
                if feature not in resolved
                and all(
                    dep in resolved or dep in input_data
                    for dep in dependency_graph[feature]
                )
            ]

            if not ready_features:
                # Break circular dependencies or add remaining features
                remaining_features = [
                    f for f in features_to_compute if f not in resolved
                ]
                ready_features = remaining_features

            computation_plan.append(ready_features)
            resolved.update(ready_features)

        return computation_plan

    async def _execute_parallel_computation(
        self,
        computation_plan: List[List[str]],
        input_data: Dict[str, Any],
        use_cache: bool,
    ) -> Tuple[Dict[str, Any], Dict[str, FeatureMetadata]]:
        """Execute computation plan with parallel processing"""

        computed_features = {}
        metadata = {}

        for batch in computation_plan:
            # Process batch in parallel
            tasks = [
                self._compute_single_feature(
                    feature_name, input_data, computed_features, use_cache
                )
                for feature_name in batch
            ]

            batch_results = await asyncio.gather(*tasks, return_exceptions=True)

            # Process results
            for feature_name, result in zip(batch, batch_results):
                if isinstance(result, Exception):
                    logger.error(f"Error computing feature {feature_name}: {result}")
                    metadata[feature_name] = FeatureMetadata(
                        name=feature_name,
                        value=None,
                        computation_time_ms=0.0,
                        cache_hit=False,
                        staleness_seconds=0.0,
                        confidence=0.0,
                        dependencies_met=False,
                        error_message=str(result),
                    )
                else:
                    feature_value, feature_metadata = result
                    computed_features[feature_name] = feature_value
                    metadata[feature_name] = feature_metadata

        return computed_features, metadata

    async def _execute_sequential_computation(
        self,
        computation_plan: List[List[str]],
        input_data: Dict[str, Any],
        use_cache: bool,
    ) -> Tuple[Dict[str, Any], Dict[str, FeatureMetadata]]:
        """Execute computation plan sequentially"""

        computed_features = {}
        metadata = {}

        for batch in computation_plan:
            for feature_name in batch:
                try:
                    feature_value, feature_metadata = (
                        await self._compute_single_feature(
                            feature_name, input_data, computed_features, use_cache
                        )
                    )
                    computed_features[feature_name] = feature_value
                    metadata[feature_name] = feature_metadata
                except Exception as e:
                    logger.error(f"Error computing feature {feature_name}: {e}")
                    metadata[feature_name] = FeatureMetadata(
                        name=feature_name,
                        value=None,
                        computation_time_ms=0.0,
                        cache_hit=False,
                        staleness_seconds=0.0,
                        confidence=0.0,
                        dependencies_met=False,
                        error_message=str(e),
                    )

        return computed_features, metadata

    async def _compute_single_feature(
        self,
        feature_name: str,
        input_data: Dict[str, Any],
        computed_features: Dict[str, Any],
        use_cache: bool,
    ) -> Tuple[Any, FeatureMetadata]:
        """Compute a single feature with caching"""

        start_time = time.time()
        feature_def = self.feature_definitions[feature_name]

        # Generate cache key
        cache_key = self._generate_feature_cache_key(feature_name, input_data)

        # Check cache first
        cached_result = None
        if use_cache:
            cached_result = self.feature_store.get(
                cache_key, feature_def.cache_ttl_seconds
            )

        if cached_result:
            computation_time = (time.time() - start_time) * 1000
            return cached_result["value"], FeatureMetadata(
                name=feature_name,
                value=cached_result["value"],
                computation_time_ms=computation_time,
                cache_hit=True,
                staleness_seconds=cached_result.get("staleness", 0),
                confidence=cached_result.get("confidence", 1.0),
                dependencies_met=True,
            )

        # Check dependencies
        all_data = {**input_data, **computed_features}
        dependencies_met = all(dep in all_data for dep in feature_def.dependencies)

        if not dependencies_met:
            missing_deps = [
                dep for dep in feature_def.dependencies if dep not in all_data
            ]
            logger.warning(f"Missing dependencies for {feature_name}: {missing_deps}")
            return None, FeatureMetadata(
                name=feature_name,
                value=None,
                computation_time_ms=0.0,
                cache_hit=False,
                staleness_seconds=0.0,
                confidence=0.0,
                dependencies_met=False,
                error_message=f"Missing dependencies: {missing_deps}",
            )

        # Compute feature
        try:
            feature_value = await self._execute_computation_function(
                feature_def.computation_function, all_data, feature_def
            )

            computation_time = (time.time() - start_time) * 1000

            # Cache result
            if use_cache and feature_value is not None:
                cache_data = {
                    "value": feature_value,
                    "confidence": 1.0,
                    "staleness": 0.0,
                    "computed_at": datetime.now().isoformat(),
                }
                self.feature_store.set(cache_key, cache_data)

            return feature_value, FeatureMetadata(
                name=feature_name,
                value=feature_value,
                computation_time_ms=computation_time,
                cache_hit=False,
                staleness_seconds=0.0,
                confidence=1.0,
                dependencies_met=True,
            )

        except Exception as e:
            computation_time = (time.time() - start_time) * 1000
            logger.error(f"Computation failed for {feature_name}: {e}")
            return None, FeatureMetadata(
                name=feature_name,
                value=None,
                computation_time_ms=computation_time,
                cache_hit=False,
                staleness_seconds=0.0,
                confidence=0.0,
                dependencies_met=True,
                error_message=str(e),
            )

    async def _execute_computation_function(
        self, function_name: str, data: Dict[str, Any], feature_def: FeatureDefinition
    ) -> Any:
        """Execute the computation function for a feature"""

        # Map function names to actual computation methods
        computation_methods = {
            "compute_recent_average": self._compute_recent_average,
            "compute_performance_trend": self._compute_performance_trend,
            "compute_consistency_score": self._compute_consistency_score,
            "compute_home_away_differential": self._compute_home_away_differential,
            "compute_team_strength": self._compute_team_strength,
            "compute_team_momentum": self._compute_team_momentum,
            "compute_injury_impact": self._compute_injury_impact,
            "compute_strength_differential": self._compute_strength_differential,
            "compute_h2h_advantage": self._compute_h2h_advantage,
            "compute_line_movement": self._compute_line_movement,
            "compute_public_betting": self._compute_public_betting,
            "compute_days_since_last_game": self._compute_days_since_last_game,
            "compute_season_progress": self._compute_season_progress,
        }

        if function_name not in computation_methods:
            raise ValueError(f"Unknown computation function: {function_name}")

        return await computation_methods[function_name](data, feature_def)

    # Computation functions for built-in features

    async def _compute_recent_average(
        self, data: Dict[str, Any], feature_def: FeatureDefinition
    ) -> float:
        """Compute recent performance average"""
        try:
            player_stats = data.get("player_stats", {})
            recent_games = data.get("recent_games", [])

            if not recent_games:
                return 0.5  # Default neutral value

            # Extract performance values from recent games
            performances = []
            for game in recent_games[-10:]:  # Last 10 games
                if isinstance(game, dict):
                    performance = game.get("performance", game.get("points", 0))
                    performances.append(float(performance))

            return np.mean(performances) if performances else 0.5

        except Exception as e:
            logger.error(f"Error computing recent average: {e}")
            return 0.5

    async def _compute_performance_trend(
        self, data: Dict[str, Any], feature_def: FeatureDefinition
    ) -> float:
        """Compute performance trend (slope)"""
        try:
            recent_games = data.get("recent_games", [])

            if len(recent_games) < 3:
                return 0.0  # No trend with insufficient data

            performances = []
            for game in recent_games[-10:]:
                if isinstance(game, dict):
                    performance = game.get("performance", game.get("points", 0))
                    performances.append(float(performance))

            if len(performances) < 2:
                return 0.0

            # Calculate linear trend (slope)
            x = np.arange(len(performances))
            slope, _, _, _, _ = stats.linregress(x, performances)

            return float(slope)

        except Exception as e:
            logger.error(f"Error computing performance trend: {e}")
            return 0.0

    async def _compute_consistency_score(
        self, data: Dict[str, Any], feature_def: FeatureDefinition
    ) -> float:
        """Compute consistency score (inverse of variance)"""
        try:
            recent_games = data.get("recent_games", [])

            if len(recent_games) < 3:
                return 0.5

            performances = []
            for game in recent_games[-10:]:
                if isinstance(game, dict):
                    performance = game.get("performance", game.get("points", 0))
                    performances.append(float(performance))

            if len(performances) < 2:
                return 0.5

            # Calculate consistency as inverse of coefficient of variation
            mean_perf = np.mean(performances)
            std_perf = np.std(performances)

            if mean_perf == 0:
                return 0.5

            cv = std_perf / abs(mean_perf)
            consistency = 1 / (1 + cv)  # Normalize to 0-1 scale

            return float(consistency)

        except Exception as e:
            logger.error(f"Error computing consistency score: {e}")
            return 0.5

    async def _compute_home_away_differential(
        self, data: Dict[str, Any], feature_def: FeatureDefinition
    ) -> float:
        """Compute home vs away performance differential"""
        try:
            player_stats = data.get("player_stats", {})
            home_stats = player_stats.get("home_stats", {})
            away_stats = player_stats.get("away_stats", {})

            if not home_stats or not away_stats:
                return 0.0

            home_avg = np.mean(list(home_stats.values())) if home_stats else 0
            away_avg = np.mean(list(away_stats.values())) if away_stats else 0

            if away_avg == 0:
                return 1.0 if home_avg > 0 else 0.0

            differential = (home_avg - away_avg) / away_avg
            return float(np.clip(differential, -1.0, 1.0))

        except Exception as e:
            logger.error(f"Error computing home/away differential: {e}")
            return 0.0

    async def _compute_team_strength(
        self, data: Dict[str, Any], feature_def: FeatureDefinition
    ) -> float:
        """Compute team strength rating"""
        try:
            team_stats = data.get("team_stats", {})
            recent_games = data.get("recent_games", [])

            # Base strength from win percentage
            win_pct = team_stats.get("win_percentage", 0.5)

            # Adjust based on recent performance
            if recent_games:
                recent_wins = sum(
                    1
                    for game in recent_games[-10:]
                    if isinstance(game, dict) and game.get("result") == "win"
                )
                recent_win_pct = recent_wins / min(len(recent_games), 10)

                # Weighted average: 70% overall, 30% recent
                strength = 0.7 * win_pct + 0.3 * recent_win_pct
            else:
                strength = win_pct

            # Adjust for strength of schedule if available
            sos = team_stats.get("strength_of_schedule", 1.0)
            strength *= sos

            return float(np.clip(strength, 0.0, 1.0))

        except Exception as e:
            logger.error(f"Error computing team strength: {e}")
            return 0.5

    async def _compute_team_momentum(
        self, data: Dict[str, Any], feature_def: FeatureDefinition
    ) -> float:
        """Compute team momentum score"""
        try:
            recent_games = data.get("recent_games", [])

            if len(recent_games) < 3:
                return 0.5

            # Weight recent games more heavily
            weights = np.exp(np.linspace(-1, 0, min(len(recent_games), 10)))
            weights = weights / np.sum(weights)

            results = []
            for game in recent_games[-10:]:
                if isinstance(game, dict):
                    result = 1.0 if game.get("result") == "win" else 0.0
                    results.append(result)

            if not results:
                return 0.5

            momentum = np.average(results, weights=weights[: len(results)])
            return float(momentum)

        except Exception as e:
            logger.error(f"Error computing team momentum: {e}")
            return 0.5

    async def _compute_injury_impact(
        self, data: Dict[str, Any], feature_def: FeatureDefinition
    ) -> float:
        """Compute injury impact on team performance"""
        try:
            injuries = data.get("injuries", [])
            player_importance = data.get("player_importance", {})

            if not injuries:
                return 0.0  # No injury impact

            total_impact = 0.0
            for injury in injuries:
                if isinstance(injury, dict):
                    player_id = injury.get("player_id", "")
                    severity = injury.get("severity", "minor")

                    # Get player importance (0-1 scale)
                    importance = player_importance.get(player_id, 0.5)

                    # Severity multiplier
                    severity_multipliers = {
                        "minor": 0.2,
                        "moderate": 0.5,
                        "major": 0.8,
                        "season_ending": 1.0,
                    }

                    severity_mult = severity_multipliers.get(severity, 0.5)
                    impact = importance * severity_mult
                    total_impact += impact

            # Normalize to 0-1 scale (assume max 3 major injuries)
            return float(min(total_impact / 3.0, 1.0))

        except Exception as e:
            logger.error(f"Error computing injury impact: {e}")
            return 0.0

    async def _compute_strength_differential(
        self, data: Dict[str, Any], feature_def: FeatureDefinition
    ) -> float:
        """Compute strength differential between teams"""
        try:
            team_stats = data.get("team_stats", {})
            opponent_stats = data.get("opponent_stats", {})

            team_strength = team_stats.get("strength_rating", 0.5)
            opponent_strength = opponent_stats.get("strength_rating", 0.5)

            differential = team_strength - opponent_strength
            return float(np.clip(differential, -1.0, 1.0))

        except Exception as e:
            logger.error(f"Error computing strength differential: {e}")
            return 0.0

    async def _compute_h2h_advantage(
        self, data: Dict[str, Any], feature_def: FeatureDefinition
    ) -> float:
        """Compute head-to-head advantage"""
        try:
            h2h_history = data.get("head_to_head_history", [])

            if not h2h_history:
                return 0.0  # No historical advantage

            wins = sum(
                1
                for game in h2h_history
                if isinstance(game, dict) and game.get("result") == "win"
            )
            total_games = len(h2h_history)

            if total_games == 0:
                return 0.0

            win_rate = wins / total_games
            advantage = (win_rate - 0.5) * 2  # Convert to -1 to 1 scale

            return float(np.clip(advantage, -1.0, 1.0))

        except Exception as e:
            logger.error(f"Error computing H2H advantage: {e}")
            return 0.0

    async def _compute_line_movement(
        self, data: Dict[str, Any], feature_def: FeatureDefinition
    ) -> float:
        """Compute betting line movement momentum"""
        try:
            line_history = data.get("line_history", [])

            if len(line_history) < 2:
                return 0.0

            # Calculate momentum based on recent line changes
            recent_lines = line_history[-5:]  # Last 5 updates
            changes = []

            for i in range(1, len(recent_lines)):
                if isinstance(recent_lines[i], dict) and isinstance(
                    recent_lines[i - 1], dict
                ):
                    current_line = recent_lines[i].get("line", 0)
                    previous_line = recent_lines[i - 1].get("line", 0)
                    change = current_line - previous_line
                    changes.append(change)

            if not changes:
                return 0.0

            # Calculate weighted momentum (recent changes weighted more)
            weights = np.exp(np.linspace(-1, 0, len(changes)))
            weights = weights / np.sum(weights)

            momentum = np.average(changes, weights=weights)

            # Normalize to reasonable scale
            return float(np.clip(momentum / 5.0, -1.0, 1.0))

        except Exception as e:
            logger.error(f"Error computing line movement: {e}")
            return 0.0

    async def _compute_public_betting(
        self, data: Dict[str, Any], feature_def: FeatureDefinition
    ) -> float:
        """Compute public betting percentage"""
        try:
            betting_volume = data.get("betting_volume", {})
            public_bets = data.get("public_bets", {})

            total_volume = betting_volume.get("total", 0)
            public_volume = public_bets.get("volume", 0)

            if total_volume == 0:
                return 0.5  # No data, assume 50/50

            public_percentage = public_volume / total_volume
            return float(np.clip(public_percentage, 0.0, 1.0))

        except Exception as e:
            logger.error(f"Error computing public betting: {e}")
            return 0.5

    async def _compute_days_since_last_game(
        self, data: Dict[str, Any], feature_def: FeatureDefinition
    ) -> float:
        """Compute days of rest since last game"""
        try:
            game_date = data.get("game_date")
            last_game_date = data.get("last_game_date")

            if not game_date or not last_game_date:
                return 3.0  # Default rest days

            # Parse dates
            if isinstance(game_date, str):
                game_date = datetime.fromisoformat(game_date)
            if isinstance(last_game_date, str):
                last_game_date = datetime.fromisoformat(last_game_date)

            days_diff = (game_date - last_game_date).days
            return float(max(days_diff, 0))

        except Exception as e:
            logger.error(f"Error computing days since last game: {e}")
            return 3.0

    async def _compute_season_progress(
        self, data: Dict[str, Any], feature_def: FeatureDefinition
    ) -> float:
        """Compute season progress (0-1)"""
        try:
            game_date = data.get("game_date")
            season_start = data.get("season_start")
            season_end = data.get("season_end")

            if not all([game_date, season_start, season_end]):
                return 0.5  # Mid-season default

            # Parse dates
            if isinstance(game_date, str):
                game_date = datetime.fromisoformat(game_date)
            if isinstance(season_start, str):
                season_start = datetime.fromisoformat(season_start)
            if isinstance(season_end, str):
                season_end = datetime.fromisoformat(season_end)

            season_length = (season_end - season_start).days
            days_elapsed = (game_date - season_start).days

            if season_length <= 0:
                return 0.5

            progress = days_elapsed / season_length
            return float(np.clip(progress, 0.0, 1.0))

        except Exception as e:
            logger.error(f"Error computing season progress: {e}")
            return 0.5

    def _generate_feature_cache_key(
        self, feature_name: str, input_data: Dict[str, Any]
    ) -> str:
        """Generate cache key for a feature computation"""
        # Include relevant input data for cache key
        relevant_keys = ["player_id", "team_id", "game_id", "game_date"]
        key_data = {k: input_data.get(k) for k in relevant_keys if k in input_data}
        key_data["feature"] = feature_name

        key_string = json.dumps(key_data, sort_keys=True)
        return f"feature_{hashlib.md5(key_string.encode()).hexdigest()}"

    async def _calculate_feature_importance(
        self, features: Dict[str, Any]
    ) -> Dict[str, float]:
        """Calculate feature importance scores"""
        try:
            importance_scores = {}

            for feature_name, feature_value in features.items():
                if feature_name in self.feature_definitions:
                    # Use predefined importance score
                    base_importance = self.feature_definitions[
                        feature_name
                    ].importance_score

                    # Adjust based on feature value characteristics
                    if isinstance(feature_value, (int, float)):
                        # Penalize default/zero values
                        if feature_value == 0 or abs(feature_value - 0.5) < 0.01:
                            adjusted_importance = base_importance * 0.7
                        else:
                            adjusted_importance = base_importance
                    else:
                        adjusted_importance = base_importance * 0.8

                    importance_scores[feature_name] = adjusted_importance
                else:
                    # Default importance for unknown features
                    importance_scores[feature_name] = 0.5

            return importance_scores

        except Exception as e:
            logger.error(f"Error calculating feature importance: {e}")
            return {name: 0.5 for name in features.keys()}

    async def _select_top_features(
        self,
        features: Dict[str, Any],
        importance_scores: Dict[str, float],
        max_features: int,
    ) -> Dict[str, Any]:
        """Select top features based on importance scores"""
        try:
            # Sort features by importance
            sorted_features = sorted(
                importance_scores.items(), key=lambda x: x[1], reverse=True
            )

            # Select top features
            top_feature_names = [name for name, _ in sorted_features[:max_features]]

            return {
                name: features[name] for name in top_feature_names if name in features
            }

        except Exception as e:
            logger.error(f"Error selecting top features: {e}")
            return features

    def _create_computation_graph(self, features: List[str]) -> Dict[str, List[str]]:
        """Create computation dependency graph"""
        graph = {}

        for feature_name in features:
            if feature_name in self.feature_definitions:
                dependencies = self.feature_definitions[feature_name].dependencies
                graph[feature_name] = dependencies
            else:
                graph[feature_name] = []

        return graph

    def _calculate_performance_stats(
        self, metadata: Dict[str, FeatureMetadata]
    ) -> Dict[str, float]:
        """Calculate performance statistics"""
        try:
            computation_times = [
                m.computation_time_ms
                for m in metadata.values()
                if m.computation_time_ms > 0
            ]
            cache_hits = sum(1 for m in metadata.values() if m.cache_hit)
            total_features = len(metadata)
            successful_features = sum(
                1 for m in metadata.values() if m.value is not None
            )

            return {
                "average_computation_time_ms": (
                    np.mean(computation_times) if computation_times else 0.0
                ),
                "max_computation_time_ms": (
                    max(computation_times) if computation_times else 0.0
                ),
                "cache_hit_rate": (
                    cache_hits / total_features if total_features > 0 else 0.0
                ),
                "success_rate": (
                    successful_features / total_features if total_features > 0 else 0.0
                ),
                "total_features_computed": total_features,
                "successful_features": successful_features,
                "failed_features": total_features - successful_features,
            }

        except Exception as e:
            logger.error(f"Error calculating performance stats: {e}")
            return {}

    def _update_computation_stats(self, result: FeatureEngineResult):
        """Update global computation statistics"""
        self.computation_stats["total_computations"] += 1

        # Update cache statistics
        cache_hits = sum(1 for m in result.metadata.values() if m.cache_hit)
        cache_misses = result.total_features - cache_hits

        self.computation_stats["cache_hits"] += cache_hits
        self.computation_stats["cache_misses"] += cache_misses

        # Update average computation time
        current_avg = self.computation_stats["average_computation_time_ms"]
        total_computations = self.computation_stats["total_computations"]

        self.computation_stats["average_computation_time_ms"] = (
            current_avg * (total_computations - 1) + result.total_computation_time_ms
        ) / total_computations

        # Update error rate
        total_features = (
            self.computation_stats["total_computations"] * result.total_features
        )
        self.computation_stats["error_rate"] = (
            self.computation_stats["error_rate"]
            * (total_features - result.total_features)
            + result.failed_features
        ) / total_features

    async def register_custom_feature(self, feature_definition: FeatureDefinition):
        """Register a custom feature definition"""
        self.feature_definitions[feature_definition.name] = feature_definition
        logger.info(f"Registered custom feature: {feature_definition.name}")

    async def update_feature_importance(
        self, feature_name: str, importance_score: float
    ):
        """Update importance score for a feature"""
        if feature_name in self.feature_definitions:
            self.feature_definitions[feature_name].importance_score = importance_score

            # Track importance history
            self.feature_importance_history[feature_name].append(
                {"timestamp": datetime.now(), "importance": importance_score}
            )

    async def get_feature_statistics(self) -> Dict[str, Any]:
        """Get comprehensive feature engineering statistics"""
        return {
            "computation_stats": self.computation_stats,
            "registered_features": len(self.feature_definitions),
            "enabled_features": sum(
                1 for f in self.feature_definitions.values() if f.enabled
            ),
            "feature_store_size": len(self.feature_store.features),
            "feature_definitions": {
                name: {
                    "type": feature_def.feature_type.value,
                    "scope": feature_def.scope.value,
                    "importance": feature_def.importance_score,
                    "enabled": feature_def.enabled,
                    "cache_ttl": feature_def.cache_ttl_seconds,
                }
                for name, feature_def in self.feature_definitions.items()
            },
            "performance_summary": {
                "average_computation_time_ms": self.computation_stats[
                    "average_computation_time_ms"
                ],
                "cache_hit_rate": (
                    self.computation_stats["cache_hits"]
                    / max(
                        self.computation_stats["cache_hits"]
                        + self.computation_stats["cache_misses"],
                        1,
                    )
                ),
                "error_rate": self.computation_stats["error_rate"],
            },
        }

    async def invalidate_cache(self, pattern: Optional[str] = None):
        """Invalidate feature cache"""
        self.feature_store.invalidate(pattern)
        logger.info(f"Feature cache invalidated with pattern: {pattern}")


# Factory function for easy initialization
async def create_enhanced_feature_engineering(
    redis_service: RedisServiceOptimized,
    cache_manager: CacheManagerConsolidated,
    **kwargs,
) -> EnhancedFeatureEngineering:
    """Factory function to create the enhanced feature engineering service"""
    return EnhancedFeatureEngineering(
        redis_service=redis_service, cache_manager=cache_manager, **kwargs
    )
