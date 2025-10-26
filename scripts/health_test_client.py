from fastapi.testclient import TestClient

from backend.core.app import create_app

app = create_app()
client = TestClient(app)

resp = client.get("/health")
print("status_code=", resp.status_code)
print(resp.text)
