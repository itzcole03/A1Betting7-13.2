import asyncio
from datetime import datetime, timezone

import pytest

from backend.services.odds_store import odds_store_service, BestLineResult
from backend.database import sync_engine
from backend.models.base import Base
from backend.models.odds import BestLineAggregate


def test_update_best_line_aggregate_upsert(monkeypatch):
    """Test that _update_best_line_aggregate upserts a BestLineAggregate row"""
    # Prepare a fake BestLineResult
    now = datetime.now(timezone.utc)
    fake_best = BestLineResult(
        prop_id='test-prop-123',
        best_over_odds=120,
        best_over_bookmaker='DraftKings',
        best_under_odds=-110,
        best_under_bookmaker='FanDuel',
        consensus_line=25.5,
        consensus_over_prob=0.52,
        consensus_under_prob=0.48,
        num_bookmakers=3,
        arbitrage_opportunity=False,
        arbitrage_profit_pct=0.0,
        last_updated=now
    )

    async def fake_get_best_line(session, prop_id):
        return fake_best

    monkeypatch.setattr(odds_store_service, 'get_best_line', fake_get_best_line)

    # Run the coroutine
    asyncio.get_event_loop().run_until_complete(odds_store_service._update_best_line_aggregate('test-prop-123', 'NBA'))

    # Verify row exists in DB (sync_engine used for tests)
    from sqlalchemy import select
    from sqlalchemy.orm import Session

    with Session(sync_engine) as s:
        res = s.execute(select(BestLineAggregate).where(BestLineAggregate.prop_id == 'test-prop-123'))
        agg = res.scalars().first()
        assert agg is not None
        assert agg.prop_id == 'test-prop-123'
        assert agg.num_bookmakers == 3
        assert abs((agg.consensus_line or 0) - 25.5) < 0.01
