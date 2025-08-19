"""
PropFinder Database Models - Free Data PropFinder Clone Schema

Database schema for a complete propfinder.app clone using only free MLB data sources.
Supports line shopping, value tracking, projections, and alerts without external APIs.

Tables:
- books: Sportsbook information (mock data for demo)  
- props: Individual betting propositions with odds
- projections: Statistical player projections from free sources
- valuations: Calculated betting value (EV, Kelly, edge)
- prop_history: Historical odds and line movement tracking
- alerts: User alert configuration and triggers

Author: AI Assistant
Date: 2025  
Purpose: Complete propfinder database schema using free data sources
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()


class Book(Base):
    """
    Sportsbook information table.
    
    For free data implementation, this stores mock sportsbooks
    to simulate line shopping functionality.
    """
    __tablename__ = "books"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False, index=True)
    display_name = Column(String(100), nullable=False)
    short_code = Column(String(10), unique=True, nullable=False)  # DK, FD, MGM, etc.
    
    # Market characteristics
    typical_margin = Column(Float, default=0.05)  # Typical juice/margin
    is_sharp = Column(Boolean, default=False)  # Sharp book (Pinnacle) vs recreational
    supports_props = Column(Boolean, default=True)
    
    # Status
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    props = relationship("Prop", back_populates="book")


class Prop(Base):
    """
    Individual betting proposition with odds.
    
    Stores both OVER and UNDER sides for each proposition,
    generated from statistical models instead of external APIs.
    """
    __tablename__ = "props"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Game/Player identification
    sport = Column(String(10), nullable=False, default="MLB", index=True)
    league = Column(String(10), nullable=False, default="MLB")  
    game_id = Column(String(20), nullable=False, index=True)
    player_id = Column(String(20), nullable=False, index=True)
    player_name = Column(String(100), nullable=False)
    
    # Market information
    market = Column(String(50), nullable=False, index=True)  # H, R, RBI, K, etc.
    market_display = Column(String(100), nullable=False)  # "Hits", "Runs", etc.
    line = Column(Float, nullable=False)
    side = Column(String(10), nullable=False)  # OVER, UNDER
    
    # Odds information  
    american_odds = Column(String(10), nullable=False)  # +150, -110
    decimal_odds = Column(Float, nullable=False)
    implied_prob = Column(Float, nullable=False)
    
    # Book information
    book_id = Column(Integer, ForeignKey("books.id"), nullable=False, index=True)
    book = relationship("Book", back_populates="props")
    
    # External identifiers (if any)
    external_id = Column(String(100))  # External prop ID if applicable
    source = Column(String(50), default="statistical_model")
    
    # Timestamps
    fetched_at = Column(DateTime, default=datetime.utcnow, index=True)
    game_date = Column(DateTime, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    valuations = relationship("Valuation", back_populates="prop")
    prop_histories = relationship("PropHistory", back_populates="prop")
    
    # Indexes for common queries
    __table_args__ = (
        Index('idx_props_sport_market', 'sport', 'market'),
        Index('idx_props_player_market', 'player_id', 'market'),
        Index('idx_props_game_player', 'game_id', 'player_id'),
        Index('idx_props_fetched_desc', 'fetched_at', postgresql_using='btree'),
    )


class Projection(Base):
    """
    Statistical player projections from free data sources.
    
    Uses MLB StatsAPI, Baseball Savant, and pybaseball data
    to project player performance for betting purposes.
    """
    __tablename__ = "projections"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Player/Game identification
    player_id = Column(String(20), nullable=False, index=True)
    player_name = Column(String(100), nullable=False)
    game_id = Column(String(20), nullable=False, index=True)
    game_date = Column(DateTime, nullable=False)
    
    # Market projection
    market = Column(String(50), nullable=False, index=True)
    market_display = Column(String(100), nullable=False)
    
    # Statistical projection
    mean = Column(Float, nullable=False)  # Expected value
    std_dev = Column(Float, nullable=False)  # Standard deviation
    median = Column(Float)  # Median projection
    percentile_25 = Column(Float)  # 25th percentile
    percentile_75 = Column(Float)  # 75th percentile
    
    # Model metadata
    confidence = Column(Float, nullable=False)  # Model confidence 0-1
    sample_size = Column(Integer, nullable=False)  # Games/AB used
    model_version = Column(String(20), default="v1.0")
    data_sources = Column(Text)  # JSON list of data sources used
    
    # Context
    opponent_team = Column(String(50))
    home_away = Column(String(5))  # HOME, AWAY
    weather_impact = Column(Float)  # Weather adjustment factor
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    valuations = relationship("Valuation", back_populates="projection")
    
    # Indexes
    __table_args__ = (
        Index('idx_projections_player_market', 'player_id', 'market'),
        Index('idx_projections_game_date', 'game_date'),
    )


class Valuation(Base):
    """
    Calculated betting value using the value engine.
    
    Stores EV, Kelly, edge calculations for each prop
    based on statistical projections vs offered odds.
    """
    __tablename__ = "valuations"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign keys
    prop_id = Column(Integer, ForeignKey("props.id"), nullable=False, index=True)
    projection_id = Column(Integer, ForeignKey("projections.id"), nullable=False, index=True)
    
    # Value calculations
    fair_prob = Column(Float, nullable=False)  # Model probability
    implied_prob = Column(Float, nullable=False)  # Odds implied probability
    edge_percent = Column(Float, nullable=False, index=True)  # Edge percentage  
    expected_value = Column(Float, nullable=False, index=True)  # EV per $1
    kelly_fraction = Column(Float, nullable=False)  # Kelly criterion
    
    # Risk metrics
    win_probability = Column(Float, nullable=False)
    breakeven_win_rate = Column(Float, nullable=False)
    confidence_interval = Column(Float)  # Confidence in calculation
    
    # Value ranking
    value_rank = Column(String(10))  # EXCELLENT, GOOD, FAIR, POOR
    risk_level = Column(String(10))  # LOW, MEDIUM, HIGH
    
    # Timestamps
    computed_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    prop = relationship("Prop", back_populates="valuations")
    projection = relationship("Projection", back_populates="valuations")
    
    # Indexes for value-based queries
    __table_args__ = (
        Index('idx_valuations_edge_desc', 'edge_percent', postgresql_using='btree'),
        Index('idx_valuations_ev_desc', 'expected_value', postgresql_using='btree'),
        Index('idx_valuations_computed', 'computed_at'),
    )


class PropHistory(Base):
    """
    Historical odds and line movement tracking.
    
    Tracks changes over time to simulate line movement
    and identify steam/sharp money indicators.
    """
    __tablename__ = "prop_history"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Linked prop
    prop_id = Column(Integer, ForeignKey("props.id"), nullable=False, index=True)
    
    # Historical values
    line = Column(Float, nullable=False)
    american_odds = Column(String(10), nullable=False)
    decimal_odds = Column(Float, nullable=False)
    implied_prob = Column(Float, nullable=False)
    
    # Movement calculations
    line_movement = Column(Float)  # Change from opening line
    odds_movement = Column(Float)  # Change from opening odds
    movement_direction = Column(String(10))  # UP, DOWN, STABLE
    
    # Volume/market indicators (simulated for free data)
    betting_volume = Column(Float)  # Simulated betting volume
    sharp_money_indicator = Column(Boolean, default=False)
    steam_move = Column(Boolean, default=False)
    
    # Timestamp
    recorded_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationship
    prop = relationship("Prop", back_populates="prop_histories")
    
    # Indexes for time-series queries
    __table_args__ = (
        Index('idx_prop_history_prop_time', 'prop_id', 'recorded_at'),
        Index('idx_prop_history_recorded_desc', 'recorded_at', postgresql_using='btree'),
    )


class Alert(Base):
    """
    User alert configuration and triggers.
    
    Allows users to set up alerts for value thresholds,
    line movements, and player-specific notifications.
    """
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # User identification (simplified for demo)
    user_id = Column(String(50), nullable=False, index=True)
    alert_name = Column(String(100), nullable=False)
    
    # Alert conditions
    alert_type = Column(String(20), nullable=False)  # EDGE, EV, KELLY, LINE_MOVE
    
    # Filters
    player_id = Column(String(20))  # Specific player (optional)
    market = Column(String(50))  # Specific market (optional)
    book_id = Column(Integer, ForeignKey("books.id"))  # Specific book (optional)
    
    # Thresholds
    edge_threshold = Column(Float)  # Minimum edge %
    ev_threshold = Column(Float)  # Minimum EV
    kelly_threshold = Column(Float)  # Minimum Kelly %
    line_move_threshold = Column(Float)  # Minimum line movement
    
    # Alert delivery
    is_active = Column(Boolean, default=True)
    delivery_method = Column(String(20), default="in_app")  # in_app, email, push
    last_triggered = Column(DateTime)
    trigger_count = Column(Integer, default=0)
    
    # Timestamps  
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship (optional book filter)
    book = relationship("Book")
    
    # Indexes
    __table_args__ = (
        Index('idx_alerts_user_active', 'user_id', 'is_active'),
        Index('idx_alerts_type_active', 'alert_type', 'is_active'),
    )


class AlertLog(Base):
    """
    Log of triggered alerts.
    
    Tracks when alerts fire and what triggered them
    for analytics and preventing spam.
    """
    __tablename__ = "alert_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Alert information
    alert_id = Column(Integer, ForeignKey("alerts.id"), nullable=False, index=True)
    prop_id = Column(Integer, ForeignKey("props.id"), nullable=False)
    valuation_id = Column(Integer, ForeignKey("valuations.id"), nullable=False)
    
    # Trigger details
    trigger_reason = Column(Text, nullable=False)  # What caused the alert
    trigger_value = Column(Float, nullable=False)  # The value that triggered it
    threshold_met = Column(Float, nullable=False)  # The threshold that was met
    
    # Delivery status
    delivered = Column(Boolean, default=False)
    delivery_method = Column(String(20))
    delivery_timestamp = Column(DateTime)
    
    # Timestamps
    triggered_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    alert = relationship("Alert")
    prop = relationship("Prop")
    valuation = relationship("Valuation")


# =============================================================================
# DATABASE INITIALIZATION AND SEEDING
# =============================================================================

def create_sample_books():
    """Create sample sportsbooks for the free data demo"""
    sample_books = [
        {
            "name": "draftkings",
            "display_name": "DraftKings",  
            "short_code": "DK",
            "typical_margin": 0.045,
            "is_sharp": False
        },
        {
            "name": "fanduel",
            "display_name": "FanDuel",
            "short_code": "FD", 
            "typical_margin": 0.05,
            "is_sharp": False
        },
        {
            "name": "betmgm",
            "display_name": "BetMGM",
            "short_code": "MGM",
            "typical_margin": 0.055,
            "is_sharp": False
        },
        {
            "name": "caesars",
            "display_name": "Caesars",
            "short_code": "CZR",
            "typical_margin": 0.06,
            "is_sharp": False
        },
        {
            "name": "pinnacle",
            "display_name": "Pinnacle",
            "short_code": "PIN",
            "typical_margin": 0.02,
            "is_sharp": True
        },
        {
            "name": "pointsbet",
            "display_name": "PointsBet",
            "short_code": "PB",
            "typical_margin": 0.055,
            "is_sharp": False
        },
        {
            "name": "barstool",
            "display_name": "Barstool",
            "short_code": "BS",
            "typical_margin": 0.065,
            "is_sharp": False
        },
        {
            "name": "hardrock",
            "display_name": "Hard Rock",
            "short_code": "HR",
            "typical_margin": 0.06,
            "is_sharp": False
        }
    ]
    
    return sample_books


# Create database indexes for optimal query performance
def create_additional_indexes():
    """
    Additional database indexes for optimal PropFinder performance.
    
    These support the common query patterns in a propfinder app:
    - Finding props by value (edge, EV, Kelly)
    - Player-specific prop lookup  
    - Time-based queries for line movement
    - Market-based filtering
    """
    indexes = [
        # Value-based queries (most important for propfinder)
        "CREATE INDEX CONCURRENTLY idx_valuations_top_ev ON valuations(expected_value DESC, edge_percent DESC);",
        "CREATE INDEX CONCURRENTLY idx_valuations_top_kelly ON valuations(kelly_fraction DESC, confidence_interval DESC);",
        "CREATE INDEX CONCURRENTLY idx_valuations_top_edge ON valuations(edge_percent DESC, expected_value DESC);",
        
        # Player prop lookups
        "CREATE INDEX CONCURRENTLY idx_props_player_today ON props(player_id, game_date, market);",
        "CREATE INDEX CONCURRENTLY idx_projections_player_today ON projections(player_id, game_date, market);",
        
        # Line movement tracking
        "CREATE INDEX CONCURRENTLY idx_history_recent_moves ON prop_history(prop_id, recorded_at DESC, line_movement);",
        "CREATE INDEX CONCURRENTLY idx_history_steam_moves ON prop_history(steam_move, recorded_at DESC) WHERE steam_move = true;",
        
        # Alert processing
        "CREATE INDEX CONCURRENTLY idx_alerts_processing ON alerts(is_active, alert_type, edge_threshold) WHERE is_active = true;",
        
        # Market analysis
        "CREATE INDEX CONCURRENTLY idx_props_market_analysis ON props(market, sport, game_date, book_id);",
    ]
    
    return indexes


if __name__ == "__main__":
    # Example of how to use these models
    print("PropFinder Database Schema Created")
    print("Tables: books, props, projections, valuations, prop_history, alerts, alert_logs")
    print("Optimized for free data sources: MLB StatsAPI + Baseball Savant")
    print("Supports full propfinder.app functionality without external APIs")