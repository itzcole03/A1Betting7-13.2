from typing import Dict, List

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

# In-memory log store for demonstration (replace with persistent logging in prod)
LOGS: List[Dict] = []


# Safe serializer helper (prefer model_dump then dict then __dict__)
def _safe_dump(obj):
    try:
        if hasattr(obj, "model_dump") and callable(getattr(obj, "model_dump")):
            return obj.model_dump()
    except Exception:
        pass
    try:
        if hasattr(obj, "dict") and callable(getattr(obj, "dict")):
            return obj.dict()
    except Exception:
        pass
    try:
        return dict(getattr(obj, "__dict__", {}) or {})
    except Exception:
        return str(obj)


class LogEntry(BaseModel):
    timestamp: str
    level: str
    message: str


class User(BaseModel):
    id: int
    username: str
    is_admin: bool


USERS = [
    User(id=1, username="admin", is_admin=True),
    User(id=2, username="user1", is_admin=False),
]


@router.get("/admin/logs", response_model=List[LogEntry])
def get_logs():
    return LOGS[-100:]


@router.post("/admin/logs")
def add_log(entry: LogEntry):
    LOGS.append(_safe_dump(entry))
    return {"status": "ok"}


@router.get("/admin/users", response_model=List[User])
def list_users():
    return USERS


@router.get("/admin/health")
def health_check():
    return {"status": "ok"}
