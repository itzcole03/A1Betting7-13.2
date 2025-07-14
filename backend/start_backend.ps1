# A1Betting Backend PowerShell Startup Script
# Provides robust, non-interactive backend server startup

param(
    [string]$Mode = "production",
    [int]$Port = 8000,
    [string]$Host = "0.0.0.0",
    [switch]$NoReload,
    [switch]$Verbose
)

Write-Host "🚀 A1Betting Backend PowerShell Launcher" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Change to script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir
Write-Host "📁 Working directory: $ScriptDir" -ForegroundColor Yellow

# Check Python installation
Write-Host "🔍 Checking Python installation..." -ForegroundColor Green
try {
    $PythonVersion = python --version 2>&1
    Write-Host "✅ $PythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python not found in PATH" -ForegroundColor Red
    Write-Host "💡 Please install Python 3.8+ and add to PATH" -ForegroundColor Yellow
    exit 1
}

# Install/check dependencies
Write-Host ""
Write-Host "📦 Installing/checking dependencies..." -ForegroundColor Green
try {
    python -m pip install fastapi uvicorn numpy --quiet --no-warn-script-location
    Write-Host "✅ Dependencies ready" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Dependency installation issues, continuing anyway..." -ForegroundColor Yellow
}

# Determine which backend to start
Write-Host ""
$BackendFile = ""
$Description = ""

switch ($Mode.ToLower()) {
    "simple" {
        $BackendFile = "simple_backend.py"
        $Description = "Simple Backend (Mock Data)"
    }
    "production" {
        $BackendFile = "production_fix.py"  
        $Description = "Production Backend (ML-Powered)"
    }
    "main" {
        $BackendFile = "main.py"
        $Description = "Main Backend (Full Features)"
    }
    default {
        $BackendFile = "production_fix.py"
        $Description = "Production Backend (ML-Powered) - Default"
    }
}

# Check if backend file exists
if (!(Test-Path $BackendFile)) {
    Write-Host "❌ Backend file not found: $BackendFile" -ForegroundColor Red
    Write-Host "📁 Available files:" -ForegroundColor Yellow
    Get-ChildItem *.py | ForEach-Object { Write-Host "   - $($_.Name)" -ForegroundColor Cyan }
    exit 1
}

Write-Host "🎯 Starting $Description..." -ForegroundColor Cyan
Write-Host "📄 Backend file: $BackendFile" -ForegroundColor Yellow
Write-Host "🌐 Server URL: http://${Host}:$Port" -ForegroundColor Yellow
Write-Host "📊 API Docs: http://localhost:$Port/docs" -ForegroundColor Yellow

if ($Mode -eq "production") {
    Write-Host "🤖 ML models will load in background (no startup delay)" -ForegroundColor Green
    Write-Host "📊 Real PrizePicks data with ML predictions available" -ForegroundColor Green
}

Write-Host ""
Write-Host "⭐ PERSISTENT SERVER MODE - Use Ctrl+C to stop" -ForegroundColor Magenta
Write-Host "🔄 Auto-reload: $(-not $NoReload)" -ForegroundColor Yellow
Write-Host ""

# Start the server
try {
    if ($BackendFile -eq "production_fix.py" -or $BackendFile -eq "main.py") {
        # Use direct Python execution for our files with built-in uvicorn
        Write-Host "🚀 Starting server with built-in launcher..." -ForegroundColor Green
        python $BackendFile
    } else {
        # Use uvicorn directly for simple_backend
        $ReloadFlag = if ($NoReload) { "" } else { "--reload" }
        $LogLevel = if ($Verbose) { "debug" } else { "info" }
        
        Write-Host "🚀 Starting server with uvicorn..." -ForegroundColor Green
        $AppModule = $BackendFile.Replace(".py", ":app")
        uvicorn $AppModule --host $Host --port $Port $ReloadFlag --log-level $LogLevel
    }
} catch {
    Write-Host "❌ Server startup failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally {
    Write-Host ""
    Write-Host "✅ A1Betting Backend Server shutdown complete" -ForegroundColor Green
}
