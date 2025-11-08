$ports = @(8000,8001,8002)
$pids = @()
foreach ($p in $ports) {
    try {
        $conns = Get-NetTCPConnection -LocalPort $p -ErrorAction Stop
    } catch {
        $conns = @()
    }
    if ($conns) {
        foreach ($c in $conns) { $pids += $c.OwningProcess }
    }
}
$pids = $pids | Sort-Object -Unique
if (-not $pids) {
    Write-Output 'No processes found listening on 8000/8001/8002'
    exit 0
}
Write-Output 'PIDs listening:'
$pids | ForEach-Object { Write-Output $_ }
Write-Output ''
foreach ($thePid in $pids) {
    Write-Output '--- PID ' + $thePid + ' ---'
    $proc = Get-CimInstance Win32_Process -Filter "ProcessId=$thePid"
    if ($proc) {
        $proc | Select-Object ProcessId, CommandLine, ExecutablePath | Format-List
    } else {
        Write-Output "Process $thePid not found via CIM"
    }
}
