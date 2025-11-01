#!/usr/bin/env python3
"""
Quick profiler for unified services (data fetcher + cache service).
Sets lean mode for cache to avoid Redis and runs several calls to measure hotspots.
"""
import cProfile
import io
import os
import pstats

# Force memory-only mode to avoid Redis connection attempts
os.environ["APP_DEV_LEAN_MODE"] = "true"
os.environ["DISABLE_STARTUP_HOOKS"] = "true"

import asyncio

from backend.services import unified_cache_service as ucs_module
from backend.services import unified_data_fetcher as udf_module


async def workload(iterations: int = 100):
    # Warm-up
    await ucs_module.unified_cache.initialize()

    # Use local instances
    fetcher = udf_module.unified_data_fetcher
    cache = ucs_module.unified_cache

    # Run cache set/get workload
    for i in range(iterations):
        key = f"prof:test:{i % 10}"
        await cache.set(key, {"i": i}, ttl=60)
        _ = await cache.get(key)

    # Run data fetcher lightweight methods
    for i in range(iterations):
        _ = await fetcher.fetch_player_info(f"player_{i}", sport="MLB")
        _ = await fetcher.fetch_player_season_stats(f"player_{i}", sport="MLB")


def main():
    pr = cProfile.Profile()
    pr.enable()
    try:
        asyncio.run(workload(iterations=200))
    finally:
        pr.disable()
        s = io.StringIO()
        ps = pstats.Stats(pr, stream=s).sort_stats("cumulative")
        ps.print_stats(40)
        print(s.getvalue())
        with open("unified_services_profile.prof", "w") as f:
            ps.stream = f
            ps.print_stats(40)


if __name__ == "__main__":
    main()
