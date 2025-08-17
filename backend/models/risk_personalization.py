"""
Risk Management and Personalization Database Models

This module contains all database models for the Risk Management Engine,
User Personalization, and Alerting Foundation system.
"""

from datetime import datetime, timezone, date
import enum

from sqlalchemy import JSON, Column, DateTime, Date, Float, Integer, String, Boolean, ForeignKey, Text, UniqueConstraint, Index, Enum
from sqlalchemy.orm import relationship

from backend.models.base import Base


class BankrollStrategy(enum.Enum):
    """Bankroll management strategies"""
    KELLY = "KELLY"
    FRACTIONAL_KELLY = "FRACTIONAL_KELLY"
    FLAT = "FLAT"


class AlertRuleType(enum.Enum):
    """Types of alert rules"""
    EDGE_EV_THRESHOLD = "EDGE_EV_THRESHOLD"
    LINE_MOVE = "LINE_MOVE"
    EV_DELTA = "EV_DELTA"
    CORRELATION_RISK = "CORRELATION_RISK"
    BANKROLL_DRAWDOWN = "BANKROLL_DRAWDOWN"


class DeliveryChannel(enum.Enum):
    """Alert delivery channels"""
    IN_APP = "IN_APP"
    EMAIL = "EMAIL"
    WEBHOOK = "WEBHOOK"


class AlertStatus(enum.Enum):
    """Alert status options"""
    NEW = "NEW"
    ACK = "ACK"
    DISMISSED = "DISMISSED"


class InterestSignalType(enum.Enum):
    """Types of user interest signals"""
    EDGE_VIEW = "EDGE_VIEW"
    TICKET_ADD = "TICKET_ADD"
    EXPLANATION_REQUEST = "EXPLANATION_REQUEST"


class BankrollProfile(Base):
    """User bankroll management profiles"""
    __tablename__ = "bankroll_profiles"
    __table_args__ = (
        Index('ix_bankroll_user', 'user_id'),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    strategy = Column(Enum(BankrollStrategy), default=BankrollStrategy.FLAT, nullable=False)
    base_bankroll = Column(Float, default=1000.0, nullable=False)
    current_bankroll = Column(Float, default=1000.0, nullable=False)
    kelly_fraction = Column(Float, default=0.25, nullable=True)  # For fractional Kelly
    flat_unit = Column(Float, default=50.0, nullable=True)  # For flat betting
    last_updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    
    # Risk constraints
    max_stake_pct = Column(Float, default=0.05, nullable=False)  # Max stake as % of bankroll
    min_stake = Column(Float, default=1.0, nullable=False)  # Minimum stake amount


class ExposureSnapshot(Base):
    """Daily exposure tracking snapshots"""
    __tablename__ = "exposure_snapshots"
    __table_args__ = (
        Index('ix_exposure_composite', 'user_id', 'date', 'player_id', 'prop_type', 'correlation_cluster_id'),
        Index('ix_exposure_user_date', 'user_id', 'date'),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    player_id = Column(String, nullable=True, index=True)
    prop_type = Column(String(50), nullable=True, index=True)
    correlation_cluster_id = Column(Integer, nullable=True, index=True)
    total_staked = Column(Float, default=0.0, nullable=False)
    tickets_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)


class Watchlist(Base):
    """User watchlists for tracking specific props/players"""
    __tablename__ = "watchlists"
    __table_args__ = (
        Index('ix_watchlist_user', 'user_id'),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    description = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Relationship to watchlist items
    items = relationship("WatchlistItem", back_populates="watchlist", cascade="all, delete-orphan")


class WatchlistItem(Base):
    """Items in user watchlists"""
    __tablename__ = "watchlist_items"
    __table_args__ = (
        UniqueConstraint('watchlist_id', 'prop_id', 'player_id', name='uq_watchlist_item'),
        Index('ix_watchlist_items_watchlist', 'watchlist_id'),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    watchlist_id = Column(Integer, ForeignKey("watchlists.id"), nullable=False)
    prop_id = Column(String, nullable=True, index=True)
    player_id = Column(String, nullable=True, index=True)
    prop_type = Column(String(50), nullable=True, index=True)
    notes = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Relationship back to watchlist
    watchlist = relationship("Watchlist", back_populates="items")


class AlertRule(Base):
    """User-defined alert rules"""
    __tablename__ = "alert_rules"
    __table_args__ = (
        Index('ix_alert_rules_user', 'user_id'),
        Index('ix_alert_rules_active', 'active'),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    rule_type = Column(Enum(AlertRuleType), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(String(500), nullable=True)
    params = Column(JSON, default=lambda: {}, nullable=False)
    active = Column(Boolean, default=True, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    last_triggered_at = Column(DateTime(timezone=True), nullable=True)
    trigger_count = Column(Integer, default=0, nullable=False)
    
    # Cooldown settings
    cooldown_minutes = Column(Integer, default=5, nullable=False)  # Minimum time between triggers
    
    # Relationship to delivered alerts
    alerts = relationship("AlertDelivered", back_populates="alert_rule")


class AlertDelivered(Base):
    """Delivered alerts to users"""
    __tablename__ = "alerts_delivered"
    __table_args__ = (
        Index('ix_alerts_user', 'user_id'),
        Index('ix_alerts_status', 'status'),
        Index('ix_alerts_created', 'created_at'),
        Index('ix_alerts_user_status', 'user_id', 'status'),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    alert_rule_id = Column(Integer, ForeignKey("alert_rules.id"), nullable=True)
    alert_type = Column(Enum(AlertRuleType), nullable=False)
    title = Column(String(200), nullable=False)
    content = Column(JSON, nullable=False)
    delivery_channel = Column(Enum(DeliveryChannel), default=DeliveryChannel.IN_APP, nullable=False)
    status = Column(Enum(AlertStatus), default=AlertStatus.NEW, nullable=False, index=True)
    priority = Column(String(20), default="NORMAL", nullable=False)  # LOW, NORMAL, HIGH, CRITICAL
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationship back to alert rule
    alert_rule = relationship("AlertRule", back_populates="alerts")


class UserInterestSignal(Base):
    """User interaction signals for personalization"""
    __tablename__ = "user_interest_signals"
    __table_args__ = (
        Index('ix_interest_composite', 'user_id', 'player_id', 'prop_type'),
        Index('ix_interest_signals_date', 'user_id', 'created_at'),
        Index('ix_interest_signals_type', 'signal_type'),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    player_id = Column(String, nullable=True, index=True)
    prop_type = Column(String(50), nullable=True, index=True)
    signal_type = Column(Enum(InterestSignalType), nullable=False)
    weight = Column(Float, default=1.0, nullable=False)
    context = Column(JSON, default=lambda: {}, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)


class RecommendedStake(Base):
    """Cached stake recommendations for edges"""
    __tablename__ = "recommended_stakes"
    __table_args__ = (
        UniqueConstraint('user_id', 'edge_id', 'strategy_version', name='uq_stake_recommendation'),
        Index('ix_stake_expiry', 'expires_at'),
        Index('ix_stake_user_edge', 'user_id', 'edge_id'),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    edge_id = Column(Integer, nullable=False, index=True)  # References Edge model
    strategy_version = Column(String(50), nullable=False)  # Hash of strategy + bankroll state
    recommended_stake = Column(Float, nullable=False)
    confidence = Column(Float, default=1.0, nullable=False)  # 0-1 confidence score
    rationale = Column(String(1000), nullable=True)
    rationale_hash = Column(String(64), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)  # For cache expiration
    
    # Risk factors used in calculation
    kelly_multiplier = Column(Float, nullable=True)
    risk_adjustment = Column(Float, nullable=True)
    exposure_constraint = Column(Float, nullable=True)