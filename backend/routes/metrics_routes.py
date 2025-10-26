"""
Prometheus Metrics Routes

Minimal, defensive implementation to avoid import-time syntax errors.
"""

import json
import logging
from typing import Any, Dict

from fastapi import APIRouter, Response

try:
    from backend.metrics.prometheus_adapter import get_adapter

    LEGACY_ADAPTER_AVAILABLE = True
except Exception:
    LEGACY_ADAPTER_AVAILABLE = False
    get_adapter = None

from backend.core.response_models import ResponseBuilder, StandardAPIResponse
from backend.services.odds_aggregation_metrics import (
    get_metrics,
    is_prometheus_available,
)

logger = logging.getLogger("odds_aggregation_metrics_routes")

router = APIRouter(prefix="/metrics", tags=["metrics"])
api_metrics_router = APIRouter(prefix="/api/metrics", tags=["metrics"])


@router.get("/prometheus")
async def get_prometheus_metrics():
    try:
        metrics_service = get_metrics()
        if not metrics_service or not metrics_service.is_enabled():
            return Response(
                content='{"detail": "Metrics collection is disabled - Prometheus client not available"}',
                status_code=503,
                media_type="application/json",
            )

        metrics_data = metrics_service.get_metrics()
        content_type = metrics_service.get_metrics_content_type()
        return Response(content=metrics_data, media_type=content_type)

    except Exception as e:
        logger.exception("Error retrieving Prometheus metrics: %s", e)
        return Response(
            content=json.dumps({"detail": f"Failed to retrieve metrics: {str(e)}"}),
            status_code=500,
            media_type="application/json",
        )


@router.get("/")
async def metrics():
    try:
        if LEGACY_ADAPTER_AVAILABLE and get_adapter is not None:
            try:
                adapter = get_adapter()
                data = adapter.generate_metrics()
                return Response(content=data, media_type="text/plain; version=0.0.4")
            except Exception:
                logger.warning(
                    "Legacy adapter failed, falling back to enhanced metrics"
                )

        metrics_service = get_metrics()
        if metrics_service and metrics_service.is_enabled():
            metrics_data = metrics_service.get_metrics()
            return Response(
                content=metrics_data, media_type="text/plain; version=0.0.4"
            )
        else:
            return Response(
                content="# Metrics collection disabled - Prometheus client not available\n",
                media_type="text/plain",
            )

    except Exception as e:
        logger.exception("Error in legacy metrics endpoint: %s", e)
        return Response(
            content=f"# Error generating metrics: {str(e)}\n", media_type="text/plain"
        )


@router.get("")
async def metrics_without_trailing_slash():
    return await metrics()


@router.get("/health")
async def get_metrics_health() -> Dict[str, Any]:
    try:
        metrics_service = get_metrics()
        health_summary = {}
        if metrics_service:
            try:
                health_summary = metrics_service.get_health_summary() or {}
            except Exception:
                health_summary = {}

        health_summary.update(
            {
                "status": (
                    "healthy"
                    if metrics_service and metrics_service.is_enabled()
                    else "degraded"
                ),
                "prometheus_client_available": bool(is_prometheus_available()),
                "legacy_adapter_available": bool(LEGACY_ADAPTER_AVAILABLE),
                "description": (
                    "Metrics collection operational"
                    if metrics_service and metrics_service.is_enabled()
                    else "Metrics collection disabled - Prometheus client not available"
                ),
            }
        )
        return health_summary

    except Exception as e:
        logger.exception("Error retrieving metrics health: %s", e)
        return {
            "status": "unhealthy",
            "prometheus_client_available": False,
            "metrics_enabled": False,
            "legacy_adapter_available": LEGACY_ADAPTER_AVAILABLE,
            "error": str(e),
            "description": "Failed to retrieve metrics health information",
        }


@router.get("/status")
async def get_metrics_status() -> Dict[str, Any]:
    try:
        metrics_service = get_metrics()
        status: Dict[str, Any] = {
            "prometheus_available": bool(is_prometheus_available()),
            "metrics_enabled": bool(metrics_service and metrics_service.is_enabled()),
            "collection_active": bool(
                metrics_service
                and metrics_service.is_enabled()
                and is_prometheus_available()
            ),
            "legacy_adapter_available": bool(LEGACY_ADAPTER_AVAILABLE),
        }

        if metrics_service and metrics_service.is_enabled():
            status.update(
                {
                    "registry_initialized": True,
                    "enhanced_metrics_endpoint": "/metrics/prometheus",
                    "legacy_metrics_endpoint": "/metrics/",
                    "content_type": metrics_service.get_metrics_content_type(),
                    "sample_metrics_available": True,
                }
            )
        else:
            status.update(
                {
                    "registry_initialized": False,
                    "reason": "Prometheus client not available",
                    "fallback": "Mock metrics in use",
                    "recommendation": "Install prometheus-client package to enable metrics",
                }
            )

        return status

    except Exception as e:
        logger.exception("Error retrieving metrics status: %s", e)
        return {
            "prometheus_available": False,
            "metrics_enabled": False,
            "collection_active": False,
            "legacy_adapter_available": False,
            "error": str(e),
            "status": "error",
        }


@api_metrics_router.get(
    "/summary",
    response_model=StandardAPIResponse[Dict[str, Any]],
    summary="Get consolidated metrics summary",
)
async def get_metrics_summary():
    try:
        metrics_service = get_metrics()
        health = None
        if metrics_service:
            try:
                health = metrics_service.get_health_summary()
            except Exception:
                health = None

        summary_payload: Dict[str, Any] = {
            "metrics_enabled": bool(metrics_service and metrics_service.is_enabled()),
            "prometheus_available": bool(is_prometheus_available()),
            "registry_initialized": (
                bool(health.get("registry_initialized")) if health else False
            ),
            "endpoints": {
                "prometheus": "/metrics/prometheus",
                "legacy": "/metrics/",
                "health": "/metrics/health",
                "status": "/metrics/status",
                "summary": "/api/metrics/summary",
            },
        }

        if health:
            summary_payload["health"] = health

        if not summary_payload["prometheus_available"]:
            summary_payload["notes"] = (
                "Prometheus client not available; returning mock metrics"
            )

        return ResponseBuilder.success(summary_payload)
    except Exception as exc:
        logger.exception("Failed to build metrics summary: %s", exc)
        return ResponseBuilder.internal_error(
            "Failed to build metrics summary",
            details={"reason": str(exc)},
        )
