"""
Bet Model - Database model for tracking user bets
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class Bet(Base):
    __tablename__ = "bets"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    match_id = Column(Integer, ForeignKey("matches.id"), nullable=False)
    amount = Column(Float, nullable=False)
    odds = Column(Float, nullable=False)
    bet_type = Column(String, nullable=False)  # match_winner, over_under, etc.
    selection = Column(String, nullable=False)  # home_team, away_team, over, under
    potential_winnings = Column(Float, nullable=False)
    status = Column(String, default="pending")  # pending, won, lost, void
    placed_at = Column(DateTime, default=datetime.utcnow)
    settled_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    # user = relationship("User", back_populates="bets")
    # match = relationship("Match", back_populates="bets")
    
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
            "profit_loss": self.profit_loss
        }
