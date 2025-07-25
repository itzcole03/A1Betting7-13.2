"""
API Endpoints for Sports Prediction and Personalization
Exposes ML-powered prediction and personalization via FastAPI.
"""

import numpy as np
import pandas as pd
from fastapi import APIRouter, Request
from pydantic import BaseModel

from backend.sports_prediction_personalization import (
    get_personalization_api,
    get_prediction_api,
    get_recommendation_api,
)

router = APIRouter()


class PredictionRequest(BaseModel):
    features: list


class PersonalizationRequest(BaseModel):
    user_features: list


class RecommendationRequest(BaseModel):
    user_text: str


@router.post("/predict-sports")
async def predict_sports(request: PredictionRequest):
    features_df = pd.DataFrame(request.features)
    predictions = get_prediction_api(features_df)
    return {"predictions": predictions.tolist()}


@router.post("/personalize-user")
async def personalize_user(request: PersonalizationRequest):
    user_features_np = np.array(request.user_features)
    personalization = get_personalization_api(user_features_np)
    return {"personalization": personalization.tolist()}


@router.post("/recommend-content")
async def recommend_content(request: RecommendationRequest):
    recommendation = get_recommendation_api(request.user_text)
    return {"recommendation": recommendation}
