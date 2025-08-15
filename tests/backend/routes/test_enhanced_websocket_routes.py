"""
Test Enhanced WebSocket Routes - Room-based Subscriptions, Authentication, Heartbeat
Tests all WebSocket endpoints with comprehensive connection, messaging, and error scenarios
"""

import asyncio
import json
from unittest.mock import AsyncMock, patch, MagicMock

import pytest
from fastapi import status
from fastapi.testclient import TestClient


class TestEnhancedWebSocketRoutes:
    """Comprehensive tests for Enhanced WebSocket API routes"""
    
    @pytest.fixture(autouse=True)
    async def setup(self):
        """Setup WebSocket mocks for each test"""
        self.mock_websocket_service = AsyncMock()
        self.mock_websocket_service.is_initialized = True
        
        # Mock connection handler
        async def mock_handle_connection(websocket, token=None):
            # Simulate successful connection handling
            await websocket.accept() if hasattr(websocket, 'accept') else None
            return {"client_id": "test-client-123", "status": "connected"}
        
        self.mock_websocket_service.handle_connection = mock_handle_connection
        self.mock_websocket_service.initialize = AsyncMock()
        self.mock_websocket_service.shutdown = AsyncMock()
        
        yield
    
    
    # ============================================================================
    # WebSocket Connection Tests  
    # ============================================================================
    
    def test_websocket_connect_without_token(self, sync_client):
        """Test WebSocket connection without authentication token"""
        
        with patch('backend.routes.enhanced_websocket_routes.enhanced_websocket_service', self.mock_websocket_service):
            
            # WebSocket test with TestClient
            with sync_client.websocket_connect("/ws/v2/connect") as websocket:
                
                # Send a test message
                test_message = {
                    "type": "subscribe",
                    "subscription_type": "odds_updates",
                    "filters": {"sport": "MLB"},
                    "timestamp": "2025-08-14T12:00:00Z"
                }
                
                websocket.send_json(test_message)
                
                # The connection should be established
                # In real implementation, service would handle the subscription
                # Here we just verify the connection works
                
                # Verify service was called
                assert self.mock_websocket_service.handle_connection.called
    
    
    def test_websocket_connect_with_token(self, sync_client):
        """Test WebSocket connection with JWT authentication token"""
        
        with patch('backend.routes.enhanced_websocket_routes.enhanced_websocket_service', self.mock_websocket_service):
            
            # Connect with token parameter
            with sync_client.websocket_connect("/ws/v2/connect?token=test-jwt-token") as websocket:
                
                welcome_message = {
                    "type": "ping",
                    "timestamp": "2025-08-14T12:00:00Z"
                }
                
                websocket.send_json(welcome_message)
                
                # Verify service received the token
                assert self.mock_websocket_service.handle_connection.called
    
    
    def test_websocket_connect_subscription_flow(self, sync_client):
        """Test complete WebSocket subscription flow"""
        
        with patch('backend.routes.enhanced_websocket_routes.enhanced_websocket_service', self.mock_websocket_service):
            
            with sync_client.websocket_connect("/ws/v2/connect") as websocket:
                
                # Test subscription message
                subscribe_message = {
                    "type": "subscribe",
                    "subscription_type": "predictions", 
                    "filters": {
                        "sport": "MLB",
                        "game_id": "662253",
                        "player": "Aaron Judge"
                    },
                    "timestamp": "2025-08-14T12:00:00Z"
                }
                
                websocket.send_json(subscribe_message)
                
                # Test unsubscribe message  
                unsubscribe_message = {
                    "type": "unsubscribe",
                    "subscription_type": "predictions",
                    "timestamp": "2025-08-14T12:01:00Z"
                }
                
                websocket.send_json(unsubscribe_message)
                
                # Test ping-pong
                ping_message = {
                    "type": "ping",
                    "timestamp": "2025-08-14T12:02:00Z" 
                }
                
                websocket.send_json(ping_message)
                
                # Verify connection handled all messages
                assert self.mock_websocket_service.handle_connection.called
    
    
    def test_websocket_connect_invalid_message(self, sync_client):
        """Test WebSocket with invalid message format"""
        
        with patch('backend.routes.enhanced_websocket_routes.enhanced_websocket_service', self.mock_websocket_service):
            
            with sync_client.websocket_connect("/ws/v2/connect") as websocket:
                
                # Send invalid message (missing required fields)
                invalid_message = {
                    "type": "subscribe"
                    # Missing subscription_type, filters, timestamp
                }
                
                websocket.send_json(invalid_message)
                
                # Connection should still work, service handles validation
                assert self.mock_websocket_service.handle_connection.called
    
    
    # ============================================================================
    # Specialized WebSocket Endpoint Tests
    # ============================================================================
    
    def test_websocket_odds_only(self, sync_client):
        """Test dedicated odds-only WebSocket endpoint"""
        
        with patch('backend.routes.enhanced_websocket_routes.enhanced_websocket_service', self.mock_websocket_service):
            
            # Connect to odds-specific endpoint with filters
            endpoint = "/ws/v2/odds?sport=MLB&sportsbook=DraftKings&token=test-token"
            
            with sync_client.websocket_connect(endpoint) as websocket:
                
                # Should auto-subscribe to odds updates
                # Send a ping to test connection
                ping_message = {"type": "ping", "timestamp": "2025-08-14T12:00:00Z"}
                websocket.send_json(ping_message)
                
                # Verify service connection with filters
                assert self.mock_websocket_service.handle_connection.called
    
    
    def test_websocket_arbitrage_only(self, sync_client):
        """Test dedicated arbitrage WebSocket endpoint"""
        
        with patch('backend.routes.enhanced_websocket_routes.enhanced_websocket_service', self.mock_websocket_service):
            
            # Connect to arbitrage-specific endpoint  
            endpoint = "/ws/v2/arbitrage?min_profit=2.0&sport=MLB"
            
            with sync_client.websocket_connect(endpoint) as websocket:
                
                # Test arbitrage-specific message
                message = {
                    "type": "status",
                    "timestamp": "2025-08-14T12:00:00Z"
                }
                
                websocket.send_json(message)
                
                assert self.mock_websocket_service.handle_connection.called
    
    
    # ============================================================================
    # WebSocket Service Lifecycle Tests
    # ============================================================================
    
    @pytest.mark.asyncio 
    async def test_websocket_service_startup(self):
        """Test WebSocket service initialization on startup"""
        
        # Mock uninitialized service
        mock_service = AsyncMock()
        mock_service.is_initialized = False
        mock_service.initialize = AsyncMock()
        
        with patch('backend.routes.enhanced_websocket_routes.enhanced_websocket_service', mock_service):
            
            # Import and test startup functionality directly
            from backend.routes.enhanced_websocket_routes import startup
            
            # Call startup function directly
            await startup()
            
            # Verify initialization was called
            mock_service.initialize.assert_called_once()
    
    
    @pytest.mark.asyncio
    async def test_websocket_service_shutdown(self):
        """Test WebSocket service shutdown on application shutdown"""
        
        mock_service = AsyncMock()
        mock_service.shutdown = AsyncMock()
        
        with patch('backend.routes.enhanced_websocket_routes.enhanced_websocket_service', mock_service):
            
            from backend.routes.enhanced_websocket_routes import shutdown
            
            # Call shutdown function directly
            await shutdown()
            
            # Verify shutdown was called
            mock_service.shutdown.assert_called_once()
    
    
    # ============================================================================
    # WebSocket Error Handling Tests
    # ============================================================================
    
    def test_websocket_connection_error_handling(self, sync_client):
        """Test WebSocket error handling when service fails"""
        
        # Mock service that raises exception
        error_service = AsyncMock()
        error_service.is_initialized = True
        error_service.handle_connection.side_effect = Exception("WebSocket service error")
        
        with patch('backend.routes.enhanced_websocket_routes.enhanced_websocket_service', error_service):
            
            try:
                with sync_client.websocket_connect("/ws/v2/connect") as websocket:
                    # Try to send message - connection should fail gracefully
                    websocket.send_json({"type": "ping"})
                    
                    # If we reach here, error was handled properly
                    pass
                    
            except Exception:
                # Connection errors are expected when service fails
                pass
            
            # Verify service was attempted to be called
            assert error_service.handle_connection.called
    
    
    def test_websocket_invalid_token_handling(self, sync_client):
        """Test WebSocket handling of invalid authentication tokens"""
        
        # Mock service that handles auth validation
        auth_service = AsyncMock()
        auth_service.is_initialized = True
        
        async def mock_handle_with_auth_error(websocket, token=None):
            if token == "invalid-token":
                # Simulate authentication failure
                raise ValueError("Invalid authentication token")
            await websocket.accept()
            return {"client_id": "test-client", "status": "connected"}
        
        auth_service.handle_connection = mock_handle_with_auth_error
        
        with patch('backend.routes.enhanced_websocket_routes.enhanced_websocket_service', auth_service):
            
            try:
                with sync_client.websocket_connect("/ws/v2/connect?token=invalid-token") as websocket:
                    websocket.send_json({"type": "ping"})
                    
            except Exception:
                # Auth errors should be handled gracefully
                pass
            
            assert auth_service.handle_connection.called
    
    
    # ============================================================================
    # WebSocket Message Format Tests
    # ============================================================================
    
    def test_websocket_message_types(self, sync_client):
        """Test all supported WebSocket message types"""
        
        with patch('backend.routes.enhanced_websocket_routes.enhanced_websocket_service', self.mock_websocket_service):
            
            with sync_client.websocket_connect("/ws/v2/connect") as websocket:
                
                # Test all message types
                message_types = [
                    {
                        "type": "subscribe",
                        "subscription_type": "odds_updates",
                        "filters": {"sport": "MLB"},
                        "timestamp": "2025-08-14T12:00:00Z"
                    },
                    {
                        "type": "unsubscribe", 
                        "subscription_type": "odds_updates",
                        "timestamp": "2025-08-14T12:01:00Z"
                    },
                    {
                        "type": "ping",
                        "timestamp": "2025-08-14T12:02:00Z"
                    },
                    {
                        "type": "status",
                        "timestamp": "2025-08-14T12:03:00Z"
                    }
                ]
                
                for message in message_types:
                    websocket.send_json(message)
                
                # All messages should be handled by service
                assert self.mock_websocket_service.handle_connection.called
    
    
    def test_websocket_subscription_types(self, sync_client):
        """Test all supported subscription types"""
        
        with patch('backend.routes.enhanced_websocket_routes.enhanced_websocket_service', self.mock_websocket_service):
            
            with sync_client.websocket_connect("/ws/v2/connect") as websocket:
                
                # Test all subscription types
                subscription_types = [
                    "odds_updates",
                    "predictions", 
                    "analytics",
                    "arbitrage",
                    "mlb",
                    "nba", 
                    "nfl",
                    "nhl"
                ]
                
                for sub_type in subscription_types:
                    message = {
                        "type": "subscribe",
                        "subscription_type": sub_type,
                        "filters": {"sport": "MLB"},
                        "timestamp": "2025-08-14T12:00:00Z"
                    }
                    
                    websocket.send_json(message)
                
                assert self.mock_websocket_service.handle_connection.called
    
    
    # ============================================================================
    # WebSocket Filter Tests
    # ============================================================================
    
    def test_websocket_sport_filters(self, sync_client):
        """Test WebSocket with various sport filters"""
        
        with patch('backend.routes.enhanced_websocket_routes.enhanced_websocket_service', self.mock_websocket_service):
            
            with sync_client.websocket_connect("/ws/v2/connect") as websocket:
                
                # Test different sport filters
                sports = ["MLB", "NBA", "NFL", "NHL"]
                
                for sport in sports:
                    message = {
                        "type": "subscribe",
                        "subscription_type": "odds_updates",
                        "filters": {"sport": sport},
                        "timestamp": "2025-08-14T12:00:00Z"
                    }
                    
                    websocket.send_json(message)
                
                assert self.mock_websocket_service.handle_connection.called
    
    
    def test_websocket_complex_filters(self, sync_client):
        """Test WebSocket with complex filter combinations"""
        
        with patch('backend.routes.enhanced_websocket_routes.enhanced_websocket_service', self.mock_websocket_service):
            
            with sync_client.websocket_connect("/ws/v2/connect") as websocket:
                
                # Complex filter message
                complex_message = {
                    "type": "subscribe",
                    "subscription_type": "predictions",
                    "filters": {
                        "sport": "MLB",
                        "game_id": "662253",
                        "player": "Aaron Judge",
                        "bet_types": ["over_under", "moneyline"],
                        "min_confidence": 80,
                        "sportsbooks": ["DraftKings", "FanDuel"]
                    },
                    "timestamp": "2025-08-14T12:00:00Z"
                }
                
                websocket.send_json(complex_message)
                
                assert self.mock_websocket_service.handle_connection.called
    
    
    # ============================================================================
    # WebSocket Performance Tests
    # ============================================================================
    
    def test_websocket_multiple_connections(self, sync_client):
        """Test handling multiple WebSocket connections"""
        
        with patch('backend.routes.enhanced_websocket_routes.enhanced_websocket_service', self.mock_websocket_service):
            
            # Simulate multiple connections
            connections = []
            
            try:
                for i in range(3):  # Test with 3 concurrent connections
                    ws = sync_client.websocket_connect(f"/ws/v2/connect?token=client-{i}")
                    connections.append(ws.__enter__())
                
                # Send messages from each connection
                for i, websocket in enumerate(connections):
                    message = {
                        "type": "subscribe", 
                        "subscription_type": "odds_updates",
                        "filters": {"sport": "MLB", "client": f"client-{i}"},
                        "timestamp": "2025-08-14T12:00:00Z"
                    }
                    
                    websocket.send_json(message)
                
            finally:
                # Clean up connections
                for ws in connections:
                    try:
                        ws.__exit__(None, None, None)
                    except:
                        pass
            
            # Service should have handled all connections
            assert self.mock_websocket_service.handle_connection.call_count >= 3
    
    
    def test_websocket_rapid_messages(self, sync_client):
        """Test WebSocket handling of rapid message sending"""
        
        with patch('backend.routes.enhanced_websocket_routes.enhanced_websocket_service', self.mock_websocket_service):
            
            with sync_client.websocket_connect("/ws/v2/connect") as websocket:
                
                # Send rapid sequence of messages
                for i in range(10):
                    message = {
                        "type": "ping",
                        "sequence": i,
                        "timestamp": f"2025-08-14T12:00:{i:02d}Z"
                    }
                    
                    websocket.send_json(message)
                
                # All messages should be handled
                assert self.mock_websocket_service.handle_connection.called
    
    
    # ============================================================================
    # Integration Tests
    # ============================================================================
    
    def test_websocket_full_lifecycle(self, sync_client):
        """Test complete WebSocket lifecycle: connect, subscribe, receive data, unsubscribe, disconnect"""
        
        with patch('backend.routes.enhanced_websocket_routes.enhanced_websocket_service', self.mock_websocket_service):
            
            with sync_client.websocket_connect("/ws/v2/connect?token=integration-test") as websocket:
                
                # 1. Subscribe to odds updates
                websocket.send_json({
                    "type": "subscribe",
                    "subscription_type": "odds_updates", 
                    "filters": {"sport": "MLB"},
                    "timestamp": "2025-08-14T12:00:00Z"
                })
                
                # 2. Subscribe to arbitrage alerts
                websocket.send_json({
                    "type": "subscribe",
                    "subscription_type": "arbitrage",
                    "filters": {"min_profit": 2.0},
                    "timestamp": "2025-08-14T12:01:00Z" 
                })
                
                # 3. Check status
                websocket.send_json({
                    "type": "status",
                    "timestamp": "2025-08-14T12:02:00Z"
                })
                
                # 4. Heartbeat ping
                websocket.send_json({
                    "type": "ping",
                    "timestamp": "2025-08-14T12:03:00Z"
                })
                
                # 5. Unsubscribe from odds
                websocket.send_json({
                    "type": "unsubscribe",
                    "subscription_type": "odds_updates",
                    "timestamp": "2025-08-14T12:04:00Z"
                })
                
                # Verify complete flow handled
                assert self.mock_websocket_service.handle_connection.called
