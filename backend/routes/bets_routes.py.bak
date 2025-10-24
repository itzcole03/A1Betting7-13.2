from typing import List, Optional

from fastapi import APIRouter, Query, Body, HTTPException
from pydantic import ValidationError
from fastapi.exceptions import RequestValidationError

from backend.services.unified_error_handler import unified_error_handler
from backend.betting.bet_models import BetCreate, BetRecord, ClosingUpdateRequest
from backend.betting.bet_store import bet_store
from backend.betting.clv_service import compute_clv_for_bets
from backend.betting.odds_normalizer import to_implied_prob
from backend.betting.odds_drift_sim import simulate_current_american, ENABLE_ODDS_DRIFT_SIM
from backend.services.unified_logging import get_logger, LogComponent, LogContext


try:  # Attempt to import a helper for sample odds lookup if exists
    from backend.betting.ev_data_adapter import get_sample_market_odds_for_bet  # type: ignore
except Exception:  # pragma: no cover - optional helper
    get_sample_market_odds_for_bet = None  # type: ignore


router = APIRouter(prefix="/api/bets", tags=["bets"])
logger = get_logger("bets_routes")


async def _market_lookup(bet: BetRecord) -> Optional[int]:
    """Return current market odds for a bet.

    For now uses a sample helper if present. Fallback returns placed_odds so CLV=0.
    Returning None would skip computation; returning placed_odds allows deterministic 0 CLV.
    """
    # If CLV already computed, reuse stored closing_odds (idempotent behavior)
    if bet.clv_pct is not None and bet.closing_odds is not None:
        return bet.closing_odds

    # Prefer sample helper if available (could represent future real odds ingestion)
    if get_sample_market_odds_for_bet:
        try:
            val = await get_sample_market_odds_for_bet(bet)  # type: ignore
            if val is not None:
                return val
        except Exception:  # pragma: no cover
            pass

    # Apply simulated drift if enabled; otherwise use placed odds
    if ENABLE_ODDS_DRIFT_SIM:
        return simulate_current_american(bet.placed_odds, bet.id)
    return bet.placed_odds


@router.post("", response_model=BetRecord)
async def place_bet(payload: BetCreate):
    try:
        implied = to_implied_prob(payload.placed_odds)
        record = BetRecord.from_create(payload, implied)
        await bet_store.add_bet(record)
        logger.info(
            "Bet placed",
            context=LogContext(component=LogComponent.BUSINESS_LOGIC, operation="place_bet"),
            bet_id=record.id,
            sport=record.sport,
            market=record.market,
        )
        return record
    except (ValidationError, RequestValidationError, ValueError) as e:
        # Map to HTTP 422 with consistent payload
        logger.warning(
            "Bet validation failed",
            context=LogContext(component=LogComponent.BUSINESS_LOGIC, operation="place_bet"),
            error=str(e),
        )
        raise HTTPException(status_code=422, detail={"error": "validation_error", "message": str(e)})
    except Exception as e:  # pragma: no cover - safety
        return unified_error_handler.handle_error(e)


@router.get("", response_model=List[BetRecord])
async def list_bets(
    sport: Optional[str] = Query(None),
    with_clv_only: bool = Query(False),
):
    try:
        return await bet_store.list_bets(sport=sport, with_clv_only=with_clv_only)
    except Exception as e:  # pragma: no cover
        return unified_error_handler.handle_error(e)


@router.post("/closing-update")
async def update_closing_lines(body: ClosingUpdateRequest = Body(...)):
    try:
        if body.ids:
            bets = await bet_store.get_by_ids(body.ids)
        else:
            bets = await bet_store.list_bets(sport=body.sport)
        updated = await compute_clv_for_bets(bets, _market_lookup)
        for b in updated:
            await bet_store.update_bet(b)
        logger.info(
            "Closing lines update",
            context=LogContext(component=LogComponent.BUSINESS_LOGIC, operation="closing_update"),
            updated=len(updated),
        )
        return {"updated": len(updated), "bet_ids": [b.id for b in updated]}
    except Exception as e:  # pragma: no cover
        return unified_error_handler.handle_error(e)
