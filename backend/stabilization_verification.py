#!/usr/bin/env python3
"""
Final Stabilization Verification Script

Tests all stabilization fixes to ensure emergency objectives are met:
✅ Health endpoint normalization (no more 404s)
✅ UnifiedDataService method fixes (no more cacheData errors) 
✅ Lean mode functionality (configurable monitoring)
✅ CORS and WebSocket still working correctly

Usage: python stabilization_verification.py
"""

import asyncio
import os
import sys
import json
import aiohttp
from pathlib import Path


class StabilizationVerifier:
    """Verify all stabilization fixes are working correctly"""
    
    def __init__(self):
        self.backend_url = "http://localhost:8000"
        self.frontend_url = "http://localhost:5173"
        self.results = []
        
    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        self.results.append((name, success, details))
        print(f"{status} {name}")
        if details:
            print(f"    {details}")
    
    async def test_health_endpoints(self):
        """Test all health endpoint variations"""
        print("\n🔍 Testing Health Endpoints...")
        
        endpoints = [
            "/api/health",     # Original canonical endpoint
            "/health",         # New alias
            "/api/v2/health",  # Version-specific alias
        ]
        
        async with aiohttp.ClientSession() as session:
            for endpoint in endpoints:
                try:
                    url = f"{self.backend_url}{endpoint}"
                    
                    # Test GET method
                    async with session.get(url) as response:
                        success = response.status == 200
                        data = await response.json()
                        has_correct_format = (
                            "success" in data and 
                            "data" in data and 
                            "error" in data
                        )
                        
                        self.log_test(
                            f"GET {endpoint}",
                            success and has_correct_format,
                            f"Status: {response.status}, Format: {'✓' if has_correct_format else '✗'}"
                        )
                    
                    # Test HEAD method
                    async with session.head(url) as response:
                        success = response.status == 200
                        self.log_test(
                            f"HEAD {endpoint}",
                            success,
                            f"Status: {response.status}"
                        )
                        
                except Exception as e:
                    self.log_test(f"GET {endpoint}", False, f"Error: {str(e)}")
                    self.log_test(f"HEAD {endpoint}", False, f"Error: {str(e)}")
    
    async def test_performance_stats_endpoint(self):
        """Test the performance stats endpoint"""
        print("\n📊 Testing Performance Stats Endpoint...")
        
        async with aiohttp.ClientSession() as session:
            try:
                url = f"{self.backend_url}/performance/stats"
                async with session.get(url) as response:
                    success = response.status == 200
                    data = await response.json()
                    has_performance_data = (
                        "success" in data and 
                        data.get("success") is True and
                        "timestamp" in data.get("data", {})
                    )
                    
                    self.log_test(
                        "Performance Stats Endpoint",
                        success and has_performance_data,
                        f"Status: {response.status}, Has data: {'✓' if has_performance_data else '✗'}"
                    )
            except Exception as e:
                self.log_test("Performance Stats Endpoint", False, f"Error: {str(e)}")
    
    async def test_cors_functionality(self):
        """Test CORS preflight handling"""
        print("\n🌐 Testing CORS Functionality...")
        
        async with aiohttp.ClientSession() as session:
            try:
                url = f"{self.backend_url}/api/health"
                headers = {
                    'Origin': 'http://localhost:5173',
                    'Access-Control-Request-Method': 'GET',
                    'Access-Control-Request-Headers': 'Content-Type'
                }
                
                async with session.options(url, headers=headers) as response:
                    success = response.status == 200
                    has_cors_headers = (
                        'access-control-allow-origin' in response.headers and
                        'access-control-allow-methods' in response.headers
                    )
                    
                    self.log_test(
                        "CORS Preflight",
                        success and has_cors_headers,
                        f"Status: {response.status}, CORS headers: {'✓' if has_cors_headers else '✗'}"
                    )
            except Exception as e:
                self.log_test("CORS Preflight", False, f"Error: {str(e)}")
    
    def test_lean_mode_configuration(self):
        """Test lean mode configuration settings"""
        print("\n⚡ Testing Lean Mode Configuration...")
        
        try:
            # Test environment variable method
            os.environ['APP_DEV_LEAN_MODE'] = 'true'
            from backend.config.settings import Settings
            settings = Settings()
            lean_mode_enabled = settings.app.dev_lean_mode
            
            self.log_test(
                "Lean Mode Environment Variable",
                lean_mode_enabled,
                f"APP_DEV_LEAN_MODE=true → dev_lean_mode={lean_mode_enabled}"
            )
            
            # Clean up
            if 'APP_DEV_LEAN_MODE' in os.environ:
                del os.environ['APP_DEV_LEAN_MODE']
                
            # Test default (should be False)
            settings_default = Settings()
            default_lean_mode = settings_default.app.dev_lean_mode
            
            self.log_test(
                "Lean Mode Default Value",
                not default_lean_mode,
                f"Default dev_lean_mode={default_lean_mode} (should be False)"
            )
            
        except Exception as e:
            self.log_test("Lean Mode Configuration", False, f"Error: {str(e)}")
    
    def test_unified_data_service_methods(self):
        """Test UnifiedDataService has required methods"""
        print("\n🔧 Testing UnifiedDataService Methods...")
        
        try:
            # Import and check the UnifiedDataService
            from pathlib import Path
            service_path = Path("frontend/src/services/unified/UnifiedDataService.ts")
            
            if service_path.exists():
                content = service_path.read_text(encoding='utf-8')
                
                # Check for required methods
                has_cache_data = "async cacheData<T>" in content
                has_get_cached_data = "async getCachedData<T>" in content
                
                self.log_test(
                    "UnifiedDataService.cacheData method",
                    has_cache_data,
                    "Method signature found in source code"
                )
                
                self.log_test(
                    "UnifiedDataService.getCachedData method", 
                    has_get_cached_data,
                    "Method signature found in source code"
                )
            else:
                self.log_test(
                    "UnifiedDataService File",
                    False,
                    f"File not found: {service_path}"
                )
                
        except Exception as e:
            self.log_test("UnifiedDataService Methods", False, f"Error: {str(e)}")
    
    def print_summary(self):
        """Print test results summary"""
        print("\n" + "="*60)
        print("🚨 EMERGENCY STABILIZATION VERIFICATION RESULTS")
        print("="*60)
        
        total_tests = len(self.results)
        passed_tests = sum(1 for _, success, _ in self.results if success)
        failed_tests = total_tests - passed_tests
        
        print(f"\n📊 Summary:")
        print(f"   Total Tests: {total_tests}")
        print(f"   ✅ Passed: {passed_tests}")
        print(f"   ❌ Failed: {failed_tests}")
        print(f"   Success Rate: {(passed_tests/total_tests*100):.1f}%")
        
        if failed_tests > 0:
            print(f"\n❌ Failed Tests:")
            for name, success, details in self.results:
                if not success:
                    print(f"   • {name}: {details}")
        
        print(f"\n🎯 Stabilization Status: {'✅ COMPLETE' if failed_tests == 0 else '⚠️ NEEDS ATTENTION'}")
        
        if failed_tests == 0:
            print("\n🎉 All stabilization objectives achieved!")
            print("   • Health endpoints normalized (no more 404s)")
            print("   • UnifiedDataService methods implemented") 
            print("   • Lean mode configuration working")
            print("   • CORS and performance endpoints functional")
            print("\n💡 Development environment is now clean and optimized!")
        
        print("\n" + "="*60)
        
        return failed_tests == 0


async def main():
    """Run all stabilization verification tests"""
    print("🚨 A1Betting Emergency Stabilization Verification")
    print("Testing all implemented stabilization fixes...\n")
    
    verifier = StabilizationVerifier()
    
    # Run all tests
    await verifier.test_health_endpoints()
    await verifier.test_performance_stats_endpoint() 
    await verifier.test_cors_functionality()
    verifier.test_lean_mode_configuration()
    verifier.test_unified_data_service_methods()
    
    # Print summary and return success status
    success = verifier.print_summary()
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    asyncio.run(main())
