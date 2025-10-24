from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from backend.ingestion.backfill_manager import BackfillManager

router = APIRouter(prefix="/api/ingestion/admin", tags=["ingestion-admin"])


class BackfillRequest(BaseModel):
    # Accept both `start`/`end` and `start_date`/`end_date` to be compatible
    # with existing validation and external callers.
    start: str | None = None
    end: str | None = None
    start_date: str | None = None
    end_date: str | None = None

    def get_range(self) -> tuple[str, str]:
        s = self.start or self.start_date
        e = self.end or self.end_date
        if not s or not e:
            raise ValueError("start and end dates are required")
        return s, e


# Simple singleton manager for now (in real app use DI / registry)
_manager = BackfillManager()


@router.post("/backfill")
async def enqueue_backfill(req: BackfillRequest):
    try:
        s, e = req.get_range()
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    job_id = await _manager.enqueue_backfill(s, e)
    return {"job_id": job_id}


@router.get("/backfill/{job_id}")
async def get_backfill_status(job_id: str):
    job = await _manager.get_status(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="job not found")
    return job
