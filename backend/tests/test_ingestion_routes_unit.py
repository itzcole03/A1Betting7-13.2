import pytest
from fastapi.testclient import TestClient


def make_app():
    # Import inside function to avoid import side-effects during test collection
    from backend.core.app import create_app

    return create_app()


def test_run_once_success(monkeypatch):
    app = make_app()
    client = TestClient(app)

    async def fake_run_once():
        return {"ok": True, "processed": 1}

    # Patch the scheduler_runner.run_once
    monkeypatch.setitem(
        __import__("sys").modules,
        "backend.ingestion.scheduler_runner",
        type("X", (), {"run_once": fake_run_once}),
    )

    resp = client.post("/api/ingestion/run-once")
    assert resp.status_code == 200
    body = resp.json()
    assert body.get("success") is True
    assert body.get("data") and isinstance(body["data"].get("result"), dict)


def test_backfill_accepted():
    app = make_app()
    client = TestClient(app)

    payload = {"start_date": "2025-01-01", "end_date": "2025-01-02", "dry_run": True}
    resp = client.post("/api/ingestion/backfill", json=payload)
    assert resp.status_code == 202
    body = resp.json()
    assert body.get("success") is True
    assert body.get("data") and body["data"]["start_date"] == payload["start_date"]
