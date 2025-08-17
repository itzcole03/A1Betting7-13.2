"""
Delta Handler Manager

Coordinates all delta handlers and manages their lifecycle,
event routing, and dependency resolution.
"""

import asyncio
from datetime import datetime
from typing import Any, Dict, List, Optional
from dataclasses import dataclass

from .base_handler import BaseDeltaHandler, DeltaContext, ProcessingResult
from .valuation_handler import ValuationDeltaHandler
from .edge_handler import EdgeDeltaHandler
from .portfolio_handler import PortfolioRefreshHandler

from backend.services.unified_logging import get_logger
from backend.services.events import subscribe


@dataclass
class ManagerMetrics:
    """Delta handler manager metrics"""
    events_received: int = 0
    events_processed: int = 0
    events_failed: int = 0
    handlers_active: int = 0
    average_processing_time_ms: float = 0.0
    last_event_timestamp: Optional[datetime] = None


class DeltaHandlerManager:
    """Manages all delta handlers and coordinates their execution"""
    
    def __init__(self):
        self.logger = get_logger("delta_handler_manager")
        
        # Initialize handlers
        self.handlers: Dict[str, BaseDeltaHandler] = {}
        self._initialize_handlers()
        
        # Manager state
        self.is_running = False
        self.metrics = ManagerMetrics()
        
        # Event subscription
        self._setup_event_subscriptions()
        
    def _initialize_handlers(self):
        """Initialize all delta handlers"""
        
        # Create handlers
        valuation_handler = ValuationDeltaHandler()
        edge_handler = EdgeDeltaHandler()
        portfolio_handler = PortfolioRefreshHandler()
        
        # Register handlers
        self.handlers["valuation_delta"] = valuation_handler
        self.handlers["edge_delta"] = edge_handler
        self.handlers["portfolio_refresh"] = portfolio_handler
        
        # Setup dependencies
        edge_handler.register_dependency("valuation_delta", valuation_handler)
        portfolio_handler.register_dependency("valuation_delta", valuation_handler)
        portfolio_handler.register_dependency("edge_delta", edge_handler)
        
        self.metrics.handlers_active = len(self.handlers)
        
        self.logger.info(f"Initialized {len(self.handlers)} delta handlers")
        
    def _setup_event_subscriptions(self):
        """Subscribe to market events"""
        
        # Subscribe to all market events
        subscribe("MARKET_*", self._handle_market_event, use_weak_ref=False)
        
        self.logger.info("Subscribed to market events")
        
    async def _handle_market_event(self, event_type: str, payload: Dict[str, Any]):
        """Handle incoming market events"""
        
        try:
            self.metrics.events_received += 1
            self.metrics.last_event_timestamp = datetime.utcnow()
            
            self.logger.debug(f"Processing market event: {event_type}")
            
            # Convert event to delta context
            context = self._create_delta_context(event_type, payload)
            if not context:
                self.logger.warning(f"Could not create delta context for event: {event_type}")
                return
                
            # Process through all applicable handlers
            results = await self._process_delta(context)
            
            # Update metrics
            successful_results = [r for r in results if r and r.success]
            failed_results = [r for r in results if r and not r.success]
            
            self.metrics.events_processed += len(successful_results)
            self.metrics.events_failed += len(failed_results)
            
            # Update average processing time
            if successful_results:
                total_time = sum(r.processing_time_ms for r in successful_results)
                avg_time = total_time / len(successful_results)
                
                # Exponential moving average
                if self.metrics.average_processing_time_ms == 0:
                    self.metrics.average_processing_time_ms = avg_time
                else:
                    alpha = 0.1  # Smoothing factor
                    self.metrics.average_processing_time_ms = (
                        alpha * avg_time + (1 - alpha) * self.metrics.average_processing_time_ms
                    )
                    
            self.logger.info(
                f"Processed {event_type}: {len(successful_results)} successful, "
                f"{len(failed_results)} failed handlers"
            )
            
        except Exception as e:
            self.metrics.events_failed += 1
            self.logger.error(f"Error handling market event {event_type}: {e}")
            
    def _create_delta_context(self, event_type: str, payload: Dict[str, Any]) -> Optional[DeltaContext]:
        """Create delta context from market event"""
        
        try:
            # Extract context from payload
            prop_id = payload.get("prop_id")
            provider = payload.get("provider")
            timestamp_str = payload.get("timestamp")
            
            if not prop_id or not provider:
                self.logger.warning(f"Missing required fields in event payload: {payload}")
                return None
                
            # Parse timestamp
            if timestamp_str:
                try:
                    timestamp = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
                except (ValueError, AttributeError):
                    timestamp = datetime.utcnow()
            else:
                timestamp = datetime.utcnow()
                
            # Map event type to delta event type
            delta_event_type = self._map_event_type(event_type, payload)
            
            # Extract data
            current_data = payload.copy()
            previous_data = payload.get("previous_data")  # May not be available
            
            return DeltaContext(
                event_id=f"{event_type}_{prop_id}_{int(timestamp.timestamp())}",
                provider=provider,
                prop_id=prop_id,
                event_type=delta_event_type,
                timestamp=timestamp,
                previous_data=previous_data,
                current_data=current_data,
                metadata={"original_event_type": event_type}
            )
            
        except Exception as e:
            self.logger.error(f"Error creating delta context: {e}")
            return None
            
    def _map_event_type(self, event_type: str, payload: Dict[str, Any]) -> str:
        """Map market event type to delta event type"""
        
        # Simple mapping logic
        if "ADDED" in event_type or "NEW" in event_type:
            return "PROP_ADDED"
        elif "UPDATED" in event_type or "CHANGED" in event_type:
            return "PROP_UPDATED"
        elif "REMOVED" in event_type or "DELETED" in event_type:
            return "PROP_REMOVED"
        else:
            # Try to infer from payload
            if payload.get("previous_line") is not None:
                return "PROP_UPDATED"
            else:
                return "PROP_ADDED"  # Default assumption
                
    async def _process_delta(self, context: DeltaContext) -> List[Optional[ProcessingResult]]:
        """Process delta through all applicable handlers"""
        
        results = []
        
        # Process handlers in dependency order
        handler_order = ["valuation_delta", "edge_delta", "portfolio_refresh"]
        
        for handler_name in handler_order:
            if handler_name not in self.handlers:
                continue
                
            handler = self.handlers[handler_name]
            
            try:
                result = await handler.handle_delta(context)
                results.append(result)
                
                if result and not result.success:
                    self.logger.warning(
                        f"Handler {handler_name} failed for {context.prop_id}: "
                        f"{', '.join(result.errors)}"
                    )
                    
            except Exception as e:
                self.logger.error(f"Error in handler {handler_name}: {e}")
                results.append(ProcessingResult(
                    success=False,
                    handler_name=handler_name,
                    processing_time_ms=0,
                    affected_entities=[],
                    errors=[str(e)],
                    dependencies_triggered=[],
                    context=context
                ))
                
        return results
        
    def start(self):
        """Start the delta handler manager"""
        if self.is_running:
            self.logger.warning("Delta handler manager already running")
            return
            
        self.is_running = True
        self.logger.info("Delta handler manager started")
        
    def stop(self):
        """Stop the delta handler manager"""
        if not self.is_running:
            return
            
        self.is_running = False
        self.logger.info("Delta handler manager stopped")
        
    def get_status(self) -> Dict[str, Any]:
        """Get comprehensive manager status"""
        
        handler_statuses = {
            name: handler.get_status() 
            for name, handler in self.handlers.items()
        }
        
        return {
            "is_running": self.is_running,
            "metrics": {
                "events_received": self.metrics.events_received,
                "events_processed": self.metrics.events_processed,
                "events_failed": self.metrics.events_failed,
                "handlers_active": self.metrics.handlers_active,
                "average_processing_time_ms": self.metrics.average_processing_time_ms,
                "last_event_timestamp": self.metrics.last_event_timestamp.isoformat() if self.metrics.last_event_timestamp else None
            },
            "handlers": handler_statuses
        }
        
    def get_handler(self, name: str) -> Optional[BaseDeltaHandler]:
        """Get specific handler by name"""
        return self.handlers.get(name)
        

# Global instance
delta_handler_manager = DeltaHandlerManager()