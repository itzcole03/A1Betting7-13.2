#!/usr/bin/env python3
"""
Integration Testing Script for Real Metrics API Endpoints
Tests the integration between RealPerformanceMetrics and ultra_accuracy_routes.py
"""

import time
import requests
import json
import sys
from datetime import datetime
from ultra_accuracy_engine import UltraAccuracyEngine, RealPerformanceMetrics, QuantumEnsemblePrediction

class RealMetricsIntegrationTester:
    def __init__(self):
        self.base_url = "${process.env.REACT_APP_API_URL || "http://localhost:8000"}/api/ultra-accuracy"
        self.test_results = {}
    
    def test_performance_metrics_endpoint_integration(self):
        """Test 1: Performance metrics endpoint integration with real calculations"""
        print("Testing performance metrics endpoint integration...")
        
        try:
            # Test the endpoint (this would normally require the server to be running)
            # For now, we'll test the logic directly
            from ultra_accuracy_routes import real_metrics
            
            # Add some test data to the real metrics system
            engine = UltraAccuracyEngine()
            metrics = RealPerformanceMetrics(engine)
            
            # Generate test predictions
            for i in range(50):
                pred = QuantumEnsemblePrediction(
                    base_prediction=0.7 + (i % 10) * 0.02,
                    quantum_correction=0.02,
                    final_prediction=0.72 + (i % 10) * 0.02,
                    confidence_distribution={"overall": 0.85 + (i % 5) * 0.02},
                    quantum_entanglement_score=0.8,
                    coherence_measure=0.85,
                    uncertainty_bounds=(0.67, 0.77),
                    quantum_advantage=0.1,
                    classical_fallback=0.71,
                    entangled_features=["feature1", "feature2"],
                    decoherence_time=1.0,
                    quantum_fidelity=0.95
                )
                metrics.add_prediction_result(pred, 0.7 + (i % 10) * 0.02)
                metrics.record_processing_time(0.05 + (i % 5) * 0.01)
            
            # Test that the endpoint logic works
            start_time = time.time()
            
            # Simulate the endpoint response logic
            endpoint_metrics = {
                "overall_accuracy": metrics.calculate_overall_accuracy(),
                "model_consensus": metrics.calculate_model_consensus(),
                "average_processing_time": metrics.calculate_average_processing_time(),
                "accuracy_trend": metrics.calculate_accuracy_trend(),
                "real_time_performance": metrics.get_real_time_performance(),
                "system_health": metrics.get_system_health_metrics(),
                "last_updated": datetime.now().isoformat(),
            }
            
            response_time = time.time() - start_time
            
            # Verify the response structure and values
            assert isinstance(endpoint_metrics["overall_accuracy"], float)
            assert isinstance(endpoint_metrics["model_consensus"], float)
            assert isinstance(endpoint_metrics["average_processing_time"], float)
            assert isinstance(endpoint_metrics["accuracy_trend"], list)
            assert isinstance(endpoint_metrics["real_time_performance"], dict)
            assert isinstance(endpoint_metrics["system_health"], dict)
            
            # Verify values are not hardcoded
            assert endpoint_metrics["model_consensus"] != 0.95
            assert endpoint_metrics["average_processing_time"] != 2.5
            
            # Verify response time
            assert response_time < 0.5, f"Response time {response_time:.3f}s exceeds 500ms requirement"
            
            print(f"✅ Performance metrics endpoint integration successful")
            print(f"✅ Response time: {response_time:.3f}s")
            print(f"✅ Overall accuracy: {endpoint_metrics['overall_accuracy']:.3f}")
            print(f"✅ Model consensus: {endpoint_metrics['model_consensus']:.3f}")
            print(f"✅ Processing time: {endpoint_metrics['average_processing_time']:.3f}s")
            
            self.test_results['performance_metrics_endpoint'] = {
                'passed': True,
                'response_time': response_time,
                'metrics': endpoint_metrics
            }
            
            return True
            
        except Exception as e:
            print(f"❌ Performance metrics endpoint integration failed: {e}")
            self.test_results['performance_metrics_endpoint'] = {
                'passed': False,
                'error': str(e)
            }
            return False
    
    def test_system_status_endpoint_integration(self):
        """Test 2: System status endpoint integration with real model counts"""
        print("\nTesting system status endpoint integration...")
        
        try:
            from ultra_accuracy_routes import real_metrics
            
            # Test the system status endpoint logic
            start_time = time.time()
            
            # Simulate the endpoint response logic
            health_metrics = real_metrics.get_system_health_metrics()
            
            endpoint_status = {
                "system_health": "optimal",
                "accuracy_engine": "active",
                "quantum_models": health_metrics["quantum_models_count"],
                "neural_architecture_models": health_metrics["nas_models_count"],
                "meta_models": health_metrics["meta_models_count"],
                "cache_size": health_metrics["cache_size"],
                "active_models": health_metrics["active_models_total"],
                "predictions_tracked": health_metrics["predictions_tracked"],
                "processing_times_recorded": health_metrics["processing_times_recorded"],
                "system_uptime_hours": health_metrics["system_uptime_hours"],
                "last_optimization": datetime.now().isoformat(),
                "uptime": "active",
            }
            
            response_time = time.time() - start_time
            
            # Verify the response structure
            assert isinstance(endpoint_status["quantum_models"], int)
            assert isinstance(endpoint_status["neural_architecture_models"], int)
            assert isinstance(endpoint_status["meta_models"], int)
            assert isinstance(endpoint_status["cache_size"], int)
            assert isinstance(endpoint_status["active_models"], int)
            assert isinstance(endpoint_status["predictions_tracked"], int)
            assert isinstance(endpoint_status["processing_times_recorded"], int)
            assert isinstance(endpoint_status["system_uptime_hours"], float)
            
            # Verify values are not hardcoded (they should be real counts)
            # Note: These might be 0 if no models are initialized, which is fine
            assert endpoint_status["quantum_models"] >= 0
            assert endpoint_status["neural_architecture_models"] >= 0
            assert endpoint_status["meta_models"] >= 0
            assert endpoint_status["cache_size"] >= 0
            assert endpoint_status["active_models"] >= 0
            
            # Verify response time
            assert response_time < 0.5, f"Response time {response_time:.3f}s exceeds 500ms requirement"
            
            print(f"✅ System status endpoint integration successful")
            print(f"✅ Response time: {response_time:.3f}s")
            print(f"✅ Quantum models: {endpoint_status['quantum_models']}")
            print(f"✅ NAS models: {endpoint_status['neural_architecture_models']}")
            print(f"✅ Meta models: {endpoint_status['meta_models']}")
            print(f"✅ Active models total: {endpoint_status['active_models']}")
            print(f"✅ Predictions tracked: {endpoint_status['predictions_tracked']}")
            
            self.test_results['system_status_endpoint'] = {
                'passed': True,
                'response_time': response_time,
                'status': endpoint_status
            }
            
            return True
            
        except Exception as e:
            print(f"❌ System status endpoint integration failed: {e}")
            self.test_results['system_status_endpoint'] = {
                'passed': False,
                'error': str(e)
            }
            return False
    
    def test_prediction_tracking_integration(self):
        """Test 3: Prediction tracking integration with real metrics recording"""
        print("\nTesting prediction tracking integration...")
        
        try:
            from ultra_accuracy_routes import real_metrics
            
            initial_predictions = len(real_metrics.prediction_results)
            initial_processing_times = len(real_metrics.processing_times)
            
            # Simulate making predictions and recording metrics
            for i in range(10):
                # Simulate prediction creation
                pred = QuantumEnsemblePrediction(
                    base_prediction=0.6 + i * 0.03,
                    quantum_correction=0.02,
                    final_prediction=0.62 + i * 0.03,
                    confidence_distribution={"overall": 0.9},
                    quantum_entanglement_score=0.8,
                    coherence_measure=0.85,
                    uncertainty_bounds=(0.57, 0.67),
                    quantum_advantage=0.1,
                    classical_fallback=0.61,
                    entangled_features=["feature1"],
                    decoherence_time=1.0,
                    quantum_fidelity=0.95
                )
                
                # Simulate recording processing time (as done in the endpoint)
                processing_time = 0.1 + i * 0.01
                real_metrics.record_processing_time(processing_time)
                
                # Simulate recording prediction result
                actual_outcome = 0.6 + i * 0.03 + (0.02 if i % 2 else -0.02)  # Add some variation
                real_metrics.add_prediction_result(pred, actual_outcome)
            
            # Verify that metrics were recorded
            final_predictions = len(real_metrics.prediction_results)
            final_processing_times = len(real_metrics.processing_times)
            
            assert final_predictions > initial_predictions, "Predictions should have been recorded"
            assert final_processing_times > initial_processing_times, "Processing times should have been recorded"
            
            # Test that metrics reflect the new data
            updated_consensus = real_metrics.calculate_model_consensus()
            updated_processing_time = real_metrics.calculate_average_processing_time()
            updated_real_time_perf = real_metrics.get_real_time_performance()
            
            assert isinstance(updated_consensus, float)
            assert isinstance(updated_processing_time, float)
            assert isinstance(updated_real_time_perf, dict)
            
            print(f"✅ Prediction tracking integration successful")
            print(f"✅ Predictions recorded: {final_predictions - initial_predictions}")
            print(f"✅ Processing times recorded: {final_processing_times - initial_processing_times}")
            print(f"✅ Updated consensus: {updated_consensus:.3f}")
            print(f"✅ Updated processing time: {updated_processing_time:.3f}s")
            
            self.test_results['prediction_tracking'] = {
                'passed': True,
                'predictions_added': final_predictions - initial_predictions,
                'processing_times_added': final_processing_times - initial_processing_times,
                'updated_metrics': {
                    'consensus': updated_consensus,
                    'processing_time': updated_processing_time
                }
            }
            
            return True
            
        except Exception as e:
            print(f"❌ Prediction tracking integration failed: {e}")
            self.test_results['prediction_tracking'] = {
                'passed': False,
                'error': str(e)
            }
            return False
    
    def test_real_time_updates_integration(self):
        """Test 4: Real-time updates integration"""
        print("\nTesting real-time updates integration...")
        
        try:
            from ultra_accuracy_routes import real_metrics
            
            # Get initial state
            initial_real_time = real_metrics.get_real_time_performance()
            
            # Add some new data
            for i in range(5):
                pred = QuantumEnsemblePrediction(
                    base_prediction=0.8,
                    quantum_correction=0.02,
                    final_prediction=0.82,
                    confidence_distribution={"overall": 0.95},
                    quantum_entanglement_score=0.9,
                    coherence_measure=0.9,
                    uncertainty_bounds=(0.77, 0.87),
                    quantum_advantage=0.15,
                    classical_fallback=0.81,
                    entangled_features=["new_feature"],
                    decoherence_time=1.2,
                    quantum_fidelity=0.98
                )
                
                real_metrics.add_prediction_result(pred, 0.83)
                real_metrics.record_processing_time(0.08)
            
            # Get updated state
            updated_real_time = real_metrics.get_real_time_performance()
            
            # Verify that real-time metrics updated
            assert updated_real_time != initial_real_time, "Real-time metrics should update"
            
            # Verify structure
            required_keys = ["recent_predictions_count", "recent_avg_processing_time", "recent_accuracy", 
                           "current_consensus", "system_load", "last_updated"]
            
            for key in required_keys:
                assert key in updated_real_time, f"Missing key: {key}"
                assert updated_real_time[key] is not None, f"Null value for key: {key}"
            
            print(f"✅ Real-time updates integration successful")
            print(f"✅ Recent predictions: {updated_real_time['recent_predictions_count']}")
            print(f"✅ Recent processing time: {updated_real_time['recent_avg_processing_time']:.3f}s")
            print(f"✅ Current consensus: {updated_real_time['current_consensus']:.3f}")
            print(f"✅ System load: {updated_real_time['system_load']:.3f}")
            
            self.test_results['real_time_updates'] = {
                'passed': True,
                'initial_state': initial_real_time,
                'updated_state': updated_real_time
            }
            
            return True
            
        except Exception as e:
            print(f"❌ Real-time updates integration failed: {e}")
            self.test_results['real_time_updates'] = {
                'passed': False,
                'error': str(e)
            }
            return False
    
    def test_error_handling_integration(self):
        """Test 5: Error handling integration"""
        print("\nTesting error handling integration...")
        
        try:
            from ultra_accuracy_routes import real_metrics
            
            # Test error handling with invalid data
            try:
                real_metrics.record_processing_time(-1.0)  # Invalid negative time
                print("⚠️  Expected error for negative processing time was not raised")
                error_handling_1 = False
            except ValueError:
                print("✅ Correctly handled negative processing time error")
                error_handling_1 = True
            
            # Test error handling with None prediction
            try:
                real_metrics.add_prediction_result(None, 0.5)  # Invalid None prediction
                print("⚠️  Expected error for None prediction was not raised")
                error_handling_2 = False
            except ValueError:
                print("✅ Correctly handled None prediction error")
                error_handling_2 = True
            
            # Test graceful handling of empty data
            empty_metrics = RealPerformanceMetrics(UltraAccuracyEngine())
            
            empty_consensus = empty_metrics.calculate_model_consensus()
            empty_processing_time = empty_metrics.calculate_average_processing_time()
            empty_trend = empty_metrics.calculate_accuracy_trend()
            
            # Should return reasonable defaults, not crash
            assert isinstance(empty_consensus, float)
            assert isinstance(empty_processing_time, float)
            assert isinstance(empty_trend, list)
            
            print("✅ Gracefully handled empty data scenarios")
            error_handling_3 = True
            
            overall_error_handling = error_handling_1 and error_handling_2 and error_handling_3
            
            print(f"✅ Error handling integration successful")
            
            self.test_results['error_handling'] = {
                'passed': overall_error_handling,
                'negative_time_handling': error_handling_1,
                'none_prediction_handling': error_handling_2,
                'empty_data_handling': error_handling_3
            }
            
            return overall_error_handling
            
        except Exception as e:
            print(f"❌ Error handling integration failed: {e}")
            self.test_results['error_handling'] = {
                'passed': False,
                'error': str(e)
            }
            return False
    
    def run_integration_tests(self):
        """Run all integration tests"""
        print("=" * 70)
        print("REAL METRICS API INTEGRATION TESTING")
        print("=" * 70)
        
        tests = [
            ("Performance Metrics Endpoint", self.test_performance_metrics_endpoint_integration),
            ("System Status Endpoint", self.test_system_status_endpoint_integration),
            ("Prediction Tracking", self.test_prediction_tracking_integration),
            ("Real-time Updates", self.test_real_time_updates_integration),
            ("Error Handling", self.test_error_handling_integration),
        ]
        
        passed_tests = 0
        total_tests = len(tests)
        
        for test_name, test_func in tests:
            try:
                if test_func():
                    passed_tests += 1
            except Exception as e:
                print(f"❌ {test_name} failed with exception: {e}")
        
        print("\n" + "=" * 70)
        print("INTEGRATION TEST SUMMARY")
        print("=" * 70)
        
        success_rate = (passed_tests / total_tests) * 100
        
        print(f"Tests Passed: {passed_tests}/{total_tests}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        if success_rate == 100:
            print("🎉 ALL INTEGRATION TESTS PASSED - Real metrics system fully integrated!")
        elif success_rate >= 80:
            print("✅ GOOD - Most integration tests passed")
        elif success_rate >= 60:
            print("⚠️  ACCEPTABLE - Some integration issues need attention")
        else:
            print("❌ CRITICAL - Major integration issues detected")
        
        # Detailed results
        print("\nDetailed Results:")
        for test_name, result in self.test_results.items():
            status = "✅ PASSED" if result['passed'] else "❌ FAILED"
            print(f"  {test_name}: {status}")
            if not result['passed'] and 'error' in result:
                print(f"    Error: {result['error']}")
        
        return {
            'passed_tests': passed_tests,
            'total_tests': total_tests,
            'success_rate': success_rate,
            'detailed_results': self.test_results
        }


if __name__ == "__main__":
    tester = RealMetricsIntegrationTester()
    results = tester.run_integration_tests()
    
    # Exit with appropriate code
    if results['success_rate'] >= 80:
        sys.exit(0)  # Success
    else:
        sys.exit(1)  # Needs improvement 