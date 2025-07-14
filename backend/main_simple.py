"""
Simple FastAPI Main - Phase 1 Quick Fix
Minimal backend that starts immediately without heavy services
"""

import logging

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="A1Betting Backend - Phase 1 Fix",
    description="Quick fix for frontend development",
    version="1.0.0-phase1",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*",  # Allow all for development
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8173",
        "http://192.168.1.190:8173",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Import and include the simple router
from routes.prizepicks_simple import router as simple_prizepicks_router

app.include_router(simple_prizepicks_router)


# Simple health endpoint
@app.get("/api/health/status")
async def health_status():
    return {
        "status": "healthy",
        "mode": "Phase 1 Development",
        "timestamp": "2025-07-10T21:30:00Z",
        "note": "Quick backend for frontend development",
    }


@app.get("/api/status")
async def api_status():
    return {
        "status": "healthy",
        "initialized": True,
        "models_loaded": False,
        "ready_for_requests": True,
        "mode": "Phase 1 Quick Fix",
    }


@app.get("/")
async def root():
    return {"message": "A1Betting Backend - Phase 1 Quick Fix", "status": "running"}


if __name__ == "__main__":
    logger.info("🚀 Starting A1Betting Backend - Phase 1 Quick Fix")
    uvicorn.run(app, host="0.0.0.0", port=8001)
