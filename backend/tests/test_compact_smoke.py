from fastapi.testclient import TestClient

from backend.core.app import create_app


def test_compact_endpoint_with_seeded_fixture():
    app = create_app()
    client = TestClient(app)

    # Seed a small deterministic fixture containing MLB and NBA items
    fixture = {
        "data": {
            "opportunities": [
                {
                    "id": "mlb1",
                    "player": "Player MLB 1",
                    "confidence": 70.0,
                    "sport": "MLB",
                    "market": "HITS",
                    "line": 1.5,
                    "odds": 120,
                },
                {
                    "id": "nba1",
                    "player": "Player NBA 1",
                    "confidence": 65.0,
                    "sport": "NBA",
                    "market": "POINTS",
                    "line": 2.5,
                    "odds": 110,
                },
            ]
        }
    }

    res = client.post("/api/testing/propfinder/seed", json=fixture)
    assert res.status_code == 200
    j = res.json()
    assert j.get("success") is True
    assert j.get("data", {}).get("seeded") is True

    # Now call the compact list endpoint
    res2 = client.get("/api/propfinder/opportunities?fields=compact&limit=10")
    assert res2.status_code == 200
    j2 = res2.json()
    assert j2.get("success") is True
    data = j2.get("data") or {}
    opps = data.get("opportunities")
    assert isinstance(opps, list) and len(opps) >= 2
    # Ensure summary/meta fields exist
    assert "total" in data
    assert "filtered" in data
    assert "summary" in data
