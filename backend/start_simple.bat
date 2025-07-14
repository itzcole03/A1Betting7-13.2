@echo off
echo ========================================
echo  A1Betting Backend Startup Script
echo ========================================
echo Starting Simple A1Betting Backend...
cd /d "%~dp0"
echo Current directory: %CD%

echo.
echo Checking virtual environment...
if not exist "venv\Scripts\activate.bat" (
    echo ❌ ERROR: Virtual environment not found!
    echo Please ensure venv is properly created by running:
    echo   python -m venv venv
    echo   venv\Scripts\activate.bat
    echo   pip install -r requirements.txt
    echo.
    pause
    exit /b 1
)

echo ✅ Virtual environment found
echo.

echo Activating virtual environment...
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo ❌ ERROR: Failed to activate virtual environment
    pause
    exit /b 1
)

echo ✅ Virtual environment activated
echo.

echo Checking Python installation...
python --version
if errorlevel 1 (
    echo ❌ ERROR: Python not found in virtual environment
    pause
    exit /b 1
)

echo.
echo Checking if simple_healthy_backend.py exists...
if not exist "simple_healthy_backend.py" (
    echo ❌ ERROR: simple_healthy_backend.py not found!
    pause
    exit /b 1
)

echo ✅ Backend script found
echo.

echo 🚀 Starting backend server on port 8000...
echo Press Ctrl+C to stop the server
echo.
python simple_healthy_backend.py

echo.
echo Backend server stopped.
pause
