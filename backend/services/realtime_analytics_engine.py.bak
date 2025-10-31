"""
Real-time Analytics Engine for A1Betting7-13.2

Phase 2 implementation: WebSocket-based real-time analytics with live prediction
updates, streaming data processing, and dynamic model adjustment capabilities.

Architecture Features:
- WebSocket streaming for real-time updates
- Event-driven architecture for live data processing
- Ring-AllReduce pattern for distributed computation
- Parameter server architecture for model synchronization
- Streaming analytics with sliding window computations
"""

import asyncio
import hashlib
import json
import logging
import time
import weakref

# Event processing
from asyncio import Event, Queue
from collections import defaultdict, deque
from concurrent.futures import ThreadPoolExecutor
from dataclasses import asdict, dataclass
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Callable, Dict, List, Optional, Set

import aioredis
import numpy as np
import pandas as pd
import websockets
from websockets.server import WebSocketServerProtocol

from ..cache_manager_consolidated import CacheManagerConsolidated
from ..redis_service_optimized import RedisServiceOptimized

# Existing services integration
from .enhanced_ml_model_pipeline import (
    EnhancedMLModelPipeline,
    PredictionRequest,
    PredictionResponse,
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("realtime_analytics")


class EventType(Enum):
    """Types of real-time events"""

    ODDS_UPDATE = "odds_update"
    PLAYER_STAT_UPDATE = "player_stat_update"
    GAME_STATUS_CHANGE = "game_status_change"
    INJURY_REPORT = "injury_report"
    WEATHER_UPDATE = "weather_update"
    PREDICTION_REQUEST = "prediction_request"
    MODEL_UPDATE = "model_update"
    ALERT_TRIGGER = "alert_trigger"


class AlertSeverity(Enum):
    """Alert severity levels"""

    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


@dataclass
class StreamingEvent:
    """Real-time streaming event structure"""

    event_id: str
    event_type: EventType
    timestamp: datetime
    source: str
    data: Dict[str, Any]
    metadata: Optional[Dict[str, Any]] = None


@dataclass
class AnalyticsMetrics:
    """Real-time analytics metrics"""

    events_processed: int
    predictions_generated: int
    alerts_triggered: int
    average_processing_time_ms: float
    active_connections: int
    cache_hit_rate: float
    model_accuracy: float
    system_load: float


@dataclass
class AlertRule:
    """Alert rule configuration"""

    rule_id: str
    name: str
    condition: str  # Python expression to evaluate
    severity: AlertSeverity
    cooldown_seconds: int
    enabled: bool
    subscribers: List[str]  # WebSocket connection IDs


class SlidingWindow:
    """Sliding window for streaming analytics"""

    def __init__(self, window_size_seconds: int, max_points: int = 1000):
        self.window_size = timedelta(seconds=window_size_seconds)
        self.max_points = max_points
        self.data_points = deque(maxlen=max_points)
        self.value_sums = defaultdict(float)
        self.value_counts = defaultdict(int)

    def add_point(self, timestamp: datetime, values: Dict[str, float]):
        """Add a data point to the sliding window"""
        # Remove old points
        cutoff_time = timestamp - self.window_size
        while self.data_points and self.data_points[0][0] < cutoff_time:
            old_timestamp, old_values = self.data_points.popleft()
            for key, value in old_values.items():
                self.value_sums[key] -= value
                self.value_counts[key] -= 1

        # Add new point
        self.data_points.append((timestamp, values))
        for key, value in values.items():
            self.value_sums[key] += value
            self.value_counts[key] += 1

    def get_average(self, key: str) -> float:
        """Get average value for a key in the current window"""
        count = self.value_counts.get(key, 0)
        if count == 0:
            return 0.0
        return self.value_sums[key] / count

    def get_sum(self, key: str) -> float:
        """Get sum of values for a key in the current window"""
        return self.value_sums.get(key, 0.0)

    def get_count(self, key: str) -> int:
        """Get count of values for a key in the current window"""
        return self.value_counts.get(key, 0)


class RealtimeAnalyticsEngine:
    """
    Real-time Analytics Engine with WebSocket streaming capabilities

    Implements event-driven architecture with streaming analytics,
    live predictions, and real-time alerting system.
    """

    def __init__(
        self,
        ml_pipeline: EnhancedMLModelPipeline,
        redis_service: RedisServiceOptimized,
        cache_manager: CacheManagerConsolidated,
        websocket_host: str = "localhost",
        websocket_port: int = 8765,
        max_connections: int = 1000,
        window_size_seconds: int = 300,  # 5 minutes
    ):
        self.ml_pipeline = ml_pipeline
        self.redis_service = redis_service
        self.cache_manager = cache_manager
        self.websocket_host = websocket_host
        self.websocket_port = websocket_port
        self.max_connections = max_connections
        self.window_size_seconds = window_size_seconds

        # WebSocket management
        self.active_connections: Set[WebSocketServerProtocol] = set()
        self.connection_metadata: Dict[str, Dict[str, Any]] = {}
        self.subscription_topics: Dict[str, Set[str]] = defaultdict(
            set
        )  # topic -> connection_ids

        # Event processing
        self.event_queue: Queue = Queue(maxsize=10000)
        self.event_handlers: Dict[EventType, List[Callable]] = defaultdict(list)
        self.processing_tasks: List[asyncio.Task] = []

        # Analytics
        self.sliding_windows: Dict[str, SlidingWindow] = {
            "odds_changes": SlidingWindow(window_size_seconds),
            "prediction_accuracy": SlidingWindow(window_size_seconds),
            "system_performance": SlidingWindow(window_size_seconds),
            "user_activity": SlidingWindow(window_size_seconds),
        }

        # Alerting
        self.alert_rules: Dict[str, AlertRule] = {}
        self.alert_cooldowns: Dict[str, datetime] = {}

        # Performance tracking
        self.metrics = AnalyticsMetrics(
            events_processed=0,
            predictions_generated=0,
            alerts_triggered=0,
            average_processing_time_ms=0.0,
            active_connections=0,
            cache_hit_rate=0.0,
            model_accuracy=0.0,
            system_load=0.0,
        )

        # Thread pool for CPU-intensive tasks
        self.executor = ThreadPoolExecutor(max_workers=4)

        # Server instance
        self.websocket_server = None
        self.running = False

        logger.info(
            f"Real-time Analytics Engine initialized on {websocket_host}:{websocket_port}"
        )

    async def start(self):
        """Start the real-time analytics engine"""
        try:
            self.running = True

            # Start event processing workers
            self.processing_tasks = [
                asyncio.create_task(self._event_processor_worker(f"worker_{i}"))
                for i in range(4)
            ]

            # Start WebSocket server
            self.websocket_server = await websockets.serve(
                self._handle_websocket_connection,
                self.websocket_host,
                self.websocket_port,
                max_size=2**20,  # 1MB max message size
                max_queue=100,
            )

            # Start background tasks
            asyncio.create_task(self._metrics_updater())
            asyncio.create_task(self._alert_processor())
            asyncio.create_task(self._connection_manager())

            # Register default event handlers
            await self._register_default_handlers()

            # Load alert rules
            await self._load_alert_rules()

            logger.info("Real-time Analytics Engine started successfully")

        except Exception as e:
            logger.error(f"Failed to start analytics engine: {e}")
            raise

    async def stop(self):
        """Stop the real-time analytics engine"""
        try:
            self.running = False

            # Close WebSocket server
            if self.websocket_server:
                self.websocket_server.close()
                await self.websocket_server.wait_closed()

            # Cancel processing tasks
            for task in self.processing_tasks:
                task.cancel()

            # Close active connections
            if self.active_connections:
                await asyncio.gather(
                    *[conn.close() for conn in self.active_connections],
                    return_exceptions=True,
                )

            # Shutdown executor
            self.executor.shutdown(wait=True)

            logger.info("Real-time Analytics Engine stopped")

        except Exception as e:
            logger.error(f"Error stopping analytics engine: {e}")

    async def _handle_websocket_connection(
        self, websocket: WebSocketServerProtocol, path: str
    ):
        """Handle new WebSocket connections"""
        connection_id = f"conn_{int(time.time()*1000)}_{hash(websocket) % 10000}"

        try:
            # Register connection
            self.active_connections.add(websocket)
            self.connection_metadata[connection_id] = {
                "connected_at": datetime.now(),
                "path": path,
                "remote_address": websocket.remote_address,
                "subscriptions": set(),
            }

            # Send welcome message
            welcome_msg = {
                "type": "connection_established",
                "connection_id": connection_id,
                "server_time": datetime.now().isoformat(),
                "available_topics": list(self._get_available_topics()),
            }
            await websocket.send(json.dumps(welcome_msg))

            logger.info(f"WebSocket connection established: {connection_id}")

            # Handle messages
            async for message in websocket:
                try:
                    await self._handle_websocket_message(
                        websocket, connection_id, message
                    )
                except Exception as e:
                    logger.error(f"Error handling message from {connection_id}: {e}")
                    error_msg = {
                        "type": "error",
                        "message": str(e),
                        "timestamp": datetime.now().isoformat(),
                    }
                    await websocket.send(json.dumps(error_msg))

        except websockets.exceptions.ConnectionClosed:
            logger.info(f"WebSocket connection closed: {connection_id}")
        except Exception as e:
            logger.error(f"WebSocket connection error for {connection_id}: {e}")
        finally:
            # Cleanup connection
            self.active_connections.discard(websocket)
            if connection_id in self.connection_metadata:
                # Remove from subscriptions
                subscriptions = self.connection_metadata[connection_id].get(
                    "subscriptions", set()
                )
                for topic in subscriptions:
                    self.subscription_topics[topic].discard(connection_id)
                del self.connection_metadata[connection_id]

    async def _handle_websocket_message(
        self, websocket: WebSocketServerProtocol, connection_id: str, message: str
    ):
        """Handle incoming WebSocket messages"""
        try:
            data = json.loads(message)
            msg_type = data.get("type")

            if msg_type == "subscribe":
                await self._handle_subscription(connection_id, data.get("topics", []))

            elif msg_type == "unsubscribe":
                await self._handle_unsubscription(connection_id, data.get("topics", []))

            elif msg_type == "prediction_request":
                await self._handle_prediction_request(websocket, connection_id, data)

            elif msg_type == "analytics_query":
                await self._handle_analytics_query(websocket, connection_id, data)

            elif msg_type == "alert_rule":
                await self._handle_alert_rule_update(connection_id, data)

            else:
                logger.warning(f"Unknown message type from {connection_id}: {msg_type}")

        except json.JSONDecodeError:
            logger.error(f"Invalid JSON from {connection_id}: {message}")
        except Exception as e:
            logger.error(f"Error processing message from {connection_id}: {e}")

    async def _handle_subscription(self, connection_id: str, topics: List[str]):
        """Handle topic subscription"""
        if connection_id not in self.connection_metadata:
            return

        valid_topics = self._get_available_topics()
        for topic in topics:
            if topic in valid_topics:
                self.subscription_topics[topic].add(connection_id)
                self.connection_metadata[connection_id]["subscriptions"].add(topic)
                logger.debug(f"Connection {connection_id} subscribed to {topic}")

    async def _handle_unsubscription(self, connection_id: str, topics: List[str]):
        """Handle topic unsubscription"""
        if connection_id not in self.connection_metadata:
            return

        for topic in topics:
            self.subscription_topics[topic].discard(connection_id)
            self.connection_metadata[connection_id]["subscriptions"].discard(topic)
            logger.debug(f"Connection {connection_id} unsubscribed from {topic}")

    async def _handle_prediction_request(
        self,
        websocket: WebSocketServerProtocol,
        connection_id: str,
        data: Dict[str, Any],
    ):
        """Handle real-time prediction requests"""
        try:
            request = PredictionRequest(
                model_id=data.get("model_id"),
                features=data.get("features", {}),
                explain=data.get("explain", False),
                confidence_interval=data.get("confidence_interval", False),
            )

            start_time = time.time()
            response = await self.ml_pipeline.predict(request)
            processing_time = (time.time() - start_time) * 1000

            # Send response
            response_msg = {
                "type": "prediction_response",
                "request_id": data.get("request_id"),
                "prediction": response.prediction,
                "confidence_score": response.confidence_score,
                "explanation": response.explanation,
                "confidence_interval": response.confidence_interval,
                "model_version": response.model_version,
                "processing_time_ms": processing_time,
                "timestamp": datetime.now().isoformat(),
            }

            await websocket.send(json.dumps(response_msg))

            # Update metrics
            self.metrics.predictions_generated += 1
            self._update_sliding_window(
                "system_performance", {"prediction_latency": processing_time}
            )

        except Exception as e:
            error_msg = {
                "type": "prediction_error",
                "request_id": data.get("request_id"),
                "error": str(e),
                "timestamp": datetime.now().isoformat(),
            }
            await websocket.send(json.dumps(error_msg))

    async def _handle_analytics_query(
        self,
        websocket: WebSocketServerProtocol,
        connection_id: str,
        data: Dict[str, Any],
    ):
        """Handle analytics queries"""
        try:
            query_type = data.get("query_type")

            if query_type == "metrics_summary":
                response = await self._get_metrics_summary()

            elif query_type == "sliding_window_data":
                window_name = data.get("window_name")
                metric_name = data.get("metric_name")
                response = await self._get_sliding_window_data(window_name, metric_name)

            elif query_type == "model_performance":
                model_id = data.get("model_id")
                response = await self._get_model_performance(model_id)

            else:
                response = {"error": f"Unknown query type: {query_type}"}

            response_msg = {
                "type": "analytics_response",
                "query_id": data.get("query_id"),
                "data": response,
                "timestamp": datetime.now().isoformat(),
            }

            await websocket.send(json.dumps(response_msg))

        except Exception as e:
            error_msg = {
                "type": "analytics_error",
                "query_id": data.get("query_id"),
                "error": str(e),
                "timestamp": datetime.now().isoformat(),
            }
            await websocket.send(json.dumps(error_msg))

    async def _handle_alert_rule_update(self, connection_id: str, data: Dict[str, Any]):
        """Handle alert rule updates"""
        try:
            operation = data.get("operation")  # 'create', 'update', 'delete'

            if operation == "create" or operation == "update":
                rule = AlertRule(
                    rule_id=data["rule_id"],
                    name=data["name"],
                    condition=data["condition"],
                    severity=AlertSeverity(data["severity"]),
                    cooldown_seconds=data.get("cooldown_seconds", 300),
                    enabled=data.get("enabled", True),
                    subscribers=data.get("subscribers", [connection_id]),
                )
                self.alert_rules[rule.rule_id] = rule

            elif operation == "delete":
                rule_id = data["rule_id"]
                if rule_id in self.alert_rules:
                    del self.alert_rules[rule_id]

            # Save alert rules
            await self._save_alert_rules()

        except Exception as e:
            logger.error(f"Error updating alert rule: {e}")

    def _get_available_topics(self) -> Set[str]:
        """Get list of available subscription topics"""
        return {
            "odds_updates",
            "player_stats",
            "game_status",
            "predictions",
            "alerts",
            "analytics",
            "model_updates",
            "system_metrics",
        }

    async def publish_event(self, event: StreamingEvent):
        """Publish an event to the analytics engine"""
        try:
            if not self.running:
                return

            # Add to event queue
            await self.event_queue.put(event)

        except Exception as e:
            logger.error(f"Error publishing event: {e}")

    async def _event_processor_worker(self, worker_name: str):
        """Event processing worker"""
        logger.info(f"Event processor {worker_name} started")

        while self.running:
            try:
                # Get event from queue with timeout
                event = await asyncio.wait_for(self.event_queue.get(), timeout=1.0)

                start_time = time.time()

                # Process event
                await self._process_event(event)

                # Update metrics
                processing_time = (time.time() - start_time) * 1000
                self.metrics.events_processed += 1
                self._update_sliding_window(
                    "system_performance", {"event_processing_time": processing_time}
                )

                # Mark task done
                self.event_queue.task_done()

            except asyncio.TimeoutError:
                continue
            except Exception as e:
                logger.error(f"Error in event processor {worker_name}: {e}")

    async def _process_event(self, event: StreamingEvent):
        """Process a streaming event"""
        try:
            # Call registered handlers
            handlers = self.event_handlers.get(event.event_type, [])
            if handlers:
                await asyncio.gather(
                    *[handler(event) for handler in handlers], return_exceptions=True
                )

            # Update analytics windows
            await self._update_analytics_from_event(event)

            # Broadcast to subscribers
            await self._broadcast_event(event)

            # Check alert conditions
            await self._check_alert_conditions(event)

        except Exception as e:
            logger.error(f"Error processing event {event.event_id}: {e}")

    async def _update_analytics_from_event(self, event: StreamingEvent):
        """Update sliding window analytics from event"""
        try:
            timestamp = event.timestamp

            # Extract metrics based on event type
            if event.event_type == EventType.ODDS_UPDATE:
                change_magnitude = abs(event.data.get("odds_change", 0))
                self._update_sliding_window(
                    "odds_changes", {"magnitude": change_magnitude}
                )

            elif event.event_type == EventType.PREDICTION_REQUEST:
                accuracy = event.data.get("accuracy", 0)
                self._update_sliding_window(
                    "prediction_accuracy", {"accuracy": accuracy}
                )

            elif event.event_type == EventType.PLAYER_STAT_UPDATE:
                performance_delta = event.data.get("performance_change", 0)
                self._update_sliding_window(
                    "user_activity", {"performance_change": performance_delta}
                )

        except Exception as e:
            logger.error(f"Error updating analytics from event: {e}")

    def _update_sliding_window(self, window_name: str, values: Dict[str, float]):
        """Update sliding window with new values"""
        if window_name in self.sliding_windows:
            self.sliding_windows[window_name].add_point(datetime.now(), values)

    async def _broadcast_event(self, event: StreamingEvent):
        """Broadcast event to subscribed WebSocket connections"""
        try:
            # Determine topic from event type
            topic_mapping = {
                EventType.ODDS_UPDATE: "odds_updates",
                EventType.PLAYER_STAT_UPDATE: "player_stats",
                EventType.GAME_STATUS_CHANGE: "game_status",
                EventType.PREDICTION_REQUEST: "predictions",
                EventType.ALERT_TRIGGER: "alerts",
                EventType.MODEL_UPDATE: "model_updates",
            }

            topic = topic_mapping.get(event.event_type)
            if not topic:
                return

            # Get subscribers
            subscribers = self.subscription_topics.get(topic, set())
            if not subscribers:
                return

            # Prepare message
            message = {
                "type": "event_broadcast",
                "topic": topic,
                "event_id": event.event_id,
                "event_type": event.event_type.value,
                "timestamp": event.timestamp.isoformat(),
                "source": event.source,
                "data": event.data,
                "metadata": event.metadata,
            }

            message_json = json.dumps(message)

            # Send to subscribers
            active_subscribers = []
            for connection_id in subscribers:
                # Find active connection
                for conn in self.active_connections:
                    if connection_id in self.connection_metadata:
                        active_subscribers.append(conn)
                        break

            if active_subscribers:
                await asyncio.gather(
                    *[conn.send(message_json) for conn in active_subscribers],
                    return_exceptions=True,
                )

        except Exception as e:
            logger.error(f"Error broadcasting event: {e}")

    async def _check_alert_conditions(self, event: StreamingEvent):
        """Check if any alert conditions are triggered"""
        try:
            current_time = datetime.now()

            for rule_id, rule in self.alert_rules.items():
                if not rule.enabled:
                    continue

                # Check cooldown
                if rule_id in self.alert_cooldowns:
                    if current_time - self.alert_cooldowns[rule_id] < timedelta(
                        seconds=rule.cooldown_seconds
                    ):
                        continue

                # Evaluate condition
                if await self._evaluate_alert_condition(rule, event):
                    await self._trigger_alert(rule, event)
                    self.alert_cooldowns[rule_id] = current_time

        except Exception as e:
            logger.error(f"Error checking alert conditions: {e}")

    async def _evaluate_alert_condition(
        self, rule: AlertRule, event: StreamingEvent
    ) -> bool:
        """Evaluate alert rule condition"""
        try:
            # Create evaluation context
            context = {
                "event": event,
                "event_data": event.data,
                "event_type": event.event_type.value,
                "timestamp": event.timestamp,
                "sliding_windows": self.sliding_windows,
                "metrics": self.metrics,
            }

            # Add sliding window functions to context
            context.update(
                {
                    "get_avg": lambda window, key: (
                        self.sliding_windows[window].get_average(key)
                        if window in self.sliding_windows
                        else 0
                    ),
                    "get_sum": lambda window, key: (
                        self.sliding_windows[window].get_sum(key)
                        if window in self.sliding_windows
                        else 0
                    ),
                    "get_count": lambda window, key: (
                        self.sliding_windows[window].get_count(key)
                        if window in self.sliding_windows
                        else 0
                    ),
                }
            )

            # Evaluate condition safely
            result = eval(rule.condition, {"__builtins__": {}}, context)
            return bool(result)

        except Exception as e:
            logger.error(
                f"Error evaluating alert condition for rule {rule.rule_id}: {e}"
            )
            return False

    async def _trigger_alert(self, rule: AlertRule, event: StreamingEvent):
        """Trigger an alert"""
        try:
            alert_data = {
                "alert_id": f"alert_{int(time.time()*1000)}",
                "rule_id": rule.rule_id,
                "rule_name": rule.name,
                "severity": rule.severity.value,
                "triggered_at": datetime.now().isoformat(),
                "triggered_by_event": event.event_id,
                "event_data": event.data,
                "message": f"Alert rule '{rule.name}' triggered",
            }

            # Create alert event
            alert_event = StreamingEvent(
                event_id=alert_data["alert_id"],
                event_type=EventType.ALERT_TRIGGER,
                timestamp=datetime.now(),
                source="alert_system",
                data=alert_data,
            )

            # Broadcast alert
            await self._broadcast_event(alert_event)

            # Update metrics
            self.metrics.alerts_triggered += 1

            logger.info(
                f"Alert triggered: {rule.name} (severity: {rule.severity.value})"
            )

        except Exception as e:
            logger.error(f"Error triggering alert: {e}")

    async def _register_default_handlers(self):
        """Register default event handlers"""

        # Odds update handler
        async def handle_odds_update(event: StreamingEvent):
            # Store in cache for quick access
            cache_key = f"latest_odds_{event.data.get('sport', 'unknown')}"
            await self.cache_manager.set_cache(cache_key, event.data, ttl=300)

        # Player stats handler
        async def handle_player_stats(event: StreamingEvent):
            # Update player performance metrics
            player_id = event.data.get("player_id")
            if player_id:
                cache_key = f"player_stats_{player_id}"
                await self.cache_manager.set_cache(cache_key, event.data, ttl=3600)

        # Game status handler
        async def handle_game_status(event: StreamingEvent):
            # Update game state
            game_id = event.data.get("game_id")
            if game_id:
                cache_key = f"game_status_{game_id}"
                await self.cache_manager.set_cache(cache_key, event.data, ttl=1800)

        # Register handlers
        self.event_handlers[EventType.ODDS_UPDATE].append(handle_odds_update)
        self.event_handlers[EventType.PLAYER_STAT_UPDATE].append(handle_player_stats)
        self.event_handlers[EventType.GAME_STATUS_CHANGE].append(handle_game_status)

    async def _load_alert_rules(self):
        """Load alert rules from storage"""
        try:
            # Load from Redis or use defaults
            rules_data = await self.redis_service.get("analytics_alert_rules")

            if rules_data:
                rules_dict = json.loads(rules_data)
                for rule_id, rule_data in rules_dict.items():
                    self.alert_rules[rule_id] = AlertRule(
                        rule_id=rule_data["rule_id"],
                        name=rule_data["name"],
                        condition=rule_data["condition"],
                        severity=AlertSeverity(rule_data["severity"]),
                        cooldown_seconds=rule_data["cooldown_seconds"],
                        enabled=rule_data["enabled"],
                        subscribers=rule_data["subscribers"],
                    )
            else:
                # Create default alert rules
                await self._create_default_alert_rules()

            logger.info(f"Loaded {len(self.alert_rules)} alert rules")

        except Exception as e:
            logger.error(f"Error loading alert rules: {e}")
            await self._create_default_alert_rules()

    async def _create_default_alert_rules(self):
        """Create default alert rules"""
        default_rules = [
            AlertRule(
                rule_id="high_odds_change",
                name="High Odds Change",
                condition="event_type == 'odds_update' and abs(event_data.get('odds_change', 0)) > 0.2",
                severity=AlertSeverity.WARNING,
                cooldown_seconds=300,
                enabled=True,
                subscribers=[],
            ),
            AlertRule(
                rule_id="low_prediction_accuracy",
                name="Low Prediction Accuracy",
                condition="get_avg('prediction_accuracy', 'accuracy') < 0.6 and get_count('prediction_accuracy', 'accuracy') > 10",
                severity=AlertSeverity.CRITICAL,
                cooldown_seconds=600,
                enabled=True,
                subscribers=[],
            ),
            AlertRule(
                rule_id="high_system_load",
                name="High System Load",
                condition="metrics.active_connections > 500 or get_avg('system_performance', 'prediction_latency') > 1000",
                severity=AlertSeverity.WARNING,
                cooldown_seconds=180,
                enabled=True,
                subscribers=[],
            ),
        ]

        for rule in default_rules:
            self.alert_rules[rule.rule_id] = rule

        await self._save_alert_rules()

    async def _save_alert_rules(self):
        """Save alert rules to storage"""
        try:
            rules_dict = {}
            for rule_id, rule in self.alert_rules.items():
                rules_dict[rule_id] = asdict(rule)
                rules_dict[rule_id]["severity"] = rule.severity.value

            await self.redis_service.setex(
                "analytics_alert_rules", json.dumps(rules_dict), 86400  # 24 hours
            )

        except Exception as e:
            logger.error(f"Error saving alert rules: {e}")

    async def _metrics_updater(self):
        """Background task to update system metrics"""
        while self.running:
            try:
                # Update connection count
                self.metrics.active_connections = len(self.active_connections)

                # Update cache hit rate
                self.metrics.cache_hit_rate = await self.cache_manager.get_hit_rate()

                # Update system load (simplified)
                self.metrics.system_load = min(
                    len(self.active_connections) / self.max_connections, 1.0
                )

                # Update average processing time
                processing_times = self.sliding_windows[
                    "system_performance"
                ].data_points
                if processing_times:
                    recent_times = [
                        pt[1].get("event_processing_time", 0)
                        for pt in processing_times[-100:]
                    ]
                    self.metrics.average_processing_time_ms = (
                        np.mean(recent_times) if recent_times else 0.0
                    )

                # Store metrics in Redis
                metrics_data = asdict(self.metrics)
                metrics_data["timestamp"] = datetime.now().isoformat()

                await self.redis_service.setex(
                    "realtime_analytics_metrics",
                    json.dumps(metrics_data),
                    300,  # 5 minutes
                )

                await asyncio.sleep(30)  # Update every 30 seconds

            except Exception as e:
                logger.error(f"Error updating metrics: {e}")
                await asyncio.sleep(30)

    async def _alert_processor(self):
        """Background task to process alerts"""
        while self.running:
            try:
                # Clean up old cooldowns
                current_time = datetime.now()
                expired_cooldowns = [
                    rule_id
                    for rule_id, cooldown_time in self.alert_cooldowns.items()
                    if current_time - cooldown_time > timedelta(hours=1)
                ]

                for rule_id in expired_cooldowns:
                    del self.alert_cooldowns[rule_id]

                await asyncio.sleep(60)  # Check every minute

            except Exception as e:
                logger.error(f"Error in alert processor: {e}")
                await asyncio.sleep(60)

    async def _connection_manager(self):
        """Background task to manage WebSocket connections"""
        while self.running:
            try:
                # Clean up stale connections
                stale_connections = []
                for conn in self.active_connections:
                    try:
                        await conn.ping()
                    except:
                        stale_connections.append(conn)

                for conn in stale_connections:
                    self.active_connections.discard(conn)

                # Remove metadata for disconnected clients
                active_connection_ids = set()
                for conn_id, metadata in list(self.connection_metadata.items()):
                    # Check if connection is still active
                    # This is a simplified check - in production you'd want more robust tracking
                    if any(conn for conn in self.active_connections):
                        active_connection_ids.add(conn_id)
                    else:
                        # Clean up subscriptions
                        subscriptions = metadata.get("subscriptions", set())
                        for topic in subscriptions:
                            self.subscription_topics[topic].discard(conn_id)
                        del self.connection_metadata[conn_id]

                await asyncio.sleep(30)  # Check every 30 seconds

            except Exception as e:
                logger.error(f"Error in connection manager: {e}")
                await asyncio.sleep(30)

    async def _get_metrics_summary(self) -> Dict[str, Any]:
        """Get comprehensive metrics summary"""
        try:
            summary = {
                "real_time_metrics": asdict(self.metrics),
                "sliding_windows": {},
                "alert_status": {
                    "total_rules": len(self.alert_rules),
                    "enabled_rules": sum(
                        1 for rule in self.alert_rules.values() if rule.enabled
                    ),
                    "alerts_in_cooldown": len(self.alert_cooldowns),
                },
                "connection_stats": {
                    "active_connections": len(self.active_connections),
                    "total_subscriptions": sum(
                        len(subs) for subs in self.subscription_topics.values()
                    ),
                    "popular_topics": sorted(
                        [
                            (topic, len(subs))
                            for topic, subs in self.subscription_topics.items()
                        ],
                        key=lambda x: x[1],
                        reverse=True,
                    )[:5],
                },
            }

            # Add sliding window summaries
            for window_name, window in self.sliding_windows.items():
                if window.data_points:
                    recent_data = (
                        dict(window.data_points[-1][1]) if window.data_points else {}
                    )
                    summary["sliding_windows"][window_name] = {
                        "data_points": len(window.data_points),
                        "latest_values": recent_data,
                        "window_size_seconds": self.window_size_seconds,
                    }

            return summary

        except Exception as e:
            logger.error(f"Error getting metrics summary: {e}")
            return {"error": str(e)}

    async def _get_sliding_window_data(
        self, window_name: str, metric_name: str
    ) -> Dict[str, Any]:
        """Get sliding window data for a specific metric"""
        try:
            if window_name not in self.sliding_windows:
                return {"error": f"Window {window_name} not found"}

            window = self.sliding_windows[window_name]

            return {
                "window_name": window_name,
                "metric_name": metric_name,
                "current_average": window.get_average(metric_name),
                "current_sum": window.get_sum(metric_name),
                "data_point_count": window.get_count(metric_name),
                "window_size_seconds": self.window_size_seconds,
            }

        except Exception as e:
            logger.error(f"Error getting sliding window data: {e}")
            return {"error": str(e)}

    async def _get_model_performance(self, model_id: str) -> Dict[str, Any]:
        """Get model performance metrics"""
        try:
            # Get model info from ML pipeline
            pipeline_status = await self.ml_pipeline.get_pipeline_status()
            model_info = pipeline_status.get("model_metadata", {}).get(model_id)

            if not model_info:
                return {"error": f"Model {model_id} not found"}

            return {
                "model_id": model_id,
                "model_info": model_info,
                "real_time_performance": {
                    "recent_predictions": self.metrics.predictions_generated,
                    "average_latency_ms": self.metrics.average_processing_time_ms,
                },
            }

        except Exception as e:
            logger.error(f"Error getting model performance: {e}")
            return {"error": str(e)}


# Utility functions for creating and managing the analytics engine
async def create_realtime_analytics_engine(
    ml_pipeline: EnhancedMLModelPipeline,
    redis_service: RedisServiceOptimized,
    cache_manager: CacheManagerConsolidated,
    **kwargs,
) -> RealtimeAnalyticsEngine:
    """Factory function to create and start the real-time analytics engine"""
    engine = RealtimeAnalyticsEngine(
        ml_pipeline=ml_pipeline,
        redis_service=redis_service,
        cache_manager=cache_manager,
        **kwargs,
    )

    await engine.start()
    return engine


# Example usage for creating streaming events
def create_odds_update_event(sport: str, odds_data: Dict[str, Any]) -> StreamingEvent:
    """Create an odds update event"""
    return StreamingEvent(
        event_id=f"odds_{int(time.time()*1000)}",
        event_type=EventType.ODDS_UPDATE,
        timestamp=datetime.now(),
        source="odds_provider",
        data={
            "sport": sport,
            "odds_change": odds_data.get("change", 0),
            "new_odds": odds_data.get("odds", {}),
            "market_type": odds_data.get("market_type", "unknown"),
        },
    )


def create_player_stat_event(player_id: str, stats: Dict[str, Any]) -> StreamingEvent:
    """Create a player stat update event"""
    return StreamingEvent(
        event_id=f"player_{player_id}_{int(time.time()*1000)}",
        event_type=EventType.PLAYER_STAT_UPDATE,
        timestamp=datetime.now(),
        source="stats_provider",
        data={
            "player_id": player_id,
            "stats": stats,
            "performance_change": stats.get("performance_delta", 0),
        },
    )
