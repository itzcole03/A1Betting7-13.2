#!/usr/bin/env python3
"""
Debug test for router inclusion mechanism
"""

from fastapi import APIRouter, FastAPI

# Create a test router exactly like enhanced_api
test_router = APIRouter(tags=["test_api"])


@test_router.get("/simple-test")
async def simple_test():
    """Simple test endpoint"""
    return {"message": "Test router working", "status": "success"}


@test_router.get("/another-test")
async def another_test():
    """Another test endpoint"""
    return {"message": "Another test working", "status": "success"}


# Create test app
app = FastAPI(title="Router Test")

# Include router with /v1 prefix (same as production)
app.include_router(test_router, prefix="/v1")


# Add a direct test route for comparison
@app.get("/direct-test")
async def direct_test():
    """Direct app route test"""
    return {"message": "Direct route working", "status": "success"}


# Debug: Check routes after inclusion
print(f"Total app routes: {len(app.routes)}")
for i, route in enumerate(app.routes):
    if hasattr(route, "path"):
        print(
            f"Route {i}: {route.path} - {route.methods if hasattr(route, 'methods') else 'N/A'}"
        )
    elif hasattr(route, "path_regex"):
        print(
            f"Route {i}: {route.path_regex.pattern} - {route.methods if hasattr(route, 'methods') else 'N/A'}"
        )

if __name__ == "__main__":
    import uvicorn

    print("Starting debug router test server on port 8001...")
    uvicorn.run(app, host="0.0.0.0", port=8001)
