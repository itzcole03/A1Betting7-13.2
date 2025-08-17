"""
SQLAlchemy Database Models for Ingestion Pipeline

This module defines the database schema for the ingestion pipeline, including:
- players: Player information with external identifiers
- props: Proposition bet definitions linked to players
- market_quotes: Time-series market data with change tracking
- ingest_runs: Metadata and observability for ingestion operations

All models follow the existing project's SQLAlchemy patterns and include
proper indexing for performance.
"""

from datetime import datetime
from typing import Dict, Any, Optional
import json

from sqlalchemy import (
    Column, 
    Integer, 
    String, 
    Float, 
    Boolean, 
    DateTime, 
    ForeignKey,
    Text,
    Index,
    UniqueConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.types import TypeDecorator

from ...models.base import Base


class JSONType(TypeDecorator):
    """Custom JSON type for SQLAlchemy that handles serialization."""
    impl = Text
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is not None:
            return json.dumps(value)
        return value

    def process_result_value(self, value, dialect):
        if value is not None:
            return json.loads(value)
        return value


class Player(Base):
    """
    Player model with external provider references and canonical information.
    
    Supports multi-provider mapping through external_refs JSON field.
    """
    __tablename__ = "players"
    
    id = Column(Integer, primary_key=True)
    external_refs = Column(JSONType, nullable=False, default=dict)  # Provider ID mappings
    name = Column(String(255), nullable=False)
    team = Column(String(10), nullable=True)  # Team abbreviation
    position = Column(String(10), nullable=True)
    sport = Column(String(10), nullable=False, default="NBA")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    props = relationship("Prop", back_populates="player", cascade="all, delete-orphan")
    
    # Indexes
    __table_args__ = (
        Index('ix_players_sport_name', 'sport', 'name'),
        Index('ix_players_team', 'team'),
    )

    def __repr__(self):
        return f"<Player(id={self.id}, name='{self.name}', team='{self.team}', sport='{self.sport}')>"


class Prop(Base):
    """
    Proposition bet definition linked to a player.
    
    Defines the type of bet (points, assists, etc.) and maintains active status.
    """
    __tablename__ = "props"
    
    id = Column(Integer, primary_key=True)
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    prop_type = Column(String(50), nullable=False)  # POINTS, ASSISTS, REBOUNDS, etc.
    base_unit = Column(String(20), nullable=True)   # "points", "assists", etc.
    sport = Column(String(10), nullable=False, default="NBA")
    active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    player = relationship("Player", back_populates="props")
    market_quotes = relationship("MarketQuote", back_populates="prop", cascade="all, delete-orphan")
    
    # Constraints
    __table_args__ = (
        UniqueConstraint('player_id', 'prop_type', name='uq_player_prop_type'),
        Index('ix_props_sport_prop_type', 'sport', 'prop_type'),
    )

    def __repr__(self):
        return f"<Prop(id={self.id}, player_id={self.player_id}, prop_type='{self.prop_type}', active={self.active})>"


class MarketQuote(Base):
    """
    Time-series market quotes for props with change tracking.
    
    Captures market data snapshots with line change detection and
    maintains first_seen/last_seen timestamps for quote lifecycle.
    """
    __tablename__ = "market_quotes"
    
    id = Column(Integer, primary_key=True)
    prop_id = Column(Integer, ForeignKey("props.id"), nullable=False)
    source = Column(String(50), nullable=False)  # Provider name
    offered_line = Column(Float, nullable=False)
    payout_schema = Column(JSONType, nullable=False, default=dict)  # {"type":"flex","over":1.0,"under":1.0}
    odds_format = Column(String(20), nullable=True)  # "american", "decimal", etc.
    line_hash = Column(String(64), nullable=False)  # Stable hash for change detection
    first_seen_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    last_seen_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    last_change_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationships
    prop = relationship("Prop", back_populates="market_quotes")
    
    # Indexes for efficient queries
    __table_args__ = (
        Index('ix_market_quotes_prop_source_last_seen', 'prop_id', 'source', 'last_seen_at'),
        Index('ix_market_quotes_line_hash', 'line_hash'),
        Index('ix_market_quotes_last_change', 'last_change_at'),
    )

    def __repr__(self):
        return f"<MarketQuote(id={self.id}, prop_id={self.prop_id}, source='{self.source}', offered_line={self.offered_line})>"


class IngestRun(Base):
    """
    Metadata and observability for ingestion pipeline runs.
    
    Tracks pipeline execution metrics, errors, and performance data
    for monitoring and debugging ingestion operations.
    """
    __tablename__ = "ingest_runs"
    
    id = Column(Integer, primary_key=True)
    sport = Column(String(10), nullable=False)
    source = Column(String(50), nullable=False)  # Provider name
    started_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    finished_at = Column(DateTime, nullable=True)
    status = Column(String(20), nullable=False, default="running")  # running, success, partial, failed
    total_raw = Column(Integer, nullable=False, default=0)  # Raw records fetched
    total_new_quotes = Column(Integer, nullable=False, default=0)  # New quote records created
    total_line_changes = Column(Integer, nullable=False, default=0)  # Line changes detected
    total_new_players = Column(Integer, nullable=False, default=0)  # New players created
    total_new_props = Column(Integer, nullable=False, default=0)  # New props created
    errors = Column(JSONType, nullable=False, default=list)  # Error details
    duration_ms = Column(Integer, nullable=True)  # Execution duration
    
    # Indexes
    __table_args__ = (
        Index('ix_ingest_runs_sport_source_started', 'sport', 'source', 'started_at'),
        Index('ix_ingest_runs_status', 'status'),
    )

    def __repr__(self):
        return f"<IngestRun(id={self.id}, sport='{self.sport}', source='{self.source}', status='{self.status}')>"

    def mark_completed(self, status: str = "success"):
        """Mark the ingestion run as completed with final status."""
        self.finished_at = datetime.utcnow()
        self.status = status
        if self.started_at:
            self.duration_ms = int((self.finished_at - self.started_at).total_seconds() * 1000)

    def add_error(self, error_type: str, message: str, context: Optional[Dict[str, Any]] = None):
        """Add an error to the run's error list."""
        error_entry = {
            "type": error_type,
            "message": message,
            "timestamp": datetime.utcnow().isoformat(),
            "context": context or {}
        }
        if self.errors is None:
            self.errors = []
        self.errors.append(error_entry)