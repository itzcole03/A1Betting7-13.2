#!/usr/bin/env python3
"""
Fetch the propfinder opportunities from the running backend and write a snapshot file
into frontend/debug-propfinder.json for local debugging.
"""
import json
import sys
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

BACKEND_URL = "http://127.0.0.1:8000"
API_PATH = "/api/propfinder/opportunities?limit=25&sports=NBA,MLB&confidence_min=0&confidence_max=100&edge_min=0&edge_max=20&offset=0"
OUT_PATH = "frontend/debug-propfinder.json"


def fetch_and_write():
    url = BACKEND_URL.rstrip("/") + API_PATH
    req = Request(url, headers={"Accept": "application/json"})
    try:
        with urlopen(req, timeout=10) as resp:
            body = resp.read()
            try:
                payload = json.loads(body)
            except Exception:
                # fallback: write raw text
                payload = {"raw": body.decode("utf-8", errors="replace")}
            with open(OUT_PATH, "w", encoding="utf-8") as f:
                json.dump(payload, f, indent=2)
            print("Wrote snapshot to", OUT_PATH)
    except HTTPError as e:
        print("HTTP error fetching", url, e.code, e.reason, file=sys.stderr)
        sys.exit(2)
    except URLError as e:
        print("URL error fetching", url, str(e), file=sys.stderr)
        sys.exit(3)
    except Exception as e:
        print("Unexpected error:", str(e), file=sys.stderr)
        sys.exit(4)


if __name__ == "__main__":
    fetch_and_write()
