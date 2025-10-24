"""Runtime-friendly CLV metrics helpers used by PropFinder and tests."""

from __future__ import annotations

import logging
import time
from contextlib import contextmanager
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)

DEFAULT_ENDPOINT = "propfinder_opportunities"

# Do not import CLVMetricsService at module import time. Tests patch
# ``backend.services.clv_metrics.CLVMetricsService`` and expect the
# patched constructor to be exercised when the application code
# constructs the instance. Importing the class here would bind the
# original class into this module's namespace and prevent the test
# patch from taking effect. Instead, resolve the underlying service
# dynamically inside methods below.
CLVMetricsService = None
PROMETHEUS_AVAILABLE = False


class CLVMetrics:
    """Small facade that mirrors CLVMetricsService while remaining test-friendly."""

    def __init__(self) -> None:
        self._service: Optional[Any] = None
        self._service_enabled = False

        # Do not obtain the underlying CLVMetricsService at import time.
        # Tests patching ``backend.services.clv_metrics.CLVMetricsService``
        # expect construction to occur at call-time; resolving the service
        # lazily ensures patched constructors are exercised.
        self._service = None
        self._service_enabled = False

        # Runtime counters (used for diagnostics & tests)
        self.clv_enrichments_total = 0
        self.clv_processing_duration = 0.0
        self.clv_cache_hit_rate = 0.0
        self.clv_opportunities_enriched = 0
        self.clv_failure_rate = 0.0
        self.clv_avg_processing_time = 0.0
        self.clv_system_health: Dict[str, Any] = {}

        self.reset_counters()

    # ------------------------------------------------------------------
    # Counter management helpers
    # ------------------------------------------------------------------
    def reset_counters(self) -> None:
        self._enrichment_count = 0
        self._failure_count = 0
        self._cache_hits = 0
        self._cache_misses = 0
        self._total_duration_ms = 0.0
        self._opportunities_enriched = 0
        self._update_derived_metrics()

    def _update_cache_metrics(self) -> None:
        total_cache_ops = self._cache_hits + self._cache_misses
        self.clv_cache_hit_rate = (
            (self._cache_hits / total_cache_ops) * 100 if total_cache_ops else 0.0
        )

    def _update_derived_metrics(self) -> None:
        total_requests = self._enrichment_count + self._failure_count
        self.clv_enrichments_total = total_requests
        self.clv_processing_duration = self._total_duration_ms
        self.clv_avg_processing_time = (
            self._total_duration_ms / total_requests if total_requests else 0.0
        )
        self.clv_failure_rate = (
            (self._failure_count / total_requests) * 100 if total_requests else 0.0
        )
        self.clv_opportunities_enriched = self._opportunities_enriched
        self._update_cache_metrics()
        self.clv_system_health = {
            "prometheus_available": bool(PROMETHEUS_AVAILABLE),
            "service_enabled": self._service_enabled,
            "metrics_collected": total_requests > 0
            or (self._cache_hits + self._cache_misses) > 0
            or self._opportunities_enriched > 0,
        }

    # ------------------------------------------------------------------
    # Instrumentation helpers
    # ------------------------------------------------------------------
    @contextmanager
    def time_enrichment(self, endpoint: str = DEFAULT_ENDPOINT):
        start = time.perf_counter()
        try:
            yield
        except Exception:
            duration = (time.perf_counter() - start) * 1000
            self.record_failure(duration, endpoint=endpoint)
            raise
        else:
            duration = (time.perf_counter() - start) * 1000
            self.record_success(duration, endpoint=endpoint)

    def record_success(
        self, duration_ms: float, endpoint: str = DEFAULT_ENDPOINT
    ) -> None:
        self._enrichment_count += 1
        self._total_duration_ms += max(duration_ms, 0.0)
        # Obtain the underlying service lazily so tests that patch the
        # CLVMetricsService constructor are effective.
        try:
            # Diagnostic: visible print to stdout for test logs
            print(f"DEBUG: CLVMetrics.record_success called, duration_ms={duration_ms}")
            if self._service is None:
                from backend.services.clv_metrics import get_metrics_service

                # get_metrics_service constructs the CLVMetricsService at
                # call-time which allows test patches on the class to be
                # observed.
                self._service = get_metrics_service()
                print(f"DEBUG: CLVMetrics.record_success obtained svc={self._service!r}")
                self._service_enabled = bool(getattr(self._service, "enabled", False))
        except Exception:  # pragma: no cover - defensive
            self._service = None
            self._service_enabled = False

        # Forward to underlying service when available. The underlying
        # service may be a test-provided mock which may not expose an
        # 'enabled' flag; prefer to attempt the call and let the service
        # decide if it's active. Swallow any exceptions coming from the
        # underlying service to keep the route resilient.
        if self._service is not None:
            try:
                self._service.record_success(duration_ms, endpoint)
            except Exception:
                logger.debug("Underlying CLV service.record_success failed", exc_info=True)
        self._update_derived_metrics()

    def record_failure(
        self, duration_ms: float, endpoint: str = DEFAULT_ENDPOINT
    ) -> None:
        self._failure_count += 1
        self._total_duration_ms += max(duration_ms, 0.0)
        try:
            # Diagnostic: visible print to stdout for test logs
            print(f"DEBUG: CLVMetrics.record_failure called, duration_ms={duration_ms}")
            if self._service is None:
                from backend.services.clv_metrics import get_metrics_service

                self._service = get_metrics_service()
                print(f"DEBUG: CLVMetrics.record_failure obtained svc={self._service!r}")
                self._service_enabled = bool(getattr(self._service, "enabled", False))
        except Exception:  # pragma: no cover - defensive
            self._service = None
            self._service_enabled = False

        # Always attempt to notify the underlying service when present.
        if self._service is not None:
            try:
                self._service.record_failure(duration_ms, endpoint)
            except Exception:
                logger.debug("Underlying CLV service.record_failure failed", exc_info=True)
        self._update_derived_metrics()

    def record_batch(
        self, count: int, duration_ms: float = 0.0, endpoint: str = DEFAULT_ENDPOINT
    ) -> None:
        if count < 0:
            raise ValueError("count must be non-negative")
        self.record_opportunities_enriched(count, endpoint=endpoint)
        if self._service is not None:
            try:
                self._service.record_batch(count, duration_ms, endpoint)
            except Exception:
                logger.debug("Underlying CLV service.record_batch failed", exc_info=True)

    def record_opportunities_enriched(
        self, count: int, endpoint: str = DEFAULT_ENDPOINT
    ) -> None:
        if count < 0:
            raise ValueError("count must be non-negative")
        self._opportunities_enriched += count
        if self._service is not None:
            try:
                self._service.record_batch(count, 0.0, endpoint)
            except Exception:
                logger.debug("Underlying CLV service.record_batch failed", exc_info=True)
        self._update_derived_metrics()

    def record_cache_hit(self, endpoint: str = DEFAULT_ENDPOINT) -> None:
        self._cache_hits += 1
        if self._service is not None:
            try:
                self._service.record_cache_hit(endpoint)
            except Exception:
                logger.debug("Underlying CLV service.record_cache_hit failed", exc_info=True)
        self._update_derived_metrics()

    def record_cache_miss(self, endpoint: str = DEFAULT_ENDPOINT) -> None:
        self._cache_misses += 1
        if self._service is not None:
            try:
                self._service.record_cache_miss(endpoint)
            except Exception:
                logger.debug("Underlying CLV service.record_cache_miss failed", exc_info=True)
        self._update_derived_metrics()

    # ------------------------------------------------------------------
    # Diagnostics & alerting
    # ------------------------------------------------------------------
    def check_alert_thresholds(self) -> Dict[str, Dict[str, Any]]:
        alerts: Dict[str, Dict[str, Any]] = {}
        total = self._enrichment_count + self._failure_count
        failure_rate = (self._failure_count / total) * 100 if total else 0.0
        if failure_rate >= 15.0:  # configurable threshold
            alerts["high_failure_rate"] = {
                "current_rate": round(failure_rate, 1),
                "threshold": 15.0,
                "message": f"CLV failure rate ({failure_rate:.1f}%) exceeds threshold (15%)",
            }
        return alerts

    def get_diagnostics(self) -> Dict[str, Any]:
        total_requests = self._enrichment_count + self._failure_count
        cache_total = self._cache_hits + self._cache_misses

        diagnostics = {
            "enabled": bool(self._service_enabled),
            "metrics_available": True,
            "enrichment_stats": {
                "total_requests": total_requests,
                "successful_enrichments": self._enrichment_count,
                "failed_enrichments": self._failure_count,
                "failure_rate_percent": round(self.clv_failure_rate, 1),
                "average_duration_ms": round(self.clv_avg_processing_time, 2),
            },
            "cache_stats": {
                "cache_hits": self._cache_hits,
                "cache_misses": self._cache_misses,
                "total_cache_events": cache_total,
                "hit_rate_percent": round(self.clv_cache_hit_rate, 1),
            },
            "system_health": {
                **self.clv_system_health,
                "alert_thresholds": self.check_alert_thresholds(),
            },
        }

        alerts = self.check_alert_thresholds()
        if alerts:
            diagnostics["active_alerts"] = alerts

        # Prefer getting a fresh snapshot from the underlying service via the
        # public accessor so tests that patch the constructor/accessor are
        # exercised. Resolve the accessor at call-time to ensure any test
        # patches are effective.
        try:
            from backend.services.clv_metrics import get_metrics_service

            svc = get_metrics_service()
            if svc is not None:
                snapshot = svc.get_snapshot()
                if isinstance(snapshot, dict):
                    diagnostics.setdefault("service_metrics", snapshot)
                    diagnostics.setdefault(
                        "prometheus_available",
                        snapshot.get("prometheus_available", bool(PROMETHEUS_AVAILABLE)),
                    )
                    diagnostics.setdefault("metrics_available", True)
                    diagnostics.setdefault("system_health", {}).setdefault(
                        "prometheus_available",
                        snapshot.get("prometheus_available", bool(PROMETHEUS_AVAILABLE)),
                    )
        except Exception as exc:  # pylint: disable=broad-except # noqa: BLE001
            logger.debug("CLV service snapshot retrieval failed: %s", exc)

        diagnostics.setdefault("prometheus_available", bool(PROMETHEUS_AVAILABLE))
        diagnostics.setdefault("system_health", {})
        diagnostics["system_health"].setdefault(
            "prometheus_available", bool(PROMETHEUS_AVAILABLE)
        )
        return diagnostics


clv_metrics = CLVMetrics()


def get_clv_metrics() -> CLVMetrics:
    return clv_metrics
