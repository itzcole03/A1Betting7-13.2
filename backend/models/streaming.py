"""
Streaming Database Models

SQLAlchemy models for real-time market streaming, provider states, 
and portfolio rationales.
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum as SQLEnum,
    Float,
    Index,
    Integer,
    JSON,
    String,
    Text,
)
from sqlalchemy.sql import func

from backend.models.base import Base


"""
Streaming Database Models

SQLAlchemy models for real-time market streaming, provider states, 
and portfolio rationales.

Note: SQLAlchemy imports commented out due to dependency issues.
Uncomment when SQLAlchemy is available in the environment.
"""

from datetime import datetime, timezone
from enum import Enum

# TODO: Uncomment when SQLAlchemy is available
# from sqlalchemy import (
#     Boolean,
#     Column,
#     DateTime,
#     Enum as SQLEnum,
#     Float,
#     Index,
#     Integer,
#     JSON,
#     String,
#     Text,
# )
# from sqlalchemy.sql import func
# from backend.models.base import Base


class ProviderStatus(Enum):
    """Provider status enumeration"""
    ACTIVE = "active"
    INACTIVE = "inactive"  
    ERROR = "error"
    MAINTENANCE = "maintenance"


class RationaleType(Enum):
    """Portfolio rationale types"""
    PORTFOLIO_SUMMARY = "portfolio_summary"
    BET_SELECTION = "bet_selection"
    RISK_ANALYSIS = "risk_analysis"
    MARKET_INSIGHTS = "market_insights"
    PERFORMANCE_REVIEW = "performance_review"


# TODO: Uncomment when SQLAlchemy is available
# class ProviderState(Base):
#     """Tracks the state of market data providers"""
    
#     __tablename__ = "provider_states"
    
#     id = Column(Integer, primary_key=True, index=True)
#     provider_name = Column(String(100), nullable=False, unique=True, index=True)
#     status = Column(SQLEnum(ProviderStatus), nullable=False, default=ProviderStatus.INACTIVE)
    
#     # Provider configuration
#     is_enabled = Column(Boolean, nullable=False, default=True)
#     poll_interval_seconds = Column(Integer, nullable=False, default=60)
#     timeout_seconds = Column(Integer, nullable=False, default=30)
#     max_retries = Column(Integer, nullable=False, default=3)
    
#     # State tracking
#     last_fetch_attempt = Column(DateTime(timezone=True), nullable=True)
#     last_successful_fetch = Column(DateTime(timezone=True), nullable=True)
#     last_error = Column(Text, nullable=True)
#     consecutive_errors = Column(Integer, nullable=False, default=0)
    
#     # Performance metrics
#     total_requests = Column(Integer, nullable=False, default=0)
#     successful_requests = Column(Integer, nullable=False, default=0)
#     failed_requests = Column(Integer, nullable=False, default=0)
#     average_response_time_ms = Column(Float, nullable=True)
    
#     # Data metrics
#     total_props_fetched = Column(Integer, nullable=False, default=0)
#     unique_props_seen = Column(Integer, nullable=False, default=0)
#     last_prop_count = Column(Integer, nullable=True)
    
#     # Provider capabilities (JSON field)
#     capabilities = Column(JSON, nullable=True)
    
#     # Metadata
#     created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
#     updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class ProviderStateSchema:
    """Schema definition for ProviderState model (for when SQLAlchemy is available)"""
    
    def __init__(self):
        self.table_name = "provider_states"
        self.columns = {
            "id": "Integer, primary_key=True, index=True",
            "provider_name": "String(100), nullable=False, unique=True, index=True",
            "status": "Enum(ProviderStatus), nullable=False, default=INACTIVE",
            "is_enabled": "Boolean, nullable=False, default=True",
            "poll_interval_seconds": "Integer, nullable=False, default=60",
            "timeout_seconds": "Integer, nullable=False, default=30",
            "max_retries": "Integer, nullable=False, default=3",
            "last_fetch_attempt": "DateTime(timezone=True), nullable=True",
            "last_successful_fetch": "DateTime(timezone=True), nullable=True",
            "last_error": "Text, nullable=True",
            "consecutive_errors": "Integer, nullable=False, default=0",
            "total_requests": "Integer, nullable=False, default=0",
            "successful_requests": "Integer, nullable=False, default=0",
            "failed_requests": "Integer, nullable=False, default=0",
            "average_response_time_ms": "Float, nullable=True",
            "total_props_fetched": "Integer, nullable=False, default=0",
            "unique_props_seen": "Integer, nullable=False, default=0",
            "last_prop_count": "Integer, nullable=True",
            "capabilities": "JSON, nullable=True",
            "created_at": "DateTime(timezone=True), server_default=func.now(), nullable=False",
            "updated_at": "DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False"
        }
    
    def to_dict_schema(self):
        """Schema for dictionary conversion"""
        return {
            "id": "int",
            "provider_name": "str",
            "status": "str (ProviderStatus.value)",
            "is_enabled": "bool",
            "poll_interval_seconds": "int",
            "timeout_seconds": "int", 
            "max_retries": "int",
            "last_fetch_attempt": "str (ISO format) or None",
            "last_successful_fetch": "str (ISO format) or None",
            "last_error": "str or None",
            "consecutive_errors": "int",
            "performance_metrics": {
                "total_requests": "int",
                "successful_requests": "int", 
                "failed_requests": "int",
                "success_rate": "float (calculated)",
                "average_response_time_ms": "float or None"
            },
            "data_metrics": {
                "total_props_fetched": "int",
                "unique_props_seen": "int",
                "last_prop_count": "int or None"
            },
            "capabilities": "dict or None",
            "created_at": "str (ISO format) or None",
            "updated_at": "str (ISO format) or None"
        }


class PortfolioRationaleSchema:
    """Schema definition for PortfolioRationale model"""
    
    def __init__(self):
        self.table_name = "portfolio_rationales"
        self.columns = {
            "id": "Integer, primary_key=True, index=True",
            "request_id": "String(100), nullable=False, unique=True, index=True",
            "rationale_type": "Enum(RationaleType), nullable=False, index=True",
            "portfolio_data_hash": "String(64), nullable=False, index=True",
            "portfolio_data": "JSON, nullable=False",
            "context_data": "JSON, nullable=True",
            "user_preferences": "JSON, nullable=True",
            "narrative": "Text, nullable=False",
            "key_points": "JSON, nullable=False",
            "confidence": "Float, nullable=False",
            "generation_time_ms": "Integer, nullable=False",
            "model_info": "JSON, nullable=False",
            "prompt_tokens": "Integer, nullable=True",
            "completion_tokens": "Integer, nullable=True",
            "total_cost": "Float, nullable=True",
            "user_rating": "Integer, nullable=True",
            "user_feedback": "Text, nullable=True",
            "is_flagged": "Boolean, nullable=False, default=False",
            "cache_hits": "Integer, nullable=False, default=1",
            "last_accessed": "DateTime(timezone=True), server_default=func.now(), nullable=False",
            "expires_at": "DateTime(timezone=True), nullable=True",
            "created_at": "DateTime(timezone=True), server_default=func.now(), nullable=False",
            "updated_at": "DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False"
        }
        self.indexes = [
            "Index('ix_rationale_type_hash', 'rationale_type', 'portfolio_data_hash')",
            "Index('ix_rationale_expires_at', 'expires_at')",
            "Index('ix_rationale_created_at', 'created_at')"
        ]


class MarketEventSchema:
    """Schema definition for MarketEvent model"""
    
    def __init__(self):
        self.table_name = "market_events"
        self.columns = {
            "id": "Integer, primary_key=True, index=True",
            "event_id": "String(100), nullable=False, unique=True, index=True",
            "event_type": "String(50), nullable=False, index=True",
            "provider_name": "String(100), nullable=False, index=True",
            "prop_id": "String(100), nullable=False, index=True",
            "previous_data": "JSON, nullable=True",
            "current_data": "JSON, nullable=True",
            "change_summary": "JSON, nullable=True",
            "player_name": "String(200), nullable=True, index=True",
            "team_code": "String(10), nullable=True, index=True",
            "market_type": "String(50), nullable=True, index=True",
            "prop_category": "String(50), nullable=True, index=True",
            "previous_line": "Float, nullable=True",
            "current_line": "Float, nullable=True",
            "line_movement": "Float, nullable=True",
            "handlers_notified": "JSON, nullable=True",
            "processing_errors": "JSON, nullable=True",
            "event_timestamp": "DateTime(timezone=True), nullable=False, index=True",
            "created_at": "DateTime(timezone=True), server_default=func.now(), nullable=False"
        }
        self.indexes = [
            "Index('ix_market_events_provider_prop', 'provider_name', 'prop_id')",
            "Index('ix_market_events_timestamp', 'event_timestamp')",
            "Index('ix_market_events_player_market', 'player_name', 'market_type')"
        ]


# Mock data structures for development (remove when SQLAlchemy models are active)

class MockProviderState:
    """Mock provider state for development"""
    
    def __init__(self, provider_name: str):
        self.id = hash(provider_name) % 10000
        self.provider_name = provider_name
        self.status = ProviderStatus.INACTIVE
        self.is_enabled = True
        self.poll_interval_seconds = 60
        self.timeout_seconds = 30
        self.max_retries = 3
        self.last_fetch_attempt: Optional[datetime] = None
        self.last_successful_fetch: Optional[datetime] = None
        self.last_error: Optional[str] = None
        self.consecutive_errors = 0
        self.total_requests = 0
        self.successful_requests = 0
        self.failed_requests = 0
        self.average_response_time_ms = None
        self.total_props_fetched = 0
        self.unique_props_seen = 0
        self.last_prop_count = None
        self.capabilities = {}
        self.created_at = datetime.now(timezone.utc)
        self.updated_at = datetime.now(timezone.utc)
        
    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            "id": self.id,
            "provider_name": self.provider_name,
            "status": self.status.value if self.status else None,
            "is_enabled": self.is_enabled,
            "poll_interval_seconds": self.poll_interval_seconds,
            "timeout_seconds": self.timeout_seconds,
            "max_retries": self.max_retries,
            "last_fetch_attempt": self.last_fetch_attempt.isoformat() if self.last_fetch_attempt else None,
            "last_successful_fetch": self.last_successful_fetch.isoformat() if self.last_successful_fetch else None,
            "last_error": self.last_error,
            "consecutive_errors": self.consecutive_errors,
            "performance_metrics": {
                "total_requests": self.total_requests,
                "successful_requests": self.successful_requests,
                "failed_requests": self.failed_requests,
                "success_rate": self.successful_requests / max(1, self.total_requests),
                "average_response_time_ms": self.average_response_time_ms
            },
            "data_metrics": {
                "total_props_fetched": self.total_props_fetched,
                "unique_props_seen": self.unique_props_seen,
                "last_prop_count": self.last_prop_count
            },
            "capabilities": self.capabilities,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }


class MockPortfolioRationale:
    """Mock portfolio rationale for development"""
    
    def __init__(self, request_id: str, rationale_type: RationaleType):
        self.id = hash(request_id) % 10000
        self.request_id = request_id
        self.rationale_type = rationale_type
        self.portfolio_data_hash = "mock_hash"
        self.portfolio_data = {}
        self.context_data = None
        self.user_preferences = None
        self.narrative = "Mock narrative"
        self.key_points = ["Mock point 1", "Mock point 2"]
        self.confidence = 0.8
        self.generation_time_ms = 500
        self.model_info = {"model": "mock", "version": "1.0"}
        self.prompt_tokens = None
        self.completion_tokens = None
        self.total_cost = None
        self.user_rating = None
        self.user_feedback = None
        self.is_flagged = False
        self.cache_hits = 1
        self.last_accessed = datetime.now(timezone.utc)
        self.expires_at = None
        self.created_at = datetime.now(timezone.utc)
        self.updated_at = datetime.now(timezone.utc)
        
    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            "id": self.id,
            "request_id": self.request_id,
            "rationale_type": self.rationale_type.value if self.rationale_type else None,
            "narrative": self.narrative,
            "key_points": self.key_points,
            "confidence": self.confidence,
            "generation_metrics": {
                "generation_time_ms": self.generation_time_ms,
                "prompt_tokens": self.prompt_tokens,
                "completion_tokens": self.completion_tokens,
                "total_cost": self.total_cost
            },
            "model_info": self.model_info,
            "quality_metrics": {
                "user_rating": self.user_rating,
                "user_feedback": self.user_feedback,
                "is_flagged": self.is_flagged
            },
            "cache_info": {
                "cache_hits": self.cache_hits,
                "last_accessed": self.last_accessed.isoformat() if self.last_accessed else None,
                "expires_at": self.expires_at.isoformat() if self.expires_at else None
            },
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
        
    def is_expired(self) -> bool:
        """Check if rationale cache entry is expired"""
        if not self.expires_at:
            return False
        return datetime.now(timezone.utc) > self.expires_at
        
    def update_access(self):
        """Update access tracking"""
        self.cache_hits += 1
        self.last_accessed = datetime.now(timezone.utc)