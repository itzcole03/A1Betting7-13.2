import json

from fastapi.testclient import TestClient

from backend.core.app import create_app

app = create_app()
client = TestClient(app)
resp = client.get("/api/propfinder/opportunities")
print("status", resp.status_code)
try:
    data = resp.json()
except Exception:
    data = {"raw_text": resp.text}

from pathlib import Path

repo_root = Path(__file__).resolve().parents[1]
out_path = repo_root / "tmp_propfinder_test_response.json"
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"wrote {out_path}")
