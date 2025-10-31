"""
WebSocket Message Envelope System (PR11)

Provides standardized JSON envelope format for all server->client WebSocket messages
with support for request correlation, trace metadata, and backward compatibility.
"""

import json
import logging
import threading
from datetime import datetime, timezone
from typing import Any, Optional, Dict, Union
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class TraceContext:
    """Trace context for request correlation"""
    span: Optional[str] = None
    parent_span: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Optional[str]]:
        """Convert to dictionary, filtering None values"""
        return {k: v for k, v in {"span": self.span, "parent_span": self.parent_span}.items() if v is not None}


@dataclass
class EnvelopeMeta:
    """Optional metadata for envelope"""
    retries: Optional[int] = None
    debug: Optional[bool] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary, filtering None values"""
        result = {}
        if self.retries is not None:
            result["retries"] = self.retries
        if self.debug is not None:
            result["debug"] = self.debug
        return result


@dataclass
class WSEnvelope:
    """
    Standardized WebSocket message envelope.
    
    Format:
    {
        "envelope_version": 1,
        "type": "<domain_type>",
        "timestamp": "<ISO8601>",
        "request_id": "<uuid or null>",
        "trace": { "span": "<id?>", "parent_span": "<id?>" },
        "payload": { ...domain data... },
        "meta": { "retries"?: n, "debug"?: bool }
    }
    """
    envelope_version: int
    type: str
    timestamp: str
    payload: Dict[str, Any]
    request_id: Optional[str] = None
    trace: Optional[TraceContext] = None
    meta: Optional[EnvelopeMeta] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert envelope to dictionary for JSON serialization"""
        result = {
            "envelope_version": self.envelope_version,
            "type": self.type,
            "timestamp": self.timestamp,
            "payload": self.payload
        }
        
        # Add optional fields only if they have content
        if self.request_id is not None:
            result["request_id"] = self.request_id
        else:
            result["request_id"] = None  # Explicit null for clarity
            
        if self.trace:
            trace_dict = self.trace.to_dict()
            if trace_dict:  # Only add if has content
                result["trace"] = trace_dict
        
        if self.meta:
            meta_dict = self.meta.to_dict()
            if meta_dict:  # Only add if has content
                result["meta"] = meta_dict
        
        return result
    
    def to_json(self) -> str:
        """Convert envelope to JSON string"""
        return json.dumps(self.to_dict())


def now_iso() -> str:
    """Get current timestamp in ISO8601 format"""
    return datetime.now(timezone.utc).isoformat()


def build_envelope(
    msg_type: str, 
    payload: Dict[str, Any],
    request_id: Optional[str] = None,
    span: Optional[str] = None,
    parent_span: Optional[str] = None,
    retries: Optional[int] = None,
    debug: Optional[bool] = None
) -> WSEnvelope:
    """
    Build a standardized WebSocket envelope.
    
    Args:
        msg_type: Message type (e.g., "hello", "ping", "drift.status")
        payload: Message payload data
        request_id: Optional request ID for correlation
        span: Optional trace span ID
        parent_span: Optional parent span ID
        retries: Optional retry count for meta
        debug: Optional debug flag for meta
        
    Returns:
        WSEnvelope instance
    """
    # Build trace context if span info provided
    trace_context = None
    if span or parent_span:
        trace_context = TraceContext(span=span, parent_span=parent_span)
    
    # Build meta if any meta info provided
    envelope_meta = None
    if retries is not None or debug is not None:
        envelope_meta = EnvelopeMeta(retries=retries, debug=debug)
    
    return WSEnvelope(
        envelope_version=1,
        type=msg_type,
        timestamp=now_iso(),
        payload=payload,
        request_id=request_id,
        trace=trace_context,
        meta=envelope_meta
    )


def is_enveloped_message(message: Union[str, Dict[str, Any]]) -> bool:
    """
    Check if a message follows the envelope format.
    
    Args:
        message: JSON string or dictionary to check
        
    Returns:
        True if message has envelope_version field, False otherwise
    """
    try:
        if isinstance(message, str):
            data = json.loads(message)
        else:
            data = message
            
        return isinstance(data, dict) and "envelope_version" in data
        
    except (json.JSONDecodeError, TypeError):
        return False


def parse_envelope(message: Union[str, Dict[str, Any]]) -> Optional[WSEnvelope]:
    """
    Parse a message into a WSEnvelope if it's properly formatted.
    
    Args:
        message: JSON string or dictionary to parse
        
    Returns:
        WSEnvelope instance if valid, None otherwise
    """
    try:
        if isinstance(message, str):
            data = json.loads(message)
        else:
            data = message
        
        if not isinstance(data, dict) or "envelope_version" not in data:
            return None
        
        # Extract trace context if present
        trace_context = None
        if "trace" in data and isinstance(data["trace"], dict):
            trace_context = TraceContext(
                span=data["trace"].get("span"),
                parent_span=data["trace"].get("parent_span")
            )
        
        # Extract meta if present
        envelope_meta = None
        if "meta" in data and isinstance(data["meta"], dict):
            envelope_meta = EnvelopeMeta(
                retries=data["meta"].get("retries"),
                debug=data["meta"].get("debug")
            )
        
        return WSEnvelope(
            envelope_version=data.get("envelope_version", 1),
            type=data.get("type", "unknown"),
            timestamp=data.get("timestamp", now_iso()),
            payload=data.get("payload", {}),
            request_id=data.get("request_id"),
            trace=trace_context,
            meta=envelope_meta
        )
        
    except (json.JSONDecodeError, KeyError, TypeError) as e:
        logger.warning(f"Failed to parse envelope: {e}")
        return None


def wrap_legacy_message(message: Union[str, Dict[str, Any]], msg_type: str = "legacy") -> WSEnvelope:
    """
    Wrap a legacy (non-enveloped) message in an envelope.
    
    Args:
        message: Legacy message to wrap
        msg_type: Type to assign to the wrapped message
        
    Returns:
        WSEnvelope with legacy message as payload
    """
    try:
        if isinstance(message, str):
            try:
                payload = {"raw_message": json.loads(message)}
            except json.JSONDecodeError:
                payload = {"raw_message": message}
        else:
            payload = {"legacy_data": message}
        
        return build_envelope(msg_type, payload)
        
    except Exception as e:
        logger.error(f"Failed to wrap legacy message: {e}")
        return build_envelope("error", {"error": "Failed to wrap legacy message", "original": str(message)})


def validate_envelope_format(envelope_dict: Dict[str, Any]) -> tuple[bool, Optional[str]]:
    """
    Validate that a dictionary conforms to envelope format.
    
    Args:
        envelope_dict: Dictionary to validate
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    try:
        # Required fields
        required_fields = ["envelope_version", "type", "timestamp", "payload"]
        
        for field in required_fields:
            if field not in envelope_dict:
                return False, f"Missing required field: {field}"
        
        # Type validation
        if not isinstance(envelope_dict["envelope_version"], int):
            return False, "envelope_version must be an integer"
            
        if not isinstance(envelope_dict["type"], str):
            return False, "type must be a string"
            
        if not isinstance(envelope_dict["timestamp"], str):
            return False, "timestamp must be a string"
            
        if not isinstance(envelope_dict["payload"], dict):
            return False, "payload must be a dictionary"
        
        # Version validation
        if envelope_dict["envelope_version"] != 1:
            return False, f"Unsupported envelope version: {envelope_dict['envelope_version']}"
        
        # Optional field validation
        if "request_id" in envelope_dict and envelope_dict["request_id"] is not None:
            if not isinstance(envelope_dict["request_id"], str):
                return False, "request_id must be a string or null"
        
        if "trace" in envelope_dict and envelope_dict["trace"] is not None:
            if not isinstance(envelope_dict["trace"], dict):
                return False, "trace must be a dictionary or null"
        
        if "meta" in envelope_dict and envelope_dict["meta"] is not None:
            if not isinstance(envelope_dict["meta"], dict):
                return False, "meta must be a dictionary or null"
        
        return True, None
        
    except Exception as e:
        return False, f"Validation error: {e}"


# Legacy compatibility warning tracker (to avoid spam)
_legacy_warnings_logged: set[str] = set()
_warning_lock = threading.Lock()


def log_legacy_warning_once(message_type: str) -> None:
    """
    Log a warning about legacy message format, but only once per message type.
    
    Args:
        message_type: Type of legacy message to warn about
    """
    import threading
    
    global _legacy_warnings_logged, _warning_lock
    
    with _warning_lock:
        if message_type not in _legacy_warnings_logged:
            logger.warning(
                f"Legacy unenveloped message type '{message_type}' encountered. "
                f"Consider upgrading to envelope format for better observability."
            )
            _legacy_warnings_logged.add(message_type)