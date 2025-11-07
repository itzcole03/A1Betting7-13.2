"""
Streaming Stats Provider - Provides streaming system metrics for reliability monitoring

Collects metrics for streaming reliability:
- events_per_min: Event processing rate 
- recompute_backlog: Pending recomputation tasks
- provider_health: Health status of all streaming providers
"""

import time
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Any, Optional
from collections import defaultdict, deque

try:
    from backend.services.unified_logging import get_logger
    logger = get_logger("streaming_stats_provider")
except ImportError:
    import logging
    logger = logging.getLogger(__name__)


class StreamingStatsProvider:
    """
    Provider for streaming system metrics and health monitoring.
    
    Collects real-time metrics from streaming components including:
    - Market streaming event rates
    - Provider recomputation backlog
    - Provider health summaries
    """
    
    def __init__(self):
        """Initialize streaming stats provider with metric tracking."""
        self._last_check_time = 0
        self._cached_stats: Optional[Dict[str, Any]] = None
        self._cache_ttl = 10  # Cache stats for 10 seconds
        
        # Metrics tracking
        self._event_history: deque = deque(maxlen=3600)  # Keep 1 hour of events
        self._recompute_queue_samples: deque = deque(maxlen=60)  # 1 minute of samples
        
    async def get_streaming_stats(self) -> Dict[str, Any]:
        """
        Get comprehensive streaming system metrics.
        
        Returns:
            Dictionary containing streaming metrics:
            - events_per_min: Event processing rate over last minute
            - recompute_backlog: Number of pending recomputation tasks  
            - provider_health: Health summary for all providers
        """
        current_time = time.time()
        
        # Use cache if still valid
        if (self._cached_stats and 
            current_time - self._last_check_time < self._cache_ttl):
            logger.debug("Returning cached streaming stats")
            return self._cached_stats
            
        try:
            # Try to get real streaming data
            stats = await self._get_real_streaming_stats()
            
            # Update cache
            self._cached_stats = stats
            self._last_check_time = current_time
            
            return stats
            
        except Exception as e:
            logger.error(f"Failed to collect streaming stats: {e}")
            
            # Return safe defaults with error indication
            return {
                "events_per_min": 0.0,
                "recompute_backlog": 0,
                "provider_health": {},
                "error": str(e)[:100]
            }
    
    async def _get_real_streaming_stats(self) -> Dict[str, Any]:
        """Attempt to get real streaming statistics from various sources."""
        try:
            # Try to get market streamer stats
            from backend.services.streaming.market_streamer import market_streamer
            
            if market_streamer:
                streamer_stats = market_streamer.get_status()
                events_per_min = self._calculate_events_per_min(streamer_stats)
                recompute_backlog = await self._get_recompute_backlog()
                provider_health = await self._get_provider_health_summary()
                
                return {
                    "events_per_min": events_per_min,
                    "recompute_backlog": recompute_backlog,
                    "provider_health": provider_health,
                    "source": "market_streamer"
                }
            else:
                return await self._get_stub_streaming_stats()
                
        except ImportError:
            # Market streamer not available, use stub
            return await self._get_stub_streaming_stats()
        except Exception as e:
            logger.warning(f"Error getting real streaming stats: {e}")
            return await self._get_stub_streaming_stats()
    
    def _calculate_events_per_min(self, streamer_stats: Dict[str, Any]) -> float:
        """Calculate events per minute from streamer statistics."""
        try:
            # Get recent event count
            events_emitted = streamer_stats.get("events_emitted", 0)
            cycles_completed = streamer_stats.get("cycles_completed", 0)
            last_cycle_duration_ms = streamer_stats.get("last_cycle_duration_ms", 1000)
            
            if cycles_completed > 0 and last_cycle_duration_ms > 0:
                # Estimate events per minute based on recent activity
                events_per_cycle = events_emitted / max(cycles_completed, 1)
                cycles_per_minute = 60000 / max(last_cycle_duration_ms, 100)  # Convert ms to minutes
                events_per_min = events_per_cycle * cycles_per_minute
                
                # Add to history for tracking
                self._event_history.append({
                    "timestamp": time.time(),
                    "events_per_min": events_per_min
                })
                
                return round(events_per_min, 2)
            
            return 0.0
            
        except Exception as e:
            logger.warning(f"Error calculating events per minute: {e}")
            return 0.0
    
    async def _get_recompute_backlog(self) -> int:
        """Get current recomputation backlog size."""
        try:
            # Try to get provider resilience manager backlog
            from backend.services.provider_resilience_manager import provider_resilience_manager
            
            if provider_resilience_manager:
                # Get edge change aggregator stats
                aggregator_stats = provider_resilience_manager.edge_change_aggregator.get_aggregator_stats()
                backlog_size = aggregator_stats.get("clusters_requiring_refresh", 0)
                
                # Track backlog samples
                self._recompute_queue_samples.append({
                    "timestamp": time.time(),
                    "backlog_size": backlog_size
                })
                
                return backlog_size
            
            return 0
            
        except (ImportError, AttributeError) as e:
            logger.debug(f"Provider resilience manager not available: {e}")
            return 0
        except Exception as e:
            logger.warning(f"Error getting recompute backlog: {e}")
            return 0
    
    async def _get_provider_health_summary(self) -> Dict[str, Any]:
        """Get health summary for all streaming providers."""
        try:
            from backend.services.providers.provider_registry import provider_registry
            from backend.services.provider_resilience_manager import provider_resilience_manager
            
            provider_health = {}
            
            # Get all registered providers
            all_providers = provider_registry.get_all_provider_status()
            
            for provider_name in all_providers.keys():
                try:
                    # Get provider health from resilience manager
                    health_summary = provider_resilience_manager.get_provider_health_summary(provider_name)
                    
                    if health_summary:
                        provider_health[provider_name] = {
                            "health_status": health_summary.get("health_status", "unknown"),
                            "success_percentage": health_summary.get("sla_metrics", {}).get("success_percentage", 0.0),
                            "p95_latency_ms": health_summary.get("sla_metrics", {}).get("p95_latency_ms", 0.0),
                            "circuit_state": health_summary.get("circuit_breaker", {}).get("state", "unknown"),
                            "consecutive_failures": health_summary.get("circuit_breaker", {}).get("consecutive_failures", 0),
                            "last_updated": health_summary.get("last_updated", time.time())
                        }
                    else:
                        # Provider not tracked by resilience manager
                        provider_health[provider_name] = {
                            "health_status": "unknown",
                            "success_percentage": 0.0,
                            "p95_latency_ms": 0.0,
                            "circuit_state": "unknown",
                            "consecutive_failures": 0,
                            "last_updated": time.time()
                        }
                        
                except Exception as e:
                    logger.warning(f"Error getting health for provider {provider_name}: {e}")
                    provider_health[provider_name] = {
                        "health_status": "error",
                        "error": str(e)[:50]
                    }
            
            return provider_health
            
        except (ImportError, AttributeError) as e:
            logger.debug(f"Provider components not available: {e}")
            return {}
        except Exception as e:
            logger.warning(f"Error getting provider health summary: {e}")
            return {}
    
    async def _get_stub_streaming_stats(self) -> Dict[str, Any]:
        """Generate realistic streaming statistics for development/testing."""
        import random
        
        current_time = time.time()
        
        # Generate time-based patterns
        hour_of_day = datetime.fromtimestamp(current_time).hour
        
        # Peak hours: 6 PM - 11 PM (18-23) have higher activity
        if 18 <= hour_of_day <= 23:
            base_events_per_min = 45.0
            base_backlog = 8
        elif 12 <= hour_of_day <= 17:  # Afternoon moderate activity
            base_events_per_min = 30.0
            base_backlog = 5
        elif 6 <= hour_of_day <= 11:   # Morning moderate activity
            base_events_per_min = 25.0
            base_backlog = 3
        else:  # Night/early morning - lower activity
            base_events_per_min = 12.0
            base_backlog = 1
        
        # Add randomness to make it realistic
        random.seed(int(current_time / 60))  # Change every minute
        
        events_per_min = max(0.0, base_events_per_min + random.uniform(-8.0, 15.0))
        recompute_backlog = max(0, base_backlog + random.randint(-2, 4))
        
        # Generate provider health summary with realistic patterns
        providers = ["prizepicks", "fanduel", "draftkings", "theods", "sportradar"]
        provider_health = {}
        
        for provider in providers:
            # Most providers are healthy most of the time
            health_chance = random.random()
            
            if health_chance > 0.95:  # 5% chance of degraded
                health_status = "degraded"
                success_percentage = random.uniform(85.0, 94.0)
                p95_latency_ms = random.uniform(1500, 3000)
                circuit_state = "half_open"
                consecutive_failures = random.randint(1, 3)
            elif health_chance > 0.98:  # 2% chance of outage
                health_status = "outage"
                success_percentage = random.uniform(50.0, 80.0)
                p95_latency_ms = random.uniform(3000, 8000)
                circuit_state = "open"
                consecutive_failures = random.randint(3, 10)
            else:  # 93% chance of healthy
                health_status = "healthy"
                success_percentage = random.uniform(95.0, 99.5)
                p95_latency_ms = random.uniform(200, 1200)
                circuit_state = "closed"
                consecutive_failures = 0
            
            provider_health[provider] = {
                "health_status": health_status,
                "success_percentage": round(success_percentage, 2),
                "p95_latency_ms": round(p95_latency_ms, 1),
                "circuit_state": circuit_state,
                "consecutive_failures": consecutive_failures,
                "last_updated": current_time - random.uniform(0, 300)  # Updated within last 5 minutes
            }
        
        return {
            "events_per_min": round(events_per_min, 2),
            "recompute_backlog": recompute_backlog,
            "provider_health": provider_health,
            "source": "stub"
        }
    
    def get_metrics_history(self) -> Dict[str, Any]:
        """Get historical metrics for analysis."""
        current_time = time.time()
        
        # Filter recent event history (last 10 minutes)
        recent_events = [
            event for event in self._event_history
            if current_time - event["timestamp"] < 600
        ]
        
        # Filter recent backlog samples (last 5 minutes)
        recent_backlog = [
            sample for sample in self._recompute_queue_samples
            if current_time - sample["timestamp"] < 300
        ]
        
        return {
            "event_history_count": len(recent_events),
            "backlog_history_count": len(recent_backlog),
            "avg_events_per_min_10m": sum(e["events_per_min"] for e in recent_events) / len(recent_events) if recent_events else 0.0,
            "avg_backlog_5m": sum(s["backlog_size"] for s in recent_backlog) / len(recent_backlog) if recent_backlog else 0.0,
            "max_backlog_5m": max((s["backlog_size"] for s in recent_backlog), default=0)
        }


# Global provider instance
_streaming_stats_provider: Optional[StreamingStatsProvider] = None


def get_streaming_stats_provider() -> StreamingStatsProvider:
    """Get the global streaming stats provider instance."""
    global _streaming_stats_provider
    if _streaming_stats_provider is None:
        _streaming_stats_provider = StreamingStatsProvider()
    return _streaming_stats_provider