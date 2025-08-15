"""
Enhanced WebSocket Routes with Room-based Subscriptions
Implements subscription rooms, authentication, and heartbeat functionality.
"""

import asyncio
import json
from typing import Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query

from backend.services.enhanced_websocket_service import (
    enhanced_websocket_service,
    SubscriptionType,
    MessageType
)
from backend.utils.enhanced_logging import get_logger

logger = get_logger("enhanced_websocket_routes")
router = APIRouter(prefix="/ws/v2", tags=["Enhanced WebSocket"])


@router.on_event("startup")
async def startup():
    """Initialize WebSocket service on startup"""
    if not enhanced_websocket_service.is_initialized:
        await enhanced_websocket_service.initialize()


@router.on_event("shutdown")
async def shutdown():
    """Shutdown WebSocket service"""
    await enhanced_websocket_service.shutdown()


@router.websocket("/connect")
async def websocket_connect(
    websocket: WebSocket,
    token: Optional[str] = Query(None, description="JWT authentication token")
):
    """
    Main WebSocket connection endpoint with pre-connect authentication
    
    Query Parameters:
    - token: Optional JWT token for authentication (anonymous if not provided)
    
    Message Format (Client -> Server):
    {
        "type": "subscribe|unsubscribe|ping|status",
        "subscription_type": "odds_updates|predictions|analytics|arbitrage|mlb|nba|nfl|nhl",
        "filters": {"sport": "MLB", "game_id": "12345", "player": "Aaron Judge"},
        "timestamp": "2025-08-14T12:00:00Z"
    }
    
    Message Format (Server -> Client):
    {
        "type": "welcome|subscription_confirmed|odds_update|prediction_update|pong|error",
        "status": "success|error",
        "data": {...},
        "client_id": "uuid",
        "timestamp": "2025-08-14T12:00:00Z"
    }
    """
    await enhanced_websocket_service.handle_connection(websocket, token)


@router.websocket("/odds")
async def websocket_odds_only(
    websocket: WebSocket,
    sport: Optional[str] = Query(None, description="Filter by sport (MLB, NBA, NFL, NHL)"),
    sportsbook: Optional[str] = Query(None, description="Filter by sportsbook"),
    token: Optional[str] = Query(None, description="JWT authentication token")
):
    """
    Dedicated WebSocket endpoint for odds updates only
    Automatically subscribes to odds_updates with optional filters
    """
    try:
        # Connect with authentication
        await enhanced_websocket_service.handle_connection(websocket, token)
        
    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error(f"Error in odds-only WebSocket: {e}")


@router.websocket("/arbitrage")
async def websocket_arbitrage_only(
    websocket: WebSocket,
    min_profit: Optional[float] = Query(2.0, description="Minimum profit percentage"),
    sport: Optional[str] = Query(None, description="Filter by sport"),
    token: Optional[str] = Query(None, description="JWT authentication token")
):
    """
    Dedicated WebSocket endpoint for arbitrage opportunities only
    High-priority alerts for profitable arbitrage opportunities
    """
    try:
        await enhanced_websocket_service.handle_connection(websocket, token)
        
    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error(f"Error in arbitrage-only WebSocket: {e}")


@router.websocket("/sport/{sport_name}")
async def websocket_sport_specific(
    websocket: WebSocket,
    sport_name: str,
    token: Optional[str] = Query(None, description="JWT authentication token"),
    game_id: Optional[str] = Query(None, description="Filter by specific game ID"),
    player: Optional[str] = Query(None, description="Filter by specific player")
):
    """
    Sport-specific WebSocket endpoint (MLB, NBA, NFL, NHL)
    Automatically subscribes to sport-specific updates with optional filters
    """
    sport_upper = sport_name.upper()
    
    # Validate sport
    valid_sports = {"MLB", "NBA", "NFL", "NHL"}
    if sport_upper not in valid_sports:
        await websocket.close(code=4000, reason=f"Invalid sport: {sport_name}")
        return
    
    try:
        await enhanced_websocket_service.handle_connection(websocket, token)
        
    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error(f"Error in {sport_name} WebSocket: {e}")


@router.websocket("/portfolio")
async def websocket_portfolio_only(
    websocket: WebSocket,
    token: Optional[str] = Query(None, description="JWT authentication token (required)")
):
    """
    Portfolio-specific WebSocket endpoint for authenticated users
    Provides bankroll updates, portfolio alerts, and personalized notifications
    """
    if not token:
        await websocket.close(code=4001, reason="Authentication required for portfolio updates")
        return
    
    try:
        await enhanced_websocket_service.handle_connection(websocket, token)
        
    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error(f"Error in portfolio WebSocket: {e}")


# HTTP endpoints for WebSocket management and testing
@router.get("/status")
async def get_websocket_status():
    """Get WebSocket service status"""
    if not enhanced_websocket_service.is_initialized:
        return {
            "status": "not_initialized",
            "active_connections": 0,
            "active_rooms": 0
        }
    
    cm = enhanced_websocket_service.connection_manager
    
    return {
        "status": "active" if enhanced_websocket_service.is_initialized else "inactive",
        "active_connections": len(cm.connections),
        "active_rooms": len(cm.subscription_manager.rooms),
        "authenticated_users": sum(
            1 for conn in cm.connections.values() if conn.authenticated
        ),
        "subscription_types": [sub.value for sub in SubscriptionType],
        "heartbeat_enabled": True
    }


@router.post("/broadcast/test")
async def broadcast_test_message(
    subscription_type: str = "system_alerts",
    message: str = "Test broadcast message"
):
    """
    Test endpoint to broadcast a message to all subscribers
    Only works if WebSocket service is initialized
    """
    if not enhanced_websocket_service.is_initialized:
        return {"error": "WebSocket service not initialized"}
    
    try:
        sub_type = SubscriptionType(subscription_type)
        test_data = {
            "title": "Test Message",
            "message": message,
            "timestamp": "2025-08-14T12:00:00Z",
            "test": True
        }
        
        await enhanced_websocket_service.connection_manager.broadcast_to_room(
            sub_type,
            MessageType.SYSTEM_ALERT,
            test_data
        )
        
        return {
            "status": "success",
            "message": f"Test message broadcasted to {subscription_type} subscribers"
        }
        
    except ValueError:
        return {"error": f"Invalid subscription type: {subscription_type}"}
    except Exception as e:
        return {"error": f"Broadcast failed: {str(e)}"}


@router.get("/rooms")
async def get_active_rooms():
    """Get information about active subscription rooms"""
    if not enhanced_websocket_service.is_initialized:
        return {"error": "WebSocket service not initialized"}
    
    sm = enhanced_websocket_service.connection_manager.subscription_manager
    
    rooms_info = []
    for room in sm.rooms.values():
        rooms_info.append({
            "room_id": room.room_id,
            "subscription_type": room.subscription_type.value,
            "filters": room.filters,
            "subscriber_count": len(room.subscribers),
            "created_at": room.created_at.isoformat(),
            "last_update": room.last_update.isoformat()
        })
    
    return {
        "total_rooms": len(rooms_info),
        "rooms": rooms_info
    }


@router.get("/connections")
async def get_active_connections():
    """Get information about active WebSocket connections"""
    if not enhanced_websocket_service.is_initialized:
        return {"error": "WebSocket service not initialized"}
    
    cm = enhanced_websocket_service.connection_manager
    
    connections_info = []
    for connection in cm.connections.values():
        connections_info.append({
            "client_id": connection.client_id,
            "user_id": connection.user_id,
            "authenticated": connection.authenticated,
            "connected_at": connection.connected_at.isoformat(),
            "last_heartbeat": connection.last_heartbeat.isoformat(),
            "subscription_count": len(connection.subscriptions),
            "subscriptions": list(connection.subscriptions)
        })
    
    return {
        "total_connections": len(connections_info),
        "authenticated_connections": sum(
            1 for conn in connections_info if conn["authenticated"]
        ),
        "connections": connections_info
    }
