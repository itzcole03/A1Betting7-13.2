"""
Market Streamer - Polling facade for real-time market data streaming

Provides pseudo-streaming by polling providers at intervals with jitter,
detecting changes, and emitting normalized delta events.
"""

import asyncio
import hashlib
import random
from collections import deque
from datetime import datetime
from dataclasses import dataclass
from typing import Dict, List, Optional, Callable, Any, Deque
from enum import Enum

from backend.services.providers import (
    provider_registry,
    ExternalPropRecord,
    ProviderError
)
from backend.services.unified_logging import get_logger
from backend.services.unified_config import unified_config


class MarketEventType(Enum):
    """Market delta event types"""
    MARKET_PROP_CREATED = "MARKET_PROP_CREATED"
    MARKET_LINE_CHANGE = "MARKET_LINE_CHANGE"
    MARKET_PROP_INACTIVE = "MARKET_PROP_INACTIVE"


@dataclass
class MarketEvent:
    """Market delta event"""
    event_type: MarketEventType
    provider: str
    prop_id: str
    previous_line: Optional[float]
    new_line: float
    line_hash: str
    timestamp: datetime
    
    # Additional event data
    player_name: Optional[str] = None
    team_code: Optional[str] = None
    market_type: Optional[str] = None
    prop_category: Optional[str] = None
    status: Optional[str] = None
    odds_value: Optional[float] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert event to dictionary"""
        return {
            "type": self.event_type.value,
            "provider": self.provider,
            "prop_id": self.prop_id,
            "previous_line": self.previous_line,
            "new_line": self.new_line,
            "line_hash": self.line_hash,
            "ts": self.timestamp.isoformat(),
            "player_name": self.player_name,
            "team_code": self.team_code,
            "market_type": self.market_type,
            "prop_category": self.prop_category,
            "status": self.status,
            "odds_value": self.odds_value
        }


class MarketStreamer:
    """Market data streaming facade using polling with jitter"""
    
    def __init__(self):
        self.logger = get_logger("market_streamer")
        self.is_running = False
        self._stop_event = asyncio.Event()
        self._task: Optional[asyncio.Task] = None
        
        # Configuration
        self.poll_interval = unified_config.get_config_value("streaming.poll_interval_sec", 20)
        self.jitter_sec = unified_config.get_config_value("streaming.jitter_sec", 5)
        self.event_buffer_size = unified_config.get_config_value("streaming.event_buffer", 1000)
        
        # Event buffer (circular)
        self.event_buffer: Deque[MarketEvent] = deque(maxlen=self.event_buffer_size)
        
        # Provider state tracking
        self._provider_snapshots: Dict[str, Dict[str, Any]] = {}
        self._provider_last_fetch: Dict[str, datetime] = {}
        
        # Statistics
        self.stats = {
            "cycles_completed": 0,
            "events_emitted": 0,
            "errors_encountered": 0,
            "last_cycle_duration_ms": 0,
            "providers_processed": 0
        }
        
    def _generate_line_hash(self, prop: ExternalPropRecord) -> str:
        """Generate hash for prop line to detect changes"""
        hash_data = f"{prop.provider_prop_id}:{prop.line_value}:{prop.odds_value}:{prop.status}"
        return hashlib.md5(hash_data.encode()).hexdigest()[:16]
        
    def _compare_props(self, old_prop: Dict[str, Any], new_prop: ExternalPropRecord) -> Optional[MarketEvent]:
        """Compare old and new prop, return event if changed"""
        new_hash = self._generate_line_hash(new_prop)
        old_hash = old_prop.get("line_hash")
        
        if new_hash == old_hash:
            return None  # No change
            
        # Determine event type
        if old_prop.get("status") == "active" and new_prop.status == "inactive":
            event_type = MarketEventType.MARKET_PROP_INACTIVE
        else:
            event_type = MarketEventType.MARKET_LINE_CHANGE
            
        return MarketEvent(
            event_type=event_type,
            provider=old_prop["provider"],
            prop_id=new_prop.provider_prop_id,
            previous_line=old_prop.get("line_value"),
            new_line=new_prop.line_value,
            line_hash=new_hash,
            timestamp=datetime.utcnow(),
            player_name=new_prop.player_name,
            team_code=new_prop.team_code,
            market_type=new_prop.market_type,
            prop_category=new_prop.prop_category,
            status=new_prop.status,
            odds_value=new_prop.odds_value
        )
        
    def _process_provider_data(self, provider_name: str, props: List[ExternalPropRecord]) -> List[MarketEvent]:
        """Process provider data and generate events"""
        events = []
        current_snapshot = {}
        
        # Get previous snapshot for comparison
        previous_snapshot = self._provider_snapshots.get(provider_name, {})
        
        # Process each prop
        for prop in props:
            prop_key = prop.provider_prop_id
            line_hash = self._generate_line_hash(prop)
            
            # Store current prop data
            current_snapshot[prop_key] = {
                "provider": provider_name,
                "line_value": prop.line_value,
                "odds_value": prop.odds_value,
                "status": prop.status,
                "line_hash": line_hash,
                "updated_ts": prop.updated_ts
            }
            
            # Compare with previous
            if prop_key in previous_snapshot:
                event = self._compare_props(previous_snapshot[prop_key], prop)
                if event:
                    events.append(event)
            else:
                # New prop
                event = MarketEvent(
                    event_type=MarketEventType.MARKET_PROP_CREATED,
                    provider=provider_name,
                    prop_id=prop.provider_prop_id,
                    previous_line=None,
                    new_line=prop.line_value,
                    line_hash=line_hash,
                    timestamp=datetime.utcnow(),
                    player_name=prop.player_name,
                    team_code=prop.team_code,
                    market_type=prop.market_type,
                    prop_category=prop.prop_category,
                    status=prop.status,
                    odds_value=prop.odds_value
                )
                events.append(event)
                
        # Update snapshot
        self._provider_snapshots[provider_name] = current_snapshot
        
        return events
        
    async def _fetch_from_provider(self, provider_name: str) -> List[MarketEvent]:
        """Fetch data from a single provider and generate events"""
        try:
            provider = provider_registry.get_provider(provider_name)
            if not provider:
                self.logger.warning(f"Provider {provider_name} not found")
                return []
                
            last_fetch = self._provider_last_fetch.get(provider_name)
            
            # Use incremental if available and we have a last fetch time
            if provider.supports_incremental and last_fetch:
                props = await provider.fetch_incremental(last_fetch)
            else:
                # Full snapshot
                props = await provider.fetch_snapshot()
                
            # Update last fetch time
            self._provider_last_fetch[provider_name] = datetime.utcnow()
            
            # Process and generate events
            events = self._process_provider_data(provider_name, props)
            
            self.logger.debug(f"Provider {provider_name}: {len(props)} props, {len(events)} events")
            return events
            
        except ProviderError as e:
            self.logger.error(f"Provider error for {provider_name}: {str(e)}")
            self.stats["errors_encountered"] += 1
            return []
        except Exception as e:
            self.logger.error(f"Unexpected error fetching from {provider_name}: {str(e)}")
            self.stats["errors_encountered"] += 1
            return []
            
    async def _streaming_cycle(self) -> None:
        """Execute one streaming cycle"""
        cycle_start = datetime.utcnow()
        
        # Get active providers
        active_providers = provider_registry.get_active_providers()
        if not active_providers:
            self.logger.debug("No active providers available")
            return
            
        self.logger.debug(f"Starting cycle with {len(active_providers)} providers")
        
        # Fetch from all providers concurrently
        tasks = [
            self._fetch_from_provider(name) 
            for name in active_providers.keys()
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Collect all events
        all_events = []
        providers_processed = 0
        
        for provider_name, result in zip(active_providers.keys(), results):
            if isinstance(result, Exception):
                self.logger.error(f"Provider {provider_name} task failed: {str(result)}")
                self.stats["errors_encountered"] += 1
            elif isinstance(result, list):  # Type check for list of MarketEvent
                all_events.extend(result)
                providers_processed += 1
                
        # Add events to buffer and emit
        for event in all_events:
            self.event_buffer.append(event)
            await self._emit_event(event)
            
        # Update stats
        cycle_duration = (datetime.utcnow() - cycle_start).total_seconds() * 1000
        self.stats["cycles_completed"] += 1
        self.stats["events_emitted"] += len(all_events)
        self.stats["last_cycle_duration_ms"] = int(cycle_duration)
        self.stats["providers_processed"] = providers_processed
        
        self.logger.info(
            f"Cycle complete: {providers_processed} providers, "
            f"{len(all_events)} events, {cycle_duration:.1f}ms"
        )
        
    async def _emit_event(self, event: MarketEvent) -> None:
        """Emit event to event bus"""
        from backend.services.events import publish
        
        # Emit structured event
        publish("MARKET_EVENT", {
            "event_type": event.event_type.value,
            "provider": event.provider,
            "prop_id": event.prop_id,
            "previous_line": event.previous_line,
            "new_line": event.new_line,
            "timestamp": event.timestamp.isoformat(),
            "player_name": event.player_name,
            "team_code": event.team_code,
            "market_type": event.market_type,
            "prop_category": event.prop_category,
            "status": event.status,
            "odds_value": event.odds_value
        })
        
        # Also emit type-specific events for targeted subscriptions
        publish(f"MARKET_{event.event_type.value}", event)
        
        self.logger.debug(f"Event emitted: {event.event_type.value} for {event.prop_id}")
        
    async def _streaming_loop(self) -> None:
        """Main streaming loop with jitter"""
        self.logger.info("Market streaming loop started")
        
        while not self._stop_event.is_set():
            try:
                # Execute cycle
                await self._streaming_cycle()
                
                # Calculate sleep time with jitter
                base_interval = self.poll_interval
                jitter = random.uniform(-self.jitter_sec, self.jitter_sec)
                sleep_time = max(1, base_interval + jitter)  # Minimum 1 second
                
                self.logger.debug(f"Sleeping for {sleep_time:.1f}s until next cycle")
                
                # Sleep with cancellation check
                try:
                    await asyncio.wait_for(
                        self._stop_event.wait(), 
                        timeout=sleep_time
                    )
                    # If we get here, stop was requested
                    break
                except asyncio.TimeoutError:
                    # Normal case - continue loop
                    continue
                    
            except Exception as e:
                self.logger.error(f"Error in streaming loop: {str(e)}")
                self.stats["errors_encountered"] += 1
                
                # Sleep before retrying
                await asyncio.sleep(5)
                
        self.logger.info("Market streaming loop stopped")
        
    async def start(self) -> None:
        """Start the market streamer"""
        if self.is_running:
            self.logger.warning("Streamer already running")
            return
            
        self.logger.info("Starting market streamer")
        self.is_running = True
        self._stop_event.clear()
        
        # Start the streaming task
        self._task = asyncio.create_task(self._streaming_loop())
        
        self.logger.info("Market streamer started successfully")
        
    async def stop(self) -> None:
        """Stop the market streamer"""
        if not self.is_running:
            self.logger.warning("Streamer not running")
            return
            
        self.logger.info("Stopping market streamer")
        self.is_running = False
        self._stop_event.set()
        
        if self._task:
            try:
                await asyncio.wait_for(self._task, timeout=10)
            except asyncio.TimeoutError:
                self.logger.warning("Streamer stop timeout, cancelling task")
                self._task.cancel()
                
        self.logger.info("Market streamer stopped")
        
    def get_recent_events(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Get recent events from buffer"""
        recent_events = list(self.event_buffer)[-limit:] if limit else list(self.event_buffer)
        return [event.to_dict() for event in recent_events]
        
    def get_status(self) -> Dict[str, Any]:
        """Get streamer status and statistics"""
        active_providers = provider_registry.get_active_providers()
        
        return {
            "running": self.is_running,
            "active_providers": len(active_providers),
            "provider_names": list(active_providers.keys()),
            "event_buffer_size": len(self.event_buffer),
            "configuration": {
                "poll_interval_sec": self.poll_interval,
                "jitter_sec": self.jitter_sec,
                "buffer_size": self.event_buffer_size
            },
            "statistics": self.stats.copy()
        }
        
    def clear_stats(self) -> None:
        """Clear statistics counters"""
        self.stats = {
            "cycles_completed": 0,
            "events_emitted": 0,
            "errors_encountered": 0,
            "last_cycle_duration_ms": 0,
            "providers_processed": 0
        }


# Global streamer instance
market_streamer = MarketStreamer()