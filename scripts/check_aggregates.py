from backend.database import sync_engine
from sqlalchemy import select
from backend.models.odds import BestLineAggregate
from sqlalchemy.orm import Session

with Session(sync_engine) as s:
    try:
        res = s.execute(select(BestLineAggregate).limit(20))
        rows = res.scalars().all()
        print('Found', len(rows), 'aggregate rows')
        for r in rows:
            print(
                r.prop_id,
                r.best_over_odds,
                r.best_over_bookmaker_id,
                getattr(r, 'best_over_bookmaker_name', None),
                r.best_under_odds,
                r.best_under_bookmaker_id,
                getattr(r, 'best_under_bookmaker_name', None),
                r.arbitrage_opportunity
            )
    except Exception as e:
        print('Error querying DB:', e)
