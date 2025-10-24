"""
Analytics Background Scheduler

Handles scheduled background tasks for analytics data management:
- Daily retention pruning of old records
- Optional pre-aggregation of daily statistics
- Health monitoring and error reporting
"""

import asyncio
import logging
from datetime import datetime, timezone, time, timedelta
from typing import Optional

from backend.database import get_async_session
from backend.services.analytics_persistence_service import (
    AnalyticsPersistenceService,
    ArbitrageOpportunityData,
    EVOpportunityData,
    ARB_MIN_PROFIT_PCT,
    EV_MIN_THRESHOLD,
)


logger = logging.getLogger(__name__)


class AnalyticsScheduler:
    """Background scheduler for analytics maintenance tasks"""
    
    def __init__(self, session_factory=None):
        self.session_factory = session_factory or get_async_session
        self.analytics_service = AnalyticsPersistenceService(self.session_factory)
        self.running = False
        self._task: Optional[asyncio.Task] = None
        
        # Schedule configuration (configurable via environment)
        self.prune_hour = 2  # 2 AM UTC
        self.prune_minute = 0
        
    async def start(self) -> None:
        """Start the background scheduler"""
        if self.running:
            logger.warning("Analytics scheduler already running")
            return
            
        self.running = True
        self._task = asyncio.create_task(self._scheduler_loop())
        logger.info("Analytics scheduler started")
        
    async def stop(self) -> None:
        """Stop the background scheduler"""
        if not self.running:
            return
            
        self.running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
                
        logger.info("Analytics scheduler stopped")
        
    async def _scheduler_loop(self) -> None:
        """Main scheduler loop"""
        logger.info("Starting analytics scheduler loop")
        
        while self.running:
            try:
                # Calculate next prune time
                now = datetime.now(timezone.utc)
                next_prune = self._get_next_prune_time(now)
                
                # Sleep until next scheduled time
                sleep_seconds = (next_prune - now).total_seconds()
                logger.info(f"Next analytics prune scheduled for {next_prune} (in {sleep_seconds:.0f}s)")
                
                await asyncio.sleep(min(sleep_seconds, 3600))  # Check at least hourly
                
                # Check if it's time to run
                now = datetime.now(timezone.utc)
                if now >= next_prune:
                    await self._run_daily_maintenance()
                    
            except asyncio.CancelledError:
                logger.info("Analytics scheduler loop cancelled")
                break
            except Exception as e:
                logger.error(f"Error in analytics scheduler loop: {e}", exc_info=True)
                # Sleep for a short time before retrying
                await asyncio.sleep(300)  # 5 minutes
                
    def _get_next_prune_time(self, current_time: datetime) -> datetime:
        """Calculate the next scheduled prune time"""
        # Create target time for today
        target_time = current_time.replace(
            hour=self.prune_hour,
            minute=self.prune_minute,
            second=0,
            microsecond=0
        )
        
        # If we've already passed today's time, schedule for tomorrow
        if current_time >= target_time:
            target_time += timedelta(days=1)
            
        return target_time
        
    async def _run_daily_maintenance(self) -> None:
        """Run daily maintenance tasks"""
        logger.info("Running daily analytics maintenance")
        start_time = datetime.now(timezone.utc)
        
        try:
            # Prune old records
            prune_results = await self.analytics_service.prune_old_records()
            
            logger.info(
                f"Daily maintenance completed: "
                f"EV records pruned: {prune_results['ev_opportunities_deleted']}, "
                f"Arbitrage records pruned: {prune_results['arbitrage_opportunities_deleted']}"
            )
            
            # Optional: Pre-calculate daily stats for performance
            # This could be useful for frequently accessed historical data
            await self._pre_calculate_daily_stats()
            
        except Exception as e:
            logger.error(f"Failed to run daily maintenance: {e}", exc_info=True)
            
        finally:
            duration = (datetime.now(timezone.utc) - start_time).total_seconds()
            logger.info(f"Daily maintenance completed in {duration:.1f}s")
            
    async def _pre_calculate_daily_stats(self) -> None:
        """Pre-calculate and cache daily statistics for performance"""
        try:
            # For now, just validate that the stats calculation works
            # In a production system, you might cache these results
            logger.debug("Pre-calculating daily stats...")
            
            # Test EV stats calculation
            ev_stats = await self.analytics_service.get_daily_ev_stats(7)
            logger.debug(f"Pre-calculated EV stats for 7 days: {len(ev_stats)} records")
            
            # Test arbitrage stats calculation  
            arb_stats = await self.analytics_service.get_daily_arbitrage_stats(7)
            logger.debug(f"Pre-calculated arbitrage stats for 7 days: {len(arb_stats)} records")
            
            # Test summary stats
            summary = await self.analytics_service.get_summary_stats()
            logger.debug(f"Pre-calculated summary stats: EV avg={summary['ev']['avg']:.2f}%")
            
        except Exception as e:
            logger.error(f"Failed to pre-calculate daily stats: {e}", exc_info=True)
            
    async def trigger_maintenance_now(self) -> dict:
        """Manually trigger maintenance tasks (useful for testing/debugging)"""
        logger.info("Manual trigger of analytics maintenance")
        
        try:
            await self._run_daily_maintenance()
            return {
                "status": "success",
                "message": "Analytics maintenance completed successfully",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        except Exception as e:
            logger.error(f"Manual maintenance trigger failed: {e}", exc_info=True)
            return {
                "status": "error",
                "message": f"Analytics maintenance failed: {str(e)}",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }


# Global scheduler instance
_analytics_scheduler: Optional[AnalyticsScheduler] = None


async def get_analytics_scheduler() -> AnalyticsScheduler:
    """Get or create the global analytics scheduler instance"""
    global _analytics_scheduler
    if _analytics_scheduler is None:
        _analytics_scheduler = AnalyticsScheduler()
    return _analytics_scheduler


async def start_analytics_scheduler() -> None:
    """Start the analytics background scheduler"""
    scheduler = await get_analytics_scheduler()
    await scheduler.start()


async def stop_analytics_scheduler() -> None:
    """Stop the analytics background scheduler"""
    global _analytics_scheduler
    if _analytics_scheduler:
        await _analytics_scheduler.stop()
        _analytics_scheduler = None


# Integration helper functions for PropFinder service
async def persist_ev_opportunity_if_qualified(
    sport: str,
    player: str,
    market: str,
    line: float,
    odds: int,
    ev_percent: float,
    confidence: Optional[float] = None,
    bookmaker: Optional[str] = None,
    team: Optional[str] = None,
    opponent: Optional[str] = None
) -> bool:
    """
    Helper function to persist EV opportunity from PropFinder service
    
    Returns:
        bool: True if persisted, False if below threshold
    """
    try:
        if ev_percent < EV_MIN_THRESHOLD:
            # Below persistence threshold so skip expensive service wiring
            return False

        analytics_service = AnalyticsPersistenceService(get_async_session)
        
        # Create data object
        ev_data = EVOpportunityData(
            sport=sport,
            player=player,
            market=market,
            line=line,
            odds=odds,
            ev_percent=ev_percent,
            confidence=confidence,
            bookmaker=bookmaker,
            team=team,
            opponent=opponent
        )
        
        # Fire-and-forget persistence
        return await analytics_service.persist_ev_opportunity(ev_data)
        
    except Exception as e:
        logger.error(f"Failed to persist EV opportunity: {e}", exc_info=True)
        return False


async def persist_arbitrage_opportunity_if_qualified(
    sport: str,
    market: str,
    profit_pct: float,
    bookmakers: list,
    player: Optional[str] = None,
    line: Optional[float] = None,
    total_stake_required: Optional[float] = None,
    team: Optional[str] = None,
    opponent: Optional[str] = None
) -> bool:
    """
    Helper function to persist arbitrage opportunity from PropFinder service
    
    Returns:
        bool: True if persisted, False if below threshold
    """
    try:
        if profit_pct < ARB_MIN_PROFIT_PCT:
            return False

        analytics_service = AnalyticsPersistenceService(get_async_session)
        
        # Create data object
        arb_data = ArbitrageOpportunityData(
            sport=sport,
            market=market,
            profit_pct=profit_pct,
            bookmakers=bookmakers,
            player=player,
            line=line,
            total_stake_required=total_stake_required,
            team=team,
            opponent=opponent
        )
        
        # Fire-and-forget persistence
        return await analytics_service.persist_arbitrage_opportunity(arb_data)
        
    except Exception as e:
        logger.error(f"Failed to persist arbitrage opportunity: {e}", exc_info=True)
        return False