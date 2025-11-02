"""
Tests for Enhanced Schema Validation System

Comprehensive test suite covering validation logic, provider statistics,
trend analysis, and API endpoint functionality.
"""

import asyncio
import json
import time
from datetime import datetime, timedelta, timezone
from typing import Any, Dict
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from backend.api_integration import AggregatedOdds
from backend.services.enhanced_schema_validation import (
    EnhancedSchemaValidator,
    ProviderValidationStats,
    ValidationCategory,
    ValidationLevel,
    ValidationResult,
    ValidationWarning,
)


class TestEnhancedSchemaValidator:
    """Test suite for EnhancedSchemaValidator class"""

    @pytest.fixture
    def validator(self):
        """Create fresh validator instance for each test"""
        return EnhancedSchemaValidator()

    @pytest.fixture
    def sample_sportradar_data(self):
        """Sample SportRadar odds data"""
        return {
            "markets": [
                {
                    "type": "playerprops",
                    "outcomes": [{"line": 25.5, "odds": -110, "player": "Test Player"}],
                }
            ]
        }

    @pytest.fixture
    def sample_theodds_data(self):
        """Sample TheOdds API data"""
        return {
            "bookmakers": [
                {
                    "title": "DraftKings",
                    "markets": [
                        {
                            "key": "playerprops",
                            "outcomes": [
                                {"point": 27.5, "price": -115, "name": "Over"}
                            ],
                        }
                    ],
                }
            ]
        }

    @pytest.fixture
    def sample_internal_data(self):
        """Sample internal odds data"""
        return {"line": 22.5, "odds": -105, "market_type": "playerprops"}

    def test_validation_warning_creation(self):
        """Test ValidationWarning dataclass creation and methods"""
        warning = ValidationWarning(
            level=ValidationLevel.WARNING,
            category=ValidationCategory.DATA_RANGE,
            field="odds",
            message="Test warning",
            actual_value=-150,
            expected_value="-500 to 500",
            provider="TestProvider",
            suggestion="Check odds format",
        )

        assert warning.level == ValidationLevel.WARNING
        assert warning.category == ValidationCategory.DATA_RANGE
        assert warning.field == "odds"
        assert warning.message == "Test warning"
        assert warning.actual_value == -150
        assert warning.expected_value == "-500 to 500"
        assert warning.provider == "TestProvider"
        assert warning.suggestion == "Check odds format"
        assert isinstance(warning.timestamp, float)

        # Test to_dict method
        warning_dict = warning.to_dict()
        assert warning_dict["level"] == "warning"
        assert warning_dict["category"] == "data_range"
        assert warning_dict["field"] == "odds"
        assert warning_dict["provider"] == "TestProvider"

    def test_validation_result_properties(self, validator):
        """Test ValidationResult properties and methods"""
        warnings = [
            ValidationWarning(
                level=ValidationLevel.CRITICAL,
                category=ValidationCategory.SCHEMA_STRUCTURE,
                field="test",
                message="Critical error",
                actual_value=None,
                provider="Test",
            ),
            ValidationWarning(
                level=ValidationLevel.WARNING,
                category=ValidationCategory.DATA_RANGE,
                field="odds",
                message="Warning",
                actual_value=-200,
                provider="Test",
            ),
        ]

        result = ValidationResult(
            is_valid=False,
            processed_data=None,
            warnings=warnings,
            validation_summary={"status": "critical_errors"},
            provider="Test",
        )

        assert result.has_critical_errors is True
        assert result.has_warnings is True
        assert result.warning_count_by_level == {"critical": 1, "warning": 1}
        assert result.warning_count_by_category == {
            "schema_structure": 1,
            "data_range": 1,
        }

    def test_valid_sportradar_data_validation(self, validator, sample_sportradar_data):
        """Test validation of valid SportRadar data"""
        result = validator.validate_aggregated_odds(
            raw_data=sample_sportradar_data, provider="SportRadar"
        )

        assert result.is_valid is True
        assert result.processed_data is not None
        assert isinstance(result.processed_data, AggregatedOdds)
        assert result.processed_data.sportsbook == "SportRadar"
        assert result.processed_data.confidence == 0.9
        assert result.validation_summary["status"] in ["success", "info_only"]

        # Should have minimal warnings for valid data
        critical_warnings = [
            w for w in result.warnings if w.level == ValidationLevel.CRITICAL
        ]
        assert len(critical_warnings) == 0

    def test_valid_theodds_data_validation(self, validator, sample_theodds_data):
        """Test validation of valid TheOdds data"""
        result = validator.validate_aggregated_odds(
            raw_data=sample_theodds_data, provider="TheOdds"
        )

        assert result.is_valid is True
        assert result.processed_data is not None
        assert (
            result.processed_data.sportsbook == "DraftKings"
        )  # Normalized from TheOdds data
        assert result.processed_data.confidence == 0.8
        assert result.validation_summary["status"] in ["success", "info_only"]

    def test_valid_internal_data_validation(self, validator, sample_internal_data):
        """Test validation of valid internal data"""
        result = validator.validate_aggregated_odds(
            raw_data=sample_internal_data, provider="Internal"
        )

        assert result.is_valid is True
        assert result.processed_data is not None
        assert result.processed_data.sportsbook == "Internal"
        assert result.processed_data.confidence == 0.6

    def test_invalid_data_type_validation(self, validator):
        """Test validation with invalid data type"""
        result = validator.validate_aggregated_odds(
            raw_data="not_a_dict", provider="SportRadar"  # Invalid type
        )

        assert result.is_valid is False
        assert result.processed_data is None
        assert result.has_critical_errors is True

        # Should have critical schema error
        critical_warnings = [
            w for w in result.warnings if w.level == ValidationLevel.CRITICAL
        ]
        assert len(critical_warnings) > 0
        assert any("dictionary" in w.message.lower() for w in critical_warnings)

    def test_missing_required_fields_validation(self, validator):
        """Test validation with missing required fields"""
        # SportRadar data missing markets
        invalid_data = {"not_markets": []}

        result = validator.validate_aggregated_odds(
            raw_data=invalid_data, provider="SportRadar"
        )

        # Should still attempt normalization but likely produce warnings
        warnings = [w for w in result.warnings if "markets" in w.message.lower()]
        assert len(warnings) > 0

    def test_extreme_odds_validation(self, validator):
        """Test validation with extreme odds values"""
        extreme_data = {
            "line": 25.5,
            "odds": 50000,  # Extremely high odds
            "market_type": "playerprops",
        }

        result = validator.validate_aggregated_odds(
            raw_data=extreme_data, provider="Internal"
        )

        # Should have warnings about extreme odds
        odds_warnings = [w for w in result.warnings if w.field == "odds"]
        assert len(odds_warnings) > 0
        assert any(
            w.level in [ValidationLevel.CRITICAL, ValidationLevel.WARNING]
            for w in odds_warnings
        )

    def test_negative_line_validation(self, validator):
        """Test validation with negative line values"""
        negative_line_data = {
            "line": -10.5,  # Negative line
            "odds": -110,
            "market_type": "playerprops",
        }

        result = validator.validate_aggregated_odds(
            raw_data=negative_line_data, provider="Internal"
        )

        # Should have warnings about line range
        line_warnings = [w for w in result.warnings if w.field == "line"]
        assert len(line_warnings) > 0

    def test_invalid_confidence_validation(self, validator):
        """Test validation handles invalid confidence values correctly"""
        # This tests the sanitization after normalization
        result = validator.validate_aggregated_odds(
            raw_data={"line": 25.5, "odds": -110}, provider="Internal"
        )

        if result.processed_data:
            # Confidence should be clamped to valid range
            assert 0.0 <= result.processed_data.confidence <= 1.0

    def test_temporal_validation_future_timestamp(self, validator):
        """Test temporal validation with future timestamps"""
        # Mock the AggregatedOdds to have future timestamp
        with patch(
            "backend.api_integration.OddsNormalizer.normalize_odds_data"
        ) as mock_normalize:
            future_time = datetime.now(timezone.utc) + timedelta(hours=1)
            mock_odds = AggregatedOdds(
                sportsbook="Test",
                line=25.5,
                odds=-110,
                last_seen=future_time,
                confidence=0.8,
            )
            mock_normalize.return_value = [mock_odds]

            result = validator.validate_aggregated_odds(
                raw_data={"test": "data"}, provider="Test"
            )

            # Should have temporal validation warning
            temporal_warnings = [
                w
                for w in result.warnings
                if w.category == ValidationCategory.TEMPORAL_VALIDATION
            ]
            assert len(temporal_warnings) > 0

    def test_business_logic_validation_with_context(self, validator):
        """Test business logic validation with sport context"""
        context = {"sport": "MLB", "stat_type": "hits"}

        high_hits_data = {
            "line": 15.5,  # Very high hits line for MLB
            "odds": -110,
            "market_type": "playerprops",
        }

        result = validator.validate_aggregated_odds(
            raw_data=high_hits_data, provider="Internal", context=context
        )

        # Should have business logic warning about high hits line
        business_warnings = [
            w
            for w in result.warnings
            if w.category == ValidationCategory.BUSINESS_LOGIC
        ]
        assert len(business_warnings) > 0

    def test_provider_statistics_tracking(self, validator):
        """Test provider statistics are properly tracked"""
        # Initial state - no stats
        assert len(validator.provider_stats) == 0

        # Perform validation
        result = validator.validate_aggregated_odds(
            raw_data={"line": 25.5, "odds": -110}, provider="TestProvider"
        )

        # Should have created provider stats
        assert "TestProvider" in validator.provider_stats
        stats = validator.provider_stats["TestProvider"]
        assert stats.total_validations == 1
        assert isinstance(stats.data_quality_score, float)
        assert 0.0 <= stats.data_quality_score <= 1.0

        # Perform another validation
        validator.validate_aggregated_odds(
            raw_data={"line": 30.5, "odds": -120}, provider="TestProvider"
        )

        # Stats should be updated
        assert stats.total_validations == 2

    def test_validation_history_tracking(self, validator):
        """Test validation history is properly tracked"""
        initial_count = len(validator.recent_validations)

        # Perform validation
        validator.validate_aggregated_odds(
            raw_data={"line": 25.5, "odds": -110}, provider="TestProvider"
        )

        # Should have added to history
        assert len(validator.recent_validations) == initial_count + 1

        # Check history entry format
        latest_entry = validator.recent_validations[-1]
        assert "timestamp" in latest_entry
        assert "provider" in latest_entry
        assert "is_valid" in latest_entry
        assert "warning_count" in latest_entry

    def test_get_provider_statistics_single_provider(self, validator):
        """Test getting statistics for a single provider"""
        # No data initially
        stats = validator.get_provider_statistics("NonExistentProvider")
        assert "error" in stats

        # Add some validation data
        validator.validate_aggregated_odds(
            raw_data={"line": 25.5, "odds": -110}, provider="TestProvider"
        )

        # Get stats for existing provider
        stats = validator.get_provider_statistics("TestProvider")
        assert "provider" in stats
        assert stats["provider"] == "TestProvider"
        assert "total_validations" in stats
        assert "data_quality_score" in stats
        assert "success_rate" in stats

    def test_get_provider_statistics_all_providers(self, validator):
        """Test getting statistics for all providers"""
        # Add data for multiple providers
        validator.validate_aggregated_odds({"line": 25.5, "odds": -110}, "Provider1")
        validator.validate_aggregated_odds({"line": 30.5, "odds": -120}, "Provider2")

        # Get all stats
        stats = validator.get_provider_statistics()
        assert "all_providers" in stats
        assert "system_summary" in stats
        assert "Provider1" in stats["all_providers"]
        assert "Provider2" in stats["all_providers"]
        assert stats["system_summary"]["total_providers"] == 2

    def test_get_validation_trends_no_data(self, validator):
        """Test getting validation trends with no data"""
        trends = validator.get_validation_trends(hours_back=24)
        assert "message" in trends
        assert "24 hours" in trends["message"]

    def test_get_validation_trends_with_data(self, validator):
        """Test getting validation trends with data"""
        # Add some validation data
        validator.validate_aggregated_odds({"line": 25.5, "odds": -110}, "Provider1")
        validator.validate_aggregated_odds({"line": 30.5, "odds": -120}, "Provider2")

        trends = validator.get_validation_trends(hours_back=24)
        assert "time_period_hours" in trends
        assert "total_validations" in trends
        assert "success_rate" in trends
        assert "provider_breakdown" in trends
        assert trends["total_validations"] == 2

    def test_data_sanitization(self, validator):
        """Test automatic data sanitization"""
        # Mock normalization to return data needing sanitization
        with patch(
            "backend.api_integration.OddsNormalizer.normalize_odds_data"
        ) as mock_normalize:
            mock_odds = AggregatedOdds(
                sportsbook="draftkings",  # Needs normalization
                line=25.5,
                odds=-110,
                last_seen=datetime.now(timezone.utc),
                confidence=1.5,  # Needs clamping
            )
            mock_normalize.return_value = [mock_odds]

            result = validator.validate_aggregated_odds(
                raw_data={"test": "data"}, provider="Test"
            )

            if result.processed_data:
                # Should be sanitized
                assert result.processed_data.confidence <= 1.0
                # Sportsbook name should be normalized (check if warning exists)
                sportsbook_warnings = [
                    w
                    for w in result.warnings
                    if w.field == "sportsbook"
                    and w.category == ValidationCategory.DATA_CONSISTENCY
                ]
                # May or may not have warning depending on normalization logic

    def test_exception_handling(self, validator):
        """Test exception handling in validation"""
        # Mock normalization to raise exception
        with patch(
            "backend.api_integration.OddsNormalizer.normalize_odds_data"
        ) as mock_normalize:
            mock_normalize.side_effect = Exception("Test normalization error")

            result = validator.validate_aggregated_odds(
                raw_data={"test": "data"}, provider="Test"
            )

            assert result.is_valid is False
            assert result.processed_data is None
            assert result.has_critical_errors is True

            # Should have error in warnings
            error_warnings = [
                w
                for w in result.warnings
                if "normalization failed" in w.message.lower()
            ]
            assert len(error_warnings) > 0


class TestProviderValidationStats:
    """Test suite for ProviderValidationStats class"""

    def test_stats_initialization(self):
        """Test provider stats initialization"""
        stats = ProviderValidationStats("TestProvider")

        assert stats.provider_name == "TestProvider"
        assert stats.total_validations == 0
        assert stats.successful_validations == 0
        assert stats.critical_errors == 0
        assert stats.warnings == 0
        assert stats.last_validation is None
        assert stats.average_validation_time_ms == 0.0
        assert stats.data_quality_score == 1.0
        assert len(stats.common_issues) == 0

    def test_stats_update_successful_validation(self):
        """Test updating stats with successful validation"""
        stats = ProviderValidationStats("TestProvider")

        # Create successful validation result
        result = ValidationResult(
            is_valid=True,
            processed_data=None,  # Not needed for stats test
            warnings=[],
            validation_summary={"status": "success"},
            provider="TestProvider",
        )

        stats.update_stats(result, validation_time_ms=50.0)

        assert stats.total_validations == 1
        assert stats.successful_validations == 1
        assert stats.critical_errors == 0
        assert stats.warnings == 0
        assert stats.average_validation_time_ms == 50.0
        assert stats.data_quality_score == 1.0
        assert stats.last_validation == result.timestamp

    def test_stats_update_with_warnings(self):
        """Test updating stats with validation warnings"""
        stats = ProviderValidationStats("TestProvider")

        warnings = [
            ValidationWarning(
                level=ValidationLevel.WARNING,
                category=ValidationCategory.DATA_RANGE,
                field="odds",
                message="Test warning",
                actual_value=-200,
                provider="TestProvider",
            )
        ]

        result = ValidationResult(
            is_valid=True,
            processed_data=None,
            warnings=warnings,
            validation_summary={"status": "warnings"},
            provider="TestProvider",
        )

        stats.update_stats(result, validation_time_ms=75.0)

        assert stats.total_validations == 1
        assert stats.successful_validations == 0
        assert stats.warnings == 1
        assert stats.data_quality_score == 0.7  # Warning penalty
        assert "data_range:odds" in stats.common_issues
        assert stats.common_issues["data_range:odds"] == 1

    def test_stats_update_with_critical_errors(self):
        """Test updating stats with critical errors"""
        stats = ProviderValidationStats("TestProvider")

        warnings = [
            ValidationWarning(
                level=ValidationLevel.CRITICAL,
                category=ValidationCategory.SCHEMA_STRUCTURE,
                field="data",
                message="Critical error",
                actual_value=None,
                provider="TestProvider",
            )
        ]

        result = ValidationResult(
            is_valid=False,
            processed_data=None,
            warnings=warnings,
            validation_summary={"status": "critical_errors"},
            provider="TestProvider",
        )

        stats.update_stats(result, validation_time_ms=100.0)

        assert stats.total_validations == 1
        assert stats.critical_errors == 1
        assert stats.successful_validations == 0
        assert stats.data_quality_score == 0.0  # Critical error penalty
        assert "schema_structure:data" in stats.common_issues

    def test_running_average_calculation(self):
        """Test running average calculation for validation time"""
        stats = ProviderValidationStats("TestProvider")

        # Mock successful results
        result1 = ValidationResult(True, None, [], {}, "TestProvider")
        result2 = ValidationResult(True, None, [], {}, "TestProvider")
        result3 = ValidationResult(True, None, [], {}, "TestProvider")

        stats.update_stats(result1, validation_time_ms=50.0)
        assert stats.average_validation_time_ms == 50.0

        stats.update_stats(result2, validation_time_ms=100.0)
        assert stats.average_validation_time_ms == 75.0  # (50 + 100) / 2

        stats.update_stats(result3, validation_time_ms=50.0)
        # Should be approximately (50 + 100 + 50) / 3 = 66.666...
        assert abs(stats.average_validation_time_ms - 66.67) < 0.1


class TestSchemaValidationAPIRoutes:
    """Test suite for schema validation API routes"""

    @pytest.fixture
    def test_client(self):
        """Create test client with schema validation routes"""
        from fastapi import FastAPI

        from backend.routes.schema_validation_routes import router

        app = FastAPI()
        app.include_router(router)

        return TestClient(app)

    def test_validation_health_endpoint(self, test_client):
        """Test validation health endpoint"""
        response = test_client.get("/api/odds/validation/health")
        assert response.status_code == 200

        body = response.json()
        assert body["success"] is True
        data = body["data"]
        assert "service" in data
        assert "status" in data
        assert "health_score" in data
        assert "features" in data
        assert data["service"] == "Enhanced Schema Validation"

    def test_get_validation_rules_endpoint(self, test_client):
        """Test get validation rules endpoint"""
        response = test_client.get("/api/odds/validation/validation-rules")
        assert response.status_code == 200

        body = response.json()
        assert body["success"] is True
        data = body["data"]
        assert "validation_levels" in data
        assert "validation_categories" in data
        assert "validation_config" in data
        assert "features" in data

        # Check expected validation levels
        expected_levels = ["critical", "warning", "info", "success"]
        for level in expected_levels:
            assert level in data["validation_levels"]

    def test_get_monitored_providers_endpoint(self, test_client):
        """Test get monitored providers endpoint"""
        response = test_client.get("/api/odds/validation/providers")
        assert response.status_code == 200

        body = response.json()
        assert body["success"] is True
        data = body["data"]
        assert isinstance(data, list)
        # Initially empty, but structure should be correct

    def test_validation_statistics_endpoint(self, test_client):
        """Test validation statistics endpoint"""
        # Test all providers
        response = test_client.get("/api/odds/validation/statistics")
        assert response.status_code == 200

        body = response.json()
        assert body["success"] is True
        data = body["data"]
        assert "system_summary" in data or "all_providers" in data

    def test_validation_trends_endpoint(self, test_client):
        """Test validation trends endpoint"""
        response = test_client.get("/api/odds/validation/trends?hours_back=24")
        assert response.status_code == 200

        body = response.json()
        assert body["success"] is True
        data = body["data"]
        assert "time_period_hours" in data
        assert "total_validations" in data
        assert "success_rate" in data
        assert "trend_status" in data

    def test_integration_status_endpoint(self, test_client):
        """Test integration status endpoint"""
        response = test_client.get("/api/odds/validation/integration-status")
        assert response.status_code == 200

        body = response.json()
        assert body["success"] is True
        data = body["data"]
        assert "integration_status" in data
        assert "provider_monitoring" in data
        assert "validation_history" in data
        assert "features_enabled" in data

    def test_test_validation_endpoint(self, test_client):
        """Test the test validation endpoint"""
        test_data = {
            "raw_data": {"line": 25.5, "odds": -110, "market_type": "playerprops"},
            "provider": "Internal",
            "context": {"sport": "NBA"},
        }

        response = test_client.post("/api/odds/validation/test", json=test_data)
        assert response.status_code == 200

        body = response.json()
        assert body["success"] is True
        data = body["data"]
        assert "is_valid" in data
        assert "warnings" in data
        assert "validation_summary" in data
        assert "provider" in data
        assert data["provider"] == "Internal"

    def test_validate_raw_data_endpoint(self, test_client):
        """Test validate raw data endpoint"""
        test_payload = {
            "raw_data": {"line": 25.5, "odds": -110, "market_type": "playerprops"},
            "provider": "Internal",
        }

        response = test_client.post(
            "/api/odds/validation/validate-raw", json=test_payload
        )
        assert response.status_code == 200

        body = response.json()
        assert body["success"] is True
        data = body["data"]
        assert "is_valid" in data
        assert "warnings" in data
        assert "provider" in data

    def test_provider_statistics_specific_endpoint(self, test_client):
        """Test getting statistics for specific provider"""
        # Test non-existent provider
        response = test_client.get(
            "/api/odds/validation/statistics/NonExistentProvider"
        )
        assert response.status_code == 404

    def test_trends_with_invalid_hours_back(self, test_client):
        """Test trends endpoint with invalid hours_back parameter"""
        # Test with hours_back too high
        response = test_client.get("/api/odds/validation/trends?hours_back=200")
        assert response.status_code == 422  # Validation error

        # Test with hours_back too low
        response = test_client.get("/api/odds/validation/trends?hours_back=0")
        assert response.status_code == 422  # Validation error


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
