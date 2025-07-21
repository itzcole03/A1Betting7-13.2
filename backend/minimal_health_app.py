import asyncio
import logging
from datetime import datetime, timezone

from fastapi import FastAPI

app = FastAPI()
logger = logging.getLogger("health_test")


@app.get("/health")
async def health_check():
    logger.info("/health endpoint called - guaranteed instant response.")
    try:

        async def instant_response():
            return {
                "status": "healthy",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "service": "Minimal Test Backend",
                "dev_mode": True,
                "no_hang": True,
                "note": "This endpoint is guaranteed to respond instantly for development and monitoring.",
            }

        return await asyncio.wait_for(instant_response(), timeout=1.0)
    except asyncio.TimeoutError:
        logger.error("/health endpoint timeout safeguard triggered!")
        return {
            "status": "degraded",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "service": "Minimal Test Backend",
            "dev_mode": True,
            "no_hang": True,
            "note": "Timeout safeguard triggered. Endpoint still responded instantly.",
        }
