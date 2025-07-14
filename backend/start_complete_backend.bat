@echo off
echo 🚀 A1Betting Complete Enhanced Backend Startup
echo =============================================

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
echo 📦 Installing/checking ALL dependencies...
echo This may take a few minutes for first-time setup...
python install_all_dependencies.py

echo.
echo 🎯 Starting Complete Enhanced Backend...
echo Features: PropOllama AI, SHAP Explainability, Advanced ML
echo.

echo Choose startup option:
echo 1. Complete Enhanced Backend (Recommended)
echo 2. Simple Fallback Backend
echo 3. Install Dependencies Only
echo 4. Exit
echo.
set /p choice="Choose option (1-4): "

if "%choice%"=="1" (
    echo.
    echo 🤖 Starting Complete Enhanced Backend with PropOllama...
    echo 📊 Features: AI Chat, SHAP Explanations, Advanced Predictions
    echo 🔗 Frontend will connect to enhanced API endpoints
    echo.
    python main_complete.py
) else if "%choice%"=="2" (
    echo.
    echo 🔄 Starting Simple Fallback Backend...
    python simple_backend.py
) else if "%choice%"=="3" (
    echo.
    echo 📦 Dependencies installed. You can now run:
    echo    python main_complete.py
    echo.
    pause
    exit /b 0
) else if "%choice%"=="4" (
    echo.
    echo 👋 Exiting...
    exit /b 0
) else (
    echo.
    echo ❌ Invalid choice. Starting Complete Enhanced Backend...
    python main_complete.py
)

echo.
echo 📱 Backend startup completed
echo Your frontend should now have access to:
echo   - PropOllama AI Chat with SHAP explanations
echo   - Enhanced prediction endpoints
echo   - Advanced analytics and risk management
echo   - Real-time AI insights
echo.
pause
