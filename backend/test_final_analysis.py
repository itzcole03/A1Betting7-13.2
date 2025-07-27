import json
import os

import pytest
from httpx import AsyncClient

# Load test payloads once
path = os.path.join(os.path.dirname(__file__), "test_payloads.json")
with open(path, "r", encoding="utf-8") as f:
    TEST_CASES = json.load(f)

BASE_URL = "http://localhost:8000"


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "case", TEST_CASES, ids=[case["description"] for case in TEST_CASES]
)
async def test_final_analysis(case):
    async with AsyncClient(base_url=BASE_URL) as client:
        resp = await client.post("/api/propollama/final_analysis", json=case["payload"])
        assert resp.status_code == 200, f"{case['description']} failed: {resp.text}"
        data = resp.json()
        # All responses should have 'content' and 'error' keys
        assert (
            "content" in data and "error" in data
        ), f"Missing keys in response: {data}"
        # If this is a 'should fail' case, error should be non-empty
        if "should fail" in case["description"].lower():
            assert data["error"], f"Expected error for: {case['description']}"
        else:
            assert not data["error"], f"Unexpected error for: {case['description']}"
            assert data["content"], f"Expected content for: {case['description']}"
