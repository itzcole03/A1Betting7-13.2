import json
import logging
import os
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel

router = APIRouter()
logger = logging.getLogger(__name__)


class FeedbackRequest(BaseModel):
    type: str
    rating: int
    message: str
    feature: Optional[str] = None
    userAgent: Optional[str] = None
    url: Optional[str] = None
    timestamp: Optional[str] = None


class FeedbackResponse(BaseModel):
    success: bool
    message: str
    feedback_id: Optional[str] = None


def _save_feedback_local(feedback: FeedbackRequest) -> str:
    feedback_dir = os.path.join("data", "feedback")
    os.makedirs(feedback_dir, exist_ok=True)
    feedback_id = f"feedback_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S%f')}"
    # Safe serialize: prefer Pydantic v2 model_dump, fall back to .dict(), then __dict__
    try:
        if hasattr(feedback, "model_dump") and callable(
            getattr(feedback, "model_dump")
        ):
            payload = feedback.model_dump()
        else:
            payload = feedback.dict()
    except Exception:
        payload = dict(getattr(feedback, "__dict__", {}) or {})
    payload["received_at"] = datetime.now(timezone.utc).isoformat()
    path = os.path.join(feedback_dir, f"{feedback_id}.json")
    try:
        with open(path, "w", encoding="utf-8") as fh:
            json.dump(payload, fh, indent=2)
    except Exception:
        logger.exception("Failed to write feedback to local file")
    return feedback_id


@router.post("/feedback", response_model=FeedbackResponse)
async def submit_feedback(feedback: FeedbackRequest, background_tasks: BackgroundTasks):
    if not 0 <= feedback.rating <= 5:
        raise HTTPException(status_code=400, detail="Rating must be between 0 and 5")

    feedback_id = _save_feedback_local(feedback)
    background_tasks.add_task(lambda: None)
    return FeedbackResponse(
        success=True, message="Feedback received", feedback_id=feedback_id
    )


@router.get("/feedback/stats")
async def feedback_stats() -> Dict[str, Any]:
    feedback_dir = os.path.join("data", "feedback")
    if not os.path.exists(feedback_dir):
        return {"success": True, "data": {"total_feedback": 0}, "error": None}

    files = [f for f in os.listdir(feedback_dir) if f.endswith(".json")]
    return {"success": True, "data": {"total_feedback": len(files)}, "error": None}
