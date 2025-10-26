import json
import os

from fastapi.testclient import TestClient

from backend.core.app import create_app

app = create_app()
client = TestClient(app)

urls = [
    "/api/propfinder/opportunities?limit=2&force_flat_baseline=true&diagnostics=true",
    "/api/propfinder/opportunities?force_flat_baseline=true&limit=2&sports=NBA,MLB&confidence_min=70",
]

os.makedirs("reports", exist_ok=True)

for i, url in enumerate(urls, start=1):
    r = client.get(url)
    out_path = os.path.join("reports", f"one_response_body_{i}.json")
    with open(out_path, "w", encoding="utf-8") as fh:
        fh.write(r.text)
    print(
        f'WROTE {out_path} status={r.status_code} size={len(r.text)} X-Force-Flat-Baseline={r.headers.get("X-Force-Flat-Baseline")}'
    )

# Also write a parsed JSON of the first response for easier inspection
try:
    r0 = client.get(urls[0])
    parsed = r0.json()
    with open(
        os.path.join("reports", "one_response_parsed.json"), "w", encoding="utf-8"
    ) as fh:
        json.dump(parsed, fh, indent=2, ensure_ascii=False)
    print("WROTE reports/one_response_parsed.json")
except Exception as e:
    print("Failed to parse response:", e)

# Print tmp debug files if present
for p in [
    "tmp_propfinder_last_payload.json",
    "tmp_propfinder_last_payload_responsebuilder.json",
    "tmp_propfinder_responsebuilder_inspect.json",
]:
    print("\n---", p, "---")
    if os.path.exists(p):
        with open(p, "r", encoding="utf-8", errors="replace") as fh:
            data = fh.read()
            print(data[:1000])
    else:
        print("MISSING")
