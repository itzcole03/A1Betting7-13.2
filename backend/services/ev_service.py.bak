"""
Thin EV service wrapper.

Builds on backend.utils.odds_math and backend.models.ev_models to offer
decoupled EV calculations and tagging. Keeps no heavy imports at module level
so tests can import quickly.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional, Dict, Any


@dataclass
class EVComputation:
    ev_percent: float
    ev_dollar: float
    implied_probability: float
    fair_probability: float
    is_positive: bool
    fair_odds_decimal: float
    fair_odds_american: int
    tags: list[str]


class EVService:
    def __init__(self) -> None:
        pass

    def compute_ev(
        self,
        *,
        market_odds: int,
        fair_odds_decimal: float,
        stake: float = 100.0,
    ) -> EVComputation:
        """Compute EV metrics from market and fair odds.

        Uses existing odds_math helpers and ev_models.calculate_expected_value.
        """
        from backend.utils.odds_math import decimal_to_american, implied_probability_from_odds
        from backend.models.ev_models import calculate_expected_value

        fair_odds_american = decimal_to_american(fair_odds_decimal)
        ev = calculate_expected_value(market_odds=market_odds, fair_odds=fair_odds_american, stake=stake)

        tags: list[str] = []
        # Tagging rules (acceptance criteria): HIGH_EV and LOW_JUICE
        if ev.ev_percent >= 4.0:
            tags.append("HIGH_EV")

        # Low juice proxy: price near even money
        if -105 <= market_odds <= 105:
            tags.append("LOW_JUICE")

        return EVComputation(
            ev_percent=ev.ev_percent,
            ev_dollar=ev.ev_dollar,
            implied_probability=ev.implied_probability,
            fair_probability=ev.fair_probability,
            is_positive=ev.is_positive,
            fair_odds_decimal=fair_odds_decimal,
            fair_odds_american=fair_odds_american,
            tags=tags,
        )


_singleton: Optional[EVService] = None


def get_ev_service() -> EVService:
    global _singleton
    if _singleton is None:
        _singleton = EVService()
    return _singleton
"""EV utilities and expected value calculations.

This module provides small, self-contained functions to compute expected
value (EV) from a projected probability and market odds. It accepts
American or Decimal odds formats and returns EV per unit stake and
helpful diagnostic fields.
"""
from typing import Tuple


def american_to_decimal(american: float) -> float:
    """Convert American odds (e.g. -150, +120) to decimal odds.

    Args:
        american: American odds as signed integer/float.

    Returns:
        Decimal odds (e.g. 2.5 for +150)
    """
    try:
        a = float(american)
    except Exception:
        raise ValueError("Invalid American odds value")

    if a > 0:
        return round((a / 100.0) + 1.0, 6)
    elif a < 0:
        return round((100.0 / abs(a)) + 1.0, 6)
    else:
        raise ValueError("American odds cannot be zero")


def parse_odds(odds: float) -> float:
    """Parse input odds and return decimal odds.

    Accepts either a decimal odds number (>1.0) or American odds (<= -100 or >=100).
    For ambiguous values that are >1 and look like decimal odds, assume decimal.
    """
    try:
        o = float(odds)
    except Exception:
        raise ValueError("Invalid odds value")

    # If it's a typical decimal format (>=1.01), treat as decimal
    if o >= 1.01 and o < 1000:
        return o

    # Otherwise treat as American and convert
    return american_to_decimal(o)


def compute_ev(probability: float, odds_decimal: float, stake: float = 1.0) -> Tuple[float, float]:
    """Compute expected value per unit stake and EV percentage.

    EV per unit stake formula:
        EV = probability * (decimal_odds - 1) + (1 - probability) * (-1)
           = probability * decimal_odds - 1

    Args:
        probability: projected probability of win (0..1)
        odds_decimal: market decimal odds (>1.0)
        stake: stake amount (defaults to 1.0)

    Returns:
        (ev, ev_pct) where ev is expected net profit per `stake` and ev_pct is ev/stake*100
    """
    if not (0.0 <= probability <= 1.0):
        raise ValueError("probability must be between 0 and 1")
    if odds_decimal <= 1.0:
        raise ValueError("decimal odds must be > 1.0")
    if stake <= 0:
        raise ValueError("stake must be > 0")

    # EV per unit stake
    ev_per_unit = probability * (odds_decimal - 1.0) + (1.0 - probability) * (-1.0)
    # Scale to provided stake
    ev = ev_per_unit * stake
    ev_pct = (ev / stake) * 100.0
    return (round(ev, 8), round(ev_pct, 4))


def implied_probability_from_decimal(decimal_odds: float) -> float:
    """Return implied probability from decimal odds (without vig removal)."""
    if decimal_odds <= 1.0:
        raise ValueError("decimal odds must be > 1.0")
    return round(1.0 / decimal_odds, 6)
