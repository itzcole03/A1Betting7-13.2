from fastapi.testclient import TestClient
from backend.main import app
import time

client = TestClient(app)

SPORT = "MLB"
MARKET = "player_props"


def _refresh():
    r = client.post(f"/api/odds/refresh?sport={SPORT}&market={MARKET}")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] in ("ok", "ingestion_unavailable")
    return body


def test_arbitrage_real_two_way_and_summary():
    _refresh()
    arb = client.get(f"/api/odds/arbitrage?sport={SPORT}&market={MARKET}&min_margin=0.01")
    assert arb.status_code == 200
    arb_body = arb.json()
    assert "count" in arb_body and "data" in arb_body
    # If opportunities exist validate shape uses real under odds (line present)
    if arb_body["count"]:
        first = arb_body["data"][0]
        for f in ["selection_key","over_book","under_book","over_american","under_american","margin_pct","line"]:
            assert f in first
        # Ensure over and under differ and line present
        assert first["over_book"] != first["under_book"]
        assert first["line"] is not None

    # Summary endpoint should align counts
    summary = client.get(f"/api/odds/arbitrage/summary?sport={SPORT}&market={MARKET}&min_margin=0.01")
    assert summary.status_code == 200
    sbody = summary.json()

    # Support both legacy wrapped (status/data) and new flattened enriched summary
    if "status" in sbody and "data" in sbody:
        # Legacy wrapped shape
        assert sbody["status"] in ("ok", "ingestion_unavailable")
        data = sbody["data"]
        assert "count" in data
        assert data["count"] == arb_body["count"]
        if data["count"]:
            # Legacy fields
            for f in ["avg_margin_pct","max_margin_pct","top_opportunity","books_involved","unique_selections"]:
                assert f in data
            top = data["top_opportunity"]
            if top and arb_body["count"]:
                # Top should have margin >= any other (descending sort expected)
                top_margin = top.get("margin_pct", 0)
                max_margin = max(o.get("margin_pct", 0) for o in arb_body["data"]) if arb_body["data"] else 0
                assert top_margin >= max_margin - 1e-6
    else:
        # New flattened enriched schema
        assert "count" in sbody
        assert sbody["count"] == arb_body["count"]
        if sbody["count"]:
            for f in ["avg_margin","max_margin","median_margin","top_opportunity","book_pair_counts","top_books","sampled"]:
                assert f in sbody
            top = sbody["top_opportunity"]
            if top and arb_body["count"]:
                top_margin = top.get("margin_pct", 0)
                max_margin = max(o.get("margin_pct", 0) for o in arb_body["data"]) if arb_body["data"] else 0
                assert abs(top_margin - max_margin) < 1e-6 or top_margin >= max_margin - 1e-6


def test_arbitrage_determinism_within_window():
    # Refresh and take first snapshot of opportunities
    _refresh()
    first = client.get(f"/api/odds/arbitrage?sport={SPORT}&market={MARKET}&min_margin=0.01").json()
    time.sleep(2)  # within same 2-min bucket deterministic window
    second = client.get(f"/api/odds/arbitrage?sport={SPORT}&market={MARKET}&min_margin=0.01").json()
    # Allow for zero opportunities case
    if first["count"] and second["count"]:
        # Compare sets of (selection_key, over_book, under_book)
        set1 = {(o['selection_key'], o['over_book'], o['under_book']) for o in first['data']}
        set2 = {(o['selection_key'], o['over_book'], o['under_book']) for o in second['data']}
        assert set1 == set2
