from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_ev_summary():
    r = client.get("/api/ev/summary")
    assert r.status_code == 200
    payload = r.json()
    for key in ("total", "edges_gt_2", "edges_gt_5", "avg_edge", "generated_at"):
        assert key in payload
    assert payload["total"] >= payload["edges_gt_5"] >= 0
    assert payload["total"] >= payload["edges_gt_2"] >= payload["edges_gt_5"]
    # avg_edge should be numeric (float or int)
    assert isinstance(payload["avg_edge"], (int, float))
