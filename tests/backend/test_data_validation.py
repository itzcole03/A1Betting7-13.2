"""
Tests for data validation pipeline functionality.
"""

import pytest
import asyncio
from datetime import datetime
from typing import Dict, Any, List

from backend.validators.data_validator import (
    DataValidator,
    ValidationWarning,
    ValidationWarningType,
    ValidationSummary,
    ValidationMetrics,
    get_validation_metrics
)


class TestDataValidator:
    """Test the DataValidator class with various invalid data scenarios."""

    def setup_method(self):
        """Setup a fresh validator for each test."""
        self.metrics = ValidationMetrics()
        self.validator = DataValidator(self.metrics)

    @pytest.mark.asyncio
    async def test_odds_completeness_validation(self):
        """Test validation of odds completeness requirements."""
        # Test case: Missing bookmaker
        opportunity_missing_bookmaker = {
            "player": "Test Player",
            "line": 1.5,
            "odds": -110
        }
        
        warnings = await self.validator.validate_opportunity(opportunity_missing_bookmaker)
        assert len(warnings) == 1
        assert warnings[0].type == ValidationWarningType.ODDS_INCOMPLETE
        assert "Missing bookmaker information" in warnings[0].message
        
        # Test case: Missing line data
        opportunity_missing_line = {
            "bestBookmaker": "DraftKings",
            "line": None,
            "overLine": None,
            "odds": -110
        }
        
        warnings = await self.validator.validate_opportunity(opportunity_missing_line)
        missing_line_warnings = [w for w in warnings if w.type == ValidationWarningType.ODDS_INCOMPLETE and "line data" in w.message]
        assert len(missing_line_warnings) == 1
        
        # Test case: Missing odds data
        opportunity_missing_odds = {
            "bestBookmaker": "FanDuel",
            "line": 2.5,
            "odds": None,
            "overOdds": None
        }
        
        warnings = await self.validator.validate_opportunity(opportunity_missing_odds)
        missing_odds_warnings = [w for w in warnings if w.type == ValidationWarningType.ODDS_INCOMPLETE and "odds data" in w.message]
        assert len(missing_odds_warnings) == 1

    @pytest.mark.asyncio
    async def test_odds_format_validation(self):
        """Test validation of odds format and data types."""
        # Test case: Non-numeric line
        opportunity_invalid_line = {
            "bestBookmaker": "DraftKings",
            "line": "not_a_number",
            "odds": -110
        }
        
        warnings = await self.validator.validate_opportunity(opportunity_invalid_line)
        format_warnings = [w for w in warnings if w.type == ValidationWarningType.ODDS_INVALID_FORMAT]
        assert len(format_warnings) >= 1
        assert any("must be numeric" in w.message for w in format_warnings)
        
        # Test case: Non-integer odds
        opportunity_invalid_odds = {
            "bestBookmaker": "FanDuel",
            "line": 2.5,
            "odds": "one_hundred_ten"
        }
        
        warnings = await self.validator.validate_opportunity(opportunity_invalid_odds)
        odds_format_warnings = [w for w in warnings if w.type == ValidationWarningType.ODDS_INVALID_FORMAT and "integer" in w.message]
        assert len(odds_format_warnings) >= 1

    @pytest.mark.asyncio
    async def test_ev_inputs_validation(self):
        """Test validation of Expected Value calculation inputs."""
        # Test case: Invalid fair odds (negative)
        opportunity_negative_fair_odds = {
            "bestBookmaker": "DraftKings",
            "line": 2.5,
            "odds": -110,
            "fairOdds": -150
        }
        
        warnings = await self.validator.validate_opportunity(opportunity_negative_fair_odds)
        fair_odds_warnings = [w for w in warnings if w.type == ValidationWarningType.EV_INVALID_FAIR_ODDS]
        assert len(fair_odds_warnings) >= 1
        assert any("must be greater than 0" in w.message for w in fair_odds_warnings)
        
        # Test case: Invalid fair odds (zero)
        opportunity_zero_fair_odds = {
            "bestBookmaker": "FanDuel",
            "line": 1.5,
            "odds": +120,
            "fairOdds": 0
        }
        
        warnings = await self.validator.validate_opportunity(opportunity_zero_fair_odds)
        fair_odds_warnings = [w for w in warnings if w.type == ValidationWarningType.EV_INVALID_FAIR_ODDS]
        assert len(fair_odds_warnings) >= 1
        
        # Test case: Market odds out of reasonable range
        opportunity_extreme_odds = {
            "bestBookmaker": "Caesars",
            "line": 3.5,
            "odds": -50000  # Extremely high negative odds
        }
        
        warnings = await self.validator.validate_opportunity(opportunity_extreme_odds)
        market_odds_warnings = [w for w in warnings if w.type == ValidationWarningType.EV_INVALID_MARKET_ODDS]
        assert len(market_odds_warnings) >= 1
        assert any("out of reasonable range" in w.message for w in market_odds_warnings)

    @pytest.mark.asyncio
    async def test_arbitrage_integrity_validation(self):
        """Test validation of arbitrage opportunity integrity."""
        # Test case: Arbitrage with missing sides
        opportunity_missing_arbitrage_sides = {
            "bestBookmaker": "DraftKings",
            "line": 2.5,
            "hasArbitrage": True,
            "overOdds": -110,
            "underOdds": None  # Missing under side
        }
        
        warnings = await self.validator.validate_opportunity(opportunity_missing_arbitrage_sides)
        arb_warnings = [w for w in warnings if w.type == ValidationWarningType.ARBITRAGE_MISSING_SIDES]
        assert len(arb_warnings) >= 1
        assert any("missing over/under odds" in w.message for w in arb_warnings)
        
        # Test case: Arbitrage with impossible probability sum
        opportunity_invalid_arbitrage = {
            "bestBookmaker": "FanDuel",
            "line": 1.5,
            "hasArbitrage": True,
            "overOdds": -1000,  # Very high probability
            "underOdds": -1000   # Very high probability (impossible combination)
        }
        
        warnings = await self.validator.validate_opportunity(opportunity_invalid_arbitrage)
        prob_warnings = [w for w in warnings if w.type == ValidationWarningType.ARBITRAGE_PROBABILITY_VIOLATION]
        assert len(prob_warnings) >= 1

    @pytest.mark.asyncio
    async def test_numerical_bounds_validation(self):
        """Test validation of numerical field bounds."""
        # Test case: Confidence score out of range (negative)
        opportunity_negative_confidence = {
            "bestBookmaker": "DraftKings",
            "line": 2.5,
            "odds": -110,
            "confidence": -10
        }
        
        warnings = await self.validator.validate_opportunity(opportunity_negative_confidence)
        bounds_warnings = [w for w in warnings if w.type == ValidationWarningType.NUMERICAL_BOUNDS_VIOLATION]
        assert len(bounds_warnings) >= 1
        assert any("Confidence score out of range" in w.message for w in bounds_warnings)
        
        # Test case: Confidence score out of range (too high)
        opportunity_high_confidence = {
            "bestBookmaker": "FanDuel",
            "line": 1.5,
            "odds": +120,
            "confidence": 150
        }
        
        warnings = await self.validator.validate_opportunity(opportunity_high_confidence)
        bounds_warnings = [w for w in warnings if w.type == ValidationWarningType.NUMERICAL_BOUNDS_VIOLATION]
        assert len(bounds_warnings) >= 1
        
        # Test case: Edge percentage out of reasonable range
        opportunity_extreme_edge = {
            "bestBookmaker": "Caesars",
            "line": 3.5,
            "odds": -110,
            "edge": 1000  # 1000% edge is unrealistic
        }
        
        warnings = await self.validator.validate_opportunity(opportunity_extreme_edge)
        edge_warnings = [w for w in warnings if w.type == ValidationWarningType.NUMERICAL_BOUNDS_VIOLATION and "Edge" in w.message]
        assert len(edge_warnings) >= 1

    @pytest.mark.asyncio
    async def test_valid_opportunity_no_warnings(self):
        """Test that a valid opportunity produces no warnings."""
        valid_opportunity = {
            "bestBookmaker": "DraftKings",
            "line": 2.5,
            "odds": -110,
            "fairOdds": 100,
            "confidence": 75.5,
            "edge": 8.2,
            "hasArbitrage": False
        }
        
        warnings = await self.validator.validate_opportunity(valid_opportunity)
        assert len(warnings) == 0

    @pytest.mark.asyncio
    async def test_validation_warning_serialization(self):
        """Test that validation warnings serialize correctly."""
        warning = ValidationWarning(
            type=ValidationWarningType.ODDS_INCOMPLETE,
            message="Test warning message",
            field="test_field",
            value="test_value",
            timestamp=datetime.now()
        )
        
        warning_dict = warning.to_dict()
        
        assert warning_dict["type"] == "odds_incomplete"
        assert warning_dict["message"] == "Test warning message"
        assert warning_dict["field"] == "test_field"
        assert warning_dict["value"] == "test_value"
        assert "timestamp" in warning_dict


class TestValidationMetrics:
    """Test the ValidationMetrics class for proper metrics collection."""

    def setup_method(self):
        """Setup fresh metrics for each test."""
        self.metrics = ValidationMetrics()

    @pytest.mark.asyncio
    async def test_metrics_warning_recording(self):
        """Test that validation warnings are properly recorded in metrics."""
        warning1 = ValidationWarning(
            type=ValidationWarningType.ODDS_INCOMPLETE,
            message="Test warning 1",
            field="field1",
            value="value1",
            timestamp=datetime.now()
        )
        
        warning2 = ValidationWarning(
            type=ValidationWarningType.EV_INVALID_FAIR_ODDS,
            message="Test warning 2",
            field="field2",
            value="value2",
            timestamp=datetime.now()
        )
        
        await self.metrics.record_warning(warning1)
        await self.metrics.record_warning(warning2)
        
        summary = await self.metrics.get_summary(minutes=15)
        
        assert summary.total_warnings == 2
        assert summary.warning_counts["odds_incomplete"] == 1
        assert summary.warning_counts["ev_invalid_fair_odds"] == 1

    @pytest.mark.asyncio
    async def test_metrics_summary_generation(self):
        """Test that validation summary is generated correctly."""
        # Record some warnings
        for i in range(5):
            warning = ValidationWarning(
                type=ValidationWarningType.ODDS_INCOMPLETE,
                message=f"Test warning {i}",
                field=f"field{i}",
                value=f"value{i}",
                timestamp=datetime.now()
            )
            await self.metrics.record_warning(warning)
        
        summary = await self.metrics.get_summary(minutes=15)
        
        assert summary.total_warnings == 5
        assert summary.warning_counts["odds_incomplete"] == 5
        assert summary.time_window_minutes == 15
        assert summary.total_validated >= 5  # Should estimate total validated items

    @pytest.mark.asyncio
    async def test_summary_serialization(self):
        """Test that validation summary serializes correctly."""
        summary = ValidationSummary(
            total_validated=100,
            total_warnings=10,
            warning_counts={"odds_incomplete": 5, "ev_invalid_fair_odds": 3, "arbitrage_probability_violation": 2},
            time_window_minutes=15,
            generated_at=datetime.now()
        )
        
        summary_dict = summary.to_dict()
        
        assert summary_dict["total_validated"] == 100
        assert summary_dict["total_warnings"] == 10
        assert summary_dict["warning_counts"]["odds_incomplete"] == 5
        assert summary_dict["time_window_minutes"] == 15
        assert summary_dict["warning_rate"] == 10.0  # 10/100 * 100
        assert "generated_at" in summary_dict


class TestValidationIntegration:
    """Test integration scenarios for the validation pipeline."""

    def setup_method(self):
        """Setup validator and sample opportunities."""
        self.metrics = ValidationMetrics()
        self.validator = DataValidator(self.metrics)

    @pytest.mark.asyncio
    async def test_multiple_validation_types(self):
        """Test an opportunity that triggers multiple validation warnings."""
        multi_violation_opportunity = {
            "player": "Test Player",
            # Missing bookmaker (odds completeness)
            "line": "invalid_line",  # Invalid format
            "odds": -50000,  # Out of reasonable range
            "fairOdds": -100,  # Invalid fair odds
            "confidence": 150,  # Out of bounds
            "hasArbitrage": True,
            "overOdds": -110,
            "underOdds": None  # Missing arbitrage side
        }
        
        warnings = await self.validator.validate_opportunity(multi_violation_opportunity)
        
        # Should have warnings from multiple categories
        warning_types = {w.type for w in warnings}
        
        assert ValidationWarningType.ODDS_INCOMPLETE in warning_types
        assert ValidationWarningType.ODDS_INVALID_FORMAT in warning_types
        assert ValidationWarningType.EV_INVALID_MARKET_ODDS in warning_types
        assert ValidationWarningType.EV_INVALID_FAIR_ODDS in warning_types
        assert ValidationWarningType.NUMERICAL_BOUNDS_VIOLATION in warning_types
        assert ValidationWarningType.ARBITRAGE_MISSING_SIDES in warning_types

    @pytest.mark.asyncio
    async def test_validation_does_not_fail_processing(self):
        """Test that validation errors don't prevent opportunity processing."""
        # Create an opportunity with severe validation issues
        broken_opportunity = {
            "player": None,
            "line": "completely_invalid",
            "odds": "not_a_number",
            "confidence": "invalid",
            "hasArbitrage": "not_boolean"
        }
        
        # Validation should complete without raising exceptions
        try:
            warnings = await self.validator.validate_opportunity(broken_opportunity)
            # Should have warnings but not crash
            assert len(warnings) > 0
        except Exception as e:
            pytest.fail(f"Validation should not raise exceptions, but got: {e}")

    @pytest.mark.asyncio
    async def test_global_metrics_collection(self):
        """Test that the global metrics instance works correctly."""
        global_metrics = get_validation_metrics()
        
        # Create a validator using global metrics
        validator = DataValidator(global_metrics)
        
        invalid_opportunity = {
            "bestBookmaker": "Test",
            "line": None,
            "odds": -110
        }
        
        warnings = await validator.validate_opportunity(invalid_opportunity)
        assert len(warnings) > 0
        
        # Check that global metrics recorded the warnings
        summary = await global_metrics.get_summary(minutes=5)
        assert summary.total_warnings > 0

    @pytest.mark.asyncio
    async def test_american_odds_probability_conversion(self):
        """Test the American odds to probability conversion utility."""
        # Test positive odds
        prob_positive = self.validator._american_odds_to_probability(200)
        expected_positive = 100 / (200 + 100)  # Should be 0.333...
        assert abs(prob_positive - expected_positive) < 0.001
        
        # Test negative odds
        prob_negative = self.validator._american_odds_to_probability(-150)
        expected_negative = 150 / (150 + 100)  # Should be 0.6
        assert abs(prob_negative - expected_negative) < 0.001

    @pytest.mark.asyncio
    async def test_realistic_arbitrage_scenario(self):
        """Test validation with realistic arbitrage scenarios."""
        # Valid arbitrage opportunity (should pass)
        valid_arbitrage = {
            "bestBookmaker": "DraftKings",
            "line": 2.5,
            "hasArbitrage": True,
            "overOdds": +105,  # Implied prob: ~48.78%
            "underOdds": +105  # Implied prob: ~48.78%, total ~97.56% (valid arbitrage)
        }
        
        warnings = await self.validator.validate_opportunity(valid_arbitrage)
        arb_warnings = [w for w in warnings if w.type == ValidationWarningType.ARBITRAGE_PROBABILITY_VIOLATION]
        assert len(arb_warnings) == 0  # Should not have arbitrage violations
        
        # Invalid arbitrage (probability sum too high)
        invalid_arbitrage = {
            "bestBookmaker": "FanDuel",
            "line": 1.5,
            "hasArbitrage": True,
            "overOdds": -200,  # Implied prob: ~66.67%
            "underOdds": -200  # Implied prob: ~66.67%, total ~133.33% (impossible)
        }
        
        warnings = await self.validator.validate_opportunity(invalid_arbitrage)
        arb_warnings = [w for w in warnings if w.type == ValidationWarningType.ARBITRAGE_PROBABILITY_VIOLATION]
        assert len(arb_warnings) >= 1  # Should have arbitrage violations


# Mock data for testing specific warning classes
MOCK_OPPORTUNITIES_WITH_VIOLATIONS = [
    {
        "name": "missing_bookmaker",
        "data": {
            "player": "Test Player",
            "line": 2.5,
            "odds": -110
            # Missing bestBookmaker
        },
        "expected_warnings": [ValidationWarningType.ODDS_INCOMPLETE]
    },
    {
        "name": "invalid_line_format",
        "data": {
            "bestBookmaker": "DraftKings",
            "line": "not_a_number",
            "odds": -110
        },
        "expected_warnings": [ValidationWarningType.ODDS_INVALID_FORMAT]
    },
    {
        "name": "extreme_odds",
        "data": {
            "bestBookmaker": "FanDuel",
            "line": 1.5,
            "odds": -100000  # Extremely high
        },
        "expected_warnings": [ValidationWarningType.EV_INVALID_MARKET_ODDS]
    },
    {
        "name": "invalid_fair_odds",
        "data": {
            "bestBookmaker": "Caesars",
            "line": 3.5,
            "odds": -110,
            "fairOdds": -50  # Negative fair odds
        },
        "expected_warnings": [ValidationWarningType.EV_INVALID_FAIR_ODDS]
    },
    {
        "name": "confidence_out_of_bounds",
        "data": {
            "bestBookmaker": "BetMGM",
            "line": 2.0,
            "odds": +120,
            "confidence": 150  # > 100
        },
        "expected_warnings": [ValidationWarningType.NUMERICAL_BOUNDS_VIOLATION]
    },
    {
        "name": "arbitrage_missing_sides",
        "data": {
            "bestBookmaker": "PointsBet",
            "line": 1.5,
            "hasArbitrage": True,
            "overOdds": -110,
            "underOdds": None  # Missing under side
        },
        "expected_warnings": [ValidationWarningType.ARBITRAGE_MISSING_SIDES]
    },
    {
        "name": "arbitrage_impossible_probabilities",
        "data": {
            "bestBookmaker": "WynnBET",
            "line": 2.5,
            "hasArbitrage": True,
            "overOdds": -500,  # ~83.33% implied
            "underOdds": -500  # ~83.33% implied, total >166% (impossible)
        },
        "expected_warnings": [ValidationWarningType.ARBITRAGE_PROBABILITY_VIOLATION]
    }
]


@pytest.mark.parametrize("mock_data", MOCK_OPPORTUNITIES_WITH_VIOLATIONS)
@pytest.mark.asyncio
async def test_specific_warning_types(mock_data):
    """Test that specific invalid data triggers the expected warning types."""
    metrics = ValidationMetrics()
    validator = DataValidator(metrics)
    
    warnings = await validator.validate_opportunity(mock_data["data"])
    warning_types = {w.type for w in warnings}
    
    for expected_type in mock_data["expected_warnings"]:
        assert expected_type in warning_types, f"Expected warning type {expected_type} not found for {mock_data['name']}"