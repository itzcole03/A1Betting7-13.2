"""
Model Registry Service - Enterprise ML Model Management
Provides centralized model version management, status tracking, and lifecycle control
"""

import asyncio
import json
import time
from dataclasses import asdict, dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Dict, List, Optional, Set, Tuple
from uuid import uuid4
import logging

import redis
from backend.services.unified_logging import unified_logging
from backend.services.unified_cache_service import unified_cache_service
from backend.services.unified_error_handler import unified_error_handler


logger = unified_logging.get_logger("model_registry")


class ModelStatus(Enum):
    """Model deployment status"""
    DEVELOPMENT = "development"
    CANARY = "canary"
    STABLE = "stable"
    DEPRECATED = "deprecated"
    RETIRED = "retired"


class ModelType(Enum):
    """Model architecture types"""
    TRANSFORMER = "transformer"
    GRAPH_NEURAL_NETWORK = "gnn"
    ENSEMBLE = "ensemble"
    HYBRID = "hybrid"
    TRADITIONAL_ML = "traditional_ml"


@dataclass
class ModelMetadata:
    """Comprehensive model metadata"""
    model_id: str
    name: str
    version: str
    model_type: ModelType
    status: ModelStatus
    description: str
    sport: str
    
    # Performance metrics
    accuracy: Optional[float] = None
    precision: Optional[float] = None
    recall: Optional[float] = None
    f1_score: Optional[float] = None
    
    # Operational metadata
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    created_by: str = "system"
    
    # Deployment info
    deployment_target: str = "production"
    resource_requirements: Dict[str, Any] = field(default_factory=dict)
    dependencies: List[str] = field(default_factory=list)
    
    # Validation info
    validation_score: Optional[float] = None
    last_validated: Optional[datetime] = None
    validation_notes: str = ""
    
    # Feature flags
    feature_flag_id: Optional[str] = None
    rollout_percentage: float = 0.0
    
    # Retention policy
    retention_days: int = 90


@dataclass
class ModelPerformanceMetrics:
    """Real-time model performance tracking"""
    model_id: str
    
    # Inference timing metrics
    total_inferences: int = 0
    total_inference_time_ms: float = 0.0
    min_inference_time_ms: float = float('inf')
    max_inference_time_ms: float = 0.0
    
    # Success/failure tracking
    successful_inferences: int = 0
    failed_inferences: int = 0
    
    # Percentile tracking (stored as list of recent timings)
    recent_timings: List[float] = field(default_factory=list)
    max_timing_samples: int = 10000
    
    # Error tracking
    error_types: Dict[str, int] = field(default_factory=dict)
    last_error: Optional[str] = None
    last_error_time: Optional[datetime] = None
    
    # Time window tracking
    last_updated: datetime = field(default_factory=datetime.utcnow)


class ModelRegistryService:
    """Enterprise model registry with comprehensive lifecycle management"""
    
    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.redis_client = None
        self.redis_url = redis_url
        self._models: Dict[str, ModelMetadata] = {}
        self._performance_metrics: Dict[str, ModelPerformanceMetrics] = {}
        self._lock = asyncio.Lock()
        
        # Initialize Redis connection
        self._initialize_redis()
        
        # Load existing models from persistence
        asyncio.create_task(self._load_models_from_persistence())
    
    def _initialize_redis(self):
        """Initialize Redis connection with fallback"""
        try:
            self.redis_client = redis.from_url(
                self.redis_url, 
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5
            )
            self.redis_client.ping()
            logger.info("SUCCESS: Redis connection established for model registry")
        except Exception as e:
            logger.warning(f"WARNING: Redis unavailable, using in-memory storage: {e}")
            self.redis_client = None
    
    async def _load_models_from_persistence(self):
        """Load models from Redis persistence"""
        try:
            if not self.redis_client:
                logger.info("No Redis client, skipping model persistence load")
                return
                
            # Load model metadata
            model_keys = self.redis_client.keys("model:metadata:*")
            for key in model_keys:
                model_data = self.redis_client.hgetall(key)
                if model_data:
                    model_id = key.split(":")[-1]
                    
                    # Deserialize model metadata
                    model_metadata = ModelMetadata(
                        model_id=model_id,
                        name=model_data.get("name", ""),
                        version=model_data.get("version", "1.0.0"),
                        model_type=ModelType(model_data.get("model_type", "transformer")),
                        status=ModelStatus(model_data.get("status", "development")),
                        description=model_data.get("description", ""),
                        sport=model_data.get("sport", "MLB"),
                        created_at=datetime.fromisoformat(model_data.get("created_at", datetime.utcnow().isoformat())),
                        updated_at=datetime.fromisoformat(model_data.get("updated_at", datetime.utcnow().isoformat())),
                        created_by=model_data.get("created_by", "system"),
                        deployment_target=model_data.get("deployment_target", "production"),
                        feature_flag_id=model_data.get("feature_flag_id"),
                        rollout_percentage=float(model_data.get("rollout_percentage", 0.0)),
                        retention_days=int(model_data.get("retention_days", 90))
                    )
                    
                    # Parse JSON fields
                    if model_data.get("resource_requirements"):
                        model_metadata.resource_requirements = json.loads(model_data["resource_requirements"])
                    if model_data.get("dependencies"):
                        model_metadata.dependencies = json.loads(model_data["dependencies"])
                    
                    self._models[model_id] = model_metadata
            
            # Load performance metrics
            metrics_keys = self.redis_client.keys("model:metrics:*")
            for key in metrics_keys:
                metrics_data = self.redis_client.hgetall(key)
                if metrics_data:
                    model_id = key.split(":")[-1]
                    
                    metrics = ModelPerformanceMetrics(
                        model_id=model_id,
                        total_inferences=int(metrics_data.get("total_inferences", 0)),
                        total_inference_time_ms=float(metrics_data.get("total_inference_time_ms", 0.0)),
                        successful_inferences=int(metrics_data.get("successful_inferences", 0)),
                        failed_inferences=int(metrics_data.get("failed_inferences", 0)),
                        last_updated=datetime.fromisoformat(metrics_data.get("last_updated", datetime.utcnow().isoformat()))
                    )
                    
                    # Load recent timings
                    timings_key = f"model:timings:{model_id}"
                    timings = self.redis_client.lrange(timings_key, 0, -1)
                    metrics.recent_timings = [float(t) for t in timings]
                    
                    # Load error types
                    if metrics_data.get("error_types"):
                        metrics.error_types = json.loads(metrics_data["error_types"])
                    
                    self._performance_metrics[model_id] = metrics
            
            logger.info(f"SUCCESS: Loaded {len(self._models)} models from persistence")
            
        except Exception as e:
            unified_error_handler.handle_error(
                error=e,
                context="model_registry_load_persistence",
                user_context={"operation": "load_models"}
            )
    
    async def register_model(self, metadata: ModelMetadata) -> str:
        """Register a new model in the registry"""
        async with self._lock:
            try:
                # Validate model metadata
                self._validate_model_metadata(metadata)
                
                # Generate unique model ID if not provided
                if not metadata.model_id:
                    metadata.model_id = f"{metadata.sport.lower()}_model_{uuid4().hex[:8]}"
                
                # Set timestamps
                metadata.created_at = datetime.utcnow()
                metadata.updated_at = datetime.utcnow()
                
                # Store in memory
                self._models[metadata.model_id] = metadata
                
                # Initialize performance metrics
                self._performance_metrics[metadata.model_id] = ModelPerformanceMetrics(
                    model_id=metadata.model_id
                )
                
                # Persist to Redis
                await self._persist_model_metadata(metadata)
                
                logger.info(f"SUCCESS: Registered model {metadata.model_id} ({metadata.name} v{metadata.version})")
                
                return metadata.model_id
                
            except Exception as e:
                unified_error_handler.handle_error(
                    error=e,
                    context="model_registry_register",
                    user_context={"model_id": metadata.model_id, "model_name": metadata.name}
                )
                raise
    
    def _validate_model_metadata(self, metadata: ModelMetadata):
        """Validate model metadata for registration"""
        if not metadata.name:
            raise ValueError("Model name is required")
        if not metadata.version:
            raise ValueError("Model version is required")
        if not metadata.sport:
            raise ValueError("Sport specification is required")
        if metadata.rollout_percentage < 0 or metadata.rollout_percentage > 100:
            raise ValueError("Rollout percentage must be between 0 and 100")
    
    async def _persist_model_metadata(self, metadata: ModelMetadata):
        """Persist model metadata to Redis"""
        if not self.redis_client:
            return
            
        try:
            key = f"model:metadata:{metadata.model_id}"
            
            # Convert to dict for Redis storage
            data = asdict(metadata)
            
            # Handle datetime serialization
            data["created_at"] = metadata.created_at.isoformat()
            data["updated_at"] = metadata.updated_at.isoformat()
            if metadata.last_validated:
                data["last_validated"] = metadata.last_validated.isoformat()
            
            # Convert enums to strings
            data["model_type"] = metadata.model_type.value
            data["status"] = metadata.status.value
            
            # Serialize complex fields as JSON
            data["resource_requirements"] = json.dumps(metadata.resource_requirements)
            data["dependencies"] = json.dumps(metadata.dependencies)
            
            # Store in Redis hash
            self.redis_client.hmset(key, data)
            
            # Set expiration based on retention policy
            self.redis_client.expire(key, metadata.retention_days * 24 * 3600)
            
        except Exception as e:
            logger.error(f"Failed to persist model metadata: {e}")
    
    async def update_model_status(self, model_id: str, status: ModelStatus) -> bool:
        """Update model status with validation"""
        async with self._lock:
            if model_id not in self._models:
                logger.warning(f"Model {model_id} not found for status update")
                return False
            
            old_status = self._models[model_id].status
            self._models[model_id].status = status
            self._models[model_id].updated_at = datetime.utcnow()
            
            # Persist changes
            await self._persist_model_metadata(self._models[model_id])
            
            logger.info(f"SUCCESS: Updated model {model_id} status: {old_status.value} → {status.value}")
            return True
    
    def get_model(self, model_id: str) -> Optional[ModelMetadata]:
        """Get model metadata by ID"""
        return self._models.get(model_id)
    
    def list_models(self, 
                   status: Optional[ModelStatus] = None,
                   model_type: Optional[ModelType] = None,
                   sport: Optional[str] = None) -> List[ModelMetadata]:
        """List models with optional filtering"""
        models = list(self._models.values())
        
        if status:
            models = [m for m in models if m.status == status]
        if model_type:
            models = [m for m in models if m.model_type == model_type]
        if sport:
            models = [m for m in models if m.sport.lower() == sport.lower()]
        
        # Sort by creation date (newest first)
        models.sort(key=lambda x: x.created_at, reverse=True)
        
        return models
    
    async def record_inference_timing(self, model_id: str, timing_ms: float, success: bool = True, error: Optional[str] = None):
        """Record inference timing and success/failure"""
        if model_id not in self._performance_metrics:
            self._performance_metrics[model_id] = ModelPerformanceMetrics(model_id=model_id)
        
        metrics = self._performance_metrics[model_id]
        
        async with self._lock:
            # Update timing statistics
            metrics.total_inferences += 1
            
            if success:
                metrics.successful_inferences += 1
                metrics.total_inference_time_ms += timing_ms
                metrics.min_inference_time_ms = min(metrics.min_inference_time_ms, timing_ms)
                metrics.max_inference_time_ms = max(metrics.max_inference_time_ms, timing_ms)
                
                # Store timing for percentile calculation
                metrics.recent_timings.append(timing_ms)
                if len(metrics.recent_timings) > metrics.max_timing_samples:
                    metrics.recent_timings = metrics.recent_timings[-metrics.max_timing_samples:]
                
            else:
                metrics.failed_inferences += 1
                if error:
                    metrics.error_types[error] = metrics.error_types.get(error, 0) + 1
                    metrics.last_error = error
                    metrics.last_error_time = datetime.utcnow()
            
            metrics.last_updated = datetime.utcnow()
            
            # Persist metrics to Redis
            await self._persist_performance_metrics(metrics)
    
    async def _persist_performance_metrics(self, metrics: ModelPerformanceMetrics):
        """Persist performance metrics to Redis"""
        if not self.redis_client:
            return
            
        try:
            key = f"model:metrics:{metrics.model_id}"
            
            # Store basic metrics in hash
            data = {
                "total_inferences": metrics.total_inferences,
                "total_inference_time_ms": metrics.total_inference_time_ms,
                "successful_inferences": metrics.successful_inferences,
                "failed_inferences": metrics.failed_inferences,
                "last_updated": metrics.last_updated.isoformat(),
                "error_types": json.dumps(metrics.error_types)
            }
            
            if metrics.last_error:
                data["last_error"] = metrics.last_error
            if metrics.last_error_time:
                data["last_error_time"] = metrics.last_error_time.isoformat()
            
            self.redis_client.hmset(key, data)
            
            # Store recent timings in separate list
            timings_key = f"model:timings:{metrics.model_id}"
            if metrics.recent_timings:
                # Clear old timings and add new ones
                self.redis_client.delete(timings_key)
                self.redis_client.lpush(timings_key, *metrics.recent_timings)
                # Keep only recent timings
                self.redis_client.ltrim(timings_key, 0, metrics.max_timing_samples - 1)
            
            # Set expiration
            self.redis_client.expire(key, 7 * 24 * 3600)  # 7 days for metrics
            self.redis_client.expire(timings_key, 7 * 24 * 3600)
            
        except Exception as e:
            logger.error(f"Failed to persist performance metrics: {e}")
    
    def get_performance_metrics(self, model_id: str) -> Optional[ModelPerformanceMetrics]:
        """Get performance metrics for a model"""
        return self._performance_metrics.get(model_id)
    
    def calculate_percentiles(self, model_id: str) -> Dict[str, float]:
        """Calculate p50, p95, p99 percentiles for inference timing"""
        metrics = self._performance_metrics.get(model_id)
        if not metrics or not metrics.recent_timings:
            return {"p50": 0.0, "p95": 0.0, "p99": 0.0}
        
        timings = sorted(metrics.recent_timings)
        n = len(timings)
        
        return {
            "p50": timings[int(n * 0.5)] if n > 0 else 0.0,
            "p95": timings[int(n * 0.95)] if n > 0 else 0.0,
            "p99": timings[int(n * 0.99)] if n > 0 else 0.0,
        }
    
    def get_model_health_summary(self, model_id: str) -> Dict[str, Any]:
        """Get comprehensive health summary for a model"""
        model = self.get_model(model_id)
        metrics = self.get_performance_metrics(model_id)
        
        if not model:
            return {"error": "Model not found"}
        
        summary = {
            "model_id": model_id,
            "name": model.name,
            "version": model.version,
            "status": model.status.value,
            "health_status": "unknown"
        }
        
        if metrics:
            success_rate = (
                metrics.successful_inferences / metrics.total_inferences * 100 
                if metrics.total_inferences > 0 else 0
            )
            
            avg_timing = (
                metrics.total_inference_time_ms / metrics.successful_inferences
                if metrics.successful_inferences > 0 else 0
            )
            
            percentiles = self.calculate_percentiles(model_id)
            
            summary.update({
                "total_inferences": metrics.total_inferences,
                "success_rate": round(success_rate, 2),
                "average_timing_ms": round(avg_timing, 2),
                "percentiles": percentiles,
                "error_types": metrics.error_types,
                "last_updated": metrics.last_updated.isoformat(),
                "health_status": self._determine_health_status(success_rate, avg_timing)
            })
        
        return summary
    
    def _determine_health_status(self, success_rate: float, avg_timing: float) -> str:
        """Determine overall health status based on metrics"""
        if success_rate >= 95 and avg_timing < 1000:  # < 1 second
            return "healthy"
        elif success_rate >= 80 and avg_timing < 5000:  # < 5 seconds
            return "degraded"
        else:
            return "unhealthy"
    
    async def cleanup_expired_models(self):
        """Clean up expired models based on retention policy"""
        expired_models = []
        current_time = datetime.utcnow()
        
        for model_id, model in self._models.items():
            retention_cutoff = model.created_at + timedelta(days=model.retention_days)
            if current_time > retention_cutoff and model.status == ModelStatus.RETIRED:
                expired_models.append(model_id)
        
        for model_id in expired_models:
            await self._remove_model(model_id)
        
        if expired_models:
            logger.info(f"CLEANUP: Cleaned up {len(expired_models)} expired models")
    
    async def _remove_model(self, model_id: str):
        """Remove model from registry and persistence"""
        # Remove from memory
        self._models.pop(model_id, None)
        self._performance_metrics.pop(model_id, None)
        
        # Remove from Redis
        if self.redis_client:
            self.redis_client.delete(f"model:metadata:{model_id}")
            self.redis_client.delete(f"model:metrics:{model_id}")
            self.redis_client.delete(f"model:timings:{model_id}")


# Global singleton instance
_model_registry_service = None


def get_model_registry_service() -> ModelRegistryService:
    """Get global model registry service instance"""
    global _model_registry_service
    if _model_registry_service is None:
        _model_registry_service = ModelRegistryService()
    return _model_registry_service