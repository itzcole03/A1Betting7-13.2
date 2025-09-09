"""
Bet Model - Database model for tracking user bets
"""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.models.base import Base


class Bet(Base):
    __tablename__ = "bets"
    __table_args__ = {"extend_existing": True}

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), nullable=False, index=True
    )
    match_id: Mapped[int] = mapped_column(
        ForeignKey("matches.id"), nullable=False, index=True
    )
    
    # Legacy fields (keeping for backward compatibility)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    
    # Enhanced bankroll management fields
    stake: Mapped[float] = mapped_column(Float, nullable=False)  # Amount wagered
    odds: Mapped[float] = mapped_column(Float, nullable=False)  # Decimal odds
    result: Mapped[str | None] = mapped_column(
        String, nullable=True
    )  # "win", "loss", "push", "void"
    pnl: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )  # Profit/Loss amount
    ev_percent: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )  # Expected value percentage
    kelly_fraction_used: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )  # Kelly fraction used for bet sizing
    
    # Additional bankroll tracking
    fair_odds: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )  # Fair odds calculated
    closing_odds: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )  # Closing line value
    clv_percent: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )  # Closing line value percentage
    bankroll_at_time: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )  # Bankroll size when bet was placed
    bet_size_percent: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )  # Percentage of bankroll wagered
    
    bet_type: Mapped[str] = mapped_column(
        String, nullable=False
    )  # match_winner, over_under, etc.
    selection: Mapped[str] = mapped_column(
        String, nullable=False
    )  # home_team, away_team, over, under
    potential_winnings: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[str] = mapped_column(
        String, default="pending"
    )  # pending, won, lost, void
    
    # Additional context
    sportsbook: Mapped[str | None] = mapped_column(String, nullable=True)
    market: Mapped[str | None] = mapped_column(String, nullable=True)
    player_name: Mapped[str | None] = mapped_column(String, nullable=True)
    confidence_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    placed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    settled_at: Mapped[datetime | None] = mapped_column(
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

    # Relationships
    # user = relationship("User", back_populates="bets")
    match = relationship("Match", back_populates="bets")

    def __repr__(self):
        return f"<Bet(id={self.id}, user_id={self.user_id}, amount={self.amount}, status={self.status})>"

    @property
    def profit_loss(self):
        """Calculate profit/loss for settled bets"""
        # Use explicit pnl if available, otherwise calculate from result
        if self.pnl is not None:
            return self.pnl
        
        if self.result == "win":
            return self.stake * (self.odds - 1)
        elif self.result == "loss":
            return -self.stake
        elif self.result == "push":
            return 0.0
        elif self.status == "won":
            return self.potential_winnings - self.amount
        elif self.status == "lost":
            return -self.amount
        else:
            return 0.0
    
    @property
    def roi_percent(self):
        """Calculate return on investment percentage"""
        if self.stake and self.stake > 0:
            return (self.profit_loss / self.stake) * 100
        return 0.0
    
    @property
    def is_settled(self):
        """Check if bet is settled"""
        return self.result in ["win", "loss", "push", "void"] or self.status in ["won", "lost", "void"]

    def to_dict(self):
        """Convert bet to dictionary for API responses"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "match_id": self.match_id,
            "amount": self.amount,  # Legacy field
            "stake": self.stake,
            "odds": self.odds,
            "result": self.result,
            "pnl": self.pnl,
            "ev_percent": self.ev_percent,
            "kelly_fraction_used": self.kelly_fraction_used,
            "fair_odds": self.fair_odds,
            "closing_odds": self.closing_odds,
            "clv_percent": self.clv_percent,
            "bankroll_at_time": self.bankroll_at_time,
            "bet_size_percent": self.bet_size_percent,
            "bet_type": self.bet_type,
            "selection": self.selection,
            "potential_winnings": self.potential_winnings,
            "status": self.status,
            "sportsbook": self.sportsbook,
            "market": self.market,
            "player_name": self.player_name,
            "confidence_score": self.confidence_score,
            "notes": self.notes,
            "placed_at": self.placed_at.isoformat() if self.placed_at else None,
            "settled_at": self.settled_at.isoformat() if self.settled_at else None,
            "profit_loss": self.profit_loss,
            "roi_percent": self.roi_percent,
            "is_settled": self.is_settled,
        }
