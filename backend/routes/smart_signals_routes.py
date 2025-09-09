"""
Smart Signals API Routes
Provides endpoints for accessing smart signal analysis.
"""
import logging
from typing import List, Optional
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel, Field
from prometheus_client import Counter

from ..services.smart_signals import smart_signals_service, SmartSignal

logger = logging.getLogger("propollama.smart_signals_api")

# Prometheus metrics
smart_signals_generated_total = Counter(
    'smart_signals_generated_total',
    'Total number of smart signals generated',
    ['sport', 'outcome']
)

router = APIRouter(prefix="/api/signals", tags=["Smart Signals"])


class SignalFactorResponse(BaseModel):
    """Response model for individual signal factors."""
    name: str = Field(..., description="Factor name")
    value: float = Field(..., description="Factor value (0-100)")
    weight: float = Field(..., description="Factor weight in composite score")
    description: str = Field(..., description="Human-readable factor description")


class SmartSignalResponse(BaseModel):
    """Response model for smart signal analysis."""
    score: float = Field(..., description="Composite signal score (0-100)")
    factors: List[SignalFactorResponse] = Field(..., description="Contributing factors")
    confidence: float = Field(..., description="Confidence in signal (0-1)")
    timestamp: str = Field(..., description="Signal generation timestamp")


class SmartSignalOpportunity(BaseModel):
    """Enhanced opportunity with smart signal data."""
    # Base opportunity fields
    id: str
    player: str
    team: str
    opponent: str
    sport: str
    market: str
    line: float
    odds: int
    confidence: float
    edge: float
    
    # Enhanced fields
    bestBookmaker: Optional[str] = None
    lineSpread: Optional[float] = None
    oddsSpread: Optional[int] = None
    numBookmakers: Optional[int] = None
    hasArbitrage: Optional[bool] = None
    arbitrageProfitPct: Optional[float] = None
    
    # Smart signal fields
    smartScore: float
    signalFactors: List[SignalFactorResponse]


class SmartSignalsListResponse(BaseModel):
    """Response model for smart signals list endpoint."""
    opportunities: List[SmartSignalOpportunity]
    total_count: int
    filtered_count: int
    min_score_applied: float
    average_score: Optional[float]


@router.get("/smart", response_model=SmartSignalsListResponse)
async def get_smart_signals(
    sport: str = Query("MLB", description="Sport to analyze"),
    min_score: float = Query(70.0, ge=0, le=100, description="Minimum signal score"),
    limit: int = Query(50, ge=1, le=200, description="Maximum number of results")
):
    """
    Get betting opportunities with smart signal analysis.
    
    Returns opportunities that meet the minimum signal score threshold,
    enhanced with composite signal scores and contributing factors.
    """
    try:
        logger.info(f"Getting smart signals for {sport} with min_score={min_score}")
        
        # Check if smart signals are enabled
        if not smart_signals_service.enabled:
            smart_signals_generated_total.labels(sport=sport, outcome="disabled").inc()
            raise HTTPException(
                status_code=503,
                detail="Smart signals feature is disabled. Enable with ENABLE_SMART_SIGNALS=true"
            )
        
        # Get base opportunities from PropFinder
        from ..services.simple_propfinder_service import SimplePropFinderService
        propfinder_service = SimplePropFinderService()
        propfinder_data = await propfinder_service.get_opportunities()
        opportunities = propfinder_data.get("opportunities", [])
        
        if not opportunities:
            smart_signals_generated_total.labels(sport=sport, outcome="no_data").inc()
            return SmartSignalsListResponse(
                opportunities=[],
                total_count=0,
                filtered_count=0,
                min_score_applied=min_score,
                average_score=None
            )
        
        # Filter by sport if specified
        if sport != "ALL":
            opportunities = [opp for opp in opportunities if opp.get("sport", "").upper() == sport.upper()]
        
        total_count = len(opportunities)
        enhanced_opportunities = []
        signal_scores = []
        
        # Compute smart signals for each opportunity
        for opp in opportunities:
            try:
                signal = smart_signals_service.compute_signal(opp)
                
                if signal and signal.score >= min_score:
                    # Convert to enhanced opportunity
                    enhanced_opp = SmartSignalOpportunity(
                        id=opp.get("id", ""),
                        player=opp.get("player", ""),
                        team=opp.get("team", ""),
                        opponent=opp.get("opponent", ""),
                        sport=opp.get("sport", ""),
                        market=opp.get("market", ""),
                        line=opp.get("line", 0.0),
                        odds=opp.get("odds", 0),
                        confidence=opp.get("confidence", 0.0),
                        edge=opp.get("edge", 0.0),
                        bestBookmaker=opp.get("bestBookmaker"),
                        lineSpread=opp.get("lineSpread"),
                        oddsSpread=opp.get("oddsSpread"),
                        numBookmakers=opp.get("numBookmakers"),
                        hasArbitrage=opp.get("hasArbitrage"),
                        arbitrageProfitPct=opp.get("arbitrageProfitPct"),
                        smartScore=signal.score,
                        signalFactors=[
                            SignalFactorResponse(
                                name=f.name,
                                value=f.value,
                                weight=f.weight,
                                description=f.description
                            )
                            for f in signal.factors
                        ]
                    )
                    
                    enhanced_opportunities.append(enhanced_opp)
                    signal_scores.append(signal.score)
                    
                    smart_signals_generated_total.labels(sport=sport, outcome="success").inc()
                
            except Exception as e:
                logger.warning(f"Failed to compute signal for opportunity {opp.get('id', 'unknown')}: {e}")
                smart_signals_generated_total.labels(sport=sport, outcome="error").inc()
                continue
        
        # Sort by smart score descending (model uses camelCase field `smartScore`)
        enhanced_opportunities.sort(
            key=lambda x: getattr(x, "smartScore", 0.0),
            reverse=True,
        )
        
        # Apply limit
        enhanced_opportunities = enhanced_opportunities[:limit]
        
        # Calculate average score
        average_score = sum(signal_scores) / len(signal_scores) if signal_scores else None
        
        logger.info(f"Generated {len(enhanced_opportunities)} smart signals from {total_count} opportunities")
        
        return SmartSignalsListResponse(
            opportunities=enhanced_opportunities,
            total_count=total_count,
            filtered_count=len(enhanced_opportunities),
            min_score_applied=min_score,
            average_score=average_score
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in get_smart_signals: {e}", exc_info=True)
        smart_signals_generated_total.labels(sport=sport, outcome="error").inc()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/health")
async def smart_signals_health():
    """Health check endpoint for smart signals service."""
    return {
        "service": "smart_signals",
        "status": "healthy",
        "enabled": smart_signals_service.enabled,
        "weights": smart_signals_service.weights
    }