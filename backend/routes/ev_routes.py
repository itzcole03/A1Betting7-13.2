from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

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


from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

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
