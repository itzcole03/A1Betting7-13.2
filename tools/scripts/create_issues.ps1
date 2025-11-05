# create-issues.ps1
param (
    [string]$Repo = "bcmadison/New-folder",
    [string]$IssuesFile = "issues.json"
)

Write-Host "🔎 Checking for GitHub CLI..."
$ghExists = Get-Command gh -ErrorAction SilentlyContinue

$issues = Get-Content $IssuesFile | ConvertFrom-Json

if ($ghExists) {
    Write-Host "✅ gh CLI found. Using gh issue create..."
    foreach ($issue in $issues) {
        $labels = $issue.labels -join ","
        gh issue create --repo $Repo --title $issue.title --body $issue.body --label $labels | Out-Null
        Write-Host "   ✔ Created issue: $($issue.title)"
    }
} else {
    Write-Host "⚠ gh CLI not found. Falling back to GitHub REST API..."
    if (-not $env:GITHUB_TOKEN) {
        Write-Error "❌ No GITHUB_TOKEN environment variable found. Please run: setx GITHUB_TOKEN 'your_token'"
        exit 1
    }

    foreach ($issue in $issues) {
        $payload = @{
            title = $issue.title
            body = $issue.body
            labels = $issue.labels
            assignees = $issue.assignees
        } | ConvertTo-Json -Depth 5

        $response = Invoke-RestMethod -Method Post `
            -Uri "https://api.github.com/repos/$Repo/issues" `
            -Headers @{Authorization = "token $($env:GITHUB_TOKEN)"; "Accept" = "application/vnd.github+json"} `
            -Body $payload

        if ($response.number) {
            Write-Host "   ✔ Created issue: $($issue.title)"
        } else {
            Write-Host "   ❌ Failed to create issue: $($issue.title)"
        }
    }
}
