"""
Canonical WebSocket Client Route
Implements structured handshake with query param validation and version negotiation.
"""

import asyncio
import json
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, WebSocketException
from backend.utils.enhanced_logging import get_logger

logger = get_logger("ws_client")
router = APIRouter()


@router.websocket("/ws/client")
async def websocket_client_endpoint(
    websocket: WebSocket,
    client_id: str = Query(..., description="Client UUID for connection identification"),
    version: int = Query(1, description="WebSocket protocol version"),
    role: str = Query("frontend", description="Client role (frontend, admin, etc.)")
):
    """
    Canonical WebSocket client endpoint with structured handshake
    
    URL Pattern: /ws/client?client_id=<uuid>&version=1&role=frontend
    
    Handshake Flow:
    1. Client connects with query params
    2. Server validates version and params
    3. Server sends hello message with capabilities
    4. Heartbeat ping/pong cycle begins
    
    Args:
        websocket: WebSocket connection
        client_id: Unique client identifier
        version: Protocol version (currently only 1 supported)
        role: Client role for access control
    """
    request_id = str(uuid.uuid4())
    
    # Log connection attempt
    logger.info(
        "WebSocket connection attempt",
        extra={
            "client_id": client_id,
            "version": version,
            "role": role,
            "request_id": request_id,
            "remote_addr": websocket.client.host if websocket.client else "unknown"
        }
    )
    
    # Version validation
    if version != 1:
        logger.warning(
            "Unsupported WebSocket version",
            extra={"client_id": client_id, "version": version, "request_id": request_id}
        )
        await websocket.close(code=4400, reason=f"Unsupported version {version}, expected 1")
        return
    
    # Role validation  
    if role not in ["frontend", "admin", "test"]:
        logger.warning(
            "Invalid client role",
            extra={"client_id": client_id, "role": role, "request_id": request_id}
        )
        await websocket.close(code=4401, reason=f"Invalid role {role}")
        return
    
    try:
        # Accept WebSocket connection
        await websocket.accept()
        
        # Send structured hello message
        hello_message = {
            "type": "hello",
            "server_time": datetime.now(timezone.utc).isoformat(),
            "accepted_version": version,
            "features": [
                "heartbeat",
                "structured_messages",
                "error_codes",
                "graceful_reconnect"
            ],
            "request_id": request_id,
            "client_id": client_id,
            "heartbeat_interval_ms": 25000  # 25 second heartbeat
        }
        
        await websocket.send_text(json.dumps(hello_message))
        
        logger.info(
            "WebSocket connection established",
            extra={
                "client_id": client_id,
                "version": version,
                "role": role,
                "request_id": request_id
            }
        )
        
        # Store connection metadata
        connection_start_time = datetime.now(timezone.utc)
        heartbeat_count = 0
        last_heartbeat = connection_start_time
        
        # Start heartbeat task
        async def send_heartbeat():
            nonlocal heartbeat_count, last_heartbeat
            while True:
                try:
                    await asyncio.sleep(25)  # 25 second interval
                    
                    ping_message = {
                        "type": "ping",
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                        "heartbeat_count": heartbeat_count,
                        "client_id": client_id
                    }
                    
                    await websocket.send_text(json.dumps(ping_message))
                    heartbeat_count += 1
                    last_heartbeat = datetime.now(timezone.utc)
                    
                except WebSocketDisconnect:
                    logger.info(
                        "Heartbeat stopped - client disconnected",
                        extra={"client_id": client_id}
                    )
                    break
                except Exception as e:
                    logger.error(
                        "Heartbeat error",
                        extra={"client_id": client_id, "error": str(e)}
                    )
                    break
        
        # Start heartbeat task in background
        heartbeat_task = asyncio.create_task(send_heartbeat())
        
        try:
            # Main message loop
            while True:
                try:
                    # Receive message from client
                    message_text = await websocket.receive_text()
                    
                    try:
                        message = json.loads(message_text)
                    except json.JSONDecodeError:
                        error_response = {
                            "type": "error",
                            "error_code": "INVALID_JSON",
                            "message": "Invalid JSON format",
                            "timestamp": datetime.now(timezone.utc).isoformat()
                        }
                        await websocket.send_text(json.dumps(error_response))
                        continue
                    
                    # Handle different message types
                    message_type = message.get("type")
                    
                    if message_type == "ping":
                        # Respond to client ping
                        pong_response = {
                            "type": "pong", 
                            "timestamp": datetime.now(timezone.utc).isoformat(),
                            "client_id": client_id
                        }
                        await websocket.send_text(json.dumps(pong_response))
                        
                    elif message_type == "pong":
                        # Client responded to our ping
                        logger.debug(
                            "Received pong from client",
                            extra={"client_id": client_id}
                        )
                        
                    elif message_type == "status":
                        # Send connection status
                        uptime_seconds = (datetime.now(timezone.utc) - connection_start_time).total_seconds()
                        status_response = {
                            "type": "status",
                            "connection_uptime_seconds": uptime_seconds,
                            "heartbeat_count": heartbeat_count,
                            "last_heartbeat": last_heartbeat.isoformat(),
                            "client_id": client_id,
                            "timestamp": datetime.now(timezone.utc).isoformat()
                        }
                        await websocket.send_text(json.dumps(status_response))
                        
                    else:
                        # Echo unknown messages for now
                        echo_response = {
                            "type": "echo",
                            "original_message": message,
                            "timestamp": datetime.now(timezone.utc).isoformat(),
                            "client_id": client_id
                        }
                        await websocket.send_text(json.dumps(echo_response))
                        
                except asyncio.TimeoutError:
                    # Connection timeout
                    logger.warning(
                        "WebSocket receive timeout",
                        extra={"client_id": client_id}
                    )
                    break
                    
        except WebSocketDisconnect as e:
            logger.info(
                "WebSocket client disconnected normally", 
                extra={
                    "client_id": client_id,
                    "code": e.code,
                    "reason": e.reason or "No reason provided"
                }
            )
            
        except Exception as e:
            logger.error(
                "WebSocket connection error",
                extra={
                    "client_id": client_id,
                    "error": str(e),
                    "error_type": type(e).__name__
                }
            )
            
        finally:
            # Clean up heartbeat task
            if heartbeat_task and not heartbeat_task.done():
                heartbeat_task.cancel()
                try:
                    await heartbeat_task
                except asyncio.CancelledError:
                    pass
            
            # Log connection summary
            uptime_seconds = (datetime.now(timezone.utc) - connection_start_time).total_seconds()
            logger.info(
                "WebSocket connection closed",
                extra={
                    "client_id": client_id,
                    "uptime_seconds": uptime_seconds,
                    "heartbeat_count": heartbeat_count,
                    "request_id": request_id
                }
            )
            
    except Exception as e:
        logger.error(
            "WebSocket handshake error",
            extra={
                "client_id": client_id,
                "error": str(e),
                "error_type": type(e).__name__,
                "request_id": request_id
            }
        )
        # Try to close with error code if possible
        try:
            await websocket.close(code=4500, reason=f"Server error: {str(e)[:100]}")
        except Exception:
            pass  # Connection might already be closed