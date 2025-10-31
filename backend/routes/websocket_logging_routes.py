"""Temporary WebSocket logging routes (import-safe stub)

These endpoints are minimal, safe implementations used during tests to
ensure route registration succeeds. They intentionally avoid heavy
dependencies and complex logic.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Query

router = APIRouter(prefix="/api/websocket", tags=["WebSocket Logging"])


@router.get("/logging/stats")
async def get_websocket_logging_statistics():
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "statistics": {},
        "status": "success",
    }


@router.get("/logging/connections")
async def get_active_websocket_connections_info(include_detailed: bool = Query(False)):
    # Return a safe, minimal shape expected by callers
    connections: List[Dict[str, Any]] = []
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "total_connections": len(connections),
        "connections": connections,
    }


@router.get("/logging/history")
async def get_websocket_connection_history(limit: int = Query(50)):
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "total_connections": 0,
        "connections": [],
    }


@router.get("/health")
async def get_websocket_logging_health():
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "health_status": "healthy",
        "is_healthy": True,
    }
