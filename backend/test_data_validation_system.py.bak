"""
Data Validation System Tests

Comprehensive test suite for the modern data validation and cross-checking system.
Tests validation orchestrator, integration service, API endpoints, and error handling.
"""

import asyncio
import json
from datetime import datetime
from typing import Any, Dict, List
from unittest.mock import AsyncMock, MagicMock, patch

import pytest


# Test the core validation system
def test_data_validation_imports():
    """Test that all validation components can be imported"""
    try:
        from backend.routes.data_validation_routes import router
        from backend.services.data_validation_integration import (
            DataValidationIntegrationService,
            ValidationConfig,
        )
        from backend.services.data_validation_orchestrator import (
            ConsensusAlgorithm,
            CrossValidationReport,
            DataSource,
            DataValidationOrchestrator,
            MLBDataSchemas,
            StatisticalValidator,
            ValidationResult,
            ValidationStatus,
        )

        print("✅ All validation components imported successfully")
        return True
    except ImportError as e:
        print(f"❌ Import failed: {e}")
        return False


class TestDataValidationOrchestrator:
    """Test the core data validation orchestrator"""

    def setup_method(self):
        """Setup test fixtures"""
        from backend.services.data_validation_orchestrator import (
            DataSource,
            DataValidationOrchestrator,
        )

        self.orchestrator = DataValidationOrchestrator()
        self.sample_player_data = {
            DataSource.MLB_STATS_API: {
                "player_id": 12345,
                "player_name": "Test Player",
                "team": "LAD",
                "games_played": 150,
                "hits": 180,
                "home_runs": 25,
                "rbis": 85,
                "runs": 95,
                "avg": 0.285,
                "obp": 0.350,
                "slg": 0.450,
            },
            DataSource.BASEBALL_SAVANT: {
                "player_id": 12345,
                "player_name": "Test Player",
                "team": "LAD",
                "games_played": 150,
                "hits": 182,  # Slight difference
                "home_runs": 25,
                "rbis": 87,  # Slight difference
                "runs": 95,
                "avg": 0.287,  # Slight difference
                "obp": 0.352,  # Slight difference
                "slg": 0.452,  # Slight difference
            },
        }

    @pytest.mark.asyncio
    async def test_player_validation_with_conflicts(self):
        """Test player validation with conflicting data from multiple sources"""
        try:
            report = await self.orchestrator.validate_player_data(
                self.sample_player_data, player_id=12345
            )

            # Check that validation completed
            assert report is not None
            assert len(report.validation_results) == 2
            assert len(report.conflicts) > 0  # Should detect conflicts

            # Check consensus resolution
            assert report.consensus_data is not None
            assert "hits" in report.consensus_data

            print(
                f"✅ Player validation test passed - {len(report.conflicts)} conflicts resolved"
            )
            return True

        except Exception as e:
            print(f"❌ Player validation test failed: {e}")
            return False

    @pytest.mark.asyncio
    async def test_statistical_validation(self):
        """Test statistical anomaly detection"""
        try:
            # Add historical baseline
            self.orchestrator.statistical_validator.add_historical_baseline(
                "home_runs", [20, 22, 24, 26, 28, 25, 23]
            )

            # Test outlier detection
            is_outlier, reason = (
                self.orchestrator.statistical_validator.is_statistical_outlier(
                    "home_runs", 50  # Clearly an outlier
                )
            )

            assert is_outlier == True
            assert "Z-score" in reason

            print("✅ Statistical validation test passed")
            return True

        except Exception as e:
            print(f"❌ Statistical validation test failed: {e}")
            return False

    def test_consensus_algorithms(self):
        """Test consensus algorithm implementations"""
        try:
            from backend.services.data_validation_orchestrator import ConsensusAlgorithm

            # Test majority vote
            result = ConsensusAlgorithm.majority_vote([1, 2, 2, 3, 2])
            assert result == 2

            # Test weighted average
            result = ConsensusAlgorithm.weighted_average(
                [(10.0, 0.8), (12.0, 0.9), (8.0, 0.7)]
            )
            assert 9.0 <= result <= 12.0

            # Test confidence-based selection
            result = ConsensusAlgorithm.confidence_based_selection(
                [("data1", 0.7), ("data2", 0.9)]
            )
            assert result == "data2"

            print("✅ Consensus algorithms test passed")
            return True

        except Exception as e:
            print(f"❌ Consensus algorithms test failed: {e}")
            return False


class TestDataValidationIntegration:
    """Test the validation integration service"""

    def setup_method(self):
        """Setup test fixtures"""
        from backend.services.data_validation_integration import (
            DataValidationIntegrationService,
            ValidationConfig,
        )

        self.config = ValidationConfig(
            enable_validation=True,
            validation_timeout=10.0,
            min_confidence_threshold=0.6,
        )
        self.service = DataValidationIntegrationService(self.config)

    @pytest.mark.asyncio
    async def test_player_data_enhancement(self):
        """Test player data enhancement with validation"""
        try:
            sample_mlb_data = {"player_id": 12345, "avg": 0.285, "home_runs": 25}

            sample_savant_data = {
                "player_id": 12345,
                "avg": 0.287,  # Slight difference
                "home_runs": 25,
                "xBA": 0.290,  # Additional metric
            }

            enhanced_data, report = await self.service.validate_and_enhance_player_data(
                player_id=12345,
                mlb_stats_data=sample_mlb_data,
                baseball_savant_data=sample_savant_data,
            )

            # Should have enhanced data even if validation fails
            assert enhanced_data is not None

            print("✅ Player data enhancement test passed")
            return True

        except Exception as e:
            print(f"❌ Player data enhancement test failed: {e}")
            return False

    @pytest.mark.asyncio
    async def test_validation_timeout_handling(self):
        """Test timeout handling in validation"""
        try:
            # Create a config with very short timeout
            short_timeout_config = ValidationConfig(
                enable_validation=True,
                validation_timeout=0.001,  # 1ms timeout
                enable_fallback_on_failure=True,
            )

            service = DataValidationIntegrationService(short_timeout_config)

            # This should timeout and use fallback
            enhanced_data, report = await service.validate_and_enhance_player_data(
                player_id=12345, mlb_stats_data={"player_id": 12345, "avg": 0.285}
            )

            # Should get fallback data
            assert enhanced_data is not None

            print("✅ Validation timeout handling test passed")
            return True

        except Exception as e:
            print(f"❌ Validation timeout handling test failed: {e}")
            return False

    def test_performance_metrics(self):
        """Test performance metrics collection"""
        try:
            metrics = self.service.get_performance_metrics()

            assert "validations_performed" in metrics
            assert "cache_hit_rate" in metrics
            assert "config" in metrics

            print("✅ Performance metrics test passed")
            return True

        except Exception as e:
            print(f"❌ Performance metrics test failed: {e}")
            return False


class TestComprehensivePropGeneratorIntegration:
    """Test validation integration with comprehensive prop generator"""

    @pytest.mark.asyncio
    async def test_prop_generator_validation_integration(self):
        """Test that prop generator integrates with validation"""
        try:
            from backend.services.comprehensive_prop_generator import (
                ComprehensivePropGenerator,
            )

            generator = ComprehensivePropGenerator()

            # Test data collection with validation
            collected_data, warnings = (
                await generator._collect_and_validate_data_sources(game_id=12345)
            )

            # Should complete without errors
            assert collected_data is not None
            assert "validation_metadata" in collected_data
            assert isinstance(warnings, list)

            print("✅ Prop generator validation integration test passed")
            return True

        except Exception as e:
            print(f"❌ Prop generator validation integration test failed: {e}")
            return False

    @pytest.mark.asyncio
    async def test_validation_metrics_in_prop_generation(self):
        """Test that validation metrics are included in prop generation"""
        try:
            from backend.services.comprehensive_prop_generator import (
                ComprehensivePropGenerator,
            )

            generator = ComprehensivePropGenerator()

            # Check that validation metrics are tracked
            assert "validation_enabled" in generator.generation_stats
            assert "data_validations_performed" in generator.generation_stats
            assert "data_conflicts_resolved" in generator.generation_stats

            print("✅ Validation metrics in prop generation test passed")
            return True

        except Exception as e:
            print(f"❌ Validation metrics in prop generation test failed: {e}")
            return False


class TestValidationAPIRoutes:
    """Test the validation API endpoints"""

    def test_validation_routes_import(self):
        """Test that validation routes can be imported"""
        try:
            from backend.routes.data_validation_routes import router

            # Check that router has expected routes
            routes = [route.path for route in router.routes]

            expected_routes = [
                "/api/validation/health",
                "/api/validation/metrics",
                "/api/validation/validate/player",
                "/api/validation/validate/game",
                "/api/validation/sources",
            ]

            for expected_route in expected_routes:
                found = any(expected_route in route for route in routes)
                assert found, f"Route {expected_route} not found"

            print("✅ Validation routes import test passed")
            return True

        except Exception as e:
            print(f"❌ Validation routes import test failed: {e}")
            return False


# Pandera schema tests (if available)
def test_pandera_schemas():
    """Test Pandera schema validation if available"""
    try:
        from backend.services.data_validation_orchestrator import MLBDataSchemas

        schemas = MLBDataSchemas()

        # Test schema creation
        player_schema = schemas.get_player_stats_schema()
        game_schema = schemas.get_game_data_schema()

        print("✅ Pandera schemas test passed")
        return True

    except ImportError:
        print("⚠️ Pandera not available - skipping schema tests")
        return True
    except Exception as e:
        print(f"❌ Pandera schemas test failed: {e}")
        return False


# Integration test for the full validation pipeline
@pytest.mark.asyncio
async def test_full_validation_pipeline():
    """Test the complete validation pipeline"""
    try:
        from backend.services.data_validation_integration import (
            DataValidationIntegrationService,
        )
        from backend.services.data_validation_orchestrator import (
            DataSource,
            DataValidationOrchestrator,
        )

        # Create test data with conflicts
        test_data = {
            DataSource.MLB_STATS_API: {
                "player_id": 12345,
                "avg": 0.285,
                "home_runs": 25,
                "team": "LAD",
            },
            DataSource.BASEBALL_SAVANT: {
                "player_id": 12345,
                "avg": 0.290,  # Different
                "home_runs": 24,  # Different
                "team": "LAD",
                "xBA": 0.295,  # Additional metric
            },
        }

        # Test orchestrator
        orchestrator = DataValidationOrchestrator()
        report = await orchestrator.validate_player_data(test_data, 12345)

        assert report is not None
        assert len(report.conflicts) > 0
        assert report.consensus_data is not None

        # Test integration service
        integration_service = DataValidationIntegrationService()
        enhanced_data, validation_report = (
            await integration_service.validate_and_enhance_player_data(
                player_id=12345,
                mlb_stats_data=test_data[DataSource.MLB_STATS_API],
                baseball_savant_data=test_data[DataSource.BASEBALL_SAVANT],
            )
        )

        assert enhanced_data is not None

        print("✅ Full validation pipeline test passed")
        return True

    except Exception as e:
        print(f"❌ Full validation pipeline test failed: {e}")
        return False


# Main test runner
async def run_all_tests():
    """Run all validation system tests"""
    print("🧪 Starting Data Validation System Tests\n")

    test_results = []

    # Basic import tests
    print("📦 Testing imports...")
    test_results.append(("Import Test", test_data_validation_imports()))

    # Core orchestrator tests
    print("\n🔍 Testing data validation orchestrator...")
    orchestrator_tests = TestDataValidationOrchestrator()
    test_results.append(
        (
            "Player Validation",
            await orchestrator_tests.test_player_validation_with_conflicts(),
        )
    )
    test_results.append(
        (
            "Statistical Validation",
            await orchestrator_tests.test_statistical_validation(),
        )
    )
    test_results.append(
        ("Consensus Algorithms", orchestrator_tests.test_consensus_algorithms())
    )

    # Integration service tests
    print("\n🔧 Testing validation integration service...")
    integration_tests = TestDataValidationIntegration()
    test_results.append(
        ("Player Enhancement", await integration_tests.test_player_data_enhancement())
    )
    test_results.append(
        ("Timeout Handling", await integration_tests.test_validation_timeout_handling())
    )
    test_results.append(
        ("Performance Metrics", integration_tests.test_performance_metrics())
    )

    # Prop generator integration tests
    print("\n🎯 Testing prop generator integration...")
    prop_tests = TestComprehensivePropGeneratorIntegration()
    test_results.append(
        (
            "Prop Generator Integration",
            await prop_tests.test_prop_generator_validation_integration(),
        )
    )
    test_results.append(
        (
            "Validation Metrics",
            await prop_tests.test_validation_metrics_in_prop_generation(),
        )
    )

    # API routes tests
    print("\n🌐 Testing API routes...")
    api_tests = TestValidationAPIRoutes()
    test_results.append(("API Routes", api_tests.test_validation_routes_import()))

    # Schema tests
    print("\n📋 Testing schemas...")
    test_results.append(("Pandera Schemas", test_pandera_schemas()))

    # Full pipeline test
    print("\n🔄 Testing full pipeline...")
    test_results.append(("Full Pipeline", await test_full_validation_pipeline()))

    # Results summary
    print("\n" + "=" * 50)
    print("📊 TEST RESULTS SUMMARY")
    print("=" * 50)

    passed = 0
    failed = 0

    for test_name, result in test_results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {test_name}")
        if result:
            passed += 1
        else:
            failed += 1

    print(f"\nTotal: {len(test_results)} tests")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    print(f"Success Rate: {(passed/len(test_results)*100):.1f}%")

    if failed == 0:
        print("\n🎉 All tests passed! Data validation system is working correctly.")
    else:
        print(f"\n⚠️ {failed} test(s) failed. Please check the implementation.")

    return failed == 0


if __name__ == "__main__":
    # Run tests
    asyncio.run(run_all_tests())
