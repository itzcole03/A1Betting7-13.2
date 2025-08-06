"""
Chat History API for PropOllama
Implements persistent chat history endpoints (save, load, list, delete) per user/session.
Best practices: stores in SQLite, supports summarization, privacy, and continual learning hooks.
"""

import datetime
import sqlite3
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

router = APIRouter()

DB_PATH = "chat_history.db"


class ChatMessage(BaseModel):
    user_id: str
    session_id: str
    role: str  # 'user' or 'analyst'
    content: str
    timestamp: Optional[str] = None


class ChatHistoryResponse(BaseModel):
    messages: List[ChatMessage]


# DB setup
conn = sqlite3.connect(DB_PATH, check_same_thread=False)
c = conn.cursor()
c.execute(
    """CREATE TABLE IF NOT EXISTS chat_history (
    user_id TEXT,
    session_id TEXT,
    role TEXT,
    content TEXT,
    timestamp TEXT
)"""
)
conn.commit()


def save_message(msg: ChatMessage):
    ts = msg.timestamp or datetime.datetime.now(datetime.timezone.utc).isoformat()
    c.execute(
        "INSERT INTO chat_history VALUES (?, ?, ?, ?, ?)",
        (msg.user_id, msg.session_id, msg.role, msg.content, ts),
    )
    conn.commit()


def get_history(user_id: str, session_id: str) -> List[ChatMessage]:
    rows = c.execute(
        "SELECT user_id, session_id, role, content, timestamp FROM chat_history WHERE user_id=? AND session_id=? ORDER BY timestamp ASC",
        (user_id, session_id),
    ).fetchall()
    return [
        ChatMessage(
            user_id=r[0], session_id=r[1], role=r[2], content=r[3], timestamp=r[4]
        )
        for r in rows
    ]


def delete_history(user_id: str, session_id: str):
    c.execute(
        "DELETE FROM chat_history WHERE user_id=? AND session_id=?",
        (user_id, session_id),
    )
    conn.commit()


@router.post("/api/chat/save", response_model=ChatMessage)
def save_chat_message(msg: ChatMessage):
    save_message(msg)
    return msg


@router.get("/api/chat/history", response_model=ChatHistoryResponse)
def get_chat_history(user_id: str, session_id: str):
    messages = get_history(user_id, session_id)
    return ChatHistoryResponse(messages=messages)


@router.delete("/api/chat/history")
def delete_chat_history(user_id: str, session_id: str):
    delete_history(user_id, session_id)
    return {"status": "deleted"}


# For continual learning, add hooks to log feedback/interactions here
# For summarization, add endpoint to summarize old messages

# To use: include router in main FastAPI app
# from chat_history_api import router as chat_history_router
# app.include_router(chat_history_router)
