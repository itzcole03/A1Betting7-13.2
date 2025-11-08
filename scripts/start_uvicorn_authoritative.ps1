$env:PROPFINDER_SERVICE_MODE = 'data'
$env:PROPFINDER_NBA_LOOKAHEAD_DAYS = '1'
$env:PYTHONPATH = 'C:\Users\bcmad\Downloads\A1Betting7-13.2'
$argList = @('-m','uvicorn','backend.core.app:create_app','--factory','--host','127.0.0.1','--port','8000','--log-level','info')
$p = Start-Process -FilePath python -ArgumentList $argList -PassThru -WindowStyle Minimized
Write-Output "Started PID=$($p.Id)" 
