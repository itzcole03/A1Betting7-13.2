from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

Side = Literal["over", "under"]


class BetCreate(BaseModel):
    sport: str
    player: Optional[str] = None
    market: str
    line: float
    side: Side
    stake: float = Field(gt=0)
    placed_odds: int

    @field_validator("sport", "market")
    def not_empty(cls, v: str):
        if not v or not v.strip():
            raise ValueError("must not be empty")
        return v.strip()


class BetRecord(BaseModel):
    id: str
    sport: str
    player: Optional[str]
    market: str
    line: float
    side: Side
    stake: float
    placed_odds: int
    placed_implied_prob: float
    timestamp_placed: datetime
    closing_odds: Optional[int] = None
    closing_implied_prob: Optional[float] = None
    clv_pct: Optional[float] = None

    model_config = ConfigDict(orm_mode=True)

    @classmethod
    def from_create(cls, data: "BetCreate", placed_implied_prob: float) -> "BetRecord":
        return cls(
            id=str(uuid.uuid4()),
            sport=data.sport,
            player=data.player,
            market=data.market,
            line=data.line,
            side=data.side,
            stake=data.stake,
            placed_odds=data.placed_odds,
            placed_implied_prob=placed_implied_prob,
            timestamp_placed=datetime.now(timezone.utc),
        )


class ClosingUpdateRequest(BaseModel):
    ids: Optional[List[str]] = None
    sport: Optional[str] = None

    @field_validator("ids")
    def non_empty_ids(cls, v):
        if v is not None and len(v) == 0:
            raise ValueError("ids cannot be empty list")
        return v
