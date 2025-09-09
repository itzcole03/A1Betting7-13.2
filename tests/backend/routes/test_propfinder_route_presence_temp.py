import os
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_propfinder_route_exists(app, client: AsyncClient):
    # Ensure legacy diagnostics are enabled for this test run
    os.environ["LEGACY_DEBUG"] = "1"

    resp = await client.get("/api/propfinder/opportunities")
    if resp.status_code == 404:
        # Dump a concise route list for diagnostics
        paths = []
        for route in app.routes:
            try:
                path = getattr(route, "path", None) or getattr(route, "path_format", None)
                if path:
                    paths.append(path)
            except Exception:
                continue

        # Sort and include a small sample of nearby paths
        paths = sorted(set(paths))
        sample = [p for p in paths if "/propfinder" in p or "/api" in p][:50]
        pytest.fail(
            "PropFinder route missing: /api/propfinder/opportunities.\n"
            f"Status: {resp.status_code}\n"
            f"JSON: {resp.text}\n"
            f"Known API paths (sample):\n" + "\n".join(sample)
        )

    assert resp.status_code in (200, 204)