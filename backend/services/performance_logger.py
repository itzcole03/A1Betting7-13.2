"""
Performance Logging Service with Rolling Accuracy Stats

This service provides comprehensive model performance monitoring with:
- Rolling accuracy statistics per sport and bet type
- Real-time performance tracking
- Model comparison and A/B testing metrics
- Anomaly detection and alerts
- Historical trend analysis
- Performance degradation detection
"""

from __future__ import annotations

import asyncio
import json
import logging
import time
from collections import defaultdict, deque
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional, Set, Tuple, Union

logger = logging.getLogger(__name__)

# Mock imports for development
try:
    import numpy as np
    NUMPY_AVAILABLE = True
except ImportError:
    NUMPY_AVAILABLE = False
    logger.warning("NumPy not available - using fallback statistics")

try:
    from scipy import stats as scipy_stats
    SCIPY_AVAILABLE = True
except ImportError:
    SCIPY_AVAILABLE = False
    logger.warning("SciPy not available - using basic statistics")


class PredictionOutcome(Enum):
    """Possible outcomes for predictions"""
    CORRECT = "correct"
    INCORRECT = "incorrect"
    PUSH = "push"
    PENDING = "pending"
    VOID = "void"


class AlertLevel(Enum):
    """Alert severity levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class PredictionResult:
    """Individual prediction result for tracking"""
    prediction_id: str
    model_name: str
    sport: str
    bet_type: str
    prediction: float
    confidence: float
    actual_outcome: Optional[float] = None
    outcome_status: PredictionOutcome = PredictionOutcome.PENDING
    timestamp: float = field(default_factory=time.time)
    metadata: Dict[str, Any] = field(default_factory=dict)
    processing_time: float = 0.0
    features_used: List[str] = field(default_factory=list)
    shap_importance: Dict[str, float] = field(default_factory=dict)


@dataclass
class RollingStats:
    """Rolling statistics for performance tracking"""
    window_size: int
    accuracy_values: deque = field(default_factory=deque)
    confidence_values: deque = field(default_factory=deque)
    processing_times: deque = field(default_factory=deque)
    timestamp_window: deque = field(default_factory=deque)
    
    def __post_init__(self):
        if not hasattr(self.accuracy_values, 'maxlen'):
            self.accuracy_values = deque(maxlen=self.window_size)
            self.confidence_values = deque(maxlen=self.window_size)
            self.processing_times = deque(maxlen=self.window_size)
            self.timestamp_window = deque(maxlen=self.window_size)


@dataclass
class PerformanceAlert:
    """Performance alert notification"""
    alert_id: str
    level: AlertLevel
    category: str
    message: str
    model_name: str
    sport: str
    bet_type: str
    current_value: float
    threshold_value: float
    timestamp: float = field(default_factory=time.time)
    resolved: bool = False
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ModelPerformanceSummary:
    """Summary of model performance metrics"""
    model_name: str
    sport: str
    bet_type: str
    total_predictions: int
    accuracy: float
    confidence: float
    avg_processing_time: float
    calibration_score: float
    sharpe_ratio: float
    roi: float
    win_rate: float
    recent_trend: str  # "improving", "declining", "stable"
    last_updated: float = field(default_factory=time.time)


class PerformanceLogger:
    """Advanced performance logging with rolling accuracy stats"""
    
    def __init__(self,
                 default_window_size: int = 1000,
                 alert_thresholds: Optional[Dict[str, float]] = None,
                 enable_anomaly_detection: bool = True):
        
        self.default_window_size = default_window_size
        self.enable_anomaly_detection = enable_anomaly_detection
        
        # Alert thresholds
        self.alert_thresholds = alert_thresholds or {
            'accuracy_drop_threshold': 0.05,  # 5% accuracy drop
            'confidence_drop_threshold': 0.1,  # 10% confidence drop
            'processing_time_increase': 2.0,   # 2x processing time increase
            'min_accuracy_threshold': 0.5,    # Minimum acceptable accuracy
            'calibration_threshold': 0.1      # Calibration error threshold
        }
        
        # Performance tracking
        self.prediction_results: Dict[str, PredictionResult] = {}
        self.rolling_stats: Dict[Tuple[str, str, str], RollingStats] = {}  # (model, sport, bet_type) -> stats
        
        # Alerts and monitoring
        self.active_alerts: Dict[str, PerformanceAlert] = {}
        self.alert_history: List[PerformanceAlert] = []
        self.alert_callbacks: List[callable] = []
        
        # Performance summaries
        self.performance_summaries: Dict[Tuple[str, str, str], ModelPerformanceSummary] = {}
        self.last_summary_update: Dict[Tuple[str, str, str], float] = {}
        
        # Historical data
        self.daily_performance: defaultdict = defaultdict(dict)
        self.hourly_performance: defaultdict = defaultdict(dict)
        
        # Anomaly detection
        self.anomaly_detectors: Dict[str, Any] = {}
        self.baseline_metrics: Dict[Tuple[str, str, str], Dict[str, float]] = {}
        
        # Background tasks
        self.background_tasks: Set[asyncio.Task] = set()
        self.should_stop = False
        
        logger.info(f"Performance logger initialized with window size {default_window_size}")
    
    async def start_monitoring(self):
        """Start background monitoring tasks"""
        if not self.background_tasks:
            # Start performance summary updates
            summary_task = asyncio.create_task(self._update_summaries_loop())
            self.background_tasks.add(summary_task)
            
            # Start anomaly detection
            if self.enable_anomaly_detection:
                anomaly_task = asyncio.create_task(self._anomaly_detection_loop())
                self.background_tasks.add(anomaly_task)
            
            # Start alert monitoring
            alert_task = asyncio.create_task(self._alert_monitoring_loop())
            self.background_tasks.add(alert_task)
            
            logger.info("Performance monitoring started")
    
    async def stop_monitoring(self):
        """Stop background monitoring tasks"""
        self.should_stop = True
        for task in self.background_tasks:
            if not task.done():
                task.cancel()
        
        # Wait for tasks to complete
        if self.background_tasks:
            await asyncio.gather(*self.background_tasks, return_exceptions=True)
        
        self.background_tasks.clear()
        logger.info("Performance monitoring stopped")
    
    def log_prediction(self, 
                      prediction_id: str,
                      model_name: str,
                      sport: str,
                      bet_type: str,
                      prediction: float,
                      confidence: float,
                      processing_time: float = 0.0,
                      features_used: Optional[List[str]] = None,
                      shap_importance: Optional[Dict[str, float]] = None,
                      metadata: Optional[Dict[str, Any]] = None) -> None:
        """Log a new prediction for performance tracking"""
        
        result = PredictionResult(
            prediction_id=prediction_id,
            model_name=model_name,
            sport=sport,
            bet_type=bet_type,
            prediction=prediction,
            confidence=confidence,
            processing_time=processing_time,
            features_used=features_used or [],
            shap_importance=shap_importance or {},
            metadata=metadata or {}
        )
        
        self.prediction_results[prediction_id] = result
        
        # Update rolling stats
        key = (model_name, sport, bet_type)
        if key not in self.rolling_stats:
            self.rolling_stats[key] = RollingStats(self.default_window_size)
        
        stats = self.rolling_stats[key]
        stats.confidence_values.append(confidence)
        stats.processing_times.append(processing_time)
        stats.timestamp_window.append(time.time())
        
        logger.debug(f"Logged prediction {prediction_id} for {model_name}/{sport}/{bet_type}")
    
    def log_outcome(self, 
                   prediction_id: str, 
                   actual_outcome: float, 
                   outcome_status: PredictionOutcome = PredictionOutcome.CORRECT) -> None:
        """Log the actual outcome for a prediction"""
        
        if prediction_id not in self.prediction_results:
            logger.warning(f"Prediction ID {prediction_id} not found")
            return
        
        result = self.prediction_results[prediction_id]
        result.actual_outcome = actual_outcome
        result.outcome_status = outcome_status
        
        # Update rolling accuracy
        if outcome_status in [PredictionOutcome.CORRECT, PredictionOutcome.INCORRECT]:
            accuracy = 1.0 if outcome_status == PredictionOutcome.CORRECT else 0.0
            
            key = (result.model_name, result.sport, result.bet_type)
            if key in self.rolling_stats:
                self.rolling_stats[key].accuracy_values.append(accuracy)
        
        # Trigger summary update
        asyncio.create_task(self._update_summary_for_key((result.model_name, result.sport, result.bet_type)))
        
        logger.debug(f"Logged outcome for {prediction_id}: {outcome_status.value}")
    
    def get_rolling_accuracy(self, 
                           model_name: str, 
                           sport: str, 
                           bet_type: str,
                           window_size: Optional[int] = None) -> float:
        """Get rolling accuracy for specific model/sport/bet_type"""
        
        key = (model_name, sport, bet_type)
        if key not in self.rolling_stats:
            return 0.0
        
        accuracy_values = self.rolling_stats[key].accuracy_values
        if not accuracy_values:
            return 0.0
        
        if window_size and window_size < len(accuracy_values):
            recent_values = list(accuracy_values)[-window_size:]
        else:
            recent_values = list(accuracy_values)
        
        if NUMPY_AVAILABLE:
            return float(np.mean(recent_values))
        else:
            return sum(recent_values) / len(recent_values)
    
    def get_rolling_confidence(self, 
                             model_name: str, 
                             sport: str, 
                             bet_type: str,
                             window_size: Optional[int] = None) -> float:
        """Get rolling average confidence for specific model/sport/bet_type"""
        
        key = (model_name, sport, bet_type)
        if key not in self.rolling_stats:
            return 0.0
        
        confidence_values = self.rolling_stats[key].confidence_values
        if not confidence_values:
            return 0.0
        
        if window_size and window_size < len(confidence_values):
            recent_values = list(confidence_values)[-window_size:]
        else:
            recent_values = list(confidence_values)
        
        if NUMPY_AVAILABLE:
            return float(np.mean(recent_values))
        else:
            return sum(recent_values) / len(recent_values)
    
    def get_performance_summary(self, 
                              model_name: str, 
                              sport: str, 
                              bet_type: str) -> Optional[ModelPerformanceSummary]:
        """Get comprehensive performance summary"""
        
        key = (model_name, sport, bet_type)
        
        # Update summary if needed
        last_update = self.last_summary_update.get(key, 0)
        if time.time() - last_update > 60:  # Update every minute
            asyncio.create_task(self._update_summary_for_key(key))
        
        return self.performance_summaries.get(key)
    
    def get_all_performance_summaries(self) -> Dict[str, Dict[str, Dict[str, ModelPerformanceSummary]]]:
        """Get all performance summaries organized by model/sport/bet_type"""
        
        organized_summaries = defaultdict(lambda: defaultdict(dict))
        
        for (model_name, sport, bet_type), summary in self.performance_summaries.items():
            organized_summaries[model_name][sport][bet_type] = summary
        
        return dict(organized_summaries)
    
    def get_model_comparison(self, 
                           sport: str, 
                           bet_type: str, 
                           metrics: Optional[List[str]] = None) -> Dict[str, Dict[str, float]]:
        """Compare models for specific sport and bet type"""
        
        metrics = metrics or ['accuracy', 'confidence', 'roi', 'sharpe_ratio']
        comparison = {}
        
        for (model_name, model_sport, model_bet_type), summary in self.performance_summaries.items():
            if model_sport == sport and model_bet_type == bet_type:
                comparison[model_name] = {}
                for metric in metrics:
                    comparison[model_name][metric] = getattr(summary, metric, 0.0)
        
        return comparison
    
    def get_sport_performance(self, sport: str) -> Dict[str, Any]:
        """Get aggregated performance metrics for a sport"""
        
        sport_stats = {
            'total_predictions': 0,
            'overall_accuracy': 0.0,
            'best_model': None,
            'bet_type_performance': {},
            'model_performance': {}
        }
        
        relevant_summaries = []
        for (model_name, model_sport, bet_type), summary in self.performance_summaries.items():
            if model_sport == sport:
                relevant_summaries.append(summary)
                sport_stats['total_predictions'] += summary.total_predictions
                
                # Track bet type performance
                if bet_type not in sport_stats['bet_type_performance']:
                    sport_stats['bet_type_performance'][bet_type] = []
                sport_stats['bet_type_performance'][bet_type].append(summary.accuracy)
                
                # Track model performance
                if model_name not in sport_stats['model_performance']:
                    sport_stats['model_performance'][model_name] = []
                sport_stats['model_performance'][model_name].append(summary.accuracy)
        
        # Calculate overall accuracy
        if relevant_summaries:
            weighted_accuracy = sum(s.accuracy * s.total_predictions for s in relevant_summaries)
            sport_stats['overall_accuracy'] = weighted_accuracy / sport_stats['total_predictions'] if sport_stats['total_predictions'] > 0 else 0.0
            
            # Find best model
            best_summary = max(relevant_summaries, key=lambda s: s.accuracy * s.total_predictions)
            sport_stats['best_model'] = best_summary.model_name
            
            # Average bet type performance
            for bet_type, accuracies in sport_stats['bet_type_performance'].items():
                if NUMPY_AVAILABLE:
                    sport_stats['bet_type_performance'][bet_type] = float(np.mean(accuracies))
                else:
                    sport_stats['bet_type_performance'][bet_type] = sum(accuracies) / len(accuracies)
            
            # Average model performance
            for model_name, accuracies in sport_stats['model_performance'].items():
                if NUMPY_AVAILABLE:
                    sport_stats['model_performance'][model_name] = float(np.mean(accuracies))
                else:
                    sport_stats['model_performance'][model_name] = sum(accuracies) / len(accuracies)
        
        return sport_stats
    
    def get_recent_alerts(self, limit: int = 50) -> List[PerformanceAlert]:
        """Get recent performance alerts"""
        return sorted(self.alert_history, key=lambda a: a.timestamp, reverse=True)[:limit]
    
    def get_active_alerts(self) -> List[PerformanceAlert]:
        """Get currently active alerts"""
        return list(self.active_alerts.values())
    
    def add_alert_callback(self, callback: callable):
        """Add callback function for alert notifications"""
        self.alert_callbacks.append(callback)
    
    async def _update_summaries_loop(self):
        """Background task to update performance summaries"""
        while not self.should_stop:
            try:
                # Update summaries for all tracked combinations
                for key in self.rolling_stats.keys():
                    await self._update_summary_for_key(key)
                
                # Sleep for a minute
                await asyncio.sleep(60)
                
            except Exception as e:
                logger.error(f"Error in summary update loop: {e}")
                await asyncio.sleep(30)
    
    async def _update_summary_for_key(self, key: Tuple[str, str, str]):
        """Update performance summary for specific key"""
        model_name, sport, bet_type = key
        
        try:
            # Get relevant predictions
            predictions = [
                r for r in self.prediction_results.values()
                if r.model_name == model_name and r.sport == sport and r.bet_type == bet_type
            ]
            
            if not predictions:
                return
            
            # Calculate metrics
            total_predictions = len(predictions)
            accuracy = self.get_rolling_accuracy(model_name, sport, bet_type)
            confidence = self.get_rolling_confidence(model_name, sport, bet_type)
            
            # Processing time
            processing_times = [p.processing_time for p in predictions if p.processing_time > 0]
            avg_processing_time = sum(processing_times) / len(processing_times) if processing_times else 0.0
            
            # Calibration score (how well confidence matches accuracy)
            calibration_score = self._calculate_calibration_score(predictions)
            
            # Financial metrics
            roi, sharpe_ratio, win_rate = self._calculate_financial_metrics(predictions)
            
            # Trend analysis
            recent_trend = self._analyze_trend(key)
            
            # Create summary
            summary = ModelPerformanceSummary(
                model_name=model_name,
                sport=sport,
                bet_type=bet_type,
                total_predictions=total_predictions,
                accuracy=accuracy,
                confidence=confidence,
                avg_processing_time=avg_processing_time,
                calibration_score=calibration_score,
                sharpe_ratio=sharpe_ratio,
                roi=roi,
                win_rate=win_rate,
                recent_trend=recent_trend
            )
            
            self.performance_summaries[key] = summary
            self.last_summary_update[key] = time.time()
            
            # Check for alerts
            await self._check_performance_alerts(key, summary)
            
        except Exception as e:
            logger.error(f"Error updating summary for {key}: {e}")
    
    def _calculate_calibration_score(self, predictions: List[PredictionResult]) -> float:
        """Calculate calibration score (reliability of confidence estimates)"""
        
        # Group predictions by confidence bins
        bins = {}
        for pred in predictions:
            if pred.outcome_status in [PredictionOutcome.CORRECT, PredictionOutcome.INCORRECT]:
                conf_bin = int(pred.confidence * 10) / 10  # 0.1 bins
                if conf_bin not in bins:
                    bins[conf_bin] = {'correct': 0, 'total': 0}
                
                bins[conf_bin]['total'] += 1
                if pred.outcome_status == PredictionOutcome.CORRECT:
                    bins[conf_bin]['correct'] += 1
        
        # Calculate calibration error
        calibration_error = 0.0
        total_weight = 0
        
        for conf_bin, data in bins.items():
            if data['total'] > 0:
                bin_accuracy = data['correct'] / data['total']
                weight = data['total']
                error = abs(conf_bin - bin_accuracy)
                calibration_error += error * weight
                total_weight += weight
        
        return 1.0 - (calibration_error / total_weight if total_weight > 0 else 1.0)
    
    def _calculate_financial_metrics(self, predictions: List[PredictionResult]) -> Tuple[float, float, float]:
        """Calculate financial performance metrics"""
        
        # Simple ROI calculation (assuming unit bets)
        completed_predictions = [
            p for p in predictions
            if p.outcome_status in [PredictionOutcome.CORRECT, PredictionOutcome.INCORRECT]
        ]
        
        if not completed_predictions:
            return 0.0, 0.0, 0.0
        
        # Calculate returns
        returns = []
        wins = 0
        
        for pred in completed_predictions:
            if pred.outcome_status == PredictionOutcome.CORRECT:
                # Assume 1.9x payout for correct predictions
                returns.append(0.9)  # 90% profit
                wins += 1
            else:
                returns.append(-1.0)  # Loss of bet amount
        
        # ROI
        roi = sum(returns) / len(returns)
        
        # Win rate
        win_rate = wins / len(completed_predictions)
        
        # Sharpe ratio (risk-adjusted return)
        if NUMPY_AVAILABLE and len(returns) > 1:
            returns_array = np.array(returns)
            sharpe_ratio = np.mean(returns_array) / np.std(returns_array) if np.std(returns_array) > 0 else 0.0
        else:
            sharpe_ratio = 0.0
        
        return roi, sharpe_ratio, win_rate
    
    def _analyze_trend(self, key: Tuple[str, str, str]) -> str:
        """Analyze recent performance trend"""
        
        if key not in self.rolling_stats:
            return "stable"
        
        accuracy_values = list(self.rolling_stats[key].accuracy_values)
        
        if len(accuracy_values) < 20:  # Need enough data points
            return "stable"
        
        # Compare first half vs second half of recent data
        mid_point = len(accuracy_values) // 2
        first_half = accuracy_values[:mid_point]
        second_half = accuracy_values[mid_point:]
        
        if NUMPY_AVAILABLE:
            first_avg = np.mean(first_half)
            second_avg = np.mean(second_half)
        else:
            first_avg = sum(first_half) / len(first_half)
            second_avg = sum(second_half) / len(second_half)
        
        difference = second_avg - first_avg
        
        if difference > 0.02:  # 2% improvement
            return "improving"
        elif difference < -0.02:  # 2% decline
            return "declining"
        else:
            return "stable"
    
    async def _check_performance_alerts(self, key: Tuple[str, str, str], summary: ModelPerformanceSummary):
        """Check for performance alerts based on thresholds"""
        
        model_name, sport, bet_type = key
        
        # Check accuracy drop
        if summary.accuracy < self.alert_thresholds['min_accuracy_threshold']:
            await self._create_alert(
                level=AlertLevel.HIGH,
                category="accuracy",
                message=f"Model accuracy below threshold: {summary.accuracy:.3f}",
                model_name=model_name,
                sport=sport,
                bet_type=bet_type,
                current_value=summary.accuracy,
                threshold_value=self.alert_thresholds['min_accuracy_threshold']
            )
        
        # Check calibration
        if summary.calibration_score < (1.0 - self.alert_thresholds['calibration_threshold']):
            await self._create_alert(
                level=AlertLevel.MEDIUM,
                category="calibration",
                message=f"Poor calibration score: {summary.calibration_score:.3f}",
                model_name=model_name,
                sport=sport,
                bet_type=bet_type,
                current_value=summary.calibration_score,
                threshold_value=1.0 - self.alert_thresholds['calibration_threshold']
            )
        
        # Check for declining trend
        if summary.recent_trend == "declining":
            await self._create_alert(
                level=AlertLevel.MEDIUM,
                category="trend",
                message="Performance is declining",
                model_name=model_name,
                sport=sport,
                bet_type=bet_type,
                current_value=summary.accuracy,
                threshold_value=0.0
            )
    
    async def _create_alert(self, 
                          level: AlertLevel,
                          category: str,
                          message: str,
                          model_name: str,
                          sport: str,
                          bet_type: str,
                          current_value: float,
                          threshold_value: float):
        """Create and process a performance alert"""
        
        alert_id = f"{model_name}_{sport}_{bet_type}_{category}_{int(time.time())}"
        
        alert = PerformanceAlert(
            alert_id=alert_id,
            level=level,
            category=category,
            message=message,
            model_name=model_name,
            sport=sport,
            bet_type=bet_type,
            current_value=current_value,
            threshold_value=threshold_value
        )
        
        self.active_alerts[alert_id] = alert
        self.alert_history.append(alert)
        
        # Notify callbacks
        for callback in self.alert_callbacks:
            try:
                if asyncio.iscoroutinefunction(callback):
                    await callback(alert)
                else:
                    callback(alert)
            except Exception as e:
                logger.error(f"Error in alert callback: {e}")
        
        logger.warning(f"Performance alert created: {alert.message}")
    
    async def _anomaly_detection_loop(self):
        """Background task for anomaly detection"""
        while not self.should_stop:
            try:
                await self._detect_anomalies()
                await asyncio.sleep(300)  # Check every 5 minutes
            except Exception as e:
                logger.error(f"Error in anomaly detection loop: {e}")
                await asyncio.sleep(60)
    
    async def _detect_anomalies(self):
        """Detect performance anomalies"""
        
        for key, stats in self.rolling_stats.items():
            model_name, sport, bet_type = key
            
            # Need sufficient data for anomaly detection
            if len(stats.accuracy_values) < 50:
                continue
            
            try:
                # Simple statistical anomaly detection
                recent_accuracy = list(stats.accuracy_values)[-10:]  # Last 10 predictions
                historical_accuracy = list(stats.accuracy_values)[:-10]  # Historical data
                
                if len(historical_accuracy) < 20:
                    continue
                
                if NUMPY_AVAILABLE:
                    historical_mean = np.mean(historical_accuracy)
                    historical_std = np.std(historical_accuracy)
                    recent_mean = np.mean(recent_accuracy)
                else:
                    historical_mean = sum(historical_accuracy) / len(historical_accuracy)
                    historical_variance = sum((x - historical_mean) ** 2 for x in historical_accuracy) / len(historical_accuracy)
                    historical_std = historical_variance ** 0.5
                    recent_mean = sum(recent_accuracy) / len(recent_accuracy)
                
                # Check for significant deviation
                if historical_std > 0:
                    z_score = abs(recent_mean - historical_mean) / historical_std
                    
                    if z_score > 2.0:  # 2 standard deviations
                        await self._create_alert(
                            level=AlertLevel.MEDIUM,
                            category="anomaly",
                            message=f"Performance anomaly detected (z-score: {z_score:.2f})",
                            model_name=model_name,
                            sport=sport,
                            bet_type=bet_type,
                            current_value=recent_mean,
                            threshold_value=historical_mean
                        )
                
            except Exception as e:
                logger.error(f"Error detecting anomalies for {key}: {e}")
    
    async def _alert_monitoring_loop(self):
        """Background task for alert monitoring and cleanup"""
        while not self.should_stop:
            try:
                # Clean up old alerts
                current_time = time.time()
                alert_lifetime = 24 * 60 * 60  # 24 hours
                
                expired_alerts = [
                    alert_id for alert_id, alert in self.active_alerts.items()
                    if current_time - alert.timestamp > alert_lifetime
                ]
                
                for alert_id in expired_alerts:
                    del self.active_alerts[alert_id]
                
                # Keep only recent history
                max_history = 1000
                if len(self.alert_history) > max_history:
                    self.alert_history = self.alert_history[-max_history:]
                
                await asyncio.sleep(3600)  # Check every hour
                
            except Exception as e:
                logger.error(f"Error in alert monitoring loop: {e}")
                await asyncio.sleep(300)
    
    def export_performance_data(self, 
                              start_time: Optional[float] = None,
                              end_time: Optional[float] = None) -> Dict[str, Any]:
        """Export performance data for analysis"""
        
        start_time = start_time or 0
        end_time = end_time or time.time()
        
        # Filter predictions by time range
        filtered_predictions = [
            asdict(pred) for pred in self.prediction_results.values()
            if start_time <= pred.timestamp <= end_time
        ]
        
        # Export summaries
        summaries = {}
        for key, summary in self.performance_summaries.items():
            model_name, sport, bet_type = key
            summaries[f"{model_name}_{sport}_{bet_type}"] = asdict(summary)
        
        # Export alerts
        filtered_alerts = [
            asdict(alert) for alert in self.alert_history
            if start_time <= alert.timestamp <= end_time
        ]
        
        return {
            'export_timestamp': time.time(),
            'time_range': {
                'start': start_time,
                'end': end_time
            },
            'predictions': filtered_predictions,
            'performance_summaries': summaries,
            'alerts': filtered_alerts,
            'statistics': {
                'total_predictions': len(filtered_predictions),
                'unique_models': len(set(p['model_name'] for p in filtered_predictions)),
                'unique_sports': len(set(p['sport'] for p in filtered_predictions)),
                'unique_bet_types': len(set(p['bet_type'] for p in filtered_predictions))
            }
        }


# Global instance
performance_logger = PerformanceLogger()
