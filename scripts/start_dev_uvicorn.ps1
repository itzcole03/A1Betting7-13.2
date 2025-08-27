# Stops any process using port 8002, ensures log dir exists, and starts uvicorn in background
$log = "backend\logs\dev_uvicorn.log"
$logDir = Split-Path $log
if (!(Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }
# find PIDs from netstat
$lines = netstat -a -n -o | Select-String ':8002' | ForEach-Object { $_.ToString().Trim() }
if ($lines) {
    foreach ($l in $lines) {
        $cols = $l -split "\s+"
        $pidVal = $cols[-1]
        try { Stop-Process -Id ([int]$pidVal) -Force -ErrorAction SilentlyContinue } catch {}
        Write-Output "stopped pid: $pidVal"
    }
} else {
    Write-Output "no process on 8002"
}
Start-Sleep -Milliseconds 200
$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = 'C:/Users/bcmad/AppData/Local/Programs/Python/Python312/python.exe'
$psi.Arguments = '-m uvicorn backend.dev_app:app --host 127.0.0.1 --port 8002'
$psi.UseShellExecute = $false
$psi.RedirectStandardOutput = $true
$psi.RedirectStandardError = $true
$psi.CreateNoWindow = $true
$p = New-Object System.Diagnostics.Process
$p.StartInfo = $psi
$outStream = [System.IO.File]::OpenWrite($log)
$outWriter = New-Object System.IO.StreamWriter($outStream)
$outWriter.AutoFlush = $true
$p.Start() | Out-Null
Start-Job -ScriptBlock {
    param($proc, $writerPath)
    while (-not $proc.HasExited) {
        try {
            $line = $proc.StandardOutput.ReadLine()
            if ($line -ne $null) { Add-Content -Path $writerPath -Value $line }
        } catch { Start-Sleep -Milliseconds 10 }
    }
} -ArgumentList $p, $log | Out-Null

Start-Job -ScriptBlock {
    param($proc, $writerPath)
    while (-not $proc.HasExited) {
        try {
            $err = $proc.StandardError.ReadLine()
            if ($err -ne $null) { Add-Content -Path $writerPath -Value $err }
        } catch { Start-Sleep -Milliseconds 10 }
    }
} -ArgumentList $p, $log | Out-Null
Start-Sleep -Seconds 1
Get-Content $log -Tail 200 -ErrorAction SilentlyContinue | Write-Output
