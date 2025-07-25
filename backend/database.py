import asyncio
import os
from typing import Any

from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel import Session as SQLModelSession
from sqlmodel import SQLModel
from sqlmodel import create_engine as create_sqlmodel_engine
from sqlmodel.ext.asyncio.session import AsyncSession

# Database URL
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./a1betting.db")

# Create async engine
async_engine = create_async_engine(DATABASE_URL, echo=True, future=True)


# Create async session
async def get_async_session():
    async_session = AsyncSession(async_engine)
    try:
        yield async_session
    finally:
        await async_session.close()


# Legacy sync engine/session for compatibility
sync_engine = create_sqlmodel_engine(DATABASE_URL.replace("sqlite+aiosqlite", "sqlite"))
SessionLocal = SQLModelSession(sync_engine)


from backend.models.base import Base
from backend.models.user import User  # Ensure User model is registered for Alembic


# Dependency to get database session (sync for legacy, async for new)
def get_db():
    db = SessionLocal
    try:
        yield db
    finally:
        db.close()


# Create all tables (sync for legacy, async for new)
def create_tables():
    """Create all database tables (sync)."""
    SQLModel.metadata.create_all(bind=sync_engine)


async def create_tables_async():
    """Create all database tables (async)."""
    async with async_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)


# Alias get_db to get_db_session for FastAPI dependencies
get_db_session = get_db


class DBManager:
    """Database manager supporting async and sync operations."""

    def __init__(self):
        self.async_engine = async_engine
        self.sync_engine = sync_engine

    async def initialize(self):
        """Initialize async engine and create tables."""
        await create_tables_async()

    async def dispose(self):
        """Dispose async engine."""
        await self.async_engine.dispose()

    def get_session(self):
        """Get a sync session (legacy)."""
        return SessionLocal

    async def get_async_session(self):
        """Get an async session."""
        async_session = AsyncSession(self.async_engine)
        try:
            yield async_session
        finally:
            await async_session.close()


# Instantiate the DB manager
db_manager = DBManager()


# Placeholder class for model performance records to satisfy imports in model_service
class ModelPerformance:
    """Placeholder for model performance DB model."""

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        # Empty implementation - this is just a placeholder class
        pass


# Removed unused PredictionModel import to fix import errors
