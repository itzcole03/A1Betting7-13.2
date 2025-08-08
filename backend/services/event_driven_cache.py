"""
Event-Driven Cache Invalidation System
Intelligent cache invalidation based on real-time events and data changes
"""

import asyncio
import json
import logging
import time
from collections import defaultdict, deque
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from enum import Enum
from typing import Any, Callable, Dict, List, Optional, Set, Tuple, Union
from uuid import uuid4

from backend.services.intelligent_cache_service import intelligent_cache_service
from backend.utils.enhanced_logging import get_logger

logger = get_logger("event_driven_cache")


class EventType(Enum):
    """Types of events that trigger cache invalidation"""
    GAME_STATE_CHANGE = "game_state_change"
    SCORE_UPDATE = "score_update"
    ODDS_CHANGE = "odds_change"
    INJURY_REPORT = "injury_report"
    LINEUP_CHANGE = "lineup_change"
    WEATHER_UPDATE = "weather_update"
    NEWS_UPDATE = "news_update"
    PLAYER_TRADE = "player_trade"
    SCHEDULE_CHANGE = "schedule_change"
    DATA_SOURCE_UPDATE = "data_source_update"


class InvalidationScope(Enum):
    """Scope of cache invalidation"""
    EXACT_KEY = "exact_key"        # Invalidate specific key only
    PATTERN = "pattern"            # Invalidate keys matching pattern
    RELATED = "related"            # Invalidate related data
    CASCADE = "cascade"            # Invalidate all dependent data
    SPORT_WIDE = "sport_wide"      # Invalidate all data for sport
    GLOBAL = "global"              # Invalidate all cached data


@dataclass
class CacheEvent:
    """Cache invalidation event"""
    event_id: str
    event_type: EventType
    timestamp: datetime
    source: str  # Data source that triggered the event
    sport: Optional[str] = None
    game_id: Optional[str] = None
    player_id: Optional[str] = None
    team_id: Optional[str] = None
    data_category: Optional[str] = None
    payload: Dict[str, Any] = field(default_factory=dict)
    invalidation_scope: InvalidationScope = InvalidationScope.RELATED
    processed: bool = False


@dataclass
class InvalidationRule:
    """Rule defining how events trigger cache invalidation"""
    name: str
    event_type: EventType
    conditions: Dict[str, Any]  # Conditions that must be met
    target_patterns: List[str]  # Cache key patterns to invalidate
    scope: InvalidationScope
    delay_seconds: int = 0  # Delay before invalidation (for batching)
    priority: int = 1  # Priority (1=high, 5=low)
    enabled: bool = True


@dataclass
class InvalidationStats:
    """Statistics for invalidation operations"""
    total_events: int = 0
    total_invalidations: int = 0
    invalidated_keys: int = 0
    batched_operations: int = 0
    avg_processing_time: float = 0.0
    last_invalidation: Optional[datetime] = None


class EventDrivenCacheManager:
    """
    Event-driven cache invalidation manager with:
    - Real-time event processing
    - Intelligent invalidation rules
    - Batched operations for efficiency
    - Dependency tracking
    - Performance optimization
    """

    def __init__(self):
        # Event processing
        self.event_queue: asyncio.Queue = asyncio.Queue(maxsize=1000)
        self.invalidation_rules: Dict[str, InvalidationRule] = {}
        self.event_history: deque = deque(maxlen=1000)
        
        # Dependency tracking
        self.cache_dependencies: Dict[str, Set[str]] = defaultdict(set)
        self.reverse_dependencies: Dict[str, Set[str]] = defaultdict(set)
        
        # Batching and performance
        self.pending_invalidations: Dict[str, CacheEvent] = {}
        self.invalidation_batches: Dict[str, List[str]] = defaultdict(list)
        self.batch_timeout: float = 2.0  # Batch operations for 2 seconds
        
        # Statistics
        self.stats = InvalidationStats()
        
        # Event listeners
        self.event_listeners: Dict[EventType, List[Callable]] = defaultdict(list)
        
        # Background tasks
        self._event_processor_task: Optional[asyncio.Task] = None
        self._batch_processor_task: Optional[asyncio.Task] = None
        self._cleanup_task: Optional[asyncio.Task] = None

    async def initialize(self):
        """Initialize event-driven cache manager"""
        # Register default invalidation rules
        await self._register_default_rules()
        
        # Start background tasks
        self._event_processor_task = asyncio.create_task(self._event_processor())
        self._batch_processor_task = asyncio.create_task(self._batch_processor())
        self._cleanup_task = asyncio.create_task(self._cleanup_old_events())
        
        logger.info("✅ Event-driven cache manager initialized")

    async def _register_default_rules(self):
        """Register default cache invalidation rules"""
        
        # Game state changes invalidate live data
        self.register_rule(InvalidationRule(
            name="game_state_live_invalidation",
            event_type=EventType.GAME_STATE_CHANGE,
            conditions={},
            target_patterns=[
                "*live*{game_id}*",
                "*odds*live*{game_id}*",
                "*score*{game_id}*"
            ],
            scope=InvalidationScope.PATTERN,
            priority=1  # High priority
        ))
        
        # Score updates invalidate game-related data
        self.register_rule(InvalidationRule(
            name="score_update_invalidation",
            event_type=EventType.SCORE_UPDATE,
            conditions={},
            target_patterns=[
                "*game*{game_id}*",
                "*score*{game_id}*",
                "*live*{game_id}*",
                "*odds*{game_id}*"
            ],
            scope=InvalidationScope.PATTERN,
            delay_seconds=1,  # Batch score updates
            priority=1
        ))
        
        # Odds changes invalidate betting data
        self.register_rule(InvalidationRule(
            name="odds_change_invalidation",
            event_type=EventType.ODDS_CHANGE,
            conditions={},
            target_patterns=[
                "*odds*{game_id}*",
                "*betting*{game_id}*",
                "*prop*{game_id}*"
            ],
            scope=InvalidationScope.PATTERN,
            delay_seconds=0.5,  # Quick batch for odds
            priority=1
        ))
        
        # Injury reports invalidate player and team data
        self.register_rule(InvalidationRule(
            name="injury_report_invalidation",
            event_type=EventType.INJURY_REPORT,
            conditions={},
            target_patterns=[
                "*player*{player_id}*",
                "*team*{team_id}*",
                "*injury*{sport}*",
                "*lineup*{team_id}*"
            ],
            scope=InvalidationScope.PATTERN,
            priority=2
        ))
        
        # Lineup changes invalidate team and game data
        self.register_rule(InvalidationRule(
            name="lineup_change_invalidation",
            event_type=EventType.LINEUP_CHANGE,
            conditions={},
            target_patterns=[
                "*lineup*{team_id}*",
                "*team*{team_id}*",
                "*game*{game_id}*",
                "*prop*{game_id}*"
            ],
            scope=InvalidationScope.PATTERN,
            priority=2
        ))
        
        # Player trades invalidate player and team data
        self.register_rule(InvalidationRule(
            name="player_trade_invalidation",
            event_type=EventType.PLAYER_TRADE,
            conditions={},
            target_patterns=[
                "*player*{player_id}*",
                "*team*{team_id}*",
                "*roster*{sport}*"
            ],
            scope=InvalidationScope.PATTERN,
            priority=2
        ))
        
        # Data source updates trigger selective invalidation
        self.register_rule(InvalidationRule(
            name="data_source_update_invalidation",
            event_type=EventType.DATA_SOURCE_UPDATE,
            conditions={},
            target_patterns=[
                "*{source}*{sport}*"
            ],
            scope=InvalidationScope.PATTERN,
            delay_seconds=5,  # Batch data source updates
            priority=3
        ))

    def register_rule(self, rule: InvalidationRule):
        """Register a cache invalidation rule"""
        self.invalidation_rules[rule.name] = rule
        logger.info(f"📋 Registered invalidation rule: {rule.name}")

    def register_event_listener(self, event_type: EventType, callback: Callable):
        """Register callback for specific event types"""
        self.event_listeners[event_type].append(callback)
        logger.info(f"👂 Registered event listener for {event_type.value}")

    async def emit_event(self, 
                        event_type: EventType,
                        source: str,
                        sport: str = None,
                        game_id: str = None,
                        player_id: str = None,
                        team_id: str = None,
                        data_category: str = None,
                        payload: Dict[str, Any] = None,
                        invalidation_scope: InvalidationScope = InvalidationScope.RELATED) -> str:
        """Emit cache invalidation event"""
        
        event = CacheEvent(
            event_id=str(uuid4()),
            event_type=event_type,
            timestamp=datetime.now(timezone.utc),
            source=source,
            sport=sport,
            game_id=game_id,
            player_id=player_id,
            team_id=team_id,
            data_category=data_category,
            payload=payload or {},
            invalidation_scope=invalidation_scope
        )
        
        try:
            # Add to event queue
            await self.event_queue.put(event)
            
            # Update statistics
            self.stats.total_events += 1
            
            logger.debug(
                f"📡 Event emitted: {event_type.value} from {source} "
                f"(game: {game_id}, player: {player_id})"
            )
            
            return event.event_id
            
        except asyncio.QueueFull:
            logger.error("❌ Event queue full, dropping event")
            return None

    async def register_cache_dependency(self, primary_key: str, dependent_keys: List[str]):
        """Register cache key dependencies for cascade invalidation"""
        self.cache_dependencies[primary_key].update(dependent_keys)
        
        # Update reverse dependencies
        for dep_key in dependent_keys:
            self.reverse_dependencies[dep_key].add(primary_key)
        
        logger.debug(f"🔗 Registered dependencies for {primary_key}: {len(dependent_keys)} keys")

    async def invalidate_cache_immediately(self, 
                                         patterns: List[str],
                                         event: CacheEvent = None) -> int:
        """Immediately invalidate cache patterns"""
        start_time = time.time()
        total_invalidated = 0
        
        try:
            for pattern in patterns:
                # Substitute event variables in pattern
                if event:
                    pattern = self._substitute_event_variables(pattern, event)
                
                # Invalidate pattern
                invalidated_count = await intelligent_cache_service.invalidate_pattern(pattern)
                total_invalidated += invalidated_count
                
                logger.debug(f"🗑️ Invalidated {invalidated_count} keys for pattern: {pattern}")
                
                # Handle cascade invalidation
                if event and event.invalidation_scope == InvalidationScope.CASCADE:
                    cascade_count = await self._handle_cascade_invalidation(pattern)
                    total_invalidated += cascade_count
            
            # Update statistics
            processing_time = time.time() - start_time
            self.stats.total_invalidations += 1
            self.stats.invalidated_keys += total_invalidated
            self.stats.last_invalidation = datetime.now(timezone.utc)
            
            # Update average processing time
            if self.stats.total_invalidations > 1:
                self.stats.avg_processing_time = (
                    (self.stats.avg_processing_time * (self.stats.total_invalidations - 1) + processing_time)
                    / self.stats.total_invalidations
                )
            else:
                self.stats.avg_processing_time = processing_time
            
            logger.info(f"✅ Invalidated {total_invalidated} cache keys in {processing_time:.3f}s")
            
            return total_invalidated
            
        except Exception as e:
            logger.error(f"❌ Error in immediate cache invalidation: {e}")
            return 0

    def _substitute_event_variables(self, pattern: str, event: CacheEvent) -> str:
        """Substitute event variables in invalidation pattern"""
        substitutions = {
            '{source}': event.source or '',
            '{sport}': event.sport or '',
            '{game_id}': event.game_id or '',
            '{player_id}': event.player_id or '',
            '{team_id}': event.team_id or '',
            '{data_category}': event.data_category or ''
        }
        
        result = pattern
        for placeholder, value in substitutions.items():
            if placeholder in result and value:
                result = result.replace(placeholder, value)
            elif placeholder in result:
                # Remove patterns with missing variables
                return ""
        
        return result

    async def _handle_cascade_invalidation(self, primary_pattern: str) -> int:
        """Handle cascade invalidation for dependent cache keys"""
        cascade_count = 0
        
        try:
            # Find all keys that match the primary pattern
            # This is simplified - in production, you'd need actual key enumeration
            logger.debug(f"🌊 Handling cascade invalidation for: {primary_pattern}")
            
            # For now, just log the cascade operation
            # In production, implement actual dependency traversal
            
        except Exception as e:
            logger.error(f"❌ Error in cascade invalidation: {e}")
        
        return cascade_count

    async def _event_processor(self):
        """Background task to process invalidation events"""
        while True:
            try:
                # Get event with timeout
                event = await asyncio.wait_for(self.event_queue.get(), timeout=5.0)
                
                # Add to history
                self.event_history.append(event)
                
                # Find applicable rules
                applicable_rules = self._find_applicable_rules(event)
                
                # Process each rule
                for rule in applicable_rules:
                    if rule.delay_seconds > 0:
                        # Add to batch processing
                        await self._add_to_batch(event, rule)
                    else:
                        # Process immediately
                        await self._process_invalidation_rule(event, rule)
                
                # Notify event listeners
                await self._notify_event_listeners(event)
                
                # Mark event as processed
                event.processed = True
                
            except asyncio.TimeoutError:
                # No events to process
                continue
            except Exception as e:
                logger.error(f"❌ Event processor error: {e}")
                await asyncio.sleep(1)

    def _find_applicable_rules(self, event: CacheEvent) -> List[InvalidationRule]:
        """Find invalidation rules applicable to event"""
        applicable_rules = []
        
        for rule in self.invalidation_rules.values():
            if not rule.enabled:
                continue
            
            if rule.event_type != event.event_type:
                continue
            
            # Check conditions
            if self._check_rule_conditions(event, rule):
                applicable_rules.append(rule)
        
        # Sort by priority (lower number = higher priority)
        applicable_rules.sort(key=lambda r: r.priority)
        
        return applicable_rules

    def _check_rule_conditions(self, event: CacheEvent, rule: InvalidationRule) -> bool:
        """Check if event meets rule conditions"""
        for condition_key, condition_value in rule.conditions.items():
            event_value = getattr(event, condition_key, None)
            
            if event_value != condition_value:
                return False
        
        return True

    async def _process_invalidation_rule(self, event: CacheEvent, rule: InvalidationRule):
        """Process invalidation rule for event"""
        try:
            # Substitute variables in target patterns
            processed_patterns = []
            for pattern in rule.target_patterns:
                processed_pattern = self._substitute_event_variables(pattern, event)
                if processed_pattern:  # Only add non-empty patterns
                    processed_patterns.append(processed_pattern)
            
            if processed_patterns:
                await self.invalidate_cache_immediately(processed_patterns, event)
                
                logger.debug(
                    f"✅ Processed rule '{rule.name}' for event {event.event_id} "
                    f"({len(processed_patterns)} patterns)"
                )
            
        except Exception as e:
            logger.error(f"❌ Error processing invalidation rule '{rule.name}': {e}")

    async def _add_to_batch(self, event: CacheEvent, rule: InvalidationRule):
        """Add event to batch processing queue"""
        batch_key = f"{rule.name}_{event.sport}_{event.game_id}"
        
        if batch_key not in self.pending_invalidations:
            self.pending_invalidations[batch_key] = event
            
            # Schedule batch processing
            asyncio.create_task(self._schedule_batch_processing(batch_key, rule.delay_seconds))
            
            logger.debug(f"📦 Added event to batch: {batch_key}")

    async def _schedule_batch_processing(self, batch_key: str, delay_seconds: float):
        """Schedule batch processing after delay"""
        await asyncio.sleep(delay_seconds)
        
        if batch_key in self.pending_invalidations:
            event = self.pending_invalidations.pop(batch_key)
            
            # Find the rule again
            applicable_rules = self._find_applicable_rules(event)
            
            for rule in applicable_rules:
                if rule.delay_seconds > 0:  # This was the batched rule
                    await self._process_invalidation_rule(event, rule)
                    self.stats.batched_operations += 1
                    break

    async def _batch_processor(self):
        """Background task for batch processing optimization"""
        while True:
            try:
                await asyncio.sleep(self.batch_timeout)
                
                # Process any remaining batches
                if self.pending_invalidations:
                    logger.debug(f"📦 Processing {len(self.pending_invalidations)} pending batches")
                
            except Exception as e:
                logger.error(f"❌ Batch processor error: {e}")

    async def _notify_event_listeners(self, event: CacheEvent):
        """Notify registered event listeners"""
        listeners = self.event_listeners.get(event.event_type, [])
        
        for listener in listeners:
            try:
                await listener(event)
            except Exception as e:
                logger.error(f"❌ Event listener error: {e}")

    async def _cleanup_old_events(self):
        """Clean up old events and statistics"""
        while True:
            try:
                await asyncio.sleep(3600)  # Clean up every hour
                
                # Clean up old pending invalidations
                cutoff_time = datetime.now(timezone.utc) - timedelta(minutes=10)
                
                old_batches = [
                    batch_key for batch_key, event in self.pending_invalidations.items()
                    if event.timestamp < cutoff_time
                ]
                
                for batch_key in old_batches:
                    self.pending_invalidations.pop(batch_key, None)
                
                if old_batches:
                    logger.info(f"🧹 Cleaned up {len(old_batches)} old batch entries")
                
            except Exception as e:
                logger.error(f"❌ Cleanup task error: {e}")

    async def get_invalidation_stats(self) -> Dict[str, Any]:
        """Get cache invalidation statistics"""
        return {
            "stats": {
                "total_events": self.stats.total_events,
                "total_invalidations": self.stats.total_invalidations,
                "invalidated_keys": self.stats.invalidated_keys,
                "batched_operations": self.stats.batched_operations,
                "avg_processing_time": self.stats.avg_processing_time,
                "last_invalidation": self.stats.last_invalidation.isoformat() if self.stats.last_invalidation else None
            },
            "rules": {
                "total_rules": len(self.invalidation_rules),
                "enabled_rules": len([r for r in self.invalidation_rules.values() if r.enabled]),
                "rules_by_event_type": {}
            },
            "current_state": {
                "pending_batches": len(self.pending_invalidations),
                "event_queue_size": self.event_queue.qsize(),
                "recent_events": len(self.event_history)
            }
        }

    async def close(self):
        """Cleanup event-driven cache manager resources"""
        logger.info("🔄 Shutting down event-driven cache manager...")
        
        # Cancel background tasks
        for task in [self._event_processor_task, self._batch_processor_task, self._cleanup_task]:
            if task and not task.done():
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass
        
        # Process any remaining events
        while not self.event_queue.empty():
            try:
                event = self.event_queue.get_nowait()
                # Quick processing without delay
                applicable_rules = self._find_applicable_rules(event)
                for rule in applicable_rules:
                    await self._process_invalidation_rule(event, rule)
            except:
                break
        
        logger.info("✅ Event-driven cache manager shutdown completed")


# Global instance
event_driven_cache = EventDrivenCacheManager()
