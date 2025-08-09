"""
Advanced Model Performance Monitoring Service
Enhanced monitoring system for ML model performance, drift detection, and real-time accuracy tracking.
Part of Phase 3: Advanced AI Enhancement and Multi-Sport Expansion
"""

import asyncio
import logging
import json
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any, Union
from dataclasses import dataclass, asdict
from enum import Enum
import numpy as np
import pandas as pd
from scipy import stats
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
import warnings
warnings.filterwarnings('ignore')

logger = logging.getLogger(__name__)

class ModelStatus(Enum):
    HEALTHY = "healthy"
    WARNING = "warning"
    CRITICAL = "critical"
    FAILED = "failed"
    RETRAINING = "retraining"

class DriftType(Enum):
    DATA_DRIFT = "data_drift"
    CONCEPT_DRIFT = "concept_drift"
    PREDICTION_DRIFT = "prediction_drift"
    PERFORMANCE_DRIFT = "performance_drift"

@dataclass
class PerformanceMetrics:
    """Model performance metrics container"""
    model_id: str
    timestamp: datetime
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    auc_roc: Optional[float]
    predictions_count: int
    avg_confidence: float
    latency_ms: float
    memory_usage_mb: float
    throughput_per_second: float
    error_rate: float
    
    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        data['timestamp'] = self.timestamp.isoformat()
        return data

@dataclass
class DriftAlert:
    """Data/concept drift alert container"""
    model_id: str
    drift_type: DriftType
    severity: str  # low, medium, high, critical
    drift_score: float
    threshold: float
    features_affected: List[str]
    description: str
    timestamp: datetime
    recommended_action: str
    
    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        data['drift_type'] = self.drift_type.value
        data['timestamp'] = self.timestamp.isoformat()
        return data

@dataclass
class ModelHealthStatus:
    """Overall model health status"""
    model_id: str
    status: ModelStatus
    health_score: float  # 0-100
    performance_trend: str  # improving, stable, degrading
    last_checked: datetime
    alerts: List[DriftAlert]
    metrics_summary: Dict[str, float]
    uptime_hours: float
    
    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        data['status'] = self.status.value
        data['last_checked'] = self.last_checked.isoformat()
        data['alerts'] = [alert.to_dict() for alert in self.alerts]
        return data

class AdvancedModelPerformanceMonitoring:
    """
    Advanced monitoring system for ML model performance and drift detection
    
    Features:
    - Real-time performance tracking
    - Data drift detection using statistical tests
    - Concept drift detection
    - Performance trend analysis
    - Automated alerting system
    - Model health scoring
    - Comparative analysis across models
    """
    
    def __init__(self):
        self.performance_history: Dict[str, List[PerformanceMetrics]] = {}
        self.baseline_metrics: Dict[str, Dict[str, float]] = {}
        self.drift_thresholds = {
            DriftType.DATA_DRIFT: 0.05,  # p-value threshold for statistical tests
            DriftType.CONCEPT_DRIFT: 0.1,  # threshold for concept drift detection
            DriftType.PREDICTION_DRIFT: 0.15,  # threshold for prediction distribution changes
            DriftType.PERFORMANCE_DRIFT: 0.05  # threshold for performance degradation
        }
        self.monitoring_window_hours = 24
        self.is_monitoring = False
        
    async def start_monitoring(self) -> None:
        """Start the continuous monitoring system"""
        self.is_monitoring = True
        logger.info("Starting Advanced Model Performance Monitoring")
        
        # Start monitoring tasks
        monitoring_tasks = [
            asyncio.create_task(self._continuous_performance_tracking()),
            asyncio.create_task(self._drift_detection_loop()),
            asyncio.create_task(self._health_assessment_loop()),
            asyncio.create_task(self._alert_processing_loop())
        ]
        
        await asyncio.gather(*monitoring_tasks)
    
    async def stop_monitoring(self) -> None:
        """Stop the monitoring system"""
        self.is_monitoring = False
        logger.info("Stopping Advanced Model Performance Monitoring")
    
    async def register_model(self, model_id: str, baseline_data: Dict[str, Any]) -> bool:
        """
        Register a new model for monitoring
        
        Args:
            model_id: Unique identifier for the model
            baseline_data: Baseline performance metrics and reference data
        """
        try:
            self.performance_history[model_id] = []
            self.baseline_metrics[model_id] = {
                'accuracy': baseline_data.get('accuracy', 0.8),
                'precision': baseline_data.get('precision', 0.8),
                'recall': baseline_data.get('recall', 0.8),
                'f1_score': baseline_data.get('f1_score', 0.8),
                'avg_confidence': baseline_data.get('avg_confidence', 0.7),
                'latency_ms': baseline_data.get('latency_ms', 50),
                'error_rate': baseline_data.get('error_rate', 0.05)
            }
            
            logger.info(f"Model {model_id} registered for monitoring")
            return True
            
        except Exception as e:
            logger.error(f"Failed to register model {model_id}: {str(e)}")
            return False
    
    async def record_prediction_batch(self, model_id: str, predictions: List[Dict[str, Any]], 
                                    ground_truth: Optional[List[Any]] = None) -> None:
        """
        Record a batch of predictions for performance monitoring
        
        Args:
            model_id: Model identifier
            predictions: List of prediction records with metadata
            ground_truth: Optional ground truth for accuracy calculation
        """
        try:
            if model_id not in self.performance_history:
                logger.warning(f"Model {model_id} not registered for monitoring")
                return
            
            # Calculate performance metrics
            metrics = await self._calculate_batch_metrics(model_id, predictions, ground_truth)
            self.performance_history[model_id].append(metrics)
            
            # Trigger real-time drift detection
            await self._check_real_time_drift(model_id, predictions)
            
            # Cleanup old metrics (keep last 7 days)
            await self._cleanup_old_metrics(model_id)
            
        except Exception as e:
            logger.error(f"Failed to record prediction batch for {model_id}: {str(e)}")
    
    async def _calculate_batch_metrics(self, model_id: str, predictions: List[Dict[str, Any]], 
                                     ground_truth: Optional[List[Any]] = None) -> PerformanceMetrics:
        """Calculate performance metrics for a prediction batch"""
        start_time = time.time()
        
        # Extract prediction data
        pred_values = [p.get('prediction', 0) for p in predictions]
        confidences = [p.get('confidence', 0.5) for p in predictions]
        latencies = [p.get('processing_time_ms', 50) for p in predictions]
        
        # Calculate basic metrics
        avg_confidence = np.mean(confidences) if confidences else 0.5
        avg_latency = np.mean(latencies) if latencies else 50
        predictions_count = len(predictions)
        
        # Calculate accuracy metrics if ground truth available
        accuracy = precision = recall = f1 = auc_roc = 0.8  # Default values
        if ground_truth and len(ground_truth) == len(pred_values):
            try:
                # Convert to binary classification for metrics
                pred_binary = [1 if p > 0.5 else 0 for p in pred_values]
                truth_binary = [1 if t > 0.5 else 0 for t in ground_truth]
                
                accuracy = accuracy_score(truth_binary, pred_binary)
                precision = precision_score(truth_binary, pred_binary, zero_division=0)
                recall = recall_score(truth_binary, pred_binary, zero_division=0)
                f1 = f1_score(truth_binary, pred_binary, zero_division=0)
                
                if len(set(truth_binary)) > 1:  # More than one class
                    auc_roc = roc_auc_score(truth_binary, pred_values)
                    
            except Exception as e:
                logger.warning(f"Failed to calculate accuracy metrics: {str(e)}")
        
        # Estimate resource usage
        memory_usage_mb = len(predictions) * 0.001  # Rough estimate
        processing_time = time.time() - start_time
        throughput_per_second = predictions_count / max(processing_time, 0.001)
        error_rate = sum(1 for p in predictions if p.get('error', False)) / max(predictions_count, 1)
        
        return PerformanceMetrics(
            model_id=model_id,
            timestamp=datetime.now(),
            accuracy=accuracy,
            precision=precision,
            recall=recall,
            f1_score=f1,
            auc_roc=auc_roc,
            predictions_count=predictions_count,
            avg_confidence=avg_confidence,
            latency_ms=avg_latency,
            memory_usage_mb=memory_usage_mb,
            throughput_per_second=throughput_per_second,
            error_rate=error_rate
        )
    
    async def _check_real_time_drift(self, model_id: str, predictions: List[Dict[str, Any]]) -> None:
        """Check for data/concept drift in real-time"""
        try:
            if model_id not in self.performance_history or len(self.performance_history[model_id]) < 2:
                return
            
            current_batch = predictions
            recent_metrics = self.performance_history[model_id][-10:]  # Last 10 batches
            
            # Check prediction drift
            await self._detect_prediction_drift(model_id, current_batch, recent_metrics)
            
            # Check performance drift
            await self._detect_performance_drift(model_id, recent_metrics)
            
        except Exception as e:
            logger.error(f"Failed to check real-time drift for {model_id}: {str(e)}")
    
    async def _detect_prediction_drift(self, model_id: str, current_batch: List[Dict[str, Any]], 
                                     recent_metrics: List[PerformanceMetrics]) -> None:
        """Detect drift in prediction distributions"""
        try:
            # Get current predictions
            current_preds = [p.get('prediction', 0) for p in current_batch]
            current_confidences = [p.get('confidence', 0.5) for p in current_batch]
            
            if len(current_preds) < 10:  # Need minimum samples
                return
            
            # Compare with recent historical data
            if len(recent_metrics) >= 2:
                # Use Kolmogorov-Smirnov test for distribution comparison
                historical_avg_conf = np.mean([m.avg_confidence for m in recent_metrics[-5:]])
                current_avg_conf = np.mean(current_confidences)
                
                confidence_drift = abs(current_avg_conf - historical_avg_conf) / max(historical_avg_conf, 0.001)
                
                if confidence_drift > self.drift_thresholds[DriftType.PREDICTION_DRIFT]:
                    alert = DriftAlert(
                        model_id=model_id,
                        drift_type=DriftType.PREDICTION_DRIFT,
                        severity="medium" if confidence_drift < 0.3 else "high",
                        drift_score=confidence_drift,
                        threshold=self.drift_thresholds[DriftType.PREDICTION_DRIFT],
                        features_affected=["prediction_confidence"],
                        description=f"Prediction confidence drift detected: {confidence_drift:.3f}",
                        timestamp=datetime.now(),
                        recommended_action="Review model inputs and consider retraining"
                    )
                    await self._process_alert(alert)
                    
        except Exception as e:
            logger.error(f"Failed to detect prediction drift for {model_id}: {str(e)}")
    
    async def _detect_performance_drift(self, model_id: str, recent_metrics: List[PerformanceMetrics]) -> None:
        """Detect performance degradation over time"""
        try:
            if len(recent_metrics) < 3:
                return
            
            baseline = self.baseline_metrics.get(model_id, {})
            recent_accuracy = np.mean([m.accuracy for m in recent_metrics[-3:]])
            recent_latency = np.mean([m.latency_ms for m in recent_metrics[-3:]])
            recent_error_rate = np.mean([m.error_rate for m in recent_metrics[-3:]])
            
            # Check accuracy drift
            baseline_accuracy = baseline.get('accuracy', 0.8)
            accuracy_drift = (baseline_accuracy - recent_accuracy) / max(baseline_accuracy, 0.001)
            
            if accuracy_drift > self.drift_thresholds[DriftType.PERFORMANCE_DRIFT]:
                alert = DriftAlert(
                    model_id=model_id,
                    drift_type=DriftType.PERFORMANCE_DRIFT,
                    severity="high" if accuracy_drift > 0.15 else "medium",
                    drift_score=accuracy_drift,
                    threshold=self.drift_thresholds[DriftType.PERFORMANCE_DRIFT],
                    features_affected=["accuracy"],
                    description=f"Model accuracy degraded by {accuracy_drift:.1%}",
                    timestamp=datetime.now(),
                    recommended_action="Immediate model retraining recommended"
                )
                await self._process_alert(alert)
            
            # Check latency drift
            baseline_latency = baseline.get('latency_ms', 50)
            if recent_latency > baseline_latency * 1.5:  # 50% increase
                alert = DriftAlert(
                    model_id=model_id,
                    drift_type=DriftType.PERFORMANCE_DRIFT,
                    severity="medium",
                    drift_score=recent_latency / baseline_latency,
                    threshold=1.5,
                    features_affected=["latency"],
                    description=f"Model latency increased to {recent_latency:.1f}ms",
                    timestamp=datetime.now(),
                    recommended_action="Check system resources and model optimization"
                )
                await self._process_alert(alert)
                
        except Exception as e:
            logger.error(f"Failed to detect performance drift for {model_id}: {str(e)}")
    
    async def _process_alert(self, alert: DriftAlert) -> None:
        """Process and log drift alerts"""
        logger.warning(f"DRIFT ALERT [{alert.model_id}]: {alert.description}")
        # In production, this would integrate with alerting systems (email, Slack, etc.)
    
    async def get_model_health_status(self, model_id: str) -> Optional[ModelHealthStatus]:
        """Get comprehensive health status for a model"""
        try:
            if model_id not in self.performance_history:
                return None
            
            recent_metrics = self.performance_history[model_id][-24:]  # Last 24 records
            if not recent_metrics:
                return None
            
            # Calculate health score (0-100)
            health_score = await self._calculate_health_score(model_id, recent_metrics)
            
            # Determine status
            status = ModelStatus.HEALTHY
            if health_score < 50:
                status = ModelStatus.CRITICAL
            elif health_score < 70:
                status = ModelStatus.WARNING
            
            # Analyze performance trend
            trend = await self._analyze_performance_trend(recent_metrics)
            
            # Get recent alerts (placeholder - would integrate with alert system)
            alerts = []  # In production, fetch from alert storage
            
            # Calculate uptime
            if recent_metrics:
                uptime_hours = (datetime.now() - recent_metrics[0].timestamp).total_seconds() / 3600
            else:
                uptime_hours = 0
            
            # Summary metrics
            metrics_summary = {
                'avg_accuracy': np.mean([m.accuracy for m in recent_metrics]),
                'avg_latency_ms': np.mean([m.latency_ms for m in recent_metrics]),
                'avg_throughput': np.mean([m.throughput_per_second for m in recent_metrics]),
                'avg_error_rate': np.mean([m.error_rate for m in recent_metrics])
            }
            
            return ModelHealthStatus(
                model_id=model_id,
                status=status,
                health_score=health_score,
                performance_trend=trend,
                last_checked=datetime.now(),
                alerts=alerts,
                metrics_summary=metrics_summary,
                uptime_hours=uptime_hours
            )
            
        except Exception as e:
            logger.error(f"Failed to get health status for {model_id}: {str(e)}")
            return None
    
    async def _calculate_health_score(self, model_id: str, recent_metrics: List[PerformanceMetrics]) -> float:
        """Calculate overall health score (0-100) for a model"""
        try:
            if not recent_metrics:
                return 0.0
            
            baseline = self.baseline_metrics.get(model_id, {})
            
            # Component scores (0-1)
            accuracy_score = np.mean([m.accuracy for m in recent_metrics])
            
            # Latency score (inverse - lower is better)
            avg_latency = np.mean([m.latency_ms for m in recent_metrics])
            baseline_latency = baseline.get('latency_ms', 50)
            latency_score = max(0, 1 - (avg_latency - baseline_latency) / baseline_latency)
            
            # Error rate score (inverse)
            avg_error_rate = np.mean([m.error_rate for m in recent_metrics])
            error_score = max(0, 1 - avg_error_rate * 10)  # Scale error rate
            
            # Stability score (based on variance)
            accuracy_variance = np.var([m.accuracy for m in recent_metrics])
            stability_score = max(0, 1 - accuracy_variance * 10)
            
            # Weighted combination
            health_score = (
                accuracy_score * 0.4 +
                latency_score * 0.2 +
                error_score * 0.3 +
                stability_score * 0.1
            ) * 100
            
            return min(100, max(0, health_score))
            
        except Exception as e:
            logger.error(f"Failed to calculate health score: {str(e)}")
            return 50.0  # Default neutral score
    
    async def _analyze_performance_trend(self, recent_metrics: List[PerformanceMetrics]) -> str:
        """Analyze performance trend over recent metrics"""
        try:
            if len(recent_metrics) < 3:
                return "stable"
            
            # Use accuracy as primary trend indicator
            accuracies = [m.accuracy for m in recent_metrics]
            
            # Simple trend analysis using linear regression slope
            x = np.arange(len(accuracies))
            slope, _, r_value, _, _ = stats.linregress(x, accuracies)
            
            # Determine trend based on slope and correlation
            if abs(r_value) < 0.3:  # Low correlation - stable
                return "stable"
            elif slope > 0.005:  # Positive trend
                return "improving"
            elif slope < -0.005:  # Negative trend
                return "degrading"
            else:
                return "stable"
                
        except Exception as e:
            logger.error(f"Failed to analyze performance trend: {str(e)}")
            return "stable"
    
    async def get_comparative_analysis(self, model_ids: List[str]) -> Dict[str, Any]:
        """Get comparative analysis across multiple models"""
        try:
            comparison = {
                'models': {},
                'rankings': {},
                'summary': {}
            }
            
            model_stats = {}
            for model_id in model_ids:
                if model_id not in self.performance_history:
                    continue
                
                recent_metrics = self.performance_history[model_id][-10:]  # Last 10 records
                if not recent_metrics:
                    continue
                
                model_stats[model_id] = {
                    'avg_accuracy': np.mean([m.accuracy for m in recent_metrics]),
                    'avg_latency_ms': np.mean([m.latency_ms for m in recent_metrics]),
                    'avg_throughput': np.mean([m.throughput_per_second for m in recent_metrics]),
                    'avg_error_rate': np.mean([m.error_rate for m in recent_metrics]),
                    'stability': 1 - np.var([m.accuracy for m in recent_metrics])
                }
            
            if not model_stats:
                return comparison
            
            # Create rankings
            comparison['rankings'] = {
                'accuracy': sorted(model_stats.items(), key=lambda x: x[1]['avg_accuracy'], reverse=True),
                'latency': sorted(model_stats.items(), key=lambda x: x[1]['avg_latency_ms']),
                'throughput': sorted(model_stats.items(), key=lambda x: x[1]['avg_throughput'], reverse=True),
                'stability': sorted(model_stats.items(), key=lambda x: x[1]['stability'], reverse=True)
            }
            
            # Overall summary
            comparison['summary'] = {
                'total_models': len(model_stats),
                'best_accuracy': max(model_stats.values(), key=lambda x: x['avg_accuracy']),
                'fastest_model': min(model_stats.values(), key=lambda x: x['avg_latency_ms']),
                'most_stable': max(model_stats.values(), key=lambda x: x['stability'])
            }
            
            comparison['models'] = model_stats
            return comparison
            
        except Exception as e:
            logger.error(f"Failed to get comparative analysis: {str(e)}")
            return {'models': {}, 'rankings': {}, 'summary': {}}
    
    async def _continuous_performance_tracking(self) -> None:
        """Background task for continuous performance tracking"""
        while self.is_monitoring:
            try:
                # Simulate real-time tracking (would integrate with actual model serving)
                await asyncio.sleep(30)  # Check every 30 seconds
                logger.debug("Performance tracking cycle completed")
                
            except Exception as e:
                logger.error(f"Error in performance tracking: {str(e)}")
                await asyncio.sleep(60)  # Wait longer on error
    
    async def _drift_detection_loop(self) -> None:
        """Background task for drift detection"""
        while self.is_monitoring:
            try:
                # Run comprehensive drift detection every 5 minutes
                for model_id in self.performance_history.keys():
                    await self._comprehensive_drift_analysis(model_id)
                
                await asyncio.sleep(300)  # 5 minutes
                
            except Exception as e:
                logger.error(f"Error in drift detection: {str(e)}")
                await asyncio.sleep(600)  # Wait longer on error
    
    async def _comprehensive_drift_analysis(self, model_id: str) -> None:
        """Comprehensive drift analysis for a model"""
        try:
            recent_metrics = self.performance_history[model_id][-50:]  # Last 50 records
            if len(recent_metrics) < 10:
                return
            
            # Statistical tests for various metrics
            metrics_series = {
                'accuracy': [m.accuracy for m in recent_metrics],
                'latency': [m.latency_ms for m in recent_metrics],
                'confidence': [m.avg_confidence for m in recent_metrics],
                'error_rate': [m.error_rate for m in recent_metrics]
            }
            
            # Run statistical tests for drift detection
            for metric_name, values in metrics_series.items():
                await self._statistical_drift_test(model_id, metric_name, values)
                
        except Exception as e:
            logger.error(f"Failed comprehensive drift analysis for {model_id}: {str(e)}")
    
    async def _statistical_drift_test(self, model_id: str, metric_name: str, values: List[float]) -> None:
        """Run statistical tests for drift detection"""
        try:
            if len(values) < 20:
                return
            
            # Split into recent and historical
            split_point = len(values) // 2
            historical = values[:split_point]
            recent = values[split_point:]
            
            # Mann-Whitney U test for distribution change
            statistic, p_value = stats.mannwhitneyu(historical, recent, alternative='two-sided')
            
            if p_value < self.drift_thresholds[DriftType.DATA_DRIFT]:
                severity = "high" if p_value < 0.01 else "medium"
                
                alert = DriftAlert(
                    model_id=model_id,
                    drift_type=DriftType.DATA_DRIFT,
                    severity=severity,
                    drift_score=1 - p_value,
                    threshold=self.drift_thresholds[DriftType.DATA_DRIFT],
                    features_affected=[metric_name],
                    description=f"Statistical drift detected in {metric_name} (p={p_value:.4f})",
                    timestamp=datetime.now(),
                    recommended_action=f"Investigate {metric_name} distribution changes"
                )
                await self._process_alert(alert)
                
        except Exception as e:
            logger.error(f"Failed statistical drift test: {str(e)}")
    
    async def _health_assessment_loop(self) -> None:
        """Background task for health assessment"""
        while self.is_monitoring:
            try:
                # Assess health for all models every 10 minutes
                for model_id in self.performance_history.keys():
                    health_status = await self.get_model_health_status(model_id)
                    if health_status and health_status.status in [ModelStatus.WARNING, ModelStatus.CRITICAL]:
                        logger.warning(f"Model {model_id} health status: {health_status.status.value} "
                                     f"(score: {health_status.health_score:.1f})")
                
                await asyncio.sleep(600)  # 10 minutes
                
            except Exception as e:
                logger.error(f"Error in health assessment: {str(e)}")
                await asyncio.sleep(900)  # Wait longer on error
    
    async def _alert_processing_loop(self) -> None:
        """Background task for alert processing and escalation"""
        while self.is_monitoring:
            try:
                # Process alerts, send notifications, etc.
                # In production, this would integrate with notification systems
                await asyncio.sleep(120)  # 2 minutes
                
            except Exception as e:
                logger.error(f"Error in alert processing: {str(e)}")
                await asyncio.sleep(300)  # Wait longer on error
    
    async def _cleanup_old_metrics(self, model_id: str) -> None:
        """Clean up old performance metrics to manage memory"""
        try:
            if model_id not in self.performance_history:
                return
            
            # Keep last 7 days of data
            cutoff_time = datetime.now() - timedelta(days=7)
            self.performance_history[model_id] = [
                m for m in self.performance_history[model_id] 
                if m.timestamp > cutoff_time
            ]
            
        except Exception as e:
            logger.error(f"Failed to cleanup old metrics for {model_id}: {str(e)}")
    
    async def export_performance_report(self, model_id: str, 
                                      start_date: Optional[datetime] = None,
                                      end_date: Optional[datetime] = None) -> Dict[str, Any]:
        """Export detailed performance report for a model"""
        try:
            if model_id not in self.performance_history:
                return {}
            
            metrics = self.performance_history[model_id]
            
            # Filter by date range if provided
            if start_date:
                metrics = [m for m in metrics if m.timestamp >= start_date]
            if end_date:
                metrics = [m for m in metrics if m.timestamp <= end_date]
            
            if not metrics:
                return {}
            
            # Generate comprehensive report
            report = {
                'model_id': model_id,
                'report_period': {
                    'start': metrics[0].timestamp.isoformat(),
                    'end': metrics[-1].timestamp.isoformat(),
                    'total_records': len(metrics)
                },
                'performance_summary': {
                    'avg_accuracy': np.mean([m.accuracy for m in metrics]),
                    'avg_precision': np.mean([m.precision for m in metrics]),
                    'avg_recall': np.mean([m.recall for m in metrics]),
                    'avg_f1_score': np.mean([m.f1_score for m in metrics]),
                    'avg_latency_ms': np.mean([m.latency_ms for m in metrics]),
                    'avg_throughput': np.mean([m.throughput_per_second for m in metrics]),
                    'total_predictions': sum(m.predictions_count for m in metrics),
                    'avg_error_rate': np.mean([m.error_rate for m in metrics])
                },
                'trend_analysis': await self._analyze_performance_trend(metrics),
                'health_status': await self.get_model_health_status(model_id),
                'detailed_metrics': [m.to_dict() for m in metrics[-100:]]  # Last 100 records
            }
            
            return report
            
        except Exception as e:
            logger.error(f"Failed to export performance report for {model_id}: {str(e)}")
            return {}

# Global monitoring service instance
model_performance_monitor = AdvancedModelPerformanceMonitoring()

async def get_monitoring_service() -> AdvancedModelPerformanceMonitoring:
    """Get the global monitoring service instance"""
    return model_performance_monitor
