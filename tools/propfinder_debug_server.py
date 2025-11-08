"""Small debug server to exercise the NBA provider without starting the full app.

Usage (from repo root):
PYTHONPATH=. python -m uvicorn tools.propfinder_debug_server:app --host 127.0.0.1 --port 8010

Endpoint: GET /debug/opportunities?target_date=YYYY-MM-DD&lookahead_days=1

This intentionally keeps dependencies minimal and logs provider activity to stdout.
"""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, Query

from backend.services.nba_provider_client import nba_provider_client

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("propfinder-debug")

app = FastAPI(title="PropFinder Debug Server")


@app.get("/debug/opportunities")
async def debug_opportunities(
    target_date: Optional[str] = Query(None), lookahead_days: int = Query(1)
):
    """Call the NBA provider generate_player_props and return the raw results.

    - target_date: YYYY-MM-DD (defaults to today)
    - lookahead_days: number of days to scan starting at target_date
    """
    if target_date is None:
        target_date = datetime.utcnow().strftime("%Y-%m-%d")

    logger.info(
        "Debug: requesting props for %s with lookahead=%s", target_date, lookahead_days
    )
    try:
        # provider uses asyncio.to_thread internally for blocking nba_api calls
        props = await nba_provider_client.generate_player_props(
            target_date=target_date, lookahead_days=lookahead_days
        )
        logger.info("Debug: provider returned %d props", len(props) if props else 0)
        return {"success": True, "count": len(props) if props else 0, "props": props}
    except Exception as e:
        logger.exception("Debug provider call failed")
        return {"success": False, "error": str(e)}


if __name__ == "__main__":
    # Allow running the debug server directly: python tools/propfinder_debug_server.py
    import uvicorn

    uvicorn.run(
        "tools.propfinder_debug_server:app",
        host="127.0.0.1",
        port=8010,
        log_level="info",
    )
