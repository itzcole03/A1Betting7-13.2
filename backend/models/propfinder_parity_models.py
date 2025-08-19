"""
Database Schema Enhancements for PropFinder Parity
Adds historical odds tracking, line movement, consensus data, CLV tracking
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime, timezone
import enum

Base = declarative_base()

class OddsHistorySnapshot(Base):
    """Historical odds snapshots for line movement tracking"""
    __tablename__ = 'odds_history'
    
    id = Column(Integer, primary_key=True)
    prop_id = Column(String(200), nullable=False)  # Composite: game_id:player:stat_type
    sportsbook = Column(String(50), nullable=False)
    sport = Column(String(20), nullable=False)
    
    # Core odds data
    line = Column(Float, nullable=True)  # Point spread/total line
    over_odds = Column(Integer, nullable=True)  # American odds format
    under_odds = Column(Integer, nullable=True)
    decimal_over = Column(Float, nullable=True)  # Decimal odds for calculations
    decimal_under = Column(Float, nullable=True)
    
    # Implied probabilities (no-vig adjusted)
    implied_over = Column(Float, nullable=True)
    implied_under = Column(Float, nullable=True)
    
    # Metadata
    captured_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    source_timestamp = Column(DateTime, nullable=True)  # Sportsbook's timestamp
    volume_indicator = Column(String(10), nullable=True)  # LOW/MED/HIGH if available
    
    # Indexes for efficient querying
    __table_args__ = (
        Index('idx_prop_time', 'prop_id', 'captured_at'),
        Index('idx_book_time', 'sportsbook', 'captured_at'), 
        Index('idx_sport_time', 'sport', 'captured_at'),
        Index('idx_prop_book', 'prop_id', 'sportsbook'),
    )

class ConsensusLine(Base):
    """Computed consensus lines across all sportsbooks"""
    __tablename__ = 'consensus_lines'
    
    id = Column(Integer, primary_key=True)
    prop_id = Column(String(200), nullable=False)
    sport = Column(String(20), nullable=False)
    
    # Consensus calculations
    consensus_line = Column(Float, nullable=True)  # Median line across books
    consensus_over_prob = Column(Float, nullable=True)  # No-vig probability
    consensus_under_prob = Column(Float, nullable=True)
    
    # Market depth metrics
    book_count = Column(Integer, nullable=False)  # Number of books offering
    line_spread = Column(Float, nullable=True)  # Max - Min line difference
    odds_spread = Column(Float, nullable=True)  # Odds range indicator
    
    # Best available
    best_over_odds = Column(Integer, nullable=True)
    best_over_book = Column(String(50), nullable=True)
    best_under_odds = Column(Integer, nullable=True) 
    best_under_book = Column(String(50), nullable=True)
    
    # Arbitrage detection
    arbitrage_opportunity = Column(Boolean, default=False)
    arbitrage_profit_pct = Column(Float, nullable=True)
    
    computed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    
    __table_args__ = (
        Index('idx_consensus_prop', 'prop_id'),
        Index('idx_consensus_sport_time', 'sport', 'computed_at'),
    )

class LineMovement(Base):
    """Pre-computed line movement analytics"""
    __tablename__ = 'line_movements'
    
    id = Column(Integer, primary_key=True)
    prop_id = Column(String(200), nullable=False)
    sportsbook = Column(String(50), nullable=False)
    
    # Movement calculations (multiple timeframes)
    movement_1h = Column(Float, nullable=True)    # Line movement last hour
    movement_6h = Column(Float, nullable=True)    # Last 6 hours
    movement_24h = Column(Float, nullable=True)   # Last 24 hours
    movement_total = Column(Float, nullable=True) # Since opening
    
    # Velocity metrics (movement per hour)
    velocity_1h = Column(Float, nullable=True)
    velocity_recent = Column(Float, nullable=True)  # Last available period
    
    # Volatility indicators
    volatility_score = Column(Float, nullable=True)  # Std dev of movements
    direction_changes = Column(Integer, default=0)   # Number of reversals
    
    # Steam detection
    is_steam = Column(Boolean, default=False)
    steam_threshold = Column(Float, nullable=True)   # Movement size that triggered
    steam_book_count = Column(Integer, nullable=True) # Books moving together
    steam_detected_at = Column(DateTime, nullable=True)
    
    # Opening line reference
    opening_line = Column(Float, nullable=True)
    opening_captured_at = Column(DateTime, nullable=True)
    
    last_updated = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    
    __table_args__ = (
        Index('idx_movement_prop', 'prop_id'),
        Index('idx_movement_steam', 'is_steam', 'steam_detected_at'),
        Index('idx_movement_prop_book', 'prop_id', 'sportsbook'),
    )

class UserWatchlist(Base):
    """User watchlists/favorites for props and players"""  
    __tablename__ = 'user_watchlist'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(String(100), nullable=False)  # User identifier
    
    # Watchlist target (flexible)
    watch_type = Column(String(20), nullable=False)  # 'player', 'prop', 'team'
    target_id = Column(String(200), nullable=False)  # Player name, prop_id, team
    
    # Filtering criteria
    sport = Column(String(20), nullable=True)
    stat_types = Column(JSONB, nullable=True)  # Array of stat types to watch
    
    # Alert preferences for this watchlist item
    alert_on_ev_threshold = Column(Float, nullable=True)  # EV% trigger
    alert_on_movement = Column(Float, nullable=True)      # Line movement trigger
    alert_on_steam = Column(Boolean, default=False)      # Steam detection
    
    # Metadata
    added_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    is_active = Column(Boolean, default=True)
    
    __table_args__ = (
        Index('idx_watchlist_user', 'user_id', 'is_active'),
        Index('idx_watchlist_type', 'watch_type', 'target_id'),
    )

class UserAlert(Base):
    """User-configured alert rules"""
    __tablename__ = 'user_alerts'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(String(100), nullable=False)
    
    # Alert rule definition
    rule_name = Column(String(200), nullable=False)
    rule_type = Column(String(50), nullable=False)  # 'ev_threshold', 'movement', 'steam', 'new_edge'
    
    # Rule conditions (JSON for flexibility)
    conditions = Column(JSONB, nullable=False)
    # Example: {"ev_min": 5.0, "sports": ["MLB", "NBA"], "stat_types": ["points"]}
    
    # Delivery preferences
    delivery_methods = Column(JSONB, nullable=False)  # ["browser", "email"]
    cooldown_minutes = Column(Integer, default=60)    # Min time between same alerts
    
    # Status
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    last_triggered = Column(DateTime, nullable=True)
    trigger_count = Column(Integer, default=0)
    
    __table_args__ = (
        Index('idx_alert_user_active', 'user_id', 'is_active'),
        Index('idx_alert_type', 'rule_type'),
    )

class AlertHistory(Base):
    """Log of triggered alerts"""
    __tablename__ = 'alert_history'
    
    id = Column(Integer, primary_key=True)
    alert_rule_id = Column(Integer, nullable=False)  # FK to user_alerts
    user_id = Column(String(100), nullable=False)
    
    # Alert content
    prop_id = Column(String(200), nullable=True)
    alert_message = Column(Text, nullable=False)
    alert_data = Column(JSONB, nullable=True)  # Triggering data snapshot
    
    # Delivery tracking
    delivered_methods = Column(JSONB, nullable=True)  # Methods successfully delivered
    delivery_status = Column(String(20), default='pending')  # pending/delivered/failed
    
    triggered_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    delivered_at = Column(DateTime, nullable=True)
    
    __table_args__ = (
        Index('idx_alert_history_user', 'user_id', 'triggered_at'),
        Index('idx_alert_history_rule', 'alert_rule_id', 'triggered_at'),
    )

class ClosingLineValue(Base):
    """Closing Line Value tracking for user bets"""
    __tablename__ = 'closing_line_values'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(String(100), nullable=False)
    prop_id = Column(String(200), nullable=False)
    
    # Bet details
    bet_placed_at = Column(DateTime, nullable=False)
    user_bet_line = Column(Float, nullable=False)
    user_bet_odds = Column(Integer, nullable=False)
    stake_amount = Column(Float, nullable=False)
    
    # Opening line reference
    opening_line = Column(Float, nullable=True)
    opening_odds = Column(Integer, nullable=True)
    
    # Closing line (captured when prop closes)
    closing_line = Column(Float, nullable=True)
    closing_odds = Column(Integer, nullable=True)
    prop_closed_at = Column(DateTime, nullable=True)
    
    # CLV calculations
    clv_line_diff = Column(Float, nullable=True)      # user_line - closing_line
    clv_odds_diff = Column(Float, nullable=True)      # Odds value difference
    clv_percentage = Column(Float, nullable=True)     # CLV as percentage
    
    # Result tracking (if known)
    actual_result = Column(Float, nullable=True)      # Actual stat outcome
    bet_result = Column(String(10), nullable=True)    # 'win', 'loss', 'push'
    profit_loss = Column(Float, nullable=True)        # Actual P&L
    
    __table_args__ = (
        Index('idx_clv_user_date', 'user_id', 'bet_placed_at'),
        Index('idx_clv_prop', 'prop_id'),
    )

# Migration script for existing database
class DatabaseMigration:
    """Helper class for database migrations"""
    
    @staticmethod
    def get_create_tables_sql():
        """Generate SQL for creating new tables"""
        from sqlalchemy import create_engine
        from io import StringIO
        
        # This would generate the actual SQL
        # In practice, use Alembic for proper migrations
        pass
    
    @staticmethod
    def get_indexes_sql():
        """Generate optimized index creation SQL"""
        return [
            "CREATE INDEX CONCURRENTLY idx_odds_history_prop_time ON odds_history(prop_id, captured_at)",
            "CREATE INDEX CONCURRENTLY idx_odds_history_recent ON odds_history(captured_at) WHERE captured_at > NOW() - INTERVAL '7 days'",
            "CREATE INDEX CONCURRENTLY idx_consensus_current ON consensus_lines(prop_id) WHERE computed_at > NOW() - INTERVAL '1 hour'",
        ]