"""PrizePicks models."""

from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class PlayerProp(BaseModel):
    id: str
    player: str
    team: str
    opponent: str
    stat: str

    trendValue: Optional[float] = None


class ExpandedPlayerProp(BaseModel):
    id: str
    stat: str
    line: float
    overOdds: int
    underOdds: int
    confidence: int
    aiRecommendation: str
    reasoning: str
    pickType: Optional[str] = "normal"
    expectedValue: float
    volume: int
    oddsExplanation: str


class PlayerDetails(BaseModel):
    player: str
    team: str
    opponent: str
    position: str
    sport: str
    gameTime: str
    seasonStats: Dict[str, float]
    recentForm: List[str]
    props: List[ExpandedPlayerProp]


class LineupRequest(BaseModel):
    picks: List[SelectedPick]


class LineupResponse(BaseModel):
    id: str
    totalOdds: float
    potentialPayout: float
    confidence: int
    isValid: bool
    violations: Optional[List[str]] = None


# Prediction Models
