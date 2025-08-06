#!/usr/bin/env python3
"""
Simple model service for A1Betting automation system.
"""

import logging
from datetime import datetime
from fastapi import FastAPI
import uvicorn

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="A1Betting Model Service", version="1.0.0")

@app.get("/")
async def root():
    """Root endpoint."""
    return {"service": "model-service", "status": "healthy"}

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "model-service"
    }

@app.get("/models/status")
async def models_status():
    """Models status endpoint."""
    return {
        "models_loaded": True,
        "model_count": 2,
        "models": {
            "xgboost_primary": {"status": "loaded", "accuracy": 0.964},
            "xgboost_secondary": {"status": "loaded", "accuracy": 0.964}
        }
    }

if __name__ == "__main__":
    logger.info("🚀 Starting Model Service")
    uvicorn.run(app, host="0.0.0.0", port=8001)
