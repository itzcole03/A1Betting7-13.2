@echo off
REM =============================================================================
REM Stabilization Validation Batch Wrapper
REM =============================================================================
REM Simple wrapper to run the PowerShell stabilization validation script
REM Usage: Double-click this file or run from command line
REM =============================================================================

echo.
echo ===============================================
echo A1Betting Stabilization Validation
echo ===============================================
echo.

REM Check if PowerShell is available
powershell -Command "Write-Host 'PowerShell available'" >nul 2>&1
if errorlevel 1 (
    echo ERROR: PowerShell is not available on this system
    echo Please install PowerShell or run the validation manually
    pause
    exit /b 1
)

REM Run the PowerShell validation script
echo Running stabilization validation...
echo.

powershell -ExecutionPolicy Bypass -File "scripts\verify_stabilization.ps1"

REM Check the result
if errorlevel 1 (
    echo.
    echo ===============================================
    echo VALIDATION FAILED - Please check the errors above
    echo ===============================================
) else (
    echo.
    echo ===============================================
    echo VALIDATION PASSED - All stabilization features working
    echo ===============================================
)

echo.
echo Press any key to exit...
pause >nul
