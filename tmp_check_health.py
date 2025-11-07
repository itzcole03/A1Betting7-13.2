from fastapi.testclient import TestClient

from backend.core.app import create_app

app = create_app()
client = TestClient(app)
resp = client.get("/health")
print("status:", resp.status_code)
print("content_repr:", repr(resp.content))
print("text:", resp.text)
print("headers:", dict(resp.headers))
