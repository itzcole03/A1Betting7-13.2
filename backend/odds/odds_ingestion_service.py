import hashlib
import time
import uuid
from datetime import datetime, timezone
from typing import List

from backend.services.unified_logging import get_logger, LogComponent, LogContext
from backend.betting.odds_normalizer import to_implied_prob
from .odds_models import OddsSnapshot
from .odds_snapshot_store import odds_snapshot_store

logger = get_logger("odds_ingestion")

BOOKS = ["FanDuel", "DraftKings", "Caesars", "BetMGM"]
WINDOW_MIN = 2

SELECTIONS = [
    {"selection_key": "player:MLB:AaronJudge:HR", "player": "Aaron Judge", "market": "player_props", "line": 0.5},
    {"selection_key": "player:MLB:ShoheiOhtani:SO", "player": "Shohei Ohtani", "market": "player_props", "line": 6.5},
]


def _window_bucket() -> int:
    return int(time.time() // (WINDOW_MIN * 60))


def _gen_odds(base: int, salt: str) -> int:
    h = hashlib.sha256(f"{salt}:{_window_bucket()}".encode()).hexdigest()
    span = int(h[:4], 16) / 65535.0
    drift = int((span * 40) - 20)  # -20..+20
    o = base + drift
    if o == 0:
        o += 1
    if o > 400:
        o = 400
    if o < -400:
        o = -400
    return o


SIDE_VIG = 0.012  # small vig differential for derived under

def _derive_under_odds(over_american: int, salt: str) -> int:
    """Deterministically derive an under price from an over American line.

    Adds a slight vig + hash-based adjustment per window to keep values stable within a time bucket.
    """
    if over_american > 0:
        p_over = 100 / (over_american + 100)
    else:
        p_over = (-over_american) / ((-over_american) + 100)
    h = hashlib.sha256(f"UNDER:{salt}:{_window_bucket()}".encode()).hexdigest()
    adj = (int(h[:2], 16) / 255) * 0.01  # 0..0.01
    p_under = min(max(1 - p_over + SIDE_VIG + adj, 0.01), 0.99)
    if p_under >= 0.5:
        am = int(round(-100 * p_under / (1 - p_under)))
    else:
        am = int(round(100 * (1 - p_under) / p_under))
    if am == 0:
        am = -101
    if am > 400:
        am = 400
    if am < -400:
        am = -400
    return am

async def refresh_market(sport: str, market: str) -> List[OddsSnapshot]:
    snaps: List[OddsSnapshot] = []
    now = datetime.now(timezone.utc)
    for sel in SELECTIONS:
        if sel["market"] != market:
            continue
        base_line = sel["line"]
        for book in BOOKS:
            base_odds = -110 if book in ("FanDuel", "DraftKings") else -108
            over_american = _gen_odds(base_odds, f"{book}:{sel['selection_key']}:OVER")
            over_implied = to_implied_prob(over_american)
            snaps.append(
                OddsSnapshot(
                    id=str(uuid.uuid4()),
                    book=book,
                    sport=sport,
                    market=market,
                    selection_key=sel["selection_key"],
                    player=sel["player"],
                    line=base_line,
                    side="over",
                    american_odds=over_american,
                    implied_prob=over_implied,
                    captured_at=now,
                )
            )
            under_american = _derive_under_odds(over_american, f"{book}:{sel['selection_key']}")
            under_implied = to_implied_prob(under_american)
            snaps.append(
                OddsSnapshot(
                    id=str(uuid.uuid4()),
                    book=book,
                    sport=sport,
                    market=market,
                    selection_key=sel["selection_key"],
                    player=sel["player"],
                    line=base_line,
                    side="under",
                    american_odds=under_american,
                    implied_prob=under_implied,
                    captured_at=now,
                )
            )
    await odds_snapshot_store.add_snapshots(snaps)
    logger.info(
        "odds_ingestion:refreshed_two_way",
        context=LogContext(component=LogComponent.BUSINESS_LOGIC, operation="refresh_market"),
        count=len(snaps),
        sport=sport,
        market=market,
    )
    return snaps
