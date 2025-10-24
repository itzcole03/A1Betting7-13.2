from fastapi.testclient import TestClient
import json

try:
    from backend.main import app
except Exception as e:
    print('Failed to import app:', e)
    raise

client = TestClient(app)
resp = client.post('/auth/register', json={"username":"test_user","password":"test_password","email":"test@example.com"})
print('status_code=', resp.status_code)
try:
    print('json=', json.dumps(resp.json(), indent=2))
except Exception:
    print('text=', resp.text)
print('headers=', dict(resp.headers))
