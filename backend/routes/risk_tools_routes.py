"""
Risk Tools Routes - API endpoints for Kelly Criterion and bankroll management
Provides mathematical utilities for optimal bet sizing and risk assessment
"""

import logging
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query

# Contract compliance imports
from ..core.response_models import ResponseBuilder, StandardAPIResponse
from ..core.exceptions import BusinessLogicException, AuthenticationException
from pydantic import BaseModel, Field

from backend.services.risk_tools_service import (
    BankrollSession,
    KellyInputs,
    KellyResult,
    RiskLevel,
    RiskToolsService,
    get_risk_tools_service,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1/risk", tags=["Risk Management"])


# Pydantic models for API
class KellyInputsModel(BaseModel):
    """Request model for Kelly Criterion calculation"""

    win_probability: float = Field(
        ..., ge=0.01, le=0.99, description="Win probability (0.01 to 0.99)"
    )
    american_odds: int = Field(..., description="American odds (e.g., -110, +150)")
    bankroll: float = Field(..., gt=0, description="Total bankroll amount")
    kelly_fraction: float = Field(
        0.25, ge=0.01, le=1.0, description="Fraction of Kelly to use"
    )
    max_bet_percentage: float = Field(
        5.0, ge=0.1, le=50.0, description="Maximum bet as % of bankroll"
    )


class KellyResultModel(BaseModel):
    """Response model for Kelly Criterion result"""

    optimal_bet_size: float
    optimal_bet_percentage: float
    expected_value: float
    expected_return_percentage: float
    kelly_percentage: float
    risk_level: str
    warnings: List[str]
    recommendations: List[str]
    decimal_odds: float
    implied_probability: float
    edge: float
    volatility_estimate: float


class FractionalKellyRequest(BaseModel):
    """Request for multiple Kelly fractions"""

    base_inputs: KellyInputsModel
    fractions: List[float] = Field(..., description="List of Kelly fractions to test")


class SimulationRequest(BaseModel):
    """Request for Monte Carlo simulation"""

    inputs: KellyInputsModel
    num_simulations: int = Field(
        1000, ge=100, le=10000, description="Number of simulations"
    )
    num_bets: int = Field(
        100, ge=10, le=1000, description="Number of bets per simulation"
    )


class SessionRequest(BaseModel):
    """Request to save a betting session"""

    kelly_inputs: KellyInputsModel
    actual_bet_size: Optional[float] = None
    outcome: Optional[str] = Field(None, pattern="^(win|loss|push)$")
    profit_loss: Optional[float] = None


class OptimalFractionRequest(BaseModel):
    """Request for optimal Kelly fraction calculation"""

    win_probability: float = Field(..., ge=0.01, le=0.99)
    american_odds: int
    target_max_drawdown: float = Field(
        0.2, ge=0.05, le=0.5, description="Target maximum drawdown"
    )


@router.post("/kelly/calculate", response_model=KellyResultModel)
async def calculate_kelly(
    request: KellyInputsModel,
    risk_service: RiskToolsService = Depends(get_risk_tools_service),
):
    """
    Calculate optimal bet size using Kelly Criterion

    Provides mathematically optimal bet sizing based on win probability,
    odds, bankroll, and risk preferences.
    """
    try:
        # Convert to service inputs
        inputs = KellyInputs(
            win_probability=request.win_probability,
            american_odds=request.american_odds,
            bankroll=request.bankroll,
            kelly_fraction=request.kelly_fraction,
            max_bet_percentage=request.max_bet_percentage,
        )

        # Calculate Kelly result
        result = risk_service.calculate_kelly(inputs)

        # Convert to response model
        return ResponseBuilder.success(KellyResultModel(**result.to_dict()))

    except ValueError as e:
        raise BusinessLogicException("str(e"))
    except Exception as e:
        logger.error(f"Kelly calculation error: {e}")
        raise BusinessLogicException("Failed to calculate Kelly criterion"
        ")


@router.post("/kelly/fractional", response_model=StandardAPIResponse[Dict[str, Any]])
async def calculate_fractional_kelly(
    request: FractionalKellyRequest,
    risk_service: RiskToolsService = Depends(get_risk_tools_service),
):
    """
    Calculate Kelly results for multiple fractions

    Compares different Kelly fractions to help users understand
    the trade-off between growth and risk.
    """
    try:
        # Convert to service inputs
        base_inputs = KellyInputs(
            win_probability=request.base_inputs.win_probability,
            american_odds=request.base_inputs.american_odds,
            bankroll=request.base_inputs.bankroll,
            kelly_fraction=request.base_inputs.kelly_fraction,
            max_bet_percentage=request.base_inputs.max_bet_percentage,
        )

        # Calculate for all fractions
        results = risk_service.calculate_fractional_kelly(
            base_inputs, request.fractions
        )

        # Convert to response format
        response = {}
        for fraction, result in results.items():
            response[str(fraction)] = result.to_dict()

        return ResponseBuilder.success({
            "base_inputs": request.base_inputs.dict(),
            "fraction_results": response,
            "comparison_metrics": {
                "max_bet_size": max(r.optimal_bet_size for r in results.values()),
                "min_bet_size": min(r.optimal_bet_size for r in results.values()),
                "max_expected_value": max(r.expected_value for r in results.values()),
                "min_risk_level": min(r.risk_level.value for r in results.values()),
                "max_risk_level": max(r.risk_level.value for r in results.values()),
            }),
        }

    except ValueError as e:
        raise BusinessLogicException("str(e"))
    except Exception as e:
        logger.error(f"Fractional Kelly calculation error: {e}")
        raise BusinessLogicException("Failed to calculate fractional Kelly"
        ")


@router.post("/kelly/simulate", response_model=StandardAPIResponse[Dict[str, Any]])
async def simulate_kelly_outcomes(
    request: SimulationRequest,
    risk_service: RiskToolsService = Depends(get_risk_tools_service),
):
    """
    Run Monte Carlo simulation of Kelly betting strategy

    Simulates multiple betting sequences to estimate long-term outcomes,
    including probability of ruin and drawdown distributions.
    """
    try:
        # Convert to service inputs
        inputs = KellyInputs(
            win_probability=request.inputs.win_probability,
            american_odds=request.inputs.american_odds,
            bankroll=request.inputs.bankroll,
            kelly_fraction=request.inputs.kelly_fraction,
            max_bet_percentage=request.inputs.max_bet_percentage,
        )

        # Run simulation
        simulation_results = risk_service.simulate_kelly_outcomes(
            inputs, request.num_simulations, request.num_bets
        )

        return ResponseBuilder.success(simulation_results)

    except ValueError as e:
        raise BusinessLogicException("str(e"))
    except Exception as e:
        logger.error(f"Kelly simulation error: {e}")
        raise BusinessLogicException("Failed to run Kelly simulation")


@router.post("/kelly/optimal-fraction", response_model=StandardAPIResponse[Dict[str, Any]])
async def calculate_optimal_fraction(
    request: OptimalFractionRequest,
    risk_service: RiskToolsService = Depends(get_risk_tools_service),
):
    """
    Find optimal Kelly fraction for target risk level

    Determines the Kelly fraction that balances growth with
    acceptable maximum drawdown risk.
    """
    try:
        optimal_fraction = risk_service.calculate_optimal_kelly_fraction(
            request.win_probability, request.american_odds, request.target_max_drawdown
        )

        # Calculate result with optimal fraction
        inputs = KellyInputs(
            win_probability=request.win_probability,
            american_odds=request.american_odds,
            bankroll=1000,  # Standard amount for comparison
            kelly_fraction=optimal_fraction,
        )

        result = risk_service.calculate_kelly(inputs)

        return ResponseBuilder.success({
            "optimal_kelly_fraction": round(optimal_fraction, 3),
            "target_max_drawdown": request.target_max_drawdown,
            "kelly_result": result.to_dict(),
            "recommendation": f"Use {optimal_fraction:.1%}) Kelly for target {request.target_max_drawdown:.1%} max drawdown",
        }

    except Exception as e:
        logger.error(f"Optimal fraction calculation error: {e}")
        raise BusinessLogicException("Failed to calculate optimal fraction"
        ")


@router.post("/sessions/save", response_model=StandardAPIResponse[Dict[str, Any]])
async def save_betting_session(
    request: SessionRequest,
    user_id: str = Header(None, alias="X-User-ID"),
    risk_service: RiskToolsService = Depends(get_risk_tools_service),
):
    """
    Save a betting session for tracking

    Records Kelly calculations and actual bet outcomes for
    bankroll management and performance analysis.
    """
    try:
        if not user_id:
            user_id = "anonymous"  # Allow anonymous tracking

        # Convert inputs and calculate Kelly result
        kelly_inputs = KellyInputs(
            win_probability=request.kelly_inputs.win_probability,
            american_odds=request.kelly_inputs.american_odds,
            bankroll=request.kelly_inputs.bankroll,
            kelly_fraction=request.kelly_inputs.kelly_fraction,
            max_bet_percentage=request.kelly_inputs.max_bet_percentage,
        )

        kelly_result = risk_service.calculate_kelly(kelly_inputs)

        # Create session
        session = BankrollSession(
            id=f"{user_id}_{datetime.now().timestamp()}",
            timestamp=datetime.now(),
            kelly_inputs=kelly_inputs,
            kelly_result=kelly_result,
            actual_bet_size=request.actual_bet_size,
            outcome=request.outcome,
            profit_loss=request.profit_loss,
        )

        # Save session
        risk_service.save_session(user_id, session)

        return ResponseBuilder.success({
            "session_id": session.id,
            "saved_at": session.timestamp.isoformat(),
            "kelly_recommendation": kelly_result.optimal_bet_size,
            "actual_bet": request.actual_bet_size,
            "adherence_score": (
                min(1.0, request.actual_bet_size / kelly_result.optimal_bet_size)
                if request.actual_bet_size and kelly_result.optimal_bet_size > 0
                else None
            ),
        })

    except Exception as e:
        logger.error(f"Session save error: {e}")
        raise BusinessLogicException("Failed to save session")


@router.get("/sessions", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_betting_sessions(
    user_id: str = Header(None, alias="X-User-ID"),
    limit: int = Query(50, ge=1, le=200),
    risk_service: RiskToolsService = Depends(get_risk_tools_service),
):
    """Get user's betting session history"""
    try:
        if not user_id:
            return ResponseBuilder.success({"sessions": [], "total": 0})

        sessions = risk_service.get_user_sessions(user_id, limit)

        # Convert to response format
        session_data = []
        for session in sessions:
            session_dict = {
                "id": session.id,
                "timestamp": session.timestamp.isoformat(),
                "kelly_inputs": {
                    "win_probability": session.kelly_inputs.win_probability,
                    "american_odds": session.kelly_inputs.american_odds,
                    "bankroll": session.kelly_inputs.bankroll,
                    "kelly_fraction": session.kelly_inputs.kelly_fraction,
                    "max_bet_percentage": session.kelly_inputs.max_bet_percentage,
                },
                "kelly_result": session.kelly_result.to_dict(),
                "actual_bet_size": session.actual_bet_size,
                "outcome": session.outcome,
                "profit_loss": session.profit_loss,
            }
            session_data.append(session_dict)

        return ResponseBuilder.success({"sessions": session_data, "total": len(session_data)})

    except Exception as e:
        logger.error(f"Session retrieval error: {e}")
        raise BusinessLogicException("Failed to retrieve sessions")


@router.get("/stats", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_bankroll_stats(
    user_id: str = Header(None, alias="X-User-ID"),
    risk_service: RiskToolsService = Depends(get_risk_tools_service),
):
    """
    Get comprehensive bankroll statistics

    Provides detailed performance metrics including win rate,
    ROI, maximum drawdown, and Kelly adherence score.
    """
    try:
        if not user_id:
            return ResponseBuilder.success({"error": "User ID required for statistics"})

        stats = risk_service.calculate_bankroll_stats(user_id)

        if not stats:
            return ResponseBuilder.success({
                "message": "Insufficient data for statistics",
                "minimum_sessions_required": 2,
            })

        return ResponseBuilder.success({
            "total_sessions": stats.total_sessions,
            "win_rate": round(stats.win_rate * 100, 1),
            "total_profit_loss": round(stats.total_profit_loss, 2),
            "average_bet_size": round(stats.average_bet_size, 2),
            "average_profit_per_bet": round(stats.average_profit_per_bet, 2),
            "roi_percentage": round(stats.roi_percentage, 2),
            "max_drawdown": round(stats.max_drawdown, 2),
            "max_drawdown_percentage": round(stats.max_drawdown_percentage, 1),
            "sharpe_ratio": round(stats.sharpe_ratio, 3),
            "kelly_adherence_score": round(stats.kelly_adherence_score * 100, 1),
            "performance_grade": _calculate_performance_grade(stats),
        })

    except Exception as e:
        logger.error(f"Stats calculation error: {e}")
        raise BusinessLogicException("Failed to calculate statistics")


@router.get("/tools/odds-converter", response_model=StandardAPIResponse[Dict[str, Any]])
async def convert_odds(
    american: Optional[int] = Query(None, description="American odds"),
    decimal: Optional[float] = Query(None, description="Decimal odds"),
    fractional: Optional[str] = Query(
        None, description="Fractional odds (e.g., '3/2')"
    ),
):
    """
    Convert between different odds formats

    Utility endpoint for converting American, decimal, and fractional odds.
    """
    try:
        result = {}

        if american is not None:
            # Convert from American
            decimal_odds = (
                (american / 100 + 1) if american > 0 else (100 / abs(american) + 1)
            )
            implied_prob = 1 / decimal_odds

            result = {
                "american": american,
                "decimal": round(decimal_odds, 3),
                "implied_probability": round(implied_prob, 3),
                "implied_percentage": round(implied_prob * 100, 1),
            }

        elif decimal is not None:
            # Convert from decimal
            if decimal <= 1:
                raise ValueError("Decimal odds must be greater than 1")

            american_odds = (
                int((decimal - 1) * 100) if decimal >= 2 else int(-100 / (decimal - 1))
            )
            implied_prob = 1 / decimal

            result = {
                "decimal": decimal,
                "american": american_odds,
                "implied_probability": round(implied_prob, 3),
                "implied_percentage": round(implied_prob * 100, 1),
            }

        elif fractional:
            # Convert from fractional
            try:
                numerator, denominator = map(int, fractional.split("/"))
                decimal_odds = (numerator / denominator) + 1
                american_odds = (
                    int((decimal_odds - 1) * 100)
                    if decimal_odds >= 2
                    else int(-100 / (decimal_odds - 1))
                )
                implied_prob = 1 / decimal_odds

                result = {
                    "fractional": fractional,
                    "decimal": round(decimal_odds, 3),
                    "american": american_odds,
                    "implied_probability": round(implied_prob, 3),
                    "implied_percentage": round(implied_prob * 100, 1),
                }
            except:
                raise ValueError(
                    "Invalid fractional odds format. Use 'numerator/denominator'"
                )

        else:
            raise ValueError("Must provide odds in one format")

        return ResponseBuilder.success(result)

    except ValueError as e:
        raise BusinessLogicException("str(e"))
    except Exception as e:
        logger.error(f"Odds conversion error: {e}")
        raise BusinessLogicException("Failed to convert odds")


@router.get("/health", response_model=StandardAPIResponse[Dict[str, Any]])
async def risk_tools_health_check(
    risk_service: RiskToolsService = Depends(get_risk_tools_service),
):
    """Check risk tools service health"""
    try:
        # Test basic Kelly calculation
        test_inputs = KellyInputs(
            win_probability=0.55, american_odds=-110, bankroll=1000, kelly_fraction=0.25
        )

        test_result = risk_service.calculate_kelly(test_inputs)

        return ResponseBuilder.success({
            "status": "healthy",
            "features_available": [
                "kelly_calculation",
                "fractional_kelly",
                "monte_carlo_simulation",
                "bankroll_tracking",
                "odds_conversion",
            ],
            "cached_sessions": len(risk_service.sessions_cache),
            "test_calculation": {
                "inputs": test_inputs.__dict__,
                "optimal_bet_size": test_result.optimal_bet_size,
                "risk_level": test_result.risk_level.value,
            }),
            "timestamp": datetime.utcnow().isoformat(),
        }

    except Exception as e:
        logger.error(f"Risk tools health check failed: {e}")
        return ResponseBuilder.success({
            "status": "degraded",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat(),
        })


def _calculate_performance_grade(stats) -> str:
    """Calculate a letter grade for betting performance"""

    score = 0

    # Win rate (30% weight)
    if stats.win_rate >= 0.6:
        score += 30
    elif stats.win_rate >= 0.55:
        score += 25
    elif stats.win_rate >= 0.5:
        score += 20
    elif stats.win_rate >= 0.45:
        score += 15
    elif stats.win_rate >= 0.4:
        score += 10

    # ROI (40% weight)
    if stats.roi_percentage >= 10:
        score += 40
    elif stats.roi_percentage >= 5:
        score += 35
    elif stats.roi_percentage >= 2:
        score += 30
    elif stats.roi_percentage >= 0:
        score += 20
    elif stats.roi_percentage >= -5:
        score += 10

    # Kelly adherence (20% weight)
    if stats.kelly_adherence_score >= 0.9:
        score += 20
    elif stats.kelly_adherence_score >= 0.8:
        score += 18
    elif stats.kelly_adherence_score >= 0.7:
        score += 15
    elif stats.kelly_adherence_score >= 0.6:
        score += 12
    elif stats.kelly_adherence_score >= 0.5:
        score += 8

    # Drawdown management (10% weight)
    if stats.max_drawdown_percentage <= 5:
        score += 10
    elif stats.max_drawdown_percentage <= 10:
        score += 8
    elif stats.max_drawdown_percentage <= 15:
        score += 6
    elif stats.max_drawdown_percentage <= 20:
        score += 4
    elif stats.max_drawdown_percentage <= 30:
        score += 2

    # Convert to letter grade
    if score >= 85:
        return "A"
    elif score >= 75:
        return "B"
    elif score >= 65:
        return "C"
    elif score >= 55:
        return "D"
    else:
        return "F"
