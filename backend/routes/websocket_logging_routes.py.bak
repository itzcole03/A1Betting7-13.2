"""
WebSocket Logging API Routes

Provides HTTP endpoints for accessing WebSocket logging statistics,
connection information, and debugging data.
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query, Path
from datetime import datetime, timedelta

from backend.middleware.websocket_logging_middleware import (
    get_websocket_stats,
    get_active_websocket_connections,
    websocket_logging_middleware
)
from backend.services.unified_logging import unified_logger, LogContext, LogComponent

router = APIRouter(prefix="/api/websocket", tags=["WebSocket Logging"])
logger = unified_logger


@router.get("/logging/stats")
async def get_websocket_logging_statistics():
    """
    Get comprehensive WebSocket logging statistics
    
    Returns detailed metrics about WebSocket connections, handshakes,
    messages, and performance data.
    """
    try:
        stats = get_websocket_stats()
        
        context = LogContext(
            component=LogComponent.API,
            operation="websocket_stats_request",
            additional_data={"stats_requested": True}
        )
        
        logger.info("WebSocket logging statistics requested", context)
        
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "statistics": stats,
            "status": "success"
        }
        
    except Exception as e:
        context = LogContext(
            component=LogComponent.API,
            operation="websocket_stats_error",
            additional_data={"error": str(e)}
        )
        
        logger.error(f"Error retrieving WebSocket statistics: {e}", context, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to retrieve statistics: {str(e)}")


@router.get("/logging/connections")
async def get_active_websocket_connections_info(
    include_detailed: bool = Query(False, description="Include detailed connection information"),
    limit: Optional[int] = Query(None, description="Limit number of connections returned")
):
    """
    Get information about active WebSocket connections
    
    Parameters:
    - include_detailed: Include detailed logging information for each connection
    - limit: Maximum number of connections to return (default: all)
    """
    try:
        connections = get_active_websocket_connections()
        
        # Apply limit if specified
        if limit is not None and limit > 0:
            connections = connections[:limit]
        
        # Filter detailed info if not requested
        if not include_detailed:
            filtered_connections = []
            for conn in connections:
                filtered_conn = {
                    "connection_id": conn.get("connection_id"),
                    "client_ip": conn.get("client_ip"),
                    "path": conn.get("path"),
                    "connected_at": conn.get("connected_at"),
                    "authenticated": conn.get("authenticated"),
                    "user_id": conn.get("user_id"),
                    "subscription_count": conn.get("subscription_count"),
                    "messages_sent": conn.get("messages_sent"),
                    "messages_received": conn.get("messages_received")
                }
                filtered_connections.append(filtered_conn)
            connections = filtered_connections
        
        context = LogContext(
            component=LogComponent.API,
            operation="websocket_connections_request",
            additional_data={
                "connection_count": len(connections),
                "include_detailed": include_detailed,
                "limit_applied": limit
            }
        )
        
        logger.info(f"WebSocket connections info requested ({len(connections)} connections)", context)
        
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "total_connections": len(connections),
            "connections": connections,
            "include_detailed": include_detailed,
            "status": "success"
        }
        
    except Exception as e:
        context = LogContext(
            component=LogComponent.API,
            operation="websocket_connections_error",
            additional_data={"error": str(e)}
        )
        
        logger.error(f"Error retrieving WebSocket connections: {e}", context, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to retrieve connections: {str(e)}")


@router.get("/logging/connections/{connection_id}")
async def get_websocket_connection_details(
    connection_id: str = Path(..., description="WebSocket connection ID")
):
    """
    Get detailed information about a specific WebSocket connection
    
    Parameters:
    - connection_id: The unique connection ID to lookup
    """
    try:
        connections = get_active_websocket_connections()
        
        # Find the specific connection
        target_connection = None
        for conn in connections:
            if conn.get("connection_id") == connection_id:
                target_connection = conn
                break
        
        if not target_connection:
            # Check if the connection exists in middleware directly
            if connection_id in websocket_logging_middleware.active_connections:
                target_connection = websocket_logging_middleware.active_connections[connection_id].to_dict()
        
        if not target_connection:
            context = LogContext(
                component=LogComponent.API,
                operation="websocket_connection_not_found",
                additional_data={"connection_id": connection_id}
            )
            
            logger.warning(f"WebSocket connection not found: {connection_id}", context)
            raise HTTPException(status_code=404, detail=f"Connection {connection_id} not found")
        
        context = LogContext(
            component=LogComponent.API,
            operation="websocket_connection_details",
            additional_data={"connection_id": connection_id}
        )
        
        logger.info(f"WebSocket connection details requested: {connection_id}", context)
        
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "connection_found": True,
            "connection": target_connection,
            "status": "success"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        context = LogContext(
            component=LogComponent.API,
            operation="websocket_connection_details_error",
            additional_data={
                "connection_id": connection_id,
                "error": str(e)
            }
        )
        
        logger.error(f"Error retrieving connection details for {connection_id}: {e}", context, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to retrieve connection details: {str(e)}")


@router.get("/logging/history")
async def get_websocket_connection_history(
    limit: int = Query(50, description="Number of historical connections to return", ge=1, le=500),
    include_active: bool = Query(True, description="Include currently active connections")
):
    """
    Get historical WebSocket connection information
    
    Parameters:
    - limit: Number of recent connections to return (1-500)
    - include_active: Whether to include currently active connections
    """
    try:
        history = []
        
        # Get historical connections from middleware
        if hasattr(websocket_logging_middleware, 'connection_history'):
            historical = websocket_logging_middleware.connection_history[-limit:]
            history.extend([conn.to_dict() for conn in historical])
        
        # Optionally include active connections
        if include_active:
            active_connections = get_active_websocket_connections()
            # Mark active connections as such
            for conn in active_connections:
                conn['status'] = 'active'
            history.extend(active_connections)
        
        # Sort by connection time (most recent first)
        history.sort(key=lambda x: x.get('connected_at', ''), reverse=True)
        
        # Apply final limit
        history = history[:limit]
        
        context = LogContext(
            component=LogComponent.API,
            operation="websocket_history_request",
            additional_data={
                "limit": limit,
                "include_active": include_active,
                "total_returned": len(history)
            }
        )
        
        logger.info(f"WebSocket connection history requested ({len(history)} connections)", context)
        
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "total_connections": len(history),
            "limit_applied": limit,
            "include_active": include_active,
            "connections": history,
            "status": "success"
        }
        
    except Exception as e:
        context = LogContext(
            component=LogComponent.API,
            operation="websocket_history_error",
            additional_data={"error": str(e)}
        )
        
        logger.error(f"Error retrieving WebSocket connection history: {e}", context, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to retrieve connection history: {str(e)}")


@router.get("/logging/performance")
async def get_websocket_performance_metrics():
    """
    Get WebSocket performance metrics and analytics
    
    Returns aggregated performance data including handshake times,
    message throughput, error rates, and connection duration statistics.
    """
    try:
        stats = get_websocket_stats()
        connections = get_active_websocket_connections()
        
        # Calculate additional performance metrics
        performance_metrics = {
            "handshake_performance": {
                "success_rate": stats.get("handshake_success_rate", 0.0),
                "total_handshakes": stats.get("total_connections", 0),
                "failed_handshakes": stats.get("failed_handshakes", 0),
                "avg_connection_duration_ms": stats.get("avg_connection_duration_ms", 0.0)
            },
            "message_throughput": {
                "total_messages_sent": stats.get("total_messages_sent", 0),
                "total_messages_received": stats.get("total_messages_received", 0),
                "active_connections_with_messages": sum(
                    1 for conn in connections 
                    if conn.get("messages_sent", 0) > 0 or conn.get("messages_received", 0) > 0
                )
            },
            "connection_metrics": {
                "active_connections": stats.get("active_connections", 0),
                "authenticated_connections": stats.get("authenticated_connections", 0),
                "authentication_rate": (
                    (stats.get("authenticated_connections", 0) / stats.get("active_connections", 1)) * 100
                    if stats.get("active_connections", 0) > 0 else 0.0
                )
            }
        }
        
        context = LogContext(
            component=LogComponent.PERFORMANCE,
            operation="websocket_performance_metrics",
            additional_data=performance_metrics
        )
        
        logger.info("WebSocket performance metrics requested", context)
        
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "basic_stats": stats,
            "performance_metrics": performance_metrics,
            "status": "success"
        }
        
    except Exception as e:
        context = LogContext(
            component=LogComponent.API,
            operation="websocket_performance_error",
            additional_data={"error": str(e)}
        )
        
        logger.error(f"Error retrieving WebSocket performance metrics: {e}", context, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to retrieve performance metrics: {str(e)}")


@router.post("/logging/clear-history")
async def clear_websocket_connection_history():
    """
    Clear the WebSocket connection history
    
    This endpoint clears historical connection data but does not affect
    active connections. Use with caution in production environments.
    """
    try:
        # Clear connection history
        if hasattr(websocket_logging_middleware, 'connection_history'):
            history_count = len(websocket_logging_middleware.connection_history)
            websocket_logging_middleware.connection_history.clear()
        else:
            history_count = 0
        
        context = LogContext(
            component=LogComponent.API,
            operation="websocket_history_cleared",
            additional_data={"cleared_connections": history_count}
        )
        
        logger.info(f"WebSocket connection history cleared ({history_count} connections)", context)
        
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "connections_cleared": history_count,
            "status": "success",
            "message": f"Cleared {history_count} historical connections"
        }
        
    except Exception as e:
        context = LogContext(
            component=LogComponent.API,
            operation="websocket_history_clear_error",
            additional_data={"error": str(e)}
        )
        
        logger.error(f"Error clearing WebSocket connection history: {e}", context, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to clear connection history: {str(e)}")


@router.get("/health")
async def get_websocket_logging_health():
    """
    Get health status of WebSocket logging system
    
    Returns health information about the logging middleware,
    including system status and basic operational metrics.
    """
    try:
        stats = get_websocket_stats()
        
        # Determine health status based on basic metrics
        is_healthy = True
        health_issues = []
        
        # Check if middleware is functioning
        if not hasattr(websocket_logging_middleware, 'active_connections'):
            is_healthy = False
            health_issues.append("Middleware not properly initialized")
        
        # Check handshake success rate
        handshake_rate = stats.get("handshake_success_rate", 100.0)
        if handshake_rate < 90.0 and stats.get("total_connections", 0) > 0:
            health_issues.append(f"Low handshake success rate: {handshake_rate:.1f}%")
        
        health_status = "healthy" if is_healthy and not health_issues else "degraded"
        
        context = LogContext(
            component=LogComponent.SYSTEM,
            operation="websocket_logging_health_check",
            additional_data={
                "health_status": health_status,
                "issues_count": len(health_issues)
            }
        )
        
        logger.info(f"WebSocket logging health check: {health_status}", context)
        
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "health_status": health_status,
            "is_healthy": is_healthy,
            "issues": health_issues,
            "basic_stats": stats,
            "middleware_initialized": hasattr(websocket_logging_middleware, 'active_connections'),
            "status": "success"
        }
        
    except Exception as e:
        context = LogContext(
            component=LogComponent.API,
            operation="websocket_logging_health_error",
            additional_data={"error": str(e)}
        )
        
        logger.error(f"Error in WebSocket logging health check: {e}", context, exc_info=True)
        
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "health_status": "unhealthy",
            "is_healthy": False,
            "issues": [f"Health check failed: {str(e)}"],
            "status": "error"
        }