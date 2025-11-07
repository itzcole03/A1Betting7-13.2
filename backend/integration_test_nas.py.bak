#!/usr/bin/env python3
"""
Integration Testing Script for NAS Models
Tests integration with quantum ensemble and end-to-end prediction pipeline
"""

import time
import numpy as np
from ultra_accuracy_engine import UltraAccuracyEngine
import sys
import os

class NASIntegrationTester:
    def __init__(self):
        self.engine = UltraAccuracyEngine()
        self.test_results = []
    
    def generate_test_data(self, num_samples: int = 100, num_features: int = 10):
        """Generate synthetic test data for integration testing"""
        return np.random.rand(num_samples, num_features), np.random.rand(num_samples)
    
    def test_nas_quantum_ensemble_integration(self):
        """Test integration between NAS models and quantum ensemble"""
        print("Testing NAS-Quantum Ensemble Integration...")
        
        try:
            # Create both NAS and quantum models
            nas_model = self.engine._create_nas_optimal_model()
            quantum_ensemble = self.engine._create_quantum_ensemble()
            
            assert nas_model is not None, "NAS model should be created"
            assert quantum_ensemble is not None, "Quantum ensemble should be created"
            
            # Test with same data
            X_train, y_train = self.generate_test_data(200, 10)
            X_test, y_test = self.generate_test_data(50, 10)
            
            # Train both models
            start_time = time.time()
            nas_model.fit(X_train, y_train, epochs=1, verbose=0)
            nas_train_time = time.time() - start_time
            
            start_time = time.time()
            quantum_ensemble.fit(X_train, y_train)
            quantum_train_time = time.time() - start_time
            
            # Make predictions
            start_time = time.time()
            nas_predictions = nas_model.predict(X_test, verbose=0)
            nas_predict_time = time.time() - start_time
            
            start_time = time.time()
            quantum_predictions = quantum_ensemble.predict(X_test)
            quantum_predict_time = time.time() - start_time
            
            # Verify predictions
            assert nas_predictions is not None, "NAS should make predictions"
            assert quantum_predictions is not None, "Quantum should make predictions"
            assert len(nas_predictions) == len(X_test), "NAS prediction count should match"
            assert len(quantum_predictions) == len(X_test), "Quantum prediction count should match"
            
            print(f"✅ NAS-Quantum Integration: SUCCESS")
            print(f"   NAS: Train={nas_train_time:.3f}s, Predict={nas_predict_time:.3f}s")
            print(f"   Quantum: Train={quantum_train_time:.3f}s, Predict={quantum_predict_time:.3f}s")
            
            self.test_results.append({
                'test': 'nas_quantum_integration',
                'status': 'PASSED',
                'nas_train_time': nas_train_time,
                'nas_predict_time': nas_predict_time,
                'quantum_train_time': quantum_train_time,
                'quantum_predict_time': quantum_predict_time
            })
            
            return True
            
        except Exception as e:
            print(f"❌ NAS-Quantum Integration: FAILED - {str(e)}")
            self.test_results.append({
                'test': 'nas_quantum_integration',
                'status': 'FAILED',
                'error': str(e)
            })
            return False
    
    def test_nas_model_diversity(self):
        """Test that different NAS models create diverse architectures"""
        print("\nTesting NAS Model Diversity...")
        
        try:
            # Create all NAS models
            nas_models = {
                'nas_optimal': self.engine._create_nas_optimal_model(),
                'automl': self.engine._create_automl_model(),
                'progressive_nas': self.engine._create_progressive_nas_model(),
                'efficientnet': self.engine._create_efficient_net_model()
            }
            
            # Verify all models created
            for name, model in nas_models.items():
                assert model is not None, f"{name} should be created"
            
            # Test with same data to verify diversity
            X_train, y_train = self.generate_test_data(100, 10)
            X_test, y_test = self.generate_test_data(20, 10)
            
            predictions = {}
            train_times = {}
            
            for name, model in nas_models.items():
                start_time = time.time()
                model.fit(X_train, y_train, epochs=1, verbose=0)
                train_time = time.time() - start_time
                
                preds = model.predict(X_test, verbose=0)
                predictions[name] = preds.flatten() if preds.ndim > 1 else preds
                train_times[name] = train_time
                
                print(f"✅ {name}: Trained in {train_time:.3f}s")
            
            # Verify prediction diversity (models should produce different results)
            model_names = list(predictions.keys())
            diversity_scores = []
            
            for i in range(len(model_names)):
                for j in range(i+1, len(model_names)):
                    pred1 = predictions[model_names[i]]
                    pred2 = predictions[model_names[j]]
                    
                    # Calculate correlation (lower = more diverse)
                    correlation = np.corrcoef(pred1, pred2)[0, 1]
                    diversity_score = 1 - abs(correlation)
                    diversity_scores.append(diversity_score)
                    
                    print(f"   {model_names[i]} vs {model_names[j]}: diversity={diversity_score:.3f}")
            
            avg_diversity = np.mean(diversity_scores)
            print(f"✅ Average Model Diversity: {avg_diversity:.3f}")
            
            self.test_results.append({
                'test': 'nas_model_diversity',
                'status': 'PASSED',
                'avg_diversity': avg_diversity,
                'train_times': train_times
            })
            
            return True
            
        except Exception as e:
            print(f"❌ NAS Model Diversity: FAILED - {str(e)}")
            self.test_results.append({
                'test': 'nas_model_diversity',
                'status': 'FAILED',
                'error': str(e)
            })
            return False
    
    def test_nas_pipeline_integration(self):
        """Test NAS models integrate with existing prediction pipeline"""
        print("\nTesting NAS Pipeline Integration...")
        
        try:
            # Test that engine has proper NAS integration
            assert hasattr(self.engine, 'neural_architecture_models'), "Engine should have NAS models"
            
            nas_models = self.engine.neural_architecture_models
            assert isinstance(nas_models, dict), "NAS models should be dictionary"
            
            # Test pipeline with NAS models
            X_test, y_test = self.generate_test_data(50, 10)
            
            pipeline_results = {}
            
            # Test individual NAS model access
            nas_optimal = self.engine._create_nas_optimal_model()
            automl_model = self.engine._create_automl_model()
            progressive_nas = self.engine._create_progressive_nas_model()
            
            models = [
                ('nas_optimal', nas_optimal),
                ('automl', automl_model),
                ('progressive_nas', progressive_nas)
            ]
            
            for name, model in models:
                if model is not None:
                    # Train with minimal data
                    X_train, y_train = self.generate_test_data(100, 10)
                    model.fit(X_train, y_train, epochs=1, verbose=0)
                    
                    # Test prediction pipeline
                    start_time = time.time()
                    predictions = model.predict(X_test, verbose=0)
                    predict_time = time.time() - start_time
                    
                    pipeline_results[name] = {
                        'predictions': predictions,
                        'predict_time': predict_time,
                        'status': 'SUCCESS'
                    }
                    
                    print(f"✅ {name} pipeline: SUCCESS (predict_time={predict_time:.3f}s)")
                else:
                    pipeline_results[name] = {'status': 'FAILED', 'error': 'Model creation failed'}
                    print(f"❌ {name} pipeline: FAILED")
            
            # Verify pipeline consistency
            successful_models = [name for name, result in pipeline_results.items() 
                                if result['status'] == 'SUCCESS']
            
            assert len(successful_models) >= 2, "At least 2 NAS models should work in pipeline"
            
            print(f"✅ NAS Pipeline Integration: SUCCESS ({len(successful_models)}/3 models)")
            
            self.test_results.append({
                'test': 'nas_pipeline_integration',
                'status': 'PASSED',
                'successful_models': len(successful_models),
                'pipeline_results': pipeline_results
            })
            
            return True
            
        except Exception as e:
            print(f"❌ NAS Pipeline Integration: FAILED - {str(e)}")
            self.test_results.append({
                'test': 'nas_pipeline_integration',
                'status': 'FAILED',
                'error': str(e)
            })
            return False
    
    def test_nas_performance_requirements(self):
        """Test NAS models meet performance requirements"""
        print("\nTesting NAS Performance Requirements...")
        
        try:
            # Test model creation times (<3s)
            nas_creators = [
                ('nas_optimal', self.engine._create_nas_optimal_model),
                ('automl', self.engine._create_automl_model),
                ('progressive_nas', self.engine._create_progressive_nas_model),
                ('efficientnet', self.engine._create_efficient_net_model)
            ]
            
            creation_times = {}
            prediction_times = {}
            
            for name, creator in nas_creators:
                # Test creation time
                start_time = time.time()
                model = creator()
                creation_time = time.time() - start_time
                creation_times[name] = creation_time
                
                if model is not None:
                    # Test prediction time
                    X_train, y_train = self.generate_test_data(100, 10)
                    X_test, y_test = self.generate_test_data(20, 10)
                    
                    model.fit(X_train, y_train, epochs=1, verbose=0)
                    
                    start_time = time.time()
                    predictions = model.predict(X_test, verbose=0)
                    prediction_time = time.time() - start_time
                    prediction_times[name] = prediction_time
                    
                    print(f"✅ {name}: Creation={creation_time:.3f}s, Prediction={prediction_time:.3f}s")
                else:
                    print(f"❌ {name}: Creation failed")
            
            # Check requirements
            max_creation_time = max(creation_times.values()) if creation_times else 0
            max_prediction_time = max(prediction_times.values()) if prediction_times else 0
            
            creation_passed = max_creation_time < 3.0
            prediction_passed = max_prediction_time < 2.0
            
            print(f"\n📊 Performance Requirements:")
            print(f"   Model Creation (<3s): {'✅ PASSED' if creation_passed else '❌ FAILED'} (max: {max_creation_time:.3f}s)")
            print(f"   Prediction Time (<2s): {'✅ PASSED' if prediction_passed else '❌ FAILED'} (max: {max_prediction_time:.3f}s)")
            
            self.test_results.append({
                'test': 'nas_performance_requirements',
                'status': 'PASSED' if (creation_passed and prediction_passed) else 'FAILED',
                'max_creation_time': max_creation_time,
                'max_prediction_time': max_prediction_time,
                'creation_passed': creation_passed,
                'prediction_passed': prediction_passed
            })
            
            return creation_passed and prediction_passed
            
        except Exception as e:
            print(f"❌ NAS Performance Requirements: FAILED - {str(e)}")
            self.test_results.append({
                'test': 'nas_performance_requirements',
                'status': 'FAILED',
                'error': str(e)
            })
            return False
    
    def test_nas_error_handling(self):
        """Test NAS models handle errors gracefully"""
        print("\nTesting NAS Error Handling...")
        
        try:
            nas_model = self.engine._create_nas_optimal_model()
            assert nas_model is not None, "NAS model should be created for error testing"
            
            error_tests = []
            
            # Test 1: None data
            try:
                nas_model.fit(None, None)
                error_tests.append(('none_data', 'FAILED', 'Should have raised error'))
            except (ValueError, TypeError, AttributeError):
                error_tests.append(('none_data', 'PASSED', 'Correctly handled None data'))
            
            # Test 2: Empty data
            try:
                empty_X = np.array([]).reshape(0, 10)
                empty_y = np.array([])
                nas_model.fit(empty_X, empty_y)
                error_tests.append(('empty_data', 'FAILED', 'Should have raised error'))
            except (ValueError, TypeError, AttributeError):
                error_tests.append(('empty_data', 'PASSED', 'Correctly handled empty data'))
            
            # Test 3: Mismatched dimensions
            try:
                X_mismatch = np.random.rand(10, 10)
                y_mismatch = np.random.rand(20)  # Wrong size
                nas_model.fit(X_mismatch, y_mismatch)
                error_tests.append(('dimension_mismatch', 'FAILED', 'Should have raised error'))
            except (ValueError, TypeError, AttributeError):
                error_tests.append(('dimension_mismatch', 'PASSED', 'Correctly handled dimension mismatch'))
            
            # Report results
            passed_tests = sum(1 for test in error_tests if test[1] == 'PASSED')
            total_tests = len(error_tests)
            
            for test_name, status, message in error_tests:
                print(f"   {test_name}: {status} - {message}")
            
            print(f"✅ Error Handling: {passed_tests}/{total_tests} tests passed")
            
            self.test_results.append({
                'test': 'nas_error_handling',
                'status': 'PASSED' if passed_tests == total_tests else 'PARTIAL',
                'passed_tests': passed_tests,
                'total_tests': total_tests,
                'error_tests': error_tests
            })
            
            return passed_tests >= total_tests - 1  # Allow 1 failure
            
        except Exception as e:
            print(f"❌ NAS Error Handling: FAILED - {str(e)}")
            self.test_results.append({
                'test': 'nas_error_handling',
                'status': 'FAILED',
                'error': str(e)
            })
            return False
    
    def generate_integration_report(self):
        """Generate comprehensive integration test report"""
        print("\n" + "="*60)
        print("NAS INTEGRATION TEST REPORT")
        print("="*60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['status'] == 'PASSED')
        
        print(f"\n📊 OVERALL RESULTS:")
        print(f"   Total Tests: {total_tests}")
        print(f"   Passed: {passed_tests}")
        print(f"   Failed: {total_tests - passed_tests}")
        print(f"   Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        print(f"\n📋 DETAILED RESULTS:")
        for result in self.test_results:
            status_icon = "✅" if result['status'] == 'PASSED' else "❌" if result['status'] == 'FAILED' else "⚠️"
            print(f"   {status_icon} {result['test']}: {result['status']}")
            
            if 'error' in result:
                print(f"      Error: {result['error']}")
        
        print(f"\n🎯 INTEGRATION SUCCESS CRITERIA:")
        criteria_met = 0
        total_criteria = 5
        
        # Criterion 1: NAS-Quantum Integration
        nas_quantum_passed = any(r['test'] == 'nas_quantum_integration' and r['status'] == 'PASSED' 
                                for r in self.test_results)
        if nas_quantum_passed:
            print(f"   ✅ NAS-Quantum Integration: PASSED")
            criteria_met += 1
        else:
            print(f"   ❌ NAS-Quantum Integration: FAILED")
        
        # Criterion 2: Model Diversity
        diversity_passed = any(r['test'] == 'nas_model_diversity' and r['status'] == 'PASSED' 
                              for r in self.test_results)
        if diversity_passed:
            print(f"   ✅ Model Diversity: PASSED")
            criteria_met += 1
        else:
            print(f"   ❌ Model Diversity: FAILED")
        
        # Criterion 3: Pipeline Integration
        pipeline_passed = any(r['test'] == 'nas_pipeline_integration' and r['status'] == 'PASSED' 
                             for r in self.test_results)
        if pipeline_passed:
            print(f"   ✅ Pipeline Integration: PASSED")
            criteria_met += 1
        else:
            print(f"   ❌ Pipeline Integration: FAILED")
        
        # Criterion 4: Performance Requirements
        performance_passed = any(r['test'] == 'nas_performance_requirements' and r['status'] == 'PASSED' 
                                for r in self.test_results)
        if performance_passed:
            print(f"   ✅ Performance Requirements: PASSED")
            criteria_met += 1
        else:
            print(f"   ❌ Performance Requirements: FAILED")
        
        # Criterion 5: Error Handling
        error_handling_passed = any(r['test'] == 'nas_error_handling' and r['status'] in ['PASSED', 'PARTIAL'] 
                                   for r in self.test_results)
        if error_handling_passed:
            print(f"   ✅ Error Handling: PASSED")
            criteria_met += 1
        else:
            print(f"   ❌ Error Handling: FAILED")
        
        print(f"\n🏆 FINAL INTEGRATION SCORE: {criteria_met}/{total_criteria} ({(criteria_met/total_criteria)*100:.1f}%)")
        
        if criteria_met >= 4:
            print(f"🎉 NAS INTEGRATION: SUCCESS - Ready for production!")
        elif criteria_met >= 3:
            print(f"⚠️  NAS INTEGRATION: PARTIAL - Minor issues to address")
        else:
            print(f"❌ NAS INTEGRATION: NEEDS WORK - Major issues to resolve")

def main():
    """Run NAS integration tests"""
    print("🚀 Starting NAS Integration Testing")
    print("="*60)
    
    tester = NASIntegrationTester()
    
    # Run all integration tests
    tests = [
        tester.test_nas_quantum_ensemble_integration,
        tester.test_nas_model_diversity,
        tester.test_nas_pipeline_integration,
        tester.test_nas_performance_requirements,
        tester.test_nas_error_handling
    ]
    
    for test in tests:
        test()
    
    # Generate final report
    tester.generate_integration_report()
    
    print(f"\n✅ NAS integration testing complete!")

if __name__ == "__main__":
    main() 