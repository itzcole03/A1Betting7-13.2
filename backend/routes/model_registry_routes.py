"""
ML Model Registry Routes - Complete CRUD operations for model management
Provides model lifecycle management with metadata, versioning, and evaluation uploads
"""

import json
import logging
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Any
from io import BytesIO

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, Query

# Contract compliance imports
from ..core.response_models import ResponseBuilder, StandardAPIResponse
from ..core.exceptions import BusinessLogicException, AuthenticationException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from backend.services.mlops_pipeline_service import get_mlops_service, MLOpsPipelineService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/models", tags=["Model Registry"])

# Pydantic models for API
class ModelMetadata(BaseModel):
    """Model metadata for registry"""
    name: str = Field(..., description="Model name")
    version: str = Field(..., description="Model version")
    description: str = Field("", description="Model description")
    model_type: str = Field(..., description="Model type (transformer, ensemble, etc.)")
    framework: str = Field("pytorch", description="ML framework used")
    sport: str = Field("MLB", description="Target sport")
    created_by: str = Field("system", description="Model creator")
    tags: List[str] = Field([], description="Model tags")
    hyperparameters: Dict[str, Any] = Field({}, description="Model hyperparameters")
    training_config: Dict[str, Any] = Field({}, description="Training configuration")

class ModelCreateRequest(BaseModel):
    """Request for creating a new model"""
    metadata: ModelMetadata
    model_file_path: Optional[str] = None
    initial_metrics: Optional[Dict[str, float]] = None

class ModelUpdateRequest(BaseModel):
    """Request for updating model metadata"""
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    status: Optional[str] = None
    hyperparameters: Optional[Dict[str, Any]] = None

class ModelResponse(BaseModel):
    """Response model for model information"""
    id: str
    name: str
    version: str
    description: str
    model_type: str
    framework: str
    sport: str
    status: str
    created_by: str
    created_at: datetime
    updated_at: datetime
    tags: List[str]
    hyperparameters: Dict[str, Any]
    training_config: Dict[str, Any]
    metrics: Dict[str, float]
    evaluation_history: List[Dict]

class ModelListResponse(BaseModel):
    """Response for model listing"""
    models: List[ModelResponse]
    total_count: int
    page: int
    page_size: int

class EvaluationUploadResponse(BaseModel):
    """Response for evaluation upload"""
    evaluation_id: str
    model_id: str
    metrics: Dict[str, float]
    uploaded_at: datetime
    status: str

@router.get("/", response_model=ModelListResponse)
async def list_models(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Page size"),
    model_type: Optional[str] = Query(None, description="Filter by model type"),
    sport: Optional[str] = Query(None, description="Filter by sport"),
    status: Optional[str] = Query(None, description="Filter by status"),
    search: Optional[str] = Query(None, description="Search query"),
    mlops_service: MLOpsPipelineService = Depends(get_mlops_service)
):
    """
    List all models with pagination and filtering
    
    Returns paginated list of models with metadata, metrics, and status information.
    Supports filtering by type, sport, status, and text search.
    """
    try:
        # Get models from registry
        all_models = await mlops_service.list_models()
        
        # Apply filters
        filtered_models = []
        for model in all_models:
            # Type filter
            if model_type and model.get('model_type') != model_type:
                continue
            # Sport filter
            if sport and model.get('sport') != sport:
                continue
            # Status filter
            if status and model.get('status') != status:
                continue
            # Search filter
            if search and search.lower() not in model.get('name', '').lower() and search.lower() not in model.get('description', '').lower():
                continue
            
            filtered_models.append(model)
        
        # Pagination
        total_count = len(filtered_models)
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        paginated_models = filtered_models[start_idx:end_idx]
        
        # Convert to response models
        model_responses = [
            ModelResponse(
                id=model.get('id', str(uuid.uuid4())),
                name=model.get('name', ''),
                version=model.get('version', '1.0.0'),
                description=model.get('description', ''),
                model_type=model.get('model_type', 'unknown'),
                framework=model.get('framework', 'pytorch'),
                sport=model.get('sport', 'MLB'),
                status=model.get('status', 'active'),
                created_by=model.get('created_by', 'system'),
                created_at=datetime.fromisoformat(model.get('created_at', datetime.now().isoformat())),
                updated_at=datetime.fromisoformat(model.get('updated_at', datetime.now().isoformat())),
                tags=model.get('tags', []),
                hyperparameters=model.get('hyperparameters', {}),
                training_config=model.get('training_config', {}),
                metrics=model.get('metrics', {}),
                evaluation_history=model.get('evaluation_history', [])
            )
            for model in paginated_models
        ]
        
        return ResponseBuilder.success(ModelListResponse(
            models=model_responses,
            total_count=total_count,
            page=page,
            page_size=page_size
        ))
        
    except Exception as e:
        logger.error(f"Failed to list models: {e}")
        raise BusinessLogicException("Failed to retrieve models")

@router.get("/{model_id}", response_model=ModelResponse)
async def get_model(
    model_id: str,
    mlops_service: MLOpsPipelineService = Depends(get_mlops_service)
):
    """
    Get detailed information about a specific model
    
    Returns complete model metadata, metrics, evaluation history,
    and current deployment status.
    """
    try:
        model = await mlops_service.get_model_by_id(model_id)
        
        if not model:
            raise BusinessLogicException("f"Model {model_id} not found")
        
        return ResponseBuilder.success(ModelResponse(
            id=model.get('id', model_id)),
            name=model.get('name', ''),
            version=model.get('version', '1.0.0'),
            description=model.get('description', ''),
            model_type=model.get('model_type', 'unknown'),
            framework=model.get('framework', 'pytorch'),
            sport=model.get('sport', 'MLB'),
            status=model.get('status', 'active'),
            created_by=model.get('created_by', 'system'),
            created_at=datetime.fromisoformat(model.get('created_at', datetime.now().isoformat())),
            updated_at=datetime.fromisoformat(model.get('updated_at', datetime.now().isoformat())),
            tags=model.get('tags', []),
            hyperparameters=model.get('hyperparameters', {}),
            training_config=model.get('training_config', {}),
            metrics=model.get('metrics', {}),
            evaluation_history=model.get('evaluation_history', [])
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get model {model_id}: {e}")
        raise BusinessLogicException("Failed to retrieve model")

@router.post("/", response_model=ModelResponse, status_code=201)
async def create_model(
    request: ModelCreateRequest,
    mlops_service: MLOpsPipelineService = Depends(get_mlops_service)
):
    """
    Create a new model in the registry
    
    Creates a new model entry with metadata, optional initial metrics,
    and assigns a unique model ID for tracking.
    """
    try:
        # Generate model ID
        model_id = str(uuid.uuid4())
        
        # Prepare model data
        model_data = {
            'id': model_id,
            'name': request.metadata.name,
            'version': request.metadata.version,
            'description': request.metadata.description,
            'model_type': request.metadata.model_type,
            'framework': request.metadata.framework,
            'sport': request.metadata.sport,
            'status': 'created',
            'created_by': request.metadata.created_by,
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat(),
            'tags': request.metadata.tags,
            'hyperparameters': request.metadata.hyperparameters,
            'training_config': request.metadata.training_config,
            'metrics': request.initial_metrics or {},
            'evaluation_history': [],
            'model_file_path': request.model_file_path
        }
        
        # Register model
        await mlops_service.register_model(model_id, model_data)
        
        # Return created model
        return ResponseBuilder.success(ModelResponse(**{k: v for k, v in model_data.items()) if k != 'model_file_path'})
        
    except Exception as e:
        logger.error(f"Failed to create model: {e}")
        raise BusinessLogicException("Failed to create model")

@router.put("/{model_id}", response_model=ModelResponse)
async def update_model(
    model_id: str,
    request: ModelUpdateRequest,
    mlops_service: MLOpsPipelineService = Depends(get_mlops_service)
):
    """
    Update model metadata and configuration
    
    Updates model description, tags, status, hyperparameters,
    and other metadata fields.
    """
    try:
        # Get existing model
        existing_model = await mlops_service.get_model_by_id(model_id)
        if not existing_model:
            raise BusinessLogicException("f"Model {model_id} not found")
        
        # Update fields
        update_data = {}
        if request.description is not None:
            update_data['description'] = request.description
        if request.tags is not None:
            update_data['tags'] = request.tags
        if request.status is not None:
            update_data['status'] = request.status
        if request.hyperparameters is not None:
            update_data['hyperparameters'] = request.hyperparameters
        
        update_data['updated_at'] = datetime.now().isoformat()
        
        # Apply updates
        updated_model = await mlops_service.update_model(model_id, update_data)
        
        return ResponseBuilder.success(ModelResponse(
            id=updated_model.get('id', model_id)),
            name=updated_model.get('name', ''),
            version=updated_model.get('version', '1.0.0'),
            description=updated_model.get('description', ''),
            model_type=updated_model.get('model_type', 'unknown'),
            framework=updated_model.get('framework', 'pytorch'),
            sport=updated_model.get('sport', 'MLB'),
            status=updated_model.get('status', 'active'),
            created_by=updated_model.get('created_by', 'system'),
            created_at=datetime.fromisoformat(updated_model.get('created_at', datetime.now().isoformat())),
            updated_at=datetime.fromisoformat(updated_model.get('updated_at', datetime.now().isoformat())),
            tags=updated_model.get('tags', []),
            hyperparameters=updated_model.get('hyperparameters', {}),
            training_config=updated_model.get('training_config', {}),
            metrics=updated_model.get('metrics', {}),
            evaluation_history=updated_model.get('evaluation_history', [])
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update model {model_id}: {e}")
        raise BusinessLogicException("Failed to update model")

@router.delete("/{model_id}", response_model=StandardAPIResponse[Dict[str, Any]])
async def delete_model(
    model_id: str,
    force: bool = Query(False, description="Force delete even if model is deployed"),
    mlops_service: MLOpsPipelineService = Depends(get_mlops_service)
):
    """
    Delete a model from the registry
    
    Removes model from registry. Requires force=true for deployed models.
    """
    try:
        # Get model to check status
        model = await mlops_service.get_model_by_id(model_id)
        if not model:
            raise BusinessLogicException("f"Model {model_id} not found")
        
        # Check if model is deployed
        if model.get('status') == 'deployed' and not force:
            raise BusinessLogicException("Cannot delete deployed model. Use force=true to override."
            ")
        
        # Delete model
        await mlops_service.delete_model(model_id)
        
        return JSONResponse(
            content={
                "message": f"Model {model_id} deleted successfully",
                "deleted_at": datetime.now().isoformat()
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete model {model_id}: {e}")
        raise BusinessLogicException("Failed to delete model")

@router.post("/{model_id}/evaluation", response_model=EvaluationUploadResponse)
async def upload_evaluation(
    model_id: str,
    evaluation_file: UploadFile = File(..., description="JSON file with evaluation metrics"),
    description: str = Form("", description="Evaluation description"),
    dataset_name: str = Form("", description="Test dataset name"),
    mlops_service: MLOpsPipelineService = Depends(get_mlops_service)
):
    """
    Upload evaluation results for a model
    
    Accepts JSON files with evaluation metrics, test results,
    and performance data for model assessment.
    """
    try:
        # Verify model exists
        model = await mlops_service.get_model_by_id(model_id)
        if not model:
            raise BusinessLogicException("f"Model {model_id} not found")
        
        # Validate file type
        if not evaluation_file.filename.endswith('.json'):
            raise BusinessLogicException("Only JSON files are supported for evaluation upload"
            ")
        
        # Read and parse JSON content
        content = await evaluation_file.read()
        try:
            evaluation_data = json.loads(content.decode('utf-8'))
        except json.JSONDecodeError as e:
            raise BusinessLogicException("f"Invalid JSON format: {str(e")}"
            )
        
        # Validate evaluation data structure
        if not isinstance(evaluation_data, dict):
            raise BusinessLogicException("Evaluation data must be a JSON object"
            ")
        
        # Extract metrics
        metrics = evaluation_data.get('metrics', {})
        if not metrics:
            # Try to extract from common structures
            if 'accuracy' in evaluation_data:
                metrics['accuracy'] = evaluation_data['accuracy']
            if 'precision' in evaluation_data:
                metrics['precision'] = evaluation_data['precision']
            if 'recall' in evaluation_data:
                metrics['recall'] = evaluation_data['recall']
            if 'f1_score' in evaluation_data:
                metrics['f1_score'] = evaluation_data['f1_score']
        
        # Create evaluation record
        evaluation_id = str(uuid.uuid4())
        evaluation_record = {
            'id': evaluation_id,
            'model_id': model_id,
            'description': description,
            'dataset_name': dataset_name,
            'metrics': metrics,
            'full_results': evaluation_data,
            'uploaded_at': datetime.now().isoformat(),
            'status': 'processed'
        }
        
        # Save evaluation
        await mlops_service.save_evaluation(model_id, evaluation_record)
        
        # Update model metrics with latest evaluation
        if metrics:
            await mlops_service.update_model_metrics(model_id, metrics)
        
        return ResponseBuilder.success(EvaluationUploadResponse(
            evaluation_id=evaluation_id,
            model_id=model_id,
            metrics=metrics,
            uploaded_at=datetime.fromisoformat(evaluation_record['uploaded_at'])),
            status='processed'
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to upload evaluation for model {model_id}: {e}")
        raise BusinessLogicException("Failed to process evaluation upload")

@router.get("/{model_id}/evaluations", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_model_evaluations(
    model_id: str,
    limit: int = Query(10, ge=1, le=100, description="Number of evaluations to return"),
    mlops_service: MLOpsPipelineService = Depends(get_mlops_service)
):
    """
    Get evaluation history for a model
    
    Returns chronological list of evaluation results and metrics
    for model performance tracking.
    """
    try:
        # Verify model exists
        model = await mlops_service.get_model_by_id(model_id)
        if not model:
            raise BusinessLogicException("f"Model {model_id} not found")
        
        # Get evaluations
        evaluations = await mlops_service.get_model_evaluations(model_id, limit)
        
        return JSONResponse(content={
            "model_id": model_id,
            "evaluations": evaluations,
            "count": len(evaluations)
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get evaluations for model {model_id}: {e}")
        raise BusinessLogicException("Failed to retrieve evaluations")

@router.get("/stats/summary", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_registry_stats(
    mlops_service: MLOpsPipelineService = Depends(get_mlops_service)
):
    """
    Get model registry statistics and health metrics
    
    Returns overview of registered models, types, performance,
    and system health indicators.
    """
    try:
        stats = await mlops_service.get_registry_stats()
        
        return JSONResponse(content={
            "total_models": stats.get('total_models', 0),
            "active_models": stats.get('active_models', 0),
            "training_jobs": stats.get('training_jobs', 0),
            "deployed_models": stats.get('deployed_models', 0),
            "model_types": stats.get('model_types', {}),
            "sports_coverage": stats.get('sports_coverage', {}),
            "average_accuracy": stats.get('average_accuracy', 0.0),
            "last_updated": datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Failed to get registry stats: {e}")
        raise BusinessLogicException("Failed to retrieve statistics")
