"""
Prediction Model - Database model for AI predictions
"""

from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, String, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class Prediction(Base):
    __tablename__ = "predictions"
    
    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id"), nullable=False)
    home_win_probability = Column(Float, nullable=False)
    away_win_probability = Column(Float, nullable=False)
    draw_probability = Column(Float, default=0.0)  # For sports that can have draws
    confidence_score = Column(Float, nullable=False)  # 0.0 to 1.0
    model_version = Column(String, default="v1.0.0")
    algorithm_used = Column(String, default="ensemble")
    features_used = Column(Text, nullable=True)  # JSON string of features
    historical_accuracy = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Additional prediction fields
    over_under_prediction = Column(Float, nullable=True)
    spread_prediction = Column(Float, nullable=True)
    total_score_prediction = Column(Float, nullable=True)
    
    # Relationships
    # match = relationship("Match", back_populates="predictions")
    
    def __repr__(self):
        return f"<Prediction(id={self.id}, match_id={self.match_id}, confidence={self.confidence_score})>"
    
    @property
    def most_likely_outcome(self):
        """Determine the most likely outcome based on probabilities"""
        probabilities = {
            'home_win': self.home_win_probability,
            'away_win': self.away_win_probability,
            'draw': self.draw_probability
        }
        return max(probabilities, key=probabilities.get)
    
    @property
    def prediction_strength(self):
        """Categorize prediction strength based on confidence score"""
        if self.confidence_score >= 0.9:
            return "Very Strong"
        elif self.confidence_score >= 0.8:
            return "Strong"
        elif self.confidence_score >= 0.7:
            return "Moderate"
        elif self.confidence_score >= 0.6:
            return "Weak"
        else:
            return "Very Weak"
    
    def to_dict(self):
        """Convert prediction to dictionary for API responses"""
        return {
            "id": self.id,
            "match_id": self.match_id,
            "predictions": {
                "home_win": self.home_win_probability,
                "away_win": self.away_win_probability,
                "draw": self.draw_probability
            },
            "confidence_score": self.confidence_score,
            "prediction_strength": self.prediction_strength,
            "most_likely_outcome": self.most_likely_outcome,
            "model_version": self.model_version,
            "algorithm_used": self.algorithm_used,
            "historical_accuracy": self.historical_accuracy,
            "over_under_prediction": self.over_under_prediction,
            "spread_prediction": self.spread_prediction,
            "total_score_prediction": self.total_score_prediction,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
