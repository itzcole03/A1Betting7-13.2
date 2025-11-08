"""One-shot provider probe: import the NBA provider and print generated props as JSON.

Usage:
PYTHONPATH=. python tools.propfinder_provider_probe.py --target-date 2025-11-08 --lookahead 1
"""

from __future__ import annotations

import argparse
import asyncio
import json
import logging
from datetime import datetime

from backend.services.nba_provider_client import nba_provider_client

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("provider-probe")


async def main(target_date: str | None, lookahead: int):
    if target_date is None:
        target_date = datetime.utcnow().strftime("%Y-%m-%d")
    logger.info("Running provider probe for %s (lookahead %d)", target_date, lookahead)
    props = await nba_provider_client.generate_player_props(
        target_date=target_date, lookahead_days=lookahead
    )
    out = {"count": len(props) if props else 0, "props": props}
    print(json.dumps(out, indent=2, default=str))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--target-date", help="YYYY-MM-DD", default=None)
    parser.add_argument("--lookahead", type=int, default=1)
    args = parser.parse_args()
    asyncio.run(main(args.target_date, args.lookahead))
