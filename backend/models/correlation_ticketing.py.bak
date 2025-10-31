"""
Correlation and Ticketing Database Models - SQLAlchemy models for correlation analytics and parlay ticket construction
"""

from __future__ import annotations

import enum
from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Index,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from backend.models.base import Base


class TicketStatus(enum.Enum):
    """Ticket status lifecycle"""
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    CANCELLED = "CANCELLED"


class HistoricalPropOutcome(Base):
    """Historical prop outcomes for correlation analysis"""
    __tablename__ = "historical_prop_outcomes"
    __table_args__ = (
        Index("idx_historical_player_prop_date", "player_id", "prop_type", "event_date"),
        Index("idx_historical_prop_id", "prop_id"),
        Index("idx_historical_event_date", "event_date"),
        Index("idx_historical_source", "source"),
    )

    id = Column(Integer, primary_key=True, index=True)
    prop_id = Column(Integer, nullable=True)  # FK to props table (nullable for generic stats)
    player_id = Column(Integer, nullable=False)  # FK to players table
    prop_type = Column(String(50), nullable=False)  # POINTS, ASSISTS, REBOUNDS, etc.
    event_date = Column(DateTime(timezone=False), nullable=False)  # Date of the game/event
    actual_value = Column(Float, nullable=False)  # The actual statistical outcome
    source = Column(String(50), nullable=False, default="synthetic")  # "synthetic", "official", etc.
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )


class PropCorrelationStat(Base):
    """Pairwise correlation statistics between props"""
    __tablename__ = "prop_correlation_stats"
    __table_args__ = (
        Index("idx_correlation_prop_pair", "prop_id_a", "prop_id_b"),
        Index("idx_correlation_context", "context_hash"),
        Index("idx_correlation_sport", "sport"),
        Index("idx_correlation_computed", "last_computed_at"),
        UniqueConstraint("prop_id_a", "prop_id_b", "context_hash", name="uq_prop_correlation"),
    )

    id = Column(Integer, primary_key=True, index=True)
    prop_id_a = Column(Integer, nullable=False)  # FK to props table (smaller ID)
    prop_id_b = Column(Integer, nullable=False)  # FK to props table (larger ID)
    sport = Column(String(10), nullable=False, default="MLB")
    sample_size = Column(Integer, nullable=False, default=0)
    pearson_r = Column(Float, nullable=False, default=0.0)
    last_computed_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )
    context_hash = Column(String(64), nullable=False)  # Hash of context (game_id, etc.)
    method = Column(String(20), nullable=False, default="pearson")  # 'pearson', 'factor_approx'


class CorrelationCluster(Base):
    """Correlation clusters for grouped prop analysis"""
    __tablename__ = "correlation_clusters"
    __table_args__ = (
        Index("idx_cluster_sport", "sport"),
        Index("idx_cluster_key", "cluster_key"),
        Index("idx_cluster_computed", "computed_at"),
    )

    id = Column(Integer, primary_key=True, index=True)
    sport = Column(String(10), nullable=False, default="MLB")
    cluster_key = Column(String(128), nullable=False)  # context_hash + timestamp bucket
    member_prop_ids = Column(JSON, nullable=False)  # Array of prop_ids in cluster
    average_internal_r = Column(Float, nullable=False, default=0.0)
    computed_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )


class Ticket(Base):
    """Parlay tickets for multi-leg betting"""
    __tablename__ = "tickets"
    __table_args__ = (
        Index("idx_ticket_user_status", "user_id", "status"),
        Index("idx_ticket_status_created", "status", "created_at"),
        Index("idx_ticket_submitted", "submitted_at"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)  # Placeholder for user system integration
    status = Column(Enum(TicketStatus), nullable=False, default=TicketStatus.DRAFT)
    stake = Column(Float, nullable=False)
    potential_payout = Column(Float, nullable=False)
    estimated_ev = Column(Float, nullable=False)
    legs_count = Column(Integer, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )
    submitted_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    legs = relationship("TicketLeg", back_populates="ticket", cascade="all, delete-orphan")


class TicketLeg(Base):
    """Individual legs (bets) within a parlay ticket"""
    __tablename__ = "ticket_legs"
    __table_args__ = (
        Index("idx_ticket_leg_ticket", "ticket_id"),
        Index("idx_ticket_leg_edge", "edge_id"),
        Index("idx_ticket_leg_prop", "prop_id"),
    )

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False)
    edge_id = Column(Integer, ForeignKey("edges.id"), nullable=False)
    prop_id = Column(Integer, nullable=False)  # FK to props table
    
    # Snapshot data at time of ticket creation for audit trail
    offered_line_snapshot = Column(Float, nullable=False)
    prob_over_snapshot = Column(Float, nullable=False)
    fair_line_snapshot = Column(Float, nullable=False)
    valuation_hash_snapshot = Column(String(64), nullable=False)
    
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    ticket = relationship("Ticket", back_populates="legs")
    edge = relationship("Edge")  # Reference to Edge from modeling.py