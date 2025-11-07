"""
WebSocket Connection Registry (PR11)

Manages active WebSocket connections for broadcasting and connection lifecycle tracking.
Thread-safe registry with support for connection metadata and broadcasting capabilities.
"""

import logging
import threading
import time
from typing import Dict, List, Set, Optional, Any, Callable
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from fastapi import WebSocket
from fastapi.websockets import WebSocketState

from .ws_sender import send_enveloped
from ..observability.event_bus import get_event_bus

logger = logging.getLogger(__name__)


@dataclass
class ConnectionMetadata:
    """Metadata for a WebSocket connection"""
    connection_id: str
    client_id: Optional[str]
    connect_time: float
    last_activity: float
    client_host: Optional[str]
    user_agent: Optional[str] = None
    version: int = 1
    role: str = "frontend"
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        result = asdict(self)
        result["connect_time_iso"] = datetime.fromtimestamp(self.connect_time, tz=timezone.utc).isoformat()
        result["last_activity_iso"] = datetime.fromtimestamp(self.last_activity, tz=timezone.utc).isoformat()
        result["uptime_seconds"] = time.time() - self.connect_time
        return result


class WSConnectionRegistry:
    """
    Thread-safe registry for managing active WebSocket connections.
    
    Features:
    - Connection lifecycle management
    - Metadata tracking per connection
    - Broadcasting to all or filtered connections
    - Connection health monitoring
    - Statistics and diagnostics
    """
    
    def __init__(self):
        """Initialize the connection registry"""
        self._connections: Dict[str, WebSocket] = {}
        self._metadata: Dict[str, ConnectionMetadata] = {}
        self._client_to_connection: Dict[str, str] = {}  # client_id -> connection_id mapping
        self._lock = threading.RLock()
        
        # Statistics
        self._stats = {
            "total_connections": 0,
            "total_disconnections": 0,
            "broadcasts_sent": 0,
            "last_broadcast": None
        }
        
        logger.info("WebSocket Connection Registry initialized")
    
    def add_connection(
        self,
        websocket: WebSocket,
        connection_id: str,
        client_id: Optional[str] = None,
        version: int = 1,
        role: str = "frontend"
    ) -> bool:
        """
        Add a new WebSocket connection to the registry.
        
        Args:
            websocket: WebSocket connection instance
            connection_id: Unique identifier for the connection
            client_id: Optional client identifier
            version: WebSocket protocol version
            role: Client role (frontend, admin, test)
            
        Returns:
            True if connection was added successfully, False otherwise
        """
        try:
            with self._lock:
                # Check if connection already exists
                if connection_id in self._connections:
                    logger.warning(f"Connection {connection_id} already exists in registry")
                    return False
                
                # Get client information
                client_host = getattr(websocket.client, "host", None) if websocket.client else None
                
                # Create metadata
                current_time = time.time()
                metadata = ConnectionMetadata(
                    connection_id=connection_id,
                    client_id=client_id,
                    connect_time=current_time,
                    last_activity=current_time,
                    client_host=client_host,
                    version=version,
                    role=role
                )
                
                # Store connection and metadata
                self._connections[connection_id] = websocket
                self._metadata[connection_id] = metadata
                
                # Update client mapping if client_id provided
                if client_id:
                    self._client_to_connection[client_id] = connection_id
                
                # Update statistics
                self._stats["total_connections"] += 1
                
                logger.info(
                    f"WebSocket connection added: {connection_id} "
                    f"(client_id: {client_id}, host: {client_host}, role: {role})"
                )
                
                # Publish connection event to event bus
                event_bus = get_event_bus()
                event_bus.publish(
                    event_type="ws.message.out",
                    data={
                        "type": "connection_added",
                        "connection_id": connection_id,
                        "client_id": client_id,
                        "client_host": client_host,
                        "version": version,
                        "role": role
                    }
                )
                
                return True
                
        except Exception as e:
            logger.error(f"Failed to add connection {connection_id}: {e}")
            return False
    
    def remove_connection(self, connection_id: str) -> bool:
        """
        Remove a WebSocket connection from the registry.
        
        Args:
            connection_id: Connection identifier to remove
            
        Returns:
            True if connection was removed, False if not found
        """
        try:
            with self._lock:
                if connection_id not in self._connections:
                    logger.warning(f"Connection {connection_id} not found in registry")
                    return False
                
                # Get metadata before removal
                metadata = self._metadata.get(connection_id)
                client_id = metadata.client_id if metadata else None
                
                # Remove from mappings
                del self._connections[connection_id]
                del self._metadata[connection_id]
                
                # Remove client mapping if exists
                if client_id and client_id in self._client_to_connection:
                    del self._client_to_connection[client_id]
                
                # Update statistics
                self._stats["total_disconnections"] += 1
                
                logger.info(f"WebSocket connection removed: {connection_id} (client_id: {client_id})")
                
                # Publish disconnection event to event bus
                event_bus = get_event_bus()
                event_bus.publish(
                    event_type="ws.message.out",
                    data={
                        "type": "connection_removed",
                        "connection_id": connection_id,
                        "client_id": client_id,
                        "uptime_seconds": time.time() - metadata.connect_time if metadata else None
                    }
                )
                
                return True
                
        except Exception as e:
            logger.error(f"Failed to remove connection {connection_id}: {e}")
            return False
    
    def update_activity(self, connection_id: str) -> None:
        """
        Update the last activity timestamp for a connection.
        
        Args:
            connection_id: Connection to update
        """
        try:
            with self._lock:
                if connection_id in self._metadata:
                    self._metadata[connection_id].last_activity = time.time()
        except Exception as e:
            logger.error(f"Failed to update activity for {connection_id}: {e}")
    
    def get_connection(self, connection_id: str) -> Optional[WebSocket]:
        """
        Get WebSocket connection by ID.
        
        Args:
            connection_id: Connection identifier
            
        Returns:
            WebSocket instance if found, None otherwise
        """
        with self._lock:
            return self._connections.get(connection_id)
    
    def get_connection_by_client(self, client_id: str) -> Optional[WebSocket]:
        """
        Get WebSocket connection by client ID.
        
        Args:
            client_id: Client identifier
            
        Returns:
            WebSocket instance if found, None otherwise
        """
        with self._lock:
            connection_id = self._client_to_connection.get(client_id)
            if connection_id:
                return self._connections.get(connection_id)
            return None
    
    def get_all_connections(self) -> List[WebSocket]:
        """
        Get all active WebSocket connections.
        
        Returns:
            List of WebSocket instances
        """
        with self._lock:
            return list(self._connections.values())
    
    def get_connections_by_role(self, role: str) -> List[WebSocket]:
        """
        Get all connections with a specific role.
        
        Args:
            role: Role to filter by (frontend, admin, test)
            
        Returns:
            List of matching WebSocket instances
        """
        try:
            with self._lock:
                matching_connections = []
                for connection_id, metadata in self._metadata.items():
                    if metadata.role == role:
                        websocket = self._connections.get(connection_id)
                        if websocket:
                            matching_connections.append(websocket)
                return matching_connections
        except Exception as e:
            logger.error(f"Failed to get connections by role {role}: {e}")
            return []
    
    def get_connection_metadata(self, connection_id: str) -> Optional[ConnectionMetadata]:
        """
        Get metadata for a connection.
        
        Args:
            connection_id: Connection identifier
            
        Returns:
            ConnectionMetadata if found, None otherwise
        """
        with self._lock:
            return self._metadata.get(connection_id)
    
    def get_all_metadata(self) -> List[Dict[str, Any]]:
        """
        Get metadata for all connections.
        
        Returns:
            List of connection metadata dictionaries
        """
        with self._lock:
            return [metadata.to_dict() for metadata in self._metadata.values()]
    
    def cleanup_stale_connections(self, timeout_seconds: int = 300) -> int:
        """
        Remove connections that haven't been active for a specified time.
        
        Args:
            timeout_seconds: Inactivity timeout in seconds (default: 5 minutes)
            
        Returns:
            Number of connections cleaned up
        """
        try:
            stale_connections = []
            current_time = time.time()
            
            with self._lock:
                for connection_id, metadata in self._metadata.items():
                    if current_time - metadata.last_activity > timeout_seconds:
                        websocket = self._connections.get(connection_id)
                        # Check if WebSocket is actually closed
                        if websocket and websocket.client_state != WebSocketState.CONNECTED:
                            stale_connections.append(connection_id)
                
                # Remove stale connections
                for connection_id in stale_connections:
                    self.remove_connection(connection_id)
                
                if stale_connections:
                    logger.info(f"Cleaned up {len(stale_connections)} stale WebSocket connections")
                
                return len(stale_connections)
                
        except Exception as e:
            logger.error(f"Failed to cleanup stale connections: {e}")
            return 0
    
    async def broadcast_to_all(
        self,
        msg_type: str,
        payload: Dict[str, Any],
        *,
        request_id: Optional[str] = None,
        span: Optional[str] = None
    ) -> int:
        """
        Broadcast a message to all active connections.
        
        Args:
            msg_type: Message type
            payload: Message payload
            request_id: Optional request ID for correlation
            span: Optional trace span ID
            
        Returns:
            Number of connections the message was successfully sent to
        """
        return await self._broadcast_filtered(
            msg_type=msg_type,
            payload=payload,
            filter_func=None,
            request_id=request_id,
            span=span
        )
    
    async def broadcast_to_role(
        self,
        role: str,
        msg_type: str,
        payload: Dict[str, Any],
        *,
        request_id: Optional[str] = None,
        span: Optional[str] = None
    ) -> int:
        """
        Broadcast a message to all connections with a specific role.
        
        Args:
            role: Role to broadcast to
            msg_type: Message type
            payload: Message payload
            request_id: Optional request ID for correlation
            span: Optional trace span ID
            
        Returns:
            Number of connections the message was successfully sent to
        """
        def role_filter(metadata: ConnectionMetadata) -> bool:
            return metadata.role == role
        
        return await self._broadcast_filtered(
            msg_type=msg_type,
            payload=payload,
            filter_func=role_filter,
            request_id=request_id,
            span=span
        )
    
    async def _broadcast_filtered(
        self,
        msg_type: str,
        payload: Dict[str, Any],
        filter_func: Optional[Callable[[ConnectionMetadata], bool]] = None,
        *,
        request_id: Optional[str] = None,
        span: Optional[str] = None
    ) -> int:
        """
        Internal method for broadcasting with optional filtering.
        
        Args:
            msg_type: Message type
            payload: Message payload
            filter_func: Optional function to filter connections
            request_id: Optional request ID for correlation
            span: Optional trace span ID
            
        Returns:
            Number of connections the message was successfully sent to
        """
        try:
            connections_to_broadcast = []
            
            with self._lock:
                for connection_id, websocket in self._connections.items():
                    metadata = self._metadata.get(connection_id)
                    
                    # Apply filter if provided
                    if filter_func and metadata and not filter_func(metadata):
                        continue
                    
                    # Check connection state
                    if websocket.client_state == WebSocketState.CONNECTED:
                        connections_to_broadcast.append((connection_id, websocket))
            
            # Send to each connection (outside the lock to avoid blocking)
            successful_sends = 0
            for connection_id, websocket in connections_to_broadcast:
                try:
                    success = await send_enveloped(
                        websocket=websocket,
                        msg_type=msg_type,
                        payload=payload,
                        request_id=request_id,
                        span=span
                    )
                    if success:
                        successful_sends += 1
                        # Update activity timestamp
                        self.update_activity(connection_id)
                    else:
                        logger.warning(f"Failed to broadcast to connection {connection_id}")
                        
                except Exception as e:
                    logger.error(f"Error broadcasting to connection {connection_id}: {e}")
            
            # Update broadcast statistics
            with self._lock:
                self._stats["broadcasts_sent"] += 1
                self._stats["last_broadcast"] = time.time()
            
            logger.debug(f"Broadcast {msg_type} sent to {successful_sends}/{len(connections_to_broadcast)} connections")
            return successful_sends
            
        except Exception as e:
            logger.error(f"Failed to broadcast message {msg_type}: {e}")
            return 0
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Get connection registry statistics.
        
        Returns:
            Dictionary containing registry statistics
        """
        with self._lock:
            return {
                **self._stats.copy(),
                "active_connections": len(self._connections),
                "connections_by_role": self._get_role_breakdown(),
                "average_uptime": self._get_average_uptime(),
                "last_broadcast_iso": datetime.fromtimestamp(
                    self._stats["last_broadcast"], tz=timezone.utc
                ).isoformat() if self._stats["last_broadcast"] else None
            }
    
    def _get_role_breakdown(self) -> Dict[str, int]:
        """Get breakdown of connections by role"""
        breakdown = {}
        for metadata in self._metadata.values():
            role = metadata.role
            breakdown[role] = breakdown.get(role, 0) + 1
        return breakdown
    
    def _get_average_uptime(self) -> float:
        """Get average uptime of active connections in seconds"""
        if not self._metadata:
            return 0.0
        
        current_time = time.time()
        total_uptime = sum(current_time - metadata.connect_time for metadata in self._metadata.values())
        return total_uptime / len(self._metadata)


# Global connection registry instance (singleton pattern)
_connection_registry_instance: Optional[WSConnectionRegistry] = None
_registry_lock = threading.Lock()


def get_connection_registry() -> WSConnectionRegistry:
    """
    Get the global connection registry instance (singleton).
    
    Returns:
        WSConnectionRegistry instance
    """
    global _connection_registry_instance
    
    if _connection_registry_instance is None:
        with _registry_lock:
            # Double-check pattern
            if _connection_registry_instance is None:
                _connection_registry_instance = WSConnectionRegistry()
    
    return _connection_registry_instance


# Convenience functions
async def broadcast_to_all_connections(msg_type: str, payload: Dict[str, Any], 
                                     request_id: Optional[str] = None) -> int:
    """Broadcast message to all connections using global registry"""
    return await get_connection_registry().broadcast_to_all(msg_type, payload, request_id=request_id)


async def broadcast_to_frontend_connections(msg_type: str, payload: Dict[str, Any],
                                          request_id: Optional[str] = None) -> int:
    """Broadcast message to frontend connections using global registry"""
    return await get_connection_registry().broadcast_to_role("frontend", msg_type, payload, request_id=request_id)


def get_active_connection_count() -> int:
    """Get count of active connections using global registry"""
    return len(get_connection_registry().get_all_connections())


def get_registry_stats() -> Dict[str, Any]:
    """Get connection registry statistics using global registry"""
    return get_connection_registry().get_stats()


# Module-level registry instance
connection_registry = get_connection_registry()