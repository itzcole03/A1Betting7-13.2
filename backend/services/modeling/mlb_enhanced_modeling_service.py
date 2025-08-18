"""
MLB-Enhanced Modeling Service - Section 2 Implementation

This service integrates MLB-specific modeling adaptations with the existing architecture:
- Extended baseline model factory with sport awareness
- MLB-specific prop-type distribution mapping  
- MLB-enhanced edge detection logic
- Backwards compatibility with NBA models
"""

import logging
from typing import Dict, Any, Optional

from .baseline_models import create_baseline_model, get_model_for_prop_type
from .model_registry import BaseStatModel

logger = logging.getLogger(__name__)


class MLBEnhancedModelingService:
    """
    Enhanced modeling service with MLB-specific capabilities
    
    Section 2: MLB-Specific Modeling Adaptations
    - Prop type distributions: Poisson for strikeouts, Binomial for hits, etc.
    - MLB-specific edge detection logic
    - Sport-aware model factory with fallback support
    """
    
    def __init__(self):
        self.name = "mlb_enhanced_modeling_service"
        self.version = "1.0"
        self._model_cache = {}
        
        logger.info("MLB-Enhanced Modeling Service initialized")
    
    async def predict_prop(
        self, 
        *, 
        player_id: int, 
        prop_type: str, 
        sport: str,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Make a prediction for a player prop with sport-specific modeling.
        
        Args:
            player_id: Player identifier
            prop_type: Type of prop (HITS, STRIKEOUTS_PITCHER, POINTS, etc.)
            sport: Sport context ("NBA", "MLB")
            context: Additional context data (at_bats, matchup info, etc.)
            
        Returns:
            dict: Enhanced prediction with sport-specific analysis
        """
        try:
            context = context or {}
            sport = sport.upper()
            
            logger.debug(f"Predicting {prop_type} for player {player_id} in {sport}")
            
            # Get the appropriate model for this prop type and sport
            model = self._get_model_for_prop(prop_type, sport)
            
            # Make the prediction
            base_prediction = await model.predict(
                player_id=player_id,
                prop_type=prop_type,
                context=context
            )
            
            # Enhance prediction with sport-specific metadata
            enhanced_prediction = {
                **base_prediction,
                "sport": sport,
                "prop_type": prop_type,
                "player_id": player_id,
                "model_info": {
                    "model_name": getattr(model, 'name', 'unknown'),
                    "model_version": getattr(model, 'version', 'v1'),
                    "model_type": getattr(model, 'model_type', 'UNKNOWN')
                },
                "sport_specific_enhancements": self._get_sport_enhancements(sport, prop_type)
            }
            
            logger.debug(f"Enhanced prediction completed: {enhanced_prediction['model_info']}")
            return enhanced_prediction
            
        except Exception as e:
            logger.error(f"Error in prop prediction: {e}")
            return {
                "error": str(e),
                "sport": sport,
                "prop_type": prop_type,
                "player_id": player_id,
                "success": False
            }
    
    async def analyze_edge(
        self, 
        *, 
        prediction: Dict[str, Any], 
        market_line: float,
        sport: str,
        prop_type: str
    ) -> Dict[str, Any]:
        """
        Analyze edge opportunities with sport-specific criteria.
        
        Args:
            prediction: Model prediction dictionary
            market_line: Market line/threshold
            sport: Sport context ("NBA", "MLB")
            prop_type: Type of prop being analyzed
            
        Returns:
            dict: Edge analysis with sport-specific enhancements
        """
        try:
            sport = sport.upper()
            
            logger.debug(f"Analyzing edge for {prop_type} in {sport}: line={market_line}")
            
            # Use sport-specific edge detection
            if sport == "MLB":
                edge_analysis = self._analyze_mlb_edge(prediction, market_line, prop_type)
            else:
                edge_analysis = self._analyze_nba_edge(prediction, market_line, prop_type)
            
            # Add metadata
            edge_analysis.update({
                "sport": sport,
                "prop_type": prop_type,
                "market_line": market_line,
                "analysis_timestamp": self._get_timestamp(),
                "model_used": prediction.get("model_info", {}).get("model_name", "unknown")
            })
            
            logger.debug(f"Edge analysis completed: {edge_analysis.get('edge_strength', 'UNKNOWN')}")
            return edge_analysis
            
        except Exception as e:
            logger.error(f"Error in edge analysis: {e}")
            return {
                "error": str(e),
                "has_edge": False,
                "edge_strength": "ERROR"
            }
    
    def _get_model_for_prop(self, prop_type: str, sport: str) -> BaseStatModel:
        """Get cached or create new model for prop type and sport"""
        cache_key = f"{sport}_{prop_type}"
        
        if cache_key not in self._model_cache:
            self._model_cache[cache_key] = get_model_for_prop_type(prop_type, sport)
        
        return self._model_cache[cache_key]
    
    def _analyze_mlb_edge(self, prediction: Dict[str, Any], market_line: float, prop_type: str) -> Dict[str, Any]:
        """MLB-specific edge detection logic"""
        try:
            from .mlb_models import validate_mlb_edge_detection_criteria
            return validate_mlb_edge_detection_criteria(prop_type, prediction, market_line)
        except ImportError:
            logger.warning("MLB models not available, using fallback edge detection")
            return self._analyze_generic_edge(prediction, market_line, prop_type)
    
    def _analyze_nba_edge(self, prediction: Dict[str, Any], market_line: float, prop_type: str) -> Dict[str, Any]:
        """NBA-specific edge detection logic"""
        pred_mean = prediction.get("mean", 0)
        pred_variance = prediction.get("variance", 0)
        
        edge_raw = pred_mean - market_line
        edge_percentage = (edge_raw / market_line * 100) if market_line > 0 else 0
        
        # NBA-specific thresholds
        if prop_type.upper() in ["POINTS", "ASSISTS", "REBOUNDS"]:
            confidence_threshold = 0.60  # Standard threshold for major stats
        else:
            confidence_threshold = 0.65  # Higher threshold for role stats
        
        # Simple confidence calculation
        import math
        std_dev = math.sqrt(pred_variance) if pred_variance > 0 else 1.0
        z_score = abs(edge_raw) / std_dev if std_dev > 0 else 0
        confidence = min(0.95, max(0.5, 0.5 + (z_score * 0.15)))  # Heuristic
        
        has_edge = confidence > confidence_threshold and abs(edge_raw) > 0.2
        
        return {
            "has_edge": has_edge,
            "edge_strength": "MODERATE" if has_edge else "NO_EDGE",
            "confidence": confidence,
            "confidence_threshold": confidence_threshold,
            "edge_raw": edge_raw,
            "edge_percentage": edge_percentage,
            "nba_specific_adjustments": {
                "confidence_threshold": confidence_threshold,
                "prop_category": "NBA_STANDARD"
            }
        }
    
    def _analyze_generic_edge(self, prediction: Dict[str, Any], market_line: float, prop_type: str) -> Dict[str, Any]:
        """Generic edge detection fallback"""
        pred_mean = prediction.get("mean", 0)
        edge_raw = pred_mean - market_line
        
        return {
            "has_edge": abs(edge_raw) > 0.5,
            "edge_strength": "WEAK" if abs(edge_raw) > 0.5 else "NO_EDGE",
            "confidence": 0.55,  # Conservative fallback
            "edge_raw": edge_raw,
            "fallback_analysis": True
        }
    
    def _get_sport_enhancements(self, sport: str, prop_type: str) -> Dict[str, Any]:
        """Get sport-specific enhancements for predictions"""
        if sport == "MLB":
            return {
                "distribution_rationale": self._get_mlb_distribution_rationale(prop_type),
                "seasonal_factors": ["weather", "ballpark", "pitcher_handedness"],
                "correlation_considerations": ["same_game_parlay", "pitcher_batter_matchup"]
            }
        elif sport == "NBA":
            return {
                "distribution_rationale": self._get_nba_distribution_rationale(prop_type),
                "situational_factors": ["back_to_back", "rest_days", "home_away"],
                "correlation_considerations": ["same_team_props", "pace_of_play"]
            }
        else:
            return {"generic": True}
    
    def _get_mlb_distribution_rationale(self, prop_type: str) -> str:
        """Get distribution choice rationale for MLB props"""
        prop_upper = prop_type.upper()
        
        if prop_upper in ["HITS", "HOME_RUNS", "RBI"]:
            return "Binomial: discrete trials (at-bats) with binary outcomes"
        elif prop_upper in ["STRIKEOUTS_PITCHER", "WALKS"]:
            return "Poisson: counting events occurring at regular rate"
        elif prop_upper in ["INNINGS_PITCHED", "ERA"]:
            return "Normal: continuous variable with symmetric distribution"
        else:
            return "Default distribution based on prop characteristics"
    
    def _get_nba_distribution_rationale(self, prop_type: str) -> str:
        """Get distribution choice rationale for NBA props"""
        prop_upper = prop_type.upper()
        
        if prop_upper in ["ASSISTS", "REBOUNDS", "STEALS"]:
            return "Poisson: discrete counting events"
        elif prop_upper in ["POINTS", "MINUTES"]:
            return "Normal: continuous variables with natural variation"
        else:
            return "Distribution selected based on statistical properties"
    
    def _get_timestamp(self) -> str:
        """Get current timestamp"""
        from datetime import datetime, timezone
        return datetime.now(timezone.utc).isoformat()
    
    async def health_check(self) -> Dict[str, Any]:
        """Service health check"""
        try:
            # Test model creation for both sports
            nba_model = self._get_model_for_prop("POINTS", "NBA")
            mlb_model_available = True
            
            try:
                mlb_model = self._get_model_for_prop("HITS", "MLB")
            except Exception as e:
                mlb_model_available = False
                logger.warning(f"MLB models not fully available: {e}")
            
            return {
                "service": self.name,
                "version": self.version,
                "status": "healthy",
                "capabilities": {
                    "nba_models": True,
                    "mlb_models": mlb_model_available,
                    "edge_detection": True,
                    "sport_specific_adaptations": True
                },
                "cached_models": len(self._model_cache)
            }
            
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return {
                "service": self.name,
                "version": self.version,
                "status": "degraded",
                "error": str(e)
            }


# Global service instance
mlb_enhanced_modeling_service = MLBEnhancedModelingService()


async def predict_prop_with_sport_awareness(
    player_id: int, 
    prop_type: str, 
    sport: str,
    context: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Convenience function for sport-aware prop predictions.
    
    Args:
        player_id: Player identifier
        prop_type: Type of prop
        sport: Sport context
        context: Additional context data
        
    Returns:
        dict: Enhanced prediction
    """
    return await mlb_enhanced_modeling_service.predict_prop(
        player_id=player_id,
        prop_type=prop_type,
        sport=sport,
        context=context
    )


async def analyze_edge_with_sport_criteria(
    prediction: Dict[str, Any], 
    market_line: float,
    sport: str,
    prop_type: str
) -> Dict[str, Any]:
    """
    Convenience function for sport-aware edge analysis.
    
    Args:
        prediction: Model prediction
        market_line: Market line
        sport: Sport context
        prop_type: Type of prop
        
    Returns:
        dict: Edge analysis
    """
    return await mlb_enhanced_modeling_service.analyze_edge(
        prediction=prediction,
        market_line=market_line,
        sport=sport,
        prop_type=prop_type
    )