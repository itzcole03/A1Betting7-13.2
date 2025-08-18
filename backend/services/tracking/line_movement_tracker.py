"""
Line Movement Tracking System - Section 4 Implementation

Advanced line movement monitoring system for:
- Real-time odds tracking across multiple sportsbooks
- Line movement detection and analysis
- Alert generation for significant movements
- Historical line movement patterns
- Integration with valuation system for opportunity identification
"""

import asyncio
import logging
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, Any, Optional, List, Callable, Set
import json
from collections import deque, defaultdict

logger = logging.getLogger(__name__)


class MovementDirection(Enum):
    """Direction of line movement"""
    UP = "up"           # Line increased (over moved up, favorite became more favored)
    DOWN = "down"       # Line decreased (under moved down, underdog became less favored)
    FLAT = "flat"       # No significant movement
    VOLATILE = "volatile"  # Frequent back-and-forth movement


class MovementMagnitude(Enum):
    """Magnitude of line movement"""
    MINIMAL = "minimal"        # < 2% change
    SMALL = "small"           # 2-5% change
    MODERATE = "moderate"     # 5-10% change
    SIGNIFICANT = "significant"  # 10-20% change
    MAJOR = "major"           # > 20% change


class MovementCause(Enum):
    """Potential causes of line movement"""
    SHARP_MONEY = "sharp_money"      # Professional bettor action
    PUBLIC_MONEY = "public_money"    # Recreational bettor volume
    INJURY_NEWS = "injury_news"      # Injury reports
    LINEUP_CHANGE = "lineup_change"  # Starting lineup changes
    WEATHER = "weather"              # Weather conditions
    STEAM = "steam"                  # Coordinated betting across books
    ARBITRAGE = "arbitrage"          # Arbitrage opportunity closure
    UNKNOWN = "unknown"              # Cause not determined


@dataclass
class LineSnapshot:
    """Point-in-time line snapshot"""
    sportsbook: str
    prop_id: str
    prop_type: str
    prop_name: str
    line_value: float    # The line (e.g., 7.5 for Over 7.5)
    odds_over: int       # American odds for over/yes
    odds_under: int      # American odds for under/no
    
    # Context
    timestamp: datetime
    game_id: str
    player_name: Optional[str] = None
    team: Optional[str] = None
    
    # Volume indicators (if available)
    betting_volume: Optional[float] = None
    public_percentage: Optional[float] = None  # % of bets on over/yes
    
    # Metadata
    source: str = "api"
    confidence: float = 0.9


@dataclass
class LineMovement:
    """Detected line movement between snapshots"""
    prop_id: str
    sportsbook: str
    
    # Movement details
    old_line: float
    new_line: float
    line_change: float
    
    old_odds_over: int
    new_odds_over: int
    odds_change_over: int
    
    old_odds_under: int
    new_odds_under: int
    odds_change_under: int
    
    # Movement analysis
    direction: MovementDirection
    magnitude: MovementMagnitude
    velocity: float  # Change per hour
    
    # Time data
    start_time: datetime
    end_time: datetime
    duration_minutes: int
    
    # Probable causes
    likely_causes: List[MovementCause] = field(default_factory=list)
    confidence_score: float = 0.5
    
    # Impact assessment
    market_impact: str = "neutral"  # "bullish", "bearish", "neutral"
    opportunity_score: float = 0.0  # 0-1 scale for betting opportunity


@dataclass
class MovementAlert:
    """Alert for significant line movement"""
    alert_id: str
    prop_id: str
    sportsbook: str
    movement: LineMovement
    
    # Alert details
    alert_type: str  # "significant_movement", "steam", "reverse_movement"
    priority: str    # "low", "medium", "high", "critical"
    
    title: str
    description: str
    recommended_action: str
    
    # Timing
    triggered_at: datetime
    expires_at: datetime
    
    # Metadata
    alert_active: bool = True


@dataclass
class LineMovementPattern:
    """Historical line movement pattern analysis"""
    prop_type: str
    player_name: Optional[str] = None
    team: Optional[str] = None
    
    # Pattern characteristics
    typical_movement_range: float = 0.0  # Typical line movement in points
    volatility_score: float = 0.0        # 0-1 scale of line volatility
    public_influence: float = 0.0        # How much public money affects lines
    sharp_influence: float = 0.0         # How much sharp money affects lines
    
    # Historical data
    avg_closing_adjustment: float = 0.0   # Average movement from open to close
    steam_frequency: float = 0.0          # Frequency of steam movements
    reverse_frequency: float = 0.0        # Frequency of reverse movements
    
    # Sample size
    games_analyzed: int = 0
    last_updated: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


class LineMovementTracker:
    """
    Advanced Line Movement Tracking System
    
    Features:
    - Multi-sportsbook line monitoring
    - Movement detection and classification
    - Pattern analysis and prediction
    - Alert generation for opportunities
    - Integration with valuation systems
    """
    
    def __init__(self):
        self.name = "line_movement_tracker"
        self.version = "1.0"
        
        # Line data storage
        self.line_snapshots: Dict[str, deque] = defaultdict(lambda: deque(maxlen=1000))  # prop_id -> snapshots
        self.recent_movements: Dict[str, List[LineMovement]] = defaultdict(list)  # prop_id -> movements
        self.active_alerts: Dict[str, List[MovementAlert]] = defaultdict(list)  # prop_id -> alerts
        
        # Pattern analysis
        self.movement_patterns: Dict[str, LineMovementPattern] = {}  # prop_type -> pattern
        self.historical_data: Dict[str, List[LineSnapshot]] = defaultdict(list)
        
        # Monitoring configuration
        self.monitored_props: Set[str] = set()
        self.monitored_sportsbooks: Set[str] = set()
        self.monitoring_active = False
        
        # Movement detection thresholds
        self.movement_thresholds = {
            "minimal_line_change": 0.1,     # 0.1 point minimum for detection
            "minimal_odds_change": 5,       # 5 points minimum for detection
            "significant_line": 0.5,        # 0.5+ points = significant
            "major_line": 1.0,              # 1.0+ points = major
            "significant_odds": 20,         # 20+ points = significant
            "major_odds": 50,              # 50+ points = major
            "steam_velocity": 0.5,         # 0.5+ points per hour = steam
            "alert_threshold": 0.3         # 0.3+ points triggers alert
        }
        
        # Callbacks
        self.movement_callbacks: List[Callable] = []
        self.alert_callbacks: List[Callable] = []
        
        logger.info("Line Movement Tracker initialized")
    
    async def initialize(self):
        """Initialize tracking system"""
        # Load historical patterns if available
        await self._load_historical_patterns()
        
        logger.info("Line Movement Tracker initialized")
    
    async def start_monitoring(self, props: List[str] = None, sportsbooks: List[str] = None):
        """Start monitoring line movements"""
        if props:
            self.monitored_props.update(props)
        
        if sportsbooks:
            self.monitored_sportsbooks.update(sportsbooks)
        
        if not self.monitoring_active:
            self.monitoring_active = True
            # Start monitoring tasks
            asyncio.create_task(self._line_monitoring_loop())
            asyncio.create_task(self._movement_detection_loop())
            asyncio.create_task(self._alert_processing_loop())
        
        logger.info(f"Started line monitoring - Props: {len(self.monitored_props)}, Books: {len(self.monitored_sportsbooks)}")
    
    async def stop_monitoring(self):
        """Stop line monitoring"""
        self.monitoring_active = False
        self.monitored_props.clear()
        self.monitored_sportsbooks.clear()
        logger.info("Stopped line movement monitoring")
    
    async def record_line_snapshot(self, snapshot: LineSnapshot):
        """Record a new line snapshot"""
        try:
            prop_key = f"{snapshot.prop_id}_{snapshot.sportsbook}"
            self.line_snapshots[prop_key].append(snapshot)
            
            # Check for movement since last snapshot
            if len(self.line_snapshots[prop_key]) > 1:
                await self._detect_movement(prop_key, snapshot)
            
            logger.debug(f"Recorded line snapshot: {prop_key} @ {snapshot.line_value}")
            
        except Exception as e:
            logger.error(f"Error recording line snapshot: {e}")
    
    async def get_current_lines(self, prop_id: str) -> List[LineSnapshot]:
        """Get current lines for a prop across all monitored sportsbooks"""
        current_lines = []
        
        for sportsbook in self.monitored_sportsbooks:
            prop_key = f"{prop_id}_{sportsbook}"
            snapshots = self.line_snapshots.get(prop_key)
            
            if snapshots and len(snapshots) > 0:
                # Get most recent snapshot
                latest = snapshots[-1]
                # Only include if it's relatively fresh (< 15 minutes old)
                if (datetime.now(timezone.utc) - latest.timestamp).total_seconds() < 900:
                    current_lines.append(latest)
        
        return current_lines
    
    async def get_line_history(self, prop_id: str, sportsbook: str, hours: int = 24) -> List[LineSnapshot]:
        """Get line history for a specific prop and sportsbook"""
        prop_key = f"{prop_id}_{sportsbook}"
        snapshots = self.line_snapshots.get(prop_key, deque())
        
        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours)
        
        return [
            snapshot for snapshot in snapshots 
            if snapshot.timestamp > cutoff_time
        ]
    
    async def get_recent_movements(self, prop_id: str, hours: int = 6) -> List[LineMovement]:
        """Get recent movements for a prop"""
        all_movements = []
        
        for sportsbook in self.monitored_sportsbooks:
            prop_key = f"{prop_id}_{sportsbook}"
            movements = self.recent_movements.get(prop_key, [])
            
            cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours)
            recent_movements = [
                movement for movement in movements
                if movement.end_time > cutoff_time
            ]
            
            all_movements.extend(recent_movements)
        
        # Sort by most recent
        all_movements.sort(key=lambda m: m.end_time, reverse=True)
        return all_movements
    
    async def analyze_movement_pattern(self, prop_id: str) -> Optional[Dict[str, Any]]:
        """Analyze movement patterns for a prop"""
        try:
            movements = await self.get_recent_movements(prop_id, hours=168)  # Last week
            
            if len(movements) < 5:  # Need minimum sample size
                return None
            
            analysis = {
                "prop_id": prop_id,
                "sample_size": len(movements),
                "analysis_period_hours": 168,
                "movement_stats": {},
                "patterns": {},
                "volatility": {}
            }
            
            # Movement statistics
            line_changes = [abs(m.line_change) for m in movements]
            odds_changes = [abs(m.odds_change_over) for m in movements]
            
            analysis["movement_stats"] = {
                "avg_line_movement": sum(line_changes) / len(line_changes),
                "max_line_movement": max(line_changes),
                "avg_odds_movement": sum(odds_changes) / len(odds_changes),
                "max_odds_movement": max(odds_changes)
            }
            
            # Direction patterns
            up_movements = len([m for m in movements if m.direction == MovementDirection.UP])
            down_movements = len([m for m in movements if m.direction == MovementDirection.DOWN])
            
            analysis["patterns"] = {
                "upward_bias": up_movements / len(movements),
                "downward_bias": down_movements / len(movements),
                "volatility_score": len([m for m in movements if m.direction == MovementDirection.VOLATILE]) / len(movements)
            }
            
            # Magnitude distribution
            magnitude_counts = defaultdict(int)
            for movement in movements:
                magnitude_counts[movement.magnitude.value] += 1
            
            analysis["magnitude_distribution"] = dict(magnitude_counts)
            
            return analysis
            
        except Exception as e:
            logger.error(f"Error analyzing movement pattern: {e}")
            return None
    
    async def get_active_alerts(self, prop_id: str = None) -> List[MovementAlert]:
        """Get active movement alerts"""
        if prop_id:
            return [alert for alert in self.active_alerts.get(prop_id, []) if alert.alert_active]
        
        all_alerts = []
        for alerts in self.active_alerts.values():
            all_alerts.extend([alert for alert in alerts if alert.alert_active])
        
        return sorted(all_alerts, key=lambda a: a.triggered_at, reverse=True)
    
    async def create_movement_alert(
        self, 
        movement: LineMovement, 
        alert_type: str, 
        priority: str = "medium"
    ) -> MovementAlert:
        """Create a movement alert"""
        
        alert_id = f"{movement.prop_id}_{movement.sportsbook}_{int(datetime.now().timestamp())}"
        
        # Generate alert content based on type and movement
        if alert_type == "significant_movement":
            title = f"Significant Line Movement Detected"
            description = f"Line moved {movement.line_change:+.1f} points to {movement.new_line}"
            recommended_action = "Monitor for additional movement or betting opportunity"
        elif alert_type == "steam":
            title = f"Steam Movement Detected"  
            description = f"Rapid movement of {movement.velocity:.1f} points/hour"
            recommended_action = "Consider immediate action - coordinated betting detected"
        elif alert_type == "reverse_movement":
            title = f"Reverse Line Movement"
            description = f"Line moved against public betting percentage"
            recommended_action = "Potential sharp money indicator - investigate"
        else:
            title = "Line Movement Alert"
            description = f"Movement detected: {movement.line_change:+.1f} points"
            recommended_action = "Review movement details"
        
        alert = MovementAlert(
            alert_id=alert_id,
            prop_id=movement.prop_id,
            sportsbook=movement.sportsbook,
            movement=movement,
            alert_type=alert_type,
            priority=priority,
            title=title,
            description=description,
            recommended_action=recommended_action,
            triggered_at=datetime.now(timezone.utc),
            expires_at=datetime.now(timezone.utc) + timedelta(hours=4)  # 4-hour default expiry
        )
        
        # Store alert
        self.active_alerts[movement.prop_id].append(alert)
        
        # Trigger callbacks
        await self._trigger_alert_callbacks(alert)
        
        logger.info(f"Created movement alert: {alert_type} for {movement.prop_id}")
        return alert
    
    def register_movement_callback(self, callback: Callable):
        """Register callback for movement detection"""
        self.movement_callbacks.append(callback)
        logger.info(f"Registered movement callback: {callback.__name__}")
    
    def register_alert_callback(self, callback: Callable):
        """Register callback for movement alerts"""
        self.alert_callbacks.append(callback)
        logger.info(f"Registered alert callback: {callback.__name__}")
    
    async def _detect_movement(self, prop_key: str, new_snapshot: LineSnapshot):
        """Detect movement between snapshots"""
        try:
            snapshots = self.line_snapshots[prop_key]
            
            if len(snapshots) < 2:
                return
            
            # Compare with previous snapshot
            old_snapshot = snapshots[-2]
            
            # Calculate changes
            line_change = new_snapshot.line_value - old_snapshot.line_value
            odds_change_over = new_snapshot.odds_over - old_snapshot.odds_over
            odds_change_under = new_snapshot.odds_under - old_snapshot.odds_under
            
            # Check if movement meets thresholds
            if (abs(line_change) < self.movement_thresholds["minimal_line_change"] and 
                abs(odds_change_over) < self.movement_thresholds["minimal_odds_change"]):
                return
            
            # Calculate movement characteristics
            duration = (new_snapshot.timestamp - old_snapshot.timestamp).total_seconds() / 60  # minutes
            velocity = abs(line_change) / max(duration / 60, 0.1)  # points per hour
            
            # Determine direction
            if abs(line_change) < 0.05:
                direction = MovementDirection.FLAT
            elif line_change > 0:
                direction = MovementDirection.UP
            else:
                direction = MovementDirection.DOWN
            
            # Determine magnitude
            magnitude = self._classify_magnitude(line_change, odds_change_over)
            
            # Create movement record
            movement = LineMovement(
                prop_id=new_snapshot.prop_id,
                sportsbook=new_snapshot.sportsbook,
                old_line=old_snapshot.line_value,
                new_line=new_snapshot.line_value,
                line_change=line_change,
                old_odds_over=old_snapshot.odds_over,
                new_odds_over=new_snapshot.odds_over,
                odds_change_over=odds_change_over,
                old_odds_under=old_snapshot.odds_under,
                new_odds_under=new_snapshot.odds_under,
                odds_change_under=odds_change_under,
                direction=direction,
                magnitude=magnitude,
                velocity=velocity,
                start_time=old_snapshot.timestamp,
                end_time=new_snapshot.timestamp,
                duration_minutes=int(duration)
            )
            
            # Analyze probable causes
            movement.likely_causes = await self._analyze_movement_causes(movement, snapshots)
            
            # Store movement
            self.recent_movements[prop_key].append(movement)
            
            # Check if alert should be generated
            if await self._should_generate_alert(movement):
                alert_type = await self._determine_alert_type(movement)
                priority = await self._determine_alert_priority(movement)
                await self.create_movement_alert(movement, alert_type, priority)
            
            # Trigger movement callbacks
            await self._trigger_movement_callbacks(movement)
            
            logger.debug(f"Detected movement: {prop_key} {line_change:+.1f} points")
            
        except Exception as e:
            logger.error(f"Error detecting movement: {e}")
    
    def _classify_magnitude(self, line_change: float, odds_change: int) -> MovementMagnitude:
        """Classify movement magnitude"""
        abs_line_change = abs(line_change)
        abs_odds_change = abs(odds_change)
        
        # Use line change as primary classifier
        if abs_line_change >= self.movement_thresholds["major_line"]:
            return MovementMagnitude.MAJOR
        elif abs_line_change >= self.movement_thresholds["significant_line"]:
            return MovementMagnitude.SIGNIFICANT
        elif abs_line_change >= 0.25:
            return MovementMagnitude.MODERATE
        elif abs_line_change >= 0.1:
            return MovementMagnitude.SMALL
        else:
            return MovementMagnitude.MINIMAL
    
    async def _analyze_movement_causes(
        self, 
        movement: LineMovement, 
        snapshots: deque
    ) -> List[MovementCause]:
        """Analyze probable causes of movement"""
        causes = []
        
        # Steam detection (rapid movement)
        if movement.velocity > self.movement_thresholds["steam_velocity"]:
            causes.append(MovementCause.STEAM)
        
        # Sharp money indicators
        if (movement.magnitude in [MovementMagnitude.SIGNIFICANT, MovementMagnitude.MAJOR] and
            movement.duration_minutes < 30):
            causes.append(MovementCause.SHARP_MONEY)
        
        # Public money (gradual movement)
        if (movement.duration_minutes > 60 and 
            movement.magnitude in [MovementMagnitude.SMALL, MovementMagnitude.MODERATE]):
            causes.append(MovementCause.PUBLIC_MONEY)
        
        # Default to unknown if no clear indicators
        if not causes:
            causes.append(MovementCause.UNKNOWN)
        
        return causes
    
    async def _should_generate_alert(self, movement: LineMovement) -> bool:
        """Determine if movement should generate an alert"""
        
        # Always alert on major movements
        if movement.magnitude == MovementMagnitude.MAJOR:
            return True
        
        # Alert on significant movements
        if movement.magnitude == MovementMagnitude.SIGNIFICANT:
            return True
        
        # Alert on steam movements
        if MovementCause.STEAM in movement.likely_causes:
            return True
        
        # Alert on sharp money indicators
        if MovementCause.SHARP_MONEY in movement.likely_causes:
            return True
        
        return False
    
    async def _determine_alert_type(self, movement: LineMovement) -> str:
        """Determine alert type based on movement characteristics"""
        
        if MovementCause.STEAM in movement.likely_causes:
            return "steam"
        elif MovementCause.SHARP_MONEY in movement.likely_causes:
            return "sharp_money"  
        elif movement.magnitude == MovementMagnitude.MAJOR:
            return "major_movement"
        else:
            return "significant_movement"
    
    async def _determine_alert_priority(self, movement: LineMovement) -> str:
        """Determine alert priority"""
        
        if movement.magnitude == MovementMagnitude.MAJOR:
            return "high"
        elif MovementCause.STEAM in movement.likely_causes:
            return "high"
        elif movement.magnitude == MovementMagnitude.SIGNIFICANT:
            return "medium"
        else:
            return "low"
    
    async def _load_historical_patterns(self):
        """Load historical movement patterns"""
        # In production, this would load from database
        # For now, initialize with basic patterns
        
        sample_patterns = {
            "player_hits": LineMovementPattern(
                prop_type="player_hits",
                typical_movement_range=0.3,
                volatility_score=0.4,
                public_influence=0.6,
                sharp_influence=0.7,
                avg_closing_adjustment=-0.1,
                games_analyzed=100
            ),
            "player_home_runs": LineMovementPattern(
                prop_type="player_home_runs",
                typical_movement_range=0.2,
                volatility_score=0.3,
                public_influence=0.8,
                sharp_influence=0.5,
                avg_closing_adjustment=0.05,
                games_analyzed=75
            )
        }
        
        self.movement_patterns.update(sample_patterns)
        logger.info(f"Loaded {len(sample_patterns)} historical patterns")
    
    async def _line_monitoring_loop(self):
        """Main line monitoring loop"""
        logger.info("Starting line monitoring loop")
        
        while self.monitoring_active:
            try:
                # In production, this would fetch lines from APIs
                # For now, simulate line updates
                await self._simulate_line_updates()
                
                await asyncio.sleep(30)  # Check every 30 seconds
                
            except Exception as e:
                logger.error(f"Error in line monitoring loop: {e}")
                await asyncio.sleep(60)  # Wait longer on error
    
    async def _movement_detection_loop(self):
        """Movement detection and analysis loop"""
        logger.info("Starting movement detection loop")
        
        while self.monitoring_active:
            try:
                # Process recent snapshots for movements
                # This is handled in real-time by record_line_snapshot
                # But this loop can handle batch processing if needed
                
                await asyncio.sleep(10)  # Check every 10 seconds
                
            except Exception as e:
                logger.error(f"Error in movement detection loop: {e}")
                await asyncio.sleep(30)
    
    async def _alert_processing_loop(self):
        """Alert processing and cleanup loop"""
        logger.info("Starting alert processing loop")
        
        while self.monitoring_active:
            try:
                # Clean up expired alerts
                current_time = datetime.now(timezone.utc)
                
                for prop_id in list(self.active_alerts.keys()):
                    active_alerts = []
                    for alert in self.active_alerts[prop_id]:
                        if alert.expires_at > current_time:
                            active_alerts.append(alert)
                        else:
                            logger.debug(f"Expired alert: {alert.alert_id}")
                    
                    self.active_alerts[prop_id] = active_alerts
                
                await asyncio.sleep(300)  # Clean up every 5 minutes
                
            except Exception as e:
                logger.error(f"Error in alert processing loop: {e}")
                await asyncio.sleep(600)
    
    async def _simulate_line_updates(self):
        """Simulate line updates for development/testing"""
        import random
        
        # Simulate updates for monitored props
        for prop_id in list(self.monitored_props)[:3]:  # Limit to first 3 for testing
            for sportsbook in list(self.monitored_sportsbooks)[:2]:  # Limit to first 2
                
                # Create simulated snapshot
                snapshot = LineSnapshot(
                    sportsbook=sportsbook,
                    prop_id=prop_id,
                    prop_type="player_hits",
                    prop_name=f"Player Hits O/U",
                    line_value=1.5 + random.uniform(-0.3, 0.3),  # Random around 1.5
                    odds_over=-110 + random.randint(-20, 20),
                    odds_under=-110 + random.randint(-20, 20),
                    timestamp=datetime.now(timezone.utc),
                    game_id="sample_game_1"
                )
                
                await self.record_line_snapshot(snapshot)
    
    async def _trigger_movement_callbacks(self, movement: LineMovement):
        """Trigger movement detection callbacks"""
        for callback in self.movement_callbacks:
            try:
                if asyncio.iscoroutinefunction(callback):
                    await callback(movement)
                else:
                    callback(movement)
            except Exception as e:
                logger.error(f"Error in movement callback: {e}")
    
    async def _trigger_alert_callbacks(self, alert: MovementAlert):
        """Trigger alert callbacks"""
        for callback in self.alert_callbacks:
            try:
                if asyncio.iscoroutinefunction(callback):
                    await callback(alert)
                else:
                    callback(alert)
            except Exception as e:
                logger.error(f"Error in alert callback: {e}")
    
    async def health_check(self) -> Dict[str, Any]:
        """Service health check"""
        try:
            return {
                "service": self.name,
                "version": self.version,
                "status": "healthy",
                "capabilities": {
                    "line_tracking": True,
                    "movement_detection": True,
                    "pattern_analysis": True,
                    "alert_generation": True,
                    "multi_sportsbook": True
                },
                "monitoring_stats": {
                    "monitored_props": len(self.monitored_props),
                    "monitored_sportsbooks": len(self.monitored_sportsbooks),
                    "total_snapshots": sum(len(snapshots) for snapshots in self.line_snapshots.values()),
                    "recent_movements": sum(len(movements) for movements in self.recent_movements.values()),
                    "active_alerts": sum(len([a for a in alerts if a.alert_active]) for alerts in self.active_alerts.values()),
                    "movement_callbacks": len(self.movement_callbacks),
                    "alert_callbacks": len(self.alert_callbacks)
                },
                "thresholds": self.movement_thresholds
            }
            
        except Exception as e:
            logger.error(f"Line movement tracker health check failed: {e}")
            return {
                "service": self.name,
                "version": self.version,
                "status": "error",
                "error": str(e)
            }


# Global service instance
line_movement_tracker = LineMovementTracker()