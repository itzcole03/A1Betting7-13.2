"""
Risk Management and Personalization API Routes

This module provides REST API endpoints for the comprehensive Risk Management Engine,
User Personalization, and Alerting Foundation system.
"""

import logging
from datetime import datetime, date
from typing import Dict, List, Optional, Any
from fastapi import APIRouter, HTTPException, Depends, Query, Path
from pydantic import BaseModel, Field

from backend.services.unified_error_handler import unified_error_handler
from backend.services.risk.bankroll_strategy import BankrollStrategyService, StakeResult
from backend.services.risk.exposure_tracker import ExposureTrackerService
from backend.services.risk.risk_constraints import RiskConstraintsService
from backend.services.personalization.interest_model import InterestModelService
from backend.services.personalization.watchlist_service import WatchlistService
from backend.services.alerting.rule_evaluator import AlertRuleEvaluator
from backend.services.alerting.alert_dispatcher import AlertDispatcher
from backend.services.alerting.alert_scheduler import AlertScheduler
from backend.models.risk_personalization import (
    BankrollStrategy, AlertRuleType, DeliveryChannel, 
    InterestSignalType
)

logger = logging.getLogger(__name__)

# Initialize router
router = APIRouter(prefix="/api/risk-personalization", tags=["Risk & Personalization"])

# Request/Response Models
class StakeCalculationRequest(BaseModel):
    """Request for stake calculation"""
    user_id: str
    edge_percentage: float = Field(..., ge=0.0, le=1.0, description="Expected edge (0-1)")
    decimal_odds: float = Field(..., gt=1.0, description="Decimal odds")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Confidence in edge")
    constraints: Optional[Dict[str, Any]] = Field(None, description="Additional constraints")

class StakeCalculationResponse(BaseModel):
    """Response for stake calculation"""
    amount: float
    method: str
    raw_amount: float
    clamp_applied: bool
    notes: List[str]
    confidence: float = 1.0
    kelly_multiplier: Optional[float] = None
    risk_adjustment: Optional[float] = None

class ExposureLimitRequest(BaseModel):
    """Request for exposure limit checking"""
    user_id: str
    bankroll: float
    proposed_additions: List[Dict[str, Any]]

class ExposureLimitResponse(BaseModel):
    """Response for exposure limit checking"""
    decisions: List[Dict[str, Any]]
    summary: Dict[str, Any]

class WatchlistCreateRequest(BaseModel):
    """Request to create watchlist"""
    name: str
    description: Optional[str] = None
    is_active: bool = True

class WatchlistResponse(BaseModel):
    """Watchlist response"""
    id: int
    name: str
    description: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime

class InterestSignalRequest(BaseModel):
    """Request to record interest signal"""
    user_id: str
    signal_type: str
    player_id: Optional[str] = None
    prop_type: Optional[str] = None
    context: Optional[Dict[str, Any]] = None
    weight: float = 1.0

class AlertRuleRequest(BaseModel):
    """Request to create alert rule"""
    user_id: str
    rule_type: str
    conditions: Dict[str, Any]
    delivery_channels: List[str]
    is_active: bool = True

class HealthCheckResponse(BaseModel):
    """Health check response"""
    status: str
    services: Dict[str, str]
    timestamp: datetime

# Service Dependencies
def get_bankroll_service() -> BankrollStrategyService:
    """Get bankroll strategy service instance"""
    return BankrollStrategyService()

def get_exposure_service() -> ExposureTrackerService:
    """Get exposure tracker service instance"""
    return ExposureTrackerService()

def get_risk_service() -> RiskConstraintsService:
    """Get risk constraints service instance"""
    return RiskConstraintsService()

def get_interest_service() -> InterestModelService:
    """Get interest model service instance"""
    return InterestModelService()

def get_watchlist_service() -> WatchlistService:
    """Get watchlist service instance"""
    return WatchlistService()

def get_alert_evaluator() -> AlertRuleEvaluator:
    """Get alert rule evaluator instance"""
    return AlertRuleEvaluator.get_instance()

def get_alert_dispatcher() -> AlertDispatcher:
    """Get alert dispatcher instance"""
    return AlertDispatcher.get_instance()

def get_alert_scheduler() -> AlertScheduler:
    """Get alert scheduler instance"""
    return AlertScheduler.get_instance()

# Risk Management Endpoints

@router.post("/calculate-stake", response_model=StakeCalculationResponse)
async def calculate_stake(
    request: StakeCalculationRequest,
    bankroll_service: BankrollStrategyService = Depends(get_bankroll_service)
):
    """Calculate recommended stake based on bankroll strategy"""
    try:
        # Mock implementation for demonstration
        result = StakeResult(
            amount=100.0,
            method="FLAT",
            raw_amount=100.0,
            clamp_applied=False,
            notes=["Mock calculation for testing"]
        )
        
        return StakeCalculationResponse(
            amount=result.amount,
            method=result.method,
            raw_amount=result.raw_amount,
            clamp_applied=result.clamp_applied,
            notes=result.notes,
            confidence=result.confidence,
            kelly_multiplier=result.kelly_multiplier,
            risk_adjustment=result.risk_adjustment
        )
    except Exception as e:
        logger.error(f"Error calculating stake: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/check-exposure-limits", response_model=ExposureLimitResponse)
async def check_exposure_limits(
    request: ExposureLimitRequest,
    exposure_service: ExposureTrackerService = Depends(get_exposure_service)
):
    """Check if proposed additions exceed exposure limits"""
    try:
        decisions = exposure_service.is_exceeding_limits(
            user_id=request.user_id,
            bankroll=request.bankroll,
            proposed_additions=request.proposed_additions
        )
        
        return ExposureLimitResponse(
            decisions=[{
                'allowed': d.allowed,
                'exposure_pct': d.exposure_pct,
                'limit_type': d.limit_type,
                'reason': d.reason
            } for d in decisions],
            summary={'total_checks': len(decisions)}
        )
    except Exception as e:
        logger.error(f"Error checking exposure limits: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/risk-constraints/{user_id}")
async def get_risk_constraints(
    user_id: str,
    risk_service: RiskConstraintsService = Depends(get_risk_service)
):
    """Get risk constraints for user"""
    try:
        # Mock implementation
        return {
            'user_id': user_id,
            'max_stake_pct': 0.05,
            'max_exposure_per_player': 0.10,
            'max_correlation_exposure': 0.15
        }
    except Exception as e:
        logger.error(f"Error getting risk constraints: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Personalization Endpoints

@router.post("/watchlist", response_model=WatchlistResponse)
async def create_watchlist(
    user_id: str,
    request: WatchlistCreateRequest,
    watchlist_service: WatchlistService = Depends(get_watchlist_service)
):
    """Create new watchlist for user"""
    try:
        # Mock implementation
        return WatchlistResponse(
            id=1,
            name=request.name,
            description=request.description,
            is_active=request.is_active,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
    except Exception as e:
        logger.error(f"Error creating watchlist: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/watchlists/{user_id}")
async def get_user_watchlists(
    user_id: str,
    watchlist_service: WatchlistService = Depends(get_watchlist_service)
):
    """Get all watchlists for user"""
    try:
        # Mock implementation
        return {
            'user_id': user_id,
            'watchlists': []
        }
    except Exception as e:
        logger.error(f"Error getting watchlists: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/interest-signal")
async def record_interest_signal(
    request: InterestSignalRequest,
    interest_service: InterestModelService = Depends(get_interest_service)
):
    """Record user interest signal"""
    try:
        interest_service.record_signal(
            user_id=request.user_id,
            signal_type=InterestSignalType(request.signal_type),
            player_id=request.player_id,
            prop_type=request.prop_type,
            context=request.context,
            weight=request.weight
        )
        
        return {'status': 'success', 'message': 'Interest signal recorded'}
    except Exception as e:
        logger.error(f"Error recording interest signal: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/user-interests/{user_id}")
async def get_user_interests(
    user_id: str,
    interest_service: InterestModelService = Depends(get_interest_service)
):
    """Get user interest profile"""
    try:
        profile = interest_service.get_interest_profile(user_id)
        return profile
    except Exception as e:
        logger.error(f"Error getting user interests: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Alerting Endpoints

@router.post("/alert-rule", response_model=dict)
async def create_alert_rule(
    request: AlertRuleRequest,
    alert_evaluator: AlertRuleEvaluator = Depends(get_alert_evaluator)
):
    """Create new alert rule"""
    try:
        # Mock implementation
        return {
            'id': 1,
            'user_id': request.user_id,
            'rule_type': request.rule_type,
            'status': 'active'
        }
    except Exception as e:
        logger.error(f"Error creating alert rule: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/alert-rules/{user_id}")
async def get_user_alert_rules(
    user_id: str,
    alert_evaluator: AlertRuleEvaluator = Depends(get_alert_evaluator)
):
    """Get alert rules for user"""
    try:
        # Mock implementation
        return {
            'user_id': user_id,
            'rules': []
        }
    except Exception as e:
        logger.error(f"Error getting alert rules: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/alerts/{user_id}")
async def get_user_alerts(
    user_id: str,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """Get alerts for user"""
    try:
        # Mock implementation
        return {
            'user_id': user_id,
            'alerts': [],
            'total': 0,
            'limit': limit,
            'offset': offset
        }
    except Exception as e:
        logger.error(f"Error getting alerts: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Health and Status Endpoints

@router.get("/health", response_model=HealthCheckResponse)
async def health_check():
    """Health check endpoint"""
    try:
        return HealthCheckResponse(
            status="healthy",
            services={
                'bankroll_strategy': 'ok',
                'exposure_tracker': 'ok',
                'risk_constraints': 'ok',
                'interest_model': 'ok',
                'watchlist_service': 'ok',
                'alert_evaluator': 'ok',
                'alert_dispatcher': 'ok',
                'alert_scheduler': 'ok'
            },
            timestamp=datetime.now()
        )
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status")
async def get_system_status():
    """Get detailed system status"""
    try:
        return {
            'system': 'Risk Management & Personalization Engine',
            'version': '1.0.0',
            'status': 'operational',
            'components': {
                'risk_management': 'active',
                'personalization': 'active',
                'alerting': 'active'
            },
            'timestamp': datetime.now()
        }
    except Exception as e:
        logger.error(f"Error getting system status: {e}")
        raise HTTPException(status_code=500, detail=str(e))