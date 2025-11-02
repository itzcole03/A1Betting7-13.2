import asyncio
import types

import pytest
from fastapi import Response


class FakeRequest:
    def __init__(self, headers=None):
        self.headers = headers or {}


@pytest.mark.asyncio
async def test_get_prop_opportunities_returns_304_when_etag_matches(monkeypatch):
    # Patch the unified cache getter to return a cached payload with etag
    class _FakeCache:
        async def get(self, key, default=None, user_context=None):
            return {
                "etag": "test-etag-123",
                "payload": {
                    "opportunities": [],
                    "meta": {"etag": "test-etag-123"},
                },
            }

    fake_cache = _FakeCache()

    async def fake_get_cache():
        return fake_cache

    monkeypatch.setattr(
        "backend.services.unified_cache_service.get_cache",
        fake_get_cache,
        raising=False,
    )

    from backend.routes.propfinder_routes import get_prop_opportunities

    fake_request = FakeRequest(headers={"if-none-match": "test-etag-123"})

    resp = await get_prop_opportunities(
        sports=None,
        confidence_min=None,
        confidence_max=None,
        edge_min=None,
        edge_max=None,
        markets=None,
        venues=None,
        sharp_money=None,
        bookmarked_only=False,
        alert_triggered_only=False,
        force_flat_baseline=False,
        diagnostics=False,
        include_clv=False,
        clv_diag=0,
        user_id=None,
        limit=50,
        search=None,
        fields=None,
        request=fake_request,
    )

    assert isinstance(resp, Response)
    assert resp.status_code == 304
    assert resp.headers.get("ETag") == "test-etag-123"


@pytest.mark.asyncio
async def test_get_prop_opportunities_returns_200_with_etag_when_no_match(monkeypatch):
    # Patch the unified cache getter to return a cached payload with etag
    class _FakeCache:
        async def get(self, key, default=None, user_context=None):
            return {
                "etag": "test-etag-456",
                "payload": {
                    "opportunities": [],
                    "meta": {"etag": "test-etag-456"},
                },
            }

    fake_cache = _FakeCache()

    async def fake_get_cache():
        return fake_cache

    monkeypatch.setattr(
        "backend.services.unified_cache_service.get_cache",
        fake_get_cache,
        raising=False,
    )

    from backend.routes.propfinder_routes import get_prop_opportunities

    fake_request = FakeRequest(headers={})

    resp = await get_prop_opportunities(
        sports=None,
        confidence_min=None,
        confidence_max=None,
        edge_min=None,
        edge_max=None,
        markets=None,
        venues=None,
        sharp_money=None,
        bookmarked_only=False,
        alert_triggered_only=False,
        force_flat_baseline=False,
        diagnostics=False,
        include_clv=False,
        clv_diag=0,
        user_id=None,
        limit=50,
        search=None,
        fields=None,
        request=fake_request,
    )

    # JSONResponse is also a Response subclass and should carry headers
    assert isinstance(resp, Response)
    assert resp.status_code == 200
    assert resp.headers.get("ETag") == "test-etag-456"
