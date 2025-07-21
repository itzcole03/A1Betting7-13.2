import json

import requests

url = "http://127.0.0.1:11434/api/generate"
payload = {
    "model": "llama3:8b",
    "prompt": "test",
    "stream": False,
    "options": {"num_predict": 1, "temperature": 0.0},
}
try:
    resp = requests.post(
        url,
        json=payload,
        headers={"Content-Type": "application/json", "Accept": "application/json"},
        timeout=5,
    )
    print(f"Status: {resp.status_code}")
    print(f"Body: {resp.text}")
except Exception as e:
    print(f"Exception: {e}")
