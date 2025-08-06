from datetime import datetime

from fastapi import FastAPI

app = FastAPI()


@app.get("/ping")
async def ping():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}
