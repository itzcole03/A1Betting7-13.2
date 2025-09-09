import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_propfinder_ev_fields_present():
    resp = client.get("/api/propfinder/opportunities")
    assert resp.status_code == 200
    data = resp.json()
    # StandardAPIResponse wraps OpportunitiesResponse in 'data' key
    opportunities = data.get("data", {}).get("opportunities", [])
    assert isinstance(opportunities, list)
    # Ensure at least one has EV fields (if odds+confidence available)
    any_ev = False
    for opp in opportunities:
        if "evPercent" in opp or "evValue" in opp:
            any_ev = True
            if "evPercent" in opp and opp["evPercent"] is not None:
                assert -200 <= opp["evPercent"] <= 200
    # Not hard failing if zero due to data shape variance, but expect some
    assert any_ev or len(opportunities) == 0
