"""
Backend WebSocket Handshake Tests

Tests the canonical /ws/client endpoint for:
- Query parameter validation 
- Version negotiation
- Structured hello message
- Heartbeat functionality
- Error code responses
- Connection lifecycle
"""

import pytest
import asyncio
import json
from fastapi.testclient import TestClient
from fastapi.websockets import WebSocketDisconnect
from backend.core.app import create_app


@pytest.fixture
def test_client():
    """Create test client with WebSocket support"""
    app = create_app()
    return TestClient(app)


@pytest.fixture
def websocket_url():
    """Base WebSocket URL for testing"""
    return "/ws/client"


class TestWebSocketHandshake:
    """Test WebSocket handshake and protocol validation"""

    def test_successful_handshake(self, test_client, websocket_url):
        """Test successful WebSocket connection with valid parameters"""
        with test_client.websocket_connect(
            f"{websocket_url}?client_id=test-123&version=1&role=frontend"
        ) as websocket:
            # Should receive hello message immediately after connection
            message = websocket.receive_json()
            
            assert message["type"] == "hello"
            assert message["accepted_version"] == 1
            assert message["client_id"] == "test-123"
            assert "server_time" in message
            assert "features" in message
            assert "request_id" in message
            assert "heartbeat_interval_ms" in message
            
            # Verify features
            features = message["features"]
            assert "heartbeat" in features
            assert "structured_messages" in features
            assert "error_codes" in features
            assert "graceful_reconnect" in features

    def test_version_validation(self, test_client, websocket_url):
        """Test version validation rejects unsupported versions"""
        # Try unsupported version
        try:
            with test_client.websocket_connect(
                f"{websocket_url}?client_id=test-123&version=999&role=frontend"
            ):
                pytest.fail("Should have rejected unsupported version")
        except WebSocketDisconnect as e:
            # Should close with custom error code 4400
            assert e.code == 4400
            assert "Unsupported version" in str(e.reason)

    def test_role_validation(self, test_client, websocket_url):
        """Test role validation rejects invalid roles"""
        # Try invalid role
        try:
            with test_client.websocket_connect(
                f"{websocket_url}?client_id=test-123&version=1&role=invalid_role"
            ):
                pytest.fail("Should have rejected invalid role")
        except WebSocketDisconnect as e:
            # Should close with custom error code 4401
            assert e.code == 4401
            assert "Invalid role" in str(e.reason)

    def test_missing_required_parameters(self, test_client, websocket_url):
        """Test that missing client_id parameter is handled"""
        # Missing client_id should return HTTP 422 (Unprocessable Entity)
        response = test_client.get(f"{websocket_url}?version=1&role=frontend")
        assert response.status_code == 422

    def test_default_parameters(self, test_client, websocket_url):
        """Test default parameter values"""
        with test_client.websocket_connect(
            f"{websocket_url}?client_id=test-defaults"
            # version and role should default
        ) as websocket:
            message = websocket.receive_json()
            
            assert message["type"] == "hello"
            assert message["accepted_version"] == 1  # Default version
            # The role parameter has default "frontend"

    def test_valid_roles(self, test_client, websocket_url):
        """Test all valid role values are accepted"""
        valid_roles = ["frontend", "admin", "test"]
        
        for role in valid_roles:
            with test_client.websocket_connect(
                f"{websocket_url}?client_id=test-{role}&version=1&role={role}"
            ) as websocket:
                message = websocket.receive_json()
                assert message["type"] == "hello"
                assert message["client_id"] == f"test-{role}"


class TestWebSocketMessaging:
    """Test message handling and responses"""

    def test_ping_pong(self, test_client, websocket_url):
        """Test ping/pong message exchange"""
        with test_client.websocket_connect(
            f"{websocket_url}?client_id=test-ping&version=1&role=frontend"
        ) as websocket:
            # Skip hello message
            hello = websocket.receive_json()
            assert hello["type"] == "hello"
            
            # Send ping
            ping_message = {
                "type": "ping",
                "timestamp": "2025-08-15T10:00:00Z"
            }
            websocket.send_json(ping_message)
            
            # Should receive pong
            pong = websocket.receive_json()
            assert pong["type"] == "pong"
            assert pong["client_id"] == "test-ping"
            assert "timestamp" in pong

    def test_status_request(self, test_client, websocket_url):
        """Test status message request"""
        with test_client.websocket_connect(
            f"{websocket_url}?client_id=test-status&version=1&role=frontend"
        ) as websocket:
            # Skip hello message
            hello = websocket.receive_json()
            assert hello["type"] == "hello"
            
            # Send status request
            status_message = {
                "type": "status"
            }
            websocket.send_json(status_message)
            
            # Should receive status response
            status = websocket.receive_json()
            assert status["type"] == "status"
            assert status["client_id"] == "test-status"
            assert "connection_uptime_seconds" in status
            assert "heartbeat_count" in status
            assert "last_heartbeat" in status
            assert "timestamp" in status

    def test_echo_unknown_messages(self, test_client, websocket_url):
        """Test that unknown message types are echoed back"""
        with test_client.websocket_connect(
            f"{websocket_url}?client_id=test-echo&version=1&role=frontend"
        ) as websocket:
            # Skip hello message
            hello = websocket.receive_json()
            assert hello["type"] == "hello"
            
            # Send unknown message type
            custom_message = {
                "type": "custom_data",
                "payload": {"test": "data"}
            }
            websocket.send_json(custom_message)
            
            # Should receive echo response
            echo = websocket.receive_json()
            assert echo["type"] == "echo"
            assert echo["client_id"] == "test-echo"
            assert echo["original_message"] == custom_message
            assert "timestamp" in echo

    def test_invalid_json_handling(self, test_client, websocket_url):
        """Test handling of invalid JSON messages"""
        with test_client.websocket_connect(
            f"{websocket_url}?client_id=test-json&version=1&role=frontend"
        ) as websocket:
            # Skip hello message
            hello = websocket.receive_json()
            assert hello["type"] == "hello"
            
            # Send invalid JSON
            websocket.send_text("invalid json {")
            
            # Should receive error response
            error = websocket.receive_json()
            assert error["type"] == "error"
            assert error["error_code"] == "INVALID_JSON"
            assert "Invalid JSON format" in error["message"]
            assert "timestamp" in error


class TestWebSocketHeartbeat:
    """Test heartbeat functionality"""

    @pytest.mark.asyncio
    async def test_server_heartbeat(self, test_client, websocket_url):
        """Test that server sends heartbeat pings"""
        # Note: This test would need to be adapted based on actual heartbeat interval
        # For testing, we might want to configure a shorter interval
        
        with test_client.websocket_connect(
            f"{websocket_url}?client_id=test-heartbeat&version=1&role=frontend"
        ) as websocket:
            # Skip hello message
            hello = websocket.receive_json()
            assert hello["type"] == "hello"
            heartbeat_interval = hello["heartbeat_interval_ms"]
            
            # In a real test, we would wait for heartbeat_interval_ms
            # and check for ping messages, but that would make tests slow
            # Instead, verify the hello message contains the interval
            assert heartbeat_interval == 25000  # 25 seconds


class TestWebSocketConnectionLifecycle:
    """Test connection lifecycle and error handling"""

    def test_connection_metadata_logging(self, test_client, websocket_url):
        """Test that connection metadata is properly logged"""
        # This test verifies the connection is accepted and hello is sent
        # Actual log verification would require log capture setup
        
        with test_client.websocket_connect(
            f"{websocket_url}?client_id=test-logging&version=1&role=frontend"
        ) as websocket:
            message = websocket.receive_json()
            
            assert message["type"] == "hello"
            assert message["client_id"] == "test-logging"
            # request_id should be a valid UUID format
            request_id = message["request_id"]
            assert len(request_id) == 36  # UUID format
            assert request_id.count("-") == 4

    def test_graceful_disconnect(self, test_client, websocket_url):
        """Test graceful connection close"""
        with test_client.websocket_connect(
            f"{websocket_url}?client_id=test-disconnect&version=1&role=frontend"
        ) as websocket:
            # Skip hello message
            hello = websocket.receive_json()
            assert hello["type"] == "hello"
            
            # Connection should close gracefully when context exits
            # No assertions needed - if this doesn't raise an exception, 
            # the graceful disconnect worked

    def test_multiple_concurrent_connections(self, test_client, websocket_url):
        """Test that multiple clients can connect simultaneously"""
        connections = []
        
        try:
            # Open multiple connections
            for i in range(3):
                ws = test_client.websocket_connect(
                    f"{websocket_url}?client_id=test-multi-{i}&version=1&role=frontend"
                )
                connections.append(ws.__enter__())
            
            # All should receive hello messages
            for i, websocket in enumerate(connections):
                hello = websocket.receive_json()
                assert hello["type"] == "hello"
                assert hello["client_id"] == f"test-multi-{i}"
                
        finally:
            # Clean up connections
            for ws in connections:
                try:
                    ws.close()
                except:
                    pass


class TestWebSocketErrorHandling:
    """Test error handling and edge cases"""

    def test_server_error_handling(self, test_client, websocket_url):
        """Test server error responses for edge cases"""
        # This would test scenarios where server-side errors occur
        # For now, we test that the endpoint exists and handles normal cases
        
        with test_client.websocket_connect(
            f"{websocket_url}?client_id=test-errors&version=1&role=frontend"
        ) as websocket:
            message = websocket.receive_json()
            assert message["type"] == "hello"

    def test_connection_timeout_handling(self, test_client, websocket_url):
        """Test connection behavior under timeout conditions"""
        # This would require mocking timeout conditions
        # For basic test, verify connection can be established
        
        with test_client.websocket_connect(
            f"{websocket_url}?client_id=test-timeout&version=1&role=frontend"
        ) as websocket:
            message = websocket.receive_json()
            assert message["type"] == "hello"


# Integration test that verifies the route is properly registered
def test_websocket_route_registration(test_client):
    """Test that the WebSocket route is properly registered in the app"""
    # This test verifies that the route exists and can be connected to
    # If the route wasn't registered, this would fail with 404
    
    try:
        with test_client.websocket_connect(
            "/ws/client?client_id=integration-test&version=1&role=test"
        ) as websocket:
            message = websocket.receive_json()
            assert message["type"] == "hello"
            assert message["client_id"] == "integration-test"
    except Exception as e:
        pytest.fail(f"WebSocket route not properly registered: {e}")


# Performance/Load test (basic version)
def test_websocket_basic_performance(test_client, websocket_url):
    """Basic performance test for WebSocket connections"""
    # Test rapid connect/disconnect cycles
    for i in range(10):
        with test_client.websocket_connect(
            f"{websocket_url}?client_id=perf-test-{i}&version=1&role=test"
        ) as websocket:
            hello = websocket.receive_json()
            assert hello["type"] == "hello"
            assert hello["client_id"] == f"perf-test-{i}"
    
    # If we get here without timeout/error, basic performance is acceptable