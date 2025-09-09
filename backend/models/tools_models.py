"""
API models for fair odds calculation tools.
"""

from pydantic import BaseModel, Field
from typing import Optional, Literal


class FairOddsRequest(BaseModel):
    """Request model for fair odds calculation."""
    
    projection_value: float = Field(
        description="Player/team projected value"
    )
    market_line: float = Field(
        description="Betting line or total"
    )
    market_type: Literal["over_under", "spread", "moneyline"] = Field(
        default="over_under",
        description="Type of betting market"
    )
    distribution_type: Literal["normal", "poisson"] = Field(
        default="normal",
        description="Statistical distribution assumption"
    )
    margin_percent: float = Field(
        default=0.0,
        description="Margin adjustment percentage",
        ge=0.0,
        le=20.0
    )
    std_dev: Optional[float] = Field(
        default=None,
        description="Standard deviation for normal distribution (auto-calculated if None)"
    )
    book_odds_american: Optional[int] = Field(
        default=None,
        description="Sportsbook odds in American format for comparison"
    )


class FairOddsResponse(BaseModel):
    """Response model for fair odds calculation."""
    
    # Core fair odds calculation
    fair_probability: float = Field(description="True fair probability")
    fair_odds_decimal: float = Field(description="Fair odds in decimal format")
    fair_odds_american: int = Field(description="Fair odds in American format")
    implied_probability: float = Field(description="Implied probability from fair odds")
    
    # Margin adjustments
    margin_adjusted_over: float = Field(description="Probability adjusted for margin (over/favorite)")
    margin_adjusted_under: float = Field(description="Probability adjusted for margin (under/underdog)")
    
    # Input echo
    projection_value: float = Field(description="Input projection value")
    market_line: float = Field(description="Input market line")
    market_type: str = Field(description="Input market type")
    distribution_type: str = Field(description="Input distribution type")
    
    # Optional comparison data
    comparison: Optional[dict] = Field(
        default=None,
        description="Comparison with sportsbook odds if provided"
    )
    kelly_sizing: Optional[dict] = Field(
        default=None,
        description="Kelly criterion sizing recommendations if book odds provided"
    )


class OddsComparisonRequest(BaseModel):
    """Request model for odds comparison tool."""
    
    fair_odds_decimal: float = Field(
        ...,
        description="Fair odds in decimal format",
        gt=1.0
    )
    book_odds_american: int = Field(
        ...,
        description="Sportsbook odds in American format"
    )


class OddsComparisonResponse(BaseModel):
    """Response model for odds comparison."""
    
    book_odds_decimal: float = Field(description="Book odds in decimal format")
    book_odds_american: int = Field(description="Book odds in American format")
    fair_odds_decimal: float = Field(description="Fair odds in decimal format")
    edge_percentage: float = Field(description="Edge percentage vs book")
    value_rating: str = Field(description="Value assessment rating")
    recommendation: str = Field(description="Betting recommendation")
    fair_implied_probability: float = Field(description="Fair implied probability")
    book_implied_probability: float = Field(description="Book implied probability")


class KellyCriterionRequest(BaseModel):
    """Request model for Kelly criterion calculation."""
    
    win_probability: float = Field(
        ...,
        description="Probability of winning the bet",
        ge=0.0,
        le=1.0
    )
    odds_decimal: float = Field(
        ...,
        description="Decimal odds offered",
        gt=1.0
    )
    bankroll: float = Field(
        default=1000.0,
        description="Total bankroll size",
        gt=0.0
    )


class KellyCriterionResponse(BaseModel):
    """Response model for Kelly criterion calculation."""
    
    kelly_fraction: float = Field(description="Raw Kelly fraction")
    max_kelly_fraction: float = Field(description="Max recommended Kelly fraction")
    recommended_bet_amount: float = Field(description="Recommended bet amount")
    recommended_percentage: float = Field(description="Recommended percentage of bankroll")
    expected_value: float = Field(description="Expected value percentage")


class OddsConverterRequest(BaseModel):
    """Request model for odds conversion."""
    
    american_odds: Optional[int] = Field(default=None, description="American odds")
    decimal_odds: Optional[float] = Field(default=None, description="Decimal odds", gt=1.0)
    implied_probability: Optional[float] = Field(
        default=None, 
        description="Implied probability", 
        ge=0.0, 
        le=1.0
    )


class OddsConverterResponse(BaseModel):
    """Response model for odds conversion."""
    
    american_odds: int = Field(description="American odds format")
    decimal_odds: float = Field(description="Decimal odds format")
    implied_probability: float = Field(description="Implied probability")
    percentage_display: str = Field(description="Probability as percentage string")