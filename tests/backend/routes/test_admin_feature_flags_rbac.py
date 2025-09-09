import os
from contextlib import contextmanager
from typing import Iterator

import pytest
from fastapi.testclient import TestClient


@contextmanager
def env_flag(name: str, value: str) -> Iterator[None]:
    prev = os.environ.get(name)
    os.environ[name] = value
    try:
        yield
    finally:
        if prev is None:
            os.environ.pop(name, None)
        else:
            os.environ[name] = prev


def get_client() -> TestClient:
    from backend.core.app import create_app
    app = create_app()
    return TestClient(app)


def test_rbac_disabled_allows_access_by_default():
    # Default is disabled; should allow access with no Authorization
    client = get_client()
    resp = client.get("/api/admin/feature-flags")
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("success") is True


def test_rbac_enabled_blocks_without_token_and_allows_with_admin_token():
    with env_flag("ADMIN_FEATURE_FLAGS_REQUIRE_AUTH", "true"):
        # New client with RBAC requirement enabled
        client = get_client()

        # No token → expect 401/403 from AuthorizationException or HTTPException
        resp_no_token = client.get("/api/admin/feature-flags")
        assert resp_no_token.status_code in (401, 403)

        # With incorrect token → still blocked
        resp_bad = client.get(
            "/api/admin/feature-flags",
            headers={"Authorization": "Bearer not-admin"},
        )
        assert resp_bad.status_code in (401, 403)

        # With correct dummy admin token → allowed
        resp_ok = client.get(
            "/api/admin/feature-flags",
            headers={"Authorization": "Bearer admin-token"},
        )
        assert resp_ok.status_code == 200
        assert resp_ok.json().get("success") is True
