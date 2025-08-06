"""
Multi-Sport API Integration Test Suite

Tests the Phase 3 multi-sport support including:
- NBA service integration
- Unified sports interface
- Cross-sport analytics
- Service health monitoring
"""

import asyncio
import json
from typing import Any, Dict

import aiohttp
from aiohttp import ClientTimeout

# Test configuration
BASE_URL = "http://localhost:8000"
TIMEOUT = ClientTimeout(total=30)


async def test_endpoint(
    session: aiohttp.ClientSession, endpoint: str, description: str
) -> Dict[str, Any]:
    """Test a single endpoint and return results"""
    print(f"Testing {description}...")

    try:
        async with session.get(f"{BASE_URL}{endpoint}", timeout=TIMEOUT) as response:
            if response.status == 200:
                data = await response.json()
                print(f"✅ {description}: SUCCESS")
                return {
                    "endpoint": endpoint,
                    "status": "success",
                    "status_code": response.status,
                    "data": data,
                }
            else:
                text = await response.text()
                print(f"❌ {description}: HTTP {response.status}")
                return {
                    "endpoint": endpoint,
                    "status": "error",
                    "status_code": response.status,
                    "error": text,
                }
    except Exception as e:
        print(f"❌ {description}: Exception - {e}")
        return {"endpoint": endpoint, "status": "exception", "error": str(e)}


async def run_multi_sport_tests():
    """Run comprehensive multi-sport API tests"""

    print("🏈 Starting Multi-Sport API Integration Tests")
    print("=" * 60)

    # Test endpoints
    tests = [
        # Health checks
        ("/health", "Basic Health Check"),
        ("/sports/health", "Multi-Sport Health Check"),
        # NBA endpoints (direct)
        ("/nba/health", "NBA Service Health"),
        ("/nba/teams", "NBA Teams"),
        ("/nba/players", "NBA Players"),
        ("/nba/games", "NBA Games"),
        ("/nba/odds-comparison/", "NBA Odds Comparison"),
        # Unified sports interface
        ("/sports/NBA/teams", "NBA Teams (Unified)"),
        ("/sports/MLB/teams", "MLB Teams (Unified)"),
        ("/sports/NFL/teams", "NFL Teams (Unified)"),
        ("/sports/NHL/teams", "NHL Teams (Unified)"),
        # Cross-sport analytics
        ("/sports/odds/unified", "Unified Odds Comparison"),
        # OpenAPI documentation
        ("/docs", "OpenAPI Documentation"),
        ("/openapi.json", "OpenAPI Spec"),
    ]

    results = []

    async with aiohttp.ClientSession() as session:
        for endpoint, description in tests:
            result = await test_endpoint(session, endpoint, description)
            results.append(result)

    # Summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)

    success_count = len([r for r in results if r["status"] == "success"])
    total_count = len(results)

    print(f"✅ Successful: {success_count}/{total_count}")
    print(f"❌ Failed: {total_count - success_count}/{total_count}")

    # Show detailed results for key endpoints
    print("\n🔍 KEY ENDPOINT DETAILS:")
    key_endpoints = [
        "/sports/health",
        "/nba/health",
        "/sports/NBA/teams",
        "/sports/odds/unified",
    ]

    for result in results:
        if result["endpoint"] in key_endpoints and result["status"] == "success":
            print(f"\n{result['endpoint']}:")
            print(
                json.dumps(result["data"], indent=2)[:500] + "..."
                if len(str(result["data"])) > 500
                else json.dumps(result["data"], indent=2)
            )

    # Show any errors
    errors = [r for r in results if r["status"] != "success"]
    if errors:
        print("\n⚠️ ERRORS:")
        for error in errors:
            print(f"{error['endpoint']}: {error.get('error', 'Unknown error')}")

    print("\n🎯 Phase 3 Multi-Sport Integration Status:")
    if success_count >= total_count * 0.8:  # 80% success rate
        print("✅ EXCELLENT - Multi-sport infrastructure operational!")
    elif success_count >= total_count * 0.6:  # 60% success rate
        print("⚠️ GOOD - Most features working, some issues to resolve")
    else:
        print("❌ NEEDS WORK - Significant issues detected")

    return results


if __name__ == "__main__":
    print("Starting Multi-Sport API Integration Tests...")
    results = asyncio.run(run_multi_sport_tests())
    print(f"\nTest completed. Results: {len(results)} endpoints tested.")
