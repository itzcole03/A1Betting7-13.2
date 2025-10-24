from fastapi.testclient import TestClient
from backend.core.app import create_app

app = create_app()
client = TestClient(app)
paths = ['/api/predictions','/predictions','/api/props','/props','/api/analytics','/api/health','/health']
for p in paths:
    try:
        r = client.get(p)
        print(p, r.status_code)
        try:
            print(r.json())
        except Exception as e:
            print('no-json', e)
    except Exception as e:
        print('error calling', p, e)
