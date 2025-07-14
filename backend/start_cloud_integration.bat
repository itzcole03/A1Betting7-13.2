@echo off
echo 🎯 A1Betting Cloud Integration Startup
echo ============================================================
echo 🚀 Starting backend for cloud frontend integration...
echo 📡 Frontend URL: https://7fb6bf6978914ca48f089e6151180b03-a1b171efc67d4aea943f921a9.fly.dev
echo 🌐 Local IP: 192.168.1.125:8000
echo 🔗 CORS: Configured for cloud frontend
echo ============================================================

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found! Please install Python first.
    pause
    exit /b 1
)

REM Check if FastAPI is installed
python -c "import fastapi" >nul 2>&1
if errorlevel 1 (
    echo ❌ FastAPI not found! Installing dependencies...
    pip install fastapi uvicorn
)

echo ✅ Starting A1Betting Enhanced Backend...
echo 💡 Press Ctrl+C to stop the server
echo.

REM Start the backend with cloud integration settings
python -m uvicorn main_complete:app --host 0.0.0.0 --port 8000 --reload --log-level info

echo.
echo 🛑 Backend stopped
pause
