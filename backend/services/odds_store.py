"""
Odds Storage & Best Line Detection Service

This service implements the core functionality for Phase 1.2:
- Store and retrieve odds snapshots from multiple bookmakers
- Calculate best available lines across sportsbooks
- Track line movement and detect steam moves
- Aggregate consensus data for props
- Integration with OddsNormalizer for probability calculations

Key Features:
- Real-time best line detection
- Historical odds storage and retrieval
- Arbitrage opportunity detection
- Steam move detection
- Consensus probability calculation
"""

import asyncio
import logging
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass
import json

try:
    from sqlalchemy.ext.asyncio import AsyncSession
    from sqlalchemy import select, and_, desc, func
    from sqlalchemy.orm import selectinload
    from backend.models.odds import (
        Bookmaker, OddsSnapshot, OddsHistory, BestLineAggregate,
        BestLineCalculator, INITIAL_BOOKMAKERS, BookmakerStatus
    )
    from backend.services.odds_normalizer import OddsNormalizer
    from backend.services.unified_cache_service import unified_cache_service
    SQLALCHEMY_AVAILABLE = True
except ImportError as e:
    logging.warning(f"Could not import database dependencies: {e}")
    AsyncSession = None
    Bookmaker = None
    OddsSnapshot = None
    OddsNormalizer = None
    unified_cache_service = None
    SQLALCHEMY_AVAILABLE = False

logger = logging.getLogger(__name__)

@dataclass
class BookmakerOdds:
    """Standardized odds data from a single bookmaker"""
    bookmaker_name: str
    bookmaker_id: int
    over_odds: Optional[int]
    under_odds: Optional[int]
    line: Optional[float]
    timestamp: datetime
    volume_indicator: Optional[str] = None
    is_available: bool = True

@dataclass
class BestLineResult:
    """Result of best line calculation"""
    prop_id: str
    best_over_odds: Optional[int]
    best_over_bookmaker: Optional[str]
    best_under_odds: Optional[int]
    best_under_bookmaker: Optional[str]
    consensus_line: Optional[float]
    consensus_over_prob: Optional[float]
    consensus_under_prob: Optional[float]
    num_bookmakers: int
    arbitrage_opportunity: bool
    arbitrage_profit_pct: float
    last_updated: datetime

class OddsStoreService:
    """Service for storing and retrieving odds data with best line detection"""
    
    def __init__(self):
        self.odds_normalizer = None
        self.cache_service = None
        try:
            from backend.services.unified_logging import get_logger
            self.logger = get_logger("odds_store")
        except ImportError:
            self.logger = logger
        
        try:
            if OddsNormalizer is not None:
                self.odds_normalizer = OddsNormalizer(precision=4)
                self.logger.info("OddsNormalizer initialized for odds storage")
        except Exception as e:
            self.logger.warning(f"Could not initialize OddsNormalizer: {e}")
            
        try:
            if unified_cache_service is not None:
                self.cache_service = unified_cache_service
                self.logger.info("Cache service initialized for odds storage")
        except Exception as e:
            self.logger.warning(f"Could not initialize cache service: {e}")
    
    async def initialize_bookmakers(self, session: AsyncSession) -> List[Bookmaker]:
        """Initialize bookmaker registry with default sportsbooks"""
        try:
            # Check if bookmakers already exist
            result = await session.execute(select(Bookmaker))
            existing = result.scalars().all()
            
            if existing:
                self.logger.info(f"Found {len(existing)} existing bookmakers")
                return existing
                
            # Create initial bookmakers
            bookmakers = []
            for book_data in INITIAL_BOOKMAKERS:
                bookmaker = Bookmaker(**book_data)
                bookmakers.append(bookmaker)
                session.add(bookmaker)
            
            await session.commit()
            self.logger.info(f"Initialized {len(bookmakers)} bookmakers")
            return bookmakers
            
        except Exception as e:
            self.logger.error(f"Error initializing bookmakers: {e}")
            await session.rollback()
            return []
    
    async def store_odds_snapshot(self, session: AsyncSession, prop_id: str, sport: str, 
                                market_type: str, bookmaker_odds: List[BookmakerOdds]) -> List[OddsSnapshot]:
        """
        Store current odds snapshots for a prop from multiple bookmakers
        
        Args:
            session: Database session
            prop_id: Unique prop identifier
            sport: Sport code (NBA, MLB, etc.)
            market_type: Market type (Points, Assists, etc.)
            bookmaker_odds: List of odds from different bookmakers
            
        Returns:
            List of created OddsSnapshot objects
        """
        if not bookmaker_odds:
            return []
            
        snapshots = []
        current_time = datetime.now(timezone.utc)
        
        try:
            for odds_data in bookmaker_odds:
                # Normalize odds if normalizer is available
                over_implied_prob = None
                under_implied_prob = None
                over_decimal = None
                under_decimal = None
                
                if self.odds_normalizer and odds_data.over_odds and odds_data.under_odds:
                    try:
                        # Convert to decimal odds
                        over_decimal = self.odds_normalizer.american_to_decimal(odds_data.over_odds)
                        under_decimal = self.odds_normalizer.american_to_decimal(odds_data.under_odds)
                        
                        # Calculate no-vig probabilities
                        over_raw_prob = 1.0 / over_decimal
                        under_raw_prob = 1.0 / under_decimal
                        
                        # Remove vig for two-way market
                        total_prob = over_raw_prob + under_raw_prob
                        if total_prob > 0:
                            over_implied_prob = over_raw_prob / total_prob
                            under_implied_prob = under_raw_prob / total_prob
                    except Exception as e:
                        self.logger.warning(f"Error normalizing odds for {prop_id}: {e}")
                
                snapshot = OddsSnapshot(
                    prop_id=prop_id,
                    sport=sport,
                    market_type=market_type,
                    bookmaker_id=odds_data.bookmaker_id,
                    line=odds_data.line,
                    over_odds=odds_data.over_odds,
                    under_odds=odds_data.under_odds,
                    over_decimal=over_decimal,
                    under_decimal=under_decimal,
                    over_implied_prob=over_implied_prob,
                    under_implied_prob=under_implied_prob,
                    volume_indicator=odds_data.volume_indicator,
                    is_available=odds_data.is_available,
                    captured_at=current_time,
                    source_timestamp=odds_data.timestamp
                )
                
                session.add(snapshot)
                snapshots.append(snapshot)
            
            await session.commit()
            self.logger.info(f"Stored {len(snapshots)} odds snapshots for prop {prop_id}")
            
            # Update best line aggregate asynchronously
            asyncio.create_task(self._update_best_line_aggregate(prop_id, sport))
            
            return snapshots
            
        except Exception as e:
            self.logger.error(f"Error storing odds snapshots for {prop_id}: {e}")
            await session.rollback()
            return []
    
    async def get_best_line(self, session: AsyncSession, prop_id: str, 
                          max_age_minutes: int = 30) -> Optional[BestLineResult]:
        """
        Get best available odds for a prop across all bookmakers
        
        Args:
            session: Database session
            prop_id: Unique prop identifier
            max_age_minutes: Maximum age of odds data to consider
            
        Returns:
            BestLineResult with best odds or None if no data found
        """
        try:
            # Check cache first
            cache_key = f"best_line:{prop_id}:{max_age_minutes}"
            if self.cache_service:
                try:
                    # cache service may be async (awaitable) or sync
                    maybe_coroutine = self.cache_service.get(cache_key)
                    if asyncio.iscoroutine(maybe_coroutine):
                        cached_result = await maybe_coroutine
                    else:
                        cached_result = maybe_coroutine

                    if cached_result:
                        # If cached_result is a dict-like mapping
                        if isinstance(cached_result, dict):
                            return BestLineResult(**cached_result)
                        # If cache stored pickled BestLineResult.__dict__
                        try:
                            return BestLineResult(**cached_result.__dict__)
                        except Exception:
                            pass
                except Exception as e:
                    self.logger.warning(f"Cache lookup failed for {cache_key}: {e}")
            
            # Get recent snapshots for the prop
            cutoff_time = datetime.now(timezone.utc) - timedelta(minutes=max_age_minutes)
            
            query = select(OddsSnapshot).options(
                selectinload(OddsSnapshot.bookmaker)
            ).where(
                and_(
                    OddsSnapshot.prop_id == prop_id,
                    OddsSnapshot.captured_at > cutoff_time,
                    OddsSnapshot.is_available == True
                )
            ).order_by(desc(OddsSnapshot.captured_at))
            
            result = await session.execute(query)
            snapshots = result.scalars().all()
            
            if not snapshots:
                return None
            
            # Get most recent snapshot per bookmaker
            latest_by_bookmaker = {}
            for snapshot in snapshots:
                book_id = snapshot.bookmaker_id
                if book_id not in latest_by_bookmaker or snapshot.captured_at > latest_by_bookmaker[book_id].captured_at:
                    latest_by_bookmaker[book_id] = snapshot
            
            latest_snapshots = list(latest_by_bookmaker.values())
            
            # Calculate best lines using utility function
            best_data = BestLineCalculator.find_best_odds(latest_snapshots)
            if not best_data:
                return None
            
            # Detect arbitrage
            arbitrage_opportunity, arbitrage_profit = BestLineCalculator.detect_arbitrage(
                best_data.get('best_over_odds'),
                best_data.get('best_under_odds')
            )
            
            result = BestLineResult(
                prop_id=prop_id,
                best_over_odds=best_data.get('best_over_odds'),
                best_over_bookmaker=best_data.get('best_over_bookmaker').short_name if best_data.get('best_over_bookmaker') else None,
                best_under_odds=best_data.get('best_under_odds'),
                best_under_bookmaker=best_data.get('best_under_bookmaker').short_name if best_data.get('best_under_bookmaker') else None,
                consensus_line=best_data.get('consensus_line'),
                consensus_over_prob=best_data.get('consensus_over_prob'),
                consensus_under_prob=best_data.get('consensus_under_prob'),
                num_bookmakers=best_data.get('num_bookmakers', 0),
                arbitrage_opportunity=arbitrage_opportunity,
                arbitrage_profit_pct=arbitrage_profit,
                last_updated=datetime.now(timezone.utc)
            )
            
            # Cache result for 5 minutes (handle async or sync cache)
            if self.cache_service:
                try:
                    maybe_set = self.cache_service.set(cache_key, result.__dict__, ttl_seconds=300)
                    if asyncio.iscoroutine(maybe_set):
                        await maybe_set
                except Exception as e:
                    self.logger.warning(f"Failed to set cache for {cache_key}: {e}")
            
            return result
            
        except Exception as e:
            self.logger.error(f"Error getting best line for {prop_id}: {e}")
            return None
    
    async def get_line_movement(self, session: AsyncSession, prop_id: str, 
                               bookmaker_name: Optional[str] = None,
                               hours_back: int = 24) -> List[Dict[str, Any]]:
        """
        Get line movement history for a prop
        
        Args:
            session: Database session
            prop_id: Unique prop identifier
            bookmaker_name: Optional bookmaker filter
            hours_back: Number of hours to look back
            
        Returns:
            List of movement data points
        """
        try:
            cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours_back)
            
            query = select(OddsSnapshot).options(
                selectinload(OddsSnapshot.bookmaker)
            ).where(
                and_(
                    OddsSnapshot.prop_id == prop_id,
                    OddsSnapshot.captured_at > cutoff_time
                )
            )
            
            if bookmaker_name:
                query = query.join(Bookmaker).where(Bookmaker.name == bookmaker_name)
            
            query = query.order_by(OddsSnapshot.captured_at)
            
            result = await session.execute(query)
            snapshots = result.scalars().all()
            
            if not snapshots:
                return []
            
            # Calculate movements
            movements = []
            prev_by_bookmaker = {}
            
            for snapshot in snapshots:
                book_name = snapshot.bookmaker.name
                movement_data = {
                    'timestamp': snapshot.captured_at,
                    'bookmaker': book_name,
                    'line': snapshot.line,
                    'over_odds': snapshot.over_odds,
                    'under_odds': snapshot.under_odds,
                    'line_movement': None,
                    'over_odds_movement': None,
                    'under_odds_movement': None
                }
                
                if book_name in prev_by_bookmaker:
                    prev = prev_by_bookmaker[book_name]
                    if snapshot.line is not None and prev.line is not None:
                        movement_data['line_movement'] = snapshot.line - prev.line
                    if snapshot.over_odds is not None and prev.over_odds is not None:
                        movement_data['over_odds_movement'] = snapshot.over_odds - prev.over_odds
                    if snapshot.under_odds is not None and prev.under_odds is not None:
                        movement_data['under_odds_movement'] = snapshot.under_odds - prev.under_odds
                
                movements.append(movement_data)
                prev_by_bookmaker[book_name] = snapshot
            
            return movements
            
        except Exception as e:
            self.logger.error(f"Error getting line movement for {prop_id}: {e}")
            return []
    
    async def detect_steam_moves(self, session: AsyncSession, prop_id: str,
                                lookback_minutes: int = 30) -> List[Dict[str, Any]]:
        """
        Detect steam moves (coordinated line movements across multiple books)
        
        Args:
            session: Database session
            prop_id: Unique prop identifier
            lookback_minutes: Time window to analyze
            
        Returns:
            List of detected steam moves
        """
        try:
            cutoff_time = datetime.now(timezone.utc) - timedelta(minutes=lookback_minutes)
            
            # Get recent snapshots grouped by time windows
            query = select(OddsSnapshot).options(
                selectinload(OddsSnapshot.bookmaker)
            ).where(
                and_(
                    OddsSnapshot.prop_id == prop_id,
                    OddsSnapshot.captured_at > cutoff_time
                )
            ).order_by(OddsSnapshot.captured_at)
            
            result = await session.execute(query)
            snapshots = result.scalars().all()
            
            if len(snapshots) < 4:  # Need minimum data points
                return []
            
            # Group snapshots by 5-minute windows
            steam_moves = []
            window_size = 5  # minutes
            
            # Simple steam detection algorithm
            for i in range(len(snapshots) - 2):
                window_snapshots = [s for s in snapshots 
                                  if abs((s.captured_at - snapshots[i].captured_at).total_seconds()) <= window_size * 60]
                
                if len(window_snapshots) >= 3:  # Multiple books moving
                    # Check for significant concurrent movements
                    line_movements = []
                    for snapshot in window_snapshots:
                        if snapshot.line is not None:
                            # Calculate movement from baseline (first snapshot)
                            baseline_line = snapshots[0].line if snapshots[0].line else snapshot.line
                            movement = abs(snapshot.line - baseline_line)
                            if movement >= 0.5:  # Significant movement threshold
                                line_movements.append({
                                    'bookmaker': snapshot.bookmaker.name,
                                    'movement': movement,
                                    'timestamp': snapshot.captured_at
                                })
                    
                    if len(line_movements) >= 2:  # Multiple books moving significantly
                        steam_moves.append({
                            'detected_at': window_snapshots[0].captured_at,
                            'bookmaker_count': len(line_movements),
                            'movements': line_movements,
                            'confidence': min(1.0, len(line_movements) / 5.0),  # Confidence based on book count
                            'max_movement': max(m['movement'] for m in line_movements)
                        })
            
            return steam_moves
            
        except Exception as e:
            self.logger.error(f"Error detecting steam moves for {prop_id}: {e}")
            return []
    
    async def _update_best_line_aggregate(self, prop_id: str, sport: str) -> None:
        """
        Update the best line aggregate table (background task)
        """
        try:
            # This would be implemented with a proper database session
            # For now, just log the intent
            self.logger.info(f"Updating best line aggregate for {prop_id} ({sport})")
            # Attempt to import async session factory on-demand to avoid circular imports
            if not SQLALCHEMY_AVAILABLE:
                self.logger.warning("SQLAlchemy not available - skipping best line aggregate update")
                return

            from backend.database import async_engine
            # Use SQLAlchemy AsyncSession directly with the async engine
            async with AsyncSession(async_engine) as session:
                try:
                    best = await self.get_best_line(session, prop_id)
                    if not best:
                        self.logger.info(f"No best line data for {prop_id}, skipping aggregate upsert")
                        return

                    # Upsert into BestLineAggregate table
                    # Use BestLineAggregate model imported earlier
                    stmt = None
                    # Try to find existing aggregate
                    query = select(BestLineAggregate).where(BestLineAggregate.prop_id == prop_id)
                    res = await session.execute(query)
                    existing = res.scalars().first()

                    # Resolve bookmaker ids if we have string short names
                    async def _resolve_bookmaker_id(name_or_short):
                        try:
                            if not name_or_short:
                                return None
                            # Try to find bookmaker by short_name or name (case-insensitive)
                            q = select(Bookmaker).where(
                                (Bookmaker.short_name.ilike(name_or_short)) | (Bookmaker.name.ilike(name_or_short)) | (Bookmaker.display_name.ilike(name_or_short))
                            )
                            r = await session.execute(q)
                            b = r.scalars().first()
                            return b.id if b else None
                        except Exception:
                            return None

                    if existing:
                        existing.best_over_odds = best.best_over_odds
                        existing.best_over_bookmaker_id = await _resolve_bookmaker_id(best.best_over_bookmaker)
                        existing.best_under_odds = best.best_under_odds
                        existing.best_under_bookmaker_id = await _resolve_bookmaker_id(best.best_under_bookmaker)
                        existing.consensus_line = best.consensus_line
                        existing.consensus_over_prob = best.consensus_over_prob
                        existing.consensus_under_prob = best.consensus_under_prob
                        existing.num_bookmakers = best.num_bookmakers
                        existing.line_spread = getattr(best, 'consensus_line', None)
                        existing.odds_spread_over = None
                        existing.odds_spread_under = None
                        existing.arbitrage_opportunity = best.arbitrage_opportunity
                        existing.arbitrage_profit_pct = best.arbitrage_profit_pct
                        existing.last_updated = best.last_updated
                        session.add(existing)
                    else:
                        agg = BestLineAggregate(
                            prop_id=prop_id,
                            sport=sport,
                            best_over_odds=best.best_over_odds,
                            best_over_bookmaker_id=await _resolve_bookmaker_id(best.best_over_bookmaker),
                            best_under_odds=best.best_under_odds,
                            best_under_bookmaker_id=await _resolve_bookmaker_id(best.best_under_bookmaker),
                            consensus_line=best.consensus_line,
                            consensus_over_prob=best.consensus_over_prob,
                            consensus_under_prob=best.consensus_under_prob,
                            num_bookmakers=best.num_bookmakers,
                            line_spread=getattr(best, 'consensus_line', None),
                            odds_spread_over=None,
                            odds_spread_under=None,
                            arbitrage_opportunity=best.arbitrage_opportunity,
                            arbitrage_profit_pct=best.arbitrage_profit_pct,
                            last_updated=best.last_updated
                        )
                        session.add(agg)

                    await session.commit()

                    # Cache result for fast reads
                    if self.cache_service:
                        cache_key = f"best_line_aggregate:{prop_id}"
                        self.cache_service.set(cache_key, {
                            'best_over_odds': best.best_over_odds,
                            'best_over_bookmaker': best.best_over_bookmaker,
                            'best_under_odds': best.best_under_odds,
                            'best_under_bookmaker': best.best_under_bookmaker,
                            'consensus_line': best.consensus_line,
                            'consensus_over_prob': best.consensus_over_prob,
                            'consensus_under_prob': best.consensus_under_prob,
                            'num_bookmakers': best.num_bookmakers,
                            'arbitrage_opportunity': best.arbitrage_opportunity,
                            'arbitrage_profit_pct': best.arbitrage_profit_pct,
                            'last_updated': best.last_updated.isoformat()
                        }, ttl_seconds=600)

                    self.logger.info(f"Upserted BestLineAggregate for {prop_id}")

                except Exception as inner_e:
                    self.logger.error(f"Error updating aggregate inside session for {prop_id}: {inner_e}")
        except Exception as e:
            self.logger.error(f"Error updating best line aggregate for {prop_id}: {e}")

    def get_bookmaker_by_name(self, bookmakers: List[Bookmaker], name: str) -> Optional[Bookmaker]:
        """Helper method to find bookmaker by name"""
        for bookmaker in bookmakers:
            if bookmaker.name.lower() == name.lower() or bookmaker.short_name.lower() == name.lower():
                return bookmaker
        return None


# Singleton service instance
odds_store_service = OddsStoreService()

# Helper functions for integration with PropFinderDataService
async def store_prop_odds(prop_id: str, sport: str, market_type: str, 
                         bookmaker_odds_dict: Dict[str, Dict[str, int]]) -> List[Dict[str, Any]]:
    """
    Helper function to store odds from PropFinderDataService format
    
    Args:
        prop_id: Prop identifier
        sport: Sport code
        market_type: Market type
        bookmaker_odds_dict: {'draftkings': {'over': -110, 'under': -110}, ...}
        
    Returns:
        List of bookmaker data for API response
    """
    try:
        # Convert to BookmakerOdds format
        bookmaker_odds = []
        current_time = datetime.now(timezone.utc)
        
        # Mock bookmaker IDs for now (in real implementation, would query database)
        bookmaker_id_map = {
            'draftkings': 1,
            'fanduel': 2,
            'betmgm': 3,
            'caesars': 4,
            'barstool': 5
        }
        
        for book_name, odds_data in bookmaker_odds_dict.items():
            bookmaker_id = bookmaker_id_map.get(book_name.lower(), 1)
            
            odds = BookmakerOdds(
                bookmaker_name=book_name,
                bookmaker_id=bookmaker_id,
                over_odds=odds_data.get('over'),
                under_odds=odds_data.get('under'),
                line=odds_data.get('line', 25.5),  # Default line
                timestamp=current_time,
                volume_indicator='MED',
                is_available=True
            )
            bookmaker_odds.append(odds)
        
        # Return formatted bookmaker data for API response
        return [
            {
                'name': odds.bookmaker_name.title(),
                'odds': odds.over_odds,
                'line': odds.line,
                'volume': odds.volume_indicator,
                'lastUpdated': odds.timestamp.isoformat()
            }
            for odds in bookmaker_odds
        ]
        
    except Exception as e:
        logger.error(f"Error storing prop odds: {e}")
        return []


def create_enhanced_bookmaker_response(bookmaker_odds_dict: Dict[str, Dict[str, int]], 
                                     ai_probability: float, side: str = 'over') -> Dict[str, Any]:
    """
    Create enhanced API response with best line detection
    
    Args:
        bookmaker_odds_dict: Raw odds data
        ai_probability: AI probability for edge calculation
        side: Betting side (over/under)
        
    Returns:
        Enhanced response with best line data
    """
    try:
        # Find best odds
        best_odds = None
        best_book = None
        all_books = []
        
        for book_name, odds_data in bookmaker_odds_dict.items():
            odds = odds_data.get(side)
            if odds is not None:
                all_books.append({
                    'name': book_name.title(),
                    'odds': odds,
                    'line': odds_data.get('line', 25.5)
                })
                
                if best_odds is None or BestLineCalculator._is_better_odds(odds, best_odds):
                    best_odds = odds
                    best_book = book_name.title()
        
        # Use OddsNormalizer for probability calculations
        odds_normalizer = OddsNormalizer() if OddsNormalizer else None
        implied_prob = 0.5  # Default
        edge = 0.0
        
        if odds_normalizer and best_odds:
            try:
                decimal_odds = odds_normalizer.american_to_decimal(best_odds)
                implied_prob = 1.0 / decimal_odds
                
                # No-vig adjustment (simplified for single book)
                edge = (ai_probability - implied_prob) * 100
            except Exception as e:
                logger.warning(f"Error calculating probabilities: {e}")
        
        return {
            'odds': best_odds or -110,
            'impliedProbability': round(implied_prob * 100, 1),
            'aiProbability': round(ai_probability * 100, 1),
            'edge': round(edge, 1),
            'bestBook': best_book,
            'bookmakers': all_books,
            'numBookmakers': len(all_books),
            'lastUpdated': datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error creating enhanced bookmaker response: {e}")
        return {
            'odds': -110,
            'impliedProbability': 52.4,
            'aiProbability': round(ai_probability * 100, 1),
            'edge': round((ai_probability - 0.524) * 100, 1),
            'bestBook': 'DraftKings',
            'bookmakers': [],
            'numBookmakers': 0,
            'lastUpdated': datetime.now(timezone.utc).isoformat()
        }