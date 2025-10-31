"""Per-directory test fixtures for ingestion integration tests.

This fixture replaces the project's database engines with ephemeral
in-memory SQLite engines for isolation. It's autouse so tests under
tests/ingestion/ run against a fresh DB and cannot be affected by
host machine state.
"""

import importlib
import os
import tempfile
from typing import Generator

import pytest
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel import SQLModel
from sqlmodel import create_engine as create_sync_engine

# Import the project's Base (declarative) so we can create tables for
# modules that use plain SQLAlchemy declarative Base (not SQLModel).
from backend.models import base as models_base


@pytest.fixture(autouse=True)
def ephemeral_db(monkeypatch) -> Generator[None, None, None]:
    """Replace backend.database engines with in-memory engines.

    This fixture:
    - creates sync and async in-memory engines
    - patches backend.database.sync_engine, async_engine and DATABASE_URL
    - creates all tables
    - yields to the test
    - disposes the ephemeral async engine and restores originals
    """
    # Import backend.database lazily so we can swap attributes
    import backend.database as bd

    # Keep originals to restore later
    orig_sync = getattr(bd, "sync_engine", None)
    orig_async = getattr(bd, "async_engine", None)
    orig_db_url = getattr(bd, "DATABASE_URL", None)

    # Build ephemeral URLs. Use a temporary file-based SQLite DB so the
    # sync and async engines share the same database (in-memory databases
    # created via :memory: are distinct per connection and won't be shared).
    # For test isolation we prefer a fresh temporary DB per test run. If a
    # TEST_DATABASE_URL is present in the environment (e.g. from a developer
    # shell), ignore it here to avoid test cross-contamination.
    provided = None
    if os.environ.get("TEST_DATABASE_URL"):
        # Informative print for debugging local runs
        print(
            "[ephemeral_db] TEST_DATABASE_URL present in environment; ignoring to ensure isolation"
        )
    if provided:
        ephemeral_async_url = provided
        ephemeral_sync_url = provided.replace("sqlite+aiosqlite", "sqlite")
        tmp_db_path = None
    else:
        tmpfile = tempfile.NamedTemporaryFile(
            prefix="pytest_ingest_db_", suffix=".sqlite", delete=False
        )
        tmp_db_path = tmpfile.name
        tmpfile.close()
        # Use file path for both sync and async engines so they connect to same DB
        ephemeral_sync_url = f"sqlite:///{tmp_db_path}"
        ephemeral_async_url = f"sqlite+aiosqlite:///{tmp_db_path}"

    # Create engines
    new_async = create_async_engine(ephemeral_async_url, echo=False, future=True)
    new_sync = create_sync_engine(ephemeral_sync_url, echo=False, future=True)

    # Patch module attributes
    monkeypatch.setattr(bd, "async_engine", new_async, raising=False)
    monkeypatch.setattr(bd, "sync_engine", new_sync, raising=False)
    monkeypatch.setattr(bd, "DATABASE_URL", ephemeral_async_url, raising=False)

    # Also patch any already-imported modules that may have captured the
    # original engines at import-time (common during pytest collection).
    # This is defensive: some modules import `async_engine` or `sync_engine`
    # into their module scope and won't pick up monkeypatching of backend.database
    # alone. Iterate sys.modules and overwrite those attributes where present.
    import sys

    for mod_name, mod in list(sys.modules.items()):
        try:
            # Only patch actual module objects
            if not hasattr(mod, "__dict__"):
                continue
            if hasattr(mod, "async_engine"):
                try:
                    monkeypatch.setattr(mod, "async_engine", new_async, raising=False)
                except Exception:
                    pass
            if hasattr(mod, "sync_engine"):
                try:
                    monkeypatch.setattr(mod, "sync_engine", new_sync, raising=False)
                except Exception:
                    pass
        except Exception:
            # Be conservative - don't fail fixture patching because an unrelated
            # imported object isn't patchable.
            continue

    # Diagnostic: print engine URLs we patched (helps debug when pytest shows
    # mismatched DB state between async and sync sessions).
    try:
        print("[ephemeral_db] patched DATABASE_URL=", getattr(bd, "DATABASE_URL", None))
        print("[ephemeral_db] backend.sync_engine=", getattr(bd, "sync_engine", None))
        print("[ephemeral_db] backend.async_engine=", getattr(bd, "async_engine", None))
        # If pipeline module is present, show its async_engine too
        try:
            import backend.ingestion.pipeline.nba_ingestion_pipeline as _nip

            print(
                "[ephemeral_db] pipeline.async_engine=",
                getattr(_nip, "async_engine", None),
            )
        except Exception:
            pass
    except Exception:
        pass

    # Also ensure ingestion pipeline module uses the patched async engine
    try:
        import backend.ingestion.pipeline.nba_ingestion_pipeline as nip

        monkeypatch.setattr(nip, "async_engine", new_async, raising=False)
    except Exception:
        # If the pipeline module isn't importable at fixture time, it's fine;
        # tests that import it later will pick up backend.database.async_engine
        pass

    # Ensure SQLModel metadata is created on the sync engine
    SQLModel.metadata.create_all(bind=new_sync)

    # Also create tables for traditional SQLAlchemy declarative Base models
    # (e.g. ingestion pipeline models that subclass backend.models.base.Base)
    models_base.Base.metadata.create_all(bind=new_sync)

    try:
        yield
    finally:
        # Dispose async engine
        try:
            import asyncio

            loop = asyncio.get_event_loop()
            loop.run_until_complete(new_async.dispose())
        except Exception:
            # Best-effort dispose; ignore in CI if event loop differs
            pass
        # Dispose sync engine to ensure underlying DB connections are closed
        try:
            new_sync.dispose()
        except Exception:
            # Ignore disposal errors during teardown
            pass

        # Restore originals
        if orig_sync is not None:
            monkeypatch.setattr(bd, "sync_engine", orig_sync, raising=False)
        if orig_async is not None:
            monkeypatch.setattr(bd, "async_engine", orig_async, raising=False)
        if orig_db_url is not None:
            monkeypatch.setattr(bd, "DATABASE_URL", orig_db_url, raising=False)
        # Remove temporary DB file if we created one
        try:
            if tmp_db_path is not None:
                os.unlink(tmp_db_path)
        except Exception:
            pass
