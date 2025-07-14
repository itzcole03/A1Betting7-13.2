from typing import Dict, List

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

# In-memory log store for demonstration (replace with persistent logging in prod)
LOGS: List[Dict] = []


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
    LOGS.append(entry.dict())
    return {"status": "ok"}


@router.get("/admin/users", response_model=List[User])
def list_users():
    return USERS


@router.get("/admin/health")
def health_check():
    return {"status": "ok"}
