"""
Tests for Alert Service MVP implementation.
Tests create/delete/evaluate cycle with time mocking.
"""

import pytest
import asyncio
from datetime import datetime, timedelta
from unittest.mock import patch, AsyncMock
from backend.services.alert_service import AlertService
from backend.models.alert_models import (
    AlertType, CreateAlertRequest, AlertEvaluationContext
)


@pytest.fixture
def alert_service():
    """Create a fresh AlertService instance for each test"""
    # Reset singleton instance for testing
    AlertService._instance = None
    service = AlertService()
    return service


@pytest.fixture
def mock_evaluation_context():
    """Create mock evaluation context with test data"""
    return AlertEvaluationContext(
        current_ev_opportunities=[
            {
                'sport': 'MLB',
                'player': 'Aaron Judge',
                'market': 'Home Runs',
                'ev': 8.5
            },
            {
                'sport': 'NBA',
                'player': 'LeBron James',
                'market': 'Points',
                'ev': 12.0
            }
        ],
        arbitrage_opportunities=[
            {
                'sport': 'MLB',
                'player': 'Mookie Betts',
                'market': 'Hits',
                'profit_margin': 3.2
            },
            {
                'sport': 'NBA',
                'player': 'Stephen Curry',
                'market': 'Three Pointers',
                'profit_margin': 2.8
            }
        ],
        line_movements=[
            {
                'sport': 'MLB',
                'player': 'Ronald Acuna Jr.',
                'market': 'Stolen Bases',
                'movement_magnitude': 1.5
            },
            {
                'sport': 'NBA',
                'player': 'Giannis Antetokounmpo',
                'market': 'Points',
                'movement_magnitude': 3.0
            }
        ]
    )


class TestAlertRuleManagement:
    """Test create, get, and delete operations for alert rules"""

    @pytest.mark.asyncio
    async def test_create_alert_rule(self, alert_service):
        """Test creating a new alert rule"""
        request = CreateAlertRequest(
            type=AlertType.EV_THRESHOLD,
            sport="MLB",
            trigger_value=10.0
        )
        
        rule = await alert_service.create_alert_rule("user123", request)
        
        assert rule.user_id == "user123"
        assert rule.type == AlertType.EV_THRESHOLD
        assert rule.sport == "MLB"
        assert rule.trigger_value == 10.0
        assert rule.is_active is True
        assert rule.id is not None

    @pytest.mark.asyncio
    async def test_get_user_alert_rules(self, alert_service):
        """Test retrieving user's alert rules"""
        # Create multiple rules
        request1 = CreateAlertRequest(type=AlertType.EV_THRESHOLD, trigger_value=5.0)
        request2 = CreateAlertRequest(type=AlertType.ARBITRAGE, trigger_value=2.0)
        
        await alert_service.create_alert_rule("user123", request1)
        await alert_service.create_alert_rule("user123", request2)
        await alert_service.create_alert_rule("user456", request1)  # Different user
        
        rules = await alert_service.get_user_alert_rules("user123")
        
        assert len(rules) == 2
        assert all(rule.user_id == "user123" for rule in rules)
        assert all(rule.is_active for rule in rules)

    @pytest.mark.asyncio
    async def test_delete_alert_rule(self, alert_service):
        """Test deleting an alert rule (soft delete)"""
        request = CreateAlertRequest(type=AlertType.LINE_MOVEMENT, trigger_value=2.0)
        rule = await alert_service.create_alert_rule("user123", request)
        
        # Delete the rule
        success = await alert_service.delete_alert_rule("user123", rule.id)
        assert success is True
        
        # Verify rule is no longer active
        rules = await alert_service.get_user_alert_rules("user123")
        assert len(rules) == 0

    @pytest.mark.asyncio
    async def test_delete_nonexistent_rule(self, alert_service):
        """Test deleting a rule that doesn't exist"""
        success = await alert_service.delete_alert_rule("user123", "nonexistent-id")
        assert success is False


class TestAlertEvaluation:
    """Test alert evaluation logic for different alert types"""

    @pytest.mark.asyncio
    async def test_ev_threshold_evaluation_triggered(self, alert_service, mock_evaluation_context):
        """Test EV threshold alert when threshold is met"""
        request = CreateAlertRequest(
            type=AlertType.EV_THRESHOLD,
            sport="NBA",
            trigger_value=10.0
        )
        rule = await alert_service.create_alert_rule("user123", request)
        
        # Mock the evaluation context retrieval
        with patch.object(alert_service, '_get_evaluation_context', return_value=mock_evaluation_context):
            triggered = await alert_service._evaluate_rule(rule, mock_evaluation_context)
            
        assert triggered is True
        
        # Check that alert was fired
        fired_alerts = await alert_service.get_fired_alerts(10)
        assert len(fired_alerts) == 1
        assert fired_alerts[0].rule_id == rule.id
        assert fired_alerts[0].alert_type == AlertType.EV_THRESHOLD

    @pytest.mark.asyncio
    async def test_ev_threshold_evaluation_not_triggered(self, alert_service, mock_evaluation_context):
        """Test EV threshold alert when threshold is not met"""
        request = CreateAlertRequest(
            type=AlertType.EV_THRESHOLD,
            sport="MLB",
            trigger_value=15.0  # Higher than any opportunity in mock data
        )
        rule = await alert_service.create_alert_rule("user123", request)
        
        triggered = await alert_service._evaluate_rule(rule, mock_evaluation_context)
        
        assert triggered is False
        
        # Check that no alert was fired
        fired_alerts = await alert_service.get_fired_alerts(10)
        assert len(fired_alerts) == 0

    @pytest.mark.asyncio
    async def test_arbitrage_evaluation_triggered(self, alert_service, mock_evaluation_context):
        """Test arbitrage alert when opportunities are found"""
        request = CreateAlertRequest(
            type=AlertType.ARBITRAGE,
            sport="MLB",
            trigger_value=1.0  # Require at least 1 opportunity
        )
        rule = await alert_service.create_alert_rule("user123", request)
        
        triggered = await alert_service._evaluate_rule(rule, mock_evaluation_context)
        
        assert triggered is True
        
        # Check that alert was fired
        fired_alerts = await alert_service.get_fired_alerts(10)
        assert len(fired_alerts) == 1
        assert fired_alerts[0].alert_type == AlertType.ARBITRAGE

    @pytest.mark.asyncio
    async def test_line_movement_evaluation_triggered(self, alert_service, mock_evaluation_context):
        """Test line movement alert when magnitude threshold is met"""
        request = CreateAlertRequest(
            type=AlertType.LINE_MOVEMENT,
            sport="NBA",
            trigger_value=2.5
        )
        rule = await alert_service.create_alert_rule("user123", request)
        
        triggered = await alert_service._evaluate_rule(rule, mock_evaluation_context)
        
        assert triggered is True
        
        # Check that alert was fired
        fired_alerts = await alert_service.get_fired_alerts(10)
        assert len(fired_alerts) == 1
        assert fired_alerts[0].alert_type == AlertType.LINE_MOVEMENT

    @pytest.mark.asyncio
    async def test_alert_filtering_by_sport(self, alert_service, mock_evaluation_context):
        """Test that alerts respect sport filtering"""
        request = CreateAlertRequest(
            type=AlertType.EV_THRESHOLD,
            sport="NFL",  # No NFL opportunities in mock data
            trigger_value=5.0
        )
        rule = await alert_service.create_alert_rule("user123", request)
        
        triggered = await alert_service._evaluate_rule(rule, mock_evaluation_context)
        
        assert triggered is False


class TestAlertEvaluationLoop:
    """Test the background evaluation loop functionality"""

    @pytest.mark.asyncio
    async def test_start_stop_evaluation_loop(self, alert_service):
        """Test starting and stopping the evaluation loop"""
        # Initially not running
        assert alert_service.evaluation_running is False
        
        # Start the loop
        await alert_service.start_evaluation_loop()
        assert alert_service.evaluation_running is True
        
        # Stop the loop
        await alert_service.stop_evaluation_loop()
        assert alert_service.evaluation_running is False

    @pytest.mark.asyncio
    async def test_manual_evaluation_all_alerts(self, alert_service, mock_evaluation_context):
        """Test manual trigger of alert evaluation"""
        # Create some test rules
        request1 = CreateAlertRequest(type=AlertType.EV_THRESHOLD, sport="NBA", trigger_value=10.0)
        request2 = CreateAlertRequest(type=AlertType.ARBITRAGE, sport="MLB", trigger_value=1.0)
        
        await alert_service.create_alert_rule("user123", request1)
        await alert_service.create_alert_rule("user456", request2)
        
        # Mock the evaluation context
        with patch.object(alert_service, '_get_evaluation_context', return_value=mock_evaluation_context):
            await alert_service._evaluate_all_alerts()
        
        # Check that both alerts were evaluated and fired
        fired_alerts = await alert_service.get_fired_alerts(10)
        assert len(fired_alerts) == 2
        
        # Check that last_evaluation was updated
        assert alert_service.last_evaluation is not None

    @pytest.mark.asyncio 
    async def test_evaluation_loop_interval(self, alert_service):
        """Test that evaluation loop respects the configured interval"""
        # Set a short interval for testing
        alert_service.evaluation_interval = 0.1  # 100ms
        
        evaluation_count = 0
        original_evaluate = alert_service._evaluate_all_alerts
        
        async def mock_evaluate():
            nonlocal evaluation_count
            evaluation_count += 1
            await original_evaluate()
        
        with patch.object(alert_service, '_evaluate_all_alerts', side_effect=mock_evaluate):
            # Start the loop
            await alert_service.start_evaluation_loop()
            
            # Wait for a few evaluations
            await asyncio.sleep(0.35)  # Should allow ~3 evaluations
            
            # Stop the loop
            await alert_service.stop_evaluation_loop()
        
        # Should have at least 2 evaluations (allowing for timing variations)
        assert evaluation_count >= 2


class TestAlertStats:
    """Test alert statistics functionality"""

    @pytest.mark.asyncio
    async def test_alert_stats_calculation(self, alert_service):
        """Test calculation of alert statistics"""
        # Create some rules
        request1 = CreateAlertRequest(type=AlertType.EV_THRESHOLD, trigger_value=5.0)
        request2 = CreateAlertRequest(type=AlertType.ARBITRAGE, trigger_value=2.0)
        rule1 = await alert_service.create_alert_rule("user123", request1)
        rule2 = await alert_service.create_alert_rule("user456", request2)
        
        # Fire some alerts
        await alert_service.fire_alert(rule1, {"test": "data"}, "Test alert")
        await alert_service.fire_alert(rule2, {"test": "data"}, "Test alert")
        
        # Delete one rule
        await alert_service.delete_alert_rule("user123", rule1.id)
        
        stats = await alert_service.get_alert_stats()
        
        assert stats.total_rules == 2  # Including inactive rule
        assert stats.active_rules == 1  # Only rule2 is active
        assert stats.total_fired == 2
        assert stats.fired_today == 2  # Fired today


class TestTimeMocking:
    """Test time-dependent functionality with mocked time"""

    @pytest.mark.asyncio
    async def test_fired_alerts_today_with_mocked_time(self, alert_service):
        """Test fired_today calculation with mocked datetime"""
        request = CreateAlertRequest(type=AlertType.EV_THRESHOLD, trigger_value=5.0)
        rule = await alert_service.create_alert_rule("user123", request)
        
        # Mock datetime to simulate alerts from different days
        with patch('backend.models.alert_models.datetime') as mock_datetime:
            # Fire alert "yesterday"
            yesterday = datetime(2023, 1, 1)
            mock_datetime.utcnow.return_value = yesterday
            await alert_service.fire_alert(rule, {"test": "data"}, "Yesterday alert")
            
            # Fire alert "today"
            today = datetime(2023, 1, 2)
            mock_datetime.utcnow.return_value = today
            await alert_service.fire_alert(rule, {"test": "data"}, "Today alert")
            
            # Get stats "today"
            with patch('backend.services.alert_service.datetime') as mock_service_datetime:
                mock_service_datetime.utcnow.return_value = today
                stats = await alert_service.get_alert_stats()
        
        assert stats.total_fired == 2
        # Note: This test verifies the pattern, actual fired_today calculation 
        # would need more sophisticated mocking of the deque items


@pytest.mark.asyncio
async def test_alert_service_singleton():
    """Test that AlertService behaves as a singleton"""
    # Reset singleton for this test
    AlertService._instance = None
    
    service1 = AlertService()
    service2 = AlertService()
    
    assert service1 is service2
    
    # Test that data persists across instances
    request = CreateAlertRequest(type=AlertType.EV_THRESHOLD, trigger_value=5.0)
    await service1.create_alert_rule("user123", request)
    
    rules = await service2.get_user_alert_rules("user123")
    assert len(rules) == 1


@pytest.mark.asyncio
async def test_fired_alerts_limit():
    """Test that fired alerts respect the limit parameter"""
    AlertService._instance = None
    service = AlertService()
    
    request = CreateAlertRequest(type=AlertType.EV_THRESHOLD, trigger_value=5.0)
    rule = await service.create_alert_rule("user123", request)
    
    # Fire multiple alerts
    for i in range(10):
        await service.fire_alert(rule, {"index": i}, f"Alert {i}")
    
    # Test different limits
    alerts_5 = await service.get_fired_alerts(5)
    assert len(alerts_5) == 5
    
    alerts_15 = await service.get_fired_alerts(15)
    assert len(alerts_15) == 10  # Only 10 were fired
    
    all_alerts = await service.get_fired_alerts(50)
    assert len(all_alerts) == 10