import hashlib
import time
from typing import Optional

DRIFT_MAX = 30  # maximum absolute drift in American odds points
DRIFT_WINDOW_MIN = 5  # window size in minutes for deterministic bucket
ENABLE_ODDS_DRIFT_SIM = True  # feature flag

LOWER_BOUND = -400
UPPER_BOUND = 400


def _window_bucket(minutes: int = DRIFT_WINDOW_MIN) -> int:
    """Return current time bucket index based on configured window minutes."""
    if minutes <= 0:
        minutes = 5
    return int(time.time() // (minutes * 60))


def simulate_current_american(placed_odds: int, bet_id: str) -> int:
    """Return a deterministic pseudo-current odds value.

    Deterministic per (bet_id, time bucket). Produces a drift within +/-DRIFT_MAX.
    Ensures we never return zero and clamps within [-400, 400].
    If feature flag disabled, returns original placed_odds.
    """
    if not ENABLE_ODDS_DRIFT_SIM:
        return placed_odds

    # Build seed from bet id + bucket, hash to uniform space
    seed = f"{bet_id}:{_window_bucket()}".encode()
    digest = hashlib.sha256(seed).hexdigest()

    # Use first 4 hex chars (0..65535) map to [-DRIFT_MAX, DRIFT_MAX]
    span = int(digest[:4], 16)
    drift_range = DRIFT_MAX * 2
    drift = int((span / 65535) * drift_range) - DRIFT_MAX
    if drift == 0:
        drift = 1  # enforce some movement for visibility

    new_odds = placed_odds + drift

    # Avoid zero crossing invalid odds (American odds must not be 0)
    if new_odds == 0:
        new_odds = 1 if placed_odds > 0 else -1

    # Clamp extremes
    if new_odds > UPPER_BOUND:
        new_odds = UPPER_BOUND
    if new_odds < LOWER_BOUND:
        new_odds = LOWER_BOUND

    return new_odds


__all__ = [
    "DRIFT_MAX",
    "DRIFT_WINDOW_MIN",
    "ENABLE_ODDS_DRIFT_SIM",
    "simulate_current_american",
]
