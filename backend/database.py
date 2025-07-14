import os
from typing import Any

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Database URL
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./a1betting.db")

# Create engine
engine = create_engine(DATABASE_URL)

# Create session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Create all tables
def create_tables():
    """Create all database tables."""
    Base.metadata.create_all(bind=engine)


# Alias get_db to get_db_session for FastAPI dependencies
get_db_session = get_db


class DBManager:
    """Asynchronous database manager placeholder for production usage."""

    def __init__(self):
        self.async_engine = None

    async def initialize(self):
        """Initialize async engine (no-op placeholder)."""
        # Placeholder for async database initialization

    async def dispose(self):
        """Dispose async engine (no-op placeholder)."""

    def get_session(self):
        """Get a sync session (placeholder for async session)."""
        return SessionLocal()


# Instantiate the DB manager
db_manager = DBManager()


# Placeholder class for model performance records to satisfy imports in model_service
class ModelPerformance:
    """Placeholder for model performance DB model."""

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        # Empty implementation - this is just a placeholder class
        pass


# Removed unused PredictionModel import to fix import errors
