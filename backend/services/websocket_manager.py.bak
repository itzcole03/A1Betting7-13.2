import asyncio
from typing import Callable, Dict, Any, Optional


class WebSocketManager:
    def __init__(self):
        self._connections: Dict[str, Any] = {}

    async def connect(self, connection_id: str, info: Optional[Dict[str, Any]] = None) -> bool:
        await asyncio.sleep(0)
        self._connections[connection_id] = info or {}
        return True

    async def disconnect(self, connection_id: str) -> bool:
        await asyncio.sleep(0)
        return self._connections.pop(connection_id, None) is not None

    async def publish(self, connection_id: str, message: Any) -> bool:
        await asyncio.sleep(0)
        if connection_id not in self._connections:
            return False
        # In shim mode we just accept messages
        return True

    async def health(self) -> Dict[str, Any]:
        await asyncio.sleep(0)
        return {"status": "healthy", "connections": len(self._connections)}


_manager = WebSocketManager()


def get_manager() -> WebSocketManager:
    return _manager
