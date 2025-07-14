#!/usr/bin/env python3
"""
Test script to verify the API endpoint returns only in-season props
"""
import asyncio
import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import pytest
from fastapi.testclient import TestClient
from simple_server import app


@pytest.mark.asyncio
async def test_api_endpoint():
    """Test the API endpoint directly"""
    client = TestClient(app)
    response = client.get("/api/prizepicks/props/enhanced")
    assert response.status_code == 200, f"API returned status {response.status_code}"
    props = response.json()
    assert isinstance(props, list), "API response is not a list of props"
    sports_found = {prop.get("sport", "Unknown") for prop in props}

    # NFL should not be present in July
    if "NFL" in sports_found:
        nfl_props = [p for p in props if p.get("sport") == "NFL"]
        print(f"NFL props found: {len(nfl_props)}")
        for prop in nfl_props[:3]:  # Show first 3
            print(
                f"  - {prop.get('player_name', 'Unknown')} ({prop.get('sport', 'Unknown')})"
            )
        assert False, "NFL props found in July response!"
    else:
        print("✅ CORRECT: No NFL props in July response")

    # Check if MLB is included (should be in July)
    if "MLB" in sports_found:
        print("✅ CORRECT: MLB props found in July response")
        mlb_props = [p for p in props if p.get("sport") == "MLB"]
        print(f"MLB props found: {len(mlb_props)}")
        for prop in mlb_props[:3]:  # Show first 3
            print(
                f"  - {prop.get('player_name', 'Unknown')} ({prop.get('sport', 'Unknown')})"
            )
    else:
        print("❌ ERROR: No MLB props found in July response!")
        return False

    print("✅ API endpoint seasonal filtering test passed!")
    return True


if __name__ == "__main__":
    success = asyncio.run(test_api_endpoint())
    sys.exit(0 if success else 1)
