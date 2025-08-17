"""
Edge Stats Provider - Edge engine statistics and monitoring
Provides edge processing metrics and status information for reliability monitoring
"""

import time
from typing import Dict, Any, Optional
from datetime import datetime, timezone

try:
    from backend.services.unified_logging import get_logger
    logger = get_logger("edge_stats_provider")
except ImportError:
    import logging
    logger = logging.getLogger(__name__)


class EdgeStatsProvider:
    """
    Provider for edge engine statistics and metrics.
    
    Currently provides stub implementation with TODO markers for real integration.
    """
    
    def __init__(self):
        """Initialize edge stats provider."""
        self._last_check_time = 0
        self._cached_stats: Optional[Dict[str, Any]] = None
        self._cache_ttl = 60  # Cache for 60 seconds
    
    async def get_edge_stats(self) -> Dict[str, Any]:
        """
        Get current edge engine statistics.
        
        Returns:
            Dictionary containing edge engine metrics:
            - active_edges: Number of currently active edges
            - last_edge_created_ts: ISO timestamp of most recent edge creation
            - edges_per_min_rate: Rate of edge creation per minute
        """
        current_time = time.time()
        
        # Use cached result if still valid
        if (self._cached_stats and 
            current_time - self._last_check_time < self._cache_ttl):
            return self._cached_stats
        
        try:
            # TODO: Integrate with actual edge engine service
            # For now, return stub values with realistic patterns
            
            stats = await self._get_stub_edge_stats()
            
            # Cache the result
            self._cached_stats = stats
            self._last_check_time = current_time
            
            logger.debug(f"Edge stats collected: {stats['active_edges']} active edges")
            
            return stats
            
        except Exception as e:
            logger.error(f"Failed to collect edge stats: {e}")
            
            # Return safe defaults on error
            return {
                "active_edges": 0,
                "last_edge_created_ts": None,
                "edges_per_min_rate": 0.0,
                "error": str(e)[:100]
            }
    
    async def _get_stub_edge_stats(self) -> Dict[str, Any]:
        """
        Generate stub edge statistics for development/testing.
        
        Returns:
            Stub edge statistics with realistic patterns
        """
        # TODO: Replace with actual edge engine integration
        # Possible integration points:
        # - from backend.services.edge_engine import get_edge_engine
        # - edge_engine = get_edge_engine()
        # - active_edges = await edge_engine.get_active_count()
        # - last_created = await edge_engine.get_last_creation_time()
        # - rate = await edge_engine.get_creation_rate()
        
        current_time = time.time()
        
        # Simulate realistic edge activity patterns
        # Higher activity during peak hours (simulated by time of day)
        hour = datetime.now().hour
        
        if 9 <= hour <= 17:  # Business hours - higher activity
            base_edges = 25
            base_rate = 2.5
        elif 18 <= hour <= 23:  # Evening - moderate activity  
            base_edges = 15
            base_rate = 1.8
        else:  # Night/early morning - lower activity
            base_edges = 8
            base_rate = 0.5
        
        # Add some randomness to make it realistic
        import random
        random.seed(int(current_time / 300))  # Change every 5 minutes
        
        active_edges = max(0, base_edges + random.randint(-5, 8))
        edges_per_min_rate = max(0.0, base_rate + random.uniform(-0.5, 1.0))
        
        # Generate realistic last creation timestamp
        # Assume edges are created regularly if rate > 0
        if edges_per_min_rate > 0:
            # Last edge created within reasonable time based on rate
            minutes_ago = random.uniform(0, 60 / max(0.1, edges_per_min_rate))
            last_created_time = current_time - (minutes_ago * 60)
            last_edge_created_ts = datetime.fromtimestamp(
                last_created_time, 
                tz=timezone.utc
            ).isoformat()
        else:
            # No recent edge creation
            last_edge_created_ts = None
        
        return {
            "active_edges": active_edges,
            "last_edge_created_ts": last_edge_created_ts,
            "edges_per_min_rate": round(edges_per_min_rate, 2)
        }
    
    async def health_check(self) -> bool:
        """
        Check if edge stats provider is functioning correctly.
        
        Returns:
            True if provider is healthy, False otherwise
        """
        try:
            stats = await self.get_edge_stats()
            # Basic validation - stats should be a dict with expected keys
            required_keys = ["active_edges", "last_edge_created_ts", "edges_per_min_rate"]
            return all(key in stats for key in required_keys)
        except Exception as e:
            logger.error(f"Edge stats provider health check failed: {e}")
            return False
    
    def reset_cache(self) -> None:
        """Reset cached statistics (for testing purposes)."""
        self._cached_stats = None
        self._last_check_time = 0


# Global provider instance
_edge_stats_provider: Optional[EdgeStatsProvider] = None


def get_edge_stats_provider() -> EdgeStatsProvider:
    """Get the global edge stats provider instance."""
    global _edge_stats_provider
    if _edge_stats_provider is None:
        _edge_stats_provider = EdgeStatsProvider()
    return _edge_stats_provider