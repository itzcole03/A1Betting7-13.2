"""
Real-time Prop Updates System - Priority 2 Implementation
Advanced real-time prop betting updates with event streaming and intelligent notifications
"""

import asyncio
import json
import logging
import time
from collections import defaultdict, deque
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Callable, Dict, List, Optional, Set, Tuple, Union
from uuid import uuid4

from backend.services.enhanced_async_pipeline import EnhancedAsyncPipeline
from backend.services.enhanced_realtime_websocket import EnhancedConnectionManager
from backend.services.optimized_redis_service import OptimizedRedisService
from backend.utils.enhanced_logging import get_logger

logger = get_logger("realtime_prop_updates")


class PropUpdateType(Enum):
    """Types of prop updates"""

    ODDS_CHANGE = "odds_change"
    LINE_MOVEMENT = "line_movement"
    MARKET_OPEN = "market_open"
    MARKET_CLOSE = "market_close"
    MARKET_SUSPEND = "market_suspend"
    NEW_PROP = "new_prop"
    PROP_REMOVED = "prop_removed"
    INJURY_UPDATE = "injury_update"
    LINEUP_CHANGE = "lineup_change"
    WEATHER_UPDATE = "weather_update"
    SHARP_MONEY = "sharp_money"
    PUBLIC_MONEY = "public_money"
    VALUE_ALERT = "value_alert"


class UpdatePriority(Enum):
    """Update priority levels"""

    CRITICAL = 1  # Major line movements, market closures
    HIGH = 2  # Significant odds changes, injury updates
    MEDIUM = 3  # Regular odds adjustments
    LOW = 4  # Minor updates, informational


class PropMarket(Enum):
    """Prop betting markets"""

    PLAYER_PROPS = "player_props"
    TEAM_PROPS = "team_props"
    GAME_PROPS = "game_props"
    FUTURES = "futures"
    LIVE_BETTING = "live_betting"


@dataclass
class PropUpdate:
    """Prop update data structure"""

    id: str = field(default_factory=lambda: str(uuid4()))
    prop_id: str = ""
    player_id: Optional[str] = None
    game_id: Optional[str] = None
    market_type: PropMarket = PropMarket.PLAYER_PROPS
    update_type: PropUpdateType = PropUpdateType.ODDS_CHANGE
    priority: UpdatePriority = UpdatePriority.MEDIUM

    # Update data
    old_value: Optional[Dict[str, Any]] = None
    new_value: Dict[str, Any] = field(default_factory=dict)
    change_percentage: Optional[float] = None
    sportsbook: Optional[str] = None

    # Metadata
    timestamp: datetime = field(default_factory=datetime.now)
    source: str = "system"
    confidence: float = 1.0
    tags: List[str] = field(default_factory=list)

    # Alert flags
    is_alert: bool = False
    alert_reason: Optional[str] = None
    value_rating: Optional[str] = None


@dataclass
class PropSubscription:
    """Prop update subscription"""

    id: str = field(default_factory=lambda: str(uuid4()))
    user_id: str = ""
    connection_id: str = ""

    # Subscription filters
    prop_ids: Set[str] = field(default_factory=set)
    player_ids: Set[str] = field(default_factory=set)
    game_ids: Set[str] = field(default_factory=set)
    markets: Set[PropMarket] = field(default_factory=set)
    update_types: Set[PropUpdateType] = field(default_factory=set)
    priority_threshold: UpdatePriority = UpdatePriority.LOW

    # Alert settings
    value_alerts_enabled: bool = True
    line_movement_threshold: float = 0.1  # 10% movement threshold
    odds_change_threshold: float = 0.05  # 5% odds change threshold

    # Metadata
    created_at: datetime = field(default_factory=datetime.now)
    last_update: datetime = field(default_factory=datetime.now)
    is_active: bool = True


@dataclass
class PropNotification:
    """Prop notification to send to client"""

    id: str = field(default_factory=lambda: str(uuid4()))
    subscription_id: str = ""
    update: PropUpdate = field(default_factory=PropUpdate)
    notification_type: str = "prop_update"
    formatted_message: str = ""
    action_required: bool = False
    expires_at: Optional[datetime] = None


class PropUpdateProcessor:
    """Processes and analyzes prop updates"""

    def __init__(self):
        self.historical_data: Dict[str, deque] = defaultdict(lambda: deque(maxlen=1000))
        self.price_history: Dict[str, deque] = defaultdict(lambda: deque(maxlen=100))
        self.volume_tracking: Dict[str, int] = defaultdict(int)

    async def analyze_update(self, update: PropUpdate) -> PropUpdate:
        """Analyze prop update for significance and alerts"""
        try:
            # Store historical data
            self.historical_data[update.prop_id].append(update)

            # Analyze price movement if applicable
            if update.update_type == PropUpdateType.ODDS_CHANGE:
                await self._analyze_odds_movement(update)
            elif update.update_type == PropUpdateType.LINE_MOVEMENT:
                await self._analyze_line_movement(update)

            # Check for value opportunities
            await self._check_value_alerts(update)

            # Analyze market sentiment
            await self._analyze_market_sentiment(update)

            # Update priority based on analysis
            await self._calculate_update_priority(update)

            return update

        except Exception as e:
            logger.error(f"Error analyzing prop update {update.id}: {e}")
            return update

    async def _analyze_odds_movement(self, update: PropUpdate):
        """Analyze odds movement patterns"""
        if not update.old_value or not update.new_value:
            return

        try:
            old_odds = update.old_value.get("odds", 0)
            new_odds = update.new_value.get("odds", 0)

            if old_odds and new_odds:
                change = (new_odds - old_odds) / old_odds
                update.change_percentage = change

                # Store price history
                self.price_history[update.prop_id].append(
                    {"timestamp": update.timestamp, "odds": new_odds, "change": change}
                )

                # Check for significant movement
                if abs(change) > 0.15:  # 15% change
                    update.priority = UpdatePriority.HIGH
                    update.is_alert = True
                    update.alert_reason = f"Significant odds movement: {change:.1%}"

        except Exception as e:
            logger.warning(f"Error analyzing odds movement: {e}")

    async def _analyze_line_movement(self, update: PropUpdate):
        """Analyze line movement patterns"""
        try:
            old_line = update.old_value.get("line") if update.old_value else None
            new_line = update.new_value.get("line")

            if old_line is not None and new_line is not None:
                line_change = new_line - old_line
                update.new_value["line_change"] = line_change

                # Significant line movement
                if abs(line_change) >= 1.0:
                    update.priority = UpdatePriority.HIGH
                    update.is_alert = True
                    update.alert_reason = f"Line moved {line_change:+.1f}"

        except Exception as e:
            logger.warning(f"Error analyzing line movement: {e}")

    async def _check_value_alerts(self, update: PropUpdate):
        """Check for value betting opportunities"""
        try:
            # Implement value calculation logic
            implied_probability = update.new_value.get("implied_probability")
            true_probability = update.new_value.get("model_probability")

            if implied_probability and true_probability:
                edge = true_probability - implied_probability

                if edge > 0.05:  # 5% edge
                    update.is_alert = True
                    update.alert_reason = f"Value opportunity: {edge:.1%} edge"
                    update.value_rating = "excellent" if edge > 0.10 else "good"
                    update.priority = UpdatePriority.HIGH

        except Exception as e:
            logger.warning(f"Error checking value alerts: {e}")

    async def _analyze_market_sentiment(self, update: PropUpdate):
        """Analyze market sentiment and money flow"""
        try:
            # Track volume and movement correlation
            prop_id = update.prop_id
            self.volume_tracking[prop_id] += 1

            # Analyze recent update frequency
            recent_updates = [
                u
                for u in self.historical_data[prop_id]
                if (datetime.now() - u.timestamp).total_seconds()
                < 300  # Last 5 minutes
            ]

            if len(recent_updates) > 5:
                update.tags.append("high_activity")

            # Sharp money indicators
            if (
                update.update_type == PropUpdateType.ODDS_CHANGE
                and update.change_percentage
                and abs(update.change_percentage) > 0.08
            ):

                # Check if movement is against public money
                if update.sportsbook in ["pinnacle", "circa", "bookmaker"]:
                    update.tags.append("sharp_money")
                    update.priority = UpdatePriority.HIGH

        except Exception as e:
            logger.warning(f"Error analyzing market sentiment: {e}")

    async def _calculate_update_priority(self, update: PropUpdate):
        """Calculate final update priority"""
        # Start with base priority
        priority_score = update.priority.value

        # Adjust based on tags and conditions
        if "sharp_money" in update.tags:
            priority_score = min(priority_score, UpdatePriority.HIGH.value)

        if "high_activity" in update.tags:
            priority_score = min(priority_score, UpdatePriority.MEDIUM.value)

        if update.is_alert:
            priority_score = min(priority_score, UpdatePriority.HIGH.value)

        # Update priority
        update.priority = UpdatePriority(priority_score)


class PropUpdateDistributor:
    """Distributes prop updates to subscribers"""

    def __init__(
        self,
        websocket_manager: EnhancedConnectionManager,
        redis_service: OptimizedRedisService,
    ):
        self.websocket_manager = websocket_manager
        self.redis_service = redis_service
        self.subscriptions: Dict[str, PropSubscription] = {}
        self.user_subscriptions: Dict[str, Set[str]] = defaultdict(set)

    async def add_subscription(self, subscription: PropSubscription) -> str:
        """Add new prop subscription"""
        self.subscriptions[subscription.id] = subscription
        self.user_subscriptions[subscription.user_id].add(subscription.id)

        # Cache subscription in Redis
        cache_key = f"prop_subscription:{subscription.id}"
        await self.redis_service.set(cache_key, subscription.__dict__, ttl=86400)

        logger.info(
            f"Added prop subscription {subscription.id} for user {subscription.user_id}"
        )
        return subscription.id

    async def remove_subscription(self, subscription_id: str):
        """Remove prop subscription"""
        subscription = self.subscriptions.pop(subscription_id, None)
        if subscription:
            self.user_subscriptions[subscription.user_id].discard(subscription_id)

            # Remove from Redis
            cache_key = f"prop_subscription:{subscription_id}"
            await self.redis_service.delete(cache_key)

            logger.info(f"Removed prop subscription {subscription_id}")

    async def distribute_update(self, update: PropUpdate):
        """Distribute update to relevant subscribers"""
        matching_subscriptions = await self._find_matching_subscriptions(update)

        if not matching_subscriptions:
            return

        # Create notifications
        notifications = []
        for subscription in matching_subscriptions:
            notification = await self._create_notification(subscription, update)
            if notification:
                notifications.append(notification)

        # Send notifications
        await self._send_notifications(notifications)

        logger.debug(
            f"Distributed update {update.id} to {len(notifications)} subscribers"
        )

    async def _find_matching_subscriptions(
        self, update: PropUpdate
    ) -> List[PropSubscription]:
        """Find subscriptions that match the update"""
        matching = []

        for subscription in self.subscriptions.values():
            if not subscription.is_active:
                continue

            # Check priority threshold
            if update.priority.value > subscription.priority_threshold.value:
                continue

            # Check filters
            if subscription.prop_ids and update.prop_id not in subscription.prop_ids:
                continue

            if (
                subscription.player_ids
                and update.player_id
                and update.player_id not in subscription.player_ids
            ):
                continue

            if (
                subscription.game_ids
                and update.game_id
                and update.game_id not in subscription.game_ids
            ):
                continue

            if subscription.markets and update.market_type not in subscription.markets:
                continue

            if (
                subscription.update_types
                and update.update_type not in subscription.update_types
            ):
                continue

            # Check alert thresholds
            if update.update_type == PropUpdateType.ODDS_CHANGE:
                if (
                    update.change_percentage
                    and abs(update.change_percentage)
                    < subscription.odds_change_threshold
                ):
                    continue

            matching.append(subscription)

        return matching

    async def _create_notification(
        self, subscription: PropSubscription, update: PropUpdate
    ) -> Optional[PropNotification]:
        """Create notification for subscription"""
        try:
            notification = PropNotification(
                subscription_id=subscription.id, update=update
            )

            # Format message based on update type
            notification.formatted_message = await self._format_update_message(update)

            # Set action required flag
            notification.action_required = (
                update.is_alert or update.priority == UpdatePriority.CRITICAL
            )

            # Set expiration
            if update.update_type in [
                PropUpdateType.MARKET_CLOSE,
                PropUpdateType.MARKET_SUSPEND,
            ]:
                notification.expires_at = datetime.now() + timedelta(minutes=5)

            return notification

        except Exception as e:
            logger.error(f"Error creating notification: {e}")
            return None

    async def _format_update_message(self, update: PropUpdate) -> str:
        """Format update message for display"""
        try:
            if update.update_type == PropUpdateType.ODDS_CHANGE:
                if update.change_percentage:
                    direction = "up" if update.change_percentage > 0 else "down"
                    return f"Odds moved {direction} {abs(update.change_percentage):.1%}"

            elif update.update_type == PropUpdateType.LINE_MOVEMENT:
                line_change = update.new_value.get("line_change", 0)
                direction = "up" if line_change > 0 else "down"
                return f"Line moved {direction} {abs(line_change):.1f}"

            elif update.update_type == PropUpdateType.VALUE_ALERT:
                return f"Value alert: {update.alert_reason}"

            elif update.update_type == PropUpdateType.MARKET_CLOSE:
                return "Market closed"

            elif update.update_type == PropUpdateType.SHARP_MONEY:
                return "Sharp money detected"

            return f"{update.update_type.value.replace('_', ' ').title()}"

        except Exception as e:
            logger.error(f"Error formatting message: {e}")
            return "Prop update available"

    async def _send_notifications(self, notifications: List[PropNotification]):
        """Send notifications to clients"""
        tasks = []

        for notification in notifications:
            subscription = self.subscriptions.get(notification.subscription_id)
            if not subscription:
                continue

            task = asyncio.create_task(
                self._send_single_notification(subscription, notification)
            )
            tasks.append(task)

        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)

    async def _send_single_notification(
        self, subscription: PropSubscription, notification: PropNotification
    ):
        """Send single notification to client"""
        try:
            message = {
                "type": "prop_update",
                "data": {
                    "notification_id": notification.id,
                    "prop_id": notification.update.prop_id,
                    "update_type": notification.update.update_type.value,
                    "priority": notification.update.priority.value,
                    "message": notification.formatted_message,
                    "update_data": notification.update.new_value,
                    "timestamp": notification.update.timestamp.isoformat(),
                    "is_alert": notification.update.is_alert,
                    "action_required": notification.action_required,
                    "tags": notification.update.tags,
                },
            }

            # Send via WebSocket
            await self.websocket_manager.send_to_connection(
                subscription.connection_id, message
            )

            # Update subscription last_update time
            subscription.last_update = datetime.now()

        except Exception as e:
            logger.error(f"Error sending notification: {e}")


class RealTimePropSystem:
    """Main real-time prop updates system"""

    def __init__(
        self,
        redis_service: OptimizedRedisService,
        websocket_manager: EnhancedConnectionManager,
    ):
        self.redis_service = redis_service
        self.websocket_manager = websocket_manager

        # Components
        self.processor = PropUpdateProcessor()
        self.distributor = PropUpdateDistributor(websocket_manager, redis_service)

        # Processing pipeline
        self.update_pipeline: Optional[EnhancedAsyncPipeline] = None

        # State
        self.is_running = False
        self.update_queue: asyncio.Queue = asyncio.Queue(maxsize=10000)
        self.stats = {
            "updates_processed": 0,
            "notifications_sent": 0,
            "active_subscriptions": 0,
            "processing_rate": 0.0,
        }

    async def start(self):
        """Start the real-time prop system"""
        if self.is_running:
            return

        logger.info("Starting real-time prop updates system")
        self.is_running = True

        # Start processing tasks
        self.processing_task = asyncio.create_task(self._processing_loop())
        self.stats_task = asyncio.create_task(self._stats_loop())

        logger.info("Real-time prop updates system started")

    async def stop(self):
        """Stop the real-time prop system"""
        if not self.is_running:
            return

        logger.info("Stopping real-time prop updates system")
        self.is_running = False

        # Cancel tasks
        if hasattr(self, "processing_task"):
            self.processing_task.cancel()
        if hasattr(self, "stats_task"):
            self.stats_task.cancel()

        logger.info("Real-time prop updates system stopped")

    async def submit_update(self, update: PropUpdate) -> str:
        """Submit prop update for processing"""
        if not self.is_running:
            raise RuntimeError("Prop system is not running")

        await self.update_queue.put(update)
        return update.id

    async def subscribe(
        self, user_id: str, connection_id: str, filters: Dict[str, Any]
    ) -> str:
        """Create new prop subscription"""
        subscription = PropSubscription(user_id=user_id, connection_id=connection_id)

        # Apply filters
        if "prop_ids" in filters:
            subscription.prop_ids = set(filters["prop_ids"])
        if "player_ids" in filters:
            subscription.player_ids = set(filters["player_ids"])
        if "game_ids" in filters:
            subscription.game_ids = set(filters["game_ids"])
        if "markets" in filters:
            subscription.markets = {PropMarket(m) for m in filters["markets"]}
        if "update_types" in filters:
            subscription.update_types = {
                PropUpdateType(t) for t in filters["update_types"]
            }
        if "priority_threshold" in filters:
            subscription.priority_threshold = UpdatePriority(
                filters["priority_threshold"]
            )

        return await self.distributor.add_subscription(subscription)

    async def unsubscribe(self, subscription_id: str):
        """Remove prop subscription"""
        await self.distributor.remove_subscription(subscription_id)

    async def _processing_loop(self):
        """Main processing loop"""
        while self.is_running:
            try:
                # Get update from queue
                update = await asyncio.wait_for(self.update_queue.get(), timeout=1.0)

                # Process update
                processed_update = await self.processor.analyze_update(update)

                # Distribute to subscribers
                await self.distributor.distribute_update(processed_update)

                # Update stats
                self.stats["updates_processed"] += 1

            except asyncio.TimeoutError:
                continue
            except Exception as e:
                logger.error(f"Error in processing loop: {e}")
                await asyncio.sleep(1)

    async def _stats_loop(self):
        """Statistics tracking loop"""
        last_count = 0

        while self.is_running:
            try:
                await asyncio.sleep(60)  # Update stats every minute

                current_count = self.stats["updates_processed"]
                self.stats["processing_rate"] = (current_count - last_count) / 60.0
                last_count = current_count

                self.stats["active_subscriptions"] = len(self.distributor.subscriptions)

                logger.info(
                    f"Prop system stats: "
                    f"rate={self.stats['processing_rate']:.2f}/s, "
                    f"subscriptions={self.stats['active_subscriptions']}, "
                    f"queue={self.update_queue.qsize()}"
                )

            except Exception as e:
                logger.error(f"Error in stats loop: {e}")

    async def get_stats(self) -> Dict[str, Any]:
        """Get system statistics"""
        return {
            **self.stats,
            "queue_size": self.update_queue.qsize(),
            "is_running": self.is_running,
        }


# Global prop system instance
prop_system: Optional[RealTimePropSystem] = None


async def get_prop_system() -> RealTimePropSystem:
    """Get initialized prop system"""
    global prop_system

    if prop_system is None:
        from backend.services.enhanced_realtime_websocket import (
            enhanced_websocket_manager,
        )

        redis_service = OptimizedRedisService()
        prop_system = RealTimePropSystem(redis_service, enhanced_websocket_manager)

    return prop_system
