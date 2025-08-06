"""
Phase 2.6: Advanced Testing Strategies Implementation
Modern testing framework with async support, mocking, and comprehensive coverage
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

# Import components to test
from backend.services.modern_async_architecture import (
    AsyncAnalyticsService,
    AsyncBettingService,
    AsyncTaskManager,
    RequestContext,
    example_ml_analysis_task,
    task_manager,
)

logger = logging.getLogger(__name__)

# =============================================================================
# TEST FIXTURES AND UTILITIES
# =============================================================================


@pytest.fixture
def request_context():
    """Create a test request context"""
    return RequestContext(
        user_id="test_user_123", correlation_id="test_correlation_456"
    )


@pytest.fixture
def mock_db_session():
    """Create a mock database session"""
    mock_session = AsyncMock(spec=AsyncSession)
    mock_session.execute = AsyncMock()
    mock_session.commit = AsyncMock()
    mock_session.rollback = AsyncMock()
    mock_session.close = AsyncMock()
    return mock_session


@pytest.fixture
def analytics_service():
    """Create analytics service instance"""
    return AsyncAnalyticsService()


@pytest.fixture
def betting_service():
    """Create betting service instance"""
    return AsyncBettingService()


@pytest.fixture
def task_manager_instance():
    """Create fresh task manager instance"""
    return AsyncTaskManager()


@pytest.fixture
async def async_client():
    """Create async HTTP client for testing"""
    from backend.main import app

    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client


# =============================================================================
# UNIT TESTS FOR ASYNC SERVICES
# =============================================================================


class TestAsyncAnalyticsService:
    """Test suite for AsyncAnalyticsService"""

    @pytest.mark.asyncio
    async def test_analyze_predictions_success(
        self,
        analytics_service: AsyncAnalyticsService,
        request_context: RequestContext,
        mock_db_session: AsyncSession,
    ):
        """Test successful prediction analysis"""
        game_id = "game_123"

        result = await analytics_service.analyze_predictions(
            game_id, request_context, mock_db_session
        )

        # Assertions
        assert result["game_id"] == game_id
        assert result["request_id"] == request_context.request_id
        assert "confidence_score" in result
        assert "predicted_outcome" in result
        assert "factors" in result
        assert len(result["factors"]) == 5

        # Verify confidence score is reasonable
        assert 0 <= result["confidence_score"] <= 1

        # Verify factors have proper structure
        for factor in result["factors"]:
            assert "name" in factor
            assert "weight" in factor
            assert "value" in factor
            assert 0 <= factor["weight"] <= 1
            assert 0 <= factor["value"] <= 1

    @pytest.mark.asyncio
    async def test_analyze_predictions_with_cache(
        self,
        analytics_service: AsyncAnalyticsService,
        request_context: RequestContext,
        mock_db_session: AsyncSession,
    ):
        """Test prediction analysis with caching behavior"""
        game_id = "game_cache_test"

        # First call
        result1 = await analytics_service.analyze_predictions(
            game_id, request_context, mock_db_session
        )

        # Second call (should potentially use cache if implemented)
        result2 = await analytics_service.analyze_predictions(
            game_id, request_context, mock_db_session
        )

        # Basic structure should be consistent
        assert result1["game_id"] == result2["game_id"]
        assert len(result1["factors"]) == len(result2["factors"])


class TestAsyncBettingService:
    """Test suite for AsyncBettingService"""

    @pytest.mark.asyncio
    async def test_process_bet_placement_success(
        self,
        betting_service: AsyncBettingService,
        request_context: RequestContext,
        mock_db_session: AsyncSession,
    ):
        """Test successful bet placement"""
        bet_data = {"bet_id": "bet_123", "amount": 50.0, "odds": 2.5}

        result = await betting_service.process_bet_placement(
            bet_data, request_context, mock_db_session
        )

        # Assertions
        assert result["bet_id"] == bet_data["bet_id"]
        assert result["status"] == "placed"
        assert result["request_id"] == request_context.request_id
        assert result["amount"] == bet_data["amount"]
        assert result["odds"] == bet_data["odds"]
        assert result["expected_payout"] == bet_data["amount"] * bet_data["odds"]

    @pytest.mark.asyncio
    async def test_process_bet_placement_invalid_amount(
        self,
        betting_service: AsyncBettingService,
        request_context: RequestContext,
        mock_db_session: AsyncSession,
    ):
        """Test bet placement with invalid amount"""
        bet_data = {
            "bet_id": "bet_invalid",
            "amount": -10.0,  # Invalid negative amount
            "odds": 2.0,
        }

        with pytest.raises(ValueError, match="Invalid bet amount"):
            await betting_service.process_bet_placement(
                bet_data, request_context, mock_db_session
            )

    @pytest.mark.asyncio
    async def test_process_bet_placement_zero_amount(
        self,
        betting_service: AsyncBettingService,
        request_context: RequestContext,
        mock_db_session: AsyncSession,
    ):
        """Test bet placement with zero amount"""
        bet_data = {"bet_id": "bet_zero", "amount": 0.0, "odds": 2.0}

        with pytest.raises(ValueError, match="Invalid bet amount"):
            await betting_service.process_bet_placement(
                bet_data, request_context, mock_db_session
            )


class TestAsyncTaskManager:
    """Test suite for AsyncTaskManager"""

    @pytest.mark.asyncio
    async def test_create_and_track_task(self, task_manager_instance: AsyncTaskManager):
        """Test task creation and tracking"""

        async def simple_task(task_id, context, **kwargs):
            await asyncio.sleep(0.1)
            return {"task_id": task_id, "result": "success"}

        # Create task
        task_id = await task_manager_instance.create_task(
            simple_task, test_param="value"
        )

        # Verify task is tracked
        assert task_id in task_manager_instance.tasks
        status = task_manager_instance.get_task_status(task_id)
        assert status is not None
        assert status.task_id == task_id

        # Wait for completion
        result = await task_manager_instance.wait_for_task(task_id, timeout=5)

        # Verify result
        assert result["task_id"] == task_id
        assert result["result"] == "success"

        # Verify final status
        final_status = task_manager_instance.get_task_status(task_id)
        assert final_status.status == "completed"
        assert final_status.result == result

    @pytest.mark.asyncio
    async def test_task_failure_handling(self, task_manager_instance: AsyncTaskManager):
        """Test task failure handling"""

        async def failing_task(task_id, context, **kwargs):
            await asyncio.sleep(0.1)
            raise ValueError("Simulated task failure")

        # Create failing task
        task_id = await task_manager_instance.create_task(failing_task)

        # Wait and expect failure
        with pytest.raises(ValueError, match="Simulated task failure"):
            await task_manager_instance.wait_for_task(task_id, timeout=5)

        # Verify error status
        status = task_manager_instance.get_task_status(task_id)
        assert status.status == "failed"
        assert "Simulated task failure" in status.error

    @pytest.mark.asyncio
    async def test_task_timeout(self, task_manager_instance: AsyncTaskManager):
        """Test task timeout handling"""

        async def slow_task(task_id, context, **kwargs):
            await asyncio.sleep(10)  # Longer than timeout
            return {"result": "should_not_reach"}

        # Create slow task
        task_id = await task_manager_instance.create_task(slow_task)

        # Wait with short timeout
        with pytest.raises(RuntimeError, match="Task timeout"):
            await task_manager_instance.wait_for_task(task_id, timeout=0.5)

    def test_list_tasks_with_filter(self, task_manager_instance: AsyncTaskManager):
        """Test task listing with status filter"""
        # Manually add some test tasks to the manager
        from backend.services.modern_async_architecture import TaskStatus

        tasks = [
            TaskStatus(
                task_id="completed_1", status="completed", created_at=datetime.utcnow()
            ),
            TaskStatus(
                task_id="failed_1", status="failed", created_at=datetime.utcnow()
            ),
            TaskStatus(
                task_id="pending_1", status="pending", created_at=datetime.utcnow()
            ),
            TaskStatus(
                task_id="completed_2", status="completed", created_at=datetime.utcnow()
            ),
        ]

        for task in tasks:
            task_manager_instance.tasks[task.task_id] = task

        # Test filtering
        completed_tasks = task_manager_instance.list_tasks(status_filter="completed")
        assert len(completed_tasks) == 2
        assert all(task.status == "completed" for task in completed_tasks)

        failed_tasks = task_manager_instance.list_tasks(status_filter="failed")
        assert len(failed_tasks) == 1
        assert failed_tasks[0].status == "failed"

        all_tasks = task_manager_instance.list_tasks()
        assert len(all_tasks) == 4


# =============================================================================
# INTEGRATION TESTS
# =============================================================================


class TestAsyncRouteIntegration:
    """Integration tests for async routes"""

    @pytest.mark.asyncio
    async def test_place_bet_endpoint(self, async_client: AsyncClient):
        """Test bet placement endpoint integration"""
        bet_request = {
            "game_id": "game_integration_test",
            "player_id": "player_123",
            "stat_type": "points",
            "line": 25.5,
            "odds": 1.95,
            "amount": 100.0,
            "bet_type": "over",
        }

        response = await async_client.post(
            "/api/v2/modern/betting/place-bet", json=bet_request
        )

        assert response.status_code == 200
        data = response.json()

        assert "bet_id" in data
        assert data["status"] == "placed"
        assert data["amount"] == bet_request["amount"]
        assert data["odds"] == bet_request["odds"]
        assert "request_id" in data

    @pytest.mark.asyncio
    async def test_analyze_game_sync_endpoint(self, async_client: AsyncClient):
        """Test synchronous game analysis endpoint"""
        analysis_request = {
            "game_id": "game_sync_test",
            "analysis_type": "comprehensive",
        }

        response = await async_client.post(
            "/api/v2/modern/analytics/analyze-game", json=analysis_request
        )

        assert response.status_code == 200
        data = response.json()

        assert data["success"] is True
        assert "analysis" in data
        assert data["analysis"]["game_id"] == analysis_request["game_id"]
        assert "request_id" in data

    @pytest.mark.asyncio
    async def test_analyze_game_async_endpoint(self, async_client: AsyncClient):
        """Test asynchronous game analysis endpoint"""
        analysis_request = {
            "game_id": "game_async_test",
            "analysis_type": "comprehensive",
        }

        response = await async_client.post(
            "/api/v2/modern/analytics/analyze-game-async", json=analysis_request
        )

        assert response.status_code == 200
        data = response.json()

        assert "task_id" in data
        assert data["status"] == "pending"
        assert "message" in data

        # Test task status endpoint
        task_id = data["task_id"]
        status_response = await async_client.get(f"/api/v2/modern/tasks/{task_id}")

        assert status_response.status_code == 200
        status_data = status_response.json()
        assert status_data["task_id"] == task_id

    @pytest.mark.asyncio
    async def test_batch_analyze_endpoint(self, async_client: AsyncClient):
        """Test batch analysis endpoint"""
        game_ids = ["game_batch_1", "game_batch_2", "game_batch_3"]

        response = await async_client.post(
            "/api/v2/modern/analytics/batch-analyze", json=game_ids
        )

        assert response.status_code == 200
        data = response.json()

        assert data["success"] is True
        assert data["total_games"] == len(game_ids)
        assert "processing_time" in data
        assert "results" in data
        assert "request_id" in data

    @pytest.mark.asyncio
    async def test_health_check_endpoint(self, async_client: AsyncClient):
        """Test async health check endpoint"""
        response = await async_client.get("/api/v2/modern/health/async")

        assert response.status_code == 200
        data = response.json()

        assert data["status"] == "healthy"
        assert "services" in data
        assert "response_time" in data
        assert "request_id" in data


# =============================================================================
# PERFORMANCE TESTS
# =============================================================================


class TestPerformance:
    """Performance tests for async operations"""

    @pytest.mark.asyncio
    async def test_concurrent_bet_processing(
        self, betting_service: AsyncBettingService
    ):
        """Test concurrent bet processing performance"""
        request_context = RequestContext()
        mock_db = AsyncMock(spec=AsyncSession)

        # Create multiple bet requests
        bet_requests = [
            {"bet_id": f"perf_bet_{i}", "amount": 50.0, "odds": 2.0} for i in range(10)
        ]

        # Process bets concurrently
        start_time = datetime.utcnow()

        results = await asyncio.gather(
            *[
                betting_service.process_bet_placement(
                    bet_data, request_context, mock_db
                )
                for bet_data in bet_requests
            ]
        )

        end_time = datetime.utcnow()
        processing_time = (end_time - start_time).total_seconds()

        # Verify all bets processed successfully
        assert len(results) == len(bet_requests)
        for i, result in enumerate(results):
            assert result["bet_id"] == f"perf_bet_{i}"
            assert result["status"] == "placed"

        # Performance assertion - should complete in reasonable time
        assert processing_time < 5.0  # All 10 bets in under 5 seconds

    @pytest.mark.asyncio
    async def test_background_task_performance(
        self, task_manager_instance: AsyncTaskManager
    ):
        """Test background task creation and management performance"""
        start_time = datetime.utcnow()

        # Create multiple background tasks
        task_ids = []
        for i in range(5):
            task_id = await task_manager_instance.create_task(
                example_ml_analysis_task, game_id=f"perf_game_{i}"
            )
            task_ids.append(task_id)

        # Wait for all tasks to complete
        results = await asyncio.gather(
            *[
                task_manager_instance.wait_for_task(task_id, timeout=30)
                for task_id in task_ids
            ]
        )

        end_time = datetime.utcnow()
        total_time = (end_time - start_time).total_seconds()

        # Verify results
        assert len(results) == 5
        for i, result in enumerate(results):
            assert result["game_id"] == f"perf_game_{i}"
            assert result["task_id"] == task_ids[i]

        # Performance should be better than sequential (tasks run concurrently)
        # Sequential would be ~35 seconds (7 seconds each), concurrent should be ~7-10 seconds
        assert total_time < 15.0


# =============================================================================
# ERROR HANDLING TESTS
# =============================================================================


class TestErrorHandling:
    """Test error handling and resilience"""

    @pytest.mark.asyncio
    async def test_database_connection_error(
        self, betting_service: AsyncBettingService
    ):
        """Test handling of database connection errors"""
        request_context = RequestContext()

        # Mock database session that raises connection error
        mock_db = AsyncMock(spec=AsyncSession)
        mock_db.execute.side_effect = ConnectionError("Database unavailable")

        bet_data = {"bet_id": "error_test_bet", "amount": 25.0, "odds": 1.8}

        # Should handle database error gracefully
        with pytest.raises(ConnectionError):
            await betting_service.process_bet_placement(
                bet_data, request_context, mock_db
            )

    @pytest.mark.asyncio
    async def test_task_cancellation(self, task_manager_instance: AsyncTaskManager):
        """Test proper task cancellation"""

        async def long_running_task(task_id, context, **kwargs):
            try:
                await asyncio.sleep(10)
                return {"result": "should_not_complete"}
            except asyncio.CancelledError:
                return {"result": "cancelled"}

        # Create long-running task
        task_id = await task_manager_instance.create_task(long_running_task)

        # Cancel the underlying asyncio task
        if task_id in task_manager_instance.running_tasks:
            task_manager_instance.running_tasks[task_id].cancel()

        # Verify task was cancelled
        await asyncio.sleep(0.1)  # Give time for cancellation
        status = task_manager_instance.get_task_status(task_id)

        # Task should be marked as failed or cancelled
        assert status.status in ["failed", "cancelled"]


# =============================================================================
# TEST CONFIGURATION
# =============================================================================

if __name__ == "__main__":
    # Configure logging for tests
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )

    # Run tests
    pytest.main([__file__, "-v", "--asyncio-mode=auto"])
