import pytest
from fastapi.testclient import TestClient


def get_client():
    from backend.core.app import create_app
    app = create_app()
    return TestClient(app)


def test_list_feature_flags_initial_state():
    client = get_client()
    resp = client.get("/api/admin/feature-flags")
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("success") is True
    flags = data.get("data", {}).get("flags", [])
    names = {f["name"] for f in flags}
    assert {"ENABLE_EV_ENRICHMENT", "ENABLE_SMART_SIGNALS", "ENABLE_LINE_MOVEMENT"}.issubset(names)


def test_toggle_feature_flag_and_audit():
    client = get_client()

    # Toggle EV enrichment on
    resp = client.post("/api/admin/feature-flags/ENABLE_EV_ENRICHMENT", json={"enabled": True})
    assert resp.status_code == 200
    payload = resp.json()
    assert payload["success"] is True
    flag = payload["data"]["flag"]
    assert flag["name"] == "ENABLE_EV_ENRICHMENT"
    assert flag["enabled"] is True
    assert flag["toggler"] == "admin-system"
    assert flag["last_changed"]

    # Audit should contain the change
    audit_resp = client.get("/api/admin/feature-flags/audit")
    assert audit_resp.status_code == 200
    audit_data = audit_resp.json()["data"]["audit"]
    assert len(audit_data) >= 1
    latest = audit_data[0]
    assert latest["flag"] == "ENABLE_EV_ENRICHMENT"
    assert latest["enabled"] is True

    # Toggle off
    resp_off = client.post("/api/admin/feature-flags/ENABLE_EV_ENRICHMENT", json={"enabled": False})
    assert resp_off.status_code == 200
    assert resp_off.json()["data"]["flag"]["enabled"] is False


def test_invalid_flag_returns_404():
    client = get_client()
    resp = client.post("/api/admin/feature-flags/DOES_NOT_EXIST", json={"enabled": True})
    assert resp.status_code == 404
    body = resp.json()
    assert body.get("success") is False
    assert body.get("error", {}).get("code") == "RESOURCE_NOT_FOUND"
