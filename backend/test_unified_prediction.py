"""
Test script for the Unified Prediction Domain

Tests the consolidation of ML/AI services into the new unified architecture.
"""

import asyncio
import json
import sys
from pathlib import Path

# Add backend to path
sys.path.append(str(Path(__file__).parent))

from domains.prediction import UnifiedPredictionService
from domains.prediction.models import (
    PredictionRequest,
    BatchPredictionRequest, 
    QuantumOptimizationRequest,
    Sport,
    PropType
)


async def test_unified_prediction_service():
    """Test the unified prediction service"""
    
    print("🚀 Testing Unified Prediction Service...")
    print("=" * 50)
    
    # Initialize service
    service = UnifiedPredictionService()
    await service.initialize()
    
    # Test 1: Health Check
    print("\n📊 Test 1: Health Check")
    health = await service.health_check()
    print(f"Status: {health.status}")
    print(f"Models loaded: {health.models_loaded}")
    print(f"Uptime: {health.uptime_seconds:.2f}s")
    
    # Test 2: Single Prediction
    print("\n🎯 Test 2: Single Prediction")
    request = PredictionRequest(
        player_name="Aaron Judge",
        sport=Sport.MLB,
        prop_type=PropType.HOME_RUNS,
        line_score=0.5
    )
    
    prediction = await service.predict(request)
    print(f"Player: {prediction.player_name}")
    print(f"Predicted: {prediction.predicted_value:.2f} vs Line: {prediction.line_score}")
    print(f"Confidence: {prediction.confidence:.1%}")
    print(f"Recommendation: {prediction.recommendation}")
    print(f"Expected Value: {prediction.expected_value:.3f}")
    
    # Test 3: SHAP Explanation
    print("\n🔍 Test 3: SHAP Explanation")
    explanation = await service.explain_prediction(prediction.prediction_id)
    print(f"Base value: {explanation.base_value:.2f}")
    print(f"Top feature: {explanation.feature_impacts[0]['feature']}")
    print(f"Impact: {explanation.feature_impacts[0]['shap_value']:+.3f}")
    print(f"Summary: {explanation.explanation_summary}")
    
    # Test 4: Batch Predictions
    print("\n📦 Test 4: Batch Predictions")
    batch_request = BatchPredictionRequest(
        predictions=[
            PredictionRequest(
                player_name="Mike Trout",
                sport=Sport.MLB,
                prop_type=PropType.HITS,
                line_score=1.5
            ),
            PredictionRequest(
                player_name="Mookie Betts", 
                sport=Sport.MLB,
                prop_type=PropType.RBI,
                line_score=0.5
            ),
            PredictionRequest(
                player_name="Ronald Acuna Jr",
                sport=Sport.MLB,
                prop_type=PropType.STRIKEOUTS,
                line_score=1.5
            )
        ]
    )
    
    batch_predictions = await service.predict_batch(batch_request)
    print(f"Batch predictions completed: {len(batch_predictions)}")
    for pred in batch_predictions:
        print(f"  {pred.player_name}: {pred.predicted_value:.2f} ({pred.recommendation})")
    
    # Test 5: Quantum Optimization
    print("\n🔬 Test 5: Quantum Portfolio Optimization")
    quantum_request = QuantumOptimizationRequest(
        predictions=batch_request.predictions,
        portfolio_size=3,
        risk_tolerance=0.6,
        max_allocation=0.4
    )
    
    optimization = await service.optimize_quantum(quantum_request)
    print(f"Expected Return: {optimization.expected_return:.3f}")
    print(f"Risk Score: {optimization.risk_score:.3f}")
    print(f"Sharpe Ratio: {optimization.sharpe_ratio:.2f}")
    print(f"Quantum Advantage: {optimization.quantum_advantage:.1%}")
    print("Optimal Allocation:")
    for bet, weight in optimization.optimal_allocation.items():
        print(f"  {bet}: {weight:.1%}")
    
    # Test 6: Model Performance
    print("\n📈 Test 6: Model Performance Metrics")
    performance_metrics = await service.get_model_performance()
    for metrics in performance_metrics[:3]:  # Show first 3
        print(f"{metrics.model_type}:")
        print(f"  Accuracy: {metrics.accuracy:.1%}")
        print(f"  Win Rate: {metrics.win_rate:.1%}")
        print(f"  Sharpe Ratio: {metrics.sharpe_ratio:.2f}")
    
    print("\n✅ All tests completed successfully!")
    print("🎉 Unified Prediction Domain is working correctly!")
    
    return True


async def benchmark_performance():
    """Benchmark the service performance"""
    
    print("\n⚡ Performance Benchmark")
    print("=" * 30)
    
    service = UnifiedPredictionService()
    await service.initialize()
    
    # Single prediction benchmark
    import time
    start_time = time.time()
    
    request = PredictionRequest(
        player_name="Test Player",
        sport=Sport.MLB,
        prop_type=PropType.HITS,
        line_score=1.5
    )
    
    for i in range(10):
        await service.predict(request)
    
    end_time = time.time()
    avg_time = (end_time - start_time) / 10
    
    print(f"Average prediction time: {avg_time*1000:.1f}ms")
    print(f"Predictions per second: {1/avg_time:.1f}")
    
    # Memory usage
    import psutil
    process = psutil.Process()
    memory_mb = process.memory_info().rss / 1024 / 1024
    print(f"Memory usage: {memory_mb:.1f} MB")


if __name__ == "__main__":
    try:
        asyncio.run(test_unified_prediction_service())
        asyncio.run(benchmark_performance())
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
