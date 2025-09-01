import asyncio
from datetime import date

from backend.ingestion.backfill_worker import BackfillWorker
from backend.ingestion.storage_adapter import InMemoryStorageAdapter


def dummy_fetcher(d: date):
    return {"date": d.isoformat(), "props": [f"prop-{d.isoformat()}"]}


def test_backfill_chunking_and_store():
    storage = InMemoryStorageAdapter()
    worker = BackfillWorker(fetcher=dummy_fetcher, storage=storage)

    start = date.fromisoformat("2025-08-01")
    end = date.fromisoformat("2025-08-10")

    results = asyncio.run(worker.backfill_range(start, end, chunk_days=5, dry_run=False))

    # Expect two chunks: 2025-08-01..2025-08-05 and 2025-08-06..2025-08-10
    assert any(r.get("status") == "stored" for r in results)
    keys = asyncio.run(storage.list_snapshots(prefix="backfill:"))
    assert len(keys) == 2


def test_backfill_idempotency():
    storage = InMemoryStorageAdapter()
    worker = BackfillWorker(fetcher=dummy_fetcher, storage=storage)

    start = date.fromisoformat("2025-08-01")
    end = date.fromisoformat("2025-08-03")

    # First run: store
    r1 = asyncio.run(worker.backfill_range(start, end, chunk_days=7, dry_run=False))
    # Second run: should skip existing
    r2 = asyncio.run(worker.backfill_range(start, end, chunk_days=7, dry_run=False))

    assert any(item.get("status") == "stored" for item in r1)
    assert any(item.get("status") == "skipped" for item in r2)
