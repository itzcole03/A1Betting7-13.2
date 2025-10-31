"""
Valuation Engine - Core valuation logic for prop betting
"""

import hashlib
import logging
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from pydantic import BaseModel

from .distributions import inverse_fair_line, prob_over_line
from .payout import compute_expected_value, get_default_payout_schema
from ..modeling.model_registry import model_registry

# Try to import database dependencies gracefully
try:
    from backend.enhanced_database import get_db_session
    from backend.models.modeling import ModelPrediction, Valuation, DistributionFamily
    DB_AVAILABLE = True
except ImportError:
    logging.warning("Database dependencies not available for ValuationEngine")
    DB_AVAILABLE = False
    get_db_session = None
    ModelPrediction = None
    Valuation = None
    DistributionFamily = None

logger = logging.getLogger(__name__)


class PropData(BaseModel):
    """Prop data for valuation"""
    prop_id: int
    player_id: int
    prop_type: str
    offered_line: float
    payout_schema: Dict[str, Any]


@dataclass
class ValuationResult:
    """Result of a valuation computation"""
    prop_id: int
    model_version_id: int
    model_prediction_id: Optional[int]
    valuation_id: Optional[int]
    
    # Market data
    offered_line: float
    fair_line: float
    
    # Probability calculations
    prob_over: float
    prob_under: float
    expected_value: float
    
    # Market metadata
    payout_schema: Dict[str, Any]
    volatility_score: float
    valuation_hash: str
    
    # Model prediction data
    prediction_mean: float
    prediction_variance: float
    distribution_family: str
    
    # Timestamps
    created_at: datetime


class ValuationEngine:
    """Core valuation engine for prop betting"""
    
    def __init__(self):
        self.model_registry = model_registry
    
    async def valuate(
        self,
        prop_id: int,
        model_version_id: Optional[int] = None
    ) -> Optional[ValuationResult]:
        """
        Perform comprehensive valuation of a prop.
        
        Args:
            prop_id: ID of the prop to valuate
            model_version_id: Specific model version to use (optional)
            
        Returns:
            ValuationResult: Comprehensive valuation result or None if failed
        """
        try:
            # Step 1: Load prop data and latest market quote
            prop_data = await self._load_prop_data(prop_id)
            if not prop_data:
                logger.error(f"Could not load prop data for prop_id: {prop_id}")
                return None
            
            # Step 2: Get model for prediction
            if model_version_id:
                model_info = await self.model_registry.load_model_by_id(model_version_id)
                if not model_info:
                    logger.error(f"Could not load model {model_version_id}")
                    return None
                model_impl = model_info
                # TODO: Get model metadata
                model_version_id_used = model_version_id
            else:
                # Get default model for prop type
                model_info = await self.model_registry.get_default_model(prop_data.prop_type)
                if not model_info:
                    logger.error(f"No default model available for prop type: {prop_data.prop_type}")
                    return None
                model_impl = model_info["implementation"]
                model_version_id_used = model_info["metadata"].id
            
            # Step 3: Generate prediction
            prediction = await model_impl.predict(
                player_id=prop_data.player_id,
                prop_type=prop_data.prop_type,
                context={"prop_id": prop_id, "offered_line": prop_data.offered_line}
            )
            
            if not prediction:
                logger.error(f"Model prediction failed for prop {prop_id}")
                return None
            
            # Step 4: Store model prediction (with deduplication)
            model_prediction_id = await self._store_model_prediction(
                model_version_id_used,
                prop_data,
                prediction
            )
            
            # Step 5: Calculate probabilities
            prob_over = prob_over_line(
                line=prop_data.offered_line,
                mean=prediction["mean"],
                variance=prediction["variance"],
                distribution_family=prediction["distribution_family"]
            )
            prob_under = 1.0 - prob_over
            
            # Step 6: Calculate fair line
            fair_line = inverse_fair_line(
                mean=prediction["mean"],
                variance=prediction["variance"],
                distribution_family=prediction["distribution_family"]
            )
            
            # Step 7: Calculate expected value
            expected_value = compute_expected_value(
                prob_over=prob_over,
                offered_line=prop_data.offered_line,
                payout_schema=prop_data.payout_schema
            )
            
            # Step 8: Calculate volatility score
            volatility_score = self._calculate_volatility_score(
                prediction["variance"],
                prediction["mean"]
            )
            
            # Step 9: Create valuation hash for deduplication
            valuation_hash = self._create_valuation_hash(
                prop_id=prop_id,
                model_version_id=model_version_id_used,
                offered_line=prop_data.offered_line,
                payout_schema=prop_data.payout_schema
            )
            
            # Step 10: Store valuation (with deduplication)
            valuation_id = await self._store_valuation(
                model_prediction_id=model_prediction_id,
                prop_data=prop_data,
                fair_line=fair_line,
                prob_over=prob_over,
                prob_under=prob_under,
                expected_value=expected_value,
                volatility_score=volatility_score,
                valuation_hash=valuation_hash
            )
            
            # Step 11: Create result object
            result = ValuationResult(
                prop_id=prop_id,
                model_version_id=model_version_id_used,
                model_prediction_id=model_prediction_id,
                valuation_id=valuation_id,
                offered_line=prop_data.offered_line,
                fair_line=fair_line,
                prob_over=prob_over,
                prob_under=prob_under,
                expected_value=expected_value,
                payout_schema=prop_data.payout_schema,
                volatility_score=volatility_score,
                valuation_hash=valuation_hash,
                prediction_mean=prediction["mean"],
                prediction_variance=prediction["variance"],
                distribution_family=prediction["distribution_family"],
                created_at=datetime.now(timezone.utc)
            )
            
            logger.info(f"Valuation completed for prop {prop_id}: EV={expected_value:.4f}, fair_line={fair_line:.2f}")
            return result
            
        except Exception as e:
            logger.error(f"Valuation failed for prop {prop_id}: {e}")
            return None
    
    async def _load_prop_data(self, prop_id: int) -> Optional[PropData]:
        """
        Load prop data including current market quotes.
        
        TODO: Integrate with real prop data source
        """
        # Placeholder implementation
        # In production, this would query the prop database/ingestion system
        logger.warning(f"TODO: Load real prop data for prop_id {prop_id}")
        
        # Mock data for development
        return PropData(
            prop_id=prop_id,
            player_id=12345,  # Mock player ID
            prop_type="POINTS",
            offered_line=22.5,
            payout_schema=get_default_payout_schema("prizepicks_flat")
        )
    
    async def _store_model_prediction(
        self,
        model_version_id: int,
        prop_data: PropData,
        prediction: Dict[str, Any]
    ) -> Optional[int]:
        """
        Store model prediction with hash-based deduplication.
        
        Returns:
            int: model_prediction_id or None if failed
        """
        if not DB_AVAILABLE:
            logger.warning("Database not available, cannot store model prediction")
            return None
        
        try:
            async with get_db_session() as session:
                # Check for existing prediction with same features_hash
                features_hash = prediction.get("features_hash", "")
                
                # Try to find existing prediction
                result = await session.execute(
                    """
                    SELECT id FROM model_predictions 
                    WHERE model_version_id = :model_version_id 
                    AND prop_id = :prop_id 
                    AND features_hash = :features_hash
                    ORDER BY generated_at DESC 
                    LIMIT 1
                    """,
                    {
                        "model_version_id": model_version_id,
                        "prop_id": prop_data.prop_id,
                        "features_hash": features_hash
                    }
                )
                
                existing_row = result.fetchone()
                if existing_row:
                    logger.debug(f"Using existing model prediction: {existing_row[0]}")
                    return existing_row[0]
                
                # Create new prediction
                model_prediction = ModelPrediction(
                    model_version_id=model_version_id,
                    prop_id=prop_data.prop_id,
                    player_id=prop_data.player_id,
                    prop_type=prop_data.prop_type,
                    mean=prediction["mean"],
                    variance=prediction["variance"],
                    distribution_family=DistributionFamily[prediction["distribution_family"]],
                    sample_size=prediction.get("sample_size"),
                    features_hash=features_hash
                )
                
                session.add(model_prediction)
                await session.flush()
                model_prediction_id = model_prediction.id
                await session.commit()
                
                logger.debug(f"Stored new model prediction: {model_prediction_id}")
                return model_prediction_id
                
        except Exception as e:
            logger.error(f"Failed to store model prediction: {e}")
            return None
    
    async def _store_valuation(
        self,
        model_prediction_id: Optional[int],
        prop_data: PropData,
        fair_line: float,
        prob_over: float,
        prob_under: float,
        expected_value: float,
        volatility_score: float,
        valuation_hash: str
    ) -> Optional[int]:
        """
        Store valuation with hash-based deduplication.
        
        Returns:
            int: valuation_id or None if failed
        """
        if not DB_AVAILABLE or not model_prediction_id:
            logger.warning("Database not available or no model_prediction_id, cannot store valuation")
            return None
        
        try:
            async with get_db_session() as session:
                # Check for existing valuation with same hash
                result = await session.execute(
                    "SELECT id FROM valuations WHERE valuation_hash = :valuation_hash",
                    {"valuation_hash": valuation_hash}
                )
                
                existing_row = result.fetchone()
                if existing_row:
                    logger.debug(f"Using existing valuation: {existing_row[0]}")
                    return existing_row[0]
                
                # Create new valuation
                valuation = Valuation(
                    model_prediction_id=model_prediction_id,
                    prop_id=prop_data.prop_id,
                    offered_line=prop_data.offered_line,
                    fair_line=fair_line,
                    prob_over=prob_over,
                    prob_under=prob_under,
                    expected_value=expected_value,
                    payout_schema=prop_data.payout_schema,
                    volatility_score=volatility_score,
                    valuation_hash=valuation_hash
                )
                
                session.add(valuation)
                await session.flush()
                valuation_id = valuation.id
                await session.commit()
                
                logger.debug(f"Stored new valuation: {valuation_id}")
                return valuation_id
                
        except Exception as e:
            logger.error(f"Failed to store valuation: {e}")
            return None
    
    def _calculate_volatility_score(self, variance: float, mean: float) -> float:
        """
        Calculate volatility score as a function of variance scaled by mean.
        
        Args:
            variance: Prediction variance
            mean: Prediction mean
            
        Returns:
            float: Volatility score
        """
        if mean <= 0:
            return 1.0  # Default volatility
        
        # Volatility score = sqrt(variance) / (mean + 1)
        # The +1 prevents division by very small means
        volatility_score = (variance ** 0.5) / (mean + 1.0)
        
        # Cap at reasonable maximum
        return min(volatility_score, 5.0)
    
    def _create_valuation_hash(
        self,
        prop_id: int,
        model_version_id: int,
        offered_line: float,
        payout_schema: Dict[str, Any]
    ) -> str:
        """
        Create unique hash for valuation to prevent duplicates.
        
        Args:
            prop_id: Prop identifier
            model_version_id: Model version used
            offered_line: Market line
            payout_schema: Payout structure
            
        Returns:
            str: SHA256 hash
        """
        hash_components = [
            str(prop_id),
            str(model_version_id),
            f"{offered_line:.4f}",  # Round to avoid floating point issues
            str(sorted(payout_schema.items()))  # Consistent ordering
        ]
        
        hash_input = "|".join(hash_components)
        return hashlib.sha256(hash_input.encode()).hexdigest()


# Global valuation engine instance
valuation_engine = ValuationEngine()