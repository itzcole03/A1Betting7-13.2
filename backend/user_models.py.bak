"""
Enhanced User Database Models
"""

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from sqlalchemy import (
    JSON, Boolean, Column, DateTime, Float, String, Text, 
    ForeignKey, Index, Integer, func
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from database import Base


class User(Base):
    """Enhanced user model with comprehensive features."""
    
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    
    # Status fields
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    is_premium = Column(Boolean, default=False, nullable=False)
    role = Column(String(50), default="user", nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)
    email_verified_at = Column(DateTime(timezone=True), nullable=True)
    
    # User preferences and settings
    preferences = Column(JSON, default=dict)
    notification_settings = Column(JSON, default=dict)
    
    # Financial tracking
    balance = Column(Float, default=0.0)
    total_deposits = Column(Float, default=0.0)
    total_withdrawals = Column(Float, default=0.0)
    
    # Relationships
    bets = relationship("UserBet", back_populates="user", cascade="all, delete-orphan")
    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")
    transactions = relationship("UserTransaction", back_populates="user", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index("idx_users_email", "email"),
        Index("idx_users_active", "is_active"),
        Index("idx_users_created", "created_at"),
    )
    
    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, name={self.name})>"


class UserSession(Base):
    """User session tracking."""
    
    __tablename__ = "user_sessions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    session_token = Column(String(255), unique=True, nullable=False)
    refresh_token = Column(String(255), unique=True, nullable=False)
    
    # Session metadata
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    device_info = Column(JSON, default=dict)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)
    last_used_at = Column(DateTime(timezone=True), default=func.now())
    
    # Status
    is_active = Column(Boolean, default=True)
    
    # Relationship
    user = relationship("User", back_populates="sessions")
    
    __table_args__ = (
        Index("idx_sessions_user", "user_id"),
        Index("idx_sessions_token", "session_token"),
        Index("idx_sessions_expires", "expires_at"),
    )


class UserBet(Base):
    """User betting history."""
    
    __tablename__ = "user_bets"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Bet details
    event_id = Column(String(255), nullable=False)
    bet_type = Column(String(100), nullable=False)
    selection = Column(String(255), nullable=False)
    
    # Financial details
    stake = Column(Float, nullable=False)
    odds = Column(Float, nullable=False)
    potential_payout = Column(Float, nullable=False)
    actual_payout = Column(Float, default=0.0)
    
    # Status and result
    status = Column(String(50), default="pending")  # pending, won, lost, void, cancelled
    result = Column(String(50), nullable=True)
    
    # Metadata
    bet_data = Column(JSON, default=dict)
    ai_recommendation = Column(JSON, default=dict)
    confidence_score = Column(Float, nullable=True)
    
    # Timestamps
    placed_at = Column(DateTime(timezone=True), default=func.now())
    settled_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationship
    user = relationship("User", back_populates="bets")
    
    __table_args__ = (
        Index("idx_bets_user", "user_id"),
        Index("idx_bets_status", "status"),
        Index("idx_bets_placed", "placed_at"),
    )


class UserTransaction(Base):
    """User financial transactions."""
    
    __tablename__ = "user_transactions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Transaction details
    transaction_type = Column(String(50), nullable=False)  # deposit, withdrawal, bet_stake, bet_payout, bonus
    amount = Column(Float, nullable=False)
    balance_before = Column(Float, nullable=False)
    balance_after = Column(Float, nullable=False)
    
    # Status and metadata
    status = Column(String(50), default="completed")
    reference = Column(String(255), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    metadata = Column(JSON, default=dict)
    
    # External references
    external_id = Column(String(255), nullable=True)
    payment_method = Column(String(100), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=func.now())
    processed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationship
    user = relationship("User", back_populates="transactions")
    
    __table_args__ = (
        Index("idx_transactions_user", "user_id"),
        Index("idx_transactions_type", "transaction_type"),
        Index("idx_transactions_status", "status"),
        Index("idx_transactions_created", "created_at"),
    )


class UserPreference(Base):
    """User preference management."""
    
    __tablename__ = "user_preferences"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Preference details
    category = Column(String(100), nullable=False)
    key = Column(String(255), nullable=False)
    value = Column(JSON, nullable=False)
    
    # Metadata
    is_encrypted = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())
    
    __table_args__ = (
        Index("idx_preferences_user", "user_id"),
        Index("idx_preferences_category", "category"),
        Index("idx_preferences_key", "key"),
    )