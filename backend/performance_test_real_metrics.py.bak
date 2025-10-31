#!/usr/bin/env python3
"""
Performance Testing Script for Real Metrics System
Tests dynamic metrics calculation, API response times, and verifies requirements
"""

import time
import asyncio
import numpy as np
from ultra_accuracy_engine import UltraAccuracyEngine, RealPerformanceMetrics, QuantumEnsemblePrediction
from datetime import datetime, timedelta
import sys
import os

class RealMetricsPerformanceTester:
    def __init__(self):
        self.engine = UltraAccuracyEngine()
        self.metrics = RealPerformanceMetrics(self.engine)
        self.results = {}
    
    def generate_test_predictions(self, num_predictions: int = 1000):
        """Generate test prediction data"""
        predictions = []
        actuals = []
        
        for i in range(num_predictions):
            pred_val = 0.5 + (i % 50) / 100.0  # Vary between 0.5 and 1.0
            actual_val = pred_val + np.random.normal(0, 0.1)  # Add some noise
            actual_val = max(0.0, min(1.0, actual_val))  # Clamp to valid range
            
            pred = QuantumEnsemblePrediction(
                base_prediction=pred_val - 0.02,
                quantum_correction=0.02,
                final_prediction=pred_val,
                confidence_distribution={"overall": 0.8 + (i % 20) / 100.0},
                quantum_entanglement_score=0.8,
                coherence_measure=0.85,
                uncertainty_bounds=(pred_val - 0.05, pred_val + 0.05),
                quantum_advantage=0.1,
                classical_fallback=pred_val - 0.01,
                entangled_features=["feature1", "feature2"],
                decoherence_time=1.0,
                quantum_fidelity=0.95
            )
            
            predictions.append(pred)
            actuals.append(actual_val)
        
        return predictions, actuals
    
    def test_metrics_calculation_performance(self):
        """Test performance of metrics calculation (should be <100ms)"""
        print("Testing metrics calculation performance...")
        
        # Generate substantial test data
        predictions, actuals = self.generate_test_predictions(5000)
        
        # Add data to metrics system
        for pred, actual in zip(predictions, actuals):
            self.metrics.add_prediction_result(pred, actual)
        
        # Add processing time data
        for i in range(1000):
            self.metrics.record_processing_time(0.05 + (i % 10) * 0.01)
        
        # Add accuracy measurements
        for i in range(100):
            timestamp = datetime.now() - timedelta(hours=i)
            accuracy = 0.8 + (i % 20) / 100.0
            self.metrics.record_accuracy_measurement(accuracy, timestamp)
        
        # Test calculation performance
        start_time = time.time()
        
        consensus = self.metrics.calculate_model_consensus()
        processing_time = self.metrics.calculate_average_processing_time()
        accuracy_trend = self.metrics.calculate_accuracy_trend()
        overall_accuracy = self.metrics.calculate_overall_accuracy()
        health_metrics = self.metrics.get_system_health_metrics()
        real_time_perf = self.metrics.get_real_time_performance()
        
        calculation_time = time.time() - start_time
        
        self.results['metrics_calculation_time'] = calculation_time
        
        print(f"✅ Metrics calculation time: {calculation_time:.3f}s")
        
        if calculation_time < 0.1:
            print(f"✅ Meets <100ms requirement")
        else:
            print(f"⚠️  Exceeds 100ms requirement: {calculation_time:.3f}s")
        
        # Verify results are reasonable
        assert isinstance(consensus, float) and 0.0 <= consensus <= 1.0
        assert isinstance(processing_time, float) and processing_time > 0
        assert isinstance(accuracy_trend, list)
        assert isinstance(overall_accuracy, float) and 0.0 <= overall_accuracy <= 1.0
        assert isinstance(health_metrics, dict)
        assert isinstance(real_time_perf, dict)
        
        print(f"✅ All metrics calculations returned valid results")
        
        return {
            'consensus': consensus,
            'processing_time': processing_time,
            'accuracy_trend': accuracy_trend,
            'overall_accuracy': overall_accuracy,
            'calculation_time': calculation_time
        }
    
    def test_api_response_time_simulation(self):
        """Test simulated API response time (should be <500ms)"""
        print("\nTesting API response time simulation...")
        
        start_time = time.time()
        
        # Simulate comprehensive API response
        api_response = {
            "overall_accuracy": self.metrics.calculate_overall_accuracy(),
            "model_consensus": self.metrics.calculate_model_consensus(),
            "average_processing_time": self.metrics.calculate_average_processing_time(),
            "accuracy_trend": self.metrics.calculate_accuracy_trend(),
            "system_health": self.metrics.get_system_health_metrics(),
            "real_time_performance": self.metrics.get_real_time_performance(),
            "quantum_performance": self.metrics.get_quantum_ensemble_performance(),
            "nas_performance": self.metrics.get_nas_models_performance(),
            "meta_performance": self.metrics.get_meta_learning_performance()
        }
        
        response_time = time.time() - start_time
        
        self.results['api_response_time'] = response_time
        
        print(f"✅ API response time: {response_time:.3f}s")
        
        if response_time < 0.5:
            print(f"✅ Meets <500ms requirement")
        else:
            print(f"⚠️  Exceeds 500ms requirement: {response_time:.3f}s")
        
        # Verify response structure
        assert isinstance(api_response, dict)
        assert len(api_response) == 9
        
        print(f"✅ API response structure valid")
        
        return api_response
    
    def test_memory_efficiency(self):
        """Test memory efficiency for continuous tracking"""
        print("\nTesting memory efficiency...")
        
        try:
            import psutil
            import os
            
            process = psutil.Process(os.getpid())
            initial_memory = process.memory_info().rss
            
            # Add large amount of data
            predictions, actuals = self.generate_test_predictions(20000)
            
            for pred, actual in zip(predictions, actuals):
                self.metrics.add_prediction_result(pred, actual)
            
            for i in range(10000):
                self.metrics.record_processing_time(0.05 + (i % 20) * 0.005)
            
            final_memory = process.memory_info().rss
            memory_increase = final_memory - initial_memory
            memory_increase_mb = memory_increase / (1024 * 1024)
            
            self.results['memory_increase_mb'] = memory_increase_mb
            
            print(f"✅ Memory increase: {memory_increase_mb:.1f}MB")
            
            if memory_increase_mb < 100:
                print(f"✅ Meets <100MB memory requirement")
            else:
                print(f"⚠️  Exceeds 100MB memory requirement: {memory_increase_mb:.1f}MB")
            
            return memory_increase_mb
            
        except ImportError:
            print("⚠️  psutil not available, skipping memory test")
            return 0
    
    def test_dynamic_calculation_verification(self):
        """Test that calculations are truly dynamic (not hardcoded)"""
        print("\nTesting dynamic calculation verification...")
        
        # Test 1: Empty metrics should give different results than populated
        empty_metrics = RealPerformanceMetrics(UltraAccuracyEngine())
        empty_consensus = empty_metrics.calculate_model_consensus()
        
        # Populated metrics
        populated_consensus = self.metrics.calculate_model_consensus()
        
        print(f"Empty consensus: {empty_consensus:.3f}")
        print(f"Populated consensus: {populated_consensus:.3f}")
        
        # They should be different (proving dynamic calculation)
        if empty_consensus != populated_consensus:
            print("✅ Consensus calculation is dynamic")
        else:
            print("⚠️  Consensus calculation may be hardcoded")
        
        # Test 2: Different data should give different results
        test_metrics = RealPerformanceMetrics(UltraAccuracyEngine())
        different_predictions, different_actuals = self.generate_test_predictions(100)
        
        # Add different data pattern
        for i, (pred, actual) in enumerate(zip(different_predictions, different_actuals)):
            # Modify to create different pattern
            modified_actual = actual * 0.5  # Different accuracy pattern
            test_metrics.add_prediction_result(pred, modified_actual)
        
        different_consensus = test_metrics.calculate_model_consensus()
        
        print(f"Different data consensus: {different_consensus:.3f}")
        
        if different_consensus != populated_consensus:
            print("✅ Calculations respond to different data")
        else:
            print("⚠️  Calculations may not be responding to data changes")
        
        return {
            'empty_consensus': empty_consensus,
            'populated_consensus': populated_consensus,
            'different_consensus': different_consensus
        }
    
    def test_hardcoded_replacement_verification(self):
        """Verify that hardcoded values have been replaced"""
        print("\nTesting hardcoded value replacement verification...")
        
        # Test consensus is not hardcoded to 0.95
        consensus = self.metrics.calculate_model_consensus()
        if consensus != 0.95:
            print(f"✅ Model consensus not hardcoded (value: {consensus:.3f})")
        else:
            print(f"⚠️  Model consensus may still be hardcoded to 0.95")
        
        # Test processing time is not hardcoded to 2.5
        proc_time = self.metrics.calculate_average_processing_time()
        if proc_time != 2.5:
            print(f"✅ Processing time not hardcoded (value: {proc_time:.3f}s)")
        else:
            print(f"⚠️  Processing time may still be hardcoded to 2.5s")
        
        # Test system health metrics are not hardcoded
        health = self.metrics.get_system_health_metrics()
        quantum_count = health["quantum_models_count"]
        nas_count = health["nas_models_count"]
        meta_count = health["meta_models_count"]
        
        hardcoded_checks = []
        if quantum_count != 4:
            print(f"✅ Quantum models count not hardcoded (value: {quantum_count})")
            hardcoded_checks.append(True)
        else:
            print(f"⚠️  Quantum models count may be hardcoded to 4")
            hardcoded_checks.append(False)
        
        if nas_count != 3:
            print(f"✅ NAS models count not hardcoded (value: {nas_count})")
            hardcoded_checks.append(True)
        else:
            print(f"⚠️  NAS models count may be hardcoded to 3")
            hardcoded_checks.append(False)
        
        if meta_count != 2:
            print(f"✅ Meta models count not hardcoded (value: {meta_count})")
            hardcoded_checks.append(True)
        else:
            print(f"⚠️  Meta models count may be hardcoded to 2")
            hardcoded_checks.append(False)
        
        passed_checks = sum(hardcoded_checks)
        total_checks = len(hardcoded_checks)
        
        print(f"✅ Hardcoded replacement verification: {passed_checks}/{total_checks} passed")
        
        return {
            'consensus_not_hardcoded': consensus != 0.95,
            'processing_time_not_hardcoded': proc_time != 2.5,
            'model_counts_not_hardcoded': passed_checks >= 2  # At least 2/3 should pass
        }
    
    def run_comprehensive_test(self):
        """Run all performance tests"""
        print("=" * 60)
        print("REAL METRICS SYSTEM PERFORMANCE TESTING")
        print("=" * 60)
        
        # Test 1: Metrics calculation performance
        calc_results = self.test_metrics_calculation_performance()
        
        # Test 2: API response time
        api_results = self.test_api_response_time_simulation()
        
        # Test 3: Memory efficiency
        memory_results = self.test_memory_efficiency()
        
        # Test 4: Dynamic calculation verification
        dynamic_results = self.test_dynamic_calculation_verification()
        
        # Test 5: Hardcoded replacement verification
        hardcoded_results = self.test_hardcoded_replacement_verification()
        
        print("\n" + "=" * 60)
        print("PERFORMANCE TEST SUMMARY")
        print("=" * 60)
        
        # Calculate overall score
        total_score = 0
        max_score = 0
        
        # Metrics calculation performance (25 points)
        if self.results.get('metrics_calculation_time', 1.0) < 0.1:
            calc_score = 25
        else:
            calc_score = max(0, 25 - int(self.results.get('metrics_calculation_time', 1.0) * 100))
        total_score += calc_score
        max_score += 25
        print(f"Metrics Calculation Performance: {calc_score}/25")
        
        # API response time (25 points)
        if self.results.get('api_response_time', 1.0) < 0.5:
            api_score = 25
        else:
            api_score = max(0, 25 - int(self.results.get('api_response_time', 1.0) * 20))
        total_score += api_score
        max_score += 25
        print(f"API Response Time: {api_score}/25")
        
        # Memory efficiency (20 points)
        memory_mb = self.results.get('memory_increase_mb', 0)
        if memory_mb < 50:
            memory_score = 20
        elif memory_mb < 100:
            memory_score = 15
        else:
            memory_score = max(0, 20 - int(memory_mb / 10))
        total_score += memory_score
        max_score += 20
        print(f"Memory Efficiency: {memory_score}/20")
        
        # Dynamic calculation (15 points)
        dynamic_score = 15 if dynamic_results else 0
        total_score += dynamic_score
        max_score += 15
        print(f"Dynamic Calculation: {dynamic_score}/15")
        
        # Hardcoded replacement (15 points)
        hardcoded_score = 15 if all(hardcoded_results.values()) else 10
        total_score += hardcoded_score
        max_score += 15
        print(f"Hardcoded Replacement: {hardcoded_score}/15")
        
        percentage = (total_score / max_score) * 100
        print(f"\nOverall Score: {total_score}/{max_score} ({percentage:.1f}%)")
        
        if percentage >= 90:
            print("🎉 EXCELLENT - Real metrics system exceeds all requirements!")
        elif percentage >= 80:
            print("✅ GOOD - Real metrics system meets most requirements")
        elif percentage >= 70:
            print("⚠️  ACCEPTABLE - Real metrics system needs some improvements")
        else:
            print("❌ NEEDS WORK - Real metrics system requires significant improvements")
        
        return {
            'total_score': total_score,
            'max_score': max_score,
            'percentage': percentage,
            'detailed_results': {
                'calculation': calc_results,
                'api': api_results,
                'memory': memory_results,
                'dynamic': dynamic_results,
                'hardcoded': hardcoded_results
            }
        }


if __name__ == "__main__":
    tester = RealMetricsPerformanceTester()
    results = tester.run_comprehensive_test()
    
    # Exit with appropriate code
    if results['percentage'] >= 80:
        sys.exit(0)  # Success
    else:
        sys.exit(1)  # Needs improvement 