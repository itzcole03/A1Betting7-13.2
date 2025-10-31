"""
Unified Prediction Domain Models

Standardized data models for all prediction operations.
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional, Union
from dataclasses import dataclass
from pydantic import BaseModel, Field, validator


class Sport(str, Enum):
    """Supported sports"""
    MLB = "mlb"
    NBA = "nba" 
    NFL = "nfl"
    NHL = "nhl"
    

class PropType(str, Enum):
    """Prop bet types"""
    POINTS = "points"
    REBOUNDS = "rebounds"
    ASSISTS = "assists"
    STRIKEOUTS = "strikeouts"
    HITS = "hits"
    HOME_RUNS = "home_runs"
    RBI = "rbi"
    RUSHING_YARDS = "rushing_yards"
    PASSING_YARDS = "passing_yards"
    RECEIVING_YARDS = "receiving_yards"
    GOALS = "goals"
    SAVES = "saves"


class PredictionType(str, Enum):
    """Types of predictions"""
    SINGLE = "single"
    BATCH = "batch"
    LIVE = "live"
    ENSEMBLE = "ensemble"
    QUANTUM = "quantum"


class ModelType(str, Enum):
    """ML model types"""
    XGBOOST = "xgboost"
    LIGHTGBM = "lightgbm"
    CATBOOST = "catboost"
    NEURAL_NETWORK = "neural_network"
    TRANSFORMER = "transformer"
    ENSEMBLE = "ensemble"
    QUANTUM = "quantum"


class Recommendation(str, Enum):
    """Betting recommendations"""
    STRONG_OVER = "strong_over"
    OVER = "over"
    NEUTRAL = "neutral"
    UNDER = "under"
    STRONG_UNDER = "strong_under"
    AVOID = "avoid"


# Request Models
class PredictionRequest(BaseModel):
    """Base prediction request"""
    player_name: str = Field(..., description="Player name")
    sport: Sport = Field(..., description="Sport type")
    prop_type: PropType = Field(..., description="Prop bet type")
    line_score: float = Field(..., description="Betting line")
    game_date: Optional[datetime] = Field(None, description="Game date")
    opponent: Optional[str] = Field(None, description="Opponent team")
    
    @validator('line_score')
    def validate_line_score(cls, v):
        if v <= 0:
            raise ValueError('Line score must be positive')
        return v


class BatchPredictionRequest(BaseModel):
    """Batch prediction request"""
    predictions: List[PredictionRequest] = Field(..., description="List of predictions")
    include_explanations: bool = Field(False, description="Include SHAP explanations")
    model_type: Optional[ModelType] = Field(None, description="Preferred model type")


class QuantumOptimizationRequest(BaseModel):
    """Quantum optimization request"""
    predictions: List[PredictionRequest] = Field(..., description="Predictions to optimize")
    portfolio_size: Optional[int] = Field(5, description="Portfolio size")
    risk_tolerance: float = Field(0.5, description="Risk tolerance (0-1)")
    max_allocation: float = Field(0.2, description="Max allocation per bet")


# Response Models
@dataclass
class FeatureImportance:
    """Feature importance data"""
    feature_name: str
    importance: float
    impact: str  # "positive", "negative", "neutral"


@dataclass
class ModelConsensus:
    """Model consensus data"""
    model_type: str
    prediction: float
    confidence: float
    weight: float


class PredictionResponse(BaseModel):
    """Unified prediction response"""
    
    # Basic prediction info
    player_name: str
    sport: Sport
    prop_type: PropType
    line_score: float
    
    # Prediction results
    predicted_value: float
    confidence: float
    win_probability: float
    over_probability: float
    under_probability: float
    recommendation: Recommendation
    
    # Risk assessment
    risk_score: float
    kelly_fraction: float
    expected_value: float
    
    # Model ensemble data
    ensemble_confidence: float
    model_consensus: Dict[str, float]
    
    # Reasoning and explanations
    reasoning: str
    feature_importance: Optional[List[Dict[str, Any]]] = None
    
    # Metadata
    model_version: str
    generated_at: datetime
    prediction_id: str
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class ExplanationResponse(BaseModel):
    """SHAP explanation response"""
    prediction_id: str
    model_type: str
    base_value: float
    shap_values: List[float]
    feature_names: List[str]
    feature_values: List[float]
    explanation_summary: str
    feature_impacts: List[Dict[str, Any]]
    generated_at: datetime
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class ModelPerformanceMetrics(BaseModel):
    """Model performance metrics"""
    model_type: str
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    auc_roc: float
    mae: float
    rmse: float
    sharpe_ratio: float
    win_rate: float
    avg_confidence: float
    predictions_count: int
    last_updated: datetime
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class QuantumOptimizationResponse(BaseModel):
    """Quantum optimization response"""
    optimal_allocation: Dict[str, float]
    expected_return: float
    risk_score: float
    sharpe_ratio: float
    confidence_interval: List[float]
    quantum_advantage: float
    entanglement_score: float
    optimization_time: float
    
    # Individual predictions
    predictions: List[PredictionResponse]
    
    # Portfolio metrics
    portfolio_variance: float
    diversification_ratio: float
    max_drawdown: float
    
    generated_at: datetime
    optimization_id: str
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class HealthResponse(BaseModel):
    """Service health response"""
    status: str
    models_loaded: int
    cache_status: str
    last_prediction: Optional[datetime] = None
    uptime_seconds: float
    memory_usage_mb: float
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


# Error Models
class PredictionError(BaseModel):
    """Prediction error response"""
    error_code: str
    message: str
    details: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
