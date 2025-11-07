from typing import Iterable, Callable, Awaitable, List

from backend.services.unified_error_handler import unified_error_handler
from backend.betting.bet_models import BetRecord
from backend.betting.odds_normalizer import to_implied_prob
from backend.services.unified_logging import get_logger, LogComponent, LogContext

logger = get_logger("clv_service")


async def compute_clv_for_bets(
    bets: Iterable[BetRecord],
    market_lookup_func: Callable[[BetRecord], Awaitable[int | None]],
) -> List[BetRecord]:
    """Compute and populate CLV for provided bets using async odds lookup.

    market_lookup_func: async callable(bet: BetRecord) -> int | None  (closing odds)
    Returns list of updated bet records (those where CLV was computed).
    """
    updated: List[BetRecord] = []
    for bet in bets:
        try:
            if bet.clv_pct is not None:
                continue  # already computed
            closing_odds = await market_lookup_func(bet)
            if closing_odds is None:
                continue
            closing_implied = to_implied_prob(closing_odds)
            clv_pct = round((closing_implied - bet.placed_implied_prob) * 100, 4)
            bet.clv_pct = clv_pct
            bet.closing_odds = closing_odds
            bet.closing_implied_prob = closing_implied
            updated.append(bet)
            logger.info(
                "CLV computed",
                context=LogContext(component=LogComponent.BUSINESS_LOGIC, operation="compute_clv"),
                bet_id=bet.id,
                clv_pct=clv_pct,
                placed_odds=bet.placed_odds,
                closing_odds=closing_odds,
            )
        except Exception as e:  # pragma: no cover - defensive
            unified_error_handler.handle_error(e)
    return updated
