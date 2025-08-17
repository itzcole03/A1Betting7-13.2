"""
Distribution Utilities - PMF/CDF calculations for statistical distributions
"""

import math
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# Try to import scipy for better accuracy, fall back to manual implementations
try:
    from scipy.stats import poisson, norm
    SCIPY_AVAILABLE = True
except ImportError:
    logger.warning("scipy not available, using manual distribution implementations")
    SCIPY_AVAILABLE = False


def poisson_pmf(k: int, lambda_param: float) -> float:
    """
    Poisson probability mass function.
    
    Args:
        k: Number of events
        lambda_param: Rate parameter
        
    Returns:
        float: Probability P(X = k)
    """
    if SCIPY_AVAILABLE:
        return poisson.pmf(k, lambda_param)
    
    # Manual implementation
    if lambda_param <= 0:
        return 0.0
    if k < 0:
        return 0.0
    
    try:
        # P(X = k) = (λ^k * e^(-λ)) / k!
        return (lambda_param ** k) * math.exp(-lambda_param) / math.factorial(k)
    except (OverflowError, ValueError):
        # Use Stirling's approximation for large k
        if k > 100:
            # Stirling: n! ≈ sqrt(2πn) * (n/e)^n
            log_factorial_k = k * math.log(k) - k + 0.5 * math.log(2 * math.pi * k)
            log_pmf = k * math.log(lambda_param) - lambda_param - log_factorial_k
            return math.exp(log_pmf)
        else:
            return 0.0  # Fallback for edge cases


def poisson_cdf(k: int, lambda_param: float) -> float:
    """
    Poisson cumulative distribution function.
    
    Args:
        k: Upper bound (inclusive)
        lambda_param: Rate parameter
        
    Returns:
        float: Probability P(X <= k)
    """
    if SCIPY_AVAILABLE:
        return poisson.cdf(k, lambda_param)
    
    # Manual implementation - sum PMF up to k
    if lambda_param <= 0:
        return 1.0 if k >= 0 else 0.0
    if k < 0:
        return 0.0
    
    try:
        cumulative_prob = 0.0
        for i in range(k + 1):
            cumulative_prob += poisson_pmf(i, lambda_param)
        return min(1.0, cumulative_prob)  # Clamp to [0, 1]
    except Exception as e:
        logger.error(f"Error calculating Poisson CDF: {e}")
        return 0.5  # Fallback


def poisson_median_approximation(lambda_param: float) -> float:
    """
    Approximate median of Poisson distribution.
    
    Uses approximation: median ≈ λ + 1/3 - 0.02/λ for λ > 1
    For λ <= 1, uses more conservative approach.
    
    Args:
        lambda_param: Rate parameter
        
    Returns:
        float: Approximate median
    """
    if lambda_param <= 0:
        return 0.0
    elif lambda_param <= 1:
        # For small λ, median is close to λ
        return lambda_param
    else:
        # Standard approximation
        return lambda_param + 1.0/3.0 - 0.02/lambda_param


def normal_cdf(x: float, mean: float, variance: float) -> float:
    """
    Normal cumulative distribution function.
    
    Args:
        x: Value to evaluate CDF at
        mean: Distribution mean
        variance: Distribution variance
        
    Returns:
        float: Probability P(X <= x)
    """
    if SCIPY_AVAILABLE:
        std_dev = math.sqrt(variance)
        return norm.cdf(x, loc=mean, scale=std_dev)
    
    # Manual implementation using error function approximation
    std_dev = math.sqrt(variance)
    if std_dev <= 0:
        return 1.0 if x >= mean else 0.0
    
    # Standardize
    z = (x - mean) / std_dev
    
    # Use complementary error function approximation
    return 0.5 * (1 + erf(z / math.sqrt(2)))


def erf(x: float) -> float:
    """
    Error function approximation using Abramowitz and Stegun formula.
    
    Args:
        x: Input value
        
    Returns:
        float: erf(x) approximation
    """
    # Constants for approximation
    a1 =  0.254829592
    a2 = -0.284496736
    a3 =  1.421413741
    a4 = -1.453152027
    a5 =  1.061405429
    p  =  0.3275911
    
    # Save sign and work with absolute value
    sign = 1 if x >= 0 else -1
    x = abs(x)
    
    # A&S formula 7.1.26
    t = 1.0 / (1.0 + p * x)
    y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * math.exp(-x * x)
    
    return sign * y


def normal_median(mean: float, variance: float) -> float:
    """
    Median of normal distribution (which equals the mean).
    
    Args:
        mean: Distribution mean
        variance: Distribution variance (unused for normal)
        
    Returns:
        float: Median (equals mean)
    """
    return mean


def inverse_fair_line(mean: float, variance: float, distribution_family: str) -> float:
    """
    Calculate fair line (median) for a given distribution.
    
    Args:
        mean: Distribution mean
        variance: Distribution variance
        distribution_family: Type of distribution
        
    Returns:
        float: Fair line value
    """
    distribution_family = distribution_family.upper()
    
    if distribution_family == "NORMAL":
        return normal_median(mean, variance)
    elif distribution_family == "POISSON":
        return poisson_median_approximation(mean)  # For Poisson, mean = λ
    elif distribution_family == "NEG_BINOMIAL":
        # TODO: Implement proper negative binomial median
        # For now, use mean as approximation
        return mean
    else:
        logger.warning(f"Unknown distribution family: {distribution_family}, using mean")
        return mean


def prob_over_line(line: float, mean: float, variance: float, distribution_family: str) -> float:
    """
    Calculate probability of exceeding a line.
    
    Args:
        line: Betting line threshold
        mean: Distribution mean
        variance: Distribution variance  
        distribution_family: Type of distribution
        
    Returns:
        float: Probability P(X > line)
    """
    distribution_family = distribution_family.upper()
    
    try:
        if distribution_family == "NORMAL":
            # P(X > line) = 1 - P(X <= line)
            return 1.0 - normal_cdf(line, mean, variance)
        elif distribution_family == "POISSON":
            # For Poisson, we need P(X > line) where X is discrete
            # This equals 1 - P(X <= floor(line))
            k = int(math.floor(line))
            return 1.0 - poisson_cdf(k, mean)  # For Poisson, mean = λ
        elif distribution_family == "NEG_BINOMIAL":
            # TODO: Implement proper negative binomial CDF
            # For now, approximate with normal
            logger.warning("Using normal approximation for NEG_BINOMIAL")
            return 1.0 - normal_cdf(line, mean, variance)
        else:
            logger.error(f"Unsupported distribution: {distribution_family}")
            return 0.5  # Neutral fallback
            
    except Exception as e:
        logger.error(f"Error calculating prob_over_line: {e}")
        return 0.5  # Neutral fallback