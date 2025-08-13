import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from backend.routes.admin import router as admin_router
from backend.routes.trending_suggestions import router as trending_router

app = FastAPI()
app.include_router(admin_router)
app.include_router(trending_router)

client = TestClient(app)


def test_admin_rules_audit_log_success(monkeypatch):
    # Patch os.path.exists to True and open to return dummy log
    import os

    dummy_entry = {
        "user_id": "admin",
        "action": "add",
        "rule_id": "1",
        "timestamp": "2025-08-12T00:00:00Z",
    }
    monkeypatch.setattr(os.path, "exists", lambda path: True)
    monkeypatch.setattr(
        "builtins.open",
        lambda path, mode, encoding=None: iter([str(dummy_entry).replace("'", '"')]),
    )
    response = client.get(
        "/admin/rules-audit-log", headers={"Authorization": "Bearer admin-token"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert isinstance(data["data"], list)
    assert data["error"] is None


def test_admin_rules_audit_log_error():
    # No auth header
    response = client.get("/admin/rules-audit-log")
    assert response.status_code == 403 or response.json()["success"] is False


def test_trending_suggestions_success(monkeypatch):
    # Patch service to return dummy list
    monkeypatch.setattr(
        "backend.services.trending_suggestions_service.get_trending_suggestions",
        lambda sport, limit: ["dummy suggestion"],
    )
    response = client.get("/trending-suggestions?sport=MLB&limit=1")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert isinstance(data["data"], list)
    assert data["error"] is None


def test_trending_suggestions_error(monkeypatch):
    # Patch service to raise error
    def raise_error(sport, limit):
        raise Exception("fail")

    monkeypatch.setattr(
        "backend.services.trending_suggestions_service.get_trending_suggestions",
        raise_error,
    )
    response = client.get("/trending-suggestions?sport=MLB&limit=1")
    assert response.status_code == 500 or response.json()["success"] is False
