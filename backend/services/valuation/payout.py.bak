"""
Payout Utilities - Expected value calculations for different payout schemas
"""

import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)


def compute_expected_value(
    prob_over: float,
    offered_line: float,
    payout_schema: Dict[str, Any]
) -> float:
    """
    Calculate expected value for a bet given probabilities and payout schema.
    
    Args:
        prob_over: Probability of going over the line
        offered_line: The betting line
        payout_schema: Schema defining payout structure
        
    Returns:
        float: Expected value of the bet
    """
    schema_type = payout_schema.get("type", "standard_even")
    prob_under = 1.0 - prob_over
    
    try:
        if schema_type == "prizepicks_flat":
            return _compute_prizepicks_flat_ev(prob_over, prob_under, payout_schema)
        elif schema_type == "standard_even":
            return _compute_standard_even_ev(prob_over, prob_under, payout_schema)
        elif schema_type == "american_odds":
            return _compute_american_odds_ev(prob_over, prob_under, payout_schema)
        elif schema_type == "decimal_odds":
            return _compute_decimal_odds_ev(prob_over, prob_under, payout_schema)
        else:
            logger.warning(f"Unknown payout schema type: {schema_type}")
            return _compute_standard_even_ev(prob_over, prob_under, payout_schema)
            
    except Exception as e:
        logger.error(f"Error computing expected value: {e}")
        return 0.0


def _compute_prizepicks_flat_ev(
    prob_over: float,
    prob_under: float, 
    payout_schema: Dict[str, Any]
) -> float:
    """
    Compute EV for PrizePicks flat payout schema.
    
    For PrizePicks-style betting:
    - Typically flat payout regardless of over/under selection
    - EV depends on selecting the side with higher probability
    
    Args:
        prob_over: Probability of over
        prob_under: Probability of under
        payout_schema: Payout configuration
        
    Returns:
        float: Expected value
    """
    # Default multipliers for PrizePicks (usually 1.0x for single picks)
    over_multiplier = payout_schema.get("over_multiplier", 1.0)
    under_multiplier = payout_schema.get("under_multiplier", 1.0)
    
    # Calculate EV for both sides, return the better one
    # EV = probability_of_win * payout - 1 (cost of bet)
    ev_over = prob_over * over_multiplier - 1.0
    ev_under = prob_under * under_multiplier - 1.0
    
    # Return EV of the better side
    best_ev = max(ev_over, ev_under)
    
    logger.debug(f"PrizePicks EV - Over: {ev_over:.4f}, Under: {ev_under:.4f}, Best: {best_ev:.4f}")
    return best_ev


def _compute_standard_even_ev(
    prob_over: float,
    prob_under: float,
    payout_schema: Dict[str, Any]
) -> float:
    """
    Compute EV for standard even money betting.
    
    Standard betting where you win $1 for every $1 bet at even odds.
    
    Args:
        prob_over: Probability of over
        prob_under: Probability of under
        payout_schema: Payout configuration
        
    Returns:
        float: Expected value for over bet
    """
    # Standard even money: win $1, lose $1
    over_payout = payout_schema.get("over_payout", 1.0)
    under_payout = payout_schema.get("under_payout", 1.0)
    
    # EV for over bet = prob_over * win_amount - prob_under * loss_amount
    # Assuming $1 bet: win_amount = over_payout, loss_amount = 1.0
    ev_over = prob_over * over_payout - prob_under * 1.0
    
    logger.debug(f"Standard EV for over bet: {ev_over:.4f}")
    return ev_over


def _compute_american_odds_ev(
    prob_over: float,
    prob_under: float,
    payout_schema: Dict[str, Any]
) -> float:
    """
    Compute EV using American odds format.
    
    American odds: positive odds show profit on $100 bet, negative odds show bet needed to win $100
    
    Args:
        prob_over: Probability of over
        prob_under: Probability of under
        payout_schema: Payout configuration
        
    Returns:
        float: Expected value
    """
    over_odds = payout_schema.get("over_odds", -110)
    under_odds = payout_schema.get("under_odds", -110)
    
    # Convert American odds to decimal payout ratios
    def american_to_payout_ratio(odds: int) -> float:
        if odds > 0:
            return odds / 100.0  # Profit per $1 bet
        else:
            return 100.0 / abs(odds)  # Profit per $1 bet
    
    over_payout_ratio = american_to_payout_ratio(over_odds)
    under_payout_ratio = american_to_payout_ratio(under_odds)
    
    # Calculate EV for over bet
    # EV = prob_win * payout - prob_lose * 1 (assuming $1 bet)
    ev_over = prob_over * over_payout_ratio - prob_under * 1.0
    ev_under = prob_under * under_payout_ratio - prob_over * 1.0
    
    # Return EV for the better side
    best_ev = max(ev_over, ev_under)
    
    logger.debug(f"American odds EV - Over: {ev_over:.4f}, Under: {ev_under:.4f}, Best: {best_ev:.4f}")
    return best_ev


def _compute_decimal_odds_ev(
    prob_over: float,
    prob_under: float,
    payout_schema: Dict[str, Any]
) -> float:
    """
    Compute EV using decimal odds format.
    
    Decimal odds represent total return per $1 bet (including original stake).
    
    Args:
        prob_over: Probability of over
        prob_under: Probability of under
        payout_schema: Payout configuration
        
    Returns:
        float: Expected value
    """
    over_decimal_odds = payout_schema.get("over_decimal_odds", 1.91)
    under_decimal_odds = payout_schema.get("under_decimal_odds", 1.91)
    
    # EV = probability * (decimal_odds - 1) - (1 - probability) * 1
    # Simplified: EV = probability * decimal_odds - 1
    ev_over = prob_over * over_decimal_odds - 1.0
    ev_under = prob_under * under_decimal_odds - 1.0
    
    # Return EV for the better side
    best_ev = max(ev_over, ev_under)
    
    logger.debug(f"Decimal odds EV - Over: {ev_over:.4f}, Under: {ev_under:.4f}, Best: {best_ev:.4f}")
    return best_ev


def get_default_payout_schema(schema_type: str = "standard_even") -> Dict[str, Any]:
    """
    Get default payout schema for a given type.
    
    Args:
        schema_type: Type of payout schema
        
    Returns:
        dict: Default payout schema configuration
    """
    defaults = {
        "prizepicks_flat": {
            "type": "prizepicks_flat",
            "over_multiplier": 1.0,
            "under_multiplier": 1.0,
            "description": "PrizePicks flat payout (1.0x for single picks)"
        },
        "standard_even": {
            "type": "standard_even", 
            "over_payout": 1.0,
            "under_payout": 1.0,
            "description": "Standard even money betting"
        },
        "american_odds": {
            "type": "american_odds",
            "over_odds": -110,
            "under_odds": -110,
            "description": "American odds format (-110 both sides)"
        },
        "decimal_odds": {
            "type": "decimal_odds",
            "over_decimal_odds": 1.91,
            "under_decimal_odds": 1.91,
            "description": "Decimal odds format (1.91 both sides)"
        }
    }
    
    return defaults.get(schema_type, defaults["standard_even"])


def convert_american_to_decimal(american_odds: int) -> float:
    """
    Convert American odds to decimal odds.
    
    Args:
        american_odds: American odds (e.g., -110, +150)
        
    Returns:
        float: Decimal odds
    """
    if american_odds > 0:
        return (american_odds / 100.0) + 1.0
    else:
        return (100.0 / abs(american_odds)) + 1.0


def convert_decimal_to_american(decimal_odds: float) -> int:
    """
    Convert decimal odds to American odds.
    
    Args:
        decimal_odds: Decimal odds (e.g., 1.91, 2.50)
        
    Returns:
        int: American odds
    """
    if decimal_odds >= 2.0:
        return int((decimal_odds - 1.0) * 100)
    else:
        return int(-100 / (decimal_odds - 1.0))


def implied_probability_from_odds(odds: int, odds_format: str = "american") -> float:
    """
    Calculate implied probability from odds.
    
    Args:
        odds: Odds value
        odds_format: Format of odds ("american" or "decimal")
        
    Returns:
        float: Implied probability (0.0 to 1.0)
    """
    try:
        if odds_format == "american":
            if odds > 0:
                return 100.0 / (odds + 100.0)
            else:
                return abs(odds) / (abs(odds) + 100.0)
        elif odds_format == "decimal":
            return 1.0 / odds
        else:
            logger.error(f"Unknown odds format: {odds_format}")
            return 0.5
    except (ZeroDivisionError, ValueError):
        logger.error(f"Invalid odds value: {odds}")
        return 0.5