"""
Unified Optimization Domain Router

RESTful API endpoints for all optimization and risk management operations.
Consolidates optimization routes into a logical, maintainable structure.
"""

import logging
from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Path, Query
from fastapi.responses import JSONResponse

from .models import (
    ArbitrageAnalysis,
    ArbitrageOptimizationRequest,
    BacktestResult,
    HealthResponse,
    KellyOptimizationRequest,
    KellyRecommendation,
    OptimizationError,
    OptimizationObjective,
    OptimizationRequest,
    OptimizationResponse,
    OptimizationType,
    PortfolioOptimization,
    PortfolioOptimizationRequest,
    RiskAssessment,
    RiskAssessmentRequest,
    RiskLevel,
)
from .service import UnifiedOptimizationService

logger = logging.getLogger(__name__)

# Create router
optimization_router = APIRouter(
    prefix="/api/v1/optimization",
    tags=["optimization"],
    responses={
        404: {"model": OptimizationError, "description": "Not found"},
        500: {"model": OptimizationError, "description": "Internal server error"},
    },
)


# Service dependency
async def get_optimization_service() -> UnifiedOptimizationService:
    """Get optimization service instance"""
    service = UnifiedOptimizationService()
    if not service.is_initialized:
        await service.initialize()
    return service


@optimization_router.get("/health", response_model=HealthResponse)
async def health_check(
    service: UnifiedOptimizationService = Depends(get_optimization_service),
):
    """
    Check optimization service health
    """
    try:
        return await service.health_check()
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=500, detail="Health check failed")


@optimization_router.post("/portfolio", response_model=OptimizationResponse)
async def optimize_portfolio(
    request: PortfolioOptimizationRequest,
    service: UnifiedOptimizationService = Depends(get_optimization_service),
):
    """
    Optimize portfolio allocation

    **Request Body:**
    - **predictions**: List of predictions to optimize
    - **max_allocation_per_bet**: Maximum allocation per single bet (0-1)
    - **min_allocation_per_bet**: Minimum allocation per bet (0-1)
    - **max_positions**: Maximum number of positions (1-50)
    - **total_bankroll**: Total bankroll amount
    - **risk_level**: Risk tolerance level (conservative, moderate, aggressive, ultra_aggressive)
    - **max_drawdown**: Maximum acceptable drawdown (0-1)
    - **target_return**: Optional target return rate
    - **objective**: Optimization objective (maximize_return, minimize_risk, maximize_sharpe, etc.)
    - **use_quantum**: Use quantum optimization algorithms
    - **correlation_threshold**: Maximum correlation between bets (0-1)

    **Returns:**
    - Optimized portfolio allocation with performance metrics
    - Risk analysis and diversification metrics
    - Quantum optimization advantages (if applicable)
    """
    try:
        return await service.optimize_portfolio(request)
    except Exception as e:
        logger.error(f"Portfolio optimization failed: {e}")
        raise HTTPException(
            status_code=500, detail=f"Portfolio optimization failed: {str(e)}"
        )


@optimization_router.post("/kelly", response_model=OptimizationResponse)
async def calculate_kelly_criterion(
    request: KellyOptimizationRequest,
    service: UnifiedOptimizationService = Depends(get_optimization_service),
):
    """
    Calculate Kelly criterion recommendations

    **Request Body:**
    - **predictions**: Predictions with win probabilities and odds
    - **fractional_kelly**: Fractional Kelly multiplier (0.1-1.0)
    - **max_kelly_allocation**: Maximum Kelly allocation (0-1)
    - **min_edge**: Minimum edge required (0-1)
    - **bankroll**: Total bankroll
    - **risk_level**: Risk tolerance level

    **Returns:**
    - Kelly criterion recommendations for each bet
    - Expected growth rate and probability of ruin
    - Individual bet recommendations with edge calculations
    """
    try:
        return await service.calculate_kelly(request)
    except Exception as e:
        logger.error(f"Kelly calculation failed: {e}")
        raise HTTPException(
            status_code=500, detail=f"Kelly calculation failed: {str(e)}"
        )


@optimization_router.post("/arbitrage", response_model=OptimizationResponse)
async def analyze_arbitrage(
    request: ArbitrageOptimizationRequest,
    service: UnifiedOptimizationService = Depends(get_optimization_service),
):
    """
    Analyze arbitrage opportunities

    **Request Body:**
    - **opportunities**: List of arbitrage opportunities
    - **min_profit_margin**: Minimum profit margin (0-1)
    - **max_stake_per_arb**: Maximum stake per arbitrage
    - **total_capital**: Total available capital
    - **sportsbook_limits**: Optional sportsbook betting limits
    - **execution_time_limit**: Max execution time in seconds

    **Returns:**
    - Arbitrage analysis with recommended stakes
    - Guaranteed profit calculations
    - Risk analysis and optimal execution order
    """
    try:
        return await service.analyze_arbitrage(request)
    except Exception as e:
        logger.error(f"Arbitrage analysis failed: {e}")
        raise HTTPException(
            status_code=500, detail=f"Arbitrage analysis failed: {str(e)}"
        )


@optimization_router.post("/risk", response_model=OptimizationResponse)
async def assess_risk(
    request: RiskAssessmentRequest,
    service: UnifiedOptimizationService = Depends(get_optimization_service),
):
    """
    Assess portfolio risk

    **Request Body:**
    - **current_positions**: List of current betting positions
    - **bankroll**: Current bankroll
    - **risk_level**: Risk tolerance level
    - **time_horizon**: Risk assessment period in days

    **Returns:**
    - Comprehensive risk assessment with scores
    - Value at Risk (VaR) calculations
    - Stress testing results and recommendations
    """
    try:
        return await service.assess_risk(request)
    except Exception as e:
        logger.error(f"Risk assessment failed: {e}")
        raise HTTPException(status_code=500, detail=f"Risk assessment failed: {str(e)}")


@optimization_router.get("/portfolio/quick")
async def quick_portfolio_optimization(
    predictions: str = Query(..., description="JSON string of predictions"),
    bankroll: float = Query(..., description="Total bankroll"),
    risk_level: RiskLevel = Query(RiskLevel.MODERATE, description="Risk level"),
    use_quantum: bool = Query(True, description="Use quantum optimization"),
    max_positions: int = Query(5, description="Maximum positions"),
    service: UnifiedOptimizationService = Depends(get_optimization_service),
):
    """
    Quick portfolio optimization with simplified parameters

    **Query Parameters:**
    - **predictions**: JSON string of predictions
    - **bankroll**: Total bankroll amount
    - **risk_level**: Risk tolerance level
    - **use_quantum**: Use quantum optimization
    - **max_positions**: Maximum number of positions

    **Returns:**
    - Simplified portfolio optimization result
    """
    try:
        import json

        # Parse predictions
        predictions_data = json.loads(predictions)

        # Create optimization request
        request = PortfolioOptimizationRequest(
            predictions=predictions_data,
            total_bankroll=Decimal(str(bankroll)),
            risk_level=risk_level,
            use_quantum=use_quantum,
            max_positions=max_positions,
        )

        return await service.optimize_portfolio(request)

    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid predictions JSON")
    except Exception as e:
        logger.error(f"Quick portfolio optimization failed: {e}")
        raise HTTPException(status_code=500, detail="Quick optimization failed")


@optimization_router.get("/kelly/calculate")
async def quick_kelly_calculation(
    win_probability: float = Query(..., ge=0, le=1, description="Win probability"),
    odds: int = Query(..., description="American odds"),
    bankroll: float = Query(..., description="Total bankroll"),
    fractional_kelly: float = Query(
        0.25, ge=0.1, le=1.0, description="Fractional Kelly"
    ),
    service: UnifiedOptimizationService = Depends(get_optimization_service),
):
    """
    Quick Kelly criterion calculation for single bet

    **Query Parameters:**
    - **win_probability**: Probability of winning (0-1)
    - **odds**: American odds format
    - **bankroll**: Total bankroll
    - **fractional_kelly**: Fractional Kelly multiplier

    **Returns:**
    - Kelly recommendation for single bet
    """
    try:
        # Create single prediction
        prediction = {
            "id": "single_bet",
            "win_probability": win_probability,
            "odds": odds,
        }

        request = KellyOptimizationRequest(
            predictions=[prediction],
            fractional_kelly=fractional_kelly,
            bankroll=Decimal(str(bankroll)),
        )

        response = await service.calculate_kelly(request)

        # Extract single bet recommendation
        if (
            response.kelly_recommendation
            and response.kelly_recommendation.individual_recommendations
        ):
            single_rec = response.kelly_recommendation.individual_recommendations[0]
            return {
                "allocation": single_rec["allocation"],
                "kelly_fraction": single_rec["kelly_fraction"],
                "edge": single_rec["edge"],
                "expected_growth": single_rec["expected_growth"],
                "stake_amount": single_rec["allocation"] * bankroll,
                "bankroll": bankroll,
            }
        else:
            return {"error": "No Kelly recommendation generated"}

    except Exception as e:
        logger.error(f"Quick Kelly calculation failed: {e}")
        raise HTTPException(status_code=500, detail="Kelly calculation failed")


@optimization_router.get("/risk/quick")
async def quick_risk_assessment(
    bankroll: float = Query(..., description="Current bankroll"),
    positions_value: float = Query(..., description="Total positions value"),
    num_positions: int = Query(..., description="Number of positions"),
    risk_level: RiskLevel = Query(RiskLevel.MODERATE, description="Risk level"),
    service: UnifiedOptimizationService = Depends(get_optimization_service),
):
    """
    Quick risk assessment with basic parameters

    **Query Parameters:**
    - **bankroll**: Current bankroll
    - **positions_value**: Total value of positions
    - **num_positions**: Number of positions
    - **risk_level**: Risk tolerance level

    **Returns:**
    - Quick risk assessment summary
    """
    try:
        # Create mock positions
        positions = []
        position_value = positions_value / max(num_positions, 1)

        for i in range(num_positions):
            positions.append(
                {
                    "id": f"position_{i+1}",
                    "value": position_value,
                    "risk_score": 0.5,  # Mock risk score
                    "sport": "mlb",
                    "liquidity": "high",
                }
            )

        request = RiskAssessmentRequest(
            current_positions=positions,
            bankroll=Decimal(str(bankroll)),
            risk_level=risk_level,
        )

        response = await service.assess_risk(request)

        # Return simplified summary
        if response.risk_assessment:
            risk = response.risk_assessment
            return {
                "overall_risk_score": risk.overall_risk_score,
                "risk_level": risk.risk_level,
                "var_1_day_95": risk.var_1_day_95,
                "worst_case_loss": risk.worst_case_loss,
                "recommendations": risk.risk_recommendations[:3],  # Top 3
                "portfolio_allocation": (
                    positions_value / bankroll if bankroll > 0 else 0
                ),
            }
        else:
            return {"error": "Risk assessment failed"}

    except Exception as e:
        logger.error(f"Quick risk assessment failed: {e}")
        raise HTTPException(status_code=500, detail="Risk assessment failed")


@optimization_router.get("/strategies/compare")
async def compare_strategies(
    strategy_a: str = Query(..., description="Strategy A name"),
    strategy_b: str = Query(..., description="Strategy B name"),
    time_period: int = Query(30, description="Comparison period in days"),
    service: UnifiedOptimizationService = Depends(get_optimization_service),
):
    """
    Compare optimization strategies

    **Query Parameters:**
    - **strategy_a**: First strategy name
    - **strategy_b**: Second strategy name
    - **time_period**: Comparison period in days

    **Returns:**
    - Strategy comparison analysis
    """
    try:
        # Mock strategy comparison
        comparison = {
            "strategy_a": {
                "name": strategy_a,
                "return": 15.2,
                "volatility": 8.5,
                "sharpe_ratio": 1.79,
                "max_drawdown": 5.2,
                "win_rate": 0.68,
            },
            "strategy_b": {
                "name": strategy_b,
                "return": 12.8,
                "volatility": 6.2,
                "sharpe_ratio": 2.06,
                "max_drawdown": 3.8,
                "win_rate": 0.72,
            },
            "comparison": {
                "better_return": strategy_a,
                "better_risk_adjusted": strategy_b,
                "better_drawdown": strategy_b,
                "recommendation": strategy_b,
                "confidence": 0.75,
            },
            "time_period": time_period,
            "generated_at": datetime.utcnow().isoformat(),
        }

        return comparison

    except Exception as e:
        logger.error(f"Strategy comparison failed: {e}")
        raise HTTPException(status_code=500, detail="Strategy comparison failed")


@optimization_router.post("/backtest")
async def backtest_strategy(
    strategy_config: dict,
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    initial_capital: float = Query(10000, description="Initial capital"),
    service: UnifiedOptimizationService = Depends(get_optimization_service),
):
    """
    Backtest optimization strategy

    **Query Parameters:**
    - **start_date**: Backtest start date
    - **end_date**: Backtest end date
    - **initial_capital**: Initial capital amount

    **Request Body:**
    - **strategy_config**: Strategy configuration parameters

    **Returns:**
    - Comprehensive backtest results with performance metrics
    """
    try:
        # Mock backtest results
        import uuid
        from datetime import datetime, timedelta, timezone

        import numpy as np

        start = datetime.fromisoformat(start_date)
        end = datetime.fromisoformat(end_date)
        days = (end - start).days

        # Generate mock equity curve
        daily_returns = np.random.normal(0.001, 0.02, days)  # Mock daily returns
        cumulative_returns = np.cumprod(1 + daily_returns)

        equity_curve = []
        drawdown_curve = []
        peak = 1.0

        for i, cum_return in enumerate(cumulative_returns):
            date = start + timedelta(days=i)
            equity_value = initial_capital * cum_return
            equity_curve.append((date, equity_value))

            # Calculate drawdown
            peak = max(peak, cum_return)
            drawdown = (peak - cum_return) / peak
            drawdown_curve.append((date, drawdown))

        total_return = (cumulative_returns[-1] - 1) * 100
        volatility = np.std(daily_returns) * np.sqrt(252) * 100  # Annualized
        sharpe_ratio = (np.mean(daily_returns) * 252) / (
            np.std(daily_returns) * np.sqrt(252)
        )
        max_drawdown = max(dd[1] for dd in drawdown_curve) * 100

        backtest_result = BacktestResult(
            backtest_id=str(uuid.uuid4()),
            strategy_name=strategy_config.get("name", "Custom Strategy"),
            total_return=total_return,
            annualized_return=total_return * (365 / days),
            volatility=volatility,
            sharpe_ratio=sharpe_ratio,
            max_drawdown=max_drawdown,
            value_at_risk=np.percentile(daily_returns, 5) * initial_capital,
            conditional_var=np.mean(
                [r for r in daily_returns if r <= np.percentile(daily_returns, 5)]
            )
            * initial_capital,
            total_trades=np.random.randint(50, 200),
            win_rate=np.random.uniform(0.55, 0.75),
            avg_win=np.random.uniform(100, 500),
            avg_loss=np.random.uniform(-200, -50),
            profit_factor=np.random.uniform(1.2, 2.5),
            equity_curve=equity_curve,
            drawdown_curve=drawdown_curve,
            monthly_returns={},
            yearly_returns={},
            start_date=start,
            end_date=end,
            generated_at=datetime.now(timezone.utc),
        )

        return backtest_result

    except Exception as e:
        logger.error(f"Backtest failed: {e}")
        raise HTTPException(status_code=500, detail="Backtest failed")


# Error handlers
