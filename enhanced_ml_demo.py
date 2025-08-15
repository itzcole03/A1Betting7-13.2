"""
Enhanced ML Integration Demo

This script demonstrates how to integrate the new enhanced ML capabilities 
(SHAP explainability, batch optimization, performance logging) with existing
prediction engines like BestBetSelector and FinalPredictionEngine.
"""

import asyncio
import logging
import random
import time
from typing import Dict, List, Any

# Enhanced ML integration
from backend.services.enhanced_prediction_integration import enhanced_prediction_integration

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class MockPredictionEngine:
    """Mock prediction engine to demonstrate integration"""
    
    def __init__(self, name: str):
        self.name = name
    
    def predict(self, features: Dict[str, float]) -> Dict[str, Any]:
        """Mock prediction method"""
        # Simulate prediction logic
        prediction = random.uniform(0.3, 0.7)
        confidence = random.uniform(0.6, 0.95)
        
        return {
            'prediction': prediction,
            'confidence': confidence,
            'model_name': self.name,
            'features_used': list(features.keys())
        }
    
    def predict_batch(self, feature_list: List[Dict[str, float]]) -> List[float]:
        """Mock batch prediction method"""
        return [random.uniform(0.3, 0.7) for _ in feature_list]


async def demo_enhanced_ml_integration():
    """Demonstrate enhanced ML capabilities"""
    
    print("🚀 Enhanced ML Integration Demo")
    print("=" * 50)
    
    # Initialize services
    print("\n1. Initializing Enhanced ML Services...")
    await enhanced_prediction_integration.initialize_services()
    print("✅ Services initialized")
    
    # Create mock models
    best_bet_model = MockPredictionEngine("BestBetSelector_v1")
    final_prediction_model = MockPredictionEngine("FinalPredictionEngine_v1")
    
    # Register models
    print("\n2. Registering Models...")
    success1 = enhanced_prediction_integration.register_prediction_model(
        model_name="BestBetSelector_v1",
        model=best_bet_model,
        sport="MLB",
        model_type="xgboost",
        batch_predict_fn=best_bet_model.predict_batch
    )
    
    success2 = enhanced_prediction_integration.register_prediction_model(
        model_name="FinalPredictionEngine_v1", 
        model=final_prediction_model,
        sport="MLB",
        model_type="xgboost",
        batch_predict_fn=final_prediction_model.predict_batch
    )
    
    print(f"✅ BestBetSelector registered: {success1}")
    print(f"✅ FinalPredictionEngine registered: {success2}")
    
    # Demo single enhanced prediction
    print("\n3. Enhanced Single Prediction...")
    single_result = await enhanced_prediction_integration.enhanced_predict_single(
        request_id="demo_001",
        event_id="mlb_game_12345", 
        sport="MLB",
        bet_type="over_under",
        features={
            "team_avg_runs": 4.8,
            "pitcher_era": 3.45,
            "weather_temp": 75.0,
            "wind_speed": 8.2,
            "home_field_advantage": 0.15
        },
        models=["BestBetSelector_v1", "FinalPredictionEngine_v1"],
        include_explanations=True
    )
    
    print(f"Single Prediction Result:")
    print(f"  Prediction: {single_result.get('prediction', 'N/A'):.4f}")
    print(f"  Confidence: {single_result.get('confidence', 'N/A'):.4f}")
    print(f"  Processing Time: {single_result.get('processing_time', 'N/A'):.3f}s")
    print(f"  Cache Hit: {single_result.get('cache_hit', False)}")
    print(f"  Has SHAP Explanations: {'shap_explanations' in single_result}")
    
    # Demo batch enhanced predictions
    print("\n4. Enhanced Batch Predictions...")
    batch_requests = []
    
    for i in range(5):
        request = {
            'request_id': f"batch_demo_{i:03d}",
            'event_id': f"mlb_game_{12345 + i}",
            'sport': "MLB",
            'bet_type': "over_under" if i % 2 == 0 else "moneyline",
            'features': {
                "team_avg_runs": random.uniform(3.5, 6.2),
                "pitcher_era": random.uniform(2.8, 4.5),
                "weather_temp": random.uniform(65, 85),
                "wind_speed": random.uniform(2, 15),
                "home_field_advantage": random.uniform(-0.1, 0.3)
            },
            'models': ["BestBetSelector_v1", "FinalPredictionEngine_v1"],
            'priority': random.randint(1, 3)
        }
        batch_requests.append(request)
    
    batch_start = time.time()
    batch_results = await enhanced_prediction_integration.enhanced_predict(
        prediction_requests=batch_requests,
        include_explanations=True
    )
    batch_time = time.time() - batch_start
    
    print(f"Batch Processing Results:")
    print(f"  Requests: {len(batch_requests)}")
    print(f"  Total Time: {batch_time:.3f}s")
    print(f"  Avg Time per Request: {batch_time / len(batch_requests):.3f}s")
    print(f"  Cache Hits: {sum(1 for r in batch_results if r.get('cache_hit', False))}")
    print(f"  Errors: {sum(1 for r in batch_results if r.get('error'))}")
    
    # Simulate some prediction outcomes for performance tracking
    print("\n5. Logging Prediction Outcomes...")
    for i, result in enumerate(batch_results[:3]):
        # Simulate actual outcomes
        actual_outcome = random.choice([0.0, 1.0])  # Binary outcome
        outcome_status = "correct" if abs(result['prediction'] - actual_outcome) < 0.5 else "incorrect"
        
        success = enhanced_prediction_integration.log_prediction_outcome(
            prediction_id=result['request_id'],
            actual_outcome=actual_outcome,
            outcome_status=outcome_status
        )
        
        print(f"  Outcome logged for {result['request_id']}: {outcome_status} ({success})")
    
    # Wait a moment for performance aggregation
    await asyncio.sleep(2)
    
    # Show performance summaries
    print("\n6. Performance Summaries...")
    
    # Get performance for BestBetSelector
    best_bet_performance = enhanced_prediction_integration.get_performance_summary(
        model_name="BestBetSelector_v1",
        sport="MLB", 
        bet_type="over_under"
    )
    
    if best_bet_performance:
        print(f"BestBetSelector Performance:")
        print(f"  Accuracy: {best_bet_performance.get('accuracy', 0):.3f}")
        print(f"  Confidence: {best_bet_performance.get('confidence', 0):.3f}")
        print(f"  Total Predictions: {best_bet_performance.get('total_predictions', 0)}")
        print(f"  Trend: {best_bet_performance.get('recent_trend', 'unknown')}")
    
    # Model comparison
    comparison = enhanced_prediction_integration.get_model_comparison(
        sport="MLB",
        bet_type="over_under"
    )
    
    if comparison:
        print(f"Model Comparison (MLB over_under):")
        for model_name, metrics in comparison.items():
            print(f"  {model_name}: accuracy={metrics.get('accuracy', 0):.3f}, roi={metrics.get('roi', 0):.3f}")
    
    # Show batch performance stats
    print("\n7. Batch Performance Statistics...")
    batch_stats = enhanced_prediction_integration.get_batch_performance_stats()
    
    print(f"Batch Processing Stats:")
    batch_data = batch_stats.get('batch_stats', {})
    print(f"  Total Requests: {batch_data.get('total_requests', 0)}")
    print(f"  Total Batches: {batch_data.get('total_batches', 0)}")
    print(f"  Avg Batch Size: {batch_data.get('avg_batch_size', 0):.1f}")
    print(f"  Avg Processing Time: {batch_data.get('avg_processing_time', 0):.3f}s")
    print(f"  Cache Hit Rate: {batch_data.get('cache_hit_rate', 0):.3f}")
    print(f"  Throughput: {batch_data.get('throughput_per_second', 0):.1f} req/sec")
    
    # Show recent alerts
    print("\n8. Performance Alerts...")
    alerts = enhanced_prediction_integration.get_recent_alerts(limit=5)
    
    if alerts:
        print(f"Recent Alerts ({len(alerts)}):")
        for alert in alerts:
            print(f"  {alert.get('level', 'unknown').upper()}: {alert.get('message', 'No message')}")
    else:
        print("  No recent alerts")
    
    # Health check
    print("\n9. System Health Check...")
    health_status = await enhanced_prediction_integration.health_check()
    
    print(f"Overall Health: {health_status.get('overall_status', 'unknown').upper()}")
    
    services = health_status.get('services', {})
    for service_name, service_health in services.items():
        status = service_health.get('status', 'unknown')
        print(f"  {service_name}: {status.upper()}")
    
    print("\n✅ Demo completed successfully!")
    
    # Cleanup
    print("\n10. Shutting down services...")
    await enhanced_prediction_integration.shutdown_services()
    print("✅ Services shut down")


async def demo_integration_with_existing_engines():
    """Show how to integrate with existing prediction engines"""
    
    print("\n" + "=" * 50)
    print("🔧 Integration with Existing Prediction Engines")
    print("=" * 50)
    
    # Mock existing prediction function
    async def existing_best_bet_selector(game_id: str, features: Dict[str, float]) -> Dict[str, Any]:
        """Mock existing BestBetSelector function"""
        # Simulate existing prediction logic
        await asyncio.sleep(0.1)  # Simulate processing time
        
        return {
            'game_id': game_id,
            'prediction': random.uniform(0.4, 0.6),
            'confidence': random.uniform(0.7, 0.9),
            'selected_bets': ['over_8.5_runs', 'home_team_ml'],
            'reasoning': 'Weather conditions favor offense'
        }
    
    # Enhanced wrapper
    async def enhanced_best_bet_selector(game_id: str, features: Dict[str, float]) -> Dict[str, Any]:
        """Enhanced version with ML capabilities"""
        
        # Use the integration utility from enhanced_ml_routes
        from backend.routes.enhanced_ml_routes import integrate_enhanced_prediction
        
        result = await integrate_enhanced_prediction(
            existing_best_bet_selector,
            game_id,
            features
        )
        
        return result
    
    # Demo the integration
    print("\n1. Calling Enhanced BestBetSelector...")
    
    enhanced_result = await enhanced_best_bet_selector(
        game_id="mlb_game_67890",
        features={
            "home_team_rating": 85.2,
            "away_team_rating": 78.6,
            "pitcher_matchup_score": 0.65,
            "weather_score": 0.8
        }
    )
    
    print("Enhanced BestBetSelector Result:")
    print(f"  Game ID: {enhanced_result.get('game_id')}")
    print(f"  Prediction: {enhanced_result.get('prediction', 0):.4f}")
    print(f"  Confidence: {enhanced_result.get('confidence', 0):.4f}")
    print(f"  Selected Bets: {enhanced_result.get('selected_bets', [])}")
    print(f"  Enhanced Processing Time: {enhanced_result.get('enhanced_processing_time', 0):.3f}s")
    print(f"  Enhanced Services Active: {enhanced_result.get('enhanced_metadata', {}).get('enhanced_services_active', False)}")
    
    print("\n✅ Integration demo completed!")


def show_api_endpoints():
    """Show the available API endpoints"""
    
    print("\n" + "=" * 50)
    print("🌐 Available Enhanced ML API Endpoints")
    print("=" * 50)
    
    endpoints = [
        ("POST", "/api/enhanced-ml/predict/single", "Enhanced single prediction with SHAP"),
        ("POST", "/api/enhanced-ml/predict/batch", "Optimized batch predictions"),
        ("POST", "/api/enhanced-ml/models/register", "Register models with enhanced services"),
        ("GET", "/api/enhanced-ml/models/registered", "Get registered models"),
        ("POST", "/api/enhanced-ml/outcomes/update", "Update prediction outcomes"),
        ("POST", "/api/enhanced-ml/performance/query", "Query performance statistics"),
        ("POST", "/api/enhanced-ml/performance/compare", "Compare model performance"),
        ("GET", "/api/enhanced-ml/performance/alerts", "Get performance alerts"),
        ("GET", "/api/enhanced-ml/performance/batch-stats", "Get batch processing stats"),
        ("GET", "/api/enhanced-ml/performance/shap-stats", "Get SHAP explanation stats"),
        ("GET", "/api/enhanced-ml/health", "Comprehensive health check"),
        ("POST", "/api/enhanced-ml/initialize", "Initialize enhanced services"),
        ("POST", "/api/enhanced-ml/shutdown", "Shutdown enhanced services"),
        ("GET", "/api/enhanced-ml/monitor/real-time", "Real-time monitoring metrics"),
    ]
    
    for method, path, description in endpoints:
        print(f"  {method:4} {path:45} - {description}")
    
    print("\n📖 Example API Usage:")
    print("""
    # Single prediction with SHAP explanations
    curl -X POST "http://localhost:8000/api/enhanced-ml/predict/single" \\
         -H "Content-Type: application/json" \\
         -d '{
           "request_id": "test_001",
           "event_id": "mlb_game_12345",
           "sport": "MLB",
           "bet_type": "over_under",
           "features": {
             "team_avg_runs": 4.8,
             "pitcher_era": 3.45,
             "weather_temp": 75.0
           },
           "include_explanations": true
         }'
    
    # Performance query
    curl -X POST "http://localhost:8000/api/enhanced-ml/performance/query" \\
         -H "Content-Type: application/json" \\
         -d '{
           "model_name": "BestBetSelector_v1",
           "sport": "MLB",
           "bet_type": "over_under"
         }'
    
    # Health check
    curl "http://localhost:8000/api/enhanced-ml/health"
    """)


async def main():
    """Main demo function"""
    
    print("🎯 Enhanced ML Capabilities Integration Complete!")
    print("=" * 60)
    print()
    print("This demo showcases the full integration of:")
    print("✅ SHAP explainability service with batch processing and caching")  
    print("✅ Batch prediction optimization with intelligent queueing")
    print("✅ Performance logging with rolling accuracy stats per sport/bet type")
    print("✅ Seamless integration with existing prediction engines")
    print("✅ Comprehensive API endpoints for all capabilities")
    print()
    
    # Run the demos
    await demo_enhanced_ml_integration()
    await demo_integration_with_existing_engines()
    show_api_endpoints()
    
    print("\n🚀 Ready for Production!")
    print("=" * 30)
    print("1. Enhanced services are integrated into backend/core/app.py")
    print("2. API endpoints are available at /api/enhanced-ml/*")
    print("3. Existing prediction engines can be enhanced with minimal changes")
    print("4. Performance monitoring and alerting is active")
    print("5. SHAP explanations provide model interpretability")
    print("6. Batch optimization reduces API latency for multi-bet requests")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n⚠️  Demo interrupted by user")
    except Exception as e:
        logger.error(f"Demo failed: {e}")
        print(f"\n❌ Demo failed: {e}")
