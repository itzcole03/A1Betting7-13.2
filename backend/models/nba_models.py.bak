"""
NBA Data Models for A1Betting Backend

Defines Pydantic models for NBA teams, players, games, and odds data.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class NBATeam(BaseModel):
    """NBA Team data model"""

    id: int
    name: str
    full_name: str
    abbreviation: str
    city: str
    conference: str
    division: str


class NBAPlayer(BaseModel):
    """NBA Player data model"""

    id: int
    first_name: str
    last_name: str
    position: Optional[str] = None
    height_feet: Optional[int] = None
    height_inches: Optional[int] = None
    weight_pounds: Optional[int] = None
    team: Optional[NBATeam] = None


class NBAGame(BaseModel):
    """NBA Game data model"""

    id: int
    date: datetime
    season: int
    status: str
    time: Optional[str] = None
    home_team: NBATeam
    visitor_team: NBATeam
    home_team_score: Optional[int] = None
    visitor_team_score: Optional[int] = None
    period: Optional[int] = None
    postseason: bool = False


class NBAOdds(BaseModel):
    """NBA Betting Odds data model"""

    event_id: str
    event_name: str
    start_time: datetime
    home_team: str
    away_team: str
    provider: str

    # Moneyline odds
    home_ml: Optional[float] = None
    away_ml: Optional[float] = None

    # Spread betting
    home_spread: Optional[float] = None
    home_spread_odds: Optional[float] = None
    away_spread: Optional[float] = None
    away_spread_odds: Optional[float] = None

    # Total points
    total_line: Optional[float] = None
    over_odds: Optional[float] = None
    under_odds: Optional[float] = None

    # Metadata
    confidence: float = Field(default=75.0, ge=0.0, le=100.0)
    last_updated: datetime = Field(default_factory=datetime.now)


class NBAOddsComparison(BaseModel):
    """NBA Odds Comparison Response"""

    status: str
    sport: str = "NBA"
    odds: List[NBAOdds]
    games_count: int
    providers: List[str]
    last_updated: datetime
    error: Optional[str] = None


class NBAAnalytics(BaseModel):
    """NBA Analytics data model"""

    game_id: int
    home_team_stats: Dict[str, Any]
    away_team_stats: Dict[str, Any]
    predictions: Dict[str, Any]
    confidence_scores: Dict[str, float]
    key_factors: List[str]
    recommendation: str


class NBAPropBet(BaseModel):
    """NBA Proposition Bet data model"""

    id: str
    player_id: int
    player_name: str
    team: str
    stat_type: str  # points, rebounds, assists, etc.
    line: float
    over_odds: float
    under_odds: float
    provider: str
    confidence: float = Field(default=75.0, ge=0.0, le=100.0)
    analysis: Optional[str] = None


class NBATeamStats(BaseModel):
    """NBA Team Statistics model"""

    team_id: int
    season: int
    games_played: int
    wins: int
    losses: int
    win_percentage: float

    # Offensive stats
    points_per_game: float
    field_goal_percentage: float
    three_point_percentage: float
    free_throw_percentage: float

    # Defensive stats
    points_allowed_per_game: float
    defensive_rating: float

    # Advanced stats
    offensive_rating: float
    net_rating: float
    pace: float


class NBAPlayerStats(BaseModel):
    """NBA Player Statistics model"""

    player_id: int
    season: int
    team_id: int
    games_played: int
    minutes_per_game: float

    # Basic stats
    points_per_game: float
    rebounds_per_game: float
    assists_per_game: float
    steals_per_game: float
    blocks_per_game: float
    turnovers_per_game: float

    # Shooting stats
    field_goal_percentage: float
    three_point_percentage: float
    free_throw_percentage: float

    # Advanced stats
    player_efficiency_rating: Optional[float] = None
    true_shooting_percentage: Optional[float] = None
    usage_rate: Optional[float] = None
