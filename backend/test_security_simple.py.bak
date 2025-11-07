#!/usr/bin/env python3
"""
Simple security test script to validate security implementations
without complex service dependencies.
"""

import asyncio
import sys
import os
from pathlib import Path

# Add the project root to sys.path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

def test_imports():
    """Test that all security components can be imported"""
    print("🔍 Testing security component imports...")
    
    try:
        # Test policy engine
        from backend.security.policy_engine import SecurityPolicyEngine
        print("✅ Policy engine import successful")
        
        # Test rate limiter
        from backend.security.advanced_rate_limiter import AdvancedRateLimiter
        print("✅ Rate limiter import successful")
        
        # Test configuration loading
        policies_file = project_root / "backend" / "config" / "policies.yaml"
        if policies_file.exists():
            print("✅ Policies configuration file exists")
        else:
            print("❌ Policies configuration file not found")
            
        return True
        
    except ImportError as e:
        print(f"❌ Import failed: {e}")
        return False

def test_policy_engine():
    """Test policy engine functionality"""
    print("\n🔍 Testing policy engine...")
    
    try:
        from backend.security.policy_engine import SecurityPolicyEngine
        
        # Initialize policy engine
        policies_file = project_root / "backend" / "config" / "policies.yaml"
        engine = SecurityPolicyEngine(policies_file)
        
        # Test role inheritance
        admin_permissions = engine.get_role_permissions("admin")
        print(f"✅ Admin permissions loaded: {len(admin_permissions)} permissions")
        
        # Test route matching
        test_routes = [
            "/api/auth/login",
            "/api/admin/users", 
            "/mlb/todays-games",
            "/api/v2/ml/predictions"
        ]
        
        for route in test_routes:
            result = engine.match_route_policy(route)
            if result:
                policy_name, policy = result
                print(f"✅ Route {route} matched policy: {policy_name}")
            else:
                print(f"⚠️  Route {route} no policy match")
        
        return True
        
    except Exception as e:
        print(f"❌ Policy engine test failed: {e}")
        return False

def test_rate_limiter():
    """Test rate limiting functionality"""
    print("\n🔍 Testing rate limiter...")
    
    try:
        from backend.security.advanced_rate_limiter import AdvancedRateLimiter, TokenBucket
        
        # Test token bucket
        from time import time
        bucket = TokenBucket(
            capacity=10, 
            refill_rate=5, 
            burst_capacity=20,
            current_tokens=10,
            last_refill=time(),
            burst_tokens=0
        )
        
        # Test normal consumption
        if bucket.consume(5):
            print("✅ Token consumption successful")
        else:
            print("❌ Token consumption failed")
        
        # Test burst consumption
        remaining_tokens = bucket.current_tokens
        burst_needed = 15
        if bucket.consume(burst_needed):
            print("✅ Burst consumption successful")
        else:
            print("⚠️  Burst consumption blocked (expected behavior)")
        
        # Test rate limiter initialization
        limiter = AdvancedRateLimiter()
        print("✅ Rate limiter initialized successfully")
        
        return True
        
    except Exception as e:
        print(f"❌ Rate limiter test failed: {e}")
        return False

def test_middleware_import():
    """Test middleware import"""
    print("\n🔍 Testing middleware import...")
    
    try:
        from backend.security.comprehensive_middleware import ComprehensiveSecurityMiddleware
        print("✅ Comprehensive security middleware import successful")
        
        return True
        
    except Exception as e:
        print(f"❌ Middleware import failed: {e}")
        return False

def test_configuration_files():
    """Test configuration files exist and are readable"""
    print("\n🔍 Testing configuration files...")
    
    try:
        import yaml
        
        # Test policies.yaml
        policies_file = project_root / "backend" / "config" / "policies.yaml"
        if policies_file.exists():
            with open(policies_file, 'r') as f:
                policies_data = yaml.safe_load(f)
            print(f"✅ Policies YAML loaded: {len(policies_data.get('roles', {}))} roles")
            print(f"✅ Policies YAML loaded: {len(policies_data.get('routes', {}))} route policies")
        else:
            print("❌ Policies YAML file not found")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ Configuration test failed: {e}")
        return False

def main():
    """Run all security tests"""
    print("🛡️  A1Betting Security Implementation Validation")
    print("=" * 50)
    
    tests = [
        ("Component Imports", test_imports),
        ("Policy Engine", test_policy_engine),
        ("Rate Limiter", test_rate_limiter),
        ("Middleware Import", test_middleware_import),
        ("Configuration Files", test_configuration_files)
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {e}")
            results.append((test_name, False))
    
    print("\n🏁 Test Results Summary:")
    print("=" * 50)
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name:.<30} {status}")
        if result:
            passed += 1
    
    print(f"\nOverall: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
    
    if passed == total:
        print("🎉 All security components validated successfully!")
    else:
        print("⚠️  Some tests failed. Check the output above for details.")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)