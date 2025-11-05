"""Import-safe shim for CLV trends routes.

This shim provides a very small, import-safe router used during tests so
that the application can include the CLV routes without importing heavy
production dependencies at test-collection time.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List

from fastapi import APIRouter

try:
    from ..core.response_models import ResponseBuilder
except Exception:  # pragma: no cover - fallback for test collection

    class _Fallback:
        @staticmethod
        def success(data: Any = None) -> Dict[str, Any]:
            return {"success": True, "data": data, "error": None}

    ResponseBuilder = _Fallback


router = APIRouter(prefix="/api/clv-trends", tags=["CLV Trends"])


@router.get("/health")
async def health() -> Dict[str, Any]:
    return ResponseBuilder.success({"status": "ok"})


@router.get("/trends/{prop_id}")
async def get_clv_trends_stub(
    prop_id: str, hours_back: int = 24, include_snapshots: bool = True
):
    """Lightweight placeholder for CLV trend endpoint used during tests."""
    payload = {
        "prop_id": prop_id,
        "current_clv": None,
        "snapshots": [] if include_snapshots else None,
        "hours_back": hours_back,
    }
    return ResponseBuilder.success(payload)


@router.get("/leaderboard")
async def get_clv_leaderboard(sort_by: str = "best") -> Dict[str, Any]:
    """Return deterministic leaderboard data for tests."""

    sample_entry = {
        "prop_id": "NBA:LeBron James:Points",
        "sport": "NBA",
        "player": "LeBron James",
        "market": "Points",
        "sportsbook": "FanDuel",
        "current_clv": 8.5 if sort_by == "best" else -5.2,
        "opening_line": 28.5,
        "current_line": 29.5,
        "line_movement": 1.0,
        "confidence_score": 87.2,
        "last_updated": datetime.now(timezone.utc).isoformat(),
    }
    return ResponseBuilder.success([sample_entry])


@router.get("/distribution")
async def get_clv_distribution() -> Dict[str, Any]:
    payload = {
        "total_opportunities": 150,
        "clv_ranges": {
            "excellent (>10%)": 12,
            "good (5% to 10%)": 23,
            "fair (0% to 5%)": 45,
            "poor (-5% to 0%)": 38,
            "bad (<-5%)": 32,
        },
        "average_clv": 1.2,
        "median_clv": 0.8,
        "best_clv": 15.3,
        "worst_clv": -8.7,
        "opportunities_with_positive_clv": 80,
        "opportunities_with_negative_clv": 70,
        "distribution_data": [
            {"range": "excellent (>10%)", "count": 12, "percentage": 8.0},
            {"range": "good (5% to 10%)", "count": 23, "percentage": 15.3},
            {"range": "fair (0% to 5%)", "count": 45, "percentage": 30.0},
        ],
    }
    return ResponseBuilder.success(payload)


@router.get("/alerts")
async def get_clv_alerts() -> Dict[str, Any]:
    payload: List[Dict[str, Any]] = [
        {
            "prop_id": "NBA:Stephen Curry:3-Pointers Made",
            "sport": "NBA",
            "player": "Stephen Curry",
            "market": "3-Pointers Made",
            "sportsbook": "DraftKings",
            "alert_type": "degradation",
            "clv_change": -3.2,
            "previous_clv": 5.1,
            "current_clv": 1.9,
            "severity": "medium",
            "triggered_at": datetime.now(timezone.utc).isoformat(),
            "message": "CLV degradation detected",
        }
    ]
    return ResponseBuilder.success(payload)


@router.get("/closing-snapshots")
async def get_closing_snapshots() -> Dict[str, Any]:
    payload = [
        {
            "prop_id": "NBA:LeBron James:Points",
            "sport": "NBA",
            "player": "LeBron James",
            "market": "Points",
            "sportsbook": "FanDuel",
            "opening_line": 28.5,
            "closing_line": 29.5,
            "opening_odds": -110,
            "closing_odds": -105,
            "clv_percent": 3.51,
            "line_movement": 1.0,
            "final_result": "pending",
            "closed_at": datetime.now(timezone.utc).isoformat(),
        }
    ]
    return ResponseBuilder.success(payload)


@router.get("/stats")
async def get_clv_stats() -> Dict[str, Any]:
    payload = {
        "system_status": "operational",
        "total_opportunities": 150,
        "opportunities_with_clv": 143,
        "clv_coverage_percent": 95.3,
        "average_clv": 1.2,
        "positive_clv_opportunities": 80,
        "negative_clv_opportunities": 63,
        "best_clv_today": 15.3,
        "worst_clv_today": -8.7,
        "clv_calculation_accuracy": 95.2,
        "historical_snapshots_stored": 15000,
        "closing_snapshots_this_week": 450,
        "last_updated": datetime.now(timezone.utc).isoformat(),
    }
    return ResponseBuilder.success(payload)
