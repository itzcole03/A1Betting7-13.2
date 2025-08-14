"""
Enhanced WebSocket Routes for Real-time Notifications
Integrates with the RealtimeNotificationService for comprehensive live updates
"""

import asyncio
import json
import logging
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query

# Contract compliance imports
from ..core.response_models import ResponseBuilder, StandardAPIResponse
from ..core.exceptions import BusinessLogicException, AuthenticationException
from fastapi.security import HTTPBearer
import jwt

from ..services.realtime_notification_service import (
    notification_service,

# WebSocket envelope pattern utilities

def create_websocket_envelope(
    message_type: str,
    data: Any = None,
    status: str = "success",
    error: str = None,
    timestamp: str = None
) -> Dict[str, Any]:
    """Create standardized WebSocket message envelope"""
    from datetime import datetime
    
    envelope = {
        "type": message_type,
        "status": status,
        "timestamp": timestamp or datetime.utcnow().isoformat()
    }
    
    if data is not None:
        envelope["data"] = data
    
    if error:
        envelope["error"] = error
        envelope["status"] = "error"
    
    return envelope

async def send_websocket_message(
    websocket: WebSocket,
    message_type: str,
    data: Any = None,
    status: str = "success",
    error: str = None
):
    """Send standardized WebSocket message"""
    envelope = create_websocket_envelope(message_type, data, status, error)
    await websocket.send_text(json.dumps(envelope))

    NotificationType,
    NotificationPriority,
    SubscriptionFilter,
    NotificationMessage
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ws", tags=["WebSocket"])
security = HTTPBearer(auto_error=False)

class WebSocketAuthManager:
    """Handle WebSocket authentication"""
    
    @staticmethod
    def extract_user_from_token(token: Optional[str]) -> Optional[str]:
        """Extract user ID from JWT token"""
        if not token:
            return None
        
        try:
            # Remove 'Bearer ' prefix if present
            if token.startswith('Bearer '):
                token = token[7:]
            
            # Decode JWT (you should use your actual secret key)
            payload = jwt.decode(token, options={"verify_signature": False})
            return ResponseBuilder.success(payload.get('user_id')) or payload.get('sub')
        except:
            return None

@router.websocket("/notifications")
async def websocket_notifications(
    websocket: WebSocket,
    token: Optional[str] = Query(None),
    notification_types: Optional[str] = Query(None),
    min_priority: Optional[int] = Query(1),
    sports: Optional[str] = Query(None),
    players: Optional[str] = Query(None)
):
    """
    WebSocket endpoint for real-time notifications
    
    Query Parameters:
    - token: JWT authentication token
    - notification_types: Comma-separated list of notification types
    - min_priority: Minimum priority level (1-4)
    - sports: Comma-separated list of sports to filter
    - players: Comma-separated list of player names to filter
    """
    await websocket.accept()
    
    # Extract user ID from token
    user_id = WebSocketAuthManager.extract_user_from_token(token)
    
    # Parse subscription filters
    filters = []
    if notification_types or sports or players:
        # Parse notification types
        types_set = set()
        if notification_types:
            for nt in notification_types.split(','):
                try:
                    types_set.add(NotificationType(nt.strip()))
                except ValueError:
                    pass
        else:
            # Default to all types
            types_set = set(NotificationType)
        
        # Parse priority
        try:
            priority = NotificationPriority(min_priority)
        except ValueError:
            priority = NotificationPriority.LOW
        
        # Parse sports
        sports_set = set()
        if sports:
            sports_set = {s.strip().lower() for s in sports.split(',') if s.strip()}
        
        # Parse players
        players_set = set()
        if players:
            players_set = {p.strip().lower() for p in players.split(',') if p.strip()}
        
        filter_obj = SubscriptionFilter(
            notification_types=types_set,
            min_priority=priority,
            sports=sports_set,
            players=players_set
        )
        filters.append(filter_obj)
    
    connection_id = None
    try:
        # Add connection to notification service
        connection_id = await notification_service.add_connection(
            websocket, user_id, filters
        )
        
        logger.info(f"WebSocket connected: {connection_id} (user: {user_id})")
        
        # Keep connection alive and handle incoming messages
        while True:
            try:
                # Wait for incoming messages (for subscription updates, etc.)
                data = await websocket.receive_text()
                message = json.loads(data)
                
                # Handle different message types
                await handle_websocket_message(connection_id, message)
                
            except WebSocketDisconnect:
                break
            except json.JSONDecodeError:
                await send_websocket_message(websocket, "error", error="Invalid JSON format")
            except Exception as e:
                logger.error(f"Error handling WebSocket message: {e}")
                await send_websocket_message(websocket, "error", error=str(e))
                
    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        if connection_id:
            await notification_service.remove_connection(connection_id)
            logger.info(f"WebSocket disconnected: {connection_id}")

async def handle_websocket_message(connection_id: str, message: Dict[str, Any]):
    """Handle incoming WebSocket messages"""
    message_type = message.get('type')
    
    if message_type == 'ping':
        # Respond to ping
        connection = notification_service.connections.get(connection_id)
        if connection:
            await connection.websocket.send_text(json.dumps(create_websocket_envelope("pong")))
    
    elif message_type == 'subscribe':
        # Update subscription filters
        await update_subscription_filters(connection_id, message.get('filters', {}))
    
    elif message_type == 'unsubscribe':
        # Remove specific filters
        await remove_subscription_filters(connection_id, message.get('filter_types', []))
    
    elif message_type == 'get_stats':
        # Send connection statistics
        connection = notification_service.connections.get(connection_id)
        if connection:
            stats = {
                "type": "stats",
                "connection_stats": {
                    "connected_at": connection.connected_at.isoformat(),
                    "message_count": connection.message_count,
                    "user_id": connection.user_id,
                    "filter_count": len(connection.subscription_filters)
                },
                "service_stats": notification_service.get_stats()
            }
            await connection.websocket.send_text(json.dumps(stats))

async def update_subscription_filters(connection_id: str, filter_data: Dict[str, Any]):
    """Update subscription filters for a connection"""
    connection = notification_service.connections.get(connection_id)
    if not connection:
        return
    
    try:
        # Parse new filter
        types_set = set()
        if 'notification_types' in filter_data:
            for nt in filter_data['notification_types']:
                try:
                    types_set.add(NotificationType(nt))
                except ValueError:
                    pass
        
        priority = NotificationPriority.LOW
        if 'min_priority' in filter_data:
            try:
                priority = NotificationPriority(filter_data['min_priority'])
            except ValueError:
                pass
        
        sports_set = set(filter_data.get('sports', []))
        players_set = set(filter_data.get('players', []))
        tags_set = set(filter_data.get('tags', []))
        
        new_filter = SubscriptionFilter(
            notification_types=types_set,
            min_priority=priority,
            sports=sports_set,
            players=players_set,
            tags=tags_set
        )
        
        # Add to existing filters
        connection.subscription_filters.append(new_filter)
        
        # Send confirmation
        await connection.websocket.send_text(json.dumps(create_websocket_envelope("subscription_updated")))
        
    except Exception as e:
        await connection.websocket.send_text(json.dumps({
            "type": "error",
            "message": f"Failed to update subscription: {str(e)}"
        }))

async def remove_subscription_filters(connection_id: str, filter_types: List[str]):
    """Remove specific subscription filters"""
    connection = notification_service.connections.get(connection_id)
    if not connection:
        return
    
    try:
        # Convert filter types to enum
        types_to_remove = set()
        for ft in filter_types:
            try:
                types_to_remove.add(NotificationType(ft))
            except ValueError:
                pass
        
        # Remove filters that match the types
        original_count = len(connection.subscription_filters)
        connection.subscription_filters = [
            f for f in connection.subscription_filters
            if not any(nt in types_to_remove for nt in f.notification_types)
        ]
        
        removed_count = original_count - len(connection.subscription_filters)
        
        # Send confirmation
        await connection.websocket.send_text(json.dumps({
            "type": "subscription_updated",
            "filter_count": len(connection.subscription_filters),
            "message": f"Removed {removed_count} subscription filters"
        }))
        
    except Exception as e:
        await connection.websocket.send_text(json.dumps({
            "type": "error",
            "message": f"Failed to remove subscription: {str(e)}"
        }))

@router.websocket("/odds")
async def websocket_odds_updates(
    websocket: WebSocket,
    sport: Optional[str] = Query(None),
    sportsbook: Optional[str] = Query(None),
    player: Optional[str] = Query(None)
):
    """
    WebSocket endpoint specifically for odds updates
    Specialized for high-frequency odds data
    """
    await websocket.accept()
    
    # Create odds-specific filter
    filters = [SubscriptionFilter(
        notification_types={NotificationType.ODDS_CHANGE, NotificationType.LINE_MOVEMENT},
        min_priority=NotificationPriority.LOW,
        sports={sport.lower()} if sport else set(),
        players={player.lower()} if player else set(),
        tags={sportsbook.lower()} if sportsbook else set()
    )]
    
    connection_id = None
    try:
        connection_id = await notification_service.add_connection(websocket, None, filters)
        
        # Send initial odds data
        await websocket.send_text(json.dumps({
            "type": "odds_subscription_confirmed",
            "filters": {
                "sport": sport,
                "sportsbook": sportsbook,
                "player": player
            },
            "message": "Connected to odds updates"
        }))
        
        # Keep connection alive
        while True:
            await asyncio.sleep(1)
            
    except WebSocketDisconnect:
        pass
    finally:
        if connection_id:
            await notification_service.remove_connection(connection_id)

@router.websocket("/arbitrage")
async def websocket_arbitrage_alerts(
    websocket: WebSocket,
    min_profit: Optional[float] = Query(2.0),
    sport: Optional[str] = Query(None)
):
    """
    WebSocket endpoint specifically for arbitrage opportunities
    High-priority alerts for profit opportunities
    """
    await websocket.accept()
    
    # Create arbitrage-specific filter
    filters = [SubscriptionFilter(
        notification_types={NotificationType.ARBITRAGE_OPPORTUNITY},
        min_priority=NotificationPriority.MEDIUM,
        sports={sport.lower()} if sport else set(),
        tags={"arbitrage", "profit"}
    )]
    
    connection_id = None
    try:
        connection_id = await notification_service.add_connection(websocket, None, filters)
        
        await websocket.send_text(json.dumps(create_websocket_envelope("arbitrage_subscription_confirmed")))
        
        # Keep connection alive
        while True:
            await asyncio.sleep(1)
            
    except WebSocketDisconnect:
        pass
    finally:
        if connection_id:
            await notification_service.remove_connection(connection_id)

@router.websocket("/portfolio")
async def websocket_portfolio_updates(
    websocket: WebSocket,
    token: Optional[str] = Query(None)
):
    """
    WebSocket endpoint for portfolio and bankroll updates
    User-specific financial notifications
    """
    await websocket.accept()
    
    # Extract user ID from token
    user_id = WebSocketAuthManager.extract_user_from_token(token)
    if not user_id:
        await websocket.send_text(json.dumps(create_websocket_envelope("error")))
        await websocket.close()
        return
    
    # Create portfolio-specific filter
    filters = [SubscriptionFilter(
        notification_types={
            NotificationType.PORTFOLIO_ALERT,
            NotificationType.BANKROLL_ALERT,
            NotificationType.HIGH_VALUE_BET
        },
        min_priority=NotificationPriority.LOW
    )]
    
    connection_id = None
    try:
        connection_id = await notification_service.add_connection(websocket, user_id, filters)
        
        await websocket.send_text(json.dumps(create_websocket_envelope("portfolio_subscription_confirmed")))
        
        # Keep connection alive
        while True:
            await asyncio.sleep(1)
            
    except WebSocketDisconnect:
        pass
    finally:
        if connection_id:
            await notification_service.remove_connection(connection_id)

# HTTP endpoints for notification management
@router.get("/notifications/stats", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_notification_stats():
    """Get notification service statistics"""
    return ResponseBuilder.success(notification_service.get_stats())

@router.post("/notifications/test", response_model=StandardAPIResponse[Dict[str, Any]])
async def send_test_notification(
    notification_type: str = "system_alert",
    title: str = "Test Notification",
    message: str = "This is a test notification",
    priority: int = 2
):
    """Send test notification for debugging"""
    try:
        notification = NotificationMessage(
            id=f"test_{asyncio.get_event_loop().time()}",
            type=NotificationType(notification_type),
            priority=NotificationPriority(priority),
            title=title,
            message=message,
            data={"test": True},
            tags=["test"]
        )
        
        await notification_service.send_notification(notification)
        return ResponseBuilder.success({"status": "success", "message": "Test notification sent"})
        
    except Exception as e:
        return ResponseBuilder.success({"status": "error", "message": str(e)})

@router.post("/notifications/broadcast", response_model=StandardAPIResponse[Dict[str, Any]])
async def broadcast_system_alert(
    title: str,
    message: str,
    priority: int = 2
):
    """Broadcast system-wide alert"""
    try:
        await notification_service.broadcast_system_alert(
            title, message, NotificationPriority(priority)
        )
        return ResponseBuilder.success({"status": "success", "message": "System alert broadcasted"})
        
    except Exception as e:
        return ResponseBuilder.success({"status": "error", "message": str(e)})
