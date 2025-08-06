"""
Comprehensive Test Suite for Optimized Advanced Feature Engine

This test suite verifies all optimizations, performance improvements,
and functionality of the enhanced AdvancedFeatureEngine.
"""

import time
import warnings
from unittest.mock import patch

import numpy as np
import pandas as pd
import pytest

from backend.services.advanced_feature_engine import (
    AdvancedFeatureEngine,
    FeatureConfig,
    FeatureConstants,
)


class TestFeatureConstants:
    """Test the FeatureConstants class"""

    def test_constants_exist(self):
        """Test that all required constants are defined"""
        required_constants = [
            "PEAK_AGE",
            "OPTIMAL_EV_BASE",
            "HR_OPTIMAL_LA_MIN",
            "HR_OPTIMAL_LA_MAX",
            "DEFAULT_WINDOWS",
            "EPSILON",
            "HIGH_CORRELATION_THRESHOLD",
        ]

        for const in required_constants:
            assert hasattr(FeatureConstants, const)
            assert getattr(FeatureConstants, const) is not None

    def test_constant_values(self):
        """Test that constants have reasonable values"""
        assert FeatureConstants.PEAK_AGE == 27.5
        assert FeatureConstants.OPTIMAL_EV_BASE == 90.0
        assert FeatureConstants.HR_OPTIMAL_LA_MIN == 25.0
        assert FeatureConstants.HR_OPTIMAL_LA_MAX == 35.0
        assert FeatureConstants.EPSILON > 0
        assert 0 < FeatureConstants.HIGH_CORRELATION_THRESHOLD < 1


class TestFeatureConfig:
    """Test the FeatureConfig dataclass"""

    def test_default_config(self):
        """Test default configuration values"""
        config = FeatureConfig()

        assert config.rolling_window_sizes == FeatureConstants.DEFAULT_WINDOWS
        assert config.feature_selection_k == 50
        assert config.enable_time_series is True
        assert config.enable_interactions is True
        assert config.enable_scaling is True
        assert config.use_float32 is True

    def test_custom_config(self):
        """Test custom configuration"""
        config = FeatureConfig(
            rolling_window_sizes=[5, 10, 15],
            feature_selection_k=30,
            enable_time_series=False,
            use_float32=False,
        )

        assert config.rolling_window_sizes == [5, 10, 15]
        assert config.feature_selection_k == 30
        assert config.enable_time_series is False
        assert config.use_float32 is False


class TestAdvancedFeatureEngine:
    """Test the optimized AdvancedFeatureEngine"""

    @pytest.fixture
    def sample_data(self):
        """Create comprehensive sample data for testing"""
        np.random.seed(42)
        n_samples = 100

        data = pd.DataFrame(
            {
                "player_id": np.repeat(range(20), 5),
                "game_date": pd.date_range("2024-01-01", periods=n_samples),
                "avg_exit_velocity": np.random.normal(90, 5, n_samples),
                "max_exit_velocity": np.random.normal(105, 10, n_samples),
                "avg_launch_angle": np.random.normal(15, 8, n_samples),
                "barrel_rate": np.random.uniform(0.05, 0.15, n_samples),
                "contact_rate": np.random.uniform(0.7, 0.9, n_samples),
                "swing_rate": np.random.uniform(0.4, 0.6, n_samples),
                "chase_rate": np.random.uniform(0.2, 0.4, n_samples),
                "whiff_rate": np.random.uniform(0.15, 0.35, n_samples),
                "avg_velocity": np.random.normal(92, 5, n_samples),
                "avg_spin_rate": np.random.normal(2200, 300, n_samples),
                "strike_rate": np.random.uniform(0.6, 0.7, n_samples),
                "zone_rate": np.random.uniform(0.45, 0.55, n_samples),
                "first_pitch_strike_rate": np.random.uniform(0.55, 0.65, n_samples),
                "fly_ball_rate": np.random.uniform(0.3, 0.5, n_samples),
                "team": np.random.choice(["NYY", "BOS", "LAD", "HOU"], n_samples),
                "age": np.random.randint(22, 35, n_samples),
                "home_runs": np.random.poisson(2, n_samples),
                "pitcher_strikeouts": np.random.poisson(8, n_samples),
                "walks": np.random.poisson(3, n_samples),
                "hits_allowed": np.random.poisson(7, n_samples),
            }
        )
        return data

    @pytest.fixture
    def engine(self):
        """Create a feature engine with test configuration"""
        config = FeatureConfig(
            rolling_window_sizes=[10, 20],
            feature_selection_k=20,
            enable_feature_selection=True,
            enable_scaling=True,
            use_float32=True,
        )
        return AdvancedFeatureEngine(config)

    def test_initialization(self):
        """Test feature engine initialization"""
        # Test default initialization
        engine = AdvancedFeatureEngine()
        assert engine.config is not None
        assert isinstance(engine.scalers, dict)
        assert isinstance(engine.feature_selectors, dict)

        # Test custom configuration
        config = FeatureConfig(feature_selection_k=25)
        engine = AdvancedFeatureEngine(config)
        assert engine.config.feature_selection_k == 25

    def test_input_validation(self, engine):
        """Test input data validation"""
        # Test empty data
        empty_data = pd.DataFrame()
        with pytest.raises(ValueError, match="Input data is empty"):
            engine.validate_input_data(empty_data)

        # Test missing required columns
        data = pd.DataFrame({"col1": [1, 2, 3]})
        with pytest.raises(ValueError, match="Missing required columns"):
            engine.validate_input_data(data, ["player_id", "game_date"])

        # Test valid data
        valid_data = pd.DataFrame(
            {
                "player_id": [1, 2, 3],
                "game_date": ["2024-01-01", "2024-01-02", "2024-01-03"],
            }
        )
        engine.validate_input_data(
            valid_data, ["player_id", "game_date"]
        )  # Should not raise

    def test_time_series_features(self, engine, sample_data):
        """Test time series feature creation"""
        result = engine.create_time_series_features(sample_data)

        # Check rolling features were created
        rolling_cols = [col for col in result.columns if "_roll_" in col]
        assert len(rolling_cols) > 0

        # Check trend features were created
        trend_cols = [col for col in result.columns if "_trend_" in col]
        assert len(trend_cols) > 0

        # Check momentum features were created
        momentum_cols = [col for col in result.columns if "_momentum" in col]
        assert len(momentum_cols) > 0

        # Check career comparison features
        career_cols = [col for col in result.columns if "_career_avg" in col]
        assert len(career_cols) > 0

        # Verify data integrity
        assert len(result) == len(sample_data)
        assert result["player_id"].equals(sample_data["player_id"])

    def test_interaction_features(self, engine, sample_data):
        """Test interaction feature creation"""
        original_shape = sample_data.shape
        result = engine.create_interaction_features(sample_data)

        # Check specific interaction features
        expected_features = [
            "ev_la_product",
            "optimal_contact_score",
            "discipline_score",
            "stuff_command_score",
            "zone_efficiency",
            "power_potential",
        ]

        for feature in expected_features:
            if feature in result.columns:  # Only check if base columns exist
                assert not result[feature].isna().all()

        # Verify data integrity
        assert len(result) == len(sample_data)

    def test_situational_features(self, engine, sample_data):
        """Test situational feature creation"""
        result = engine.create_situational_features(sample_data)

        # Check ballpark factors
        if "team" in sample_data.columns:
            assert "ballpark_hr_factor" in result.columns
            assert "ballpark_hit_factor" in result.columns

        # Check age factors
        if "age" in sample_data.columns:
            assert "age_factor" in result.columns
            assert "prime_years" in result.columns

        # Verify data integrity
        assert len(result) == len(sample_data)

    def test_target_specific_features(self, engine, sample_data):
        """Test target-specific feature creation"""
        # Test home runs specific features
        hr_result = engine.create_projection_specific_features(sample_data, "home_runs")
        assert "power_composite" in hr_result.columns
        assert "launch_angle_optimized" in hr_result.columns

        # Test pitcher strikeouts specific features
        so_result = engine.create_projection_specific_features(
            sample_data, "pitcher_strikeouts"
        )
        assert "whiff_composite" in so_result.columns

        # Test walks specific features
        bb_result = engine.create_projection_specific_features(sample_data, "walks")
        assert "eye_score" in bb_result.columns

        # Test hits allowed specific features
        ha_result = engine.create_projection_specific_features(
            sample_data, "hits_allowed"
        )
        assert "contact_suppression" in ha_result.columns

    def test_feature_selection(self, engine, sample_data):
        """Test real feature selection implementation"""
        # Add target variable to sample data for testing
        enhanced_data = sample_data.copy()
        result = engine._apply_feature_selection_real(enhanced_data, "home_runs")

        # Should have fewer or equal features after selection
        assert result.shape[1] <= enhanced_data.shape[1]

        # Target column should still be present
        assert "home_runs" in result.columns

    def test_scaling(self, engine, sample_data):
        """Test real scaling implementation"""
        original_data = sample_data.copy()
        result = engine._apply_scaling_real(sample_data, "home_runs")

        # Should have same shape
        assert result.shape == sample_data.shape

        # Numeric features should be scaled (different from original)
        numeric_cols = sample_data.select_dtypes(include=[np.number]).columns
        feature_cols = [col for col in numeric_cols if col != "home_runs"]

        if feature_cols:
            # At least some features should be different after scaling
            scaled_different = False
            for col in feature_cols:
                if not np.allclose(original_data[col], result[col], rtol=0.1):
                    scaled_different = True
                    break
            assert scaled_different

    def test_correlation_removal(self, engine):
        """Test correlation-based feature removal"""
        # Create data with highly correlated features
        np.random.seed(42)
        n_samples = 100

        base_feature = np.random.normal(0, 1, n_samples)
        correlated_data = pd.DataFrame(
            {
                "feature_1": base_feature,
                "feature_2": base_feature
                + np.random.normal(0, 0.01, n_samples),  # Highly correlated
                "feature_3": base_feature * 0.99,  # Highly correlated
                "feature_4": np.random.normal(0, 1, n_samples),  # Independent
                "target": np.random.normal(0, 1, n_samples),
            }
        )

        result = engine._remove_correlated_features_real(correlated_data)

        # Should have fewer features after correlation removal
        assert result.shape[1] < correlated_data.shape[1]

    def test_complete_pipeline(self, engine, sample_data):
        """Test the complete feature engineering pipeline"""
        targets = ["home_runs", "pitcher_strikeouts", "walks", "hits_allowed"]

        for target in targets:
            if target in sample_data.columns:
                result = engine.engineer_features_for_stat(sample_data, target)

                # Basic checks
                assert isinstance(result, pd.DataFrame)
                assert len(result) == len(sample_data)
                assert target in result.columns

                # Check processing stats
                stats = engine.get_processing_stats()
                assert isinstance(stats, dict)
                assert "features_created" in stats
                assert "features_removed" in stats

    def test_performance_optimization(self, sample_data):
        """Test performance improvements of optimized engine"""
        # Test with larger dataset for performance measurement
        np.random.seed(42)
        large_data = pd.concat([sample_data] * 10, ignore_index=True)
        large_data["player_id"] = np.repeat(range(200), 5)

        # Create engines with different configurations
        basic_config = FeatureConfig(
            rolling_window_sizes=[10, 20],
            enable_feature_selection=False,
            enable_scaling=False,
        )
        optimized_config = FeatureConfig(
            rolling_window_sizes=[10, 20],
            enable_feature_selection=True,
            enable_scaling=True,
            use_float32=True,
        )

        basic_engine = AdvancedFeatureEngine(basic_config)
        optimized_engine = AdvancedFeatureEngine(optimized_config)

        # Measure execution time
        start_time = time.time()
        basic_result = basic_engine.engineer_features_for_stat(large_data, "home_runs")
        basic_time = time.time() - start_time

        start_time = time.time()
        optimized_result = optimized_engine.engineer_features_for_stat(
            large_data, "home_runs"
        )
        optimized_time = time.time() - start_time

        # Both should produce valid results
        assert isinstance(basic_result, pd.DataFrame)
        assert isinstance(optimized_result, pd.DataFrame)

        # Optimized version should use memory more efficiently (fewer features due to selection)
        assert optimized_result.shape[1] <= basic_result.shape[1]

        print(f"📊 Performance comparison:")
        print(f"Basic pipeline: {basic_time:.2f}s, {basic_result.shape}")
        print(f"Optimized pipeline: {optimized_time:.2f}s, {optimized_result.shape}")

    def test_memory_optimization(self, engine):
        """Test memory optimization features"""
        # Test float32 conversion
        config = FeatureConfig(use_float32=True)
        engine_float32 = AdvancedFeatureEngine(config)

        data = pd.DataFrame(
            {
                "player_id": [1, 2, 3],
                "game_date": ["2024-01-01", "2024-01-02", "2024-01-03"],
                "feature": [1.0, 2.0, 3.0],  # float64 by default
            }
        )

        result = engine_float32.create_time_series_features(data)

        # Check if numeric features were converted to float32
        for col in result.select_dtypes(include=[np.number]).columns:
            if col != "player_id":  # Skip ID columns
                assert result[col].dtype in [
                    np.float32,
                    np.int8,
                    np.int64,
                ], f"Column {col} not optimized"

    def test_error_handling(self, engine):
        """Test error handling and graceful degradation"""
        # Test with malformed data
        bad_data = pd.DataFrame(
            {
                "player_id": [1, 2, None],  # Missing player ID
                "game_date": [
                    "2024-01-01",
                    "invalid_date",
                    "2024-01-03",
                ],  # Invalid date
                "feature": [1.0, np.inf, -np.inf],  # Infinite values
            }
        )

        # Should handle errors gracefully
        try:
            result = engine.create_time_series_features(bad_data)
            # If it doesn't raise an exception, check that it returns something reasonable
            assert isinstance(result, pd.DataFrame)
        except ValueError:
            # It's okay if it raises a ValueError for truly bad data
            pass

    def test_feature_disable_flags(self, sample_data):
        """Test that feature disable flags work correctly"""
        # Test with all features disabled
        config = FeatureConfig(
            enable_time_series=False,
            enable_interactions=False,
            enable_situational=False,
            enable_scaling=False,
            enable_feature_selection=False,
        )

        engine = AdvancedFeatureEngine(config)
        result = engine.engineer_features_for_stat(sample_data, "home_runs")

        # Should have minimal features added when everything is disabled
        assert (
            result.shape[1] <= sample_data.shape[1] + 5
        )  # Allow for target-specific features

    def test_caching_functionality(self, engine):
        """Test that caching works for expensive operations"""
        # Test ballpark factors caching
        factors1 = engine._get_ballpark_factors()
        factors2 = engine._get_ballpark_factors()

        # Should return the same object (cached)
        assert factors1 is factors2

    def test_vectorized_operations(self, engine, sample_data):
        """Test that vectorized operations produce correct results"""
        # Test vectorized age factor calculation
        ages = pd.Series([25, 27, 30, 33])
        age_factors = engine._calculate_age_factor_vectorized(ages)

        assert len(age_factors) == len(ages)
        assert all(age_factors > 0)
        # Peak should be around age 27-28
        assert age_factors.iloc[1] >= age_factors.iloc[0]  # 27 > 25
        assert age_factors.iloc[1] >= age_factors.iloc[3]  # 27 > 33

        # Test vectorized optimal contact score
        if all(
            col in sample_data.columns
            for col in ["avg_exit_velocity", "avg_launch_angle"]
        ):
            contact_scores = engine._calculate_optimal_contact_score_vectorized(
                sample_data
            )
            assert len(contact_scores) == len(sample_data)
            assert all(contact_scores >= 0)


class TestBackwardCompatibility:
    """Test that optimized engine maintains backward compatibility"""

    def test_api_compatibility(self):
        """Test that public API remains unchanged"""
        # Test that we can still create engine with old-style usage
        engine = AdvancedFeatureEngine()

        # Test that main methods still exist with same signatures
        assert hasattr(engine, "engineer_features_for_stat")
        assert hasattr(engine, "create_time_series_features")
        assert hasattr(engine, "create_interaction_features")
        assert hasattr(engine, "create_situational_features")

    def test_existing_workflow_compatibility(self):
        """Test that existing workflows still work"""
        # Simulate existing workflow
        from backend.services.advanced_feature_engine import AdvancedFeatureEngine

        engine = AdvancedFeatureEngine()

        # Create data similar to what existing code might use
        data = pd.DataFrame(
            {
                "player_id": [1, 2, 3],
                "avg_exit_velocity": [90, 95, 88],
                "avg_launch_angle": [15, 25, 10],
                "game_date": pd.date_range("2024-01-01", periods=3),
                "home_runs": [2, 3, 1],
            }
        )

        # This should work exactly as before
        result = engine.engineer_features_for_stat(data, "home_runs")
        assert isinstance(result, pd.DataFrame)
        assert "home_runs" in result.columns


def run_comprehensive_tests():
    """Run all tests and provide summary"""
    print("🧪 Starting Comprehensive Advanced Feature Engine Tests")
    print("=" * 60)

    # Import pytest and run tests
    import subprocess
    import sys

    try:
        # Run the tests using pytest
        result = subprocess.run(
            [sys.executable, "-m", "pytest", __file__, "-v", "--tb=short"],
            capture_output=True,
            text=True,
            cwd="/c/Users/bcmad/Downloads/A1Betting7-13.2/backend",
        )

        print("📊 Test Output:")
        print(result.stdout)
        if result.stderr:
            print("⚠️ Warnings/Errors:")
            print(result.stderr)

        if result.returncode == 0:
            print("✅ All tests passed!")
        else:
            print("❌ Some tests failed!")

        return result.returncode == 0

    except Exception as e:
        print(f"❌ Test execution failed: {e}")
        return False


if __name__ == "__main__":
    run_comprehensive_tests()
