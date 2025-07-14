#!/usr/bin/env python3
"""
Integration Testing Script for Quantum Ensemble
Tests integration with existing pipeline, end-to-end prediction flow, and ensures no breaking changes
"""

import sys
import os
import numpy as np
from ultra_accuracy_engine import UltraAccuracyEngine
import time
import traceback

class IntegrationTester:
    def __init__(self):
        self.engine = UltraAccuracyEngine()
        self.results = {}
        self.errors = []
    
    def test_quantum_ensemble_integration(self):
        """Test that quantum ensemble integrates with existing engine"""
        print("Testing quantum ensemble integration...")
        
        try:
            # Test that _create_quantum_ensemble returns a real object
            ensemble = self.engine._create_quantum_ensemble()
            
            if ensemble is None:
                self.errors.append("❌ _create_quantum_ensemble returned None (still mocked)")
                return False
            
            # Test that ensemble has required methods
            required_methods = ['fit', 'predict', 'get_weights']
            for method in required_methods:
                if not hasattr(ensemble, method):
                    self.errors.append(f"❌ Ensemble missing required method: {method}")
                    return False
            
            print("✅ Quantum ensemble integration: PASSED")
            self.results['quantum_ensemble_integration'] = True
            return True
            
        except Exception as e:
            self.errors.append(f"❌ Quantum ensemble integration failed: {str(e)}")
            return False
    
    def test_end_to_end_prediction_flow(self):
        """Test complete end-to-end prediction flow"""
        print("Testing end-to-end prediction flow...")
        
        try:
            # Generate synthetic betting data
            features = {
                'team_a_rating': 85.5,
                'team_b_rating': 78.2,
                'historical_h2h': 0.65,
                'home_advantage': 0.1,
                'recent_form_a': 0.8,
                'recent_form_b': 0.6,
                'weather_impact': 0.05,
                'injury_factor_a': 0.9,
                'injury_factor_b': 0.85,
                'market_sentiment': 0.7
            }
            
            # Test quantum feature transformation
            transformed_features = self.engine._quantum_feature_transformation(features)
            
            if not isinstance(transformed_features, dict):
                self.errors.append("❌ Quantum feature transformation should return dict")
                return False
            
            if len(transformed_features) == 0:
                self.errors.append("❌ Quantum feature transformation returned empty dict")
                return False
            
            # Test ensemble creation and prediction
            ensemble = self.engine._create_quantum_ensemble()
            
            # Create training data
            X_train = np.random.rand(100, 10)
            y_train = np.random.rand(100)
            
            # Test fit
            ensemble.fit(X_train, y_train)
            
            # Test prediction
            X_test = np.random.rand(10, 10)
            predictions = ensemble.predict(X_test)
            
            if predictions is None:
                self.errors.append("❌ Ensemble predictions returned None")
                return False
            
            if len(predictions) != len(X_test):
                self.errors.append("❌ Prediction count doesn't match test data count")
                return False
            
            print("✅ End-to-end prediction flow: PASSED")
            self.results['end_to_end_flow'] = True
            return True
            
        except Exception as e:
            self.errors.append(f"❌ End-to-end prediction flow failed: {str(e)}")
            traceback.print_exc()
            return False
    
    def test_existing_functionality_not_broken(self):
        """Test that existing functionality still works"""
        print("Testing existing functionality not broken...")
        
        try:
            # Test that engine can still be initialized
            engine = UltraAccuracyEngine()
            
            # Test that other methods still exist and work
            test_methods = [
                '_quantum_feature_transformation',
                '_create_quantum_ensemble',
                # Add other critical methods as needed
            ]
            
            for method_name in test_methods:
                if not hasattr(engine, method_name):
                    self.errors.append(f"❌ Critical method missing: {method_name}")
                    return False
            
            # Test quantum feature transformation with sample data
            sample_features = {'test_feature': 1.0, 'another_feature': 2.0}
            transformed = engine._quantum_feature_transformation(sample_features)
            
            if not isinstance(transformed, dict):
                self.errors.append("❌ Quantum feature transformation broken")
                return False
            
            print("✅ Existing functionality not broken: PASSED")
            self.results['existing_functionality'] = True
            return True
            
        except Exception as e:
            self.errors.append(f"❌ Existing functionality broken: {str(e)}")
            traceback.print_exc()
            return False
    
    def test_error_handling_integration(self):
        """Test that error handling works properly in integrated environment"""
        print("Testing error handling integration...")
        
        try:
            ensemble = self.engine._create_quantum_ensemble()
            
            # Test with invalid data
            try:
                ensemble.fit(None, None)
                self.errors.append("❌ Should have raised error for None data")
                return False
            except (ValueError, TypeError):
                # Expected behavior
                pass
            
            # Test with mismatched dimensions
            try:
                X_train = np.random.rand(10, 5)
                y_train = np.random.rand(20)  # Wrong size
                ensemble.fit(X_train, y_train)
                self.errors.append("❌ Should have raised error for mismatched dimensions")
                return False
            except (ValueError, TypeError):
                # Expected behavior
                pass
            
            print("✅ Error handling integration: PASSED")
            self.results['error_handling'] = True
            return True
            
        except Exception as e:
            self.errors.append(f"❌ Error handling integration failed: {str(e)}")
            return False
    
    def test_performance_in_integrated_environment(self):
        """Test performance in integrated environment"""
        print("Testing performance in integrated environment...")
        
        try:
            # Test complete workflow timing
            start_time = time.time()
            
            # Create engine
            engine = UltraAccuracyEngine()
            
            # Create ensemble
            ensemble = engine._create_quantum_ensemble()
            
            # Prepare data
            X_train = np.random.rand(1000, 10)
            y_train = np.random.rand(1000)
            X_test = np.random.rand(100, 10)
            
            # Train and predict
            ensemble.fit(X_train, y_train)
            predictions = ensemble.predict(X_test)
            
            total_time = time.time() - start_time
            
            if total_time > 10.0:  # Reasonable threshold for integrated workflow
                self.errors.append(f"❌ Integrated workflow too slow: {total_time:.3f}s")
                return False
            
            print(f"✅ Performance in integrated environment: PASSED ({total_time:.3f}s)")
            self.results['integrated_performance'] = total_time
            return True
            
        except Exception as e:
            self.errors.append(f"❌ Performance integration test failed: {str(e)}")
            return False
    
    def generate_integration_report(self):
        """Generate integration test report"""
        print("\n" + "="*60)
        print("INTEGRATION TESTING REPORT")
        print("="*60)
        
        total_tests = 5
        passed_tests = sum(1 for result in self.results.values() if result is True or isinstance(result, float))
        
        print(f"\n📊 INTEGRATION TEST RESULTS:")
        print(f"  Total tests: {total_tests}")
        print(f"  Passed: {passed_tests}")
        print(f"  Failed: {total_tests - passed_tests}")
        
        print(f"\n✅ DETAILED RESULTS:")
        test_names = {
            'quantum_ensemble_integration': 'Quantum Ensemble Integration',
            'end_to_end_flow': 'End-to-End Prediction Flow',
            'existing_functionality': 'Existing Functionality Not Broken',
            'error_handling': 'Error Handling Integration',
            'integrated_performance': 'Performance in Integrated Environment'
        }
        
        for key, name in test_names.items():
            if key in self.results:
                if key == 'integrated_performance':
                    print(f"  ✅ {name}: PASSED ({self.results[key]:.3f}s)")
                else:
                    status = "PASSED" if self.results[key] else "FAILED"
                    icon = "✅" if self.results[key] else "❌"
                    print(f"  {icon} {name}: {status}")
            else:
                print(f"  ❌ {name}: NOT RUN")
        
        if self.errors:
            print(f"\n❌ ERRORS ENCOUNTERED:")
            for error in self.errors:
                print(f"  {error}")
        
        print(f"\n🎯 INTEGRATION STATUS:")
        if passed_tests == total_tests:
            print("  ✅ ALL INTEGRATION TESTS PASSED")
            print("  ✅ Quantum ensemble fully integrated")
            print("  ✅ No breaking changes detected")
            print("  ✅ Ready for production deployment")
        else:
            print(f"  ❌ {total_tests - passed_tests} INTEGRATION TESTS FAILED")
            print("  ❌ Integration issues need to be resolved")

def main():
    """Run integration tests"""
    print("🚀 Starting Quantum Ensemble Integration Testing")
    print("="*60)
    
    tester = IntegrationTester()
    
    # Run all integration tests
    tests = [
        tester.test_quantum_ensemble_integration,
        tester.test_end_to_end_prediction_flow,
        tester.test_existing_functionality_not_broken,
        tester.test_error_handling_integration,
        tester.test_performance_in_integrated_environment
    ]
    
    for test in tests:
        test()
        print()  # Add spacing between tests
    
    # Generate final report
    tester.generate_integration_report()
    
    print(f"\n✅ Integration testing complete!")

if __name__ == "__main__":
    main() 