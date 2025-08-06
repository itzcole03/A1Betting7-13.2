"""
Enhanced Real-Time WebSocket Service - Priority 2 Implementation
Advanced WebSocket implementation with Redis caching and granular updates
"""

import asyncio
import json
import logging
import time
import uuid
from dataclasses import asdict, dataclass
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Dict, List, Optional, Set, Union

import redis.asyncio as redis
from fastapi import WebSocket, WebSocketDisconnect
from pydantic import BaseModel

from backend.models.comprehensive_api_models import APIResponse
from backend.services.optimized_redis_service import OptimizedRedisService
from backend.utils.enhanced_logging import get_logger

logger = get_logger("enhanced_realtime_websocket")


class MessageType(str, Enum):
    """WebSocket message types"""

    SUBSCRIBE = "subscribe"
    UNSUBSCRIBE = "unsubscribe"
    PROP_UPDATE = "prop_update"
    GAME_UPDATE = "game_update"
    PREDICTION_UPDATE = "prediction_update"
    ANALYSIS_UPDATE = "analysis_update"
    SYSTEM_STATUS = "system_status"
    PING = "ping"
    PONG = "pong"


class SubscriptionType(str, Enum):
    """Subscription types for filtering"""

    ALL_PROPS = "all_props"
    SPORT_PROPS = "sport_props"  # e.g. "sport_props:mlb"
    PLAYER_PROPS = "player_props"  # e.g. "player_props:aaron_judge"
    GAME_PROPS = "game_props"  # e.g. "game_props:game_123"
    PREDICTIONS = "predictions"
    ANALYSIS = "analysis"
    SYSTEM_STATUS = "system_status"


@dataclass
class ConnectionInfo:
    """Enhanced connection information"""

    client_id: str
    websocket: WebSocket
    connected_at: datetime
    last_ping: datetime
    subscriptions: Set[str]
    user_id: Optional[str] = None
    session_data: Dict[str, Any] = None
    message_count: int = 0
    bytes_sent: int = 0
    bytes_received: int = 0


class WebSocketMessage(BaseModel):
    """Structured WebSocket message"""

    message_type: MessageType
    data: Dict[str, Any]
    timestamp: datetime
    client_id: Optional[str] = None
    subscription_id: Optional[str] = None


class EnhancedConnectionManager:
    """Advanced WebSocket connection manager with Redis integration"""

    def __init__(self, redis_service: OptimizedRedisService):
        self.redis_service = redis_service
        self.connections: Dict[str, ConnectionInfo] = {}
        self.subscriptions: Dict[str, Set[str]] = {}  # subscription -> client_ids
        self.redis_pubsub: Optional[redis.Redis] = None
        self.pubsub_task: Optional[asyncio.Task] = None
        self.heartbeat_task: Optional[asyncio.Task] = None
        self.metrics = {
            "total_connections": 0,
            "active_connections": 0,
            "messages_sent": 0,
            "messages_received": 0,
            "subscription_updates": 0,
        }

    async def initialize(self):
        """Initialize the connection manager"""
        logger.info("Initializing Enhanced WebSocket Connection Manager...")

        # Initialize Redis pub/sub
        await self._setup_redis_pubsub()

        # Start heartbeat monitor
        self.heartbeat_task = asyncio.create_task(self._heartbeat_monitor())

        logger.info("Enhanced WebSocket Connection Manager initialized")

    async def _setup_redis_pubsub(self):
        """Setup Redis pub/sub for cross-service communication"""
        try:
            async with self.redis_service.get_redis() as redis_client:
                self.redis_pubsub = redis_client
                pubsub = redis_client.pubsub()

                # Subscribe to all real-time channels
                channels = [
                    "realtime:prop_updates",
                    "realtime:game_updates",
                    "realtime:prediction_updates",
                    "realtime:analysis_updates",
                    "realtime:system_status",
                ]

                await pubsub.subscribe(*channels)
                self.pubsub_task = asyncio.create_task(
                    self._redis_message_handler(pubsub)
                )

                logger.info(f"Redis pub/sub initialized with channels: {channels}")

        except Exception as e:
            logger.error(f"Failed to setup Redis pub/sub: {e}")
            raise

    async def _redis_message_handler(self, pubsub):
        """Handle messages from Redis pub/sub"""
        try:
            async for message in pubsub.listen():
                if message["type"] == "message":
                    try:
                        channel = message["channel"].decode("utf-8")
                        data = json.loads(message["data"])

                        # Convert to WebSocket message
                        ws_message = WebSocketMessage(
                            message_type=self._channel_to_message_type(channel),
                            data=data,
                            timestamp=datetime.now(),
                        )

                        # Broadcast to relevant subscribers
                        await self._broadcast_message(ws_message)

                    except Exception as e:
                        logger.error(f"Error processing Redis message: {e}")

        except Exception as e:
            logger.error(f"Redis message handler error: {e}")

    def _channel_to_message_type(self, channel: str) -> MessageType:
        """Convert Redis channel to WebSocket message type"""
        mapping = {
            "realtime:prop_updates": MessageType.PROP_UPDATE,
            "realtime:game_updates": MessageType.GAME_UPDATE,
            "realtime:prediction_updates": MessageType.PREDICTION_UPDATE,
            "realtime:analysis_updates": MessageType.ANALYSIS_UPDATE,
            "realtime:system_status": MessageType.SYSTEM_STATUS,
        }
        return mapping.get(channel, MessageType.PROP_UPDATE)

    async def connect(self, websocket: WebSocket, client_id: str = None) -> str:
        """Connect new WebSocket client with enhanced metadata"""
        await websocket.accept()

        if not client_id:
            client_id = str(uuid.uuid4())

        # Create connection info
        connection_info = ConnectionInfo(
            client_id=client_id,
            websocket=websocket,
            connected_at=datetime.now(),
            last_ping=datetime.now(),
            subscriptions=set(),
            session_data={},
        )

        self.connections[client_id] = connection_info
        self.metrics["total_connections"] += 1
        self.metrics["active_connections"] = len(self.connections)

        # Cache connection info in Redis
        await self._cache_connection_info(client_id, connection_info)

        logger.info(f"Enhanced WebSocket connection established: {client_id}")

        # Send welcome message
        welcome_message = WebSocketMessage(
            message_type=MessageType.SYSTEM_STATUS,
            data={
                "status": "connected",
                "client_id": client_id,
                "timestamp": datetime.now().isoformat(),
                "available_subscriptions": [sub.value for sub in SubscriptionType],
            },
            timestamp=datetime.now(),
            client_id=client_id,
        )

        await self._send_to_client(client_id, welcome_message)
        return client_id

    async def disconnect(self, client_id: str):
        """Disconnect WebSocket client with cleanup"""
        if client_id not in self.connections:
            return

        connection_info = self.connections[client_id]

        # Remove from all subscriptions
        for subscription in connection_info.subscriptions.copy():
            await self.unsubscribe(client_id, subscription)

        # Remove connection
        del self.connections[client_id]
        self.metrics["active_connections"] = len(self.connections)

        # Remove from Redis cache
        await self._remove_connection_cache(client_id)

        logger.info(f"WebSocket disconnected and cleaned up: {client_id}")

    async def subscribe(self, client_id: str, subscription: str) -> bool:
        """Subscribe client to specific data stream"""
        if client_id not in self.connections:
            return False

        connection_info = self.connections[client_id]
        connection_info.subscriptions.add(subscription)

        # Add to subscription mapping
        if subscription not in self.subscriptions:
            self.subscriptions[subscription] = set()
        self.subscriptions[subscription].add(client_id)

        # Cache subscription in Redis
        await self._cache_subscription(client_id, subscription)

        logger.info(f"Client {client_id} subscribed to {subscription}")

        # Send confirmation
        confirm_message = WebSocketMessage(
            message_type=MessageType.SYSTEM_STATUS,
            data={
                "action": "subscribed",
                "subscription": subscription,
                "timestamp": datetime.now().isoformat(),
            },
            timestamp=datetime.now(),
            client_id=client_id,
        )

        await self._send_to_client(client_id, confirm_message)
        return True

    async def unsubscribe(self, client_id: str, subscription: str) -> bool:
        """Unsubscribe client from data stream"""
        if client_id not in self.connections:
            return False

        connection_info = self.connections[client_id]
        connection_info.subscriptions.discard(subscription)

        # Remove from subscription mapping
        if subscription in self.subscriptions:
            self.subscriptions[subscription].discard(client_id)
            if not self.subscriptions[subscription]:
                del self.subscriptions[subscription]

        # Remove from Redis cache
        await self._remove_subscription_cache(client_id, subscription)

        logger.info(f"Client {client_id} unsubscribed from {subscription}")
        return True

    async def _send_to_client(self, client_id: str, message: WebSocketMessage):
        """Send message to specific client"""
        if client_id not in self.connections:
            return

        try:
            connection_info = self.connections[client_id]
            websocket = connection_info.websocket

            message_data = message.model_dump(mode="json")
            message_json = json.dumps(message_data, default=str)

            await websocket.send_text(message_json)

            # Update metrics
            connection_info.message_count += 1
            connection_info.bytes_sent += len(message_json)
            self.metrics["messages_sent"] += 1

        except WebSocketDisconnect:
            await self.disconnect(client_id)
        except Exception as e:
            logger.error(f"Error sending message to client {client_id}: {e}")

    async def _broadcast_message(self, message: WebSocketMessage):
        """Broadcast message to subscribers"""
        if not message.subscription_id:
            return

        subscribers = self.subscriptions.get(message.subscription_id, set())

        if not subscribers:
            return

        # Send to all subscribers concurrently
        send_tasks = []
        for client_id in subscribers:
            task = asyncio.create_task(self._send_to_client(client_id, message))
            send_tasks.append(task)

        if send_tasks:
            await asyncio.gather(*send_tasks, return_exceptions=True)
            self.metrics["subscription_updates"] += len(send_tasks)

    async def _heartbeat_monitor(self):
        """Monitor connection health and send heartbeats"""
        while True:
            try:
                current_time = datetime.now()
                disconnected_clients = []

                for client_id, connection_info in self.connections.items():
                    # Check if client needs ping
                    time_since_ping = current_time - connection_info.last_ping
                    if time_since_ping.total_seconds() > 30:  # 30 seconds

                        ping_message = WebSocketMessage(
                            message_type=MessageType.PING,
                            data={"timestamp": current_time.isoformat()},
                            timestamp=current_time,
                            client_id=client_id,
                        )

                        try:
                            await self._send_to_client(client_id, ping_message)
                            connection_info.last_ping = current_time
                        except:
                            disconnected_clients.append(client_id)

                # Clean up disconnected clients
                for client_id in disconnected_clients:
                    await self.disconnect(client_id)

                await asyncio.sleep(30)  # Check every 30 seconds

            except Exception as e:
                logger.error(f"Heartbeat monitor error: {e}")
                await asyncio.sleep(30)

    async def _cache_connection_info(
        self, client_id: str, connection_info: ConnectionInfo
    ):
        """Cache connection info in Redis"""
        try:
            cache_data = {
                "client_id": client_id,
                "connected_at": connection_info.connected_at.isoformat(),
                "subscriptions": list(connection_info.subscriptions),
                "message_count": connection_info.message_count,
            }

            await self.redis_service.set(
                f"websocket:connection:{client_id}", cache_data, ttl=3600  # 1 hour
            )
        except Exception as e:
            logger.error(f"Error caching connection info: {e}")

    async def _cache_subscription(self, client_id: str, subscription: str):
        """Cache subscription in Redis"""
        try:
            # Add to subscription set
            cache_key = f"websocket:subscription:{subscription}"
            await self.redis_service.redis_client.sadd(cache_key, client_id)
            await self.redis_service.redis_client.expire(cache_key, 3600)  # 1 hour
        except Exception as e:
            logger.error(f"Error caching subscription: {e}")

    async def _remove_connection_cache(self, client_id: str):
        """Remove connection from Redis cache"""
        try:
            await self.redis_service.delete(f"websocket:connection:{client_id}")
        except Exception as e:
            logger.error(f"Error removing connection cache: {e}")

    async def _remove_subscription_cache(self, client_id: str, subscription: str):
        """Remove subscription from Redis cache"""
        try:
            cache_key = f"websocket:subscription:{subscription}"
            await self.redis_service.redis_client.srem(cache_key, client_id)
        except Exception as e:
            logger.error(f"Error removing subscription cache: {e}")

    async def get_metrics(self) -> Dict[str, Any]:
        """Get connection manager metrics"""
        return {
            **self.metrics,
            "subscriptions": {
                subscription: len(clients)
                for subscription, clients in self.subscriptions.items()
            },
        }

    async def cleanup(self):
        """Clean up connection manager"""
        logger.info("Cleaning up Enhanced WebSocket Connection Manager...")

        # Cancel background tasks
        if self.heartbeat_task:
            self.heartbeat_task.cancel()
        if self.pubsub_task:
            self.pubsub_task.cancel()

        # Disconnect all clients
        for client_id in list(self.connections.keys()):
            await self.disconnect(client_id)

        logger.info("Enhanced WebSocket Connection Manager cleanup complete")


class EnhancedRealtimeWebSocketService:
    """Enhanced real-time WebSocket service with Redis integration"""

    def __init__(self, redis_service: OptimizedRedisService):
        self.redis_service = redis_service
        self.connection_manager = EnhancedConnectionManager(redis_service)
        self.prop_updater_task: Optional[asyncio.Task] = None
        self.is_running = False

    async def initialize(self):
        """Initialize the enhanced WebSocket service"""
        logger.info("Initializing Enhanced Real-Time WebSocket Service...")

        # Initialize connection manager
        await self.connection_manager.initialize()

        # Start prop update broadcaster
        self.prop_updater_task = asyncio.create_task(self._prop_update_broadcaster())
        self.is_running = True

        logger.info("Enhanced Real-Time WebSocket Service initialized")

    async def websocket_endpoint(self, websocket: WebSocket, client_id: str = None):
        """Main WebSocket endpoint handler"""
        client_id = await self.connection_manager.connect(websocket, client_id)

        try:
            while True:
                # Receive message from client
                data = await websocket.receive_text()
                message_data = json.loads(data)

                # Process client message
                await self._process_client_message(client_id, message_data)

        except WebSocketDisconnect:
            logger.info(f"WebSocket client {client_id} disconnected")
        except Exception as e:
            logger.error(f"WebSocket error for client {client_id}: {e}")
        finally:
            await self.connection_manager.disconnect(client_id)

    async def _process_client_message(
        self, client_id: str, message_data: Dict[str, Any]
    ):
        """Process message from WebSocket client"""
        try:
            message_type = message_data.get("message_type")
            data = message_data.get("data", {})

            if message_type == MessageType.SUBSCRIBE.value:
                subscription = data.get("subscription")
                if subscription:
                    await self.connection_manager.subscribe(client_id, subscription)

            elif message_type == MessageType.UNSUBSCRIBE.value:
                subscription = data.get("subscription")
                if subscription:
                    await self.connection_manager.unsubscribe(client_id, subscription)

            elif message_type == MessageType.PING.value:
                # Respond with pong
                pong_message = WebSocketMessage(
                    message_type=MessageType.PONG,
                    data={"timestamp": datetime.now().isoformat()},
                    timestamp=datetime.now(),
                    client_id=client_id,
                )
                await self.connection_manager._send_to_client(client_id, pong_message)

        except Exception as e:
            logger.error(f"Error processing client message: {e}")

    async def _prop_update_broadcaster(self):
        """Broadcast prop updates to subscribed clients"""
        while self.is_running:
            try:
                # Get recent prop updates from cache
                updates = await self._get_recent_prop_updates()

                for update in updates:
                    # Create WebSocket message
                    prop_message = WebSocketMessage(
                        message_type=MessageType.PROP_UPDATE,
                        data=update,
                        timestamp=datetime.now(),
                        subscription_id=f"sport_props:{update.get('sport', '').lower()}",
                    )

                    # Broadcast to subscribers
                    await self.connection_manager._broadcast_message(prop_message)

                await asyncio.sleep(5)  # Check every 5 seconds

            except Exception as e:
                logger.error(f"Error in prop update broadcaster: {e}")
                await asyncio.sleep(10)

    async def _get_recent_prop_updates(self) -> List[Dict[str, Any]]:
        """Get recent prop updates from Redis cache"""
        try:
            # Get cached prop updates
            cached_updates = await self.redis_service.get(
                "realtime:recent_prop_updates"
            )
            if cached_updates:
                return cached_updates
        except Exception as e:
            logger.error(f"Error getting recent prop updates: {e}")

        return []

    async def publish_prop_update(self, prop_data: Dict[str, Any]):
        """Publish prop update to Redis for distribution"""
        try:
            # Cache the update
            cache_key = "realtime:recent_prop_updates"
            cached_updates = await self.redis_service.get(cache_key) or []

            # Add new update
            cached_updates.append(
                {**prop_data, "timestamp": datetime.now().isoformat()}
            )

            # Keep only last 100 updates
            cached_updates = cached_updates[-100:]

            # Update cache
            await self.redis_service.set(
                cache_key, cached_updates, ttl=300
            )  # 5 minutes

            # Publish to Redis channel
            async with self.redis_service.get_redis() as redis_client:
                await redis_client.publish(
                    "realtime:prop_updates", json.dumps(prop_data)
                )

            logger.info(f"Published prop update: {prop_data.get('prop_id', 'unknown')}")

        except Exception as e:
            logger.error(f"Error publishing prop update: {e}")

    async def get_service_metrics(self) -> Dict[str, Any]:
        """Get service metrics"""
        connection_metrics = await self.connection_manager.get_metrics()

        return {
            "service_status": "running" if self.is_running else "stopped",
            "connection_manager": connection_metrics,
            "redis_service": await self.redis_service.health_check(),
        }

    async def cleanup(self):
        """Cleanup WebSocket service"""
        logger.info("Cleaning up Enhanced Real-Time WebSocket Service...")

        self.is_running = False

        if self.prop_updater_task:
            self.prop_updater_task.cancel()

        await self.connection_manager.cleanup()

        logger.info("Enhanced Real-Time WebSocket Service cleanup complete")


# Global enhanced service instance
enhanced_redis_service = OptimizedRedisService()
enhanced_websocket_service = EnhancedRealtimeWebSocketService(enhanced_redis_service)
