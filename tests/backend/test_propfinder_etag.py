from fastapi import Request
from fastapi.testclient import TestClient

from backend.core.app import create_app


def test_compact_returns_etag_and_304():
    app = create_app()
    client = TestClient(app)

    resp = client.get("/api/propfinder/opportunities?fields=compact")
    assert resp.status_code == 200
    # ETag header may be lowercase depending on server; check both
    et = resp.headers.get("ETag") or resp.headers.get("etag")
    assert et is not None and et.strip() != ""
    # Subsequent conditional request must return 304 Not Modified when ETag matches
    resp2 = client.get(
        "/api/propfinder/opportunities?fields=compact", headers={"If-None-Match": et}
    )
    assert resp2.status_code == 304


def test_middleware_computes_etag_for_plain_dict():
    app = create_app()
    client = TestClient(app)

    # Add a transient route that returns a plain dict (no explicit ETag)
    async def handler(request: Request):
        return {"opportunities": [{"id": "test-1", "name": "Test Opportunity"}]}

    app.router.add_api_route("/test/emit-dict", handler, methods=["GET"])

    resp = client.get("/test/emit-dict")
    assert resp.status_code == 200
    et = resp.headers.get("ETag") or resp.headers.get("etag")
    assert et is not None and et.strip() != ""
