"""Basic ingestion metrics with optional Prometheus client.

Provides a singleton `IngestionMetrics` with simple counters and gauges used by the scheduler.
If `prometheus_client` is available it will register metrics there as well.
"""
import logging
from typing import Optional

logger = logging.getLogger(__name__)


class SimpleCounter:
    def __init__(self):
        self.value = 0

    def inc(self, amount: int = 1):
        self.value += amount


class SimpleGauge:
    def __init__(self):
        self.value = 0

    def set(self, v: float):
        self.value = v


class IngestionMetrics:
    _instance = None

    def __init__(self):
        # Counters
        self.cache_hits = SimpleCounter()
        self.cache_misses = SimpleCounter()
        self.fetch_errors = SimpleCounter()
        self.props_fetched = SimpleCounter()

        # Gauges
        self.connectors_count = SimpleGauge()
        self.events_found = SimpleGauge()
        self.total_props = SimpleGauge()
        self.ingestion_duration = SimpleGauge()

        # Optional Prometheus adapter mirroring
        try:
            from backend.metrics.prometheus_adapter import get_adapter

            self._prom = get_adapter()
            # Initialize Prometheus values from current simple counters/gauges
            try:
                self._prom.set_connectors_count(int(self.connectors_count.value))
                self._prom.set_events_found(int(self.events_found.value))
                self._prom.set_total_props(int(self.total_props.value))
                self._prom.set_ingestion_duration(float(self.ingestion_duration.value))
            except Exception:
                pass
        except Exception:
            self._prom = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = IngestionMetrics()
        return cls._instance


def get_ingestion_metrics():
    return IngestionMetrics.get_instance()
