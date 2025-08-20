import asyncio
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.services.odds_store import odds_store_service, BestLineResult
from backend.database import sync_engine
from backend.models.odds import BestLineAggregate


def test_best_line_aggregate_update(monkeypatch):
    """Insert then update an aggregate and verify fields change"""
    now = datetime.now(timezone.utc)

    initial = BestLineResult(
        prop_id='update-prop-1',
        best_over_odds=110,
        best_over_bookmaker='DK',
        best_under_odds=-105,
        best_under_bookmaker='FD',
        consensus_line=24.5,
        consensus_over_prob=0.51,
        consensus_under_prob=0.49,
        num_bookmakers=2,
        arbitrage_opportunity=False,
        arbitrage_profit_pct=0.0,
        last_updated=now
    )

    updated = BestLineResult(
        prop_id='update-prop-1',
        best_over_odds=130,
        best_over_bookmaker='MGM',
        best_under_odds=-120,
        best_under_bookmaker='CZR',
        consensus_line=25.0,
        consensus_over_prob=0.53,
        consensus_under_prob=0.47,
        num_bookmakers=4,
        arbitrage_opportunity=True,
        arbitrage_profit_pct=1.5,
        last_updated=now
    )

    async def fake_get_best_line_first(session, prop_id):
        return initial

    async def fake_get_best_line_second(session, prop_id):
        return updated

    # First insert
    monkeypatch.setattr(odds_store_service, 'get_best_line', fake_get_best_line_first)
    asyncio.get_event_loop().run_until_complete(odds_store_service._update_best_line_aggregate('update-prop-1', 'NBA'))

    # Then update
    monkeypatch.setattr(odds_store_service, 'get_best_line', fake_get_best_line_second)
    asyncio.get_event_loop().run_until_complete(odds_store_service._update_best_line_aggregate('update-prop-1', 'NBA'))

    # Verify
    with Session(sync_engine) as s:
        res = s.execute(select(BestLineAggregate).where(BestLineAggregate.prop_id == 'update-prop-1'))
        agg = res.scalars().first()
        assert agg is not None
        assert agg.num_bookmakers == 4
        assert agg.arbitrage_opportunity is True
        assert abs((agg.consensus_line or 0) - 25.0) < 0.01
