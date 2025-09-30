from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_arbitrage_summary_basic():
    client.post('/api/odds/refresh?sport=MLB&market=player_props')
    r = client.get('/api/odds/arbitrage/summary?sport=MLB&market=player_props')
    assert r.status_code == 200
    js = r.json()
    for f in ("count","avg_margin","max_margin","median_margin","top_books","book_pair_counts","top_opportunity","sampled"):
        assert f in js, f"missing field {f}"
    assert isinstance(js["top_books"], list)
    assert isinstance(js["book_pair_counts"], list)
    if js["top_opportunity"] is not None:
        for k in ("selection_key","margin_pct","over_book","under_book"):
            assert k in js["top_opportunity"], f"missing {k} in top_opportunity"