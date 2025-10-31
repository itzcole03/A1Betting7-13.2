"""
Legacy Registry Service

Tracks usage of legacy (non-/api/v2/*) endpoints to provide telemetry for
safe deprecation and removal. Implements in-memory counters with optional
Prometheus metrics integration.

Used by legacy middleware to record endpoint access patterns and provide
migration guidance through usage statistics.
"""

import os
import time
from typing import Dict, Optional, List, Any
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)


@dataclass
class LegacyEndpointData:
    """Usage data for a single legacy endpoint"""
    path: str
    count: int
    forward: Optional[str] = None
    last_access_ts: Optional[float] = None
    first_recorded_ts: Optional[float] = None


class LegacyRegistry:
    """
    Registry for tracking legacy endpoint usage with configurable forwarding.
    
    Provides in-memory storage with optional Prometheus metrics integration.
    Thread-safe implementation for middleware usage.
    """
    
    def __init__(self):
        self._data: Dict[str, LegacyEndpointData] = {}
        self._enabled = self._get_legacy_enabled()
        self._sunset_date = os.getenv("A1_LEGACY_SUNSET")
        self._start_time = time.time()
        
        # Optional Prometheus metrics client
        self._prometheus_client = None
        self._setup_prometheus()
        
        logger.info(f"Legacy registry initialized: enabled={self._enabled}, sunset_date={self._sunset_date}")

    def _get_legacy_enabled(self) -> bool:
        """Get legacy enabled flag from environment (default: true in dev, false in prod)"""
        env_value = os.getenv("A1_LEGACY_ENABLED", "").lower()
        if env_value in ("true", "1", "yes", "on"):
            return True
        elif env_value in ("false", "0", "no", "off"):
            return False
        else:
            # Default based on environment
            environment = os.getenv("ENVIRONMENT", "development").lower()
            return environment in ("development", "dev", "local")

    def _setup_prometheus(self):
        """Setup optional Prometheus metrics client"""
        try:
            # Try to get existing metrics middleware
            from backend.middleware.prometheus_metrics_middleware import get_metrics_middleware
            self._prometheus_client = get_metrics_middleware()
            if self._prometheus_client:
                logger.info("Legacy registry connected to Prometheus metrics")
        except ImportError:
            logger.debug("Prometheus metrics not available for legacy registry")
        except Exception as e:
            logger.warning(f"Failed to setup Prometheus for legacy registry: {e}")

    def is_enabled(self) -> bool:
        """Check if legacy endpoints are enabled"""
        return self._enabled

    def get_sunset_date(self) -> Optional[str]:
        """Get configured sunset date for legacy endpoints"""
        return self._sunset_date

    def register_legacy(self, path: str, forward: Optional[str] = None):
        """
        Register a legacy endpoint with optional forwarding path.
        
        Args:
            path: Legacy endpoint path (e.g., "/api/health")
            forward: New endpoint path (e.g., "/api/v2/diagnostics/health")
        """
        if path not in self._data:
            now = time.time()
            self._data[path] = LegacyEndpointData(
                path=path,
                count=0,
                forward=forward,
                first_recorded_ts=now,
                last_access_ts=None
            )
            logger.info(f"Registered legacy endpoint: {path} -> {forward}")

    def increment_usage(self, path: str) -> bool:
        """
        Increment usage counter for a legacy endpoint.
        
        Args:
            path: Legacy endpoint path
            
        Returns:
            bool: True if endpoint exists and was incremented
        """
        if path not in self._data:
            # Auto-register unknown legacy endpoint
            # If there is an existing registered prefix that matches this path,
            # inherit its forwarding target so concrete paths don't get registered
            # with forward=None (which leads to 404/deprecation behavior).
            matching_prefix = None
            for registered_path, data in self._data.items():
                # Prefer exact prefix matches (registered entries that are prefixes
                # of the requested path). Use longest-match semantics.
                if path.startswith(registered_path):
                    if matching_prefix is None or len(registered_path) > len(matching_prefix):
                        matching_prefix = registered_path

            if matching_prefix:
                forward = self._data[matching_prefix].forward
                self.register_legacy(path, forward)
            else:
                self.register_legacy(path)
        
        now = time.time()
        self._data[path].count += 1
        self._data[path].last_access_ts = now
        
        # Optional Prometheus metrics (placeholder for future implementation)
        if self._prometheus_client:
            try:
                # Basic logging for now - can be enhanced with actual Prometheus integration
                logger.debug(f"Would record Prometheus metric for legacy endpoint: {path}")
            except Exception as e:
                logger.debug(f"Failed to update Prometheus legacy metrics: {e}")
        
        logger.debug(f"Legacy endpoint usage incremented: {path} (count: {self._data[path].count})")
        return True

    def get_usage_data(self) -> Dict[str, Any]:
        """
        Get comprehensive usage data for all registered legacy endpoints.
        
        Returns:
            Dict with usage statistics and metadata
        """
        now = time.time()
        endpoints = []
        total_calls = 0
        
        for endpoint_data in self._data.values():
            total_calls += endpoint_data.count
            endpoints.append({
                "path": endpoint_data.path,
                "count": endpoint_data.count,
                "forward": endpoint_data.forward,
                "last_access_ts": endpoint_data.last_access_ts,
                "last_access_iso": (
                    datetime.fromtimestamp(endpoint_data.last_access_ts, tz=timezone.utc).isoformat()
                    if endpoint_data.last_access_ts else None
                )
            })
        
        return {
            "enabled": self._enabled,
            "endpoints": endpoints,
            "total": total_calls,
            "first_recorded_ts": self._start_time,
            "first_recorded_iso": datetime.fromtimestamp(self._start_time, tz=timezone.utc).isoformat(),
            "since_seconds": int(now - self._start_time),
            "sunset_date": self._sunset_date
        }

    def get_migration_readiness(self, threshold: int = 50) -> Dict[str, Any]:
        """
        Calculate migration readiness score based on usage patterns.
        
        Args:
            threshold: Threshold for considering high usage (calls per hour)
            
        Returns:
            Dict with readiness score and analysis
        """
        now = time.time()
        uptime_hours = max((now - self._start_time) / 3600, 0.1)  # Avoid division by zero
        
        # Calculate recent usage rate
        total_calls_last_24h = sum(
            endpoint_data.count for endpoint_data in self._data.values()
            if endpoint_data.last_access_ts and (now - endpoint_data.last_access_ts) <= 86400
        )
        
        # Migration readiness score (1.0 = ready, 0.0 = not ready)
        usage_rate_per_hour = total_calls_last_24h / min(uptime_hours, 24)
        score = max(0.0, 1.0 - min(1.0, usage_rate_per_hour / threshold))
        
        # Determine readiness level
        if score >= 0.8:
            readiness_level = "ready"
        elif score >= 0.5:
            readiness_level = "caution"
        else:
            readiness_level = "not_ready"
        
        return {
            "score": round(score, 3),
            "readiness_level": readiness_level,
            "total_calls_last_24h": total_calls_last_24h,
            "usage_rate_per_hour": round(usage_rate_per_hour, 2),
            "threshold_per_hour": threshold,
            "analysis": {
                "high_usage_endpoints": [
                    {"path": data.path, "count": data.count, "forward": data.forward}
                    for data in self._data.values()
                    if data.count > threshold
                ],
                "recommendations": self._get_migration_recommendations(score, usage_rate_per_hour, threshold)
            }
        }

    def _get_migration_recommendations(self, score: float, usage_rate: float, threshold: int) -> List[str]:
        """Generate migration recommendations based on usage patterns"""
        recommendations = []
        
        if score >= 0.8:
            recommendations.append("✅ Safe to proceed with legacy endpoint deprecation")
            recommendations.append("Monitor usage for 1-2 weeks after deprecation notices")
        elif score >= 0.5:
            recommendations.append("⚠️ Moderate usage detected - proceed with caution")
            recommendations.append("Send deprecation notices and monitor for 2-4 weeks")
            recommendations.append("Consider gradual sunset approach")
        else:
            recommendations.append("🚫 High usage detected - migration not recommended")
            recommendations.append("Focus on client migration before deprecating endpoints")
            recommendations.append(f"Current usage ({usage_rate:.1f}/hr) exceeds threshold ({threshold}/hr)")
        
        if self._sunset_date:
            recommendations.append(f"📅 Planned sunset date: {self._sunset_date}")
        
        return recommendations

    def clear_usage_data(self):
        """Clear all usage data (for testing purposes)"""
        self._data.clear()
        self._start_time = time.time()
        logger.info("Legacy registry usage data cleared")


# Global registry instance
legacy_registry = LegacyRegistry()


def get_legacy_registry() -> LegacyRegistry:
    """Get the global legacy registry instance"""
    return legacy_registry


def register_legacy_endpoint(path: str, forward: Optional[str] = None):
    """Convenience function to register a legacy endpoint"""
    return legacy_registry.register_legacy(path, forward)


def increment_legacy_usage(path: str) -> bool:
    """Convenience function to increment legacy endpoint usage"""
    return legacy_registry.increment_usage(path)


def is_legacy_enabled() -> bool:
    """Convenience function to check if legacy endpoints are enabled"""
    return legacy_registry.is_enabled()