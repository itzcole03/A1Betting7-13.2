"""Enhanced API Routes - Complete Backend Integration
Comprehensive FastAPI routes for all enhanced mathematical services
"""

import asyncio
import logging
import time
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

import numpy as np
from config import config_manager
from enhanced_data_pipeline import enhanced_data_pipeline
from enhanced_feature_engineering import enhanced_feature_engineering
from enhanced_model_service import EnhancedMathematicalModelService
from enhanced_prediction_engine import enhanced_prediction_engine

# Import all enhanced services
from enhanced_revolutionary_api import router as revolutionary_router
from enhanced_risk_management import enhanced_risk_management
from fastapi import BackgroundTasks, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="A1Betting Enhanced Mathematical Backend",
    description="Research-grade mathematical prediction and analysis system",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=config_manager.config.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include revolutionary accuracy router
app.include_router(revolutionary_router)

# Initialize enhanced services
model_service = EnhancedMathematicalModelService()


# Pydantic models for API
class HealthCheckResponse(BaseModel):
    status: str
    timestamp: str
    services: Dict[str, bool]
    mathematical_engines: Dict[str, bool]
    version: str
    uptime: float


class UnifiedPredictionRequest(BaseModel):
    event_id: str = Field(..., description="Unique event identifier")
    sport: str = Field("basketball", description="Sport type")
    features: Dict[str, float] = Field(..., description="Input features")
    include_all_enhancements: bool = Field(
        True, description="Include all mathematical enhancements"
    )
    processing_level: str = Field(
        "advanced",
        description="Processing level: basic, advanced, research_grade, revolutionary",
    )


class UnifiedPredictionResponse(BaseModel):
    predictions: Dict[str, float]
    enhanced_revolutionary: Dict[str, Any]
    feature_engineering: Dict[str, Any]
    risk_assessment: Dict[str, Any]
    mathematical_analysis: Dict[str, Any]
    unified_confidence: float
    processing_summary: Dict[str, Any]


class FeatureEngineeringRequest(BaseModel):
    data: Dict[str, List[float]] = Field(
        ..., description="Input data for feature engineering"
    )
    feature_types: List[str] = Field(
        ["numerical"], description="Types of features to engineer"
    )
    enable_wavelet_transforms: bool = Field(
        True, description="Enable wavelet transforms"
    )
    enable_manifold_learning: bool = Field(True, description="Enable manifold learning")
    enable_information_theory: bool = Field(
        True, description="Enable information theory features"
    )
    enable_graph_features: bool = Field(
        False, description="Enable graph-based features"
    )
    target_dimensionality: Optional[int] = Field(
        None, description="Target dimensionality for reduction"
    )


class RiskAssessmentRequest(BaseModel):
    portfolio: Dict[str, float] = Field(..., description="Portfolio positions")
    market_data: Dict[str, List[float]] = Field(
        ..., description="Market data for analysis"
    )
    risk_metrics: List[str] = Field(
        ["var", "es"], description="Risk metrics to compute"
    )
    confidence_level: float = Field(
        0.95, description="Confidence level for risk metrics"
    )
    time_horizon: int = Field(1, description="Time horizon in days")


class ModelStatus(BaseModel):
    id: str
    name: str
    status: str
    accuracy: float
    last_update: str
    mathematical_properties: Dict[str, bool]
    performance_metrics: Dict[str, float]


class SystemHealthResponse(BaseModel):
    models: List[ModelStatus]
    system_health: Dict[str, Any]
    mathematical_foundations: Dict[str, Any]


# Global state for monitoring
app_start_time = time.time()
prediction_cache = {}
model_performance_history = []


@app.get("/", response_model=Dict[str, str])
async def root():
    """Root endpoint with API information"""
    return {
        "message": "A1Betting Enhanced Mathematical Backend API",
        "version": "2.0.0",
        "status": "operational",
        "documentation": "/docs",
        "health": "/health",
    }


@app.get("/health", response_model=HealthCheckResponse)
async def health_check():
    """Comprehensive health check for all services"""
    try:
        # Check all mathematical engines
        services_status = {}
        mathematical_engines_status = {}

        # Test enhanced prediction engine
        try:
            test_features = {"test": 1.0}
            _ = enhanced_prediction_engine.generate_bayesian_prediction(test_features)
            services_status["prediction_engine"] = True
            mathematical_engines_status["bayesian_neural_network"] = True
        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Prediction engine health check failed: {e}")
            services_status["prediction_engine"] = False
            mathematical_engines_status["bayesian_neural_network"] = False

        # Test enhanced feature engineering
        try:
            test_data = {"features": [1.0, 2.0, 3.0]}
            _ = enhanced_feature_engineering.engineer_wavelet_features(test_data)
            services_status["feature_engineering"] = True
            mathematical_engines_status["wavelet_transforms"] = True
        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Feature engineering health check failed: {e}")
            services_status["feature_engineering"] = False
            mathematical_engines_status["wavelet_transforms"] = False

        # Test enhanced risk management
        try:
            test_portfolio = {"asset1": 1.0}
            test_market_data = {"returns": [0.01, -0.02, 0.015]}
            _ = enhanced_risk_management.calculate_extreme_value_risk(
                test_portfolio, test_market_data
            )
            services_status["risk_management"] = True
            mathematical_engines_status["extreme_value_theory"] = True
        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Risk management health check failed: {e}")
            services_status["risk_management"] = False
            mathematical_engines_status["extreme_value_theory"] = False

        # Test enhanced data pipeline
        try:
            test_data = np.array([[1, 2], [3, 4], [5, 6]])
            _ = enhanced_data_pipeline.detect_anomalies_multivariate(test_data)
            services_status["data_pipeline"] = True
            mathematical_engines_status["anomaly_detection"] = True
        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Data pipeline health check failed: {e}")
            services_status["data_pipeline"] = False
            mathematical_engines_status["anomaly_detection"] = False

        # Test model service
        try:
            _ = await model_service.get_model_status()
            services_status["model_service"] = True
            mathematical_engines_status["unified_orchestration"] = True
        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Model service health check failed: {e}")
            services_status["model_service"] = False
            mathematical_engines_status["unified_orchestration"] = False

        uptime = time.time() - app_start_time

        return HealthCheckResponse(
            status="healthy" if all(services_status.values()) else "degraded",
            timestamp=datetime.now().isoformat(),
            services=services_status,
            mathematical_engines=mathematical_engines_status,
            version="2.0.0",
            uptime=uptime,
        )

    except Exception as e:  # pylint: disable=broad-exception-caught
        logger.error("Health check failed: {e}")
        raise HTTPException(status_code=500, detail=f"Health check failed: {e!s}")


@app.post("/api/unified/predict", response_model=UnifiedPredictionResponse)
async def unified_prediction(
    request: UnifiedPredictionRequest, background_tasks: BackgroundTasks
):
    """Unified prediction endpoint that orchestrates all enhanced mathematical services"""
    try:
        start_time = time.time()

        logger.info("Starting unified prediction for event {request.event_id}")

        # Convert processing level to enhanced settings
        enhanced_settings = {
            "basic": {
                "use_advanced_features": False,
                "use_risk_assessment": False,
                "use_causal_analysis": False,
                "use_topological": False,
                "numerical_precision": "float32",
            },
            "advanced": {
                "use_advanced_features": True,
                "use_risk_assessment": True,
                "use_causal_analysis": False,
                "use_topological": False,
                "numerical_precision": "float32",
            },
            "research_grade": {
                "use_advanced_features": True,
                "use_risk_assessment": True,
                "use_causal_analysis": True,
                "use_topological": True,
                "numerical_precision": "float64",
            },
            "revolutionary": {
                "use_advanced_features": True,
                "use_risk_assessment": True,
                "use_causal_analysis": True,
                "use_topological": True,
                "numerical_precision": "float64",
            },
        }.get(
            request.processing_level,
            {
                "use_advanced_features": True,
                "use_risk_assessment": True,
                "use_causal_analysis": False,
                "use_topological": False,
                "numerical_precision": "float32",
            },
        )

        # Execute unified prediction through model service
        unified_result = await model_service.generate_unified_prediction(
            event_id=request.event_id,
            sport=request.sport,
            features=request.features,
            include_all_enhancements=request.include_all_enhancements,
            **enhanced_settings,
        )

        processing_time = time.time() - start_time

        # Schedule background analysis
        background_tasks.add_task(
            store_prediction_analytics,
            request.event_id,
            unified_result,
            processing_time,
        )

        logger.info(
            f"Unified prediction completed for {request.event_id} in {processing_time:.3f}s"
        )

        return unified_result

    except Exception as e:  # pylint: disable=broad-exception-caught
        logger.error("Unified prediction failed for {request.event_id}: {e!s}")
        raise HTTPException(status_code=500, detail=f"Unified prediction failed: {e!s}")


@app.post("/api/enhanced-features/engineer")
async def enhanced_feature_engineering_endpoint(request: FeatureEngineeringRequest):
    """Enhanced feature engineering with mathematical rigor"""
    try:
        start_time = time.time()

        logger.info("Starting enhanced feature engineering")

        # Generate enhanced features using all requested methods
        results = {}

        if request.enable_wavelet_transforms:
            wavelet_features = enhanced_feature_engineering.engineer_wavelet_features(
                request.data
            )
            results["wavelet_features"] = wavelet_features

        if request.enable_manifold_learning:
            manifold_features = enhanced_feature_engineering.engineer_manifold_features(
                request.data, target_dim=request.target_dimensionality
            )
            results["manifold_features"] = manifold_features

        if request.enable_information_theory:
            info_features = (
                enhanced_feature_engineering.engineer_information_theory_features(
                    request.data
                )
            )
            results["information_theory_features"] = info_features

        if request.enable_graph_features:
            graph_features = enhanced_feature_engineering.engineer_graph_features(
                request.data
            )
            results["graph_features"] = graph_features

        # Combine all features
        combined_features = enhanced_feature_engineering.combine_engineered_features(
            results
        )

        processing_time = time.time() - start_time

        response = {
            "original_features": request.data,
            "engineered_features": combined_features["features"],
            "feature_importance": combined_features["importance"],
            "dimensionality_reduction": combined_features["dimensionality_info"],
            "manifold_properties": combined_features.get("manifold_properties", {}),
            "information_theory_metrics": combined_features.get(
                "information_metrics", {}
            ),
            "processing_time": processing_time,
            "mathematical_validation": combined_features.get("validation", {}),
        }

        logger.info("Enhanced feature engineering completed in {processing_time:.3f}s")

        return response

    except Exception as e:  # pylint: disable=broad-exception-caught
        logger.error("Enhanced feature engineering failed: {e!s}")
        raise HTTPException(
            status_code=500, detail=f"Feature engineering failed: {e!s}"
        )


@app.post("/api/enhanced-risk/assess")
async def enhanced_risk_assessment_endpoint(request: RiskAssessmentRequest):
    """Enhanced risk assessment with extreme value theory and copula modeling"""
    try:
        start_time = time.time()

        logger.info("Starting enhanced risk assessment")

        # Perform comprehensive risk assessment
        risk_results = enhanced_risk_management.comprehensive_risk_assessment(
            portfolio=request.portfolio,
            market_data=request.market_data,
            confidence_level=request.confidence_level,
            time_horizon=request.time_horizon,
        )

        processing_time = time.time() - start_time

        response = {
            "portfolio_risk": {
                "value_at_risk": risk_results["var"],
                "expected_shortfall": risk_results["expected_shortfall"],
                "maximum_drawdown": risk_results["max_drawdown"],
                "sharpe_ratio": risk_results["sharpe_ratio"],
                "sortino_ratio": risk_results["sortino_ratio"],
            },
            "extreme_value_analysis": {
                "gev_parameters": risk_results["gev_params"],
                "return_levels": risk_results["return_levels"],
                "tail_index": risk_results["tail_index"],
                "hill_estimator": risk_results["hill_estimator"],
            },
            "copula_analysis": {
                "dependence_structure": risk_results["copula_type"],
                "tail_dependence": risk_results["tail_dependence"],
                "model_selection": risk_results["copula_selection"],
            },
            "stress_testing": {
                "scenarios": risk_results["stress_scenarios"],
                "portfolio_impact": risk_results["stress_impact"],
                "worst_case_loss": risk_results["worst_case"],
            },
            "risk_decomposition": risk_results["risk_decomposition"],
            "processing_time": processing_time,
            "model_validation": risk_results["validation"],
        }

        logger.info("Enhanced risk assessment completed in {processing_time:.3f}s")

        return response

    except Exception as e:  # pylint: disable=broad-exception-caught
        logger.error("Enhanced risk assessment failed: {e!s}")
        raise HTTPException(status_code=500, detail=f"Risk assessment failed: {e!s}")


@app.get("/api/enhanced-models/status", response_model=SystemHealthResponse)
async def enhanced_model_status():
    """Get comprehensive status of all enhanced mathematical models"""
    try:
        logger.info("Retrieving enhanced model status")

        # Get model status from service
        model_status = await model_service.get_comprehensive_model_status()

        # Format response
        models = []
        for model_id, model_info in model_status["models"].items():
            models.append(
                ModelStatus(
                    id=model_id,
                    name=model_info["name"],
                    status=model_info["status"],
                    accuracy=model_info["accuracy"],
                    last_update=model_info["last_update"],
                    mathematical_properties={
                        "convergence_verified": model_info.get(
                            "convergence_verified", False
                        ),
                        "stability_guaranteed": model_info.get(
                            "stability_guaranteed", False
                        ),
                        "theoretical_bounds_satisfied": model_info.get(
                            "bounds_satisfied", False
                        ),
                    },
                    performance_metrics={
                        "prediction_speed": model_info.get("prediction_speed", 0.0),
                        "memory_usage": model_info.get("memory_usage", 0.0),
                        "computational_complexity": model_info.get(
                            "complexity", "O(n)"
                        ),
                    },
                )
            )

        return SystemHealthResponse(
            models=models,
            system_health={
                "overall_status": model_status["system_health"]["status"],
                "component_status": model_status["system_health"]["components"],
                "error_rate": model_status["system_health"]["error_rate"],
                "average_response_time": model_status["system_health"][
                    "avg_response_time"
                ],
            },
            mathematical_foundations=model_status.get("mathematical_foundations", {}),
        )

    except Exception as e:  # pylint: disable=broad-exception-caught
        logger.error("Failed to get enhanced model status: {e!s}")
        raise HTTPException(
            status_code=500, detail=f"Model status retrieval failed: {e!s}"
        )


@app.get("/api/performance/metrics")
async def get_performance_metrics(
    time_range: str = Query("24h", description="Time range: 1h, 6h, 24h, 7d, 30d"),
    metric_type: str = Query(
        "all", description="Metric type: accuracy, speed, memory, all"
    ),
):
    """Get detailed performance metrics for the enhanced mathematical system"""
    try:
        logger.info("Retrieving performance metrics for {time_range}")

        # Calculate time window
        time_windows = {
            "1h": timedelta(hours=1),
            "6h": timedelta(hours=6),
            "24h": timedelta(days=1),
            "7d": timedelta(days=7),
            "30d": timedelta(days=30),
        }

        time_window = time_windows.get(time_range, timedelta(days=1))
        start_time = datetime.now() - time_window

        # Get performance data (in production, this would come from a metrics database)
        performance_data = await model_service.get_performance_metrics(
            start_time=start_time, metric_type=metric_type
        )

        logger.info("Performance metrics retrieved for {time_range}")

        return {
            "time_range": time_range,
            "start_time": start_time.isoformat(),
            "end_time": datetime.now().isoformat(),
            "metrics": performance_data,
            "summary": {
                "total_predictions": performance_data.get("total_predictions", 0),
                "average_accuracy": performance_data.get("avg_accuracy", 0.0),
                "average_response_time": performance_data.get("avg_response_time", 0.0),
                "error_rate": performance_data.get("error_rate", 0.0),
            },
        }

    except Exception as e:  # pylint: disable=broad-exception-caught
        logger.error("Failed to get performance metrics: {e!s}")
        raise HTTPException(
            status_code=500, detail=f"Performance metrics retrieval failed: {e!s}"
        )


@app.post("/api/batch/predictions")
async def batch_predictions(
    requests: List[UnifiedPredictionRequest], background_tasks: BackgroundTasks
):
    """Process multiple prediction requests in batch"""
    try:
        start_time = time.time()

        logger.info("Starting batch prediction for {len(requests)} requests")

        # Process in parallel batches to avoid overwhelming the system
        batch_size = 5
        results = []

        for i in range(0, len(requests), batch_size):
            batch = requests[i : i + batch_size]

            # Process batch in parallel
            batch_tasks = [
                model_service.generate_unified_prediction(
                    event_id=req.event_id,
                    sport=req.sport,
                    features=req.features,
                    include_all_enhancements=req.include_all_enhancements,
                )
                for req in batch
            ]

            batch_results = await asyncio.gather(*batch_tasks, return_exceptions=True)

            for j, result in enumerate(batch_results):
                if isinstance(result, Exception):
                    logger.error(
                        f"Batch prediction failed for {batch[j].event_id}: {result}"
                    )
                    results.append(
                        {
                            "event_id": batch[j].event_id,
                            "status": "failed",
                            "error": str(result),
                        }
                    )
                else:
                    results.append(
                        {
                            "event_id": batch[j].event_id,
                            "status": "success",
                            "result": result,
                        }
                    )

        processing_time = time.time() - start_time

        # Schedule background analytics
        background_tasks.add_task(
            store_batch_analytics, requests, results, processing_time
        )

        successful_predictions = len([r for r in results if r["status"] == "success"])

        logger.info(
            f"Batch prediction completed: {successful_predictions}/{len(requests)} successful in {processing_time:.3f}s"
        )

        return {
            "total_requests": len(requests),
            "successful_predictions": successful_predictions,
            "failed_predictions": len(requests) - successful_predictions,
            "processing_time": processing_time,
            "results": results,
        }

    except Exception as e:  # pylint: disable=broad-exception-caught
        logger.error("Batch prediction failed: {e!s}")
        raise HTTPException(status_code=500, detail=f"Batch prediction failed: {e!s}")


@app.get("/api/monitoring/real-time")
async def real_time_monitoring():
    """Get real-time monitoring data for the mathematical system"""
    try:
        # Get current system metrics
        monitoring_data = await model_service.get_real_time_monitoring()

        return {
            "timestamp": datetime.now().isoformat(),
            "system_status": monitoring_data["status"],
            "active_predictions": monitoring_data["active_predictions"],
            "queue_length": monitoring_data["queue_length"],
            "resource_usage": {
                "cpu_percent": monitoring_data["cpu_usage"],
                "memory_percent": monitoring_data["memory_usage"],
                "gpu_percent": monitoring_data.get("gpu_usage", 0),
            },
            "mathematical_engines": {
                "neuromorphic_active": monitoring_data["engines"]["neuromorphic"],
                "mamba_active": monitoring_data["engines"]["mamba"],
                "causal_active": monitoring_data["engines"]["causal"],
                "topological_active": monitoring_data["engines"]["topological"],
                "riemannian_active": monitoring_data["engines"]["riemannian"],
            },
            "performance_metrics": {
                "predictions_per_minute": monitoring_data["throughput"],
                "average_confidence": monitoring_data["avg_confidence"],
                "error_rate": monitoring_data["error_rate"],
                "cache_hit_rate": monitoring_data["cache_hit_rate"],
            },
        }

    except Exception as e:  # pylint: disable=broad-exception-caught
        logger.error("Real-time monitoring failed: {e!s}")
        raise HTTPException(
            status_code=500, detail=f"Real-time monitoring failed: {e!s}"
        )


# Background tasks
async def store_prediction_analytics(
    event_id: str, result: dict, processing_time: float
):
    """Store prediction analytics for future analysis"""
    try:
        analytics_data = {
            "event_id": event_id,
            "timestamp": datetime.now().isoformat(),
            "processing_time": processing_time,
            "confidence": result.get("unified_confidence", 0.0),
            "mathematical_rigor": result.get("mathematical_analysis", {}).get(
                "mathematical_rigor_score", 0.0
            ),
        }

        # In production, this would go to a database
        model_performance_history.append(analytics_data)

        # Keep only last 1000 records in memory
        if len(model_performance_history) > 1000:
            model_performance_history.pop(0)

        

    except Exception as e:  # pylint: disable=broad-exception-caught
        logger.error("Failed to store prediction analytics: {e}")


async def store_batch_analytics(requests: list, results: list, processing_time: float):
    """Store batch analytics for performance monitoring"""
    try:
        batch_analytics = {
            "timestamp": datetime.now().isoformat(),
            "total_requests": len(requests),
            "successful": len([r for r in results if r["status"] == "success"]),
            "failed": len([r for r in results if r["status"] == "failed"]),
            "processing_time": processing_time,
            "throughput": len(requests) / processing_time if processing_time > 0 else 0,
        }

        logger.info("Batch analytics: {batch_analytics}")

    except Exception as e:  # pylint: disable=broad-exception-caught
        logger.error("Failed to store batch analytics: {e}")


# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Handle HTTP exceptions with detailed error information"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "status_code": exc.status_code,
            "timestamp": datetime.now().isoformat(),
            "path": str(request.url),
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Handle general exceptions"""
    logger.error("Unhandled exception: {exc!s}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": str(exc),
            "timestamp": datetime.now().isoformat(),
            "path": str(request.url),
        },
    )


if __name__ == "__main__":
    import uvicorn

    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )

    # Start the server
    uvicorn.run(
        "enhanced_api_routes:app",
        host=config_manager.config.api_host,
        port=config_manager.config.api_port,
        workers=config_manager.config.api_workers,
        reload=config_manager.config.debug,
    )
