import requests


BASE = "http://127.0.0.1:8000"


def test_opportunities_contract():
    """Basic contract test for /api/propfinder/opportunities
    Verifies response structure, bookmakers objects, and pick normalization.
    """
    resp = requests.get(f"{BASE}/api/propfinder/opportunities")
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data.get('success') is True
    payload = data.get('data')
    assert isinstance(payload, dict)

    opportunities = payload.get('opportunities')
    assert isinstance(opportunities, list)
    assert len(opportunities) > 0

    sample = opportunities[0]
    # Required top-level fields
    required_fields = [
        'id', 'player', 'sport', 'market', 'line', 'pick', 'odds',
        'bookmakers', 'bestBookmaker', 'numBookmakers'
    ]
    for f in required_fields:
        assert f in sample, f"Missing field {f} in opportunity"

    # pick should be normalized to lowercase string ('over'|'under' or '')
    pick = sample.get('pick')
    assert isinstance(pick, str)
    assert pick == '' or pick in ('over', 'under')

    # bookmakers should be a list of objects with name, odds, line
    bms = sample.get('bookmakers')
    assert isinstance(bms, list)
    for bm in bms:
        assert isinstance(bm, dict)
        assert 'name' in bm and isinstance(bm['name'], str)
        assert 'odds' in bm and isinstance(bm['odds'], int)
        assert 'line' in bm and (isinstance(bm['line'], float) or isinstance(bm['line'], int))
