import pytest

pytestmark = pytest.mark.filterwarnings(
    "ignore::DeprecationWarning:pydantic.*",
)
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

@pytest.mark.asyncio
async def test_feed_entries_always_have_edge_tier():
    # Basic feed request
    r = client.get('/api/ev/feed?limit=20')
    assert r.status_code == 200
    data = r.json()
    assert 'opportunities' in data
    for opp in data['opportunities']:
        assert 'edge_tier' in opp, f"Missing edge_tier in feed opp: {opp}"
        assert opp['edge_tier'] is not None

@pytest.mark.asyncio
async def test_search_entries_always_have_edge_tier():
    r = client.get('/api/ev/feed/search', params={'player': 'a', 'min_edge': 0})
    assert r.status_code == 200, r.text
    payload = r.json()
    assert payload.get('success') is True
    data = payload.get('data') or {}
    assert 'opportunities' in data
    for opp in data.get('opportunities', []):
        assert 'edge_tier' in opp, f"Missing edge_tier in search opp: {opp}"
        assert opp['edge_tier'] is not None
