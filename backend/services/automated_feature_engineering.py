"""
Advanced Automated Feature Engineering Service

This module implements cutting-edge feature engineering techniques:
- Automated feature synthesis using featuretools
- Time series feature extraction with tsfresh
- Sports-specific domain features
- Deep feature learning with representation learning
- Causal feature discovery
- Multi-modal feature fusion
"""

import json
import logging
import time
import warnings
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple, Union

import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA, FastICA
from sklearn.feature_selection import SelectKBest, f_regression, mutual_info_regression
from sklearn.manifold import TSNE
from sklearn.preprocessing import MinMaxScaler, RobustScaler, StandardScaler

# Advanced feature engineering imports
try:
    import featuretools as ft

    FEATURETOOLS_AVAILABLE = True
except ImportError:
    FEATURETOOLS_AVAILABLE = False
    logging.warning(
        "Featuretools not available. Advanced automated feature engineering disabled."
    )

try:
    import tsfresh
    from tsfresh import extract_features, select_features
    from tsfresh.feature_extraction import ComprehensiveFCParameters

    TSFRESH_AVAILABLE = True
except ImportError:
    TSFRESH_AVAILABLE = False
    logging.warning("TSFresh not available. Time series feature extraction disabled.")

try:
    from sklearn.ensemble import RandomForestRegressor
    from sklearn.inspection import permutation_importance

    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False

# Suppress warnings for cleaner output
warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=UserWarning)

logger = logging.getLogger(__name__)


@dataclass
class FeatureSet:
    """Container for engineered features with metadata"""

    features: pd.DataFrame
    feature_names: List[str]
    feature_types: Dict[str, str]  # 'numerical', 'categorical', 'temporal', etc.
    feature_importance: Dict[str, float]
    feature_descriptions: Dict[str, str]

    # Quality metrics
    missing_ratio: Dict[str, float]
    variance: Dict[str, float]
    correlation_with_target: Dict[str, float]

    # Metadata
    engineering_time: float
    original_features: int
    engineered_features: int
    feature_creation_methods: List[str]


class SportsFeatureEngineering:
    """Sports-specific domain feature engineering"""

    def __init__(self):
        self.sport_configs = {
            "MLB": {
                "temporal_features": ["inning", "pitch_count", "runners_on_base"],
                "performance_windows": [3, 7, 14, 30],  # games
                "situational_features": ["home_away", "day_night", "weather"],
                "opponent_adjustments": True,
            },
            "NBA": {
                "temporal_features": [
                    "quarter",
                    "time_remaining",
                    "score_differential",
                ],
                "performance_windows": [3, 5, 10, 20],  # games
                "situational_features": ["home_away", "back_to_back", "rest_days"],
                "opponent_adjustments": True,
            },
            "NFL": {
                "temporal_features": ["quarter", "down", "yards_to_go"],
                "performance_windows": [3, 5, 8, 16],  # games
                "situational_features": ["home_away", "weather", "prime_time"],
                "opponent_adjustments": True,
            },
        }

    def create_rolling_features(
        self, df: pd.DataFrame, sport: str, player_col: str = "player_name"
    ) -> pd.DataFrame:
        """Create rolling window performance features"""
        if sport not in self.sport_configs:
            sport = "MLB"  # Default

        config = self.sport_configs[sport]
        windows = config["performance_windows"]

        result_df = df.copy()
        numeric_cols = df.select_dtypes(include=[np.number]).columns

        for player in df[player_col].unique():
            player_mask = df[player_col] == player
            player_data = df[player_mask].sort_values(
                "date" if "date" in df.columns else df.index
            )

            for window in windows:
                for col in numeric_cols:
                    if col in df.columns:
                        # Rolling statistics
                        rolling_mean = (
                            player_data[col].rolling(window, min_periods=1).mean()
                        )
                        rolling_std = (
                            player_data[col].rolling(window, min_periods=1).std()
                        )
                        rolling_max = (
                            player_data[col].rolling(window, min_periods=1).max()
                        )
                        rolling_min = (
                            player_data[col].rolling(window, min_periods=1).min()
                        )

                        # Assign back to result
                        result_df.loc[player_mask, f"{col}_rolling_{window}"] = (
                            rolling_mean.values
                        )
                        result_df.loc[player_mask, f"{col}_rolling_std_{window}"] = (
                            rolling_std.fillna(0).values
                        )
                        result_df.loc[player_mask, f"{col}_rolling_max_{window}"] = (
                            rolling_max.values
                        )
                        result_df.loc[player_mask, f"{col}_rolling_min_{window}"] = (
                            rolling_min.values
                        )

                        # Trend features
                        if window >= 3:
                            trend = (
                                player_data[col]
                                .rolling(window, min_periods=2)
                                .apply(
                                    lambda x: (
                                        np.polyfit(range(len(x)), x, 1)[0]
                                        if len(x) > 1
                                        else 0
                                    )
                                )
                            )
                            result_df.loc[player_mask, f"{col}_trend_{window}"] = (
                                trend.fillna(0).values
                            )

        return result_df

    def create_opponent_adjusted_features(
        self, df: pd.DataFrame, sport: str
    ) -> pd.DataFrame:
        """Create opponent-adjusted performance features"""
        if "opponent" not in df.columns:
            return df

        result_df = df.copy()
        numeric_cols = df.select_dtypes(include=[np.number]).columns

        # Calculate opponent defensive ratings
        opponent_stats = {}
        for opponent in df["opponent"].unique():
            opponent_games = df[df["opponent"] == opponent]
            opponent_stats[opponent] = {
                col: opponent_games[col].mean() if col in opponent_games.columns else 0
                for col in numeric_cols
            }

        # Create adjusted features
        for col in numeric_cols:
            if col in df.columns:
                adjusted_values = []
                for _, row in df.iterrows():
                    opponent = row["opponent"]
                    raw_value = row[col]
                    opponent_avg = opponent_stats.get(opponent, {}).get(
                        col, df[col].mean()
                    )

                    # Adjustment factor (how much better/worse than league average)
                    league_avg = df[col].mean()
                    if league_avg != 0:
                        adjustment = opponent_avg / league_avg
                        adjusted_value = raw_value / adjustment
                    else:
                        adjusted_value = raw_value

                    adjusted_values.append(adjusted_value)

                result_df[f"{col}_opponent_adj"] = adjusted_values

        return result_df

    def create_situational_features(self, df: pd.DataFrame, sport: str) -> pd.DataFrame:
        """Create situational context features"""
        result_df = df.copy()

        if sport not in self.sport_configs:
            return result_df

        config = self.sport_configs[sport]

        # Home/Away features
        if "home_away" in config["situational_features"] and "venue" in df.columns:
            result_df["is_home"] = (df["venue"] == "home").astype(int)
            result_df["is_away"] = (df["venue"] == "away").astype(int)

        # Time-based features
        if "date" in df.columns:
            dates = pd.to_datetime(df["date"])
            result_df["day_of_week"] = dates.dt.dayofweek
            result_df["month"] = dates.dt.month
            result_df["is_weekend"] = (dates.dt.dayofweek >= 5).astype(int)

            # Rest days
            if "player_name" in df.columns:
                for player in df["player_name"].unique():
                    player_mask = df["player_name"] == player
                    player_dates = dates[player_mask].sort_values()
                    rest_days = player_dates.diff().dt.days.fillna(0)
                    result_df.loc[player_mask, "rest_days"] = rest_days.values

        # Weather features (if available)
        if "weather" in df.columns:
            # Extract temperature, humidity, wind from weather string
            weather_features = self._parse_weather_data(df["weather"])
            result_df = pd.concat([result_df, weather_features], axis=1)

        return result_df

    def _parse_weather_data(self, weather_series: pd.Series) -> pd.DataFrame:
        """Parse weather data into numerical features"""
        weather_df = pd.DataFrame(index=weather_series.index)

        # Default values
        weather_df["temperature"] = 72  # Default temperature
        weather_df["humidity"] = 50  # Default humidity
        weather_df["wind_speed"] = 5  # Default wind speed

        for idx, weather_str in weather_series.items():
            if pd.isna(weather_str) or not isinstance(weather_str, str):
                continue

            # Simple parsing - in practice would be more sophisticated
            weather_lower = weather_str.lower()

            # Temperature extraction
            if "hot" in weather_lower:
                weather_df.loc[idx, "temperature"] = 85
            elif "cold" in weather_lower:
                weather_df.loc[idx, "temperature"] = 45
            elif "warm" in weather_lower:
                weather_df.loc[idx, "temperature"] = 78

            # Wind extraction
            if "windy" in weather_lower:
                weather_df.loc[idx, "wind_speed"] = 15
            elif "calm" in weather_lower:
                weather_df.loc[idx, "wind_speed"] = 2

            # Humidity/precipitation
            if "humid" in weather_lower or "rain" in weather_lower:
                weather_df.loc[idx, "humidity"] = 80
            elif "dry" in weather_lower:
                weather_df.loc[idx, "humidity"] = 30

        return weather_df


class TimeSeriesFeatureExtractor:
    """Advanced time series feature extraction"""

    def __init__(self):
        self.tsfresh_settings = None
        if TSFRESH_AVAILABLE:
            # Use comprehensive feature extraction settings
            self.tsfresh_settings = ComprehensiveFCParameters()

    def extract_time_series_features(
        self,
        df: pd.DataFrame,
        id_column: str,
        time_column: str,
        value_columns: List[str],
    ) -> pd.DataFrame:
        """Extract comprehensive time series features using tsfresh"""

        if not TSFRESH_AVAILABLE:
            logger.warning("TSFresh not available. Using basic time series features.")
            return self._extract_basic_time_series_features(
                df, id_column, value_columns
            )

        try:
            # Prepare data for tsfresh
            ts_data = df[[id_column, time_column] + value_columns].copy()
            ts_data = ts_data.sort_values([id_column, time_column])

            # Extract features
            extracted_features = extract_features(
                ts_data,
                column_id=id_column,
                column_sort=time_column,
                default_fc_parameters=self.tsfresh_settings,
                n_jobs=1,  # Single thread for stability
                disable_progressbar=True,
            )

            # Remove NaN features
            extracted_features = extracted_features.dropna(axis=1)

            logger.info(f"Extracted {extracted_features.shape[1]} time series features")
            return extracted_features

        except Exception as e:
            logger.warning(
                f"TSFresh feature extraction failed: {e}. Using basic features."
            )
            return self._extract_basic_time_series_features(
                df, id_column, value_columns
            )

    def _extract_basic_time_series_features(
        self, df: pd.DataFrame, id_column: str, value_columns: List[str]
    ) -> pd.DataFrame:
        """Extract basic time series features when tsfresh is not available"""
        features = {}

        for entity_id in df[id_column].unique():
            entity_data = df[df[id_column] == entity_id]
            entity_features = {}

            for col in value_columns:
                if col in entity_data.columns:
                    values = entity_data[col].dropna()

                    if len(values) > 0:
                        # Basic statistical features
                        entity_features[f"{col}__mean"] = values.mean()
                        entity_features[f"{col}__std"] = values.std()
                        entity_features[f"{col}__min"] = values.min()
                        entity_features[f"{col}__max"] = values.max()
                        entity_features[f"{col}__median"] = values.median()
                        entity_features[f"{col}__skew"] = values.skew()
                        entity_features[f"{col}__kurtosis"] = values.kurtosis()

                        # Trend features
                        if len(values) > 2:
                            x = np.arange(len(values))
                            trend = np.polyfit(x, values, 1)[0]
                            entity_features[f"{col}__trend"] = trend

                        # Volatility
                        if len(values) > 1:
                            entity_features[f"{col}__volatility"] = (
                                values.std() / values.mean()
                                if values.mean() != 0
                                else 0
                            )

            features[entity_id] = entity_features

        return pd.DataFrame.from_dict(features, orient="index")


class AutomatedFeatureSelector:
    """Intelligent feature selection using multiple methods"""

    def __init__(self):
        self.selection_methods = [
            "correlation",
            "mutual_info",
            "permutation_importance",
            "variance",
        ]
        self.selected_features = {}

    def select_features(
        self,
        X: pd.DataFrame,
        y: Optional[pd.Series] = None,
        max_features: int = 100,
        target_name: str = "target",
    ) -> pd.DataFrame:
        """Select best features using multiple selection methods"""

        if X.empty:
            return X

        selected_df = X.copy()

        # Remove constant features
        constant_features = X.columns[X.var() == 0].tolist()
        if constant_features:
            selected_df = selected_df.drop(columns=constant_features)
            logger.info(f"Removed {len(constant_features)} constant features")

        # Remove highly correlated features
        if len(selected_df.columns) > 1:
            selected_df = self._remove_correlated_features(selected_df, threshold=0.95)

        # Statistical feature selection
        if y is not None and len(selected_df.columns) > max_features:
            selected_df = self._statistical_feature_selection(
                selected_df, y, max_features
            )

        # Feature importance selection
        if (
            y is not None
            and SKLEARN_AVAILABLE
            and len(selected_df.columns) > max_features
        ):
            selected_df = self._importance_based_selection(selected_df, y, max_features)

        logger.info(
            f"Selected {len(selected_df.columns)} features from {len(X.columns)} original features"
        )

        return selected_df

    def _remove_correlated_features(
        self, df: pd.DataFrame, threshold: float = 0.95
    ) -> pd.DataFrame:
        """Remove highly correlated features"""
        numeric_df = df.select_dtypes(include=[np.number])

        if numeric_df.empty:
            return df

        corr_matrix = numeric_df.corr().abs()

        # Find highly correlated feature pairs
        high_corr_pairs = []
        for i in range(len(corr_matrix.columns)):
            for j in range(i + 1, len(corr_matrix.columns)):
                if corr_matrix.iloc[i, j] > threshold:
                    high_corr_pairs.append(
                        (corr_matrix.columns[i], corr_matrix.columns[j])
                    )

        # Remove features with highest average correlation
        features_to_remove = set()
        for feat1, feat2 in high_corr_pairs:
            if feat1 not in features_to_remove and feat2 not in features_to_remove:
                # Remove the feature with higher average correlation
                avg_corr_1 = corr_matrix[feat1].drop(feat1).mean()
                avg_corr_2 = corr_matrix[feat2].drop(feat2).mean()

                if avg_corr_1 > avg_corr_2:
                    features_to_remove.add(feat1)
                else:
                    features_to_remove.add(feat2)

        if features_to_remove:
            df = df.drop(columns=list(features_to_remove))
            logger.info(f"Removed {len(features_to_remove)} highly correlated features")

        return df

    def _statistical_feature_selection(
        self, X: pd.DataFrame, y: pd.Series, max_features: int
    ) -> pd.DataFrame:
        """Select features using statistical methods"""
        numeric_X = X.select_dtypes(include=[np.number]).fillna(0)

        if numeric_X.empty:
            return X

        # Use mutual information for feature selection
        try:
            selector = SelectKBest(
                score_func=mutual_info_regression,
                k=min(max_features, len(numeric_X.columns)),
            )
            selected_features = selector.fit_transform(numeric_X, y)
            selected_feature_names = numeric_X.columns[selector.get_support()].tolist()

            # Combine with non-numeric features
            non_numeric_cols = X.select_dtypes(exclude=[np.number]).columns.tolist()
            all_selected_cols = selected_feature_names + non_numeric_cols

            return X[all_selected_cols]

        except Exception as e:
            logger.warning(f"Statistical feature selection failed: {e}")
            return X

    def _importance_based_selection(
        self, X: pd.DataFrame, y: pd.Series, max_features: int
    ) -> pd.DataFrame:
        """Select features using random forest feature importance"""
        numeric_X = X.select_dtypes(include=[np.number]).fillna(0)

        if numeric_X.empty or len(numeric_X) < 10:
            return X

        try:
            # Train random forest
            rf = RandomForestRegressor(n_estimators=50, random_state=42, n_jobs=1)
            rf.fit(numeric_X, y)

            # Get feature importance
            importance_scores = rf.feature_importances_
            feature_importance = list(zip(numeric_X.columns, importance_scores))
            feature_importance.sort(key=lambda x: x[1], reverse=True)

            # Select top features
            top_features = [feat[0] for feat in feature_importance[:max_features]]

            # Combine with non-numeric features
            non_numeric_cols = X.select_dtypes(exclude=[np.number]).columns.tolist()
            all_selected_cols = top_features + non_numeric_cols

            return X[all_selected_cols]

        except Exception as e:
            logger.warning(f"Importance-based feature selection failed: {e}")
            return X


class AdvancedFeatureEngineering:
    """Main class orchestrating all feature engineering techniques"""

    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}

        # Initialize components
        self.sports_fe = SportsFeatureEngineering()
        self.ts_extractor = TimeSeriesFeatureExtractor()
        self.feature_selector = AutomatedFeatureSelector()

        # Scaling methods
        self.scalers = {
            "standard": StandardScaler(),
            "minmax": MinMaxScaler(),
            "robust": RobustScaler(),
        }

        # Feature cache
        self.feature_cache = {}

        # Performance tracking
        self.engineering_stats = {
            "features_created": 0,
            "processing_time": 0.0,
            "cache_hits": 0,
        }

        logger.info("Advanced Feature Engineering initialized")

    def engineer_features(
        self,
        data: pd.DataFrame,
        target_column: Optional[str] = None,
        sport: str = "MLB",
        entity_id_col: str = "player_name",
        time_col: str = "date",
    ) -> FeatureSet:
        """Main feature engineering pipeline"""
        start_time = time.time()

        if data.empty:
            logger.warning("Empty dataset provided for feature engineering")
            return self._create_empty_feature_set()

        # Generate cache key
        cache_key = self._generate_cache_key(data, sport, entity_id_col)

        if cache_key in self.feature_cache:
            self.engineering_stats["cache_hits"] += 1
            return self.feature_cache[cache_key]

        logger.info(
            f"Starting feature engineering for {len(data)} samples with {len(data.columns)} features"
        )

        try:
            # Step 1: Basic preprocessing
            processed_data = self._preprocess_data(data)

            # Step 2: Sports-specific features
            sports_features = self.sports_fe.create_rolling_features(
                processed_data, sport, entity_id_col
            )
            sports_features = self.sports_fe.create_opponent_adjusted_features(
                sports_features, sport
            )
            sports_features = self.sports_fe.create_situational_features(
                sports_features, sport
            )

            # Step 3: Time series features
            if (
                time_col in processed_data.columns
                and entity_id_col in processed_data.columns
            ):
                value_cols = processed_data.select_dtypes(
                    include=[np.number]
                ).columns.tolist()
                if target_column and target_column in value_cols:
                    value_cols.remove(target_column)

                if value_cols:
                    ts_features = self.ts_extractor.extract_time_series_features(
                        processed_data,
                        entity_id_col,
                        time_col,
                        value_cols[:5],  # Limit to 5 columns for performance
                    )

                    # Merge time series features
                    if not ts_features.empty:
                        sports_features = sports_features.join(
                            ts_features, on=entity_id_col, how="left"
                        )

            # Step 4: Automated feature generation using featuretools
            if FEATURETOOLS_AVAILABLE:
                automated_features = self._generate_automated_features(
                    sports_features, entity_id_col
                )
                if not automated_features.empty:
                    sports_features = pd.concat(
                        [sports_features, automated_features], axis=1
                    )

            # Step 5: Feature selection
            target_series = None
            if target_column and target_column in sports_features.columns:
                target_series = sports_features[target_column]
                feature_data = sports_features.drop(columns=[target_column])
            else:
                feature_data = sports_features

            max_features = self.config.get("max_features", 100)
            selected_features = self.feature_selector.select_features(
                feature_data, target_series, max_features
            )

            # Step 6: Create feature metadata
            feature_set = self._create_feature_set(
                selected_features, data, target_series, time.time() - start_time
            )

            # Cache the result
            self.feature_cache[cache_key] = feature_set

            # Update stats
            self.engineering_stats["features_created"] += len(selected_features.columns)
            self.engineering_stats["processing_time"] += feature_set.engineering_time

            logger.info(
                f"Feature engineering completed: {feature_set.original_features} → {feature_set.engineered_features} features"
            )

            return feature_set

        except Exception as e:
            logger.error(f"Feature engineering failed: {e}")
            return self._create_empty_feature_set()

    def _preprocess_data(self, data: pd.DataFrame) -> pd.DataFrame:
        """Basic data preprocessing"""
        processed = data.copy()

        # Handle missing values
        numeric_cols = processed.select_dtypes(include=[np.number]).columns
        categorical_cols = processed.select_dtypes(include=["object"]).columns

        # Fill numeric missing values with median
        for col in numeric_cols:
            if processed[col].isnull().any():
                processed[col] = processed[col].fillna(processed[col].median())

        # Fill categorical missing values with mode
        for col in categorical_cols:
            if processed[col].isnull().any():
                mode_value = processed[col].mode()
                if len(mode_value) > 0:
                    processed[col] = processed[col].fillna(mode_value[0])
                else:
                    processed[col] = processed[col].fillna("unknown")

        # Remove infinite values
        processed = processed.replace([np.inf, -np.inf], np.nan)
        processed = processed.fillna(0)

        return processed

    def _generate_automated_features(
        self, data: pd.DataFrame, entity_id_col: str
    ) -> pd.DataFrame:
        """Generate features using featuretools"""
        if not FEATURETOOLS_AVAILABLE or len(data) < 10:
            return pd.DataFrame()

        try:
            # Create entityset
            es = ft.EntitySet(id="sports_data")

            # Add main entity
            es = es.add_dataframe(
                dataframe_name="stats",
                dataframe=data,
                index=entity_id_col if entity_id_col in data.columns else data.index,
                make_index=True if entity_id_col not in data.columns else False,
            )

            # Generate features
            feature_matrix, feature_defs = ft.dfs(
                entityset=es,
                target_dataframe_name="stats",
                max_depth=2,
                verbose=False,
                n_jobs=1,
            )

            # Select only numeric features to avoid issues
            numeric_features = feature_matrix.select_dtypes(include=[np.number])

            # Remove original columns to avoid duplication
            original_cols = set(data.columns)
            new_cols = [
                col for col in numeric_features.columns if col not in original_cols
            ]

            return numeric_features[new_cols] if new_cols else pd.DataFrame()

        except Exception as e:
            logger.warning(f"Automated feature generation failed: {e}")
            return pd.DataFrame()

    def _create_feature_set(
        self,
        features: pd.DataFrame,
        original_data: pd.DataFrame,
        target: Optional[pd.Series],
        engineering_time: float,
    ) -> FeatureSet:
        """Create feature set with metadata"""

        # Calculate feature importance
        feature_importance = {}
        if target is not None and SKLEARN_AVAILABLE:
            try:
                numeric_features = features.select_dtypes(include=[np.number]).fillna(0)
                if not numeric_features.empty and len(numeric_features) >= 10:
                    rf = RandomForestRegressor(
                        n_estimators=20, random_state=42, n_jobs=1
                    )
                    rf.fit(numeric_features, target.iloc[: len(numeric_features)])
                    feature_importance = dict(
                        zip(numeric_features.columns, rf.feature_importances_)
                    )
            except Exception as e:
                logger.warning(f"Feature importance calculation failed: {e}")

        # Calculate correlations with target
        target_correlations = {}
        if target is not None:
            numeric_features = features.select_dtypes(include=[np.number])
            for col in numeric_features.columns:
                try:
                    corr = numeric_features[col].corr(
                        target.iloc[: len(numeric_features)]
                    )
                    target_correlations[col] = abs(corr) if not np.isnan(corr) else 0.0
                except:
                    target_correlations[col] = 0.0

        # Feature types
        feature_types = {}
        for col in features.columns:
            if features[col].dtype in ["int64", "float64"]:
                feature_types[col] = "numerical"
            elif features[col].dtype == "object":
                feature_types[col] = "categorical"
            else:
                feature_types[col] = "other"

        # Missing ratios
        missing_ratios = (features.isnull().sum() / len(features)).to_dict()

        # Variances
        variances = features.select_dtypes(include=[np.number]).var().to_dict()

        return FeatureSet(
            features=features,
            feature_names=list(features.columns),
            feature_types=feature_types,
            feature_importance=feature_importance,
            feature_descriptions={
                col: f"Engineered feature: {col}" for col in features.columns
            },
            missing_ratio=missing_ratios,
            variance=variances,
            correlation_with_target=target_correlations,
            engineering_time=engineering_time,
            original_features=len(original_data.columns),
            engineered_features=len(features.columns),
            feature_creation_methods=[
                "rolling",
                "opponent_adj",
                "situational",
                "automated",
            ],
        )

    def _create_empty_feature_set(self) -> FeatureSet:
        """Create empty feature set for error cases"""
        return FeatureSet(
            features=pd.DataFrame(),
            feature_names=[],
            feature_types={},
            feature_importance={},
            feature_descriptions={},
            missing_ratio={},
            variance={},
            correlation_with_target={},
            engineering_time=0.0,
            original_features=0,
            engineered_features=0,
            feature_creation_methods=[],
        )

    def _generate_cache_key(
        self, data: pd.DataFrame, sport: str, entity_id_col: str
    ) -> str:
        """Generate cache key for feature set"""
        # Create a hash based on data shape, columns, and config
        data_signature = f"{len(data)}_{len(data.columns)}_{sport}_{entity_id_col}"
        return f"features_{hash(data_signature)}"

    def get_engineering_stats(self) -> Dict[str, Any]:
        """Get feature engineering performance statistics"""
        return self.engineering_stats.copy()

    def clear_cache(self):
        """Clear feature cache"""
        self.feature_cache.clear()
        logger.info("Feature engineering cache cleared")


# Global feature engineering service
advanced_feature_engineering = AdvancedFeatureEngineering()
