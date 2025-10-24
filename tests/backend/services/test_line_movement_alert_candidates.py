import asyncio
from datetime import datetime, timedelta
from unittest.mock import AsyncMock

import pytest

from backend.services.line_movement_service import LineMovementService


@pytest.fixture
def movement_service():
    service = LineMovementService()
    # Force in-memory operation for tests
    service._ensure_redis = AsyncMock(return_value=None)

    # Ensure the in-memory store starts clean for each test
    service._in_memory_store.clear()
    try:
        yield service
    finally:
        service._in_memory_store.clear()


@pytest.mark.asyncio
async def test_movement_alert_candidates_basic(movement_service: LineMovementService):
    await movement_service.record_snapshot("NBA", "Test Player", "Points", 24.5, -110)
    await asyncio.sleep(0)  # ensure distinct timestamps
    await movement_service.record_snapshot("NBA", "Test Player", "Points", 25.5, -115)

    candidates = await movement_service.get_movement_alert_candidates(
        hours_back=24,
        movement_threshold=0.5,
    )

    assert any(c["player"].replace("_", " ") == "Test Player" for c in candidates)

    candidate = next(
        c for c in candidates if c["player"].replace("_", " ") == "Test Player"
    )
    assert candidate["direction"] == "increase"
    assert candidate["abs_change"] == pytest.approx(1.0, rel=1e-3)
    assert candidate["snapshot_count"] >= 2
    assert candidate["prop_id"] == "NBA:Test_Player:Points"


@pytest.mark.asyncio
async def test_movement_alert_candidates_filters(movement_service: LineMovementService):
    # Increasing movement (NBA)
    await movement_service.record_snapshot("NBA", "Rise Player", "Points", 10.0, -110)
    await movement_service.record_snapshot("NBA", "Rise Player", "Points", 11.0, -112)

    # Decreasing movement (NFL)
    await movement_service.record_snapshot("NFL", "Drop Player", "Yards", 75.5, -110)
    await movement_service.record_snapshot("NFL", "Drop Player", "Yards", 74.0, -108)

    # Sport filter
    nba_only = await movement_service.get_movement_alert_candidates(
        hours_back=24,
        movement_threshold=0.5,
        sport="NBA",
    )
    assert all(c["sport"] == "NBA" for c in nba_only)
    assert any(c["player"].replace("_", " ") == "Rise Player" for c in nba_only)
    assert all(c["player"].replace("_", " ") != "Drop Player" for c in nba_only)

    # Direction filter
    decreases = await movement_service.get_movement_alert_candidates(
        hours_back=24,
        movement_threshold=0.5,
        direction="decrease",
    )
    assert any(c["player"].replace("_", " ") == "Drop Player" for c in decreases)
    assert all(c["direction"] == "decrease" for c in decreases)

    # Player substring filter (case insensitive)
    rises = await movement_service.get_movement_alert_candidates(
        hours_back=24,
        movement_threshold=0.5,
        player="rise",
    )
    assert len(rises) == 1
    assert rises[0]["player"].replace("_", " ") == "Rise Player"

    # Volatility filter excludes candidates below threshold
    baseline_candidates = await movement_service.get_movement_alert_candidates(
        hours_back=24,
        movement_threshold=0.5,
    )
    rise_candidate = next(
        c for c in baseline_candidates if c["player"].replace("_", " ") == "Rise Player"
    )
    min_vol = (rise_candidate.get("volatility") or 0.0) + 10.0

    high_vol_required = await movement_service.get_movement_alert_candidates(
        hours_back=24,
        movement_threshold=0.5,
        min_volatility=min_vol,
    )
    assert all(
        c["player"].replace("_", " ") != "Rise Player" for c in high_vol_required
    )


@pytest.mark.asyncio
async def test_movement_alert_candidates_threshold_and_hours(
    movement_service: LineMovementService,
):
    await movement_service.record_snapshot("NBA", "Slow Player", "Assists", 5.0, -110)
    await movement_service.record_snapshot("NBA", "Slow Player", "Assists", 5.3, -110)

    # Below threshold should exclude
    excluded = await movement_service.get_movement_alert_candidates(
        hours_back=24,
        movement_threshold=0.5,
    )
    assert all(c["player"].replace("_", " ") != "Slow Player" for c in excluded)

    # Lower the threshold to include
    included = await movement_service.get_movement_alert_candidates(
        hours_back=24,
        movement_threshold=0.2,
    )
    assert any(c["player"].replace("_", " ") == "Slow Player" for c in included)

    # Move snapshots outside window by manipulating timestamps
    key = movement_service.config.generate_redis_key("NBA", "Slow Player", "Assists")
    for entry in movement_service._in_memory_store.get(key, []):
        entry_ts = datetime.fromisoformat(entry["ts"])
        entry["ts"] = (entry_ts - timedelta(hours=48)).isoformat()

    stale = await movement_service.get_movement_alert_candidates(
        hours_back=24,
        movement_threshold=0.2,
    )
    assert all(c["player"].replace("_", " ") != "Slow Player" for c in stale)
