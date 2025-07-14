"""
Database Service

This module provides a unified database service with properly configured models.
"""

import logging
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime

from config_manager import get_database_url

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
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    bets = relationship("Bet", back_populates="user")


class Match(Base):
    """Match model for sports matches"""
    __tablename__ = "matches"
    
    id = Column(Integer, primary_key=True, index=True)
    home_team = Column(String, nullable=False)
    away_team = Column(String, nullable=False)
    sport = Column(String, nullable=False)
    league = Column(String, nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=True)
    status = Column(String, default="scheduled")
    home_score = Column(Integer, nullable=True)
    away_score = Column(Integer, nullable=True)
    external_id = Column(String, nullable=True)
    has_live_odds = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    bets = relationship("Bet", back_populates="match")


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
    placed_at = Column(DateTime, default=datetime.utcnow)
    settled_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="bets")
    match = relationship("Match", back_populates="bets")
    
    @property
    def profit_loss(self):
        """Calculate profit/loss for settled bets"""
        if self.status == "won":
            return self.potential_winnings - self.amount
        elif self.status == "lost":
            return -self.amount
        else:
            return 0.0


class DatabaseService:
    """Database service class"""
    
    def __init__(self):
        self.Base = Base
        self.User = User
        self.Match = Match
        self.Bet = Bet
        self.engine = engine
        self.SessionLocal = SessionLocal
    
    def create_tables(self):
        """Create all database tables"""
        try:
            Base.metadata.create_all(bind=engine)
            logger.info("✅ Database tables created successfully")
        except Exception as e:
            logger.error(f"❌ Error creating database tables: {e}")
            raise
    
    def get_session(self):
        """Get database session"""
        return SessionLocal()


def create_tables():
    """Create all database tables"""
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("✅ Database tables created successfully")
    except Exception as e:
        logger.error(f"❌ Error creating database tables: {e}")
        raise


def get_db_session():
    """Get database session"""
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