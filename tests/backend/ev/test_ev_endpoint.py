from fastapi.testclient import TestClient

from backend.core.app import create_app


def get_client():
    app = create_app()
    return TestClient(app)


def test_ev_opportunities_default():
    client = get_client()
    resp = client.get("/api/ev/opportunities")
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert "data" in data
    assert data["count"] == len(data["data"]) >= 1
    # Schema spot check
    first = data["data"][0]
    for key in [
        "id",
        "sport",
        "market",
        "line",
        "fair_odds",
        "market_odds",
        "edge_pct",
        "implied_prob",
        "fair_prob",
        "timestamp",
    ]:
        assert key in first, f"missing key {key}"


def test_ev_opportunities_min_edge_filter():
    client = get_client()
    resp_all = client.get("/api/ev/opportunities?min_edge=0")
    resp_filtered = client.get("/api/ev/opportunities?min_edge=50")
    assert resp_all.status_code == 200
    assert resp_filtered.status_code == 200
    all_count = resp_all.json()["count"]
    filtered_count = resp_filtered.json()["count"]
    assert filtered_count <= all_count


def test_ev_opportunities_invalid_min_edge():
    client = get_client()
    resp = client.get("/api/ev/opportunities?min_edge=-1")
    # FastAPI validation should trigger 422
    assert resp.status_code == 422
