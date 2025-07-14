"""Advanced Feature Engineering Engine for Maximum Prediction Accuracy
State-of-the-art feature creation, selection, and transformation techniques
"""

import logging
import warnings
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd

warnings.filterwarnings("ignore")

import nltk
import ta  # Technical analysis library
from nltk.sentiment import SentimentIntensityAnalyzer
from scipy import stats
from scipy.fft import fft, fftfreq
from sklearn.cluster import DBSCAN, KMeans, SpectralClustering
from sklearn.mixture import GaussianMixture
from sklearn.covariance import EllipticEnvelope
from sklearn.decomposition import (
    PCA,
    FactorAnalysis,
    FastICA,
    KernelPCA,
    SparsePCA,
    TruncatedSVD,
)
from sklearn.ensemble import IsolationForest
from sklearn.feature_selection import (
    RFE,
    SelectKBest,
    SelectPercentile,
    VarianceThreshold,
    f_regression,
    mutual_info_regression,
)
from sklearn.neighbors import LocalOutlierFactor

# Advanced feature engineering imports
from sklearn.preprocessing import (
    MinMaxScaler,
    Normalizer,
    PolynomialFeatures,
    PowerTransformer,
    QuantileTransformer,
    RobustScaler,
    StandardScaler,
)

logger = logging.getLogger(__name__)


class FeatureEngineeringStrategy(str, Enum):
    """Advanced feature engineering strategies"""

    STATISTICAL_TRANSFORMATION = "statistical_transformation"
    TEMPORAL_PATTERNS = "temporal_patterns"
    INTERACTION_DISCOVERY = "interaction_discovery"
    DOMAIN_SPECIFIC = "domain_specific"
    AUTOMATED_DISCOVERY = "automated_discovery"
    DEEP_FEATURE_SYNTHESIS = "deep_feature_synthesis"
    POLYNOMIAL_EXPANSION = "polynomial_expansion"
    FREQUENCY_DOMAIN = "frequency_domain"
    GRAPH_FEATURES = "graph_features"
    SENTIMENT_FEATURES = "sentiment_features"
    ANOMALY_FEATURES = "anomaly_features"
    CLUSTERING_FEATURES = "clustering_features"
    DIMENSIONALITY_REDUCTION = "dimensionality_reduction"
    TECHNICAL_INDICATORS = "technical_indicators"


class FeatureImportanceMethod(str, Enum):
    """Feature importance calculation methods"""

    MUTUAL_INFORMATION = "mutual_information"
    F_REGRESSION = "f_regression"
    PERMUTATION_IMPORTANCE = "permutation_importance"
    SHAP_VALUES = "shap_values"
    RECURSIVE_ELIMINATION = "recursive_elimination"
    UNIVARIATE_SELECTION = "univariate_selection"
    L1_REGULARIZATION = "l1_regularization"
    TREE_IMPORTANCE = "tree_importance"
    CORRELATION_ANALYSIS = "correlation_analysis"


@dataclass
class AdvancedFeatureMetrics:
    """Comprehensive feature quality metrics"""

    feature_name: str
    importance_score: float
    stability_score: float
    correlation_with_target: float
    mutual_information: float
    variance_ratio: float
    outlier_resistance: float
    interpretability_score: float
    computation_cost: float
    redundancy_score: float
    predictive_power: float
    noise_ratio: float
    distribution_score: float
    temporal_consistency: float
    domain_relevance: float
    feature_interactions: List[str]
    created_timestamp: datetime
    last_updated: datetime


@dataclass
class FeatureSet:
    """Advanced feature set with comprehensive metadata"""

    features: Dict[str, Any]
    feature_metrics: Dict[str, AdvancedFeatureMetrics]
    transformation_pipeline: List[str]
    selection_criteria: Dict[str, Any]
    quality_score: float
    dimensionality: int
    sparsity_ratio: float
    computation_time: float
    memory_usage: float
    interpretability_index: float
    stability_index: float
    predictive_index: float
    created_timestamp: datetime


class AdvancedFeatureEngineer:
    """Advanced feature engineering engine for maximum prediction accuracy"""

    def __init__(self):
        self.feature_cache = {}
        self.transformation_history = []
        self.feature_importance_cache = {}
        self.interaction_cache = {}
        self.temporal_patterns_cache = {}

        # Advanced components
        self.statistical_transformers = {}
        self.temporal_analyzers = {}
        self.interaction_discoverers = {}
        self.domain_extractors = {}
        self.automated_synthesizers = {}

        # Caching and optimization
        self.feature_computation_cache = {}
        self.performance_metrics = defaultdict(list)

        # Initialize advanced feature engineering components
        self.initialize_advanced_components()

    def initialize_advanced_components(self):
        """Initialize all advanced feature engineering components"""
        logger.info("Initializing Advanced Feature Engineering Engine...")

        # Statistical transformers
        self.statistical_transformers = {
            "power_transformer": PowerTransformer(method="yeo-johnson"),
            "quantile_transformer": QuantileTransformer(output_distribution="normal"),
            "robust_scaler": RobustScaler(),
            "standard_scaler": StandardScaler(),
            "minmax_scaler": MinMaxScaler(),
            "normalizer": Normalizer(),
            "polynomial_features": PolynomialFeatures(
                degree=3, interaction_only=False, include_bias=False
            ),
        }

        # Dimensionality reduction components
        self.dimensionality_reducers = {
            "pca": PCA(n_components=0.95),
            "kernel_pca": KernelPCA(n_components=100, kernel="rbf"),
            "ica": FastICA(n_components=50),
            "truncated_svd": TruncatedSVD(n_components=50),
            "factor_analysis": FactorAnalysis(n_components=30),
            "sparse_pca": SparsePCA(n_components=30, alpha=0.1),
        }

        # Feature selection components
        self.feature_selectors = {
            "variance_threshold": VarianceThreshold(threshold=0.01),
            "mutual_info": SelectKBest(score_func=mutual_info_regression, k=100),
            "f_regression": SelectKBest(score_func=f_regression, k=100),
            "percentile": SelectPercentile(score_func=f_regression, percentile=80),
            "rfe": RFE(estimator=None, n_features_to_select=50),  # Estimator set later
        }

        # Clustering components
        self.clustering_models = {
            "kmeans": KMeans(n_clusters=10, random_state=42),
            "gaussian_mixture": GaussianMixture(n_components=8, random_state=42),
            "dbscan": DBSCAN(eps=0.5, min_samples=5),
            "spectral": SpectralClustering(n_clusters=6, random_state=42),
        }

        # Anomaly detection components
        self.anomaly_detectors = {
            "isolation_forest": IsolationForest(contamination=0.1, random_state=42),
            "elliptic_envelope": EllipticEnvelope(contamination=0.1),
            "local_outlier": LocalOutlierFactor(n_neighbors=20, contamination=0.1),
        }

        # Initialize sentiment analyzer
        try:
            self.sentiment_analyzer = SentimentIntensityAnalyzer()
        except LookupError:
            nltk.download("vader_lexicon")
            self.sentiment_analyzer = SentimentIntensityAnalyzer()
        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Failed to initialize SentimentIntensityAnalyzer: {e}")
            self.sentiment_analyzer = None

        logger.info("Advanced Feature Engineering Engine initialized")

    async def engineer_maximum_accuracy_features(
        self,
        raw_data: Dict[str, Any],
        target_variable: Optional[str] = None,
        strategies: List[FeatureEngineeringStrategy] = None,
        context: Optional[Dict[str, Any]] = None,
    ) -> FeatureSet:
        """Engineer features optimized for maximum prediction accuracy"""
        if strategies is None:
            strategies = [
                FeatureEngineeringStrategy.STATISTICAL_TRANSFORMATION,
                FeatureEngineeringStrategy.TEMPORAL_PATTERNS,
                FeatureEngineeringStrategy.INTERACTION_DISCOVERY,
                FeatureEngineeringStrategy.DOMAIN_SPECIFIC,
                FeatureEngineeringStrategy.TECHNICAL_INDICATORS,
                FeatureEngineeringStrategy.FREQUENCY_DOMAIN,
                FeatureEngineeringStrategy.CLUSTERING_FEATURES,
                FeatureEngineeringStrategy.ANOMALY_FEATURES,
            ]

        start_time = datetime.now()
        engineered_features = {}
        feature_metrics = {}
        transformation_pipeline = []

        # 1. Basic preprocessing and cleaning
        cleaned_data = await self._advanced_data_cleaning(raw_data)

        # 2. Apply each feature engineering strategy
        for strategy in strategies:
            try:
                strategy_features = await self._apply_strategy(
                    strategy, cleaned_data, context
                )
                engineered_features.update(strategy_features)
                transformation_pipeline.append(strategy.value)
                logger.info(
                    f"Applied {strategy.value}: {len(strategy_features)} features created"
                )
            except Exception as e:  # pylint: disable=broad-exception-caught
                logger.error("Error applying strategy {strategy.value}: {e}")

        # 3. Feature interaction discovery
        interaction_features = await self._discover_feature_interactions(
            engineered_features
        )
        engineered_features.update(interaction_features)
        transformation_pipeline.append("interaction_discovery")

        # 4. Advanced statistical transformations
        transformed_features = await self._apply_statistical_transformations(
            engineered_features
        )
        engineered_features.update(transformed_features)
        transformation_pipeline.append("statistical_transformations")

        # 5. Feature quality assessment
        for feature_name, feature_value in engineered_features.items():
            metrics = await self._assess_feature_quality(
                feature_name, feature_value, engineered_features, target_variable
            )
            feature_metrics[feature_name] = metrics

        # 6. Feature selection and optimization
        optimized_features = await self._optimize_feature_set(
            engineered_features, feature_metrics, target_variable
        )

        # 7. Calculate overall quality metrics
        quality_score = await self._calculate_feature_set_quality(
            optimized_features, feature_metrics
        )

        computation_time = (datetime.now() - start_time).total_seconds()

        feature_set = FeatureSet(
            features=optimized_features,
            feature_metrics=feature_metrics,
            transformation_pipeline=transformation_pipeline,
            selection_criteria={
                "quality_threshold": 0.7,
                "importance_threshold": 0.1,
                "correlation_threshold": 0.95,
            },
            quality_score=quality_score,
            dimensionality=len(optimized_features),
            sparsity_ratio=self._calculate_sparsity_ratio(optimized_features),
            computation_time=computation_time,
            memory_usage=self._estimate_memory_usage(optimized_features),
            interpretability_index=self._calculate_interpretability_index(
                feature_metrics
            ),
            stability_index=self._calculate_stability_index(feature_metrics),
            predictive_index=self._calculate_predictive_index(feature_metrics),
            created_timestamp=start_time,
        )

        logger.info(
            f"Feature engineering completed: {len(optimized_features)} features in {computation_time:.2f}s"
        )
        return feature_set

    async def _apply_strategy(
        self,
        strategy: FeatureEngineeringStrategy,
        data: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Apply specific feature engineering strategy"""
        if strategy == FeatureEngineeringStrategy.STATISTICAL_TRANSFORMATION:
            return await self._create_statistical_features(data)
        elif strategy == FeatureEngineeringStrategy.TEMPORAL_PATTERNS:
            return await self._create_temporal_features(data, context)
        elif strategy == FeatureEngineeringStrategy.INTERACTION_DISCOVERY:
            return await self._create_interaction_features(data)
        elif strategy == FeatureEngineeringStrategy.DOMAIN_SPECIFIC:
            return await self._create_domain_specific_features(data, context)
        elif strategy == FeatureEngineeringStrategy.TECHNICAL_INDICATORS:
            return await self._create_technical_indicator_features(data)
        elif strategy == FeatureEngineeringStrategy.FREQUENCY_DOMAIN:
            return await self._create_frequency_domain_features(data)
        elif strategy == FeatureEngineeringStrategy.CLUSTERING_FEATURES:
            return await self._create_clustering_features(data)
        elif strategy == FeatureEngineeringStrategy.ANOMALY_FEATURES:
            return await self._create_anomaly_features(data)
        elif strategy == FeatureEngineeringStrategy.POLYNOMIAL_EXPANSION:
            return await self._create_polynomial_features(data)
        elif strategy == FeatureEngineeringStrategy.SENTIMENT_FEATURES:
            return await self._create_sentiment_features(data)
        else:
            return {}

    async def _create_statistical_features(
        self, data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create advanced statistical features"""
        features = {}

        numeric_features = [
            k for k, v in data.items() if isinstance(v, (int, float, np.number))
        ]
        if not numeric_features:
            return features

        values = np.array([data[k] for k in numeric_features])

        # Basic statistical features
        features["stat_mean"] = np.mean(values)
        features["stat_median"] = np.median(values)
        features["stat_std"] = np.std(values)
        features["stat_var"] = np.var(values)
        features["stat_skew"] = stats.skew(values)
        features["stat_kurtosis"] = stats.kurtosis(values)
        features["stat_min"] = np.min(values)
        features["stat_max"] = np.max(values)
        features["stat_range"] = np.max(values) - np.min(values)
        features["stat_iqr"] = np.percentile(values, 75) - np.percentile(values, 25)

        # Advanced statistical features
        features["stat_coefficient_variation"] = np.std(values) / (
            np.mean(values) + 1e-8
        )
        features["stat_mad"] = np.median(np.abs(values - np.median(values)))
        features["stat_trimmed_mean"] = stats.trim_mean(values, 0.1)
        features["stat_geometric_mean"] = stats.gmean(np.abs(values) + 1e-8)
        features["stat_harmonic_mean"] = stats.hmean(np.abs(values) + 1e-8)

        # Percentile features
        for p in [5, 10, 25, 75, 90, 95]:
            features[f"stat_percentile_{p}"] = np.percentile(values, p)

        # Moments
        for i in range(2, 6):
            features[f"stat_moment_{i}"] = stats.moment(values, moment=i)

        # Distribution testing
        try:
            _, p_normal = stats.normaltest(values)
            features["stat_normality_p"] = p_normal
        except:
            features["stat_normality_p"] = 0.5

        # Entropy
        hist, _ = np.histogram(values, bins=10)
        probs = hist / np.sum(hist)
        probs = probs[probs > 0]
        features["stat_entropy"] = -np.sum(probs * np.log2(probs))

        return features

    async def _create_temporal_features(
        self, data: Dict[str, Any], context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Create temporal pattern features"""
        features = {}

        if not context or "timestamp" not in context:
            return features

        timestamp = context["timestamp"]
        if isinstance(timestamp, str):
            timestamp = pd.to_datetime(timestamp)

        # Time-based features
        features["temporal_hour"] = timestamp.hour
        features["temporal_day_of_week"] = timestamp.dayofweek
        features["temporal_day_of_month"] = timestamp.day
        features["temporal_month"] = timestamp.month
        features["temporal_quarter"] = timestamp.quarter
        features["temporal_year"] = timestamp.year
        features["temporal_is_weekend"] = int(timestamp.dayofweek >= 5)
        features["temporal_is_holiday"] = self._is_holiday(timestamp)

        # Cyclical encoding
        features["temporal_hour_sin"] = np.sin(2 * np.pi * timestamp.hour / 24)
        features["temporal_hour_cos"] = np.cos(2 * np.pi * timestamp.hour / 24)
        features["temporal_day_sin"] = np.sin(2 * np.pi * timestamp.dayofweek / 7)
        features["temporal_day_cos"] = np.cos(2 * np.pi * timestamp.dayofweek / 7)
        features["temporal_month_sin"] = np.sin(2 * np.pi * timestamp.month / 12)
        features["temporal_month_cos"] = np.cos(2 * np.pi * timestamp.month / 12)

        # Season features
        features["temporal_season"] = self._get_season(timestamp)
        features["temporal_is_business_hours"] = int(9 <= timestamp.hour <= 17)
        features["temporal_is_prime_time"] = int(19 <= timestamp.hour <= 22)

        # Historical pattern features if historical data available
        if "historical_data" in context:
            historical_features = await self._create_historical_pattern_features(
                data, context["historical_data"], timestamp
            )
            features.update(historical_features)

        return features

    async def _create_technical_indicator_features(
        self, data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create technical analysis indicator features"""
        features = {}

        # Extract price-like features for technical analysis
        price_features = []
        for key, value in data.items():
            if isinstance(value, (int, float)) and any(
                term in key.lower() for term in ["price", "value", "score", "odds"]
            ):
                price_features.append(value)

        if len(price_features) < 5:  # Need minimum data for technical indicators
            return features

        # Convert to pandas Series for technical analysis
        prices = pd.Series(price_features)

        try:
            # Moving averages
            features["ta_sma_5"] = ta.trend.sma_indicator(
                prices, window=min(5, len(prices))
            )
            features["ta_ema_5"] = ta.trend.ema_indicator(
                prices, window=min(5, len(prices))
            )

            # Momentum indicators
            features["ta_rsi"] = ta.momentum.rsi(prices, window=min(14, len(prices)))
            features["ta_stoch"] = ta.momentum.stoch(
                prices, prices, prices, window=min(14, len(prices))
            )

            # Volatility indicators
            features["ta_bollinger_high"] = ta.volatility.bollinger_hband(
                prices, window=min(20, len(prices))
            )
            features["ta_bollinger_low"] = ta.volatility.bollinger_lband(
                prices, window=min(20, len(prices))
            )
            features["ta_atr"] = ta.volatility.average_true_range(
                prices, prices, prices, window=min(14, len(prices))
            )

            # Volume indicators (using price as proxy)
            features["ta_volume_sma"] = ta.volume.volume_sma(
                prices, prices, window=min(10, len(prices))
            )

            # Trend indicators
            features["ta_adx"] = ta.trend.adx(
                prices, prices, prices, window=min(14, len(prices))
            )
            features["ta_macd"] = ta.trend.macd(
                prices,
                window_slow=min(26, len(prices)),
                window_fast=min(12, len(prices)),
            )

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.warning("Error creating technical indicators: {e}")

        # Remove NaN values
        features = {
            k: v
            for k, v in features.items()
            if not (isinstance(v, float) and np.isnan(v))
        }

        return features

    async def _create_frequency_domain_features(
        self, data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create frequency domain features using FFT"""
        features = {}

        numeric_values = [
            v for v in data.values() if isinstance(v, (int, float, np.number))
        ]
        if len(numeric_values) < 8:  # Need minimum data for FFT
            return features

        # Perform FFT
        fft_values = fft(numeric_values)
        freqs = fftfreq(len(numeric_values))

        # Extract frequency domain features
        features["freq_dc_component"] = np.abs(fft_values[0])
        features["freq_fundamental"] = (
            np.abs(fft_values[1]) if len(fft_values) > 1 else 0
        )
        features["freq_total_power"] = np.sum(np.abs(fft_values) ** 2)
        features["freq_peak_frequency"] = (
            freqs[np.argmax(np.abs(fft_values[1 : len(fft_values) // 2]))]
            if len(fft_values) > 2
            else 0
        )

        # Spectral centroid
        spectrum = np.abs(fft_values[: len(fft_values) // 2])
        freqs_positive = freqs[: len(freqs) // 2]
        features["freq_spectral_centroid"] = np.sum(freqs_positive * spectrum) / (
            np.sum(spectrum) + 1e-8
        )

        # Spectral rolloff
        cumsum_spectrum = np.cumsum(spectrum)
        rolloff_point = 0.85 * cumsum_spectrum[-1]
        rolloff_idx = np.where(cumsum_spectrum >= rolloff_point)[0]
        features["freq_spectral_rolloff"] = (
            freqs_positive[rolloff_idx[0]] if len(rolloff_idx) > 0 else 0
        )

        # Spectral bandwidth
        centroid = features["freq_spectral_centroid"]
        features["freq_spectral_bandwidth"] = np.sqrt(
            np.sum(((freqs_positive - centroid) ** 2) * spectrum)
            / (np.sum(spectrum) + 1e-8)
        )

        return features

    async def _create_clustering_features(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create clustering-based features"""
        features = {}

        numeric_data = np.array(
            [v for v in data.values() if isinstance(v, (int, float, np.number))]
        )
        if len(numeric_data) < 5:
            return features

        # Reshape for clustering (assume single sample)
        X = numeric_data.reshape(1, -1)

        try:
            # K-means clustering distance
            kmeans = self.clustering_models["kmeans"]
            if hasattr(kmeans, "cluster_centers_"):
                cluster_distances = np.sqrt(
                    np.sum((X - kmeans.cluster_centers_) ** 2, axis=1)
                )
                features["cluster_min_distance"] = np.min(cluster_distances)
                features["cluster_max_distance"] = np.max(cluster_distances)
                features["cluster_avg_distance"] = np.mean(cluster_distances)
                features["cluster_assignment"] = kmeans.predict(X)[0]

            # Gaussian Mixture Model probability
            gmm = self.clustering_models["gaussian_mixture"]
            if hasattr(gmm, "weights_"):
                probabilities = gmm.predict_proba(X)[0]
                features["gmm_max_probability"] = np.max(probabilities)
                features["gmm_entropy"] = -np.sum(
                    probabilities * np.log(probabilities + 1e-8)
                )
                features["gmm_assignment"] = gmm.predict(X)[0]

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.warning("Error creating clustering features: {e}")

        return features

    async def _create_anomaly_features(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create anomaly detection features"""
        features = {}

        numeric_data = np.array(
            [v for v in data.values() if isinstance(v, (int, float, np.number))]
        )
        if len(numeric_data) < 3:
            return features

        # Reshape for anomaly detection
        X = numeric_data.reshape(1, -1)

        try:
            # Isolation Forest anomaly score
            iso_forest = self.anomaly_detectors["isolation_forest"]
            if hasattr(iso_forest, "decision_function"):
                features["anomaly_isolation_score"] = iso_forest.decision_function(X)[0]
                features["anomaly_isolation_outlier"] = iso_forest.predict(X)[0]

            # Statistical anomaly detection
            z_scores = np.abs(stats.zscore(numeric_data))
            features["anomaly_max_zscore"] = np.max(z_scores)
            features["anomaly_mean_zscore"] = np.mean(z_scores)
            features["anomaly_outlier_count"] = np.sum(z_scores > 3)

            # Mahalanobis distance (simplified)
            if len(numeric_data) > 1:
                cov_matrix = np.cov(numeric_data.reshape(-1, 1), rowvar=False)
                if cov_matrix.shape == () or cov_matrix == 0:
                    features["anomaly_mahalanobis"] = 0.0
                else:
                    mean_vec = np.mean(numeric_data)
                    diff = numeric_data - mean_vec
                    features["anomaly_mahalanobis"] = np.sqrt(
                        np.sum((diff**2) / (cov_matrix + 1e-8))
                    )

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.warning("Error creating anomaly features: {e}")

        return features

    async def _create_domain_specific_features(
        self, data: Dict[str, Any], context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Create sports betting domain-specific features"""
        features = {}

        # Player performance features
        if "player_stats" in data:
            player_features = await self._create_player_performance_features(
                data["player_stats"]
            )
            features.update(player_features)

        # Team performance features
        if "team_stats" in data:
            team_features = await self._create_team_performance_features(
                data["team_stats"]
            )
            features.update(team_features)

        # Game context features
        if context and "game_context" in context:
            game_features = await self._create_game_context_features(
                context["game_context"]
            )
            features.update(game_features)

        # Betting market features
        if "betting_data" in data:
            betting_features = await self._create_betting_market_features(
                data["betting_data"]
            )
            features.update(betting_features)

        # Injury impact features
        if "injury_data" in data:
            injury_features = await self._create_injury_impact_features(
                data["injury_data"]
            )
            features.update(injury_features)

        # Weather impact features
        if "weather_data" in data:
            weather_features = await self._create_weather_impact_features(
                data["weather_data"]
            )
            features.update(weather_features)

        return features

    async def _create_player_performance_features(
        self, player_stats: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create player performance features"""
        features = {}

        # Recent form indicators
        if "recent_games" in player_stats:
            recent = player_stats["recent_games"]
            features["player_recent_avg"] = np.mean(recent) if recent else 0
            features["player_recent_trend"] = (
                np.polyfit(range(len(recent)), recent, 1)[0] if len(recent) > 1 else 0
            )
            features["player_consistency"] = (
                1.0 / (1.0 + np.std(recent)) if recent else 0
            )

        # Career performance
        if "career_stats" in player_stats:
            career = player_stats["career_stats"]
            features["player_career_avg"] = career.get("average", 0)
            features["player_games_played"] = career.get("games_played", 0)
            features["player_career_high"] = career.get("career_high", 0)

        # Matchup-specific performance
        if "vs_opponent" in player_stats:
            vs_stats = player_stats["vs_opponent"]
            features["player_vs_opponent_avg"] = vs_stats.get("average", 0)
            features["player_vs_opponent_games"] = vs_stats.get("games", 0)

        # Home/away splits
        if "home_away_splits" in player_stats:
            splits = player_stats["home_away_splits"]
            features["player_home_avg"] = splits.get("home_avg", 0)
            features["player_away_avg"] = splits.get("away_avg", 0)
            features["player_home_away_diff"] = (
                features["player_home_avg"] - features["player_away_avg"]
            )

        return features

    async def _discover_feature_interactions(
        self, features: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Discover important feature interactions"""
        interaction_features = {}

        numeric_features = {
            k: v for k, v in features.items() if isinstance(v, (int, float, np.number))
        }
        feature_names = list(numeric_features.keys())

        # Limit to prevent explosion
        max_features = min(20, len(feature_names))
        selected_features = feature_names[:max_features]

        # Pairwise interactions
        for i, feat1 in enumerate(selected_features):
            for j, feat2 in enumerate(selected_features[i + 1 :], i + 1):
                val1, val2 = numeric_features[feat1], numeric_features[feat2]

                # Multiple interaction types
                interaction_features[f"{feat1}_X_{feat2}_multiply"] = val1 * val2
                interaction_features[f"{feat1}_X_{feat2}_add"] = val1 + val2
                interaction_features[f"{feat1}_X_{feat2}_subtract"] = val1 - val2
                interaction_features[f"{feat1}_X_{feat2}_divide"] = val1 / (val2 + 1e-8)
                interaction_features[f"{feat1}_X_{feat2}_max"] = max(val1, val2)
                interaction_features[f"{feat1}_X_{feat2}_min"] = min(val1, val2)
                interaction_features[f"{feat1}_X_{feat2}_mean"] = (val1 + val2) / 2

                # Advanced interactions
                interaction_features[f"{feat1}_X_{feat2}_harmonic"] = (
                    2 * val1 * val2 / (val1 + val2 + 1e-8)
                )
                interaction_features[f"{feat1}_X_{feat2}_geometric"] = np.sqrt(
                    abs(val1 * val2)
                )
                interaction_features[f"{feat1}_X_{feat2}_power"] = val1 ** (
                    val2 * 0.1
                )  # Scale power

        # Higher-order interactions (limited)
        top_features = selected_features[:10]
        for i, feat1 in enumerate(top_features):
            for j, feat2 in enumerate(top_features[i + 1 :], i + 1):
                for k, feat3 in enumerate(top_features[j + 1 :], j + 1):
                    val1, val2, val3 = (
                        numeric_features[feat1],
                        numeric_features[feat2],
                        numeric_features[feat3],
                    )
                    interaction_features[f"{feat1}_X_{feat2}_X_{feat3}_product"] = (
                        val1 * val2 * val3
                    )
                    interaction_features[f"{feat1}_X_{feat2}_X_{feat3}_mean"] = (
                        val1 + val2 + val3
                    ) / 3

        return interaction_features

    async def _assess_feature_quality(
        self,
        feature_name: str,
        feature_value: Any,
        all_features: Dict[str, Any],
        target_variable: Optional[str] = None,
    ) -> AdvancedFeatureMetrics:
        """Assess comprehensive feature quality metrics"""
        # Initialize with defaults
        importance_score = 0.5
        stability_score = 0.8
        correlation_with_target = 0.0
        mutual_information = 0.0
        variance_ratio = 0.5
        outlier_resistance = 0.7
        interpretability_score = 0.6
        computation_cost = 0.1
        redundancy_score = 0.3
        predictive_power = 0.5
        noise_ratio = 0.2
        distribution_score = 0.7
        temporal_consistency = 0.8
        domain_relevance = 0.6

        # Calculate actual metrics where possible
        if isinstance(feature_value, (int, float, np.number)):
            # Variance-based importance
            numeric_values = [
                v
                for v in all_features.values()
                if isinstance(v, (int, float, np.number))
            ]
            if numeric_values:
                variance_ratio = np.var([feature_value]) / (
                    np.var(numeric_values) + 1e-8
                )

            # Distribution normality
            try:
                _, p_value = stats.normaltest([feature_value] * 10)  # Simplified
                distribution_score = min(1.0, p_value * 2)
            except:
                distribution_score = 0.5

        # Interpretability based on feature name
        interpretable_patterns = [
            "avg",
            "mean",
            "sum",
            "count",
            "ratio",
            "percent",
            "score",
        ]
        if any(pattern in feature_name.lower() for pattern in interpretable_patterns):
            interpretability_score = 0.9
        elif any(
            pattern in feature_name.lower()
            for pattern in ["quantum", "complex", "transform"]
        ):
            interpretability_score = 0.3

        # Computation cost based on feature name complexity
        expensive_patterns = [
            "interaction",
            "quantum",
            "frequency",
            "transform",
            "cluster",
        ]
        if any(pattern in feature_name.lower() for pattern in expensive_patterns):
            computation_cost = 0.5

        # Domain relevance for sports betting
        relevant_patterns = [
            "player",
            "team",
            "game",
            "performance",
            "stats",
            "odds",
            "score",
        ]
        if any(pattern in feature_name.lower() for pattern in relevant_patterns):
            domain_relevance = 0.9

        return AdvancedFeatureMetrics(
            feature_name=feature_name,
            importance_score=importance_score,
            stability_score=stability_score,
            correlation_with_target=correlation_with_target,
            mutual_information=mutual_information,
            variance_ratio=variance_ratio,
            outlier_resistance=outlier_resistance,
            interpretability_score=interpretability_score,
            computation_cost=computation_cost,
            redundancy_score=redundancy_score,
            predictive_power=predictive_power,
            noise_ratio=noise_ratio,
            distribution_score=distribution_score,
            temporal_consistency=temporal_consistency,
            domain_relevance=domain_relevance,
            feature_interactions=[],
            created_timestamp=datetime.now(),
            last_updated=datetime.now(),
        )

    def _is_holiday(self, timestamp: datetime) -> int:
        """Check if timestamp is a holiday"""
        # Simplified holiday detection
        holidays = [
            (1, 1),  # New Year
            (7, 4),  # Independence Day
            (12, 25),  # Christmas
            (11, 24),  # Thanksgiving (simplified)
        ]
        return int((timestamp.month, timestamp.day) in holidays)

    def _get_season(self, timestamp: datetime) -> int:
        """Get season from timestamp"""
        month = timestamp.month
        if month in [12, 1, 2]:
            return 0  # Winter
        elif month in [3, 4, 5]:
            return 1  # Spring
        elif month in [6, 7, 8]:
            return 2  # Summer
        else:
            return 3  # Fall


# Global instance
advanced_feature_engineer = AdvancedFeatureEngineer()
