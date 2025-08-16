#!/usr/bin/env pwsh

# A1Betting Smoke Test Script
# Validates key API endpoints for pre-deployment checks
# Usage: .\smoke-test.ps1 [base-url]

param(
    [Parameter(Position=0)]
    [string]$BaseUrl = "http://127.0.0.1:8000",
    [switch]$VerboseOutput,
    [switch]$IgnoreSslErrors
)

# Colors for output
$Green = "`e[32m"
$Red = "`e[31m"
$Yellow = "`e[33m"
$Blue = "`e[34m"
$Reset = "`e[0m"

# Test results tracking
$TestResults = @{
    Total = 0
    Passed = 0
    Failed = 0
    Warnings = 0
}

function Write-TestResult {
    param(
        [string]$TestName,
        [bool]$Success,
        [string]$Details = "",
        [bool]$IsWarning = $false
    )
    
    $TestResults.Total++
    
    if ($IsWarning) {
        $TestResults.Warnings++
        Write-Host "${Yellow}[WARN]${Reset} $TestName - $Details"
    } elseif ($Success) {
        $TestResults.Passed++
        Write-Host "${Green}[PASS]${Reset} $TestName" $(if($Details) { "- $Details" })
    } else {
        $TestResults.Failed++
        Write-Host "${Red}[FAIL]${Reset} $TestName - $Details"
    }
}

function Test-Endpoint {
    param(
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Headers = @{},
        [string]$Body = $null,
        [int[]]$ExpectedStatusCodes = @(200),
        [string[]]$RequiredKeys = @()
    )
    
    try {
        $requestParams = @{
            Uri = $Url
            Method = $Method
            Headers = $Headers
            UseBasicParsing = $true
            TimeoutSec = 10
        }
        
        if ($Body) {
            $requestParams.Body = $Body
            if (-not $Headers.ContainsKey("Content-Type")) {
                $requestParams.Headers["Content-Type"] = "application/json"
            }
        }
        
        if ($IgnoreSslErrors) {
            $requestParams.SkipCertificateCheck = $true
        }
        
        $response = Invoke-WebRequest @requestParams
        
        $result = @{
            Success = $ExpectedStatusCodes -contains $response.StatusCode
            StatusCode = $response.StatusCode
            ContentLength = $response.Content.Length
            ResponseTime = 0  # PowerShell doesn't provide this directly
        }
        
        # Check required keys if JSON response
        if ($RequiredKeys.Count -gt 0 -and $response.Content) {
            try {
                $jsonContent = $response.Content | ConvertFrom-Json
                foreach ($key in $RequiredKeys) {
                    if (-not (Get-Member -InputObject $jsonContent -Name $key -MemberType Properties)) {
                        $result.Success = $false
                        $result.MissingKeys = $RequiredKeys | Where-Object { -not (Get-Member -InputObject $jsonContent -Name $_ -MemberType Properties) }
                        break
                    }
                }
            } catch {
                $result.Success = $false
                $result.JsonParseError = $_.Exception.Message
            }
        }
        
        return $result
    } catch {
        return @{
            Success = $false
            Error = $_.Exception.Message
            StatusCode = 0
        }
    }
}

Write-Host "${Blue}A1Betting Smoke Test Suite${Reset}"
Write-Host "Testing against: $BaseUrl"
Write-Host ""

# Test 1: Health endpoint
Write-Host "${Blue}Testing Health Endpoints...${Reset}"

$healthResult = Test-Endpoint -Url "$BaseUrl/api/v2/diagnostics/health"
if (-not $healthResult.Success) {
    # Fallback to legacy health endpoint
    $legacyHealthResult = Test-Endpoint -Url "$BaseUrl/api/health"
    if ($legacyHealthResult.Success) {
        Write-TestResult -TestName "Health Endpoint (Legacy)" -Success $true -Details "Status: $($legacyHealthResult.StatusCode)" -IsWarning $true
    } else {
        Write-TestResult -TestName "Health Endpoint" -Success $false -Details "Both v2 and legacy failed: $($healthResult.Error)"
    }
} else {
    Write-TestResult -TestName "Health Endpoint (v2)" -Success $true -Details "Status: $($healthResult.StatusCode)"
}

# Test 2: Auth login readiness check (HEAD request)
Write-Host "`n${Blue}Testing Auth Endpoints...${Reset}"

$authReadinessResult = Test-Endpoint -Url "$BaseUrl/api/auth/login" -Method "HEAD" -ExpectedStatusCodes @(204, 200)
Write-TestResult -TestName "Auth Readiness Check" -Success $authReadinessResult.Success -Details $(
    if ($authReadinessResult.Success) { "Status: $($authReadinessResult.StatusCode)" } 
    else { $authReadinessResult.Error }
)

# Test 3: Auth login POST (basic connectivity test)
$authLoginResult = Test-Endpoint -Url "$BaseUrl/api/auth/login" -Method "POST" -Body '{"username":"test","password":"testpass"}' -ExpectedStatusCodes @(200, 400, 401)
Write-TestResult -TestName "Auth Login Endpoint" -Success $authLoginResult.Success -Details $(
    if ($authLoginResult.Success) { "Status: $($authLoginResult.StatusCode) (connectivity OK)" } 
    else { $authLoginResult.Error }
)

# Test 4: ML Model Predict endpoint (if available)
Write-Host "`n${Blue}Testing ML Model Endpoints...${Reset}"

$predictResult = Test-Endpoint -Url "$BaseUrl/api/v2/models/predict" -Method "POST" -Body '{"features":{"x":0.2}}' -ExpectedStatusCodes @(200, 400, 404, 422)
Write-TestResult -TestName "Model Predict Endpoint" -Success $predictResult.Success -Details $(
    if ($predictResult.Success) { 
        if ($predictResult.StatusCode -eq 404) { "Not implemented (OK for current version)" } 
        else { "Status: $($predictResult.StatusCode)" }
    } else { $predictResult.Error }
) -IsWarning ($predictResult.StatusCode -eq 404)

# Test 5: Model Audit Summary (if available)
$auditResult = Test-Endpoint -Url "$BaseUrl/api/v2/models/audit/summary" -ExpectedStatusCodes @(200, 404)
Write-TestResult -TestName "Model Audit Summary" -Success $auditResult.Success -Details $(
    if ($auditResult.Success) { 
        if ($auditResult.StatusCode -eq 404) { "Not implemented (OK for current version)" } 
        else { "Status: $($auditResult.StatusCode)" }
    } else { $auditResult.Error }
) -IsWarning ($auditResult.StatusCode -eq 404)

# Test 6: Observability Events (if available)
Write-Host "`n${Blue}Testing Observability Endpoints...${Reset}"

$observabilityResult = Test-Endpoint -Url "$BaseUrl/api/v2/observability/events?limit=5" -ExpectedStatusCodes @(200, 404)
Write-TestResult -TestName "Observability Events" -Success $observabilityResult.Success -Details $(
    if ($observabilityResult.Success) { 
        if ($observabilityResult.StatusCode -eq 404) { "Not implemented (OK for current version)" } 
        else { "Status: $($observabilityResult.StatusCode)" }
    } else { $observabilityResult.Error }
) -IsWarning ($observabilityResult.StatusCode -eq 404)

# Test 7: Drift Status (if available)
$driftResult = Test-Endpoint -Url "$BaseUrl/api/v2/models/audit/status" -ExpectedStatusCodes @(200, 404)
Write-TestResult -TestName "Model Drift Status" -Success $driftResult.Success -Details $(
    if ($driftResult.Success) { 
        if ($driftResult.StatusCode -eq 404) { "Not implemented (OK for current version)" } 
        else { "Status: $($driftResult.StatusCode)" }
    } else { $driftResult.Error }
) -IsWarning ($driftResult.StatusCode -eq 404)

# Test 8: Basic MLB endpoints (core functionality)
Write-Host "`n${Blue}Testing Core MLB Endpoints...${Reset}"

$mlbGamesResult = Test-Endpoint -Url "$BaseUrl/mlb/todays-games" -ExpectedStatusCodes @(200, 404)
Write-TestResult -TestName "MLB Today's Games" -Success $mlbGamesResult.Success -Details $(
    if ($mlbGamesResult.Success) { "Status: $($mlbGamesResult.StatusCode)" } 
    else { $mlbGamesResult.Error }
)

# Summary
Write-Host "`n${Blue}Test Results Summary${Reset}"
Write-Host "=================="
Write-Host "Total Tests: $($TestResults.Total)"
Write-Host "${Green}Passed: $($TestResults.Passed)${Reset}"
Write-Host "${Red}Failed: $($TestResults.Failed)${Reset}"
Write-Host "${Yellow}Warnings: $($TestResults.Warnings)${Reset}"

# Exit code based on critical failures
$criticalFailures = $TestResults.Failed
if ($criticalFailures -gt 0) {
    Write-Host "`n${Red}CRITICAL: $criticalFailures test(s) failed. Check backend service.${Reset}"
    exit 1
} else {
    Write-Host "`n${Green}SUCCESS: All critical tests passed!${Reset}"
    if ($TestResults.Warnings -gt 0) {
        Write-Host "${Yellow}Note: $($TestResults.Warnings) warnings indicate features not yet implemented.${Reset}"
    }
    exit 0
}