from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

SPORT = "MLB"
MARKET = "player_props"


def _refresh():
    r = client.post(f"/api/odds/refresh?sport={SPORT}&market={MARKET}")
    assert r.status_code == 200


def test_best_book_basic():
    _refresh()
    resp = client.get(f"/api/odds/best-book?sport={SPORT}&market={MARKET}")
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["count"] >= 1
    first = body["data"][0]
    for field in ("selection_key", "best_american", "best_book", "books_considered"):
        assert field in first


def test_best_book_with_consensus():
    _refresh()
    resp = client.get(f"/api/odds/best-book?sport={SPORT}&market={MARKET}&include_consensus=true")
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["count"] >= 1
    first = body["data"][0]
    assert "consensus_american" in first
    assert "consensus_implied_prob" in first
