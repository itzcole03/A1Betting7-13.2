"""
Test Suite for Line Movement Tracking MVP

Tests Redis-based line movement service with comprehensive scenarios including:
- Snapshot recording and retrieval
- Movement calculation (magnitude, direction, volatility)
- Redis integration with fallback
- API endpoint validation
- Prometheus metrics instrumentation
"""

import pytest
import asyncio
import json
from datetime import datetime, timedelta
from unittest.mock import Mock, AsyncMock, patch

# Import the line movement components
from backend.models.line_movement import (
    LineSnapshot,
    MovementEvent,
    MovementStats,
    LineMovementResponse,
    MovementDirection,
    MovementConfiguration,
    DEFAULT_MOVEMENT_CONFIG,
    calculate_movement_stats,
    create_movement_event
)

from backend.services.line_movement_service import (
    LineMovementService,
    get_line_movement_service,
    trigger_snapshot
)

from backend.metrics.line_movement_metrics import LineMovementMetrics


class TestLineMovementModels:
    """Test line movement data models and calculations"""
    
    def test_line_snapshot_creation(self):
        """Test LineSnapshot model creation and validation"""
        snapshot = LineSnapshot(
            ts=datetime.now(),
            line=2.5,
            bestOdds=-110,
            source="test"
        )
        
        assert snapshot.line == 2.5
        assert snapshot.bestOdds == -110
        assert snapshot.source == "test"
        assert isinstance(snapshot.ts, datetime)
    
    def test_movement_event_creation(self):
        """Test MovementEvent creation with all fields"""
        event = create_movement_event(
            sport="MLB",
            player="Aaron Judge",
            market="HR",
            previous_line=2.0,
            new_line=2.5,
            source="test"
        )
        
        assert event.sport == "MLB"
        assert event.player == "Aaron Judge"
        assert event.market == "HR"
        assert event.magnitude == 0.5
        assert event.direction == MovementDirection.UP
        assert event.is_significant()  # magnitude > 0.25 threshold
    
    def test_movement_direction_detection(self):
        """Test direction detection logic"""
        # Up movement
        up_event = create_movement_event("MLB", "Player", "HR", 2.0, 2.5, "test")
        assert up_event.direction == MovementDirection.UP
        
        # Down movement  
        down_event = create_movement_event("MLB", "Player", "HR", 2.5, 2.2, "test")
        assert down_event.direction == MovementDirection.DOWN
        
        # Flat movement
        flat_event = create_movement_event("MLB", "Player", "HR", 2.5, 2.5, "test")
        assert flat_event.direction == MovementDirection.FLAT
    
    def test_calculate_movement_stats(self):
        """Test movement statistics calculation"""
        # Create test snapshots with varying lines
        snapshots = [
            LineSnapshot(ts=datetime.now() - timedelta(hours=3), line=2.0, bestOdds=-110, source="test"),
            LineSnapshot(ts=datetime.now() - timedelta(hours=2), line=2.2, bestOdds=-105, source="test"),
            LineSnapshot(ts=datetime.now() - timedelta(hours=1), line=2.5, bestOdds=-115, source="test"),
            LineSnapshot(ts=datetime.now(), line=2.3, bestOdds=-108, source="test")
        ]
        
        stats = calculate_movement_stats(snapshots)
        
        assert stats.snapshotCount == 4
        assert stats.movementMagnitude == 0.3  # 2.3 - 2.0
        assert stats.direction == MovementDirection.UP  # Final > Initial
        assert stats.volatilityScore > 0  # Should have some volatility
        assert stats.lastUpdated is not None
    
    def test_volatility_calculation(self):
        """Test volatility scoring with different line patterns"""
        # High volatility - lots of movement
        volatile_snapshots = [
            LineSnapshot(ts=datetime.now() - timedelta(hours=4), line=2.0, bestOdds=-110, source="test"),
            LineSnapshot(ts=datetime.now() - timedelta(hours=3), line=2.8, bestOdds=-105, source="test"),
            LineSnapshot(ts=datetime.now() - timedelta(hours=2), line=2.1, bestOdds=-115, source="test"),
            LineSnapshot(ts=datetime.now() - timedelta(hours=1), line=2.7, bestOdds=-108, source="test"),
            LineSnapshot(ts=datetime.now(), line=2.3, bestOdds=-112, source="test")
        ]
        
        volatile_stats = calculate_movement_stats(volatile_snapshots)
        
        # Low volatility - stable line
        stable_snapshots = [
            LineSnapshot(ts=datetime.now() - timedelta(hours=4), line=2.5, bestOdds=-110, source="test"),
            LineSnapshot(ts=datetime.now() - timedelta(hours=3), line=2.5, bestOdds=-110, source="test"),
            LineSnapshot(ts=datetime.now() - timedelta(hours=2), line=2.5, bestOdds=-110, source="test"),
            LineSnapshot(ts=datetime.now(), line=2.5, bestOdds=-110, source="test")
        ]
        
        stable_stats = calculate_movement_stats(stable_snapshots)
        
        # Volatile should have higher score than stable
        assert volatile_stats.volatilityScore > stable_stats.volatilityScore
        assert stable_stats.volatilityScore == 0.0  # No variance in stable line


class TestLineMovementService:
    """Test the Redis-based line movement service"""
    
    @pytest.fixture
    async def mock_redis(self):
        """Mock Redis client for testing"""
        mock_redis = AsyncMock()
        mock_redis.ping = AsyncMock(return_value=True)
        mock_redis.lpush = AsyncMock(return_value=1)
        mock_redis.lrange = AsyncMock(return_value=[])
        mock_redis.ltrim = AsyncMock(return_value=True)
        mock_redis.keys = AsyncMock(return_value=[])
        mock_redis.expire = AsyncMock(return_value=True)
        return mock_redis
    
    @pytest.fixture
    def line_service(self, mock_redis):
        """Create line movement service with mocked Redis"""
        return LineMovementService(redis_client=mock_redis)
    
    async def test_service_initialization(self, line_service):
        """Test service initializes with correct configuration"""
        assert line_service.config == DEFAULT_MOVEMENT_CONFIG
        assert line_service._metrics.total_snapshots == 0
        assert line_service._metrics.high_volatility_events == 0
    
    async def test_record_snapshot_with_redis(self, line_service, mock_redis):
        """Test recording snapshot with Redis available"""
        # Mock Redis responses
        mock_redis.lrange.return_value = []  # No existing snapshots
        mock_redis.lpush.return_value = 1
        
        # Record a snapshot
        movement_event = await line_service.record_snapshot(
            sport="MLB",
            player="Aaron Judge", 
            market="HR",
            line=2.5,
            best_odds=-110,
            source="test"
        )
        
        # Verify the movement event
        assert movement_event.sport == "MLB"
        assert movement_event.player == "Aaron Judge"
        assert movement_event.market == "HR"
        assert movement_event.source == "test"
        
        # Verify Redis was called
        mock_redis.lpush.assert_called_once()
        mock_redis.ltrim.assert_called_once()
        mock_redis.expire.assert_called_once()
    
    async def test_record_snapshot_fallback_mode(self):
        """Test recording snapshot when Redis is unavailable"""
        # Create service without Redis
        service = LineMovementService(redis_client=None)
        
        movement_event = await service.record_snapshot(
            sport="MLB",
            player="Aaron Judge",
            market="HR", 
            line=2.5,
            best_odds=-110,
            source="test"
        )
        
        # Should still work with in-memory fallback
        assert movement_event.sport == "MLB"
        assert movement_event.player == "Aaron Judge"
        
        # Verify data stored in memory
        redis_key = service.config.generate_redis_key("MLB", "Aaron_Judge", "HR") 
        assert redis_key in service._in_memory_store
        assert len(service._in_memory_store[redis_key]) == 1
    
    async def test_get_snapshots_with_redis(self, line_service, mock_redis):
        """Test retrieving snapshots from Redis"""
        # Mock Redis response with JSON snapshot data
        test_snapshot = {
            "timestamp": datetime.now().isoformat(),
            "line": 2.5,
            "best_odds": -110,
            "source": "test"
        }
        mock_redis.lrange.return_value = [json.dumps(test_snapshot)]
        
        snapshots = await line_service.get_snapshots("MLB", "Aaron Judge", "HR")
        
        assert len(snapshots) == 1
        assert snapshots[0].line == 2.5
        assert snapshots[0].best_odds == -110
        assert snapshots[0].source == "test"
    
    async def test_get_movement_analysis(self, line_service, mock_redis):
        """Test getting comprehensive movement analysis"""
        # Create mock snapshots with movement
        test_snapshots = [
            {
                "timestamp": (datetime.now() - timedelta(hours=2)).isoformat(),
                "line": 2.0,
                "best_odds": -110, 
                "source": "test"
            },
            {
                "timestamp": (datetime.now() - timedelta(hours=1)).isoformat(),
                "line": 2.3,
                "best_odds": -105,
                "source": "test"
            },
            {
                "timestamp": datetime.now().isoformat(),
                "line": 2.5,
                "best_odds": -115,
                "source": "test"
            }
        ]
        
        mock_redis.lrange.return_value = [json.dumps(s) for s in test_snapshots]
        
        analysis = await line_service.get_movement_analysis(
            sport="MLB",
            player="Aaron Judge", 
            market="HR",
            limit=10
        )
        
        # Verify analysis structure
        assert isinstance(analysis, LineMovementResponse)
        assert len(analysis.timeline) == 3
        assert analysis.movementMagnitude == 0.5  # 2.5 - 2.0
        assert analysis.direction == "up"
        assert analysis.lastUpdated is not None
    
    async def test_cleanup_expired_snapshots(self, line_service, mock_redis):
        """Test cleanup of expired snapshots"""
        # Mock Redis keys
        mock_redis.keys.return_value = ["line_movement:MLB:Player1:HR", "line_movement:MLB:Player2:Points"]
        
        cleaned_count = await line_service.cleanup_expired_snapshots()
        
        # Should return count of processed keys
        assert isinstance(cleaned_count, int)
        mock_redis.keys.assert_called_once()


class TestLineMovementAPI:
    """Test the FastAPI endpoints for line movement"""
    
    @pytest.fixture
    def client(self):
        """Create test client for the API"""
        from fastapi.testclient import TestClient
        from backend.main import app
        return TestClient(app)
    
    def test_get_line_movement_endpoint(self, client):
        """Test GET /api/lines/movement endpoint"""
        response = client.get(
            "/api/lines/movement",
            params={
                "sport": "MLB",
                "player": "Aaron Judge",
                "market": "HR",
                "limit": 20
            }
        )
        
        # Should return 200 even with no data (empty timeline)
        assert response.status_code == 200
        data = response.json()
        
        assert "timeline" in data
        assert "movementMagnitude" in data
        assert "direction" in data
        assert "lastUpdated" in data
    
    def test_record_snapshot_endpoint(self, client):
        """Test POST /api/lines/movement/snapshot endpoint"""
        response = client.post(
            "/api/lines/movement/snapshot",
            params={
                "sport": "MLB",
                "player": "Aaron Judge",
                "market": "HR", 
                "line": 2.5,
                "best_odds": -110,
                "source": "manual_test"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["status"] == "success"
        assert "movement_event" in data
        assert data["movement_event"]["sport"] == "MLB"
        assert data["movement_event"]["player"] == "Aaron Judge"
    
    def test_get_recent_movements_endpoint(self, client):
        """Test GET /api/lines/movement/recent endpoint"""
        response = client.get(
            "/api/lines/movement/recent",
            params={
                "sport": "MLB",
                "hours_back": 24,
                "min_magnitude": 0.5,
                "limit": 50
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "movements" in data
        assert "total_found" in data
        assert "returned" in data
        assert "filters" in data
    
    def test_get_movement_metrics_endpoint(self, client):
        """Test GET /api/lines/movement/metrics endpoint"""
        response = client.get("/api/lines/movement/metrics")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "total_snapshots" in data
        assert "high_volatility_events" in data
        assert "active_tracked_lines" in data
    
    def test_health_check_endpoint(self, client):
        """Test GET /api/lines/movement/health endpoint"""
        response = client.get("/api/lines/movement/health")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "status" in data
        assert "service_available" in data
        assert "timestamp" in data


class TestLineMovementMetrics:
    """Test Prometheus metrics integration"""
    
    def test_record_snapshot_metric(self):
        """Test recording snapshot metrics"""
        # This will increment the counter
        LineMovementMetrics.record_snapshot("MLB", "HR", "test")
        
        # Verify no exceptions are raised (metrics should work)
        assert True  # If we get here, no exceptions occurred
    
    def test_record_volatility_metrics(self):
        """Test recording volatility metrics"""
        LineMovementMetrics.record_volatility_score("MLB", "HR", 1.5)
        LineMovementMetrics.record_high_volatility("MLB", "HR")
        
        # Verify no exceptions
        assert True
    
    def test_record_magnitude_metrics(self):
        """Test recording magnitude metrics"""
        LineMovementMetrics.record_magnitude("MLB", "HR", "up", 0.5)
        LineMovementMetrics.record_magnitude("MLB", "Points", "down", 1.2)
        
        # Verify no exceptions
        assert True
    
    @patch('backend.metrics.line_movement_metrics.generate_latest')
    def test_metrics_collection(self, mock_generate):
        """Test metrics collection for debugging"""
        from backend.metrics.line_movement_metrics import get_current_metrics
        
        mock_generate.return_value = b"# Prometheus metrics data"
        
        metrics = get_current_metrics()
        
        assert metrics["metrics_available"] is True
        assert "prometheus_format" in metrics


class TestLineMovementIntegration:
    """Integration tests for the complete line movement system"""
    
    async def test_full_workflow(self):
        """Test complete workflow: trigger -> record -> analyze -> query"""
        # 1. Trigger a snapshot
        movement_event = await trigger_snapshot(
            sport="MLB",
            player="Aaron Judge",
            market="HR",
            line=2.5,
            best_odds=-110,
            source="integration_test"
        )
        
        assert movement_event.sport == "MLB"
        assert movement_event.player == "Aaron Judge"
        
        # 2. Get the service and verify data
        service = await get_line_movement_service()
        snapshots = await service.get_snapshots("MLB", "Aaron Judge", "HR")
        
        assert len(snapshots) >= 1
        assert snapshots[0].line == 2.5
        
        # 3. Get analysis
        analysis = await service.get_movement_analysis("MLB", "Aaron Judge", "HR")
        
        assert isinstance(analysis, LineMovementResponse)
        assert len(analysis.timeline) >= 1
    
    async def test_multiple_snapshots_workflow(self):
        """Test workflow with multiple snapshots showing movement"""
        # Record multiple snapshots with changing lines
        snapshots_data = [
            (2.0, -110),
            (2.2, -105), 
            (2.5, -115),
            (2.3, -108)
        ]
        
        for line, odds in snapshots_data:
            await trigger_snapshot(
                sport="MLB",
                player="Test Player",
                market="Points",
                line=line,
                best_odds=odds,
                source="integration_test"
            )
            
            # Small delay to ensure different timestamps
            await asyncio.sleep(0.01)
        
        # Analyze the movement
        service = await get_line_movement_service()
        analysis = await service.get_movement_analysis("MLB", "Test Player", "Points")
        
        assert len(analysis.timeline) == 4
        assert analysis.movementMagnitude == 0.3  # 2.3 - 2.0
        assert analysis.direction == "up"
        assert analysis.volatilityScore > 0  # Should have volatility


if __name__ == "__main__":
    pytest.main([__file__, "-v"])