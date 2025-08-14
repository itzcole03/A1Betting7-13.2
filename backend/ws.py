import json
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()


# WebSocket envelope pattern utilities
def create_websocket_envelope(
    message_type: str,
    data: Any = None,
    status: str = "success",
    error: Optional[str] = None,
    timestamp: Optional[str] = None
) -> Dict[str, Any]:
    """Create standardized WebSocket message envelope"""
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
    error: Optional[str] = None
):
    """Send standardized WebSocket message"""
    envelope = create_websocket_envelope(message_type, data, status, error)
    await websocket.send_text(json.dumps(envelope))


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        try:
            await websocket.accept()
            self.active_connections.append(websocket)
            logging.info({"event": "ws_connect", "client": str(websocket.client)})
        except Exception as e:  # pylint: disable=broad-exception-caught
            logging.error({"event": "ws_connect_error", "error": str(e)})

    def disconnect(self, websocket: WebSocket):
        try:
            self.active_connections.remove(websocket)
            logging.info({"event": "ws_disconnect", "client": str(websocket.client)})
        except Exception as e:  # pylint: disable=broad-exception-caught
            logging.error({"event": "ws_disconnect_error", "error": str(e)})

    async def broadcast(self, message_type: str, data: Any = None):
        """Broadcast message using envelope pattern"""
        envelope = create_websocket_envelope(message_type, data)
        message = json.dumps(envelope)
        
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:  # pylint: disable=broad-exception-caught
                logging.error({"event": "ws_broadcast_error", "error": str(e)})


manager = ConnectionManager()


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            
            # Always broadcast as envelope pattern
            await manager.broadcast("PREDICTION_UPDATE", {"payload": data})
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logging.info({"event": "ws_disconnect", "reason": "client disconnected"})
    except Exception as e:  # pylint: disable=broad-exception-caught
        manager.disconnect(websocket)
        logging.error({"event": "ws_unexpected_error", "error": str(e)})
