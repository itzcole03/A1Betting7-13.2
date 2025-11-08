$env:PROPFINDER_SERVICE_MODE='data'
$env:PROPFINDER_NBA_LOOKAHEAD_DAYS='1'
$env:PYTHONPATH='c:\Users\bcmad\Downloads\A1Betting7-13.2'
$wd='c:\Users\bcmad\Downloads\A1Betting7-13.2'
Write-Output "Starting uvicorn from $wd with PROPFINDER_SERVICE_MODE=$env:PROPFINDER_SERVICE_MODE"
Start-Process -FilePath python -ArgumentList '-m','uvicorn','backend.core.app:create_app','--factory','--host','127.0.0.1','--port','8000','--log-level','info' -WorkingDirectory $wd -NoNewWindow
