#!/usr/bin/env python3
"""
Daily Integrity Delta Report Generator

This script generates comprehensive daily integrity delta reports by comparing
current system state against previous digests and identifying anomalies,
drifts, and performance changes.

Prereqs:
- integrity_deltas/ directory for storing reports
- System digest files (JSON format) with system state snapshots
- Configuration for thresholds and alerting

Usage:
  python scripts/integrity/daily_delta_report.py --digest-dir /path/to/digests
  python scripts/integrity/daily_delta_report.py --config delta_config.yaml --output-dir reports/
  python scripts/integrity/daily_delta_report.py --baseline baseline_digest.json --current current_digest.json
"""

import argparse
import json
import yaml
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple, Union
from dataclasses import dataclass, asdict
import logging
import statistics
import hashlib


@dataclass
class DeltaMetric:
    """Represents a delta measurement between two values."""
    metric_name: str
    previous_value: Optional[Union[float, int, str]]
    current_value: Optional[Union[float, int, str]]
    delta: Optional[Union[float, int]]
    delta_percentage: Optional[float]
    threshold_violated: bool
    severity: str  # 'low', 'medium', 'high', 'critical'
    description: str


@dataclass
class IntegrityDelta:
    """Represents a complete integrity delta between two system states."""
    report_id: str
    timestamp: str
    baseline_timestamp: str
    current_timestamp: str
    baseline_digest_hash: str
    current_digest_hash: str
    
    # Summary statistics
    total_metrics_compared: int
    metrics_changed: int
    metrics_improved: int
    metrics_degraded: int
    critical_issues: int
    high_priority_issues: int
    
    # Detailed deltas
    metric_deltas: List[DeltaMetric]
    new_metrics: List[str]
    missing_metrics: List[str]
    
    # Analysis results
    anomaly_score: float
    stability_score: float
    performance_trend: str  # 'improving', 'degrading', 'stable'
    
    # Recommendations
    recommended_actions: List[str]
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return asdict(self)


class DailyDeltaReporter:
    """Generates daily integrity delta reports."""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.logger = self._setup_logging()
        
        # Thresholds for different metric types
        self.thresholds = self.config.get('thresholds', {
            'confidence': {'warning': 0.05, 'critical': 0.15},
            'accuracy': {'warning': 0.02, 'critical': 0.08},
            'volume': {'warning': 0.20, 'critical': 0.50},
            'latency': {'warning': 0.10, 'critical': 0.30},
            'error_rate': {'warning': 0.05, 'critical': 0.15},
            'memory_usage': {'warning': 0.15, 'critical': 0.40},
            'cpu_usage': {'warning': 0.20, 'critical': 0.50}
        })
        
        # Metric categories for analysis
        self.metric_categories = {
            'performance': ['accuracy', 'precision', 'recall', 'f1_score'],
            'reliability': ['uptime', 'error_rate', 'timeout_rate'],
            'efficiency': ['latency_p95', 'latency_mean', 'throughput'],
            'resource': ['cpu_usage', 'memory_usage', 'disk_usage'],
            'business': ['total_edges', 'profitable_edges', 'total_ev']
        }
        
        # Output directory
        self.output_dir = Path(self.config.get('output_dir', 'integrity_deltas'))
        self.output_dir.mkdir(parents=True, exist_ok=True)
    
    def _setup_logging(self) -> logging.Logger:
        """Set up logging for the reporter."""
        logger = logging.getLogger('daily_delta_reporter')
        logger.setLevel(logging.INFO)
        
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)
        
        return logger
    
    def load_digest(self, file_path: str) -> Dict[str, Any]:
        """Load a system digest from file."""
        try:
            with open(file_path, 'r') as f:
                digest = json.load(f)
            
            # Add metadata if not present
            if 'digest_metadata' not in digest:
                digest['digest_metadata'] = {
                    'file_path': file_path,
                    'file_size': os.path.getsize(file_path),
                    'load_timestamp': datetime.now().isoformat()
                }
            
            return digest
        
        except Exception as e:
            self.logger.error(f"Failed to load digest from {file_path}: {e}")
            raise
    
    def find_latest_digests(self, digest_dir: str, days_back: int = 1) -> Tuple[str, str]:
        """Find the latest and previous digest files."""
        digest_path = Path(digest_dir)
        
        if not digest_path.exists():
            raise ValueError(f"Digest directory not found: {digest_dir}")
        
        # Find all digest files (assuming they have timestamps in filename)
        digest_files = list(digest_path.glob("*.json"))
        if not digest_files:
            raise ValueError(f"No digest files found in {digest_dir}")
        
        # Sort by modification time (most recent first)
        digest_files.sort(key=lambda f: f.stat().st_mtime, reverse=True)
        
        if len(digest_files) < 2:
            raise ValueError("Need at least 2 digest files for comparison")
        
        current_digest = str(digest_files[0])
        previous_digest = str(digest_files[1])
        
        self.logger.info(f"Using current digest: {current_digest}")
        self.logger.info(f"Using previous digest: {previous_digest}")
        
        return previous_digest, current_digest
    
    def generate_delta_report(
        self,
        baseline_digest_path: str,
        current_digest_path: str,
        output_file: Optional[str] = None
    ) -> IntegrityDelta:
        """Generate a comprehensive delta report."""
        
        # Load digests
        baseline_digest = self.load_digest(baseline_digest_path)
        current_digest = self.load_digest(current_digest_path)
        
        # Calculate digest hashes
        baseline_hash = hashlib.sha256(
            json.dumps(baseline_digest, sort_keys=True).encode()
        ).hexdigest()[:16]
        
        current_hash = hashlib.sha256(
            json.dumps(current_digest, sort_keys=True).encode()
        ).hexdigest()[:16]
        
        # Extract timestamps
        baseline_timestamp = self._extract_timestamp(baseline_digest, baseline_digest_path)
        current_timestamp = self._extract_timestamp(current_digest, current_digest_path)
        
        # Generate report ID
        report_id = f"delta_{current_timestamp.replace(':', '').replace('-', '')}_{current_hash}"
        
        self.logger.info(f"Generating delta report: {report_id}")
        
        # Compare metrics
        metric_deltas = self._compare_metrics(baseline_digest, current_digest)
        
        # Identify new and missing metrics
        new_metrics, missing_metrics = self._identify_metric_changes(baseline_digest, current_digest)
        
        # Calculate summary statistics
        summary_stats = self._calculate_summary_stats(metric_deltas)
        
        # Calculate analysis scores
        anomaly_score = self._calculate_anomaly_score(metric_deltas)
        stability_score = self._calculate_stability_score(metric_deltas)
        performance_trend = self._determine_performance_trend(metric_deltas)
        
        # Generate recommendations
        recommendations = self._generate_recommendations(metric_deltas, anomaly_score, stability_score)
        
        # Create delta report
        delta_report = IntegrityDelta(
            report_id=report_id,
            timestamp=datetime.now().isoformat(),
            baseline_timestamp=baseline_timestamp,
            current_timestamp=current_timestamp,
            baseline_digest_hash=baseline_hash,
            current_digest_hash=current_hash,
            total_metrics_compared=summary_stats['total_compared'],
            metrics_changed=summary_stats['changed'],
            metrics_improved=summary_stats['improved'],
            metrics_degraded=summary_stats['degraded'],
            critical_issues=summary_stats['critical'],
            high_priority_issues=summary_stats['high'],
            metric_deltas=metric_deltas,
            new_metrics=new_metrics,
            missing_metrics=missing_metrics,
            anomaly_score=anomaly_score,
            stability_score=stability_score,
            performance_trend=performance_trend,
            recommended_actions=recommendations
        )
        
        # Save report
        if output_file:
            self._save_report(delta_report, output_file)
        else:
            output_file = self.output_dir / f"{report_id}.json"
            self._save_report(delta_report, str(output_file))
        
        self.logger.info(f"Delta report generated: {output_file}")
        return delta_report
    
    def _extract_timestamp(self, digest: Dict[str, Any], file_path: str) -> str:
        """Extract timestamp from digest or file."""
        # Try various timestamp fields
        timestamp_fields = [
            'timestamp', 'generated_at', 'created_at', 'digest_timestamp'
        ]
        
        for field in timestamp_fields:
            if field in digest:
                return str(digest[field])
        
        # Fall back to file modification time
        mtime = os.path.getmtime(file_path)
        return datetime.fromtimestamp(mtime).isoformat()
    
    def _compare_metrics(
        self,
        baseline: Dict[str, Any],
        current: Dict[str, Any]
    ) -> List[DeltaMetric]:
        """Compare metrics between baseline and current digests."""
        
        deltas = []
        
        # Flatten both digests for comparison
        baseline_flat = self._flatten_dict(baseline)
        current_flat = self._flatten_dict(current)
        
        # Compare all metrics that exist in baseline
        for metric_path, baseline_value in baseline_flat.items():
            current_value = current_flat.get(metric_path)
            
            # Skip non-numeric values that can't be meaningfully compared
            if not self._is_numeric(baseline_value) or not self._is_numeric(current_value):
                continue
            
            delta_metric = self._calculate_metric_delta(
                metric_path, baseline_value, current_value
            )
            
            if delta_metric:
                deltas.append(delta_metric)
        
        return deltas
    
    def _flatten_dict(self, d: Dict[str, Any], parent_key: str = '', sep: str = '.') -> Dict[str, Any]:
        """Flatten nested dictionary for easier comparison."""
        items = []
        
        for k, v in d.items():
            new_key = f"{parent_key}{sep}{k}" if parent_key else k
            
            if isinstance(v, dict):
                items.extend(self._flatten_dict(v, new_key, sep=sep).items())
            else:
                items.append((new_key, v))
        
        return dict(items)
    
    def _is_numeric(self, value: Any) -> bool:
        """Check if a value is numeric."""
        return isinstance(value, (int, float)) and not isinstance(value, bool)
    
    def _calculate_metric_delta(
        self,
        metric_name: str,
        baseline_value: Union[float, int],
        current_value: Optional[Union[float, int]]
    ) -> Optional[DeltaMetric]:
        """Calculate delta for a specific metric."""
        
        if current_value is None:
            return DeltaMetric(
                metric_name=metric_name,
                previous_value=baseline_value,
                current_value=None,
                delta=None,
                delta_percentage=None,
                threshold_violated=True,
                severity='high',
                description=f"Metric {metric_name} is missing in current state"
            )
        
        # Calculate absolute and percentage delta
        delta = current_value - baseline_value
        delta_percentage = (delta / baseline_value * 100) if baseline_value != 0 else 0
        
        # Determine severity based on thresholds
        severity, threshold_violated = self._assess_delta_severity(
            metric_name, abs(delta_percentage)
        )
        
        # Generate description
        direction = "increased" if delta > 0 else "decreased" if delta < 0 else "unchanged"
        description = f"{metric_name} {direction} by {abs(delta):.4f} ({delta_percentage:+.2f}%)"
        
        return DeltaMetric(
            metric_name=metric_name,
            previous_value=baseline_value,
            current_value=current_value,
            delta=delta,
            delta_percentage=delta_percentage,
            threshold_violated=threshold_violated,
            severity=severity,
            description=description
        )
    
    def _assess_delta_severity(self, metric_name: str, delta_percentage: float) -> Tuple[str, bool]:
        """Assess the severity of a metric delta."""
        
        # Determine metric category for threshold lookup
        metric_category = self._get_metric_category(metric_name)
        
        # Get thresholds for this metric category
        thresholds = self.thresholds.get(metric_category, {
            'warning': 0.10, 'critical': 0.25
        })
        
        if delta_percentage >= thresholds.get('critical', 0.25):
            return 'critical', True
        elif delta_percentage >= thresholds.get('warning', 0.10):
            return 'high', True
        elif delta_percentage >= 0.05:
            return 'medium', False
        else:
            return 'low', False
    
    def _get_metric_category(self, metric_name: str) -> str:
        """Determine the category of a metric."""
        metric_lower = metric_name.lower()
        
        for category, keywords in self.metric_categories.items():
            for keyword in keywords:
                if keyword in metric_lower:
                    return category
        
        # Check for common patterns
        if any(word in metric_lower for word in ['confidence', 'probability']):
            return 'confidence'
        elif any(word in metric_lower for word in ['accuracy', 'precision', 'recall']):
            return 'accuracy'
        elif any(word in metric_lower for word in ['volume', 'count', 'total']):
            return 'volume'
        elif any(word in metric_lower for word in ['latency', 'time', 'duration']):
            return 'latency'
        elif any(word in metric_lower for word in ['error', 'failure', 'exception']):
            return 'error_rate'
        else:
            return 'general'
    
    def _identify_metric_changes(
        self,
        baseline: Dict[str, Any],
        current: Dict[str, Any]
    ) -> Tuple[List[str], List[str]]:
        """Identify new and missing metrics."""
        
        baseline_flat = self._flatten_dict(baseline)
        current_flat = self._flatten_dict(current)
        
        baseline_keys = set(baseline_flat.keys())
        current_keys = set(current_flat.keys())
        
        new_metrics = list(current_keys - baseline_keys)
        missing_metrics = list(baseline_keys - current_keys)
        
        return new_metrics, missing_metrics
    
    def _calculate_summary_stats(self, metric_deltas: List[DeltaMetric]) -> Dict[str, int]:
        """Calculate summary statistics for metric deltas."""
        
        stats = {
            'total_compared': len(metric_deltas),
            'changed': 0,
            'improved': 0,
            'degraded': 0,
            'critical': 0,
            'high': 0,
            'medium': 0,
            'low': 0
        }
        
        for delta in metric_deltas:
            if delta.delta != 0:
                stats['changed'] += 1
                
                # Determine if change is improvement or degradation
                # This is heuristic and could be enhanced with metric-specific logic
                if self._is_improvement(delta):
                    stats['improved'] += 1
                else:
                    stats['degraded'] += 1
            
            # Count by severity
            stats[delta.severity] += 1
        
        return stats
    
    def _is_improvement(self, delta: DeltaMetric) -> bool:
        """Determine if a delta represents an improvement."""
        
        metric_lower = delta.metric_name.lower()
        
        # Metrics where higher is better
        positive_metrics = [
            'accuracy', 'precision', 'recall', 'f1_score', 'uptime',
            'throughput', 'confidence', 'profitability', 'success_rate'
        ]
        
        # Metrics where lower is better
        negative_metrics = [
            'error_rate', 'latency', 'timeout_rate', 'memory_usage',
            'cpu_usage', 'response_time', 'failure_rate'
        ]
        
        delta_value = delta.delta or 0
        
        for metric in positive_metrics:
            if metric in metric_lower:
                return delta_value > 0
        
        for metric in negative_metrics:
            if metric in metric_lower:
                return delta_value < 0
        
        # Default assumption: higher is better
        return delta_value > 0
    
    def _calculate_anomaly_score(self, metric_deltas: List[DeltaMetric]) -> float:
        """Calculate an overall anomaly score."""
        
        if not metric_deltas:
            return 0.0
        
        severity_weights = {
            'critical': 10.0,
            'high': 5.0,
            'medium': 2.0,
            'low': 1.0
        }
        
        weighted_score = sum(
            severity_weights.get(delta.severity, 1.0)
            for delta in metric_deltas
        )
        
        # Normalize by total metrics
        max_possible_score = len(metric_deltas) * severity_weights['critical']
        anomaly_score = weighted_score / max_possible_score
        
        return min(1.0, anomaly_score)  # Cap at 1.0
    
    def _calculate_stability_score(self, metric_deltas: List[DeltaMetric]) -> float:
        """Calculate system stability score."""
        
        if not metric_deltas:
            return 1.0
        
        # Count metrics with significant changes
        significant_changes = sum(
            1 for delta in metric_deltas
            if delta.threshold_violated or delta.severity in ['high', 'critical']
        )
        
        # Stability decreases with more significant changes
        stability_score = 1.0 - (significant_changes / len(metric_deltas))
        
        return max(0.0, stability_score)
    
    def _determine_performance_trend(self, metric_deltas: List[DeltaMetric]) -> str:
        """Determine overall performance trend."""
        
        if not metric_deltas:
            return 'stable'
        
        improvements = sum(1 for delta in metric_deltas if self._is_improvement(delta))
        degradations = len(metric_deltas) - improvements
        
        improvement_ratio = improvements / len(metric_deltas)
        
        if improvement_ratio > 0.6:
            return 'improving'
        elif improvement_ratio < 0.4:
            return 'degrading'
        else:
            return 'stable'
    
    def _generate_recommendations(
        self,
        metric_deltas: List[DeltaMetric],
        anomaly_score: float,
        stability_score: float
    ) -> List[str]:
        """Generate actionable recommendations."""
        
        recommendations = []
        
        # Analyze critical issues
        critical_deltas = [d for d in metric_deltas if d.severity == 'critical']
        if critical_deltas:
            recommendations.append(
                f"CRITICAL: Investigate {len(critical_deltas)} critical metric changes immediately"
            )
            
            for delta in critical_deltas[:3]:  # Show top 3
                recommendations.append(f"  - {delta.description}")
        
        # High anomaly score
        if anomaly_score > 0.7:
            recommendations.append(
                "HIGH ANOMALY: System showing significant deviations - consider rollback or investigation"
            )
        
        # Low stability
        if stability_score < 0.5:
            recommendations.append(
                "STABILITY CONCERN: Multiple metrics showing threshold violations - review recent changes"
            )
        
        # Performance degradation
        degraded_metrics = [d for d in metric_deltas if not self._is_improvement(d) and d.threshold_violated]
        if len(degraded_metrics) > 3:
            recommendations.append(
                f"PERFORMANCE DEGRADATION: {len(degraded_metrics)} metrics degraded significantly"
            )
        
        # Missing metrics
        missing_count = len([d for d in metric_deltas if d.current_value is None])
        if missing_count > 0:
            recommendations.append(
                f"DATA INTEGRITY: {missing_count} metrics missing from current state"
            )
        
        # Default recommendation if no specific issues
        if not recommendations:
            if anomaly_score < 0.2 and stability_score > 0.8:
                recommendations.append("System appears stable - no immediate action required")
            else:
                recommendations.append("Monitor system for trends and investigate moderate changes")
        
        return recommendations
    
    def _save_report(self, report: IntegrityDelta, output_file: str) -> None:
        """Save delta report to file."""
        
        output_path = Path(output_file)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_path, 'w') as f:
            json.dump(report.to_dict(), f, indent=2, default=str)
        
        # Also save a human-readable summary
        summary_file = output_path.with_suffix('.summary.txt')
        self._save_human_readable_summary(report, summary_file)
    
    def _save_human_readable_summary(self, report: IntegrityDelta, output_file: Path) -> None:
        """Save human-readable summary."""
        
        with open(output_file, 'w') as f:
            f.write(f"=== Daily Integrity Delta Report ===\n")
            f.write(f"Report ID: {report.report_id}\n")
            f.write(f"Generated: {report.timestamp}\n")
            f.write(f"Baseline: {report.baseline_timestamp}\n")
            f.write(f"Current: {report.current_timestamp}\n\n")
            
            f.write(f"=== Summary Statistics ===\n")
            f.write(f"Total metrics compared: {report.total_metrics_compared}\n")
            f.write(f"Metrics changed: {report.metrics_changed}\n")
            f.write(f"Metrics improved: {report.metrics_improved}\n")
            f.write(f"Metrics degraded: {report.metrics_degraded}\n")
            f.write(f"Critical issues: {report.critical_issues}\n")
            f.write(f"High priority issues: {report.high_priority_issues}\n\n")
            
            f.write(f"=== Analysis Scores ===\n")
            f.write(f"Anomaly score: {report.anomaly_score:.3f}\n")
            f.write(f"Stability score: {report.stability_score:.3f}\n")
            f.write(f"Performance trend: {report.performance_trend}\n\n")
            
            if report.recommended_actions:
                f.write(f"=== Recommended Actions ===\n")
                for i, action in enumerate(report.recommended_actions, 1):
                    f.write(f"{i}. {action}\n")
                f.write("\n")
            
            if report.new_metrics:
                f.write(f"=== New Metrics ({len(report.new_metrics)}) ===\n")
                for metric in report.new_metrics[:10]:  # Show first 10
                    f.write(f"  + {metric}\n")
                if len(report.new_metrics) > 10:
                    f.write(f"  ... and {len(report.new_metrics) - 10} more\n")
                f.write("\n")
            
            if report.missing_metrics:
                f.write(f"=== Missing Metrics ({len(report.missing_metrics)}) ===\n")
                for metric in report.missing_metrics[:10]:  # Show first 10
                    f.write(f"  - {metric}\n")
                if len(report.missing_metrics) > 10:
                    f.write(f"  ... and {len(report.missing_metrics) - 10} more\n")
                f.write("\n")
            
            # Show top deltas by severity
            critical_deltas = [d for d in report.metric_deltas if d.severity == 'critical']
            high_deltas = [d for d in report.metric_deltas if d.severity == 'high']
            
            if critical_deltas:
                f.write(f"=== Critical Changes ===\n")
                for delta in critical_deltas:
                    f.write(f"  {delta.description}\n")
                f.write("\n")
            
            if high_deltas:
                f.write(f"=== High Priority Changes ===\n")
                for delta in high_deltas[:5]:  # Show top 5
                    f.write(f"  {delta.description}\n")
                if len(high_deltas) > 5:
                    f.write(f"  ... and {len(high_deltas) - 5} more high priority changes\n")


def extract(data: Dict[str, Any], path: List[str]) -> Any:
    """Extract nested value from dictionary using path list."""
    current = data
    for key in path:
        if isinstance(current, dict) and key in current:
            current = current[key]
        else:
            return None
    return current


def main():
    parser = argparse.ArgumentParser(description='Daily Integrity Delta Report Generator')
    parser.add_argument('--digest-dir', type=str, help='Directory containing digest files')
    parser.add_argument('--baseline', type=str, help='Path to baseline digest file')
    parser.add_argument('--current', type=str, help='Path to current digest file')
    parser.add_argument('--config', type=str, help='Configuration file (YAML)')
    parser.add_argument('--output-dir', type=str, default='integrity_deltas/',
                       help='Output directory for reports')
    parser.add_argument('--output-file', type=str, help='Specific output file path')
    parser.add_argument('--days-back', type=int, default=1,
                       help='Days back to look for baseline digest')
    
    args = parser.parse_args()
    
    # Load configuration
    config = {}
    if args.config:
        with open(args.config, 'r') as f:
            config = yaml.safe_load(f)
    
    # Set output directory in config
    if args.output_dir:
        config['output_dir'] = args.output_dir
    
    # Initialize reporter
    reporter = DailyDeltaReporter(config)
    
    # Determine digest files to compare
    if args.baseline and args.current:
        baseline_file = args.baseline
        current_file = args.current
    elif args.digest_dir:
        baseline_file, current_file = reporter.find_latest_digests(
            args.digest_dir, args.days_back
        )
    else:
        print("Error: Must provide either --digest-dir or both --baseline and --current")
        sys.exit(1)
    
    # Generate report
    try:
        report = reporter.generate_delta_report(
            baseline_file, current_file, args.output_file
        )
        
        # Print summary
        print(f"\n=== Delta Report Summary ===")
        print(f"Report ID: {report.report_id}")
        print(f"Metrics compared: {report.total_metrics_compared}")
        print(f"Metrics changed: {report.metrics_changed}")
        print(f"Critical issues: {report.critical_issues}")
        print(f"High priority issues: {report.high_priority_issues}")
        print(f"Anomaly score: {report.anomaly_score:.3f}")
        print(f"Stability score: {report.stability_score:.3f}")
        print(f"Performance trend: {report.performance_trend}")
        
        if report.recommended_actions:
            print(f"\nRecommended Actions:")
            for i, action in enumerate(report.recommended_actions, 1):
                print(f"  {i}. {action}")
        
        print(f"\nDetailed report saved to: {reporter.output_dir}")
        
    except Exception as e:
        print(f"Error generating delta report: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()