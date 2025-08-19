"""
Alert Engine API Routes

Provides REST API endpoints for PropFinder-style alert functionality:
- Alert rule management (CRUD operations)
- Alert status and history
- Real-time alert monitoring
- Integration with the alert engine core
"""

import logging
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field

from backend.core.response_models import ResponseBuilder, StandardAPIResponse
from backend.core.exceptions import BusinessLogicException
from backend.services.alert_engine_core import (
    get_alert_engine_core,
    AlertEngineCore,
    AlertRuleType,
    AlertRule,
    AlertTrigger
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Alert Engine"])

# Pydantic models for API

class AlertRuleCreate(BaseModel):
    """Create alert rule request"""
    rule_type: str = Field(..., description="Alert rule type")
    conditions: Dict[str, Any] = Field(..., description="Rule conditions")
    cooldown_minutes: int = Field(default=30, description="Cooldown in minutes")
    priority: str = Field(default='medium', description="Rule priority")
    is_active: bool = Field(default=True, description="Whether rule is active")

class AlertRuleResponse(BaseModel):
    """Alert rule response"""
    rule_id: str
    user_id: int
    rule_type: str
    is_active: bool
    conditions: Dict[str, Any]
    cooldown_minutes: int
    priority: str
    created_at: datetime
    last_triggered: Optional[datetime] = None

class AlertTriggerResponse(BaseModel):
    """Alert trigger response"""
    trigger_id: str
    rule_id: str
    user_id: int
    trigger_type: str
    severity: str
    message: str
    data: Dict[str, Any]
    triggered_at: datetime
    expires_at: Optional[datetime] = None

class AlertEngineStatus(BaseModel):
    """Alert engine status response"""
    status: str
    stats: Dict[str, Any]
    active_rules: int
    triggered_alerts: int
    deduplication_cache_size: int
    evaluation_interval: int
    max_concurrent_evaluations: int

@router.get("/status", response_model=StandardAPIResponse[AlertEngineStatus])
async def get_alert_engine_status(
    alert_engine: AlertEngineCore = Depends(get_alert_engine_core)
):
    """Get alert engine status and statistics"""
    try:
        status_data = await alert_engine.get_engine_status()
        
        return ResponseBuilder.success(AlertEngineStatus(**status_data))
        
    except Exception as e:
        logger.error(f"Error getting alert engine status: {e}")
        raise BusinessLogicException("Failed to get alert engine status")

@router.post("/start", response_model=StandardAPIResponse[Dict[str, Any]])
async def start_alert_engine(
    alert_engine: AlertEngineCore = Depends(get_alert_engine_core)
):
    """Start the alert engine"""
    try:
        if alert_engine.is_running:
            return ResponseBuilder.success({
                "message": "Alert engine is already running",
                "status": "running"
            })
        
        # Start the alert engine in the background
        import asyncio
        asyncio.create_task(alert_engine.start())
        
        return ResponseBuilder.success({
            "message": "Alert engine started successfully",
            "status": "starting"
        })
        
    except Exception as e:
        logger.error(f"Error starting alert engine: {e}")
        raise BusinessLogicException("Failed to start alert engine")

@router.post("/stop", response_model=StandardAPIResponse[Dict[str, Any]])
async def stop_alert_engine(
    alert_engine: AlertEngineCore = Depends(get_alert_engine_core)
):
    """Stop the alert engine"""
    try:
        await alert_engine.stop()
        
        return ResponseBuilder.success({
            "message": "Alert engine stopped successfully",
            "status": "stopped"
        })
        
    except Exception as e:
        logger.error(f"Error stopping alert engine: {e}")
        raise BusinessLogicException("Failed to stop alert engine")

@router.post("/rules", response_model=StandardAPIResponse[AlertRuleResponse])
async def create_alert_rule(
    rule_data: AlertRuleCreate,
    user_id: int = Query(1, description="User ID"),  # Mock user ID for now
    alert_engine: AlertEngineCore = Depends(get_alert_engine_core)
):
    """Create a new alert rule"""
    try:
        # Validate rule type
        try:
            rule_type = AlertRuleType(rule_data.rule_type)
        except ValueError:
            raise BusinessLogicException(f"Invalid rule type: {rule_data.rule_type}")
        
        # Generate rule ID
        rule_id = f"rule_{rule_data.rule_type}_{user_id}_{int(datetime.now().timestamp())}"
        
        # Create rule object
        alert_rule = AlertRule(
            rule_id=rule_id,
            user_id=user_id,
            rule_type=rule_type,
            is_active=rule_data.is_active,
            conditions=rule_data.conditions,
            cooldown_minutes=rule_data.cooldown_minutes,
            priority=rule_data.priority,
            created_at=datetime.now(timezone.utc)
        )
        
        # Add to active rules
        alert_engine.active_rules[rule_id] = alert_rule
        
        # Create response
        rule_response = AlertRuleResponse(
            rule_id=alert_rule.rule_id,
            user_id=alert_rule.user_id,
            rule_type=alert_rule.rule_type.value,
            is_active=alert_rule.is_active,
            conditions=alert_rule.conditions,
            cooldown_minutes=alert_rule.cooldown_minutes,
            priority=alert_rule.priority,
            created_at=alert_rule.created_at,
            last_triggered=alert_rule.last_triggered
        )
        
        logger.info(f"Created alert rule: {rule_id}")
        return ResponseBuilder.success(rule_response)
        
    except BusinessLogicException:
        raise
    except Exception as e:
        logger.error(f"Error creating alert rule: {e}")
        raise BusinessLogicException("Failed to create alert rule")

@router.get("/rules", response_model=StandardAPIResponse[List[AlertRuleResponse]])
async def get_alert_rules(
    user_id: int = Query(1, description="User ID"),  # Mock user ID for now
    active_only: bool = Query(True, description="Return only active rules"),
    alert_engine: AlertEngineCore = Depends(get_alert_engine_core)
):
    """Get alert rules for user"""
    try:
        # Filter rules by user and active status
        rules = []
        for rule in alert_engine.active_rules.values():
            if rule.user_id == user_id:
                if not active_only or rule.is_active:
                    rule_response = AlertRuleResponse(
                        rule_id=rule.rule_id,
                        user_id=rule.user_id,
                        rule_type=rule.rule_type.value,
                        is_active=rule.is_active,
                        conditions=rule.conditions,
                        cooldown_minutes=rule.cooldown_minutes,
                        priority=rule.priority,
                        created_at=rule.created_at,
                        last_triggered=rule.last_triggered
                    )
                    rules.append(rule_response)
        
        return ResponseBuilder.success(rules)
        
    except Exception as e:
        logger.error(f"Error getting alert rules: {e}")
        raise BusinessLogicException("Failed to get alert rules")

@router.get("/rules/{rule_id}", response_model=StandardAPIResponse[AlertRuleResponse])
async def get_alert_rule(
    rule_id: str,
    alert_engine: AlertEngineCore = Depends(get_alert_engine_core)
):
    """Get specific alert rule by ID"""
    try:
        if rule_id not in alert_engine.active_rules:
            raise BusinessLogicException(f"Alert rule not found: {rule_id}")
        
        rule = alert_engine.active_rules[rule_id]
        rule_response = AlertRuleResponse(
            rule_id=rule.rule_id,
            user_id=rule.user_id,
            rule_type=rule.rule_type.value,
            is_active=rule.is_active,
            conditions=rule.conditions,
            cooldown_minutes=rule.cooldown_minutes,
            priority=rule.priority,
            created_at=rule.created_at,
            last_triggered=rule.last_triggered
        )
        
        return ResponseBuilder.success(rule_response)
        
    except BusinessLogicException:
        raise
    except Exception as e:
        logger.error(f"Error getting alert rule {rule_id}: {e}")
        raise BusinessLogicException("Failed to get alert rule")

@router.put("/rules/{rule_id}", response_model=StandardAPIResponse[AlertRuleResponse])
async def update_alert_rule(
    rule_id: str,
    rule_data: AlertRuleCreate,
    alert_engine: AlertEngineCore = Depends(get_alert_engine_core)
):
    """Update an existing alert rule"""
    try:
        if rule_id not in alert_engine.active_rules:
            raise BusinessLogicException(f"Alert rule not found: {rule_id}")
        
        rule = alert_engine.active_rules[rule_id]
        
        # Validate rule type
        try:
            rule_type = AlertRuleType(rule_data.rule_type)
        except ValueError:
            raise BusinessLogicException(f"Invalid rule type: {rule_data.rule_type}")
        
        # Update rule
        rule.rule_type = rule_type
        rule.conditions = rule_data.conditions
        rule.cooldown_minutes = rule_data.cooldown_minutes
        rule.priority = rule_data.priority
        rule.is_active = rule_data.is_active
        
        # Create response
        rule_response = AlertRuleResponse(
            rule_id=rule.rule_id,
            user_id=rule.user_id,
            rule_type=rule.rule_type.value,
            is_active=rule.is_active,
            conditions=rule.conditions,
            cooldown_minutes=rule.cooldown_minutes,
            priority=rule.priority,
            created_at=rule.created_at,
            last_triggered=rule.last_triggered
        )
        
        logger.info(f"Updated alert rule: {rule_id}")
        return ResponseBuilder.success(rule_response)
        
    except BusinessLogicException:
        raise
    except Exception as e:
        logger.error(f"Error updating alert rule {rule_id}: {e}")
        raise BusinessLogicException("Failed to update alert rule")

@router.delete("/rules/{rule_id}", response_model=StandardAPIResponse[Dict[str, Any]])
async def delete_alert_rule(
    rule_id: str,
    alert_engine: AlertEngineCore = Depends(get_alert_engine_core)
):
    """Delete an alert rule"""
    try:
        if rule_id not in alert_engine.active_rules:
            raise BusinessLogicException(f"Alert rule not found: {rule_id}")
        
        # Remove rule
        del alert_engine.active_rules[rule_id]
        
        logger.info(f"Deleted alert rule: {rule_id}")
        return ResponseBuilder.success({
            "message": f"Alert rule {rule_id} deleted successfully",
            "rule_id": rule_id
        })
        
    except BusinessLogicException:
        raise
    except Exception as e:
        logger.error(f"Error deleting alert rule {rule_id}: {e}")
        raise BusinessLogicException("Failed to delete alert rule")

@router.get("/triggers", response_model=StandardAPIResponse[List[AlertTriggerResponse]])
async def get_alert_triggers(
    user_id: int = Query(1, description="User ID"),  # Mock user ID for now
    limit: int = Query(50, ge=1, le=200, description="Maximum number of triggers"),
    alert_engine: AlertEngineCore = Depends(get_alert_engine_core)
):
    """Get recent alert triggers for user"""
    try:
        # Filter triggers by user
        triggers = []
        for trigger in alert_engine.triggered_alerts.values():
            if trigger.user_id == user_id:
                trigger_response = AlertTriggerResponse(
                    trigger_id=trigger.trigger_id,
                    rule_id=trigger.rule_id,
                    user_id=trigger.user_id,
                    trigger_type=trigger.trigger_type.value,
                    severity=trigger.severity,
                    message=trigger.message,
                    data=trigger.data,
                    triggered_at=trigger.triggered_at,
                    expires_at=trigger.expires_at
                )
                triggers.append(trigger_response)
        
        # Sort by triggered_at (most recent first) and limit
        triggers.sort(key=lambda x: x.triggered_at, reverse=True)
        triggers = triggers[:limit]
        
        return ResponseBuilder.success(triggers)
        
    except Exception as e:
        logger.error(f"Error getting alert triggers: {e}")
        raise BusinessLogicException("Failed to get alert triggers")

@router.get("/triggers/{trigger_id}", response_model=StandardAPIResponse[AlertTriggerResponse])
async def get_alert_trigger(
    trigger_id: str,
    alert_engine: AlertEngineCore = Depends(get_alert_engine_core)
):
    """Get specific alert trigger by ID"""
    try:
        if trigger_id not in alert_engine.triggered_alerts:
            raise BusinessLogicException(f"Alert trigger not found: {trigger_id}")
        
        trigger = alert_engine.triggered_alerts[trigger_id]
        trigger_response = AlertTriggerResponse(
            trigger_id=trigger.trigger_id,
            rule_id=trigger.rule_id,
            user_id=trigger.user_id,
            trigger_type=trigger.trigger_type.value,
            severity=trigger.severity,
            message=trigger.message,
            data=trigger.data,
            triggered_at=trigger.triggered_at,
            expires_at=trigger.expires_at
        )
        
        return ResponseBuilder.success(trigger_response)
        
    except BusinessLogicException:
        raise
    except Exception as e:
        logger.error(f"Error getting alert trigger {trigger_id}: {e}")
        raise BusinessLogicException("Failed to get alert trigger")

@router.post("/test", response_model=StandardAPIResponse[Dict[str, Any]])
async def test_alert_evaluation(
    rule_type: str = Query("ev_threshold", description="Rule type to test"),
    user_id: int = Query(1, description="User ID"),  # Mock user ID for now
    alert_engine: AlertEngineCore = Depends(get_alert_engine_core)
):
    """Test alert evaluation with current data"""
    try:
        # Validate rule type
        try:
            alert_rule_type = AlertRuleType(rule_type)
        except ValueError:
            raise BusinessLogicException(f"Invalid rule type: {rule_type}")
        
        # Create test rule
        test_rule = AlertRule(
            rule_id=f"test_{rule_type}_{int(datetime.now().timestamp())}",
            user_id=user_id,
            rule_type=alert_rule_type,
            is_active=True,
            conditions={
                'min_ev_percentage': 5.0,
                'min_confidence': 70.0,
                'movement_threshold': 1.0,
                'min_edge_percentage': 8.0
            },
            cooldown_minutes=0,  # No cooldown for test
            priority='medium',
            created_at=datetime.now(timezone.utc)
        )
        
        # Get current prop data
        prop_data = await alert_engine._get_current_prop_data()
        
        # Evaluate test rule
        triggers = await alert_engine._evaluate_rule(test_rule, prop_data)
        
        return ResponseBuilder.success({
            "rule_type": rule_type,
            "prop_data_count": len(prop_data),
            "triggers_generated": len(triggers),
            "triggers": [
                {
                    "trigger_id": t.trigger_id,
                    "message": t.message,
                    "severity": t.severity,
                    "data": t.data
                }
                for t in triggers
            ]
        })
        
    except BusinessLogicException:
        raise
    except Exception as e:
        logger.error(f"Error testing alert evaluation: {e}")
        raise BusinessLogicException("Failed to test alert evaluation")

@router.get("/rule-types", response_model=StandardAPIResponse[List[Dict[str, str]]])
async def get_alert_rule_types():
    """Get available alert rule types"""
    try:
        rule_types = [
            {
                "type": rule_type.value,
                "name": rule_type.value.replace('_', ' ').title(),
                "description": _get_rule_type_description(rule_type)
            }
            for rule_type in AlertRuleType
        ]
        
        return ResponseBuilder.success(rule_types)
        
    except Exception as e:
        logger.error(f"Error getting alert rule types: {e}")
        raise BusinessLogicException("Failed to get alert rule types")

def _get_rule_type_description(rule_type: AlertRuleType) -> str:
    """Get description for alert rule type"""
    descriptions = {
        AlertRuleType.EV_THRESHOLD: "Trigger when expected value exceeds threshold",
        AlertRuleType.LINE_MOVEMENT: "Trigger on significant line movements",
        AlertRuleType.EDGE_EMERGENCE: "Trigger when new betting edges emerge",
        AlertRuleType.STEAM_DETECTION: "Trigger when steam is detected across books",
        AlertRuleType.VALUE_DEGRADATION: "Trigger when prop value degrades",
        AlertRuleType.ARBITRAGE_OPPORTUNITY: "Trigger on arbitrage opportunities"
    }
    return descriptions.get(rule_type, "Custom alert rule type")