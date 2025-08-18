"""
Test suite for model evaluation promotion harness.

Tests the ModelPromotionHarness class and related functionality for
model evaluation, synthetic data generation, and promotion decisions.
"""

import time
import pytest
import tempfile
import json
from pathlib import Path
from datetime import datetime, timedelta
from scripts.models.eval_promotion_harness import (
    ModelPromotionHarness,
    ModelEvaluationResult,
    PromotionDecision,
    SyntheticDataGenerator,
    EvaluationMetrics,
    PromotionCriteria
)


class DummyLogger:
    def __init__(self):
        self.messages = []
    
    def info(self, msg, *args, **kwargs):
        self.messages.append(('info', msg % args if args else msg))
    
    def warning(self, msg, *args, **kwargs):
        self.messages.append(('warning', msg % args if args else msg))
    
    def error(self, msg, *args, **kwargs):
        self.messages.append(('error', msg % args if args else msg))
    
    def debug(self, msg, *args, **kwargs):
        self.messages.append(('debug', msg % args if args else msg))


class DummyMetrics:
    def __init__(self):
        self.events = []
    
    def gauge(self, name, value, labels=None):
        self.events.append(('gauge', name, value, labels or {}))
    
    def increment(self, name, labels=None):
        self.events.append(('increment', name, labels or {}))


def test_harness_initialization():
    """Test harness initialization."""
    criteria = PromotionCriteria(
        min_accuracy=0.85,
        min_precision=0.80,
        max_false_positive_rate=0.10,
        min_sample_size=1000
    )
    
    harness = ModelPromotionHarness(promotion_criteria=criteria)
    
    assert harness.promotion_criteria == criteria
    assert harness.evaluation_results == []
    assert hasattr(harness, 'logger')


def test_promotion_criteria_validation():
    """Test promotion criteria validation."""
    # Valid criteria
    criteria = PromotionCriteria(
        min_accuracy=0.85,
        min_precision=0.80,
        max_false_positive_rate=0.10,
        min_sample_size=1000
    )
    
    assert criteria.min_accuracy == 0.85
    assert criteria.min_precision == 0.80
    
    # Test default values
    default_criteria = PromotionCriteria()
    assert default_criteria.min_accuracy == 0.80
    assert default_criteria.min_sample_size == 500


def test_evaluation_metrics_calculation():
    """Test evaluation metrics calculation."""
    # Create mock predictions and ground truth
    predictions = [0.9, 0.8, 0.7, 0.3, 0.2, 0.1, 0.95, 0.85]
    ground_truth = [1, 1, 1, 0, 0, 0, 1, 1]
    threshold = 0.5
    
    metrics = EvaluationMetrics.from_predictions(
        predictions, ground_truth, threshold
    )
    
    assert 0 <= metrics.accuracy <= 1
    assert 0 <= metrics.precision <= 1
    assert 0 <= metrics.recall <= 1
    assert 0 <= metrics.f1_score <= 1
    assert 0 <= metrics.false_positive_rate <= 1


def test_evaluation_metrics_edge_cases():
    """Test evaluation metrics with edge cases."""
    # All correct predictions
    perfect_preds = [0.9, 0.9, 0.1, 0.1]
    perfect_truth = [1, 1, 0, 0]
    
    perfect_metrics = EvaluationMetrics.from_predictions(
        perfect_preds, perfect_truth, 0.5
    )
    
    assert perfect_metrics.accuracy == 1.0
    
    # All wrong predictions
    wrong_preds = [0.1, 0.1, 0.9, 0.9]
    wrong_truth = [1, 1, 0, 0]
    
    wrong_metrics = EvaluationMetrics.from_predictions(
        wrong_preds, wrong_truth, 0.5
    )
    
    assert wrong_metrics.accuracy == 0.0


def test_synthetic_data_generator():
    """Test synthetic data generation."""
    generator = SyntheticDataGenerator()
    
    # Generate dataset
    dataset = generator.generate_dataset(
        size=100,
        sport="MLB",
        prop_type="STRIKEOUTS_PITCHER"
    )
    
    assert "features" in dataset
    assert "labels" in dataset
    assert "metadata" in dataset
    
    assert len(dataset["features"]) == 100
    assert len(dataset["labels"]) == 100
    assert dataset["metadata"]["sport"] == "MLB"


def test_synthetic_data_quality():
    """Test synthetic data quality and distribution."""
    generator = SyntheticDataGenerator()
    
    dataset = generator.generate_dataset(size=1000)
    
    features = dataset["features"]
    labels = dataset["labels"]
    
    # Check feature structure
    assert all(isinstance(f, dict) for f in features)
    assert all("confidence" in f for f in features)
    assert all("historical_performance" in f for f in features)
    
    # Check label distribution (should be balanced-ish)
    positive_labels = sum(labels)
    negative_labels = len(labels) - positive_labels
    
    # Should have both positive and negative examples
    assert positive_labels > 0
    assert negative_labels > 0
    
    # Should be reasonably balanced
    balance_ratio = min(positive_labels, negative_labels) / max(positive_labels, negative_labels)
    assert balance_ratio > 0.3  # At least 30% of minority class


def test_model_evaluation():
    """Test model evaluation process."""
    harness = ModelPromotionHarness()
    
    # Create mock model function
    def mock_model(features):
        """Simple mock model that returns confidence score."""
        return [f.get("confidence", 0.5) for f in features]
    
    # Generate test dataset
    generator = SyntheticDataGenerator()
    dataset = generator.generate_dataset(size=100)
    
    # Evaluate model
    result = harness.evaluate_model(
        model_fn=mock_model,
        model_id="test_model_v1",
        dataset=dataset
    )
    
    assert isinstance(result, ModelEvaluationResult)
    assert result.model_id == "test_model_v1"
    assert result.metrics is not None
    assert result.sample_size == 100


def test_promotion_decision_logic():
    """Test promotion decision logic."""
    criteria = PromotionCriteria(
        min_accuracy=0.80,
        min_precision=0.75,
        max_false_positive_rate=0.15,
        min_sample_size=50
    )
    
    harness = ModelPromotionHarness(promotion_criteria=criteria)
    
    # Create evaluation result that meets criteria
    good_metrics = EvaluationMetrics(
        accuracy=0.85,
        precision=0.80,
        recall=0.82,
        f1_score=0.81,
        false_positive_rate=0.10,
        true_positive_rate=0.82,
        auc_roc=0.88
    )
    
    good_result = ModelEvaluationResult(
        model_id="good_model",
        evaluation_timestamp=time.time(),
        metrics=good_metrics,
        sample_size=100,
        dataset_metadata={"sport": "MLB"},
        evaluation_duration_seconds=30.0
    )
    
    # Make promotion decision
    decision = harness.make_promotion_decision(good_result)
    
    assert isinstance(decision, PromotionDecision)
    assert decision.should_promote is True
    assert len(decision.justification) > 0


def test_promotion_decision_rejection():
    """Test promotion decision rejection."""
    criteria = PromotionCriteria(
        min_accuracy=0.90,  # Very high threshold
        min_precision=0.95,
        max_false_positive_rate=0.02,
        min_sample_size=1000
    )
    
    harness = ModelPromotionHarness(promotion_criteria=criteria)
    
    # Create evaluation result that doesn't meet criteria
    poor_metrics = EvaluationMetrics(
        accuracy=0.70,  # Below threshold
        precision=0.65,  # Below threshold
        recall=0.75,
        f1_score=0.70,
        false_positive_rate=0.25,  # Above threshold
        true_positive_rate=0.75,
        auc_roc=0.72
    )
    
    poor_result = ModelEvaluationResult(
        model_id="poor_model",
        evaluation_timestamp=time.time(),
        metrics=poor_metrics,
        sample_size=100,  # Below threshold
        dataset_metadata={"sport": "MLB"},
        evaluation_duration_seconds=30.0
    )
    
    # Make promotion decision
    decision = harness.make_promotion_decision(poor_result)
    
    assert decision.should_promote is False
    assert len(decision.failing_criteria) > 0


def test_evaluation_result_serialization():
    """Test evaluation result serialization."""
    metrics = EvaluationMetrics(
        accuracy=0.85,
        precision=0.80,
        recall=0.82,
        f1_score=0.81,
        false_positive_rate=0.10,
        true_positive_rate=0.82,
        auc_roc=0.88
    )
    
    result = ModelEvaluationResult(
        model_id="test_model",
        evaluation_timestamp=time.time(),
        metrics=metrics,
        sample_size=100,
        dataset_metadata={"sport": "MLB"},
        evaluation_duration_seconds=30.0
    )
    
    # Convert to dict
    result_dict = result.to_dict()
    
    assert isinstance(result_dict, dict)
    assert result_dict["model_id"] == "test_model"
    assert result_dict["sample_size"] == 100
    assert "metrics" in result_dict


def test_batch_evaluation():
    """Test batch evaluation of multiple models."""
    harness = ModelPromotionHarness()
    
    # Create multiple mock models
    def good_model(features):
        return [min(f.get("confidence", 0.5) * 1.2, 1.0) for f in features]
    
    def poor_model(features):
        return [f.get("confidence", 0.5) * 0.6 for f in features]
    
    models = {
        "good_model_v1": good_model,
        "poor_model_v1": poor_model
    }
    
    # Generate test dataset
    generator = SyntheticDataGenerator()
    dataset = generator.generate_dataset(size=200)
    
    # Evaluate all models
    results = harness.evaluate_models_batch(models, dataset)
    
    assert len(results) == 2
    assert all(isinstance(r, ModelEvaluationResult) for r in results)
    
    # Check that different models produce different results
    accuracies = [r.metrics.accuracy for r in results]
    assert len(set(accuracies)) > 1  # Should have different accuracies


def test_model_comparison():
    """Test model comparison functionality."""
    harness = ModelPromotionHarness()
    
    # Create evaluation results for comparison
    metrics1 = EvaluationMetrics(
        accuracy=0.85, precision=0.80, recall=0.82, f1_score=0.81,
        false_positive_rate=0.10, true_positive_rate=0.82, auc_roc=0.88
    )
    
    metrics2 = EvaluationMetrics(
        accuracy=0.90, precision=0.88, recall=0.85, f1_score=0.86,
        false_positive_rate=0.08, true_positive_rate=0.85, auc_roc=0.92
    )
    
    result1 = ModelEvaluationResult(
        model_id="model_a", evaluation_timestamp=time.time(),
        metrics=metrics1, sample_size=100, dataset_metadata={}
    )
    
    result2 = ModelEvaluationResult(
        model_id="model_b", evaluation_timestamp=time.time(),
        metrics=metrics2, sample_size=100, dataset_metadata={}
    )
    
    # Compare models
    comparison = harness.compare_models([result1, result2])
    
    assert "best_model" in comparison
    assert "ranking" in comparison
    assert "metric_comparisons" in comparison
    
    # Model B should be better
    assert comparison["best_model"]["model_id"] == "model_b"


def test_threshold_optimization():
    """Test threshold optimization."""
    harness = ModelPromotionHarness()
    
    # Create dataset with known optimal threshold
    generator = SyntheticDataGenerator()
    dataset = generator.generate_dataset(size=500)
    
    # Simple model that returns confidence directly
    def confidence_model(features):
        return [f.get("confidence", 0.5) for f in features]
    
    # Find optimal threshold
    optimal_threshold = harness.optimize_threshold(
        model_fn=confidence_model,
        dataset=dataset,
        thresholds=[0.3, 0.4, 0.5, 0.6, 0.7]
    )
    
    assert 0.0 <= optimal_threshold <= 1.0
    
    # Should return one of the tested thresholds
    assert optimal_threshold in [0.3, 0.4, 0.5, 0.6, 0.7]


def test_cross_validation():
    """Test cross-validation functionality."""
    harness = ModelPromotionHarness()
    
    # Simple model
    def test_model(features):
        return [f.get("confidence", 0.5) for f in features]
    
    # Generate dataset
    generator = SyntheticDataGenerator()
    dataset = generator.generate_dataset(size=100)
    
    # Perform cross-validation
    cv_results = harness.cross_validate(
        model_fn=test_model,
        dataset=dataset,
        folds=3
    )
    
    assert len(cv_results) == 3  # Should have 3 fold results
    assert all("accuracy" in result for result in cv_results)
    
    # Calculate mean performance
    mean_accuracy = sum(r["accuracy"] for r in cv_results) / len(cv_results)
    assert 0.0 <= mean_accuracy <= 1.0


def test_metrics_integration():
    """Test metrics client integration."""
    metrics_client = DummyMetrics()
    harness = ModelPromotionHarness(metrics_client=metrics_client)
    
    # Create evaluation result
    metrics = EvaluationMetrics(
        accuracy=0.85, precision=0.80, recall=0.82, f1_score=0.81,
        false_positive_rate=0.10, true_positive_rate=0.82, auc_roc=0.88
    )
    
    result = ModelEvaluationResult(
        model_id="test_model", evaluation_timestamp=time.time(),
        metrics=metrics, sample_size=100, dataset_metadata={}
    )
    
    # Record metrics
    harness.record_evaluation_metrics(result)
    
    # Check metrics recording
    gauge_events = [e for e in metrics_client.events if e[0] == 'gauge']
    assert len(gauge_events) > 0
    
    # Should record accuracy metric
    accuracy_events = [e for e in gauge_events if 'accuracy' in e[1]]
    assert len(accuracy_events) > 0


def test_logger_integration():
    """Test logger integration."""
    logger = DummyLogger()
    harness = ModelPromotionHarness()
    harness.logger = logger  # type: ignore
    
    # Generate evaluation
    generator = SyntheticDataGenerator()
    dataset = generator.generate_dataset(size=50)
    
    def simple_model(features):
        return [0.8] * len(features)
    
    # Evaluate model
    result = harness.evaluate_model(simple_model, "test_model", dataset)
    
    # Check logging
    info_messages = [msg for level, msg in logger.messages if level == 'info']
    assert len(info_messages) > 0


def test_evaluation_history_tracking():
    """Test evaluation history tracking."""
    harness = ModelPromotionHarness()
    
    # Generate multiple evaluations
    generator = SyntheticDataGenerator()
    
    for i in range(3):
        dataset = generator.generate_dataset(size=50)
        
        def model_fn(features):
            return [(f.get("confidence", 0.5) + i * 0.1) for f in features]
        
        result = harness.evaluate_model(model_fn, f"model_v{i}", dataset)
        
    # Should track all evaluations
    assert len(harness.evaluation_results) == 3
    
    # Should have different model IDs
    model_ids = [r.model_id for r in harness.evaluation_results]
    assert len(set(model_ids)) == 3


def test_performance_benchmarking():
    """Test performance benchmarking."""
    harness = ModelPromotionHarness()
    
    # Create model with known performance characteristics
    def benchmark_model(features):
        return [0.7] * len(features)  # Constant prediction
    
    # Generate consistent dataset
    generator = SyntheticDataGenerator()
    dataset = generator.generate_dataset(size=200)
    
    # Benchmark model
    start_time = time.time()
    result = harness.evaluate_model(benchmark_model, "benchmark_model", dataset)
    end_time = time.time()
    
    # Should complete quickly
    assert end_time - start_time < 5.0
    
    # Should record evaluation duration
    assert result.evaluation_duration_seconds is not None
    assert result.evaluation_duration_seconds > 0


def test_edge_cases():
    """Test edge cases and error conditions."""
    harness = ModelPromotionHarness()
    
    # Test with empty dataset
    empty_dataset = {
        "features": [],
        "labels": [],
        "metadata": {}
    }
    
    def dummy_model(features):
        return []
    
    # Should handle empty dataset gracefully
    result = harness.evaluate_model(dummy_model, "empty_test", empty_dataset)
    assert result.sample_size == 0
    
    # Test with model that returns wrong number of predictions
    def broken_model(features):
        return [0.5]  # Always returns one prediction regardless of input size
    
    # This should be handled gracefully or raise appropriate error
    try:
        small_dataset = {
            "features": [{"confidence": 0.8}, {"confidence": 0.6}],
            "labels": [1, 0],
            "metadata": {}
        }
        harness.evaluate_model(broken_model, "broken_model", small_dataset)
    except Exception:
        # Expected for broken model
        pass


if __name__ == "__main__":
    pytest.main([__file__])