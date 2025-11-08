"""Lightweight, import-safe API models shim.

This module provides minimal pydantic model definitions for commonly-imported
symbols. It also exposes a dynamic fallback so `from backend.models.api_models
import <Name>` won't crash the application when the full model definitions
aren't necessary for a local dev run.

This is intentionally small and defensive — it should be safe to import at
module-load time (no heavy imports, no route definitions).
"""

import logging
import os
from typing import Any

from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

# Basic env constants (safe to evaluate at import time)
JWT_SECRET = os.getenv("JWT_SECRET", "")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")


# A few minimal models that the codebase expects by name.
class BettingOpportunity(BaseModel):
    id: str = Field(default_factory=lambda: "")
    player: str = ""
    sport: str = ""
    market: str = ""
    line: float = 0.0
    overOdds: int = 0
    underOdds: int = 0
    confidence: int = 0


class HistoricalGameResult(BaseModel):
    game_id: str = ""
    date: str = ""
    home_score: int = 0
    away_score: int = 0


class PerformanceStats(BaseModel):
    total_bets: int = 0
    win_rate: float = 0.0
    average_odds: float = 0.0
    total_profit: float = 0.0


# Dynamic fallback: if callers import a symbol that isn't defined above,
# create a minimal pydantic model with that name. This keeps imports from
# blowing up across the repo while we stabilize other modules.
def __getattr__(name: str) -> Any:  # module-level dynamic attribute access
    # Create a simple BaseModel subclass on first access and cache it on the
    # module so subsequent imports/attribute lookups return the same object.
    if name in globals():
        return globals()[name]

    # Only allow simple identifier names to avoid surprising behaviour.
    if not name.isidentifier():
        raise AttributeError(name)

    cls = type(name, (BaseModel,), {"__module__": __name__})
    globals()[name] = cls
    logger.debug("Created placeholder API model: %s", name)
    return cls


# Keep __all__ reasonably permissive for star-imports in legacy modules.
__all__ = [
    "BettingOpportunity",
    "HistoricalGameResult",
    "PerformanceStats",
    "JWT_SECRET",
    "JWT_ALGORITHM",
]
