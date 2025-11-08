$parents = @(26116,3348,6168,31368)
foreach ($id in $parents) {
    $proc = Get-CimInstance Win32_Process -Filter "ProcessId=$id" -ErrorAction SilentlyContinue
    if ($proc) {
        Write-Output "--- PARENT PID $id ---"
        $proc | Select-Object ProcessId, CommandLine, ExecutablePath | Format-List
    } else {
        Write-Output "--- PARENT PID $id --- (no CIM entry)"
    }
}
