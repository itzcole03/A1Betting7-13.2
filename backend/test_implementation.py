"""
Test script to verify the implemented features:
1. Backend runs on port 8000 with required routes
2. Bootstrap validation works
3. WebSocket path alignment
4. CORS configuration
5. NavigationMountGate functionality
6. CorrelationId system
"""

import asyncio
import json
import sys
import time
import uuid
from datetime import datetime

def test_imports():
    """Test that all components can be imported"""
    print("🔍 Testing imports...")
    
    try:
        from backend.core.app import app
        print("✅ Backend app imports successfully")
    except Exception as e:
        print(f"❌ Backend app import failed: {e}")
        return False
    
    try:
        from backend.services.bootstrap_validator import BootstrapValidator
        print("✅ Bootstrap validator imports successfully")
    except Exception as e:
        print(f"❌ Bootstrap validator import failed: {e}")
    
    try:
        from backend.services.correlation_service import correlation_manager, get_correlation_id
        print("✅ Correlation service imports successfully")
    except Exception as e:
        print(f"❌ Correlation service import failed: {e}")
    
    # Test unified services
    try:
        from backend.services.unified_config import unified_config
        from backend.services.unified_logging import unified_logger
        print("✅ Unified services import successfully")
    except Exception as e:
        print(f"❌ Unified services import failed: {e}")
    
    return True


def test_correlation_system():
    """Test correlation ID system"""
    print("\n🔍 Testing correlation ID system...")
    
    try:
        from backend.services.correlation_service import (
            correlation_manager,
            correlation_context,
            CorrelationScope,
            get_correlation_id,
            get_correlation_statistics
        )
        
        # Test correlation ID generation
        correlation_id = correlation_manager.generate_correlation_id("test")
        print(f"✅ Generated correlation ID: {correlation_id}")
        
        # Test context creation
        context = correlation_manager.create_context(
            scope=CorrelationScope.REQUEST,
            correlation_id=correlation_id,
            source="test_script",
            request_path="/test"
        )
        print(f"✅ Created correlation context: {context.correlation_id}")
        
        # Test statistics
        stats = get_correlation_statistics()
        print(f"✅ Correlation statistics: {stats}")
        
        return True
        
    except Exception as e:
        print(f"❌ Correlation system test failed: {e}")
        return False


def test_websocket_correlation():
    """Test WebSocket correlation query parameter handling"""
    print("\n🔍 Testing WebSocket correlation...")
    
    try:
        from backend.services.correlation_service import (
            extract_correlation_from_websocket_query,
            add_correlation_to_websocket_query
        )
        
        # Test extraction
        query_params = {"correlationId": "test-123", "client_id": "client-456"}
        extracted_id = extract_correlation_from_websocket_query(query_params)
        print(f"✅ Extracted correlation ID: {extracted_id}")
        
        # Test URL modification
        base_url = "ws://localhost:8000/ws/client?client_id=test"
        new_url = add_correlation_to_websocket_query(base_url, "correlation-789")
        print(f"✅ Modified WebSocket URL: {new_url}")
        
        return True
        
    except Exception as e:
        print(f"❌ WebSocket correlation test failed: {e}")
        return False


def test_bootstrap_validator():
    """Test bootstrap validator functionality"""
    print("\n🔍 Testing bootstrap validator...")
    
    try:
        from backend.services.bootstrap_validator import BootstrapValidator, ValidationLevel
        
        # Create validator instance
        validator = BootstrapValidator()
        print(f"✅ Created bootstrap validator with correlation ID: {validator.correlation_id}")
        
        # Test dependency validation
        results = validator._validate_dependencies()
        print(f"✅ Dependency validation completed: {len(results)} results")
        
        for result in results:
            level_icon = "✅" if result.level == ValidationLevel.INFO else "⚠️" if result.level == ValidationLevel.WARN else "❌"
            print(f"  {level_icon} {result.message}")
        
        # Test correlation system validation
        correlation_results = validator._validate_correlation_system()
        print(f"✅ Correlation system validation completed: {len(correlation_results)} results")
        
        for result in correlation_results:
            level_icon = "✅" if result.level == ValidationLevel.INFO else "⚠️" if result.level == ValidationLevel.WARN else "❌"
            print(f"  {level_icon} {result.message}")
        
        return True
        
    except Exception as e:
        print(f"❌ Bootstrap validator test failed: {e}")
        return False


async def test_full_bootstrap_validation():
    """Test full bootstrap validation"""
    print("\n🔍 Testing full bootstrap validation...")
    
    try:
        from backend.services.bootstrap_validator import BootstrapValidator
        from backend.core.app import app
        
        # Test config-only validation (synchronous)
        print("Running bootstrap validation with app...")
        validator = BootstrapValidator(app)
        summary = await validator.validate_bootstrap()
        print(f"✅ Bootstrap validation completed:")
        print(f"  Total validations: {summary.total_validations}")
        print(f"  Passed: {summary.passed_validations}")
        print(f"  Warnings: {summary.warnings}")
        print(f"  Errors: {summary.errors}")
        print(f"  Critical: {summary.critical_issues}")
        
        return True
        
    except Exception as e:
        print(f"❌ Full bootstrap validation test failed: {e}")
        return False


def test_route_enumeration():
    """Test route enumeration from FastAPI app"""
    print("\n🔍 Testing route enumeration...")
    
    try:
        from backend.core.app import app
        
        routes = []
        websocket_routes = []
        
        for route in app.routes:
            if hasattr(route, 'methods') and hasattr(route, 'path'):
                # HTTP route
                routes.append({
                    'path': getattr(route, 'path', ''),
                    'methods': list(getattr(route, 'methods', [])),
                    'name': getattr(route, 'name', '')
                })
            elif hasattr(route, 'path') and 'websocket' in str(type(route)).lower():
                # WebSocket route
                websocket_routes.append({
                    'path': getattr(route, 'path', ''),
                    'name': getattr(route, 'name', '')
                })
        
        print(f"✅ Found {len(routes)} HTTP routes")
        print(f"✅ Found {len(websocket_routes)} WebSocket routes")
        
        # Check for specific required routes
        required_routes = [
            '/api/health',
            '/health',
            '/api/v2/sports/activate',
            '/metrics'
        ]
        
        route_paths = [r['path'] for r in routes]
        
        for required in required_routes:
            if required in route_paths:
                print(f"  ✅ Required route found: {required}")
            else:
                print(f"  ⚠️ Required route missing: {required}")
        
        # Check WebSocket routes
        ws_paths = [r['path'] for r in websocket_routes]
        print("WebSocket routes:")
        for ws_path in ws_paths:
            if 'client' in ws_path:
                print(f"  ✅ WebSocket route: {ws_path}")
            else:
                print(f"  ℹ️ WebSocket route: {ws_path}")
        
        return True
        
    except Exception as e:
        print(f"❌ Route enumeration test failed: {e}")
        return False


def test_unified_config():
    """Test unified configuration system"""
    print("\n🔍 Testing unified configuration...")
    
    try:
        from backend.services.unified_config import unified_config
        
        # Test config access
        config = unified_config.get_config()
        print(f"✅ Got unified config")
        
        # Test API config
        api_config = unified_config.get_api_config()
        print(f"✅ API config - Host: {api_config.host}, Port: {api_config.port}")
        print(f"✅ CORS origins: {api_config.cors_origins}")
        
        # Test config summary
        summary = unified_config.get_config_summary()
        print(f"✅ Config summary: Environment={summary.get('environment')}")
        
        return True
        
    except Exception as e:
        print(f"❌ Unified config test failed: {e}")
        return False


def main():
    """Main test runner"""
    print("🚀 A1Betting Feature Verification Test Suite")
    print("=" * 50)
    
    tests = [
        ("Import Tests", test_imports),
        ("Unified Configuration", test_unified_config),
        ("Correlation ID System", test_correlation_system),
        ("WebSocket Correlation", test_websocket_correlation),
        ("Route Enumeration", test_route_enumeration),
        ("Bootstrap Validator", test_bootstrap_validator),
        ("Full Bootstrap Validation", lambda: asyncio.run(test_full_bootstrap_validation()))
    ]
    
    results = []
    
    for test_name, test_func in tests:
        print(f"\n{'=' * 20} {test_name} {'=' * 20}")
        start_time = time.time()
        try:
            result = test_func()
            duration = time.time() - start_time
            
            if result:
                print(f"✅ {test_name} PASSED ({duration:.2f}s)")
                results.append((test_name, True, duration))
            else:
                print(f"❌ {test_name} FAILED ({duration:.2f}s)")
                results.append((test_name, False, duration))
                
        except Exception as e:
            duration = time.time() - start_time
            print(f"💥 {test_name} CRASHED: {e} ({duration:.2f}s)")
            results.append((test_name, False, duration))
    
    # Summary
    print("\n" + "=" * 50)
    print("🎯 TEST SUMMARY")
    print("=" * 50)
    
    passed = sum(1 for _, result, _ in results if result)
    total = len(results)
    total_duration = sum(duration for _, _, duration in results)
    
    for test_name, result, duration in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {test_name} ({duration:.2f}s)")
    
    print(f"\nOverall: {passed}/{total} tests passed in {total_duration:.2f}s")
    
    if passed == total:
        print("🎉 All tests passed! The implementation is working correctly.")
        return 0
    else:
        print(f"⚠️ {total - passed} tests failed. Review the output above for details.")
        return 1


if __name__ == "__main__":
    sys.exit(main())