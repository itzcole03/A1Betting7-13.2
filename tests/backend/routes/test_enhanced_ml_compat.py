import json
from fastapi.testclient import TestClient

from backend.core.app import create_app


def test_enhanced_ml_predict_single_invalid_sport():
    app = create_app()
    client = TestClient(app)

    payload = {"sport": "INVALID_SPORT", "features": {"x": 1.0}}
    resp = client.post("/api/enhanced-ml/predict/single", json=payload)

    assert resp.status_code == 422, f"Expected 422 for invalid sport, got {resp.status_code} - {resp.text}"

    data = resp.json()

    # Tests accept either top-level 'message' or an 'error' object with 'message'
    assert ("message" in data) or (isinstance(data.get("error"), dict) and "message" in data["error"]), (
        f"Response must include 'message' or 'error.message', got: {json.dumps(data)}"
    )
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
