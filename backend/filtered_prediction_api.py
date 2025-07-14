from typing import Optional

from fastapi import APIRouter, Query
from prediction_engine import PredictionRequest, PredictionResponse, predict

router = APIRouter()


@router.post("/predict/filtered", response_model=PredictionResponse)
def predict_filtered(
    req: PredictionRequest,
    min_confidence: Optional[float] = Query(
        None, description="Minimum confidence required"
    ),
    max_risk: Optional[float] = Query(None, description="Maximum risk allowed"),
):
    response = predict(req)
    if min_confidence is not None and response.confidence < min_confidence:
        response.explanation += f" Prediction filtered out: confidence {response.confidence} < {min_confidence}."
    if max_risk is not None and (1 - response.confidence) > max_risk:
        response.explanation += (
            f" Prediction filtered out: risk {(1 - response.confidence)} > {max_risk}."
        )
    return response
