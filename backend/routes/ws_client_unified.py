"""
Unified WebSocket Client Route - Consistent Namespace
Proposes standardized WebSocket endpoint with proper message schema.
"""

import json
import logging
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, Optional, Union

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field, validator

# Initialize logger
logger = logging.getLogger(__name__)

# Create router
router = APIRouter()


class MessageType(str, Enum):
    """WebSocket message types"""
    
    # Connection management
    CONNECT = "connect"
    DISCONNECT = "disconnect"
    HEARTBEAT = "heartbeat"
    
    # Data updates
    PROPS_UPDATE = "props.update"
    ODDS_UPDATE = "odds.update"
    ARBITRAGE_UPDATE = "arbitrage.update"
    
    # User interactions
    BET_PLACED = "bet.placed"
    BET_UPDATED = "bet.updated"
    BET_CANCELLED = "bet.cancelled"
    
    # System events
    ERROR = "error"
    AUTH_REQUIRED = "auth.required"
    TOKEN_REFRESH = "token.refresh"
    
    # Sport-specific
    GAME_UPDATE = "game.update"
    PLAYER_UPDATE = "player.update"
    INJURY_UPDATE = "injury.update"


class WebSocketMessage(BaseModel):
    """
    Standardized WebSocket message schema
    
    Fields:
        type: Message type from MessageType enum
        timestamp: ISO timestamp when message was created
        payload: Message-specific data
        version: Protocol version for compatibility
        correlation_id: Optional ID for request/response correlation
        client_id: Optional client identifier
    """
    
    type: MessageType = Field(..., description="Message type")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), 
                               description="Message timestamp")
    payload: Dict[str, Any] = Field(default_factory=dict, description="Message payload")
    version: str = Field(default="1.0", description="Protocol version")
    correlation_id: Optional[str] = Field(None, description="Correlation ID")
    client_id: Optional[str] = Field(None, description="Client identifier")
    
    @validator('timestamp', pre=True, always=True)
    def set_timestamp(cls, v):
        if v is None:
            return datetime.now(timezone.utc)
        if isinstance(v, str):
            return datetime.fromisoformat(v.replace('Z', '+00:00'))
        return v
    
    class Config:
        json_encoders = {
            datetime: lambda dt: dt.isoformat()
        }


class ConnectionInfo(BaseModel):
    """Client connection information"""
    
    client_id: str
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    subscriptions: list[str] = Field(default_factory=list)
    connected_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_heartbeat: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# Connection manager
class WebSocketManager:
    """Manages WebSocket connections with proper cleanup"""
    
    def __init__(self):
        self.connections: Dict[str, WebSocket] = {}
        self.connection_info: Dict[str, ConnectionInfo] = {}
    
    async def connect(self, websocket: WebSocket, client_id: str, user_id: Optional[str] = None):
        """Add new connection"""
        await websocket.accept()
        self.connections[client_id] = websocket
        self.connection_info[client_id] = ConnectionInfo(
            client_id=client_id,
            user_id=user_id
        )
        
        # Send connection confirmation
        message = WebSocketMessage(
            type=MessageType.CONNECT,
            client_id=client_id,
            payload={"status": "connected", "client_id": client_id}
        )
        await self.send_message(client_id, message)
        
        logger.info(f"WebSocket client {client_id} connected")
    
    async def disconnect(self, client_id: str):
        """Remove connection"""
        if client_id in self.connections:
            del self.connections[client_id]
        if client_id in self.connection_info:
            del self.connection_info[client_id]
        logger.info(f"WebSocket client {client_id} disconnected")
    
    async def send_message(self, client_id: str, message: WebSocketMessage):
        """Send message to specific client"""
        if client_id in self.connections:
            try:
                websocket = self.connections[client_id]
                await websocket.send_text(message.json())
            except Exception as e:
                logger.error(f"Failed to send message to {client_id}: {e}")
                await self.disconnect(client_id)
    
    async def broadcast(self, message: WebSocketMessage, exclude: Optional[list[str]] = None):
        """Broadcast message to all connected clients"""
        exclude = exclude or []
        for client_id in list(self.connections.keys()):
            if client_id not in exclude:
                await self.send_message(client_id, message)
    
    async def send_to_subscription(self, subscription: str, message: WebSocketMessage):
        """Send message to clients subscribed to specific topic"""
        for client_id, info in self.connection_info.items():
            if subscription in info.subscriptions:
                await self.send_message(client_id, message)


# Global connection manager
ws_manager = WebSocketManager()


@router.websocket("/ws/client")
async def websocket_client_endpoint(
    websocket: WebSocket,
    client_id: str = Query(..., description="Unique client identifier"),
    user_id: Optional[str] = Query(None, description="User identifier for authentication"),
    subscriptions: Optional[str] = Query(None, description="Comma-separated subscription topics")
):
    """
    Unified WebSocket client endpoint with consistent namespace: /ws/client
    
    Query Parameters:
        client_id: Required unique client identifier
        user_id: Optional user ID for authentication context
        subscriptions: Optional comma-separated list of topics to subscribe to
    
    Message Format:
        All messages follow WebSocketMessage schema with type, timestamp, payload, version
    
    Example Connection:
        ws://localhost:8000/ws/client?client_id=abc123&user_id=user456&subscriptions=props,odds
    """
    
    await ws_manager.connect(websocket, client_id, user_id)
    
    # Handle subscriptions
    if subscriptions:
        topics = [s.strip() for s in subscriptions.split(',')]
        ws_manager.connection_info[client_id].subscriptions = topics
        
        # Send subscription confirmation
        message = WebSocketMessage(
            type=MessageType.CONNECT,
            client_id=client_id,
            payload={"subscriptions": topics, "status": "subscribed"}
        )
        await ws_manager.send_message(client_id, message)
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            
            try:
                # Parse incoming message
                message_data = json.loads(data)
                incoming_message = WebSocketMessage(**message_data)
                
                # Update heartbeat
                if client_id in ws_manager.connection_info:
                    ws_manager.connection_info[client_id].last_heartbeat = datetime.now(timezone.utc)
                
                # Handle different message types
                await handle_client_message(client_id, incoming_message)
                
            except json.JSONDecodeError:
                # Send error for invalid JSON
                error_message = WebSocketMessage(
                    type=MessageType.ERROR,
                    client_id=client_id,
                    payload={"error": "Invalid JSON format"}
                )
                await ws_manager.send_message(client_id, error_message)
                
            except Exception as e:
                # Send error for invalid message format
                error_message = WebSocketMessage(
                    type=MessageType.ERROR,
                    client_id=client_id,
                    payload={"error": f"Invalid message format: {str(e)}"}
                )
                await ws_manager.send_message(client_id, error_message)
                
    except WebSocketDisconnect:
        logger.info(f"WebSocket client {client_id} disconnected")
    except Exception as e:
        logger.error(f"WebSocket error for client {client_id}: {e}")
    finally:
        await ws_manager.disconnect(client_id)


async def handle_client_message(client_id: str, message: WebSocketMessage):
    """Handle incoming messages from clients"""
    
    logger.info(f"Received {message.type} from client {client_id}")
    
    if message.type == MessageType.HEARTBEAT:
        # Respond to heartbeat
        response = WebSocketMessage(
            type=MessageType.HEARTBEAT,
            client_id=client_id,
            payload={"status": "alive"},
            correlation_id=message.correlation_id
        )
        await ws_manager.send_message(client_id, response)
        
    elif message.type == MessageType.BET_PLACED:
        # Handle bet placement
        response = WebSocketMessage(
            type=MessageType.BET_UPDATED,
            client_id=client_id,
            payload={"bet_id": "mock_bet_123", "status": "confirmed"},
            correlation_id=message.correlation_id
        )
        await ws_manager.send_message(client_id, response)
        
    # Add more message type handlers as needed


# Health check endpoint for WebSocket service
@router.get("/ws/health")
async def websocket_health():
    """WebSocket service health check"""
    
    active_connections = len(ws_manager.connections)
    total_subscriptions = sum(len(info.subscriptions) for info in ws_manager.connection_info.values())
    
    return {
        "status": "healthy",
        "service": "websocket",
        "active_connections": active_connections,
        "total_subscriptions": total_subscriptions,
        "protocol_version": "1.0",
        "supported_message_types": [mt.value for mt in MessageType],
        "endpoints": {
            "client": "/ws/client",
            "health": "/ws/health"
        }
    }


# Utility functions for sending system messages
async def send_props_update(props_data: Dict[str, Any]):
    """Send props update to all subscribed clients"""
    message = WebSocketMessage(
        type=MessageType.PROPS_UPDATE,
        payload=props_data
    )
    await ws_manager.send_to_subscription("props", message)


async def send_odds_update(odds_data: Dict[str, Any]):
    """Send odds update to all subscribed clients"""
    message = WebSocketMessage(
        type=MessageType.ODDS_UPDATE,
        payload=odds_data
    )
    await ws_manager.send_to_subscription("odds", message)


async def send_system_error(error_message: str, client_id: Optional[str] = None):
    """Send system error message"""
    message = WebSocketMessage(
        type=MessageType.ERROR,
        payload={"error": error_message, "source": "system"}
    )
    
    if client_id:
        await ws_manager.send_message(client_id, message)
    else:
        await ws_manager.broadcast(message)