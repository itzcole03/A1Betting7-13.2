pause
@echo off
REM Set backend host/port from environment or use defaults
SET HOST=%HOST%
SET PORT=%PORT%
IF "%HOST%"=="" SET HOST=0.0.0.0
IF "%PORT%"=="" SET PORT=8000

REM Set frontend port from environment or use default
SET FRONTEND_PORT=%FRONTEND_PORT%
IF "%FRONTEND_PORT%"=="" SET FRONTEND_PORT=8173

REM Start backend (FastAPI) using python -m uvicorn for Windows compatibility
start "Backend" cmd /k "cd backend && python -m uvicorn main:app --host %HOST% --port %PORT% --reload"
REM Start frontend (React/Electron)
start "Frontend" cmd /k "cd frontend && set PORT=%FRONTEND_PORT% && npm run dev"
REM Instructions
ECHO Backend running on http://localhost:%PORT%
ECHO Frontend running on http://localhost:%FRONTEND_PORT% (or check terminal for port)
ECHO Press any key to exit this window.
pause
