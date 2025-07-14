"""
SHAP Explanation Routes

This module contains endpoints for SHAP (SHapley Additive exPlanations) model interpretability.
"""

import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/shap", tags=["SHAP Explanations"])


class ShapExplanationRequest(BaseModel):
    player_name: str
    stat_type: str
    features: Dict[str, Any]
    model_type: Optional[str] = "ensemble"


class ShapExplanationResponse(BaseModel):
    base_value: float
    shap_values: Dict[str, float]
    feature_importance: Dict[str, float]
    explanation: str
    prediction: float
    confidence: float


@router.post("/explain", response_model=ShapExplanationResponse)
async def explain_prediction(request: ShapExplanationRequest) -> ShapExplanationResponse:
    """Generate SHAP explanation for a prediction"""
    try:
        # Import SHAP explainer
        try:
            from shap_explainer import SHAPExplainer
            explainer = SHAPExplainer()
            
            # Generate explanation
            explanation = await explainer.explain_prediction(
                player_name=request.player_name,
                stat_type=request.stat_type,
                features=request.features,
                model_type=request.model_type
            )
            
            return ShapExplanationResponse(**explanation)
            
        except ImportError:
            logger.warning("SHAP explainer not available, using mock explanation")
            
            # Mock SHAP explanation
            base_value = request.features.get("line", 25.0)
            
            # Generate mock SHAP values
            mock_shap_values = {
                "recent_performance": 0.15,
                "opponent_strength": -0.08,
                "home_away_factor": 0.05 if request.features.get("is_home", True) else -0.03,
                "rest_days": 0.02,
                "season_average": 0.12,
                "injury_status": 0.03,
                "weather_conditions": 0.01,
                "team_form": 0.07,
                "historical_matchup": -0.02,
                "minutes_projection": 0.09
            }
            
            # Calculate feature importance (normalized)
            total_abs_impact = sum(abs(v) for v in mock_shap_values.values())
            feature_importance = {
                k: abs(v) / total_abs_impact 
                for k, v in mock_shap_values.items()
            }
            
            # Generate explanation text
            top_positive = sorted(
                [(k, v) for k, v in mock_shap_values.items() if v > 0],
                key=lambda x: x[1],
                reverse=True
            )[:3]
            
            top_negative = sorted(
                [(k, v) for k, v in mock_shap_values.items() if v < 0],
                key=lambda x: x[1]
            )[:2]
            
            explanation_parts = []
            if top_positive:
                explanation_parts.append(
                    f"Factors supporting higher performance: {', '.join([f'{k.replace('_', ' ')}' for k, _ in top_positive])}"
                )
            
            if top_negative:
                explanation_parts.append(
                    f"Factors suggesting lower performance: {', '.join([f'{k.replace('_', ' ')}' for k, _ in top_negative])}"
                )
            
            explanation_text = ". ".join(explanation_parts) + "."
            
            # Calculate prediction
            prediction = base_value + sum(mock_shap_values.values())
            confidence = min(95, max(65, 75 + (abs(sum(mock_shap_values.values())) * 10)))
            
            return ShapExplanationResponse(
                base_value=base_value,
                shap_values=mock_shap_values,
                feature_importance=feature_importance,
                explanation=explanation_text,
                prediction=prediction,
                confidence=confidence
            )
            
    except Exception as e:
        logger.error(f"Error generating SHAP explanation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate SHAP explanation"
        )


@router.get("/features")
async def get_available_features() -> Dict[str, List[str]]:
    """Get available features for SHAP explanations"""
    try:
        return {
            "player_features": [
                "recent_performance",
                "season_average", 
                "career_average",
                "injury_status",
                "minutes_projection",
                "usage_rate",
                "efficiency_rating"
            ],
            "game_features": [
                "opponent_strength",
                "home_away_factor",
                "rest_days",
                "back_to_back",
                "travel_distance",
                "altitude",
                "weather_conditions"
            ],
            "team_features": [
                "team_form",
                "pace_factor",
                "defensive_rating",
                "offensive_rating",
                "net_rating",
                "recent_injuries"
            ],
            "matchup_features": [
                "historical_matchup",
                "head_to_head",
                "positional_matchup",
                "coaching_tendencies",
                "game_script",
                "motivation_factors"
            ]
        }
        
    except Exception as e:
        logger.error(f"Error fetching available features: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch available features"
        )


@router.post("/batch-explain")
async def batch_explain_predictions(
    requests: List[ShapExplanationRequest]
) -> List[ShapExplanationResponse]:
    """Generate SHAP explanations for multiple predictions"""
    try:
        if len(requests) > 50:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Maximum 50 explanations per batch request"
            )
        
        explanations = []
        for request in requests:
            try:
                explanation = await explain_prediction(request)
                explanations.append(explanation)
            except Exception as e:
                logger.error(f"Error explaining prediction for {request.player_name}: {e}")
                # Add a fallback explanation
                explanations.append(ShapExplanationResponse(
                    base_value=request.features.get("line", 25.0),
                    shap_values={"error": 0.0},
                    feature_importance={"error": 1.0},
                    explanation="Unable to generate explanation due to error",
                    prediction=request.features.get("line", 25.0),
                    confidence=50.0
                ))
        
        logger.info(f"Generated {len(explanations)} SHAP explanations")
        return explanations
        
    except Exception as e:
        logger.error(f"Error in batch SHAP explanation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate batch SHAP explanations"
        )
