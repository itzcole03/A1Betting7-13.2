"""
CLV Metrics Test Fixtures

Provides shared fixtures for CLV-related tests with proper async mocking
and dependency injection overrides.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient
from typing import List, Dict, Any


@pytest.fixture
def mock_clv_enabled_config():
    """Mock unified config with CLV metrics enabled."""
    with patch('backend.services.unified_config.unified_config') as mock_config:
        mock_performance_config = MagicMock()
        mock_performance_config.enable_clv_metrics = True
        mock_config.get_config.return_value.performance = mock_performance_config
        yield mock_config


@pytest.fixture
def mock_clv_disabled_config():
    """Mock unified config with CLV metrics disabled."""
    with patch('backend.services.unified_config.unified_config') as mock_config:
        mock_performance_config = MagicMock()
        mock_performance_config.enable_clv_metrics = False
        mock_config.get_config.return_value.performance = mock_performance_config
        yield mock_config


@pytest.fixture
def mock_propfinder_service():
    """Mock SimplePropFinderService with AsyncMock for async methods."""
    mock_service = MagicMock()
    
    # Sample opportunity data
    sample_opportunities = [
        {
            "id": "test1",
            "player": "Test Player",
            "team": "TEST",
            "sport": "MLB",
            "market": "Hits",
            "line": 1.5,
            "odds": 110,
            "confidence": 75.0
        },
        {
            "id": "test2", 
            "player": "Another Player",
            "team": "TEST2",
            "sport": "MLB",
            "market": "Runs",
            "line": 0.5,
            "odds": -120,
            "confidence": 82.0
        }
    ]
    
    # Use AsyncMock for async methods
    mock_service.get_prop_opportunities = AsyncMock(return_value=sample_opportunities)
    mock_service._initialize_services = AsyncMock(return_value=None)
    
    return mock_service


@pytest.fixture
def mock_clv_metrics_service():
    """Mock CLVMetricsService for testing."""
    mock_service = MagicMock()
    mock_service.record_success.return_value = None
    mock_service.record_failure.return_value = None
    mock_service.get_snapshot.return_value = {
        "success_rate": 95.5,
        "failure_rate": 4.5,
        "avg_latency_ms": 120.0,
        "processed_total": 100,
        "enabled": True,
        "window_size": 1000
    }
    return mock_service


@pytest.fixture
def mock_bookmark_service():
    """Mock BookmarkService."""
    mock_service = MagicMock()
    mock_service.get_user_bookmarks = AsyncMock(return_value=[])
    return mock_service


@pytest.fixture
def clv_test_client(mock_propfinder_service, mock_bookmark_service):
    """Test client with properly mocked dependencies for CLV tests."""
    from backend.main import app
    from backend.routes.propfinder_routes import get_simple_propfinder_service, get_bookmark_service
    
    # Override dependencies
    app.dependency_overrides[get_simple_propfinder_service] = lambda: mock_propfinder_service
    app.dependency_overrides[get_bookmark_service] = lambda: mock_bookmark_service
    
    with TestClient(app) as client:
        yield client
    
    # Clean up overrides
    app.dependency_overrides.clear()


@pytest.fixture
def sample_clv_data():
    """Sample CLV computation results for testing."""
    return {
        "clv_estimate": 0.15,
        "market_efficiency": 0.85,
        "historical_edge": 0.12,
        "line_movement_indicator": "stable"
    }


def enrich_opportunities_with_clv(opportunities: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Helper function to add CLV metrics to opportunities for testing."""
    enriched = []
    for opp in opportunities:
        opp_copy = opp.copy()
        opp_copy["clv_metrics"] = {
            "clv_estimate": 0.15,
            "market_efficiency": 0.85,
            "historical_edge": 0.12,
            "line_movement_indicator": "stable"
        }
        enriched.append(opp_copy)
    return enriched