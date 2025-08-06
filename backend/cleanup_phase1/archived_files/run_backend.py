#!/usr/bin/env python3
"""
A1Betting Backend Startup Script
Fixes import paths and runs the enhanced backend server
"""

import os
import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent.absolute()
sys.path.insert(0, str(backend_dir))

# Add the parent directory as well for any cross-directory imports
parent_dir = backend_dir.parent
sys.path.insert(0, str(parent_dir))

# Set working directory to backend
os.chdir(backend_dir)

print("🚀 Starting A1Betting Enhanced Backend...")
print(f"📁 Backend directory: {backend_dir}")
print(f"🐍 Python path configured")

try:
    # Import and run the main enhanced backend
    print("📦 Loading enhanced backend modules...")

    # Test critical imports first
    try:
        from config import config_manager
        print("✅ Config module loaded successfully")
    except ImportError as e:
        print(f"❌ Config import failed: {e}")
        sys.exit(1)

    try:
        from ensemble_engine import ultra_ensemble_engine
        print("✅ Ensemble engine loaded successfully")
    except ImportError as e:
        print(f"⚠️ Ensemble engine import failed: {e}")
        print("🔄 Continuing without ensemble engine...")

    # Import and run main enhanced
    print("🎯 Starting main enhanced backend...")
    import main_enhanced

except ImportError as e:
    print(f"❌ Failed to import main_enhanced: {e}")
    print("\n🔍 Trying alternative backend startup...")

    try:
        # Fallback to basic main.py
        print("🔄 Attempting to run basic backend...")
        import main
    except ImportError as e2:
        print(f"❌ Failed to import basic main: {e2}")
        print("\n💡 Alternative: Use the Node.js development backend")
        print("   Run from frontend directory: npm run dev:backend")
        sys.exit(1)

except Exception as e:  # pylint: disable=broad-exception-caught
    print(f"❌ Unexpected error: {e}")
    print("\n🔧 Troubleshooting:")
    print("1. Make sure you're in the backend directory")
    print("2. Install required dependencies: pip install -r requirements.txt")
    print("3. Check Python version (3.8+ recommended)")
    print("4. Alternative: Use Node.js backend with 'npm run dev' from frontend/")
    sys.exit(1)
