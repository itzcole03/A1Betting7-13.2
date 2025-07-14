#!/bin/bash

echo "🐍 A1Betting Python Backend Startup"
echo "====================================="

# Change to script directory
cd "$(dirname "$0")"
echo "📁 Current directory: $(pwd)"

echo ""
echo "🔍 Checking Python installation..."
if ! command -v python3 &> /dev/null; then
    if ! command -v python &> /dev/null; then
        echo "❌ Python not found"
        echo "💡 Please install Python 3.8+ first"
        exit 1
    else
        PYTHON_CMD="python"
    fi
else
    PYTHON_CMD="python3"
fi

$PYTHON_CMD --version

echo ""
echo "📦 Installing/checking dependencies..."
$PYTHON_CMD -m pip install fastapi uvicorn --quiet 2>/dev/null || echo "⚠️ Dependency installation issues, continuing anyway..."

echo ""
echo "🚀 Starting Python backend options:"
echo ""
echo "1. Simple Backend (Recommended)"
echo "2. Enhanced Backend (Complex dependencies)"
echo "3. Exit"
echo ""
read -p "Choose option (1-3): " choice

case $choice in
    1)
        echo ""
        echo "🎯 Starting Simple Python Backend..."
        echo "📊 This will provide basic API endpoints for testing"
        echo "🔗 Frontend will connect automatically"
        echo ""
        $PYTHON_CMD simple_backend.py
        ;;
    2)
        echo ""
        echo "🎯 Starting Enhanced Python Backend..."
        echo "⚠️ This requires complex ML dependencies"
        echo ""
        $PYTHON_CMD run_backend.py
        ;;
    3)
        echo ""
        echo "👋 Exiting..."
        exit 0
        ;;
    *)
        echo ""
        echo "❌ Invalid choice. Defaulting to Simple Backend..."
        $PYTHON_CMD simple_backend.py
        ;;
esac

echo ""
echo "📱 Backend startup completed"
