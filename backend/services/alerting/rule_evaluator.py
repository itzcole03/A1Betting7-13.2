"""
Alert Rule Evaluation Engine

Responsible for evaluating alert rules against current data and determining when alerts should be triggered.
Supports multiple alert types including edge thresholds, line movement, valuation changes, and risk warnings.
"""

from dataclasses import dataclass
from enum import Enum
from typing import List, Dict, Any, Optional, Tuple, Set
from datetime import datetime, timedelta
import asyncio
import logging

from backend.services.unified_config import unified_config
from backend.models.risk_personalization import AlertRule, AlertRuleType
from backend.services.risk.risk_constraints import RiskLevel


logger = logging.getLogger(__name__)


class AlertEventType(Enum):
    """Types of alert events that can be triggered"""
    EDGE_THRESHOLD = "edge_threshold"
    LINE_MOVEMENT = "line_movement"
    VALUATION_CHANGE = "valuation_change"
    RISK_WARNING = "risk_warning"
    CORRELATION_RISK = "correlation_risk"
    BANKROLL_WARNING = "bankroll_warning"
    EXPOSURE_LIMIT = "exposure_limit"
    WATCHLIST_UPDATE = "watchlist_update"


@dataclass
class AlertEvent:
    """Represents an alert event that needs to be processed"""
    alert_rule_id: int
    user_id: int
    event_type: AlertEventType
    severity: str  # 'low', 'medium', 'high', 'critical'
    title: str
    message: str
    data: Dict[str, Any]
    triggered_at: datetime
    expires_at: Optional[datetime] = None
    
    
class AlertRuleEvaluator:
    """
    Alert Rule Evaluation Engine
    
    Evaluates alert rules against current system state and identifies
    when alerts should be triggered based on user preferences.
    """
    
    _instance = None
    
    def __init__(self):
        """Initialize alert rule evaluator"""
        if AlertRuleEvaluator._instance is not None:
            raise Exception("AlertRuleEvaluator is a singleton")
            
        self.config = unified_config.get_config_value("risk_management")
        self.evaluation_active = False
        self.last_evaluation_time: Dict[int, datetime] = {}
        
        # Cache for frequently accessed data
        self.edge_cache: Dict[str, Any] = {}
        self.line_movement_cache: Dict[str, List[Dict]] = {}
        self.exposure_cache: Dict[int, Dict] = {}
        
        logger.info("AlertRuleEvaluator initialized")
        
    @classmethod
    def get_instance(cls):
        """Get singleton instance"""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance
    
    async def start_evaluation_loop(self):
        """Start the continuous alert rule evaluation loop"""
        if self.evaluation_active:
            logger.warning("Alert evaluation loop already active")
            return
            
        self.evaluation_active = True
        logger.info("Starting alert rule evaluation loop")
        
        while self.evaluation_active:
            try:
                await self.evaluate_all_rules()
                await asyncio.sleep(self.config.alert_evaluation_interval_seconds)
            except Exception as e:
                logger.error(f"Error in alert evaluation loop: {e}")
                await asyncio.sleep(30)  # Wait before retrying
                
    async def stop_evaluation_loop(self):
        """Stop the alert evaluation loop"""
        self.evaluation_active = False
        logger.info("Stopped alert rule evaluation loop")
        
    async def evaluate_all_rules(self) -> List[AlertEvent]:
        """
        Evaluate all active alert rules and return triggered events
        """
        try:
            # Mock: In production, this would query the database for active alert rules
            active_rules = await self._get_active_alert_rules()
            
            events = []
            for rule in active_rules:
                try:
                    rule_events = await self.evaluate_rule(rule)
                    events.extend(rule_events)
                except Exception as e:
                    logger.error(f"Error evaluating rule {rule['id']}: {e}")
                    
            logger.debug(f"Evaluated {len(active_rules)} rules, triggered {len(events)} events")
            return events
            
        except Exception as e:
            logger.error(f"Error in evaluate_all_rules: {e}")
            return []
    
    async def evaluate_rule(self, rule: Dict[str, Any]) -> List[AlertEvent]:
        """
        Evaluate a single alert rule and return any triggered events
        """
        rule_id = rule['id']
        user_id = rule['user_id']
        alert_type = AlertRuleType(rule['alert_type'])
        
        # Check if enough time has passed since last evaluation
        if not self._should_evaluate_rule(rule_id, rule.get('cooldown_minutes', 15)):
            return []
            
        events = []
        
        try:
            if alert_type == AlertRuleType.EDGE_EV_THRESHOLD:
                events.extend(await self._evaluate_edge_threshold(rule))
            elif alert_type == AlertRuleType.LINE_MOVE:
                events.extend(await self._evaluate_line_movement(rule))
            elif alert_type == AlertRuleType.EV_DELTA:
                events.extend(await self._evaluate_valuation_change(rule))
            elif alert_type == AlertRuleType.CORRELATION_RISK:
                events.extend(await self._evaluate_risk_warning(rule))
            elif alert_type == AlertRuleType.BANKROLL_DRAWDOWN:
                events.extend(await self._evaluate_bankroll_alert(rule))
                
            if events:
                self.last_evaluation_time[rule_id] = datetime.utcnow()
                
        except Exception as e:
            logger.error(f"Error evaluating rule {rule_id} of type {alert_type}: {e}")
            
        return events
    
    async def _evaluate_edge_threshold(self, rule: Dict[str, Any]) -> List[AlertEvent]:
        """Evaluate edge threshold alert rule"""
        threshold = rule['parameters'].get('threshold', 0.05)  # 5% default
        edges = await self._get_current_edges(rule['user_id'])
        
        events = []
        for edge in edges:
            if edge.get('edge_percentage', 0) >= threshold:
                event = AlertEvent(
                    alert_rule_id=rule['id'],
                    user_id=rule['user_id'],
                    event_type=AlertEventType.EDGE_THRESHOLD,
                    severity=self._calculate_edge_severity(edge['edge_percentage']),
                    title=f"High Edge Opportunity: {edge['edge_percentage']:.1%}",
                    message=f"Found edge of {edge['edge_percentage']:.1%} on {edge['prop_description']}",
                    data={
                        'edge_id': edge['id'],
                        'edge_percentage': edge['edge_percentage'],
                        'prop_description': edge['prop_description'],
                        'sportsbook': edge.get('sportsbook'),
                        'threshold': threshold
                    },
                    triggered_at=datetime.utcnow(),
                    expires_at=datetime.utcnow() + timedelta(hours=2)
                )
                events.append(event)
                
        return events
    
    async def _evaluate_line_movement(self, rule: Dict[str, Any]) -> List[AlertEvent]:
        """Evaluate line movement alert rule"""
        movement_threshold = rule['parameters'].get('movement_threshold', 0.5)  # 0.5 points default
        time_window_hours = rule['parameters'].get('time_window_hours', 4)
        
        # Get recent line movements
        movements = await self._get_line_movements(rule['user_id'], time_window_hours)
        
        events = []
        for movement in movements:
            if abs(movement['line_change']) >= movement_threshold:
                direction = "increased" if movement['line_change'] > 0 else "decreased"
                
                event = AlertEvent(
                    alert_rule_id=rule['id'],
                    user_id=rule['user_id'],
                    event_type=AlertEventType.LINE_MOVEMENT,
                    severity=self._calculate_movement_severity(abs(movement['line_change'])),
                    title=f"Significant Line Movement: {movement['line_change']:+.1f}",
                    message=f"Line {direction} by {abs(movement['line_change']):.1f} for {movement['prop_description']}",
                    data={
                        'prop_id': movement['prop_id'],
                        'line_change': movement['line_change'],
                        'old_line': movement['old_line'],
                        'new_line': movement['new_line'],
                        'sportsbook': movement['sportsbook'],
                        'movement_time': movement['movement_time']
                    },
                    triggered_at=datetime.utcnow(),
                    expires_at=datetime.utcnow() + timedelta(hours=1)
                )
                events.append(event)
                
        return events
    
    async def _evaluate_valuation_change(self, rule: Dict[str, Any]) -> List[AlertEvent]:
        """Evaluate valuation change alert rule"""
        change_threshold = rule['parameters'].get('change_threshold', 0.03)  # 3% default
        
        # Get props with recent valuation changes
        changes = await self._get_valuation_changes(rule['user_id'])
        
        events = []
        for change in changes:
            if abs(change['valuation_change']) >= change_threshold:
                direction = "improved" if change['valuation_change'] > 0 else "worsened"
                
                event = AlertEvent(
                    alert_rule_id=rule['id'],
                    user_id=rule['user_id'],
                    event_type=AlertEventType.VALUATION_CHANGE,
                    severity=self._calculate_valuation_severity(abs(change['valuation_change'])),
                    title=f"Valuation {direction.title()}: {change['valuation_change']:+.1%}",
                    message=f"Valuation {direction} by {abs(change['valuation_change']):.1%} for {change['prop_description']}",
                    data={
                        'prop_id': change['prop_id'],
                        'valuation_change': change['valuation_change'],
                        'old_valuation': change['old_valuation'],
                        'new_valuation': change['new_valuation'],
                        'change_reason': change.get('reason', 'Unknown')
                    },
                    triggered_at=datetime.utcnow(),
                    expires_at=datetime.utcnow() + timedelta(hours=2)
                )
                events.append(event)
                
        return events
    
    async def _evaluate_risk_warning(self, rule: Dict[str, Any]) -> List[AlertEvent]:
        """Evaluate risk warning alert rule"""
        # Check for various risk conditions
        risk_findings = await self._get_current_risk_findings(rule['user_id'])
        
        events = []
        for finding in risk_findings:
            severity = self._map_risk_severity(finding['violation_type'])
            
            event = AlertEvent(
                alert_rule_id=rule['id'],
                user_id=rule['user_id'],
                event_type=AlertEventType.RISK_WARNING,
                severity=severity,
                title=f"Risk Warning: {finding['violation_type']}",
                message=finding['description'],
                data={
                    'violation_type': finding['violation_type'],
                    'severity_score': finding.get('severity_score', 0),
                    'affected_tickets': finding.get('affected_tickets', []),
                    'recommendation': finding.get('recommendation')
                },
                triggered_at=datetime.utcnow(),
                expires_at=datetime.utcnow() + timedelta(hours=6)
            )
            events.append(event)
            
        return events
    
    async def _evaluate_bankroll_alert(self, rule: Dict[str, Any]) -> List[AlertEvent]:
        """Evaluate bankroll-related alerts"""
        # Check bankroll status and warnings
        bankroll_status = await self._get_bankroll_status(rule['user_id'])
        
        events = []
        
        # Low bankroll warning
        if bankroll_status['balance_percentage'] <= 0.2:  # 20% or less
            event = AlertEvent(
                alert_rule_id=rule['id'],
                user_id=rule['user_id'],
                event_type=AlertEventType.BANKROLL_WARNING,
                severity='high',
                title="Low Bankroll Warning",
                message=f"Bankroll is at {bankroll_status['balance_percentage']:.1%} of starting balance",
                data={
                    'current_balance': bankroll_status['current_balance'],
                    'starting_balance': bankroll_status['starting_balance'],
                    'balance_percentage': bankroll_status['balance_percentage'],
                    'recent_losses': bankroll_status.get('recent_losses', 0)
                },
                triggered_at=datetime.utcnow(),
                expires_at=datetime.utcnow() + timedelta(days=1)
            )
            events.append(event)
            
        return events
    
    async def _evaluate_exposure_alert(self, rule: Dict[str, Any]) -> List[AlertEvent]:
        """Evaluate exposure limit alerts"""
        exposure_status = await self._get_exposure_status(rule['user_id'])
        
        events = []
        
        # Check for exposure limit violations
        for exposure_type, data in exposure_status.items():
            if data['utilization'] >= 0.9:  # 90% or more of limit used
                event = AlertEvent(
                    alert_rule_id=rule['id'],
                    user_id=rule['user_id'],
                    event_type=AlertEventType.EXPOSURE_LIMIT,
                    severity='medium' if data['utilization'] < 1.0 else 'high',
                    title=f"High {exposure_type} Exposure",
                    message=f"{exposure_type} exposure at {data['utilization']:.1%} of limit",
                    data={
                        'exposure_type': exposure_type,
                        'current_exposure': data['current_exposure'],
                        'limit': data['limit'],
                        'utilization': data['utilization']
                    },
                    triggered_at=datetime.utcnow(),
                    expires_at=datetime.utcnow() + timedelta(hours=4)
                )
                events.append(event)
                
        return events
    
    async def _evaluate_watchlist_update(self, rule: Dict[str, Any]) -> List[AlertEvent]:
        """Evaluate watchlist updates"""
        watchlist_updates = await self._get_watchlist_updates(rule['user_id'])
        
        events = []
        for update in watchlist_updates:
            event = AlertEvent(
                alert_rule_id=rule['id'],
                user_id=rule['user_id'],
                event_type=AlertEventType.WATCHLIST_UPDATE,
                severity='low',
                title=f"Watchlist Update: {update['item_name']}",
                message=f"New activity for {update['item_name']} in watchlist '{update['watchlist_name']}'",
                data={
                    'watchlist_id': update['watchlist_id'],
                    'watchlist_name': update['watchlist_name'],
                    'item_type': update['item_type'],
                    'item_name': update['item_name'],
                    'update_type': update['update_type'],
                    'details': update.get('details', {})
                },
                triggered_at=datetime.utcnow(),
                expires_at=datetime.utcnow() + timedelta(hours=12)
            )
            events.append(event)
            
        return events
    
    def _should_evaluate_rule(self, rule_id: int, cooldown_minutes: int) -> bool:
        """Check if rule should be evaluated based on cooldown"""
        last_time = self.last_evaluation_time.get(rule_id)
        if last_time is None:
            return True
            
        time_since_last = datetime.utcnow() - last_time
        return time_since_last.total_seconds() >= (cooldown_minutes * 60)
    
    def _calculate_edge_severity(self, edge_percentage: float) -> str:
        """Calculate severity based on edge percentage"""
        if edge_percentage >= 0.15:  # 15%+
            return 'critical'
        elif edge_percentage >= 0.10:  # 10%+
            return 'high'
        elif edge_percentage >= 0.05:  # 5%+
            return 'medium'
        else:
            return 'low'
    
    def _calculate_movement_severity(self, movement: float) -> str:
        """Calculate severity based on line movement"""
        if movement >= 3.0:
            return 'high'
        elif movement >= 1.5:
            return 'medium'
        else:
            return 'low'
    
    def _calculate_valuation_severity(self, change: float) -> str:
        """Calculate severity based on valuation change"""
        if change >= 0.10:  # 10%+
            return 'high'
        elif change >= 0.05:  # 5%+
            return 'medium'
        else:
            return 'low'
    
    def _map_risk_severity(self, violation_type: str) -> str:
        """Map risk violation type to alert severity"""
        high_risk = [
            'CORRELATION_OVEREXPOSURE',
            'CONCENTRATION_RISK',
            'SUSPICIOUS_PATTERN'
        ]
        
        if violation_type in high_risk:
            return 'high'
        else:
            return 'medium'
    
    # Mock data methods - in production these would query real data sources
    
    async def _get_active_alert_rules(self) -> List[Dict[str, Any]]:
        """Get all active alert rules from database"""
        # Mock data - in production this would query AlertRule table
        return [
            {
                'id': 1,
                'user_id': 1,
                'alert_type': AlertRuleType.EDGE_EV_THRESHOLD.value,
                'is_active': True,
                'parameters': {'threshold': 0.08},
                'cooldown_minutes': 15
            },
            {
                'id': 2,
                'user_id': 1,
                'alert_type': AlertRuleType.LINE_MOVE.value,
                'is_active': True,
                'parameters': {'movement_threshold': 1.0, 'time_window_hours': 2},
                'cooldown_minutes': 30
            },
            {
                'id': 3,
                'user_id': 1,
                'alert_type': AlertRuleType.CORRELATION_RISK.value,
                'is_active': True,
                'parameters': {},
                'cooldown_minutes': 60
            }
        ]
    
    async def _get_current_edges(self, user_id: int) -> List[Dict[str, Any]]:
        """Get current edges for user"""
        return [
            {
                'id': 'edge_001',
                'prop_description': 'Patrick Mahomes Passing Yards Over 275.5',
                'edge_percentage': 0.12,
                'sportsbook': 'FanDuel',
                'confidence': 0.85
            },
            {
                'id': 'edge_002',
                'prop_description': 'Lakers vs Warriors Over 225.5',
                'edge_percentage': 0.06,
                'sportsbook': 'DraftKings',
                'confidence': 0.72
            }
        ]
    
    async def _get_line_movements(self, user_id: int, hours: int) -> List[Dict[str, Any]]:
        """Get recent line movements"""
        return [
            {
                'prop_id': 'prop_001',
                'prop_description': 'Josh Allen Passing TDs Over 1.5',
                'line_change': -1.5,
                'old_line': 2.0,
                'new_line': 0.5,
                'sportsbook': 'BetMGM',
                'movement_time': datetime.utcnow() - timedelta(minutes=45)
            }
        ]
    
    async def _get_valuation_changes(self, user_id: int) -> List[Dict[str, Any]]:
        """Get recent valuation changes"""
        return [
            {
                'prop_id': 'prop_002',
                'prop_description': 'Stephen Curry 3PM Over 4.5',
                'valuation_change': 0.08,
                'old_valuation': 0.52,
                'new_valuation': 0.60,
                'reason': 'Injury report update'
            }
        ]
    
    async def _get_current_risk_findings(self, user_id: int) -> List[Dict[str, Any]]:
        """Get current risk findings for user"""
        return [
            {
                'violation_type': 'CORRELATION_OVEREXPOSURE',
                'description': 'High correlation exposure detected in NBA player props',
                'severity_score': 0.75,
                'affected_tickets': ['ticket_001', 'ticket_002'],
                'recommendation': 'Consider reducing exposure to correlated outcomes'
            }
        ]
    
    async def _get_bankroll_status(self, user_id: int) -> Dict[str, Any]:
        """Get bankroll status for user"""
        return {
            'current_balance': 850.0,
            'starting_balance': 1000.0,
            'balance_percentage': 0.85,
            'recent_losses': 150.0
        }
    
    async def _get_exposure_status(self, user_id: int) -> Dict[str, Dict[str, Any]]:
        """Get exposure status for user"""
        return {
            'player_exposure': {
                'current_exposure': 450.0,
                'limit': 500.0,
                'utilization': 0.9
            },
            'prop_type_exposure': {
                'current_exposure': 280.0,
                'limit': 300.0,
                'utilization': 0.93
            }
        }
    
    async def _get_watchlist_updates(self, user_id: int) -> List[Dict[str, Any]]:
        """Get watchlist updates for user"""
        return [
            {
                'watchlist_id': 1,
                'watchlist_name': 'NBA Stars',
                'item_type': 'player',
                'item_name': 'LeBron James',
                'update_type': 'new_prop_available',
                'details': {
                    'prop_type': 'points',
                    'line': 25.5,
                    'odds': -110
                }
            }
        ]


# Global instance
alert_rule_evaluator = AlertRuleEvaluator.get_instance()