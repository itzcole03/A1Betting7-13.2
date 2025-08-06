"""
Comprehensive API Models for A1Betting Platform
Enhanced Pydantic models following PropGPT/PropFinder research insights for enterprise-grade API contracts
"""

from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from typing import Any, Dict, List, Optional, Union
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, model_validator
from pydantic.types import NonNegativeFloat, PositiveFloat, PositiveInt

# =============================================================================
# ENUMS AND CONSTANTS
# =============================================================================


class SportType(str, Enum):
    MLB = "MLB"
    NBA = "NBA"
    NFL = "NFL"
    NHL = "NHL"
    SOCCER = "SOCCER"
    TENNIS = "TENNIS"


class BetType(str, Enum):
    MONEYLINE = "moneyline"
    SPREAD = "spread"
    OVER_UNDER = "over_under"
    PROP = "prop"
    PARLAY = "parlay"


class PropType(str, Enum):
    PLAYER_POINTS = "player_points"
    PLAYER_REBOUNDS = "player_rebounds"
    PLAYER_ASSISTS = "player_assists"
    TEAM_TOTAL = "team_total"
    FIRST_INNING = "first_inning"
    STRIKEOUTS = "strikeouts"
    HOME_RUNS = "home_runs"
    RBI = "rbi"


class BetStatus(str, Enum):
    PENDING = "pending"
    WON = "won"
    LOST = "lost"
    CANCELLED = "cancelled"
    PUSHED = "pushed"


class AnalysisType(str, Enum):
    BASIC = "basic"
    ADVANCED = "advanced"
    ML_PREDICTION = "ml_prediction"
    COMPREHENSIVE = "comprehensive"


class DataSource(str, Enum):
    PRIZEPICKS = "prizepicks"
    SPORTSRADAR = "sportsradar"
    BASEBALL_SAVANT = "baseball_savant"
    ESPN = "espn"
    INTERNAL = "internal"


# =============================================================================
# BASE MODELS
# =============================================================================


class BaseAPIModel(BaseModel):
    """Base model for all API responses"""

    class Config:
        use_enum_values = True
        validate_by_name = True  # Updated for Pydantic v2
        json_encoders = {
            datetime: lambda dt: dt.isoformat(),
            Decimal: lambda d: float(d),
            UUID: lambda u: str(u),
        }


class TimestampMixin(BaseModel):
    """Mixin for timestamp fields"""

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)


class PaginationMeta(BaseModel):
    """Pagination metadata"""

    page: PositiveInt = Field(1, description="Current page number")
    per_page: PositiveInt = Field(25, description="Items per page")
    total: int = Field(description="Total number of items")
    pages: int = Field(description="Total number of pages")
    has_next: bool = Field(description="Whether there is a next page")
    has_prev: bool = Field(description="Whether there is a previous page")


# =============================================================================
# PLAYER AND TEAM MODELS
# =============================================================================


class Player(BaseAPIModel):
    """Player information model"""

    player_id: str = Field(..., description="Unique player identifier")
    name: str = Field(..., description="Player full name")
    team: str = Field(..., description="Current team abbreviation")
    position: str = Field(..., description="Player position")
    jersey_number: Optional[int] = Field(None, description="Jersey number")
    sport: SportType = Field(..., description="Sport type")
    active: bool = Field(True, description="Whether player is active")
    image_url: Optional[str] = Field(None, description="Player image URL")

    # Performance metadata
    season_stats: Optional[Dict[str, Any]] = Field(
        None, description="Current season statistics"
    )
    career_stats: Optional[Dict[str, Any]] = Field(
        None, description="Career statistics"
    )


class Team(BaseAPIModel):
    """Team information model"""

    team_id: str = Field(..., description="Unique team identifier")
    name: str = Field(..., description="Team full name")
    abbreviation: str = Field(..., description="Team abbreviation")
    city: str = Field(..., description="Team city")
    sport: SportType = Field(..., description="Sport type")
    division: Optional[str] = Field(None, description="Division/Conference")
    logo_url: Optional[str] = Field(None, description="Team logo URL")

    # Team metadata
    current_record: Optional[Dict[str, int]] = Field(
        None, description="Current season record"
    )
    home_venue: Optional[str] = Field(None, description="Home venue name")


# =============================================================================
# GAME AND MATCHUP MODELS
# =============================================================================


class Game(BaseAPIModel, TimestampMixin):
    """Game/Match information model"""

    game_id: str = Field(..., description="Unique game identifier")
    sport: SportType = Field(..., description="Sport type")

    # Team information
    home_team: str = Field(..., description="Home team abbreviation")
    away_team: str = Field(..., description="Away team abbreviation")
    home_team_id: str = Field(..., description="Home team unique ID")
    away_team_id: str = Field(..., description="Away team unique ID")

    # Game timing
    game_date: date = Field(..., description="Game date")
    game_time: Optional[datetime] = Field(None, description="Scheduled game time")
    status: str = Field("scheduled", description="Game status")

    # Scores (if completed/in-progress)
    home_score: Optional[int] = Field(None, description="Home team score")
    away_score: Optional[int] = Field(None, description="Away team score")
    inning_half: Optional[str] = Field(None, description="Current inning/period")

    # Weather and conditions
    weather: Optional[Dict[str, Any]] = Field(None, description="Weather conditions")
    venue: Optional[str] = Field(None, description="Venue name")

    # Odds and lines
    moneyline_home: Optional[float] = Field(
        None, description="Home team moneyline odds"
    )
    moneyline_away: Optional[float] = Field(
        None, description="Away team moneyline odds"
    )
    spread: Optional[float] = Field(None, description="Point spread")
    total: Optional[float] = Field(None, description="Over/under total")


# =============================================================================
# PROP AND BETTING MODELS
# =============================================================================


class PropBet(BaseAPIModel, TimestampMixin):
    """Individual prop bet model"""

    prop_id: str = Field(..., description="Unique prop identifier")
    player_id: Optional[str] = Field(None, description="Associated player ID")
    team_id: Optional[str] = Field(None, description="Associated team ID")
    game_id: str = Field(..., description="Associated game ID")

    # Prop details
    prop_type: PropType = Field(..., description="Type of prop bet")
    description: str = Field(..., description="Human-readable prop description")
    line: float = Field(..., description="Betting line/threshold")
    over_odds: float = Field(..., description="Over odds")
    under_odds: float = Field(..., description="Under odds")

    # Metadata
    source: DataSource = Field(..., description="Data source")
    sport: SportType = Field(..., description="Sport type")
    active: bool = Field(True, description="Whether prop is active")

    # Analysis fields
    confidence_score: Optional[float] = Field(
        None, ge=0, le=1, description="ML confidence score"
    )
    recommendation: Optional[str] = Field(None, description="AI recommendation")
    expected_value: Optional[float] = Field(
        None, description="Expected value calculation"
    )
    sharp_money: Optional[bool] = Field(None, description="Sharp money indicator")


class BetSlip(BaseAPIModel, TimestampMixin):
    """Bet slip for placing wagers"""

    bet_slip_id: str = Field(..., description="Unique bet slip identifier")
    user_id: str = Field(..., description="User who created the bet slip")

    # Bet details
    bets: List[PropBet] = Field(..., description="List of prop bets")
    bet_type: BetType = Field(..., description="Type of bet")
    stake: PositiveFloat = Field(..., description="Amount wagered")
    potential_payout: PositiveFloat = Field(..., description="Potential payout")
    odds: float = Field(..., description="Combined odds")

    # Status
    status: BetStatus = Field(BetStatus.PENDING, description="Current bet status")
    placed_at: Optional[datetime] = Field(None, description="When bet was placed")
    settled_at: Optional[datetime] = Field(None, description="When bet was settled")
    result: Optional[str] = Field(None, description="Bet result details")


# =============================================================================
# ANALYSIS AND PREDICTION MODELS
# =============================================================================


class MLPrediction(BaseAPIModel, TimestampMixin):
    """Machine learning prediction model"""

    prediction_id: str = Field(..., description="Unique prediction identifier")
    prop_id: str = Field(..., description="Associated prop bet ID")

    # Prediction details
    predicted_value: float = Field(..., description="Predicted numerical value")
    confidence: float = Field(..., ge=0, le=1, description="Prediction confidence")
    recommendation: str = Field(..., description="Recommendation (over/under)")

    # Model information
    model_name: str = Field(..., description="ML model used")
    model_version: str = Field(..., description="Model version")
    features_used: List[str] = Field(..., description="Features used in prediction")

    # Analysis metrics
    expected_value: Optional[float] = Field(None, description="Expected value")
    kelly_criterion: Optional[float] = Field(
        None, description="Kelly criterion bet size"
    )
    risk_level: str = Field("medium", description="Risk assessment")

    # SHAP explanations
    feature_importance: Optional[Dict[str, float]] = Field(
        None, description="Feature importance scores"
    )
    shap_values: Optional[Dict[str, float]] = Field(
        None, description="SHAP explanation values"
    )


class ComprehensiveAnalysis(BaseAPIModel, TimestampMixin):
    """Comprehensive prop analysis combining multiple data sources"""

    analysis_id: str = Field(..., description="Unique analysis identifier")
    prop_id: str = Field(..., description="Associated prop bet ID")
    analysis_type: AnalysisType = Field(..., description="Type of analysis performed")

    # Analysis results
    summary: str = Field(..., description="Analysis summary")
    detailed_breakdown: str = Field(..., description="Detailed analysis explanation")
    key_factors: List[str] = Field(
        ..., description="Key factors influencing the analysis"
    )

    # Statistical insights
    historical_performance: Dict[str, Any] = Field(
        ..., description="Historical performance data"
    )
    matchup_analysis: Dict[str, Any] = Field(
        ..., description="Matchup-specific analysis"
    )
    weather_impact: Optional[Dict[str, Any]] = Field(
        None, description="Weather impact analysis"
    )
    injury_considerations: Optional[List[str]] = Field(
        None, description="Injury-related factors"
    )

    # Advanced metrics
    statcast_metrics: Optional[Dict[str, float]] = Field(
        None, description="Baseball Savant metrics"
    )
    defensive_ratings: Optional[Dict[str, float]] = Field(
        None, description="Defensive performance metrics"
    )
    situational_stats: Optional[Dict[str, float]] = Field(
        None, description="Situational statistics"
    )

    # Predictions
    ml_prediction: Optional[MLPrediction] = Field(
        None, description="ML model prediction"
    )
    consensus_prediction: Optional[Dict[str, Any]] = Field(
        None, description="Consensus prediction"
    )

    # Processing metadata
    processing_time_ms: int = Field(..., description="Analysis processing time")
    data_sources_used: List[DataSource] = Field(
        ..., description="Data sources utilized"
    )
    cache_hit: bool = Field(False, description="Whether result was cached")


# =============================================================================
# REAL-TIME AND WEBSOCKET MODELS
# =============================================================================


class WebSocketMessage(BaseAPIModel):
    """WebSocket message format"""

    message_id: str = Field(..., description="Unique message identifier")
    message_type: str = Field(..., description="Type of message")
    channel: str = Field(..., description="Channel/topic")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    payload: Dict[str, Any] = Field(..., description="Message payload")

    # Optional metadata
    user_id: Optional[str] = Field(None, description="Target user ID")
    game_id: Optional[str] = Field(None, description="Associated game ID")
    priority: str = Field("normal", description="Message priority")


class LiveGameUpdate(BaseAPIModel):
    """Live game state update"""

    game_id: str = Field(..., description="Game identifier")
    update_type: str = Field(..., description="Type of update")
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    # Game state
    home_score: int = Field(..., description="Current home score")
    away_score: int = Field(..., description="Current away score")
    inning: Optional[int] = Field(None, description="Current inning")
    inning_half: Optional[str] = Field(None, description="Top/bottom of inning")
    outs: Optional[int] = Field(None, description="Current outs")

    # Play-by-play
    last_play: Optional[str] = Field(None, description="Description of last play")
    active_players: Optional[List[str]] = Field(
        None, description="Currently active players"
    )

    # Prop implications
    affected_props: List[str] = Field(
        default_factory=list, description="Props affected by update"
    )
    live_odds_changes: Optional[Dict[str, float]] = Field(
        None, description="Live odds updates"
    )


# =============================================================================
# USER AND PERFORMANCE MODELS
# =============================================================================


class UserProfile(BaseAPIModel, TimestampMixin):
    """User profile and preferences"""

    user_id: str = Field(..., description="Unique user identifier")
    username: str = Field(..., description="Username")
    email: str = Field(..., description="Email address")

    # Preferences
    favorite_sports: List[SportType] = Field(default_factory=list)
    risk_tolerance: str = Field("medium", description="Risk tolerance level")
    notification_preferences: Dict[str, bool] = Field(default_factory=dict)

    # Performance tracking
    total_bets: int = Field(0, description="Total bets placed")
    win_rate: float = Field(0.0, ge=0, le=1, description="Win percentage")
    roi: float = Field(0.0, description="Return on investment")
    profit_loss: float = Field(0.0, description="Total profit/loss")

    # Subscription and limits
    subscription_tier: str = Field("free", description="Subscription tier")
    daily_bet_limit: Optional[float] = Field(None, description="Daily betting limit")
    is_active: bool = Field(True, description="Account active status")


class PerformanceMetrics(BaseAPIModel):
    """System and user performance metrics"""

    metrics_id: str = Field(..., description="Unique metrics identifier")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    period: str = Field(..., description="Metrics period (daily/weekly/monthly)")

    # System metrics
    total_predictions: int = Field(..., description="Total predictions made")
    accuracy_rate: float = Field(..., ge=0, le=1, description="Prediction accuracy")
    avg_confidence: float = Field(
        ..., ge=0, le=1, description="Average confidence score"
    )
    avg_processing_time_ms: float = Field(..., description="Average processing time")

    # Business metrics
    active_users: int = Field(..., description="Number of active users")
    total_bets_placed: int = Field(..., description="Total bets placed")
    total_volume: float = Field(..., description="Total betting volume")
    revenue: float = Field(..., description="Revenue generated")

    # Data quality metrics
    data_freshness: float = Field(..., ge=0, le=1, description="Data freshness score")
    api_uptime: float = Field(..., ge=0, le=1, description="API uptime percentage")
    cache_hit_rate: float = Field(..., ge=0, le=1, description="Cache hit rate")


# =============================================================================
# API RESPONSE WRAPPER MODELS
# =============================================================================


class APIResponse(BaseAPIModel):
    """Standard API response wrapper"""

    success: bool = Field(..., description="Whether the request was successful")
    message: str = Field(..., description="Response message")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    request_id: Optional[str] = Field(None, description="Request tracking ID")

    @field_validator("message")
    @classmethod
    def validate_message(cls, v, values):
        if not v or len(v.strip()) == 0:
            # Note: In Pydantic v2, we need to handle success field differently
            return "Success"  # Default message
        return v


class PaginatedResponse(APIResponse):
    """Paginated API response"""

    pagination: PaginationMeta = Field(..., description="Pagination information")


class DataResponse(APIResponse):
    """API response with data payload"""

    data: Any = Field(..., description="Response data payload")


class ListResponse(APIResponse):
    """API response for list data with metadata"""

    data: List[Any] = Field(..., description="List of data items")
    total_count: int = Field(..., description="Total number of items")
    filters_applied: Optional[Dict[str, Any]] = Field(
        None, description="Applied filters"
    )


class ErrorResponse(APIResponse):
    """Error response model"""

    error_code: str = Field(..., description="Error code")
    error_details: Optional[Dict[str, Any]] = Field(
        None, description="Additional error details"
    )
    suggestions: Optional[List[str]] = Field(
        None, description="Suggested remediation steps"
    )

    def __init__(self, **data):
        super().__init__(success=False, **data)


# =============================================================================
# REQUEST MODELS
# =============================================================================


class PropAnalysisRequest(BaseAPIModel):
    """Request for prop bet analysis"""

    prop_ids: List[str] = Field(..., description="List of prop bet IDs to analyze")
    analysis_type: AnalysisType = Field(
        AnalysisType.BASIC, description="Type of analysis requested"
    )
    include_ml_prediction: bool = Field(True, description="Include ML predictions")
    include_historical: bool = Field(True, description="Include historical analysis")
    max_processing_time_ms: Optional[int] = Field(
        30000, description="Maximum processing time"
    )


class GamePropsRequest(BaseAPIModel):
    """Request for game props"""

    game_id: str = Field(..., description="Game identifier")
    sport: SportType = Field(..., description="Sport type")
    prop_types: Optional[List[PropType]] = Field(
        None, description="Filter by prop types"
    )
    min_confidence: Optional[float] = Field(
        0.0, ge=0, le=1, description="Minimum confidence threshold"
    )
    data_sources: Optional[List[DataSource]] = Field(
        None, description="Preferred data sources"
    )


class LiveDataSubscriptionRequest(BaseAPIModel):
    """Request to subscribe to live data updates"""

    user_id: str = Field(..., description="User identifier")
    channels: List[str] = Field(..., description="Channels to subscribe to")
    game_ids: Optional[List[str]] = Field(None, description="Specific games to follow")
    prop_ids: Optional[List[str]] = Field(None, description="Specific props to follow")
    update_frequency: str = Field(
        "real_time", description="Update frequency preference"
    )


# =============================================================================
# VALIDATION AND BUSINESS LOGIC
# =============================================================================


class BettingLimits(BaseAPIModel):
    """Betting limits and validation rules"""

    min_bet: PositiveFloat = Field(0.01, description="Minimum bet amount")
    max_bet: PositiveFloat = Field(10000.0, description="Maximum bet amount")
    max_daily_volume: PositiveFloat = Field(
        50000.0, description="Maximum daily betting volume"
    )
    max_props_per_slip: PositiveInt = Field(
        15, description="Maximum props per bet slip"
    )

    # Risk management
    max_exposure_per_game: PositiveFloat = Field(
        5000.0, description="Maximum exposure per game"
    )
    max_exposure_per_player: PositiveFloat = Field(
        2500.0, description="Maximum exposure per player"
    )
    blacklisted_combinations: List[List[str]] = Field(
        default_factory=list, description="Forbidden prop combinations"
    )


# Custom validators for business logic
@model_validator(mode="before")
@classmethod
def validate_betting_slip(cls, values):
    """Validate bet slip business rules"""
    if isinstance(values, dict):
        bets = values.get("bets", [])
        if len(bets) > BettingLimits().max_props_per_slip:
            raise ValueError(
                f"Too many props in bet slip (max: {BettingLimits().max_props_per_slip})"
            )

        # Check for conflicting props
        game_ids = set()
        for bet in bets:
            if hasattr(bet, "game_id"):
                game_ids.add(bet.game_id)

    return values


# Export all models for easy importing
__all__ = [
    # Enums
    "SportType",
    "BetType",
    "PropType",
    "BetStatus",
    "AnalysisType",
    "DataSource",
    # Base models
    "BaseAPIModel",
    "TimestampMixin",
    "PaginationMeta",
    # Core models
    "Player",
    "Team",
    "Game",
    "PropBet",
    "BetSlip",
    # Analysis models
    "MLPrediction",
    "ComprehensiveAnalysis",
    # Real-time models
    "WebSocketMessage",
    "LiveGameUpdate",
    # User models
    "UserProfile",
    "PerformanceMetrics",
    # Response models
    "APIResponse",
    "PaginatedResponse",
    "DataResponse",
    "ListResponse",
    "ErrorResponse",
    # Request models
    "PropAnalysisRequest",
    "GamePropsRequest",
    "LiveDataSubscriptionRequest",
    # Validation models
    "BettingLimits",
]
