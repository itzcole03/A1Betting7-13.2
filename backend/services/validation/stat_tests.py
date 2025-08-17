"""
Statistical Validation and Testing Module

Provides statistical tests and validation utilities for portfolio optimization
and Monte Carlo simulation results.

Features:
- Kolmogorov-Smirnov tests for distribution validation
- Confidence interval estimation methods  
- Bootstrap resampling and permutation tests
- Correlation and independence testing
- Model validation and goodness-of-fit tests
"""

import math
import warnings
from typing import List, Dict, Tuple, Optional, Any, Union, Callable
from dataclasses import dataclass
from enum import Enum
import random

try:
    import numpy as np
    from scipy import stats
    from scipy.stats import kstest, anderson, jarque_bera
    SCIPY_AVAILABLE = True
except ImportError:
    SCIPY_AVAILABLE = False

from backend.services.unified_logging import get_logger

logger = get_logger("statistical_validation")


class ConfidenceIntervalMethod(Enum):
    """Methods for computing confidence intervals"""
    PERCENTILE = "percentile"
    BOOTSTRAP = "bootstrap" 
    NORMAL_APPROXIMATION = "normal"
    T_DISTRIBUTION = "t_dist"


class DistributionTestMethod(Enum):
    """Statistical distribution tests"""
    KOLMOGOROV_SMIRNOV = "ks_test"
    ANDERSON_DARLING = "anderson_darling"
    JARQUE_BERA = "jarque_bera"
    SHAPIRO_WILK = "shapiro_wilk"


@dataclass
class StatisticalTestResult:
    """Result of a statistical test"""
    test_name: str
    test_statistic: float
    p_value: float
    critical_value: Optional[float]
    significance_level: float
    reject_null: bool
    interpretation: str
    additional_info: Dict[str, Any] = None


@dataclass
class ConfidenceInterval:
    """Confidence interval result"""
    lower: float
    upper: float
    confidence_level: float
    method: ConfidenceIntervalMethod
    point_estimate: float
    margin_of_error: float


@dataclass
class BootstrapResult:
    """Bootstrap resampling result"""
    statistic_samples: List[float]
    mean: float
    std: float
    confidence_interval: ConfidenceInterval
    num_bootstrap_samples: int


class StatisticalValidator:
    """
    Statistical validation and testing toolkit for portfolio optimization results.
    Provides both scipy-based and fallback implementations.
    """

    def __init__(self, enable_scipy: bool = True):
        self.enable_scipy = enable_scipy and SCIPY_AVAILABLE
        self.logger = logger
        
        if not SCIPY_AVAILABLE and enable_scipy:
            self.logger.warning("SciPy not available - using fallback statistical methods")

    def kolmogorov_smirnov_test(
        self,
        data: List[float],
        distribution: str = "norm",
        significance_level: float = 0.05,
        **distribution_params
    ) -> StatisticalTestResult:
        """
        Kolmogorov-Smirnov goodness-of-fit test.
        
        Args:
            data: Sample data
            distribution: Distribution to test against ('norm', 'uniform', 'exponential')
            significance_level: Significance level for test
            **distribution_params: Parameters for the distribution
            
        Returns:
            Statistical test result
        """
        if self.enable_scipy and len(data) > 3:
            try:
                return self._scipy_ks_test(data, distribution, significance_level, **distribution_params)
            except Exception as e:
                self.logger.warning(f"SciPy KS test failed: {e}, using fallback")
        
        return self._fallback_ks_test(data, distribution, significance_level, **distribution_params)

    def anderson_darling_test(
        self,
        data: List[float],
        distribution: str = "norm",
        significance_level: float = 0.05
    ) -> StatisticalTestResult:
        """Anderson-Darling test for normality"""
        if not self.enable_scipy:
            self.logger.warning("Anderson-Darling test requires SciPy - using KS test fallback")
            return self.kolmogorov_smirnov_test(data, distribution, significance_level)
        
        try:
            statistic, critical_values, significance_levels = stats.anderson(data, dist=distribution)
            
            # Find the critical value for our significance level
            critical_value = None
            for i, sig_level in enumerate(significance_levels):
                if abs(sig_level - significance_level * 100) < 0.1:  # Convert to percentage
                    critical_value = critical_values[i]
                    break
            
            if critical_value is None:
                # Interpolate or use closest value
                critical_value = critical_values[0]  # Most conservative
            
            reject_null = statistic > critical_value
            
            interpretation = (
                f"Data does NOT follow {distribution} distribution (reject null)"
                if reject_null else
                f"Data is consistent with {distribution} distribution (fail to reject null)"
            )
            
            return StatisticalTestResult(
                test_name="Anderson-Darling",
                test_statistic=statistic,
                p_value=-1,  # A-D test doesn't provide p-value directly
                critical_value=critical_value,
                significance_level=significance_level,
                reject_null=reject_null,
                interpretation=interpretation,
                additional_info={
                    "distribution": distribution,
                    "all_critical_values": critical_values.tolist(),
                    "all_significance_levels": significance_levels.tolist()
                }
            )
            
        except Exception as e:
            self.logger.error(f"Anderson-Darling test failed: {e}")
            return self.kolmogorov_smirnov_test(data, distribution, significance_level)

    def jarque_bera_test(
        self,
        data: List[float],
        significance_level: float = 0.05
    ) -> StatisticalTestResult:
        """Jarque-Bera test for normality (tests skewness and kurtosis)"""
        if not self.enable_scipy:
            return self.kolmogorov_smirnov_test(data, "norm", significance_level)
        
        try:
            statistic, p_value = stats.jarque_bera(data)
            
            reject_null = p_value < significance_level
            
            interpretation = (
                "Data is NOT normally distributed (reject null hypothesis)"
                if reject_null else
                "Data is consistent with normal distribution (fail to reject null)"
            )
            
            return StatisticalTestResult(
                test_name="Jarque-Bera",
                test_statistic=statistic,
                p_value=p_value,
                critical_value=None,
                significance_level=significance_level,
                reject_null=reject_null,
                interpretation=interpretation,
                additional_info={"distribution": "normal"}
            )
            
        except Exception as e:
            self.logger.error(f"Jarque-Bera test failed: {e}")
            return self.kolmogorov_smirnov_test(data, "norm", significance_level)

    def compute_confidence_interval(
        self,
        data: List[float],
        confidence_level: float = 0.95,
        method: ConfidenceIntervalMethod = ConfidenceIntervalMethod.PERCENTILE
    ) -> ConfidenceInterval:
        """
        Compute confidence interval for sample mean.
        
        Args:
            data: Sample data
            confidence_level: Confidence level (0-1)
            method: Method for computing CI
            
        Returns:
            Confidence interval result
        """
        if len(data) == 0:
            raise ValueError("Cannot compute confidence interval for empty data")
        
        point_estimate = sum(data) / len(data)
        
        if method == ConfidenceIntervalMethod.PERCENTILE:
            return self._percentile_confidence_interval(data, confidence_level, point_estimate)
        elif method == ConfidenceIntervalMethod.BOOTSTRAP:
            return self._bootstrap_confidence_interval(data, confidence_level, point_estimate)
        elif method == ConfidenceIntervalMethod.NORMAL_APPROXIMATION:
            return self._normal_approximation_ci(data, confidence_level, point_estimate)
        elif method == ConfidenceIntervalMethod.T_DISTRIBUTION:
            return self._t_distribution_ci(data, confidence_level, point_estimate)
        else:
            raise ValueError(f"Unsupported CI method: {method}")

    def bootstrap_resample(
        self,
        data: List[float],
        statistic_func: Callable[[List[float]], float],
        num_bootstrap_samples: int = 1000,
        confidence_level: float = 0.95
    ) -> BootstrapResult:
        """
        Bootstrap resampling for arbitrary statistics.
        
        Args:
            data: Original sample data
            statistic_func: Function to compute statistic from sample
            num_bootstrap_samples: Number of bootstrap samples
            confidence_level: Confidence level for CI
            
        Returns:
            Bootstrap result with confidence interval
        """
        if len(data) < 2:
            raise ValueError("Bootstrap requires at least 2 data points")
        
        bootstrap_statistics = []
        
        for _ in range(num_bootstrap_samples):
            # Resample with replacement
            bootstrap_sample = [random.choice(data) for _ in range(len(data))]
            bootstrap_stat = statistic_func(bootstrap_sample)
            bootstrap_statistics.append(bootstrap_stat)
        
        # Compute statistics
        mean_stat = sum(bootstrap_statistics) / len(bootstrap_statistics)
        variance = sum((x - mean_stat) ** 2 for x in bootstrap_statistics) / (len(bootstrap_statistics) - 1)
        std_stat = math.sqrt(variance)
        
        # Compute confidence interval
        alpha = 1 - confidence_level
        sorted_stats = sorted(bootstrap_statistics)
        lower_idx = int(alpha / 2 * len(sorted_stats))
        upper_idx = int((1 - alpha / 2) * len(sorted_stats))
        
        lower_idx = max(0, min(lower_idx, len(sorted_stats) - 1))
        upper_idx = max(0, min(upper_idx, len(sorted_stats) - 1))
        
        ci_lower = sorted_stats[lower_idx]
        ci_upper = sorted_stats[upper_idx]
        
        confidence_interval = ConfidenceInterval(
            lower=ci_lower,
            upper=ci_upper,
            confidence_level=confidence_level,
            method=ConfidenceIntervalMethod.BOOTSTRAP,
            point_estimate=mean_stat,
            margin_of_error=(ci_upper - ci_lower) / 2
        )
        
        return BootstrapResult(
            statistic_samples=bootstrap_statistics,
            mean=mean_stat,
            std=std_stat,
            confidence_interval=confidence_interval,
            num_bootstrap_samples=num_bootstrap_samples
        )

    def test_correlation_significance(
        self,
        correlation: float,
        sample_size: int,
        significance_level: float = 0.05
    ) -> StatisticalTestResult:
        """
        Test if a correlation coefficient is significantly different from zero.
        
        Args:
            correlation: Sample correlation coefficient
            sample_size: Sample size
            significance_level: Significance level
            
        Returns:
            Statistical test result
        """
        if sample_size < 3:
            raise ValueError("Sample size must be at least 3")
        
        if abs(correlation) >= 1:
            # Perfect correlation
            return StatisticalTestResult(
                test_name="Correlation Significance",
                test_statistic=float('inf'),
                p_value=0.0,
                critical_value=None,
                significance_level=significance_level,
                reject_null=True,
                interpretation="Perfect correlation detected - highly significant"
            )
        
        # Calculate t-statistic
        degrees_freedom = sample_size - 2
        t_statistic = correlation * math.sqrt(degrees_freedom) / math.sqrt(1 - correlation ** 2)
        
        if self.enable_scipy:
            try:
                p_value = 2 * (1 - stats.t.cdf(abs(t_statistic), degrees_freedom))
                critical_value = stats.t.ppf(1 - significance_level / 2, degrees_freedom)
            except Exception:
                # Fallback calculation
                p_value = self._t_distribution_p_value_fallback(t_statistic, degrees_freedom)
                critical_value = self._t_critical_value_fallback(significance_level / 2, degrees_freedom)
        else:
            p_value = self._t_distribution_p_value_fallback(t_statistic, degrees_freedom)
            critical_value = self._t_critical_value_fallback(significance_level / 2, degrees_freedom)
        
        reject_null = p_value < significance_level
        
        interpretation = (
            f"Correlation r={correlation:.3f} is statistically significant"
            if reject_null else
            f"Correlation r={correlation:.3f} is not statistically significant"
        )
        
        return StatisticalTestResult(
            test_name="Correlation Significance",
            test_statistic=t_statistic,
            p_value=p_value,
            critical_value=critical_value,
            significance_level=significance_level,
            reject_null=reject_null,
            interpretation=interpretation,
            additional_info={
                "correlation": correlation,
                "sample_size": sample_size,
                "degrees_freedom": degrees_freedom
            }
        )

    def validate_monte_carlo_convergence(
        self,
        simulation_results: List[float],
        window_size: int = 1000,
        tolerance: float = 0.001
    ) -> Dict[str, Any]:
        """
        Validate Monte Carlo simulation convergence.
        
        Args:
            simulation_results: Sequential simulation results
            window_size: Window size for convergence check
            tolerance: Convergence tolerance
            
        Returns:
            Convergence analysis results
        """
        if len(simulation_results) < window_size * 2:
            return {
                "converged": False,
                "reason": "Insufficient samples for convergence analysis",
                "recommendation": f"Need at least {window_size * 2} samples"
            }
        
        # Calculate running means
        running_means = []
        for i in range(window_size, len(simulation_results)):
            window_data = simulation_results[i - window_size:i]
            running_means.append(sum(window_data) / len(window_data))
        
        if len(running_means) < 2:
            return {
                "converged": False,
                "reason": "Insufficient windows for convergence check"
            }
        
        # Check stability of recent means
        recent_means = running_means[-10:] if len(running_means) >= 10 else running_means
        mean_of_means = sum(recent_means) / len(recent_means)
        
        # Check if all recent means are within tolerance
        converged = all(
            abs(mean - mean_of_means) / abs(mean_of_means) < tolerance
            for mean in recent_means
            if mean_of_means != 0
        )
        
        # Calculate coefficient of variation
        if len(recent_means) > 1:
            variance = sum((x - mean_of_means) ** 2 for x in recent_means) / (len(recent_means) - 1)
            std_dev = math.sqrt(variance)
            cv = std_dev / abs(mean_of_means) if mean_of_means != 0 else float('inf')
        else:
            cv = 0
        
        return {
            "converged": converged,
            "final_estimate": running_means[-1],
            "coefficient_of_variation": cv,
            "num_samples": len(simulation_results),
            "window_size": window_size,
            "tolerance": tolerance,
            "recent_means": recent_means,
            "recommendation": (
                "Simulation has converged"
                if converged else
                f"Continue simulation - CV={cv:.4f} > tolerance={tolerance}"
            )
        }

    # Private methods for different CI calculations

    def _percentile_confidence_interval(
        self,
        data: List[float],
        confidence_level: float,
        point_estimate: float
    ) -> ConfidenceInterval:
        """Calculate percentile-based confidence interval"""
        alpha = 1 - confidence_level
        sorted_data = sorted(data)
        
        lower_idx = int(alpha / 2 * len(sorted_data))
        upper_idx = int((1 - alpha / 2) * len(sorted_data))
        
        lower_idx = max(0, min(lower_idx, len(sorted_data) - 1))
        upper_idx = max(0, min(upper_idx, len(sorted_data) - 1))
        
        lower = sorted_data[lower_idx]
        upper = sorted_data[upper_idx]
        
        return ConfidenceInterval(
            lower=lower,
            upper=upper,
            confidence_level=confidence_level,
            method=ConfidenceIntervalMethod.PERCENTILE,
            point_estimate=point_estimate,
            margin_of_error=(upper - lower) / 2
        )

    def _bootstrap_confidence_interval(
        self,
        data: List[float],
        confidence_level: float,
        point_estimate: float
    ) -> ConfidenceInterval:
        """Calculate bootstrap confidence interval"""
        def mean_func(sample):
            return sum(sample) / len(sample)
        
        bootstrap_result = self.bootstrap_resample(
            data, mean_func, 1000, confidence_level
        )
        
        return bootstrap_result.confidence_interval

    def _normal_approximation_ci(
        self,
        data: List[float],
        confidence_level: float,
        point_estimate: float
    ) -> ConfidenceInterval:
        """Calculate normal approximation confidence interval"""
        n = len(data)
        variance = sum((x - point_estimate) ** 2 for x in data) / (n - 1)
        std_error = math.sqrt(variance / n)
        
        # Critical z-value (approximation)
        alpha = 1 - confidence_level
        z_critical = self._normal_critical_value(alpha / 2)
        
        margin_of_error = z_critical * std_error
        
        return ConfidenceInterval(
            lower=point_estimate - margin_of_error,
            upper=point_estimate + margin_of_error,
            confidence_level=confidence_level,
            method=ConfidenceIntervalMethod.NORMAL_APPROXIMATION,
            point_estimate=point_estimate,
            margin_of_error=margin_of_error
        )

    def _t_distribution_ci(
        self,
        data: List[float],
        confidence_level: float,
        point_estimate: float
    ) -> ConfidenceInterval:
        """Calculate t-distribution confidence interval"""
        n = len(data)
        variance = sum((x - point_estimate) ** 2 for x in data) / (n - 1)
        std_error = math.sqrt(variance / n)
        
        alpha = 1 - confidence_level
        degrees_freedom = n - 1
        
        if self.enable_scipy:
            try:
                t_critical = stats.t.ppf(1 - alpha / 2, degrees_freedom)
            except Exception:
                t_critical = self._t_critical_value_fallback(alpha / 2, degrees_freedom)
        else:
            t_critical = self._t_critical_value_fallback(alpha / 2, degrees_freedom)
        
        margin_of_error = t_critical * std_error
        
        return ConfidenceInterval(
            lower=point_estimate - margin_of_error,
            upper=point_estimate + margin_of_error,
            confidence_level=confidence_level,
            method=ConfidenceIntervalMethod.T_DISTRIBUTION,
            point_estimate=point_estimate,
            margin_of_error=margin_of_error
        )

    # SciPy implementations

    def _scipy_ks_test(
        self,
        data: List[float],
        distribution: str,
        significance_level: float,
        **distribution_params
    ) -> StatisticalTestResult:
        """SciPy-based KS test"""
        if distribution == "norm":
            if "loc" not in distribution_params:
                distribution_params["loc"] = sum(data) / len(data)
            if "scale" not in distribution_params:
                variance = sum((x - distribution_params["loc"]) ** 2 for x in data) / len(data)
                distribution_params["scale"] = math.sqrt(variance)
        
        statistic, p_value = kstest(data, distribution, args=tuple(distribution_params.values()))
        
        reject_null = p_value < significance_level
        
        interpretation = (
            f"Data does NOT follow {distribution} distribution (reject null)"
            if reject_null else
            f"Data is consistent with {distribution} distribution (fail to reject null)"
        )
        
        return StatisticalTestResult(
            test_name="Kolmogorov-Smirnov",
            test_statistic=statistic,
            p_value=p_value,
            critical_value=None,
            significance_level=significance_level,
            reject_null=reject_null,
            interpretation=interpretation,
            additional_info={
                "distribution": distribution,
                "distribution_params": distribution_params
            }
        )

    # Fallback implementations

    def _fallback_ks_test(
        self,
        data: List[float],
        distribution: str,
        significance_level: float,
        **distribution_params
    ) -> StatisticalTestResult:
        """Fallback KS test implementation"""
        # Simplified KS test for normal distribution
        if distribution != "norm":
            self.logger.warning(f"Fallback KS test only supports normal distribution, got {distribution}")
        
        n = len(data)
        sorted_data = sorted(data)
        
        # Estimate parameters if not provided
        mean = distribution_params.get("loc", sum(data) / len(data))
        variance = sum((x - mean) ** 2 for x in data) / len(data)
        std = math.sqrt(variance)
        
        # Calculate empirical CDF vs theoretical CDF
        max_diff = 0
        for i, x in enumerate(sorted_data):
            empirical_cdf = (i + 1) / n
            theoretical_cdf = self._normal_cdf(x, mean, std)
            diff = abs(empirical_cdf - theoretical_cdf)
            max_diff = max(max_diff, diff)
        
        # Approximate critical value for KS test
        critical_value = 1.36 / math.sqrt(n)  # For alpha = 0.05
        
        # Approximate p-value (very rough)
        if max_diff > critical_value:
            p_value = 0.01  # Roughly significant
        else:
            p_value = 0.10  # Roughly not significant
        
        reject_null = p_value < significance_level
        
        interpretation = (
            f"Data does NOT follow {distribution} distribution (reject null) [fallback test]"
            if reject_null else
            f"Data is consistent with {distribution} distribution (fail to reject null) [fallback test]"
        )
        
        return StatisticalTestResult(
            test_name="Kolmogorov-Smirnov (fallback)",
            test_statistic=max_diff,
            p_value=p_value,
            critical_value=critical_value,
            significance_level=significance_level,
            reject_null=reject_null,
            interpretation=interpretation,
            additional_info={
                "distribution": distribution,
                "estimated_mean": mean,
                "estimated_std": std,
                "note": "Fallback implementation with approximate p-values"
            }
        )

    def _normal_cdf(self, x: float, mean: float, std: float) -> float:
        """Normal CDF approximation"""
        if std <= 0:
            return 1.0 if x >= mean else 0.0
        
        z = (x - mean) / std
        # Approximation using error function
        return 0.5 * (1 + math.erf(z / math.sqrt(2)))

    def _normal_critical_value(self, alpha: float) -> float:
        """Approximate normal critical values"""
        critical_values = {
            0.001: 3.291,
            0.005: 2.576,
            0.01: 2.326,
            0.025: 1.96,
            0.05: 1.645,
            0.1: 1.282
        }
        
        # Find closest alpha
        closest_alpha = min(critical_values.keys(), key=lambda k: abs(k - alpha))
        return critical_values[closest_alpha]

    def _t_critical_value_fallback(self, alpha: float, df: int) -> float:
        """Approximate t-distribution critical values"""
        # Very rough approximation
        if df >= 30:
            return self._normal_critical_value(alpha)
        elif df >= 20:
            return self._normal_critical_value(alpha) * 1.05
        elif df >= 10:
            return self._normal_critical_value(alpha) * 1.15
        else:
            return self._normal_critical_value(alpha) * 1.3

    def _t_distribution_p_value_fallback(self, t_statistic: float, df: int) -> float:
        """Rough t-distribution p-value approximation"""
        # Very approximate - in practice should use SciPy
        abs_t = abs(t_statistic)
        
        if abs_t > 3:
            return 0.001
        elif abs_t > 2.5:
            return 0.01
        elif abs_t > 2:
            return 0.05
        elif abs_t > 1.5:
            return 0.15
        else:
            return 0.3


# Global validator instance
statistical_validator = StatisticalValidator()


# Convenience functions

def validate_monte_carlo_results(
    simulation_results: List[float],
    expected_distribution: str = "norm",
    confidence_level: float = 0.95,
    significance_level: float = 0.05
) -> Dict[str, Any]:
    """
    Comprehensive validation of Monte Carlo results.
    
    Returns:
        Dictionary with validation results including distribution tests,
        confidence intervals, and convergence analysis
    """
    validator = statistical_validator
    
    results = {
        "summary": {
            "num_samples": len(simulation_results),
            "mean": sum(simulation_results) / len(simulation_results),
            "min": min(simulation_results),
            "max": max(simulation_results)
        },
        "distribution_tests": {},
        "confidence_intervals": {},
        "convergence_analysis": {}
    }
    
    if len(simulation_results) > 10:
        # Distribution tests
        results["distribution_tests"]["ks_test"] = validator.kolmogorov_smirnov_test(
            simulation_results, expected_distribution, significance_level
        )
        
        if SCIPY_AVAILABLE:
            results["distribution_tests"]["jarque_bera"] = validator.jarque_bera_test(
                simulation_results, significance_level
            )
        
        # Confidence intervals
        for method in [ConfidenceIntervalMethod.PERCENTILE, ConfidenceIntervalMethod.T_DISTRIBUTION]:
            try:
                ci = validator.compute_confidence_interval(
                    simulation_results, confidence_level, method
                )
                results["confidence_intervals"][method.value] = ci
            except Exception as e:
                results["confidence_intervals"][method.value] = f"Failed: {e}"
        
        # Convergence analysis
        results["convergence_analysis"] = validator.validate_monte_carlo_convergence(
            simulation_results
        )
    
    return results


def test_correlation_matrix_properties(
    correlation_matrix: List[List[float]],
    tolerance: float = 1e-6
) -> Dict[str, Any]:
    """
    Test mathematical properties of correlation matrix.
    
    Returns:
        Dictionary with test results for symmetry, diagonal elements,
        eigenvalues, and positive semi-definiteness
    """
    n = len(correlation_matrix)
    if not all(len(row) == n for row in correlation_matrix):
        return {"error": "Matrix is not square"}
    
    results = {
        "size": n,
        "is_symmetric": True,
        "diagonal_ones": True,
        "values_in_range": True,
        "positive_semidefinite": None,
        "condition_number": None
    }
    
    # Check symmetry and diagonal
    for i in range(n):
        for j in range(n):
            if i == j:
                # Diagonal elements should be 1
                if abs(correlation_matrix[i][j] - 1.0) > tolerance:
                    results["diagonal_ones"] = False
            else:
                # Off-diagonal symmetry
                if abs(correlation_matrix[i][j] - correlation_matrix[j][i]) > tolerance:
                    results["is_symmetric"] = False
            
            # Values should be in [-1, 1]
            if abs(correlation_matrix[i][j]) > 1 + tolerance:
                results["values_in_range"] = False
    
    # Check positive semi-definiteness (simplified check)
    try:
        if SCIPY_AVAILABLE:
            eigenvals = np.linalg.eigvals(correlation_matrix)
            results["positive_semidefinite"] = all(eigval >= -tolerance for eigval in eigenvals)
            results["condition_number"] = float(np.linalg.cond(correlation_matrix))
            results["min_eigenvalue"] = float(min(eigenvals))
            results["max_eigenvalue"] = float(max(eigenvals))
        else:
            results["positive_semidefinite"] = "Cannot test without NumPy"
    except Exception as e:
        results["positive_semidefinite"] = f"Test failed: {e}"
    
    return results