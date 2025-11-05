"""
Utility: flush PropFinder cache keys used by the dev environment.
Removes 'mlb:generated_props' and keys starting with 'prop_opportunities:' so that the
next request regenerates data and picks up normalization changes.

Usage:
    python scripts/flush_propfinder_caches.py
"""
import asyncio
import os
import json

import redis.asyncio as redis

REDIS_URL = os.getenv("REDIS_URL")


async def main():
    if not REDIS_URL:
        print("REDIS_URL not set; nothing to flush (in-memory caches cannot be accessed).")
        return

    client = redis.from_url(REDIS_URL)
    try:
        await client.ping()
    except Exception as e:
        print(f"Could not connect to Redis at {REDIS_URL}: {e}")
        return

    # Keys to remove
    keys_to_delete = ["mlb:generated_props"]

    # Find prop_opportunities keys
    try:
        pattern_keys = await client.keys("prop_opportunities:*")
        if pattern_keys:
            keys_to_delete.extend([k.decode() if isinstance(k, bytes) else k for k in pattern_keys])
    except Exception as e:
        print(f"Error enumerating prop_opportunities keys: {e}")

    if not keys_to_delete:
        print("No keys to delete.")
        return

    print("Deleting keys:")
    for k in keys_to_delete:
        print(f" - {k}")
        try:
            await client.delete(k)
        except Exception as e:
            print(f"Failed to delete {k}: {e}")

    print("Flush complete.")


if __name__ == "__main__":
    asyncio.run(main())
