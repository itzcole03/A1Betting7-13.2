# A1Betting Development Commands
# PowerShell equivalent of Makefile targets

# Default help target
function Show-Help {
    Write-Host "A1Betting Development Commands"
    Write-Host "=============================="
    Write-Host ""
    Write-Host "Backend Commands:"
    Write-Host "  Start-Backend      - Start the FastAPI backend server"
    Write-Host "  Test-Backend       - Run backend tests with pytest"
    Write-Host "  Test-Auth          - Run auth route conformance tests"
    Write-Host ""
    Write-Host "Frontend Commands:"
    Write-Host "  Start-Frontend     - Start the Vite development server"
    Write-Host "  Test-Frontend      - Run frontend tests with Jest"
    Write-Host "  Build-Frontend     - Build frontend for production"
    Write-Host ""
    Write-Host "Testing & Validation:"
    Write-Host "  Test-Smoke         - Run smoke tests against running backend"
    Write-Host "  Test-All           - Run all test suites"
    Write-Host "  Validate-Health    - Quick health check of all services"
    Write-Host ""
    Write-Host "Utility Commands:"
    Write-Host "  Clean-Cache        - Clear node_modules and Python cache"
    Write-Host "  Install-Deps       - Install all dependencies"
    Write-Host "  Check-Ports        - Check if required ports are available"
    Write-Host ""
    Write-Host "Usage: . .\dev-commands.ps1; <Command-Name>"
    Write-Host "Example: . .\dev-commands.ps1; Test-Smoke"
}

# Backend commands
function Start-Backend {
    Write-Host "Starting FastAPI backend server..."
    python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
}

function Test-Backend {
    Write-Host "Running backend tests..."
    pytest -v
}

function Test-Auth {
    Write-Host "Running auth route conformance tests..."
    pytest -v backend/tests/test_auth_route_conformance.py
}

# Frontend commands
function Start-Frontend {
    Write-Host "Starting Vite frontend development server..."
    Set-Location frontend
    npm run dev
}

function Test-Frontend {
    Write-Host "Running frontend tests..."
    Set-Location frontend
    npm run test
}

function Build-Frontend {
    Write-Host "Building frontend for production..."
    Set-Location frontend
    npm run build
}

# Testing and validation
function Test-Smoke {
    param(
        [string]$BaseUrl = "http://127.0.0.1:8000"
    )
    Write-Host "Running smoke tests against $BaseUrl..."
    .\smoke-test.ps1 $BaseUrl
}

function Test-All {
    Write-Host "Running all test suites..."
    Write-Host ""
    Write-Host "1. Backend tests..."
    Test-Backend
    Write-Host ""
    Write-Host "2. Frontend tests..."
    Test-Frontend
    Write-Host ""
    Write-Host "3. Auth conformance tests..."
    Test-Auth
    Write-Host ""
    Write-Host "4. Smoke tests..."
    Test-Smoke
}

function Validate-Health {
    Write-Host "Performing quick health validation..."
    
    # Check backend health
    try {
        $response = Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/health" -UseBasicParsing -TimeoutSec 5
        Write-Host "✅ Backend health: OK ($($response.StatusCode))"
    } catch {
        Write-Host "❌ Backend health: FAILED ($($_.Exception.Message))"
    }
    
    # Check auth readiness
    try {
        $response = Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/auth/login" -Method HEAD -UseBasicParsing -TimeoutSec 5
        Write-Host "✅ Auth readiness: OK ($($response.StatusCode))"
    } catch {
        Write-Host "❌ Auth readiness: FAILED ($($_.Exception.Message))"
    }
    
    # Check frontend (if running)
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing -TimeoutSec 5
        Write-Host "✅ Frontend: OK ($($response.StatusCode))"
    } catch {
        Write-Host "⚠️  Frontend: Not running or not accessible"
    }
}

# Utility commands
function Clean-Cache {
    Write-Host "Cleaning caches..."
    
    # Clean Python cache
    Get-ChildItem -Path . -Recurse -Name "__pycache__" | Remove-Item -Recurse -Force
    Get-ChildItem -Path . -Recurse -Name "*.pyc" | Remove-Item -Force
    
    # Clean frontend node_modules if exists
    if (Test-Path "frontend/node_modules") {
        Write-Host "Removing frontend/node_modules..."
        Remove-Item "frontend/node_modules" -Recurse -Force
    }
    
    # Clean frontend build output
    if (Test-Path "frontend/dist") {
        Write-Host "Removing frontend/dist..."
        Remove-Item "frontend/dist" -Recurse -Force
    }
    
    Write-Host "Cache cleanup complete!"
}

function Install-Deps {
    Write-Host "Installing all dependencies..."
    
    # Install Python dependencies
    Write-Host "Installing Python dependencies..."
    pip install -r backend/requirements.txt
    
    # Install frontend dependencies
    Write-Host "Installing frontend dependencies..."
    Set-Location frontend
    npm install
    Set-Location ..
    
    Write-Host "Dependencies installed!"
}

function Check-Ports {
    Write-Host "Checking required ports..."
    
    $ports = @(8000, 5173)
    foreach ($port in $ports) {
        try {
            $connection = Test-NetConnection -ComputerName "127.0.0.1" -Port $port -WarningAction SilentlyContinue -InformationLevel Quiet
            if ($connection.TcpTestSucceeded) {
                Write-Host "⚠️  Port $port is IN USE"
            } else {
                Write-Host "✅ Port $port is AVAILABLE"
            }
        } catch {
            Write-Host "✅ Port $port is AVAILABLE"
        }
    }
}

# Export functions for use
Export-ModuleMember -Function *

# Show help by default when sourced
if ($MyInvocation.InvocationName -eq ".") {
    Show-Help
}