# PropFinder.app PowerShell Reconnaissance Script
#
# This script captures network behavior and tech stack information
# from PropFinder.app using PowerShell and web requests.
#
# Usage: .\recon.ps1
# Outputs: analysis\ directory with reconnaissance files

param(
    [switch]$Verbose = $false
)

Write-Host "🔍 Starting PropFinder.app PowerShell reconnaissance..." -ForegroundColor Cyan

# Create analysis directory
$analysisDir = "analysis"
if (-not (Test-Path $analysisDir)) {
    New-Item -ItemType Directory -Path $analysisDir | Out-Null
}

Set-Location $analysisDir

try {
    Write-Host "📡 Fetching PropFinder.app homepage..." -ForegroundColor Yellow
    
    # 1) Fetch index.html
    $headers = @{
        'User-Agent' = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    $homepageResponse = Invoke-WebRequest -Uri "https://propfinder.app/" -Headers $headers -TimeoutSec 30
    $homepageContent = $homepageResponse.Content
    $homepageContent | Out-File -FilePath "propfinder_index.html" -Encoding UTF8
    
    Write-Host "✅ Homepage fetched successfully" -ForegroundColor Green
    
    # 2) Extract JavaScript bundles
    Write-Host "📦 Analyzing bundle structure..." -ForegroundColor Yellow
    
    $bundlePattern = 'src="[^"]*\.js[^"]*"'
    $bundleMatches = [regex]::Matches($homepageContent, $bundlePattern)
    $bundleUrls = @()
    
    foreach ($match in $bundleMatches) {
        $url = $match.Value -replace 'src="', '' -replace '"', ''
        $bundleUrls += $url
    }
    
    $bundleUrls | Out-File -FilePath "propfinder_bundles.txt" -Encoding UTF8
    Write-Host "Found $($bundleUrls.Count) JavaScript bundles" -ForegroundColor Green
    
    # 3) Download and analyze main bundles (limit to first 5 for performance)
    Write-Host "⬇️ Downloading main bundles for analysis..." -ForegroundColor Yellow
    
    $apiEndpoints = @()
    $technologies = @{
        'React' = $false
        'Vue' = $false
        'Angular' = $false
        'Webpack' = $false
        'Vite' = $false
        'TailwindCSS' = $false
        'Bootstrap' = $false
        'Redux' = $false
        'Zustand' = $false
    }
    
    $bundlesToAnalyze = $bundleUrls | Select-Object -First 5
    $bundleContents = @()
    
    foreach ($bundleUrl in $bundlesToAnalyze) {
        try {
            # Convert relative URLs to absolute
            if ($bundleUrl.StartsWith('/')) {
                $fullUrl = "https://propfinder.app$bundleUrl"
            } elseif ($bundleUrl.StartsWith('http')) {
                $fullUrl = $bundleUrl
            } else {
                $fullUrl = "https://propfinder.app/$bundleUrl"
            }
            
            Write-Host "  Downloading: $fullUrl" -ForegroundColor Gray
            
            $bundleResponse = Invoke-WebRequest -Uri $fullUrl -Headers $headers -TimeoutSec 30
            $bundleContent = $bundleResponse.Content
            
            $bundleName = ($bundleUrl -split '/')[-1] -replace '[^a-zA-Z0-9.]', '_'
            $bundleFilePath = "bundle_$bundleName"
            $bundleContent | Out-File -FilePath $bundleFilePath -Encoding UTF8
            
            $bundleContents += $bundleContent
            
            Write-Host "  ✅ Downloaded: $bundleName" -ForegroundColor Green
            
        } catch {
            Write-Host "  ⚠️ Failed to download: $bundleUrl - $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    # 4) Analyze bundles for API endpoints and technologies
    Write-Host "🔍 Analyzing bundles for API endpoints and technologies..." -ForegroundColor Yellow
    
    foreach ($content in $bundleContents) {
        # Extract API endpoints
        $apiPattern = '(?:"|'')(/api/[a-zA-Z0-9/_-]+)(?:"|'')'
        $apiMatches = [regex]::Matches($content, $apiPattern)
        foreach ($match in $apiMatches) {
            $endpoint = $match.Groups[1].Value
            if ($apiEndpoints -notcontains $endpoint) {
                $apiEndpoints += $endpoint
            }
        }
        
        # Detect technologies
        if ($content -match 'React') { $technologies['React'] = $true }
        if ($content -match 'Vue') { $technologies['Vue'] = $true }
        if ($content -match 'angular|ng-') { $technologies['Angular'] = $true }
        if ($content -match 'webpack') { $technologies['Webpack'] = $true }
        if ($content -match 'vite') { $technologies['Vite'] = $true }
        if ($content -match 'tailwind|tw-') { $technologies['TailwindCSS'] = $true }
        if ($content -match 'bootstrap') { $technologies['Bootstrap'] = $true }
        if ($content -match 'redux|Redux') { $technologies['Redux'] = $true }
        if ($content -match 'zustand') { $technologies['Zustand'] = $true }
    }
    
    $apiEndpoints | Out-File -FilePath "propfinder_endpoints.txt" -Encoding UTF8
    Write-Host "Found $($apiEndpoints.Count) potential API endpoints" -ForegroundColor Green
    
    # 5) Generate technology analysis
    Write-Host "🔧 Generating technology analysis..." -ForegroundColor Yellow
    
    $techAnalysis = @"
# PropFinder.app Technology Stack Analysis

## Framework Detection
"@
    
    foreach ($tech in $technologies.Keys) {
        $status = if ($technologies[$tech]) { "✅ Detected" } else { "❌ Not detected" }
        $techAnalysis += "`n- $tech : $status"
    }
    
    $techAnalysis | Out-File -FilePath "tech_analysis.txt" -Encoding UTF8
    
    # 6) Test common API endpoints
    Write-Host "🌐 Testing common API endpoints..." -ForegroundColor Yellow
    
    $commonEndpoints = @(
        "/api/health",
        "/api/v1/health", 
        "/api/opportunities",
        "/api/props",
        "/api/sports",
        "/api/markets",
        "/graphql"
    )
    
    $apiTestResults = @"
# API Connectivity Test
Generated: $(Get-Date)

"@
    
    foreach ($endpoint in $commonEndpoints) {
        try {
            $testUrl = "https://propfinder.app$endpoint"
            Write-Host "  Testing: $testUrl" -ForegroundColor Gray
            
            $testResponse = Invoke-WebRequest -Uri $testUrl -Headers $headers -TimeoutSec 10 -ErrorAction Stop
            $statusCode = $testResponse.StatusCode
            $apiTestResults += "- $endpoint : HTTP $statusCode`n"
            
        } catch {
            $statusCode = if ($_.Exception.Response) { $_.Exception.Response.StatusCode.Value__ } else { "000" }
            $apiTestResults += "- $endpoint : HTTP $statusCode`n"
        }
    }
    
    $apiTestResults | Out-File -FilePath "api_test.txt" -Encoding UTF8
    
    # 7) Generate comprehensive competitive analysis
    Write-Host "📋 Generating comprehensive competitive analysis..." -ForegroundColor Yellow
    
    $competitiveAnalysis = @"
# PropFinder.app Competitive Analysis Report

**Generated:** $(Get-Date)  
**Method:** PowerShell-based reconnaissance  
**Target:** https://propfinder.app

## Summary

This analysis was conducted using PowerShell to examine PropFinder.app's 
technology stack, API structure, and feature set for competitive intelligence.

## Key Findings

### Technology Stack
$($technologies.Keys | ForEach-Object { 
    $status = if ($technologies[$_]) { "✅" } else { "❌" }
    "- $_ : $status"
} | Out-String)

### API Endpoints Discovered
$($apiEndpoints | ForEach-Object { "- $_" } | Out-String)

### Bundle Analysis
- JavaScript bundles found: $($bundleUrls.Count)
- Bundles analyzed: $($bundleContents.Count)
- API endpoints extracted: $($apiEndpoints.Count)

## Implications for A1Betting Implementation

### 1. Technology Alignment
Our React/TypeScript/Vite stack $(if ($technologies['React']) { 'aligns with' } else { 'differs from' }) PropFinder's detected approach.

### 2. API Architecture
- Detected endpoints: $($apiEndpoints.Count)
- Our current PropFinder API should expand to match this coverage

### 3. Feature Parity Roadmap
Based on analysis:
1. Implement detected API endpoints in our backend
2. Ensure technology choices support similar functionality  
3. Focus on performance optimization to exceed PropFinder

## Files Generated
- ``propfinder_index.html``: Homepage source code
- ``propfinder_bundles.txt``: JavaScript bundle URLs ($($bundleUrls.Count) found)
- ``propfinder_endpoints.txt``: Extracted API endpoints ($($apiEndpoints.Count) found)
- ``tech_analysis.txt``: Technology stack detection results
- ``api_test.txt``: API endpoint connectivity test results
- ``bundle_*``: Downloaded JavaScript bundles ($($bundleContents.Count) files)

## Recommendations

### Immediate Actions
1. Review extracted API endpoints and implement missing ones in our backend
2. Ensure our React/TypeScript stack matches detected capabilities
3. Expand our PropFinder API to match or exceed endpoint coverage

### Feature Development Priority
1. Implement any missing API endpoints discovered
2. Focus on performance optimization to exceed PropFinder benchmarks
3. Consider additional technology integrations for competitive advantage

### Ongoing Monitoring
1. Regularly re-run this analysis to track PropFinder updates
2. Monitor for new API endpoints or technology changes
3. Benchmark our performance against PropFinder metrics

## Technical Integration Notes

### For A1Betting Development Team
- Compare our current ``/api/propfinder/*`` endpoints with discovered endpoints
- Review technology choices against detected PropFinder stack
- Use this intelligence to prioritize issues.json roadmap tickets
- Focus on performance and feature parity or superiority

### Next Steps
1. Integrate findings into current development roadmap
2. Implement missing API endpoints identified in this analysis
3. Schedule regular competitive analysis updates
4. Use insights to refine our PropFinder clone strategy
"@
    
    $competitiveAnalysis | Out-File -FilePath "competitive_analysis.md" -Encoding UTF8
    
    # Success summary
    Write-Host "`n✅ Reconnaissance completed successfully!" -ForegroundColor Green
    Write-Host "`n📊 Results Summary:" -ForegroundColor Cyan
    Write-Host "- JavaScript bundles found: $($bundleUrls.Count)" -ForegroundColor White
    Write-Host "- Bundles analyzed: $($bundleContents.Count)" -ForegroundColor White  
    Write-Host "- API endpoints extracted: $($apiEndpoints.Count)" -ForegroundColor White
    Write-Host "- Technologies detected: $(($technologies.Values | Where-Object {$_}).Count)" -ForegroundColor White
    
    Write-Host "`n📁 Analysis files generated in analysis\ directory:" -ForegroundColor Cyan
    Get-ChildItem -Path "." -File | ForEach-Object {
        Write-Host "  - $($_.Name)" -ForegroundColor White
    }
    
    Write-Host "`n🎯 Key Next Steps:" -ForegroundColor Yellow
    Write-Host "1. Review competitive_analysis.md for strategic insights" -ForegroundColor White
    Write-Host "2. Compare propfinder_endpoints.txt with our current /api/propfinder endpoints" -ForegroundColor White
    Write-Host "3. Use findings to prioritize roadmap tickets in issues.json" -ForegroundColor White
    Write-Host "4. Focus development on areas where we can exceed PropFinder capabilities" -ForegroundColor White
    
} catch {
    Write-Host "`n❌ Reconnaissance failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Stack trace: $($_.ScriptStackTrace)" -ForegroundColor Red
} finally {
    Set-Location ".."
}

Write-Host "`n🏁 Reconnaissance script completed." -ForegroundColor Cyan