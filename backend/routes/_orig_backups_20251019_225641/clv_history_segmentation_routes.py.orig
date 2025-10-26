"""
Enhanced CLV History Routes with User Segmentation

Extended CLV history endpoints with user-level analytics, segmentation,
and comparative performance analysis.
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, desc, case
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum

from backend.models.clv_bet_tracking import CLVBetTracking, CLVAnalyticsSummary, CLVLeaderboard, CLVComputationStatus
from backend.utils.clv_utils import get_clv_tier, get_clv_performance_score
from backend.database import get_db
from backend.auth.security import get_current_user
from backend.core.exceptions import BusinessLogicException

router = APIRouter(prefix="/api/clv-history", tags=["CLV History & Segmentation"])


class UserTier(str, Enum):
    """User performance tiers based on CLV performance"""
    ELITE = "elite"  # Top 10% CLV performers
    ADVANCED = "advanced"  # Top 25% CLV performers
    INTERMEDIATE = "intermediate"  # Average CLV performers
    BEGINNER = "beginner"  # Below average CLV performers
    UNKNOWN = "unknown"  # Insufficient data


class TimeGranularity(str, Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"


# Response Models
class UserSegmentStats(BaseModel):
    """Statistics for a user segment"""
    tier: UserTier
    user_count: int
    avg_clv_percent: Optional[float]
    median_clv_percent: Optional[float]
    avg_roi_percent: Optional[float]
    avg_bets_per_user: Optional[float]
    top_performer_clv: Optional[float]


class ComparativeAnalysis(BaseModel):
    """Comparative analysis between user and their tier"""
    user_tier: UserTier
    user_vs_tier_avg: Optional[float]  # How user compares to tier average
    user_percentile: Optional[float]  # User's percentile within tier
    tier_stats: UserSegmentStats
    improvement_potential: Optional[float]  # CLV points to reach next tier


class CLVHistoryPoint(BaseModel):
    """Single point in CLV history"""
    period: str
    period_start: datetime
    period_end: datetime
    avg_clv_percent: Optional[float]
    bet_count: int
    positive_clv_rate: Optional[float]
    total_stake: Optional[float]
    profit_loss: Optional[float]
    roi_percent: Optional[float]


class EnhancedCLVHistoryResponse(BaseModel):
    """Enhanced CLV history with segmentation"""
    user_id: str
    current_tier: UserTier
    history_points: List[CLVHistoryPoint]
    comparative_analysis: ComparativeAnalysis
    peer_benchmarks: Dict[str, float]
    performance_trends: Dict[str, Any]
    segment_insights: List[str]


@router.get("/enhanced/{user_id}", response_model=EnhancedCLVHistoryResponse)
async def get_enhanced_clv_history(
    user_id: str,
    days: int = Query(90, ge=7, le=365, description="Number of days of history"),
    granularity: TimeGranularity = Query(TimeGranularity.WEEKLY, description="Time granularity"),
    include_benchmarks: bool = Query(True, description="Include peer benchmarks"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get enhanced CLV history with user segmentation and comparative analysis
    """
    # Security check
    if user_id != current_user.id:
        raise BusinessLogicException("Access denied", status_code=403)
    
    try:
        period_start = datetime.now(timezone.utc) - timedelta(days=days)
        period_end = datetime.now(timezone.utc)
        
        # Get user's CLV performance data
        user_bets = db.query(CLVBetTracking).filter(
            CLVBetTracking.user_id == user_id,
            CLVBetTracking.placed_at >= period_start,
            CLVBetTracking.clv_status == CLVComputationStatus.COMPUTED
        ).all()
        
        # Determine user's current tier
        current_tier = await _determine_user_tier(db, user_id, period_start)
        
        # Generate history points
        history_points = _generate_history_points(user_bets, granularity, period_start, period_end)
        
        # Get comparative analysis
        comparative_analysis = await _get_comparative_analysis(db, user_id, current_tier, period_start)
        
        # Get peer benchmarks if requested
        peer_benchmarks = {}
        if include_benchmarks:
            peer_benchmarks = await _get_peer_benchmarks(db, current_tier, period_start)
        
        # Calculate performance trends
        performance_trends = _calculate_performance_trends(history_points)
        
        # Generate segment insights
        segment_insights = _generate_segment_insights(current_tier, comparative_analysis, performance_trends)
        
        return EnhancedCLVHistoryResponse(
            user_id=user_id,
            current_tier=current_tier,
            history_points=history_points,
            comparative_analysis=comparative_analysis,
            peer_benchmarks=peer_benchmarks,
            performance_trends=performance_trends,
            segment_insights=segment_insights
        )
        
    except Exception as e:
        raise BusinessLogicException(f"Failed to get enhanced CLV history: {str(e, status_code=500)}")


@router.get("/segments/overview")
async def get_user_segments_overview(
    days: int = Query(30, ge=7, le=365, description="Analysis period"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get overview of all user segments and their performance
    """
    try:
        period_start = datetime.now(timezone.utc) - timedelta(days=days)
        
        # Calculate segment statistics
        segments = {}
        for tier in UserTier:
            if tier == UserTier.UNKNOWN:
                continue
                
            segment_stats = await _calculate_segment_stats(db, tier, period_start)
            segments[tier.value] = segment_stats
        
        # Calculate overall platform statistics
        total_users = db.query(func.count(func.distinct(CLVBetTracking.user_id))).filter(
            CLVBetTracking.placed_at >= period_start
        ).scalar()
        
        all_bets = db.query(CLVBetTracking).filter(
            CLVBetTracking.placed_at >= period_start,
            CLVBetTracking.clv_status == CLVComputationStatus.COMPUTED
        ).all()
        
        platform_avg_clv = None
        if all_bets:
            clv_values = [getattr(bet, 'clv_percent') for bet in all_bets if getattr(bet, 'clv_percent') is not None]
            if clv_values:
                platform_avg_clv = sum(clv_values) / len(clv_values)
        
        return {
            "period_days": days,
            "total_active_users": total_users,
            "platform_avg_clv": round(platform_avg_clv, 2) if platform_avg_clv else None,
            "segments": segments,
            "last_updated": datetime.now(timezone.utc)
        }
        
    except Exception as e:
        raise BusinessLogicException(f"Failed to get segments overview: {str(e, status_code=500)}")


@router.get("/leaderboard")
async def get_clv_leaderboard(
    tier: Optional[UserTier] = Query(None, description="Filter by user tier"),
    limit: int = Query(50, ge=10, le=200, description="Number of users to return"),
    period_days: int = Query(30, ge=7, le=365, description="Analysis period"),
    metric: str = Query("avg_clv", regex="^(avg_clv|total_profit|roi|consistency)$", description="Ranking metric"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get CLV leaderboard with optional tier filtering
    """
    try:
        period_start = datetime.now(timezone.utc) - timedelta(days=period_days)
        
        # Build query for user performance
        query = db.query(
            CLVBetTracking.user_id,
            func.avg(CLVBetTracking.clv_percent).label('avg_clv'),
            func.count(CLVBetTracking.id).label('bet_count'),
            func.sum(CLVBetTracking.profit_loss).label('total_profit'),
            func.sum(CLVBetTracking.stake_amount).label('total_stake')
        ).filter(
            CLVBetTracking.placed_at >= period_start,
            CLVBetTracking.clv_status == CLVComputationStatus.COMPUTED
        ).group_by(CLVBetTracking.user_id).having(
            func.count(CLVBetTracking.id) >= 5  # Minimum 5 bets for ranking
        )
        
        # Apply tier filtering if specified
        if tier and tier != UserTier.UNKNOWN:
            # This would require joining with a tier classification subquery
            # For now, we'll implement a simplified version
            pass
        
        results = query.all()
        
        # Calculate derived metrics and sort
        leaderboard_data = []
        for row in results:
            roi = ((row.total_profit or 0) / (row.total_stake or 1)) * 100 if row.total_stake else 0
            
            # Determine user tier
            user_tier = get_clv_tier(row.avg_clv or 0)
            
            # Skip if tier filter doesn't match
            if tier and user_tier != tier.value:
                continue
            
            leaderboard_data.append({
                "user_id": row.user_id,
                "avg_clv": round(row.avg_clv or 0, 2),
                "bet_count": row.bet_count,
                "total_profit": round(row.total_profit or 0, 2),
                "roi_percent": round(roi, 2),
                "tier": user_tier,
                "consistency_score": None  # Would calculate from bet variance
            })
        
        # Sort by requested metric
        if metric == "avg_clv":
            leaderboard_data.sort(key=lambda x: x["avg_clv"], reverse=True)
        elif metric == "total_profit":
            leaderboard_data.sort(key=lambda x: x["total_profit"], reverse=True)
        elif metric == "roi":
            leaderboard_data.sort(key=lambda x: x["roi_percent"], reverse=True)
        
        # Limit results
        leaderboard_data = leaderboard_data[:limit]
        
        # Add ranks
        for i, entry in enumerate(leaderboard_data):
            entry["rank"] = i + 1
        
        return {
            "period_days": period_days,
            "metric": metric,
            "tier_filter": tier.value if tier else None,
            "total_entries": len(leaderboard_data),
            "leaderboard": leaderboard_data,
            "last_updated": datetime.now(timezone.utc)
        }
        
    except Exception as e:
        raise BusinessLogicException(f"Failed to get leaderboard: {str(e, status_code=500)}")


@router.get("/benchmarks/{user_id}")
async def get_user_benchmarks(
    user_id: str,
    period_days: int = Query(30, ge=7, le=365, description="Analysis period"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get detailed benchmarking data for a user against their tier
    """
    if user_id != current_user.id:
        raise BusinessLogicException("Access denied", status_code=403)
    
    try:
        period_start = datetime.now(timezone.utc) - timedelta(days=period_days)
        
        # Get user's tier
        user_tier = await _determine_user_tier(db, user_id, period_start)
        
        # Get user's stats
        user_bets = db.query(CLVBetTracking).filter(
            CLVBetTracking.user_id == user_id,
            CLVBetTracking.placed_at >= period_start,
            CLVBetTracking.clv_status == CLVComputationStatus.COMPUTED
        ).all()
        
        user_stats = _calculate_user_stats(user_bets)
        
        # Get tier benchmarks
        tier_benchmarks = await _get_detailed_tier_benchmarks(db, user_tier, period_start)
        
        # Calculate percentile rankings
        percentiles = await _calculate_user_percentiles(db, user_id, user_tier, period_start)
        
        return {
            "user_id": user_id,
            "user_tier": user_tier,
            "period_days": period_days,
            "user_stats": user_stats,
            "tier_benchmarks": tier_benchmarks,
            "percentiles": percentiles,
            "improvement_areas": _identify_improvement_areas(user_stats, tier_benchmarks),
            "strengths": _identify_strengths(user_stats, tier_benchmarks)
        }
        
    except Exception as e:
        raise BusinessLogicException(f"Failed to get user benchmarks: {str(e, status_code=500)}")


# Helper functions
async def _determine_user_tier(db: Session, user_id: str, period_start: datetime) -> UserTier:
    """Determine user's performance tier based on CLV metrics"""
    user_bets = db.query(CLVBetTracking).filter(
        CLVBetTracking.user_id == user_id,
        CLVBetTracking.placed_at >= period_start,
        CLVBetTracking.clv_status == CLVComputationStatus.COMPUTED
    ).all()
    
    if len(user_bets) < 10:  # Minimum bets for tier classification
        return UserTier.UNKNOWN
    
    clv_values = [getattr(bet, 'clv_percent') for bet in user_bets if getattr(bet, 'clv_percent') is not None]
    
    if not clv_values:
        return UserTier.UNKNOWN
    
    avg_clv = sum(clv_values) / len(clv_values)
    
    # Tier thresholds (these would be dynamically calculated in production)
    if avg_clv >= 8:
        return UserTier.ELITE
    elif avg_clv >= 4:
        return UserTier.ADVANCED
    elif avg_clv >= 0:
        return UserTier.INTERMEDIATE
    else:
        return UserTier.BEGINNER


def _generate_history_points(
    bets: List[CLVBetTracking], 
    granularity: TimeGranularity, 
    period_start: datetime, 
    period_end: datetime
) -> List[CLVHistoryPoint]:
    """Generate time-series history points"""
    # Simplified implementation - would need more sophisticated time grouping
    history_points = []
    
    if granularity == TimeGranularity.WEEKLY:
        # Group by weeks
        current_date = period_start
        while current_date < period_end:
            week_end = min(current_date + timedelta(days=7), period_end)
            
            week_bets = [bet for bet in bets 
                        if current_date <= getattr(bet, 'placed_at') < week_end]
            
            if week_bets:
                clv_values = [getattr(bet, 'clv_percent') for bet in week_bets 
                             if getattr(bet, 'clv_percent') is not None]
                
                avg_clv = sum(clv_values) / len(clv_values) if clv_values else None
                positive_rate = (sum(1 for clv in clv_values if clv > 0) / len(clv_values) * 100) if clv_values else None
                
                total_stake = sum(getattr(bet, 'stake_amount') for bet in week_bets)
                total_pl = sum(getattr(bet, 'profit_loss') for bet in week_bets 
                              if getattr(bet, 'profit_loss') is not None)
                roi = (total_pl / total_stake * 100) if total_stake and total_pl is not None else None
                
                history_points.append(CLVHistoryPoint(
                    period=f"Week of {current_date.strftime('%Y-%m-%d')}",
                    period_start=current_date,
                    period_end=week_end,
                    avg_clv_percent=round(avg_clv, 2) if avg_clv is not None else None,
                    bet_count=len(week_bets),
                    positive_clv_rate=round(positive_rate, 1) if positive_rate is not None else None,
                    total_stake=total_stake,
                    profit_loss=total_pl,
                    roi_percent=round(roi, 2) if roi is not None else None
                ))
            
            current_date = week_end
    
    return history_points


async def _get_comparative_analysis(
    db: Session, 
    user_id: str, 
    user_tier: UserTier, 
    period_start: datetime
) -> ComparativeAnalysis:
    """Get comparative analysis between user and their tier"""
    # Get user's stats
    user_bets = db.query(CLVBetTracking).filter(
        CLVBetTracking.user_id == user_id,
        CLVBetTracking.placed_at >= period_start,
        CLVBetTracking.clv_status == CLVComputationStatus.COMPUTED
    ).all()
    
    user_clv_values = [getattr(bet, 'clv_percent') for bet in user_bets 
                      if getattr(bet, 'clv_percent') is not None]
    user_avg_clv = sum(user_clv_values) / len(user_clv_values) if user_clv_values else None
    
    # Get tier stats
    tier_stats = await _calculate_segment_stats(db, user_tier, period_start)
    
    # Calculate comparative metrics
    user_vs_tier_avg = None
    if user_avg_clv is not None and tier_stats.avg_clv_percent is not None:
        user_vs_tier_avg = user_avg_clv - tier_stats.avg_clv_percent
    
    # Calculate improvement potential (simplified)
    improvement_potential = None
    if user_tier == UserTier.BEGINNER:
        improvement_potential = 4.0 - (user_avg_clv or 0)  # To reach intermediate
    elif user_tier == UserTier.INTERMEDIATE:
        improvement_potential = 8.0 - (user_avg_clv or 0)  # To reach advanced
    
    return ComparativeAnalysis(
        user_tier=user_tier,
        user_vs_tier_avg=round(user_vs_tier_avg, 2) if user_vs_tier_avg is not None else None,
        user_percentile=None,  # Would calculate from actual distribution
        tier_stats=tier_stats,
        improvement_potential=round(improvement_potential, 2) if improvement_potential is not None else None
    )


async def _get_peer_benchmarks(db: Session, tier: UserTier, period_start: datetime) -> Dict[str, float]:
    """Get peer benchmark metrics for a tier"""
    # Simplified implementation
    return {
        "avg_clv": 0.0,
        "median_clv": 0.0,
        "top_10_percent_clv": 0.0,
        "avg_roi": 0.0,
        "avg_bet_frequency": 0.0
    }


def _calculate_performance_trends(history_points: List[CLVHistoryPoint]) -> Dict[str, Any]:
    """Calculate performance trends from history"""
    if len(history_points) < 2:
        return {"trend": "insufficient_data"}
    
    # Calculate CLV trend
    clv_values = [point.avg_clv_percent for point in history_points if point.avg_clv_percent is not None]
    
    if len(clv_values) >= 2:
        recent_avg = sum(clv_values[-3:]) / len(clv_values[-3:])  # Last 3 periods
        early_avg = sum(clv_values[:3]) / len(clv_values[:3])  # First 3 periods
        
        trend = "improving" if recent_avg > early_avg + 1 else "declining" if recent_avg < early_avg - 1 else "stable"
    else:
        trend = "stable"
    
    return {
        "clv_trend": trend,
        "data_points": len(history_points),
        "trend_strength": "moderate"  # Could calculate correlation coefficient
    }


def _generate_segment_insights(
    tier: UserTier, 
    comparative_analysis: ComparativeAnalysis, 
    trends: Dict[str, Any]
) -> List[str]:
    """Generate insights based on user's segment performance"""
    insights = []
    
    if tier == UserTier.ELITE:
        insights.append("You're in the top tier of CLV performers - excellent work!")
        insights.append("Focus on consistency to maintain your elite status")
    elif tier == UserTier.ADVANCED:
        insights.append("You're performing well above average")
        insights.append("Consider targeting higher-value opportunities to reach elite tier")
    elif tier == UserTier.INTERMEDIATE:
        insights.append("Your CLV performance is around average")
        insights.append("Focus on improving bet selection to advance to the next tier")
    elif tier == UserTier.BEGINNER:
        insights.append("There's significant room for improvement in your CLV performance")
        insights.append("Consider focusing on fundamental value betting principles")
    else:
        insights.append("Keep betting to get sufficient data for tier classification")
    
    if trends.get("clv_trend") == "improving":
        insights.append("Your CLV performance is trending upward - keep it up!")
    elif trends.get("clv_trend") == "declining":
        insights.append("Your recent CLV performance has declined - review your recent bet selection")
    
    return insights


async def _calculate_segment_stats(db: Session, tier: UserTier, period_start: datetime) -> UserSegmentStats:
    """Calculate statistics for a user segment"""
    # This is a simplified implementation
    # In production, you'd have more sophisticated tier classification
    
    return UserSegmentStats(
        tier=tier,
        user_count=0,
        avg_clv_percent=None,
        median_clv_percent=None,
        avg_roi_percent=None,
        avg_bets_per_user=None,
        top_performer_clv=None
    )


def _calculate_user_stats(bets: List[CLVBetTracking]) -> Dict[str, Any]:
    """Calculate comprehensive user statistics"""
    if not bets:
        return {}
    
    clv_values = [getattr(bet, 'clv_percent') for bet in bets if getattr(bet, 'clv_percent') is not None]
    
    return {
        "total_bets": len(bets),
        "avg_clv": sum(clv_values) / len(clv_values) if clv_values else None,
        "positive_clv_rate": (sum(1 for clv in clv_values if clv > 0) / len(clv_values) * 100) if clv_values else None,
        "total_stake": sum(getattr(bet, 'stake_amount') for bet in bets)
    }


async def _get_detailed_tier_benchmarks(db: Session, tier: UserTier, period_start: datetime) -> Dict[str, Any]:
    """Get detailed benchmarks for a tier"""
    # Placeholder implementation
    return {}


async def _calculate_user_percentiles(db: Session, user_id: str, tier: UserTier, period_start: datetime) -> Dict[str, float]:
    """Calculate user's percentile rankings within their tier"""
    # Placeholder implementation
    return {}


def _identify_improvement_areas(user_stats: Dict[str, Any], tier_benchmarks: Dict[str, Any]) -> List[str]:
    """Identify areas where user can improve"""
    return []


def _identify_strengths(user_stats: Dict[str, Any], tier_benchmarks: Dict[str, Any]) -> List[str]:
    """Identify user's strengths"""
    return []
