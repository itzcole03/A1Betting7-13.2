"""Simple test to verify backend routes are working"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import time
from datetime import datetime, timezone
from typing import Dict, Any

# Create a simple FastAPI app for testing
app = FastAPI(
    title="A1Betting Backend Test",
    description="Test backend with missing routes",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app_start_time = time.time()

@app.get("/")
async def root():
    return {"message": "A1Betting Backend Test API", "status": "running"}

@app.get("/health")
async def health_check():
    """Basic health check"""
    uptime = time.time() - app_start_time

    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "1.0.0",
        "uptime": uptime,
        "services": {
            "api": "healthy",
            "database": "healthy"
        }
    }

@app.get("/api/health/status")
async def get_comprehensive_health():
    """Comprehensive health check for all system components"""
    uptime = time.time() - app_start_time

    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "1.0.0",
        "uptime": uptime,
        "services": {
            "api": "healthy",
            "database": "healthy",
            "prediction_engine": "healthy",
            "ml_models": "healthy",
            "data_pipeline": "healthy",
            "cache": "healthy",
            "monitoring": "healthy"
        },
        "performance": {
            "cpu_usage": 25.3,
            "memory_usage": 45.7,
            "disk_usage": 60.2,
            "network_latency": 12.5
        }
    }

@app.get("/api/ultra-accuracy/model-performance")
async def get_ultra_accuracy_model_performance():
    """Get ultra-accuracy model performance metrics"""
    return {
        "models": [
            {
                "id": "ensemble_v4",
                "name": "Ultra-Accuracy Ensemble Model",
                "accuracy": 0.923,
                "precision": 0.891,
                "recall": 0.874,
                "f1_score": 0.882,
                "roi": 0.156
            }
        ],
        "real_time_metrics": {
            "current_accuracy_24h": 0.891,
            "predictions_today": 234,
            "successful_predictions": 208
        }
    }

@app.get("/api/analytics/summary")
async def get_advanced_analytics():
    """Get advanced analytics and insights"""
    return {
        "market_analysis": {
            "market_efficiency": 0.834,
            "arbitrage_opportunities": 12,
            "value_bets_identified": 34,
            "market_sentiment": "bullish"
        },
        "performance_analytics": {
            "model_performance": {
                "accuracy_trend": [0.856, 0.867, 0.871, 0.883, 0.891, 0.887, 0.923],
                "roi_trend": [0.098, 0.112, 0.124, 0.134, 0.145, 0.151, 0.156]
            }
        }
    }

@app.get("/api/active-bets")
async def get_active_bets():
    """Get currently active bets"""
    active_bets = [
        {
            "id": "bet_1",
            "event": "Lakers vs Warriors",
            "market": "Moneyline",
            "selection": "Lakers",
            "odds": 1.85,
            "stake": 100.0,
            "potential_return": 185.0,
            "status": "active",
            "placed_at": "2024-01-16T14:20:00Z",
        }
    ]
    return {"active_bets": active_bets, "total_count": len(active_bets)}

@app.get("/api/transactions")
async def get_transactions():
    """Get user transactions for bankroll management"""
    transactions = [
        {
            "id": "txn_1",
            "type": "bet",
            "amount": -100.0,
            "description": "Lakers vs Warriors - Lakers ML",
            "timestamp": "2024-01-15T10:30:00Z",
            "status": "completed",
        }
    ]
    return {"transactions": transactions, "total_count": len(transactions)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("test_backend:app", host="0.0.0.0", port=8000, reload=True)
