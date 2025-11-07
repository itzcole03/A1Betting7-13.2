import asyncio
import pytest


class DummyConnector:
    def __init__(self):
        self.name = "dummy"

    async def fetch_all_events(self):
        return ["game1", "game2"]

    async def fetch_props_for_event(self, event_id):
        return [{"id": f"{event_id}-p1"}]


class DummyFetcher:
    def __init__(self):
        self.connectors = [DummyConnector()]

    def list_connectors(self):
        return self.connectors
    
    async def fetch_all_events(self):
        class E:
            def __init__(self, id):
                self.id = id

        return [E("game1"), E("game2")]

    async def fetch_props_for_event(self, event_id):
        return [{"id": f"{event_id}-p1"}]


class DummyMetrics:
    def __init__(self):
        self.calls = []
        class Counter:
            def __init__(self, parent):
                self.parent = parent
            def inc(self, n=1):
                self.parent.calls.append(("inc", n))

        class Gauge:
            def __init__(self, parent):
                self.parent = parent
            def set(self, v):
                self.parent.calls.append(("set", v))

        self.cache_hits = Counter(self)
        self.cache_misses = Counter(self)
        self.fetch_errors = Counter(self)
        self.props_fetched = Counter(self)
        self.connectors_count = Gauge(self)
        self.events_found = Gauge(self)
        self.total_props = Gauge(self)
        self.ingestion_duration = Gauge(self)

    def increment(self, name, amount=1):
        self.calls.append((name, amount))

    def gauge(self, name, value):
        self.calls.append((name, value))


@pytest.mark.asyncio
async def test_scheduler_run_once(monkeypatch):
    # Patch unified_data_fetcher used by scheduler_runner
    import backend.ingestion.scheduler_runner as runner

    dummy_fetcher = DummyFetcher()
    # scheduler_runner imports as 'udf' from backend.services.unified_data_fetcher
    monkeypatch.setattr(runner, "udf", dummy_fetcher)

    # Patch cache to in-memory dummy with simple set/get
    class SimpleCache:
        def __init__(self):
            self.store = {}

        async def set(self, k, v, ttl=None):
            self.store[k] = v

        async def get(self, k):
            return self.store.get(k)

    simple_cache = SimpleCache()
    monkeypatch.setattr(runner, "redis_cache", simple_cache)

    # Patch metrics: IngestionMetrics.get_instance() used in scheduler_runner
    class MetricsWrapper:
        def __init__(self, m):
            self._m = m

        @staticmethod
        def get_instance():
            return dummy_metrics

    dummy_metrics = DummyMetrics()
    monkeypatch.setattr(runner, "IngestionMetrics", MetricsWrapper)

    # Run the run_once function
    await runner.run_once()

    # Verify cache entries created for game1 and game2
    assert any(k.startswith("props:") for k in simple_cache.store.keys())
