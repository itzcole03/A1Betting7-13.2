"""
+EV Feed Models and Types

This module defines the data models for the positive Expected Value (EV) feed system.
Includes opportunity detection, calculation logic, and data structures.
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from backend.utils.time_helpers import now_utc


class SportType(str, Enum):
    """Supported sports for +EV analysis"""

    MLB = "MLB"
    NBA = "NBA"
    NFL = "NFL"
    NHL = "NHL"
    ALL = "ALL"


class EVTier(str, Enum):
    """EV tier classification for badge coloring"""

    LOW = "LOW"  # 3-5% EV
    MEDIUM = "MEDIUM"  # 5-8% EV
    HIGH = "HIGH"  # 8-12% EV
    EXTREME = "EXTREME"  # 12%+ EV


class MarketType(str, Enum):
    """Market types for +EV opportunities"""

    MONEYLINE = "moneyline"
    SPREAD = "spread"
    TOTAL = "total"
    PLAYER_PROPS = "player_props"
    TEAM_PROPS = "team_props"


class EVOpportunity(BaseModel):
    """
    Core +EV opportunity data model

    Represents a positive expected value betting opportunity with all
    necessary fields for analysis and display.
    """

    id: str = Field(..., description="Unique identifier for the opportunity")
    player: str = Field(..., description="Player name (or team for team bets)")
    market: str = Field(
        ..., description="Market description (e.g., 'Points Over 25.5')"
    )
    sport: SportType = Field(..., description="Sport type")
    market_type: MarketType = Field(..., description="Market category")

    # Odds and EV calculation
    our_fair_odds: float = Field(
        ..., description="Our calculated fair odds", ge=-1000, le=1000
    )
    market_odds: int = Field(
        ..., description="Market odds from sportsbook", ge=-1000, le=1000
    )
    ev_percent: float = Field(..., description="Expected value percentage", ge=0)

    # Source and metadata
    source_book: str = Field(..., description="Source sportsbook")
    game_info: str = Field(..., description="Game context (e.g., 'Yankees @ Red Sox')")
    updated_at: datetime = Field(
        default_factory=now_utc, description="Last update timestamp"
    )

    # Additional context
    confidence_score: Optional[float] = Field(
        None, description="Confidence in fair odds calculation", ge=0, le=1
    )
    volume_indicator: Optional[str] = Field(
        None, description="Betting volume indicator"
    )
    line_movement: Optional[str] = Field(None, description="Recent line movement")
    # Optional forecast enrichment (when requested by clients)
    predicted_ev_next_5m: Optional[float] = Field(
        None,
        description="Predicted EV% in the next 5 minutes (experimental)",
        ge=0,
    )
    # Optional supplemental edge tier classification (non-breaking)
    edge_tier: Optional[str] = Field(
        None,
        description="Supplemental fine-grained edge classification (micro|solid|strong|elite)",
    )

    @field_validator("ev_percent")
    def validate_ev_percent(cls, v):
        """Ensure EV percentage is positive"""
        if v < 0:
            raise ValueError("EV percentage must be positive for +EV opportunities")
        return v

    @property
    def ev_tier(self) -> EVTier:
        """Calculate EV tier for badge coloring"""
        if self.ev_percent >= 12:
            return EVTier.EXTREME
        elif self.ev_percent >= 8:
            return EVTier.HIGH
        elif self.ev_percent >= 5:
            return EVTier.MEDIUM
        else:
            return EVTier.LOW

    @property
    def implied_probability(self) -> float:
        """Calculate implied probability from market odds"""
        if self.market_odds > 0:
            return 100 / (self.market_odds + 100)
        else:
            return abs(self.market_odds) / (abs(self.market_odds) + 100)

    @property
    def fair_implied_probability(self) -> float:
        """Calculate implied probability from our fair odds"""
        if self.our_fair_odds > 0:
            return 100 / (self.our_fair_odds + 100)
        else:
            return abs(self.our_fair_odds) / (abs(self.our_fair_odds) + 100)


class EVFeedRequest(BaseModel):
    """Request model for +EV feed endpoint"""

    min_ev: Optional[float] = Field(
        3.0, description="Minimum EV percentage", ge=0, le=100
    )
    sport: Optional[SportType] = Field(SportType.ALL, description="Sport filter")
    market_type: Optional[MarketType] = Field(None, description="Market type filter")
    source_book: Optional[str] = Field(None, description="Sportsbook filter")
    limit: Optional[int] = Field(
        100, description="Maximum number of opportunities", ge=1, le=500
    )


class EVFeedResponse(BaseModel):
    """Response model for +EV feed endpoint"""

    opportunities: List[EVOpportunity] = Field(
        ..., description="List of +EV opportunities"
    )
    total_count: int = Field(..., description="Total opportunities before limit")
    filters_applied: Dict[str, Any] = Field(..., description="Applied filters")
    last_updated: datetime = Field(..., description="Last cache update time")
    cache_age_seconds: int = Field(..., description="Age of cached data in seconds")

    model_config = ConfigDict()


class EVCalculationInput(BaseModel):
    """Input for EV calculation"""

    market_odds: int = Field(..., description="Market odds")
    fair_odds: float = Field(..., description="Fair odds calculation")
    stake: float = Field(100.0, description="Stake amount for calculation")


class EVCalculationResult(BaseModel):
    """Result of EV calculation"""

    ev_percent: float = Field(..., description="Expected value percentage")
    ev_dollar: float = Field(..., description="Expected value in dollars")
    implied_probability: float = Field(..., description="Market implied probability")
    fair_probability: float = Field(..., description="Fair probability")
    is_positive: bool = Field(..., description="Whether EV is positive")


class EVFeedStats(BaseModel):
    """Statistics for the +EV feed.

    New optional fields MUST remain backward-compatible. 'max_edge' added to support
    UI verification of the highest EV opportunity without breaking older clients.
    """

    total_opportunities: int = Field(..., description="Total opportunities in feed")
    by_sport: Dict[str, int] = Field(..., description="Opportunities by sport")
    by_tier: Dict[str, int] = Field(..., description="Opportunities by EV tier")
    avg_ev_percent: float = Field(..., description="Average EV percentage")
    last_generation_time: datetime = Field(..., description="Last feed generation time")
    generation_duration_ms: int = Field(
        ..., description="Feed generation time in milliseconds"
    )
    max_edge: Optional[float] = Field(
        None, description="Maximum EV percent in current feed (optional)"
    )


class EVForecastItem(BaseModel):
    """Forecast item for an opportunity based on recent EV slope"""

    key: str = Field(
        ..., description="Stable identity key for the opportunity snapshots"
    )
    player: str = Field(..., description="Player name")
    market: str = Field(..., description="Market description")
    sport: str = Field(..., description="Sport value string (e.g., MLB)")
    source_book: str = Field(..., description="Sportsbook offering")
    current_ev: float = Field(..., description="Current EV%")
    slope_per_min: float = Field(
        ..., description="Estimated EV% slope per minute over recent snapshots"
    )
    predictedEvNext5m: float = Field(..., description="Predicted EV% in next 5 minutes")
    num_snapshots: int = Field(..., description="Number of snapshots used")
    last_updated: Optional[str] = Field(
        None, description="ISO timestamp of last update"
    )


class EVForecastResponse(BaseModel):
    """Response model for EV forecast endpoint"""

    items: List[EVForecastItem] = Field(
        ..., description="Forecast items with positive slope"
    )
    total_count: int = Field(..., description="Total available items before limit")
    filters_applied: Dict[str, Any] = Field(
        ..., description="Applied filters including min_ev and limit"
    )


def calculate_expected_value(
    market_odds: int, fair_odds: float, stake: float = 100.0
) -> EVCalculationResult:
    """
    Calculate expected value for a betting opportunity

    Args:
        market_odds: Market odds from sportsbook
        fair_odds: Our calculated fair odds
        stake: Stake amount for calculation

    Returns:
        EVCalculationResult with EV percentage and additional metrics
    """
    # Calculate implied probabilities
    if market_odds > 0:
        market_prob = 100 / (market_odds + 100)
    else:
        market_prob = abs(market_odds) / (abs(market_odds) + 100)

    if fair_odds > 0:
        fair_prob = 100 / (fair_odds + 100)
    else:
        fair_prob = abs(fair_odds) / (abs(fair_odds) + 100)

    # Calculate payout
    if market_odds > 0:
        payout = stake * (market_odds / 100)
    else:
        payout = stake * (100 / abs(market_odds))

    # Calculate expected value
    win_amount = payout
    lose_amount = -stake

    ev_dollar = (fair_prob * win_amount) + ((1 - fair_prob) * lose_amount)
    ev_percent = (ev_dollar / stake) * 100

    return EVCalculationResult(
        ev_percent=ev_percent,
        ev_dollar=ev_dollar,
        implied_probability=market_prob,
        fair_probability=fair_prob,
        is_positive=ev_percent > 0,
    )


def determine_ev_tier(ev_percent: float) -> EVTier:
    """Determine EV tier for badge coloring"""
    if ev_percent >= 12:
        return EVTier.EXTREME
    elif ev_percent >= 8:
        return EVTier.HIGH
    elif ev_percent >= 5:
        return EVTier.MEDIUM
    else:
        return EVTier.LOW
