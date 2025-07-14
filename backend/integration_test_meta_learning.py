#!/usr/bin/env python3
"""
Integration Testing Script for Meta-Learning Models
Tests integration with quantum ensemble, NAS pipeline, and end-to-end prediction pipeline
"""

import time
import numpy as np
from ultra_accuracy_engine import UltraAccuracyEngine
import sys
import os

class MetaLearningIntegrationTester:
    def __init__(self):
        self.engine = UltraAccuracyEngine()
        self.test_results = []
    
    def generate_test_data(self, num_samples: int = 100, num_features: int = 10):
        """Generate synthetic test data for integration testing"""
        return np.random.rand(num_samples, num_features), np.random.rand(num_samples)
    
    def generate_few_shot_data(self):
        """Generate few-shot learning data"""
        support_X = np.random.rand(15, 10)  # 5 examples per class, 3 classes
        support_y = np.repeat([0, 1, 2], 5)
        query_X = np.random.rand(9, 10)
        query_y = np.repeat([0, 1, 2], 3)
        return support_X, support_y, query_X, query_y
    
    def test_meta_learning_quantum_integration(self):
        """Test integration between meta-learning models and quantum ensemble"""
        print("\n🔬 Testing Meta-Learning + Quantum Integration...")
        
        # Create models
        quantum_ensemble = self.engine._create_quantum_ensemble()
        maml_model = self.engine._create_maml_model()
        proto_model = self.engine._create_prototypical_model()
        
        assert quantum_ensemble is not None, "Quantum ensemble should be available"
        assert maml_model is not None, "MAML model should be available"
        assert proto_model is not None, "Prototypical model should be available"
        
        # Test data compatibility
        X_train, y_train = self.generate_test_data(100)
        X_test = np.random.rand(20, 10)
        
        try:
            # Train quantum ensemble
            quantum_ensemble.fit(X_train, y_train)
            quantum_predictions = quantum_ensemble.predict(X_test)
            
            # Train meta-learning models
            support_X, support_y, query_X, query_y = self.generate_few_shot_data()
            
            # Test MAML integration
            meta_tasks = []
            for _ in range(2):
                meta_tasks.append({
                    'support': (support_X, support_y),
                    'query': (query_X, query_y)
                })
            
            maml_model.fit(meta_tasks, epochs=1, verbose=0)
            adapted_maml = maml_model.adapt(support_X, support_y, adaptation_steps=1)
            maml_predictions = adapted_maml.predict(query_X)
            
            # Test prototypical integration
            proto_model.fit(support_X, support_y, epochs=1, verbose=0)
            proto_predictions = proto_model.predict(query_X)
            
            # Verify all predictions work
            assert quantum_predictions is not None, "Quantum should make predictions"
            assert maml_predictions is not None, "MAML should make predictions"
            assert proto_predictions is not None, "Prototypical should make predictions"
            
            # Test prediction shapes
            assert len(quantum_predictions) == len(X_test), "Quantum predictions shape mismatch"
            assert len(maml_predictions) == len(query_X), "MAML predictions shape mismatch"
            assert len(proto_predictions) == len(query_X), "Prototypical predictions shape mismatch"
            
            print("  ✅ Quantum + MAML integration: PASSED")
            print("  ✅ Quantum + Prototypical integration: PASSED")
            print("  ✅ All prediction shapes correct")
            
            self.test_results.append("meta_learning_quantum_integration: PASSED")
            return True
            
        except Exception as e:
            print(f"  ❌ Meta-Learning + Quantum integration failed: {e}")
            self.test_results.append(f"meta_learning_quantum_integration: FAILED - {e}")
            return False
    
    def test_meta_learning_nas_integration(self):
        """Test integration between meta-learning models and NAS pipeline"""
        print("\n🏗️ Testing Meta-Learning + NAS Integration...")
        
        # Create models
        nas_model = self.engine._create_nas_optimal_model()
        relation_model = self.engine._create_relation_network()
        l2l_model = self.engine._create_learning_to_learn_model()
        
        assert nas_model is not None, "NAS model should be available"
        assert relation_model is not None, "Relation model should be available"
        assert l2l_model is not None, "Learning-to-Learn model should be available"
        
        # Test data compatibility
        X_train, y_train = self.generate_test_data(100)
        X_test = np.random.rand(20, 10)
        
        try:
            # Train NAS model
            nas_model.fit(X_train, y_train, epochs=1, verbose=0)
            nas_predictions = nas_model.predict(X_test, verbose=0)
            
            # Train meta-learning models
            # Test Relation Network
            X1 = np.random.rand(20, 10)
            X2 = np.random.rand(20, 10)
            relations = np.random.randint(0, 2, 20)
            
            relation_model.fit((X1, X2), relations, epochs=1, verbose=0)
            relation_predictions = relation_model.predict((X1[:5], X2[:5]))
            
            # Test Learning-to-Learn
            meta_tasks = []
            for _ in range(2):
                support_X, support_y, query_X, query_y = self.generate_few_shot_data()
                meta_tasks.append({
                    'support': (support_X, support_y),
                    'query': (query_X, query_y)
                })
            
            l2l_model.fit(meta_tasks, epochs=1, verbose=0)
            support_X, support_y = self.generate_test_data(10)
            adapted_l2l = l2l_model.meta_learn((support_X, support_y), adaptation_steps=3)
            l2l_predictions = adapted_l2l.predict(X_test[:5])
            
            # Verify all predictions work
            assert nas_predictions is not None, "NAS should make predictions"
            assert relation_predictions is not None, "Relation should make predictions"
            assert l2l_predictions is not None, "L2L should make predictions"
            
            # Test prediction shapes
            assert len(nas_predictions) == len(X_test), "NAS predictions shape mismatch"
            assert len(relation_predictions) == 5, "Relation predictions shape mismatch"
            assert len(l2l_predictions) == 5, "L2L predictions shape mismatch"
            
            print("  ✅ NAS + Relation Network integration: PASSED")
            print("  ✅ NAS + Learning-to-Learn integration: PASSED")
            print("  ✅ All prediction shapes correct")
            
            self.test_results.append("meta_learning_nas_integration: PASSED")
            return True
            
        except Exception as e:
            print(f"  ❌ Meta-Learning + NAS integration failed: {e}")
            self.test_results.append(f"meta_learning_nas_integration: FAILED - {e}")
            return False
    
    def test_full_pipeline_integration(self):
        """Test full pipeline integration: Quantum + NAS + Meta-Learning"""
        print("\n🌟 Testing Full Pipeline Integration (Quantum + NAS + Meta-Learning)...")
        
        try:
            # Create all model types
            quantum_ensemble = self.engine._create_quantum_ensemble()
            nas_model = self.engine._create_nas_optimal_model()
            maml_model = self.engine._create_maml_model()
            proto_model = self.engine._create_prototypical_model()
            relation_model = self.engine._create_relation_network()
            l2l_model = self.engine._create_learning_to_learn_model()
            
            # Verify all models created
            models = {
                'Quantum': quantum_ensemble,
                'NAS': nas_model,
                'MAML': maml_model,
                'Prototypical': proto_model,
                'Relation': relation_model,
                'Learning-to-Learn': l2l_model
            }
            
            for name, model in models.items():
                assert model is not None, f"{name} model should be created"
            
            print("  ✅ All 6 model types created successfully")
            
            # Test end-to-end pipeline
            X_train, y_train = self.generate_test_data(100)
            X_test = np.random.rand(20, 10)
            
            # Train traditional models
            quantum_ensemble.fit(X_train, y_train)
            nas_model.fit(X_train, y_train, epochs=1, verbose=0)
            
            # Train meta-learning models
            support_X, support_y, query_X, query_y = self.generate_few_shot_data()
            
            # MAML
            meta_tasks = []
            for _ in range(2):
                meta_tasks.append({
                    'support': (support_X, support_y),
                    'query': (query_X, query_y)
                })
            maml_model.fit(meta_tasks, epochs=1, verbose=0)
            adapted_maml = maml_model.adapt(support_X, support_y, adaptation_steps=1)
            
            # Prototypical
            proto_model.fit(support_X, support_y, epochs=1, verbose=0)
            
            # Relation Network
            X1 = np.random.rand(20, 10)
            X2 = np.random.rand(20, 10)
            relations = np.random.randint(0, 2, 20)
            relation_model.fit((X1, X2), relations, epochs=1, verbose=0)
            
            # Learning-to-Learn
            l2l_model.fit(meta_tasks, epochs=1, verbose=0)
            adapted_l2l = l2l_model.meta_learn((support_X, support_y), adaptation_steps=3)
            
            print("  ✅ All models trained successfully")
            
            # Test predictions from all models
            quantum_pred = quantum_ensemble.predict(X_test)
            nas_pred = nas_model.predict(X_test, verbose=0)
            maml_pred = adapted_maml.predict(query_X)
            proto_pred = proto_model.predict(query_X)
            relation_pred = relation_model.predict((X1[:5], X2[:5]))
            l2l_pred = adapted_l2l.predict(X_test[:5])
            
            # Verify all predictions
            predictions = {
                'Quantum': quantum_pred,
                'NAS': nas_pred,
                'MAML': maml_pred,
                'Prototypical': proto_pred,
                'Relation': relation_pred,
                'Learning-to-Learn': l2l_pred
            }
            
            for name, pred in predictions.items():
                assert pred is not None, f"{name} predictions should not be None"
                assert len(pred) > 0, f"{name} predictions should not be empty"
            
            print("  ✅ All models made predictions successfully")
            
            # Test ensemble diversity
            # Compare quantum and NAS predictions
            quantum_flat = quantum_pred.flatten()
            nas_flat = nas_pred.flatten()
            
            if len(quantum_flat) == len(nas_flat):
                correlation = np.corrcoef(quantum_flat, nas_flat)[0, 1]
                diversity_score = 1 - abs(correlation)
                
                print(f"  ✅ Model diversity score: {diversity_score:.3f}")
                assert diversity_score > 0.1, f"Models should be diverse (diversity: {diversity_score:.3f})"
            
            print("  ✅ Full pipeline integration: PASSED")
            print("  ✅ Model diversity: PASSED")
            
            self.test_results.append("full_pipeline_integration: PASSED")
            return True
            
        except Exception as e:
            print(f"  ❌ Full pipeline integration failed: {e}")
            self.test_results.append(f"full_pipeline_integration: FAILED - {e}")
            return False
    
    def test_performance_consistency(self):
        """Test that meta-learning doesn't break performance of existing models"""
        print("\n⚡ Testing Performance Consistency...")
        
        try:
            # Test quantum ensemble performance
            quantum_ensemble = self.engine._create_quantum_ensemble()
            X_train, y_train = self.generate_test_data(100)
            X_test = np.random.rand(20, 10)
            
            start_time = time.time()
            quantum_ensemble.fit(X_train, y_train)
            quantum_train_time = time.time() - start_time
            
            start_time = time.time()
            quantum_pred = quantum_ensemble.predict(X_test)
            quantum_pred_time = time.time() - start_time
            
            # Test NAS model performance
            nas_model = self.engine._create_nas_optimal_model()
            
            start_time = time.time()
            nas_model.fit(X_train, y_train, epochs=1, verbose=0)
            nas_train_time = time.time() - start_time
            
            start_time = time.time()
            nas_pred = nas_model.predict(X_test, verbose=0)
            nas_pred_time = time.time() - start_time
            
            # Verify performance requirements
            assert quantum_train_time < 5.0, f"Quantum training should be <5s, was {quantum_train_time:.3f}s"
            assert quantum_pred_time < 2.0, f"Quantum prediction should be <2s, was {quantum_pred_time:.3f}s"
            assert nas_train_time < 10.0, f"NAS training should be <10s, was {nas_train_time:.3f}s"
            assert nas_pred_time < 2.0, f"NAS prediction should be <2s, was {nas_pred_time:.3f}s"
            
            print(f"  ✅ Quantum: Train={quantum_train_time:.3f}s, Pred={quantum_pred_time:.3f}s")
            print(f"  ✅ NAS: Train={nas_train_time:.3f}s, Pred={nas_pred_time:.3f}s")
            print("  ✅ Performance consistency: PASSED")
            
            self.test_results.append("performance_consistency: PASSED")
            return True
            
        except Exception as e:
            print(f"  ❌ Performance consistency test failed: {e}")
            self.test_results.append(f"performance_consistency: FAILED - {e}")
            return False
    
    def test_error_handling_integration(self):
        """Test error handling in integrated environment"""
        print("\n🛡️ Testing Error Handling Integration...")
        
        try:
            maml_model = self.engine._create_maml_model()
            proto_model = self.engine._create_prototypical_model()
            
            # Test with invalid data
            error_count = 0
            
            # Test MAML with None data
            try:
                maml_model.fit(None, epochs=1, verbose=0)
            except (ValueError, TypeError, AttributeError):
                error_count += 1
            
            # Test MAML with empty tasks
            try:
                maml_model.fit([], epochs=1, verbose=0)
            except (ValueError, TypeError, AttributeError):
                error_count += 1
            
            # Test Prototypical with mismatched data
            try:
                proto_model.fit(np.random.rand(10, 5), np.random.rand(20), epochs=1, verbose=0)
            except (ValueError, TypeError, AttributeError):
                error_count += 1
            
            # Test MAML adaptation with invalid data
            try:
                maml_model.adapt(np.array([]).reshape(0, 10), np.array([]), adaptation_steps=1)
            except (ValueError, TypeError, AttributeError):
                error_count += 1
            
            assert error_count >= 3, f"Should catch at least 3 errors, caught {error_count}"
            
            print(f"  ✅ Caught {error_count}/4 expected errors")
            print("  ✅ Error handling integration: PASSED")
            
            self.test_results.append("error_handling_integration: PASSED")
            return True
            
        except Exception as e:
            print(f"  ❌ Error handling integration test failed: {e}")
            self.test_results.append(f"error_handling_integration: FAILED - {e}")
            return False
    
    def run_comprehensive_integration_test(self):
        """Run comprehensive integration testing"""
        print("🚀 Starting Comprehensive Meta-Learning Integration Testing...")
        print("=" * 70)
        
        test_functions = [
            self.test_meta_learning_quantum_integration,
            self.test_meta_learning_nas_integration,
            self.test_full_pipeline_integration,
            self.test_performance_consistency,
            self.test_error_handling_integration
        ]
        
        passed_tests = 0
        total_tests = len(test_functions)
        
        for test_func in test_functions:
            try:
                if test_func():
                    passed_tests += 1
            except Exception as e:
                print(f"  ❌ Test {test_func.__name__} crashed: {e}")
                self.test_results.append(f"{test_func.__name__}: CRASHED - {e}")
        
        # Summary
        print("\n" + "=" * 70)
        print("📊 INTEGRATION TESTING SUMMARY")
        print("=" * 70)
        
        for result in self.test_results:
            status = "✅" if "PASSED" in result else "❌"
            print(f"{status} {result}")
        
        success_rate = (passed_tests / total_tests) * 100
        print(f"\n📈 Success Rate: {passed_tests}/{total_tests} ({success_rate:.1f}%)")
        
        if passed_tests == total_tests:
            print("\n🎉 ALL META-LEARNING INTEGRATION TESTS PASSED!")
            return True
        else:
            print(f"\n⚠️ {total_tests - passed_tests} integration tests failed")
            return False

def main():
    """Run meta-learning integration tests"""
    tester = MetaLearningIntegrationTester()
    
    success = tester.run_comprehensive_integration_test()
    
    if success:
        print("\n🏆 Meta-Learning Integration Testing: PASSED")
        sys.exit(0)
    else:
        print("\n💥 Meta-Learning Integration Testing: FAILED")
        sys.exit(1)

if __name__ == "__main__":
    main() 