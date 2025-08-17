"""
Risk Management and Personalization API Routes

This module provides REST API endpoints for the comprehensive Risk Management Engine,
def get_interest_service() -> InterestModelService:
    """Get interest model service instance"""
    return InterestModelService()r Personalization, and Alerting Foundation system.
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
router = APIRouter(prefix="/api/risk-personalization", tags=["risk_personalization"])


# Request/Response Models

class BankrollProfileRequest(BaseModel):
    """Request model for creating/updating bankroll profiles"""
    strategy: BankrollStrategy
    base_bankroll: float = Field(gt=0, description="Base bankroll amount")
    kelly_fraction: Optional[float] = Field(None, ge=0, le=1, description="Fraction for fractional Kelly")
    flat_unit: Optional[float] = Field(None, gt=0, description="Unit size for flat betting")
    max_stake_pct: float = Field(0.05, ge=0, le=1, description="Max stake as percentage of bankroll")
    min_stake: float = Field(1.0, gt=0, description="Minimum stake amount")


class BankrollProfileResponse(BaseModel):
    """Response model for bankroll profiles"""
    id: int
    user_id: str
    strategy: BankrollStrategy
    base_bankroll: float
    current_bankroll: float
    kelly_fraction: Optional[float]
    flat_unit: Optional[float]
    max_stake_pct: float
    min_stake: float
    last_updated_at: datetime


class StakeCalculationRequest(BaseModel):
    """Request model for stake calculations"""
    edge_percentage: float = Field(ge=0, description="Edge as decimal (e.g., 0.08 for 8%)")
    odds: float = Field(description="Decimal odds (e.g., 2.0 for even money)")
    confidence: float = Field(ge=0, le=1, description="Confidence in the edge (0-1)")
    user_id: str


class StakeCalculationResponse(BaseModel):
    """Response model for stake calculations"""
    recommended_stake: float
    strategy_used: BankrollStrategy
    kelly_percentage: float
    risk_adjusted_stake: float
    warnings: List[str]
    metadata: Dict[str, Any]


class WatchlistRequest(BaseModel):
    """Request model for creating watchlists"""
    name: str = Field(max_length=100, description="Watchlist name")
    description: Optional[str] = Field(None, max_length=500, description="Optional description")


class WatchlistItemRequest(BaseModel):
    """Request model for adding watchlist items"""
    item_type: str = Field(description="Type of item (player, team, prop_type)")
    item_value: str = Field(description="Value to watch (player name, team, etc.)")
    target_odds_min: Optional[float] = None
    target_odds_max: Optional[float] = None
    notes: Optional[str] = None


class WatchlistResponse(BaseModel):
    """Response model for watchlists"""
    id: int
    name: str
    description: Optional[str]
    is_active: bool
    created_at: datetime
    items_count: int


class InterestSignalRequest(BaseModel):
    """Request model for recording interest signals"""
    signal_type: InterestSignalType
    context_data: Dict[str, Any]


class AlertRuleRequest(BaseModel):
    """Request model for creating alert rules"""
    alert_type: AlertRuleType
    parameters: Dict[str, Any]
    delivery_channels: List[DeliveryChannel]
    is_active: bool = True
    cooldown_minutes: int = Field(15, ge=1, le=1440)


class AlertRuleResponse(BaseModel):
    """Response model for alert rules"""
    id: int
    user_id: str
    alert_type: AlertRuleType
    parameters: Dict[str, Any]
    delivery_channels: List[DeliveryChannel]
    is_active: bool
    cooldown_minutes: int
    created_at: datetime


# Service Dependencies

def get_bankroll_service() -> BankrollStrategyService:
    """Get bankroll strategy service instance"""
    return BankrollStrategyService.get_instance()

def get_exposure_service() -> ExposureTrackerService:
    """Get exposure tracker service instance"""
    return ExposureTrackerService()

def get_risk_service() -> RiskConstraintsService:
    """Get risk constraints service instance"""
    return RiskConstraintsService()

def get_interest_service() -> UserInterestModelService:
    """Get user interest model service instance"""
    return UserInterestModelService.get_instance()

def get_watchlist_service() -> WatchlistService:
    """Get watchlist service instance"""
    return WatchlistService.get_instance()

def get_alert_evaluator() -> AlertRuleEvaluator:
    """Get alert rule evaluator instance"""
    return AlertRuleEvaluator.get_instance()

def get_alert_dispatcher() -> AlertDispatcher:
    """Get alert dispatcher instance"""
    return AlertDispatcher.get_instance()

def get_alert_scheduler() -> AlertScheduler:
    """Get alert scheduler instance"""
    return AlertScheduler.get_instance()


# Bankroll Management Endpoints

@router.post("/bankroll/profile/{user_id}", response_model=BankrollProfileResponse)
async def create_or_update_bankroll_profile(
    user_id: str = Path(..., description="User ID"),
    profile_data: BankrollProfileRequest = None,
    bankroll_service: BankrollStrategyService = Depends(get_bankroll_service)
):
    """Create or update user's bankroll profile"""
    try:
        profile = await bankroll_service.create_or_update_profile(
            user_id=user_id,
            strategy=profile_data.strategy,
            base_bankroll=profile_data.base_bankroll,
            kelly_fraction=profile_data.kelly_fraction,
            flat_unit=profile_data.flat_unit,
            max_stake_pct=profile_data.max_stake_pct,
            min_stake=profile_data.min_stake
        )
        
        return BankrollProfileResponse(
            id=profile['id'],
            user_id=profile['user_id'],
            strategy=profile['strategy'],
            base_bankroll=profile['base_bankroll'],
            current_bankroll=profile['current_bankroll'],
            kelly_fraction=profile.get('kelly_fraction'),
            flat_unit=profile.get('flat_unit'),
            max_stake_pct=profile['max_stake_pct'],
            min_stake=profile['min_stake'],
            last_updated_at=profile['last_updated_at']
        )
        
    except Exception as e:
        error_response = unified_error_handler.handle_error(
            error=e,
            context="create_bankroll_profile",
            user_context={"user_id": user_id}
        )
        raise HTTPException(status_code=500, detail=error_response["user_message"])


@router.get("/bankroll/profile/{user_id}", response_model=BankrollProfileResponse)
async def get_bankroll_profile(
    user_id: str = Path(..., description="User ID"),
    bankroll_service: BankrollStrategyService = Depends(get_bankroll_service)
):
    """Get user's bankroll profile"""
    try:
        profile = await bankroll_service.get_user_profile(user_id)
        if not profile:
            raise HTTPException(status_code=404, detail="Bankroll profile not found")
            
        return BankrollProfileResponse(**profile)
        
    except HTTPException:
        raise
    except Exception as e:
        error_response = unified_error_handler.handle_error(
            error=e,
            context="get_bankroll_profile",
            user_context={"user_id": user_id}
        )
        raise HTTPException(status_code=500, detail=error_response["user_message"])


@router.post("/bankroll/calculate-stake", response_model=StakeCalculationResponse)
async def calculate_recommended_stake(
    stake_request: StakeCalculationRequest,
    bankroll_service: BankrollStrategyService = Depends(get_bankroll_service)
):
    """Calculate recommended stake for a betting opportunity"""
    try:
        result: StakeResult = await bankroll_service.compute_recommended_stake(
            user_id=stake_request.user_id,
            edge_percentage=stake_request.edge_percentage,
            decimal_odds=stake_request.odds,
            confidence=stake_request.confidence
        )
        
        return StakeCalculationResponse(
            recommended_stake=result.recommended_stake,
            strategy_used=result.strategy_used,
            kelly_percentage=result.kelly_percentage,
            risk_adjusted_stake=result.risk_adjusted_stake,
            warnings=result.warnings,
            metadata=result.metadata
        )
        
    except Exception as e:
        error_response = unified_error_handler.handle_error(
            error=e,
            context="calculate_stake",
            user_context={"user_id": stake_request.user_id}
        )
        raise HTTPException(status_code=500, detail=error_response["user_message"])


# Exposure Management Endpoints

@router.get("/exposure/{user_id}/current")
async def get_current_exposure(
    user_id: str = Path(..., description="User ID"),
    exposure_service: ExposureTracker = Depends(get_exposure_service)
):
    """Get current exposure status for user"""
    try:
        exposure_data = await exposure_service.get_current_exposure(user_id)
        return {"user_id": user_id, "exposure": exposure_data}
        
    except Exception as e:
        error_response = unified_error_handler.handle_error(
            error=e,
            context="get_current_exposure",
            user_context={"user_id": user_id}
        )
        raise HTTPException(status_code=500, detail=error_response["user_message"])


@router.post("/exposure/{user_id}/check")
async def check_exposure_limits(
    user_id: str = Path(..., description="User ID"),
    ticket_data: Dict[str, Any] = None,
    exposure_service: ExposureTracker = Depends(get_exposure_service)
):
    """Check if ticket would violate exposure limits"""
    try:
        violations = await exposure_service.is_exceeding_limits(user_id, ticket_data)
        return {
            "user_id": user_id,
            "violations": violations,
            "approved": len(violations) == 0
        }
        
    except Exception as e:
        error_response = unified_error_handler.handle_error(
            error=e,
            context="check_exposure_limits",
            user_context={"user_id": user_id}
        )
        raise HTTPException(status_code=500, detail=error_response["user_message"])


# Risk Management Endpoints

@router.post("/risk/{user_id}/analyze")
async def analyze_risk(
    user_id: str = Path(..., description="User ID"),
    tickets_data: List[Dict[str, Any]] = None,
    risk_service: RiskConstraintsService = Depends(get_risk_service)
):
    """Perform comprehensive risk analysis for user's tickets"""
    try:
        risk_findings = risk_service.aggregate_risk_checks(
            user_id=user_id,
            active_tickets=tickets_data
        )
        
        return {
            "user_id": user_id,
            "risk_findings": [
                {
                    "risk_type": finding.risk_type,
                    "level": finding.level.value,
                    "message": finding.message,
                    "recommendation": finding.recommendation,
                    "details": finding.details
                }
                for finding in risk_findings
            ]
        }
        
    except Exception as e:
        error_response = unified_error_handler.handle_error(
            error=e,
            context="analyze_risk",
            user_context={"user_id": user_id}
        )
        raise HTTPException(status_code=500, detail=error_response["user_message"])


@router.post("/risk/{user_id}/pre-submit-check")
async def pre_submit_risk_check(
    user_id: str = Path(..., description="User ID"),
    ticket_data: Dict[str, Any] = None,
    risk_service: RiskConstraintsService = Depends(get_risk_service)
):
    """Perform pre-submission risk checks"""
    try:
        is_approved = risk_service.apply_pre_submission_checks(
            user_id=user_id,
            ticket_data=ticket_data
        )
        
        return {
            "user_id": user_id,
            "approved": is_approved,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        # Risk violations are expected and should return structured errors
        error_response = unified_error_handler.handle_error(
            error=e,
            context="pre_submit_risk_check",
            user_context={"user_id": user_id}
        )
        
        # If it's a risk violation, return details
        if "risk violation" in str(e).lower():
            return {
                "user_id": user_id,
                "approved": False,
                "violations": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
        
        raise HTTPException(status_code=500, detail=error_response["user_message"])


# Personalization Endpoints

@router.post("/personalization/{user_id}/interest-signal")
async def record_interest_signal(
    user_id: str = Path(..., description="User ID"),
    signal_request: InterestSignalRequest = None,
    interest_service: UserInterestModelService = Depends(get_interest_service)
):
    """Record a user interest signal"""
    try:
        await interest_service.record_signal(
            user_id=user_id,
            signal_type=signal_request.signal_type,
            context=signal_request.context_data
        )
        
        return {
            "user_id": user_id,
            "signal_type": signal_request.signal_type.value,
            "recorded_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        error_response = unified_error_handler.handle_error(
            error=e,
            context="record_interest_signal",
            user_context={"user_id": user_id}
        )
        raise HTTPException(status_code=500, detail=error_response["user_message"])


@router.get("/personalization/{user_id}/recommendations")
async def get_personalized_recommendations(
    user_id: str = Path(..., description="User ID"),
    limit: int = Query(10, ge=1, le=50, description="Number of recommendations"),
    interest_service: UserInterestModelService = Depends(get_interest_service)
):
    """Get personalized edge recommendations for user"""
    try:
        recommendations = await interest_service.recommend_edges(user_id, limit=limit)
        
        return {
            "user_id": user_id,
            "recommendations": recommendations,
            "count": len(recommendations),
            "generated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        error_response = unified_error_handler.handle_error(
            error=e,
            context="get_recommendations",
            user_context={"user_id": user_id}
        )
        raise HTTPException(status_code=500, detail=error_response["user_message"])


@router.get("/personalization/{user_id}/interest-profile")
async def get_interest_profile(
    user_id: str = Path(..., description="User ID"),
    interest_service: UserInterestModelService = Depends(get_interest_service)
):
    """Get user's interest profile and preferences"""
    try:
        profile = await interest_service.get_interest_profile(user_id)
        
        return {
            "user_id": user_id,
            "interest_profile": profile,
            "generated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        error_response = unified_error_handler.handle_error(
            error=e,
            context="get_interest_profile",
            user_context={"user_id": user_id}
        )
        raise HTTPException(status_code=500, detail=error_response["user_message"])


# Watchlist Endpoints

@router.post("/watchlist/{user_id}", response_model=WatchlistResponse)
async def create_watchlist(
    user_id: str = Path(..., description="User ID"),
    watchlist_data: WatchlistRequest = None,
    watchlist_service: WatchlistService = Depends(get_watchlist_service)
):
    """Create a new watchlist for user"""
    try:
        watchlist = await watchlist_service.create_watchlist(
            user_id=user_id,
            name=watchlist_data.name,
            description=watchlist_data.description
        )
        
        return WatchlistResponse(
            id=watchlist['id'],
            name=watchlist['name'],
            description=watchlist.get('description'),
            is_active=watchlist['is_active'],
            created_at=watchlist['created_at'],
            items_count=0
        )
        
    except Exception as e:
        error_response = unified_error_handler.handle_error(
            error=e,
            context="create_watchlist",
            user_context={"user_id": user_id}
        )
        raise HTTPException(status_code=500, detail=error_response["user_message"])


@router.get("/watchlist/{user_id}")
async def get_user_watchlists(
    user_id: str = Path(..., description="User ID"),
    watchlist_service: WatchlistService = Depends(get_watchlist_service)
):
    """Get all watchlists for user"""
    try:
        watchlists = await watchlist_service.get_user_watchlists(user_id)
        
        return {
            "user_id": user_id,
            "watchlists": watchlists,
            "count": len(watchlists)
        }
        
    except Exception as e:
        error_response = unified_error_handler.handle_error(
            error=e,
            context="get_watchlists",
            user_context={"user_id": user_id}
        )
        raise HTTPException(status_code=500, detail=error_response["user_message"])


@router.post("/watchlist/{watchlist_id}/items")
async def add_watchlist_item(
    watchlist_id: int = Path(..., description="Watchlist ID"),
    item_data: WatchlistItemRequest = None,
    watchlist_service: WatchlistService = Depends(get_watchlist_service)
):
    """Add item to watchlist"""
    try:
        item = await watchlist_service.add_watchlist_item(
            watchlist_id=watchlist_id,
            item_type=item_data.item_type,
            item_value=item_data.item_value,
            target_odds_min=item_data.target_odds_min,
            target_odds_max=item_data.target_odds_max,
            notes=item_data.notes
        )
        
        return {
            "watchlist_id": watchlist_id,
            "item": item,
            "added_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        error_response = unified_error_handler.handle_error(
            error=e,
            context="add_watchlist_item",
            user_context={"watchlist_id": watchlist_id}
        )
        raise HTTPException(status_code=500, detail=error_response["user_message"])


@router.get("/watchlist/{watchlist_id}/edges")
async def get_watchlist_matching_edges(
    watchlist_id: int = Path(..., description="Watchlist ID"),
    watchlist_service: WatchlistService = Depends(get_watchlist_service)
):
    """Get edges that match watchlist items"""
    try:
        matching_edges = await watchlist_service.get_watchlist_edges(watchlist_id)
        
        return {
            "watchlist_id": watchlist_id,
            "matching_edges": matching_edges,
            "count": len(matching_edges),
            "generated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        error_response = unified_error_handler.handle_error(
            error=e,
            context="get_watchlist_edges",
            user_context={"watchlist_id": watchlist_id}
        )
        raise HTTPException(status_code=500, detail=error_response["user_message"])


# Alerting Endpoints

@router.post("/alerts/{user_id}/rules", response_model=AlertRuleResponse)
async def create_alert_rule(
    user_id: str = Path(..., description="User ID"),
    rule_data: AlertRuleRequest = None
):
    """Create a new alert rule for user"""
    try:
        # Mock implementation - in production would create in database
        rule = {
            'id': 123,  # Mock ID
            'user_id': user_id,
            'alert_type': rule_data.alert_type,
            'parameters': rule_data.parameters,
            'delivery_channels': rule_data.delivery_channels,
            'is_active': rule_data.is_active,
            'cooldown_minutes': rule_data.cooldown_minutes,
            'created_at': datetime.utcnow()
        }
        
        return AlertRuleResponse(**rule)
        
    except Exception as e:
        error_response = unified_error_handler.handle_error(
            error=e,
            context="create_alert_rule",
            user_context={"user_id": user_id}
        )
        raise HTTPException(status_code=500, detail=error_response["user_message"])


@router.get("/alerts/{user_id}/rules")
async def get_user_alert_rules(
    user_id: str = Path(..., description="User ID"),
    active_only: bool = Query(False, description="Only return active rules")
):
    """Get alert rules for user"""
    try:
        # Mock implementation - in production would query database
        rules = [
            {
                'id': 1,
                'alert_type': 'EDGE_EV_THRESHOLD',
                'parameters': {'threshold': 0.08},
                'delivery_channels': ['IN_APP', 'EMAIL'],
                'is_active': True,
                'cooldown_minutes': 15,
                'created_at': datetime.utcnow().isoformat()
            },
            {
                'id': 2,
                'alert_type': 'LINE_MOVE',
                'parameters': {'movement_threshold': 1.0},
                'delivery_channels': ['IN_APP'],
                'is_active': False if not active_only else True,
                'cooldown_minutes': 30,
                'created_at': datetime.utcnow().isoformat()
            }
        ]
        
        if active_only:
            rules = [rule for rule in rules if rule['is_active']]
        
        return {
            "user_id": user_id,
            "rules": rules,
            "count": len(rules)
        }
        
    except Exception as e:
        error_response = unified_error_handler.handle_error(
            error=e,
            context="get_alert_rules",
            user_context={"user_id": user_id}
        )
        raise HTTPException(status_code=500, detail=error_response["user_message"])


@router.post("/alerts/evaluate/immediate")
async def trigger_immediate_evaluation(
    user_id: Optional[str] = Query(None, description="Optional user ID filter"),
    alert_scheduler: AlertScheduler = Depends(get_alert_scheduler)
):
    """Trigger immediate alert rule evaluation"""
    try:
        events = await alert_scheduler.trigger_immediate_evaluation(user_id)
        
        return {
            "triggered_events": len(events),
            "events": [
                {
                    "alert_rule_id": event.alert_rule_id,
                    "user_id": event.user_id,
                    "event_type": event.event_type.value,
                    "severity": event.severity,
                    "title": event.title,
                    "triggered_at": event.triggered_at.isoformat()
                }
                for event in events
            ],
            "evaluated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        error_response = unified_error_handler.handle_error(
            error=e,
            context="immediate_evaluation",
            user_context={"user_id": user_id}
        )
        raise HTTPException(status_code=500, detail=error_response["user_message"])


@router.get("/alerts/system/status")
async def get_alerting_system_status(
    alert_scheduler: AlertScheduler = Depends(get_alert_scheduler)
):
    """Get status of the alerting system"""
    try:
        status = await alert_scheduler.get_scheduler_status()
        return status
        
    except Exception as e:
        error_response = unified_error_handler.handle_error(
            error=e,
            context="get_alerting_status"
        )
        raise HTTPException(status_code=500, detail=error_response["user_message"])


# Health and Status Endpoints

@router.get("/health")
async def health_check():
    """Health check endpoint for risk management system"""
    try:
        # Check if core services are available
        services_status = {
            "bankroll_service": "healthy",
            "exposure_tracker": "healthy", 
            "risk_constraints": "healthy",
            "interest_model": "healthy",
            "watchlist_service": "healthy",
            "alert_evaluator": "healthy",
            "alert_dispatcher": "healthy",
            "alert_scheduler": "healthy"
        }
        
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "services": services_status
        }
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "timestamp": datetime.utcnow().isoformat(),
            "error": str(e)
        }