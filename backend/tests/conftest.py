from unittest.mock import MagicMock, patch

import pytest
from sqlmodel import SQLModel

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
