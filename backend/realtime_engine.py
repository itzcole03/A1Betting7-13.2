"""Ultra-Enhanced Real-time Processing Engine
High-frequency data processing, stream analytics, and real-time prediction updates
"""

import asyncio
import json
import logging
import uuid
from collections import defaultdict, deque
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from enum import Enum
from typing import Any, Callable, Dict, List, Optional, Set

try:
    import aioredis
except ImportError:
    aioredis = None  # Placeholder for aioredis if not installed

from config import config_manager
from ensemble_engine import PredictionContext, ultra_ensemble_engine

logger = logging.getLogger(__name__)


class StreamType(str, Enum):
    """Types of real-time streams"""

    LIVE_SCORES = "live_scores"
    BETTING_ODDS = "betting_odds"
    LINE_MOVEMENTS = "line_movements"
    PLAYER_UPDATES = "player_updates"
    INJURY_ALERTS = "injury_alerts"
    WEATHER_UPDATES = "weather_updates"
    NEWS_SENTIMENT = "news_sentiment"
    SOCIAL_SENTIMENT = "social_sentiment"
    PREDICTIONS = "predictions"
    OPPORTUNITIES = "opportunities"


class UpdatePriority(str, Enum):
    """Priority levels for real-time updates"""

    CRITICAL = "critical"  # Game scores, major injuries
    HIGH = "high"  # Line movements, odds changes
    MEDIUM = "medium"  # Player stats, news
    LOW = "low"  # Social sentiment, background data


@dataclass
class StreamMessage:
    """Real-time stream message"""

    id: str
    stream_type: StreamType
    priority: UpdatePriority
    data: Dict[str, Any]
    timestamp: datetime
    source: str
    event_id: Optional[str] = None
    expiry: Optional[datetime] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class StreamSubscription:
    """Stream subscription configuration"""

    subscriber_id: str
    stream_types: Set[StreamType]
    filters: Dict[str, Any]
    callback: Optional[Callable] = None
    websocket: Optional[Any] = None
    last_activity: datetime = field(default_factory=datetime.utcnow)
    message_count: int = 0
    created_at: datetime = field(default_factory=datetime.utcnow)


class StreamAggregator:
    """Intelligent stream aggregation and deduplication"""

    def __init__(self, window_size: int = 5):
        self.window_size = window_size  # seconds
        self.message_buffer: Dict[str, deque] = defaultdict(lambda: deque(maxlen=100))
        self.aggregation_rules = self._initialize_aggregation_rules()

    def _initialize_aggregation_rules(self) -> Dict[StreamType, Dict]:
        """Initialize aggregation rules for different stream types"""
        return {
            StreamType.LIVE_SCORES: {
                "dedup_key": lambda msg: f"{msg.event_id}_{msg.data.get('period')}",
                "merge_strategy": "latest",
                "buffer_time": 2.0,
            },
            StreamType.BETTING_ODDS: {
                "dedup_key": lambda msg: f"{msg.event_id}_{msg.data.get('market_type')}_{msg.data.get('sportsbook')}",
                "merge_strategy": "best_odds",
                "buffer_time": 1.0,
            },
            StreamType.LINE_MOVEMENTS: {
                "dedup_key": lambda msg: f"{msg.event_id}_{msg.data.get('line_type')}",
                "merge_strategy": "track_movement",
                "buffer_time": 3.0,
            },
            StreamType.PLAYER_UPDATES: {
                "dedup_key": lambda msg: f"{msg.data.get('player_id')}_{msg.data.get('stat_type')}",
                "merge_strategy": "accumulate",
                "buffer_time": 5.0,
            },
        }

    async def process_message(self, message: StreamMessage) -> Optional[StreamMessage]:
        """Process and potentially aggregate incoming message"""
        try:
            stream_type = message.stream_type

            if stream_type not in self.aggregation_rules:
                return message  # No aggregation rule, pass through

            rule = self.aggregation_rules[stream_type]
            dedup_key = rule["dedup_key"](message)
            buffer_time = rule["buffer_time"]

            # Add to buffer
            self.message_buffer[dedup_key].append(message)

            # Check if we should aggregate
            current_time = datetime.now(timezone.utc)
            buffer_messages = list(self.message_buffer[dedup_key])

            if not buffer_messages:
                return message

            # Check if oldest message is beyond buffer time
            oldest_message = buffer_messages[0]
            if (current_time - oldest_message.timestamp).total_seconds() < buffer_time:
                return None  # Still buffering

            # Aggregate messages
            aggregated = await self._aggregate_messages(
                buffer_messages, rule["merge_strategy"]
            )

            # Clear buffer for this key
            self.message_buffer[dedup_key].clear()

            return aggregated

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Message aggregation failed: {e!s}")
            return message  # Return original on error

    async def _aggregate_messages(
        self, messages: List[StreamMessage], strategy: str
    ) -> StreamMessage:
        """Aggregate messages based on strategy"""
        if not messages:
            raise ValueError("No messages to aggregate")

        if len(messages) == 1:
            return messages[0]

        latest_message = max(messages, key=lambda m: m.timestamp)

        if strategy == "latest":
            return latest_message

        elif strategy == "best_odds":
            return await self._aggregate_best_odds(messages)

        elif strategy == "track_movement":
            return await self._aggregate_line_movement(messages)

        elif strategy == "accumulate":
            return await self._aggregate_accumulate(messages)

        else:
            return latest_message

    async def _aggregate_best_odds(
        self, messages: List[StreamMessage]
    ) -> StreamMessage:
        """Aggregate betting odds to find best odds"""
        best_message = messages[0]
        best_odds = best_message.data.get("odds", 0)

        for message in messages[1:]:
            odds = message.data.get("odds", 0)
            if odds > best_odds:
                best_odds = odds
                best_message = message

        # Add metadata about aggregation
        best_message.metadata["aggregated_from"] = len(messages)
        best_message.metadata["aggregation_strategy"] = "best_odds"

        return best_message

    async def _aggregate_line_movement(
        self, messages: List[StreamMessage]
    ) -> StreamMessage:
        """Aggregate line movements to track direction and magnitude"""
        if not messages:
            return None

        # Sort by timestamp
        sorted_messages = sorted(messages, key=lambda m: m.timestamp)
        latest = sorted_messages[-1]

        # Calculate movement
        if len(sorted_messages) > 1:
            first_line = sorted_messages[0].data.get("line", 0)
            last_line = latest.data.get("line", 0)
            movement = last_line - first_line

            latest.data["line_movement"] = movement
            latest.data["movement_direction"] = (
                "up" if movement > 0 else "down" if movement < 0 else "stable"
            )
            latest.data["movement_magnitude"] = abs(movement)

        latest.metadata["aggregated_from"] = len(messages)
        latest.metadata["aggregation_strategy"] = "track_movement"

        return latest

    async def _aggregate_accumulate(
        self, messages: List[StreamMessage]
    ) -> StreamMessage:
        """Accumulate values (for stats updates)"""
        if not messages:
            return None

        latest = messages[-1]

        # Accumulate numerical values
        accumulated_data = latest.data.copy()

        for message in messages[:-1]:
            for key, value in message.data.items():
                if isinstance(value, (int, float)) and key != "timestamp":
                    accumulated_data[key] = accumulated_data.get(key, 0) + value

        latest.data = accumulated_data
        latest.metadata["aggregated_from"] = len(messages)
        latest.metadata["aggregation_strategy"] = "accumulate"

        return latest


class PredictionTriggerEngine:
    """Engine for triggering predictions based on real-time events"""

    def __init__(self):
        self.trigger_rules = self._initialize_trigger_rules()
        self.last_predictions: Dict[str, datetime] = {}
        self.prediction_cooldowns: Dict[str, int] = {
            "live_score_update": 30,  # 30 seconds
            "odds_change": 60,  # 1 minute
            "injury_alert": 300,  # 5 minutes
            "lineup_change": 600,  # 10 minutes
        }

    def _initialize_trigger_rules(self) -> Dict[StreamType, List[Dict]]:
        """Initialize rules for triggering predictions"""
        return {
            StreamType.LIVE_SCORES: [
                {
                    "condition": lambda msg: msg.data.get("score_change", 0) > 0,
                    "trigger_type": "live_score_update",
                    "prediction_context": PredictionContext.LIVE_GAME,
                    "priority": UpdatePriority.HIGH,
                }
            ],
            StreamType.BETTING_ODDS: [
                {
                    "condition": lambda msg: abs(msg.data.get("odds_change", 0)) > 0.1,
                    "trigger_type": "odds_change",
                    "prediction_context": PredictionContext.PRE_GAME,
                    "priority": UpdatePriority.MEDIUM,
                }
            ],
            StreamType.INJURY_ALERTS: [
                {
                    "condition": lambda msg: msg.data.get("severity", "minor")
                    in ["major", "questionable"],
                    "trigger_type": "injury_alert",
                    "prediction_context": PredictionContext.PRE_GAME,
                    "priority": UpdatePriority.CRITICAL,
                }
            ],
            StreamType.LINE_MOVEMENTS: [
                {
                    "condition": lambda msg: abs(msg.data.get("movement_magnitude", 0))
                    > 2.0,
                    "trigger_type": "significant_line_movement",
                    "prediction_context": PredictionContext.PRE_GAME,
                    "priority": UpdatePriority.HIGH,
                }
            ],
        }

    async def evaluate_triggers(self, message: StreamMessage) -> List[Dict[str, Any]]:
        """Evaluate if message should trigger new predictions"""
        try:
            triggers = []

            if message.stream_type not in self.trigger_rules:
                return triggers

            rules = self.trigger_rules[message.stream_type]

            for rule in rules:
                try:
                    if rule["condition"](message):
                        # Check cooldown
                        trigger_key = f"{message.event_id}_{rule['trigger_type']}"
                        cooldown = self.prediction_cooldowns.get(
                            rule["trigger_type"], 60
                        )

                        if self._is_cooldown_satisfied(trigger_key, cooldown):
                            triggers.append(
                                {
                                    "trigger_type": rule["trigger_type"],
                                    "prediction_context": rule["prediction_context"],
                                    "priority": rule["priority"],
                                    "event_id": message.event_id,
                                    "triggering_message": message,
                                    "metadata": {
                                        "trigger_timestamp": datetime.now(timezone.utc),
                                        "source_stream": message.stream_type,
                                    },
                                }
                            )

                            # Update last prediction time
                            self.last_predictions[trigger_key] = datetime.now(
                                timezone.utc
                            )

                except Exception as e:  # pylint: disable=broad-exception-caught
                    logger.warning("Trigger evaluation failed: {e!s}")
                    continue

            return triggers

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Trigger evaluation error: {e!s}")
            return []

    def _is_cooldown_satisfied(self, trigger_key: str, cooldown_seconds: int) -> bool:
        """Check if cooldown period has passed"""
        if trigger_key not in self.last_predictions:
            return True

        last_prediction = self.last_predictions[trigger_key]
        elapsed = (datetime.now(timezone.utc) - last_prediction).total_seconds()

        return elapsed >= cooldown_seconds


class RealTimeStreamManager:
    """Main real-time stream management system"""

    def __init__(self):
        self.redis_client: Optional[aioredis.Redis] = None
        self.subscribers: Dict[str, StreamSubscription] = {}
        self.websocket_connections: Set[Any] = set()
        self.stream_aggregator = StreamAggregator()
        self.prediction_trigger = PredictionTriggerEngine()
        self.message_queue = asyncio.Queue(maxsize=10000)
        self.processing_tasks: List[asyncio.Task] = []
        self.statistics = {
            "messages_processed": 0,
            "messages_sent": 0,
            "active_subscribers": 0,
            "uptime_start": datetime.now(timezone.utc),
        }

    async def initialize(self):
        """Initialize the real-time stream manager"""
        try:
            # Initialize Redis for pub/sub
            self.redis_client = aioredis.from_url(
                config_manager.get_redis_url(), decode_responses=True
            )

            # Start processing tasks
            self.processing_tasks = [
                asyncio.create_task(self._message_processor()),
                asyncio.create_task(self._heartbeat_monitor()),
                asyncio.create_task(self._statistics_updater()),
                asyncio.create_task(self._cleanup_task()),
            ]

            # Subscribe to Redis channels
            await self._setup_redis_subscriptions()

            logger.info("Real-time stream manager initialized")

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Stream manager initialization failed: {e!s}")
            raise

    async def _setup_redis_subscriptions(self):
        """Setup Redis pub/sub subscriptions"""
        try:
            pubsub = self.redis_client.pubsub()

            # Subscribe to all stream types
            channels = [f"stream:{stream_type.value}" for stream_type in StreamType]
            await pubsub.subscribe(*channels)

            # Start Redis message handler
            asyncio.create_task(self._redis_message_handler(pubsub))

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Redis subscription setup failed: {e!s}")

    async def _redis_message_handler(self, pubsub):
        """Handle messages from Redis pub/sub"""
        try:
            async for message in pubsub.listen():
                if message["type"] == "message":
                    try:
                        message["channel"]
                        data = json.loads(message["data"])

                        # Convert to StreamMessage
                        stream_message = StreamMessage(
                            id=data.get("id", str(uuid.uuid4())),
                            stream_type=StreamType(data["stream_type"]),
                            priority=UpdatePriority(data.get("priority", "medium")),
                            data=data["data"],
                            timestamp=datetime.fromisoformat(data["timestamp"]),
                            source=data.get("source", "redis"),
                            event_id=data.get("event_id"),
                            metadata=data.get("metadata", {}),
                        )

                        await self.message_queue.put(stream_message)

                    except Exception as e:  # pylint: disable=broad-exception-caught
                        logger.warning("Redis message processing failed: {e!s}")

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Redis message handler error: {e!s}")

    async def _message_processor(self):
        """Main message processing loop"""
        try:
            while True:
                try:
                    # Get message with timeout
                    message = await asyncio.wait_for(
                        self.message_queue.get(), timeout=1.0
                    )

                    await self._process_stream_message(message)
                    self.statistics["messages_processed"] += 1

                except asyncio.TimeoutError:
                    continue
                except Exception as e:  # pylint: disable=broad-exception-caught
                    logger.error("Message processing error: {e!s}")
                    await asyncio.sleep(0.1)

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Message processor fatal error: {e!s}")

    async def _process_stream_message(self, message: StreamMessage):
        """Process individual stream message"""
        try:
            # Aggregate message if needed
            aggregated_message = await self.stream_aggregator.process_message(message)

            if aggregated_message is None:
                return  # Message was buffered for aggregation

            # Check for prediction triggers
            triggers = await self.prediction_trigger.evaluate_triggers(
                aggregated_message
            )

            # Process triggers
            for trigger in triggers:
                asyncio.create_task(self._handle_prediction_trigger(trigger))

            # Broadcast to subscribers
            await self._broadcast_message(aggregated_message)

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Stream message processing failed: {e!s}")

    async def _handle_prediction_trigger(self, trigger: Dict[str, Any]):
        """Handle prediction trigger"""
        try:
            event_id = trigger["event_id"]
            context = trigger["prediction_context"]

            # Get latest features for this event
            features = await self._get_event_features(event_id)

            if features:
                # Generate new prediction
                prediction = await ultra_ensemble_engine.predict(
                    features=features, context=context
                )

                # Broadcast prediction update
                prediction_message = StreamMessage(
                    id=str(uuid.uuid4()),
                    stream_type=StreamType.PREDICTIONS,
                    priority=trigger["priority"],
                    data={
                        "event_id": event_id,
                        "prediction": prediction.predicted_value,
                        "confidence": prediction.prediction_probability,
                        "trigger_type": trigger["trigger_type"],
                        "models_used": prediction.metadata.get("selected_models", []),
                        "context": context.value,
                    },
                    timestamp=datetime.now(timezone.utc),
                    source="prediction_engine",
                    event_id=event_id,
                    metadata=trigger["metadata"],
                )

                await self._broadcast_message(prediction_message)

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Prediction trigger handling failed: {e!s}")

    async def _get_event_features(self, event_id: str) -> Optional[Dict[str, float]]:
        """Get latest features for an event"""
        try:
            # This would fetch the latest features from various sources
            # For now, return mock features
            return {
                "team_1_score": 45.0,
                "team_2_score": 42.0,
                "time_remaining": 1200.0,  # 20 minutes
                "total_possessions": 85.0,
                "pace": 95.5,
            }

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Feature retrieval failed for event {event_id}: {e!s}")
            return None

    async def _broadcast_message(self, message: StreamMessage):
        """Broadcast message to relevant subscribers"""
        try:
            broadcast_count = 0

            for subscriber_id, subscription in self.subscribers.items():
                try:
                    # Check if subscriber is interested in this stream type
                    if message.stream_type not in subscription.stream_types:
                        continue

                    # Apply filters
                    if not self._message_matches_filters(message, subscription.filters):
                        continue

                    # Send message
                    if subscription.websocket:
                        await self._send_websocket_message(
                            subscription.websocket, message
                        )
                    elif subscription.callback:
                        await subscription.callback(message)

                    subscription.message_count += 1
                    subscription.last_activity = datetime.now(timezone.utc)
                    broadcast_count += 1

                except Exception as e:  # pylint: disable=broad-exception-caught
                    logger.warning(
                        f"Failed to send message to subscriber {subscriber_id}: {e!s}"
                    )
                    # Mark subscription for removal
                    self._mark_subscription_for_removal(subscriber_id)

            self.statistics["messages_sent"] += broadcast_count

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Message broadcast failed: {e!s}")

    def _message_matches_filters(
        self, message: StreamMessage, filters: Dict[str, Any]
    ) -> bool:
        """Check if message matches subscription filters"""
        try:
            for filter_key, filter_value in filters.items():
                if filter_key == "event_ids":
                    if message.event_id not in filter_value:
                        return False
                elif filter_key == "priority":
                    if message.priority.value not in filter_value:
                        return False
                elif filter_key == "sources":
                    if message.source not in filter_value:
                        return False
                # Add more filter types as needed

            return True

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.warning("Filter matching failed: {e!s}")
            return True  # Default to allowing message

    async def _send_websocket_message(self, websocket, message: StreamMessage):
        """Send message via WebSocket"""
        try:
            message_data = {
                "id": message.id,
                "type": message.stream_type.value,
                "priority": message.priority.value,
                "data": message.data,
                "timestamp": message.timestamp.isoformat(),
                "source": message.source,
                "event_id": message.event_id,
                "metadata": message.metadata,
            }

            await websocket.send(json.dumps(message_data))

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.warning("WebSocket send failed: {e!s}")
            raise

    def _mark_subscription_for_removal(self, subscriber_id: str):
        """Mark subscription for removal (cleanup task will handle it)"""
        if subscriber_id in self.subscribers:
            self.subscribers[subscriber_id].last_activity = datetime.min

    async def _heartbeat_monitor(self):
        """Monitor subscriber heartbeats and connection health"""
        try:
            while True:
                await asyncio.sleep(30)  # Check every 30 seconds

                current_time = datetime.now(timezone.utc)
                inactive_threshold = timedelta(minutes=5)

                inactive_subscribers = []

                for subscriber_id, subscription in self.subscribers.items():
                    if current_time - subscription.last_activity > inactive_threshold:
                        inactive_subscribers.append(subscriber_id)

                # Remove inactive subscribers
                for subscriber_id in inactive_subscribers:
                    await self.unsubscribe(subscriber_id)
                    logger.info("Removed inactive subscriber: {subscriber_id}")

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Heartbeat monitor error: {e!s}")

    async def _statistics_updater(self):
        """Update system statistics"""
        try:
            while True:
                await asyncio.sleep(60)  # Update every minute

                self.statistics["active_subscribers"] = len(self.subscribers)
                self.statistics["queue_size"] = self.message_queue.qsize()
                self.statistics["uptime_seconds"] = (
                    datetime.now(timezone.utc) - self.statistics["uptime_start"]
                ).total_seconds()

                # Log statistics
                logger.info("Stream stats: {self.statistics}")

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Statistics updater error: {e!s}")

    async def _cleanup_task(self):
        """Periodic cleanup of resources"""
        try:
            while True:
                await asyncio.sleep(300)  # Cleanup every 5 minutes

                # Cleanup expired messages in aggregator
                current_time = datetime.now(timezone.utc)

                for key, messages in list(
                    self.stream_aggregator.message_buffer.items()
                ):
                    # Remove messages older than 1 hour
                    while (
                        messages
                        and (current_time - messages[0].timestamp).total_seconds()
                        > 3600
                    ):
                        messages.popleft()

                    # Remove empty buffers
                    if not messages:
                        del self.stream_aggregator.message_buffer[key]

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Cleanup task error: {e!s}")

    async def subscribe(
        self,
        subscriber_id: str,
        stream_types: List[StreamType],
        filters: Optional[Dict[str, Any]] = None,
        websocket: Optional[Any] = None,
        callback: Optional[Callable] = None,
    ) -> bool:
        """Subscribe to real-time streams"""
        try:
            if subscriber_id in self.subscribers:
                await self.unsubscribe(subscriber_id)

            subscription = StreamSubscription(
                subscriber_id=subscriber_id,
                stream_types=set(stream_types),
                filters=filters or {},
                websocket=websocket,
                callback=callback,
            )

            self.subscribers[subscriber_id] = subscription

            if websocket:
                self.websocket_connections.add(websocket)

            logger.info("New subscription: {subscriber_id} for {stream_types}")
            return True

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Subscription failed: {e!s}")
            return False

    async def unsubscribe(self, subscriber_id: str) -> bool:
        """Unsubscribe from streams"""
        try:
            if subscriber_id in self.subscribers:
                subscription = self.subscribers[subscriber_id]

                if (
                    subscription.websocket
                    and subscription.websocket in self.websocket_connections
                ):
                    self.websocket_connections.remove(subscription.websocket)

                del self.subscribers[subscriber_id]
                logger.info("Unsubscribed: {subscriber_id}")
                return True

            return False

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Unsubscribe failed: {e!s}")
            return False

    async def publish_message(self, message: StreamMessage):
        """Publish message to the stream"""
        try:
            # Add to local queue
            await self.message_queue.put(message)

            # Publish to Redis for other instances
            if self.redis_client:
                channel = f"stream:{message.stream_type.value}"
                message_data = {
                    "id": message.id,
                    "stream_type": message.stream_type.value,
                    "priority": message.priority.value,
                    "data": message.data,
                    "timestamp": message.timestamp.isoformat(),
                    "source": message.source,
                    "event_id": message.event_id,
                    "metadata": message.metadata,
                }

                await self.redis_client.publish(channel, json.dumps(message_data))

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Message publishing failed: {e!s}")

    async def get_stream_health(self) -> Dict[str, Any]:
        """Get real-time stream health metrics"""
        try:
            return {
                "status": "healthy",
                "statistics": self.statistics,
                "active_subscribers": len(self.subscribers),
                "websocket_connections": len(self.websocket_connections),
                "message_queue_size": self.message_queue.qsize(),
                "processing_tasks": len(
                    [t for t in self.processing_tasks if not t.done()]
                ),
                "redis_connected": self.redis_client is not None,
                "aggregator_buffers": len(self.stream_aggregator.message_buffer),
                "trigger_cooldowns": len(self.prediction_trigger.last_predictions),
            }

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Stream health check failed: {e!s}")
            return {"status": "unhealthy", "error": str(e)}

    async def shutdown(self):
        """Gracefully shutdown the stream manager"""
        try:
            logger.info("Shutting down real-time stream manager")

            # Cancel processing tasks
            for task in self.processing_tasks:
                task.cancel()

            # Close WebSocket connections
            for websocket in list(self.websocket_connections):
                try:
                    await websocket.close()
                except:
                    pass

            # Close Redis connection
            if self.redis_client:
                await self.redis_client.close()

            logger.info("Real-time stream manager shutdown complete")

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Shutdown error: {e!s}")


# Global instance
real_time_stream_manager = RealTimeStreamManager()
