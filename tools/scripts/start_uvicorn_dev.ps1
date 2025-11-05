$env:DEV_AUTH = 'true'
& 'C:\Users\bcmad\AppData\Local\Programs\Python\Python312\python.exe' -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
