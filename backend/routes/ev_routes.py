from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional

from backend.services import ev_service

router = APIRouter()


class EVRequest(BaseModel):
    probability: float = Field(..., ge=0.0, le=1.0, description="Projected win probability (0..1)")
    odds: float = Field(..., description="Market odds (decimal or American)")
    odds_format: str | None = Field(None, description="Optional: 'decimal' or 'american'. If omitted, parser will guess")
    stake: float = Field(1.0, gt=0.0, description="Stake amount")


class EVResponse(BaseModel):
    success: bool
    data: dict
    error: dict | None = None


@router.post("/calc", response_model=EVResponse)
async def calculate_ev(payload: EVRequest):
    try:
        # Determine decimal odds
        if payload.odds_format and payload.odds_format.lower() == "american":
            decimal = ev_service.american_to_decimal(payload.odds)
        elif payload.odds_format and payload.odds_format.lower() == "decimal":
            decimal = float(payload.odds)
        else:
            decimal = ev_service.parse_odds(payload.odds)

        ev, ev_pct = ev_service.compute_ev(payload.probability, decimal, stake=payload.stake)

        label = "+EV" if ev > 0 else ("ZeroEV" if abs(ev) < 1e-9 else "-EV")

        return {
            "success": True,
            "data": {
                "probability": payload.probability,
                "odds_decimal": decimal,
                "stake": payload.stake,
                "ev": ev,
                "ev_pct": ev_pct,
                "label": label,
            },
            "error": None,
        }
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class BatchItem(BaseModel):
    id: str
    probability: float = Field(..., ge=0.0, le=1.0)
    odds: float
    odds_format: str | None = None
    stake: float = 1.0


class BatchResponseItem(BaseModel):
    id: str
    probability: float
    odds_decimal: float
    stake: float
    ev: float
    ev_pct: float
    is_plus_ev: bool


class BatchResponse(BaseModel):
    success: bool
    results: List[BatchResponseItem]


@router.post("/feed", response_model=BatchResponse)
async def ev_feed_batch(items: List[BatchItem]):
    if not items:
        raise HTTPException(status_code=400, detail="No items provided")

    results: List[BatchResponseItem] = []
    for it in items:
        try:
            # determine decimal odds
            if it.odds_format and it.odds_format.lower() == "american":
                decimal = ev_service.american_to_decimal(it.odds)
            elif it.odds_format and it.odds_format.lower() == "decimal":
                decimal = float(it.odds)
            else:
                decimal = ev_service.parse_odds(it.odds)

            ev, ev_pct = ev_service.compute_ev(it.probability, decimal, stake=it.stake)

            results.append(
                BatchResponseItem(
                    id=it.id,
                    probability=it.probability,
                    odds_decimal=decimal,
                    stake=it.stake,
                    ev=ev,
                    ev_pct=ev_pct,
                    is_plus_ev=(ev > 0),
                )
            )
        except Exception as e:
            raise HTTPException(status_code=422, detail=str(e))

    return BatchResponse(success=True, results=results)
