import logging
from typing import Optional

logger = logging.getLogger(__name__)

try:
    from prometheus_client import Counter, Gauge, CollectorRegistry, generate_latest
    PROM_AVAILABLE = True
except Exception:
    PROM_AVAILABLE = False


class PrometheusAdapter:
    def __init__(self):
        if PROM_AVAILABLE:
            self.registry = CollectorRegistry()
            self.c_cache_hits = Counter("ingestion_cache_hits", "Cache hits", registry=self.registry)
            self.c_cache_misses = Counter("ingestion_cache_misses", "Cache misses", registry=self.registry)
            self.c_fetch_errors = Counter("ingestion_fetch_errors", "Fetcher errors", registry=self.registry)
            self.c_props_fetched = Counter("ingestion_props_fetched", "Props fetched", registry=self.registry)

            self.g_connectors_count = Gauge("ingestion_connectors_count", "Connectors count", registry=self.registry)
            self.g_events_found = Gauge("ingestion_events_found", "Events found", registry=self.registry)
            self.g_total_props = Gauge("ingestion_total_props", "Total props", registry=self.registry)
            self.g_ingestion_duration = Gauge("ingestion_duration_seconds", "Ingestion duration (s)", registry=self.registry)
        else:
            logger.info("prometheus_client not available; PrometheusAdapter will be a no-op")

    def inc_cache_hits(self, n: int = 1):
        if PROM_AVAILABLE:
            self.c_cache_hits.inc(n)

    def inc_cache_misses(self, n: int = 1):
        if PROM_AVAILABLE:
            self.c_cache_misses.inc(n)

    def inc_fetch_errors(self, n: int = 1):
        if PROM_AVAILABLE:
            self.c_fetch_errors.inc(n)

    def inc_props_fetched(self, n: int = 1):
        if PROM_AVAILABLE:
            self.c_props_fetched.inc(n)

    def set_connectors_count(self, v: int):
        if PROM_AVAILABLE:
            self.g_connectors_count.set(v)

    def set_events_found(self, v: int):
        if PROM_AVAILABLE:
            self.g_events_found.set(v)

    def set_total_props(self, v: int):
        if PROM_AVAILABLE:
            self.g_total_props.set(v)

    def set_ingestion_duration(self, v: float):
        if PROM_AVAILABLE:
            self.g_ingestion_duration.set(v)

    def generate_metrics(self) -> bytes:
        if PROM_AVAILABLE:
            return generate_latest(self.registry)
        return b""


_adapter_instance: Optional[PrometheusAdapter] = None


def get_adapter() -> PrometheusAdapter:
    global _adapter_instance
    if _adapter_instance is None:
        _adapter_instance = PrometheusAdapter()
    return _adapter_instance
