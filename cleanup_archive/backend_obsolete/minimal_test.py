"""
Minimal FastAPI test to isolate the hanging issue
"""

import asyncio
import logging
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def minimal_lifespan(app: FastAPI):
    """Absolutely minimal lifespan for testing"""
    logger.info("🚀 [MINIMAL] Starting minimal test...")
    logger.info("⚡ [MINIMAL] About to yield...")

    yield  # App is running

    logger.info("🛑 [MINIMAL] Shutdown complete")


# Create minimal app
app = FastAPI(
    title="Minimal Test",
    lifespan=minimal_lifespan,
)


@app.get("/health")
async def health():
    return {"status": "ok", "message": "Minimal test working!"}


if __name__ == "__main__":
    logger.info("🧪 Starting minimal test server...")
    uvicorn.run(app, host="0.0.0.0", port=8001, log_level="info")
