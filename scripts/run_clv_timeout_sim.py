import os
import sys
import time
from unittest.mock import patch

from fastapi.testclient import TestClient

# Ensure repo root is importable when running this script directly
repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, repo_root)

from backend.main import app

BASE_URL = "/api/propfinder/opportunities"


def timeout_simulation(opportunities, include_clv=True):
    import time

    time.sleep(0.1)
    return opportunities


with patch(
    "backend.services.simple_propfinder_service.SimplePropFinderService.attach_clv_data"
) as mock_attach:
    mock_attach.side_effect = timeout_simulation
    client = TestClient(app)
    start = time.time()
    resp = client.get(f"{BASE_URL}?limit=2&include_clv=1")
    elapsed = time.time() - start
    print(f"status_code={resp.status_code}, elapsed={elapsed:.3f}s")
    try:
        print("response keys:", list(resp.json().keys()))
    except Exception as e:
        print("failed to decode response json:", e)
