"""
Ingestion Stats Provider - Data ingestion monitoring and statistics
Provides ingestion pipeline metrics for reliability monitoring
"""

import time
from typing import Dict, Any, Optional
from datetime import datetime, timezone

try:
    from backend.services.unified_logging import get_logger
    logger = get_logger("ingestion_stats_provider")
except ImportError:
    import logging
    logger = logging.getLogger(__name__)


class IngestionStatsProvider:
    """
    Provider for data ingestion statistics and metrics.
    
    Currently provides stub implementation with TODO markers for real integration.
    """
    
    def __init__(self):
        """Initialize ingestion stats provider."""
        self._last_check_time = 0
        self._cached_stats: Optional[Dict[str, Any]] = None
        self._cache_ttl = 30  # Cache for 30 seconds (more frequent updates for ingestion)
    
    async def get_ingestion_stats(self) -> Dict[str, Any]:
        """
        Get current data ingestion statistics.
        
        Returns:
            Dictionary containing ingestion metrics:
            - last_ingest_ts: ISO timestamp of most recent successful ingestion
            - ingest_latency_ms: Average latency of recent ingestion operations in milliseconds
            - recent_failures: Number of failed ingestion attempts in recent window
        """
        current_time = time.time()
        
        # Use cached result if still valid
        if (self._cached_stats and 
            current_time - self._last_check_time < self._cache_ttl):
            return self._cached_stats
        
        try:
            # TODO: Integrate with actual ingestion pipeline service
            # For now, return stub values with realistic patterns
            
            stats = await self._get_stub_ingestion_stats()
            
            # Cache the result
            self._cached_stats = stats
            self._last_check_time = current_time
            
            logger.debug(f"Ingestion stats collected: latency {stats.get('ingest_latency_ms', 0)}ms")
            
            return stats
            
        except Exception as e:
            logger.error(f"Failed to collect ingestion stats: {e}")
            
            # Return safe defaults on error
            return {
                "last_ingest_ts": None,
                "ingest_latency_ms": None,
                "recent_failures": 0,
                "error": str(e)[:100]
            }
    
    async def _get_stub_ingestion_stats(self) -> Dict[str, Any]:
        """
        Generate stub ingestion statistics for development/testing.
        
        Returns:
            Stub ingestion statistics with realistic patterns
        """
        # TODO: Replace with actual ingestion pipeline integration
        # Possible integration points:
        # - from backend.services.data_ingestion_service import get_ingestion_service
        # - ingestion_service = get_ingestion_service()
        # - last_ingest = await ingestion_service.get_last_successful_ingest()
        # - avg_latency = await ingestion_service.get_average_latency()
        # - failures = await ingestion_service.get_recent_failure_count()
        
        current_time = time.time()
        
        # Simulate realistic ingestion patterns
        # More frequent ingestion during active periods
        hour = datetime.now().hour
        minute = datetime.now().minute
        
        # Simulate ingestion running every 5-15 minutes during active hours
        if 6 <= hour <= 23:  # Active hours - regular ingestion
            # Calculate time since theoretical last ingestion
            ingest_interval_minutes = 8  # Every ~8 minutes
            time_in_cycle = minute % ingest_interval_minutes
            
            # If we're within 2 minutes of a cycle, assume recent ingestion
            if time_in_cycle <= 2:
                minutes_since_ingest = time_in_cycle
                base_latency = 1200  # Normal latency
                failure_probability = 0.05  # 5% chance of recent failure
            else:
                minutes_since_ingest = time_in_cycle
                base_latency = 1500  # Slightly higher latency for older data
                failure_probability = 0.02
        else:  # Night hours - less frequent ingestion
            ingest_interval_minutes = 20  # Every ~20 minutes
            time_in_cycle = minute % ingest_interval_minutes
            minutes_since_ingest = time_in_cycle
            base_latency = 2000  # Higher latency at night
            failure_probability = 0.08
        
        # Add some randomness
        import random
        random.seed(int(current_time / 300))  # Change every 5 minutes
        
        # Calculate last ingest timestamp
        last_ingest_time = current_time - (minutes_since_ingest * 60)
        last_ingest_ts = datetime.fromtimestamp(
            last_ingest_time, 
            tz=timezone.utc
        ).isoformat()
        
        # Calculate realistic latency with some variance
        latency_variance = random.uniform(-300, 800)  # ±300ms to +800ms variance
        ingest_latency_ms = max(200, base_latency + latency_variance)  # Minimum 200ms
        
        # Simulate recent failures
        recent_failures = 1 if random.random() < failure_probability else 0
        if recent_failures > 0 and random.random() < 0.3:
            recent_failures = 2  # Occasionally have multiple failures
        
        # Add anomaly scenarios for testing
        # Simulate occasional high latency periods
        if random.random() < 0.05:  # 5% chance of high latency
            ingest_latency_ms = random.uniform(5000, 8000)  # Very high latency
            recent_failures = random.randint(1, 3)
        
        return {
            "last_ingest_ts": last_ingest_ts,
            "ingest_latency_ms": round(ingest_latency_ms, 1),
            "recent_failures": recent_failures
        }
    
    async def health_check(self) -> bool:
        """
        Check if ingestion stats provider is functioning correctly.
        
        Returns:
            True if provider is healthy, False otherwise
        """
        try:
            stats = await self.get_ingestion_stats()
            # Basic validation - stats should be a dict with expected keys
            required_keys = ["last_ingest_ts", "ingest_latency_ms", "recent_failures"]
            return all(key in stats for key in required_keys)
        except Exception as e:
            logger.error(f"Ingestion stats provider health check failed: {e}")
            return False
    
    def reset_cache(self) -> None:
        """Reset cached statistics (for testing purposes)."""
        self._cached_stats = None
        self._last_check_time = 0


# Global provider instance
_ingestion_stats_provider: Optional[IngestionStatsProvider] = None


def get_ingestion_stats_provider() -> IngestionStatsProvider:
    """Get the global ingestion stats provider instance."""
    global _ingestion_stats_provider
    if _ingestion_stats_provider is None:
        _ingestion_stats_provider = IngestionStatsProvider()
    return _ingestion_stats_provider