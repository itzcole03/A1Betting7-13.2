"""
Streaming Event Models - Sport-aware event models for market streaming

Enhanced event models that include sport dimension for proper isolation
and routing across different sports.
"""

from __future__ import annotations
from dataclasses import dataclass
from datetime import datetime
from typing import Optional, Dict, Any

from backend.config.sport_settings import get_default_sport


@dataclass
class StreamingMarketEvent:
    """Market delta event with sport awareness"""
    event_type: str  # MARKET_PROP_CREATED, MARKET_LINE_CHANGE, MARKET_PROP_INACTIVE
    provider: str
    prop_id: str
    sport: str
    previous_line: Optional[float]
    new_line: float
    line_hash: str
    timestamp: datetime
    
    # Additional event data
    player_name: Optional[str] = None
    team_code: Optional[str] = None
    market_type: Optional[str] = None
    prop_category: Optional[str] = None
    status: Optional[str] = None
    odds_value: Optional[float] = None
    external_player_id: Optional[str] = None
    game_id: Optional[str] = None
    
    def __post_init__(self):
        """Ensure sport field is populated with default if not provided"""
        if not self.sport:
            object.__setattr__(self, 'sport', get_default_sport())
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert event to dictionary for serialization"""
        return {
            "event_type": self.event_type,
            "provider": self.provider,
            "prop_id": self.prop_id,
            "sport": self.sport,
            "previous_line": self.previous_line,
            "new_line": self.new_line,
            "line_hash": self.line_hash,
            "timestamp": self.timestamp.isoformat(),
            "player_name": self.player_name,
            "team_code": self.team_code,
            "market_type": self.market_type,
            "prop_category": self.prop_category,
            "status": self.status,
            "odds_value": self.odds_value,
            "external_player_id": self.external_player_id,
            "game_id": self.game_id
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> StreamingMarketEvent:
        """Create event from dictionary"""
        timestamp = datetime.fromisoformat(data["timestamp"]) if isinstance(data["timestamp"], str) else data["timestamp"]
        
        return cls(
            event_type=data["event_type"],
            provider=data["provider"],
            prop_id=data["prop_id"],
            sport=data.get("sport", get_default_sport()),
            previous_line=data.get("previous_line"),
            new_line=data["new_line"],
            line_hash=data["line_hash"],
            timestamp=timestamp,
            player_name=data.get("player_name"),
            team_code=data.get("team_code"),
            market_type=data.get("market_type"),
            prop_category=data.get("prop_category"),
            status=data.get("status"),
            odds_value=data.get("odds_value"),
            external_player_id=data.get("external_player_id"),
            game_id=data.get("game_id")
        )
    
    def get_event_key(self) -> str:
        """Generate unique event key for deduplication"""
        return f"{self.sport}:{self.provider}:{self.prop_id}:{self.line_hash}"
    
    def is_sport_event(self, target_sport: str) -> bool:
        """Check if event belongs to specific sport"""
        return self.sport == target_sport


@dataclass  
class DependencyChangeEvent:
    """Event for dependency graph changes with sport isolation"""
    event_type: str  # DEPENDENCY_CREATED, DEPENDENCY_UPDATED, DEPENDENCY_REMOVED
    sport: str
    prop_id: str
    dependent_prop_ids: list[str]
    correlation_strength: Optional[float] = None
    timestamp: Optional[datetime] = None
    
    def __post_init__(self):
        """Initialize with defaults"""
        if not self.sport:
            object.__setattr__(self, 'sport', get_default_sport())
        if self.timestamp is None:
            object.__setattr__(self, 'timestamp', datetime.utcnow())
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization"""
        return {
            "event_type": self.event_type,
            "sport": self.sport,
            "prop_id": self.prop_id,
            "dependent_prop_ids": self.dependent_prop_ids,
            "correlation_strength": self.correlation_strength,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None
        }
    
    def get_dependency_key(self) -> str:
        """Generate key for dependency tracking"""
        return f"{self.sport}:{self.prop_id}"


@dataclass
class ProviderStateEvent:
    """Event for provider state changes with sport dimension"""
    event_type: str  # PROVIDER_ENABLED, PROVIDER_DISABLED, PROVIDER_HEALTH_CHANGE
    provider_name: str
    sport: str
    previous_state: Optional[Dict[str, Any]] = None
    new_state: Optional[Dict[str, Any]] = None
    timestamp: Optional[datetime] = None
    
    def __post_init__(self):
        """Initialize with defaults"""
        if not self.sport:
            object.__setattr__(self, 'sport', get_default_sport())
        if self.timestamp is None:
            object.__setattr__(self, 'timestamp', datetime.utcnow())
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization"""
        return {
            "event_type": self.event_type,
            "provider_name": self.provider_name,
            "sport": self.sport,
            "previous_state": self.previous_state,
            "new_state": self.new_state,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None
        }
    
    def get_provider_key(self) -> str:
        """Generate key for provider tracking"""
        return f"{self.provider_name}:{self.sport}"


@dataclass
class OptimizationEvent:
    """Event for optimization runs with sport awareness"""
    event_type: str  # OPTIMIZATION_STARTED, OPTIMIZATION_COMPLETED, OPTIMIZATION_FAILED
    sport: str
    run_id: str
    edge_count: int
    objective: str
    status: str
    timestamp: Optional[datetime] = None
    duration_ms: Optional[int] = None
    best_score: Optional[float] = None
    error_message: Optional[str] = None
    
    def __post_init__(self):
        """Initialize with defaults"""
        if not self.sport:
            object.__setattr__(self, 'sport', get_default_sport())
        if self.timestamp is None:
            object.__setattr__(self, 'timestamp', datetime.utcnow())
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization"""
        return {
            "event_type": self.event_type,
            "sport": self.sport,
            "run_id": self.run_id,
            "edge_count": self.edge_count,
            "objective": self.objective,
            "status": self.status,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "duration_ms": self.duration_ms,
            "best_score": self.best_score,
            "error_message": self.error_message
        }
    
    def get_optimization_key(self) -> str:
        """Generate key for optimization tracking"""
        return f"{self.sport}:{self.run_id}"


# Event type constants for consistency
class StreamingEventTypes:
    """Constants for streaming event types"""
    
    # Market events
    MARKET_PROP_CREATED = "MARKET_PROP_CREATED"
    MARKET_LINE_CHANGE = "MARKET_LINE_CHANGE"
    MARKET_PROP_INACTIVE = "MARKET_PROP_INACTIVE"
    
    # Dependency events
    DEPENDENCY_CREATED = "DEPENDENCY_CREATED"
    DEPENDENCY_UPDATED = "DEPENDENCY_UPDATED"
    DEPENDENCY_REMOVED = "DEPENDENCY_REMOVED"
    
    # Provider events
    PROVIDER_ENABLED = "PROVIDER_ENABLED"
    PROVIDER_DISABLED = "PROVIDER_DISABLED"
    PROVIDER_HEALTH_CHANGE = "PROVIDER_HEALTH_CHANGE"
    
    # Optimization events
    OPTIMIZATION_STARTED = "OPTIMIZATION_STARTED"
    OPTIMIZATION_COMPLETED = "OPTIMIZATION_COMPLETED"
    OPTIMIZATION_FAILED = "OPTIMIZATION_FAILED"


# Convenience functions for creating events
def create_market_event(
    event_type: str,
    provider: str,
    prop_id: str,
    sport: str,
    previous_line: Optional[float],
    new_line: float,
    line_hash: str,
    **kwargs
) -> StreamingMarketEvent:
    """Create a market streaming event"""
    return StreamingMarketEvent(
        event_type=event_type,
        provider=provider,
        prop_id=prop_id,
        sport=sport,
        previous_line=previous_line,
        new_line=new_line,
        line_hash=line_hash,
        timestamp=datetime.utcnow(),
        **kwargs
    )


def create_dependency_event(
    event_type: str,
    sport: str,
    prop_id: str,
    dependent_prop_ids: list[str],
    correlation_strength: Optional[float] = None
) -> DependencyChangeEvent:
    """Create a dependency change event"""
    return DependencyChangeEvent(
        event_type=event_type,
        sport=sport,
        prop_id=prop_id,
        dependent_prop_ids=dependent_prop_ids,
        correlation_strength=correlation_strength
    )


def create_provider_event(
    event_type: str,
    provider_name: str,
    sport: str,
    previous_state: Optional[Dict[str, Any]] = None,
    new_state: Optional[Dict[str, Any]] = None
) -> ProviderStateEvent:
    """Create a provider state change event"""
    return ProviderStateEvent(
        event_type=event_type,
        provider_name=provider_name,
        sport=sport,
        previous_state=previous_state,
        new_state=new_state
    )


def create_optimization_event(
    event_type: str,
    sport: str,
    run_id: str,
    edge_count: int,
    objective: str,
    status: str,
    **kwargs
) -> OptimizationEvent:
    """Create an optimization event"""
    return OptimizationEvent(
        event_type=event_type,
        sport=sport,
        run_id=run_id,
        edge_count=edge_count,
        objective=objective,
        status=status,
        **kwargs
    )


# Export all public interfaces
__all__ = [
    'StreamingMarketEvent',
    'DependencyChangeEvent', 
    'ProviderStateEvent',
    'OptimizationEvent',
    'StreamingEventTypes',
    'create_market_event',
    'create_dependency_event',
    'create_provider_event',
    'create_optimization_event'
]