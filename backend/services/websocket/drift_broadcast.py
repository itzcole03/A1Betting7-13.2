"""
Drift Status Broadcasting Integration (PR11)

Integrates with existing drift monitoring services to broadcast status changes
via WebSocket to all connected clients with proper correlation tracking.
"""

import logging
from typing import Dict, Any, Optional
import asyncio

from ..websocket.ws_registry import get_connection_registry, broadcast_to_all_connections
from ..observability.event_bus import get_event_bus

logger = logging.getLogger(__name__)


async def broadcast_drift_status_change(
    new_status: str,
    metrics: Dict[str, Any],
    *,
    request_id: Optional[str] = None,
    span: Optional[str] = None
) -> int:
    """
    Broadcast drift status change to all WebSocket connections.
    
    This function should be called whenever a drift monitor detects a status change.
    It publishes to the event bus and broadcasts via WebSocket.
    
    Args:
        new_status: New drift status (e.g., "NO_DRIFT", "DRIFT_DETECTED", "DRIFT_CONFIRMED")
        metrics: Drift metrics and details
        request_id: Optional request ID for correlation
        span: Optional trace span ID
        
    Returns:
        Number of WebSocket connections that received the broadcast
    """
    try:
        # Publish to observability event bus first
        event_bus = get_event_bus()
        event_bus.publish(
            event_type="drift.status",
            data={
                "status": new_status,
                "metrics": metrics,
                "broadcast_triggered": True
            },
            request_id=request_id,
            trace_span=span
        )
        
        # Broadcast to all WebSocket connections
        payload = {
            "status": new_status,
            "metrics": metrics,
            "timestamp": event_bus.get_stats()["last_publish_time"]  # Use event bus timestamp for consistency
        }
        
        connections_notified = await broadcast_to_all_connections(
            msg_type="drift.status",
            payload=payload,
            request_id=request_id
        )
        
        logger.info(
            f"Drift status change broadcasted: {new_status} "
            f"(notified {connections_notified} connections)"
        )
        
        return connections_notified
        
    except Exception as e:
        logger.error(f"Failed to broadcast drift status change: {e}")
        return 0


class DriftBroadcastIntegration:
    """
    Integration helper for hooking drift monitoring services to WebSocket broadcasting.
    
    This class provides a standardized way for drift monitoring services to 
    register for status change notifications and automatically broadcast updates.
    """
    
    def __init__(self):
        """Initialize the drift broadcast integration"""
        self._is_initialized = False
        self._broadcast_enabled = True
        
    def initialize(self) -> bool:
        """
        Initialize the drift broadcast integration.
        
        Returns:
            True if initialization was successful, False otherwise
        """
        try:
            if self._is_initialized:
                logger.info("Drift broadcast integration already initialized")
                return True
            
            # Subscribe to drift status events in the event bus for logging/monitoring
            event_bus = get_event_bus()
            event_bus.subscribe("drift.status", self._on_drift_event)
            
            self._is_initialized = True
            logger.info("Drift broadcast integration initialized successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize drift broadcast integration: {e}")
            return False
    
    def _on_drift_event(self, event: Dict[str, Any]) -> None:
        """
        Handle drift events from the event bus (internal callback).
        
        Args:
            event: Drift event from the event bus
        """
        try:
            data = event.get("data", {})
            status = data.get("status", "unknown")
            
            logger.debug(f"Drift event received: {status}")
            
            # Could add additional processing here if needed
            # (e.g., alerting, logging to external systems)
            
        except Exception as e:
            logger.error(f"Error processing drift event: {e}")
    
    async def notify_status_change(
        self,
        new_status: str,
        metrics: Dict[str, Any],
        *,
        model_name: Optional[str] = None,
        request_id: Optional[str] = None,
        span: Optional[str] = None
    ) -> bool:
        """
        Notify of a drift status change and broadcast to WebSocket connections.
        
        Args:
            new_status: New drift status
            metrics: Drift metrics and details
            model_name: Optional model name for context
            request_id: Optional request ID for correlation
            span: Optional trace span ID
            
        Returns:
            True if broadcast was successful, False otherwise
        """
        try:
            if not self._broadcast_enabled:
                logger.debug("Drift broadcasting is disabled")
                return False
            
            # Enhance metrics with model context if provided
            enhanced_metrics = {**metrics}
            if model_name:
                enhanced_metrics["model_name"] = model_name
            
            # Broadcast the status change
            connections_notified = await broadcast_drift_status_change(
                new_status=new_status,
                metrics=enhanced_metrics,
                request_id=request_id,
                span=span
            )
            
            return connections_notified > 0
            
        except Exception as e:
            logger.error(f"Failed to notify drift status change: {e}")
            return False
    
    def enable_broadcasting(self) -> None:
        """Enable drift status broadcasting"""
        self._broadcast_enabled = True
        logger.info("Drift broadcasting enabled")
    
    def disable_broadcasting(self) -> None:
        """Disable drift status broadcasting"""
        self._broadcast_enabled = False
        logger.info("Drift broadcasting disabled")
    
    def is_broadcasting_enabled(self) -> bool:
        """Check if drift broadcasting is enabled"""
        return self._broadcast_enabled


# Global drift broadcast integration instance
_drift_integration_instance: Optional[DriftBroadcastIntegration] = None


def get_drift_broadcast_integration() -> DriftBroadcastIntegration:
    """
    Get the global drift broadcast integration instance (singleton).
    
    Returns:
        DriftBroadcastIntegration instance
    """
    global _drift_integration_instance
    
    if _drift_integration_instance is None:
        _drift_integration_instance = DriftBroadcastIntegration()
        # Auto-initialize
        try:
            _drift_integration_instance.initialize()
        except Exception as e:
            logger.error(f"Failed to auto-initialize drift broadcast integration: {e}")
    
    return _drift_integration_instance


# Hook functions for integration with existing drift monitoring services
async def on_drift_monitor_status_change(
    status: str,
    metrics: Dict[str, Any],
    model_id: Optional[str] = None
) -> None:
    """
    Hook function to be called by existing drift monitoring services.
    
    Usage in existing drift monitors:
        from backend.services.websocket.drift_broadcast import on_drift_monitor_status_change
        
        # In your drift detection logic:
        await on_drift_monitor_status_change("DRIFT_DETECTED", drift_metrics)
    
    Args:
        status: New drift status
        metrics: Drift detection metrics
        model_id: Optional model identifier
    """
    try:
        integration = get_drift_broadcast_integration()
        await integration.notify_status_change(
            new_status=status,
            metrics=metrics,
            model_name=model_id
        )
    except Exception as e:
        logger.error(f"Drift monitor hook failed: {e}")


def register_drift_callback_with_service(drift_service: Any) -> bool:
    """
    Register drift callback with existing drift monitoring service.
    
    This function attempts to integrate with common drift monitoring patterns
    by registering our callback with existing services.
    
    Args:
        drift_service: Existing drift monitoring service instance
        
    Returns:
        True if registration was successful, False otherwise
    """
    try:
        # Check for common callback registration patterns
        if hasattr(drift_service, 'register_callback'):
            drift_service.register_callback(on_drift_monitor_status_change)
            logger.info(f"Registered drift callback with {type(drift_service).__name__}")
            return True
        
        elif hasattr(drift_service, 'add_listener'):
            drift_service.add_listener('status_change', on_drift_monitor_status_change)
            logger.info(f"Added drift listener to {type(drift_service).__name__}")
            return True
        
        elif hasattr(drift_service, 'subscribe'):
            drift_service.subscribe('drift_status', on_drift_monitor_status_change)
            logger.info(f"Subscribed to drift events in {type(drift_service).__name__}")
            return True
        
        else:
            logger.warning(f"No compatible callback registration method found on {type(drift_service).__name__}")
            return False
            
    except Exception as e:
        logger.error(f"Failed to register drift callback with {type(drift_service).__name__}: {e}")
        return False


# Initialize drift broadcast integration on module import
drift_broadcast_integration = get_drift_broadcast_integration()