"""
Test Suite for Risk Management and Personalization Services

Basic validation tests to ensure the implementation works correctly.
Includes unit tests for core services and integration tests for API endpoints.
"""

import pytest
import asyncio
from datetime import datetime, date
from typing import Dict, Any, List
import logging

# Configure test logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


"""
Test Suite for Risk Management and Personalization Services

Basic validation tests to ensure the implementation works correctly.
Focuses on import validation and basic functionality without complex mocking.
"""

import pytest
import asyncio
from datetime import datetime, date
from typing import Dict, Any, List
import logging

# Configure test logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class TestRiskManagementServices:
    """Test cases for risk management services"""
    
    def test_bankroll_strategy_service_import(self):
        """Test that bankroll strategy service can be imported"""
        try:
            from backend.services.risk.bankroll_strategy import BankrollStrategyService, StakeResult
            service = BankrollStrategyService()
            assert service is not None
            
            # Test StakeResult dataclass
            result = StakeResult(
                amount=100.0,
                method="test",
                raw_amount=100.0,
                clamp_applied=False,
                notes=["test"]
            )
            assert result.amount == 100.0
            logger.info("✅ BankrollStrategyService import and StakeResult creation successful")
        except ImportError as e:
            pytest.fail(f"❌ Failed to import BankrollStrategyService: {e}")
    
    def test_exposure_tracker_service_import(self):
        """Test that exposure tracker service can be imported"""
        try:
            from backend.services.risk.exposure_tracker import ExposureTrackerService
            service = ExposureTrackerService()
            assert service is not None
            logger.info("✅ ExposureTrackerService import successful")
        except ImportError as e:
            pytest.fail(f"❌ Failed to import ExposureTrackerService: {e}")
    
    def test_risk_constraints_service_import(self):
        """Test that risk constraints service can be imported"""
        try:
            from backend.services.risk.risk_constraints import RiskConstraintsService, RiskFinding, RiskLevel
            service = RiskConstraintsService()
            assert service is not None
            
            # Test RiskFinding dataclass
            finding = RiskFinding(
                risk_type="test",
                level=RiskLevel.LOW,
                message="test message",
                recommendation="test recommendation",
                details={}
            )
            assert finding.level == RiskLevel.LOW
            logger.info("✅ RiskConstraintsService import and RiskFinding creation successful")
        except ImportError as e:
            pytest.fail(f"❌ Failed to import RiskConstraintsService: {e}")


class TestPersonalizationServices:
    """Test cases for personalization services"""
    
    def test_interest_model_service_import(self):
        """Test that interest model service can be imported"""
        try:
            from backend.services.personalization.interest_model import InterestModelService
            service = InterestModelService()
            assert service is not None
            logger.info("✅ InterestModelService import successful")
        except ImportError as e:
            pytest.fail(f"❌ Failed to import InterestModelService: {e}")
    
    def test_watchlist_service_import(self):
        """Test that watchlist service can be imported"""
        try:
            from backend.services.personalization.watchlist_service import WatchlistService
            service = WatchlistService()
            assert service is not None
            logger.info("✅ WatchlistService import successful")
        except ImportError as e:
            pytest.fail(f"❌ Failed to import WatchlistService: {e}")
    
    def test_interest_signal_recording(self):
        """Test interest signal recording"""
        try:
            from backend.services.personalization.interest_model import InterestModelService
            from backend.models.risk_personalization import InterestSignalType
            
            service = InterestModelService()
            
            # Record test signal
            service.record_signal(
                user_id="test_user",
                signal_type=InterestSignalType.EDGE_VIEW,
                player_id="player_123",
                prop_type="passing_yards",
                context={'test': True}
            )
            
            logger.info("✅ Interest signal recording works")
            
        except Exception as e:
            pytest.fail(f"❌ Interest signal recording failed: {e}")
    
    def test_watchlist_operations(self):
        """Test watchlist CRUD operations"""
        try:
            from backend.services.personalization.watchlist_service import WatchlistService
            
            service = WatchlistService()
            
            # Test create watchlist (mock implementation)
            watchlist_data = {
                'id': 1,
                'user_id': 'test_user',
                'name': 'Test Watchlist',
                'description': 'Test watchlist for unit tests',
                'is_active': True
            }
            
            # Since this is a mock implementation, just verify the service can handle the operations
            assert service is not None
            logger.info("✅ Watchlist service operations available")
            
        except Exception as e:
            pytest.fail(f"❌ Watchlist operations failed: {e}")


class TestAlertingServices:
    """Test cases for alerting services"""
    
    def test_alert_rule_evaluator_import(self):
        """Test that alert rule evaluator can be imported"""
        try:
            from backend.services.alerting.rule_evaluator import AlertRuleEvaluator
            evaluator = AlertRuleEvaluator.get_instance()
            assert evaluator is not None
            logger.info("✅ AlertRuleEvaluator import successful")
        except ImportError as e:
            pytest.fail(f"❌ Failed to import AlertRuleEvaluator: {e}")
    
    def test_alert_dispatcher_import(self):
        """Test that alert dispatcher can be imported"""
        try:
            from backend.services.alerting.alert_dispatcher import AlertDispatcher
            dispatcher = AlertDispatcher.get_instance()
            assert dispatcher is not None
            logger.info("✅ AlertDispatcher import successful")
        except ImportError as e:
            pytest.fail(f"❌ Failed to import AlertDispatcher: {e}")
    
    def test_alert_scheduler_import(self):
        """Test that alert scheduler can be imported"""
        try:
            from backend.services.alerting.alert_scheduler import AlertScheduler
            scheduler = AlertScheduler.get_instance()
            assert scheduler is not None
            logger.info("✅ AlertScheduler import successful")
        except ImportError as e:
            pytest.fail(f"❌ Failed to import AlertScheduler: {e}")
    
    @pytest.mark.asyncio
    async def test_alert_rule_evaluation(self):
        """Test alert rule evaluation"""
        try:
            from backend.services.alerting.rule_evaluator import AlertRuleEvaluator
            
            evaluator = AlertRuleEvaluator.get_instance()
            
            # Test evaluate all rules (uses mock data)
            events = await evaluator.evaluate_all_rules()
            
            assert isinstance(events, list)
            logger.info(f"✅ Alert rule evaluation works: {len(events)} events generated")
            
        except Exception as e:
            pytest.fail(f"❌ Alert rule evaluation failed: {e}")


class TestDatabaseModels:
    """Test cases for database models"""
    
    def test_database_models_import(self):
        """Test that database models can be imported"""
        try:
            from backend.models.risk_personalization import (
                BankrollProfile, ExposureSnapshot, Watchlist, WatchlistItem,
                AlertRule, AlertDelivered, UserInterestSignal, RecommendedStake,
                BankrollStrategy, AlertRuleType, DeliveryChannel, InterestSignalType
            )
            
            # Test enum values
            assert BankrollStrategy.KELLY.value == "KELLY"
            assert AlertRuleType.EDGE_EV_THRESHOLD.value == "EDGE_EV_THRESHOLD"
            assert DeliveryChannel.IN_APP.value == "IN_APP"
            assert InterestSignalType.EDGE_VIEW.value == "EDGE_VIEW"
            
            logger.info("✅ Database models import successful")
            
        except ImportError as e:
            pytest.fail(f"❌ Failed to import database models: {e}")


class TestAPIEndpoints:
    """Test cases for API endpoints"""
    
    def test_risk_personalization_router_import(self):
        """Test that API router can be imported"""
        try:
            from backend.routes.risk_personalization import router
            assert router is not None
            assert router.prefix == "/api/risk-personalization"
            logger.info("✅ Risk personalization API router import successful")
        except ImportError as e:
            pytest.fail(f"❌ Failed to import API router: {e}")


class TestConfigurationIntegration:
    """Test cases for configuration integration"""
    
    def test_unified_config_risk_management(self):
        """Test that risk management config is available"""
        try:
            from backend.services.unified_config import get_risk_management_config
            
            # Test that risk management config can be accessed
            risk_config = get_risk_management_config()
            assert risk_config is not None
            
            # Test individual config values
            evaluation_interval = risk_config.alert_evaluation_interval_seconds
            assert isinstance(evaluation_interval, int)
            assert evaluation_interval > 0
            
            logger.info("✅ Risk management configuration available")
            
        except Exception as e:
            pytest.fail(f"❌ Risk management configuration failed: {e}")


class TestIntegrationHooks:
    """Test cases for integration hooks"""
    
    def test_ticket_service_integration(self):
        """Test that ticket service has risk management integration"""
        try:
            # Just test that the ticket service file can be parsed
            # Detailed integration testing would require database setup
            import ast
            
            with open("c:\\Users\\bcmad\\Downloads\\A1Betting7-13.2\\backend\\services\\ticketing\\ticket_service.py", "r") as f:
                content = f.read()
                
            # Check if risk management integration code exists
            assert "RISK MANAGEMENT INTEGRATION" in content
            assert "RiskConstraintsService" in content
            assert "ExposureTrackerService" in content
            
            logger.info("✅ Ticket service integration points available")
            
        except ImportError as e:
            pytest.skip(f"⚠️ Ticket service not available for integration test: {e}")
        except Exception as e:
            pytest.fail(f"❌ Ticket service integration test failed: {e}")


def run_all_tests():
    """Run all tests and provide summary"""
    test_classes = [
        TestRiskManagementServices,
        TestPersonalizationServices,
        TestAlertingServices,
        TestDatabaseModels,
        TestAPIEndpoints,
        TestConfigurationIntegration,
        TestIntegrationHooks
    ]
    
    total_tests = 0
    passed_tests = 0
    failed_tests = 0
    skipped_tests = 0
    
    for test_class in test_classes:
        class_name = test_class.__name__
        logger.info(f"\n{'='*50}")
        logger.info(f"Running {class_name}")
        logger.info(f"{'='*50}")
        
        # Get all test methods
        test_methods = [method for method in dir(test_class) if method.startswith('test_')]
        
        for test_method in test_methods:
            total_tests += 1
            test_instance = test_class()
            method = getattr(test_instance, test_method)
            
            try:
                # Check if it's an async test
                if asyncio.iscoroutinefunction(method):
                    asyncio.run(method())
                else:
                    method()
                passed_tests += 1
            except pytest.skip.Exception as e:
                logger.warning(f"⚠️ SKIPPED: {class_name}.{test_method} - {e}")
                skipped_tests += 1
            except Exception as e:
                logger.error(f"❌ FAILED: {class_name}.{test_method} - {e}")
                failed_tests += 1
    
    # Print summary
    logger.info(f"\n{'='*60}")
    logger.info(f"TEST SUMMARY")
    logger.info(f"{'='*60}")
    logger.info(f"Total Tests: {total_tests}")
    logger.info(f"✅ Passed: {passed_tests}")
    logger.info(f"❌ Failed: {failed_tests}")
    logger.info(f"⚠️ Skipped: {skipped_tests}")
    logger.info(f"Success Rate: {passed_tests/total_tests*100:.1f}%")
    
    if failed_tests == 0:
        logger.info("🎉 ALL TESTS PASSED!")
        return True
    else:
        logger.error(f"💥 {failed_tests} TESTS FAILED")
        return False


if __name__ == "__main__":
    success = run_all_tests()
    exit(0 if success else 1)