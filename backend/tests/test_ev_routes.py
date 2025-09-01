from fastapi.testclient import TestClient
from backend.routes.ev_routes import router
from fastapi import FastAPI

app = FastAPI()
app.include_router(router)
client = TestClient(app)


def test_feed_endpoint():
    payload = [
        {"id": "a1", "probability": 0.6, "odds": 2.5, "odds_format": "decimal", "stake": 1.0},
        {"id": "a2", "probability": 0.2, "odds": -150, "odds_format": "american", "stake": 1.0},
    ]

    resp = client.post("/feed", json=payload)
    assert resp.status_code == 200
    body = resp.json()
    assert body.get("success") is True
    results = body.get("results")
    assert isinstance(results, list)
    assert len(results) == 2
    assert any(r["id"] == "a1" and r["is_plus_ev"] for r in results)
