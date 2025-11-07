from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

from backend.utils.time_helpers import now_utc


class TrendMetric(str, Enum):
    """Available trend metrics for leaderboard analysis"""

    OVER_HIT_RATE = "over_hit_rate"
    AVG_EV = "avg_ev"
    ARBITRAGE_COUNT = "arbitrage_count"
    HIGH_CONFIDENCE_RATE = "high_confidence_rate"


class SportFilter(str, Enum):
    """Supported sports for filtering"""

    ALL = "ALL"
    MLB = "MLB"
    NBA = "NBA"
    NFL = "NFL"
    NHL = "NHL"


class MarketTypeFilter(str, Enum):
    """Market type filters"""

    ALL = "all"
    PLAYER_PROPS = "player_props"
    TEAM_TOTALS = "team_totals"
    SPREADS = "spreads"
    MONEYLINES = "moneylines"


class TrendLeaderboardEntry(BaseModel):
    """Individual entry in the trends leaderboard"""

    player_id: str = Field(..., description="Unique player identifier")
    player_name: str = Field(..., description="Player display name")
    team: Optional[str] = Field(None, description="Current team")
    sport: str = Field(..., description="Sport (MLB, NBA, etc.)")
    market_type: str = Field(..., description="Market type")

    # Metrics
    over_hit_rate: float = Field(..., description="Percentage of over bets that hit")
    avg_ev: float = Field(..., description="Average expected value percentage")
    arbitrage_count: int = Field(..., description="Number of arbitrage opportunities")
    high_confidence_rate: float = Field(
        ..., description="Rate of high confidence (>70%) bets"
    )

    # Sample sizes
    total_props: int = Field(..., description="Total number of props analyzed")
    sample_period_days: int = Field(default=30, description="Analysis period in days")

    # Additional context
    last_updated: datetime = Field(default_factory=now_utc)
    rank: Optional[int] = Field(
        default=None, description="Rank in leaderboard for selected metric"
    )


class TrendLeaderboardFilters(BaseModel):
    """Filters for trend leaderboard queries"""

    metric: TrendMetric = Field(
        default=TrendMetric.OVER_HIT_RATE, description="Primary metric to rank by"
    )
    sport: SportFilter = Field(default=SportFilter.ALL, description="Sport filter")
    market_type: MarketTypeFilter = Field(
        default=MarketTypeFilter.ALL, description="Market type filter"
    )
    min_samples: int = Field(
        default=5, ge=1, le=100, description="Minimum number of props for inclusion"
    )
    period_days: int = Field(
        default=30, ge=7, le=365, description="Analysis period in days"
    )
    limit: int = Field(
        default=50, ge=1, le=500, description="Maximum entries to return"
    )


class TrendLeaderboardResponse(BaseModel):
    """Response model for trends leaderboard API"""

    success: bool = Field(default=True)
    data: List[TrendLeaderboardEntry] = Field(..., description="Leaderboard entries")
    filters: TrendLeaderboardFilters = Field(..., description="Applied filters")
    metadata: Dict[str, Any] = Field(
        default_factory=dict, description="Additional metadata"
    )
    total_entries: int = Field(..., description="Total number of available entries")
    cache_timestamp: Optional[datetime] = Field(
        default=None, description="When data was cached"
    )
    error: Optional[str] = Field(None, description="Error message if any")


class TrendStatsSummary(BaseModel):
    """Summary statistics for trends data"""

    total_players: int
    total_props_analyzed: int
    sports_covered: List[str]
    date_range: Dict[str, str]  # start_date, end_date
    top_performers: Dict[str, TrendLeaderboardEntry]  # metric_name -> top performer
    cache_status: Dict[str, Any]


class TrendCacheStatus(BaseModel):
    """Cache status for trends data"""

    last_computed: datetime
    next_refresh: datetime
    cache_hit_rate: float
    entries_cached: int
    computation_time_ms: int
