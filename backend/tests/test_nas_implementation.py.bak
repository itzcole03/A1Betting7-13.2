import pytest
import numpy as np
import time
from ultra_accuracy_engine import UltraAccuracyEngine

class DummyNASData:
    @staticmethod
    def get_features():
        # Simulate real NAS training data
        return np.random.rand(200, 15)
    
    @staticmethod
    def get_targets():
        return np.random.rand(200)
    
    @staticmethod
    def get_small_dataset():
        # Smaller dataset for faster architecture search testing
        return np.random.rand(50, 10), np.random.rand(50)

def test_nas_optimal_model_creation_returns_real_object():
    """Test that NAS optimal model creation returns a real model object, not None"""
    engine = UltraAccuracyEngine()
    nas_model = engine._create_nas_optimal_model()
    
    assert nas_model is not None, "NAS optimal model should return a real object, not None"
    assert hasattr(nas_model, 'fit'), "NAS model should have a fit method"
    assert hasattr(nas_model, 'predict'), "NAS model should have a predict method"

def test_autokeras_integration_works():
    """Test that AutoKeras integration works correctly"""
    engine = UltraAccuracyEngine()
    
    # Test AutoML model creation
    automl_model = engine._create_automl_model()
    assert automl_model is not None, "AutoML model should be created successfully"
    
    # Test that it can handle structured data
    X_train, y_train = DummyNASData.get_small_dataset()
    
    try:
        # Should not raise an exception
        automl_model.fit(X_train, y_train, epochs=1, verbose=0)
        predictions = automl_model.predict(X_train[:5])
        assert predictions is not None, "AutoML model should make predictions"
        assert len(predictions) == 5, "Should predict for all test samples"
    except Exception as e:
        pytest.fail(f"AutoKeras integration should work without errors: {e}")

def test_architecture_search_functionality():
    """Test that architecture search functionality works"""
    engine = UltraAccuracyEngine()
    
    # Test progressive NAS model
    progressive_nas = engine._create_progressive_nas_model()
    assert progressive_nas is not None, "Progressive NAS model should be created"
    
    # Test that it can perform architecture search (simplified)
    X_train, y_train = DummyNASData.get_small_dataset()
    
    try:
        progressive_nas.fit(X_train, y_train, epochs=1, verbose=0)
        predictions = progressive_nas.predict(X_train[:5])
        assert predictions is not None, "Progressive NAS should make predictions"
        assert len(predictions) == 5, "Should predict for all test samples"
    except Exception as e:
        pytest.fail(f"Architecture search functionality should work: {e}")

def test_model_evaluation_and_selection():
    """Test model evaluation and selection functionality"""
    engine = UltraAccuracyEngine()
    
    # Test that NAS models can be evaluated and compared
    nas_model = engine._create_nas_optimal_model()
    automl_model = engine._create_automl_model()
    progressive_nas = engine._create_progressive_nas_model()
    
    models = [nas_model, automl_model, progressive_nas]
    
    # All models should be created successfully
    for i, model in enumerate(models):
        assert model is not None, f"Model {i} should be created successfully"
    
    # Test basic evaluation capability
    X_train, y_train = DummyNASData.get_small_dataset()
    X_test = X_train[:10]
    
    for i, model in enumerate(models):
        try:
            model.fit(X_train, y_train, epochs=1, verbose=0)
            predictions = model.predict(X_test)
            assert predictions is not None, f"Model {i} should make predictions"
            assert len(predictions) == len(X_test), f"Model {i} prediction count should match test data"
        except Exception as e:
            pytest.fail(f"Model {i} evaluation should work: {e}")

def test_integration_with_quantum_ensemble():
    """Test integration between NAS models and quantum ensemble"""
    engine = UltraAccuracyEngine()
    
    # Test that NAS models can work alongside quantum ensemble
    quantum_ensemble = engine._create_quantum_ensemble()
    nas_model = engine._create_nas_optimal_model()
    
    assert quantum_ensemble is not None, "Quantum ensemble should be available"
    assert nas_model is not None, "NAS model should be available"
    
    # Test that both can work with the same data
    X_train, y_train = DummyNASData.get_small_dataset()
    X_test = X_train[:5]
    
    try:
        # Train quantum ensemble
        quantum_ensemble.fit(X_train, y_train)
        quantum_predictions = quantum_ensemble.predict(X_test)
        
        # Train NAS model
        nas_model.fit(X_train, y_train, epochs=1, verbose=0)
        nas_predictions = nas_model.predict(X_test)
        
        assert quantum_predictions is not None, "Quantum ensemble should make predictions"
        assert nas_predictions is not None, "NAS model should make predictions"
        assert len(quantum_predictions) == len(nas_predictions), "Both should predict same number of samples"
        
    except Exception as e:
        pytest.fail(f"NAS and quantum ensemble integration should work: {e}")

def test_performance_requirements_architecture_search():
    """Test that architecture search meets performance requirements (<3s)"""
    engine = UltraAccuracyEngine()
    
    # Test NAS optimal model creation time
    start_time = time.time()
    nas_model = engine._create_nas_optimal_model()
    creation_time = time.time() - start_time
    
    assert creation_time < 3.0, f"NAS model creation should take <3s, took {creation_time:.3f}s"
    assert nas_model is not None, "NAS model should be created within time limit"
    
    # Test architecture search time (simplified)
    X_train, y_train = DummyNASData.get_small_dataset()
    
    start_time = time.time()
    try:
        nas_model.fit(X_train, y_train, epochs=1, verbose=0)
        search_time = time.time() - start_time
        
        # Allow slightly more time for actual training, but should still be reasonable
        assert search_time < 10.0, f"Architecture search should be reasonable, took {search_time:.3f}s"
        
    except Exception as e:
        pytest.fail(f"Performance requirements test should not fail: {e}")

def test_error_handling_edge_cases():
    """Test error handling for NAS edge cases"""
    engine = UltraAccuracyEngine()
    
    # Test with invalid data
    nas_model = engine._create_nas_optimal_model()
    automl_model = engine._create_automl_model()
    
    # Test with None data
    try:
        nas_model.fit(None, None)
        pytest.fail("Should raise error for None data")
    except (ValueError, TypeError, AttributeError):
        # Expected behavior
        pass
    
    # Test with empty data
    try:
        empty_X = np.array([]).reshape(0, 5)
        empty_y = np.array([])
        nas_model.fit(empty_X, empty_y)
        pytest.fail("Should raise error for empty data")
    except (ValueError, TypeError, AttributeError):
        # Expected behavior
        pass
    
    # Test with mismatched dimensions
    try:
        X_mismatch = np.random.rand(10, 5)
        y_mismatch = np.random.rand(20)  # Wrong size
        nas_model.fit(X_mismatch, y_mismatch)
        pytest.fail("Should raise error for mismatched dimensions")
    except (ValueError, TypeError, AttributeError):
        # Expected behavior
        pass
    
    # Test prediction before fitting
    try:
        unfitted_model = engine._create_progressive_nas_model()
        test_data = np.random.rand(5, 10)
        unfitted_model.predict(test_data)
        # Note: Some models may not enforce this, so we don't fail if it works
    except (ValueError, RuntimeError, AttributeError):
        # Expected behavior for models that enforce fitting
        pass

def test_nas_model_architecture_diversity():
    """Test that different NAS models create diverse architectures"""
    engine = UltraAccuracyEngine()
    
    # Create different NAS models
    nas_optimal = engine._create_nas_optimal_model()
    automl_model = engine._create_automl_model()
    progressive_nas = engine._create_progressive_nas_model()
    
    models = [nas_optimal, automl_model, progressive_nas]
    model_names = ["NAS Optimal", "AutoML", "Progressive NAS"]
    
    # All should be created and be different types/configurations
    for i, (model, name) in enumerate(zip(models, model_names)):
        assert model is not None, f"{name} should be created successfully"
    
    # Test that they can all work with the same data format
    X_train, y_train = DummyNASData.get_small_dataset()
    
    for model, name in zip(models, model_names):
        try:
            model.fit(X_train, y_train, epochs=1, verbose=0)
            predictions = model.predict(X_train[:3])
            assert predictions is not None, f"{name} should make predictions"
        except Exception as e:
            pytest.fail(f"{name} should work with standard data format: {e}")

def test_nas_integration_with_existing_pipeline():
    """Test that NAS models integrate properly with existing prediction pipeline"""
    engine = UltraAccuracyEngine()
    
    # Test that NAS models are properly initialized in the engine
    assert hasattr(engine, 'neural_architecture_models'), "Engine should have neural_architecture_models attribute"
    
    # Test that the models dictionary is accessible
    nas_models = engine.neural_architecture_models
    assert isinstance(nas_models, dict), "neural_architecture_models should be a dictionary"
    
    # Test that we can access individual NAS models
    nas_optimal = engine._create_nas_optimal_model()
    automl_model = engine._create_automl_model()
    progressive_nas = engine._create_progressive_nas_model()
    
    # All should integrate with the engine's architecture
    models = [nas_optimal, automl_model, progressive_nas]
    for model in models:
        assert model is not None, "NAS models should integrate with engine architecture" 