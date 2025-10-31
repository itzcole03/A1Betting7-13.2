from fastapi import FastAPI
from fastapi.responses import JSONResponse
from starlette.testclient import TestClient

from backend.middleware.caching_middleware import CachingMiddleware


def make_app():
    app = FastAPI()

    @app.get("/test/compact")
    def compact():
        return JSONResponse(
            content={
                "opportunities": [
                    {"id": "o1", "player": "P1", "lastUpdated": "2025-10-27T00:00:00Z"}
                ],
                "summary": {"total": 1},
            }
        )

    # Add middleware with a cache_config that enables ETag for our test path
    cache_config = {
        "/test/compact": {
            "max_age": 60,
            "must_revalidate": True,
            "public": True,
            "etag": True,
        }
    }

    app.add_middleware(CachingMiddleware, cache_config=cache_config, enable_etag=True)
    return app


def test_caching_middleware_etag_and_304():
    app = make_app()
    client = TestClient(app)

    # First request should return 200 and include an ETag header
    r1 = client.get("/test/compact")
    assert r1.status_code == 200
    assert "ETag" in r1.headers or "etag" in r1.headers

    etag = r1.headers.get("ETag") or r1.headers.get("etag")
    assert etag is not None

    # Second request with If-None-Match should yield 304 Not Modified
    r2 = client.get("/test/compact", headers={"If-None-Match": etag})
    assert r2.status_code == 304


def test_caching_middleware_mismatch_returns_200():
    app = make_app()
    client = TestClient(app)

    # Provide a bogus ETag - should not short-circuit
    r = client.get("/test/compact", headers={"If-None-Match": '"bogus-etag"'})
    assert r.status_code == 200
    # New ETag should be present
    assert "ETag" in r.headers or "etag" in r.headers
