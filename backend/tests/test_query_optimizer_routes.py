from fastapi.testclient import TestClient

from backend.core.app import create_app


def _client():
    app = create_app()
    return TestClient(app)


def test_query_optimizer_report_route_returns_envelope():
    client = _client()
    r = client.get("/api/observability/query-optimizer/report")
    assert r.status_code == 200
    body = r.json()
    assert isinstance(body, dict)
    assert body.get("success") is True
    assert "data" in body
    # sanity keys may exist when metrics are available
    data = body.get("data") or {}
    assert isinstance(data, dict)


def test_query_optimizer_slow_queries_route_returns_list():
    client = _client()
    r = client.get("/api/observability/query-optimizer/slow-queries")
    assert r.status_code == 200
    body = r.json()
    assert body.get("success") is True
    data = body.get("data")
    assert isinstance(data, list)


def test_query_optimizer_flags_update():
    client = _client()
    # Update flags with valid values
    r = client.post(
        "/api/observability/query-optimizer/flags",
        json={"enable_safe_query_pagination": True, "default_select_limit": 42},
    )
    assert r.status_code == 200
    body = r.json()
    assert body.get("success") is True
    data = body.get("data") or {}
    assert "updated" in data
