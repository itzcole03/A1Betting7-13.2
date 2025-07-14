"""
Match Model - Database model for sports matches
"""

from sqlalchemy import Column, Integer, String, DateTime, Float, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class Match(Base):
    __tablename__ = "matches"
    
    id = Column(Integer, primary_key=True, index=True)
    home_team = Column(String, nullable=False)
    away_team = Column(String, nullable=False)
    sport = Column(String, nullable=False)  # football, basketball, baseball, etc.
    league = Column(String, nullable=False)  # NFL, NBA, MLB, etc.
    season = Column(String, nullable=True)  # 2024, 2024-25, etc.
    week = Column(Integer, nullable=True)  # Week number for sports that use weeks
    
    # Match timing
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=True)
    
    # Match status
    status = Column(String, default="scheduled")  # scheduled, live, finished, cancelled, postponed
    
    # Scores
    home_score = Column(Integer, nullable=True)
    away_score = Column(Integer, nullable=True)
    
    # Additional match details
    venue = Column(String, nullable=True)
    weather_conditions = Column(String, nullable=True)
    temperature = Column(Float, nullable=True)
    
    # External IDs for API integration
    external_id = Column(String, nullable=True)  # ID from external sports API
    sportsradar_id = Column(String, nullable=True)
    the_odds_api_id = Column(String, nullable=True)
    
    # Flags
    is_featured = Column(Boolean, default=False)
    has_live_odds = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    # bets = relationship("Bet", back_populates="match")
    # predictions = relationship("Prediction", back_populates="match")
    
    def __repr__(self):
        return f"<Match(id={self.id}, {self.home_team} vs {self.away_team}, {self.sport})>"
    
    @property
    def match_title(self):
        """Generate a readable match title"""
        return f"{self.home_team} vs {self.away_team}"
    
    @property
    def is_live(self):
        """Check if match is currently live"""
        return self.status == "live"
    
    @property
    def is_finished(self):
        """Check if match is finished"""
        return self.status == "finished"
    
    @property
    def winner(self):
        """Determine winner if match is finished"""
        if not self.is_finished or self.home_score is None or self.away_score is None:
            return None
        
        if self.home_score > self.away_score:
            return "home"
        elif self.away_score > self.home_score:
            return "away"
        else:
            return "draw"
    
    @property
    def total_score(self):
        """Calculate total score"""
        if self.home_score is not None and self.away_score is not None:
            return self.home_score + self.away_score
        return None
    
    def to_dict(self):
        """Convert match to dictionary for API responses"""
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
            "weather_conditions": self.weather_conditions,
            "temperature": self.temperature,
            "is_featured": self.is_featured,
            "has_live_odds": self.has_live_odds,
            "is_live": self.is_live,
            "is_finished": self.is_finished,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
