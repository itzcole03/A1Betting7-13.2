"""
Smart Signals Models - Data models for smart betting signals
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional

from sqlalchemy import JSON, Column, DateTime, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from backend.models.base import Base


class SignalType(Enum):
    """Types of smart signals"""

    HIGH_EV = "high_ev"
    CONSISTENT_TREND = "consistent_trend"
    LOW_JUICE = "low_juice"
    FAVORABLE_LINE_MOVEMENT = "favorable_line_movement"
    SHARP_MONEY = "sharp_money"
    MARKET_INEFFICIENCY = "market_inefficiency"


class SignalStrength(Enum):
    """Signal strength levels"""

    WEAK = "weak"  # 40-60
    MODERATE = "moderate"  # 60-75
    STRONG = "strong"  # 75-85
    VERY_STRONG = "very_strong"  # 85+


@dataclass
class SignalComponent:
    """Individual component of a smart signal"""

    component_type: str
    score: float
    weight: float
    rationale: str
    data_points: dict = field(default_factory=dict)


@dataclass
class SignalRationale:
    """Rationale for why a signal qualified"""

    reason: str
    value: str
    impact: float  # 0-1 scale


class SmartSignal(Base):
    """Database model for smart betting signals"""

    __tablename__ = "smart_signals"
    __table_args__ = {"extend_existing": True}

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # Signal identification
    sport: Mapped[str] = mapped_column(String, nullable=False, index=True)
    game_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    player_name: Mapped[str | None] = mapped_column(String, nullable=True, index=True)
    market_type: Mapped[str] = mapped_column(
        String, nullable=False
    )  # "over_under", "spread", "moneyline"
    stat_type: Mapped[str | None] = mapped_column(
        String, nullable=True
    )  # "points", "rebounds", etc.

    # Line information
    line: Mapped[float | None] = mapped_column(Float, nullable=True)
    over_odds: Mapped[float | None] = mapped_column(Float, nullable=True)
    under_odds: Mapped[float | None] = mapped_column(Float, nullable=True)
    sportsbook: Mapped[str | None] = mapped_column(String, nullable=True)

    # Signal scoring
    overall_score: Mapped[float] = mapped_column(Float, nullable=False, index=True)
    signal_strength: Mapped[str] = mapped_column(
        String, nullable=False
    )  # SignalStrength enum
    signal_types: Mapped[str] = mapped_column(
        Text, nullable=False
    )  # JSON array of SignalType enums

    # Scoring components (0-100 scale)
    ev_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    trend_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    juice_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    line_movement_score: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Supporting data
    expected_value_percent: Mapped[float | None] = mapped_column(Float, nullable=True)
    hit_rate_trend: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )  # Last 10 games
    juice_percent: Mapped[float | None] = mapped_column(Float, nullable=True)
    line_movement: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )  # Positive = favorable

    # Rationales and metadata
    rationales: Mapped[str] = mapped_column(
        Text, nullable=False
    )  # JSON array of rationale strings
    component_breakdown: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )  # JSON breakdown

    # Tracking
    is_active: Mapped[bool] = mapped_column(default=True)
    expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    def __repr__(self):
        return f"<SmartSignal(id={self.id}, sport={self.sport}, player={self.player_name}, score={self.overall_score})>"

    @property
    def is_qualified(self) -> bool:
        """Check if signal qualifies (score > 70)"""
        return self.overall_score > 70

    @property
    def strength_level(self) -> SignalStrength:
        """Get signal strength enum based on score"""
        if self.overall_score >= 85:
            return SignalStrength.VERY_STRONG
        elif self.overall_score >= 75:
            return SignalStrength.STRONG
        elif self.overall_score >= 60:
            return SignalStrength.MODERATE
        else:
            return SignalStrength.WEAK

    def to_dict(self) -> dict:
        """Convert to dictionary for API responses"""
        import json

        return {
            "id": self.id,
            "sport": self.sport,
            "game_id": self.game_id,
            "player_name": self.player_name,
            "market_type": self.market_type,
            "stat_type": self.stat_type,
            "line": self.line,
            "over_odds": self.over_odds,
            "under_odds": self.under_odds,
            "sportsbook": self.sportsbook,
            "overall_score": self.overall_score,
            "signal_strength": self.signal_strength,
            "signal_types": json.loads(self.signal_types) if self.signal_types else [],
            "ev_score": self.ev_score,
            "trend_score": self.trend_score,
            "juice_score": self.juice_score,
            "line_movement_score": self.line_movement_score,
            "expected_value_percent": self.expected_value_percent,
            "hit_rate_trend": self.hit_rate_trend,
            "juice_percent": self.juice_percent,
            "line_movement": self.line_movement,
            "rationales": json.loads(self.rationales) if self.rationales else [],
            "component_breakdown": (
                json.loads(self.component_breakdown)
                if self.component_breakdown
                else None
            ),
            "is_active": self.is_active,
            "is_qualified": self.is_qualified,
            "strength_level": self.strength_level.value,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


@dataclass
class SmartSignalRequest:
    """Request model for smart signals API"""

    sport: str = "MLB"
    min_score: float = 70.0
    limit: int = 50
    signal_types: Optional[List[str]] = None
    player_name: Optional[str] = None
    market_type: Optional[str] = None


@dataclass
class SmartSignalResponse:
    """Response model for smart signals API"""

    signals: List[dict]
    total_count: int
    qualified_count: int
    avg_score: float
    strongest_signal: Optional[dict]
    metadata: dict = field(default_factory=dict)
