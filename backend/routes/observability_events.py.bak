"""
Observability Events API Routes (PR11)

Provides REST API endpoints for accessing observability events from the event bus.
Includes filtering, pagination, and real-time event streaming capabilities.
"""

import logging
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Query, HTTPException, Depends
from pydantic import BaseModel, Field

from ..services.observability.event_bus import get_event_bus, EventType
from ..services.websocket.ws_registry import get_registry_stats
from ..utils.response_envelope import ok, fail

logger = logging.getLogger(__name__)
router = APIRouter()


class EventsResponse(BaseModel):
    """Response model for events endpoint"""
    events: List[Dict[str, Any]] = Field(..., description="List of observability events")
    total_returned: int = Field(..., description="Number of events returned")
    filter_applied: Optional[str] = Field(None, description="Filter that was applied")
    limit_applied: int = Field(..., description="Limit that was applied")


class EventBusStatsResponse(BaseModel):
    """Response model for event bus statistics"""
    total_published: int = Field(..., description="Total events published since startup")
    current_buffer_size: int = Field(..., description="Current number of events in buffer")
    max_buffer_size: int = Field(..., description="Maximum buffer size")
    buffer_full_count: int = Field(..., description="Number of times buffer was full")
    last_publish_time: Optional[float] = Field(None, description="Timestamp of last published event")


class WebSocketStatsResponse(BaseModel):
    """Response model for WebSocket connection statistics"""
    active_connections: int = Field(..., description="Number of active WebSocket connections")
    total_connections: int = Field(..., description="Total connections since startup")
    total_disconnections: int = Field(..., description="Total disconnections since startup")
    broadcasts_sent: int = Field(..., description="Total broadcasts sent")
    connections_by_role: Dict[str, int] = Field(..., description="Breakdown of connections by role")
    average_uptime: float = Field(..., description="Average connection uptime in seconds")


@router.get(
    "/api/v2/observability/events",
    response_model=Dict[str, Any],
    summary="Get observability events",
    description="Retrieve observability events with optional filtering and pagination"
)
async def get_observability_events(
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of events to return"),
    event_type: Optional[EventType] = Query(None, description="Filter by event type"),
    request_id: Optional[str] = Query(None, description="Filter by request ID"),
    descending: bool = Query(True, description="Sort by timestamp descending (newest first)")
) -> Dict[str, Any]:
    """
    Get observability events with optional filtering.
    
    Returns events in chronological order with metadata about the query.
    Events include HTTP requests, WebSocket messages, inference audits,
    drift status changes, cache operations, and legacy usage tracking.
    """
    try:
        event_bus = get_event_bus()
        
        # Get events with filtering
        events = event_bus.get_events(
            limit=limit,
            event_type=event_type,
            request_id=request_id,
            descending=descending
        )
        
        # Build filter description for response
        filter_parts = []
        if event_type:
            filter_parts.append(f"type={event_type}")
        if request_id:
            filter_parts.append(f"request_id={request_id}")
        
        filter_description = ", ".join(filter_parts) if filter_parts else None
        
        response_data = EventsResponse(
            events=events,
            total_returned=len(events),
            filter_applied=filter_description,
            limit_applied=limit
        )
        
        return ok(
            data=response_data.dict(),
            meta={"message": f"Retrieved {len(events)} observability events"}
        )
        
    except Exception as e:
        logger.error(f"Failed to get observability events: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve observability events: {str(e)}"
        )


@router.get(
    "/api/v2/observability/event-types",
    response_model=Dict[str, Any],
    summary="Get available event types",
    description="Get list of available event types for filtering"
)
async def get_event_types() -> Dict[str, Any]:
    """
    Get list of available event types.
    
    Returns all supported event types that can be used for filtering.
    """
    try:
        event_types = [
            {
                "type": "http.request",
                "description": "HTTP request processing events"
            },
            {
                "type": "ws.message.out",
                "description": "Outbound WebSocket messages from server to client"
            },
            {
                "type": "ws.message.in",
                "description": "Inbound WebSocket messages from client to server"
            },
            {
                "type": "inference.audit",
                "description": "ML model inference audit events"
            },
            {
                "type": "drift.status",
                "description": "Model drift status change events"
            },
            {
                "type": "cache.rebuild",
                "description": "Cache rebuild and invalidation events"
            },
            {
                "type": "legacy.usage",
                "description": "Legacy endpoint usage tracking events"
            }
        ]
        
        return ok(
            data={"event_types": event_types},
            meta={"message": f"Retrieved {len(event_types)} available event types"}
        )
        
    except Exception as e:
        logger.error(f"Failed to get event types: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve event types: {str(e)}"
        )


@router.get(
    "/api/v2/observability/stats",
    response_model=Dict[str, Any],
    summary="Get observability statistics",
    description="Get statistics about the event bus and WebSocket connections"
)
async def get_observability_stats() -> Dict[str, Any]:
    """
    Get comprehensive observability statistics.
    
    Returns statistics about the event bus, WebSocket connections,
    and overall system observability health.
    """
    try:
        event_bus = get_event_bus()
        
        # Get event bus statistics
        event_stats = event_bus.get_stats()
        event_bus_stats = EventBusStatsResponse(
            total_published=event_stats.get("total_published", 0),
            current_buffer_size=event_stats.get("current_buffer_size", 0),
            max_buffer_size=event_stats.get("max_buffer_size", 500),
            buffer_full_count=event_stats.get("buffer_full_count", 0),
            last_publish_time=event_stats.get("last_publish_time")
        )
        
        # Get WebSocket statistics
        ws_stats = get_registry_stats()
        websocket_stats = WebSocketStatsResponse(
            active_connections=ws_stats.get("active_connections", 0),
            total_connections=ws_stats.get("total_connections", 0),
            total_disconnections=ws_stats.get("total_disconnections", 0),
            broadcasts_sent=ws_stats.get("broadcasts_sent", 0),
            connections_by_role=ws_stats.get("connections_by_role", {}),
            average_uptime=ws_stats.get("average_uptime", 0.0)
        )
        
        return ok(
            data={
                "event_bus": event_bus_stats.dict(),
                "websockets": websocket_stats.dict(),
                "overall_health": {
                    "events_flowing": event_stats.get("total_published", 0) > 0,
                    "websockets_active": ws_stats.get("active_connections", 0) > 0,
                    "buffer_utilization": (
                        event_stats.get("current_buffer_size", 0) / 
                        max(event_stats.get("max_buffer_size", 500), 1)
                    )
                }
            },
            meta={"message": "Retrieved observability statistics"}
        )
        
    except Exception as e:
        logger.error(f"Failed to get observability stats: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve observability statistics: {str(e)}"
        )


@router.delete(
    "/api/v2/observability/events",
    response_model=Dict[str, Any],
    summary="Clear event buffer",
    description="Clear all events from the event bus buffer (development/testing only)"
)
async def clear_event_buffer() -> Dict[str, Any]:
    """
    Clear all events from the event bus buffer.
    
    This is primarily intended for development and testing purposes.
    In production, events naturally expire from the ring buffer.
    """
    try:
        event_bus = get_event_bus()
        cleared_count = event_bus.clear_events()
        
        return ok(
            data={"cleared_events": cleared_count},
            meta={"message": f"Cleared {cleared_count} events from event buffer"}
        )
        
    except Exception as e:
        logger.error(f"Failed to clear event buffer: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to clear event buffer: {str(e)}"
        )


@router.get(
    "/api/v2/observability/health",
    response_model=Dict[str, Any],
    summary="Observability health check",
    description="Check the health of observability systems"
)
async def observability_health_check() -> Dict[str, Any]:
    """
    Check the health of observability systems.
    
    Returns health status of event bus, WebSocket registry,
    and overall observability infrastructure.
    """
    try:
        event_bus = get_event_bus()
        event_stats = event_bus.get_stats()
        ws_stats = get_registry_stats()
        
        # Determine health status
        is_healthy = True
        issues = []
        
        # Check event bus health
        if event_stats.get("buffer_full_count", 0) > 100:
            issues.append("Event buffer experiencing frequent overflow")
            is_healthy = False
        
        # Check WebSocket health
        active_connections = ws_stats.get("active_connections", 0)
        total_connections = ws_stats.get("total_connections", 0)
        
        if total_connections > 0 and active_connections == 0:
            issues.append("No active WebSocket connections despite connection history")
        
        health_status = "healthy" if is_healthy and not issues else "degraded" if issues else "healthy"
        
        return ok(
            data={
                "status": health_status,
                "checks": {
                    "event_bus": {
                        "healthy": event_stats.get("total_published", 0) >= 0,
                        "buffer_size": event_stats.get("current_buffer_size", 0),
                        "overflow_count": event_stats.get("buffer_full_count", 0)
                    },
                    "websockets": {
                        "healthy": True,  # WebSocket registry is always healthy if accessible
                        "active_connections": active_connections,
                        "total_connections": total_connections
                    }
                },
                "issues": issues
            },
            meta={"message": f"Observability system is {health_status}"}
        )
        
    except Exception as e:
        logger.error(f"Observability health check failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Observability health check failed: {str(e)}"
        )