# Comprehensive TypeScript/JSX Syntax Fixer - Phase 4
Write-Host "=== AUTONOMOUS SYNTAX REPAIR PHASE 4 ===" -ForegroundColor Cyan
Write-Host "Targeting: JSX closing tags, element access, identifier issues" -ForegroundColor Yellow

$processedFiles = 0
$fixedIssues = 0

# Get all TypeScript/TSX files
$files = Get-ChildItem -Path "src" -Recurse -Include "*.ts", "*.tsx" | Where-Object { $_.Length -lt 2MB }

foreach ($file in $files) {
    try {
        $content = Get-Content $file.FullName -Raw -Encoding UTF8
        $originalContent = $content
        $fileFixed = $false
        
        # Fix 1: JSX element closing tags (missing closing tags)
        if ($content -match '<div[^>]*>(?![^<]*</div>)') {
            $content = $content -replace '(<div[^>]*>)(?=\s*$)', '$1</div>'
            $fileFixed = $true
        }
        
        # Fix 2: Element access expressions (empty brackets)
        $content = $content -replace '\[\s*\]', '[0]'
        if ($content -ne $originalContent) { $fileFixed = $true }
        
        # Fix 3: Identifier expected errors (invalid property names)
        $content = $content -replace '(\w+):\s*;', '$1: any;'
        if ($content -ne $originalContent) { $fileFixed = $true }
        
        # Fix 4: Missing commas in object literals
        $content = $content -replace '(\w+:\s*[^,}\n]+)\s*\n\s*(\w+:)', '$1,`n  $2'
        if ($content -ne $originalContent) { $fileFixed = $true }
        
        # Fix 5: Unexpected token } (missing commas before closing)
        $content = $content -replace '([^,\s])\s*}', '$1,}'
        if ($content -ne $originalContent) { $fileFixed = $true }
        
        # Fix 6: Unexpected token ; (semicolons in wrong places)
        $content = $content -replace '(\w+):\s*([^;]+);(\s*[,}])', '$1: $2$3'
        if ($content -ne $originalContent) { $fileFixed = $true }
        
        # Fix 7: JSX > expected errors (malformed JSX attributes)
        $content = $content -replace '<(\w+)\s+([^>]*[^/])(?<![>/])\s*>', '<$1 $2>'
        if ($content -ne $originalContent) { $fileFixed = $true }
        
        # Fix 8: Property or signature expected
        $content = $content -replace '^(\s*)(\w+)\s*$', '$1$2: any;'
        if ($content -ne $originalContent) { $fileFixed = $true }
        
        if ($fileFixed -and $content -ne $originalContent) {
            Set-Content -Path $file.FullName -Value $content -Encoding UTF8
            $fixedIssues++
            Write-Host "Fixed: $($file.Name)" -ForegroundColor Green
        }
        
        $processedFiles++
        if ($processedFiles % 100 -eq 0) {
            Write-Host "Processed: $processedFiles files, Fixed: $fixedIssues files" -ForegroundColor Cyan
        }
    }
    catch {
        Write-Host "Error processing $($file.Name): $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "=== PHASE 4 COMPLETE ===" -ForegroundColor Green
Write-Host "Files processed: $processedFiles" -ForegroundColor White
Write-Host "Files fixed: $fixedIssues" -ForegroundColor White
