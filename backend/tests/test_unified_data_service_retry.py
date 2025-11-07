import asyncio

import pytest

from backend.services.core.unified_data_service import UnifiedDataService


class FakeResponse:
    def __init__(self, json_data=None, text_data="", status_ok=True, json_raises=False):
        self._json_data = json_data
        self._text_data = text_data
        self._status_ok = status_ok
        self._json_raises = json_raises

    def raise_for_status(self):
        if not self._status_ok:
            raise RuntimeError("bad status")

    def json(self):
        if self._json_raises:
            raise ValueError("invalid json")
        # mimic httpx.Response.json() which is synchronous
        return self._json_data

    @property
    def text(self):
        return self._text_data


class FakeSession:
    def __init__(self, behaviors):
        # behaviors: list of callables that return a FakeResponse or raise
        self.behaviors = behaviors
        self.call_count = 0

    async def get(self, endpoint, params=None):
        if self.call_count >= len(self.behaviors):
            # default to last behavior
            behavior = self.behaviors[-1]
        else:
            behavior = self.behaviors[self.call_count]
        self.call_count += 1
        result = behavior()
        if isinstance(result, Exception):
            raise result
        return result


@pytest.mark.asyncio
async def test_fetch_with_retry_succeeds_after_retries(monkeypatch):
    # First two attempts raise network errors, third returns valid JSON
    behaviors = [
        lambda: (_ for _ in ()).throw(RuntimeError("network error")),
        lambda: (_ for _ in ()).throw(RuntimeError("network error")),
        lambda: FakeResponse(json_data={"ok": True}, text_data="ok", status_ok=True),
    ]

    session = FakeSession(behaviors)

    async def fake_create_session(self):
        return session

    monkeypatch.setattr(UnifiedDataService, "_create_session", lambda self: session)

    svc = UnifiedDataService()
    res = await svc._fetch_with_retry("http://example.com/api", params={})
    assert res == {"ok": True}
    assert session.call_count == 3


@pytest.mark.asyncio
async def test_fetch_with_retry_returns_text_on_json_parse_fail(monkeypatch):
    behaviors = [
        lambda: FakeResponse(
            json_data=None, text_data="plain text", status_ok=True, json_raises=True
        ),
    ]
    session = FakeSession(behaviors)
    monkeypatch.setattr(UnifiedDataService, "_create_session", lambda self: session)

    svc = UnifiedDataService()
    res = await svc._fetch_with_retry("http://example.com/api", params={})
    assert res == {"text": "plain text"}
    assert session.call_count == 1
