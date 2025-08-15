"""
Database Service

This module provides a unified database service with properly configured models.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Optional, Type, Union

from config_manager import get_database_url
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
engine = create_engine(get_database_url(), connect_args={"check_same_thread": False})
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
try:
    create_tables()
    database_service = DatabaseService()
    logger.info("Database service initialized successfully")
except Exception as e:
    logger.error(f"Database service initialization failed: {e}")

    # Create a minimal fallback service
    class FallbackDatabaseService:
        def __init__(self):
            self.Base = Base
            self.User = User
            self.Match = Match
            self.Bet = Bet

    database_service = FallbackDatabaseService()
