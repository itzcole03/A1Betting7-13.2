"""
Bookmark Model

Database model for user bookmarks of prop opportunities.
Supports Phase 4.2 - Bookmark Persistence & UX functionality.
"""

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Column, DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlmodel import Field, SQLModel

from backend.models.base import Base


class BookmarkORM(Base):
    """SQLAlchemy ORM model for bookmarks"""
    __tablename__ = "bookmarks"
    
    id: str = Column(String, primary_key=True)
    user_id: str = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    prop_id: str = Column(String, nullable=False, index=True)
    sport: str = Column(String(20), nullable=False, index=True)
    player: str = Column(String(100), nullable=False)
    market: str = Column(String(50), nullable=False)
    team: str = Column(String(50), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    # Ensure a user can't bookmark the same prop multiple times
    __table_args__ = (
        UniqueConstraint("user_id", "prop_id", name="uq_user_prop_bookmark"),
    )
    
    # Relationships
    user = relationship("UserORM", back_populates="bookmarks")


class Bookmark(SQLModel, table=True):
    """Pydantic model for bookmarks with validation"""
    __tablename__ = "bookmarks"
    
    id: str = Field(primary_key=True)
    user_id: str = Field(foreign_key="users.id", index=True)
    prop_id: str = Field(index=True, max_length=100)
    sport: str = Field(index=True, max_length=20)
    player: str = Field(max_length=100)
    market: str = Field(max_length=50) 
    team: str = Field(max_length=50)
    created_at: Optional[datetime] = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
    
    def __repr__(self) -> str:
        return f"<Bookmark(user_id='{self.user_id}', prop_id='{self.prop_id}', player='{self.player}')>"

    class Config:
        """Pydantic configuration"""
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }