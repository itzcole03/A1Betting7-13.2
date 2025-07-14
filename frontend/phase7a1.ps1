# PHASE 7A-1: Critical Parsing Error Fixes
Write-Host "=== FIXING CRITICAL PARSING ERRORS ===" -ForegroundColor Red
Write-Host "Target: Syntax errors that could break runtime compilation" -ForegroundColor Yellow

$processedFiles = 0
$criticalFixes = 0

# Get files with parsing errors
$parsingErrorFiles = npm run lint 2>&1 | Select-String "Parsing error" | ForEach-Object { 
    ($_ -split ":")[0].Trim() 
} | Sort-Object -Unique | Where-Object { $_ -like "*.ts" -or $_ -like "*.tsx" }

Write-Host "Found $($parsingErrorFiles.Count) files with parsing errors" -ForegroundColor White

foreach ($file in $parsingErrorFiles | Select-Object -First 50) {
    try {
        if (Test-Path $file) {
            $content = Get-Content $file -Raw -Encoding UTF8
            $originalContent = $content
            $fileFixed = $false
            
            # Critical Fix 1: Missing closing braces/brackets
            $openBraces = ($content.ToCharArray() | Where-Object { $_ -eq '{' }).Count
            $closeBraces = ($content.ToCharArray() | Where-Object { $_ -eq '}' }).Count
            if ($openBraces -gt $closeBraces) {
                $content += ("`n}" * ($openBraces - $closeBraces))
                $fileFixed = $true
            }
            
            # Critical Fix 2: Unterminated template literals
            if ($content -match '`[^`]*$') {
                $content = $content -replace '(`[^`]*$)', '$1`'
                $fileFixed = $true
            }
            
            # Critical Fix 3: Missing semicolons after statements
            $content = $content -replace '(\w+\s*=\s*[^;,}\n]+)\s*\n', '$1;`n'
            if ($content -ne $originalContent) { $fileFixed = $true }
            
            # Critical Fix 4: Malformed JSX attributes
            $content = $content -replace '<(\w+)\s+([^>]*[^/>])\s*\n([^>]*>)', '<$1 $2 $3'
            if ($content -ne $originalContent) { $fileFixed = $true }
            
            if ($fileFixed) {
                Set-Content -Path $file -Value $content -Encoding UTF8
                $criticalFixes++
                Write-Host "Critical fix: $(Split-Path $file -Leaf)" -ForegroundColor Green
            }
        }
        
        $processedFiles++
        if ($processedFiles % 20 -eq 0) {
            Write-Host "Processed: $processedFiles files, Critical fixes: $criticalFixes" -ForegroundColor Cyan
        }
    }
    catch {
        Write-Host "Error with $file`: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "=== PHASE 7A-1 COMPLETE ===" -ForegroundColor Green
Write-Host "Files processed: $processedFiles" -ForegroundColor White
Write-Host "Critical fixes applied: $criticalFixes" -ForegroundColor White
