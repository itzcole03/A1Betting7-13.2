#!/usr/bin/env pwsh
# PowerShell script to run k6 load tests on Windows

param(
    [string]$Scenario = "all",
    [string]$Duration = "",
    [int]$VUs = 0,
    [switch]$Quick = $false,
    [switch]$Install = $false
)

Write-Host "🚀 A1Betting Performance Load Test Runner" -ForegroundColor Green

# Install k6 if requested
if ($Install) {
    Write-Host "📦 Installing k6..." -ForegroundColor Yellow
    
    # Check if chocolatey is available
    if (Get-Command choco -ErrorAction SilentlyContinue) {
        choco install k6 -y
    } else {
        Write-Host "⚠️  Chocolatey not found. Please install k6 manually:" -ForegroundColor Yellow
        Write-Host "   1. Download from https://k6.io/docs/get-started/installation/" -ForegroundColor White
        Write-Host "   2. Extract k6.exe to your PATH" -ForegroundColor White
        exit 1
    }
}

# Check if k6 is installed
if (-not (Get-Command k6 -ErrorAction SilentlyContinue)) {
    Write-Host "❌ k6 not found. Please install k6 first:" -ForegroundColor Red
    Write-Host "   Run: ./run-load-tests.ps1 -Install" -ForegroundColor Yellow
    Write-Host "   Or manually install from https://k6.io/" -ForegroundColor Yellow
    exit 1
}

# Check if backend is running
Write-Host "🔍 Checking backend health..." -ForegroundColor Yellow

try {
    $healthCheck = Invoke-WebRequest -Uri "http://127.0.0.1:8000/health" -TimeoutSec 5
    if ($healthCheck.StatusCode -eq 200) {
        Write-Host "✅ Backend is healthy" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Backend responded with status: $($healthCheck.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Backend not responding. Please start the backend first:" -ForegroundColor Red
    Write-Host "   python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload" -ForegroundColor White
    exit 1
}

# Set test file path
$testFile = "tests/load/performance-load-test.js"

if (-not (Test-Path $testFile)) {
    Write-Host "❌ Test file not found: $testFile" -ForegroundColor Red
    exit 1
}

# Build k6 command
$k6Args = @("run")

# Add summary options for detailed metrics
$k6Args += "--summary-trend-stats=avg,min,med,max,p(95),p(99)"

# Handle quick test option
if ($Quick) {
    $k6Args += "--vus", "1"
    $k6Args += "--duration", "30s"
    Write-Host "⚡ Running quick smoke test (1 user, 30 seconds)" -ForegroundColor Yellow
} elseif ($VUs -gt 0 -and $Duration -ne "") {
    $k6Args += "--vus", $VUs
    $k6Args += "--duration", $Duration
    Write-Host "🎯 Running custom test ($VUs users, $Duration)" -ForegroundColor Yellow
}

# Handle specific scenarios
if ($Scenario -ne "all") {
    $k6Args += "--env", "SCENARIO=$Scenario"
    Write-Host "📊 Running scenario: $Scenario" -ForegroundColor Yellow
}

# Add test file
$k6Args += $testFile

Write-Host "🏃 Starting k6 load test..." -ForegroundColor Green
Write-Host "Command: k6 $($k6Args -join ' ')" -ForegroundColor Gray

# Run k6 test
try {
    & k6 @k6Args
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Load test completed successfully!" -ForegroundColor Green
        
        # Final health check
        try {
            $finalCheck = Invoke-WebRequest -Uri "http://127.0.0.1:8000/health" -TimeoutSec 5
            if ($finalCheck.StatusCode -eq 200) {
                Write-Host "✅ Backend remained healthy after test" -ForegroundColor Green
            } else {
                Write-Host "⚠️  Backend health degraded (Status: $($finalCheck.StatusCode))" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "⚠️  Backend became unresponsive after test" -ForegroundColor Yellow
        }
        
    } else {
        Write-Host "❌ Load test failed with exit code: $LASTEXITCODE" -ForegroundColor Red
        exit $LASTEXITCODE
    }
    
} catch {
    Write-Host "❌ Error running k6 test: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📈 Load Test Summary:" -ForegroundColor Cyan
Write-Host "   • Sports activation workflow tested" -ForegroundColor White
Write-Host "   • ML inference throughput measured" -ForegroundColor White
Write-Host "   • Cache performance validated" -ForegroundColor White
Write-Host "   • Pagination stress tested" -ForegroundColor White
Write-Host ""
Write-Host "💡 Next Steps:" -ForegroundColor Cyan
Write-Host "   • Review detailed metrics above" -ForegroundColor White
Write-Host "   • Check backend logs for errors" -ForegroundColor White
Write-Host "   • Monitor resource usage during tests" -ForegroundColor White
Write-Host "   • Optimize bottlenecks identified" -ForegroundColor White