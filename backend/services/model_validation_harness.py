"""
Model Validation Harness - Automated Testing and Regression Detection
Provides nightly validation, test inference cases, and regression delta tracking
"""

import asyncio
import json
from dataclasses import asdict, dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple, Callable
import logging

try:
    import numpy as np
    HAS_NUMPY = True
except ImportError:
    HAS_NUMPY = False
    # Create a simple stats function as fallback
    def percentile_fallback(data, percentile):
        if not data:
            return 0.0
        sorted_data = sorted(data)
        n = len(sorted_data)
        index = int(n * percentile / 100.0)
        return sorted_data[min(index, n - 1)]

from backend.services.unified_logging import unified_logging
from backend.services.unified_cache_service import unified_cache_service
from backend.services.unified_error_handler import unified_error_handler
from backend.services.model_registry_service import get_model_registry_service, ModelStatus


logger = logging.getLogger("validation_harness")


class ValidationStatus(Enum):
    """Validation run status"""
    PENDING = "pending"
    RUNNING = "running"
    PASSED = "passed"
    FAILED = "failed"
    ERROR = "error"


class TestCaseType(Enum):
    """Types of test inference cases"""
    UNIT_TEST = "unit_test"
    INTEGRATION_TEST = "integration_test"
    REGRESSION_TEST = "regression_test"
    PERFORMANCE_TEST = "performance_test"
    SMOKE_TEST = "smoke_test"


@dataclass
class TestCase:
    """Individual test case for model validation"""
    test_id: str
    name: str
    description: str
    test_type: TestCaseType
    sport: str
    
    # Input data for test
    input_data: Dict[str, Any]
    
    # Expected outputs (for regression testing)
    expected_output: Optional[Dict[str, Any]] = None
    expected_confidence_range: Tuple[float, float] = (0.0, 1.0)
    expected_timing_max_ms: float = 5000.0  # 5 second max
    
    # Validation thresholds
    accuracy_threshold: float = 0.8
    confidence_threshold: float = 0.6
    regression_tolerance: float = 0.05  # 5% tolerance for regression
    
    # Metadata
    created_at: datetime = field(default_factory=datetime.utcnow)
    tags: List[str] = field(default_factory=list)
    enabled: bool = True


@dataclass
class ValidationResult:
    """Result of a single test case validation"""
    test_id: str
    model_id: str
    status: ValidationStatus
    
    # Test execution details
    execution_time_ms: float
    prediction_output: Dict[str, Any]
    confidence_score: float
    
    # Validation checks
    accuracy_check: bool = False
    confidence_check: bool = False
    timing_check: bool = False
    regression_check: bool = False
    
    # Error details
    error_message: Optional[str] = None
    error_type: Optional[str] = None
    
    # Regression comparison
    baseline_output: Optional[Dict[str, Any]] = None
    regression_delta: Optional[float] = None
    
    # Timestamp
    executed_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class ValidationRun:
    """Complete validation run for a model"""
    run_id: str
    model_id: str
    model_version: str
    status: ValidationStatus
    
    # Test results
    test_results: List[ValidationResult] = field(default_factory=list)
    
    # Summary statistics
    total_tests: int = 0
    passed_tests: int = 0
    failed_tests: int = 0
    error_tests: int = 0
    
    # Performance summary
    avg_execution_time_ms: float = 0.0
    max_execution_time_ms: float = 0.0
    
    # Regression analysis
    regression_detected: bool = False
    regression_severity: str = "none"  # none, low, medium, high
    
    # Metadata
    started_at: datetime = field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    triggered_by: str = "nightly_schedule"


class ModelValidationHarness:
    """Automated model validation and regression detection system"""
    
    def __init__(self):
        self.model_registry = get_model_registry_service()
        self.test_cases: Dict[str, TestCase] = {}
        self.validation_history: List[ValidationRun] = []
        self.baseline_results: Dict[str, Dict[str, Any]] = {}  # model_id -> test_id -> baseline
        self._validation_runners: Dict[str, Callable] = {}
        
        # Initialize default test cases
        self._initialize_default_test_cases()
    
    def _initialize_default_test_cases(self):
        """Initialize default test cases for sports models"""
        default_cases = [
            TestCase(
                test_id="mlb_basic_prediction",
                name="MLB Basic Prediction Test",
                description="Test basic MLB prop prediction functionality",
                test_type=TestCaseType.SMOKE_TEST,
                sport="MLB",
                input_data={
                    "player_stats": {
                        "batting_avg": 0.285,
                        "home_runs": 25,
                        "rbi": 75,
                        "ops": 0.850
                    },
                    "game_context": {
                        "home_team": "Yankees",
                        "away_team": "Red Sox",
                        "weather": "clear",
                        "temperature": 75
                    }
                },
                expected_confidence_range=(0.6, 0.9),
                expected_timing_max_ms=2000.0,
                tags=["mlb", "smoke", "basic"]
            ),
            TestCase(
                test_id="mlb_edge_case_prediction",
                name="MLB Edge Case Test",
                description="Test model behavior with edge case inputs",
                test_type=TestCaseType.UNIT_TEST,
                sport="MLB",
                input_data={
                    "player_stats": {
                        "batting_avg": 0.150,  # Very low
                        "home_runs": 0,
                        "rbi": 5,
                        "ops": 0.400
                    },
                    "game_context": {
                        "home_team": "Padres",
                        "away_team": "Rockies",
                        "weather": "rain",
                        "temperature": 45
                    }
                },
                expected_confidence_range=(0.4, 0.8),
                confidence_threshold=0.4,  # Lower threshold for edge cases
                tags=["mlb", "edge_case", "robustness"]
            ),
            TestCase(
                test_id="performance_stress_test",
                name="Performance Stress Test",
                description="Test model performance under load",
                test_type=TestCaseType.PERFORMANCE_TEST,
                sport="MLB",
                input_data={
                    "batch_size": 100,
                    "concurrent_requests": 10,
                    "player_stats": {
                        "batting_avg": 0.275,
                        "home_runs": 20,
                        "rbi": 65,
                        "ops": 0.825
                    }
                },
                expected_timing_max_ms=10000.0,  # 10 seconds for batch
                tags=["performance", "stress", "batch"]
            )
        ]
        
        for test_case in default_cases:
            self.test_cases[test_case.test_id] = test_case
    
    def register_test_case(self, test_case: TestCase):
        """Register a new test case"""
        self.test_cases[test_case.test_id] = test_case
        logger.info(f"✅ Registered test case: {test_case.name} ({test_case.test_id})")
    
    def register_validation_runner(self, model_type: str, runner_func: Callable):
        """Register a validation runner function for a specific model type"""
        self._validation_runners[model_type] = runner_func
        logger.info(f"✅ Registered validation runner for model type: {model_type}")
    
    async def run_validation(self, model_id: str, test_case_ids: Optional[List[str]] = None) -> ValidationRun:
        """Run validation for a specific model"""
        model = self.model_registry.get_model(model_id)
        if not model:
            raise ValueError(f"Model {model_id} not found")
        
        # Determine which test cases to run
        if test_case_ids is None:
            # Run all applicable test cases for this sport
            applicable_cases = [
                tc for tc in self.test_cases.values() 
                if tc.sport.lower() == model.sport.lower() and tc.enabled
            ]
        else:
            applicable_cases = [
                self.test_cases[tc_id] for tc_id in test_case_ids 
                if tc_id in self.test_cases
            ]
        
        # Create validation run
        validation_run = ValidationRun(
            run_id=f"validation_{model_id}_{int(datetime.utcnow().timestamp())}",
            model_id=model_id,
            model_version=model.version,
            status=ValidationStatus.RUNNING,
            total_tests=len(applicable_cases)
        )
        
        logger.info(f"🧪 Starting validation run {validation_run.run_id} for model {model_id} ({len(applicable_cases)} tests)")
        
        # Run each test case
        for test_case in applicable_cases:
            try:
                result = await self._run_single_test(model, test_case)
                validation_run.test_results.append(result)
                
                # Update statistics
                if result.status == ValidationStatus.PASSED:
                    validation_run.passed_tests += 1
                elif result.status == ValidationStatus.FAILED:
                    validation_run.failed_tests += 1
                else:
                    validation_run.error_tests += 1
                
                # Track performance
                validation_run.avg_execution_time_ms += result.execution_time_ms
                validation_run.max_execution_time_ms = max(
                    validation_run.max_execution_time_ms,
                    result.execution_time_ms
                )
                
            except Exception as e:
                error_result = ValidationResult(
                    test_id=test_case.test_id,
                    model_id=model_id,
                    status=ValidationStatus.ERROR,
                    execution_time_ms=0.0,
                    prediction_output={},
                    confidence_score=0.0,
                    error_message=str(e),
                    error_type=type(e).__name__
                )
                validation_run.test_results.append(error_result)
                validation_run.error_tests += 1
        
        # Finalize validation run
        validation_run.avg_execution_time_ms /= len(applicable_cases) if applicable_cases else 1
        validation_run.completed_at = datetime.utcnow()
        
        # Determine overall status
        if validation_run.error_tests > 0:
            validation_run.status = ValidationStatus.ERROR
        elif validation_run.failed_tests > 0:
            validation_run.status = ValidationStatus.FAILED
        else:
            validation_run.status = ValidationStatus.PASSED
        
        # Analyze regression
        await self._analyze_regression(validation_run)
        
        # Store results
        self.validation_history.append(validation_run)
        await self._persist_validation_results(validation_run)
        
        logger.info(f"✅ Completed validation run {validation_run.run_id}: {validation_run.status.value}")
        logger.info(f"   Results: {validation_run.passed_tests} passed, {validation_run.failed_tests} failed, {validation_run.error_tests} errors")
        
        return validation_run
    
    async def _run_single_test(self, model, test_case: TestCase) -> ValidationResult:
        """Run a single test case against a model"""
        start_time = datetime.utcnow()
        
        try:
            # Get the appropriate validation runner
            runner_func = self._validation_runners.get(
                model.model_type.value,
                self._default_validation_runner
            )
            
            # Execute the test
            prediction_output, confidence_score = await runner_func(model, test_case.input_data)
            
            end_time = datetime.utcnow()
            execution_time_ms = (end_time - start_time).total_seconds() * 1000
            
            # Create result
            result = ValidationResult(
                test_id=test_case.test_id,
                model_id=model.model_id,
                status=ValidationStatus.PASSED,  # Will be updated based on checks
                execution_time_ms=execution_time_ms,
                prediction_output=prediction_output,
                confidence_score=confidence_score
            )
            
            # Perform validation checks
            result.timing_check = execution_time_ms <= test_case.expected_timing_max_ms
            result.confidence_check = (
                test_case.expected_confidence_range[0] <= confidence_score <= test_case.expected_confidence_range[1]
                and confidence_score >= test_case.confidence_threshold
            )
            
            # Regression check (compare with baseline if available)
            baseline_key = f"{model.model_id}:{test_case.test_id}"
            if baseline_key in self.baseline_results:
                result.baseline_output = self.baseline_results[baseline_key]
                result.regression_delta = self._calculate_regression_delta(
                    prediction_output, result.baseline_output
                )
                result.regression_check = result.regression_delta <= test_case.regression_tolerance
            else:
                result.regression_check = True  # No baseline to compare against
            
            # Overall accuracy check (custom logic can be implemented per model type)
            result.accuracy_check = self._validate_prediction_accuracy(test_case, prediction_output, confidence_score)
            
            # Determine final status
            if all([result.timing_check, result.confidence_check, result.regression_check, result.accuracy_check]):
                result.status = ValidationStatus.PASSED
            else:
                result.status = ValidationStatus.FAILED
                result.error_message = self._generate_failure_message(result)
            
            # Record timing in model registry
            await self.model_registry.record_inference_timing(
                model.model_id, 
                execution_time_ms,
                success=(result.status == ValidationStatus.PASSED)
            )
            
            return result
            
        except Exception as e:
            logger.error(f"Failed validation test {test_case.test_id} for model {model.model_id}: {e}")
            raise
    
    async def _default_validation_runner(self, model, input_data: Dict[str, Any]) -> Tuple[Dict[str, Any], float]:
        """Default validation runner for models without specific runners"""
        # This is a mock implementation - in reality, this would call the actual model
        prediction = {
            "prop_type": "hits",
            "predicted_value": 2.5,
            "probability": 0.75,
            "recommendation": "over",
            "reasoning": "Based on historical performance and current conditions"
        }
        
        confidence = 0.8
        
        # Simulate some processing time
        await asyncio.sleep(0.1)
        
        return prediction, confidence
    
    def _calculate_regression_delta(self, current_output: Dict[str, Any], baseline_output: Dict[str, Any]) -> float:
        """Calculate regression delta between current and baseline outputs"""
        try:
            # Simple numeric comparison for demonstration
            current_value = current_output.get("predicted_value", 0)
            baseline_value = baseline_output.get("predicted_value", 0)
            
            if baseline_value == 0:
                return 0.0
            
            return abs(current_value - baseline_value) / baseline_value
            
        except Exception:
            return 0.0
    
    def _validate_prediction_accuracy(self, test_case: TestCase, prediction: Dict[str, Any], confidence: float) -> bool:
        """Validate prediction accuracy based on test case expectations"""
        # Basic sanity checks
        if not prediction:
            return False
        
        # Check if prediction has required fields
        required_fields = ["prop_type", "predicted_value"]
        if not all(field in prediction for field in required_fields):
            return False
        
        # Check value ranges
        predicted_value = prediction.get("predicted_value", 0)
        if predicted_value < 0:  # Negative predictions are usually invalid
            return False
        
        return True
    
    def _generate_failure_message(self, result: ValidationResult) -> str:
        """Generate detailed failure message"""
        failures = []
        
        if not result.timing_check:
            failures.append(f"Timing exceeded limit ({result.execution_time_ms:.1f}ms)")
        if not result.confidence_check:
            failures.append(f"Confidence out of range ({result.confidence_score:.2f})")
        if not result.regression_check:
            failures.append(f"Regression detected ({result.regression_delta:.3f})")
        if not result.accuracy_check:
            failures.append("Accuracy validation failed")
        
        return "; ".join(failures)
    
    async def _analyze_regression(self, validation_run: ValidationRun):
        """Analyze validation run for regression patterns"""
        regression_count = sum(1 for result in validation_run.test_results if not result.regression_check)
        total_with_baselines = sum(1 for result in validation_run.test_results if result.baseline_output is not None)
        
        if total_with_baselines == 0:
            validation_run.regression_severity = "none"
            return
        
        regression_rate = regression_count / total_with_baselines
        
        if regression_rate >= 0.5:
            validation_run.regression_detected = True
            validation_run.regression_severity = "high"
        elif regression_rate >= 0.25:
            validation_run.regression_detected = True
            validation_run.regression_severity = "medium"
        elif regression_rate > 0:
            validation_run.regression_detected = True
            validation_run.regression_severity = "low"
        else:
            validation_run.regression_severity = "none"
    
    async def _persist_validation_results(self, validation_run: ValidationRun):
        """Persist validation results for future reference"""
        try:
            # Store in cache with 30-day retention
            cache_key = f"validation_run:{validation_run.run_id}"
            await unified_cache_service.set(
                cache_key,
                asdict(validation_run),
                ttl=30 * 24 * 3600  # 30 days
            )
            
            # Update baselines for successful tests
            for result in validation_run.test_results:
                if result.status == ValidationStatus.PASSED:
                    baseline_key = f"{result.model_id}:{result.test_id}"
                    self.baseline_results[baseline_key] = result.prediction_output
            
            logger.info(f"✅ Persisted validation results for run {validation_run.run_id}")
            
        except Exception as e:
            logger.error(f"Failed to persist validation results: {e}")
    
    async def schedule_nightly_validation(self):
        """Schedule nightly validation for all active models"""
        logger.info("🌙 Starting nightly validation schedule")
        
        # Get all models that should be validated
        models_to_validate = self.model_registry.list_models(status=ModelStatus.STABLE) + \
                           self.model_registry.list_models(status=ModelStatus.CANARY)
        
        validation_results = []
        
        for model in models_to_validate:
            try:
                logger.info(f"🧪 Running nightly validation for model {model.model_id}")
                result = await self.run_validation(model.model_id)
                validation_results.append(result)
                
                # Check if model should be flagged for issues
                if result.status == ValidationStatus.FAILED or result.regression_detected:
                    await self._handle_validation_failure(model, result)
                
            except Exception as e:
                logger.error(f"Failed nightly validation for model {model.model_id}: {e}")
        
        logger.info(f"✅ Completed nightly validation: {len(validation_results)} models processed")
        return validation_results
    
    async def _handle_validation_failure(self, model, validation_result: ValidationRun):
        """Handle validation failures and regressions"""
        logger.warning(f"⚠️ Validation issues detected for model {model.model_id}")
        
        # For high-severity regressions, consider downgrading model status
        if validation_result.regression_severity == "high":
            logger.warning(f"🚨 High-severity regression detected for model {model.model_id}")
            
            # Downgrade from STABLE to CANARY, or CANARY to DEVELOPMENT
            if model.status == ModelStatus.STABLE:
                await self.model_registry.update_model_status(model.model_id, ModelStatus.CANARY)
                logger.info(f"⬇️ Downgraded model {model.model_id} from STABLE to CANARY")
            elif model.status == ModelStatus.CANARY:
                await self.model_registry.update_model_status(model.model_id, ModelStatus.DEVELOPMENT)
                logger.info(f"⬇️ Downgraded model {model.model_id} from CANARY to DEVELOPMENT")
    
    def get_validation_history(self, model_id: Optional[str] = None, days: int = 30) -> List[ValidationRun]:
        """Get validation history for analysis"""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        history = [
            run for run in self.validation_history 
            if run.started_at >= cutoff_date
        ]
        
        if model_id:
            history = [run for run in history if run.model_id == model_id]
        
        return sorted(history, key=lambda x: x.started_at, reverse=True)
    
    def get_regression_report(self, model_id: str, days: int = 7) -> Dict[str, Any]:
        """Generate regression analysis report for a model"""
        history = self.get_validation_history(model_id, days)
        
        if not history:
            return {"model_id": model_id, "message": "No validation history found"}
        
        total_runs = len(history)
        runs_with_regression = sum(1 for run in history if run.regression_detected)
        
        # Calculate regression trend
        recent_runs = history[:5]  # Last 5 runs
        recent_regression_rate = sum(1 for run in recent_runs if run.regression_detected) / len(recent_runs)
        
        return {
            "model_id": model_id,
            "period_days": days,
            "total_validation_runs": total_runs,
            "runs_with_regression": runs_with_regression,
            "regression_rate": runs_with_regression / total_runs if total_runs > 0 else 0,
            "recent_regression_rate": recent_regression_rate,
            "trend": "improving" if recent_regression_rate < 0.2 else "concerning" if recent_regression_rate > 0.5 else "stable",
            "last_validation": history[0].started_at.isoformat() if history else None,
            "severity_breakdown": {
                "high": sum(1 for run in history if run.regression_severity == "high"),
                "medium": sum(1 for run in history if run.regression_severity == "medium"),
                "low": sum(1 for run in history if run.regression_severity == "low")
            }
        }


# Global singleton instance
_validation_harness = None


def get_validation_harness() -> ModelValidationHarness:
    """Get global validation harness instance"""
    global _validation_harness
    if _validation_harness is None:
        _validation_harness = ModelValidationHarness()
    return _validation_harness