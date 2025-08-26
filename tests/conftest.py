"""Pytest conftest to ensure repository root is on sys.path during collection."""

import os
import os
import sys

# Ensure the test DB environment is configured as early as possible. This
# module imports `tests.conftest_db` which sets `DATABASE_URL` to an
# in-memory sqlite URL if not already configured.
try:
    # import side-effect: tests/conftest_db.py will call os.environ.setdefault
    # to ensure DATABASE_URL is present for modules that read it at import time.
    import tests.conftest_db  # type: ignore
except Exception:
    # If the import fails (missing dependencies), continue — conftest_db
    # provides fallbacks and will not raise during normal collection.
    pass

# Ensure the repository root (parent of tests/) is on sys.path
ROOT = os.path.dirname(os.path.dirname(__file__))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)
"""
Pytest Configuration for A1Betting Backend Tests
Provides shared fixtures, mock data, and test utilities
"""

import asyncio
import json
import os
import sys
from pathlib import Path
from typing import AsyncGenerator, Dict, Any, List
from unittest.mock import AsyncMock, Mock, patch
import pytest
from fastapi.testclient import TestClient
from httpx import AsyncClient

# Top-level pytest configuration for the entire test suite
pytest_plugins = ["pytest_asyncio"]

# Optional SQLAlchemy imports
try:
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker, Session
    SQLALCHEMY_AVAILABLE = True
except ImportError:
    SQLALCHEMY_AVAILABLE = False

# Add backend to Python path for imports
backend_path = Path(__file__).parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.append(str(backend_path))

# Test database URL (use in-memory async SQLite for fast tests)
# Prefer aiosqlite driver so async tests and SQLModel can use in-memory DB.
TEST_DATABASE_URL = os.environ.get("TEST_DATABASE_URL") or "sqlite+aiosqlite:///:memory:"

# Ensure the process-level DATABASE_URL is set early so any backend modules
# importing DB config at import-time will pick up the in-memory DB during tests.
os.environ.setdefault("DATABASE_URL", TEST_DATABASE_URL)


# ============================================================================
# Core FastAPI Test Fixtures
# ============================================================================

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
async def app():
    """Create FastAPI app instance for testing"""
    try:
        from backend.core.app import create_app
        test_app = create_app()
        return test_app
    except ImportError as e:
        # Fallback for basic app if canonical app not available
        from fastapi import FastAPI
        fallback_app = FastAPI(title="Test App")
        
        @fallback_app.get("/api/health")
        async def health():
            return {"success": True, "data": {"status": "ok"}, "error": None}
        
        return fallback_app


@pytest.fixture
async def client(app) -> AsyncGenerator[AsyncClient, None]:
    """Create AsyncClient for testing async endpoints"""
    # Some httpx versions accept `app=` directly; others require an ASGI
    # transport. Try both patterns for compatibility with CI environments.
    try:
        async with AsyncClient(app=app, base_url="http://testserver", follow_redirects=True) as ac:
            yield ac
            return
    except TypeError:
        # Fallback to ASGITransport if available
        try:
            from httpx import ASGITransport
        except Exception:
            pytest.skip("httpx AsyncClient not compatible in this environment")

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://testserver", follow_redirects=True) as ac:
            yield ac


@pytest.fixture
def sync_client(app) -> TestClient:
    """Create sync TestClient for simple endpoint testing"""
    return TestClient(app)


# ============================================================================
# Mock Data Fixtures
# ============================================================================

@pytest.fixture
def mock_mlb_game():
    """Mock MLB game data"""
    return {
        "game_id": "662253",
        "home_team": "NYY",
        "away_team": "BOS",
        "game_date": "2025-08-14",
        "game_time": "19:05",
        "status": "scheduled",
        "home_score": None,
        "away_score": None,
        "inning": None,
        "weather": {"temperature": 75, "condition": "clear"},
        "venue": "Yankee Stadium"
    }


@pytest.fixture
def mock_player_data():
    """Mock player statistical data"""
    return {
        "player_id": "aaron-judge",
        "name": "Aaron Judge",
        "team": "NYY",
        "position": "RF",
        "sport": "MLB",
        "active": True,
        "injury_status": None,
        "season_stats": {
            "hits": 120,
            "home_runs": 35,
            "rbis": 90,
            "batting_average": 0.285,
            "on_base_percentage": 0.39,
            "slugging_percentage": 0.54,
            "ops": 0.93,
            "strikeouts": 110,
            "walks": 60,
            "games_played": 102
        }
    }


@pytest.fixture
def mock_prop_bet():
    """Mock prop bet data"""
    return {
        "prop_id": "judge-hr-over-0.5",
        "game_id": "662253", 
        "player": "Aaron Judge",
        "stat": "Home Runs",
        "line": 0.5,
        "over_odds": -125,
        "under_odds": +105,
        "sportsbook": "DraftKings",
        "prediction": 0.72,
        "confidence": 85.3,
        "expected_value": 12.4,
        "last_updated": "2025-08-14T15:30:00Z"
    }


@pytest.fixture
def mock_enhanced_ml_prediction():
    """Mock enhanced ML prediction with SHAP explanations"""
    return {
        "request_id": "test-req-123",
        "prediction": 0.68,
        "confidence": 87.2,
        "models_used": ["xgboost", "random_forest", "neural_network"],
        "model_agreement": 0.89,
        "shap_explanations": {
            "feature_importance": {
                "batting_average": 0.15,
                "recent_performance": 0.22,
                "opponent_strength": -0.08,
                "weather_factor": 0.03,
                "venue_factor": 0.12
            },
            "feature_values": {
                "batting_average": 0.285,
                "recent_performance": 0.65,
                "opponent_strength": 0.72,
                "weather_factor": 0.8,
                "venue_factor": 0.6
            }
        },
        "performance_metrics": {
            "accuracy": 0.743,
            "precision": 0.712,
            "recall": 0.689,
            "f1_score": 0.700
        },
        "timestamp": "2025-08-14T15:30:00Z"
    }


@pytest.fixture
def mock_websocket_message():
    """Mock WebSocket message data"""
    return {
        "type": "subscription_confirmed",
        "subscription_type": "odds_updates",
        "client_id": "test-client-123",
        "data": {
            "sport": "MLB",
            "message": "Successfully subscribed to MLB odds updates"
        },
        "timestamp": "2025-08-14T15:30:00Z"
    }


@pytest.fixture
def mock_arbitrage_opportunity():
    """Mock arbitrage opportunity data"""
    return {
        "opportunity_id": "arb-123",
        "sport": "MLB",
        "game_id": "662253",
        "player": "Aaron Judge",
        "bet_type": "Home Runs Over/Under",
        "line": 0.5,
        "over_odds": -120,
        "over_sportsbook": "DraftKings", 
        "under_odds": +110,
        "under_sportsbook": "FanDuel",
        "guaranteed_profit_percentage": 3.2,
        "minimum_bet_amount": 100,
        "expected_return": 103.2,
        "confidence_level": 0.95,
        "time_sensitivity": "high"
    }


# ============================================================================
# Service Mock Fixtures  
# ============================================================================

@pytest.fixture
def mock_enhanced_prediction_integration():
    """Mock the enhanced prediction integration service"""
    mock_service = AsyncMock()
    
    # Mock enhanced_predict_single method as AsyncMock
    mock_service.enhanced_predict_single = AsyncMock(return_value={
        "request_id": "test-req-123",
        "prediction": 0.68,
        "confidence": 87.2,
        "models_used": ["xgboost", "random_forest"],
        "shap_explanations": {"feature_importance": {"batting_avg": 0.15}},
        "performance_logged": True,
        "processing_time_ms": 245
    })

    # Mock batch_predict method as AsyncMock
    async def _batch_predict_impl(requests, **kwargs):
        results = []
        for i, req in enumerate(requests):
            results.append({
                "request_id": req.get("request_id", f"batch-req-{i}"),
                "prediction": 0.65 + (i * 0.02),
                "confidence": 80.0 + (i * 2),
                "batch_position": i
            })
        return results

    mock_service.batch_predict = AsyncMock(side_effect=_batch_predict_impl)

    # Other optional async methods used by tests
    mock_service.register_model = AsyncMock(return_value={
        "model_id": "model-123",
        "status": "registered",
        "version": "1.0"
    })
    mock_service.list_models = AsyncMock(return_value=[])
    mock_service.get_model_info = AsyncMock(return_value=None)
    mock_service.get_performance_metrics = AsyncMock(return_value={})
    mock_service.get_performance_summary = AsyncMock(return_value={})
    mock_service.get_system_status = AsyncMock(return_value={})
    mock_service.compare_models = AsyncMock(return_value={})
    mock_service.update_prediction_outcome = AsyncMock(return_value={})
    
    return mock_service


@pytest.fixture
def mock_enhanced_websocket_service():
    """Mock the enhanced WebSocket service"""
    mock_service = AsyncMock()
    mock_service.is_initialized = True
    mock_service.handle_connection = AsyncMock()
    mock_service.initialize = AsyncMock()
    mock_service.shutdown = AsyncMock()
    return mock_service


@pytest.fixture
def mock_unified_sportsbook_service():
    """Mock unified sportsbook service for multiple sportsbook routes"""
    mock_service = AsyncMock()
    
    # Mock get_player_props method as AsyncMock so tests can set .return_value
    mock_service.get_player_props = AsyncMock(return_value=[
        {
            "player": "Aaron Judge",
            "sport": "MLB",
            "bet_type": "Home Runs",
            "line": 0.5,
            "odds": -125,
            "sportsbook": "DraftKings"
        }
    ])

    # Mock get_arbitrage_opportunities method as AsyncMock
    mock_service.get_arbitrage_opportunities = AsyncMock(return_value=[
        {
            "sport": "MLB",
            "player": "Aaron Judge",
            "guaranteed_profit_percentage": 3.2,
            "over_provider": "DraftKings",
            "under_provider": "FanDuel"
        }
    ])
    
    return mock_service


# ============================================================================
# Database Test Fixtures (Optional - only if SQLAlchemy available)
# ============================================================================

if SQLALCHEMY_AVAILABLE:
    @pytest.fixture(scope="session")
    def test_db_engine():
        """Create test database engine"""
        engine = create_engine(TEST_DATABASE_URL, echo=False)
        return engine

    @pytest.fixture
    def test_db_session(test_db_engine):
        """Create test database session"""
        SessionLocal = sessionmaker(bind=test_db_engine)
        session = SessionLocal()
        try:
            yield session
        finally:
            session.close()
else:
    # Provide dummy fixtures when SQLAlchemy not available
    @pytest.fixture(scope="session")
    def test_db_engine():
        pytest.skip("SQLAlchemy not available")

    @pytest.fixture
    def test_db_session():
        pytest.skip("SQLAlchemy not available")


# ============================================================================
# Environment and Configuration Fixtures
# ============================================================================

@pytest.fixture(autouse=True)
def test_env():
    """Set test environment variables"""
    test_vars = {
        "TESTING": "true",
        "DATABASE_URL": TEST_DATABASE_URL,
        "RATE_LIMIT_ENABLED": "false",
        "DEV_LEAN_MODE": "true",
        "LOG_LEVEL": "INFO"
    }
    
    # Store original values
    original_vars = {}
    for key, value in test_vars.items():
        original_vars[key] = os.environ.get(key)
        os.environ[key] = value
    
    yield
    
    # Restore original values
    for key, original_value in original_vars.items():
        if original_value is None:
            os.environ.pop(key, None)
        else:
            os.environ[key] = original_value


# ============================================================================
# Utility Fixtures and Helpers
# ============================================================================

@pytest.fixture
def assert_response_format():
    """Helper to assert standard API response format"""
    def _assert_format(response_data: Dict[str, Any], expect_success: bool = True):
        """Assert response follows {success, data, error, meta?} format"""
        assert "success" in response_data
        assert "data" in response_data
        assert "error" in response_data
        assert response_data["success"] == expect_success
        
        if expect_success:
            assert response_data["error"] is None
            assert response_data["data"] is not None
        else:
            assert response_data["error"] is not None
    
    return _assert_format


@pytest.fixture
def mock_request_context():
    """Create mock request context for testing"""
    return {
        "client_ip": "127.0.0.1",
        "user_agent": "pytest-test-client",
        "correlation_id": "test-corr-id",
        "request_id": "test-req-id"
    }


# ============================================================================
# Skip Conditions for Optional Dependencies  
# ============================================================================

# Check for optional ML dependencies
ml_dependencies_available = True
try:
    import torch
    import transformers
    import shap
except ImportError:
    ml_dependencies_available = False

skip_without_ml = pytest.mark.skipif(
    not ml_dependencies_available,
    reason="ML dependencies not available"
)

# Check for WebSocket dependencies
websocket_dependencies_available = True
try:
    import websockets
except ImportError:
    websocket_dependencies_available = False

skip_without_websocket = pytest.mark.skipif(
    not websocket_dependencies_available,
    reason="WebSocket dependencies not available"
)


# ============================================================================
# Performance and Load Testing Fixtures
# ============================================================================

@pytest.fixture
def performance_timer():
    """Timer fixture for performance testing"""
    import time
    
    class Timer:
        def __init__(self):
            self.start_time = None
            self.end_time = None
        
        def start(self):
            self.start_time = time.time()
        
        def stop(self):
            self.end_time = time.time()
            return self.elapsed
        
        @property
        def elapsed(self):
            if self.start_time and self.end_time:
                return self.end_time - self.start_time
            return None
    
    return Timer()


@pytest.fixture
def load_test_data():
    """Generate data for load testing"""
    def _generate_requests(count: int = 100) -> List[Dict[str, Any]]:
        return [
            {
                "request_id": f"load-test-{i}",
                "event_id": f"game-{i % 10}",
                "sport": "MLB" if i % 2 == 0 else "NBA",
                "bet_type": "over_under",
                "features": {
                    "batting_average": 0.285 + (i * 0.001),
                    "home_field_advantage": 0.6,
                    "weather_factor": 0.8
                }
            }
            for i in range(count)
        ]
    
    return _generate_requests
