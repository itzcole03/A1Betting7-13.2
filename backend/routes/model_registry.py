"""
ML Model Registry API

Provides model lifecycle management with versioning, A/B testing,
and deployment automation.

Acceptance Criteria:
- GET /api/models/registry returns all registered models
- POST /api/models/registry/promote for model promotion
- Lifecycle events: model.deployed, model.rollback, model.promoted
- Model versioning with semantic versions
- A/B testing configuration
"""

from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from enum import Enum
from datetime import datetime, timezone
import uuid
try:
    import semver
except ImportError:
    # Fallback if semver not available
    class MockSemver:
        @staticmethod
        def parse(version: str):
            parts = version.split('.')
            if len(parts) != 3 or not all(part.isdigit() for part in parts):
                raise ValueError("Invalid version format")
            return {"major": int(parts[0]), "minor": int(parts[1]), "patch": int(parts[2])}
    
    class VersionInfo:
        @staticmethod
        def parse(version: str):
            return MockSemver.parse(version)
    
    semver = MockSemver()
    semver.VersionInfo = VersionInfo
import logging
from dataclasses import dataclass, asdict

from ..services.unified_logging import unified_logging
from ..services.unified_cache_service import unified_cache_service
from ..services.unified_error_handler import unified_error_handler, ErrorContext
from ..services.modern_ml_service import modern_ml_service

logger = unified_logging.logger
router = APIRouter(prefix="/api/models", tags=["ml-models", "registry"])


class ModelStage(str, Enum):
    """Model deployment stages"""
    DEVELOPMENT = "development"
    STAGING = "staging"  
    PRODUCTION = "production"
    ARCHIVED = "archived"
    ROLLBACK = "rollback"


class ModelStatus(str, Enum):
    """Model operational status"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    DEPLOYING = "deploying"
    FAILED = "failed"
    TESTING = "testing"


class ModelType(str, Enum):
    """Types of ML models"""
    TRANSFORMER = "transformer"
    ENSEMBLE = "ensemble"
    REGRESSION = "regression"
    CLASSIFICATION = "classification"
    RECOMMENDATION = "recommendation"


@dataclass
class ModelMetrics:
    """Model performance metrics"""
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    latency_ms: float
    throughput_rps: float
    error_rate: float
    last_updated: datetime


@dataclass
class ABTestConfig:
    """A/B testing configuration"""
    experiment_id: str
    traffic_split: Dict[str, float]  # model_version -> percentage
    start_date: datetime
    end_date: Optional[datetime]
    success_metrics: List[str]
    is_active: bool


class ModelRegistryEntry(BaseModel):
    """Model registry entry"""
    model_id: str = Field(..., description="Unique model identifier")
    name: str = Field(..., description="Human-readable model name")
    version: str = Field(..., description="Semantic version (e.g., '1.2.3')")
    model_type: ModelType = Field(..., description="Type of ML model")
    stage: ModelStage = Field(..., description="Deployment stage")
    status: ModelStatus = Field(..., description="Operational status")
    
    # Metadata
    description: str = Field("", description="Model description")
    tags: List[str] = Field(default_factory=list, description="Model tags")
    author: str = Field(..., description="Model author/team")
    
    # Deployment info
    deployed_at: Optional[datetime] = None
    deployed_by: Optional[str] = None
    deployment_config: Dict[str, Any] = Field(default_factory=dict)
    
    # Performance metrics
    metrics: Optional[Dict[str, float]] = None
    
    # A/B testing
    ab_test_config: Optional[Dict[str, Any]] = None
    
    # Lifecycle
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ModelPromotionRequest(BaseModel):
    """Model promotion request"""
    model_id: str
    target_stage: ModelStage
    promoted_by: str
    reason: str = ""
    deployment_config: Dict[str, Any] = Field(default_factory=dict)
    rollback_enabled: bool = True
    
    
class ModelRollbackRequest(BaseModel):
    """Model rollback request"""
    model_id: str
    target_version: str
    rollback_by: str
    reason: str


class ModelRegistryService:
    """Service for managing ML model registry"""
    
    def __init__(self):
        self.cache_ttl = 300  # 5 minutes
        
    async def get_all_models(self, stage: Optional[ModelStage] = None) -> List[ModelRegistryEntry]:
        """Get all models, optionally filtered by stage"""
        
        cache_key = f"model_registry:all:{stage or 'all'}"
        cached_models = unified_cache_service.get(cache_key)
        
        if cached_models:
            return [ModelRegistryEntry(**model) for model in cached_models]
            
        try:
            # Get models from modern ML service
            ml_models = await modern_ml_service.list_models()
            
            registry_models = []
            for ml_model in ml_models:
                registry_entry = ModelRegistryEntry(
                    model_id=ml_model.get("id", str(uuid.uuid4())),
                    name=ml_model.get("name", "Unknown Model"),
                    version=ml_model.get("version", "1.0.0"),
                    model_type=ModelType(ml_model.get("type", "classification")),
                    stage=ModelStage(ml_model.get("stage", "development")),
                    status=ModelStatus(ml_model.get("status", "active")),
                    description=ml_model.get("description", ""),
                    author=ml_model.get("author", "Unknown"),
                    metrics=ml_model.get("metrics", {}),
                    deployment_config=ml_model.get("config", {})
                )
                
                if not stage or registry_entry.stage == stage:
                    registry_models.append(registry_entry)
            
            # Cache the results
            unified_cache_service.set(
                cache_key,
                [model.dict() for model in registry_models],
                ttl=self.cache_ttl
            )
            
            return registry_models
            
        except Exception as e:
            logger.error(f"Error fetching models: {e}")
            return []
    
    async def get_model(self, model_id: str) -> Optional[ModelRegistryEntry]:
        """Get specific model by ID"""
        
        cache_key = f"model_registry:{model_id}"
        cached_model = unified_cache_service.get(cache_key)
        
        if cached_model:
            return ModelRegistryEntry(**cached_model)
            
        models = await self.get_all_models()
        for model in models:
            if model.model_id == model_id:
                # Cache the specific model
                unified_cache_service.set(
                    cache_key,
                    model.dict(),
                    ttl=self.cache_ttl
                )
                return model
        
        return None
    
    async def register_model(self, model_entry: ModelRegistryEntry) -> ModelRegistryEntry:
        """Register new model"""
        
        # Validate version format
        try:
            semver.VersionInfo.parse(model_entry.version)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid semantic version: {model_entry.version}"
            )
        
        # Check for duplicate model ID
        existing_model = await self.get_model(model_entry.model_id)
        if existing_model:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Model {model_entry.model_id} already exists"
            )
        
        # Set timestamps
        model_entry.created_at = datetime.now(timezone.utc)
        model_entry.updated_at = datetime.now(timezone.utc)
        
        # Store model (this would integrate with actual model storage)
        cache_key = f"model_registry:{model_entry.model_id}"
        unified_cache_service.set(
            cache_key,
            model_entry.dict(),
            ttl=self.cache_ttl * 4  # Longer TTL for registered models
        )
        
        # Invalidate list cache
        self._invalidate_list_cache()
        
        # Emit lifecycle event
        await self._emit_lifecycle_event("model.registered", {
            "model_id": model_entry.model_id,
            "version": model_entry.version,
            "stage": model_entry.stage,
            "author": model_entry.author
        })
        
        logger.info(f"Model registered: {model_entry.model_id} v{model_entry.version}")
        return model_entry
    
    async def promote_model(self, promotion_request: ModelPromotionRequest) -> ModelRegistryEntry:
        """Promote model to higher stage"""
        
        model = await self.get_model(promotion_request.model_id)
        if not model:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Model {promotion_request.model_id} not found"
            )
        
        # Validate stage progression
        stage_order = {
            ModelStage.DEVELOPMENT: 0,
            ModelStage.STAGING: 1,
            ModelStage.PRODUCTION: 2
        }
        
        current_order = stage_order.get(model.stage, -1)
        target_order = stage_order.get(promotion_request.target_stage, -1)
        
        if target_order <= current_order and promotion_request.target_stage != ModelStage.ROLLBACK:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot promote from {model.stage} to {promotion_request.target_stage}"
            )
        
        # Store previous state for potential rollback
        if promotion_request.rollback_enabled:
            await self._store_rollback_state(model)
        
        # Update model
        old_stage = model.stage
        model.stage = promotion_request.target_stage
        model.status = ModelStatus.DEPLOYING
        model.deployed_by = promotion_request.promoted_by
        model.deployed_at = datetime.now(timezone.utc)
        model.updated_at = datetime.now(timezone.utc)
        model.deployment_config.update(promotion_request.deployment_config)
        
        # Update cache
        cache_key = f"model_registry:{model.model_id}"
        unified_cache_service.set(
            cache_key,
            model.dict(),
            ttl=self.cache_ttl * 4
        )
        
        self._invalidate_list_cache()
        
        # Emit lifecycle events
        await self._emit_lifecycle_event("model.promoted", {
            "model_id": model.model_id,
            "version": model.version,
            "from_stage": old_stage,
            "to_stage": model.stage,
            "promoted_by": promotion_request.promoted_by,
            "reason": promotion_request.reason
        })
        
        # Simulate deployment process
        try:
            await self._deploy_model(model)
            model.status = ModelStatus.ACTIVE
            
            await self._emit_lifecycle_event("model.deployed", {
                "model_id": model.model_id,
                "version": model.version,
                "stage": model.stage,
                "deployed_by": promotion_request.promoted_by
            })
            
        except Exception as e:
            model.status = ModelStatus.FAILED
            
            await self._emit_lifecycle_event("model.deployment_failed", {
                "model_id": model.model_id,
                "version": model.version,
                "stage": model.stage,
                "error": str(e)
            })
            
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Model deployment failed: {str(e)}"
            )
        
        # Update final status
        unified_cache_service.set(
            cache_key,
            model.dict(),
            ttl=self.cache_ttl * 4
        )
        
        logger.info(f"Model promoted: {model.model_id} v{model.version} to {model.stage}")
        return model
    
    async def rollback_model(self, rollback_request: ModelRollbackRequest) -> ModelRegistryEntry:
        """Rollback model to previous version"""
        
        model = await self.get_model(rollback_request.model_id)
        if not model:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Model {rollback_request.model_id} not found"
            )
        
        # Get rollback state
        rollback_state = await self._get_rollback_state(rollback_request.model_id)
        if not rollback_state:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"No rollback state available for {rollback_request.model_id}"
            )
        
        # Update model to rollback state
        old_version = model.version
        model.version = rollback_request.target_version
        model.stage = ModelStage.ROLLBACK
        model.status = ModelStatus.DEPLOYING
        model.updated_at = datetime.now(timezone.utc)
        
        # Update cache
        cache_key = f"model_registry:{model.model_id}"
        unified_cache_service.set(
            cache_key,
            model.dict(),
            ttl=self.cache_ttl * 4
        )
        
        self._invalidate_list_cache()
        
        # Emit rollback event
        await self._emit_lifecycle_event("model.rollback", {
            "model_id": model.model_id,
            "from_version": old_version,
            "to_version": model.version,
            "rollback_by": rollback_request.rollback_by,
            "reason": rollback_request.reason
        })
        
        logger.info(f"Model rolled back: {model.model_id} from v{old_version} to v{model.version}")
        return model
    
    async def setup_ab_test(self, model_id: str, ab_config: ABTestConfig) -> ModelRegistryEntry:
        """Setup A/B test for model"""
        
        model = await self.get_model(model_id)
        if not model:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Model {model_id} not found"
            )
        
        # Validate traffic split sums to 100%
        total_traffic = sum(ab_config.traffic_split.values())
        if abs(total_traffic - 1.0) > 0.001:  # Allow small floating point errors
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Traffic split must sum to 1.0, got {total_traffic}"
            )
        
        # Update model with A/B test config
        model.ab_test_config = asdict(ab_config)
        model.updated_at = datetime.now(timezone.utc)
        
        # Update cache
        cache_key = f"model_registry:{model.model_id}"
        unified_cache_service.set(
            cache_key,
            model.dict(),
            ttl=self.cache_ttl * 4
        )
        
        # Emit A/B test event
        await self._emit_lifecycle_event("model.ab_test_started", {
            "model_id": model.model_id,
            "experiment_id": ab_config.experiment_id,
            "traffic_split": ab_config.traffic_split
        })
        
        logger.info(f"A/B test setup for model: {model.model_id} experiment: {ab_config.experiment_id}")
        return model
    
    async def _deploy_model(self, model: ModelRegistryEntry):
        """Deploy model (placeholder implementation)"""
        # This would integrate with actual model deployment system
        # For now, simulate deployment delay
        import asyncio
        await asyncio.sleep(1)
        
        logger.info(f"Model deployed: {model.model_id} v{model.version}")
    
    async def _store_rollback_state(self, model: ModelRegistryEntry):
        """Store model state for potential rollback"""
        rollback_key = f"rollback:{model.model_id}"
        unified_cache_service.set(
            rollback_key,
            model.dict(),
            ttl=86400  # 24 hours
        )
    
    async def _get_rollback_state(self, model_id: str) -> Optional[Dict[str, Any]]:
        """Get stored rollback state"""
        rollback_key = f"rollback:{model_id}"
        return unified_cache_service.get(rollback_key)
    
    def _invalidate_list_cache(self):
        """Invalidate model list caches"""
        for stage in [None] + list(ModelStage):
            cache_key = f"model_registry:all:{stage or 'all'}"
            unified_cache_service.delete(cache_key)
    
    async def _emit_lifecycle_event(self, event_type: str, data: Dict[str, Any]):
        """Emit model lifecycle event"""
        event_data = {
            "type": event_type,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "data": data
        }
        
        # This would integrate with event bus system
        logger.info(f"Model lifecycle event: {event_type}", extra=event_data)


# Service instance
model_registry_service = ModelRegistryService()


@router.get("/registry", response_model=List[ModelRegistryEntry])
async def get_model_registry(stage: Optional[ModelStage] = None):
    """Get all registered models"""
    
    try:
        models = await model_registry_service.get_all_models(stage)
        
        logger.info(f"Retrieved {len(models)} models from registry", extra={
            "stage_filter": stage,
            "total_models": len(models)
        })
        
        return models
        
    except Exception as e:
        logger.error(f"Error retrieving model registry: {e}")
        unified_error_handler.handle_error(
            e,
            ErrorContext(endpoint="/api/models/registry", method="GET")
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve model registry"
        )


@router.get("/registry/{model_id}", response_model=ModelRegistryEntry)
async def get_model(model_id: str):
    """Get specific model by ID"""
    
    try:
        model = await model_registry_service.get_model(model_id)
        
        if not model:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Model {model_id} not found"
            )
        
        return model
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving model {model_id}: {e}")
        unified_error_handler.handle_error(
            e,
            ErrorContext(endpoint=f"/api/models/registry/{model_id}", method="GET")
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve model"
        )


@router.post("/registry", response_model=ModelRegistryEntry)
async def register_model(model: ModelRegistryEntry):
    """Register new model"""
    
    try:
        registered_model = await model_registry_service.register_model(model)
        return registered_model
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error registering model: {e}")
        unified_error_handler.handle_error(
            e,
            ErrorContext(endpoint="/api/models/registry", method="POST")
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to register model"
        )


@router.post("/registry/promote", response_model=ModelRegistryEntry)
async def promote_model(promotion: ModelPromotionRequest):
    """Promote model to higher stage"""
    
    try:
        promoted_model = await model_registry_service.promote_model(promotion)
        return promoted_model
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error promoting model: {e}")
        unified_error_handler.handle_error(
            e,
            ErrorContext(endpoint="/api/models/registry/promote", method="POST")
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to promote model"
        )


@router.post("/registry/rollback", response_model=ModelRegistryEntry)
async def rollback_model(rollback: ModelRollbackRequest):
    """Rollback model to previous version"""
    
    try:
        rolled_back_model = await model_registry_service.rollback_model(rollback)
        return rolled_back_model
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error rolling back model: {e}")
        unified_error_handler.handle_error(
            e,
            ErrorContext(endpoint="/api/models/registry/rollback", method="POST")
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to rollback model"
        )


@router.post("/registry/{model_id}/ab-test", response_model=ModelRegistryEntry)
async def setup_ab_test(model_id: str, ab_config: ABTestConfig):
    """Setup A/B test for model"""
    
    try:
        updated_model = await model_registry_service.setup_ab_test(model_id, ab_config)
        return updated_model
        
    except HTTPException:
        raise  
    except Exception as e:
        logger.error(f"Error setting up A/B test: {e}")
        unified_error_handler.handle_error(
            e,
            ErrorContext(endpoint=f"/api/models/registry/{model_id}/ab-test", method="POST")
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to setup A/B test"
        )