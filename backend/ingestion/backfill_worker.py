import asyncio
from datetime import date, timedelta, datetime
from typing import Callable, Iterable, List, Optional

from ..services import cache
from .storage_adapter import InMemoryStorageAdapter, StorageAdapter


DEFAULT_CHUNK_DAYS = 7


def _date_range(start: date, end: date, step_days: int) -> Iterable[date]:
    cur = start
    while cur <= end:
        yield cur
        cur = cur + timedelta(days=step_days)


class BackfillWorker:
    def __init__(self, fetcher: Callable[[date], dict], storage: Optional[StorageAdapter] = None):
        self.fetcher = fetcher
        self.storage = storage if storage is not None else InMemoryStorageAdapter()

    async def backfill_range(self, start: date, end: date, chunk_days: int = DEFAULT_CHUNK_DAYS, dry_run: bool = False):
        tasks = []
        for chunk_start in _date_range(start, end, chunk_days):
            chunk_end = min(end, chunk_start + timedelta(days=chunk_days - 1))
            tasks.append(self._process_chunk(chunk_start, chunk_end, dry_run))

        # Process sequentially to keep memory & external rate limits predictable
        results = []
        for t in tasks:
            results.append(await t)
        return results

    async def _process_chunk(self, chunk_start: date, chunk_end: date, dry_run: bool):
        key = f"backfill:{chunk_start.isoformat()}:{chunk_end.isoformat()}"

        # Idempotency: skip if snapshot already exists
        existing = await self.storage.list_snapshots(prefix=key)
        if existing:
            return {"key": key, "status": "skipped", "reason": "already_exists"}

        # Fetch data (synchronous fetcher allowed, wrap in executor)
        loop = asyncio.get_running_loop()
        try:
            result = await loop.run_in_executor(None, lambda: self.fetcher(chunk_start))
        except Exception as e:
            return {"key": key, "status": "failed", "error": str(e)}

        snapshot = {
            "start": chunk_start.isoformat(),
            "end": chunk_end.isoformat(),
            "fetched_at": datetime.utcnow().isoformat(),
            "data": result,
        }

        if dry_run:
            return {"key": key, "status": "dry_run", "snapshot_size": len(str(snapshot))}

        await self.storage.upload_snapshot(key, snapshot)
        return {"key": key, "status": "stored"}


def cli_main(fetcher: Callable[[date], dict]):
    import argparse

    parser = argparse.ArgumentParser(description="Backfill snapshots over a date range")
    parser.add_argument("--start", required=True)
    parser.add_argument("--end", required=True)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    start = date.fromisoformat(args.start)
    end = date.fromisoformat(args.end)

    worker = BackfillWorker(fetcher=fetcher)

    asyncio.run(worker.backfill_range(start, end, dry_run=args.dry_run))


if __name__ == "__main__":
    # Example fetcher used for local runs (replace with real unified_data_fetcher connector)
    def dummy_fetcher(d: date):
        return {"date": d.isoformat(), "props": []}

    cli_main(dummy_fetcher)
