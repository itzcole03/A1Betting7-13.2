"""
Data Transfer Objects (DTOs) for Ingestion Pipeline

This module defines Pydantic models for data transfer between different
stages of the ingestion pipeline:

- RawExternalPropDTO: Raw data from external providers
- NormalizedPropDTO: Normalized data ready for persistence  
- IngestResult: Results and metrics from pipeline execution

All DTOs use Pydantic for validation and serialization.
"""

from datetime import datetime
from typing import Dict, Any, List, Optional
from enum import Enum

from pydantic import BaseModel, Field, validator


class PayoutType(str, Enum):
    """Supported payout types for proposition bets."""
    STANDARD = "standard"
    FLEX = "flex"
    BOOST = "boost"


class PropTypeEnum(str, Enum):
    """Canonical proposition bet types."""
    POINTS = "POINTS"
    ASSISTS = "ASSISTS"
    REBOUNDS = "REBOUNDS"
    PRA = "PRA"  # Points + Rebounds + Assists
    THREE_POINTERS_MADE = "3PM"
    STEALS = "STEALS"
    BLOCKS = "BLOCKS"
    TURNOVERS = "TURNOVERS"
    MINUTES = "MINUTES"
    DOUBLE_DOUBLE = "DOUBLE_DOUBLE"
    TRIPLE_DOUBLE = "TRIPLE_DOUBLE"


class RawExternalPropDTO(BaseModel):
    """
    Raw proposition data from external provider.
    
    Represents the unprocessed data structure received from 
    external betting market APIs before normalization.
    """
    external_player_id: str = Field(..., description="Provider's player identifier")
    player_name: str = Field(..., min_length=1, description="Player's full name")
    team_code: str = Field(..., min_length=2, max_length=5, description="Team abbreviation or code")
    prop_category: str = Field(..., description="Raw prop category from provider")
    line_value: float = Field(..., ge=0, description="Offered line value")
    provider_prop_id: str = Field(..., description="Provider's prop identifier")
    payout_type: PayoutType = Field(default=PayoutType.STANDARD, description="Type of payout structure")
    over_odds: Optional[float] = Field(None, description="Over bet odds")
    under_odds: Optional[float] = Field(None, description="Under bet odds")
    updated_ts: str = Field(..., description="ISO8601 timestamp of last update")
    
    # Provider metadata
    provider_name: str = Field(default="stub_provider", description="Name of the data provider")
    additional_data: Dict[str, Any] = Field(default_factory=dict, description="Additional provider-specific data")
    
    @validator('updated_ts')
    def validate_timestamp(cls, v):
        """Ensure timestamp is valid ISO8601 format."""
        try:
            datetime.fromisoformat(v.replace('Z', '+00:00'))
            return v
        except ValueError:
            raise ValueError(f"Invalid timestamp format: {v}")

    class Config:
        extra = "allow"  # Allow additional fields from providers


class PayoutSchema(BaseModel):
    """Payout structure for normalized props."""
    type: PayoutType
    over: Optional[float] = None
    under: Optional[float] = None
    boost_multiplier: Optional[float] = None
    
    class Config:
        extra = "forbid"


class NormalizedPropDTO(BaseModel):
    """
    Normalized proposition data ready for persistence.
    
    Contains canonical identifiers and standardized field names
    after taxonomy mapping and data transformation.
    """
    player_id: Optional[int] = Field(None, description="Internal player ID (set during persistence)")
    player_name: str = Field(..., description="Canonical player name")
    team_abbreviation: str = Field(..., description="Canonical team abbreviation")
    prop_type: PropTypeEnum = Field(..., description="Canonical prop type")
    offered_line: float = Field(..., ge=0, description="Offered line value")
    source: str = Field(..., description="Data provider name")
    payout_schema: PayoutSchema = Field(..., description="Standardized payout information")
    external_ids: Dict[str, str] = Field(..., description="External identifier mappings")
    timestamp: datetime = Field(..., description="Processing timestamp")
    line_hash: Optional[str] = Field(None, description="Computed line hash for change detection")
    
    # Metadata
    position: Optional[str] = Field(None, description="Player position")
    sport: str = Field(default="NBA", description="Sport identifier")
    
    class Config:
        extra = "forbid"


class ErrorDetail(BaseModel):
    """Details about errors encountered during ingestion."""
    error_type: str = Field(..., description="Type of error encountered")
    message: str = Field(..., description="Error message")
    context: Dict[str, Any] = Field(default_factory=dict, description="Additional error context")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="When error occurred")
    external_prop_id: Optional[str] = Field(None, description="External prop ID that caused error")


class IngestResult(BaseModel):
    """
    Results and metrics from ingestion pipeline execution.
    
    Provides comprehensive reporting on ingestion outcomes including
    counts, performance metrics, and error details.
    """
    # Status
    status: str = Field(..., description="Overall ingestion status: success, partial, failed")
    sport: str = Field(..., description="Sport that was processed")
    source: str = Field(..., description="Data provider name")
    
    # Timing
    started_at: datetime = Field(..., description="Pipeline start time")
    finished_at: Optional[datetime] = Field(None, description="Pipeline end time")
    duration_ms: Optional[int] = Field(None, description="Total execution time in milliseconds")
    
    # Counts
    total_raw: int = Field(default=0, ge=0, description="Total raw records fetched")
    total_new_quotes: int = Field(default=0, ge=0, description="New market quote records created")
    total_line_changes: int = Field(default=0, ge=0, description="Line changes detected")
    total_unchanged: int = Field(default=0, ge=0, description="Records with no changes")
    total_new_players: int = Field(default=0, ge=0, description="New players created")
    total_new_props: int = Field(default=0, ge=0, description="New props created")
    
    # Details
    changed_quote_ids: List[int] = Field(default_factory=list, description="IDs of quotes that changed")
    new_prop_ids: List[int] = Field(default_factory=list, description="IDs of newly created props")
    new_player_ids: List[int] = Field(default_factory=list, description="IDs of newly created players")
    errors: List[ErrorDetail] = Field(default_factory=list, description="Errors encountered during processing")
    
    # Run metadata
    ingest_run_id: Optional[int] = Field(None, description="Database ID of the ingest run record")
    
    def mark_completed(self):
        """Mark the result as completed and calculate duration."""
        if not self.finished_at:
            self.finished_at = datetime.utcnow()
        
        if self.duration_ms is None and self.finished_at:
            duration = self.finished_at - self.started_at
            self.duration_ms = int(duration.total_seconds() * 1000)
    
    def add_error(self, error_type: str, message: str, context: Optional[Dict[str, Any]] = None, external_prop_id: Optional[str] = None):
        """Add an error to the result."""
        error = ErrorDetail(
            error_type=error_type,
            message=message,
            context=context or {},
            external_prop_id=external_prop_id
        )
        self.errors.append(error)
    
    @property
    def success_rate(self) -> float:
        """Calculate success rate as percentage."""
        if self.total_raw == 0:
            return 100.0
        
        failed_count = len(self.errors)
        successful_count = self.total_raw - failed_count
        return (successful_count / self.total_raw) * 100.0
    
    @property
    def has_errors(self) -> bool:
        """Check if any errors occurred."""
        return len(self.errors) > 0
    
    class Config:
        extra = "forbid"


class ProviderHealth(BaseModel):
    """Health status for external data provider."""
    provider_name: str
    is_available: bool
    response_time_ms: Optional[int] = None
    last_successful_fetch: Optional[datetime] = None
    error_message: Optional[str] = None