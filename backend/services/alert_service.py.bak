"""
In-memory Alert Service for user alert configuration and evaluation.
Part of the basic user alert MVP implementation.
"""

import asyncio
import logging
from collections import defaultdict, deque
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from backend.models.alert_models import (
    AlertRule, AlertTrigger, AlertType, AlertEvaluationContext, AlertStats,
    CreateAlertRequest
)

logger = logging.getLogger("propollama.alerts")


class AlertService:
    """
    In-memory alert service for managing user alert rules and evaluation.
    
    Storage structure:
    - user_alert_rules: {user_id: [AlertRule, ...]}
    - fired_alerts: deque(maxlen=1000) # Last 1000 fired alerts
    """
    
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(AlertService, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
            
        # In-memory storage
        self.user_alert_rules: Dict[str, List[AlertRule]] = defaultdict(list)
        self.fired_alerts: deque = deque(maxlen=1000)  # Keep last 1000 fired alerts
        
        # Evaluation state
        self.evaluation_running = False
        self.last_evaluation: Optional[datetime] = None
        self.evaluation_interval = 60  # seconds
        
        # Background task
        self._evaluation_task: Optional[asyncio.Task] = None
        
        self._initialized = True
        logger.info("AlertService initialized with in-memory storage")
    
    async def create_alert_rule(self, user_id: str, request: CreateAlertRequest) -> AlertRule:
        """Create a new alert rule for a user"""
        rule = AlertRule(
            user_id=user_id,
            type=request.type,
            sport=request.sport,
            player=request.player,
            market=request.market,
            trigger_value=request.trigger_value
        )
        
        self.user_alert_rules[user_id].append(rule)
        
        logger.info(f"Created alert rule {rule.id} for user {user_id}: {rule.type.value}")
        return rule
    
    async def get_user_alert_rules(self, user_id: str) -> List[AlertRule]:
        """Get all alert rules for a user"""
        return [rule for rule in self.user_alert_rules[user_id] if rule.is_active]
    
    async def delete_alert_rule(self, user_id: str, rule_id: str) -> bool:
        """Delete an alert rule for a user"""
        user_rules = self.user_alert_rules[user_id]
        
        for i, rule in enumerate(user_rules):
            if rule.id == rule_id:
                # Soft delete by marking inactive
                user_rules[i].is_active = False
                logger.info(f"Deleted alert rule {rule_id} for user {user_id}")
                return True
        
        return False
    
    async def get_fired_alerts(self, limit: int = 50) -> List[AlertTrigger]:
        """Get the last N fired alerts"""
        # Convert deque to list and slice
        all_fired = list(self.fired_alerts)
        return all_fired[-limit:] if limit < len(all_fired) else all_fired
    
    async def fire_alert(self, rule: AlertRule, trigger_data: Dict[str, Any], message: str = ""):
        """Fire an alert and add to fired alerts list"""
        trigger = AlertTrigger(
            rule_id=rule.id,
            user_id=rule.user_id,
            alert_type=rule.type,
            trigger_data=trigger_data,
            message=message
        )
        
        self.fired_alerts.append(trigger)
        logger.info(f"ALERT_TRIGGERED: {rule.type.value} for user {rule.user_id} - {message}")
        
        return trigger
    
    async def get_alert_stats(self) -> AlertStats:
        """Get statistics about the alert system"""
        total_rules = sum(len(rules) for rules in self.user_alert_rules.values())
        active_rules = sum(
            len([r for r in rules if r.is_active]) 
            for rules in self.user_alert_rules.values()
        )
        
        today = datetime.utcnow().date()
        fired_today = len([
            alert for alert in self.fired_alerts 
            if alert.triggered_at.date() == today
        ])
        
        return AlertStats(
            total_rules=total_rules,
            active_rules=active_rules,
            total_fired=len(self.fired_alerts),
            fired_today=fired_today,
            last_evaluation=self.last_evaluation
        )
    
    async def start_evaluation_loop(self):
        """Start the background evaluation loop"""
        if self.evaluation_running:
            logger.warning("Alert evaluation loop already running")
            return
        
        self.evaluation_running = True
        self._evaluation_task = asyncio.create_task(self._evaluation_loop())
        logger.info(f"Started alert evaluation loop (interval: {self.evaluation_interval}s)")
    
    async def stop_evaluation_loop(self):
        """Stop the background evaluation loop"""
        self.evaluation_running = False
        if self._evaluation_task:
            self._evaluation_task.cancel()
            try:
                await self._evaluation_task
            except asyncio.CancelledError:
                pass
        logger.info("Stopped alert evaluation loop")
    
    async def _evaluation_loop(self):
        """Background task that evaluates alerts every 60 seconds"""
        try:
            while self.evaluation_running:
                await self._evaluate_all_alerts()
                await asyncio.sleep(self.evaluation_interval)
        except asyncio.CancelledError:
            logger.info("Alert evaluation loop cancelled")
        except Exception as e:
            logger.error(f"Alert evaluation loop error: {e}", exc_info=True)
    
    async def _evaluate_all_alerts(self):
        """Evaluate all active alert rules"""
        try:
            self.last_evaluation = datetime.utcnow()
            
            # Get evaluation context (current market data)
            context = await self._get_evaluation_context()
            
            # Evaluate all active rules
            total_evaluated = 0
            total_fired = 0
            
            for user_id, rules in self.user_alert_rules.items():
                for rule in rules:
                    if rule.is_active:
                        total_evaluated += 1
                        if await self._evaluate_rule(rule, context):
                            total_fired += 1
            
            logger.debug(f"Alert evaluation complete: {total_evaluated} rules, {total_fired} fired")
            
        except Exception as e:
            logger.error(f"Error in alert evaluation: {e}", exc_info=True)
    
    async def _get_evaluation_context(self) -> AlertEvaluationContext:
        """Get current market data for alert evaluation"""
        # TODO: Integrate with actual data services
        # For MVP, we'll use mock data structure
        return AlertEvaluationContext(
            current_ev_opportunities=[],
            arbitrage_opportunities=[],
            line_movements=[]
        )
    
    async def _evaluate_rule(self, rule: AlertRule, context: AlertEvaluationContext) -> bool:
        """Evaluate a single alert rule and fire if triggered"""
        try:
            if rule.type == AlertType.EV_THRESHOLD:
                return await self._evaluate_ev_threshold(rule, context)
            elif rule.type == AlertType.ARBITRAGE:
                return await self._evaluate_arbitrage(rule, context)
            elif rule.type == AlertType.LINE_MOVEMENT:
                return await self._evaluate_line_movement(rule, context)
            else:
                logger.warning(f"Unknown alert type: {rule.type}")
                return False
        except Exception as e:
            logger.error(f"Error evaluating rule {rule.id}: {e}")
            return False
    
    async def _evaluate_ev_threshold(self, rule: AlertRule, context: AlertEvaluationContext) -> bool:
        """Evaluate EV threshold alert: if any current EV >= triggerValue"""
        # Mock implementation - check if any opportunities meet EV threshold
        for opportunity in context.current_ev_opportunities:
            ev_value = opportunity.get('ev', 0)
            
            # Apply filters if specified
            if rule.sport and opportunity.get('sport') != rule.sport:
                continue
            if rule.player and opportunity.get('player') != rule.player:
                continue
            if rule.market and opportunity.get('market') != rule.market:
                continue
            
            if ev_value >= rule.trigger_value:
                await self.fire_alert(
                    rule,
                    trigger_data={
                        'ev_value': ev_value,
                        'opportunity': opportunity,
                        'threshold': rule.trigger_value
                    },
                    message=f"EV {ev_value:.2f}% >= threshold {rule.trigger_value:.2f}%"
                )
                return True
        
        return False
    
    async def _evaluate_arbitrage(self, rule: AlertRule, context: AlertEvaluationContext) -> bool:
        """Evaluate arbitrage alert: if arbitrage opportunities >= 1 for filter"""
        matching_opportunities = []
        
        for opportunity in context.arbitrage_opportunities:
            # Apply filters if specified
            if rule.sport and opportunity.get('sport') != rule.sport:
                continue
            if rule.player and opportunity.get('player') != rule.player:
                continue
            if rule.market and opportunity.get('market') != rule.market:
                continue
            
            matching_opportunities.append(opportunity)
        
        if len(matching_opportunities) >= rule.trigger_value:
            await self.fire_alert(
                rule,
                trigger_data={
                    'opportunities_count': len(matching_opportunities),
                    'opportunities': matching_opportunities[:5],  # First 5
                    'threshold': rule.trigger_value
                },
                message=f"Found {len(matching_opportunities)} arbitrage opportunities"
            )
            return True
        
        return False
    
    async def _evaluate_line_movement(self, rule: AlertRule, context: AlertEvaluationContext) -> bool:
        """Evaluate line movement alert: if movementMagnitude >= triggerValue"""
        for movement in context.line_movements:
            magnitude = abs(movement.get('movement_magnitude', 0))
            
            # Apply filters if specified
            if rule.sport and movement.get('sport') != rule.sport:
                continue
            if rule.player and movement.get('player') != rule.player:
                continue
            if rule.market and movement.get('market') != rule.market:
                continue
            
            if magnitude >= rule.trigger_value:
                await self.fire_alert(
                    rule,
                    trigger_data={
                        'movement_magnitude': magnitude,
                        'movement_data': movement,
                        'threshold': rule.trigger_value
                    },
                    message=f"Line movement {magnitude:.1f} >= threshold {rule.trigger_value:.1f}"
                )
                return True
        
        return False


# Singleton instance
alert_service = AlertService()