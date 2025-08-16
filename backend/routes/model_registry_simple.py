"""
ML Model Registry API - Simplified Implementation

Provides basic model registry functionality with lifecycle events.
"""

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from enum import Enum
from datetime import datetime, timezone
import uuid
import logging

from ..services.unified_logging import unified_logging

logger = unified_logging.logger
router = APIRouter(prefix="/api/models", tags=["ml-models", "registry"])


class ModelStage(str, Enum):
    """Model deployment stages"""
    DEVELOPMENT = "development"
    STAGING = "staging"  
    PRODUCTION = "production"
    ARCHIVED = "archived"


class ModelStatus(str, Enum):
    """Model operational status"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    DEPLOYING = "deploying"
    FAILED = "failed"


class ModelType(str, Enum):
    """Types of ML models"""
    TRANSFORMER = "transformer"
    ENSEMBLE = "ensemble"
    REGRESSION = "regression"
    CLASSIFICATION = "classification"


class ModelRegistryEntry(BaseModel):
    """Model registry entry"""
    model_id: str = Field(..., description="Unique model identifier")
    name: str = Field(..., description="Human-readable model name")
    version: str = Field(..., description="Model version")
    model_type: ModelType = Field(..., description="Type of ML model")
    stage: ModelStage = Field(..., description="Deployment stage")
    status: ModelStatus = Field(..., description="Operational status")
    description: str = Field("", description="Model description")
    author: str = Field(..., description="Model author/team")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    metrics: Optional[Dict[str, float]] = None
    

class ModelPromotionRequest(BaseModel):
    """Model promotion request"""
    model_id: str
    target_stage: ModelStage
    promoted_by: str
    reason: str = ""


# In-memory storage (would be replaced with database)
_model_registry: Dict[str, ModelRegistryEntry] = {}


async def _emit_lifecycle_event(event_type: str, data: Dict[str, Any]):
    """Emit model lifecycle event"""
    logger.info(f"Model lifecycle event: {event_type}", extra={
        "event_type": event_type,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "data": data
    })


@router.get("/registry", response_model=List[ModelRegistryEntry])
async def get_model_registry(stage: Optional[ModelStage] = None):
    """Get all registered models"""
    
    try:
        models = list(_model_registry.values())
        
        if stage:
            models = [model for model in models if model.stage == stage]
        
        logger.info(f"Retrieved {len(models)} models from registry", extra={
            "stage_filter": stage,
            "total_models": len(models)
        })
        
        return models
        
    except Exception as e:
        logger.error(f"Error retrieving model registry: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve model registry"
        )


@router.get("/registry/{model_id}", response_model=ModelRegistryEntry)
async def get_model(model_id: str):
    """Get specific model by ID"""
    
    try:
        if model_id not in _model_registry:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Model {model_id} not found"
            )
        
        return _model_registry[model_id]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving model {model_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve model"
        )


@router.post("/registry", response_model=ModelRegistryEntry)
async def register_model(model: ModelRegistryEntry):
    """Register new model"""
    
    try:
        # Check for duplicate model ID
        if model.model_id in _model_registry:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Model {model.model_id} already exists"
            )
        
        # Set timestamps
        model.created_at = datetime.now(timezone.utc)
        model.updated_at = datetime.now(timezone.utc)
        
        # Store model
        _model_registry[model.model_id] = model
        
        # Emit lifecycle event
        await _emit_lifecycle_event("model.registered", {
            "model_id": model.model_id,
            "version": model.version,
            "stage": model.stage,
            "author": model.author
        })
        
        logger.info(f"Model registered: {model.model_id} v{model.version}")
        return model
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error registering model: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to register model"
        )


@router.post("/registry/promote", response_model=ModelRegistryEntry)
async def promote_model(promotion: ModelPromotionRequest):
    """Promote model to higher stage"""
    
    try:
        if promotion.model_id not in _model_registry:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Model {promotion.model_id} not found"
            )
        
        model = _model_registry[promotion.model_id]
        
        # Validate stage progression
        stage_order = {
            ModelStage.DEVELOPMENT: 0,
            ModelStage.STAGING: 1,
            ModelStage.PRODUCTION: 2
        }
        
        current_order = stage_order.get(model.stage, -1)
        target_order = stage_order.get(promotion.target_stage, -1)
        
        if target_order <= current_order:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot promote from {model.stage} to {promotion.target_stage}"
            )
        
        # Update model
        old_stage = model.stage
        model.stage = promotion.target_stage
        model.status = ModelStatus.DEPLOYING
        model.updated_at = datetime.now(timezone.utc)
        
        # Emit lifecycle events
        await _emit_lifecycle_event("model.promoted", {
            "model_id": model.model_id,
            "version": model.version,
            "from_stage": old_stage,
            "to_stage": model.stage,
            "promoted_by": promotion.promoted_by,
            "reason": promotion.reason
        })
        
        # Simulate deployment
        model.status = ModelStatus.ACTIVE
        
        await _emit_lifecycle_event("model.deployed", {
            "model_id": model.model_id,
            "version": model.version,
            "stage": model.stage,
            "promoted_by": promotion.promoted_by
        })
        
        logger.info(f"Model promoted: {model.model_id} v{model.version} to {model.stage}")
        return model
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error promoting model: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to promote model"
        )


@router.post("/registry/{model_id}/rollback")
async def rollback_model(model_id: str, rollback_reason: str = ""):
    """Rollback model to previous stage"""
    
    try:
        if model_id not in _model_registry:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Model {model_id} not found"
            )
        
        model = _model_registry[model_id]
        old_stage = model.stage
        
        # Simple rollback logic - move to previous stage
        if model.stage == ModelStage.PRODUCTION:
            model.stage = ModelStage.STAGING
        elif model.stage == ModelStage.STAGING:
            model.stage = ModelStage.DEVELOPMENT
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot rollback from {model.stage}"
            )
        
        model.updated_at = datetime.now(timezone.utc)
        
        # Emit rollback event
        await _emit_lifecycle_event("model.rollback", {
            "model_id": model.model_id,
            "from_stage": old_stage,
            "to_stage": model.stage,
            "reason": rollback_reason
        })
        
        logger.info(f"Model rolled back: {model.model_id} from {old_stage} to {model.stage}")
        return {"message": f"Model rolled back from {old_stage} to {model.stage}"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error rolling back model: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to rollback model"
        )


# Initialize with some demo models
async def _initialize_demo_models():
    """Initialize registry with demo models"""
    
    demo_models = [
        ModelRegistryEntry(
            model_id="transformer-mlb-v1",
            name="MLB Transformer Model",
            version="1.0.0",
            model_type=ModelType.TRANSFORMER,
            stage=ModelStage.PRODUCTION,
            status=ModelStatus.ACTIVE,
            description="Transformer model for MLB player prop predictions",
            author="ML Team",
            metrics={"accuracy": 0.85, "f1_score": 0.82}
        ),
        ModelRegistryEntry(
            model_id="ensemble-nba-v2",
            name="NBA Ensemble Model",
            version="2.1.0",
            model_type=ModelType.ENSEMBLE,
            stage=ModelStage.STAGING,
            status=ModelStatus.ACTIVE,
            description="Ensemble model for NBA predictions",
            author="Research Team",
            metrics={"accuracy": 0.88, "f1_score": 0.85}
        ),
        ModelRegistryEntry(
            model_id="regression-nfl-dev",
            name="NFL Regression Model",
            version="0.5.0",
            model_type=ModelType.REGRESSION,
            stage=ModelStage.DEVELOPMENT,
            status=ModelStatus.ACTIVE,
            description="Development regression model for NFL props",
            author="Data Science Team",
            metrics={"mse": 2.3, "r2": 0.75}
        )
    ]
    
    for model in demo_models:
        if model.model_id not in _model_registry:
            _model_registry[model.model_id] = model


# Initialize demo models on startup
import asyncio
asyncio.create_task(_initialize_demo_models())