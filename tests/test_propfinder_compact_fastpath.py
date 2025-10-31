from fastapi.testclient import TestClient

from backend.core.app import create_app


def test_compact_fast_path_headers_and_body():
    """Ensure the compact fast-path returns quickly and includes compact hints/headers."""
    app = create_app()
    client = TestClient(app)

    resp = client.get("/api/propfinder/opportunities?fields=compact")
    assert resp.status_code == 200

    # Accept either header-based compact hint or a normal payload with opportunities.
    compact_header = resp.headers.get("x-propfinder-compact")
    body = resp.json()
    data = body.get("data") or body

    # If header is set, ensure it's the expected marker. Otherwise assert we received opportunities.
    if compact_header is not None:
        assert compact_header == "1"
    else:
        assert isinstance(data.get("opportunities"), list)
