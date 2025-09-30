"""Kelly staking utility for Phase 2 EV integration.

Provides a capped Kelly fraction calculator given a fair probability and
market American odds. This initial implementation is pure and dependency
free so it can be unit tested in isolation.
"""

from __future__ import annotations

from typing import Dict

from .odds_normalizer import to_implied_prob


def american_to_decimal(american: int) -> float:
    if american == 0:
        raise ValueError("american odds cannot be 0")
    if american > 0:
        return 1 + (american / 100.0)
    return 1 + (100.0 / -american)


def compute_kelly_fraction(
    fair_prob: float,
    market_american: int,
    bankroll: float,
    fraction_cap: float = 0.05,
) -> Dict[str, float]:
    """Compute capped Kelly fraction and recommended stake.

    Kelly formula (single outcome):
        b = decimal_odds - 1
        k = (b * p - (1 - p)) / b
        If k < 0 -> 0; If k > fraction_cap -> fraction_cap

    Args:
        fair_prob: Estimated fair win probability (0..1).
        market_american: Market odds (American integer).
        bankroll: Current bankroll (must be > 0 to yield stake > 0).
        fraction_cap: Upper bound for recommended Kelly fraction.
    Returns:
        dict with raw_fraction (unclamped), kelly_fraction (final), recommended_stake.
    """
    if bankroll < 0:
        raise ValueError("bankroll cannot be negative")
    if not (0 < fair_prob < 1):
        raise ValueError("fair_prob must be between 0 and 1 (exclusive)")
    dec = american_to_decimal(market_american)
    b = dec - 1.0
    raw_fraction = (b * fair_prob - (1 - fair_prob)) / b
    if raw_fraction < 0:
        k = 0.0
    else:
        k = raw_fraction if raw_fraction <= fraction_cap else fraction_cap
    recommended = bankroll * k if bankroll > 0 else 0.0
    return {
        "raw_fraction": raw_fraction,
        "kelly_fraction": k,
        "recommended_stake": recommended,
    }


__all__ = ["compute_kelly_fraction"]
