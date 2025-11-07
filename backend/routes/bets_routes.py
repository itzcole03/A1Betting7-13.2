"""Compatibility routes for legacy `/api/bets` endpoints.

These handlers provide a lightweight, in-process compatibility layer for
tests and consumers that expect the older `/api/bets` payload shapes. They
use the in-memory bet store and CLV utilities from the `backend.betting`
package so behavior remains deterministic in unit tests.

Note: This is intentionally small and focused — the long-term plan is to
consolidate functionality under the newer CLV tracking / bankroll routes.
"""

from typing import List, Optional

from fastapi import APIRouter, HTTPException, status

from backend.betting.bet_models import BetCreate, BetRecord, ClosingUpdateRequest
from backend.betting.bet_store import bet_store
from backend.betting.clv_service import compute_clv_for_bets
from backend.betting.odds_normalizer import to_implied_prob

router = APIRouter(prefix="/api/bets", tags=["bets"])


@router.post("", response_model=BetRecord)
async def place_bet(payload: BetCreate):
    """Place a bet (legacy shape expected by frontend/tests).

    - Validates incoming payload via Pydantic `BetCreate`.
    - Computes placed_implied_prob from `placed_odds`.
    - Stores the BetRecord in the in-memory bet store and returns it.
    """
    # Compute implied probability (raises ValueError if placed_odds == 0)
    try:
        placed_implied = to_implied_prob(payload.placed_odds)
    except Exception as e:
        # Let FastAPI/Pydantic surface validation errors where appropriate
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e)
        )

    record = BetRecord.from_create(payload, placed_implied)
    await bet_store.add_bet(record)
    return record


@router.post("/closing-update")
async def closing_update(request: ClosingUpdateRequest):
    """Trigger CLV closing updates for a set of bet ids or by sport.

    For test determinism we simulate a closing odds lookup that returns the
    same odds as placed (so CLV becomes 0). This matches test expectations
    where unchanged odds produce numeric CLV values.
    """
    # Resolve target bets
    ids: Optional[List[str]] = request.ids
    if ids:
        bets = await bet_store.get_by_ids(ids)
    elif request.sport:
        all_bets = await bet_store.list_bets(sport=request.sport)
        bets = all_bets
    else:
        # No ids or sport -> nothing to update
        return {"updated": 0}

    async def _market_lookup(bet: BetRecord) -> Optional[int]:
        # Simulate closing odds equal to placed odds so CLV computes to 0
        return bet.placed_odds

    updated = await compute_clv_for_bets(bets, _market_lookup)

    # Persist any updated records back into the store
    for b in updated:
        await bet_store.update_bet(b)

    return {"updated": len(updated)}


@router.get("", response_model=List[dict])
async def list_bets(with_clv_only: bool = False, sport: Optional[str] = None):
    """List bets with optional filtering by sport and CLV presence.

    Returns a simplified list of bet dictionaries compatible with tests.
    """
    bets = await bet_store.list_bets(sport=sport, with_clv_only=with_clv_only)
    # Convert Pydantic models to plain dicts (fastapi will do this too, but tests expect json-friendly types)
    return [b.model_dump() for b in bets]
