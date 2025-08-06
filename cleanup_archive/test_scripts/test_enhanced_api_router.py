#!/usr/bin/env python3
"""
Test enhanced_api router in isolation
"""

try:
    from backend.routes.enhanced_api import router as enhanced_api_router

    print(f"✅ Enhanced API router imported successfully")
    print(f"Router type: {type(enhanced_api_router)}")
    print(f"Router routes count: {len(enhanced_api_router.routes)}")
    print(f"Router prefix: {enhanced_api_router.prefix}")
    print(f"Router tags: {enhanced_api_router.tags}")

    # List first few routes
    print("\nFirst 5 routes:")
    for i, route in enumerate(enhanced_api_router.routes[:5]):
        if hasattr(route, "path"):
            print(
                f"  Route {i}: {route.path} - {route.methods if hasattr(route, 'methods') else 'N/A'}"
            )

    # Try to create a FastAPI app and include the router
    from fastapi import FastAPI

    test_app = FastAPI(title="Enhanced API Test")

    print(f"\n🧪 Testing router inclusion...")
    test_app.include_router(enhanced_api_router, prefix="/v1")
    print(f"✅ Router included successfully")

    print(f"Total app routes after inclusion: {len(test_app.routes)}")

    # Check for v1 routes
    v1_routes = []
    for route in test_app.routes:
        if hasattr(route, "path") and route.path.startswith("/v1"):
            v1_routes.append(route.path)

    print(f"V1 routes found: {len(v1_routes)}")
    print(f"V1 routes: {v1_routes[:10]}")  # First 10

    print(f"\n✅ Enhanced API router test completed successfully")

except ImportError as e:
    print(f"❌ Import error: {e}")
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback

    traceback.print_exc()
