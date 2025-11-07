from fastapi.testclient import TestClient
import os
from backend.core.app import create_app


def test_propfinder_debug_persistence(tmp_path, monkeypatch):
    """Integration-style test: enable debug persistence, call opportunities,
    assert the dump file is written and /debug/last-propfinder returns it.
    Uses tmp_path as working directory so test doesn't write to repo root.
    """
    # Ensure debug persistence is enabled and startup hooks are disabled to keep test fast
    monkeypatch.setenv("PROP_DEBUG_PERSIST", "true")
    monkeypatch.setenv("DISABLE_STARTUP_HOOKS", "true")

    # Run the app with cwd set to a temporary directory so the dump path is predictable
    monkeypatch.chdir(str(tmp_path))

    app = create_app()
    client = TestClient(app)

    # Enable runtime override
    resp = client.post("/api/propfinder/debug/enable", json={})
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body.get("success") is True
    assert body.get("data", {}).get("enabled") is True

    # Trigger opportunities assembly
    resp2 = client.get("/api/propfinder/opportunities?limit=5&sports=MLB")
    assert resp2.status_code == 200, resp2.text
    body2 = resp2.json()
    assert body2.get("success") is True

    # Expect the dump file to exist in tmp_path
    dump_file = tmp_path / "tmp_propfinder_last_payload.json"
    assert dump_file.exists(), f"Expected dump file at {dump_file}"

    # The debug read endpoint should return the payload
    resp3 = client.get("/api/propfinder/debug/last-propfinder")
    assert resp3.status_code == 200, resp3.text
    body3 = resp3.json()
    assert body3.get("success") is True
    # Basic shape assertion
    assert isinstance(body3.get("data", {}).get("opportunities", []), list)
