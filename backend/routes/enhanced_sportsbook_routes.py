"""
Enhanced Sportsbook API Routes with Real-time Notifications
Integrates multiple sportsbook APIs with WebSocket notifications
"""

import asyncio
import logging
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Query
from fastapi.security import HTTPBearer
import jwt

from ..services.unified_sportsbook_service import (
    UnifiedSportsbookService, 
    SportsbookProvider,
    UnifiedOdds,
    BestOdds,
    ArbitrageOpportunity
)
from ..services.realtime_notification_service import (
    notification_service,
    NotificationMessage,
    NotificationType,
    NotificationPriority,
    send_arbitrage_notification,
    send_odds_change_notification,
    send_high_value_bet_notification
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/sportsbook", tags=["Enhanced Sportsbook"])
security = HTTPBearer(auto_error=False)

# Global sportsbook service instance
sportsbook_service = None

async def get_sportsbook_service() -> UnifiedSportsbookService:
    """Get or create sportsbook service instance"""
    global sportsbook_service
    if sportsbook_service is None:
        sportsbook_service = UnifiedSportsbookService(enable_notifications=True)
        await sportsbook_service.__aenter__()
    return sportsbook_service

@router.on_event("startup")
async def startup_sportsbook_service():
    """Initialize sportsbook service on startup"""
    await get_sportsbook_service()
    logger.info("Enhanced sportsbook service started")

@router.on_event("shutdown") 
async def shutdown_sportsbook_service():
    """Cleanup sportsbook service on shutdown"""
    global sportsbook_service
    if sportsbook_service:
        await sportsbook_service.__aexit__(None, None, None)
        logger.info("Enhanced sportsbook service stopped")

@router.get("/odds/all/{sport}")
async def get_all_odds(
    sport: str,
    player_name: Optional[str] = Query(None),
    provider: Optional[str] = Query(None),
    enable_notifications: bool = Query(True),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    service: UnifiedSportsbookService = Depends(get_sportsbook_service)
) -> Dict[str, Any]:
    """
    Get odds from all sportsbooks for a sport
    Optionally filter by player name or provider
    """
    try:
        # Use notification-enabled version if requested
        if enable_notifications:
            all_odds = await service.get_all_player_props_with_notifications(sport, player_name)
        else:
            all_odds = await service.get_all_player_props(sport, player_name)
        
        # Filter by provider if specified
        if provider:
            all_odds = [odds for odds in all_odds if odds.provider == provider.lower()]
        
        # Group odds by player and bet type
        grouped_odds = {}
        for odds in all_odds:
            key = f"{odds.player_name}_{odds.bet_type}_{odds.line}"
            if key not in grouped_odds:
                grouped_odds[key] = []
            grouped_odds[key].append({
                "provider": odds.provider,
                "odds": odds.odds,
                "decimal_odds": odds.decimal_odds,
                "side": odds.side,
                "timestamp": odds.timestamp.isoformat(),
                "confidence_score": odds.confidence_score
            })
        
        return {
            "sport": sport,
            "player_filter": player_name,
            "provider_filter": provider,
            "total_odds": len(all_odds),
            "unique_markets": len(grouped_odds),
            "providers_active": len(set(odds.provider for odds in all_odds)),
            "odds_by_market": grouped_odds,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error fetching odds for {sport}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch odds: {str(e)}")

@router.get("/odds/best/{sport}")
async def get_best_odds(
    sport: str,
    player_name: Optional[str] = Query(None),
    min_books: int = Query(2),
    service: UnifiedSportsbookService = Depends(get_sportsbook_service)
) -> Dict[str, Any]:
    """Get best odds comparison across all sportsbooks"""
    try:
        all_odds = await service.get_all_player_props(sport, player_name)
        best_odds = service.find_best_odds(all_odds)
        
        # Filter by minimum number of books
        filtered_odds = [odds for odds in best_odds if odds.total_books >= min_books]
        
        return {
            "sport": sport,
            "player_filter": player_name,
            "min_books": min_books,
            "total_comparisons": len(filtered_odds),
            "best_odds": [
                {
                    "player_name": odds.player_name,
                    "bet_type": odds.bet_type,
                    "line": odds.line,
                    "best_over": {
                        "odds": odds.best_over_odds,
                        "provider": odds.best_over_provider,
                        "decimal": odds.best_over_decimal
                    },
                    "best_under": {
                        "odds": odds.best_under_odds,
                        "provider": odds.best_under_provider,
                        "decimal": odds.best_under_decimal
                    },
                    "market_info": {
                        "total_books": odds.total_books,
                        "line_consensus": odds.line_consensus,
                        "arbitrage_opportunity": odds.arbitrage_opportunity,
                        "arbitrage_profit": odds.arbitrage_profit
                    }
                }
                for odds in filtered_odds
            ],
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error finding best odds for {sport}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to find best odds: {str(e)}")

@router.get("/arbitrage/{sport}")
async def get_arbitrage_opportunities(
    sport: str,
    min_profit: float = Query(2.0, ge=0.1, le=50.0),
    player_name: Optional[str] = Query(None),
    max_results: int = Query(50, ge=1, le=100),
    send_notifications: bool = Query(True),
    service: UnifiedSportsbookService = Depends(get_sportsbook_service)
) -> Dict[str, Any]:
    """Find arbitrage opportunities for a sport"""
    try:
        all_odds = await service.get_all_player_props(sport, player_name)
        arbitrage_ops = await service.find_arbitrage_opportunities(all_odds, min_profit)
        
        # Limit results
        arbitrage_ops = arbitrage_ops[:max_results]
        
        return {
            "sport": sport,
            "min_profit": min_profit,
            "player_filter": player_name,
            "opportunities_found": len(arbitrage_ops),
            "arbitrage_opportunities": [
                {
                    "player_name": opp.player_name,
                    "bet_type": opp.bet_type,
                    "line": opp.line,
                    "profit_percentage": opp.guaranteed_profit_percentage,
                    "over_bet": {
                        "odds": opp.over_odds,
                        "provider": opp.over_provider,
                        "stake_percentage": opp.over_stake_percentage
                    },
                    "under_bet": {
                        "odds": opp.under_odds,
                        "provider": opp.under_provider,
                        "stake_percentage": opp.under_stake_percentage
                    },
                    "metadata": {
                        "confidence_level": opp.confidence_level,
                        "time_sensitivity": opp.time_sensitivity,
                        "minimum_bet_amount": opp.minimum_bet_amount,
                        "expected_return": opp.expected_return
                    }
                }
                for opp in arbitrage_ops
            ],
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error finding arbitrage opportunities for {sport}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to find arbitrage opportunities: {str(e)}")

@router.get("/live-monitoring/{sport}")
async def start_live_monitoring(
    sport: str,
    interval_seconds: int = Query(60, ge=10, le=300),
    player_name: Optional[str] = Query(None),
    min_arbitrage_profit: float = Query(2.0),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    service: UnifiedSportsbookService = Depends(get_sportsbook_service)
) -> Dict[str, Any]:
    """Start live monitoring for a sport with real-time notifications"""
    
    async def monitor_sport():
        """Background monitoring task"""
        while True:
            try:
                logger.info(f"Monitoring {sport} for live updates...")
                
                # Get fresh odds with notifications
                all_odds = await service.get_all_player_props_with_notifications(sport, player_name)
                
                # Find arbitrage opportunities
                arbitrage_ops = await service.find_arbitrage_opportunities(all_odds, min_arbitrage_profit)
                
                logger.info(f"Found {len(arbitrage_ops)} arbitrage opportunities for {sport}")
                
                # Wait for next interval
                await asyncio.sleep(interval_seconds)
                
            except Exception as e:
                logger.error(f"Error in live monitoring for {sport}: {e}")
                await asyncio.sleep(interval_seconds)
    
    # Start monitoring in background
    background_tasks.add_task(monitor_sport)
    
    return {
        "status": "started",
        "sport": sport,
        "monitoring_interval": interval_seconds,
        "player_filter": player_name,
        "min_arbitrage_profit": min_arbitrage_profit,
        "message": f"Live monitoring started for {sport}",
        "timestamp": datetime.now().isoformat()
    }

@router.post("/notifications/test-arbitrage")
async def test_arbitrage_notification(
    sport: str = "nba",
    player_name: str = "LeBron James",
    profit_margin: float = 5.2
) -> Dict[str, Any]:
    """Test arbitrage notification"""
    try:
        await send_arbitrage_notification(
            sport=sport,
            event=f"{player_name} Points Over 25.5",
            profit_margin=profit_margin,
            sportsbooks=["DraftKings", "BetMGM"],
            player_name=player_name
        )
        
        return {
            "status": "success",
            "message": "Test arbitrage notification sent",
            "sport": sport,
            "player_name": player_name,
            "profit_margin": profit_margin
        }
        
    except Exception as e:
        logger.error(f"Failed to send test arbitrage notification: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to send notification: {str(e)}")

@router.post("/notifications/test-odds-change")
async def test_odds_change_notification(
    sport: str = "nba",
    player_name: str = "Stephen Curry",
    old_odds: int = -110,
    new_odds: int = +105,
    sportsbook: str = "DraftKings"
) -> Dict[str, Any]:
    """Test odds change notification"""
    try:
        await send_odds_change_notification(
            sport=sport,
            event=f"{player_name} 3-Pointers Made Over 4.5",
            old_odds=old_odds,
            new_odds=new_odds,
            sportsbook=sportsbook,
            player_name=player_name
        )
        
        return {
            "status": "success",
            "message": "Test odds change notification sent",
            "sport": sport,
            "player_name": player_name,
            "odds_change": f"{old_odds} → {new_odds}",
            "sportsbook": sportsbook
        }
        
    except Exception as e:
        logger.error(f"Failed to send test odds change notification: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to send notification: {str(e)}")

@router.post("/notifications/test-high-value")
async def test_high_value_notification(
    sport: str = "nfl",
    player_name: str = "Josh Allen",
    expected_value: float = 12.5,
    confidence: float = 85.0,
    recommended_stake: float = 150.0
) -> Dict[str, Any]:
    """Test high value bet notification"""
    try:
        await send_high_value_bet_notification(
            sport=sport,
            event=f"{player_name} Passing Yards Over 275.5",
            expected_value=expected_value,
            confidence=confidence,
            recommended_stake=recommended_stake,
            player_name=player_name
        )
        
        return {
            "status": "success",
            "message": "Test high value bet notification sent",
            "sport": sport,
            "player_name": player_name,
            "expected_value": expected_value,
            "confidence": confidence,
            "recommended_stake": recommended_stake
        }
        
    except Exception as e:
        logger.error(f"Failed to send test high value notification: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to send notification: {str(e)}")

@router.get("/providers/status")
async def get_providers_status(
    service: UnifiedSportsbookService = Depends(get_sportsbook_service)
) -> Dict[str, Any]:
    """Get status and performance of all sportsbook providers"""
    try:
        performance_report = service.get_performance_report()
        
        return {
            "notification_service": {
                "enabled": service.enable_notifications,
                "stats": notification_service.get_stats()
            },
            "sportsbook_providers": performance_report,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting provider status: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get provider status: {str(e)}")

@router.get("/health")
async def health_check() -> Dict[str, Any]:
    """Health check endpoint for the enhanced sportsbook service"""
    try:
        service = await get_sportsbook_service()
        performance = service.get_performance_report()
        
        # Check if any providers are healthy
        healthy_providers = performance['summary']['healthy_providers']
        total_providers = performance['summary']['total_providers']
        
        is_healthy = healthy_providers > 0
        
        return {
            "status": "healthy" if is_healthy else "degraded",
            "service": "enhanced-sportsbook",
            "providers": {
                "total": total_providers,
                "healthy": healthy_providers,
                "health_percentage": (healthy_providers / total_providers * 100) if total_providers > 0 else 0
            },
            "notifications": {
                "enabled": service.enable_notifications,
                "active_connections": notification_service.get_stats().get('active_connections', 0)
            },
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "service": "enhanced-sportsbook",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }
