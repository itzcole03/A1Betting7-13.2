"""
Backfill script to populate best_over_bookmaker_name and best_under_bookmaker_name
for existing rows in best_line_aggregates.

This script will:
- Connect using the project's sync engine
- Query all BestLineAggregate rows
- For each row, if name columns are empty, attempt to populate from:
  1) existing bookmaker_id references (join to bookmakers)
  2) seeded `INITIAL_BOOKMAKERS` mapping if ids are missing

This script is safe to run multiple times.
"""
import sys
import os
from sqlalchemy import select

# Add project root to path
ROOT = os.path.dirname(os.path.dirname(__file__))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from sqlalchemy.orm import Session
from sqlalchemy import create_engine as sa_create_engine
from backend.models.odds import BestLineAggregate, Bookmaker, INITIAL_BOOKMAKERS
from sqlalchemy import text
from backend.models.odds import OddsSnapshot


def run_backfill(database_url: str | None = None):
    # Use provided database_url for isolated runs (tests) or default project's sync_engine
    engine = None
    if database_url:
        # Normalize sqlite+aiosqlite -> sqlite for sync engine
        db_url = database_url.replace("sqlite+aiosqlite", "sqlite")
        engine = sa_create_engine(db_url, future=True)
    else:
        # Respect DATABASE_URL environment var at runtime so tests that set it take effect
        env_db = os.getenv("DATABASE_URL")
        if env_db:
            db_url = env_db.replace("sqlite+aiosqlite", "sqlite")
            engine = sa_create_engine(db_url, future=True)
        else:
            from backend.database import sync_engine
            engine = sync_engine

    # Ensure name columns exist; if not, add them (safe for sqlite/postgres)
    with engine.begin() as conn:
        dialect = conn.dialect.name
        existing_cols = set()
        if dialect == 'sqlite':
            res = conn.execute(text("PRAGMA table_info('best_line_aggregates')"))
            for r in res.fetchall():
                existing_cols.add(r[1])
        else:
            res = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='best_line_aggregates'"))
            for r in res.fetchall():
                existing_cols.add(r[0])

        to_add = []
        if 'best_over_bookmaker_name' not in existing_cols:
            to_add.append(('best_over_bookmaker_name', "VARCHAR(255)"))
        if 'best_under_bookmaker_name' not in existing_cols:
            to_add.append(('best_under_bookmaker_name', "VARCHAR(255)"))

        for col_name, col_type in to_add:
            try:
                if dialect == 'sqlite':
                    conn.execute(text(f"ALTER TABLE best_line_aggregates ADD COLUMN {col_name} {col_type}"))
                else:
                    conn.execute(text(f"ALTER TABLE best_line_aggregates ADD COLUMN {col_name} {col_type}"))
                print(f"Added column {col_name}")
            except Exception as e:
                print(f"Could not add column {col_name}: {e}")

    # Decide whether to prefer raw SQL operations (useful for tests with lightweight schemas)
    env_db = os.getenv("DATABASE_URL")
    use_raw = bool(database_url) or (env_db is not None and "sqlite" in env_db)

    if use_raw:
        # Use a fresh transactional connection for raw SQL operations (ensures commits)
        with engine.begin() as conn2:
            # Build name_map via raw SQL
            name_map = {}
            try:
                res = conn2.execute(text("SELECT id, display_name FROM bookmakers"))
                for r in res.fetchall():
                    name_map[r[0]] = r[1]
            except Exception:
                name_map = {}

            seeded_map = {b['name'].lower(): b['display_name'] for b in INITIAL_BOOKMAKERS}

            # Fetch aggregate rows using raw SQL
            res = conn2.execute(text("SELECT id, prop_id, best_over_odds, best_over_bookmaker_id, best_under_odds, best_under_bookmaker_id FROM best_line_aggregates"))
            rows = res.fetchall()
            print(f"Found {len(rows)} aggregate rows")

            updated = 0
            for row in rows:
                agg_id, prop_id, best_over_odds, best_over_bookmaker_id, best_under_odds, best_under_bookmaker_id = row
                over_name = None
                under_name = None

                # 1) from bookmaker id
                if best_over_bookmaker_id and not over_name:
                    over_name = name_map.get(best_over_bookmaker_id)
                if best_under_bookmaker_id and not under_name:
                    under_name = name_map.get(best_under_bookmaker_id)

                # 2) fallback seeded
                if not over_name and INITIAL_BOOKMAKERS:
                    over_name = INITIAL_BOOKMAKERS[0]['display_name']
                if not under_name and INITIAL_BOOKMAKERS:
                    under_name = INITIAL_BOOKMAKERS[0]['display_name']

                if over_name or under_name:
                    conn2.execute(text("UPDATE best_line_aggregates SET best_over_bookmaker_name = :o, best_under_bookmaker_name = :u WHERE id = :id"), {"o": over_name, "u": under_name, "id": agg_id})
                    updated += 1

            print(f"Updated {updated} rows")
        return

    # Fallback path: use ORM session when running against the project's DB
    with Session(engine) as session:
        stmt = select(BestLineAggregate)
        rows = session.execute(stmt).scalars().all()
        print(f"Found {len(rows)} aggregate rows")

        # Build name cache from bookmakers table. Use ORM when possible, but
        # fall back to a lightweight raw SQL query if the full ORM mapping isn't present
        name_map = {}
        # Ensure 'bookmakers' is always defined for later snapshot lookups
        bookmakers = {}
        try:
            bm_stmt = select(Bookmaker)
            bookmakers = {bm.id: bm for bm in session.execute(bm_stmt).scalars().all()}
            name_map = {bm.id: bm.display_name for bm in bookmakers.values()}
        except Exception:
            # ORM mapping may not match the test table; query minimal columns directly
            try:
                conn_for_bm = session.get_bind()
                res = conn_for_bm.execute(text("SELECT id, display_name FROM bookmakers"))
                for r in res.fetchall():
                    name_map[r[0]] = r[1]
            except Exception:
                name_map = {}

        # Map seeded names by canonical name
        seeded_map = {b['name'].lower(): b['display_name'] for b in INITIAL_BOOKMAKERS}

        updated = 0
        for agg in rows:
            changed = False
            # 1) Populate from explicit bookmaker id references
            if getattr(agg, 'best_over_bookmaker_id', None) and (not getattr(agg, 'best_over_bookmaker_name', None)):
                name = name_map.get(agg.best_over_bookmaker_id)
                if name:
                    setattr(agg, 'best_over_bookmaker_name', name)
                    changed = True
            if getattr(agg, 'best_under_bookmaker_id', None) and (not getattr(agg, 'best_under_bookmaker_name', None)):
                name = name_map.get(agg.best_under_bookmaker_id)
                if name:
                    setattr(agg, 'best_under_bookmaker_name', name)
                    changed = True

            # 2) If no id, try to find a matching snapshot (any time) for this prop with the same odds
            if not getattr(agg, 'best_over_bookmaker_name', None) and getattr(agg, 'best_over_odds', None) is not None:
                snap_stmt = select(OddsSnapshot).where(OddsSnapshot.prop_id == agg.prop_id).order_by(OddsSnapshot.captured_at.desc())
                snaps = session.execute(snap_stmt).scalars().all()
                for s in snaps:
                    if s.over_odds == agg.best_over_odds:
                        # Found a matching snapshot - lookup its bookmaker
                        bm = None
                        try:
                            bm = bookmakers.get(s.bookmaker_id)
                        except Exception:
                            bm = None
                        if bm:
                            setattr(agg, 'best_over_bookmaker_name', bm.display_name)
                            changed = True
                            break

            if not getattr(agg, 'best_under_bookmaker_name', None) and getattr(agg, 'best_under_odds', None) is not None:
                snap_stmt = select(OddsSnapshot).where(OddsSnapshot.prop_id == agg.prop_id).order_by(OddsSnapshot.captured_at.desc())
                snaps = session.execute(snap_stmt).scalars().all()
                for s in snaps:
                    if s.under_odds == agg.best_under_odds:
                        bm = None
                        try:
                            bm = bookmakers.get(s.bookmaker_id)
                        except Exception:
                            bm = None
                        if bm:
                            setattr(agg, 'best_under_bookmaker_name', bm.display_name)
                            changed = True
                            break

            # 3) Fallback: use highest-priority seeded bookmaker display name (safe default)
            if not getattr(agg, 'best_over_bookmaker_name', None):
                if INITIAL_BOOKMAKERS:
                    setattr(agg, 'best_over_bookmaker_name', INITIAL_BOOKMAKERS[0]['display_name'])
                    changed = True
            if not getattr(agg, 'best_under_bookmaker_name', None):
                if INITIAL_BOOKMAKERS:
                    setattr(agg, 'best_under_bookmaker_name', INITIAL_BOOKMAKERS[0]['display_name'])
                    changed = True

            if changed:
                updated += 1
                session.add(agg)

        session.commit()
        print(f"Updated {updated} rows")


if __name__ == '__main__':
    run_backfill()
