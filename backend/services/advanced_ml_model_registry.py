"""
Advanced Machine Learning Model Registry

This service provides comprehensive model lifecycle management including
versioning, deployment, monitoring, and automated optimization for all
sports prediction models in the A1Betting platform.
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union, Tuple, Callable
import pandas as pd
import numpy as np
from dataclasses import dataclass, asdict
from enum import Enum
import json
import hashlib
import pickle
import os
from pathlib import Path
import tempfile
from concurrent.futures import ThreadPoolExecutor
import threading

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ModelStatus(Enum):
    """Model lifecycle status"""
    TRAINING = "training"
    VALIDATION = "validation"
    STAGING = "staging"
    PRODUCTION = "production"
    DEPRECATED = "deprecated"
    ARCHIVED = "archived"
    FAILED = "failed"

class ModelType(Enum):
    """Types of models in registry"""
    RANDOM_FOREST = "random_forest"
    GRADIENT_BOOSTING = "gradient_boosting"
    NEURAL_NETWORK = "neural_network"
    ENSEMBLE = "ensemble"
    XGBOOST = "xgboost"
    LIGHTGBM = "lightgbm"
    LINEAR_REGRESSION = "linear_regression"
    SVM = "svm"
    TRANSFORMER = "transformer"
    LSTM = "lstm"

class Sport(Enum):
    """Supported sports"""
    NBA = "nba"
    NFL = "nfl"
    NHL = "nhl"
    SOCCER = "soccer"
    MLB = "mlb"

class DeploymentTarget(Enum):
    """Deployment targets"""
    REAL_TIME = "real_time"
    BATCH = "batch"
    STREAMING = "streaming"
    EDGE = "edge"
    CLOUD = "cloud"

@dataclass
class ModelMetadata:
    """Comprehensive model metadata"""
    model_id: str
    model_name: str
    model_type: ModelType
    sport: Sport
    target_metric: str
    version: str
    status: ModelStatus
    created_by: str
    created_at: datetime
    updated_at: datetime
    description: str
    tags: List[str]
    
    # Training metadata
    training_data_hash: str
    training_duration_minutes: float
    training_samples: int
    validation_samples: int
    feature_count: int
    hyperparameters: Dict[str, Any]
    
    # Performance metadata
    performance_metrics: Dict[str, float]
    cross_validation_scores: List[float]
    feature_importance: Dict[str, float]
    confidence_intervals: Dict[str, Tuple[float, float]]
    
    # Deployment metadata
    deployment_targets: List[DeploymentTarget]
    resource_requirements: Dict[str, Any]
    latency_requirements: Dict[str, float]
    throughput_requirements: Dict[str, float]
    
    # Lineage and dependencies
    parent_model_id: Optional[str]
    dependency_models: List[str]
    training_pipeline_id: str
    data_sources: List[str]

@dataclass
class ModelArtifact:
    """Model artifact storage information"""
    model_id: str
    version: str
    artifact_type: str  # "model", "preprocessing", "feature_engineering", "config"
    storage_path: str
    file_size_bytes: int
    checksum: str
    compression_type: Optional[str]
    encryption_enabled: bool
    created_at: datetime
    metadata: Dict[str, Any]

@dataclass
class ModelDeployment:
    """Model deployment information"""
    deployment_id: str
    model_id: str
    version: str
    target: DeploymentTarget
    status: str
    deployed_at: datetime
    endpoint_url: Optional[str]
    health_check_url: Optional[str]
    scaling_config: Dict[str, Any]
    monitoring_config: Dict[str, Any]
    rollback_version: Optional[str]
    traffic_split: float  # Percentage of traffic for A/B testing

@dataclass
class ModelPerformanceSnapshot:
    """Snapshot of model performance at a point in time"""
    model_id: str
    version: str
    snapshot_date: datetime
    performance_metrics: Dict[str, float]
    prediction_count: int
    error_rate: float
    latency_p95: float
    resource_utilization: Dict[str, float]
    data_drift_score: float
    concept_drift_score: float
    quality_score: float

class AdvancedMLModelRegistry:
    """
    Advanced ML Model Registry for comprehensive model lifecycle management
    """
    
    def __init__(self, base_storage_path: str = "./model_registry"):
        self.base_storage_path = Path(base_storage_path)
        self.base_storage_path.mkdir(exist_ok=True)
        
        self.models = {}  # In-memory model metadata cache
        self.artifacts = {}  # Artifact storage info
        self.deployments = {}  # Deployment information
        self.performance_history = {}  # Performance tracking
        
        self.executor = ThreadPoolExecutor(max_workers=10)
        self._initialize_registry()
        
    def _initialize_registry(self):
        """Initialize the model registry"""
        
        # Create directory structure
        directories = [
            "models", "artifacts", "deployments", "backups",
            "experiments", "pipelines", "monitoring"
        ]
        
        for directory in directories:
            (self.base_storage_path / directory).mkdir(exist_ok=True)
        
        # Initialize registry metadata
        self.registry_metadata = {
            "created_at": datetime.now(),
            "version": "3.0.0",
            "total_models": 0,
            "active_deployments": 0,
            "supported_sports": [sport.value for sport in Sport],
            "supported_model_types": [model_type.value for model_type in ModelType]
        }
        
        logger.info("Advanced ML Model Registry initialized")

    async def register_model(
        self,
        model_name: str,
        model_type: ModelType,
        sport: Sport,
        target_metric: str,
        model_object: Any,
        training_metadata: Dict[str, Any],
        performance_metrics: Dict[str, float],
        created_by: str = "system",
        description: str = "",
        tags: List[str] = None
    ) -> str:
        """
        Register a new model in the registry
        
        Args:
            model_name: Human-readable model name
            model_type: Type of the model
            sport: Sport the model is for
            target_metric: Target metric being predicted
            model_object: The actual model object
            training_metadata: Metadata from training process
            performance_metrics: Model performance metrics
            created_by: User who created the model
            description: Model description
            tags: Tags for categorization
            
        Returns:
            Model ID of the registered model
        """
        
        # Generate unique model ID
        model_id = self._generate_model_id(model_name, sport, target_metric)
        version = "1.0.0"
        
        if tags is None:
            tags = []
        
        # Create model metadata
        metadata = ModelMetadata(
            model_id=model_id,
            model_name=model_name,
            model_type=model_type,
            sport=sport,
            target_metric=target_metric,
            version=version,
            status=ModelStatus.TRAINING,
            created_by=created_by,
            created_at=datetime.now(),
            updated_at=datetime.now(),
            description=description,
            tags=tags + [sport.value, model_type.value],
            
            # Training metadata
            training_data_hash=training_metadata.get("data_hash", ""),
            training_duration_minutes=training_metadata.get("duration_minutes", 0.0),
            training_samples=training_metadata.get("training_samples", 0),
            validation_samples=training_metadata.get("validation_samples", 0),
            feature_count=training_metadata.get("feature_count", 0),
            hyperparameters=training_metadata.get("hyperparameters", {}),
            
            # Performance metadata
            performance_metrics=performance_metrics,
            cross_validation_scores=training_metadata.get("cv_scores", []),
            feature_importance=training_metadata.get("feature_importance", {}),
            confidence_intervals=training_metadata.get("confidence_intervals", {}),
            
            # Deployment metadata
            deployment_targets=[],
            resource_requirements=self._estimate_resource_requirements(model_type, training_metadata),
            latency_requirements={"p95_ms": 100, "p99_ms": 200},
            throughput_requirements={"requests_per_second": 1000},
            
            # Lineage metadata
            parent_model_id=training_metadata.get("parent_model_id"),
            dependency_models=training_metadata.get("dependency_models", []),
            training_pipeline_id=training_metadata.get("pipeline_id", ""),
            data_sources=training_metadata.get("data_sources", [])
        )
        
        # Store model artifacts
        await self._store_model_artifacts(model_id, version, model_object, metadata)
        
        # Register in memory cache
        self.models[model_id] = metadata
        
        # Update registry statistics
        self.registry_metadata["total_models"] += 1
        
        logger.info(f"Registered model {model_id} v{version} for {sport.value} {target_metric}")
        return model_id

    def _generate_model_id(self, model_name: str, sport: Sport, target_metric: str) -> str:
        """Generate unique model ID"""
        
        # Create deterministic but unique ID
        content = f"{model_name}_{sport.value}_{target_metric}_{datetime.now().strftime('%Y%m%d')}"
        hash_object = hashlib.md5(content.encode())
        hash_hex = hash_object.hexdigest()[:8]
        
        return f"{sport.value}_{target_metric}_{hash_hex}"

    def _estimate_resource_requirements(
        self,
        model_type: ModelType,
        training_metadata: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Estimate resource requirements based on model type and size"""
        
        feature_count = training_metadata.get("feature_count", 100)
        training_samples = training_metadata.get("training_samples", 10000)
        
        # Base requirements by model type
        base_requirements = {
            ModelType.RANDOM_FOREST: {"cpu_cores": 2, "memory_mb": 512, "disk_mb": 100},
            ModelType.GRADIENT_BOOSTING: {"cpu_cores": 2, "memory_mb": 1024, "disk_mb": 200},
            ModelType.NEURAL_NETWORK: {"cpu_cores": 4, "memory_mb": 2048, "disk_mb": 500, "gpu_memory_mb": 1024},
            ModelType.ENSEMBLE: {"cpu_cores": 4, "memory_mb": 3072, "disk_mb": 1000},
            ModelType.XGBOOST: {"cpu_cores": 2, "memory_mb": 1024, "disk_mb": 200},
            ModelType.TRANSFORMER: {"cpu_cores": 8, "memory_mb": 8192, "disk_mb": 2048, "gpu_memory_mb": 4096}
        }
        
        requirements = base_requirements.get(model_type, base_requirements[ModelType.RANDOM_FOREST])
        
        # Scale based on feature count and training samples
        scale_factor = max(1.0, (feature_count * training_samples) / 1000000)
        
        scaled_requirements = {}
        for resource, value in requirements.items():
            scaled_requirements[resource] = int(value * scale_factor)
        
        return scaled_requirements

    async def _store_model_artifacts(
        self,
        model_id: str,
        version: str,
        model_object: Any,
        metadata: ModelMetadata
    ):
        """Store model artifacts to persistent storage"""
        
        model_dir = self.base_storage_path / "models" / model_id / version
        model_dir.mkdir(parents=True, exist_ok=True)
        
        artifacts = []
        
        # Store main model artifact
        model_path = model_dir / "model.pkl"
        with open(model_path, 'wb') as f:
            pickle.dump(model_object, f)
        
        model_artifact = ModelArtifact(
            model_id=model_id,
            version=version,
            artifact_type="model",
            storage_path=str(model_path),
            file_size_bytes=model_path.stat().st_size,
            checksum=self._calculate_file_checksum(model_path),
            compression_type=None,
            encryption_enabled=False,
            created_at=datetime.now(),
            metadata={"format": "pickle", "python_version": "3.8+"}
        )
        artifacts.append(model_artifact)
        
        # Store model metadata
        metadata_path = model_dir / "metadata.json"
        with open(metadata_path, 'w') as f:
            # Convert datetime objects to strings for JSON serialization
            metadata_dict = asdict(metadata)
            metadata_dict["created_at"] = metadata.created_at.isoformat()
            metadata_dict["updated_at"] = metadata.updated_at.isoformat()
            json.dump(metadata_dict, f, indent=2)
        
        metadata_artifact = ModelArtifact(
            model_id=model_id,
            version=version,
            artifact_type="metadata",
            storage_path=str(metadata_path),
            file_size_bytes=metadata_path.stat().st_size,
            checksum=self._calculate_file_checksum(metadata_path),
            compression_type=None,
            encryption_enabled=False,
            created_at=datetime.now(),
            metadata={"format": "json"}
        )
        artifacts.append(metadata_artifact)
        
        # Store artifacts info
        artifact_key = f"{model_id}:{version}"
        self.artifacts[artifact_key] = artifacts
        
        logger.info(f"Stored {len(artifacts)} artifacts for model {model_id} v{version}")

    def _calculate_file_checksum(self, file_path: Path) -> str:
        """Calculate SHA256 checksum of a file"""
        
        hash_sha256 = hashlib.sha256()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_sha256.update(chunk)
        return hash_sha256.hexdigest()

    async def create_model_version(
        self,
        model_id: str,
        model_object: Any,
        performance_metrics: Dict[str, float],
        changes_description: str,
        updated_by: str = "system"
    ) -> str:
        """Create a new version of an existing model"""
        
        if model_id not in self.models:
            raise ValueError(f"Model {model_id} not found in registry")
        
        current_metadata = self.models[model_id]
        
        # Generate new version number
        current_version = current_metadata.version
        version_parts = current_version.split('.')
        new_patch = int(version_parts[2]) + 1
        new_version = f"{version_parts[0]}.{version_parts[1]}.{new_patch}"
        
        # Create new metadata based on current
        new_metadata = ModelMetadata(
            model_id=model_id,
            model_name=current_metadata.model_name,
            model_type=current_metadata.model_type,
            sport=current_metadata.sport,
            target_metric=current_metadata.target_metric,
            version=new_version,
            status=ModelStatus.VALIDATION,
            created_by=current_metadata.created_by,
            created_at=current_metadata.created_at,
            updated_at=datetime.now(),
            description=f"{current_metadata.description}\n\nv{new_version}: {changes_description}",
            tags=current_metadata.tags,
            
            # Keep training metadata mostly the same
            training_data_hash=current_metadata.training_data_hash,
            training_duration_minutes=current_metadata.training_duration_minutes,
            training_samples=current_metadata.training_samples,
            validation_samples=current_metadata.validation_samples,
            feature_count=current_metadata.feature_count,
            hyperparameters=current_metadata.hyperparameters,
            
            # Update performance metadata
            performance_metrics=performance_metrics,
            cross_validation_scores=current_metadata.cross_validation_scores,
            feature_importance=current_metadata.feature_importance,
            confidence_intervals=current_metadata.confidence_intervals,
            
            # Keep deployment metadata
            deployment_targets=current_metadata.deployment_targets,
            resource_requirements=current_metadata.resource_requirements,
            latency_requirements=current_metadata.latency_requirements,
            throughput_requirements=current_metadata.throughput_requirements,
            
            # Update lineage
            parent_model_id=model_id,  # Previous version is parent
            dependency_models=current_metadata.dependency_models,
            training_pipeline_id=current_metadata.training_pipeline_id,
            data_sources=current_metadata.data_sources
        )
        
        # Store new version artifacts
        await self._store_model_artifacts(model_id, new_version, model_object, new_metadata)
        
        # Update metadata in cache
        self.models[model_id] = new_metadata
        
        logger.info(f"Created new version {new_version} for model {model_id}")
        return new_version

    async def deploy_model(
        self,
        model_id: str,
        version: str,
        target: DeploymentTarget,
        scaling_config: Dict[str, Any] = None,
        traffic_split: float = 1.0
    ) -> str:
        """Deploy a model to a specific target environment"""
        
        if model_id not in self.models:
            raise ValueError(f"Model {model_id} not found")
        
        metadata = self.models[model_id]
        
        if metadata.version != version:
            raise ValueError(f"Version {version} not found for model {model_id}")
        
        # Generate deployment ID
        deployment_id = f"{model_id}_{version}_{target.value}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        if scaling_config is None:
            scaling_config = {
                "min_instances": 1,
                "max_instances": 10,
                "target_cpu_utilization": 70,
                "auto_scaling_enabled": True
            }
        
        # Create deployment record
        deployment = ModelDeployment(
            deployment_id=deployment_id,
            model_id=model_id,
            version=version,
            target=target,
            status="deploying",
            deployed_at=datetime.now(),
            endpoint_url=f"https://api.a1betting.com/models/{deployment_id}/predict",
            health_check_url=f"https://api.a1betting.com/models/{deployment_id}/health",
            scaling_config=scaling_config,
            monitoring_config={
                "enable_metrics": True,
                "enable_logging": True,
                "alert_thresholds": {
                    "error_rate": 0.05,
                    "latency_p95": 200,
                    "cpu_utilization": 85
                }
            },
            rollback_version=None,
            traffic_split=traffic_split
        )
        
        # Store deployment info
        self.deployments[deployment_id] = deployment
        
        # Update model metadata
        if target not in metadata.deployment_targets:
            metadata.deployment_targets.append(target)
        
        # Update model status to production if deploying to production
        if target in [DeploymentTarget.REAL_TIME, DeploymentTarget.CLOUD]:
            metadata.status = ModelStatus.PRODUCTION
        
        # Simulate deployment process
        await asyncio.sleep(0.1)  # Simulate deployment time
        deployment.status = "active"
        
        # Update registry statistics
        self.registry_metadata["active_deployments"] += 1
        
        logger.info(f"Deployed model {model_id} v{version} to {target.value} as {deployment_id}")
        return deployment_id

    async def get_model_metadata(self, model_id: str) -> Optional[ModelMetadata]:
        """Get metadata for a specific model"""
        return self.models.get(model_id)

    async def search_models(
        self,
        sport: Optional[Sport] = None,
        model_type: Optional[ModelType] = None,
        status: Optional[ModelStatus] = None,
        tags: Optional[List[str]] = None,
        min_performance: Optional[float] = None,
        performance_metric: str = "f1_score"
    ) -> List[ModelMetadata]:
        """Search models based on criteria"""
        
        results = []
        
        for model_metadata in self.models.values():
            # Apply filters
            if sport and model_metadata.sport != sport:
                continue
            if model_type and model_metadata.model_type != model_type:
                continue
            if status and model_metadata.status != status:
                continue
            if tags and not any(tag in model_metadata.tags for tag in tags):
                continue
            if min_performance:
                model_perf = model_metadata.performance_metrics.get(performance_metric, 0.0)
                if model_perf < min_performance:
                    continue
            
            results.append(model_metadata)
        
        # Sort by performance descending
        results.sort(
            key=lambda x: x.performance_metrics.get(performance_metric, 0.0),
            reverse=True
        )
        
        return results

    async def get_model_lineage(self, model_id: str) -> Dict[str, Any]:
        """Get complete lineage information for a model"""
        
        if model_id not in self.models:
            return {}
        
        metadata = self.models[model_id]
        
        lineage = {
            "model_id": model_id,
            "current_version": metadata.version,
            "created_at": metadata.created_at.isoformat(),
            "created_by": metadata.created_by,
            "parent_model": metadata.parent_model_id,
            "dependency_models": metadata.dependency_models,
            "training_pipeline": metadata.training_pipeline_id,
            "data_sources": metadata.data_sources,
            "children_models": [],
            "deployment_history": []
        }
        
        # Find child models
        for other_model_id, other_metadata in self.models.items():
            if other_metadata.parent_model_id == model_id:
                lineage["children_models"].append({
                    "model_id": other_model_id,
                    "version": other_metadata.version,
                    "created_at": other_metadata.created_at.isoformat()
                })
        
        # Get deployment history
        for deployment_id, deployment in self.deployments.items():
            if deployment.model_id == model_id:
                lineage["deployment_history"].append({
                    "deployment_id": deployment_id,
                    "version": deployment.version,
                    "target": deployment.target.value,
                    "deployed_at": deployment.deployed_at.isoformat(),
                    "status": deployment.status
                })
        
        return lineage

    async def record_performance_snapshot(
        self,
        model_id: str,
        version: str,
        performance_metrics: Dict[str, float],
        prediction_count: int,
        error_rate: float,
        latency_p95: float,
        resource_utilization: Dict[str, float]
    ):
        """Record a performance snapshot for monitoring"""
        
        snapshot = ModelPerformanceSnapshot(
            model_id=model_id,
            version=version,
            snapshot_date=datetime.now(),
            performance_metrics=performance_metrics,
            prediction_count=prediction_count,
            error_rate=error_rate,
            latency_p95=latency_p95,
            resource_utilization=resource_utilization,
            data_drift_score=np.random.uniform(0.0, 0.3),  # Simulated
            concept_drift_score=np.random.uniform(0.0, 0.2),  # Simulated
            quality_score=1.0 - error_rate
        )
        
        if model_id not in self.performance_history:
            self.performance_history[model_id] = []
        
        self.performance_history[model_id].append(snapshot)
        
        # Keep only last 100 snapshots per model
        if len(self.performance_history[model_id]) > 100:
            self.performance_history[model_id] = self.performance_history[model_id][-100:]
        
        logger.info(f"Recorded performance snapshot for {model_id} v{version}")

    async def get_registry_statistics(self) -> Dict[str, Any]:
        """Get comprehensive registry statistics"""
        
        stats = {
            "total_models": len(self.models),
            "total_deployments": len(self.deployments),
            "models_by_sport": {},
            "models_by_type": {},
            "models_by_status": {},
            "active_deployments_by_target": {},
            "performance_summary": {},
            "storage_usage": {},
            "recent_activity": []
        }
        
        # Count models by sport
        for metadata in self.models.values():
            sport = metadata.sport.value
            stats["models_by_sport"][sport] = stats["models_by_sport"].get(sport, 0) + 1
        
        # Count models by type
        for metadata in self.models.values():
            model_type = metadata.model_type.value
            stats["models_by_type"][model_type] = stats["models_by_type"].get(model_type, 0) + 1
        
        # Count models by status
        for metadata in self.models.values():
            status = metadata.status.value
            stats["models_by_status"][status] = stats["models_by_status"].get(status, 0) + 1
        
        # Count active deployments by target
        for deployment in self.deployments.values():
            if deployment.status == "active":
                target = deployment.target.value
                stats["active_deployments_by_target"][target] = stats["active_deployments_by_target"].get(target, 0) + 1
        
        # Performance summary
        if self.models:
            all_f1_scores = [
                metadata.performance_metrics.get("f1_score", 0.0)
                for metadata in self.models.values()
                if "f1_score" in metadata.performance_metrics
            ]
            
            if all_f1_scores:
                stats["performance_summary"] = {
                    "avg_f1_score": round(np.mean(all_f1_scores), 3),
                    "min_f1_score": round(np.min(all_f1_scores), 3),
                    "max_f1_score": round(np.max(all_f1_scores), 3),
                    "std_f1_score": round(np.std(all_f1_scores), 3)
                }
        
        # Storage usage (simulated)
        total_artifacts = sum(len(artifacts) for artifacts in self.artifacts.values())
        stats["storage_usage"] = {
            "total_artifacts": total_artifacts,
            "estimated_size_mb": total_artifacts * 15.7,  # Average artifact size
            "compression_ratio": 2.3
        }
        
        return stats

    async def cleanup_old_versions(self, keep_versions: int = 5):
        """Clean up old model versions to save storage space"""
        
        models_by_base_id = {}
        
        # Group models by base ID (without version)
        for model_id, metadata in self.models.items():
            base_id = "_".join(model_id.split("_")[:-1])  # Remove version suffix
            if base_id not in models_by_base_id:
                models_by_base_id[base_id] = []
            models_by_base_id[base_id].append((model_id, metadata))
        
        cleaned_count = 0
        
        for base_id, model_versions in models_by_base_id.items():
            if len(model_versions) > keep_versions:
                # Sort by creation date, keep most recent
                model_versions.sort(key=lambda x: x[1].created_at, reverse=True)
                
                models_to_remove = model_versions[keep_versions:]
                
                for model_id, metadata in models_to_remove:
                    # Only remove if not in production
                    if metadata.status not in [ModelStatus.PRODUCTION, ModelStatus.STAGING]:
                        await self._archive_model(model_id)
                        cleaned_count += 1
        
        logger.info(f"Cleaned up {cleaned_count} old model versions")
        return cleaned_count

    async def _archive_model(self, model_id: str):
        """Archive a model and its artifacts"""
        
        if model_id in self.models:
            # Update status
            self.models[model_id].status = ModelStatus.ARCHIVED
            
            # Move artifacts to archive (simulated)
            # In production, this would move files to cheaper storage
            
            logger.info(f"Archived model {model_id}")

# Usage example and testing
async def main():
    """Example usage of the Advanced ML Model Registry"""
    
    registry = AdvancedMLModelRegistry()
    
    # Example 1: Register a new model
    print("=== Registering New Model ===")
    
    # Simulate a trained model object
    class MockModel:
        def __init__(self):
            self.model_type = "random_forest"
            self.feature_count = 25
        
        def predict(self, X):
            return np.random.rand(len(X))
    
    mock_model = MockModel()
    
    training_metadata = {
        "data_hash": "abc123",
        "duration_minutes": 45.5,
        "training_samples": 10000,
        "validation_samples": 3000,
        "feature_count": 25,
        "hyperparameters": {"n_estimators": 100, "max_depth": 10},
        "cv_scores": [0.85, 0.87, 0.84, 0.86, 0.85],
        "feature_importance": {"usage_rate": 0.25, "opponent_strength": 0.18, "home_advantage": 0.15},
        "pipeline_id": "pipeline_123",
        "data_sources": ["nba_stats_api", "injury_reports"]
    }
    
    performance_metrics = {
        "accuracy": 0.86,
        "precision": 0.84,
        "recall": 0.88,
        "f1_score": 0.86,
        "roc_auc": 0.91
    }
    
    model_id = await registry.register_model(
        model_name="NBA Points Predictor",
        model_type=ModelType.RANDOM_FOREST,
        sport=Sport.NBA,
        target_metric="points",
        model_object=mock_model,
        training_metadata=training_metadata,
        performance_metrics=performance_metrics,
        created_by="data_scientist_1",
        description="Random Forest model for predicting NBA player points",
        tags=["production_ready", "high_performance"]
    )
    
    print(f"Registered model: {model_id}")
    
    # Example 2: Create a new version
    print("\n=== Creating New Version ===")
    
    improved_metrics = {
        "accuracy": 0.88,
        "precision": 0.86,
        "recall": 0.90,
        "f1_score": 0.88,
        "roc_auc": 0.93
    }
    
    new_version = await registry.create_model_version(
        model_id=model_id,
        model_object=mock_model,
        performance_metrics=improved_metrics,
        changes_description="Improved feature engineering and hyperparameter tuning"
    )
    
    print(f"Created new version: {new_version}")
    
    # Example 3: Deploy model
    print("\n=== Deploying Model ===")
    
    deployment_id = await registry.deploy_model(
        model_id=model_id,
        version=new_version,
        target=DeploymentTarget.REAL_TIME,
        scaling_config={
            "min_instances": 2,
            "max_instances": 20,
            "target_cpu_utilization": 70
        }
    )
    
    print(f"Deployed as: {deployment_id}")
    
    # Example 4: Search models
    print("\n=== Searching Models ===")
    
    nba_models = await registry.search_models(
        sport=Sport.NBA,
        status=ModelStatus.PRODUCTION,
        min_performance=0.85
    )
    
    print(f"Found {len(nba_models)} NBA production models with F1 > 0.85")
    for model in nba_models:
        f1_score = model.performance_metrics.get("f1_score", 0.0)
        print(f"  {model.model_name}: F1={f1_score:.3f}")
    
    # Example 5: Get registry statistics
    print("\n=== Registry Statistics ===")
    
    stats = await registry.get_registry_statistics()
    print(f"Total models: {stats['total_models']}")
    print(f"Total deployments: {stats['total_deployments']}")
    print(f"Models by sport: {stats['models_by_sport']}")
    print(f"Performance summary: {stats.get('performance_summary', {})}")

if __name__ == "__main__":
    asyncio.run(main())
