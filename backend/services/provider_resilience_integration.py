"""
Enhanced MLBProviderClient Integration

Demonstrates integration of the ProviderResilienceManager with existing provider clients.
This shows how to wrap existing provider operations with resilience tracking.
"""

import asyncio
import time
import logging
from typing import Any, Dict, List, Optional, Tuple

from ..services.provider_resilience_manager import provider_resilience_manager
from ..services.mlb_provider_client import MLBProviderClient


class ResilientMLBProviderClient:
    """
    Enhanced MLBProviderClient with integrated resilience management.
    
    This wrapper demonstrates how to integrate the ProviderResilienceManager
    with existing provider clients to add operational risk reduction features.
    """
    
    def __init__(self, provider_id: str = "mlb_provider"):
        self.provider_id = provider_id
        self.client = MLBProviderClient()
        self.logger = logging.getLogger(f"resilient_mlb_provider.{provider_id}")
        
        # Register this provider with the resilience manager
        asyncio.create_task(self._register_provider())
    
    async def _register_provider(self):
        """Register provider with custom configuration"""
        config = {
            "backoff_base_sec": 2.0,  # Start with 2-second backoff
            "backoff_max_sec": 300.0,  # Max 5 minutes backoff
            "backoff_multiplier": 2.0,  # Standard exponential backoff
        }
        await provider_resilience_manager.register_provider(self.provider_id, config)
    
    async def fetch_player_props_with_resilience(self, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Fetch player props with integrated resilience management.
        
        This demonstrates the operational risk reduction patterns:
        1. Check backoff before making requests
        2. Record all request outcomes
        3. Handle failures gracefully with exponential backoff
        """
        # Check if provider should be skipped due to backoff
        should_skip, retry_after = await provider_resilience_manager.should_skip_provider(self.provider_id)
        if should_skip:
            self.logger.warning(f"Provider {self.provider_id} in backoff, retry after {retry_after:.1f}s")
            return []  # Return empty result during backoff
        
        start_time = time.time()
        success = False
        error = None
        result = []
        
        try:
            # Make the actual request
            result = await self.client.fetch_player_props_theodds()
            if limit and len(result) > limit:
                result = result[:limit]
            
            success = True
            self.logger.info(f"Successfully fetched {len(result)} props from {self.provider_id}")
            
        except Exception as e:
            success = False
            error = e
            self.logger.error(f"Failed to fetch props from {self.provider_id}: {e}")
        
        finally:
            # Always record the request outcome
            latency_ms = (time.time() - start_time) * 1000
            await provider_resilience_manager.record_provider_request(
                provider_id=self.provider_id,
                success=success,
                latency_ms=latency_ms,
                error=error
            )
        
        return result
    
    async def fetch_odds_with_resilience(self, market_type: str = "regular") -> List[Dict[str, Any]]:
        """Fetch odds with resilience tracking"""
        should_skip, retry_after = await provider_resilience_manager.should_skip_provider(self.provider_id)
        if should_skip:
            self.logger.warning(f"Provider {self.provider_id} in backoff for odds, retry after {retry_after:.1f}s")
            return []
        
        start_time = time.time()
        success = False
        error = None
        result = []
        
        try:
            result = await self.client.fetch_odds_comparison(market_type)
            success = True
            self.logger.info(f"Successfully fetched odds for {market_type} from {self.provider_id}")
            
        except Exception as e:
            success = False
            error = e
            self.logger.error(f"Failed to fetch odds from {self.provider_id}: {e}")
        
        finally:
            latency_ms = (time.time() - start_time) * 1000
            await provider_resilience_manager.record_provider_request(
                provider_id=self.provider_id,
                success=success,
                latency_ms=latency_ms,
                error=error
            )
        
        return result
    
    async def get_provider_health(self) -> Dict[str, Any]:
        """Get current provider health status"""
        return provider_resilience_manager.get_provider_state(self.provider_id) or {}
    
    async def simulate_line_change_event(self, prop_id: str, new_odds: float) -> bool:
        """
        Simulate a line change event to demonstrate micro-batching and debouncing.
        
        This shows how line change events are processed with:
        1. Debounce logic to prevent excessive recomputes
        2. Micro-batching to aggregate related events
        """
        event_data = {
            "prop_id": prop_id,
            "new_odds": new_odds,
            "provider_id": self.provider_id,
            "timestamp": time.time(),
        }
        
        # Add event to micro-batching system
        was_added = await provider_resilience_manager.add_recompute_event(
            prop_id=prop_id,
            event_type="odds_change",
            data=event_data
        )
        
        if was_added:
            self.logger.info(f"Line change event added for prop {prop_id}: {new_odds}")
        else:
            self.logger.debug(f"Line change event debounced for prop {prop_id}")
        
        return was_added


class ProviderResilienceDemo:
    """
    Demonstration of provider resilience features.
    
    This class shows how the operational risk reduction features work in practice.
    """
    
    def __init__(self):
        self.logger = logging.getLogger("provider_resilience_demo")
        self.resilient_client = ResilientMLBProviderClient("mlb_demo_provider")
    
    async def demo_exponential_backoff(self):
        """
        Demonstrate exponential backoff behavior under failures.
        
        This simulates provider failures to show how the backoff system works.
        """
        self.logger.info("Starting exponential backoff demonstration")
        
        # Simulate a series of failures followed by success
        for i in range(5):
            start_time = time.time()
            
            # Simulate failure (record unsuccessful request)
            await provider_resilience_manager.record_provider_request(
                provider_id="demo_failing_provider",
                success=False,
                latency_ms=1000.0,  # Simulate slow failure
                error=Exception(f"Simulated failure #{i+1}")
            )
            
            # Check provider state after failure
            state = provider_resilience_manager.get_provider_state("demo_failing_provider")
            if state:
                self.logger.info(f"Failure #{i+1} - Consecutive failures: {state['consecutive_failures']}, "
                               f"Backoff: {state['backoff_current_sec']:.1f}s, "
                               f"State: {state['current_state']}")
            
            # Wait a bit between failures
            await asyncio.sleep(0.5)
        
        # Now simulate recovery
        await provider_resilience_manager.record_provider_request(
            provider_id="demo_failing_provider",
            success=True,
            latency_ms=200.0,
            error=None
        )
        
        final_state = provider_resilience_manager.get_provider_state("demo_failing_provider")
        if final_state:
            self.logger.info(f"Recovery - Consecutive failures: {final_state['consecutive_failures']}, "
                           f"State: {final_state['current_state']}")
    
    async def demo_micro_batching(self):
        """
        Demonstrate micro-batching of line change events.
        
        This shows how multiple line changes for the same prop are batched together.
        """
        self.logger.info("Starting micro-batching demonstration")
        
        # Register a handler for recompute batch events
        async def handle_recompute_batch(data):
            self.logger.info(f"Processing recompute batch for prop {data['prop_id']}: "
                           f"{data['event_count']} events, {data['batch_age_ms']:.1f}ms old")
        
        await provider_resilience_manager.register_event_handler("recompute_batch", handle_recompute_batch)
        
        # Simulate rapid line changes for the same prop
        prop_id = "player_123_hits_over_2.5"
        
        for odds in [1.85, 1.90, 1.88, 1.92, 1.87]:
            await self.resilient_client.simulate_line_change_event(prop_id, odds)
            await asyncio.sleep(0.05)  # 50ms between changes
        
        # Wait for batch to be processed
        await asyncio.sleep(0.5)
        self.logger.info("Micro-batching demonstration completed")
    
    async def demo_event_bus_reliability(self):
        """
        Demonstrate event bus reliability with exception handling.
        
        This shows how the system handles handler failures and maintains stability.
        """
        self.logger.info("Starting event bus reliability demonstration")
        
        # Register a failing handler
        def failing_handler(data):
            raise Exception("Simulated handler failure")
        
        # Register a working handler  
        def working_handler(data):
            self.logger.info(f"Working handler processed: {data.get('test_data', 'unknown')}")
        
        await provider_resilience_manager.register_event_handler("test_event", failing_handler)
        await provider_resilience_manager.register_event_handler("test_event", working_handler)
        
        # Emit events that will cause the failing handler to fail repeatedly
        for i in range(5):
            await provider_resilience_manager.emit_event("test_event", {"test_data": f"event_{i+1}"})
            await asyncio.sleep(0.1)
        
        # Check system status to see dead letter log
        status = provider_resilience_manager.get_system_status()
        self.logger.info(f"System status after failures: "
                       f"Dead letters: {status['dead_letter_count']}, "
                       f"Handler exceptions: {status['handler_exception_count']}")
    
    async def run_full_demo(self):
        """Run all demonstration scenarios"""
        self.logger.info("Starting comprehensive provider resilience demonstration")
        
        try:
            await self.demo_exponential_backoff()
            await asyncio.sleep(1)
            
            await self.demo_micro_batching()
            await asyncio.sleep(1)
            
            await self.demo_event_bus_reliability()
            await asyncio.sleep(1)
            
            # Show overall system status
            status = provider_resilience_manager.get_system_status()
            self.logger.info("Final system status:")
            self.logger.info(f"  Total providers: {status['total_providers']}")
            self.logger.info(f"  Healthy providers: {status['healthy_providers']}")
            self.logger.info(f"  Degraded providers: {status['degraded_providers']}")
            self.logger.info(f"  Active micro-batches: {status['active_micro_batches']}")
            self.logger.info(f"  Debounce entries: {status['debounce_entries']}")
            self.logger.info(f"  Dead letter count: {status['dead_letter_count']}")
            
            self.logger.info("Provider resilience demonstration completed successfully")
            
        except Exception as e:
            self.logger.error(f"Demo failed: {e}", exc_info=True)


# Export integration classes
__all__ = [
    "ResilientMLBProviderClient",
    "ProviderResilienceDemo",
]