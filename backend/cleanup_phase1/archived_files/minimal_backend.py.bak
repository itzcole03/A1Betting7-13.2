"""
Quick fix: Completely disable background tasks to test lifespan
"""

import asyncio
import os
import sys

# Add the project root to the Python path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def minimal_lifespan(app: FastAPI):
    """Absolutely minimal lifespan - no background tasks at all"""
    logger.info("🚀 [MINIMAL-BACKEND] Starting A1Betting - MINIMAL MODE...")
    logger.info("⚡ [MINIMAL-BACKEND] About to yield immediately...")

    yield  # App is running - return immediately

    logger.info("🛑 [MINIMAL-BACKEND] Shutdown complete")


# Import only the essential routes
from backend.routes.health import router as health_router

# Create minimal app
app = FastAPI(
    title="A1Betting Minimal Test",
    description="Minimal backend to test lifespan issues",
    version="4.0.0-minimal",
    lifespan=minimal_lifespan,
)

# Add only health endpoint
app.include_router(health_router, prefix="/api")


@app.get("/")
async def root():
    return {"message": "A1Betting Minimal Backend - Working!", "status": "operational"}


if __name__ == "__main__":
    import uvicorn

    logger.info("🧪 Starting A1Betting minimal backend...")
    uvicorn.run(app, host="0.0.0.0", port=8002, log_level="info")
