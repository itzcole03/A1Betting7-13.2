"""
Hardened Arbitrage API Routes

Provides endpoints for arbitrage detection, configuration management,
and monitoring with comprehensive validation and alerting.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field, validator

from backend.core.response_models import StandardAPIResponse, ResponseBuilder
from backend.services.hardened_arbitrage_service import (
    get_hardened_arbitrage_service,
    HardenedArbitrageService,
    HardenedArbitrageOpportunity,
    ArbitrageConfig,
    DetectionReason,
    AnomalyType
)
from backend.services.unified_logging import unified_logging
from backend.services.ev_engine import ev_engine, compute_ev_details
from backend.core.exceptions import BusinessLogicException

logger = unified_logging.get_logger("hardened_arbitrage_routes")

router = APIRouter(prefix="/api/arbitrage", tags=["Hardened Arbitrage"])


# Request/Response Models

class ArbitrageConfigRequest(BaseModel):
    """Request model for arbitrage configuration updates"""
    min_profit_pct: Optional[float] = Field(None, ge=0.1, le=50.0, description="Minimum profit percentage threshold")
    max_profit_pct: Optional[float] = Field(None, ge=1.0, le=100.0, description="Maximum realistic profit percentage")
    max_stake_per_opportunity: Optional[float] = Field(None, ge=100.0, le=100000.0, description="Maximum stake per arbitrage")
    alert_volume_threshold: Optional[int] = Field(None, ge=1, le=100, description="Alert if > X opportunities in window")
    alert_time_window_minutes: Optional[int] = Field(None, ge=1, le=60, description="Time window for volume alerting")
    enable_anomaly_detection: Optional[bool] = Field(None, description="Enable anomaly detection")
    enable_triangle_validation: Optional[bool] = Field(None, description="Enable triangle consistency validation")
    enable_cross_market_validation: Optional[bool] = Field(None, description="Enable cross-market validation")
    stale_odds_threshold_seconds: Optional[int] = Field(None, ge=30, le=3600, description="Stale odds threshold in seconds")
    min_books_for_validation: Optional[int] = Field(None, ge=2, le=10, description="Minimum books for validation")
    suspicious_profit_threshold: Optional[float] = Field(None, ge=5.0, le=50.0, description="Suspicious profit threshold")
    odds_outlier_z_score_threshold: Optional[float] = Field(None, ge=1.0, le=5.0, description="Z-score threshold for odds outliers")
    volume_spike_threshold: Optional[float] = Field(None, ge=2.0, le=10.0, description="Volume spike threshold multiplier")
    
    @validator('min_profit_pct', 'max_profit_pct', 'suspicious_profit_threshold')
    def validate_percentage(cls, v):
        if v is not None and (v < 0 or v > 100):
            raise ValueError('Percentage values must be between 0 and 100')
        return v


class ArbitrageConfigResponse(BaseModel):
    """Response model for arbitrage configuration"""
    min_profit_pct: float
    max_profit_pct: float
    max_stake_per_opportunity: float
    alert_volume_threshold: int
    alert_time_window_minutes: int
    enable_anomaly_detection: bool
    enable_triangle_validation: bool
    enable_cross_market_validation: bool
    stale_odds_threshold_seconds: int
    min_books_for_validation: int
    suspicious_profit_threshold: float
    odds_outlier_z_score_threshold: float
    volume_spike_threshold: float
    last_updated: str


class OddsInput(BaseModel):
    """Input model for odds data"""
    book_id: str = Field(..., description="Sportsbook identifier")
    event_id: str = Field(..., description="Event identifier")
    market_type: str = Field(..., description="Market type (e.g., 'moneyline', 'spread')")
    outcome: str = Field(..., description="Outcome identifier (e.g., 'home', 'away', 'over', 'under')")
    odds: float = Field(..., gt=1.0, description="Decimal odds")
    line: Optional[float] = Field(None, description="Line/handicap value")
    max_stake: Optional[float] = Field(None, ge=0, description="Maximum stake allowed")
    timestamp: Optional[datetime] = Field(None, description="Timestamp of odds data")
    volume: Optional[float] = Field(None, ge=0, description="Market volume")
    quality: Optional[float] = Field(1.0, ge=0, le=1.0, description="Source quality score")


class ArbitrageDetectionRequest(BaseModel):
    """Request model for arbitrage detection"""
    odds_data: List[OddsInput] = Field(..., min_items=2, description="List of odds data")
    market_context: Optional[Dict[str, Any]] = Field(None, description="Additional market context")


class ValidationResultResponse(BaseModel):
    """Response model for validation results"""
    is_valid: bool
    confidence_score: float
    anomaly_flags: List[AnomalyType]
    validation_notes: List[str]
    implied_probability_sum: Optional[float]
    triangle_consistency_score: Optional[float]


class ArbitrageOpportunityResponse(BaseModel):
    """Response model for arbitrage opportunities"""
    id: str
    detection_reason: DetectionReason
    books_involved: List[str]
    event_id: str
    market_type: str
    guaranteed_profit_pct: float
    total_stake_required: float
    stake_distribution: Dict[str, float]
    expected_return: float
    validation_result: ValidationResultResponse
    anomaly: bool
    anomaly_types: List[AnomalyType]
    normalized_odds_snapshot_hash: str
    confidence_score: float
    execution_risk_score: float
    time_sensitivity_score: float
    implied_probabilities: Dict[str, float]
    detection_timestamp: datetime
    expiry_timestamp: Optional[datetime]
    market_conditions: Dict[str, Any]
    execution_notes: List[str]
    # Optional per-leg EV annotations when model probabilities are available
    leg_ev_details: Optional[Dict[str, Any]] = None


class ArbitrageDetectionResponse(BaseModel):
    """Response model for arbitrage detection results"""
    opportunities: List[ArbitrageOpportunityResponse]
    total_opportunities: int
    filtered_by_threshold: int
    detection_timestamp: datetime
    processing_time_ms: float


class ArbitrageMetricsResponse(BaseModel):
    """Response model for arbitrage metrics"""
    counters: Dict[str, int]
    recent_opportunities: int
    recent_alerts: int
    timestamp: str


# API Endpoints

@router.get("/config", response_model=StandardAPIResponse[ArbitrageConfigResponse])
async def get_arbitrage_config(
    service: HardenedArbitrageService = Depends(get_hardened_arbitrage_service)
):
    """
    Get current arbitrage detection configuration
    
    Returns the current configuration settings including:
    - Profit thresholds
    - Alerting settings
    - Validation parameters
    - Anomaly detection settings
    """
    try:
        config = await service.get_arbitrage_config()
        
        config_response = ArbitrageConfigResponse(**config)
        
        return ResponseBuilder.success(
            data=config_response,
            message="Arbitrage configuration retrieved successfully"
        )
        
    except Exception as e:
        logger.error(f"Failed to get arbitrage config: {e}")
        raise BusinessLogicException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve arbitrage configuration: {str(e)}"
        )


@router.post("/config", response_model=StandardAPIResponse[ArbitrageConfigResponse])
async def update_arbitrage_config(
    config_request: ArbitrageConfigRequest,
    service: HardenedArbitrageService = Depends(get_hardened_arbitrage_service)
):
    """
    Update arbitrage detection configuration
    
    Allows runtime adjustment of:
    - ARB_MIN_PROFIT_PCT threshold
    - Alerting parameters
    - Validation settings
    - Anomaly detection thresholds
    
    Note: Configuration changes are applied immediately but are ephemeral
    (stored in memory only for this session).
    """
    try:
        # Convert request to dict, excluding None values
        config_updates = config_request.dict(exclude_none=True)
        
        if not config_updates:
            raise BusinessLogicException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No valid configuration updates provided"
            )
        
        # Apply configuration updates
        updated_config = await service.update_arbitrage_config(config_updates)
        
        config_response = ArbitrageConfigResponse(**updated_config)
        
        logger.info(f"Updated arbitrage config: {config_updates}")
        
        return ResponseBuilder.success(
            data=config_response,
            message=f"Arbitrage configuration updated successfully. Updated fields: {list(config_updates.keys())}"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update arbitrage config: {e}")
        raise BusinessLogicException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update arbitrage configuration: {str(e)}"
        )


@router.post("/detect", response_model=StandardAPIResponse[ArbitrageDetectionResponse])
async def detect_arbitrage_opportunities(
    detection_request: ArbitrageDetectionRequest,
    include_anomalies: bool = Query(False, description="Include opportunities with anomalies"),
    min_confidence: float = Query(0.0, ge=0.0, le=1.0, description="Minimum confidence score"),
    service: HardenedArbitrageService = Depends(get_hardened_arbitrage_service)
):
    """
    Detect arbitrage opportunities with comprehensive validation
    
    Performs:
    1. Implied probability validation
    2. Triangle/cross-market consistency checks (3+ books)
    3. Anomaly detection and flagging
    4. Configurable profit threshold filtering
    5. Volume-based alerting
    
    Returns validated arbitrage opportunities with:
    - Detection reason and confidence scores
    - Anomaly flags and validation notes
    - Enhanced metadata and risk assessments
    - Normalized odds snapshot hash for tracking
    """
    start_time = datetime.now(timezone.utc)
    
    try:
        # Convert request data to internal format
        odds_data = [odds.dict() for odds in detection_request.odds_data]
        
        # Detect arbitrage opportunities
        opportunities = await service.detect_arbitrage_opportunities(
            odds_data=odds_data,
            market_context=detection_request.market_context
        )
        
        # Filter by confidence and anomaly preferences
        filtered_opportunities = []
        for opp in opportunities:
            # Skip anomalies if not requested
            if opp.anomaly and not include_anomalies:
                continue
                
            # Skip low confidence opportunities
            if opp.confidence_score < min_confidence:
                continue
                
            filtered_opportunities.append(opp)
        
        # Convert to response models
        opportunity_responses = []
        for opp in filtered_opportunities:
            validation_response = ValidationResultResponse(
                is_valid=opp.validation_result.is_valid,
                confidence_score=opp.validation_result.confidence_score,
                anomaly_flags=opp.validation_result.anomaly_flags,
                validation_notes=opp.validation_result.validation_notes,
                implied_probability_sum=opp.validation_result.implied_probability_sum,
                triangle_consistency_score=opp.validation_result.triangle_consistency_score
            )
            
            # Optional per-leg EV details
            leg_details: Optional[Dict[str, Any]] = None
            try:
                # Accept several possible keys for model probabilities
                prob_map = None
                mc = getattr(opp, 'market_conditions', None) or {}
                for key in ("model_probabilities", "ai_probabilities", "projection_probabilities"):
                    if isinstance(mc.get(key), dict):
                        prob_map = mc.get(key)
                        break
                if prob_map:
                    # Map outcome -> best decimal odds from snapshots
                    outcome_odds = {s.outcome: float(s.odds) for s in getattr(opp, 'odds_snapshots', [])}
                    result: Dict[str, Any] = {}
                    for outcome, prob_val in prob_map.items():
                        try:
                            if outcome in outcome_odds:
                                # Normalize probability
                                p = float(prob_val)
                                if p > 1.0:
                                    p = p / 100.0
                                if 0.0 <= p <= 1.0:
                                    american = ev_engine.decimal_to_american(outcome_odds[outcome])
                                    details = compute_ev_details(p, int(american), stake=100.0)
                                    result[outcome] = details
                        except Exception:
                            continue
                    if result:
                        leg_details = result
            except Exception:
                leg_details = None

            opp_response = ArbitrageOpportunityResponse(
                id=opp.id,
                detection_reason=opp.detection_reason,
                books_involved=opp.books_involved,
                event_id=opp.event_id,
                market_type=opp.market_type,
                guaranteed_profit_pct=opp.guaranteed_profit_pct,
                total_stake_required=opp.total_stake_required,
                stake_distribution=opp.stake_distribution,
                expected_return=opp.expected_return,
                validation_result=validation_response,
                anomaly=opp.anomaly,
                anomaly_types=opp.anomaly_types,
                normalized_odds_snapshot_hash=opp.normalized_odds_snapshot_hash,
                confidence_score=opp.confidence_score,
                execution_risk_score=opp.execution_risk_score,
                time_sensitivity_score=opp.time_sensitivity_score,
                implied_probabilities=opp.implied_probabilities,
                detection_timestamp=opp.detection_timestamp,
                expiry_timestamp=opp.expiry_timestamp,
                market_conditions=opp.market_conditions,
                execution_notes=opp.execution_notes,
                leg_ev_details=leg_details
            )
            
            opportunity_responses.append(opp_response)
        
        # Calculate processing time
        end_time = datetime.now(timezone.utc)
        processing_time_ms = (end_time - start_time).total_seconds() * 1000
        
        # Create response
        detection_response = ArbitrageDetectionResponse(
            opportunities=opportunity_responses,
            total_opportunities=len(opportunities),
            filtered_by_threshold=len(opportunities) - len(filtered_opportunities),
            detection_timestamp=start_time,
            processing_time_ms=processing_time_ms
        )
        
        logger.info(
            f"Detected {len(opportunities)} arbitrage opportunities, "
            f"returned {len(filtered_opportunities)} after filtering"
        )
        
        return ResponseBuilder.success(
            data=detection_response,
            message=f"Detected {len(filtered_opportunities)} arbitrage opportunities"
        )
        
    except Exception as e:
        logger.error(f"Arbitrage detection failed: {e}")
        raise BusinessLogicException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Arbitrage detection failed: {str(e)}"
        )


@router.get("/opportunities", response_model=StandardAPIResponse[ArbitrageDetectionResponse])
async def get_arbitrage_opportunities(
    event_ids: Optional[List[str]] = Query(None, description="Filter by event IDs"),
    market_types: Optional[List[str]] = Query(None, description="Filter by market types"),
    min_profit_pct: Optional[float] = Query(None, ge=0.1, description="Minimum profit percentage"),
    include_anomalies: bool = Query(False, description="Include opportunities with anomalies"),
    min_confidence: float = Query(0.5, ge=0.0, le=1.0, description="Minimum confidence score"),
    limit: int = Query(50, ge=1, le=500, description="Maximum number of opportunities to return"),
    service: HardenedArbitrageService = Depends(get_hardened_arbitrage_service)
):
    """
    Get current arbitrage opportunities with filtering options
    
    This endpoint would typically integrate with live odds feeds.
    For demonstration, it returns an empty list but shows the expected structure.
    """
    try:
        # In a real implementation, this would:
        # 1. Fetch live odds data from integrated feeds
        # 2. Apply the specified filters
        # 3. Return current opportunities
        
        # For now, return empty response structure
        detection_response = ArbitrageDetectionResponse(
            opportunities=[],
            total_opportunities=0,
            filtered_by_threshold=0,
            detection_timestamp=datetime.now(timezone.utc),
            processing_time_ms=0.0
        )
        
        return ResponseBuilder.success(
            data=detection_response,
            message="No live arbitrage opportunities currently available (demo mode)"
        )
        
    except Exception as e:
        logger.error(f"Failed to get arbitrage opportunities: {e}")
        raise BusinessLogicException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve arbitrage opportunities: {str(e)}"
        )


@router.get("/metrics", response_model=StandardAPIResponse[ArbitrageMetricsResponse])
async def get_arbitrage_metrics(
    service: HardenedArbitrageService = Depends(get_hardened_arbitrage_service)
):
    """
    Get arbitrage detection metrics and statistics
    
    Returns:
    - Detection counters
    - Recent activity statistics
    - Performance metrics
    - Alert history
    """
    try:
        metrics = await service.get_arbitrage_metrics()
        
        metrics_response = ArbitrageMetricsResponse(**metrics)
        
        return ResponseBuilder.success(
            data=metrics_response,
            message="Arbitrage metrics retrieved successfully"
        )
        
    except Exception as e:
        logger.error(f"Failed to get arbitrage metrics: {e}")
        raise BusinessLogicException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve arbitrage metrics: {str(e)}"
        )


@router.get("/health", response_model=StandardAPIResponse[Dict[str, Any]])
async def arbitrage_health_check(
    service: HardenedArbitrageService = Depends(get_hardened_arbitrage_service)
):
    """
    Health check for hardened arbitrage service
    
    Returns service status and component health information.
    """
    try:
        health_status = await service.health_check()
        
        return ResponseBuilder.success(
            data=health_status,
            message="Hardened arbitrage service is healthy"
        )
        
    except Exception as e:
        logger.error(f"Arbitrage health check failed: {e}")
        raise BusinessLogicException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Arbitrage service health check failed: {str(e)}"
        )


@router.post("/validate", response_model=StandardAPIResponse[ValidationResultResponse])
async def validate_arbitrage_opportunity(
    odds_data: List[OddsInput],
    profit_pct: float = Query(..., ge=0.1, le=100.0, description="Expected profit percentage"),
    service: HardenedArbitrageService = Depends(get_hardened_arbitrage_service)
):
    """
    Validate a specific arbitrage opportunity
    
    Performs comprehensive validation including:
    - Implied probability coverage analysis
    - Triangle consistency checks
    - Anomaly detection
    - Stale odds detection
    
    Useful for testing and validation of potential arbitrage opportunities.
    """
    try:
        # Convert to internal format
        odds_snapshots = await service._parse_odds_data([odds.dict() for odds in odds_data])
        
        # Perform validation
        validation_result = await service.validator.validate_arbitrage_opportunity(
            odds_snapshots, profit_pct
        )
        
        validation_response = ValidationResultResponse(
            is_valid=validation_result.is_valid,
            confidence_score=validation_result.confidence_score,
            anomaly_flags=validation_result.anomaly_flags,
            validation_notes=validation_result.validation_notes,
            implied_probability_sum=validation_result.implied_probability_sum,
            triangle_consistency_score=validation_result.triangle_consistency_score
        )
        
        return ResponseBuilder.success(
            data=validation_response,
            message=f"Arbitrage validation completed. Valid: {validation_result.is_valid}"
        )
        
    except Exception as e:
        logger.error(f"Arbitrage validation failed: {e}")
        raise BusinessLogicException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Arbitrage validation failed: {str(e)}"
        )


# Add router to main application
def include_arbitrage_routes(app):
    """Include arbitrage routes in the main FastAPI application"""
    app.include_router(router)