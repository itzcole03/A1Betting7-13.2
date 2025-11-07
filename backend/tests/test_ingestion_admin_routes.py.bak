from fastapi.testclient import TestClient

from backend.core.app import create_app


def test_enqueue_and_status():
    app = create_app()
    client = TestClient(app)

    resp = client.post("/api/ingestion/admin/backfill", json={"start_date": "2025-08-01", "end_date": "2025-08-07"})
    assert resp.status_code == 200
    data = resp.json()
    assert "job_id" in data

    job_id = data["job_id"]
    # Get status
    resp2 = client.get(f"/api/ingestion/admin/backfill/{job_id}")
    assert resp2.status_code == 200
    job = resp2.json()
    assert job["id"] == job_id
    assert job["status"] in ("queued", "completed")
