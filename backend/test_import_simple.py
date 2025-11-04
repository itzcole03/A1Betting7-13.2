#!/usr/bin/env python3
"""Simple test to check if create_app can be imported and executed."""

import os
import sys

# Add the project root to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from backend.core.app import create_app

    print("✓ Successfully imported create_app")

    app = create_app()
    print("✓ Successfully created app")
    print(f"✓ App has {len(app.routes)} routes")

    # Test a simple health endpoint
    from fastapi.testclient import TestClient

    client = TestClient(app)

    response = client.get("/health")
    print(f"✓ Health endpoint status: {response.status_code}")
    if response.status_code == 200:
        print("✓ Health endpoint returned 200 OK")
    else:
        print(f"✗ Health endpoint failed: {response.text}")

except Exception as e:
    print(f"✗ Error: {e}")
    import traceback

    traceback.print_exc()
    sys.exit(1)
