import asyncio
from collections import defaultdict, deque
from typing import Dict, List, Deque
from .odds_models import OddsSnapshot

class OddsSnapshotStore:
    def __init__(self, history_limit: int = 50):
        self._latest: Dict[str, OddsSnapshot] = {}
        self._history: Dict[str, Deque[OddsSnapshot]] = defaultdict(lambda: deque(maxlen=history_limit))
        self._lock = asyncio.Lock()

    @staticmethod
    def _key(s: OddsSnapshot) -> str:
        side = getattr(s, "side", "") or ""
        return f"{s.book}|{s.sport}|{s.market}|{s.selection_key}|{side}"

    async def add_snapshots(self, snaps: List[OddsSnapshot]):
        async with self._lock:
            for s in snaps:
                k = self._key(s)
                self._latest[k] = s
                self._history[k].append(s)

    async def get_latest(self, sport: str | None = None, market: str | None = None, limit: int = 200) -> List[OddsSnapshot]:
        async with self._lock:
            vals = list(self._latest.values())
        if sport:
            vals = [v for v in vals if v.sport.lower() == sport.lower()]
        if market:
            vals = [v for v in vals if v.market.lower() == market.lower()]
        return sorted(vals, key=lambda x: x.captured_at, reverse=True)[:limit]

    async def get_history(self, selection_key: str) -> List[OddsSnapshot]:
        async with self._lock:
            return [s for k, dq in self._history.items() for s in dq if s.selection_key == selection_key]

odds_snapshot_store = OddsSnapshotStore()
