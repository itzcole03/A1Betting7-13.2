"""Data adapter for Positive EV engine (Phase 1 foundation).

The adapter attempts to source candidate betting markets from existing
projection / opportunities services. To keep the initial EV feature
independent and deterministic for tests, we gracefully fall back to a static
sample list if upstream services are unavailable or raise errors.

Each returned candidate contains the minimal fields required for EV
calculation. Future phases can expand this with bookmaker line dispersion,
multi-leg support, etc.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Iterable, List, Optional
import uuid
import logging

try:  # unified logging preferred
    from backend.services.unified_logging import unified_logging  # type: ignore
    logger = unified_logging.get_logger("ev.adapter")  # type: ignore
except Exception:  # pragma: no cover - fallback
    logger = logging.getLogger("ev.adapter")


@dataclass
class CandidateMarket:
    id: str
    sport: str
    player: Optional[str]
    market: str
    line: float
    fair_prob: float  # model probability (0..1)
    market_odds: int  # offered American odds
    source_book: str


SAMPLE_OPPORTUNITIES: List[CandidateMarket] = [
    CandidateMarket(
        id="sample-1",
        sport="MLB",
        player="Player A",
        market="Hits Over",
        line=1.5,
        fair_prob=0.58,
        market_odds=-110,
        source_book="SampleBook",
    ),
    CandidateMarket(
        id="sample-2",
        sport="MLB",
        player="Player B",
        market="Strikeouts Over",
        line=5.5,
        fair_prob=0.52,
        market_odds=+120,
        source_book="SampleBook",
    ),
    CandidateMarket(
        id="sample-3",
        sport="NBA",
        player="Player C",
        market="Points Over",
        line=24.5,
        fair_prob=0.55,
        market_odds=-105,
        source_book="SampleBook",
    ),
]


async def fetch_candidate_markets(sport: Optional[str] = None) -> List[CandidateMarket]:
    """Fetch candidate markets for EV analysis.

    PHASE2 REAL INTEGRATION START
    Attempts to pull real projections + odds from existing prediction / odds
    sources. If unavailable (ImportError / runtime error), falls back to
    deterministic SAMPLE_OPPORTUNITIES. This keeps tests stable while
    enabling incremental real-data adoption.
    PHASE2 REAL INTEGRATION END
    """
    # Try real integration lazily to avoid circular imports and heavy startup
    real_markets: List[CandidateMarket] = []
    try:  # pragma: no cover (network / heavy paths skipped in unit tests)
        from backend.services.unified_data_fetcher import unified_data_fetcher  # type: ignore
        # Basic example: fetch MLB games then synthesize a couple of props
        if not sport or sport.upper() == "MLB":
            games = await unified_data_fetcher.fetch_mlb_games(sport="MLB")  # type: ignore
            # Create at most 2 synthetic derived markets from games
            for g in games[:2]:
                # Minimal pseudo probability heuristic placeholder
                fair_prob = 0.55
                real_markets.append(
                    CandidateMarket(
                        id=f"mlb-game-{getattr(g, 'id', 'x')}\n",
                        sport="MLB",
                        player=None,
                        market="Total Runs Over",
                        line=8.5,
                        fair_prob=fair_prob,
                        market_odds=-110,
                        source_book="SynthBook",
                    )
                )
        # Could extend for NBA/NFL similarly later.
    except Exception as e:  # log once per process
        logger.debug(f"EV adapter real integration unavailable, using samples: {e}")

    if real_markets:
        if sport:
            real_markets = [c for c in real_markets if c.sport.lower() == sport.lower()]
        return real_markets

    # Fallback to static deterministic samples
    if sport:
        filtered = [c for c in SAMPLE_OPPORTUNITIES if c.sport.lower() == sport.lower()]
        if filtered:
            return filtered
    return SAMPLE_OPPORTUNITIES.copy()


__all__ = ["CandidateMarket", "fetch_candidate_markets", "SAMPLE_OPPORTUNITIES"]
