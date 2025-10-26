"""
Advanced Kelly Criterion API Routes
API endpoints for sophisticated bet sizing optimization with risk management
and portfolio-level Kelly calculations.
Part of Phase 4.3: Elite Betting Operations and Automation
"""

from datetime import datetime
from typing import Optional, List, Dict, Any, Union
from fastapi import APIRouter, Query, HTTPException, Body, Request

# Contract compliance imports
from ..core.response_models import ResponseBuilder, StandardAPIResponse
from ..core.exceptions import BusinessLogicException, AuthenticationException
from pydantic import BaseModel, Field
import logging

# Security imports
from backend.services.security.rate_limiter import rate_limit, get_client_ip
from backend.services.security.rbac import require_permission, Permission
from backend.services.security.data_redaction import get_redaction_service, RedactionLevel

from ..services.advanced_kelly_engine import (
    get_kelly_engine,
    BettingOpportunity,
    KellyResult,
    PortfolioMetrics,
    RiskManagementSettings,
    RiskProfile,
    BetType,
    KellyVariant
)

logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/api/advanced-kelly", tags=["Advanced Kelly Criterion"])

# Request Models
class BettingOpportunityRequest(BaseModel):
    opportunity_id: str
    description: str
    sport: str
    market_type: str
    offered_odds: float = Field(gt=1.0, description="Decimal odds (must be > 1.0)")
    true_probability: float = Field(gt=0, lt=1, description="Estimated probability (0-1)")
    confidence_interval_low: float = Field(gt=0, lt=1)
    confidence_interval_high: float = Field(gt=0, lt=1)
    max_bet_limit: float = Field(gt=0, description="Maximum bet limit")
    sportsbook: str
    expires_in_hours: float = Field(gt=0, description="Hours until expiry")
    metadata: Dict[str, Any] = Field(default_factory=dict)

class PortfolioOptimizationRequest(BaseModel):
    opportunities: List[BettingOpportunityRequest]
    total_bankroll: Optional[float] = None
    variant: str = Field(default="portfolio", description="Kelly variant to use")

class RiskManagementRequest(BaseModel):
    max_bet_percentage: Optional[float] = Field(None, ge=0, le=1)
    max_daily_risk: Optional[float] = Field(None, ge=0, le=1)
    max_total_exposure: Optional[float] = Field(None, ge=0, le=1)
    min_edge_threshold: Optional[float] = Field(None, ge=0)
    min_confidence_threshold: Optional[float] = Field(None, ge=0, le=1)
    kelly_fraction_cap: Optional[float] = Field(None, ge=0, le=1)
    drawdown_stop_loss: Optional[float] = Field(None, ge=0, le=1)
    correlation_limit: Optional[float] = Field(None, ge=0, le=1)
    volatility_adjustment: Optional[bool] = None
    dynamic_sizing: Optional[bool] = None

class BankrollUpdateRequest(BaseModel):
    new_bankroll: float = Field(gt=0)
    reason: Optional[str] = None

# Response Models
class KellyResultResponse(BaseModel):
    opportunity_id: str
    classic_kelly_fraction: float
    recommended_fraction: float
    recommended_bet_size: float
    expected_value: float
    expected_growth_rate: float
    risk_of_ruin: float
    bankroll_percentage: float
    confidence_score: float
    risk_warnings: List[str]
    variant_used: str
    calculation_metadata: Dict[str, Any]

class PortfolioMetricsResponse(BaseModel):
    total_bankroll: float
    allocated_capital: float
    available_capital: float
    expected_return: float
    portfolio_variance: float
    sharpe_ratio: float
    max_drawdown: float
    kelly_leverage: float
    correlation_risk: float
    diversification_score: float
    risk_adjusted_kelly: float

class RiskManagementResponse(BaseModel):
    current_settings: Dict[str, Any]
    portfolio_status: Dict[str, Any]
    risk_alerts: List[str]

def _convert_betting_opportunity(req: BettingOpportunityRequest) -> BettingOpportunity:
    """Convert request to internal betting opportunity"""
    return ResponseBuilder.success(BettingOpportunity(
        opportunity_id=req.opportunity_id,
        description=req.description,
        sport=req.sport,
        market_type=BetType(req.market_type.lower())),
        offered_odds=req.offered_odds,
        true_probability=req.true_probability,
        confidence_interval=(req.confidence_interval_low, req.confidence_interval_high),
        max_bet_limit=req.max_bet_limit,
        sportsbook=req.sportsbook,
        expires_at=datetime.now().replace(microsecond=0) + 
                   datetime.timedelta(hours=req.expires_in_hours),
        metadata=req.metadata
    )

def _convert_kelly_result(result: KellyResult) -> KellyResultResponse:
    """Convert internal Kelly result to API response"""
    return ResponseBuilder.success(KellyResultResponse(
        opportunity_id=result.opportunity_id,
        classic_kelly_fraction=result.classic_kelly_fraction,
        recommended_fraction=result.recommended_fraction,
        recommended_bet_size=result.recommended_bet_size,
        expected_value=result.expected_value,
        expected_growth_rate=result.expected_growth_rate,
        risk_of_ruin=result.risk_of_ruin,
        bankroll_percentage=result.bankroll_percentage,
        confidence_score=result.confidence_score,
        risk_warnings=result.risk_warnings,
        variant_used=result.variant_used.value,
        calculation_metadata=result.calculation_metadata
    ))

@router.post("/calculate", response_model=KellyResultResponse)
@rate_limit("optimization", cost=1.0, extract_identifier=lambda *args: get_client_ip(args[1]) if len(args) > 1 else "default")
@require_permission(Permission.RUN_OPTIMIZATION)
async def calculate_kelly_bet_size(
    opportunity: BettingOpportunityRequest,
    request: Request,
    variant: str = Query("adaptive", description="Kelly variant (classic, fractional, adaptive)")
):
    """
    Calculate optimal bet size for a single betting opportunity
    """
    try:
        engine = get_kelly_engine()
        
        # Convert request to internal format
        betting_opp = _convert_betting_opportunity(opportunity)
        
        # Validate variant
        try:
            kelly_variant = KellyVariant(variant.lower())
        except ValueError:
            raise BusinessLogicException(f"Invalid Kelly variant: {variant}")
        
        # Calculate optimal bet size
        result = await engine.calculate_optimal_bet_size(betting_opp, kelly_variant)
        
        logger.info(f"Calculated Kelly bet size for {opportunity.opportunity_id}: "
                   f"{result.recommended_bet_size:.2f} ({result.bankroll_percentage:.2%})")
        
        return ResponseBuilder.success(_convert_kelly_result(result))
        
    except ValueError as e:
        raise BusinessLogicException(str(e))
    except Exception as e:
        logger.error(f"Error calculating Kelly bet size: {e}")
        raise BusinessLogicException(f"Failed to calculate bet size: {str(e)}")

@router.post("/portfolio-optimization", response_model=Dict[str, KellyResultResponse])
async def optimize_portfolio(
    request: PortfolioOptimizationRequest
):
    """
    Calculate optimal portfolio allocation across multiple betting opportunities
    """
    try:
        engine = get_kelly_engine()
        
        # Update bankroll if provided
        if request.total_bankroll:
            engine.current_bankroll = request.total_bankroll
        
        # Convert opportunities
        opportunities = [_convert_betting_opportunity(opp) for opp in request.opportunities]
        
        # Validate opportunities
        if not opportunities:
            raise BusinessLogicException("No opportunities provided")
        
        if len(opportunities) > 20:
            raise BusinessLogicException("Too many opportunities (max 20")")
        
        # Calculate portfolio optimization
        results = await engine.calculate_portfolio_optimization(opportunities)
        
        # Convert results
        response_results = {
            opp_id: _convert_kelly_result(result) 
            for opp_id, result in results.items()
        }
        
        logger.info(f"Calculated portfolio optimization for {len(opportunities)} opportunities")
        
        return ResponseBuilder.success(response_results)
        
    except ValueError as e:
        raise BusinessLogicException("str(e"))
    except Exception as e:
        logger.error(f"Error optimizing portfolio: {e}")
        raise BusinessLogicException("f"Failed to optimize portfolio: {str(e")}")

@router.get("/portfolio-metrics", response_model=PortfolioMetricsResponse)
async def get_portfolio_metrics():
    """
    Get comprehensive portfolio metrics and risk analysis
    """
    try:
        engine = get_kelly_engine()
        metrics = await engine.get_portfolio_metrics()
        
        return ResponseBuilder.success(PortfolioMetricsResponse(
            total_bankroll=metrics.total_bankroll,
            allocated_capital=metrics.allocated_capital,
            available_capital=metrics.available_capital,
            expected_return=metrics.expected_return,
            portfolio_variance=metrics.portfolio_variance,
            sharpe_ratio=metrics.sharpe_ratio,
            max_drawdown=metrics.max_drawdown,
            kelly_leverage=metrics.kelly_leverage,
            correlation_risk=metrics.correlation_risk,
            diversification_score=metrics.diversification_score,
            risk_adjusted_kelly=metrics.risk_adjusted_kelly
        ))
        
    except Exception as e:
        logger.error(f"Error getting portfolio metrics: {e}")
        raise BusinessLogicException("f"Failed to get portfolio metrics: {str(e")}")

@router.get("/risk-management", response_model=RiskManagementResponse)
async def get_risk_management_status():
    """
    Get current risk management settings and portfolio status
    """
    try:
        engine = get_kelly_engine()
        
        # Get current settings
        settings = engine.risk_settings
        settings_dict = {
            "max_bet_percentage": settings.max_bet_percentage,
            "max_daily_risk": settings.max_daily_risk,
            "max_total_exposure": settings.max_total_exposure,
            "min_edge_threshold": settings.min_edge_threshold,
            "min_confidence_threshold": settings.min_confidence_threshold,
            "kelly_fraction_cap": settings.kelly_fraction_cap,
            "drawdown_stop_loss": settings.drawdown_stop_loss,
            "correlation_limit": settings.correlation_limit,
            "volatility_adjustment": settings.volatility_adjustment,
            "dynamic_sizing": settings.dynamic_sizing
        }
        
        # Get portfolio status
        portfolio_status = {
            "current_bankroll": engine.current_bankroll,
            "initial_bankroll": engine.initial_bankroll,
            "active_bets": len(engine.active_bets),
            "total_exposure": engine._calculate_total_exposure(),
            "daily_exposure": engine._calculate_daily_exposure(),
            "max_drawdown": engine._calculate_max_drawdown(),
            "performance_factor": engine._get_performance_adjustment()
        }
        
        # Check for risk alerts
        risk_alerts = []
        
        if portfolio_status["total_exposure"] > settings.max_total_exposure:
            risk_alerts.append(f"Portfolio exposure ({portfolio_status['total_exposure']:.1%}) exceeds limit ({settings.max_total_exposure:.1%})")
        
        if portfolio_status["daily_exposure"] > settings.max_daily_risk:
            risk_alerts.append(f"Daily exposure ({portfolio_status['daily_exposure']:.1%}) exceeds limit ({settings.max_daily_risk:.1%})")
        
        if portfolio_status["max_drawdown"] > settings.drawdown_stop_loss:
            risk_alerts.append(f"Maximum drawdown ({portfolio_status['max_drawdown']:.1%}) exceeds stop-loss ({settings.drawdown_stop_loss:.1%})")
        
        return ResponseBuilder.success(RiskManagementResponse(
            current_settings=settings_dict,
            portfolio_status=portfolio_status,
            risk_alerts=risk_alerts
        ))
        
    except Exception as e:
        logger.error(f"Error getting risk management status: {e}")
        raise BusinessLogicException("f"Failed to get risk management status: {str(e")}")

@router.post("/risk-management/update", response_model=StandardAPIResponse[Dict[str, Any]])
async def update_risk_management(
    settings: RiskManagementRequest
):
    """
    Update risk management settings
    """
    try:
        engine = get_kelly_engine()
        current_settings = engine.risk_settings
        
        # Update non-null values
        if settings.max_bet_percentage is not None:
            current_settings.max_bet_percentage = settings.max_bet_percentage
        if settings.max_daily_risk is not None:
            current_settings.max_daily_risk = settings.max_daily_risk
        if settings.max_total_exposure is not None:
            current_settings.max_total_exposure = settings.max_total_exposure
        if settings.min_edge_threshold is not None:
            current_settings.min_edge_threshold = settings.min_edge_threshold
        if settings.min_confidence_threshold is not None:
            current_settings.min_confidence_threshold = settings.min_confidence_threshold
        if settings.kelly_fraction_cap is not None:
            current_settings.kelly_fraction_cap = settings.kelly_fraction_cap
        if settings.drawdown_stop_loss is not None:
            current_settings.drawdown_stop_loss = settings.drawdown_stop_loss
        if settings.correlation_limit is not None:
            current_settings.correlation_limit = settings.correlation_limit
        if settings.volatility_adjustment is not None:
            current_settings.volatility_adjustment = settings.volatility_adjustment
        if settings.dynamic_sizing is not None:
            current_settings.dynamic_sizing = settings.dynamic_sizing
        
        logger.info("Risk management settings updated")
        
        return ResponseBuilder.success({
            "message": "Risk management settings updated successfully",
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error updating risk management settings: {e}")
        raise BusinessLogicException("f"Failed to update settings: {str(e")}")

@router.post("/bankroll/update", response_model=StandardAPIResponse[Dict[str, Any]])
async def update_bankroll(
    request: BankrollUpdateRequest
):
    """
    Update current bankroll amount
    """
    try:
        engine = get_kelly_engine()
        old_bankroll = engine.current_bankroll
        engine.current_bankroll = request.new_bankroll
        
        # Log the update
        log_entry = {
            'timestamp': datetime.now().isoformat(),
            'action': 'bankroll_update',
            'old_bankroll': old_bankroll,
            'new_bankroll': request.new_bankroll,
            'reason': request.reason or 'Manual update',
            'change': request.new_bankroll - old_bankroll
        }
        engine.betting_history.append(log_entry)
        
        logger.info(f"Bankroll updated from ${old_bankroll:.2f} to ${request.new_bankroll:.2f}")
        
        return ResponseBuilder.success({
            "message": "Bankroll updated successfully",
            "old_bankroll": old_bankroll,
            "new_bankroll": request.new_bankroll,
            "change": request.new_bankroll - old_bankroll,
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error updating bankroll: {e}")
        raise BusinessLogicException("f"Failed to update bankroll: {str(e")}")

@router.get("/bankroll/history", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_bankroll_history(
    days: int = Query(30, description="Number of days of history to return")
):
    """
    Get bankroll history and performance over time
    """
    try:
        engine = get_kelly_engine()
        
        # Get recent history
        cutoff_date = datetime.now() - datetime.timedelta(days=days)
        recent_history = [
            entry for entry in engine.betting_history
            if datetime.fromisoformat(entry['timestamp']) >= cutoff_date
        ]
        
        # Calculate bankroll progression
        bankroll_progression = []
        current_bankroll = engine.initial_bankroll
        
        for entry in recent_history:
            if entry.get('action') == 'bankroll_update':
                current_bankroll = entry['new_bankroll']
            elif entry.get('result') == 'win':
                current_bankroll += entry.get('profit', 0)
            elif entry.get('result') == 'loss':
                current_bankroll -= entry.get('amount', 0)
            
            bankroll_progression.append({
                'timestamp': entry['timestamp'],
                'bankroll': current_bankroll,
                'action': entry.get('action', 'bet'),
                'change': entry.get('change', entry.get('profit', -entry.get('amount', 0)))
            })
        
        # Calculate summary statistics
        if bankroll_progression:
            starting_bankroll = bankroll_progression[0]['bankroll']
            ending_bankroll = bankroll_progression[-1]['bankroll']
            total_return = (ending_bankroll - starting_bankroll) / starting_bankroll
            
            # Calculate max drawdown
            peak = starting_bankroll
            max_dd = 0
            for point in bankroll_progression:
                if point['bankroll'] > peak:
                    peak = point['bankroll']
                drawdown = (peak - point['bankroll']) / peak
                max_dd = max(max_dd, drawdown)
        else:
            starting_bankroll = engine.initial_bankroll
            ending_bankroll = engine.current_bankroll
            total_return = 0
            max_dd = 0
        
        return ResponseBuilder.success({
            "history": bankroll_progression,
            "summary": {
                "starting_bankroll": starting_bankroll,
                "ending_bankroll": ending_bankroll,
                "total_return": total_return,
                "max_drawdown": max_dd,
                "days": days,
                "total_bets": len([e for e in recent_history if e.get('action') == 'bet'])
            })
        }
        
    except Exception as e:
        logger.error(f"Error getting bankroll history: {e}")
        raise BusinessLogicException("f"Failed to get bankroll history: {str(e")}")

@router.get("/simulation", response_model=StandardAPIResponse[Dict[str, Any]])
async def run_kelly_simulation(
    probability: float = Query(..., ge=0.01, le=0.99, description="Win probability"),
    odds: float = Query(..., gt=1.0, description="Decimal odds"),
    num_bets: int = Query(1000, ge=100, le=10000, description="Number of bets to simulate"),
    variant: str = Query("adaptive", description="Kelly variant to use")
):
    """
    Run Monte Carlo simulation of Kelly betting strategy
    """
    try:
        import numpy as np
        
        # Validate variant
        try:
            kelly_variant = KellyVariant(variant.lower())
        except ValueError:
            raise BusinessLogicException("f"Invalid Kelly variant: {variant}")
        
        engine = get_kelly_engine()
        
        # Create a mock betting opportunity
        mock_opportunity = BettingOpportunity(
            opportunity_id="simulation",
            description="Monte Carlo Simulation",
            sport="simulation",
            market_type=BetType.MONEYLINE,
            offered_odds=odds,
            true_probability=probability,
            confidence_interval=(probability * 0.9, probability * 1.1),
            max_bet_limit=float('inf'),
            sportsbook="simulation",
            expires_at=datetime.now() + datetime.timedelta(hours=1)
        )
        
        # Calculate Kelly fraction
        kelly_result = await engine.calculate_optimal_bet_size(mock_opportunity, kelly_variant)
        kelly_fraction = kelly_result.recommended_fraction
        
        # Run simulation
        np.random.seed(42)  # For reproducible results
        
        bankroll_history = [1.0]  # Start with normalized bankroll of 1
        current_bankroll = 1.0
        
        for i in range(num_bets):
            # Bet size based on Kelly fraction
            bet_size = kelly_fraction * current_bankroll
            
            # Simulate bet outcome
            if np.random.random() < probability:
                # Win
                profit = bet_size * (odds - 1)
                current_bankroll += profit
            else:
                # Loss
                current_bankroll -= bet_size
            
            # Prevent bankruptcy (in practice, would stop betting)
            if current_bankroll <= 0:
                current_bankroll = 0.01
            
            bankroll_history.append(current_bankroll)
        
        # Calculate statistics
        final_bankroll = bankroll_history[-1]
        max_bankroll = max(bankroll_history)
        min_bankroll = min(bankroll_history)
        max_drawdown = (max_bankroll - min_bankroll) / max_bankroll
        
        # Calculate average growth rate
        if len(bankroll_history) > 1:
            growth_rate = (final_bankroll / bankroll_history[0]) ** (1 / num_bets) - 1
        else:
            growth_rate = 0
        
        return ResponseBuilder.success({
            "simulation_parameters": {
                "probability": probability,
                "odds": odds,
                "num_bets": num_bets,
                "kelly_variant": variant,
                "kelly_fraction": kelly_fraction
            }),
            "results": {
                "final_bankroll": final_bankroll,
                "total_return": final_bankroll - 1.0,
                "max_bankroll": max_bankroll,
                "min_bankroll": min_bankroll,
                "max_drawdown": max_drawdown,
                "average_growth_rate": growth_rate,
                "expected_growth_rate": kelly_result.expected_growth_rate
            },
            "bankroll_history": bankroll_history[::max(1, len(bankroll_history) // 100)]  # Sample for plotting
        }
        
    except Exception as e:
        logger.error(f"Error running Kelly simulation: {e}")
        raise BusinessLogicException("f"Failed to run simulation: {str(e")}")

@router.get("/status", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_kelly_engine_status():
    """
    Get current status and configuration of the Kelly engine
    """
    try:
        engine = get_kelly_engine()
        
        return ResponseBuilder.success({
            "engine_status": "active",
            "current_bankroll": engine.current_bankroll,
            "initial_bankroll": engine.initial_bankroll,
            "total_bets_placed": len(engine.betting_history),
            "active_opportunities": len(engine.active_bets),
            "risk_settings": {
                "max_bet_percentage": engine.risk_settings.max_bet_percentage,
                "max_daily_risk": engine.risk_settings.max_daily_risk,
                "max_total_exposure": engine.risk_settings.max_total_exposure,
                "kelly_fraction_cap": engine.risk_settings.kelly_fraction_cap
            }),
            "performance_metrics": {
                "volatility_estimate": engine.volatility_estimate,
                "confidence_factor": engine.confidence_factor,
                "drawdown_factor": engine.drawdown_factor,
                "performance_adjustment": engine._get_performance_adjustment()
            },
            "last_updated": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting Kelly engine status: {e}")
        raise BusinessLogicException("f"Failed to get engine status: {str(e")}")
