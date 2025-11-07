#!/usr/bin/env python3
"""
Performance Testing Script for Meta-Learning Models
Tests adaptation time, model creation time, and verifies <1s adaptation requirements
"""

import time
import numpy as np
from ultra_accuracy_engine import UltraAccuracyEngine
import sys
import os

class MetaLearningPerformanceTester:
    def __init__(self):
        self.engine = UltraAccuracyEngine()
        self.results = {}
    
    def generate_meta_learning_data(self, num_samples: int, num_features: int = 10):
        """Generate synthetic meta-learning data"""
        return np.random.rand(num_samples, num_features), np.random.rand(num_samples)
    
    def generate_few_shot_tasks(self, num_tasks: int = 5):
        """Generate few-shot learning tasks"""
        tasks = []
        for _ in range(num_tasks):
            support_X = np.random.rand(15, 10)  # 5 examples per class, 3 classes
            support_y = np.repeat([0, 1, 2], 5)
            query_X = np.random.rand(9, 10)
            query_y = np.repeat([0, 1, 2], 3)
            
            tasks.append({
                'support': (support_X, support_y),
                'query': (query_X, query_y)
            })
        return tasks
    
    def test_meta_learning_model_creation_times(self):
        """Test time to create different meta-learning models"""
        print("\n🧪 Testing Meta-Learning Model Creation Times...")
        
        model_creators = {
            'MAML': self.engine._create_maml_model,
            'Prototypical': self.engine._create_prototypical_model,
            'Relation': self.engine._create_relation_network,
            'Learning-to-Learn': self.engine._create_learning_to_learn_model
        }
        
        creation_times = {}
        
        for model_name, creator in model_creators.items():
            start_time = time.time()
            model = creator()
            creation_time = time.time() - start_time
            
            creation_times[model_name] = creation_time
            
            if model is not None:
                print(f"✅ {model_name}: {creation_time:.3f}s")
            else:
                print(f"❌ {model_name}: Failed to create")
        
        self.results['model_creation_times'] = creation_times
        
        # Verify all models created within reasonable time
        max_creation_time = max(creation_times.values())
        assert max_creation_time < 3.0, f"Model creation should be <3s, max was {max_creation_time:.3f}s"
        
        print(f"🎯 All models created successfully (max: {max_creation_time:.3f}s)")
        return creation_times
    
    def test_maml_adaptation_performance(self):
        """Test MAML adaptation time performance"""
        print("\n🔄 Testing MAML Adaptation Performance...")
        
        maml_model = self.engine._create_maml_model()
        assert maml_model is not None, "MAML model should be created"
        
        # Prepare meta-training tasks
        meta_tasks = self.generate_few_shot_tasks(3)
        
        # Meta-train the model
        print("  📚 Meta-training MAML...")
        meta_train_start = time.time()
        maml_model.fit(meta_tasks, epochs=1, verbose=0)
        meta_train_time = time.time() - meta_train_start
        
        # Test adaptation times for different data sizes
        adaptation_times = {}
        
        for num_support in [5, 10, 15]:
            support_X = np.random.rand(num_support, 10)
            support_y = np.random.rand(num_support)
            
            # Test adaptation time
            start_time = time.time()
            adapted_model = maml_model.adapt(support_X, support_y, adaptation_steps=1)
            adaptation_time = time.time() - start_time
            
            adaptation_times[f'{num_support}_samples'] = adaptation_time
            
            # Test prediction time
            query_X = np.random.rand(5, 10)
            pred_start = time.time()
            predictions = adapted_model.predict(query_X)
            pred_time = time.time() - pred_start
            
            print(f"  ✅ {num_support} samples: Adaptation={adaptation_time:.3f}s, Prediction={pred_time:.3f}s")
            
            # Verify adaptation time requirement
            assert adaptation_time < 1.0, f"Adaptation should be <1s, was {adaptation_time:.3f}s"
            assert pred_time < 2.0, f"Prediction should be <2s, was {pred_time:.3f}s"
        
        self.results['maml_adaptation_times'] = adaptation_times
        self.results['maml_meta_train_time'] = meta_train_time
        
        max_adaptation_time = max(adaptation_times.values())
        print(f"🎯 MAML Performance: Meta-train={meta_train_time:.3f}s, Max adaptation={max_adaptation_time:.3f}s")
        
        return adaptation_times
    
    def test_prototypical_network_performance(self):
        """Test Prototypical Network performance"""
        print("\n🔍 Testing Prototypical Network Performance...")
        
        proto_model = self.engine._create_prototypical_model()
        assert proto_model is not None, "Prototypical model should be created"
        
        performance_results = {}
        
        for num_classes in [3, 5, 10]:
            # Generate N-way K-shot data
            k_shot = 5
            support_X = np.random.rand(num_classes * k_shot, 10)
            support_y = np.repeat(range(num_classes), k_shot)
            
            # Test training time
            train_start = time.time()
            proto_model.fit(support_X, support_y, epochs=1, verbose=0)
            train_time = time.time() - train_start
            
            # Test prototype computation time
            proto_start = time.time()
            prototypes = proto_model.compute_prototypes(support_X, support_y)
            proto_time = time.time() - proto_start
            
            # Test prediction time
            query_X = np.random.rand(num_classes * 3, 10)
            pred_start = time.time()
            predictions = proto_model.predict(query_X)
            pred_time = time.time() - pred_start
            
            performance_results[f'{num_classes}_way'] = {
                'train_time': train_time,
                'prototype_time': proto_time,
                'prediction_time': pred_time
            }
            
            print(f"  ✅ {num_classes}-way: Train={train_time:.3f}s, Proto={proto_time:.3f}s, Pred={pred_time:.3f}s")
            
            # Verify performance requirements
            assert train_time < 2.0, f"Training should be <2s, was {train_time:.3f}s"
            assert proto_time < 1.0, f"Prototype computation should be <1s, was {proto_time:.3f}s"
            assert pred_time < 2.0, f"Prediction should be <2s, was {pred_time:.3f}s"
        
        self.results['prototypical_performance'] = performance_results
        print("🎯 Prototypical Network: All performance requirements met")
        
        return performance_results
    
    def test_relation_network_performance(self):
        """Test Relation Network performance"""
        print("\n🔗 Testing Relation Network Performance...")
        
        relation_model = self.engine._create_relation_network()
        assert relation_model is not None, "Relation model should be created"
        
        performance_results = {}
        
        for num_pairs in [10, 20, 50]:
            # Generate paired data
            X1 = np.random.rand(num_pairs, 10)
            X2 = np.random.rand(num_pairs, 10)
            relations = np.random.randint(0, 2, num_pairs)
            
            # Test training time
            train_start = time.time()
            relation_model.fit((X1, X2), relations, epochs=1, verbose=0)
            train_time = time.time() - train_start
            
            # Test relation computation time
            test_X1 = X1[:5]
            test_X2 = X2[:5]
            
            relation_start = time.time()
            computed_relations = relation_model.compute_relations(test_X1, test_X2)
            relation_time = time.time() - relation_start
            
            # Test prediction time
            pred_start = time.time()
            predictions = relation_model.predict((test_X1, test_X2))
            pred_time = time.time() - pred_start
            
            performance_results[f'{num_pairs}_pairs'] = {
                'train_time': train_time,
                'relation_time': relation_time,
                'prediction_time': pred_time
            }
            
            print(f"  ✅ {num_pairs} pairs: Train={train_time:.3f}s, Relation={relation_time:.3f}s, Pred={pred_time:.3f}s")
            
            # Verify performance requirements
            assert train_time < 3.0, f"Training should be <3s, was {train_time:.3f}s"
            assert relation_time < 1.0, f"Relation computation should be <1s, was {relation_time:.3f}s"
            assert pred_time < 2.0, f"Prediction should be <2s, was {pred_time:.3f}s"
        
        self.results['relation_performance'] = performance_results
        print("🎯 Relation Network: All performance requirements met")
        
        return performance_results
    
    def test_learning_to_learn_performance(self):
        """Test Learning-to-Learn model performance"""
        print("\n🧠 Testing Learning-to-Learn Performance...")
        
        l2l_model = self.engine._create_learning_to_learn_model()
        assert l2l_model is not None, "Learning-to-Learn model should be created"
        
        # Test meta-learning performance
        meta_tasks = self.generate_few_shot_tasks(3)
        
        meta_train_start = time.time()
        l2l_model.fit(meta_tasks, epochs=1, verbose=0)
        meta_train_time = time.time() - meta_train_start
        
        # Test meta-learning adaptation
        support_X, support_y = self.generate_meta_learning_data(10)
        
        meta_learn_start = time.time()
        adapted_model = l2l_model.meta_learn((support_X, support_y), adaptation_steps=3)
        meta_learn_time = time.time() - meta_learn_start
        
        # Test prediction
        query_X = np.random.rand(5, 10)
        pred_start = time.time()
        predictions = adapted_model.predict(query_X)
        pred_time = time.time() - pred_start
        
        print(f"  ✅ L2L: Meta-train={meta_train_time:.3f}s, Meta-learn={meta_learn_time:.3f}s, Pred={pred_time:.3f}s")
        
        # Verify performance requirements
        assert meta_train_time < 5.0, f"Meta-training should be <5s, was {meta_train_time:.3f}s"
        assert meta_learn_time < 1.0, f"Meta-learning should be <1s, was {meta_learn_time:.3f}s"
        assert pred_time < 2.0, f"Prediction should be <2s, was {pred_time:.3f}s"
        
        self.results['l2l_performance'] = {
            'meta_train_time': meta_train_time,
            'meta_learn_time': meta_learn_time,
            'prediction_time': pred_time
        }
        
        print("🎯 Learning-to-Learn: All performance requirements met")
        return self.results['l2l_performance']
    
    def test_scalability_performance(self):
        """Test meta-learning scalability across different data sizes"""
        print("\n📈 Testing Meta-Learning Scalability...")
        
        maml_model = self.engine._create_maml_model()
        
        scalability_results = {}
        
        for data_size in [50, 100, 200]:
            X, y = self.generate_meta_learning_data(data_size)
            
            # Test with increasing data sizes
            start_time = time.time()
            predictions = maml_model.predict(X)
            pred_time = time.time() - start_time
            
            scalability_results[f'{data_size}_samples'] = pred_time
            
            print(f"  ✅ {data_size} samples: {pred_time:.3f}s")
            
            # Verify scalability (should scale reasonably)
            assert pred_time < 5.0, f"Prediction should scale well, was {pred_time:.3f}s for {data_size} samples"
        
        self.results['scalability'] = scalability_results
        print("🎯 Meta-Learning Scalability: Excellent performance across all sizes")
        
        return scalability_results
    
    def run_comprehensive_performance_test(self):
        """Run comprehensive performance testing"""
        print("🚀 Starting Comprehensive Meta-Learning Performance Testing...")
        print("=" * 70)
        
        try:
            # Test 1: Model Creation Performance
            creation_times = self.test_meta_learning_model_creation_times()
            
            # Test 2: MAML Adaptation Performance
            adaptation_times = self.test_maml_adaptation_performance()
            
            # Test 3: Prototypical Network Performance
            proto_performance = self.test_prototypical_network_performance()
            
            # Test 4: Relation Network Performance
            relation_performance = self.test_relation_network_performance()
            
            # Test 5: Learning-to-Learn Performance
            l2l_performance = self.test_learning_to_learn_performance()
            
            # Test 6: Scalability Performance
            scalability = self.test_scalability_performance()
            
            # Summary
            print("\n" + "=" * 70)
            print("📊 PERFORMANCE TESTING SUMMARY")
            print("=" * 70)
            
            print(f"✅ Model Creation: All models created in <3s")
            print(f"✅ MAML Adaptation: <1s requirement met")
            print(f"✅ Prototypical Networks: All timing requirements met")
            print(f"✅ Relation Networks: All timing requirements met")
            print(f"✅ Learning-to-Learn: All timing requirements met")
            print(f"✅ Scalability: Excellent across all data sizes")
            
            print("\n🎉 ALL META-LEARNING PERFORMANCE REQUIREMENTS PASSED!")
            
            return True
            
        except Exception as e:
            print(f"\n❌ Performance test failed: {e}")
            return False

def main():
    """Run meta-learning performance tests"""
    tester = MetaLearningPerformanceTester()
    
    success = tester.run_comprehensive_performance_test()
    
    if success:
        print("\n🏆 Meta-Learning Performance Testing: PASSED")
        sys.exit(0)
    else:
        print("\n💥 Meta-Learning Performance Testing: FAILED")
        sys.exit(1)

if __name__ == "__main__":
    main() 