import json

from fastapi.testclient import TestClient

from backend.core.app import create_app

app = create_app()
client = TestClient(app)
resp = client.get("/api/propfinder/opportunities?limit=5&force_flat_baseline=true")
print("status", resp.status_code)
print(json.dumps(resp.json(), indent=2))
