import os
import sys
import time

import numpy as np
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from ultra_accuracy_engine import UltraAccuracyEngine


class DummyMetaLearningData:
    @staticmethod
    def get_few_shot_data():
        """Generate few-shot learning data (support and query sets)"""
        # Support set: 5 examples per class, 3 classes
        support_X = np.random.rand(15, 10)  # 5 * 3 classes
        support_y = np.repeat([0, 1, 2], 5)  # Class labels

        # Query set: 3 examples per class
        query_X = np.random.rand(9, 10)  # 3 * 3 classes
        query_y = np.repeat([0, 1, 2], 3)

        return support_X, support_y, query_X, query_y

    @staticmethod
    def get_meta_training_tasks(num_tasks=5):
        """Generate multiple tasks for meta-learning training"""
        tasks = []
        for _ in range(num_tasks):
            support_X, support_y, query_X, query_y = (
                DummyMetaLearningData.get_few_shot_data()
            )
            tasks.append(
                {"support": (support_X, support_y), "query": (query_X, query_y)}
            )
        return tasks

    @staticmethod
    def get_prototypical_data():
        """Generate data for prototypical networks (episodic format)"""
        # N-way K-shot data: 3-way 5-shot
        n_way, k_shot = 3, 5
        feature_dim = 10

        # Support examples
        support_X = np.random.rand(n_way * k_shot, feature_dim)
        support_y = np.repeat(range(n_way), k_shot)

        # Query examples
        query_X = np.random.rand(n_way * 3, feature_dim)  # 3 queries per class
        query_y = np.repeat(range(n_way), 3)

        return support_X, support_y, query_X, query_y

    @staticmethod
    def get_relation_data():
        """Generate data for relation networks"""
        # Paired data for relation learning
        X1 = np.random.rand(20, 10)  # First set of examples
        X2 = np.random.rand(20, 10)  # Second set of examples
        relations = np.random.randint(0, 2, 20)  # Binary relations

        return X1, X2, relations


def test_maml_model_creation_returns_real_object():
    """Test that MAML model creation returns a real model object, not None"""
    engine = UltraAccuracyEngine()
    maml_model = engine._create_maml_model()

    assert maml_model is not None, "MAML model should return a real object, not None"
    assert hasattr(maml_model, "fit"), "MAML model should have a fit method"
    assert hasattr(
        maml_model, "adapt"
    ), "MAML model should have an adapt method for few-shot learning"
    assert hasattr(maml_model, "predict"), "MAML model should have a predict method"


def test_prototypical_network_creation_returns_real_object():
    """Test that prototypical network creation returns a real model object, not None"""
    engine = UltraAccuracyEngine()
    proto_model = engine._create_prototypical_model()

    assert (
        proto_model is not None
    ), "Prototypical model should return a real object, not None"
    assert hasattr(proto_model, "fit"), "Prototypical model should have a fit method"
    assert hasattr(
        proto_model, "predict"
    ), "Prototypical model should have a predict method"
    assert hasattr(
        proto_model, "compute_prototypes"
    ), "Prototypical model should have compute_prototypes method"


def test_relation_network_creation_returns_real_object():
    """Test that relation network creation returns a real model object, not None"""
    engine = UltraAccuracyEngine()
    relation_model = engine._create_relation_network()

    assert (
        relation_model is not None
    ), "Relation network should return a real object, not None"
    assert hasattr(relation_model, "fit"), "Relation network should have a fit method"
    assert hasattr(
        relation_model, "predict"
    ), "Relation network should have a predict method"
    assert hasattr(
        relation_model, "compute_relations"
    ), "Relation network should have compute_relations method"


def test_learning_to_learn_model_creation():
    """Test that learning-to-learn model creation works correctly"""
    engine = UltraAccuracyEngine()
    l2l_model = engine._create_learning_to_learn_model()

    assert (
        l2l_model is not None
    ), "Learning-to-learn model should return a real object, not None"
    assert hasattr(l2l_model, "fit"), "L2L model should have a fit method"
    assert hasattr(l2l_model, "predict"), "L2L model should have a predict method"
    assert hasattr(l2l_model, "meta_learn"), "L2L model should have a meta_learn method"


def test_maml_few_shot_learning_capability():
    """Test that MAML model can perform few-shot learning"""
    engine = UltraAccuracyEngine()
    maml_model = engine._create_maml_model()

    assert maml_model is not None, "MAML model should be created for testing"

    # Get few-shot learning data
    support_X, support_y, query_X, query_y = DummyMetaLearningData.get_few_shot_data()

    try:
        # Test meta-training
        meta_tasks = DummyMetaLearningData.get_meta_training_tasks(3)
        maml_model.fit(meta_tasks, epochs=1, verbose=0)

        # Test few-shot adaptation
        start_time = time.time()
        adapted_model = maml_model.adapt(support_X, support_y, adaptation_steps=1)
        adaptation_time = time.time() - start_time

        # Test prediction after adaptation
        predictions = adapted_model.predict(query_X)

        assert predictions is not None, "MAML should make predictions after adaptation"
        assert len(predictions) == len(query_X), "Should predict for all query samples"
        assert (
            adaptation_time < 3.0
        ), f"Adaptation should be <3s, took {adaptation_time:.3f}s"

    except Exception as e:
        pytest.fail(f"MAML few-shot learning should work without errors: {e}")


def test_prototypical_network_episodic_learning():
    """Test that prototypical network can perform episodic learning"""
    engine = UltraAccuracyEngine()
    proto_model = engine._create_prototypical_model()

    assert proto_model is not None, "Prototypical model should be created for testing"

    # Get prototypical learning data
    support_X, support_y, query_X, query_y = (
        DummyMetaLearningData.get_prototypical_data()
    )

    try:
        # Test training with episodic data
        proto_model.fit(support_X, support_y, epochs=1, verbose=0)

        # Test prototype computation
        prototypes = proto_model.compute_prototypes(support_X, support_y)
        assert prototypes is not None, "Should compute prototypes"
        assert len(prototypes) == 3, "Should have 3 prototypes for 3-way classification"

        # Test prediction
        predictions = proto_model.predict(query_X)
        assert predictions is not None, "Prototypical network should make predictions"
        assert len(predictions) == len(query_X), "Should predict for all query samples"

    except Exception as e:
        pytest.fail(f"Prototypical network episodic learning should work: {e}")


def test_relation_network_relation_learning():
    """Test that relation network can learn relations between examples"""
    engine = UltraAccuracyEngine()
    relation_model = engine._create_relation_network()

    assert relation_model is not None, "Relation network should be created for testing"

    # Get relation learning data
    X1, X2, relations = DummyMetaLearningData.get_relation_data()

    try:
        # Test training with relation data
        relation_model.fit((X1, X2), relations, epochs=1, verbose=0)

        # Test relation computation
        computed_relations = relation_model.compute_relations(X1[:5], X2[:5])
        assert computed_relations is not None, "Should compute relations"
        assert len(computed_relations) == 5, "Should compute relations for all pairs"

        # Test prediction
        predictions = relation_model.predict((X1[:3], X2[:3]))
        assert predictions is not None, "Relation network should make predictions"
        assert len(predictions) == 3, "Should predict for all test pairs"

    except Exception as e:
        pytest.fail(f"Relation network relation learning should work: {e}")


def test_meta_learning_integration_with_quantum_nas():
    """Test integration between meta-learning models and quantum + NAS pipeline"""
    engine = UltraAccuracyEngine()

    # Test that all components can be created together
    quantum_ensemble = engine._create_quantum_ensemble()
    nas_model = engine._create_nas_optimal_model()
    maml_model = engine._create_maml_model()
    proto_model = engine._create_prototypical_model()

    assert quantum_ensemble is not None, "Quantum ensemble should be available"
    assert nas_model is not None, "NAS model should be available"
    assert maml_model is not None, "MAML model should be available"
    assert proto_model is not None, "Prototypical model should be available"

    # Test that they can work with compatible data
    X_train, y_train = np.random.rand(100, 10), np.random.rand(100)
    X_test = np.random.rand(20, 10)

    try:
        # Train quantum ensemble
        quantum_ensemble.fit(X_train, y_train)
        quantum_predictions = quantum_ensemble.predict(X_test)

        # Train NAS model
        nas_model.fit(X_train, y_train, epochs=1, verbose=0)
        nas_predictions = nas_model.predict(X_test, verbose=0)

        # Train meta-learning models with few-shot data
        support_X, support_y, query_X, query_y = (
            DummyMetaLearningData.get_few_shot_data()
        )

        # Test MAML adaptation
        meta_tasks = DummyMetaLearningData.get_meta_training_tasks(2)
        maml_model.fit(meta_tasks, epochs=1, verbose=0)
        adapted_maml = maml_model.adapt(support_X, support_y, adaptation_steps=1)
        maml_predictions = adapted_maml.predict(query_X)

        # Test prototypical network
        proto_model.fit(support_X, support_y, epochs=1, verbose=0)
        proto_predictions = proto_model.predict(query_X)

        # Verify all predictions work
        assert quantum_predictions is not None, "Quantum should make predictions"
        assert nas_predictions is not None, "NAS should make predictions"
        assert maml_predictions is not None, "MAML should make predictions"
        assert proto_predictions is not None, "Prototypical should make predictions"

    except Exception as e:
        pytest.fail(f"Meta-learning integration with Quantum + NAS should work: {e}")


def test_meta_learning_performance_requirements():
    """Test that meta-learning models meet performance requirements (<3s adaptation)"""
    engine = UltraAccuracyEngine()

    # Test MAML adaptation time
    maml_model = engine._create_maml_model()
    assert (
        maml_model is not None
    ), "MAML model should be created for performance testing"

    # Prepare meta-learning data
    meta_tasks = DummyMetaLearningData.get_meta_training_tasks(2)
    support_X, support_y, query_X, query_y = DummyMetaLearningData.get_few_shot_data()

    try:
        # Meta-train the model
        maml_model.fit(meta_tasks, epochs=1, verbose=0)

        # Test adaptation time
        start_time = time.time()
        adapted_model = maml_model.adapt(support_X, support_y, adaptation_steps=1)
        adaptation_time = time.time() - start_time

        assert (
            adaptation_time < 3.0
        ), f"MAML adaptation should be <3s, took {adaptation_time:.3f}s"

        # Test prediction time
        start_time = time.time()
        predictions = adapted_model.predict(query_X)
        prediction_time = time.time() - start_time

        assert (
            prediction_time < 2.0
        ), f"Meta-learning prediction should be <2s, took {prediction_time:.3f}s"

        print(
            f"✅ MAML Performance: Adaptation={adaptation_time:.3f}s, Prediction={prediction_time:.3f}s"
        )

    except Exception as e:
        pytest.fail(f"Meta-learning performance requirements should be met: {e}")


def test_meta_learning_error_handling():
    """Test error handling for meta-learning edge cases"""
    engine = UltraAccuracyEngine()

    maml_model = engine._create_maml_model()
    proto_model = engine._create_prototypical_model()

    # Test with None data
    try:
        maml_model.fit(None, epochs=1, verbose=0)
        pytest.fail("Should raise error for None data")
    except (ValueError, TypeError, AttributeError):
        # Expected behavior
        pass

    # Test with empty tasks
    try:
        empty_tasks = []
        maml_model.fit(empty_tasks, epochs=1, verbose=0)
        pytest.fail("Should raise error for empty tasks")
    except (ValueError, TypeError, AttributeError):
        # Expected behavior
        pass

    # Test with invalid adaptation data
    try:
        invalid_X = np.array([]).reshape(0, 10)
        invalid_y = np.array([])
        maml_model.adapt(invalid_X, invalid_y, adaptation_steps=1)
        pytest.fail("Should raise error for invalid adaptation data")
    except (ValueError, TypeError, AttributeError):
        # Expected behavior
        pass

    # Test prototypical network with mismatched data
    try:
        X_mismatch = np.random.rand(10, 5)
        y_mismatch = np.random.rand(20)  # Wrong size
        proto_model.fit(X_mismatch, y_mismatch, epochs=1, verbose=0)
        pytest.fail("Should raise error for mismatched dimensions")
    except (ValueError, TypeError, AttributeError):
        # Expected behavior
        pass


def test_meta_learning_framework_integration():
    """Test that meta-learning models integrate with the MetaLearningFramework"""
    engine = UltraAccuracyEngine()

    # Test that engine has proper meta-learning integration
    assert hasattr(engine, "meta_models"), "Engine should have meta_models attribute"

    meta_models = engine.meta_models
    assert isinstance(meta_models, dict), "meta_models should be a dictionary"

    # Test individual model access
    maml_model = engine._create_maml_model()
    proto_model = engine._create_prototypical_model()
    relation_model = engine._create_relation_network()
    l2l_model = engine._create_learning_to_learn_model()

    models = [maml_model, proto_model, relation_model, l2l_model]
    model_names = ["MAML", "Prototypical", "Relation", "Learning-to-Learn"]

    for model, name in zip(models, model_names):
        assert (
            model is not None
        ), f"{name} model should integrate with engine architecture"


def test_meta_learning_continual_learning():
    """Test continual learning capabilities of meta-learning models"""
    engine = UltraAccuracyEngine()
    maml_model = engine._create_maml_model()

    assert (
        maml_model is not None
    ), "MAML model should be created for continual learning test"

    try:
        # First task
        task1_data = DummyMetaLearningData.get_meta_training_tasks(2)
        maml_model.fit(task1_data, epochs=1, verbose=0)

        # Adapt to first few-shot scenario
        support_X1, support_y1, query_X1, query_y1 = (
            DummyMetaLearningData.get_few_shot_data()
        )
        adapted1 = maml_model.adapt(support_X1, support_y1, adaptation_steps=1)
        pred1 = adapted1.predict(query_X1)

        # Second task (continual learning)
        task2_data = DummyMetaLearningData.get_meta_training_tasks(2)
        maml_model.fit(
            task2_data, epochs=1, verbose=0
        )  # Should not forget previous learning

        # Adapt to second few-shot scenario
        support_X2, support_y2, query_X2, query_y2 = (
            DummyMetaLearningData.get_few_shot_data()
        )
        adapted2 = maml_model.adapt(support_X2, support_y2, adaptation_steps=1)
        pred2 = adapted2.predict(query_X2)

        assert pred1 is not None, "First task predictions should work"
        assert pred2 is not None, "Second task predictions should work"
        assert len(pred1) == len(query_X1), "First task should predict all samples"
        assert len(pred2) == len(query_X2), "Second task should predict all samples"

    except Exception as e:
        pytest.fail(f"Continual learning should work without errors: {e}")


def test_meta_learning_model_diversity():
    """Test that different meta-learning models create diverse approaches"""
    engine = UltraAccuracyEngine()

    # Create all meta-learning models
    meta_models = {
        "maml": engine._create_maml_model(),
        "prototypical": engine._create_prototypical_model(),
        "relation": engine._create_relation_network(),
        "l2l": engine._create_learning_to_learn_model(),
    }

    # Verify all models created
    for name, model in meta_models.items():
        assert model is not None, f"{name} should be created successfully"

    # Test that they have different capabilities
    maml_model = meta_models["maml"]
    proto_model = meta_models["prototypical"]

    # MAML should have adaptation capability
    assert hasattr(maml_model, "adapt"), "MAML should have adapt method"

    # Prototypical should have prototype computation
    assert hasattr(
        proto_model, "compute_prototypes"
    ), "Prototypical should have compute_prototypes method"

    # Test with same data to verify different approaches
    support_X, support_y, query_X, query_y = DummyMetaLearningData.get_few_shot_data()

    try:
        # Test MAML approach
        meta_tasks = DummyMetaLearningData.get_meta_training_tasks(2)
        maml_model.fit(meta_tasks, epochs=1, verbose=0)
        adapted_maml = maml_model.adapt(support_X, support_y, adaptation_steps=1)
        maml_predictions = adapted_maml.predict(query_X)

        # Test Prototypical approach
        proto_model.fit(support_X, support_y, epochs=1, verbose=0)
        proto_predictions = proto_model.predict(query_X)

        assert maml_predictions is not None, "MAML should make predictions"
        assert proto_predictions is not None, "Prototypical should make predictions"

        # Models should produce different results (diversity)
        if len(maml_predictions) == len(proto_predictions):
            correlation = np.corrcoef(
                maml_predictions.flatten(), proto_predictions.flatten()
            )[0, 1]
            diversity_score = 1 - abs(correlation)
            assert (
                diversity_score > 0.1
            ), f"Meta-learning models should be diverse (diversity: {diversity_score:.3f})"

    except Exception as e:
        pytest.fail(f"Meta-learning model diversity test should work: {e}")
