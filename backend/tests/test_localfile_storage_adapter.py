import asyncio
import shutil
from pathlib import Path

import pytest

from backend.ingestion.storage_adapter import LocalFileStorageAdapter


@pytest.mark.asyncio
async def test_localfile_upload_and_list(tmp_path):
    base = tmp_path / "snapshots"
    adapter = LocalFileStorageAdapter(base_path=str(base))

    key = "backfill:2025-08-01:2025-08-07"
    data = {"fetched_at": "2025-08-01T00:00:00Z", "items": [1, 2, 3]}

    await adapter.upload_snapshot(key, data)

    listed = await adapter.list_snapshots(prefix="backfill")

    assert key in listed

    # cleanup
    shutil.rmtree(base)
