"""
Simple main.py to test basic server startup without background task issues
"""

import uvicorn
from fastapi import FastAPI
from fastapi.responses import JSONResponse

app = FastAPI(title="A1Betting Simple Test", version="1.0.0")


@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "Simple server running"}


@app.get("/")
async def root():
    return {"message": "A1Betting Simple Test Server", "status": "running"}


if __name__ == "__main__":
    print("🚀 Starting simple test server...")
    uvicorn.run(app, host="0.0.0.0", port=8002, reload=False)
