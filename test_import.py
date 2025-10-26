#!/usr/bin/env python3
"""Test script to diagnose backend import issues"""

import os
import sys

sys.path.insert(0, r"c:\Users\bcmad\Downloads\A1Betting7-13.2")

try:
    print("Testing create_app import...")
    from backend.core.app import create_app

    print("✓ create_app imported successfully")

    print("Testing app creation...")
    app = create_app()
    print(f"✓ App created successfully with {len(app.routes)} routes")

    print("Testing main.py import...")
    from backend.main import app as main_app

    print("✓ main.py imported successfully")

    print("All imports successful!")

except Exception as e:
    print(f"❌ Error: {e}")
    import traceback

    traceback.print_exc()
    sys.exit(1)
