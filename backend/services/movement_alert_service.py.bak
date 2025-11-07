"""
Movement-Based Alerts Service

Lightweight watcher service that polls enriched opportunities and emits events when:
- Line movement exceeds configurable thresholds (abs(lineChange) >= threshold)
- Odds change crosses significant bands
- CLV degradation occurs
- Steam movement is detected across multiple books

Integrates with the CLV foundation and existing alerting infrastructure.
"""

import asyncio
import logging
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Set, Any, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import json

from backend.services.simple_propfinder_service import SimplePropFinderService
from backend.services.line_movement_service import LineMovementService
from backend.services.alerting.alert_dispatcher import AlertDispatcher
from backend.services.alerting.rule_evaluator import AlertEvent, AlertEventType

logger = logging.getLogger(__name__)


class MovementAlertType(Enum):
    """Types of movement-based alerts"""
    LINE_MOVEMENT = "line_movement"
    ODDS_BAND_CROSS = "odds_band_cross"  
    CLV_DEGRADATION = "clv_degradation"
    STEAM_DETECTION = "steam_detection"
    RAPID_MOVEMENT = "rapid_movement"
    REVERSAL_PATTERN = "reversal_pattern"


@dataclass
class MovementThreshold:
    """Configuration for movement alert thresholds"""
    alert_type: MovementAlertType
    threshold_value: float
    time_window_minutes: int
    cooldown_minutes: int
    severity_mapping: Dict[float, str]
    enabled: bool = True


@dataclass 
class MovementAlert:
    """Represents a movement-based alert"""
    alert_id: str
    prop_id: str
    player_name: str
    market: str
    sport: str
    alert_type: MovementAlertType
    severity: str
    message: str
    current_line: Optional[float]
    previous_line: Optional[float]
    line_change: Optional[float]
    current_odds: Optional[int]
    previous_odds: Optional[int]
    clv_impact: Optional[float]
    sportsbooks_affected: List[str]
    timestamp: datetime
    expires_at: datetime
    data: Dict[str, Any]


class MovementAlertService:
    """
    Movement-Based Alerts Service
    
    Monitors line movements and CLV changes in real-time, emitting alerts
    when significant movements are detected based on configurable thresholds.
    """
    
    def __init__(self):
        """Initialize movement alert service"""
        self.is_running = False
        self.polling_interval_seconds = 30
        self.max_opportunities_per_poll = 100
        
        # Service dependencies
        self.propfinder_service = SimplePropFinderService()
        self.line_movement_service = LineMovementService()
        self.alert_dispatcher = AlertDispatcher.get_instance()
        
        # Alert configuration
        self.movement_thresholds = self._get_default_thresholds()
        
        # State tracking
        self.last_poll_time = None
        self.alert_cooldowns: Dict[str, datetime] = {}
        self.movement_history: Dict[str, List[Dict]] = {}
        self.active_alerts: Dict[str, MovementAlert] = {}
        
        # Performance stats
        self.stats = {
            'polls_completed': 0,
            'opportunities_processed': 0,
            'alerts_triggered': 0,
            'steam_detections': 0,
            'clv_degradations': 0,
            'last_poll_duration_ms': 0,
            'last_poll_time': None
        }
        
        logger.info("MovementAlertService initialized with default thresholds")
    
    def _get_default_thresholds(self) -> Dict[MovementAlertType, MovementThreshold]:
        """Get default movement alert thresholds"""
        return {
            MovementAlertType.LINE_MOVEMENT: MovementThreshold(
                alert_type=MovementAlertType.LINE_MOVEMENT,
                threshold_value=1.0,  # 1 point movement
                time_window_minutes=60,
                cooldown_minutes=15,
                severity_mapping={
                    3.0: "critical",
                    2.0: "high", 
                    1.0: "medium",
                    0.5: "low"
                }
            ),
            MovementAlertType.ODDS_BAND_CROSS: MovementThreshold(
                alert_type=MovementAlertType.ODDS_BAND_CROSS,
                threshold_value=25,  # 25 odds change
                time_window_minutes=30,
                cooldown_minutes=10,
                severity_mapping={
                    50: "high",
                    25: "medium",
                    15: "low"
                }
            ),
            MovementAlertType.CLV_DEGRADATION: MovementThreshold(
                alert_type=MovementAlertType.CLV_DEGRADATION,
                threshold_value=5.0,  # 5% CLV loss
                time_window_minutes=120,
                cooldown_minutes=30,
                severity_mapping={
                    10.0: "high",
                    5.0: "medium",
                    2.0: "low"
                }
            ),
            MovementAlertType.STEAM_DETECTION: MovementThreshold(
                alert_type=MovementAlertType.STEAM_DETECTION,
                threshold_value=2,  # Min 2 books moving
                time_window_minutes=15,
                cooldown_minutes=5,
                severity_mapping={
                    5: "critical",
                    3: "high",
                    2: "medium"
                }
            ),
            MovementAlertType.RAPID_MOVEMENT: MovementThreshold(
                alert_type=MovementAlertType.RAPID_MOVEMENT,
                threshold_value=2.0,  # 2+ points in rapid succession
                time_window_minutes=10,
                cooldown_minutes=20,
                severity_mapping={
                    4.0: "critical",
                    3.0: "high",
                    2.0: "medium"
                }
            )
        }
    
    async def start(self):
        """Start the movement alert monitoring service"""
        if self.is_running:
            logger.warning("Movement alert service already running")
            return
        
        self.is_running = True
        logger.info("Starting Movement Alert Service polling loop")
        
        try:
            # Start main monitoring loop
            monitoring_task = asyncio.create_task(self._monitoring_loop())
            
            # Start cleanup task
            cleanup_task = asyncio.create_task(self._cleanup_loop())
            
            # Wait for tasks
            await asyncio.gather(
                monitoring_task,
                cleanup_task,
                return_exceptions=True
            )
            
        except Exception as e:
            logger.error(f"Error in movement alert service: {e}")
            raise
        finally:
            self.is_running = False
            logger.info("Movement Alert Service stopped")
    
    async def stop(self):
        """Stop the movement alert service"""
        self.is_running = False
        logger.info("Stopping Movement Alert Service")
    
    async def _monitoring_loop(self):
        """Main monitoring loop"""
        logger.info("Starting movement alert monitoring loop")
        
        while self.is_running:
            try:
                start_time = datetime.now()
                
                # Poll opportunities and analyze movements
                await self._poll_and_analyze()
                
                # Update performance metrics
                duration = (datetime.now() - start_time).total_seconds() * 1000
                self.stats['last_poll_duration_ms'] = int(duration)
                self.stats['last_poll_time'] = start_time
                self.stats['polls_completed'] += 1
                
                # Wait for next poll
                await asyncio.sleep(self.polling_interval_seconds)
                
            except Exception as e:
                logger.error(f"Error in monitoring loop: {e}")
                await asyncio.sleep(60)  # Back off on errors
        
        logger.info("Movement alert monitoring loop stopped")
    
    async def _poll_and_analyze(self):
        """Poll opportunities and analyze for movement alerts"""
        try:
            # Get current opportunities with CLV data
            response = await self.propfinder_service.get_opportunities()
            
            opportunities = response.get('opportunities', [])
            if not opportunities:
                logger.debug("No opportunities available for movement analysis")
                return
            
            # Limit opportunities for processing
            if len(opportunities) > self.max_opportunities_per_poll:
                opportunities = opportunities[:self.max_opportunities_per_poll]
            
            self.stats['opportunities_processed'] += len(opportunities)
            
            # Analyze each opportunity for movements
            analysis_tasks = []
            for opportunity in opportunities:
                task = asyncio.create_task(
                    self._analyze_opportunity_movement(opportunity)
                )
                analysis_tasks.append(task)
            
            # Execute analyses concurrently
            if analysis_tasks:
                results = await asyncio.gather(*analysis_tasks, return_exceptions=True)
                
                # Process results and emit alerts
                alerts = []
                for result in results:
                    if isinstance(result, Exception):
                        logger.error(f"Error analyzing opportunity movement: {result}")
                    elif result and isinstance(result, list):
                        alerts.extend(result)
                
                # Dispatch alerts
                if alerts:
                    await self._dispatch_movement_alerts(alerts)
                    logger.debug(f"Processed {len(opportunities)} opportunities, generated {len(alerts)} alerts")
                
        except Exception as e:
            logger.error(f"Error in _poll_and_analyze: {e}")
    
    async def _analyze_opportunity_movement(self, opportunity) -> List[MovementAlert]:
        """Analyze a single opportunity for movement patterns"""
        alerts = []
        
        try:
            prop_id = self._build_prop_id(opportunity)
            
            # Get historical movement data from line movement service
            history = self.line_movement_service.get_history(prop_id, limit=10)
            
            # Build movement analysis from history
            movement_data = self._build_movement_analysis(history, opportunity)
            
            if not movement_data:
                return alerts
            
            # Check each alert type
            alerts.extend(await self._check_line_movement_alert(opportunity, movement_data))
            alerts.extend(await self._check_odds_band_cross_alert(opportunity, movement_data))
            alerts.extend(await self._check_clv_degradation_alert(opportunity, movement_data))
            alerts.extend(await self._check_steam_detection_alert(opportunity, movement_data))
            alerts.extend(await self._check_rapid_movement_alert(opportunity, movement_data))
            
        except Exception as e:
            logger.error(f"Error analyzing opportunity movement: {e}")
        
        return alerts
    
    async def _check_line_movement_alert(self, opportunity, movement_data: Dict) -> List[MovementAlert]:
        """Check for significant line movement alerts"""
        alerts = []
        threshold_config = self.movement_thresholds[MovementAlertType.LINE_MOVEMENT]
        
        if not threshold_config.enabled:
            return alerts
        
        try:
            line_change = movement_data.get('lineChange', 0)
            if line_change is None:
                return alerts
            
            abs_change = abs(float(line_change))
            
            # Check if movement exceeds threshold
            if abs_change >= threshold_config.threshold_value:
                prop_id = self._build_prop_id(opportunity)
                
                # Check cooldown
                if self._is_in_cooldown(prop_id, MovementAlertType.LINE_MOVEMENT, threshold_config.cooldown_minutes):
                    return alerts
                
                # Determine severity
                severity = self._calculate_severity(abs_change, threshold_config.severity_mapping)
                
                # Create alert
                alert = MovementAlert(
                    alert_id=f"line_mov_{prop_id}_{int(datetime.now().timestamp())}",
                    prop_id=prop_id,
                    player_name=opportunity.player,
                    market=str(opportunity.market.value if hasattr(opportunity.market, 'value') else opportunity.market),
                    sport=str(opportunity.sport.value if hasattr(opportunity.sport, 'value') else opportunity.sport),
                    alert_type=MovementAlertType.LINE_MOVEMENT,
                    severity=severity,
                    message=f"Line moved {line_change:+.1f} for {opportunity.player} {str(opportunity.market.value if hasattr(opportunity.market, 'value') else opportunity.market)}",
                    current_line=opportunity.line,
                    previous_line=opportunity.line - line_change if opportunity.line else None,
                    line_change=line_change,
                    current_odds=opportunity.odds,
                    previous_odds=movement_data.get('previousOdds'),
                    clv_impact=self._calculate_clv_impact(line_change, opportunity.clvPercent),
                    sportsbooks_affected=self._get_sportsbooks(opportunity),
                    timestamp=datetime.now(timezone.utc),
                    expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
                    data={
                        'movement_velocity': movement_data.get('velocity'),
                        'time_window': threshold_config.time_window_minutes,
                        'threshold_exceeded': abs_change - threshold_config.threshold_value
                    }
                )
                
                alerts.append(alert)
                self._set_cooldown(prop_id, MovementAlertType.LINE_MOVEMENT)
                
        except Exception as e:
            logger.error(f"Error checking line movement alert: {e}")
        
        return alerts
    
    async def _check_odds_band_cross_alert(self, opportunity, movement_data: Dict) -> List[MovementAlert]:
        """Check for odds band crossing alerts"""
        alerts = []
        threshold_config = self.movement_thresholds[MovementAlertType.ODDS_BAND_CROSS]
        
        if not threshold_config.enabled:
            return alerts
        
        try:
            odds_change = movement_data.get('oddsChange', 0)
            if odds_change is None:
                return alerts
            
            abs_change = abs(int(odds_change))
            
            # Check if odds change crosses band threshold
            if abs_change >= threshold_config.threshold_value:
                prop_id = self._build_prop_id(opportunity)
                
                # Check cooldown
                if self._is_in_cooldown(prop_id, MovementAlertType.ODDS_BAND_CROSS, threshold_config.cooldown_minutes):
                    return alerts
                
                # Determine severity
                severity = self._calculate_severity(abs_change, threshold_config.severity_mapping)
                
                # Create alert
                alert = MovementAlert(
                    alert_id=f"odds_band_{prop_id}_{int(datetime.now().timestamp())}",
                    prop_id=prop_id,
                    player_name=opportunity.player,
                    market=opportunity.market,
                    sport=opportunity.sport,
                    alert_type=MovementAlertType.ODDS_BAND_CROSS,
                    severity=severity,
                    message=f"Odds shifted {odds_change:+d} for {opportunity.player} {opportunity.market}",
                    current_line=opportunity.line,
                    previous_line=None,
                    line_change=movement_data.get('lineChange'),
                    current_odds=opportunity.odds,
                    previous_odds=opportunity.odds - odds_change if opportunity.odds else None,
                    clv_impact=self._calculate_odds_clv_impact(odds_change, opportunity.clvPercent),
                    sportsbooks_affected=[opportunity.sportsbook],
                    timestamp=datetime.now(timezone.utc),
                    expires_at=datetime.now(timezone.utc) + timedelta(minutes=45),
                    data={
                        'odds_band_crossed': self._identify_odds_band(abs_change),
                        'direction': 'longer' if odds_change > 0 else 'shorter',
                        'threshold_exceeded': abs_change - threshold_config.threshold_value
                    }
                )
                
                alerts.append(alert)
                self._set_cooldown(prop_id, MovementAlertType.ODDS_BAND_CROSS)
                
        except Exception as e:
            logger.error(f"Error checking odds band cross alert: {e}")
        
        return alerts
    
    async def _check_clv_degradation_alert(self, opportunity, movement_data: Dict) -> List[MovementAlert]:
        """Check for CLV degradation alerts"""
        alerts = []
        threshold_config = self.movement_thresholds[MovementAlertType.CLV_DEGRADATION]
        
        if not threshold_config.enabled:
            return alerts
        
        try:
            current_clv = opportunity.clvPercent or 0
            historical_clv = movement_data.get('historicalCLV', current_clv)
            
            clv_degradation = historical_clv - current_clv
            
            # Check if CLV degradation exceeds threshold
            if clv_degradation >= threshold_config.threshold_value:
                prop_id = self._build_prop_id(opportunity)
                
                # Check cooldown
                if self._is_in_cooldown(prop_id, MovementAlertType.CLV_DEGRADATION, threshold_config.cooldown_minutes):
                    return alerts
                
                # Determine severity
                severity = self._calculate_severity(clv_degradation, threshold_config.severity_mapping)
                
                # Create alert
                alert = MovementAlert(
                    alert_id=f"clv_deg_{prop_id}_{int(datetime.now().timestamp())}",
                    prop_id=prop_id,
                    player_name=opportunity.player,
                    market=opportunity.market,
                    sport=opportunity.sport,
                    alert_type=MovementAlertType.CLV_DEGRADATION,
                    severity=severity,
                    message=f"CLV degraded {clv_degradation:.1f}% for {opportunity.player} {opportunity.market}",
                    current_line=opportunity.line,
                    previous_line=None,
                    line_change=movement_data.get('lineChange'),
                    current_odds=opportunity.odds,
                    previous_odds=None,
                    clv_impact=clv_degradation,
                    sportsbooks_affected=[opportunity.sportsbook],
                    timestamp=datetime.now(timezone.utc),
                    expires_at=datetime.now(timezone.utc) + timedelta(hours=2),
                    data={
                        'current_clv': current_clv,
                        'historical_clv': historical_clv,
                        'degradation_amount': clv_degradation,
                        'degradation_rate': clv_degradation / threshold_config.time_window_minutes
                    }
                )
                
                alerts.append(alert)
                self._set_cooldown(prop_id, MovementAlertType.CLV_DEGRADATION)
                
        except Exception as e:
            logger.error(f"Error checking CLV degradation alert: {e}")
        
        return alerts
    
    async def _check_steam_detection_alert(self, opportunity, movement_data: Dict) -> List[MovementAlert]:
        """Check for steam movement detection"""
        alerts = []
        threshold_config = self.movement_thresholds[MovementAlertType.STEAM_DETECTION]
        
        if not threshold_config.enabled:
            return alerts
        
        try:
            # Check if multiple sportsbooks are moving in sync
            steam_indicators = movement_data.get('steamIndicators', {})
            books_moving = steam_indicators.get('booksMoving', 0)
            sync_window = steam_indicators.get('syncWindowMinutes', 0)
            
            # Check if steam criteria met
            if (books_moving >= threshold_config.threshold_value and 
                sync_window <= threshold_config.time_window_minutes):
                
                prop_id = self._build_prop_id(opportunity)
                
                # Check cooldown
                if self._is_in_cooldown(prop_id, MovementAlertType.STEAM_DETECTION, threshold_config.cooldown_minutes):
                    return alerts
                
                # Determine severity based on books count
                severity = self._calculate_severity(books_moving, threshold_config.severity_mapping)
                
                # Create alert
                alert = MovementAlert(
                    alert_id=f"steam_{prop_id}_{int(datetime.now().timestamp())}",
                    prop_id=prop_id,
                    player_name=opportunity.player,
                    market=opportunity.market,
                    sport=opportunity.sport,
                    alert_type=MovementAlertType.STEAM_DETECTION,
                    severity=severity,
                    message=f"Steam detected: {books_moving} books moving on {opportunity.player} {opportunity.market}",
                    current_line=opportunity.line,
                    previous_line=None,
                    line_change=movement_data.get('lineChange'),
                    current_odds=opportunity.odds,
                    previous_odds=None,
                    clv_impact=self._calculate_steam_clv_impact(movement_data, opportunity.clvPercent),
                    sportsbooks_affected=steam_indicators.get('bookList', [opportunity.sportsbook]),
                    timestamp=datetime.now(timezone.utc),
                    expires_at=datetime.now(timezone.utc) + timedelta(minutes=30),
                    data={
                        'books_moving': books_moving,
                        'sync_window_minutes': sync_window,
                        'average_movement': steam_indicators.get('averageMovement', 0),
                        'confidence_score': steam_indicators.get('confidenceScore', 0)
                    }
                )
                
                alerts.append(alert)
                self._set_cooldown(prop_id, MovementAlertType.STEAM_DETECTION)
                self.stats['steam_detections'] += 1
                
        except Exception as e:
            logger.error(f"Error checking steam detection alert: {e}")
        
        return alerts
    
    async def _check_rapid_movement_alert(self, opportunity, movement_data: Dict) -> List[MovementAlert]:
        """Check for rapid successive movements"""
        alerts = []
        threshold_config = self.movement_thresholds[MovementAlertType.RAPID_MOVEMENT]
        
        if not threshold_config.enabled:
            return alerts
        
        try:
            prop_id = self._build_prop_id(opportunity)
            
            # Track movement history for this prop
            if prop_id not in self.movement_history:
                self.movement_history[prop_id] = []
            
            # Add current movement if significant
            current_line_change = movement_data.get('lineChange', 0)
            if abs(current_line_change) >= 0.5:  # Only track movements >= 0.5
                self.movement_history[prop_id].append({
                    'timestamp': datetime.now(timezone.utc),
                    'line_change': current_line_change,
                    'odds_change': movement_data.get('oddsChange', 0)
                })
            
            # Clean old history
            cutoff_time = datetime.now(timezone.utc) - timedelta(minutes=threshold_config.time_window_minutes)
            self.movement_history[prop_id] = [
                m for m in self.movement_history[prop_id] 
                if m['timestamp'] > cutoff_time
            ]
            
            # Calculate rapid movement score
            if len(self.movement_history[prop_id]) >= 2:
                total_movement = sum(abs(m['line_change']) for m in self.movement_history[prop_id])
                
                if total_movement >= threshold_config.threshold_value:
                    # Check cooldown
                    if self._is_in_cooldown(prop_id, MovementAlertType.RAPID_MOVEMENT, threshold_config.cooldown_minutes):
                        return alerts
                    
                    # Determine severity
                    severity = self._calculate_severity(total_movement, threshold_config.severity_mapping)
                    
                    # Create alert
                    alert = MovementAlert(
                        alert_id=f"rapid_{prop_id}_{int(datetime.now().timestamp())}",
                        prop_id=prop_id,
                        player_name=opportunity.player,
                        market=opportunity.market,
                        sport=opportunity.sport,
                        alert_type=MovementAlertType.RAPID_MOVEMENT,
                        severity=severity,
                        message=f"Rapid movement: {total_movement:.1f} total in {threshold_config.time_window_minutes}min for {opportunity.player} {opportunity.market}",
                        current_line=opportunity.line,
                        previous_line=None,
                        line_change=current_line_change,
                        current_odds=opportunity.odds,
                        previous_odds=None,
                        clv_impact=self._calculate_rapid_clv_impact(total_movement, opportunity.clvPercent),
                        sportsbooks_affected=[opportunity.sportsbook],
                        timestamp=datetime.now(timezone.utc),
                        expires_at=datetime.now(timezone.utc) + timedelta(minutes=20),
                        data={
                            'total_movement': total_movement,
                            'movement_count': len(self.movement_history[prop_id]),
                            'time_window_minutes': threshold_config.time_window_minutes,
                            'movement_velocity': total_movement / threshold_config.time_window_minutes
                        }
                    )
                    
                    alerts.append(alert)
                    self._set_cooldown(prop_id, MovementAlertType.RAPID_MOVEMENT)
                    
        except Exception as e:
            logger.error(f"Error checking rapid movement alert: {e}")
        
        return alerts
    
    async def _dispatch_movement_alerts(self, alerts: List[MovementAlert]):
        """Dispatch movement alerts through the alert system"""
        for alert in alerts:
            try:
                # Convert to AlertEvent for dispatcher
                alert_event = self._movement_alert_to_event(alert)
                
                # Dispatch through existing alert infrastructure
                success = await self.alert_dispatcher.dispatch_alert(alert_event)
                
                if success:
                    self.active_alerts[alert.alert_id] = alert
                    self.stats['alerts_triggered'] += 1
                    logger.info(f"Movement alert dispatched: {alert.message}")
                else:
                    logger.warning(f"Failed to dispatch movement alert: {alert.alert_id}")
                    
            except Exception as e:
                logger.error(f"Error dispatching alert {alert.alert_id}: {e}")
    
    def _movement_alert_to_event(self, alert: MovementAlert) -> AlertEvent:
        """Convert MovementAlert to AlertEvent for dispatcher"""
        return AlertEvent(
            alert_rule_id=1,  # Default rule ID for movement alerts
            user_id=1,  # Default user - could be parameterized
            event_type=AlertEventType.LINE_MOVEMENT,  # Map movement types to existing types
            severity=alert.severity,
            title=f"Movement Alert: {alert.player_name} {alert.market}",
            message=alert.message,
            data={
                'alert_type': alert.alert_type.value,
                'prop_id': alert.prop_id,
                'current_line': alert.current_line,
                'line_change': alert.line_change,
                'current_odds': alert.current_odds,
                'clv_impact': alert.clv_impact,
                'sportsbooks_affected': alert.sportsbooks_affected,
                **alert.data
            },
            triggered_at=alert.timestamp,
            expires_at=alert.expires_at
        )
    
    # Utility methods
    
    def _build_prop_id(self, opportunity) -> str:
        """Build consistent prop ID from opportunity"""
        sport = opportunity.sport.value if hasattr(opportunity.sport, 'value') else str(opportunity.sport)
        market = opportunity.market.value if hasattr(opportunity.market, 'value') else str(opportunity.market)
        return f"{sport}:{opportunity.player}:{market}"
    
    def _build_movement_analysis(self, history: List[Dict[str, Any]], opportunity) -> Dict[str, Any]:
        """Build movement analysis from historical data"""
        if not history:
            return {
                'lineChange': 0,
                'oddsChange': 0,
                'previousLine': getattr(opportunity, 'line', None),
                'previousOdds': getattr(opportunity, 'odds', None),
                'velocity': 0,
                'historicalCLV': getattr(opportunity, 'clvPercent', 0),
                'steamIndicators': {
                    'booksMoving': 0,
                    'syncWindowMinutes': 0,
                    'bookList': [],
                    'averageMovement': 0,
                    'confidenceScore': 0
                }
            }
        
        # Calculate movement from most recent to current
        latest_history = history[0] if history else {}
        current_line = getattr(opportunity, 'line', None)
        current_odds = getattr(opportunity, 'odds', None)
        
        # Extract historical values
        previous_line = latest_history.get('line', current_line)
        previous_odds = latest_history.get('odds', current_odds)
        
        # Calculate changes
        line_change = 0
        if current_line is not None and previous_line is not None:
            line_change = current_line - previous_line
            
        odds_change = 0
        if current_odds is not None and previous_odds is not None:
            odds_change = current_odds - previous_odds
        
        # Simple velocity calculation (change per hour)
        velocity = 0
        if history:
            time_diff_hours = 1  # Assume 1 hour for now
            velocity = line_change / time_diff_hours if time_diff_hours > 0 else 0
        
        # Try to get sportsbook info
        sportsbook = "Unknown"
        if hasattr(opportunity, 'bookmakers') and opportunity.bookmakers:
            sportsbook = opportunity.bookmakers[0].name
        elif hasattr(opportunity, 'sportsbook'):
            sportsbook = opportunity.sportsbook
        
        return {
            'lineChange': line_change,
            'oddsChange': odds_change,
            'previousLine': previous_line,
            'previousOdds': previous_odds,
            'velocity': velocity,
            'historicalCLV': getattr(opportunity, 'clvPercent', 0),
            'steamIndicators': {
                'booksMoving': 1,  # Single book for now
                'syncWindowMinutes': 15,
                'bookList': [sportsbook],
                'averageMovement': abs(line_change),
                'confidenceScore': min(abs(line_change) * 0.3, 1.0)  # Simple confidence
            }
        }
    
    
    def _get_sportsbooks(self, opportunity) -> List[str]:
        """Extract sportsbook names from opportunity"""
        sportsbooks = []
        
        if hasattr(opportunity, 'bookmakers') and opportunity.bookmakers:
            sportsbooks = [book.name for book in opportunity.bookmakers]
        elif hasattr(opportunity, 'sportsbook') and opportunity.sportsbook:
            sportsbooks = [opportunity.sportsbook]
        
        return sportsbooks if sportsbooks else ["Unknown"]
    
    def _is_in_cooldown(self, prop_id: str, alert_type: MovementAlertType, cooldown_minutes: int) -> bool:
        """Check if prop/alert type is in cooldown period"""
        cooldown_key = f"{prop_id}:{alert_type.value}"
        
        if cooldown_key in self.alert_cooldowns:
            last_alert = self.alert_cooldowns[cooldown_key]
            time_diff = datetime.now(timezone.utc) - last_alert
            return time_diff < timedelta(minutes=cooldown_minutes)
        
        return False
    
    def _set_cooldown(self, prop_id: str, alert_type: MovementAlertType):
        """Set cooldown for prop/alert type"""
        cooldown_key = f"{prop_id}:{alert_type.value}"
        self.alert_cooldowns[cooldown_key] = datetime.now(timezone.utc)
    
    def _calculate_severity(self, value: float, severity_mapping: Dict[float, str]) -> str:
        """Calculate alert severity based on threshold mappings"""
        for threshold in sorted(severity_mapping.keys(), reverse=True):
            if value >= threshold:
                return severity_mapping[threshold]
        return "low"
    
    def _calculate_clv_impact(self, line_change: float, current_clv: Optional[float]) -> Optional[float]:
        """Calculate CLV impact of line movement"""
        if current_clv is None or line_change == 0:
            return None
        
        # Estimate CLV impact (simplified calculation)
        # Negative line change typically hurts CLV for Over bets
        clv_impact = -line_change * 0.5  # Rough estimate
        return round(clv_impact, 2)
    
    def _calculate_odds_clv_impact(self, odds_change: int, current_clv: Optional[float]) -> Optional[float]:
        """Calculate CLV impact of odds movement"""
        if current_clv is None or odds_change == 0:
            return None
        
        # Odds getting longer (positive change) can improve CLV
        # Odds getting shorter (negative change) hurts CLV  
        clv_impact = odds_change * 0.02  # Rough estimate: 1 odds point = 0.02% CLV
        return round(clv_impact, 2)
    
    def _calculate_steam_clv_impact(self, movement_data: Dict, current_clv: Optional[float]) -> Optional[float]:
        """Calculate CLV impact of steam movement"""
        if current_clv is None:
            return None
        
        # Steam movement typically indicates CLV degradation
        steam_strength = movement_data.get('steamIndicators', {}).get('confidenceScore', 0)
        clv_impact = -(steam_strength * 2.0)  # Steam reduces CLV
        return round(clv_impact, 2)
    
    def _calculate_rapid_clv_impact(self, total_movement: float, current_clv: Optional[float]) -> Optional[float]:
        """Calculate CLV impact of rapid movement"""
        if current_clv is None:
            return None
        
        # Rapid movement often indicates sharp action, reducing CLV
        clv_impact = -(total_movement * 0.3)
        return round(clv_impact, 2)
    
    def _identify_odds_band(self, odds_change: int) -> str:
        """Identify which odds band was crossed"""
        if odds_change >= 50:
            return "major_band"
        elif odds_change >= 25:
            return "significant_band"
        else:
            return "minor_band"
    
    async def _cleanup_loop(self):
        """Cleanup old alerts and movement history"""
        while self.is_running:
            try:
                await self._cleanup_expired_data()
                await asyncio.sleep(300)  # Cleanup every 5 minutes
            except Exception as e:
                logger.error(f"Error in cleanup loop: {e}")
                await asyncio.sleep(60)
    
    async def _cleanup_expired_data(self):
        """Clean up expired alerts and old movement history"""
        now = datetime.now(timezone.utc)
        
        # Clean up expired alerts
        expired_alerts = [
            alert_id for alert_id, alert in self.active_alerts.items()
            if alert.expires_at and now > alert.expires_at
        ]
        
        for alert_id in expired_alerts:
            del self.active_alerts[alert_id]
        
        # Clean up old cooldowns (older than 2 hours)
        expired_cooldowns = [
            key for key, timestamp in self.alert_cooldowns.items()
            if now - timestamp > timedelta(hours=2)
        ]
        
        for key in expired_cooldowns:
            del self.alert_cooldowns[key]
        
        # Clean up old movement history (older than 1 hour)
        for prop_id in list(self.movement_history.keys()):
            cutoff_time = now - timedelta(hours=1)
            self.movement_history[prop_id] = [
                m for m in self.movement_history[prop_id] 
                if m['timestamp'] > cutoff_time
            ]
            
            # Remove empty histories
            if not self.movement_history[prop_id]:
                del self.movement_history[prop_id]
        
        if expired_alerts or expired_cooldowns:
            logger.debug(f"Cleaned up {len(expired_alerts)} expired alerts and {len(expired_cooldowns)} cooldowns")
    
    async def get_service_status(self) -> Dict[str, Any]:
        """Get current service status and statistics"""
        return {
            'status': 'running' if self.is_running else 'stopped',
            'stats': self.stats.copy(),
            'active_alerts': len(self.active_alerts),
            'alert_cooldowns': len(self.alert_cooldowns),
            'movement_history_props': len(self.movement_history),
            'polling_interval_seconds': self.polling_interval_seconds,
            'thresholds': {
                alert_type.value: {
                    'threshold_value': threshold.threshold_value,
                    'enabled': threshold.enabled,
                    'cooldown_minutes': threshold.cooldown_minutes
                }
                for alert_type, threshold in self.movement_thresholds.items()
            }
        }
    
    def update_threshold(self, alert_type: MovementAlertType, threshold_value: float):
        """Update alert threshold configuration"""
        if alert_type in self.movement_thresholds:
            self.movement_thresholds[alert_type].threshold_value = threshold_value
            logger.info(f"Updated {alert_type.value} threshold to {threshold_value}")
    
    def enable_alert_type(self, alert_type: MovementAlertType, enabled: bool = True):
        """Enable/disable specific alert type"""
        if alert_type in self.movement_thresholds:
            self.movement_thresholds[alert_type].enabled = enabled
            status = "enabled" if enabled else "disabled"
            logger.info(f"{alert_type.value} alerts {status}")


# Global instance
movement_alert_service = MovementAlertService()

async def get_movement_alert_service() -> MovementAlertService:
    """Get the global movement alert service instance"""
    return movement_alert_service