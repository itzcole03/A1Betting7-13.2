from fastapi.testclient import TestClient

from backend.core.app import create_app


def test_create_app_mounts_auth_routes_at_api_and_root():
    """Ensure the canonical app mounts the auth router both under /api and root (/auth).

    This guards the compatibility change that exposes legacy endpoints used by tests
    and older clients.
    """
    app = create_app()
    client = TestClient(app)

    resp_root = client.get("/auth/me")
    resp_api = client.get("/api/auth/me")

    # Both endpoints should exist (not return 404). They may legitimately return
    # 401/200/400 depending on auth state; the important bit is presence.
    assert resp_root.status_code != 404, "/auth/* endpoints are not mounted"
    assert resp_api.status_code != 404, "/api/auth/* endpoints are not mounted"
