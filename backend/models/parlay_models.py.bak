"""
Parlay Analytics Data Models

Pydantic models for parlay betting analytics API:
- Request models for parlay leg submissions
- Response models for analysis results
- Validation and serialization for parlay data

Author: A1Betting Parlay Analytics System
"""

from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class CorrelationLevel(str, Enum):
    """Correlation risk levels for parlay legs"""

    NONE = "none"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    EXTREME = "extreme"


class ParlayLegRequest(BaseModel):
    """Request model for individual parlay leg"""

    player: str = Field(..., description="Player name for the bet")
    market: str = Field(..., description="Betting market (e.g., 'points', 'rebounds')")
    odds: int = Field(..., description="Market odds in American format")
    our_fair_odds: int = Field(
        ..., description="Our calculated fair odds in American format"
    )
    team: Optional[str] = Field(None, description="Player's team (optional)")
    stat_type: Optional[str] = Field(
        None, description="Statistical category (optional)"
    )

    @field_validator("odds", "our_fair_odds")
    def validate_odds(cls, v):
        """Validate that odds are not zero and are reasonable"""
        if v == 0:
            raise ValueError("Odds cannot be zero")
        if abs(v) < 100:
            raise ValueError("Odds must be at least +/-100")
        if abs(v) > 10000:
            raise ValueError("Odds cannot exceed +/-10000")
        return v

    @field_validator("player", "market")
    def validate_non_empty_strings(cls, v):
        """Validate that required strings are not empty"""
        if not v or not v.strip():
            raise ValueError("Field cannot be empty")
        return v.strip()


class ParlayAnalysisRequest(BaseModel):
    """Request model for parlay analysis"""

    legs: List[ParlayLegRequest] = Field(
        ..., description="List of parlay legs to analyze"
    )

    @field_validator("legs")
    def validate_legs(cls, v):
        """Validate parlay legs"""
        if not v:
            raise ValueError("Parlay must contain at least one leg")
        if len(v) > 15:
            raise ValueError("Parlay cannot contain more than 15 legs")
        return v


class CorrelationWarningResponse(BaseModel):
    """Response model for correlation warning"""

    level: CorrelationLevel = Field(..., description="Severity level of correlation")
    message: str = Field(..., description="User-friendly warning message")
    affected_legs: List[int] = Field(
        ..., description="Indices of affected legs in parlay"
    )
    risk_factor: float = Field(..., description="Risk multiplier for this correlation")


class IndividualLegAnalysis(BaseModel):
    """Analysis results for individual parlay leg"""

    leg_index: int = Field(..., description="Index of this leg in the parlay")
    player: str = Field(..., description="Player name")
    market: str = Field(..., description="Betting market")
    odds: int = Field(..., description="Market odds in American format")
    implied_probability: float = Field(
        ..., description="Implied probability from market odds"
    )
    fair_probability: float = Field(..., description="Fair probability from our odds")
    individual_ev: float = Field(
        ..., description="Expected value percentage for this leg alone"
    )


class ParlayAnalyticsResponse(BaseModel):
    """Complete parlay analysis response"""

    total_payout: float = Field(
        ..., description="Total payout multiplier for the parlay"
    )
    implied_probability: float = Field(
        ..., description="Combined implied probability of all legs hitting"
    )
    fair_probability: float = Field(
        ..., description="Combined fair probability based on our odds"
    )
    expected_value_percent: float = Field(
        ..., description="Expected value percentage (adjusted for correlations)"
    )
    raw_expected_value_percent: float = Field(
        ..., description="Raw EV before correlation adjustment"
    )
    correlation_warnings: List[CorrelationWarningResponse] = Field(
        ..., description="List of correlation warnings"
    )
    risk_assessment: str = Field(
        ..., description="Overall risk assessment for the parlay"
    )
    individual_leg_analysis: List[IndividualLegAnalysis] = Field(
        ..., description="Analysis of each individual leg"
    )
    number_of_legs: int = Field(..., description="Total number of legs in parlay")
    correlation_adjustment_factor: float = Field(
        ..., description="Factor applied to adjust for correlations"
    )


class ParlayAnalysisErrorResponse(BaseModel):
    """Error response for parlay analysis"""

    error: str = Field(..., description="Error message")
    error_code: str = Field(..., description="Error code for categorization")
    details: Optional[Dict[str, Any]] = Field(
        None, description="Additional error details"
    )


class ParlayHealthResponse(BaseModel):
    """Health check response for parlay service"""

    status: str = Field(..., description="Service status")
    calculator_ready: bool = Field(..., description="Whether calculator is initialized")
    correlation_patterns_loaded: bool = Field(
        ..., description="Whether correlation patterns are loaded"
    )
    timestamp: str = Field(..., description="Response timestamp")


# API Response wrappers
class ParlayAnalysisApiResponse(BaseModel):
    """Standardized API response for parlay analysis"""

    success: bool = Field(..., description="Whether the analysis was successful")
    data: Optional[ParlayAnalyticsResponse] = Field(
        None, description="Analysis results if successful"
    )
    error: Optional[ParlayAnalysisErrorResponse] = Field(
        None, description="Error details if failed"
    )
    message: str = Field(..., description="Human-readable response message")


class ParlayHealthApiResponse(BaseModel):
    """Standardized API response for parlay health check"""

    success: bool = Field(..., description="Whether the health check was successful")
    data: Optional[ParlayHealthResponse] = Field(
        None, description="Health check results"
    )
    message: str = Field(..., description="Human-readable response message")
