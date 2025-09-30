from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

SPORT = "MLB"
MARKET = "player_props"


def test_arbitrage_endpoint_shape():
    # Generate snapshots
    r = client.post(f"/api/odds/refresh?sport={SPORT}&market={MARKET}")
    assert r.status_code == 200
    resp = client.get(f"/api/odds/arbitrage?sport={SPORT}&market={MARKET}&min_margin=0.01")
    assert resp.status_code == 200
    body = resp.json()
    assert "count" in body and "data" in body
    if body["count"] > 0:
        first = body["data"][0]
        for f in ["selection_key","over_book","under_book","margin_pct"]:
            assert f in first


def test_arbitrage_alias_parity():
    client.post(f"/api/odds/refresh?sport={SPORT}&market={MARKET}")
    a = client.get(f"/api/odds/arbitrage?sport={SPORT}&market={MARKET}&min_margin=0.01").json()
    b = client.get(f"/v1/odds/api/odds-mvp/arbitrage?sport={SPORT}&market={MARKET}&min_margin=0.01")
    if b.status_code == 200:  # tolerate absence of legacy path
        bj = b.json()
        assert a["count"] == bj["count"]
