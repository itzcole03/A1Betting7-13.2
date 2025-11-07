"""
Odds Storage Service - Phase 1.2 PropFinder Implementation

This service provides comprehensive odds data storage, best line aggregation,
and line movement tracking functionality for the PropFinder system.

Key Features:
- Real-time odds snapshot storage
- Best line detection across multiple bookmakers
- Line movement tracking and analysis
- Arbitrage opportunity detection
- Historical odds data management

Integrates with:
- OddsNormalizer for no-vig calculations
- PropFinder service for best odds data
- Database models: Bookmaker, OddsSnapshot, OddsHistory, BestLineAggregate

Author: A1Betting Development Team
Version: 1.0.0
Created: 2025-08-19
"""

import logging
import asyncio
from typing import List, Dict, Optional, Tuple, Any
from datetime import datetime, timezone, timedelta

# Database imports - use existing patterns
from backend.database import db_manager
from backend.models.odds import (
    Bookmaker, OddsSnapshot, OddsHistory, BestLineAggregate, 
    BestLineCalculator, INITIAL_BOOKMAKERS
)

# SQLAlchemy imports with fallback
try:
    from sqlalchemy.orm import Session, joinedload
    from sqlalchemy.exc import IntegrityError
    from sqlalchemy import and_, desc, func, text
    SQLALCHEMY_AVAILABLE = True
except ImportError:
    # Fallback for environments without SQLAlchemy
    SQLALCHEMY_AVAILABLE = False
    logger.warning("SQLAlchemy not available - some features disabled")

# Import odds normalizer
try:
    from backend.services.odds_normalizer import odds_normalizer
except ImportError:
    logger.warning("OddsNormalizer not available - using basic calculations")
    odds_normalizer = None

logger = logging.getLogger(__name__)


class OddsStorageService:
    """
    Comprehensive odds data storage and management service.
    
    Handles all odds-related database operations, line movement tracking,
    and best odds aggregation for the PropFinder system.
    """
    
    def __init__(self):
        self.initialized = False
        self._cache_timeout = 300  # 5 minutes
        self._movement_threshold = 0.5  # Line movement significance threshold
        self._steam_threshold = 2.0  # Steam move detection threshold
        
    async def initialize(self):
        """Initialize the service and ensure bookmaker data exists."""
        if self.initialized:
            return
            
        try:
            await self._ensure_bookmakers_exist()
            self.initialized = True
            logger.info("✅ OddsStorageService initialized successfully")
        except Exception as e:
            logger.error(f"❌ Failed to initialize OddsStorageService: {e}")
            raise
    
    async def _ensure_bookmakers_exist(self):
        """Ensure initial bookmaker data exists in the database."""
        async with get_db() as db:
            try:
                existing_count = db.query(Bookmaker).count()
                if existing_count == 0:
                    logger.info("No bookmakers found, seeding initial data...")
                    
                    for book_data in INITIAL_BOOKMAKERS:
                        bookmaker = Bookmaker(**book_data)
                        db.add(bookmaker)
                    
                    db.commit()
                    logger.info(f"✅ Seeded {len(INITIAL_BOOKMAKERS)} bookmakers")
                else:
                    logger.info(f"Found {existing_count} existing bookmakers")
                    
            except Exception as e:
                logger.error(f"Error seeding bookmakers: {e}")
                db.rollback()
                raise
    
    # Bookmaker Management
    
    async def get_active_bookmakers(self) -> List[Dict]:
        """Get all active bookmakers with metadata."""
        async with get_db() as db:
            bookmakers = db.query(Bookmaker).filter(
                Bookmaker.status == 'active'
            ).order_by(Bookmaker.priority_weight.desc()).all()
            
            return [self._bookmaker_to_dict(book) for book in bookmakers]
    
    async def get_bookmaker_by_name(self, name: str) -> Optional[Dict]:
        """Get bookmaker by name."""
        async with get_db() as db:
            bookmaker = db.query(Bookmaker).filter(
                Bookmaker.name == name.lower()
            ).first()
            
            return self._bookmaker_to_dict(bookmaker) if bookmaker else None
    
    async def update_bookmaker_status(self, name: str, status: str, 
                                     reliability_score: Optional[float] = None) -> bool:
        """Update bookmaker status and reliability metrics."""
        async with get_db() as db:
            try:
                bookmaker = db.query(Bookmaker).filter(
                    Bookmaker.name == name.lower()
                ).first()
                
                if not bookmaker:
                    logger.warning(f"Bookmaker '{name}' not found")
                    return False
                
                bookmaker.status = status
                if reliability_score is not None:
                    bookmaker.reliability_score = reliability_score
                bookmaker.updated_at = datetime.now(timezone.utc)
                
                db.commit()
                logger.info(f"Updated {name} status to {status}")
                return True
                
            except Exception as e:
                logger.error(f"Error updating bookmaker {name}: {e}")
                db.rollback()
                return False
    
    # Odds Snapshot Storage
    
    async def store_odds_snapshot(self, odds_data: Dict) -> Optional[int]:
        """
        Store a new odds snapshot with automatic best line updates.
        
        Args:
            odds_data: Dictionary containing odds information
            
        Returns:
            Snapshot ID if successful, None otherwise
        """
        await self.initialize()
        
        async with get_db() as db:
            try:
                # Get bookmaker
                bookmaker = db.query(Bookmaker).filter(
                    Bookmaker.name == odds_data.get('bookmaker', '').lower()
                ).first()
                
                if not bookmaker:
                    logger.warning(f"Bookmaker '{odds_data.get('bookmaker')}' not found")
                    return None
                
                # Calculate normalized probabilities if odds provided
                over_implied_prob = None
                under_implied_prob = None
                over_decimal = None
                under_decimal = None
                
                if odds_data.get('over_odds'):
                    over_decimal = odds_normalizer.american_to_decimal(odds_data['over_odds'])
                    over_implied_prob = odds_normalizer.implied_prob_from_american(odds_data['over_odds'])
                
                if odds_data.get('under_odds'):
                    under_decimal = odds_normalizer.american_to_decimal(odds_data['under_odds'])
                    under_implied_prob = odds_normalizer.implied_prob_from_american(odds_data['under_odds'])
                
                # Create odds snapshot
                snapshot = OddsSnapshot(
                    prop_id=odds_data['prop_id'],
                    game_id=odds_data.get('game_id'),
                    player_name=odds_data.get('player_name'),
                    sport=odds_data['sport'],
                    market_type=odds_data['market_type'],
                    bookmaker_id=bookmaker.id,
                    line=odds_data.get('line'),
                    over_odds=odds_data.get('over_odds'),
                    under_odds=odds_data.get('under_odds'),
                    over_decimal=over_decimal,
                    under_decimal=under_decimal,
                    over_implied_prob=over_implied_prob,
                    under_implied_prob=under_implied_prob,
                    volume_indicator=odds_data.get('volume_indicator'),
                    is_available=odds_data.get('is_available', True),
                    source_timestamp=odds_data.get('source_timestamp')
                )
                
                db.add(snapshot)
                db.flush()  # Get ID without committing
                
                # Track line movement if there's a previous snapshot
                await self._track_line_movement(db, snapshot)
                
                # Update best line aggregate
                await self._update_best_line_aggregate(db, odds_data['prop_id'])
                
                db.commit()
                logger.debug(f"Stored odds snapshot: {snapshot.prop_id} @ {bookmaker.name}")
                return snapshot.id
                
            except IntegrityError as e:
                logger.warning(f"Duplicate odds snapshot ignored: {e}")
                db.rollback()
                return None
            except Exception as e:
                logger.error(f"Error storing odds snapshot: {e}")
                db.rollback()
                return None
    
    async def store_multiple_snapshots(self, odds_list: List[Dict]) -> Tuple[int, int]:
        """
        Store multiple odds snapshots efficiently.
        
        Returns:
            Tuple of (successful_count, failed_count)
        """
        await self.initialize()
        
        successful = 0
        failed = 0
        
        # Group by prop_id for efficient best line updates
        prop_groups = {}
        for odds_data in odds_list:
            prop_id = odds_data['prop_id']
            if prop_id not in prop_groups:
                prop_groups[prop_id] = []
            prop_groups[prop_id].append(odds_data)
        
        async with get_db() as db:
            try:
                for prop_id, prop_odds in prop_groups.items():
                    for odds_data in prop_odds:
                        try:
                            result = await self.store_odds_snapshot(odds_data)
                            if result:
                                successful += 1
                            else:
                                failed += 1
                        except Exception as e:
                            logger.error(f"Error in batch storage: {e}")
                            failed += 1
                
                logger.info(f"Batch storage complete: {successful} successful, {failed} failed")
                return successful, failed
                
            except Exception as e:
                logger.error(f"Error in batch odds storage: {e}")
                return successful, len(odds_list) - successful
    
    # Best Line Detection
    
    async def get_best_odds(self, prop_id: str) -> Optional[Dict]:
        """Get current best odds for a specific prop."""
        async with get_db() as db:
            aggregate = db.query(BestLineAggregate).filter(
                BestLineAggregate.prop_id == prop_id
            ).first()
            
            if not aggregate:
                # Calculate on-the-fly if no aggregate exists
                return await self._calculate_best_odds_live(db, prop_id)
            
            # Check if data is stale (older than cache timeout)
            if self._is_stale(aggregate.last_updated):
                logger.debug(f"Best line data stale for {prop_id}, recalculating...")
                return await self._calculate_best_odds_live(db, prop_id)
            
            return self._aggregate_to_dict(aggregate)
    
    async def get_best_odds_multiple(self, prop_ids: List[str]) -> Dict[str, Dict]:
        """Get best odds for multiple props efficiently."""
        async with get_db() as db:
            aggregates = db.query(BestLineAggregate).filter(
                BestLineAggregate.prop_id.in_(prop_ids)
            ).all()
            
            result = {}
            found_props = set()
            
            # Process existing aggregates
            for aggregate in aggregates:
                if not self._is_stale(aggregate.last_updated):
                    result[aggregate.prop_id] = self._aggregate_to_dict(aggregate)
                    found_props.add(aggregate.prop_id)
            
            # Calculate missing or stale props
            missing_props = set(prop_ids) - found_props
            for prop_id in missing_props:
                best_odds = await self._calculate_best_odds_live(db, prop_id)
                if best_odds:
                    result[prop_id] = best_odds
            
            return result
    
    async def _calculate_best_odds_live(self, db: Session, prop_id: str) -> Optional[Dict]:
        """Calculate best odds in real-time from current snapshots."""
        # Get recent snapshots for this prop
        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=1)
        
        snapshots = db.query(OddsSnapshot).options(
            joinedload(OddsSnapshot.bookmaker)
        ).filter(
            and_(
                OddsSnapshot.prop_id == prop_id,
                OddsSnapshot.is_available == True,
                OddsSnapshot.captured_at > cutoff_time
            )
        ).order_by(desc(OddsSnapshot.captured_at)).all()
        
        if not snapshots:
            return None
        
        # Use BestLineCalculator to find best odds
        best_data = BestLineCalculator.find_best_odds(snapshots)
        if not best_data:
            return None
        
        # Store/update aggregate for future queries
        await self._update_best_line_aggregate(db, prop_id, best_data)
        
        return best_data
    
    async def _update_best_line_aggregate(self, db: Session, prop_id: str, 
                                        best_data: Optional[Dict] = None) -> bool:
        """Update the best line aggregate for a prop."""
        try:
            if not best_data:
                # Calculate best data from current snapshots
                cutoff_time = datetime.now(timezone.utc) - timedelta(hours=1)
                snapshots = db.query(OddsSnapshot).options(
                    joinedload(OddsSnapshot.bookmaker)
                ).filter(
                    and_(
                        OddsSnapshot.prop_id == prop_id,
                        OddsSnapshot.is_available == True,
                        OddsSnapshot.captured_at > cutoff_time
                    )
                ).all()
                
                if not snapshots:
                    return False
                
                best_data = BestLineCalculator.find_best_odds(snapshots)
                if not best_data:
                    return False
            
            # Get or create aggregate record
            aggregate = db.query(BestLineAggregate).filter(
                BestLineAggregate.prop_id == prop_id
            ).first()
            
            if not aggregate:
                # Get sport from first snapshot
                first_snapshot = db.query(OddsSnapshot).filter(
                    OddsSnapshot.prop_id == prop_id
                ).first()
                sport = first_snapshot.sport if first_snapshot else 'Unknown'
                
                aggregate = BestLineAggregate(prop_id=prop_id, sport=sport)
                db.add(aggregate)
            
            # Update aggregate data
            aggregate.best_over_odds = best_data.get('best_over_odds')
            aggregate.best_over_bookmaker_id = best_data.get('best_over_bookmaker').id if best_data.get('best_over_bookmaker') else None
            aggregate.best_under_odds = best_data.get('best_under_odds')
            aggregate.best_under_bookmaker_id = best_data.get('best_under_bookmaker').id if best_data.get('best_under_bookmaker') else None
            aggregate.consensus_line = best_data.get('consensus_line')
            aggregate.consensus_over_prob = best_data.get('consensus_over_prob')
            aggregate.consensus_under_prob = best_data.get('consensus_under_prob')
            aggregate.num_bookmakers = best_data.get('num_bookmakers', 0)
            aggregate.line_spread = best_data.get('line_spread', 0.0)
            
            # Check for arbitrage
            if aggregate.best_over_odds and aggregate.best_under_odds:
                has_arb, profit_pct = BestLineCalculator.detect_arbitrage(
                    aggregate.best_over_odds, aggregate.best_under_odds
                )
                aggregate.arbitrage_opportunity = has_arb
                aggregate.arbitrage_profit_pct = profit_pct if has_arb else None
            
            aggregate.last_updated = datetime.now(timezone.utc)
            aggregate.data_age_minutes = 0
            
            return True
            
        except Exception as e:
            logger.error(f"Error updating best line aggregate for {prop_id}: {e}")
            return False
    
    # Line Movement Tracking
    
    async def _track_line_movement(self, db: Session, snapshot: OddsSnapshot) -> bool:
        """Track line movement for the new snapshot."""
        try:
            # Find previous snapshot for same prop/bookmaker
            previous = db.query(OddsSnapshot).filter(
                and_(
                    OddsSnapshot.prop_id == snapshot.prop_id,
                    OddsSnapshot.bookmaker_id == snapshot.bookmaker_id,
                    OddsSnapshot.captured_at < snapshot.captured_at
                )
            ).order_by(desc(OddsSnapshot.captured_at)).first()
            
            if not previous:
                return True  # No previous data to compare
            
            # Calculate movements
            line_movement = None
            odds_movement_over = None
            odds_movement_under = None
            
            if previous.line is not None and snapshot.line is not None:
                line_movement = snapshot.line - previous.line
            
            if previous.over_odds is not None and snapshot.over_odds is not None:
                odds_movement_over = snapshot.over_odds - previous.over_odds
            
            if previous.under_odds is not None and snapshot.under_odds is not None:
                odds_movement_under = snapshot.under_odds - previous.under_odds
            
            # Calculate movement magnitude and direction
            movement_magnitude = abs(line_movement) if line_movement else 0.0
            movement_direction = 'STABLE'
            if line_movement and abs(line_movement) >= 0.1:  # Minimum significant movement
                movement_direction = 'UP' if line_movement > 0 else 'DOWN'
            
            is_significant = movement_magnitude >= self._movement_threshold
            
            # Detect steam moves (simultaneous moves across books)
            is_steam, steam_confidence, concurrent_moves = await self._detect_steam_move(
                db, snapshot.prop_id, movement_magnitude, snapshot.captured_at
            )
            
            # Create history record
            history = OddsHistory(
                snapshot_id=snapshot.id,
                prop_id=snapshot.prop_id,
                bookmaker_id=snapshot.bookmaker_id,
                line_movement=line_movement,
                odds_movement_over=odds_movement_over,
                odds_movement_under=odds_movement_under,
                movement_magnitude=movement_magnitude,
                movement_direction=movement_direction,
                is_significant_movement=is_significant,
                is_steam_move=is_steam,
                steam_confidence=steam_confidence,
                concurrent_book_moves=concurrent_moves
            )
            
            db.add(history)
            
            if is_significant:
                logger.info(f"📈 Significant movement detected: {snapshot.prop_id} "
                          f"moved {line_movement:.1f} @ {snapshot.bookmaker.name}")
            
            if is_steam:
                logger.info(f"🔥 Steam move detected: {snapshot.prop_id} "
                          f"({concurrent_moves} books, {steam_confidence:.1f} confidence)")
            
            return True
            
        except Exception as e:
            logger.error(f"Error tracking line movement: {e}")
            return False
    
    async def _detect_steam_move(self, db: Session, prop_id: str, 
                               movement_magnitude: float, timestamp: datetime) -> Tuple[bool, float, int]:
        """Detect if this movement is part of a steam move across multiple books."""
        try:
            # Look for similar movements in other books within the last 15 minutes
            window_start = timestamp - timedelta(minutes=15)
            
            recent_history = db.query(OddsHistory).filter(
                and_(
                    OddsHistory.prop_id == prop_id,
                    OddsHistory.recorded_at > window_start,
                    OddsHistory.movement_magnitude >= self._steam_threshold
                )
            ).all()
            
            if len(recent_history) < 2:  # Need at least 2 books for steam
                return False, 0.0, 0
            
            # Calculate steam confidence based on:
            # 1. Number of books moving
            # 2. Similarity of movement magnitude
            # 3. Time proximity
            
            concurrent_moves = len(recent_history)
            avg_magnitude = sum(h.movement_magnitude for h in recent_history) / concurrent_moves
            magnitude_variance = sum((h.movement_magnitude - avg_magnitude) ** 2 for h in recent_history) / concurrent_moves
            
            # Steam confidence calculation (0-1)
            book_factor = min(concurrent_moves / 5.0, 1.0)  # More books = higher confidence
            similarity_factor = max(0.0, 1.0 - (magnitude_variance / avg_magnitude))  # Less variance = higher confidence
            
            steam_confidence = (book_factor + similarity_factor) / 2.0
            
            is_steam = steam_confidence >= 0.6 and concurrent_moves >= 3
            
            return is_steam, steam_confidence, concurrent_moves
            
        except Exception as e:
            logger.error(f"Error detecting steam move: {e}")
            return False, 0.0, 0
    
    async def get_line_movement_history(self, prop_id: str, hours: int = 24) -> List[Dict]:
        """Get line movement history for a prop over specified time period."""
        async with get_db() as db:
            cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours)
            
            history = db.query(OddsHistory).options(
                joinedload(OddsHistory.bookmaker)
            ).filter(
                and_(
                    OddsHistory.prop_id == prop_id,
                    OddsHistory.recorded_at > cutoff_time
                )
            ).order_by(desc(OddsHistory.recorded_at)).all()
            
            return [self._history_to_dict(h) for h in history]
    
    async def get_steam_moves(self, sport: str = None, hours: int = 6) -> List[Dict]:
        """Get recent steam moves, optionally filtered by sport."""
        async with get_db() as db:
            cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours)
            
            query = db.query(OddsHistory).options(
                joinedload(OddsHistory.bookmaker)
            ).filter(
                and_(
                    OddsHistory.is_steam_move == True,
                    OddsHistory.recorded_at > cutoff_time
                )
            )
            
            if sport:
                # Join with snapshot to filter by sport
                query = query.join(OddsSnapshot).filter(
                    OddsSnapshot.sport == sport
                )
            
            steam_moves = query.order_by(
                desc(OddsHistory.steam_confidence),
                desc(OddsHistory.recorded_at)
            ).limit(50).all()
            
            return [self._history_to_dict(h) for h in steam_moves]
    
    # Arbitrage Detection
    
    async def find_arbitrage_opportunities(self, sport: str = None, 
                                         min_profit: float = 1.0) -> List[Dict]:
        """Find current arbitrage opportunities across all props."""
        async with get_db() as db:
            query = db.query(BestLineAggregate).options(
                joinedload(BestLineAggregate.best_over_bookmaker),
                joinedload(BestLineAggregate.best_under_bookmaker)
            ).filter(
                and_(
                    BestLineAggregate.arbitrage_opportunity == True,
                    BestLineAggregate.arbitrage_profit_pct >= min_profit,
                    BestLineAggregate.last_updated > datetime.now(timezone.utc) - timedelta(hours=1)
                )
            )
            
            if sport:
                query = query.filter(BestLineAggregate.sport == sport)
            
            opportunities = query.order_by(
                desc(BestLineAggregate.arbitrage_profit_pct)
            ).limit(20).all()
            
            return [self._aggregate_to_dict(agg) for agg in opportunities]
    
    # Utility Methods
    
    def _is_stale(self, timestamp: datetime, timeout_minutes: int = None) -> bool:
        """Check if timestamp is considered stale."""
        if not timestamp:
            return True
            
        timeout = timeout_minutes or (self._cache_timeout / 60)
        return (datetime.now(timezone.utc) - timestamp).total_seconds() > (timeout * 60)
    
    def _bookmaker_to_dict(self, bookmaker: Bookmaker) -> Dict:
        """Convert bookmaker model to dictionary."""
        return {
            'id': bookmaker.id,
            'name': bookmaker.name,
            'display_name': bookmaker.display_name,
            'short_name': bookmaker.short_name,
            'website_url': bookmaker.website_url,
            'status': bookmaker.status.value if hasattr(bookmaker.status, 'value') else bookmaker.status,
            'is_trusted': bookmaker.is_trusted,
            'reliability_score': bookmaker.reliability_score,
            'priority_weight': bookmaker.priority_weight,
            'last_successful_fetch': bookmaker.last_successful_fetch.isoformat() if bookmaker.last_successful_fetch else None,
            'consecutive_failures': bookmaker.consecutive_failures
        }
    
    def _aggregate_to_dict(self, aggregate: BestLineAggregate) -> Dict:
        """Convert best line aggregate to dictionary."""
        return {
            'prop_id': aggregate.prop_id,
            'sport': aggregate.sport,
            'best_over_odds': aggregate.best_over_odds,
            'best_over_bookmaker': aggregate.best_over_bookmaker.display_name if aggregate.best_over_bookmaker else None,
            'best_under_odds': aggregate.best_under_odds,
            'best_under_bookmaker': aggregate.best_under_bookmaker.display_name if aggregate.best_under_bookmaker else None,
            'consensus_line': aggregate.consensus_line,
            'consensus_over_prob': aggregate.consensus_over_prob,
            'consensus_under_prob': aggregate.consensus_under_prob,
            'num_bookmakers': aggregate.num_bookmakers,
            'line_spread': aggregate.line_spread,
            'arbitrage_opportunity': aggregate.arbitrage_opportunity,
            'arbitrage_profit_pct': aggregate.arbitrage_profit_pct,
            'last_updated': aggregate.last_updated.isoformat() if aggregate.last_updated else None,
            'data_age_minutes': aggregate.data_age_minutes
        }
    
    def _history_to_dict(self, history: OddsHistory) -> Dict:
        """Convert odds history to dictionary."""
        return {
            'id': history.id,
            'prop_id': history.prop_id,
            'bookmaker': history.bookmaker.display_name if history.bookmaker else None,
            'line_movement': history.line_movement,
            'odds_movement_over': history.odds_movement_over,
            'odds_movement_under': history.odds_movement_under,
            'movement_magnitude': history.movement_magnitude,
            'movement_direction': history.movement_direction,
            'is_significant_movement': history.is_significant_movement,
            'is_steam_move': history.is_steam_move,
            'steam_confidence': history.steam_confidence,
            'concurrent_book_moves': history.concurrent_book_moves,
            'recorded_at': history.recorded_at.isoformat() if history.recorded_at else None
        }
    
    # Cleanup Methods
    
    async def cleanup_old_snapshots(self, days: int = 7) -> int:
        """Remove odds snapshots older than specified days."""
        async with get_db() as db:
            cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
            
            count = db.query(OddsSnapshot).filter(
                OddsSnapshot.captured_at < cutoff_date
            ).count()
            
            db.query(OddsSnapshot).filter(
                OddsSnapshot.captured_at < cutoff_date
            ).delete()
            
            db.commit()
            logger.info(f"🧹 Cleaned up {count} old odds snapshots (>{days} days)")
            return count
    
    async def cleanup_old_history(self, days: int = 30) -> int:
        """Remove odds history older than specified days."""
        async with get_db() as db:
            cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
            
            count = db.query(OddsHistory).filter(
                OddsHistory.recorded_at < cutoff_date
            ).count()
            
            db.query(OddsHistory).filter(
                OddsHistory.recorded_at < cutoff_date
            ).delete()
            
            db.commit()
            logger.info(f"🧹 Cleaned up {count} old history records (>{days} days)")
            return count


# Global service instance
odds_storage_service = OddsStorageService()


# Example usage for testing
async def test_odds_storage():
    """Test the odds storage service functionality."""
    service = OddsStorageService()
    await service.initialize()
    
    # Test storing sample odds
    sample_odds = {
        'prop_id': 'nba_lebron_points_20250819',
        'sport': 'NBA',
        'market_type': 'Points',
        'player_name': 'LeBron James',
        'bookmaker': 'draftkings',
        'line': 25.5,
        'over_odds': -110,
        'under_odds': -110,
        'is_available': True
    }
    
    snapshot_id = await service.store_odds_snapshot(sample_odds)
    print(f"✅ Stored snapshot ID: {snapshot_id}")
    
    # Test best odds retrieval
    best_odds = await service.get_best_odds('nba_lebron_points_20250819')
    print(f"✅ Best odds: {best_odds}")
    
    # Test bookmaker retrieval
    bookmakers = await service.get_active_bookmakers()
    print(f"✅ Found {len(bookmakers)} active bookmakers")


if __name__ == "__main__":
    asyncio.run(test_odds_storage())