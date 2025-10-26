"""
Import-safe stub for realtime websocket routes.

The original implementation had widespread syntax errors and import-time
side-effects. This module provides a minimal APIRouter that preserves the
public `router` symbol and offers tiny, well-formed handlers so the test
collector can import backend.routes without failing.
"""

from typing import Any, Dict

from fastapi import APIRouter, WebSocket

try:
    # Prefer the project's response helper if available
    from backend.core.app import ok
except Exception:
    # Fallback to a simple pass-through
    def ok(payload: Dict[str, Any]) -> Dict[str, Any]:
        return {"success": True, "data": payload, "error": None}


router = APIRouter(prefix="/ws", tags=["WebSocket"])


@router.websocket("/notifications")
async def websocket_notifications(websocket: WebSocket):
    """Simple echo-style websocket used as an import-safe placeholder."""
    await websocket.accept()
    try:
        await websocket.send_text('{"type": "welcome", "status": "connected"}')
        # Echo messages back (lightweight behavior)
        while True:
            text = await websocket.receive_text()
            await websocket.send_text(text)
    except Exception:
        # Close quietly on any error
        try:
            await websocket.close()
        except Exception:
            pass


@router.get("/health")
def ws_health() -> Dict[str, Any]:
    """Health endpoint for websocket subsystem (import-safe)."""
    return ok({"status": "ok"})
