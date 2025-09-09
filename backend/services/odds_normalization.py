"""
Odds normalization helpers.

These helpers provide safe conversions and validation for odds inputs coming
from various sources (strings, floats, ints). Keep them lightweight and
dependency-free so tests can import without heavy requirements.
"""

from typing import Optional, Union


def normalize_market_odds(value: Optional[Union[int, float, str]], *, clamp: bool = True) -> int:
    """Normalize an input value into a valid American odds integer.

    - Accepts int, float, or string representations (e.g., "+120", "-110").
    - Rounds floats to nearest int.
    - Optionally clamps to a reasonable range [-1000, 1000].

    Args:
        value: Arbitrary input to convert to American odds
        clamp: Clamp to [-1000, 1000]

    Returns:
        int: normalized American odds

    Raises:
        ValueError: If the value cannot be parsed into an integer
    """
    if value is None:
        raise ValueError("Odds value cannot be None")

    if isinstance(value, int):
        odds = value
    elif isinstance(value, float):
        odds = int(round(value))
    elif isinstance(value, str):
        s = value.strip()
        # Remove optional leading '+'
        if s.startswith('+'):
            s = s[1:]
        odds = int(round(float(s)))
    else:
        raise ValueError(f"Unsupported odds type: {type(value)!r}")

    if clamp:
        if odds > 1000:
            odds = 1000
        if odds < -1000:
            odds = -1000
    return odds


def is_low_juice(american_odds: int, threshold_percent: float = 4.0) -> bool:
    """Heuristic to flag low juice markets for single-side odds.

    Without both sides, true vig is unknown. As a lightweight proxy, treat
    prices near even money as typically lower-juice offerings.

    By default, mark low-juice when price lies in [-105, +105]. This roughly
    corresponds to markets where the implied book margin is modest.
    """
    # Heuristic window can be tightened in the future; keep dependency-free.
    return -105 <= american_odds <= 105
