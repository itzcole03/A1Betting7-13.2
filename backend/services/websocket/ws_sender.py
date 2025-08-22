"""
WebSocket Sender Utilities (PR11)

Provides unified API for sending enveloped WebSocket messages with automatic
observability event publishing and request correlation support.
"""

import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from fastapi import WebSocket
from fastapi.websockets import WebSocketState

from .envelope import build_envelope, WSEnvelope
from ..observability.event_bus import get_event_bus

logger = logging.getLogger(__name__)


async def send_enveloped(
    websocket: WebSocket,
    msg_type: str, 
    payload: Dict[str, Any],
    *,
    request_id: Optional[str] = None,
    span: Optional[str] = None, 
    parent_span: Optional[str] = None,
    retries: Optional[int] = None,
    debug: Optional[bool] = None
) -> bool:
    """
    Send an enveloped WebSocket message with automatic event bus publishing.
    
    Args:
        websocket: WebSocket connection to send message through
        msg_type: Type of message (e.g., "hello", "ping", "drift.status")  
        payload: Message payload data
        request_id: Optional request ID for correlation
        span: Optional trace span ID
        parent_span: Optional parent span ID
        retries: Optional retry count for meta
        debug: Optional debug flag for meta
        
    Returns:
        True if message was sent successfully, False otherwise
    """
    try:
        # Check WebSocket connection state
        if websocket.client_state != WebSocketState.CONNECTED:
            logger.warning(f"Cannot send {msg_type}: WebSocket not connected (state: {websocket.client_state})")
            return False
        
        # Build envelope
        envelope = build_envelope(
            msg_type=msg_type,
            payload=payload,
            request_id=request_id,
            span=span,
            parent_span=parent_span,
            retries=retries,
            debug=debug
        )
        
        # Convert to JSON
        message_json = envelope.to_json()
        
        # Send the message
        # Backwards-compatibility: some clients/tests expect a flat hello
        # message with payload fields promoted to top-level (legacy shape).
        if msg_type == "hello":
            try:
                # Build a flattened hello message that mirrors legacy format
                envelope_dict = envelope.to_dict()
                payload = envelope_dict.get("payload", {}) if isinstance(envelope_dict, dict) else {}

                # Feature aliasing for compatibility (tests expect these names)
                features = list(payload.get("features") or [])
                if "structured_errors" in features:
                    if "structured_messages" not in features:
                        features.append("structured_messages")
                    if "error_codes" not in features:
                        features.append("error_codes")

                flat_hello = {
                    "type": envelope_dict.get("type", "hello"),
                    "server_time": payload.get("server_time"),
                    "accepted_version": payload.get("accepted_version"),
                    "features": features,
                    "heartbeat_interval_ms": payload.get("heartbeat_interval_ms"),
                }

                # Preserve client_id and request_id if present
                if payload.get("client_id"):
                    flat_hello["client_id"] = payload.get("client_id")
                if envelope_dict.get("request_id"):
                    flat_hello["request_id"] = envelope_dict.get("request_id")

                await websocket.send_text(json.dumps(flat_hello))
            except Exception:
                # Fallback to sending the envelope if flattening fails
                await websocket.send_text(message_json)
        else:
            await websocket.send_text(message_json)
        
        # Publish to observability event bus
        event_bus = get_event_bus()
        event_bus.publish(
            event_type="ws.message.out",
            data={
                "type": msg_type,
                "payload_size": len(message_json),
                "client_remote": getattr(websocket.client, "host", "unknown") if websocket.client else "unknown",
                "envelope_version": envelope.envelope_version,
                "has_trace": envelope.trace is not None,
                "has_meta": envelope.meta is not None
            },
            request_id=request_id,
            trace_span=span
        )
        
        logger.debug(f"Sent enveloped message: {msg_type} (size: {len(message_json)} bytes)")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send enveloped message {msg_type}: {e}")
        
        # Publish error event to event bus
        try:
            event_bus = get_event_bus()
            event_bus.publish(
                event_type="ws.message.out",
                data={
                    "type": msg_type,
                    "error": str(e),
                    "error_type": type(e).__name__,
                    "success": False
                },
                request_id=request_id,
                trace_span=span
            )
        except Exception as bus_error:
            logger.error(f"Failed to publish WebSocket error event: {bus_error}")
        
        return False


async def send_hello(
    websocket: WebSocket,
    *,
    request_id: Optional[str] = None,
    client_id: Optional[str] = None,
    features: Optional[list] = None,
    span: Optional[str] = None
) -> bool:
    """
    Send a standardized hello message to establish WebSocket connection.
    
    Args:
        websocket: WebSocket connection
        request_id: Optional request ID for correlation
        client_id: Optional client identifier  
        features: Optional list of server features/capabilities
        span: Optional trace span ID
        
    Returns:
        True if hello was sent successfully, False otherwise
    """
    default_features = [
        "envelope_v1",
        "heartbeat", 
        "correlation_tracking",
        "structured_errors",
        "graceful_reconnect"
    ]
    
    payload = {
        "server_time": build_envelope("temp", {}).timestamp,  # Get consistent timestamp format
        "accepted_version": 1,
        "features": features or default_features,
        "heartbeat_interval_ms": 25000  # 25 second heartbeat
    }
    
    if client_id:
        payload["client_id"] = client_id
    
    return await send_enveloped(
        websocket=websocket,
        msg_type="hello",
        payload=payload,
        request_id=request_id,
        span=span
    )


async def send_ping(
    websocket: WebSocket,
    *,
    request_id: Optional[str] = None,
    heartbeat_count: Optional[int] = None,
    span: Optional[str] = None
) -> bool:
    """
    Send a ping message for heartbeat/keepalive.
    
    Args:
        websocket: WebSocket connection
        request_id: Optional request ID for correlation
        heartbeat_count: Optional heartbeat counter
        span: Optional trace span ID
        
    Returns:
        True if ping was sent successfully, False otherwise
    """
    payload = {}
    
    if heartbeat_count is not None:
        payload["heartbeat_count"] = heartbeat_count
    
    return await send_enveloped(
        websocket=websocket,
        msg_type="ping", 
        payload=payload,
        request_id=request_id,
        span=span
    )


async def send_pong(
    websocket: WebSocket,
    *,
    request_id: Optional[str] = None,
    original_timestamp: Optional[str] = None,
    span: Optional[str] = None
) -> bool:
    """
    Send a pong response to a client ping.
    
    Args:
        websocket: WebSocket connection
        request_id: Optional request ID for correlation
        original_timestamp: Optional timestamp from original ping
        span: Optional trace span ID
        
    Returns:
        True if pong was sent successfully, False otherwise
    """
    payload = {}
    
    if original_timestamp:
        payload["original_timestamp"] = original_timestamp
    
    return await send_enveloped(
        websocket=websocket,
        msg_type="pong",
        payload=payload,
        request_id=request_id,
        span=span
    )


async def send_error(
    websocket: WebSocket,
    error_message: str,
    *,
    error_code: Optional[str] = None,
    request_id: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    span: Optional[str] = None
) -> bool:
    """
    Send a structured error message.
    
    Args:
        websocket: WebSocket connection
        error_message: Human-readable error message
        error_code: Optional error code for programmatic handling
        request_id: Optional request ID for correlation
        details: Optional additional error details
        span: Optional trace span ID
        
    Returns:
        True if error was sent successfully, False otherwise
    """
    payload: Dict[str, Any] = {
        "message": error_message
    }
    
    if error_code:
        payload["error_code"] = error_code
    
    if details:
        payload["details"] = details
    
    return await send_enveloped(
        websocket=websocket,
        msg_type="error",
        payload=payload,
        request_id=request_id,
        span=span
    )


async def send_drift_status(
    websocket: WebSocket,
    drift_status: str,
    metrics: Dict[str, Any],
    *,
    request_id: Optional[str] = None,
    span: Optional[str] = None
) -> bool:
    """
    Send drift status update message.
    
    Args:
        websocket: WebSocket connection
        drift_status: Current drift status (e.g., "NO_DRIFT", "DRIFT_DETECTED", "DRIFT_CONFIRMED")
        metrics: Drift metrics and details
        request_id: Optional request ID for correlation
        span: Optional trace span ID
        
    Returns:
        True if drift status was sent successfully, False otherwise
    """
    payload = {
        "status": drift_status,
        "metrics": metrics
    }
    
    return await send_enveloped(
        websocket=websocket,
        msg_type="drift.status",
        payload=payload,
        request_id=request_id,
        span=span
    )


def record_inbound_message(
    message: str,
    websocket: WebSocket,
    *,
    request_id: Optional[str] = None,
    span: Optional[str] = None
) -> None:
    """
    Record an inbound WebSocket message to the observability event bus.
    
    Args:
        message: Raw message received from client
        websocket: WebSocket connection the message came from
        request_id: Optional request ID for correlation
        span: Optional trace span ID
    """
    try:
        # Try to parse as envelope to extract type
        message_type = "unknown"
        envelope_version = None
        
        try:
            parsed = json.loads(message)
            if isinstance(parsed, dict):
                message_type = parsed.get("type", "unknown")
                envelope_version = parsed.get("envelope_version")
        except json.JSONDecodeError:
            message_type = "raw_text"
        
        # Publish to event bus
        event_bus = get_event_bus()
        event_bus.publish(
            event_type="ws.message.in",
            data={
                "type": message_type,
                "message_size": len(message),
                "client_remote": getattr(websocket.client, "host", "unknown") if websocket.client else "unknown",
                "envelope_version": envelope_version,
                "is_enveloped": envelope_version is not None
            },
            request_id=request_id,
            trace_span=span
        )
        
        logger.debug(f"Recorded inbound message: {message_type} (size: {len(message)} bytes)")
        
    except Exception as e:
        logger.error(f"Failed to record inbound message: {e}")
async def send_legacy_wrapped(
    websocket: WebSocket, 
    legacy_data: dict,
    msg_type: str = "legacy_echo",
    request_id: Optional[str] = None,
    debug: bool = True
) -> bool:
    """
    Send legacy data wrapped in a modern envelope.
    
    Used for backward compatibility when legacy clients send non-enveloped messages.
    The server responds with an envelope that contains the legacy data for consistency.
    
    Args:
        websocket: WebSocket connection
        legacy_data: Original legacy message data to wrap
        msg_type: Envelope message type
        request_id: Request ID for correlation
        debug: Mark as debug message for monitoring
        
    Returns:
        True if message sent successfully
    """
    try:
        # Wrap legacy data in envelope payload
        payload = {
            "legacy_request": True,
            "original_data": legacy_data,
            "wrapped_at": datetime.now(timezone.utc).isoformat(),
            "notice": "This is a legacy message wrapped in an envelope. Please consider upgrading to envelope format."
        }
        
        return await send_enveloped(
            websocket=websocket,
            msg_type=msg_type,
            payload=payload,
            request_id=request_id,
            debug=debug
        )
        
    except Exception as e:
        logger.error(f"Failed to send legacy wrapped message: {e}")
        return False