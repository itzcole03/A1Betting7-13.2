import pytest

# Ensure pytest-asyncio plugin is available for async tests collected under tests/llm
pytest_plugins = ["pytest_asyncio"]
from fastapi.testclient import TestClient


# Canonical app fixture for all tests - SINGLE SOURCE OF TRUTH
@pytest.fixture(scope="session")
def test_app():
    """
    Use the canonical app factory to ensure tests run against the same app as production.
    This eliminates 404s and fixture drift by using the ONLY app entry point.
    """
    from backend.core.app import create_app
    return create_app()


from unittest.mock import MagicMock, patch

import os
import pytest
from sqlmodel import SQLModel

# Force tests to use an in-memory SQLite database to avoid persistent DB conflicts
# Set this before importing backend.database (which reads DATABASE_URL at import time)
os.environ.setdefault('DATABASE_URL', 'sqlite+aiosqlite:///:memory:')

from backend.database import sync_engine
from backend.models.base import Base
from backend.models.user import User, UserORM


@pytest.fixture(scope="session", autouse=True)
def create_all_tables():
    """Ensure all tables are created before any tests run."""
    SQLModel.metadata.create_all(bind=sync_engine)
    Base.metadata.create_all(bind=sync_engine)


@pytest.fixture(scope="session", autouse=True)
def mock_database_health():
    """Mock database health check to always return healthy"""
    with patch("backend.enhanced_database.db_manager.health_check") as mock_health:
        # Create a mock health status that's always healthy
        mock_status = MagicMock()
        mock_status.is_healthy = True
        mock_status.primary_available = True
        mock_status.fallback_available = True
        mock_status.response_time = "test_mode"
        mock_status.uptime = "operational"

        mock_health.return_value = mock_status
        yield mock_health


@pytest.fixture(scope="session")
def create_test_user():
    """Create a persistent-in-session test user if missing and return the user id.

    This helps bookmark tests and other user-scoped tests avoid UNIQUE constraint
    failures when run repeatedly in the same CI runner or local session.
    """
    from sqlmodel import Session
    from backend.database import sync_engine

    user_id = "test-user-1"

    with Session(sync_engine) as session:
        existing = session.get(User, user_id)
        if existing is None:
            # Create a minimal user record. Use username unique field to avoid
            # collisions; if the user already exists, the get() check prevents insert.
            user = User(id=user_id, username="test_user_1", email="test+1@example.com")
            session.add(user)
            session.commit()
    return user_id
