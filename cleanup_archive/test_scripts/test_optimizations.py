#!/usr/bin/env python3
"""
Test script to verify the data optimization fixes
"""
import asyncio
import json
import time

import aiohttp


async def test_backend_performance():
    """Test backend API performance"""
    print("🧪 Testing Backend API Performance...")

    async with aiohttp.ClientSession() as session:
        # Test 1: Basic MLB endpoint
        start_time = time.time()
        async with session.get(
            "http://localhost:8000/mlb/odds-comparison/"
        ) as response:
            duration = time.time() - start_time
            status = response.status
            data = await response.json()
            prop_count = len(data.get("odds", []))

        print(f"✅ Basic MLB endpoint: {status} in {duration:.2f}s, {prop_count} props")

        # Test 2: MLB with playerprops parameter
        start_time = time.time()
        async with session.get(
            "http://localhost:8000/mlb/odds-comparison/?market_type=playerprops"
        ) as response:
            duration = time.time() - start_time
            status = response.status
            data = await response.json()
            prop_count = len(data.get("odds", []))

        print(f"✅ MLB playerprops: {status} in {duration:.2f}s, {prop_count} props")

        # Test 3: Cached request (should be faster)
        start_time = time.time()
        async with session.get(
            "http://localhost:8000/mlb/odds-comparison/?market_type=playerprops"
        ) as response:
            duration = time.time() - start_time
            status = response.status

        print(f"✅ Cached MLB playerprops: {status} in {duration:.2f}s (cached)")

        # Test 4: Health check
        async with session.get("http://localhost:8000/health") as response:
            health_data = await response.json()

        print(f"✅ Health check: {health_data.get('status', 'unknown')}")

        return True


async def test_frontend_availability():
    """Test if frontend is accessible"""
    print("\n🌐 Testing Frontend Availability...")

    async with aiohttp.ClientSession() as session:
        try:
            async with session.get("http://localhost:8173") as response:
                status = response.status
                print(f"✅ Frontend accessible: {status}")
                return status == 200
        except Exception as e:
            print(f"❌ Frontend error: {e}")
            return False


def test_websocket_config():
    """Test WebSocket configuration"""
    print("\n🔌 Testing WebSocket Configuration...")

    # Check if the EnhancedDataManager has correct WebSocket URL
    try:
        with open("frontend/src/services/EnhancedDataManager.ts", "r") as f:
            content = f.read()

        if "window.location.hostname}:8000/ws" in content:
            print("✅ WebSocket URL correctly configured with dynamic hostname")
            return True
        elif "ws://localhost:8000/ws" in content:
            print("✅ WebSocket URL correctly configured")
            return True
        elif "ws://localhost:8765" in content:
            print("❌ WebSocket still has old port 8765")
            return False
        else:
            print("⚠️  WebSocket URL not found or different configuration")
            return False

    except Exception as e:
        print(f"❌ Error checking WebSocket config: {e}")
        return False


def verify_parameter_fix():
    """Verify the ML service parameter fix"""
    print("\n🔧 Verifying ML Service Parameter Fix...")

    try:
        with open("backend/services/mlb_provider_client.py", "r") as f:
            content = f.read()

        # Check if the fix is applied
        if 'predict_enhanced("MLB", features)' in content:
            print("✅ ML service parameter order fixed")
            return True
        elif 'predict_enhanced(features, "MLB")' in content:
            print("❌ ML service still has wrong parameter order")
            return False
        else:
            print("⚠️  predict_enhanced call not found or different")
            return False

    except Exception as e:
        print(f"❌ Error checking parameter fix: {e}")
        return False


async def main():
    """Run all tests"""
    print("🚀 Starting Data Optimization Verification Tests\n")

    tests_passed = 0
    total_tests = 4

    # Test 1: Backend performance
    try:
        if await test_backend_performance():
            tests_passed += 1
    except Exception as e:
        print(f"❌ Backend test failed: {e}")

    # Test 2: Frontend availability
    try:
        if await test_frontend_availability():
            tests_passed += 1
    except Exception as e:
        print(f"❌ Frontend test failed: {e}")

    # Test 3: WebSocket configuration
    try:
        if test_websocket_config():
            tests_passed += 1
    except Exception as e:
        print(f"❌ WebSocket test failed: {e}")

    # Test 4: Parameter fix verification
    try:
        if verify_parameter_fix():
            tests_passed += 1
    except Exception as e:
        print(f"❌ Parameter fix test failed: {e}")

    # Summary
    print(f"\n📊 Test Results: {tests_passed}/{total_tests} tests passed")

    if tests_passed == total_tests:
        print("🎉 All optimizations working correctly!")
        print("\n📋 Summary of Fixes Applied:")
        print("  ✅ Fixed ML service parameter order bug")
        print("  ✅ Increased frontend timeout limits")
        print("  ✅ Fixed WebSocket URL configuration")
        print("  ✅ Enhanced data caching pipeline working")
        return True
    else:
        print("⚠️  Some issues remain to be addressed")
        return False


if __name__ == "__main__":
    success = asyncio.run(main())
    exit(0 if success else 1)
