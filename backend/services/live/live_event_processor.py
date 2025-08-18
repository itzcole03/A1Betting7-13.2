"""
Live Event Processing System - Section 4 Implementation

Advanced live event processing system for:
- Real-time game event ingestion and processing
- Live prop status updates and settlements
- In-game betting opportunity identification
- Event-driven prop adjustments
- Integration with valuation and monitoring systems
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


class EventType(Enum):
    """Types of live game events"""
    # Batting events
    AT_BAT_START = "at_bat_start"
    AT_BAT_END = "at_bat_end"
    HIT = "hit"
    HOME_RUN = "home_run"
    WALK = "walk"
    STRIKEOUT = "strikeout"
    HIT_BY_PITCH = "hit_by_pitch"
    
    # Base running events
    STOLEN_BASE = "stolen_base"
    CAUGHT_STEALING = "caught_stealing"
    
    # Game flow events
    INNING_START = "inning_start"
    INNING_END = "inning_end"
    SUBSTITUTION = "substitution"
    PITCHING_CHANGE = "pitching_change"
    
    # Special events
    INJURY = "injury"
    DELAY = "delay"
    WEATHER_DELAY = "weather_delay"
    GAME_END = "game_end"
    
    # Scoring events
    RUN_SCORED = "run_scored"
    RBI = "rbi"
    
    # Defensive events
    ERROR = "error"
    DOUBLE_PLAY = "double_play"
    
    # Unknown/Other
    UNKNOWN = "unknown"


class EventImpact(Enum):
    """Impact level of events on props"""
    NONE = "none"           # No prop impact
    MINIMAL = "minimal"     # Minor adjustments
    MODERATE = "moderate"   # Notable impact on related props
    HIGH = "high"          # Significant impact on multiple props
    GAME_CHANGING = "game_changing"  # Major impact on game outcome


class PropStatus(Enum):
    """Status of prop bets during live games"""
    ACTIVE = "active"           # Still in play
    WON = "won"                # Prop hit/won
    LOST = "lost"              # Prop failed/lost
    PUSHED = "pushed"          # Exact line hit (tie)
    VOIDED = "voided"          # Bet cancelled (e.g., player didn't start)
    SUSPENDED = "suspended"    # Temporarily suspended (e.g., weather delay)


@dataclass
class GameEvent:
    """Individual game event"""
    event_id: str
    game_id: str
    event_type: EventType
    timestamp: datetime
    inning: int
    inning_half: str  # "top" or "bottom"
    
    # Player information
    batter_id: Optional[str] = None
    batter_name: Optional[str] = None
    pitcher_id: Optional[str] = None
    pitcher_name: Optional[str] = None
    
    # Event details
    description: str = ""
    result: Optional[str] = None  # Specific outcome (e.g., "single", "flyout")
    
    # Statistical impact
    hits_delta: int = 0
    runs_delta: int = 0
    rbi_delta: int = 0
    strikeouts_delta: int = 0
    walks_delta: int = 0
    
    # Context
    bases_before: List[str] = field(default_factory=list)  # ["1B", "2B"] etc
    bases_after: List[str] = field(default_factory=list)
    outs_before: int = 0
    outs_after: int = 0
    score_before: Dict[str, int] = field(default_factory=dict)  # {"home": 3, "away": 2}
    score_after: Dict[str, int] = field(default_factory=dict)
    
    # Metadata
    source: str = "live_feed"
    confidence: float = 0.95
    processed_at: Optional[datetime] = None


@dataclass
class PropUpdate:
    """Update to a prop's status/probability based on live events"""
    prop_id: str
    prop_type: str
    player_id: Optional[str] = None
    
    # Status changes
    old_status: PropStatus = PropStatus.ACTIVE
    new_status: PropStatus = PropStatus.ACTIVE
    
    # Probability/value changes
    old_probability: float = 0.5
    new_probability: float = 0.5
    probability_delta: float = 0.0
    
    # Current progress toward prop
    current_value: float = 0.0  # Current stat value (e.g., 2 hits)
    target_value: float = 0.0   # Prop line (e.g., 1.5 hits)
    remaining_opportunities: int = 0  # Estimated remaining chances
    
    # Event that triggered update
    triggering_event: Optional[GameEvent] = None
    update_timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Impact assessment
    impact_level: EventImpact = EventImpact.MINIMAL
    confidence: float = 0.8


@dataclass
class LiveOpportunity:
    """Live betting opportunity identified from events"""
    opportunity_id: str
    prop_id: str
    opportunity_type: str  # "value_shift", "arbitrage", "hedge"
    
    # Opportunity details
    title: str
    description: str
    confidence_score: float = 0.5  # 0-1 confidence in opportunity
    
    # Current state
    current_odds: Optional[int] = None
    fair_value_odds: Optional[int] = None
    edge_percentage: float = 0.0
    
    # Timing
    identified_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    estimated_window: int = 300  # Seconds window for opportunity
    expires_at: Optional[datetime] = None
    
    # Action recommendation
    recommended_action: str = ""
    position_size: Optional[float] = None
    
    # Context
    triggering_events: List[GameEvent] = field(default_factory=list)
    related_props: List[str] = field(default_factory=list)


class LiveEventProcessor:
    """
    Advanced Live Event Processing System
    
    Features:
    - Real-time game event ingestion
    - Live prop tracking and settlement
    - Dynamic probability updates
    - Opportunity identification
    - Event-driven notifications
    """
    
    def __init__(self):
        self.name = "live_event_processor"
        self.version = "1.0"
        
        # Event processing
        self.event_queue: asyncio.Queue = asyncio.Queue()
        self.processed_events: Dict[str, List[GameEvent]] = defaultdict(list)  # game_id -> events
        self.event_handlers: Dict[EventType, List[Callable]] = defaultdict(list)
        
        # Prop tracking
        self.active_props: Dict[str, Dict[str, Any]] = {}  # prop_id -> prop_data
        self.prop_updates: Dict[str, List[PropUpdate]] = defaultdict(list)  # prop_id -> updates
        self.prop_status_cache: Dict[str, PropStatus] = {}
        
        # Live opportunities
        self.active_opportunities: Dict[str, LiveOpportunity] = {}
        self.opportunity_history: List[LiveOpportunity] = []
        
        # Game state tracking
        self.game_states: Dict[str, Dict[str, Any]] = {}  # game_id -> current_state
        self.player_stats: Dict[str, Dict[str, float]] = defaultdict(dict)  # player_id -> stats
        
        # Processing configuration
        self.processing_active = False
        self.monitored_games: Set[str] = set()
        self.monitored_props: Set[str] = set()
        
        # Callbacks
        self.event_callbacks: List[Callable] = []
        self.prop_update_callbacks: List[Callable] = []
        self.opportunity_callbacks: List[Callable] = []
        
        # Event impact rules
        self.impact_rules = {
            EventType.HOME_RUN: {"hits": 1, "runs": 1, "impact": EventImpact.HIGH},
            EventType.HIT: {"hits": 1, "impact": EventImpact.MODERATE},
            EventType.WALK: {"walks": 1, "impact": EventImpact.MINIMAL},
            EventType.STRIKEOUT: {"strikeouts": 1, "impact": EventImpact.MINIMAL},
            EventType.RBI: {"rbi": 1, "impact": EventImpact.MODERATE},
            EventType.STOLEN_BASE: {"stolen_bases": 1, "impact": EventImpact.MODERATE},
            EventType.PITCHING_CHANGE: {"impact": EventImpact.HIGH},
            EventType.INJURY: {"impact": EventImpact.GAME_CHANGING}
        }
        
        logger.info("Live Event Processor initialized")
    
    async def initialize(self):
        """Initialize event processing system"""
        # Start processing loops
        asyncio.create_task(self._event_processing_loop())
        asyncio.create_task(self._prop_monitoring_loop())
        asyncio.create_task(self._opportunity_detection_loop())
        
        logger.info("Live Event Processor initialized")
    
    async def start_monitoring(self, games: Optional[List[str]] = None, props: Optional[List[str]] = None):
        """Start monitoring games and props"""
        if games:
            self.monitored_games.update(games)
            # Initialize game states
            for game_id in games:
                if game_id not in self.game_states:
                    await self._initialize_game_state(game_id)
        
        if props:
            self.monitored_props.update(props)
            # Initialize prop tracking
            for prop_id in props:
                if prop_id not in self.active_props:
                    await self._initialize_prop_tracking(prop_id)
        
        if not self.processing_active:
            self.processing_active = True
        
        logger.info(f"Started live monitoring - Games: {len(self.monitored_games)}, Props: {len(self.monitored_props)}")
    
    async def stop_monitoring(self):
        """Stop live event processing"""
        self.processing_active = False
        self.monitored_games.clear()
        self.monitored_props.clear()
        logger.info("Stopped live event processing")
    
    async def process_event(self, event: GameEvent):
        """Process a live game event"""
        try:
            # Add to processing queue
            await self.event_queue.put(event)
            logger.debug(f"Queued event: {event.event_type.value} for game {event.game_id}")
            
        except Exception as e:
            logger.error(f"Error processing event: {e}")
    
    async def get_prop_status(self, prop_id: str) -> Optional[PropStatus]:
        """Get current status of a prop"""
        return self.prop_status_cache.get(prop_id)
    
    async def get_prop_updates(self, prop_id: str, hours: int = 4) -> List[PropUpdate]:
        """Get recent updates for a prop"""
        updates = self.prop_updates.get(prop_id, [])
        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours)
        
        return [
            update for update in updates
            if update.update_timestamp > cutoff_time
        ]
    
    async def get_live_opportunities(self, active_only: bool = True) -> List[LiveOpportunity]:
        """Get live betting opportunities"""
        if active_only:
            current_time = datetime.now(timezone.utc)
            return [
                opp for opp in self.active_opportunities.values()
                if not opp.expires_at or opp.expires_at > current_time
            ]
        
        return list(self.active_opportunities.values())
    
    async def get_player_live_stats(self, player_id: str, game_id: str) -> Dict[str, float]:
        """Get player's live stats for current game"""
        key = f"{player_id}_{game_id}"
        return self.player_stats.get(key, {})
    
    async def get_game_events(self, game_id: str, event_types: Optional[List[EventType]] = None) -> List[GameEvent]:
        """Get events for a specific game"""
        events = self.processed_events.get(game_id, [])
        
        if event_types:
            events = [event for event in events if event.event_type in event_types]
        
        return sorted(events, key=lambda e: e.timestamp, reverse=True)
    
    def register_event_handler(self, event_type: EventType, handler: Callable):
        """Register handler for specific event type"""
        self.event_handlers[event_type].append(handler)
        logger.info(f"Registered handler for {event_type.value}: {handler.__name__}")
    
    def register_event_callback(self, callback: Callable):
        """Register callback for all events"""
        self.event_callbacks.append(callback)
        logger.info(f"Registered event callback: {callback.__name__}")
    
    def register_prop_update_callback(self, callback: Callable):
        """Register callback for prop updates"""
        self.prop_update_callbacks.append(callback)
        logger.info(f"Registered prop update callback: {callback.__name__}")
    
    def register_opportunity_callback(self, callback: Callable):
        """Register callback for live opportunities"""
        self.opportunity_callbacks.append(callback)
        logger.info(f"Registered opportunity callback: {callback.__name__}")
    
    async def _event_processing_loop(self):
        """Main event processing loop"""
        logger.info("Starting event processing loop")
        
        while True:
            try:
                # Get event from queue (wait if empty)
                event = await self.event_queue.get()
                
                # Process the event
                await self._handle_event(event)
                
                # Mark task as done
                self.event_queue.task_done()
                
            except Exception as e:
                logger.error(f"Error in event processing loop: {e}")
                await asyncio.sleep(1)
    
    async def _handle_event(self, event: GameEvent):
        """Handle a specific game event"""
        try:
            # Mark as processed
            event.processed_at = datetime.now(timezone.utc)
            
            # Store event
            self.processed_events[event.game_id].append(event)
            
            # Update game state
            await self._update_game_state(event)
            
            # Update player stats
            await self._update_player_stats(event)
            
            # Check prop impacts
            await self._check_prop_impacts(event)
            
            # Run event-specific handlers
            handlers = self.event_handlers.get(event.event_type, [])
            for handler in handlers:
                try:
                    if asyncio.iscoroutinefunction(handler):
                        await handler(event)
                    else:
                        handler(event)
                except Exception as e:
                    logger.error(f"Error in event handler: {e}")
            
            # Trigger general event callbacks
            await self._trigger_event_callbacks(event)
            
            logger.debug(f"Processed event: {event.event_type.value} - {event.description}")
            
        except Exception as e:
            logger.error(f"Error handling event: {e}")
    
    async def _initialize_game_state(self, game_id: str):
        """Initialize tracking state for a game"""
        self.game_states[game_id] = {
            "inning": 1,
            "inning_half": "top",
            "outs": 0,
            "bases": [],
            "score": {"home": 0, "away": 0},
            "current_batter": None,
            "current_pitcher": None,
            "last_updated": datetime.now(timezone.utc)
        }
        
        logger.info(f"Initialized game state for {game_id}")
    
    async def _initialize_prop_tracking(self, prop_id: str):
        """Initialize tracking for a prop"""
        # This would load prop details from database/cache
        self.active_props[prop_id] = {
            "status": PropStatus.ACTIVE,
            "current_value": 0.0,
            "target_value": 0.0,
            "probability": 0.5,
            "last_updated": datetime.now(timezone.utc)
        }
        
        self.prop_status_cache[prop_id] = PropStatus.ACTIVE
        logger.info(f"Initialized prop tracking for {prop_id}")
    
    async def _update_game_state(self, event: GameEvent):
        """Update game state based on event"""
        game_state = self.game_states.get(event.game_id, {})
        
        # Update basic state
        game_state["inning"] = event.inning
        game_state["inning_half"] = event.inning_half
        game_state["outs"] = event.outs_after
        game_state["bases"] = event.bases_after
        game_state["score"] = event.score_after
        game_state["last_updated"] = event.timestamp
        
        # Update current players
        if event.batter_id:
            game_state["current_batter"] = event.batter_id
        if event.pitcher_id:
            game_state["current_pitcher"] = event.pitcher_id
        
        self.game_states[event.game_id] = game_state
    
    async def _update_player_stats(self, event: GameEvent):
        """Update live player statistics"""
        
        # Update batter stats
        if event.batter_id:
            key = f"{event.batter_id}_{event.game_id}"
            stats = self.player_stats[key]
            
            stats["hits"] = stats.get("hits", 0) + event.hits_delta
            stats["runs"] = stats.get("runs", 0) + event.runs_delta
            stats["rbi"] = stats.get("rbi", 0) + event.rbi_delta
            stats["walks"] = stats.get("walks", 0) + event.walks_delta
            stats["at_bats"] = stats.get("at_bats", 0) + (1 if event.event_type in [EventType.HIT, EventType.STRIKEOUT] else 0)
        
        # Update pitcher stats
        if event.pitcher_id:
            key = f"{event.pitcher_id}_{event.game_id}"
            stats = self.player_stats[key]
            
            stats["strikeouts"] = stats.get("strikeouts", 0) + event.strikeouts_delta
            stats["walks_allowed"] = stats.get("walks_allowed", 0) + event.walks_delta
            stats["hits_allowed"] = stats.get("hits_allowed", 0) + event.hits_delta
            stats["runs_allowed"] = stats.get("runs_allowed", 0) + event.runs_delta
    
    async def _check_prop_impacts(self, event: GameEvent):
        """Check how event impacts active props"""
        
        for prop_id in self.monitored_props:
            prop_data = self.active_props.get(prop_id)
            if not prop_data or prop_data["status"] != PropStatus.ACTIVE:
                continue
            
            # Check if event affects this prop
            impact = await self._calculate_prop_impact(event, prop_id, prop_data)
            
            if impact:
                await self._create_prop_update(prop_id, impact, event)
    
    async def _calculate_prop_impact(
        self, 
        event: GameEvent, 
        prop_id: str, 
        prop_data: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Calculate impact of event on specific prop"""
        
        # This is simplified - in production would be more sophisticated
        impact = None
        
        # Example: Player hits prop
        if "hits" in prop_id.lower() and event.batter_id:
            if event.event_type == EventType.HIT:
                impact = {
                    "probability_delta": 0.1,  # Increase probability
                    "current_value_delta": 1,
                    "impact_level": EventImpact.MODERATE
                }
            elif event.event_type in [EventType.STRIKEOUT]:
                impact = {
                    "probability_delta": -0.05,  # Decrease probability
                    "current_value_delta": 0,
                    "impact_level": EventImpact.MINIMAL
                }
        
        # Example: Home run props
        elif "home_run" in prop_id.lower() and event.batter_id:
            if event.event_type == EventType.HOME_RUN:
                impact = {
                    "probability_delta": 0.0,  # Prop likely settled
                    "current_value_delta": 1,
                    "impact_level": EventImpact.HIGH,
                    "new_status": PropStatus.WON
                }
        
        return impact
    
    async def _create_prop_update(
        self, 
        prop_id: str, 
        impact: Dict[str, Any], 
        event: GameEvent
    ):
        """Create prop update based on impact"""
        
        prop_data = self.active_props[prop_id]
        
        # Calculate new values
        old_probability = prop_data["probability"]
        new_probability = max(0.0, min(1.0, old_probability + impact.get("probability_delta", 0)))
        
        old_value = prop_data["current_value"]
        new_value = old_value + impact.get("current_value_delta", 0)
        
        # Determine new status
        new_status = impact.get("new_status", PropStatus.ACTIVE)
        
        # Create update record
        update = PropUpdate(
            prop_id=prop_id,
            prop_type="unknown",  # Would be loaded from prop data
            old_status=prop_data["status"],
            new_status=new_status,
            old_probability=old_probability,
            new_probability=new_probability,
            probability_delta=new_probability - old_probability,
            current_value=new_value,
            triggering_event=event,
            impact_level=impact.get("impact_level", EventImpact.MINIMAL)
        )
        
        # Store update
        self.prop_updates[prop_id].append(update)
        
        # Update prop data
        prop_data["probability"] = new_probability
        prop_data["current_value"] = new_value
        prop_data["status"] = new_status
        prop_data["last_updated"] = datetime.now(timezone.utc)
        
        # Update status cache
        self.prop_status_cache[prop_id] = new_status
        
        # Trigger callbacks
        await self._trigger_prop_update_callbacks(update)
        
        logger.info(f"Prop update: {prop_id} probability {old_probability:.2f} -> {new_probability:.2f}")
    
    async def _prop_monitoring_loop(self):
        """Loop to monitor prop status and settlements"""
        logger.info("Starting prop monitoring loop")
        
        while True:
            try:
                if not self.processing_active:
                    await asyncio.sleep(5)
                    continue
                
                # Check for props that should be settled
                await self._check_prop_settlements()
                
                await asyncio.sleep(10)  # Check every 10 seconds
                
            except Exception as e:
                logger.error(f"Error in prop monitoring loop: {e}")
                await asyncio.sleep(30)
    
    async def _check_prop_settlements(self):
        """Check if any props should be settled"""
        
        for prop_id in list(self.monitored_props):
            prop_data = self.active_props.get(prop_id)
            
            if not prop_data or prop_data["status"] != PropStatus.ACTIVE:
                continue
            
            # Check settlement conditions
            current_value = prop_data["current_value"]
            target_value = prop_data.get("target_value", 0)
            
            # Simple settlement logic (would be more complex in production)
            if current_value >= target_value:
                await self._settle_prop(prop_id, PropStatus.WON, "Target reached")
    
    async def _settle_prop(self, prop_id: str, status: PropStatus, reason: str):
        """Settle a prop bet"""
        
        prop_data = self.active_props.get(prop_id)
        if not prop_data:
            return
        
        # Create settlement update
        update = PropUpdate(
            prop_id=prop_id,
            prop_type="unknown",
            old_status=prop_data["status"],
            new_status=status,
            old_probability=prop_data["probability"],
            new_probability=1.0 if status == PropStatus.WON else 0.0,
            current_value=prop_data["current_value"],
            impact_level=EventImpact.GAME_CHANGING
        )
        
        # Update prop data
        prop_data["status"] = status
        prop_data["last_updated"] = datetime.now(timezone.utc)
        self.prop_status_cache[prop_id] = status
        
        # Store update
        self.prop_updates[prop_id].append(update)
        
        # Trigger callbacks
        await self._trigger_prop_update_callbacks(update)
        
        logger.info(f"Settled prop {prop_id}: {status.value} - {reason}")
    
    async def _opportunity_detection_loop(self):
        """Loop to detect live betting opportunities"""
        logger.info("Starting opportunity detection loop")
        
        while True:
            try:
                if not self.processing_active:
                    await asyncio.sleep(5)
                    continue
                
                # Scan for opportunities
                await self._detect_opportunities()
                
                # Clean up expired opportunities
                await self._cleanup_expired_opportunities()
                
                await asyncio.sleep(15)  # Check every 15 seconds
                
            except Exception as e:
                logger.error(f"Error in opportunity detection loop: {e}")
                await asyncio.sleep(60)
    
    async def _detect_opportunities(self):
        """Detect live betting opportunities"""
        
        # Look for significant probability shifts
        for prop_id in self.monitored_props:
            recent_updates = await self.get_prop_updates(prop_id, hours=1)
            
            if len(recent_updates) < 2:
                continue
            
            # Check for significant probability shift
            latest_update = recent_updates[0]
            if abs(latest_update.probability_delta) > 0.15:  # 15% probability shift
                
                opportunity = LiveOpportunity(
                    opportunity_id=f"prob_shift_{prop_id}_{int(datetime.now().timestamp())}",
                    prop_id=prop_id,
                    opportunity_type="value_shift",
                    title="Significant Probability Shift",
                    description=f"Probability shifted {latest_update.probability_delta:+.1%} due to live events",
                    confidence_score=0.7,
                    edge_percentage=abs(latest_update.probability_delta) * 50,  # Rough edge calculation
                    recommended_action="Consider opposite position if odds haven't adjusted",
                    triggering_events=[latest_update.triggering_event] if latest_update.triggering_event else [],
                    expires_at=datetime.now(timezone.utc) + timedelta(minutes=10)
                )
                
                await self._create_opportunity(opportunity)
    
    async def _create_opportunity(self, opportunity: LiveOpportunity):
        """Create and process a new opportunity"""
        
        # Store opportunity
        self.active_opportunities[opportunity.opportunity_id] = opportunity
        self.opportunity_history.append(opportunity)
        
        # Trigger callbacks
        await self._trigger_opportunity_callbacks(opportunity)
        
        logger.info(f"Created opportunity: {opportunity.opportunity_type} for {opportunity.prop_id}")
    
    async def _cleanup_expired_opportunities(self):
        """Clean up expired opportunities"""
        current_time = datetime.now(timezone.utc)
        
        expired_ids = []
        for opp_id, opportunity in self.active_opportunities.items():
            if opportunity.expires_at and opportunity.expires_at < current_time:
                expired_ids.append(opp_id)
        
        for opp_id in expired_ids:
            del self.active_opportunities[opp_id]
            logger.debug(f"Expired opportunity: {opp_id}")
    
    async def _trigger_event_callbacks(self, event: GameEvent):
        """Trigger event callbacks"""
        for callback in self.event_callbacks:
            try:
                if asyncio.iscoroutinefunction(callback):
                    await callback(event)
                else:
                    callback(event)
            except Exception as e:
                logger.error(f"Error in event callback: {e}")
    
    async def _trigger_prop_update_callbacks(self, update: PropUpdate):
        """Trigger prop update callbacks"""
        for callback in self.prop_update_callbacks:
            try:
                if asyncio.iscoroutinefunction(callback):
                    await callback(update)
                else:
                    callback(update)
            except Exception as e:
                logger.error(f"Error in prop update callback: {e}")
    
    async def _trigger_opportunity_callbacks(self, opportunity: LiveOpportunity):
        """Trigger opportunity callbacks"""
        for callback in self.opportunity_callbacks:
            try:
                if asyncio.iscoroutinefunction(callback):
                    await callback(opportunity)
                else:
                    callback(opportunity)
            except Exception as e:
                logger.error(f"Error in opportunity callback: {e}")
    
    async def health_check(self) -> Dict[str, Any]:
        """Service health check"""
        try:
            return {
                "service": self.name,
                "version": self.version,
                "status": "healthy",
                "capabilities": {
                    "event_processing": True,
                    "prop_tracking": True,
                    "live_settlements": True,
                    "opportunity_detection": True,
                    "real_time_updates": True
                },
                "processing_stats": {
                    "processing_active": self.processing_active,
                    "monitored_games": len(self.monitored_games),
                    "monitored_props": len(self.monitored_props),
                    "queue_size": self.event_queue.qsize(),
                    "total_events_processed": sum(len(events) for events in self.processed_events.values()),
                    "active_props": len([p for p in self.active_props.values() if p["status"] == PropStatus.ACTIVE]),
                    "active_opportunities": len(self.active_opportunities),
                    "event_callbacks": len(self.event_callbacks),
                    "prop_update_callbacks": len(self.prop_update_callbacks),
                    "opportunity_callbacks": len(self.opportunity_callbacks)
                },
                "game_states": {
                    game_id: {
                        "inning": state.get("inning"),
                        "score": state.get("score"),
                        "last_updated": state.get("last_updated").isoformat() if isinstance(state.get("last_updated"), datetime) else None
                    }
                    for game_id, state in self.game_states.items()
                }
            }
            
        except Exception as e:
            logger.error(f"Live event processor health check failed: {e}")
            return {
                "service": self.name,
                "version": self.version,
                "status": "error",
                "error": str(e)
            }


# Global service instance
live_event_processor = LiveEventProcessor()