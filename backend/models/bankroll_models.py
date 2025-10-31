"""
Bankroll Management Models

Database models for comprehensive bankroll tracking, performance analytics,
and Kelly criterion implementation.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import (
    JSON,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.models.base import Base


class BankrollSnapshot(Base):
    """Track bankroll changes over time"""

    __tablename__ = "bankroll_snapshots"
    __table_args__ = (
        Index("idx_user_timestamp", "user_id", "timestamp"),
        {"extend_existing": True},
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), nullable=False, index=True
    )

    # Bankroll tracking
    bankroll_amount: Mapped[float] = mapped_column(Float, nullable=False)
    change_amount: Mapped[float] = mapped_column(Float, default=0.0)
    change_type: Mapped[str] = mapped_column(
        String, nullable=False
    )  # "deposit", "withdrawal", "bet_win", "bet_loss", "adjustment"

    # Context
    bet_id: Mapped[int | None] = mapped_column(ForeignKey("bets.id"), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True
    )

    # Relationships
    bet = relationship("Bet", backref="bankroll_snapshots")


class BankrollSummary(Base):
    """Aggregated bankroll performance summary"""

    __tablename__ = "bankroll_summaries"
    __table_args__ = (
        Index("idx_user_period", "user_id", "period_start", "period_end"),
        {"extend_existing": True},
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), nullable=False, index=True
    )

    # Time period
    period_start: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    period_end: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    period_type: Mapped[str] = mapped_column(
        String, nullable=False
    )  # "daily", "weekly", "monthly", "yearly"

    # Basic metrics
    starting_bankroll: Mapped[float] = mapped_column(Float, nullable=False)
    ending_bankroll: Mapped[float] = mapped_column(Float, nullable=False)
    total_deposited: Mapped[float] = mapped_column(Float, default=0.0)
    total_withdrawn: Mapped[float] = mapped_column(Float, default=0.0)

    # Betting performance
    total_bets: Mapped[int] = mapped_column(Integer, default=0)
    total_wagered: Mapped[float] = mapped_column(Float, default=0.0)
    total_pnl: Mapped[float] = mapped_column(Float, default=0.0)

    # Performance metrics
    roi_percent: Mapped[float | None] = mapped_column(Float, nullable=True)
    win_rate: Mapped[float | None] = mapped_column(Float, nullable=True)
    avg_bet_size: Mapped[float | None] = mapped_column(Float, nullable=True)
    avg_odds: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Kelly criterion metrics
    avg_kelly_fraction: Mapped[float | None] = mapped_column(Float, nullable=True)
    kelly_efficiency: Mapped[float | None] = mapped_column(Float, nullable=True)
    avg_ev_percent: Mapped[float | None] = mapped_column(Float, nullable=True)

    # CLV metrics
    avg_clv_percent: Mapped[float | None] = mapped_column(Float, nullable=True)
    positive_clv_rate: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Risk metrics
    max_drawdown_percent: Mapped[float | None] = mapped_column(Float, nullable=True)
    volatility: Mapped[float | None] = mapped_column(Float, nullable=True)
    sharpe_ratio: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Breakdown by categories
    sport_breakdown: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    market_breakdown: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    sportsbook_breakdown: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    computed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )


class KellyCalculation(Base):
    """Store Kelly criterion calculations for audit and analysis"""

    __tablename__ = "kelly_calculations"
    __table_args__ = {"extend_existing": True}

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), nullable=False, index=True
    )
    bet_id: Mapped[int | None] = mapped_column(ForeignKey("bets.id"), nullable=True)

    # Input parameters
    fair_probability: Mapped[float] = mapped_column(Float, nullable=False)
    market_odds: Mapped[float] = mapped_column(Float, nullable=False)
    bankroll_at_calculation: Mapped[float] = mapped_column(Float, nullable=False)

    # Kelly calculation results
    kelly_fraction: Mapped[float] = mapped_column(Float, nullable=False)
    recommended_bet_size: Mapped[float] = mapped_column(Float, nullable=False)
    expected_value: Mapped[float] = mapped_column(Float, nullable=False)
    expected_growth_rate: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Risk assessment
    risk_of_ruin: Mapped[float | None] = mapped_column(Float, nullable=True)
    confidence_interval_low: Mapped[float | None] = mapped_column(Float, nullable=True)
    confidence_interval_high: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Adjustments applied
    kelly_variant: Mapped[str] = mapped_column(String, default="classic")
    fraction_cap: Mapped[float | None] = mapped_column(Float, nullable=True)
    risk_adjustment: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Context
    calculation_context: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    calculated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    bet = relationship("Bet", backref="kelly_calculations")


def kelly_fraction(fair_probability: float, market_odds_decimal: float) -> float:
    """
    Calculate Kelly criterion fraction for optimal bet sizing.

    Args:
        fair_probability: Your estimated probability of winning (0-1)
        market_odds_decimal: Market odds in decimal format (e.g., 2.0 for +100)

    Returns:
        Kelly fraction (proportion of bankroll to bet)
    """
    if fair_probability <= 0 or fair_probability >= 1:
        raise ValueError("Fair probability must be between 0 and 1")

    if market_odds_decimal <= 1.0:
        raise ValueError("Market odds must be greater than 1.0")

    # Kelly formula: f = (bp - q) / b
    # where:
    # f = fraction of bankroll to bet
    # b = odds received on the bet (decimal odds - 1)
    # p = probability of winning
    # q = probability of losing (1 - p)

    b = market_odds_decimal - 1  # Net odds
    p = fair_probability
    q = 1 - p

    kelly_f = (b * p - q) / b

    # Return 0 if no edge (negative Kelly)
    return max(0, kelly_f)


def fractional_kelly(
    fair_probability: float, market_odds_decimal: float, fraction: float = 0.25
) -> float:
    """
    Calculate fractional Kelly criterion for more conservative bet sizing.

    Args:
        fair_probability: Your estimated probability of winning (0-1)
        market_odds_decimal: Market odds in decimal format
        fraction: Fraction of Kelly to use (e.g., 0.25 for quarter Kelly)

    Returns:
        Fractional Kelly recommendation
    """
    if fraction <= 0 or fraction > 1:
        raise ValueError("Fraction must be between 0 and 1")

    full_kelly = kelly_fraction(fair_probability, market_odds_decimal)
    return full_kelly * fraction


def calculate_expected_value(
    fair_probability: float, market_odds_decimal: float, stake: float
) -> float:
    """
    Calculate expected value of a bet.

    Args:
        fair_probability: Your estimated probability of winning (0-1)
        market_odds_decimal: Market odds in decimal format
        stake: Amount wagered

    Returns:
        Expected value (positive = profitable)
    """
    if fair_probability <= 0 or fair_probability >= 1:
        raise ValueError("Fair probability must be between 0 and 1")

    if market_odds_decimal <= 1.0:
        raise ValueError("Market odds must be greater than 1.0")

    if stake < 0:
        raise ValueError("Stake must be non-negative")

    # EV = (probability of win × amount won) - (probability of loss × amount lost)
    win_amount = stake * (market_odds_decimal - 1)
    loss_amount = stake

    ev = (fair_probability * win_amount) - ((1 - fair_probability) * loss_amount)
    return ev


def calculate_roi_percent(pnl: float, stake: float) -> float:
    """
    Calculate return on investment percentage.

    Args:
        pnl: Profit/loss amount
        stake: Amount wagered

    Returns:
        ROI percentage
    """
    if stake <= 0:
        return 0.0

    return (pnl / stake) * 100


def calculate_clv_percent(placed_odds: float, closing_odds: float) -> float:
    """
    Calculate Closing Line Value (CLV) percentage.

    Args:
        placed_odds: Odds when bet was placed
        closing_odds: Closing odds

    Returns:
        CLV percentage (positive = value gained)
    """
    if placed_odds <= 1.0 or closing_odds <= 1.0:
        return 0.0

    # Convert to implied probabilities
    placed_prob = 1 / placed_odds
    closing_prob = 1 / closing_odds

    # CLV = improvement in implied probability
    clv = ((placed_prob - closing_prob) / closing_prob) * 100
    return clv
