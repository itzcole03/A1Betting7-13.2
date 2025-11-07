"""
Enhanced WebSocket Service with Subscription Rooms and Authentication
Implements room-based subscriptions, heartbeat monitoring, and pre-connect authentication.
"""

import asyncio
import json
import logging
import time
import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Set
from enum import Enum
from dataclasses import dataclass, asdict

try:
    import redis.asyncio as redis
except ImportError:
    redis = None

try:
    import jwt
except ImportError:
    jwt = None

from fastapi import WebSocket, WebSocketDisconnect
from backend.utils.enhanced_logging import get_logger

logger = get_logger("enhanced_websocket")


class SubscriptionType(str, Enum):
    """Available subscription types"""
    ODDS_UPDATES = "odds_updates"
    PREDICTIONS = "predictions"  
    ANALYTICS = "analytics"
    ARBITRAGE = "arbitrage"
    PORTFOLIO = "portfolio"
    SYSTEM_ALERTS = "system_alerts"
    # Sport-specific subscriptions
    MLB = "mlb"
    NBA = "nba"
    NFL = "nfl"
    NHL = "nhl"
    # Game-specific subscriptions
    GAME_SPECIFIC = "game_specific"
    # Player-specific subscriptions
    PLAYER_SPECIFIC = "player_specific"


class MessageType(str, Enum):
    """WebSocket message types"""
    # Connection lifecycle
    CONNECT = "connect"
    DISCONNECT = "disconnect"
    AUTHENTICATE = "authenticate"
    
    # Subscription management
    SUBSCRIBE = "subscribe"
    UNSUBSCRIBE = "unsubscribe"
    SUBSCRIPTION_CONFIRMED = "subscription_confirmed"
    SUBSCRIPTION_REMOVED = "subscription_removed"
    
    # Heartbeat
    PING = "ping"
    PONG = "pong"
    
    # Data updates
    ODDS_UPDATE = "odds_update"
    PREDICTION_UPDATE = "prediction_update"
    ANALYTICS_UPDATE = "analytics_update"
    ARBITRAGE_ALERT = "arbitrage_alert"
    PORTFOLIO_UPDATE = "portfolio_update"
    SYSTEM_ALERT = "system_alert"
    
    # Status
    STATUS = "status"
    ERROR = "error"
    WELCOME = "welcome"


@dataclass
class SubscriptionRoom:
    """Represents a subscription room"""
    room_id: str
    subscription_type: SubscriptionType
    filters: Dict[str, Any]
    subscribers: Set[str]
    created_at: datetime
    last_update: datetime
    
    def matches_filters(self, data: Dict[str, Any]) -> bool:
        """Check if data matches room filters"""
        if not self.filters:
            return True
            
        for key, expected_value in self.filters.items():
            if key not in data:
                continue
                
            actual_value = data[key]
            
            # Handle different filter types
            if isinstance(expected_value, list):
                if actual_value not in expected_value:
                    return False
            elif isinstance(expected_value, str):
                if expected_value.lower() != str(actual_value).lower():
                    return False
            elif expected_value != actual_value:
                return False
                
        return True


@dataclass 
class ClientConnection:
    """Represents a WebSocket client connection"""
    client_id: str
    websocket: WebSocket
    user_id: Optional[str]
    authenticated: bool
    connected_at: datetime
    last_heartbeat: datetime
    subscriptions: Set[str]  # Room IDs
    metadata: Dict[str, Any]
    
    def is_alive(self, heartbeat_timeout: int = 60) -> bool:
        """Check if connection is still alive based on heartbeat"""
        return (datetime.now() - self.last_heartbeat).seconds < heartbeat_timeout


class AuthenticationManager:
    """Handles WebSocket authentication"""
    
    def __init__(self, jwt_secret: str = "your-secret-key"):
        self.jwt_secret = jwt_secret
    
    def verify_token(self, token: str) -> Optional[str]:
        """Verify JWT token and return user_id"""
        if jwt is None:
            logger.warning("JWT library not available, using anonymous session")
            return None
            
        try:
            if token.startswith('Bearer '):
                token = token[7:]
                
            payload = jwt.decode(token, self.jwt_secret, algorithms=["HS256"])
            return payload.get('user_id') or payload.get('sub')
            
        except Exception as e:
            logger.error(f"Token verification error: {e}")
            return None
    
    def create_anonymous_session(self) -> str:
        """Create anonymous session ID"""
        return f"anon_{uuid.uuid4().hex[:12]}"


class SubscriptionManager:
    """Manages subscription rooms and client subscriptions"""
    
    def __init__(self):
        self.rooms: Dict[str, SubscriptionRoom] = {}
        self.room_subscribers: Dict[str, Set[str]] = {}  # room_id -> client_ids
        
    def create_room(
        self,
        subscription_type: SubscriptionType,
        filters: Optional[Dict[str, Any]] = None
    ) -> str:
        """Create a new subscription room"""
        filters = filters or {}
        room_id = self._generate_room_id(subscription_type, filters)
        
        if room_id not in self.rooms:
            self.rooms[room_id] = SubscriptionRoom(
                room_id=room_id,
                subscription_type=subscription_type,
                filters=filters,
                subscribers=set(),
                created_at=datetime.now(),
                last_update=datetime.now()
            )
            self.room_subscribers[room_id] = set()
            
        return room_id
    
    def _generate_room_id(
        self,
        subscription_type: SubscriptionType,
        filters: Optional[Dict[str, Any]] = None
    ) -> str:
        """Generate consistent room ID based on type and filters"""
        base = f"{subscription_type.value}"
        
        if filters:
            # Sort filters for consistency
            filter_parts = []
            for key in sorted(filters.keys()):
                value = filters[key]
                if isinstance(value, list):
                    value = ",".join(sorted(map(str, value)))
                filter_parts.append(f"{key}:{value}")
                
            if filter_parts:
                base += f"_{'_'.join(filter_parts)}"
                
        return base
    
    def subscribe_to_room(self, room_id: str, client_id: str) -> bool:
        """Subscribe client to room"""
        if room_id not in self.rooms:
            return False
            
        self.rooms[room_id].subscribers.add(client_id)
        self.room_subscribers[room_id].add(client_id)
        
        logger.info(f"Client {client_id} subscribed to room {room_id}")
        return True
    
    def unsubscribe_from_room(self, room_id: str, client_id: str) -> bool:
        """Unsubscribe client from room"""
        if room_id not in self.rooms:
            return False
            
        self.rooms[room_id].subscribers.discard(client_id)
        self.room_subscribers[room_id].discard(client_id)
        
        # Clean up empty rooms
        if not self.rooms[room_id].subscribers:
            del self.rooms[room_id]
            del self.room_subscribers[room_id]
            logger.info(f"Cleaned up empty room {room_id}")
            
        logger.info(f"Client {client_id} unsubscribed from room {room_id}")
        return True
    
    def get_room_subscribers(self, room_id: str) -> Set[str]:
        """Get all subscribers for a room"""
        return self.room_subscribers.get(room_id, set())
    
    def find_matching_rooms(
        self,
        subscription_type: SubscriptionType,
        data: Dict[str, Any]
    ) -> List[str]:
        """Find all rooms that match the given data"""
        matching_rooms = []
        
        for room in self.rooms.values():
            if (room.subscription_type == subscription_type and 
                room.matches_filters(data)):
                matching_rooms.append(room.room_id)
                
        return matching_rooms


class HeartbeatManager:
    """Manages heartbeat/ping-pong for connections"""
    
    def __init__(self, ping_interval: int = 30, timeout_seconds: int = 60):
        self.ping_interval = ping_interval
        self.timeout_seconds = timeout_seconds
        self.running = False
        self.heartbeat_task: Optional[asyncio.Task] = None
        
    async def start(self, connection_manager):
        """Start heartbeat monitoring"""
        if self.running:
            return
            
        self.running = True
        self.heartbeat_task = asyncio.create_task(
            self._heartbeat_loop(connection_manager)
        )
        logger.info("Heartbeat manager started")
    
    async def stop(self):
        """Stop heartbeat monitoring"""
        # During tests we may want to avoid starting background tasks.
        # Honor the TESTING env var so pytest runs don't spawn persistent tasks
        import os
        if os.environ.get("TESTING", "false").lower() in ("1", "true", "yes"):
            logger.info("Heartbeat manager start skipped in TESTING mode")
            self.running = False
            return
        # If not running, nothing to stop
        if not self.running and self.heartbeat_task is None:
            return

        # Signal loop to stop and cancel running task
        self.running = False
        if self.heartbeat_task is not None:
            try:
                self.heartbeat_task.cancel()
                await self.heartbeat_task
            except asyncio.CancelledError:
                pass
            except Exception as e:
                logger.warning(f"Heartbeat task cancellation raised: {e}")
            finally:
                self.heartbeat_task = None

        logger.info("Heartbeat manager stopped")
    async def _heartbeat_loop(self, connection_manager):
        """Main heartbeat monitoring loop"""
        while self.running:
            try:
                await self._check_connections(connection_manager)
                await asyncio.sleep(self.ping_interval)
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Heartbeat loop error: {e}")
                await asyncio.sleep(5)  # Back off on error
    
    async def _check_connections(self, connection_manager):
        """Check all connections and send pings"""
        current_time = datetime.now()
        dead_connections = []
        
        for client_id, connection in connection_manager.connections.items():
            try:
                # Check if connection is still alive
                if not connection.is_alive(self.timeout_seconds):
                    dead_connections.append(client_id)
                    continue
                
                # Send ping if needed
                time_since_heartbeat = (current_time - connection.last_heartbeat).seconds
                if time_since_heartbeat >= self.ping_interval:
                    await connection_manager.send_ping(client_id)
                    
            except Exception as e:
                logger.error(f"Error checking connection {client_id}: {e}")
                dead_connections.append(client_id)
        
        # Clean up dead connections
        for client_id in dead_connections:
            await connection_manager.disconnect_client(client_id, "heartbeat_timeout")


class EnhancedConnectionManager:
    """Enhanced connection manager with rooms and authentication"""
    
    def __init__(self):
        self.connections: Dict[str, ClientConnection] = {}
        self.auth_manager = AuthenticationManager()
        self.subscription_manager = SubscriptionManager()
        self.heartbeat_manager = HeartbeatManager()
        self.redis_client: Optional[Any] = None
        
    async def initialize(self):
        """Initialize connection manager"""
        try:
            import os

            if redis is not None:
                self.redis_client = redis.from_url("redis://localhost:6379/0")
                await self.redis_client.ping()
                logger.info("Redis connected for connection manager")
            else:
                logger.warning("Redis not available, using memory-only mode")
            # Only start heartbeat manager when not running under pytest/test env
            if os.environ.get("TESTING", "false").lower() not in ("1", "true", "yes"):
                await self.heartbeat_manager.start(self)
            else:
                logger.info("Skipping heartbeat manager start due to TESTING mode")
            logger.info("Enhanced connection manager initialized")
        except Exception as e:
            logger.error(f"Failed to initialize connection manager: {e}")
    
    async def authenticate_and_connect(
        self,
        websocket: WebSocket,
        token: Optional[str] = None
    ) -> str:
        """Authenticate and connect WebSocket client"""
        await websocket.accept()
        
        client_id = str(uuid.uuid4())
        user_id = None
        authenticated = False
        
        if token:
            user_id = self.auth_manager.verify_token(token)
            authenticated = user_id is not None
        
        if not authenticated:
            user_id = self.auth_manager.create_anonymous_session()
        
        # Create connection
        connection = ClientConnection(
            client_id=client_id,
            websocket=websocket,
            user_id=user_id,
            authenticated=authenticated,
            connected_at=datetime.now(),
            last_heartbeat=datetime.now(),
            subscriptions=set(),
            metadata={}
        )
        
        self.connections[client_id] = connection
        
        # Send welcome message
        await self.send_message(client_id, MessageType.WELCOME, {
            "client_id": client_id,
            "user_id": user_id,
            "authenticated": authenticated,
            "available_subscriptions": [sub.value for sub in SubscriptionType],
            "server_time": datetime.now().isoformat()
        })
        
        logger.info(f"Client connected: {client_id} (user: {user_id}, auth: {authenticated})")
        return client_id
    
    async def disconnect_client(self, client_id: str, reason: str = "normal"):
        """Disconnect client and clean up subscriptions"""
        if client_id not in self.connections:
            return
            
        connection = self.connections[client_id]
        
        # Remove from all rooms
        for room_id in list(connection.subscriptions):
            self.subscription_manager.unsubscribe_from_room(room_id, client_id)
        
        # Remove connection
        del self.connections[client_id]
        
        logger.info(f"Client disconnected: {client_id} (reason: {reason})")
    
    async def send_message(
        self,
        client_id: str,
        message_type: MessageType,
        data: Any = None,
        error: Optional[str] = None
    ):
        """Send message to specific client"""
        if client_id not in self.connections:
            return False
            
        connection = self.connections[client_id]
        
        message = {
            "type": message_type.value,
            "timestamp": datetime.now().isoformat(),
            "client_id": client_id
        }
        
        if data is not None:
            message["data"] = data
        if error:
            message["error"] = error
            message["status"] = "error"
        else:
            message["status"] = "success"
        
        try:
            await connection.websocket.send_text(json.dumps(message))
            return True
        except Exception as e:
            logger.error(f"Failed to send message to {client_id}: {e}")
            await self.disconnect_client(client_id, "send_error")
            return False
    
    async def send_ping(self, client_id: str):
        """Send ping to client"""
        await self.send_message(client_id, MessageType.PING, {
            "server_time": datetime.now().isoformat()
        })
    
    async def handle_pong(self, client_id: str):
        """Handle pong from client"""
        if client_id in self.connections:
            self.connections[client_id].last_heartbeat = datetime.now()
    
    async def subscribe_client(
        self,
        client_id: str,
        subscription_type: SubscriptionType,
        filters: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Subscribe client to a room"""
        if client_id not in self.connections:
            return False
        
        # Create or find room
        room_id = self.subscription_manager.create_room(subscription_type, filters)
        
        # Subscribe client
        success = self.subscription_manager.subscribe_to_room(room_id, client_id)
        
        if success:
            self.connections[client_id].subscriptions.add(room_id)
            
            await self.send_message(client_id, MessageType.SUBSCRIPTION_CONFIRMED, {
                "subscription_type": subscription_type.value,
                "room_id": room_id,
                "filters": filters or {}
            })
        
        return success
    
    async def unsubscribe_client(
        self,
        client_id: str,
        subscription_type: SubscriptionType,
        filters: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Unsubscribe client from a room"""
        if client_id not in self.connections:
            return False
        
        # Find room
        room_id = self.subscription_manager._generate_room_id(subscription_type, filters or {})
        
        if room_id not in self.subscription_manager.rooms:
            return False
        
        # Unsubscribe client
        success = self.subscription_manager.unsubscribe_from_room(room_id, client_id)
        
        if success:
            self.connections[client_id].subscriptions.discard(room_id)
            
            await self.send_message(client_id, MessageType.SUBSCRIPTION_REMOVED, {
                "subscription_type": subscription_type.value,
                "room_id": room_id,
                "filters": filters or {}
            })
        
        return success
    
    async def broadcast_to_room(
        self,
        subscription_type: SubscriptionType,
        message_type: MessageType,
        data: Dict[str, Any],
        filters: Optional[Dict[str, Any]] = None
    ):
        """Broadcast message to all clients in matching rooms"""
        # Find matching rooms
        matching_rooms = self.subscription_manager.find_matching_rooms(
            subscription_type, data
        )
        
        if not matching_rooms:
            return
        
        # Get all subscribers
        all_subscribers = set()
        for room_id in matching_rooms:
            subscribers = self.subscription_manager.get_room_subscribers(room_id)
            all_subscribers.update(subscribers)
        
        # Send to all subscribers
        failed_clients = []
        for client_id in all_subscribers:
            success = await self.send_message(client_id, message_type, data)
            if not success:
                failed_clients.append(client_id)
        
        # Clean up failed clients
        for client_id in failed_clients:
            await self.disconnect_client(client_id, "broadcast_error")
        
        logger.debug(f"Broadcasted to {len(all_subscribers)} clients in {len(matching_rooms)} rooms")
    
    async def handle_client_message(self, client_id: str, message: Dict[str, Any]):
        """Handle incoming client message"""
        message_type = message.get("type")
        
        if message_type == MessageType.PING.value:
            await self.send_message(client_id, MessageType.PONG)
            
        elif message_type == MessageType.PONG.value:
            await self.handle_pong(client_id)
            
        elif message_type == MessageType.SUBSCRIBE.value:
            sub_type = message.get("subscription_type")
            filters = message.get("filters", {})
            
            try:
                subscription_type = SubscriptionType(sub_type)
                await self.subscribe_client(client_id, subscription_type, filters)
            except ValueError:
                await self.send_message(
                    client_id, 
                    MessageType.ERROR, 
                    error=f"Invalid subscription type: {sub_type}"
                )
                
        elif message_type == MessageType.UNSUBSCRIBE.value:
            sub_type = message.get("subscription_type")
            filters = message.get("filters", {})
            
            try:
                subscription_type = SubscriptionType(sub_type)
                await self.unsubscribe_client(client_id, subscription_type, filters)
            except ValueError:
                await self.send_message(
                    client_id,
                    MessageType.ERROR,
                    error=f"Invalid subscription type: {sub_type}"
                )
                
        elif message_type == MessageType.STATUS.value:
            await self.send_status(client_id)
    
    async def send_status(self, client_id: str):
        """Send status information to client"""
        if client_id not in self.connections:
            return
            
        connection = self.connections[client_id]
        
        status_data = {
            "connection": {
                "client_id": client_id,
                "user_id": connection.user_id,
                "authenticated": connection.authenticated,
                "connected_at": connection.connected_at.isoformat(),
                "subscriptions": list(connection.subscriptions)
            },
            "server": {
                "active_connections": len(self.connections),
                "active_rooms": len(self.subscription_manager.rooms),
                "server_time": datetime.now().isoformat()
            }
        }
        
        await self.send_message(client_id, MessageType.STATUS, status_data)
    
    async def shutdown(self):
        """Shutdown connection manager"""
        await self.heartbeat_manager.stop()
        
        # Close all connections
        for client_id in list(self.connections.keys()):
            await self.disconnect_client(client_id, "server_shutdown")
        
        if self.redis_client:
            await self.redis_client.close()
        
        logger.info("Enhanced connection manager shut down")


class EnhancedWebSocketService:
    """Main enhanced WebSocket service"""
    
    def __init__(self):
        self.connection_manager = EnhancedConnectionManager()
        self.is_initialized = False
        
    async def initialize(self):
        """Initialize the service"""
        try:
            await self.connection_manager.initialize()
            self.is_initialized = True
            logger.info("Enhanced WebSocket service initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize enhanced WebSocket service: {e}")
    
    async def handle_connection(
        self,
        websocket: WebSocket,
        token: Optional[str] = None
    ):
        """Handle new WebSocket connection"""
        client_id = None
        
        try:
            # Authenticate and connect
            client_id = await self.connection_manager.authenticate_and_connect(
                websocket, token
            )
            
            # Handle messages
            while True:
                try:
                    data = await websocket.receive_text()
                    message = json.loads(data)
                    await self.connection_manager.handle_client_message(
                        client_id, message
                    )
                    
                except WebSocketDisconnect:
                    break
                except json.JSONDecodeError:
                    await self.connection_manager.send_message(
                        client_id,
                        MessageType.ERROR,
                        error="Invalid JSON format"
                    )
                except Exception as e:
                    logger.error(f"Error handling message from {client_id}: {e}")
                    
        except WebSocketDisconnect:
            pass
        except Exception as e:
            logger.error(f"Error in WebSocket connection: {e}")
        finally:
            if client_id:
                await self.connection_manager.disconnect_client(client_id)
    
    # Data broadcasting methods
    async def broadcast_odds_update(self, odds_data: Dict[str, Any]):
        """Broadcast odds update"""
        await self.connection_manager.broadcast_to_room(
            SubscriptionType.ODDS_UPDATES,
            MessageType.ODDS_UPDATE,
            odds_data
        )
    
    async def broadcast_prediction_update(self, prediction_data: Dict[str, Any]):
        """Broadcast prediction update"""
        await self.connection_manager.broadcast_to_room(
            SubscriptionType.PREDICTIONS,
            MessageType.PREDICTION_UPDATE,
            prediction_data
        )
    
    async def broadcast_arbitrage_alert(self, arbitrage_data: Dict[str, Any]):
        """Broadcast arbitrage alert"""
        await self.connection_manager.broadcast_to_room(
            SubscriptionType.ARBITRAGE,
            MessageType.ARBITRAGE_ALERT,
            arbitrage_data
        )
    
    async def broadcast_sport_update(
        self,
        sport: str,
        message_type: MessageType,
        data: Dict[str, Any]
    ):
        """Broadcast sport-specific update"""
        sport_subscription = SubscriptionType(sport.lower())
        await self.connection_manager.broadcast_to_room(
            sport_subscription,
            message_type,
            {**data, "sport": sport}
        )
    
    async def send_portfolio_update(
        self,
        user_id: str,
        portfolio_data: Dict[str, Any]
    ):
        """Send portfolio update to specific user"""
        # Find user's connections
        for client_id, connection in self.connection_manager.connections.items():
            if connection.user_id == user_id:
                await self.connection_manager.send_message(
                    client_id,
                    MessageType.PORTFOLIO_UPDATE,
                    portfolio_data
                )
    
    async def shutdown(self):
        """Shutdown the service"""
        await self.connection_manager.shutdown()
        self.is_initialized = False


# Global service instance
enhanced_websocket_service = EnhancedWebSocketService()
