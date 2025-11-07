"""
Fair odds calculation utilities and mathematical helpers.

This module provides comprehensive mathematical functions for:
- Converting between odds formats
- Calculating fair probabilities from projections
- Margin adjustments for sportsbook vigorish
- Statistical distribution modeling for fair odds calculation
"""

import math
from typing import Optional, Tuple
from scipy import stats
import numpy as np


def american_to_decimal(american_odds: int) -> float:
    """
    Convert American odds to decimal odds.
    
    Args:
        american_odds: American odds format (+150, -110, etc.)
        
    Returns:
        Decimal odds (1.50, 1.91, etc.)
        
    Examples:
        >>> american_to_decimal(150)
        2.5
        >>> american_to_decimal(-110)
        1.909
    """
    if american_odds > 0:
        return (american_odds / 100) + 1
    else:
        return (100 / abs(american_odds)) + 1


def decimal_to_american(decimal_odds: float) -> int:
    """
    Convert decimal odds to American odds.
    
    Args:
        decimal_odds: Decimal odds format (1.50, 1.91, etc.)
        
    Returns:
        American odds (+150, -110, etc.)
    """
    if decimal_odds >= 2.0:
        return int((decimal_odds - 1) * 100)
    else:
        return int(-100 / (decimal_odds - 1))


def implied_probability_from_odds(decimal_odds: float) -> float:
    """
    Calculate implied probability from decimal odds.
    
    Args:
        decimal_odds: Decimal odds
        
    Returns:
        Implied probability as decimal (0.0 to 1.0)
    """
    return 1 / decimal_odds


def fair_probability_from_projection(
    projection_value: float,
    market_line: float,
    market_type: str = "over_under",
    distribution_type: str = "normal",
    std_dev: Optional[float] = None
) -> float:
    """
    Calculate fair probability from a projection using statistical distributions.
    
    Args:
        projection_value: Player/team projected value
        market_line: Betting line/total
        market_type: Type of market ("over_under", "spread", "moneyline")
        distribution_type: Statistical distribution ("normal", "poisson", "binomial")
        std_dev: Standard deviation for normal distribution (auto-calculated if None)
        
    Returns:
        Fair probability for the "over" or "favorite" side
        
    Examples:
        >>> fair_probability_from_projection(8.5, 8.0, "over_under", "normal")
        0.65  # 65% chance of going over 8.0 when projection is 8.5
    """
    if market_type == "over_under":
        return _calculate_over_under_probability(
            projection_value, market_line, distribution_type, std_dev
        )
    elif market_type == "spread":
        return _calculate_spread_probability(
            projection_value, market_line, distribution_type, std_dev
        )
    elif market_type == "moneyline":
        return _calculate_moneyline_probability(
            projection_value, market_line, distribution_type
        )
    else:
        raise ValueError(f"Unsupported market type: {market_type}")


def _calculate_over_under_probability(
    projection: float,
    line: float,
    distribution_type: str,
    std_dev: Optional[float] = None
) -> float:
    """Calculate probability for over/under markets."""
    if distribution_type == "normal":
        # Use rule of thumb: std_dev = projection * 0.15 if not provided
        if std_dev is None:
            std_dev = max(projection * 0.15, 0.5)  # Minimum std_dev of 0.5
        
        # Probability of going over the line
        z_score = (line - projection) / std_dev
        return 1 - stats.norm.cdf(z_score)
    
    elif distribution_type == "poisson":
        # For counting stats (hits, strikeouts, etc.)
        if line == int(line):
            # Exact line (e.g., 2.5 becomes 2)
            return 1 - stats.poisson.cdf(int(line), projection)
        else:
            # Fractional line - interpolate
            lower_prob = 1 - stats.poisson.cdf(int(line), projection)
            upper_prob = 1 - stats.poisson.cdf(int(line) + 1, projection)
            fraction = line - int(line)
            return lower_prob * (1 - fraction) + upper_prob * fraction
    
    else:
        raise ValueError(f"Unsupported distribution type: {distribution_type}")


def _calculate_spread_probability(
    projection: float,
    spread: float,
    distribution_type: str,
    std_dev: Optional[float] = None
) -> float:
    """Calculate probability for point spread markets."""
    if distribution_type == "normal":
        if std_dev is None:
            std_dev = max(abs(projection) * 0.2, 1.0)  # Minimum std_dev of 1.0
        
        # Probability of covering the spread (projection + spread > 0)
        z_score = -(projection + spread) / std_dev
        return 1 - stats.norm.cdf(z_score)
    
    else:
        raise ValueError(f"Unsupported distribution type for spread: {distribution_type}")


def _calculate_moneyline_probability(
    win_probability: float,
    line: float,
    distribution_type: str
) -> float:
    """Calculate probability for moneyline markets."""
    # For moneyline, projection_value should be win probability (0-1)
    # line parameter is ignored for moneyline
    return max(0.0, min(1.0, win_probability))


def margin_adjustment(
    fair_probability: float,
    margin_percent: float = 4.5,
    adjustment_method: str = "multiplicative"
) -> Tuple[float, float]:
    """
    Adjust fair probability to account for sportsbook margin/vigorish.
    
    Args:
        fair_probability: True fair probability (0.0 to 1.0)
        margin_percent: Sportsbook margin percentage (default 4.5%)
        adjustment_method: Method for margin adjustment ("multiplicative", "additive", "power")
        
    Returns:
        Tuple of (adjusted_probability_over, adjusted_probability_under)
        
    Examples:
        >>> margin_adjustment(0.55, 4.5)
        (0.528, 0.472)  # Adjusted probabilities that sum to 1.0
    """
    margin_decimal = margin_percent / 100
    
    if adjustment_method == "multiplicative":
        # Multiplicative margin - scales probabilities proportionally
        total_implied = 1 + margin_decimal
        adjusted_over = fair_probability / total_implied
        adjusted_under = (1 - fair_probability) / total_implied
        
    elif adjustment_method == "additive":
        # Additive margin - subtracts equal amounts from both sides
        margin_per_side = margin_decimal / 2
        adjusted_over = fair_probability - margin_per_side
        adjusted_under = (1 - fair_probability) - margin_per_side
        
    elif adjustment_method == "power":
        # Power method - applies exponential scaling
        power = 1 - (margin_decimal / 2)
        adjusted_over = fair_probability ** power
        adjusted_under = (1 - fair_probability) ** power
        # Normalize to sum to 1
        total = adjusted_over + adjusted_under
        adjusted_over /= total
        adjusted_under /= total
        
    else:
        raise ValueError(f"Unsupported adjustment method: {adjustment_method}")
    
    # Ensure probabilities are within valid range
    adjusted_over = max(0.01, min(0.99, adjusted_over))
    adjusted_under = max(0.01, min(0.99, adjusted_under))
    
    return adjusted_over, adjusted_under


def calculate_fair_odds(
    projection_value: float,
    market_line: float,
    market_type: str = "over_under",
    distribution_type: str = "normal",
    margin_percent: float = 0.0,
    std_dev: Optional[float] = None
) -> dict:
    """
    Complete fair odds calculation pipeline.
    
    Args:
        projection_value: Player/team projected value
        market_line: Betting line/total
        market_type: Type of market ("over_under", "spread", "moneyline")
        distribution_type: Statistical distribution ("normal", "poisson")
        margin_percent: Margin adjustment percentage (0 for true fair odds)
        std_dev: Standard deviation for normal distribution
        
    Returns:
        Dictionary with fair odds and probabilities:
        {
            'fair_probability': float,
            'fair_odds_decimal': float,
            'fair_odds_american': int,
            'implied_probability': float,
            'margin_adjusted_over': float,
            'margin_adjusted_under': float
        }
    """
    # Calculate fair probability
    fair_prob = fair_probability_from_projection(
        projection_value, market_line, market_type, distribution_type, std_dev
    )
    
    # Apply margin adjustment if specified
    if margin_percent > 0:
        adjusted_over, adjusted_under = margin_adjustment(fair_prob, margin_percent)
        display_prob = adjusted_over
    else:
        adjusted_over, adjusted_under = fair_prob, 1 - fair_prob
        display_prob = fair_prob
    
    # Convert to odds
    fair_decimal = 1 / display_prob
    fair_american = decimal_to_american(fair_decimal)
    implied_prob = implied_probability_from_odds(fair_decimal)
    
    return {
        'fair_probability': fair_prob,
        'fair_odds_decimal': round(fair_decimal, 3),
        'fair_odds_american': fair_american,
        'implied_probability': round(implied_prob, 4),
        'margin_adjusted_over': round(adjusted_over, 4),
        'margin_adjusted_under': round(adjusted_under, 4),
        'projection_value': projection_value,
        'market_line': market_line,
        'market_type': market_type,
        'distribution_type': distribution_type
    }


def odds_comparison(
    fair_odds_decimal: float,
    book_odds_american: int
) -> dict:
    """
    Compare fair odds with sportsbook odds to find edge.
    
    Args:
        fair_odds_decimal: Calculated fair odds in decimal format
        book_odds_american: Sportsbook odds in American format
        
    Returns:
        Dictionary with comparison metrics:
        {
            'book_odds_decimal': float,
            'edge_percentage': float,
            'value_rating': str,
            'recommendation': str
        }
    """
    book_decimal = american_to_decimal(book_odds_american)
    
    # Calculate edge percentage
    fair_implied = implied_probability_from_odds(fair_odds_decimal)
    book_implied = implied_probability_from_odds(book_decimal)
    edge_percentage = ((book_decimal / fair_odds_decimal) - 1) * 100
    
    # Determine value rating
    if edge_percentage >= 10:
        value_rating = "Excellent Value"
        recommendation = "Strong Bet"
    elif edge_percentage >= 5:
        value_rating = "Good Value"
        recommendation = "Consider Betting"
    elif edge_percentage >= 0:
        value_rating = "Fair Value"
        recommendation = "Neutral"
    elif edge_percentage >= -5:
        value_rating = "Slight Overpriced"
        recommendation = "Avoid"
    else:
        value_rating = "Poor Value"
        recommendation = "Strong Avoid"
    
    return {
        'book_odds_decimal': round(book_decimal, 3),
        'book_odds_american': book_odds_american,
        'fair_odds_decimal': round(fair_odds_decimal, 3),
        'edge_percentage': round(edge_percentage, 2),
        'value_rating': value_rating,
        'recommendation': recommendation,
        'fair_implied_probability': round(fair_implied, 4),
        'book_implied_probability': round(book_implied, 4)
    }


# Additional utility functions for advanced calculations

def kelly_criterion(
    win_probability: float,
    odds_decimal: float,
    bankroll: float = 1000
) -> dict:
    """
    Calculate optimal bet size using Kelly Criterion.
    
    Args:
        win_probability: Probability of winning the bet
        odds_decimal: Decimal odds offered
        bankroll: Total bankroll size
        
    Returns:
        Dictionary with Kelly sizing recommendations
    """
    # Kelly formula: f = (bp - q) / b
    # where b = odds-1, p = win probability, q = lose probability
    b = odds_decimal - 1
    p = win_probability
    q = 1 - p
    
    kelly_fraction = (b * p - q) / b
    
    # Safety constraints
    max_kelly = min(kelly_fraction, 0.25)  # Never bet more than 25% of bankroll
    recommended_bet = max(0, max_kelly * bankroll)
    
    return {
        'kelly_fraction': round(kelly_fraction, 4),
        'max_kelly_fraction': round(max_kelly, 4),
        'recommended_bet_amount': round(recommended_bet, 2),
        'recommended_percentage': round(max_kelly * 100, 2),
        'expected_value': round((win_probability * (odds_decimal - 1) - (1 - win_probability)) * 100, 2)
    }


def confidence_interval(
    probability: float,
    sample_size: int = 100,
    confidence_level: float = 0.95
) -> Tuple[float, float]:
    """
    Calculate confidence interval for probability estimates.
    
    Args:
        probability: Estimated probability
        sample_size: Sample size for estimation
        confidence_level: Confidence level (0.95 for 95%)
        
    Returns:
        Tuple of (lower_bound, upper_bound)
    """
    z_score = stats.norm.ppf((1 + confidence_level) / 2)
    margin_error = z_score * math.sqrt(probability * (1 - probability) / sample_size)
    
    lower_bound = max(0, probability - margin_error)
    upper_bound = min(1, probability + margin_error)
    
    return lower_bound, upper_bound