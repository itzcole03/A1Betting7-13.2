$zip = 'C:\Users\bcmad\Downloads\A1Betting7-13.2\tests\e2e\tmp\test-results\navigation-Navigation-and--86f1e-e-to-dashboard-successfully-chromium\trace.zip'
$dest = 'C:\Users\bcmad\Downloads\A1Betting7-13.2\tests\e2e\tmp\trace-unpacked-dashboard'

if (Test-Path -LiteralPath $zip) {
    # Remove dest if it exists (non-interactive)
    if (Test-Path -LiteralPath $dest) { Remove-Item -LiteralPath $dest -Recurse -Force -ErrorAction SilentlyContinue }
    # Expand the archive without prompting
    Expand-Archive -LiteralPath $zip -DestinationPath $dest -Force -ErrorAction Stop
    Write-Host "Unpacked to $dest"
    Get-ChildItem -LiteralPath $dest -Recurse | Select-Object FullName, Length | Format-Table -AutoSize
} else {
    Write-Error "Trace zip not found: $zip"
    exit 2
}
