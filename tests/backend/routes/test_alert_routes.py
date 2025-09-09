"""
Tests for Alert API routes.
Tests the HTTP endpoints for alert management.
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
from backend.models.alert_models import AlertType
from backend.services.alert_service import AlertService


@pytest.fixture
def client():
    """Create test client with alert routes"""
    from backend.routes.alert_routes import router
    from fastapi import FastAPI
    
    app = FastAPI()
    app.include_router(router)
    
    return TestClient(app)


@pytest.fixture
def mock_alert_service():
    """Mock alert service for testing"""
    # Reset singleton instance for testing
    AlertService._instance = None
    service = AlertService()
    return service


class TestAlertRoutesAPI:
    """Test alert API endpoints"""

    def test_create_alert_rule_success(self, client, mock_alert_service):
        """Test successful alert rule creation"""
        with patch('backend.routes.alert_routes.alert_service', mock_alert_service):
            response = client.post("/api/alerts/", json={
                "type": "ev_threshold",
                "sport": "MLB",
                "trigger_value": 10.0
            })
        
        assert response.status_code == 200
        data = response.json()
        assert data["type"] == "ev_threshold"
        assert data["sport"] == "MLB"
        assert data["trigger_value"] == 10.0
        assert data["is_active"] is True
        assert "id" in data

    def test_create_alert_rule_invalid_data(self, client):
        """Test alert rule creation with invalid data"""
        response = client.post("/api/alerts/", json={
            "type": "invalid_type",
            "trigger_value": -5.0  # Negative value should be invalid
        })
        
        assert response.status_code == 422  # Validation error

    def test_get_alert_rules(self, client, mock_alert_service):
        """Test retrieving user alert rules"""
        # Create a test rule first
        with patch('backend.routes.alert_routes.alert_service', mock_alert_service):
            # Create rule
            client.post("/api/alerts/", json={
                "type": "arbitrage",
                "sport": "NBA",
                "trigger_value": 2.0
            })
            
            # Get rules
            response = client.get("/api/alerts/")
        
        assert response.status_code == 200
        data = response.json()
        assert "rules" in data
        assert "total_count" in data
        assert data["total_count"] >= 1

    def test_delete_alert_rule_success(self, client, mock_alert_service):
        """Test successful alert rule deletion"""
        with patch('backend.routes.alert_routes.alert_service', mock_alert_service):
            # Create rule first
            create_response = client.post("/api/alerts/", json={
                "type": "line_movement",
                "trigger_value": 3.0
            })
            rule_id = create_response.json()["id"]
            
            # Delete rule
            response = client.delete(f"/api/alerts/{rule_id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Alert rule deleted successfully"
        assert data["rule_id"] == rule_id

    def test_delete_alert_rule_not_found(self, client, mock_alert_service):
        """Test deleting non-existent alert rule"""
        with patch('backend.routes.alert_routes.alert_service', mock_alert_service):
            response = client.delete("/api/alerts/nonexistent-id")
        
        assert response.status_code == 404
        data = response.json()
        assert "not found" in data["detail"].lower()

    def test_get_fired_alerts(self, client, mock_alert_service):
        """Test retrieving fired alerts"""
        with patch('backend.routes.alert_routes.alert_service', mock_alert_service):
            response = client.get("/api/alerts/fired")
        
        assert response.status_code == 200
        data = response.json()
        assert "fired_alerts" in data
        assert "total_count" in data
        assert "last_updated" in data

    def test_get_fired_alerts_with_limit(self, client, mock_alert_service):
        """Test retrieving fired alerts with custom limit"""
        with patch('backend.routes.alert_routes.alert_service', mock_alert_service):
            response = client.get("/api/alerts/fired?limit=10")
        
        assert response.status_code == 200
        data = response.json()
        assert "fired_alerts" in data

    def test_get_alert_stats(self, client, mock_alert_service):
        """Test retrieving alert statistics"""
        with patch('backend.routes.alert_routes.alert_service', mock_alert_service):
            response = client.get("/api/alerts/stats")
        
        assert response.status_code == 200
        data = response.json()
        assert "total_rules" in data
        assert "active_rules" in data
        assert "total_fired" in data
        assert "fired_today" in data

    def test_start_alert_evaluation(self, client, mock_alert_service):
        """Test manually starting alert evaluation"""
        with patch('backend.routes.alert_routes.alert_service', mock_alert_service):
            response = client.post("/api/alerts/evaluation/start")
        
        assert response.status_code == 200
        data = response.json()
        assert "started" in data["message"].lower()

    def test_stop_alert_evaluation(self, client, mock_alert_service):
        """Test manually stopping alert evaluation"""
        with patch('backend.routes.alert_routes.alert_service', mock_alert_service):
            response = client.post("/api/alerts/evaluation/stop")
        
        assert response.status_code == 200
        data = response.json()
        assert "stopped" in data["message"].lower()

    def test_trigger_manual_evaluation(self, client, mock_alert_service):
        """Test manually triggering alert evaluation"""
        with patch('backend.routes.alert_routes.alert_service', mock_alert_service):
            response = client.post("/api/alerts/evaluation/trigger")
        
        assert response.status_code == 200
        data = response.json()
        assert "completed" in data["message"].lower()
        assert "stats" in data


class TestAlertTypesValidation:
    """Test validation of different alert types"""

    def test_ev_threshold_alert_creation(self, client, mock_alert_service):
        """Test creating EV threshold alert"""
        with patch('backend.routes.alert_routes.alert_service', mock_alert_service):
            response = client.post("/api/alerts/", json={
                "type": "ev_threshold",
                "sport": "MLB",
                "player": "Aaron Judge",
                "market": "Home Runs",
                "trigger_value": 15.0
            })
        
        assert response.status_code == 200
        data = response.json()
        assert data["type"] == "ev_threshold"
        assert data["sport"] == "MLB"
        assert data["player"] == "Aaron Judge"
        assert data["market"] == "Home Runs"

    def test_arbitrage_alert_creation(self, client, mock_alert_service):
        """Test creating arbitrage alert"""
        with patch('backend.routes.alert_routes.alert_service', mock_alert_service):
            response = client.post("/api/alerts/", json={
                "type": "arbitrage",
                "sport": "NBA",
                "trigger_value": 1.0
            })
        
        assert response.status_code == 200
        data = response.json()
        assert data["type"] == "arbitrage"
        assert data["sport"] == "NBA"

    def test_line_movement_alert_creation(self, client, mock_alert_service):
        """Test creating line movement alert"""
        with patch('backend.routes.alert_routes.alert_service', mock_alert_service):
            response = client.post("/api/alerts/", json={
                "type": "line_movement",
                "sport": "NFL",
                "market": "Spread",
                "trigger_value": 2.5
            })
        
        assert response.status_code == 200
        data = response.json()
        assert data["type"] == "line_movement"
        assert data["sport"] == "NFL"
        assert data["market"] == "Spread"


class TestErrorHandling:
    """Test error handling in alert routes"""

    def test_service_error_handling(self, client):
        """Test handling of service errors"""
        with patch('backend.routes.alert_routes.alert_service') as mock_service:
            mock_service.create_alert_rule.side_effect = Exception("Service error")
            
            response = client.post("/api/alerts/", json={
                "type": "ev_threshold",
                "trigger_value": 10.0
            })
        
        assert response.status_code == 500
        assert "Failed to create alert rule" in response.json()["detail"]

    def test_invalid_json_payload(self, client):
        """Test handling of invalid JSON payload"""
        response = client.post("/api/alerts/", json={
            "invalid_field": "value"
        })
        
        assert response.status_code == 422  # Validation error

    def test_negative_trigger_value(self, client):
        """Test validation of negative trigger values"""
        response = client.post("/api/alerts/", json={
            "type": "ev_threshold",
            "trigger_value": -5.0
        })
        
        assert response.status_code == 422  # Validation error

    def test_invalid_limit_parameter(self, client, mock_alert_service):
        """Test invalid limit parameter for fired alerts"""
        with patch('backend.routes.alert_routes.alert_service', mock_alert_service):
            # Test limit too high
            response = client.get("/api/alerts/fired?limit=200")
            assert response.status_code == 422
            
            # Test limit too low
            response = client.get("/api/alerts/fired?limit=0")
            assert response.status_code == 422


class TestUserAuthenticationMock:
    """Test the user authentication mock functionality"""

    def test_default_user_id(self, client, mock_alert_service):
        """Test that default user ID is used in MVP"""
        with patch('backend.routes.alert_routes.alert_service', mock_alert_service):
            # Create rule (should use default user ID "user_123")
            response = client.post("/api/alerts/", json={
                "type": "ev_threshold",
                "trigger_value": 10.0
            })
            
            assert response.status_code == 200
            
            # Verify the rule was created for the default user
            rules_response = client.get("/api/alerts/")
            assert rules_response.status_code == 200
            assert rules_response.json()["total_count"] >= 1


@pytest.mark.asyncio
async def test_alert_integration_flow():
    """Integration test of the complete alert flow"""
    from backend.routes.alert_routes import router
    from fastapi import FastAPI
    
    app = FastAPI()
    app.include_router(router)
    client = TestClient(app)
    
    # Reset alert service
    AlertService._instance = None
    
    # 1. Create an alert rule
    create_response = client.post("/api/alerts/", json={
        "type": "ev_threshold",
        "sport": "MLB",
        "trigger_value": 8.0
    })
    assert create_response.status_code == 200
    rule_id = create_response.json()["id"]
    
    # 2. Get alert rules
    get_response = client.get("/api/alerts/")
    assert get_response.status_code == 200
    assert get_response.json()["total_count"] == 1
    
    # 3. Get stats
    stats_response = client.get("/api/alerts/stats")
    assert stats_response.status_code == 200
    stats = stats_response.json()
    assert stats["total_rules"] == 1
    assert stats["active_rules"] == 1
    
    # 4. Trigger manual evaluation
    eval_response = client.post("/api/alerts/evaluation/trigger")
    assert eval_response.status_code == 200
    
    # 5. Get fired alerts
    fired_response = client.get("/api/alerts/fired")
    assert fired_response.status_code == 200
    
    # 6. Delete the rule
    delete_response = client.delete(f"/api/alerts/{rule_id}")
    assert delete_response.status_code == 200
    
    # 7. Verify rule is deleted
    final_get_response = client.get("/api/alerts/")
    assert final_get_response.status_code == 200
    assert final_get_response.json()["total_count"] == 0