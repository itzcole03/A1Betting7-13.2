"""
Database Service

This module provides a unified database service with properly configured models.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Optional, Type, Union

import os
from backend.config_manager import get_database_url
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    create_engine,
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session, relationship, sessionmaker

from backend.models.match import Match

logger = logging.getLogger(__name__)

# Unified Base for all models
Base = declarative_base()

# Database setup
# Use a test-friendly synchronous SQLite engine when running under TESTING
db_url = get_database_url()
if os.environ.get("TESTING", "false").lower() in ("1", "true", "yes"):
    # If the configured URL is async (e.g. sqlite+aiosqlite://) tests can hit
    # SQLAlchemy/greenlet issues. Use a file-backed synchronous SQLite for tests.
    if "aiosqlite" in db_url or "+async" in db_url:
        sync_url = "sqlite:///./a1betting_test.db"
    else:
        sync_url = db_url
    engine = create_engine(sync_url, connect_args={"check_same_thread": False})
else:
    engine = create_engine(db_url, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class User(Base):
    """User model for the database service"""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    bets = relationship("Bet", back_populates="user")


class Bet(Base):
    """Bet model for tracking user bets"""

    __tablename__ = "bets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    match_id = Column(Integer, ForeignKey("matches.id"), nullable=False)
    amount = Column(Float, nullable=False)
    odds = Column(Float, nullable=False)
    bet_type = Column(String, nullable=False)
    selection = Column(String, nullable=False)
    potential_winnings = Column(Float, nullable=False)
    status = Column(String, default="pending")
    placed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    settled_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="bets")
    match = relationship("Match", back_populates="bets")

    @property
    def profit_loss(self) -> float:
        """Calculate profit/loss for settled bets
        
        Returns:
            Profit/loss amount. Positive for profit, negative for loss, 0 for pending
        """
        if self.status == "won":
            return self.potential_winnings - self.amount
        elif self.status == "lost":
            return -self.amount
        else:
            return 0.0


class DatabaseService:
    """Database service class for managing database operations"""

    def __init__(self) -> None:
        self.Base = Base
        self.User = User
        self.Match = Match
        self.Bet = Bet
        self.engine = engine
        self.SessionLocal = SessionLocal

    def create_tables(self) -> None:
        """Create all database tables"""
        """Create all database tables"""
        try:
            Base.metadata.create_all(bind=engine)
            logger.info("Database tables created successfully")
        except Exception as e:
            logger.error(f"Error creating database tables: {e}")
            raise

    def get_session(self) -> sessionmaker:
        """Get database session
        
        Returns:
            Database session factory
        """
        return SessionLocal()


def create_tables() -> None:
    """Create all database tables"""
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Error creating database tables: {e}")
        raise


def get_db_session() -> sessionmaker:
    """Get database session
    
    Returns:
        Database session (caller responsible for closing)
    """
    db = SessionLocal()
    try:
        return db
    finally:
        pass  # Session will be closed by caller


# Initialize database and create singleton
database_service: Union[DatabaseService, Any]

# Do NOT create tables at import time. Tests or the application startup
# should explicitly call `initialize_database_for_tests()` or otherwise
# create the schema. This avoids schema ordering and import-time side
# effects that break test runs.
try:
    # Provide a default fallback service to keep the module importable.
    class _FallbackDatabaseService:
        def __init__(self):
            self.Base = Base
            self.User = User
            self.Match = Match
            self.Bet = Bet

    database_service = _FallbackDatabaseService()
    logger.info("Database service module imported (lazy initialization). Call initialize_database_for_tests() to create schema.")
except Exception as e:
    # Extremely defensive fallback
    logger.error(f"Database module import fallback failed: {e}")
    database_service = None


def initialize_database_for_tests(create_if_missing: bool = True) -> DatabaseService:
    """Initialize the DatabaseService and create tables (for tests or explicit initialization).

    Args:
        create_if_missing: If True, call create_tables() before returning service.

    Returns:
        DatabaseService: initialized service instance bound to module-level engine.
    """
    global database_service

    try:
        svc = DatabaseService()
        if create_if_missing:
            create_tables()
        database_service = svc
        logger.info("Database service initialized via initialize_database_for_tests()")
        return svc
    except Exception as e:
        logger.error(f"Failed to initialize database service: {e}")
        raise
