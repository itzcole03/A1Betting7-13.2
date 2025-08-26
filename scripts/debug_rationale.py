import sys
from pathlib import Path

# Ensure repo root is on sys.path when running the script directly
REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT))

from fastapi.testclient import TestClient
from fastapi import FastAPI
from unittest.mock import Mock, AsyncMock, patch
from datetime import datetime

from backend.routes.streaming.streaming_api import router as streaming_router


def run():
    app = FastAPI()
    app.include_router(streaming_router)
    client = TestClient(app)

    mock_rationale_service = Mock()
    mock_rationale_service.generate_rationale = AsyncMock(return_value=Mock(
        id=12345,
        request_id="test_123",
        narrative="This is a test portfolio analysis narrative.",
        key_points=["Strong performance", "Diversified holdings", "Low risk exposure"],
        confidence=0.87,
        generation_time_ms=450,
        model_info={"model": "gpt-4", "version": "2024-01"},
        timestamp=datetime.utcnow()
    ))

    with patch('backend.routes.streaming.streaming_api.portfolio_rationale_service', mock_rationale_service):
        request_data = {
            "rationale_type": "portfolio_summary",
            "portfolio_data": {
                "total_value": 50000,
                "positions": 8,
                "performance": "positive"
            }
        }

        resp = client.post("/streaming/rationale/generate", json=request_data)
        print("STATUS:", resp.status_code)
        try:
            print("JSON:", resp.json())
        except Exception as e:
            print("TEXT:", resp.text)
            print("JSON parse error:", e)


if __name__ == '__main__':
    run()
