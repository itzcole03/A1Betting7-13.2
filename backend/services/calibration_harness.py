"""
Calibration Harness for Model Integrity Phase
==============================================

Core component for tracking and validating model accuracy against real outcomes.
Implements calibration curves, prediction tracking, and model performance metrics.

Key Features:
- Real-time calibration scoring per prop type
- Prediction vs outcome tracking
- Confidence interval validation
- Model drift detection
- Performance alerting system

Focus on reliability metrics for the core value loop.
"""

import asyncio
import json
import math
import time
from datetime import datetime, timedelta
from enum import Enum
from dataclasses import dataclass, asdict
from typing import Dict, List, Optional, Tuple, Any
from collections import defaultdict, deque
import statistics
import logging

from ..services.unified_cache_service import unified_cache_service
from ..services.unified_error_handler import unified_error_handler

logger = logging.getLogger("calibration_harness")


class PropType(Enum):
    """Prop type categories for calibration tracking"""
    PITCHER_STRIKEOUTS = "pitcher_strikeouts"
    BATTER_HITS = "batter_hits" 
    RUNS_TOTAL = "runs_total"
    HOME_RUNS = "home_runs"
    RBIS = "rbis"
    STOLEN_BASES = "stolen_bases"
    TEAM_RUNS = "team_runs"
    GAME_TOTAL = "game_total"
    SPREAD = "spread"
    MONEYLINE = "moneyline"


class OutcomeType(Enum):
    """Types of prop outcomes"""
    OVER = "over"
    UNDER = "under"
    WIN = "win"
    LOSS = "loss"
    PUSH = "push"  # Tie/void bet


class GamePhase(Enum):
    """Game phase for calibration context separation"""
    PRE_GAME = "pre_game"      # Before game starts
    LIVE_EARLY = "live_early"  # First 3 innings
    LIVE_MID = "live_mid"      # Innings 4-6
    LIVE_LATE = "live_late"    # Innings 7+
    POST_GAME = "post_game"    # Game completed


@dataclass
class Prediction:
    """Individual prediction record for calibration tracking with enhanced context"""
    id: str
    game_id: str
    prop_type: PropType
    prop_line: float  # The line/threshold
    predicted_value: float  # Our model's prediction
    confidence_score: float  # 0-1 confidence in prediction
    predicted_probability: float  # Probability of OVER (0-1)
    
    # Enhanced tracking fields
    model_version: str = "1.0"
    feature_set_hash: Optional[str] = None  # Hash of features used
    game_phase: GamePhase = GamePhase.PRE_GAME
    prediction_timestamp: Optional[float] = None  # Precise prediction time
    
    # Outcome fields
    actual_value: Optional[float] = None  # Actual outcome value
    outcome: Optional[OutcomeType] = None  # OVER/UNDER result
    settled_at: Optional[float] = None  # When outcome was determined
    
    # Legacy fields (for backward compatibility)
    created_at: Optional[float] = None
    context: Optional[Dict[str, Any]] = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = time.time()
        if self.prediction_timestamp is None:
            self.prediction_timestamp = self.created_at
        if self.context is None:
            self.context = {}
        if self.feature_set_hash is None:
            # Generate a simple hash from context if available
            feature_str = json.dumps(self.context.get("features", {}), sort_keys=True)
            self.feature_set_hash = str(hash(feature_str))
    
    def is_settled(self) -> bool:
        """Check if this prediction has been settled"""
        return self.actual_value is not None and self.outcome is not None
    
    def was_correct(self) -> Optional[bool]:
        """Check if prediction was correct (None if not settled)"""
        if not self.is_settled():
            return None
        
        # For over/under props
        if self.outcome == OutcomeType.PUSH:
            return None  # No win/loss on pushes
        
        predicted_over = self.predicted_probability > 0.5
        actual_over = self.outcome == OutcomeType.OVER
        
        return predicted_over == actual_over
    
    def get_prediction_error(self) -> Optional[float]:
        """Calculate prediction error magnitude"""
        if not self.is_settled() or self.actual_value is None:
            return None
        return abs(self.predicted_value - self.actual_value)
    
    def is_outlier(self, threshold: float = 2.0) -> Optional[bool]:
        """Check if prediction is an outlier (error > threshold * typical error)"""
        error = self.get_prediction_error()
        if error is None:
            return None
        # For now, use simple threshold - could be enhanced with rolling statistics
        return error > threshold


@dataclass 
class CalibrationBin:
    """Calibration bin for grouping predictions by confidence"""
    confidence_range: Tuple[float, float]  # e.g., (0.6, 0.7)
    predictions: List[str]  # Prediction IDs
    correct_count: int = 0
    total_count: int = 0
    
    @property
    def accuracy(self) -> float:
        """Accuracy within this confidence bin"""
        if self.total_count == 0:
            return 0.0
        return self.correct_count / self.total_count
    
    @property
    def expected_accuracy(self) -> float:
        """Expected accuracy based on confidence range midpoint"""
        return (self.confidence_range[0] + self.confidence_range[1]) / 2
    
    @property
    def calibration_error(self) -> float:
        """Absolute difference between expected and actual accuracy"""
        return abs(self.accuracy - self.expected_accuracy)


@dataclass
class PropTypeMetrics:
    """Calibration metrics for a specific prop type with enhanced temporal tracking"""
    prop_type: PropType
    total_predictions: int = 0
    settled_predictions: int = 0
    correct_predictions: int = 0
    
    # Calibration metrics
    calibration_bins: Optional[List[CalibrationBin]] = None
    mean_calibration_error: float = 0.0
    brier_score: float = 0.0  # Lower is better (0 = perfect)
    
    # Performance metrics
    mean_absolute_error: float = 0.0  # For numeric predictions
    mean_squared_error: float = 0.0
    
    # Temporal metrics with rolling windows
    last_updated: Optional[float] = None
    rolling_window_predictions: Optional[deque] = None  # Last N predictions for rolling stats
    rolling_window_size: int = 500  # Rolling window size
    
    # NEW: Reliability tracking
    reliability_bins: Optional[List[Dict[str, Any]]] = None  # Expected vs observed by confidence
    model_drift_score: float = 0.0  # Drift detection metric
    outlier_count: int = 0  # Number of prediction outliers
    
    # NEW: Game phase separation
    phase_metrics: Optional[Dict[str, Dict[str, float]]] = None
    
    def __post_init__(self):
        if self.calibration_bins is None:
            self.calibration_bins = []
        if self.reliability_bins is None:
            self.reliability_bins = []
        if self.last_updated is None:
            self.last_updated = time.time()
        if self.rolling_window_predictions is None:
            self.rolling_window_predictions = deque(maxlen=self.rolling_window_size)
        if self.phase_metrics is None:
            self.phase_metrics = {
                phase.value: {"accuracy": 0.0, "count": 0, "brier_score": 0.0}
                for phase in GamePhase
            }
    
    @property
    def accuracy(self) -> float:
        """Overall accuracy for this prop type"""
        if self.settled_predictions == 0:
            return 0.0
        return self.correct_predictions / self.settled_predictions
    
    @property 
    def settlement_rate(self) -> float:
        """What % of predictions have been settled"""
        if self.total_predictions == 0:
            return 0.0
        return self.settled_predictions / self.total_predictions
    
    @property
    def rolling_accuracy(self) -> float:
        """Accuracy over rolling window"""
        if not self.rolling_window_predictions:
            return 0.0
        
        settled_in_window = [p for p in self.rolling_window_predictions if p.get("is_settled")]
        if not settled_in_window:
            return 0.0
            
        correct_in_window = [p for p in settled_in_window if p.get("was_correct")]
        return len(correct_in_window) / len(settled_in_window)
    
    def get_phase_accuracy(self, phase: GamePhase) -> float:
        """Get accuracy for specific game phase"""
        if not self.phase_metrics:
            return 0.0
        phase_data = self.phase_metrics.get(phase.value, {})
        count = phase_data.get("count", 0)
        if count == 0:
            return 0.0
        return phase_data.get("accuracy", 0.0)


@dataclass
class ReliabilityBin:
    """Reliability bin for expected vs observed probability analysis"""
    confidence_range: Tuple[float, float]
    expected_prob: float  # Average predicted probability in bin
    observed_freq: float  # Actual frequency of positive outcomes
    sample_count: int
    reliability_error: float  # |expected - observed|
    
    @property
    def is_well_calibrated(self, threshold: float = 0.05) -> bool:
        """Check if bin is well calibrated within threshold"""
        return self.reliability_error <= threshold


class CalibrationHarness:
    """
    Tracks model calibration and performance across different prop types
    
    Core functionality:
    1. Record predictions with confidence scores
    2. Update with actual outcomes when available
    3. Calculate calibration curves and performance metrics
    4. Detect model drift and performance degradation
    5. Alert on calibration issues
    """
    
    def __init__(self):
        self.predictions: Dict[str, Prediction] = {}
        self.prop_metrics: Dict[PropType, PropTypeMetrics] = {}
        
        # Configuration
        self.calibration_bins = [(0.5, 0.6), (0.6, 0.7), (0.7, 0.8), (0.8, 0.9), (0.9, 1.0)]
        self.min_samples_for_calibration = 30  # Minimum predictions per bin
        self.alert_calibration_error_threshold = 0.15  # 15% calibration error triggers alert
        self.alert_accuracy_drop_threshold = 0.10  # 10% accuracy drop triggers alert
        
        # Performance tracking
        self.metrics_history: deque = deque(maxlen=100)  # Last 100 metric snapshots
        
        # Initialize prop type metrics
        for prop_type in PropType:
            self.prop_metrics[prop_type] = PropTypeMetrics(prop_type=prop_type)
            
        logger.info("CalibrationHarness initialized")

    async def record_prediction(
        self,
        prediction_id: str,
        game_id: str,
        prop_type: PropType,
        prop_line: float,
        predicted_value: float,
        predicted_probability: float,
        confidence_score: float = 0.5,
        model_version: str = "1.0",
        context: Optional[Dict[str, Any]] = None
    ) -> None:
        """Record a new prediction for calibration tracking"""
        
        prediction = Prediction(
            id=prediction_id,
            game_id=game_id,
            prop_type=prop_type,
            prop_line=prop_line,
            predicted_value=predicted_value,
            predicted_probability=predicted_probability,
            confidence_score=confidence_score,
            model_version=model_version,
            context=context or {}
        )
        
        self.predictions[prediction_id] = prediction
        
        # Update prop type counters
        self.prop_metrics[prop_type].total_predictions += 1
        self.prop_metrics[prop_type].last_updated = time.time()
        
        logger.debug(f"Recorded prediction {prediction_id} for {prop_type.value} - "
                    f"line: {prop_line}, predicted: {predicted_value}, "
                    f"probability: {predicted_probability:.3f}, confidence: {confidence_score:.3f}")

    async def record_outcome(
        self,
        prediction_id: str,
        actual_value: float,
        outcome: OutcomeType
    ) -> None:
        """Record the actual outcome for a prediction"""
        
        if prediction_id not in self.predictions:
            logger.warning(f"Unknown prediction ID for outcome: {prediction_id}")
            return
            
        prediction = self.predictions[prediction_id]
        
        # Update prediction with actual outcome
        prediction.actual_value = actual_value
        prediction.outcome = outcome
        prediction.settled_at = time.time()
        
        # Update prop type metrics
        prop_metrics = self.prop_metrics[prediction.prop_type]
        prop_metrics.settled_predictions += 1
        
        if prediction.was_correct():
            prop_metrics.correct_predictions += 1
            
        prop_metrics.last_updated = time.time()
        
        logger.debug(f"Recorded outcome for {prediction_id} - "
                    f"actual: {actual_value}, outcome: {outcome.value}, "
                    f"correct: {prediction.was_correct()}")
        
        # Trigger recalibration for this prop type
        await self._recalculate_prop_metrics(prediction.prop_type)

    async def _recalculate_prop_metrics(self, prop_type: PropType) -> None:
        """Recalculate calibration metrics for a specific prop type"""
        
        # Get all settled predictions for this prop type
        settled_predictions = [
            p for p in self.predictions.values()
            if p.prop_type == prop_type and p.is_settled()
        ]
        
        if len(settled_predictions) < self.min_samples_for_calibration:
            logger.debug(f"Insufficient samples for {prop_type.value} calibration - "
                        f"have {len(settled_predictions)}, need {self.min_samples_for_calibration}")
            return
            
        metrics = self.prop_metrics[prop_type]
        
        # Recalculate calibration bins
        metrics.calibration_bins = self._calculate_calibration_bins(settled_predictions)
        
        # Calculate mean calibration error
        if metrics.calibration_bins:
            calibration_errors = [bin.calibration_error for bin in metrics.calibration_bins if bin.total_count > 5]
            metrics.mean_calibration_error = statistics.mean(calibration_errors) if calibration_errors else 0.0
        
        # Calculate Brier score
        metrics.brier_score = self._calculate_brier_score(settled_predictions)
        
        # Calculate MAE and MSE for numeric predictions
        metrics.mean_absolute_error = self._calculate_mae(settled_predictions)
        metrics.mean_squared_error = self._calculate_mse(settled_predictions)
        
        # Check for alerts
        await self._check_calibration_alerts(prop_type, metrics)
        
        logger.info(f"Updated metrics for {prop_type.value} - "
                   f"accuracy: {metrics.accuracy:.3f}, "
                   f"calibration_error: {metrics.mean_calibration_error:.3f}, "
                   f"brier_score: {metrics.brier_score:.3f}")

    def _calculate_calibration_bins(self, predictions: List[Prediction]) -> List[CalibrationBin]:
        """Calculate calibration bins for the given predictions"""
        
        bins = []
        
        for confidence_range in self.calibration_bins:
            min_conf, max_conf = confidence_range
            
            # Get predictions in this confidence range
            bin_predictions = [
                p for p in predictions
                if min_conf <= p.confidence_score < max_conf
            ]
            
            if not bin_predictions:
                continue
                
            # Count correct predictions
            correct_count = sum(1 for p in bin_predictions if p.was_correct() is True)
            total_count = len([p for p in bin_predictions if p.was_correct() is not None])
            
            bin_obj = CalibrationBin(
                confidence_range=confidence_range,
                predictions=[p.id for p in bin_predictions],
                correct_count=correct_count,
                total_count=total_count
            )
            
            bins.append(bin_obj)
            
        return bins

    def _calculate_brier_score(self, predictions: List[Prediction]) -> float:
        """Calculate Brier score for probability predictions"""
        if not predictions:
            return 0.0
            
        score_sum = 0.0
        count = 0
        
        for pred in predictions:
            if pred.was_correct() is None:  # Skip pushes
                continue
                
            # Convert outcome to binary (1 for over, 0 for under)
            actual = 1.0 if pred.outcome == OutcomeType.OVER else 0.0
            predicted = pred.predicted_probability
            
            score_sum += (predicted - actual) ** 2
            count += 1
            
        return score_sum / count if count > 0 else 0.0

    def _calculate_mae(self, predictions: List[Prediction]) -> float:
        """Calculate Mean Absolute Error for numeric predictions"""
        if not predictions:
            return 0.0
            
        errors = []
        for pred in predictions:
            if pred.actual_value is not None:
                error = abs(pred.predicted_value - pred.actual_value)
                errors.append(error)
                
        return statistics.mean(errors) if errors else 0.0

    def _calculate_mse(self, predictions: List[Prediction]) -> float:
        """Calculate Mean Squared Error for numeric predictions"""
        if not predictions:
            return 0.0
            
        errors = []
        for pred in predictions:
            if pred.actual_value is not None:
                error = (pred.predicted_value - pred.actual_value) ** 2
                errors.append(error)
                
        return statistics.mean(errors) if errors else 0.0

    async def _check_calibration_alerts(self, prop_type: PropType, metrics: PropTypeMetrics) -> None:
        """Check if calibration metrics warrant alerts"""
        
        alerts = []
        
        # Check calibration error threshold
        if metrics.mean_calibration_error > self.alert_calibration_error_threshold:
            alerts.append({
                "type": "HIGH_CALIBRATION_ERROR",
                "prop_type": prop_type.value,
                "calibration_error": metrics.mean_calibration_error,
                "threshold": self.alert_calibration_error_threshold,
                "message": f"High calibration error for {prop_type.value}: {metrics.mean_calibration_error:.3f}"
            })
        
        # Check for accuracy drops (compare to historical average)
        historical_accuracy = await self._get_historical_accuracy(prop_type)
        if historical_accuracy and (historical_accuracy - metrics.accuracy) > self.alert_accuracy_drop_threshold:
            alerts.append({
                "type": "ACCURACY_DROP",
                "prop_type": prop_type.value,
                "current_accuracy": metrics.accuracy,
                "historical_accuracy": historical_accuracy,
                "drop": historical_accuracy - metrics.accuracy,
                "message": f"Accuracy drop for {prop_type.value}: {metrics.accuracy:.3f} vs {historical_accuracy:.3f}"
            })
        
        # Log alerts
        for alert in alerts:
            logger.warning(f"Calibration alert: {alert['message']}")
            
            # Store alert in cache for monitoring dashboard
            alert_key = f"calibration_alert_{prop_type.value}_{int(time.time())}"
            await unified_cache_service.set(alert_key, alert, ttl=3600)  # 1 hour TTL

    async def _get_historical_accuracy(self, prop_type: PropType) -> Optional[float]:
        """Get historical accuracy average for comparison"""
        # Look at metrics history for this prop type
        historical_accuracies = []
        
        for snapshot in self.metrics_history:
            if prop_type.value in snapshot:
                accuracy = snapshot[prop_type.value].get("accuracy", 0)
                if accuracy > 0:
                    historical_accuracies.append(accuracy)
        
        if len(historical_accuracies) >= 5:  # Need at least 5 data points
            return statistics.mean(historical_accuracies)
            
        return None

    async def get_prop_type_summary(self, prop_type: PropType) -> Dict[str, Any]:
        """Get summary statistics for a specific prop type"""
        
        metrics = self.prop_metrics[prop_type]
        
        # Get recent predictions for this prop type
        recent_predictions = [
            p for p in self.predictions.values()
            if p.prop_type == prop_type and p.created_at and p.created_at > (time.time() - 7 * 24 * 3600)  # Last 7 days
        ]
        
        return {
            "prop_type": prop_type.value,
            "total_predictions": metrics.total_predictions,
            "settled_predictions": metrics.settled_predictions,
            "settlement_rate": metrics.settlement_rate,
            "accuracy": metrics.accuracy,
            "mean_calibration_error": metrics.mean_calibration_error,
            "brier_score": metrics.brier_score,
            "mean_absolute_error": metrics.mean_absolute_error,
            "recent_predictions_7d": len(recent_predictions),
            "last_updated": metrics.last_updated,
            "calibration_bins": [
                {
                    "confidence_range": bin.confidence_range,
                    "total_count": bin.total_count,
                    "accuracy": bin.accuracy,
                    "expected_accuracy": bin.expected_accuracy,
                    "calibration_error": bin.calibration_error
                }
                for bin in (metrics.calibration_bins or [])
            ]
        }

    async def get_overall_summary(self) -> Dict[str, Any]:
        """Get overall calibration summary across all prop types"""
        
        total_predictions = sum(m.total_predictions for m in self.prop_metrics.values())
        total_settled = sum(m.settled_predictions for m in self.prop_metrics.values())
        total_correct = sum(m.correct_predictions for m in self.prop_metrics.values())
        
        overall_accuracy = total_correct / total_settled if total_settled > 0 else 0.0
        
        # Calculate weighted average calibration error
        calibration_errors = []
        weights = []
        for metrics in self.prop_metrics.values():
            if metrics.settled_predictions > 0 and metrics.mean_calibration_error > 0:
                calibration_errors.append(metrics.mean_calibration_error)
                weights.append(metrics.settled_predictions)
        
        weighted_calibration_error = (
            sum(e * w for e, w in zip(calibration_errors, weights)) / sum(weights)
            if weights else 0.0
        )
        
        return {
            "total_predictions": total_predictions,
            "settled_predictions": total_settled,
            "overall_accuracy": overall_accuracy,
            "settlement_rate": total_settled / total_predictions if total_predictions > 0 else 0.0,
            "weighted_calibration_error": weighted_calibration_error,
            "prop_type_count": len([m for m in self.prop_metrics.values() if m.total_predictions > 0]),
            "last_prediction": max([m.last_updated for m in self.prop_metrics.values() if m.last_updated]) if any(m.last_updated for m in self.prop_metrics.values()) else None
        }

    async def export_metrics(self) -> Dict[str, Any]:
        """Export all calibration metrics for monitoring/API access"""
        
        overall_summary = await self.get_overall_summary()
        
        prop_summaries = {}
        for prop_type in PropType:
            if self.prop_metrics[prop_type].total_predictions > 0:
                prop_summaries[prop_type.value] = await self.get_prop_type_summary(prop_type)
        
        metrics = {
            "overall": overall_summary,
            "by_prop_type": prop_summaries,
            "timestamp": time.time(),
            "total_prediction_count": len(self.predictions),
            "configuration": {
                "calibration_bins": self.calibration_bins,
                "min_samples_for_calibration": self.min_samples_for_calibration,
                "alert_calibration_error_threshold": self.alert_calibration_error_threshold,
                "alert_accuracy_drop_threshold": self.alert_accuracy_drop_threshold
            }
        }
        
        # Store in cache for API access
        await unified_cache_service.set("calibration_metrics", metrics, ttl=300)  # 5 minute TTL
        
        # Add to metrics history
        self.metrics_history.append({
            prop_type.value: {
                "accuracy": self.prop_metrics[prop_type].accuracy,
                "calibration_error": self.prop_metrics[prop_type].mean_calibration_error,
                "brier_score": self.prop_metrics[prop_type].brier_score,
                "timestamp": time.time()
            }
            for prop_type in PropType
            if self.prop_metrics[prop_type].settled_predictions > 0
        })
        
        return metrics

    def get_prediction(self, prediction_id: str) -> Optional[Prediction]:
        """Get a specific prediction by ID"""
        return self.predictions.get(prediction_id)

    def get_predictions_for_game(self, game_id: str) -> List[Prediction]:
        """Get all predictions for a specific game"""
        return [p for p in self.predictions.values() if p.game_id == game_id]

    async def simulate_outcome_for_testing(
        self,
        prediction_id: str,
        actual_value: float,
        outcome: OutcomeType
    ) -> None:
        """Simulate an outcome for testing purposes (development only)"""
        logger.info(f"Simulating outcome for testing - {prediction_id}: "
                   f"value={actual_value}, outcome={outcome.value}")
        await self.record_outcome(prediction_id, actual_value, outcome)


# Global calibration harness instance
calibration_harness = CalibrationHarness()