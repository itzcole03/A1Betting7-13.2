"""
SQLAlchemy Models for Best Line Aggregation & Odds History Storage

This module implements the core database models for Phase 1.2 PropFinder functionality:
- Bookmaker registry with metadata
- OddsSnapshot for real-time odds storage
- OddsHistory for line movement tracking
- Best line detection and aggregation

Key Features:
- Multi-sportsbook odds comparison
- Historical line movement tracking
- Best line detection algorithms
- Integration with OddsNormalizer for no-vig calculations
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey, Index, UniqueConstraint
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime, timezone
import enum
from typing import Optional, Dict, List

from backend.models.base import Base


class BookmakerStatus(enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    MAINTENANCE = "maintenance"


class Bookmaker(Base):
    """Bookmaker/Sportsbook registry with metadata and status tracking"""
    __tablename__ = 'bookmakers'
    
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    display_name: Mapped[str] = mapped_column(String(100), nullable=False)
    short_name: Mapped[str] = mapped_column(String(20), nullable=False)  # DK, FD, etc.
    
    # Bookmaker metadata
    website_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    api_endpoint: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    country_code: Mapped[Optional[str]] = mapped_column(String(3), nullable=True)  # US, UK, etc.
    
    # Status and reliability
    status: Mapped[BookmakerStatus] = mapped_column(default=BookmakerStatus.ACTIVE)
    is_trusted: Mapped[bool] = mapped_column(Boolean, default=True)
    reliability_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # 0.0 - 1.0
    
    # API integration settings
    api_key_required: Mapped[bool] = mapped_column(Boolean, default=False)
    rate_limit_per_minute: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    last_successful_fetch: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    consecutive_failures: Mapped[int] = mapped_column(Integer, default=0)
    
    # Priority and weighting
    priority_weight: Mapped[float] = mapped_column(Float, default=1.0)  # For best line calculations
    include_in_consensus: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    odds_snapshots = relationship("OddsSnapshot", back_populates="bookmaker")
    odds_history = relationship("OddsHistory", back_populates="bookmaker")
    
    def __repr__(self):
        return f"<Bookmaker(name='{self.name}', status='{self.status.value}')>"


class OddsSnapshot(Base):
    """Current odds snapshot for real-time best line detection"""
    __tablename__ = 'odds_snapshots'
    
    id: Mapped[int] = mapped_column(primary_key=True)
    
    # Prop identification
    prop_id: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    game_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    player_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True, index=True)
    sport: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    market_type: Mapped[str] = mapped_column(String(50), nullable=False)  # Points, Assists, etc.
    
    # Bookmaker reference
    bookmaker_id: Mapped[int] = mapped_column(ForeignKey('bookmakers.id'), nullable=False, index=True)
    bookmaker = relationship("Bookmaker", back_populates="odds_snapshots")
    
    # Odds data (American format)
    line: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    over_odds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    under_odds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Decimal odds (for calculations)
    over_decimal: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    under_decimal: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Normalized probabilities (no-vig adjusted)
    over_implied_prob: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    under_implied_prob: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Market metadata
    volume_indicator: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)  # HIGH/MED/LOW
    is_available: Mapped[bool] = mapped_column(Boolean, default=True)
    limits_info: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON string with limit data
    
    # Timestamps
    captured_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    source_timestamp: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)  # Bookmaker's timestamp
    
    # Unique constraint to prevent duplicate snapshots
    __table_args__ = (
        UniqueConstraint('prop_id', 'bookmaker_id', 'captured_at', name='uq_snapshot_prop_book_time'),
        Index('idx_snapshot_prop_available', 'prop_id', 'is_available'),
        Index('idx_snapshot_sport_time', 'sport', 'captured_at'),
        Index('idx_snapshot_recent', 'captured_at', postgresql_where='captured_at > NOW() - INTERVAL \'1 hour\''),
    )
    
    def __repr__(self):
        return f"<OddsSnapshot(prop_id='{self.prop_id}', bookmaker='{self.bookmaker.short_name if self.bookmaker else 'N/A'}')>"


class OddsHistory(Base):
    """Historical odds data for line movement analysis"""
    __tablename__ = 'odds_history'
    
    id: Mapped[int] = mapped_column(primary_key=True)
    
    # Reference to current snapshot
    snapshot_id: Mapped[int] = mapped_column(ForeignKey('odds_snapshots.id'), nullable=False, index=True)
    snapshot = relationship("OddsSnapshot")
    
    # Duplicate key data for efficient querying without joins
    prop_id: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    bookmaker_id: Mapped[int] = mapped_column(ForeignKey('bookmakers.id'), nullable=False, index=True)
    bookmaker = relationship("Bookmaker", back_populates="odds_history")
    
    # Historical odds data
    line_movement: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # Change from previous
    odds_movement_over: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    odds_movement_under: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Movement analytics
    movement_magnitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # Absolute movement size
    movement_direction: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)  # UP/DOWN/STABLE
    is_significant_movement: Mapped[bool] = mapped_column(Boolean, default=False)  # > threshold
    
    # Steam detection
    is_steam_move: Mapped[bool] = mapped_column(Boolean, default=False)
    steam_confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # 0.0-1.0
    concurrent_book_moves: Mapped[int] = mapped_column(Integer, default=0)  # Books moving together
    
    # Timestamps
    recorded_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    
    __table_args__ = (
        Index('idx_history_prop_time', 'prop_id', 'recorded_at'),
        Index('idx_history_steam', 'is_steam_move', 'steam_confidence'),
        Index('idx_history_significant', 'is_significant_movement', 'recorded_at'),
    )
    
    def __repr__(self):
        return f"<OddsHistory(prop_id='{self.prop_id}', movement={self.movement_magnitude})>"


class BestLineAggregate(Base):
    """Pre-computed best lines across all bookmakers"""
    __tablename__ = 'best_line_aggregates'
    
    id: Mapped[int] = mapped_column(primary_key=True)
    prop_id: Mapped[str] = mapped_column(String(200), nullable=False, unique=True, index=True)
    sport: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    
    # Best available odds
    best_over_odds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    best_over_bookmaker_id: Mapped[Optional[int]] = mapped_column(ForeignKey('bookmakers.id'), nullable=True)
    best_over_bookmaker = relationship("Bookmaker", foreign_keys=[best_over_bookmaker_id])
    
    best_under_odds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    best_under_bookmaker_id: Mapped[Optional[int]] = mapped_column(ForeignKey('bookmakers.id'), nullable=True)
    best_under_bookmaker = relationship("Bookmaker", foreign_keys=[best_under_bookmaker_id])
    # Textual fallback names for historical aggregates when ids are not resolved
    best_over_bookmaker_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    best_under_bookmaker_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Consensus data
    consensus_line: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    consensus_over_prob: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    consensus_under_prob: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Market metrics
    num_bookmakers: Mapped[int] = mapped_column(Integer, default=0)
    line_spread: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # Max - Min line
    odds_spread_over: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    odds_spread_under: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Arbitrage detection
    arbitrage_opportunity: Mapped[bool] = mapped_column(Boolean, default=False)
    arbitrage_profit_pct: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Freshness tracking
    last_updated: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    data_age_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    __table_args__ = (
        Index('idx_best_line_sport_updated', 'sport', 'last_updated'),
        Index('idx_best_line_arbitrage', 'arbitrage_opportunity', 'arbitrage_profit_pct'),
        Index('idx_best_line_fresh', 'last_updated', postgresql_where='data_age_minutes < 30'),
    )
    
    def __repr__(self):
        return f"<BestLineAggregate(prop_id='{self.prop_id}', bookmakers={self.num_bookmakers})>"


# Utility functions for best line detection
class BestLineCalculator:
    """Utility class for calculating best lines and consensus data"""
    
    @staticmethod
    def find_best_odds(snapshots: List[OddsSnapshot]) -> Dict:
        """
        Find best available odds from a list of snapshots
        Returns dict with best_over, best_under, consensus data
        """
        if not snapshots:
            return {}
            
        active_snapshots = [s for s in snapshots if s.is_available]
        if not active_snapshots:
            return {}
        
        # Find best over odds (highest positive, closest to 0 negative)
        best_over = None
        best_over_snapshot = None
        for snapshot in active_snapshots:
            if snapshot.over_odds is None:
                continue
            if best_over is None or BestLineCalculator._is_better_odds(snapshot.over_odds, best_over):
                best_over = snapshot.over_odds
                best_over_snapshot = snapshot
        
        # Find best under odds
        best_under = None
        best_under_snapshot = None
        for snapshot in active_snapshots:
            if snapshot.under_odds is None:
                continue
            if best_under is None or BestLineCalculator._is_better_odds(snapshot.under_odds, best_under):
                best_under = snapshot.under_odds
                best_under_snapshot = snapshot
        
        # Calculate consensus line (median)
        lines = [s.line for s in active_snapshots if s.line is not None]
        consensus_line = None
        if lines:
            lines.sort()
            n = len(lines)
            consensus_line = lines[n // 2] if n % 2 == 1 else (lines[n // 2 - 1] + lines[n // 2]) / 2
        
        # Calculate consensus probabilities (average of no-vig probabilities)
        over_probs = [s.over_implied_prob for s in active_snapshots if s.over_implied_prob is not None]
        under_probs = [s.under_implied_prob for s in active_snapshots if s.under_implied_prob is not None]
        
        consensus_over_prob = sum(over_probs) / len(over_probs) if over_probs else None
        consensus_under_prob = sum(under_probs) / len(under_probs) if under_probs else None
        
        return {
            'best_over_odds': best_over,
            'best_over_bookmaker': best_over_snapshot.bookmaker if best_over_snapshot else None,
            'best_under_odds': best_under,
            'best_under_bookmaker': best_under_snapshot.bookmaker if best_under_snapshot else None,
            'consensus_line': consensus_line,
            'consensus_over_prob': consensus_over_prob,
            'consensus_under_prob': consensus_under_prob,
            'num_bookmakers': len(active_snapshots),
            'line_spread': max(lines) - min(lines) if len(lines) > 1 else 0.0,
        }
    
    @staticmethod
    def _is_better_odds(odds1: int, odds2: int) -> bool:
        """
        Compare two American odds to determine which is better for the bettor
        Higher positive odds are better, closer-to-zero negative odds are better
        """
        if odds1 > 0 and odds2 > 0:
            return odds1 > odds2  # Higher positive is better
        elif odds1 < 0 and odds2 < 0:
            return odds1 > odds2  # Closer to 0 negative is better (-105 > -110)
        elif odds1 > 0 and odds2 < 0:
            return True  # Positive always better than negative
        else:  # odds1 < 0 and odds2 > 0
            return False
    
    @staticmethod
    def detect_arbitrage(best_over_odds: int, best_under_odds: int) -> tuple[bool, float]:
        """
        Detect arbitrage opportunity between two odds
        Returns (has_arbitrage, profit_percentage)
        """
        if best_over_odds is None or best_under_odds is None:
            return False, 0.0
            
        # Convert to implied probabilities (including vig)
        over_prob = abs(best_over_odds) / (abs(best_over_odds) + 100) if best_over_odds < 0 else 100 / (best_over_odds + 100)
        under_prob = abs(best_under_odds) / (abs(best_under_odds) + 100) if best_under_odds < 0 else 100 / (best_under_odds + 100)
        
        total_prob = over_prob + under_prob
        has_arbitrage = total_prob < 1.0
        profit_pct = ((1.0 / total_prob) - 1.0) * 100 if has_arbitrage else 0.0
        
        return has_arbitrage, profit_pct


# Sample bookmaker data for initialization
INITIAL_BOOKMAKERS = [
    {
        'name': 'draftkings',
        'display_name': 'DraftKings',
        'short_name': 'DK',
        'website_url': 'https://www.draftkings.com',
        'country_code': 'US',
        'priority_weight': 1.0,
        'is_trusted': True,
    },
    {
        'name': 'fanduel',
        'display_name': 'FanDuel',
        'short_name': 'FD',
        'website_url': 'https://www.fanduel.com',
        'country_code': 'US',
        'priority_weight': 1.0,
        'is_trusted': True,
    },
    {
        'name': 'betmgm',
        'display_name': 'BetMGM',
        'short_name': 'MGM',
        'website_url': 'https://www.betmgm.com',
        'country_code': 'US',
        'priority_weight': 0.9,
        'is_trusted': True,
    },
    {
        'name': 'caesars',
        'display_name': 'Caesars',
        'short_name': 'CZR',
        'website_url': 'https://www.caesars.com/sportsbook',
        'country_code': 'US',
        'priority_weight': 0.9,
        'is_trusted': True,
    },
    {
        'name': 'barstool',
        'display_name': 'Barstool',
        'short_name': 'BST',
        'website_url': 'https://www.barstoolsportsbook.com',
        'country_code': 'US',
        'priority_weight': 0.8,
        'is_trusted': True,
    },
]