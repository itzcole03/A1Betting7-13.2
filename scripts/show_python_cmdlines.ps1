$pids = @(7064,7804,11484,13860,15036,22432,24040,26016,30492)
foreach ($id in $pids) {
    $proc = Get-CimInstance Win32_Process -Filter "ProcessId=$id" -ErrorAction SilentlyContinue
    if ($proc) {
        Write-Output "--- PID $id ---"
        Write-Output $proc.CommandLine
    } else {
        Write-Output "--- PID $id --- (no CIM entry)"
    }
}
