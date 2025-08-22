"""
LLM Service Test Configuration

pytest configuration for LLM service tests.
"""

import pytest
import asyncio
from unittest.mock import patch
import os


@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests"""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(autouse=True)
def mock_environment():
    """Mock environment variables for testing"""
    with patch.dict(os.environ, {
        'DATABASE_URL': 'sqlite:///test.db',
        'REDIS_URL': 'redis://localhost:6379/1',
        'OPENAI_API_KEY': 'test_openai_key',
        'ENVIRONMENT': 'test'
    }):
        yield


@pytest.fixture
def mock_config():
    """Mock configuration for testing"""
    from unittest.mock import Mock
    
    config = Mock()
    config.llm.rate_limit_per_min = 60
    config.llm.max_tokens = 500
    config.llm.temperature = 0.7
    config.llm.timeout_sec = 30
    config.llm.allow_batch_prefetch = True
    config.llm.log_prompt_debug = False
    config.llm.cache_max_size = 1000
    config.llm.cache_ttl_sec = 3600
    
    return config


@pytest.fixture
def mock_database_session():
    """Mock database session for testing"""
    from unittest.mock import AsyncMock, Mock
    
    session = Mock()
    session.execute = AsyncMock()
    session.commit = AsyncMock()
    session.rollback = AsyncMock()
    session.scalar = AsyncMock()
    session.close = Mock()
    
    return session


# Pytest configuration


def pytest_configure(config):
    """Configure pytest"""
    config.addinivalue_line(
        "markers", "asyncio: mark test as async"
    )
    config.addinivalue_line(
        "markers", "integration: mark test as integration test"
    )
    config.addinivalue_line(
        "markers", "slow: mark test as slow"
    )


def pytest_collection_modifyitems(config, items):
    """Modify test collection"""
    for item in items:
        # Add asyncio marker to async tests
        if asyncio.iscoroutinefunction(item.function):
            item.add_marker(pytest.mark.asyncio)