"""
Line Movement Tracking Models

Data models for tracking betting line movements over time with Redis time-series storage.
Supports magnitude calculations, direction detection, and volatility scoring.
"""

from datetime import datetime, timezone
from typing import List, Optional, Literal
from pydantic import BaseModel, Field
from dataclasses import dataclass
import statistics
from enum import Enum


class MovementDirection(str, Enum):
    """Direction of line movement"""
    UP = "up"
    DOWN = "down"
    FLAT = "flat"


class LineSnapshot(BaseModel):
    """Individual line snapshot with timestamp"""
    ts: datetime = Field(..., description="Timestamp of the snapshot")
    line: float = Field(..., description="Betting line value")
    bestOdds: int = Field(..., description="Best odds available at this time")
    source: Optional[str] = Field(None, description="Data source that triggered the snapshot")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

    @property
    def best_odds(self) -> int:
        """Expose snake_case accessor expected by legacy tests."""
        return self.bestOdds


class MovementStats(BaseModel):
    """Statistical analysis of line movement"""
    movementMagnitude: float = Field(..., description="Absolute difference between earliest and latest line")
    direction: MovementDirection = Field(..., description="Overall direction of movement")
    volatilityScore: float = Field(..., description="Standard deviation of line values")
    lastUpdated: datetime = Field(..., description="Timestamp of last movement update")
    snapshotCount: int = Field(..., description="Number of snapshots in the analysis")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class LineMovementResponse(BaseModel):
    """API response for line movement queries"""
    timeline: List[LineSnapshot] = Field(..., description="Chronological list of line snapshots")
    movementMagnitude: float = Field(..., description="Absolute line change from start to end")
    direction: MovementDirection = Field(..., description="Overall movement direction")
    volatilityScore: float = Field(..., description="Volatility measure (standard deviation)")
    lastUpdated: datetime = Field(..., description="Most recent update timestamp")
    player: str = Field(..., description="Player name")
    market: str = Field(..., description="Market type (e.g., HR, Points)")
    sport: str = Field(..., description="Sport abbreviation")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class LineMovementQuery(BaseModel):
    """Query parameters for line movement endpoint"""
    sport: str = Field(..., description="Sport filter (e.g., MLB, NBA)")
    player: str = Field(..., description="Player name")
    market: str = Field(..., description="Market type (e.g., HR, Points)")
    limit: Optional[int] = Field(40, description="Maximum snapshots to return", ge=1, le=100)


@dataclass
class MovementEvent:
    """Event data for line movement broadcasting"""
    sport: str
    player: str
    market: str
    previous_line: Optional[float]
    new_line: float
    magnitude: float
    direction: MovementDirection
    volatility_score: float
    timestamp: datetime
    source: str
    
    def is_significant(self, magnitude_threshold: float = 0.5, volatility_threshold: float = 1.0) -> bool:
        """Check if movement is significant enough to broadcast"""
        return (
            self.magnitude >= magnitude_threshold or 
            self.volatility_score >= volatility_threshold
        )


class MovementMetrics(BaseModel):
    """Metrics for monitoring line movement system"""
    total_snapshots: int = Field(0, description="Total line snapshots recorded")
    high_volatility_events: int = Field(0, description="High volatility movements detected")
    active_tracked_lines: int = Field(0, description="Currently tracked player-market combinations")
    avg_snapshots_per_line: float = Field(0.0, description="Average snapshots per tracked line")


class MovementConfiguration(BaseModel):
    """Configuration for line movement tracking"""
    max_snapshots_per_line: int = Field(40, description="Maximum snapshots to store per line")
    volatility_threshold: float = Field(1.0, description="Threshold for high volatility detection")
    magnitude_threshold: float = Field(0.5, description="Threshold for significant movement")
    snapshot_ttl_hours: int = Field(168, description="TTL for snapshots in hours (default: 7 days)")
    redis_key_prefix: str = Field("line_mv", description="Redis key prefix for line movement data")
    
    def generate_redis_key(self, sport: str, player: str, market: str) -> str:
        """Generate Redis key for a specific line"""
        # Sanitize inputs for Redis key
        sport_clean = sport.replace(":", "_").replace(" ", "_")
        player_clean = player.replace(":", "_").replace(" ", "_")
        market_clean = market.replace(":", "_").replace(" ", "_")
        
        return f"{self.redis_key_prefix}:{sport_clean}:{player_clean}:{market_clean}"


# Default configuration instance
DEFAULT_MOVEMENT_CONFIG = MovementConfiguration(
    max_snapshots_per_line=40,
    volatility_threshold=1.0,
    magnitude_threshold=0.5,
    snapshot_ttl_hours=168,
    redis_key_prefix="line_mv"
)


def calculate_movement_stats(snapshots: List[LineSnapshot]) -> MovementStats:
    """Calculate movement statistics from a list of snapshots"""
    if not snapshots:
        return MovementStats(
            movementMagnitude=0.0,
            direction=MovementDirection.FLAT,
            volatilityScore=0.0,
            lastUpdated=datetime.now(timezone.utc),
            snapshotCount=0
        )
    
    # Sort by timestamp to ensure chronological order
    sorted_snapshots = sorted(snapshots, key=lambda x: x.ts)
    line_values = [s.line for s in sorted_snapshots]
    
    # Calculate magnitude (earliest to latest)
    earliest_line = line_values[0]
    latest_line = line_values[-1]
    magnitude = round(abs(latest_line - earliest_line), 3)
    
    # Determine direction
    if latest_line > earliest_line:
        direction = MovementDirection.UP
    elif latest_line < earliest_line:
        direction = MovementDirection.DOWN
    else:
        direction = MovementDirection.FLAT
    
    # Calculate volatility (standard deviation)
    volatility = statistics.stdev(line_values) if len(line_values) > 1 else 0.0
    
    return MovementStats(
        movementMagnitude=magnitude,
        direction=direction,
        volatilityScore=volatility,
        lastUpdated=sorted_snapshots[-1].ts,
        snapshotCount=len(snapshots)
    )


def create_movement_event(
    sport: str,
    player: str, 
    market: str,
    previous_line: Optional[float],
    new_line: float,
    source: str,
    volatility_score: float = 0.0
) -> MovementEvent:
    """Create a movement event for broadcasting"""
    magnitude = abs(new_line - previous_line) if previous_line is not None else 0.0
    
    if previous_line is None:
        direction = MovementDirection.FLAT
    elif new_line > previous_line:
        direction = MovementDirection.UP
    elif new_line < previous_line:
        direction = MovementDirection.DOWN
    else:
        direction = MovementDirection.FLAT
    
    return MovementEvent(
        sport=sport,
        player=player,
        market=market,
        previous_line=previous_line,
        new_line=new_line,
        magnitude=magnitude,
        direction=direction,
        volatility_score=volatility_score,
        timestamp=datetime.now(timezone.utc),
        source=source
    )