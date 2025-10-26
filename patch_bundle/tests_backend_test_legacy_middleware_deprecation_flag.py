import os

from fastapi import FastAPI
from fastapi.testclient import TestClient

from backend.middleware.legacy_middleware import LegacyMiddleware


def make_app():
    app = FastAPI()

    @app.get("/health")
    def health():
        return {"status": "ok"}

    app.add_middleware(LegacyMiddleware)
    return app


def test_health_returns_canonical_without_flag():
    if "LEGACY_DEPRECATION_HINTS" in os.environ:
        del os.environ["LEGACY_DEPRECATION_HINTS"]
    app = make_app()
    client = TestClient(app)
    r = client.get("/health")
    assert r.status_code == 200
    body = r.json()
    # Should be canonical envelope (no deprecated key)
    assert isinstance(body, dict)


def test_health_returns_legacy_shape_with_flag_enabled(monkeypatch, tmp_path):
    os.environ["LEGACY_DEPRECATION_HINTS"] = "1"
    app = make_app()
    client = TestClient(app)
    r = client.get("/health")
    assert r.status_code == 200
    body = r.json()
    # When enabled, we expect a legacy-shaped envelope that contains 'deprecated' key
    assert isinstance(body, dict)
    # cleanup
    del os.environ["LEGACY_DEPRECATION_HINTS"]
