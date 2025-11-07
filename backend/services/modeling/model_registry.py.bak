"""
Model Registry Service - Registration, defaults management, and caching for statistical models
"""

import asyncio
import logging
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from pydantic import BaseModel

# Try to import database dependencies gracefully
try:
    from sqlalchemy.ext.asyncio import AsyncSession
    from backend.enhanced_database import get_db_session
    from backend.models.modeling import ModelVersion, ModelPropTypeDefault, ModelType
    DB_AVAILABLE = True
except ImportError:
    logging.warning("Database dependencies not available for ModelRegistry")
    DB_AVAILABLE = False
    AsyncSession = None
    get_db_session = None
    ModelVersion = None
    ModelPropTypeDefault = None
    ModelType = None

logger = logging.getLogger(__name__)


class BaseStatModel(ABC):
    """Abstract base class for all statistical models"""
    
    @abstractmethod
    async def predict(
        self, 
        *, 
        player_id: int, 
        prop_type: str, 
        context: dict
    ) -> dict:
        """
        Predict for a given player and prop type.
        
        Args:
            player_id: ID of the player
            prop_type: Type of prop (POINTS, ASSISTS, REBOUNDS, etc.)
            context: Additional context data
            
        Returns:
            dict with keys: mean, variance, distribution_family, sample_size?, features_used
        """
        pass


class ModelMetadata(BaseModel):
    """Model metadata for registry"""
    id: int
    name: str
    version_tag: str
    model_type: str
    hyperparams: Optional[Dict[str, Any]] = None
    created_at: datetime
    is_default: bool = False


class ModelRegistry:
    """Model registry with registration, defaults management, and caching"""
    
    def __init__(self):
        self._model_cache: Dict[int, BaseStatModel] = {}
        self._cache_ttl = 300  # 5 minutes
        self._cache_timestamps: Dict[int, float] = {}
        self._lock = asyncio.Lock()
    
    async def register_model(self, model_impl: BaseStatModel) -> int:
        """
        Register a model implementation and persist metadata.
        
        Args:
            model_impl: Implementation of BaseStatModel
            
        Returns:
            model_version_id: ID of the registered model version
            
        Raises:
            RuntimeError: If database is not available
        """
        if not DB_AVAILABLE:
            logger.error("Cannot register model: database not available")
            raise RuntimeError("Database not available for model registration")
        
        try:
            async with get_db_session() as session:
                # Create model version metadata
                # For now, we'll use basic defaults - in a real implementation,
                # this would extract metadata from the model_impl
                model_version = ModelVersion(
                    name=getattr(model_impl, 'name', 'unknown_model'),
                    version_tag=getattr(model_impl, 'version', 'v1'),
                    model_type=getattr(model_impl, 'model_type', ModelType.NORMAL),
                    hyperparams=getattr(model_impl, 'hyperparams', {}),
                    is_default=False
                )
                
                session.add(model_version)
                await session.flush()
                model_version_id = model_version.id
                await session.commit()
                
                logger.info(f"Registered model: {model_version.name} v{model_version.version_tag} (ID: {model_version_id})")
                return model_version_id
                
        except Exception as e:
            logger.error(f"Failed to register model: {e}")
            raise
    
    async def set_default_for_prop_type(self, model_version_id: int, prop_type: str) -> bool:
        """
        Set a model as default for a specific prop type.
        
        Args:
            model_version_id: ID of the model version
            prop_type: Prop type to set as default for
            
        Returns:
            bool: True if successful
            
        Raises:
            RuntimeError: If database is not available
        """
        if not DB_AVAILABLE:
            logger.error("Cannot set default model: database not available")
            raise RuntimeError("Database not available for default management")
        
        try:
            async with get_db_session() as session:
                # Deactivate current default for this prop type
                current_defaults = await session.execute(
                    """
                    UPDATE model_prop_type_defaults 
                    SET active = FALSE 
                    WHERE prop_type = :prop_type AND active = TRUE
                    """,
                    {"prop_type": prop_type}
                )
                
                # Check if model version exists
                model_version = await session.get(ModelVersion, model_version_id)
                if not model_version:
                    logger.error(f"Model version {model_version_id} not found")
                    return False
                
                # Set new default
                default_mapping = ModelPropTypeDefault(
                    model_version_id=model_version_id,
                    prop_type=prop_type,
                    active=True
                )
                
                session.add(default_mapping)
                await session.commit()
                
                logger.info(f"Set model {model_version_id} as default for {prop_type}")
                return True
                
        except Exception as e:
            logger.error(f"Failed to set default model: {e}")
            raise
    
    async def get_default_model(self, prop_type: str) -> Optional[Dict[str, Any]]:
        """
        Get the default model for a prop type.
        
        Args:
            prop_type: Prop type to get default model for
            
        Returns:
            dict: Model metadata and implementation, or None if not found
        """
        if not DB_AVAILABLE:
            logger.warning("Database not available, returning None for default model")
            return None
        
        try:
            async with get_db_session() as session:
                result = await session.execute(
                    """
                    SELECT mv.id, mv.name, mv.version_tag, mv.model_type, 
                           mv.hyperparams, mv.created_at, mv.is_default
                    FROM model_versions mv
                    JOIN model_prop_type_defaults mptd ON mv.id = mptd.model_version_id
                    WHERE mptd.prop_type = :prop_type AND mptd.active = TRUE
                    ORDER BY mptd.assigned_at DESC
                    LIMIT 1
                    """,
                    {"prop_type": prop_type}
                )
                
                row = result.fetchone()
                if not row:
                    logger.info(f"No default model found for prop type: {prop_type}")
                    return None
                
                # Get or create model implementation from cache
                model_version_id = row[0]
                model_impl = await self._get_cached_model(model_version_id)
                
                return {
                    "metadata": ModelMetadata(
                        id=row[0],
                        name=row[1], 
                        version_tag=row[2],
                        model_type=str(row[3]),
                        hyperparams=row[4],
                        created_at=row[5],
                        is_default=row[6]
                    ),
                    "implementation": model_impl
                }
                
        except Exception as e:
            logger.error(f"Failed to get default model: {e}")
            return None
    
    async def list_models(self, filter_by_prop_type: Optional[str] = None) -> List[ModelMetadata]:
        """
        List registered models, optionally filtered by prop type.
        
        Args:
            filter_by_prop_type: Optional prop type filter
            
        Returns:
            List[ModelMetadata]: List of model metadata
        """
        if not DB_AVAILABLE:
            logger.warning("Database not available, returning empty model list")
            return []
        
        try:
            async with get_db_session() as session:
                if filter_by_prop_type:
                    result = await session.execute(
                        """
                        SELECT DISTINCT mv.id, mv.name, mv.version_tag, mv.model_type,
                               mv.hyperparams, mv.created_at, mv.is_default
                        FROM model_versions mv
                        JOIN model_prop_type_defaults mptd ON mv.id = mptd.model_version_id
                        WHERE mptd.prop_type = :prop_type
                        ORDER BY mv.created_at DESC
                        """,
                        {"prop_type": filter_by_prop_type}
                    )
                else:
                    result = await session.execute(
                        """
                        SELECT mv.id, mv.name, mv.version_tag, mv.model_type,
                               mv.hyperparams, mv.created_at, mv.is_default
                        FROM model_versions mv
                        ORDER BY mv.created_at DESC
                        """
                    )
                
                models = []
                for row in result:
                    models.append(ModelMetadata(
                        id=row[0],
                        name=row[1],
                        version_tag=row[2], 
                        model_type=str(row[3]),
                        hyperparams=row[4],
                        created_at=row[5],
                        is_default=row[6]
                    ))
                
                return models
                
        except Exception as e:
            logger.error(f"Failed to list models: {e}")
            return []
    
    async def load_model_by_id(self, model_id: int) -> Optional[BaseStatModel]:
        """
        Load a model implementation by ID.
        
        Args:
            model_id: Model version ID
            
        Returns:
            BaseStatModel: Model implementation or None if not found
        """
        if not DB_AVAILABLE:
            logger.warning("Database not available, cannot load model")
            return None
        
        try:
            return await self._get_cached_model(model_id)
        except Exception as e:
            logger.error(f"Failed to load model {model_id}: {e}")
            return None
    
    async def _get_cached_model(self, model_version_id: int) -> Optional[BaseStatModel]:
        """Get model from cache or create new instance"""
        async with self._lock:
            now = asyncio.get_event_loop().time()
            
            # Check cache validity
            if (model_version_id in self._model_cache and 
                model_version_id in self._cache_timestamps and
                now - self._cache_timestamps[model_version_id] < self._cache_ttl):
                return self._model_cache[model_version_id]
            
            # Cache miss or expired - create new model instance
            # For now, we'll return None as we haven't implemented model factories yet
            # This will be implemented in the next step with baseline models
            logger.warning(f"Model factory not yet implemented for model {model_version_id}")
            
            # Placeholder: would instantiate actual model based on metadata
            model_impl = None
            
            if model_impl:
                self._model_cache[model_version_id] = model_impl
                self._cache_timestamps[model_version_id] = now
            
            return model_impl
    
    async def invalidate_cache(self, model_version_id: Optional[int] = None):
        """
        Invalidate model cache.
        
        Args:
            model_version_id: Specific model to invalidate, or None for all
        """
        async with self._lock:
            if model_version_id:
                self._model_cache.pop(model_version_id, None)
                self._cache_timestamps.pop(model_version_id, None)
                logger.info(f"Invalidated cache for model {model_version_id}")
            else:
                self._model_cache.clear()
                self._cache_timestamps.clear()
                logger.info("Invalidated all model cache")


# Global model registry instance
model_registry = ModelRegistry()