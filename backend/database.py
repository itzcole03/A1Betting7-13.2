"""Minimal database shim for development and tests.

Some modules import ``backend.database`` at import-time. In CI/dev the
full database wiring may be provided elsewhere; create a lightweight
async_engine export so route registration succeeds in local/dev runs.

This file intentionally keeps the surface area small: it exposes
``async_engine`` (SQLAlchemy AsyncEngine) and a helper to create
async sessions when needed.
"""

from __future__ import annotations

import logging
import os
from typing import Optional

try:
    from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine
except Exception:  # pragma: no cover - defensive for environments without SQLAlchemy
    create_async_engine = None  # type: ignore
    AsyncEngine = object  # type: ignore

logger = logging.getLogger(__name__)

# Default to a local sqlite aiosqlite DB for development if not provided.
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///a1betting.db")

async_engine: Optional[AsyncEngine] = None

if create_async_engine is not None:
    try:
        async_engine = create_async_engine(
            DATABASE_URL,
            echo=False,
            future=True,
        )
    except Exception:
        logger.exception("Failed to create async_engine for %s", DATABASE_URL)
        async_engine = None
else:
    logger.warning("SQLAlchemy async engine factory not available; database disabled")

__all__ = ["async_engine", "DATABASE_URL"]

# Provide lightweight dependency helpers expected by some modules.
from contextlib import asynccontextmanager
from typing import AsyncGenerator


@asynccontextmanager
async def get_async_session() -> AsyncGenerator[object, None]:
    """Async session dependency shim.

    Returns an async context manager that yields a SQLAlchemy AsyncSession
    when the engine and SQLAlchemy are available. If SQLAlchemy is not
    installed or engine creation failed, this yields None but does not
    crash import-time; callers should handle the missing session.
    """
    if async_engine is None:
        logger.debug("get_async_session: async_engine not configured; yielding None")
        yield None
        return

    try:
        # Import lazily so this module remains import-safe when SQLAlchemy
        # is not installed in the environment used for quick local runs.
        from sqlalchemy.ext.asyncio import AsyncSession
        from sqlalchemy.orm import sessionmaker

        async_session_factory = sessionmaker(
            async_engine, class_=AsyncSession, expire_on_commit=False
        )

        async with async_session_factory() as session:  # type: ignore
            yield session
    except Exception:
        logger.exception("get_async_session: failed to create async session")
        yield None


def get_db():
    """Synchronous DB dependency shim used by a few legacy routes.

    For development we intentionally raise a clear error so callers know
    they should prefer async dependencies. This keeps import-time stable
    while surfacing a useful message at call-time.
    """
    raise RuntimeError(
        "Synchronous DB access not configured in the dev shim; use get_async_session"
    )


__all__.extend(["get_async_session", "get_db"])
