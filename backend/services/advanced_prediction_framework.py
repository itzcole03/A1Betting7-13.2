"""
Advanced Prediction Framework for A1Betting7-13.2

Phase 2 implementation: Multi-model ensemble prediction system with confidence
intervals, risk assessment, and dynamic model selection capabilities.

Architecture Features:
- Multi-model ensemble predictions
- Dynamic model selection based on performance
- Confidence interval calculations
- Risk assessment and management
- Advanced feature engineering pipeline
- Model drift detection and retraining triggers
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
from typing import Any, Dict, List, Optional, Tuple, Union

import numpy as np
import pandas as pd
from scipy import stats
from sklearn.ensemble import VotingClassifier, VotingRegressor
from sklearn.feature_selection import SelectKBest, f_regression, mutual_info_regression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import TimeSeriesSplit, cross_val_score

# ML Libraries
from sklearn.preprocessing import MinMaxScaler, RobustScaler, StandardScaler

warnings.filterwarnings("ignore")

from ..cache_manager_consolidated import CacheManagerConsolidated
from ..redis_service_optimized import RedisServiceOptimized

# Existing services integration
from .enhanced_ml_model_pipeline import (
    EnhancedMLModelPipeline,
    ModelFramework,
    ModelMetadata,
    ModelType,
)
from .realtime_analytics_engine import (
    EventType,
    RealtimeAnalyticsEngine,
    StreamingEvent,
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("advanced_prediction")


class PredictionStrategy(Enum):
    """Prediction strategy types"""

    SINGLE_BEST = "single_best"
    WEIGHTED_ENSEMBLE = "weighted_ensemble"
    DYNAMIC_SELECTION = "dynamic_selection"
    STACKING = "stacking"
    VOTING = "voting"


class RiskLevel(Enum):
    """Risk assessment levels"""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    EXTREME = "extreme"


class ModelSelectionCriteria(Enum):
    """Model selection criteria"""

    ACCURACY = "accuracy"
    LATENCY = "latency"
    CONFIDENCE = "confidence"
    RECENT_PERFORMANCE = "recent_performance"
    STABILITY = "stability"


@dataclass
class PredictionRequest:
    """Enhanced prediction request with advanced options"""

    features: Dict[str, Any]
    target_type: str = "regression"
    strategy: PredictionStrategy = PredictionStrategy.WEIGHTED_ENSEMBLE
    confidence_level: float = 0.95
    risk_assessment: bool = True
    feature_importance: bool = False
    explanation_depth: str = "basic"  # basic, detailed, full
    ensemble_size: int = 5
    min_confidence_threshold: float = 0.6
    max_prediction_age_minutes: int = 15


@dataclass
class ConfidenceInterval:
    """Confidence interval representation"""

    lower_bound: float
    upper_bound: float
    confidence_level: float
    method: str  # bootstrap, analytical, empirical


@dataclass
class RiskAssessment:
    """Risk assessment for predictions"""

    risk_level: RiskLevel
    risk_score: float  # 0-1 scale
    risk_factors: List[str]
    confidence_degradation: float
    recommendation: str


@dataclass
class FeatureImportance:
    """Feature importance analysis"""

    feature_scores: Dict[str, float]
    selection_method: str
    total_features: int
    selected_features: int
    importance_threshold: float


@dataclass
class ModelPerformanceMetric:
    """Individual model performance tracking"""

    model_id: str
    accuracy: float
    latency_ms: float
    confidence: float
    predictions_count: int
    last_updated: datetime
    drift_score: float
    stability_score: float


@dataclass
class EnsemblePrediction:
    """Comprehensive ensemble prediction result"""

    prediction: float
    confidence_score: float
    confidence_interval: ConfidenceInterval
    risk_assessment: RiskAssessment
    feature_importance: Optional[FeatureImportance]
    model_contributions: Dict[str, float]
    ensemble_performance: Dict[str, float]
    processing_metadata: Dict[str, Any]
    timestamp: datetime


class AdvancedPredictionFramework:
    """
    Advanced Prediction Framework with ensemble capabilities

    Implements sophisticated prediction strategies including multi-model
    ensembles, dynamic model selection, and comprehensive risk assessment.
    """

    def __init__(
        self,
        ml_pipeline: EnhancedMLModelPipeline,
        analytics_engine: RealtimeAnalyticsEngine,
        redis_service: RedisServiceOptimized,
        cache_manager: CacheManagerConsolidated,
        ensemble_cache_ttl: int = 900,  # 15 minutes
        performance_window_size: int = 1000,
        drift_detection_threshold: float = 0.15,
        min_ensemble_size: int = 3,
    ):
        self.ml_pipeline = ml_pipeline
        self.analytics_engine = analytics_engine
        self.redis_service = redis_service
        self.cache_manager = cache_manager
        self.ensemble_cache_ttl = ensemble_cache_ttl
        self.performance_window_size = performance_window_size
        self.drift_detection_threshold = drift_detection_threshold
        self.min_ensemble_size = min_ensemble_size

        # Model performance tracking
        self.model_performance: Dict[str, ModelPerformanceMetric] = {}
        self.performance_history: Dict[str, deque] = defaultdict(
            lambda: deque(maxlen=performance_window_size)
        )

        # Feature engineering components
        self.feature_processors = {"scalers": {}, "selectors": {}, "encoders": {}}

        # Ensemble configurations
        self.ensemble_strategies = {
            PredictionStrategy.WEIGHTED_ENSEMBLE: self._weighted_ensemble_predict,
            PredictionStrategy.DYNAMIC_SELECTION: self._dynamic_selection_predict,
            PredictionStrategy.VOTING: self._voting_ensemble_predict,
            PredictionStrategy.STACKING: self._stacking_ensemble_predict,
        }

        # Prediction cache
        self.prediction_cache: Dict[str, EnsemblePrediction] = {}

        # Risk assessment rules
        self.risk_rules = self._initialize_risk_rules()

        logger.info("Advanced Prediction Framework initialized")

    async def predict_advanced(self, request: PredictionRequest) -> EnsemblePrediction:
        """
        Generate advanced predictions using ensemble methods

        Main entry point for sophisticated prediction generation with
        confidence intervals, risk assessment, and model selection.
        """
        start_time = time.time()

        try:
            # Generate cache key
            cache_key = self._generate_cache_key(request)

            # Check cache first
            cached_prediction = await self._get_cached_prediction(
                cache_key, request.max_prediction_age_minutes
            )
            if cached_prediction:
                return cached_prediction

            # Prepare features
            processed_features = await self._prepare_features(request.features)

            # Get available models
            available_models = await self._get_available_models(request.target_type)

            if len(available_models) < self.min_ensemble_size:
                logger.warning(
                    f"Only {len(available_models)} models available, minimum is {self.min_ensemble_size}"
                )

            # Select models based on strategy
            selected_models = await self._select_models(
                available_models, request.strategy, request.ensemble_size
            )

            # Generate predictions from selected models
            model_predictions = await self._generate_model_predictions(
                selected_models, processed_features
            )

            # Create ensemble prediction
            ensemble_prediction = await self._create_ensemble_prediction(
                model_predictions, request, processed_features
            )

            # Perform risk assessment
            if request.risk_assessment:
                ensemble_prediction.risk_assessment = (
                    await self._assess_prediction_risk(
                        ensemble_prediction, model_predictions, processed_features
                    )
                )

            # Generate feature importance
            if request.feature_importance:
                ensemble_prediction.feature_importance = (
                    await self._calculate_feature_importance(
                        processed_features, selected_models, request.explanation_depth
                    )
                )

            # Add processing metadata
            processing_time = (time.time() - start_time) * 1000
            ensemble_prediction.processing_metadata = {
                "processing_time_ms": processing_time,
                "models_used": len(selected_models),
                "strategy": request.strategy.value,
                "cache_key": cache_key,
                "features_processed": len(processed_features),
            }

            # Cache prediction
            await self._cache_prediction(cache_key, ensemble_prediction)

            # Update model performance metrics
            await self._update_model_performance(model_predictions, processing_time)

            # Log prediction event
            await self._log_prediction_event(ensemble_prediction, request)

            return ensemble_prediction

        except Exception as e:
            logger.error(f"Advanced prediction failed: {e}")
            raise

    async def _prepare_features(self, raw_features: Dict[str, Any]) -> pd.DataFrame:
        """Prepare and engineer features for prediction"""
        try:
            # Convert to DataFrame
            features_df = pd.DataFrame([raw_features])

            # Advanced feature engineering
            engineered_features = await self._engineer_advanced_features(features_df)

            # Feature scaling
            scaled_features = await self._scale_features(engineered_features)

            # Feature selection
            selected_features = await self._select_features(scaled_features)

            return selected_features

        except Exception as e:
            logger.error(f"Feature preparation failed: {e}")
            return pd.DataFrame([raw_features])

    async def _engineer_advanced_features(
        self, features_df: pd.DataFrame
    ) -> pd.DataFrame:
        """Advanced feature engineering for sports betting"""
        try:
            engineered_df = features_df.copy()

            # Time-based features
            if "game_time" in features_df.columns:
                game_time = pd.to_datetime(features_df["game_time"])
                engineered_df["hour_of_day"] = game_time.dt.hour
                engineered_df["day_of_week"] = game_time.dt.dayofweek
                engineered_df["is_weekend"] = game_time.dt.dayofweek.isin(
                    [5, 6]
                ).astype(int)

            # Player performance features
            if "player_stats" in features_df.columns:
                stats = (
                    features_df["player_stats"].iloc[0]
                    if isinstance(features_df["player_stats"].iloc[0], dict)
                    else {}
                )

                # Recent performance trend
                if "recent_games" in stats:
                    recent_performance = stats["recent_games"]
                    if isinstance(recent_performance, list) and recent_performance:
                        engineered_df["performance_trend"] = (
                            np.polyfit(
                                range(len(recent_performance)), recent_performance, 1
                            )[0]
                            if len(recent_performance) > 1
                            else 0
                        )

                        engineered_df["performance_volatility"] = np.std(
                            recent_performance
                        )
                        engineered_df["performance_momentum"] = (
                            np.mean(recent_performance[-3:])
                            - np.mean(recent_performance[:-3])
                            if len(recent_performance) >= 6
                            else 0
                        )

                # Performance ratios
                if "home_stats" in stats and "away_stats" in stats:
                    home_avg = (
                        np.mean(list(stats["home_stats"].values()))
                        if stats["home_stats"]
                        else 0
                    )
                    away_avg = (
                        np.mean(list(stats["away_stats"].values()))
                        if stats["away_stats"]
                        else 0
                    )
                    engineered_df["home_away_ratio"] = home_avg / (away_avg + 1e-8)

            # Team strength features
            if (
                "team_stats" in features_df.columns
                and "opponent_stats" in features_df.columns
            ):
                team_stats = (
                    features_df["team_stats"].iloc[0]
                    if isinstance(features_df["team_stats"].iloc[0], dict)
                    else {}
                )
                opp_stats = (
                    features_df["opponent_stats"].iloc[0]
                    if isinstance(features_df["opponent_stats"].iloc[0], dict)
                    else {}
                )

                # Team strength differential
                team_strength = team_stats.get("strength_rating", 0.5)
                opp_strength = opp_stats.get("strength_rating", 0.5)
                engineered_df["strength_differential"] = team_strength - opp_strength

                # Head-to-head features
                if "head_to_head" in team_stats:
                    h2h = team_stats["head_to_head"]
                    if isinstance(h2h, dict):
                        engineered_df["h2h_win_rate"] = h2h.get("win_rate", 0.5)
                        engineered_df["h2h_avg_margin"] = h2h.get("avg_margin", 0)

            # Weather impact features
            if "weather" in features_df.columns:
                weather = (
                    features_df["weather"].iloc[0]
                    if isinstance(features_df["weather"].iloc[0], dict)
                    else {}
                )

                temp = weather.get("temperature", 70)
                humidity = weather.get("humidity", 50)
                wind_speed = weather.get("wind_speed", 0)

                # Weather performance impact
                engineered_df["weather_impact_score"] = self._calculate_weather_impact(
                    temp, humidity, wind_speed
                )
                engineered_df["is_extreme_weather"] = int(
                    temp < 32 or temp > 95 or humidity > 80 or wind_speed > 20
                )

            # Injury impact features
            if "injuries" in features_df.columns:
                injuries = (
                    features_df["injuries"].iloc[0]
                    if isinstance(features_df["injuries"].iloc[0], list)
                    else []
                )

                engineered_df["injury_count"] = len(injuries)
                engineered_df["key_player_injured"] = int(
                    any(
                        injury.get("importance", 0) > 0.7
                        for injury in injuries
                        if isinstance(injury, dict)
                    )
                )

            # Market sentiment features
            if "betting_data" in features_df.columns:
                betting_data = (
                    features_df["betting_data"].iloc[0]
                    if isinstance(features_df["betting_data"].iloc[0], dict)
                    else {}
                )

                # Line movement
                if "line_movement" in betting_data:
                    movement = betting_data["line_movement"]
                    engineered_df["line_movement_magnitude"] = abs(
                        movement.get("change", 0)
                    )
                    engineered_df["line_movement_direction"] = np.sign(
                        movement.get("change", 0)
                    )

                # Betting volume
                if "volume" in betting_data:
                    volume = betting_data["volume"]
                    engineered_df["betting_volume_ratio"] = volume.get(
                        "current", 0
                    ) / max(volume.get("average", 1), 1)

            # Interaction features
            numeric_columns = engineered_df.select_dtypes(include=[np.number]).columns
            if len(numeric_columns) >= 2:
                # Create polynomial features for key interactions
                key_features = [
                    "strength_differential",
                    "performance_trend",
                    "weather_impact_score",
                ]
                available_key_features = [
                    f for f in key_features if f in engineered_df.columns
                ]

                for i, feat1 in enumerate(available_key_features):
                    for feat2 in available_key_features[i + 1 :]:
                        engineered_df[f"{feat1}_x_{feat2}"] = (
                            engineered_df[feat1] * engineered_df[feat2]
                        )

            return engineered_df

        except Exception as e:
            logger.error(f"Advanced feature engineering failed: {e}")
            return features_df

    def _calculate_weather_impact(
        self, temp: float, humidity: float, wind_speed: float
    ) -> float:
        """Calculate weather impact score on performance"""
        # Optimal conditions: 65-75°F, 40-60% humidity, <10mph wind
        temp_impact = 1 - abs(temp - 70) / 100  # Normalize around 70°F
        humidity_impact = 1 - abs(humidity - 50) / 100  # Normalize around 50%
        wind_impact = max(0, 1 - wind_speed / 30)  # Penalize high wind

        return np.clip((temp_impact + humidity_impact + wind_impact) / 3, 0, 1)

    async def _scale_features(self, features_df: pd.DataFrame) -> pd.DataFrame:
        """Apply feature scaling"""
        try:
            numeric_columns = features_df.select_dtypes(include=[np.number]).columns

            if len(numeric_columns) == 0:
                return features_df

            # Generate scaler key based on feature columns
            scaler_key = hashlib.md5(str(sorted(numeric_columns)).encode()).hexdigest()

            if scaler_key not in self.feature_processors["scalers"]:
                # Use RobustScaler for better handling of outliers
                scaler = RobustScaler()
                # Fit on current data (in production, use pre-fitted scalers)
                scaler.fit(features_df[numeric_columns])
                self.feature_processors["scalers"][scaler_key] = scaler

            scaler = self.feature_processors["scalers"][scaler_key]
            scaled_features = features_df.copy()
            scaled_features[numeric_columns] = scaler.transform(
                features_df[numeric_columns]
            )

            return scaled_features

        except Exception as e:
            logger.error(f"Feature scaling failed: {e}")
            return features_df

    async def _select_features(self, features_df: pd.DataFrame) -> pd.DataFrame:
        """Perform feature selection"""
        try:
            numeric_columns = features_df.select_dtypes(include=[np.number]).columns

            if len(numeric_columns) <= 10:  # Skip selection for small feature sets
                return features_df

            # For now, return all features (in production, implement proper feature selection)
            return features_df

        except Exception as e:
            logger.error(f"Feature selection failed: {e}")
            return features_df

    async def _get_available_models(self, target_type: str) -> List[str]:
        """Get available models for the target type"""
        try:
            pipeline_status = await self.ml_pipeline.get_pipeline_status()
            model_metadata = pipeline_status.get("model_metadata", {})

            available_models = []
            for model_id, metadata in model_metadata.items():
                if metadata.get("model_type") == target_type:
                    available_models.append(model_id)

            return available_models

        except Exception as e:
            logger.error(f"Error getting available models: {e}")
            return []

    async def _select_models(
        self,
        available_models: List[str],
        strategy: PredictionStrategy,
        ensemble_size: int,
    ) -> List[str]:
        """Select models based on strategy and performance"""
        try:
            if len(available_models) <= ensemble_size:
                return available_models

            # Get model performance scores
            model_scores = {}
            for model_id in available_models:
                performance = self.model_performance.get(model_id)
                if performance:
                    # Composite score based on accuracy, latency, and stability
                    score = (
                        performance.accuracy * 0.5
                        + (1 - min(performance.latency_ms / 1000, 1))
                        * 0.2  # Normalize latency
                        + performance.stability_score * 0.2
                        + performance.confidence * 0.1
                    )
                    model_scores[model_id] = score
                else:
                    model_scores[model_id] = 0.5  # Default score for unknown models

            # Select top performers
            sorted_models = sorted(
                model_scores.items(), key=lambda x: x[1], reverse=True
            )
            selected = [model_id for model_id, _ in sorted_models[:ensemble_size]]

            return selected

        except Exception as e:
            logger.error(f"Model selection failed: {e}")
            return available_models[:ensemble_size]

    async def _generate_model_predictions(
        self, selected_models: List[str], features: pd.DataFrame
    ) -> Dict[str, Dict[str, Any]]:
        """Generate predictions from selected models"""
        predictions = {}

        for model_id in selected_models:
            try:
                start_time = time.time()

                # Make prediction using ML pipeline
                request = type(
                    "PredictionRequest",
                    (),
                    {
                        "model_id": model_id,
                        "features": features.iloc[0].to_dict(),
                        "explain": False,
                        "confidence_interval": False,
                    },
                )()

                response = await self.ml_pipeline.predict(request)

                predictions[model_id] = {
                    "prediction": response.prediction,
                    "confidence": response.confidence_score,
                    "latency_ms": (time.time() - start_time) * 1000,
                    "model_version": response.model_version,
                }

            except Exception as e:
                logger.error(f"Prediction failed for model {model_id}: {e}")
                predictions[model_id] = {
                    "prediction": 0.0,
                    "confidence": 0.0,
                    "latency_ms": 0.0,
                    "model_version": "unknown",
                    "error": str(e),
                }

        return predictions

    async def _create_ensemble_prediction(
        self,
        model_predictions: Dict[str, Dict[str, Any]],
        request: PredictionRequest,
        features: pd.DataFrame,
    ) -> EnsemblePrediction:
        """Create ensemble prediction from individual model predictions"""
        try:
            # Get ensemble strategy function
            strategy_func = self.ensemble_strategies.get(
                request.strategy, self._weighted_ensemble_predict
            )

            # Generate ensemble prediction
            ensemble_result = await strategy_func(model_predictions, request)

            # Calculate confidence interval
            confidence_interval = await self._calculate_confidence_interval(
                model_predictions,
                ensemble_result["prediction"],
                request.confidence_level,
            )

            # Create ensemble prediction object
            prediction = EnsemblePrediction(
                prediction=ensemble_result["prediction"],
                confidence_score=ensemble_result["confidence"],
                confidence_interval=confidence_interval,
                risk_assessment=RiskAssessment(
                    risk_level=RiskLevel.MEDIUM,
                    risk_score=0.5,
                    risk_factors=[],
                    confidence_degradation=0.0,
                    recommendation="Standard prediction",
                ),
                feature_importance=None,
                model_contributions=ensemble_result.get("contributions", {}),
                ensemble_performance=ensemble_result.get("performance", {}),
                processing_metadata={},
                timestamp=datetime.now(),
            )

            return prediction

        except Exception as e:
            logger.error(f"Ensemble prediction creation failed: {e}")
            raise

    async def _weighted_ensemble_predict(
        self, model_predictions: Dict[str, Dict[str, Any]], request: PredictionRequest
    ) -> Dict[str, Any]:
        """Weighted ensemble prediction based on model performance"""
        try:
            predictions = []
            weights = []
            contributions = {}

            total_weight = 0
            for model_id, pred_data in model_predictions.items():
                if "error" in pred_data:
                    continue

                # Weight based on confidence and historical performance
                performance = self.model_performance.get(model_id)
                if performance:
                    weight = performance.accuracy * pred_data["confidence"] / 100
                else:
                    weight = pred_data["confidence"] / 100

                predictions.append(pred_data["prediction"])
                weights.append(weight)
                total_weight += weight
                contributions[model_id] = weight

            if not predictions:
                raise ValueError("No valid predictions available")

            # Normalize weights
            weights = (
                [w / total_weight for w in weights]
                if total_weight > 0
                else [1 / len(weights)] * len(weights)
            )

            # Calculate weighted average
            weighted_prediction = np.average(predictions, weights=weights)

            # Calculate ensemble confidence
            ensemble_confidence = min(
                np.average(
                    [
                        model_predictions[model_id]["confidence"]
                        for model_id in model_predictions
                        if "error" not in model_predictions[model_id]
                    ]
                ),
                95.0,
            )

            # Normalize contributions
            total_contrib = sum(contributions.values())
            if total_contrib > 0:
                contributions = {k: v / total_contrib for k, v in contributions.items()}

            return {
                "prediction": float(weighted_prediction),
                "confidence": float(ensemble_confidence),
                "contributions": contributions,
                "performance": {
                    "models_used": len(
                        [p for p in model_predictions.values() if "error" not in p]
                    ),
                    "prediction_variance": (
                        float(np.var(predictions)) if len(predictions) > 1 else 0.0
                    ),
                },
            }

        except Exception as e:
            logger.error(f"Weighted ensemble prediction failed: {e}")
            raise

    async def _dynamic_selection_predict(
        self, model_predictions: Dict[str, Dict[str, Any]], request: PredictionRequest
    ) -> Dict[str, Any]:
        """Dynamic model selection based on current context"""
        try:
            # Select best performing model for current context
            best_model_id = None
            best_score = -1

            for model_id, pred_data in model_predictions.items():
                if "error" in pred_data:
                    continue

                performance = self.model_performance.get(model_id)
                if performance:
                    # Score based on recent performance and confidence
                    score = (
                        performance.accuracy * 0.6 + pred_data["confidence"] / 100 * 0.4
                    )

                    if score > best_score:
                        best_score = score
                        best_model_id = model_id

            if not best_model_id:
                # Fallback to highest confidence
                best_model_id = max(
                    [k for k, v in model_predictions.items() if "error" not in v],
                    key=lambda k: model_predictions[k]["confidence"],
                )

            selected_prediction = model_predictions[best_model_id]

            return {
                "prediction": selected_prediction["prediction"],
                "confidence": selected_prediction["confidence"],
                "contributions": {best_model_id: 1.0},
                "performance": {
                    "selected_model": best_model_id,
                    "selection_score": best_score,
                },
            }

        except Exception as e:
            logger.error(f"Dynamic selection prediction failed: {e}")
            raise

    async def _voting_ensemble_predict(
        self, model_predictions: Dict[str, Dict[str, Any]], request: PredictionRequest
    ) -> Dict[str, Any]:
        """Simple voting ensemble (unweighted average)"""
        try:
            valid_predictions = [
                pred_data["prediction"]
                for pred_data in model_predictions.values()
                if "error" not in pred_data
            ]

            if not valid_predictions:
                raise ValueError("No valid predictions available")

            ensemble_prediction = np.mean(valid_predictions)
            ensemble_confidence = np.mean(
                [
                    pred_data["confidence"]
                    for pred_data in model_predictions.values()
                    if "error" not in pred_data
                ]
            )

            # Equal contributions
            valid_models = [k for k, v in model_predictions.items() if "error" not in v]
            equal_weight = 1.0 / len(valid_models)
            contributions = {model_id: equal_weight for model_id in valid_models}

            return {
                "prediction": float(ensemble_prediction),
                "confidence": float(ensemble_confidence),
                "contributions": contributions,
                "performance": {
                    "models_used": len(valid_models),
                    "prediction_std": float(np.std(valid_predictions)),
                },
            }

        except Exception as e:
            logger.error(f"Voting ensemble prediction failed: {e}")
            raise

    async def _stacking_ensemble_predict(
        self, model_predictions: Dict[str, Dict[str, Any]], request: PredictionRequest
    ) -> Dict[str, Any]:
        """Stacking ensemble (meta-model approach)"""
        try:
            # For now, implement as weighted ensemble
            # In production, would train a meta-model on model predictions
            return await self._weighted_ensemble_predict(model_predictions, request)

        except Exception as e:
            logger.error(f"Stacking ensemble prediction failed: {e}")
            raise

    async def _calculate_confidence_interval(
        self,
        model_predictions: Dict[str, Dict[str, Any]],
        ensemble_prediction: float,
        confidence_level: float,
    ) -> ConfidenceInterval:
        """Calculate confidence interval for ensemble prediction"""
        try:
            valid_predictions = [
                pred_data["prediction"]
                for pred_data in model_predictions.values()
                if "error" not in pred_data
            ]

            if len(valid_predictions) < 2:
                # Cannot calculate meaningful interval
                margin = abs(ensemble_prediction) * 0.1  # 10% margin as fallback
                return ConfidenceInterval(
                    lower_bound=ensemble_prediction - margin,
                    upper_bound=ensemble_prediction + margin,
                    confidence_level=confidence_level,
                    method="fallback",
                )

            # Calculate standard error
            prediction_std = np.std(valid_predictions)
            n = len(valid_predictions)

            # Calculate confidence interval using t-distribution
            alpha = 1 - confidence_level
            t_value = stats.t.ppf(1 - alpha / 2, n - 1)
            margin_of_error = t_value * prediction_std / np.sqrt(n)

            return ConfidenceInterval(
                lower_bound=ensemble_prediction - margin_of_error,
                upper_bound=ensemble_prediction + margin_of_error,
                confidence_level=confidence_level,
                method="t_distribution",
            )

        except Exception as e:
            logger.error(f"Confidence interval calculation failed: {e}")
            # Fallback interval
            margin = abs(ensemble_prediction) * 0.15
            return ConfidenceInterval(
                lower_bound=ensemble_prediction - margin,
                upper_bound=ensemble_prediction + margin,
                confidence_level=confidence_level,
                method="fallback",
            )

    async def _assess_prediction_risk(
        self,
        prediction: EnsemblePrediction,
        model_predictions: Dict[str, Dict[str, Any]],
        features: pd.DataFrame,
    ) -> RiskAssessment:
        """Assess risk factors for the prediction"""
        try:
            risk_factors = []
            risk_score = 0.0

            # Model agreement risk
            valid_predictions = [
                pred_data["prediction"]
                for pred_data in model_predictions.values()
                if "error" not in pred_data
            ]

            if len(valid_predictions) > 1:
                prediction_variance = np.var(valid_predictions)
                if prediction_variance > 0.1:  # High disagreement
                    risk_factors.append("High model disagreement")
                    risk_score += 0.3

            # Confidence risk
            if prediction.confidence_score < 60:
                risk_factors.append("Low prediction confidence")
                risk_score += 0.2

            # Model performance risk
            avg_model_accuracy = np.mean(
                [
                    self.model_performance[model_id].accuracy
                    for model_id in model_predictions.keys()
                    if model_id in self.model_performance
                ]
            )

            if avg_model_accuracy < 0.7:
                risk_factors.append("Models showing poor recent performance")
                risk_score += 0.25

            # Feature quality risk
            feature_completeness = self._assess_feature_completeness(features)
            if feature_completeness < 0.8:
                risk_factors.append("Incomplete or poor quality features")
                risk_score += 0.15

            # Data freshness risk
            # (In production, check age of input data)

            # Determine risk level
            if risk_score < 0.2:
                risk_level = RiskLevel.LOW
                recommendation = "Prediction appears reliable"
            elif risk_score < 0.5:
                risk_level = RiskLevel.MEDIUM
                recommendation = "Use prediction with caution"
            elif risk_score < 0.8:
                risk_level = RiskLevel.HIGH
                recommendation = "High risk prediction - consider additional validation"
            else:
                risk_level = RiskLevel.EXTREME
                recommendation = "Extremely high risk - avoid using this prediction"

            confidence_degradation = min(risk_score * 30, 20)  # Max 20% degradation

            return RiskAssessment(
                risk_level=risk_level,
                risk_score=min(risk_score, 1.0),
                risk_factors=risk_factors,
                confidence_degradation=confidence_degradation,
                recommendation=recommendation,
            )

        except Exception as e:
            logger.error(f"Risk assessment failed: {e}")
            return RiskAssessment(
                risk_level=RiskLevel.MEDIUM,
                risk_score=0.5,
                risk_factors=["Risk assessment failed"],
                confidence_degradation=10.0,
                recommendation="Use with caution due to assessment error",
            )

    def _assess_feature_completeness(self, features: pd.DataFrame) -> float:
        """Assess the completeness and quality of input features"""
        try:
            if features.empty:
                return 0.0

            # Check for missing values
            missing_ratio = features.isnull().sum().sum() / (
                features.shape[0] * features.shape[1]
            )

            # Check for zero/default values in numeric columns
            numeric_cols = features.select_dtypes(include=[np.number]).columns
            zero_ratio = 0.0
            if len(numeric_cols) > 0:
                zero_count = (features[numeric_cols] == 0).sum().sum()
                zero_ratio = zero_count / (len(numeric_cols) * features.shape[0])

            # Calculate completeness score
            completeness = 1 - missing_ratio - (zero_ratio * 0.5)
            return max(completeness, 0.0)

        except Exception as e:
            logger.error(f"Feature completeness assessment failed: {e}")
            return 0.5

    async def _calculate_feature_importance(
        self, features: pd.DataFrame, selected_models: List[str], explanation_depth: str
    ) -> FeatureImportance:
        """Calculate feature importance for the prediction"""
        try:
            # For now, return a simplified feature importance
            # In production, would use SHAP or model-specific importance

            feature_scores = {}
            numeric_features = features.select_dtypes(include=[np.number]).columns

            for feature in numeric_features:
                # Simple scoring based on feature variance and magnitude
                feature_value = (
                    features[feature].iloc[0]
                    if not features[feature].isnull().iloc[0]
                    else 0
                )
                feature_scores[feature] = (
                    abs(float(feature_value)) * 0.1
                )  # Simplified scoring

            # Normalize scores
            max_score = max(feature_scores.values()) if feature_scores else 1.0
            if max_score > 0:
                feature_scores = {k: v / max_score for k, v in feature_scores.items()}

            return FeatureImportance(
                feature_scores=feature_scores,
                selection_method="simplified",
                total_features=len(features.columns),
                selected_features=len(feature_scores),
                importance_threshold=0.1,
            )

        except Exception as e:
            logger.error(f"Feature importance calculation failed: {e}")
            return FeatureImportance(
                feature_scores={},
                selection_method="error",
                total_features=0,
                selected_features=0,
                importance_threshold=0.0,
            )

    def _generate_cache_key(self, request: PredictionRequest) -> str:
        """Generate cache key for prediction request"""
        # Create a hash of the features and key parameters
        key_data = {
            "features": request.features,
            "strategy": request.strategy.value,
            "ensemble_size": request.ensemble_size,
        }
        key_string = json.dumps(key_data, sort_keys=True)
        return f"prediction_{hashlib.md5(key_string.encode()).hexdigest()}"

    async def _get_cached_prediction(
        self, cache_key: str, max_age_minutes: int
    ) -> Optional[EnsemblePrediction]:
        """Get cached prediction if available and not expired"""
        try:
            cached_data = await self.cache_manager.get_cache(cache_key)
            if not cached_data:
                return None

            # Check age
            cached_time = datetime.fromisoformat(cached_data["timestamp"])
            age = datetime.now() - cached_time

            if age.total_seconds() / 60 > max_age_minutes:
                return None

            # Reconstruct prediction object
            return EnsemblePrediction(
                prediction=cached_data["prediction"],
                confidence_score=cached_data["confidence_score"],
                confidence_interval=ConfidenceInterval(
                    **cached_data["confidence_interval"]
                ),
                risk_assessment=RiskAssessment(
                    risk_level=RiskLevel(cached_data["risk_assessment"]["risk_level"]),
                    risk_score=cached_data["risk_assessment"]["risk_score"],
                    risk_factors=cached_data["risk_assessment"]["risk_factors"],
                    confidence_degradation=cached_data["risk_assessment"][
                        "confidence_degradation"
                    ],
                    recommendation=cached_data["risk_assessment"]["recommendation"],
                ),
                feature_importance=(
                    FeatureImportance(**cached_data["feature_importance"])
                    if cached_data.get("feature_importance")
                    else None
                ),
                model_contributions=cached_data["model_contributions"],
                ensemble_performance=cached_data["ensemble_performance"],
                processing_metadata=cached_data["processing_metadata"],
                timestamp=cached_time,
            )

        except Exception as e:
            logger.error(f"Error retrieving cached prediction: {e}")
            return None

    async def _cache_prediction(self, cache_key: str, prediction: EnsemblePrediction):
        """Cache prediction result"""
        try:
            cache_data = {
                "prediction": prediction.prediction,
                "confidence_score": prediction.confidence_score,
                "confidence_interval": asdict(prediction.confidence_interval),
                "risk_assessment": asdict(prediction.risk_assessment),
                "feature_importance": (
                    asdict(prediction.feature_importance)
                    if prediction.feature_importance
                    else None
                ),
                "model_contributions": prediction.model_contributions,
                "ensemble_performance": prediction.ensemble_performance,
                "processing_metadata": prediction.processing_metadata,
                "timestamp": prediction.timestamp.isoformat(),
            }

            await self.cache_manager.set_cache(
                cache_key, cache_data, ttl=self.ensemble_cache_ttl
            )

        except Exception as e:
            logger.error(f"Error caching prediction: {e}")

    async def _update_model_performance(
        self, model_predictions: Dict[str, Dict[str, Any]], processing_time: float
    ):
        """Update model performance metrics"""
        try:
            for model_id, pred_data in model_predictions.items():
                if "error" in pred_data:
                    continue

                # Update or create performance metric
                if model_id not in self.model_performance:
                    self.model_performance[model_id] = ModelPerformanceMetric(
                        model_id=model_id,
                        accuracy=0.75,  # Default
                        latency_ms=pred_data["latency_ms"],
                        confidence=pred_data["confidence"],
                        predictions_count=1,
                        last_updated=datetime.now(),
                        drift_score=0.0,
                        stability_score=0.8,
                    )
                else:
                    performance = self.model_performance[model_id]
                    performance.latency_ms = (
                        performance.latency_ms + pred_data["latency_ms"]
                    ) / 2
                    performance.confidence = (
                        performance.confidence + pred_data["confidence"]
                    ) / 2
                    performance.predictions_count += 1
                    performance.last_updated = datetime.now()

                # Add to performance history
                self.performance_history[model_id].append(
                    {
                        "timestamp": datetime.now(),
                        "latency": pred_data["latency_ms"],
                        "confidence": pred_data["confidence"],
                    }
                )

        except Exception as e:
            logger.error(f"Error updating model performance: {e}")

    async def _log_prediction_event(
        self, prediction: EnsemblePrediction, request: PredictionRequest
    ):
        """Log prediction event to analytics engine"""
        try:
            event = StreamingEvent(
                event_id=f"prediction_{int(time.time()*1000)}",
                event_type=EventType.PREDICTION_REQUEST,
                timestamp=prediction.timestamp,
                source="advanced_prediction_framework",
                data={
                    "prediction": prediction.prediction,
                    "confidence_score": prediction.confidence_score,
                    "risk_level": prediction.risk_assessment.risk_level.value,
                    "strategy": request.strategy.value,
                    "models_used": len(prediction.model_contributions),
                    "processing_time_ms": prediction.processing_metadata.get(
                        "processing_time_ms", 0
                    ),
                },
            )

            await self.analytics_engine.publish_event(event)

        except Exception as e:
            logger.error(f"Error logging prediction event: {e}")

    def _initialize_risk_rules(self) -> Dict[str, Any]:
        """Initialize risk assessment rules"""
        return {
            "model_disagreement_threshold": 0.1,
            "confidence_threshold": 60.0,
            "performance_threshold": 0.7,
            "feature_completeness_threshold": 0.8,
            "max_confidence_degradation": 20.0,
        }

    async def get_framework_status(self) -> Dict[str, Any]:
        """Get comprehensive framework status"""
        try:
            return {
                "model_performance": {
                    model_id: {
                        "accuracy": perf.accuracy,
                        "latency_ms": perf.latency_ms,
                        "confidence": perf.confidence,
                        "predictions_count": perf.predictions_count,
                        "last_updated": perf.last_updated.isoformat(),
                        "stability_score": perf.stability_score,
                    }
                    for model_id, perf in self.model_performance.items()
                },
                "cache_stats": {
                    "cached_predictions": len(self.prediction_cache),
                    "cache_ttl_seconds": self.ensemble_cache_ttl,
                },
                "ensemble_strategies": list(self.ensemble_strategies.keys()),
                "risk_assessment": {"enabled": True, "rules": self.risk_rules},
                "feature_processors": {
                    "scalers": len(self.feature_processors["scalers"]),
                    "selectors": len(self.feature_processors["selectors"]),
                    "encoders": len(self.feature_processors["encoders"]),
                },
                "system_health": "healthy",
                "last_updated": datetime.now().isoformat(),
            }

        except Exception as e:
            logger.error(f"Error getting framework status: {e}")
            return {"error": str(e)}


# Factory function for easy initialization
async def create_advanced_prediction_framework(
    ml_pipeline: EnhancedMLModelPipeline,
    analytics_engine: RealtimeAnalyticsEngine,
    redis_service: RedisServiceOptimized,
    cache_manager: CacheManagerConsolidated,
    **kwargs,
) -> AdvancedPredictionFramework:
    """Factory function to create the advanced prediction framework"""
    framework = AdvancedPredictionFramework(
        ml_pipeline=ml_pipeline,
        analytics_engine=analytics_engine,
        redis_service=redis_service,
        cache_manager=cache_manager,
        **kwargs,
    )

    return framework
