import asyncio
import uuid
from typing import Dict, Any, Optional


class InMemoryJobStore:
    def __init__(self):
        self._jobs: Dict[str, Dict[str, Any]] = {}

    async def create_job(self, payload: Dict[str, Any]) -> str:
        job_id = str(uuid.uuid4())
        job = {"id": job_id, "status": "queued", "payload": payload}
        self._jobs[job_id] = job
        return job_id

    async def get_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        return self._jobs.get(job_id)


class RedisJobStore:
    def __init__(self, redis_client):
        self.redis = redis_client

    async def create_job(self, payload: Dict[str, Any]) -> str:
        import json
        job_id = str(uuid.uuid4())
        job = {"id": job_id, "status": "queued", "payload": payload}
        await self.redis.set(f"backfill:job:{job_id}", json.dumps(job))
        return job_id

    async def get_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        import json
        raw = await self.redis.get(f"backfill:job:{job_id}")
        if not raw:
            return None
        return json.loads(raw)


class BackfillManager:
    def __init__(self, job_store=None):
        # job_store must implement create_job(payload) and get_job(job_id)
        self.job_store = job_store or InMemoryJobStore()

    async def enqueue_backfill(self, start: str, end: str) -> str:
        payload = {"start": start, "end": end}
        job_id = await self.job_store.create_job(payload)
        # In real system we'd schedule a background task here; simulate with a noop
        asyncio.create_task(self._simulate_work(job_id))
        return job_id

    async def get_status(self, job_id: str) -> Optional[Dict[str, Any]]:
        return await self.job_store.get_job(job_id)

    async def _simulate_work(self, job_id: str):
        # simulate work and mark completed if using in-memory store
        await asyncio.sleep(0.1)
        job = await self.job_store.get_job(job_id)
        if job is not None:
            job["status"] = "completed"
