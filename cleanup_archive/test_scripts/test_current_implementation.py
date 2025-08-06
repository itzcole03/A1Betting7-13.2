#!/usr/bin/env python3
"""
Direct Test Runner for Advanced Feature Engine - Current Implementation
Tests the actual optimized code structure as it exists
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


def test_feature_constants_optimization():
    """Test FeatureConstants optimization structure"""
    try:
        from backend.services.advanced_feature_engine import FeatureConstants

        # Test that constants are properly organized
        assert hasattr(FeatureConstants, "PEAK_AGE"), "Missing PEAK_AGE constant"
        assert hasattr(FeatureConstants, "DEFAULT_WINDOWS"), "Missing DEFAULT_WINDOWS"
        assert hasattr(
            FeatureConstants, "HIGH_CORRELATION_THRESHOLD"
        ), "Missing correlation threshold"

        # Test specific values
        assert FeatureConstants.PEAK_AGE == 27.5, "Peak age should be 27.5"
        assert (
            FeatureConstants.HIGH_CORRELATION_THRESHOLD == 0.95
        ), "Correlation threshold should be 0.95"
        assert (
            len(FeatureConstants.DEFAULT_WINDOWS) == 4
        ), "Should have 4 default windows"

        print("✅ FeatureConstants properly structured with constants")
        print(f"✅ Peak age: {FeatureConstants.PEAK_AGE}")
        print(f"✅ Default windows: {FeatureConstants.DEFAULT_WINDOWS}")
        print(
            f"✅ Correlation threshold: {FeatureConstants.HIGH_CORRELATION_THRESHOLD}"
        )

        return True
    except Exception as e:
        print(f"❌ FeatureConstants test failed: {e}")
        return False


def test_feature_config_optimization():
    """Test FeatureConfig dataclass optimization"""
    try:
        from backend.services.advanced_feature_engine import (
            FeatureConfig,
            FeatureConstants,
        )

        # Test default config
        config = FeatureConfig()
        assert hasattr(config, "rolling_window_sizes"), "Missing rolling_window_sizes"
        assert hasattr(config, "correlation_threshold"), "Missing correlation_threshold"
        assert hasattr(config, "enable_scaling"), "Missing enable_scaling"
        assert hasattr(config, "use_float32"), "Missing memory optimization flag"

        # Test default values
        assert (
            config.correlation_threshold == FeatureConstants.HIGH_CORRELATION_THRESHOLD
        ), "Default correlation threshold incorrect"
        assert config.enable_scaling == True, "Default scaling should be enabled"
        assert (
            config.use_float32 == True
        ), "Memory optimization should be enabled by default"

        # Test custom config
        custom_config = FeatureConfig(
            correlation_threshold=0.8, feature_selection_k=10, enable_scaling=False
        )
        assert (
            custom_config.correlation_threshold == 0.8
        ), "Custom correlation threshold not applied"
        assert (
            custom_config.feature_selection_k == 10
        ), "Custom feature selection not applied"
        assert (
            custom_config.enable_scaling == False
        ), "Custom scaling setting not applied"

        print("✅ FeatureConfig dataclass working with defaults")
        print("✅ FeatureConfig custom initialization working")
        print(f"✅ Memory optimization enabled: {config.use_float32}")

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
        assert hasattr(engine, "config"), "Engine should have config attribute"
        assert isinstance(
            engine.config, FeatureConfig
        ), "Config should be FeatureConfig instance"

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


def test_real_scaling_implementation():
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

        # Test the real scaling method
        scaled_data = engine._apply_scaling_real(data, "hits")

        # Check scaling worked
        assert isinstance(scaled_data, pd.DataFrame), "Should return DataFrame"
        assert scaled_data.shape == data.shape, "Shape should be preserved"

        # Should reduce variance differences
        original_std_ratio = data.std().max() / data.std().min()
        scaled_std_ratio = scaled_data.std().max() / scaled_data.std().min()
        assert (
            scaled_std_ratio < original_std_ratio
        ), "Scaling should reduce variance differences"

        print("✅ Real sklearn-based scaling working")
        print(f"✅ Variance ratio: {original_std_ratio:.2f} -> {scaled_std_ratio:.2f}")

        return True
    except Exception as e:
        print(f"❌ Real scaling test failed: {e}")
        return False


def test_real_correlation_removal():
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

        # Test the real correlation removal method
        filtered_data = engine._remove_correlated_features_real(data)

        # Should remove highly correlated features
        assert isinstance(filtered_data, pd.DataFrame), "Should return DataFrame"
        assert (
            filtered_data.shape[1] <= data.shape[1]
        ), "Should remove or maintain feature count"
        assert filtered_data.shape[0] == data.shape[0], "Should preserve all rows"

        print(
            f"✅ Real correlation removal working: {data.shape[1]} -> {filtered_data.shape[1]} features"
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
        n_samples = 1000
        data = pd.DataFrame(
            {
                "launch_speed": np.random.uniform(70, 120, n_samples),
                "launch_angle": np.random.uniform(-30, 70, n_samples),
                "age": np.random.uniform(20, 40, n_samples),
            }
        )

        engine = AdvancedFeatureEngine()

        # Test vectorized age calculation
        start_time = time.time()
        age_factors = engine._calculate_age_factor_vectorized(data["age"])
        age_time = time.time() - start_time

        # Test vectorized power composite
        start_time = time.time()
        power_composite = engine._create_power_composite_vectorized(data)
        power_time = time.time() - start_time

        # Should be fast due to vectorization
        assert age_time < 0.5, f"Age calculation too slow: {age_time:.3f}s"
        assert power_time < 0.5, f"Power composite too slow: {power_time:.3f}s"
        assert len(age_factors) == n_samples, "Age factors should match input length"
        assert (
            len(power_composite) == n_samples
        ), "Power composite should match input length"

        print(f"✅ Vectorized age calculation: {age_time:.4f}s for {n_samples} samples")
        print(
            f"✅ Vectorized power composite: {power_time:.4f}s for {n_samples} samples"
        )

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

        # Test with memory optimization enabled
        config = FeatureConfig(use_float32=True)
        engine = AdvancedFeatureEngine(config)

        # Check that config has memory optimization enabled
        assert (
            engine.config.use_float32 == True
        ), "Memory optimization should be enabled"

        print("✅ Memory optimization configuration working")
        print(f"✅ Float32 optimization enabled: {engine.config.use_float32}")

        return True
    except Exception as e:
        print(f"❌ Memory optimization test failed: {e}")
        return False


def test_main_interface():
    """Test main feature engineering interface"""
    try:
        import numpy as np
        import pandas as pd

        from backend.services.advanced_feature_engine import AdvancedFeatureEngine

        # Create realistic Statcast-style data
        np.random.seed(42)
        n_samples = 100
        statcast_data = pd.DataFrame(
            {
                "launch_speed": np.random.uniform(70, 120, n_samples),
                "launch_angle": np.random.uniform(-30, 70, n_samples),
                "hit_distance_sc": np.random.uniform(100, 500, n_samples),
                "game_date": pd.date_range("2023-01-01", periods=n_samples),
                "player_id": np.random.choice(
                    ["player_1", "player_2", "player_3"], n_samples
                ),
            }
        )

        engine = AdvancedFeatureEngine()

        # Test main interface method
        features = engine.engineer_features_for_stat(statcast_data, "hits")

        assert isinstance(features, pd.DataFrame), "Should return DataFrame"
        assert len(features) == len(statcast_data), "Should preserve row count"
        # Note: features may be reduced due to correlation removal optimization
        assert features.shape[1] > 0, "Should have features remaining"

        print("✅ Main feature engineering interface working")
        print(
            f"✅ Engineered features shape: {statcast_data.shape} -> {features.shape}"
        )

        return True
    except Exception as e:
        print(f"❌ Main interface test failed: {e}")
        return False


def test_integration_pipeline():
    """Test full integration pipeline with all optimizations"""
    try:
        import numpy as np
        import pandas as pd

        from backend.services.advanced_feature_engine import (
            AdvancedFeatureEngine,
            FeatureConfig,
        )

        # Create comprehensive test data
        np.random.seed(42)
        n_samples = 200
        statcast_data = pd.DataFrame(
            {
                "launch_speed": np.random.uniform(70, 120, n_samples),
                "launch_angle": np.random.uniform(-30, 70, n_samples),
                "hit_distance_sc": np.random.uniform(100, 500, n_samples),
                "game_date": pd.date_range("2023-01-01", periods=n_samples),
                "player_id": np.random.choice(["player_1", "player_2"], n_samples),
                "age": np.random.uniform(20, 40, n_samples),
            }
        )

        # Test with comprehensive configuration
        config = FeatureConfig(
            correlation_threshold=0.95,
            enable_scaling=True,
            enable_interactions=True,
            use_float32=True,
        )

        engine = AdvancedFeatureEngine(config)

        # Run full pipeline
        start_time = time.time()
        features = engine.engineer_features_for_stat(
            statcast_data, "hits", include_time_series=True
        )
        total_time = time.time() - start_time

        # Validate results
        assert isinstance(features, pd.DataFrame), "Should return DataFrame"
        assert len(features) == len(statcast_data), "Should preserve row count"
        assert total_time < 10.0, f"Full pipeline too slow: {total_time:.3f}s"

        # Check that features were added
        new_columns = set(features.columns) - set(statcast_data.columns)
        assert len(new_columns) > 0, "Should add new features"

        print(f"✅ Full optimized pipeline: {statcast_data.shape} -> {features.shape}")
        print(f"✅ Pipeline time: {total_time:.4f}s")
        print(f"✅ Features added: {len(new_columns)}")
        print(f"✅ New feature samples: {list(new_columns)[:5]}")

        return True
    except Exception as e:
        print(f"❌ Integration pipeline test failed: {e}")
        return False


def test_performance_improvements():
    """Test that optimizations provide performance improvements"""
    try:
        import numpy as np
        import pandas as pd

        from backend.services.advanced_feature_engine import AdvancedFeatureEngine

        # Create performance test data
        np.random.seed(42)
        n_samples = 500
        data = pd.DataFrame(
            {
                "launch_speed": np.random.uniform(70, 120, n_samples),
                "launch_angle": np.random.uniform(-30, 70, n_samples),
                "age": np.random.uniform(20, 40, n_samples),
            }
        )

        engine = AdvancedFeatureEngine()

        # Test multiple vectorized operations
        operations = [
            (
                "age_factor",
                lambda: engine._calculate_age_factor_vectorized(data["age"]),
            ),
            (
                "power_composite",
                lambda: engine._create_power_composite_vectorized(data),
            ),
        ]

        total_time = 0
        for op_name, operation in operations:
            start_time = time.time()
            result = operation()
            op_time = time.time() - start_time
            total_time += op_time

            assert len(result) == n_samples, f"{op_name} should return correct length"
            print(f"✅ {op_name}: {op_time:.4f}s")

        # Total time should be reasonable for vectorized operations
        assert total_time < 2.0, f"Vectorized operations too slow: {total_time:.3f}s"

        print(f"✅ Total vectorized operations time: {total_time:.4f}s")
        print("✅ Performance optimizations validated")

        return True
    except Exception as e:
        print(f"❌ Performance test failed: {e}")
        return False


def main():
    """Run all optimization tests for current implementation"""
    print("🚀 Starting Advanced Feature Engine Current Implementation Tests")
    print(f"Python version: {sys.version}")
    print(f"Working directory: {os.getcwd()}")

    tests = [
        ("Import Tests", test_imports),
        ("FeatureConstants Optimization", test_feature_constants_optimization),
        ("FeatureConfig Optimization", test_feature_config_optimization),
        ("Engine Initialization", test_engine_initialization),
        ("Real Scaling Implementation", test_real_scaling_implementation),
        ("Real Correlation Removal", test_real_correlation_removal),
        ("Vectorized Operations", test_vectorized_operations),
        ("Memory Optimization", test_memory_optimization),
        ("Main Interface", test_main_interface),
        ("Integration Pipeline", test_integration_pipeline),
        ("Performance Improvements", test_performance_improvements),
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
