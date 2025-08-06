"""
API Models for A1Betting Backend

This module contains all Pydantic models used in the API responses and requests.
Models are organized by functionality and imported by the main application.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

# ==========================================================================
# BET ANALYSIS RESPONSE MODEL (moved from routes/propollama.py)
# ==========================================================================


# =========================
# ENRICHED PROP MODEL (for detailed frontend display)
# =========================


class PlayerInfo(BaseModel):
    """Player information for enriched prop display."""

    name: str = Field(..., description="Player's full name")
    team: str = Field(..., description="Player's team name or abbreviation")
    position: str = Field(..., description="Player's position (e.g., 'P', 'OF')")
    image_url: Optional[str] = Field(None, description="URL to player image/avatar")
    score: Optional[float] = Field(
        None, description="Player's projected or actual score"
    )


class StatisticPoint(BaseModel):
    """Single statistic for a player or prop (e.g., 'AVG', 'HR')."""

    label: str = Field(..., description="Label for the statistic (e.g., 'AVG', 'HR')")
    value: float = Field(..., description="Value for the statistic")


class Insight(BaseModel):
    """Insight or note about the prop, player, or matchup."""

    type: str = Field(
        ..., description="Type of insight (e.g., 'trend', 'defense', 'pitcher')"
    )
    text: str = Field(..., description="Insight text or explanation")


class EnrichedProp(BaseModel):
    """Detailed prop model for frontend display, including player info, stats, and insights."""

    player_info: PlayerInfo = Field(..., description="Player information")
    summary: str = Field(..., description="Short summary of the prop or bet")
    deep_analysis: str = Field(..., description="Detailed analysis and reasoning")
    statistics: List[StatisticPoint] = Field(
        ..., description="List of key statistics for the prop/player"
    )
    insights: List[Insight] = Field(
        ..., description="List of insights or notes about the prop/player"
    )
    # Optionally, keep legacy fields for compatibility
    prop_id: Optional[str] = Field(
        None, description="Legacy: Unique identifier for the prop"
    )
    stat_type: Optional[str] = Field(
        None, description="Legacy: Statistic type (e.g., 'HR', 'SO')"
    )
    line: Optional[float] = Field(None, description="Legacy: Betting line for the prop")
    recommendation: Optional[str] = Field(
        None, description="Legacy: Model recommendation (e.g., 'over', 'under')"
    )
    confidence: Optional[float] = Field(
        None, description="Legacy: Model confidence score (0-1)"
    )


class BetAnalysisResponse(BaseModel):
    """Response model for bet analysis (multi-prop, frontend-ready)."""

    analysis: str = Field(..., description="Overall analysis summary for the bet(s)")
    confidence: float = Field(..., description="Overall model confidence (0-1)")
    recommendation: str = Field(
        ..., description="Overall recommendation (e.g., 'over', 'under', 'no bet')"
    )
    key_factors: List[str] = Field(
        ..., description="List of key factors influencing the analysis"
    )
    processing_time: float = Field(
        ..., description="Time taken to process the analysis (seconds)"
    )
    cached: bool = Field(
        default=False, description="Whether the response was served from cache"
    )
    enriched_props: List[EnrichedProp] = Field(
        default_factory=list, description="List of enriched prop objects for display"
    )
    error: str = Field(
        default="", description="Error message if any (empty string if no error)"
    )


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
    risk_tolerance: Optional[str] = "moderate"
    preferred_stake: Optional[float] = 50.0
    bookmakers: Optional[list] = Field(default_factory=list)


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
