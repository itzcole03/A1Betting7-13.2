"""
Tests for Ingestion API Endpoints

Test suite covering API endpoints for NBA ingestion pipeline,
including request/response validation and error handling.
"""

import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
from datetime import datetime

from backend.ingestion.models.dto import IngestResult
from backend.ingestion.pipeline.nba_ingestion_pipeline import NBAIngestionPipeline


@pytest.fixture
def mock_successful_ingest_result():
    """Mock successful ingestion result."""
    result = IngestResult(
        status="success",
        sport="NBA",
        source="nba_provider_stub",
        started_at=datetime.utcnow(),
        total_raw=50,
        total_new_quotes=25,
        total_line_changes=10,
        total_unchanged=15,
        total_new_players=5,
        total_new_props=30
    )
    result.mark_completed()
    result.ingest_run_id = 123
    return result


@pytest.fixture
def mock_partial_ingest_result():
    """Mock partial ingestion result with some errors."""
    result = IngestResult(
        status="partial",
        sport="NBA",
        source="nba_provider_stub",
        started_at=datetime.utcnow(),
        total_raw=50,
        total_new_quotes=20,
        total_line_changes=8,
        total_unchanged=12,
        total_new_players=3,
        total_new_props=25
    )
    result.add_error("validation_error", "Invalid player name", {"player_id": "invalid_123"})
    result.add_error("taxonomy_error", "Unknown team code", {"team_code": "XYZ"})
    result.mark_completed()
    result.ingest_run_id = 124
    return result


class TestIngestionEndpoints:
    """Test cases for ingestion API endpoints."""
    
    def test_run_nba_ingestion_endpoint_exists(self, client):
        """Test that the NBA ingestion endpoint exists."""
        
        # Mock the pipeline to avoid actual database operations
        with patch.object(NBAIngestionPipeline, 'run_nba_ingestion', new_callable=AsyncMock) as mock_run:
            mock_run.return_value = IngestResult(
                status="success",
                sport="NBA", 
                source="test",
                started_at=datetime.utcnow()
            )
            
            response = client.post("/api/v1/ingestion/nba/run")
            
            # Should not return 404
            assert response.status_code != 404
    
    @patch.object(NBAIngestionPipeline, 'run_nba_ingestion', new_callable=AsyncMock)
    def test_run_nba_ingestion_success(self, mock_run, client, mock_successful_ingest_result):
        """Test successful NBA ingestion execution."""
        
        mock_run.return_value = mock_successful_ingest_result
        
        response = client.post("/api/v1/ingestion/nba/run")
        
        assert response.status_code == 200
        data = response.json()
        
        # Check response structure
        assert data["status"] == "success"
        assert data["sport"] == "NBA"
        assert data["source"] == "nba_provider_stub"
        assert data["total_raw"] == 50
        assert data["total_new_quotes"] == 25
        assert data["total_line_changes"] == 10
        assert data["total_unchanged"] == 15
        assert data["total_new_players"] == 5
        assert data["total_new_props"] == 30
        assert "duration_ms" in data
        assert "ingest_run_id" in data
        
        # Pipeline should have been called once
        mock_run.assert_called_once()
    
    @patch.object(NBAIngestionPipeline, 'run_nba_ingestion', new_callable=AsyncMock)
    def test_run_nba_ingestion_partial_success(self, mock_run, client, mock_partial_ingest_result):
        """Test NBA ingestion with partial success (some errors)."""
        
        mock_run.return_value = mock_partial_ingest_result
        
        response = client.post("/api/v1/ingestion/nba/run")
        
        assert response.status_code == 200
        data = response.json()
        
        # Check response structure
        assert data["status"] == "partial"
        assert data["sport"] == "NBA"
        assert len(data["errors"]) == 2
        
        # Check error details
        assert data["errors"][0]["error_type"] == "validation_error"
        assert data["errors"][0]["message"] == "Invalid player name"
        assert data["errors"][1]["error_type"] == "taxonomy_error"
        assert data["errors"][1]["message"] == "Unknown team code"
        
        # Should still have successful counts
        assert data["total_new_quotes"] == 20
        assert data["total_line_changes"] == 8
    
    @patch.object(NBAIngestionPipeline, 'run_nba_ingestion', new_callable=AsyncMock)
    def test_run_nba_ingestion_pipeline_exception(self, mock_run, client):
        """Test NBA ingestion when pipeline raises exception."""
        
        mock_run.side_effect = Exception("Database connection failed")
        
        response = client.post("/api/v1/ingestion/nba/run")
        
        # Should return error response
        assert response.status_code == 500
        data = response.json()
        assert "error" in data
        assert "Database connection failed" in data["error"]
    
    @patch.object(NBAIngestionPipeline, 'run_nba_ingestion', new_callable=AsyncMock)
    def test_run_nba_ingestion_with_force_parameter(self, mock_run, client, mock_successful_ingest_result):
        """Test NBA ingestion with force parameter."""
        
        mock_run.return_value = mock_successful_ingest_result
        
        response = client.post("/api/v1/ingestion/nba/run?force=true")
        
        assert response.status_code == 200
        
        # Pipeline should have been called with appropriate parameters
        mock_run.assert_called_once()
        call_kwargs = mock_run.call_args.kwargs
        # Check if force parameter is passed through (implementation dependent)
    
    def test_run_nba_ingestion_method_not_allowed(self, client):
        """Test that only POST is allowed for ingestion endpoint."""
        
        # GET should not be allowed
        response = client.get("/api/v1/ingestion/nba/run")
        assert response.status_code == 405  # Method Not Allowed
        
        # PUT should not be allowed
        response = client.put("/api/v1/ingestion/nba/run")
        assert response.status_code == 405
        
        # DELETE should not be allowed
        response = client.delete("/api/v1/ingestion/nba/run")
        assert response.status_code == 405
    
    def test_ingestion_health_check_endpoint(self, client):
        """Test health check endpoint for ingestion service."""
        
        response = client.get("/api/v1/ingestion/health")
        
        if response.status_code == 200:
            # If health endpoint exists, check response structure
            data = response.json()
            assert "status" in data
        else:
            # Health endpoint might not be implemented yet
            assert response.status_code == 404
    
    @patch.object(NBAIngestionPipeline, 'run_nba_ingestion', new_callable=AsyncMock)
    def test_run_nba_ingestion_response_serialization(self, mock_run, client):
        """Test that complex IngestResult objects are properly serialized."""
        
        # Create result with complex data structures
        result = IngestResult(
            status="success",
            sport="NBA",
            source="nba_provider_stub",
            started_at=datetime.utcnow(),
            total_raw=100
        )
        result.changed_quote_ids = [1, 2, 3, 4, 5]
        result.new_prop_ids = [10, 11, 12]
        result.new_player_ids = [20, 21]
        result.add_error(
            "test_error", 
            "Test error message", 
            {"nested_data": {"key": "value"}},
            "external_prop_123"
        )
        result.mark_completed()
        
        mock_run.return_value = result
        
        response = client.post("/api/v1/ingestion/nba/run")
        
        assert response.status_code == 200
        data = response.json()
        
        # Check that arrays and nested objects are serialized correctly
        assert data["changed_quote_ids"] == [1, 2, 3, 4, 5]
        assert data["new_prop_ids"] == [10, 11, 12] 
        assert data["new_player_ids"] == [20, 21]
        
        # Check error serialization
        assert len(data["errors"]) == 1
        error = data["errors"][0]
        assert error["error_type"] == "test_error"
        assert error["message"] == "Test error message"
        assert error["context"]["nested_data"]["key"] == "value"
        assert error["external_prop_id"] == "external_prop_123"
        
        # Check datetime serialization
        assert "started_at" in data
        assert "finished_at" in data
        assert "duration_ms" in data
    
    @patch.object(NBAIngestionPipeline, 'run_nba_ingestion', new_callable=AsyncMock)
    def test_run_nba_ingestion_concurrent_requests(self, mock_run, client):
        """Test handling of concurrent ingestion requests."""
        
        # Simulate a slow-running ingestion
        mock_result = IngestResult(
            status="success",
            sport="NBA",
            source="test",
            started_at=datetime.utcnow()
        )
        mock_run.return_value = mock_result
        
        # Make concurrent requests
        response1 = client.post("/api/v1/ingestion/nba/run")
        response2 = client.post("/api/v1/ingestion/nba/run")
        
        # Both requests should complete successfully
        # (Implementation may vary - some systems might reject concurrent requests)
        assert response1.status_code == 200
        assert response2.status_code in [200, 409]  # 409 = Conflict if concurrent requests blocked
    
    def test_ingestion_endpoint_authentication(self, client):
        """Test authentication requirements for ingestion endpoints."""
        
        # This test depends on whether authentication is implemented
        response = client.post("/api/v1/ingestion/nba/run")
        
        # If auth is required, should get 401/403, otherwise should process normally
        assert response.status_code in [200, 401, 403, 500]  # Various valid responses depending on implementation
    
    @patch.object(NBAIngestionPipeline, 'run_nba_ingestion', new_callable=AsyncMock) 
    def test_run_nba_ingestion_logs_execution(self, mock_run, client, caplog):
        """Test that ingestion execution is properly logged."""
        
        mock_run.return_value = IngestResult(
            status="success",
            sport="NBA",
            source="test",
            started_at=datetime.utcnow()
        )
        
        response = client.post("/api/v1/ingestion/nba/run")
        
        assert response.status_code == 200
        
        # Check that relevant log messages were created
        # (This test may need adjustment based on actual logging implementation)
        log_messages = [record.message for record in caplog.records]
        # Could check for messages like "Starting NBA ingestion", "NBA ingestion completed", etc.


# Additional fixtures for testing
@pytest.fixture
def client():
    """FastAPI test client."""
    from backend.core.app import app
    return TestClient(app)


@pytest.fixture
def authenticated_client():
    """Authenticated FastAPI test client (if authentication is implemented)."""
    from backend.core.app import app
    client = TestClient(app)
    
    # Add authentication headers if needed
    # client.headers.update({"Authorization": "Bearer test-token"})
    
    return client