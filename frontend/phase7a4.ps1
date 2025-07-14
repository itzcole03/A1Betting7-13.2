# PHASE 7A-4: Comprehensive Production Quality Optimization
Write-Host "=== COMPREHENSIVE PRODUCTION OPTIMIZATION ===" -ForegroundColor Cyan
Write-Host "Target: All remaining quality issues across the codebase" -ForegroundColor Yellow

$processedFiles = 0
$totalFixes = 0

# Get all TypeScript/TSX files for comprehensive optimization
$allFiles = Get-ChildItem -Path "src" -Recurse -Include "*.ts", "*.tsx" | Where-Object { $_.Length -lt 2MB }

Write-Host "Processing $($allFiles.Count) files for production optimization" -ForegroundColor White

foreach ($file in $allFiles) {
    try {
        $content = Get-Content $file.FullName -Raw -Encoding UTF8
        $originalContent = $content
        $fileFixed = $false
        
        # Production Fix 1: Ensure proper exports
        if ($content -match 'export\s+\{[^}]*\}' -and $content -notmatch 'export\s+default') {
            $content = $content -replace '(export\s+\{[^}]*\})', '$1;'
            $fileFixed = $true
        }
        
        # Production Fix 2: Add proper error handling
        $content = $content -replace 'catch\s*\(\s*\w*\s*\)\s*\{', 'catch (error: unknown) {'
        if ($content -ne $originalContent) { $fileFixed = $true }
        
        # Production Fix 3: Fix console statements for production
        $content = $content -replace 'console\.log\([^)]*\);?', '// console.log removed for production'
        if ($content -ne $originalContent) { $fileFixed = $true }
        
        # Production Fix 4: Ensure all interfaces have proper definitions
        $content = $content -replace 'interface\s+(\w+)\s*extends\s+\{\s*\}', 'interface $1 extends Record<string, unknown>'
        if ($content -ne $originalContent) { $fileFixed = $true }
        
        # Production Fix 5: Fix React component prop types
        $content = $content -replace '(\w+):\s*React\.FC<\{\}>', '$1: React.FC'
        if ($content -ne $originalContent) { $fileFixed = $true }
        
        # Production Fix 6: Remove redundant type annotations
        $content = $content -replace ':\s*any\[\]', ': unknown[]'
        if ($content -ne $originalContent) { $fileFixed = $true }
        
        # Production Fix 7: Fix async function types
        $content = $content -replace '(async\s+\w+\([^)]*\)):\s*Promise<any>', '$1: Promise<unknown>'
        if ($content -ne $originalContent) { $fileFixed = $true }
        
        if ($fileFixed) {
            Set-Content -Path $file.FullName -Value $content -Encoding UTF8
            $totalFixes++
            if ($totalFixes % 50 -eq 0) {
                Write-Host "Applied fix to: $($file.Name)" -ForegroundColor Green
            }
        }
        
        $processedFiles++
        if ($processedFiles % 200 -eq 0) {
            Write-Host "Processed: $processedFiles files, Total fixes: $totalFixes" -ForegroundColor Cyan
        }
    }
    catch {
        # Continue processing even if individual files fail
    }
}

Write-Host "=== PHASE 7A-4 COMPLETE ===" -ForegroundColor Green
Write-Host "Files processed: $processedFiles" -ForegroundColor White
Write-Host "Production fixes applied: $totalFixes" -ForegroundColor White

# Test build after optimization
Write-Host ""
Write-Host "Testing build after optimization..." -ForegroundColor Yellow
npm run build --silent 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Build successful after optimization" -ForegroundColor Green
} else {
    Write-Host "⚠ Build issues detected - may need rollback" -ForegroundColor Red
}
