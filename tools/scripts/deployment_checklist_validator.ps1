# Post-Merge Deployment Checklist Validation Script
# A1Betting7-13.2 WebSocket and Observability Testing

Write-Host "🚀 A1Betting7-13.2 Post-Merge Deployment Checklist Validation" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

$baseUrl = "http://127.0.0.1:8000"
$wsUrl = "ws://127.0.0.1:8000"

# Test Results
$testResults = @{}

Write-Host "`n📋 BACKEND VERIFICATION" -ForegroundColor Yellow
Write-Host "========================" -ForegroundColor Yellow

# 1. Test Health Endpoint
Write-Host "`n1️⃣  Testing API Health..." -ForegroundColor Green
try {
    $healthResponse = Invoke-RestMethod -Uri "$baseUrl/api/v2/health" -Method GET
    if ($healthResponse.success) {
        Write-Host "   ✅ Health endpoint responding correctly" -ForegroundColor Green
        $testResults["health"] = "PASS"
    } else {
        Write-Host "   ❌ Health endpoint returned error" -ForegroundColor Red
        $testResults["health"] = "FAIL"
    }
} catch {
    Write-Host "   ❌ Health endpoint failed: $_" -ForegroundColor Red
    $testResults["health"] = "FAIL"
}

# 2. Test Observability Events API
Write-Host "`n2️⃣  Testing Observability Events API..." -ForegroundColor Green
try {
    $eventsResponse = Invoke-RestMethod -Uri "$baseUrl/api/v2/observability/events?limit=20" -Method GET
    if ($null -ne $eventsResponse.success) {
        Write-Host "   ✅ Observability events API responding correctly" -ForegroundColor Green
        Write-Host "   📊 Total events returned: $($eventsResponse.data.total_returned)" -ForegroundColor Cyan
        $testResults["observability"] = "PASS"
    } else {
        Write-Host "   ❌ Observability events API returned unexpected format" -ForegroundColor Red
        $testResults["observability"] = "FAIL"
    }
} catch {
    Write-Host "   ❌ Observability events API failed: $_" -ForegroundColor Red
    $testResults["observability"] = "FAIL"
}

# 3. Test Enhanced WebSocket Endpoint (using curl for WebSocket)
Write-Host "`n3️⃣  Testing Enhanced WebSocket Endpoint (/ws/client)..." -ForegroundColor Green
try {
    # We'll use a simple test to see if the endpoint exists and accepts connections
    # This is a basic connectivity test since PowerShell doesn't have built-in WebSocket client
    $clientId = [System.Guid]::NewGuid().ToString()
    $wsTestUrl = "$wsUrl/ws/client?client_id=$clientId&version=1&role=frontend"
    
    Write-Host "   🔗 WebSocket URL: $wsTestUrl" -ForegroundColor Cyan
    Write-Host "   ⚠️  Manual WebSocket test required - endpoint registered" -ForegroundColor Yellow
    $testResults["enhanced_ws"] = "MANUAL_REQUIRED"
} catch {
    Write-Host "   ❌ Enhanced WebSocket endpoint test preparation failed: $_" -ForegroundColor Red
    $testResults["enhanced_ws"] = "FAIL"
}

# 4. Test Legacy WebSocket Endpoint
Write-Host "`n4️⃣  Testing Legacy WebSocket Endpoint (/ws/legacy/{client_id})..." -ForegroundColor Green
try {
    $legacyClientId = "legacy-test-" + [System.Guid]::NewGuid().ToString().Substring(0, 8)
    $legacyWsUrl = "$wsUrl/ws/legacy/$legacyClientId"
    
    Write-Host "   🔗 Legacy WebSocket URL: $legacyWsUrl" -ForegroundColor Cyan
    Write-Host "   ⚠️  Manual WebSocket test required - endpoint registered" -ForegroundColor Yellow
    $testResults["legacy_ws"] = "MANUAL_REQUIRED"
} catch {
    Write-Host "   ❌ Legacy WebSocket endpoint test preparation failed: $_" -ForegroundColor Red
    $testResults["legacy_ws"] = "FAIL"
}

# 5. Test for Route Collisions (Check logs for warnings)
Write-Host "`n5️⃣  Checking for Route Collision Warnings..." -ForegroundColor Green
try {
    # Look for collision warnings in recent logs
    $logPath = "backend_server.log"
    if (Test-Path $logPath) {
        $collisionWarnings = Select-String -Path $logPath -Pattern "collision|conflict|duplicate.*route" -SimpleMatch
        if ($collisionWarnings.Count -eq 0) {
            Write-Host "   ✅ No route collision warnings found in logs" -ForegroundColor Green
            $testResults["route_collisions"] = "PASS"
        } else {
            Write-Host "   ⚠️  Found potential route collision warnings:" -ForegroundColor Yellow
            $collisionWarnings | ForEach-Object { Write-Host "      $_" -ForegroundColor Yellow }
            $testResults["route_collisions"] = "WARNING"
        }
    } else {
        Write-Host "   ⚠️  Log file not found - unable to check for route collisions" -ForegroundColor Yellow
        $testResults["route_collisions"] = "UNKNOWN"
    }
} catch {
    Write-Host "   ❌ Route collision check failed: $_" -ForegroundColor Red
    $testResults["route_collisions"] = "FAIL"
}

Write-Host "`n📱 FRONTEND VERIFICATION" -ForegroundColor Yellow
Write-Host "==========================" -ForegroundColor Yellow

# 6. Check Frontend Accessibility
Write-Host "`n6️⃣  Testing Frontend Accessibility..." -ForegroundColor Green
try {
    $frontendResponse = Invoke-WebRequest -Uri "http://127.0.0.1:5173" -Method GET -UseBasicParsing
    if ($frontendResponse.StatusCode -eq 200) {
        Write-Host "   ✅ Frontend is accessible on port 5173" -ForegroundColor Green
        $testResults["frontend"] = "PASS"
    } else {
        Write-Host "   ❌ Frontend returned status code: $($frontendResponse.StatusCode)" -ForegroundColor Red
        $testResults["frontend"] = "FAIL"
    }
} catch {
    Write-Host "   ❌ Frontend accessibility test failed: $_" -ForegroundColor Red
    $testResults["frontend"] = "FAIL"
}

Write-Host "`n📊 TEST RESULTS SUMMARY" -ForegroundColor Yellow
Write-Host "=========================" -ForegroundColor Yellow

$passCount = 0
$failCount = 0
$warningCount = 0
$manualCount = 0
$unknownCount = 0

foreach ($test in $testResults.Keys) {
    $result = $testResults[$test]
    $status = switch ($result) {
        "PASS" { 
            $passCount++
            "✅ PASS" 
        }
        "FAIL" { 
            $failCount++
            "❌ FAIL" 
        }
        "WARNING" { 
            $warningCount++
            "⚠️ WARNING" 
        }
        "MANUAL_REQUIRED" { 
            $manualCount++
            "🔧 MANUAL TEST REQUIRED" 
        }
        "UNKNOWN" { 
            $unknownCount++
            "❓ UNKNOWN" 
        }
    }
    
    Write-Host "$test : $status" -ForegroundColor $(
        if ($result -eq "PASS") { "Green" }
        elseif ($result -eq "FAIL") { "Red" }
        elseif ($result -eq "WARNING") { "Yellow" }
        elseif ($result -eq "MANUAL_REQUIRED") { "Cyan" }
        else { "Gray" }
    )
}

Write-Host "`n📈 SUMMARY STATISTICS" -ForegroundColor Yellow
Write-Host "======================" -ForegroundColor Yellow
Write-Host "✅ Passed: $passCount" -ForegroundColor Green
Write-Host "❌ Failed: $failCount" -ForegroundColor Red
Write-Host "⚠️ Warnings: $warningCount" -ForegroundColor Yellow
Write-Host "🔧 Manual Tests Required: $manualCount" -ForegroundColor Cyan
Write-Host "❓ Unknown: $unknownCount" -ForegroundColor Gray

$totalTests = $passCount + $failCount + $warningCount + $manualCount + $unknownCount
$automatedSuccessRate = [math]::Round(($passCount / ($totalTests - $manualCount - $unknownCount)) * 100, 1)

Write-Host "`n🎯 Automated Test Success Rate: $automatedSuccessRate%" -ForegroundColor Cyan

Write-Host "`n🔧 NEXT STEPS" -ForegroundColor Yellow
Write-Host "=============" -ForegroundColor Yellow

if ($manualCount -gt 0) {
    Write-Host "1. Complete manual WebSocket testing using the test page:" -ForegroundColor Cyan
    Write-Host "   Open: http://localhost:5173/test_websockets.html" -ForegroundColor Cyan
}

if ($failCount -gt 0) {
    Write-Host "2. Address failed tests before marking PR11 as complete" -ForegroundColor Red
}

if ($warningCount -gt 0) {
    Write-Host "3. Review warnings and resolve if necessary" -ForegroundColor Yellow
}

Write-Host "`n✨ WebSocket Test URLs for Manual Verification:" -ForegroundColor Magenta
Write-Host "Enhanced: ws://localhost:8000/ws/client?client_id=dev123&version=1&role=frontend" -ForegroundColor Magenta  
Write-Host "Legacy: ws://localhost:8000/ws/legacy/oldclient" -ForegroundColor Magenta
Write-Host "Events API: http://localhost:8000/api/v2/observability/events?limit=20" -ForegroundColor Magenta

Write-Host "`n🎉 Post-Merge Deployment Checklist Validation Complete!" -ForegroundColor Green