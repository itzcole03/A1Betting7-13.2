"""
Unified Prediction Service Domain

This module consolidates all ML/AI prediction capabilities into a cohesive service
that provides consistent interfaces for accessing different types of predictions
and analytical insights.

Consolidates the following services:
- Enhanced ML Ensemble Service
- Quantum Optimization Service  
- SHAP Explainability Service
- Real ML Service
- Advanced Prediction Framework
- Model Performance Monitoring
- Feature Engineering Services
"""

from .service import UnifiedPredictionService
from .models import (
    PredictionRequest,
    PredictionResponse,
    ModelPerformanceMetrics,
    ExplanationResponse,
)
from .router import prediction_router

__all__ = [
    "UnifiedPredictionService",
    "PredictionRequest", 
    "PredictionResponse",
    "ModelPerformanceMetrics",
    "ExplanationResponse",
    "prediction_router",
]
