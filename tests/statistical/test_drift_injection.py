"""
Intentional Statistical Drift Injection Tests

This module provides test cases that intentionally inject statistical drift
to verify that the monitoring and alert systems are working correctly.
"""

import pytest
import numpy as np
from typing import Dict, Any, List
import warnings
from datetime import datetime

# Import our statistical verification components
from .test_monte_carlo_deterministic import (
    StatisticalTestSuite,
    StatisticalBaseline,
    statistical_test_environment,
    create_test_correlation_matrix
)

warnings.filterwarnings("ignore", category=RuntimeWarning)

pytestmark = pytest.mark.statistical

class TestIntentionalDriftInjection:
    """Test suite for intentional drift injection to validate alert systems"""
    
    @pytest.fixture(scope="class")
    def drift_test_suite(self):
        """Create test suite configured for drift detection testing"""
        # Use more sensitive thresholds for drift detection
        sensitive_baseline = StatisticalBaseline(
            mc_sample_size=5000,  # Smaller for faster testing
            ks_p_value_threshold=0.10,  # More lenient to avoid false positives
            ks_critical_divergence=0.05,  # Stricter critical divergence
            min_eigenvalue_threshold=1e-6,  # More sensitive
            correlation_drift_threshold=0.05,  # More sensitive to drift
            ci_width_regression_threshold=0.03  # More sensitive to regression
        )
        return StatisticalTestSuite(sensitive_baseline)
    
    def test_inject_ks_critical_divergence(self, drift_test_suite):
        """Test: Inject extreme KS divergence to trigger critical alerts"""
        
        print("\n🔍 Testing KS critical divergence injection...")
        
        with statistical_test_environment(seed=42):
            # Generate samples from completely different distribution
            # Use bimodal distribution vs normal - should trigger critical divergence
            component1 = np.random.normal(-2, 0.5, 2500)
            component2 = np.random.normal(2, 0.5, 2500)
            bimodal_samples = np.concatenate([component1, component2])
            
            def normal_cdf(x):
                from scipy import stats
                return stats.norm.cdf(x, 0, 1)
            
            result = drift_test_suite.ks_runner.compare_distributions(
                bimodal_samples, normal_cdf, "intentional_critical_divergence"
            )
            
            # This should definitely fail and trigger critical divergence
            assert not result.passed, "Intentional critical divergence should fail test"
            assert result.additional_metrics.get('critical_divergence_detected'), \
                "Critical divergence flag should be triggered"
            assert result.metric_value > drift_test_suite.baseline.ks_critical_divergence, \
                f"KS statistic {result.metric_value:.6f} should exceed critical threshold {drift_test_suite.baseline.ks_critical_divergence}"
            
            print(f"   ✅ Critical divergence detected: D={result.metric_value:.6f}")
            print(f"   ✅ p-value: {result.p_value:.2e}")
    
    def test_inject_correlation_matrix_drift(self, drift_test_suite):
        """Test: Inject significant correlation matrix drift"""
        
        print("\n🔍 Testing correlation matrix drift injection...")
        
        # Create stable baseline matrix
        baseline_matrix = create_test_correlation_matrix(6, condition_number=5.0)
        
        # Inject significant structural changes
        drift_matrix = baseline_matrix.copy()
        
        # Inject strong correlations where there were weak ones
        drift_matrix[0, 1] = 0.95  # Strong positive correlation
        drift_matrix[1, 0] = 0.95
        
        drift_matrix[2, 3] = -0.85  # Strong negative correlation  
        drift_matrix[3, 2] = -0.85
        
        # Add block structure (creates different correlation pattern)
        drift_matrix[4, 5] = 0.9
        drift_matrix[5, 4] = 0.9
        drift_matrix[0, 4] = 0.8
        drift_matrix[4, 0] = 0.8
        
        # Ensure matrix remains valid
        eigenvals = np.linalg.eigvals(drift_matrix)
        if np.min(eigenvals) < 1e-10:
            drift_matrix = drift_matrix + np.eye(6) * 1e-8  # Add small ridge
        
        result = drift_test_suite.drift_monitor.detect_drift(
            drift_matrix, baseline_matrix
        )
        
        # Should detect significant drift
        assert not result.passed, "Intentional correlation drift should be detected"
        assert result.metric_value > drift_test_suite.baseline.correlation_drift_threshold, \
            f"Drift metric {result.metric_value:.6f} should exceed threshold {drift_test_suite.baseline.correlation_drift_threshold}"
        
        print(f"   ✅ Correlation drift detected: metric={result.metric_value:.6f}")
        print(f"   ✅ Threshold: {drift_test_suite.baseline.correlation_drift_threshold:.6f}")
    
    def test_inject_eigenvalue_degradation(self, drift_test_suite):
        """Test: Inject eigenvalue degradation to trigger PSD alerts"""
        
        print("\n🔍 Testing eigenvalue degradation injection...")
        
        # Create matrix with very small eigenvalue (near singular)
        n = 5
        eigenvalues = np.array([1.0, 0.8, 0.5, 0.1, 1e-9])  # One very small eigenvalue
        
        # Generate orthogonal matrix
        Q = np.linalg.qr(np.random.RandomState(42).randn(n, n))[0]
        
        # Construct correlation matrix with problematic eigenvalues
        degraded_matrix = Q @ np.diag(eigenvalues) @ Q.T
        degraded_matrix = (degraded_matrix + degraded_matrix.T) / 2
        np.fill_diagonal(degraded_matrix, 1.0)
        
        result = drift_test_suite.drift_monitor.validate_correlation_matrix(
            degraded_matrix, "intentional_eigenvalue_degradation"
        )
        
        # Should fail eigenvalue validation
        assert not result.passed or not result.additional_metrics['eigenvalue_valid'], \
            "Intentional eigenvalue degradation should be detected"
        assert result.additional_metrics['min_eigenvalue'] < drift_test_suite.baseline.min_eigenvalue_threshold, \
            f"Min eigenvalue {result.additional_metrics['min_eigenvalue']:.2e} should be below threshold {drift_test_suite.baseline.min_eigenvalue_threshold:.2e}"
        
        print(f"   ✅ Eigenvalue degradation detected: min_eig={result.additional_metrics['min_eigenvalue']:.2e}")
        print(f"   ✅ Condition number: {result.additional_metrics['condition_number']:.2e}")
    
    def test_inject_ci_width_explosion(self, drift_test_suite):
        """Test: Inject CI width explosion to trigger regression alerts"""
        
        print("\n🔍 Testing CI width explosion injection...")
        
        with statistical_test_environment(seed=42):
            # Establish baseline with tight distribution
            baseline_samples = np.random.normal(0.5, 0.02, 5000)  # Very tight
            baseline_width = drift_test_suite.ci_guard.establish_baseline_ci_width(
                "intentional_ci_explosion", baseline_samples
            )
            
            # Create samples with exploded variance (uniform distribution)
            exploded_samples = np.random.uniform(0, 1, 5000)  # Maximum spread
            
            result = drift_test_suite.ci_guard.check_ci_width_regression(
                "intentional_ci_explosion", exploded_samples
            )
            
            # Should trigger massive regression
            assert not result.passed, "Intentional CI width explosion should be detected"
            assert result.additional_metrics['regression_detected'], \
                "Regression flag should be triggered"
            assert result.metric_value > 2.0, \
                f"Relative change {result.metric_value:.2f} should be very large"
            
            print(f"   ✅ CI width explosion detected: relative_change={result.metric_value:.2f}")
            print(f"   ✅ Baseline width: {baseline_width:.6f}")
            print(f"   ✅ Current width: {result.additional_metrics['current_ci_width']:.6f}")
    
    def test_inject_monte_carlo_convergence_failure(self, drift_test_suite):
        """Test: Inject MC convergence failure by using biased generator"""
        
        print("\n🔍 Testing Monte Carlo convergence failure injection...")
        
        with statistical_test_environment(seed=42):
            # Create biased "random" samples that don't converge properly
            # Use systematic bias that gets worse with more samples
            n_samples = drift_test_suite.baseline.mc_sample_size
            
            # Generate samples with increasing bias (simulates bad RNG or systematic error)
            base_samples = np.random.normal(0, 1, n_samples)
            bias_pattern = np.linspace(0, 0.5, n_samples)  # Increasing bias
            biased_samples = base_samples + bias_pattern
            
            def normal_cdf(x):
                from scipy import stats
                return stats.norm.cdf(x, 0, 1)  # True standard normal
            
            result = drift_test_suite.ks_runner.compare_distributions(
                biased_samples, normal_cdf, "intentional_convergence_failure"
            )
            
            # Should detect the systematic bias
            assert not result.passed, "Intentional convergence failure should be detected"
            assert result.p_value < 0.001, \
                f"p-value {result.p_value:.2e} should be very low for systematic bias"
            
            print(f"   ✅ Convergence failure detected: p={result.p_value:.2e}")
            print(f"   ✅ Sample mean bias: {np.mean(biased_samples):.6f}")
    
    def test_inject_multiple_simultaneous_drifts(self, drift_test_suite):
        """Test: Inject multiple types of drift simultaneously"""
        
        print("\n🔍 Testing multiple simultaneous drift injection...")
        
        # Run a complete suite with all injected problems
        with statistical_test_environment(seed=42):
            
            # Inject KS divergence
            bimodal_samples = np.concatenate([
                np.random.normal(-1.5, 0.3, 2500),
                np.random.normal(1.5, 0.3, 2500)
            ])
            
            def normal_cdf(x):
                from scipy import stats
                return stats.norm.cdf(x, 0, 1)
            
            ks_result = drift_test_suite.ks_runner.compare_distributions(
                bimodal_samples, normal_cdf, "multi_drift_ks"
            )
            
            # Inject correlation drift
            baseline_corr = create_test_correlation_matrix(4, condition_number=3.0)
            drift_corr = baseline_corr + np.random.normal(0, 0.2, baseline_corr.shape)
            drift_corr = (drift_corr + drift_corr.T) / 2
            np.fill_diagonal(drift_corr, 1.0)
            
            corr_result = drift_test_suite.drift_monitor.detect_drift(
                drift_corr, baseline_corr
            )
            
            # Inject CI regression
            tight_samples = np.random.normal(0.5, 0.01, 3000)
            drift_test_suite.ci_guard.establish_baseline_ci_width("multi_drift_ci", tight_samples)
            
            wide_samples = np.random.uniform(0, 1, 3000)
            ci_result = drift_test_suite.ci_guard.check_ci_width_regression(
                "multi_drift_ci", wide_samples
            )
            
            # All should fail
            failures = [
                (ks_result.passed, "KS test"),
                (corr_result.passed, "Correlation drift"),
                (ci_result.passed, "CI regression")
            ]
            
            failed_count = sum(1 for passed, _ in failures if not passed)
            
            assert failed_count >= 2, \
                f"At least 2 drift types should be detected, got {failed_count}"
            
            print(f"   ✅ Multiple drifts detected: {failed_count}/3 tests failed as expected")
            
            for passed, test_name in failures:
                status = "✅ Failed (as expected)" if not passed else "❌ Passed (unexpected)"
                print(f"     {test_name}: {status}")


class TestAlertSystemValidation:
    """Validate the alert triggering and escalation systems"""
    
    def test_consecutive_failure_alert_trigger(self):
        """Test alert triggering on consecutive failures"""
        
        print("\n🔍 Testing consecutive failure alert mechanism...")
        
        # Create suite with low failure threshold
        alert_baseline = StatisticalBaseline(
            max_consecutive_failures=2,  # Low threshold for testing
            ks_p_value_threshold=0.99,   # Nearly impossible to pass
            ci_width_regression_threshold=0.001  # Nearly impossible to pass
        )
        
        suite = StatisticalTestSuite(alert_baseline)
        
        # Run tests that will consistently fail
        with statistical_test_environment(seed=42):
            for i in range(3):  # More than max_consecutive_failures
                # Generate samples guaranteed to fail KS test
                uniform_samples = np.random.uniform(-2, 2, 1000)
                
                def normal_cdf(x):
                    from scipy import stats
                    return stats.norm.cdf(x, 0, 1)
                
                result = suite.ks_runner.compare_distributions(
                    uniform_samples, normal_cdf, f"consecutive_failure_{i}"
                )
                
                assert not result.passed, f"Test {i} should fail"
        
        # Check alert conditions
        summary = suite._generate_suite_summary()
        alert_triggers = summary.get('alert_triggers', [])
        
        # Should have consecutive failure alert
        consecutive_alerts = [alert for alert in alert_triggers if 'consecutive_failures' in alert]
        assert len(consecutive_alerts) > 0, "Should trigger consecutive failure alert"
        
        print(f"   ✅ Consecutive failure alert triggered: {consecutive_alerts}")
    
    def test_critical_divergence_alert_trigger(self):
        """Test critical statistical divergence alert triggering"""
        
        print("\n🔍 Testing critical divergence alert mechanism...")
        
        suite = StatisticalTestSuite()
        
        with statistical_test_environment(seed=42):
            # Create extremely divergent samples
            extreme_samples = np.random.exponential(10, 5000)  # Very different from normal
            
            def normal_cdf(x):
                from scipy import stats
                return stats.norm.cdf(x, 0, 1)
            
            result = suite.ks_runner.compare_distributions(
                extreme_samples, normal_cdf, "critical_divergence_alert_test"
            )
            
            assert not result.passed, "Critical divergence test should fail"
            assert result.additional_metrics.get('critical_divergence_detected'), \
                "Critical divergence should be flagged"
        
        # Check alert conditions
        summary = suite._generate_suite_summary()
        alert_triggers = summary.get('alert_triggers', [])
        
        # Should have critical divergence alert
        divergence_alerts = [alert for alert in alert_triggers if 'critical_divergence' in alert]
        assert len(divergence_alerts) > 0, "Should trigger critical divergence alert"
        
        print(f"   ✅ Critical divergence alert triggered: {divergence_alerts}")
    
    def test_regression_alert_trigger(self):
        """Test regression detection alert triggering"""
        
        print("\n🔍 Testing regression alert mechanism...")
        
        suite = StatisticalTestSuite()
        
        with statistical_test_environment(seed=42):
            # Establish baseline
            baseline_samples = np.random.beta(2, 2, 3000)  # Centered distribution
            suite.ci_guard.establish_baseline_ci_width("regression_alert_test", baseline_samples)
            
            # Create heavily regressed samples
            regressed_samples = np.random.uniform(0, 1, 3000)  # Maximum spread
            
            result = suite.ci_guard.check_ci_width_regression(
                "regression_alert_test", regressed_samples
            )
            
            assert not result.passed, "Regression test should fail"
            assert result.additional_metrics.get('regression_detected'), \
                "Regression should be flagged"
        
        # Check alert conditions
        summary = suite._generate_suite_summary()
        alert_triggers = summary.get('alert_triggers', [])
        
        # Should have regression alert
        regression_alerts = [alert for alert in alert_triggers if 'regression_detected' in alert]
        assert len(regression_alerts) > 0, "Should trigger regression alert"
        
        print(f"   ✅ Regression alert triggered: {regression_alerts}")


@pytest.mark.ci_critical
def test_comprehensive_drift_injection_suite():
    """Comprehensive test to validate entire drift detection and alert system"""
    
    print("\n🚀 Running comprehensive drift injection validation...")
    
    # Create suite with realistic but sensitive thresholds
    validation_baseline = StatisticalBaseline(
        mc_sample_size=5000,
        ks_p_value_threshold=0.05,
        ks_critical_divergence=0.1,
        correlation_drift_threshold=0.1,
        ci_width_regression_threshold=0.05,
        max_consecutive_failures=2
    )
    
    suite = StatisticalTestSuite(validation_baseline)
    
    # Inject various types of drift
    with statistical_test_environment(seed=42):
        
        # 1. Inject KS divergence
        bimodal_samples = np.concatenate([
            np.random.normal(-2, 0.5, 2500),
            np.random.normal(2, 0.5, 2500)
        ])
        
        def normal_cdf(x):
            from scipy import stats
            return stats.norm.cdf(x, 0, 1)
        
        ks_result = suite.ks_runner.compare_distributions(
            bimodal_samples, normal_cdf, "comprehensive_ks_drift"
        )
        
        # 2. Inject correlation drift
        baseline_matrix = create_test_correlation_matrix(5, condition_number=5.0)
        drift_matrix = baseline_matrix.copy()
        drift_matrix[0, 1] = 0.9  # Inject strong correlation
        drift_matrix[1, 0] = 0.9
        
        corr_result = suite.drift_monitor.detect_drift(drift_matrix, baseline_matrix)
        
        # 3. Inject CI regression
        tight_baseline = np.random.normal(0.5, 0.05, 5000)
        suite.ci_guard.establish_baseline_ci_width("comprehensive_ci", tight_baseline)
        
        wide_current = np.random.uniform(0, 1, 5000)
        ci_result = suite.ci_guard.check_ci_width_regression("comprehensive_ci", wide_current)
    
    # Collect all results
    all_results = [ks_result, corr_result, ci_result]
    failed_results = [r for r in all_results if not r.passed]
    
    # Validate detection
    assert len(failed_results) >= 2, \
        f"Should detect at least 2 types of drift, detected {len(failed_results)}"
    
    # Generate summary and check alerts
    summary = suite._generate_suite_summary()
    
    assert not summary['success'], "Suite should fail when drift is detected"
    assert summary['build_should_fail'], "Build should be marked for failure"
    assert len(summary['alert_triggers']) > 0, "Should trigger alerts"
    
    print(f"   ✅ Comprehensive drift detection validated")
    print(f"   ✅ Detected {len(failed_results)}/3 injected drift types")
    print(f"   ✅ Triggered {len(summary['alert_triggers'])} alerts")
    print(f"   ✅ Build failure recommendation: {summary['build_should_fail']}")
    
    # Log detailed results for verification
    for i, result in enumerate(all_results):
        test_type = ["KS Test", "Correlation Drift", "CI Regression"][i]
        status = "DETECTED" if not result.passed else "MISSED"
        print(f"     {test_type}: {status}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])