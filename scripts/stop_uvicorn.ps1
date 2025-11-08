$procs = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -and ($_.CommandLine -match 'uvicorn' -or $_.CommandLine -match 'backend.core.app') }
if (-not $procs) { Write-Output "No matching processes found"; exit 0 }
foreach ($p in $procs) {
    Write-Output "Found PID: $($p.ProcessId)"
    Write-Output "CommandLine: $($p.CommandLine)"
}

foreach ($p in $procs) {
    try {
        Stop-Process -Id $p.ProcessId -Force -ErrorAction Stop
        Write-Output "Stopped $($p.ProcessId)"
    } catch {
        Write-Output "Failed to stop $($p.ProcessId): $($_.Exception.Message)"
    }
}
