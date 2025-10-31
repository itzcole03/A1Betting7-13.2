"""Minimal testing compat shim (copy of backend.routes.testing_compat_shims_minimal).

This module is used during pytest collection to provide stable, tiny
endpoints for UI and integration tests.
"""

# Copied from backend/routes/testing_compat_shims_minimal.py

import json
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Request

router = APIRouter()

# Module-level tracked CLV status so tests can assert on /clv-status
_last_requested_epoch: int = 0
_last_opportunity_count: int = 0
_last_include_param: bool = False
_last_computation_succeeded: bool = False
_last_returned_with_clv: bool = False
_last_error: Optional[str] = None
_last_feature_flag_enabled: bool = False
# In-memory seeded fixture used by Playwright/global-setup
_TEST_FIXTURE: Optional[Dict[str, Any]] = None


def _get_test_fixture() -> Optional[Dict[str, Any]]:
    try:
        return globals().get("_TEST_FIXTURE")
    except Exception:
        return None


def canonical_success(
    data: Any, meta: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    resp: Dict[str, Any] = {"success": True, "data": data, "error": None}
    resp["status"] = "success"
    resp["message"] = "OK"
    resp["meta"] = meta or {"shim": "minimal"}
    return resp


@router.get("/api/propfinder/opportunities")
async def shim_propfinder_opportunities(
    limit: Optional[int] = None,
    force_flat_baseline: Optional[bool] = False,
    diagnostics: Optional[bool] = False,
    include_clv: Optional[bool] = False,
    clv_diag: Optional[bool] = False,
    fields: Optional[str] = None,
):
    fixture = _get_test_fixture()
    if fixture and isinstance(fixture.get("opportunities"), list):
        base_items: List[Dict[str, Any]] = list(fixture.get("opportunities"))
    else:
        base_items: List[Dict[str, Any]] = [
            {"id": "s1", "player": "P1", "confidence": 72.0},
            {"id": "s2", "player": "P2", "confidence": 75.0},
            {"id": "s3", "player": "P3", "confidence": 68.0},
            {"id": "s4", "player": "P4", "confidence": 80.0},
            {"id": "s5", "player": "P5", "confidence": 60.0},
        ]

    items = list(base_items)
    if limit is not None and isinstance(limit, int):
        items = items[:limit]

    def _truthy(v: Optional[object]) -> bool:
        if isinstance(v, bool):
            return v
        if v is None:
            return False
        try:
            if isinstance(v, int):
                return v != 0
            s = str(v).lower()
            return s in ("1", "true", "t", "yes", "y", "on")
        except Exception:
            return False

    force_flat_baseline = _truthy(force_flat_baseline)
    diagnostics = _truthy(diagnostics)
    include_clv = _truthy(include_clv)
    clv_diag = _truthy(clv_diag)

    try:
        from backend.services.unified_config import unified_config

        perf_conf = getattr(unified_config.get_config(), "performance", None)
        enable_clv_metrics = bool(getattr(perf_conf, "enable_clv_metrics", False))
    except Exception:
        enable_clv_metrics = False

    include_clv_effective = bool(include_clv) and enable_clv_metrics

    shaped: List[Dict[str, Any]] = []
    for it in items:
        conf = it.get("confidence") or 0.0
        ev_percent = conf - 50.0

        if force_flat_baseline:
            opening_line = 0.0
            latest_line = 0.0
            movement_direction = "flat"
            line_change = 0.0
        else:
            opening_line = 1.5
            latest_line = 2.0
            movement_direction = "up"
            line_change = latest_line - opening_line

        opp: Dict[str, Any] = {
            "id": it.get("id"),
            "player": it.get("player"),
            "confidence": conf,
            "sport": "NBA",
            "market": "POINTS",
            "pick": "OVER",
            "edge": 0.0,
            "impliedProbability": 0.5,
            "evPercent": ev_percent,
            "evValue": None,
            "line": latest_line,
            "odds": 110,
            "openingOdds": 110,
            "latestOdds": 115,
            "oddsChange": 115 - 110,
            "openingLine": opening_line,
            "latestLine": latest_line,
            "movementDirection": movement_direction,
            "lineChange": line_change,
            "validationWarnings": [],
        }

        shaped.append(opp)

    if fields == "compact":
        compact_list: List[Dict[str, Any]] = []
        for o in shaped:
            compact_list.append(
                {
                    "id": o.get("id"),
                    "player": o.get("player"),
                    "confidence": o.get("confidence"),
                    "market": o.get("market"),
                    "sport": o.get("sport"),
                    "line": o.get("line"),
                    "odds": o.get("odds"),
                }
            )

        resp: Dict[str, Any] = {
            "opportunities": compact_list,
            "total": len(base_items),
            "filtered": len(compact_list),
        }
    else:
        resp: Dict[str, Any] = {
            "opportunities": shaped,
            "total": len(base_items),
            "filtered": len(shaped),
        }

    resp.setdefault("summary", {})
    resp["summary"]["count"] = len(shaped)
    resp["summary"]["avg_confidence"] = sum(
        [it.get("confidence", 0.0) for it in shaped]
    ) / max(1, len(shaped))

    if diagnostics:
        resp["diagnostics"] = {
            "shim": "minimal",
            "force_flat_baseline": bool(force_flat_baseline),
        }

    # CLV diagnostic meta
    clv_diag_info: Dict[str, Any]
    if clv_diag:
        try:
            from backend.services.clv_metrics import CLVMetricsService

            try:
                clv_svc = CLVMetricsService()
                snap = clv_svc.get_snapshot()
                snap.setdefault("enabled", True)
                snap.setdefault("metrics_available", True)
                snap.setdefault("success_rate", 100.0)
                snap.setdefault("failure_rate", 0.0)
                snap.setdefault("avg_latency_ms", 1.0)
                snap.setdefault("window_size", 1000)
                snap.setdefault("processed_total", len(shaped))
                clv_diag_info = snap
            except Exception:
                clv_diag_info = {
                    "enabled": True,
                    "metrics_available": False,
                    "success_rate": 0.0,
                    "failure_rate": 100.0,
                    "avg_latency_ms": None,
                    "window_size": 1000,
                    "processed_total": len(shaped),
                }
        except Exception:
            clv_diag_info = {
                "enabled": True,
                "metrics_available": True,
                "success_rate": 100.0,
                "failure_rate": 0.0,
                "avg_latency_ms": 1.0,
                "window_size": 1000,
                "processed_total": len(shaped),
                "sample_metric": 0.123,
            }
    else:
        clv_diag_info = {
            "enabled": False,
            "metrics_available": False,
            "reason": "clv_diag_disabled",
            "window_size": None,
        }

    resp["clv_diagnostics"] = clv_diag_info
    meta = {"clv_diagnostics": clv_diag_info, "shim": "minimal"}

    global _last_requested_epoch, _last_opportunity_count, _last_include_param, _last_computation_succeeded, _last_returned_with_clv, _last_error, _last_feature_flag_enabled
    _last_requested_epoch = int(time.time())
    _last_opportunity_count = len(shaped)
    _last_include_param = bool(include_clv)
    _last_error = None
    _last_feature_flag_enabled = enable_clv_metrics

    resp_with_meta = dict(resp)
    resp_with_meta.setdefault("meta", {})
    resp_with_meta["meta"].update(meta)

    if include_clv_effective:
        enrichment_failed = False
        enriched_return = None

        compute_clv_batch = None
        SimplePropFinderService = None
        try:
            from backend.services.simple_propfinder_service import (
                SimplePropFinderService,
            )
        except Exception:
            SimplePropFinderService = None

        try:
            from backend.services.clv_computation import compute_clv_batch
        except Exception:
            compute_clv_batch = None

        spf_patched = False
        clv_batch_patched = False
        try:
            import unittest.mock as _um

            if SimplePropFinderService is not None and isinstance(
                SimplePropFinderService, _um.Mock
            ):
                spf_patched = True
            if compute_clv_batch is not None and isinstance(
                compute_clv_batch, _um.Mock
            ):
                clv_batch_patched = True
        except Exception:
            spf_patched = False
            clv_batch_patched = False

        try:
            if spf_patched and SimplePropFinderService is not None:
                svc = SimplePropFinderService()
                svc.attach_clv_data(shaped)
                enriched_return = None
            elif clv_batch_patched and compute_clv_batch is not None:
                enriched_return = compute_clv_batch(shaped)
            else:
                if compute_clv_batch is not None:
                    enriched_return = compute_clv_batch(shaped)
                elif SimplePropFinderService is not None:
                    svc = SimplePropFinderService()
                    svc.attach_clv_data(shaped)
                    enriched_return = None
                else:
                    enriched_return = None
        except Exception as exc:
            enrichment_failed = True
            _last_error = str(exc)

            try:
                from backend.services import clv_metrics as _cm_mod
            except Exception:
                _cm_mod = None

            try:
                if _cm_mod is not None and hasattr(_cm_mod, "CLVMetricsService"):
                    CM = getattr(_cm_mod, "CLVMetricsService")
                    try:
                        cinst = CM()
                        if hasattr(cinst, "record_failure"):
                            cinst.record_failure()
                    except Exception:
                        try:
                            if hasattr(CM, "record_failure"):
                                CM.record_failure()
                        except Exception:
                            pass

                if _cm_mod is not None and hasattr(_cm_mod, "record_failure"):
                    try:
                        getattr(_cm_mod, "record_failure")()
                    except Exception:
                        pass
            except Exception:
                pass

            _last_computation_succeeded = False
            _last_returned_with_clv = False

        if not enrichment_failed and enriched_return is not None:
            try:
                for idx, enriched in enumerate(enriched_return):
                    if idx >= len(shaped):
                        break
                    opp = shaped[idx]
                    for attr, key in (
                        ("clvPercent", "clvPercent"),
                        ("clv_percent", "clvPercent"),
                        ("closingLine", "closingLine"),
                        ("closing_line_value", "closingLine"),
                        ("closingOdds", "closingOdds"),
                        ("clv_metrics", "clv_metrics"),
                    ):
                        val = None
                        if hasattr(enriched, attr):
                            val = getattr(enriched, attr)
                        elif isinstance(enriched, dict) and attr in enriched:
                            val = enriched[attr]
                        if val is not None:
                            opp[key] = val
            except Exception:
                pass

        for opp in shaped:
            if enrichment_failed:
                for k in ("clvPercent", "closingLine", "closingOdds", "clv_metrics"):
                    opp.pop(k, None)
            else:
                if include_clv_effective:
                    if "clvPercent" not in opp:
                        opp["clvPercent"] = round((opp.get("evPercent", 0.0) / 2.0), 3)
                    if "closingLine" not in opp:
                        opp["closingLine"] = opp.get("latestLine")
                    if "closingOdds" not in opp:
                        opp["closingOdds"] = None
                    if "clv_metrics" not in opp:
                        opp["clv_metrics"] = {
                            "clv_estimate": opp.get("clvPercent"),
                            "market_efficiency": 0.85,
                        }
                else:
                    for k in (
                        "clvPercent",
                        "closingLine",
                        "closingOdds",
                        "clv_metrics",
                    ):
                        opp.pop(k, None)

            for back_key, default in (
                ("sport", "NBA"),
                ("market", "POINTS"),
                ("pick", "OVER"),
                ("line", opp.get("line")),
                ("odds", opp.get("odds")),
                ("edge", opp.get("edge", 0.0)),
                ("impliedProbability", opp.get("impliedProbability", 0.5)),
            ):
                if back_key not in opp:
                    opp[back_key] = default

        norm_keys_defaults = {
            "sport": "NBA",
            "market": "POINTS",
            "pick": "OVER",
            "line": None,
            "odds": None,
            "edge": 0.0,
            "impliedProbability": 0.5,
        }
        normalized: List[Dict[str, Any]] = []
        for opp in shaped:
            if not isinstance(opp, dict):
                try:
                    converted = {
                        k: getattr(opp, k) for k in dir(opp) if not k.startswith("__")
                    }
                except Exception:
                    converted = {str(i): None for i in range(0)}
                opp = converted

            for k, default in norm_keys_defaults.items():
                if k not in opp or opp.get(k) is None:
                    opp[k] = default if default is not None else opp.get("line")

            if include_clv_effective and not enrichment_failed:
                if "clvPercent" not in opp:
                    opp["clvPercent"] = round((opp.get("evPercent", 0.0) / 2.0), 3)
                if "clv_metrics" not in opp:
                    opp["clv_metrics"] = {
                        "clv_estimate": opp.get("clvPercent"),
                        "market_efficiency": 0.85,
                    }

            normalized.append(opp)

        shaped = normalized

        if include_clv_effective:
            _last_computation_succeeded = not enrichment_failed
            _last_returned_with_clv = not enrichment_failed
        else:
            _last_computation_succeeded = False
            _last_returned_with_clv = False

    try:
        if "clv_diagnostics" not in resp_with_meta:
            resp_with_meta["clv_diagnostics"] = clv_diag_info
        if "window_size" not in resp_with_meta["clv_diagnostics"]:
            resp_with_meta["clv_diagnostics"]["window_size"] = clv_diag_info.get(
                "window_size"
            )
    except Exception:
        pass

    return canonical_success(resp_with_meta, meta=meta)


@router.post("/api/testing/propfinder/seed")
async def shim_seed_fixture(request: Request):
    global _TEST_FIXTURE
    try:
        body = await request.json()
    except Exception:
        body = {}

    data = body.get("data") if isinstance(body, dict) and "data" in body else body
    if isinstance(data, dict) and isinstance(data.get("opportunities"), list):
        _TEST_FIXTURE = {
            "opportunities": data.get("opportunities"),
            "meta": data.get("meta"),
        }
        return canonical_success(
            {"seeded": True, "count": len(_TEST_FIXTURE["opportunities"])}
        )

    if isinstance(body, list):
        _TEST_FIXTURE = {"opportunities": body}
        return canonical_success({"seeded": True, "count": len(body)})

    return canonical_success({"seeded": False, "reason": "invalid_fixture"})


@router.get("/api/propfinder/opportunities/{opportunity_id}")
async def shim_propfinder_opportunity_detail(
    opportunity_id: str, fields: Optional[str] = None
):
    try:
        if str(opportunity_id) == "metrics-summary":
            try:
                from backend.services.unified_config import unified_config

                cfg = unified_config.get_config()
                enabled = bool(cfg.performance.enable_clv_metrics)
                reason = "enabled" if enabled else "disabled_by_flag"
            except Exception:
                enabled = False
                reason = "unavailable"

            payload = {
                "counters": {},
                "recent_opportunities": 0,
                "summary": {},
                "enabled": enabled,
                "reason": reason,
                "success_rate": None,
                "failure_rate": None,
                "avg_latency_ms": None,
                "processed_total": 0,
                "window_size": 0,
                "prometheus_available": False,
                "metrics_available": False,
            }
            return canonical_success(payload)
        if str(opportunity_id) == "diagnostics":
            try:
                from backend.services.unified_config import unified_config

                cfg = unified_config.get_config()
                enabled = bool(getattr(cfg.performance, "enable_clv_metrics", False))
            except Exception:
                enabled = True

            diag_payload = {
                "clv_system_enabled": bool(enabled),
                "metrics_available": True,
                "timestamp": datetime.now(timezone.utc)
                .isoformat()
                .replace("+00:00", "Z"),
                "enrichment_stats": {
                    "total_requests": 0,
                    "successful_enrichments": 0,
                    "failed_enrichments": 0,
                },
                "cache_stats": {"cache_hits": 0, "cache_misses": 0},
                "system_health": {
                    "prometheus_available": False,
                    "metrics_collected": False,
                },
            }
            return canonical_success(diag_payload)
    except Exception:
        pass
    items: List[Dict[str, Any]] = []
    fixture = _get_test_fixture()
    if fixture and isinstance(fixture.get("opportunities"), list):
        items = fixture.get("opportunities")
    else:
        items = [
            {
                "id": "s1",
                "player": "P1",
                "confidence": 72.0,
                "sport": "NBA",
                "market": "POINTS",
                "line": 2.0,
                "odds": 110,
            },
            {
                "id": "s2",
                "player": "P2",
                "confidence": 75.0,
                "sport": "NBA",
                "market": "POINTS",
                "line": 2.0,
                "odds": 110,
            },
        ]

    for it in items:
        if str(it.get("id")) == str(opportunity_id):
            return canonical_success({"opportunity": it})

    return canonical_success({"opportunity": None, "found": False})


@router.get("/api/propfinder/clv-status")
async def shim_clv_status():
    global _last_requested_epoch, _last_opportunity_count, _last_include_param
    last_iso = None
    try:
        if _last_requested_epoch:
            last_iso = (
                datetime.fromtimestamp(_last_requested_epoch, timezone.utc)
                .isoformat()
                .replace("+00:00", "Z")
            )
    except Exception:
        last_iso = None

    payload = {
        "status": "pending",
        "lastRequestedEpoch": int(_last_requested_epoch or 0),
        "lastOpportunityCount": int(_last_opportunity_count or 0),
        "lastIncludeParam": bool(_last_include_param),
        "lastRequestedIso": last_iso,
        "lastFeatureFlagEnabled": bool(_last_feature_flag_enabled),
        "lastComputationSucceeded": bool(_last_computation_succeeded),
        "lastReturnedWithCLV": bool(_last_returned_with_clv),
        "lastError": _last_error,
    }

    return canonical_success(payload)


@router.get("/api/testing/propfinder/seed_status")
async def shim_seed_status():
    try:
        seeded = _get_test_fixture() is not None
    except Exception:
        seeded = False
    return canonical_success({"seeded": bool(seeded)})


@router.get("/api/testing/ready")
async def shim_ready():
    try:
        return canonical_success({"ready": True})
    except Exception:
        return {"success": True, "data": {"ready": True}, "error": None}


@router.post("/api/v2/ml/predict")
async def shim_ml_predict(request: Request):
    try:
        body = await request.json()
    except (ValueError, json.JSONDecodeError):
        body = {}
    preds = [
        {"model": (body.get("models") or ["test-model"])[0], "score": 0.5, "ev": 0.1}
    ]
    return canonical_success(
        {
            "predictions": preds,
            "metadata": {"request_id": body.get("request_id")},
        }
    )
