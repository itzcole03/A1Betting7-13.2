import asyncio
from dataclasses import dataclass
from types import SimpleNamespace

import pytest


@dataclass
class CLVDataclass:
    id: str
    clvPercent: float = 0.0
    clv_metrics: dict = None


async def _call_run(opps, data_service=None):
    # import inside helper so tests can patch modules if needed
    from backend.routes.propfinder_routes import _run_clv_compute

    return await _run_clv_compute(opps, data_service)


async def test_run_clv_compute_attach_updates_dicts(monkeypatch):
    # Ensure CLV feature flag is enabled during the test
    try:
        from backend.services import unified_config

        class Cfg:
            pass

        cfg = SimpleNamespace(performance=SimpleNamespace(enable_clv_metrics=True))

        monkeypatch.setattr(unified_config, "get_config", lambda: cfg, raising=False)
    except Exception:
        pass

    # Prepare opportunities (dicts)
    opps = [{"id": "1"}, {"id": "2"}]

    # Data service with attach_clv_data returning dicts
    class Svc:
        def attach_clv_data(self, ops, include_diagnostics=False):
            return [
                {"id": "1", "clvPercent": 12.5, "clv_metrics": {"k": 1}},
                {"id": "2", "clvPercent": 3.2},
            ]

    svc = Svc()

    clv_enabled, succeeded = await _call_run(opps, svc)

    assert clv_enabled is True
    assert succeeded is True
    assert opps[0].get("clvPercent") == 12.5
    assert isinstance(opps[0].get("clv_metrics"), dict)


async def test_run_clv_compute_attach_updates_dataclass(monkeypatch):
    # Patch config to enable CLV
    try:
        from backend.services import unified_config

        cfg = SimpleNamespace(performance=SimpleNamespace(enable_clv_metrics=True))
        monkeypatch.setattr(unified_config, "get_config", lambda: cfg, raising=False)
    except Exception:
        pass

    # Opportunities as dicts (target of merge)
    opps = [{"id": "d1"}]

    # attach returns dataclass instances
    def attach_fn(ops, include_diagnostics=False):
        return [CLVDataclass(id="d1", clvPercent=7.7, clv_metrics={"a": 1})]

    class Svc:
        def attach_clv_data(self, ops, include_diagnostics=False):
            return attach_fn(ops, include_diagnostics=include_diagnostics)

    svc = Svc()

    clv_enabled, succeeded = await _call_run(opps, svc)

    assert clv_enabled is True
    assert succeeded is True
    assert opps[0].get("clvPercent") == 7.7
    assert opps[0].get("clv_metrics") == {"a": 1}


async def test_run_clv_compute_falls_back_to_compute_batch_when_attach_is_mock(
    monkeypatch,
):
    # Ensure CLV enabled
    try:
        from backend.services import unified_config

        cfg = SimpleNamespace(performance=SimpleNamespace(enable_clv_metrics=True))
        monkeypatch.setattr(unified_config, "get_config", lambda: cfg, raising=False)
    except Exception:
        pass

    # Create opportunities as plain objects (attributes)
    class Opp:
        def __init__(self, id):
            self.id = id

    opps = [Opp("x1"), Opp("x2")]

    # Data service presents a MagicMock-like attach_clv_data (should be skipped)
    class Svc:
        def __init__(self):
            # simulate a mock-like object (not a real unittest.mock.Mock)
            def fake(*a, **k):
                return []

            self.attach_clv_data = fake

    svc = Svc()

    # Patch compute_clv_batch to be synchronous function returning dicts
    def fake_compute(input_list):
        return [{"id": "x1", "clvPercent": 1.1}, {"id": "x2", "clvPercent": 2.2}]

    monkeypatch.setattr(
        "backend.services.clv_computation.compute_clv_batch",
        fake_compute,
        raising=False,
    )

    clv_enabled, succeeded = await _call_run(opps, svc)

    assert clv_enabled is True
    assert succeeded is True
    # Objects should have attributes set
    assert getattr(opps[0], "clvPercent") == 1.1
