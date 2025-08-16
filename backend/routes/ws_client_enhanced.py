"""
Enhanced WebSocket Client Route with PR11 Envelope System

Refactored WebSocket route that uses the new envelope system, connection registry,
and observability event bus for improved correlation and monitoring.
"""

import asyncio
import json
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, WebSocketException
from backend.utils.enhanced_logging import get_logger

# PR11 imports
from backend.services.websocket.ws_sender import (
    send_hello, send_ping, send_pong, send_error, record_inbound_message
)
from backend.services.websocket.ws_registry import get_connection_registry
from backend.services.websocket.envelope import parse_envelope, is_enveloped_message, log_legacy_warning_once
from backend.services.observability.event_bus import get_event_bus

logger = get_logger("ws_client_enhanced")
router = APIRouter()


@router.websocket("/ws/client")
async def websocket_client_endpoint_enhanced(
    websocket: WebSocket,
    client_id: str = Query(..., description="Client UUID for connection identification"),
    version: int = Query(1, description="WebSocket protocol version"),
    role: str = Query("frontend", description="Client role (frontend, admin, etc.)")
):
    """
    Enhanced WebSocket client endpoint with PR11 envelope system integration.
    
    Features:
    - Standardized envelope format for all messages
    - Request correlation and trace propagation  
    - Connection registry for broadcasting
    - Observability event publishing
    - Backward compatibility with legacy messages
    
    URL Pattern: /ws/client?client_id=<uuid>&version=1&role=frontend
    
    Handshake Flow:
    1. Client connects with query params
    2. Server validates version and params  
    3. Server sends enveloped hello message
    4. Connection registered for broadcasting
    5. Heartbeat ping/pong cycle begins with envelopes
    
    Args:
        websocket: WebSocket connection
        client_id: Unique client identifier
        version: Protocol version (currently only 1 supported)
        role: Client role for access control
    """
    request_id = str(uuid.uuid4())
    connection_id = f"{client_id}_{uuid.uuid4().hex[:8]}"
    
    # Log connection attempt with observability event
    logger.info(
        "Enhanced WebSocket connection attempt",
        extra={
            "client_id": client_id,
            "connection_id": connection_id,
            "version": version,
            "role": role,
            "request_id": request_id,
            "remote_addr": websocket.client.host if websocket.client else "unknown"
        }
    )
    
    # Publish connection attempt to event bus
    event_bus = get_event_bus()
    event_bus.publish(
        event_type="ws.message.out",
        data={
            "type": "connection_attempt",
            "client_id": client_id,
            "connection_id": connection_id,
            "version": version,
            "role": role
        },
        request_id=request_id
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
        
        # Register connection in registry
        connection_registry = get_connection_registry()
        registration_success = connection_registry.add_connection(
            websocket=websocket,
            connection_id=connection_id,
            client_id=client_id,
            version=version,
            role=role
        )
        
        if not registration_success:
            logger.error(f"Failed to register connection {connection_id}")
            await websocket.close(code=4500, reason="Server error: connection registration failed")
            return
        
        # Send enveloped hello message
        hello_sent = await send_hello(
            websocket=websocket,
            request_id=request_id,
            client_id=client_id,
            features=[
                "envelope_v1",
                "heartbeat",
                "correlation_tracking", 
                "structured_errors",
                "graceful_reconnect",
                "drift_status_broadcast"
            ]
        )
        
        if not hello_sent:
            logger.error("Failed to send hello message")
            await websocket.close(code=4500, reason="Server error: hello message failed")
            return
        
        logger.info(
            "Enhanced WebSocket connection established",
            extra={
                "client_id": client_id,
                "connection_id": connection_id,
                "version": version,
                "role": role,
                "request_id": request_id
            }
        )
        
        # Connection metadata
        connection_start_time = datetime.now(timezone.utc)
        heartbeat_count = 0
        last_heartbeat = connection_start_time
        
        # Enhanced heartbeat task using envelope system
        async def send_heartbeat():
            nonlocal heartbeat_count, last_heartbeat
            while True:
                try:
                    await asyncio.sleep(25)  # 25 second interval
                    
                    ping_sent = await send_ping(
                        websocket=websocket,
                        request_id=request_id,
                        heartbeat_count=heartbeat_count
                    )
                    
                    if ping_sent:
                        heartbeat_count += 1
                        last_heartbeat = datetime.now(timezone.utc)
                        # Update activity in registry
                        connection_registry.update_activity(connection_id)
                    
                except WebSocketDisconnect:
                    logger.info(
                        "Heartbeat stopped - client disconnected",
                        extra={"client_id": client_id, "connection_id": connection_id}
                    )
                    break
                except Exception as e:
                    logger.error(
                        "Heartbeat error",
                        extra={
                            "client_id": client_id,
                            "connection_id": connection_id,
                            "error": str(e)
                        }
                    )
                    break
        
        # Start heartbeat task in background
        heartbeat_task = asyncio.create_task(send_heartbeat())
        
        try:
            # Enhanced message loop with envelope support
            while True:
                try:
                    # Receive message from client
                    message_text = await websocket.receive_text()
                    
                    # Record inbound message to observability system
                    record_inbound_message(
                        message=message_text,
                        websocket=websocket,
                        request_id=request_id
                    )
                    
                    # Update activity in registry
                    connection_registry.update_activity(connection_id)
                    
                    # Try to parse as envelope first
                    if is_enveloped_message(message_text):
                        envelope = parse_envelope(message_text)
                        if envelope:
                            await handle_enveloped_message(
                                envelope=envelope,
                                websocket=websocket,
                                client_id=client_id,
                                connection_id=connection_id,
                                request_id=request_id,
                                connection_start_time=connection_start_time,
                                heartbeat_count=heartbeat_count,
                                last_heartbeat=last_heartbeat
                            )
                        else:
                            await send_error(
                                websocket=websocket,
                                error_message="Invalid envelope format",
                                error_code="INVALID_ENVELOPE",
                                request_id=request_id
                            )
                    else:
                        # Handle legacy (non-enveloped) message
                        await handle_legacy_message(
                            message_text=message_text,
                            websocket=websocket,
                            client_id=client_id,
                            request_id=request_id,
                            connection_start_time=connection_start_time,
                            heartbeat_count=heartbeat_count,
                            last_heartbeat=last_heartbeat
                        )
                        
                except asyncio.TimeoutError:
                    logger.warning(
                        "WebSocket receive timeout",
                        extra={"client_id": client_id, "connection_id": connection_id}
                    )
                    break
                    
        except WebSocketDisconnect as e:
            logger.info(
                "Enhanced WebSocket client disconnected normally",
                extra={
                    "client_id": client_id,
                    "connection_id": connection_id,
                    "code": e.code,
                    "reason": e.reason or "No reason provided"
                }
            )
            
        except Exception as e:
            logger.error(
                "Enhanced WebSocket connection error",
                extra={
                    "client_id": client_id,
                    "connection_id": connection_id,
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
            
            # Remove from connection registry
            connection_registry.remove_connection(connection_id)
            
            # Log connection summary
            uptime_seconds = (datetime.now(timezone.utc) - connection_start_time).total_seconds()
            logger.info(
                "Enhanced WebSocket connection closed",
                extra={
                    "client_id": client_id,
                    "connection_id": connection_id,
                    "uptime_seconds": uptime_seconds,
                    "heartbeat_count": heartbeat_count,
                    "request_id": request_id
                }
            )
            
    except Exception as e:
        logger.error(
            "Enhanced WebSocket handshake error",
            extra={
                "client_id": client_id,
                "connection_id": connection_id,
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


async def handle_enveloped_message(
    envelope,
    websocket: WebSocket,
    client_id: str,
    connection_id: str,
    request_id: str,
    connection_start_time: datetime,
    heartbeat_count: int,
    last_heartbeat: datetime
) -> None:
    """Handle messages that follow the envelope format"""
    try:
        message_type = envelope.type
        payload = envelope.payload
        
        # Extract correlation info from envelope
        correlation_request_id = envelope.request_id or request_id
        span_id = envelope.trace.span if envelope.trace else None
        
        if message_type == "ping":
            # Respond to client ping with envelope
            await send_pong(
                websocket=websocket,
                request_id=correlation_request_id,
                original_timestamp=envelope.timestamp,
                span=span_id
            )
            
        elif message_type == "pong":
            # Client responded to our ping
            logger.debug(
                "Received enveloped pong from client",
                extra={
                    "client_id": client_id,
                    "connection_id": connection_id,
                    "request_id": correlation_request_id
                }
            )
            
        elif message_type == "status":
            # Send enveloped connection status
            uptime_seconds = (datetime.now(timezone.utc) - connection_start_time).total_seconds()
            status_payload = {
                "connection_uptime_seconds": uptime_seconds,
                "heartbeat_count": heartbeat_count,
                "last_heartbeat": last_heartbeat.isoformat(),
                "client_id": client_id,
                "connection_id": connection_id
            }
            
            from backend.services.websocket.ws_sender import send_enveloped
            await send_enveloped(
                websocket=websocket,
                msg_type="status",
                payload=status_payload,
                request_id=correlation_request_id,
                span=span_id
            )
            
        else:
            # Echo unknown enveloped messages
            echo_payload = {
                "original_message": payload,
                "client_id": client_id,
                "message_type": message_type
            }
            
            from backend.services.websocket.ws_sender import send_enveloped
            await send_enveloped(
                websocket=websocket,
                msg_type="echo",
                payload=echo_payload,
                request_id=correlation_request_id,
                span=span_id
            )
            
    except Exception as e:
        logger.error(f"Error handling enveloped message: {e}")
        await send_error(
            websocket=websocket,
            error_message=f"Failed to process enveloped message: {str(e)}",
            error_code="MESSAGE_PROCESSING_ERROR",
            request_id=request_id
        )


async def handle_legacy_message(
    message_text: str,
    websocket: WebSocket,
    client_id: str,
    request_id: str,
    connection_start_time: datetime,
    heartbeat_count: int,
    last_heartbeat: datetime
) -> None:
    """Handle legacy (non-enveloped) messages with backward compatibility"""
    try:
        # Try to parse as JSON
        try:
            message = json.loads(message_text)
        except json.JSONDecodeError:
            await send_error(
                websocket=websocket,
                error_message="Invalid JSON format",
                error_code="INVALID_JSON",
                request_id=request_id
            )
            return
        
        message_type = message.get("type", "unknown")
        
        # Log legacy message warning (once per type)
        log_legacy_warning_once(message_type)
        
        # Handle legacy message types
        if message_type == "ping":
            # Respond with enveloped pong to encourage envelope adoption
            await send_pong(
                websocket=websocket,
                request_id=request_id,
                original_timestamp=message.get("timestamp")
            )
            
        elif message_type == "pong":
            logger.debug(
                "Received legacy pong from client",
                extra={"client_id": client_id}
            )
            
        elif message_type == "status":
            # Send enveloped status response
            uptime_seconds = (datetime.now(timezone.utc) - connection_start_time).total_seconds()
            status_payload = {
                "connection_uptime_seconds": uptime_seconds,
                "heartbeat_count": heartbeat_count,
                "last_heartbeat": last_heartbeat.isoformat(),
                "client_id": client_id,
                "legacy_request": True  # Flag to indicate this was a legacy request
            }
            
            from backend.services.websocket.ws_sender import send_enveloped
            await send_enveloped(
                websocket=websocket,
                msg_type="status",
                payload=status_payload,
                request_id=request_id,
                debug=True  # Mark as debug due to legacy compatibility
            )
            
        else:
            # Echo legacy message wrapped in envelope
            from backend.services.websocket.ws_sender import send_legacy_wrapped
            await send_legacy_wrapped(
                websocket=websocket,
                legacy_data=message,
                msg_type="echo",
                request_id=request_id
            )
            
    except Exception as e:
        logger.error(f"Error handling legacy message: {e}")
        await send_error(
            websocket=websocket,
            error_message=f"Failed to process legacy message: {str(e)}",
            error_code="LEGACY_MESSAGE_ERROR",
            request_id=request_id
        )