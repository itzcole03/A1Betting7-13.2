"""
API Models for A1Betting Backend

This module contains all Pydantic models used in the API responses and requests.
Models are organized by functionality and imported by the main application.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


# ============================================================================
# HEALTH CHECK MODELS
# ============================================================================

class HealthCheckResponse(BaseModel):
    """Health check response model"""

    status: str = Field(default="unknown", description="Overall system status")
    timestamp: datetime = Field(
        default_factory=datetime.now, description="Health check timestamp"
    )
    version: str = Field(default="1.0.0", description="Application version")
    uptime: float = Field(default=0.0, description="System uptime in seconds")
    services: Dict[str, str] = Field(
        default_factory=dict, description="Status of individual services"
    )


# ============================================================================
# BETTING MODELS
# ============================================================================

class BettingOpportunity(BaseModel):
    """Betting opportunity model"""

    id: str
    sport: str
    event: str
    market: str
    odds: float
    probability: float
    expected_value: float
    kelly_fraction: float
    confidence: float
    risk_level: str
    recommendation: str


class ArbitrageOpportunity(BaseModel):
    """Arbitrage opportunity model"""

    id: str
    sport: str
    event: str
    bookmaker_a: str
    bookmaker_b: str
    odds_a: float
    odds_b: float
    profit_margin: float
    required_stake: float


# ============================================================================
# PERFORMANCE MODELS
# ============================================================================

class PerformanceStats(BaseModel):
    """Performance statistics model"""

    today_profit: float
    weekly_profit: float
    monthly_profit: float
    total_bets: int
    win_rate: float
    avg_odds: float
    roi_percent: float
    active_bets: int


class TransactionModel(BaseModel):
    """Transaction model"""

    id: int
    user_id: int
    match_id: int
    amount: float
    odds: float
    bet_type: str
    selection: str
    potential_winnings: float
    status: str
    placed_at: datetime
    settled_at: Optional[datetime]
    profit_loss: float


class TransactionsResponse(BaseModel):
    """Transactions response model"""

    transactions: List[TransactionModel]
    total_count: int


class ActiveBetModel(BaseModel):
    """Active bet model"""

    id: int
    user_id: int
    match_id: int
    amount: float
    odds: float
    bet_type: str
    selection: str
    potential_winnings: float
    status: str
    placed_at: datetime
    settled_at: Optional[datetime]
    profit_loss: float


class ActiveBetsResponse(BaseModel):
    """Active bets response model"""

    active_bets: List[ActiveBetModel]
    total_count: int


# ============================================================================
# RISK MANAGEMENT MODELS
# ============================================================================

class RiskProfileModel(BaseModel):
    """Risk profile model"""

    id: str
    max_kelly_fraction: float
    min_win_probability: float
    min_expected_value: float


class RiskProfilesResponse(BaseModel):
    """Risk profiles response model"""

    profiles: List[RiskProfileModel]


# ============================================================================
# USER MODELS
# ============================================================================

class UserProfileResponse(BaseModel):
    """Response model for user profiles."""

    user_id: str
    risk_tolerance: str
    preferred_stake: float
    bookmakers: List[str]


class UserRegistration(BaseModel):
    """User registration request model"""

    username: str
    email: str
    password: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None


class UserLogin(BaseModel):
    """User login request model"""

    username: str
    password: str


class TokenResponse(BaseModel):
    """Token response model"""

    access_token: str
    refresh_token: Optional[str] = None
    token_type: str
    user: Dict[str, Any]


# ============================================================================
# DATA MODELS
# ============================================================================

class HistoricalGameResult(BaseModel):
    """Historical game result model"""

    sport: str
    event: str
    date: datetime
    homeTeam: str
    awayTeam: str
    homeScore: int
    awayScore: int
    status: str


class UnifiedFeed(BaseModel):
    """Unified data feed model"""

    betting_opportunities: List[BettingOpportunity]
    performance_stats: PerformanceStats
    prizepicks_props: List[Dict[str, Any]]
    news_headlines: List[str]
    injuries: List[Dict[str, Any]]
    historical: List[HistoricalGameResult]


# ============================================================================
# PREDICTION MODELS
# ============================================================================

class MatchPredictionRequest(BaseModel):
    """Match prediction request model"""

    homeTeam: str
    awayTeam: str
    league: str
    date: str


class RecommendedBet(BaseModel):
    """Recommended bet model"""

    type: str
    stake: float
    odds: float
    expectedValue: float
    confidence: float


class Insights(BaseModel):
    """Insights model"""

    keyFactors: List[str]
    riskLevel: str
    valueAssessment: str
    modelConsensus: float


class MatchPredictionResponse(BaseModel):
    """Match prediction response model"""

    homeWinProbability: float
    awayWinProbability: float
    drawProbability: float
    recommendedBet: RecommendedBet
    insights: Insights


# ============================================================================
# FEATURE ENGINEERING MODELS
# ============================================================================

class InputData(BaseModel):
    """Input data model for feature engineering"""

    game_id: int
    team_stats: Dict[str, float]
    player_stats: Dict[str, float]


# ============================================================================
# SPECIALIST DATA MODELS
# ============================================================================

class TeamSimple(BaseModel):
    """Simple team model"""

    id: str
    name: str


class GameDataModel(BaseModel):
    """Game data model"""

    id: str
    sport: str
    league: str
    homeTeam: TeamSimple
    awayTeam: TeamSimple
    startTime: datetime
    status: str


class OddOutcome(BaseModel):
    """Odd outcome model"""

    name: str
    odds: float
    line: Optional[float] = None


class OddsDataModel(BaseModel):
    """Odds data model"""

    eventId: str
    bookmaker: str
    market: str
    outcomes: List[OddOutcome]
    timestamp: float 