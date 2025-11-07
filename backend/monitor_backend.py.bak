import requests
import time

BACKEND_URL = "http://localhost:8000/api/health/status"

while True:
    try:
        r = requests.get(BACKEND_URL, timeout=5)
        if r.ok:
            print(f"[HEALTH MONITOR] Backend healthy: {r.json()}")
        else:
            print(f"[HEALTH MONITOR] Backend unhealthy: {r.status_code}")
    except Exception as e:
        print(f"[HEALTH MONITOR] Backend unreachable: {e}")
    time.sleep(60)  # Check every minute 