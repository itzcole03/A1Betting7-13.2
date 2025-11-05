# Kill all python processes
Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force

# Start backend
Start-Process powershell -ArgumentList "cd ..\backend; python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload" -NoNewWindow

# Start frontend
Start-Process powershell -ArgumentList "cd .\frontend; npm run dev" -NoNewWindow

Write-Host "A1Betting dev environment started! Backend: http://localhost:8000, Frontend: http://localhost:8173" 