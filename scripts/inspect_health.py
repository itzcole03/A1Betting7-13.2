import os
import sys
from pathlib import Path

# Ensure repository root is on sys.path so imports like 'backend' resolve when
# this script is run directly from the scripts/ directory by the test runner.
repo_root = Path(__file__).parent.parent
sys.path.insert(0, str(repo_root))

from fastapi.testclient import TestClient

from backend.core.app import create_app

app = create_app()
client = TestClient(app)

r = client.get("/health")
print("status:", r.status_code)
print("headers:")
for k, v in r.headers.items():
    print(" ", k, ":", v)
print("content-length header:", r.headers.get("content-length"))
print("repr(text):", repr(r.text))
print("raw bytes len:", len(r.content))
print("raw bytes repr:", repr(r.content))
try:
    print("json():", r.json())
except Exception as e:
    print("json() error:", e)
