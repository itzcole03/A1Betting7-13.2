"""
Unified Integration Domain Models

Standardized data models for all external integrations and API connections.
"""

from datetime import datetime, timezone
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


class Sportsbook(str, Enum):
    """Supported sportsbooks"""
    BETMGM = "betmgm"
    DRAFTKINGS = "draftkings"
    CAESARS = "caesars"
    FANDUEL = "fanduel"
    PRIZEPICKS = "prizepicks"


class ExternalProvider(str, Enum):
    """External data providers"""
    SPORTRADAR = "sportradar"
    ESPN = "espn"
    BASEBALL_SAVANT = "baseball_savant"
    NBA_API = "nba_api"
    NFL_API = "nfl_api"


class IntegrationType(str, Enum):
    """Types of integrations"""
    SPORTSBOOK = "sportsbook"
    DATA_PROVIDER = "data_provider"
    AUTHENTICATION = "authentication"
    WEBHOOK = "webhook"
    NOTIFICATION = "notification"


class MarketType(str, Enum):
    """Market types for odds"""
    MONEYLINE = "moneyline"
    SPREAD = "spread"
    TOTAL = "total"
    PROP = "prop"


class OddsFormat(str, Enum):
    """Odds format types"""
    AMERICAN = "american"
    DECIMAL = "decimal"
    FRACTIONAL = "fractional"


class ConnectionStatus(str, Enum):
    """Connection status"""
    CONNECTED = "connected"
    DISCONNECTED = "disconnected"
    ERROR = "error"
    RATE_LIMITED = "rate_limited"
    AUTHENTICATING = "authenticating"


# Request Models
class IntegrationRequest(BaseModel):
    """Base integration request"""
    integration_type: IntegrationType
    provider: Union[Sportsbook, ExternalProvider]
    endpoint: str
    parameters: Optional[Dict[str, Any]] = Field(None, description="Request parameters")
    authentication_required: bool = Field(True, description="Authentication required")
    cache_ttl: Optional[int] = Field(None, description="Cache TTL in seconds")


class SportsbookOddsRequest(BaseModel):
    """Sportsbook odds request"""
    sportsbook: Sportsbook
    sport: Sport
    game_id: Optional[str] = Field(None, description="Specific game ID")
    market_types: Optional[List[MarketType]] = Field(None, description="Market types")
    odds_format: OddsFormat = Field(OddsFormat.AMERICAN, description="Odds format")
    live_only: bool = Field(False, description="Live odds only")


class ExternalDataRequest(BaseModel):
    """External data provider request"""
    provider: ExternalProvider
    data_type: str = Field(..., description="Type of data requested")
    sport: Sport
    filters: Optional[Dict[str, Any]] = Field(None, description="Data filters")
    real_time: bool = Field(False, description="Real-time data required")


class WebhookRequest(BaseModel):
    """Webhook registration request"""
    provider: Union[Sportsbook, ExternalProvider]
    event_types: List[str] = Field(..., description="Event types to subscribe to")
    callback_url: str = Field(..., description="Callback URL")
    secret: Optional[str] = Field(None, description="Webhook secret")


# Response Models
class SportsbookOdds(BaseModel):
    """Sportsbook odds data"""
    sportsbook: Sportsbook
    game_id: str
    sport: Sport
    
    # Game info
    home_team: str
    away_team: str
    game_time: datetime
    
    # Market data
    market_type: MarketType
    
    # Odds values
    home_odds: Optional[int] = Field(None, description="Home team odds")
    away_odds: Optional[int] = Field(None, description="Away team odds") 
    over_odds: Optional[int] = Field(None, description="Over odds")
    under_odds: Optional[int] = Field(None, description="Under odds")
    line: Optional[float] = Field(None, description="Point spread or total line")
    
    # Props (if applicable)
    player_name: Optional[str] = Field(None, description="Player for prop bets")
    prop_type: Optional[str] = Field(None, description="Prop bet type")
    prop_line: Optional[float] = Field(None, description="Prop line value")
    
    # Limits and metadata
    min_bet: Optional[Decimal] = Field(None, description="Minimum bet")
    max_bet: Optional[Decimal] = Field(None, description="Maximum bet")
    
    # Timing
    last_updated: datetime
    expires_at: Optional[datetime] = Field(None, description="Odds expiration")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            Decimal: lambda v: float(v)
        }


class ExternalDataResponse(BaseModel):
    """External data provider response"""
    provider: ExternalProvider
    data_type: str
    sport: Sport
    
    # Response data
    data: Dict[str, Any] = Field(..., description="Response data payload")
    records_count: int = Field(..., description="Number of records")
    
    # Metadata
    request_id: str
    response_time_ms: float
    cached: bool = Field(False, description="Data from cache")
    
    # Timing
    generated_at: datetime
    expires_at: Optional[datetime] = None
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class AuthenticationResult(BaseModel):
    """Authentication result"""
    provider: Union[Sportsbook, ExternalProvider]
    authenticated: bool
    token: Optional[str] = Field(None, description="Authentication token")
    expires_at: Optional[datetime] = Field(None, description="Token expiration")
    scopes: Optional[List[str]] = Field(None, description="Granted scopes")
    error: Optional[str] = Field(None, description="Authentication error")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class WebhookEvent(BaseModel):
    """Webhook event data"""
    event_id: str
    provider: Union[Sportsbook, ExternalProvider]
    event_type: str
    
    # Event data
    payload: Dict[str, Any] = Field(..., description="Event payload")
    
    # Metadata
    signature: Optional[str] = Field(None, description="Event signature")
    delivery_attempt: int = Field(1, description="Delivery attempt number")
    
    # Timing
    occurred_at: datetime
    received_at: datetime
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class IntegrationStatus(BaseModel):
    """Integration connection status"""
    provider: Union[Sportsbook, ExternalProvider]
    integration_type: IntegrationType
    status: ConnectionStatus
    
    # Connection metrics
    uptime_percentage: float = Field(..., ge=0, le=100)
    avg_response_time_ms: float = Field(..., ge=0)
    error_rate: float = Field(..., ge=0, le=1)
    
    # Rate limiting
    requests_per_minute: Optional[int] = Field(None, description="Rate limit")
    requests_remaining: Optional[int] = Field(None, description="Remaining requests")
    rate_limit_reset: Optional[datetime] = Field(None, description="Rate limit reset time")
    
    # Authentication status
    authenticated: bool
    token_expires_at: Optional[datetime] = None
    
    # Last activity
    last_request: Optional[datetime] = None
    last_success: Optional[datetime] = None
    last_error: Optional[datetime] = None
    error_message: Optional[str] = None
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class IntegrationResponse(BaseModel):
    """Unified integration response"""
    request_id: str
    integration_type: IntegrationType
    provider: Union[Sportsbook, ExternalProvider]
    
    # Response data
    sportsbook_odds: Optional[List[SportsbookOdds]] = None
    external_data: Optional[ExternalDataResponse] = None
    authentication: Optional[AuthenticationResult] = None
    webhook_events: Optional[List[WebhookEvent]] = None
    
    # Response metadata
    success: bool
    status_code: int
    response_time_ms: float
    cached: bool = False
    
    # Error handling
    error: Optional[str] = None
    error_details: Optional[Dict[str, Any]] = None
    
    # Timing
    generated_at: datetime
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class ArbitrageOpportunity(BaseModel):
    """Cross-sportsbook arbitrage opportunity"""
    opportunity_id: str
    sport: Sport
    game_id: str
    
    # Game info
    home_team: str
    away_team: str
    game_time: datetime
    market_type: MarketType
    
    # Arbitrage details
    sportsbook_a: Sportsbook
    sportsbook_b: Sportsbook
    odds_a: int
    odds_b: int
    
    # Profit calculation
    arbitrage_percentage: float = Field(..., description="Arbitrage profit percentage")
    stake_a: Decimal = Field(..., description="Recommended stake for sportsbook A")
    stake_b: Decimal = Field(..., description="Recommended stake for sportsbook B")
    total_stake: Decimal = Field(..., description="Total stake required")
    guaranteed_profit: Decimal = Field(..., description="Guaranteed profit amount")
    
    # Opportunity metadata
    confidence_score: float = Field(..., ge=0, le=1, description="Opportunity confidence")
    time_to_expire: Optional[int] = Field(None, description="Estimated expiration in seconds")
    
    # Timestamps
    detected_at: datetime
    expires_at: Optional[datetime] = None
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            Decimal: lambda v: float(v)
        }


class HealthResponse(BaseModel):
    """Integration service health response"""
    status: str
    integrations_online: int
    integrations_total: int
    avg_response_time_ms: float
    total_requests_last_hour: int
    error_rate_percentage: float
    rate_limits_active: int
    last_authentication: Optional[datetime] = None
    uptime_seconds: float
    
    # Individual integration status
    integration_status: Dict[str, str] = Field(default_factory=dict)
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


# Error Models
class IntegrationError(BaseModel):
    """Integration error response"""
    error_code: str
    message: str
    provider: Optional[Union[Sportsbook, ExternalProvider]] = None
    integration_type: Optional[IntegrationType] = None
    details: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


# Configuration Models
class IntegrationConfig(BaseModel):
    """Integration configuration"""
    provider: Union[Sportsbook, ExternalProvider]
    integration_type: IntegrationType
    
    # Connection settings
    base_url: str
    timeout_seconds: int = Field(30, description="Request timeout")
    max_retries: int = Field(3, description="Maximum retry attempts")
    
    # Authentication
    auth_type: str = Field("api_key", description="Authentication type")
    auth_config: Dict[str, Any] = Field(default_factory=dict)
    
    # Rate limiting
    rate_limit_per_minute: Optional[int] = Field(None, description="Rate limit")
    burst_limit: Optional[int] = Field(None, description="Burst limit")
    
    # Caching
    default_cache_ttl: int = Field(300, description="Default cache TTL in seconds")
    
    # Monitoring
    health_check_interval: int = Field(60, description="Health check interval in seconds")
    alert_on_errors: bool = Field(True, description="Send alerts on errors")
    
    # Feature flags
    enabled: bool = Field(True, description="Integration enabled")
    fallback_enabled: bool = Field(False, description="Fallback mechanism enabled")


class RateLimitInfo(BaseModel):
    """Rate limit information"""
    limit: int = Field(..., description="Rate limit per window")
    remaining: int = Field(..., description="Remaining requests")
    reset_time: datetime = Field(..., description="Rate limit reset time")
    window_seconds: int = Field(..., description="Rate limit window in seconds")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
