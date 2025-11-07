import os
import tempfile
import shutil
from pathlib import Path

import pytest

# Ensure project root is on path
import sys
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from sqlalchemy import text
from sqlmodel import create_engine


def setup_temp_db(tmp_path):
    db_file = tmp_path / "test_backfill.db"
    # Use the aiosqlite dialect so backend.database will convert to sync sqlite
    db_url = f"sqlite+aiosqlite:///{db_file}"
    return str(db_file), db_url


def test_backfill_populates_names(tmp_path, monkeypatch):
    # Create a temp sqlite file path and set DATABASE_URL before importing project modules
    db_file, db_url = setup_temp_db(tmp_path)

    # Create table and insert a sample aggregate row using a local SQLAlchemy engine
    # Use sync sqlite URL for direct SQLAlchemy engine
    sync_db_url = f"sqlite:///{db_file}"
    from sqlalchemy import create_engine
    engine = create_engine(sync_db_url, future=True)
    # Use a transaction context to ensure data is committed and visible to other connections
    with engine.begin() as conn:
        # Create a table with columns that the SQLModel expects (keep it minimal)
        conn.execute(text("""
        CREATE TABLE IF NOT EXISTS best_line_aggregates (
            id INTEGER PRIMARY KEY,
            prop_id TEXT,
            sport TEXT,
            best_over_odds INTEGER,
            best_over_bookmaker_id INTEGER,
            best_under_odds INTEGER,
            best_under_bookmaker_id INTEGER,
            best_over_bookmaker_name TEXT,
            best_under_bookmaker_name TEXT,
            consensus_line REAL,
            consensus_over_prob REAL,
            consensus_under_prob REAL,
            num_bookmakers INTEGER,
            line_spread REAL,
            odds_spread_over INTEGER,
            odds_spread_under INTEGER,
            arbitrage_opportunity BOOLEAN,
            arbitrage_profit_pct REAL,
            last_updated DATETIME,
            data_age_minutes INTEGER
        )
        """))
        conn.execute(text(
            "INSERT INTO best_line_aggregates (prop_id, sport, best_over_odds, best_over_bookmaker_id, best_under_odds, best_under_bookmaker_id, consensus_line, arbitrage_opportunity, num_bookmakers, line_spread) VALUES ('tst-1', 'MLB', 120, NULL, -110, NULL, 0, 0, 0, 0)"
        ))

        # Create a minimal bookmakers table for lookups
        conn.execute(text("""
        CREATE TABLE IF NOT EXISTS bookmakers (
            id INTEGER PRIMARY KEY,
            name TEXT,
            display_name TEXT
        )
        """))
        conn.execute(text("INSERT INTO bookmakers (id, name, display_name) VALUES (1, 'draftkings', 'DraftKings')"))

    # Import and run the backfill function using our temp sqlite file
    from scripts.backfill_bestline_names import run_backfill

    # Ensure environment variable is set (the backfill respects DATABASE_URL if present)
    os.environ["DATABASE_URL"] = f"sqlite:///{db_file}"

    # Run backfill against our temp DB (use sqlite sync URL)
    run_backfill(database_url=sync_db_url)

    # Verify the row now has the textual name columns (read via raw SQL)
    with engine.connect() as conn:
        res = conn.execute(text("SELECT best_over_bookmaker_name, best_under_bookmaker_name FROM best_line_aggregates LIMIT 1"))
        row = res.fetchone()
        assert row is not None
        assert row[0] is not None or row[1] is not None
import os
import subprocess
import sqlite3
import contextlib


def run_backfill_against_temp_db(tmp_db_path):
    env = os.environ.copy()
    env["DATABASE_URL"] = f"sqlite:///{tmp_db_path}"
    python_exe = os.environ.get("PYTHON", "python")
    proc = subprocess.run(
        [python_exe, "scripts/run_backfill_bestline_names.py"],
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )
    return proc


def test_backfill_populates_name_columns(tmp_path):
    db_file = tmp_path / "test_backfill.db"
    db_path = str(db_file)
    # Create a minimal best_line_aggregates table so the backfill script can ALTER it
    with contextlib.closing(sqlite3.connect(db_path)) as conn:
        cur = conn.cursor()
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS best_line_aggregates (
                id INTEGER PRIMARY KEY,
                prop_id TEXT,
                best_over_bookmaker_id INTEGER,
                best_under_bookmaker_id INTEGER,
                best_over_odds INTEGER,
                best_under_odds INTEGER
            )
            """
        )
        # Insert one row to simulate existing aggregate
        cur.execute(
            "INSERT INTO best_line_aggregates (prop_id, best_over_odds, best_under_odds) VALUES (?, ?, ?)",
            ("test-prop-1", 120, -110),
        )
        conn.commit()

    # Instead of invoking a subprocess, call the backfill function directly
    from scripts.backfill_bestline_names import run_backfill

    # Set DATABASE_URL env to point at the sqlite file used in this test
    os.environ["DATABASE_URL"] = f"sqlite:///{db_path}"

    # Run the backfill which should ALTER the table and add the columns
    run_backfill()

    with contextlib.closing(sqlite3.connect(db_path)) as conn:
        cur = conn.cursor()
        # PRAGMA table_info returns rows: cid,name,type,notnull,dflt_value,pk
        cur.execute("PRAGMA table_info('best_line_aggregates')")
        cols = {row[1] for row in cur.fetchall()}

    assert (
        "best_over_bookmaker_name" in cols and "best_under_bookmaker_name" in cols
    ), "Expected name columns to be present in best_line_aggregate"
