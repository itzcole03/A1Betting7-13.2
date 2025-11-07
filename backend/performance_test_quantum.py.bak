#!/usr/bin/env python3
"""
Performance Testing Script for Quantum Ensemble
Tests prediction time, scalability, and verifies <2s response time requirement
"""

import time
import numpy as np
from ultra_accuracy_engine import UltraAccuracyEngine
import sys
import os

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

class PerformanceTester:
    def __init__(self):
        self.engine = UltraAccuracyEngine()
        self.results = {}
    
    def generate_betting_data(self, num_samples: int, num_features: int = 10):
        """Generate synthetic betting data for testing"""
        return np.random.rand(num_samples, num_features)
    
    def test_ensemble_creation_time(self):
        """Test time to create quantum ensemble"""
        print("Testing ensemble creation time...")
        start_time = time.time()
        ensemble = self.engine._create_quantum_ensemble()
        creation_time = time.time() - start_time
        
        self.results['ensemble_creation_time'] = creation_time
        print(f"✅ Ensemble creation time: {creation_time:.3f}s")
        return ensemble
    
    def test_prediction_performance(self, ensemble, data_sizes=[100, 500, 1000, 5000]):
        """Test prediction performance with various data sizes"""
        print("\nTesting prediction performance...")
        
        for size in data_sizes:
            # Generate test data
            X_train = self.generate_betting_data(size)
            y_train = np.random.rand(size)
            X_test = self.generate_betting_data(min(100, size // 10))
            
            # Test fit time
            start_time = time.time()
            ensemble.fit(X_train, y_train)
            fit_time = time.time() - start_time
            
            # Test prediction time
            start_time = time.time()
            predictions = ensemble.predict(X_test)
            predict_time = time.time() - start_time
            
            self.results[f'fit_time_{size}'] = fit_time
            self.results[f'predict_time_{size}'] = predict_time
            
            print(f"✅ Data size {size}: Fit={fit_time:.3f}s, Predict={predict_time:.3f}s")
            
            # Check <2s requirement for prediction
            if predict_time > 2.0:
                print(f"⚠️  WARNING: Prediction time {predict_time:.3f}s exceeds 2s requirement")
            else:
                print(f"✅ Prediction time {predict_time:.3f}s meets <2s requirement")
    
    def test_memory_usage(self, ensemble):
        """Test memory usage during operations"""
        print("\nTesting memory usage...")
        try:
            import psutil
            process = psutil.Process()
            
            # Baseline memory
            baseline_memory = process.memory_info().rss / 1024 / 1024  # MB
            
            # Memory during large data processing
            large_data = self.generate_betting_data(10000, 50)
            large_targets = np.random.rand(10000)
            
            ensemble.fit(large_data, large_targets)
            peak_memory = process.memory_info().rss / 1024 / 1024  # MB
            
            memory_usage = peak_memory - baseline_memory
            self.results['memory_usage_mb'] = memory_usage
            
            print(f"✅ Memory usage: {memory_usage:.1f} MB")
            
        except ImportError:
            print("⚠️  psutil not available, skipping memory test")
    
    def test_quantum_feature_transformation_performance(self):
        """Test performance of quantum feature transformation"""
        print("\nTesting quantum feature transformation performance...")
        
        # Test with various feature sizes
        for num_features in [10, 50, 100, 500]:
            features = self.generate_betting_data(1, num_features)[0]
            feature_dict = {f"feature_{i}": float(features[i]) for i in range(len(features))}
            
            start_time = time.time()
            transformed = self.engine._quantum_feature_transformation(feature_dict)
            transform_time = time.time() - start_time
            
            self.results[f'transform_time_{num_features}'] = transform_time
            print(f"✅ {num_features} features: Transform time={transform_time:.4f}s")
    
    def generate_report(self):
        """Generate performance report"""
        print("\n" + "="*60)
        print("PERFORMANCE VALIDATION REPORT")
        print("="*60)
        
        print(f"\n📊 TIMING RESULTS:")
        for key, value in self.results.items():
            if 'time' in key:
                print(f"  {key}: {value:.4f}s")
        
        print(f"\n💾 MEMORY RESULTS:")
        for key, value in self.results.items():
            if 'memory' in key:
                print(f"  {key}: {value:.1f} MB")
        
        print(f"\n✅ PERFORMANCE REQUIREMENTS CHECK:")
        
        # Check prediction time requirements
        prediction_times = [v for k, v in self.results.items() if 'predict_time' in k]
        if prediction_times:
            max_predict_time = max(prediction_times)
            if max_predict_time < 2.0:
                print(f"  ✅ Prediction time requirement (<2s): PASSED (max: {max_predict_time:.3f}s)")
            else:
                print(f"  ❌ Prediction time requirement (<2s): FAILED (max: {max_predict_time:.3f}s)")
        
        # Check ensemble creation time
        creation_time = self.results.get('ensemble_creation_time', 0)
        if creation_time < 5.0:  # Reasonable creation time
            print(f"  ✅ Ensemble creation time (<5s): PASSED ({creation_time:.3f}s)")
        else:
            print(f"  ⚠️  Ensemble creation time: {creation_time:.3f}s (consider optimization)")
        
        print(f"\n🎯 SCALABILITY RESULTS:")
        data_sizes = [100, 500, 1000, 5000]
        for size in data_sizes:
            fit_time = self.results.get(f'fit_time_{size}', 0)
            predict_time = self.results.get(f'predict_time_{size}', 0)
            print(f"  Data size {size}: Fit={fit_time:.3f}s, Predict={predict_time:.3f}s")

def main():
    """Run performance tests"""
    print("🚀 Starting Quantum Ensemble Performance Validation")
    print("="*60)
    
    tester = PerformanceTester()
    
    # Test ensemble creation
    ensemble = tester.test_ensemble_creation_time()
    
    # Test prediction performance
    tester.test_prediction_performance(ensemble)
    
    # Test memory usage
    tester.test_memory_usage(ensemble)
    
    # Test quantum feature transformation
    tester.test_quantum_feature_transformation_performance()
    
    # Generate final report
    tester.generate_report()
    
    print(f"\n✅ Performance validation complete!")

if __name__ == "__main__":
    main() 