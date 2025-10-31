"""
Modern ML Integration Service

This service provides seamless integration between the new modern ML components
and the existing UnifiedPredictionService, enabling gradual rollout and A/B testing.

Key Features:
- Backward compatibility with existing prediction pipeline
- A/B testing framework for modern vs legacy models
- Gradual feature rollout capabilities
- Performance monitoring and comparison
- Fallback mechanisms for reliability
"""

import asyncio
import json
import logging
import time
import uuid
from dataclasses import asdict, dataclass
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple, Union

import numpy as np
import pandas as pd

from .advanced_bayesian_ensemble import AdvancedBayesianEnsemble
from .automated_feature_engineering import AdvancedFeatureEngineering

# Import modern ML components
from .modern_ml_service import ModernMLService

# Import existing services (assuming they exist)
try:
    from .unified_prediction_service import UnifiedPredictionService

    UNIFIED_SERVICE_AVAILABLE = True
except ImportError:
    UNIFIED_SERVICE_AVAILABLE = False
    logging.warning("UnifiedPredictionService not available. Modern-only mode enabled.")

try:
    from .enhanced_prop_analysis_service import EnhancedPropAnalysisService

    PROP_ANALYSIS_AVAILABLE = True
except ImportError:
    PROP_ANALYSIS_AVAILABLE = False
    logging.warning("EnhancedPropAnalysisService not available.")

logger = logging.getLogger(__name__)


class ModelType(Enum):
    """Model type enumeration"""

    LEGACY = "legacy"
    MODERN = "modern"
    HYBRID = "hybrid"
    ENSEMBLE = "ensemble"


class PredictionStrategy(Enum):
    """Prediction strategy enumeration"""

    LEGACY_ONLY = "legacy_only"
    MODERN_ONLY = "modern_only"
    AB_TEST = "ab_test"
    ENSEMBLE = "ensemble"
    CHAMPION_CHALLENGER = "champion_challenger"


@dataclass
class PredictionResult:
    """Enhanced prediction result with modern ML metadata"""

    # Core prediction
    prediction: float
    confidence: float
    prediction_interval: Tuple[float, float]

    # Model information
    model_type: ModelType
    model_version: str
    feature_count: int

    # Uncertainty quantification
    epistemic_uncertainty: float
    aleatoric_uncertainty: float
    total_uncertainty: float

    # Explainability
    shap_values: Optional[Dict[str, float]] = None
    feature_importance: Optional[Dict[str, float]] = None
    attention_weights: Optional[Dict[str, float]] = None

    # Performance metadata
    processing_time: float = 0.0
    memory_usage: float = 0.0
    model_complexity: str = "medium"

    # A/B testing metadata
    experiment_id: Optional[str] = None
    treatment_group: Optional[str] = None

    # Quality metrics
    calibration_score: Optional[float] = None
    reliability_score: Optional[float] = None

    # Raw outputs for debugging
    raw_outputs: Optional[Dict[str, Any]] = None


@dataclass
class ABTestConfig:
    """A/B testing configuration"""

    enabled: bool = False
    modern_traffic_percentage: float = 0.1  # Start with 10%
    experiment_duration_days: int = 7
    minimum_samples: int = 100
    statistical_significance_threshold: float = 0.05
    performance_metrics: List[str] = None

    def __post_init__(self):
        if self.performance_metrics is None:
            self.performance_metrics = ["accuracy", "mae", "mse", "calibration"]


class ModernMLIntegration:
    """Main integration service orchestrating modern and legacy ML components"""

    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}

        # Initialize services
        self.modern_ml_service = ModernMLService(self.config.get("modern_ml", {}))
        self.bayesian_ensemble = AdvancedBayesianEnsemble(
            self.config.get("bayesian", {})
        )
        self.feature_engineering = AdvancedFeatureEngineering(
            self.config.get("feature_engineering", {})
        )

        # Initialize legacy services if available
        self.unified_service = None
        self.prop_analysis_service = None

        if UNIFIED_SERVICE_AVAILABLE:
            try:
                self.unified_service = UnifiedPredictionService()
            except Exception as e:
                logger.warning(f"Failed to initialize UnifiedPredictionService: {e}")

        if PROP_ANALYSIS_AVAILABLE:
            try:
                self.prop_analysis_service = EnhancedPropAnalysisService()
            except Exception as e:
                logger.warning(f"Failed to initialize EnhancedPropAnalysisService: {e}")

        # A/B testing configuration
        self.ab_test_config = ABTestConfig(**self.config.get("ab_test", {}))

        # Prediction strategy
        self.prediction_strategy = PredictionStrategy(
            self.config.get("prediction_strategy", "ab_test")
        )

        # Performance tracking
        self.performance_tracker = {
            "legacy_predictions": 0,
            "modern_predictions": 0,
            "ensemble_predictions": 0,
            "errors": 0,
            "total_processing_time": 0.0,
        }

        # Experiment tracking
        self.active_experiments = {}

        logger.info(
            f"ModernMLIntegration initialized with strategy: {self.prediction_strategy.value}"
        )

    async def predict(
        self, data: Dict[str, Any], sport: str = "MLB", prop_type: str = "player_prop"
    ) -> PredictionResult:
        """Main prediction method with intelligent routing"""

        start_time = time.time()

        try:
            # Determine prediction strategy
            strategy = self._determine_prediction_strategy(data, sport)

            if strategy == PredictionStrategy.LEGACY_ONLY:
                result = await self._predict_legacy(data, sport, prop_type)

            elif strategy == PredictionStrategy.MODERN_ONLY:
                result = await self._predict_modern(data, sport, prop_type)

            elif strategy == PredictionStrategy.AB_TEST:
                result = await self._predict_ab_test(data, sport, prop_type)

            elif strategy == PredictionStrategy.ENSEMBLE:
                result = await self._predict_ensemble(data, sport, prop_type)

            elif strategy == PredictionStrategy.CHAMPION_CHALLENGER:
                result = await self._predict_champion_challenger(data, sport, prop_type)

            else:
                # Fallback to modern
                result = await self._predict_modern(data, sport, prop_type)

            # Add processing time
            result.processing_time = time.time() - start_time

            # Update performance tracking
            self._update_performance_tracking(result, strategy)

            return result

        except Exception as e:
            logger.error(f"Prediction failed: {e}")
            return self._create_fallback_prediction(data, time.time() - start_time)

    async def batch_predict(
        self,
        data_list: List[Dict[str, Any]],
        sport: str = "MLB",
        prop_type: str = "player_prop",
    ) -> List[PredictionResult]:
        """Batch prediction with optimization"""

        if not data_list:
            return []

        # Group by prediction strategy for efficiency
        strategy_groups = {}
        for i, data in enumerate(data_list):
            strategy = self._determine_prediction_strategy(data, sport)
            if strategy not in strategy_groups:
                strategy_groups[strategy] = []
            strategy_groups[strategy].append((i, data))

        # Process each group
        results = [None] * len(data_list)

        for strategy, items in strategy_groups.items():
            indices, data_items = zip(*items)

            if strategy == PredictionStrategy.MODERN_ONLY:
                batch_results = await self._batch_predict_modern(
                    data_items, sport, prop_type
                )
            elif strategy == PredictionStrategy.ENSEMBLE:
                batch_results = await self._batch_predict_ensemble(
                    data_items, sport, prop_type
                )
            else:
                # Process individually for complex strategies
                batch_results = []
                for data in data_items:
                    result = await self.predict(data, sport, prop_type)
                    batch_results.append(result)

            # Assign results back to original indices
            for idx, result in zip(indices, batch_results):
                results[idx] = result

        return results

    async def _predict_modern(
        self, data: Dict[str, Any], sport: str, prop_type: str
    ) -> PredictionResult:
        """Modern ML prediction pipeline"""

        # Convert data to DataFrame
        df = pd.DataFrame([data])

        # Engineer features
        feature_set = self.feature_engineering.engineer_features(df, sport=sport)

        if feature_set.features.empty:
            return self._create_fallback_prediction(data, 0.0)

        # Get modern prediction
        modern_prediction = await self.modern_ml_service.predict(
            feature_set.features, sport=sport, prop_type=prop_type
        )

        # Get Bayesian ensemble prediction
        bayesian_result = await self.bayesian_ensemble.predict_with_uncertainty(
            feature_set.features, sport=sport
        )

        # Combine predictions
        final_prediction = (
            modern_prediction.get("prediction", 0)
            + bayesian_result.get("prediction", 0)
        ) / 2

        confidence = min(
            modern_prediction.get("confidence", 0.5),
            bayesian_result.get("confidence", 0.5),
        )

        # Extract uncertainty components
        uncertainty = bayesian_result.get("uncertainty", {})

        return PredictionResult(
            prediction=final_prediction,
            confidence=confidence,
            prediction_interval=bayesian_result.get(
                "prediction_interval", (final_prediction - 0.1, final_prediction + 0.1)
            ),
            model_type=ModelType.MODERN,
            model_version="modern_v1.0",
            feature_count=len(feature_set.features.columns),
            epistemic_uncertainty=uncertainty.get("epistemic", 0.1),
            aleatoric_uncertainty=uncertainty.get("aleatoric", 0.1),
            total_uncertainty=uncertainty.get("total", 0.1),
            shap_values=modern_prediction.get("shap_values"),
            feature_importance=dict(feature_set.feature_importance),
            model_complexity="high",
            raw_outputs={
                "modern_prediction": modern_prediction,
                "bayesian_result": bayesian_result,
                "feature_set": asdict(feature_set),
            },
        )

    async def _predict_legacy(
        self, data: Dict[str, Any], sport: str, prop_type: str
    ) -> PredictionResult:
        """Legacy prediction pipeline"""

        if not self.unified_service:
            logger.warning("Legacy service not available, falling back to modern")
            return await self._predict_modern(data, sport, prop_type)

        try:
            # Call legacy prediction service
            legacy_result = await self._call_legacy_service(data, sport, prop_type)

            return PredictionResult(
                prediction=legacy_result.get("prediction", 0),
                confidence=legacy_result.get("confidence", 0.5),
                prediction_interval=(
                    legacy_result.get("prediction", 0) - legacy_result.get("std", 0.1),
                    legacy_result.get("prediction", 0) + legacy_result.get("std", 0.1),
                ),
                model_type=ModelType.LEGACY,
                model_version="legacy_v1.0",
                feature_count=legacy_result.get("feature_count", 0),
                epistemic_uncertainty=0.1,  # Default values
                aleatoric_uncertainty=0.1,
                total_uncertainty=0.1,
                model_complexity="medium",
                raw_outputs={"legacy_result": legacy_result},
            )

        except Exception as e:
            logger.error(f"Legacy prediction failed: {e}")
            return await self._predict_modern(data, sport, prop_type)

    async def _predict_ab_test(
        self, data: Dict[str, Any], sport: str, prop_type: str
    ) -> PredictionResult:
        """A/B test prediction routing"""

        if not self.ab_test_config.enabled:
            return await self._predict_modern(data, sport, prop_type)

        # Generate user hash for consistent assignment
        user_id = data.get("player_name", str(uuid.uuid4()))
        user_hash = hash(user_id) % 100

        # Assign to treatment group
        if user_hash < (self.ab_test_config.modern_traffic_percentage * 100):
            result = await self._predict_modern(data, sport, prop_type)
            result.experiment_id = "modern_vs_legacy"
            result.treatment_group = "modern"
        else:
            result = await self._predict_legacy(data, sport, prop_type)
            result.experiment_id = "modern_vs_legacy"
            result.treatment_group = "legacy"

        return result

    async def _predict_ensemble(
        self, data: Dict[str, Any], sport: str, prop_type: str
    ) -> PredictionResult:
        """Ensemble prediction combining modern and legacy"""

        # Get both predictions
        modern_result = await self._predict_modern(data, sport, prop_type)
        legacy_result = await self._predict_legacy(data, sport, prop_type)

        # Ensemble weights (can be learned)
        modern_weight = 0.7
        legacy_weight = 0.3

        # Combine predictions
        ensemble_prediction = (
            modern_result.prediction * modern_weight
            + legacy_result.prediction * legacy_weight
        )

        ensemble_confidence = (
            modern_result.confidence * modern_weight
            + legacy_result.confidence * legacy_weight
        )

        # Combine prediction intervals
        modern_lower, modern_upper = modern_result.prediction_interval
        legacy_lower, legacy_upper = legacy_result.prediction_interval

        ensemble_lower = modern_lower * modern_weight + legacy_lower * legacy_weight
        ensemble_upper = modern_upper * modern_weight + legacy_upper * legacy_weight

        return PredictionResult(
            prediction=ensemble_prediction,
            confidence=ensemble_confidence,
            prediction_interval=(ensemble_lower, ensemble_upper),
            model_type=ModelType.ENSEMBLE,
            model_version="ensemble_v1.0",
            feature_count=max(modern_result.feature_count, legacy_result.feature_count),
            epistemic_uncertainty=modern_result.epistemic_uncertainty,
            aleatoric_uncertainty=modern_result.aleatoric_uncertainty,
            total_uncertainty=modern_result.total_uncertainty,
            shap_values=modern_result.shap_values,
            feature_importance=modern_result.feature_importance,
            model_complexity="high",
            raw_outputs={
                "modern_result": asdict(modern_result),
                "legacy_result": asdict(legacy_result),
                "ensemble_weights": {"modern": modern_weight, "legacy": legacy_weight},
            },
        )

    async def _predict_champion_challenger(
        self, data: Dict[str, Any], sport: str, prop_type: str
    ) -> PredictionResult:
        """Champion-challenger prediction with performance monitoring"""

        # Champion is current production model (legacy)
        champion_result = await self._predict_legacy(data, sport, prop_type)

        # Challenger is modern model
        challenger_result = await self._predict_modern(data, sport, prop_type)

        # Return champion prediction but log challenger for comparison
        self._log_challenger_prediction(champion_result, challenger_result, data)

        # Mark as champion-challenger experiment
        champion_result.experiment_id = "champion_challenger"
        champion_result.treatment_group = "champion"

        return champion_result

    async def _batch_predict_modern(
        self, data_list: List[Dict[str, Any]], sport: str, prop_type: str
    ) -> List[PredictionResult]:
        """Optimized batch prediction for modern models"""

        if not data_list:
            return []

        # Convert to DataFrame
        df = pd.DataFrame(data_list)

        # Engineer features once for all samples
        feature_set = self.feature_engineering.engineer_features(df, sport=sport)

        if feature_set.features.empty:
            return [self._create_fallback_prediction(data, 0.0) for data in data_list]

        # Batch modern prediction
        modern_predictions = await self.modern_ml_service.batch_predict(
            feature_set.features, sport=sport, prop_type=prop_type
        )

        # Batch Bayesian ensemble prediction
        bayesian_results = await self.bayesian_ensemble.batch_predict_with_uncertainty(
            feature_set.features, sport=sport
        )

        # Combine results
        results = []
        for i, data in enumerate(data_list):
            modern_pred = modern_predictions[i] if i < len(modern_predictions) else {}
            bayesian_pred = bayesian_results[i] if i < len(bayesian_results) else {}

            final_prediction = (
                modern_pred.get("prediction", 0) + bayesian_pred.get("prediction", 0)
            ) / 2

            confidence = min(
                modern_pred.get("confidence", 0.5), bayesian_pred.get("confidence", 0.5)
            )

            uncertainty = bayesian_pred.get("uncertainty", {})

            result = PredictionResult(
                prediction=final_prediction,
                confidence=confidence,
                prediction_interval=bayesian_pred.get(
                    "prediction_interval",
                    (final_prediction - 0.1, final_prediction + 0.1),
                ),
                model_type=ModelType.MODERN,
                model_version="modern_v1.0",
                feature_count=len(feature_set.features.columns),
                epistemic_uncertainty=uncertainty.get("epistemic", 0.1),
                aleatoric_uncertainty=uncertainty.get("aleatoric", 0.1),
                total_uncertainty=uncertainty.get("total", 0.1),
                shap_values=modern_pred.get("shap_values"),
                feature_importance=dict(feature_set.feature_importance),
                model_complexity="high",
            )

            results.append(result)

        return results

    async def _batch_predict_ensemble(
        self, data_list: List[Dict[str, Any]], sport: str, prop_type: str
    ) -> List[PredictionResult]:
        """Optimized batch ensemble prediction"""

        # Get batch predictions from both models
        modern_results = await self._batch_predict_modern(data_list, sport, prop_type)

        # For legacy, we might need individual calls if no batch method exists
        legacy_results = []
        for data in data_list:
            legacy_result = await self._predict_legacy(data, sport, prop_type)
            legacy_results.append(legacy_result)

        # Combine into ensemble
        ensemble_results = []
        modern_weight = 0.7
        legacy_weight = 0.3

        for modern_result, legacy_result in zip(modern_results, legacy_results):
            ensemble_prediction = (
                modern_result.prediction * modern_weight
                + legacy_result.prediction * legacy_weight
            )

            ensemble_confidence = (
                modern_result.confidence * modern_weight
                + legacy_result.confidence * legacy_weight
            )

            ensemble_result = PredictionResult(
                prediction=ensemble_prediction,
                confidence=ensemble_confidence,
                prediction_interval=(
                    modern_result.prediction_interval[0] * modern_weight
                    + legacy_result.prediction_interval[0] * legacy_weight,
                    modern_result.prediction_interval[1] * modern_weight
                    + legacy_result.prediction_interval[1] * legacy_weight,
                ),
                model_type=ModelType.ENSEMBLE,
                model_version="ensemble_v1.0",
                feature_count=max(
                    modern_result.feature_count, legacy_result.feature_count
                ),
                epistemic_uncertainty=modern_result.epistemic_uncertainty,
                aleatoric_uncertainty=modern_result.aleatoric_uncertainty,
                total_uncertainty=modern_result.total_uncertainty,
                shap_values=modern_result.shap_values,
                feature_importance=modern_result.feature_importance,
                model_complexity="high",
            )

            ensemble_results.append(ensemble_result)

        return ensemble_results

    def _determine_prediction_strategy(
        self, data: Dict[str, Any], sport: str
    ) -> PredictionStrategy:
        """Determine which prediction strategy to use"""

        # Check if modern models are available for this sport
        if not self.modern_ml_service.is_available_for_sport(sport):
            return PredictionStrategy.LEGACY_ONLY

        # Check if legacy models are available
        if not self.unified_service:
            return PredictionStrategy.MODERN_ONLY

        # Use configured strategy
        return self.prediction_strategy

    async def _call_legacy_service(
        self, data: Dict[str, Any], sport: str, prop_type: str
    ) -> Dict[str, Any]:
        """Call legacy prediction service"""

        if self.unified_service:
            # Adapt data format for legacy service
            legacy_data = self._adapt_data_for_legacy(data, sport, prop_type)
            return await self.unified_service.predict(legacy_data)
        else:
            # Return mock legacy result
            return {
                "prediction": data.get("current_value", 0) * 1.1,
                "confidence": 0.6,
                "std": 0.15,
                "feature_count": 10,
            }

    def _adapt_data_for_legacy(
        self, data: Dict[str, Any], sport: str, prop_type: str
    ) -> Dict[str, Any]:
        """Adapt data format for legacy prediction service"""
        # This would contain logic to transform modern data format to legacy format
        return data

    def _create_fallback_prediction(
        self, data: Dict[str, Any], processing_time: float
    ) -> PredictionResult:
        """Create fallback prediction when other methods fail"""

        # Simple fallback: use current value with small adjustment
        base_value = data.get("current_value", 0)
        if base_value == 0:
            base_value = data.get("prop_value", 0)

        fallback_prediction = base_value * 1.05  # 5% increase as fallback

        return PredictionResult(
            prediction=fallback_prediction,
            confidence=0.3,  # Low confidence for fallback
            prediction_interval=(fallback_prediction * 0.9, fallback_prediction * 1.1),
            model_type=ModelType.LEGACY,
            model_version="fallback_v1.0",
            feature_count=0,
            epistemic_uncertainty=0.3,
            aleatoric_uncertainty=0.2,
            total_uncertainty=0.5,
            processing_time=processing_time,
            model_complexity="low",
            reliability_score=0.3,
        )

    def _update_performance_tracking(
        self, result: PredictionResult, strategy: PredictionStrategy
    ):
        """Update performance tracking metrics"""

        if result.model_type == ModelType.LEGACY:
            self.performance_tracker["legacy_predictions"] += 1
        elif result.model_type == ModelType.MODERN:
            self.performance_tracker["modern_predictions"] += 1
        elif result.model_type == ModelType.ENSEMBLE:
            self.performance_tracker["ensemble_predictions"] += 1

        self.performance_tracker["total_processing_time"] += result.processing_time

        if result.confidence < 0.3:
            self.performance_tracker["errors"] += 1

    def _log_challenger_prediction(
        self,
        champion: PredictionResult,
        challenger: PredictionResult,
        data: Dict[str, Any],
    ):
        """Log challenger prediction for performance comparison"""

        comparison_data = {
            "timestamp": datetime.now().isoformat(),
            "data_id": data.get("id", str(uuid.uuid4())),
            "champion_prediction": champion.prediction,
            "challenger_prediction": challenger.prediction,
            "champion_confidence": champion.confidence,
            "challenger_confidence": challenger.confidence,
            "prediction_difference": abs(champion.prediction - challenger.prediction),
            "confidence_difference": abs(champion.confidence - challenger.confidence),
        }

        # In production, this would go to a database or analytics service
        logger.info(f"Champion-Challenger comparison: {json.dumps(comparison_data)}")

    def get_performance_stats(self) -> Dict[str, Any]:
        """Get performance statistics"""

        total_predictions = (
            self.performance_tracker["legacy_predictions"]
            + self.performance_tracker["modern_predictions"]
            + self.performance_tracker["ensemble_predictions"]
        )

        stats = self.performance_tracker.copy()
        stats["total_predictions"] = total_predictions

        if total_predictions > 0:
            stats["legacy_percentage"] = (
                self.performance_tracker["legacy_predictions"] / total_predictions * 100
            )
            stats["modern_percentage"] = (
                self.performance_tracker["modern_predictions"] / total_predictions * 100
            )
            stats["ensemble_percentage"] = (
                self.performance_tracker["ensemble_predictions"]
                / total_predictions
                * 100
            )
            stats["error_rate"] = (
                self.performance_tracker["errors"] / total_predictions * 100
            )
            stats["avg_processing_time"] = (
                self.performance_tracker["total_processing_time"] / total_predictions
            )
        else:
            stats.update(
                {
                    "legacy_percentage": 0,
                    "modern_percentage": 0,
                    "ensemble_percentage": 0,
                    "error_rate": 0,
                    "avg_processing_time": 0,
                }
            )

        # Add feature engineering stats
        stats["feature_engineering_stats"] = (
            self.feature_engineering.get_engineering_stats()
        )

        return stats

    def update_ab_test_config(self, new_config: Dict[str, Any]):
        """Update A/B test configuration"""

        for key, value in new_config.items():
            if hasattr(self.ab_test_config, key):
                setattr(self.ab_test_config, key, value)

        logger.info(f"A/B test config updated: {asdict(self.ab_test_config)}")

    def switch_prediction_strategy(self, new_strategy: str):
        """Switch prediction strategy"""

        try:
            self.prediction_strategy = PredictionStrategy(new_strategy)
            logger.info(f"Prediction strategy switched to: {new_strategy}")
        except ValueError:
            logger.error(f"Invalid prediction strategy: {new_strategy}")
            raise ValueError(
                f"Invalid strategy. Must be one of: {[s.value for s in PredictionStrategy]}"
            )


# Global integration service
modern_ml_integration = ModernMLIntegration()
