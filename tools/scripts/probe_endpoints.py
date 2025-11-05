from fastapi.testclient import TestClient
from backend.core.app import create_app

app = create_app()
client = TestClient(app)

# Curated endpoints seen failing in the full test run
endpoints = [
    ("GET", "/simple-test"),
    ("GET", "/v1/simple-test"),
    ("GET", "/bankroll/status"),
    ("GET", "/api/bankroll/status"),
    ("GET", "/user/profile"),
    ("GET", "/api/user/profile"),
    ("GET", "/optimized/mlb/todays-games"),
    ("GET", "/mlb/todays-games"),
    ("GET", "/predict"),
    ("POST", "/predict"),
    ("POST", "/api/v2/models/predict"),
    ("GET", "/api/prizepicks/props"),
    ("GET", "/api/predictions/prizepicks"),
    ("GET", "/api/props"),
    ("GET", "/props"),
    ("GET", "/api/health"),
    ("GET", "/health"),
]

results = []
for method, path in endpoints:
    try:
        if method == "GET":
            r = client.get(path)
        else:
            r = client.post(path)
        results.append((method, path, r.status_code))
    except Exception as e:
        results.append((method, path, f"ERROR: {e}"))

for m, p, s in results:
    print(f"{m:4} {p:40} -> {s}")
