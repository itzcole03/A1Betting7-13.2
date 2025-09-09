"""
Enhanced CLV Bet Tracking Models

Comprehensive CLV tracking system that extends existing models with user-level analytics,
batch processing capabilities, and advanced CLV computation features.
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, Index, JSON
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
import uuid
from enum import Enum

Base = declarative_base()


class BetStatus:
    """Bet tracking status constants"""
    PENDING = "pending"
    ACTIVE = "active"
    SETTLED = "settled"
    VOID = "void"
    CANCELLED = "cancelled"


class CLVComputationStatus(str, Enum):
    """CLV computation status with Enum semantics (string values)."""
    PENDING = "pending"
    COMPUTED = "computed"
    ERROR = "error"
    MANUAL = "manual"


class BetResult(str, Enum):
    """Bet result values with Enum semantics (string values)."""
    WIN = "win"
    LOSS = "loss"
    PUSH = "push"
    VOID = "void"


class CLVBetTracking(Base):
    """Enhanced CLV bet tracking with user-level analytics"""
    __tablename__ = "clv_bet_tracking"
    
    # Primary identification
    id = Column(Integer, primary_key=True)
    bet_id = Column(String(50), unique=True, nullable=False, index=True)
    user_id = Column(String(50), nullable=False, index=True)
    
    # Bet placement details
    sport = Column(String(20), nullable=False, index=True)
    market = Column(String(100), nullable=False, index=True)
    player = Column(String(100), nullable=True, index=True)
    team = Column(String(100), nullable=True)
    opponent = Column(String(100), nullable=True)
    
    # Betting details
    bet_type = Column(String(50), nullable=False)
    stake_amount = Column(Float, nullable=False)
    placed_odds = Column(Integer, nullable=False)
    placed_line = Column(Float, nullable=True)
    sportsbook = Column(String(50), nullable=True)
    
    # Timing
    placed_at = Column(DateTime, nullable=False, index=True)
    game_start_time = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    
    # CLV tracking
    closing_odds = Column(Integer, nullable=True)
    closing_line = Column(Float, nullable=True)
    closing_captured_at = Column(DateTime, nullable=True)
    
    # CLV computation
    clv_percent = Column(Float, nullable=True, index=True)
    clv_status = Column(String(20), default=CLVComputationStatus.PENDING.value, index=True)
    clv_computed_at = Column(DateTime, nullable=True)
    
    # Bet outcome tracking
    bet_status = Column(String(20), default=BetStatus.PENDING, index=True)
    actual_result = Column(Float, nullable=True)
    bet_result = Column(String(10), nullable=True)
    profit_loss = Column(Float, nullable=True)
    settled_at = Column(DateTime, nullable=True)
    
    # Metadata and analytics
    opening_odds = Column(Integer, nullable=True)
    opening_line = Column(Float, nullable=True)
    line_movement = Column(Float, nullable=True)
    odds_movement = Column(Integer, nullable=True)
    
    # Additional context
    bet_confidence = Column(Float, nullable=True)
    bet_tags = Column(JSON, nullable=True)
    bet_notes = Column(String(500), nullable=True)
    
    # Processing metadata
    batch_id = Column(String(50), nullable=True, index=True)
    processing_version = Column(String(10), default="v1")
    external_bet_id = Column(String(100), nullable=True, index=True)
    
    # Quality and validation
    data_quality_score = Column(Float, nullable=True)
    validation_flags = Column(JSON, nullable=True)
    
    # Indexes for efficient querying
    __table_args__ = (
        Index('idx_user_placed', 'user_id', 'placed_at'),
        Index('idx_sport_market', 'sport', 'market'),
        Index('idx_clv_status', 'clv_status', 'clv_percent'),
        Index('idx_bet_status', 'bet_status', 'settled_at'),
        Index('idx_player_sport', 'player', 'sport'),
    )


class CLVAnalyticsSummary(Base):
    """Aggregated CLV analytics for performance tracking"""
    __tablename__ = "clv_analytics_summary"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(String(50), nullable=False, index=True)
    period_start = Column(DateTime, nullable=False, index=True)
    period_end = Column(DateTime, nullable=False, index=True)
    
    # Basic statistics
    total_bets = Column(Integer, nullable=False)
    bets_with_clv = Column(Integer, nullable=False)
    avg_clv_percent = Column(Float, nullable=True)
    median_clv_percent = Column(Float, nullable=True)
    
    # CLV distribution
    clv_excellent_count = Column(Integer, default=0)
    clv_good_count = Column(Integer, default=0)
    clv_positive_count = Column(Integer, default=0)
    clv_slight_negative_count = Column(Integer, default=0)
    clv_poor_count = Column(Integer, default=0)
    
    # Performance metrics
    positive_clv_rate = Column(Float, nullable=True)
    avg_stake = Column(Float, nullable=True)
    total_stake = Column(Float, nullable=True)
    
    # Profitability (if available)
    total_profit_loss = Column(Float, nullable=True)
    roi_percent = Column(Float, nullable=True)
    win_rate = Column(Float, nullable=True)
    
    # Sport/market breakdown
    top_sport = Column(String(20), nullable=True)
    top_market = Column(String(100), nullable=True)
    sport_breakdown = Column(JSON, nullable=True)
    market_breakdown = Column(JSON, nullable=True)
    
    # Metadata
    computed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    computation_version = Column(String(10), default="v1")
    
    # Indexes
    __table_args__ = (
        Index('idx_user_period', 'user_id', 'period_start', 'period_end'),
        Index('idx_computed_at', 'computed_at'),
    )


class CLVLeaderboard(Base):
    """CLV leaderboard for user rankings and gamification"""
    __tablename__ = "clv_leaderboard"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(String(50), nullable=False, index=True)
    username = Column(String(50), nullable=True)
    
    # Ranking metrics
    rank_overall = Column(Integer, nullable=True, index=True)
    rank_30d = Column(Integer, nullable=True, index=True)
    rank_7d = Column(Integer, nullable=True, index=True)
    
    # Performance scores
    clv_score = Column(Float, nullable=True)
    consistency_score = Column(Float, nullable=True)
    volume_score = Column(Float, nullable=True)
    
    # Period statistics
    clv_30d_avg = Column(Float, nullable=True)
    clv_7d_avg = Column(Float, nullable=True)
    bets_30d = Column(Integer, nullable=True)
    bets_7d = Column(Integer, nullable=True)
    
    # Achievements
    achievement_badges = Column(JSON, nullable=True)
    milestone_reached = Column(String(50), nullable=True)
    
    # Metadata
    last_updated = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    
    # Indexes
    __table_args__ = (
        Index('idx_rank_overall', 'rank_overall'),
        Index('idx_rank_30d', 'rank_30d'),
        Index('idx_rank_7d', 'rank_7d'),
        Index('idx_clv_score', 'clv_score'),
    )