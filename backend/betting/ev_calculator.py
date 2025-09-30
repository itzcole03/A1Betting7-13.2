"""EV calculation utilities for Positive EV engine (Phase 1).

Provides pure helpers to translate between probabilities and American odds
and compute edge (expected value percentage) versus a market line.

Formulas:
  decimal_odds = 1 / prob
  american_odds:
      if decimal_odds >= 2: (decimal_odds - 1) * 100
      else: -100 / (decimal_odds - 1)
  implied_prob(market) derived via odds_normalizer.to_implied_prob
  edge_pct = (fair_prob - market_implied_prob) * 100

We intentionally keep only the minimal set of functions needed for the first
EV foundation. Further enhancements (variance, Kelly, portfolio allocation)
are deferred to later phases.
"""

from __future__ import annotations

from typing import Dict

from .odds_normalizer import to_implied_prob


def fair_american_from_prob(prob: float) -> int:
    """Convert a fair probability (0..1) to American odds (rounded).

    Args:
        prob: Fair probability (0 < prob < 1).
    Returns:
        Integer American odds.
    Raises:
        ValueError: If prob not in (0,1).
    """
    if not (0 < prob < 1):  # exclude endpoints (would be infinite odds)
        raise ValueError("prob must be between 0 and 1 (exclusive)")
    decimal_odds = 1.0 / prob
    if decimal_odds >= 2.0:
        american = (decimal_odds - 1.0) * 100.0
    else:
        # Negative odds
        american = -100.0 / (decimal_odds - 1.0)
    return int(round(american))


def compute_ev(fair_prob: float, market_american: int) -> Dict[str, float | int]:
    """Compute expected value metrics for a single market.

    Args:
        fair_prob: Model-estimated fair probability (0..1 exclusive).
        market_american: Market available American odds.
    Returns:
        Dict with keys: fair_prob, fair_odds, implied_prob, edge_pct.
    """
    implied_prob = to_implied_prob(market_american)
    fair_odds = fair_american_from_prob(fair_prob)
    edge_pct = (fair_prob - implied_prob) * 100.0
    return {
        "fair_prob": fair_prob,
        "fair_odds": fair_odds,
        "implied_prob": implied_prob,
        "edge_pct": edge_pct,
    }


__all__ = ["fair_american_from_prob", "compute_ev"]
