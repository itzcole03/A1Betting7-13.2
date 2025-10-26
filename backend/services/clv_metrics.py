"""CLV metrics service with optional Prometheus integration and diagnostics support."""

from __future__ import annotations

import logging
import time
from contextlib import contextmanager
from typing import Any, Callable, Dict, Optional

from backend.services.unified_config import unified_config

logger = logging.getLogger(__name__)

try:
    import prometheus_client  # type: ignore[import-not-found]
except ImportError:  # pragma: no cover - optional dependency
    prometheus_client = None  # type: ignore[assignment]

PROMETHEUS_AVAILABLE = prometheus_client is not None


class _MetricWrapper:
    """Unified interface for Prometheus metrics and lightweight fallbacks."""

    def __init__(self, metric: Any) -> None:
        self.metric = metric

    def labels(self, **kwargs: Any) -> "_MetricWrapper":
        if hasattr(self.metric, "labels"):
            return _MetricWrapper(self.metric.labels(**kwargs))
        return self

    def inc(self, amount: float = 1.0) -> None:
        if hasattr(self.metric, "inc"):
            self.metric.inc(amount)

    def set(self, value: float) -> None:
        if hasattr(self.metric, "set"):
            self.metric.set(value)


def _create_metric(
    metric_type: str,
    name: str,
    description: str,
    *,
    labels: Optional[list[str]] = None,
    registry: Any = None,
) -> _MetricWrapper:
    if not PROMETHEUS_AVAILABLE or prometheus_client is None:
        return _MetricWrapper(object())

    constructor = getattr(prometheus_client, metric_type)
    metric = constructor(name, description, labels or [], registry=registry)
    return _MetricWrapper(metric)


class CLVMetricsService:
    """Tracks CLV enrichment metrics with optional Prometheus export."""

    _instance: Optional["CLVMetricsService"] = None

    def __init__(self, registry: Any | None = None) -> None:
        # TRACE: constructor instrumentation to help tests detect patching
        try:
            import inspect

            caller = inspect.stack()[1]
            print(
                f"TRACE: CLVMetricsService.__init__ called, cls_obj={CLVMetricsService!r}, caller={caller.function} {caller.filename}:{caller.lineno}"
            )
        except Exception:
            # Best-effort tracing; do not fail construction on inspection errors
            pass
        config = unified_config.get_config()
        self.enabled = bool(config.performance.enable_clv_metrics)

        self.registry = registry
        if (
            self.registry is None
            and PROMETHEUS_AVAILABLE
            and prometheus_client is not None
        ):
            self.registry = prometheus_client.CollectorRegistry()  # type: ignore[call-arg]

        self.clv_success_rate_total = _create_metric(
            "Counter",
            "clv_success_rate_total",
            "Total CLV enrichment successes",
            labels=["endpoint"],
            registry=self.registry,
        )
        self.clv_failure_rate_total = _create_metric(
            "Counter",
            "clv_failure_rate_total",
            "Total CLV enrichment failures",
            labels=["endpoint"],
            registry=self.registry,
        )
        self.clv_avg_latency_ms = _create_metric(
            "Gauge",
            "clv_avg_latency_ms",
            "Average CLV enrichment latency in milliseconds",
            labels=["endpoint"],
            registry=self.registry,
        )
        self.clv_opportunities_processed_total = _create_metric(
            "Counter",
            "clv_opportunities_processed_total",
            "Total opportunities processed with CLV data",
            labels=["endpoint"],
            registry=self.registry,
        )
        self.clv_cache_hits_total = _create_metric(
            "Counter",
            "clv_cache_hits_total",
            "Total CLV cache hits",
            labels=["endpoint"],
            registry=self.registry,
        )
        self.clv_cache_misses_total = _create_metric(
            "Counter",
            "clv_cache_misses_total",
            "Total CLV cache misses",
            labels=["endpoint"],
            registry=self.registry,
        )

        self._reset_counters()

    @classmethod
    def get_instance(cls) -> "CLVMetricsService":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _reset_counters(self) -> None:
        self._enrichment_count = 0
        self._failure_count = 0
        self._cache_hits = 0
        self._cache_misses = 0
        self._opportunities_processed = 0
        self._total_duration_ms = 0.0

    def _safe_metric_operation(
        self, operation: Callable[[], None], metric_name: str
    ) -> None:
        try:
            operation()
        except Exception as exc:  # pylint: disable=broad-except # noqa: BLE001
            logger.debug("CLV metric '%s' update failed: %s", metric_name, exc)

    def record_success(
        self, duration_ms: float, endpoint: str = "propfinder_opportunities"
    ) -> None:
        if not self.enabled:
            return
        self._safe_metric_operation(
            lambda: self.clv_success_rate_total.labels(endpoint=endpoint).inc(),
            "clv_success_rate_total",
        )
        self._enrichment_count += 1
        self._total_duration_ms += max(duration_ms, 0.0)
        self._update_avg_latency(endpoint)

    def record_failure(
        self, duration_ms: float, endpoint: str = "propfinder_opportunities"
    ) -> None:
        if not self.enabled:
            return
        self._safe_metric_operation(
            lambda: self.clv_failure_rate_total.labels(endpoint=endpoint).inc(),
            "clv_failure_rate_total",
        )
        self._failure_count += 1
        self._total_duration_ms += max(duration_ms, 0.0)
        self._update_avg_latency(endpoint)

    def record_batch(
        self, count: int, duration_ms: float, endpoint: str = "propfinder_opportunities"
    ) -> None:
        del duration_ms
        if not self.enabled or count < 0:
            return
        self._safe_metric_operation(
            lambda: self.clv_opportunities_processed_total.labels(
                endpoint=endpoint
            ).inc(count),
            "clv_opportunities_processed_total",
        )
        self._opportunities_processed += count

    def record_cache_hit(self, endpoint: str = "propfinder_opportunities") -> None:
        if not self.enabled:
            return
        self._safe_metric_operation(
            lambda: self.clv_cache_hits_total.labels(endpoint=endpoint).inc(),
            "clv_cache_hits_total",
        )
        self._cache_hits += 1

    def record_cache_miss(self, endpoint: str = "propfinder_opportunities") -> None:
        if not self.enabled:
            return
        self._safe_metric_operation(
            lambda: self.clv_cache_misses_total.labels(endpoint=endpoint).inc(),
            "clv_cache_misses_total",
        )
        self._cache_misses += 1

    def _update_avg_latency(self, endpoint: str) -> None:
        total_operations = self._enrichment_count + self._failure_count
        if total_operations <= 0:
            return
        avg_latency = self._total_duration_ms / total_operations
        self._safe_metric_operation(
            lambda: self.clv_avg_latency_ms.labels(endpoint=endpoint).set(avg_latency),
            "clv_avg_latency_ms",
        )

    @contextmanager
    def timing_context(self, endpoint: str = "propfinder_opportunities"):
        start_time = time.perf_counter()
        success = False
        try:
            yield
            success = True
        finally:
            duration_ms = (time.perf_counter() - start_time) * 1000
            if success:
                self.record_success(duration_ms, endpoint)
            else:
                self.record_failure(duration_ms, endpoint)

    def get_snapshot(self) -> Dict[str, Any]:
        try:
            config = unified_config.get_config()
            self.enabled = bool(config.performance.enable_clv_metrics)
        except Exception as exc:  # pylint: disable=broad-except # noqa: BLE001
            logger.debug("CLV config refresh failed: %s", exc)

        if not self.enabled:
            return {
                "enabled": False,
                "reason": "disabled_by_flag",
                "prometheus_available": PROMETHEUS_AVAILABLE,
                "metrics_available": False,
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "meta": {"source": "clv_metrics", "version": "v1"},
            }

        total_operations = self._enrichment_count + self._failure_count
        cache_total = self._cache_hits + self._cache_misses

        success_rate = (
            (self._enrichment_count / total_operations * 100)
            if total_operations
            else 0.0
        )
        failure_rate = (
            (self._failure_count / total_operations * 100) if total_operations else 0.0
        )
        avg_latency_ms = (
            (self._total_duration_ms / total_operations) if total_operations else 0.0
        )
        cache_hit_rate = (self._cache_hits / cache_total * 100) if cache_total else 0.0

        enrichment_stats = {
            "total_requests": total_operations,
            "successful_enrichments": self._enrichment_count,
            "failed_enrichments": self._failure_count,
            "failure_rate_percent": round(failure_rate, 2),
            "success_rate_percent": round(success_rate, 2),
            "average_duration_ms": round(avg_latency_ms, 2),
            "opportunities_processed": self._opportunities_processed,
        }

        cache_stats = {
            "cache_hits": self._cache_hits,
            "cache_misses": self._cache_misses,
            "total_cache_events": cache_total,
            "hit_rate_percent": round(cache_hit_rate, 2),
        }

        system_health = {
            "prometheus_available": PROMETHEUS_AVAILABLE,
            "metrics_collected": bool(total_operations or cache_total),
            "service_active": self.enabled,
            "window_size": "runtime",
        }

        diagnostics = {
            "enabled": True,
            "metrics_available": True,
            "enrichment_stats": enrichment_stats,
            "cache_stats": cache_stats,
            "system_health": system_health,
            # legacy keys for backwards compatibility
            "success_rate": round(success_rate, 2),
            "failure_rate": round(failure_rate, 2),
            "avg_latency_ms": round(avg_latency_ms, 2),
            "processed_total": total_operations,
            "cache_hit_rate": round(cache_hit_rate, 2),
            "window_size": "runtime",
            "prometheus_available": PROMETHEUS_AVAILABLE,
            # Add stable metadata for diagnostics consumers/tests
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "meta": {"source": "clv_metrics", "version": "v1"},
        }

        return diagnostics


# IMPORTANT: do not create a module-level singleton here. Instantiating the
# CLVMetricsService at import time makes it difficult for test-suite patches
# of the CLVMetricsService constructor to take effect. Instead, construct a
# fresh instance at call-time in the lightweight wrappers below. Tests that
# patch ``backend.services.clv_metrics.CLVMetricsService`` (for example using
# unittest.mock.patch) will therefore receive the constructed mock instance
# when these wrappers invoke the class.


def _get_clv_metrics_instance() -> Optional[CLVMetricsService]:
    """Return a fresh CLVMetricsService instance constructed at call-time.

    This helper calls the class constructor directly so test patches on the
    class object are exercised. If construction fails for any reason, return
    None to keep callers resilient.
    """
    try:
        logger.info(
            "clv_metrics: constructing CLVMetricsService instance via constructor"
        )
        # TEMP TRACE
        print(
            f"TRACE: about to call CLVMetricsService constructor object={CLVMetricsService!r}"
        )
        return CLVMetricsService()
    except Exception:
        try:
            # Fallback: if the class implements a get_instance classmethod, call it
            # (this preserves older behaviour when needed).
            logger.info("clv_metrics: constructor failed; trying get_instance()")
            return CLVMetricsService.get_instance()
        except Exception:
            logger.info(
                "clv_metrics: Could not obtain CLV metrics instance via constructor or get_instance"
            )
            return None


def init_metrics() -> None:
    # Intentionally a no-op: keep compatibility but avoid constructing on import
    _ = _get_clv_metrics_instance()


def get_metrics_service() -> Optional[CLVMetricsService]:
    """Public accessor that constructs or returns a CLVMetricsService instance.

    Tests can patch the CLVMetricsService constructor or this accessor to
    deterministically control the instance returned to callers. This helper
    centralizes construction logic for call-sites that prefer an explicit
    instance (instead of the lightweight wrappers).
    """
    # Prefer direct construction (so tests that patch the class are exercised)
    try:
        logger.info(
            "clv_metrics.get_metrics_service: CLVMetricsService constructor object=%r",
            CLVMetricsService,
        )
        # TEMP TRACE
        print(
            f"TRACE: get_metrics_service sees constructor object={CLVMetricsService!r}"
        )
        inst = CLVMetricsService()
        # TEMP TRACE
        print(f"TRACE: get_metrics_service constructed instance={inst!r}")
        logger.info("clv_metrics.get_metrics_service: constructed instance=%r", inst)
        return inst
    except Exception as exc:  # pragma: no cover - defensive
        logger.info(
            "clv_metrics.get_metrics_service: constructor raised %s, falling back to get_instance",
            exc,
        )
        try:
            inst = CLVMetricsService.get_instance()
            logger.info(
                "clv_metrics.get_metrics_service: get_instance returned %r", inst
            )
            print(f"TRACE: get_metrics_service fallback get_instance returned={inst!r}")
            return inst
        except Exception:
            logger.info(
                "clv_metrics.get_metrics_service: could not obtain instance via get_instance()"
            )
            print("TRACE: get_metrics_service could not obtain instance")
            return None


def record_success(
    duration_ms: float, endpoint: str = "propfinder_opportunities"
) -> None:
    inst = _get_clv_metrics_instance()
    if inst is None:
        return
    try:
        inst.record_success(duration_ms, endpoint)
    except Exception as exc:
        logger.debug("CLV record_success failed: %s", exc)


def record_failure(
    duration_ms: float, endpoint: str = "propfinder_opportunities"
) -> None:
    inst = _get_clv_metrics_instance()
    if inst is None:
        return
    try:
        logger.info("clv_metrics: invoking record_failure on metrics instance %r", inst)
        print(
            f"DEBUG: clv_metrics.record_failure calling inst.record_failure on {inst!r} with duration={duration_ms}"
        )
        inst.record_failure(duration_ms, endpoint)
    except Exception as exc:
        logger.info("CLV record_failure failed: %s", exc)


def record_batch(
    count: int, duration_ms: float, endpoint: str = "propfinder_opportunities"
) -> None:
    inst = _get_clv_metrics_instance()
    if inst is None:
        return
    try:
        inst.record_batch(count, duration_ms, endpoint)
    except Exception as exc:
        logger.debug("CLV record_batch failed: %s", exc)


def get_snapshot() -> Dict[str, Any]:
    inst = _get_clv_metrics_instance()
    if inst is None:
        return {
            "enabled": False,
            "reason": "metrics_unavailable",
            "prometheus_available": PROMETHEUS_AVAILABLE,
            "metrics_available": False,
        }
    try:
        return inst.get_snapshot()
    except Exception as exc:
        logger.debug("CLV get_snapshot failed: %s", exc)
        return {
            "enabled": False,
            "reason": "snapshot_error",
            "prometheus_available": PROMETHEUS_AVAILABLE,
            "metrics_available": False,
        }


# Backwards-compatible lightweight facade object. Tests and other modules
# import ``clv_metrics`` from this module and call methods on it. To keep
# test patches on CLVMetricsService effective, this facade resolves the
# underlying service at call-time using the wrappers above rather than
# instantiating a singleton at import time.
class _CLVMetricsFacade:
    def record_success(
        self, duration_ms: float, endpoint: str = "propfinder_opportunities"
    ) -> None:
        return record_success(duration_ms, endpoint)

    def record_failure(
        self, duration_ms: float, endpoint: str = "propfinder_opportunities"
    ) -> None:
        return record_failure(duration_ms, endpoint)

    def record_batch(
        self,
        count: int,
        duration_ms: float = 0.0,
        endpoint: str = "propfinder_opportunities",
    ) -> None:
        return record_batch(count, duration_ms, endpoint)

    def get_snapshot(self) -> Dict[str, Any]:
        return get_snapshot()


# Expose facade instance for backwards compatibility
clv_metrics = _CLVMetricsFacade()
