@echo off
echo 🐍 A1Betting Python Backend Startup
echo =====================================

cd /d "%~dp0"
echo 📁 Current directory: %CD%

echo.
echo 🔍 Checking Python installation...
python --version
if %errorlevel% neq 0 (
    echo ❌ Python not found in PATH
    echo 💡 Please install Python 3.8+ and add to PATH
    pause
    exit /b 1
)

echo.
echo 📦 Installing/checking dependencies...
python -m pip install fastapi uvicorn --quiet
if %errorlevel% neq 0 (
    echo ⚠️ Dependency installation issues, continuing anyway...
)

echo.
echo 🚀 Starting Python backend options:
echo.
echo 1. Simple Backend (Recommended)
echo 2. Production Backend (ML-Powered) - PERSISTENT SERVER
echo 3. Enhanced Backend (Complex dependencies)  
echo 4. Exit
echo.
set /p choice="Choose option (1-4): "

if "%choice%"=="1" (
    echo.
    echo 🎯 Starting Simple Python Backend...
    echo 📊 This will provide basic API endpoints for testing
    echo 🔗 Frontend will connect automatically
    echo.
    python simple_backend.py
) else if "%choice%"=="2" (
    echo.
    echo 🎯 Starting Production Backend with ML - PERSISTENT SERVER...
    echo 🚀 This will start a persistent FastAPI server at http://localhost:8000
    echo 🤖 ML models load in background, no startup delay
    echo 📊 Real PrizePicks data with ML predictions
    echo 🔗 Frontend can connect immediately at http://localhost:8000
    echo.
    echo ⭐ SERVER RUNNING PERSISTENTLY - Press Ctrl+C to stop
    echo.
    python production_fix.py
) else if "%choice%"=="3" (
    echo.
    echo 🎯 Starting Enhanced Python Backend...
    echo ⚠️ This requires complex ML dependencies
    echo.
    python run_backend.py
) else if "%choice%"=="4" (
    echo.
    echo 👋 Exiting...
    exit /b 0
) else (
    echo.
    echo ❌ Invalid choice. Defaulting to Simple Backend...
    python simple_backend.py
)

echo.
echo 📱 Backend startup completed
pause
