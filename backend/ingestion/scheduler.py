"""Scheduler for ingestion that prefers unified connectors.

This module provides a simple async scheduler task that:
- Uses `backend.services.unified_data_fetcher` to list connectors and fetch events/props.
- Uses Redis caching (via `backend.services.cache`) to cache props per event.
- Emits simple metrics via `backend.metrics.ingestion_metrics`.

Feature-flagged via env var `USE_FREE_INGESTION` (default: true).
"""
import asyncio
import logging
import os
from typing import List

from backend.services import unified_data_fetcher as udf
from backend.services.cache import redis_cache
from backend.metrics.ingestion_metrics import IngestionMetrics

logger = logging.getLogger(__name__)


USE_FREE_INGESTION = os.getenv("USE_FREE_INGESTION", "true").lower() != "false"
CACHE_TTL = int(os.getenv("INGESTION_CACHE_TTL", "300"))


async def _fetch_and_cache_event_props(event_id: str):
    metrics = IngestionMetrics.get_instance()
    cache_key = f"props:{event_id}"

    # Try cache first
    cached = await redis_cache.get(cache_key)
    if cached:
        metrics.cache_hits.inc(1)
        logger.debug(f"Cache hit for event {event_id}")
        return cached

    metrics.cache_misses.inc(1)
    try:
        props = await udf.fetch_props_for_event(event_id)
        await redis_cache.set(cache_key, props, ttl=CACHE_TTL)
        metrics.props_fetched.inc(len(props))
        return props
    except Exception as e:
        metrics.fetch_errors.inc(1)
        logger.exception(f"Failed to fetch props for event {event_id}: {e}")
        return []


async def run_once():
    """Run a single ingestion pass.

    - If `USE_FREE_INGESTION` is set, call the unified connectors.
    - Otherwise, fall back to existing logic (not implemented here).
    """
    metrics = IngestionMetrics.get_instance()
    start = asyncio.get_event_loop().time()

    if not USE_FREE_INGESTION:
        logger.info("USE_FREE_INGESTION=false — skipping unified ingestion")
        return

    connectors = udf.list_connectors()
    logger.info(f"Discovered connectors: {connectors}")
    metrics.connectors_count.set(len(connectors))

    try:
        events = await udf.fetch_all_events()
    except Exception as e:
        logger.exception(f"Error fetching events from connectors: {e}")
        metrics.fetch_errors.inc(1)
        events = []

    metrics.events_found.set(len(events))

    # For each event, fetch props (with caching)
    tasks: List[asyncio.Task] = []
    for ev in events:
        tasks.append(asyncio.create_task(_fetch_and_cache_event_props(ev.id)))

    results = await asyncio.gather(*tasks, return_exceptions=True)
    total_props = sum(len(r) if isinstance(r, list) else 0 for r in results)
    metrics.total_props.set(total_props)

    elapsed = asyncio.get_event_loop().time() - start
    metrics.ingestion_duration.set(elapsed)
    logger.info(f"Ingestion pass complete: events={len(events)} props={total_props} time={elapsed:.2f}s")


async def start_scheduler(poll_interval: int = 60):
    """Start a repeating ingestion scheduler (runs until cancelled).

    Use for local development or can be wired to a background task in the app.
    """
    logger.info(f"Starting ingestion scheduler (interval={poll_interval}s)")
    try:
        while True:
            await run_once()
            await asyncio.sleep(poll_interval)
    except asyncio.CancelledError:
        logger.info("Ingestion scheduler cancelled")
