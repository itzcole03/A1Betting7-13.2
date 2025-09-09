"""
Analytics Database Models - SQLAlchemy models for EV and arbitrage opportunity persistence

This module defines database tables for storing historical EV and arbitrage
opportunities for analytics and trend analysis.
"""

from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from typing import Dict, Any, Optional

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column

from backend.models.base import Base


class EVOpportunityHistory(Base):
    """Historical EV opportunities for analytics tracking"""
    
    __tablename__ = "ev_opportunity_history"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    opp_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    sport: Mapped[str] = mapped_column(String(10), nullable=False, index=True)
    player: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    market: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    ev_percent: Mapped[float] = mapped_column(Float, nullable=False, index=True)
    ev_tier: Mapped[str] = mapped_column(String(20), nullable=False, index=True)  # 'low', 'medium', 'high', 'premium'
    detected_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        nullable=False, 
        index=True,
        default=lambda: datetime.now(timezone.utc)
    )
    
    # Additional context fields for analytics
    line: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    odds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    bookmaker: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    team: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    opponent: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # Indexes for analytics queries
    __table_args__ = (
        Index('idx_ev_hist_sport_date', 'sport', 'detected_at'),
        Index('idx_ev_hist_tier_date', 'ev_tier', 'detected_at'), 
        Index('idx_ev_hist_player_date', 'player', 'detected_at'),
        Index('idx_ev_hist_ev_pct', 'ev_percent'),
    )

    @classmethod
    def calculate_hash(cls, sport: str, player: str, market: str, line: float, odds: int) -> str:
        """Calculate deterministic hash for opportunity deduplication"""
        data = f"{sport}|{player}|{market}|{line}|{odds}"
        return hashlib.sha256(data.encode()).hexdigest()

    @classmethod 
    def determine_ev_tier(cls, ev_percent: float) -> str:
        """Classify EV percentage into tier"""
        if ev_percent >= 10.0:
            return "premium"
        elif ev_percent >= 7.0:
            return "high"
        elif ev_percent >= 5.0:
            return "medium"
        else:
            return "low"

    def __repr__(self) -> str:
        return f"<EVOpportunityHistory(player='{self.player}', ev_percent={self.ev_percent:.1f}%, tier='{self.ev_tier}')>"


class ArbitrageHistory(Base):
    """Historical arbitrage opportunities for analytics tracking"""
    
    __tablename__ = "arbitrage_history"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    arb_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    sport: Mapped[str] = mapped_column(String(10), nullable=False, index=True)
    market: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    profit_pct: Mapped[float] = mapped_column(Float, nullable=False, index=True)
    books_json: Mapped[str] = mapped_column(Text, nullable=False)  # JSON array of bookmaker names
    detected_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        nullable=False, 
        index=True,
        default=lambda: datetime.now(timezone.utc)
    )
    
    # Additional context fields for analytics
    player: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    line: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    total_stake_required: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    num_bookmakers: Mapped[int] = mapped_column(Integer, nullable=False, default=2)
    team: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    opponent: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    # Indexes for analytics queries
    __table_args__ = (
        Index('idx_arb_hist_sport_date', 'sport', 'detected_at'),
        Index('idx_arb_hist_profit_date', 'profit_pct', 'detected_at'),
        Index('idx_arb_hist_player_date', 'player', 'detected_at'),
        Index('idx_arb_hist_profit_pct', 'profit_pct'),
    )

    @classmethod
    def calculate_hash(cls, sport: str, market: str, books: list, line: float) -> str:
        """Calculate deterministic hash for arbitrage deduplication"""
        # Sort books for consistent hashing
        sorted_books = sorted(books) if books else []
        data = f"{sport}|{market}|{','.join(sorted_books)}|{line}"
        return hashlib.sha256(data.encode()).hexdigest()

    @property
    def bookmakers(self) -> list:
        """Get bookmaker list from JSON field"""
        try:
            return json.loads(self.books_json) if self.books_json else []
        except (json.JSONDecodeError, TypeError):
            return []

    @bookmakers.setter
    def bookmakers(self, value: list):
        """Set bookmaker list as JSON"""
        self.books_json = json.dumps(value) if value else "[]"

    def __repr__(self) -> str:
        return f"<ArbitrageHistory(sport='{self.sport}', profit_pct={self.profit_pct:.2f}%, books={len(self.bookmakers)})>"