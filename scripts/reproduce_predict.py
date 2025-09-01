import sys
import os
import json

# Ensure repository root is on sys.path
sys.path.insert(0, os.getcwd())

from backend.core.app import create_app
from fastapi.testclient import TestClient


def main():
    app = create_app()
    client = TestClient(app)

    payload = {"sport": "INVALID_SPORT", "features": {"test": 1.0}}

    resp = client.post("/api/enhanced-ml/predict/single", json=payload)

    print("STATUS", resp.status_code)
    print("HEADERS")
    for k, v in resp.headers.items():
        print(f"  {k}: {v}")
    print("BODY")
    print(resp.text)
    try:
        print("JSON:")
        print(json.dumps(resp.json(), indent=2))
    except Exception as e:
        print("Failed to parse JSON:", e)


if __name__ == '__main__':
    main()
