# Stops any python processes running backend.main:app and restarts uvicorn with DEV_AUTH=true
$pythonPath = 'C:\Users\bcmad\AppData\Local\Programs\Python\Python312\python.exe'
Set-Location -LiteralPath (Split-Path -LiteralPath $MyInvocation.MyCommand.Path -Parent) | Out-Null
Set-Location -LiteralPath '..' | Out-Null
Write-Host "Looking for processes with 'backend.main:app' in command line..."
$procs = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -and ($_.CommandLine -match 'backend.main:app') }
if ($procs -and $procs.Count -gt 0) {
    foreach ($p in $procs) {
        Write-Host "Stopping PID $($p.ProcessId): $($p.CommandLine)"
        try { Stop-Process -Id $p.ProcessId -Force -ErrorAction Stop } catch { Write-Host "Failed to stop PID $($p.ProcessId): $($_.Exception.Message)" }
    }
} else {
    Write-Host "No backend.main:app processes found"
}
Start-Sleep -Seconds 1
Write-Host "Starting uvicorn with DEV_AUTH=true"
$env:DEV_AUTH = 'true'
Start-Process -FilePath $pythonPath -ArgumentList '-m','uvicorn','backend.main:app','--host','0.0.0.0','--port','8000','--reload' -WindowStyle Hidden
Write-Host "Started. Waiting 2s for server to initialize..."
Start-Sleep -Seconds 2
try {
    $resp = Invoke-RestMethod -Uri 'http://127.0.0.1:8000/dev/auth/users' -Method Get -ErrorAction Stop
    Write-Host "Response from /dev/auth/users:" -ForegroundColor Green
    $resp | ConvertTo-Json -Depth 6
} catch {
    Write-Host "GET /dev/auth/users failed:" -ForegroundColor Red
    if ($_.Exception -and $_.Exception.Response) {
        $content = $_.Exception.Response.Content.ReadAsStringAsync().Result
        Write-Host $content
    } else {
        Write-Host $_.Exception.Message
    }
}
