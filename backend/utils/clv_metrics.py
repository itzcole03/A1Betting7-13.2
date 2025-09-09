# CLV Metrics Compatibility Module
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

class CLVMetrics:
    def __init__(self):
        self._service = None
        try:
            from backend.services.clv_metrics import CLVMetricsService
            self._service = CLVMetricsService.get_instance()
        except ImportError:
            logger.warning("CLV metrics service not available")
    
    def get_diagnostics(self) -> Dict[str, Any]:
        if self._service:
            return self._service.get_snapshot()
        return {"enabled": False, "reason": "service_not_available"}
    
    def record_success(self, duration_ms: float, endpoint: str = "propfinder_opportunities"):
        """Record successful CLV enrichment"""
        if self._service:
            self._service.record_success(duration_ms, endpoint)
    
    def record_failure(self, duration_ms: float, endpoint: str = "propfinder_opportunities"):
        """Record failed CLV enrichment"""
        if self._service:
            self._service.record_failure(duration_ms, endpoint)
    
    def record_batch(self, count: int, duration_ms: float, endpoint: str = "propfinder_opportunities"):
        """Record batch CLV processing"""
        if self._service:
            self._service.record_batch(count, duration_ms, endpoint)
    
    def record_cache_hit(self, endpoint: str = "propfinder_opportunities"):
        """Record CLV cache hit"""
        if self._service:
            self._service.record_cache_hit(endpoint)
    
    def record_cache_miss(self, endpoint: str = "propfinder_opportunities"):
        """Record CLV cache miss"""
        if self._service:
            self._service.record_cache_miss(endpoint)

clv_metrics = CLVMetrics()

def get_clv_metrics():
    return clv_metrics
