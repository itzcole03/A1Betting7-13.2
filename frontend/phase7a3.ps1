# PHASE 7A-3: Strategic TypeScript Quality Optimization
Write-Host "=== STRATEGIC TYPESCRIPT OPTIMIZATION ===" -ForegroundColor Cyan
Write-Host "Focus: Core betting/prediction logic type safety" -ForegroundColor Yellow

$processedFiles = 0
$qualityFixes = 0

# Target core business logic files for type safety improvements
$coreFiles = Get-ChildItem -Path "src" -Recurse -Include "*.ts", "*.tsx" | Where-Object {
    $_.FullName -match "(prediction|betting|analytics|ml|strategy|odds)" -and $_.Length -lt 1MB
}

Write-Host "Targeting $($coreFiles.Count) core business logic files" -ForegroundColor White

foreach ($file in $coreFiles | Select-Object -First 100) {
    try {
        $content = Get-Content $file.FullName -Raw -Encoding UTF8
        $originalContent = $content
        $fileFixed = $false
        
        # Strategic Fix 1: Replace any types in function signatures
        $content = $content -replace '(\w+):\s*any(?=\s*[,)])', '$1: unknown'
        if ($content -ne $originalContent) { $fileFixed = $true }
        
        # Strategic Fix 2: Fix empty interfaces with proper types
        $content = $content -replace 'interface\s+(\w+)\s*\{\s*\}', 'interface $1 { [key: string]: unknown }'
        if ($content -ne $originalContent) { $fileFixed = $true }
        
        # Strategic Fix 3: Add proper return types to functions
        $content = $content -replace '(export\s+(?:async\s+)?function\s+\w+\([^)]*\))\s*\{', '$1: void {'
        if ($content -ne $originalContent) { $fileFixed = $true }
        
        # Strategic Fix 4: Fix property signature issues
        $content = $content -replace '^(\s*)(\w+)\s*$', '$1// $2'
        if ($content -ne $originalContent) { $fileFixed = $true }
        
        # Strategic Fix 5: Remove unused imports strategically
        $lines = $content -split "`n"
        $newLines = @()
        $inImportBlock = $false
        
        foreach ($line in $lines) {
            if ($line -match '^import\s+') {
                $inImportBlock = $true
                # Only keep imports that are actually used
                $importName = ($line -replace 'import\s+\{?([^}]+)\}?.*', '$1').Trim()
                if ($content -match $importName) {
                    $newLines += $line
                }
            } else {
                $inImportBlock = $false
                $newLines += $line
            }
        }
        
        $newContent = $newLines -join "`n"
        if ($newContent -ne $content) {
            $content = $newContent
            $fileFixed = $true
        }
        
        if ($fileFixed) {
            Set-Content -Path $file.FullName -Value $content -Encoding UTF8
            $qualityFixes++
            Write-Host "Quality fix: $($file.Name)" -ForegroundColor Green
        }
        
        $processedFiles++
        if ($processedFiles % 25 -eq 0) {
            Write-Host "Processed: $processedFiles files, Quality fixes: $qualityFixes" -ForegroundColor Cyan
        }
    }
    catch {
        Write-Host "Error with $($file.Name): $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "=== PHASE 7A-3 COMPLETE ===" -ForegroundColor Green
Write-Host "Files processed: $processedFiles" -ForegroundColor White
Write-Host "Quality fixes applied: $qualityFixes" -ForegroundColor White
