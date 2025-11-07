from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Literal
import math

class OddsSnapshot(BaseModel):
    id: str
    book: str
    sport: str
    market: str
    selection_key: str
    player: Optional[str] = None
    team: Optional[str] = None
    line: Optional[float] = None
    side: Literal["over", "under"] = "over"
    american_odds: int = Field(..., description="American odds (e.g., -110, +125)")
    implied_prob: float = Field(..., ge=0, le=1)
    captured_at: datetime

    def midpoint_implied(self) -> float:
        # In future could incorporate vig removal; for now implied_prob already normalized
        return self.implied_prob

class ConsensusEntry(BaseModel):
    selection_key: str
    sport: str
    market: str
    line: Optional[float]
    consensus_implied_prob: float
    consensus_american: int
    books: int
    last_updated: datetime
    projection_prob: Optional[float] = None
    ev_edge_pct: Optional[float] = None

    @staticmethod
    def implied_to_american(p: float) -> int:
        if p <= 0:
            return 400
        if p >= 1:
            return -400
        if p >= 0.5:
            return int(round(-100 * p / (1 - p)))
        return int(round(100 * (1 - p) / p))
