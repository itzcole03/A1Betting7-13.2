"""
Tests for Observability Routes

Tests ensure that observability endpoints return proper responses,
handle errors gracefully, and maintain baseline structure.
"""

from unittest.mock import AsyncMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from backend.routes.observability_routes import router


@pytest.fixture
def app():
    """Create test FastAPI app with observability routes"""
    test_app = FastAPI()
    test_app.include_router(router)
    return test_app


@pytest.fixture
def client(app):
    """Create test client"""
    return TestClient(app)


class TestObservabilityRoutes:
    """Test suite for observability API endpoints"""

    def test_observability_snapshot_baseline_structure(self, client):
        """Test that /api/observability/snapshot returns baseline keys even with zero data"""
        response = client.get("/api/observability/snapshot")

        assert response.status_code == 200
        data = response.json()

        # Verify baseline structure
        assert "timings" in data
        assert "recentErrors" in data
        assert "activeFlags" in data

        # Verify all required timing keys
        timings = data["timings"]
        required_keys = [
            "ev_ms_avg",
            "arbitrage_ms_avg",
            "odds_norm_ms_avg",
            "line_movement_ms_avg",
        ]
        for key in required_keys:
            assert key in timings
            assert isinstance(timings[key], (int, float))
            assert timings[key] >= 0.0

        # Verify data types
        assert isinstance(data["recentErrors"], list)
        assert isinstance(data["activeFlags"], dict)

        # Verify essential flags exist
        flags = data["activeFlags"]
        essential_flags = [
            "tracing_enabled",
            "error_hashing_enabled",
            "metrics_collection_enabled",
        ]
        for flag in essential_flags:
            assert flag in flags

    @patch(
        "backend.routes.observability_routes.instrumentation_service.get_observability_snapshot",
        new_callable=AsyncMock,
    )
    def test_observability_snapshot_with_error(self, mock_snapshot, client):
        """Test that snapshot endpoint returns baseline structure even when service fails"""
        # Mock service failure
        mock_snapshot.side_effect = Exception("Service failed")

        response = client.get("/api/observability/snapshot")

        assert response.status_code == 200
        data = response.json()

        # Should still have baseline structure
        assert "timings" in data
        assert "recentErrors" in data
        assert "activeFlags" in data

        # Timing keys should still be present with default values
        timings = data["timings"]
        required_keys = [
            "ev_ms_avg",
            "arbitrage_ms_avg",
            "odds_norm_ms_avg",
            "line_movement_ms_avg",
        ]
        for key in required_keys:
            assert key in timings
            assert timings[key] == 0.0

        # Should have error information
        assert "error" in data
        assert data["error"] == "Failed to generate snapshot"

        # Should have an error entry in recentErrors
        assert len(data["recentErrors"]) == 1
        error_entry = data["recentErrors"][0]
        assert error_entry["error_hash"] == "snapshot_generation_failed"
        assert error_entry["operation"] == "observability_snapshot"

    @patch(
        "backend.routes.observability_routes.instrumentation_service.get_observability_snapshot",
        new_callable=AsyncMock,
    )
    def test_observability_snapshot_with_real_data(self, mock_snapshot, client):
        """Test snapshot endpoint with realistic data"""
        # Mock realistic observability data
        mock_data = {
            "timings": {
                "ev_ms_avg": 15.5,
                "arbitrage_ms_avg": 25.2,
                "odds_norm_ms_avg": 8.7,
                "line_movement_ms_avg": 12.1,
            },
            "recentErrors": [
                {
                    "error_hash": "test_hash_123",
                    "operation": "test_operation",
                    "timestamp": "2024-01-01T12:00:00Z",
                    "error_type": "ValueError",
                    "error_message": "Test error",
                }
            ],
            "activeFlags": {
                "tracing_enabled": True,
                "error_hashing_enabled": True,
                "metrics_collection_enabled": True,
                "span_sampling_rate": 0.8,
            },
            "operationMetrics": {
                "test_operation": {
                    "total_calls": 100,
                    "success_rate": 0.95,
                    "avg_duration_ms": 15.5,
                    "p95_duration_ms": 25.0,
                    "error_rate": 0.05,
                }
            },
            "snapshotTimestamp": "2024-01-01T12:00:00Z",
        }

        mock_snapshot.return_value = mock_data

        response = client.get("/api/observability/snapshot")

        assert response.status_code == 200
        data = response.json()

        # Verify data is passed through correctly
        assert data["timings"]["ev_ms_avg"] == 15.5
        assert data["timings"]["arbitrage_ms_avg"] == 25.2
        assert len(data["recentErrors"]) == 1
        assert data["recentErrors"][0]["error_hash"] == "test_hash_123"
        assert data["activeFlags"]["span_sampling_rate"] == 0.8

    def test_instrumentation_health_endpoint(self, client):
        """Test /api/observability/health endpoint"""
        response = client.get("/api/observability/health")

        assert response.status_code == 200
        data = response.json()

        # Verify health response structure
        assert "status" in data
        assert "active_spans" in data
        assert "completed_spans" in data
        assert "tracked_operations" in data
        assert "error_hashes" in data
        assert "recent_errors" in data
        assert "flags" in data
        assert "last_health_check" in data

    @patch(
        "backend.routes.observability_routes.instrumentation_service.get_health_status",
        new_callable=AsyncMock,
    )
    def test_health_endpoint_with_error(self, mock_health, client):
        """Test health endpoint error handling"""
        mock_health.side_effect = Exception("Health check failed")

        response = client.get("/api/observability/health")

        assert response.status_code == 500
        data = response.json()
        assert "detail" in data
        assert "Health check failed" in data["detail"]

    def test_operation_metrics_endpoint(self, client):
        """Test /api/observability/metrics/operations endpoint"""
        response = client.get("/api/observability/metrics/operations")

        assert response.status_code == 200
        data = response.json()

        # Verify structure
        assert "operationMetrics" in data
        assert "timestamp" in data
        assert "activeSpans" in data
        assert "completedSpans" in data

    def test_error_summary_endpoint(self, client):
        """Test /api/observability/errors/summary endpoint"""
        response = client.get("/api/observability/errors/summary")

        assert response.status_code == 200
        data = response.json()

        # Verify structure
        assert "errorSummaries" in data
        assert "recentErrors" in data
        assert "totalErrorHashes" in data
        assert "recentErrorCount" in data
        assert "timestamp" in data

    def test_feature_flags_get_endpoint(self, client):
        """Test /api/observability/flags GET endpoint"""
        response = client.get("/api/observability/flags")

        assert response.status_code == 200
        data = response.json()

        # Verify structure
        assert "activeFlags" in data
        assert "timestamp" in data
        assert isinstance(data["activeFlags"], dict)

    @patch("backend.routes.observability_routes.instrumentation_service.update_flag")
    def test_feature_flags_update_success(self, mock_update, client):
        """Test successful feature flag update"""
        mock_update.return_value = True

        response = client.post("/api/observability/flags/tracing_enabled", json=False)

        assert response.status_code == 200
        data = response.json()

        assert data["success"] is True
        assert data["flag"] == "tracing_enabled"
        assert data["newValue"] is False
        mock_update.assert_called_once_with("tracing_enabled", False)

    @patch("backend.routes.observability_routes.instrumentation_service.update_flag")
    def test_feature_flags_update_not_found(self, mock_update, client):
        """Test feature flag update for non-existent flag"""
        mock_update.return_value = False

        response = client.post("/api/observability/flags/non_existent", json=True)

        assert response.status_code == 404
        data = response.json()
        assert "Flag non_existent not found" in data["detail"]

    @patch("backend.routes.observability_routes.instrumentation_service.clear_metrics")
    def test_clear_metrics_endpoint(self, mock_clear, client):
        """Test /api/observability/clear-metrics endpoint"""
        response = client.post("/api/observability/clear-metrics")

        assert response.status_code == 200
        data = response.json()

        assert data["success"] is True
        assert "cleared" in data["message"]
        mock_clear.assert_called_once()

    def test_timings_endpoint(self, client):
        """Test /api/observability/timings endpoint"""
        response = client.get("/api/observability/timings")

        assert response.status_code == 200
        data = response.json()

        # Verify structure
        assert "timings" in data
        assert "timestamp" in data

        # Verify all timing keys are present
        timings = data["timings"]
        required_keys = [
            "ev_ms_avg",
            "arbitrage_ms_avg",
            "odds_norm_ms_avg",
            "line_movement_ms_avg",
        ]
        for key in required_keys:
            assert key in timings
            assert isinstance(timings[key], (int, float))

    @patch(
        "backend.routes.observability_routes.instrumentation_service.get_observability_snapshot"
    )
    def test_timings_endpoint_with_error(self, mock_snapshot, client):
        """Test timings endpoint error handling"""
        mock_snapshot.side_effect = Exception("Timing data failed")

        response = client.get("/api/observability/timings")

        assert response.status_code == 200  # Should return 200 with baseline data
        data = response.json()

        # Should still have baseline timing structure
        assert "timings" in data
        timings = data["timings"]
        required_keys = [
            "ev_ms_avg",
            "arbitrage_ms_avg",
            "odds_norm_ms_avg",
            "line_movement_ms_avg",
        ]
        for key in required_keys:
            assert key in timings
            assert timings[key] == 0.0

        # Should have error information
        assert "error" in data
        assert data["error"] == "Failed to get timing data"

    def test_observability_status_endpoint(self, client):
        """Test /api/observability/status endpoint"""
        response = client.get("/api/observability/status")

        assert response.status_code == 200
        data = response.json()

        # Verify status response structure
        assert "status" in data
        assert "observabilityEnabled" in data
        assert "tracingEnabled" in data
        assert "metricsEnabled" in data
        assert "errorTrackingEnabled" in data
        assert "activeOperations" in data
        assert "lastHealthCheck" in data

    @patch(
        "backend.routes.observability_routes.instrumentation_service.get_health_status"
    )
    def test_observability_status_with_unhealthy_service(self, mock_health, client):
        """Test status endpoint when service is unhealthy"""
        mock_health.return_value = {
            "status": "degraded",
            "flags": {"tracing_enabled": False},
            "tracked_operations": 5,
            "last_health_check": "2024-01-01T12:00:00Z",
        }

        response = client.get("/api/observability/status")

        assert response.status_code == 503
        data = response.json()

        assert data["status"] == "degraded"
        assert data["tracingEnabled"] is False
        assert data["activeOperations"] == 5

    @patch(
        "backend.routes.observability_routes.instrumentation_service.get_health_status"
    )
    def test_observability_status_with_error(self, mock_health, client):
        """Test status endpoint error handling"""
        mock_health.side_effect = Exception("Status check failed")

        response = client.get("/api/observability/status")

        assert response.status_code == 503
        data = response.json()

        assert data["status"] == "error"
        assert data["observabilityEnabled"] is False
        assert "error" in data


class TestObservabilityEndpointIntegration:
    """Integration tests for observability endpoints"""

    def test_complete_observability_workflow(self, client):
        """Test complete workflow of observability endpoints"""
        # 1. Get initial status
        status_response = client.get("/api/observability/status")
        assert status_response.status_code == 200

        # 2. Get snapshot
        snapshot_response = client.get("/api/observability/snapshot")
        assert snapshot_response.status_code == 200
        snapshot_data = snapshot_response.json()

        # 3. Verify baseline structure is always present
        assert "timings" in snapshot_data
        assert "recentErrors" in snapshot_data
        assert "activeFlags" in snapshot_data

        # 4. Get specific timing data
        timings_response = client.get("/api/observability/timings")
        assert timings_response.status_code == 200
        timings_data = timings_response.json()

        # Timing data should match snapshot
        assert timings_data["timings"] == snapshot_data["timings"]

        # 5. Get operation metrics
        metrics_response = client.get("/api/observability/metrics/operations")
        assert metrics_response.status_code == 200

        # 6. Get error summary
        errors_response = client.get("/api/observability/errors/summary")
        assert errors_response.status_code == 200

        # 7. Get feature flags
        flags_response = client.get("/api/observability/flags")
        assert flags_response.status_code == 200

    def test_all_endpoints_return_json(self, client):
        """Test that all observability endpoints return valid JSON"""
        endpoints = [
            "/api/observability/snapshot",
            "/api/observability/health",
            "/api/observability/metrics/operations",
            "/api/observability/errors/summary",
            "/api/observability/flags",
            "/api/observability/timings",
            "/api/observability/status",
        ]

        for endpoint in endpoints:
            response = client.get(endpoint)
            assert response.status_code in [
                200,
                503,
            ]  # 503 is acceptable for degraded health

            # Should be valid JSON
            data = response.json()
            assert isinstance(data, dict)

    def test_baseline_keys_consistency_across_endpoints(self, client):
        """Test that baseline timing keys are consistent across endpoints"""
        required_timing_keys = [
            "ev_ms_avg",
            "arbitrage_ms_avg",
            "odds_norm_ms_avg",
            "line_movement_ms_avg",
        ]

        # Get data from snapshot endpoint
        snapshot_response = client.get("/api/observability/snapshot")
        snapshot_timings = snapshot_response.json()["timings"]

        # Get data from timings endpoint
        timings_response = client.get("/api/observability/timings")
        timings_data = timings_response.json()["timings"]

        # Both should have all required keys
        for key in required_timing_keys:
            assert key in snapshot_timings
            assert key in timings_data
            assert isinstance(snapshot_timings[key], (int, float))
            assert isinstance(timings_data[key], (int, float))


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
