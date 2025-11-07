from fastapi.testclient import TestClient

from backend.core.app import create_app

app = create_app()
client = TestClient(app)
resp = client.get("/api/propfinder/opportunities")
print("status", resp.status_code)
try:
    data = resp.json()
except Exception as e:
    print("json error", e)
    raise
print("success", data.get("success"))
payload = data.get("data")
opps = payload.get("opportunities")
print("num", len(opps))
first = opps[0]
print("type:", type(first))
print("keys:", sorted(list(first.keys())))
print("has_bookmakers_key:", "bookmakers" in first)
print("bookmakers_get:", first.get("bookmakers"))
print("sample repr:", first)
