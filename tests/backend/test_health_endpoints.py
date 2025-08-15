"""
Tests for health service and diagnostics endpoints
"""

import pytest
import asyncio
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient

from backend.services.health_service import health_service, get_health_status
from backend.core.app import create_app


class TestHealthService:
    """Test the health service functionality"""

    def test_uptime_calculation(self):
        """Test that uptime is calculated correctly"""
        uptime = health_service.get_uptime_seconds()
        assert isinstance(uptime, float)
        assert uptime >= 0

    @pytest.mark.asyncio
    async def test_websocket_health_check(self):
        """Test WebSocket health check component"""
        health = await health_service.check_websocket_health()
        
        assert health.status in ['up', 'degraded', 'down', 'unknown']
        assert health.last_check is not None
        assert isinstance(health.response_time_ms, (float, type(None)))

    @pytest.mark.asyncio
    async def test_cache_health_check(self):
        """Test cache health check component"""
        health = await health_service.check_cache_health()
        
        assert health.status in ['up', 'degraded', 'down', 'unknown']
        assert health.last_check is not None
        assert isinstance(health.response_time_ms, (float, type(None)))

    @pytest.mark.asyncio
    async def test_model_inference_health_check(self):
        """Test model inference health check component"""
        health = await health_service.check_model_inference_health()
        
        assert health.status in ['up', 'degraded', 'down', 'unknown']
        assert health.last_check is not None
        assert isinstance(health.response_time_ms, (float, type(None)))

    @pytest.mark.asyncio
    async def test_get_component_statuses(self):
        """Test getting all component statuses"""
        components = await health_service.get_component_statuses()
        
        assert isinstance(components, dict)
        assert 'websocket' in components
        assert 'cache' in components
        assert 'model_inference' in components
        
        for component_name, health in components.items():
            assert health.status in ['up', 'degraded', 'down', 'unknown']
            assert hasattr(health, 'last_check')
            assert hasattr(health, 'response_time_ms')

    @pytest.mark.asyncio
    async def test_component_status_caching(self):
        """Test that component statuses are cached"""
        # First call
        components1 = await health_service.get_component_statuses()
        
        # Second call should use cache (within TTL)
        components2 = await health_service.get_component_statuses()
        
        # Should be identical due to caching
        assert components1 == components2

    def test_determine_overall_status(self):
        """Test overall health status determination logic"""
        from backend.services.health_service import ComponentHealth
        
        # All components up
        components = {
            'websocket': ComponentHealth(status='up'),
            'cache': ComponentHealth(status='up')
        }
        status = health_service.determine_overall_status(components)
        assert status == 'ok'
        
        # One component degraded
        components['cache'].status = 'degraded'
        status = health_service.determine_overall_status(components)
        assert status == 'degraded'
        
        # One component down
        components['websocket'].status = 'down'
        status = health_service.determine_overall_status(components)
        assert status == 'unhealthy'

    def test_get_build_info(self):
        """Test build information retrieval"""
        build_info = health_service.get_build_info()
        
        assert isinstance(build_info, dict)
        assert 'version' in build_info
        assert 'environment' in build_info

    @pytest.mark.asyncio
    async def test_compute_health_full_response(self):
        """Test complete health status computation"""
        health_status = await health_service.compute_health()
        
        # Validate response structure
        assert health_status.status in ['ok', 'degraded', 'unhealthy']
        assert isinstance(health_status.uptime_seconds, float)
        assert health_status.uptime_seconds >= 0
        assert health_status.version == 'v2'
        assert health_status.timestamp is not None
        assert isinstance(health_status.components, dict)
        assert health_status.build_info is not None

    @pytest.mark.asyncio
    async def test_compute_health_with_timeout(self):
        """Test health computation with component timeouts"""
        with patch.object(health_service, 'get_component_statuses') as mock_components:
            # Simulate timeout by raising asyncio.TimeoutError
            mock_components.side_effect = asyncio.TimeoutError("Health check timeout")
            
            health_status = await health_service.compute_health()
            
            # Should still return valid response even with timeout
            assert health_status is not None
            assert health_status.status in ['ok', 'degraded', 'unhealthy']

    @pytest.mark.asyncio  
    async def test_get_health_status_convenience_function(self):
        """Test the convenience wrapper function"""
        health_status = await get_health_status()
        
        assert health_status is not None
        assert hasattr(health_status, 'status')
        assert hasattr(health_status, 'uptime_seconds')
        assert hasattr(health_status, 'version')


class TestHealthEndpoints:
    """Test the health-related API endpoints"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        app = create_app()
        return TestClient(app)

    def test_legacy_health_endpoint_deprecated(self, client):
        """Test that legacy /api/health endpoint returns deprecation notice"""
        response = client.get("/api/health")
        
        assert response.status_code == 200
        data = response.json()
        
        # Check envelope format
        assert data["success"] is True
        assert data["error"] is None
        assert data["data"]["deprecated"] is True
        assert data["data"]["forward"] == "/api/v2/diagnostics/health"
        assert "meta" in data

    def test_legacy_health_endpoint_head(self, client):
        """Test HEAD request to legacy health endpoint"""
        response = client.head("/api/health")
        assert response.status_code == 200

    def test_new_structured_health_endpoint(self, client):
        """Test the new structured health endpoint"""
        response = client.get("/api/v2/diagnostics/health")
        
        assert response.status_code == 200
        data = response.json()
        
        # Validate response structure
        assert "status" in data
        assert data["status"] in ["ok", "degraded", "unhealthy"]
        assert "uptime_seconds" in data
        assert isinstance(data["uptime_seconds"], (int, float))
        assert data["uptime_seconds"] >= 0
        assert data["version"] == "v2"
        assert "timestamp" in data
        assert "components" in data
        assert isinstance(data["components"], dict)

    def test_health_endpoint_component_structure(self, client):
        """Test that component health has proper structure"""
        response = client.get("/api/v2/diagnostics/health")
        
        assert response.status_code == 200
        data = response.json()
        
        components = data["components"]
        assert len(components) > 0
        
        for component_name, component_health in components.items():
            assert isinstance(component_name, str)
            assert "status" in component_health
            assert component_health["status"] in ["up", "degraded", "down", "unknown"]
            
            # Optional fields
            if "last_check" in component_health:
                assert isinstance(component_health["last_check"], str)
            if "response_time_ms" in component_health:
                assert isinstance(component_health["response_time_ms"], (int, float))
            if "details" in component_health:
                assert isinstance(component_health["details"], dict)

    def test_health_endpoint_build_info(self, client):
        """Test build information in health response"""
        response = client.get("/api/v2/diagnostics/health")
        
        assert response.status_code == 200
        data = response.json()
        
        if "build_info" in data and data["build_info"] is not None:
            build_info = data["build_info"]
            assert isinstance(build_info, dict)
            assert "version" in build_info
            assert "environment" in build_info

    def test_health_endpoints_performance(self, client):
        """Test that health endpoints respond quickly"""
        import time
        
        # Test legacy endpoint
        start = time.time()
        response = client.get("/api/health")
        legacy_duration = time.time() - start
        
        assert response.status_code == 200
        assert legacy_duration < 1.0  # Should respond in under 1 second
        
        # Test new endpoint  
        start = time.time()
        response = client.get("/api/v2/diagnostics/health")
        new_duration = time.time() - start
        
        assert response.status_code == 200
        assert new_duration < 2.0  # Allow slightly more time for component checks

    @pytest.mark.asyncio
    async def test_concurrent_health_checks(self, client):
        """Test multiple concurrent health check requests"""
        import asyncio
        
        async def make_request():
            # Note: TestClient is synchronous, so this is a simplified concurrent test
            response = client.get("/api/v2/diagnostics/health")
            return response.status_code
        
        # Make multiple concurrent requests
        tasks = [make_request() for _ in range(5)]
        results = await asyncio.gather(*tasks)
        
        # All should succeed
        assert all(status == 200 for status in results)

    def test_health_endpoint_error_handling(self, client):
        """Test health endpoint behavior under error conditions"""
        with patch.object(health_service, 'compute_health') as mock_compute:
            # Simulate health service failure
            mock_compute.side_effect = Exception("Health service unavailable")
            
            response = client.get("/api/v2/diagnostics/health")
            
            # Should handle errors gracefully
            assert response.status_code in [200, 503]  # Either OK or Service Unavailable

    def test_system_diagnostics_endpoint(self, client):
        """Test the system diagnostics endpoint"""
        response = client.get("/api/v2/diagnostics/system")
        
        assert response.status_code == 200
        data = response.json()
        
        # Should have standard API response envelope
        assert "success" in data
        assert "data" in data
        
        if data["success"]:
            system_data = data["data"]
            assert "llm_initialized" in system_data
            assert "llm_client_type" in system_data


class TestHealthServiceIntegration:
    """Integration tests for health service with other components"""

    @pytest.mark.asyncio
    async def test_health_service_with_mock_websocket(self):
        """Test health service with mocked WebSocket connections"""
        with patch('backend.services.health_service.asyncio.sleep', new_callable=AsyncMock):
            health = await health_service.check_websocket_health()
            assert health.status in ['up', 'degraded', 'down']

    @pytest.mark.asyncio
    async def test_health_service_resilience(self):
        """Test health service resilience to individual component failures"""
        with patch.object(health_service, 'check_cache_health', side_effect=Exception("Cache error")):
            # Should still return overall health even if one component fails
            health_status = await health_service.compute_health()
            assert health_status is not None
            assert hasattr(health_status, 'status')

    def test_health_service_startup_time_tracking(self):
        """Test that startup time is properly tracked"""
        import time
        from backend.services.health_service import START_TIME
        
        current_time = time.time()
        uptime = health_service.get_uptime_seconds()
        
        # Uptime should be reasonable (not negative, not too large)
        assert 0 <= uptime <= (current_time - START_TIME + 10)  # Allow 10s tolerance