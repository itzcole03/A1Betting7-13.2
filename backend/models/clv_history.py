"""
CLV History Data Model

SQLModel for persisting Customer Lifetime Value (CLV) computation results.
Stores historical CLV data for analytics, performance monitoring, and trend analysis.
"""

from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional


class CLVHistory(SQLModel, table=True):
    """CLV computation history for persistence and analytics"""
    __tablename__ = "clv_history"
    
    # Primary key
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Opportunity identification
    opportunity_hash: str = Field(index=True, description="SHA256 hash of opportunity key fields")
    player: Optional[str] = Field(default=None, index=True, max_length=100, description="Player name")
    sport: Optional[str] = Field(default=None, index=True, max_length=20, description="Sport name")
    market: Optional[str] = Field(default=None, index=True, max_length=50, description="Betting market")
    
    # CLV computation results
    clv_percent: float = Field(description="Computed CLV percentage")
    closing_line: float = Field(description="Closing line value")
    closing_odds: int = Field(description="Closing odds value")
    
    # Metadata
    computed_at: datetime = Field(default_factory=datetime.utcnow, index=True, description="UTC timestamp of computation")
    processing_ms: Optional[int] = Field(default=None, description="Processing time in milliseconds")
    source_version: Optional[str] = Field(default="v1", max_length=10, description="CLV computation version")
    
    # Optional fields for enhanced analytics
    initial_line: Optional[float] = Field(default=None, description="Initial line value if available")
    initial_odds: Optional[int] = Field(default=None, description="Initial odds value if available")
    batch_id: Optional[str] = Field(default=None, index=True, max_length=50, description="Batch processing identifier")
    
    class Config:
        """Pydantic configuration"""
        json_encoders = {
            datetime: lambda v: v.isoformat() + 'Z'
        }
