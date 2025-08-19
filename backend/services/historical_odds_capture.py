"""
Historical Odds Capture Service
Implements background job to snapshot odds for line movement tracking
"""

import asyncio
import logging
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
import json

try:
    from backend.services.unified_config import get_config
    from backend.services.odds_aggregation_service import OddsAggregationService
    from backend.services.unified_cache_service import unified_cache_service
    from backend.services.unified_logging import unified_logging
except ImportError:
    # Fallback imports for development
    logging.basicConfig(level=logging.INFO)

@dataclass
class OddsSnapshot:
    """Data structure for odds snapshot"""
    prop_id: str
    sportsbook: str
    sport: str
    line: Optional[float]
    over_odds: Optional[int]
    under_odds: Optional[int]
    captured_at: datetime
    source_timestamp: Optional[datetime] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'prop_id': self.prop_id,
            'sportsbook': self.sportsbook,
            'sport': self.sport,
            'line': self.line,
            'over_odds': self.over_odds,
            'under_odds': self.under_odds,
            'captured_at': self.captured_at.isoformat(),
            'source_timestamp': self.source_timestamp.isoformat() if self.source_timestamp else None,
            'implied_over': self._calculate_implied_probability(self.over_odds),
            'implied_under': self._calculate_implied_probability(self.under_odds)
        }
    
    def _calculate_implied_probability(self, american_odds: Optional[int]) -> Optional[float]:
        """Convert American odds to implied probability"""
        if american_odds is None:
            return None
        
        if american_odds > 0:
            return 100 / (american_odds + 100)
        else:
            return abs(american_odds) / (abs(american_odds) + 100)

class HistoricalOddsCapture:
    """Service for capturing and storing historical odds data"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.config = self._get_config()
        self.odds_service = OddsAggregationService()
        self.is_running = False
        self.capture_task = None
        
        # Configuration
        self.capture_interval = self.config.get('odds_capture_interval_seconds', 300)  # 5 minutes
        self.supported_sports = self.config.get('supported_sports', ['MLB', 'NBA', 'NFL'])
        self.retention_days = self.config.get('odds_retention_days', 30)
        
        # Storage (in production this would be database)
        self.snapshots_storage = []  # Temporary in-memory storage
        
    def _get_config(self):
        """Get configuration with fallbacks"""
        try:
            config = get_config()
            return {
                'odds_capture_interval_seconds': 300,  # 5 minutes
                'supported_sports': ['MLB', 'NBA', 'NFL', 'NHL'],
                'odds_retention_days': 30,
                'max_snapshots_per_sport': 1000  # Per capture cycle
            }
        except:
            return {
                'odds_capture_interval_seconds': 300,
                'supported_sports': ['MLB', 'NBA'],
                'odds_retention_days': 30,
                'max_snapshots_per_sport': 500
            }
    
    async def start_capture(self):
        """Start the background odds capture process"""
        if self.is_running:
            self.logger.warning("Odds capture already running")
            return
        
        self.is_running = True
        self.capture_task = asyncio.create_task(self._capture_loop())
        self.logger.info(f"Started historical odds capture (interval: {self.capture_interval}s)")
    
    async def stop_capture(self):
        """Stop the background odds capture process"""
        self.is_running = False
        if self.capture_task:
            self.capture_task.cancel()
            try:
                await self.capture_task
            except asyncio.CancelledError:
                pass
        self.logger.info("Stopped historical odds capture")
    
    async def _capture_loop(self):
        """Main capture loop"""
        while self.is_running:
            try:
                capture_start = datetime.now(timezone.utc)
                
                # Capture odds for all supported sports
                total_snapshots = 0
                for sport in self.supported_sports:
                    sport_snapshots = await self._capture_sport_odds(sport)
                    total_snapshots += len(sport_snapshots)
                    
                    # Store snapshots
                    await self._store_snapshots(sport_snapshots)
                
                capture_duration = (datetime.now(timezone.utc) - capture_start).total_seconds()
                
                self.logger.info(
                    f"Odds capture completed: {total_snapshots} snapshots in {capture_duration:.2f}s"
                )
                
                # Clean up old data periodically
                if capture_start.minute % 30 == 0:  # Every 30 minutes
                    await self._cleanup_old_snapshots()
                
                # Wait for next interval
                await asyncio.sleep(self.capture_interval)
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                self.logger.error(f"Error in odds capture loop: {e}")
                await asyncio.sleep(60)  # Wait before retry
    
    async def _capture_sport_odds(self, sport: str) -> List[OddsSnapshot]:
        """Capture odds for a specific sport"""
        snapshots = []
        capture_time = datetime.now(timezone.utc)
        
        try:
            # Get current odds from aggregation service
            sport_key = self._map_sport_to_api_key(sport)
            odds_data = await self.odds_service.fetch_player_props(sport_key)
            
            for line_data in odds_data:
                # Create prop_id (composite key)
                prop_id = self._generate_prop_id(line_data, sport)
                
                snapshot = OddsSnapshot(
                    prop_id=prop_id,
                    sportsbook=line_data.book_name,
                    sport=sport,
                    line=line_data.line,
                    over_odds=line_data.over_price,
                    under_odds=line_data.under_price,
                    captured_at=capture_time,
                    source_timestamp=getattr(line_data, 'timestamp', None)
                )
                
                snapshots.append(snapshot)
            
            self.logger.debug(f"Captured {len(snapshots)} odds for {sport}")
            
        except Exception as e:
            self.logger.error(f"Error capturing odds for {sport}: {e}")
        
        return snapshots
    
    def _map_sport_to_api_key(self, sport: str) -> str:
        """Map sport to API key format"""
        mapping = {
            'MLB': 'baseball_mlb',
            'NBA': 'basketball_nba', 
            'NFL': 'americanfootball_nfl',
            'NHL': 'icehockey_nhl'
        }
        return mapping.get(sport, sport.lower())
    
    def _generate_prop_id(self, line_data, sport: str) -> str:
        """Generate consistent prop_id for tracking"""
        # Format: sport:player:stat_type:line
        player = getattr(line_data, 'player_name', 'unknown').replace(' ', '_').lower()
        stat_type = getattr(line_data, 'stat_type', 'unknown').lower()
        line_val = getattr(line_data, 'line', 0)
        
        return f"{sport.lower()}:{player}:{stat_type}:{line_val}"
    
    async def _store_snapshots(self, snapshots: List[OddsSnapshot]):
        """Store snapshots (database in production)"""
        if not snapshots:
            return
        
        # In production, this would be database inserts
        # For now, store in memory and cache
        for snapshot in snapshots:
            self.snapshots_storage.append(snapshot)
            
            # Cache recent snapshots for quick access
            cache_key = f"odds_snapshot:{snapshot.prop_id}:{snapshot.sportsbook}"
            await self._cache_snapshot(cache_key, snapshot.to_dict())
    
    async def _cache_snapshot(self, key: str, data: Dict[str, Any]):
        """Cache snapshot data"""
        try:
            if hasattr(unified_cache_service, 'set'):
                unified_cache_service.set(key, data, ttl=3600)  # 1 hour TTL
        except Exception as e:
            self.logger.warning(f"Failed to cache snapshot {key}: {e}")
    
    async def _cleanup_old_snapshots(self):
        """Clean up snapshots older than retention period"""
        cutoff_time = datetime.now(timezone.utc) - timedelta(days=self.retention_days)
        
        # In-memory cleanup (temporary)
        initial_count = len(self.snapshots_storage)
        self.snapshots_storage = [
            s for s in self.snapshots_storage 
            if s.captured_at > cutoff_time
        ]
        
        removed_count = initial_count - len(self.snapshots_storage)
        if removed_count > 0:
            self.logger.info(f"Cleaned up {removed_count} old snapshots")
    
    async def get_historical_odds(
        self, 
        prop_id: str, 
        hours_back: int = 24,
        sportsbook: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Retrieve historical odds for analysis"""
        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours_back)
        
        # Filter snapshots
        filtered_snapshots = [
            s for s in self.snapshots_storage
            if (s.prop_id == prop_id and 
                s.captured_at > cutoff_time and
                (sportsbook is None or s.sportsbook == sportsbook))
        ]
        
        # Sort by timestamp
        filtered_snapshots.sort(key=lambda x: x.captured_at)
        
        return [s.to_dict() for s in filtered_snapshots]
    
    async def get_line_movement_summary(self, prop_id: str, sportsbook: str) -> Dict[str, Any]:
        """Calculate line movement summary for a prop"""
        snapshots = await self.get_historical_odds(prop_id, hours_back=24, sportsbook=sportsbook)
        
        if len(snapshots) < 2:
            return {'error': 'Insufficient data for movement calculation'}
        
        # Calculate movements
        first_snapshot = snapshots[0]
        latest_snapshot = snapshots[-1]
        
        line_movement = None
        if first_snapshot['line'] and latest_snapshot['line']:
            line_movement = latest_snapshot['line'] - first_snapshot['line']
        
        odds_movement_over = None
        if first_snapshot['over_odds'] and latest_snapshot['over_odds']:
            odds_movement_over = latest_snapshot['over_odds'] - first_snapshot['over_odds']
        
        return {
            'prop_id': prop_id,
            'sportsbook': sportsbook,
            'snapshots_count': len(snapshots),
            'time_range_hours': 24,
            'line_movement': line_movement,
            'odds_movement_over': odds_movement_over,
            'first_capture': first_snapshot['captured_at'],
            'latest_capture': latest_snapshot['captured_at'],
            'opening_line': first_snapshot['line'],
            'current_line': latest_snapshot['line'],
            'opening_over_odds': first_snapshot['over_odds'],
            'current_over_odds': latest_snapshot['over_odds']
        }
    
    def get_status(self) -> Dict[str, Any]:
        """Get capture service status"""
        return {
            'is_running': self.is_running,
            'capture_interval': self.capture_interval,
            'supported_sports': self.supported_sports,
            'total_snapshots': len(self.snapshots_storage),
            'retention_days': self.retention_days,
            'last_capture': max(
                (s.captured_at for s in self.snapshots_storage), 
                default=None
            )
        }

# Global service instance
historical_odds_capture = HistoricalOddsCapture()

# Service management functions
async def start_historical_capture():
    """Start the historical odds capture service"""
    await historical_odds_capture.start_capture()

async def stop_historical_capture():
    """Stop the historical odds capture service"""
    await historical_odds_capture.stop_capture()

def get_capture_service() -> HistoricalOddsCapture:
    """Get the historical odds capture service instance"""
    return historical_odds_capture