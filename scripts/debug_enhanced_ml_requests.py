from fastapi.testclient import TestClient
from backend.core.app import create_app
import json

app = create_app()
client = TestClient(app)

# First: malformed payload
r1 = client.post('/api/enhanced-ml/predict/single', json={})
print('REQ1 STATUS:', r1.status_code)
try:
    print('REQ1 BODY:', json.dumps(r1.json(), indent=2))
except Exception:
    print('REQ1 RAW:', r1.text)

# Second: valid payload
valid_payload = {"sport": "MLB", "features": {"x": 1}}
r2 = client.post('/api/enhanced-ml/predict/single', json=valid_payload)
print('REQ2 STATUS:', r2.status_code)
try:
    print('REQ2 BODY:', json.dumps(r2.json(), indent=2))
except Exception:
    print('REQ2 RAW:', r2.text)
