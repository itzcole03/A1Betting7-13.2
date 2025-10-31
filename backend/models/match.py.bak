from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field
from sqlalchemy.ext.hybrid import hybrid_property


# Pydantic schema for validation and serialization
class MatchSchema(BaseModel):
    id: Optional[int] = None
    home_team: str
    away_team: str
    sport: str
    league: str
    season: Optional[str] = None
    week: Optional[int] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    status: str = "scheduled"
    home_score: Optional[int] = None
    away_score: Optional[int] = None
    venue: Optional[str] = None
    weather_conditions: Optional[str] = None
    temperature: Optional[float] = None
    external_id: Optional[str] = None
    sportsradar_id: Optional[str] = None
    the_odds_api_id: Optional[str] = None
    is_featured: bool = False
    has_live_odds: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = dict(from_attributes=True)


"""
Match Model - Database model for sports matches
"""

from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String
from sqlalchemy.orm import relationship

from backend.models.base import Base
from backend.models.prediction import Prediction


class Match(Base):
    # Hybrid properties for SQL and Python queries
    @hybrid_property
    def is_live_hybrid(self) -> bool:
        """Return True if match status is 'live'."""
        status = getattr(self, "status", None)
        return bool(status == "live")

    @hybrid_property
    def is_finished_hybrid(self) -> bool:
        """Return True if match status is 'finished'."""
        status = getattr(self, "status", None)
        return bool(status == "finished")

    @hybrid_property
    def total_score_hybrid(self) -> int | None:
        """Return total score if both scores are present, else None."""
        home_score = getattr(self, "home_score", None)
        away_score = getattr(self, "away_score", None)
        if isinstance(home_score, int) and isinstance(away_score, int):
            return home_score + away_score
        return None

    # Query helpers
    @classmethod
    def get_featured(cls, session: Any) -> list["Match"]:
        """Get all featured matches."""
        try:
            return session.query(cls).filter_by(is_featured=True).all()
        except Exception as e:
            import logging

            logging.error(f"Error fetching featured matches: {e}")
            return []

    @classmethod
    def get_by_league(cls, session: Any, league: str) -> list["Match"]:
        """Get all matches for a given league."""
        try:
            return session.query(cls).filter_by(league=league).all()
        except Exception as e:
            import logging

            logging.error(f"Error fetching matches by league '{league}': {e}")
            return []

    @classmethod
    def get_live(cls, session: Any) -> list["Match"]:
        """Get all live matches."""
        try:
            return session.query(cls).filter_by(status="live").all()
        except Exception as e:
            import logging

            logging.error(f"Error fetching live matches: {e}")
            return []

    # Unit test stubs (for pytest or unittest)
    @staticmethod
    def _test_match_title():
        m = Match(
            home_team="A",
            away_team="B",
            sport="Soccer",
            league="MLS",
            start_time=datetime.now(timezone.utc),
        )
        assert m.match_title == "A vs B"

    @staticmethod
    def _test_total_score():
        m = Match(
            home_team="A",
            away_team="B",
            sport="Soccer",
            league="MLS",
            home_score=2,
            away_score=3,
            start_time=datetime.now(timezone.utc),
        )
        assert m.total_score == 5

    """
    Match Model - Database model for sports matches.
    Includes utility methods for serialization, copying, and construction from dicts.
    """

    def __str__(self) -> str:
        """String representation for logging/debugging."""
        return self.__repr__()

    @staticmethod
    def from_dict(data: dict[str, Any]) -> "Match":
        """Create a Match instance from a dictionary, with error handling."""
        # Defensive: handle missing keys and types
        return Match(
            home_team=str(data.get("home_team", "")),
            away_team=str(data.get("away_team", "")),
            sport=str(data.get("sport", "")),
            league=str(data.get("league", "")),
            season=data.get("season"),
            week=data.get("week"),
            start_time=data.get("start_time"),
            end_time=data.get("end_time"),
            status=str(data.get("status", "scheduled")),
            home_score=data.get("home_score"),
            away_score=data.get("away_score"),
            venue=data.get("venue"),
            weather_conditions=data.get("weather_conditions"),
            temperature=data.get("temperature"),
            external_id=data.get("external_id"),
            sportsradar_id=data.get("sportsradar_id"),
            the_odds_api_id=data.get("the_odds_api_id"),
            is_featured=bool(data.get("is_featured", False)),
            has_live_odds=bool(data.get("has_live_odds", False)),
        )

    def copy(self) -> "Match":
        """Return a copy of this Match instance."""
        return Match.from_dict(self.to_dict())

    def to_json(self) -> str:
        """Return a JSON string representation of the match."""
        import json

        return json.dumps(self.to_dict(), default=str)

    __tablename__ = "matches"
    __table_args__ = ({"extend_existing": True},)

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
    status = Column(
        String, default="scheduled"
    )  # scheduled, live, finished, cancelled, postponed

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

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    bets = relationship(
        "Bet", back_populates="match", lazy="selectin", cascade="all, delete-orphan"
    )
    predictions = relationship(
        "Prediction",
        back_populates="match",
        lazy="selectin",
        cascade="all, delete-orphan",
    )
    scores = relationship(
        "Score", back_populates="match", lazy="selectin", cascade="all, delete-orphan"
    )
    spreads = relationship(
        "GameSpread", back_populates="match", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return (
            f"<Match(id={self.id}, {self.home_team} vs {self.away_team}, {self.sport})>"
        )

    @property
    def match_title(self) -> str:
        """Generate a readable match title."""
        return f"{self.home_team} vs {self.away_team}"

    @property
    def is_live(self) -> bool:
        """Check if match is currently live."""
        return self.status == "live"

    @property
    def is_finished(self) -> bool:
        """Check if match is finished."""
        return self.status == "finished"

    @property
    def winner(self) -> str | None:
        """Determine winner if match is finished."""
        if not self.is_finished or self.home_score is None or self.away_score is None:
            return None
        if self.home_score > self.away_score:
            return "home"
        elif self.away_score > self.home_score:
            return "away"
        else:
            return "draw"

    @property
    def total_score(self) -> int | None:
        """Calculate total score."""
        if self.home_score is not None and self.away_score is not None:
            return self.home_score + self.away_score
        return None

    def to_dict(self) -> dict[str, Any]:  # type: ignore
        """Convert match to dictionary for API responses."""
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
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
