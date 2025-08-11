"""
Unified Data Domain Models

Standardized data models for all data operations across sports and sources.
"""

from datetime import datetime, timezone, date
from enum import Enum
from typing import Any, Dict, List, Optional, Union
from decimal import Decimal
from pydantic import BaseModel, Field, validator


class Sport(str, Enum):
    """Supported sports"""
    MLB = "mlb"
    NBA = "nba"
    NFL = "nfl"
    NHL = "nhl"


class DataSource(str, Enum):
    """Data sources"""
    SPORTRADAR = "sportradar"
    BASEBALL_SAVANT = "baseball_savant"
    ESPN = "espn"
    BETMGM = "betmgm"
    DRAFTKINGS = "draftkings"
    CAESARS = "caesars"
    FANDUEL = "fanduel"
    PRIZEPICKS = "prizepicks"
    INTERNAL = "internal"


class DataType(str, Enum):
    """Types of data"""
    GAME = "game"
    PLAYER = "player"
    TEAM = "team"
    ODDS = "odds"
    PROPS = "props"
    STATS = "stats"
    NEWS = "news"
    WEATHER = "weather"
    INJURY = "injury"


class QualityStatus(str, Enum):
    """Data quality status"""
    EXCELLENT = "excellent"
    GOOD = "good"
    ACCEPTABLE = "acceptable"
    POOR = "poor"
    CRITICAL = "critical"


class ValidationStatus(str, Enum):
    """Data validation status"""
    PASSED = "passed"
    FAILED = "failed"
    WARNING = "warning"
    PENDING = "pending"


# Request Models
class DataRequest(BaseModel):
    """Base data request"""
    sport: Sport
    data_type: DataType
    date_range: Optional[List[date]] = Field(None, description="Date range [start, end]")
    team_id: Optional[str] = Field(None, description="Team identifier")
    player_id: Optional[str] = Field(None, description="Player identifier")
    game_id: Optional[str] = Field(None, description="Game identifier")
    source: Optional[DataSource] = Field(None, description="Preferred data source")
    include_props: bool = Field(False, description="Include prop bet data")
    real_time: bool = Field(False, description="Real-time data required")
    
    @validator('date_range')
    def validate_date_range(cls, v):
        if v and len(v) != 2:
            raise ValueError('Date range must contain exactly 2 dates')
        if v and v[0] > v[1]:
            raise ValueError('Start date must be before end date')
        return v


class DataValidationRequest(BaseModel):
    """Data validation request"""
    data_id: str
    validation_rules: List[str] = Field(default_factory=list)
    strict_mode: bool = Field(False, description="Strict validation mode")


class DataQualityRequest(BaseModel):
    """Data quality assessment request"""
    sport: Sport
    data_type: DataType
    time_window: int = Field(24, description="Time window in hours")
    sources: Optional[List[DataSource]] = Field(None, description="Sources to check")


# Response Models
class DataQualityMetrics(BaseModel):
    """Data quality metrics"""
    completeness: float = Field(..., ge=0, le=1, description="Data completeness (0-1)")
    accuracy: float = Field(..., ge=0, le=1, description="Data accuracy (0-1)")
    consistency: float = Field(..., ge=0, le=1, description="Data consistency (0-1)")
    timeliness: float = Field(..., ge=0, le=1, description="Data timeliness (0-1)")
    overall_score: float = Field(..., ge=0, le=1, description="Overall quality score")
    status: QualityStatus
    issues_count: int = Field(0, description="Number of quality issues")
    last_updated: datetime
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class ValidationResult(BaseModel):
    """Data validation result"""
    rule_name: str
    status: ValidationStatus
    message: str
    details: Optional[Dict[str, Any]] = None
    severity: str = Field("info", description="Severity level")


class PlayerData(BaseModel):
    """Player data model"""
    player_id: str
    name: str
    sport: Sport
    team_id: Optional[str] = None
    position: Optional[str] = None
    jersey_number: Optional[int] = None
    
    # Current season stats
    games_played: Optional[int] = None
    stats: Optional[Dict[str, Union[int, float]]] = None
    
    # Recent performance
    last_5_games: Optional[List[Dict[str, Any]]] = None
    last_10_games: Optional[List[Dict[str, Any]]] = None
    
    # Physical info
    height: Optional[str] = None
    weight: Optional[int] = None
    age: Optional[int] = None
    
    # Status
    injury_status: Optional[str] = None
    active: bool = True
    
    # Metadata
    source: DataSource
    last_updated: datetime
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class TeamData(BaseModel):
    """Team data model"""
    team_id: str
    name: str
    city: str
    sport: Sport
    conference: Optional[str] = None
    division: Optional[str] = None
    
    # Current season record
    wins: Optional[int] = None
    losses: Optional[int] = None
    win_percentage: Optional[float] = None
    
    # Team stats
    stats: Optional[Dict[str, Union[int, float]]] = None
    
    # Recent performance
    last_10_record: Optional[str] = None
    home_record: Optional[str] = None
    away_record: Optional[str] = None
    
    # Roster
    players: Optional[List[str]] = Field(None, description="Player IDs")
    
    # Metadata
    source: DataSource
    last_updated: datetime
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class GameData(BaseModel):
    """Game data model"""
    game_id: str
    sport: Sport
    date: date
    time: Optional[str] = None
    
    # Teams
    home_team_id: str
    away_team_id: str
    home_team_name: str
    away_team_name: str
    
    # Venue
    venue: Optional[str] = None
    city: Optional[str] = None
    
    # Game status
    status: str = Field("scheduled", description="Game status")
    inning: Optional[int] = None
    period: Optional[int] = None
    clock: Optional[str] = None
    
    # Score
    home_score: Optional[int] = None
    away_score: Optional[int] = None
    
    # Odds and props
    moneyline: Optional[Dict[str, int]] = None
    spread: Optional[Dict[str, float]] = None
    total: Optional[float] = None
    
    # Player props
    player_props: Optional[List[Dict[str, Any]]] = None
    
    # Weather (outdoor sports)
    weather: Optional[Dict[str, Any]] = None
    
    # Advanced stats
    advanced_stats: Optional[Dict[str, Any]] = None
    
    # Metadata
    source: DataSource
    last_updated: datetime
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat()
        }


class OddsData(BaseModel):
    """Odds data model"""
    odds_id: str
    game_id: str
    sportsbook: str
    
    # Market info
    market_type: str = Field(..., description="moneyline, spread, total, prop")
    prop_type: Optional[str] = Field(None, description="Prop bet type")
    player_id: Optional[str] = Field(None, description="Player for prop bets")
    
    # Odds values
    line: Optional[float] = Field(None, description="Line value for spreads/totals")
    over_odds: Optional[int] = Field(None, description="Over odds")
    under_odds: Optional[int] = Field(None, description="Under odds")
    home_odds: Optional[int] = Field(None, description="Home team odds")
    away_odds: Optional[int] = Field(None, description="Away team odds")
    
    # Market info
    limits: Optional[Dict[str, float]] = Field(None, description="Betting limits")
    volume: Optional[int] = Field(None, description="Betting volume")
    
    # Timestamp
    timestamp: datetime
    source: DataSource
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class DataResponse(BaseModel):
    """Unified data response"""
    request_id: str
    data_type: DataType
    sport: Sport
    
    # Data payload
    games: Optional[List[GameData]] = None
    players: Optional[List[PlayerData]] = None
    teams: Optional[List[TeamData]] = None
    odds: Optional[List[OddsData]] = None
    
    # Metadata
    total_records: int
    sources_used: List[DataSource]
    cache_hit: bool
    
    # Quality info
    quality_score: float = Field(..., ge=0, le=1)
    validation_status: ValidationStatus
    validation_results: Optional[List[ValidationResult]] = None
    
    # Timing
    response_time_ms: float
    generated_at: datetime
    expires_at: Optional[datetime] = None
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class DataPipelineStatus(BaseModel):
    """Data pipeline status"""
    pipeline_id: str
    status: str
    sport: Sport
    data_type: DataType
    
    # Progress
    total_tasks: int
    completed_tasks: int
    failed_tasks: int
    progress_percentage: float
    
    # Timing
    started_at: datetime
    estimated_completion: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    # Results
    records_processed: int = 0
    records_created: int = 0
    records_updated: int = 0
    records_failed: int = 0
    
    # Errors
    errors: Optional[List[str]] = None
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class HealthResponse(BaseModel):
    """Data service health response"""
    status: str
    sources_online: int
    sources_total: int
    cache_hit_rate: float
    avg_response_time_ms: float
    quality_score: float
    last_update: Optional[datetime] = None
    uptime_seconds: float
    
    # Source status
    source_status: Dict[str, str] = Field(default_factory=dict)
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


# Error Models
class DataError(BaseModel):
    """Data error response"""
    error_code: str
    message: str
    source: Optional[DataSource] = None
    details: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
