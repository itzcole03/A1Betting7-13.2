import logging
from typing import List

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()


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

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:  # pylint: disable=broad-exception-caught
                logging.error({"event": "ws_broadcast_error", "error": str(e)})


manager = ConnectionManager()


@router.websocket("/ws/predictions")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await manager.broadcast(f"Prediction update: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logging.info({"event": "ws_disconnect", "reason": "client disconnected"})
    except Exception as e:  # pylint: disable=broad-exception-caught
        manager.disconnect(websocket)
        logging.error({"event": "ws_unexpected_error", "error": str(e)})
