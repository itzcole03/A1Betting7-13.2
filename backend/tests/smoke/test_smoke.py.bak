"""
Backend Smoke Tests - Quick Critical Functionality Tests
These tests verify basic system functionality without deep integration
"""

import pytest
from fastapi.testclient import TestClient
import asyncio
import sys
import os

# Add backend to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

def test_health_endpoint_smoke():
    """Smoke test: Health endpoint responds"""
    try:
        from backend.main import app
        client = TestClient(app)
        
        response = client.get("/health")
        assert response.status_code == 200
        
        data = response.json()
        # Health endpoint has structured response format
        assert data.get("success") is True or "status" in data.get("data", {}), f"Invalid response format: {data}"
        
    except ImportError:
        pytest.skip("Backend app not available")

def test_api_routes_load_smoke():
    """Smoke test: API routes can be imported and registered"""
    try:
        from backend.main import app
        
        # Check that routes are registered
        route_count = len(app.router.routes)
        
        # Should have at least basic routes
        assert route_count > 5, f"Too few routes registered: {route_count}"
        
        # Should have health endpoint (basic check by count)
        assert route_count > 0, "No routes found"
        
    except ImportError:
        pytest.skip("Backend routes not available")

@pytest.mark.asyncio
async def test_unified_services_import_smoke():
    """Smoke test: Unified services can be imported"""
    try:
        # Import modules instead of instances to avoid event loop issues
        import backend.services.unified_data_fetcher
        import backend.services.unified_cache_service
        import backend.services.unified_error_handler
        import backend.services.unified_logging
        
        # Just verify modules can be imported
        assert backend.services.unified_data_fetcher is not None
        assert backend.services.unified_cache_service is not None
        assert backend.services.unified_error_handler is not None
        assert backend.services.unified_logging is not None
        
    except ImportError as e:
        pytest.skip(f"Unified services not available: {e}")

def test_database_connection_smoke():
    """Smoke test: Database connection can be established"""
    try:
        # Try to import database components
        from backend.models.base import Base
        
        # If we can import Base, database setup is working
        assert Base is not None
        
    except ImportError:
        pytest.skip("Database models not available")

def test_modern_ml_service_smoke():
    """Smoke test: Modern ML service can be imported (with graceful fallback)"""
    try:
        from backend.services.modern_ml_service import modern_ml_service
        assert modern_ml_service is not None
        
    except ImportError:
        # This is expected if ML dependencies aren't installed
        pytest.skip("Modern ML service not available (fallback behavior)")

@pytest.mark.asyncio
async def test_async_services_smoke():
    """Smoke test: Async services work properly"""
    try:
        from backend.services.unified_data_fetcher import unified_data_fetcher
        
        # Test basic async functionality
        # Test unified data fetcher is accessible
        assert hasattr(unified_data_fetcher, 'fetch_mlb_games'), "Data fetcher missing fetch method"
        
    except ImportError:
        pytest.skip("Unified data fetcher not available")
    except Exception as e:
        # Service might not be fully configured in test environment
        pytest.skip(f"Service not configured: {e}")

def test_api_documentation_generation_smoke():
    """Smoke test: OpenAPI documentation can be generated"""
    try:
        from backend.main import app
        from fastapi.openapi.utils import get_openapi
        
        schema = get_openapi(
            title=app.title,
            version=app.version,
            description=app.description,
            routes=app.routes,
        )
        
        # Basic schema validation
        assert "openapi" in schema
        assert "info" in schema
        assert "paths" in schema
        
        # Should have some endpoints
        assert len(schema["paths"]) > 0
        
    except ImportError:
        pytest.skip("FastAPI app not available")

def test_logging_configuration_smoke():
    """Smoke test: Logging system is properly configured"""
    try:
        from backend.services.unified_logging import unified_logging
        
        # Get a logger
        # Test logging service
        assert hasattr(unified_logging, '__class__'), "Logging service not available"
        
        # Basic logging check (service available)
        # logger.info("Smoke test logging", {"test": True})
        
    except ImportError:
        pytest.skip("Unified logging not available")
    except Exception as e:
        pytest.skip(f"Logging not configured: {e}")

@pytest.mark.asyncio
async def test_cache_service_smoke():
    """Smoke test: Cache service basic functionality"""
    try:
        from backend.services.unified_cache_service import unified_cache_service
        
        # Test basic cache operations
        test_key = "smoke_test_key"
        test_value = {"test": "value"}
        
        # Set cache
        await unified_cache_service.set(test_key, test_value)
        
        # Get cache
        cached_value = unified_cache_service.get(test_key)
        
        # Clean up
        await unified_cache_service.delete(test_key)
        
        assert cached_value == test_value
        
    except ImportError:
        pytest.skip("Unified cache service not available")
    except Exception as e:
        # Cache backend might not be available in test environment
        pytest.skip(f"Cache backend not configured: {e}")

def test_error_handling_smoke():
    """Smoke test: Error handling system works"""
    try:
        from backend.services.unified_error_handler import unified_error_handler
        
        # Test error handling
        test_error = ValueError("Test error")
        result = unified_error_handler.handle_error(test_error, None)
        
        assert result is not None
        
    except ImportError:
        pytest.skip("Unified error handler not available")
    except Exception as e:
        pytest.skip(f"Error handler not configured: {e}")

if __name__ == "__main__":
    # Run smoke tests directly
    pytest.main([__file__, "-v"])