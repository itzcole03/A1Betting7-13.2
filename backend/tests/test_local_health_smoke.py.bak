import os
import socket
import time

try:
    import requests
except Exception:  # pragma: no cover - best-effort import
    requests = None


def is_port_open(host: str, port: int, timeout: float = 1.0) -> bool:
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except Exception:
        return False


def test_local_health_endpoint():
    """Smoke test: ensure backend is running and /health returns 200-like response.

    This test is intended to be a quick, non-flaky smoke check when the dev server
    is running locally. It won't start the server; ensure the backend is running
    (see backend/README.md) before running.
    """
    host = "127.0.0.1"
    port = 8000

    # Wait briefly for server if it's starting
    deadline = time.time() + 3
    while time.time() < deadline and not is_port_open(host, port):
        time.sleep(0.2)

    assert is_port_open(host, port), f"Backend not listening at {host}:{port}"

    url = f"http://{host}:{port}/health"

    if requests:
        r = requests.get(url, timeout=2)
        assert r.status_code == 200 or r.status_code == 204
    else:
        # fallback to urllib
        from urllib.request import urlopen

        r = urlopen(url, timeout=2)
        assert r.getcode() == 200 or r.getcode() == 204
