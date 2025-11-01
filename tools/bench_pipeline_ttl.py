"""Microbenchmark for IntelligentCacheService pipeline pre-serialization and TTL memoization

This script runs two experiments:

1) Compare pipeline flush time when values are pre-serialized at enqueue time (current behavior)
   vs when values are serialized at flush time (simulated by monkeypatching _add_to_pipeline).

2) Measure smart TTL memoization by calling _calculate_smart_ttl repeatedly for the same key
   (shows cached path vs cold path).

The script uses a DummyRedis client to avoid requiring a real Redis server.

Run:
    python tools/bench_pipeline_ttl.py

"""

import asyncio
import os
import statistics
import time
from typing import Any

from backend.services.intelligent_cache_service import IntelligentCacheService


class DummyPipeline:
    def __init__(self):
        self.cmds = []

    def set(self, key, value, ex=None):
        # store tuples; value likely already serialized in one mode
        self.cmds.append(("set", key, value, ex))

    async def execute(self):
        # simulate a small I/O cost
        await asyncio.sleep(0)
        return [True] * len(self.cmds)


class DummyRedis:
    def pipeline(self, transaction=False):
        class Ctx:
            async def __aenter__(inner_self):
                inner_self._pipe = DummyPipeline()
                return inner_self._pipe

            async def __aexit__(inner_self, exc_type, exc, tb):
                return False

        return Ctx()


async def run_pipeline_test(n_items=2000, payload_size=512):
    svc = IntelligentCacheService()

    # Ensure pipeline behavior: force use of redis by toggling flags and monkeypatching get_redis
    svc._use_memory_fallback = False
    svc._redis_pool = "dummy"

    def get_dummy():
        return DummyRedis()

    svc.get_redis = get_dummy  # type: ignore

    # Prepare a representative payload
    payload = {"i": 0, "payload": "x" * payload_size}

    results = {}

    # Variant A: current behavior (pre-serialize in _add_to_pipeline)
    svc.pipeline_buffer.clear()
    t0 = time.time()
    for i in range(n_items):
        payload["i"] = i
        await svc._add_to_pipeline("SET", f"k_pre_{i}", (payload, 3600))
    enqueue_t = time.time() - t0

    t0 = time.time()
    await svc._flush_pipeline()
    flush_t = time.time() - t0
    results["pre_serialize_enqueue_time"] = enqueue_t
    results["pre_serialize_flush_time"] = flush_t

    # Variant B: simulate no pre-serialization by monkeypatching _add_to_pipeline
    async def _add_no_serialize(operation: str, key: str, data: Any):
        # store raw value (no serialization)
        if len(svc.pipeline_buffer) >= svc.max_pipeline_size:
            await svc._flush_pipeline()
        svc.pipeline_buffer.append((operation, key, data))

    svc.pipeline_buffer.clear()
    svc._add_to_pipeline_original = svc._add_to_pipeline
    svc._add_to_pipeline = _add_no_serialize  # type: ignore

    t0 = time.time()
    for i in range(n_items):
        payload["i"] = i
        await svc._add_to_pipeline("SET", f"k_raw_{i}", (payload, 3600))
    enqueue_t2 = time.time() - t0

    t0 = time.time()
    await svc._flush_pipeline()
    flush_t2 = time.time() - t0
    results["raw_enqueue_time"] = enqueue_t2
    results["raw_flush_time"] = flush_t2

    # Restore original
    svc._add_to_pipeline = svc._add_to_pipeline_original  # type: ignore

    # TTL memoization microbenchmark
    key = "ttl_test_key"
    # Clear any TTL cache
    svc._ttl_cache.clear()

    # Cold runs
    iters = 2000
    t0 = time.time()
    for i in range(iters):
        await svc._calculate_smart_ttl(key, 3600, None)
    cold = time.time() - t0

    # Warm runs
    t0 = time.time()
    for i in range(iters):
        await svc._calculate_smart_ttl(key, 3600, None)
    warm = time.time() - t0

    results["ttl_cold_time"] = cold
    results["ttl_warm_time"] = warm

    return results


def pretty_print(results):
    print("\nMicrobenchmark results:\n")
    for k, v in results.items():
        print(f"{k}: {v:.6f}s")


if __name__ == "__main__":
    import asyncio

    print("Running pipeline + TTL microbenchmark (this may take a few seconds)...")
    res = asyncio.run(run_pipeline_test(n_items=2000, payload_size=1024))
    pretty_print(res)
    # Show ratios
    print("\nDerived metrics:")
    try:
        enqueue_ratio = res["pre_serialize_enqueue_time"] / res["raw_enqueue_time"]
    except Exception:
        enqueue_ratio = None
    try:
        flush_ratio = res["pre_serialize_flush_time"] / res["raw_flush_time"]
    except Exception:
        flush_ratio = None

    print(f"enqueue_time_ratio (pre/raw): {enqueue_ratio}")
    print(f"flush_time_ratio (pre/raw): {flush_ratio}")
    print(
        f"ttl_cold/warm ratio: {res['ttl_cold_time'] / res['ttl_warm_time'] if res['ttl_warm_time']>0 else 'inf'}"
    )
