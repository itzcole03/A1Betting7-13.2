#!/usr/bin/env python3
"""
Synthetic Model Promotion Evaluation Harness

This script provides a comprehensive framework for evaluating model promotion
decisions using synthetic data and controlled experiments. It helps validate
model performance before production deployment.

Usage:
  python scripts/models/eval_promotion_harness.py --candidate v2 --active v1 --samples samples.json
  python scripts/models/eval_promotion_harness.py --config eval_config.yaml --output results/
  python scripts/models/eval_promotion_harness.py --synthetic --model-count 3 --sample-size 10000
"""

import argparse
import json
import yaml
import random
import statistics
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any, Tuple, Optional, Callable
from dataclasses import dataclass, asdict
from enum import Enum
import logging
import sys
import numpy as np
from collections import defaultdict


class EvaluationMetric(Enum):
    """Types of evaluation metrics."""
    ACCURACY = "accuracy"
    PRECISION = "precision"
    RECALL = "recall"
    F1_SCORE = "f1_score"
    AUC_ROC = "auc_roc"
    LOG_LOSS = "log_loss"
    CALIBRATION_ERROR = "calibration_error"
    CONFIDENCE_RELIABILITY = "confidence_reliability"
    EXPECTED_VALUE_ACCURACY = "expected_value_accuracy"


class PromotionDecision(Enum):
    """Possible promotion decisions."""
    PROMOTE = "promote"
    REJECT = "reject"
    INCONCLUSIVE = "inconclusive"
    FURTHER_TESTING = "further_testing"


@dataclass
class ModelSample:
    """Represents a model prediction sample."""
    sample_id: str
    model_version: str
    prop_id: int
    sport: str
    prop_type: str
    features: Dict[str, float]
    predicted_prob: float
    confidence_score: float
    actual_outcome: Optional[bool] = None
    expected_value: Optional[float] = None
    context: Optional[Dict[str, Any]] = None


@dataclass
class ModelMetrics:
    """Model performance metrics."""
    model_version: str
    sample_count: int
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    auc_roc: float
    log_loss: float
    calibration_error: float
    confidence_reliability: float
    expected_value_accuracy: float
    confidence_distribution: Dict[str, float]
    performance_by_sport: Dict[str, float]
    performance_by_prop_type: Dict[str, float]


@dataclass
class ComparisonResult:
    """Result of comparing two models."""
    candidate_version: str
    baseline_version: str
    metric_differences: Dict[str, float]
    statistical_significance: Dict[str, float]
    promotion_recommendation: PromotionDecision
    confidence_level: float
    risk_assessment: str
    detailed_analysis: Dict[str, Any]


@dataclass
class EvaluationReport:
    """Comprehensive evaluation report."""
    evaluation_id: str
    timestamp: str
    candidate_metrics: ModelMetrics
    baseline_metrics: ModelMetrics
    comparison_result: ComparisonResult
    promotion_decision: PromotionDecision
    decision_confidence: float
    risk_factors: List[str]
    recommendations: List[str]
    metadata: Dict[str, Any]


class SyntheticDataGenerator:
    """Generates synthetic model prediction data for testing."""
    
    def __init__(self, random_seed: Optional[int] = None):
        if random_seed:
            random.seed(random_seed)
            np.random.seed(random_seed)
        
        self.sports = ['MLB', 'NFL', 'NBA', 'NHL']
        self.prop_types = ['STRIKEOUTS_PITCHER', 'PASSING_YARDS', 'POINTS_PLAYER', 'GOALS_PLAYER']
        self.feature_names = [
            'player_form', 'opponent_strength', 'weather_factor', 'venue_advantage',
            'recent_performance', 'historical_average', 'injury_risk', 'motivation'
        ]
    
    def generate_model_samples(
        self,
        model_version: str,
        sample_count: int,
        base_accuracy: float = 0.55,
        confidence_bias: float = 0.0
    ) -> List[ModelSample]:
        """Generate synthetic samples for a model."""
        
        samples = []
        
        for i in range(sample_count):
            sport = random.choice(self.sports)
            prop_type = random.choice(self.prop_types)
            
            # Generate features
            features = {
                name: random.uniform(-2, 2) for name in self.feature_names
            }
            
            # Generate true outcome probability based on features
            feature_sum = sum(features.values())
            true_prob = 1 / (1 + np.exp(-feature_sum / 2))  # Sigmoid
            true_prob = max(0.05, min(0.95, true_prob))
            
            # Add model-specific bias/noise
            model_noise = random.uniform(-0.1, 0.1)
            predicted_prob = true_prob + model_noise
            predicted_prob = max(0.05, min(0.95, predicted_prob))
            
            # Generate confidence score (with potential bias)
            confidence_base = abs(predicted_prob - 0.5) * 2  # Distance from 0.5
            confidence_noise = random.uniform(-0.2, 0.2)
            confidence_score = confidence_base + confidence_noise + confidence_bias
            confidence_score = max(0.3, min(0.9, confidence_score))
            
            # Generate actual outcome
            actual_outcome = random.random() < true_prob
            
            # Calculate expected value (simplified)
            implied_odds = 1 / predicted_prob
            true_odds = 1 / true_prob
            expected_value = (true_odds - implied_odds) / implied_odds
            
            sample = ModelSample(
                sample_id=f"{model_version}_sample_{i}",
                model_version=model_version,
                prop_id=i,
                sport=sport,
                prop_type=prop_type,
                features=features,
                predicted_prob=predicted_prob,
                confidence_score=confidence_score,
                actual_outcome=actual_outcome,
                expected_value=expected_value,
                context={'synthetic': True}
            )
            
            samples.append(sample)
        
        return samples
    
    def generate_multiple_model_data(
        self,
        model_versions: List[str],
        sample_count: int,
        accuracy_differences: Optional[Dict[str, float]] = None
    ) -> Dict[str, List[ModelSample]]:
        """Generate data for multiple models with different characteristics."""
        
        accuracy_differences = accuracy_differences or {}
        model_data = {}
        
        for version in model_versions:
            base_accuracy = 0.55 + accuracy_differences.get(version, 0.0)
            confidence_bias = random.uniform(-0.1, 0.1)
            
            samples = self.generate_model_samples(
                version, sample_count, base_accuracy, confidence_bias
            )
            model_data[version] = samples
        
        return model_data


class ModelEvaluator:
    """Evaluates model performance using various metrics."""
    
    def __init__(self):
        self.metric_calculators = {
            EvaluationMetric.ACCURACY: self._calculate_accuracy,
            EvaluationMetric.PRECISION: self._calculate_precision,
            EvaluationMetric.RECALL: self._calculate_recall,
            EvaluationMetric.F1_SCORE: self._calculate_f1_score,
            EvaluationMetric.AUC_ROC: self._calculate_auc_roc,
            EvaluationMetric.LOG_LOSS: self._calculate_log_loss,
            EvaluationMetric.CALIBRATION_ERROR: self._calculate_calibration_error,
            EvaluationMetric.CONFIDENCE_RELIABILITY: self._calculate_confidence_reliability,
            EvaluationMetric.EXPECTED_VALUE_ACCURACY: self._calculate_ev_accuracy,
        }
    
    def evaluate_model(self, samples: List[ModelSample]) -> ModelMetrics:
        """Evaluate model performance on samples."""
        
        if not samples:
            raise ValueError("No samples provided for evaluation")
        
        # Filter samples with actual outcomes
        valid_samples = [s for s in samples if s.actual_outcome is not None]
        if not valid_samples:
            raise ValueError("No samples with actual outcomes")
        
        model_version = samples[0].model_version
        
        # Calculate core metrics
        metrics = {}
        for metric_type in EvaluationMetric:
            try:
                calculator = self.metric_calculators[metric_type]
                metrics[metric_type.value] = calculator(valid_samples)
            except Exception as e:
                print(f"Warning: Failed to calculate {metric_type.value}: {e}")
                metrics[metric_type.value] = 0.0
        
        # Calculate additional analyses
        confidence_dist = self._analyze_confidence_distribution(valid_samples)
        sport_performance = self._analyze_performance_by_sport(valid_samples)
        prop_performance = self._analyze_performance_by_prop_type(valid_samples)
        
        return ModelMetrics(
            model_version=model_version,
            sample_count=len(valid_samples),
            accuracy=metrics['accuracy'],
            precision=metrics['precision'],
            recall=metrics['recall'],
            f1_score=metrics['f1_score'],
            auc_roc=metrics['auc_roc'],
            log_loss=metrics['log_loss'],
            calibration_error=metrics['calibration_error'],
            confidence_reliability=metrics['confidence_reliability'],
            expected_value_accuracy=metrics['expected_value_accuracy'],
            confidence_distribution=confidence_dist,
            performance_by_sport=sport_performance,
            performance_by_prop_type=prop_performance
        )
    
    def _calculate_accuracy(self, samples: List[ModelSample]) -> float:
        """Calculate prediction accuracy."""
        predictions = [s.predicted_prob > 0.5 for s in samples]
        actuals = [s.actual_outcome for s in samples]
        
        correct = sum(1 for p, a in zip(predictions, actuals) if p == a)
        return correct / len(samples)
    
    def _calculate_precision(self, samples: List[ModelSample]) -> float:
        """Calculate precision."""
        predictions = [s.predicted_prob > 0.5 for s in samples]
        actuals = [s.actual_outcome for s in samples]
        
        true_positives = sum(1 for p, a in zip(predictions, actuals) if p and a)
        predicted_positives = sum(predictions)
        
        return true_positives / predicted_positives if predicted_positives > 0 else 0.0
    
    def _calculate_recall(self, samples: List[ModelSample]) -> float:
        """Calculate recall."""
        predictions = [s.predicted_prob > 0.5 for s in samples]
        actuals = [s.actual_outcome for s in samples]
        
        true_positives = sum(1 for p, a in zip(predictions, actuals) if p and a)
        actual_positives = sum(actuals)
        
        return true_positives / actual_positives if actual_positives > 0 else 0.0
    
    def _calculate_f1_score(self, samples: List[ModelSample]) -> float:
        """Calculate F1 score."""
        precision = self._calculate_precision(samples)
        recall = self._calculate_recall(samples)
        
        if precision + recall == 0:
            return 0.0
        
        return 2 * (precision * recall) / (precision + recall)
    
    def _calculate_auc_roc(self, samples: List[ModelSample]) -> float:
        """Calculate AUC-ROC (simplified implementation)."""
        # Sort by predicted probability
        sorted_samples = sorted(samples, key=lambda s: s.predicted_prob, reverse=True)
        
        positive_count = sum(1 for s in samples if s.actual_outcome)
        negative_count = len(samples) - positive_count
        
        if positive_count == 0 or negative_count == 0:
            return 0.5
        
        # Calculate AUC using trapezoidal rule
        tpr_prev, fpr_prev = 0, 0
        auc = 0
        
        true_positives = 0
        false_positives = 0
        
        for sample in sorted_samples:
            if sample.actual_outcome:
                true_positives += 1
            else:
                false_positives += 1
            
            tpr = true_positives / positive_count
            fpr = false_positives / negative_count
            
            # Trapezoidal area
            auc += (fpr - fpr_prev) * (tpr + tpr_prev) / 2
            
            tpr_prev, fpr_prev = tpr, fpr
        
        return auc
    
    def _calculate_log_loss(self, samples: List[ModelSample]) -> float:
        """Calculate log loss."""
        total_loss = 0
        epsilon = 1e-15  # Avoid log(0)
        
        for sample in samples:
            prob = max(epsilon, min(1 - epsilon, sample.predicted_prob))
            actual = 1 if sample.actual_outcome else 0
            
            loss = -(actual * np.log(prob) + (1 - actual) * np.log(1 - prob))
            total_loss += loss
        
        return total_loss / len(samples)
    
    def _calculate_calibration_error(self, samples: List[ModelSample]) -> float:
        """Calculate calibration error."""
        # Bin samples by predicted probability
        bins = [(i/10, (i+1)/10) for i in range(10)]
        calibration_error = 0
        
        for bin_start, bin_end in bins:
            bin_samples = [
                s for s in samples 
                if bin_start <= s.predicted_prob < bin_end
            ]
            
            if not bin_samples:
                continue
            
            avg_prob = statistics.mean(s.predicted_prob for s in bin_samples)
            actual_rate = sum(1 for s in bin_samples if s.actual_outcome) / len(bin_samples)
            
            calibration_error += abs(avg_prob - actual_rate) * len(bin_samples)
        
        return calibration_error / len(samples)
    
    def _calculate_confidence_reliability(self, samples: List[ModelSample]) -> float:
        """Calculate how well confidence correlates with accuracy."""
        # Group samples by confidence quartiles
        confidence_sorted = sorted(samples, key=lambda s: s.confidence_score)
        quartile_size = len(confidence_sorted) // 4
        
        quartile_accuracies = []
        for i in range(4):
            start_idx = i * quartile_size
            end_idx = (i + 1) * quartile_size if i < 3 else len(confidence_sorted)
            
            quartile_samples = confidence_sorted[start_idx:end_idx]
            accuracy = self._calculate_accuracy(quartile_samples)
            quartile_accuracies.append(accuracy)
        
        # Check if accuracy increases with confidence
        correlations = []
        for i in range(1, 4):
            if quartile_accuracies[i] > quartile_accuracies[i-1]:
                correlations.append(1)
            else:
                correlations.append(0)
        
        return sum(correlations) / len(correlations)
    
    def _calculate_ev_accuracy(self, samples: List[ModelSample]) -> float:
        """Calculate expected value prediction accuracy."""
        valid_ev_samples = [s for s in samples if s.expected_value is not None]
        
        if not valid_ev_samples:
            return 0.0
        
        # Simple EV accuracy: how often positive EV bets win
        positive_ev_samples = [s for s in valid_ev_samples if s.expected_value > 0]
        
        if not positive_ev_samples:
            return 0.5
        
        wins = sum(1 for s in positive_ev_samples if s.actual_outcome)
        return wins / len(positive_ev_samples)
    
    def _analyze_confidence_distribution(self, samples: List[ModelSample]) -> Dict[str, float]:
        """Analyze confidence score distribution."""
        confidences = [s.confidence_score for s in samples]
        
        return {
            'mean': statistics.mean(confidences),
            'median': statistics.median(confidences),
            'std': statistics.stdev(confidences) if len(confidences) > 1 else 0,
            'min': min(confidences),
            'max': max(confidences)
        }
    
    def _analyze_performance_by_sport(self, samples: List[ModelSample]) -> Dict[str, float]:
        """Analyze performance by sport."""
        sport_groups = defaultdict(list)
        for sample in samples:
            sport_groups[sample.sport].append(sample)
        
        performance = {}
        for sport, sport_samples in sport_groups.items():
            if len(sport_samples) >= 10:  # Minimum sample size
                performance[sport] = self._calculate_accuracy(sport_samples)
        
        return performance
    
    def _analyze_performance_by_prop_type(self, samples: List[ModelSample]) -> Dict[str, float]:
        """Analyze performance by prop type."""
        prop_groups = defaultdict(list)
        for sample in samples:
            prop_groups[sample.prop_type].append(sample)
        
        performance = {}
        for prop_type, prop_samples in prop_groups.items():
            if len(prop_samples) >= 10:  # Minimum sample size
                performance[prop_type] = self._calculate_accuracy(prop_samples)
        
        return performance


class ModelComparator:
    """Compares models and makes promotion decisions."""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        
        # Promotion thresholds
        self.promotion_thresholds = self.config.get('promotion_thresholds', {
            'minimum_improvement': 0.01,  # 1% minimum improvement
            'significance_level': 0.05,   # 5% significance level
            'minimum_samples': 1000,      # Minimum sample size
            'confidence_threshold': 0.8   # 80% confidence for promotion
        })
        
        # Risk factors
        self.risk_factors = self.config.get('risk_factors', {
            'calibration_degradation': 0.05,
            'confidence_reliability_drop': 0.1,
            'sport_performance_variance': 0.15
        })
    
    def compare_models(
        self,
        candidate_metrics: ModelMetrics,
        baseline_metrics: ModelMetrics
    ) -> ComparisonResult:
        """Compare candidate model against baseline."""
        
        # Calculate metric differences
        metric_differences = self._calculate_metric_differences(
            candidate_metrics, baseline_metrics
        )
        
        # Calculate statistical significance (simplified)
        statistical_significance = self._calculate_statistical_significance(
            candidate_metrics, baseline_metrics
        )
        
        # Assess risk factors
        risk_assessment, risk_factors = self._assess_risks(
            candidate_metrics, baseline_metrics, metric_differences
        )
        
        # Make promotion recommendation
        recommendation, confidence = self._make_promotion_decision(
            metric_differences, statistical_significance, risk_assessment
        )
        
        # Generate detailed analysis
        detailed_analysis = self._generate_detailed_analysis(
            candidate_metrics, baseline_metrics, metric_differences
        )
        
        return ComparisonResult(
            candidate_version=candidate_metrics.model_version,
            baseline_version=baseline_metrics.model_version,
            metric_differences=metric_differences,
            statistical_significance=statistical_significance,
            promotion_recommendation=recommendation,
            confidence_level=confidence,
            risk_assessment=risk_assessment,
            detailed_analysis=detailed_analysis
        )
    
    def _calculate_metric_differences(
        self,
        candidate: ModelMetrics,
        baseline: ModelMetrics
    ) -> Dict[str, float]:
        """Calculate differences in key metrics."""
        
        differences = {}
        
        # Core performance metrics
        differences['accuracy_diff'] = candidate.accuracy - baseline.accuracy
        differences['precision_diff'] = candidate.precision - baseline.precision
        differences['recall_diff'] = candidate.recall - baseline.recall
        differences['f1_score_diff'] = candidate.f1_score - baseline.f1_score
        differences['auc_roc_diff'] = candidate.auc_roc - baseline.auc_roc
        
        # Quality metrics
        differences['log_loss_diff'] = baseline.log_loss - candidate.log_loss  # Lower is better
        differences['calibration_error_diff'] = baseline.calibration_error - candidate.calibration_error  # Lower is better
        differences['confidence_reliability_diff'] = candidate.confidence_reliability - baseline.confidence_reliability
        differences['ev_accuracy_diff'] = candidate.expected_value_accuracy - baseline.expected_value_accuracy
        
        # Convert to percentage changes where appropriate
        for key in differences:
            if 'diff' in key:
                base_value = getattr(baseline, key.replace('_diff', ''))
                if base_value != 0:
                    pct_key = key.replace('_diff', '_pct_change')
                    differences[pct_key] = (differences[key] / base_value) * 100
        
        return differences
    
    def _calculate_statistical_significance(
        self,
        candidate: ModelMetrics,
        baseline: ModelMetrics
    ) -> Dict[str, float]:
        """Calculate statistical significance of differences (simplified)."""
        
        # This is a simplified implementation
        # In practice, you'd use proper statistical tests
        
        significance = {}
        
        # Sample size factor
        min_samples = min(candidate.sample_count, baseline.sample_count)
        sample_factor = min(1.0, min_samples / 1000)  # Assume 1000 samples for full confidence
        
        # Calculate significance for key metrics
        for metric in ['accuracy', 'precision', 'recall', 'f1_score']:
            candidate_value = getattr(candidate, metric)
            baseline_value = getattr(baseline, metric)
            
            # Simple significance calculation based on difference magnitude and sample size
            difference = abs(candidate_value - baseline_value)
            significance[f'{metric}_significance'] = min(0.99, difference * sample_factor * 10)
        
        return significance
    
    def _assess_risks(
        self,
        candidate: ModelMetrics,
        baseline: ModelMetrics,
        differences: Dict[str, float]
    ) -> Tuple[str, List[str]]:
        """Assess risks associated with promotion."""
        
        risk_factors = []
        risk_score = 0
        
        # Check for calibration degradation
        if differences.get('calibration_error_diff', 0) < -self.risk_factors['calibration_degradation']:
            risk_factors.append("Calibration error increased significantly")
            risk_score += 3
        
        # Check for confidence reliability drop
        if differences.get('confidence_reliability_diff', 0) < -self.risk_factors['confidence_reliability_drop']:
            risk_factors.append("Confidence reliability decreased")
            risk_score += 2
        
        # Check for inconsistent sport performance
        sport_performance_variance = self._calculate_sport_performance_variance(candidate, baseline)
        if sport_performance_variance > self.risk_factors['sport_performance_variance']:
            risk_factors.append("High variance in sport-specific performance")
            risk_score += 2
        
        # Check for insufficient sample size
        if candidate.sample_count < self.promotion_thresholds['minimum_samples']:
            risk_factors.append(f"Insufficient sample size: {candidate.sample_count}")
            risk_score += 2
        
        # Check for negative trends in key metrics
        key_metrics = ['accuracy_diff', 'f1_score_diff', 'auc_roc_diff']
        negative_trends = sum(1 for metric in key_metrics if differences.get(metric, 0) < 0)
        if negative_trends >= 2:
            risk_factors.append("Multiple key metrics showing negative trends")
            risk_score += 3
        
        # Determine overall risk level
        if risk_score >= 6:
            risk_assessment = "HIGH"
        elif risk_score >= 3:
            risk_assessment = "MEDIUM"
        else:
            risk_assessment = "LOW"
        
        return risk_assessment, risk_factors
    
    def _calculate_sport_performance_variance(
        self,
        candidate: ModelMetrics,
        baseline: ModelMetrics
    ) -> float:
        """Calculate variance in sport-specific performance."""
        
        candidate_sports = set(candidate.performance_by_sport.keys())
        baseline_sports = set(baseline.performance_by_sport.keys())
        common_sports = candidate_sports & baseline_sports
        
        if len(common_sports) < 2:
            return 0.0
        
        differences = []
        for sport in common_sports:
            diff = candidate.performance_by_sport[sport] - baseline.performance_by_sport[sport]
            differences.append(diff)
        
        return statistics.stdev(differences) if len(differences) > 1 else 0.0
    
    def _make_promotion_decision(
        self,
        differences: Dict[str, float],
        significance: Dict[str, float],
        risk_assessment: str
    ) -> Tuple[PromotionDecision, float]:
        """Make promotion decision based on analysis."""
        
        # Key improvement metrics
        accuracy_improvement = differences.get('accuracy_diff', 0)
        f1_improvement = differences.get('f1_score_diff', 0)
        
        # Check minimum improvement threshold
        min_improvement = self.promotion_thresholds['minimum_improvement']
        has_min_improvement = (
            accuracy_improvement >= min_improvement or
            f1_improvement >= min_improvement
        )
        
        # Check statistical significance
        accuracy_sig = significance.get('accuracy_significance', 0)
        f1_sig = significance.get('f1_score_significance', 0)
        is_significant = (
            accuracy_sig >= (1 - self.promotion_thresholds['significance_level']) or
            f1_sig >= (1 - self.promotion_thresholds['significance_level'])
        )
        
        # Decision logic
        if risk_assessment == "HIGH":
            return PromotionDecision.REJECT, 0.9
        
        if has_min_improvement and is_significant:
            if risk_assessment == "LOW":
                return PromotionDecision.PROMOTE, 0.85
            else:  # MEDIUM risk
                return PromotionDecision.PROMOTE, 0.7
        
        if has_min_improvement:
            return PromotionDecision.FURTHER_TESTING, 0.6
        
        # No improvement or degradation
        if accuracy_improvement < 0 or f1_improvement < 0:
            return PromotionDecision.REJECT, 0.8
        
        return PromotionDecision.INCONCLUSIVE, 0.5
    
    def _generate_detailed_analysis(
        self,
        candidate: ModelMetrics,
        baseline: ModelMetrics,
        differences: Dict[str, float]
    ) -> Dict[str, Any]:
        """Generate detailed analysis."""
        
        return {
            'sample_sizes': {
                'candidate': candidate.sample_count,
                'baseline': baseline.sample_count
            },
            'confidence_analysis': {
                'candidate_mean': candidate.confidence_distribution['mean'],
                'baseline_mean': baseline.confidence_distribution['mean'],
                'candidate_std': candidate.confidence_distribution['std'],
                'baseline_std': baseline.confidence_distribution['std']
            },
            'performance_consistency': {
                'sport_coverage': {
                    'candidate_sports': len(candidate.performance_by_sport),
                    'baseline_sports': len(baseline.performance_by_sport),
                    'common_sports': len(
                        set(candidate.performance_by_sport.keys()) &
                        set(baseline.performance_by_sport.keys())
                    )
                },
                'prop_type_coverage': {
                    'candidate_props': len(candidate.performance_by_prop_type),
                    'baseline_props': len(baseline.performance_by_prop_type),
                    'common_props': len(
                        set(candidate.performance_by_prop_type.keys()) &
                        set(baseline.performance_by_prop_type.keys())
                    )
                }
            },
            'key_improvements': {
                key: value for key, value in differences.items()
                if 'diff' in key and abs(value) > 0.01
            }
        }


class EvaluationHarness:
    """Main harness for model promotion evaluation."""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.logger = self._setup_logging()
        
        self.data_generator = SyntheticDataGenerator()
        self.evaluator = ModelEvaluator()
        self.comparator = ModelComparator(config)
    
    def _setup_logging(self) -> logging.Logger:
        """Set up logging."""
        logger = logging.getLogger('eval_promotion_harness')
        logger.setLevel(logging.INFO)
        
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)
        
        return logger
    
    def evaluate_promotion(
        self,
        candidate_samples: List[ModelSample],
        baseline_samples: List[ModelSample]
    ) -> EvaluationReport:
        """Evaluate promotion decision for candidate vs baseline."""
        
        self.logger.info(f"Evaluating promotion: {len(candidate_samples)} candidate vs {len(baseline_samples)} baseline samples")
        
        # Evaluate both models
        candidate_metrics = self.evaluator.evaluate_model(candidate_samples)
        baseline_metrics = self.evaluator.evaluate_model(baseline_samples)
        
        # Compare models
        comparison_result = self.comparator.compare_models(candidate_metrics, baseline_metrics)
        
        # Generate recommendations
        recommendations = self._generate_recommendations(comparison_result)
        
        # Create evaluation report
        evaluation_id = f"eval_{int(datetime.now().timestamp())}"
        
        report = EvaluationReport(
            evaluation_id=evaluation_id,
            timestamp=datetime.now().isoformat(),
            candidate_metrics=candidate_metrics,
            baseline_metrics=baseline_metrics,
            comparison_result=comparison_result,
            promotion_decision=comparison_result.promotion_recommendation,
            decision_confidence=comparison_result.confidence_level,
            risk_factors=self._extract_risk_factors(comparison_result),
            recommendations=recommendations,
            metadata={
                'candidate_sample_count': len(candidate_samples),
                'baseline_sample_count': len(baseline_samples),
                'evaluation_timestamp': datetime.now().isoformat()
            }
        )
        
        return report
    
    def _generate_recommendations(self, comparison: ComparisonResult) -> List[str]:
        """Generate actionable recommendations."""
        
        recommendations = []
        
        if comparison.promotion_recommendation == PromotionDecision.PROMOTE:
            recommendations.append(
                f"✅ RECOMMEND PROMOTION: {comparison.candidate_version} shows significant improvements"
            )
            
            # Highlight key improvements
            improvements = []
            for metric, diff in comparison.metric_differences.items():
                if 'diff' in metric and diff > 0.01:
                    metric_name = metric.replace('_diff', '')
                    improvements.append(f"{metric_name}: +{diff:.3f}")
            
            if improvements:
                recommendations.append(f"Key improvements: {', '.join(improvements[:3])}")
        
        elif comparison.promotion_recommendation == PromotionDecision.REJECT:
            recommendations.append(
                f"❌ DO NOT PROMOTE: {comparison.candidate_version} shows insufficient improvement or risks"
            )
            
            if comparison.risk_assessment == "HIGH":
                recommendations.append("High risk factors identified - investigate before retry")
        
        elif comparison.promotion_recommendation == PromotionDecision.FURTHER_TESTING:
            recommendations.append(
                f"⚠️ REQUIRES MORE TESTING: {comparison.candidate_version} shows promise but needs validation"
            )
            recommendations.append("Collect more samples and run extended evaluation")
        
        else:  # INCONCLUSIVE
            recommendations.append(
                f"❓ INCONCLUSIVE: {comparison.candidate_version} evaluation results are unclear"
            )
            recommendations.append("Consider A/B testing with small traffic allocation")
        
        # Add specific recommendations based on analysis
        if comparison.detailed_analysis:
            sample_sizes = comparison.detailed_analysis.get('sample_sizes', {})
            if sample_sizes.get('candidate', 0) < 1000:
                recommendations.append("Increase candidate model sample size for better statistical power")
        
        return recommendations
    
    def _extract_risk_factors(self, comparison: ComparisonResult) -> List[str]:
        """Extract risk factors from comparison."""
        
        risk_factors = []
        
        if comparison.risk_assessment in ["HIGH", "MEDIUM"]:
            risk_factors.append(f"{comparison.risk_assessment} risk assessment")
        
        # Add specific risk factors based on metric degradation
        concerning_metrics = []
        for metric, diff in comparison.metric_differences.items():
            if 'diff' in metric and diff < -0.02:  # 2% degradation threshold
                concerning_metrics.append(metric.replace('_diff', ''))
        
        if concerning_metrics:
            risk_factors.append(f"Degradation in: {', '.join(concerning_metrics)}")
        
        return risk_factors
    
    def run_synthetic_evaluation(
        self,
        candidate_version: str,
        baseline_version: str,
        sample_count: int = 5000
    ) -> EvaluationReport:
        """Run evaluation with synthetic data."""
        
        self.logger.info(f"Running synthetic evaluation: {candidate_version} vs {baseline_version}")
        
        # Generate synthetic data with slight performance difference
        model_data = self.data_generator.generate_multiple_model_data(
            [candidate_version, baseline_version],
            sample_count,
            accuracy_differences={
                candidate_version: 0.02,  # 2% better
                baseline_version: 0.0
            }
        )
        
        candidate_samples = model_data[candidate_version]
        baseline_samples = model_data[baseline_version]
        
        return self.evaluate_promotion(candidate_samples, baseline_samples)
    
    def save_report(self, report: EvaluationReport, output_file: str) -> None:
        """Save evaluation report to file."""
        
        output_path = Path(output_file)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_path, 'w') as f:
            json.dump(asdict(report), f, indent=2, default=str)
        
        self.logger.info(f"Evaluation report saved: {output_path}")


def evaluate(samples_data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Simplified evaluation function for testing."""
    
    # Group samples by model version
    model_samples = defaultdict(list)
    
    for sample_data in samples_data:
        model_version = sample_data.get('model_version', 'unknown')
        
        sample = ModelSample(
            sample_id=sample_data.get('sample_id', f"sample_{len(model_samples[model_version])}"),
            model_version=model_version,
            prop_id=sample_data.get('prop_id', 0),
            sport=sample_data.get('sport', 'MLB'),
            prop_type=sample_data.get('prop_type', 'STRIKEOUTS_PITCHER'),
            features=sample_data.get('features', {}),
            predicted_prob=float(sample_data.get('predicted_prob', 0.5)),
            confidence_score=float(sample_data.get('confidence_score', 0.5)),
            actual_outcome=sample_data.get('actual_outcome')
        )
        model_samples[model_version].append(sample)
    
    if len(model_samples) < 2:
        return {"error": "Need at least 2 model versions for comparison"}
    
    # Take first two models for comparison
    model_versions = list(model_samples.keys())
    candidate_samples = model_samples[model_versions[0]]
    baseline_samples = model_samples[model_versions[1]]
    
    # Run evaluation
    harness = EvaluationHarness()
    report = harness.evaluate_promotion(candidate_samples, baseline_samples)
    
    return {
        'promotion_decision': report.promotion_decision.value,
        'confidence': report.decision_confidence,
        'candidate_accuracy': report.candidate_metrics.accuracy,
        'baseline_accuracy': report.baseline_metrics.accuracy,
        'recommendations': report.recommendations
    }


def main():
    parser = argparse.ArgumentParser(description='Model Promotion Evaluation Harness')
    parser.add_argument('--candidate', type=str, help='Candidate model version')
    parser.add_argument('--baseline', type=str, help='Baseline model version')
    parser.add_argument('--samples', type=str, help='Sample data file (JSON)')
    parser.add_argument('--config', type=str, help='Configuration file (YAML)')
    parser.add_argument('--output', type=str, default='evaluation_report.json', help='Output file')
    parser.add_argument('--synthetic', action='store_true', help='Use synthetic data')
    parser.add_argument('--sample-size', type=int, default=5000, help='Synthetic sample size')
    
    args = parser.parse_args()
    
    # Load configuration
    config = {}
    if args.config:
        with open(args.config, 'r') as f:
            config = yaml.safe_load(f)
    
    # Initialize harness
    harness = EvaluationHarness(config)
    
    # Run evaluation
    if args.synthetic:
        candidate_version = args.candidate or 'v2'
        baseline_version = args.baseline or 'v1'
        
        report = harness.run_synthetic_evaluation(
            candidate_version, baseline_version, args.sample_size
        )
    
    elif args.samples:
        # Load sample data
        with open(args.samples, 'r') as f:
            samples_data = json.load(f)
        
        # Convert to ModelSample objects
        # This would need to be implemented based on your data format
        print("Real sample evaluation not implemented in this example")
        return
    
    else:
        print("Error: Must specify either --synthetic or --samples")
        sys.exit(1)
    
    # Save and display results
    harness.save_report(report, args.output)
    
    print(f"\n=== Model Promotion Evaluation Results ===")
    print(f"Candidate: {report.candidate_metrics.model_version}")
    print(f"Baseline: {report.baseline_metrics.model_version}")
    print(f"Decision: {report.promotion_decision.value.upper()}")
    print(f"Confidence: {report.decision_confidence:.2%}")
    
    print(f"\nPerformance Comparison:")
    print(f"  Candidate Accuracy: {report.candidate_metrics.accuracy:.3f}")
    print(f"  Baseline Accuracy: {report.baseline_metrics.accuracy:.3f}")
    print(f"  Accuracy Difference: {report.candidate_metrics.accuracy - report.baseline_metrics.accuracy:+.3f}")
    
    print(f"\nRecommendations:")
    for i, rec in enumerate(report.recommendations, 1):
        print(f"  {i}. {rec}")
    
    if report.risk_factors:
        print(f"\nRisk Factors:")
        for factor in report.risk_factors:
            print(f"  - {factor}")


if __name__ == '__main__':
    main()