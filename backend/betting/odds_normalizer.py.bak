"""Odds normalization utilities for Positive EV engine (Phase 1).

Provides pure functions to convert American odds to implied probabilities.
These helpers are intentionally small, dependency‑free, and deterministic so
they can be unit tested in isolation.

Rules:
  * Positive American odds (e.g. +150): implied_prob = 100 / (odds + 100)
  * Negative American odds (e.g. -120): implied_prob = -odds / (-odds + 100)
  * Odds may not be zero.

All functions include type hints and raise ValueError on invalid input.
"""

from __future__ import annotations

from typing import Iterable, List


def to_implied_prob(american_odds: int) -> float:
    """Convert American odds to implied probability (0..1).

    Examples:
        +150 -> 100 / (150 + 100) = 0.4
        -120 -> 120 / (120 + 100) = 0.545454...

    Args:
        american_odds: American odds as integer (cannot be 0).

    Returns:
        Probability in the inclusive range (0, 1).

    Raises:
        ValueError: If american_odds is 0.
    """
    if american_odds == 0:
        raise ValueError("american_odds cannot be 0")
    if american_odds > 0:
        return 100.0 / (american_odds + 100.0)
    # negative odds
    return float(-american_odds) / (float(-american_odds) + 100.0)


def batch_to_implied_prob(odds: Iterable[int]) -> List[float]:
    """Vector convenience wrapper for multiple odds values.

    Args:
        odds: Iterable of American odds integers.
    Returns:
        List of implied probabilities.
    """
    return [to_implied_prob(o) for o in odds]


__all__ = ["to_implied_prob", "batch_to_implied_prob"]
