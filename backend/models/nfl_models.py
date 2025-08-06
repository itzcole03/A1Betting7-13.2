"""
NFL Data Models for A1Betting Backend

Pydantic models for NFL teams, players, games, and odds data from ESPN API.
"""

from datetime import datetime
from typing import Dict, List, Optional

from pydantic import BaseModel, Field


class NFLTeam(BaseModel):
    """NFL team data model"""

    id: int
    name: str
    displayName: str
    shortDisplayName: str
    abbreviation: str
    location: str
    color: Optional[str] = None
    alternateColor: Optional[str] = None
    logoUrl: Optional[str] = None


class NFLPlayer(BaseModel):
    """NFL player data model"""

    id: int
    fullName: str
    displayName: str
    shortName: str
    position: Optional[str] = None
    jersey: Optional[str] = None
    age: Optional[int] = None
    height: Optional[str] = None
    weight: Optional[int] = None
    team: Optional[NFLTeam] = None
    active: bool = True


class NFLGameStatus(BaseModel):
    """NFL game status information"""

    clock: float = 0.0
    displayClock: str = "0:00"
    period: int = 0
    type: Dict = Field(default_factory=dict)


class NFLCompetitor(BaseModel):
    """NFL game competitor (team) information"""

    id: str
    team: NFLTeam
    score: Optional[str] = None
    homeAway: str  # "home" or "away"
    winner: bool = False
    records: List[Dict] = Field(default_factory=list)


class NFLGame(BaseModel):
    """NFL game data model"""

    id: str
    uid: str
    date: datetime
    name: str
    shortName: str
    season: Dict = Field(default_factory=dict)
    seasonType: Dict = Field(default_factory=dict)
    week: Dict = Field(default_factory=dict)
    timeValid: bool = True
    neutralSite: bool = False
    conferenceCompetition: bool = False
    playByPlayAvailable: bool = False
    status: NFLGameStatus
    competitors: List[NFLCompetitor]
    venue: Optional[Dict] = None


class NFLOdds(BaseModel):
    """NFL betting odds information"""

    provider: Dict = Field(default_factory=dict)
    details: Optional[str] = None
    overUnder: Optional[float] = None
    spread: Optional[float] = None
    overOdds: Optional[int] = None
    underOdds: Optional[int] = None
    awayTeamOdds: Optional[Dict] = None
    homeTeamOdds: Optional[Dict] = None
    moneyline: Optional[Dict] = None


class NFLGameOdds(BaseModel):
    """NFL game with odds information"""

    game: NFLGame
    odds: List[NFLOdds] = Field(default_factory=list)


class NFLStanding(BaseModel):
    """NFL team standings information"""

    team: NFLTeam
    stats: List[Dict] = Field(default_factory=list)
    note: Optional[str] = None


class NFLConferenceStandings(BaseModel):
    """NFL conference standings"""

    name: str
    shortName: str
    standings: List[NFLStanding]


class NFLLeagueStandings(BaseModel):
    """NFL league standings"""

    season: int
    seasonType: int
    conferences: List[NFLConferenceStandings]


class NFLPlayerStats(BaseModel):
    """NFL player statistics"""

    player: NFLPlayer
    team: NFLTeam
    stats: Dict = Field(default_factory=dict)
    splits: Optional[Dict] = None


class NFLTeamStats(BaseModel):
    """NFL team statistics"""

    team: NFLTeam
    stats: Dict = Field(default_factory=dict)
    splits: Optional[Dict] = None


class NFLGameSummary(BaseModel):
    """NFL game summary with detailed information"""

    game: NFLGame
    boxscore: Optional[Dict] = None
    recap: Optional[Dict] = None
    news: Optional[Dict] = None
    keyEvents: List[Dict] = Field(default_factory=list)


class NFLSchedule(BaseModel):
    """NFL schedule information"""

    season: int
    seasonType: int
    week: Optional[int] = None
    games: List[NFLGame]


class NFLScoreboard(BaseModel):
    """NFL scoreboard with current games"""

    season: int
    seasonType: int
    week: int
    games: List[NFLGame]
    events: List[Dict] = Field(default_factory=list)


class NFLHealthCheck(BaseModel):
    """NFL service health check response"""

    status: str
    service: str
    api_status: Optional[str] = None
    message: str = "NFL service operational via ESPN API"
    last_updated: Optional[datetime] = None
    total_teams: Optional[int] = None
    total_active_players: Optional[int] = None


class NFLOddsComparison(BaseModel):
    """NFL odds comparison across multiple providers"""

    game_id: str
    game_name: str
    date: datetime
    odds_providers: List[NFLOdds] = Field(default_factory=list)
    best_odds: Optional[Dict] = None
    arbitrage_opportunities: List[Dict] = Field(default_factory=list)


class NFLAnalytics(BaseModel):
    """NFL analytics and insights"""

    game_id: Optional[str] = None
    team_id: Optional[str] = None
    analytics_type: str
    metrics: Dict = Field(default_factory=dict)
    insights: List[str] = Field(default_factory=list)
    confidence_score: Optional[float] = None
    generated_at: datetime = Field(default_factory=datetime.utcnow)


class NFLBetAnalysis(BaseModel):
    """NFL betting analysis response"""

    game: NFLGame
    odds: List[NFLOdds] = Field(default_factory=list)
    analytics: Optional[NFLAnalytics] = None
    recommendation: Optional[str] = None
    confidence: Optional[float] = None
    risk_level: str = "medium"
    key_factors: List[str] = Field(default_factory=list)
