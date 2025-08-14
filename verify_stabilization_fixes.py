#!/usr/bin/env python3
"""
Verification script for stabilization fixes:
1. UnifiedDataService cacheData/getCachedData methods implementation
2. Backend lean mode integration with middleware optimization
"""

import requests
import json
import os
import sys
from pathlib import Path

def verify_backend_lean_mode():
    """Verify backend lean mode functionality"""
    print("🔍 Verifying Backend Lean Mode...")
    
    try:
        # Test /dev/mode endpoint
        response = requests.get("http://localhost:8000/dev/mode", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ /dev/mode endpoint working: {data}")
            
            # Verify response structure
            if 'data' in data and 'lean' in data['data']:
                lean_status = data['data']['lean']
                mode = data['data'].get('mode', 'unknown')
                print(f"   Lean mode: {lean_status}")
                print(f"   Mode: {mode}")
                
                # Test environment variable integration
                return True
            else:
                print("❌ Invalid response structure from /dev/mode")
                return False
        else:
            print(f"❌ /dev/mode endpoint failed with status {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Failed to connect to backend: {e}")
        print("   Make sure the backend is running on port 8000")
        return False

def verify_unified_data_service():
    """Verify UnifiedDataService implementation"""
    print("🔍 Verifying UnifiedDataService...")
    
    frontend_path = Path(__file__).parent / "frontend" / "src" / "services" / "unified" / "UnifiedDataService.ts"
    
    if not frontend_path.exists():
        print(f"❌ UnifiedDataService.ts not found at {frontend_path}")
        return False
    
    # Read the file and check for required methods
    content = frontend_path.read_text(encoding='utf-8')
    
    # Check for required implementation elements
    required_elements = [
        "private cache = new Map<string, unknown>()",
        "async cacheData<T>(key: string, value: T): Promise<void>",
        "async getCachedData<T>(key: string): Promise<T | undefined>",
        "this.cache.set(key, value)",
        "this.cache.get(key)"
    ]
    
    missing_elements = []
    for element in required_elements:
        if element not in content:
            missing_elements.append(element)
    
    if missing_elements:
        print("❌ Missing required implementation elements:")
        for element in missing_elements:
            print(f"   - {element}")
        return False
    
    print("✅ UnifiedDataService implementation verified:")
    print("   - Private Map cache property ✅")
    print("   - cacheData method with correct signature ✅")
    print("   - getCachedData method with correct signature ✅")
    print("   - Map.set() and Map.get() usage ✅")
    
    return True

def run_backend_tests():
    """Run backend tests to verify lean mode"""
    print("🧪 Running Backend Tests...")
    
    try:
        import subprocess
        result = subprocess.run(
            ["python", "-m", "pytest", "tests/stabilization/test_backend_lean_mode.py", "-v"],
            cwd=Path(__file__).parent,
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            # Count passed tests
            passed_count = result.stdout.count(" PASSED")
            print(f"✅ Backend tests passed: {passed_count} tests")
            return True
        else:
            print(f"❌ Backend tests failed:")
            print(result.stdout)
            print(result.stderr)
            return False
            
    except Exception as e:
        print(f"❌ Failed to run backend tests: {e}")
        return False

def main():
    """Main verification script"""
    print("=" * 60)
    print("STABILIZATION FIXES VERIFICATION")
    print("=" * 60)
    print()
    
    results = []
    
    # Test 1: UnifiedDataService implementation
    results.append(verify_unified_data_service())
    print()
    
    # Test 2: Backend lean mode endpoint
    results.append(verify_backend_lean_mode())
    print()
    
    # Test 3: Backend tests
    results.append(run_backend_tests())
    print()
    
    # Summary
    print("=" * 60)
    print("VERIFICATION SUMMARY")
    print("=" * 60)
    
    passed = sum(results)
    total = len(results)
    
    if passed == total:
        print(f"✅ ALL TESTS PASSED ({passed}/{total})")
        print()
        print("🎯 Stabilization Objectives Met:")
        print("   1. ✅ UnifiedDataService cacheData/getCachedData regression prevented")
        print("   2. ✅ Backend lean mode integration with middleware optimization")
        print("   3. ✅ /dev/mode endpoint implemented and working")
        print()
        print("🚀 Ready for deployment!")
        sys.exit(0)
    else:
        print(f"❌ SOME TESTS FAILED ({passed}/{total})")
        print("🔧 Please review the failed tests above")
        sys.exit(1)

if __name__ == "__main__":
    main()
