from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/ingestion", tags=["ingestion"])


class BackfillRequest(BaseModel):
    start_date: str
    end_date: str
    dry_run: bool = False


@router.post("/run-once")
async def run_once():
    try:
        # local import to avoid import-time side effects
        from backend.ingestion import scheduler_runner

        result = await scheduler_runner.run_once()
        return {"status": "ok", "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/backfill")
async def backfill(req: BackfillRequest):
    try:
        # stub: implement backfill worker separately
        # For now acknowledge request and return accepted status
        return {"status": "accepted", "start_date": req.start_date, "end_date": req.end_date, "dry_run": req.dry_run}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
