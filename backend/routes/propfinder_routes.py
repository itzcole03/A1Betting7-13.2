"""Canonical PropFinder API routes and helpers.

This module wires the PropFinder feature router into the FastAPI
application. It exposes the primary ``/api/propfinder`` endpoints,
legacy compatibility handlers, in-memory cache helpers that the test
suite patches, and the lightweight CLV enrichment adapter referenced by
multiple test fixtures.
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import time
from dataclasses import asdict, is_dataclass
from datetime import datetime, timezone
from typing import Any, Dict, Iterable, List, Optional, Sequence, Tuple

from fastapi import APIRouter, Depends, Query, Request, Response, status
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

# Avoid importing backend.core.app at module import time to prevent a
# circular import: core.app may attempt to import this module when the
# canonical app is being created. Provide lazy wrappers for `ok` and
# `fail` that import the real implementations on first use. This keeps
# module import cheap and allows tests to monkeypatch hashing/ETag
# helpers before request handlers run.


def _lazy_ok(data=None, message: Optional[str] = None):
    try:
        from backend.core.app import ok as _impl_ok

        return _impl_ok(data, message)
    except Exception:
        # Fallback minimal envelope
        resp = {"success": True, "data": data, "error": None}
        if message:
            resp["message"] = message
        return resp


def _lazy_fail(
    error_code: str = "ERROR", message: str = "An error occurred", data=None
):
    try:
        from backend.core.app import fail as _impl_fail

        return _impl_fail(error_code, message, data)
    except Exception:
        return {
            "success": False,
            "data": data,
            "error": {"code": error_code, "message": message},
        }


# Expose `ok` and `fail` names used throughout this module but ensure they
# are evaluated lazily at call time to avoid circular import problems.
ok = _lazy_ok
fail = _lazy_fail

# Defer importing the core app to runtime to avoid circular import issues.
# We'll import `backend.core.app` inside functions that need it.
core_app = None

from backend.services.bookmark_service import BookmarkService, get_bookmark_service
from backend.services.simple_propfinder_service import get_simple_propfinder_service

try:  # Optional rich data service
    from backend.services.propfinder_data_service import (
        PropFinderDataService,
        get_propfinder_data_service,
    )
except Exception:  # pragma: no cover - optional dependency
    PropFinderDataService = None  # type: ignore
    get_propfinder_data_service = None  # type: ignore

try:
    from backend.services import clv_metrics
except Exception:  # pragma: no cover - optional dependency
    clv_metrics = None  # type: ignore

try:
    from backend.services.unified_cache_service import get_cache as get_unified_cache
except Exception:  # pragma: no cover - optional dependency
    get_unified_cache = None  # type: ignore

try:
    from backend.middleware.caching_middleware import ETagger
except Exception:  # pragma: no cover - fallback hashing

    class _FallbackETagger:
        @staticmethod
        def generate_etag(payload: Any) -> str:
            import hashlib

            dumped = json.dumps(payload, sort_keys=True, default=str).encode("utf-8")
            return hashlib.sha1(dumped).hexdigest()

    ETagger = _FallbackETagger  # type: ignore


logger = logging.getLogger(__name__)

router = APIRouter(tags=["PropFinder"])
legacy_router = APIRouter(prefix="/api/props", tags=["PropFinder-Legacy"])

__pf_cache_store: Dict[str, Dict[str, Any]] = {}
_DEBUG_STATE: Dict[str, Any] = {
    "enabled": False,
    "path": os.path.join(os.getcwd(), "tmp_propfinder_last_payload.json"),
}


class BookmarkPayload(BaseModel):
    """Request body for bookmark toggle."""

    prop_id: str = Field(..., alias="prop_id")
    sport: str
    player: str
    market: str
    team: str
    bookmarked: bool = True

    class Config:
        allow_population_by_field_name = True


class DebugTogglePayload(BaseModel):
    """Payload that enables or disables PropFinder debug persistence."""

    enabled: Optional[bool] = True
    path: Optional[str] = None


def _now_utc_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _split_csv(value: Optional[str]) -> Optional[List[str]]:
    if not value:
        return None
    if isinstance(value, (list, tuple)):
        return [str(v).strip() for v in value if str(v).strip()]
    parts = [segment.strip() for segment in str(value).split(",")]
    filtered = [p for p in parts if p]
    return filtered or None


def _coerce_bool(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if value is None:
        return False
    if isinstance(value, (int, float)):
        return value != 0
    return str(value).strip().lower() in {"1", "true", "yes", "on"}


def _build_cache_key(prefix: str, params: Dict[str, Any]) -> str:
    try:
        payload = json.dumps(params, sort_keys=True, default=str)
    except TypeError:
        safe_params = {k: str(v) for k, v in params.items()}
        payload = json.dumps(safe_params, sort_keys=True)
    return f"propfinder:{prefix}:{payload}"


def _ensure_validation_field(opportunity: Dict[str, Any]) -> None:
    if opportunity.get("validationWarnings") is None:
        opportunity["validationWarnings"] = []
    if "validationWarnings" not in opportunity:
        fallback = opportunity.get("validation_warnings") or []
        opportunity["validationWarnings"] = fallback


def _unwrap_opportunity(candidate: Any) -> Optional[Dict[str, Any]]:
    """Normalize opportunity wrappers and return a flat dict."""

    if candidate is None:
        return None

    if is_dataclass(candidate):
        candidate = asdict(candidate)
    elif hasattr(candidate, "model_dump") and callable(
        getattr(candidate, "model_dump")
    ):
        try:
            candidate = candidate.model_dump()
        except Exception:
            candidate = candidate
    elif hasattr(candidate, "dict") and callable(getattr(candidate, "dict")):
        try:
            candidate = candidate.dict()
        except Exception:
            candidate = candidate

    if not isinstance(candidate, dict):
        try:
            candidate = jsonable_encoder(candidate)
        except Exception:
            return None

    if not isinstance(candidate, dict):
        return None

    if candidate.get("found") is False and not candidate.get("opportunity"):
        return None

    if "opportunity" in candidate and isinstance(candidate["opportunity"], dict):
        nested = candidate["opportunity"]
        if not isinstance(nested, dict):
            try:
                nested = jsonable_encoder(nested)
            except Exception:
                nested = None
        if not isinstance(nested, dict):
            return None
        merged = dict(nested)
        # Preserve useful fields from the wrapper when missing in the nested payload
        for key in ("id", "sport", "player", "market", "team", "isBookmarked"):
            if key not in merged and key in candidate:
                merged[key] = candidate[key]
        candidate = merged

    if candidate.get("id") is None:
        alt_id = candidate.get("prop_id") or candidate.get("opportunity_id")
        if alt_id is not None:
            candidate["id"] = alt_id

    if candidate.get("id") is None:
        return None

    _ensure_validation_field(candidate)
    return candidate


def _normalize_opportunity(raw: Any, *, is_bookmarked: bool = False) -> Dict[str, Any]:
    data: Any = raw
    try:
        if is_dataclass(raw):
            data = asdict(raw)
    except Exception:
        data = raw

    try:
        encoded = jsonable_encoder(data)
        if isinstance(encoded, dict):
            opportunity = encoded
        else:
            opportunity = {"value": encoded}
    except Exception:
        opportunity = data if isinstance(data, dict) else {"value": data}

    if is_bookmarked:
        opportunity["isBookmarked"] = True
    else:
        opportunity["isBookmarked"] = bool(opportunity.get("isBookmarked"))

    if opportunity.get("bookmakers") is None:
        opportunity["bookmakers"] = []

    _ensure_validation_field(opportunity)
    return opportunity


def _build_summary(opportunities: Sequence[Dict[str, Any]]) -> Dict[str, Any]:
    total = len(opportunities)
    if not total:
        return {
            "total_opportunities": 0,
            "avg_confidence": 0.0,
            "max_edge": 0.0,
            "alert_triggered_count": 0,
            "sharp_heavy_count": 0,
            "sports_breakdown": {},
            "markets_breakdown": {},
        }

    def _to_float(value: Any, default: float = 0.0) -> float:
        try:
            return float(value)
        except Exception:
            return default

    sport_counts: Dict[str, int] = {}
    market_counts: Dict[str, int] = {}
    alert_count = 0
    sharp_heavy = 0
    confidences: List[float] = []
    edges: List[float] = []

    for opp in opportunities:
        sport = str(opp.get("sport") or "").upper()
        if sport:
            sport_counts[sport] = sport_counts.get(sport, 0) + 1

        market = str(opp.get("market") or "").upper()
        if market:
            market_counts[market] = market_counts.get(market, 0) + 1

        if opp.get("alertTriggered"):
            alert_count += 1

        if str(opp.get("sharpMoney") or "").lower() == "heavy":
            sharp_heavy += 1

        confidences.append(_to_float(opp.get("confidence")))
        edges.append(_to_float(opp.get("edge")))

    avg_confidence = sum(confidences) / total if confidences else 0.0
    max_edge = max(edges) if edges else 0.0

    return {
        "total_opportunities": total,
        "avg_confidence": round(avg_confidence, 2),
        "max_edge": round(max_edge, 2),
        "alert_triggered_count": alert_count,
        "sharp_heavy_count": sharp_heavy,
        "sports_breakdown": sport_counts,
        "markets_breakdown": market_counts,
    }


def _update_clv_runtime_status(
    include_clv: bool,
    clv_enabled: bool,
    clv_succeeded: bool,
    returned_with_clv: bool,
    opportunity_count: int,
    error: Optional[str] = None,
) -> None:
    try:
        # Import lazily to avoid circular import at module load time
        from backend.core import app as core_app_local

        snap = getattr(core_app_local, "_clv_runtime_status", None)
        if not isinstance(snap, dict):
            return

        epoch = time.time()
        iso_value = (
            datetime.fromtimestamp(epoch, tz=timezone.utc)
            .isoformat()
            .replace("+00:00", "Z")
        )

        status_value = (
            "ready" if clv_enabled and clv_succeeded else snap.get("status", "pending")
        )
        if clv_enabled and not clv_succeeded:
            status_value = "degraded"

        snap["status"] = status_value
        snap["lastRequestedEpoch"] = epoch
        snap["lastRequestedIso"] = iso_value
        snap["lastIncludeParam"] = bool(include_clv)
        snap["lastFeatureFlagEnabled"] = bool(clv_enabled)
        snap["lastComputationSucceeded"] = bool(clv_succeeded)
        snap["lastReturnedWithCLV"] = bool(returned_with_clv)
        snap["lastOpportunityCount"] = int(opportunity_count)
        snap["lastError"] = error
    except Exception:  # pragma: no cover - defensive logging only
        logger.debug("Failed to update CLV runtime status", exc_info=True)


def _get_clv_metrics_snapshot() -> Dict[str, Any]:
    if clv_metrics is None:
        return {
            "enabled": False,
            "reason": "metrics_unavailable",
            "metrics_available": False,
        }

    try:
        snapshot = clv_metrics.get_snapshot()  # type: ignore[attr-defined]
        if isinstance(snapshot, dict):
            return snapshot
    except Exception:
        logger.debug("CLV metrics facade snapshot failed", exc_info=True)

    try:
        service = clv_metrics.get_metrics_service()  # type: ignore[attr-defined]
        if service:
            snapshot = service.get_snapshot()
            if isinstance(snapshot, dict):
                return snapshot
    except Exception:
        logger.debug("CLV metrics service snapshot failed", exc_info=True)

    return {
        "enabled": False,
        "reason": "metrics_unavailable",
        "metrics_available": False,
    }


def _maybe_write_debug_dump(payload: Dict[str, Any]) -> None:
    if not _DEBUG_STATE.get("enabled"):
        return

    path = _DEBUG_STATE.get("path") or os.path.join(
        os.getcwd(), "tmp_propfinder_last_payload.json"
    )
    try:
        with open(path, "w", encoding="utf-8") as handle:
            json.dump(payload, handle, default=str, indent=2)
    except Exception:  # pragma: no cover - debug only
        logger.debug("Unable to persist PropFinder debug payload", exc_info=True)


def _cache_set(key: str, payload: Any, ttl: float = 60.0) -> Optional[str]:
    try:
        etag = ETagger.generate_etag(payload)
    except Exception:  # pragma: no cover - fallback hashing
        try:
            import hashlib

            dumped = json.dumps(payload, sort_keys=True, default=str).encode("utf-8")
            etag = hashlib.sha1(dumped).hexdigest()
        except Exception:
            return None

    expires_at = time.time() + float(max(ttl, 0.0))
    __pf_cache_store[key] = {
        "etag": etag,
        "payload": payload,
        "expires_at": expires_at,
    }
    return etag


def _cache_get(key: str) -> Optional[Dict[str, Any]]:
    entry = __pf_cache_store.get(key)
    if not entry:
        return None
    if entry.get("expires_at", 0.0) < time.time():
        __pf_cache_store.pop(key, None)
        return None
    return {"etag": entry.get("etag"), "payload": entry.get("payload")}


def _resolve_propfinder_service(force_simple: bool | None = None) -> Any:
    mode = os.getenv("PROPFINDER_SERVICE_MODE", "").strip().lower()
    testing = os.getenv("TESTING", "").lower() in {"1", "true", "yes", "on"}
    lean_mode = os.getenv("APP_DEV_LEAN_MODE", "").lower() in {"1", "true", "yes", "on"}

    if force_simple or mode in {"simple", "mock", "compat"} or testing or lean_mode:
        return get_simple_propfinder_service()

    if mode in {"data", "real"} and get_propfinder_data_service is not None:
        try:
            return get_propfinder_data_service()
        except Exception:
            logger.warning(
                "PropFinderDataService unavailable, falling back to simple service",
                exc_info=True,
            )
            return get_simple_propfinder_service()

    if get_propfinder_data_service is not None:
        try:
            return get_propfinder_data_service()
        except Exception:
            logger.debug(
                "PropFinderDataService resolution failed, using simple service",
                exc_info=True,
            )

    return get_simple_propfinder_service()


def _dependency_resolve_service() -> Any:
    return _resolve_propfinder_service()


async def _store_unified_cache(cache_key: str, payload: Any, ttl: int = 60) -> None:
    if get_unified_cache is None:
        return
    try:
        cache = await get_unified_cache()
        if cache is None:
            return
        set_fn = getattr(cache, "set", None)
        if set_fn is None:
            return
        result = set_fn(cache_key, payload, ttl=ttl)
        if asyncio.iscoroutine(result):
            await result
    except Exception:
        logger.debug("Unified cache set failed for %s", cache_key, exc_info=True)


def _detect_clv_presence(opportunities: Sequence[Dict[str, Any]]) -> bool:
    for opp in opportunities:
        if opp.get("clv_metrics") is not None:
            return True
        if opp.get("clvPercent") is not None:
            return True
        if opp.get("closingLine") is not None or opp.get("closingOdds") is not None:
            return True
    return False


def _apply_bookmark_state(
    opportunities: List[Dict[str, Any]],
    bookmarked_ids: Iterable[str],
    bookmarked_only: bool,
) -> List[Dict[str, Any]]:
    bookmarked_set = {str(bid) for bid in bookmarked_ids if bid is not None}
    result: List[Dict[str, Any]] = []
    for opp in opportunities:
        opp_id = str(opp.get("id")) if opp.get("id") is not None else None
        if opp_id in bookmarked_set:
            opp["isBookmarked"] = True
        elif bookmarked_only:
            continue
        result.append(opp)
    return result


def _truncate_for_compact(opportunities: List[Dict[str, Any]]) -> None:
    compact_fields = {
        "id",
        "player",
        "team",
        "opponent",
        "sport",
        "market",
        "line",
        "odds",
        "confidence",
        "edge",
        "impliedProbability",
        "aiProbability",
        "timeToGame",
        "isBookmarked",
        "alertTriggered",
        "sharpMoney",
        "validationWarnings",
    }
    for opp in opportunities:
        for key in list(opp.keys()):
            if key not in compact_fields:
                opp.pop(key, None)


def _apply_filters(
    opportunities: List[Dict[str, Any]],
    *,
    sport_filter: Optional[List[str]],
    confidence_range: Optional[Tuple[Optional[float], Optional[float]]],
    edge_range: Optional[Tuple[Optional[float], Optional[float]]],
    markets_filter: Optional[List[str]],
    venues_filter: Optional[List[str]],
    sharp_filter: Optional[List[str]],
    alert_triggered_only: bool,
    search: Optional[str],
) -> List[Dict[str, Any]]:
    sport_set = {s.upper() for s in sport_filter} if sport_filter else None
    market_set = {m.upper() for m in markets_filter} if markets_filter else None
    venue_set = {v.upper() for v in venues_filter} if venues_filter else None
    sharp_set = {s.lower() for s in sharp_filter} if sharp_filter else None
    search_lower = (search or "").lower()

    def _to_float(value: Any, default: float = 0.0) -> float:
        try:
            return float(value)
        except Exception:
            return default

    filtered: List[Dict[str, Any]] = []
    for opp in opportunities:
        sport_value = str(opp.get("sport") or "").upper()
        if sport_set and sport_value not in sport_set:
            continue

        market_value = str(opp.get("market") or "").upper()
        if market_set and market_value not in market_set:
            continue

        venue_value = str(opp.get("venue") or "").upper()
        if venue_set and venue_value not in venue_set:
            continue

        sharp_value = str(opp.get("sharpMoney") or "").lower()
        if sharp_set and sharp_value not in sharp_set:
            continue

        if alert_triggered_only and not opp.get("alertTriggered"):
            continue

        if confidence_range:
            lo, hi = confidence_range
            conf = _to_float(opp.get("confidence"))
            if lo is not None and conf < float(lo):
                continue
            if hi is not None and conf > float(hi):
                continue

        if edge_range:
            lo, hi = edge_range
            edge_val = _to_float(opp.get("edge"))
            if lo is not None and edge_val < float(lo):
                continue
            if hi is not None and edge_val > float(hi):
                continue

        if search_lower:
            haystack = " ".join(
                str(opp.get(field) or "")
                for field in ("player", "team", "opponent", "market")
            ).lower()
            if search_lower not in haystack:
                continue

        filtered.append(opp)

    return filtered


async def _fetch_opportunities(
    data_service: Any,
    *,
    sport_filter: Optional[List[str]],
    confidence_range: Optional[Tuple[Optional[float], Optional[float]]],
    edge_range: Optional[Tuple[Optional[float], Optional[float]]],
    limit: int,
    force_flat_baseline: bool,
    include_diagnostics: bool,
    search: Optional[str],
) -> Tuple[List[Dict[str, Any]], Dict[str, Any], Dict[str, Any]]:
    try:
        initializer = getattr(data_service, "_initialize_services", None)
        if initializer:
            maybe = initializer()
            if asyncio.iscoroutine(maybe):
                await maybe
    except Exception:
        logger.debug("PropFinder service initialization failed", exc_info=True)

    opportunities: List[Dict[str, Any]] = []
    summary: Dict[str, Any] = {}
    meta: Dict[str, Any] = {}

    try:
        if hasattr(data_service, "get_prop_opportunities"):
            result = data_service.get_prop_opportunities(
                sport_filter=sport_filter,
                confidence_range=confidence_range,
                edge_range=edge_range,
                limit=limit,
                force_flat_baseline=force_flat_baseline,
                include_diagnostics=include_diagnostics,
            )
            raw_items = await result if asyncio.iscoroutine(result) else result
            opportunities = [_normalize_opportunity(item) for item in (raw_items or [])]
            summary = _build_summary(opportunities)
        elif hasattr(data_service, "get_opportunities"):
            filters = {
                "sports": sport_filter,
                "confidence_min": confidence_range[0] if confidence_range else None,
                "confidence_max": confidence_range[1] if confidence_range else None,
                "edge_min": edge_range[0] if edge_range else None,
                "edge_max": edge_range[1] if edge_range else None,
                "search": search,
                "limit": limit,
                "force_flat_baseline": force_flat_baseline,
            }
            result = data_service.get_opportunities(filters=filters)
            raw_result = await result if asyncio.iscoroutine(result) else result
            if isinstance(raw_result, dict):
                raw_opps = raw_result.get("opportunities") or []
                opportunities = [_normalize_opportunity(item) for item in raw_opps]
                summary = raw_result.get("summary") or _build_summary(opportunities)
                meta = raw_result.get("meta") or {}
            else:
                opportunities = []
                summary = _build_summary(opportunities)
        else:
            opportunities = []
            summary = _build_summary(opportunities)
    except Exception:
        logger.exception("PropFinder data service error")
        opportunities = []
        summary = _build_summary(opportunities)

    return opportunities, summary, meta


async def _find_opportunity_by_id(
    opportunity_id: str,
    data_service: Any,
    bookmark_service: BookmarkService,
    user_id: Optional[str],
) -> Optional[Dict[str, Any]]:
    opportunities, _, _ = await _fetch_opportunities(
        data_service,
        sport_filter=None,
        confidence_range=None,
        edge_range=None,
        limit=500,
        force_flat_baseline=False,
        include_diagnostics=False,
        search=None,
    )

    bookmarked_ids: Iterable[str] = []
    if user_id:
        try:
            bookmarked_ids = await bookmark_service.get_user_bookmarked_prop_ids(
                user_id
            )
        except Exception:
            bookmarked_ids = []

    bookmarked_lookup = {str(bid) for bid in bookmarked_ids}
    for opp in opportunities:
        candidate = _unwrap_opportunity(opp)
        if not candidate:
            continue

        if str(candidate.get("id")) == str(opportunity_id):
            if str(candidate.get("id")) in bookmarked_lookup:
                candidate["isBookmarked"] = True
            return candidate
    return None


async def _handle_prop_opportunities(
    *,
    request: Optional[Request],
    data_service: Any,
    bookmark_service: BookmarkService,
    sports: Optional[str],
    confidence_min: Optional[float],
    confidence_max: Optional[float],
    edge_min: Optional[float],
    edge_max: Optional[float],
    markets: Optional[str],
    venues: Optional[str],
    sharp_money: Optional[str],
    bookmarked_only: bool,
    alert_triggered_only: bool,
    force_flat_baseline: bool,
    diagnostics: bool,
    include_clv: bool,
    clv_diag: Optional[int],
    user_id: Optional[str],
    limit: int,
    search: Optional[str],
    fields: Optional[str],
    legacy_mode: bool,
) -> Response:
    sport_filter = _split_csv(sports)
    markets_filter = _split_csv(markets)
    venues_filter = _split_csv(venues)
    sharp_filter = _split_csv(sharp_money)
    confidence_range = (
        (confidence_min, confidence_max)
        if confidence_min is not None or confidence_max is not None
        else None
    )
    edge_range = (
        (edge_min, edge_max) if edge_min is not None or edge_max is not None else None
    )
    compact_mode = bool(
        fields and "compact" in [f.strip().lower() for f in fields.split(",")]
    )
    clv_diag_requested = _coerce_bool(clv_diag)

    cache_params = {
        "sports": sport_filter,
        "confidence_min": confidence_min,
        "confidence_max": confidence_max,
        "edge_min": edge_min,
        "edge_max": edge_max,
        "markets": markets_filter,
        "venues": venues_filter,
        "sharp_money": sharp_filter,
        "bookmarked_only": bookmarked_only,
        "alert_triggered_only": alert_triggered_only,
        "force_flat_baseline": force_flat_baseline,
        "diagnostics": diagnostics,
        "include_clv": include_clv,
        "clv_diag": clv_diag_requested,
        "user_id": user_id,
        "limit": limit,
        "search": search,
        "fields": fields,
        "legacy": legacy_mode,
    }
    cache_key = _build_cache_key("opportunities", cache_params)
    # First, attempt to consult the unified cache service if available.
    # Tests monkeypatch `backend.services.unified_cache_service.get_cache`.
    cached = None
    try:
        import importlib

        unified_mod = importlib.import_module("backend.services.unified_cache_service")
        get_cache_fn = getattr(unified_mod, "get_cache", None)
        if get_cache_fn:
            maybe_cache = get_cache_fn()
            cache_inst = (
                await maybe_cache if asyncio.iscoroutine(maybe_cache) else maybe_cache
            )
            if cache_inst:
                get_fn = getattr(cache_inst, "get", None)
                if callable(get_fn):
                    maybe = get_fn(cache_key)
                    result = await maybe if asyncio.iscoroutine(maybe) else maybe
                    if isinstance(result, dict) and (
                        "etag" in result or "payload" in result
                    ):
                        cached = {
                            "etag": result.get("etag"),
                            "payload": result.get("payload"),
                        }
    except Exception:
        # If unified cache is unavailable or fails, fall back to local in-memory cache
        cached = None

    if cached is None:
        cached = _cache_get(cache_key)
    incoming_etag = None
    if request is not None:
        try:
            incoming_etag = request.headers.get("if-none-match")
        except Exception:
            incoming_etag = None

    if cached and incoming_etag:
        cached_etag = cached.get("etag")
        if cached_etag and incoming_etag.strip('"') == str(cached_etag).strip('"'):
            payload = cached.get("payload")
            if isinstance(payload, dict):
                data_block = payload.get("data") or {}
                opportunities_block = data_block.get("opportunities") or []
                diagnostics_block = data_block.get("meta", {}).get(
                    "clv_diagnostics", {}
                )
                _update_clv_runtime_status(
                    include_clv=include_clv,
                    clv_enabled=bool(diagnostics_block.get("enabled")),
                    clv_succeeded=bool(diagnostics_block.get("processed_total")),
                    returned_with_clv=_detect_clv_presence(opportunities_block),
                    opportunity_count=(
                        len(opportunities_block)
                        if isinstance(opportunities_block, list)
                        else 0
                    ),
                )
            resp = Response(status_code=status.HTTP_304_NOT_MODIFIED)
            resp.headers["ETag"] = str(cached_etag)
            return resp

    if cached:
        payload = cached.get("payload")
        if isinstance(payload, dict):
            data_block = payload.get("data") or {}
            diagnostics_block = data_block.get("meta", {}).get("clv_diagnostics", {})
            opportunities_block = data_block.get("opportunities") or []
            _update_clv_runtime_status(
                include_clv=include_clv,
                clv_enabled=bool(diagnostics_block.get("enabled")),
                clv_succeeded=bool(diagnostics_block.get("processed_total")),
                returned_with_clv=_detect_clv_presence(opportunities_block),
                opportunity_count=(
                    len(opportunities_block)
                    if isinstance(opportunities_block, list)
                    else 0
                ),
            )
            resp = JSONResponse(payload)
            cached_etag = cached.get("etag")
            if cached_etag:
                resp.headers["ETag"] = str(cached_etag)
            resp.headers["Cache-Control"] = "private, max-age=30"
            return resp

    opportunities, service_summary, service_meta = await _fetch_opportunities(
        data_service,
        sport_filter=sport_filter,
        confidence_range=confidence_range,
        edge_range=edge_range,
        limit=limit,
        force_flat_baseline=force_flat_baseline,
        include_diagnostics=diagnostics or clv_diag_requested,
        search=search,
    )

    filtered = _apply_filters(
        opportunities,
        sport_filter=sport_filter,
        confidence_range=confidence_range,
        edge_range=edge_range,
        markets_filter=markets_filter,
        venues_filter=venues_filter,
        sharp_filter=sharp_filter,
        alert_triggered_only=alert_triggered_only,
        search=search,
    )

    bookmarked_ids: Iterable[str] = []
    if user_id:
        try:
            bookmarked_ids = await bookmark_service.get_user_bookmarked_prop_ids(
                user_id
            )
        except Exception:
            bookmarked_ids = []

    filtered = _apply_bookmark_state(filtered, bookmarked_ids, bookmarked_only)

    if compact_mode:
        _truncate_for_compact(filtered)

    limited = filtered[:limit]
    summary = _build_summary(limited)

    clv_enabled = False
    clv_succeeded = False
    metrics_service = None
    if include_clv and limited:
        if clv_metrics is not None:
            try:
                metrics_service = clv_metrics.get_metrics_service()  # type: ignore[attr-defined]
            except Exception:
                metrics_service = None
        start = time.perf_counter()
        try:
            clv_enabled, clv_succeeded = await _run_clv_compute(limited, data_service)
        except Exception:
            clv_enabled = False
            clv_succeeded = False
            logger.debug("CLV enrichment failed", exc_info=True)
        duration_ms = (time.perf_counter() - start) * 1000
        if metrics_service is not None:
            try:
                if clv_succeeded:
                    metrics_service.record_success(duration_ms)
                    metrics_service.record_batch(len(limited), duration_ms)
                else:
                    metrics_service.record_failure(duration_ms)
            except Exception:
                logger.debug("CLV metrics instrumentation failed", exc_info=True)

    returned_with_clv = _detect_clv_presence(limited)

    include_diagnostics_block = diagnostics or clv_diag_requested or include_clv
    clv_diagnostics = (
        _get_clv_metrics_snapshot()
        if include_diagnostics_block
        else {
            "enabled": clv_enabled,
            "reason": "diagnostics_disabled",
            "metrics_available": False,
        }
    )

    meta: Dict[str, Any] = {
        "generated_at": _now_utc_iso(),
        "limit": limit,
        "returned": len(limited),
        "clv_requested": bool(include_clv),
        "diagnostics_requested": include_diagnostics_block,
        "fields": "compact" if compact_mode else None,
        "force_flat_baseline": force_flat_baseline,
        "clv_diagnostics": clv_diagnostics,
    }

    if service_meta:
        for key, value in service_meta.items():
            meta.setdefault(key, value)

    meta = {k: v for k, v in meta.items() if v is not None}

    data_payload: Dict[str, Any] = {
        "opportunities": limited,
        "total": len(filtered),
        "filtered": len(limited),
        "summary": summary or service_summary or _build_summary(limited),
        "meta": meta,
    }

    if force_flat_baseline:
        data_payload["_force_flat_baseline"] = True

    _maybe_write_debug_dump(data_payload)

    envelope = ok(data_payload)
    etag = _cache_set(cache_key, envelope)
    asyncio.create_task(_store_unified_cache(cache_key, envelope, ttl=45))

    _update_clv_runtime_status(
        include_clv=include_clv,
        clv_enabled=clv_enabled,
        clv_succeeded=clv_succeeded,
        returned_with_clv=returned_with_clv,
        opportunity_count=len(limited),
        error=None,
    )

    response_obj = JSONResponse(envelope)
    if etag:
        response_obj.headers["ETag"] = str(etag)
    response_obj.headers["Cache-Control"] = "private, max-age=30"
    return response_obj


@router.get("/opportunities")
async def get_prop_opportunities(
    request: Request,
    sports: Optional[str] = Query(None, description="Comma-separated list of sports"),
    sport: Optional[str] = Query(None, description="Single sport filter alias"),
    confidence_min: Optional[float] = Query(None, ge=0, le=100),
    confidence_max: Optional[float] = Query(None, ge=0, le=100),
    edge_min: Optional[float] = Query(None, ge=0),
    edge_max: Optional[float] = Query(None, ge=0),
    markets: Optional[str] = Query(None),
    venues: Optional[str] = Query(None),
    sharp_money: Optional[str] = Query(None),
    bookmarked_only: bool = Query(False),
    alert_triggered_only: bool = Query(False),
    force_flat_baseline: bool = Query(False),
    diagnostics: bool = Query(False),
    include_clv: bool = Query(False),
    clv_diag: Optional[int] = Query(None),
    user_id: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=500),
    search: Optional[str] = Query(None),
    fields: Optional[str] = Query(None),
    data_service: Any = Depends(_dependency_resolve_service),
    bookmark_service: BookmarkService = Depends(get_bookmark_service),
):
    combined_sports = sports or sport

    return await _handle_prop_opportunities(
        request=request,
        data_service=data_service,
        bookmark_service=bookmark_service,
        sports=combined_sports,
        confidence_min=confidence_min,
        confidence_max=confidence_max,
        edge_min=edge_min,
        edge_max=edge_max,
        markets=markets,
        venues=venues,
        sharp_money=sharp_money,
        bookmarked_only=bookmarked_only,
        alert_triggered_only=alert_triggered_only,
        force_flat_baseline=force_flat_baseline,
        diagnostics=diagnostics,
        include_clv=include_clv,
        clv_diag=clv_diag,
        user_id=user_id,
        limit=limit,
        search=search,
        fields=fields,
        legacy_mode=False,
    )


@legacy_router.get("")
async def legacy_props(
    request: Request,
    sports: Optional[str] = Query(None),
    sport: Optional[str] = Query(None, description="Single sport filter alias"),
    confidence_min: Optional[float] = Query(None, ge=0, le=100),
    confidence_max: Optional[float] = Query(None, ge=0, le=100),
    edge_min: Optional[float] = Query(None, ge=0),
    edge_max: Optional[float] = Query(None, ge=0),
    markets: Optional[str] = Query(None),
    venues: Optional[str] = Query(None),
    sharp_money: Optional[str] = Query(None),
    bookmarked_only: bool = Query(False),
    alert_triggered_only: bool = Query(False),
    include_clv: bool = Query(False),
    clv_diag: Optional[int] = Query(None),
    user_id: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=500),
    search: Optional[str] = Query(None),
    data_service: Any = Depends(_dependency_resolve_service),
    bookmark_service: BookmarkService = Depends(get_bookmark_service),
):
    combined_sports = sports or sport

    return await _handle_prop_opportunities(
        request=request,
        data_service=data_service,
        bookmark_service=bookmark_service,
        sports=combined_sports,
        confidence_min=confidence_min,
        confidence_max=confidence_max,
        edge_min=edge_min,
        edge_max=edge_max,
        markets=markets,
        venues=venues,
        sharp_money=sharp_money,
        bookmarked_only=bookmarked_only,
        alert_triggered_only=alert_triggered_only,
        force_flat_baseline=False,
        diagnostics=False,
        include_clv=include_clv,
        clv_diag=clv_diag,
        user_id=user_id,
        limit=limit,
        search=search,
        fields=None,
        legacy_mode=True,
    )


@router.get("/opportunities/{opportunity_id}")
async def get_opportunity_detail(
    opportunity_id: str,
    user_id: Optional[str] = Query(None),
    data_service: Any = Depends(_dependency_resolve_service),
    bookmark_service: BookmarkService = Depends(get_bookmark_service),
):
    opp = await _find_opportunity_by_id(
        opportunity_id, data_service, bookmark_service, user_id
    )
    if not opp:
        return JSONResponse(
            fail("NOT_FOUND", f"Opportunity {opportunity_id} not found"),
            status_code=status.HTTP_404_NOT_FOUND,
        )
    return JSONResponse(ok(opp))


@legacy_router.get("/{opportunity_id}")
async def legacy_opportunity_detail(
    opportunity_id: str,
    user_id: Optional[str] = Query(None),
    data_service: Any = Depends(_dependency_resolve_service),
    bookmark_service: BookmarkService = Depends(get_bookmark_service),
):
    opp = await _find_opportunity_by_id(
        opportunity_id, data_service, bookmark_service, user_id
    )
    if not opp:
        return JSONResponse(
            fail("NOT_FOUND", f"Opportunity {opportunity_id} not found"),
            status_code=status.HTTP_404_NOT_FOUND,
        )
    return JSONResponse(ok(opp))


@router.get("/sports")
async def get_available_sports(
    data_service: Any = Depends(_dependency_resolve_service),
):
    opportunities, _, _ = await _fetch_opportunities(
        data_service,
        sport_filter=None,
        confidence_range=None,
        edge_range=None,
        limit=200,
        force_flat_baseline=False,
        include_diagnostics=False,
        search=None,
    )
    sports = sorted(
        {
            str(opp.get("sport") or "").upper()
            for opp in opportunities
            if opp.get("sport")
        }
    )
    return JSONResponse(ok(sports))


@router.get("/markets")
async def get_available_markets(
    data_service: Any = Depends(_dependency_resolve_service),
):
    opportunities, _, _ = await _fetch_opportunities(
        data_service,
        sport_filter=None,
        confidence_range=None,
        edge_range=None,
        limit=200,
        force_flat_baseline=False,
        include_diagnostics=False,
        search=None,
    )
    markets = sorted(
        {
            str(opp.get("market") or "").upper()
            for opp in opportunities
            if opp.get("market")
        }
    )
    return JSONResponse(ok(markets))


@router.get("/stats")
async def get_propfinder_stats(
    data_service: Any = Depends(_dependency_resolve_service),
):
    opportunities, summary, _ = await _fetch_opportunities(
        data_service,
        sport_filter=None,
        confidence_range=None,
        edge_range=None,
        limit=200,
        force_flat_baseline=False,
        include_diagnostics=False,
        search=None,
    )
    stats_payload = summary or _build_summary(opportunities)
    return JSONResponse(ok(stats_payload))


@router.post("/bookmark")
async def bookmark_opportunity(
    payload: BookmarkPayload,
    user_id: str = Query(..., description="User ID for bookmark operation"),
    bookmark_service: BookmarkService = Depends(get_bookmark_service),
):
    try:
        if payload.bookmarked:
            success = await bookmark_service.bookmark_prop(
                user_id=user_id,
                prop_id=payload.prop_id,
                sport=payload.sport,
                player=payload.player,
                market=payload.market,
                team=payload.team,
            )
            status_label = "bookmarked" if success else "already_bookmarked"
            bookmarked = bool(success)
        else:
            success = await bookmark_service.unbookmark_prop(user_id, payload.prop_id)
            status_label = "unbookmarked" if success else "not_bookmarked"
            bookmarked = False

        return JSONResponse(
            ok(
                {
                    "prop_id": payload.prop_id,
                    "bookmarked": bookmarked,
                    "status": status_label,
                }
            )
        )
    except ValueError as exc:
        return JSONResponse(
            fail("NOT_FOUND", str(exc)),
            status_code=status.HTTP_404_NOT_FOUND,
        )
    except Exception as exc:  # pragma: no cover - defensive logging
        logger.exception("Bookmark operation failed")
        return JSONResponse(
            fail("BOOKMARK_ERROR", "Unable to update bookmark", {"detail": str(exc)}),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@router.get("/bookmarks")
async def list_bookmarks(
    user_id: str = Query(...),
    sport: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    bookmark_service: BookmarkService = Depends(get_bookmark_service),
):
    try:
        bookmarks = await bookmark_service.get_user_bookmarks(
            user_id, sport=sport, limit=limit
        )
        serialized: List[Dict[str, Any]] = []
        for bookmark in bookmarks:
            serialized.append(
                {
                    "id": getattr(bookmark, "id", None),
                    "prop_id": getattr(bookmark, "prop_id", None),
                    "sport": getattr(bookmark, "sport", None),
                    "player": getattr(bookmark, "player", None),
                    "market": getattr(bookmark, "market", None),
                    "team": getattr(bookmark, "team", None),
                    "created_at": getattr(bookmark, "created_at", None),
                }
            )
        encoded = jsonable_encoder(serialized)
        return JSONResponse(ok(encoded))
    except Exception as exc:
        logger.exception("Failed to list bookmarks")
        return JSONResponse(
            fail("BOOKMARK_ERROR", "Unable to load bookmarks", {"detail": str(exc)}),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@router.get("/opportunities/metrics-summary")
async def get_metrics_summary():
    snapshot = _get_clv_metrics_snapshot()
    return JSONResponse(ok(snapshot))


@router.get("/opportunities/diagnostics")
async def get_opportunities_diagnostics():
    snapshot = _get_clv_metrics_snapshot()
    diagnostics = {
        "clv_system_enabled": bool(snapshot.get("enabled")),
        "metrics_available": bool(
            snapshot.get("metrics_available", snapshot.get("enabled"))
        ),
        "timestamp": _now_utc_iso(),
        "enrichment_stats": snapshot.get("enrichment_stats") or {},
        "cache_stats": snapshot.get("cache_stats") or {},
        "system_health": snapshot.get("system_health") or {},
        "summary": snapshot,
    }
    return JSONResponse(ok(diagnostics))


@router.get("/clv-status")
async def get_clv_status():
    try:
        from backend.core import app as core_app_local

        snap = getattr(core_app_local, "_clv_runtime_status", None)
        if isinstance(snap, dict):
            return JSONResponse(ok(dict(snap)))
    except Exception:
        pass

    fallback = {
        "status": "pending",
        "lastRequestedEpoch": None,
        "lastRequestedIso": None,
        "lastIncludeParam": False,
        "lastFeatureFlagEnabled": False,
        "lastComputationSucceeded": False,
        "lastReturnedWithCLV": False,
        "lastOpportunityCount": 0,
        "lastError": None,
    }
    return JSONResponse(ok(fallback))


@router.post("/debug/enable")
async def enable_propfinder_debug(payload: Optional[DebugTogglePayload] = None):
    desired_enabled = (
        True if payload is None or payload.enabled is None else bool(payload.enabled)
    )
    _DEBUG_STATE["enabled"] = desired_enabled

    if payload and payload.path:
        path = os.path.abspath(payload.path)
        _DEBUG_STATE["path"] = path
    else:
        _DEBUG_STATE["path"] = os.path.join(
            os.getcwd(), "tmp_propfinder_last_payload.json"
        )

    os.environ["PROPFINDER_DEBUG_DUMP_ENABLED"] = "true" if desired_enabled else "false"

    return JSONResponse(
        ok(
            {
                "enabled": desired_enabled,
                "path": _DEBUG_STATE.get("path"),
            }
        )
    )


@router.get("/debug/last-propfinder")
async def read_propfinder_debug_dump():
    path = _DEBUG_STATE.get("path") or os.path.join(
        os.getcwd(), "tmp_propfinder_last_payload.json"
    )
    try:
        with open(path, "r", encoding="utf-8") as handle:
            data = json.load(handle)
    except FileNotFoundError:
        data = {"opportunities": []}
    except Exception as exc:
        return JSONResponse(
            fail(
                "DEBUG_READ_ERROR",
                "Unable to read PropFinder debug dump",
                {"detail": str(exc)},
            ),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
    return JSONResponse(ok(data))


# ---------------------------------------------------------------------------
# Lightweight CLV enrichment helper (reused by tests and compatibility paths)
# ---------------------------------------------------------------------------


async def _run_clv_compute(opps, data_service=None):
    """Run a lightweight CLV enrichment flow for a list of opportunities.

    Returns:
            Tuple[bool, bool]: (feature_enabled, enrichment_succeeded)
    """

    clv_enabled = False
    try:
        from backend.services import unified_config

        cfg = unified_config.get_config()
        clv_enabled = bool(getattr(cfg.performance, "enable_clv_metrics", False))
    except Exception:
        clv_enabled = False

    def _serialize(item):
        if isinstance(item, dict):
            return item
        try:
            return item.__dict__
        except Exception:
            return {"id": getattr(item, "id", None)}

    serialized = [_serialize(item) for item in opps]

    def _is_valid_clv_results(result):
        if not isinstance(result, list) or not result:
            return False
        for entry in result:
            if (
                isinstance(entry, dict)
                and entry.get("id")
                and (
                    entry.get("clv_metrics") is not None
                    or entry.get("clvPercent") is not None
                    or entry.get("closingLine") is not None
                )
            ):
                return True
            try:
                if (
                    not isinstance(entry, dict)
                    and getattr(entry, "id", None)
                    and (
                        getattr(entry, "clv_metrics", None) is not None
                        or getattr(entry, "clvPercent", None) is not None
                    )
                ):
                    return True
            except Exception:
                continue
        return False

    try:
        attach_fn = (
            getattr(data_service, "attach_clv_data", None) if data_service else None
        )
        if attach_fn and callable(attach_fn):
            import inspect

            if inspect.iscoroutinefunction(attach_fn):
                attach_results = await attach_fn(serialized)
            else:
                try:
                    attach_results = attach_fn(serialized)
                except TypeError:
                    attach_results = attach_fn(opps)

            if _is_valid_clv_results(attach_results):
                mapping = {}
                for item in attach_results:
                    if isinstance(item, dict):
                        mapping[item.get("id")] = item
                    else:
                        mapping[getattr(item, "id", None)] = item

                for original in opps:
                    oid = (
                        original.get("id")
                        if isinstance(original, dict)
                        else getattr(original, "id", None)
                    )
                    enriched = mapping.get(oid)
                    if not enriched:
                        continue
                    if isinstance(original, dict):
                        if isinstance(enriched, dict):
                            original.update(
                                {k: v for k, v in enriched.items() if k != "id"}
                            )
                        else:
                            try:
                                original["clvPercent"] = getattr(
                                    enriched, "clvPercent", None
                                )
                                original["clv_metrics"] = getattr(
                                    enriched, "clv_metrics", None
                                )
                            except Exception:
                                pass
                    else:
                        try:
                            if isinstance(enriched, dict):
                                for key, value in enriched.items():
                                    if key != "id":
                                        setattr(original, key, value)
                            else:
                                setattr(
                                    original,
                                    "clvPercent",
                                    getattr(enriched, "clvPercent", None),
                                )
                                setattr(
                                    original,
                                    "clv_metrics",
                                    getattr(enriched, "clv_metrics", None),
                                )
                        except Exception:
                            pass

                return (clv_enabled, True)
    except Exception:
        pass

    try:
        import inspect

        from backend.services.clv_computation import compute_clv_batch

        try:
            maybe = compute_clv_batch(serialized)
        except TypeError:
            maybe = compute_clv_batch(opps)

        results = await maybe if inspect.isawaitable(maybe) else maybe

        if _is_valid_clv_results(results):
            mapping = {}
            for item in results:
                if isinstance(item, dict):
                    mapping[item.get("id")] = item
                else:
                    mapping[getattr(item, "id", None)] = item

            for original in opps:
                oid = (
                    original.get("id")
                    if isinstance(original, dict)
                    else getattr(original, "id", None)
                )
                enriched = mapping.get(oid)
                if not enriched:
                    continue
                if isinstance(original, dict):
                    if isinstance(enriched, dict):
                        original.update(
                            {k: v for k, v in enriched.items() if k != "id"}
                        )
                    else:
                        try:
                            original["clvPercent"] = getattr(
                                enriched, "clvPercent", None
                            )
                            original["clv_metrics"] = getattr(
                                enriched, "clv_metrics", None
                            )
                        except Exception:
                            pass
                else:
                    try:
                        if isinstance(enriched, dict):
                            for key, value in enriched.items():
                                if key != "id":
                                    setattr(original, key, value)
                        else:
                            setattr(
                                original,
                                "clvPercent",
                                getattr(enriched, "clvPercent", None),
                            )
                            setattr(
                                original,
                                "clv_metrics",
                                getattr(enriched, "clv_metrics", None),
                            )
                    except Exception:
                        pass

            return (clv_enabled, True)
    except Exception:
        pass

    return (clv_enabled, False)


__all__ = [
    "router",
    "legacy_router",
    "get_prop_opportunities",
    "get_simple_propfinder_service",
    "get_bookmark_service",
    "_cache_set",
    "_cache_get",
    "_run_clv_compute",
]
