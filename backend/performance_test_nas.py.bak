#!/usr/bin/env python3
"""
Performance Testing Script for NAS Models
Tests architecture search time, model creation time, and verifies <3s requirements
"""

import time
import numpy as np
from ultra_accuracy_engine import UltraAccuracyEngine
import sys
import os

class NASPerformanceTester:
    def __init__(self):
        self.engine = UltraAccuracyEngine()
        self.results = {}
    
    def generate_nas_data(self, num_samples: int, num_features: int = 10):
        """Generate synthetic NAS training data"""
        return np.random.rand(num_samples, num_features)
    
    def test_nas_model_creation_times(self):
        """Test time to create different NAS models"""
        print("Testing NAS model creation times...")
        
        nas_models = [
            ("NAS Optimal", self.engine._create_nas_optimal_model),
            ("AutoML", self.engine._create_automl_model),
            ("Progressive NAS", self.engine._create_progressive_nas_model),
            ("EfficientNet", self.engine._create_efficient_net_model)
        ]
        
        for name, creator in nas_models:
            start_time = time.time()
            model = creator()
            creation_time = time.time() - start_time
            
            self.results[f'{name.lower().replace(" ", "_")}_creation_time'] = creation_time
            
            if model is not None:
                print(f"✅ {name}: Created in {creation_time:.3f}s")
                
                # Check <3s requirement for architecture search
                if creation_time < 3.0:
                    print(f"✅ {name} meets <3s requirement")
                else:
                    print(f"⚠️  {name} exceeds 3s requirement: {creation_time:.3f}s")
            else:
                print(f"❌ {name}: Failed to create")
        
        return nas_models
    
    def test_nas_training_performance(self, models, data_sizes=[100, 500, 1000]):
        """Test NAS model training performance"""
        print("\nTesting NAS training performance...")
        
        for size in data_sizes:
            print(f"\n--- Data size: {size} samples ---")
            X_train = self.generate_nas_data(size)
            y_train = np.random.rand(size)
            X_test = self.generate_nas_data(min(50, size // 10))
            
            for name, creator in models:
                model = creator()
                if model is None:
                    continue
                
                # Test training time
                start_time = time.time()
                try:
                    model.fit(X_train, y_train, epochs=1, verbose=0)
                    training_time = time.time() - start_time
                    
                    # Test prediction time
                    start_time = time.time()
                    predictions = model.predict(X_test, verbose=0)
                    prediction_time = time.time() - start_time
                    
                    self.results[f'{name.lower().replace(" ", "_")}_train_time_{size}'] = training_time
                    self.results[f'{name.lower().replace(" ", "_")}_predict_time_{size}'] = prediction_time
                    
                    print(f"✅ {name}: Train={training_time:.3f}s, Predict={prediction_time:.3f}s")
                    
                    # Check prediction time requirement
                    if prediction_time < 2.0:
                        print(f"✅ {name} prediction time meets <2s requirement")
                    else:
                        print(f"⚠️  {name} prediction time exceeds 2s: {prediction_time:.3f}s")
                        
                except Exception as e:
                    print(f"❌ {name}: Training failed - {str(e)[:50]}...")
    
    def test_nas_architecture_search_efficiency(self):
        """Test efficiency of architecture search process"""
        print("\nTesting NAS architecture search efficiency...")
        
        # Test multiple architecture searches
        X_train = self.generate_nas_data(200, 10)
        y_train = np.random.rand(200)
        
        search_times = []
        
        for i in range(3):  # Test 3 architecture searches
            start_time = time.time()
            
            # Create and train a new NAS model (simulating architecture search)
            nas_model = self.engine._create_nas_optimal_model()
            progressive_model = self.engine._create_progressive_nas_model()
            
            if nas_model and progressive_model:
                try:
                    nas_model.fit(X_train, y_train, epochs=1, verbose=0)
                    progressive_model.fit(X_train, y_train, epochs=1, verbose=0)
                    
                    search_time = time.time() - start_time
                    search_times.append(search_time)
                    
                    print(f"✅ Architecture search {i+1}: {search_time:.3f}s")
                    
                except Exception as e:
                    print(f"❌ Architecture search {i+1} failed: {str(e)[:50]}...")
        
        if search_times:
            avg_search_time = np.mean(search_times)
            max_search_time = np.max(search_times)
            
            self.results['avg_architecture_search_time'] = avg_search_time
            self.results['max_architecture_search_time'] = max_search_time
            
            print(f"\n📊 Architecture Search Summary:")
            print(f"  Average time: {avg_search_time:.3f}s")
            print(f"  Maximum time: {max_search_time:.3f}s")
            
            if max_search_time < 3.0:
                print(f"✅ All architecture searches meet <3s requirement")
            else:
                print(f"⚠️  Some architecture searches exceed 3s requirement")
    
    def test_nas_memory_usage(self):
        """Test memory usage during NAS operations"""
        print("\nTesting NAS memory usage...")
        
        try:
            import psutil
            process = psutil.Process()
            
            # Baseline memory
            baseline_memory = process.memory_info().rss / 1024 / 1024  # MB
            
            # Memory during NAS model creation and training
            models = [
                self.engine._create_nas_optimal_model(),
                self.engine._create_automl_model(),
                self.engine._create_progressive_nas_model(),
                self.engine._create_efficient_net_model()
            ]
            
            # Train models with larger dataset
            large_data = self.generate_nas_data(2000, 15)
            large_targets = np.random.rand(2000)
            
            for i, model in enumerate(models):
                if model is not None:
                    try:
                        model.fit(large_data, large_targets, epochs=1, verbose=0)
                    except Exception:
                        pass  # Continue with memory measurement
            
            peak_memory = process.memory_info().rss / 1024 / 1024  # MB
            memory_usage = peak_memory - baseline_memory
            
            self.results['nas_memory_usage_mb'] = memory_usage
            print(f"✅ NAS memory usage: {memory_usage:.1f} MB")
            
        except ImportError:
            print("⚠️  psutil not available, skipping memory test")
    
    def test_nas_scalability(self):
        """Test NAS model scalability with different data sizes"""
        print("\nTesting NAS scalability...")
        
        data_sizes = [100, 500, 1000, 2000, 5000]
        nas_model = self.engine._create_nas_optimal_model()
        
        if nas_model is None:
            print("❌ Cannot test scalability - NAS model creation failed")
            return
        
        for size in data_sizes:
            X_train = self.generate_nas_data(size, 10)
            y_train = np.random.rand(size)
            
            start_time = time.time()
            try:
                nas_model.fit(X_train, y_train, epochs=1, verbose=0)
                training_time = time.time() - start_time
                
                # Test prediction scalability
                X_test = self.generate_nas_data(size // 10, 10)
                start_time = time.time()
                predictions = nas_model.predict(X_test, verbose=0)
                prediction_time = time.time() - start_time
                
                self.results[f'scalability_train_{size}'] = training_time
                self.results[f'scalability_predict_{size}'] = prediction_time
                
                print(f"✅ Size {size}: Train={training_time:.3f}s, Predict={prediction_time:.3f}s")
                
            except Exception as e:
                print(f"❌ Size {size}: Failed - {str(e)[:50]}...")
    
    def generate_performance_report(self):
        """Generate comprehensive NAS performance report"""
        print("\n" + "="*60)
        print("NAS PERFORMANCE VALIDATION REPORT")
        print("="*60)
        
        print(f"\n📊 MODEL CREATION TIMES:")
        creation_times = {k: v for k, v in self.results.items() if 'creation_time' in k}
        for key, value in creation_times.items():
            model_name = key.replace('_creation_time', '').replace('_', ' ').title()
            print(f"  {model_name}: {value:.4f}s")
        
        print(f"\n⚡ TRAINING PERFORMANCE:")
        train_times = {k: v for k, v in self.results.items() if 'train_time' in k}
        for key, value in train_times.items():
            print(f"  {key}: {value:.4f}s")
        
        print(f"\n🎯 PREDICTION PERFORMANCE:")
        predict_times = {k: v for k, v in self.results.items() if 'predict_time' in k}
        for key, value in predict_times.items():
            print(f"  {key}: {value:.4f}s")
        
        print(f"\n💾 MEMORY USAGE:")
        memory_usage = self.results.get('nas_memory_usage_mb', 0)
        if memory_usage > 0:
            print(f"  NAS Memory Usage: {memory_usage:.1f} MB")
        else:
            print("  Memory usage data not available")
        
        print(f"\n🔍 ARCHITECTURE SEARCH PERFORMANCE:")
        avg_search = self.results.get('avg_architecture_search_time', 0)
        max_search = self.results.get('max_architecture_search_time', 0)
        if avg_search > 0:
            print(f"  Average search time: {avg_search:.3f}s")
            print(f"  Maximum search time: {max_search:.3f}s")
        
        print(f"\n✅ PERFORMANCE REQUIREMENTS CHECK:")
        
        # Check model creation time requirements
        creation_times_list = list(creation_times.values())
        if creation_times_list:
            max_creation_time = max(creation_times_list)
            if max_creation_time < 3.0:
                print(f"  ✅ Model creation time (<3s): PASSED (max: {max_creation_time:.3f}s)")
            else:
                print(f"  ❌ Model creation time (<3s): FAILED (max: {max_creation_time:.3f}s)")
        
        # Check prediction time requirements
        prediction_times_list = list(predict_times.values())
        if prediction_times_list:
            max_predict_time = max(prediction_times_list)
            if max_predict_time < 2.0:
                print(f"  ✅ Prediction time (<2s): PASSED (max: {max_predict_time:.3f}s)")
            else:
                print(f"  ⚠️  Prediction time: {max_predict_time:.3f}s (consider optimization)")
        
        # Check architecture search requirements
        if max_search > 0:
            if max_search < 3.0:
                print(f"  ✅ Architecture search time (<3s): PASSED (max: {max_search:.3f}s)")
            else:
                print(f"  ❌ Architecture search time (<3s): FAILED (max: {max_search:.3f}s)")
        
        print(f"\n🎯 SCALABILITY RESULTS:")
        scalability_results = {k: v for k, v in self.results.items() if 'scalability' in k}
        if scalability_results:
            for key, value in scalability_results.items():
                print(f"  {key}: {value:.3f}s")
        else:
            print("  No scalability data available")

def main():
    """Run NAS performance tests"""
    print("🚀 Starting NAS Performance Validation")
    print("="*60)
    
    tester = NASPerformanceTester()
    
    # Test model creation times
    models = tester.test_nas_model_creation_times()
    
    # Test training performance
    tester.test_nas_training_performance(models)
    
    # Test architecture search efficiency
    tester.test_nas_architecture_search_efficiency()
    
    # Test memory usage
    tester.test_nas_memory_usage()
    
    # Test scalability
    tester.test_nas_scalability()
    
    # Generate final report
    tester.generate_performance_report()
    
    print(f"\n✅ NAS performance validation complete!")

if __name__ == "__main__":
    main() 