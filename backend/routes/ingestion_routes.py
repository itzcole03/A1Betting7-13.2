from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from backend.core.app import ok
from backend.core.exceptions import BusinessLogicException

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
        # Return canonical response envelope
        return ok({"result": result})
    except Exception as e:
        # Normalize to BusinessLogicException so global handler formats response
        raise BusinessLogicException(str(e), status_code=500) from e


@router.post("/backfill")
async def backfill(req: BackfillRequest):
    try:
        # stub: implement backfill worker separately
        # For now acknowledge request and return accepted status
        payload = {
            "start_date": req.start_date,
            "end_date": req.end_date,
            "dry_run": req.dry_run,
        }
        # Use canonical envelope and return 202 Accepted
        return JSONResponse(status_code=202, content=ok(payload))
    except Exception as e:
        raise BusinessLogicException(str(e), status_code=500) from e
