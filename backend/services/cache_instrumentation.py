"""
Cache Instrumentation Service

Provides comprehensive cache observability and instrumentation:
- Hit/miss tracking and metrics aggregation
- Stampede protection with async locks
- Latency measurement with EWMA
- Namespace and pattern-based counters
- Rolling statistics and rebuild event tracking

Wraps existing cache services to provide unified observability.
"""

import asyncio
import time
import logging
from collections import defaultdict, deque
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Dict, Set, Callable, Awaitable, Any, Optional, List, DefaultDict
from threading import Lock
import hashlib

logger = logging.getLogger(__name__)


@dataclass
class CacheStatsSnapshot:
    """Immutable snapshot of cache statistics"""
    
    # Basic metrics
    total_keys: int
    hit_count: int
    miss_count: int
    hit_ratio: float
    
    # Performance metrics
    average_get_latency_ms: float
    total_operations: int
    
    # Advanced metrics
    rebuild_events: int
    stampede_preventions: int
    cache_version: str
    
    # Namespace breakdown
    namespaced_counts: Dict[str, int]
    tier_breakdown: Dict[str, Dict[str, int]]
    
    # Timestamp
    timestamp: str
    uptime_seconds: float


@dataclass
class NamespaceStats:
    """Per-namespace cache statistics"""
    
    hits: int = 0
    misses: int = 0
    sets: int = 0
    deletes: int = 0
    total_latency_ms: float = 0.0
    operation_count: int = 0
    
    @property
    def hit_ratio(self) -> float:
        total = self.hits + self.misses
        return self.hits / total if total > 0 else 0.0
    
    @property
    def avg_latency_ms(self) -> float:
        return self.total_latency_ms / self.operation_count if self.operation_count > 0 else 0.0


class CacheInstrumentation:
    """
    Cache instrumentation and observability service
    
    Provides comprehensive metrics, stampede protection, and observability
    for cache operations without modifying the underlying cache implementation.
    """
    
    def __init__(self, cache_version: str = "v1"):
        # Configuration
        self.cache_version = cache_version
        self.start_time = time.time()
        
        # Global metrics
        self._total_hits = 0
        self._total_misses = 0
        self._total_sets = 0
        self._total_deletes = 0
        self._rebuild_events = 0
        self._stampede_preventions = 0
        
        # Latency tracking (EWMA with alpha=0.1)
        self._ewma_latency_ms = 0.0
        self._total_operations = 0
        
        # Namespace tracking
        self._namespace_stats: DefaultDict[str, NamespaceStats] = defaultdict(NamespaceStats)
        
        # Tier tracking
        self._tier_stats: DefaultDict[str, DefaultDict[str, int]] = defaultdict(lambda: defaultdict(int))
        
        # Recent latencies for percentiles (circular buffer)
        self._recent_latencies: deque = deque(maxlen=1000)
        
        # Stampede protection
        self._build_locks: Dict[str, asyncio.Lock] = {}
        self._lock_cleanup_lock = Lock()
        
        # Active key tracking
        self._active_keys: Set[str] = set()
        self._key_tracking_lock = Lock()
        
        # Background cleanup task
        self._cleanup_task: Optional[asyncio.Task] = None
        self._start_background_tasks()
    
    def _start_background_tasks(self):
        """Start background maintenance tasks"""
        try:
            self._cleanup_task = asyncio.create_task(self._periodic_cleanup())
        except RuntimeError:
            # No event loop running, cleanup will be manual
            logger.debug("No event loop for background tasks, using manual cleanup")
    
    async def _periodic_cleanup(self):
        """Periodic cleanup of locks and tracking structures"""
        while True:
            try:
                await asyncio.sleep(300)  # Clean every 5 minutes
                
                # Clean up unused locks
                with self._lock_cleanup_lock:
                    # Remove locks that are not currently locked
                    locks_to_remove = [
                        key for key, lock in self._build_locks.items() 
                        if not lock.locked()
                    ]
                    for key in locks_to_remove:
                        del self._build_locks[key]
                
                # Log cleanup stats
                if locks_to_remove:
                    logger.debug(f"🧹 Cleaned up {len(locks_to_remove)} unused stampede locks")
                    
            except Exception as e:
                logger.error(f"❌ Cleanup task error: {e}")
                await asyncio.sleep(60)  # Wait before retry
    
    def record_hit(self, key: str, latency_ms: float, namespace: str = "default", tier: str = "default"):
        """Record a cache hit with timing"""
        self._total_hits += 1
        self._update_latency(latency_ms)
        self._update_namespace_stats(namespace, hits=1, latency_ms=latency_ms)
        self._update_tier_stats(tier, "hits", 1)
        self._track_key(key)
        
        logger.debug(f"✅ Cache hit: {key} ({latency_ms:.2f}ms)")
    
    def record_miss(self, key: str, latency_ms: float, namespace: str = "default", tier: str = "default"):
        """Record a cache miss with timing"""
        self._total_misses += 1
        self._update_latency(latency_ms)
        self._update_namespace_stats(namespace, misses=1, latency_ms=latency_ms)
        self._update_tier_stats(tier, "misses", 1)
        
        logger.debug(f"🔍 Cache miss: {key} ({latency_ms:.2f}ms)")
    
    def record_set(self, key: str, latency_ms: float, namespace: str = "default", tier: str = "default"):
        """Record a cache set operation with timing"""
        self._total_sets += 1
        self._update_latency(latency_ms)
        self._update_namespace_stats(namespace, sets=1, latency_ms=latency_ms)
        self._update_tier_stats(tier, "sets", 1)
        self._track_key(key)
        
        logger.debug(f"💾 Cache set: {key} ({latency_ms:.2f}ms)")
    
    def record_delete(self, key: str, namespace: str = "default", tier: str = "default"):
        """Record a cache delete operation"""
        self._total_deletes += 1
        self._update_namespace_stats(namespace, deletes=1)
        self._update_tier_stats(tier, "deletes", 1)
        self._untrack_key(key)
        
        logger.debug(f"🗑️ Cache delete: {key}")
    
    def record_rebuild_event(self, key: str, namespace: str = "default"):
        """Record a cache rebuild event"""
        self._rebuild_events += 1
        logger.debug(f"🔄 Cache rebuild: {key} (namespace: {namespace})")
    
    def record_stampede_prevention(self, key: str):
        """Record a stampede prevention event"""
        self._stampede_preventions += 1
        logger.debug(f"🛡️ Stampede prevented: {key}")
    
    def get_or_create_lock(self, key: str) -> asyncio.Lock:
        """Get or create an async lock for stampede protection"""
        with self._lock_cleanup_lock:
            if key not in self._build_locks:
                self._build_locks[key] = asyncio.Lock()
            return self._build_locks[key]
    
    def _update_latency(self, latency_ms: float):
        """Update EWMA latency tracking"""
        self._total_operations += 1
        self._recent_latencies.append(latency_ms)
        
        if self._ewma_latency_ms == 0.0:
            self._ewma_latency_ms = latency_ms
        else:
            # EWMA with alpha = 0.1 (90% history, 10% new)
            alpha = 0.1
            self._ewma_latency_ms = (alpha * latency_ms) + ((1 - alpha) * self._ewma_latency_ms)
    
    def _update_namespace_stats(self, namespace: str, hits: int = 0, misses: int = 0, 
                               sets: int = 0, deletes: int = 0, latency_ms: float = 0.0):
        """Update per-namespace statistics"""
        stats = self._namespace_stats[namespace]
        stats.hits += hits
        stats.misses += misses
        stats.sets += sets
        stats.deletes += deletes
        
        if latency_ms > 0:
            stats.total_latency_ms += latency_ms
            stats.operation_count += 1
    
    def _update_tier_stats(self, tier: str, operation: str, count: int):
        """Update per-tier statistics"""
        self._tier_stats[tier][operation] += count
    
    def _track_key(self, key: str):
        """Track active cache key"""
        with self._key_tracking_lock:
            self._active_keys.add(key)
    
    def _untrack_key(self, key: str):
        """Untrack cache key"""
        with self._key_tracking_lock:
            self._active_keys.discard(key)
    
    def get_snapshot(self) -> CacheStatsSnapshot:
        """Get current cache statistics snapshot"""
        # Calculate derived metrics
        total_requests = self._total_hits + self._total_misses
        hit_ratio = round(self._total_hits / total_requests, 3) if total_requests > 0 else 0.0
        
        uptime_seconds = round(time.time() - self.start_time, 1)
        
        # Build namespace counts
        namespaced_counts = {}
        for namespace, stats in self._namespace_stats.items():
            total_ops = stats.hits + stats.misses + stats.sets + stats.deletes
            namespaced_counts[namespace] = total_ops
        
        # Build tier breakdown
        tier_breakdown = {}
        for tier, operations in self._tier_stats.items():
            tier_breakdown[tier] = dict(operations)
        
        return CacheStatsSnapshot(
            total_keys=len(self._active_keys),
            hit_count=self._total_hits,
            miss_count=self._total_misses,
            hit_ratio=hit_ratio,
            average_get_latency_ms=round(self._ewma_latency_ms, 2),
            total_operations=self._total_operations,
            rebuild_events=self._rebuild_events,
            stampede_preventions=self._stampede_preventions,
            cache_version=self.cache_version,
            namespaced_counts=namespaced_counts,
            tier_breakdown=tier_breakdown,
            timestamp=datetime.now(timezone.utc).isoformat(),
            uptime_seconds=uptime_seconds
        )
    
    def get_namespace_stats(self, namespace: str) -> Optional[NamespaceStats]:
        """Get statistics for a specific namespace"""
        return self._namespace_stats.get(namespace)
    
    def get_all_namespace_stats(self) -> Dict[str, NamespaceStats]:
        """Get statistics for all namespaces"""
        return dict(self._namespace_stats)
    
    def get_tier_stats(self, tier: str) -> Dict[str, int]:
        """Get statistics for a specific tier"""
        return dict(self._tier_stats.get(tier, {}))
    
    def get_recent_latency_percentiles(self) -> Dict[str, float]:
        """Get recent latency percentiles"""
        if not self._recent_latencies:
            return {"p50": 0.0, "p90": 0.0, "p95": 0.0, "p99": 0.0}
        
        sorted_latencies = sorted(self._recent_latencies)
        n = len(sorted_latencies)
        
        return {
            "p50": sorted_latencies[int(n * 0.5)],
            "p90": sorted_latencies[int(n * 0.9)],
            "p95": sorted_latencies[int(n * 0.95)],
            "p99": sorted_latencies[int(n * 0.99)]
        }
    
    def reset_metrics(self):
        """Reset all metrics (useful for testing)"""
        self._total_hits = 0
        self._total_misses = 0
        self._total_sets = 0
        self._total_deletes = 0
        self._rebuild_events = 0
        self._stampede_preventions = 0
        self._ewma_latency_ms = 0.0
        self._total_operations = 0
        
        self._namespace_stats.clear()
        self._tier_stats.clear()
        self._recent_latencies.clear()
        
        with self._key_tracking_lock:
            self._active_keys.clear()
        
        with self._lock_cleanup_lock:
            self._build_locks.clear()
        
        self.start_time = time.time()
        
        logger.info("🔄 Cache instrumentation metrics reset")
    
    async def close(self):
        """Cleanup resources"""
        if self._cleanup_task and not self._cleanup_task.done():
            self._cleanup_task.cancel()
            try:
                await self._cleanup_task
            except asyncio.CancelledError:
                pass
        
        logger.info("🔄 Cache instrumentation shutdown completed")


# Global instrumentation instance
cache_instrumentation = CacheInstrumentation()


class InstrumentedOperation:
    """Context manager for instrumenting cache operations"""
    
    def __init__(self, instrumentation: CacheInstrumentation, operation: str, 
                 key: str, namespace: str = "default", tier: str = "default"):
        self.instrumentation = instrumentation
        self.operation = operation
        self.key = key
        self.namespace = namespace
        self.tier = tier
        self.start_time = 0.0
        self.latency_ms = 0.0
    
    def __enter__(self):
        self.start_time = time.time()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.latency_ms = (time.time() - self.start_time) * 1000
        
        if exc_type is None:
            # Successful operation
            if self.operation == "get_hit":
                self.instrumentation.record_hit(self.key, self.latency_ms, self.namespace, self.tier)
            elif self.operation == "get_miss":
                self.instrumentation.record_miss(self.key, self.latency_ms, self.namespace, self.tier)
            elif self.operation == "set":
                self.instrumentation.record_set(self.key, self.latency_ms, self.namespace, self.tier)
            elif self.operation == "delete":
                self.instrumentation.record_delete(self.key, self.namespace, self.tier)
        else:
            # Operation failed - still record miss for gets
            if self.operation in ["get_hit", "get_miss"]:
                self.instrumentation.record_miss(self.key, self.latency_ms, self.namespace, self.tier)


# Convenience functions for instrumentation
def instrument_get_hit(key: str, namespace: str = "default", tier: str = "default") -> InstrumentedOperation:
    """Create instrumentation context for cache hit"""
    return InstrumentedOperation(cache_instrumentation, "get_hit", key, namespace, tier)

def instrument_get_miss(key: str, namespace: str = "default", tier: str = "default") -> InstrumentedOperation:
    """Create instrumentation context for cache miss"""
    return InstrumentedOperation(cache_instrumentation, "get_miss", key, namespace, tier)

def instrument_set(key: str, namespace: str = "default", tier: str = "default") -> InstrumentedOperation:
    """Create instrumentation context for cache set"""
    return InstrumentedOperation(cache_instrumentation, "set", key, namespace, tier)

def instrument_delete(key: str, namespace: str = "default", tier: str = "default") -> InstrumentedOperation:
    """Create instrumentation context for cache delete"""
    return InstrumentedOperation(cache_instrumentation, "delete", key, namespace, tier)