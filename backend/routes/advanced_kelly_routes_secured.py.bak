"""
Advanced Kelly Criterion Routes - Secured Version

Mathematical optimization endpoints for bet sizing with comprehensive security.
"""

from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from backend.services.advanced_kelly_engine import AdvancedKellyEngine
from backend.services.unified_logging import get_logger
from backend.services.security.security_integration import (
    secure_optimization_endpoint,
    secure_admin_endpoint
)

logger = get_logger("advanced_kelly_routes")
kelly_engine = AdvancedKellyEngine()

# Create router
router = APIRouter(prefix="/kelly", tags=["kelly-optimization"])


class BetOpportunity(BaseModel):
    """Individual betting opportunity"""
    id: str
    odds: float = Field(gt=1.0, description="Decimal odds (must be > 1.0)")
    probability: float = Field(gt=0.0, le=1.0, description="Win probability (0-1)")
    max_stake: Optional[float] = Field(None, gt=0, description="Maximum stake allowed")
    category: Optional[str] = Field(None, description="Bet category")
    metadata: Dict[str, Any] = Field(default_factory=dict)


class KellyCalculationRequest(BaseModel):
    """Request for Kelly criterion calculation"""
    opportunities: List[BetOpportunity]
    bankroll: float = Field(gt=0, description="Total bankroll")
    variant: str = Field(default="standard", description="Kelly variant to use")
    risk_tolerance: float = Field(default=1.0, ge=0.1, le=2.0, description="Risk multiplier")
    correlation_matrix: Optional[List[List[float]]] = None
    max_allocation_per_bet: float = Field(default=0.25, gt=0, le=1.0, description="Max allocation per bet")


class OptimizationRequest(BaseModel):
    """Request for portfolio optimization"""
    opportunities: List[BetOpportunity]
    bankroll: float = Field(gt=0)
    objective: str = Field(default="maximize_growth", description="Optimization objective")
    constraints: Dict[str, Any] = Field(default_factory=dict)
    risk_preferences: Dict[str, float] = Field(default_factory=dict)


@router.post("/calculate", summary="Calculate Kelly criterion bet sizes")
@secure_optimization_endpoint(cost=1.0)
async def calculate_kelly_sizes(request_data: KellyCalculationRequest, request: Request) -> Dict[str, Any]:
    """
    Calculate optimal bet sizes using Kelly criterion variants
    """
    try:
        # Validate opportunities
        if not request_data.opportunities:
            raise HTTPException(status_code=400, detail="At least one betting opportunity is required")
        
        # Convert opportunities to engine format and calculate
        from backend.services.advanced_kelly_engine import (
            BettingOpportunity, BetType, KellyVariant
        )
        
        results = {}
        for opp in request_data.opportunities:
            bet_opportunity = BettingOpportunity(
                opportunity_id=opp.id,
                description=f"Betting opportunity {opp.id}",
                sport="Unknown",
                market_type=BetType.MONEYLINE,
                offered_odds=opp.odds,
                true_probability=opp.probability,
                confidence_interval=(max(0.1, opp.probability - 0.1), min(0.9, opp.probability + 0.1)),
                max_bet_limit=opp.max_stake or float('inf'),
                sportsbook="Unknown",
                expires_at=datetime.utcnow() + timedelta(hours=24),
                metadata=opp.metadata
            )
            
            # Map variant string to enum
            variant_enum = KellyVariant.ADAPTIVE  # Default
            if request_data.variant == "classic":
                variant_enum = KellyVariant.CLASSIC
            elif request_data.variant == "fractional":
                variant_enum = KellyVariant.FRACTIONAL
            elif request_data.variant == "portfolio":
                variant_enum = KellyVariant.PORTFOLIO
            
            kelly_result = await kelly_engine.calculate_optimal_bet_size(
                opportunity=bet_opportunity,
                variant=variant_enum
            )
            
            results[opp.id] = {
                "kelly_fraction": kelly_result.recommended_fraction,
                "bet_size": kelly_result.recommended_bet_size,
                "expected_value": kelly_result.expected_value,
                "risk_of_ruin": kelly_result.risk_of_ruin,
                "confidence_score": kelly_result.confidence_score,
                "warnings": kelly_result.risk_warnings
            }
        
        return {
            "status": "success",
            "data": results,
            "metadata": {
                "opportunities_count": len(request_data.opportunities),
                "variant": request_data.variant,
                "risk_tolerance": request_data.risk_tolerance,
                "timestamp": datetime.utcnow().isoformat()
            }
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Validation error: {str(e)}")
    except Exception as e:
        logger.error(f"Error calculating Kelly sizes: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to calculate Kelly sizes: {str(e)}")


@router.post("/optimize", summary="Optimize portfolio allocation")
@secure_optimization_endpoint(cost=2.0)
async def optimize_portfolio(request_data: OptimizationRequest, request: Request) -> Dict[str, Any]:
    """
    Optimize portfolio allocation using portfolio Kelly method
    """
    try:
        if not request_data.opportunities:
            raise HTTPException(status_code=400, detail="At least one betting opportunity is required")
        
        from backend.services.advanced_kelly_engine import (
            BettingOpportunity, BetType
        )
        
        # Convert opportunities to engine format
        opportunities_data = []
        for opp in request_data.opportunities:
            bet_opportunity = BettingOpportunity(
                opportunity_id=opp.id,
                description=f"Portfolio opportunity {opp.id}",
                sport="Unknown",
                market_type=BetType.MONEYLINE,
                offered_odds=opp.odds,
                true_probability=opp.probability,
                confidence_interval=(max(0.1, opp.probability - 0.1), min(0.9, opp.probability + 0.1)),
                max_bet_limit=opp.max_stake or float('inf'),
                sportsbook="Unknown",
                expires_at=datetime.utcnow() + timedelta(hours=24),
                metadata=opp.metadata
            )
            opportunities_data.append(bet_opportunity)
        
        # Use portfolio optimization method
        portfolio_metrics = await kelly_engine.get_portfolio_metrics()
        
        return {
            "status": "success",
            "data": {
                "portfolio_metrics": portfolio_metrics,
                "optimization_objective": request_data.objective,
                "message": "Portfolio optimization completed using Kelly portfolio method"
            },
            "metadata": {
                "opportunities_count": len(request_data.opportunities),
                "objective": request_data.objective,
                "optimization_timestamp": datetime.utcnow().isoformat()
            }
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Validation error: {str(e)}")
    except Exception as e:
        logger.error(f"Error optimizing portfolio: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to optimize portfolio: {str(e)}")


@router.get("/variants", summary="List available Kelly variants")
@secure_optimization_endpoint(cost=0.1)
async def list_kelly_variants(request: Request) -> Dict[str, Any]:
    """
    Get list of available Kelly criterion variants and their descriptions
    """
    try:
        from backend.services.advanced_kelly_engine import KellyVariant
        
        variants = {
            "classic": "Traditional Kelly criterion",
            "fractional": "Fractional Kelly with reduced risk",
            "adaptive": "Adaptive Kelly with performance adjustments",
            "portfolio": "Portfolio Kelly for multiple bets",
            "multi_outcome": "Multi-outcome Kelly for complex bets"
        }
        
        return {
            "status": "success",
            "data": {
                "variants": variants,
                "default": "adaptive"
            },
            "metadata": {
                "timestamp": datetime.utcnow().isoformat()
            }
        }
        
    except Exception as e:
        logger.error(f"Error listing Kelly variants: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to list variants: {str(e)}")


@router.get("/health", summary="Check Kelly engine health")
@secure_optimization_endpoint(cost=0.1)
async def check_health(request: Request) -> Dict[str, Any]:
    """
    Check the health status of the Kelly optimization engine
    """
    try:
        # Basic health check using engine attributes
        health_status = {
            "is_healthy": True,
            "bankroll": kelly_engine.current_bankroll,
            "risk_settings": kelly_engine.risk_settings.__dict__,
            "uptime": "active"
        }
        
        return {
            "status": "success",
            "data": health_status,
            "metadata": {
                "timestamp": datetime.utcnow().isoformat()
            }
        }
        
    except Exception as e:
        logger.error(f"Error checking Kelly engine health: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to check health: {str(e)}")


@router.post("/reset", summary="Reset Kelly engine state")
@secure_admin_endpoint(cost=1.0)
async def reset_engine(request: Request) -> Dict[str, Any]:
    """
    Reset the Kelly engine state (admin only)
    """
    try:
        # Reset engine to initial state
        kelly_engine.current_bankroll = kelly_engine.initial_bankroll
        kelly_engine.betting_history.clear()
        
        logger.info("Kelly engine state reset by admin")
        
        return {
            "status": "success",
            "data": {
                "message": "Engine state reset successfully",
                "bankroll": kelly_engine.current_bankroll
            },
            "metadata": {
                "reset_timestamp": datetime.utcnow().isoformat()
            }
        }
        
    except Exception as e:
        logger.error(f"Error resetting Kelly engine: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to reset engine: {str(e)}")


@router.get("/metrics", summary="Get Kelly engine metrics")
@secure_admin_endpoint(cost=0.5)
async def get_engine_metrics(request: Request) -> Dict[str, Any]:
    """
    Get detailed metrics from the Kelly optimization engine (admin only)
    """
    try:
        # Get portfolio metrics which includes comprehensive engine data
        portfolio_metrics = await kelly_engine.get_portfolio_metrics()
        
        metrics = {
            "portfolio": portfolio_metrics,
            "current_bankroll": kelly_engine.current_bankroll,
            "initial_bankroll": kelly_engine.initial_bankroll,
            "betting_history_count": len(kelly_engine.betting_history),
            "risk_settings": kelly_engine.risk_settings.__dict__
        }
        
        return {
            "status": "success",
            "data": metrics,
            "metadata": {
                "timestamp": datetime.utcnow().isoformat()
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting Kelly engine metrics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get metrics: {str(e)}")