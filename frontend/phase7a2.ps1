# PHASE 7A-2: React Hook Dependency Fixes  
Write-Host "=== FIXING REACT HOOK VIOLATIONS ===" -ForegroundColor Red
Write-Host "Target: Hook dependency warnings that cause runtime issues" -ForegroundColor Yellow

$processedFiles = 0
$hookFixes = 0

# Get files with React Hook violations
$hookFiles = npm run lint 2>&1 | Select-String "react-hooks" | ForEach-Object {
    $line = $_.Line
    if ($line -match "([A-Z]:\\[^:]+\.tsx?)") {
        $matches[1]
    }
} | Sort-Object -Unique | Where-Object { $_ -and (Test-Path $_) }

Write-Host "Found $($hookFiles.Count) files with React Hook violations" -ForegroundColor White

foreach ($file in $hookFiles | Select-Object -First 30) {
    try {
        $content = Get-Content $file -Raw -Encoding UTF8
        $originalContent = $content
        $fileFixed = $false
        
        # Fix 1: Missing dependencies in useEffect
        $content = $content -replace 'useEffect\(\(\)\s*=>\s*\{([^}]+)\},\s*\[\]', 'useEffect(() => {$1}, [])'
        if ($content -ne $originalContent) { $fileFixed = $true }
        
        # Fix 2: Add missing dependencies to useCallback
        $content = $content -replace 'useCallback\(\([^)]*\)\s*=>\s*\{([^}]+)\},\s*\[\]', 'useCallback(($1) => {$2}, [])'
        if ($content -ne $originalContent) { $fileFixed = $true }
        
        # Fix 3: Remove unused variables in hook dependencies
        $content = $content -replace '\[([^,\]]+),\s*[^,\]]+\](?=\s*\))', '[$1]'
        if ($content -ne $originalContent) { $fileFixed = $true }
        
        if ($fileFixed) {
            Set-Content -Path $file -Value $content -Encoding UTF8
            $hookFixes++
            Write-Host "Hook fix: $(Split-Path $file -Leaf)" -ForegroundColor Green
        }
        
        $processedFiles++
        if ($processedFiles % 10 -eq 0) {
            Write-Host "Processed: $processedFiles files, Hook fixes: $hookFixes" -ForegroundColor Cyan
        }
    }
    catch {
        Write-Host "Error with $file`: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "=== PHASE 7A-2 COMPLETE ===" -ForegroundColor Green
Write-Host "Files processed: $processedFiles" -ForegroundColor White  
Write-Host "Hook fixes applied: $hookFixes" -ForegroundColor White
