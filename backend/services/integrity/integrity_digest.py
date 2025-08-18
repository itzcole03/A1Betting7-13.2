"""
Integrity Digest Generator

Generates comprehensive daily integrity reports and artifacts with retention pruning.
Provides system-wide health and performance summaries.
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import shutil
from dataclasses import dataclass, asdict
from datetime import datetime, timezone, timedelta, date
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
import time

from ..unified_config import unified_config
from ..unified_logging import get_logger
from ..unified_cache_service import unified_cache_service

logger = get_logger("integrity_digest")


@dataclass
class SystemHealthMetrics:
    """System health and performance metrics"""
    
    # Overall health status
    overall_status: str = "HEALTHY"  # HEALTHY, DEGRADED, CRITICAL
    health_score: float = 1.0  # 0.0 - 1.0
    
    # Performance metrics
    avg_response_time_ms: float = 0.0
    p95_response_time_ms: float = 0.0
    error_rate: float = 0.0
    throughput_rps: float = 0.0
    
    # Resource utilization
    cpu_usage_percent: float = 0.0
    memory_usage_percent: float = 0.0
    disk_usage_percent: float = 0.0
    
    # Service availability
    uptime_percent: float = 100.0
    service_incidents: int = 0
    
    # Data quality
    data_freshness_hours: float = 0.0
    data_completeness_percent: float = 100.0
    data_accuracy_score: float = 1.0


@dataclass
class ModelPerformanceMetrics:
    """Model performance and accuracy metrics"""
    
    # Model identification
    model_version: str
    model_name: str
    
    # Performance metrics
    accuracy_score: float = 0.0
    precision: float = 0.0
    recall: float = 0.0
    f1_score: float = 0.0
    
    # Operational metrics
    prediction_count: int = 0
    avg_inference_time_ms: float = 0.0
    error_count: int = 0
    
    # Business metrics
    edge_success_rate: float = 0.0
    portfolio_performance: float = 0.0


@dataclass
class EdgePerformanceMetrics:
    """Edge detection and betting performance metrics"""
    
    # Edge detection
    edges_detected: int = 0
    avg_edge_confidence: float = 0.0
    high_confidence_edges: int = 0
    
    # Edge outcomes
    edges_settled: int = 0
    successful_edges: int = 0
    edge_success_rate: float = 0.0
    
    # Financial performance
    total_edge_value: float = 0.0
    realized_profit: float = 0.0
    roi_percent: float = 0.0


@dataclass
class CalibrationMetrics:
    """Calibration system metrics"""
    
    # Calibration coverage
    supported_prop_types: List[str]
    calibrated_props: int = 0
    
    # Calibration accuracy
    avg_calibration_accuracy: float = 0.0
    calibration_drift: float = 0.0
    
    # Reliability assessment
    high_reliability_props: int = 0
    medium_reliability_props: int = 0
    low_reliability_props: int = 0


@dataclass
class IntegrityDigest:
    """Complete daily integrity digest"""
    
    # Metadata
    report_date: datetime
    generation_timestamp: datetime
    report_id: str
    
    # System metrics
    system_health: SystemHealthMetrics
    model_performance: List[ModelPerformanceMetrics]
    edge_performance: EdgePerformanceMetrics
    calibration_metrics: CalibrationMetrics
    
    # Alerts and issues
    critical_alerts: List[Dict[str, Any]]
    warning_alerts: List[Dict[str, Any]]
    resolved_issues: List[Dict[str, Any]]
    
    # Performance trends
    week_over_week_changes: Dict[str, float]
    month_over_month_changes: Dict[str, float]
    
    # Recommendations
    action_items: List[str]
    optimization_suggestions: List[str]
    
    # Summary statistics
    summary: Dict[str, Any]


class IntegrityDigestGenerator:
    """Generates daily integrity digests and manages artifact retention"""
    
    def __init__(self):
        self.config = unified_config
        self.cache = unified_cache_service
        self.logger = logger
        
        # Configuration
        self.artifact_base_path = Path(
            self.config.get_config_value("integrity_digest.artifact_path", "./artifacts/integrity")
        )
        self.retention_days = self.config.get_config_value(
            "integrity_digest.retention_days", 90
        )
        
        # Feature flags
        self.enable_model_metrics = self.config.get_config_value(
            "integrity_digest.enable_model_metrics", True
        )
        self.enable_edge_metrics = self.config.get_config_value(
            "integrity_digest.enable_edge_metrics", True
        )
        self.enable_calibration_metrics = self.config.get_config_value(
            "integrity_digest.enable_calibration_metrics", True
        )
        self.enable_trend_analysis = self.config.get_config_value(
            "integrity_digest.enable_trend_analysis", True
        )
        
        # Ensure artifact directory exists
        self.artifact_base_path.mkdir(parents=True, exist_ok=True)
    
    async def generate_daily_digest(
        self, 
        target_date: Optional[date] = None,
        include_artifacts: bool = True
    ) -> IntegrityDigest:
        """
        Generate comprehensive daily integrity digest.
        
        Args:
            target_date: Date to generate digest for (defaults to yesterday)
            include_artifacts: Whether to save artifacts to disk
            
        Returns:
            IntegrityDigest: Complete integrity report
        """
        start_time = time.time()
        
        if target_date is None:
            target_date = datetime.now(timezone.utc).date()
        
        report_id = f"integrity_digest_{target_date.strftime('%Y%m%d')}"
        
        self.logger.info(f"Generating integrity digest for {target_date}")
        
        try:
            # Initialize digest structure
            digest = IntegrityDigest(
                report_date=datetime.combine(target_date, datetime.min.time(), timezone.utc),
                generation_timestamp=datetime.now(timezone.utc),
                report_id=report_id,
                system_health=SystemHealthMetrics(),
                model_performance=[],
                edge_performance=EdgePerformanceMetrics(),
                calibration_metrics=CalibrationMetrics(supported_prop_types=[]),
                critical_alerts=[],
                warning_alerts=[],
                resolved_issues=[],
                week_over_week_changes={},
                month_over_month_changes={},
                action_items=[],
                optimization_suggestions=[],
                summary={}
            )
            
            # Gather system health metrics
            await self._collect_system_health_metrics(digest, target_date)
            
            # Gather model performance metrics
            if self.enable_model_metrics:
                await self._collect_model_performance_metrics(digest, target_date)
            
            # Gather edge performance metrics
            if self.enable_edge_metrics:
                await self._collect_edge_performance_metrics(digest, target_date)
            
            # Gather calibration metrics
            if self.enable_calibration_metrics:
                await self._collect_calibration_metrics(digest, target_date)
            
            # Analyze trends
            if self.enable_trend_analysis:
                await self._analyze_performance_trends(digest, target_date)
            
            # Collect alerts and issues
            await self._collect_alerts_and_issues(digest, target_date)
            
            # Generate recommendations
            await self._generate_recommendations(digest)
            
            # Create summary
            self._create_summary(digest)
            
            # Save artifacts if requested
            if include_artifacts:
                await self._save_digest_artifacts(digest)
            
            generation_time = time.time() - start_time
            
            self.logger.info(
                f"Generated integrity digest {report_id} in {generation_time:.2f}s: "
                f"health_score={digest.system_health.health_score:.3f}, "
                f"models={len(digest.model_performance)}, "
                f"alerts={len(digest.critical_alerts)}"
            )
            
            return digest
            
        except Exception as e:
            self.logger.error(f"Error generating integrity digest: {e}")
            raise
    
    async def _collect_system_health_metrics(self, digest: IntegrityDigest, target_date: date):
        """Collect system health and performance metrics"""
        try:
            # Placeholder implementation - would connect to monitoring systems
            health_metrics = SystemHealthMetrics(
                overall_status="HEALTHY",
                health_score=0.95,
                avg_response_time_ms=245.0,
                p95_response_time_ms=450.0,
                error_rate=0.0008,
                throughput_rps=125.0,
                cpu_usage_percent=68.0,
                memory_usage_percent=72.0,
                disk_usage_percent=45.0,
                uptime_percent=99.8,
                service_incidents=0,
                data_freshness_hours=1.2,
                data_completeness_percent=98.5,
                data_accuracy_score=0.94
            )
            
            digest.system_health = health_metrics
            
        except Exception as e:
            self.logger.error(f"Error collecting system health metrics: {e}")
    
    async def _collect_model_performance_metrics(self, digest: IntegrityDigest, target_date: date):
        """Collect model performance metrics"""
        try:
            # Mock model performance data
            models = [
                {
                    "version": "v2.1.0_hits_predictor",
                    "name": "Hits Prediction Model",
                    "accuracy": 0.78,
                    "predictions": 12450
                },
                {
                    "version": "v1.8.3_strikeouts_model", 
                    "name": "Strikeouts Prediction Model",
                    "accuracy": 0.82,
                    "predictions": 8920
                },
                {
                    "version": "v3.0.1_ensemble_model",
                    "name": "Multi-Prop Ensemble",
                    "accuracy": 0.85,
                    "predictions": 25600
                }
            ]
            
            for model_info in models:
                model_metrics = ModelPerformanceMetrics(
                    model_version=model_info["version"],
                    model_name=model_info["name"],
                    accuracy_score=model_info["accuracy"],
                    precision=model_info["accuracy"] + 0.02,
                    recall=model_info["accuracy"] - 0.01,
                    f1_score=model_info["accuracy"],
                    prediction_count=model_info["predictions"],
                    avg_inference_time_ms=180.0 + hash(model_info["version"]) % 100,
                    error_count=int(model_info["predictions"] * 0.001),
                    edge_success_rate=0.65 + (hash(model_info["version"]) % 20) * 0.01,
                    portfolio_performance=0.08 + (hash(model_info["version"]) % 15) * 0.01
                )
                
                digest.model_performance.append(model_metrics)
                
        except Exception as e:
            self.logger.error(f"Error collecting model performance metrics: {e}")
    
    async def _collect_edge_performance_metrics(self, digest: IntegrityDigest, target_date: date):
        """Collect edge detection and performance metrics"""
        try:
            edge_metrics = EdgePerformanceMetrics(
                edges_detected=245,
                avg_edge_confidence=0.72,
                high_confidence_edges=67,
                edges_settled=198,
                successful_edges=134,
                edge_success_rate=0.677,  # 134/198
                total_edge_value=12450.0,
                realized_profit=3210.0,
                roi_percent=0.258  # 25.8%
            )
            
            digest.edge_performance = edge_metrics
            
        except Exception as e:
            self.logger.error(f"Error collecting edge performance metrics: {e}")
    
    async def _collect_calibration_metrics(self, digest: IntegrityDigest, target_date: date):
        """Collect calibration system metrics"""
        try:
            calibration_metrics = CalibrationMetrics(
                calibrated_props=1247,
                supported_prop_types=["STRIKEOUTS_PITCHER", "HITS_BATTER"],
                avg_calibration_accuracy=0.74,
                calibration_drift=0.02,
                high_reliability_props=312,
                medium_reliability_props=689,
                low_reliability_props=246
            )
            
            digest.calibration_metrics = calibration_metrics
            
        except Exception as e:
            self.logger.error(f"Error collecting calibration metrics: {e}")
    
    async def _analyze_performance_trends(self, digest: IntegrityDigest, target_date: date):
        """Analyze week-over-week and month-over-month performance trends"""
        try:
            # Mock trend analysis - would compare with historical data
            digest.week_over_week_changes = {
                "system_health_score": 0.02,  # +2%
                "avg_model_accuracy": 0.015,  # +1.5%
                "edge_success_rate": -0.008,  # -0.8%
                "response_time": 0.05,  # +5%
                "error_rate": -0.02  # -2%
            }
            
            digest.month_over_month_changes = {
                "system_health_score": 0.08,  # +8%
                "avg_model_accuracy": 0.04,   # +4%
                "edge_success_rate": 0.03,    # +3%
                "response_time": -0.12,       # -12% (improvement)
                "error_rate": -0.15           # -15% (improvement)
            }
            
        except Exception as e:
            self.logger.error(f"Error analyzing performance trends: {e}")
    
    async def _collect_alerts_and_issues(self, digest: IntegrityDigest, target_date: date):
        """Collect alerts and resolved issues"""
        try:
            # Mock alerts - would query alerting system
            if digest.system_health.error_rate > 0.001:
                digest.warning_alerts.append({
                    "alert_id": "WARN_001",
                    "severity": "WARNING",
                    "message": f"Error rate slightly elevated: {digest.system_health.error_rate:.4f}",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "component": "api"
                })
            
            if digest.system_health.p95_response_time_ms > 400:
                digest.warning_alerts.append({
                    "alert_id": "WARN_002",
                    "severity": "WARNING", 
                    "message": f"Response time elevated: {digest.system_health.p95_response_time_ms}ms",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "component": "performance"
                })
            
            # Mock resolved issues
            digest.resolved_issues.append({
                "issue_id": "RESOLVED_001",
                "description": "Database connection pool exhaustion resolved",
                "resolved_at": (datetime.now(timezone.utc) - timedelta(hours=6)).isoformat(),
                "resolution": "Increased pool size from 10 to 20 connections"
            })
            
        except Exception as e:
            self.logger.error(f"Error collecting alerts and issues: {e}")
    
    async def _generate_recommendations(self, digest: IntegrityDigest):
        """Generate action items and optimization suggestions"""
        try:
            # Generate recommendations based on metrics
            
            # System health recommendations
            if digest.system_health.health_score < 0.9:
                digest.action_items.append(
                    f"System health score is {digest.system_health.health_score:.3f}. "
                    "Investigate and address performance issues."
                )
            
            if digest.system_health.error_rate > 0.001:
                digest.action_items.append(
                    f"Error rate is {digest.system_health.error_rate:.4f}. "
                    "Review error logs and implement fixes."
                )
            
            # Model performance recommendations
            low_performing_models = [
                m for m in digest.model_performance 
                if m.accuracy_score < 0.75
            ]
            
            if low_performing_models:
                digest.action_items.append(
                    f"Found {len(low_performing_models)} models with accuracy < 75%. "
                    "Consider retraining or replacing these models."
                )
            
            # Edge performance recommendations
            if digest.edge_performance.edge_success_rate < 0.65:
                digest.action_items.append(
                    f"Edge success rate is {digest.edge_performance.edge_success_rate:.3f}. "
                    "Review edge detection criteria and calibration."
                )
            
            # Optimization suggestions
            if digest.system_health.p95_response_time_ms > 500:
                digest.optimization_suggestions.append(
                    "Consider implementing response time optimizations such as "
                    "caching improvements or query optimization."
                )
            
            if digest.calibration_metrics.low_reliability_props > digest.calibration_metrics.high_reliability_props:
                digest.optimization_suggestions.append(
                    "High number of low-reliability props detected. "
                    "Consider improving calibration algorithms or data quality."
                )
            
        except Exception as e:
            self.logger.error(f"Error generating recommendations: {e}")
    
    def _create_summary(self, digest: IntegrityDigest):
        """Create summary statistics for the digest"""
        try:
            total_predictions = sum(m.prediction_count for m in digest.model_performance)
            avg_model_accuracy = (
                sum(m.accuracy_score for m in digest.model_performance) / 
                max(1, len(digest.model_performance))
            )
            
            digest.summary = {
                "overall_health_status": digest.system_health.overall_status,
                "system_health_score": digest.system_health.health_score,
                "total_models": len(digest.model_performance),
                "avg_model_accuracy": avg_model_accuracy,
                "total_predictions": total_predictions,
                "edge_success_rate": digest.edge_performance.edge_success_rate,
                "total_alerts": len(digest.critical_alerts) + len(digest.warning_alerts),
                "critical_alerts": len(digest.critical_alerts),
                "warning_alerts": len(digest.warning_alerts),
                "action_items": len(digest.action_items),
                "optimization_suggestions": len(digest.optimization_suggestions)
            }
            
        except Exception as e:
            self.logger.error(f"Error creating summary: {e}")
    
    async def _save_digest_artifacts(self, digest: IntegrityDigest):
        """Save digest artifacts to disk"""
        try:
            date_str = digest.report_date.strftime('%Y%m%d')
            date_path = self.artifact_base_path / date_str
            date_path.mkdir(parents=True, exist_ok=True)
            
            # Save JSON digest
            json_path = date_path / f"integrity_digest_{date_str}.json"
            with open(json_path, 'w') as f:
                json.dump(asdict(digest), f, indent=2, default=str)
            
            # Save human-readable summary
            summary_path = date_path / f"integrity_summary_{date_str}.txt"
            with open(summary_path, 'w') as f:
                f.write(self._format_human_readable_summary(digest))
            
            # Save detailed metrics CSV (if needed)
            # This could include detailed time-series data
            
            self.logger.info(f"Saved digest artifacts to {date_path}")
            
        except Exception as e:
            self.logger.error(f"Error saving digest artifacts: {e}")
    
    def _format_human_readable_summary(self, digest: IntegrityDigest) -> str:
        """Format digest as human-readable summary"""
        lines = []
        lines.append(f"=== Integrity Digest - {digest.report_date.strftime('%Y-%m-%d')} ===")
        lines.append(f"Generated: {digest.generation_timestamp.isoformat()}")
        lines.append("")
        
        # System Health
        lines.append("SYSTEM HEALTH:")
        lines.append(f"  Overall Status: {digest.system_health.overall_status}")
        lines.append(f"  Health Score: {digest.system_health.health_score:.3f}")
        lines.append(f"  Avg Response Time: {digest.system_health.avg_response_time_ms:.1f}ms")
        lines.append(f"  Error Rate: {digest.system_health.error_rate:.4f}")
        lines.append("")
        
        # Model Performance
        lines.append("MODEL PERFORMANCE:")
        for model in digest.model_performance:
            lines.append(f"  {model.model_name} ({model.model_version}):")
            lines.append(f"    Accuracy: {model.accuracy_score:.3f}")
            lines.append(f"    Predictions: {model.prediction_count:,}")
        lines.append("")
        
        # Edge Performance
        lines.append("EDGE PERFORMANCE:")
        lines.append(f"  Edges Detected: {digest.edge_performance.edges_detected}")
        lines.append(f"  Success Rate: {digest.edge_performance.edge_success_rate:.3f}")
        lines.append(f"  ROI: {digest.edge_performance.roi_percent:.1%}")
        lines.append("")
        
        # Alerts
        if digest.critical_alerts or digest.warning_alerts:
            lines.append("ALERTS:")
            for alert in digest.critical_alerts:
                lines.append(f"  CRITICAL: {alert['message']}")
            for alert in digest.warning_alerts:
                lines.append(f"  WARNING: {alert['message']}")
            lines.append("")
        
        # Action Items
        if digest.action_items:
            lines.append("ACTION ITEMS:")
            for item in digest.action_items:
                lines.append(f"  • {item}")
            lines.append("")
        
        return "\n".join(lines)
    
    async def prune_old_artifacts(self) -> Dict[str, Any]:
        """Remove old digest artifacts based on retention policy"""
        try:
            cutoff_date = datetime.now(timezone.utc) - timedelta(days=self.retention_days)
            
            pruned_count = 0
            pruned_size_bytes = 0
            
            if not self.artifact_base_path.exists():
                return {"pruned_count": 0, "pruned_size_bytes": 0}
            
            for item in self.artifact_base_path.iterdir():
                if item.is_dir():
                    try:
                        # Parse directory name as date
                        dir_date = datetime.strptime(item.name, '%Y%m%d').replace(tzinfo=timezone.utc)
                        
                        if dir_date < cutoff_date:
                            # Calculate size before deletion
                            size = sum(f.stat().st_size for f in item.rglob('*') if f.is_file())
                            pruned_size_bytes += size
                            
                            # Remove directory
                            shutil.rmtree(item)
                            pruned_count += 1
                            
                            self.logger.info(f"Pruned old digest artifacts: {item.name}")
                            
                    except ValueError:
                        # Skip directories that don't match date format
                        continue
            
            result = {
                "pruned_count": pruned_count,
                "pruned_size_bytes": pruned_size_bytes,
                "retention_days": self.retention_days,
                "cutoff_date": cutoff_date.isoformat()
            }
            
            if pruned_count > 0:
                self.logger.info(
                    f"Pruned {pruned_count} old digest directories, "
                    f"freed {pruned_size_bytes / (1024*1024):.1f} MB"
                )
            
            return result
            
        except Exception as e:
            self.logger.error(f"Error pruning old artifacts: {e}")
            return {"error": str(e)}
    
    async def get_digest_history(
        self, 
        days: int = 30,
        metrics_only: bool = False
    ) -> List[IntegrityDigest]:
        """Get historical digest data"""
        try:
            digests = []
            
            for i in range(days):
                target_date = datetime.now(timezone.utc).date() - timedelta(days=i)
                date_str = target_date.strftime('%Y%m%d')
                json_path = self.artifact_base_path / date_str / f"integrity_digest_{date_str}.json"
                
                if json_path.exists():
                    with open(json_path, 'r') as f:
                        digest_data = json.load(f)
                        
                    # Convert back to IntegrityDigest (simplified)
                    if metrics_only:
                        # Return only key metrics for trend analysis
                        simplified_digest = {
                            "report_date": digest_data["report_date"],
                            "system_health": digest_data["system_health"],
                            "edge_performance": digest_data["edge_performance"],
                            "summary": digest_data["summary"]
                        }
                        digests.append(simplified_digest)
                    else:
                        digests.append(digest_data)
            
            return digests
            
        except Exception as e:
            self.logger.error(f"Error getting digest history: {e}")
            return []


# Global integrity digest generator instance
integrity_digest_generator = IntegrityDigestGenerator()