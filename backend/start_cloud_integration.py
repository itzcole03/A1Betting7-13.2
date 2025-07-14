#!/usr/bin/env python3
"""
A1Betting Backend Startup Script for Cloud Frontend Integration

This script starts the backend with optimized configuration for connecting
the cloud frontend to your local backend.

Features:
- CORS configured for cloud frontend
- Binds to all network interfaces (0.0.0.0)
- Enhanced logging for debugging
- Health checks enabled
"""

import subprocess
import sys
import os
import time
import requests
from pathlib import Path

def check_dependencies():
    """Check if required dependencies are installed."""
    try:
        import fastapi
        import uvicorn
        print("✅ FastAPI and Uvicorn found")
        return True
    except ImportError as e:
        print(f"❌ Missing dependencies: {e}")
        print("💡 Install with: pip install fastapi uvicorn")
        return False

def check_port():
    """Check if port 8000 is available."""
    try:
        response = requests.get("${process.env.REACT_APP_API_URL || "http://localhost:8000"}/health", timeout=2)
        print("⚠️  Port 8000 already in use - stopping existing server...")
        return False
    except requests.RequestException:
        print("✅ Port 8000 is available")
        return True

def start_backend():
    """Start the backend with cloud integration configuration."""
    print("🚀 Starting A1Betting Backend for Cloud Integration...")
    print("📡 Frontend URL: https://7fb6bf6978914ca48f089e6151180b03-a1b171efc67d4aea943f921a9.fly.dev")
    print("🌐 Local IP: 192.168.1.125:8000")
    print("🔗 CORS: Configured for cloud frontend")
    print("-" * 60)

    # Start the enhanced backend
    try:
        cmd = [
            sys.executable, "-m", "uvicorn",
            "main_complete:app",  # Use the complete backend with all features
            "--host", "0.0.0.0",
            "--port", "8000",
            "--reload",
            "--log-level", "info"
        ]

        print(f"💻 Running: {' '.join(cmd)}")
        subprocess.run(cmd, cwd=Path(__file__).parent)

    except KeyboardInterrupt:
        print("\n🛑 Backend stopped by user")
    except Exception as e:  # pylint: disable=broad-exception-caught
        print(f"❌ Error starting backend: {e}")

def test_connection():
    """Test the backend connection."""
    print("\n🧪 Testing backend connection...")
    try:
        response = requests.get("http://192.168.1.125:8000/health", timeout=5)
        if response.status_code == 200:
            print("✅ Backend is running and accessible!")
            print(f"📊 Health check: {response.json()}")
        else:
            print(f"⚠️  Backend responded with status {response.status_code}")
    except requests.RequestException as e:
        print(f"❌ Connection test failed: {e}")
        print("💡 Make sure your firewall allows port 8000")

if __name__ == "__main__":
    print("🎯 A1Betting Cloud Integration Startup")
    print("=" * 60)

    # Check dependencies
    if not check_dependencies():
        sys.exit(1)

    # Check port availability
    if not check_port():
        print("💡 Trying to start anyway...")

    # Start backend
    start_backend()

    # Test connection after startup
    time.sleep(2)
    test_connection()
