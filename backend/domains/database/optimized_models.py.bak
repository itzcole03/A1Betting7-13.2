"""
Optimized Database Models - Consolidated and Performance-Optimized Schema
Reduces redundancy and improves query performance through strategic indexing and relationships
"""

from datetime import datetime, timezone
from typing import Optional, Dict, List, Any
from sqlalchemy import (
    Column, String, Integer, Float, DateTime, Boolean, Text, JSON,
    ForeignKey, Index, UniqueConstraint, CheckConstraint, DECIMAL
)
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.ext.hybrid import hybrid_property
import json

Base = declarative_base()

class OptimizedUser(Base):
    """Optimized User model with consolidated profile and settings"""
    __tablename__ = "users_optimized"
    __table_args__ = (
        Index('idx_user_lookup', 'username', 'email'),
        Index('idx_user_active_verified', 'is_active', 'is_verified'),
        Index('idx_user_last_login', 'last_login'),
        UniqueConstraint('username', name='uq_user_username'),
        UniqueConstraint('email', name='uq_user_email'),
        UniqueConstraint('api_key_encrypted', name='uq_user_api_key'),
    )

    id = Column(String(36), primary_key=True)  # UUID string
    username = Column(String(50), nullable=False, index=True)
    email = Column(String(100), nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    api_key_encrypted = Column(String(512), nullable=True, index=True)
    
    # Profile data consolidated
    first_name = Column(String(50))
    last_name = Column(String(50))
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    
    # Betting profile
    risk_tolerance = Column(String(20), default="moderate")
    preferred_stake = Column(DECIMAL(10, 2), default=50.0)
    bankroll = Column(DECIMAL(12, 2), default=0.0)
    total_profit_loss = Column(DECIMAL(12, 2), default=0.0)
    
    # Settings and preferences as JSON
    settings = Column(JSON, default=dict)
    bookmaker_preferences = Column(JSON, default=list)
    notification_preferences = Column(JSON, default=dict)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    last_login = Column(DateTime(timezone=True))
    
    # Relationships
    bets = relationship("OptimizedBet", back_populates="user", lazy="select")
    predictions = relationship("OptimizedPrediction", back_populates="user", lazy="select")

    @hybrid_property
    def full_name(self):
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.username

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "full_name": self.full_name,
            "risk_tolerance": self.risk_tolerance,
            "preferred_stake": float(self.preferred_stake) if self.preferred_stake else 0.0,
            "bankroll": float(self.bankroll) if self.bankroll else 0.0,
            "total_profit_loss": float(self.total_profit_loss) if self.total_profit_loss else 0.0,
            "is_active": self.is_active,
            "is_verified": self.is_verified,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_login": self.last_login.isoformat() if self.last_login else None,
        }


class OptimizedMatch(Base):
    """Optimized Match model with strategic indexing for performance"""
    __tablename__ = "matches_optimized"
    __table_args__ = (
        Index('idx_match_teams', 'home_team', 'away_team'),
        Index('idx_match_sport_league', 'sport', 'league'),
        Index('idx_match_start_time', 'start_time'),
        Index('idx_match_status', 'status'),
        Index('idx_match_featured_live', 'is_featured', 'status'),
        Index('idx_match_external_ids', 'sportsradar_id', 'the_odds_api_id'),
        Index('idx_match_season_week', 'season', 'week'),
    )

    id = Column(Integer, primary_key=True, index=True)
    
    # Core match data
    home_team = Column(String(100), nullable=False)
    away_team = Column(String(100), nullable=False)
    sport = Column(String(50), nullable=False)
    league = Column(String(50), nullable=False)
    season = Column(String(20))
    week = Column(Integer)
    
    # Timing
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True))
    
    # Status and scores
    status = Column(String(20), default="scheduled", nullable=False)
    home_score = Column(Integer)
    away_score = Column(Integer)
    
    # Metadata
    venue = Column(String(200))
    weather_data = Column(JSON)  # Consolidated weather information
    
    # External integrations
    sportsradar_id = Column(String(100))
    the_odds_api_id = Column(String(100))
    external_metadata = Column(JSON)  # Additional API data
    
    # Flags
    is_featured = Column(Boolean, default=False, nullable=False)
    has_live_odds = Column(Boolean, default=False, nullable=False)
    is_playoff = Column(Boolean, default=False, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    bets = relationship("OptimizedBet", back_populates="match", lazy="select")
    predictions = relationship("OptimizedPrediction", back_populates="match", lazy="select")
    odds = relationship("OptimizedOdds", back_populates="match", lazy="select")
    events = relationship("OptimizedGameEvents", back_populates="match", lazy="select")

    @hybrid_property
    def match_title(self):
        return f"{self.home_team} vs {self.away_team}"

    @hybrid_property
    def is_live(self):
        return self.status == "live"

    @hybrid_property
    def is_finished(self):
        return self.status == "finished"

    @hybrid_property
    def total_score(self):
        if self.home_score is not None and self.away_score is not None:
            return self.home_score + self.away_score
        return None

    @hybrid_property
    def winner(self):
        if not self.is_finished or self.home_score is None or self.away_score is None:
            return None
        if self.home_score > self.away_score:
            return "home"
        elif self.away_score > self.home_score:
            return "away"
        return "draw"

    def to_dict(self):
        return {
            "id": self.id,
            "home_team": self.home_team,
            "away_team": self.away_team,
            "match_title": self.match_title,
            "sport": self.sport,
            "league": self.league,
            "season": self.season,
            "week": self.week,
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "status": self.status,
            "home_score": self.home_score,
            "away_score": self.away_score,
            "total_score": self.total_score,
            "winner": self.winner,
            "venue": self.venue,
            "is_featured": self.is_featured,
            "has_live_odds": self.has_live_odds,
            "is_playoff": self.is_playoff,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class OptimizedPrediction(Base):
    """Optimized Prediction model with comprehensive ML tracking"""
    __tablename__ = "predictions_optimized"
    __table_args__ = (
        Index('idx_prediction_match_user', 'match_id', 'user_id'),
        Index('idx_prediction_confidence', 'confidence_score'),
        Index('idx_prediction_model', 'model_version', 'algorithm_used'),
        Index('idx_prediction_created', 'created_at'),
        Index('idx_prediction_accuracy', 'historical_accuracy'),
    )

    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches_optimized.id"), nullable=False)
    user_id = Column(String(36), ForeignKey("users_optimized.id"), nullable=True)  # System predictions have no user
    
    # Core predictions
    home_win_probability = Column(DECIMAL(5, 4), nullable=False)  # 0.0000 to 1.0000
    away_win_probability = Column(DECIMAL(5, 4), nullable=False)
    draw_probability = Column(DECIMAL(5, 4), default=0.0)
    confidence_score = Column(DECIMAL(5, 4), nullable=False)
    
    # Additional predictions
    over_under_prediction = Column(DECIMAL(6, 2))
    spread_prediction = Column(DECIMAL(6, 2))
    total_score_prediction = Column(DECIMAL(6, 2))
    
    # ML Model tracking
    model_version = Column(String(50), default="v1.0.0")
    algorithm_used = Column(String(100), default="ensemble")
    features_used = Column(JSON)  # Feature importance and selection
    model_performance_metrics = Column(JSON)  # Precision, recall, F1, etc.
    
    # Performance tracking
    historical_accuracy = Column(DECIMAL(5, 4), default=0.0)
    prediction_outcome = Column(String(20))  # correct, incorrect, pending
    actual_result = Column(JSON)  # Store actual match results for accuracy calculation
    
    # SHAP/Explainability
    shap_values = Column(JSON)  # SHAP explanation values
    feature_importance = Column(JSON)  # Feature importance scores
    prediction_reasoning = Column(Text)  # Human-readable explanation
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    match = relationship("OptimizedMatch", back_populates="predictions")
    user = relationship("OptimizedUser", back_populates="predictions")

    @hybrid_property
    def most_likely_outcome(self):
        probabilities = {
            "home_win": float(self.home_win_probability),
            "away_win": float(self.away_win_probability),
            "draw": float(self.draw_probability)
        }
        return max(probabilities, key=probabilities.get)

    @hybrid_property
    def prediction_strength(self):
        confidence = float(self.confidence_score)
        if confidence >= 0.9:
            return "Very Strong"
        elif confidence >= 0.8:
            return "Strong"
        elif confidence >= 0.7:
            return "Moderate"
        elif confidence >= 0.6:
            return "Weak"
        return "Very Weak"

    def to_dict(self):
        return {
            "id": self.id,
            "match_id": self.match_id,
            "predictions": {
                "home_win": float(self.home_win_probability),
                "away_win": float(self.away_win_probability),
                "draw": float(self.draw_probability),
            },
            "confidence_score": float(self.confidence_score),
            "prediction_strength": self.prediction_strength,
            "most_likely_outcome": self.most_likely_outcome,
            "model_version": self.model_version,
            "algorithm_used": self.algorithm_used,
            "historical_accuracy": float(self.historical_accuracy),
            "over_under_prediction": float(self.over_under_prediction) if self.over_under_prediction else None,
            "spread_prediction": float(self.spread_prediction) if self.spread_prediction else None,
            "total_score_prediction": float(self.total_score_prediction) if self.total_score_prediction else None,
            "prediction_reasoning": self.prediction_reasoning,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class OptimizedBet(Base):
    """Optimized Bet model with comprehensive tracking"""
    __tablename__ = "bets_optimized"
    __table_args__ = (
        Index('idx_bet_user_match', 'user_id', 'match_id'),
        Index('idx_bet_status', 'status'),
        Index('idx_bet_placed_at', 'placed_at'),
        Index('idx_bet_sportsbook', 'sportsbook'),
        Index('idx_bet_type', 'bet_type'),
        CheckConstraint('amount > 0', name='chk_bet_amount_positive'),
        CheckConstraint('odds > 0', name='chk_bet_odds_positive'),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey("users_optimized.id"), nullable=False)
    match_id = Column(Integer, ForeignKey("matches_optimized.id"), nullable=False)
    
    # Bet details
    amount = Column(DECIMAL(10, 2), nullable=False)
    odds = Column(DECIMAL(8, 3), nullable=False)
    bet_type = Column(String(50), nullable=False)  # moneyline, spread, total, etc.
    selection = Column(String(100), nullable=False)  # home, away, over, under, etc.
    line_value = Column(DECIMAL(6, 2))  # Spread or total line
    
    # Financial tracking
    potential_winnings = Column(DECIMAL(10, 2), nullable=False)
    actual_payout = Column(DECIMAL(10, 2))
    profit_loss = Column(DECIMAL(10, 2))
    
    # Status and tracking
    status = Column(String(20), default="pending", nullable=False)  # pending, won, lost, void, pushed
    sportsbook = Column(String(50), nullable=False)
    bet_reference_id = Column(String(100))  # External bet ID from sportsbook
    
    # Risk management
    kelly_percentage = Column(DECIMAL(5, 4))  # Kelly criterion percentage
    confidence_at_placement = Column(DECIMAL(5, 4))  # Model confidence when bet was placed
    expected_value = Column(DECIMAL(8, 4))  # Expected value of the bet
    
    # Timestamps
    placed_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    settled_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    user = relationship("OptimizedUser", back_populates="bets")
    match = relationship("OptimizedMatch", back_populates="bets")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "match_id": self.match_id,
            "amount": float(self.amount),
            "odds": float(self.odds),
            "bet_type": self.bet_type,
            "selection": self.selection,
            "line_value": float(self.line_value) if self.line_value else None,
            "potential_winnings": float(self.potential_winnings),
            "actual_payout": float(self.actual_payout) if self.actual_payout else None,
            "profit_loss": float(self.profit_loss) if self.profit_loss else None,
            "status": self.status,
            "sportsbook": self.sportsbook,
            "kelly_percentage": float(self.kelly_percentage) if self.kelly_percentage else None,
            "expected_value": float(self.expected_value) if self.expected_value else None,
            "placed_at": self.placed_at.isoformat() if self.placed_at else None,
            "settled_at": self.settled_at.isoformat() if self.settled_at else None,
        }


class OptimizedOdds(Base):
    """Optimized Odds model for real-time odds tracking"""
    __tablename__ = "odds_optimized"
    __table_args__ = (
        Index('idx_odds_match_sportsbook', 'match_id', 'sportsbook'),
        Index('idx_odds_market_type', 'market_type'),
        Index('idx_odds_updated_at', 'updated_at'),
        Index('idx_odds_is_best', 'is_best_odds'),
    )

    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches_optimized.id"), nullable=False)
    
    # Odds data
    sportsbook = Column(String(50), nullable=False)
    market_type = Column(String(50), nullable=False)  # moneyline, spread, total
    
    # Moneyline odds
    home_odds = Column(DECIMAL(8, 3))
    away_odds = Column(DECIMAL(8, 3))
    draw_odds = Column(DECIMAL(8, 3))
    
    # Spread/Handicap
    spread_value = Column(DECIMAL(6, 2))
    spread_home_odds = Column(DECIMAL(8, 3))
    spread_away_odds = Column(DECIMAL(8, 3))
    
    # Totals/Over-Under
    total_value = Column(DECIMAL(6, 2))
    over_odds = Column(DECIMAL(8, 3))
    under_odds = Column(DECIMAL(8, 3))
    
    # Metadata
    is_best_odds = Column(Boolean, default=False)  # Flag for best available odds
    movement_direction = Column(String(10))  # up, down, stable
    odds_metadata = Column(JSON)  # Additional odds information
    
    # Timestamps
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    match = relationship("OptimizedMatch", back_populates="odds")

    def to_dict(self):
        return {
            "id": self.id,
            "match_id": self.match_id,
            "sportsbook": self.sportsbook,
            "market_type": self.market_type,
            "home_odds": float(self.home_odds) if self.home_odds else None,
            "away_odds": float(self.away_odds) if self.away_odds else None,
            "draw_odds": float(self.draw_odds) if self.draw_odds else None,
            "spread_value": float(self.spread_value) if self.spread_value else None,
            "spread_home_odds": float(self.spread_home_odds) if self.spread_home_odds else None,
            "spread_away_odds": float(self.spread_away_odds) if self.spread_away_odds else None,
            "total_value": float(self.total_value) if self.total_value else None,
            "over_odds": float(self.over_odds) if self.over_odds else None,
            "under_odds": float(self.under_odds) if self.under_odds else None,
            "is_best_odds": self.is_best_odds,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class OptimizedPlayerStats(Base):
    """Optimized Player Statistics model"""
    __tablename__ = "player_stats_optimized"
    __table_args__ = (
        Index('idx_player_name_team', 'player_name', 'team'),
        Index('idx_player_sport_position', 'sport', 'position'),
        Index('idx_player_season', 'season'),
        Index('idx_player_updated', 'updated_at'),
    )

    id = Column(Integer, primary_key=True, index=True)
    
    # Player identification
    player_name = Column(String(100), nullable=False)
    player_id = Column(String(100))  # External player ID
    team = Column(String(50), nullable=False)
    sport = Column(String(50), nullable=False)
    position = Column(String(20))
    
    # Season context
    season = Column(String(20), nullable=False)
    games_played = Column(Integer, default=0)
    
    # Performance statistics (JSON for flexibility)
    batting_stats = Column(JSON)  # Baseball specific
    pitching_stats = Column(JSON)  # Baseball specific
    basketball_stats = Column(JSON)  # Basketball specific
    football_stats = Column(JSON)  # Football specific
    general_stats = Column(JSON)  # Universal stats
    
    # Advanced metrics
    advanced_metrics = Column(JSON)  # WAR, PER, etc.
    injury_status = Column(String(50))
    form_trend = Column(String(20))  # hot, cold, average
    
    # Timestamps
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "player_name": self.player_name,
            "player_id": self.player_id,
            "team": self.team,
            "sport": self.sport,
            "position": self.position,
            "season": self.season,
            "games_played": self.games_played,
            "injury_status": self.injury_status,
            "form_trend": self.form_trend,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class OptimizedTeamStats(Base):
    """Optimized Team Statistics model"""
    __tablename__ = "team_stats_optimized"
    __table_args__ = (
        Index('idx_team_name_season', 'team_name', 'season'),
        Index('idx_team_sport_league', 'sport', 'league'),
        Index('idx_team_updated', 'updated_at'),
    )

    id = Column(Integer, primary_key=True, index=True)
    
    # Team identification
    team_name = Column(String(100), nullable=False)
    team_id = Column(String(100))  # External team ID
    sport = Column(String(50), nullable=False)
    league = Column(String(50), nullable=False)
    
    # Season context
    season = Column(String(20), nullable=False)
    wins = Column(Integer, default=0)
    losses = Column(Integer, default=0)
    draws = Column(Integer, default=0)
    
    # Performance statistics
    offensive_stats = Column(JSON)
    defensive_stats = Column(JSON)
    special_teams_stats = Column(JSON)  # For applicable sports
    
    # Advanced metrics
    strength_of_schedule = Column(DECIMAL(6, 4))
    power_ranking = Column(Integer)
    elo_rating = Column(Integer)
    
    # Form and trends
    last_10_games = Column(JSON)  # Recent performance
    home_record = Column(JSON)
    away_record = Column(JSON)
    
    # Timestamps
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "team_name": self.team_name,
            "team_id": self.team_id,
            "sport": self.sport,
            "league": self.league,
            "season": self.season,
            "wins": self.wins,
            "losses": self.losses,
            "draws": self.draws,
            "power_ranking": self.power_ranking,
            "elo_rating": self.elo_rating,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class OptimizedGameEvents(Base):
    """Optimized Game Events model for live tracking"""
    __tablename__ = "game_events_optimized"
    __table_args__ = (
        Index('idx_events_match_time', 'match_id', 'event_time'),
        Index('idx_events_type', 'event_type'),
        Index('idx_events_created', 'created_at'),
    )

    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches_optimized.id"), nullable=False)
    
    # Event details
    event_type = Column(String(50), nullable=False)  # goal, foul, substitution, etc.
    event_time = Column(Integer)  # Minutes into game
    event_period = Column(String(20))  # 1st, 2nd, OT, etc.
    
    # Event participants
    primary_player = Column(String(100))
    secondary_player = Column(String(100))
    team = Column(String(100))
    
    # Event data
    event_data = Column(JSON)  # Flexible event-specific data
    impact_score = Column(DECIMAL(4, 2))  # Calculated impact on game outcome
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    match = relationship("OptimizedMatch", back_populates="events")

    def to_dict(self):
        return {
            "id": self.id,
            "match_id": self.match_id,
            "event_type": self.event_type,
            "event_time": self.event_time,
            "event_period": self.event_period,
            "primary_player": self.primary_player,
            "secondary_player": self.secondary_player,
            "team": self.team,
            "impact_score": float(self.impact_score) if self.impact_score else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
