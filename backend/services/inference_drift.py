"""
PR10: Model Drift Monitoring Service

Provides comprehensive drift detection, status classification, and readiness scoring
for model performance monitoring and shadow model promotion decisions.
"""

import math
import os
import time
import threading
from collections import deque
from dataclasses import dataclass
from typing import Dict, Any, List, Optional, Deque, Tuple
from enum import Enum

from backend.utils.log_context import get_contextual_logger

logger = get_contextual_logger(__name__)


class DriftStatus(Enum):
    """Drift status classification levels."""
    NORMAL = "NORMAL"
    WATCH = "WATCH"
    DRIFTING = "DRIFTING"


class ReadinessRecommendation(Enum):
    """Shadow model promotion readiness recommendations."""
    PROMOTE = "PROMOTE"
    MONITOR = "MONITOR"
    HOLD = "HOLD"


@dataclass
class DriftWindow:
    """Drift metrics for a specific rolling window."""
    window_size: int
    mean_abs_diff: float
    pct_large_diff: float
    std_dev_primary: float
    sample_count: int


@dataclass
class ReadinessScore:
    """Shadow model promotion readiness assessment."""
    score: float
    recommendation: ReadinessRecommendation
    reasoning: str
    latency_penalty_applied: bool = False


@dataclass
class CalibrationMetrics:
    """Calibration metrics based on observed outcomes."""
    count: int
    mae: float  # Mean Absolute Error
    buckets: Dict[str, int]  # Distribution buckets


@dataclass
class DriftMetrics:
    """Complete drift analysis across multiple windows."""
    status: DriftStatus
    thresholds: Dict[str, float]
    windows: Dict[str, DriftWindow]
    earliest_detected_ts: Optional[float] = None


class DriftMonitor:
    """
    Comprehensive drift monitoring with rolling window analysis.
    
    Tracks prediction differences, computes status classifications,
    and provides readiness scoring for shadow model promotion.
    """

    def __init__(self, maxlen: int = 1000, large_diff_thresh: float = 0.15):
        self.maxlen = maxlen
        self.large_diff_thresh = large_diff_thresh
        
        # Initialize thresholds from environment
        self.drift_warn_threshold = float(os.getenv("A1_DRIFT_WARN", "0.08"))
        self.drift_alert_threshold = float(os.getenv("A1_DRIFT_ALERT", "0.15"))
        
        # Thread-safe storage
        self.lock = threading.Lock()
        
        # Rolling data storage
        self.primary_predictions: Deque[float] = deque(maxlen=maxlen)
        self.shadow_predictions: Deque[float] = deque(maxlen=maxlen)
        self.diffs: Deque[float] = deque(maxlen=maxlen)
        self.primary_latencies: Deque[float] = deque(maxlen=maxlen)
        self.shadow_latencies: Deque[float] = deque(maxlen=maxlen)
        self.timestamps: Deque[float] = deque(maxlen=maxlen)
        
        # Incremental aggregates
        self._sum_primary = 0.0
        self._sum_diffs = 0.0
        self._sum_squared_primary = 0.0
        self._sum_abs_diffs = 0.0
        self._large_diff_count = 0
        
        # Status tracking
        self._current_status = DriftStatus.NORMAL
        self._status_change_ts: Optional[float] = None
        
        # Outcome storage for calibration
        self.outcome_store: Dict[str, float] = {}  # feature_hash -> outcome
        self.error_sum = 0.0
        self.error_count = 0
        
        logger.info(
            "Drift monitor initialized",
            extra={
                "maxlen": maxlen,
                "large_diff_thresh": large_diff_thresh,
                "drift_warn_threshold": self.drift_warn_threshold,
                "drift_alert_threshold": self.drift_alert_threshold
            }
        )

    def record_inference(self, primary_pred: float, shadow_pred: Optional[float], 
                        primary_latency: float, shadow_latency: Optional[float]) -> None:
        """
        Record a new inference result for drift analysis.
        
        Args:
            primary_pred: Primary model prediction
            shadow_pred: Shadow model prediction (optional)
            primary_latency: Primary model latency in ms
            shadow_latency: Shadow model latency in ms (optional)
        """
        with self.lock:
            current_time = time.time()
            
            # Always record primary data
            self.primary_predictions.append(primary_pred)
            self.primary_latencies.append(primary_latency)
            self.timestamps.append(current_time)
            
            # Update incremental aggregates for primary
            if len(self.primary_predictions) > 1:  # Remove old value if buffer was full
                if len(self.primary_predictions) == self.maxlen:
                    old_primary = self.primary_predictions[0] if len(self.primary_predictions) > 0 else 0
                    self._sum_primary -= old_primary
                    self._sum_squared_primary -= old_primary * old_primary
            
            self._sum_primary += primary_pred
            self._sum_squared_primary += primary_pred * primary_pred
            
            # Handle shadow data if available
            if shadow_pred is not None:
                diff = abs(primary_pred - shadow_pred)
                
                self.shadow_predictions.append(shadow_pred)
                self.shadow_latencies.append(shadow_latency or 0.0)
                self.diffs.append(diff)
                
                # Update diff aggregates
                if len(self.diffs) > 1 and len(self.diffs) == self.maxlen:
                    old_diff = self.diffs[0] if len(self.diffs) > 0 else 0
                    old_is_large = old_diff >= self.large_diff_thresh
                    self._sum_abs_diffs -= old_diff
                    if old_is_large:
                        self._large_diff_count -= 1
                
                self._sum_abs_diffs += diff
                if diff >= self.large_diff_thresh:
                    self._large_diff_count += 1
            
            # Update status
            self._update_drift_status()

    def _update_drift_status(self) -> None:
        """Update drift status based on current metrics (called under lock)."""
        if len(self.diffs) < 10:  # Need minimum samples
            return
            
        mean_abs_diff = self._sum_abs_diffs / len(self.diffs)
        previous_status = self._current_status
        
        if mean_abs_diff >= self.drift_alert_threshold:
            new_status = DriftStatus.DRIFTING
        elif mean_abs_diff >= self.drift_warn_threshold:
            new_status = DriftStatus.WATCH
        else:
            new_status = DriftStatus.NORMAL
            
        if new_status != previous_status:
            self._current_status = new_status
            self._status_change_ts = time.time()
            
            logger.info(
                f"Drift status changed: {previous_status.value} -> {new_status.value}",
                extra={
                    "mean_abs_diff": mean_abs_diff,
                    "warn_threshold": self.drift_warn_threshold,
                    "alert_threshold": self.drift_alert_threshold
                }
            )

    def get_drift_metrics(self) -> DriftMetrics:
        """
        Get comprehensive drift metrics across multiple rolling windows.
        
        Returns:
            DriftMetrics with status, thresholds, and window analysis
        """
        with self.lock:
            # Calculate windows: last 50, 200, and full buffer
            windows = {}
            
            for window_name, window_size in [("w50", 50), ("w200", 200), ("wall", len(self.diffs))]:
                if len(self.diffs) == 0:
                    windows[window_name] = DriftWindow(
                        window_size=0, mean_abs_diff=0.0, pct_large_diff=0.0,
                        std_dev_primary=0.0, sample_count=0
                    )
                    continue
                
                # Get window slice
                effective_size = min(window_size, len(self.diffs))
                if effective_size == 0:
                    continue
                    
                window_diffs = list(self.diffs)[-effective_size:]
                window_primary = list(self.primary_predictions)[-effective_size:]
                
                # Compute window metrics
                mean_abs_diff = sum(window_diffs) / len(window_diffs)
                large_count = sum(1 for d in window_diffs if d >= self.large_diff_thresh)
                pct_large_diff = large_count / len(window_diffs) if window_diffs else 0.0
                
                # Primary std dev
                if len(window_primary) > 1:
                    primary_mean = sum(window_primary) / len(window_primary)
                    variance = sum((p - primary_mean) ** 2 for p in window_primary) / len(window_primary)
                    std_dev_primary = math.sqrt(variance)
                else:
                    std_dev_primary = 0.0
                
                windows[window_name] = DriftWindow(
                    window_size=effective_size,
                    mean_abs_diff=mean_abs_diff,
                    pct_large_diff=pct_large_diff,
                    std_dev_primary=std_dev_primary,
                    sample_count=effective_size
                )
            
            return DriftMetrics(
                status=self._current_status,
                thresholds={
                    "warn": self.drift_warn_threshold,
                    "alert": self.drift_alert_threshold
                },
                windows=windows,
                earliest_detected_ts=self._status_change_ts if self._current_status != DriftStatus.NORMAL else None
            )

    def get_readiness_score(self) -> ReadinessScore:
        """
        Calculate shadow model promotion readiness score.
        
        Returns:
            ReadinessScore with numeric score, recommendation, and reasoning
        """
        with self.lock:
            if len(self.diffs) < 10:
                return ReadinessScore(
                    score=0.0,
                    recommendation=ReadinessRecommendation.HOLD,
                    reasoning="Insufficient data for assessment"
                )
            
            # Base readiness calculation
            mean_abs_diff = self._sum_abs_diffs / len(self.diffs)
            base_score = max(0.0, 1.0 - mean_abs_diff / self.drift_alert_threshold)
            
            # Apply latency penalty if shadow is significantly slower
            latency_penalty_applied = False
            penalty_factor = 1.0
            
            if len(self.shadow_latencies) > 0 and len(self.primary_latencies) > 0:
                avg_shadow_latency = sum(self.shadow_latencies) / len(self.shadow_latencies)
                avg_primary_latency = sum(self.primary_latencies) / len(self.primary_latencies)
                
                if avg_shadow_latency > avg_primary_latency * 1.25:
                    penalty_factor = 0.8  # 20% penalty for slow shadow
                    latency_penalty_applied = True
            
            final_score = base_score * penalty_factor
            
            # Determine recommendation
            if mean_abs_diff < self.drift_warn_threshold and not latency_penalty_applied:
                recommendation = ReadinessRecommendation.PROMOTE
                reasoning = "Low diff, stable latency"
            elif mean_abs_diff < self.drift_alert_threshold:
                recommendation = ReadinessRecommendation.MONITOR
                reasoning = f"Moderate diff ({mean_abs_diff:.3f}), continue monitoring"
            else:
                recommendation = ReadinessRecommendation.HOLD
                reasoning = f"High diff ({mean_abs_diff:.3f}), model drifting"
            
            if latency_penalty_applied:
                reasoning += ", latency penalty applied"
            
            return ReadinessScore(
                score=final_score,
                recommendation=recommendation,
                reasoning=reasoning,
                latency_penalty_applied=latency_penalty_applied
            )

    def record_outcome(self, feature_hash: str, outcome_value: float) -> None:
        """
        Record an observed outcome for calibration analysis.
        
        Args:
            feature_hash: Hash of the input features
            outcome_value: Observed outcome value
        """
        with self.lock:
            self.outcome_store[feature_hash] = outcome_value
            
        logger.debug(
            "Outcome recorded",
            extra={"feature_hash": feature_hash[:8], "outcome_value": outcome_value}
        )

    def get_calibration_metrics(self, recent_entries: List[Dict[str, Any]]) -> CalibrationMetrics:
        """
        Get calibration metrics based on recorded outcomes.
        
        Args:
            recent_entries: Recent audit entries to match with outcomes
            
        Returns:
            CalibrationMetrics with MAE and outcome distribution
        """
        with self.lock:
            # Match predictions with outcomes
            errors = []
            outcome_values = []
            
            for entry in recent_entries:
                feature_hash = entry.get("feature_hash")
                prediction = entry.get("prediction")
                
                if feature_hash in self.outcome_store and prediction is not None:
                    outcome = self.outcome_store[feature_hash]
                    error = abs(prediction - outcome)
                    errors.append(error)
                    outcome_values.append(outcome)
            
            # Calculate MAE
            mae = sum(errors) / len(errors) if errors else 0.0
            
            # Distribute outcomes into quartile buckets
            buckets = {"lt_0_25": 0, "lt_0_5": 0, "lt_0_75": 0, "gte_0_75": 0}
            
            for outcome in outcome_values:
                if outcome < 0.25:
                    buckets["lt_0_25"] += 1
                elif outcome < 0.5:
                    buckets["lt_0_5"] += 1
                elif outcome < 0.75:
                    buckets["lt_0_75"] += 1
                else:
                    buckets["gte_0_75"] += 1
            
            return CalibrationMetrics(
                count=len(errors),
                mae=mae,
                buckets=buckets
            )

    def is_alert_active(self) -> bool:
        """
        Check if drift alert is currently active.
        
        Returns:
            True if system is in DRIFTING state
        """
        with self.lock:
            return self._current_status == DriftStatus.DRIFTING

    def get_status_info(self) -> Dict[str, Any]:
        """
        Get current drift status information.
        
        Returns:
            Dictionary with status, timestamp, and basic metrics
        """
        with self.lock:
            return {
                "drift_status": self._current_status.value,
                "earliest_detected_ts": self._status_change_ts,
                "last_update_ts": time.time(),
                "sample_count": len(self.diffs),
                "alert_active": self._current_status == DriftStatus.DRIFTING
            }


# Global drift monitor instance
_drift_monitor: Optional[DriftMonitor] = None


def get_drift_monitor() -> DriftMonitor:
    """
    Get the global drift monitor instance.
    
    Returns:
        DriftMonitor singleton instance
    """
    global _drift_monitor
    if _drift_monitor is None:
        _drift_monitor = DriftMonitor()
    return _drift_monitor