"""
Advanced Arbitrage Detection API Routes
API endpoints for sophisticated arbitrage opportunity detection and portfolio management.
Part of Phase 4.2: Elite Betting Operations and Automation
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Query, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
import logging

from ..services.advanced_arbitrage_engine import (
    get_arbitrage_engine, 
    ArbitrageOpportunity, 
    ArbitragePortfolio,
    ArbitrageType,
    RiskLevel,
    ArbitrageStatus
)

logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/api/advanced-arbitrage", tags=["Advanced Arbitrage Detection"])

# Response Models
class SportsbookOddsResponse(BaseModel):
    sportsbook: str
    game_id: str
    market_type: str
    selection: str
    odds_american: int
    odds_decimal: float
    line: Optional[float]
    timestamp: str
    volume: float
    max_bet: float
    reliability_score: float

class ArbitrageOpportunityResponse(BaseModel):
    opportunity_id: str
    sport: str
    game_id: str
    game_description: str
    arbitrage_type: str
    total_return: float
    profit_percentage: float
    guaranteed_profit: float
    required_stakes: Dict[str, float]
    sportsbooks_involved: List[str]
    odds_combinations: List[SportsbookOddsResponse]
    risk_level: str
    time_window_minutes: int
    confidence_score: float
    execution_complexity: int
    market_efficiency: float
    expected_hold_hours: float
    status: str
    created_at: str
    expires_at: str
    reasoning: str
    metadata: Dict[str, Any]

class ArbitragePortfolioResponse(BaseModel):
    total_opportunities: int
    active_opportunities: int
    total_expected_profit: float
    average_return: float
    risk_distribution: Dict[str, int]
    sportsbook_distribution: Dict[str, int]
    success_rate: float
    updated_at: str

class ArbitrageScanRequest(BaseModel):
    sports: Optional[List[str]] = Field(default=None, description="Specific sports to scan")
    sportsbooks: Optional[List[str]] = Field(default=None, description="Specific sportsbooks to include")
    min_profit_percentage: Optional[float] = Field(default=0.5, description="Minimum profit percentage")
    max_risk_level: Optional[str] = Field(default="high", description="Maximum risk level")
    arbitrage_types: Optional[List[str]] = Field(default=None, description="Types of arbitrage to detect")

class ArbitrageFilterRequest(BaseModel):
    sport: Optional[str] = None
    min_profit: Optional[float] = None
    max_risk_level: Optional[str] = None
    sportsbooks: Optional[List[str]] = None
    status: Optional[str] = None

def _convert_arbitrage_opportunity(opp: ArbitrageOpportunity) -> ArbitrageOpportunityResponse:
    """Convert internal arbitrage opportunity to API response"""
    return ArbitrageOpportunityResponse(
        opportunity_id=opp.opportunity_id,
        sport=opp.sport,
        game_id=opp.game_id,
        game_description=opp.game_description,
        arbitrage_type=opp.arbitrage_type.value,
        total_return=opp.total_return,
        profit_percentage=opp.profit_percentage,
        guaranteed_profit=opp.guaranteed_profit,
        required_stakes=opp.required_stakes,
        sportsbooks_involved=opp.sportsbooks_involved,
        odds_combinations=[
            SportsbookOddsResponse(
                sportsbook=odds.sportsbook,
                game_id=odds.game_id,
                market_type=odds.market_type,
                selection=odds.selection,
                odds_american=odds.odds_american,
                odds_decimal=odds.odds_decimal,
                line=odds.line,
                timestamp=odds.timestamp.isoformat(),
                volume=odds.volume,
                max_bet=odds.max_bet,
                reliability_score=odds.reliability_score
            ) for odds in opp.odds_combinations
        ],
        risk_level=opp.risk_level.value,
        time_window_minutes=int(opp.time_window.total_seconds() / 60),
        confidence_score=opp.confidence_score,
        execution_complexity=opp.execution_complexity,
        market_efficiency=opp.market_efficiency,
        expected_hold_hours=opp.expected_hold_time.total_seconds() / 3600,
        status=opp.status.value,
        created_at=opp.created_at.isoformat(),
        expires_at=opp.expires_at.isoformat(),
        reasoning=opp.reasoning,
        metadata=opp.metadata
    )

@router.get("/scan", response_model=Dict[str, List[ArbitrageOpportunityResponse]])
async def scan_arbitrage_opportunities(
    background_tasks: BackgroundTasks,
    sports: Optional[str] = Query(None, description="Comma-separated list of sports"),
    sportsbooks: Optional[str] = Query(None, description="Comma-separated list of sportsbooks"),
    min_profit_percentage: float = Query(0.5, description="Minimum profit percentage"),
    max_risk_level: str = Query("high", description="Maximum risk level")
):
    """
    Comprehensive scan for arbitrage opportunities across all supported sportsbooks
    """
    try:
        engine = get_arbitrage_engine()
        
        # Parse query parameters
        sports_list = sports.split(",") if sports else None
        sportsbooks_list = sportsbooks.split(",") if sportsbooks else None
        
        logger.info(f"Starting arbitrage scan with params: sports={sports_list}, sportsbooks={sportsbooks_list}")
        
        # Perform comprehensive scan
        opportunities = await engine.scan_all_arbitrage_opportunities()
        
        # Apply filters
        filtered_opportunities = {}
        for category, opps in opportunities.items():
            filtered_opps = []
            for opp in opps:
                # Apply filters
                if opp.profit_percentage < min_profit_percentage:
                    continue
                    
                # Risk level filter
                risk_levels = ["low", "medium", "high", "extreme"]
                if risk_levels.index(opp.risk_level.value) > risk_levels.index(max_risk_level.lower()):
                    continue
                    
                # Sports filter
                if sports_list and opp.sport not in sports_list:
                    continue
                    
                # Sportsbooks filter
                if sportsbooks_list:
                    if not any(sb in sportsbooks_list for sb in opp.sportsbooks_involved):
                        continue
                
                filtered_opps.append(_convert_arbitrage_opportunity(opp))
            
            filtered_opportunities[category] = filtered_opps
        
        # Log results
        total_opportunities = sum(len(opps) for opps in filtered_opportunities.values())
        logger.info(f"Found {total_opportunities} arbitrage opportunities across {len(filtered_opportunities)} categories")
        
        return filtered_opportunities
        
    except Exception as e:
        logger.error(f"Error scanning arbitrage opportunities: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to scan arbitrage opportunities: {str(e)}")

@router.get("/opportunities", response_model=List[ArbitrageOpportunityResponse])
async def get_arbitrage_opportunities(
    sport: Optional[str] = Query(None, description="Filter by sport"),
    min_profit: Optional[float] = Query(None, description="Minimum profit percentage"),
    max_risk_level: Optional[str] = Query(None, description="Maximum risk level"),
    sportsbooks: Optional[str] = Query(None, description="Comma-separated sportsbooks"),
    status: Optional[str] = Query("active", description="Opportunity status"),
    limit: int = Query(50, description="Maximum number of opportunities to return")
):
    """
    Get filtered list of arbitrage opportunities
    """
    try:
        engine = get_arbitrage_engine()
        
        # Get all opportunities
        all_opportunities = list(engine.opportunities.values())
        
        # Apply filters
        filtered_opportunities = []
        sportsbooks_list = sportsbooks.split(",") if sportsbooks else None
        
        for opp in all_opportunities:
            # Status filter
            if status and opp.status.value != status.lower():
                continue
                
            # Sport filter
            if sport and opp.sport != sport.lower():
                continue
                
            # Profit filter
            if min_profit and opp.profit_percentage < min_profit:
                continue
                
            # Risk level filter
            if max_risk_level:
                risk_levels = ["low", "medium", "high", "extreme"]
                if risk_levels.index(opp.risk_level.value) > risk_levels.index(max_risk_level.lower()):
                    continue
            
            # Sportsbooks filter
            if sportsbooks_list:
                if not any(sb in sportsbooks_list for sb in opp.sportsbooks_involved):
                    continue
            
            filtered_opportunities.append(opp)
        
        # Sort by profit percentage (descending)
        filtered_opportunities.sort(key=lambda x: x.profit_percentage, reverse=True)
        
        # Apply limit
        filtered_opportunities = filtered_opportunities[:limit]
        
        # Convert to response format
        response_opportunities = [_convert_arbitrage_opportunity(opp) for opp in filtered_opportunities]
        
        logger.info(f"Returning {len(response_opportunities)} filtered arbitrage opportunities")
        return response_opportunities
        
    except Exception as e:
        logger.error(f"Error getting arbitrage opportunities: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get arbitrage opportunities: {str(e)}")

@router.get("/opportunity/{opportunity_id}", response_model=ArbitrageOpportunityResponse)
async def get_arbitrage_opportunity(opportunity_id: str):
    """
    Get detailed information about a specific arbitrage opportunity
    """
    try:
        engine = get_arbitrage_engine()
        
        if opportunity_id not in engine.opportunities:
            raise HTTPException(status_code=404, detail="Arbitrage opportunity not found")
        
        opportunity = engine.opportunities[opportunity_id]
        return _convert_arbitrage_opportunity(opportunity)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting arbitrage opportunity {opportunity_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get arbitrage opportunity: {str(e)}")

@router.get("/portfolio", response_model=ArbitragePortfolioResponse)
async def get_arbitrage_portfolio():
    """
    Get comprehensive arbitrage portfolio summary
    """
    try:
        engine = get_arbitrage_engine()
        portfolio = await engine.get_portfolio_summary()
        
        return ArbitragePortfolioResponse(
            total_opportunities=portfolio.total_opportunities,
            active_opportunities=portfolio.active_opportunities,
            total_expected_profit=portfolio.total_expected_profit,
            average_return=portfolio.average_return,
            risk_distribution={level.value: count for level, count in portfolio.risk_distribution.items()},
            sportsbook_distribution=portfolio.sportsbook_distribution,
            success_rate=portfolio.success_rate,
            updated_at=portfolio.updated_at.isoformat()
        )
        
    except Exception as e:
        logger.error(f"Error getting arbitrage portfolio: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get arbitrage portfolio: {str(e)}")

@router.post("/analyze")
async def analyze_arbitrage_opportunity(
    opportunity_id: str,
    stake_amount: float = 1000.0
):
    """
    Analyze a specific arbitrage opportunity with custom stake amount
    """
    try:
        engine = get_arbitrage_engine()
        
        if opportunity_id not in engine.opportunities:
            raise HTTPException(status_code=404, detail="Arbitrage opportunity not found")
        
        opportunity = engine.opportunities[opportunity_id]
        
        # Calculate scaled stakes and returns
        total_current_stake = sum(opportunity.required_stakes.values())
        scale_factor = stake_amount / total_current_stake
        
        scaled_stakes = {
            sportsbook: stake * scale_factor 
            for sportsbook, stake in opportunity.required_stakes.items()
        }
        
        scaled_profit = opportunity.guaranteed_profit * scale_factor
        scaled_return = opportunity.total_return * scale_factor
        
        analysis = {
            "opportunity_id": opportunity_id,
            "original_stake": total_current_stake,
            "requested_stake": stake_amount,
            "scale_factor": scale_factor,
            "scaled_stakes": scaled_stakes,
            "expected_profit": scaled_profit,
            "expected_return": scaled_return,
            "profit_percentage": opportunity.profit_percentage,
            "risk_assessment": {
                "risk_level": opportunity.risk_level.value,
                "confidence_score": opportunity.confidence_score,
                "execution_complexity": opportunity.execution_complexity,
                "time_window_minutes": int(opportunity.time_window.total_seconds() / 60)
            },
            "sportsbook_details": [
                {
                    "sportsbook": odds.sportsbook,
                    "selection": odds.selection,
                    "odds_american": odds.odds_american,
                    "odds_decimal": odds.odds_decimal,
                    "required_stake": scaled_stakes.get(odds.sportsbook, 0),
                    "potential_return": scaled_stakes.get(odds.sportsbook, 0) * odds.odds_decimal,
                    "reliability_score": odds.reliability_score
                }
                for odds in opportunity.odds_combinations
            ]
        }
        
        return analysis
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing arbitrage opportunity {opportunity_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze arbitrage opportunity: {str(e)}")

@router.get("/sportsbooks", response_model=Dict[str, Dict[str, Any]])
async def get_sportsbook_information():
    """
    Get information about all supported sportsbooks
    """
    try:
        engine = get_arbitrage_engine()
        
        sportsbook_info = {}
        for sportsbook, config in engine.sportsbooks.items():
            sportsbook_info[sportsbook] = {
                "priority": config["priority"],
                "reliability": config["reliability"],
                "max_bet": config["max_bet"],
                "speed": config["speed"],
                "current_reliability_score": engine.sportsbook_reliabilities.get(sportsbook, 0.5)
            }
        
        return sportsbook_info
        
    except Exception as e:
        logger.error(f"Error getting sportsbook information: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get sportsbook information: {str(e)}")

@router.get("/stats", response_model=Dict[str, Any])
async def get_arbitrage_statistics():
    """
    Get comprehensive arbitrage detection statistics
    """
    try:
        engine = get_arbitrage_engine()
        
        all_opportunities = list(engine.opportunities.values())
        active_opportunities = [opp for opp in all_opportunities if opp.status == ArbitrageStatus.ACTIVE]
        
        # Calculate statistics
        stats = {
            "total_opportunities_found": len(all_opportunities),
            "active_opportunities": len(active_opportunities),
            "average_profit_percentage": np.mean([opp.profit_percentage for opp in active_opportunities]) if active_opportunities else 0,
            "max_profit_percentage": max([opp.profit_percentage for opp in active_opportunities]) if active_opportunities else 0,
            "total_guaranteed_profit": sum([opp.guaranteed_profit for opp in active_opportunities]),
            "arbitrage_type_distribution": {
                arb_type.value: len([opp for opp in active_opportunities if opp.arbitrage_type == arb_type])
                for arb_type in ArbitrageType
            },
            "risk_level_distribution": {
                risk_level.value: len([opp for opp in active_opportunities if opp.risk_level == risk_level])
                for risk_level in RiskLevel
            },
            "sportsbook_involvement": {
                sportsbook: sum([1 for opp in active_opportunities if sportsbook in opp.sportsbooks_involved])
                for sportsbook in engine.sportsbooks.keys()
            },
            "average_confidence_score": np.mean([opp.confidence_score for opp in active_opportunities]) if active_opportunities else 0,
            "last_scan_time": datetime.now().isoformat()
        }
        
        return stats
        
    except Exception as e:
        logger.error(f"Error getting arbitrage statistics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get arbitrage statistics: {str(e)}")

@router.post("/refresh")
async def refresh_arbitrage_opportunities(background_tasks: BackgroundTasks):
    """
    Manually trigger a refresh of arbitrage opportunities
    """
    try:
        engine = get_arbitrage_engine()
        
        # Start background refresh
        background_tasks.add_task(engine.scan_all_arbitrage_opportunities)
        
        return {
            "message": "Arbitrage opportunity refresh initiated",
            "timestamp": datetime.now().isoformat(),
            "status": "in_progress"
        }
        
    except Exception as e:
        logger.error(f"Error refreshing arbitrage opportunities: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to refresh arbitrage opportunities: {str(e)}")
