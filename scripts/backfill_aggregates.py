import asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import async_engine
from backend.models.odds import BestLineAggregate
from backend.services.odds_store import odds_store_service


async def main():
    async with AsyncSession(async_engine) as session:
        res = await session.execute(select(BestLineAggregate))
        rows = res.scalars().all()
        print(f"Found {len(rows)} aggregate rows")

        for r in rows:
            print(f"Recomputing aggregate for prop_id={r.prop_id}, sport={r.sport}")
            try:
                # Use the service to recompute & upsert
                await odds_store_service._update_best_line_aggregate(r.prop_id, r.sport)
            except Exception as e:
                print(f"Error updating {r.prop_id}: {e}")

        # Re-query to show results
        res2 = await session.execute(select(BestLineAggregate))
        rows2 = res2.scalars().all()
        for r in rows2:
            print(r.prop_id, r.best_over_odds, r.best_over_bookmaker_id, r.best_under_bookmaker_id, r.arbitrage_opportunity)


if __name__ == '__main__':
    asyncio.run(main())
