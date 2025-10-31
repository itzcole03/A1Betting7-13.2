"""
Phase 2 Integration Module for A1Betting7-13.2

Comprehensive integration layer that orchestrates all Phase 2 components:
- Enhanced ML Model Pipeline
- Real-time Analytics Engine
- Advanced Prediction Framework
- Enhanced Feature Engineering
- Enhanced Monitoring and Alerting

This module provides unified API access and seamless integration with existing Phase 1 infrastructure.
"""

import asyncio
import json
import logging
import time
import uuid
from contextlib import asynccontextmanager
from dataclasses import asdict, dataclass
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Union

from .advanced_prediction_framework import (
    AdvancedPredictionFramework,
    create_advanced_prediction_framework,
)
from .cache_manager import APICache
from .enhanced_feature_engineering import (
    EnhancedFeatureEngineering,
    create_enhanced_feature_engineering,
)

# Phase 2 services (new components)
from .enhanced_ml_model_pipeline import (
    EnhancedMLModelPipeline,
    create_enhanced_ml_pipeline,
)
from .enhanced_monitoring_alerting import EnhancedMonitoring, create_enhanced_monitoring

# Phase 1 services (existing infrastructure)
from .optimized_redis_service import OptimizedRedisService
from .realtime_analytics_engine import (
    RealtimeAnalyticsEngine,
    create_realtime_analytics,
)
from .service_adapters import (
    CacheManagerAdapter,
    RedisServiceAdapter,
    create_cache_adapter,
    create_redis_adapter,
)
from .unified_data_pipeline import UnifiedDataPipeline

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("phase2_integration")


@dataclass
class Phase2Config:
    """Configuration for Phase 2 services"""

    # ML Pipeline settings
    ml_pipeline_enabled: bool = True
    ml_frameworks: List[str] = None  # Default: ['tensorflow', 'pytorch']
    ml_model_cache_size: int = 100
    ml_training_schedule: str = "daily"  # daily, weekly, manual

    # Real-time Analytics settings
    realtime_analytics_enabled: bool = True
    websocket_port: int = 8001
    analytics_buffer_size: int = 1000
    event_retention_hours: int = 24

    # Prediction Framework settings
    prediction_framework_enabled: bool = True
    ensemble_methods: List[str] = None  # Default: ['weighted', 'voting', 'stacking']
    confidence_threshold: float = 0.7
    risk_assessment_enabled: bool = True

    # Feature Engineering settings
    feature_engineering_enabled: bool = True
    feature_store_size: int = 10000
    auto_feature_discovery: bool = True
    feature_selection_enabled: bool = True

    # Monitoring settings
    monitoring_enabled: bool = True
    monitoring_interval_seconds: int = 30
    anomaly_detection_enabled: bool = True
    alerting_enabled: bool = True

    def __post_init__(self):
        """Set default values for list fields"""
        if self.ml_frameworks is None:
            self.ml_frameworks = ["tensorflow", "pytorch"]
        if self.ensemble_methods is None:
            self.ensemble_methods = ["weighted", "voting", "stacking"]


@dataclass
class Phase2Status:
    """Status of Phase 2 services"""

    ml_pipeline_status: str
    realtime_analytics_status: str
    prediction_framework_status: str
    feature_engineering_status: str
    monitoring_status: str
    overall_health: float
    last_update: datetime
    active_predictions: int
    features_computed: int
    alerts_active: int


@dataclass
class IntegratedPredictionRequest:
    """Request for integrated prediction using all Phase 2 components"""

    input_data: Dict[str, Any]
    prediction_type: str  # 'single', 'batch', 'streaming'
    sports: List[str]
    include_features: bool = True
    include_confidence: bool = True
    include_risk_assessment: bool = True
    enable_real_time_updates: bool = False
    custom_features: Optional[List[str]] = None


@dataclass
class IntegratedPredictionResponse:
    """Response from integrated prediction"""

    request_id: str
    predictions: List[Dict[str, Any]]
    features: Dict[str, Any]
    confidence_scores: Dict[str, float]
    risk_assessments: Dict[str, Any]
    performance_metrics: Dict[str, float]
    real_time_stream_id: Optional[str]
    computation_time_ms: float
    timestamp: datetime


class Phase2IntegrationOrchestrator:
    """
    Main orchestrator for Phase 2 integration

    Provides unified access to all Phase 2 components while maintaining
    seamless integration with existing Phase 1 infrastructure.
    """

    def __init__(
        self,
        redis_service: OptimizedRedisService,
        cache_manager: APICache,
        unified_pipeline: UnifiedDataPipeline,
        config: Phase2Config,
    ):
        self.redis_service = redis_service
        self.cache_manager = cache_manager
        self.unified_pipeline = unified_pipeline
        self.config = config

        # Create adapters for Phase 2 compatibility
        self.redis_adapter = create_redis_adapter(redis_service)
        self.cache_adapter = create_cache_adapter(cache_manager)

        # Phase 2 service instances
        self.ml_pipeline: Optional[EnhancedMLModelPipeline] = None
        self.realtime_analytics: Optional[RealtimeAnalyticsEngine] = None
        self.prediction_framework: Optional[AdvancedPredictionFramework] = None
        self.feature_engineering: Optional[EnhancedFeatureEngineering] = None
        self.monitoring: Optional[EnhancedMonitoring] = None

        # Status tracking
        self.initialization_time: Optional[datetime] = None
        self.last_health_check: Optional[datetime] = None
        self.performance_metrics: Dict[str, float] = {}

        logger.info("Phase 2 Integration Orchestrator initialized")

    async def initialize_all_services(self) -> bool:
        """Initialize all Phase 2 services"""
        try:
            start_time = time.time()
            self.initialization_time = datetime.now()

            logger.info("Starting Phase 2 services initialization...")

            # Initialize services in dependency order
            initialization_tasks = []

            # 1. Feature Engineering (foundation for other services)
            if self.config.feature_engineering_enabled:
                task = self._initialize_feature_engineering()
                initialization_tasks.append(("feature_engineering", task))

            # 2. ML Pipeline (depends on feature engineering)
            if self.config.ml_pipeline_enabled:
                task = self._initialize_ml_pipeline()
                initialization_tasks.append(("ml_pipeline", task))

            # 3. Prediction Framework (depends on ML pipeline and feature engineering)
            if self.config.prediction_framework_enabled:
                task = self._initialize_prediction_framework()
                initialization_tasks.append(("prediction_framework", task))

            # 4. Real-time Analytics (can work independently)
            if self.config.realtime_analytics_enabled:
                task = self._initialize_realtime_analytics()
                initialization_tasks.append(("realtime_analytics", task))

            # 5. Monitoring (monitors all other services)
            if self.config.monitoring_enabled:
                task = self._initialize_monitoring()
                initialization_tasks.append(("monitoring", task))

            # Execute initialization tasks
            results = {}
            for service_name, task in initialization_tasks:
                try:
                    result = await task
                    results[service_name] = result
                    logger.info(f"✓ {service_name} initialized successfully")
                except Exception as e:
                    logger.error(f"✗ Failed to initialize {service_name}: {e}")
                    results[service_name] = False

            # Verify all critical services initialized
            critical_services = [
                "feature_engineering",
                "ml_pipeline",
                "prediction_framework",
            ]
            critical_success = all(
                results.get(service, False)
                for service in critical_services
                if getattr(self.config, f"{service}_enabled", True)
            )

            if critical_success:
                initialization_time = (time.time() - start_time) * 1000
                logger.info(
                    f"Phase 2 initialization completed in {initialization_time:.0f}ms"
                )

                # Perform initial health check
                await self._perform_health_check()

                # Start background tasks
                asyncio.create_task(self._background_health_monitor())

                return True
            else:
                logger.error("Critical Phase 2 services failed to initialize")
                return False

        except Exception as e:
            logger.error(f"Phase 2 initialization failed: {e}")
            return False

    async def _initialize_feature_engineering(self) -> bool:
        """Initialize enhanced feature engineering service"""
        try:
            self.feature_engineering = await create_enhanced_feature_engineering(
                redis_service=self.redis_adapter,
                cache_manager=self.cache_adapter,
                feature_store_size=self.config.feature_store_size,
                enable_real_time=True,
                max_features_per_scope=50,
            )
            return True
        except Exception as e:
            logger.error(f"Feature engineering initialization failed: {e}")
            return False

    async def _initialize_ml_pipeline(self) -> bool:
        """Initialize enhanced ML pipeline"""
        try:
            # For now, use the unified pipeline as data manager
            # In a full implementation, create a dedicated backend data manager
            self.ml_pipeline = EnhancedMLModelPipeline(
                redis_service=self.redis_adapter,
                cache_manager=self.cache_adapter,
                data_manager=self.unified_pipeline,  # Use unified pipeline as data source
                model_storage_path="models/",
                enable_gpu=True,
                max_workers=4,
            )
            await self.ml_pipeline.initialize_pipeline()
            return True
        except Exception as e:
            logger.error(f"ML pipeline initialization failed: {e}")
            return False

    async def _initialize_prediction_framework(self) -> bool:
        """Initialize advanced prediction framework"""
        try:
            if not self.ml_pipeline:
                logger.error("ML pipeline required for prediction framework")
                return False

            self.prediction_framework = await create_advanced_prediction_framework(
                ml_pipeline=self.ml_pipeline,
                feature_engineering=self.feature_engineering,
                redis_service=self.redis_service,
                ensemble_methods=self.config.ensemble_methods,
                confidence_threshold=self.config.confidence_threshold,
            )
            return True
        except Exception as e:
            logger.error(f"Prediction framework initialization failed: {e}")
            return False

    async def _initialize_realtime_analytics(self) -> bool:
        """Initialize real-time analytics engine"""
        try:
            self.realtime_analytics = await create_realtime_analytics(
                redis_service=self.redis_adapter,
                cache_manager=self.cache_adapter,
                ml_pipeline=self.ml_pipeline,
                websocket_port=self.config.websocket_port,
                buffer_size=self.config.analytics_buffer_size,
            )
            return True
        except Exception as e:
            logger.error(f"Real-time analytics initialization failed: {e}")
            return False

    async def _initialize_monitoring(self) -> bool:
        """Initialize enhanced monitoring and alerting"""
        try:
            self.monitoring = await create_enhanced_monitoring(
                redis_service=self.redis_service,
                cache_manager=self.cache_manager,
                monitoring_interval_seconds=self.config.monitoring_interval_seconds,
                enable_anomaly_detection=self.config.anomaly_detection_enabled,
            )
            return True
        except Exception as e:
            logger.error(f"Monitoring initialization failed: {e}")
            return False

    async def get_integrated_predictions(
        self, request: IntegratedPredictionRequest
    ) -> IntegratedPredictionResponse:
        """
        Get integrated predictions using all Phase 2 components

        This is the main entry point for leveraging the full Phase 2 ML capabilities.
        """
        start_time = time.time()
        request_id = str(uuid.uuid4())

        logger.info(f"Processing integrated prediction request {request_id}")

        try:
            # Step 1: Feature Engineering
            features = {}
            if request.include_features and self.feature_engineering:
                feature_result = await self.feature_engineering.engineer_features(
                    input_data=request.input_data,
                    target_features=request.custom_features,
                    use_cache=True,
                    parallel_computation=True,
                )
                features = feature_result.features
                logger.info(f"Engineered {len(features)} features")

            # Step 2: ML Pipeline Predictions
            ml_predictions = []
            if self.ml_pipeline:
                # Combine input data with engineered features
                enhanced_data = {**request.input_data, **features}

                for sport in request.sports:
                    pred_result = await self.ml_pipeline.predict(
                        input_data=enhanced_data,
                        model_type="ensemble",
                        sport=sport,
                        include_explainability=True,
                    )
                    if pred_result:
                        ml_predictions.append(pred_result)

            # Step 3: Advanced Prediction Framework (Ensemble + Risk Assessment)
            final_predictions = []
            confidence_scores = {}
            risk_assessments = {}

            if self.prediction_framework:
                for i, pred in enumerate(ml_predictions):
                    # Get ensemble prediction
                    ensemble_result = (
                        await self.prediction_framework.get_ensemble_prediction(
                            base_predictions=[pred],
                            input_data={**request.input_data, **features},
                            strategy="weighted",
                        )
                    )

                    final_predictions.append(ensemble_result.prediction)
                    confidence_scores[f"prediction_{i}"] = ensemble_result.confidence

                    # Get risk assessment if requested
                    if request.include_risk_assessment:
                        risk_result = (
                            await self.prediction_framework.assess_prediction_risk(
                                prediction=ensemble_result.prediction,
                                input_data={**request.input_data, **features},
                                historical_performance={},
                            )
                        )
                        risk_assessments[f"prediction_{i}"] = asdict(risk_result)
            else:
                final_predictions = [pred.prediction for pred in ml_predictions]
                confidence_scores = {
                    f"prediction_{i}": pred.confidence
                    for i, pred in enumerate(ml_predictions)
                }

            # Step 4: Real-time Analytics Integration
            real_time_stream_id = None
            if request.enable_real_time_updates and self.realtime_analytics:
                try:
                    # Create real-time stream for ongoing updates
                    stream_config = {
                        "request_id": request_id,
                        "sports": request.sports,
                        "update_interval": 30,  # seconds
                    }
                    real_time_stream_id = (
                        await self.realtime_analytics.create_prediction_stream(
                            stream_config
                        )
                    )
                except Exception as e:
                    logger.warning(f"Failed to create real-time stream: {e}")

            # Step 5: Performance Metrics
            computation_time = (time.time() - start_time) * 1000
            performance_metrics = {
                "total_computation_time_ms": computation_time,
                "feature_engineering_time_ms": (
                    getattr(feature_result, "total_computation_time_ms", 0)
                    if "feature_result" in locals()
                    else 0
                ),
                "ml_prediction_time_ms": sum(
                    getattr(pred, "computation_time_ms", 0) for pred in ml_predictions
                ),
                "features_count": len(features),
                "predictions_count": len(final_predictions),
            }

            # Create response
            response = IntegratedPredictionResponse(
                request_id=request_id,
                predictions=final_predictions,
                features=features,
                confidence_scores=confidence_scores,
                risk_assessments=risk_assessments,
                performance_metrics=performance_metrics,
                real_time_stream_id=real_time_stream_id,
                computation_time_ms=computation_time,
                timestamp=datetime.now(),
            )

            # Log analytics event
            if self.realtime_analytics:
                await self.realtime_analytics.log_event(
                    {
                        "type": "integrated_prediction",
                        "request_id": request_id,
                        "sports": request.sports,
                        "computation_time_ms": computation_time,
                        "features_count": len(features),
                        "predictions_count": len(final_predictions),
                    }
                )

            logger.info(
                f"Completed integrated prediction {request_id} in {computation_time:.0f}ms"
            )
            return response

        except Exception as e:
            logger.error(f"Integrated prediction failed for request {request_id}: {e}")
            raise

    async def get_phase2_status(self) -> Phase2Status:
        """Get comprehensive status of all Phase 2 services"""
        try:
            # Service status checks
            ml_status = "active" if self.ml_pipeline else "inactive"
            if self.ml_pipeline:
                try:
                    await self.ml_pipeline.health_check()
                except:
                    ml_status = "error"

            analytics_status = "active" if self.realtime_analytics else "inactive"
            if self.realtime_analytics:
                try:
                    analytics_stats = (
                        await self.realtime_analytics.get_analytics_summary()
                    )
                    if not analytics_stats:
                        analytics_status = "degraded"
                except:
                    analytics_status = "error"

            prediction_status = "active" if self.prediction_framework else "inactive"
            if self.prediction_framework:
                try:
                    pred_stats = (
                        await self.prediction_framework.get_framework_statistics()
                    )
                    if pred_stats.get("error_rate", 0) > 0.1:
                        prediction_status = "degraded"
                except:
                    prediction_status = "error"

            feature_status = "active" if self.feature_engineering else "inactive"
            if self.feature_engineering:
                try:
                    feature_stats = (
                        await self.feature_engineering.get_feature_statistics()
                    )
                    if (
                        feature_stats.get("performance_summary", {}).get(
                            "error_rate", 0
                        )
                        > 0.1
                    ):
                        feature_status = "degraded"
                except:
                    feature_status = "error"

            monitoring_status = "active" if self.monitoring else "inactive"
            if self.monitoring:
                try:
                    monitoring_data = (
                        await self.monitoring.get_monitoring_dashboard_data()
                    )
                    if monitoring_data.get("system_health_score", 0) < 0.5:
                        monitoring_status = "degraded"
                except:
                    monitoring_status = "error"

            # Calculate overall health
            service_health_scores = []
            for status in [
                ml_status,
                analytics_status,
                prediction_status,
                feature_status,
                monitoring_status,
            ]:
                if status == "active":
                    service_health_scores.append(1.0)
                elif status == "degraded":
                    service_health_scores.append(0.7)
                elif status == "inactive":
                    service_health_scores.append(0.3)
                else:  # error
                    service_health_scores.append(0.1)

            overall_health = (
                sum(service_health_scores) / len(service_health_scores)
                if service_health_scores
                else 0.0
            )

            # Get activity metrics
            active_predictions = 0
            features_computed = 0
            alerts_active = 0

            try:
                if self.monitoring:
                    monitoring_data = (
                        await self.monitoring.get_monitoring_dashboard_data()
                    )
                    alerts_active = len(monitoring_data.get("active_alerts", []))

                if self.feature_engineering:
                    feature_stats = (
                        await self.feature_engineering.get_feature_statistics()
                    )
                    features_computed = feature_stats.get("computation_stats", {}).get(
                        "total_computations", 0
                    )

                # Count active predictions from Redis
                active_predictions = await self.redis_service.count_keys(
                    "prediction:active:*"
                )

            except Exception as e:
                logger.warning(f"Error gathering activity metrics: {e}")

            return Phase2Status(
                ml_pipeline_status=ml_status,
                realtime_analytics_status=analytics_status,
                prediction_framework_status=prediction_status,
                feature_engineering_status=feature_status,
                monitoring_status=monitoring_status,
                overall_health=overall_health,
                last_update=datetime.now(),
                active_predictions=active_predictions,
                features_computed=features_computed,
                alerts_active=alerts_active,
            )

        except Exception as e:
            logger.error(f"Error getting Phase 2 status: {e}")
            return Phase2Status(
                ml_pipeline_status="error",
                realtime_analytics_status="error",
                prediction_framework_status="error",
                feature_engineering_status="error",
                monitoring_status="error",
                overall_health=0.0,
                last_update=datetime.now(),
                active_predictions=0,
                features_computed=0,
                alerts_active=0,
            )

    async def _perform_health_check(self) -> Dict[str, Any]:
        """Perform comprehensive health check of all services"""
        health_results = {}

        # Check each service
        services = [
            ("ml_pipeline", self.ml_pipeline),
            ("realtime_analytics", self.realtime_analytics),
            ("prediction_framework", self.prediction_framework),
            ("feature_engineering", self.feature_engineering),
            ("monitoring", self.monitoring),
        ]

        for service_name, service in services:
            if service:
                try:
                    if hasattr(service, "health_check"):
                        result = await service.health_check()
                        health_results[service_name] = {
                            "status": "healthy",
                            "details": result,
                        }
                    else:
                        health_results[service_name] = {
                            "status": "healthy",
                            "details": "No health check method",
                        }
                except Exception as e:
                    health_results[service_name] = {
                        "status": "unhealthy",
                        "error": str(e),
                    }
            else:
                health_results[service_name] = {"status": "disabled"}

        self.last_health_check = datetime.now()
        return health_results

    async def _background_health_monitor(self):
        """Background task for continuous health monitoring"""
        while True:
            try:
                await asyncio.sleep(300)  # Check every 5 minutes
                health_results = await self._perform_health_check()

                # Log any unhealthy services
                for service_name, result in health_results.items():
                    if result.get("status") == "unhealthy":
                        logger.warning(
                            f"Service {service_name} is unhealthy: {result.get('error')}"
                        )

            except Exception as e:
                logger.error(f"Health monitor error: {e}")
                await asyncio.sleep(60)  # Wait before retrying

    async def shutdown_all_services(self):
        """Gracefully shutdown all Phase 2 services"""
        logger.info("Shutting down Phase 2 services...")

        # Shutdown in reverse dependency order
        shutdown_tasks = []

        if self.monitoring:
            shutdown_tasks.append(self.monitoring.stop_monitoring())

        if self.realtime_analytics:
            shutdown_tasks.append(self.realtime_analytics.shutdown())

        if self.prediction_framework:
            # Prediction framework doesn't typically need explicit shutdown
            pass

        if self.ml_pipeline:
            # ML pipeline cleanup if needed
            pass

        if self.feature_engineering:
            # Feature engineering cleanup if needed
            pass

        # Execute shutdown tasks
        if shutdown_tasks:
            await asyncio.gather(*shutdown_tasks, return_exceptions=True)

        logger.info("Phase 2 services shutdown completed")

    @asynccontextmanager
    async def managed_lifecycle(self):
        """Context manager for automatic service lifecycle management"""
        try:
            # Initialize all services
            success = await self.initialize_all_services()
            if not success:
                raise RuntimeError("Failed to initialize Phase 2 services")

            yield self

        finally:
            # Cleanup on exit
            await self.shutdown_all_services()


# High-level factory function for complete Phase 2 setup
async def create_phase2_integration(
    redis_service: OptimizedRedisService,
    cache_manager: APICache,
    unified_pipeline: UnifiedDataPipeline,
    config: Optional[Phase2Config] = None,
) -> Phase2IntegrationOrchestrator:
    """
    Factory function to create and initialize the complete Phase 2 integration

    This is the main entry point for setting up all Phase 2 capabilities.
    """
    if config is None:
        config = Phase2Config()

    orchestrator = Phase2IntegrationOrchestrator(
        redis_service=redis_service,
        cache_manager=cache_manager,
        unified_pipeline=unified_pipeline,
        config=config,
    )

    # Initialize all services
    success = await orchestrator.initialize_all_services()

    if success:
        logger.info("Phase 2 integration ready for production use")
        return orchestrator
    else:
        raise RuntimeError("Phase 2 integration initialization failed")


# Convenience functions for common use cases


async def get_quick_prediction(
    orchestrator: Phase2IntegrationOrchestrator,
    player_data: Dict[str, Any],
    sport: str = "MLB",
) -> Dict[str, Any]:
    """Quick prediction for single player/game"""
    request = IntegratedPredictionRequest(
        input_data=player_data,
        prediction_type="single",
        sports=[sport],
        include_features=True,
        include_confidence=True,
        include_risk_assessment=False,
        enable_real_time_updates=False,
    )

    response = await orchestrator.get_integrated_predictions(request)

    return {
        "prediction": response.predictions[0] if response.predictions else None,
        "confidence": (
            list(response.confidence_scores.values())[0]
            if response.confidence_scores
            else 0.0
        ),
        "features_used": len(response.features),
        "computation_time_ms": response.computation_time_ms,
    }


async def get_batch_predictions(
    orchestrator: Phase2IntegrationOrchestrator,
    batch_data: List[Dict[str, Any]],
    sports: List[str] = ["MLB"],
) -> List[Dict[str, Any]]:
    """Batch predictions for multiple players/games"""
    results = []

    for data in batch_data:
        try:
            result = await get_quick_prediction(orchestrator, data, sports[0])
            results.append(result)
        except Exception as e:
            logger.error(f"Batch prediction failed for data item: {e}")
            results.append({"prediction": None, "confidence": 0.0, "error": str(e)})

    return results
