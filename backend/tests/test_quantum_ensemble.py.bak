import pytest
from backend.ultra_accuracy_engine import UltraAccuracyEngine
import numpy as np

class DummyBettingData:
    @staticmethod
    def get_features():
        # Simulate real betting feature data
        return np.random.rand(100, 10)
    @staticmethod
    def get_targets():
        return np.random.rand(100)

def test_ensemble_creation_returns_real_model():
    engine = UltraAccuracyEngine()
    model = engine._create_quantum_ensemble()
    assert model is not None, "Quantum ensemble creation should return a real model object, not None."

def test_ensemble_has_required_methods():
    engine = UltraAccuracyEngine()
    model = engine._create_quantum_ensemble()
    assert hasattr(model, 'fit'), "Quantum ensemble should have a fit() method."
    assert hasattr(model, 'predict'), "Quantum ensemble should have a predict() method."

def test_quantum_feature_transformation():
    engine = UltraAccuracyEngine()
    features = DummyBettingData.get_features()
    try:
        # Convert numpy array to dict format expected by _quantum_feature_transformation
        feature_dict = {f"feature_{i}": float(features[0][i]) for i in range(features.shape[1])}
        transformed = engine._quantum_feature_transformation(feature_dict)
        assert isinstance(transformed, dict), "Transformed features should be a dictionary."
        assert len(transformed) > 0, "Transformed features should not be empty."
    except Exception:
        pytest.fail("Quantum-inspired feature transformation should not raise an exception.")

def test_ensemble_weight_calculation():
    engine = UltraAccuracyEngine()
    model = engine._create_quantum_ensemble()
    features = DummyBettingData.get_features()
    targets = DummyBettingData.get_targets()
    try:
        model.fit(features, targets)
        if hasattr(model, 'get_weights'):
            weights = model.get_weights()
            assert weights is not None, "Ensemble weights should be calculated and not None."
    except Exception:
        pytest.fail("Ensemble weight calculation should not raise an exception.")

def test_error_handling_edge_cases():
    engine = UltraAccuracyEngine()
    model = engine._create_quantum_ensemble()
    # Pass empty data
    with pytest.raises(Exception):
        model.fit(np.array([]), np.array([]))
    with pytest.raises(Exception):
        model.predict(np.array([]))

def test_integration_with_betting_data():
    engine = UltraAccuracyEngine()
    model = engine._create_quantum_ensemble()
    features = DummyBettingData.get_features()
    targets = DummyBettingData.get_targets()
    model.fit(features, targets)
    preds = model.predict(features)
    assert preds.shape == targets.shape, "Predictions should match targets shape." 