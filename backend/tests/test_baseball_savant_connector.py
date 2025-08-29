import sys
import asyncio
import pytest

sys.path.append(r"c:\Users\bcmad\Downloads\A1Betting7-13.2")

import backend.ingestion  # noqa: F401
from backend.services import unified_data_fetcher as u


@pytest.mark.asyncio
async def test_baseball_savant_registered():
    connectors = u.list_connectors()
    assert "baseball_savant" in connectors


@pytest.mark.asyncio
async def test_baseball_savant_props_for_event():
    # Ensure we have an event to pass in; fall back to dummy id
    events = await u.fetch_all_events()
    event_id = events[0].id if events else "test_event"

    props = await u.fetch_props_for_event(event_id)
    assert isinstance(props, list)
    # We expect at least one snapshot if the client could fetch players (or an empty list otherwise)
    assert props is not None
