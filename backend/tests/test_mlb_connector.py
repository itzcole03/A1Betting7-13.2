import asyncio
import sys
import pytest

# Ensure repo root is resolvable when tests run from different cwds
sys.path.append(r"c:\Users\bcmad\Downloads\A1Betting7-13.2")

import backend.ingestion  # noqa: F401  (triggers connector registration)
from backend.services import unified_data_fetcher as u


@pytest.mark.asyncio
async def test_connectors_registered():
    connectors = u.list_connectors()
    assert isinstance(connectors, list)
    assert "mlb_stats_api" in connectors


@pytest.mark.asyncio
async def test_fetch_events_and_props():
    events = await u.fetch_all_events()
    assert isinstance(events, list)
    assert len(events) > 0, "Expected at least one event from MLB connector"

    first = events[0]
    assert hasattr(first, "id")

    props = await u.fetch_props_for_event(first.id)
    assert isinstance(props, list)
    assert len(props) > 0, "Expected at least one prop for the first event"
