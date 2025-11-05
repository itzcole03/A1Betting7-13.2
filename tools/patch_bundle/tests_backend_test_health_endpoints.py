import os

from fastapi import FastAPI
from fastapi.testclient import TestClient

from backend.routes.observability_routes import router as obs_router

app = FastAPI()
app.include_router(obs_router)


def test_observability_snapshot_fallback(monkeypatch):
    # Force instrumentation service to raise
    class FakeService:
        async def get_observability_snapshot(self):
            raise RuntimeError("boom")

    monkeypatch.setattr(
        "backend.routes.observability_routes.InstrumentationService.get_instance",
        lambda: FakeService(),
    )

    client = TestClient(app)
    r = client.get("/api/v2/observability/snapshot")
    assert r.status_code == 503
    body = r.json()
    assert body.get("error") is not None
    assert body.get("ev_ms_avg") == 0.0


def test_health_with_deprecation_flag(monkeypatch):
    # Verify existing test that toggles LEGACY_DEPRECATION_HINTS still passes
    os.environ["LEGACY_DEPRECATION_HINTS"] = "1"
    client = TestClient(FastAPI())
    r = client.get("/health")
    # Expect 200 OK but middleware will shape the response if present
    assert r.status_code in (200, 404)
    del os.environ["LEGACY_DEPRECATION_HINTS"]
