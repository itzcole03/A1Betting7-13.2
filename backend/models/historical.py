from sqlalchemy import TIMESTAMP, Column, DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import relationship

from backend.models.base import Base


class Casino(Base):
    __tablename__ = "casinos"
    __table_args__ = ({"extend_existing": True},)
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    key = Column(String, unique=True, nullable=False)
    # ...extensible fields...


class Score(Base):
    __tablename__ = "scores"
    __table_args__ = ({"extend_existing": True},)
    id = Column(Integer, primary_key=True)
    match_id = Column(Integer, ForeignKey("matches.id"), index=True)
    home_score = Column(Integer)
    away_score = Column(Integer)
    update_time = Column(TIMESTAMP)
    match = relationship("Match", back_populates="scores")


class GameSpread(Base):
    __tablename__ = "game_spreads"
    __table_args__ = ({"extend_existing": True},)
    id = Column(Integer, primary_key=True)
    match_id = Column(Integer, ForeignKey("matches.id"), index=True)
    casino_id = Column(Integer, ForeignKey("casinos.id"), index=True)
    spread = Column(Numeric(4, 1))
    home_team_line = Column(Numeric(5, 2), nullable=True)
    away_team_line = Column(Numeric(5, 2), nullable=True)
    odds_metadata = Column(
        String, nullable=True
    )  # Use JSON type if supported, fallback to String
    update_time = Column(TIMESTAMP)
    match = relationship("Match", back_populates="spreads")
    casino = relationship("Casino")


# Relationship hooks for Match
