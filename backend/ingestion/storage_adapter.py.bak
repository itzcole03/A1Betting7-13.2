from typing import Protocol, List, Dict, Any


class StorageAdapter(Protocol):
    async def upload_snapshot(self, key: str, data: Dict[str, Any]) -> None:
        ...

    async def list_snapshots(self, prefix: str = "") -> List[str]:
        ...


class InMemoryStorageAdapter:
    def __init__(self):
        self._store: Dict[str, Dict[str, Any]] = {}

    async def upload_snapshot(self, key: str, data: Dict[str, Any]) -> None:
        self._store[key] = data

    async def list_snapshots(self, prefix: str = "") -> List[str]:
        return [k for k in self._store.keys() if k.startswith(prefix)]


class LocalFileStorageAdapter:
    """Simple local filesystem adapter for snapshots (safe default for local dev)."""
    def __init__(self, base_path: str = None):
        import os
        from pathlib import Path

        self.base = Path(base_path or (Path.cwd() / "snapshots"))
        os.makedirs(self.base, exist_ok=True)

    def _encode_key(self, key: str) -> str:
        import base64

        b = key.encode("utf-8")
        s = base64.urlsafe_b64encode(b).decode("ascii")
        # strip padding
        return s.rstrip("=")

    def _decode_key(self, encoded: str) -> str:
        import base64

        s = encoded
        # restore padding
        padding = 4 - (len(s) % 4)
        if padding and padding != 4:
            s = s + ("=" * padding)
        return base64.urlsafe_b64decode(s.encode("ascii")).decode("utf-8")

    async def upload_snapshot(self, key: str, data: Dict[str, Any]) -> None:
        import json

        filename = f"{self._encode_key(key)}.json"
        path = self.base / filename
        with open(path, "w", encoding="utf-8") as fh:
            json.dump(data, fh)

    async def list_snapshots(self, prefix: str = "") -> List[str]:
        from pathlib import Path
        files: List[str] = []
        # prefix is on the original key; encode it to match filenames
        enc_prefix = self._encode_key(prefix) if prefix else ""
        pattern = f"{enc_prefix}*.json" if enc_prefix else "*.json"
        for p in Path(self.base).glob(pattern):
            stem = p.stem
            try:
                decoded = self._decode_key(stem)
            except Exception:
                # skip files that don't decode
                continue
            files.append(decoded)
        return files


class S3StorageAdapter:
    """S3-backed adapter. boto3 is optional; import guarded to avoid required dependency in tests."""
    def __init__(self, bucket: str, prefix: str = ""):
        try:
            import boto3
        except Exception:
            raise ImportError("boto3 is required for S3StorageAdapter")

        self.bucket = bucket
        self.prefix = prefix or ""
        self.s3 = boto3.client("s3")

    async def upload_snapshot(self, key: str, data: Dict[str, Any]) -> None:
        import json
        from io import BytesIO

        body = json.dumps(data).encode("utf-8")
        # boto3 is sync; run in thread pool to avoid blocking event loop
        def _put():
            self.s3.put_object(Bucket=self.bucket, Key=f"{self.prefix}{key}.json", Body=body)

        import asyncio
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, _put)

    async def list_snapshots(self, prefix: str = "") -> List[str]:
        def _list():
            paginator = self.s3.get_paginator("list_objects_v2")
            res = []
            for page in paginator.paginate(Bucket=self.bucket, Prefix=f"{self.prefix}{prefix}"):
                for obj in page.get("Contents", []):
                    key = obj.get("Key")
                    if key and key.endswith(".json"):
                        res.append(key.rsplit("/", 1)[-1].rsplit(".json", 1)[0])
            return res

        import asyncio
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, _list)
