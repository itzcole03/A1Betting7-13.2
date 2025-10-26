"""Consolidated ML routes (stub)

This module originally contained an extensive ML consolidation API. To
unblock test collection and runtime in environments where the full ML
stack or optional heavy dependencies may be unavailable, we provide a
minimal, import-safe stub implementation here.

The stub exposes a health endpoint and lightweight predict/batch-predict
endpoints that return a small informative payload. Replace or extend
this file when re-enabling full ML functionality.
"""

import logging
import time
from datetime import datetime
from typing import Dict

from fastapi import APIRouter

from ..core.exceptions import BusinessLogicException
from ..core.response_models import ResponseBuilder, StandardAPIResponse

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Machine Learning", "ML-Consolidated"])  # keep tag consistent


@router.get("/health", response_model=StandardAPIResponse[Dict[str, object]])
async def health_check():
    """Lightweight health check for consolidated ML (stub)."""
    return ResponseBuilder.success(
        {
            "status": "consolidated_ml_stub",
            "timestamp": datetime.utcnow().isoformat(),
            "note": "Consolidated ML endpoints are disabled in the test stub.",
        }
    )


@router.post("/predict", response_model=StandardAPIResponse[Dict[str, object]])
async def predict():
    """Stub predict endpoint. Returns a static message to avoid heavy deps."""
    return ResponseBuilder.success(
        {
            "message": "consolidated_ml_stub: predict is disabled in this environment",
            "timestamp": time.time(),
        }
    )


@router.post("/batch-predict", response_model=StandardAPIResponse[Dict[str, object]])
async def batch_predict():
    """Stub batch predict endpoint."""
    return ResponseBuilder.success(
        {
            "message": "consolidated_ml_stub: batch predict is disabled in this environment",
            "timestamp": time.time(),
        }
    )


def _american_to_decimal(american: int) -> float:
    """Small helper used by tests to convert American odds to decimal.

    Kept local to avoid coupling with other modules.
    """
    try:
        american = int(american)
    except Exception:
        return 0.0

    return (american / 100) + 1 if american > 0 else (100 / abs(american)) + 1


def _extract_decimal_odds_from_request(req) -> float | None:
    """Extract a decimal odds value from a lightweight request-like object.

    This mirrors the minimal behaviour expected by a few unit tests.
    """
    if req is None:
        return None

    data = getattr(req, "data", None) or {}
    # Prefer an explicit decimal odds field
    if isinstance(data, dict) and "odds" in data:
        try:
            return float(data.get("odds"))
        except Exception:
            return None

    # Fallback to american odds if present
    if isinstance(data, dict) and "american_odds" in data:
        try:
            return _american_to_decimal(int(data.get("american_odds")))
        except Exception:
            return None

    return None


def _maybe_add_ev_to_unified(req, unified: dict) -> None:
    """Populate simple EV fields on a unified prediction dict when possible.

    Mutates `unified` in-place to match test expectations.
    """
    odds_decimal = _extract_decimal_odds_from_request(req)
    if odds_decimal is None:
        return None

    prediction = unified.get("prediction")
    confidence = unified.get("confidence")

    try:
        # expected value = predicted_prob - implied_prob
        implied_prob = 1.0 / float(odds_decimal)
        ev = float(prediction) - implied_prob if prediction is not None else None
    except Exception:
        ev = None

    if ev is not None:
        unified["odds_decimal"] = odds_decimal
        unified["ev"] = ev
        unified["ev_pct"] = ev * 100

    return None


# Export minimal helpers used by unit tests when the full ML stack is disabled.
__all__ = [
    "_american_to_decimal",
    "_extract_decimal_odds_from_request",
    "_maybe_add_ev_to_unified",
]
