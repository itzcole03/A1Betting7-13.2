"""
Analytics Persistence Service

Handles fire-and-forget persistence of EV and arbitrage opportunities for
historical analytics and trend analysis. Includes data retention management
and daily aggregation utilities.
"""

import asyncio
import inspect
import logging
import os
from contextlib import AsyncExitStack, aclosing, asynccontextmanager
from datetime import datetime, timezone, timedelta
from decimal import Decimal, ROUND_DOWN
from typing import Dict, List, Optional, Any, AsyncIterator, AsyncContextManager
from dataclasses import dataclass

from sqlalchemy import and_, func, select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.analytics import EVOpportunityHistory, ArbitrageHistory


logger = logging.getLogger(__name__)

# Configuration constants
EV_MIN_THRESHOLD = 3.0  # Minimum EV% to persist
ARB_MIN_PROFIT_PCT = 1.0  # From ArbitrageConfig.min_profit_pct  
EV_HISTORY_RETENTION_DAYS = int(os.getenv("EV_HISTORY_RETENTION_DAYS", "90"))
ARB_HISTORY_RETENTION_DAYS = int(os.getenv("ARB_HISTORY_RETENTION_DAYS", "90"))


def _truncate(value: Optional[float], decimals: int = 2) -> float:
    """Truncate floating point value to a fixed number of decimals."""
    if value is None:
        return 0.0

    quantize_pattern = "1." + ("0" * decimals)
    decimal_value = Decimal(str(value)).quantize(Decimal(quantize_pattern), rounding=ROUND_DOWN)
    return float(decimal_value)


@dataclass
class EVOpportunityData:
    """Data structure for EV opportunity persistence"""
    sport: str
    player: str
    market: str
    line: float
    odds: int
    ev_percent: float
    confidence: Optional[float] = None
    bookmaker: Optional[str] = None
    team: Optional[str] = None
    opponent: Optional[str] = None


@dataclass
class ArbitrageOpportunityData:
    """Data structure for arbitrage opportunity persistence"""
    sport: str
    market: str
    profit_pct: float
    bookmakers: List[str]
    player: Optional[str] = None
    line: Optional[float] = None
    total_stake_required: Optional[float] = None
    team: Optional[str] = None
    opponent: Optional[str] = None


@dataclass
class DailyEVStats:
    """Daily EV statistics aggregation"""
    date: str
    total_opportunities: int
    avg_ev_percent: float
    tier_counts: Dict[str, int]
    top_sports: List[Dict[str, Any]]
    top_players: List[Dict[str, Any]]


@dataclass 
class DailyArbitrageStats:
    """Daily arbitrage statistics aggregation"""
    date: str
    total_opportunities: int
    avg_profit_pct: float
    total_books_involved: int
    top_sports: List[Dict[str, Any]]
    top_markets: List[Dict[str, Any]]


class AnalyticsPersistenceService:
    """Service for persisting EV and arbitrage opportunities for analytics"""
    
    def __init__(self, async_session_factory):
        self.async_session_factory = async_session_factory
        self._background_tasks = set()
        self._locks: Dict[str, asyncio.Lock] = {}

    @asynccontextmanager
    async def _session_scope(self) -> AsyncIterator[AsyncSession]:
        """Resolve the configured session factory into a usable async session."""
        stack = AsyncExitStack()
        try:
            resource = self.async_session_factory()

            if inspect.isawaitable(resource):
                resource = await resource

            if inspect.isasyncgen(resource):
                generator = resource
                session = await generator.__anext__()
                await stack.enter_async_context(aclosing(generator))
                yield session
                return

            if hasattr(resource, "__aenter__") and hasattr(resource, "__aexit__"):
                session = await stack.enter_async_context(resource)
                yield session
                return

            session = resource

            close_method = getattr(session, "close", None)
            if close_method:
                async def _close() -> None:
                    result = close_method()
                    if inspect.isawaitable(result):
                        await result

                stack.push_async_callback(_close)

            yield session
        finally:
            await stack.aclose()

    def session_scope(self) -> AsyncContextManager[AsyncSession]:
        """Public helper so callers/tests can reuse the managed session scope."""
        return self._session_scope()

    def _get_lock(self, key: str) -> asyncio.Lock:
        """Return a reusable async lock for the provided key."""
        lock = self._locks.get(key)
        if lock is None:
            lock = asyncio.Lock()
            self._locks[key] = lock
        return lock
        
    async def persist_ev_opportunity(self, data: EVOpportunityData) -> bool:
        """
        Fire-and-forget persistence of EV opportunity if >= 3% EV
        
        Returns:
            bool: True if persisted, False if below threshold or error
        """
        if data.ev_percent < EV_MIN_THRESHOLD:
            return False
            
        # Fire-and-forget: run in background task
        task = asyncio.create_task(self._persist_ev_opportunity_async(data))
        self._background_tasks.add(task)
        task.add_done_callback(self._background_tasks.discard)
        
        return True
        
    async def persist_arbitrage_opportunity(self, data: ArbitrageOpportunityData) -> bool:
        """
        Fire-and-forget persistence of arbitrage opportunity if >= ARB_MIN_PROFIT_PCT
        
        Returns:
            bool: True if persisted, False if below threshold or error
        """
        if data.profit_pct < ARB_MIN_PROFIT_PCT:
            return False
            
        # Fire-and-forget: run in background task
        task = asyncio.create_task(self._persist_arbitrage_opportunity_async(data))
        self._background_tasks.add(task)
        task.add_done_callback(self._background_tasks.discard)
        
        return True
        
    async def _persist_ev_opportunity_async(self, data: EVOpportunityData) -> None:
        """Internal async persistence of EV opportunity"""
        try:
            opp_hash = EVOpportunityHistory.calculate_hash(
                data.sport, data.player, data.market, data.line, data.odds
            )

            async with self._get_lock(opp_hash):
                async with self._session_scope() as session:
                    # Check if already exists (within last hour)
                    hour_ago = datetime.now(timezone.utc) - timedelta(hours=1)
                    existing = await session.execute(
                        select(EVOpportunityHistory).where(
                            and_(
                                EVOpportunityHistory.opp_hash == opp_hash,
                                EVOpportunityHistory.detected_at >= hour_ago
                            )
                        )
                    )

                    if existing.scalar_one_or_none():
                        logger.debug(f"EV opportunity already persisted: {opp_hash}")
                        return

                    # Create new record
                    ev_tier = EVOpportunityHistory.determine_ev_tier(data.ev_percent)
                    record = EVOpportunityHistory(
                        opp_hash=opp_hash,
                        sport=data.sport,
                        player=data.player,
                        market=data.market,
                        ev_percent=data.ev_percent,
                        ev_tier=ev_tier,
                        line=data.line,
                        odds=data.odds,
                        confidence=data.confidence,
                        bookmaker=data.bookmaker,
                        team=data.team,
                        opponent=data.opponent,
                        detected_at=datetime.now(timezone.utc)
                    )

                    session.add(record)
                    await session.commit()

                    logger.info(
                        f"Persisted EV opportunity: {data.player} {data.market} {data.ev_percent:.1f}%"
                    )
                
        except Exception as e:
            logger.error(f"Failed to persist EV opportunity: {e}", exc_info=True)
            
    async def _persist_arbitrage_opportunity_async(self, data: ArbitrageOpportunityData) -> None:
        """Internal async persistence of arbitrage opportunity"""
        try:
            arb_hash = ArbitrageHistory.calculate_hash(
                data.sport, data.market, data.bookmakers, data.line or 0.0
            )

            async with self._get_lock(arb_hash):
                async with self._session_scope() as session:
                    # Check if already exists (within last hour)
                    hour_ago = datetime.now(timezone.utc) - timedelta(hours=1)
                    existing = await session.execute(
                        select(ArbitrageHistory).where(
                            and_(
                                ArbitrageHistory.arb_hash == arb_hash,
                                ArbitrageHistory.detected_at >= hour_ago
                            )
                        )
                    )

                    if existing.scalar_one_or_none():
                        logger.debug(f"Arbitrage opportunity already persisted: {arb_hash}")
                        return

                    # Create new record
                    record = ArbitrageHistory(
                        arb_hash=arb_hash,
                        sport=data.sport,
                        market=data.market,
                        profit_pct=data.profit_pct,
                        bookmakers=data.bookmakers,  # Uses setter to convert to JSON
                        player=data.player,
                        line=data.line,
                        total_stake_required=data.total_stake_required,
                        num_bookmakers=len(data.bookmakers),
                        team=data.team,
                        opponent=data.opponent,
                        detected_at=datetime.now(timezone.utc)
                    )

                    session.add(record)
                    await session.commit()

                    logger.info(
                        f"Persisted arbitrage opportunity: {data.sport} {data.market} {data.profit_pct:.2f}%"
                    )
                
        except Exception as e:
            logger.error(f"Failed to persist arbitrage opportunity: {e}", exc_info=True)
            
    async def get_daily_ev_stats(self, days: int = 30) -> List[DailyEVStats]:
        """Get daily EV statistics for the last N days"""
        try:
            async with self._session_scope() as session:
                # Calculate date range
                end_date = datetime.now(timezone.utc).date()
                start_date = end_date - timedelta(days=days-1)
                
                results = []
                
                # Generate stats for each day
                for i in range(days):
                    current_date = start_date + timedelta(days=i)
                    next_date = current_date + timedelta(days=1)
                    
                    # Get day's data
                    day_data = await session.execute(
                        select(EVOpportunityHistory).where(
                            and_(
                                EVOpportunityHistory.detected_at >= current_date,
                                EVOpportunityHistory.detected_at < next_date
                            )
                        )
                    )
                    
                    opportunities = day_data.scalars().all()
                    
                    if not opportunities:
                        # Include empty days with zeros
                        results.append(DailyEVStats(
                            date=current_date.isoformat(),
                            total_opportunities=0,
                            avg_ev_percent=0.0,
                            tier_counts={},
                            top_sports=[],
                            top_players=[]
                        ))
                        continue
                    
                    # Calculate statistics
                    total_opps = len(opportunities)
                    avg_ev = sum(opp.ev_percent for opp in opportunities) / total_opps
                    avg_ev = _truncate(avg_ev, 2)
                    
                    # Tier counts
                    tier_counts = {}
                    for opp in opportunities:
                        tier_counts[opp.ev_tier] = tier_counts.get(opp.ev_tier, 0) + 1
                    
                    # Top sports
                    sport_counts = {}
                    for opp in opportunities:
                        sport_counts[opp.sport] = sport_counts.get(opp.sport, 0) + 1
                    top_sports = [
                        {"sport": sport, "count": count}
                        for sport, count in sorted(sport_counts.items(), key=lambda x: x[1], reverse=True)[:5]
                    ]
                    
                    # Top players
                    player_counts = {}
                    for opp in opportunities:
                        player_counts[opp.player] = player_counts.get(opp.player, 0) + 1
                    top_players = [
                        {"player": player, "count": count}
                        for player, count in sorted(player_counts.items(), key=lambda x: x[1], reverse=True)[:5]
                    ]
                    
                    results.append(DailyEVStats(
                        date=current_date.isoformat(),
                        total_opportunities=total_opps,
                        avg_ev_percent=avg_ev,
                        tier_counts=tier_counts,
                        top_sports=top_sports,
                        top_players=top_players
                    ))
                    
                return results
                
        except Exception as e:
            logger.error(f"Failed to get daily EV stats: {e}", exc_info=True)
            return []
            
    async def get_daily_arbitrage_stats(self, days: int = 30) -> List[DailyArbitrageStats]:
        """Get daily arbitrage statistics for the last N days"""
        try:
            async with self._session_scope() as session:
                # Calculate date range
                end_date = datetime.now(timezone.utc).date()
                start_date = end_date - timedelta(days=days-1)
                
                results = []
                
                # Generate stats for each day
                for i in range(days):
                    current_date = start_date + timedelta(days=i)
                    next_date = current_date + timedelta(days=1)
                    
                    # Get day's data
                    day_data = await session.execute(
                        select(ArbitrageHistory).where(
                            and_(
                                ArbitrageHistory.detected_at >= current_date,
                                ArbitrageHistory.detected_at < next_date
                            )
                        )
                    )
                    
                    opportunities = day_data.scalars().all()
                    
                    if not opportunities:
                        # Include empty days with zeros
                        results.append(DailyArbitrageStats(
                            date=current_date.isoformat(),
                            total_opportunities=0,
                            avg_profit_pct=0.0,
                            total_books_involved=0,
                            top_sports=[],
                            top_markets=[]
                        ))
                        continue
                    
                    # Calculate statistics
                    total_opps = len(opportunities)
                    avg_profit = sum(opp.profit_pct for opp in opportunities) / total_opps
                    avg_profit = _truncate(avg_profit, 2)
                    total_books = sum(opp.num_bookmakers for opp in opportunities)
                    
                    # Top sports
                    sport_counts = {}
                    for opp in opportunities:
                        sport_counts[opp.sport] = sport_counts.get(opp.sport, 0) + 1
                    top_sports = [
                        {"sport": sport, "count": count}
                        for sport, count in sorted(sport_counts.items(), key=lambda x: x[1], reverse=True)[:5]
                    ]
                    
                    # Top markets
                    market_counts = {}
                    for opp in opportunities:
                        market_counts[opp.market] = market_counts.get(opp.market, 0) + 1
                    top_markets = [
                        {"market": market, "count": count}
                        for market, count in sorted(market_counts.items(), key=lambda x: x[1], reverse=True)[:5]
                    ]
                    
                    results.append(DailyArbitrageStats(
                        date=current_date.isoformat(),
                        total_opportunities=total_opps,
                        avg_profit_pct=avg_profit,
                        total_books_involved=total_books,
                        top_sports=top_sports,
                        top_markets=top_markets
                    ))
                    
                return results
                
        except Exception as e:
            logger.error(f"Failed to get daily arbitrage stats: {e}", exc_info=True)
            return []
            
    async def prune_old_records(self) -> Dict[str, int]:
        """
        Remove old records based on retention configuration
        
        Returns:
            Dict[str, int]: Count of records removed for each table
        """
        try:
            async with self._session_scope() as session:
                # Calculate cutoff dates
                ev_cutoff = datetime.now(timezone.utc) - timedelta(days=EV_HISTORY_RETENTION_DAYS)
                arb_cutoff = datetime.now(timezone.utc) - timedelta(days=ARB_HISTORY_RETENTION_DAYS)
                
                # Delete old EV records
                ev_result = await session.execute(
                    delete(EVOpportunityHistory).where(
                        EVOpportunityHistory.detected_at < ev_cutoff
                    )
                )
                ev_deleted = ev_result.rowcount
                
                # Delete old arbitrage records
                arb_result = await session.execute(
                    delete(ArbitrageHistory).where(
                        ArbitrageHistory.detected_at < arb_cutoff
                    )
                )
                arb_deleted = arb_result.rowcount
                
                await session.commit()
                
                logger.info(f"Pruned {ev_deleted} EV records, {arb_deleted} arbitrage records")
                
                return {
                    "ev_opportunities_deleted": ev_deleted,
                    "arbitrage_opportunities_deleted": arb_deleted
                }
                
        except Exception as e:
            logger.error(f"Failed to prune old records: {e}", exc_info=True)
            return {"ev_opportunities_deleted": 0, "arbitrage_opportunities_deleted": 0}
            
    async def get_summary_stats(self) -> Dict[str, Any]:
        """Get consolidated summary statistics for dashboard"""
        try:
            async with self._session_scope() as session:
                # Last 24 hours
                day_ago = datetime.now(timezone.utc) - timedelta(hours=24)
                
                # EV stats
                ev_result = await session.execute(
                    select(
                        func.count(EVOpportunityHistory.id),
                        func.avg(EVOpportunityHistory.ev_percent),
                        func.max(EVOpportunityHistory.ev_percent)
                    ).where(EVOpportunityHistory.detected_at >= day_ago)
                )
                ev_row = ev_result.first()
                if ev_row:
                    ev_count = ev_row[0] or 0
                    ev_avg = ev_row[1] or 0
                    ev_max = ev_row[2] or 0
                else:
                    ev_count, ev_avg, ev_max = 0, 0, 0
                
                # EV tier counts (last 24h)
                ev_tier_result = await session.execute(
                    select(
                        EVOpportunityHistory.ev_tier,
                        func.count(EVOpportunityHistory.id)
                    ).where(EVOpportunityHistory.detected_at >= day_ago)
                    .group_by(EVOpportunityHistory.ev_tier)
                )
                tier_counts = {tier: count for tier, count in ev_tier_result}
                
                # Calculate percentage of high-value EV (>=7%)
                high_ev_result = await session.execute(
                    select(func.count(EVOpportunityHistory.id))
                    .where(
                        and_(
                            EVOpportunityHistory.detected_at >= day_ago,
                            EVOpportunityHistory.ev_percent >= 7.0
                        )
                    )
                )
                high_ev_count = high_ev_result.scalar() or 0
                pct_high = (high_ev_count / ev_count * 100) if ev_count else 0
                
                # Arbitrage stats  
                arb_result = await session.execute(
                    select(
                        func.count(ArbitrageHistory.id),
                        func.avg(ArbitrageHistory.profit_pct)
                    ).where(ArbitrageHistory.detected_at >= day_ago)
                )
                arb_row = arb_result.first()
                if arb_row:
                    arb_count = arb_row[0] or 0
                    arb_avg = arb_row[1] or 0
                else:
                    arb_count, arb_avg = 0, 0
                
                return {
                    "ev": {
                        "avg": _truncate(ev_avg, 2),
                        "pctHigh": round(pct_high, 1),
                        "tierCounts": tier_counts
                    },
                    "arbitrage": {
                        "count24h": arb_count or 0,
                        "avgProfitPct24h": round(arb_avg or 0, 2)
                    }
                }
                
        except Exception as e:
            logger.error(f"Failed to get summary stats: {e}", exc_info=True)
            return {
                "ev": {"avg": 0, "pctHigh": 0, "tierCounts": {}},
                "arbitrage": {"count24h": 0, "avgProfitPct24h": 0}
            }
            
    async def wait_for_background_tasks(self) -> None:
        """Wait for all background persistence tasks to complete (useful for testing)"""
        if self._background_tasks:
            await asyncio.gather(*self._background_tasks, return_exceptions=True)