"""
Test Suite for Statcast ML Projection System

This module provides comprehensive tests for the new Statcast-based
ML projection system including data pipeline, feature engineering,
model training, and API endpoints.
"""

import asyncio
import json
from datetime import datetime, timedelta
from unittest.mock import Mock, patch

import numpy as np
import pandas as pd
import pytest
from services.advanced_feature_engine import AdvancedFeatureEngine, FeatureConfig
from services.stat_projection_models import (
    ModelConfig,
    ProjectionResult,
    StatProjectionModels,
)

# Import our components
from services.statcast_data_pipeline import StatcastConfig, StatcastDataPipeline
from services.statcast_ml_integration import StatcastMLIntegration


class TestStatcastDataPipeline:
    """Test the Statcast data pipeline"""

    @pytest.fixture
    def pipeline(self):
        config = StatcastConfig(cache_ttl_hours=1)
        return StatcastDataPipeline(config)

    @pytest.fixture
    def mock_statcast_data(self):
        """Create mock Statcast data for testing"""
        np.random.seed(42)
        data = pd.DataFrame(
            {
                "player_id": np.random.randint(1, 101, 500),
                "player_name": [f"Player_{i%50}" for i in range(500)],
                "game_date": pd.date_range("2024-04-01", periods=500, freq="D"),
                "launch_speed": np.random.normal(90, 10, 500),
                "launch_angle": np.random.normal(15, 20, 500),
                "events": np.random.choice(
                    ["single", "double", "home_run", "out", "strikeout"], 500
                ),
                "pitch_type": np.random.choice(["FF", "SL", "CH", "CU"], 500),
                "release_speed": np.random.normal(92, 5, 500),
                "spin_rate": np.random.normal(2200, 300, 500),
                "hit_distance_sc": np.random.normal(250, 50, 500),
                "barrel": np.random.choice([0, 1], 500, p=[0.9, 0.1]),
                "type": np.random.choice(["X", "S", "B"], 500),
                "zone": np.random.randint(1, 15, 500),
                "plate_x": np.random.normal(0, 1, 500),
                "plate_z": np.random.normal(2.5, 0.5, 500),
            }
        )
        return data

    def test_data_validation(self, pipeline, mock_statcast_data):
        """Test data validation functionality"""
        # Test valid data
        result = pipeline.validate_statcast_data(mock_statcast_data)
        assert result["is_valid"] == True
        assert len(result["issues"]) == 0

        # Test invalid data
        invalid_data = mock_statcast_data.copy()
        invalid_data["launch_speed"] = -999  # Invalid exit velocity

        result = pipeline.validate_statcast_data(invalid_data)
        assert len(result["issues"]) > 0

    def test_batting_feature_engineering(self, pipeline, mock_statcast_data):
        """Test batting feature engineering"""
        features = pipeline.engineer_batting_features(mock_statcast_data)

        # Check that key features are created
        expected_features = [
            "avg_exit_velocity",
            "max_exit_velocity",
            "barrel_rate",
            "sweet_spot_rate",
            "hard_hit_rate",
        ]

        for feature in expected_features:
            assert feature in features.columns
            assert not features[feature].isna().all()

    def test_pitching_feature_engineering(self, pipeline, mock_statcast_data):
        """Test pitching feature engineering"""
        features = pipeline.engineer_pitching_features(mock_statcast_data)

        # Check that key features are created
        expected_features = [
            "avg_velocity",
            "velocity_std",
            "avg_spin_rate",
            "strike_rate",
            "whiff_rate",
        ]

        for feature in expected_features:
            assert feature in features.columns
            assert not features[feature].isna().all()

    def test_target_variable_creation(self, pipeline, mock_statcast_data):
        """Test target variable creation"""
        target_stats = [
            "home_runs",
            "hits",
            "runs",
            "rbis",
            "stolen_bases",
            "pitcher_strikeouts",
            "walks",
            "singles",
        ]

        targets = pipeline.create_target_variables(mock_statcast_data, target_stats)

        for stat in target_stats:
            assert stat in targets.columns
            assert targets[stat].dtype in ["int64", "float64"]
            assert targets[stat].min() >= 0  # Non-negative values


class TestAdvancedFeatureEngine:
    """Test the advanced feature engineering system"""

    @pytest.fixture
    def feature_engine(self):
        config = FeatureConfig(rolling_window_sizes=[10, 20])
        return AdvancedFeatureEngine(config)

    @pytest.fixture
    def sample_data(self):
        """Create sample data for feature engineering"""
        np.random.seed(42)
        data = pd.DataFrame(
            {
                "player_id": [1, 1, 1, 2, 2, 2] * 10,
                "game_date": pd.date_range("2024-01-01", periods=60),
                "avg_exit_velocity": np.random.normal(90, 5, 60),
                "avg_launch_angle": np.random.normal(15, 8, 60),
                "barrel_rate": np.random.uniform(0.05, 0.15, 60),
                "contact_rate": np.random.uniform(0.7, 0.9, 60),
                "team": ["NYY", "BOS"] * 30,
                "age": [27, 29] * 30,
            }
        )
        return data

    def test_time_series_features(self, feature_engine, sample_data):
        """Test time series feature creation"""
        enhanced_data = feature_engine.create_time_series_features(sample_data)

        # Check rolling features are created
        assert "avg_exit_velocity_roll_10" in enhanced_data.columns
        assert "avg_exit_velocity_roll_20" in enhanced_data.columns
        assert "avg_exit_velocity_std_10" in enhanced_data.columns

        # Check for trend features
        assert "avg_exit_velocity_trend_10" in enhanced_data.columns

    def test_interaction_features(self, feature_engine, sample_data):
        """Test interaction feature creation"""
        enhanced_data = feature_engine.create_interaction_features(sample_data)

        # Check key interaction features
        assert "ev_la_product" in enhanced_data.columns
        assert "optimal_contact_score" in enhanced_data.columns
        assert "discipline_score" in enhanced_data.columns

    def test_situational_features(self, feature_engine, sample_data):
        """Test situational feature creation"""
        enhanced_data = feature_engine.create_situational_features(sample_data)

        # Check situational features
        assert "ballpark_hr_factor" in enhanced_data.columns
        assert "age_factor" in enhanced_data.columns
        assert "prime_years" in enhanced_data.columns

    def test_projection_specific_features(self, feature_engine, sample_data):
        """Test target-specific feature engineering"""
        # Test home run specific features
        hr_features = feature_engine.create_projection_specific_features(
            sample_data, "home_runs"
        )
        assert "power_composite" in hr_features.columns
        assert "launch_angle_optimized" in hr_features.columns

        # Test strikeout specific features
        k_features = feature_engine.create_projection_specific_features(
            sample_data, "pitcher_strikeouts"
        )
        assert "whiff_composite" in k_features.columns


class TestStatProjectionModels:
    """Test the ML projection models"""

    @pytest.fixture
    def models(self):
        config = ModelConfig(
            enable_neural_network=False,  # Skip NN for faster testing
            validation_splits=3,
            max_features=20,
        )
        return StatProjectionModels(config)

    @pytest.fixture
    def training_data(self):
        """Create training data for model testing"""
        np.random.seed(42)
        n_samples = 200

        data = pd.DataFrame(
            {
                "player_id": np.random.randint(1, 21, n_samples),
                "player_name": [f"Player_{i%20}" for i in range(n_samples)],
                "game_date": pd.date_range("2024-01-01", periods=n_samples),
                "avg_exit_velocity": np.random.normal(90, 5, n_samples),
                "avg_launch_angle": np.random.normal(15, 8, n_samples),
                "barrel_rate": np.random.uniform(0.05, 0.15, n_samples),
                "max_exit_velocity": np.random.normal(105, 8, n_samples),
                "sweet_spot_rate": np.random.uniform(0.3, 0.5, n_samples),
                "hard_hit_rate": np.random.uniform(0.3, 0.6, n_samples),
                "home_runs": np.random.poisson(2, n_samples),  # Target variable
                "hits": np.random.poisson(3, n_samples),
                "pitcher_strikeouts": np.random.poisson(8, n_samples),
            }
        )
        return data

    @pytest.mark.asyncio
    async def test_model_training(self, models, training_data):
        """Test model training functionality"""
        # Train models for home runs
        metrics = await models.train_models_for_stat(training_data, "home_runs")

        # Check that models were trained
        assert "home_runs" in models.models
        assert len(metrics) > 0

        # Check that metrics are reasonable
        for model_name, model_metrics in metrics.items():
            assert model_metrics.r2_score >= 0  # R² should be non-negative
            assert model_metrics.mae > 0  # MAE should be positive
            assert model_metrics.train_time > 0  # Training should take some time

    @pytest.mark.asyncio
    async def test_prediction(self, models, training_data):
        """Test prediction functionality"""
        # First train models
        await models.train_models_for_stat(training_data, "home_runs")

        # Make predictions
        prediction_data = training_data.iloc[:10].copy()
        results = await models.predict_stat(
            prediction_data, "home_runs", games_to_project=81
        )

        # Check results
        assert len(results) == 10
        assert all(isinstance(r, ProjectionResult) for r in results)
        assert all(r.projected_value >= 0 for r in results)
        assert all(0 <= r.confidence_score <= 1 for r in results)
        assert all(r.games_projected == 81 for r in results)

    @pytest.mark.asyncio
    async def test_batch_prediction(self, models, training_data):
        """Test batch prediction for multiple stats"""
        # Train models for multiple stats
        stats_to_train = ["home_runs", "hits"]

        for stat in stats_to_train:
            stat_data = training_data.copy()
            await models.train_models_for_stat(stat_data, stat)

        # Batch predict
        prediction_data = training_data.iloc[:5].copy()
        all_predictions = await models.batch_predict_all_stats(prediction_data)

        # Check results
        assert len(all_predictions) == len(stats_to_train)
        for stat in stats_to_train:
            assert stat in all_predictions
            assert len(all_predictions[stat]) == 5


class TestStatcastMLIntegration:
    """Test the ML integration service"""

    @pytest.fixture
    def integration(self):
        return StatcastMLIntegration()

    @pytest.fixture
    def mock_player_data(self):
        """Mock player data for testing"""
        return pd.DataFrame(
            {
                "player_id": [1],
                "player_name": ["Test Player"],
                "avg_exit_velocity": [92.5],
                "avg_launch_angle": [18.2],
                "barrel_rate": [0.12],
                "max_exit_velocity": [108.5],
                "game_date": [datetime.now()],
            }
        )

    def test_stat_to_market_mapping(self, integration):
        """Test the mapping between stats and betting markets"""
        # Check that key mappings exist
        assert "home_runs" in integration.stat_to_market_mapping
        assert "pitcher_strikeouts" in integration.stat_to_market_mapping
        assert "hits" in integration.stat_to_market_mapping

        # Check that mappings return lists
        for stat, markets in integration.stat_to_market_mapping.items():
            assert isinstance(markets, list)
            assert len(markets) > 0

    @pytest.mark.asyncio
    async def test_enhanced_analysis_fallback(self, integration):
        """Test fallback analysis when no data is available"""
        # Test with non-existent player
        analysis = await integration.get_enhanced_player_analysis(
            "Nonexistent Player", stat_type="home_runs"
        )

        # Should return fallback analysis
        assert analysis["analysis_type"] == "fallback"
        assert "error" in analysis
        assert "fallback_projection" in analysis

    def test_data_quality_assessment(self, integration, mock_player_data):
        """Test data quality assessment"""
        # Test with good data
        quality = integration._assess_data_quality(mock_player_data)
        assert quality["quality_score"] > 0.5
        assert quality["sample_size"] == 1

        # Test with empty data
        empty_quality = integration._assess_data_quality(pd.DataFrame())
        assert empty_quality["quality_score"] == 0
        assert "No data available" in empty_quality["issues"]

    def test_betting_edge_calculation(self, integration):
        """Test betting edge calculation"""
        edge_analysis = integration._calculate_betting_edge(
            projected_value=25.5,  # Our projection
            betting_line=23.5,  # Market line
            confidence=0.8,  # Our confidence
            over_odds=-110,  # Over odds
            under_odds=-110,  # Under odds
        )

        # Should favor the over since our projection is higher
        assert edge_analysis["recommendation"] in ["over", "no_bet"]
        assert edge_analysis["projection_vs_line"] > 0
        assert edge_analysis["edge_percentage"] >= 0


class TestAPIEndpoints:
    """Test the FastAPI endpoints"""

    @pytest.fixture
    def mock_integration(self):
        """Mock the integration service for API testing"""
        integration = Mock()

        # Mock enhanced analysis response
        integration.get_enhanced_player_analysis.return_value = {
            "timestamp": datetime.now().isoformat(),
            "analysis_type": "enhanced_statcast_betting",
            "statcast_projection": {
                "value": 25.5,
                "confidence": 0.75,
                "confidence_interval": (20.0, 31.0),
                "contributing_factors": {"exit_velocity": 0.8, "launch_angle": 0.6},
                "model_consensus": {"xgboost": 25.2, "lightgbm": 25.8},
                "games_projected": 162,
            },
            "betting_analysis": {
                "recommendation": "over",
                "confidence": 0.7,
                "reasoning": "Strong underlying metrics",
                "key_factors": ["exit_velocity", "barrel_rate"],
            },
            "combined_insights": {
                "agreement_score": 0.85,
                "conflicting_signals": [],
                "supporting_factors": ["Both analyses agree"],
                "overall_recommendation": "over",
            },
            "data_quality": {"quality_score": 0.9, "sample_size": 50, "issues": []},
        }

        return integration

    def test_projection_response_model(self):
        """Test that our Pydantic models work correctly"""
        from backend.statcast_api import ProjectionResponse

        # Test valid response
        response = ProjectionResponse(
            player_name="Test Player",
            stat_type="home_runs",
            projected_value=25.5,
            confidence_score=0.75,
            confidence_interval=(20.0, 31.0),
            contributing_factors={"exit_velocity": 0.8},
            model_consensus={"xgboost": 25.2},
            games_projected=162,
            timestamp=datetime.now().isoformat(),
        )

        assert response.player_name == "Test Player"
        assert response.projected_value == 25.5
        assert response.confidence_score == 0.75


def test_system_integration():
    """Integration test for the complete system"""
    print("\n🧪 Running system integration test...")

    # Test that all components can be imported
    try:
        from services.advanced_feature_engine import AdvancedFeatureEngine
        from services.stat_projection_models import StatProjectionModels
        from services.statcast_data_pipeline import StatcastDataPipeline
        from services.statcast_ml_integration import StatcastMLIntegration

        print("✅ All components imported successfully")

        # Test basic initialization
        pipeline = StatcastDataPipeline()
        feature_engine = AdvancedFeatureEngine()
        models = StatProjectionModels()
        integration = StatcastMLIntegration()

        print("✅ All components initialized successfully")

        # Test data flow with mock data
        np.random.seed(42)
        mock_data = pd.DataFrame(
            {
                "player_id": range(10),
                "player_name": [f"Player_{i}" for i in range(10)],
                "launch_speed": np.random.normal(90, 5, 10),
                "launch_angle": np.random.normal(15, 8, 10),
                "events": ["single"] * 10,
                "game_date": pd.date_range("2024-01-01", periods=10),
            }
        )

        # Test feature engineering
        features = feature_engine.create_interaction_features(mock_data)
        assert len(features) == 10
        print("✅ Feature engineering working")

        print("🎉 System integration test passed!")

    except Exception as e:
        print(f"❌ System integration test failed: {e}")
        raise


if __name__ == "__main__":
    # Run the integration test
    test_system_integration()

    # Run pytest if available
    try:
        import pytest

        print("\n🧪 Running pytest suite...")
        pytest.main([__file__, "-v"])
    except ImportError:
        print("Pytest not available. Install with: pip install pytest pytest-asyncio")

    print("\n✅ All tests completed!")
