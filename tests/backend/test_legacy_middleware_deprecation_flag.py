import os
from fastapi.testclient import TestClient
from backend.core.app import create_app


def test_health_alias_canonical_when_flag_disabled():
    prev = os.environ.pop("LEGACY_DEPRECATION_HINTS", None)
    try:
        app = create_app()
        client = TestClient(app)
        resp = client.get("/api/health")
        assert resp.status_code == 200
        j = resp.json()
        assert j["success"] is True
        # When flag disabled, data should be canonical and not include deprecated/forward
        assert isinstance(j["data"], dict)
        assert "deprecated" not in j["data"]
        assert "forward" not in j["data"]
    finally:
        if prev is None:
            os.environ.pop("LEGACY_DEPRECATION_HINTS", None)
        else:
            os.environ["LEGACY_DEPRECATION_HINTS"] = prev


def test_health_alias_includes_deprecation_when_flag_enabled():
    prev = os.environ.get("LEGACY_DEPRECATION_HINTS")
    os.environ["LEGACY_DEPRECATION_HINTS"] = "1"
    try:
        app = create_app()
        client = TestClient(app)
        resp = client.get("/api/health")
        assert resp.status_code == 200
        j = resp.json()
        assert j["success"] is True
        # When flag enabled, data should include deprecated and forward
        assert isinstance(j["data"], dict)
        assert j["data"].get("deprecated") is True
        assert isinstance(j["data"].get("forward"), (str, type(None)))
    finally:
        if prev is None:
            os.environ.pop("LEGACY_DEPRECATION_HINTS", None)
        else:
            os.environ["LEGACY_DEPRECATION_HINTS"] = prev
