import pytest

from fastapi.testclient import TestClient

from backend.core.app import create_app


@pytest.mark.integration
def test_prediction_response_includes_ev():
    app = create_app()
    client = TestClient(app)

    payload = {
        "request_id": "pred_test_1",
        "event_id": "game_test_1",
        "sport": "MLB",
        "bet_type": "over_under",
        "features": {"feature1": 0.5},
        "data": {"odds": 2.5},
        "models": ["test-model"],
        "include_explanations": False,
        "include_uncertainty": False
    }

    resp = client.post("/api/v2/ml/predict", json=payload)
    assert resp.status_code == 200, resp.text
    body = resp.json()
    print("DEBUG RESPONSE:\n", body)
    # Response shape will vary; check first instance result contains ev fields when available
    assert "data" in body
    # If our route enriches results, we expect ev or ev_pct in one of the returned items
    found = False
    def walk(obj):
        if isinstance(obj, dict):
            if "ev" in obj or "ev_pct" in obj:
                return True
            for v in obj.values():
                if walk(v):
                    return True
        elif isinstance(obj, list):
            for it in obj:
                if walk(it):
                    return True
        return False

    found = walk(body)
    assert found, "Expected EV enrichment fields (ev/ev_pct) in response body"
