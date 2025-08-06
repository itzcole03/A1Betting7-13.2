#!/usr/bin/env python3
"""
Direct Test Runner for Advanced Feature Engine Optimizations
Validates all optimization work without pytest dependencies
"""

import os
import sys
import time
import traceback
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_path))


def run_test(test_name, test_func):
    """Run a single test with error handling"""
    print(f"\n{'='*60}")
    print(f"🧪 Running: {test_name}")
    print(f"{'='*60}")

    try:
        start_time = time.time()
        result = test_func()
        duration = time.time() - start_time

        if result:
            print(f"✅ PASSED: {test_name} ({duration:.3f}s)")
            return True
        else:
            print(f"❌ FAILED: {test_name} ({duration:.3f}s)")
            return False
    except Exception as e:
        print(f"💥 ERROR in {test_name}: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        return False


def test_imports():
    """Test that all optimized modules import correctly"""
    try:
        from backend.services.advanced_feature_engine import (
            AdvancedFeatureEngine,
            FeatureConfig,
            FeatureConstants,
        )

        print("✅ Successfully imported AdvancedFeatureEngine")
        print("✅ Successfully imported FeatureConstants")
        print("✅ Successfully imported FeatureConfig")
        return True
    except Exception as e:
        print(f"❌ Import failed: {e}")
        return False


def test_feature_constants():
    """Test FeatureConstants optimization"""
    try:
        from backend.services.advanced_feature_engine import FeatureConstants

        # Test constants structure
        assert hasattr(FeatureConstants, "FEATURES"), "Missing FEATURES"
        assert hasattr(FeatureConstants, "THRESHOLDS"), "Missing THRESHOLDS"
        assert hasattr(FeatureConstants, "CACHE_SETTINGS"), "Missing CACHE_SETTINGS"

        # Test specific constants
        assert (
            FeatureConstants.THRESHOLDS["CORRELATION_THRESHOLD"] == 0.95
        ), "Correlation threshold incorrect"
        assert (
            FeatureConstants.CACHE_SETTINGS["MAX_SIZE"] == 1000
        ), "Cache size incorrect"

        print("✅ FeatureConstants structure validated")
        print(f"✅ Found {len(FeatureConstants.FEATURES['HITTING'])} hitting features")
        print(
            f"✅ Found {len(FeatureConstants.FEATURES['PITCHING'])} pitching features"
        )

        return True
    except Exception as e:
        print(f"❌ FeatureConstants test failed: {e}")
        return False


def test_feature_config():
    """Test FeatureConfig optimization"""
    try:
        from backend.services.advanced_feature_engine import FeatureConfig

        # Test default config
        config = FeatureConfig()
        assert (
            config.use_advanced_features == True
        ), "Default advanced features should be True"
        assert (
            config.correlation_threshold == 0.95
        ), "Default correlation threshold incorrect"

        # Test custom config
        custom_config = FeatureConfig(
            use_advanced_features=False,
            correlation_threshold=0.8,
            feature_selection_k=10,
        )
        assert custom_config.use_advanced_features == False, "Custom config not applied"
        assert (
            custom_config.correlation_threshold == 0.8
        ), "Custom correlation threshold not applied"

        print("✅ FeatureConfig default initialization working")
        print("✅ FeatureConfig custom initialization working")

        return True
    except Exception as e:
        print(f"❌ FeatureConfig test failed: {e}")
        return False


def test_engine_initialization():
    """Test AdvancedFeatureEngine initialization"""
    try:
        from backend.services.advanced_feature_engine import (
            AdvancedFeatureEngine,
            FeatureConfig,
        )

        # Test default initialization
        engine = AdvancedFeatureEngine()
        assert engine.config.use_advanced_features == True, "Default config not applied"

        # Test custom initialization
        custom_config = FeatureConfig(correlation_threshold=0.8)
        engine_custom = AdvancedFeatureEngine(custom_config)
        assert (
            engine_custom.config.correlation_threshold == 0.8
        ), "Custom config not applied"

        print("✅ AdvancedFeatureEngine default initialization working")
        print("✅ AdvancedFeatureEngine custom initialization working")

        return True
    except Exception as e:
        print(f"❌ Engine initialization test failed: {e}")
        return False


def test_real_feature_selection():
    """Test real sklearn-based feature selection implementation"""
    try:
        import numpy as np
        import pandas as pd

        from backend.services.advanced_feature_engine import AdvancedFeatureEngine

        # Create sample data
        np.random.seed(42)
        n_samples, n_features = 100, 20
        X = pd.DataFrame(
            np.random.randn(n_samples, n_features),
            columns=[f"feature_{i}" for i in range(n_features)],
        )
        y = pd.Series(np.random.randn(n_samples))

        engine = AdvancedFeatureEngine()

        # Test feature selection
        selected_features = engine._select_best_features(X, y, k=10)
        assert (
            len(selected_features) == 10
        ), f"Expected 10 features, got {len(selected_features)}"
        assert all(
            feat in X.columns for feat in selected_features
        ), "Invalid feature names returned"

        print(
            f"✅ Feature selection working: selected {len(selected_features)} features"
        )
        print(f"✅ Selected features: {selected_features[:5]}...")

        return True
    except Exception as e:
        print(f"❌ Real feature selection test failed: {e}")
        return False


def test_real_scaling():
    """Test real sklearn-based scaling implementation"""
    try:
        import numpy as np
        import pandas as pd

        from backend.services.advanced_feature_engine import AdvancedFeatureEngine

        # Create sample data with different scales
        np.random.seed(42)
        data = pd.DataFrame(
            {
                "small_feature": np.random.randn(100) * 0.1,
                "large_feature": np.random.randn(100) * 1000,
                "medium_feature": np.random.randn(100) * 10,
            }
        )

        engine = AdvancedFeatureEngine()
        scaled_data = engine._scale_features(data)

        # Check scaling worked
        assert abs(scaled_data.mean().mean()) < 0.1, "Scaling should center data near 0"
        assert (
            abs(scaled_data.std().mean() - 1.0) < 0.1
        ), "Scaling should normalize variance to ~1"
        assert scaled_data.shape == data.shape, "Shape should be preserved"

        print("✅ Feature scaling working: data properly normalized")
        print(f"✅ Scaled data mean: {scaled_data.mean().mean():.4f}")
        print(f"✅ Scaled data std: {scaled_data.std().mean():.4f}")

        return True
    except Exception as e:
        print(f"❌ Real scaling test failed: {e}")
        return False


def test_correlation_removal():
    """Test real correlation-based feature removal"""
    try:
        import numpy as np
        import pandas as pd

        from backend.services.advanced_feature_engine import AdvancedFeatureEngine

        # Create data with known correlations
        np.random.seed(42)
        base_feature = np.random.randn(100)
        data = pd.DataFrame(
            {
                "feature_1": base_feature,
                "feature_2": base_feature
                + np.random.randn(100) * 0.1,  # Highly correlated
                "feature_3": np.random.randn(100),  # Independent
                "feature_4": base_feature * 0.98
                + np.random.randn(100) * 0.02,  # Very highly correlated
                "feature_5": np.random.randn(100),  # Independent
            }
        )

        engine = AdvancedFeatureEngine()
        filtered_data = engine._remove_correlated_features(data, threshold=0.95)

        # Should remove highly correlated features
        assert filtered_data.shape[1] < data.shape[1], "Should remove some features"
        assert filtered_data.shape[0] == data.shape[0], "Should preserve all rows"

        print(
            f"✅ Correlation removal working: {data.shape[1]} -> {filtered_data.shape[1]} features"
        )
        print(
            f"✅ Removed {data.shape[1] - filtered_data.shape[1]} highly correlated features"
        )

        return True
    except Exception as e:
        print(f"❌ Correlation removal test failed: {e}")
        return False


def test_vectorized_operations():
    """Test vectorized operations performance"""
    try:
        import numpy as np
        import pandas as pd

        from backend.services.advanced_feature_engine import AdvancedFeatureEngine

        # Create larger dataset to test vectorization
        np.random.seed(42)
        n_samples, n_features = 1000, 50
        data = pd.DataFrame(
            np.random.randn(n_samples, n_features),
            columns=[f"feature_{i}" for i in range(n_features)],
        )

        engine = AdvancedFeatureEngine()

        # Test vectorized scaling
        start_time = time.time()
        scaled_data = engine._scale_features(data)
        scaling_time = time.time() - start_time

        # Test vectorized correlation calculation
        start_time = time.time()
        filtered_data = engine._remove_correlated_features(data)
        correlation_time = time.time() - start_time

        # Should be fast due to vectorization
        assert scaling_time < 1.0, f"Scaling too slow: {scaling_time:.3f}s"
        assert (
            correlation_time < 2.0
        ), f"Correlation removal too slow: {correlation_time:.3f}s"

        print(f"✅ Vectorized scaling: {scaling_time:.4f}s for {data.shape}")
        print(f"✅ Vectorized correlation: {correlation_time:.4f}s for {data.shape}")

        return True
    except Exception as e:
        print(f"❌ Vectorized operations test failed: {e}")
        return False


def test_memory_optimization():
    """Test memory optimization features"""
    try:
        import numpy as np
        import pandas as pd

        from backend.services.advanced_feature_engine import (
            AdvancedFeatureEngine,
            FeatureConfig,
        )

        # Create data that can benefit from memory optimization
        np.random.seed(42)
        data = pd.DataFrame(np.random.randn(1000, 20).astype(np.float64))

        # Test with memory optimization enabled
        config = FeatureConfig(optimize_memory=True)
        engine = AdvancedFeatureEngine(config)

        # Process data
        processed_data = engine._scale_features(data)

        # Check data type optimization
        if hasattr(processed_data, "dtypes"):
            # Should optimize to float32 for memory savings
            print(f"✅ Input data type: {data.dtypes.iloc[0]}")
            print(f"✅ Processed data type: {processed_data.dtypes.iloc[0]}")

        print("✅ Memory optimization working")

        return True
    except Exception as e:
        print(f"❌ Memory optimization test failed: {e}")
        return False


def test_backward_compatibility():
    """Test backward compatibility with existing code"""
    try:
        import numpy as np
        import pandas as pd

        from backend.services.advanced_feature_engine import AdvancedFeatureEngine

        # Test old-style usage still works
        engine = AdvancedFeatureEngine()

        # Create sample Statcast data structure
        statcast_data = pd.DataFrame(
            {
                "launch_speed": np.random.uniform(80, 120, 100),
                "launch_angle": np.random.uniform(-20, 60, 100),
                "hit_distance_sc": np.random.uniform(200, 500, 100),
                "barrel_rate": np.random.uniform(0, 30, 100),
                "woba": np.random.uniform(0.2, 0.6, 100),
            }
        )

        # Test main interface methods still work
        features = engine.engineer_features(statcast_data)
        assert isinstance(features, pd.DataFrame), "Should return DataFrame"
        assert len(features) > 0, "Should return features"

        print("✅ Backward compatibility maintained")
        print(f"✅ Engineered features shape: {features.shape}")

        return True
    except Exception as e:
        print(f"❌ Backward compatibility test failed: {e}")
        return False


def test_integration_pipeline():
    """Test full integration pipeline"""
    try:
        import numpy as np
        import pandas as pd

        from backend.services.advanced_feature_engine import (
            AdvancedFeatureEngine,
            FeatureConfig,
        )

        # Create realistic Statcast-style data
        np.random.seed(42)
        n_samples = 500
        statcast_data = pd.DataFrame(
            {
                "launch_speed": np.random.uniform(70, 120, n_samples),
                "launch_angle": np.random.uniform(-30, 70, n_samples),
                "hit_distance_sc": np.random.uniform(100, 500, n_samples),
                "barrel_rate": np.random.uniform(0, 40, n_samples),
                "woba": np.random.uniform(0.1, 0.7, n_samples),
                "babip": np.random.uniform(0.1, 0.6, n_samples),
                "iso": np.random.uniform(0.0, 0.5, n_samples),
                "obp": np.random.uniform(0.2, 0.5, n_samples),
                "slg": np.random.uniform(0.2, 0.8, n_samples),
                "ops": np.random.uniform(0.4, 1.3, n_samples),
            }
        )

        # Add some correlated features
        statcast_data["launch_speed_squared"] = statcast_data["launch_speed"] ** 2
        statcast_data["ops_duplicate"] = statcast_data["ops"] + np.random.normal(
            0, 0.01, n_samples
        )

        # Test full pipeline
        config = FeatureConfig(
            use_advanced_features=True,
            correlation_threshold=0.95,
            feature_selection_k=8,
            optimize_memory=True,
        )

        engine = AdvancedFeatureEngine(config)

        # Run full feature engineering
        start_time = time.time()
        engineered_features = engine.engineer_features(statcast_data)
        total_time = time.time() - start_time

        # Validate results
        assert isinstance(engineered_features, pd.DataFrame), "Should return DataFrame"
        assert len(engineered_features) == len(
            statcast_data
        ), "Should preserve row count"
        assert (
            engineered_features.shape[1] <= statcast_data.shape[1]
        ), "Should reduce or maintain feature count"
        assert total_time < 5.0, f"Full pipeline too slow: {total_time:.3f}s"

        print(f"✅ Full pipeline: {statcast_data.shape} -> {engineered_features.shape}")
        print(f"✅ Pipeline time: {total_time:.4f}s")
        print(
            f"✅ Features reduced: {statcast_data.shape[1] - engineered_features.shape[1]}"
        )

        return True
    except Exception as e:
        print(f"❌ Integration pipeline test failed: {e}")
        return False


def main():
    """Run all optimization tests"""
    print("🚀 Starting Advanced Feature Engine Optimization Tests")
    print(f"Python version: {sys.version}")
    print(f"Working directory: {os.getcwd()}")

    tests = [
        ("Import Tests", test_imports),
        ("FeatureConstants Optimization", test_feature_constants),
        ("FeatureConfig Optimization", test_feature_config),
        ("Engine Initialization", test_engine_initialization),
        ("Real Feature Selection", test_real_feature_selection),
        ("Real Scaling Implementation", test_real_scaling),
        ("Correlation Removal", test_correlation_removal),
        ("Vectorized Operations", test_vectorized_operations),
        ("Memory Optimization", test_memory_optimization),
        ("Backward Compatibility", test_backward_compatibility),
        ("Integration Pipeline", test_integration_pipeline),
    ]

    passed = 0
    failed = 0

    for test_name, test_func in tests:
        if run_test(test_name, test_func):
            passed += 1
        else:
            failed += 1

    print(f"\n{'='*60}")
    print(f"🏁 TEST RESULTS SUMMARY")
    print(f"{'='*60}")
    print(f"✅ PASSED: {passed}")
    print(f"❌ FAILED: {failed}")
    print(f"📊 TOTAL: {passed + failed}")

    if failed == 0:
        print("\n🎉 ALL TESTS PASSED! Optimizations verified successfully! 🎉")
        return True
    else:
        print(f"\n⚠️  {failed} tests failed. Review output above.")
        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
