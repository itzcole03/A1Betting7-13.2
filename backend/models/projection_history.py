from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Float, Integer, String

from backend.models.base import Base


class ProjectionHistory(Base):
    __tablename__ = "projection_history"
    id = Column(Integer, primary_key=True, index=True)
    player_name = Column(String, nullable=False)
    prop_type = Column(String, nullable=False)
    line = Column(Float, nullable=True)
    status = Column(String, nullable=False)  # active, pre_game, open, live, etc.
    fetched_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), index=True
    )
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
