"""
Advanced Feature Engineering for Statcast-based MLB Projections

This module provides sophisticated feature engineering capabilities specifically
designed for Baseball Savant Statcast data to create predictive features for
traditional baseball statistics.

Optimized for performance and production use with:
- Vectorized operations for speed
- Memory-efficient processing
- Real feature selection and scaling
- Comprehensive error handling
- Minimal code footprint
"""

import logging
import warnings
from dataclasses import dataclass, field
from functools import lru_cache
from typing import Any, Dict, List, Optional, Union

import numpy as np
import pandas as pd
from sklearn.feature_selection import SelectKBest, f_regression, mutual_info_regression
from sklearn.preprocessing import RobustScaler

logger = logging.getLogger("advanced_feature_engine")


# Constants for feature engineering
class FeatureConstants:
    """Constants used throughout feature engineering"""

    # Age-related constants
    PEAK_AGE = 27.5
    AGE_CURVE_VARIANCE = 50.0
    AGE_PEAK_BONUS = 0.15
    PRIME_AGE_MIN = 26
    PRIME_AGE_MAX = 30

    # Contact quality constants
    OPTIMAL_EV_BASE = 90.0
    OPTIMAL_LA_BASE = 15.0
    EV_LA_SCALING = 0.2
    LA_DEVIATION_FACTOR = 10.0

    # Power-related constants
    HR_OPTIMAL_LA_MIN = 25.0
    HR_OPTIMAL_LA_MAX = 35.0
    DISTANCE_PENALTY_FACTOR = 10.0

    # Rolling window defaults
    DEFAULT_WINDOWS = [10, 20, 30, 50]
    MIN_ROLLING_PERIODS_FACTOR = 0.5
    MIN_TREND_PERIODS = 3

    # Feature limits
    MAX_FEATURES_FOR_MOMENTUM = 5
    MAX_FEATURES_FOR_COMPARISON = 5

    # Small epsilon for numerical stability
    EPSILON = 1e-8

    # Outlier detection
    DEFAULT_OUTLIER_STD = 3.0

    # Correlation threshold
    HIGH_CORRELATION_THRESHOLD = 0.95


@dataclass
class FeatureConfig:
    """Configuration for feature engineering with comprehensive settings"""

    # Rolling window configurations
    rolling_window_sizes: List[int] = field(
        default_factory=lambda: FeatureConstants.DEFAULT_WINDOWS
    )
    min_sample_size: int = 20

    # Feature selection parameters
    feature_selection_k: int = 50
    feature_selection_method: str = "f_regression"  # or "mutual_info"

    # Outlier and correlation thresholds
    outlier_threshold: float = FeatureConstants.DEFAULT_OUTLIER_STD
    correlation_threshold: float = FeatureConstants.HIGH_CORRELATION_THRESHOLD

    # Processing options
    enable_time_series: bool = True
    enable_interactions: bool = True
    enable_situational: bool = True
    enable_scaling: bool = True
    enable_feature_selection: bool = True
    preserve_target_columns: bool = (
        True  # Preserve target columns from correlation removal
    )

    # Memory optimization
    use_float32: bool = True  # Use float32 instead of float64 for memory efficiency
    chunk_size: Optional[int] = None  # For processing large datasets in chunks


class AdvancedFeatureEngine:
    """
    Optimized feature engineering for Statcast data with focus on performance,
    memory efficiency, and real functionality.

    Key optimizations:
    - Vectorized operations
    - Memory-efficient processing
    - Real feature selection and scaling
    - Caching for expensive operations
    - Comprehensive error handling
    """

    def __init__(self, feature_config: Optional[FeatureConfig] = None):
        self.config = feature_config or FeatureConfig()
        self.scalers: Dict[str, RobustScaler] = {}
        self.feature_selectors: Dict[str, SelectKBest] = {}
        self._ballpark_factors: Optional[Dict[str, Dict[str, float]]] = None

        # Performance tracking
        self._processing_stats = {
            "features_created": 0,
            "features_removed": 0,
            "processing_time": 0.0,
        }

        logger.info("🔧 AdvancedFeatureEngine initialized with optimized configuration")

    def validate_input_data(
        self, data: pd.DataFrame, required_cols: Optional[List[str]] = None
    ) -> None:
        """Validate input data structure and content"""
        if data.empty:
            raise ValueError("Input data is empty")

        if required_cols:
            missing_cols = set(required_cols) - set(data.columns)
            if missing_cols:
                raise ValueError(f"Missing required columns: {missing_cols}")

        # Check for basic data quality issues
        if data.isnull().all().any():
            null_cols = data.columns[data.isnull().all()].tolist()
            logger.warning("Columns with all null values: %s", null_cols)

    def create_time_series_features(
        self,
        data: pd.DataFrame,
        player_id_col: str = "player_id",
        date_col: str = "game_date",
    ) -> pd.DataFrame:
        """
        Create optimized time series features with memory-efficient processing
        """
        if not self.config.enable_time_series:
            return data

        logger.info("📈 Creating optimized time series features")

        # Validate inputs
        self.validate_input_data(data, [player_id_col, date_col])

        # Sort efficiently
        if not data.index.is_monotonic_increasing:
            data = data.sort_values([player_id_col, date_col])

        # Get numeric columns efficiently
        numeric_cols = data.select_dtypes(include=[np.number]).columns.tolist()
        exclude_cols = (
            {player_id_col, "year"} if "year" in numeric_cols else {player_id_col}
        )
        feature_cols = [col for col in numeric_cols if col not in exclude_cols]

        # Memory optimization
        if self.config.use_float32:
            for col in feature_cols:
                if data[col].dtype == np.float64:
                    data[col] = data[col].astype(np.float32)

        # Create rolling features efficiently with batch operations to avoid DataFrame fragmentation
        grouped = data.groupby(player_id_col)

        # Collect all new features in a dictionary to add at once
        new_features = {}

        for window in self.config.rolling_window_sizes:
            min_periods = max(
                1, int(window * FeatureConstants.MIN_ROLLING_PERIODS_FACTOR)
            )

            for col in feature_cols:
                # Vectorized rolling operations
                rolling_data = grouped[col].rolling(
                    window=window, min_periods=min_periods
                )

                # Collect features instead of assigning directly to avoid fragmentation
                roll_feature = rolling_data.mean().reset_index(level=0, drop=True)
                std_feature = rolling_data.std().reset_index(level=0, drop=True)
                trend_feature = self._calculate_trend_vectorized(grouped[col], window)

                # Apply memory optimization if enabled
                if self.config.use_float32:
                    roll_feature = roll_feature.astype(np.float32)
                    std_feature = std_feature.astype(np.float32)
                    trend_feature = trend_feature.astype(np.float32)

                new_features[f"{col}_roll_{window}"] = roll_feature
                new_features[f"{col}_std_{window}"] = std_feature
                new_features[f"{col}_trend_{window}"] = trend_feature

        # Add all new features at once to avoid DataFrame fragmentation
        if new_features:
            new_features_df = pd.DataFrame(new_features, index=data.index)
            data = pd.concat([data, new_features_df], axis=1)

        # Add momentum and comparison features
        data = self._add_momentum_features_optimized(data, feature_cols)
        data = self._add_comparison_features_optimized(
            data, player_id_col, feature_cols
        )

        logger.info("✅ Time series features created: %s", data.shape)
        return data

    def create_interaction_features(self, data: pd.DataFrame) -> pd.DataFrame:
        """
        Create optimized interaction features with vectorized operations
        """
        if not self.config.enable_interactions:
            return data

        logger.info("🤝 Creating interaction features")

        # Exit velocity × Launch angle interactions (vectorized)
        if all(
            col in data.columns for col in ["avg_exit_velocity", "avg_launch_angle"]
        ):
            data["ev_la_product"] = data["avg_exit_velocity"] * data["avg_launch_angle"]
            data["optimal_contact_score"] = (
                self._calculate_optimal_contact_score_vectorized(data)
            )

        # Plate discipline composite (vectorized)
        discipline_cols = ["swing_rate", "contact_rate", "chase_rate"]
        if all(col in data.columns for col in discipline_cols):
            data["discipline_score"] = (
                data["contact_rate"] * (1 - data["chase_rate"]) * data["swing_rate"]
            )

        # Pitching stuff × command (vectorized)
        stuff_cols = ["avg_velocity", "avg_spin_rate", "strike_rate"]
        if all(col in data.columns for col in stuff_cols):
            data["stuff_command_score"] = (
                data["avg_velocity"]
                * data["avg_spin_rate"]
                * data["strike_rate"]
                / 10000
            )

        # Zone efficiency (vectorized)
        zone_cols = ["zone_rate", "first_pitch_strike_rate"]
        if all(col in data.columns for col in zone_cols):
            data["zone_efficiency"] = (
                data["zone_rate"] * data["first_pitch_strike_rate"]
            )

        # Power potential (vectorized)
        power_cols = ["max_exit_velocity", "fly_ball_rate"]
        if all(col in data.columns for col in power_cols):
            data["power_potential"] = data["max_exit_velocity"] * data["fly_ball_rate"]

        logger.info("✅ Interaction features added: %s", data.shape)
        return data

    def create_situational_features(self, data: pd.DataFrame) -> pd.DataFrame:
        """
        Create optimized situational and contextual features
        """
        if not self.config.enable_situational:
            return data

        logger.info("🎯 Creating situational features")

        # Ballpark factors (cached)
        if "team" in data.columns:
            ballpark_factors = self._get_ballpark_factors()
            data["ballpark_hr_factor"] = (
                data["team"].map(ballpark_factors["hr_factor"]).fillna(1.0)
            )
            data["ballpark_hit_factor"] = (
                data["team"].map(ballpark_factors["hit_factor"]).fillna(1.0)
            )

        # Age factors (vectorized)
        if "age" in data.columns:
            data["age_factor"] = self._calculate_age_factor_vectorized(data["age"])
            data["prime_years"] = (
                (data["age"] >= FeatureConstants.PRIME_AGE_MIN)
                & (data["age"] <= FeatureConstants.PRIME_AGE_MAX)
            ).astype(np.int8)

        # Team context (optimized)
        if "team" in data.columns and any(
            col in data.columns for col in ["avg_exit_velocity", "barrel_rate"]
        ):
            team_context = self._calculate_team_context_optimized(data)
            data = data.merge(team_context, on="team", how="left")

        logger.info("✅ Situational features added: %s", data.shape)
        return data

    def create_projection_specific_features(
        self, data: pd.DataFrame, target_stat: str
    ) -> pd.DataFrame:
        """
        Create optimized target-specific features with real calculations
        """
        logger.info("🎯 Creating %s-specific features", target_stat)

        if target_stat == "home_runs":
            # Power composite features
            data["power_composite"] = self._create_power_composite_vectorized(data)
            data["launch_angle_optimized"] = (
                self._optimize_launch_angle_for_hrs_vectorized(data)
            )

        elif target_stat == "pitcher_strikeouts":
            # Strikeout-specific features
            data["whiff_composite"] = self._create_whiff_composite_vectorized(data)

        elif target_stat == "walks":
            # Plate discipline features for walks
            data["eye_score"] = self._create_eye_score_vectorized(data)

        elif target_stat == "hits_allowed":
            # Contact management features
            data["contact_suppression"] = self._create_contact_suppression_vectorized(
                data
            )

        logger.info("✅ Added %s-specific features", target_stat)
        return data

    def engineer_features_for_stat(
        self, data: pd.DataFrame, target_stat: str, include_time_series: bool = True
    ) -> pd.DataFrame:
        """
        Optimized complete feature engineering pipeline
        """
        logger.info("🏗️ Engineering features for %s", target_stat)

        try:
            # Input validation
            self.validate_input_data(data)
            original_shape = data.shape

            # Time series features
            if (
                include_time_series
                and self.config.enable_time_series
                and "game_date" in data.columns
            ):
                data = self.create_time_series_features(data)

            # Interaction features
            if self.config.enable_interactions:
                data = self.create_interaction_features(data)

            # Situational features
            if self.config.enable_situational:
                data = self.create_situational_features(data)

            # Target-specific features
            data = self.create_projection_specific_features(data, target_stat)

            # Feature processing pipeline
            if self.config.enable_feature_selection:
                data = self._apply_feature_selection_real(data, target_stat)

            if self.config.enable_scaling:
                data = self._apply_scaling_real(data, target_stat)

            # Remove highly correlated features with target preservation
            data = self._remove_correlated_features_real(data, target_stat)

            # Update stats
            self._processing_stats["features_created"] = (
                data.shape[1] - original_shape[1]
            )

            logger.info(
                "✅ Feature engineering complete for %s: %s", target_stat, data.shape
            )
            return data

        except (ValueError, KeyError, RuntimeError) as e:
            logger.error("❌ Feature engineering failed for %s: %s", target_stat, e)
            raise

    # Optimized Helper Methods

    def _calculate_trend_vectorized(self, grouped_series, window: int) -> pd.Series:
        """Vectorized trend calculation"""

        def slope_vectorized(y):
            if len(y) < FeatureConstants.MIN_TREND_PERIODS:
                return 0.0
            x = np.arange(len(y))
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                return np.polyfit(x, y, 1)[0] if not np.isnan(y).all() else 0.0

        return (
            grouped_series.rolling(
                window=window, min_periods=FeatureConstants.MIN_TREND_PERIODS
            )
            .apply(slope_vectorized, raw=False)
            .reset_index(level=0, drop=True)
        )

    def _add_momentum_features_optimized(
        self, data: pd.DataFrame, feature_cols: List[str]
    ) -> pd.DataFrame:
        """Optimized momentum indicators with flexible window detection"""
        momentum_features = {}

        # Get available windows from the configuration
        available_windows = sorted(self.config.rolling_window_sizes)

        # Ensure we have at least 2 windows for momentum calculation
        if len(available_windows) < 2:
            logger.warning("Need at least 2 rolling windows for momentum features")
            return data

        # Use the shortest and longest available windows for momentum
        short_window = available_windows[0]
        long_window = available_windows[-1]

        # Ensure we have at least some features to work with
        available_cols = min(
            len(feature_cols), FeatureConstants.MAX_FEATURES_FOR_MOMENTUM
        )

        for i, col in enumerate(feature_cols[:available_cols]):
            short_col = f"{col}_roll_{short_window}"
            long_col = f"{col}_roll_{long_window}"

            if short_col in data.columns and long_col in data.columns:
                # Vectorized momentum calculation with improved error handling
                with warnings.catch_warnings():
                    warnings.simplefilter("ignore")
                    momentum_values = (
                        data[short_col] / (data[long_col] + FeatureConstants.EPSILON)
                        - 1
                    )

                    # Apply memory optimization
                    if self.config.use_float32:
                        momentum_values = momentum_values.astype(np.float32)

                    momentum_features[f"{col}_momentum"] = momentum_values

        # Add momentum features efficiently
        if momentum_features:
            momentum_df = pd.DataFrame(momentum_features, index=data.index)
            data = pd.concat([data, momentum_df], axis=1)
            logger.info(
                "Created %d momentum features using windows %d and %d",
                len(momentum_features),
                short_window,
                long_window,
            )
        else:
            logger.warning(
                "No momentum features created - check rolling window configuration"
            )

        return data

    def _add_comparison_features_optimized(
        self, data: pd.DataFrame, player_id_col: str, feature_cols: List[str]
    ) -> pd.DataFrame:
        """Optimized career comparison features with batch operations and flexible windows"""
        # Efficient career averages calculation
        selected_cols = feature_cols[: FeatureConstants.MAX_FEATURES_FOR_COMPARISON]
        career_avgs = data.groupby(player_id_col)[selected_cols].mean()
        career_avgs.columns = [f"{col}_career_avg" for col in career_avgs.columns]

        # Merge efficiently
        data = data.merge(
            career_avgs, left_on=player_id_col, right_index=True, how="left"
        )

        # Use a flexible window for comparison (middle window if available)
        available_windows = sorted(self.config.rolling_window_sizes)
        comparison_window = (
            available_windows[len(available_windows) // 2] if available_windows else 20
        )

        # Batch vectorized comparisons to avoid DataFrame fragmentation
        comparison_features = {}
        for col in selected_cols:
            recent_col = f"{col}_roll_{comparison_window}"
            career_col = f"{col}_career_avg"

            if recent_col in data.columns and career_col in data.columns:
                with warnings.catch_warnings():
                    warnings.simplefilter("ignore")
                    comparison_values = (
                        data[recent_col] / (data[career_col] + FeatureConstants.EPSILON)
                        - 1
                    )

                    # Apply memory optimization
                    if self.config.use_float32:
                        comparison_values = comparison_values.astype(np.float32)

                    comparison_features[f"{col}_vs_career"] = comparison_values

        # Add comparison features efficiently
        if comparison_features:
            comparison_df = pd.DataFrame(comparison_features, index=data.index)
            data = pd.concat([data, comparison_df], axis=1)
            logger.info(
                "Created %d comparison features using window %d",
                len(comparison_features),
                comparison_window,
            )

        return data

    def _calculate_optimal_contact_score_vectorized(
        self, data: pd.DataFrame
    ) -> pd.Series:
        """Vectorized optimal contact score calculation"""
        if all(
            col in data.columns for col in ["avg_exit_velocity", "avg_launch_angle"]
        ):
            ev = data["avg_exit_velocity"]
            la = data["avg_launch_angle"]

            # Vectorized optimal launch angle calculation
            optimal_la = (
                FeatureConstants.OPTIMAL_LA_BASE
                + (ev - FeatureConstants.OPTIMAL_EV_BASE)
                * FeatureConstants.EV_LA_SCALING
            )
            la_deviation = np.abs(la - optimal_la)

            return ev * np.exp(-la_deviation / FeatureConstants.LA_DEVIATION_FACTOR)

        return pd.Series(0, index=data.index)

    @lru_cache(maxsize=1)
    def _get_ballpark_factors(self) -> Dict[str, Dict[str, float]]:
        """Cached ballpark factors"""
        return {
            "hr_factor": {
                "NYY": 1.15,
                "BOS": 1.05,
                "TEX": 1.20,
                "COL": 1.25,
                "OAK": 0.85,
                "SEA": 0.90,
                "MIA": 0.85,
                "HOU": 1.10,
                "LAD": 0.95,
                "SF": 0.90,
                "ATL": 1.05,
                "WSN": 0.95,
            },
            "hit_factor": {
                "NYY": 1.02,
                "BOS": 1.01,
                "TEX": 1.05,
                "COL": 1.10,
                "OAK": 0.98,
                "SEA": 0.99,
                "MIA": 0.97,
                "HOU": 1.03,
                "LAD": 0.99,
                "SF": 0.97,
                "ATL": 1.02,
                "WSN": 0.98,
            },
        }

    def _calculate_age_factor_vectorized(self, ages: pd.Series) -> pd.Series:
        """Vectorized age factor calculation"""
        return 1.0 + FeatureConstants.AGE_PEAK_BONUS * np.exp(
            -((ages - FeatureConstants.PEAK_AGE) ** 2)
            / FeatureConstants.AGE_CURVE_VARIANCE
        )

    def _calculate_team_context_optimized(self, data: pd.DataFrame) -> pd.DataFrame:
        """Optimized team context calculation"""
        agg_dict = {}
        if "avg_exit_velocity" in data.columns:
            agg_dict["avg_exit_velocity"] = "mean"
        if "barrel_rate" in data.columns:
            agg_dict["barrel_rate"] = "mean"

        if not agg_dict:
            return pd.DataFrame({"team": data["team"].unique()})

        team_stats = data.groupby("team").agg(agg_dict).reset_index()

        # Rename columns
        rename_dict = {"team": "team"}
        if "avg_exit_velocity" in agg_dict:
            rename_dict["avg_exit_velocity"] = "team_avg_ev"
        if "barrel_rate" in agg_dict:
            rename_dict["barrel_rate"] = "team_barrel_rate"

        team_stats = team_stats.rename(columns=rename_dict)
        return team_stats

    # Target-Specific Feature Methods (Vectorized)

    def _create_power_composite_vectorized(self, data: pd.DataFrame) -> pd.Series:
        """Vectorized power composite score"""
        power_score = pd.Series(0.0, index=data.index)

        if "max_exit_velocity" in data.columns:
            power_score += (
                data["max_exit_velocity"] - FeatureConstants.OPTIMAL_EV_BASE
            ) * 0.1
        if "barrel_rate" in data.columns:
            power_score += data["barrel_rate"] * 10
        if "fly_ball_rate" in data.columns:
            power_score += data["fly_ball_rate"] * 2

        return power_score

    def _optimize_launch_angle_for_hrs_vectorized(
        self, data: pd.DataFrame
    ) -> pd.Series:
        """Vectorized HR-optimal launch angle score"""
        if "avg_launch_angle" in data.columns:
            la = data["avg_launch_angle"]

            # Distance from optimal range (vectorized)
            distance = np.where(
                la < FeatureConstants.HR_OPTIMAL_LA_MIN,
                FeatureConstants.HR_OPTIMAL_LA_MIN - la,
                np.where(
                    la > FeatureConstants.HR_OPTIMAL_LA_MAX,
                    la - FeatureConstants.HR_OPTIMAL_LA_MAX,
                    0,
                ),
            )

            return 1.0 / (1.0 + distance / FeatureConstants.DISTANCE_PENALTY_FACTOR)

        return pd.Series(1.0, index=data.index)

    def _create_whiff_composite_vectorized(self, data: pd.DataFrame) -> pd.Series:
        """Vectorized whiff composite score"""
        whiff_score = pd.Series(0.0, index=data.index)

        if "whiff_rate" in data.columns:
            whiff_score += data["whiff_rate"] * 10
        if "avg_spin_rate" in data.columns:
            whiff_score += (data["avg_spin_rate"] - 2200) / 200

        return whiff_score

    def _create_eye_score_vectorized(self, data: pd.DataFrame) -> pd.Series:
        """Vectorized plate discipline score for walks"""
        eye_score = pd.Series(0.0, index=data.index)

        if "chase_rate" in data.columns:
            eye_score += (0.3 - data["chase_rate"]) * 10  # Lower chase = better eye
        if "contact_rate" in data.columns:
            eye_score += data["contact_rate"] * 5

        return eye_score

    def _create_contact_suppression_vectorized(self, data: pd.DataFrame) -> pd.Series:
        """Vectorized contact suppression score"""
        contact_sup = pd.Series(0.0, index=data.index)

        if "whiff_rate" in data.columns:
            contact_sup += data["whiff_rate"] * 5
        if "avg_velocity" in data.columns:
            contact_sup += (
                data["avg_velocity"] - FeatureConstants.OPTIMAL_EV_BASE
            ) * 0.2

        return contact_sup

    # Real Feature Processing Methods

    def _apply_feature_selection_real(
        self, data: pd.DataFrame, target_stat: str
    ) -> pd.DataFrame:
        """Real feature selection implementation using sklearn"""
        if target_stat not in data.columns:
            logger.warning(
                "Target stat '%s' not found in data. Skipping feature selection.",
                target_stat,
            )
            return data

        # Get numeric features for selection
        numeric_cols = data.select_dtypes(include=[np.number]).columns.tolist()
        feature_cols = [col for col in numeric_cols if col != target_stat]

        if len(feature_cols) <= self.config.feature_selection_k:
            return data

        try:
            # Prepare data for feature selection
            X = data[feature_cols].fillna(0)
            y = data[target_stat].fillna(0)

            # Choose selection method
            if self.config.feature_selection_method == "mutual_info":
                selector = SelectKBest(
                    score_func=mutual_info_regression, k=self.config.feature_selection_k
                )
            else:
                selector = SelectKBest(
                    score_func=f_regression, k=self.config.feature_selection_k
                )

            # Fit and transform
            selector.fit(X, y)
            selected_features = [
                feature_cols[i] for i in selector.get_support(indices=True)
            ]

            # Store selector for future use
            self.feature_selectors[target_stat] = selector

            # Return data with selected features plus non-numeric columns
            non_numeric_cols = data.select_dtypes(exclude=[np.number]).columns.tolist()
            selected_cols = non_numeric_cols + selected_features + [target_stat]

            logger.info(
                "Feature selection: %d -> %d features",
                len(feature_cols),
                len(selected_features),
            )
            return data[selected_cols]

        except (ValueError, KeyError) as e:
            logger.warning("Feature selection failed: %s. Returning original data.", e)
            return data

    def _apply_scaling_real(self, data: pd.DataFrame, target_stat: str) -> pd.DataFrame:
        """Real scaling implementation using sklearn"""
        # Get numeric columns to scale (excluding target)
        numeric_cols = data.select_dtypes(include=[np.number]).columns.tolist()
        feature_cols = [col for col in numeric_cols if col != target_stat]

        if not feature_cols:
            return data

        try:
            # Use RobustScaler for better handling of outliers
            if target_stat not in self.scalers:
                self.scalers[target_stat] = RobustScaler()

            scaler = self.scalers[target_stat]

            # Fit and transform features
            data_scaled = data.copy()
            scaled_features = scaler.fit_transform(data[feature_cols].fillna(0))

            # Update the dataframe
            for i, col in enumerate(feature_cols):
                data_scaled[col] = scaled_features[:, i]

            logger.info("Scaled %d features using RobustScaler", len(feature_cols))
            return data_scaled

        except (ValueError, KeyError) as e:
            logger.warning("Scaling failed: %s. Returning original data.", e)
            return data

    def _remove_correlated_features_real(
        self, data: pd.DataFrame, target_stat: Optional[str] = None
    ) -> pd.DataFrame:
        """Real correlation-based feature removal with target column preservation"""
        # Get numeric columns
        numeric_cols = data.select_dtypes(include=[np.number]).columns.tolist()

        if len(numeric_cols) < 2:
            return data

        try:
            # Calculate correlation matrix
            corr_matrix = data[numeric_cols].corr().abs()

            # Find highly correlated feature pairs
            upper_triangle = corr_matrix.where(
                np.triu(np.ones(corr_matrix.shape), k=1).astype(bool)
            )

            # Find features to drop
            to_drop = [
                column
                for column in upper_triangle.columns
                if any(upper_triangle[column] > self.config.correlation_threshold)
            ]

            # Preserve target columns if configured
            if (
                self.config.preserve_target_columns
                and target_stat
                and target_stat in to_drop
            ):
                to_drop.remove(target_stat)
                logger.info(
                    "Preserved target column '%s' from correlation removal", target_stat
                )

            if to_drop:
                data_filtered = data.drop(columns=to_drop)
                self._processing_stats["features_removed"] = len(to_drop)
                logger.info("Removed %d highly correlated features", len(to_drop))
                return data_filtered
            else:
                logger.info("No highly correlated features found")
                return data

        except (ValueError, KeyError) as e:
            logger.warning(
                "Correlation removal failed: %s. Returning original data.", e
            )
            return data

    def get_processing_stats(self) -> Dict[str, Any]:
        """Get processing statistics"""
        return self._processing_stats.copy()

    def reset_stats(self) -> None:
        """Reset processing statistics"""
        self._processing_stats = {
            "features_created": 0,
            "features_removed": 0,
            "processing_time": 0.0,
        }


# Optimized Usage Example
if __name__ == "__main__":
    import time

    # Performance-optimized configuration
    config = FeatureConfig(
        rolling_window_sizes=[10, 20, 30],  # Reduced for testing
        feature_selection_k=30,
        enable_feature_selection=True,
        enable_scaling=True,
        use_float32=True,
    )

    feature_engine = AdvancedFeatureEngine(config)

    # Create test data
    np.random.seed(42)
    n_samples = 1000
    mock_data = pd.DataFrame(
        {
            "player_id": np.repeat(range(50), 20),
            "avg_exit_velocity": np.random.normal(90, 5, n_samples),
            "avg_launch_angle": np.random.normal(15, 8, n_samples),
            "barrel_rate": np.random.uniform(0.05, 0.15, n_samples),
            "contact_rate": np.random.uniform(0.7, 0.9, n_samples),
            "whiff_rate": np.random.uniform(0.15, 0.35, n_samples),
            "game_date": pd.date_range("2024-01-01", periods=n_samples),
            "team": np.random.choice(["NYY", "BOS", "LAD", "HOU"], n_samples),
            "age": np.random.randint(22, 35, n_samples),
            "home_runs": np.random.poisson(2, n_samples),  # Target variable
        }
    )

    # Performance test
    start_time = time.time()
    enhanced_features = feature_engine.engineer_features_for_stat(
        mock_data, "home_runs"
    )
    processing_time = time.time() - start_time

    # Results
    print("\n🏆 Optimization Results:")
    print(f"📊 Input shape: {mock_data.shape}")
    print(f"📈 Output shape: {enhanced_features.shape}")
    print(f"⚡ Processing time: {processing_time:.2f}s")
    print(
        f"🔧 Features created: {feature_engine.get_processing_stats()['features_created']}"
    )
    print(
        f"🗑️ Features removed: {feature_engine.get_processing_stats()['features_removed']}"
    )
    print(f"✨ New feature columns: {enhanced_features.shape[1] - mock_data.shape[1]}")

    # Sample new features
    new_cols = set(enhanced_features.columns) - set(mock_data.columns)
    print(f"\n🎯 Sample new features: {list(new_cols)[:10]}")
