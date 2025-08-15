"""
Bet Model - Database model for tracking user bets
"""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String
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
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    odds: Mapped[float] = mapped_column(Float, nullable=False)
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
        if self.status == "won":
            return self.potential_winnings - self.amount
        elif self.status == "lost":
            return -self.amount
        else:
            return 0.0

    def to_dict(self):
        """Convert bet to dictionary for API responses"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "match_id": self.match_id,
            "amount": self.amount,
            "odds": self.odds,
            "bet_type": self.bet_type,
            "selection": self.selection,
            "potential_winnings": self.potential_winnings,
            "status": self.status,
            "placed_at": self.placed_at.isoformat() if self.placed_at else None,
            "settled_at": self.settled_at.isoformat() if self.settled_at else None,
            "profit_loss": self.profit_loss,
        }
