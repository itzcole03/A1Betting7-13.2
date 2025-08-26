"""
Deterministic Monte Carlo Statistical Verification Suite

This module provides comprehensive statistical accuracy and stability verification
for the A1Betting7-13.2 platform, including:

1. Deterministic seed pipeline for reproducible Monte Carlo simulations
2. KS test auto-runner comparing MC vs analytic baselines
3. Correlation matrix PSD drift monitoring with eigenvalue watchdog
4. Probability confidence interval width regression guards
5. CI/CD integration with build failure mechanisms

Designed to run in CI environments with full reproducibility.
"""

import asyncio
import json
import logging
import numpy as np
import os
import pytest
import warnings
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any, Union
from dataclasses import dataclass, asdict
from contextlib import contextmanager

import pandas as pd
from scipy import stats
from scipy.linalg import LinAlgError
import scipy.sparse as sp

# Suppress numpy warnings for cleaner test output
warnings.filterwarnings("ignore", category=RuntimeWarning)

# Configure logging for statistical tests
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@dataclass
class StatisticalBaseline:
    """Statistical baseline configuration and expected values"""
    
    # Monte Carlo parameters
    mc_seed: int = 42
    mc_sample_size: int = 100000
    mc_convergence_tolerance: float = 1e-4
    
    # KS test parameters
    ks_p_value_threshold: float = 0.05
    ks_critical_divergence: float = 0.1
    
    # Correlation matrix parameters
    min_eigenvalue_threshold: float = 1e-8
    condition_number_threshold: float = 1e12
    correlation_drift_threshold: float = 0.15
    
    # Confidence interval parameters
    ci_width_regression_threshold: float = 0.05  # 5% max increase
    ci_confidence_level: float = 0.95
    
    # Alert parameters
    max_consecutive_failures: int = 3
    alert_cooldown_hours: int = 1


@dataclass
class StatisticalTestResult:
    """Result of a statistical test run"""
    
    test_name: str
    timestamp: datetime
    passed: bool
    metric_value: float
    threshold_value: float
    confidence_level: float
    p_value: Optional[float] = None
    effect_size: Optional[float] = None
    sample_size: Optional[int] = None
    seed_used: Optional[int] = None
    additional_metrics: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None


@dataclass
class DriftMonitorState:
    """State tracking for statistical drift monitoring"""
    
    last_baseline_update: datetime
    consecutive_failures: int = 0
    recent_results: List[StatisticalTestResult] = None
    correlation_matrix_history: List[np.ndarray] = None
    
    def __post_init__(self):
        if self.recent_results is None:
            self.recent_results = []
        if self.correlation_matrix_history is None:
            self.correlation_matrix_history = []


class DeterministicSeedPipeline:
    """
    Manages deterministic seed generation and validation for Monte Carlo simulations.
    Ensures reproducible results across CI runs while maintaining statistical validity.
    """
    
    def __init__(self, baseline: StatisticalBaseline):
        self.baseline = baseline
        self.rng_state = None
        self._seed_history = []
        
    def initialize_deterministic_state(self, master_seed: Optional[int] = None) -> int:
        """Initialize reproducible random state for all statistical tests"""
        seed = master_seed or self.baseline.mc_seed
        
        # Set seeds for all random number generators
        np.random.seed(seed)
        
        # Store initial state for reproducibility verification
        self.rng_state = np.random.get_state()
        self._seed_history.append({
            'seed': seed,
            'timestamp': datetime.utcnow(),
            'state_backup': self.rng_state
        })
        
        logger.info(f"Initialized deterministic seed pipeline with seed: {seed}")
        return seed
    
    def generate_simulation_seeds(self, n_simulations: int) -> List[int]:
        """Generate deterministic sequence of seeds for parallel simulations"""
        if self.rng_state is None:
            raise ValueError("Must call initialize_deterministic_state first")
            
        # Generate reproducible seed sequence
        seeds = []
        for i in range(n_simulations):
            # Use deterministic formula to ensure reproducibility
            seed = (self.baseline.mc_seed + i * 1009) % (2**31 - 1)  # Large prime for spacing
            seeds.append(seed)
            
        logger.debug(f"Generated {len(seeds)} deterministic simulation seeds")
        return seeds
    
    def validate_reproducibility(self, test_func, *args, **kwargs) -> bool:
        """Validate that test function produces identical results with same seed"""
        
        # First run
        seed1 = self.initialize_deterministic_state()
        result1 = test_func(*args, **kwargs)
        
        # Second run with same seed
        seed2 = self.initialize_deterministic_state(seed1)
        result2 = test_func(*args, **kwargs)
        
        # Compare results
        if isinstance(result1, (int, float)):
            reproducible = abs(result1 - result2) < 1e-10
        elif isinstance(result1, np.ndarray):
            reproducible = np.allclose(result1, result2, atol=1e-10)
        else:
            reproducible = result1 == result2
            
        if not reproducible:
            logger.error(f"Reproducibility validation failed: {result1} != {result2}")
            
        return reproducible


class KSTestAutoRunner:
    """
    Automatic Kolmogorov-Smirnov test runner comparing Monte Carlo simulations
    against analytic baselines with configurable alert thresholds.
    """
    
    def __init__(self, baseline: StatisticalBaseline):
        self.baseline = baseline
        self.test_results: List[StatisticalTestResult] = []
        
    def compare_distributions(
        self, 
        mc_samples: np.ndarray,
        analytic_cdf_func,
        test_name: str,
        critical_p_value: Optional[float] = None
    ) -> StatisticalTestResult:
        """
        Perform KS test comparing Monte Carlo samples to analytic distribution
        
        Args:
            mc_samples: Monte Carlo simulation samples
            analytic_cdf_func: Function that returns analytic CDF values
            test_name: Name identifier for this test
            critical_p_value: Override default p-value threshold
            
        Returns:
            StatisticalTestResult with detailed metrics
        """
        
        threshold = critical_p_value or self.baseline.ks_p_value_threshold
        
        try:
            # Generate analytic comparison points
            sorted_samples = np.sort(mc_samples)
            analytic_values = analytic_cdf_func(sorted_samples)
            
            # Perform KS test
            ks_statistic, p_value = stats.kstest(
                sorted_samples, 
                analytic_cdf_func
            )
            
            # Calculate effect size (KS D-statistic is already an effect size)
            effect_size = ks_statistic
            
            # Test passes if p-value > threshold (fail to reject null hypothesis)
            test_passed = p_value > threshold
            
            # Check for critical divergence
            critical_divergence = ks_statistic > self.baseline.ks_critical_divergence
            if critical_divergence:
                test_passed = False
                
            result = StatisticalTestResult(
                test_name=test_name,
                timestamp=datetime.utcnow(),
                passed=test_passed,
                metric_value=ks_statistic,
                threshold_value=threshold,
                confidence_level=1 - threshold,
                p_value=p_value,
                effect_size=effect_size,
                sample_size=len(mc_samples),
                additional_metrics={
                    'critical_divergence_detected': critical_divergence,
                    'analytic_points_generated': len(analytic_values),
                    'sample_mean': float(np.mean(mc_samples)),
                    'sample_std': float(np.std(mc_samples)),
                }
            )
            
            self.test_results.append(result)

            if not test_passed:
                logger.warning(
                    f"KS test FAILED for {test_name}: "
                    f"D={ks_statistic:.6f}, p={p_value:.6f}, "
                    f"critical_divergence={critical_divergence}"
                )
            else:
                logger.info(
                    f"KS test passed for {test_name}: "
                    f"D={ks_statistic:.6f}, p={p_value:.6f}"
                )
            return result

        except Exception as e:
            error_result = StatisticalTestResult(
                test_name=test_name,
                timestamp=datetime.utcnow(),
                passed=False,
                metric_value=float('inf'),
                threshold_value=threshold,
                confidence_level=1 - threshold,
                sample_size=len(mc_samples) if mc_samples is not None else 0,
                error_message=str(e)
            )
            
            self.test_results.append(error_result)
            logger.error(f"KS test error for {test_name}: {e}")
            
            return error_result

        finally:
            # If this runner is part of a larger suite, propagate the latest result
            try:
                if hasattr(self, 'parent_suite') and hasattr(self.parent_suite, 'all_results') and self.test_results:
                    latest = self.test_results[-1]
                    if latest not in self.parent_suite.all_results:
                        self.parent_suite.all_results.append(latest)
            except Exception:
                pass


class CorrelationPSDDriftMonitor:
    """
    Monitors correlation matrix positive semi-definiteness and eigenvalue drift.
    Detects statistical drift in correlation structures with minimum eigenvalue watchdog.
    """
    
    def __init__(self, baseline: StatisticalBaseline):
        self.baseline = baseline
        self.drift_state = DriftMonitorState(
            last_baseline_update=datetime.utcnow()
        )
        
    def validate_correlation_matrix(
        self, 
        correlation_matrix: np.ndarray,
        matrix_name: str = "correlation_matrix"
    ) -> StatisticalTestResult:
        """
        Validate correlation matrix positive semi-definiteness and eigenvalue properties
        
        Args:
            correlation_matrix: Correlation matrix to validate
            matrix_name: Identifier for this matrix
            
        Returns:
            StatisticalTestResult with eigenvalue and condition number metrics
        """
        
        try:
            # Basic validation
            if not isinstance(correlation_matrix, np.ndarray):
                correlation_matrix = np.array(correlation_matrix)
                
            if correlation_matrix.ndim != 2 or correlation_matrix.shape[0] != correlation_matrix.shape[1]:
                raise ValueError(f"Matrix must be square, got shape {correlation_matrix.shape}")
                
            # Check if matrix is symmetric
            if not np.allclose(correlation_matrix, correlation_matrix.T, atol=1e-10):
                logger.warning(f"Matrix {matrix_name} is not symmetric, forcing symmetry")
                correlation_matrix = (correlation_matrix + correlation_matrix.T) / 2
                
            # Compute eigenvalues using symmetric/Hermitian solver for stability
            eigenvalues = np.linalg.eigvalsh(correlation_matrix)
            eigenvalues = np.real(eigenvalues)
            min_eigenvalue = float(np.min(eigenvalues))
            max_eigenvalue = float(np.max(eigenvalues))
            condition_number = max_eigenvalue / max(min_eigenvalue, 1e-15)  # Avoid division by zero
            
            # Check PSD condition
            psd_valid = min_eigenvalue >= -1e-10  # Allow small numerical errors
            
            # Check eigenvalue threshold
            eigenvalue_valid = min_eigenvalue >= self.baseline.min_eigenvalue_threshold
            
            # Check condition number
            condition_valid = condition_number <= self.baseline.condition_number_threshold
            
            # Overall test result
            test_passed = psd_valid and eigenvalue_valid and condition_valid
            
            result = StatisticalTestResult(
                test_name=f"correlation_psd_validation_{matrix_name}",
                timestamp=datetime.utcnow(),
                passed=test_passed,
                metric_value=min_eigenvalue,
                threshold_value=self.baseline.min_eigenvalue_threshold,
                confidence_level=0.99,  # High confidence for numerical stability
                additional_metrics={
                    'min_eigenvalue': float(min_eigenvalue),
                    'max_eigenvalue': float(max_eigenvalue),
                    'condition_number': float(condition_number),
                    'matrix_rank': int(np.linalg.matrix_rank(correlation_matrix)),
                    'matrix_size': correlation_matrix.shape[0],
                    'psd_valid': psd_valid,
                    'eigenvalue_valid': eigenvalue_valid,
                    'condition_valid': condition_valid,
                    'eigenvalue_spectrum': eigenvalues.tolist()
                }
            )
            # Diagnostic logging to help diagnose eigenvalue-degradation test failures
            logger.info(
                "Correlation validation debug: %s min_eig=%s threshold=%s psd_valid=%s eigen_valid=%s cond=%s",
                matrix_name,
                min_eigenvalue,
                self.baseline.min_eigenvalue_threshold,
                psd_valid,
                eigenvalue_valid,
                condition_number,
            )

            # Store matrix for drift analysis
            try:
                self.drift_state.correlation_matrix_history.append(correlation_matrix.copy())
                if len(self.drift_state.correlation_matrix_history) > 100:  # Limit memory usage
                    self.drift_state.correlation_matrix_history.pop(0)
            except Exception:
                # If drift_state is in an unexpected shape, continue without failing tests
                pass

            if not test_passed:
                logger.warning(
                    f"Correlation matrix validation FAILED for {matrix_name}: "
                    f"min_eig={min_eigenvalue:.2e}, cond={condition_number:.2e}"
                )
            else:
                logger.info(
                    f"Correlation matrix validation passed for {matrix_name}: "
                    f"min_eig={min_eigenvalue:.2e}, cond={condition_number:.2e}"
                )

            return result

        except Exception as e:
            error_result = StatisticalTestResult(
                test_name=f"correlation_psd_validation_{matrix_name}",
                timestamp=datetime.utcnow(),
                passed=False,
                metric_value=float('inf'),
                threshold_value=self.baseline.min_eigenvalue_threshold,
                confidence_level=0.99,
                error_message=str(e)
            )

            logger.error(f"Correlation matrix validation error for {matrix_name}: {e}")
            return error_result

        finally:
            # propagate result to parent suite if present (ensure alerts pick it up)
            try:
                latest = None
                if 'result' in locals():
                    latest = locals().get('result')
                elif 'error_result' in locals():
                    latest = locals().get('error_result')

                if latest is not None and hasattr(self, 'parent_suite') and hasattr(self.parent_suite, 'all_results'):
                    if latest not in self.parent_suite.all_results:
                        self.parent_suite.all_results.append(latest)
            except Exception:
                pass
    
    def detect_drift(
        self, 
        current_matrix: np.ndarray,
        reference_matrix: Optional[np.ndarray] = None
    ) -> StatisticalTestResult:
        """
        Detect statistical drift in correlation matrix structure
        
        Args:
            current_matrix: Current correlation matrix
            reference_matrix: Reference matrix (uses last stored if None)
            
        Returns:
            StatisticalTestResult indicating drift detection status
        """
        
        try:
            if reference_matrix is None:
                if not self.drift_state.correlation_matrix_history:
                    # No reference available, treat as baseline
                    return StatisticalTestResult(
                        test_name="correlation_drift_detection",
                        timestamp=datetime.utcnow(),
                        passed=True,
                        metric_value=0.0,
                        threshold_value=self.baseline.correlation_drift_threshold,
                        confidence_level=0.95,
                        additional_metrics={'drift_reason': 'no_reference_baseline'}
                    )
                    
                reference_matrix = self.drift_state.correlation_matrix_history[-1]
                
            # Compute Frobenius norm of difference
            diff_matrix = current_matrix - reference_matrix
            frobenius_norm = np.linalg.norm(diff_matrix, 'fro')
            
            # Normalize by matrix size for meaningful threshold
            normalized_drift = frobenius_norm / np.sqrt(current_matrix.size)
            
            # Test for significant drift
            drift_detected = normalized_drift > self.baseline.correlation_drift_threshold
            
            result = StatisticalTestResult(
                test_name="correlation_drift_detection",
                timestamp=datetime.utcnow(),
                passed=not drift_detected,
                metric_value=normalized_drift,
                threshold_value=self.baseline.correlation_drift_threshold,
                confidence_level=0.95,
                additional_metrics={
                    'frobenius_norm': float(frobenius_norm),
                    'normalized_drift': float(normalized_drift),
                    'matrix_size': current_matrix.shape[0],
                    'drift_detected': drift_detected,
                    'reference_available': reference_matrix is not None
                }
            )
            
            if drift_detected:
                logger.warning(
                    f"Correlation drift DETECTED: "
                    f"normalized_drift={normalized_drift:.6f} > {self.baseline.correlation_drift_threshold}"
                )
            else:
                logger.info(
                    f"Correlation drift check passed: "
                    f"normalized_drift={normalized_drift:.6f}"
                )
                
            return result

        except Exception as e:
            error_result = StatisticalTestResult(
                test_name="correlation_drift_detection",
                timestamp=datetime.utcnow(),
                passed=False,
                metric_value=float('inf'),
                threshold_value=self.baseline.correlation_drift_threshold,
                confidence_level=0.95,
                error_message=str(e)
            )
            
            logger.error(f"Correlation drift detection error: {e}")
            return error_result

        finally:
            # Propagate to parent suite if present
            try:
                if hasattr(self, 'parent_suite') and hasattr(self.parent_suite, 'all_results') and self.drift_state is not None:
                    latest = self.parent_suite.all_results and self.parent_suite.all_results[-1] if self.parent_suite.all_results else None
                    if 'result' in locals() and result not in self.parent_suite.all_results:
                        self.parent_suite.all_results.append(result)
            except Exception:
                pass


class ProbabilityCIWidthGuard:
    """
    Regression guard for probability confidence interval width.
    Fails builds if CI width increases beyond baseline thresholds.
    """
    
    def __init__(self, baseline: StatisticalBaseline):
        self.baseline = baseline
        self._baseline_ci_widths: Dict[str, float] = {}
        self._ci_width_history: Dict[str, List[float]] = {}
        
    def establish_baseline_ci_width(
        self, 
        test_name: str,
        probability_samples: np.ndarray,
        confidence_level: Optional[float] = None
    ) -> float:
        """
        Establish baseline confidence interval width for a test
        
        Args:
            test_name: Identifier for this test
            probability_samples: Array of probability values
            confidence_level: Override default confidence level
            
        Returns:
            Baseline CI width
        """
        
        conf_level = confidence_level or self.baseline.ci_confidence_level
        alpha = 1 - conf_level
        
        # Calculate confidence interval using percentiles
        lower_percentile = (alpha / 2) * 100
        upper_percentile = (1 - alpha / 2) * 100
        
        ci_lower = np.percentile(probability_samples, lower_percentile)
        ci_upper = np.percentile(probability_samples, upper_percentile)
        ci_width = ci_upper - ci_lower
        
        # Store baseline
        self._baseline_ci_widths[test_name] = ci_width
        
        # Initialize history
        if test_name not in self._ci_width_history:
            self._ci_width_history[test_name] = []
        self._ci_width_history[test_name].append(ci_width)
        
        logger.info(
            f"Established baseline CI width for {test_name}: "
            f"{ci_width:.6f} at {conf_level*100}% confidence"
        )
        
        return ci_width
    
    def check_ci_width_regression(
        self,
        test_name: str,
        current_probability_samples: np.ndarray,
        confidence_level: Optional[float] = None
    ) -> StatisticalTestResult:
        """
        Check if current CI width represents a regression from baseline
        
        Args:
            test_name: Test identifier
            current_probability_samples: Current probability samples
            confidence_level: Override default confidence level
            
        Returns:
            StatisticalTestResult indicating regression status
        """
        
        try:
            conf_level = confidence_level or self.baseline.ci_confidence_level
            alpha = 1 - conf_level
            
            # Calculate current CI width
            lower_percentile = (alpha / 2) * 100
            upper_percentile = (1 - alpha / 2) * 100
            
            ci_lower = np.percentile(current_probability_samples, lower_percentile)
            ci_upper = np.percentile(current_probability_samples, upper_percentile)
            current_ci_width = ci_upper - ci_lower
            
            # Get baseline for comparison
            if test_name not in self._baseline_ci_widths:
                # No baseline exists, establish current as baseline
                baseline_width = self.establish_baseline_ci_width(
                    test_name, current_probability_samples, confidence_level
                )
                relative_change = 0.0
                regression_detected = False
            else:
                baseline_width = self._baseline_ci_widths[test_name]
                relative_change = (current_ci_width - baseline_width) / baseline_width
                regression_detected = relative_change > self.baseline.ci_width_regression_threshold
                
            # Update history
            if test_name not in self._ci_width_history:
                self._ci_width_history[test_name] = []
            self._ci_width_history[test_name].append(current_ci_width)
            
            # Limit history size
            if len(self._ci_width_history[test_name]) > 50:
                self._ci_width_history[test_name].pop(0)
                
            result = StatisticalTestResult(
                test_name=f"ci_width_regression_{test_name}",
                timestamp=datetime.utcnow(),
                passed=not regression_detected,
                metric_value=relative_change,
                threshold_value=self.baseline.ci_width_regression_threshold,
                confidence_level=conf_level,
                additional_metrics={
                    'current_ci_width': float(current_ci_width),
                    'baseline_ci_width': float(baseline_width),
                    'relative_change': float(relative_change),
                    'absolute_change': float(current_ci_width - baseline_width),
                    'ci_lower': float(ci_lower),
                    'ci_upper': float(ci_upper),
                    'sample_size': len(current_probability_samples),
                    'sample_mean': float(np.mean(current_probability_samples)),
                    'sample_std': float(np.std(current_probability_samples)),
                    'regression_detected': regression_detected
                }
            )
            
            if regression_detected:
                logger.error(
                    f"CI width REGRESSION detected for {test_name}: "
                    f"relative_change={relative_change:.4f} > {self.baseline.ci_width_regression_threshold}"
                )
            else:
                logger.info(
                    f"CI width check passed for {test_name}: "
                    f"relative_change={relative_change:.4f}"
                )
            # Propagate to parent suite if available so alerts pick it up
            try:
                if hasattr(self, 'parent_suite') and hasattr(self.parent_suite, 'all_results'):
                    if result not in self.parent_suite.all_results:
                        self.parent_suite.all_results.append(result)
            except Exception:
                pass

            return result
            
        except Exception as e:
            error_result = StatisticalTestResult(
                test_name=f"ci_width_regression_{test_name}",
                timestamp=datetime.utcnow(),
                passed=False,
                metric_value=float('inf'),
                threshold_value=self.baseline.ci_width_regression_threshold,
                confidence_level=conf_level,
                error_message=str(e)
            )
            
            logger.error(f"CI width regression check error for {test_name}: {e}")
            return error_result


class StatisticalTestSuite:
    """
    Comprehensive statistical test suite coordinating all verification components.
    Designed for CI/CD integration with build failure mechanisms.
    """
    
    def __init__(self, baseline: Optional[StatisticalBaseline] = None):
        self.baseline = baseline or StatisticalBaseline()
        
        # Initialize components
        self.seed_pipeline = DeterministicSeedPipeline(self.baseline)
        self.ks_runner = KSTestAutoRunner(self.baseline)
        self.drift_monitor = CorrelationPSDDriftMonitor(self.baseline)
        self.ci_guard = ProbabilityCIWidthGuard(self.baseline)

        # Link components back to this suite so component-level calls
        # (used directly by tests) also populate the suite's all_results.
        try:
            self.ks_runner.parent_suite = self
        except Exception:
            pass
        try:
            self.drift_monitor.parent_suite = self
        except Exception:
            pass
        try:
            self.ci_guard.parent_suite = self
        except Exception:
            pass
        
        # Test results storage
        self.all_results: List[StatisticalTestResult] = []
        self.suite_start_time: Optional[datetime] = None
        self.suite_end_time: Optional[datetime] = None
        
    def run_full_suite(self, test_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Run complete statistical verification suite
        
        Args:
            test_data: Optional test data dictionary
            
        Returns:
            Comprehensive test results summary
        """
        
        self.suite_start_time = datetime.utcnow()
        logger.info("Starting comprehensive statistical verification suite")
        
        try:
            # Initialize deterministic environment
            master_seed = self.seed_pipeline.initialize_deterministic_state()
            
            # Run all test categories
            self._run_monte_carlo_tests()
            self._run_ks_comparison_tests()
            self._run_correlation_matrix_tests()
            self._run_ci_width_regression_tests()
            
            # Generate summary
            summary = self._generate_suite_summary()
            
            self.suite_end_time = datetime.utcnow()
            
            logger.info(
                f"Statistical verification suite completed in "
                f"{(self.suite_end_time - self.suite_start_time).total_seconds():.2f}s"
            )
            
            return summary
            
        except Exception as e:
            logger.error(f"Statistical test suite failed: {e}")
            self.suite_end_time = datetime.utcnow()
            
            return {
                'success': False,
                'error': str(e),
                'duration_seconds': (self.suite_end_time - self.suite_start_time).total_seconds()
            }
    
    def _run_monte_carlo_tests(self):
        """Run deterministic Monte Carlo simulation tests"""
        
        logger.info("Running Monte Carlo deterministic tests...")
        
        # Test 1: Basic normal distribution MC vs analytic
        mc_samples = np.random.normal(0, 1, self.baseline.mc_sample_size)
        
        def normal_cdf(x):
            return stats.norm.cdf(x, 0, 1)
            
        ks_result = self.ks_runner.compare_distributions(
            mc_samples, normal_cdf, "normal_distribution_mc_vs_analytic"
        )
        self.all_results.append(ks_result)
        
        # Test 2: Exponential distribution
        mc_exp_samples = np.random.exponential(1.0, self.baseline.mc_sample_size)
        
        def exp_cdf(x):
            return stats.expon.cdf(x, scale=1.0)
            
        exp_ks_result = self.ks_runner.compare_distributions(
            mc_exp_samples, exp_cdf, "exponential_distribution_mc_vs_analytic"
        )
        self.all_results.append(exp_ks_result)
        
        # Test 3: Beta distribution (commonly used in betting probabilities)
        mc_beta_samples = np.random.beta(2, 5, self.baseline.mc_sample_size)
        
        def beta_cdf(x):
            return stats.beta.cdf(x, 2, 5)
            
        beta_ks_result = self.ks_runner.compare_distributions(
            mc_beta_samples, beta_cdf, "beta_distribution_mc_vs_analytic"
        )
        self.all_results.append(beta_ks_result)
        
        logger.info(f"Completed {3} Monte Carlo deterministic tests")
    
    def _run_ks_comparison_tests(self):
        """Run additional KS test comparisons for betting-specific distributions"""
        
        logger.info("Running KS comparison tests...")
        
        # Test betting probability distribution patterns
        # Simulate realistic betting probability ranges using rejection sampling
        # to produce a true truncated beta distribution (avoid clipping artifacts)
        def sample_truncated_beta(a, b, size, low=0.1, high=0.9):
            samples = np.empty(size, dtype=float)
            filled = 0
            # Oversample in batches until we have enough accepted samples
            while filled < size:
                batch = np.random.beta(a, b, (size - filled) * 2)
                mask = (batch >= low) & (batch <= high)
                accepted = batch[mask]
                take = min(accepted.size, size - filled)
                if take > 0:
                    samples[filled:filled+take] = accepted[:take]
                    filled += take
            return samples

        betting_probs = sample_truncated_beta(1.2, 1.8, self.baseline.mc_sample_size, low=0.1, high=0.9)
        
        def betting_beta_cdf(x):
            # Truncated beta distribution
            if np.any((x < 0.1) | (x > 0.9)):
                x = np.clip(x, 0.1, 0.9)
            return (stats.beta.cdf(x, 1.2, 1.8) - stats.beta.cdf(0.1, 1.2, 1.8)) / \
                   (stats.beta.cdf(0.9, 1.2, 1.8) - stats.beta.cdf(0.1, 1.2, 1.8))
        
        # Run KS comparison using the runner (runner will propagate into suite)
        self.ks_runner.compare_distributions(
            betting_probs, betting_beta_cdf, "betting_probability_distribution"
        )
        
        logger.info("Completed KS comparison tests")
    
    def _run_correlation_matrix_tests(self):
        """Run correlation matrix PSD and drift tests"""
        
        logger.info("Running correlation matrix tests...")
        
        # Generate test correlation matrices
        n_assets = 10
        
        # Test 1: Valid PSD correlation matrix (use the helper to guarantee conditioning)
        valid_corr_matrix = create_test_correlation_matrix(n_assets, condition_number=10.0)
        # Validation will propagate result into the suite
        self.drift_monitor.validate_correlation_matrix(
            valid_corr_matrix, "valid_test_matrix"
        )
        
        # Test 2: Slightly modified matrix for drift detection
        drift_matrix = valid_corr_matrix + np.random.normal(0, 0.01, valid_corr_matrix.shape)
        drift_matrix = (drift_matrix + drift_matrix.T) / 2  # Ensure symmetry
        np.fill_diagonal(drift_matrix, 1.0)  # Ensure unit diagonal

        # Drift detection will propagate its result into the suite
        self.drift_monitor.detect_drift(drift_matrix, valid_corr_matrix)
        
        # Test 3: Validate the drift matrix itself
        # PSD validation for the drift matrix (propagates into suite)
        self.drift_monitor.validate_correlation_matrix(
            drift_matrix, "drift_test_matrix"
        )
        
        logger.info("Completed correlation matrix tests")
    
    def _run_ci_width_regression_tests(self):
        """Run confidence interval width regression tests"""
        
        logger.info("Running CI width regression tests...")
        
        # Generate baseline probability samples
        baseline_probs = np.random.beta(2, 3, self.baseline.mc_sample_size)
        # Test 1: Similar distribution (should pass)
        similar_probs = np.random.beta(2.1, 2.9, self.baseline.mc_sample_size)
        # Baseline establishment and checks will propagate results into the suite
        self.ci_guard.establish_baseline_ci_width(
            "betting_probabilities", baseline_probs
        )

        self.ci_guard.check_ci_width_regression("betting_probabilities", similar_probs)
        
        # Test 2: More dispersed distribution (should potentially fail)
        dispersed_probs = np.random.beta(1, 1, self.baseline.mc_sample_size)  # More uniform
        self.ci_guard.check_ci_width_regression("dispersed_probabilities", dispersed_probs)
        
        logger.info("Completed CI width regression tests")
    
    def _generate_suite_summary(self) -> Dict[str, Any]:
        """Generate comprehensive summary of all test results"""
        
        total_tests = len(self.all_results)
        passed_tests = sum(1 for result in self.all_results if result.passed)
        failed_tests = total_tests - passed_tests
        
        # Categorize results
        categories = {
            'monte_carlo': [],
            'ks_tests': [],
            'correlation': [],
            'ci_regression': [],
            'errors': []
        }
        
        for result in self.all_results:
            if result.error_message:
                categories['errors'].append(result)
            elif 'mc_vs_analytic' in result.test_name or 'distribution' in result.test_name:
                categories['ks_tests'].append(result)
            elif 'correlation' in result.test_name:
                categories['correlation'].append(result)
            elif 'ci_width' in result.test_name:
                categories['ci_regression'].append(result)
            else:
                categories['monte_carlo'].append(result)
        
        # Calculate summary statistics
        summary = {
            'success': failed_tests == 0,
            'timestamp': datetime.utcnow().isoformat(),
            'total_tests': total_tests,
            'passed_tests': passed_tests,
            'failed_tests': failed_tests,
            'pass_rate': passed_tests / max(total_tests, 1),
            'duration_seconds': (
                (self.suite_end_time - self.suite_start_time).total_seconds()
                if self.suite_end_time and self.suite_start_time
                else 0.0
            ),
            'seed_used': self.baseline.mc_seed,
            'categories': {
                cat: {
                    'total': len(results),
                    'passed': sum(1 for r in results if r.passed),
                    'failed': sum(1 for r in results if not r.passed)
                }
                for cat, results in categories.items()
            },
            'failed_tests_details': [
                {
                    'name': result.test_name,
                    'metric_value': result.metric_value,
                    'threshold': result.threshold_value,
                    'error': result.error_message
                }
                for result in self.all_results if not result.passed
            ],
            'build_should_fail': failed_tests > 0,
            'alert_triggers': self._check_alert_conditions()
        }
        
        return summary
    
    def _check_alert_conditions(self) -> List[str]:
        """Check for conditions that should trigger alerts"""
        
        alerts = []

        # Aggregate results from all components to ensure we don't miss
        # failures when component methods are called directly by tests.
        combined_results: List[StatisticalTestResult] = []
        combined_results.extend(self.all_results or [])
        try:
            combined_results.extend(getattr(self.ks_runner, 'test_results', []) or [])
        except Exception:
            pass
        try:
            combined_results.extend(getattr(self.drift_monitor.drift_state, 'recent_results', []) or [])
        except Exception:
            pass

        # Also deduplicate while preserving order
        seen = set()
        dedup_results: List[StatisticalTestResult] = []
        for r in combined_results:
            key = (r.test_name, getattr(r, 'timestamp', None))
            if key not in seen:
                seen.add(key)
                dedup_results.append(r)

        # Check for consecutive failures using the last 10 combined results
        recent_results = dedup_results[-10:]
        consecutive_failures = 0
        for result in reversed(recent_results):
            if not result.passed:
                consecutive_failures += 1
            else:
                break

        if consecutive_failures >= self.baseline.max_consecutive_failures:
            alerts.append(f"consecutive_failures_{consecutive_failures}")

        # Check for critical statistical divergences and regressions
        for result in dedup_results:
            if result.additional_metrics:
                if result.additional_metrics.get('critical_divergence_detected'):
                    alerts.append(f"critical_divergence_{result.test_name}")
                if result.additional_metrics.get('regression_detected'):
                    alerts.append(f"regression_detected_{result.test_name}")

        return alerts
    
    def save_results(self, output_path: Optional[str] = None) -> str:
        """Save test results to JSON file"""
        
        if output_path is None:
            output_path = f"statistical_test_results_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"
        
        # Convert results to serializable format
        results_data = {
            'suite_summary': self._generate_suite_summary(),
            'detailed_results': [
                {
                    'test_name': result.test_name,
                    'timestamp': result.timestamp.isoformat(),
                    'passed': result.passed,
                    'metric_value': result.metric_value,
                    'threshold_value': result.threshold_value,
                    'confidence_level': result.confidence_level,
                    'p_value': result.p_value,
                    'effect_size': result.effect_size,
                    'sample_size': result.sample_size,
                    'seed_used': result.seed_used,
                    'additional_metrics': result.additional_metrics,
                    'error_message': result.error_message
                }
                for result in self.all_results
            ]
        }
        
        with open(output_path, 'w') as f:
            json.dump(results_data, f, indent=2, default=str)
        
        logger.info(f"Statistical test results saved to: {output_path}")
        return output_path


# Test helper functions for integration with existing test infrastructure
def create_test_correlation_matrix(size: int, condition_number: float = 10.0) -> np.ndarray:
    """Create test correlation matrix with specified condition number"""
    
    # Generate eigenvalues with desired condition number
    max_eigenvalue = 1.0
    min_eigenvalue = max_eigenvalue / condition_number
    eigenvalues = np.logspace(
        np.log10(min_eigenvalue), 
        np.log10(max_eigenvalue), 
        size
    )
    
    # Generate random orthogonal matrix
    Q = np.linalg.qr(np.random.randn(size, size))[0]
    
    # Construct correlation matrix
    correlation_matrix = Q @ np.diag(eigenvalues) @ Q.T
    
    # Ensure it's a proper correlation matrix
    correlation_matrix = (correlation_matrix + correlation_matrix.T) / 2
    np.fill_diagonal(correlation_matrix, 1.0)
    
    return correlation_matrix


@contextmanager
def statistical_test_environment(seed: int = 42):
    """Context manager for deterministic statistical testing environment"""
    
    # Save current state
    old_np_state = np.random.get_state()
    
    try:
        # Set deterministic state
        np.random.seed(seed)
        yield seed
        
    finally:
        # Restore state
        np.random.set_state(old_np_state)


# Integration with pytest for CI/CD
@pytest.fixture
def statistical_suite():
    """Pytest fixture providing configured statistical test suite"""
    return StatisticalTestSuite()


@pytest.fixture
def test_baseline():
    """Pytest fixture providing test baseline configuration"""
    return StatisticalBaseline(
        mc_sample_size=10000,  # Smaller for faster tests
        ks_p_value_threshold=0.01,  # Stricter for CI
        ci_width_regression_threshold=0.1  # Allow more variation in CI
    )