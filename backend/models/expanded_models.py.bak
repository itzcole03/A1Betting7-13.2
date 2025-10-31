# Models for schema expansion: Team, Event, Odds

from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class Team(Base):
    __tablename__ = "teams"
    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, nullable=False)
    provider_id = Column(String, nullable=True)
    # Relationship to Odds
    odds = relationship("Odds", back_populates="team")


class Event(Base):
    __tablename__ = "events"
    id = Column(Integer, primary_key=True)
    event_id = Column(Integer, unique=True, nullable=False)
    name = Column(String, nullable=False)
    start_time = Column(DateTime, nullable=False)
    provider_id = Column(String, nullable=True)
    # Relationship to Odds
    odds = relationship("Odds", back_populates="event")


class Odds(Base):
    __tablename__ = "odds"
    id: Mapped[int] = mapped_column(primary_key=True)
    event_id: Mapped[int] = mapped_column(
        ForeignKey("events.id"), nullable=False, index=True
    )
    team_id: Mapped[int] = mapped_column(
        ForeignKey("teams.id"), nullable=False, index=True
    )
    odds_type: Mapped[str] = mapped_column(String, nullable=False)
    value: Mapped[float] = mapped_column(Float, nullable=False)
    provider_id: Mapped[str | None] = mapped_column(String, nullable=True)
    # Relationships
    event = relationship("Event", back_populates="odds")
    team = relationship("Team", back_populates="odds")
    __table_args__ = (
        UniqueConstraint(
            "event_id",
            "team_id",
            "odds_type",
            "provider_id",
            name="uq_odds_event_team_type_provider",
        ),
    )
