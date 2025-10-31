"""Small compatibility helper for awaiting session.execute vs session.exec.

Many code paths in this repository run against a mix of SQLAlchemy AsyncSession
and SQLModel sessions. SQLModel exposes `exec()` while SQLAlchemy uses
`execute()`. To make conservative, import-time-safe edits we provide a tiny
helper that prefers `exec()` when available and falls back to `execute()`.

Keep this module minimal and dependency-free so it can be imported at test
collection/import time safely.
"""

from typing import Any


async def unified_session_execute(session: Any, statement: Any, *args, **kwargs):
    """Await a statement using SQLModel's exec() when present, otherwise
    fall back to SQLAlchemy's execute().

    This keeps call sites portable without changing their behavior.
    """
    exec_fn = getattr(session, "exec", None)
    if callable(exec_fn):
        return await exec_fn(statement, *args, **kwargs)
    return await session.execute(statement, *args, **kwargs)
