import pytest


def test_enhanced_ml_predict_single_422_and_200(sync_client):
    # Malformed payload -> expect 422/400
    resp = sync_client.post("/api/enhanced-ml/predict/single", json={})
    assert resp.status_code in (422, 400), f"Expected 422/400 for malformed payload, got {resp.status_code}"

    # Valid payload -> expect 200 and canonical success envelope
    valid_payload = {"sport": "MLB", "features": {"x": 1}}
    resp2 = sync_client.post("/api/enhanced-ml/predict/single", json=valid_payload)
    assert resp2.status_code == 200, f"Expected 200 for valid payload, got {resp2.status_code}"
    data = resp2.json()
    assert isinstance(data, dict) and data.get("success") is True
