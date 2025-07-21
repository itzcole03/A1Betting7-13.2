import sys

import requests

API_URL = "http://localhost:1234"

try:
    response = requests.get(f"{API_URL}/v1/models", timeout=5)
    response.raise_for_status()
    data = response.json().get("data", [])
    models = [m["id"] for m in data if "id" in m]
    for m in models:
        print(m)
except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
    sys.exit(1)
