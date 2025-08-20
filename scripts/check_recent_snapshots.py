from datetime import datetime, timezone, timedelta
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from backend.database import sync_engine
from backend.models.odds import OddsSnapshot


def main(minutes=60):
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=minutes)
    with Session(sync_engine) as s:
        try:
            # Count snapshots in window
            total = s.execute(select(func.count()).select_from(OddsSnapshot).where(OddsSnapshot.captured_at > cutoff)).scalar_one()
            print(f"Snapshots in last {minutes} minutes: {total}")

            # Most recent snapshot per prop
            res = s.execute(
                select(OddsSnapshot.prop_id, func.max(OddsSnapshot.captured_at)).where(OddsSnapshot.captured_at > cutoff).group_by(OddsSnapshot.prop_id)
            )
            rows = res.all()
            print(f"Found {len(rows)} props with recent snapshots")
            for prop_id, ts in rows:
                print(prop_id, ts)
        except Exception as e:
            print('Error querying snapshots:', e)


if __name__ == '__main__':
    main(60)
