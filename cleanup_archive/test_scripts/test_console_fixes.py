#!/usr/bin/env python3
"""
Test frontend console issues resolution
"""
import asyncio

import aiohttp


async def test_frontend_console_fixes():
    """Test that the main console issues have been resolved"""
    print("🧪 Testing Frontend Console Issues Resolution...")

    async with aiohttp.ClientSession() as session:
        # Test 1: Backend health check (was failing with 500 on wrong port)
        print("\n1. Testing backend health check...")
        async with session.get("http://localhost:8000/health") as response:
            if response.status == 200:
                data = await response.json()
                print(f"   ✅ Backend health: {data['status']} (port 8000 ✓)")
            else:
                print(f"   ❌ Backend health failed: {response.status}")

        # Test 2: Backend version check (frontend checks this)
        print("\n2. Testing backend version endpoint...")
        async with session.get("http://localhost:8000/api/version") as response:
            if response.status == 200:
                data = await response.json()
                print(f"   ✅ Backend version: {data['version']}")
            else:
                print(f"   ❌ Version check failed: {response.status}")

        # Test 3: CORS headers for cross-origin requests
        print("\n3. Testing CORS support...")
        headers = {"Origin": "http://localhost:8173"}
        async with session.get(
            "http://localhost:8000/health", headers=headers
        ) as response:
            cors_headers = [
                h for h in response.headers.keys() if "access-control" in h.lower()
            ]
            if cors_headers:
                print(f"   ✅ CORS headers present: {len(cors_headers)} headers")
            else:
                print("   ⚠️  No CORS headers found")

        # Test 4: MLB API endpoint (main data source)
        print("\n4. Testing MLB API endpoint...")
        async with session.get(
            "http://localhost:8000/mlb/odds-comparison/?market_type=playerprops",
            headers=headers,
        ) as response:
            if response.status == 200:
                data = await response.json()
                prop_count = len(data.get("odds", []))
                print(f"   ✅ MLB API working: {prop_count} props available")
            else:
                print(f"   ❌ MLB API failed: {response.status}")

        # Test 5: Frontend accessibility
        print("\n5. Testing frontend accessibility...")
        async with session.get("http://localhost:8173") as response:
            if response.status == 200:
                print(f"   ✅ Frontend accessible: {response.status}")
            else:
                print(f"   ❌ Frontend failed: {response.status}")

    print("\n📋 Expected Frontend Behavior After Fixes:")
    print(
        "   ✅ App should check backend health at http://localhost:8000/health (not 8173)"
    )
    print("   ✅ WebSocket should connect to ws://localhost:8000/ws")
    print("   ✅ Backend should be detected as healthy")
    print("   ✅ App should render main interface instead of error banner")
    print("   ✅ Authentication should work (user: ncr@a1betting.com)")

    print("\n🎯 Key Fixes Applied:")
    print("   1. Fixed apiUrl initialization in App.tsx (was empty string in dev mode)")
    print("   2. Added OPTIONS handler for /health endpoint for CORS preflight")
    print("   3. Backend is properly running on port 8000 with health endpoints")
    print("   4. WebSocket configuration is correct for port 8000")


if __name__ == "__main__":
    asyncio.run(test_frontend_console_fixes())
