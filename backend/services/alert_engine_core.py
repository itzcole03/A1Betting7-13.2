"""
Alert Engine Core - PropFinder Parity Implementation

Implements the core alert rule evaluation system with:
- EV threshold monitoring
- Line movement detection
- Edge emergence alerts
- Deduplication and cooldown management
- Integration with existing unified services

This is the core component for PropFinder-style alert functionality.
"""

import asyncio
import logging
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Set, Any, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import hashlib
import json

from backend.services.unified_odds_aggregation_service import get_unified_odds_service
from backend.services.core.unified_cache_service import UnifiedCacheService
from backend.services.unified_config import unified_config
from backend.services.alerting.rule_evaluator import AlertRuleEvaluator, AlertEvent, AlertEventType
from backend.services.alerting.alert_dispatcher import AlertDispatcher

logger = logging.getLogger(__name__)


class AlertRuleType(Enum):
    """Alert rule types for PropFinder parity"""
    EV_THRESHOLD = "ev_threshold"
    LINE_MOVEMENT = "line_movement" 
    EDGE_EMERGENCE = "edge_emergence"
    STEAM_DETECTION = "steam_detection"
    VALUE_DEGRADATION = "value_degradation"
    ARBITRAGE_OPPORTUNITY = "arbitrage_opportunity"


@dataclass
class PropData:
    """Normalized prop data for alert evaluation"""
    prop_id: str
    player_name: str
    team: str
    opponent: str
    sport: str
    market: str
    line: Optional[float]
    over_odds: Optional[int]
    under_odds: Optional[int]
    sportsbook: str
    implied_probability: float
    projection: Optional[float]
    edge_percentage: Optional[float]
    ev_value: Optional[float]
    confidence_score: Optional[float]
    last_updated: datetime


@dataclass
class AlertRule:
    """Alert rule configuration"""
    rule_id: str
    user_id: int
    rule_type: AlertRuleType
    is_active: bool
    conditions: Dict[str, Any]
    cooldown_minutes: int
    priority: str  # 'low', 'medium', 'high', 'critical'
    created_at: datetime
    last_triggered: Optional[datetime] = None


@dataclass
class AlertTrigger:
    """Alert trigger event"""
    trigger_id: str
    rule_id: str
    user_id: int
    prop_data: PropData
    trigger_type: AlertRuleType
    severity: str
    message: str
    data: Dict[str, Any]
    triggered_at: datetime
    expires_at: Optional[datetime] = None


class AlertEngineCore:
    """
    Core alert engine for PropFinder parity
    
    Handles rule evaluation, deduplication, cooldown management,
    and integration with existing alerting infrastructure.
    """
    
    def __init__(self):
        """Initialize the alert engine core"""
        self.is_running = False
        self.evaluation_interval = 30  # seconds
        self.max_concurrent_evaluations = 10
        
        # Service dependencies
        self.odds_service = None
        self.cache_service = None
        self.rule_evaluator = AlertRuleEvaluator.get_instance()
        self.alert_dispatcher = AlertDispatcher.get_instance()
        
        # State management
        self.active_rules: Dict[str, AlertRule] = {}
        self.triggered_alerts: Dict[str, AlertTrigger] = {}
        self.evaluation_queue: asyncio.Queue = asyncio.Queue()
        self.deduplication_cache: Dict[str, datetime] = {}
        
        # Performance tracking
        self.stats = {
            'evaluations_total': 0,
            'alerts_triggered': 0,
            'alerts_deduplicated': 0,
            'rules_evaluated': 0,
            'last_evaluation_time': None,
            'evaluation_duration_ms': 0
        }
        
        logger.info("AlertEngineCore initialized")
    
    async def initialize(self):
        """Initialize service dependencies"""
        try:
            self.odds_service = await get_unified_odds_service()
            self.cache_service = UnifiedCacheService()
            logger.info("AlertEngineCore dependencies initialized")
        except Exception as e:
            logger.error(f"Failed to initialize AlertEngineCore dependencies: {e}")
            # Don't raise - allow graceful degradation
            self.odds_service = None
            self.cache_service = None
    
    async def start(self):
        """Start the alert engine evaluation loop"""
        if self.is_running:
            logger.warning("Alert engine already running")
            return
        
        await self.initialize()
        self.is_running = True
        
        logger.info("Starting Alert Engine Core evaluation loop")
        
        try:
            # Start main evaluation loop
            evaluation_task = asyncio.create_task(self._evaluation_loop())
            
            # Start rule management tasks
            rule_sync_task = asyncio.create_task(self._rule_sync_loop())
            cleanup_task = asyncio.create_task(self._cleanup_loop())
            
            # Wait for all tasks
            await asyncio.gather(
                evaluation_task,
                rule_sync_task,
                cleanup_task,
                return_exceptions=True
            )
            
        except Exception as e:
            logger.error(f"Error in alert engine: {e}")
            raise
        finally:
            self.is_running = False
            logger.info("Alert Engine Core stopped")
    
    async def stop(self):
        """Stop the alert engine"""
        self.is_running = False
        logger.info("Stopping Alert Engine Core")
    
    async def _evaluation_loop(self):
        """Main evaluation loop"""
        logger.info("Starting alert evaluation loop")
        
        while self.is_running:
            try:
                start_time = datetime.now()
                
                # Evaluate all active rules
                await self._evaluate_all_rules()
                
                # Update performance metrics
                duration = (datetime.now() - start_time).total_seconds() * 1000
                self.stats['evaluation_duration_ms'] = int(duration)
                self.stats['last_evaluation_time'] = start_time
                self.stats['evaluations_total'] += 1
                
                # Wait for next evaluation
                await asyncio.sleep(self.evaluation_interval)
                
            except Exception as e:
                logger.error(f"Error in evaluation loop: {e}")
                await asyncio.sleep(30)  # Back off on errors
        
        logger.info("Alert evaluation loop stopped")
    
    async def _evaluate_all_rules(self):
        """Evaluate all active alert rules"""
        try:
            if not self.active_rules:
                await self._load_active_rules()
            
            # Get current prop data for evaluation
            prop_data = await self._get_current_prop_data()
            
            if not prop_data:
                logger.debug("No prop data available for evaluation")
                return
            
            # Evaluate each rule
            evaluation_tasks = []
            for rule in self.active_rules.values():
                if self._should_evaluate_rule(rule):
                    task = asyncio.create_task(
                        self._evaluate_rule(rule, prop_data)
                    )
                    evaluation_tasks.append(task)
            
            # Execute evaluations concurrently
            if evaluation_tasks:
                results = await asyncio.gather(*evaluation_tasks, return_exceptions=True)
                
                # Process results and dispatch alerts
                for i, result in enumerate(results):
                    if isinstance(result, Exception):
                        logger.error(f"Error evaluating rule: {result}")
                    elif result and isinstance(result, list):
                        await self._process_alert_triggers(result)
                
                self.stats['rules_evaluated'] += len(evaluation_tasks)
                logger.debug(f"Evaluated {len(evaluation_tasks)} rules")
            
        except Exception as e:
            logger.error(f"Error in _evaluate_all_rules: {e}")
    
    async def _evaluate_rule(self, rule: AlertRule, prop_data: List[PropData]) -> List[AlertTrigger]:
        """Evaluate a single alert rule against current data"""
        triggers = []
        
        try:
            if rule.rule_type == AlertRuleType.EV_THRESHOLD:
                triggers.extend(await self._evaluate_ev_threshold(rule, prop_data))
            elif rule.rule_type == AlertRuleType.LINE_MOVEMENT:
                triggers.extend(await self._evaluate_line_movement(rule, prop_data))
            elif rule.rule_type == AlertRuleType.EDGE_EMERGENCE:
                triggers.extend(await self._evaluate_edge_emergence(rule, prop_data))
            elif rule.rule_type == AlertRuleType.STEAM_DETECTION:
                triggers.extend(await self._evaluate_steam_detection(rule, prop_data))
            elif rule.rule_type == AlertRuleType.ARBITRAGE_OPPORTUNITY:
                triggers.extend(await self._evaluate_arbitrage_opportunity(rule, prop_data))
            
        except Exception as e:
            logger.error(f"Error evaluating rule {rule.rule_id}: {e}")
        
        return triggers
    
    async def _evaluate_ev_threshold(self, rule: AlertRule, prop_data: List[PropData]) -> List[AlertTrigger]:
        """Evaluate EV threshold alert rule"""
        triggers = []
        threshold = rule.conditions.get('min_ev_percentage', 5.0)
        min_confidence = rule.conditions.get('min_confidence', 70.0)
        
        for prop in prop_data:
            if (prop.ev_value and prop.ev_value >= threshold and
                prop.confidence_score and prop.confidence_score >= min_confidence):
                
                trigger = AlertTrigger(
                    trigger_id=self._generate_trigger_id(rule.rule_id, prop.prop_id, "ev_threshold"),
                    rule_id=rule.rule_id,
                    user_id=rule.user_id,
                    prop_data=prop,
                    trigger_type=AlertRuleType.EV_THRESHOLD,
                    severity=self._calculate_ev_severity(prop.ev_value),
                    message=f"High EV opportunity: {prop.ev_value:.1f}% edge on {prop.player_name} {prop.market}",
                    data={
                        'ev_percentage': prop.ev_value,
                        'confidence_score': prop.confidence_score,
                        'threshold': threshold,
                        'projected_value': prop.projection,
                        'implied_probability': prop.implied_probability
                    },
                    triggered_at=datetime.now(timezone.utc),
                    expires_at=datetime.now(timezone.utc) + timedelta(hours=2)
                )
                triggers.append(trigger)
        
        return triggers
    
    async def _evaluate_line_movement(self, rule: AlertRule, prop_data: List[PropData]) -> List[AlertTrigger]:
        """Evaluate line movement alert rule"""
        triggers = []
        movement_threshold = rule.conditions.get('movement_threshold', 1.0)
        time_window_hours = rule.conditions.get('time_window_hours', 4)
        
        # Get line movement data from odds service
        for prop in prop_data:
            try:
                if self.odds_service:
                    movement_analysis = await self.odds_service.analyze_line_movement(
                        prop_id=prop.prop_id,
                        sportsbook=prop.sportsbook,
                        hours_back=time_window_hours
                    )
                else:
                    movement_analysis = {"error": "Odds service not available"}
                
                if "error" not in movement_analysis:
                    # Check movement thresholds
                    movements = [
                        movement_analysis.get('movement_1h', 0) or 0,
                        movement_analysis.get('movement_6h', 0) or 0,
                        movement_analysis.get('movement_24h', 0) or 0
                    ]
                    
                    # Filter for numeric values and calculate max movement
                    numeric_movements = [float(m) for m in movements if isinstance(m, (int, float))]
                    max_movement = max(abs(m) for m in numeric_movements) if numeric_movements else 0.0
                    
                    if max_movement >= movement_threshold:
                        trigger = AlertTrigger(
                            trigger_id=self._generate_trigger_id(rule.rule_id, prop.prop_id, "line_movement"),
                            rule_id=rule.rule_id,
                            user_id=rule.user_id,
                            prop_data=prop,
                            trigger_type=AlertRuleType.LINE_MOVEMENT,
                            severity=self._calculate_movement_severity(max_movement),
                            message=f"Significant line movement: {max_movement:+.1f} on {prop.player_name} {prop.market}",
                            data={
                                'movement_amount': max_movement,
                                'threshold': movement_threshold,
                                'movements': {
                                    '1h': movements[0],
                                    '6h': movements[1], 
                                    '24h': movements[2]
                                },
                                'velocity': movement_analysis.get('velocity_1h'),
                                'volatility': movement_analysis.get('volatility_score')
                            },
                            triggered_at=datetime.now(timezone.utc),
                            expires_at=datetime.now(timezone.utc) + timedelta(hours=1)
                        )
                        triggers.append(trigger)
                        
            except Exception as e:
                logger.error(f"Error analyzing line movement for {prop.prop_id}: {e}")
        
        return triggers
    
    async def _evaluate_edge_emergence(self, rule: AlertRule, prop_data: List[PropData]) -> List[AlertTrigger]:
        """Evaluate edge emergence alert rule"""
        triggers = []
        min_edge = rule.conditions.get('min_edge_percentage', 10.0)
        min_confidence = rule.conditions.get('min_confidence', 80.0)
        
        for prop in prop_data:
            if (prop.edge_percentage and prop.edge_percentage >= min_edge and
                prop.confidence_score and prop.confidence_score >= min_confidence):
                
                # Check if this is a new edge (not previously detected)
                cache_key = f"edge_detected:{prop.prop_id}:{prop.sportsbook}"
                
                if not await self._is_recently_detected(cache_key):
                    trigger = AlertTrigger(
                        trigger_id=self._generate_trigger_id(rule.rule_id, prop.prop_id, "edge_emergence"),
                        rule_id=rule.rule_id,
                        user_id=rule.user_id,
                        prop_data=prop,
                        trigger_type=AlertRuleType.EDGE_EMERGENCE,
                        severity=self._calculate_edge_severity(prop.edge_percentage),
                        message=f"New edge detected: {prop.edge_percentage:.1f}% on {prop.player_name} {prop.market}",
                        data={
                            'edge_percentage': prop.edge_percentage,
                            'confidence_score': prop.confidence_score,
                            'min_edge_threshold': min_edge,
                            'projection': prop.projection,
                            'line': prop.line
                        },
                        triggered_at=datetime.now(timezone.utc),
                        expires_at=datetime.now(timezone.utc) + timedelta(hours=3)
                    )
                    triggers.append(trigger)
                    
                    # Mark as detected
                    await self._mark_as_detected(cache_key, hours=6)
        
        return triggers
    
    async def _evaluate_steam_detection(self, rule: AlertRule, prop_data: List[PropData]) -> List[AlertTrigger]:
        """Evaluate steam detection alert rule"""
        triggers = []
        
        # Group props by prop_id for steam analysis
        prop_groups = {}
        for prop in prop_data:
            if prop.prop_id not in prop_groups:
                prop_groups[prop.prop_id] = []
            prop_groups[prop.prop_id].append(prop)
        
        # Check each prop for steam
        for prop_id, props in prop_groups.items():
            if len(props) >= 2:  # Need multiple books for steam detection
                try:
                    if self.odds_service:
                        steam_data = await self.odds_service.detect_steam_movement(prop_id)
                    else:
                        steam_data = None
                    
                    if steam_data and steam_data.get('steam_detected'):
                        # Get representative prop for the alert
                        representative_prop = props[0]
                        
                        trigger = AlertTrigger(
                            trigger_id=self._generate_trigger_id(rule.rule_id, prop_id, "steam_detection"),
                            rule_id=rule.rule_id,
                            user_id=rule.user_id,
                            prop_data=representative_prop,
                            trigger_type=AlertRuleType.STEAM_DETECTION,
                            severity='high',  # Steam is always high priority
                            message=f"Steam detected: {representative_prop.player_name} {representative_prop.market}",
                            data={
                                'books_moving': steam_data.get('books_moving', []),
                                'movement_size': steam_data.get('movement_size', 0),
                                'confidence_score': steam_data.get('confidence_score', 0),
                                'synchronized_window': steam_data.get('synchronized_window_minutes', 0),
                                'books_count': len(props)
                            },
                            triggered_at=datetime.now(timezone.utc),
                            expires_at=datetime.now(timezone.utc) + timedelta(minutes=30)
                        )
                        triggers.append(trigger)
                        
                except Exception as e:
                    logger.error(f"Error detecting steam for {prop_id}: {e}")
        
        return triggers
    
    async def _evaluate_arbitrage_opportunity(self, rule: AlertRule, prop_data: List[PropData]) -> List[AlertTrigger]:
        """Evaluate arbitrage opportunity alert rule"""
        triggers = []
        min_profit = rule.conditions.get('min_profit_percentage', 1.0)
        
        # Group props by market for arbitrage analysis
        market_groups = {}
        for prop in prop_data:
            market_key = f"{prop.player_name}:{prop.market}"
            if market_key not in market_groups:
                market_groups[market_key] = []
            market_groups[market_key].append(prop)
        
        # Check each market for arbitrage opportunities
        for market_key, props in market_groups.items():
            if len(props) >= 2:  # Need multiple books
                try:
                    # Simple arbitrage calculation
                    best_over = min(props, key=lambda p: p.over_odds or float('inf'))
                    best_under = min(props, key=lambda p: p.under_odds or float('inf'))
                    
                    if best_over.over_odds and best_under.under_odds:
                        # Calculate arbitrage profit
                        over_prob = self._odds_to_probability(best_over.over_odds)
                        under_prob = self._odds_to_probability(best_under.under_odds)
                        total_prob = over_prob + under_prob
                        
                        if total_prob < 1.0:  # Arbitrage exists
                            profit_margin = (1.0 - total_prob) * 100
                            
                            if profit_margin >= min_profit:
                                trigger = AlertTrigger(
                                    trigger_id=self._generate_trigger_id(rule.rule_id, market_key, "arbitrage"),
                                    rule_id=rule.rule_id,
                                    user_id=rule.user_id,
                                    prop_data=best_over,  # Use over side as representative
                                    trigger_type=AlertRuleType.ARBITRAGE_OPPORTUNITY,
                                    severity=self._calculate_arbitrage_severity(profit_margin),
                                    message=f"Arbitrage opportunity: {profit_margin:.2f}% profit on {best_over.player_name} {best_over.market}",
                                    data={
                                        'profit_margin': profit_margin,
                                        'min_profit_threshold': min_profit,
                                        'over_book': best_over.sportsbook,
                                        'over_odds': best_over.over_odds,
                                        'under_book': best_under.sportsbook,
                                        'under_odds': best_under.under_odds,
                                        'total_implied_probability': total_prob
                                    },
                                    triggered_at=datetime.now(timezone.utc),
                                    expires_at=datetime.now(timezone.utc) + timedelta(minutes=15)
                                )
                                triggers.append(trigger)
                                
                except Exception as e:
                    logger.error(f"Error evaluating arbitrage for {market_key}: {e}")
        
        return triggers
    
    async def _process_alert_triggers(self, triggers: List[AlertTrigger]):
        """Process and dispatch alert triggers"""
        for trigger in triggers:
            try:
                # Check deduplication
                if await self._is_duplicate_trigger(trigger):
                    self.stats['alerts_deduplicated'] += 1
                    continue
                
                # Convert to AlertEvent for dispatcher
                alert_event = self._trigger_to_alert_event(trigger)
                
                # Dispatch alert
                success = await self.alert_dispatcher.dispatch_alert(alert_event)
                
                if success:
                    self.stats['alerts_triggered'] += 1
                    # Update rule last triggered time
                    if trigger.rule_id in self.active_rules:
                        self.active_rules[trigger.rule_id].last_triggered = trigger.triggered_at
                    
                    # Store trigger for deduplication
                    self.triggered_alerts[trigger.trigger_id] = trigger
                    await self._mark_trigger_processed(trigger)
                    
                    logger.info(f"Alert triggered: {trigger.message}")
                else:
                    logger.warning(f"Failed to dispatch alert: {trigger.trigger_id}")
                    
            except Exception as e:
                logger.error(f"Error processing trigger {trigger.trigger_id}: {e}")
    
    async def _get_current_prop_data(self) -> List[PropData]:
        """Get current prop data for evaluation"""
        try:
            # This would integrate with actual prop data sources
            # For now, return mock data to establish the pattern
            
            mock_props = [
                PropData(
                    prop_id="mock_prop_1",
                    player_name="LeBron James",
                    team="LAL",
                    opponent="GSW",
                    sport="NBA",
                    market="Points",
                    line=25.5,
                    over_odds=-110,
                    under_odds=-110,
                    sportsbook="FanDuel",
                    implied_probability=52.4,
                    projection=28.2,
                    edge_percentage=12.5,
                    ev_value=8.3,
                    confidence_score=87.2,
                    last_updated=datetime.now(timezone.utc)
                ),
                PropData(
                    prop_id="mock_prop_2", 
                    player_name="Stephen Curry",
                    team="GSW",
                    opponent="LAL",
                    sport="NBA",
                    market="3-Pointers Made",
                    line=4.5,
                    over_odds=+105,
                    under_odds=-125,
                    sportsbook="DraftKings",
                    implied_probability=48.8,
                    projection=5.1,
                    edge_percentage=15.2,
                    ev_value=11.7,
                    confidence_score=91.3,
                    last_updated=datetime.now(timezone.utc)
                )
            ]
            
            return mock_props
            
        except Exception as e:
            logger.error(f"Error getting prop data: {e}")
            return []
    
    async def _load_active_rules(self):
        """Load active alert rules from database/cache"""
        try:
            # Mock rules for testing - in production would load from database
            mock_rules = [
                AlertRule(
                    rule_id="rule_ev_threshold_1",
                    user_id=1,
                    rule_type=AlertRuleType.EV_THRESHOLD,
                    is_active=True,
                    conditions={
                        'min_ev_percentage': 8.0,
                        'min_confidence': 85.0
                    },
                    cooldown_minutes=30,
                    priority='high',
                    created_at=datetime.now(timezone.utc)
                ),
                AlertRule(
                    rule_id="rule_line_movement_1",
                    user_id=1,
                    rule_type=AlertRuleType.LINE_MOVEMENT,
                    is_active=True,
                    conditions={
                        'movement_threshold': 1.5,
                        'time_window_hours': 2
                    },
                    cooldown_minutes=15,
                    priority='medium',
                    created_at=datetime.now(timezone.utc)
                ),
                AlertRule(
                    rule_id="rule_edge_emergence_1",
                    user_id=1,
                    rule_type=AlertRuleType.EDGE_EMERGENCE,
                    is_active=True,
                    conditions={
                        'min_edge_percentage': 12.0,
                        'min_confidence': 80.0
                    },
                    cooldown_minutes=60,
                    priority='high',
                    created_at=datetime.now(timezone.utc)
                )
            ]
            
            self.active_rules = {rule.rule_id: rule for rule in mock_rules}
            logger.info(f"Loaded {len(self.active_rules)} active alert rules")
            
        except Exception as e:
            logger.error(f"Error loading active rules: {e}")
    
    def _should_evaluate_rule(self, rule: AlertRule) -> bool:
        """Check if rule should be evaluated based on cooldown"""
        if not rule.is_active:
            return False
        
        if rule.last_triggered is None:
            return True
        
        time_since_last = datetime.now(timezone.utc) - rule.last_triggered
        cooldown_delta = timedelta(minutes=rule.cooldown_minutes)
        
        return time_since_last >= cooldown_delta
    
    async def _is_duplicate_trigger(self, trigger: AlertTrigger) -> bool:
        """Check if trigger is a duplicate within the deduplication window"""
        dedup_key = self._generate_dedup_key(trigger)
        
        if dedup_key in self.deduplication_cache:
            last_time = self.deduplication_cache[dedup_key]
            time_diff = trigger.triggered_at - last_time
            
            # 15 minute deduplication window
            if time_diff < timedelta(minutes=15):
                return True
        
        return False
    
    async def _mark_trigger_processed(self, trigger: AlertTrigger):
        """Mark trigger as processed for deduplication"""
        dedup_key = self._generate_dedup_key(trigger)
        self.deduplication_cache[dedup_key] = trigger.triggered_at
    
    def _generate_trigger_id(self, rule_id: str, prop_id: str, trigger_type: str) -> str:
        """Generate unique trigger ID"""
        content = f"{rule_id}:{prop_id}:{trigger_type}:{datetime.now(timezone.utc).isoformat()}"
        return hashlib.md5(content.encode()).hexdigest()
    
    def _generate_dedup_key(self, trigger: AlertTrigger) -> str:
        """Generate deduplication key"""
        return f"{trigger.rule_id}:{trigger.prop_data.prop_id}:{trigger.trigger_type.value}"
    
    def _trigger_to_alert_event(self, trigger: AlertTrigger) -> AlertEvent:
        """Convert AlertTrigger to AlertEvent for dispatcher"""
        return AlertEvent(
            alert_rule_id=int(trigger.rule_id.split('_')[-1]) if trigger.rule_id.split('_')[-1].isdigit() else 1,
            user_id=trigger.user_id,
            event_type=AlertEventType.EDGE_THRESHOLD,  # Map trigger types to event types
            severity=trigger.severity,
            title=f"PropFinder Alert: {trigger.prop_data.player_name} {trigger.prop_data.market}",
            message=trigger.message,
            data=trigger.data,
            triggered_at=trigger.triggered_at,
            expires_at=trigger.expires_at
        )
    
    # Utility methods for calculations
    
    def _calculate_ev_severity(self, ev_percentage: float) -> str:
        """Calculate severity based on EV percentage"""
        if ev_percentage >= 15.0:
            return 'critical'
        elif ev_percentage >= 10.0:
            return 'high'
        elif ev_percentage >= 5.0:
            return 'medium'
        else:
            return 'low'
    
    def _calculate_movement_severity(self, movement: float) -> str:
        """Calculate severity based on line movement"""
        if abs(movement) >= 3.0:
            return 'high'
        elif abs(movement) >= 1.5:
            return 'medium'
        else:
            return 'low'
    
    def _calculate_edge_severity(self, edge_percentage: float) -> str:
        """Calculate severity based on edge percentage"""
        if edge_percentage >= 20.0:
            return 'critical'
        elif edge_percentage >= 15.0:
            return 'high'
        elif edge_percentage >= 10.0:
            return 'medium'
        else:
            return 'low'
    
    def _calculate_arbitrage_severity(self, profit_margin: float) -> str:
        """Calculate severity based on arbitrage profit margin"""
        if profit_margin >= 5.0:
            return 'critical'
        elif profit_margin >= 3.0:
            return 'high'
        elif profit_margin >= 1.5:
            return 'medium'
        else:
            return 'low'
    
    def _odds_to_probability(self, american_odds: int) -> float:
        """Convert American odds to implied probability"""
        if american_odds > 0:
            return 100 / (american_odds + 100)
        else:
            return abs(american_odds) / (abs(american_odds) + 100)
    
    async def _is_recently_detected(self, cache_key: str) -> bool:
        """Check if item was recently detected"""
        try:
            if self.cache_service:
                result = await self.cache_service.get(cache_key)
                return result is not None
            return False
        except Exception:
            return False
    
    async def _mark_as_detected(self, cache_key: str, hours: int):
        """Mark item as detected in cache"""
        try:
            if self.cache_service:
                await self.cache_service.set(
                    cache_key, 
                    datetime.now(timezone.utc).isoformat(), 
                    ttl=hours * 3600
                )
        except Exception as e:
            logger.error(f"Error marking as detected: {e}")
    
    async def _rule_sync_loop(self):
        """Periodically sync rules from database"""
        while self.is_running:
            try:
                await self._load_active_rules()
                await asyncio.sleep(300)  # Sync every 5 minutes
            except Exception as e:
                logger.error(f"Error in rule sync loop: {e}")
                await asyncio.sleep(60)
    
    async def _cleanup_loop(self):
        """Cleanup old data and expired items"""
        while self.is_running:
            try:
                await self._cleanup_expired_data()
                await asyncio.sleep(600)  # Cleanup every 10 minutes
            except Exception as e:
                logger.error(f"Error in cleanup loop: {e}")
                await asyncio.sleep(300)
    
    async def _cleanup_expired_data(self):
        """Clean up expired triggers and cache entries"""
        now = datetime.now(timezone.utc)
        
        # Clean up triggered alerts
        expired_triggers = [
            trigger_id for trigger_id, trigger in self.triggered_alerts.items()
            if trigger.expires_at and now > trigger.expires_at
        ]
        
        for trigger_id in expired_triggers:
            del self.triggered_alerts[trigger_id]
        
        # Clean up deduplication cache (older than 1 hour)
        expired_dedup = [
            key for key, timestamp in self.deduplication_cache.items()
            if now - timestamp > timedelta(hours=1)
        ]
        
        for key in expired_dedup:
            del self.deduplication_cache[key]
        
        if expired_triggers or expired_dedup:
            logger.debug(f"Cleaned up {len(expired_triggers)} triggers and {len(expired_dedup)} dedup entries")
    
    async def get_engine_status(self) -> Dict[str, Any]:
        """Get current engine status and statistics"""
        return {
            'status': 'running' if self.is_running else 'stopped',
            'stats': self.stats.copy(),
            'active_rules': len(self.active_rules),
            'triggered_alerts': len(self.triggered_alerts),
            'deduplication_cache_size': len(self.deduplication_cache),
            'evaluation_interval': self.evaluation_interval,
            'max_concurrent_evaluations': self.max_concurrent_evaluations
        }


# Global instance
alert_engine_core = AlertEngineCore()

async def get_alert_engine_core() -> AlertEngineCore:
    """Get the global alert engine core instance"""
    return alert_engine_core
