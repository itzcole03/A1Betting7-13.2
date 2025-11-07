import asyncio
from typing import Dict, List, Optional

from backend.betting.bet_models import BetRecord
from backend.services.unified_logging import get_logger, LogComponent, LogContext

logger = get_logger("bet_store")


class InMemoryBetStore:
    def __init__(self):
        self._bets: Dict[str, BetRecord] = {}
        self._lock = asyncio.Lock()

    async def add_bet(self, bet: BetRecord) -> BetRecord:
        async with self._lock:
            self._bets[bet.id] = bet
            logger.info(
                "Bet stored",
                context=LogContext(component=LogComponent.BUSINESS_LOGIC, operation="add_bet"),
                bet_id=bet.id,
                sport=bet.sport,
                market=bet.market,
            )
            return bet

    async def list_bets(self, sport: Optional[str] = None, with_clv_only: bool = False) -> List[BetRecord]:
        async with self._lock:
            values = list(self._bets.values())
        if sport:
            sport_lower = sport.lower()
            values = [b for b in values if b.sport.lower() == sport_lower]
        if with_clv_only:
            values = [b for b in values if b.clv_pct is not None]
        return sorted(values, key=lambda b: b.timestamp_placed, reverse=True)

    async def get_by_ids(self, ids: List[str]) -> List[BetRecord]:
        async with self._lock:
            return [b for i, b in self._bets.items() if i in ids]

    async def update_bet(self, bet: BetRecord):
        async with self._lock:
            if bet.id in self._bets:
                self._bets[bet.id] = bet
                logger.debug(
                    "Bet updated",
                    context=LogContext(component=LogComponent.BUSINESS_LOGIC, operation="update_bet"),
                    bet_id=bet.id,
                    has_clv=bet.clv_pct is not None,
                )


bet_store = InMemoryBetStore()
