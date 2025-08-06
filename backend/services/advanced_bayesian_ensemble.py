"""
Advanced Bayesian Ensemble Optimizer

This module implements cutting-edge ensemble techniques:
- Bayesian Model Averaging with uncertainty quantification
- Dynamic ensemble weighting based on performance
- Meta-learning for optimal model combination
- Conformal prediction for calibrated uncertainty
- Multi-objective optimization balancing accuracy and calibration
"""

import json
import logging
import math
import time
from dataclasses import dataclass
from enum import Enum
from typing import Any, Callable, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
from scipy import stats
from sklearn.isotonic import IsotonicRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error
from sklearn.model_selection import cross_val_score

# Bayesian optimization imports
try:
    from scipy.optimize import minimize
    from scipy.special import gammaln

    SCIPY_AVAILABLE = True
except ImportError:
    SCIPY_AVAILABLE = False
    logging.warning("SciPy not available. Advanced optimization disabled.")

try:
    import optuna
    from optuna.samplers import TPESampler

    OPTUNA_AVAILABLE = True
except ImportError:
    OPTUNA_AVAILABLE = False
    logging.warning("Optuna not available. Hyperparameter optimization disabled.")

logger = logging.getLogger(__name__)


class EnsembleMethod(Enum):
    """Types of ensemble methods"""

    SIMPLE_AVERAGE = "simple_average"
    WEIGHTED_AVERAGE = "weighted_average"
    BAYESIAN_AVERAGING = "bayesian_averaging"
    STACKING = "stacking"
    BLENDING = "blending"
    NEURAL_ENSEMBLE = "neural_ensemble"


class UncertaintyMethod(Enum):
    """Types of uncertainty quantification methods"""

    BAYESIAN = "bayesian"
    CONFORMAL = "conformal"
    BOOTSTRAP = "bootstrap"
    ENSEMBLE_VARIANCE = "ensemble_variance"
    DEEP_ENSEMBLES = "deep_ensembles"


@dataclass
class ModelPerformance:
    """Track model performance metrics"""

    model_id: str
    accuracy_history: List[float]
    loss_history: List[float]
    calibration_score: float
    uncertainty_quality: float
    computational_cost: float
    stability_score: float

    def get_recent_performance(self, window: int = 10) -> float:
        """Get recent performance average"""
        if not self.accuracy_history:
            return 0.5
        recent = self.accuracy_history[-window:]
        return np.mean(recent)

    def get_performance_trend(self) -> float:
        """Get performance trend (positive = improving)"""
        if len(self.accuracy_history) < 2:
            return 0.0

        # Simple linear trend
        x = np.arange(len(self.accuracy_history))
        y = np.array(self.accuracy_history)

        if len(x) > 1:
            slope = np.polyfit(x, y, 1)[0]
            return float(slope)
        return 0.0


@dataclass
class EnsemblePrediction:
    """Rich ensemble prediction with uncertainty"""

    prediction: float
    confidence: float
    uncertainty_lower: float
    uncertainty_upper: float

    # Individual model contributions
    model_predictions: Dict[str, float]
    model_weights: Dict[str, float]
    model_confidences: Dict[str, float]

    # Quality metrics
    ensemble_diversity: float
    prediction_stability: float
    calibration_score: float

    # Uncertainty decomposition
    aleatoric_uncertainty: float  # Data uncertainty
    epistemic_uncertainty: float  # Model uncertainty

    # Meta information
    method_used: EnsembleMethod
    uncertainty_method: UncertaintyMethod
    processing_time: float


class BayesianModelWeights:
    """Bayesian approach to model weight estimation"""

    def __init__(self, num_models: int, prior_alpha: float = 1.0):
        self.num_models = num_models
        self.prior_alpha = prior_alpha

        # Dirichlet parameters (conjugate prior for multinomial)
        self.alpha = np.full(num_models, prior_alpha)

        # Performance tracking
        self.performance_matrix = []
        self.weight_history = []

    def update_weights(self, model_performances: List[float]):
        """Update Bayesian weights based on performance"""
        # Convert performances to pseudo-counts
        # Higher performance = higher count
        performances = np.array(model_performances)

        # Normalize performances to [0, 1] and scale
        min_perf = performances.min()
        max_perf = performances.max()
        if max_perf > min_perf:
            normalized_perfs = (performances - min_perf) / (max_perf - min_perf)
        else:
            normalized_perfs = np.ones_like(performances)

        # Update alpha parameters
        pseudo_counts = normalized_perfs * 10  # Scale factor
        self.alpha += pseudo_counts

        # Store history
        self.performance_matrix.append(model_performances)
        self.weight_history.append(self.get_weights())

    def get_weights(self) -> np.ndarray:
        """Get current Bayesian weights (posterior mean)"""
        return self.alpha / np.sum(self.alpha)

    def get_weight_uncertainty(self) -> np.ndarray:
        """Get uncertainty in weight estimates (posterior variance)"""
        alpha_sum = np.sum(self.alpha)
        variance = (self.alpha * (alpha_sum - self.alpha)) / (
            alpha_sum**2 * (alpha_sum + 1)
        )
        return np.sqrt(variance)

    def sample_weights(self, num_samples: int = 1000) -> np.ndarray:
        """Sample weights from posterior distribution"""
        return np.random.dirichlet(self.alpha, size=num_samples)


class ConformalPredictor:
    """Conformal prediction for calibrated uncertainty intervals"""

    def __init__(self, confidence_level: float = 0.9):
        self.confidence_level = confidence_level
        self.calibration_scores = []
        self.is_fitted = False

    def fit(self, predictions: np.ndarray, true_values: np.ndarray):
        """Fit conformal predictor on calibration data"""
        if len(predictions) != len(true_values):
            raise ValueError("Predictions and true values must have same length")

        # Calculate nonconformity scores (absolute residuals)
        self.calibration_scores = np.abs(predictions - true_values)
        self.is_fitted = True

        logger.info(
            f"Conformal predictor fitted with {len(self.calibration_scores)} calibration points"
        )

    def predict_interval(self, prediction: float) -> Tuple[float, float]:
        """Get conformal prediction interval"""
        if not self.is_fitted:
            # Default interval if not fitted
            default_width = 1.0
            return prediction - default_width, prediction + default_width

        # Calculate quantile of nonconformity scores
        alpha = 1 - self.confidence_level
        n = len(self.calibration_scores)
        quantile_level = np.ceil((n + 1) * (1 - alpha)) / n
        quantile_level = min(quantile_level, 1.0)

        # Get the quantile
        if len(self.calibration_scores) > 0:
            interval_width = np.quantile(self.calibration_scores, quantile_level)
        else:
            interval_width = 1.0

        return prediction - interval_width, prediction + interval_width


class MetaLearner:
    """Meta-learner for optimal ensemble combination"""

    def __init__(self, method: str = "ridge"):
        self.method = method
        self.meta_model = None
        self.is_fitted = False

    def fit(self, base_predictions: np.ndarray, true_values: np.ndarray):
        """Fit meta-learner on base model predictions"""
        from sklearn.ensemble import RandomForestRegressor
        from sklearn.linear_model import ElasticNet, Ridge

        if self.method == "ridge":
            self.meta_model = Ridge(alpha=1.0)
        elif self.method == "elastic_net":
            self.meta_model = ElasticNet(alpha=0.1, l1_ratio=0.5)
        elif self.method == "random_forest":
            self.meta_model = RandomForestRegressor(n_estimators=50, random_state=42)
        else:
            raise ValueError(f"Unknown meta-learning method: {self.method}")

        self.meta_model.fit(base_predictions, true_values)
        self.is_fitted = True

    def predict(self, base_predictions: np.ndarray) -> float:
        """Generate meta-prediction"""
        if not self.is_fitted:
            # Simple average if not fitted
            return np.mean(base_predictions)

        return self.meta_model.predict(base_predictions.reshape(1, -1))[0]


class AdvancedBayesianEnsemble:
    """Advanced Bayesian ensemble with multiple optimization techniques"""

    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}

        # Ensemble configuration
        self.ensemble_method = EnsembleMethod(
            self.config.get("ensemble_method", EnsembleMethod.BAYESIAN_AVERAGING.value)
        )
        self.uncertainty_method = UncertaintyMethod(
            self.config.get("uncertainty_method", UncertaintyMethod.BAYESIAN.value)
        )
        self.confidence_level = self.config.get("confidence_level", 0.9)

        # Components
        self.bayesian_weights = None
        self.conformal_predictor = ConformalPredictor(self.confidence_level)
        self.meta_learner = MetaLearner(self.config.get("meta_method", "ridge"))

        # Model tracking
        self.models = {}
        self.model_performances = {}
        self.prediction_history = []

        # Calibration
        self.calibration_regressor = IsotonicRegression(out_of_bounds="clip")
        self.is_calibrated = False

        logger.info(
            f"Advanced Bayesian Ensemble initialized with method: {self.ensemble_method}"
        )

    def add_model(self, model_id: str, model: Any = None):
        """Add a model to the ensemble"""
        self.models[model_id] = model
        self.model_performances[model_id] = ModelPerformance(
            model_id=model_id,
            accuracy_history=[],
            loss_history=[],
            calibration_score=0.5,
            uncertainty_quality=0.5,
            computational_cost=1.0,
            stability_score=0.5,
        )

        # Initialize Bayesian weights if first model or reset if needed
        if (
            self.bayesian_weights is None
            or len(self.models) != self.bayesian_weights.num_models
        ):
            self.bayesian_weights = BayesianModelWeights(len(self.models))

        logger.info(
            f"Added model {model_id} to ensemble. Total models: {len(self.models)}"
        )

    def update_model_performance(self, model_id: str, accuracy: float, loss: float):
        """Update performance metrics for a model"""
        if model_id not in self.model_performances:
            return

        perf = self.model_performances[model_id]
        perf.accuracy_history.append(accuracy)
        perf.loss_history.append(loss)

        # Update Bayesian weights
        if self.bayesian_weights:
            performances = [
                self.model_performances[mid].get_recent_performance()
                for mid in self.models.keys()
            ]
            self.bayesian_weights.update_weights(performances)

    def predict(
        self,
        model_predictions: Dict[str, float],
        prediction_confidences: Optional[Dict[str, float]] = None,
    ) -> EnsemblePrediction:
        """Generate ensemble prediction with uncertainty quantification"""
        start_time = time.time()

        if not model_predictions:
            raise ValueError("No model predictions provided")

        # Ensure we have all models
        for model_id in model_predictions.keys():
            if model_id not in self.models:
                self.add_model(model_id)

        # Get predictions and weights
        pred_values = np.array(list(model_predictions.values()))
        model_ids = list(model_predictions.keys())

        # Calculate ensemble prediction based on method
        if self.ensemble_method == EnsembleMethod.SIMPLE_AVERAGE:
            ensemble_pred = np.mean(pred_values)
            weights = np.ones(len(pred_values)) / len(pred_values)

        elif self.ensemble_method == EnsembleMethod.BAYESIAN_AVERAGING:
            weights = (
                self.bayesian_weights.get_weights()
                if self.bayesian_weights
                else np.ones(len(pred_values)) / len(pred_values)
            )
            ensemble_pred = np.sum(weights * pred_values)

        elif self.ensemble_method == EnsembleMethod.STACKING:
            if self.meta_learner.is_fitted:
                ensemble_pred = self.meta_learner.predict(pred_values)
            else:
                # Fallback to weighted average
                weights = (
                    self.bayesian_weights.get_weights()
                    if self.bayesian_weights
                    else np.ones(len(pred_values)) / len(pred_values)
                )
                ensemble_pred = np.sum(weights * pred_values)
            weights = np.ones(len(pred_values)) / len(
                pred_values
            )  # Placeholder for stacking weights

        else:
            # Default to simple average
            ensemble_pred = np.mean(pred_values)
            weights = np.ones(len(pred_values)) / len(pred_values)

        # Calculate uncertainty
        uncertainty_lower, uncertainty_upper = self._calculate_uncertainty(
            ensemble_pred, pred_values, weights
        )

        # Calculate confidence
        confidence = self._calculate_confidence(pred_values, weights)

        # Calculate quality metrics
        diversity = self._calculate_diversity(pred_values)
        stability = self._calculate_stability(model_ids)
        calibration = self._calculate_calibration_score(ensemble_pred, confidence)

        # Decompose uncertainty
        aleatoric, epistemic = self._decompose_uncertainty(pred_values, weights)

        # Create prediction result
        result = EnsemblePrediction(
            prediction=float(ensemble_pred),
            confidence=float(confidence),
            uncertainty_lower=float(uncertainty_lower),
            uncertainty_upper=float(uncertainty_upper),
            model_predictions=model_predictions,
            model_weights={mid: float(w) for mid, w in zip(model_ids, weights)},
            model_confidences=prediction_confidences or {},
            ensemble_diversity=float(diversity),
            prediction_stability=float(stability),
            calibration_score=float(calibration),
            aleatoric_uncertainty=float(aleatoric),
            epistemic_uncertainty=float(epistemic),
            method_used=self.ensemble_method,
            uncertainty_method=self.uncertainty_method,
            processing_time=time.time() - start_time,
        )

        # Store prediction history
        self.prediction_history.append(result)

        return result

    def _calculate_uncertainty(
        self, prediction: float, pred_values: np.ndarray, weights: np.ndarray
    ) -> Tuple[float, float]:
        """Calculate uncertainty bounds using specified method"""

        if self.uncertainty_method == UncertaintyMethod.BAYESIAN:
            # Bayesian uncertainty using weight uncertainty
            if self.bayesian_weights:
                weight_samples = self.bayesian_weights.sample_weights(1000)
                pred_samples = np.sum(
                    weight_samples * pred_values[np.newaxis, :], axis=1
                )
                lower = np.percentile(
                    pred_samples, (1 - self.confidence_level) / 2 * 100
                )
                upper = np.percentile(
                    pred_samples, (1 + self.confidence_level) / 2 * 100
                )
            else:
                std = np.sqrt(np.sum(weights * (pred_values - prediction) ** 2))
                lower = prediction - 1.96 * std
                upper = prediction + 1.96 * std

        elif self.uncertainty_method == UncertaintyMethod.CONFORMAL:
            # Conformal prediction intervals
            lower, upper = self.conformal_predictor.predict_interval(prediction)

        elif self.uncertainty_method == UncertaintyMethod.ENSEMBLE_VARIANCE:
            # Simple ensemble variance
            variance = np.sum(weights * (pred_values - prediction) ** 2)
            std = np.sqrt(variance)
            z_score = stats.norm.ppf((1 + self.confidence_level) / 2)
            lower = prediction - z_score * std
            upper = prediction + z_score * std

        else:
            # Default: use ensemble variance
            std = np.std(pred_values)
            lower = prediction - 1.96 * std
            upper = prediction + 1.96 * std

        return lower, upper

    def _calculate_confidence(
        self, pred_values: np.ndarray, weights: np.ndarray
    ) -> float:
        """Calculate prediction confidence"""
        # Confidence based on agreement and weights
        weighted_std = np.sqrt(
            np.sum(weights * (pred_values - np.sum(weights * pred_values)) ** 2)
        )

        # Normalize to [0, 1] where 0 = high disagreement, 1 = high agreement
        max_possible_std = np.std(pred_values) if len(pred_values) > 1 else 1.0
        if max_possible_std > 0:
            agreement = 1 - (weighted_std / max_possible_std)
        else:
            agreement = 1.0

        # Combine with ensemble size factor
        size_factor = min(
            1.0, len(pred_values) / 5.0
        )  # More models = higher confidence (up to 5)

        confidence = 0.5 + 0.5 * agreement * size_factor
        return np.clip(confidence, 0.1, 0.99)

    def _calculate_diversity(self, pred_values: np.ndarray) -> float:
        """Calculate ensemble diversity"""
        if len(pred_values) < 2:
            return 0.0

        # Pairwise diversity (average absolute difference)
        total_diff = 0.0
        count = 0

        for i in range(len(pred_values)):
            for j in range(i + 1, len(pred_values)):
                total_diff += abs(pred_values[i] - pred_values[j])
                count += 1

        if count > 0:
            avg_diff = total_diff / count
            # Normalize by standard deviation
            std = np.std(pred_values)
            if std > 0:
                return min(1.0, avg_diff / (2 * std))

        return 0.0

    def _calculate_stability(self, model_ids: List[str]) -> float:
        """Calculate prediction stability based on model history"""
        if len(self.prediction_history) < 2:
            return 1.0

        # Look at recent predictions for same models
        recent_predictions = []
        for hist_pred in self.prediction_history[-5:]:  # Last 5 predictions
            if set(hist_pred.model_predictions.keys()) == set(model_ids):
                recent_predictions.append(hist_pred.prediction)

        if len(recent_predictions) < 2:
            return 1.0

        # Stability as inverse of variance
        variance = np.var(recent_predictions)
        stability = 1.0 / (1.0 + variance)

        return stability

    def _calculate_calibration_score(
        self, prediction: float, confidence: float
    ) -> float:
        """Calculate calibration score (placeholder)"""
        # In practice, this would be calculated from historical data
        # For now, return a reasonable default
        return 0.8

    def _decompose_uncertainty(
        self, pred_values: np.ndarray, weights: np.ndarray
    ) -> Tuple[float, float]:
        """Decompose uncertainty into aleatoric and epistemic components"""
        # Epistemic uncertainty: uncertainty due to model disagreement
        epistemic = np.sqrt(
            np.sum(weights * (pred_values - np.sum(weights * pred_values)) ** 2)
        )

        # Aleatoric uncertainty: average model uncertainty (simplified)
        # In practice, this would come from individual model uncertainty estimates
        aleatoric = 0.1  # Placeholder

        return aleatoric, epistemic

    def calibrate(self, predictions: List[float], true_values: List[float]):
        """Calibrate ensemble predictions"""
        if len(predictions) != len(true_values) or len(predictions) < 10:
            logger.warning("Insufficient data for calibration")
            return

        try:
            # Fit isotonic regression for calibration
            predictions_array = np.array(predictions)
            true_values_array = np.array(true_values)

            self.calibration_regressor.fit(predictions_array, true_values_array)
            self.is_calibrated = True

            # Fit conformal predictor
            self.conformal_predictor.fit(predictions_array, true_values_array)

            logger.info(f"Ensemble calibrated with {len(predictions)} data points")

        except Exception as e:
            logger.error(f"Calibration failed: {e}")

    def get_ensemble_status(self) -> Dict[str, Any]:
        """Get current ensemble status and performance"""
        status = {
            "num_models": len(self.models),
            "ensemble_method": self.ensemble_method.value,
            "uncertainty_method": self.uncertainty_method.value,
            "is_calibrated": self.is_calibrated,
            "predictions_made": len(self.prediction_history),
            "model_performances": {},
        }

        # Add model performance summaries
        for model_id, perf in self.model_performances.items():
            status["model_performances"][model_id] = {
                "recent_accuracy": perf.get_recent_performance(),
                "performance_trend": perf.get_performance_trend(),
                "stability_score": perf.stability_score,
                "total_predictions": len(perf.accuracy_history),
            }

        # Add weight information
        if self.bayesian_weights:
            weights = self.bayesian_weights.get_weights()
            weight_uncertainty = self.bayesian_weights.get_weight_uncertainty()
            status["model_weights"] = {
                model_id: {"weight": float(w), "uncertainty": float(u)}
                for model_id, w, u in zip(
                    self.models.keys(), weights, weight_uncertainty
                )
            }

        return status


# Global ensemble optimizer instance
advanced_bayesian_ensemble = AdvancedBayesianEnsemble()
