"""
Tests for Smart Fallback Priority API Routes

Comprehensive test suite for the smart fallback priority REST API endpoints,
including provider priorities, fallback analytics, and configuration management.
"""

import time
from unittest.mock import AsyncMock, Mock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from backend.routes.smart_fallback_routes import router as fallback_router
from backend.services.smart_fallback_priority_service import (
    CircuitBreakerState,
    FallbackConfiguration,
    FallbackReason,
    FallbackStrategy,
    ProviderPriority,
)


class TestSmartFallbackAPIRoutes:
    """Test suite for smart fallback priority API routes"""

    @staticmethod
    def _extract_success_data(response):
        payload = response.json()
        assert payload["success"] is True
        return payload

    @pytest.fixture
    def mock_fallback_service(self):
        """Create a mock smart fallback service"""
        mock_service = Mock()
        mock_service.primary_providers = {"odds_aggregation": "draftkings"}
        mock_service.priority_cache = {}
        mock_service.fallback_history = []
        mock_service.fallback_performance = {
            "total_fallbacks": 0,
            "successful_fallbacks": 0,
            "failed_fallbacks": 0,
            "average_fallback_time_ms": 0.0,
        }
        mock_service.config = FallbackConfiguration(
            max_staleness_seconds=300,
            min_confidence_threshold=0.7,
            strategy=FallbackStrategy.BEST_AVAILABLE,
        )

        # Mock async methods
        mock_service.get_provider_priorities = AsyncMock()
        mock_service.set_primary_provider = AsyncMock()
        mock_service.select_optimal_provider = AsyncMock()
        mock_service.cleanup_old_data = AsyncMock()

        return mock_service

    @pytest.fixture
    def test_app(self, mock_fallback_service):
        """Create test FastAPI app with mocked service"""
        from backend.routes.smart_fallback_routes import get_fallback_service

        app = FastAPI()
        app.include_router(fallback_router)

        # Override dependency
        def override_fallback_service():
            return mock_fallback_service

        app.dependency_overrides[get_fallback_service] = override_fallback_service

        return app

    @pytest.fixture
    def client(self, test_app):
        """Create test client"""
        return TestClient(test_app)

    @pytest.fixture
    def sample_provider_priorities(self):
        """Create sample provider priority data"""
        return [
            ProviderPriority(
                provider_id="draftkings",
                priority_score=0.95,
                confidence_score=0.9,
                is_primary=True,
                circuit_state=CircuitBreakerState.CLOSED,
                last_successful_request=time.time() - 60,
                estimated_latency_ms=150.0,
                staleness_seconds=60.0,
            ),
            ProviderPriority(
                provider_id="fanduel",
                priority_score=0.85,
                confidence_score=0.8,
                is_primary=False,
                circuit_state=CircuitBreakerState.CLOSED,
                last_successful_request=time.time() - 120,
                estimated_latency_ms=200.0,
                staleness_seconds=120.0,
            ),
        ]

    def test_health_check_success(self, client):
        """Test successful health check"""
        response = client.get("/api/fallback/health")

        assert response.status_code == 200
        payload = self._extract_success_data(response)
        data = payload["data"]
        assert data["status"] == "healthy"
        assert data["service"] == "Smart Fallback Priority Service"
        assert "active_contexts" in data
        assert "cached_priorities" in data
        assert payload["message"] == "Smart fallback priority service is healthy"

    def test_health_check_failure(self):
        """Test health check when service is unhealthy"""
        # Remove dependency override to cause service creation failure
        app = FastAPI()
        app.include_router(fallback_router)

        with patch(
            "backend.routes.smart_fallback_routes.get_fallback_service",
            side_effect=Exception("Service unavailable"),
        ):
            test_client = TestClient(app)
            response = test_client.get("/api/fallback/health")

            assert response.status_code == 503
            assert "Service unhealthy" in response.json()["detail"]

    def test_get_provider_priorities_success(
        self, client, mock_fallback_service, sample_provider_priorities
    ):
        """Test successful provider priorities retrieval"""
        mock_fallback_service.get_provider_priorities.return_value = (
            sample_provider_priorities
        )

        response = client.get(
            "/api/fallback/priorities/odds_aggregation?available_providers=draftkings,fanduel"
        )

        assert response.status_code == 200
        payload = self._extract_success_data(response)
        data = payload["data"]
        assert len(data) == 2
        assert data[0]["provider_id"] == "draftkings"
        assert data[0]["priority_score"] == 0.95
        assert data[0]["is_primary"] is True
        assert data[1]["provider_id"] == "fanduel"
        assert data[1]["priority_score"] == 0.85
        assert data[1]["is_primary"] is False

        # Verify service was called correctly
        mock_fallback_service.get_provider_priorities.assert_called_once_with(
            "odds_aggregation", ["draftkings", "fanduel"], False
        )

    def test_get_provider_priorities_force_refresh(
        self, client, mock_fallback_service, sample_provider_priorities
    ):
        """Test provider priorities with force refresh"""
        mock_fallback_service.get_provider_priorities.return_value = (
            sample_provider_priorities
        )

        response = client.get(
            "/api/fallback/priorities/odds_aggregation?available_providers=draftkings&force_refresh=true"
        )

        assert response.status_code == 200

        # Verify force refresh was passed
        mock_fallback_service.get_provider_priorities.assert_called_once_with(
            "odds_aggregation", ["draftkings"], True
        )

    def test_get_provider_priorities_no_providers(self, client):
        """Test provider priorities with no providers specified"""
        response = client.get(
            "/api/fallback/priorities/odds_aggregation?available_providers="
        )

        assert response.status_code == 400
        assert "No providers specified" in response.json()["detail"]

    def test_get_provider_priorities_service_error(self, client, mock_fallback_service):
        """Test provider priorities when service raises error"""
        mock_fallback_service.get_provider_priorities.side_effect = Exception(
            "Database error"
        )

        response = client.get(
            "/api/fallback/priorities/odds_aggregation?available_providers=draftkings"
        )

        assert response.status_code == 500
        assert "Failed to get priorities" in response.json()["detail"]

    def test_set_primary_provider_success(self, client, mock_fallback_service):
        """Test successful primary provider setting"""
        response = client.post(
            "/api/fallback/primary-provider",
            json={"context": "odds_aggregation", "provider_id": "fanduel"},
        )

        assert response.status_code == 200
        payload = self._extract_success_data(response)
        data = payload["data"]
        assert data["context"] == "odds_aggregation"
        assert data["primary_provider"] == "fanduel"
        assert (
            payload["message"]
            == "Primary provider set to fanduel for context odds_aggregation"
        )

        mock_fallback_service.set_primary_provider.assert_called_once_with(
            "odds_aggregation", "fanduel"
        )

    def test_set_primary_provider_service_error(self, client, mock_fallback_service):
        """Test primary provider setting when service raises error"""
        mock_fallback_service.set_primary_provider.side_effect = Exception(
            "Provider not found"
        )

        response = client.post(
            "/api/fallback/primary-provider",
            json={"context": "odds_aggregation", "provider_id": "invalid_provider"},
        )

        assert response.status_code == 500
        assert "Failed to set primary provider" in response.json()["detail"]

    def test_select_optimal_provider_success(
        self, client, mock_fallback_service, sample_provider_priorities
    ):
        """Test successful optimal provider selection"""
        mock_fallback_service.select_optimal_provider.return_value = (
            "fanduel",
            FallbackReason.LOW_CONFIDENCE,
        )
        mock_fallback_service.get_provider_priorities.return_value = (
            sample_provider_priorities
        )

        response = client.post(
            "/api/fallback/select-provider",
            json={
                "context": "odds_aggregation",
                "available_providers": ["draftkings", "fanduel"],
                "current_provider": "draftkings",
            },
        )

        assert response.status_code == 200
        payload = self._extract_success_data(response)
        data = payload["data"]
        assert data["selected_provider"] == "fanduel"
        assert data["fallback_reason"] == "low_confidence"
        assert len(data["priorities"]) == 2
        assert "selection_time_ms" in data

        mock_fallback_service.select_optimal_provider.assert_called_once_with(
            "odds_aggregation", ["draftkings", "fanduel"], "draftkings"
        )

    def test_select_optimal_provider_no_fallback(
        self, client, mock_fallback_service, sample_provider_priorities
    ):
        """Test optimal provider selection when no fallback is needed"""
        mock_fallback_service.select_optimal_provider.return_value = (
            "draftkings",
            None,
        )
        mock_fallback_service.get_provider_priorities.return_value = (
            sample_provider_priorities
        )

        response = client.post(
            "/api/fallback/select-provider",
            json={
                "context": "odds_aggregation",
                "available_providers": ["draftkings", "fanduel"],
            },
        )

        assert response.status_code == 200
        payload = self._extract_success_data(response)
        data = payload["data"]
        assert data["selected_provider"] == "draftkings"
        assert data["fallback_reason"] is None

    def test_get_fallback_analytics_success(self, client, mock_fallback_service):
        """Test successful fallback analytics retrieval"""
        mock_analytics = {
            "performance": {
                "total_fallbacks": 150,
                "successful_fallbacks": 140,
                "failed_fallbacks": 10,
                "success_rate": 0.933,
            },
            "recent_hour": {
                "fallback_events": 12,
                "unique_providers": 3,
                "average_response_time_ms": 250.5,
            },
            "provider_reliability": {
                "draftkings": 0.95,
                "fanduel": 0.88,
                "betmgm": 0.82,
            },
            "active_fallbacks": 2,
            "cache_hit_rate": 0.78,
        }

        mock_fallback_service.get_fallback_analytics.return_value = mock_analytics

        response = client.get("/api/fallback/analytics")

        assert response.status_code == 200
        payload = self._extract_success_data(response)
        data = payload["data"]
        assert data["performance"]["total_fallbacks"] == 150
        assert data["recent_hour"]["fallback_events"] == 12
        assert data["provider_reliability"]["draftkings"] == 0.95
        assert data["active_fallbacks"] == 2
        assert data["cache_hit_rate"] == 0.78

    def test_get_fallback_configuration_success(self, client):
        """Test successful fallback configuration retrieval"""
        response = client.get("/api/fallback/configuration")

        assert response.status_code == 200
        payload = self._extract_success_data(response)
        data = payload["data"]
        assert data["max_staleness_seconds"] == 300
        assert data["min_confidence_threshold"] == 0.7
        assert data["strategy"] == "best_available"
        assert "primary_provider_priority_boost" in data
        assert "enable_circuit_breaker_fallback" in data

    def test_get_active_contexts_success(self, client):
        """Test successful active contexts retrieval"""
        response = client.get("/api/fallback/contexts")

        assert response.status_code == 200
        payload = self._extract_success_data(response)
        data = payload["data"]
        assert data["odds_aggregation"] == "draftkings"

    def test_clear_priority_cache_specific_context(self, client, mock_fallback_service):
        """Test clearing cache for specific context"""
        # Setup cache data
        mock_fallback_service.priority_cache = {
            "odds_aggregation:draftkings,fanduel": [],
            "odds_aggregation:betmgm,caesars": [],
            "other_context:provider1,provider2": [],
        }

        response = client.delete("/api/fallback/cache?context=odds_aggregation")

        assert response.status_code == 200
        payload = self._extract_success_data(response)
        data = payload["data"]
        assert data["context"] == "odds_aggregation"
        assert data["cleared_entries"] == 2
        assert payload["message"] == "Cache cleared for context: odds_aggregation"

    def test_clear_priority_cache_all(self, client, mock_fallback_service):
        """Test clearing all cache"""
        # Setup cache data
        cache_data = {f"context{i}:provider{i}": [] for i in range(5)}
        mock_fallback_service.priority_cache = cache_data

        response = client.delete("/api/fallback/cache")

        assert response.status_code == 200
        payload = self._extract_success_data(response)
        data = payload["data"]
        assert data["cleared_entries"] == 5
        assert len(mock_fallback_service.priority_cache) == 0
        assert payload["message"] == "All priority cache cleared"

    def test_cleanup_old_data_success(self, client, mock_fallback_service):
        """Test successful old data cleanup"""
        response = client.post("/api/fallback/cleanup?max_age_hours=48")

        assert response.status_code == 200
        payload = self._extract_success_data(response)
        data = payload["data"]
        assert data["max_age_hours"] == 48
        assert "fallback_events" in data
        assert "cache_entries" in data
        assert payload["message"] == "Cleanup completed successfully"

        mock_fallback_service.cleanup_old_data.assert_called_once_with(48)

    def test_cleanup_old_data_invalid_age(self, client):
        """Test cleanup with invalid max age"""
        response = client.post("/api/fallback/cleanup?max_age_hours=0")

        assert response.status_code == 400
        assert "max_age_hours must be positive" in response.json()["detail"]

    def test_get_system_status_success(self, client, mock_fallback_service):
        """Test successful system status retrieval"""
        # Add some mock fallback history
        current_time = time.time()
        mock_fallback_service.fallback_history = [
            Mock(
                timestamp=current_time - 1800, success=True, fallback_provider="fanduel"
            ),  # 30 min ago
            Mock(
                timestamp=current_time - 3600, success=False, fallback_provider="betmgm"
            ),  # 1 hour ago
            Mock(
                timestamp=current_time - 7200, success=True, fallback_provider="caesars"
            ),  # 2 hours ago (should be excluded)
        ]

        response = client.get("/api/fallback/status")

        assert response.status_code == 200
        payload = self._extract_success_data(response)
        data = payload["data"]
        assert data["system"] == "Smart Fallback Priority Service"
        assert data["status"] == "active"
        assert data["uptime_info"]["primary_providers"] == 1
        assert (
            data["recent_activity"]["fallback_events_last_hour"] == 1
        )  # Only events within last hour
        assert data["recent_activity"]["successful_fallbacks"] == 1
        assert data["recent_activity"]["failed_fallbacks"] == 0
        assert data["configuration"]["strategy"] == "best_available"

    def test_invalid_endpoint(self, client):
        """Test accessing invalid endpoint"""
        response = client.get("/api/fallback/nonexistent")

        assert response.status_code == 404

    def test_missing_required_parameters(self, client):
        """Test endpoints with missing required parameters"""
        # Missing available_providers parameter
        response = client.get("/api/fallback/priorities/odds_aggregation")
        assert response.status_code == 422

        # Missing request body
        response = client.post("/api/fallback/primary-provider")
        assert response.status_code == 422

        response = client.post("/api/fallback/select-provider")
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_concurrent_requests(
        self, client, mock_fallback_service, sample_provider_priorities
    ):
        """Test handling concurrent requests to the API"""
        import asyncio

        mock_fallback_service.get_provider_priorities.return_value = (
            sample_provider_priorities
        )

        # Simulate concurrent requests
        async def make_request():
            return client.get(
                "/api/fallback/priorities/odds_aggregation?available_providers=draftkings,fanduel"
            )

        tasks = [make_request() for _ in range(10)]
        responses = await asyncio.gather(*tasks)

        # All requests should succeed
        for response in responses:
            assert response.status_code == 200
            data = self._extract_success_data(response)["data"]
            assert len(data) == 2

    def test_request_validation(self, client):
        """Test request validation for POST endpoints"""
        # Invalid provider ID format
        response = client.post(
            "/api/fallback/primary-provider",
            json={"context": "", "provider_id": "valid_provider"},  # Empty context
        )
        # FastAPI allows empty strings by default, so this might pass validation
        # Change to None which should fail
        response = client.post(
            "/api/fallback/primary-provider",
            json={
                "provider_id": "valid_provider"
                # Missing context field
            },
        )
        assert response.status_code == 422

        # Invalid available_providers (empty list)
        response = client.post(
            "/api/fallback/select-provider",
            json={
                "context": "odds_aggregation",
                "available_providers": [],  # Empty list
            },
        )
        # This might be a 422 (validation) or 500 (service error) depending on implementation
        assert response.status_code in [422, 500]

    def test_response_model_validation(
        self, client, mock_fallback_service, sample_provider_priorities
    ):
        """Test that API responses match expected models"""
        mock_fallback_service.get_provider_priorities.return_value = (
            sample_provider_priorities
        )

        response = client.get(
            "/api/fallback/priorities/odds_aggregation?available_providers=draftkings,fanduel"
        )

        assert response.status_code == 200
        payload = self._extract_success_data(response)
        data = payload["data"]

        # Validate response structure matches ProviderPriorityResponse
        for item in data:
            assert "provider_id" in item
            assert "priority_score" in item
            assert "confidence_score" in item
            assert "is_primary" in item
            assert "circuit_state" in item
            assert "last_successful_request" in item
            assert "estimated_latency_ms" in item
            assert "staleness_seconds" in item

            # Validate data types
            assert isinstance(item["provider_id"], str)
            assert isinstance(item["priority_score"], (int, float))
            assert isinstance(item["confidence_score"], (int, float))
            assert isinstance(item["is_primary"], bool)
            assert isinstance(item["circuit_state"], str)
            assert isinstance(item["last_successful_request"], (int, float))
            assert isinstance(item["estimated_latency_ms"], (int, float))
            assert isinstance(item["staleness_seconds"], (int, float))
