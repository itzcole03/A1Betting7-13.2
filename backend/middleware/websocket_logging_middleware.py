"""
WebSocket Logging Middleware

Provides structured logging for WebSocket handshake requests, connection tracking,
and detailed client information capture for debugging and monitoring.
"""

import asyncio
import json
import time
import uuid
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Any, Dict, List, Optional, Set
from urllib.parse import parse_qs, urlparse

from fastapi import WebSocket, WebSocketDisconnect
from starlette.websockets import WebSocketState

from backend.services.unified_logging import (
    LogComponent,
    LogContext,
    unified_logger,
    track_operation
)


class WebSocketConnectionInfo:
    """Detailed WebSocket connection information"""
    
    def __init__(self, websocket: WebSocket, connection_id: str):
        self.connection_id = connection_id
        self.websocket = websocket
        self.connected_at = datetime.utcnow()
        self.disconnected_at: Optional[datetime] = None
        self.client_ip = self._extract_client_ip()
        self.user_agent = self._extract_user_agent()
        self.query_params = self._extract_query_params()
        self.path = websocket.url.path
        self.scheme = websocket.url.scheme
        self.host = websocket.url.hostname
        self.port = websocket.url.port
        self.headers = dict(websocket.headers) if hasattr(websocket, 'headers') else {}
        
        # Connection metrics
        self.bytes_sent = 0
        self.bytes_received = 0
        self.messages_sent = 0
        self.messages_received = 0
        self.last_activity = self.connected_at
        self.handshake_duration_ms = 0.0
        self.connection_duration_ms = 0.0
        
        # Authentication info
        self.authenticated = False
        self.user_id: Optional[str] = None
        self.token_info: Optional[Dict[str, Any]] = None
        
        # Subscription info
        self.subscriptions: Set[str] = set()
        self.subscription_history: List[Dict[str, Any]] = []
        
        # Error tracking
        self.error_count = 0
        self.last_error: Optional[str] = None
        self.disconnect_reason: Optional[str] = None
        
    def _extract_client_ip(self) -> str:
        """Extract client IP address from WebSocket connection"""
        try:
            # Try various headers for real IP
            if hasattr(self.websocket, 'headers'):
                headers = dict(self.websocket.headers)
                
                # Check forwarded headers (common in reverse proxy setups)
                for header in ['x-forwarded-for', 'x-real-ip', 'cf-connecting-ip']:
                    if header in headers:
                        ip = headers[header].split(',')[0].strip()
                        if ip:
                            return ip
                            
            # Fallback to client address
            if hasattr(self.websocket, 'client') and self.websocket.client:
                return str(self.websocket.client.host)
                
            return "unknown"
        except Exception:
            return "unknown"
    
    def _extract_user_agent(self) -> str:
        """Extract User-Agent from WebSocket headers"""
        try:
            if hasattr(self.websocket, 'headers'):
                headers = dict(self.websocket.headers)
                return headers.get('user-agent', 'unknown')
            return "unknown"
        except Exception:
            return "unknown"
    
    def _extract_query_params(self) -> Dict[str, List[str]]:
        """Extract query parameters from WebSocket URL"""
        try:
            if hasattr(self.websocket, 'url') and self.websocket.url.query:
                return parse_qs(self.websocket.url.query)
            return {}
        except Exception:
            return {}
    
    def update_last_activity(self):
        """Update last activity timestamp"""
        self.last_activity = datetime.utcnow()
    
    def record_message_sent(self, message_size: int = 0):
        """Record outbound message metrics"""
        self.messages_sent += 1
        self.bytes_sent += message_size
        self.update_last_activity()
    
    def record_message_received(self, message_size: int = 0):
        """Record inbound message metrics"""
        self.messages_received += 1
        self.bytes_received += message_size
        self.update_last_activity()
    
    def record_error(self, error_message: str):
        """Record connection error"""
        self.error_count += 1
        self.last_error = error_message
        self.update_last_activity()
    
    def add_subscription(self, subscription_type: str, filters: Optional[Dict[str, Any]] = None):
        """Add subscription to connection tracking"""
        self.subscriptions.add(subscription_type)
        self.subscription_history.append({
            'action': 'subscribe',
            'type': subscription_type,
            'filters': filters or {},
            'timestamp': datetime.utcnow().isoformat()
        })
        self.update_last_activity()
    
    def remove_subscription(self, subscription_type: str):
        """Remove subscription from connection tracking"""
        self.subscriptions.discard(subscription_type)
        self.subscription_history.append({
            'action': 'unsubscribe',
            'type': subscription_type,
            'timestamp': datetime.utcnow().isoformat()
        })
        self.update_last_activity()
    
    def mark_disconnected(self, reason: Optional[str] = None):
        """Mark connection as disconnected and calculate duration"""
        self.disconnected_at = datetime.utcnow()
        self.disconnect_reason = reason
        self.connection_duration_ms = (
            (self.disconnected_at - self.connected_at).total_seconds() * 1000
        )
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert connection info to dictionary for logging"""
        return {
            'connection_id': self.connection_id,
            'client_ip': self.client_ip,
            'user_agent': self.user_agent,
            'path': self.path,
            'scheme': self.scheme,
            'host': self.host,
            'port': self.port,
            'query_params': self.query_params,
            'connected_at': self.connected_at.isoformat(),
            'disconnected_at': self.disconnected_at.isoformat() if self.disconnected_at else None,
            'handshake_duration_ms': self.handshake_duration_ms,
            'connection_duration_ms': self.connection_duration_ms,
            'authenticated': self.authenticated,
            'user_id': self.user_id,
            'subscriptions': list(self.subscriptions),
            'subscription_count': len(self.subscriptions),
            'messages_sent': self.messages_sent,
            'messages_received': self.messages_received,
            'bytes_sent': self.bytes_sent,
            'bytes_received': self.bytes_received,
            'error_count': self.error_count,
            'last_error': self.last_error,
            'disconnect_reason': self.disconnect_reason,
            'headers_count': len(self.headers)
        }


class WebSocketLoggingMiddleware:
    """
    WebSocket logging middleware for comprehensive connection tracking
    
    Provides:
    - Handshake request logging with timing
    - Connection lifecycle tracking
    - Message flow monitoring
    - Authentication status tracking
    - Subscription management logging
    - Performance metrics collection
    - Error and disconnect reason tracking
    """
    
    def __init__(self):
        self.active_connections: Dict[str, WebSocketConnectionInfo] = {}
        self.connection_history: List[WebSocketConnectionInfo] = []
        self.max_history_size = 1000  # Keep last 1000 connections
        self.logger = unified_logger
        
        # Connection metrics
        self.total_connections = 0
        self.successful_handshakes = 0
        self.failed_handshakes = 0
        self.total_messages_sent = 0
        self.total_messages_received = 0
        
    def generate_connection_id(self) -> str:
        """Generate unique connection ID"""
        return f"ws_{uuid.uuid4().hex[:12]}_{int(time.time())}"
    
    @asynccontextmanager
    async def track_connection(self, websocket: WebSocket, token: Optional[str] = None):
        """
        Context manager for tracking WebSocket connections
        
        Usage:
            async with websocket_logging.track_connection(websocket, token) as conn_info:
                # WebSocket handling logic
                await websocket.accept()
                # ... connection logic
        """
        connection_id = self.generate_connection_id()
        start_time = time.time()
        
        # Create connection info
        conn_info = WebSocketConnectionInfo(websocket, connection_id)
        self.active_connections[connection_id] = conn_info
        self.total_connections += 1
        
        # Log handshake start
        context = LogContext(
            component=LogComponent.API,
            operation="websocket_handshake_start",
            additional_data={
                'connection_id': connection_id,
                'client_ip': conn_info.client_ip,
                'path': conn_info.path,
                'user_agent': conn_info.user_agent,
                'query_params': conn_info.query_params,
                'has_token': bool(token)
            }
        )
        
        self.logger.info(
            f"WebSocket handshake initiated: {connection_id}",
            context
        )
        
        try:
            # Track handshake timing
            with track_operation("websocket_handshake", context) as tracker:
                yield conn_info
                
            # Handshake successful
            handshake_duration = (time.time() - start_time) * 1000
            conn_info.handshake_duration_ms = handshake_duration
            self.successful_handshakes += 1
            
            # Log successful handshake
            success_context = LogContext(
                component=LogComponent.API,
                operation="websocket_handshake_success",
                duration_ms=handshake_duration,
                additional_data=conn_info.to_dict()
            )
            
            self.logger.info(
                f"WebSocket handshake completed: {connection_id} ({handshake_duration:.2f}ms)",
                success_context
            )
            
        except WebSocketDisconnect as e:
            # Handle clean disconnection
            conn_info.mark_disconnected("client_disconnect")
            self._log_disconnection(conn_info, "Client disconnected normally")
            
        except Exception as e:
            # Handle handshake failure
            self.failed_handshakes += 1
            handshake_duration = (time.time() - start_time) * 1000
            conn_info.handshake_duration_ms = handshake_duration
            conn_info.record_error(str(e))
            conn_info.mark_disconnected("handshake_error")
            
            # Log handshake failure
            error_context = LogContext(
                component=LogComponent.API,
                operation="websocket_handshake_failed",
                duration_ms=handshake_duration,
                additional_data={
                    **conn_info.to_dict(),
                    'error_type': type(e).__name__,
                    'error_message': str(e)
                }
            )
            
            self.logger.error(
                f"WebSocket handshake failed: {connection_id} - {str(e)}",
                error_context,
                exc_info=True
            )
            
        finally:
            # Clean up and archive connection
            self._archive_connection(connection_id)
    
    def log_message_sent(self, connection_id: str, message: str, message_type: str = "text"):
        """Log outbound WebSocket message"""
        if connection_id in self.active_connections:
            conn_info = self.active_connections[connection_id]
            message_size = len(message.encode('utf-8')) if isinstance(message, str) else len(message)
            conn_info.record_message_sent(message_size)
            self.total_messages_sent += 1
            
            context = LogContext(
                component=LogComponent.API,
                operation="websocket_message_sent",
                additional_data={
                    'connection_id': connection_id,
                    'message_type': message_type,
                    'message_size': message_size,
                    'total_sent': conn_info.messages_sent
                }
            )
            
            self.logger.debug(
                f"WebSocket message sent: {connection_id} ({message_size} bytes)",
                context
            )
    
    def log_message_received(self, connection_id: str, message: str, message_type: str = "text"):
        """Log inbound WebSocket message"""
        if connection_id in self.active_connections:
            conn_info = self.active_connections[connection_id]
            message_size = len(message.encode('utf-8')) if isinstance(message, str) else len(message)
            conn_info.record_message_received(message_size)
            self.total_messages_received += 1
            
            context = LogContext(
                component=LogComponent.API,
                operation="websocket_message_received",
                additional_data={
                    'connection_id': connection_id,
                    'message_type': message_type,
                    'message_size': message_size,
                    'total_received': conn_info.messages_received,
                    'message_preview': message[:100] if isinstance(message, str) else "binary"
                }
            )
            
            self.logger.debug(
                f"WebSocket message received: {connection_id} ({message_size} bytes)",
                context
            )
    
    def log_authentication(self, connection_id: str, user_id: str, token_info: Optional[Dict[str, Any]] = None):
        """Log WebSocket authentication event"""
        if connection_id in self.active_connections:
            conn_info = self.active_connections[connection_id]
            conn_info.authenticated = True
            conn_info.user_id = user_id
            conn_info.token_info = token_info
            
            context = LogContext(
                component=LogComponent.AUTHENTICATION,
                operation="websocket_authentication",
                user_id=user_id,
                additional_data={
                    'connection_id': connection_id,
                    'client_ip': conn_info.client_ip,
                    'path': conn_info.path,
                    'token_info': {
                        'has_token': bool(token_info),
                        'token_type': token_info.get('type') if token_info else None,
                        'expires_at': token_info.get('exp') if token_info else None
                    } if token_info else {}
                }
            )
            
            self.logger.info(
                f"WebSocket authenticated: {connection_id} - user {user_id}",
                context
            )
    
    def log_subscription_change(self, connection_id: str, action: str, subscription_type: str, filters: Optional[Dict[str, Any]] = None):
        """Log WebSocket subscription changes"""
        if connection_id in self.active_connections:
            conn_info = self.active_connections[connection_id]
            
            if action == "subscribe":
                conn_info.add_subscription(subscription_type, filters)
            elif action == "unsubscribe":
                conn_info.remove_subscription(subscription_type)
            
            context = LogContext(
                component=LogComponent.BUSINESS_LOGIC,
                operation=f"websocket_subscription_{action}",
                user_id=conn_info.user_id,
                additional_data={
                    'connection_id': connection_id,
                    'subscription_type': subscription_type,
                    'filters': filters or {},
                    'total_subscriptions': len(conn_info.subscriptions),
                    'active_subscriptions': list(conn_info.subscriptions)
                }
            )
            
            self.logger.info(
                f"WebSocket {action}: {connection_id} - {subscription_type}",
                context
            )
    
    def log_error(self, connection_id: str, error: Exception, operation: str = "unknown"):
        """Log WebSocket error"""
        if connection_id in self.active_connections:
            conn_info = self.active_connections[connection_id]
            conn_info.record_error(str(error))
            
            context = LogContext(
                component=LogComponent.API,
                operation=f"websocket_error_{operation}",
                user_id=conn_info.user_id,
                additional_data={
                    'connection_id': connection_id,
                    'error_type': type(error).__name__,
                    'error_message': str(error),
                    'error_count': conn_info.error_count,
                    'client_ip': conn_info.client_ip,
                    'path': conn_info.path
                }
            )
            
            self.logger.error(
                f"WebSocket error: {connection_id} - {str(error)}",
                context,
                exc_info=True
            )
    
    def _log_disconnection(self, conn_info: WebSocketConnectionInfo, reason: str):
        """Log WebSocket disconnection"""
        context = LogContext(
            component=LogComponent.API,
            operation="websocket_disconnection",
            user_id=conn_info.user_id,
            duration_ms=conn_info.connection_duration_ms,
            additional_data={
                **conn_info.to_dict(),
                'disconnect_reason': reason
            }
        )
        
        self.logger.info(
            f"WebSocket disconnected: {conn_info.connection_id} - {reason} "
            f"(duration: {conn_info.connection_duration_ms:.2f}ms)",
            context
        )
    
    def _archive_connection(self, connection_id: str):
        """Archive connection info and clean up active connections"""
        if connection_id in self.active_connections:
            conn_info = self.active_connections.pop(connection_id)
            
            # Add to history
            self.connection_history.append(conn_info)
            
            # Limit history size
            if len(self.connection_history) > self.max_history_size:
                self.connection_history = self.connection_history[-self.max_history_size:]
    
    def get_connection_stats(self) -> Dict[str, Any]:
        """Get WebSocket connection statistics"""
        active_count = len(self.active_connections)
        authenticated_count = sum(1 for conn in self.active_connections.values() if conn.authenticated)
        
        # Calculate average connection duration from history
        recent_connections = self.connection_history[-100:]  # Last 100 connections
        avg_duration = 0.0
        if recent_connections:
            total_duration = sum(conn.connection_duration_ms for conn in recent_connections if conn.connection_duration_ms > 0)
            avg_duration = total_duration / len(recent_connections) if total_duration > 0 else 0.0
        
        return {
            'active_connections': active_count,
            'authenticated_connections': authenticated_count,
            'total_connections': self.total_connections,
            'successful_handshakes': self.successful_handshakes,
            'failed_handshakes': self.failed_handshakes,
            'handshake_success_rate': (
                (self.successful_handshakes / self.total_connections * 100)
                if self.total_connections > 0 else 0.0
            ),
            'total_messages_sent': self.total_messages_sent,
            'total_messages_received': self.total_messages_received,
            'avg_connection_duration_ms': avg_duration,
            'history_size': len(self.connection_history)
        }
    
    def get_active_connections_info(self) -> List[Dict[str, Any]]:
        """Get information about active connections"""
        return [conn.to_dict() for conn in self.active_connections.values()]


# Global middleware instance
websocket_logging_middleware = WebSocketLoggingMiddleware()


# Convenience functions
def track_websocket_connection(websocket: WebSocket, token: Optional[str] = None):
    """Create connection tracker context manager"""
    return websocket_logging_middleware.track_connection(websocket, token)


def log_websocket_message_sent(connection_id: str, message: str, message_type: str = "text"):
    """Log outbound WebSocket message"""
    websocket_logging_middleware.log_message_sent(connection_id, message, message_type)


def log_websocket_message_received(connection_id: str, message: str, message_type: str = "text"):
    """Log inbound WebSocket message"""
    websocket_logging_middleware.log_message_received(connection_id, message, message_type)


def log_websocket_authentication(connection_id: str, user_id: str, token_info: Optional[Dict[str, Any]] = None):
    """Log WebSocket authentication"""
    websocket_logging_middleware.log_authentication(connection_id, user_id, token_info)


def log_websocket_subscription(connection_id: str, action: str, subscription_type: str, filters: Optional[Dict[str, Any]] = None):
    """Log WebSocket subscription changes"""
    websocket_logging_middleware.log_subscription_change(connection_id, action, subscription_type, filters)


def log_websocket_error(connection_id: str, error: Exception, operation: str = "unknown"):
    """Log WebSocket error"""
    websocket_logging_middleware.log_error(connection_id, error, operation)


def get_websocket_stats() -> Dict[str, Any]:
    """Get WebSocket connection statistics"""
    return websocket_logging_middleware.get_connection_stats()


def get_active_websocket_connections() -> List[Dict[str, Any]]:
    """Get active WebSocket connections info"""
    return websocket_logging_middleware.get_active_connections_info()