import sys
from pathlib import Path
root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root))

from fastapi.testclient import TestClient
from backend.core.app import create_app
import json

app = create_app()
client = TestClient(app)

endpoints = ["/api/props", "/api/predictions", "/api/analytics"]

for ep in endpoints:
    print('\nCALLING:', ep)
    resp = client.get(ep)
    print('status:', resp.status_code)
    try:
        body = resp.json()
        print(json.dumps(body, indent=2, ensure_ascii=False)[:4000])
    except Exception as e:
        print('failed to parse json:', e)
        print('text repr:', resp.text[:2000])
