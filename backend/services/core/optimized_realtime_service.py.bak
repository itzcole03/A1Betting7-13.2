"""
Optimized Real-Time Processing Service - Live betting optimization
Phase 2: AI/ML Infrastructure Enhancement

Enhanced from existing real-time services with:
- WebSocket optimization with connection pooling
- Real-time data compression and batching
- Intelligent subscription filtering
- Live prediction streaming with minimal latency
- Event-driven architecture for market changes
"""

import asyncio
import logging
import time
import json
import gzip
import pickle
from typing import Dict, List, Optional, Any, Set, Callable, Union
from datetime import datetime, timedelta
from dataclasses import dataclass, field, asdict
from enum import Enum
from collections import defaultdict, deque
import uuid
import weakref

try:
    import websockets
    from websockets.server import WebSocketServerProtocol
    WEBSOCKETS_AVAILABLE = True
except ImportError:
    WEBSOCKETS_AVAILABLE = False

try:
    import redis.asyncio as redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

from .unified_cache_service import UnifiedCacheService, get_cache
from .unified_ml_service import get_ml_service, PredictionRequest, SportType, ModelType
from .enhanced_quantum_service import get_quantum_service, BettingOpportunity

logger = logging.getLogger(__name__)

class MessageType(Enum):
    """Real-time message types"""
    PREDICTION_UPDATE = "prediction_update"
    ODDS_CHANGE = "odds_change"
    GAME_EVENT = "game_event"
    PORTFOLIO_UPDATE = "portfolio_update"
    MARKET_ALERT = "market_alert"
    SYSTEM_STATUS = "system_status"
    SUBSCRIPTION_CONFIRM = "subscription_confirm"
    ERROR = "error"
    HEARTBEAT = "heartbeat"

class SubscriptionType(Enum):
    """Subscription types"""
    PLAYER_PREDICTIONS = "player_predictions"
    SPORT_UPDATES = "sport_updates"
    PORTFOLIO_CHANGES = "portfolio_changes"
    MARKET_MOVEMENTS = "market_movements"
    GAME_EVENTS = "game_events"
    ALL_UPDATES = "all_updates"

class CompressionType(Enum):
    """Message compression types"""
    NONE = "none"
    GZIP = "gzip"
    JSON_COMPACT = "json_compact"

@dataclass
class RealtimeMessage:
    """Real-time message structure"""
    id: str
    type: MessageType
    timestamp: datetime
    data: Dict[str, Any]
    subscription_filters: List[str] = field(default_factory=list)
    priority: int = 1  # 1=high, 2=medium, 3=low
    ttl: Optional[int] = None  # Time to live in seconds
    compression: CompressionType = CompressionType.NONE

@dataclass
class ClientSubscription:
    """Client subscription configuration"""
    client_id: str
    subscription_types: Set[SubscriptionType]
    filters: Dict[str, Any] = field(default_factory=dict)
    compression_enabled: bool = True
    max_message_rate: int = 100  # Messages per minute
    last_activity: datetime = field(default_factory=datetime.now)
    message_count: int = 0
    
class ConnectionManager:
    """WebSocket connection manager with optimization"""
    
    def __init__(self):
        self.connections: Dict[str, WebSocketServerProtocol] = {}
        self.subscriptions: Dict[str, ClientSubscription] = {}
        self.message_queues: Dict[str, asyncio.Queue] = {}
        self.connection_stats = {
            "total_connections": 0,
            "active_connections": 0,
            "messages_sent": 0,
            "messages_failed": 0,
            "bytes_transferred": 0
        }
        self.lock = asyncio.Lock()
        
    async def add_connection(self, client_id: str, websocket: WebSocketServerProtocol):
        """Add new WebSocket connection"""
        async with self.lock:
            # Close existing connection if any
            if client_id in self.connections:
                await self.remove_connection(client_id)
                
            self.connections[client_id] = websocket
            self.message_queues[client_id] = asyncio.Queue(maxsize=1000)
            
            # Initialize subscription
            self.subscriptions[client_id] = ClientSubscription(
                client_id=client_id,
                subscription_types=set()
            )
            
            self.connection_stats["total_connections"] += 1
            self.connection_stats["active_connections"] = len(self.connections)
            
            logger.info(f"WebSocket connection added: {client_id}")
            
    async def remove_connection(self, client_id: str):
        """Remove WebSocket connection"""
        async with self.lock:
            if client_id in self.connections:
                try:
                    await self.connections[client_id].close()
                except:
                    pass
                del self.connections[client_id]
                
            if client_id in self.message_queues:
                del self.message_queues[client_id]
                
            if client_id in self.subscriptions:
                del self.subscriptions[client_id]
                
            self.connection_stats["active_connections"] = len(self.connections)
            
            logger.info(f"WebSocket connection removed: {client_id}")
            
    async def subscribe(self, client_id: str, subscription_type: SubscriptionType, 
                       filters: Optional[Dict[str, Any]] = None):
        """Subscribe client to updates"""
        if client_id in self.subscriptions:
            subscription = self.subscriptions[client_id]
            subscription.subscription_types.add(subscription_type)
            
            if filters:
                subscription.filters.update(filters)
                
            # Send confirmation
            await self.send_to_client(client_id, RealtimeMessage(
                id=str(uuid.uuid4()),
                type=MessageType.SUBSCRIPTION_CONFIRM,
                timestamp=datetime.now(),
                data={
                    "subscription_type": subscription_type.value,
                    "filters": filters or {},
                    "status": "confirmed"
                }
            ))
            
            logger.info(f"Client {client_id} subscribed to {subscription_type.value}")
            
    async def unsubscribe(self, client_id: str, subscription_type: SubscriptionType):
        """Unsubscribe client from updates"""
        if client_id in self.subscriptions:
            subscription = self.subscriptions[client_id]
            subscription.subscription_types.discard(subscription_type)
            
            logger.info(f"Client {client_id} unsubscribed from {subscription_type.value}")
            
    async def send_to_client(self, client_id: str, message: RealtimeMessage):
        """Send message to specific client"""
        if client_id not in self.connections:
            return False
            
        try:
            # Check rate limiting
            subscription = self.subscriptions.get(client_id)
            if subscription and not self._check_rate_limit(subscription):
                return False
                
            # Serialize and potentially compress message
            serialized_message = await self._serialize_message(message, subscription)
            
            # Send message
            websocket = self.connections[client_id]
            await websocket.send(serialized_message)
            
            # Update stats
            self.connection_stats["messages_sent"] += 1
            self.connection_stats["bytes_transferred"] += len(serialized_message)
            
            # Update subscription stats
            if subscription:
                subscription.message_count += 1
                subscription.last_activity = datetime.now()
                
            return True
            
        except Exception as e:
            logger.error(f"Failed to send message to {client_id}: {e}")
            self.connection_stats["messages_failed"] += 1
            
            # Remove dead connection
            await self.remove_connection(client_id)
            return False
            
    async def broadcast_message(self, message: RealtimeMessage, 
                              subscription_filter: Optional[SubscriptionType] = None):
        """Broadcast message to all relevant clients"""
        
        failed_clients = []
        
        for client_id, subscription in self.subscriptions.items():
            # Check if client should receive this message
            if not self._should_receive_message(subscription, message, subscription_filter):
                continue
                
            success = await self.send_to_client(client_id, message)
            if not success:
                failed_clients.append(client_id)
                
        # Clean up failed connections
        for client_id in failed_clients:
            await self.remove_connection(client_id)
            
    def _check_rate_limit(self, subscription: ClientSubscription) -> bool:
        """Check if client is within rate limits"""
        now = datetime.now()
        time_window = timedelta(minutes=1)
        
        # Reset counter if window has passed
        if now - subscription.last_activity > time_window:
            subscription.message_count = 0
            
        return subscription.message_count < subscription.max_message_rate
        
    def _should_receive_message(self, subscription: ClientSubscription, 
                              message: RealtimeMessage,
                              subscription_filter: Optional[SubscriptionType]) -> bool:
        """Check if client should receive message"""
        
        # Check subscription type filter
        if subscription_filter and subscription_filter not in subscription.subscription_types:
            return False
            
        # Check if client has ALL_UPDATES subscription
        if SubscriptionType.ALL_UPDATES in subscription.subscription_types:
            return True
            
        # Check specific subscription types
        message_subscription_type = self._get_message_subscription_type(message.type)
        if message_subscription_type not in subscription.subscription_types:
            return False
            
        # Check filters
        for filter_key, filter_value in subscription.filters.items():
            if filter_key in message.data:
                if message.data[filter_key] != filter_value:
                    return False
                    
        return True
        
    def _get_message_subscription_type(self, message_type: MessageType) -> SubscriptionType:
        """Map message type to subscription type"""
        mapping = {
            MessageType.PREDICTION_UPDATE: SubscriptionType.PLAYER_PREDICTIONS,
            MessageType.ODDS_CHANGE: SubscriptionType.MARKET_MOVEMENTS,
            MessageType.GAME_EVENT: SubscriptionType.GAME_EVENTS,
            MessageType.PORTFOLIO_UPDATE: SubscriptionType.PORTFOLIO_CHANGES,
            MessageType.MARKET_ALERT: SubscriptionType.MARKET_MOVEMENTS
        }
        return mapping.get(message_type, SubscriptionType.ALL_UPDATES)
        
    async def _serialize_message(self, message: RealtimeMessage, 
                                subscription: Optional[ClientSubscription]) -> str:
        """Serialize and compress message"""
        
        # Convert to dict
        message_dict = {
            "id": message.id,
            "type": message.type.value,
            "timestamp": message.timestamp.isoformat(),
            "data": message.data
        }
        
        # JSON serialization
        json_str = json.dumps(message_dict, separators=(',', ':'))  # Compact JSON
        
        # Apply compression if enabled
        if (subscription and subscription.compression_enabled and 
            message.compression != CompressionType.NONE):
            
            if message.compression == CompressionType.GZIP:
                compressed_data = gzip.compress(json_str.encode('utf-8'))
                return f"GZIP:{compressed_data.hex()}"
            
        return json_str

class EventProcessor:
    """Process and distribute real-time events"""
    
    def __init__(self, connection_manager: ConnectionManager):
        self.connection_manager = connection_manager
        self.event_queue: asyncio.Queue = asyncio.Queue(maxsize=10000)
        self.processors: Dict[MessageType, Callable] = {}
        self.event_stats = {
            "events_processed": 0,
            "events_dropped": 0,
            "processing_time_avg": 0.0
        }
        self.running = False
        
    async def start(self):
        """Start event processing"""
        self.running = True
        
        # Start event processing task
        asyncio.create_task(self._process_events())
        
        logger.info("Event processor started")
        
    async def stop(self):
        """Stop event processing"""
        self.running = False
        
    def register_processor(self, message_type: MessageType, processor: Callable):
        """Register custom event processor"""
        self.processors[message_type] = processor
        
    async def publish_event(self, message: RealtimeMessage, 
                          subscription_filter: Optional[SubscriptionType] = None):
        """Publish event for processing"""
        
        try:
            self.event_queue.put_nowait((message, subscription_filter))
        except asyncio.QueueFull:
            self.event_stats["events_dropped"] += 1
            logger.warning("Event queue full, dropping event")
            
    async def _process_events(self):
        """Process events from queue"""
        
        while self.running:
            try:
                # Wait for event with timeout
                message, subscription_filter = await asyncio.wait_for(
                    self.event_queue.get(), timeout=1.0
                )
                
                start_time = time.time()
                
                # Apply custom processor if available
                if message.type in self.processors:
                    try:
                        processed_message = await self.processors[message.type](message)
                        if processed_message:
                            message = processed_message
                    except Exception as e:
                        logger.error(f"Custom processor failed: {e}")
                        
                # Broadcast message
                await self.connection_manager.broadcast_message(message, subscription_filter)
                
                # Update stats
                processing_time = time.time() - start_time
                self.event_stats["events_processed"] += 1
                
                # Update average processing time
                if self.event_stats["processing_time_avg"] == 0:
                    self.event_stats["processing_time_avg"] = processing_time
                else:
                    self.event_stats["processing_time_avg"] = (
                        0.9 * self.event_stats["processing_time_avg"] + 
                        0.1 * processing_time
                    )
                    
            except asyncio.TimeoutError:
                continue
            except Exception as e:
                logger.error(f"Event processing error: {e}")

class PredictionStreamer:
    """Stream real-time predictions"""
    
    def __init__(self, event_processor: EventProcessor):
        self.event_processor = event_processor
        self.ml_service = None
        self.active_predictions: Dict[str, Any] = {}
        self.prediction_cache = {}
        self.update_interval = 30.0  # seconds
        self.running = False
        
    async def initialize(self):
        """Initialize prediction streamer"""
        self.ml_service = await get_ml_service()
        
    async def start(self):
        """Start prediction streaming"""
        self.running = True
        
        # Start prediction update task
        asyncio.create_task(self._update_predictions_loop())
        
        logger.info("Prediction streamer started")
        
    async def stop(self):
        """Stop prediction streaming"""
        self.running = False
        
    async def stream_prediction(self, player_id: str, features: Dict[str, Any],
                              sport: SportType, prop_type: str):
        """Stream predictions for a player"""
        
        if not self.ml_service:
            return
            
        try:
            # Create prediction request
            request = PredictionRequest(
                player_id=player_id,
                features=features,
                sport=sport,
                prop_type=prop_type,
                confidence_required=True,
                explain=False  # Skip explanation for real-time
            )
            
            # Get prediction
            result = await self.ml_service.predict(request)
            
            # Create message
            message = RealtimeMessage(
                id=str(uuid.uuid4()),
                type=MessageType.PREDICTION_UPDATE,
                timestamp=datetime.now(),
                data={
                    "player_id": player_id,
                    "sport": sport.value,
                    "prop_type": prop_type,
                    "prediction": result.prediction,
                    "confidence": result.confidence,
                    "model_type": result.model_type.value,
                    "inference_time_ms": result.inference_time_ms
                },
                priority=1
            )
            
            # Publish event
            await self.event_processor.publish_event(
                message, SubscriptionType.PLAYER_PREDICTIONS
            )
            
            # Cache prediction
            cache_key = f"{player_id}_{sport.value}_{prop_type}"
            self.prediction_cache[cache_key] = result
            
        except Exception as e:
            logger.error(f"Prediction streaming failed: {e}")
            
    async def _update_predictions_loop(self):
        """Continuously update predictions for active players"""
        
        while self.running:
            try:
                # Update all active predictions
                for prediction_key, prediction_data in self.active_predictions.items():
                    await self.stream_prediction(
                        prediction_data["player_id"],
                        prediction_data["features"],
                        prediction_data["sport"],
                        prediction_data["prop_type"]
                    )
                    
                # Wait for next update interval
                await asyncio.sleep(self.update_interval)
                
            except Exception as e:
                logger.error(f"Prediction update loop error: {e}")
                await asyncio.sleep(10)  # Wait before retrying

class PortfolioStreamer:
    """Stream real-time portfolio updates"""
    
    def __init__(self, event_processor: EventProcessor):
        self.event_processor = event_processor
        self.quantum_service = None
        self.active_portfolios: Dict[str, Dict[str, Any]] = {}
        self.running = False
        
    async def initialize(self):
        """Initialize portfolio streamer"""
        self.quantum_service = await get_quantum_service()
        
    async def start(self):
        """Start portfolio streaming"""
        self.running = True
        
        # Start portfolio update task
        asyncio.create_task(self._update_portfolios_loop())
        
        logger.info("Portfolio streamer started")
        
    async def stop(self):
        """Stop portfolio streaming"""
        self.running = False
        
    async def stream_portfolio_update(self, user_id: str, 
                                    opportunities: List[BettingOpportunity]):
        """Stream portfolio optimization update"""
        
        if not self.quantum_service:
            return
            
        try:
            # Optimize portfolio
            optimization_result = await self.quantum_service.optimize_portfolio(opportunities)
            
            # Create message
            message = RealtimeMessage(
                id=str(uuid.uuid4()),
                type=MessageType.PORTFOLIO_UPDATE,
                timestamp=datetime.now(),
                data={
                    "user_id": user_id,
                    "optimal_allocations": optimization_result.optimal_allocations,
                    "expected_return": optimization_result.expected_return,
                    "risk_score": optimization_result.risk_score,
                    "quantum_advantage": optimization_result.quantum_advantage,
                    "diversification_score": optimization_result.diversification_score,
                    "optimization_time": optimization_result.convergence_time
                },
                priority=1
            )
            
            # Publish event
            await self.event_processor.publish_event(
                message, SubscriptionType.PORTFOLIO_CHANGES
            )
            
        except Exception as e:
            logger.error(f"Portfolio streaming failed: {e}")
            
    async def _update_portfolios_loop(self):
        """Continuously update portfolios"""
        
        while self.running:
            try:
                # Update all active portfolios
                for user_id, portfolio_data in self.active_portfolios.items():
                    await self.stream_portfolio_update(
                        user_id,
                        portfolio_data["opportunities"]
                    )
                    
                # Wait for next update interval (longer for portfolios)
                await asyncio.sleep(60.0)  # 1 minute
                
            except Exception as e:
                logger.error(f"Portfolio update loop error: {e}")
                await asyncio.sleep(30)  # Wait before retrying

class OptimizedRealtimeService:
    """
    Optimized real-time service for live betting with WebSocket streaming,
    event processing, and intelligent message distribution.
    """
    
    def __init__(self, cache_service: Optional[UnifiedCacheService] = None):
        self.cache_service = cache_service
        self.connection_manager = ConnectionManager()
        self.event_processor = EventProcessor(self.connection_manager)
        self.prediction_streamer = PredictionStreamer(self.event_processor)
        self.portfolio_streamer = PortfolioStreamer(self.event_processor)
        
        # Redis for pub/sub
        self.redis_client: Optional[redis.Redis] = None
        
        # Service state
        self.running = False
        self.websocket_server = None
        
        # Performance metrics
        self.metrics = {
            "uptime_start": datetime.now(),
            "total_events_processed": 0,
            "active_subscriptions": 0,
            "message_throughput": 0.0,
            "error_rate": 0.0
        }
        
    async def initialize(self, host: str = "0.0.0.0", port: int = 8765):
        """Initialize the real-time service"""
        
        if self.cache_service is None:
            self.cache_service = await get_cache()
            
        # Initialize Redis for pub/sub
        if REDIS_AVAILABLE:
            try:
                self.redis_client = redis.Redis(
                    host='localhost',
                    port=6379,
                    decode_responses=True
                )
                await self.redis_client.ping()
                logger.info("Redis connection established for pub/sub")
            except Exception as e:
                logger.warning(f"Redis connection failed: {e}")
                
        # Initialize components
        await self.prediction_streamer.initialize()
        await self.portfolio_streamer.initialize()
        
        # Register custom event processors
        self._register_event_processors()
        
        # Start WebSocket server
        if WEBSOCKETS_AVAILABLE:
            self.websocket_server = await websockets.serve(
                self._handle_websocket_connection,
                host,
                port,
                ping_interval=30,
                ping_timeout=10,
                close_timeout=10
            )
            logger.info(f"WebSocket server started on {host}:{port}")
        else:
            logger.warning("WebSockets not available")
            
        logger.info("Optimized Real-time Service initialized")
        
    async def start(self):
        """Start the real-time service"""
        self.running = True
        
        # Start components
        await self.event_processor.start()
        await self.prediction_streamer.start()
        await self.portfolio_streamer.start()
        
        # Start Redis pub/sub listener
        if self.redis_client:
            asyncio.create_task(self._redis_listener())
            
        # Start metrics collection
        asyncio.create_task(self._collect_metrics())
        
        logger.info("Real-time service started")
        
    async def stop(self):
        """Stop the real-time service"""
        self.running = False
        
        # Stop components
        await self.event_processor.stop()
        await self.prediction_streamer.stop()
        await self.portfolio_streamer.stop()
        
        # Close WebSocket server
        if self.websocket_server:
            self.websocket_server.close()
            await self.websocket_server.wait_closed()
            
        # Close Redis connection
        if self.redis_client:
            await self.redis_client.close()
            
        logger.info("Real-time service stopped")
        
    async def publish_prediction_update(self, player_id: str, sport: SportType,
                                      prop_type: str, prediction: float,
                                      confidence: float, **kwargs):
        """Publish prediction update"""
        
        message = RealtimeMessage(
            id=str(uuid.uuid4()),
            type=MessageType.PREDICTION_UPDATE,
            timestamp=datetime.now(),
            data={
                "player_id": player_id,
                "sport": sport.value,
                "prop_type": prop_type,
                "prediction": prediction,
                "confidence": confidence,
                **kwargs
            }
        )
        
        await self.event_processor.publish_event(
            message, SubscriptionType.PLAYER_PREDICTIONS
        )
        
        # Also publish to Redis for cross-instance communication
        if self.redis_client:
            await self.redis_client.publish(
                "prediction_updates",
                json.dumps(asdict(message), default=str)
            )
            
    async def publish_odds_change(self, opportunity_id: str, new_odds: Dict[str, float],
                                old_odds: Dict[str, float], **kwargs):
        """Publish odds change event"""
        
        message = RealtimeMessage(
            id=str(uuid.uuid4()),
            type=MessageType.ODDS_CHANGE,
            timestamp=datetime.now(),
            data={
                "opportunity_id": opportunity_id,
                "new_odds": new_odds,
                "old_odds": old_odds,
                "change_percentage": self._calculate_odds_change_percentage(new_odds, old_odds),
                **kwargs
            }
        )
        
        await self.event_processor.publish_event(
            message, SubscriptionType.MARKET_MOVEMENTS
        )
        
    async def publish_game_event(self, game_id: str, event_type: str,
                               event_data: Dict[str, Any], **kwargs):
        """Publish game event"""
        
        message = RealtimeMessage(
            id=str(uuid.uuid4()),
            type=MessageType.GAME_EVENT,
            timestamp=datetime.now(),
            data={
                "game_id": game_id,
                "event_type": event_type,
                "event_data": event_data,
                **kwargs
            }
        )
        
        await self.event_processor.publish_event(
            message, SubscriptionType.GAME_EVENTS
        )
        
    async def get_connection_stats(self) -> Dict[str, Any]:
        """Get connection statistics"""
        
        stats = self.connection_manager.connection_stats.copy()
        stats.update({
            "event_stats": self.event_processor.event_stats,
            "service_metrics": self.metrics,
            "uptime_seconds": (datetime.now() - self.metrics["uptime_start"]).total_seconds(),
            "redis_connected": self.redis_client is not None
        })
        
        return stats
        
    async def health_check(self) -> Dict[str, Any]:
        """Perform health check"""
        
        health_status = {
            "status": "healthy",
            "websockets_available": WEBSOCKETS_AVAILABLE,
            "redis_available": REDIS_AVAILABLE,
            "active_connections": len(self.connection_manager.connections),
            "event_queue_size": self.event_processor.event_queue.qsize(),
            "components_running": self.running,
            "last_check": datetime.now().isoformat()
        }
        
        # Test Redis connection
        if self.redis_client:
            try:
                await self.redis_client.ping()
                health_status["redis_status"] = "connected"
            except Exception:
                health_status["redis_status"] = "disconnected"
        else:
            health_status["redis_status"] = "not_configured"
            
        # Check component health
        component_health = {
            "event_processor": self.event_processor.running,
            "prediction_streamer": self.prediction_streamer.running,
            "portfolio_streamer": self.portfolio_streamer.running
        }
        
        if not all(component_health.values()):
            health_status["status"] = "degraded"
            
        health_status["components"] = component_health
        
        return health_status
        
    async def _handle_websocket_connection(self, websocket: WebSocketServerProtocol, path: str):
        """Handle new WebSocket connection"""
        
        client_id = str(uuid.uuid4())
        
        try:
            # Add connection
            await self.connection_manager.add_connection(client_id, websocket)
            
            # Send welcome message
            welcome_message = RealtimeMessage(
                id=str(uuid.uuid4()),
                type=MessageType.SYSTEM_STATUS,
                timestamp=datetime.now(),
                data={
                    "status": "connected",
                    "client_id": client_id,
                    "available_subscriptions": [sub.value for sub in SubscriptionType]
                }
            )
            await self.connection_manager.send_to_client(client_id, welcome_message)
            
            # Handle incoming messages
            async for message in websocket:
                try:
                    await self._handle_client_message(client_id, json.loads(message))
                except json.JSONDecodeError:
                    await self._send_error(client_id, "Invalid JSON format")
                except Exception as e:
                    await self._send_error(client_id, f"Message processing error: {e}")
                    
        except websockets.exceptions.ConnectionClosed:
            logger.info(f"WebSocket connection closed: {client_id}")
        except Exception as e:
            logger.error(f"WebSocket connection error: {e}")
        finally:
            await self.connection_manager.remove_connection(client_id)
            
    async def _handle_client_message(self, client_id: str, message: Dict[str, Any]):
        """Handle message from client"""
        
        message_type = message.get("type")
        
        if message_type == "subscribe":
            subscription_type = SubscriptionType(message.get("subscription_type"))
            filters = message.get("filters", {})
            await self.connection_manager.subscribe(client_id, subscription_type, filters)
            
        elif message_type == "unsubscribe":
            subscription_type = SubscriptionType(message.get("subscription_type"))
            await self.connection_manager.unsubscribe(client_id, subscription_type)
            
        elif message_type == "ping":
            # Respond with pong
            pong_message = RealtimeMessage(
                id=str(uuid.uuid4()),
                type=MessageType.HEARTBEAT,
                timestamp=datetime.now(),
                data={"type": "pong"}
            )
            await self.connection_manager.send_to_client(client_id, pong_message)
            
        else:
            await self._send_error(client_id, f"Unknown message type: {message_type}")
            
    async def _send_error(self, client_id: str, error_message: str):
        """Send error message to client"""
        
        error_msg = RealtimeMessage(
            id=str(uuid.uuid4()),
            type=MessageType.ERROR,
            timestamp=datetime.now(),
            data={"error": error_message}
        )
        await self.connection_manager.send_to_client(client_id, error_msg)
        
    async def _redis_listener(self):
        """Listen for Redis pub/sub messages"""
        
        if not self.redis_client:
            return
            
        try:
            pubsub = self.redis_client.pubsub()
            await pubsub.subscribe("prediction_updates", "odds_changes", "game_events")
            
            async for message in pubsub.listen():
                if message["type"] == "message":
                    try:
                        data = json.loads(message["data"])
                        realtime_message = RealtimeMessage(**data)
                        
                        # Re-broadcast to local connections
                        await self.event_processor.publish_event(realtime_message)
                        
                    except Exception as e:
                        logger.error(f"Redis message processing error: {e}")
                        
        except Exception as e:
            logger.error(f"Redis listener error: {e}")
            
    async def _collect_metrics(self):
        """Collect performance metrics"""
        
        while self.running:
            try:
                # Update metrics
                self.metrics.update({
                    "active_subscriptions": len(self.connection_manager.subscriptions),
                    "total_events_processed": self.event_processor.event_stats["events_processed"],
                    "message_throughput": self._calculate_message_throughput(),
                    "error_rate": self._calculate_error_rate()
                })
                
                # Wait before next collection
                await asyncio.sleep(30)  # Collect every 30 seconds
                
            except Exception as e:
                logger.error(f"Metrics collection error: {e}")
                
    def _calculate_message_throughput(self) -> float:
        """Calculate messages per second"""
        
        uptime = (datetime.now() - self.metrics["uptime_start"]).total_seconds()
        if uptime > 0:
            return self.connection_manager.connection_stats["messages_sent"] / uptime
        return 0.0
        
    def _calculate_error_rate(self) -> float:
        """Calculate error rate"""
        
        total_messages = (
            self.connection_manager.connection_stats["messages_sent"] +
            self.connection_manager.connection_stats["messages_failed"]
        )
        
        if total_messages > 0:
            return self.connection_manager.connection_stats["messages_failed"] / total_messages
        return 0.0
        
    def _calculate_odds_change_percentage(self, new_odds: Dict[str, float],
                                        old_odds: Dict[str, float]) -> Dict[str, float]:
        """Calculate percentage change in odds"""
        
        changes = {}
        for key in new_odds:
            if key in old_odds and old_odds[key] != 0:
                change_pct = ((new_odds[key] - old_odds[key]) / old_odds[key]) * 100
                changes[key] = round(change_pct, 2)
            else:
                changes[key] = 0.0
                
        return changes
        
    def _register_event_processors(self):
        """Register custom event processors"""
        
        # Custom processor for prediction updates
        async def process_prediction_update(message: RealtimeMessage) -> RealtimeMessage:
            # Add additional metadata
            message.data["processed_at"] = datetime.now().isoformat()
            message.data["server_id"] = "optimized_realtime_service"
            return message
            
        # Custom processor for odds changes
        async def process_odds_change(message: RealtimeMessage) -> RealtimeMessage:
            # Calculate volatility score
            changes = message.data.get("change_percentage", {})
            volatility = sum(abs(change) for change in changes.values()) / len(changes) if changes else 0
            message.data["volatility_score"] = volatility
            return message
            
        self.event_processor.register_processor(MessageType.PREDICTION_UPDATE, process_prediction_update)
        self.event_processor.register_processor(MessageType.ODDS_CHANGE, process_odds_change)

# Global instance
_realtime_service: Optional[OptimizedRealtimeService] = None

async def get_realtime_service() -> OptimizedRealtimeService:
    """Get global real-time service instance"""
    global _realtime_service
    if _realtime_service is None:
        _realtime_service = OptimizedRealtimeService()
        await _realtime_service.initialize()
    return _realtime_service

# Convenience functions
async def publish_prediction_update(player_id: str, sport: SportType, 
                                  prop_type: str, prediction: float, 
                                  confidence: float, **kwargs):
    """Publish prediction update to real-time stream"""
    service = await get_realtime_service()
    await service.publish_prediction_update(
        player_id, sport, prop_type, prediction, confidence, **kwargs
    )

async def publish_odds_change(opportunity_id: str, new_odds: Dict[str, float],
                            old_odds: Dict[str, float], **kwargs):
    """Publish odds change to real-time stream"""
    service = await get_realtime_service()
    await service.publish_odds_change(opportunity_id, new_odds, old_odds, **kwargs)

async def start_realtime_service():
    """Start the real-time service"""
    service = await get_realtime_service()
    await service.start()

async def stop_realtime_service():
    """Stop the real-time service"""
    global _realtime_service
    if _realtime_service:
        await _realtime_service.stop()
