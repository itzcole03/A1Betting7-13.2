"""
CLV Bet Tracking Routes

API endpoints for tracking user bets and computing CLV analytics
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
import uuid

from backend.models.clv_bet_tracking import CLVBetTracking, CLVAnalyticsSummary, CLVLeaderboard, BetStatus, CLVComputationStatus
from backend.utils.clv_utils import generate_bet_id, calculate_clv_percent, get_clv_tier, get_achievement_badges
from backend.database import get_db
from backend.auth.security import get_current_user
from backend.tasks.clv_computation_task import clv_computation_task
from backend.core.exceptions import BusinessLogicException

router = APIRouter(prefix="/api/bets", tags=["CLV Tracking"])


# Request/Response Models
class BetTrackingRequest(BaseModel):
    """Request model for tracking a new bet"""
    sport: str = Field(description="Sport (NBA, MLB, NFL, etc.)")
    market: str = Field(description="Market type (totals, spreads, etc.)")
    player: Optional[str] = Field(None, description="Player name if applicable")
    team: Optional[str] = Field(None, description="Team name")
    opponent: Optional[str] = Field(None, description="Opponent team")
    bet_type: str = Field(description="over/under, spread, moneyline, etc.")
    stake_amount: float = Field(gt=0, description="Amount staked on the bet")
    placed_odds: int = Field(description="Odds when bet was placed (American format)")
    placed_line: Optional[float] = Field(None, description="Line when bet was placed")
    sportsbook: Optional[str] = Field(None, description="Sportsbook used")
    game_start_time: Optional[datetime] = Field(None, description="Game start time")
    bet_confidence: Optional[float] = Field(None, ge=0, le=100, description="Confidence rating (0-100)")
    bet_tags: Optional[List[str]] = Field(None, description="User tags for categorization")
    bet_notes: Optional[str] = Field(None, max_length=500, description="User notes about the bet")
    external_bet_id: Optional[str] = Field(None, description="External sportsbook bet ID")


class BetTrackingResponse(BaseModel):
    """Response model for bet tracking"""
    bet_id: str
    user_id: str
    sport: str
    market: str
    player: Optional[str]
    team: Optional[str]
    bet_type: str
    stake_amount: float
    placed_odds: int
    placed_line: Optional[float]
    sportsbook: Optional[str]
    placed_at: datetime
    clv_status: str
    message: str


class CLVUpdateRequest(BaseModel):
    """Request model for updating CLV with closing odds"""
    closing_odds: int = Field(description="Closing odds (American format)")
    closing_line: Optional[float] = Field(None, description="Closing line")


class UserCLVAnalytics(BaseModel):
    """Response model for user CLV analytics"""
    user_id: str
    period_start: datetime
    period_end: datetime
    total_bets: int
    bets_with_clv: int
    avg_clv_percent: Optional[float]
    median_clv_percent: Optional[float]
    clv_distribution: Dict[str, int]
    performance_metrics: Dict[str, float]
    top_performers: Dict[str, str]
    sport_breakdown: Dict[str, Any]
    market_breakdown: Dict[str, Any]
    recent_bets: List[Dict[str, Any]]


@router.post("/track", response_model=BetTrackingResponse)
async def track_bet(
    bet_data: BetTrackingRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Track a new bet placement for CLV analysis
    
    This endpoint captures bet details when a user places a bet,
    storing all necessary information for future CLV computation.
    """
    try:
        # Generate unique bet ID
        bet_id = generate_bet_id()
        
        # Create bet tracking record
        bet_record = CLVBetTracking(
            bet_id=bet_id,
            user_id=current_user.id,
            sport=bet_data.sport,
            market=bet_data.market,
            player=bet_data.player,
            team=bet_data.team,
            opponent=bet_data.opponent,
            bet_type=bet_data.bet_type,
            stake_amount=bet_data.stake_amount,
            placed_odds=bet_data.placed_odds,
            placed_line=bet_data.placed_line,
            sportsbook=bet_data.sportsbook,
            placed_at=datetime.now(timezone.utc),
            game_start_time=bet_data.game_start_time,
            bet_confidence=bet_data.bet_confidence,
            bet_tags=bet_data.bet_tags or [],
            bet_notes=bet_data.bet_notes,
            external_bet_id=bet_data.external_bet_id,
            clv_status=CLVComputationStatus.PENDING,
            bet_status=BetStatus.ACTIVE
        )
        
        # Save to database
        db.add(bet_record)
        db.commit()
        db.refresh(bet_record)
        
        return {
            "bet_id": bet_record.bet_id,
            "user_id": bet_record.user_id,
            "sport": bet_record.sport,
            "market": bet_record.market,
            "player": bet_record.player,
            "team": bet_record.team,
            "bet_type": bet_record.bet_type,
            "stake_amount": bet_record.stake_amount,
            "placed_odds": bet_record.placed_odds,
            "placed_line": bet_record.placed_line,
            "sportsbook": bet_record.sportsbook,
            "placed_at": bet_record.placed_at,
            "clv_status": bet_record.clv_status,
            "message": "Bet successfully tracked for CLV analysis"
        }
        
    except Exception as e:
        db.rollback()
        raise BusinessLogicException(f"Failed to track bet: {str(e, status_code=500)}")


@router.put("/track/{bet_id}/clv", response_model=Dict[str, Any])
async def update_bet_clv(
    bet_id: str,
    clv_data: CLVUpdateRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Update bet with closing odds and compute CLV
    
    This endpoint is typically called by scheduled tasks or manual CLV updates
    when closing odds become available.
    """
    try:
        # Find the bet record
        bet_record = db.query(CLVBetTracking).filter(
            CLVBetTracking.bet_id == bet_id,
            CLVBetTracking.user_id == current_user.id
        ).first()
        
        if not bet_record:
            raise BusinessLogicException("Bet not found", status_code=404)
        
        # Update closing odds
        setattr(bet_record, 'closing_odds', clv_data.closing_odds)
        setattr(bet_record, 'closing_line', clv_data.closing_line)
        setattr(bet_record, 'closing_captured_at', datetime.now(timezone.utc))
        
        # Calculate CLV using the values directly
        placed_odds_val = getattr(bet_record, 'placed_odds')
        clv_percent = calculate_clv_percent(placed_odds_val, clv_data.closing_odds)
        
        if clv_percent is not None:
            setattr(bet_record, 'clv_percent', clv_percent)
            setattr(bet_record, 'clv_status', CLVComputationStatus.COMPUTED)
            setattr(bet_record, 'clv_computed_at', datetime.now(timezone.utc))
            
            # Calculate line movement if applicable
            placed_line_val = getattr(bet_record, 'placed_line')
            if placed_line_val is not None and clv_data.closing_line is not None:
                setattr(bet_record, 'line_movement', clv_data.closing_line - placed_line_val)
            
            # Calculate odds movement
            setattr(bet_record, 'odds_movement', clv_data.closing_odds - placed_odds_val)
            
            # Commit changes
            db.commit()
            
            return {
                "bet_id": bet_id,
                "clv_percent": clv_percent,
                "clv_tier": get_clv_tier(clv_percent),
                "line_movement": bet_record.line_movement,
                "odds_movement": bet_record.odds_movement,
                "message": "CLV successfully computed"
            }
        else:
            setattr(bet_record, 'clv_status', CLVComputationStatus.ERROR)
            db.commit()
            raise BusinessLogicException("Unable to compute CLV with provided odds", status_code=400)
            
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise BusinessLogicException(f"Failed to update CLV: {str(e, status_code=500)}")


@router.get("/track", response_model=List[Dict[str, Any]])
async def get_user_bets(
    sport: Optional[str] = Query(None, description="Filter by sport"),
    market: Optional[str] = Query(None, description="Filter by market"),
    clv_status: Optional[str] = Query(None, description="Filter by CLV status"),
    bet_status: Optional[str] = Query(None, description="Filter by bet status"),
    days: int = Query(30, ge=1, le=365, description="Number of days to look back"),
    limit: int = Query(50, ge=1, le=500, description="Maximum number of bets to return"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get user's tracked bets with optional filtering
    """
    try:
        # Build query
        query = db.query(CLVBetTracking).filter(
            CLVBetTracking.user_id == current_user.id,
            CLVBetTracking.placed_at >= datetime.now(timezone.utc) - timedelta(days=days)
        )
        
        # Apply filters
        if sport:
            query = query.filter(CLVBetTracking.sport == sport)
        if market:
            query = query.filter(CLVBetTracking.market == market)
        if clv_status:
            query = query.filter(CLVBetTracking.clv_status == clv_status)
        if bet_status:
            query = query.filter(CLVBetTracking.bet_status == bet_status)
        
        # Execute query
        bets = query.order_by(CLVBetTracking.placed_at.desc()).limit(limit).all()
        
        # Format response
        result = []
        for bet in bets:
            bet_data = {
                "bet_id": getattr(bet, "bet_id"),
                "sport": getattr(bet, "sport"),
                "market": getattr(bet, "market"),
                "player": getattr(bet, "player"),
                "team": getattr(bet, "team"),
                "bet_type": getattr(bet, "bet_type"),
                "stake_amount": getattr(bet, "stake_amount"),
                "placed_odds": getattr(bet, "placed_odds"),
                "placed_line": getattr(bet, "placed_line"),
                "sportsbook": getattr(bet, "sportsbook"),
                "placed_at": getattr(bet, "placed_at"),
                "clv_percent": getattr(bet, "clv_percent"),
                "clv_tier": get_clv_tier(getattr(bet, 'clv_percent')) if getattr(bet, 'clv_percent') is not None else "unknown",
                "clv_status": getattr(bet, "clv_status"),
                "bet_status": getattr(bet, "bet_status"),
                "profit_loss": getattr(bet, "profit_loss"),
                "bet_confidence": getattr(bet, "bet_confidence"),
                "bet_tags": getattr(bet, "bet_tags") or []
            }
            result.append(bet_data)
        
        return result
        
    except Exception as e:
        raise BusinessLogicException(f"Failed to retrieve bets: {str(e, status_code=500)}")


@router.get("/track/{bet_id}", response_model=Dict[str, Any])
async def get_bet_details(
    bet_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get detailed information about a specific bet
    """
    try:
        bet_record = db.query(CLVBetTracking).filter(
            CLVBetTracking.bet_id == bet_id,
            CLVBetTracking.user_id == current_user.id
        ).first()
        
        if not bet_record:
            raise BusinessLogicException("Bet not found", status_code=404)
        
        return {
            "bet_id": getattr(bet_record, "bet_id"),
            "sport": getattr(bet_record, "sport"),
            "market": getattr(bet_record, "market"),
            "player": getattr(bet_record, "player"),
            "team": getattr(bet_record, "team"),
            "opponent": getattr(bet_record, "opponent"),
            "bet_type": getattr(bet_record, "bet_type"),
            "stake_amount": getattr(bet_record, "stake_amount"),
            "placed_odds": getattr(bet_record, "placed_odds"),
            "placed_line": getattr(bet_record, "placed_line"),
            "closing_odds": getattr(bet_record, "closing_odds"),
            "closing_line": getattr(bet_record, "closing_line"),
            "sportsbook": getattr(bet_record, "sportsbook"),
            "placed_at": getattr(bet_record, "placed_at"),
            "game_start_time": getattr(bet_record, "game_start_time"),
            "clv_percent": getattr(bet_record, "clv_percent"),
            "clv_tier": get_clv_tier(getattr(bet_record, 'clv_percent')) if getattr(bet_record, 'clv_percent') is not None else "unknown",
            "clv_status": getattr(bet_record, "clv_status"),
            "clv_computed_at": getattr(bet_record, "clv_computed_at"),
            "bet_status": getattr(bet_record, "bet_status"),
            "actual_result": getattr(bet_record, "actual_result"),
            "bet_result": getattr(bet_record, "bet_result"),
            "profit_loss": getattr(bet_record, "profit_loss"),
            "settled_at": getattr(bet_record, "settled_at"),
            "line_movement": getattr(bet_record, "line_movement"),
            "odds_movement": getattr(bet_record, "odds_movement"),
            "bet_confidence": getattr(bet_record, "bet_confidence"),
            "bet_tags": getattr(bet_record, "bet_tags") or [],
            "bet_notes": getattr(bet_record, "bet_notes"),
            "external_bet_id": getattr(bet_record, "external_bet_id"),
            "data_quality_score": getattr(bet_record, "data_quality_score"),
            "created_at": getattr(bet_record, "created_at")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise BusinessLogicException(f"Failed to retrieve bet details: {str(e, status_code=500)}")


@router.delete("/track/{bet_id}")
async def delete_bet(
    bet_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Delete a tracked bet (for corrections or cancellations)
    """
    try:
        bet_record = db.query(CLVBetTracking).filter(
            CLVBetTracking.bet_id == bet_id,
            CLVBetTracking.user_id == current_user.id
        ).first()
        
        if not bet_record:
            raise BusinessLogicException("Bet not found", status_code=404)
        
        db.delete(bet_record)
        db.commit()
        
        return {"message": f"Bet {bet_id} successfully deleted"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise BusinessLogicException(f"Failed to delete bet: {str(e, status_code=500)}")


@router.post("/track/{bet_id}/settle")
async def settle_bet(
    bet_id: str,
    result_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Settle a bet with actual outcome and profit/loss
    """
    try:
        bet_record = db.query(CLVBetTracking).filter(
            CLVBetTracking.bet_id == bet_id,
            CLVBetTracking.user_id == current_user.id
        ).first()
        
        if not bet_record:
            raise BusinessLogicException("Bet not found", status_code=404)
        
        # Update bet settlement
        setattr(bet_record, 'actual_result', result_data.get("actual_result"))
        setattr(bet_record, 'bet_result', result_data.get("bet_result"))  # "win", "loss", "push"
        setattr(bet_record, 'profit_loss', result_data.get("profit_loss"))
        setattr(bet_record, 'bet_status', BetStatus.SETTLED)
        setattr(bet_record, 'settled_at', datetime.now(timezone.utc))
        
        db.commit()
        
        return {
            "bet_id": bet_id,
            "bet_result": getattr(bet_record, 'bet_result'),
            "profit_loss": getattr(bet_record, 'profit_loss'),
            "message": "Bet successfully settled"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise BusinessLogicException(f"Failed to settle bet: {str(e, status_code=500)}")


@router.post("/clv/compute")
async def trigger_clv_computation(
    bet_ids: Optional[List[str]] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Manually trigger CLV computation for specific bets or all pending bets
    
    This endpoint allows users to force CLV computation instead of waiting
    for the scheduled task to run.
    """
    try:
        # Run manual CLV computation
        if bet_ids:
            # Filter bet_ids to only include user's bets for security
            user_bet_ids = db.query(CLVBetTracking.bet_id).filter(
                CLVBetTracking.user_id == current_user.id,
                CLVBetTracking.bet_id.in_(bet_ids)
            ).all()
            user_bet_ids = [row[0] for row in user_bet_ids]
            
            if not user_bet_ids:
                raise BusinessLogicException("No matching bets found for user", status_code=404)
            
            stats = await clv_computation_task.manual_computation_trigger(db, user_bet_ids)
        else:
            # Process all pending bets for this user
            user_pending_bets = db.query(CLVBetTracking.bet_id).filter(
                CLVBetTracking.user_id == current_user.id,
                CLVBetTracking.clv_status == CLVComputationStatus.PENDING
            ).all()
            user_bet_ids = [row[0] for row in user_pending_bets]
            
            if not user_bet_ids:
                return {"message": "No pending bets found for CLV computation", "stats": {"count": 0}}
            
            stats = await clv_computation_task.manual_computation_trigger(db, user_bet_ids)
        
        return {
            "message": "CLV computation completed",
            "stats": stats
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise BusinessLogicException(f"Failed to compute CLV: {str(e, status_code=500)}")


@router.get("/clv/computation-status")
async def get_clv_computation_status(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get CLV computation status for user's bets
    """
    try:
        # Get status counts for user's bets
        status_counts = db.query(
            CLVBetTracking.clv_status,
            func.count(CLVBetTracking.id).label('count')
        ).filter(
            CLVBetTracking.user_id == current_user.id
        ).group_by(CLVBetTracking.clv_status).all()
        
        # Get recent computation activity
        recent_computations = db.query(CLVBetTracking).filter(
            CLVBetTracking.user_id == current_user.id,
            CLVBetTracking.clv_status == CLVComputationStatus.COMPUTED,
            CLVBetTracking.clv_computed_at >= datetime.now(timezone.utc) - timedelta(hours=24)
        ).count()
        
        return {
            "status_counts": {row[0]: row[1] for row in status_counts},
            "recent_computations_24h": recent_computations,
            "computation_task_running": clv_computation_task.is_running
        }
        
    except Exception as e:
        raise BusinessLogicException(f"Failed to get computation status: {str(e, status_code=500)}")
