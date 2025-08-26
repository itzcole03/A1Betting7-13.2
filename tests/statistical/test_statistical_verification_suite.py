"""
Pytest integration for statistical verification suite.

This module provides comprehensive pytest-based tests for statistical accuracy
and stability verification, designed to run in CI/CD environments with
build failure mechanisms.
"""

import os
import pytest
import asyncio
from datetime import datetime, timedelta
from typing import Dict, Any, List
from pathlib import Path

# Try to import numpy and scipy with fallbacks
try:
    import numpy as np
except ImportError:
    pytest.skip("numpy not available", allow_module_level=True)

try:
    from scipy import stats
except ImportError:
    pytest.skip("scipy not available", allow_module_level=True)

from .test_monte_carlo_deterministic import (
    StatisticalTestSuite,
    StatisticalBaseline,
    statistical_test_environment,
    create_test_correlation_matrix
)

# Mark all tests in this module as statistical tests
pytestmark = pytest.mark.statistical


class TestDeterministicMonteCarlo:
    """Test deterministic Monte Carlo simulation pipeline"""
    
    def test_seed_reproducibility(self, statistical_suite):
        """Test that identical seeds produce identical results"""
        
        def sample_generation():
            return np.random.normal(0, 1, 1000)
        
        # Test reproducibility
        reproducible = statistical_suite.seed_pipeline.validate_reproducibility(
            sample_generation
        )
        
        assert reproducible, "Monte Carlo simulations must be reproducible with same seed"
    
    def test_deterministic_seed_generation(self, statistical_suite):
        """Test deterministic seed sequence generation"""
        
        statistical_suite.seed_pipeline.initialize_deterministic_state(42)
        
        # Generate seed sequences multiple times
        seeds1 = statistical_suite.seed_pipeline.generate_simulation_seeds(10)
        
        # Reset and generate again
        statistical_suite.seed_pipeline.initialize_deterministic_state(42)
        seeds2 = statistical_suite.seed_pipeline.generate_simulation_seeds(10)
        
        assert seeds1 == seeds2, "Seed sequences must be deterministic"
        assert len(set(seeds1)) == len(seeds1), "Seeds must be unique within sequence"
    
    def test_monte_carlo_convergence(self, statistical_suite):
        """Test Monte Carlo convergence with increasing sample sizes"""
        
        statistical_suite.seed_pipeline.initialize_deterministic_state(42)
        
        # Test convergence of sample mean to theoretical mean
        theoretical_mean = 0.0
        sample_sizes = [1000, 5000, 10000, 50000]
        sample_means = []
        
        for size in sample_sizes:
            samples = np.random.normal(0, 1, size)
            sample_means.append(np.mean(samples))
        
        # Check convergence - later samples should be closer to theoretical mean
        errors = [abs(mean - theoretical_mean) for mean in sample_means]
        
        # Generally, errors should decrease (with some tolerance for randomness)
        convergence_observed = errors[-1] < errors[0] or errors[-1] < 0.05
        
        assert convergence_observed, f"Monte Carlo should converge: errors={errors}"


class TestKSTestRunner:
    """Test Kolmogorov-Smirnov test auto-runner functionality"""
    
    def test_ks_normal_distribution(self, statistical_suite):
        """Test KS comparison for normal distribution"""
        
        with statistical_test_environment(seed=42):
            # Generate MC samples
            mc_samples = np.random.normal(0, 1, 10000)
            
            # Define analytic CDF
            def normal_cdf(x):
                from scipy import stats
                return stats.norm.cdf(x, 0, 1)
            
            # Run KS test
            result = statistical_suite.ks_runner.compare_distributions(
                mc_samples, normal_cdf, "test_normal_ks"
            )
            
            assert result.passed, f"KS test should pass for normal distribution: p={result.p_value:.6f}"
            assert result.p_value is not None, "KS test must return p-value"
            assert result.sample_size == len(mc_samples), "Sample size must be recorded correctly"
    
    def test_ks_distribution_mismatch_detection(self, statistical_suite):
        """Test KS test detects distribution mismatch"""
        
        with statistical_test_environment(seed=42):
            # Generate samples from exponential distribution
            mc_samples = np.random.exponential(1.0, 10000)
            
            # Compare against normal CDF (should fail)
            def normal_cdf(x):
                from scipy import stats
                return stats.norm.cdf(x, 0, 1)
            
            result = statistical_suite.ks_runner.compare_distributions(
                mc_samples, normal_cdf, "test_mismatch_detection"
            )
            
            # This should fail because exponential != normal
            assert not result.passed, "KS test should detect distribution mismatch"
            assert result.p_value < 0.05, f"p-value should be low for mismatch: p={result.p_value:.6f}"
    
    def test_ks_critical_divergence_threshold(self, statistical_suite):
        """Test KS critical divergence threshold mechanism"""
        
        with statistical_test_environment(seed=42):
            # Generate samples with large divergence from target distribution
            mc_samples = np.random.uniform(0, 1, 10000)  # Uniform samples
            
            # Compare against normal (should trigger critical divergence)
            def normal_cdf(x):
                from scipy import stats
                return stats.norm.cdf(x, 0, 1)
            
            result = statistical_suite.ks_runner.compare_distributions(
                mc_samples, normal_cdf, "test_critical_divergence"
            )
            
            # Should fail due to critical divergence
            assert not result.passed, "Critical divergence should cause test failure"
            assert result.additional_metrics.get('critical_divergence_detected'), \
                "Critical divergence should be flagged"


class TestCorrelationPSDMonitor:
    """Test correlation matrix PSD validation and drift monitoring"""
    
    def test_valid_correlation_matrix_validation(self, statistical_suite):
        """Test validation of proper correlation matrix"""
        
        # Create valid correlation matrix
        correlation_matrix = create_test_correlation_matrix(5, condition_number=10.0)
        
        result = statistical_suite.drift_monitor.validate_correlation_matrix(
            correlation_matrix, "test_valid_matrix"
        )
        
        assert result.passed, "Valid correlation matrix should pass validation"
        assert result.additional_metrics['psd_valid'], "Matrix should be PSD"
        assert result.additional_metrics['eigenvalue_valid'], "Eigenvalues should be valid"
        assert result.additional_metrics['condition_valid'], "Condition number should be valid"
    
    def test_invalid_correlation_matrix_detection(self, statistical_suite):
        """Test detection of invalid correlation matrix"""
        
        # Create invalid matrix (not PSD)
        invalid_matrix = np.array([
            [1.0, 0.9, 0.8],
            [0.9, 1.0, 0.9],
            [0.8, 0.9, -0.5]  # This makes it not PSD
        ])
        
        result = statistical_suite.drift_monitor.validate_correlation_matrix(
            invalid_matrix, "test_invalid_matrix"
        )
        
        # Should detect the issue
        assert not result.passed or not result.additional_metrics['psd_valid'], \
            "Invalid correlation matrix should be detected"
    
    def test_correlation_drift_detection(self, statistical_suite):
        """Test correlation matrix drift detection"""
        
        # Create baseline matrix
        baseline_matrix = create_test_correlation_matrix(5, condition_number=5.0)
        
        # Create slightly modified matrix
        with statistical_test_environment(seed=42):
            noise = np.random.normal(0, 0.01, baseline_matrix.shape)
            noise = (noise + noise.T) / 2  # Make symmetric
            np.fill_diagonal(noise, 0)  # Keep diagonal at 1
            
            drift_matrix = baseline_matrix + noise
            np.fill_diagonal(drift_matrix, 1.0)
        
        # Test drift detection
        result = statistical_suite.drift_monitor.detect_drift(
            drift_matrix, baseline_matrix
        )
        
        assert result is not None, "Drift detection must return result"
        assert result.metric_value >= 0, "Drift metric must be non-negative"
    
    def test_eigenvalue_threshold_monitoring(self, statistical_suite):
        """Test minimum eigenvalue threshold monitoring"""
        
        # Create matrix with very small eigenvalue
        eigenvalues = np.array([1.0, 0.8, 0.5, 0.1, 1e-10])  # Very small last eigenvalue
        Q = np.linalg.qr(np.random.randn(5, 5))[0]
        
        test_matrix = Q @ np.diag(eigenvalues) @ Q.T
        test_matrix = (test_matrix + test_matrix.T) / 2
    # Do not overwrite diagonal; keep constructed eigen-spectrum so
    # the intentionally tiny eigenvalue remains present for the test.
        
        result = statistical_suite.drift_monitor.validate_correlation_matrix(
            test_matrix, "test_small_eigenvalue"
        )
        
        # Should detect small eigenvalue issue
        assert not result.additional_metrics['eigenvalue_valid'], \
            "Small eigenvalue should be detected"
        assert result.additional_metrics['min_eigenvalue'] < statistical_suite.baseline.min_eigenvalue_threshold


class TestCIWidthGuard:
    """Test confidence interval width regression guard"""
    
    def test_baseline_ci_establishment(self, statistical_suite):
        """Test establishment of baseline CI width"""
        
        with statistical_test_environment(seed=42):
            # Generate baseline samples
            baseline_samples = np.random.beta(2, 3, 10000)
            
            # Establish baseline
            baseline_width = statistical_suite.ci_guard.establish_baseline_ci_width(
                "test_baseline", baseline_samples
            )
            
            assert baseline_width > 0, "Baseline CI width must be positive"
            assert "test_baseline" in statistical_suite.ci_guard._baseline_ci_widths, \
                "Baseline must be stored"
    
    def test_ci_width_regression_detection(self, statistical_suite):
        """Test CI width regression detection"""
        
        with statistical_test_environment(seed=42):
            # Establish baseline with narrow distribution
            baseline_samples = np.random.normal(0.5, 0.1, 10000)
            statistical_suite.ci_guard.establish_baseline_ci_width(
                "test_regression", baseline_samples
            )
            
            # Create samples with wider distribution (should trigger regression)
            wider_samples = np.random.normal(0.5, 0.5, 10000)  # 5x wider std
            
            result = statistical_suite.ci_guard.check_ci_width_regression(
                "test_regression", wider_samples
            )
            
            # Should detect regression
            assert not result.passed, "CI width regression should be detected"
            assert result.additional_metrics['regression_detected'], \
                "Regression flag should be set"
            assert result.metric_value > statistical_suite.baseline.ci_width_regression_threshold, \
                "Relative change should exceed threshold"
    
    def test_ci_width_stable_distribution(self, statistical_suite):
        """Test CI width check with stable distribution"""
        
        with statistical_test_environment(seed=42):
            # Establish baseline
            baseline_samples = np.random.beta(2, 3, 10000)
            statistical_suite.ci_guard.establish_baseline_ci_width(
                "test_stable", baseline_samples
            )
            
            # Create similar samples
            similar_samples = np.random.beta(2.1, 2.9, 10000)  # Very similar parameters
            
            result = statistical_suite.ci_guard.check_ci_width_regression(
                "test_stable", similar_samples
            )
            
            # Should pass
            assert result.passed, "Similar distribution should not trigger regression"
            assert not result.additional_metrics['regression_detected'], \
                "Regression flag should not be set"


class TestFullStatisticalSuite:
    """Integration tests for complete statistical verification suite"""
    
    def test_complete_suite_execution(self, statistical_suite):
        """Test execution of complete statistical verification suite"""
        
        # Run full suite
        summary = statistical_suite.run_full_suite()
        
        # Verify summary structure
        assert 'success' in summary, "Summary must include success status"
        assert 'total_tests' in summary, "Summary must include test count"
        assert 'pass_rate' in summary, "Summary must include pass rate"
        assert 'duration_seconds' in summary, "Summary must include duration"
        assert 'build_should_fail' in summary, "Summary must include build failure flag"
        
        # Verify test categories were run
        assert 'categories' in summary, "Summary must include category breakdown"
        expected_categories = ['ks_tests', 'correlation', 'ci_regression']
        for category in expected_categories:
            assert category in summary['categories'], f"Category {category} must be present"
    
    def test_suite_deterministic_behavior(self, statistical_suite):
        """Test that suite produces deterministic results"""
        
        # Run suite twice with same configuration
        summary1 = statistical_suite.run_full_suite()
        
        # Create new suite with same baseline
        suite2 = StatisticalTestSuite(statistical_suite.baseline)
        summary2 = suite2.run_full_suite()
        
        # Results should be highly consistent (allowing for minor floating-point differences)
        assert summary1['total_tests'] == summary2['total_tests'], \
            "Test count should be identical"
        
        # Pass rates should be very similar (within 10% for robustness)
        pass_rate_diff = abs(summary1['pass_rate'] - summary2['pass_rate'])
        assert pass_rate_diff < 0.1, f"Pass rates should be similar: {pass_rate_diff:.3f}"
    
    def test_build_failure_mechanism(self, statistical_suite):
        """Test build failure mechanism triggering"""
        
        # Modify baseline to make tests more likely to fail
        strict_baseline = StatisticalBaseline(
            ks_p_value_threshold=0.99,  # Very strict
            ci_width_regression_threshold=0.001  # Almost no regression allowed
        )
        
        strict_suite = StatisticalTestSuite(strict_baseline)
        summary = strict_suite.run_full_suite()
        
        # With strict thresholds, some tests should fail
        if summary['failed_tests'] > 0:
            assert summary['build_should_fail'], \
                "Build should fail when tests fail"
    
    def test_alert_trigger_conditions(self, statistical_suite):
        """Test alert trigger condition detection"""
        
        # This is tested implicitly through other tests
        # Alert conditions are checked in _check_alert_conditions method
        
        summary = statistical_suite.run_full_suite()
        
        assert 'alert_triggers' in summary, "Summary must include alert triggers"
        assert isinstance(summary['alert_triggers'], list), \
            "Alert triggers must be a list"
    
    @pytest.mark.asyncio
    async def test_ci_cd_integration_ready(self, statistical_suite):
        """Test that suite is ready for CI/CD integration"""
        
        # Run suite in async context (simulating CI environment)
        summary = await asyncio.get_event_loop().run_in_executor(
            None, statistical_suite.run_full_suite
        )
        
        # Verify CI-ready output format
        assert isinstance(summary, dict), "Summary must be JSON-serializable dict"
        assert summary['timestamp'], "Must include timestamp"
        assert 'build_should_fail' in summary, "Must provide clear build decision"
        
        # Test result persistence
        output_file = statistical_suite.save_results()
        assert Path(output_file).exists(), "Results file must be created"
        
        # Clean up
        Path(output_file).unlink()


class TestIntentionalDriftInjection:
    """Tests for intentional statistical drift injection to verify alert systems"""
    
    def test_intentional_ks_divergence_injection(self, statistical_suite):
        """Inject intentional KS divergence to test alert triggering"""
        
        with statistical_test_environment(seed=42):
            # Generate samples from wrong distribution intentionally
            mc_samples = np.random.uniform(-3, 3, 10000)  # Uniform instead of normal
            
            def normal_cdf(x):
                from scipy import stats
                return stats.norm.cdf(x, 0, 1)
            
            result = statistical_suite.ks_runner.compare_distributions(
                mc_samples, normal_cdf, "intentional_divergence_test"
            )
            
            # This should definitely fail
            assert not result.passed, "Intentional divergence should trigger alert"
            assert result.additional_metrics.get('critical_divergence_detected'), \
                "Critical divergence alert should trigger"
    
    def test_intentional_correlation_drift_injection(self, statistical_suite):
        """Inject intentional correlation drift to test monitoring"""
        
        # Create baseline
        baseline_matrix = create_test_correlation_matrix(4, condition_number=5.0)
        
        # Create heavily modified matrix
        drift_matrix = baseline_matrix.copy()
        drift_matrix[0, 1] = 0.95  # Inject high correlation
        drift_matrix[1, 0] = 0.95
        drift_matrix[2, 3] = -0.8  # Inject negative correlation
        drift_matrix[3, 2] = -0.8
        
        result = statistical_suite.drift_monitor.detect_drift(
            drift_matrix, baseline_matrix
        )
        
        # Should detect significant drift
        assert not result.passed, "Intentional correlation drift should be detected"
        assert result.metric_value > statistical_suite.baseline.correlation_drift_threshold, \
            "Drift metric should exceed threshold"
    
    def test_intentional_ci_regression_injection(self, statistical_suite):
        """Inject intentional CI width regression to test guard"""
        
        with statistical_test_environment(seed=42):
            # Establish baseline with tight distribution
            tight_samples = np.random.normal(0.5, 0.05, 10000)  # Very tight
            statistical_suite.ci_guard.establish_baseline_ci_width(
                "intentional_regression", tight_samples
            )
            
            # Create much wider distribution
            wide_samples = np.random.uniform(0, 1, 10000)  # Uniform over [0,1]
            
            result = statistical_suite.ci_guard.check_ci_width_regression(
                "intentional_regression", wide_samples
            )
            
            # Should definitely trigger regression alert
            assert not result.passed, "Intentional CI regression should be detected"
            assert result.additional_metrics['regression_detected'], \
                "Regression alert should trigger"
            assert result.metric_value > 1.0, "Relative change should be very large"


# Pytest configuration and fixtures for CI integration
@pytest.fixture(scope="session")
def ci_statistical_baseline():
    """Statistical baseline optimized for CI environment"""
    return StatisticalBaseline(
        mc_seed=int(os.getenv('PYTEST_SEED', 42)),  # Allow seed override from CI
        mc_sample_size=int(os.getenv('MC_SAMPLE_SIZE', 10000)),  # Allow size override
        ks_p_value_threshold=float(os.getenv('KS_THRESHOLD', 0.01)),  # Stricter for CI
        ci_width_regression_threshold=float(os.getenv('CI_REGRESSION_THRESHOLD', 0.05))
    )


@pytest.mark.ci_critical
def test_statistical_verification_ci_critical(ci_statistical_baseline):
    """Critical statistical verification test for CI/CD pipeline"""
    
    suite = StatisticalTestSuite(ci_statistical_baseline)
    summary = suite.run_full_suite()
    
    # Save results for CI artifact
    results_file = suite.save_results("ci_statistical_results.json")
    
    # Critical assertion for build status
    if summary['build_should_fail']:
        pytest.fail(
            f"Statistical verification FAILED - Build should fail!\n"
            f"Failed tests: {summary['failed_tests']}/{summary['total_tests']}\n"
            f"Pass rate: {summary['pass_rate']:.2%}\n"
            f"Alert triggers: {summary['alert_triggers']}\n"
            f"Details saved to: {results_file}"
        )
    
    # Log success
    print(f"\n✅ Statistical verification PASSED")
    print(f"   Tests: {summary['passed_tests']}/{summary['total_tests']} passed")
    print(f"   Pass rate: {summary['pass_rate']:.2%}")
    print(f"   Duration: {summary['duration_seconds']:.2f}s")
    print(f"   Results: {results_file}")


if __name__ == "__main__":
    # Allow running tests directly
    pytest.main([__file__, "-v", "--tb=short"])