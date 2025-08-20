# create-issues.ps1 - Autonomous GitHub Issue Creator for A1Betting7-13.2
# Enhanced turnkey solution with auto-installation and comprehensive error handling

param (
    [string]$Repo = "itzcole03/A1Betting7-13.2",
    [string]$IssuesFile = "issues.json",
    [switch]$AutoInstallGH = $true,
    [switch]$Verbose = $false
)

# Enhanced logging function
function Write-Status {
    param($Message, $Status = "INFO")
    $timestamp = Get-Date -Format "HH:mm:ss"
    switch($Status) {
        "SUCCESS" { Write-Host "[$timestamp] ✅ $Message" -ForegroundColor Green }
        "ERROR"   { Write-Host "[$timestamp] ❌ $Message" -ForegroundColor Red }
        "WARNING" { Write-Host "[$timestamp] ⚠️  $Message" -ForegroundColor Yellow }
        "INFO"    { Write-Host "[$timestamp] 🔎 $Message" -ForegroundColor Cyan }
        "PROCESS" { Write-Host "[$timestamp] ⚡ $Message" -ForegroundColor Magenta }
    }
}

# Function to check if winget is available
function Test-WingetAvailable {
    try {
        $winget = Get-Command winget -ErrorAction SilentlyContinue
        return $null -ne $winget
    }
    catch {
        return $false
    }
}

# Function to install GitHub CLI automatically
function Install-GitHubCLI {
    Write-Status "Attempting to auto-install GitHub CLI..." "PROCESS"
    
    if (Test-WingetAvailable) {
        try {
            Write-Status "Installing GitHub CLI via winget..." "INFO"
            $result = winget install --id GitHub.cli --accept-package-agreements --accept-source-agreements 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Status "GitHub CLI installed successfully!" "SUCCESS"
                # Refresh environment to pick up new installation
                $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
                return $true
            } else {
                Write-Status "Failed to install GitHub CLI via winget" "ERROR"
                if ($Verbose) { Write-Host $result }
                return $false
            }
        }
        catch {
            Write-Status "Error during GitHub CLI installation: $($_.Exception.Message)" "ERROR"
            return $false
        }
    } else {
        Write-Status "Winget not available. Please install GitHub CLI manually: https://cli.github.com/" "WARNING"
        return $false
    }
}

# Function to check GitHub CLI authentication
function Test-GitHubAuth {
    try {
        $authResult = gh auth status 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Status "GitHub CLI is authenticated" "SUCCESS"
            return $true
        } else {
            Write-Status "GitHub CLI not authenticated. Please run: gh auth login" "WARNING"
            return $false
        }
    }
    catch {
        Write-Status "Unable to check GitHub CLI authentication status" "WARNING"
        return $false
    }
}

# Function to create issue via GitHub CLI
function New-IssueWithCLI {
    param($Issue, $RepoName)
    
    try {
        $labels = $Issue.labels -join ","
        $assignees = if ($Issue.assignees) { $Issue.assignees -join "," } else { "" }
        
        $ghArgs = @(
            "issue", "create",
            "--repo", $RepoName,
            "--title", $Issue.title,
            "--body", $Issue.body,
            "--label", $labels
        )
        
        if ($assignees) {
            $ghArgs += "--assignee"
            $ghArgs += $assignees
        }
        
        $result = & gh @ghArgs 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Status "Created issue: $($Issue.title)" "SUCCESS"
            if ($Verbose) { Write-Host "   Issue URL: $result" }
            return $true
        } else {
            Write-Status "Failed to create issue: $($Issue.title)" "ERROR"
            if ($Verbose) { Write-Host "   Error: $result" }
            return $false
        }
    }
    catch {
        Write-Status "Exception creating issue '$($Issue.title)': $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Function to create issue via REST API
function New-IssueWithAPI {
    param($Issue, $RepoName, $Token)
    
    try {
        $payload = @{
            title = $Issue.title
            body = $Issue.body
            labels = $Issue.labels
        }
        
        if ($Issue.assignees) {
            $payload.assignees = $Issue.assignees
        }
        
        $jsonPayload = $payload | ConvertTo-Json -Depth 5
        
        $headers = @{
            Authorization = "token $Token"
            Accept = "application/vnd.github+json"
            "User-Agent" = "A1Betting-IssueCreator/1.0"
        }
        
        $response = Invoke-RestMethod -Method Post `
            -Uri "https://api.github.com/repos/$RepoName/issues" `
            -Headers $headers `
            -Body $jsonPayload `
            -ContentType "application/json"
        
        if ($response.number) {
            Write-Status "Created issue #$($response.number): $($Issue.title)" "SUCCESS"
            if ($Verbose) { Write-Host "   Issue URL: $($response.html_url)" }
            return $true
        } else {
            Write-Status "Failed to create issue: $($Issue.title)" "ERROR"
            return $false
        }
    }
    catch {
        Write-Status "API error creating issue '$($Issue.title)': $($_.Exception.Message)" "ERROR"
        if ($Verbose) { Write-Host "   Full error: $($_.Exception)" }
        return $false
    }
}

# Main script execution
Write-Status "🚀 A1Betting GitHub Issue Creator Started" "PROCESS"
Write-Status "Target repository: $Repo" "INFO"
Write-Status "Issues file: $IssuesFile" "INFO"

# Check if issues file exists
if (-not (Test-Path $IssuesFile)) {
    Write-Status "Issues file '$IssuesFile' not found!" "ERROR"
    Write-Status "Please ensure the issues.json file exists in the current directory" "INFO"
    exit 1
}

# Load issues from JSON file
try {
    $issues = Get-Content $IssuesFile -Raw | ConvertFrom-Json
    Write-Status "Loaded $($issues.Count) issues from $IssuesFile" "SUCCESS"
}
catch {
    Write-Status "Failed to parse issues file: $($_.Exception.Message)" "ERROR"
    exit 1
}

# Check for GitHub CLI
Write-Status "Checking for GitHub CLI..." "INFO"
$ghExists = Get-Command gh -ErrorAction SilentlyContinue

if ($ghExists) {
    Write-Status "GitHub CLI found at: $($ghExists.Source)" "SUCCESS"
    
    # Check if authenticated
    if (Test-GitHubAuth) {
        Write-Status "Using GitHub CLI method..." "PROCESS"
        $successCount = 0
        $failCount = 0
        
        foreach ($issue in $issues) {
            if (New-IssueWithCLI -Issue $issue -RepoName $Repo) {
                $successCount++
            } else {
                $failCount++
            }
            Start-Sleep -Milliseconds 500  # Rate limiting
        }
        
        Write-Status "GitHub CLI Results: $successCount created, $failCount failed" "INFO"
    } else {
        Write-Status "GitHub CLI found but not authenticated. Please run: gh auth login" "WARNING"
        $ghExists = $null  # Fall back to API method
    }
}

if (-not $ghExists) {
    if ($AutoInstallGH) {
        Write-Status "GitHub CLI not found. Attempting auto-installation..." "PROCESS"
        if (Install-GitHubCLI) {
            # Try to use newly installed CLI
            $ghExists = Get-Command gh -ErrorAction SilentlyContinue
            if ($ghExists -and (Test-GitHubAuth)) {
                Write-Status "Successfully installed and using GitHub CLI!" "SUCCESS"
                # Recursive call with CLI now available
                foreach ($issue in $issues) {
                    New-IssueWithCLI -Issue $issue -RepoName $Repo
                    Start-Sleep -Milliseconds 500
                }
                exit 0
            }
        }
    }
    
    Write-Status "Falling back to GitHub REST API..." "INFO"
    
    # Check for GitHub token
    $token = $env:GITHUB_TOKEN
    if (-not $token) {
        Write-Status "No GITHUB_TOKEN environment variable found!" "ERROR"
        Write-Status "Please set your GitHub token:" "INFO"
        Write-Status "  setx GITHUB_TOKEN 'your_personal_access_token'" "INFO"
        Write-Status "  Or run: `$env:GITHUB_TOKEN = 'your_token'" "INFO"
        Write-Status "Create token at: https://github.com/settings/tokens" "INFO"
        exit 1
    }
    
    Write-Status "Using GitHub REST API with token..." "PROCESS"
    $successCount = 0
    $failCount = 0
    
    foreach ($issue in $issues) {
        if (New-IssueWithAPI -Issue $issue -RepoName $Repo -Token $token) {
            $successCount++
        } else {
            $failCount++
        }
        Start-Sleep -Milliseconds 1000  # More conservative rate limiting for API
    }
    
    Write-Status "REST API Results: $successCount created, $failCount failed" "INFO"
}

Write-Status "🎉 Issue creation process completed!" "SUCCESS"

# Summary report
if ($successCount -gt 0 -or $failCount -gt 0) {
    Write-Status "📊 FINAL SUMMARY:" "INFO"
    Write-Status "  ✅ Successfully created: $successCount issues" "SUCCESS"
    if ($failCount -gt 0) {
        Write-Status "  ❌ Failed to create: $failCount issues" "ERROR"
    }
    Write-Status "  📁 Repository: https://github.com/$Repo/issues" "INFO"
}