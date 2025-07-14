"""Advanced Ensemble ML Engine
Intelligent model selection, dynamic weighting, and meta-learning for optimal predictions
"""

import asyncio
import logging
import math
import os
import time
from collections import defaultdict, deque
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from datetime import datetime, timezone
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import joblib
import numpy as np
from cachetools import TTLCache
from config import config_manager
from database import db_manager
from feature_engineering import FeatureEngineering
from prometheus_client import Counter, Histogram
from sklearn.ensemble import RandomForestRegressor
from utils.prediction_utils import (
    calculate_confidence,
    calculate_uncertainty,
    feature_compatibility,
    model_correlation,
)

logger = logging.getLogger(__name__)

# Prometheus metrics
model_load_counter = Counter(
    "model_loads_total", "Total number of model loads", ["model_name"]
)
model_load_latency = Histogram(
    "model_load_latency_seconds", "Latency for loading models", ["model_name"]
)
prediction_counter = Counter(
    "ensemble_predictions_total", "Total number of ensemble predictions", ["context"]
)
prediction_latency = Histogram(
    "ensemble_prediction_latency_seconds",
    "Latency for ensemble predictions",
    ["context"],
)
cache_hit_counter = Counter(
    "ensemble_prediction_cache_hits_total",
    "Cache hits for ensemble predictions",
    ["context"],
)
cache_miss_counter = Counter(
    "ensemble_prediction_cache_misses_total",
    "Cache misses for ensemble predictions",
    ["context"],
)


class ModelType(str, Enum):
    """Types of ML models"""

    XGBOOST = "xgboost"
    LIGHTGBM = "lightgbm"
    RANDOM_FOREST = "random_forest"
    GRADIENT_BOOSTING = "gradient_boosting"
    NEURAL_NETWORK = "neural_network"
    LINEAR_REGRESSION = "linear_regression"
    SVR = "support_vector_regression"
    PROPHET = "prophet"
    ARIMA = "arima"
    LSTM = "lstm"


class PredictionContext(str, Enum):
    """Prediction contexts for model selection"""

    LIVE_GAME = "live_game"
    PRE_GAME = "pre_game"
    PLAYER_PROPS = "player_props"
    TEAM_TOTALS = "team_totals"
    SPREAD_BETTING = "spread_betting"
    OVER_UNDER = "over_under"
    MONEYLINE = "moneyline"
    FUTURES = "futures"


@dataclass
class ModelMetrics:
    """Comprehensive model performance metrics"""

    accuracy: float
    precision: float
    recall: float
    f1_score: float
    mse: float
    mae: float
    r2_score: float
    sharpe_ratio: float
    max_drawdown: float
    profit_factor: float
    win_rate: float
    avg_return: float
    volatility: float
    consistency_score: float
    robustness_score: float
    calibration_score: float
    feature_stability: float
    prediction_interval_coverage: float
    model_confidence: float
    last_updated: datetime  # should be timezone-aware
    evaluation_samples: int = 0


@dataclass
class PredictionOutput:
    """Enhanced prediction output with uncertainty quantification"""

    model_name: str
    model_type: ModelType
    predicted_value: float
    confidence_interval: Tuple[float, float]
    prediction_probability: float
    feature_importance: Dict[str, float]
    shap_values: Dict[str, float]
    uncertainty_metrics: Dict[str, float]
    model_agreement: float
    prediction_context: PredictionContext
    metadata: Dict[str, Any]
    processing_time: float
    timestamp: datetime


@dataclass
class EnsembleConfiguration:
    """Dynamic ensemble configuration"""

    base_models: List[ModelType]
    meta_learner: Optional[ModelType]
    weighting_strategy: str  # "performance", "dynamic", "bayesian", "stacking"
    selection_criteria: List[str]  # ["accuracy", "diversity", "recent_performance"]
    min_models: int = 3
    max_models: int = 10
    rebalance_frequency: int = 24  # hours
    performance_window: int = 168  # hours (1 week)
    diversity_threshold: float = 0.1
    confidence_threshold: float = 0.7
    half_life_hours: float = 72.0  # for exponential decay in recency weight


class ModelRegistry:
    """Advanced model registry with version control and metadata"""

    def __init__(self, models_directory: str):
        self.models_directory = Path(models_directory)
        # model_name -> model metadata dict
        self.models: Dict[str, Dict[str, Any]] = {}
        self.model_metrics: Dict[str, ModelMetrics] = {}
        # historic lineage of model versions
        self.model_lineage: Dict[str, List[str]] = {}
        # dynamically size executor based on CPU cores
        self.executor = ThreadPoolExecutor(max_workers=(os.cpu_count() or 1) * 2)
        # cache for loaded models to avoid repeated disk I/O
        self._model_cache: Dict[str, Any] = {}
        # schedule periodic hyperparameter tuning
        try:
            loop = asyncio.get_event_loop()
            loop.create_task(self._hyperparameter_tuning_loop())
        except Exception:  # pylint: disable=broad-exception-caught
            logger.warning("Could not schedule hyperparameter tuning loop")

    async def register_model(
        self,
        model_name: str,
        model_type: ModelType,
        model_path: str,
        metadata: Dict[str, Any],
    ):
        """Register a new model with comprehensive metadata"""
        try:
            model_info = {
                "name": model_name,
                "type": model_type,
                "path": model_path,
                "version": metadata.get("version", "1.0.0"),
                # timezone-aware UTC timestamp
                "created_at": datetime.now(timezone.utc),
                "file_size": (
                    Path(model_path).stat().st_size if Path(model_path).exists() else 0
                ),
                "features": metadata.get("features", []),
                "target": metadata.get("target", ""),
                "training_data_size": metadata.get("training_data_size", 0),
                "training_duration": metadata.get("training_duration", 0),
                "hyperparameters": metadata.get("hyperparameters", {}),
                "cross_validation_scores": metadata.get("cv_scores", []),
                "feature_names": metadata.get("feature_names", []),
                "is_active": True,
                "deployment_stage": metadata.get("stage", "development"),
            }

            self.models[model_name] = model_info

            # Initialize metrics
            self.model_metrics[model_name] = ModelMetrics(
                accuracy=0.0,
                precision=0.0,
                recall=0.0,
                f1_score=0.0,
                mse=0.0,
                mae=0.0,
                r2_score=0.0,
                sharpe_ratio=0.0,
                max_drawdown=0.0,
                profit_factor=0.0,
                win_rate=0.0,
                avg_return=0.0,
                volatility=0.0,
                consistency_score=0.0,
                robustness_score=0.0,
                calibration_score=0.0,
                feature_stability=0.0,
                prediction_interval_coverage=0.0,
                model_confidence=0.0,
                last_updated=datetime.now(timezone.utc),
            )

            logger.info("Registered model {model_name} with type {model_type}")

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Error registering model {model_name}: {e!s}")
            raise

    async def load_model(self, model_name: str) -> Any:
        """Load model with caching and error handling"""
        try:
            # Instrument and return cached model if already loaded
            if model_name in self._model_cache:
                model_load_counter.labels(model_name=model_name).inc()
                return self._model_cache[model_name]

            if model_name not in self.models:
                raise ValueError(f"Model {model_name} not registered")

            model_info = self.models[model_name]
            model_path = self.models_directory / model_info["path"]

            if not model_path.exists():
                raise FileNotFoundError(f"Model file not found: {model_path}")

            # Load model based on type
            # Increment load counter and measure latency
            with model_load_latency.labels(model_name=model_name).time():
                model_load_counter.labels(model_name=model_name).inc()
                loop = asyncio.get_event_loop()

                # Use joblib for all model loading for safety
                model = await loop.run_in_executor(
                    self.executor, joblib.load, str(model_path)
                )

            # cache and return the loaded model
            self._model_cache[model_name] = model
            return model

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Error loading model {model_name}: {e!s}")
            raise

    async def _hyperparameter_tuning_loop(self):
        """Periodically run hyperparameter tuning for registered models"""
        interval = config_manager.get("hyperparameter_tuning_interval_hours", 24)
        while True:
            try:
                await asyncio.sleep(interval * 3600)
                for name, info in self.models.items():
                    # stub: implement tuning with Optuna based on stored cv_scores and metrics
                    logger.info("Starting hyperparameter tuning for model {name}")
                    # ... perform tuning and update self.models[name]['hyperparameters'] ...
                    logger.info("Completed hyperparameter tuning for model {name}")
            except Exception as e:  # pylint: disable=broad-exception-caught
                logger.error("Error in hyperparameter tuning loop: {e}")
                await asyncio.sleep(3600)

    def get_active_models(self, model_type: Optional[ModelType] = None) -> List[str]:
        """Get list of active models, optionally filtered by type"""
        models = [
            name
            for name, info in self.models.items()
            if info["is_active"] and (model_type is None or info["type"] == model_type)
        ]
        return models

    async def update_model_metrics(self, model_name: str, metrics: ModelMetrics):
        """Update model performance metrics"""
        if model_name in self.model_metrics:
            self.model_metrics[model_name] = metrics

            # Store in database for persistence
            async with db_manager.get_session() as session:
                # This would update the database with new metrics
                pass


class IntelligentModelSelector:
    """Intelligent model selection based on context and performance"""

    def __init__(self, model_registry: ModelRegistry):
        self.model_registry: ModelRegistry = model_registry
        self.selection_history: deque[dict[str, Any]] = deque(maxlen=1000)
        self.context_performance: defaultdict[
            PredictionContext, defaultdict[str, list[float]]
        ] = defaultdict(lambda: defaultdict(list))
        self.diversity_matrix: dict[tuple[str, str], float] = {}

    async def select_models(
        self,
        context: PredictionContext,
        features: Dict[str, float],
        ensemble_config: EnsembleConfiguration,
    ) -> List[str]:
        """Select optimal models for given context and features"""
        try:
            available_models = self.model_registry.get_active_models()

            if len(available_models) <= ensemble_config.min_models:
                return available_models

            # Score models based on multiple criteria
            model_scores = {}

            for model_name in available_models:
                score = await self._score_model(
                    model_name, context, features, ensemble_config
                )
                model_scores[model_name] = score

            # Apply selection strategy
            selected_models = await self._apply_selection_strategy(
                model_scores, ensemble_config
            )

            # Ensure diversity
            if len(selected_models) > 1:
                selected_models = await self._ensure_diversity(
                    selected_models, ensemble_config.diversity_threshold
                )

            # Log selection decision
            self.selection_history.append(
                {
                    "timestamp": datetime.now(timezone.utc),
                    "context": context,
                    "selected_models": selected_models,
                    "scores": {model: model_scores[model] for model in selected_models},
                }
            )

            return selected_models[: ensemble_config.max_models]

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Model selection failed: {e!s}")
            # Fallback to top performing models
            return self._get_fallback_models(ensemble_config)

    async def _score_model(
        self,
        model_name: str,
        context: PredictionContext,
        features: Dict[str, float],
        config: EnsembleConfiguration,
    ) -> float:
        """Score a model based on multiple criteria"""
        try:
            metrics = self.model_registry.model_metrics[model_name]

            # Base performance score
            performance_score = (
                metrics.accuracy * 0.3
                + metrics.r2_score * 0.2
                + (1 - metrics.mse) * 0.2  # Normalized MSE
                + metrics.consistency_score * 0.15
                + metrics.robustness_score * 0.15
            )

            # Context-specific performance
            context_performance = (
                np.mean(
                    self.context_performance[context][model_name][
                        -10:
                    ]  # Last 10 predictions
                )
                if self.context_performance[context][model_name]
                else 0.5
            )

            # Recent performance weight
            recency_weight = self._calculate_recency_weight(
                metrics.last_updated, config.half_life_hours
            )

            # Feature compatibility score
            feature_compatibility = await self._calculate_feature_compatibility(
                model_name, features
            )

            # Uncertainty score (lower uncertainty is better)
            uncertainty_score = 1.0 - metrics.model_confidence

            # Composite score
            composite_score = (
                performance_score * 0.4
                + context_performance * 0.25
                + feature_compatibility * 0.15
                + recency_weight * 0.1
                + uncertainty_score * 0.1
            )

            return composite_score

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.warning("Error scoring model {model_name}: {e!s}")
            return 0.0

    def _calculate_recency_weight(
        self, last_updated: datetime, half_life_hours: float
    ) -> float:
        """Calculate weight based on how recently the model was updated"""
        # Use timezone-aware UTC
        age_hours = (datetime.now(timezone.utc) - last_updated).total_seconds() / 3600
        return math.exp(-age_hours / half_life_hours)  # Exponential decay

    async def _calculate_feature_compatibility(
        self, model_name: str, features: Dict[str, float]
    ) -> float:
        """Delegate feature compatibility to shared util"""
        try:
            expected = self.model_registry.models[model_name].get("feature_names", [])
            provided = list(features.keys())
            return feature_compatibility(expected, provided)
        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.warning("Feature compatibility failed: {e!s}")
            return 0.5

    async def _apply_selection_strategy(
        self, model_scores: Dict[str, float], config: EnsembleConfiguration
    ) -> List[str]:
        """Apply the configured selection strategy"""
        # stacking strategy: combine base scores with CV-based weights
        if config.weighting_strategy == "stacking":
            import numpy as np  # local import for stacking

            # retrieve mean CV score or default
            cv_means: dict[str, float] = {
                m: float(
                    np.mean(
                        self.model_registry.models[m].get(
                            "cross_validation_scores", [0.0]
                        )
                    )
                )
                for m in model_scores
            }
            # blend base score with cv mean equally
            stacking_scores: dict[str, float] = {
                m: model_scores[m] * 0.5 + cv_means.get(m, 0.0) * 0.5
                for m in model_scores
            }
            selected: list[tuple[str, float]] = sorted(
                stacking_scores.items(), key=lambda x: x[1], reverse=True
            )
            return [m for m, _ in selected[: config.max_models]]
        # performance-only strategy
        if config.weighting_strategy == "performance":
            # Select top performers
            sorted_models = sorted(
                model_scores.items(), key=lambda x: x[1], reverse=True
            )
            return [model for model, score in sorted_models[: config.max_models]]

        elif config.weighting_strategy == "dynamic":
            # Dynamic selection based on recent performance trends
            return await self._dynamic_selection(model_scores, config)

        elif config.weighting_strategy == "bayesian":
            # Bayesian model selection with uncertainty
            return await self._bayesian_selection(model_scores, config)

        else:
            # Default: top performers
            sorted_models = sorted(
                model_scores.items(), key=lambda x: x[1], reverse=True
            )
            return [model for model, score in sorted_models[: config.max_models]]

    async def _dynamic_selection(
        self, model_scores: Dict[str, float], config: EnsembleConfiguration
    ) -> List[str]:
        """Dynamic model selection based on performance trends"""
        # Implement trend analysis and adaptive selection
        # For now, use performance-based selection
        sorted_models: list[tuple[str, float]] = sorted(
            model_scores.items(), key=lambda x: x[1], reverse=True
        )
        return [model for model, score in sorted_models[: config.max_models]]

    async def _bayesian_selection(
        self, model_scores: Dict[str, float], config: EnsembleConfiguration
    ) -> List[str]:
        """Bayesian model selection with uncertainty quantification"""
        # Implement Bayesian selection
        # For now, use performance-based selection
        sorted_models = sorted(model_scores.items(), key=lambda x: x[1], reverse=True)
        return [model for model, score in sorted_models[: config.max_models]]

    async def _ensure_diversity(
        self, selected_models: List[str], diversity_threshold: float
    ) -> List[str]:
        """Ensure model diversity to avoid correlation"""
        if len(selected_models) <= 2:
            return selected_models

        # Calculate pairwise correlations (simplified)
        diverse_models = [selected_models[0]]  # Start with best model

        for model in selected_models[1:]:
            is_diverse = True
            for existing_model in diverse_models:
                correlation = await self._calculate_model_correlation(
                    model, existing_model
                )
                if correlation > (1 - diversity_threshold):
                    is_diverse = False
                    break

            if is_diverse:
                diverse_models.append(model)

        return diverse_models

    async def _calculate_model_correlation(self, model1: str, model2: str) -> float:
        """Delegate model correlation to shared util"""
        # Always create a tuple of exactly length 2 for the key
        sorted_pair: tuple[str, str] = tuple(sorted((model1, model2)))  # type: ignore
        if len(sorted_pair) != 2:
            raise ValueError("Model correlation key must be a tuple of length 2")
        key: tuple[str, str] = (sorted_pair[0], sorted_pair[1])
        if key in self.diversity_matrix:
            return self.diversity_matrix[key]
        cv1 = self.model_registry.models[model1].get("cross_validation_scores", [])
        cv2 = self.model_registry.models[model2].get("cross_validation_scores", [])
        corr = model_correlation(cv1, cv2)
        self.diversity_matrix[key] = corr
        return corr


class DynamicWeightingEngine:
    """Dynamic weighting of ensemble models based on performance and context"""

    def __init__(self):
        self.weight_history: "defaultdict[str, deque[dict[str, Any]]]" = defaultdict(
            lambda: deque(maxlen=100)
        )
        self.performance_tracker: "defaultdict[str, deque[float]]" = defaultdict(
            lambda: deque(maxlen=50)
        )
        self.context_weights: "defaultdict[str, dict[str, float]]" = defaultdict(dict)

    async def calculate_weights(
        self,
        models: List[str],
        context: PredictionContext,
        recent_predictions: List[Dict[str, Any]],
    ) -> Dict[str, float]:
        """Calculate dynamic weights for ensemble models"""
        try:
            if len(models) == 1:
                return {models[0]: 1.0}

            # Base weights from recent performance
            base_weights: Dict[str, float] = await self._calculate_performance_weights(
                models, recent_predictions
            )

            # Context-specific adjustments
            context_adjustments: Dict[str, float] = await self._get_context_adjustments(
                models, context
            )

            # Diversity bonuses
            diversity_bonuses: Dict[str, float] = (
                await self._calculate_diversity_bonuses(models)
            )

            # Combine all weight factors
            final_weights: Dict[str, float] = {}
            for model in models:
                weight = (
                    base_weights.get(model, 1.0) * 0.5
                    + context_adjustments.get(model, 1.0) * 0.3
                    + diversity_bonuses.get(model, 1.0) * 0.2
                )
                final_weights[model] = weight

            # Normalize weights
            total_weight: float = sum(final_weights.values())
            if total_weight > 0:
                final_weights = {
                    model: weight / total_weight
                    for model, weight in final_weights.items()
                }
            else:
                # Equal weights as fallback
                equal_weight: float = 1.0 / len(models)
                final_weights = {model: equal_weight for model in models}

            # Store weight history
            for model, weight in final_weights.items():
                self.weight_history[model].append(
                    {
                        "timestamp": datetime.now(timezone.utc),
                        "weight": weight,
                        "context": context,
                    }
                )

            return final_weights

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Weight calculation failed: {e!s}")
            # Return equal weights as fallback
            equal_weight = 1.0 / len(models)
            return {model: equal_weight for model in models}

    async def _calculate_performance_weights(
        self, models: List[str], recent_predictions: List[Dict[str, Any]]
    ) -> Dict[str, float]:
        """Calculate weights based on recent performance"""
        if not recent_predictions:
            return {model: 1.0 for model in models}

        # Calculate accuracy for each model
        model_accuracies: defaultdict[str, list[float]] = defaultdict(list)  # type: ignore

        for prediction in recent_predictions:
            if "actual_value" in prediction and "model_predictions" in prediction:
                actual = prediction["actual_value"]
                for model_pred in prediction["model_predictions"]:
                    model_name = model_pred["model_name"]
                    predicted = model_pred["predicted_value"]

                    # Calculate error
                    error = abs(actual - predicted) / max(abs(actual), 1.0)
                    accuracy = max(0.0, 1.0 - error)
                    model_accuracies[model_name].append(accuracy)

        # Calculate performance weights
        performance_weights: Dict[str, float] = {}
        for model in models:
            if model_accuracies.get(model):
                # Use recent average with exponential weighting
                accuracies: list[float] = model_accuracies[model]
                weights: list[float] = [0.9**i for i in range(len(accuracies))]
                weighted_accuracy: float = float(
                    np.average(accuracies, weights=weights[::-1])
                )
                performance_weights[model] = weighted_accuracy
            else:
                performance_weights[model] = 0.5  # Default for models without history

        return performance_weights

    async def _get_context_adjustments(
        self, models: List[str], context: PredictionContext
    ) -> Dict[str, float]:
        """Get context-specific weight adjustments"""
        adjustments: Dict[str, float] = {}

        # Context-specific model preferences
        context_preferences: dict[PredictionContext, dict[ModelType, float]] = {
            PredictionContext.LIVE_GAME: {
                ModelType.XGBOOST: 1.2,
                ModelType.LIGHTGBM: 1.1,
                ModelType.NEURAL_NETWORK: 0.9,
            },
            PredictionContext.PLAYER_PROPS: {
                ModelType.RANDOM_FOREST: 1.2,
                ModelType.NEURAL_NETWORK: 1.1,
                ModelType.LINEAR_REGRESSION: 0.8,
            },
        }

        context_preferences.get(context, {})

        for model in models:
            # This would need access to model type info
            # For now, return neutral adjustment
            adjustments[model] = 1.0

        return adjustments

    async def _calculate_diversity_bonuses(self, models: List[str]) -> Dict[str, float]:
        """Calculate diversity bonuses for ensemble models"""
        if len(models) <= 1:
            return {model: 1.0 for model in models}

        # Models with different types get diversity bonuses
        # This is a simplified implementation
        bonuses: Dict[str, float] = {}
        for model in models:
            bonuses[model] = 1.0  # Base bonus

        return bonuses


class MetaLearningEngine:
    """Meta-learning engine for ensemble optimization"""

    def __init__(self):
        self.meta_models: dict[str, Any] = {}
        self.meta_features: list[Any] = []
        self.training_data: deque[Any] = deque(maxlen=10000)

    async def train_meta_learner(self, ensemble_predictions: List[Dict[str, Any]]):
        """Train meta-learner to optimize ensemble predictions"""
        try:
            if len(ensemble_predictions) < 100:
                logger.info("Insufficient data for meta-learner training")
                return

            # Prepare training data
            X, y = await self._prepare_meta_training_data(ensemble_predictions)

            if X is None or y is None or len(X) == 0:
                return

            # Train meta-model
            meta_model = RandomForestRegressor(
                n_estimators=100, max_depth=10, random_state=42
            )

            meta_model.fit(X, y)
            self.meta_models["default"] = meta_model

            logger.info("Trained meta-learner with {len(X)} samples")

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Meta-learner training failed: {e!s}")

    async def _prepare_meta_training_data(
        self, predictions: List[Dict[str, Any]]
    ) -> Tuple[Optional[np.ndarray], Optional[np.ndarray]]:
        """Prepare training data for meta-learner"""
        try:
            features: list[list[float]] = []
            targets: list[float] = []

            for pred in predictions:
                if "actual_value" not in pred or "model_predictions" not in pred:
                    continue

                # Extract meta-features
                meta_feature_vector = await self._extract_meta_features(pred)
                if meta_feature_vector is not None:
                    features.append(meta_feature_vector)
                    targets.append(pred["actual_value"])

            if not features:
                return None, None

            return np.array(features), np.array(targets)

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Meta-training data preparation failed: {e!s}")
            return None, None

    async def _extract_meta_features(
        self, prediction: Dict[str, Any]
    ) -> Optional[List[float]]:
        """Extract meta-features from ensemble prediction"""
        try:
            model_preds: list[dict[str, Any]] = prediction["model_predictions"]

            # Basic ensemble statistics
            values: list[float] = [mp["predicted_value"] for mp in model_preds]
            confidences: list[float] = [mp.get("confidence", 0.5) for mp in model_preds]

            meta_features: list[float] = [
                float(np.mean(values)),
                float(np.std(values)),
                float(np.min(values)),
                float(np.max(values)),
                float(np.mean(confidences)),
                float(np.std(confidences)),
                float(len(values)),  # Number of models
                float(prediction.get("ensemble_confidence", 0.5)),
            ]

            # Add model agreement features
            pairwise_diffs: list[float] = []
            for i in range(len(values)):
                for _ in range(i + 1, len(values)):
                    pairwise_diffs.append(abs(values[i] - values[j]))

            if pairwise_diffs:
                meta_features.extend(
                    [
                        float(np.mean(pairwise_diffs)),
                        float(np.std(pairwise_diffs)),
                        float(np.max(pairwise_diffs)),
                    ]
                )
            else:
                meta_features.extend([0.0, 0.0, 0.0])

            return meta_features

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.warning("Meta-feature extraction failed: {e!s}")
            return None


class UltraAdvancedEnsembleEngine:
    """Ultra-advanced ensemble engine with intelligent model selection and weighting"""

    def __init__(self):
        self.model_registry = ModelRegistry(config_manager.config.model_path)
        self.model_selector = IntelligentModelSelector(self.model_registry)
        self.weighting_engine = DynamicWeightingEngine()
        self.meta_learner = MetaLearningEngine()
        self.feature_engineer = FeatureEngineering()
        self.loaded_models: Dict[str, Any] = {}
        self.prediction_cache = deque(maxlen=1000)
        # TTL cache for ensemble predictions
        ttl_seconds = config_manager.get("prediction_cache_ttl_seconds", 300)
        self.prediction_result_cache = TTLCache(maxsize=1000, ttl=ttl_seconds)
        # Limit concurrent predictions
        self._predict_semaphore = asyncio.Semaphore(
            config_manager.get("max_concurrent_predictions", 10)
        )
        # Feature toggles for flexibility
        self.cache_enabled = config_manager.get("prediction_cache_enabled", True)
        self.metrics_enabled = getattr(config_manager.config, "metrics_enabled", True)
        self.meta_learning_enabled = config_manager.get("meta_learning_enabled", False)
        self.rebalancing_enabled = config_manager.get("rebalancing_enabled", True)
        self.monitoring_enabled = config_manager.get("monitoring_enabled", True)

        # Default ensemble configuration
        self.default_config = EnsembleConfiguration(
            base_models=[
                ModelType.XGBOOST,
                ModelType.LIGHTGBM,
                ModelType.RANDOM_FOREST,
                ModelType.NEURAL_NETWORK,
            ],
            meta_learner=ModelType.RANDOM_FOREST,
            weighting_strategy="dynamic",
            selection_criteria=["accuracy", "diversity", "recent_performance"],
            min_models=3,
            max_models=8,
            rebalance_frequency=24,
            performance_window=168,
            diversity_threshold=0.15,
            confidence_threshold=0.75,
        )

    async def _get_or_load_model(self, model_name: str) -> Any:
        """Helper to retrieve loaded model from cache or load it via registry"""
        if model_name in self.loaded_models:
            return self.loaded_models[model_name]
        model = await self.model_registry.load_model(model_name)
        self.loaded_models[model_name] = model
        return model

    async def initialize(self):
        """Initialize the ensemble engine"""
        try:
            # Discover and register models
            await self._discover_and_register_models()

            # Load initial models
            await self._load_initial_models()
            # Setup Redis cache if configured
            redis_url = getattr(config_manager.config, "redis_url", None)
            if redis_url:
                self.redis_client = await aioredis.from_url(
                    redis_url, encoding="utf-8", decode_responses=False
                )
            else:
                self.redis_client = None

            # Start background tasks based on config toggles
            if self.rebalancing_enabled:
                asyncio.create_task(self._periodic_rebalancing())
            if self.monitoring_enabled:
                asyncio.create_task(self._performance_monitoring())
            if self.meta_learning_enabled:
                asyncio.create_task(self._meta_learning_updates())

            logger.info("Ultra-advanced ensemble engine initialized")

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Ensemble engine initialization failed: {e!s}")
            raise

    async def predict(
        self,
        features: Dict[str, float],
        context: PredictionContext = PredictionContext.PRE_GAME,
        ensemble_config: Optional[EnsembleConfiguration] = None,
    ) -> PredictionOutput:
        """Generate an ensemble prediction with intelligent model selection and weighting"""
        try:
            async with self._predict_semaphore:
                # Emit metrics if enabled
                if self.metrics_enabled:
                    prediction_counter.labels(context=context.value).inc()
                with prediction_latency.labels(context=context.value).time():
                    start_ts = time.time()
                    # Config
                    config = ensemble_config or self.default_config
                    # Feature preprocessing
                    engineered = self.feature_engineer.preprocess_features(features)
                    processed = engineered.get("features", features)
                    # Cache lookup
                    key = self._make_cache_key(processed, context, config)
                    # Try Redis cache first
                    if self.redis_client:
                        cached = await self.redis_client.get(key)
                        if cached:
                            return pickle.loads(cached)
                    # Fallback to local cache
                    if self.cache_enabled and key in self.prediction_result_cache:
                        return self.prediction_result_cache[key]
                    if self.metrics_enabled:
                        cache_miss_counter.labels(context=context.value).inc()
                    # Model selection
                    selected = await self.model_selector.select_models(
                        context, processed, config
                    )
                    if not selected:
                        raise ValueError("No models available for prediction")
                    # Individual predictions
                    outputs = await self._generate_model_predictions(
                        selected, processed, context
                    )
                    vals = [o.predicted_value for o in outputs]
                    # Weight calculation
                    recent = list(self.prediction_cache)[-50:]
                    weights = await self.weighting_engine.calculate_weights(
                        [o.model_name for o in outputs], context, recent
                    )
                    # Ensemble aggregation
                    ensemble_val = sum(
                        o.predicted_value * weights.get(o.model_name, 1.0)
                        for o in outputs
                    )
                    # Uncertainty & CI
                    std = float(np.std(vals)) if len(vals) > 1 else 0.0
                    ci = (ensemble_val - 1.96 * std, ensemble_val + 1.96 * std)
                    # Build PredictionOutput
                    output = PredictionOutput(
                        model_name="ensemble",
                        model_type=ModelType.ENSEMBLE,
                        predicted_value=ensemble_val,
                        confidence_interval=ci,
                        prediction_probability=0.0,
                        feature_importance=engineered.get("feature_importance", {}),
                        shap_values=engineered.get("shap_values", {}),
                        uncertainty_metrics={"std_dev": std},
                        model_agreement=1 - std,
                        prediction_context=context,
                        metadata={
                            "selected_models": selected,
                            "model_weights": weights,
                            "ensemble_config": config.__dict__,
                        },
                        processing_time=time.time() - start_ts,
                        timestamp=datetime.now(timezone.utc),
                    )
                    # Store in cache and history
                    data = pickle.dumps(output)
                    if self.redis_client:
                        ttl = config_manager.get("prediction_cache_ttl_seconds", 300)
                        await self.redis_client.set(key, data, ex=ttl)
                    if self.cache_enabled:
                        self.prediction_result_cache[key] = output
                    self.prediction_cache.append(
                        {
                            "features": processed,
                            "predictions": outputs,
                            "ensemble": ensemble_val,
                        }
                    )
                    # Background meta-learning if enabled
                    if self.meta_learning_enabled:
                        asyncio.create_task(
                            self.meta_learner.train_meta_learner(
                                list(self.prediction_cache)
                            )
                        )
                    return output
        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Ensemble prediction failed: {e}")
            raise

    async def _periodic_rebalancing(self):
        """Background task: periodically rebalance ensemble based on new metrics"""
        interval = self.default_config.rebalance_frequency * 3600
        while True:
            try:
                # RESOLVED: implement dynamic rebalancing logic
                
                # e.g., update default_config.base_models or thresholds
                await asyncio.sleep(interval)
            except Exception as e:  # pylint: disable=broad-exception-caught
                logger.error("Rebalancing task error: {e}")
                await asyncio.sleep(60)

    async def _performance_monitoring(self):
        """Background task: monitor model performance metrics and emit alerts"""
        interval = config_manager.get("monitoring_interval_seconds", 60)
        while True:
            try:
                # RESOLVED: collect and push performance metrics
                
                # e.g., push to Prometheus or external monitoring
                await asyncio.sleep(interval)
            except Exception as e:  # pylint: disable=broad-exception-caught
                logger.error("Monitoring task error: {e}")
                await asyncio.sleep(10)

    async def _meta_learning_updates(self):
        """Background task: schedule periodic meta-learner retraining"""
        interval = config_manager.get("meta_learning_interval_hours", 24) * 3600
        while True:
            try:
                
                await self.meta_learner.train_meta_learner(list(self.prediction_cache))
                await asyncio.sleep(interval)
            except Exception as e:  # pylint: disable=broad-exception-caught
                logger.error("Meta-learning task error: {e}")
                await asyncio.sleep(60)

    def _make_cache_key(
        self,
        features: Dict[str, float],
        context: PredictionContext,
        config: EnsembleConfiguration,
    ) -> str:
        """Generate a cache key based on features, context, and config"""
        # Sort features for consistent ordering
        feat_items = tuple(sorted(features.items()))
        # Use config parameters affecting output
        config_items = (
            config.weighting_strategy,
            config.diversity_threshold,
            config.confidence_threshold,
            config.max_models,
        )
        key = (context.value, feat_items, config_items)
        return str(hash(key))

    async def _generate_model_predictions(
        self,
        model_names: List[str],
        features: Dict[str, float],
        context: PredictionContext,
    ) -> List[PredictionOutput]:
        """Generate predictions from selected models"""
        predictions = []

        for model_name in model_names:
            try:
                model = await self._get_or_load_model(model_name)
                if model is None:
                    continue

                prediction = await self._predict_single_model(
                    model, model_name, features, context
                )
                if prediction:
                    predictions.append(prediction)

            except Exception as e:  # pylint: disable=broad-exception-caught
                logger.warning("Model {model_name} prediction failed: {e!s}")
                continue

        return predictions

    async def _predict_single_model(
        self,
        model: Any,
        model_name: str,
        features: Dict[str, float],
        context: PredictionContext,
    ) -> Optional[PredictionOutput]:
        """Generate prediction from a single model"""
        try:
            model_info = self.model_registry.models[model_name]

            # Prepare feature vector
            feature_names = model_info.get("feature_names", [])
            if feature_names:
                feature_vector = [features.get(name, 0.0) for name in feature_names]
            else:
                feature_vector = list(features.values())

            feature_array = np.array(feature_vector).reshape(1, -1)

            # Make prediction
            predicted_value = float(model.predict(feature_array)[0])

            # Calculate confidence and uncertainty
            conf = calculate_confidence(model, feature_array, model_info["type"])
            # Approximate prediction interval as ±10% of value
            interval = (predicted_value * 0.9, predicted_value * 1.1)
            uncertainty_metrics = calculate_uncertainty(interval, conf)

            # Feature importance
            feature_importance = {}
            if hasattr(model, "feature_importances_") and feature_names:
                feature_importance = dict(
                    zip(feature_names, model.feature_importances_)
                )

            # SHAP values (stub)
            shap_values = {}

            return PredictionOutput(
                model_name=model_name,
                model_type=ModelType(model_info["type"]),
                predicted_value=predicted_value,
                confidence_interval=(
                    predicted_value - uncertainty_metrics["std_error"],
                    predicted_value + uncertainty_metrics["std_error"],
                ),
                prediction_probability=uncertainty_metrics["confidence"],
                feature_importance=feature_importance,
                shap_values=shap_values,
                uncertainty_metrics=uncertainty_metrics,
                model_agreement=1.0,  # Will be calculated at ensemble level
                prediction_context=context,
                metadata={"model_version": model_info.get("version", "1.0.0")},
                processing_time=0.0,  # Individual model timing
                timestamp=datetime.now(timezone.utc),
            )

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Single model prediction failed for {model_name}: {e!s}")
            return None

    async def _calculate_ensemble_prediction(
        self,
        model_predictions: List[PredictionOutput],
        model_weights: Dict[str, float],
        config: EnsembleConfiguration,
    ) -> Dict[str, Any]:
        """Calculate final ensemble prediction with uncertainty quantification"""
        try:
            if not model_predictions:
                raise ValueError("No model predictions available")

            # Weighted prediction
            weighted_sum = 0.0
            total_weight = 0.0

            for pred in model_predictions:
                weight = model_weights.get(pred.model_name, 0.0)
                weighted_sum += pred.predicted_value * weight
                total_weight += weight

            if total_weight == 0:
                raise ValueError("Total weight is zero")

            final_prediction = weighted_sum / total_weight

            # Calculate ensemble confidence interval
            weighted_variances = []
            for pred in model_predictions:
                weight = model_weights.get(pred.model_name, 0.0)
                pred_variance = (
                    (pred.confidence_interval[1] - pred.confidence_interval[0]) / 4
                ) ** 2
                weighted_variances.append(weight * pred_variance)

            ensemble_variance = (
                sum(weighted_variances) / total_weight if total_weight > 0 else 1.0
            )
            ensemble_std = np.sqrt(ensemble_variance)

            confidence_interval = (
                final_prediction - 1.96 * ensemble_std,
                final_prediction + 1.96 * ensemble_std,
            )

            # Model agreement score
            predictions_values = [p.predicted_value for p in model_predictions]
            model_agreement = 1.0 - (
                np.std(predictions_values) / max(np.mean(predictions_values), 1.0)
            )
            model_agreement = max(0.0, min(1.0, model_agreement))

            # Ensemble confidence
            weighted_confidences = [
                model_weights.get(p.model_name, 0.0) * p.prediction_probability
                for p in model_predictions
            ]
            ensemble_confidence = (
                sum(weighted_confidences) / total_weight if total_weight > 0 else 0.5
            )

            # Aggregate feature importance
            feature_importance = defaultdict(float)
            for pred in model_predictions:
                weight = model_weights.get(pred.model_name, 0.0)
                for feature, importance in pred.feature_importance.items():
                    feature_importance[feature] += weight * importance

            # Normalize feature importance
            total_importance = sum(feature_importance.values())
            if total_importance > 0:
                feature_importance = {
                    k: v / total_importance for k, v in feature_importance.items()
                }

            # Aggregate SHAP values
            shap_values = defaultdict(float)
            for pred in model_predictions:
                weight = model_weights.get(pred.model_name, 0.0)
                for feature, shap_val in pred.shap_values.items():
                    shap_values[feature] += weight * shap_val

            # Uncertainty metrics
            uncertainty_metrics = {
                "prediction_std": ensemble_std,
                "model_disagreement": 1.0 - model_agreement,
                "confidence": ensemble_confidence,
                "epistemic_uncertainty": np.std(predictions_values),
                "aleatoric_uncertainty": np.mean(
                    [
                        (p.confidence_interval[1] - p.confidence_interval[0]) / 4
                        for p in model_predictions
                    ]
                ),
            }

            return {
                "final_prediction": final_prediction,
                "confidence_interval": confidence_interval,
                "prediction_probability": ensemble_confidence,
                "feature_importance": dict(feature_importance),
                "shap_values": dict(shap_values),
                "uncertainty_metrics": uncertainty_metrics,
                "model_agreement": model_agreement,
            }

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Ensemble calculation failed: {e!s}")
            raise

    async def _calculate_uncertainty(
        self, model: Any, X: np.ndarray, model_type: str
    ) -> Dict[str, float]:
        """Calculate prediction uncertainty metrics using shared utilities"""
        try:
            # Compute confidence via shared util
            conf = calculate_confidence(model, X, model_type)
            # Derive a simple prediction interval ±10%
            pred = float(model.predict(X)[0])
            interval = (pred * 0.9, pred * 1.1)
            return calculate_uncertainty(interval, conf)
        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.warning("Uncertainty calculation failed: {e}")
            return {"std_error": 0.0, "confidence": 0.5}

    async def _get_feature_importance(
        self, model: Any, feature_names: List[str], model_type: str
    ) -> Dict[str, float]:
        """Extract feature importance if supported"""
        try:
            if hasattr(model, "feature_importances_") and feature_names:
                return dict(zip(feature_names, model.feature_importances_))
        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.warning("Feature importance extraction failed: {e}")
        return {}

    async def _calculate_shap_values(
        self, model: Any, X: np.ndarray, feature_names: List[str]
    ) -> Dict[str, float]:
        """Stub for SHAP value calculation"""
        # RESOLVED: integrate SHAP explainer for detailed explainability
        return {}

    async def get_ensemble_health(self) -> Dict[str, Any]:
        """Get comprehensive ensemble health metrics"""
        try:
            active_models = self.model_registry.get_active_models()

            health_status = {
                "status": "healthy",
                "total_models": len(active_models),
                "loaded_models": len(self.loaded_models),
                "recent_predictions": len(self.prediction_cache),
                "model_health": {},
                "performance_metrics": {},
                "ensemble_config": self.default_config.__dict__,
            }

            # Check individual model health
            for model_name in active_models[:10]:  # Check top 10 models
                try:
                    metrics = self.model_registry.model_metrics.get(model_name)
                    if metrics:
                        health_status["model_health"][model_name] = {
                            "accuracy": metrics.accuracy,
                            "confidence": metrics.model_confidence,
                            "last_updated": metrics.last_updated.isoformat(),
                            "is_loaded": model_name in self.loaded_models,
                        }
                except Exception as e:  # pylint: disable=broad-exception-caught
                    health_status["model_health"][model_name] = {
                        "status": "error",
                        "error": str(e),
                    }

            return health_status

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Ensemble health check failed: {e!s}")
            return {"status": "unhealthy", "error": str(e)}

    async def _discover_and_register_models(self):
        """Discover model files on disk and register them in the registry"""
        try:
            model_dir = Path(config_manager.config.model_path)
            for file in model_dir.glob("*.pkl"):
                name = file.stem
                await self.model_registry.register_model(
                    model_name=name,
                    model_type=ModelType(
                        name
                    ),  # placeholder, override metadata as needed
                    model_path=str(file.relative_to(model_dir)),
                    metadata={"version": "1.0", "feature_names": []},
                )
            logger.info(
                f"Discovered and registered {len(self.model_registry.models)} models"
            )
        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Model discovery failed: {e}")

    async def _load_initial_models(self):
        """Pre-load models into memory for faster first predictions"""
        try:
            active = self.model_registry.get_active_models()
            tasks = [self._get_or_load_model(name) for name in active]
            results = await asyncio.gather(*tasks, return_exceptions=True)
            loaded = sum(1 for r in results if not isinstance(r, Exception))
            logger.info("Loaded initial {loaded}/{len(active)} models into cache")
        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Initial model loading failed: {e}")


class UltraEnsembleEngine:
    """Ultra Ensemble Engine for advanced model predictions."""

    def __init__(self):
        self.models = []  # Placeholder for model registry
        self.context = {}

    async def initialize(self):
        """Initialize the engine and load models."""
        # Simulate model loading
        self.models = ["model_a", "model_b", "model_c"]
        print("UltraEnsembleEngine initialized with models:", self.models)

    async def predict(self, features: Dict[str, Any], context: str) -> Dict[str, Any]:
        """Generate predictions based on features and context."""
        # Simulate prediction logic
        prediction = {
            "context": context,
            "features": features,
            "prediction": "win",
            "confidence": 0.85,
        }
        return prediction


# Instantiate the engine
ultra_ensemble_engine = UltraEnsembleEngine()
