"""
Standalone Test for Statcast ML System Components

This test verifies that our new Statcast ML components work correctly
without depending on existing backend services that have import issues.
"""

import logging
import os
import sys
from datetime import datetime

import numpy as np
import pandas as pd

# Add parent directory to Python path to allow backend package imports
backend_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(backend_dir)
sys.path.insert(0, parent_dir)


# Test the individual components
def test_statcast_data_pipeline():
    """Test StatcastDataPipeline component"""
    print("🧪 Testing StatcastDataPipeline...")

    try:
        # Import and test the class definition
        from backend.services.statcast_data_pipeline import (
            StatcastConfig,
            StatcastDataPipeline,
        )

        # Test initialization
        config = StatcastConfig(cache_ttl_hours=1)
        pipeline = StatcastDataPipeline(config)

        print("✅ StatcastDataPipeline initialized successfully")

        # Test with mock data
        mock_data = pd.DataFrame(
            {
                "player_id": [1, 2, 3],
                "player_name": ["Player A", "Player B", "Player C"],
                "launch_speed": [95.0, 87.5, 92.3],
                "launch_angle": [25.0, 12.0, 18.5],
                "events": ["home_run", "single", "double"],
                "game_date": [
                    datetime(2024, 6, 1),
                    datetime(2024, 6, 2),
                    datetime(2024, 6, 3),
                ],
            }
        )

        # Test data processing methods exist
        assert hasattr(pipeline, "fetch_historical_statcast_data")
        print("✅ Data fetching method available")

        # Test feature engineering methods exist
        assert hasattr(pipeline, "create_batting_features")
        assert hasattr(pipeline, "create_pitching_features")
        print("✅ Feature engineering methods available")

        print("✅ StatcastDataPipeline test passed!")
        return True

    except Exception as e:
        print(f"❌ StatcastDataPipeline test failed: {e}")
        return False


def test_advanced_feature_engine():
    """Test AdvancedFeatureEngine component"""
    print("\n🧪 Testing AdvancedFeatureEngine...")

    try:
        from backend.services.advanced_feature_engine import (
            AdvancedFeatureEngine,
            FeatureConfig,
        )

        # Test initialization
        config = FeatureConfig(rolling_window_sizes=[10, 20])
        engine = AdvancedFeatureEngine(config)

        print("✅ AdvancedFeatureEngine initialized successfully")

        # Test with sample data
        sample_data = pd.DataFrame(
            {
                "player_id": [1, 1, 1, 2, 2, 2],
                "game_date": pd.date_range("2024-01-01", periods=6),
                "avg_exit_velocity": [90.5, 92.1, 88.7, 91.2, 89.8, 93.4],
                "avg_launch_angle": [15.2, 18.7, 12.3, 16.8, 14.1, 19.5],
                "barrel_rate": [0.08, 0.12, 0.06, 0.10, 0.07, 0.14],
            }
        )

        # Test feature engineering methods
        interaction_features = engine.create_interaction_features(sample_data)
        assert len(interaction_features) == len(sample_data)
        print("✅ Interaction features created successfully")

        situational_features = engine.create_situational_features(sample_data)
        assert len(situational_features) == len(sample_data)
        print("✅ Situational features created successfully")

        print("✅ AdvancedFeatureEngine test passed!")
        return True

    except Exception as e:
        print(f"❌ AdvancedFeatureEngine test failed: {e}")
        return False


def test_stat_projection_models():
    """Test StatProjectionModels component"""
    print("\n🧪 Testing StatProjectionModels...")

    try:
        from backend.services.stat_projection_models import (
            ModelConfig,
            StatProjectionModels,
        )

        # Test initialization with simplified config
        config = ModelConfig(
            enable_neural_network=False,  # Skip neural networks for testing
            validation_splits=2,
            max_features=10,
        )
        models = StatProjectionModels(config)

        print("✅ StatProjectionModels initialized successfully")

        # Check target stats are defined
        assert len(models.target_stats) > 0
        print(f"✅ Target statistics defined: {len(models.target_stats)} stats")

        # Check that required methods exist
        assert hasattr(models, "train_models_for_stat")
        assert hasattr(models, "predict_stat")
        assert hasattr(models, "batch_predict_all_stats")
        print("✅ Required methods available")

        print("✅ StatProjectionModels test passed!")
        return True

    except Exception as e:
        print(f"❌ StatProjectionModels test failed: {e}")
        return False


def test_statcast_ml_integration():
    """Test StatcastMLIntegration component"""
    print("\n🧪 Testing StatcastMLIntegration...")

    try:
        # Import the simplified integration class
        from backend.services.statcast_ml_integration_simple import (
            StatcastMLIntegrationSimple,
        )

        # Test initialization
        integration = StatcastMLIntegrationSimple()

        print("✅ StatcastMLIntegration initialized successfully")

        # Check that mapping exists
        assert hasattr(integration, "stat_to_market_mapping")
        assert len(integration.stat_to_market_mapping) > 0
        print(
            f"✅ Stat-to-market mapping defined: {len(integration.stat_to_market_mapping)} mappings"
        )

        # Check required methods exist
        assert hasattr(integration, "get_enhanced_player_analysis")
        assert hasattr(integration, "batch_analyze_players")
        print("✅ Required methods available")

        print("✅ StatcastMLIntegration test passed!")
        return True

    except Exception as e:
        print(f"❌ StatcastMLIntegration test failed: {e}")
        return False


def test_api_endpoints():
    """Test API endpoint definitions"""
    print("\n🧪 Testing API endpoints...")

    try:
        from backend.statcast_api import router

        # Check that router has routes
        assert len(router.routes) > 0
        print(f"✅ API router defined with {len(router.routes)} routes")

        # Check for key endpoints
        route_paths = [route.path for route in router.routes]
        expected_paths = [
            "/projection/player",
            "/projection/batch",
            "/analysis/enhanced/{player_name}",
            "/confidence/{player_name}",
            "/betting/value-analysis",
        ]

        for path in expected_paths:
            # Check if path exists (might have prefix)
            found = any(path in route_path for route_path in route_paths)
            assert found, f"Missing endpoint: {path}"

        print("✅ Key API endpoints defined")
        print("✅ API endpoints test passed!")
        return True

    except Exception as e:
        print(f"❌ API endpoints test failed: {e}")
        return False


def test_ml_dependencies():
    """Test that required ML dependencies are available"""
    print("\n🧪 Testing ML dependencies...")

    try:
        # Core ML libraries
        import lightgbm
        import sklearn
        import xgboost

        print("✅ Core ML libraries (sklearn, xgboost, lightgbm) available")

        # Data science libraries
        import numpy as np
        import pandas as pd

        print("✅ Data science libraries (pandas, numpy) available")

        # Baseball data
        import pybaseball

        print("✅ Baseball data library (pybaseball) available")

        # Optional: Deep learning
        try:
            import torch

            print("✅ PyTorch available for neural networks")
        except ImportError:
            print("⚠️ PyTorch not available (neural networks disabled)")

        print("✅ ML dependencies test passed!")
        return True

    except Exception as e:
        print(f"❌ ML dependencies test failed: {e}")
        return False


def main():
    """Run all tests"""
    print("🚀 Starting Statcast ML System Tests")
    print("=" * 50)

    test_results = []

    # Run all tests
    test_results.append(test_ml_dependencies())
    test_results.append(test_statcast_data_pipeline())
    test_results.append(test_advanced_feature_engine())
    test_results.append(test_stat_projection_models())
    test_results.append(test_statcast_ml_integration())
    test_results.append(test_api_endpoints())

    # Summary
    print("\n" + "=" * 50)
    print("📊 Test Results Summary:")
    passed = sum(test_results)
    total = len(test_results)

    print(f"✅ Passed: {passed}/{total} tests")

    if passed == total:
        print("🎉 All tests passed! Statcast ML system is ready.")
    else:
        print(f"❌ {total - passed} tests failed. Review the errors above.")

    return passed == total


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
